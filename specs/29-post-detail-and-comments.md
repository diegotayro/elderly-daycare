# SPEC 29 — Detalle de publicación con comentarios

> **Estado:** Aprobado
> **Depende de:** SPEC 22, SPEC 25, SPEC 27, SPEC 28
> **Fecha:** 2026-11-20
> **Objetivo:** Construir el detalle de publicación (`/posts/[id]` para el equipo y `/family/posts/[id]` para el familiar) con "Me encanta", la lista de comentarios y la opción de comentar y borrar, enlazado desde el feed y desde Avisos.

---

## Por qué esta spec

Las tablas `comments` y `reactions` y sus policies existen desde SPEC 22. El feed (SPEC 25) muestra el conteo de comentarios y Avisos (SPEC 27) lista comentarios y reacciones, pero no hay dónde leerlos ni escribirlos. El ícono de comentarios del feed del equipo enlaza a `/`.

`detalle-publicacion.dc.html` solo dibuja la versión del familiar. El equipo usa la misma pantalla dentro de su layout `(app)`. La cabecera del post sigue al feed de cada rol, como ya pasa con `PostCard` y `FamilyPostCard`.

El mockup no cubre borrar comentarios, el estado sin reacción del botón "Me encanta" ni las fechas de otros días. Esta spec los define.

---

## Alcance

**Dentro:**

- Rutas:
  - `app/(app)/posts/[id]/page.tsx` para `admin` y `staff` (`requireTeamUser`).
  - `app/(family)/family/posts/[id]/page.tsx` para `relative` (`requireRelativeUser`).
  - Cada una con su `not-found.tsx` y su esqueleto de carga dentro de `<Suspense>`.
- Tarjeta del post, siguiendo el mockup:
  - Cabecera: equipo como `PostCard` (heading, hora, "publicado por ti", "Para: …"); familiar como `FamilyPostCard` (avatar con tono, heading, hora · autor, línea de habitación).
  - Cuerpo con `text-[16px]` y `leading-[1.6]` del mockup.
  - Fotos con `PhotoCarousel`, sin enlace al visor.
  - Línea "A N personas les gusta" con círculos decorativos.
  - Botones "Me encanta" y "Comentar".
- "Me encanta" reusa `setReaction` (SPEC 28) con actualización optimista. La línea de conteo se actualiza junto con el botón.
- "Comentar" lleva el foco al campo de comentario.
- Sección "COMENTARIOS · N": todos los comentarios, del más viejo al más nuevo, sin paginación.
- Cada comentario: avatar con inicial, nombre completo, rol en minúsculas, hora y texto.
- Campo fijo abajo (`sticky`) con el avatar del usuario, el input "Escribe un comentario…" y el botón de enviar.
- Server Action `createComment(postId, body)`: valida y devuelve el comentario creado. Se agrega al final de la lista sin recargar.
- Server Action `deleteComment(commentId)`: borra un comentario propio, o cualquiera si quien llama es admin (lo que permite la RLS). Pide confirmación con un diálogo.
- Fecha relativa: hoy solo la hora; ayer "Ayer HH:MM"; antes "17 nov HH:MM". Vale para el post y para los comentarios.
- "Volver al feed" es un `Link` a `/` o `/family` según el rol.
- Enlaces de entrada:
  - El ícono de comentarios de `PostCard` (`/`) apunta a `/posts/{id}`.
  - El ícono de comentarios de `FamilyPostCard` (`/family`) pasa a ser un `Link` a `/family/posts/{id}`.
  - Las tarjetas de aviso `comment` y `reaction` de `/notices` enlazan a `/posts/{postId}`.
- Migración: `list_notices` devuelve además `post_id`, sin cambiar sus reglas.
- Deuda técnica en un archivo que la spec ya toca: `fetch-feed-page.ts` pasa de `.returns<PostRow[]>()` (deprecado en supabase-js) a `.overrideTypes<PostRow[], { merge: false }>()`, sin cambiar lo que devuelve.
- Accesibilidad: foco visible, nombres accesibles, `aria-live` para el conteo de comentarios, área táctil de 44×44 px y `motion-reduce`.

**Fuera de alcance (para specs futuras):**

- Visor de foto (`foto.dc.html`).
- Editar comentarios.
- Editar o borrar el post. El "Editar" de `PostCard` sigue enlazando a `/`.
- Lista de quién reaccionó e iniciales reales en los círculos.
- Parentesco en el rol del comentario ("· hija").
- Paginación de comentarios.
- Comentarios y conteos en vivo.
- Correos por comentarios.
- Abrir el detalle tocando toda la tarjeta del feed.
- Enlaces desde `/family/summary`, que sigue con mock.
- Leído/no leído en Avisos.
- El tratamiento Don/Doña: el heading usa el nombre de pila, como el feed.

---

## Modelo de datos

### Base de datos

No hay tablas ni policies nuevas. Se reusa `comments` de SPEC 22:

- `body text not null check (char_length(btrim(body)) between 1 and 1000)`.
- `comments_select_visible`: `can_view_post(post_id)`.
- `comments_insert_own`: `author_id = auth.uid()` y `can_view_post(post_id)`.
- `comments_delete_author`: `author_id = auth.uid()` y usuario activo.
- `comments_delete_admin`: `is_admin()` y `can_view_post(post_id)`.
- Los autores se leen con `users_select_comment_authors`.

**Migración `add_post_id_to_list_notices`:**

- `drop function public.list_notices(timestamptz, int)` y `create` con la misma lógica, más la columna `post_id uuid` en el `returns table`, al final.
- `post_id` es `null` en `account_activated`.
- Se repiten `security invoker`, `stable`, `set search_path = ''`, el `revoke` a `public` y `anon` y el `grant execute` a `authenticated`.
- Se actualiza `references/documents/database-schema.md` ("Funciones de avisos").

### Tipos de la app

```ts
// comments/types.ts
export type CommentView = {
  id: string;
  authorInitial: string;  // "L"; "?" si la RLS no deja leer al autor
  authorTone: AvatarTone; // getAvatarTone(author_id)
  authorName: string;     // full_name; "Usuario" si no se puede leer
  roleLabel: string | null; // "familiar" | "cuidador/a" | "administración"; null si no se puede leer
  timeLabel: string;      // "10:02" | "Ayer 10:02" | "17 nov 10:02"
  body: string;
  canDelete: boolean;     // autor = yo, o yo soy admin
};

export type CreateCommentResult =
  | { status: "ok"; comment: CommentView }
  | { status: "invalid"; error: string }
  | { status: "error" };

export type DeleteCommentResult = { status: "ok" } | { status: "error" };
```

```ts
// comments/comment-role-labels.ts
export const commentRoleLabels: Record<UserRole, string> = {
  relative: "familiar",
  staff: "cuidador/a",
  admin: "administración",
};
```

```ts
// feed/types.ts
export type PostDetail<TPost> = {
  post: TPost; // FeedPost (equipo) o FamilyPost (familiar)
  comments: CommentView[];
};
```

```ts
// shared/database/types.ts
export type ListNoticesRow = { /* … */ post_id: string | null };

// notices/types.ts: NoticePost suma postId
export type NoticePost = { /* … */ postId: string };
```

### Lectura

- `feed/fetch-post.ts` (`server-only`): `fetchPost(postId, currentUserId): Promise<FeedPostData | null>`.
  - Reusa `POST_COLUMNS`, la firma de fotos, `fetchReactedPostIds` y `toFeedPostData` de `fetch-feed-page.ts`. Se exportan desde allí, sin duplicarlos.
  - `.eq("id", postId).maybeSingle()`. Si no hay fila (no existe, se borró o la RLS no lo deja ver), devuelve `null`.
  - Un `postId` que no es UUID (`shared/text/is-uuid.ts`) devuelve `null` sin consultar.
- `comments/fetch-comments.ts` (`server-only`): `fetchComments(postId): Promise<CommentRow[]>`.
  - `comments.select("id, author_id, body, created_at, author:users!author_id(full_name, role)")`.
  - `.eq("post_id", postId).order("created_at").order("id")`.
- `comments/build-comment-view.ts`: `toCommentView(row, currentUser, today)`.
  - `canDelete = row.author_id === currentUser.id || currentUser.role === "admin"`.
- `shared/date/format-relative-time.ts`: `formatRelativeTime(iso, today)` con zona `America/Lima`.
  - Hoy → `"HH:MM"`. Ayer → `"Ayer HH:MM"`. Antes → `"17 nov HH:MM"` (`es`, día y mes corto, sin punto).
  - Se usa para la hora del post en el detalle (no cambia la del feed) y para los comentarios.
- `feed/get-post-detail.ts`: carga en paralelo `fetchPost` y `fetchComments`. El post se mapea con `toFeedPost` (equipo) o `toFamilyPost` (familiar); se exportan desde `build-feed.ts` y `build-family-feed.ts`. Su `time` se reemplaza por `formatRelativeTime`.
- El familiar necesita sus adultos mayores para la línea de habitación y el avatar (`fetchFamilyFeedElderly`). La lógica de `findAuthor` de `FamilyFeedList` se mueve a `family/find-post-author.ts` y la usan ambos.

### Server Actions

**`comments/actions/create-comment.ts`:** `createComment(postId: string, body: string): Promise<CreateCommentResult>`.

- Valida con `getCurrentUser()` que haya un usuario activo. Si no hay, devuelve `error`.
- `postId` tiene que ser un UUID. Si no lo es, devuelve `error`.
- `body`: `trim`; vacío o con más de 1000 caracteres → `invalid` con el mensaje de `comment-messages.ts`. Usa `comments/validate-comment-body.ts`, que también usa el cliente.
- `insert { post_id, author_id: user.id, body }` con el `select` de `fetchComments`, `.single()`.
- `author_id` lo fija siempre el servidor.
- Cualquier error de la DB (RLS, post borrado, red) → `error`.
- Devuelve el `CommentView` armado con `toCommentView`.

**`comments/actions/delete-comment.ts`:** `deleteComment(commentId: string): Promise<DeleteCommentResult>`.

- Usuario activo y `commentId` UUID. Si falla alguna, devuelve `error`.
- `delete().eq("id", commentId).select("id")`. La RLS decide si se puede borrar.
- Si borra cero filas, devuelve `error`: no se pudo, o ya no existía.
- Nunca usa `service_role`.

Ninguna acción llama a `refresh()` ni a `revalidatePath`.

### Mensajes (`comments/comment-messages.ts`)

| Clave | Texto |
| --- | --- |
| Placeholder | Escribe un comentario… |
| Vacío (`invalid`) | Escribe un comentario antes de enviarlo. |
| Largo (`invalid`) | El comentario no puede superar los 1000 caracteres. |
| Toast error al enviar: título | No se pudo enviar tu comentario |
| Toast error al enviar: descripción | Revisa tu conexión e intenta de nuevo. |
| Confirmación: título | ¿Eliminar este comentario? |
| Confirmación: descripción | Esta acción no se puede deshacer. |
| Confirmación: botones | Cancelar / Eliminar |
| Toast error al borrar: título | No se pudo eliminar el comentario |
| Toast error al borrar: descripción | Revisa tu conexión e intenta de nuevo. |
| Enlace en la burbuja | Eliminar |
| Lista vacía | Aún no hay comentarios. Sé el primero en comentar. |
| `aria-label` del botón enviar | Enviar comentario |

### Reacción en el detalle

- `feed/use-reaction-toggle.ts` (`"use client"`): se extrae de `ReactionButton` el estado confirmado, `useOptimistic`, la transición, el bloqueo mientras guarda y el toast de error.
- `ReactionButton` pasa a usar el hook, sin cambiar lo que se ve.
- `feed/components/PostDetailReactions.tsx` usa el hook para la línea de conteo y el botón "Me encanta":
  - **Reaccionado:** como el mockup (`border-[#F2A78E]`, fondo `#FBD8CC`, texto y corazón coral relleno).
  - **Sin reaccionar:** como el botón "Comentar" del mockup (borde `line`, fondo `surface`, texto `muted-strong`, corazón con contorno).
  - `aria-pressed` y nombre accesible "Me encanta".
- Línea de conteo:
  - 0 → no se muestra.
  - 1 → "A 1 persona le gusta" con 1 círculo.
  - N → "A N personas les gusta" con `min(N, 3)` círculos.
  - Colores fijos del mockup en orden: `#F8D2DE`, `#F7E7A6`, `#CFEBD8`. Los círculos son `aria-hidden`.

### Componentes

Los colores, tamaños y espaciados se toman del mockup.

- `feed/components/PostDetailView.tsx`: "Volver al feed", la tarjeta y la sección de comentarios. Recibe la cabecera como `children` según el rol.
- `comments/components/CommentList.tsx` (`"use client"`):
  - Mantiene la lista en estado. El título "COMENTARIOS · N" va con `aria-live="polite"`.
  - Agrega el comentario creado y quita el borrado.
- `comments/components/CommentItem.tsx`: avatar 38 px, burbuja, "Eliminar" (texto pequeño `text-coral-link`) si `canDelete`.
- `comments/components/CommentComposer.tsx`:
  - El input tiene `maxLength={1000}` y `aria-label`. Enter envía.
  - El botón de enviar se deshabilita si el texto está vacío o hay un envío en curso.
  - Con `ok` limpia el input. Con `invalid` muestra el error bajo el input (`FieldError`). Con `error` muestra el toast y conserva el texto.
  - Expone un `ref` para que "Comentar" lleve el foco al input.
- `comments/components/ConfirmDeleteCommentDialog.tsx`: mismo patrón que `ConfirmStaffActionDialog`.
- `notices/components/NoticeCard.tsx`: con `comment` o `reaction`, la tarjeta es un `Link` a `/posts/{postId}`, con foco visible. `account_activated` y `reminder` no cambian.

---

## Estructura de archivos

```
app/(app)/posts/[id]/
  page.tsx                       # nuevo
  not-found.tsx                  # nuevo
app/(family)/family/posts/[id]/
  page.tsx                       # nuevo
  not-found.tsx                  # nuevo
comments/                        # nuevo feature
  types.ts
  comment-role-labels.ts
  comment-messages.ts
  validate-comment-body.ts
  fetch-comments.ts
  build-comment-view.ts
  actions/
    create-comment.ts
    delete-comment.ts
  components/
    CommentList.tsx
    CommentItem.tsx
    CommentComposer.tsx
    ConfirmDeleteCommentDialog.tsx
feed/
  types.ts                       # + PostDetail
  fetch-feed-page.ts             # exporta POST_COLUMNS, firma de fotos, fetchReactedPostIds y toFeedPostData
  fetch-post.ts                  # nuevo
  get-post-detail.ts             # nuevo
  build-feed.ts                  # exporta toFeedPost
  use-reaction-toggle.ts         # nuevo
  components/
    ReactionButton.tsx           # usa el hook
    PostDetailReactions.tsx      # nuevo
    PostDetailView.tsx           # nuevo
    PostDetailContent.tsx        # nuevo (equipo, dentro de Suspense)
    PostDetailSkeleton.tsx       # nuevo
    PostCard.tsx                 # enlace de comentarios a /posts/{id}
family/
  build-family-feed.ts           # exporta toFamilyPost
  find-post-author.ts            # nuevo, sale de FamilyFeedList
  components/
    FamilyPostDetailContent.tsx  # nuevo (familiar, dentro de Suspense)
    FamilyPostCard.tsx           # enlace de comentarios a /family/posts/{id}
    FamilyFeedList.tsx           # usa find-post-author
notices/
  types.ts                       # + postId
  build-notices.ts               # mapea post_id
  components/NoticeCard.tsx      # Link en comment y reaction
shared/
  date/format-relative-time.ts   # nuevo
  database/types.ts              # + post_id en ListNoticesRow
supabase/migrations/
  <timestamp>_add_post_id_to_list_notices.sql   # nuevo
```

---

## Plan de implementación

1. **Revisión previa (solo lectura).**
   - Cargar los skills `supabase` y `supabase-postgres-best-practices`.
   - Con `execute_sql`, confirmar las policies de `comments`, `users_select_comment_authors`, los `grant` de `comments` y la definición actual de `list_notices`.
   - Prueba: si algo no coincide con esta spec, detenerse y preguntar.
2. **Migración de `list_notices`.**
   - Escribir el SQL y pedir permiso antes de aplicarlo.
   - Aplicar, actualizar `ListNoticesRow`, `build-notices.ts`, `NoticePost` y `database-schema.md`.
   - Prueba: `/notices` se ve igual que antes, y `list_notices` devuelve `post_id` en `comment` y `reaction`.
3. **Fecha relativa.**
   - `shared/date/format-relative-time.ts`.
   - Prueba: `npm run build`.
4. **Lectura del post.**
   - Exportar lo necesario de `fetch-feed-page.ts`, `build-feed.ts` y `build-family-feed.ts`.
   - Crear `fetch-post.ts`.
   - Cambiar `.returns<PostRow[]>()` por `.overrideTypes<PostRow[], { merge: false }>()` en `fetchFeedPage`.
   - Prueba: `npm run build` y el feed carga igual que antes.
5. **Lectura de comentarios.**
   - `comments/types.ts`, `comment-role-labels.ts`, `fetch-comments.ts`, `build-comment-view.ts` y `feed/get-post-detail.ts`.
   - Prueba: `npm run build`.
6. **Server Actions.**
   - `comment-messages.ts`, `validate-comment-body.ts`, `create-comment.ts` y `delete-comment.ts`.
   - Prueba: `npm run build` y `npm run lint`.
7. **Hook de reacción.**
   - Extraer `use-reaction-toggle.ts` y adaptar `ReactionButton`.
   - Prueba: en `/` y `/family` el corazón funciona igual que en SPEC 28.
8. **Pantalla del equipo.**
   - Cargar el skill `frontend-design:frontend-design`.
   - `PostDetailView`, `PostDetailReactions`, los componentes de `comments/`, `PostDetailContent`, `PostDetailSkeleton` y `app/(app)/posts/[id]`.
   - Prueba: `/posts/{id}` muestra el post y sus comentarios, y permite comentar y borrar.
9. **Pantalla del familiar.**
   - `find-post-author.ts`, `FamilyPostDetailContent` y `app/(family)/family/posts/[id]`.
   - Prueba: `/family/posts/{id}` se ve como el mockup.
10. **Enlaces de entrada.**
    - `PostCard`, `FamilyPostCard` y `NoticeCard`.
    - Prueba: desde `/`, `/family` y `/notices` se llega al detalle correcto.
11. **Prueba real y capturas.**
    - Pedir permiso para escribir en el remoto.
    - Como familiar: comentar, reaccionar y borrar el propio comentario.
    - Como staff: comentar y comprobar que no puede borrar el comentario de un familiar.
    - Como admin: borrar el comentario de otro y ver los avisos de `/notices` enlazados.
    - Comprobar las filas con `execute_sql`.
    - Capturas en `.playwright-mcp/` a 1440×900 y 390×844 de ambas rutas, con y sin comentarios.
    - Borrar al terminar los comentarios y reacciones de prueba que queden.
12. **Documentación.** "Entradas de BACKLOG".

---

## Criterios de aceptación

**Datos y acciones**

- [ ] La única migración nueva es la de `list_notices`. `pg_policies` no cambia.
- [ ] `list_notices` devuelve `post_id` en `comment` y `reaction`, y `null` en `account_activated`.
- [ ] El resto de las columnas y filas de `list_notices` no cambian.
- [ ] `list_notices` sigue `security invoker`, sin `EXECUTE` para `anon`.
- [ ] `createComment` con un texto válido crea una fila con `author_id` del usuario y devuelve el comentario armado.
- [ ] `createComment` con texto vacío, solo espacios o de más de 1000 caracteres devuelve `invalid` sin tocar la DB.
- [ ] Un `postId` o `commentId` que no es UUID devuelve `error` sin tocar la DB.
- [ ] Sin sesión, ambas acciones devuelven `error`.
- [ ] `createComment` en un post que el usuario no puede ver devuelve `error` y no crea filas.
- [ ] `deleteComment` borra el comentario propio de cualquier rol.
- [ ] Como admin, `deleteComment` borra el comentario de otro en su guardería.
- [ ] Como staff o familiar, `deleteComment` sobre un comentario ajeno devuelve `error` y no borra.
- [ ] Ninguna acción usa `service_role` ni recibe `author_id` del cliente.

**Pantalla**

- [ ] `/posts/{id}` (admin y staff) y `/family/posts/{id}` (familiar) muestran el post visible.
- [ ] Un familiar que abre `/posts/{id}` va a `/family`. Un admin o staff que abre `/family/posts/{id}` va a `/`.
- [ ] Un id inexistente, que no es UUID, de un post borrado o no visible muestra el `not-found.tsx` con "Volver al feed".
- [ ] La vista del familiar coincide con el mockup a 1440×900: tarjeta, línea de "les gusta", botones, comentarios y campo fijo.
- [ ] La cabecera del equipo sigue a `PostCard` ("publicado por ti" y "Para: …").
- [ ] La hora es "HH:MM" si es de hoy, "Ayer HH:MM" si es de ayer y "D mmm HH:MM" si es anterior.
- [ ] La regla de la hora vale para el post y para los comentarios.
- [ ] Las fotos se ven con el carrusel y no enlazan a otra pantalla.
- [ ] "Me encanta" cambia al instante con el estado del mockup.
- [ ] La línea "A N personas les gusta" se actualiza junto con el botón.
- [ ] Con 0 reacciones la línea no se muestra. Con 1 dice "A 1 persona le gusta".
- [ ] Al recargar, el estado de "Me encanta" coincide con lo guardado.
- [ ] Si `setReaction` falla, vuelve al estado anterior y aparece el toast de SPEC 28.
- [ ] "Comentar" lleva el foco al campo de comentario.
- [ ] Los comentarios se listan del más viejo al más nuevo.
- [ ] Cada comentario muestra el nombre completo y el rol ("familiar", "cuidador/a" o "administración").
- [ ] Sin comentarios se ve "COMENTARIOS · 0" y "Aún no hay comentarios. Sé el primero en comentar.".
- [ ] Enter envía el comentario.
- [ ] El botón de enviar está deshabilitado con el campo vacío o mientras envía.
- [ ] El input no deja escribir más de 1000 caracteres.
- [ ] Al enviar con éxito, el comentario aparece al final, el contador sube y el input se limpia.
- [ ] Enviar un comentario no recarga el post ni vuelve a firmar las fotos.
- [ ] Si el envío falla, aparece el toast "No se pudo enviar tu comentario" y el texto se conserva.
- [ ] "Eliminar" solo aparece en los comentarios propios, o en todos si el usuario es admin.
- [ ] "Eliminar" abre la confirmación.
- [ ] Al confirmar, el comentario desaparece y el contador baja.
- [ ] Si el borrado falla, aparece el toast "No se pudo eliminar el comentario" y el comentario sigue.
- [ ] El campo de comentario queda fijo abajo al hacer scroll.
- [ ] Todos los controles se usan con teclado, con foco visible.
- [ ] El área táctil del botón enviar y de "Eliminar" mide al menos 44×44 px.
- [ ] Con `prefers-reduced-motion: reduce` no hay transiciones.
- [ ] A 390×844 no hay scroll horizontal y el campo fijo no tapa el último comentario.

**Enlaces**

- [ ] El ícono de comentarios de `/` lleva a `/posts/{id}`.
- [ ] El ícono de comentarios de `/family` lleva a `/family/posts/{id}`.
- [ ] Los avisos de comentario y reacción de `/notices` llevan a `/posts/{postId}`.
- [ ] Los avisos de cuenta activada y el recordatorio no enlazan.
- [ ] Al volver al feed, el número de comentarios de la tarjeta coincide con lo guardado.
- [ ] El corazón del feed funciona igual que en SPEC 28.
- [ ] `fetchFeedPage` usa `.overrideTypes` y el feed carga igual que antes.

**Cierre**

- [ ] `npm run build` y `npm run lint` sin errores. La consola no muestra errores en las dos rutas nuevas, `/`, `/family` ni `/notices`.
- [ ] El remoto queda sin los comentarios ni las reacciones de prueba.
- [ ] Las capturas están en `.playwright-mcp/`.
- [ ] `database-schema.md` y `BACKLOG.md` están actualizados.

---

## Entradas de BACKLOG

- "Enlaces al detalle de publicación desde `/family` y `/family/summary`": resuelto a medias. Queda `[ ]` y el **Qué** solo deja:
  - `/family/summary` ("Lo más lindo de hoy");
  - el visor de foto;
  - la tarjeta completa del feed.
- Nuevas entradas en "Feed":
  - "Editar y borrar comentarios": editar el propio (la RLS lo permite) y decidir la UI, que no tiene mockup.
  - "Paginación de comentarios": si un post acumula muchos comentarios.
  - "Comentarios en vivo": los comentarios de otros solo se ven al recargar.
  - "Correos por comentarios": avisar al autor del post o a los familiares.
  - "Parentesco en los comentarios": mostrar "· hija" requiere una función `SECURITY DEFINER`, porque la RLS no deja leer `guardian_elderly` ajenos.

---

## Decisiones

- **Sí:** detalle para el equipo y para el familiar. Decisión del usuario; el equipo también tenía el enlace de comentarios muerto.
- **Sí:** dos rutas (`/posts/[id]` y `/family/posts/[id]`), cada una en su route group y con su guard. Así sigue la separación de layouts por rol que ya existe.
- **No:** una sola ruta compartida. Habría que mezclar los layouts `(app)` y `(family)`.
- **Sí:** cabecera del post según el feed de cada rol. El mockup solo cubre al familiar, y el equipo ya tiene su tarjeta.
- **Sí:** crear y borrar comentarios. El admin borra cualquiera, como permite la RLS. Decisión del usuario.
- **No:** editar comentarios. No hay mockup; va al BACKLOG.
- **Sí:** rol en minúsculas en vez de parentesco. Decisión del usuario; la RLS no deja leer el parentesco ajeno y así no se expone.
- **No:** función SQL para el parentesco. Abre una spec de database.
- **Sí:** círculos decorativos en "les gusta". Decisión del usuario; la RLS no deja leer a quien reacciona.
- **Sí:** reusar `PhotoCarousel` sin enlace al visor. Decisión del usuario; el visor va en su propia spec.
- **Sí:** enlazar desde el ícono de comentarios y desde Avisos. Decisión del usuario.
- **No:** tarjeta del feed entera clicable. Choca con el corazón y el carrusel.
- **Sí:** migración de `list_notices` en esta spec. Decisión del usuario. Solo agrega una columna, y la spec queda en `specs/` porque es casi toda UI.
- **No:** sacar el `post_id` del `id` del aviso. En los comentarios el `id` es el del comentario, no el del post.
- **Sí:** agregar el comentario sin recargar. Decisión del usuario; no re-firma las fotos ni pisa el estado de "Me encanta".
- **No:** `router.refresh()` ni comentario optimista. El primero re-renderiza todo; el segundo suma lógica sin aportar.
- **Sí:** borrar con confirmación. Decisión del usuario; sigue el patrón de `ConfirmStaffActionDialog`.
- **Sí:** `deleteComment` con cero filas borradas devuelve `error`. A diferencia de las reacciones, el usuario pidió borrar algo concreto y conviene avisarle.
- **Sí:** todos los comentarios, del más viejo al más nuevo. Decisión del usuario; la paginación va al BACKLOG.
- **Sí:** `notFound()` para un post inexistente o no visible. Decisión del usuario; no revela si el post existe.
- **Sí:** "Volver al feed" como `Link` según el rol, y "Comentar" lleva el foco. Decisión del usuario.
- **Sí:** día y hora si no es de hoy. Decisión del usuario; con solo la hora, un post viejo es ambiguo.
- **Sí:** nombre completo más rol en los comentarios. Decisión del usuario.
- **Sí:** input de una línea, Enter envía, `maxLength` 1000. Decisión del usuario. El servidor valida igual, como el `check` de la tabla.
- **Sí:** extraer `use-reaction-toggle.ts`. El botón grande y la línea de conteo comparten estado sin duplicar la lógica de SPEC 28.
- **Sí:** exportar y reusar las piezas de `fetch-feed-page.ts`, `build-feed.ts` y `build-family-feed.ts`. Un solo lugar arma `FeedPostData` y las tarjetas.
- **Sí:** nuevo feature `comments/` y el detalle en `feed/`. Así lo pide Screaming Architecture: los comentarios son su propio concepto de dominio.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El `drop` y `create` de `list_notices` deja la función sin permisos | La migración repite `revoke` y `grant`. El paso 2 verifica `/notices` antes de seguir. |
| La migración y las pruebas escriben en el remoto | Se pide permiso antes de aplicar y antes de probar. Los datos de prueba se borran al terminar. |
| Comentario de un autor que la RLS no deja leer | `authorName = "Usuario"`, `roleLabel = null` y la inicial "?". No rompe la lista. |
| Un usuario archivado mientras tiene el detalle abierto | La RLS rechaza la escritura. Se muestra el toast y la lista no cambia. |
| El post se borra mientras el usuario lo ve | El insert falla por FK o RLS. Se muestra el toast; al recargar aparece el `not-found`. |
| Muchos comentarios en un post | Se aceptan sin paginar. Queda la entrada en el BACKLOG. |
| El campo fijo tapa contenido en móvil | Criterio de aceptación a 390×844, con padding inferior en la lista. |
| El conteo del feed queda viejo al volver con el botón atrás del navegador | "Volver al feed" es un `Link`. El botón atrás del navegador puede mostrar la caché del router hasta recargar; se acepta. |

---

## Lo que **no** entra en esta spec

- Visor de foto.
- Editar comentarios, y editar o borrar posts.
- Quién reaccionó e iniciales reales.
- Parentesco en los comentarios.
- Paginación y tiempo real.
- Correos por comentarios.
- Tarjeta del feed entera clicable y enlaces desde `/family/summary`.
- Leído/no leído en Avisos.
- Tratamiento Don/Doña.

Cada una de esas, si llega, va en su propia spec.
