# SPEC 02 — Adultos mayores: listado y perfil con datos mock

> **Estado:** Approved
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-04
> **Objetivo:** Implementar las pantallas `/elderly` (listado con buscador) y `/elderly/[id]` (perfil) como réplica de `adultos-mayores.dc.html` y `perfil-adulto-mayor.dc.html`, alimentadas por datos mock tipados según el esquema y con un layout de navegación común al feed.

---

## Alcance

**Dentro:**

- Route group `app/(app)/` con un `layout.tsx` común (sidebar, topbar móvil, barra inferior) que usan el feed, el listado y el perfil.
- El feed de SPEC 01 se mueve a `app/(app)/page.tsx` sin cambios visuales.
- La opción activa del menú se resuelve con la URL (`usePathname`) en un `NavLink` cliente. "Feed" → `/`, "Adultos mayores" → `/elderly`.
- `/elderly`: encabezado "GESTIÓN / Adultos mayores", botón "Agregar adulto mayor", buscador, separador "ACTIVOS · N adultos mayores" y grilla de tarjetas.
- Solo se listan adultos mayores con `status = active`, en el orden del array mock.
- Tarjeta: avatar con inicial y color, nombre completo, "edad · familiares" e indicador a la derecha (alergia, VINCULAR o flecha). Enlaza a `/elderly/[id]`.
- Buscador funcional en cliente: filtra por `full_name` sin distinguir mayúsculas ni tildes. El conteo se actualiza. Estado vacío si no hay coincidencias.
- `/elderly/[id]`: enlace "Volver a Adultos mayores", encabezado (avatar, nombre, "edad · Habitación X", botón Editar), bloque "Alergias y notas", tabla de datos (nacimiento, habitación, ingreso), botón "Resumen del día" y tarjeta "FAMILIARES VINCULADOS" con familiares activos, invitaciones pendientes y "Vincular otro familiar/tutor".
- Perfil dinámico para los 8 adultos mayores del mock. Un `id` inexistente → `notFound()`.
- Admin y staff ven exactamente lo mismo (igual que SPEC 01).
- En escritorio (`lg`) luce idéntico a los mockups a 1440×900. En móvil: grilla de 1 columna, perfil apilado en una columna.
- Enlaces a pantallas que aún no existen ("Agregar adulto mayor", "Editar", "Resumen del día", "Vincular otro familiar/tutor", "Nueva publicación", "Avisos", "Mi cuenta", cerrar sesión) → `<Link href="/">`.
- `metadata`: título "Adultos mayores · Casa Nogal" en el listado; `"{full_name} · Casa Nogal"` en el perfil.

**Fuera de alcance (para specs futuras):**

- Configuración del sidebar por rol (menú y subtítulo de la familia, sin "Nueva publicación"). En esta spec solo existe la del personal.
- Ocultar "Agregar adulto mayor" y "Editar" para el staff (en el esquema solo el admin crea y edita). Va en la spec de roles.
- Filtrar el listado del staff a sus asignados (`staff_elderly`).
- Pantallas de agregar/editar adulto mayor, vincular tutor y resumen del día.
- Supabase, autenticación, RLS y la regla real de visibilidad.
- Listado o perfil de adultos mayores archivados.
- Unificar el mock del feed con el de adultos mayores (en el feed Don Luis es "Luis Ramírez").
- Búsqueda por otros campos (habitación, familiar) o en la URL (`?q=`).
- Ordenamiento del listado.
- Consentimiento de fotos en el perfil.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones. Se agregan a `shared/database/types.ts` las tablas que faltan, con las mismas columnas y enums que `database-schema.md`:

```ts
export type RelationshipType = "son" | "daughter" | "guardian";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export type GuardianElderly = {
  id: string;
  relative_id: string;
  elderly_id: string;
  relationship: RelationshipType;
  created_at: string;
};

export type Invitation = {
  id: string;
  elderly_id: string;
  invited_by: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  relationship: RelationshipType;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};
```

```ts
// shared/session/mock-session.ts — guardería y usuario logueado (los usa el layout y el feed)
export const mockSession: { daycare: Daycare; currentUser: User };
```

`feed/mock-feed.ts` toma `daycare` y `currentUser` de `mockSession` en lugar de definirlos (mismos valores).

```ts
// elderly/avatar-tones.ts
export type AvatarTone = "blue" | "pink" | "green" | "yellow" | "purple" | "lilac" | "sky";
export const avatarTones: Record<AvatarTone, { bg: string; fg: string }> = {
  blue:   { bg: "#A9D9E8", fg: "#1F7A93" },
  pink:   { bg: "#F4B8CC", fg: "#C44A7A" },
  green:  { bg: "#B9DEC4", fg: "#3E8B62" },
  yellow: { bg: "#F4DC8E", fg: "#9A7B1E" },
  purple: { bg: "#C9B6E8", fg: "#7B5FC0" },
  lilac:  { bg: "#C9B6E8", fg: "#FFFFFF" }, // familiares
  sky:    { bg: "#A9C7E8", fg: "#FFFFFF" }, // familiares
};
```

```ts
// elderly/types.ts
// Lo que devolvería la consulta: filas del esquema + datos de UI.
export type ElderlySource = {
  referenceDate: string;                  // "2025-06-17": "hoy" fijo para calcular edades
  rooms: Room[];
  elderly: Elderly[];
  relatives: User[];                      // role = relative
  guardianElderly: GuardianElderly[];
  invitations: Invitation[];
  avatarTones: Record<string, AvatarTone>; // por id de elderly, user o invitation; solo UI
};

export type ElderlyIndicator =
  | { kind: "allergy"; label: string }    // "MANÍ"
  | { kind: "link" }                      // "VINCULAR"
  | { kind: "none" };                     // flecha

export type ElderlyListItem = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  summary: string;                        // "78 años · 2 familiares vinculados"
  indicator: ElderlyIndicator;
};

export type LinkedRelative = {
  id: string;                             // id de guardian_elderly o invitation
  fullName: string;
  initial: string;
  tone: AvatarTone;
  detail: string;                         // "Hija · activa" | "Hijo · invitación enviada"
  status: "active" | "pending";
  statusLabel: string;                    // "ACTIVA" | "ACTIVO" | "PENDIENTE"
};

export type ElderlyProfile = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  subtitle: string;                       // "78 años · Habitación Roble"
  medicalNotes: string | null;            // null → no se muestra el bloque
  birthDateLabel: string;                 // "12 mar 1947"
  roomName: string;                       // "Roble"
  enrolledAtLabel: string;                // "feb 2025"
  relatives: LinkedRelative[];
};
```

Reglas (funciones puras):

- `elderly/build-elderly-list.ts` → `buildElderlyList(source): ElderlyListItem[]`. Filtra `status = active`; respeta el orden del array.
- `elderly/build-elderly-profile.ts` → `buildElderlyProfile(source, id): ElderlyProfile | null`.
- **Familiares vinculados** = filas de `guardian_elderly` del adulto mayor (estado `active`) + `invitations` con `status = pending` (estado `pending`). Las invitaciones `accepted`, `expired` y `cancelled` no se cuentan.
- Texto de familiares: 0 → "sin familiares vinculados"; 1 → "1 familiar vinculado"; n → "n familiares vinculados".
- **Indicador:** si hay `allergy_tags`, el primero traducido (gana aunque no tenga familiares); si no, y no tiene familiares, `link`; si no, `none`.
- Edad: años cumplidos entre `birth_date` y `referenceDate`, en "N años".
- Fechas con `Intl.DateTimeFormat("es", { timeZone: "UTC" })`: nacimiento `day numeric, month short, year numeric` → "12 mar 1947"; ingreso `month short, year numeric` → "feb 2025". Se quita el punto final del mes si `Intl` lo agrega.
- Inicial: primera letra de `first_name`.

```ts
// elderly/allergy-labels.ts — Record<string, string>; tag desconocido → tag en mayúsculas
peanut: "MANÍ", lactose: "LACTOSA", gluten: "GLUTEN"
```

```ts
// elderly/relationship-labels.ts — Record<RelationshipType, …>
son:      { label: "Hijo",  activeDetail: "activo", activeBadge: "ACTIVO" }
daughter: { label: "Hija",  activeDetail: "activa", activeBadge: "ACTIVA" }
guardian: { label: "Tutor", activeDetail: "activo", activeBadge: "ACTIVO" }
// pendiente: detail "invitación enviada", badge "PENDIENTE"
```

`elderly/mock-elderly.ts` exporta un `ElderlySource` con los 8 adultos mayores del mockup, en su orden, con fechas de nacimiento que dan las edades del mockup al 2025-06-17 (Luis `1947-03-12` → 78). Luis: habitación Roble, ingreso `2025-02-…`, `allergy_tags = ["peanut"]`, `medical_notes` con el texto del mockup, Lucía Fernández (`daughter`, vínculo en `guardian_elderly`, tono `lilac`) y Diego Fernández (`son`, invitación `pending`, tono `sky`). Alberto: `["lactose"]`. Rosa: sin vínculos ni invitaciones. Los demás: 1 o 2 familiares según el mockup. Colores de avatar en `avatarTones` igual al mockup.

Nueva función compartida: `shared/text/normalize-search.ts` → `normalizeSearch(text)` (minúsculas + sin tildes vía `NFD`).

---

## Estructura de archivos

```
app/
  (app)/
    layout.tsx               # Sidebar + MobileTopBar + <main> + MobileBottomNav, datos de mockSession
    page.tsx                 # feed (movido desde app/page.tsx)
    elderly/
      page.tsx               # listado
      [id]/
        page.tsx             # perfil; generateStaticParams con los 8 ids; notFound()
        not-found.tsx        # "No encontramos a este adulto mayor" + volver al listado
elderly/
  types.ts
  mock-elderly.ts
  build-elderly-list.ts
  build-elderly-profile.ts
  elderly-formatters.ts      # edad, fechas, texto de familiares
  allergy-labels.ts
  relationship-labels.ts
  avatar-tones.ts
  components/
    ElderlyListView.tsx      # encabezado + ElderlySearchList
    ElderlySearchList.tsx    # "use client": input, separador con conteo, grilla, estado vacío
    ElderlyCard.tsx
    ElderlyCardIndicator.tsx
    ElderlyProfileView.tsx
    ElderlyProfileHeader.tsx
    MedicalNotesAlert.tsx
    ElderlyDetailsList.tsx
    LinkedRelativesCard.tsx
    LinkedRelativeRow.tsx
shared/
  session/mock-session.ts
  text/normalize-search.ts
  database/types.ts          # + RelationshipType, InvitationStatus, GuardianElderly, Invitation
  components/
    icons/                   # + SearchIcon, ChevronRightIcon, ChevronLeftIcon, AlertIcon (paths del mockup)
    navigation/
      nav-items.ts           # href reales + activePath ("/" | "/elderly" | null)
      NavLink.tsx            # "use client": usePathname para el estado activo
      Sidebar.tsx            # sin prop activeKey; usa NavLink dentro de <Suspense>
      MobileBottomNav.tsx    # ídem
feed/
  mock-feed.ts               # toma daycare y currentUser de mockSession
```

Solo `NavLink.tsx` y `ElderlySearchList.tsx` son Client Components.

---

## Plan de implementación

1. **Sesión mock y layout común.** `shared/session/mock-session.ts`; `feed/mock-feed.ts` la reutiliza. Crear `app/(app)/layout.tsx` y mover el feed a `app/(app)/page.tsx`. Prueba: `/` se ve igual que antes.
2. **Navegación con estado activo por URL.** `nav-items.ts` con `href` y `activePath`; `NavLink.tsx` con `usePathname`; `Sidebar` y `MobileBottomNav` sin `activeKey`, con `NavLink` dentro de `<Suspense>` (fallback sin activo). Prueba: en `/` "Feed" está activo; `npm run build` compila.
3. **Tipos y etiquetas.** Tipos nuevos en `shared/database/types.ts`, `elderly/types.ts`, `avatar-tones.ts`, `allergy-labels.ts`, `relationship-labels.ts`, `elderly-formatters.ts`, `shared/text/normalize-search.ts`. Prueba: `npm run build`.
4. **Mock y builders.** `mock-elderly.ts`, `build-elderly-list.ts`, `build-elderly-profile.ts`. Prueba: `npm run build`.
5. **Íconos.** `SearchIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `AlertIcon` con los paths del mockup. Prueba: `npm run lint`.
6. **Listado estático.** `app/(app)/elderly/page.tsx`, `ElderlyListView`, `ElderlyCard`, `ElderlyCardIndicator` y `ElderlySearchList` mostrando todo sin filtrar. Prueba: coincide con `adultos-mayores.dc.html` a 1440px y "Adultos mayores" queda activo.
7. **Buscador.** Filtro en `ElderlySearchList` con `normalizeSearch`, conteo singular/plural ("1 adulto mayor") y estado vacío ("No encontramos adultos mayores con “{texto}”."). Input `type="search"` con `aria-label="Buscar adulto mayor"`. Prueba: "jose" no filtra a nadie, "jorge" deja 1, "MÉNDEZ" deja a Rosa.
8. **Perfil.** `app/(app)/elderly/[id]/page.tsx` con `generateStaticParams` (8 ids), `generateMetadata` y `notFound()`; `not-found.tsx`; componentes del perfil. Prueba: `/elderly/<id de Luis>` coincide con `perfil-adulto-mayor.dc.html`; `/elderly/xyz` muestra el not-found.
9. **Adaptación móvil.** Grilla 1 columna bajo `sm`, 2 desde `sm`; perfil en una columna bajo `lg` con la columna derecha a ancho completo; encabezado del listado con botón que no desborda; padding lateral 16px. Prueba: a 390×844 no hay scroll horizontal.
10. **Capturas de verificación.** Con Playwright, capturar ambos mockups y `/elderly` y `/elderly/<id de Luis>` a 1440×900, y ambas rutas a 390×844, en `.playwright-mcp/`.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] La consola del navegador no muestra errores ni warnings de hidratación en `/`, `/elderly` y `/elderly/<id>`.
- [ ] A 1440×900, `/elderly` y `adultos-mayores.dc.html` no muestran diferencias visibles de layout, colores, tipografía, textos ni íconos al compararlas lado a lado.
- [ ] A 1440×900, `/elderly/<id de Luis>` y `perfil-adulto-mayor.dc.html` no muestran diferencias visibles al compararlas lado a lado.
- [ ] `/` se ve igual que al cierre de SPEC 01.
- [ ] El sidebar existe una sola vez, en `app/(app)/layout.tsx`.
- [ ] En `/` está activo "Feed"; en `/elderly` y `/elderly/<id>` está activo "Adultos mayores" (sidebar y barra inferior).
- [ ] Los tipos nuevos de `shared/database/types.ts` tienen las mismas columnas y valores de enum que `database-schema.md`.
- [ ] Nombres, edades, textos de familiares, indicadores, notas, fechas y familiares salen de `mock-elderly.ts` vía los builders, no del JSX.
- [ ] Un adulto mayor con `status = archived` en el mock no aparece en el listado ni en el conteo.
- [ ] Un adulto mayor con alergia y sin familiares muestra la alergia, no VINCULAR.
- [ ] Una invitación `cancelled` o `expired` no cuenta como familiar ni aparece en el perfil.
- [ ] Escribir "mendez" muestra solo a Rosa Méndez y el conteo dice "1 adulto mayor".
- [ ] Escribir un texto sin coincidencias muestra el estado vacío y ninguna tarjeta.
- [ ] Cada tarjeta enlaza a `/elderly/<su id>` y el perfil muestra los datos de ese adulto mayor.
- [ ] Un adulto mayor con `medical_notes = null` no muestra el bloque "Alergias y notas".
- [ ] `/elderly/no-existe` muestra la página not-found con enlace al listado.
- [ ] "Agregar adulto mayor", "Editar", "Resumen del día" y "Vincular otro familiar/tutor" son `<Link href="/">`.
- [ ] Solo `NavLink.tsx` y `ElderlySearchList.tsx` tienen `"use client"`.
- [ ] A 390×844 no hay scroll horizontal en `/elderly` ni en el perfil, y el contenido queda por encima de la barra inferior.
- [ ] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** datos mock tipados según el esquema, como SPEC 01. Supabase va en su propia spec.
- **Sí:** rutas en inglés `/elderly` y `/elderly/[id]`. Decisión del usuario; alineadas con el esquema.
- **Sí:** route group `(app)` con un layout común para los 3 roles (admin, staff y relative). Los mockups del personal y de la familia usan el mismo sidebar; solo cambian el menú, el subtítulo y el botón "Nueva publicación". SPEC 01 dejó el layout para cuando hubiera una segunda pantalla.
- **Sí:** el route group separa las pantallas con sidebar de las que no lo tienen (login y activar cuenta irán en `(auth)` en una spec futura).
- **No:** route group `(staff)`. Sugiere un layout exclusivo del personal, y la familia comparte el mismo.
- **No:** cada página monta su sidebar. Duplica código.
- **Sí:** estado activo del menú con `usePathname` en un `NavLink` cliente, dentro de `<Suspense>`. Con `cacheComponents`, `usePathname` puede suspender en rutas dinámicas; el fallback evita que falle el build.
- **Sí:** `activePath` en `nav-items.ts`. "Avisos" y "Mi cuenta" siguen en `/` y no deben marcarse activos en el feed.
- **Sí:** buscador en cliente sobre la lista ya armada. Lista chica y respuesta inmediata.
- **No:** búsqueda vía `?q=`. Navega en cada tecleo y complica `cacheComponents`.
- **Sí:** perfil dinámico con `generateStaticParams` para los 8 ids. Con `cacheComponents` debe devolver al menos un param.
- **Sí:** enlaces a pantallas inexistentes → `/`. Consistente con SPEC 01.
- **Sí:** admin y staff ven lo mismo, incluidos "Agregar" y "Editar". Igual al mockup; la diferencia por rol va en otra spec.
- **Sí:** color de avatar fijo por id en el mock (`avatarTones`). El esquema no guarda color y el mockup no sigue un ciclo simple.
- **No:** color por hash o por posición. No coincide con el mockup.
- **Sí:** la alergia gana sobre VINCULAR. Es información de seguridad.
- **Sí:** "familiares vinculados" = vínculos en `guardian_elderly` + invitaciones `pending`. Así Luis tiene 2 (Lucía activa y Diego pendiente), como en el mockup.
- **Sí:** etiquetas con género según `relationship` ("activa"/"ACTIVA" para `daughter`, "activo"/"ACTIVO" para el resto).
- **Sí:** edad contra `referenceDate = 2025-06-17`, la fecha del feed. Determinista y sin warnings de hidratación.
- **No:** fecha real. Las edades dejarían de coincidir con el mockup.
- **Sí:** mock separado (`elderly/mock-elderly.ts`); el feed no cambia sus datos. Se unifican con Supabase.
- **Sí:** `mockSession` compartido para guardería y usuario. Lo necesita el layout y no debe depender del mock del feed.
- **Sí:** orden del listado = orden del array mock. El mockup no sigue un criterio visible.
- **Sí:** cambia lo decidido en SPEC 01: el enlace "Adultos mayores" apunta a `/elderly` y existen dos Client Components.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `usePathname` suspende con `cacheComponents` en `/elderly/[id]` | `NavLink` dentro de `<Suspense>` con fallback sin estado activo; revisar `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`. |
| `Intl` agrega punto al mes corto ("mar.") según el runtime | El formateador lo quita; se verifica con la captura. |
| Mover el feed al route group rompe algo de SPEC 01 | Paso 1 aislado; comparar `/` con la captura de SPEC 01. |
| Dos mocks con el mismo Don Luis y apellidos distintos | Aceptado y documentado; se unifica con Supabase. |
| Diseño móvil sin referencia visual | Acotado a esta spec; se ajusta cuando haya mockup móvil. |

---

## Lo que **no** entra en esta spec

- Diferencias por rol (ocultar botones, filtrar por asignados).
- Agregar/editar adulto mayor, vincular tutor, resumen del día.
- Backend (Supabase), auth y RLS.
- Adultos mayores archivados.
- Unificar mocks.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
