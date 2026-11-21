# SPEC 30 — Visor de foto a pantalla completa

> **Estado:** Implemented
> **Depende de:** SPEC 25, SPEC 29
> **Fecha:** 2026-11-20
> **Objetivo:** Abrir las fotos de un post en un visor oscuro a pantalla completa (`foto.dc.html`) desde el feed y el detalle, con navegación entre fotos y descarga.

---

## Por qué esta spec

`PhotoCarousel` muestra las fotos en el feed (`/`, `/family`) y en el detalle (`/posts/[id]`, `/family/posts/[id]`), pero no se pueden ver en grande ni descargar. Los mockups `feed.dc.html` y `detalle-publicacion.dc.html` enlazan la foto a `foto.dc.html`.

El visor es una capa (`<dialog>`) sobre la pantalla actual y no una ruta: reusa las URLs ya firmadas y no vuelve a leer el post. El mockup dibuja una sola foto y no cubre varias fotos, el error de carga ni el estado de descarga. Esta spec los define.

Resuelve en parte la entrada del BACKLOG "Enlaces al detalle de publicación y al visor de foto" (la foto del post).

---

## Alcance

**Dentro:**

- `PhotoViewer` (`"use client"`): `<dialog>` a pantalla completa con `showModal()`, siguiendo `foto.dc.html`:
  - Fondo `#1A1714`.
  - Cabecera: botón cerrar (X) a la izquierda, heading y subtítulo al centro, botón "Descargar" a la derecha.
  - Foto al centro con `object-contain`, sin recortar, `max-w-[760px]` y `rounded-[20px]`.
  - Pie con el texto completo del post, `max-w-[560px]`, con alto máximo y scroll propio.
- Se abre tocando una foto del carrusel, en la foto tocada. Vale en `/`, `/family`, `/posts/[id]` y `/family/posts/[id]`.
- Cabecera igual a la tarjeta desde donde se abre:
  - Equipo: heading y `buildTeamPostSubtitle(post)` ("09:40 · publicado por ti" o "09:40 · Cuidador/a Caro").
  - Familiar: heading y "09:40 · Cuidador/a Caro".
  - En el detalle la hora es la de `formatRelativeTime`, como en su tarjeta.
- Varias fotos:
  - Flechas "Foto anterior" / "Foto siguiente" a los lados, swipe en móvil y ← → en teclado.
  - Contador "2 / 3" sobre el pie.
  - Con una sola foto no hay flechas ni contador.
  - Al cerrar, el carrusel no cambia de foto.
- Cerrar con la X, con Esc o tocando el fondo oscuro fuera de la foto. Al cerrar, el foco vuelve a la foto que lo abrió.
- Mientras está abierto, la página de fondo no hace scroll.
- "Descargar": Server Action `getPhotoDownloadUrl(postId, position)` que firma la foto con `download` por 60 s. El cliente descarga con esa URL sin salir de la página. Disponible para todos los roles que ven el post.
- Error al cargar la foto (p. ej. la URL firmada venció): mensaje dentro del visor en lugar de la foto.
- `FeedPhoto` suma `position`.
- Lógica de scroll del carrusel (índice activo e ir a una foto) extraída a un hook que comparten `PhotoCarousel` y `PhotoViewer`.
- Accesibilidad: nombres accesibles, foco visible, área táctil de 44×44 px, `aria-live` en el contador y `motion-reduce`.
- Marcar el punto 5 de `references/documents/pantallas-pendientes.md`.

**Fuera de alcance (para specs futuras):**

- Que el botón atrás del navegador o de Android cierre el visor (hoy sale de la pantalla).
- Zoom (pellizcar o doble toque).
- URL propia del visor o compartir el link de una foto.
- Descargar todas las fotos del post de una vez.
- Restringir la descarga por rol.
- Enlaces desde `/family/summary` y la tarjeta completa del feed (siguen en el BACKLOG).
- Miniaturas de las otras fotos dentro del visor.

---

## Modelo de datos

### Base de datos

No hay tablas, policies ni migraciones nuevas. La lectura de `post_photos` y la firma en Storage pasan por `can_view_post` (SPEC 22).

### Tipos de la app

```ts
// feed/types.ts
export type FeedPhoto = {
  url: string; // url firmada
  width: number | null;
  height: number | null;
  position: number; // post_photos.position
};

export type PhotoViewerPost = {
  postId: string;
  heading: string;   // "Don Luis"
  subtitle: string;  // "09:40 · Cuidador/a Caro" | "09:40 · publicado por ti"
  caption: string;   // body del post
};

export type PhotoDownloadResult =
  | { status: "ok"; url: string }
  | { status: "error" };
```

- `toPhotos` de `fetch-feed-page.ts` copia `position` de cada fila.
- `PhotoCarousel` recibe una prop nueva `viewerPost: PhotoViewerPost`. La pasan `PostCard`, `FamilyPostCard` y `PostDetailView` con el mismo heading y subtítulo que muestran.

### Server Action

**`feed/actions/get-photo-download-url.ts`:** `getPhotoDownloadUrl(postId: string, position: number): Promise<PhotoDownloadResult>`.

- Valida con `getCurrentUser()` que haya un usuario activo. Si no hay, devuelve `error`.
- `postId` tiene que ser un UUID y `position` un entero `>= 0`. Si no, devuelve `error` sin consultar.
- Lee con el cliente de sesión: `post_photos.select("url, post:posts(published_at)").eq("post_id", postId).eq("position", position).maybeSingle()`. Sin fila (no existe o la RLS no deja verla) → `error`.
- Firma con `storage.from("post-photos").createSignedUrl(url, 60, { download: fileName })`. Error → `error`.
- `fileName`: `foto-{aaaa-mm-dd}-{position + 1}.webp`, con la fecha de `published_at` en Lima.
- Nunca usa `service_role`.
- Revisar la firma de `createSignedUrl` y su opción `download` en Context7 antes de escribirla.

### Mensajes (`feed/photo-viewer-messages.ts`)

| Clave | Texto |
| --- | --- |
| `aria-label` de la foto en el carrusel | Ver foto N de M en pantalla completa |
| `aria-label` del visor | Foto N de M |
| Botón cerrar | Cerrar |
| Botón descargar | Descargar |
| Flechas | Foto anterior / Foto siguiente |
| Contador | N / M |
| Error de carga | No se pudo cargar la foto. Recarga la página para verla. |
| Toast error al descargar: título | No se pudo descargar la foto |
| Toast error al descargar: descripción | Revisa tu conexión e intenta de nuevo. |

### Componentes

Colores, tamaños y espaciados se toman de `foto.dc.html`.

- `feed/use-photo-track.ts` (`"use client"`): `trackRef`, `activeIndex`, `updateActiveIndex()` y `goTo(index)` (respeta `prefers-reduced-motion`). Sale de `PhotoCarousel` sin cambiar su comportamiento. Acepta un índice inicial.
- `feed/components/PhotoCarousel.tsx`:
  - Usa `use-photo-track`.
  - Cada slide es un `button` con el `aria-label` de la tabla, que abre el visor en esa foto.
  - Renderiza `PhotoViewer` solo mientras está abierto.
- `feed/components/PhotoViewer.tsx` (`"use client"`):
  - `<dialog>` con `showModal()` al montar. `onClose` avisa al carrusel.
  - Track con `scroll-snap` (swipe nativo), una foto por pantalla.
  - Botones de cabecera: círculo de 42 px `bg-white/14` del mockup, dentro de un área de 44×44 px.
  - Flechas: mismo estilo que los botones de cabecera, ocultas con una sola foto, deshabilitadas en los extremos.
  - ← → mueven entre fotos con `goTo`.
  - Clic en el fondo fuera de la foto y de los controles cierra.
  - Bloquea el scroll del fondo con `overflow: hidden` en `<html>` mientras está montado y lo restaura al cerrar.
  - `onError` de la imagen muestra el mensaje de error en el lugar de esa foto.
- `feed/components/PhotoDownloadButton.tsx` (`"use client"`):
  - Llama a `getPhotoDownloadUrl` con la foto activa dentro de una transición. Deshabilitado mientras espera.
  - Con `ok` descarga con un `<a download>` temporal. Con `error` muestra el toast.

---

## Estructura de archivos

```
feed/
  types.ts                         # FeedPhoto + position, PhotoViewerPost, PhotoDownloadResult
  fetch-feed-page.ts               # toPhotos copia position
  photo-viewer-messages.ts         # nuevo
  use-photo-track.ts               # nuevo, sale de PhotoCarousel
  actions/
    get-photo-download-url.ts      # nuevo
  components/
    PhotoCarousel.tsx              # slides como botón, abre el visor, usa el hook
    PhotoViewer.tsx                # nuevo
    PhotoDownloadButton.tsx        # nuevo
    PostCard.tsx                   # pasa viewerPost
    PostDetailView.tsx             # recibe y pasa viewerPost
    PostDetailContent.tsx          # arma viewerPost del equipo
family/components/
  FamilyPostCard.tsx               # pasa viewerPost
  FamilyPostDetailContent.tsx      # arma viewerPost del familiar
references/documents/pantallas-pendientes.md   # punto 5 marcado
specs/BACKLOG.md                   # entrada actualizada y entradas nuevas
```

---

## Plan de implementación

1. **Tipos y lectura.**
   - `position` en `FeedPhoto` y en `toPhotos`. `PhotoViewerPost` y `PhotoDownloadResult`.
   - Prueba: `npm run build` y el feed carga igual que antes.
2. **Hook del carrusel.**
   - Extraer `use-photo-track.ts` y adaptar `PhotoCarousel`.
   - Prueba: en `/` y `/family` el carrusel se mueve igual que antes (flechas, swipe y puntos).
3. **Server Action de descarga.**
   - Consultar Context7 (`createSignedUrl` con `download`).
   - `get-photo-download-url.ts`.
   - Prueba: `npm run build` y `npm run lint`.
4. **Visor.**
   - Cargar el skill `frontend-design:frontend-design`.
   - `photo-viewer-messages.ts`, `PhotoViewer`, `PhotoDownloadButton` y el botón en los slides de `PhotoCarousel`.
   - `viewerPost` en `PostCard`, `FamilyPostCard`, `PostDetailView`, `PostDetailContent` y `FamilyPostDetailContent`.
   - Prueba: desde las cuatro rutas, tocar una foto abre el visor como el mockup.
5. **Prueba real y capturas.**
   - Con un post de varias fotos: navegar con flechas, teclado y swipe; cerrar con X, Esc y fondo; descargar como familiar, staff y admin.
   - Capturas en `.playwright-mcp/` a 1440×900 y 390×844, con una y con varias fotos.
6. **Documentación.**
   - Marcar el punto 5 de `pantallas-pendientes.md`.
   - BACKLOG: ver "Entradas de BACKLOG".

---

## Criterios de aceptación

**Datos y acción**

- [x] No hay migraciones nuevas y `pg_policies` no cambia.
- [x] `FeedPhoto.position` coincide con `post_photos.position` y las fotos siguen ordenadas por `position`.
- [x] `getPhotoDownloadUrl` con un post visible devuelve una URL que descarga el archivo como `foto-aaaa-mm-dd-N.webp`.
- [x] La URL de descarga vence a los 60 s.
- [x] Sin sesión, con un `postId` que no es UUID o con un `position` negativo o no entero, devuelve `error` sin consultar.
- [x] Con un post que el usuario no puede ver, o una `position` inexistente, devuelve `error`.
- [x] La acción no usa `service_role`.

**Visor**

- [x] Tocar una foto en `/`, `/family`, `/posts/{id}` y `/family/posts/{id}` abre el visor en esa foto.
- [x] El visor coincide con `foto.dc.html` a 1440×900: fondo, cabecera, foto centrada y pie.
- [x] La foto se ve entera, sin recortar, en horizontal y en vertical.
- [x] La cabecera muestra el heading y el subtítulo de la tarjeta desde donde se abrió ("publicado por ti" en un post propio del equipo).
- [x] El pie muestra el texto completo del post; si es largo, hace scroll sin achicar la foto.
- [x] Con varias fotos hay flechas, contador "N / M", swipe y ← →. Las flechas se deshabilitan en la primera y en la última.
- [x] Con una sola foto no hay flechas ni contador.
- [x] La X, Esc y el clic en el fondo cierran el visor. Tocar la foto no lo cierra.
- [x] Al cerrar, el foco vuelve a la foto que lo abrió y el carrusel sigue en la misma foto.
- [x] Mientras el visor está abierto, la página de fondo no hace scroll.
- [x] "Descargar" baja la foto activa sin salir de la página y se deshabilita mientras espera.
- [x] Si la descarga falla, aparece el toast "No se pudo descargar la foto".
- [x] Si la foto no carga, se ve "No se pudo cargar la foto. Recarga la página para verla." en su lugar.
- [x] Todos los controles se usan con teclado, con foco visible y nombre accesible.
- [x] El área táctil de cerrar, descargar y las flechas mide al menos 44×44 px.
- [x] Con `prefers-reduced-motion: reduce` el cambio de foto no se anima.
- [x] A 390×844 no hay scroll horizontal y la cabecera, la foto y el pie entran en pantalla.
- [x] El carrusel del feed y del detalle se ve y se mueve igual que antes.

---

## Decisiones tomadas y descartadas

- **Capa (`<dialog>`) en vez de ruta propia.** Reusa las URLs firmadas que ya tiene el carrusel y no vuelve a leer el post. Descartadas: ruta `/posts/[id]/photos/[n]` (otra lectura y otra firma) y rutas interceptadas de Next (más complejidad para lo que se necesita hoy).
- **Se abre desde el feed y desde el detalle**, como enlazan ambos mockups. Descartado: solo desde el detalle.
- **Navegación con flechas, swipe y teclado.** El mockup dibuja una foto; con varias, cerrar y volver a abrir sería incómodo.
- **Descarga con Server Action al tocar.** El feed no firma el doble de URLs. Descartado: firmar al cargar una segunda URL con `download` por foto.
- **Descarga para todos los roles que ven el post.** La RLS ya decide quién ve la foto. Descartado: solo familiares.
- **Nombre del archivo `foto-aaaa-mm-dd-N.webp`.** No depende de nombres de personas ni de habitaciones, que pueden ser datos sensibles en un archivo compartido.
- **Cabecera igual a la tarjeta de origen.** Mantiene "publicado por ti" del equipo (SPEC 29). Descartado: mostrar siempre "hora · autor".
- **Pie con texto completo y scroll propio.** Descartados: 3 líneas con "Ver más" y no mostrar el texto.
- **El botón atrás no cierra el visor.** Evita manejar el historial a mano; queda en el BACKLOG.
- **Mensaje de error dentro del visor** cuando la foto no carga, porque el mockup no cubre ese caso y las URLs firmadas vencen a la hora.

---

## Riesgos identificados

- **URLs firmadas vencidas:** si la página lleva más de una hora abierta, el visor no puede cargar la foto. Se muestra el mensaje de error; renovar las URLs queda fuera de esta spec.
- **Atrás del navegador:** en Android, el gesto de atrás con el visor abierto sale del feed o del detalle en vez de cerrar el visor.
- **Swipe vs. cerrar con el fondo:** un swipe que termina fuera de la foto no debe contar como clic en el fondo. El cierre solo reacciona a un clic cuyo inicio y fin son el fondo.
- **`<a download>` con URL de otro origen:** el navegador ignora el atributo `download` entre orígenes; la descarga depende del `Content-Disposition` que pone la opción `download` de Storage.

---

## Entradas de BACKLOG

- **"Enlaces al detalle de publicación y al visor de foto":** se quita "la foto del post" del **Qué** y se mantiene `[ ]` con lo que falta (resumen y tarjeta completa).
- **Nueva — "El botón atrás no cierra el visor de foto":** origen SPEC 30, `feed/components/PhotoViewer.tsx`.
- **Nueva — "Zoom en el visor de foto":** pellizcar y doble toque; origen SPEC 30.
- **Nueva — "Renovar URLs firmadas vencidas":** feed, detalle y visor muestran fotos rotas tras una hora con la página abierta; origen SPEC 30.
