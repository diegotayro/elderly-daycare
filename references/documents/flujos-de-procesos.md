## Flujos de creación de cuentas

- El signup público está DESACTIVADO. Nunca usar `supabase.auth.signUp()` desde el cliente.
- Toda creación de cuentas ocurre en Server Actions con el cliente `supabaseAdmin` (service_role), y solo después de verificar que quien la ejecuta tiene role = 'admin' (o un código válido).
- El `role` y el `daycare_id` los fija SIEMPRE el servidor, nunca se toman del formulario:
    - `role`: staff → `'staff'`, familiar → `'relative'`. Los admins se crean solo a mano en Supabase.
    - `daycare_id`: para el staff se toma de la fila del admin que hace la acción; para el familiar, del adulto mayor de la invitación (ver paso 6 de "Familiar").

### Staff

1. El admin llena "Agregar personal" (first_name, last_name, email).
2. Server Action (`inviteStaff`): verifica que quien llama es admin, repite la validación y comprueba con `is_team_email` que el email no sea de alguien del equipo. Luego llama a `auth.admin.inviteUserByEmail(email, { data: { first_name, last_name, role: 'staff', daycare_id }, redirectTo: '{APP_URL}/accept-invite' })`. `role` y `daycare_id` salen del servidor, nunca del formulario. Si el email ya tiene cuenta (un familiar), se avisa bajo Email.
3. El usuario se crea en auth.users en ESTE momento; el trigger crea su fila en users (status = pending).
4. El staff abre el link del correo (vence a las 2 h, "Email OTP Expiration" = 7200 s). Supabase valida el token y redirige a `/accept-invite#access_token=…&refresh_token=…`. Esa página cliente guarda la sesión con `setSession`, borra el fragmento y lleva al staff a `/create-password`, donde crea su contraseña.
    - Es temporal mientras se use el SMTP gratuito de Supabase (solo entrega a miembros de la organización, 2 correos por hora y plantilla en inglés). Con Resend como SMTP propio se pasará a `/auth/confirm` con `token_hash` y se eliminará `/accept-invite` (ver BACKLOG).
5. Server Action (`createStaffPassword`): con la sesión del staff verifica con `is_pending_staff()` que es staff con status = pending, guarda la contraseña con `auth.updateUser({ password })` y llama a `activate_staff_account()`, que pasa SU propio status de `pending` a `active`. No usa `service_role` ni recibe el id del usuario desde el cliente. Termina con la sesión iniciada en la home del equipo (`/`). Mientras el staff está `pending`, cualquier otra ruta lo lleva a `/create-password`.

### Familiar

1. El admin llena "Vincular familiar/tutor" (first_name, last_name, email, relationship) para un adulto mayor activo (no se invita para uno archivado). Server Action con la sesión del admin; valida que el email no esté ya vinculado a ese adulto mayor (`is_email_linked_to_elderly`) y que no sea de un staff o admin de la guardería (`is_team_email`).
2. Antes de insertar, las `pending` vencidas de ese email y adulto mayor se marcan `expired`. Si queda una `pending` vigente, el admin confirma el reemplazo y la anterior pasa a `cancelled`. Se guarda SOLO una fila en invitations (status = pending, expires_at = +7 días, email en minúsculas). NO se crea usuario.
3. Se envía un correo con el código desde Next.js (Resend). Si el correo falla, la invitación queda guardada y el admin ve el código para compartirlo.
4. El familiar entra a "Activar cuenta" (sin sesión): código, email, contraseña y consentimiento de fotos. Para mostrar la tarjeta del adulto mayor, el servidor lee la invitación con `service_role` (`get_invitation_preview`).
5. Server Action valida: formato del código, código existe, status = pending, no vencido, adulto mayor activo, email coincide con el de la invitación y contraseña con mínimo 8 caracteres, con letras y dígitos.
6. RECIÉN AQUÍ se crea el usuario, con `service_role`: `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name, last_name, role: 'relative', daycare_id } })`, con first_name y last_name tomados de la invitación (no del formulario). El `daycare_id` se obtiene del adulto mayor de la invitación (invitación → adulto mayor → su habitación → su guardería), ya que `invitations` no tiene `daycare_id`. El trigger crea su fila en users con status = active.
7. Con el cliente con sesión, `signInWithPassword`. Luego, con la sesión del familiar, `accept_invitation`: en una sola transacción inserta en guardian_elderly (con el relationship de la invitación), aplica el consentimiento de fotos (ver regla abajo) y marca la invitación accepted (con accepted_at). Si falla, se cierra la sesión y se muestra el error.
8. Con el vínculo creado, el familiar queda con sesión iniciada y se le redirige a su destino.

### Familiar que ya tiene cuenta (otro adulto mayor)

Ej.: un hijo que ya tiene cuenta por su papá y ahora se inscribe su mamá.

1. El admin genera la invitación igual que en el flujo de Familiar (pasos 1 a 3).
2. El familiar entra a "Activar cuenta" (con el link del correo o escribiendo el código). Como su email ya tiene cuenta, la etiqueta es "INGRESE SU CONTRASEÑA" (si el formulario estaba en "CREAR CONTRASEÑA", el servidor responde "Este email ya tiene cuenta. Ingresa tu contraseña." y la etiqueta cambia). Ingresa su contraseña y el consentimiento de fotos.
3. Server Action valida: código existe, status = pending, no vencido, el email coincide con el de la invitación, y la contraseña cumple la regla de formato. Con el cliente con sesión, `signInWithPassword` con la contraseña ingresada.
4. NO se crea usuario. Con la sesión del familiar, `accept_invitation` valida que sea `relative` y de la misma guardería que el adulto mayor de la invitación; luego, en una sola transacción, inserta en guardian_elderly, aplica el consentimiento de fotos (ver regla abajo) y marca la invitación accepted.

### Regla del consentimiento de fotos

Un adulto mayor puede tener varios familiares, y siempre gana el "no":

- Si el familiar NO consiente → `elderly.photo_consent = false`.
- Si el familiar SÍ consiente → no se cambia nada (se mantiene el valor actual).
- Ningún familiar puede pasar el consentimiento de `false` a `true`. Solo el admin puede modificarlo después.
- El admin lo cambia desde `/elderly/[id]` (solo adultos mayores `active`), con un switch que guarda al tocarlo.
- En «Mi cuenta» del familiar, el estado de fotos es solo de lectura; el botón «Solicitar cambio» por ahora solo indica que se comunique con la guardería.

> En "Activar cuenta" (flujo de Familiar), si el email ya tiene cuenta, la etiqueta pasa a "INGRESE SU CONTRASEÑA" y el vínculo se crea con esa cuenta (ver "Familiar que ya tiene cuenta").

---

## Flujos de gestión de cuentas

### Reenviar invitación a staff pendiente

1. En la lista de personal, el admin ve al staff con status = pending ("Pendiente").
2. Botón "Reenviar invitación" en el perfil del staff → Server Action (`resendStaffInvitation`) verifica que quien llama es admin y que el staff es de su guardería y sigue pending.
3. Con `service_role`, se llama de nuevo a `inviteUserByEmail` con la misma metadata y el mismo `redirectTo`. Supabase genera un token nuevo y el link anterior deja de funcionar. Verificado con el SMTP gratuito: con el email sin confirmar, Auth acepta el reenvío.
4. Si Auth responde `email_exists` (el staff abrió el link anterior, su email quedó confirmado, pero no creó la contraseña), se usa `auth.resetPasswordForEmail(email, { redirectTo })`. Llega el correo "Reset your password" y su link lleva al mismo flujo (`/accept-invite` y luego `/create-password`). Este camino se revisó en el código, no se probó con un correo real.
5. No se borra nada de la base de datos: el staff no tiene fila en `invitations`.

### Archivar usuario (staff o familiar)

1. El admin elige "Archivar" en un staff o familiar. No puede archivar a un admin (ni a sí mismo).
2. Server Action verifica que quien llama es admin y que el usuario es de su guardería.
    - Si es staff y tiene adultos mayores asignados (`staff_elderly`), avisarle al admin cuáles quedarán sin cuidador/a, para que los reasigne.
3. Se marca status = archived con la sesión del admin.
4. Con `service_role`, se bloquea su login en Supabase Auth (ban), para que no pueda iniciar sesión. Si el ban falla, se revierte el status a active y se avisa del error.
5. Sus posts, comentarios y reacciones se conservan.

### Reactivar usuario

1. El admin elige "Reactivar" en un usuario archivado.
2. Server Action verifica que quien llama es admin y que el usuario es de su guardería.
3. Con `service_role`, se quita el bloqueo de login.
4. Se marca status = active con la sesión del admin. Si falla, se vuelve a bloquear el login y se avisa del error.

### Cancelar invitación de staff

1. El admin elige "Cancelar invitación" en un staff pending y confirma.
2. Server Action verifica que quien llama es admin, que el staff es de su guardería y que su status es pending.
3. Con `service_role`, se borra la cuenta con `auth.admin.deleteUser`; la cascada borra la fila de `users`. El enlace que se le envió deja de funcionar.
4. Se vuelve a `/staff` con el aviso "Invitación cancelada". El admin puede invitarlo de nuevo.

### Eliminar staff sin historial

1. El admin elige "Eliminar" en un staff active o archived y confirma. El botón solo aparece si el staff no tiene historial (`staff_has_history()`). Si tiene adultos mayores que quedarían sin otro staff activo, el aviso los lista.
2. Server Action verifica que quien llama es admin, que el staff es de su guardería, que su status es active o archived y que no tiene historial.
3. Con `service_role`, se borra la cuenta con `auth.admin.deleteUser`; la cascada borra `users` y `staff_elderly`.
4. Si el staff creó historial entre la lectura y el borrado, la FK `on delete restrict` hace fallar el borrado y la acción avisa que ya no se puede eliminar.
5. Se vuelve a `/staff` con el aviso "Staff eliminado". Un staff con historial no se elimina: se archiva.

### Cancelar invitación de familiar

1. El admin elige "Cancelar" en una invitación pending.
2. Se marca status = cancelled. El código deja de funcionar.

### Archivar y reactivar adulto mayor

1. El admin elige "Archivar" en el perfil de un adulto mayor active y confirma. "Reactivar" no pide confirmación.
2. Server Action verifica que quien llama es admin activo y que el adulto mayor es de su guardería y está en el estado esperado (active para archivar, archived para reactivar).
3. Archivar: se marca status = archived y, con la sesión del admin, todas sus invitaciones pending (vencidas por fecha incluidas) pasan a cancelled. Si cancelarlas falla, se revierte el status a active y se avisa del error.
4. Reactivar: se marca status = active. Las invitaciones canceladas no vuelven; el admin genera nuevas con "Vincular".
5. Se conservan `staff_elderly`, `guardian_elderly`, posts, fotos, reacciones y comentarios. No cambian la habitación ni el photo_consent.
6. Un adulto mayor archivado queda de solo lectura: no se edita, no se vincula a familiares ni se cambia su consentimiento de fotos hasta reactivarlo.

### Invitaciones vencidas

- Una invitación con expires_at en el pasado se trata como vencida, aunque su status siga pending.
- Opcional: un cron marca status = expired para que el admin las vea así en la lista.
- Para volver a invitar, el admin genera una invitación nueva (nuevo código).

---

## Flujos de publicaciones

### Crear publicación

1. El usuario (staff o admin) abre "Nueva publicación" y elige para quién es:
    
    - uno o más adultos mayores → `audience = elderly`;
    - "Toda la habitación" + qué habitación → `audience = room` y `room_id`;
    - "Toda la guardería" → `audience = daycare` (opción visible solo para el admin).
    
    El staff solo ve sus adultos mayores asignados y las habitaciones donde está alguno de ellos.
    
2. Elige el tipo (cualquiera), escribe la descripción y, si quiere, agrega fotos.
    
    - **Título (opcional):** solo con `room` y `daycare`. Vacío se guarda como `null`. Los posts `elderly` no llevan título.
    - **Fotos:** cada foto original puede pesar hasta 20 MB. Antes de publicar, el navegador las comprime a WebP, con el lado mayor de 1280 px y hasta 200 KB. Si alguna no se puede procesar (por ejemplo, un formato que el navegador no lee), no se publica nada y se avisa cuál foto es.
    - **Consentimiento de fotos, `audience = elderly`:** el adulto mayor sin consentimiento se marca con una cámara tachada. Si hay fotos y algún etiquetado no tiene consentimiento, no se puede publicar: se pide quitar las fotos o quitar a esa persona.
    - **Consentimiento de fotos, `audience = room` o `daycare`:** al agregar fotos, si hay algún adulto mayor activo sin consentimiento en esa habitación (o en cualquiera, para `daycare`), se muestra un aviso genérico, sin nombres, que no bloquea. Cuenta también a los adultos mayores no asignados al staff.
3. Al elegir "Publicar", la app comprime las fotos y, solo si todas se procesan, sigue con la Server Action. Esta arma el `audience` según lo elegido (no lo toma tal cual del cliente), vuelve a validar las mismas reglas que el cliente y guarda el post junto con sus adultos mayores etiquetados en UNA sola operación (`create_post`). Si falla cualquier parte, no se guarda nada.
    
4. Luego se suben las fotos a Storage (`{post_id}/{position}.webp`) y se registran en `post_photos`. Si falla la subida o el registro de cualquier foto, se borran los archivos de `{post_id}/` y después el post, y se avisa que no se pudo publicar; el formulario conserva lo escrito.
    

### Editar publicación

1. Solo el autor puede editar. La audiencia no se puede cambiar.
2. En un post `elderly`, los cambios de etiquetas se guardan juntos en una sola operación, y siempre debe quedar al menos un adulto mayor etiquetado.

### Borrar publicación

1. El admin (cualquier post de su guardería) o el autor staff si no tiene historial (reacciones o comentarios de otras personas) elige «Eliminar» en el detalle `/posts/[id]` y lo confirma.
2. Server Action: primero borra los archivos de Storage de `{post_id}/`, mientras el post todavía existe (la regla de Storage comprueba que quien borra es el autor o el admin).
3. Después borra el post. Sus filas en `post_elderly`, `post_photos`, `reactions` y `comments` se borran en cascada.

### Borrar una foto de una publicación

1. El autor o el admin elige quitar una foto.
2. Se borra su archivo en Storage y su fila en `post_photos`.