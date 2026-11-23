# SPEC 36 — Editar una publicación

> **Estado:** Borrador
> **Depende de:** SPEC 22, SPEC 25, SPEC 33, SPEC 35
> **Fecha:** 2026-11-23
> **Objetivo:** Que el admin edite cualquier publicación de su guardería y el staff las suyas sin historial, desde "Editar" en la tarjeta del feed, cambiando audiencia, tipo, textos y fotos en una sola operación.

---

## Por qué esta spec

El enlace "Editar" de la tarjeta del feed (`feed/components/PostCard.tsx`) lleva a `/` desde SPEC 25. El mockup `feed.dc.html` lo enlaza a `crear-publicacion.dc.html`: la edición usa el mismo formulario que el alta.

Decisiones del usuario que **cambian los documentos de referencia y la DB**:

- El admin edita cualquier publicación de su guardería. Hoy `flujos-de-procesos.md` dice "Solo el autor puede editar" y solo existe `posts_update_author`.
- El staff solo edita sus publicaciones sin historial: ni reacciones ni comentarios de otras personas (`post_has_history`, SPEC 35).
- **La audiencia se puede cambiar** (adultos mayores, habitación o toda la guardería). Hoy el trigger `protect_posts_columns` lo impide. El autor sigue siendo inmutable.
- Se pueden agregar y quitar fotos. Una foto quitada se borra de `post_photos` **y del bucket**.

Segunda mitad de la feature "editar y eliminar" (SPEC 35 hizo eliminar). Resuelve el punto 16 de `pantallas-pendientes.md`, la parte "quitar una foto" del punto 17 y lo que queda de la entrada del BACKLOG "Borrar los archivos de Storage al borrar un post o una foto".

---

## Alcance

**Dentro:**

- **Enlace "Editar" de la tarjeta del feed `/`:**
  - Pasa de `<Link href="/">` a `<button type="button">` que abre el modal. Mantiene ubicación y estilo (mockup).
  - Lo ve el admin en todas las publicaciones. Lo ve el staff solo en las suyas sin historial.
  - No se edita desde el detalle `/posts/[id]` ni desde el feed familiar.
- **Modal "Editar publicación":**
  - Mismo formulario, layout, validaciones y mensajes que "Nueva publicación" (`crear-publicacion.dc.html`, SPEC 06 y SPEC 25). Título "Editar publicación"; botones "Cancelar" y "Guardar".
  - Al abrir, carga los datos de la publicación (Server Action `getPostForEdit`) con el mismo skeleton del alta. Si falla, toast de error y el modal se cierra.
  - Campos precargados: audiencia, adultos mayores etiquetados, habitación, tipo, título, descripción y fotos.
  - "Guardar" está deshabilitado mientras no haya cambios. Si se deshacen, vuelve a deshabilitarse. Mientras guarda dice "Guardando…" y Esc o "Cancelar" no cierran el modal.
- **"¿Para quién?" editable por completo**, con las opciones de quien edita (las mismas de "Nueva publicación"):
  - Puede pasar entre adultos mayores, "Toda la habitación" y "Toda la guardería" (esta última solo el admin).
  - Al pasar a adultos mayores, el título se guarda como `null`. Al salir de adultos mayores, se borran todas sus etiquetas.
  - **Etiqueta fuera de las opciones** (archivado, o ya no asignado al staff): aparece marcada y se puede quitar. Una vez quitada, desaparece de la lista y no se puede volver a agregar.
  - **Habitación fuera de las opciones** (el staff ya no tiene asignados en ella): aparece en el select mientras siga elegida. Si elige otra, desaparece y no puede volver.
  - Etiquetas que el usuario no puede leer (la RLS de `elderly` no se las muestra) no aparecen y se conservan, salvo que cambie la audiencia.
- **Fotos:**
  - Las actuales se muestran como miniaturas (URL firmada) con el botón "Quitar foto N", igual que las nuevas. Las nuevas van después de las actuales.
  - Máximo `MAX_PHOTOS` (5) en total. Las nuevas pasan por la misma selección y compresión del alta.
  - Reordenar fotos queda fuera.
- **Consentimiento de fotos:** mismas reglas que al crear, con el estado final (audiencia, etiquetas y fotos que quedarán). Con fotos y algún etiquetado sin consentimiento no se puede guardar. En `room` o `daycare`, el aviso genérico no bloquea.
- **Guardado** (`feed/save-post-edit.ts`, en el cliente):
  1. Comprime las fotos nuevas. Si alguna falla, no se guarda nada y se indica cuál.
  2. Sube las nuevas a `{postId}/{position}.webp`, con `position` desde `max(position) + 1` de las fotos que tenía el post al abrir (así nunca pisa un archivo que todavía existe).
  3. Server Action `updatePost(postId, rawInput)`: valida igual que `createPost` y llama a la RPC `update_post`, que en **una transacción** guarda tipo, título, descripción, audiencia, habitación, etiquetas, las filas de las fotos nuevas y el borrado de las filas quitadas.
  4. Si el paso 3 falla, borra los archivos recién subidos y no cambia nada.
  5. Si sale bien, `updatePost` borra del bucket los archivos de las fotos quitadas y hace `refresh()`.
- **Resultados:**
  - Éxito: se cierra el modal, el feed se actualiza y aparece el toast "Cambios guardados".
  - `invalid`: errores por campo, como el alta.
  - `has-history` (staff, alguien reaccionó o comentó mientras editaba): se cierra el modal, toast "No se puede editar" y `refresh()` (el enlace desaparece).
  - `error`: el modal sigue abierto con lo escrito y aparece el toast de error.
- **DB** (migración nueva): RPC `update_post`, `posts_with_history`, trigger `protect_posts_columns` y policies (ver Modelo de datos).
- **Documentación:** `database-schema.md`, `flujos-de-procesos.md`, `BACKLOG.md` y `pantallas-pendientes.md`.

**Fuera de alcance (para specs futuras):**

- Editar desde el detalle `/posts/[id]`.
- Marca "editado" en la publicación.
- Reordenar fotos.
- Avisar a los familiares de una publicación editada, o al autor cuando el admin edita la suya.
- Historial de versiones de una publicación.
- Editar comentarios (entrada propia del BACKLOG).

---

## Modelo de datos

### Base de datos (migración nueva)

**RPC `update_post`**, `SECURITY INVOKER`, `volatile`, `set search_path = ''`:

```sql
create function public.update_post(
  p_post_id uuid,
  p_audience public.post_audience,
  p_room_id uuid,
  p_type public.post_type,
  p_title text,
  p_body text,
  p_add_elderly_ids uuid[],
  p_remove_elderly_ids uuid[],
  p_new_photos jsonb,        -- [{ "url": "{postId}/5.webp", "width": 1280, "height": 960, "position": 5 }]
  p_removed_photo_ids uuid[]
) returns void
```

Orden dentro de la transacción (para que las policies de consentimiento vean el estado correcto):

1. Borra las filas de `post_photos` de `p_removed_photo_ids` (solo de ese post).
2. Si `p_audience <> 'elderly'`, borra todas las filas de `post_elderly` del post. Si no, borra las de `p_remove_elderly_ids`.
3. `update posts` (audiencia, habitación, tipo, título, descripción). Si actualiza 0 filas (RLS: sin permiso o con historial) → `raise exception 'post not editable'`.
4. Inserta en `post_elderly` las de `p_add_elderly_ids`.
5. Inserta en `post_photos` las de `p_new_photos`.

La regla "un post `elderly` tiene al menos un etiquetado" sigue en los constraint triggers diferidos. `posts_require_elderly_tag` pasa a dispararse también en `update of audience` (hoy solo cubre el alta). `post_elderly_keep_one_tag` ya acepta quitar todas si al commit el post dejó de ser `elderly`: se verifica en las pruebas.

**`posts_with_history(p_post_ids uuid[]) returns setof uuid`**: los ids de la lista con `post_has_history = true`. `SECURITY DEFINER STABLE`; reusa `post_has_history` (no duplica la regla). La usa el feed para calcular `canEdit` del staff en una sola llamada por página.

**Trigger `protect_posts_columns`** (`before update`):

- `author_id` sigue inmutable. `audience` deja de serlo.
- Si `room_id` cambia y `new.audience = 'room'`, exige `can_post_to_room(new.room_id)`. Así se conserva la habitación actual del staff aunque ya no tenga asignados en ella.

**Policies** (`drop` + `create` con el mismo nombre, o nuevas):

| Policy | Acción | Regla |
| --- | --- | --- |
| `posts_update_author` (reemplaza) | update | `using`: autor, rol `staff` o `admin` y `not post_has_history(id)`. `with check`: autor y `audience <> 'daycare' or is_admin()`. La habitación la valida el trigger. |
| `posts_update_admin` (nueva) | update | `using` y `with check`: `is_admin()` y `can_view_post(id)` (como las de borrado del admin), y `audience <> 'daycare' or is_admin()` |
| `post_elderly_insert_author` (reemplaza) | insert | la regla actual y `not post_has_history(post_id)` |
| `post_elderly_insert_admin` (nueva) | insert | `is_admin()`, `can_view_post(post_id)`, `audience = 'elderly'`, adulto mayor `active` de su guardería y, si el post ya tiene fotos, `photo_consent = true` |
| `post_elderly_delete_author` (reemplaza) | delete | la regla actual y `not post_has_history(post_id)` |
| `post_photos_insert_author` (reemplaza) | insert | la regla actual y `not post_has_history(post_id)` |
| `post_photos_insert_admin` (nueva) | insert | `is_admin()`, `can_view_post(post_id)` y ningún etiquetado sin consentimiento |
| `post_photos_delete_author` (reemplaza) | delete | la regla actual y `not post_has_history(post_id)` |
| `post_photos_objects_insert_author` (reemplaza) | insert | la regla actual y `not post_has_history(p.id)` |
| `post_photos_objects_insert_admin` (nueva) | insert | `bucket_id = 'post-photos'`, `is_admin()` y `can_view_post(post_id_from_path(name))` |

Las de `delete` del admin y la de Storage `delete` del autor (SPEC 35) no cambian. Grants de `update_post` y `posts_with_history`: `revoke ... from public, anon`, `grant ... to authenticated`.

### Tipos de la app

```ts
// feed/types.ts
// FeedPost suma:
//   canEdit: boolean; // admin, o staff autor sin historial

export type EditablePhoto = FeedPhoto & { id: string }; // post_photos.id

export type PostForEdit = {
  id: string;
  input: NewPostInput;                  // valores actuales (photoCount = fotos actuales)
  photos: EditablePhoto[];              // ordenadas por position
  nextPhotoPosition: number;            // max(position) + 1, o 0
  extraElderly: AudienceElderlyOption[]; // etiquetados fuera de las opciones
  extraRoom: RoomOption | null;          // habitación actual fuera de las opciones
};

export type EditPostInput = NewPostInput & {
  removedPhotoIds: string[];
  newPhotos: AttachPhotoInput[]; // ya subidas
};

export type GetPostForEditResult =
  | { status: "ok"; post: PostForEdit; options: NewPostOptions }
  | { status: "has-history" }
  | { status: "error" };

export type UpdatePostResult =
  | { status: "ok" }
  | { status: "invalid"; errors: NewPostErrors }
  | { status: "has-history" }
  | { status: "error" };
```

`AttachPhotoInput` (SPEC 25) suma `position: number`.

`updatePost` valida con `validateNewPost`, con reglas = opciones de quien edita + `extraElderly` y `extraRoom` (solo si siguen elegidos; no se pueden volver a agregar). `photoCount` = fotos actuales − quitadas + nuevas.

### Mensajes

Se suman a `feed/new-post-messages.ts`, o a `feed/edit-post-messages.ts` si el alta no los comparte.

| Uso | Texto |
| --- | --- |
| Título del modal | Editar publicación |
| Botones del modal | Cancelar / Guardar (Guardando… mientras guarda) |
| Toast de éxito | Cambios guardados · La publicación se actualizó. |
| Con historial | No se puede editar · Ya tiene reacciones o comentarios de otras personas. |
| Error al guardar | No pudimos guardar los cambios · Inténtalo de nuevo. |
| Error al abrir | No pudimos abrir la publicación · Inténtalo de nuevo. |

---

## Estructura de archivos

```
supabase/migrations/
  <versión del remoto>_edit_post.sql        # nuevo
shared/database/types.ts                    # update_post, posts_with_history
feed/
  types.ts                                  # canEdit, PostForEdit, EditPostInput, resultados
  edit-post-messages.ts                     # nuevo (si no se comparte con new-post-messages)
  actions/get-post-for-edit.ts              # nuevo
  actions/update-post.ts                    # nuevo: valida, RPC, borra archivos quitados
  actions/remove-uploaded-photos.ts         # nuevo: deshace las subidas si falla la RPC
  upload-post-photos.ts                     # extraído de publish-post.ts (compresión y subida con position)
  publish-post.ts                           # usa upload-post-photos
  save-post-edit.ts                         # nuevo: comprime, sube, updatePost, deshace
  detect-post-changes.ts                    # nuevo: habilita "Guardar"
  fetch-feed-page.ts / build-feed.ts        # canEdit (posts_with_history)
  components/
    PostFormDialog.tsx                      # nuevo: <dialog>, toasts y bloqueo de Esc, compartido por alta y edición
    NewPostDialogProvider.tsx               # usa PostFormDialog
    EditPostDialogProvider.tsx              # nuevo: open(postId), carga y guarda
    NewPostForm.tsx                         # valores iniciales, fotos actuales, etiquetas/habitación extra, título y botón
    AudiencePicker.tsx                      # chips y habitación extra
    PhotoPicker.tsx                         # miniaturas de fotos actuales (URL firmada)
    PostCard.tsx                            # "Editar" como botón, solo si canEdit
    FeedContent.tsx / FeedView.tsx          # monta EditPostDialogProvider
references/documents/database-schema.md
references/documents/flujos-de-procesos.md
references/documents/pantallas-pendientes.md
specs/BACKLOG.md
```

---

## Plan de implementación

1. **Migración.** Cargar los skills `supabase` y `supabase-postgres-best-practices`. Escribir `update_post`, `posts_with_history`, el cambio de `protect_posts_columns` y de `posts_require_elderly_tag`, y las policies de la tabla. **Pedir permiso antes de aplicarla.** Nombrar el archivo con la versión que devuelve `list_migrations`. Actualizar `shared/database/types.ts`. Probar con `execute_sql` en transacciones con `rollback` (casos en Criterios). Revisar `get_advisors`.
2. **`canEdit` en el feed.** `posts_with_history` para los posts propios del staff de cada página; admin → `true`. "Editar" solo si `canEdit` (sigue enlazando a `/` hasta el paso 6).
3. **Subida reusable.** Extraer de `publish-post.ts` la compresión y la subida a `upload-post-photos.ts`, con `position` inicial configurable. Sin cambio de comportamiento: publicar con fotos sigue igual.
4. **Diálogo compartido.** Extraer `PostFormDialog` de `NewPostDialogProvider` (`<dialog>`, skeleton, toasts, bloqueo de Esc mientras guarda). Sin cambio de comportamiento en "Nueva publicación".
5. **Server Actions.** `getPostForEdit`, `updatePost` y `removeUploadedPhotos`, con el cliente de sesión. Consultar Context7 (`/supabase/supabase-js`) para `rpc` con `jsonb` y `storage.remove`.
6. **Formulario en modo edición.** Cargar el skill `frontend-design:frontend-design`. `NewPostForm`, `AudiencePicker` y `PhotoPicker` aceptan valores iniciales, fotos actuales y opciones extra. `detect-post-changes.ts` habilita "Guardar". `EditPostDialogProvider` y `save-post-edit.ts`. "Editar" abre el modal.
7. **Documentación.**
   - `database-schema.md`: la audiencia se puede cambiar (quitar "La audiencia no se puede cambiar"); `update_post` y `posts_with_history` en funciones; policies nuevas y reemplazadas; trigger `protect_posts_columns`; casos de prueba.
   - `flujos-de-procesos.md`, "Editar publicación": "El admin (cualquier post de su guardería) o el autor staff sin historial. Se puede cambiar la audiencia, el tipo, los textos y las fotos, en una sola operación (`update_post`). Las fotos quitadas se borran también del bucket."
   - `pantallas-pendientes.md`: punto 16 resuelto (con la audiencia editable por decisión del usuario); en el 17, "quitar una foto" resuelto en SPEC 36.
   - `BACKLOG.md`: "Borrar los archivos de Storage al borrar un post o una foto" → `- [x] **Estado:** resuelto en SPEC 36`.

---

## Criterios de aceptación

**Base de datos**

- [ ] Como staff autor sin historial, `update_post` cambia tipo, textos, audiencia y fotos; con historial falla y no cambia nada.
- [ ] Como admin, `update_post` sobre el post de un staff de su guardería funciona, incluso con historial; de otra guardería falla.
- [ ] Un staff no puede editar el post de otro staff.
- [ ] `author_id` no cambia con un `update` directo; `audience` sí.
- [ ] Un staff no puede pasar un post a `daycare`.
- [ ] Un staff conserva la habitación actual de un post `room` aunque ya no tenga asignados en ella, y no puede cambiarla a una habitación sin asignados.
- [ ] Pasar de `elderly` a `room` borra todas las etiquetas; de `room` a `elderly` sin etiquetas falla; quitar todas las etiquetas sin cambiar la audiencia falla.
- [ ] Agregar fotos con un etiquetado sin consentimiento falla; agregar un etiquetado sin consentimiento a un post con fotos falla; quitar las fotos y agregar ese etiquetado en la misma llamada funciona.
- [ ] Si falla cualquier parte de `update_post`, no cambia nada (post, etiquetas ni fotos).
- [ ] Como staff, subir o borrar archivos de un post propio con historial falla; como admin, subir a un post de su guardería funciona.
- [ ] `posts_with_history` devuelve solo los ids con historial.
- [ ] Crear una publicación con fotos (SPEC 25) y eliminarla (SPEC 35) siguen funcionando.
- [ ] El archivo de la migración tiene el mismo nombre que su registro en el remoto y `shared/database/types.ts` incluye las funciones nuevas.

**UI**

- [ ] El admin ve "Editar" en todas las tarjetas del feed. El staff lo ve solo en las suyas sin historial.
- [ ] "Editar" abre el modal "Editar publicación" con los valores y las fotos actuales.
- [ ] "Guardar" está deshabilitado sin cambios y vuelve a deshabilitarse al deshacerlos.
- [ ] Se puede cambiar la audiencia entre adultos mayores, habitación y (solo admin) toda la guardería, y el feed muestra el nuevo "Para:" tras guardar.
- [ ] Un etiquetado archivado aparece marcado, se puede quitar y, una vez quitado, no se puede volver a marcar.
- [ ] Quitar una foto y guardar borra su fila de `post_photos` y su archivo del bucket.
- [ ] Agregar fotos respeta el máximo de 5 en total y la compresión del alta; la foto nueva aparece al final del carrusel.
- [ ] Las reglas de consentimiento del alta se aplican al estado final.
- [ ] Mientras guarda, el modal no se cierra con Esc ni con "Cancelar".
- [ ] Tras guardar, se cierra el modal, el feed se actualiza sin recargar y aparece "Cambios guardados".
- [ ] Si `update_post` falla después de subir fotos nuevas, sus archivos se borran del bucket y el modal conserva lo escrito.
- [ ] Si alguien comenta mientras el staff edita, al guardar aparece "No se puede editar", no cambia nada y "Editar" desaparece.
- [ ] Llamar a `updatePost` como relative, con un id inválido o sobre un post ajeno (staff) devuelve `error`.
- [ ] "Nueva publicación" funciona igual que antes (abrir, validar, publicar con y sin fotos, deshacer si falla).
- [ ] El modal no se desborda a 375 px de ancho.
- [ ] `npm run lint` y `npm run build` pasan sin errores.

---

## Decisiones

- **Sí:** el admin edita cualquier publicación de su guardería, con o sin historial. Decisión del usuario; cambia `flujos-de-procesos.md`.
- **Sí:** el staff solo edita las suyas sin historial, validado en la DB con `post_has_history` (SPEC 35).
- **Sí:** la audiencia se puede cambiar por completo. Decisión del usuario; cambia el trigger `protect_posts_columns` y `database-schema.md`. El autor sigue inmutable.
- **Sí:** validar el cambio de habitación en el trigger y no en el `with check`. El `with check` no ve la fila anterior, y la habitación actual del staff se conserva aunque ya no tenga asignados.
- **Sí:** etiquetas y habitación fuera de las opciones se pueden quitar, pero no volver a elegir. Decisión del usuario.
- **Sí:** subir primero las fotos nuevas y después una sola RPC que guarda todo; si falla, se borran las subidas. Lo que cuesta deshacer (la DB) queda atómico.
- **Sí:** borrar del bucket los archivos de las fotos quitadas, después de la RPC. Decisión del usuario: no basta con borrar la fila.
- **No:** guardar por pasos sin RPC. Una falla dejaría la publicación a medias.
- **Sí:** posiciones nuevas desde `max(position) + 1`. Nunca pisa un archivo que todavía no se borró.
- **Sí:** "Guardar" solo con cambios, como SPEC 33.
- **No:** línea "Cambiará: …" (SPEC 33). No se pidió.
- **No:** marca "editado". El mockup no la muestra.
- **Sí:** editar solo desde el feed. Decisión del usuario; eliminar es desde el detalle (SPEC 35).
- **Sí:** cargar los datos al abrir el modal (`getPostForEdit`). `FeedPost` es un modelo de vista y no trae lo que necesita el formulario.
- **Sí:** reusar `NewPostForm` y extraer `PostFormDialog` y `upload-post-photos.ts`. Evita duplicar el alta.
- **Sí:** ocultar "Editar" al staff con historial, en vez de mostrarlo deshabilitado.
- **No:** reordenar fotos.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Cambiar la audiencia hace que familiares dejen de ver una publicación que ya vieron (o la vean otros). | Comportamiento esperado por decisión del usuario. La visibilidad sigue en `can_view_post`, en un solo lugar. |
| Alguien comenta entre la subida y la RPC (staff): la RPC falla y el staff ya no puede borrar los archivos subidos. | Quedan archivos huérfanos en `{postId}/`, sin fila. Se registra con `console.error`. Se borran si el admin elimina el post (SPEC 35 borra toda la carpeta). |
| Falla el borrado del bucket de las fotos quitadas después de la RPC. | La edición cuenta como exitosa (la DB ya es coherente). Se registra con `console.error`; el archivo queda huérfano y se borra al eliminar el post. |
| `post_elderly_keep_one_tag` o `posts_require_elderly_tag` no se comportan como se espera al cambiar la audiencia. | Casos explícitos en Criterios, probados en el paso 1 antes de tocar la UI. |
| Reusar `NewPostForm` rompe "Nueva publicación". | Pasos 3 y 4 sin cambio de comportamiento, con prueba manual del alta. |
| `posts_with_history` agrega una consulta por página del feed. | Una sola llamada con los ids propios del staff de la página; el admin no la hace. |

---

## Entradas de BACKLOG

- "Borrar los archivos de Storage al borrar un post o una foto": queda resuelta (SPEC 35 hizo la parte del post y esta spec la de quitar una foto).

---

## Lo que **no** está en esta spec

- Editar desde el detalle.
- Marca "editado".
- Reordenar fotos.
- Avisos por publicaciones editadas.
- Historial de versiones.

Cada uno, si llega, va en su propia spec.
