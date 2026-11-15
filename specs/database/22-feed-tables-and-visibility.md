# SPEC 22 — Tablas del feed (`posts`, `post_elderly`, `post_photos`, `reactions`, `comments`), bucket `post-photos` y regla de visibilidad

> **Estado:** Aprobado
> **Depende de:** SPEC 10, SPEC 12, SPEC 13, SPEC 15
> **Fecha:** 2026-11-15
> **Objetivo:** Crear las tablas del feed, el bucket privado `post-photos` y el helper `can_view_post()` como única implementación de la regla del feed, con sus policies, para que SPEC 23 pueda saber si un staff tiene historial.

---

## Por qué esta spec

SPEC 20 planificó "SPEC 22 — Estado del staff" (archivar, reactivar, cancelar invitación y eliminar sin historial). "Eliminar sin historial" necesita saber si el staff tiene posts, comentarios o reacciones, y esas tablas no existen. Decisión del usuario: crear primero la base de datos del feed (esta spec) y mover el estado del staff a **SPEC 23**.

Resuelve del BACKLOG:

- "Selects de `users` que dependen de tablas futuras" (autores de comentarios).

---

## Specs siguientes

Planificadas por el usuario; no van en `specs/BACKLOG.md`.

- **SPEC 23 — Estado del staff:** archivar, reactivar, cancelar invitación y eliminar sin historial (lo que SPEC 20 planificaba como SPEC 22).
- **SPEC 24 — Verificar "vincular adulto mayor" para un familiar que ya tiene cuenta:** probar a mano el flujo "Familiar que ya tiene cuenta" de `flujos-de-procesos.md`, ya implementado en SPEC 17 (`/activate-account` con "INGRESE SU CONTRASEÑA" y `accept_invitation`). Caso: un familiar con un adulto mayor vinculado recibe la invitación de otro y queda vinculado a ambos, sin crear otro usuario.
  - Corresponde a la parte C de "Verificación manual de invitar y activar familiares (SPEC 17, pasos 11 y 12)" en `specs/BACKLOG.md`.
  - Actualiza `pantallas-pendientes.md`: punto 21 resuelto por SPEC 17 y se elimina la inconsistencia "Familiar que ya tiene cuenta".

---

## Alcance

**Dentro:**

- Migración `supabase/migrations/<version>_create_feed_tables.sql`:
  - Enums `post_type` y `post_audience`.
  - Tablas `posts`, `post_elderly`, `post_photos`, `reactions` y `comments`, con sus FK, `check` e índices.
  - Helper `can_view_post(p_post_id)`.
  - Triggers: `updated_at`, columnas inmutables de `posts` y "un post `elderly` tiene al menos un etiquetado" (constraint triggers diferidos).
  - RLS activado y policies de las cinco tablas.
  - Policy `users_select_comment_authors`.
  - Bucket privado `post-photos` y sus policies en `storage.objects`.
  - Permisos (`grant` / `revoke`).
- Aplicar la migración con `apply_migration`, **pidiendo permiso antes**.
- Pruebas de restricciones y RLS con `execute_sql` en transacciones con `rollback`.
- `get_advisors` (security y performance).
- `shared/database/types.ts`: agregar `Reaction` y `Comment`.
- Documentación: `database-schema.md`, `BACKLOG.md`, SPEC 20 ("Specs siguientes") y `pantallas-pendientes.md` (ver "Cambios en documentos").

**Fuera de alcance (para specs futuras):**

- Cualquier cambio en las pantallas: el feed de `(app)`, "Nueva publicación" y las pantallas del familiar siguen con mock.
- Función RPC para crear un post con sus etiquetas en una sola llamada (va en la spec de "Nueva publicación"; supabase-js no abre transacciones).
- Subida de fotos, URLs firmadas y borrado de archivos de Storage al borrar un post o una foto (lo hace la app).
- Límites de tamaño y tipos de archivo del bucket.
- `daily_summaries`.
- Archivar, reactivar, cancelar invitación y eliminar staff (SPEC 23).
- Datos de prueba en el remoto o en `seed.sql`: las tablas quedan vacías.

---

## Modelo de datos

### Enums

```sql
create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'announcement');
create type public.post_audience as enum ('elderly', 'room', 'daycare');
```

### Tablas

**`posts`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `author_id` | `uuid` | NOT NULL, FK → `users` **`on delete restrict`** |
| `audience` | `post_audience` | NOT NULL |
| `room_id` | `uuid` | FK → `rooms` `on delete restrict`; nullable |
| `type` | `post_type` | NOT NULL |
| `title` | `text` | nullable |
| `body` | `text` | NOT NULL |
| `published_at` | `timestamptz` | NOT NULL `default now()` |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL `default now()`; `updated_at` con `set_updated_at()` |

Checks:

- `posts_room_id_matches_audience`: `(audience = 'room') = (room_id is not null)`.
- `posts_title_length`: `title is null or char_length(btrim(title)) between 1 and 120`.
- `posts_body_length`: `char_length(btrim(body)) between 1 and 2000`.

Índices: `author_id`, `room_id`, `published_at desc`.

**`post_elderly`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `post_id` | `uuid` | FK → `posts` `on delete cascade` |
| `elderly_id` | `uuid` | FK → `elderly` `on delete restrict` |
| | | PK (`post_id`, `elderly_id`) |

Índice: `elderly_id`.

**`post_photos`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `post_id` | `uuid` | NOT NULL, FK → `posts` `on delete cascade` |
| `url` | `text` | NOT NULL; ruta `{post_id}/archivo` |
| `width` / `height` | `int` | nullable; `check (> 0)` si no es null |
| `position` | `int` | NOT NULL, `check (position >= 0)` |
| `created_at` | `timestamptz` | NOT NULL `default now()` |

Restricciones: `unique (post_id, position)`; `check (split_part(url, '/', 1) = post_id::text)`.

**`reactions`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `post_id` | `uuid` | NOT NULL, FK → `posts` `on delete cascade` |
| `user_id` | `uuid` | NOT NULL, FK → `users` **`on delete restrict`** |
| `type` | `text` | NOT NULL, `check (type = 'love')` |
| `created_at` | `timestamptz` | NOT NULL `default now()` |

Restricción: `unique (post_id, user_id)`. Índice: `user_id`.

**`comments`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `post_id` | `uuid` | NOT NULL, FK → `posts` `on delete cascade` |
| `author_id` | `uuid` | NOT NULL, FK → `users` **`on delete restrict`** |
| `body` | `text` | NOT NULL, `check (char_length(btrim(body)) between 1 and 1000)` |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL `default now()`; `updated_at` con `set_updated_at()` |

Índices: `post_id`, `author_id`.

> Con `on delete restrict` en `posts.author_id`, `comments.author_id` y `reactions.user_id`, borrar en `auth.users` a alguien con historial falla (la cascada a `users` se detiene). Es la protección de "eliminar sin historial" de SPEC 23.

### Helper `can_view_post(p_post_id uuid) returns boolean`

`SECURITY DEFINER STABLE`, `search_path = ''`, nombres calificados, `EXECUTE` solo para `authenticated`. Única implementación de la regla del feed:

- `false` si el post no existe o si su autor (`users.daycare_id`) no es de `current_user_daycare_id()` (que es `null` para quien no está `active`).
- **Admin:** `true`.
- **Staff o relative**, `true` si se cumple alguna:
  - `audience = 'daycare'`;
  - `audience = 'elderly'` y algún `post_elderly.elderly_id` está en `current_user_elderly_ids()`;
  - `audience = 'room'` y `room_id` es la habitación de alguno de `current_user_elderly_ids()`.
- **Solo staff:** además, `true` si es el autor (`author_id = auth.uid()`).

El `type` no interviene. Lo usan las policies de las cinco tablas y las de Storage.

### Triggers

- `posts_set_updated_at` y `comments_set_updated_at`: `before update`, `set_updated_at()`.
- `protect_posts_columns()` (`before update` en `posts`): `author_id` y `audience` no cambian → `raise exception 'author_id and audience cannot be changed'`.
- Constraint triggers `deferrable initially deferred` (se validan al hacer commit):
  - `posts_require_elderly_tag` (`after insert` en `posts`): si `audience = 'elderly'` y no hay filas en `post_elderly` → `raise exception 'elderly post requires at least one tagged elderly'`.
  - `post_elderly_keep_one_tag` (`after delete` en `post_elderly`): si el post todavía existe, es `elderly` y no le quedan etiquetas → misma excepción. Al borrar el post completo, la cascada no falla porque el post ya no existe.

### Policies

Todas `to authenticated`, con los helpers envueltos en `(select ...)`. "Activo" = `current_user_role()` no es `null`.

**`posts`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `posts_select_visible` | select | `can_view_post(id)` |
| `posts_insert_team` | insert | `with check`: `author_id = auth.uid()`, rol `staff` o `admin` y, según `audience`: `elderly` → sin más condiciones (las etiquetas se validan en `post_elderly`); `room` → admin: habitación de su guardería; staff: habitación de alguno de `current_user_elderly_ids()`; `daycare` → solo admin |
| `posts_update_author` | update | `using`: `author_id = auth.uid()` y rol `staff` o `admin`. `with check`: lo mismo y, si `audience = 'room'`, la habitación cumple la regla de insert |
| `posts_delete_author` | delete | `author_id = auth.uid()` y rol `staff` o `admin` |
| `posts_delete_admin` | delete | `is_admin()` y el autor es de su guardería |

**`post_elderly`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `post_elderly_select_visible` | select | `can_view_post(post_id)` |
| `post_elderly_insert_author` | insert | el post es del usuario (`author_id = auth.uid()`, rol `staff` o `admin`) y `audience = 'elderly'`; el adulto mayor está `active` y es de su guardería (admin) o está en `current_user_elderly_ids()` (staff); si el post ya tiene fotos, el adulto mayor tiene `photo_consent = true` |
| `post_elderly_delete_author` | delete | el post es del usuario, rol `staff` o `admin` |
| `post_elderly_delete_admin` | delete | `is_admin()` y el autor del post es de su guardería |

Sin update (se borra y se crea).

**`post_photos`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `post_photos_select_visible` | select | `can_view_post(post_id)` |
| `post_photos_insert_author` | insert | el post es del usuario (rol `staff` o `admin`) y ningún adulto mayor etiquetado en el post tiene `photo_consent = false` |
| `post_photos_delete_author` | delete | el post es del usuario, rol `staff` o `admin` |
| `post_photos_delete_admin` | delete | `is_admin()` y el autor del post es de su guardería |

Sin update.

**`reactions`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `reactions_select_visible` | select | `can_view_post(post_id)` |
| `reactions_insert_own` | insert | `user_id = auth.uid()` y `can_view_post(post_id)` |
| `reactions_update_own` | update | `using` y `with check`: `user_id = auth.uid()` y `can_view_post(post_id)` |
| `reactions_delete_own` | delete | `user_id = auth.uid()` y activo |

**`comments`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `comments_select_visible` | select | `can_view_post(post_id)` |
| `comments_insert_own` | insert | `author_id = auth.uid()` y `can_view_post(post_id)` |
| `comments_update_author` | update | `using` y `with check`: `author_id = auth.uid()` y activo; `post_id` no cambia (`with check` con `can_view_post(post_id)`) |
| `comments_delete_author` | delete | `author_id = auth.uid()` y activo |
| `comments_delete_admin` | delete | `is_admin()` y el autor del post es de su guardería |

**`users`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `users_select_comment_authors` | select | `id in (select author_id from public.comments)` (la subconsulta pasa por la RLS de `comments`, así que solo cuenta los comentarios de posts visibles) |

> `can_view_post()` es `SECURITY DEFINER` y no pasa por la RLS de `users`, así que `users` → `comments` → `can_view_post()` no produce recursión. Las pruebas de select de `users` como relative lo comprueban.

### Storage: bucket `post-photos`

- `insert into storage.buckets (id, name, public) values ('post-photos', 'post-photos', false)`.
- Primera carpeta de la ruta = `post_id`. Las policies validan que tenga formato UUID antes de convertirla (`~ '^[0-9a-f-]{36}$'`), para que una ruta inválida niegue en vez de dar error.

| Policy | Acción | Regla |
| --- | --- | --- |
| `post_photos_objects_select_visible` | select | `bucket_id = 'post-photos'` y `can_view_post(carpeta)` |
| `post_photos_objects_insert_author` | insert | `bucket_id = 'post-photos'` y el post de la carpeta es del usuario (rol `staff` o `admin`) |
| `post_photos_objects_delete_author` | delete | `bucket_id = 'post-photos'` y el post de la carpeta es del usuario |
| `post_photos_objects_delete_admin` | delete | `bucket_id = 'post-photos'`, `is_admin()` y el autor del post es de su guardería |

### Permisos

```sql
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_elderly to authenticated;
grant select, insert, delete on public.post_photos to authenticated;
grant select, insert, update, delete on public.reactions to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
revoke update on public.post_elderly, public.post_photos from authenticated;
revoke all on public.posts, public.post_elderly, public.post_photos, public.reactions, public.comments from anon;
revoke execute on function public.can_view_post(uuid) from public, anon;
grant execute on function public.can_view_post(uuid) to authenticated;
```

### Tipos TS (`shared/database/types.ts`)

`Post`, `PostElderly` y `PostPhoto` ya existen y coinciden. Se agregan:

```ts
export type ReactionType = "love";
export type Reaction = { id: string; post_id: string; user_id: string; type: ReactionType; created_at: string };
export type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string; updated_at: string };
```

### Cambios en documentos

1. **`references/documents/database-schema.md`:**
   - "Helpers implementados": agregar `can_view_post()`.
   - `posts`: FK `on delete restrict` en `author_id`; límites de `title` y `body`; `author_id` y `audience` inmutables (trigger).
   - `post_elderly`: solo se etiqueta a adultos mayores `active`.
   - `post_photos`: `unique (post_id, position)` y `url` empieza con `{post_id}/`.
   - `reactions`: `type` con `check (type = 'love')`; `user_id` `on delete restrict`.
   - `comments`: límite de `body`; `author_id` `on delete restrict`.
   - `users`, RLS: agregar `users_select_comment_authors`.
2. **`specs/20-staff-screens-mock.md`**, "Specs siguientes": "SPEC 22 — Estado del staff (UI)" pasa a "SPEC 23 — Estado del staff", con la nota "(SPEC 22 pasó a ser la base de datos del feed)". También las demás menciones de SPEC 22 en esa spec.
3. **`references/documents/pantallas-pendientes.md`**, punto 8: "archivar y reactivar: SPEC 22" → "SPEC 23".

### Entradas de BACKLOG

- "Selects de `users` que dependen de tablas futuras" → `- [x] **Estado:** resuelto en SPEC 22`.
- "Avisos del linter aceptados tras la spec 10" → sumar `can_view_post()` a (1) y las tablas del feed a (2) si el linter marca `multiple_permissive_policies`, con origen SPEC 22.
- Nueva sección "Feed" con la entrada "Borrar los archivos de Storage al borrar un post o una foto" (lo hace la app; se resuelve en la spec de "Nueva publicación" o de edición de posts).

---

## Estructura de archivos

```
supabase/migrations/<version>_create_feed_tables.sql   # nuevo
shared/database/types.ts                               # + ReactionType, Reaction, Comment
references/documents/database-schema.md                # cambios de "Cambios en documentos"
references/documents/pantallas-pendientes.md           # punto 8
specs/20-staff-screens-mock.md                         # SPEC 22 → SPEC 23
specs/BACKLOG.md                                       # 3 entradas
```

---

## Plan de implementación

1. **Revisión previa.** Con `list_tables`, `list_migrations` y `execute_sql`: confirmar que no existen las cinco tablas, los enums `post_type` y `post_audience`, ni el bucket `post-photos`. Prueba: no aparecen. Si algo existe, detenerse y preguntar.
2. **Migración local.** Escribir `create_feed_tables.sql` (enums, tablas, helper, triggers, policies, Storage y permisos). Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_feed_tables`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: `list_tables` muestra las cinco tablas con RLS activado y el bucket existe con `public = false`.
4. **Pruebas de restricciones.** `execute_sql` en transacciones con `rollback` (ver criterios "Restricciones" y "Triggers").
5. **Pruebas de RLS.** `execute_sql` en transacciones con `rollback`, con `set local role authenticated` y `request.jwt.claims`. Staff y relative (en Casa Nogal y en otra guardería) se crean dentro de la transacción insertando en `auth.users`. Incluye las policies de `storage.objects` (insertando filas directamente; ver Riesgos).
6. **Advisors.** `get_advisors` (security y performance). Corregir lo que no esté aceptado; lo aceptado va al BACKLOG.
7. **Tipos.** Agregar `ReactionType`, `Reaction` y `Comment` en `shared/database/types.ts`. Prueba: `npm run build` y `npm run lint` sin errores.
8. **Documentación.** Aplicar "Cambios en documentos" y "Entradas de BACKLOG".

---

## Criterios de aceptación

**Migración**

- [ ] Existe `supabase/migrations/<version>_create_feed_tables.sql` y su versión coincide con la de `list_migrations`.
- [ ] Las cinco tablas tienen las columnas, FK, `check`, `unique` e índices de "Modelo de datos", y RLS activado.
- [ ] `can_view_post()` es `SECURITY DEFINER STABLE`, con `search_path` vacío y `EXECUTE` solo para `authenticated`.
- [ ] El bucket `post-photos` existe con `public = false`.
- [ ] En el remoto las cinco tablas y el bucket quedan vacíos al terminar.

**Restricciones**

- [ ] Un post `room` sin `room_id`, o uno `elderly`/`daycare` con `room_id`, falla.
- [ ] `title` de 121 caracteres, `body` vacío o de solo espacios, `body` de 2001 caracteres y un comentario de 1001 caracteres fallan.
- [ ] Una reacción con `type = 'like'` falla; una segunda reacción del mismo usuario en el mismo post falla.
- [ ] Dos fotos con el mismo `position` en un post fallan; una foto con `url` de otra carpeta falla.
- [ ] Borrar (como `postgres`) en `auth.users` a un usuario con un post, un comentario o una reacción falla; sin historial, funciona.
- [ ] Borrar un post borra sus filas en `post_elderly`, `post_photos`, `reactions` y `comments`.

**Triggers**

- [ ] Crear un post `elderly` sin etiquetas falla al hacer commit; con una etiqueta en la misma transacción, funciona.
- [ ] Borrar todas las etiquetas de un post `elderly` existente falla; borrar el post completo funciona.
- [ ] Cambiar `author_id` o `audience` de un post falla; `updated_at` cambia al editar un post o un comentario.

**RLS como admin**

- [ ] Ve todos los posts de su guardería (las tres audiencias) y ninguno de otra.
- [ ] Puede publicar con `audience = daycare` y `room` (cualquier habitación de su guardería); con una habitación de otra guardería falla.
- [ ] Puede etiquetar a cualquier adulto mayor `active` de su guardería; a uno `archived` o de otra guardería falla.
- [ ] Puede borrar posts, fotos y comentarios de otros autores de su guardería; sobre otra guardería no afecta filas.

**RLS como staff**

- [ ] Ve un post del admin que etiqueta a uno de sus asignados junto con otros (prueba 14 del esquema), los `daycare`, los `room` de la habitación de sus asignados y los suyos; no ve un `elderly` sin asignados suyos ni un `room` de otra habitación.
- [ ] Publicar con `audience = daycare` falla; para una habitación sin asignados suyos falla.
- [ ] Etiquetar a un adulto mayor no asignado falla.
- [ ] Subir una foto (`post_photos` y `storage.objects`) a un post que etiqueta a un adulto mayor con `photo_consent = false` falla; etiquetar a ese adulto mayor en un post con fotos falla.
- [ ] Editar o borrar el post de otro autor no afecta filas.

**RLS como relative**

- [ ] Ve los posts `elderly` que etiquetan a su adulto mayor, los `room` de su habitación y los `daycare`; no ve uno de otra habitación ni uno que no etiqueta a su adulto mayor.
- [ ] Sigue viendo, con el nombre del autor, los posts de un staff `archived` sobre su adulto mayor.
- [ ] Insertar en `posts`, `post_elderly` o `post_photos` falla.
- [ ] Comentar o reaccionar con el `user_id`/`author_id` de otra persona falla; en un post que no puede ver, falla.
- [ ] Ve en `users` al familiar que comentó un post visible, y no a uno que solo comentó posts que no ve.
- [ ] Puede editar y borrar solo sus comentarios y su reacción.

**RLS con otros estados**

- [ ] Staff o relative `pending` o `archived`: `select` en las cinco tablas no devuelve filas y cualquier escritura falla o no afecta filas.
- [ ] Como `anon`: `select` en las cinco tablas y en `storage.objects` del bucket no devuelve filas.
- [ ] Una ruta de Storage cuya primera carpeta no es un UUID se niega sin error.

**Cierre**

- [ ] `get_advisors` sin avisos nuevos fuera de los aceptados en el BACKLOG.
- [ ] `npm run build` y `npm run lint` sin errores; las pantallas no cambian.
- [ ] `database-schema.md`, `pantallas-pendientes.md`, SPEC 20 y `BACKLOG.md` actualizados según "Cambios en documentos" y "Entradas de BACKLOG".

---

## Decisiones

- **Sí:** separar la DB del feed del estado del staff. Decisión del usuario; SPEC 22 pasa a ser esta spec y el estado del staff, SPEC 23.
- **Sí:** incluir `post_photos` y el bucket. Decisión del usuario; la regla del feed se escribe una vez y también la usa Storage.
- **Sí:** `on delete restrict` en `posts.author_id`, `comments.author_id` y `reactions.user_id`. Decisión del usuario; protege "eliminar sin historial" en la propia DB.
- **No:** `cascade` en `reactions.user_id`. Opción descartada: una reacción también cuenta como historial.
- **Sí:** constraint triggers diferidos para "al menos un etiquetado". Decisión del usuario; permiten insertar post y etiquetas en la misma transacción.
- **No:** RPC `create_post()` en esta spec. Va en la spec de "Nueva publicación".
- **Sí:** `can_view_post(post_id) boolean`. Decisión del usuario; cumple la regla 7 (solo `true/false`).
- **No:** `current_user_visible_post_ids()`. Calcularía el conjunto completo de posts en cada consulta.
- **Sí:** `check (type = 'love')` en `reactions`. Decisión del usuario; el mockup solo tiene corazón y el esquema dice `text`.
- **Sí:** límites de largo en `title`, `body` y comentarios. Decisión del usuario, como `add_elderly_length_limits`.
- **Sí:** solo se etiquetan adultos mayores `active`. Decisión del usuario; los posts viejos de un archivado se conservan.
- **Sí:** solo tipos en la app. Decisión del usuario; el feed y "Nueva publicación" siguen con mock.
- **Sí:** resolver aquí `users_select_comment_authors`. La entrada del BACKLOG la asignaba a la spec de `comments`.
- **Sí:** la guardería del post sale del autor (`users.daycare_id`), sin columna `daycare_id` en `posts`. Es lo que dice el esquema.
- **Sí:** `elderly_id` y `room_id` con `on delete restrict`. Los adultos mayores solo se archivan y una habitación con historial no debe borrarse.
- **Sí:** `unique (post_id, position)` y `url` dentro de `{post_id}/`. Evitan órdenes ambiguos y rutas que no pasan las policies de Storage.
- **No:** límites de tamaño o tipo de archivo en el bucket. Van en la spec de subida de fotos.
- **Sí:** el esquema se actualiza en el paso 8, no al redactar la spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración se aplica directo al remoto | Se pide permiso antes; las tablas y el bucket son nuevos y vacíos. |
| Una policy mal escrita muestra posts de otro adulto mayor o de otra guardería | `can_view_post()` es la única implementación; criterios por rol, por audiencia y con otra guardería. |
| Recursión entre `users` y `comments` | `can_view_post()` es `SECURITY DEFINER`; la prueba de select de `users` como relative la detecta. |
| `can_view_post()` por fila es lento con muchos posts | Índices en `post_elderly(elderly_id)`, `posts(room_id)`, `posts(author_id)`; revisar con `EXPLAIN` cuando el feed se conecte. |
| No se pueden probar las policies de Storage con SQL directo (Supabase puede bloquear escrituras directas en `storage.objects`) | Si pasa, detenerse y preguntar; alternativa: probar con la API de Storage y la sesión de cada rol. |
| Un relative cambia `photo_consent` a `false` después de que el post ya tiene fotos | Aceptado: las fotos ya subidas se conservan; las nuevas se bloquean. |
| Los constraint triggers diferidos sorprenden a la app (el error llega al commit) | Documentado; la RPC de "Nueva publicación" hará el insert en una sola transacción. |

---

## Lo que **no** entra en esta spec

- Cambios en las pantallas del feed, "Nueva publicación" y del familiar.
- RPC para crear posts y subida o borrado de archivos de Storage.
- Límites del bucket.
- `daily_summaries`.
- Estado del staff (SPEC 23).
- Datos de prueba persistentes.

Cada una de esas, si llega, va en su propia spec.
