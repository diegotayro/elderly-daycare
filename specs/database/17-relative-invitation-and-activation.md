# SPEC 17 — Invitar familiares desde el perfil y activar la invitación

> **Estado:** Aprobado
> **Depende de:** SPEC 03, SPEC 05, SPEC 11, SPEC 15, SPEC 16
> **Fecha:** 2026-11-10
> **Objetivo:** Que el admin invite a un familiar desde "Vincular otro familiar/tutor" (fila en `invitations` + correo con Resend) y que el familiar la active en `/activate-account`, creando su cuenta o usando la que ya tiene, y quedando vinculado al adulto mayor.

---

## Alcance

**Dentro:**

- **Tabla `invitations`** (migración) con RLS solo para admin, código generado en Postgres e índice único de invitación `pending` por adulto mayor y email.
- **Funciones SQL:**
  - `generate_invitation_code()`: default de `code`.
  - `is_email_linked_to_elderly(elderly_id, email)` e `is_team_email(email)`: booleanos para el admin.
  - `get_invitation_preview(code)`: solo para `service_role`.
  - `accept_invitation(code, photo_consent)`: `SECURITY DEFINER`, la llama el familiar con su sesión.
- **Modal "Vincular familiar/tutor"** (SPEC 05):
  - "Enviar invitación" llama a la Server Action `createRelativeInvitation`.
  - Antes de enviar no se muestra el bloque CÓDIGO DE INVITACIÓN.
  - Si sale bien, el modal pasa a un estado de éxito con el código real, "Vence en 7 días" y el botón "Listo".
  - Estado pendiente: "Enviando…", botón deshabilitado, campos, X y Esc bloqueados.
  - Error inesperado: toast de error como en SPEC 14.
- **Validación en el servidor** de la invitación (repite la del cliente), más:
  - Email ya vinculado a este adulto mayor → "Este email ya está vinculado a {nombre de pila}.".
  - Email de un staff o admin de la guardería → "Este email pertenece al personal.".
  - Las `pending` vencidas de ese email y adulto mayor se marcan `expired` antes de insertar, así que no bloquean.
- **Reemplazar una invitación pendiente vigente** (mismo email y adulto mayor, por ejemplo si el familiar perdió el correo):
  - Al tocar "Enviar invitación" no se envía. Bajo EMAIL aparece el aviso "Este familiar ya tiene una invitación pendiente. Si continúas, la nueva reemplazará a la anterior y su código dejará de funcionar." y el botón cambia a "Reemplazar invitación".
  - Un segundo clic envía. La invitación anterior pasa a `cancelled` y se crea una nueva, con código y correo nuevos y los datos que llenó el admin.
  - Editar EMAIL quita el aviso y el botón vuelve a "Enviar invitación".
  - El servidor también lo comprueba. Si la pendiente aparece entre la carga de la página y el envío, responde pidiendo la misma confirmación.
  - Reemplaza el error "Ya hay una invitación pendiente con este email." de SPEC 05.
- **Correo con Resend** (React Email):
  - Asunto "Te invitaron a seguir a {nombre completo} en Casa Nogal".
  - Contenido: nombre del adulto mayor, código, vencimiento y botón a `{APP_URL}/activate-account?code={code}`.
  - Si Resend falla, la invitación queda guardada. El estado de éxito muestra el aviso "No pudimos enviar el correo. Comparte este código con {nombres del invitado}.".
- **Perfil y listado:**
  - El botón "Vincular otro familiar/tutor" solo lo ve el admin, y solo en un adulto mayor activo.
  - Las invitaciones `pending` vigentes aparecen como filas PENDIENTE en "Familiares vinculados" (los builders ya lo soportan).
  - Las mismas invitaciones cuentan en los conteos de `/elderly`.
  - El staff no las ve (RLS).
- **`/activate-account` real** (reemplaza el mock):
  - Con `?code=` válido: tarjeta del adulto mayor, código y email precargados. La etiqueta del password es "CREAR CONTRASEÑA" si el email no tiene cuenta, o "INGRESE SU CONTRASEÑA" si ya la tiene (familiar de otro adulto mayor).
  - Sin `?code=` o con un código escrito a mano: la etiqueta empieza en "CREAR CONTRASEÑA". Si al enviar el email ya tiene cuenta, el servidor responde "Este email ya tiene cuenta. Ingresa tu contraseña." y la etiqueta cambia a "INGRESE SU CONTRASEÑA".
  - **Familiar nuevo:** `auth.admin.createUser` con `service_role`, luego `signInWithPassword` y `accept_invitation`.
  - **Familiar con cuenta:** `signInWithPassword` con la contraseña ingresada y luego `accept_invitation`. No se crea usuario.
  - Al terminar: sesión iniciada y redirección al destino del `relative` (`/family-pending`, el mismo `RELATIVE_HOME` de `sign-in.ts`).
  - Errores bajo cada campo (mismo patrón que los modales) y errores generales en un bloque `role="alert"` sobre el botón.
  - Estado pendiente: "Activando…" y botón deshabilitado.
  - Fallback de `<Suspense>`: el mismo formulario con los campos deshabilitados, para no perder lo escrito (resuelve la entrada de BACKLOG).
- **Regla de contraseña** (mínimo 8 caracteres, al menos una letra y un dígito):
  - En `/activate-account`, en el cliente y en el servidor, tanto para CREAR como para INGRESE SU CONTRASEÑA.
  - En `/login`, en el servidor (`sign-in.ts`).
  - En Supabase Auth: paso manual del usuario en el dashboard (Auth > Password: mínimo 8, "letters and digits").
- Cliente `service_role` nuevo en `shared/supabase/admin.ts`, usado solo para `get_invitation_preview` y `auth.admin.createUser`.
- Variables de entorno nuevas en `.env.template`: `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `APP_URL`.
- Documentación:
  - `database-schema.md`:
    - Tabla `invitations` con sus constraints. `email`, `relationship` e `invited_by` pasan a `NOT NULL`.
    - Funciones nuevas.
    - Regla 4: "aceptar invitaciones" pasa a "leer la invitación sin sesión y crear la cuenta del familiar".
    - Nota de `guardian_elderly`: el vínculo lo crea `accept_invitation` (`SECURITY DEFINER`), llamada con la sesión del familiar después de validar que la invitación es suya. El insert directo del familiar sigue bloqueado por RLS.
  - `flujos-de-procesos.md`:
    - "Familiar" y "Familiar que ya tiene cuenta": indicar en cada paso qué permiso usa. `service_role` para leer la invitación sin sesión y para `auth.admin.createUser`; cliente con sesión para `signInWithPassword`; sesión del familiar para `accept_invitation`.
    - Paso 7 de "Familiar" y paso 4 de "Familiar que ya tiene cuenta": el vínculo, el consentimiento y el `accepted` los hace `accept_invitation` en una sola transacción, con la sesión del familiar.
    - "Familiar que ya tiene cuenta", paso 2: se hace en "Activar cuenta" con "INGRESE SU CONTRASEÑA", no en "Vincular adulto mayor".
    - Nota al final de "Regla del consentimiento de fotos" ("si el email ya tiene cuenta… use 'Vincular adulto mayor'"): se reemplaza por el cambio de etiqueta a "INGRESE SU CONTRASEÑA".
    - Línea "`daycare_id`: se toma de la fila del admin que hace la acción": aclarar que vale para el staff; para el familiar se toma del adulto mayor de la invitación (paso 6).
    - "Familiar", pasos 1–2: validaciones al invitar. El email no está vinculado a ese adulto mayor y no es del personal. Antes de insertar, las `pending` vencidas de ese email y adulto mayor se marcan `expired`. Si hay una `pending` vigente, el admin confirma el reemplazo y la anterior pasa a `cancelled`.
    - Anotar lo que agrega esta spec: tras activar se inicia sesión y se redirige al destino del familiar; la contraseña tiene mínimo 8 caracteres, con letras y dígitos; no se invita ni se activa una invitación de un adulto mayor archivado.
  - `CLAUDE.md`: lista de usos de `service_role`, con el mismo cambio que la regla 4.
  - `specs/BACKLOG.md`.
- Verificación con una invitación real enviada al email de la cuenta de Resend del usuario y **limpieza con permiso** al terminar.

**Fuera de alcance (para specs futuras):**

- Cancelar o reenviar invitaciones desde la UI.
- Cron que marque `expired`.
- Dominio verificado en Resend (hoy remitente `onboarding@resend.dev`, que solo entrega al email de la cuenta de Resend).
- Pantalla "Vincular adulto mayor" para un familiar con sesión: se reemplaza por "INGRESE SU CONTRASEÑA" en "Activar cuenta".
- Un staff que también es familiar de un adulto mayor: hoy se bloquea (entrada nueva en BACKLOG).
- Validación de formato de contraseña en el cliente de `/login` y su diseño de errores (entrada "Estados definitivos de error y carga del login").
- Eliminar `/family-pending` y el feed del familiar.
- Limitar intentos (rate limiting) de códigos en `/activate-account`.
- Recuperar contraseña.

---

## Modelo de datos

### Migración `supabase/migrations/<timestamp>_create_invitations.sql`

```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.elderly(id) on delete cascade,
  invited_by uuid not null references public.users(id),
  first_name text not null,   -- no vacío, máx. 80
  last_name text not null,    -- no vacío, máx. 80
  full_name text generated always as (first_name || ' ' || last_name) stored,
  email text not null,        -- en minúsculas y sin espacios, máx. 254
  relationship public.relationship_type not null,
  code text not null unique default public.generate_invitation_code(),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
```

- Constraints con nombre: `invitations_first_name_not_blank`, `invitations_first_name_max_length`, lo mismo para `last_name`, `invitations_email_normalized` (`email = lower(btrim(email))`), `invitations_email_max_length` y `invitations_code_format` (`^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$`).
- `create unique index invitations_elderly_id_email_pending_key on invitations (elderly_id, email) where status = 'pending';`
- Índices en `elderly_id` e `invited_by` (FK).
- Enums `relationship_type` e `invitation_status`: crearlos solo si aún no existen (verificar en el remoto).

**RLS** (`to authenticated`, helpers envueltos en `(select ...)`):

| Policy | Regla |
| --- | --- |
| `invitations_select_admin` | admin; el adulto mayor es de su guardería |
| `invitations_insert_admin` | admin; adulto mayor de su guardería, `invited_by = auth.uid()` y `status = 'pending'` |
| `invitations_update_admin` | admin; adulto mayor de su guardería (en `using` y `with check`) |

- Sin policy de delete.
- `revoke update` a `authenticated` y `grant update (status)`: el admin solo cambia `status`.

### Funciones

| Función | Tipo | EXECUTE | Devuelve |
| --- | --- | --- | --- |
| `generate_invitation_code()` | `volatile`, invoker | (default de columna) | 5 caracteres de `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (31⁵ ≈ 28,6 M) con `extensions.gen_random_bytes` y muestreo por rechazo (sin sesgo) |
| `is_email_linked_to_elderly(p_elderly_id uuid, p_email text)` | `SECURITY DEFINER STABLE` | `authenticated` | `true` si hay un `guardian_elderly` de ese adulto mayor cuyo usuario tiene ese email en `auth.users`. `false` si quien llama no es admin de la guardería del adulto mayor |
| `is_team_email(p_email text)` | `SECURITY DEFINER STABLE` | `authenticated` | `true` si ese email es de un staff o admin de la guardería de quien llama. `false` si quien llama no es admin |
| `get_invitation_preview(p_code text)` | `SECURITY DEFINER STABLE` | solo `service_role` | una fila si la invitación es `pending`, `expires_at > now()` y el adulto mayor está `active`: `email`, `first_name`, `last_name`, `elderly_full_name`, `elderly_first_name`, `elderly_id`, `room_name`, `daycare_id`, `has_account` (existe en `auth.users`). Sin filas en otro caso |
| `accept_invitation(p_code text, p_photo_consent boolean)` | `SECURITY DEFINER`, `volatile` | `authenticated` | `uuid` del adulto mayor. Ver pasos abajo |

Todas con `set search_path = ''` y nombres calificados. EXECUTE revocado a `public` y `anon`. El código se compara en mayúsculas y sin espacios.

`accept_invitation`, en una transacción:

1. Quien llama es `relative` activo (`current_user_role()`).
2. Bloquea la invitación (`for update`) por código.
3. Valida: `pending`, `expires_at > now()`, email igual al de `auth.jwt() ->> 'email'` (sin mayúsculas), adulto mayor `active` y de `current_user_daycare_id()`.
4. Inserta en `guardian_elderly` (`on conflict do nothing`).
5. Si `p_photo_consent = false`, pone `elderly.photo_consent = false` ("gana el no"). Si es `true`, no cambia nada.
6. Marca la invitación `accepted` con `accepted_at = now()`.
7. Errores con `raise exception` y mensajes fijos: `invitation_not_found`, `invitation_email_mismatch`, `not_a_relative`.

### Tipos y lectura (`shared/database/types.ts`, `elderly/`)

- `Invitation` ya existe; no cambia.
- `getElderlySource()` y `getElderlyProfileSource()` leen `invitations` con `status = 'pending'` y `expires_at > now` (después de `await io()`), en lugar de `invitations: []`. El staff recibe `[]` por RLS.
- `ElderlyProfile` + `canLinkRelative: boolean` (admin y adulto mayor activo).

### Server Action de la invitación

```ts
// elderly/actions/create-relative-invitation.ts
export async function createRelativeInvitation(
  elderlyId: string,
  formData: FormData,
): Promise<CreateRelativeInvitationResult>;

// elderly/types.ts
export type CreateRelativeInvitationResult =
  | { status: "invalid"; errors: RelativeInvitationErrors }
  | { status: "needs_replace_confirmation" } // hay una pending vigente y no se confirmó
  | { status: "error" }
  | { status: "success"; code: string; email: string; expiresInDays: number; emailSent: boolean };
```

Pasos:

1. `getCurrentUser()` es admin.
2. Validación con `validateRelativeInvitation`. Deja de revisar los emails pendientes; ese caso ya no es un error.
3. `is_email_linked_to_elderly` / `is_team_email`.
4. Marca `expired` las `pending` vencidas del par.
5. Si queda una `pending` vigente del par: sin `replacePending=true` en el `FormData` (campo oculto que pone el formulario tras el aviso), devuelve `needs_replace_confirmation`; con él, la marca `cancelled`.
6. Insert con `select("code, expires_at")`. Ante `23505`: si es `invitations_code_key`, reintenta (máx. 3); si es `invitations_elderly_id_email_pending_key` (otra pendiente creada en paralelo), devuelve `needs_replace_confirmation`.
7. Envía el correo.
8. `refresh()`.

Mensajes en `elderly/relative-invitation-messages.ts`: nuevos `emailAlreadyLinked` ("Este email ya está vinculado a {nombre}.", función), `emailBelongsToTeam` ("Este email pertenece al personal.") y `pendingReplaceWarning` (el aviso de reemplazo). Se elimina `emailAlreadyPending`.

El formulario detecta la pendiente con `pendingInvitationEmails` (ya existe en `ElderlyProfile`), sin consultar al servidor. El aviso usa el estilo del aviso azul del modal (`notice-bg`, `notice-ink`), no el de error. Supuesto de esta spec: el mockup no lo cubre y no es un error.

### Correo

- `shared/email/resend.ts` (server-only): cliente con `RESEND_API_KEY`.
- `sendEmail({ to, subject, react })` devuelve `boolean` y nunca lanza.
- `elderly/emails/RelativeInvitationEmail.tsx`: plantilla React Email con la paleta del mockup (coral `#EE8164`, fondo `#FBF4EC`, código en `#8A7234` sobre `#FBF1D6`).

### Activación

```ts
// auth/types.ts
export type InvitationPreview = {
  code: string; email: string; elderlyFullName: string; elderlyInitial: string;
  elderlyTone: AvatarTone; roomName: string;
  hasAccount: boolean; // decide CREAR vs INGRESE SU CONTRASEÑA
};

export type ActivateAccountField = "code" | "email" | "password";
export type ActivateAccountResult =
  | { status: "invalid"; errors: Partial<Record<ActivateAccountField, string>>; passwordMode: PasswordMode }
  | { status: "error"; message: string; passwordMode: PasswordMode };
export type PasswordMode = "create" | "existing";
```

- `auth/get-invitation-preview.ts` (server-only): llama a `get_invitation_preview` con `createAdminClient()`. Devuelve los datos del servidor (nombres, `daycare_id`), y `toInvitationPreview()` arma lo que llega al cliente, sin `daycare_id` ni `elderly_id`.
- `auth/actions/activate-account.ts`:
  1. Valida el formato: código de 5 caracteres, email y contraseña.
  2. Lee la vista previa → error de código si no hay.
  3. Compara el email → error de email.
  4. Si no tiene cuenta, `createUser` (`email_confirm: true`, metadata `first_name`, `last_name`, `role: 'relative'` y `daycare_id` de la invitación). Si el formulario estaba en modo `create` y el email ya tiene cuenta, devuelve `passwordMode: "existing"` con el mensaje.
  5. `signInWithPassword` con el cliente con sesión.
  6. `rpc("accept_invitation")`. Si falla, `signOut()` y error general.
  7. `revalidatePath` y `redirect(RELATIVE_HOME)`.
- Se elimina `auth/find-invitation-preview.ts`; las invitaciones de `mockElderly` quedan sin uso en `/activate-account`.

Mensajes (`auth/activate-account-messages.ts`):

| Caso | Campo | Mensaje |
| --- | --- | --- |
| código vacío o con otro formato | code | "Ingresa el código de 5 caracteres." |
| código inexistente, vencido o usado | code | "El código no es válido o ya venció." |
| email vacío o inválido | email | "Ingresa un email válido." |
| email distinto al de la invitación | email | "Este email no coincide con la invitación." |
| contraseña sin la regla | password | "La contraseña debe tener al menos 8 caracteres, con letras y números." |
| ya tiene cuenta (modo create) | password | "Este email ya tiene cuenta. Ingresa tu contraseña." |
| contraseña incorrecta (modo existing) | password | "La contraseña no es correcta." |
| cuenta archivada o no relative | general | "No pudimos activar la invitación con esta cuenta. Comunícate con la guardería." |
| fallo inesperado | general | "No pudimos activar tu cuenta. Inténtalo de nuevo." |

### Regla de contraseña

```ts
// auth/validate-password.ts — pura
export function isValidPassword(password: string): boolean; // ≥ 8, /[A-Za-z]/ y /\d/
```

La usan `activate-account.ts`, `ActivateAccountForm` y `sign-in.ts`. En `/login`, un formato inválido redirige con `?error=invalid_credentials`, para no revelar la regla a quien prueba cuentas ajenas.

### Cliente `service_role`

```ts
// shared/supabase/admin.ts — import "server-only"
export function createAdminClient(): SupabaseClient; // SUPABASE_SECRET_KEY, sin persistir sesión
```

### Datos de verificación (remoto, con permiso)

| Dato | Detalle |
| --- | --- |
| Invitación 1 | A Luis Fernández, al email de la cuenta de Resend del usuario. Se activa como familiar nuevo. |
| Invitación 2 | Mismo email, a otro adulto mayor activo. Se activa con "INGRESE SU CONTRASEÑA". |

Limpieza: borrar el usuario de `auth.users` (cascade a `users` y `guardian_elderly`), borrar las filas de `invitations` por SQL y restaurar `photo_consent` si se cambió.

### Entradas de BACKLOG

- "Conteos reales de familiares en `/elderly`" → `- [x] **Estado:** resuelto en SPEC 17`.
- "Pérdida de lo escrito en `/activate-account` durante el streaming" → `- [x] **Estado:** resuelto en SPEC 17`.
- "Reducir los usos de `service_role`" → sigue `[ ]`. El **Qué** queda sin "aceptar una invitación"; se anota que la vista previa usa `service_role`.
- "Pruebas pendientes con `staff`, `pending`, `archived` y `relative`" → se quita del **Qué** "`relative` activo entra a `/family-pending`" si se verifica.
- Nueva, "Autenticación y cuentas": "Staff que también es familiar" (hoy se bloquea al invitar y en `accept_invitation`).
- Nueva: "Dominio verificado en Resend" (cambiar `RESEND_FROM_EMAIL`).
- Nueva: "Cancelar y reenviar invitaciones de familiares".
- Nueva: "Límite de intentos de código en `/activate-account`".

---

## Estructura de archivos

```
supabase/migrations/<ts>_create_invitations.sql      # tabla, índices, RLS, 5 funciones
shared/supabase/admin.ts                             # nuevo (service_role)
shared/email/resend.ts                               # nuevo: cliente + sendEmail
shared/database/types.ts                             # sin cambios esperados
elderly/
  actions/create-relative-invitation.ts              # nuevo
  emails/RelativeInvitationEmail.tsx                 # nuevo
  fetch-pending-invitations.ts                       # nuevo, compartido por listado y perfil
  get-elderly-source.ts / get-elderly-profile-source.ts  # invitaciones reales
  build-elderly-profile.ts / types.ts                # canLinkRelative, CreateRelativeInvitationResult
  relative-invitation-messages.ts                    # + 2 mensajes
  mock-invitation-code.ts                            # se elimina
  components/
    LinkedRelativesCard.tsx / ElderlyProfileView.tsx / ElderlyProfileContent.tsx  # botón solo si canLinkRelative
    LinkRelativeDialog.tsx                           # transición, toast, bloqueo al enviar
    LinkRelativeForm.tsx                             # llama a la action, errores del servidor
    LinkRelativeSuccess.tsx                          # nuevo: estado de éxito
    InvitationCodePreview.tsx                        # recibe code y expiresInDays
auth/
  actions/activate-account.ts                        # nuevo
  actions/sign-in.ts                                 # + regla de contraseña
  get-invitation-preview.ts                          # nuevo (server-only)
  validate-password.ts                               # nuevo
  activate-account-messages.ts                       # nuevo
  find-invitation-preview.ts                         # se elimina
  types.ts                                           # InvitationPreview.hasAccount, ActivateAccount*
  components/ActivateAccountForm.tsx                 # "use client", modos y errores
  components/AuthField.tsx                           # + error y aria (si no lo soporta)
app/(auth)/activate-account/page.tsx                 # vista previa real, fallback deshabilitado
.env.template                                        # 4 variables nuevas
references/documents/database-schema.md
references/documents/flujos-de-procesos.md
CLAUDE.md
specs/BACKLOG.md
package.json                                         # resend, @react-email/components
```

---

## Plan de implementación

Antes de los pasos 1 y 2, cargar los skills `supabase` y `supabase-postgres-best-practices`. Antes de los pasos de UI (6, 7 y 10), cargar `frontend-design:frontend-design`; gana el mockup. Antes de los pasos 4, 5 y 9, consultar Context7 (Resend, React Email, supabase-js `auth.admin`) y `node_modules/next/dist/docs/` (Server Actions, `refresh`, `redirect`).

1. **Migración: tabla y RLS.** `invitations`, constraints, índices, policies, grants y `generate_invitation_code()`. Pedir permiso y aplicarla con `apply_migration`, luego `get_advisors`. Prueba: un insert como admin genera un código válido.
2. **Migración: funciones.** `is_email_linked_to_elderly`, `is_team_email`, `get_invitation_preview` y `accept_invitation` en una segunda migración. Con permiso. Prueba: `anon` y `authenticated` no pueden ejecutar `get_invitation_preview`.
3. **Lectura de invitaciones.** `fetch-pending-invitations.ts` en listado y perfil, y `canLinkRelative`. Prueba: con una invitación de prueba, Luis muestra una fila PENDIENTE y su tarjeta cuenta 1.
4. **Clientes y correo.** `admin.ts`, `resend.ts`, plantilla del correo y variables en `.env.template`. Prueba: `npm run build`.
5. **Server Action de la invitación.** `createRelativeInvitation` con validaciones, expiración de vencidas, reintento y correo. Prueba: `npm run build`.
6. **Modal conectado.** Sin bloque de código antes de enviar, pendiente, errores del servidor, toast de error y estado de éxito con "Listo". Botón solo para admin y adulto mayor activo. Prueba: invitar al email de Resend y recibir el correo.
7. **Regla de contraseña.** `validate-password.ts` y su uso en `sign-in.ts`. Prueba: el admin sigue entrando; `abc` muestra el error de credenciales.
8. **Vista previa real.** `get-invitation-preview.ts`, `page.tsx` con el fallback deshabilitado y la etiqueta según `hasAccount`. Prueba: el link del correo muestra la tarjeta de Luis y "CREAR CONTRASEÑA".
9. **Server Action de activación.** `activate-account.ts` con los dos caminos. Prueba: activar la invitación 1 inicia sesión y lleva a `/family-pending`.
10. **Formulario de activación.** Client Component con errores por campo, bloque general, "Activando…" y cambio de modo. Prueba: escribir el código a mano con un email existente cambia a "INGRESE SU CONTRASEÑA".
11. **Verificación con datos.** Pedir permiso; invitación 2 y activación con cuenta existente; criterios y capturas en `.playwright-mcp/`.
12. **Limpieza.** Pedir permiso; borrar los datos de verificación.
13. **Documentación.** `database-schema.md`, `flujos-de-procesos.md`, `CLAUDE.md` y `BACKLOG.md`. Recordar al usuario el paso manual de la política de contraseñas en el dashboard.

---

## Criterios de aceptación

**Base de datos**

- [ ] `invitations` existe con RLS activado, las 3 policies `invitations_*_admin` y sin policy de delete.
- [ ] Un insert sin `code` genera 5 caracteres que cumplen `invitations_code_format`.
- [ ] Dos `pending` con el mismo `elderly_id` y email fallan con `invitations_elderly_id_email_pending_key`; con la primera en `expired`, la segunda se inserta.
- [ ] Como staff, `select` en `invitations` devuelve 0 filas e `insert` falla.
- [ ] El admin no puede cambiar otra columna que no sea `status`.
- [ ] `get_invitation_preview` falla para `anon` y `authenticated`, y responde para `service_role`.
- [ ] `accept_invitation` con un email distinto al de la sesión falla y no crea el vínculo.
- [ ] `accept_invitation` con `p_photo_consent = true` no cambia `photo_consent`; con `false` lo pone en `false`.
- [ ] `get_advisors` no muestra avisos nuevos fuera de los aceptados en BACKLOG.

**Invitar (admin)**

- [ ] El staff no ve "Vincular otro familiar/tutor"; el admin lo ve en un adulto mayor activo y no en uno archivado.
- [ ] Antes de enviar, el modal no muestra el bloque CÓDIGO DE INVITACIÓN.
- [ ] Con datos válidos, el modal muestra "Invitación enviada a {email}", el código real, "Vence en 7 días" y "Listo".
- [ ] Mientras se envía, el botón dice "Enviando…" y la X, Esc y los campos no responden.
- [ ] Al cerrar con "Listo", el perfil muestra la fila PENDIENTE y `/elderly` cuenta la invitación.
- [ ] Llega el correo al email de la cuenta de Resend con el asunto, el código y el botón al link correcto.
- [ ] Con `RESEND_API_KEY` inválida, la invitación se guarda y el estado de éxito muestra el aviso de compartir el código.
- [ ] Invitar el email de un familiar ya vinculado al mismo adulto mayor muestra "Este email ya está vinculado a {nombre}.".
- [ ] Invitar el email del admin muestra "Este email pertenece al personal.".
- [ ] Con un email que tiene una invitación `pending` vigente para este adulto mayor, "Enviar invitación" no envía: muestra el aviso de reemplazo bajo EMAIL y el botón dice "Reemplazar invitación".
- [ ] Al tocar "Reemplazar invitación", la invitación anterior queda `cancelled`, su código ya no sirve en `/activate-account`, se crea una nueva con otro código y llega un correo nuevo.
- [ ] Editar EMAIL después del aviso lo quita y el botón vuelve a "Enviar invitación".
- [ ] El perfil muestra una sola fila PENDIENTE para ese familiar tras el reemplazo.
- [ ] El email se guarda en minúsculas y sin espacios.

**Activar (familiar)**

- [ ] El link del correo muestra la tarjeta del adulto mayor, el código y el email precargados, y "CREAR CONTRASEÑA" para un email sin cuenta.
- [ ] Activar como familiar nuevo crea el usuario `relative` `active`, el vínculo con el parentesco elegido, la invitación `accepted` con `accepted_at`, e inicia sesión en `/family-pending`.
- [ ] Con una segunda invitación al mismo email, la página muestra "INGRESE SU CONTRASEÑA" y al activar no se crea otro usuario, se crea el segundo vínculo y se inicia sesión.
- [ ] Con el código escrito a mano y un email con cuenta, enviar muestra "Este email ya tiene cuenta. Ingresa tu contraseña." y cambia la etiqueta.
- [ ] Contraseña incorrecta en modo existente muestra "La contraseña no es correcta." y no crea el vínculo.
- [ ] Desmarcar el consentimiento deja `photo_consent = false`; marcarlo no cambia el valor.
- [ ] Un código inexistente, vencido o ya usado muestra "El código no es válido o ya venció.".
- [ ] Un email distinto al de la invitación muestra "Este email no coincide con la invitación.".
- [ ] `abcdefgh` y `12345678` muestran el error de la regla de contraseña.
- [ ] Mientras se activa, el botón dice "Activando…" y está deshabilitado.
- [ ] Los campos con error tienen `aria-invalid="true"` y `aria-describedby` hacia su mensaje.
- [ ] El fallback de `<Suspense>` muestra el formulario con los campos deshabilitados.

**Cierre**

- [ ] `/login` con una contraseña sin la regla muestra "El email o la contraseña no son correctos." y el admin sigue entrando con la suya.
- [ ] `SUPABASE_SECRET_KEY` y `RESEND_API_KEY` solo se importan en archivos con `import "server-only"`; el bundle del cliente no las contiene.
- [ ] `createAdminClient()` solo se usa en `get-invitation-preview.ts` y `activate-account.ts`.
- [ ] `npm run build` y `npm run lint` terminan sin errores, y la consola de `/elderly/[id]` y `/activate-account` no muestra errores ni warnings de hidratación.
- [ ] A 390×844 no hay scroll horizontal en el modal (formulario y éxito) ni en `/activate-account`.
- [ ] Tras la limpieza no quedan el usuario de prueba, sus vínculos ni las invitaciones de prueba.
- [ ] `database-schema.md`, `flujos-de-procesos.md`, `CLAUDE.md` y `BACKLOG.md` tienen los cambios de esta spec.
- [ ] Capturas en `.playwright-mcp/`: modal antes de enviar, en éxito y en éxito con aviso, perfil con PENDIENTE, `/activate-account` en ambos modos y con errores.

---

## Decisiones

- **Sí:** una sola spec con migración, invitación, correo y activación. Decisión del usuario.
- **Sí:** el código se muestra después de enviar, en un estado de éxito con "Listo". Decisión del usuario; el código real lo genera el servidor al guardar. Cambia lo decidido en SPEC 05 (código fijo visible antes de enviar).
- **No:** pre-generar el código al abrir el modal. Deja códigos huérfanos.
- **Sí:** código en Postgres con `gen_random_bytes`, 5 caracteres en mayúsculas sin `0 O 1 I L`, y reintento ante colisión en la action. Decisión del usuario; la regla vive en un solo lugar.
- **Sí:** si Resend falla, la invitación queda y se avisa para compartir el código. Decisión del usuario.
- **Sí:** bloquear el email ya vinculado al mismo adulto mayor con una función booleana `SECURITY DEFINER`. Decisión del usuario; cumple la regla 7. Un email vinculado a otro adulto mayor sí se puede invitar.
- **Sí:** bloquear emails del personal y anotar en BACKLOG el caso staff-familiar. Decisión del usuario.
- **Sí:** las `pending` vencidas no bloquean; la action las marca `expired`. Decisión del usuario; el índice parcial no puede usar `now()`.
- **Sí:** reinvitar un email con una `pending` vigente reemplaza la anterior (`cancelled`) tras un aviso y un segundo clic. Decisión del usuario; si el familiar pierde el correo, el admin no queda bloqueado 7 días. Cambia lo decidido en SPEC 05 (error de pendiente repetida).
- **No:** reenviar el mismo código. Ignoraría los cambios de nombre o parentesco que hizo el admin.
- **No:** solo un toast informativo. Reemplazar por accidente invalidaría un código que el familiar quizá ya tiene.
- **Sí:** filas PENDIENTE, conteos reales y botón solo para el admin. Decisión del usuario.
- **Sí:** botón oculto también en adultos mayores archivados, y `accept_invitation` rechaza archivados. Supuesto de esta spec: no tiene sentido invitar a seguir a alguien que ya no asiste.
- **Sí:** React Email. Decisión del usuario.
- **Sí:** remitente por `RESEND_FROM_EMAIL`, hoy `onboarding@resend.dev`. El usuario no tiene dominio verificado.
- **Sí:** activación completa en esta spec. Decisión del usuario, aunque se recomendó separarla.
- **Sí:** un familiar con cuenta usa "Activar cuenta" con "INGRESE SU CONTRASEÑA" en vez de la pantalla "Vincular adulto mayor". Decisión del usuario; se actualiza `flujos-de-procesos.md`. Sus validaciones (email del usuario, `relative`, misma guardería) se mantienen en `accept_invitation`.
- **Sí:** la etiqueta la decide el servidor, al cargar con `?code=` o al enviar. Decisión del usuario.
- **Sí:** `accept_invitation` con la sesión del familiar, como propone BACKLOG ("Reducir los usos de `service_role`"). Une los dos caminos. Si falla tras crear la cuenta, reintentar entra por "ya tiene cuenta" y no hace falta compensar.
- **No:** crear el vínculo con `service_role` desde la action. Más usos de una llave que se salta RLS.
- **Sí:** vista previa con `service_role` desde el servidor ("conserje con llave"). Decisión del usuario; `anon` no gana permisos.
- **No:** función abierta a `anon`. Rompe la regla 2 y permite probar códigos desde el navegador.
- **Sí:** iniciar sesión y redirigir al destino del `relative` tras activar. Decisión del usuario.
- **Sí:** errores bajo cada campo y bloque general. Decisión del usuario; el mockup no los define.
- **Sí:** contraseña de mínimo 8 con letras y dígitos en activar, en `/login` (servidor) y en Supabase Auth (dashboard). Decisión del usuario.
- **Sí:** en `/login`, un formato inválido da el mismo error de credenciales. Supuesto de esta spec: no revela la regla a quien prueba cuentas.
- **Sí:** fallback de `/activate-account` con los campos deshabilitados. Resuelve la entrada de BACKLOG que la spec toca.
- **Sí:** spec en `specs/database/`. Tiene migraciones.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La contraseña actual del admin no cumple la regla y queda fuera de `/login` | Antes del paso 7, el usuario confirma que cumple; si no, detenerse y preguntar. |
| Sin dominio, Resend solo entrega al email de la cuenta | La verificación usa ese email; entrada en BACKLOG para el dominio. |
| `SUPABASE_SECRET_KEY` llega al cliente | `import "server-only"` en `admin.ts` y criterio que revisa el bundle. |
| La vista previa revela el nombre del adulto mayor a quien tenga el código | Aceptado: el código es secreto, vence en 7 días y la activación exige el email. Límite de intentos en BACKLOG. |
| `createUser` funciona pero `accept_invitation` falla | El usuario queda sin vínculo; reintentar entra por "ya tiene cuenta" con la misma contraseña. |
| `refresh()` no actualiza la lista tras "Listo" | Consultar `node_modules/next/dist/docs/`; si no actualiza, detenerse y preguntar. |
| Los enums `relationship_type` o `invitation_status` ya existen en el remoto | Verificar con `list_tables`/SQL antes de escribir la migración. |
| Los datos de prueba quedan en el remoto | Paso de limpieza explícito y criterio de cierre. |
| Al reemplazar, la anterior queda `cancelled` y el insert de la nueva falla | El modal muestra el toast de error; el admin vuelve a enviar y se crea la nueva sin aviso (ya no hay pendiente). Aceptado: la anterior iba a quedar sin efecto igual. |

---

## Lo que **no** entra en esta spec

- Cancelar o reenviar invitaciones.
- Cron de vencidas.
- Dominio verificado en Resend.
- Pantalla "Vincular adulto mayor".
- Staff que también es familiar.
- Validación en el cliente de `/login` y su diseño de errores.
- Feed del familiar y eliminar `/family-pending`.
- Límite de intentos de códigos.
- Recuperar contraseña.

Cada una de esas, si llega, va en su propia spec.
