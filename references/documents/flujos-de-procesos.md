## Flujos de creación de cuentas

- El signup público está DESACTIVADO. Nunca usar `supabase.auth.signUp()` desde el cliente.
- Toda creación de cuentas ocurre en Server Actions con el cliente `supabaseAdmin` (service_role), y solo después de verificar que quien la ejecuta tiene role = 'admin' (o un código válido).
- El `role` y el `daycare_id` los fija SIEMPRE el servidor, nunca se toman del formulario:
    - `role`: staff → `'staff'`, familiar → `'relative'`. Los admins se crean solo a mano en Supabase.
    - `daycare_id`: para el staff se toma de la fila del admin que hace la acción; para el familiar, del adulto mayor de la invitación (ver paso 6 de "Familiar").

### Staff

1. El admin llena "Agregar personal" (first_name, last_name, email).
2. Server Action → `auth.admin.inviteUserByEmail(email, { data: { first_name, last_name, role: 'staff', daycare_id } })`.
3. El usuario se crea en auth.users en ESTE momento; el trigger crea su fila en users (status = pending).
4. El staff abre el link del correo y crea su contraseña en "/crear-contrasena" (`auth.updateUser({ password })`).
5. Server Action: con el cliente con sesión obtiene quién es el usuario logueado y verifica que es staff con status = pending. Recién ahí, con `service_role`, pasa SU propio status de `pending` a `active`. Nunca recibe el id del usuario desde el cliente.

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
- En "Mi cuenta" del familiar, el estado de fotos de cada adulto mayor es solo de lectura.

> En "Activar cuenta" (flujo de Familiar), si el email ya tiene cuenta, la etiqueta pasa a "INGRESE SU CONTRASEÑA" y el vínculo se crea con esa cuenta (ver "Familiar que ya tiene cuenta").

---

## Flujos de gestión de cuentas

### Reenviar invitación a staff pendiente

1. En la lista de personal, el admin ve al staff con status = pending ("Pendiente").
2. Botón "Reenviar invitación" → Server Action verifica que quien llama es admin y que el staff sigue pending.
3. Con `service_role`, se vuelve a enviar el correo de invitación.

> Verificar qué función de Supabase permite reenviar la invitación a un usuario que ya existe en `auth.users` (el staff pendiente ya fue creado en el paso 3 de su flujo).

### Archivar usuario (staff o familiar)

1. El admin elige "Archivar" en un staff o familiar. No puede archivar a un admin (ni a sí mismo).
2. Server Action verifica que quien llama es admin y que el usuario es de su guardería.
    - Si es staff y tiene adultos mayores asignados (`staff_elderly`), avisarle al admin cuáles quedarán sin cuidador/a, para que los reasigne.
3. Se marca status = archived.
4. Con `service_role`, se bloquea su login en Supabase Auth (ban), para que no pueda iniciar sesión.
5. Sus posts, comentarios y reacciones se conservan.

### Reactivar usuario

1. El admin elige "Reactivar" en un usuario archivado.
2. Server Action verifica que quien llama es admin y que el usuario es de su guardería.
3. Se marca status = active y, con `service_role`, se quita el bloqueo de login.

### Cancelar invitación de familiar

1. El admin elige "Cancelar" en una invitación pending.
2. Se marca status = cancelled. El código deja de funcionar.

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
    
    - Si la audiencia es `room` o `daycare`, al agregar fotos se muestra una advertencia con los adultos mayores de esa audiencia que no tienen consentimiento de fotos.
3. Server Action: arma el `audience` según lo elegido (no lo toma tal cual del cliente) y guarda el post junto con sus adultos mayores etiquetados en UNA sola operación. Si falla cualquier parte, no se guarda nada.
    
4. Luego se suben las fotos a Storage (`{post_id}/archivo`) y se registran en `post_photos`.
    

### Editar publicación

1. Solo el autor puede editar. La audiencia no se puede cambiar.
2. En un post `elderly`, los cambios de etiquetas se guardan juntos en una sola operación, y siempre debe quedar al menos un adulto mayor etiquetado.

### Borrar publicación

1. El autor o el admin (solo en posts de su guardería) elige "Eliminar".
2. Server Action: primero borra los archivos de Storage de `{post_id}/`, mientras el post todavía existe (la regla de Storage comprueba que quien borra es el autor o el admin).
3. Después borra el post. Sus filas en `post_elderly`, `post_photos`, `reactions` y `comments` se borran en cascada.

### Borrar una foto de una publicación

1. El autor o el admin elige quitar una foto.
2. Se borra su archivo en Storage y su fila en `post_photos`.