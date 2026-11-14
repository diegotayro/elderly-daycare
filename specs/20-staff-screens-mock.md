# SPEC 20 — Pantallas de Staff para el admin con datos mock

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 04, SPEC 05, SPEC 16, SPEC 18, SPEC 19
> **Fecha:** 2026-11-13
> **Objetivo:** Agregar al menú del admin la opción "Staff", con la lista del personal (`/staff`), el modal "Agregar staff" y el perfil (`/staff/[id]`) para vincular y desvincular adultos mayores, todo con datos mock y estado local.

---

## Por qué esta spec

No hay mockup de gestión de personal (`pantallas-pendientes.md`, puntos 8, 9 y 11). Esta spec diseña esas pantallas a partir de `/elderly` y `/elderly/[id]` (`adultos-mayores.dc.html` y `perfil-adulto-mayor.dc.html`), con las diferencias que pidió el usuario. Es solo UI: los datos salen de un mock y los cambios (agregar, vincular y desvincular) viven en estado local. Lo real y las acciones de estado ya tienen spec asignada (ver "Specs siguientes").

Comparación con las pantallas de adultos mayores:

- **Igual:** contenedores, encabezado "GESTIÓN", buscador, secciones con contador, tarjetas, cabecera del perfil, lista de detalles y tarjeta lateral de vinculados.
- **Lista:** botón "Agregar staff"; la tarjeta no tiene alergias; el indicador "VINCULAR" significa "sin adultos mayores vinculados"; se agrega la sección "PENDIENTES".
- **Perfil:** sin "Resumen del día"; subtítulo "Staff"; detalles Email, Estado y "En el equipo desde"; tarjeta "ADULTOS MAYORES VINCULADOS" con botón "x" para desvincular y "Vincular otro adulto mayor" que abre un selector (no envía correo).

---

## Specs siguientes

Planificadas por el usuario; no van en `specs/BACKLOG.md`.

- **SPEC 21 — Staff contra Supabase:** implementa lo de esta spec con datos reales.
  - Lista y perfil desde `users` (`role = 'staff'`), con el email de `auth.users`.
  - "Agregar staff" invita de verdad (`inviteUserByEmail`, correo y `/crear-contrasena`).
  - Vincular y desvincular con Server Actions sobre `staff_elderly`.
  - Quita el mock, `isLink` y la adulta mayor archivada propia del mock (Teresa).
- **SPEC 22 — Estado del staff (UI):** archivar, reactivar, cancelar invitación y eliminar sin historial.
  - Archivar: avisa qué adultos mayores quedan sin cuidador (`flujos-de-procesos.md`).
  - Cancelar invitación: solo staff `pending`; borra la cuenta (no hay historial), para corregir un email equivocado antes de que lo acepten.
  - Eliminar sin historial: solo si no tiene posts, comentarios ni reacciones; si tiene, solo se archiva (`posts.author_id` no tiene `ON DELETE CASCADE`). Así un staff aceptado por error no queda en "ARCHIVADOS".

---

## Alcance

**Dentro:**

- **Menú "Staff" solo para admin:**
  - Ítem nuevo después de "Adultos mayores", en el sidebar y en la barra inferior móvil, con un ícono nuevo `StaffIcon` (trazo del mismo estilo y grosor que los demás).
  - `NavItem` gana `adminOnly?: boolean`. `Sidebar` y `MobileBottomNav` reciben `isAdmin` (por defecto `false`) y filtran los ítems.
  - `CurrentUserSidebar` pasa `isAdmin` según el rol de la sesión.
  - La barra inferior móvil pasa a leer la sesión: `CurrentUserMobileBottomNav` dentro de `<Suspense>`, con fallback `MobileBottomNav` sin ítems de admin.
  - Staff ve el menú igual que hoy (4 ítems).
- **Acceso:** helper `requireAdminUser()` en `auth/require-user.ts`. Un staff que abre `/staff` o `/staff/[id]` va a `TEAM_HOME` (`/`); un `relative`, a `RELATIVE_HOME`.
- **Rutas y títulos** (patrón de SPEC 19: página no `async`, `*Content` dentro de `<Suspense>` con su esqueleto):
  - `/staff` → "Staff · Casa Nogal".
  - `/staff/[id]` → "{full_name} · Casa Nogal"; si el id no existe en el mock, "Staff · Casa Nogal" y `notFound()`.
- **Lista `/staff`**, igual a `/elderly` salvo:
  - Encabezado "GESTIÓN" / "Staff" y botón "Agregar staff" (mismo estilo que "Agregar adulto mayor").
  - Buscador "Buscar staff…" (`aria-label="Buscar staff"`), por nombre, sin tildes ni mayúsculas (`normalizeSearch`).
  - Secciones "ACTIVOS", "PENDIENTES" y "ARCHIVADOS", con contador "1 persona" / "N personas". Una sección vacía no se muestra.
  - Tarjeta: avatar, nombre completo y resumen del conteo: "Sin adultos mayores vinculados", "1 adulto mayor vinculado" o "N adultos mayores vinculados". Cuenta solo vínculos con adultos mayores activos.
  - Indicador: "ARCHIVADO" en la sección de archivados; "VINCULAR" si no tiene adultos mayores activos vinculados; si no, la flecha. Se reusa `ElderlyCardIndicator`.
  - La tarjeta enlaza a `/staff/{id}`, salvo las agregadas en esta sesión desde el modal (ver Decisiones).
  - Sin coincidencias en la búsqueda: mismo estado vacío que `/elderly`, con el texto "No encontramos a nadie del staff con ese nombre.".
- **Modal "Agregar staff"** (mismo `<dialog>` y estilo que "Agregar adulto mayor"):
  - Título "Agregar staff". Campos, todos obligatorios: "Nombres", "Apellidos", "Email" y "Confirmar email".
  - Validación en cliente al guardar, con el mensaje bajo cada campo y foco en el primer campo con error:
    - Nombres / Apellidos vacíos → "Escribe los nombres." / "Escribe los apellidos."; más de `NAME_MAX_LENGTH` (80) caracteres → "Máximo 80 caracteres.".
    - Email vacío → "Escribe el email."; formato inválido o más de 254 caracteres → "Escribe un email válido."; ya existe en el mock de staff → "Ya hay alguien del equipo con este email.".
    - Confirmar email vacío → "Vuelve a escribir el email."; distinto del email → "Los emails no coinciden.".
    - Se comparan sin espacios a los extremos y sin distinguir mayúsculas.
  - "Confirmar email" no acepta pegar ni soltar texto (`onPaste` y `onDrop` con `preventDefault`), con `autoComplete="off"` y la ayuda "Escríbelo de nuevo, sin copiar y pegar." enlazada con `aria-describedby`.
  - "Guardar": cierra el modal, agrega la tarjeta a "PENDIENTES" (estado local, sin persistir, con indicador "VINCULAR") y muestra el toast de éxito "Staff agregado" / "{nombre completo} ya está en la lista.". No envía correo.
  - "Cancelar", `Esc` o cerrar descartan lo escrito; al reabrir el formulario está vacío.
- **Perfil `/staff/[id]`**, igual a `/elderly/[id]` salvo:
  - Enlace "Volver a Staff" → `/staff`.
  - Cabecera: avatar, nombre, subtítulo "Staff" (sin badge de estado) y botón "Editar" sin acción (`type="button"`), con el estilo actual.
  - Sin "Resumen del día" ni bloque de notas médicas.
  - Detalles: "Email", "Estado" ("Activo" / "Pendiente" / "Archivado") y "En el equipo desde" (`created_at` con `formatEnrolledAt`, ej. "feb 2025"). Se usa un `DetailsList` compartido (ver Reutilización).
  - Tarjeta "ADULTOS MAYORES VINCULADOS":
    - Fila por adulto mayor: avatar, nombre completo, "{edad} · Habitación {sala}", badge "ACTIVO" (verde, como "ACTIVA" de familiares) o "ARCHIVADO" (estilo de `ElderlyCardIndicator`), y botón "x".
    - Orden: activos primero y luego archivados; dentro de cada grupo, por fecha de vínculo (el primero vinculado primero).
    - Las filas no son enlaces.
    - Sin vínculos: "Todavía no hay adultos mayores vinculados.".
  - **Botón "x" (desvincular):** ícono `CloseIcon` en rojo (`#D9684A`, fondo `#FBD8CC` en hover y foco), área de clic de 32×32, `aria-label="Desvincular a {nombre completo}"` y `title` igual.
  - **Confirmación de desvincular** (`<dialog>` modal):
    - Título "¿Desvincular a {nombre completo del adulto mayor}?".
    - Texto "{nombre completo del staff} dejará de ver sus publicaciones. Puedes volver a vincularlo después.".
    - Botones "Cancelar" (foco inicial) y "Desvincular" (fondo rojo `#D9684A`, texto blanco).
    - Al confirmar: se quita la fila en estado local, se cierra el modal y aparece el toast "Adulto mayor desvinculado" / "{adulto mayor} ya no está vinculado a {staff}.". El foco vuelve al botón "Vincular otro adulto mayor".
  - **"Vincular otro adulto mayor"** (mismo estilo que "Vincular otro familiar/tutor"):
    - Abre un modal "Vincular adulto mayor" con el subtítulo "Elige a quién cuidará {nombre del staff}.".
    - Buscador "Buscar adulto mayor…" y lista con checkbox por adulto mayor: avatar, nombre completo y "Habitación {sala}".
    - Solo muestra adultos mayores **activos** que aún no están vinculados a este staff, ordenados por nombre.
    - Sin coincidencias: "No encontramos adultos mayores con ese nombre."; sin disponibles: "Todos los adultos mayores activos ya están vinculados." y el botón de confirmar deshabilitado.
    - Botones "Cancelar" y "Vincular (N)", deshabilitado con N = 0.
    - Al confirmar: se agregan las filas en estado local con badge "ACTIVO", se cierra el modal y aparece el toast "Adultos mayores vinculados" / "{N} adulto(s) mayor(es) vinculado(s) a {staff}." ("1 adulto mayor vinculado…" / "N adultos mayores vinculados…").
    - Al cerrar o cancelar se descarta la selección y el texto de búsqueda.
  - **Permisos por estado del staff:** con `active` o `pending` se ven el botón "x" y "Vincular otro adulto mayor". Con `archived`, la tarjeta es de solo lectura (sin "x" ni botón), como el perfil de un adulto mayor archivado.
  - Los cambios de estado local no se reflejan en `/staff` ni sobreviven a la navegación.
- **Esqueletos** `StaffListSkeleton` y `StaffProfileSkeleton` con el patrón de SPEC 19 (`SkeletonBlock`, `role="status"`, texto `sr-only` "Cargando staff" / "Cargando perfil"), con los títulos fijos "GESTIÓN / Staff" y "Volver a Staff".
- **`not-found.tsx`** de `/staff/[id]`: "No encontramos a esta persona del staff", "Puede que el enlace sea incorrecto." y enlace "Volver a Staff".
- **Reutilización:**
  - `shared/components/DetailsList.tsx` recibe `{ label, value }[]`; `ElderlyDetailsList` pasa a usarlo y se ve igual que hoy.
  - Se reusan `Avatar`, `avatarTones`, `ElderlyCardIndicator`, `FormField`, `Toast`, `CloseIcon`, `normalizeSearch`, `formatAge` y `formatEnrolledAt`.
- **Móvil (bajo `lg`):** mismo patrón que `/elderly` y `/elderly/[id]`; la barra inferior del admin muestra 5 ítems sin scroll horizontal a 360px. Los modales ocupan el ancho con margen de 16px y la lista del selector hace scroll interno.
- **Foco visible** en tarjetas, botón "x", checkboxes y botones de los modales; los modales atrapan el foco (`<dialog>` nativo) y devuelven el foco al botón que los abrió.
- **Documentos:** `pantallas-pendientes.md` anota en los puntos 8, 9 y 11 "(SPEC 20, UI con datos mock)" sin marcarlos (falta lo real y las acciones de estado); entradas nuevas en `specs/BACKLOG.md` (ver Modelo de datos). SPEC 21 y SPEC 22 no van al BACKLOG.

**Fuera de alcance (para specs futuras):**

- Invitar al staff de verdad, datos reales y Server Actions de vincular y desvincular → SPEC 21.
- Botón "Editar" del staff.
- Archivar, reactivar, cancelar invitación y eliminar staff sin historial → SPEC 22.
- Reenviar invitación (sin spec asignada; entrada en BACKLOG).
- Gestionar el staff desde el perfil del adulto mayor ("Personal asignado").
- Que el admin aparezca en la lista o se pueda asignar a sí mismo.
- Menú "Staff" del familiar (punto 25 de `pantallas-pendientes.md`).
- Enlaces de las filas de adultos mayores vinculados a `/elderly/[id]`.
- Dark mode.

---

## Modelo de datos

No hay migraciones ni cambios en `references/documents/database-schema.md`. Los tipos de vista viven en la feature `staff/` y el mock usa las filas del esquema (`User`, `StaffElderly`) más el email, que en la DB vive en `auth.users`.

```ts
// staff/types.ts
import type { Elderly, Room, StaffElderly, User } from "@/shared/database/types";
import type { AvatarTone } from "@/elderly/avatar-tones";
import type { ElderlyIndicator } from "@/elderly/types";

// Lo que devolvería la consulta: filas del esquema + datos de UI.
export type StaffSource = {
  referenceDate: string; // "2025-06-17", fija en el mock (edades)
  staff: StaffMember[];
  elderly: Elderly[];
  rooms: Room[];
  staffElderly: StaffElderly[];
  avatarTones: Record<string, AvatarTone>; // por id de staff o elderly; solo UI
};

export type StaffMember = User & { email: string }; // role = 'staff'; email viene de auth.users

export type StaffIndicator = Extract<
  ElderlyIndicator,
  { kind: "link" } | { kind: "none" } | { kind: "archived" }
>;

export type StaffListItem = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  summary: string; // "3 adultos mayores vinculados"
  indicator: StaffIndicator;
  isLink: boolean; // false en las tarjetas agregadas desde el modal
};

export type StaffList = {
  active: StaffListItem[];
  pending: StaffListItem[];
  archived: StaffListItem[];
};

export type LinkedElderly = {
  linkId: string; // id de staff_elderly
  elderlyId: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  detail: string; // "78 años · Habitación Roble"
  status: "active" | "archived";
  statusLabel: "ACTIVO" | "ARCHIVADO";
};

export type ElderlyOption = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  roomName: string;
};

export type StaffProfile = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  email: string;
  statusLabel: "Activo" | "Pendiente" | "Archivado";
  joinedAtLabel: string; // "feb 2025"
  canManageLinks: boolean; // status active o pending
  linkedElderly: LinkedElderly[];
  availableElderly: ElderlyOption[]; // activos y no vinculados
};

// Formulario "Agregar staff"
export type NewStaffInput = {
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmation: string;
};
export type NewStaffField = keyof NewStaffInput;
export type NewStaffErrors = Partial<Record<NewStaffField, string>>;
```

`StaffElderly` no existe hoy en `shared/database/types.ts`: se agrega con las columnas del esquema (`id`, `staff_id`, `elderly_id`, `created_at`).

### Mock (`staff/mock-staff.ts`)

Reusa `mockElderly` (adultos mayores, habitaciones, tonos y `referenceDate`) y agrega un adulto mayor archivado propio del mock de staff, "Teresa Paredes" (`elderly-teresa`, habitación Roble), para mostrar el badge "ARCHIVADO". No modifica `mockElderly`.

| Staff | Estado | Email | Vinculados | En la lista |
| --- | --- | --- | --- | --- |
| Carolina Paz | `active` | `carolina.paz@casanogal.pe` | Luis, Carmen, Teresa (archivada) | ACTIVOS, "2 adultos mayores vinculados", flecha |
| Miguel Torres | `active` | `miguel.torres@casanogal.pe` | ninguno | ACTIVOS, "Sin adultos mayores vinculados", VINCULAR |
| Lucía Ramos | `pending` | `lucia.ramos@casanogal.pe` | Rosa, Alberto | PENDIENTES, "2 adultos mayores vinculados", flecha |
| Andrés Silva | `archived` | `andres.silva@casanogal.pe` | Elena, Manuel | ARCHIVADOS, "2 adultos mayores vinculados", ARCHIVADO |

`created_at` distintos entre `2024` y `2025` para que "En el equipo desde" varíe.

### Entradas de BACKLOG

- **Staff** (sección nueva): "Botón Editar del perfil de staff" (hoy sin acción).
- **Staff:** "Reenviar invitación a staff pendiente" (punto 8 de `pantallas-pendientes.md`).

Conectar a Supabase y las acciones de estado no van al BACKLOG: son SPEC 21 y SPEC 22 (ver "Specs siguientes").

---

## Estructura de archivos

```
app/(app)/
  layout.tsx                         # CurrentUserMobileBottomNav en <Suspense>
  staff/page.tsx                     # metadata + <Suspense fallback={<StaffListSkeleton />}><StaffListContent /></Suspense>
  staff/[id]/page.tsx                # generateMetadata + <Suspense><StaffProfileContent /></Suspense>
  staff/[id]/not-found.tsx
auth/
  require-user.ts                    # + requireAdminUser()
shared/
  components/DetailsList.tsx         # nuevo
  components/icons/StaffIcon.tsx     # nuevo
  components/navigation/
    nav-items.ts                     # ítem "Staff" con adminOnly
    Sidebar.tsx                      # prop isAdmin
    MobileBottomNav.tsx              # prop isAdmin
    CurrentUserSidebar.tsx           # pasa isAdmin
    CurrentUserMobileBottomNav.tsx   # nuevo
  database/types.ts                  # + StaffElderly
elderly/components/
  ElderlyDetailsList.tsx             # usa DetailsList
staff/
  types.ts
  mock-staff.ts
  build-staff-list.ts                # StaffSource → StaffList
  build-staff-profile.ts             # StaffSource + id → StaffProfile | null
  staff-formatters.ts                # conteo de vinculados, etiqueta de estado
  read-new-staff-input.ts
  validate-new-staff.ts
  components/
    StaffListContent.tsx             # requireAdminUser + StaffListView
    StaffListView.tsx
    StaffListTitle.tsx               # "GESTIÓN / Staff", lo usan vista y esqueleto
    StaffSearchList.tsx              # buscador, secciones y estado local de agregados
    StaffCard.tsx
    StaffListSkeleton.tsx
    AddStaffDialog.tsx
    AddStaffForm.tsx
    StaffProfileContent.tsx          # requireAdminUser + params + notFound
    StaffProfileView.tsx
    StaffProfileHeader.tsx
    StaffProfileSkeleton.tsx
    LinkedElderlyCard.tsx            # estado local de vínculos y toasts
    LinkedElderlyRow.tsx
    UnlinkElderlyDialog.tsx
    LinkElderlyDialog.tsx
```

---

## Plan de implementación

1. **Navegación y acceso.**
   - `StaffIcon`, ítem "Staff" con `adminOnly`, `isAdmin` en `Sidebar` y `MobileBottomNav`, `CurrentUserMobileBottomNav` en `<Suspense>` y `requireAdminUser()`.
   - `/staff` con un encabezado mínimo.
   - Prueba: `npm run build`; el admin ve "Staff" después de "Adultos mayores" (sidebar y móvil) y queda activo en `/staff`; el área del equipo se ve igual que antes a 1440×900 y 390×844.
2. **Tipos, mock y builders.** `staff/types.ts`, `mock-staff.ts`, `build-staff-list.ts`, `build-staff-profile.ts`, `staff-formatters.ts` y `StaffElderly` en `shared/database/types.ts`. Prueba: `npm run build`; la lista tiene 2 activos, 1 pendiente y 1 archivado con los resúmenes e indicadores de la tabla del mock.
3. **Lista `/staff`.** `StaffListContent`, `StaffListView`, `StaffListTitle`, `StaffSearchList`, `StaffCard` y `StaffListSkeleton`. Prueba: igual a `/elderly` salvo las diferencias de Alcance; buscar "lucia" muestra solo a Lucía Ramos.
4. **Modal "Agregar staff".** `read-new-staff-input.ts`, `validate-new-staff.ts`, `AddStaffForm` y `AddStaffDialog`. Prueba: cada error de validación aparece; pegar en "Confirmar email" no hace nada; guardar agrega la tarjeta a "PENDIENTES" con "VINCULAR" y muestra el toast.
5. **Perfil `/staff/[id]`.** `DetailsList` (y refactor de `ElderlyDetailsList`), `StaffProfileContent`, `StaffProfileView`, `StaffProfileHeader`, `LinkedElderlyCard`, `LinkedElderlyRow`, `StaffProfileSkeleton`, `not-found.tsx` y `generateMetadata`. Prueba: Carolina muestra Luis y Carmen "ACTIVO" y Teresa "ARCHIVADO"; Andrés no tiene "x" ni botón de vincular; `/elderly/[id]` se ve igual.
6. **Desvincular y vincular.** `UnlinkElderlyDialog` y `LinkElderlyDialog`. Prueba: desvincular a Luis lo quita y muestra el toast; el selector de Carolina no lista a Luis, Carmen ni Teresa; vincular 2 agrega 2 filas "ACTIVO".
7. **Móvil, comparación, capturas y documentos.**
   - A 390×844 y 360px de ancho: sin scroll horizontal, 5 ítems en la barra inferior del admin y modales usables.
   - Capturas en `.playwright-mcp/`: `/staff` y `/staff/{carolina}` a 1440×900 y 390×844, el modal "Agregar staff" con errores, el selector de vincular y la confirmación de desvincular.
   - Actualizar `specs/BACKLOG.md` y `pantallas-pendientes.md`.

---

## Criterios de aceptación

**Build, rutas y acceso**

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] La consola no muestra errores, warnings de hidratación ni el aviso de datos fuera de `<Suspense>` en `/staff` y `/staff/[id]`.
- [ ] Los títulos son "Staff · Casa Nogal" en `/staff` y "Carolina Paz · Casa Nogal" en el perfil de Carolina.
- [ ] Un id inexistente en `/staff/[id]` muestra "No encontramos a esta persona del staff" con el enlace "Volver a Staff".
- [ ] `requireAdminUser()` redirige con `TEAM_HOME` / `RELATIVE_HOME`, sin literales.
- [ ] Con sesión de admin, `/staff` y `/staff/[id]` cargan. Con una cuenta `staff` de prueba (si existe), abrir `/staff` redirige a `/`; si no hay cuenta, se deja indicado y queda en la entrada de pruebas pendientes del BACKLOG.

**Navegación**

- [ ] El admin ve "Staff" después de "Adultos mayores" en el sidebar y en la barra inferior móvil, activo en `/staff` y `/staff/[id]`.
- [ ] Un staff ve el mismo menú que antes de la spec (4 ítems), y el fallback de `<Suspense>` no muestra "Staff".
- [ ] Fuera de `/staff`, el área del equipo se ve igual que antes de la spec a 1440×900 y 390×844, incluido `/elderly/[id]` tras el refactor de `DetailsList`.

**Lista `/staff`**

- [ ] Se ven "ACTIVOS" (2 personas), "PENDIENTES" (1 persona) y "ARCHIVADOS" (1 persona) con los resúmenes e indicadores de la tabla del mock.
- [ ] Miguel Torres muestra "Sin adultos mayores vinculados" y "VINCULAR"; Carolina Paz muestra "2 adultos mayores vinculados" (Teresa archivada no cuenta) y la flecha.
- [ ] El buscador encuentra "Lucía" escribiendo "lucia" y muestra "No encontramos a nadie del staff con ese nombre." sin coincidencias.
- [ ] Cada tarjeta del mock lleva a `/staff/{id}`.

**Modal "Agregar staff"**

- [ ] Tiene solo Nombres, Apellidos, Email y Confirmar email, sin habitación, alergias ni notas médicas.
- [ ] Guardar vacío muestra los 4 mensajes de campo obligatorio y pone el foco en "Nombres".
- [ ] Emails distintos muestran "Los emails no coinciden."; `Carolina.Paz@casanogal.pe ` muestra "Ya hay alguien del equipo con este email.".
- [ ] Pegar o soltar texto en "Confirmar email" no cambia su valor; en "Email" sí se puede pegar.
- [ ] Un guardado válido cierra el modal, agrega la tarjeta en "PENDIENTES" (contador "2 personas") con "VINCULAR" y muestra el toast "Staff agregado".
- [ ] Al reabrir, el formulario está vacío y sin errores.

**Perfil `/staff/[id]`**

- [ ] No tiene "Resumen del día" ni notas médicas; el subtítulo es "Staff" sin badge; "Editar" no navega.
- [ ] Los detalles son Email, Estado y "En el equipo desde" con los valores del mock.
- [ ] La tarjeta se titula "ADULTOS MAYORES VINCULADOS" y cada fila muestra "{edad} · Habitación {sala}", el badge "ACTIVO"/"ARCHIVADO" y la "x" roja con `aria-label="Desvincular a {nombre}"`.
- [ ] Miguel Torres muestra "Todavía no hay adultos mayores vinculados.".
- [ ] En el perfil de Andrés Silva (archivado) no hay "x" ni "Vincular otro adulto mayor"; en el de Lucía Ramos (pendiente) sí.

**Desvincular y vincular**

- [ ] La "x" abre la confirmación con el título y el texto de Alcance y el foco en "Cancelar"; "Cancelar" y `Esc` no cambian nada.
- [ ] "Desvincular" quita la fila, muestra el toast "Adulto mayor desvinculado" y devuelve el foco a "Vincular otro adulto mayor".
- [ ] El selector solo lista adultos mayores activos no vinculados (en Carolina: sin Luis, Carmen ni Teresa), ordenados por nombre, y filtra con el buscador.
- [ ] "Vincular (N)" está deshabilitado con N = 0; con 2 seleccionados agrega 2 filas "ACTIVO" y muestra "2 adultos mayores vinculados a Carolina Paz.".
- [ ] Un adulto mayor desvinculado vuelve a aparecer en el selector.

**Móvil y accesibilidad**

- [ ] A 390×844 y a 360px no hay scroll horizontal en `/staff`, `/staff/[id]` ni en los modales.
- [ ] Tarjetas, "x", checkboxes y botones tienen foco visible, y se puede vincular y desvincular solo con teclado.
- [ ] Los esqueletos tienen `role="status"` y texto `sr-only`.

**Documentos**

- [ ] `pantallas-pendientes.md` anota los puntos 8, 9 y 11 con "(SPEC 20, UI con datos mock)" sin marcarlos.
- [ ] `specs/BACKLOG.md` tiene las dos entradas nuevas de la sección "Staff" y ninguna para lo que cubren SPEC 21 y SPEC 22.

---

## Decisiones

- **Sí:** menú "Staff" solo para admin dentro de `(app)`, filtrando por rol con `adminOnly`. SPEC 18 ya preveía los menús de admin así. **No:** un route group propio del admin, que duplicaría el layout.
- **Sí:** el staff que entra por URL va a `/` (decisión del usuario). **No:** `notFound()`.
- **Sí:** la barra inferior móvil lee la sesión dentro de `<Suspense>`. Sin eso no sabe si mostrar "Staff". El fallback no muestra ítems de admin para no enseñarlos a un staff.
- **Sí:** secciones ACTIVOS / PENDIENTES / ARCHIVADOS (decisión del usuario). Refleja `users.status` del staff y prepara la invitación de SPEC 21.
- **Sí:** el resumen de la tarjeta es solo el conteo de vinculados activos (decisión del usuario). Los archivados no cuentan porque no reciben cuidado.
- **Sí:** modal con email y confirmación, todos obligatorios, sin pegar en la confirmación (decisión del usuario), para evitar invitar a un email mal escrito. **No:** fecha de nacimiento ni de ingreso: `users` no tiene esas columnas.
- **Sí:** "Guardar" agrega una tarjeta en estado local con toast (decisión del usuario), sin persistir ni enviar correo.
- **Sí:** las tarjetas agregadas desde el modal no son enlaces. Su id no existe en el mock y llevarían al not-found.
- **Sí:** subtítulo "Staff" sin badge de estado (decisión del usuario); el estado va en los detalles.
- **Sí:** detalles Email, Estado y "En el equipo desde" (decisión del usuario).
- **Sí:** selector con buscador y selección múltiple (decisión del usuario). Solo activos no vinculados: vincular a un archivado no tiene efecto.
- **Sí:** vincular y desvincular en staff activo y pendiente; archivado en solo lectura (decisión del usuario). Al pendiente se le puede preasignar antes de que active su cuenta.
- **Sí:** confirmación con el copy propuesto, estado local y toast (decisión del usuario).
- **Sí:** filas de vinculados sin enlace. Los ids del mock no existen en `/elderly/[id]` (datos reales desde SPEC 16).
- **Sí:** "Editar" como botón sin acción, como en SPEC 18. **No:** `href="/"` como en `/elderly/[id]`.
- **Sí:** un adulto mayor archivado (Teresa) propio del mock de staff, sin tocar `mockElderly`, que también usa el feed.
- **Sí:** feature `staff/` (Screaming Architecture), reusando componentes de `elderly/` y extrayendo solo `DetailsList`, que ambas usan con la misma forma.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Leer la sesión en la barra inferior móvil cambia el área del equipo o agrega un aviso de `<Suspense>` | Fallback sin ítems de admin y criterio de comparación del área del equipo antes y después. |
| 5 ítems no entran en la barra inferior a 360px | Criterio de 360px sin scroll horizontal; si no entra, se detiene y se pregunta (el mockup no lo cubre). |
| Bloquear el pegado molesta a usuarios con gestores de contraseñas o lectores de pantalla | Texto de ayuda visible y enlazado; decisión del usuario. |
| Los cambios locales se pierden al navegar y no se reflejan en la lista | Aceptado: es solo UI. Se conectan en SPEC 21. |
| No hay cuenta `staff` para probar la redirección | Se revisa en el código; la prueba queda en la entrada de pruebas pendientes del BACKLOG. |

---

## Lo que **no** entra en esta spec

- Invitación real, datos reales y Server Actions de vincular y desvincular (SPEC 21).
- Archivar, reactivar, cancelar invitación y eliminar sin historial (SPEC 22).
- Editar y reenviar invitación.
- Gestión del staff desde el perfil del adulto mayor.
- Menú "Staff" del familiar y dark mode.

Cada una de esas, si llega, va en su propia spec.
