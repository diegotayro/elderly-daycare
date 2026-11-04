# ElderlyDayCare — Esquema de base de datos

Diccionario de tablas para PostgreSQL. Tipos en notación Postgres. Convención: PK `id` tipo `uuid` (default `gen_random_uuid()`), y `created_at` / `updated_at` tipo `timestamptz`.

**Convención de idioma:** todo lo que se persiste en la base de datos va en **inglés** (enums, tags, códigos). Las etiquetas visibles al usuario se traducen en la capa de UI (español).

---

## ENUMs usados

|Enum|Valores|
|---|---|
|`user_role`|`staff`, `relative`, `admin`|
|`user_status`|`pending`, `active`, `archived`|
|`relationship_type`|`son`, `daughter`, `guardian`|
|`invitation_status`|`pending`, `accepted`, `expired`, `cancelled`|
|`post_type`|`meal`, `nap`, `activity`, `achievement`, `announcement`|
|`post_audience`|`elderly`, `room`, `daycare`|
|`elderly_status`|`active`, `archived`|

### Etiquetas UI (español) — no se guardan en DB

|Enum|Valor DB|Etiqueta UI|
|---|---|---|
|`relationship_type`|`son`|Hijo|
|`relationship_type`|`daughter`|Hija|
|`relationship_type`|`guardian`|Tutor|
|`post_type`|`meal`|Comida|
|`post_type`|`nap`|Siesta|
|`post_type`|`activity`|Actividad|
|`post_type`|`achievement`|Logro|
|`post_type`|`announcement`|Anuncio|
|`user_status`|`pending`|Pendiente|
|`user_status`|`active`|Activo|
|`user_status`|`archived`|Archivado|
|`elderly_status`|`active`|Activo|
|`elderly_status`|`archived`|Archivado|
|`post_audience`|`elderly`|Adultos mayores|
|`post_audience`|`room`|Habitación|
|`post_audience`|`daycare`|Toda la guardería|

---

## Seguridad: Row Level Security (RLS)

### Reglas generales

1. **RLS activado en todas las tablas.** Una tabla con RLS y sin policies queda cerrada; cada policy abre solo lo que un rol necesita.
2. **Todas las policies son `to authenticated`.** El rol `anon` (sin login) no tiene ninguna policy.
3. **Todo `insert` y `update` lleva `with check`** (además del `using` en `update`).
4. **Cliente con sesión (`@supabase/ssr`) para todo.** El cliente admin (`service_role`) solo se usa para: crear cuentas (`auth.admin.*`), aceptar invitaciones, reenviar invitaciones al staff, activar al staff (de `pending` a `active`), archivar y reactivar usuarios (incluye bloquear o desbloquear su login) y el cron del resumen diario. Antes de usarlo, el código verifica que quien llama tiene permiso.
5. **Nombres de policies en inglés:** `<tabla>_<acción>_<quién>` (ej. `posts_select_visible`).
6. **Sin policy de `delete`** donde hay borrado lógico (`elderly`, `invitations`) o donde lo maneja Supabase Auth (`users`).
7. **Funciones helper.** Usar funciones helper en las policies siempre que se pueda, para no repetir lógica. Deben ser `SECURITY DEFINER`, `STABLE` y con `search_path` fijo, para evitar la recursión al leer `users`. Solo pueden devolver datos del propio usuario logueado (`auth.uid()`) o un `true/false`, nunca filas de otras personas. Dentro de las policies, envolverlas en un `select` (ej. `(select is_staff())`) para que se calculen una vez por consulta.
8. **Solo los usuarios `active` tienen acceso.** Un usuario `pending` o `archived` se trata como si no tuviera rol: no ve ni modifica nada. Lo más simple es que los helpers que devuelven el rol o la guardería **del usuario logueado** solo lo reconozcan si está `active`. Además, un usuario `archived` tiene el login bloqueado en Supabase Auth. Esta regla se refiere a lo que **ese usuario** puede hacer: su fila en `users` sigue visible para los demás, y sus posts y comentarios siguen apareciendo en el feed con su nombre.

### Regla del feed: ¿quién puede ver un post?

Las tablas `posts`, `post_elderly`, `post_photos`, `reactions`, `comments` y el Storage de fotos usan esta regla. Debe implementarse **en un solo lugar**.

- El post tiene que ser de la guardería del usuario (según la guardería del autor).
- **El tipo (`type`) no influye en quién ve el post; solo la audiencia (`audience`).**
- **Admin:** ve todos los posts de su guardería.
- **Staff:** ve un post si se cumple alguna de estas:
    - `audience = elderly` y está etiquetado alguno de sus asignados (`staff_elderly`), aunque el post también etiquete a otros;
    - `audience = room` y es la habitación de alguno de sus asignados;
    - `audience = daycare`;
    - es el autor del post.
- **Relative:** ve un post si se cumple alguna de estas:
    - `audience = elderly` y está etiquetado (`post_elderly`) alguno de sus adultos mayores;
    - `audience = room` y es la habitación de alguno de sus adultos mayores;
    - `audience = daycare`.

---

## 1. `daycares`

La guardería como entidad raíz.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`name`|`text`|Ej. "Guardería A1".|
|`created_at`|`timestamptz`||

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|todos los de la guardería|solo su propia guardería|
|update|admin|solo su propia guardería|
|insert / delete|nadie desde la app|se hace con `service_role` o por SQL|

---

## 2. `users`

Perfil de aplicación vinculado a **Supabase Auth**. Relatives y staff comparten tabla, diferenciados por `role`. La autenticación (email, contraseña, confirmación) vive en `auth.users`; esta tabla solo guarda datos de dominio.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK|FK → `auth.users(id)` ON DELETE CASCADE. Mismo UUID que Supabase Auth.|
|`daycare_id`|`uuid` FK → `daycares`||
|`role`|`user_role`|`staff` / `relative` / `admin`.|
|`status`|`user_status`|Valor inicial según rol (lo fija el trigger): staff → `pending` hasta que crea su contraseña; relative → `active` (su estado previo vive en `invitations`). `archived` = ya no tiene acceso; se conserva su historial.|
|`first_name`|`text`|NOT NULL|
|`last_name`|`text`|NOT NULL|
|`full_name`|`text`|Columna generada y guardada: `first_name` y `last_name` unidos con un espacio.|
|`avatar_url`|`text`|Nullable.|
|`notify_on_post`|`boolean` default `true`|Avisos cuando publican.|
|`daily_summary_enabled`|`boolean` default `true`|Resumen diario (19:00).|
|`created_at` / `updated_at`|`timestamptz`||

> **Implementación Supabase:** crear la fila con un trigger `AFTER INSERT` en `auth.users` (función `SECURITY DEFINER` con `set search_path = public`). El signup público está desactivado: nunca usar `supabase.auth.signUp()` desde el cliente. Pasar `daycare_id`, `role`, `first_name` y `last_name` vía `raw_user_meta_data` **desde el servidor**, al crear la cuenta con `auth.admin.inviteUserByEmail` (staff) o `auth.admin.createUser` (relative). Activar RLS en esta tabla. No duplicar `email` ni `password_hash` — Supabase ya los gestiona en `auth.users`.
> 
> **El `role` lo fija siempre el servidor**, nunca se toma de lo que envía el cliente: invitación de staff → `staff`; aceptación de invitación → `relative`. Los admins se crean solo a mano en Supabase (SQL Editor o dashboard).

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|cualquiera|su propia fila|
|select|admin|todos los usuarios de su guardería|
|select|staff|admin y staff de su guardería, familiares de sus ancianos asignados y autores de comentarios en posts que puede ver|
|select|relative|staff/admin de su guardería (para ver quién publica) y autores de comentarios en posts que puede ver|
|update|cualquiera|su propia fila, **solo** sus preferencias: `avatar_url`, `notify_on_post`, `daily_summary_enabled`|
|update|admin|usuarios de su guardería: nombres y preferencias de cualquiera; `status` solo de staff y relatives|
|insert|nadie|lo hace el trigger de `auth.users`|
|delete|nadie|se borra con `auth.admin.deleteUser` (cascade)|

> **Protección de columnas.** La policy de update propio deja editar toda la fila, así que hace falta un mecanismo extra (ej. trigger `BEFORE UPDATE`):
> 
> - Nadie puede cambiar `id`, `daycare_id` ni `role` desde la app, **ni siquiera el admin**. Para agregar o quitar un admin, se hace a mano en la base de datos.
> - Solo un admin puede cambiar `first_name`, `last_name` y `status`.
> - El admin **no** puede cambiar el `status` de un usuario con `role = 'admin'`, incluido él mismo.
> - Los cambios hechos con `service_role` o desde el SQL Editor (sin `auth.uid()`) se permiten.

> **Usuarios archivados:** su fila sigue visible para los demás (según las reglas de select de arriba), para que sus posts y comentarios antiguos sigan mostrando su nombre en el feed.

---

## 3. `rooms` (habitaciones)

Habitaciones donde descansan los adultos mayores (Roble, Cedro…).

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`daycare_id`|`uuid` FK → `daycares`||
|`is_default`|`boolean`|NOT NULL default `false`|
|`name`|`text`|Ej. "Roble".|
|`created_at`|`timestamptz`||

> **Implementación Supabase:** cada guardería debe tener exactamente una habitación por defecto (`is_default = true`), donde se asignan los adultos mayores recién inscritos. Se crea automáticamente con un trigger `AFTER INSERT` en `daycares` (función `SECURITY DEFINER` con `set search_path = public`), que inserta en `rooms` una habitación con `daycare_id = new.id`, `name = 'Temporal'` e `is_default = true`. Índice único parcial: `create unique index on rooms (daycare_id) where is_default = true`, para que solo haya una por guardería. Las habitaciones creadas desde la app siempre se guardan con `is_default = false`. La habitación por defecto se puede renombrar, pero no eliminar. Activar RLS en esta tabla.

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|todos los de la guardería|habitaciones de su guardería|
|insert|admin|en su guardería y siempre con `is_default = false`|
|update|admin|habitaciones de su guardería; **solo se puede editar `name`**|
|delete|admin|habitaciones de su guardería que no sean la de por defecto|

> Para que solo se edite `name`, usar permisos por columna (`grant update (name)`), así nadie cambia `daycare_id` ni `is_default`.

---

## 4. `elderly` (ancianos)

Ancianos inscritos en la guardería.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`room_id`|`uuid` FK → `rooms`|NOT NULL|
|`first_name`|text|NOT NULL|
|`last_name`|text|NOT NULL|
|`full_name`|`text`|Columna generada y guardada: `first_name` y `last_name` unidos con un espacio.|
|`birth_date`|`date`|Fecha de nacimiento.|
|`enrolled_at`|`date`|Fecha de ingreso a la guardería.|
|`medical_notes`|`text`|Alergias y notas médicas (texto libre).|
|`allergy_tags`|`text[]`|Etiquetas en inglés, ej. `{peanut}`. _Ver nota._|
|`photo_consent`|`boolean` default `true`|Consentimiento de fotos. _Ver nota._|
|`status`|`elderly_status`|`active` / `archived` (borrado lógico).|
|`created_at` / `updated_at`|`timestamptz`||

> **Nota `allergy_tags`:** Array de Postgres por simplicidad. Valores en inglés (`peanut`, `lactose`, `gluten`, etc.); la UI traduce a MANÍ, LACTOSA, etc. Si quieres normalizar, sácalo a una tabla `allergies` + `elderly_allergies`.

### RLS

Tabla con datos médicos: de las más sensibles.

|Acción|Quién|Regla|
|---|---|---|
|select|admin|ancianos de su guardería|
|select|staff|solo sus ancianos asignados (`staff_elderly`)|
|select|relative|solo sus ancianos (vinculados en `guardian_elderly`)|
|insert|admin|en una habitación de su guardería|
|update|**solo admin**|ancianos de su guardería, y la habitación destino también|
|delete|nadie|borrado lógico con `status = 'archived'`|

---

## 5. `guardian_elderly` (vínculo relative ↔ anciano)

Tabla intermedia. Un relative puede tener varios ancianos y un anciano varios relatives.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`relative_id`|`uuid` FK → `users`||
|`elderly_id`|`uuid` FK → `elderly`||
|`relationship`|`relationship_type`|Parentesco del relative con el anciano.|
|`created_at`|`timestamptz`||
|||UNIQUE (`relative_id`, `elderly_id`).|

### RLS

Decide quién es familia de quién: un relative **nunca** puede escribir aquí.

|Acción|Quién|Regla|
|---|---|---|
|select|relative|solo sus propios vínculos|
|select|admin|vínculos de ancianos de su guardería|
|select|staff|vínculos de sus ancianos asignados|
|insert|admin|anciano de su guardería y relative (`role = 'relative'`) de su guardería|
|delete|admin|vínculos de ancianos de su guardería|
|update|nadie|para cambiar un vínculo, se borra y se crea de nuevo|

> En el flujo normal, el vínculo lo crea la server action que acepta la invitación (con `service_role`).

---

## 6. `staff_elderly` (asignación staff ↔ anciano)

Tabla intermedia. Un staff puede tener varios ancianos asignados y un anciano varios staff. Sin límite de ancianos por staff.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`staff_id`|`uuid` FK → `users`|Usuario con `role = 'staff'`.|
|`elderly_id`|`uuid` FK → `elderly`||
|`created_at`|`timestamptz`||
|||UNIQUE (`staff_id`, `elderly_id`).|

> Un anciano recién inscrito no lo ve ningún staff hasta que el admin lo asigne. Si un staff se archiva, el admin debe reasignar a sus ancianos.

### RLS

Define qué ancianos ve y puede etiquetar cada staff: **solo el admin** la modifica.

|Acción|Quién|Regla|
|---|---|---|
|select|admin|asignaciones de ancianos de su guardería|
|select|staff|solo sus propias asignaciones|
|select|relative|asignaciones de sus ancianos (para el menú "Staff": quién cuida a su familiar)|
|insert|admin|anciano de su guardería y usuario con `role = 'staff'` de su guardería|
|delete|admin|asignaciones de ancianos de su guardería|
|update|nadie|para cambiar una asignación, se borra y se crea de nuevo|

---

## 7. `invitations` (invitaciones)

El admin genera un código para vincular a un relative con un anciano.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`elderly_id`|`uuid` FK → `elderly`|A qué anciano se vincula.|
|`invited_by`|`uuid` FK → `users`|Admin que invita.|
|`first_name`|`text`|NOT NULL|
|`last_name`|`text`|NOT NULL|
|`full_name`|`text`|Columna generada y guardada: `first_name` y `last_name` unidos con un espacio.|
|`email`|`text`||
|`relationship`|`relationship_type`||
|`code`|`text` UNIQUE|Código corto, ej. `7K4P9`.|
|`status`|`invitation_status`|`pending` / `accepted` / `expired` / `cancelled`.|
|`expires_at`|`timestamptz`||
|`accepted_at`|`timestamptz`|Nullable.|
|`created_at`|`timestamptz`||

### RLS

Los `code` son llaves de acceso: **solo el admin** toca esta tabla.

|Acción|Quién|Regla|
|---|---|---|
|select / update|admin|invitaciones de ancianos de su guardería|
|insert|admin|anciano de su guardería y `invited_by` = él mismo|
|delete|nadie|se cancela con `status = 'cancelled'`|
|(cualquiera)|relative|nada: no lee ni escribe la tabla|

---

## 8. `posts` (publicaciones)

Una publicación tiene un tipo (qué es) y una audiencia (para quién es).

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`author_id`|`uuid` FK → `users`|Staff o admin que publica.|
|`audience`|`post_audience`|`elderly`: adultos mayores etiquetados en `post_elderly`. `room`: toda una habitación. `daycare`: toda la guardería.|
|`room_id`|`uuid` FK → `rooms`|Obligatorio si `audience = room`; `null` en los demás casos.|
|`type`|`post_type`|Qué es el post. Cualquier tipo puede ir con cualquier audiencia.|
|`title`|`text`|Nullable (ej. "Anuncio general").|
|`body`|`text`|Descripción.|
|`published_at`|`timestamptz`||
|`created_at` / `updated_at`|`timestamptz`||

> **Reglas de audiencia:** con `audience = elderly`, el post se crea junto con sus adultos mayores etiquetados (al menos uno), en una sola operación. Al editar un post `elderly`, los cambios de adultos mayores etiquetados se guardan juntos en una sola operación. **Un post `elderly` siempre debe tener al menos un adulto mayor etiquetado mientras exista.** Con `room` o `daycare`, no lleva adultos mayores etiquetados. La audiencia no se puede cambiar después de crear el post.

> **Al borrar un post:** sus filas en `post_elderly`, `post_photos`, `reactions` y `comments` se borran en cascada. Los archivos de Storage no se borran solos: primero se borran los archivos de `{post_id}/` (mientras el post existe, para que pase la regla de Storage) y después el post.

### RLS

| Acción | Quién         | Regla                                                                                                                                                                                                                                                                                                                                            |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| select | todos         | puede ver el post (regla del feed)                                                                                                                                                                                                                                                                                                               |
| insert | staff/admin   | Todas estas condiciones se cumplen a la vez (una sola policy): `author_id` = él mismo (cualquier tipo), **y además**, según la audiencia: `elderly` → a quiénes etiqueta se valida en `post_elderly`; `room` → admin: cualquier habitación de su guardería, staff: solo habitaciones donde está alguno de sus asignados; `daycare` → solo admin. |
| update | autor         | sus posts; sigue siendo el autor; no cambia la audiencia; si es `room`, la habitación cumple las reglas de insert                                                                                                                                                                                                                                |
| delete | autor o admin | el admin solo en posts de su guardería (moderación)                                                                                                                                                                                                                                                                                              |

---

## 9. `post_elderly` (ancianos etiquetados en la publicación)

Tabla intermedia. Es la clave para filtrar el feed del relative.

|Campo|Tipo|Notas|
|---|---|---|
|`post_id`|`uuid` FK → `posts` ON DELETE CASCADE||
|`elderly_id`|`uuid` FK → `elderly`||
|||PK compuesta (`post_id`, `elderly_id`).|

> Ver _Regla del feed_.

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|todos|puede ver el post (regla del feed)|
|insert|autor del post|solo si el post tiene `audience = elderly`. Staff: solo sus asignados; admin: cualquier adulto mayor de su guardería. **No** se puede etiquetar a un adulto mayor sin `photo_consent` si el post ya tiene fotos|
|delete|autor del post o admin|el admin solo en posts de su guardería. **Un post `elderly` siempre debe tener al menos un adulto mayor etiquetado mientras exista:** al editarlo no se pueden quitar todos; al borrar el post completo, sus filas en `post_elderly` se borran junto con él.|

---

## 10. `post_photos` (fotos de la publicación)

Fotos adjuntas a una publicación, con soporte para vista a pantalla completa.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`post_id`|`uuid` FK → `posts` ON DELETE CASCADE||
|`url`|`text`|Ruta del archivo en Storage (`{post_id}/archivo`).|
|`width` / `height`|`int`|Nullable — útil para la vista a pantalla completa.|
|`position`|`int`|Orden de la foto en la publicación.|
|`created_at`|`timestamptz`||

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|todos|puede ver el post (regla del feed)|
|insert|autor del post|**ningún** anciano etiquetado en el post tiene `photo_consent = false`|
|delete|autor del post o admin|el admin solo en posts de su guardería|

> **Al borrar una foto**, también se borra su archivo en Storage.

> **`photo_consent` se valida en los dos sentidos:** aquí y en `post_elderly`. Así no importa en qué orden la app guarde las fotos y las etiquetas.

> **Posts `room` y `daycare`:** no hay adultos mayores etiquetados, así que la base de datos no puede verificar `photo_consent`; es responsabilidad del personal. Al subir fotos, la pantalla debe advertir qué adultos mayores de esa audiencia no tienen consentimiento de fotos.

---

## 11. `reactions` (reacciones)

Reacciones a publicaciones (ej. "Me encanta"). Solo se reacciona a posts, no a comentarios.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`post_id`|`uuid` FK → `posts` ON DELETE CASCADE||
|`user_id`|`uuid` FK → `users`|Usuario que reacciona (admin, staff o relative).|
|`type`|`text`|Ej. `love`.|
|`created_at`|`timestamptz`||
|||UNIQUE (`post_id`, `user_id`) — una reacción por usuario.|

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|todos|puede ver el post (regla del feed)|
|insert|cualquiera|`user_id` = él mismo, en un post que puede ver|
|update|dueño|su reacción; sigue siendo suya y en un post que puede ver|
|delete|dueño|su propia reacción|

---

## 12. `comments` (comentarios)

Comentarios en publicaciones.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`post_id`|`uuid` FK → `posts` ON DELETE CASCADE||
|`author_id`|`uuid` FK → `users`|Admin, staff o relative.|
|`body`|`text`||
|`created_at` / `updated_at`|`timestamptz`||

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|todos|puede ver el post (regla del feed)|
|insert|cualquiera|`author_id` = él mismo, en un post que puede ver|
|update|autor|sus comentarios; sigue siendo el autor|
|delete|autor o admin|el admin solo en posts de su guardería (moderación)|

---

## 13. `daily_summaries` (resumen del día)

> **Pendiente para una implementación posterior.** Crear la tabla y su RLS, pero no construir todavía la pantalla, el cron ni las notificaciones del resumen diario.

Un registro por elderly por día.

|Campo|Tipo|Notas|
|---|---|---|
|`id`|`uuid` PK||
|`elderly_id`|`uuid` FK → `elderly`||
|`date`|`date`||
|`meals_count`|`int`|Comidas.|
|`sleep_minutes`|`int`|Sueño en minutos (ej. 90 = 1h30).|
|`activities_count`|`int`|Actividades.|
|`mood`|`text`|Ánimo, ej. "Contenta y participativa".|
|`highlight`|`text`|"Lo más lindo de hoy".|
|`created_at` / `updated_at`|`timestamptz`||
|||UNIQUE (`elderly_id`, `date`).|

> Se puede guardar o **calcularlo** agregando los `posts` del día. Para una clase, la tabla guardada es más fácil de demostrar.

### RLS

|Acción|Quién|Regla|
|---|---|---|
|select|relative|solo de sus ancianos|
|select|admin|ancianos de su guardería|
|select|staff|solo sus ancianos asignados|
|insert / update|staff|solo sus ancianos asignados (el cron usa `service_role`)|
|delete|nadie||

---

## Storage: bucket `post-photos`

Las fotos viven en `storage.objects`, que tiene su **propia** RLS. Si el bucket es público, cualquiera con el link ve la foto, sin importar las policies de `post_photos`.

- Bucket **privado**.
- Ruta de cada archivo: `{post_id}/{nombre-archivo}`. La primera carpeta es el `post_id` y es lo que usan las policies.
- Para mostrar fotos: URLs firmadas (`createSignedUrl`), generadas en el servidor.

|Acción|Quién|Regla|
|---|---|---|
|select|todos|puede ver el post de la ruta (regla del feed)|
|insert|autor del post|es el autor del post de la ruta|
|delete|autor del post o admin|el admin solo en posts de su guardería|

---

## Cómo probar las policies

Crear un usuario de prueba por rol y comprobar:

1. **Relative:** ve solo a su anciano, sus posts, fotos y resumen. Un `select('*')` en `elderly`, `posts` o `invitations` **no** devuelve nada ajeno.
2. **Relative:** cambiar su propio `role` a `admin` → falla.
3. **Relative:** insertar en `guardian_elderly` → falla.
4. **Relative:** comentar con `author_id` de otra persona → falla.
5. **Staff:** no puede crear invitaciones, editar ancianos ni cambiar su nombre o rol (sí su avatar y notificaciones).
6. **Staff:** subir una foto a un post que etiqueta a un anciano con `photo_consent = false` → falla.
7. **Sin login (`anon`):** cualquier `select` devuelve vacío.
8. **Admin:** no puede borrar la habitación por defecto.
9. **Admin:** cambiar el `role` de alguien del staff a `admin` → falla. Cambiar el `status` de otro admin (o el suyo) → falla.
10. **Admin:** invitar a un staff enviando `role: 'admin'` en la petición → la cuenta se crea igual como `staff`.
11. **Usuario `pending` o `archived`:** aunque tenga sesión, cualquier `select` devuelve vacío y cualquier escritura falla.
12. **Staff:** un `select('*')` en `elderly` solo devuelve sus ancianos asignados; en `users`, no ve familiares de ancianos ajenos.
13. **Staff:** etiquetar en su post a un anciano que no tiene asignado → falla.
14. **Staff:** ve un post del admin que etiqueta a uno de sus ancianos junto con otros.
15. **Staff:** publicar con `audience = daycare` → falla.
16. **Staff:** escribir el resumen diario de un anciano que no tiene asignado → falla.
17. **Staff:** insertar o borrar en `staff_elderly` → falla.
18. **Relative:** sigue viendo, con el nombre del autor, los posts de un staff `archived` sobre su anciano.
19. **Staff:** publicar para una habitación donde no tiene asignados → falla.
20. **Relative:** ve un post `room` de la habitación de su adulto mayor, y no ve uno de otra habitación.
21. Crear un post `elderly` sin adultos mayores etiquetados → falla. Editarlo y quitar a todos → falla. Borrar el post completo → funciona.
22. Borrar un post con fotos, reacciones y comentarios → se borra todo, incluidos los archivos en Storage.

---

## Mapa de relaciones (resumen)

```
daycares 1─┬─< rooms 1──< elderly
           └─< users

users  >──< elderly     (vía guardian_elderly, con parentesco)
users  >──< elderly     (vía staff_elderly — asignación del staff)
users  1──< posts        (author)
posts  >──< elderly     (vía post_elderly — etiquetado)
posts  1──< post_photos
posts  1──< reactions >── users
posts  1──< comments  >── users
elderly 1──< daily_summaries
elderly 1──< invitations
```

**Las tablas intermedias (muchos-a-muchos)** son el corazón del modelo

- `guardian_elderly` → quién es familia de quién.
- `staff_elderly` → qué ancianos atiende cada staff (qué ve y qué puede etiquetar).
- `post_elderly` → a qué ancianos pertenece cada publicación (driver del feed del relative).
- (y `invitations` como puente del flujo de onboarding).