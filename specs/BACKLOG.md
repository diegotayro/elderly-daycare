# Backlog

Pendientes detectados durante la implementación que quedan fuera del alcance de la spec en curso. Revisar este archivo al diseñar cada spec nueva con `/spec`: solo cuentan las entradas con `[ ]`.

Al resolver una entrada, en la rama de la spec que la resuelve, se cambia a `- [x] **Estado:** resuelto en SPEC NN` y se deja en el archivo. Si se resuelve a medias, se mantiene `[ ]` y se edita el **Qué** para dejar solo lo que falta. Si el archivo crece, las resueltas se pueden mover a una sección "Resueltos" al final.

Organización: las entradas relacionadas van agrupadas en una sección (`##`), cada una con su propia entrada (`###`). Tanto las secciones como las entradas dentro de cada una van ordenadas de la más simple de resolver a la más compleja. Al agregar una entrada, ubicarla en su sección según ese criterio.

Formato de cada entrada:

- **Estado:** `- [ ] **Estado:** pendiente` o `- [x] **Estado:** resuelto en SPEC NN`.
- **Qué:** el problema o la tarea.
- **Origen:** spec y/o archivo donde se detectó.
- **Se resuelve en:** spec prevista.
- **Notas:** contexto para decidir.

---

## Seguridad y avisos del linter de Supabase

### Avisos del linter por `rls_auto_enable()` ejecutable por `anon` y `authenticated`

- [ ] **Estado:** pendiente
- **Qué:** `get_advisors` (security) marca `public.rls_auto_enable()` como `SECURITY DEFINER` ejecutable vía `/rest/v1/rpc/rls_auto_enable` por `anon` y `authenticated`.
- **Origen:** SPEC 09 (`09-daycares-table`); función preexistente del proyecto, usada por el event trigger `ensure_rls`.
- **Se resuelve en:** una spec de endurecimiento de seguridad (o la de `users`).
- **Notas:**
  - Riesgo bajo: devuelve `event_trigger`, y Postgres solo permite invocarla desde un event trigger; una llamada RPC directa falla.
  - Solución prevista: `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;` en una migración. Verificar antes que el event trigger sigue funcionando.

### Avisos del linter aceptados tras la spec 10

- [ ] **Estado:** pendiente
- **Qué:** `get_advisors` marca (1) `authenticated_security_definer_function_executable` en `current_user_daycare_id()`, `current_user_role()`, `is_admin()`, `current_user_elderly_ids()`, `current_user_relative_ids()`, `is_email_linked_to_elderly()`, `is_team_email()`, `accept_invitation()`, `get_staff_emails()`, `is_pending_staff()`, `activate_staff_account()`, `can_view_post()`, `can_post_to_room()`, `post_has_tag_without_photo_consent()`, `staff_has_history()`, `room_has_elderly_without_photo_consent()` y `is_first_guardian_link()`, (2) `multiple_permissive_policies` en `users` para select y update, en `posts`, `post_elderly`, `post_photos` y `comments` para delete, y en `elderly`, `staff_elderly` y `guardian_elderly` para select, y (3) `auth_leaked_password_protection` y (4) `auth_otp_long_expiry` (la expiración del OTP del proveedor de email supera la hora recomendada).
- **Origen:** SPEC 10 (`10-users-table`), SPEC 15 (`current_user_elderly_ids()`, `current_user_relative_ids()` y las tablas nuevas) y SPEC 17 (`is_email_linked_to_elderly()`, `is_team_email()` y `accept_invitation()`), SPEC 21 (`get_staff_emails()`, `is_pending_staff()` y `activate_staff_account()`), SPEC 22 (`can_view_post()`, `can_post_to_room()` y `post_has_tag_without_photo_consent()`; `multiple_permissive_policies` de delete en `posts`, `post_elderly`, `post_photos` y `comments`, e índices sin uso mientras las tablas están vacías) SPEC 23 (`staff_has_history()`) SPEC 25 (`room_has_elderly_without_photo_consent()`) y SPEC 27 (`is_first_guardian_link()`).
- **Se resuelve en:** no se resuelve; (1) y (2) son aceptados. (3) y (4) son ajustes del dashboard de Auth.
- **Notas:**
  - (1) Las policies evalúan los helpers con el rol del usuario, así que necesitan `EXECUTE`; solo devuelven datos del propio usuario. `current_user_elderly_ids()` y `current_user_relative_ids()` solo devuelven ids ligados a `auth.uid()` y vacío para otros roles. Alternativa descartada: moverlos a un esquema privado.
  - Las tres funciones de SPEC 17 deben ser ejecutables por `authenticated` (el admin las llama al invitar y el familiar al activar) y validan el rol y la guardería de quien llama dentro de la función. `get_invitation_preview()` es solo para `service_role` y no genera aviso.
  - Las tres funciones de SPEC 21 también deben ser ejecutables por `authenticated` (el admin llama a `get_staff_emails()`, y el staff invitado a las otras dos con su sesión) y validan el rol de quien llama dentro de la función.
  - `staff_has_history()` (SPEC 23) también debe ser ejecutable por `authenticated` (el perfil del staff y `deleteStaff` la llaman con la sesión del admin) y devuelve `false` si quien llama no es admin o el staff no es de su guardería.
  - `is_first_guardian_link()` (SPEC 27) debe ser ejecutable por `authenticated` (`list_notices` la llama con la sesión del staff o el admin) y devuelve `false` si quien llama no ve el vínculo; solo devuelve `true/false`, nunca filas ni nombres.
  - (2) Consecuencia de policies separadas por regla (`own`, `admin`, `team`, `staff`/`relative`). Alternativa descartada: unirlas en una sola.
  - (3) Revisar en el dashboard (Auth > Password security) si el plan lo permite.
  - (4) Detectado al verificar SPEC 23. No lo causa esa spec (es una configuración de Auth) y no se comprobó si ya aparecía antes. Revisar en el dashboard (Auth > Providers > Email) y bajar la expiración del OTP a menos de una hora; antes de cambiarla, comprobar si afecta la vigencia de los enlaces de invitación.

### Vulnerabilidad moderada de `deepmerge` en `@react-email/components`

- [ ] **Estado:** pendiente
- **Qué:** `npm audit` marca `deepmerge` (GHSA-gcqx-w48m-w2h4, prototype poisoning en `mergeObject()`) sin fix disponible. Llega por `@react-email/components` → `@react-email/render` → `html-to-text` → `deepmerge`.
- **Origen:** SPEC 17 (paso 4, instalación de `@react-email/components`).
- **Se resuelve en:** una spec de endurecimiento de seguridad, cuando haya una versión corregida.
- **Notas:**
  - Riesgo bajo: solo corre en el servidor al renderizar el correo, con contenido propio y sin entrada del usuario en el merge.
  - Revisar `npm audit` al actualizar `@react-email/components`; si sigue sin fix, evaluar renderizar el correo con HTML propio.

---

## Mi cuenta

### Notificaciones de "Mi cuenta": copy del mockup distinto de los campos de la DB

- [x] **Estado:** resuelto en SPEC 31
- **Qué:** el mockup staff dice "Nuevos comentarios de familias" y "Recordatorio de resumen (17:00)", pero los campos de `users` son `notify_on_post` (nuevas publicaciones) y `daily_summary_enabled` (resumen a las 19:00).
- **Origen:** SPEC 08 (`08-account-screen-mock`), `account/notification-preferences.ts`.
- **Se resuelve en:** la spec de integración con Supabase.
- **Notas:**
  - La pantalla usa el copy del mockup con los valores iniciales de esos dos campos; las etiquetas viven solo en `notification-preferences.ts`.
  - Decidir si se cambia el copy del mockup o los campos/horario de la DB (17:00 vs. 19:00, comentarios vs. publicaciones).
  - Los toggles hoy solo tienen estado local: persistirlos con `update` de `users` en esa misma spec.
  - El recordatorio de Avisos (SPEC 27) usa 17:00 y `daily_summary_enabled`; si se cambia el horario del resumen, actualizar `SUMMARY_REMINDER_TIME` en `notices/notice-limits.ts`.
  - SPEC 31: se mantuvo el copy del mockup ("Nuevos comentarios de familias" guarda `notify_on_post` y "Recordatorio de resumen (17:00)" guarda `daily_summary_enabled`) y los switches ya guardan en la DB. Para el equipo, `notify_on_post` significa avisos de comentarios; para el familiar, de publicaciones. Está documentado en `database-schema.md`.

### Archivos huérfanos en el bucket `avatars`

- [ ] **Estado:** pendiente
- **Qué:** una foto de avatar puede quedar en el bucket sin que ningún `users.avatar_url` la use: la subida termina pero `setAvatar` no llega a guardarla (se cierra la pestaña, falla la red) o rechaza la ruta antes de poder borrarla.
- **Origen:** SPEC 31 (`users/upload-avatar.ts`, `users/actions/set-avatar.ts`).
- **Se resuelve en:** una spec de mantenimiento de Storage (sin asignar).
- **Notas:**
  - `setAvatar` ya borra el archivo recién subido cuando el `update` falla; el huérfano solo queda si la acción no corre o falla antes de poder borrar.
  - Solución prevista: una limpieza periódica que compare `storage.objects` del bucket con `users.avatar_url` y borre lo que no coincida y tenga más de un día.

### Detección de email repetido con `listUsers`

- [ ] **Estado:** pendiente
- **Qué:** al cambiar un email por otro ya usado, `auth.admin.updateUserById` responde un 500 `unexpected_failure` (violación de `users_email_partial_key`), no `email_exists`. `users/apply-profile-changes.ts` busca entonces el email con `auth.admin.listUsers` (paginado, 1000 por página) y muestra "Ese email ya está en uso.". Solo ocurre cuando el cambio falla.
- **Origen:** SPEC 31 (`users/apply-profile-changes.ts`).
- **Se resuelve en:** una spec de endurecimiento, si las cuentas crecen a miles.
- **Notas:**
  - Alternativa: una función SQL `is_email_registered(p_email)` para el admin, con migración. Es más rápida, pero se decidió no sumarla a SPEC 31.
  - Si Auth vuelve a responder `email_exists`, el código ya lo maneja sin buscar en la lista.

---

## Carga y streaming de las rutas

Las entradas de esta sección se resuelven juntas en una misma spec y rama ("spec de carga y streaming"). Decisión tomada: streaming con `<Suspense>` y esqueleto de carga, no rutas bloqueantes (`instant = false`). El patrón que se defina ahí lo reusan el feed y `/notices` al conectarse a Supabase. `/elderly` y `/elderly/[id]` se resolvieron antes, en SPEC 16, por decisión del usuario; su patrón (página sin `async`, `*Content` dentro de `<Suspense>`, esqueleto con `SkeletonBlock`) es la referencia para el resto. La sección quedó cerrada en SPEC 19 (`(app)` y `(family)`); el patrón se reusa al conectar el feed y `/notices` a Supabase.

### Aviso de consulta fuera de `<Suspense>` en `/elderly`

- [x] **Estado:** resuelto en SPEC 16
- **Qué:** en `npm run dev`, `/elderly` muestra `Route "/elderly": Next.js encountered uncached data during prerendering or a navigation` porque `getElderlySource()` consulta Supabase fuera de `<Suspense>`. La navegación no es instantánea. `npm run build` no falla.
- **Origen:** SPEC 13, `app/(app)/elderly/page.tsx` y `elderly/get-elderly-source.ts`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:**
  - Envolver la lectura en `<Suspense>` con el esqueleto de carga (ver la entrada del esqueleto de `(app)`). Comprobar antes con `node_modules/next/dist/docs/`.
  - Sin verificar: `(app)/loading.tsx` debería actuar como `<Suspense>` y aun así aparece el aviso; revisar si un fallback `null` no cuenta para la navegación instantánea.
  - Aceptado en SPEC 13 por decisión del usuario; el criterio de consola limpia se cumple salvo por este aviso de desarrollo.

### Pérdida de lo escrito en `/activate-account` durante el streaming

- [x] **Estado:** resuelto en SPEC 17
- **Qué:** la página lee `searchParams` dentro de `<Suspense>` y el fallback es el mismo formulario sin invitación. Si el usuario escribe antes de que termine el streaming, lo escrito se pierde al reemplazarse por el formulario real.
- **Origen:** SPEC 03 (`03-login-and-activate-account-ui`), `app/(auth)/activate-account/page.tsx`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:**
  - Con datos mock el streaming es inmediato, así que hoy no afecta al usuario. Riesgo aceptado en la spec.
  - Con consultas reales el tiempo de espera crece. Evaluar mostrar un esqueleto de carga en vez del formulario, o deshabilitar los campos hasta que llegue la invitación.

### Esqueleto de carga definitivo de `(app)`

- [x] **Estado:** resuelto en SPEC 19
- **Qué:** `(app)/loading.tsx` devuelve `null` y el layout muestra `Sidebar` y `MobileTopBar` sin datos como fallback. Falta el esqueleto definitivo.
- **Origen:** SPEC 11, `app/(app)/loading.tsx` y `app/(app)/layout.tsx`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:** definir el diseño con los datos reales del feed, adultos mayores y avisos. El mockup no lo cubre: revisar los mockups de todas las pantallas afectadas antes de diseñarlo.

### Aviso de consulta fuera de `<Suspense>` y esqueleto de carga de `(family)`

- [x] **Estado:** resuelto en SPEC 19
- **Qué:** en `npm run dev`, `/family`, `/family/summary` y `/family/account` muestran `Route "...": Next.js encountered uncached data during prerendering or a navigation`, porque `requireRelativeUser()` consulta la sesión fuera de `<Suspense>`. `(family)/loading.tsx` devuelve `null`, sin esqueleto.
- **Origen:** SPEC 18, `app/(family)/` (mismo patrón y mismo aviso que `(app)` antes de SPEC 16).
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:** `npm run build` no falla. Seguir el patrón de SPEC 16 (página sin `async`, `*Content` dentro de `<Suspense>`, esqueleto con `SkeletonBlock`). El pie del sidebar (`CurrentFamilySidebar`) ya tiene su fallback.

### Aviso de `params` fuera de `<Suspense>` en `/elderly/[id]`

- [x] **Estado:** resuelto en SPEC 16
- **Qué:** en `npm run dev`, al abrir un perfil se ve `Route "/elderly/[id]": Next.js encountered URL data during prerendering or a navigation` porque `await props.params` se hace fuera de `<Suspense>`. Por eso la navegación no es instantánea.
- **Origen:** SPEC 02 (`02-elderly-list-and-profile-mock`), `app/(app)/elderly/[id]/page.tsx`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:**
  - Con datos mock no afecta al usuario: `generateStaticParams` prerrenderiza todos los ids y `npm run build` no falla.
  - Envolver el acceso en `<Suspense>` o `loading.tsx` con el esqueleto de carga.
  - Con streaming, un id inexistente pasaría de 404 a 200: definir cómo se manejan los ids que no existen.
  - Definir también la estrategia de caché (`use cache`) cuando los ids ya no se conozcan en el build.
  - SPEC 11: se agregó `(app)/loading.tsx` y `requireTeamUser()` lee la sesión en la página. `npm run build` compila y sigue listando los ids mock como rutas prerrenderizadas. No se verificó con sesión de admin si el aviso desaparece en `npm run dev` ni si un id inexistente responde 200 en vez de 404; se mantiene el `not-found`. Aceptado con datos mock.

---

## Errores de las rutas

### Diseño de `error.tsx` para fallas de consulta en `(app)`

- [ ] **Estado:** pendiente
- **Qué:** si una consulta falla, `getElderlySource()` lanza el error y se muestra el error por defecto de Next.js. Falta un `error.tsx` con diseño propio.
- **Origen:** SPEC 13, `elderly/get-elderly-source.ts`.
- **Se resuelve en:** la spec de integración con Supabase.
- **Notas:** el mockup no cubre este estado; definir el diseño y la acción de reintento.

---

## Autenticación y cuentas

### Activar con el consentimiento de fotos desmarcado

- [x] **Estado:** resuelto en SPEC 26
- **Qué:** probar a mano en `/activate-account` que activar una invitación con la casilla "Autorizo a la guardería a tomar y compartir fotos…" desmarcada deja `elderly.photo_consent = false` en el adulto mayor de la invitación. La parte B de SPEC 24 se activó con la casilla marcada (viene marcada por defecto), así que ese caso no se probó desde la UI.
- **Origen:** SPEC 24 (parte B, puntos B.3 y B.4); criterio "Desmarcar el consentimiento deja `photo_consent = false`" de SPEC 17.
- **Se resuelve en:** una próxima verificación manual de familiares, o SPEC 26 (confirmar la contraseña en "Activar cuenta"), que vuelve a tocar ese formulario.
- **Notas:**
  - La regla en la DB (`accept_invitation` con `p_photo_consent = false`) se prueba con SQL en el paso 2 de SPEC 24; falta solo comprobar que la casilla desmarcada llega como `false` a la Server Action.
  - Hacerlo con un adulto mayor de prueba o anotar su `photo_consent` antes, para restaurarlo después (un familiar no puede volver a `true`; solo el admin).

### Mensaje de código no válido cuando la invitación ya no existe (cancelada, vencida o archivada)

- [ ] **Estado:** pendiente
- **Qué:** si el familiar reintenta con un código cancelado, reemplazado, vencido o de un adulto mayor archivado, `/activate-account` solo dice "El código no es válido o ya venció." y no le indica qué hacer. Puede quedarle una cuenta creada sin vínculos (por ejemplo, si falló `accept_invitation` tras crearla).
- **Origen:** SPEC 17 (`auth/actions/activate-account.ts`, `activate-account-messages.ts`).
- **Se resuelve en:** la spec de pantallas para familiares o una de mejoras de autenticación.
- **Notas:**
  - Mejorar el mensaje para pedir una invitación nueva a la guardería ("Pídele a la guardería que te envíe una invitación nueva").
  - La cuenta sin vínculos no es un riesgo: RLS no le muestra ningún adulto mayor, y una invitación nueva al mismo email la reutiliza ("INGRESE SU CONTRASEÑA").

### Estados definitivos de error y carga del login

- [ ] **Estado:** pendiente
- **Qué:** el error de `/login` es una línea de texto simple con `role="alert"`, leída desde `?error=`. Falta el diseño final del mensaje, la validación por campo y el estado "Ingresando…" del botón.
- **Origen:** SPEC 11 (`11-email-password-auth-and-route-protection`), `auth/components/LoginErrorMessage.tsx`.
- **Se resuelve en:** una spec de estados de `/login`.
- **Notas:**
  - Evaluar `useActionState` si se necesita estado pendiente y errores por campo; hoy el formulario es un Server Component.
  - Revisar el mockup de `/login` antes de diseñar.

### Cuentas `relative` sin vínculos tras una activación fallida

- [ ] **Estado:** pendiente
- **Qué:** si se crea la cuenta del familiar pero falla `accept_invitation` (invitación cancelada, vencida o adulto mayor archivado justo en ese momento, o un error transitorio), la cuenta `relative` queda sin vínculos.
- **Origen:** SPEC 17 (`auth/actions/activate-account.ts`).
- **Se resuelve en:** una spec futura, solo si estas cuentas llegan a estorbar.
- **Notas:**
  - Limitación conocida, sin riesgo de seguridad: RLS no le muestra ningún adulto mayor.
  - Si la invitación sigue vigente, el reintento entra por "INGRESE SU CONTRASEÑA" y crea el vínculo. Si no, el admin invita de nuevo al mismo email y se reutiliza la cuenta.
  - No se borra la cuenta al fallar: un borrado compensatorio puede fallar o pisar una activación concurrente.
  - Si se decide limpiar, evaluar un job que borre `relative` sin `guardian_elderly` pasado cierto tiempo.

### Staff que también es familiar

- [ ] **Estado:** pendiente
- **Qué:** un staff o admin no puede ser familiar de un adulto mayor: `is_team_email` bloquea la invitación y `accept_invitation` exige `role = 'relative'`.
- **Origen:** SPEC 17.
- **Se resuelve en:** la spec que defina cuentas con más de un rol (si hace falta).
- **Notas:** hoy un staff que quiera seguir a un familiar suyo necesita un email distinto.

### Dominio verificado en Resend

- [ ] **Estado:** pendiente
- **Qué:** el remitente es `onboarding@resend.dev`, que solo entrega al email de la cuenta de Resend. Hace falta un dominio verificado para invitar a cualquier familiar.
- **Origen:** SPEC 17 (`RESEND_FROM_EMAIL`, `shared/email/resend.ts`).
- **Se resuelve en:** antes del primer uso real con familiares (puesta en producción).
- **Notas:** verificar el dominio en Resend y cambiar `RESEND_FROM_EMAIL`; no requiere cambios de código.

### Correo de invitación de staff con Resend

- [ ] **Estado:** pendiente
- **Qué:** hoy se usa el SMTP gratuito de Supabase para invitar al staff: solo entrega a miembros de la organización, permite pocos correos por hora (2 en este proyecto), sale en inglés con la plantilla no editable, y el link vence en 2 h según lo configurado.
- **Origen:** SPEC 21.
- **Se resuelve en:** antes del primer uso real con staff (junto con "Dominio verificado en Resend").
- **Notas:**
  - Configurar Resend como SMTP propio en Supabase (requiere dominio verificado).
  - Editar las plantillas "Invite user" y "Reset password" en español con `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (o `recovery`).
  - Crear el Route Handler `/auth/confirm` con `verifyOtp` y eliminar `/accept-invite`.
  - `inviteStaff` y `resendStaffInvitation` no cambian, salvo el `redirectTo`.
  - Revisar entonces el valor de "Email OTP Expiration" (hoy 2 h).

### Cancelar y reenviar invitaciones de familiares

- [ ] **Estado:** pendiente
- **Qué:** el admin solo puede reemplazar una invitación pendiente al volver a invitar. No hay botones para cancelar ni reenviar desde el perfil, ni un cron que marque `expired`.
- **Origen:** SPEC 17 (fuera de alcance); flujos "Cancelar invitación de familiar" e "Invitaciones vencidas".
- **Se resuelve en:** la spec de gestión de familiares.
- **Notas:** cancelar es un `update` de `status` (el admin ya puede). Reenviar debe crear código nuevo, como el reemplazo.

### Límite de intentos de código en `/activate-account`

- [ ] **Estado:** pendiente
- **Qué:** `/activate-account` no limita los intentos de código. Con 31⁵ ≈ 28,6 M combinaciones y vigencia de 7 días, adivinar un código sigue exigiendo conocer además el email de la invitación, pero no hay rate limiting.
- **Origen:** SPEC 17.
- **Se resuelve en:** una spec de endurecimiento de seguridad.
- **Notas:** evaluar un límite por IP y por código en la Server Action.

### Probar el guard de admin desde Auth (`supabase_auth_admin`)

- [ ] **Estado:** pendiente
- **Qué:** el trigger `handle_new_auth_user()` rechaza `role = 'admin'` si `session_user <> 'postgres'`, pero no se pudo probar como `supabase_auth_admin`: `set session authorization` da `permission denied` y `set role` no cambia `session_user`.
- **Origen:** SPEC 10 (`10-users-table`), criterio "insertar con `role = 'admin'` como `supabase_auth_admin` falla".
- **Se resuelve en:** pendiente; no se probó en SPEC 21 (la prueba real con el SMTP gratuito tenía un cupo de 2 correos por hora y se usó en el flujo normal). Probar con un SMTP propio.
- **Notas:**
  - Probar con `auth.admin.inviteUserByEmail` pasando `role: 'admin'` en la metadata: debe fallar y no crear la cuenta.
  - Verificado: como `postgres` (`execute_sql`) crear un admin funciona.

### Pruebas pendientes con `staff`, `pending`, `archived` y `relative`

- [ ] **Estado:** pendiente
- **Qué:** SPEC 11 solo se probó con la cuenta admin. Quedan sin comprobar: `staff` `pending` con contraseña termina en `/login` con `inactive_account` (ojo: con SPEC 21, un staff `pending` con sesión va a `/create-password`); `relative` activo entra a `/family`; `relative` en una ruta de `(app)` redirige a `/family`; `relative` que abre `/staff` o `/staff/[id]` redirige a `/family` (SPEC 20, `requireAdminUser()`). Verificados en SPEC 21 (prueba real): `staff` activa entra a `/` y un `staff` que abre `/staff` redirige a `/`. Verificado en SPEC 23 (prueba real con la cuenta staff de SPEC 21): un usuario `archived` (ban) recibe `inactive_account` al iniciar sesión y, con la sesión abierta, la siguiente navegación pasa por `/auth/end-session` y termina en `/login?error=inactive_account`.
- **Origen:** SPEC 11, sección "Casos sin verificar"; SPEC 20 (redirección de `/staff`).
- **Se resuelve en:** antes de crear cuentas reales de esos roles (specs de invitación de staff y familiares).
- **Notas:** no agregar cuentas a `seed.sql`, para no dejar contraseñas de prueba en el repositorio.

### Reducir los usos de `service_role`

- [ ] **Estado:** pendiente
- **Qué:** la regla 4 de `database-schema.md` permite usar `service_role` en 6 tareas, pero solo es inevitable donde se crean, invitan o bloquean usuarios en Supabase Auth. Las demás se pueden resolver sin una llave que se salta RLS.
- **Origen:** conversación al diseñar SPEC 14; `references/documents/database-schema.md`, regla 4.
- **Se resuelve en:** cada spec que implemente una de esas tareas (invitación de staff, aceptar invitaciones, archivar usuarios, resumen diario).
- **Notas:**
  - **Necesario:** crear cuentas (incluida la del familiar nuevo al activar su invitación), invitar y reenviar la invitación al staff (`inviteUserByEmail` y, si su email ya está confirmado, `resetPasswordForEmail`; en SPEC 21 usan `service_role` `staff/actions/invite-staff.ts` y `staff/actions/resend-staff-invitation.ts`) bloquear el login (`auth.admin.updateUserById` con ban) y borrar cuentas de Auth (`auth.admin.deleteUser`, para cancelar la invitación y eliminar staff sin historial; en SPEC 23 usan `service_role` `staff/actions/archive-staff.ts`, `reactivate-staff.ts`, `cancel-staff-invitation.ts` y `delete-staff.ts`).
  - **Cambiar el email de un staff `active` o de un familiar:** `auth.admin.updateUserById` con `email_confirm: true` (en SPEC 31 usa `service_role` solo `users/apply-profile-changes.ts`). Los nombres se cambian con la sesión del admin.
  - **Aceptar una invitación:** resuelto en SPEC 17 con `accept_invitation(code, photo_consent)` (`SECURITY DEFINER`), llamada con la sesión del familiar. `service_role` solo se usa para leer la vista previa de la invitación sin sesión (`get_invitation_preview`) y para `auth.admin.createUser`.
  - **Activar al staff:** resuelto en SPEC 21 con `activate_staff_account()` (`SECURITY DEFINER`), llamada con la sesión del staff al crear su contraseña. Sin trigger en `auth.users`, que también se dispararía al recuperar la contraseña.
  - **Archivar o reactivar (`status`):** ya lo permite la policy de update del admin.
  - **Ban:** opcional. Un usuario `archived` ya no ve nada (los helpers solo reconocen `active`) y la app lo saca con `/auth/end-session`; el ban es una capa extra.
  - **Cron del resumen diario:** con `pg_cron` corre como `postgres` y no lo necesita; desde un cron de Next.js sí.
  - Si se adopta una alternativa, actualizar la regla 4 de `database-schema.md` y la lista de CLAUDE.md.

### Verificación manual de invitar y activar familiares (SPEC 17, pasos 11 y 12)

- [x] **Estado:** resuelto en SPEC 24
- **Qué:** probar a mano el flujo completo de invitar a un familiar desde el perfil y activar la invitación, y luego borrar los datos de prueba. Escribe en el remoto y envía correos reales.
- **Origen:** SPEC 17, pasos 11 (verificación con datos) y 12 (limpieza) y sus criterios de aceptación.
- **Se resuelve en:** SPEC 17, antes de marcarla `Implementado`. Al terminar, tachar los criterios en la spec y marcar esta entrada como resuelta.
- **Notas:** Checklist actualizada en SPEC 24.

### Eliminar `/family-pending` y reescribir la redirección del familiar

- [x] **Estado:** resuelto en SPEC 18
- **Qué:** `/family-pending`, `FamilyPendingView` y `requireRelativeUser()` son temporales. Hay que eliminarlos y reescribir el destino del `relative` en `sign-in.ts` y en `requireTeamUser()`.
- **Origen:** SPEC 11.
- **Se resuelve en:** la spec de pantallas para familiares.
- **Notas:** el destino pasa a ser el feed del familiar.

---

## Familiar

Las pantallas `/family`, `/family/summary` y `/family/account` se maquetaron en SPEC 18 con datos mock (`family/mock-family.ts`). El feed es real desde SPEC 25 y "Mi cuenta" desde SPEC 31; solo `/family/summary` sigue con datos mock.

### Chips con un solo adulto mayor

- [ ] **Estado:** pendiente
- **Qué:** decidir si los chips de adulto mayor del resumen se ocultan cuando el familiar tiene un solo adulto mayor vinculado. El feed ya las oculta (SPEC 25).
- **Origen:** SPEC 18, `family/components/ElderlyFilterChips.tsx`; el feed se resolvió en SPEC 25.
- **Se resuelve en:** la spec que conecte "Resumen del día" a Supabase.
- **Notas:** con un solo adulto mayor el chip "Todos" y el filtro no aportan nada; en el resumen es el único chip.

### Enlaces al detalle de publicación y al visor de foto

- [ ] **Estado:** pendiente
- **Qué:** siguen sin enlazar (la foto del post ya abre el visor desde SPEC 30):
  - los ítems de "Lo más lindo de hoy" de `/family/summary`;
  - la tarjeta completa del feed, que hoy solo enlaza desde el ícono de comentarios.
- **Origen:** SPEC 18, `family/components/SummaryHighlightItem.tsx`; el detalle (`/posts/[id]` y `/family/posts/[id]`) y los enlaces desde el ícono de comentarios de `/` y `/family` y desde los avisos de `/notices` se resolvieron en SPEC 29.
- **Se resuelve en:** la que conecte "Resumen del día" a Supabase.
- **Notas:**
  - No usar `href="/"` provisional: llevaría al familiar a un redirect.
  - Hacer clicable la tarjeta entera choca con el corazón y el carrusel; resolverlo con un área de enlace que no los tape.

### Notificaciones del familiar en `/family/account`

- [ ] **Estado:** pendiente
- **Qué:** la tarjeta "NOTIFICACIONES" se quitó de `/family/account` en SPEC 31 y no se muestra en `/relatives/[id]`. Decidir si vuelve y con qué copy.
- **Origen:** SPEC 31.
- **Se resuelve en:** una spec de notificaciones del familiar (sin asignar), junto con el envío de los correos de `notify_on_post` y `daily_summary_enabled`.
- **Notas:**
  - `familyNotificationPreferences` en `account/notification-preferences.ts` conserva el copy del mockup familiar y hoy no se usa.
  - La DB no cambió: el familiar sigue teniendo `notify_on_post` y `daily_summary_enabled`.

### Switch de consentimiento de fotos del familiar

- [x] **Estado:** resuelto en SPEC 32
- **Qué:** la tarjeta de adultos mayores de `/family/account` ya muestra el consentimiento de fotos real, pero solo en lectura (SPEC 31). Falta que el familiar pase `photo_consent` de `true` a `false`; nunca al revés.
- **Origen:** SPEC 31 (`family/components/FamilyElderlyCard.tsx`, `PhotoConsentIndicator`).
- **Se resuelve en:** la spec siguiente a SPEC 31.
- **Notas:** "siempre gana el no". Solo el admin puede volver a ponerlo en `true`. Revisar la RLS de `elderly` y el trigger que protege `photo_consent`. Se descartó el switch del familiar: el admin es la única autoridad y el familiar tiene el botón «Solicitar cambio» (SPEC 32).

### Enviar la solicitud de cambio de consentimiento de fotos

- [ ] **Estado:** pendiente
- **Qué:** hoy «Solicitar cambio» de `/family/account` solo muestra un toast. Opciones: aviso en `/notices` del admin (tabla nueva y un `kind` nuevo en `list_notices`) o correo con Resend (requiere dominio verificado).
- **Origen:** SPEC 32 (`family/components/PhotoConsentRequestButton.tsx`).
- **Se resuelve en:** spec futura.
- **Notas:** ver "Dominio verificado en Resend".

### El 404 de `/relatives/[id]` se ve con la barra del equipo

- [ ] **Estado:** pendiente
- **Qué:** un familiar que abre `/relatives/{id}` ve el 404 dentro del layout de `(app)` (sidebar del equipo con su nombre). No hay fuga de datos, pero el marco no es el suyo.
- **Origen:** SPEC 31 (`app/(app)/relatives/[id]/page.tsx`, `auth/require-user.ts`).
- **Se resuelve en:** una spec de rutas por rol (sin asignar).
- **Notas:** `/staff` y `/elderly` redirigen al familiar a `/family`; aquí la spec pidió 404. Una opción es un `not-found.tsx` propio de `(app)` que no muestre la barra del equipo.

### Conectar las pantallas del familiar a Supabase

- [ ] **Estado:** pendiente
- **Qué:** el feed de `/family` ya es real desde SPEC 25 (posts por `audience`, conteos, autor, hora y chips) y "Mi cuenta" desde SPEC 31. Sigue saliendo del mock (`mockFamily`) solo el resumen (`daily_summaries`, que el esquema marca como diferido) y su `dateLabel`.
- **Origen:** SPEC 18, `family/mock-family.ts`; el feed se resolvió en SPEC 25 y "Mi cuenta" en SPEC 31.
- **Se resuelve en:** la spec de datos del resumen diario (`daily_summaries`).
- **Notas:**
  - Reemplazar `mockFamily` por builders desde las filas reales.
  - Probar en pantalla el pie del sidebar con varios vínculos y el truncado con "…" (SPEC 18 solo lo probó con un vínculo); y la consulta de `fetchSidebarElderlyLinks` con adultos mayores archivados.
  - Mientras tanto el sidebar puede decir "Hija de Luis y Carmen" aunque el mock muestre otros adultos mayores.

---

## Adultos mayores (`/elderly`)

### Guardar desde "Agregar adulto mayor"

- [x] **Estado:** resuelto en SPEC 14
- **Qué:** el modal valida pero no guarda. Falta la Server Action con validación en servidor y la conversión del texto de alergias a etiquetas (`allergy_tags`).
- **Origen:** SPEC 13, `elderly/components/AddElderlyForm.tsx`.
- **Se resuelve en:** una spec de alta de adultos mayores.
- **Notas:** la policy `elderly_insert_admin` ya existe. Evaluar ocultar el botón al staff.

### Conectar `/elderly/[id]` a Supabase y restaurar el enlace de `ElderlyCard`

- [x] **Estado:** resuelto en SPEC 16
- **Qué:** el perfil sigue con el mock y las tarjetas de `/elderly` ya no enlazan a él (`<article>` sin hover) para evitar un 404 mientras tanto.
- **Origen:** SPEC 13, `elderly/components/ElderlyCard.tsx`.
- **Se resuelve en:** la spec del perfil con datos reales.
- **Notas:** volver a `<Link href={`/elderly/${id}`}>` con el hover original (`hover:-translate-y-0.5 hover:border-[#F2A78E]`). Ver también la entrada de `params` fuera de `<Suspense>`.

### Conteos reales de familiares en `/elderly`

- [x] **Estado:** resuelto en SPEC 17
- **Qué:** `getElderlySource()` y el perfil leen los vínculos reales de `guardian_elderly` (SPEC 16), pero `invitations` sigue vacío: faltan las invitaciones pendientes en los conteos del listado y las filas PENDIENTE del perfil.
- **Origen:** SPEC 13, `elderly/get-elderly-source.ts`.
- **Se resuelve en:** la spec de `invitations`.
- **Notas:** el mockup muestra conteos distintos y "flecha" cuando hay familiares; los builders ya lo soportan.


### Título de pestaña de un archivado visible para el staff

- [ ] **Estado:** pendiente
- **Qué:** si un staff asignado abre por URL el perfil de un adulto mayor archivado, el cuerpo muestra el not-found, pero la pestaña dice "{full_name} · Casa Nogal" en vez de "Adulto mayor · Casa Nogal".
- **Origen:** SPEC 16, `app/(app)/elderly/[id]/page.tsx` (`generateMetadata`).
- **Se resuelve en:** la spec que trate el manejo de ids no mostrables (ver el 404 real en "Fuera de alcance" de SPEC 16).
- **Notas:**
  - `generateMetadata` no conoce el rol; la regla "staff no ve archivados" vive en `ElderlyProfileContent`.
  - Riesgo bajo: solo afecta al staff asignado a ese adulto mayor (RLS ya le permite leerlo) y solo si escribe la URL a mano; el listado no le muestra archivados.
  - Al arreglarlo, comprobar que consultar el rol en `generateMetadata` no reintroduce el aviso de datos fuera de `<Suspense>`.

### Familiares `archived` en "Familiares vinculados"

- [ ] **Estado:** pendiente
- **Qué:** el perfil muestra a todo familiar vinculado como "activa"/"activo", aunque su `users.status` sea `archived`.
- **Origen:** SPEC 16, `elderly/fetch-relative-links.ts` y `elderly/get-linked-relatives.ts`.
- **Se resuelve en:** la spec que permita archivar familiares.
- **Notas:** hoy no hay flujo para archivar familiares. Definir qué se muestra (fila atenuada, badge o se oculta); el mockup no lo cubre. Desde SPEC 31 la fila activa del admin enlaza a `/relatives/[id]`, que para un familiar `archived` ya oculta "Cambiar foto" y "Editar" (solo deja "Quitar foto"); eso no se probó con datos reales porque no hay familiares archivados.

### Botones "Editar" y "Resumen del día" del perfil

- [ ] **Estado:** pendiente
- **Qué:** ambos botones de `/elderly/[id]` enlazan a `/`.
- **Origen:** SPEC 02, `elderly/components/ElderlyProfileHeader.tsx` y `ElderlyProfileView.tsx`.
- **Se resuelve en:** las specs de edición de adultos mayores y de resumen del día.
- **Notas:** el mockup define su ubicación y estilo; falta el destino y la lógica.

### Reactivar un adulto mayor archivado

- [ ] **Estado:** pendiente
- **Qué:** el admin ya ve a los archivados en `/elderly` (sección "ARCHIVADOS") y en su perfil, pero no puede reactivarlos ni archivar desde la UI.
- **Origen:** SPEC 16.
- **Se resuelve en:** una spec de gestión de estado de adultos mayores.
- **Notas:**
  - Requiere Server Action y UI sin mockup (desde el perfil o desde la sección de archivados), solo admin.
  - Revisar `elderly_update_admin` antes de definir la acción.

---

### Tratamiento (Don/Doña) de los adultos mayores

- [ ] **Estado:** pendiente
- **Qué:** el esquema no guarda cómo tratar a cada adulto mayor. Los feeds reales (`/` y `/family`) muestran solo el nombre de pila ("Luis, Carmen"); las pantallas con mock siguen con "Don Luis" y "Doña Carmen" escritos a mano.
- **Origen:** SPEC 25 (`feed/build-post-heading.ts`), `family/mock-family.ts`. `notices/mock-notices.ts` ya no existe: Avisos (SPEC 27) usa el nombre de pila.
- **Se resuelve en:** una spec que decida el campo (por ejemplo `title` o `gender` en `elderly`, con migración) y lo pida en "Agregar adulto mayor".
- **Notas:** un "Don" fijo se equivocaba con las mujeres. Al agregar el campo, volver a usar el tratamiento en los feeds, "Avisos" y "Resumen del día".

## Staff

### Botón Editar del perfil de staff

- [x] **Estado:** resuelto en SPEC 31
- **Qué:** el botón "Editar" de `/staff/[id]` no tiene acción (es un `<button type="button">`).
- **Origen:** SPEC 20 (`staff/components/StaffProfileHeader.tsx`).
- **Se resuelve en:** una spec de edición de staff (sin asignar).
- **Notas:** `/elderly/[id]` tampoco lo tiene resuelto; definir qué campos se editan (nombres, apellidos; el email vive en `auth.users`).

### Reenviar invitación a staff pendiente

- [x] **Estado:** resuelto en SPEC 21
- **Qué:** el perfil de un staff `pending` no permitía reenviar la invitación (punto 8 de `pantallas-pendientes.md`).
- **Origen:** SPEC 20.
- **Se resuelve en:** SPEC 21 (botón "Reenviar invitación" en el perfil).
- **Notas:** verificado con un correo real: con el email sin confirmar, `inviteUserByEmail` acepta el reenvío y el link anterior deja de servir. Cancelar la invitación va en SPEC 23.

### Reenvío a un staff con el email ya confirmado (plan B)

- [ ] **Estado:** pendiente
- **Qué:** si el staff abrió el link, su email quedó confirmado pero no creó la contraseña, "Reenviar invitación" cae en el plan B (`resetPasswordForEmail`). Ese camino solo se revisó en el código: no se confirmó el código de error exacto de Auth (`email_exists`) ni que el correo "Reset your password" lleve a `/create-password`.
- **Origen:** SPEC 21, paso 10 (el cupo de 2 correos por hora no alcanzaba para probarlo).
- **Se resuelve en:** la primera prueba con un SMTP propio (ver "Correo de invitación de staff con Resend").
- **Notas:** abrir el link de una invitación sin crear la contraseña, reenviar y comprobar que llega el correo de recuperación y que su link lleva a `/accept-invite` y luego a `/create-password`.

### Vincular a un staff `pending` (preasignar)

- [ ] **Estado:** pendiente
- **Qué:** SPEC 20 permitía vincular a un staff `pending` (`canManageLinks` con `active` o `pending`), pero `staff_elderly_insert_admin` exige `status = 'active'`. SPEC 21 corrige a SPEC 20: la tarjeta de vinculados de un `pending` es de solo lectura y la policy no se toca.
- **Origen:** SPEC 21.
- **Se resuelve en:** una spec de gestión de staff (sin asignar), si se quiere preasignar.
- **Notas:** cambiar la policy a `status in ('pending', 'active')` con su migración y volver a habilitar `canManageLinks` con `pending`.

---

## Policies de visibilidad que dependen de tablas futuras

### Policies de `elderly` para staff y relative

- [x] **Estado:** resuelto en SPEC 15
- **Qué:** `elderly` solo tiene policies de admin. Staff y relative no ven ninguna fila: staff ve la lista de `/elderly` vacía.
- **Origen:** SPEC 13 (`13-elderly-table-and-list`), `supabase/migrations/*_create_elderly.sql`.
- **Se resuelve en:** las specs de `staff_elderly` y `guardian_elderly`.
- **Notas:** el esquema define select para staff (asignados) y relative (vinculados); la regla de visibilidad debe quedar en un solo lugar.

### Selects de `users` que dependen de tablas futuras

- [x] **Estado:** resuelto en SPEC 22
- **Qué:** falta la policy de select en `users` para staff/relative sobre los autores de comentarios en posts que pueden ver. La de staff sobre los familiares de sus ancianos asignados se resolvió en SPEC 15 (`users_select_staff_relatives`).
- **Origen:** SPEC 10 (`10-users-table`), `supabase/migrations/20261108061914_create_users.sql`.
- **Se resuelve en:** la spec de `comments`.
- **Notas:**
  - Hoy staff y relative ven solo su fila y la de staff/admin de su guardería (`users_select_own` y `users_select_team`).
  - Marcar como resuelta cuando la policy de autores de comentarios exista.

## Feed

### El botón atrás no cierra el visor de foto

- [ ] **Estado:** pendiente
- **Qué:** con el visor de foto abierto, el botón atrás del navegador o el gesto de atrás de Android sale de la pantalla en vez de cerrar el visor.
- **Origen:** SPEC 30 (decidido fuera de alcance), `feed/components/PhotoViewer.tsx`.
- **Se resuelve en:** una spec de ajustes del visor de foto.
- **Notas:** requiere manejar el historial (por ejemplo, una entrada al abrir y su limpieza al cerrar) o pasar el visor a una ruta propia.

### Zoom en el visor de foto

- [ ] **Estado:** pendiente
- **Qué:** el visor no permite acercar la foto (pellizcar ni doble toque).
- **Origen:** SPEC 30 (decidido fuera de alcance), `feed/components/PhotoViewer.tsx`.
- **Se resuelve en:** una spec de ajustes del visor de foto.
- **Notas:** el track usa `scroll-snap` para el swipe entre fotos; el zoom debe convivir con ese gesto.

### Renovar URLs firmadas vencidas

- [ ] **Estado:** pendiente
- **Qué:** las URLs firmadas de las fotos duran una hora. Con la página abierta más tiempo, el carrusel del feed y del detalle y el visor muestran fotos rotas; el visor solo muestra "No se pudo cargar la foto. Recarga la página para verla.".
- **Origen:** SPEC 30, `feed/fetch-feed-page.ts` (`SIGNED_URL_SECONDS`) y `feed/components/PhotoViewer.tsx`.
- **Se resuelve en:** una spec de ajustes de fotos del feed.
- **Notas:** decidir si se vuelven a firmar al fallar la carga o al volver a la pestaña, o si se sube la duración.

### Borrar los archivos de Storage al borrar un post o una foto

- [ ] **Estado:** pendiente
- **Qué:** al borrar un post o una fila de `post_photos`, los archivos del bucket `post-photos` no se borran solos. SPEC 25 ya lo hace al deshacer una publicación fallida (`discardPost`); falta en el borrado desde la UI (borrar un post o quitar una foto).
- **Origen:** SPEC 22 (`database/22-feed-tables-and-visibility`); el mecanismo se implementó en SPEC 25 (`feed/actions/discard-post.ts`).
- **Se resuelve en:** la spec de edición y borrado de posts.
- **Notas:**
  - Lo hace la app: primero borra los archivos de `{post_id}/` (mientras el post existe, para que pase la policy de Storage) y después el post o la foto.

### "Nueva publicación" para un staff sin adultos mayores asignados

- [ ] **Estado:** pendiente
- **Qué:** un staff sin adultos mayores asignados ve igualmente el chip "Toda la habitación", con el select HABITACIÓN vacío; no puede publicar nada.
- **Origen:** SPEC 25, `feed/components/AudiencePicker.tsx` y `feed/get-new-post-options.ts`.
- **Se resuelve en:** una spec de ajustes del feed o de la asignación de staff.
- **Notas:** decidir si se oculta "Toda la habitación" o se muestra un mensaje ("Aún no tienes adultos mayores asignados"). El mockup no lo define.

### Paginación de comentarios

- [ ] **Estado:** pendiente
- **Qué:** el detalle de una publicación carga todos sus comentarios de una vez, sin paginar.
- **Origen:** SPEC 29 (decidido fuera de alcance), `comments/fetch-comments.ts`.
- **Se resuelve en:** una spec de ajustes del feed, si algún post acumula muchos comentarios.
- **Notas:** decidir entre "Cargar más" (como el feed) o mostrar los últimos N con "Ver anteriores". Con paginación hay que cuidar el orden (del más viejo al más nuevo) y el contador "COMENTARIOS · N".

### Editar comentarios

- [ ] **Estado:** pendiente
- **Qué:** un usuario no puede editar su propio comentario. Borrarlo ya se puede (SPEC 29).
- **Origen:** SPEC 29 (decidido fuera de alcance), `comments/components/CommentItem.tsx`.
- **Se resuelve en:** una spec de ajustes del feed.
- **Notas:**
  - La RLS ya lo permite (`comments_update_author`).
  - No hay mockup de la edición: decidir la UI (en la burbuja o en el campo de abajo) y si se marca "editado".

### Parentesco en los comentarios

- [ ] **Estado:** pendiente
- **Qué:** el rol del comentario dice "familiar" en vez del parentesco ("· hija").
- **Origen:** SPEC 29 (decidido fuera de alcance), `comments/comment-role-labels.ts`; el mockup `detalle-publicacion.dc.html` muestra "· hija".
- **Se resuelve en:** una spec de database (función SQL) y su pantalla.
- **Notas:** requiere una función `SECURITY DEFINER`, porque la RLS no deja leer los `guardian_elderly` de otros usuarios. Evaluar qué se expone: solo el parentesco, nunca el adulto mayor vinculado.

### Conteo de reacciones en vivo

- [ ] **Estado:** pendiente
- **Qué:** las reacciones de otros usuarios solo se ven al recargar el feed; el conteo de cada tarjeta no se actualiza solo.
- **Origen:** SPEC 28 (decidido fuera de alcance), `feed/components/ReactionButton.tsx`.
- **Se resuelve en:** una spec de ajustes del feed.
- **Notas:** decidir si vale Realtime de Supabase o un `refresh` periódico. Con `refresh` hay que cuidar que no re-firme las fotos ni pise el estado optimista de `ReactionButton`.

### Comentarios en vivo

- [ ] **Estado:** pendiente
- **Qué:** los comentarios de otros usuarios solo se ven al recargar el detalle de la publicación; la lista y el contador no se actualizan solos.
- **Origen:** SPEC 29 (decidido fuera de alcance), `comments/components/CommentList.tsx`.
- **Se resuelve en:** una spec de ajustes del feed, junto con el conteo de reacciones en vivo.
- **Notas:** `CommentList` guarda la lista en estado: un refresco del servidor no la reemplaza. Al traer comentarios nuevos hay que mezclarlos sin pisar los que el usuario acaba de crear o borrar.

### Notificar nuevas publicaciones (`notify_on_post`)

- [ ] **Estado:** pendiente
- **Qué:** al publicar, avisar por correo a los familiares que tienen `notify_on_post = true` y pueden ver el post.
- **Origen:** SPEC 25 (quedó fuera de alcance), `references/documents/database-schema.md` (`users.notify_on_post`).
- **Se resuelve en:** una spec de notificaciones (correo con Resend, sin tiempo real).
- **Notas:**
  - Decidir si se envía al publicar o en lote, y cómo se evita avisar de un post que se deshace (`discardPost`).
  - Hoy entre `createPost` y `attachPostPhotos` el post es visible sin fotos unos segundos: conviene notificar después de adjuntar las fotos.

### Correos por comentarios

- [ ] **Estado:** pendiente
- **Qué:** al comentar una publicación no se avisa por correo a nadie.
- **Origen:** SPEC 29 (decidido fuera de alcance), `comments/actions/create-comment.ts`.
- **Se resuelve en:** una spec de notificaciones (correo con Resend), junto con `notify_on_post`.
- **Notas:** decidir a quién avisar (el autor del post, los familiares vinculados o ambos) y si hace falta una preferencia nueva en `users`, distinta de `notify_on_post`.

### Recordatorio del resumen que sepa si ya se envió

- [ ] **Estado:** pendiente
- **Qué:** el recordatorio "Recuerda enviar el resumen del día" de `/notices` aparece desde las 17:00 aunque el resumen ya se haya enviado.
- **Origen:** SPEC 27 (`notices/fetch-notices.ts`).
- **Se resuelve en:** la spec que conecte `daily_summaries` (resumen del día).
- **Notas:** ocultarlo cuando el staff ya envió el resumen de todos sus adultos mayores activos de hoy.

### Avisos de nuevas publicaciones en `/notices`

- [ ] **Estado:** pendiente
- **Qué:** `/notices` no muestra las nuevas publicaciones como aviso; el feed ya las muestra.
- **Origen:** SPEC 27 (decidido fuera de alcance).
- **Se resuelve en:** una spec de ajustes de Avisos, junto con el detalle de publicación.
- **Notas:** el mockup no define el copy ni el ícono de ese aviso. Decidir si aplica al admin, al staff o a ambos.

### Leído/no leído y contador de Avisos

- [ ] **Estado:** pendiente
- **Qué:** los avisos no tienen estado de leído, la campana no muestra contador y no existe "marcar como leído".
- **Origen:** SPEC 27 (decidido fuera de alcance).
- **Se resuelve en:** una spec de notificaciones con tabla `notifications` (migración, RLS y triggers).
- **Notas:** hoy los avisos se derivan al leer desde `comments`, `reactions` y `guardian_elderly` (`list_notices`); con la tabla habría que decidir si se mantiene esa derivación o se reemplaza, y hacer backfill.

---

## Calidad del código y las migraciones

### Revisar que las migraciones tengan el nombre y el orden correctos

- [ ] **Estado:** pendiente
- **Qué:** comprobar que cada archivo de `supabase/migrations/` tiene el mismo nombre (versión y slug) que su registro en el remoto (`list_migrations`) y que el orden por versión es el de aplicación.
- **Origen:** SPEC 29 (paso 2). La migración `add_post_id_to_list_notices` se aplicó con `apply_migration`, que registró la versión con la hora del momento (`20261120225412`), y el archivo local se había nombrado con otra (`20261120120000`). Se corrigió renombrando el archivo.
- **Se resuelve en:** una spec de database de revisión de migraciones.
- **Notas:**
  - Al cerrar la SPEC 29 se compararon las 17 migraciones y solo esa difería; falta revisar el orden y el historial.
  - Tras cada `apply_migration`, nombrar el archivo local con la versión que devuelve `list_migrations`.
  - Evaluar si conviene un chequeo automático (script o paso del flujo de `/spec-impl`) que compare local y remoto.

### Revisar todo el código con la documentación actual

- [ ] **Estado:** pendiente
- **Qué:** revisar el código completo de la app contra la documentación vigente de Context7 (supabase-js, React y demás librerías), la documentación local de Next.js (`node_modules/next/dist/docs/`) y el MCP de Supabase actualizado (`search_docs`, advisors), para que todo use APIs actuales y no deprecadas.
- **Origen:** SPEC 29 (paso 6). Se encontró `.returns<T>()`, deprecado en supabase-js, en código escrito sin consultar Context7; en esa spec se cambió por `.overrideTypes<T, { merge: false }>()`.
- **Se resuelve en:** una spec de revisión técnica, sin cambios de comportamiento.
- **Notas:**
  - Cubrir supabase-js y `@supabase/ssr`, React 19, Next 16 (APIs de caché y renderizado, `proxy.ts`), Tailwind v4 y Resend.
  - Revisar también SQL, RLS y funciones de las migraciones contra la documentación y los advisors actuales.
  - En adelante, consultar Context7 antes de escribir cualquier API de librería, como piden los `CLAUDE.md`.
