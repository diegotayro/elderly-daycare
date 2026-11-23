# SPEC 35 — Eliminar una publicación

> **Estado:** Implementado
> **Depende de:** SPEC 22, SPEC 25, SPEC 29, SPEC 34
> **Fecha:** 2026-11-23
> **Objetivo:** Que el admin elimine cualquier publicación de su guardería y el staff las suyas sin historial, desde el detalle `/posts/[id]`, borrando también sus fotos del bucket.

---

## Por qué esta spec

La RLS de SPEC 22 ya permite borrar un post (`posts_delete_author`, `posts_delete_admin`) y sus archivos (`post_photos_objects_delete_*`), pero no hay UI. Además, el usuario definió una regla nueva: **el staff solo puede eliminar (y editar, SPEC 36) una publicación suya si no tiene historial**, es decir, si ninguna otra persona reaccionó o comentó. Hoy el autor puede borrar siempre. El admin puede eliminar cualquier publicación de su guardería, tenga o no historial.

La feature "editar y eliminar" se dividió en dos specs: esta (eliminar, más chica) deja lista la función de historial que reusa SPEC 36 (editar).

Resuelve en parte la entrada del BACKLOG "Borrar los archivos de Storage al borrar un post o una foto" (la parte del post; quitar una foto queda para SPEC 36) y en parte el punto 17 de `pantallas-pendientes.md` (confirmación al eliminar un post).

---

## Alcance

**Dentro:**

- **Función `post_has_history(p_post_id)`** (migración nueva): `true` si el post tiene alguna reacción o algún comentario de un usuario distinto de su autor.
- **Policies endurecidas** (migración nueva):
  - `posts_delete_author`: además exige `not post_has_history(id)`.
  - `post_photos_objects_delete_author`: además exige `not post_has_history(p.id)`, para que el staff no pueda borrar los archivos de un post que luego no podrá borrar.
  - `posts_delete_admin` y `post_photos_objects_delete_admin` no cambian: el admin borra con o sin historial.
- **Botón "Eliminar" en el detalle `/posts/[id]`** (sin mockup):
  - Va en la misma línea que "Volver al feed", alineado a la derecha.
  - Mismo estilo de texto que "Editar" de la tarjeta del feed (`text-sm font-extrabold text-coral-link`), con área táctil mínima de 44 px y foco visible.
  - Lo ve el admin en cualquier publicación de su guardería.
  - Lo ve el staff solo en sus publicaciones sin historial.
  - No aparece en el detalle del familiar (`/family/posts/[id]`).
- **Confirmación** con `shared/components/ConfirmDialog.tsx` (SPEC 34). Mientras elimina, Esc y "Cancelar" no cierran el modal.
- **Server Action `deletePost(postId)`** con el cliente de sesión:
  1. Usuario `staff` o `admin` activo; `postId` con formato UUID.
  2. Lee el post. Si no existe o no lo ve → `error`.
  3. Staff: debe ser el autor y `post_has_history` debe ser `false`. Si tiene historial → `has-history`.
  4. Borra los archivos de `{postId}/` del bucket `post-photos` y después el post (las filas de `post_elderly`, `post_photos`, `reactions` y `comments` se van en cascada).
  5. Éxito: `redirect("/?notice=post-deleted")`.
- **Borrado reusable:** la lógica "borrar archivos de `{postId}/` y después el post" de `feed/actions/discard-post.ts` pasa a `feed/remove-post-with-photos.ts`, y la usan `discardPost` y `deletePost`.
- **Toast en el feed tras redirigir:** `staff/components/StaffListNoticeToast.tsx` se generaliza a `shared/components/toast/UrlNoticeToast.tsx` (recibe el mensaje y la ruta a la que limpia la URL). Lo usan `/staff` y `/`.
- **Resultados en el detalle:**
  - `has-history`: se cierra el modal, aparece el toast de "no se puede eliminar" y `refresh()` (el botón desaparece).
  - `error`: el modal sigue abierto y aparece el toast de error.
- **Documentación:** `database-schema.md`, `flujos-de-procesos.md`, `BACKLOG.md` y `pantallas-pendientes.md`.

**Fuera de alcance (para specs futuras):**

- Editar una publicación, quitar o agregar fotos y cambiar la audiencia (SPEC 36).
- Policies de `post_photos` y `post_elderly` con la regla de historial (las endurece SPEC 36, que es quien las usa).
- "Eliminar" desde la tarjeta del feed.
- Avisar al autor cuando el admin elimina su publicación.
- Papelera o borrado lógico de publicaciones.

---

## Modelo de datos

### Base de datos (migración nueva)

```sql
-- true si alguien distinto del autor reaccionó o comentó el post
create function public.post_has_history(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
-- exists en reactions (user_id <> author_id) o en comments (author_id <> posts.author_id)
```

- `SECURITY DEFINER STABLE`, `set search_path = ''`, nombres calificados. En las policies se llama envuelta en `(select ...)`.
- `revoke execute ... from public, anon`; `grant execute ... to authenticated`.
- `false` si el post no existe.
- Índices: ya existen `reactions_post_id_user_id_key` (único, empieza por `post_id`) y `comments_post_id_idx`. No hacen falta índices nuevos.

Policies reemplazadas (`drop policy` + `create policy`, mismos nombres):

| Policy | Acción | Regla nueva |
| --- | --- | --- |
| `posts_delete_author` | delete | `author_id = auth.uid()`, rol `staff` o `admin` y `not post_has_history(id)` |
| `post_photos_objects_delete_author` | delete | `bucket_id = 'post-photos'`, el post de la carpeta es del usuario y `not post_has_history(p.id)` |

`discardPost` (deshacer una publicación fallida de SPEC 25) no se ve afectado: un post recién creado no tiene historial.

### Tipos de la app

```ts
// feed/types.ts
export type DeletePostResult = { status: "error" } | { status: "has-history" };
// En éxito, deletePost hace redirect y no devuelve nada.

// FeedPost suma:
//   canDelete: boolean; // admin, o staff autor sin historial
```

`canDelete` solo se calcula en el detalle del equipo (`getTeamPostDetail`): admin → `true`; staff → `publishedByMe && !post_has_history`. Una sola llamada `rpc("post_has_history")`, solo si el usuario es staff y es el autor. En el feed queda `false` (no se usa).

```ts
// shared/components/toast/UrlNoticeToast.tsx
type UrlNoticeToastProps = {
  message: ToastMessage | null; // null: no hay aviso
  clearHref: string; // "/staff" | "/"
};
```

Avisos del feed: `feed/read-feed-notice.ts` (como `staff/read-staff-list-notice.ts`), con `FeedNotice = "post-deleted"`.

### Mensajes

Viven en `feed/delete-post-messages.ts`.

| Uso | Texto |
| --- | --- |
| Botón del detalle | Eliminar |
| Título del modal | ¿Eliminar esta publicación? |
| Descripción del modal | También se borrarán sus fotos, reacciones y comentarios. Esta acción no se puede deshacer. |
| Botones del modal | Cancelar / Eliminar (Eliminando… mientras borra) |
| Toast en el feed | Publicación eliminada · Ya no aparece en el feed. |
| Con historial | No se puede eliminar · Ya tiene reacciones o comentarios de otras personas. |
| Error | No pudimos eliminar la publicación · Inténtalo de nuevo. |

---

## Estructura de archivos

```
supabase/migrations/
  <versión del remoto>_post_history_and_delete_policies.sql  # nuevo
shared/database/types.ts                    # post_has_history en Functions
shared/components/toast/UrlNoticeToast.tsx  # antes staff/components/StaffListNoticeToast.tsx
staff/components/StaffListContent.tsx       # usa UrlNoticeToast
feed/
  types.ts                                  # DeletePostResult, FeedNotice, canDelete
  remove-post-with-photos.ts                # nuevo: archivos de {postId}/ y después el post
  delete-post-messages.ts                   # nuevo
  read-feed-notice.ts                       # nuevo
  actions/discard-post.ts                   # usa remove-post-with-photos
  actions/delete-post.ts                    # nuevo
  build-feed.ts                             # canDelete: false
  get-post-detail.ts                        # canDelete en el detalle del equipo
  components/
    DeletePostButton.tsx                    # nuevo: botón, ConfirmDialog y toasts
    PostDetailView.tsx                      # prop opcional `headerAction` a la derecha de "Volver al feed"
    PostDetailContent.tsx                   # pasa DeletePostButton si canDelete
    FeedContent.tsx                         # lee `notice` y muestra UrlNoticeToast
app/(app)/page.tsx                          # pasa searchParams a FeedContent
references/documents/database-schema.md
references/documents/flujos-de-procesos.md
specs/BACKLOG.md
references/documents/pantallas-pendientes.md
```

---

## Plan de implementación

1. **Migración.** Cargar los skills `supabase` y `supabase-postgres-best-practices`. Escribir `post_has_history`, los grants y el reemplazo de `posts_delete_author` y `post_photos_objects_delete_author`. **Pedir permiso antes de aplicarla.** Nombrar el archivo con la versión que devuelve `list_migrations`. Actualizar `shared/database/types.ts`. Probar con `execute_sql` en transacciones con `rollback` (casos en Criterios). Revisar `get_advisors` (security y performance).
2. **Borrado reusable.** Extraer `feed/remove-post-with-photos.ts` de `discardPost`, sin cambio de comportamiento. Prueba manual: una publicación con fotos que falla al subir se sigue deshaciendo.
3. **Toast por URL compartido.** Mover `StaffListNoticeToast` a `shared/components/toast/UrlNoticeToast.tsx`. Prueba manual: cancelar invitación y eliminar staff siguen mostrando su toast en `/staff`.
4. **Server Action y datos.** `DeletePostResult`, `canDelete` en `getTeamPostDetail` y `deletePost` con `redirect("/?notice=post-deleted")`. Consultar Context7 y `node_modules/next/dist/docs/` para `redirect` dentro de Server Actions llamadas desde una transición.
5. **UI.** `delete-post-messages.ts`, `DeletePostButton`, `headerAction` en `PostDetailView` y el aviso en `FeedContent` (`searchParams` dentro del `Suspense` existente, por `cacheComponents`). Cargar el skill `frontend-design:frontend-design` antes del código de UI.
6. **Documentación.**
   - `database-schema.md`: `post_has_history` en la tabla de helpers; `posts` delete → "autor sin historial (staff) o admin"; Storage delete del autor con la misma regla; casos de prueba nuevos.
   - `flujos-de-procesos.md`, "Borrar publicación": "El admin (cualquier post de su guardería) o el autor staff si no tiene historial (reacciones o comentarios de otras personas) elige «Eliminar» en el detalle".
   - `BACKLOG.md`: en "Borrar los archivos de Storage al borrar un post o una foto", mantener `[ ]` y dejar en **Qué** solo "quitar una foto" (se resuelve en SPEC 36).
   - `pantallas-pendientes.md`: en el punto 17, anotar que eliminar un post se resolvió en SPEC 35.

---

## Criterios de aceptación

- [x] `post_has_history` devuelve `false` para un post sin reacciones ni comentarios, o solo con los del autor, y `true` con una reacción o un comentario de otra persona.
- [x] Como staff autor, `delete` de un post sin historial funciona y de uno con historial borra 0 filas.
- [x] Como staff autor, borrar en Storage un archivo de un post con historial falla; de uno sin historial funciona.
- [x] Como admin, borrar un post con historial de un staff de su guardería funciona (fila y archivos); de otra guardería no.
- [x] Un staff no puede borrar el post de otro staff.
- [x] El archivo de la migración tiene el mismo nombre que su registro en el remoto y `shared/database/types.ts` incluye `post_has_history`.
- [x] El admin ve "Eliminar" en el detalle de cualquier publicación, en la línea de "Volver al feed" y alineado a la derecha.
- [x] El staff ve "Eliminar" solo en el detalle de sus publicaciones sin historial; no lo ve en las de otros ni en las suyas con historial.
- [x] El familiar no ve "Eliminar" en `/family/posts/[id]`.
- [x] "Eliminar" abre el modal con el título y la descripción de Mensajes; "Cancelar" o Esc lo cierran sin cambios.
- [x] Mientras elimina, el modal no se cierra con Esc ni con "Cancelar".
- [x] Confirmar elimina el post y todas sus filas de `post_elderly`, `post_photos`, `reactions` y `comments`, y no deja archivos en `post-photos/{postId}/`.
- [x] Tras eliminar, se redirige a `/`, aparece el toast "Publicación eliminada", la URL queda en `/` y el post ya no está en el feed.
- [x] Abrir `/posts/{id}` o `/family/posts/{id}` de un post eliminado muestra la página de no encontrado.
- [x] Si otra persona comenta mientras el staff tiene abierto el modal, al confirmar aparece "No se puede eliminar", no se borra nada (fila ni archivos) y el botón desaparece.
- [x] Llamar a `deletePost` como relative, con un id inválido o sobre un post ajeno (staff) devuelve `error` y no borra nada.
- [x] Una publicación con fotos que falla al subir se sigue deshaciendo por completo (SPEC 25).
- [x] Cancelar invitación y eliminar staff siguen mostrando su toast en `/staff`.
- [x] La línea "Volver al feed" / "Eliminar" no se desborda a 375 px de ancho.
- [x] `npm run lint` y `npm run build` pasan sin errores.

---

## Decisiones

- **Sí:** dividir "editar y eliminar" en SPEC 35 (eliminar) y SPEC 36 (editar). La feature completa tocaba DB, modal, fotos y documentación.
- **Sí:** el admin elimina cualquier publicación de su guardería, con o sin historial (moderación). Ya lo permitía `posts_delete_admin`.
- **Sí:** el staff solo elimina sus publicaciones sin historial. Historial = reacciones o comentarios de **otras personas**; los del propio autor no cuentan.
- **Sí:** la regla de historial se valida en la DB (policies), no solo en la app. Evita que un staff borre por la API un post con historial.
- **Sí:** endurecer también la policy de Storage del autor. Si no, el staff podría borrar los archivos y fallar al borrar el post, dejándolo sin fotos.
- **No:** endurecer ahora las policies de `post_photos` y `post_elderly`. Solo las usa la edición (SPEC 36); el borrado del post las salta con la cascada.
- **Sí:** "Eliminar" solo en el detalle, en la línea de "Volver al feed" a la derecha. Decisión del usuario; el mockup no lo define.
- **No:** "Eliminar" en la tarjeta del feed ni un menú "⋯".
- **Sí:** ocultar "Eliminar" si el staff no puede usarlo, en vez de mostrarlo deshabilitado.
- **Sí:** redirigir a `/` con `?notice=post-deleted`, como `deleteStaff` (`/staff?notice=staff-deleted`). El detalle ya no existe tras borrar.
- **Sí:** generalizar `StaffListNoticeToast` a `shared/components/toast/UrlNoticeToast.tsx` y extraer `remove-post-with-photos.ts` de `discardPost`. Reuso en vez de duplicar.
- **No:** función RPC para borrar archivos y post juntos. Storage no se borra desde SQL; el orden archivos → post lo hace la app.
- **No:** borrado lógico. La cascada ya está definida en SPEC 22.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Alguien comenta entre el borrado de los archivos y el del post (staff): el post queda sin fotos. | Ventana muy corta. `deletePost` valida el historial justo antes. Si el borrado del post falla, devuelve `error` y lo registra con `console.error`. El admin puede eliminarlo después. |
| `post_has_history` encarece las policies de delete. | Solo se evalúa en `delete`, con `exists` sobre `reactions(post_id)` y `comments(post_id)`, que tienen índice. Se revisa con `get_advisors`. |
| `redirect` dentro de la transición del `ConfirmDialog`. | Se consulta la documentación local de Next 16 en el paso 4. `deleteStaff` ya usa el mismo patrón. |
| Mover `StaffListNoticeToast` rompe los avisos de `/staff`. | Paso 3 sin cambio de comportamiento, con prueba manual. |

---

## Entradas de BACKLOG

- "Borrar los archivos de Storage al borrar un post o una foto": se resuelve **en parte** (borrar un post). Queda `[ ]` con "quitar una foto" para SPEC 36.

---

## Lo que **no** está en esta spec

- Editar una publicación, sus fotos o su audiencia (SPEC 36).
- "Eliminar" desde la tarjeta del feed.
- Avisar al autor cuando el admin elimina su publicación.
- Borrado lógico o papelera.

Cada uno, si llega, va en su propia spec.
