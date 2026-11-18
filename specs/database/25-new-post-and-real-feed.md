# SPEC 25 — Publicar desde "Nueva publicación" y feed real del equipo y del familiar

> **Estado:** Implementado
> **Depende de:** SPEC 06, SPEC 15, SPEC 18, SPEC 22
> **Fecha:** 2026-11-17
> **Objetivo:** Guardar de verdad las publicaciones del modal "Nueva publicación" (con título opcional, fotos comprimidas, filtro por rol y avisos de consentimiento) y mostrarlas en los feeds reales de `/` y `/family`, agrupadas por día y con carrusel de fotos.

---

## Por qué esta spec

SPEC 06 dejó el modal validando en el cliente sin persistir, y SPEC 22 creó las tablas, el bucket `post-photos` y la regla `can_view_post()`. Los feeds de `/` y `/family` siguen con mock, así que un post guardado no se vería en ningún lado. Decisión del usuario: publicar y leer en una sola spec, aunque toca cinco áreas (modal, fotos, DB, feed del equipo y feed del familiar).

Resuelve del BACKLOG (parcialmente, ver "Entradas de BACKLOG"):

- "Conectar las pantallas del familiar a Supabase": la parte de posts del feed.
- "Chips con un solo adulto mayor": la parte del feed.
- "Borrar los archivos de Storage al borrar un post o una foto": el mecanismo (borrar `{post_id}/` y después el post) se implementa para deshacer una publicación fallida.

SPEC 24 queda reservada para "Verificar 'vincular adulto mayor' para un familiar que ya tiene cuenta" (ver SPEC 22, "Specs siguientes").

---

## Alcance

**Dentro:**

- **Migración** `supabase/migrations/<version>_create_post_functions.sql`:
  - RPC `create_post(...)`: crea el post y sus etiquetas en una sola transacción (`SECURITY INVOKER`, pasa por la RLS).
  - Helper `room_has_elderly_without_photo_consent(p_room_id)`: `true/false` según haya adultos mayores activos sin consentimiento de fotos en una habitación donde el usuario puede publicar (`SECURITY DEFINER`).
  - RPC `visible_post_days(p_before, p_limit)`: días (hora de Lima) con posts visibles, para "Cargar más" (`SECURITY INVOKER`).
  - Límites del bucket `post-photos`: `file_size_limit = 204800` (200 KB) y `allowed_mime_types = {'image/webp'}`.
- **Modal "Nueva publicación"**:
  - Opciones reales por rol. Admin: todos los adultos mayores `active` de su guardería, todas sus habitaciones y "Toda la guardería". Staff: sus asignados `active`, las habitaciones donde tiene alguno y sin "Toda la guardería".
  - Consentimiento de fotos:
    - Ícono de cámara tachada en la chip de cada adulto mayor sin consentimiento y una leyenda bajo las chips.
    - Error que bloquea si hay fotos y algún etiquetado no tiene consentimiento.
    - Aviso genérico que no bloquea en "Toda la habitación" o "Toda la guardería" con fotos, si hay alguien sin consentimiento (asignado o no al staff), sin nombres.
  - Campo **TÍTULO (opcional)**, solo con "Toda la habitación" o "Toda la guardería".
  - Compresión en el navegador con `browser-image-compression`: WebP, lado mayor de 1280 px, máximo 200 KB. La foto original puede pesar hasta 20 MB (antes, 10 MB).
  - Publicar: "Publicando…", Server Action, subida de fotos a Storage desde el navegador, registro en `post_photos`, cierre del modal y toast. Si algo falla, se deshace todo.
- **Feed del equipo (`/`)**: posts reales visibles, agrupados por día (hoy y ayer al cargar), "Cargar más", encabezado real (cantidad de adultos mayores y fecha), conteos reales de reacciones y comentarios, y carrusel de fotos.
- **Feed del familiar (`/family`)**: lo mismo, con chips reales de sus adultos mayores vinculados (ocultas si tiene uno solo), filtro por adulto mayor, autor real ("Cuidador/a Caro") y, en los posts de habitación, cuál de sus adultos mayores está en ella ("Habitación Roble · Luis").
- Pruebas SQL de las funciones con `execute_sql` en transacciones con `rollback`, `get_advisors`, prueba real en el remoto (pidiendo permiso) y capturas en `.playwright-mcp/`.
- Documentación (ver "Cambios en documentos").

**Fuera de alcance (para specs futuras):**

- Editar o borrar publicaciones y fotos desde la UI (el botón "Editar" de la tarjeta sigue yendo a `/`).
- Detalle de publicación (`detalle-publicacion.dc.html`) y visor de foto (`foto.dc.html`); las tarjetas y las fotos no enlazan.
- Reaccionar y comentar: solo se muestran los conteos.
- Notificar a las familias (`notify_on_post`) y el resumen diario (`daily_summaries`).
- "Resumen del día" y "Mi cuenta" del familiar, que siguen con mock (`mockFamily`).
- Ocultar posts o fotos según el consentimiento: la regla del feed sigue dependiendo solo de `audience`.
- Prohibir fotos en posts de habitación o guardería cuando alguien no tiene consentimiento.
- Título en posts `elderly`.
- Progreso por foto al subir, recortar o reordenar fotos.
- Tiempo real (los posts nuevos de otros aparecen al navegar o recargar).

---

## Modelo de datos

No hay tablas nuevas. Se reutilizan las de SPEC 22.

### RPC `create_post`

```sql
create function public.create_post(
  p_audience public.post_audience,
  p_room_id uuid,
  p_type public.post_type,
  p_title text,
  p_body text,
  p_elderly_ids uuid[]
) returns uuid
language plpgsql
security invoker
set search_path = ''
```

- Inserta en `posts` (`author_id = auth.uid()`) y una fila en `post_elderly` por cada id. Devuelve el `id` del post.
- `SECURITY INVOKER`: aplican `posts_insert_team` y `post_elderly_insert_author`, y el trigger diferido `posts_require_elderly_tag` se valida al terminar la llamada. Si falla cualquier parte, no se guarda nada.
- `EXECUTE` solo para `authenticated`.

### RPC `room_has_elderly_without_photo_consent`

```sql
create function public.room_has_elderly_without_photo_consent(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
```

- `true` si `can_post_to_room(p_room_id)` es `true` y en esa habitación hay algún adulto mayor `active` con `photo_consent = false`, asignado o no al usuario.
- `false` en cualquier otro caso: habitación donde no puede publicar, de otra guardería o inexistente, o usuario relative, `pending` o `archived`.
- Cumple la regla 7 del esquema: solo devuelve `true/false`, nunca nombres ni filas de adultos mayores que el usuario no ve por RLS.
- `EXECUTE` solo para `authenticated`.
- `getNewPostOptions()` la llama una vez por cada habitación de las opciones. Para "Toda la guardería" (solo admin), el aviso se muestra si alguna habitación da `true`: todo adulto mayor tiene habitación y el admin puede publicar en todas.

### RPC `visible_post_days`

```sql
create function public.visible_post_days(p_before date, p_limit int)
returns setof date
language sql
stable
security invoker
set search_path = ''
```

- Fechas distintas `(published_at at time zone 'America/Lima')::date` de los posts que el usuario puede ver (RLS), anteriores a `p_before`, de la más nueva a la más vieja, con `limit p_limit`.
- `EXECUTE` solo para `authenticated`.

### Bucket `post-photos`

```sql
update storage.buckets
set file_size_limit = 204800, allowed_mime_types = array['image/webp']
where id = 'post-photos';
```

Ruta de cada archivo: `{post_id}/{position}.webp` (`position` de 0 a 4).

### Tipos de la app

```ts
// feed/types.ts (cambios)
export type AudienceElderlyOption = {
  id: string;
  firstName: string;
  initial: string;
  tone: AvatarTone;
  photoConsent: boolean; // nuevo
};

export type NewPostOptions = {
  elderly: AudienceElderlyOption[];
  rooms: RoomOption[];
  canPostToDaycare: boolean; // nuevo: solo admin
  roomsWithoutPhotoConsent: string[]; // nuevo: ids de habitación con room_has_elderly_without_photo_consent = true
};

export type NewPostInput = {
  audience: AudienceSelection;
  type: string;
  title: string; // nuevo: solo cuenta con room o daycare
  body: string;
  photoCount: number; // nuevo
};

export type NewPostField = "audience" | "type" | "title" | "body" | "photos";

export type CompressedPhoto = { blob: Blob; width: number; height: number };

export type FeedPhoto = { url: string; width: number | null; height: number | null }; // url firmada

export type FeedPost = {
  // ...campos actuales, sin photoCaption
  photos: FeedPhoto[];
};

export type FeedDay<TPost> = {
  date: string;  // "aaaa-mm-dd" (Lima)
  label: string; // ver "Etiquetas de día"
  posts: TPost[];
};

export type FeedPage<TPost> = {
  days: FeedDay<TPost>[];
  hasMore: boolean;
};
```

```ts
// family/types.ts (cambios)
export type FamilyPost = {
  // ...campos actuales, sin photoCaption
  audience: PostAudience;  // nuevo
  roomId: string | null;   // nuevo: para el filtro
  roomElderlyNames: string[]; // nuevo: solo en room; nombres de pila de sus vinculados en esa habitación
  photos: FeedPhoto[];
};

export type FamilyFeedElderly = Pick<FamilyElderly, "id" | "firstName" | "initial" | "tone"> & {
  roomId: string;
};
```

`ElderlyFilterChips` pasa a recibir `Pick<FamilyElderly, "id" | "firstName" | "initial" | "tone">[]`.

### Server Actions (`feed/actions/`)

| Acción | Qué hace | Devuelve |
| --- | --- | --- |
| `createPost(input)` | Usuario `staff` o `admin` activo. Lee las opciones con `getNewPostOptions()` y valida con `validateNewPost` (las mismas reglas que el cliente). Arma `audience`, `room_id`, `title` (solo `room`/`daycare`; vacío → `null`) y `elderly_ids` en el servidor. Rechaza `elderly` + fotos con algún etiquetado sin consentimiento. Llama a `create_post`. Si `photoCount = 0`, `refresh()`. | `{ status: "ok"; postId }` \| `{ status: "invalid"; errors }` \| `{ status: "error" }` |
| `attachPostPhotos(postId, photos)` | `isUuid(postId)`, 1 a 5 fotos, cada `path` es `{postId}/{position}.webp` y `width`/`height` > 0. Inserta en `post_photos` con la sesión. `refresh()`. | `{ status: "ok" }` \| `{ status: "error" }` |
| `discardPost(postId)` | Lista y borra los archivos de `post-photos/{postId}/` y después borra el post, con la sesión (la RLS exige que sea el autor). | `{ status: "ok" }` \| `{ status: "error" }` |
| `loadMoreTeamFeed(before)` | `before` con formato `aaaa-mm-dd`. Trae los 2 días siguientes con posts. | `FeedPage<FeedPost>` |

`family/actions/load-more-family-feed.ts` → `loadMoreFamilyFeed(before)`: igual, con `FeedPage<FamilyPost>`.

Ninguna usa `service_role`.

### Lectura del feed (`feed/fetch-feed-page.ts`, `server-only`)

`fetchFeedPage({ from, to })`: con la sesión, trae los posts visibles con `published_at` entre el inicio del día `from` y el fin del día `to` (hora de Lima, UTC−5), con sus etiquetas, fotos, autor (`users`: `first_name`, `role`), habitación y conteos (`reactions(count)`, `comments(count)`). Firma las fotos con `createSignedUrls(paths, 3600)`.

- **Carga inicial:** `from` = ayer, `to` = hoy. "Hoy" y "Ayer" se muestran siempre, aunque estén vacíos.
- **"Cargar más":** `visible_post_days(díaMásViejoCargado, 3)`. Si devuelve 3 días, `hasMore = true` y se usan los 2 primeros. Si devuelve menos, se usan los que haya y `hasMore = false`.
- En la carga inicial, `hasMore` = `visible_post_days(ayer, 1)` no vacío.

Los nombres de etiquetados que el usuario no puede leer por RLS (por ejemplo, un adulto mayor no asignado al staff) no aparecen en el encabezado ni en "Para:".

### Encabezado de la tarjeta

| Audiencia | Con título | Sin título |
| --- | --- | --- |
| `elderly` | — (no lleva título) | Nombres de los etiquetados visibles, sin tratamiento: "Luis, Jorge" |
| `room` | `title` | "Habitación Roble" |
| `daycare` | `title` | "Toda la guardería" |

Avatar: inicial y tono del primer etiquetado en `elderly`; ícono del tipo en `room` y `daycare` (como hoy).

**Habitación en el feed del familiar:** en un post `room`, la tarjeta de `/family` agrega una línea entre el encabezado y el texto, con el estilo de "Para:" del feed del equipo (12.5px, `text-muted`): "Habitación Roble · Luis" o, con varios, "Habitación Roble · Luis y Carmen" (`Intl.ListFormat`). Lista a todos los adultos mayores vinculados del familiar que están en esa habitación, sin importar el filtro elegido, y aparece aunque tenga un solo vinculado. Los nombres salen de sus vínculos (`guardian_elderly`), no de otra consulta. Los posts `elderly` y `daycare` no llevan esta línea.

### Etiquetas de día

| Día | Feed del equipo | Feed del familiar |
| --- | --- | --- |
| hoy | "PUBLICADO HOY" | "HOY · MARTES 17 NOV" |
| ayer | "AYER" | "AYER · LUNES 16 NOV" |
| otros | "VIERNES 13 NOV" | "VIERNES 13 NOV" |

Día sin posts (solo hoy o ayer): texto "Sin publicaciones." en `text-muted`.

### Filtro del familiar

Con un adulto mayor elegido se ven los posts que lo etiquetan, los `room` de su habitación y los `daycare`. "Todos" muestra todo lo cargado. El filtro se aplica sobre los días ya cargados; un día que queda vacío con el filtro muestra "Sin publicaciones.".

### Límites (`feed/new-post-limits.ts`)

`MAX_PHOTOS = 5`, `MAX_PHOTO_BYTES = 20 * 1024 * 1024`, `MAX_BODY_LENGTH = 2000`, `MAX_TITLE_LENGTH = 120`, `MAX_UPLOAD_BYTES = 200 * 1024`, `MAX_PHOTO_SIDE = 1280`.

Compresión (`feed/compress-photo.ts`): `imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1280, fileType: "image/webp", useWebWorker: true })`. `width` y `height` se leen del resultado con `createImageBitmap`. Si el resultado pesa más de 200 KB o la imagen no se puede leer (por ejemplo, HEIC en Chrome de escritorio), es un error.

### Mensajes (`feed/new-post-messages.ts`)

| Bloque | Caso | Mensaje |
| --- | --- | --- |
| fotos | original de más de 20 MB | "Cada foto puede pesar hasta 20 MB." (reemplaza al de 10 MB) |
| fotos | `elderly` con un etiquetado sin consentimiento | "Carmen no tiene consentimiento de fotos. Quita las fotos o quita a Carmen." |
| fotos | `elderly` con varios | "Carmen y Rosa no tienen consentimiento de fotos. Quita las fotos o quítalos de la publicación." |
| fotos | no se pudo comprimir la foto N | "No pudimos procesar la foto N. Prueba con otra imagen." |
| fotos (aviso) | habitación | "En Roble hay adultos mayores sin consentimiento de fotos. Revisa que no aparezcan." |
| fotos (aviso) | guardería | "En la guardería hay adultos mayores sin consentimiento de fotos. Revisa que no aparezcan." |
| `title` | más de 120 caracteres | "El título puede tener hasta 120 caracteres." |
| toast | éxito | "Publicación creada" / "Ya está en el feed." |
| toast | error | "No pudimos publicar" / "Inténtalo de nuevo." |
| leyenda | bajo las chips | "Sin consentimiento de fotos" (con el ícono) |

Los nombres se unen con `Intl.ListFormat("es", { type: "conjunction" })`.

---

## UI

### Modal

- **Chip sin consentimiento:** `CameraOffIcon` (nuevo en `shared/components/icons/`) de 14 px en un círculo blanco de 18 px, sobre la esquina inferior derecha del avatar de la chip. La chip suma al nombre accesible ", sin consentimiento de fotos".
- **Leyenda:** bajo las chips (y bajo el select HABITACIÓN si se ve), solo si algún adulto mayor de las opciones no tiene consentimiento. Ícono + "Sin consentimiento de fotos", 12.5px, `text-muted`.
- **Error de consentimiento:** en el bloque FOTOS, con el mismo estilo y comportamiento que los demás errores de SPEC 06. Se calcula al tocar Publicar y se quita al cambiar las fotos o PARA. El foco va a la primera chip de PARA si es el primer bloque con error; si no, al botón "Agregar" (o al primer "Quitar foto").
- **Aviso de habitación o guardería:** bajo las miniaturas, visible mientras haya al menos una foto, la audiencia sea `room` (habitación en `roomsWithoutPhotoConsent`) o `daycare` (`roomsWithoutPhotoConsent` no vacío). Usa `AlertIcon`, texto 13px, fondo `#FDF3E1`, borde `#F2DDB4` y radio de 12px, con `role="status"`. No bloquea.
- **TÍTULO (opcional):** entre TIPO y DESCRIPCIÓN, solo con "Toda la habitación" o "Toda la guardería". `<input>` con el estilo de `fieldControlClassName`, `maxLength` 120 y placeholder "Ej.: Paseo al parque". Al pasar a adultos mayores se oculta y se vacía.
- **Publicando:** el botón dice "Publicando…" y queda deshabilitado. Cancelar se deshabilita, Esc no cierra y las chips, radios, campos y fotos se deshabilitan.
- **Opciones:** el layout pasa al provider una promesa con `getNewPostOptions()`, sin esperarla. El formulario la lee con `use()` dentro de un `<Suspense>` en el `<dialog>`, con un esqueleto (`SkeletonBlock`) mientras carga. Verificar el patrón en `node_modules/next/dist/docs/` (con `cacheComponents`) antes de implementarlo.

### Carrusel (`feed/components/PhotoCarousel.tsx`, `"use client"`)

- Lo usan `PostCard` y `FamilyPostCard`, en lugar del recuadro "Foto · …".
- Mismo recuadro: 160px de alto en móvil y 200px desde `lg`, radio de 16px. Fotos con `object-cover`.
- Fila con `overflow-x: auto`, `scroll-snap-type: x mandatory`, una foto por vista y la barra de scroll oculta. En móvil se desliza con el dedo.
- Con más de una foto:
  - Flechas ‹ › (`ChevronLeftIcon`/`ChevronRightIcon`) en círculos blancos semitransparentes, visibles al pasar el mouse o con foco (`@media (hover: hover)`). Botones "Foto anterior"/"Foto siguiente", deshabilitados en los extremos.
  - Puntos abajo, centrados. El activo es blanco y los demás blancos al 50%. Se actualizan al hacer scroll.
- `role="region"`, `aria-roledescription="carrusel"`, `aria-label="Fotos de la publicación"`. Cada imagen con `alt="Foto N de M"`.
- Con `prefers-reduced-motion`, el desplazamiento de las flechas es instantáneo.
- Imágenes con `next/image` y `unoptimized` (ya están comprimidas). En `next.config.ts`, `images.remotePatterns` agrega el host de Supabase con `pathname: "/storage/v1/object/sign/post-photos/**"`. `width`/`height` de la fila; si son `null`, se usa `fill`.

### "Cargar más" (`feed/components/LoadMoreButton.tsx`, `"use client"`)

- Al final de la lista, centrado, con el estilo de "Reenviar invitación" (borde `line` y fondo `surface`). Texto "Cargar días anteriores"; "Cargando…" y deshabilitado mientras carga. Ancho completo bajo `sm`.
- Se oculta con `hasMore = false`.
- Si falla: toast "No pudimos cargar más publicaciones" / "Inténtalo de nuevo.".

---

## Estructura de archivos

```
supabase/migrations/<version>_create_post_functions.sql   # nuevo
package.json                                             # + browser-image-compression
next.config.ts                                           # images.remotePatterns
shared/
  database/types.ts                                      # + PostAudience si falta
  components/icons/CameraOffIcon.tsx                     # nuevo
feed/
  types.ts                                               # cambios de "Tipos de la app"
  new-post-limits.ts                                     # 20 MB, título, subida
  new-post-messages.ts                                   # mensajes nuevos
  validate-new-post.ts                                   # título, consentimiento con fotos
  select-photos.ts                                       # límite de 20 MB
  build-new-post-options.ts                              # desde filas reales + rol
  get-new-post-options.ts                                # nuevo, server-only
  compress-photo.ts                                      # nuevo
  find-photo-consent-warning.ts                          # nuevo, puro: mensaje de aviso según audiencia (o null)
  fetch-feed-page.ts                                     # nuevo, server-only
  build-feed.ts                                          # FeedDay<FeedPost>[], encabezado, fotos
  build-day-label.ts                                     # nuevo, puro: etiquetas de día
  actions/create-post.ts                                 # nuevo
  actions/attach-post-photos.ts                          # nuevo
  actions/discard-post.ts                                # nuevo
  actions/load-more-team-feed.ts                         # nuevo
  components/
    NewPostDialogProvider.tsx                            # promesa de opciones, toast, bloqueo al publicar
    NewPostForm.tsx                                      # título, consentimiento, flujo de publicar
    AudiencePicker.tsx                                   # ícono, leyenda, sin "Toda la guardería" para staff
    PhotoPicker.tsx                                      # aviso de consentimiento
    PhotoCarousel.tsx                                    # nuevo
    LoadMoreButton.tsx                                   # nuevo
    FeedDaySection.tsx                                   # nuevo: etiqueta + posts o "Sin publicaciones."
    FeedContent.tsx                                      # datos reales
    FeedView.tsx                                         # días + "Cargar más"
    PostCard.tsx                                         # carrusel
  mock-feed.ts                                           # se borra
family/
  types.ts                                               # cambios
  filter-family-posts.ts                                 # filtro con habitación
  build-family-feed.ts                                   # nuevo
  fetch-family-feed-elderly.ts                           # nuevo, server-only
  actions/load-more-family-feed.ts                       # nuevo
  components/
    FamilyFeedContent.tsx                                # datos reales
    FamilyFeedView.tsx                                   # sin mockFamily
    FamilyFeedList.tsx                                   # días, chips ocultas con 1, "Cargar más"
    FamilyPostCard.tsx                                   # carrusel, línea de habitación
    ElderlyFilterChips.tsx                               # tipo Pick
app/(app)/layout.tsx                                     # promesa de getNewPostOptions()
elderly/mock-elderly.ts                                  # se borra si queda sin uso
shared/session/mock-session.ts                           # se borra si queda sin uso
references/documents/database-schema.md
references/documents/flujos-de-procesos.md
specs/BACKLOG.md
```

---

## Plan de implementación

1. **Revisión previa.** Con `list_migrations` y `execute_sql`: confirmar que existen las tablas de SPEC 22 y `can_post_to_room()`, que no existen las tres funciones nuevas y ver la configuración actual del bucket. Prueba: si algo no coincide, detenerse y preguntar.
2. **Migración local.** `create_post_functions.sql` con las tres funciones, sus `grant`/`revoke` y los límites del bucket. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_post_functions`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: las funciones existen y el bucket muestra los límites.
4. **Pruebas SQL** (`execute_sql` en transacciones con `rollback`, usuarios creados dentro de la transacción como en SPEC 22). Prueba: los criterios de "Base de datos".
5. **Advisors.** `get_advisors` (security y performance). Lo aceptado va al BACKLOG.
6. **Reglas puras.** Dependencia `browser-image-compression`, límites, mensajes, tipos, `validateNewPost` (título y consentimiento), `selectPhotos` (20 MB), `findPhotoConsentWarning`, `buildDayLabel` y `CameraOffIcon`. Prueba: `npm run build` y `npm run lint`.
7. **Opciones reales del modal.** `getNewPostOptions()` (rol, elderly, rooms, `room_has_elderly_without_photo_consent` por habitación), `buildNewPostOptions` y layout con la promesa. "Toda la guardería" solo para admin. Prueba: como admin y como staff, PARA lista lo que corresponde.
8. **Consentimiento y título en el modal.** Ícono, leyenda, error en `elderly`, aviso en `room`/`daycare` y campo TÍTULO. Prueba: los casos del ejemplo Luis/Carmen/Roble.
9. **Publicar sin fotos.** `createPost` y estado "Publicando…", cierre, toast y `refresh()`. Prueba: el post existe en la DB (`execute_sql`) con su `audience`, `room_id`, `title` y etiquetas.
10. **Publicar con fotos.** `compressPhoto`, subida a `post-photos/{postId}/{position}.webp` con `shared/supabase/client.ts`, `attachPostPhotos` y `discardPost` ante cualquier falla. Prueba: las filas en `post_photos` tienen `width`/`height` y los archivos pesan ≤ 200 KB; si se aborta la subida (ruta bloqueada con Playwright), no queda post ni archivos.
11. **Lectura del feed.** `fetchFeedPage`, `visible_post_days` y `buildFeed` por días. Prueba: `npm run build`.
12. **Feed del equipo.** `FeedContent`/`FeedView` con datos reales, encabezado real, `FeedDaySection` y `LoadMoreButton` con `loadMoreTeamFeed`. Se borra `mock-feed.ts`. Prueba: `/` muestra los posts de prueba agrupados y "Cargar más" trae días anteriores.
13. **Carrusel.** `PhotoCarousel` en `PostCard`, `remotePatterns`. Prueba: un post con 3 fotos se recorre con flechas en escritorio y con swipe a 390×844.
14. **Feed del familiar.** `fetchFamilyFeedElderly`, `buildFamilyFeed`, filtro con habitación, chips ocultas con un solo vinculado, autor, línea de habitación, carrusel y `loadMoreFamilyFeed`. Prueba: con la cuenta relative, `/family` muestra los posts de su adulto mayor, de su habitación y de la guardería.
15. **Limpieza.** Borrar `mockElderly` y `mockSession` si quedan sin uso. Prueba: `npm run build` y `npm run lint`.
16. **Prueba real y capturas.** Pedir permiso para escribir en el remoto. Publicar como admin y como staff (las tres audiencias, con y sin fotos), verlo en `/` y `/family`, y capturas en `.playwright-mcp/` a 1440×900 y 390×844. Borrar los datos de prueba al terminar (archivos con `discardPost` o con la API de Storage; luego los posts).
17. **Documentación.** "Cambios en documentos" y "Entradas de BACKLOG".

---

## Criterios de aceptación

**Base de datos**

- [x] Existe `supabase/migrations/<version>_create_post_functions.sql` y su versión coincide con la de `list_migrations`.
- [x] `create_post`, `room_has_elderly_without_photo_consent` y `visible_post_days` tienen `search_path` vacío y `EXECUTE` solo para `authenticated`. La primera y la tercera son `SECURITY INVOKER`; la segunda es `SECURITY DEFINER STABLE`.
- [x] El bucket `post-photos` tiene `file_size_limit = 204800` y `allowed_mime_types = {image/webp}`, y sigue `public = false`.
- [x] `create_post` como staff con un adulto mayor no asignado falla y no deja filas en `posts`.
- [x] `create_post` como staff con `audience = daycare` falla; como admin funciona.
- [x] `create_post` con `audience = elderly` y `p_elderly_ids` vacío falla.
- [x] `room_has_elderly_without_photo_consent` como staff da `true` para una habitación donde tiene asignados y hay un adulto mayor sin consentimiento no asignado, y `false` para una habitación donde no tiene asignados (aunque haya alguien sin consentimiento).
- [x] `room_has_elderly_without_photo_consent` da `false` como relative, `pending` o `archived`, y para una habitación de otra guardería.
- [x] `visible_post_days` como relative no devuelve el día de un post que no puede ver.
- [x] `get_advisors` sin avisos nuevos fuera de los aceptados en el BACKLOG.

**Modal**

- [x] Como admin, PARA lista a todos los adultos mayores `active` de la guardería, "Toda la habitación" (con todas las habitaciones) y "Toda la guardería".
- [x] Como staff, PARA lista solo a sus asignados `active`, el select HABITACIÓN solo trae habitaciones donde tiene asignados y no hay "Toda la guardería".
- [x] La chip de un adulto mayor sin consentimiento muestra la cámara tachada y su nombre accesible incluye "sin consentimiento de fotos". La leyenda aparece solo si hay alguno.
- [x] Etiquetar a un adulto mayor sin consentimiento, agregar una foto y tocar Publicar muestra el error con su nombre en FOTOS y no publica.
- [x] Con "Toda la habitación" (Roble, con un adulto mayor sin consentimiento no asignado al staff) y una foto, aparece "En Roble hay adultos mayores sin consentimiento de fotos. Revisa que no aparezcan.", sin nombres, y se puede publicar.
- [x] Con "Toda la habitación" en una habitación donde todos tienen consentimiento, el aviso no aparece.
- [x] Sin fotos, el aviso no aparece.
- [x] TÍTULO solo aparece con "Toda la habitación" o "Toda la guardería", tiene `maxlength="120"` y se vacía al pasar a adultos mayores.
- [x] Una foto de 15 MB se acepta y una de 21 MB se descarta con "Cada foto puede pesar hasta 20 MB.".
- [x] Mientras publica, el botón dice "Publicando…" y Cancelar, Esc y los campos no responden.
- [x] Con éxito: el modal se cierra, aparece el toast "Publicación creada" y el post se ve en `/` sin recargar.
- [x] Si la subida de una foto falla, no queda el post en `posts` ni archivos en `post-photos/{post_id}/`, el modal sigue abierto con los datos y aparece el toast "No pudimos publicar".
- [x] Cada archivo subido es `image/webp`, pesa ≤ 200 KB, tiene el lado mayor ≤ 1280 px y su fila en `post_photos` tiene `width`, `height` y `position` correctos.
- [x] Un post `room` sin título se guarda con `title = null`; uno `elderly` se guarda con `title = null` aunque se haya escrito un título antes de cambiar la audiencia.
- [x] Al enviar a `createPost` un `audience` o etiquetas manipulados (adulto mayor no asignado), responde `invalid` o `error` y no crea nada.

**Feed del equipo (`/`)**

- [x] El encabezado muestra la cantidad real de adultos mayores `active` visibles y la fecha de hoy en Lima.
- [x] Al cargar se ven "PUBLICADO HOY" y "AYER" con sus posts, del más nuevo al más viejo, o "Sin publicaciones.".
- [x] "Cargar días anteriores" agrega los 2 días anteriores con posts (salta los vacíos) y desaparece cuando no hay más.
- [x] Los encabezados de las tarjetas siguen la tabla "Encabezado de la tarjeta" y los conteos de reacciones y comentarios son los reales.
- [x] Un staff no ve los posts que no le permite `can_view_post()`.

**Feed del familiar (`/family`)**

- [x] Muestra los posts que etiquetan a su adulto mayor, los de su habitación y los de la guardería, agrupados como "HOY · …" y "AYER · …", con "Cargar días anteriores".
- [x] Con dos vinculados, la chip de uno muestra solo sus posts etiquetados, los de su habitación y los de la guardería.
- [x] Con un solo vinculado no se muestran las chips.
- [x] Cada tarjeta muestra "{hora} · {rol} {nombre}" del autor real (por ejemplo, "Cuidador/a Caro").
- [x] Un post `room` de Roble muestra "Habitación Roble · Luis" a la familia de Luis; si Luis y Carmen (ambos vinculados al familiar) están en Roble, "Habitación Roble · Luis y Carmen", también con el filtro de uno solo.
- [x] Los posts `elderly` y `daycare` del familiar no muestran la línea de habitación.

**Carrusel y responsive**

- [x] Un post con 3 fotos muestra la primera, los puntos y, en escritorio al pasar el mouse, las flechas; las flechas cambian de foto y se deshabilitan en los extremos.
- [x] A 390×844 las fotos se cambian deslizando, sin scroll horizontal de la página.
- [x] Un post con una sola foto no muestra flechas ni puntos.
- [x] A 390×844 el modal muestra el ícono, la leyenda, el aviso y TÍTULO sin desbordes, y "Cargar días anteriores" ocupa el ancho completo.

**Cierre**

- [x] `npm run build` y `npm run lint` sin errores. La consola no muestra errores en `/`, `/family` ni al publicar.
- [x] Ningún archivo nuevo usa `service_role`.
- [x] `feed/mock-feed.ts` no existe y ningún archivo de `feed/` importa mocks.
- [x] El remoto queda sin los posts ni archivos de prueba.
- [x] Las capturas están en `.playwright-mcp/`.
- [x] `database-schema.md`, `flujos-de-procesos.md` y `BACKLOG.md` actualizados según "Cambios en documentos" y "Entradas de BACKLOG".

---

## Cambios en documentos

1. **`references/documents/database-schema.md`:**
   - Funciones: agregar `create_post`, `room_has_elderly_without_photo_consent` y `visible_post_days`.
   - Bucket `post-photos`: límites de 200 KB y `image/webp`; ruta `{post_id}/{position}.webp`.
2. **`references/documents/flujos-de-procesos.md`**, "Crear publicación":
   - Título opcional solo en `room` y `daycare`.
   - Las fotos se comprimen en el navegador (WebP, 1280 px, ≤ 200 KB).
   - En `elderly`, con fotos y algún etiquetado sin consentimiento, no se puede publicar.
   - El aviso de `room`/`daycare` es genérico (sin nombres) y también cuenta a los adultos mayores no asignados al staff.
   - Si falla la subida de fotos, se borran los archivos de `{post_id}/` y el post.

## Entradas de BACKLOG

- "Conectar las pantallas del familiar a Supabase": queda `[ ]`. El **Qué** deja solo lo que sigue en mock (resumen, "Mi cuenta", edad y sala de las tarjetas).
- "Chips con un solo adulto mayor": queda `[ ]`. El **Qué** deja solo el resumen.
- "Borrar los archivos de Storage al borrar un post o una foto": queda `[ ]`. El **Qué** dice que falta en el borrado desde la UI; `discardPost` ya implementa el orden (archivos y después el post).
- Nueva entrada en "Feed": "Notificar nuevas publicaciones (`notify_on_post`)".
- Nueva entrada en "Feed": "\"Nueva publicación\" para un staff sin adultos mayores asignados".
- Nueva entrada en "Adultos mayores": "Tratamiento (Don/Doña) de los adultos mayores".
- "Avisos del linter aceptados tras la spec 10": sumar las funciones nuevas si el linter las marca.

---

## Decisiones

- **Sí:** una sola spec para publicar y leer los dos feeds. Decisión del usuario, aunque se propuso dividirla.
- **Sí:** número 25. SPEC 24 está reservada por SPEC 22.
- **Sí:** guardar en `specs/database/`. Tiene migración y funciones, como SPEC 23.
- **Sí:** RPC `create_post` `SECURITY INVOKER`. Guarda post y etiquetas en una transacción (supabase-js no abre transacciones) sin saltarse la RLS.
- **Sí:** subir las fotos desde el navegador con la sesión. Decisión del usuario; evita subir `serverActions.bodySizeLimit`, y la RLS de Storage valida al autor.
- **No:** subir los archivos por la Server Action.
- **Sí:** si falla cualquier foto, se deshace todo (`discardPost`). Decisión del usuario; cumple "si falla cualquier parte, no se guarda nada".
- **Sí:** comprimir antes de crear el post. Un error de compresión no deja nada que deshacer.
- **Sí:** `browser-image-compression`, WebP, 1280 px y ≤ 200 KB. Decisión del usuario; usa un Web Worker y corrige la orientación.
- **No:** Canvas nativo ni `sharp` en el servidor.
- **Sí:** límite del bucket de 200 KB y solo WebP. La DB rechaza lo que no pasó por la compresión.
- **Sí:** foto original de hasta 20 MB. Decisión del usuario.
- **Sí:** guardar `width` y `height`. Decisión del usuario; el carrusel reserva el espacio.
- **Sí:** cámara tachada en la chip, leyenda y error que bloquea en `elderly` con fotos. Decisión del usuario; el staff ve antes por qué no puede publicar.
- **Sí:** aviso que no bloquea en `room`/`daycare`. Decisión del usuario; la regla del feed sigue dependiendo solo de `audience`.
- **No:** ocultar posts o fotos a las familias sin consentimiento. No protege al adulto mayor que sale en la foto y cambiaría `can_view_post()`.
- **No:** convertir un post de habitación en uno etiquetado.
- **Sí:** aviso genérico con `room_has_elderly_without_photo_consent` (`true/false`). Decisión del usuario (opción B); cumple la regla 7 sin excepciones y cuenta también a los no asignados al staff.
- **No:** aviso con nombres (opción A). Exigía una excepción a la regla 7: le entregaba al staff nombres de adultos mayores que la RLS le oculta.
- **No:** limitar el aviso a los asignados (opción C). El staff no se enteraría de los no asignados sin consentimiento.
- **Sí:** TÍTULO opcional solo para habitación y guardería. Decisión del usuario; sin título, el encabezado sale de la audiencia.
- **Sí:** feed agrupado por día: hoy y ayer al cargar, y "Cargar más" con los 2 días siguientes con posts. Decisión del usuario.
- **Sí:** botón secundario "Cargar días anteriores". Decisión del usuario; el mockup no lo define.
- **No:** scroll infinito.
- **Sí:** carrusel con scroll-snap, flechas en escritorio y swipe en móvil, sin librería. Decisión del usuario.
- **Sí:** el feed del familiar entra en esta spec. Decisión del usuario.
- **Sí:** el filtro del familiar incluye los posts de la habitación del adulto mayor y los de la guardería. Decisión del usuario.
- **Sí:** en el feed del familiar, los posts `room` indican cuáles de sus adultos mayores están en esa habitación ("Habitación Roble · Luis"). Decisión del usuario; la familia sabe a quién le toca el post. Solo nombra a sus propios vinculados.
- **No:** esa línea en el feed del equipo. Ya muestra "Para: habitación Roble" y el staff conoce a sus asignados.
- **Sí:** ocultar las chips con un solo vinculado. Decisión del usuario.
- **Sí:** "Publicando…", cierre y toast, sin progreso por foto. Decisión del usuario.
- **Sí:** URLs firmadas por 1 hora y `next/image` con `unoptimized`. El bucket es privado y las fotos ya vienen comprimidas.
- **Sí:** el filtro del familiar se aplica sobre los días cargados. Evita una consulta por filtro.
- **Sí:** los nombres de etiquetados que el usuario no puede leer por RLS no se muestran. Es la regla de privacidad vigente.
- **Sí:** los feeds reales muestran solo el nombre de pila, sin "Don" ni "Doña". Decisión del usuario; el esquema no guarda el tratamiento y un "Don" fijo se equivocaba con las mujeres. Las pantallas con mock conservan sus textos.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración y las pruebas escriben en el remoto | Se pide permiso antes; los datos de prueba se borran al terminar. |
| Spec grande: muchos archivos en una sola rama | Pasos pequeños con pausa para revisar el diff en cada uno. |
| Entre `createPost` y `attachPostPhotos`, las familias pueden ver el post sin fotos unos segundos | Aceptado: no hay notificaciones ni tiempo real; si falla, `discardPost` lo borra. |
| Si se cierra la pestaña a mitad de la subida, queda un post sin todas sus fotos | Aceptado; se podrá editar o borrar cuando exista esa spec. |
| `browser-image-compression` no llega a 200 KB con algunas imágenes | Se valida el tamaño y se muestra "No pudimos procesar la foto N…" antes de crear el post. |
| HEIC no se decodifica en Chrome de escritorio | Mismo mensaje; en iPhone, el selector entrega JPEG. |
| Las URLs firmadas vencen si la página queda abierta más de 1 hora | Al navegar o recargar se firman de nuevo. |
| La promesa de opciones en el layout choca con `cacheComponents` | Verificar el patrón en `node_modules/next/dist/docs/` en el paso 7; si no aplica, detenerse y preguntar. |
| El aviso genérico no dice quién no tiene consentimiento | Aceptado (opción B): el staff pregunta en la sala o al admin. |
| Contar `reactions` y `comments` por post pasa por `can_view_post()` en cada fila | Pocos posts por día; revisar con `EXPLAIN` si el feed se vuelve lento. |

---

## Lo que **no** entra en esta spec

- Editar o borrar publicaciones y fotos desde la UI.
- Detalle de publicación y visor de foto.
- Reaccionar y comentar.
- Notificaciones y resumen diario.
- "Resumen del día" y "Mi cuenta" del familiar.
- Ocultar posts o fotos según el consentimiento, o prohibir fotos en habitación o guardería.
- Título en posts `elderly`.
- Progreso por foto, recortar o reordenar fotos.
- Tiempo real.

Cada una de esas, si llega, va en su propia spec.
