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
- **Qué:** `get_advisors` marca (1) `authenticated_security_definer_function_executable` en `current_user_daycare_id()`, `current_user_role()`, `is_admin()`, `current_user_elderly_ids()` y `current_user_relative_ids()`, (2) `multiple_permissive_policies` en `users` para select y update, y en `elderly`, `staff_elderly` y `guardian_elderly` para select, y (3) `auth_leaked_password_protection`.
- **Origen:** SPEC 10 (`10-users-table`) y SPEC 15 (`current_user_elderly_ids()`, `current_user_relative_ids()` y las tablas nuevas).
- **Se resuelve en:** no se resuelve; (1) y (2) son aceptados. (3) es un ajuste del dashboard de Auth.
- **Notas:**
  - (1) Las policies evalúan los helpers con el rol del usuario, así que necesitan `EXECUTE`; solo devuelven datos del propio usuario. `current_user_elderly_ids()` y `current_user_relative_ids()` solo devuelven ids ligados a `auth.uid()` y vacío para otros roles. Alternativa descartada: moverlos a un esquema privado.
  - (2) Consecuencia de policies separadas por regla (`own`, `admin`, `team`, `staff`/`relative`). Alternativa descartada: unirlas en una sola.
  - (3) Revisar en el dashboard (Auth > Password security) si el plan lo permite.

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

Las entradas de esta sección se resuelven juntas en una misma spec y rama ("spec de carga y streaming"). Decisión tomada: streaming con `<Suspense>` y esqueleto de carga, no rutas bloqueantes (`instant = false`). El patrón que se defina ahí lo reusan el feed, `/notices` y `/elderly/[id]` al conectarse a Supabase.

### Aviso de consulta fuera de `<Suspense>` en `/elderly`

- [ ] **Estado:** pendiente
- **Qué:** en `npm run dev`, `/elderly` muestra `Route "/elderly": Next.js encountered uncached data during prerendering or a navigation` porque `getElderlySource()` consulta Supabase fuera de `<Suspense>`. La navegación no es instantánea. `npm run build` no falla.
- **Origen:** SPEC 13, `app/(app)/elderly/page.tsx` y `elderly/get-elderly-source.ts`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:**
  - Envolver la lectura en `<Suspense>` con el esqueleto de carga (ver la entrada del esqueleto de `(app)`). Comprobar antes con `node_modules/next/dist/docs/`.
  - Sin verificar: `(app)/loading.tsx` debería actuar como `<Suspense>` y aun así aparece el aviso; revisar si un fallback `null` no cuenta para la navegación instantánea.
  - Aceptado en SPEC 13 por decisión del usuario; el criterio de consola limpia se cumple salvo por este aviso de desarrollo.

### Pérdida de lo escrito en `/activate-account` durante el streaming

- [ ] **Estado:** pendiente
- **Qué:** la página lee `searchParams` dentro de `<Suspense>` y el fallback es el mismo formulario sin invitación. Si el usuario escribe antes de que termine el streaming, lo escrito se pierde al reemplazarse por el formulario real.
- **Origen:** SPEC 03 (`03-login-and-activate-account-ui`), `app/(auth)/activate-account/page.tsx`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:**
  - Con datos mock el streaming es inmediato, así que hoy no afecta al usuario. Riesgo aceptado en la spec.
  - Con consultas reales el tiempo de espera crece. Evaluar mostrar un esqueleto de carga en vez del formulario, o deshabilitar los campos hasta que llegue la invitación.

### Esqueleto de carga definitivo de `(app)`

- [ ] **Estado:** pendiente
- **Qué:** `(app)/loading.tsx` devuelve `null` y el layout muestra `Sidebar` y `MobileTopBar` sin datos como fallback. Falta el esqueleto definitivo.
- **Origen:** SPEC 11, `app/(app)/loading.tsx` y `app/(app)/layout.tsx`.
- **Se resuelve en:** la spec de carga y streaming.
- **Notas:** definir el diseño con los datos reales del feed, adultos mayores y avisos. El mockup no lo cubre: revisar los mockups de todas las pantallas afectadas antes de diseñarlo.

### Aviso de `params` fuera de `<Suspense>` en `/elderly/[id]`

- [ ] **Estado:** pendiente
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

### Estados definitivos de error y carga del login

- [ ] **Estado:** pendiente
- **Qué:** el error de `/login` es una línea de texto simple con `role="alert"`, leída desde `?error=`. Falta el diseño final del mensaje, la validación por campo y el estado "Ingresando…" del botón.
- **Origen:** SPEC 11 (`11-email-password-auth-and-route-protection`), `auth/components/LoginErrorMessage.tsx`.
- **Se resuelve en:** una spec de estados de `/login`.
- **Notas:**
  - Evaluar `useActionState` si se necesita estado pendiente y errores por campo; hoy el formulario es un Server Component.
  - Revisar el mockup de `/login` antes de diseñar.

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
- **Qué:** SPEC 11 solo se probó con la cuenta admin. Quedan sin comprobar: `staff` activa entra a `/`; `staff` `pending` con contraseña termina en `/login` con `inactive_account`; usuario `archived` (ban) recibe `user_banned` y `inactive_account`; archivado con sesión abierta pasa por `/auth/end-session`; `relative` activo entra a `/family-pending`; `relative` en una ruta de `(app)` redirige a `/family-pending`.
- **Origen:** SPEC 11, sección "Casos sin verificar".
- **Se resuelve en:** antes de crear cuentas reales de esos roles (specs de invitación de staff y familiares).
- **Notas:** no agregar cuentas a `seed.sql`, para no dejar contraseñas de prueba en el repositorio.

### Reducir los usos de `service_role`

- [ ] **Estado:** pendiente
- **Qué:** la regla 4 de `database-schema.md` permite usar `service_role` en 6 tareas, pero solo es inevitable donde se crean, invitan o bloquean usuarios en Supabase Auth. Las demás se pueden resolver sin una llave que se salta RLS.
- **Origen:** conversación al diseñar SPEC 14; `references/documents/database-schema.md`, regla 4.
- **Se resuelve en:** cada spec que implemente una de esas tareas (invitación de staff, aceptar invitaciones, archivar usuarios, resumen diario).
- **Notas:**
  - **Necesario:** crear cuentas, aceptar una invitación de un familiar nuevo (crea la cuenta), reenviar la invitación al staff (`inviteUserByEmail`/`generateLink`) y bloquear el login (`auth.admin.updateUserById` con ban).
  - **Aceptar una invitación de un familiar con cuenta:** función SQL `SECURITY DEFINER` (ej. `accept_invitation(code)`) llamada con su sesión; valida código, email y guardería, inserta en `guardian_elderly` y marca la invitación.
  - **Activar al staff:** trigger en `auth.users` que pasa su fila de `users` a `active` cuando crea su contraseña.
  - **Archivar o reactivar (`status`):** ya lo permite la policy de update del admin.
  - **Ban:** opcional. Un usuario `archived` ya no ve nada (los helpers solo reconocen `active`) y la app lo saca con `/auth/end-session`; el ban es una capa extra.
  - **Cron del resumen diario:** con `pg_cron` corre como `postgres` y no lo necesita; desde un cron de Next.js sí.
  - Si se adopta una alternativa, actualizar la regla 4 de `database-schema.md` y la lista de CLAUDE.md.

### Eliminar `/family-pending` y reescribir la redirección del familiar

- [ ] **Estado:** pendiente
- **Qué:** `/family-pending`, `FamilyPendingView` y `requireRelativeUser()` son temporales. Hay que eliminarlos y reescribir el destino del `relative` en `sign-in.ts` y en `requireTeamUser()`.
- **Origen:** SPEC 11.
- **Se resuelve en:** la spec de pantallas para familiares.
- **Notas:** el destino pasa a ser el feed del familiar.

---

## Adultos mayores (`/elderly`)

### Guardar desde "Agregar adulto mayor"

- [x] **Estado:** resuelto en SPEC 14
- **Qué:** el modal valida pero no guarda. Falta la Server Action con validación en servidor y la conversión del texto de alergias a etiquetas (`allergy_tags`).
- **Origen:** SPEC 13, `elderly/components/AddElderlyForm.tsx`.
- **Se resuelve en:** una spec de alta de adultos mayores.
- **Notas:** la policy `elderly_insert_admin` ya existe. Evaluar ocultar el botón al staff.

### Conectar `/elderly/[id]` a Supabase y restaurar el enlace de `ElderlyCard`

- [ ] **Estado:** pendiente
- **Qué:** el perfil sigue con el mock y las tarjetas de `/elderly` ya no enlazan a él (`<article>` sin hover) para evitar un 404 mientras tanto.
- **Origen:** SPEC 13, `elderly/components/ElderlyCard.tsx`.
- **Se resuelve en:** la spec del perfil con datos reales.
- **Notas:** volver a `<Link href={`/elderly/${id}`}>` con el hover original (`hover:-translate-y-0.5 hover:border-[#F2A78E]`). Ver también la entrada de `params` fuera de `<Suspense>`.

### Conteos reales de familiares en `/elderly`

- [ ] **Estado:** pendiente
- **Qué:** `getElderlySource()` devuelve `relatives`, `guardianElderly` e `invitations` vacíos. Todas las tarjetas dicen "sin familiares vinculados" y, sin alergias, VINCULAR.
- **Origen:** SPEC 13, `elderly/get-elderly-source.ts`.
- **Se resuelve en:** las specs de `guardian_elderly` e `invitations`.
- **Notas:** el mockup muestra conteos distintos y "flecha" cuando hay familiares; los builders ya lo soportan.

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
