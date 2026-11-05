# SPEC 01 — Home del admin y staff: feed estático con datos mock

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-11-04
> **Objetivo:** Reemplazar la home `/` del scaffold por una réplica visual del mockup `references/pantallas/feed.dc.html` (feed del admin y del staff), alimentada por datos mock tipados según el esquema de base de datos y adaptada a móvil.

---

## Alcance

**Dentro:**

- `app/page.tsx` renderiza el feed del admin y del staff (sidebar, encabezado, compositor "Comparte un momento…", separador "PUBLICADO HOY" y las 3 tarjetas de post del mockup).
- **Misma pantalla para admin y staff.** Como todo es mock, ambos roles ven exactamente lo mismo; el mock usa un usuario `staff` (Caro Giménez). La única diferencia que ya se modela es la etiqueta del rol bajo el nombre del usuario (`staff` → "Cuidador/a", `admin` → "Administrador/a").
- En escritorio (`lg`, ≥1024px) luce idéntico al mockup a 1440×900.
- En móvil (<1024px): topbar con marca y botón "+", barra de navegación inferior fija, paddings reducidos.
- Tipos basados en las tablas de `references/documents/database-schema.md` (mismos nombres de columna y enums en inglés). El mock son filas de esas tablas; el feed se arma a partir de ellas con una función pura.
- Etiquetas en español traducidas en la UI.
- Paleta del mockup como tokens en `@theme` de `app/globals.css`; utilidades Tailwind en los componentes.
- Fuentes Fredoka y Nunito vía `next/font/google`.
- Todos los enlaces son `<Link href="/">`; se reapuntan cuando existan las pantallas respectivas.
- `<html lang="es">` y `metadata` con título "Casa Nogal".

**Fuera de alcance (para specs futuras):**

- Diferencias por rol entre admin y staff: opciones de menú, acciones disponibles (ej. moderar posts, publicar para toda la guardería) y demás. Se hace en otra spec.
- Supabase, autenticación, roles reales y regla de visibilidad del feed.
- Cualquier interactividad: like, comentar, editar, subir fotos, cerrar sesión.
- Tipos de `reactions` y `comments` (en esta spec solo se usan sus conteos).
- Las demás pantallas (crear publicación, adultos mayores, avisos, mi cuenta, detalle, foto, login).
- Feed de familiares (`familia-feed.dc.html`).
- Route group / layout compartido (el sidebar se extrae a layout cuando otra pantalla lo necesite).
- Dark mode (se elimina el del scaffold).
- Fotos reales: se mantiene el placeholder punteado del mockup.

---

## Modelo de datos

No hay persistencia ni migraciones. Se introducen tipos que reflejan las filas de las tablas del esquema (columnas en `snake_case`, `timestamptz`/`date` como `string` ISO), para reemplazarlos después por los tipos generados de Supabase sin tocar los componentes.

```ts
// shared/database/types.ts — solo las tablas que usa esta spec
export type UserRole = "staff" | "relative" | "admin";
export type UserStatus = "pending" | "active" | "archived";
export type ElderlyStatus = "active" | "archived";
export type PostType = "meal" | "nap" | "activity" | "achievement" | "announcement";
export type PostAudience = "elderly" | "room" | "daycare";

export type Daycare = { id: string; name: string; created_at: string };

export type User = {
  id: string;
  daycare_id: string;
  role: UserRole;
  status: UserStatus;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  notify_on_post: boolean;
  daily_summary_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Room = { id: string; daycare_id: string; is_default: boolean; name: string; created_at: string };

export type Elderly = {
  id: string;
  room_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: ElderlyStatus;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  audience: PostAudience;
  room_id: string | null;     // solo si audience = room
  type: PostType;
  title: string | null;
  body: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type PostElderly = { post_id: string; elderly_id: string };

export type PostPhoto = {
  id: string;
  post_id: string;
  url: string;                // "{post_id}/taller-de-pintura.jpg"
  width: number | null;
  height: number | null;
  position: number;
  created_at: string;
};
```

```ts
// feed/types.ts
// Lo que devolvería la consulta del feed: filas + agregados (conteos).
export type FeedSource = {
  daycare: Daycare;
  currentUser: User;
  elderlyCount: number;                 // conteo de adultos mayores visibles (12)
  todayLabel: string;                   // "martes 17 jun" (fijo en el mock)
  rooms: Room[];
  elderly: Elderly[];
  posts: Post[];
  postElderly: PostElderly[];
  postPhotos: PostPhoto[];
  postCounts: Record<string, { reactions: number; comments: number }>; // por post_id
};

// Modelo de vista que consumen los componentes.
export type FeedPost = {
  id: string;
  type: PostType;
  heading: string;              // "Don Luis" | post.title ("Anuncio general")
  avatarInitial: string | null; // "L"; null → ícono megáfono
  time: string;                 // "14:20"
  publishedByMe: boolean;       // author_id === currentUser.id
  recipientLabel: string;       // "familia de Don Luis" | "habitación Roble" | "toda la guardería"
  body: string;
  photoCaption: string | null;  // "Foto · taller de pintura"
  reactionCount: number;
  commentCount: number;
};
```

`feed/build-feed.ts` es una función pura `buildFeed(source: FeedSource): FeedPost[]`:

- Ordena por `published_at` descendente.
- `heading`: con `audience = elderly`, los nombres para mostrar de los adultos mayores etiquetados (unidos con ", "); si no, `title`.
- Nombre para mostrar de un adulto mayor: `"Don " + first_name` (tratamiento fijo y provisional en esta spec, sin columna en el esquema). Inicial del avatar: primera letra de `first_name`.
- `recipientLabel`: `elderly` → `"familia de " + nombres`; `room` → `"habitación " + room.name`; `daycare` → `"toda la guardería"`.
- `time`: `published_at` formateado `HH:mm` con `Intl.DateTimeFormat("es", { timeZone: "UTC" })`; el mock guarda las horas en UTC (`…T14:20:00Z`).
- `photoCaption`: de la primera foto (`position` menor), `"Foto · "` + nombre del archivo sin extensión con `-` reemplazado por espacios. `null` si no hay fotos.
- Conteos desde `postCounts`.

`feed/mock-feed.ts` exporta un `FeedSource`: daycare "Casa Nogal", usuario staff Caro Giménez (`active`), Don Luis (`first_name = "Luis"`) en una habitación, y los 3 posts del mockup en el mismo orden, con los mismos textos, horas, contadores (3/1, 5/2, 8/0) y audiencias (`elderly`, `elderly`, `daycare` con `title = "Anuncio general"`). Los 3 posts tienen `author_id` de Caro.

```ts
// feed/post-type-styles.ts — etiqueta UI + colores del badge, Record<PostType, …>
achievement:  { label: "Logro",     bg: "#CFEBD8", fg: "#3E9B6C" }
activity:     { label: "Actividad", bg: "#C7E7F1", fg: "#2E89A6" }
announcement: { label: "Anuncio",   bg: "#CCD8F4", fg: "#4E72C8" }
nap:          { label: "Siesta",    bg: "#E7DCF6", fg: "#7B5FC0" } // de crear-publicacion.dc.html
meal:         { label: "Comida",    bg: "#F3E9CC", fg: "#9A7B1E" } // fondo provisional
```

```ts
// users/user-role-labels.ts — Record<UserRole, string>
staff: "Cuidador/a", admin: "Administrador/a", relative: "Familiar"
```

Tokens en `@theme` (nombres finales): `cream #F6ECDF`, `surface #FFFDF9`, `line #ECE0D0`, `line-soft #F0E6D8`, `divider #E7DAC8`, `ink #3F362E`, `body #4A4038`, `muted #A89A8B`, `muted-strong #94887B`, `nav #6E6359`, `label #8A7C6D`, `coral #F2937A`, `coral-soft #FBE3D8`, `coral-strong #D9583C`, `coral-icon #E0654A`, `coral-link #C5503A`, `photo #F4ECE1`, `photo-line #DBCDBA`, `photo-ink #B0A290`, `elderly-bg #A9D9E8`, `elderly-ink #1F7A93`. Fuentes: `--font-display` (Fredoka) y `--font-sans` (Nunito).

---

## Estructura de archivos

```
app/
  layout.tsx            # fuentes, lang="es", metadata
  globals.css           # tokens @theme, sin dark mode
  page.tsx              # compone Sidebar + MobileNav + FeedView
feed/
  types.ts              # FeedSource, FeedPost
  mock-feed.ts          # FeedSource con filas del esquema
  build-feed.ts         # FeedSource → FeedPost[]
  post-type-styles.ts
  components/
    FeedView.tsx        # encabezado + compositor + separador + lista
    FeedHeader.tsx
    PostComposerLink.tsx
    PostCard.tsx
    PostTypeBadge.tsx
    PostAuthorAvatar.tsx  # inicial del adulto mayor o ícono megáfono
users/
  user-role-labels.ts
shared/
  database/
    types.ts            # enums y filas de las tablas del esquema
  components/
    Avatar.tsx
    icons/              # SVG del mockup como componentes (Home, People, Bell, User, Plus, Camera, Heart, Comment, Image, Megaphone, Sun, Logout)
    navigation/
      nav-items.ts      # Feed, Adultos mayores, Avisos, Mi cuenta (todos href "/"); iguales para admin y staff por ahora
      Sidebar.tsx       # visible solo en lg
      MobileTopBar.tsx  # visible solo < lg
      MobileBottomNav.tsx
```

Todos son Server Components.

---

## Plan de implementación

1. **Base visual.** `app/globals.css` con tokens y estilos de `body` del mockup (fondo crema, Nunito, scrollbar); `app/layout.tsx` con Fredoka/Nunito, `lang="es"` y metadata. `app/page.tsx` temporal con un título. Prueba: `npm run dev` muestra fondo crema y Nunito.
2. **Íconos y Avatar.** `shared/components/icons/*` con los paths SVG exactos del mockup y `shared/components/Avatar.tsx`. Prueba: `npm run lint` sin errores.
3. **Tipos, mock y armado del feed.** `shared/database/types.ts`, `users/user-role-labels.ts`, `feed/types.ts`, `feed/post-type-styles.ts`, `feed/mock-feed.ts` y `feed/build-feed.ts`. Prueba: `npm run build` compila.
4. **Sidebar de escritorio.** `nav-items.ts` y `Sidebar.tsx` (marca, botón "Nueva publicación", nav con "Feed" activo, usuario con etiqueta de rol y botón cerrar sesión), montado en `app/page.tsx`. Prueba: coincide con el sidebar del mockup a 1440px.
5. **Encabezado, compositor y separador.** `FeedHeader`, `PostComposerLink` y `FeedView` sin posts. Prueba: coincide con la parte superior del mockup.
6. **Tarjetas de post.** `PostTypeBadge`, `PostAuthorAvatar`, `PostCard` (destinatario, cuerpo, placeholder de foto opcional, contadores, "Editar" solo si `publishedByMe`) y la lista en `FeedView` a partir de `buildFeed(mockFeed)`. Prueba: las 3 tarjetas coinciden con el mockup.
7. **Adaptación móvil.** `MobileTopBar` y `MobileBottomNav` (< `lg`), sidebar oculto bajo `lg`, padding lateral 16px, título 24px, placeholder de foto 160px, padding inferior para no tapar contenido con la barra. Prueba: a 390×844 no hay scroll horizontal y la barra inferior no tapa la última tarjeta.
8. **Capturas de verificación.** Con Playwright, capturar el mockup y `http://localhost:3000` a 1440×900 y la home a 390×844, guardando en `.playwright-mcp/`.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [x] La consola del navegador no muestra errores ni warnings de hidratación en `/`.
- [x] A 1440×900, la captura de `/` y la de `feed.dc.html` no muestran diferencias visibles de layout, colores, tipografía, textos ni íconos al compararlas lado a lado.
- [x] Los tipos de `shared/database/types.ts` tienen las mismas columnas y valores de enum que `database-schema.md` para las tablas que incluyen.
- [x] Los textos, horas, contadores (3/1, 5/2, 8/0) y destinatarios de las 3 tarjetas salen de `feed/mock-feed.ts` vía `buildFeed`, no del JSX.
- [x] Las etiquetas "LOGRO", "ACTIVIDAD", "ANUNCIO" se obtienen de `post-type-styles.ts` a partir de `achievement`, `activity`, `announcement`.
- [x] "Cuidador/a" sale de `user-role-labels.ts` a partir de `role = "staff"`; cambiar el `role` del usuario mock a `admin` muestra "Administrador/a" sin tocar componentes.
- [x] Cambiar un texto en `mock-feed.ts` cambia la UI sin tocar componentes.
- [x] Todos los enlaces de la página son `<Link>` con `href="/"`.
- [x] A ≥1024px se ve el sidebar y no la topbar ni la barra inferior; a <1024px ocurre lo contrario.
- [x] A 390×844 no hay scroll horizontal y la última tarjeta queda visible por encima de la barra inferior.
- [x] No existe `"use client"` en ningún archivo de esta feature.
- [x] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** una sola pantalla de feed para admin y staff. Con datos mock no hay diferencias; las diferencias de menú y acciones por rol van en otra spec.
- **Sí:** tipos que reflejan las filas del esquema (`snake_case`, enums en inglés) + modelo de vista `FeedPost` armado con `buildFeed`. Deja el reemplazo por Supabase limitado a la fuente de datos.
- **No:** un tipo de vista con datos ya formateados escrito a mano en el mock. Se alejaría del esquema y habría que rehacerlo con Supabase.
- **Sí:** conteos de reacciones y comentarios como agregados (`postCounts`), igual que los devolvería una consulta con `count`. Los tipos de `reactions` y `comments` llegan con la spec de interactividad.
- **Sí:** "Don Luis" se guarda como `first_name = "Luis"` y el tratamiento "Don" se agrega en `buildFeed` (fijo, provisional). El esquema no tiene columna para el tratamiento.
- **Sí:** el texto del placeholder de foto sale del nombre del archivo en `post_photos.url`. Solo mientras haya placeholder; el esquema no tiene `caption`.
- **Sí:** horas en UTC en el mock y formateadas con `timeZone: "UTC"`. Determinista y sin warnings de hidratación; la zona horaria real se define con Supabase.
- **Sí:** `elderlyCount` y `todayLabel` fijos en el mock. Garantizan igualdad con el mockup.
- **No:** fecha real calculada. Rompería la comparación con el mockup.
- **Sí:** todos los enlaces a `/` con `<Link>`. Decisión del usuario; se reapuntan cuando existan las pantallas.
- **No:** enlazar a rutas futuras (404) ni `href="#"`.
- **Sí:** sidebar en `shared/components/navigation`, montado desde `app/page.tsx`.
- **No:** route group con layout. Se hará cuando exista una segunda pantalla.
- **Sí:** Tailwind con tokens en `@theme` y Fredoka/Nunito vía `next/font/google`.
- **No:** estilos inline copiados. Poco mantenibles.
- **Sí:** página 100% estática (Server Components). No hay interacción en esta spec.
- **Sí:** móvil con topbar + barra inferior fija bajo `lg`. Sin JS; ningún mockup define móvil, así que es diseño propio.
- **No:** drawer hamburguesa (requiere estado de cliente) ni sidebar apilado (ocupa demasiado).
- **Sí:** `meal` y `nap` incluidos en `PostType` y en `post-type-styles.ts` aunque el mock no los use. `nap` toma colores de `crear-publicacion.dc.html`; el fondo de `meal` (`#F3E9CC`) es provisional porque no aparece en ningún mockup.
- **Sí:** se elimina el dark mode y las fuentes Geist del scaffold.
- **Sí:** verificación con capturas de Playwright en `.playwright-mcp/`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `next/font` renderiza Fredoka/Nunito con métricas levemente distintas a Google Fonts CSS | Comparar capturas; aceptar diferencias sub-píxel, no de layout. |
| Tokens con nombres que choquen con utilidades de Tailwind (`body`, `line`) | Si colisionan, prefijar (`text-body` es válido; revisar en el paso 1). |
| Diseño móvil sin referencia visual | Queda acotado a esta spec; se ajusta cuando haya mockup móvil. |
| `cacheComponents` activo en `next.config.ts` | Página sin datos dinámicos; revisar `node_modules/next/dist/docs/` si aparece algún warning. |
| Los tipos escritos a mano se desalinean de los generados por Supabase | Se reemplazan por los generados en la spec de Supabase; los componentes solo dependen de `FeedPost`. |
| Tratamiento "Don" fijo no sirve para otros adultos mayores | Provisional; se resuelve en una spec futura (columna en el esquema o regla en la UI). |

---

## Lo que **no** entra en esta spec

- Diferencias de menú y acciones entre admin y staff.
- Backend (Supabase), auth y RLS.
- Likes, comentarios, edición, fotos reales o cualquier interacción.
- Otras pantallas y el feed de familiares.
- Layout compartido / route group.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
