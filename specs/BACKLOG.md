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
- **Qué:** `get_advisors` marca (1) `authenticated_security_definer_function_executable` en `current_user_daycare_id()`, `current_user_role()`, `is_admin()`, `current_user_elderly_ids()`, `current_user_relative_ids()`, `is_email_linked_to_elderly()`, `is_team_email()` y `accept_invitation()`, (2) `multiple_permissive_policies` en `users` para select y update, y en `elderly`, `staff_elderly` y `guardian_elderly` para select, y (3) `auth_leaked_password_protection`.
- **Origen:** SPEC 10 (`10-users-table`), SPEC 15 (`current_user_elderly_ids()`, `current_user_relative_ids()` y las tablas nuevas) y SPEC 17 (`is_email_linked_to_elderly()`, `is_team_email()` y `accept_invitation()`).
- **Se resuelve en:** no se resuelve; (1) y (2) son aceptados. (3) es un ajuste del dashboard de Auth.
- **Notas:**
  - (1) Las policies evalúan los helpers con el rol del usuario, así que necesitan `EXECUTE`; solo devuelven datos del propio usuario. `current_user_elderly_ids()` y `current_user_relative_ids()` solo devuelven ids ligados a `auth.uid()` y vacío para otros roles. Alternativa descartada: moverlos a un esquema privado.
  - Las tres funciones de SPEC 17 deben ser ejecutables por `authenticated` (el admin las llama al invitar y el familiar al activar) y validan el rol y la guardería de quien llama dentro de la función. `get_invitation_preview()` es solo para `service_role` y no genera aviso.
  - (2) Consecuencia de policies separadas por regla (`own`, `admin`, `team`, `staff`/`relative`). Alternativa descartada: unirlas en una sola.
  - (3) Revisar en el dashboard (Auth > Password security) si el plan lo permite.

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

- [ ] **Estado:** pendiente
- **Qué:** el mockup staff dice "Nuevos comentarios de familias" y "Recordatorio de resumen (17:00)", pero los campos de `users` son `notify_on_post` (nuevas publicaciones) y `daily_summary_enabled` (resumen a las 19:00).
- **Origen:** SPEC 08 (`08-account-screen-mock`), `account/notification-preferences.ts`.
- **Se resuelve en:** la spec de integración con Supabase.
- **Notas:**
  - La pantalla usa el copy del mockup con los valores iniciales de esos dos campos; las etiquetas viven solo en `notification-preferences.ts`.
  - Decidir si se cambia el copy del mockup o los campos/horario de la DB (17:00 vs. 19:00, comentarios vs. publicaciones).
  - Los toggles hoy solo tienen estado local: persistirlos con `update` de `users` en esa misma spec.

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
- **Se resuelve en:** la spec de invitación de staff.
- **Notas:**
  - Probar con `auth.admin.inviteUserByEmail` pasando `role: 'admin'` en la metadata: debe fallar y no crear la cuenta.
  - Verificado: como `postgres` (`execute_sql`) crear un admin funciona.

### Pruebas pendientes con `staff`, `pending`, `archived` y `relative`

- [ ] **Estado:** pendiente
- **Qué:** SPEC 11 solo se probó con la cuenta admin. Quedan sin comprobar: `staff` activa entra a `/`; `staff` `pending` con contraseña termina en `/login` con `inactive_account`; usuario `archived` (ban) recibe `user_banned` y `inactive_account`; archivado con sesión abierta pasa por `/auth/end-session`; `relative` activo entra a `/family`; `relative` en una ruta de `(app)` redirige a `/family`.
- **Origen:** SPEC 11, sección "Casos sin verificar".
- **Se resuelve en:** antes de crear cuentas reales de esos roles (specs de invitación de staff y familiares).
- **Notas:** no agregar cuentas a `seed.sql`, para no dejar contraseñas de prueba en el repositorio.

### Reducir los usos de `service_role`

- [ ] **Estado:** pendiente
- **Qué:** la regla 4 de `database-schema.md` permite usar `service_role` en 6 tareas, pero solo es inevitable donde se crean, invitan o bloquean usuarios en Supabase Auth. Las demás se pueden resolver sin una llave que se salta RLS.
- **Origen:** conversación al diseñar SPEC 14; `references/documents/database-schema.md`, regla 4.
- **Se resuelve en:** cada spec que implemente una de esas tareas (invitación de staff, aceptar invitaciones, archivar usuarios, resumen diario).
- **Notas:**
  - **Necesario:** crear cuentas (incluida la del familiar nuevo al activar su invitación), reenviar la invitación al staff (`inviteUserByEmail`/`generateLink`) y bloquear el login (`auth.admin.updateUserById` con ban).
  - **Aceptar una invitación:** resuelto en SPEC 17 con `accept_invitation(code, photo_consent)` (`SECURITY DEFINER`), llamada con la sesión del familiar. `service_role` solo se usa para leer la vista previa de la invitación sin sesión (`get_invitation_preview`) y para `auth.admin.createUser`.
  - **Activar al staff:** trigger en `auth.users` que pasa su fila de `users` a `active` cuando crea su contraseña.
  - **Archivar o reactivar (`status`):** ya lo permite la policy de update del admin.
  - **Ban:** opcional. Un usuario `archived` ya no ve nada (los helpers solo reconocen `active`) y la app lo saca con `/auth/end-session`; el ban es una capa extra.
  - **Cron del resumen diario:** con `pg_cron` corre como `postgres` y no lo necesita; desde un cron de Next.js sí.
  - Si se adopta una alternativa, actualizar la regla 4 de `database-schema.md` y la lista de CLAUDE.md.

### Verificación manual de invitar y activar familiares (SPEC 17, pasos 11 y 12)

- [ ] **Estado:** pendiente
- **Qué:** probar a mano el flujo completo de invitar a un familiar desde el perfil y activar la invitación, y luego borrar los datos de prueba. Escribe en el remoto y envía correos reales.
- **Origen:** SPEC 17, pasos 11 (verificación con datos) y 12 (limpieza) y sus criterios de aceptación.
- **Se resuelve en:** SPEC 17, antes de marcarla `Implementado`. Al terminar, tachar los criterios en la spec y marcar esta entrada como resuelta.
- **Notas:**

**Antes de empezar**

- `.env` con `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL=onboarding@resend.dev` y `APP_URL=http://localhost:3000`; `npm run dev` corriendo.
- Con `onboarding@resend.dev` solo se puede enviar al email de tu cuenta de Resend. Úsalo como `TU_EMAIL` en todo lo de abajo.
- La contraseña del admin debe tener 8 o más caracteres, con una letra y un número (si no, `/login` la rechaza).
- Capturas en `.playwright-mcp/`.

**A. Modal de invitación (como admin, en `/elderly/[id]` de Luis Fernández)**

1. Entra como staff: no debe verse "Vincular otro familiar/tutor". Como admin sí; en un adulto mayor archivado no.
2. Abre el modal: no debe verse el bloque CÓDIGO DE INVITACIÓN. Captura.
3. Envía con datos vacíos: errores bajo cada campo y foco en el primero.
4. Llena NOMBRES, APELLIDOS, `TU_EMAIL` (prueba con mayúsculas y espacios) y parentesco, y envía.
   - Mientras envía: botón "Enviando…"; la X, Esc y los campos no responden.
   - Éxito: "Invitación enviada a {email}" (en minúsculas y sin espacios), código de 5 caracteres, "Vence en 7 días" y "Listo". Captura.
5. Llega el correo a `TU_EMAIL` con el asunto "Te invitaron a seguir a Luis Fernández en Casa Nogal", el código y el botón a `http://localhost:3000/activate-account?code={código}`.
6. Cierra con "Listo": el perfil muestra la fila PENDIENTE y `/elderly` cuenta la invitación en Luis. Captura.
7. Vuelve a invitar al mismo email para Luis:
   - Al enviar no se envía: aviso de reemplazo bajo EMAIL y botón "Reemplazar invitación". Captura.
   - Edita EMAIL: el aviso desaparece y el botón vuelve a "Enviar invitación".
   - Vuelve a poner el email y pulsa "Reemplazar invitación": invitación nueva con otro código y correo nuevo. El perfil muestra una sola fila PENDIENTE. El código anterior ya no sirve en `/activate-account`.
8. Invita el email del admin: "Este email pertenece al personal.".
9. Falla del correo: pon una `RESEND_API_KEY` inválida, reinicia `npm run dev` e invita a otro email. La invitación se guarda y el éxito muestra "No pudimos enviar el correo. Comparte este código con {nombres}.". Captura. Restaura la llave.

**B. Activación como familiar nuevo (ventana privada, sin sesión)**

1. Abre el link del correo: tarjeta de Luis, código y email precargados, etiqueta "CREAR CONTRASEÑA". Captura.
2. Prueba errores: contraseña `abcdefgh` y `12345678` (error de la regla), código inexistente ("El código no es válido o ya venció."), email distinto ("Este email no coincide con la invitación."). Los campos con error tienen `aria-invalid="true"` y `aria-describedby`. Captura con errores.
3. Desmarca el consentimiento de fotos y activa con una contraseña válida (ej. `Prueba123`).
   - Mientras activa: botón "Activando…" deshabilitado.
   - Resultado: sesión iniciada y redirección a `/family-pending`.
4. Comprueba en la base (SQL Editor): usuario `relative` `active`, fila en `guardian_elderly` con el parentesco elegido, invitación `accepted` con `accepted_at`, y `elderly.photo_consent = false` en Luis.

**C. Activación con cuenta existente**

1. Como admin, invita `TU_EMAIL` a otro adulto mayor activo (ej. Rosa Méndez).
2. Abre el link del correo (ventana privada): etiqueta "INGRESE SU CONTRASEÑA". Captura.
3. Contraseña incorrecta: "La contraseña no es correcta." y no se crea el vínculo.
4. Contraseña correcta, con el consentimiento marcado: no se crea otro usuario, se crea el segundo vínculo, se inicia sesión y `photo_consent` de Rosa sigue en `true`.
5. Cierra sesión. Abre `/activate-account` sin código, escribe a mano un código de una invitación nueva con `TU_EMAIL` y una contraseña cualquiera válida: debe mostrar "Este email ya tiene cuenta. Ingresa tu contraseña." y la etiqueta cambia a "INGRESE SU CONTRASEÑA".
6. Reusa un código ya aceptado: "El código no es válido o ya venció.".

**D. Login y otras comprobaciones**

- `/login` con contraseña `abc`: "El email o la contraseña no son correctos."; el admin sigue entrando con la suya.
- A 390×844 no hay scroll horizontal en el modal (formulario y éxito) ni en `/activate-account`. Captura.
- Consola de `/elderly/[id]` y `/activate-account` sin errores ni warnings de hidratación.
- Mientras carga `/activate-account?code=...`, el fallback muestra el formulario con los campos deshabilitados.
- `npm run build` y `npm run lint` sin errores.

**E. Limpieza (paso 12)** — en el SQL Editor de Supabase, reemplazando `TU_EMAIL`:

```sql
-- Deja el consentimiento de Luis como estaba (si lo cambiaste en B.3)
update public.elderly set photo_consent = true where full_name = 'Luis Fernández';

delete from public.guardian_elderly
  where relative_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.invitations where email in ('TU_EMAIL', 'EMAIL_DEL_PASO_A9');
-- El usuario de prueba (public.users se borra en cascada)
delete from auth.users where email = 'TU_EMAIL';
```

Después comprueba que no quedan el usuario de prueba, sus vínculos ni las invitaciones de prueba.

### Eliminar `/family-pending` y reescribir la redirección del familiar

- [x] **Estado:** resuelto en SPEC 18
- **Qué:** `/family-pending`, `FamilyPendingView` y `requireRelativeUser()` son temporales. Hay que eliminarlos y reescribir el destino del `relative` en `sign-in.ts` y en `requireTeamUser()`.
- **Origen:** SPEC 11.
- **Se resuelve en:** la spec de pantallas para familiares.
- **Notas:** el destino pasa a ser el feed del familiar.

---

## Familiar

Las pantallas `/family`, `/family/summary` y `/family/account` se maquetaron en SPEC 18 con datos mock (`family/mock-family.ts`). Solo el nombre, el email, las preferencias de notificación y el parentesco del pie del sidebar son reales.

### Chips con un solo adulto mayor

- [ ] **Estado:** pendiente
- **Qué:** decidir si los chips de adulto mayor del feed y del resumen se ocultan cuando el familiar tiene un solo adulto mayor vinculado.
- **Origen:** SPEC 18, `family/components/ElderlyFilterChips.tsx`.
- **Se resuelve en:** la spec que conecte las pantallas del familiar a Supabase.
- **Notas:** con un solo adulto mayor el chip "Todos" y el filtro no aportan nada; en el resumen es el único chip.

### Enlaces al detalle de publicación desde `/family` y `/family/summary`

- [ ] **Estado:** pendiente
- **Qué:** las tarjetas del feed, la foto y los ítems de "Lo más lindo de hoy" no enlazan todavía.
- **Origen:** SPEC 18, `family/components/FamilyPostCard.tsx` y `SummaryHighlightItem.tsx`.
- **Se resuelve en:** la spec del detalle de publicación (`detalle-publicacion.dc.html`) y del visor de foto (`foto.dc.html`).
- **Notas:** no usar `href="/"` provisional: llevaría al familiar a un redirect.

### Conectar las pantallas del familiar a Supabase

- [ ] **Estado:** pendiente
- **Qué:** hoy salen del mock:
  - posts (visibilidad por `audience`), conteos de reacciones y comentarios, autor y hora;
  - adultos mayores vinculados (`guardian_elderly`), parentesco, edad y sala (el pie del sidebar ya es real desde SPEC 18);
  - `photo_consent`;
  - el resumen (`daily_summaries`, que el esquema marca como diferido);
  - `todayLabel` y `dateLabel`.
- **Origen:** SPEC 18, `family/mock-family.ts`.
- **Se resuelve en:** spec(s) de datos del familiar (feed por `audience`, `daily_summaries`).
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
- **Notas:** hoy no hay flujo para archivar familiares. Definir qué se muestra (fila atenuada, badge o se oculta); el mockup no lo cubre.

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

## Policies de visibilidad que dependen de tablas futuras

### Policies de `elderly` para staff y relative

- [x] **Estado:** resuelto en SPEC 15
- **Qué:** `elderly` solo tiene policies de admin. Staff y relative no ven ninguna fila: staff ve la lista de `/elderly` vacía.
- **Origen:** SPEC 13 (`13-elderly-table-and-list`), `supabase/migrations/*_create_elderly.sql`.
- **Se resuelve en:** las specs de `staff_elderly` y `guardian_elderly`.
- **Notas:** el esquema define select para staff (asignados) y relative (vinculados); la regla de visibilidad debe quedar en un solo lugar.

### Selects de `users` que dependen de tablas futuras

- [ ] **Estado:** pendiente
- **Qué:** falta la policy de select en `users` para staff/relative sobre los autores de comentarios en posts que pueden ver. La de staff sobre los familiares de sus ancianos asignados se resolvió en SPEC 15 (`users_select_staff_relatives`).
- **Origen:** SPEC 10 (`10-users-table`), `supabase/migrations/20261108061914_create_users.sql`.
- **Se resuelve en:** la spec de `comments`.
- **Notas:**
  - Hoy staff y relative ven solo su fila y la de staff/admin de su guardería (`users_select_own` y `users_select_team`).
  - Marcar como resuelta cuando la policy de autores de comentarios exista.
