# SPEC 23 — Estado del staff: archivar, reactivar, cancelar invitación y eliminar sin historial

> **Estado:** Implementado
> **Depende de:** SPEC 10, SPEC 15, SPEC 20, SPEC 21, SPEC 22
> **Fecha:** 2026-11-15
> **Objetivo:** Permitir al admin, desde `/staff/[id]`, archivar y reactivar a un staff (status + bloqueo de login), cancelar la invitación de un staff `pending` y eliminar a un staff sin historial, con la DB limitando las transiciones de `status` a `active` ↔ `archived`.

---

## Por qué esta spec

SPEC 20 planificó el estado del staff como SPEC 22; SPEC 22 pasó a ser la base de datos del feed, que crea `posts`, `comments` y `reactions` con `on delete restrict` en el autor. Con eso ya se puede saber si un staff tiene historial. Esta spec implementa los flujos "Archivar usuario" y "Reactivar usuario" de `flujos-de-procesos.md` para el staff y agrega dos flujos nuevos: "Cancelar invitación de staff" y "Eliminar staff sin historial".

Hoy `users_update_admin` deja al admin cualquier cambio de `status` de un staff o familiar (por ejemplo `pending` → `active` sin crear contraseña). Esta spec lo cierra en `protect_users_columns()`.

Resuelve del BACKLOG:

- "Pruebas pendientes con `staff`, `pending`, `archived` y `relative`": solo la parte de `archived` (ban → `user_banned` → `inactive_account` y sesión abierta → `/auth/end-session`). Queda `[ ]` con el **Qué** editado.

---

## Alcance

**Dentro:**

- **Migración** `supabase/migrations/<version>_staff_status_actions.sql`:
  - `protect_users_columns()`: el admin solo puede cambiar el `status` de un usuario no admin entre `active` y `archived` (ver "Modelo de datos"). Se mantiene la excepción de `activate_staff_account()`.
  - Helper `staff_has_history(p_staff_id uuid) returns boolean`.
- **Server Actions** en `staff/actions/` (todas: `getCurrentUser()` es admin, `isUuid(staffId)`, lectura del staff con la sesión, que RLS limita a su guardería):
  - `archiveStaff(staffId)`: solo `active`.
    1. `update users set status = 'archived'` con la sesión (`.select("id")` para detectar 0 filas).
    2. Ban con `createAdminClient().auth.admin.updateUserById(staffId, { ban_duration: '876000h' })`.
    3. Si el ban falla: se revierte el `status` a `active` con la sesión y devuelve error.
    4. `refresh()`.
  - `reactivateStaff(staffId)`: solo `archived`.
    1. Quita el ban con `updateUserById(staffId, { ban_duration: 'none' })`.
    2. `update users set status = 'active'` con la sesión.
    3. Si el update falla: se vuelve a banear y devuelve error.
    4. `refresh()`.
  - `cancelStaffInvitation(staffId)`: solo `pending`. `createAdminClient().auth.admin.deleteUser(staffId)` (la cascada borra `users`). Éxito: `redirect("/staff?notice=invitation-cancelled")`.
  - `deleteStaff(staffId)`: solo `active` o `archived` y `staff_has_history(staffId) = false` (rpc con la sesión). `deleteUser(staffId)`; la cascada borra `users` y `staff_elderly`. Si Auth falla por la FK `restrict` (historial creado entre la lectura y el borrado), devuelve `{ status: "has-history" }`. Éxito: `redirect("/staff?notice=staff-deleted")`.
- **Perfil `/staff/[id]`:**
  - `StaffProfile` gana `canArchive` (`active`), `canReactivate` (`archived`), `canCancelInvitation` (`pending`), `canDelete` (`active` o `archived` y sin historial) y `uncoveredElderly` (ver "Modelo de datos").
  - `getStaffProfileSource` agrega: `staff_has_history(id)` y, para los vinculados activos, sus otros vínculos en `staff_elderly` con el `status` de esos staff (lectura con la sesión).
  - Botones en la cabecera, junto a "Reenviar invitación" y "Editar", con el estilo de "Reenviar invitación". Orden: acción de estado primero, luego "Editar".
    - `active`: "Archivar" y, si no tiene historial, "Eliminar".
    - `pending`: "Reenviar invitación" y "Cancelar invitación".
    - `archived`: "Reactivar" y, si no tiene historial, "Eliminar".
    - "Cancelar invitación" y "Eliminar" con texto rojo `#D9684A` (como la "x" de desvincular).
  - Mientras guarda: "Archivando…" / "Reactivando…" / "Cancelando…" / "Eliminando…", botones deshabilitados y `Esc` bloqueado en el modal (como en SPEC 21).
- **Confirmaciones** (`<dialog>` modal, mismo estilo que `UnlinkElderlyDialog`, foco inicial en "Cancelar", vuelve el foco al botón que lo abrió):
  - **Archivar:** título "¿Archivar a {staff}?"; texto "Ya no podrá iniciar sesión. Sus publicaciones, comentarios y reacciones se conservan. Puedes reactivarlo después.". Si `uncoveredElderly` no está vacío, además: "Estos adultos mayores se quedarán sin cuidador/a:" y la lista de nombres completos. Botón "Archivar" (fondo `#D9684A`, texto blanco).
  - **Cancelar invitación:** título "¿Cancelar la invitación de {staff}?"; texto "El enlace que le enviamos dejará de funcionar y se borrará de la lista. Podrás invitarlo de nuevo.". Botones "Volver" (foco inicial) y "Cancelar invitación" (rojo).
  - **Eliminar:** título "¿Eliminar a {staff}?"; texto "Se borrará su cuenta y sus vínculos. Esta acción no se puede deshacer.". Si `uncoveredElderly` no está vacío, la misma lista que en Archivar. Botón "Eliminar" (rojo).
  - **Reactivar** no confirma: actúa directo.
- **Toasts** (`Toast` compartido):
  - Archivar: "Staff archivado" / "{staff} ya no puede iniciar sesión.". Error: "No pudimos archivar al staff" / "Inténtalo de nuevo.".
  - Reactivar: "Staff reactivado" / "{staff} ya puede iniciar sesión.". Error: "No pudimos reactivar al staff" / "Inténtalo de nuevo.".
  - Cancelar invitación (en `/staff`): "Invitación cancelada" / "Ya no aparece en la lista.". Error (en el perfil): "No pudimos cancelar la invitación" / "Inténtalo de nuevo.".
  - Eliminar (en `/staff`): "Staff eliminado" / "Ya no aparece en la lista.". Error: "No pudimos eliminar al staff" / "Inténtalo de nuevo."; con `has-history`: "No se puede eliminar" / "Ya tiene publicaciones, comentarios o reacciones. Puedes archivarlo." y `refresh()`.
  - En los errores el modal sigue abierto.
- **Toast en `/staff`:** `StaffListContent` lee `searchParams.notice` (`invitation-cancelled` | `staff-deleted`; otro valor se ignora), muestra el toast y limpia el parámetro con `router.replace("/staff")`. Patrón de SPEC 19 (lectura dentro del `<Suspense>`).
- **Prueba real** con la cuenta staff de SPEC 21: archivar → no puede iniciar sesión (`inactive_account`); con su sesión abierta, la siguiente navegación pasa por `/auth/end-session`; reactivar → vuelve a entrar. Eliminar y cancelar invitación se prueban con usuarios creados solo para eso (como `postgres` en `auth.users`) y se borran al terminar.
- **Documentación** (ver "Cambios en documentos").

**Fuera de alcance (para specs futuras):**

- Archivar, reactivar o eliminar familiares (la restricción de transiciones ya les aplica).
- Acciones de estado en las tarjetas de `/staff`: la lista no cambia.
- Archivar a un staff `pending` (se cancela su invitación).
- Reasignar adultos mayores desde el aviso de archivar.
- Botón "Editar" del perfil (BACKLOG).
- Borrar o anonimizar el historial de un staff para poder eliminarlo.

---

## Modelo de datos

### `protect_users_columns()` (reemplazo)

Se mantiene todo lo actual y se agrega, después del chequeo de admin:

```sql
-- Admin: solo active <-> archived en usuarios no admin
if new.status is distinct from old.status
   and not is_staff_activation
   and not (old.status, new.status) in (('active', 'archived'), ('archived', 'active')) then
  raise exception 'status can only change between active and archived';
end if;
```

- Sigue permitido todo con `auth.uid() is null` (`service_role` o SQL).
- `pending` → `active` solo desde `activate_staff_account()`.
- Se rechazan, entre otros: `pending` → `active` o `archived` por el admin, `archived` → `pending`, `active` → `pending`.

### Helper `staff_has_history(p_staff_id uuid) returns boolean`

`SECURITY DEFINER STABLE`, `search_path = ''`, nombres calificados, `EXECUTE` solo para `authenticated`.

- `false` si quien llama no es admin (`is_admin()`) o si `p_staff_id` no es un staff de `current_user_daycare_id()`.
- Si no, `true` si existe alguna fila en `posts` (`author_id`), `comments` (`author_id`) o `reactions` (`user_id`) del staff.

Lo usan el perfil (mostrar "Eliminar") y `deleteStaff` (validar). La FK `on delete restrict` de SPEC 22 sigue siendo la protección final.

```sql
revoke execute on function public.staff_has_history(uuid) from public, anon;
grant execute on function public.staff_has_history(uuid) to authenticated;
```

### Tipos (`staff/types.ts`)

```ts
export type StaffProfile = {
  // ...campos actuales
  canArchive: boolean; // status = active
  canReactivate: boolean; // status = archived
  canCancelInvitation: boolean; // status = pending
  canDelete: boolean; // active o archived y sin historial
  uncoveredElderly: string[]; // nombres de los vinculados activos sin otro staff active
};

export type StaffSource = {
  // ...campos actuales
  hasHistory: boolean;
  otherActiveLinks: StaffElderly[]; // vínculos de los mismos adultos mayores con otros staff active
};

export type DeleteStaffResult = StaffActionResult | { status: "has-history" };

export type StaffListNotice = "invitation-cancelled" | "staff-deleted";
```

`uncoveredElderly`: vinculados del staff con `elderly.status = 'active'` que no aparecen en `otherActiveLinks`, en el orden de `sortLinkedElderly`.

### Cambios en documentos

1. **`references/documents/database-schema.md`:**
   - "Helpers implementados": agregar `staff_has_history()`.
   - `users`, "Protección de columnas": el admin solo cambia `status` entre `active` y `archived`.
   - Regla 4 (`service_role`): agregar "cancelar la invitación y eliminar staff sin historial (`auth.admin.deleteUser`)".
2. **`references/documents/flujos-de-procesos.md`:**
   - "Archivar usuario" y "Reactivar usuario": orden de las llamadas y reversión si falla la segunda.
   - Nuevos: "Cancelar invitación de staff" y "Eliminar staff sin historial".
3. **`references/documents/pantallas-pendientes.md`**, punto 8: se marca `[x]` (archivar y reactivar: SPEC 23).
4. **`specs/20-staff-screens-mock.md`**, "Specs siguientes": agregar a SPEC 23 "(implementada en `specs/database/23-staff-status-actions.md`)".
5. **`CLAUDE.md`**, sección Supabase: agregar los archivos nuevos que usan `service_role` (`archive-staff.ts`, `reactivate-staff.ts`, `cancel-staff-invitation.ts`, `delete-staff.ts`).

### Entradas de BACKLOG

- "Pruebas pendientes con `staff`, `pending`, `archived` y `relative`": se quita del **Qué** lo verificado de `archived` (ban y `/auth/end-session`), con nota "verificado en SPEC 23". Sigue `[ ]`.
- "Reenviar invitación a staff pendiente", notas: "Cancelar la invitación va en SPEC 22" → "SPEC 23".
- "Avisos del linter aceptados tras la spec 10": sumar `staff_has_history()` a (1), con origen SPEC 23.
- "Reducir los usos de `service_role`", notas: agregar `auth.admin.deleteUser` (cancelar invitación y eliminar staff) a "Necesario".

---

## Estructura de archivos

```
supabase/migrations/<version>_staff_status_actions.sql   # nuevo
staff/
  types.ts                         # + campos de StaffProfile/StaffSource, DeleteStaffResult, StaffListNotice
  get-staff-profile-source.ts      # + hasHistory, otherActiveLinks
  build-staff-profile.ts           # + can*, uncoveredElderly
  get-uncovered-elderly.ts         # nuevo
  read-staff-list-notice.ts        # nuevo: searchParams → StaffListNotice | null
  actions/
    archive-staff.ts               # nuevo
    reactivate-staff.ts            # nuevo
    cancel-staff-invitation.ts     # nuevo
    delete-staff.ts                # nuevo
  components/
    StaffProfileHeader.tsx         # botones según estado
    StaffStatusActions.tsx         # nuevo: botones, modales y toasts
    ConfirmStaffActionDialog.tsx   # nuevo: <dialog> común (título, texto, lista, botón rojo)
    StaffListContent.tsx           # lee notice
    StaffListNoticeToast.tsx       # nuevo: toast + router.replace
app/(app)/staff/page.tsx           # pasa searchParams
references/documents/database-schema.md
references/documents/flujos-de-procesos.md
references/documents/pantallas-pendientes.md
specs/20-staff-screens-mock.md
specs/BACKLOG.md
CLAUDE.md
```

---

## Plan de implementación

1. **Revisión previa.** Con `list_migrations` y `execute_sql`: confirmar el cuerpo actual de `protect_users_columns()` y que no existe `staff_has_history`. Prueba: coinciden con `20261114075340_staff_invitation_functions.sql`.
2. **Migración local.** Escribir `staff_status_actions.sql`. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `staff_status_actions`; renombrar el archivo con la versión de `list_migrations`.
4. **Pruebas SQL.** `execute_sql` en transacciones con `rollback`, con `set local role authenticated` y `request.jwt.claims` (ver criterios "Base de datos").
5. **Advisors.** `get_advisors` (security y performance); lo aceptado va al BACKLOG.
6. **Datos del perfil.** Tipos, `get-staff-profile-source.ts`, `get-uncovered-elderly.ts` y `build-staff-profile.ts`. Prueba: `npm run build`.
7. **Server Actions.** Las cuatro acciones. Prueba: `npm run build` y `npm run lint`.
8. **UI del perfil.** `ConfirmStaffActionDialog`, `StaffStatusActions` y `StaffProfileHeader`. Prueba: con Playwright, los botones de cada estado y los modales.
9. **Toast en `/staff`.** `read-staff-list-notice.ts`, `StaffListNoticeToast` y `StaffListContent`. Prueba: `/staff?notice=staff-deleted` muestra el toast y la URL queda en `/staff`.
10. **Prueba real.** Archivar y reactivar la cuenta staff de SPEC 21; cancelar invitación y eliminar con usuarios de prueba (ver Alcance). Capturas en `.playwright-mcp/`.
11. **Documentación.** "Cambios en documentos" y "Entradas de BACKLOG".

---

## Criterios de aceptación

**Base de datos**

- [x] Existe `supabase/migrations/<version>_staff_status_actions.sql` y su versión coincide con `list_migrations`.
- [x] Como admin: `active` → `archived` y `archived` → `active` de un staff funcionan; `pending` → `active`, `pending` → `archived`, `archived` → `pending` y `active` → `pending` fallan.
- [x] Como admin: cambiar el `status` de otro admin sigue fallando.
- [x] `activate_staff_account()` sigue pasando a un staff `pending` a `active`.
- [x] Como `postgres` (sin `auth.uid()`) cualquier cambio de `status` sigue funcionando.
- [x] `staff_has_history()` es `SECURITY DEFINER STABLE`, con `search_path` vacío y `EXECUTE` solo para `authenticated`.
- [x] `staff_has_history()` devuelve `true` con un post, un comentario o una reacción del staff, y `false` sin ninguno.
- [x] `staff_has_history()` devuelve `false` si quien llama es staff o relative, o si el staff es de otra guardería.
- [x] `get_advisors` sin avisos nuevos fuera de los aceptados en el BACKLOG.

**Perfil `/staff/[id]`**

- [x] `active` sin historial: "Archivar", "Eliminar" y "Editar". Con historial: sin "Eliminar".
- [x] `pending`: "Reenviar invitación", "Cancelar invitación" y "Editar".
- [x] `archived`: "Reactivar", "Eliminar" solo sin historial, y "Editar".
- [x] "Cancelar invitación" y "Eliminar" tienen texto rojo `#D9684A`.
- [x] El modal de Archivar lista solo a los adultos mayores activos vinculados que no tienen otro staff `active`; sin ninguno, no muestra la lista.
- [x] Los modales tienen el título y el texto de Alcance, foco inicial en "Cancelar"/"Volver" y devuelven el foco al botón que los abrió; "Cancelar"/"Volver" y `Esc` no cambian nada.
- [ ] Mientras guarda, el texto del botón cambia, los botones se deshabilitan y `Esc` no cierra el modal.

**Acciones**

- [x] Archivar: el staff pasa a "ARCHIVADOS" en `/staff`, su `banned_until` queda en el futuro y aparece el toast "Staff archivado".
- [x] Si el ban falla (probado forzando el error en desarrollo), el `status` vuelve a `active` y aparece el toast de error.
- [x] Reactivar: el staff pasa a "ACTIVOS", `banned_until` queda vacío o en el pasado, sus vínculos siguen y aparece el toast "Staff reactivado".
- [x] Cancelar invitación: se borra la fila de `auth.users` y `users`, se llega a `/staff` con el toast "Invitación cancelada" y la URL queda en `/staff`.
- [x] Eliminar sin historial: se borran `auth.users`, `users` y sus `staff_elderly`; se llega a `/staff` con el toast "Staff eliminado".
- [x] `deleteStaff` con un staff con historial devuelve `has-history` y no borra nada (probado llamando a la acción).
- [x] Las cuatro acciones devuelven error sin efectos si quien llama no es admin, si el id no es UUID, si el staff es de otra guardería o si su estado no corresponde (ej. `archiveStaff` con un `pending`).
- [x] `/staff?notice=otro` no muestra toast.

**Prueba real**

- [x] La cuenta staff de SPEC 21 archivada no puede iniciar sesión y ve "Tu cuenta no está activa. Comunícate con la guardería.".
- [x] Con su sesión abierta antes de archivarla, la siguiente navegación lleva a `/login?error=inactive_account`.
- [x] Reactivada, vuelve a iniciar sesión y entra a `/`.
- [x] Los usuarios de prueba de cancelar y eliminar no quedan en el remoto al terminar.

**Cierre**

- [x] `npm run build` y `npm run lint` sin errores; la consola no muestra errores ni avisos de `<Suspense>` en `/staff` y `/staff/[id]`.
- [x] A 390×844 y 360px, la cabecera del perfil con tres botones y los modales no tienen scroll horizontal.
- [x] Documentos y BACKLOG actualizados según "Cambios en documentos" y "Entradas de BACKLOG".

---

## Decisiones

- **Sí:** archivar = `status` + ban en Auth (decisión del usuario). Es lo que dicen `flujos-de-procesos.md` y la regla 8.
- **Sí:** ban con `ban_duration: '876000h'` y desbloqueo con `'none'` (verificado en la doc de `supabase-js`, `AdminUserAttributes`).
- **Sí:** el admin solo cambia `status` entre `active` y `archived`, para cualquier usuario no admin (decisión del usuario). Cierra `pending` → `active` sin contraseña; a los `relative` no les cambia nada porque nacen `active`.
- **No:** validar la transición solo en la Server Action. La policy seguiría permitiendo cualquier cambio vía API.
- **Sí:** `staff_has_history()` en SQL (decisión del usuario). **No:** tres selects con la sesión del admin ni mostrar siempre "Eliminar" y esperar el error de FK.
- **Sí:** eliminar solo `active` o `archived` sin historial (decisión del usuario). Un `pending` se borra con "Cancelar invitación".
- **No:** archivar a un `pending`. Se cancela su invitación.
- **Sí:** archivar hace primero el `status` y, si el ban falla, lo revierte; reactivar quita primero el ban y, si el `status` falla, vuelve a banear (decisión del usuario). Así el `status` y el ban no quedan distintos.
- **Sí:** el aviso lista los adultos mayores que quedan sin otro staff `active` (decisión del usuario), como dice el flujo.
- **Sí:** el mismo aviso en Eliminar, porque también borra los vínculos. Supuesto de esta spec; confirmar al revisarla.
- **Sí:** botones en la cabecera, junto a "Editar" (decisión del usuario). Sin mockup: se usa el estilo de "Reenviar invitación".
- **Sí:** confirmación en todo menos Reactivar (decisión del usuario). Reactivar es reversible.
- **Sí:** tras cancelar o eliminar, `/staff` con toast vía `?notice=` (decisión del usuario). El parámetro no lleva el nombre ni el id, para no dejar datos personales en la URL.
- **Sí:** acciones solo en el perfil (decisión del usuario); la lista no cambia.
- **Sí:** prueba real con la cuenta staff de SPEC 21 (decisión del usuario).
- **Sí:** spec en `specs/database/` porque incluye migración.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración se aplica directo al remoto y cambia un trigger existente | Se pide permiso antes; pruebas de que `activate_staff_account()` y los cambios como `postgres` siguen funcionando. |
| Falla la reversión tras un ban o unban fallido y `status` y ban quedan distintos | Se registra con `console.error`; un `archived` sin ban igual no ve nada (regla 8) y un `active` baneado no entra: el admin repite la acción. |
| Un staff crea historial entre la lectura y el borrado | `on delete restrict` hace fallar `deleteUser`; la acción devuelve `has-history`. |
| Borrar en Auth es irreversible | Confirmación con "no se puede deshacer", solo sin historial y solo admin de la guardería. |
| El cupo de correos del SMTP gratuito no afecta, pero la prueba real usa la única cuenta staff | Se reactiva al terminar; no se elimina. |
| Tres botones no entran en la cabecera a 360px | Criterio de 360px; la cabecera ya usa `flex-wrap`. Si no entra, detenerse y preguntar. |

---

## Lo que **no** entra en esta spec

- Estado de familiares (archivar, reactivar, eliminar).
- Acciones de estado en la lista `/staff`.
- Archivar a un `pending`.
- Reasignar desde el aviso de archivar.
- Editar al staff.
- Borrar o anonimizar historial.

Cada una de esas, si llega, va en su propia spec.
