# SPEC 21 — Staff contra Supabase: datos reales, invitación y activación

> **Estado:** Aprobado
> **Depende de:** SPEC 10, SPEC 11, SPEC 15, SPEC 16, SPEC 17, SPEC 20
> **Fecha:** 2026-11-13
> **Objetivo:** Conectar `/staff` y `/staff/[id]` a Supabase, con vincular y desvincular reales, invitar y reenviar la invitación con `inviteUserByEmail` (SMTP gratuito de Supabase, de forma temporal), y que el staff cree su contraseña en `/create-password` y quede `active`.

---

## Por qué esta spec

SPEC 20 dejó las pantallas de staff con un mock y estado local, y planificó esta spec para hacerlas reales (sección "Specs siguientes"). Esta spec implementa el flujo "Staff" de `flujos-de-procesos.md` (pasos 1 a 5) y el de "Reenviar invitación a staff pendiente".

Hay dos cambios respecto de SPEC 20, decididos por el usuario:

- **Un staff `pending` no se puede vincular.** La policy `staff_elderly_insert_admin` exige `status = 'active'`, y se mantiene así. En el perfil de un pendiente, la tarjeta de vinculados es de solo lectura.
- **Reenviar invitación entra aquí.** El link de Supabase vence en 2 h (decisión del usuario; Supabase permite hasta 24 h), así que sin reenvío un staff que no lo abrió a tiempo queda bloqueado.

> **Temporal: correo con el SMTP gratuito de Supabase.** Por ahora el correo de invitación lo envía Supabase con su SMTP por defecto (plan gratuito). Ese SMTP solo entrega a los emails de los miembros de la organización de Supabase (para la demo, el Gmail del usuario) y **no permite editar la plantilla**: el correo sale en inglés ("You've been invited") con el link por defecto (`{{ .ConfirmationURL }}`), que devuelve la sesión en el fragmento de la URL. Por eso esta spec usa una página cliente, `/accept-invite`, que lee ese fragmento. **Más adelante se cambiará a Resend** (SMTP propio con dominio verificado): plantilla en español, link con `token_hash` a un Route Handler `/auth/confirm` y se elimina `/accept-invite`. Queda en BACKLOG ("Correo de invitación de staff con Resend").

Una sola spec con DB, Auth, correo y la pantalla nueva: decisión del usuario, aunque se recomendó dividirla.

---

## Alcance

**Dentro:**

- **Migración** `<ts>_staff_invitation_functions.sql`:
  - `get_staff_emails()`: `(id, email)` de los staff de la guardería de quien llama, solo si es admin.
  - `is_pending_staff()`: `true` si quien llama es staff `pending`.
  - `activate_staff_account()`: pasa a `active` la fila de quien llama, solo si es staff `pending`.
  - `protect_users_columns()`: permite ese cambio de `status` solo dentro de `activate_staff_account()`.
- **Lista `/staff` real** (reemplaza el mock):
  - Lee `users` (`role = 'staff'`), `staff_elderly`, `elderly`, `rooms` y `get_staff_emails()` con el cliente con sesión, después de `await io()`.
  - Mismas secciones, resúmenes e indicadores de SPEC 20. Todas las tarjetas son enlaces: se quita `isLink`.
  - Edades con `getLimaToday()` y tonos con `getAvatarTone(id)`, como `/elderly`.
- **Perfil `/staff/[id]` real:**
  - `getStaffProfileSource(id)` con `cache` de React (lo comparten `generateMetadata` y la página). Un id que no es UUID, o que no es de un staff visible, da `notFound()`.
  - `canManageLinks` solo con `status = 'active'`. Con `pending` o `archived`, la tarjeta "ADULTOS MAYORES VINCULADOS" es de solo lectura (sin "x" ni "Vincular otro adulto mayor").
  - `canResendInvitation` con `status = 'pending'`: botón "Reenviar invitación" en la cabecera, junto a "Editar", con el mismo estilo.
- **Vincular y desvincular reales** (Server Actions con el cliente con sesión; RLS hace cumplir la guardería y el `active`):
  - `linkElderlyToStaff(staffId, elderlyIds)`: insert de N filas en `staff_elderly`.
  - `unlinkElderlyFromStaff(linkId)`: delete por id, con `select("id")` para detectar 0 filas.
  - Tras guardar, `refresh()` y el mismo toast de éxito de SPEC 20. El foco vuelve a "Vincular otro adulto mayor" tras desvincular.
  - Mientras guarda: "Vinculando…" / "Desvinculando…", botones deshabilitados y `Esc` bloqueado (como en SPEC 17).
  - Error: el modal sigue abierto y se muestra el toast de error "No pudimos guardar los cambios" / "Inténtalo de nuevo.".
- **"Agregar staff" real** (`inviteStaff(formData)`):
  1. `getCurrentUser()` es admin.
  2. Repite `validateNewStaff` en el servidor.
  3. `is_team_email(email)` → error bajo Email "Ya hay alguien del equipo con este email.".
  4. `auth.admin.inviteUserByEmail(email, { data: { first_name, last_name, role: 'staff', daycare_id }, redirectTo: `${APP_URL}/accept-invite` })` con `createAdminClient()`. El `daycare_id` sale de la fila del admin.
  5. Si el email ya tiene cuenta (familiar), error bajo Email "Este email ya tiene una cuenta en Casa Nogal.".
  6. `refresh()`.
  - El cliente deja de validar duplicados contra la lista; esa validación pasa al servidor.
  - Mientras guarda: "Agregando…", botón deshabilitado y campos, X y `Esc` bloqueados.
  - Éxito: se cierra el modal, la tarjeta aparece en "PENDIENTES" (dato real, con enlace) y se muestra el toast "Staff agregado" / "Enviamos la invitación a {email}.".
  - Error inesperado: toast "No pudimos agregar al staff" / "Inténtalo de nuevo.", y `refresh()` por si la cuenta se creó.
- **"Reenviar invitación"** (`resendStaffInvitation(staffId)`):
  - Verifica que quien llama es admin y que el staff es de su guardería y sigue `pending` (lectura con sesión).
  - Toma el email de `get_staff_emails()` y llama a `inviteUserByEmail` con la misma metadata y el mismo `redirectTo`. Supabase genera un token nuevo, y el link anterior deja de funcionar.
  - Si Supabase responde que el email ya está registrado (el staff abrió el link anterior, su email quedó confirmado, pero no creó la contraseña), se usa `auth.resetPasswordForEmail(email, { redirectTo: `${APP_URL}/accept-invite` })` con `createAdminClient()`. Llega el correo de Supabase "Reset your password" (en inglés) y su link lleva al mismo flujo. Supuesto de esta spec: el error exacto de Auth se confirma en la prueba real del paso 10.
  - No borra nada de la DB: el staff no tiene fila en `invitations`.
  - Mientras envía: "Reenviando…" y botón deshabilitado. Éxito: toast "Invitación reenviada" / "Enviamos un nuevo enlace a {email}.". Error: toast "No pudimos reenviar la invitación" / "Inténtalo de nuevo.".
- **Página que recibe el link: `/accept-invite`** (temporal, mientras se use el SMTP gratuito):
  - Cómo llega: el link del correo va a `https://<proyecto>.supabase.co/auth/v1/verify?token=…&type=invite&redirect_to=…`. Supabase valida el token y redirige a `{APP_URL}/accept-invite#access_token=…&refresh_token=…&type=invite` (o `type=recovery` si vino del reenvío por recuperación). Verificado en la guía "Email templates" de Supabase: el link por defecto devuelve la sesión en el fragmento, que el servidor no puede leer.
  - Página `app/(auth)/accept-invite/page.tsx` (layout de `(auth)`, como `/activate-account`), que renderiza el Client Component `AcceptInvite`. Al montar:
    1. Lee el fragmento con `URLSearchParams(window.location.hash.slice(1))`.
    2. Si trae `error` o `error_code`, o le falta `access_token` o `refresh_token`, redirige a `/login?error=invalid_invitation_link`.
    3. Llama a `supabase.auth.setSession({ access_token, refresh_token })` con el cliente de `shared/supabase/client.ts`, que guarda la sesión en cookies.
    4. Borra el fragmento con `history.replaceState` para que los tokens no queden en el historial.
    5. Redirige con `window.location.replace("/create-password")` (navegación completa, para que el servidor lea las cookies nuevas).
  - El cliente de `@supabase/ssr` usa PKCE y **no** procesa solo el fragmento: lo rechaza con "Not a valid PKCE flow url." (verificado en `@supabase/auth-js` 2.119.0, `GoTrueClient.js`). No rompe la página; por eso se llama a `setSession` a mano. El aviso puede aparecer en la consola de esta página y es esperado.
  - Mientras procesa muestra "Preparando tu cuenta…" con `role="status"`, centrado sobre el fondo de `(auth)`.
  - `/accept-invite` pasa a ser ruta pública en `route-access.ts`: al llegar todavía no hay sesión y el proxy la mandaría a `/login` antes de guardar la sesión.
  - Mensaje en `/login` para `invalid_invitation_link`: "El enlace de invitación no es válido o ya venció. Pide a la guardería que te lo reenvíe.".
- **`/create-password`** (sin mockup; layout de `(auth)` y estilo de `activar-cuenta.dc.html`):
  - Título "Crear contraseña · Casa Nogal". Patrón de SPEC 19: página no `async` y `*Content` en `<Suspense>`. El fallback es el formulario con los campos deshabilitados.
  - Acceso:
    - Sin sesión → `/login` (proxy).
    - Usuario `active` → su home (`TEAM_HOME` / `RELATIVE_HOME`).
    - Sesión de quien no es staff `pending` (`is_pending_staff()` en `false`) → `/auth/end-session`.
  - Contenido: `AuthBrandMark`, título "Crea tu contraseña", texto "Hola, {nombres}. Elige la contraseña con la que entrarás a Casa Nogal.", email de solo lectura, "CREAR CONTRASEÑA", "CONFIRMAR CONTRASEÑA" y el botón "Crear contraseña".
  - Nombres y email salen de los claims de la sesión (`user_metadata.first_name`, `email`), solo para mostrarlos.
  - **Reutilización visual:** reusa `AuthBrandMark`, `AuthField` (ya tiene `error`, `aria-invalid` y `aria-describedby`), `AuthSubmitButton` y la regla `isValidPassword` de `auth/`. El contenedor y el encabezado (ancho máximo, marca, título y texto) son los de `ActivateAccountView`. Si ese bloque se repite entre las dos vistas, se extrae a un componente compartido de `auth/components/` en vez de copiarlo. Si a `AuthField` le falta algo (por ejemplo, solo lectura para el email), se amplía con una prop en vez de crear otro componente.
  - **Rutas separadas:** `/create-password` no se une con `/activate-account`. Solo comparten la apariencia: el familiar llega sin sesión y con código, y el staff llega con sesión y sin código.
  - Validación en cliente y servidor:
    - Contraseña sin la regla de SPEC 17 → "La contraseña debe tener al menos 8 caracteres, con letras y números.".
    - Confirmación vacía → "Vuelve a escribir la contraseña.".
    - Distinta de la contraseña → "Las contraseñas no coinciden.".
  - Server Action `createStaffPassword(formData)`:
    1. Valida.
    2. `is_pending_staff()`; si da `false`, error general.
    3. `auth.updateUser({ password })` con el cliente con sesión.
    4. `rpc("activate_staff_account")`.
    5. `redirect(TEAM_HOME)` con la sesión iniciada.
  - Errores por campo con `aria-invalid` y `aria-describedby`. Errores generales en un bloque `role="alert"`: "No pudimos crear tu contraseña. Inténtalo de nuevo." (fallo inesperado) y "No pudimos activar tu cuenta. Comunícate con la guardería." (no es staff `pending`).
  - Mientras guarda: "Creando…" y botón deshabilitado.
- **Staff `pending` con sesión que abre otra ruta:** `requireActiveUser()`, cuando hay sesión sin fila en `users`, consulta `is_pending_staff()`. Si da `true`, redirige a `/create-password`; si no, a `/auth/end-session` (como hoy).
- **Se elimina el mock:** `mock-staff.ts`, `build-new-staff-item.ts`, `isLink`, la adulta mayor Teresa y el estado local de vínculos de `linked-elderly-changes.ts`, o la parte que quede sin uso.
- **Pasos manuales del usuario en el dashboard de Supabase** (detalle en el paso 4 del plan):
  - "Site URL" y "Redirect URLs" (con `http://localhost:3000/**`).
  - "Email OTP Expiration" en 7200 s (2 h, decisión del usuario).
  - Comprobar que el email de la demo es miembro de la organización de Supabase.
  - **No** se edita la plantilla: con el SMTP gratuito no se puede.
- **Documentación:**
  - `database-schema.md`:
    - Las 3 funciones nuevas y la excepción de `protect_users_columns()`.
    - Regla 4: "activar al staff" sale de la lista de `service_role`; queda "invitar y reenviar la invitación al staff".
    - Nota de `staff_elderly`: un staff `pending` no se vincula hasta que se activa.
  - `flujos-de-procesos.md`, flujo "Staff":
    - Paso 4: el link de Supabase lleva a `/accept-invite`, que guarda la sesión y redirige a `/create-password`. Anotar que es temporal hasta pasar a Resend (`/auth/confirm` con `token_hash`).
    - Paso 5: `activate_staff_account()` con la sesión del staff, en lugar de `service_role`.
    - "Reenviar invitación": se resuelve la nota "Verificar qué función…": `inviteUserByEmail` de nuevo y, si el email ya está confirmado, `resetPasswordForEmail`.
  - `CLAUDE.md`: usos de `createAdminClient()` (+ `staff/actions/invite-staff.ts` y `staff/actions/resend-staff-invitation.ts`).
  - `pantallas-pendientes.md`:
    - Punto 8: sigue `[ ]` y se anota "(reenviar: SPEC 21; archivar y reactivar: SPEC 22)".
    - Puntos 9, 11 y 20: se marcan `[x]` con "(SPEC 21)".
  - `specs/BACKLOG.md` (ver Modelo de datos).

**Fuera de alcance (para specs futuras):**

- Archivar, reactivar, cancelar invitación y eliminar staff sin historial → SPEC 22.
- Vincular a un staff `pending` (preasignar).
- Correo de invitación con Resend (SMTP propio, plantilla en español y `/auth/confirm` con `token_hash`). Hoy: SMTP gratuito de Supabase, temporal.
- Botón "Editar" del staff.
- Gestionar el staff desde el perfil del adulto mayor ("Personal asignado").
- Recuperar contraseña.

---

## Modelo de datos

### Migración `supabase/migrations/<ts>_staff_invitation_functions.sql`

No crea tablas. Todas las funciones son `SECURITY DEFINER`, con `set search_path = ''` y nombres calificados, y EXECUTE revocado a `public` y `anon` y concedido a `authenticated`.

| Función | Tipo | Devuelve |
| --- | --- | --- |
| `get_staff_emails()` | `STABLE` | `table (id uuid, email text)`: staff (`role = 'staff'`, cualquier `status`) de `current_user_daycare_id()`, con el email de `auth.users`. Sin filas si quien llama no es admin. |
| `is_pending_staff()` | `STABLE` | `boolean`: `auth.uid()` es `role = 'staff'` y `status = 'pending'`. |
| `activate_staff_account()` | `volatile` | `void`. Si quien llama no es staff `pending`, `raise exception 'not_a_pending_staff'`. Si lo es, activa el flag local `app.staff_activation` (`set_config(..., true)`) y hace `update users set status = 'active' where id = auth.uid()`. |

- `get_staff_emails()` no es un helper de policy (regla 7): devuelve filas de otras personas, solo al admin y solo de su guardería. Se documenta en una sección aparte de los helpers. Es la misma idea que `is_team_email`, pero para leer.
- `protect_users_columns()` (se reemplaza con `create or replace`) agrega una excepción: con `app.staff_activation = 'on'`, `id = auth.uid()`, `old.role = 'staff'`, `old.status = 'pending'`, `new.status = 'active'` y ninguna otra columna protegida cambiada, se permite. El resto de reglas no cambia.
- La policy `staff_elderly_insert_admin` **no cambia** (sigue exigiendo `active`).

### Tipos (`staff/types.ts`)

```ts
export type StaffListItem = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  summary: string;
  indicator: StaffIndicator;
}; // sin isLink

export type StaffProfile = {
  // ...lo de SPEC 20
  canManageLinks: boolean;      // status = 'active'
  canResendInvitation: boolean; // status = 'pending'
};

export type InviteStaffResult =
  | { status: "invalid"; errors: NewStaffErrors }
  | { status: "error" }
  | { status: "success"; email: string };

export type StaffActionResult = { status: "success" } | { status: "error" };

export type CreatePasswordField = "password" | "passwordConfirmation";
export type CreatePasswordResult =
  | { status: "invalid"; errors: Partial<Record<CreatePasswordField, string>> }
  | { status: "error"; message: string };
```

`StaffSource` mantiene su forma. `referenceDate` pasa a ser `getLimaToday()`, y `staff` se arma con `users` + `get_staff_emails()`.

### Lectura

- `staff/get-staff-source.ts`: lista completa.
- `staff/get-staff-profile-source.ts` (`cache`, `isUuid`): el staff por id, sus `staff_elderly`, los `elderly` activos de la guardería (para el selector) más los vinculados archivados, y `rooms`.
- Supuesto de esta spec: el admin ve a todos los staff de su guardería con cualquier `status` (policy de select de admin en `users`).

### Mensajes

- `staff/new-staff-messages.ts`: `teamEmail` ("Ya hay alguien del equipo con este email."), que ya existe en el validador de SPEC 20 y se mueve aquí si hace falta, y `emailHasAccount` ("Este email ya tiene una cuenta en Casa Nogal.").
- `auth/create-password-messages.ts`: los de `/create-password`.
- `auth/login-error-messages.ts`: + `invalid_invitation_link`.

### Entradas de BACKLOG

- "Reenviar invitación a staff pendiente" → `- [x] **Estado:** resuelto en SPEC 21`.
- "Reducir los usos de `service_role`": sigue `[ ]`. En **Notas**, "Activar al staff" queda resuelto en SPEC 21 con `activate_staff_account()`, e invitar y reenviar al staff usan `service_role`.
- "Pruebas pendientes con `staff`…": se quitan del **Qué** los casos que cubra la prueba real del paso 10 (staff `active` entra a `/`, staff que abre `/staff` va a `/`). "Probar el guard de admin desde Auth": se prueba en el paso 10 si el usuario lo autoriza; si no, sigue `[ ]`.
- Nueva, "Staff": "Vincular a un staff `pending` (preasignar)". **Qué:** SPEC 21 corrige a SPEC 20: SPEC 20 permitía vincular a un staff `pending` (`canManageLinks` con `active` o `pending`), pero `staff_elderly_insert_admin` exige `active`. SPEC 21 deja la tarjeta de solo lectura para un `pending` y no toca la policy. **Notas:** si se quiere preasignar, cambiar la policy a `status in ('pending', 'active')` con su migración y volver a habilitar `canManageLinks` con `pending`.
- Nueva, "Autenticación y cuentas": "Correo de invitación de staff con Resend". **Qué:** hoy se usa el SMTP gratuito de Supabase (solo entrega a miembros de la organización, pocos correos por hora, plantilla en inglés no editable). **Cómo:** configurar Resend como SMTP propio en Supabase (requiere dominio verificado, ver "Dominio verificado en Resend"), editar las plantillas "Invite user" y "Reset password" en español con `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (o `recovery`), crear el Route Handler `/auth/confirm` con `verifyOtp` y eliminar `/accept-invite`. `inviteStaff` y `resendStaffInvitation` no cambian salvo el `redirectTo`.

---

## Estructura de archivos

```
supabase/migrations/<ts>_staff_invitation_functions.sql  # 3 funciones + protect_users_columns
app/(auth)/accept-invite/page.tsx                         # nuevo (temporal): fragmento → setSession → /create-password
app/(auth)/create-password/page.tsx                       # nuevo
auth/
  route-access.ts                                         # /accept-invite pública
  components/AcceptInvite.tsx                             # nuevo ("use client"), lo usa la página
  require-user.ts                                         # pending staff → /create-password
  login-error-messages.ts                                 # + invalid_invitation_link
  create-password-messages.ts                             # nuevo
  validate-create-password.ts                             # nuevo (usa isValidPassword)
  actions/create-staff-password.ts                        # nuevo
  components/CreatePasswordContent.tsx                    # nuevo
  components/CreatePasswordView.tsx                       # nuevo
  components/CreatePasswordForm.tsx                       # nuevo ("use client")
staff/
  types.ts                                                # sin isLink, + results
  get-staff-source.ts                                     # real
  get-staff-profile-source.ts                             # nuevo
  fetch-staff-emails.ts                                   # nuevo: rpc get_staff_emails
  build-staff-list.ts / build-staff-profile.ts            # sin isLink, canManageLinks, canResendInvitation
  new-staff-messages.ts                                   # nuevo o ampliado
  validate-new-staff.ts                                   # sin chequeo de duplicados en cliente
  actions/invite-staff.ts                                 # nuevo (service_role)
  actions/resend-staff-invitation.ts                      # nuevo (service_role)
  actions/link-elderly-to-staff.ts                        # nuevo
  actions/unlink-elderly-from-staff.ts                    # nuevo
  mock-staff.ts / build-new-staff-item.ts                 # se eliminan
  linked-elderly-changes.ts                               # se elimina o reduce
  components/
    StaffSearchList.tsx / StaffCard.tsx                   # sin estado local ni isLink
    AddStaffDialog.tsx / AddStaffForm.tsx                 # action, pendiente, errores del servidor
    StaffProfileContent.tsx / StaffProfileView.tsx        # fuente real
    StaffProfileHeader.tsx                                # + ResendInvitationButton
    ResendInvitationButton.tsx                            # nuevo
    LinkedElderlyCard.tsx                                 # actions, transición, toasts
    LinkElderlyDialog.tsx / UnlinkElderlyDialog.tsx       # pendiente y bloqueo
app/(app)/staff/[id]/page.tsx                             # generateMetadata con la fuente real
references/documents/database-schema.md
references/documents/flujos-de-procesos.md
references/documents/pantallas-pendientes.md
CLAUDE.md
specs/BACKLOG.md
```

---

## Plan de implementación

Antes de los pasos 1 y 2, cargar los skills `supabase` y `supabase-postgres-best-practices`. Antes de los pasos de UI (5, 6, 8 y 12), cargar `frontend-design:frontend-design`; gana el mockup. Antes de los pasos 5, 7, 8 y 9, consultar Context7 (supabase-js `setSession`, `updateUser`, `auth.admin.inviteUserByEmail`, `resetPasswordForEmail` y el código de error de email ya registrado) y `node_modules/next/dist/docs/` (Server Actions, `refresh`, `redirect`, Client Components).

1. **Migración.** Funciones, excepción del trigger y grants. Pedir permiso, aplicarla con `apply_migration` y correr `get_advisors`. Prueba por SQL: `anon` no ejecuta ninguna; un staff no recibe filas de `get_staff_emails()`; un `update` directo de `status` hecho por un staff sigue fallando.
2. **Lectura real.** `fetch-staff-emails.ts`, `get-staff-source.ts`, `get-staff-profile-source.ts` y builders sin `isLink`, con `canManageLinks` y `canResendInvitation`. Se elimina el mock. Prueba: `npm run build`; `/staff` muestra los staff reales (o ninguna sección si no hay) sin errores en consola.
3. **Vincular y desvincular.** Actions y `LinkedElderlyCard` / diálogos con transición, bloqueo y toasts. Prueba: `npm run build`; en el perfil de un staff `active`, vincular y desvincular persisten tras recargar. Si no hay un staff `active`, la prueba se completa en el paso 11.
4. **Configuración manual de Supabase Auth (la hace el usuario; SMTP gratuito, temporal).** La implementación se detiene hasta que el usuario confirme cada punto:
   - **Authentication → URL Configuration:**
     - "Site URL" = `http://localhost:3000` (el valor de `APP_URL`).
     - "Redirect URLs": agregar `http://localhost:3000/**`. Sin esto, Supabase ignora el `redirectTo` y manda a la Site URL.
   - **Authentication → Sign In / Providers → Email:** "Email OTP Expiration" = `7200` (2 h, decisión del usuario; el valor por defecto es 1 h).
   - **Organization → Team:** el email que se usará para la demo (el Gmail del usuario) figura como miembro. El SMTP gratuito solo entrega a esos emails, y no sirve un alias como `nombre+staff@gmail.com`.
   - **Authentication → Rate Limits:** anotar el límite de correos por hora; cada invitación y cada reenvío cuentan. El usuario confirmó que es 2 por hora, por lo que la prueba real se une en una sola (paso 10).
   - **Authentication → Emails:** no se toca. Con el SMTP gratuito la plantilla no se puede editar ("Set up custom SMTP to edit templates"); el correo sale en inglés y eso es aceptado para esta etapa.
   - Los nombres de los menús pueden variar según la versión del dashboard. Prueba: el usuario confirma los puntos.
5. **`/accept-invite` y acceso.** Página cliente, `route-access.ts`, mensaje de `/login` y `requireActiveUser()` con `is_pending_staff()`. Prueba: `/accept-invite` sin fragmento y con `#error=access_denied` redirige a `/login?error=invalid_invitation_link` con el mensaje.
6. **`/create-password`.** Página, `*Content`, vista, formulario, validación y mensajes. Prueba: sin sesión redirige a `/login`; con la sesión del admin redirige a `/`.
7. **Action de crear contraseña.** `createStaffPassword` con `updateUser` y `activate_staff_account`. Prueba: `npm run build`.
8. **"Agregar staff" real.** `inviteStaff` con `redirectTo`, errores del servidor, pendiente y toasts. Prueba: `npm run build`; agregar el email del admin muestra "Ya hay alguien del equipo con este email." sin crear nada.
9. **Reenviar invitación (solo código).** Action con `inviteUserByEmail` y el plan B `resetPasswordForEmail`, botón y toasts. Prueba: `npm run build`; el botón aparece solo en un staff `pending`. La prueba real va en el paso 10.
10. **Prueba real combinada de punta a punta: invitar, reenviar y crear contraseña** (la hace el usuario manualmente; escribe en el remoto y envía 2 correos reales, que es el límite por hora del SMTP gratuito: **no repetirla dentro de la misma hora**). Es la prueba que asegura que el flujo con el SMTP gratuito funciona:
   1. Con la app en `npm run dev` y la sesión del admin, agregar al staff con el Gmail del usuario (miembro de la organización). Llega el correo 1, "You've been invited"; **no abrirlo todavía**.
   2. Comprobar en `/staff` la tarjeta en PENDIENTES y, por SQL, la fila en `users` con `role = 'staff'`, `status = 'pending'` y el `daycare_id` del admin.
   3. En el perfil del staff, usar "Reenviar invitación" (correo 2).
      - Si Auth lo acepta: el link del correo 1 ya no debe servir (al abrirlo lleva a `/login` con el mensaje de enlace no válido).
      - Si Auth responde que el email ya está registrado: el código usa `resetPasswordForEmail` y el correo 2 es "Reset your password". Se anota el error exacto de Auth (confirma o corrige el supuesto del plan B).
   4. El usuario abre el correo 2 **en la misma PC** y su link **en una ventana privada** (para no reemplazar la sesión del admin).
   5. Comprobar que llega a `/accept-invite`, pasa a `/create-password` con "Hola, {nombres}" y el email correcto.
   6. Crear la contraseña: termina en `/` con la sesión del staff y, por SQL, `status = 'active'`.
   7. Con esa sesión, `/staff` redirige a `/`. Cerrar sesión y entrar en `/login` con el email y la contraseña nueva.
   - El caso "abrió el link pero no creó la contraseña" no se prueba por separado (haría falta un tercer correo): queda cubierto si el punto 3 cae en el plan B, y si no, queda revisado en el código y anotado en BACKLOG.
   - Si algún punto falla, **detenerse y preguntar**. El usuario decide si la cuenta se conserva para la demo o se borra (con permiso, `auth.admin.deleteUser`).
11. **Vincular y desvincular con un staff real.** Con el staff activo del paso 10: vincular y desvincular persisten tras recargar (completa la prueba del paso 3).
12. **Móvil y accesibilidad.** A 390×844 y 360 px: `/create-password`, `/accept-invite`, el botón "Reenviar invitación" en la cabecera y los modales en estado pendiente. Capturas en `.playwright-mcp/`.
13. **Documentación y BACKLOG.** `database-schema.md`, `flujos-de-procesos.md`, `pantallas-pendientes.md`, `CLAUDE.md` y `BACKLOG.md` (incluida la entrada "Correo de invitación de staff con Resend").

---

## Criterios de aceptación

**Base de datos**

- [ ] `get_staff_emails()` devuelve los staff de la guardería con su email para el admin, y 0 filas para un staff o un relative.
- [ ] `is_pending_staff()` y `activate_staff_account()` no se pueden ejecutar como `anon`.
- [ ] `activate_staff_account()` como admin o como staff `active` falla con `not_a_pending_staff` y no cambia nada.
- [ ] Un staff no puede cambiar su `status` con un `update` directo a `users` (sigue fallando por el trigger o por RLS).
- [ ] `staff_elderly_insert_admin` sigue sin cambios: insertar un vínculo a un staff `pending` falla.
- [ ] `get_advisors` no muestra avisos nuevos fuera de los aceptados en BACKLOG.

**Lista y perfil**

- [ ] `/staff` y `/staff/[id]` ya no importan `mock-staff.ts`, que no existe, y `isLink` no aparece en el código.
- [ ] `/staff` muestra los staff reales en ACTIVOS / PENDIENTES / ARCHIVADOS con los conteos de vinculados activos, y todas las tarjetas enlazan a `/staff/{id}`.
- [ ] `/staff/no-es-uuid` y un UUID que no es de un staff muestran "No encontramos a esta persona del staff".
- [ ] El perfil muestra el email real (de `auth.users`) y "En el equipo desde" según `created_at`.
- [ ] En un staff `pending`: sin "x", sin "Vincular otro adulto mayor" y con "Reenviar invitación". En un `archived`: sin ninguno de los tres. En un `active`: "x" y "Vincular otro adulto mayor", sin "Reenviar invitación".
- [ ] La consola no muestra errores, warnings de hidratación ni el aviso de datos fuera de `<Suspense>` en `/staff`, `/staff/[id]` y `/create-password`.

**Vincular y desvincular**

- [ ] Vincular N adultos mayores crea N filas en `staff_elderly` y, tras recargar, siguen ahí.
- [ ] Desvincular borra la fila; tras recargar ya no está y el adulto mayor vuelve al selector.
- [ ] Mientras guarda, los botones muestran "Vinculando…" / "Desvinculando…", están deshabilitados y `Esc` no cierra el modal.
- [ ] Con un error forzado (por ejemplo, un `linkId` inexistente), aparece el toast "No pudimos guardar los cambios" y no cambia nada.

**Agregar y reenviar**

- [ ] Agregar el email del admin o de un staff muestra "Ya hay alguien del equipo con este email." bajo Email, sin llamar a Auth.
- [ ] El código de "Agregar staff" maneja el error de email existente con "Este email ya tiene una cuenta en Casa Nogal." (revisado en el código).
- [ ] `inviteStaff` y `resendStaffInvitation` pasan `redirectTo` = `{APP_URL}/accept-invite`.
- [ ] Mientras guarda, el botón dice "Agregando…" y la X, `Esc` y los campos no responden.
- [ ] `inviteStaff` toma `role` y `daycare_id` del servidor, nunca del `FormData`.
- [ ] `resendStaffInvitation` rechaza a un staff que no es `pending` o que es de otra guardería, y usa `resetPasswordForEmail` solo si Auth responde que el email ya está registrado (revisado en el código).
- [ ] "Confirmar email" sigue sin aceptar pegar ni soltar texto.

**Activación**

- [ ] `/accept-invite` sin fragmento, con `#error=…` o sin `refresh_token` redirige a `/login` con "El enlace de invitación no es válido o ya venció. Pide a la guardería que te lo reenvíe.".
- [ ] Tras `setSession`, la URL ya no contiene el fragmento con los tokens.
- [ ] `/create-password` sin sesión va a `/login`, y con la sesión del admin va a `/`.
- [ ] El formulario muestra los 3 errores de campo (regla, confirmación vacía y no coinciden), con `aria-invalid` y `aria-describedby`.
- [ ] Mientras guarda, el botón dice "Creando…" y está deshabilitado. El fallback de `<Suspense>` muestra el formulario con los campos deshabilitados.
- [ ] `/create-password` no define componentes propios de campo, botón ni marca: usa los de `auth/components/`, y su contenedor y encabezado se ven igual que los de `/activate-account` a 1440×900 y 390×844.
- [ ] `createStaffPassword` llama a `is_pending_staff()` antes de `updateUser`, y a `activate_staff_account()` después; no recibe ningún id del cliente.

**Prueba real con el SMTP gratuito (paso 10, manual del usuario, 2 correos)**

- [ ] El correo de invitación llega al Gmail del usuario.
- [ ] "Reenviar invitación" envía un correo nuevo, y se anota si Auth lo aceptó o si se usó el plan B (con el error exacto de Auth).
- [ ] Si el reenvío fue aceptado, el link del primer correo ya no sirve.
- [ ] El link lleva a `/accept-invite` y luego a `/create-password` con los nombres y el email del staff.
- [ ] Crear la contraseña deja `status = 'active'`, inicia sesión en `/` y el staff puede volver a entrar por `/login`.
- [ ] Con la sesión del staff, `/staff` redirige a `/`.

**Cierre**

- [ ] `createAdminClient()` solo se usa en `get-invitation-preview.ts`, `activate-account.ts`, `invite-staff.ts` y `resend-staff-invitation.ts`.
- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] A 390×844 y 360 px no hay scroll horizontal en `/staff`, `/staff/[id]` (con "Reenviar invitación") ni en `/create-password`.
- [ ] `database-schema.md`, `flujos-de-procesos.md`, `pantallas-pendientes.md`, `CLAUDE.md` y `BACKLOG.md` tienen los cambios de esta spec.
- [ ] Capturas en `.playwright-mcp/`: `/staff` real, perfil `pending` con "Reenviar invitación", "Agregar staff" con el error de equipo, y `/create-password` vacío y con errores.

---

## Decisiones

- **Sí:** una sola spec con DB, invitación, activación y vínculos. Decisión del usuario, aunque se recomendó dividirla.
- **Sí, temporal:** `inviteUserByEmail` con el SMTP gratuito de Supabase (decisión del usuario), para la demo con el Gmail del usuario. El correo sale en inglés porque sin SMTP propio la plantilla no se edita. **Luego:** Resend como SMTP propio (entrada en BACKLOG). **No por ahora:** `generateLink` + Resend desde el código, ni Resend como SMTP, porque sin dominio verificado Resend solo entrega al email de la cuenta de Resend, que el usuario ya usa para la demo del familiar.
- **Sí:** emails con `get_staff_emails()` `SECURITY DEFINER`, solo para el admin (decisión del usuario). **No:** `listUsers` con `service_role` (más usos de la llave) ni duplicar `email` en `users` (lo prohíbe el esquema).
- **Sí:** un staff `pending` no se vincula y su tarjeta es de solo lectura (decisión del usuario). Cambia lo decidido en SPEC 20; la policy no se toca.
- **Sí:** activar con `activate_staff_account()` y la sesión del staff (decisión del usuario), como `accept_invitation` en SPEC 17. **No:** `service_role` (paso 5 de los flujos, que se actualiza). **No:** trigger en `auth.users`, que también se dispararía al recuperar la contraseña.
- **Sí:** flag local de transacción para la excepción del trigger. El staff no puede cambiar su `status` por otra vía, porque el flag solo lo activa la función.
- **Sí:** tras crear la contraseña, sesión iniciada y redirección a `TEAM_HOME` (decisión del usuario).
- **Sí:** `/create-password` con el estilo de `activar-cuenta.dc.html` y dos campos (decisión del usuario). Supuesto de esta spec: el mockup no existe; el copy lo propone esta spec.
- **Sí:** `/create-password` separada de `/activate-account` (decisión del usuario), reusando sus piezas visuales. **No:** una sola ruta con dos modos: mezclaría una ruta pública con una que exige sesión, con dos guardas, fuentes de datos y actions.
- **Sí:** ruta `/create-password` y no `/crear-contrasena` (nombre de los flujos y de SPEC 20). Todas las rutas del proyecto están en inglés (`/activate-account`, `/staff`); se actualiza `flujos-de-procesos.md`.
- **Sí, temporal:** página cliente `/accept-invite` que lee el fragmento y llama a `setSession`. Verificado: con la plantilla por defecto la sesión vuelve en el fragmento (guía "Email templates" de Supabase), y el cliente PKCE de `@supabase/ssr` no lo procesa solo (`GoTrueClient.js`). **No:** `/auth/confirm` con `token_hash`, porque necesita editar la plantilla; se hará al pasar a Resend. **No:** cambiar el cliente del navegador a flujo implícito, que afectaría a toda la app.
- **Sí:** un staff `pending` con sesión que abre otra ruta va a `/create-password`. **No:** cerrarle la sesión, porque el link ya se usó y tendría que pedir un reenvío.
- **Sí:** "Reenviar invitación" en esta spec (decisión del usuario), con OTP de 2 h. No borra nada en la DB: solo cambia el token interno de Supabase.
- **Sí:** plan B del reenvío con `resetPasswordForEmail` cuando el email ya está confirmado. El cliente admin de `supabase-js` usa flujo implícito por defecto, así que su link también vuelve con el fragmento y sirve la misma página.
- **Sí:** el email que ya tiene cuenta muestra un mensaje bajo Email (decisión del usuario).
- **Sí:** el duplicado del equipo se valida en el servidor con `is_team_email`. **No:** pasar los emails de la lista al cliente.
- **Sí:** el botón "Reenviar invitación" va en la cabecera, junto a "Editar". Supuesto de esta spec: no hay mockup.
- **Sí:** prueba real de punta a punta en la implementación (paso 10, una sola prueba combinada que hace el usuario manualmente, porque el límite del SMTP gratuito es de 2 correos por hora), para asegurar que el flujo con el SMTP gratuito funciona (pedido del usuario). Cambia lo decidido antes (verificación manual en BACKLOG).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El SMTP gratuito de Supabase envía pocos correos por hora (2, confirmado por el usuario) y solo a los miembros de la organización | La demo usa el Gmail del usuario (miembro); la prueba del paso 10 usa exactamente los 2 correos, así que no se repite dentro de la misma hora. Entrada "Correo de invitación de staff con Resend" en BACKLOG. |
| Abrir el link en el navegador donde está el admin reemplaza su sesión | El paso 10 abre el link en una ventana privada. |
| Abrir el correo en otro dispositivo: `localhost` no carga | Para la demo, abrir el correo en la misma PC donde corre `npm run dev`. |
| El correo cae en spam o en "Promociones" | Revisar esas carpetas en el paso 10. |
| `inviteUserByEmail` falla al reenviar si el staff ya abrió el link (email confirmado) sin crear la contraseña | Plan B con `resetPasswordForEmail`; se prueba en el paso 10. Si el error de Auth no es el esperado, detenerse y preguntar. |
| `inviteUserByEmail` falla por el SMTP después de crear el usuario | Toast de error y `refresh()`: si la cuenta quedó creada, aparece en PENDIENTES y se puede reenviar. |
| `updateUser({ password })` exige reautenticación si está activado "Secure password change" | Revisar el ajuste en el paso 7; en una sesión recién creada por el link no debería aplicar. |
| Falta `http://localhost:3000/**` en Redirect URLs o la Site URL es otra | Paso 4: la implementación no sigue hasta que el usuario lo confirme. Si igual falta, el link termina en la Site URL y el paso 10 lo detecta. |
| La página cliente muestra en consola "Not a valid PKCE flow url." | Esperado e inofensivo (el cliente PKCE rechaza el fragmento antes de que se llame a `setSession`); desaparece al pasar a Resend con `/auth/confirm`. |

---

## Lo que **no** entra en esta spec

- Archivar, reactivar, cancelar invitación y eliminar sin historial (SPEC 22).
- Preasignar adultos mayores a un staff `pending`.
- Correo con Resend (SMTP propio, plantilla en español y `/auth/confirm`), edición del staff y recuperar contraseña.
- Gestión del staff desde el perfil del adulto mayor.

Cada una de esas, si llega, va en su propia spec.
