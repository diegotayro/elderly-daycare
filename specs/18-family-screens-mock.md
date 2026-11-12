# SPEC 18 — Pantallas del familiar: feed, resumen del día y mi cuenta con datos mock

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 08, SPEC 11, SPEC 17
> **Fecha:** 2026-11-11
> **Objetivo:** Crear el área del familiar (`/family`, `/family/summary`, `/family/account`) que replica `familia-feed.dc.html`, `resumen-dia.dc.html` y `familia-cuenta.dc.html` con datos mock, con su propio layout y menú, y reemplazar `/family-pending` como destino del rol `relative`.

---

## Por qué esta spec

`/family-pending` era una pantalla temporal ("Vuelve pronto") hasta tener las pantallas del familiar (BACKLOG, SPEC 11). Esta spec la reemplaza por las tres pantallas del mockup. Por ahora son casi solo UI: el nombre, el email y el parentesco del pie del sidebar salen de datos reales, y el resto (adultos mayores, publicaciones, parentesco y resumen) sale de un mock que se irá eliminando al conectar cada pantalla a Supabase.

El área del familiar va en su propio route group `(family)`, separado del `(app)` del equipo, pero reusa los mismos componentes de navegación con parámetros. Comparación de los mockups (`feed`, `mi-cuenta` y `avisos` contra `familia-feed`):

- **Igual:** estructura del sidebar (aside de 248px, marca, nav y pie con usuario y logout) y del `main`.
- **Staff/admin:** botón "Nueva publicación", subtítulo "Personal", 4 ítems y rol bajo el nombre. El layout monta `NewPostDialogProvider`.
- **Familiar:** sin botón, subtítulo "Familia", 3 ítems (Feed, Resumen del día, Mi cuenta), "Hija de Don Luis" bajo el nombre y avatar lila. Aunque el mockup tiene dos adultos mayores (Luis y Carmen), el sidebar nombra solo a uno. Esta spec cambia ese texto por el parentesco real (ver "Pie del sidebar del familiar").

---

## Alcance

**Dentro:**

- **Route group `(family)`** con `layout.tsx` propio (sidebar, `MobileTopBar` y `MobileBottomNav` en variante `family`, sin `NewPostDialogProvider`) y `loading.tsx` que devuelve `null` (igual que `(app)`).
- **Rutas y títulos:**
  - `/family` → "Feed · Casa Nogal".
  - `/family/summary` → "Resumen del día · Casa Nogal".
  - `/family/account` → "Mi cuenta · Casa Nogal".
  - Cada página llama a `requireRelativeUser()`.
- **Redirecciones:**
  - `RELATIVE_HOME` pasa a `/family`. Login (`sign-in.ts`) y activación (`activate-account.ts`) ya lo usan.
  - `requireTeamUser()` redirige al `relative` a `RELATIVE_HOME`.
  - `requireRelativeUser()` redirige al equipo a `TEAM_HOME`.
  - Se usan las constantes de `home-routes.ts`, no literales.
- **Eliminar** `app/(auth)/family-pending/` (`page.tsx` y `loading.tsx`) y `auth/components/FamilyPendingView.tsx`.
- **`CurrentUser` incluye `first_name`** (se agrega al `select` de `getCurrentUser`) para el saludo "Hola, {first_name}". No cambia la DB.
- **Navegación parametrizada por variante** (`team` | `family`):
  - `Sidebar`, `MobileTopBar`, `MobileBottomNav`, `BrandLink`, `CurrentUserSidebar` y `CurrentUserMobileTopBar` reciben `variant`.
  - La variante define los ítems del menú, el subtítulo de la marca ("Personal" / "Familia"), el `href` de la marca (`/` / `/family`), si se muestra "Nueva publicación" (sidebar y "+" móvil) y los colores del avatar del usuario.
  - La variante `team` se ve exactamente igual que hoy.
- **Menú `family`:**
  - Feed → `/family` (activo solo en `/family` exacto).
  - Resumen del día → `/family/summary`, con `SunIcon`.
  - Mi cuenta → `/family/account`.
- **Pie del sidebar del familiar (datos reales):**
  - Nombre real (`full_name`).
  - Detalle calculado desde `guardian_elderly` + `elderly` del familiar en sesión:
    - Solo cuenta adultos mayores `active`, ordenados por `guardian_elderly.created_at` (el primero vinculado va primero).
    - Se usa `elderly.first_name`. No lleva "Don/Doña" porque el esquema no tiene género.
    - Parentesco: si todos los vínculos tienen el mismo `relationship`, se usa su `relationshipLabels[...].label` ("Hija", "Hijo", "Tutor"). Si difieren, se usa "Familiar".
    - 1 adulto mayor → "Hija de Luis".
    - 2 → "Hija de Luis y Carmen".
    - Más de 2 → los 2 primeros y "y N más": "Hija de Luis, Carmen y 2 más".
    - Ninguno activo vinculado → "Familiar" (el rol, como el equipo muestra el suyo).
    - Si no entra en el ancho, se corta en una línea con "…" y el texto completo va en `title`.
  - Avatar `avatarTones.lilac`.
  - Logout real (`SignOutForm`, como hoy).
- **Pie del sidebar del equipo:** sin cambios. Staff y admin siguen mostrando su rol ("Staff" / "Admin").
- **Feed familiar (`/family`)**, igual al mockup:
  - Encabezado: "TU FAMILIA", "Hola, {first_name}" y "Así va el día de hoy".
  - Chips de adulto mayor: Luis, Carmen y Todos (avatar con su tono). Son interactivos, con estado local y Luis seleccionado al inicio. Cada chip es un `<button type="button" aria-pressed>`. Seleccionado: fondo/borde `#3F362E` y texto blanco. No seleccionado: estilo del mockup.
  - Separador "HOY · {todayLabel}" ("MARTES 17 JUN", fijo en el mock).
  - Tarjetas:
    - Avatar del adulto mayor (inicial y tono) o megáfono si es un anuncio general.
    - Título ("Don Luis" / "Anuncio general") y subtítulo "{hora} · {authorLabel}" ("14:20 · Cuidador/a Caro").
    - `PostTypeBadge`, cuerpo y, si hay foto, el placeholder de foto.
    - Contadores de corazón y comentarios, solo visuales.
    - Sin "Para:" ni "Editar".
  - Filtro: un adulto mayor muestra sus posts más los generales (sin adultos mayores etiquetados). "Todos" muestra todos. Se conserva el orden del mock (hora descendente).
  - Si el filtro deja la lista vacía, se muestra una tarjeta con el estilo del mockup y el texto "Todavía no hay publicaciones de hoy.".
  - Las tarjetas **no** enlazan al detalle (`<article>`), y la foto tampoco.
- **Resumen del día (`/family/summary`)**, igual al mockup:
  - Chips Luis y Carmen (sin "Todos"), interactivos, con estado local y Luis al inicio. Son independientes de los del feed.
  - Hero con degradado: "RESUMEN DEL DÍA", "El día de {displayName}" y `dateLabel` ("martes 17 de junio").
  - Tres contadores con sus íconos y colores:
    - Comidas: `#F7E7A6` / `#9A7B1E`.
    - Siesta: `#E7DCF6` / `#7B5FC0`, con formato `1h 30` desde minutos.
    - Momentos: `#C7E7F1` / `#2E89A6`.
  - Tarjeta "Ánimo del día" con ícono de carita y el texto del mock.
  - "LO MÁS LINDO DE HOY": lista con punto de color según `postTypeStyles` del tipo, título en ese color y "{hora} · {detalle}". No son enlaces.
- **Mi cuenta familiar (`/family/account`)**, igual al mockup:
  - Encabezado "AJUSTES" / "Mi cuenta".
  - Tarjeta de perfil:
    - Avatar lila de 64px.
    - Nombre y email reales de la sesión.
    - Detalle "{Parentesco} de {fullName 1} y {fullName 2}" del mock ("Hija de Luis Fernández y Carmen Ruiz"). Sigue en mock, a diferencia del sidebar.
    - Botón "Editar" sin acción.
  - "MIS ADULTOS MAYORES": por cada adulto mayor, avatar de 42px, nombre completo, "{edad} · Habitación {sala}", "Fotos" e indicador de consentimiento.
  - **Indicador de fotos no interactivo:**
    - Se dibuja como el switch del mockup: verde `#5FB97E` con perilla a la derecha si `photoConsent`, y beige `#E4D6C4` con perilla a la izquierda si no.
    - No es botón ni recibe foco. La forma es `aria-hidden` y lleva texto solo para lectores: "Fotos permitidas" / "Fotos no permitidas".
  - "NOTIFICACIONES": reusa `NotificationToggle` (estado local, sin guardar) con el copy del mockup familiar. "Avisos cuando se publica algo" toma su valor inicial de `notify_on_post`, y "Resumen diario (19:00)", de `daily_summary_enabled` (sesión real).
  - "Cambiar contraseña" y "Ayuda y soporte" reusan `AccountActionsCard` (botones sin acción).
  - "Cerrar sesión" real con `SignOutForm`, como en `/account`.
- **Reutilización en `account/`:**
  - `AccountView` acepta un slot (`children`) entre el perfil y las notificaciones, y la lista de preferencias que debe mostrar.
  - `ProfileCard` acepta colores de avatar y un texto de detalle (en vez de `roleLabel`).
  - `NotificationSettingsCard` recibe las preferencias por props.
  - `/account` del equipo se ve igual que hoy.
- **Íconos nuevos** en `shared/components/icons/` con los trazos del mockup: comida, luna, estrella y carita.
- **Escritorio (`lg` en adelante):** cada pantalla igual a su mockup a 1440×900. Contenedores de 720px (feed), 700px (resumen) y 680px (cuenta), con padding 34px 40px 80px.
- **Móvil (bajo `lg`):** mismo patrón que el staff.
  - `MobileTopBar` con marca "Familia" y sin "+".
  - `MobileBottomNav` con los 3 ítems.
  - Paddings como `FeedView` (`px-4 pt-5 pb-8`).
  - Los chips hacen wrap y los 3 contadores siguen en 3 columnas sin scroll horizontal.
- **Foco visible** en chips, enlaces del menú y botones.
- **BACKLOG:**
  - Se marca resuelta "Eliminar `/family-pending` y reescribir la redirección del familiar".
  - En "Pruebas pendientes con `staff`, `pending`, `archived` y `relative`", se cambia `/family-pending` por `/family`. La entrada sigue `[ ]`.
  - Entradas nuevas (ver Modelo de datos).
- **`pantallas-pendientes.md`:** se marcan los puntos 3, 6 y 7 con "(SPEC 18, datos mock)".

**Fuera de alcance (para specs futuras):**

- Datos reales del familiar (posts visibles por `audience`, `guardian_elderly`, `daily_summaries`, conteos de reacciones y comentarios).
- Detalle de publicación (`detalle-publicacion.dc.html`), foto a pantalla completa (`foto.dc.html`) y los enlaces hacia ellos.
- Reaccionar y comentar.
- Persistir las notificaciones y el cierre real de las acciones de "Mi cuenta" (editar perfil, cambiar contraseña, ayuda).
- Formulario del resumen diario del staff, cron y notificación de las 19:00.
- Selección de adulto mayor compartida entre pantallas o en la URL.
- Ocultar los chips cuando el familiar tiene un solo adulto mayor.
- Menú "Staff" del familiar (punto 25) y "Vincular adulto mayor" (punto 21).
- Menús exclusivos de admin dentro de `(app)`.
- Tratamiento "Don/Doña" calculado (el esquema no tiene género).
- Esqueleto de carga de `(family)`. Va con la spec de carga y streaming, junto con el de `(app)`.
- Dark mode.

---

## Modelo de datos

No hay migraciones ni cambios en `references/documents/database-schema.md`. Se agregan tipos de vista de la feature `family/` con textos fijos, como `notices/`. Al conectar Supabase se reemplazan por builders desde las filas reales.

```ts
// family/types.ts
import type { PostType } from "@/shared/database/types";
import type { AvatarTone } from "@/elderly/avatar-tones";

export type FamilyElderly = {
  id: string;
  firstName: string;   // "Luis" (chip)
  fullName: string;    // "Luis Fernández"
  displayName: string; // "Don Luis", fijo en el mock
  initial: string;     // "L"
  tone: AvatarTone;    // "blue"
  ageLabel: string;    // "78 años", fijo en el mock
  roomName: string;    // "Roble"
  photoConsent: boolean;
};

export type FamilyPost = {
  id: string;
  type: PostType;
  elderlyIds: string[]; // vacío = anuncio general, visible con cualquier filtro
  heading: string;      // "Don Luis" | "Anuncio general"
  time: string;         // "14:20"
  authorLabel: string;  // "Cuidador/a Caro"
  body: string;
  photoCaption: string | null; // "Foto · taller de pintura"
  reactionCount: number;
  commentCount: number;
};

export type SummaryHighlight = {
  id: string;
  type: PostType; // define el color
  title: string;  // "¡Caminó sin su andador!"
  time: string;   // "14:20"
  detail: string; // "Un gran paso, estaba feliz de contarlo."
};

export type DailySummary = {
  elderlyId: string;
  dateLabel: string; // "martes 17 de junio"
  mealsCount: number;
  sleepMinutes: number; // como daily_summaries.sleep_minutes
  momentsCount: number;
  mood: string; // "Contento y participativo"
  highlights: SummaryHighlight[];
};

export type ElderlyFilter = { kind: "all" } | { kind: "elderly"; elderlyId: string };

export type FamilyMock = {
  relationshipLabel: string; // "Hija", de relationshipLabels (solo perfil de "Mi cuenta")
  todayLabel: string;        // "MARTES 17 JUN"
  elderly: FamilyElderly[];
  posts: FamilyPost[];
  summaries: DailySummary[];
};
```

**`family/mock-family.ts` → `mockFamily`:**

- `relationshipLabel`: `relationshipLabels.daughter.label`.
- Adultos mayores:
  - Luis: Fernández, "Don Luis", `blue`, "78 años", Roble, fotos sí.
  - Carmen: Ruiz, "Doña Carmen", `pink`, "75 años", Cedro, fotos sí.
- Posts, en este orden:
  1. Logro de Luis, 14:20 (texto, 3 corazones, 1 comentario).
  2. **Siesta de Carmen, 13:10:** "Durmió una siesta tranquila de una hora después del almuerzo." (2 corazones, 0 comentarios).
  3. Actividad de Luis, 09:40, con foto "Foto · taller de pintura" (5 y 2).
  4. Anuncio general, 07:50, sin adultos mayores (8 y 0).
- Textos de Luis y del anuncio: iguales al mockup.
- Resúmenes:
  - **Luis**, igual al mockup: 3 comidas, 90 min, 4 momentos, "Contento y participativo", y los 2 momentos del mockup.
  - **Carmen** (inventado): 2 comidas, 60 min, 2 momentos y "Tranquila y conversadora". Momento: siesta a las 13:10, "Siesta tranquila", "Durmió una hora después del almuerzo.".

**Funciones puras en `family/`:**

- `filter-family-posts.ts` → `filterFamilyPosts(posts, filter)`.
- `format-sleep-duration.ts` → `formatSleepDuration(90) === "1h 30"`, `formatSleepDuration(60) === "1h"` y `formatSleepDuration(45) === "45 min"`.
- `relationship-text.ts`:
  - `buildSidebarRelationship(links: SidebarElderlyLink[])`, con datos reales:
    - `[]` → "Familiar".
    - `[Luis/daughter]` → "Hija de Luis".
    - `[Luis/daughter, Carmen/daughter]` → "Hija de Luis y Carmen".
    - `[Luis/daughter, Carmen/guardian]` → "Familiar de Luis y Carmen".
    - 4 vínculos `daughter` → "Hija de Luis, Carmen y 2 más".
  - `buildProfileRelationship(mock) === "Hija de Luis Fernández y Carmen Ruiz"` (mock).

```ts
// family/types.ts
import type { RelationshipType } from "@/shared/database/types";

export type SidebarElderlyLink = {
  firstName: string;
  relationship: RelationshipType;
};
```

**Lectura real (`family/fetch-sidebar-elderly-links.ts`, `server-only`):**

- `fetchSidebarElderlyLinks(relativeId): Promise<SidebarElderlyLink[]>` con el cliente de `shared/supabase/server.ts` (sesión del familiar, sin `service_role`).
- Lee `guardian_elderly` (`relationship`, `created_at`) con `elderly!inner(first_name, status)`, filtra por `relative_id` y `elderly.status = 'active'`, y ordena por `created_at` ascendente.
- La RLS ya limita al familiar a sus propios vínculos y a sus adultos mayores. El filtro por `relative_id` lo deja explícito.

**`CurrentUser` (`auth/types.ts`)**: se agrega `first_name` al `Pick<User, ...>` y al `select` de `getCurrentUser`.

**Navegación (`shared/components/navigation/`):**

```ts
export type NavVariant = "team" | "family";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  activePath: string;
  exact: boolean; // true: activo solo en la ruta exacta (inicio de cada área)
  icon: ComponentType<IconProps>;
};

export type NavVariantConfig = {
  items: NavItem[];
  brandSubtitle: "Personal" | "Familia";
  homeHref: "/" | "/family";
  showNewPost: boolean;
  userAvatarColors?: { bg: string; fg: string }; // family → avatarTones.lilac
};

export const navVariants: Record<NavVariant, NavVariantConfig>;
```

**Preferencias (`account/notification-preferences.ts`):**

- `notificationPreferences` pasa a llamarse `teamNotificationPreferences`, con el mismo copy.
- Se agrega `familyNotificationPreferences`:
  - `notify_on_post` → "Avisos cuando se publica algo".
  - `daily_summary_enabled` → "Resumen diario (19:00)".

**Entradas nuevas de `specs/BACKLOG.md`** (sección "Familiar"):

- **Conectar las pantallas del familiar a Supabase.** Hoy salen del mock:
  - posts (visibilidad por `audience`), conteos, autor y hora;
  - adultos mayores vinculados (`guardian_elderly`), parentesco, edad y sala (el pie del sidebar ya es real desde SPEC 18);
  - `photo_consent`;
  - el resumen (`daily_summaries`, que el esquema marca como diferido);
  - `todayLabel` y `dateLabel`.
- **Enlaces al detalle de publicación desde `/family` y `/family/summary`.** Tarjetas, foto e ítems de "Lo más lindo de hoy" no enlazan todavía.
- **Chips con un solo adulto mayor.** Decidir si se ocultan.

---

## Estructura de archivos

```
app/
  (family)/
    layout.tsx                    # Sidebar/MobileTopBar/MobileBottomNav variant="family", sin NewPostDialogProvider
    loading.tsx                   # null, como (app)
    family/page.tsx               # metadata + requireRelativeUser + <FamilyFeedView />
    family/summary/page.tsx       # metadata + requireRelativeUser + <DailySummaryView />
    family/account/page.tsx       # metadata + requireRelativeUser + <FamilyAccountView />
  (app)/layout.tsx                # variant="team" explícito
  (auth)/family-pending/          # ELIMINADO
auth/
  components/FamilyPendingView.tsx # ELIMINADO
  home-routes.ts                  # RELATIVE_HOME = "/family"
  require-user.ts                 # redirige con TEAM_HOME / RELATIVE_HOME
  get-current-user.ts             # + first_name en el select
  types.ts                        # CurrentUser + first_name
family/
  types.ts
  mock-family.ts
  filter-family-posts.ts
  format-sleep-duration.ts
  relationship-text.ts
  fetch-sidebar-elderly-links.ts  # server-only: guardian_elderly + elderly activos del familiar
  components/
    CurrentFamilySidebar.tsx      # getCurrentUser + fetchSidebarElderlyLinks + buildSidebarRelationship → <Sidebar variant="family" />
    ElderlyFilterChips.tsx        # chips (Luis / Carmen / Todos opcional)
    FamilyFeedView.tsx            # encabezado + <FamilyFeedList />
    FamilyFeedList.tsx            # "use client": filtro + chips + separador + tarjetas / vacío
    FamilyPostCard.tsx
    DailySummaryView.tsx          # "use client": chips + resumen del seleccionado
    SummaryHero.tsx
    SummaryStatCard.tsx
    MoodCard.tsx
    SummaryHighlightItem.tsx
    FamilyAccountView.tsx         # AccountView con slot + preferencias familiares
    FamilyElderlyCard.tsx         # "MIS ADULTOS MAYORES"
    PhotoConsentIndicator.tsx
account/
  notification-preferences.ts     # team + family
  components/
    AccountView.tsx               # + children (slot) y preferences
    ProfileCard.tsx               # + avatarColors, detail en vez de roleLabel
    NotificationSettingsCard.tsx  # preferences por props
app/(app)/account/page.tsx        # pasa teamNotificationPreferences y detail = rol
shared/components/
  icons/MealIcon.tsx, MoonIcon.tsx, StarIcon.tsx, SmileIcon.tsx
  navigation/
    nav-items.ts                  # NavItem + navVariants (team, family)
    NavLink.tsx                   # activo según exact
    Sidebar.tsx                   # variant; "Nueva publicación" solo si showNewPost
    MobileTopBar.tsx              # variant; "+" solo si showNewPost
    MobileBottomNav.tsx           # variant
    BrandLink.tsx                 # subtitle y href
    CurrentUserSidebar.tsx        # variant="team"
    CurrentUserMobileTopBar.tsx   # variant
specs/BACKLOG.md
references/documents/pantallas-pendientes.md
```

Solo `FamilyFeedList`, `DailySummaryView` y el `NotificationToggle` que ya existe son `"use client"`. Se reutilizan `Avatar`, `avatarTones`, `PostTypeBadge`, `PostAuthorAvatar` (con tono por adulto mayor), `postTypeStyles`, `relationshipLabels`, `AccountActionsCard`, `SignOutForm` y los tokens de `globals.css`. Los colores que falten (`#F7E7A6`, `#E7DCF6`, `#C7E7F1`, `#9A6A6A`, degradado `#FBE0D2`→`#F9D2DE` y `#F9D2DE`/`#C56486` de la carita) se agregan como tokens.

`PostAuthorAvatar` hoy pinta al adulto mayor con `bg-elderly-bg text-elderly-ink` (azul). Se le agrega un prop opcional de tono para Carmen (`pink`). El feed del staff no cambia.

---

## Plan de implementación

1. **Navegación parametrizada.** `navVariants` en `nav-items.ts`, `exact` en `NavLink`, y `variant` en `Sidebar`, `MobileTopBar`, `MobileBottomNav`, `BrandLink`, `CurrentUserSidebar` y `CurrentUserMobileTopBar`. `(app)/layout.tsx` usa `variant="team"`. Prueba: `npm run build`; `/`, `/elderly`, `/notices` y `/account` se ven igual que antes a 1440×900 y 390×844.
2. **Área `(family)` y redirecciones.**
   - `first_name` en `CurrentUser`.
   - `RELATIVE_HOME = "/family"` y redirecciones con constantes en `require-user.ts`.
   - Layout y `loading.tsx` de `(family)`, `CurrentFamilySidebar` y las tres páginas con su encabezado mínimo.
   - Se eliminan `/family-pending` y `FamilyPendingView`.
   - Prueba: `npm run build`; el menú familiar marca activo cada ítem en su ruta; el admin que abre `/family` termina en `/`; no queda ninguna referencia a `family-pending`.
3. **Mock, funciones y parentesco real del sidebar.**
   - `family/types.ts`, `mock-family.ts`, `filter-family-posts.ts`, `format-sleep-duration.ts` y `relationship-text.ts`.
   - `fetch-sidebar-elderly-links.ts`, y `CurrentFamilySidebar` muestra el detalle real.
   - Prueba: `npm run build`; los 5 casos de `buildSidebarRelationship` devuelven el texto esperado.
4. **Feed familiar.** `FamilyFeedView`, `FamilyFeedList`, `ElderlyFilterChips` y `FamilyPostCard`, más el tono en `PostAuthorAvatar`. Prueba:
   - Luis muestra 3 tarjetas (logro, actividad y anuncio).
   - Carmen muestra 2 (siesta y anuncio).
   - Todos muestra 4.
   - El chip seleccionado tiene `aria-pressed="true"`.
5. **Resumen del día.** Íconos nuevos, `DailySummaryView`, `SummaryHero`, `SummaryStatCard`, `MoodCard` y `SummaryHighlightItem`. Prueba: Luis muestra "1h 30" y 2 momentos; Carmen muestra "1h" y 1 momento.
6. **Mi cuenta familiar.**
   - Refactor de `AccountView`, `ProfileCard`, `NotificationSettingsCard` y `notification-preferences.ts`.
   - `FamilyAccountView`, `FamilyElderlyCard` y `PhotoConsentIndicator`.
   - Prueba: `/account` del equipo sin cambios visibles; los toggles familiares alternan; el indicador no recibe foco.
7. **Móvil.** A 390×844 las tres pantallas no tienen scroll horizontal, el top bar no tiene "+" y el bottom nav muestra los 3 ítems.
8. **Comparación, capturas y documentos.**
   - Las tres pantallas comparadas con su mockup a 1440×900.
   - Capturas en `.playwright-mcp/`: mockup y pantalla de cada una a 1440×900, cada pantalla a 390×844, el feed con "Carmen" y el resumen de Carmen.
   - Actualizar `specs/BACKLOG.md` y `pantallas-pendientes.md`.

---

## Criterios de aceptación

**Build, rutas y redirecciones**

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] La consola no muestra errores ni warnings de hidratación en `/family`, `/family/summary` y `/family/account`.
- [x] Los títulos son "Feed · Casa Nogal", "Resumen del día · Casa Nogal" y "Mi cuenta · Casa Nogal".
- [x] No existen `app/(auth)/family-pending/` ni `FamilyPendingView`, y `grep -r "family-pending"` no encuentra nada en el código (fuera de `specs/` y `references/`).
- [x] `RELATIVE_HOME === "/family"`, y `require-user.ts` redirige con `TEAM_HOME` / `RELATIVE_HOME`, sin literales.
- [ ] Con sesión de admin, abrir `/family`, `/family/summary` o `/family/account` redirige a `/`.
- [ ] Con una cuenta `relative` de prueba (si existe), el login termina en `/family` y abrir `/` o `/account` redirige a `/family`. Si no hay cuenta, se deja indicado en la verificación y queda cubierto por la entrada de pruebas pendientes del BACKLOG.

**Navegación**

- [ ] El área del equipo (`/`, `/elderly`, `/notices` y `/account`) se ve igual que antes de la spec a 1440×900 y a 390×844.
- [x] El sidebar familiar muestra "Casa Nogal" / "Familia", sin "Nueva publicación".
- [x] El menú familiar tiene Feed, Resumen del día y Mi cuenta, y cada uno se marca activo solo en su ruta (Feed no se marca en `/family/summary`).
- [x] El pie del sidebar familiar muestra el `full_name` real, el parentesco real y un avatar lila.
- [x] `buildSidebarRelationship` devuelve "Familiar", "Hija de Luis", "Hija de Luis y Carmen", "Familiar de Luis y Carmen" y "Hija de Luis, Carmen y 2 más" en los 5 casos del Modelo de datos.
- [x] `fetchSidebarElderlyLinks` usa el cliente con sesión, excluye adultos mayores archivados y ordena por `guardian_elderly.created_at`.
- [x] Un detalle largo se corta en una línea con "…" y tiene el texto completo en `title`.
- [x] El pie del sidebar del equipo sigue mostrando el rol ("Staff" / "Admin").

**Feed**

- [x] A 1440×900, `/family` (chip Luis) y `familia-feed.dc.html` no muestran diferencias visibles en el contenido (textos, colores, tipografía, bordes, espaciado y orden). Las únicas diferencias permitidas son el nombre del saludo y el pie del sidebar, que salen de datos reales.
- [x] Los chips son botones con `aria-pressed`, alternan con clic y teclado, y filtran: Luis → 3 tarjetas, Carmen → 2 y Todos → 4.
- [x] Las tarjetas, la foto y los contadores no son enlaces.

**Resumen del día**

- [x] A 1440×900, `/family/summary` (chip Luis) y `resumen-dia.dc.html` no muestran diferencias visibles en el contenido, salvo el pie del sidebar.
- [x] El chip Carmen muestra "El día de Doña Carmen", 2 comidas, "1h", 2 momentos, "Tranquila y conversadora" y 1 momento en la lista.
- [x] `formatSleepDuration` devuelve "1h 30", "1h" y "45 min" para 90, 60 y 45.

**Mi cuenta**

- [x] A 1440×900, `/family/account` y `familia-cuenta.dc.html` no muestran diferencias visibles en el contenido, salvo el nombre, el email y el pie del sidebar, que salen de datos reales.
- [x] El indicador de fotos no es un botón, no recibe foco, tiene texto accesible "Fotos permitidas" / "Fotos no permitidas", y con `photoConsent: false` en el mock se pinta beige con la perilla a la izquierda.
- [x] Los toggles familiares usan el copy del mockup, empiezan según `notify_on_post` y `daily_summary_enabled`, y alternan con clic y teclado.
- [x] "Cerrar sesión" (pantalla y sidebar) cierra la sesión con `SignOutForm`.

**Móvil, cliente y documentos**

- [x] A 390×844 las tres pantallas no tienen scroll horizontal, el top bar no tiene "+" y el bottom nav muestra los 3 ítems del familiar.
- [x] Solo `FamilyFeedList`, `DailySummaryView` y `NotificationToggle` tienen `"use client"` entre los archivos de esta spec.
- [x] No hay migraciones ni cambios en `database-schema.md`.
- [x] `specs/BACKLOG.md`: la entrada de `/family-pending` aparece resuelta en SPEC 18, la de pruebas pendientes menciona `/family` y existen las entradas nuevas.
- [x] Los puntos 3, 6 y 7 de `pantallas-pendientes.md` están marcados.
- [x] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** route group `(family)` separado de `(app)`, con componentes de navegación compartidos por `variant`.
  - Cada layout conoce su menú sin consultar la sesión (sin parpadeo del menú equivocado en el fallback de `<Suspense>`).
  - El familiar no carga el modal de publicación.
  - Cada página pertenece a un solo rol.
- **No:** un solo `(app)` con menú y provider según el rol. Obliga a poner un `if` por rol en el layout y en cada página, y el fallback no sabe qué menú pintar. Los menús exclusivos de admin sí irán en `(app)`, filtrando por rol.
- **Sí:** rutas `/family`, `/family/summary` y `/family/account`. Las URL son en inglés y el prefijo deja claro el área.
- **Sí:** nombre y email desde la sesión real; el resto, desde el mock. Mostrar "Lucía" a cualquier familiar confundiría.
- **Sí:** el parentesco del pie del sidebar es real (`guardian_elderly` + `elderly`). Es decisión del usuario, y las tablas y la RLS ya existen.
  - Hasta 2 nombres y luego "y N más", porque dice cuántos faltan sin ocupar más de una línea.
  - Si los parentescos difieren, se usa "Familiar". **No:** "Hija de Luis · Tutor de Carmen", demasiado largo para 248px. **No:** usar el del primero, que sería falso para los demás.
  - Se usa `first_name` sin "Don/Doña". El mockup dice "Don Luis", pero el esquema no tiene género.
  - Solo se cuentan los adultos mayores `active`, aunque la RLS deje ver a los archivados.
- **No:** perfil de "Mi cuenta" con datos reales en esta spec. Es decisión del usuario; sigue en mock hasta conectar la pantalla.
- **Sí:** chips interactivos con estado local, independientes por pantalla y con Luis al inicio. **No:** selección en la URL, porque exige `searchParams` dentro de `<Suspense>` sin necesidad todavía.
- **Sí:** los anuncios generales (sin adultos mayores) aparecen con cualquier filtro. En el mockup el anuncio aparece con Luis seleccionado.
- **Sí:** mock mínimo de Carmen inventado (1 siesta y un resumen propio) para que los chips tengan efecto visible.
- **Sí:** indicador de fotos no interactivo con la forma del switch del mockup. El flujo dice "solo lectura"; un switch interactivo prometería un cambio que el familiar no puede hacer.
- **Sí:** reusar `NotificationToggle`, `AccountView` y `ProfileCard` con props (copy por rol, slot y detalle). El copy familiar coincide con los campos de la DB.
- **Sí:** tarjetas e ítems sin enlace hasta que exista el detalle (entrada en BACKLOG). **No:** `href="/"` provisional, porque llevaría al familiar a un redirect.
- **Sí:** el "Resumen del día" se maqueta completo con mock, aunque el esquema lo marque como diferido. Es decisión del usuario; la tabla y el cron siguen pendientes.
- **Sí:** guardar `sleepMinutes` (como `daily_summaries.sleep_minutes`) y darle formato en la UI. El formateador sigue sirviendo con datos reales.
- **Sí:** "Don/Doña", la edad y la sala como textos fijos del mock. El esquema no tiene género, y la edad depende de la fecha actual.
- **Sí:** estado vacío del feed ("Todavía no hay publicaciones de hoy."). El mockup no lo cubre, pero un filtro sin resultados no debe quedar en blanco.
- **Sí:** feature `family/` (Screaming Architecture). Al conectar datos reales, cada parte se mueve a su dominio si hace falta.
- **Sí:** se mantiene `requireRelativeUser()`. Ya no es temporal: protege `(family)`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El refactor de navegación y de `account/` cambia el área del equipo | Criterio de comparación del área del equipo antes y después a 1440×900 y 390×844. |
| `requireRelativeUser()` en las páginas genera avisos de datos fuera de `<Suspense>` | Se usa el mismo patrón de `(app)` (`loading.tsx` + guard en la página). Si aparece el aviso, se anota en la entrada de carga y streaming del BACKLOG. |
| No hay cuenta `relative` para probar el login | Las redirecciones se revisan en el código y con la cuenta admin; la prueba con `relative` queda en la entrada de pruebas pendientes. |
| Sin cuenta `relative`, el pie real del sidebar no se puede ver en pantalla | Los textos se prueban con los 5 casos de `buildSidebarRelationship`, y la consulta, revisando el código. La prueba en pantalla queda en la entrada de pruebas pendientes del BACKLOG. |
| El sidebar dice "Hija de Luis y Carmen" mientras las pantallas muestran adultos mayores del mock | Aceptado hasta conectar las pantallas (entrada en BACKLOG). |
| El mock muestra adultos mayores que no son los del familiar real | Aceptado: es solo UI. Entrada en BACKLOG para conectar los datos. |
| Contadores, toggles y chips que parecen guardar o enlazar | Aceptado como en SPEC 07/08; se conectan en specs futuras. |

---

## Lo que **no** entra en esta spec

- Datos reales del familiar y del resumen diario.
- Detalle de publicación, visor de foto, reacciones y comentarios.
- Persistencia de notificaciones y acciones de "Mi cuenta".
- Formulario del resumen del staff, cron y notificaciones.
- Menú "Staff" del familiar y "Vincular adulto mayor".
- Menús exclusivos de admin.
- Esqueleto de carga y dark mode.

Cada una de esas, si llega, va en su propia spec.
