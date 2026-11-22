# SPEC 31 — Foto de avatar, perfil del familiar y edición de cuentas del equipo

> **Estado:** Implemented
> **Depende de:** SPEC 08, SPEC 10, SPEC 16, SPEC 17, SPEC 18, SPEC 21, SPEC 23, SPEC 30
> **Fecha:** 2026-11-21
> **Objetivo:** Que cada usuario tenga foto de avatar y que el admin gestione la foto y los datos del staff y de los familiares, con un perfil del familiar para el admin y las preferencias de notificaciones guardadas en la DB.

---

## Por qué esta spec

Los botones "Editar" de `/account` y de `/staff/[id]` no hacen nada (SPEC 08, SPEC 20). Los switches de notificaciones de `/account` solo tienen estado local. `users.avatar_url` existe, pero no hay bucket donde guardar la foto. La tarjeta "MIS ADULTOS MAYORES" de `/family/account` sale del mock (SPEC 18). El admin no tiene una pantalla para ver a un familiar: solo una fila en "Familiares vinculados" de `/elderly/[id]`.

Según la RLS de `users`:

- Cada usuario solo puede cambiar sus preferencias (`avatar_url`, `notify_on_post`, `daily_summary_enabled`).
- El admin cambia nombres y preferencias de cualquier usuario de su guardería.

Por eso ni el staff ni el familiar tienen formulario de edición: su acción es "Cambiar foto". El admin es el único que cambia nombres: los suyos, los del staff y los de los familiares. El email vive en `auth.users` y cambiarlo requiere `service_role`: es un caso nuevo de la lista del esquema.

No hay mockup del modal de edición, del botón "Cambiar foto", del visor del avatar ni del perfil del familiar para el admin. Esta spec los define reusando el modal "Agregar staff" (SPEC 20), el visor de foto (SPEC 30) y `familia-cuenta.dc.html`.

El usuario pidió una sola spec, aunque toca DB, Storage y cinco pantallas.

Resuelve las entradas del BACKLOG "Botón Editar del perfil de staff" y "Notificaciones de Mi cuenta: copy del mockup distinto de los campos de la DB". Resuelve en parte "Conectar las pantallas del familiar a Supabase" (la parte de "Mi cuenta").

---

## Alcance

**Dentro:**

- **Bucket `avatars`** (privado) con sus policies, su migración y su documentación en `database-schema.md`.
- **Quién gestiona cada foto:**

  | Quien | Sube o cambia | Quita |
  | --- | --- | --- |
  | Cualquier usuario `active` (staff, admin, relative) | la suya | la suya |
  | Admin | la de un staff o relative de su guardería que no esté `archived` | la de un staff o relative de su guardería, aunque esté `archived` |

  El admin no gestiona la foto de otro admin.

- **"Cambiar foto" y el visor:**
  - Botón "Cambiar foto" en la tarjeta de perfil. Elegir una imagen la comprime con `compressPhoto` (SPEC 25), la sube y reemplaza la anterior.
  - Con foto, tocar el avatar abre el visor (SPEC 30). Sin foto, el avatar no es clicable.
  - "Quitar foto" en la cabecera del visor (en lugar de "Descargar"), con diálogo de confirmación. Vuelve a las iniciales.
  - Si el usuario está `archived`, el admin ve el visor con "Quitar foto", pero no "Cambiar foto".
- **Dónde está "Cambiar foto":**
  - `/account`: staff y admin. Para el staff reemplaza a "Editar"; el admin tiene los dos.
  - `/family/account`: el familiar. No tiene "Editar".
  - `/staff/[id]`: el admin, para la foto del staff.
  - `/relatives/[id]`: el admin, para la foto del familiar.
- **Dónde se muestra la foto** (sin foto o si la firma falla, se ven las iniciales como hoy):
  - Staff y admin: sidebar, `ProfileCard`, `PostComposerButton`, `CommentComposer`, `CommentItem`, `StaffCard` (`/staff`) y `StaffProfileHeader` (`/staff/[id]`).
  - Familiar: sidebar familiar, `ProfileCard` de `/family/account` y `/relatives/[id]`, `CommentComposer`, `CommentItem` y `LinkedRelativeRow` (`/elderly/[id]`).
- **Perfil del familiar para el admin (`/relatives/[id]`):**
  - Solo admin. Otro rol, o un familiar de otra guardería, ve el 404.
  - Igual a `/family/account`: tarjeta de perfil (foto, nombre, email y parentesco) y tarjeta "ADULTOS MAYORES" con sus adultos mayores.
  - Con "Cambiar foto" y "Editar". Sin notificaciones, sin "Cambiar contraseña" ni "Cerrar sesión".
  - El título es el nombre del familiar. Arriba, el enlace "Volver al perfil", como "Volver a Staff" de `/staff/[id]`.
  - Se entra tocando una fila activa de "Familiares vinculados" de `/elderly/[id]` (solo admin). Las invitaciones pendientes no enlazan.
- **Tarjeta de adultos mayores con datos reales**, en `/family/account` y en `/relatives/[id]`:
  - Desde `guardian_elderly`, `elderly` y `rooms`: nombre completo, edad (desde `birth_date`), habitación y consentimiento de fotos (`photo_consent`).
  - Todos los adultos mayores vinculados. Primero los `active` y al final los `archived`; dentro de cada grupo, en el orden de los vínculos (el primero vinculado va primero).
  - Un `archived` se ve con opacidad reducida y el badge "Archivado". Es igual en las dos pantallas.
  - Sin vínculos: "Aún no tienes adultos mayores vinculados." en `/family/account` y "No tiene adultos mayores vinculados." en `/relatives/[id]`.
  - El consentimiento es solo lectura (`PhotoConsentIndicator`).
  - El parentesco de la tarjeta de perfil ("Hija de Luis Fernández y Carmen Ruiz") también sale de `guardian_elderly`.
- **Modal "Editar perfil" del admin en `/account`:** nombres y apellidos propios. El email no se muestra ni se edita.
- **Modal "Editar staff" en `/staff/[id]`:**
  - Staff `active`: nombres, apellidos, email y "Confirmar email".
  - Staff `pending`: nombres y apellidos. El email no se edita (se cancela la invitación y se invita de nuevo).
  - Staff `archived`: no se ve "Editar".
- **Modal "Editar familiar" en `/relatives/[id]`:** nombres, apellidos, email y "Confirmar email", con las mismas reglas que "Editar staff". Para un familiar `archived` no se ve "Editar".
- **Preferencias de notificaciones guardadas en la DB:**
  - En `/account` (staff y admin): cada switch guarda al tocarlo.
  - En `/staff/[id]` (solo admin): tarjeta "NOTIFICACIONES" con los mismos switches para el staff, si no está `archived`.
  - Si falla, el switch vuelve a su valor y aparece un toast.
- **Copy de las preferencias del equipo:** se mantiene el del mockup. "Nuevos comentarios de familias" guarda `notify_on_post` y "Recordatorio de resumen (17:00)" guarda `daily_summary_enabled`.
- **`/family/account`:** se quita la tarjeta "NOTIFICACIONES". La DB no cambia.
- **Documentación:** `database-schema.md` (bucket, `avatar_url`, funciones nuevas y el caso nuevo de `service_role`), `CLAUDE.md` (lista de usos de `service_role`), `pantallas-pendientes.md` y `BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- Switch para que el familiar cambie el consentimiento de fotos de sus adultos mayores (la **siguiente spec**).
- Notificaciones del familiar: la tarjeta se quita y no se vuelve a mostrar en esta spec, tampoco en `/relatives/[id]`.
- Que el admin gestione la foto de otro admin.
- Que el admin cambie su propio email, o el de un staff `pending`.
- Editar a un staff `archived`.
- Que el staff abra `/relatives/[id]`.
- Archivar familiares (no existe el flujo).
- Abrir el visor desde otros avatares (sidebar, comentarios, `/staff`, "Familiares vinculados").
- Recortar o encuadrar la foto antes de subirla.
- Enviar los correos de `notify_on_post` y `daily_summary_enabled` (siguen en el BACKLOG).
- "Resumen del día" con datos reales (sigue en el BACKLOG).
- Cambiar contraseña (punto 23 de `pantallas-pendientes.md`).
- Editar el nombre de la guardería (punto 24).

---

## Modelo de datos

### Base de datos

**`users.avatar_url`:** sin cambios de columna. Guarda la **ruta** del archivo en el bucket `avatars` (`{user_id}/{uuid}.webp`), no una URL. `null` = sin foto.

**Bucket `avatars`** (migración nueva):

- Privado.
- `file_size_limit = 204800` (200 KB) y `allowed_mime_types = {image/webp}`, como `post-photos`.
- Ruta: `{user_id}/{uuid}.webp`. La primera carpeta es el dueño de la foto; el `uuid` cambia en cada subida, así una URL firmada vieja nunca muestra la foto nueva.
- Las URLs se firman en el servidor con `createSignedUrls` por 1 hora.

**Helpers nuevos** (`search_path` vacío, `EXECUTE` revocado a `public` y `anon`, solo `authenticated`):

- `avatar_owner_from_path(p_path text) returns uuid`: `IMMUTABLE`, no `SECURITY DEFINER`. Devuelve la primera carpeta como `uuid`, o `null` si no tiene formato UUID. Misma idea que `post_id_from_path`.
- `can_upload_avatar(p_user_id uuid) returns boolean`: `SECURITY DEFINER STABLE`. `true` si quien llama está `active` y:
  - es `p_user_id`; o
  - es admin y `p_user_id` es un `staff` o `relative` de su guardería que no está `archived`.
- `can_remove_avatar(p_user_id uuid) returns boolean`: `SECURITY DEFINER STABLE`. Igual que `can_upload_avatar`, pero el admin también puede con un `staff` o `relative` `archived`.

Las dos devuelven `false` en cualquier otro caso y solo un booleano (regla 7).

**Función nueva** `get_relative_email(p_relative_id uuid) returns text`: `SECURITY DEFINER STABLE`, como `get_staff_emails()`. Devuelve el email de `auth.users` si quien llama es admin y `p_relative_id` es un `relative` de su guardería. `null` en otro caso. La usa `/relatives/[id]`.

**Policies de `storage.objects`** (bucket `avatars`), nombradas `avatars_<acción>_<quién>`:

| Acción | Quién | Regla |
| --- | --- | --- |
| select | todos | `exists (select 1 from public.users where id = avatar_owner_from_path(name))`: pasa por la RLS de `users`, así ve la foto quien ya ve a esa persona |
| insert | dueño o admin | `(select can_upload_avatar(avatar_owner_from_path(name)))` |
| delete | dueño o admin | `(select can_remove_avatar(avatar_owner_from_path(name)))` |

No hay `update`: cada subida es un archivo nuevo.

**RLS de `users`:** no cambia. `users_update_own` ya permite `avatar_url`, `notify_on_post` y `daily_summary_enabled`. La policy de update del admin ya permite nombres y preferencias de los usuarios de su guardería.

**Lo que la DB permite y la app no ofrece:** la policy de update del admin deja tocar a un staff `archived`, las preferencias de un familiar y el `avatar_url` de otro admin. La app no lo ofrece y las Server Actions lo rechazan. No se agrega una regla en la DB.

### `service_role`: caso nuevo

**Cambiar el email de un staff `active` o de un familiar no `archived`** con `auth.admin.updateUserById(id, { email, email_confirm: true })`. El cambio es inmediato, sin correo de confirmación. Antes, la Server Action verifica que quien llama es admin activo y que el usuario es de su guardería, con el rol y el estado correctos. Se agrega a la regla 4 de `database-schema.md` y a la lista de `CLAUDE.md`.

### Tipos de la app

```ts
// users/types.ts (nuevo)
export type AvatarPhoto = {
  url: string; // url firmada
  width: number | null;
  height: number | null;
};

// Lo que puede hacer quien mira el avatar
export type AvatarPermissions = { canChange: boolean; canRemove: boolean };

// account/types.ts (nuevo)
export type ProfileField = "firstName" | "lastName" | "email";
export type ProfileChanges = Partial<Record<ProfileField, string>>;

// staff/types.ts y account/types.ts
export type ActionResult<E = Record<string, string>> =
  | { status: "ok" }
  | { status: "invalid"; errors: E }
  | { status: "error"; message: string };

// family/types.ts: reemplaza a FamilyMock en "Mi cuenta"
export type FamilyAccountElderly = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  ageLabel: string;    // "78 años"
  roomName: string;
  photoConsent: boolean;
  isArchived: boolean;
};
```

- `Avatar` (`shared/components/Avatar.tsx`) recibe una prop opcional `photoUrl`. Con `photoUrl` muestra la imagen redonda; si la imagen falla, vuelve a las iniciales.
- El ancho y alto de la foto se leen de la imagen al abrir el visor (no se guardan en la DB).
- `mockFamily` sigue existiendo solo para "Resumen del día".

### Server Actions

Todas usan el cliente de sesión, salvo el cambio de email.

- **`users/actions/set-avatar.ts`:** `setAvatar(userId, path)`.
  - Valida con `getCurrentUser()` que hay un usuario activo y que `path` empieza con `{userId}/` y termina en `.webp`.
  - Si `userId` es otro usuario, quien llama tiene que ser admin y el destino un `staff` o `relative` no `archived`.
  - Lee el `avatar_url` anterior, actualiza `avatar_url = path` y después borra el archivo anterior. Si el borrado falla, el avatar queda guardado igual.
  - Si el update falla (RLS), borra el archivo recién subido y devuelve `error`.
- **`users/actions/remove-avatar.ts`:** `removeAvatar(userId)`. Mismas reglas, pero el admin puede con un `archived`. Pone `avatar_url = null` y borra el archivo.
- **`account/actions/update-notification-preference.ts`:** `updateNotificationPreference(userId, key, value)`. `key` tiene que ser `notify_on_post` o `daily_summary_enabled`. Si el usuario es otro, quien llama tiene que ser admin y el destino un staff no `archived`.
- **`account/actions/update-own-profile.ts`:** `updateOwnProfile(changes)`. Solo admin. Valida y actualiza solo los `first_name` y `last_name` propios que cambiaron.
- **`staff/actions/update-staff.ts`:** `updateStaff(staffId, changes)`. Solo admin, usando `authorize-staff-action.ts`. Rechaza a un staff `archived`. Si es `pending`, ignora el email.
- **`relatives/actions/update-relative.ts`:** `updateRelative(relativeId, changes)`. Solo admin; el familiar tiene que ser `relative` de su guardería y no `archived`.
- Las dos usan **`users/apply-profile-changes.ts`** (server-only), para no duplicar la lógica:
  - Recibe solo los campos cambiados (ver "Solo se guarda lo que cambió").
  - Valida todo antes de escribir. Si el email cambió, primero lo cambia con `service_role` y después los nombres con el cliente de sesión, solo si alguno cambió.
  - Email ya usado por otra cuenta (error `email_exists` de Auth) → `invalid` en `email`.

La subida a Storage la hace el navegador con `shared/supabase/client.ts` (como `publish-post.ts`), pasando por las policies del bucket.

### Lecturas nuevas

- **`family/fetch-account-elderly.ts`:** `fetchAccountElderly(relativeId)`. Lee `guardian_elderly` del familiar con su `elderly` (de cualquier estado) y `rooms`, con el cliente de sesión, y ordena activos primero. La usan `/family/account` (el propio familiar) y `/relatives/[id]` (el admin). La RLS ya lo permite para los dos.
- **`relatives/get-relative-profile.ts`:** `getRelativeProfile(id)`. Solo admin. Lee la fila de `users` (`role = 'relative'`), su email con `get_relative_email` y sus adultos mayores con `fetchAccountElderly`. Sin fila → `notFound()`.

### Validación

- **Nombres y apellidos:** las mismas reglas y mensajes de `validateNewStaff` (obligatorios, hasta `NAME_MAX_LENGTH`). Se extraen a una función compartida en lugar de duplicarlas.
- **Email:** mismas reglas de `validateNewStaff`. "Confirmar email" es obligatorio solo si el email cambió. Tiene que coincidir sin distinguir mayúsculas.

### Solo se guarda lo que cambió

Vale para "Editar perfil", "Editar staff" y "Editar familiar".

1. **Normalizar antes de comparar.** Nombres y apellidos con `trim()`; el email con `trim()` y en minúsculas. Lo que se guarda es el valor normalizado.
2. **Enviar solo lo que cambió.** `account/diff-profile-changes.ts` compara cada campo normalizado con su valor inicial y devuelve solo los distintos (`ProfileChanges`). El cliente manda solo esos campos. La Server Action vuelve a normalizar y a comparar con la fila actual, y actualiza solo lo distinto. Si el email no cambió, no llama a `updateUserById`.
3. **"Guardar" deshabilitado sin cambios.** Si después de normalizar todo coincide con los valores iniciales, el botón está deshabilitado. Si el admin deshace sus cambios, vuelve a deshabilitarse.
4. **Línea de resumen.** Arriba de los botones del modal, mientras haya cambios, se lee qué campos se van a modificar: "Cambiará: Nombres, Email". Sin cambios, la línea no aparece. Usa `aria-live="polite"`.

Si la Server Action no encuentra cambios (p. ej. otro admin guardó lo mismo antes), devuelve `ok` sin escribir.

### Mensajes

| Uso | Texto |
| --- | --- |
| Botón de la tarjeta | Cambiar foto |
| Botón del visor | Quitar foto |
| Diálogo: título | ¿Quitar la foto? |
| Diálogo: texto | Se volverán a mostrar las iniciales. |
| Diálogo: botones | Cancelar / Quitar |
| `aria-label` del avatar con foto | Ver foto de {nombre} |
| Toast al subir: error | No se pudo cambiar la foto. Intenta de nuevo. |
| Toast al procesar: error | No se pudo procesar la imagen. Prueba con otra foto. |
| Toast al quitar: error | No se pudo quitar la foto. Intenta de nuevo. |
| Toast de preferencia: error | No se pudo guardar el cambio. Intenta de nuevo. |
| Modal propio: título | Editar perfil |
| Modal de staff: título | Editar staff |
| Modal de familiar: título | Editar familiar |
| Campos | Nombres / Apellidos / Email / Confirmar email |
| Botones del modal | Cancelar / Guardar |
| Línea de resumen | Cambiará: {campos separados por coma} |
| Email repetido | Ese email ya está en uso. |
| Error al guardar | No se pudieron guardar los cambios. Intenta de nuevo. |
| Toast al guardar | Cambios guardados |
| Enlace de `/relatives/[id]` | Volver al perfil |
| Título de la tarjeta en `/relatives/[id]` | ADULTOS MAYORES |
| Badge de anciano archivado | Archivado |
| Sin vínculos, en `/family/account` | Aún no tienes adultos mayores vinculados. |
| Sin vínculos, en `/relatives/[id]` | No tiene adultos mayores vinculados. |

### Componentes

Colores, tamaños y espaciados se toman de `mi-cuenta.dc.html`, `familia-cuenta.dc.html`, del modal de "Agregar staff" (SPEC 20) y de `foto.dc.html`.

- `feed/components/PhotoViewer.tsx`: se generaliza sin cambiar el comportamiento en posts.
  - Recibe `photos`, `heading`, `subtitle`, `caption` opcional y la acción de la cabecera (`headerAction`).
  - Los posts pasan `PhotoDownloadButton`; el avatar pasa el botón "Quitar foto" si `canRemove`.
  - Sin `caption` no hay pie.
- `users/components/AvatarPhotoButton.tsx` (`"use client"`): avatar clicable que abre el visor. Heading: nombre completo; subtítulo: la etiqueta del rol.
- `users/components/ChangeAvatarButton.tsx` (`"use client"`): input de archivo oculto (`accept="image/*"`) + botón. Comprime, sube y llama a `setAvatar`. Deshabilitado mientras sube. Se muestra si `canChange`.
- `users/components/RemoveAvatarDialog.tsx`: confirmación con el estilo de `ConfirmStaffActionDialog`.
- `account/components/ProfileCard.tsx`: avatar con foto, "Cambiar foto" y, solo para el admin en su `/account`, "Editar".
- `account/components/AccountView.tsx`: notificaciones, acciones de cuenta y "Cerrar sesión" opcionales, para reusarla en `/family/account` y `/relatives/[id]`.
- `account/components/EditProfileDialog.tsx`: modal del admin.
- `account/components/ProfileChangesSummary.tsx`: la línea "Cambiará: …". La usan los dos modales.
- `account/components/NotificationToggle.tsx`: guarda con `updateNotificationPreference`, con estado optimista.
- `users/components/EditUserDialog.tsx`: un solo modal para "Editar staff" y "Editar familiar". Recibe el título, si muestra el email y la Server Action a llamar.
- `staff/components/StaffNotificationCard.tsx`: reusa `NotificationSettingsCard` con el `userId` del staff.
- `family/components/FamilyAccountView.tsx`: datos reales y sin `NotificationSettingsCard`. Con un título y un enlace de vuelta opcionales, la reusa `/relatives/[id]`.
- `family/components/FamilyElderlyCard.tsx`: título y texto vacío por prop ("MIS ADULTOS MAYORES" o "ADULTOS MAYORES"). Un `archived` con `opacity-60` y el badge "Archivado".
- `elderly/components/LinkedRelativeRow.tsx`: foto y, para el admin en una fila activa, enlace a `/relatives/{id}?from={elderlyId}`.
- `app/(app)/relatives/[id]/page.tsx` (nuevo): con `<Suspense>` y el esqueleto de `/account`. El enlace "Volver al perfil" lleva a `/elderly/{from}` si `from` es un UUID; si no, a `/elderly`.

---

## Estructura de archivos

```
supabase/migrations/
  <versión del remoto>_create_avatars_bucket.sql   # bucket, helpers, get_relative_email y policies
app/(app)/relatives/[id]/
  page.tsx                                 # nuevo
users/
  types.ts                                 # nuevo: AvatarPhoto, AvatarPermissions
  avatar-messages.ts                       # nuevo
  sign-avatar-urls.ts                      # nuevo: firma rutas → urls (server-only)
  apply-profile-changes.ts                 # nuevo: email + nombres (server-only)
  upload-avatar.ts                         # nuevo: comprime y sube desde el navegador
  actions/
    set-avatar.ts                          # nuevo
    remove-avatar.ts                       # nuevo
  components/
    AvatarPhotoButton.tsx                  # nuevo
    ChangeAvatarButton.tsx                 # nuevo
    RemoveAvatarDialog.tsx                 # nuevo
    EditUserDialog.tsx                     # nuevo: Editar staff y Editar familiar
relatives/
  get-relative-profile.ts                  # nuevo
  actions/update-relative.ts               # nuevo
  components/RelativeProfileContent.tsx    # nuevo
shared/components/
  Avatar.tsx                               # prop photoUrl
  navigation/Sidebar.tsx                   # foto del usuario
account/
  types.ts                                 # nuevo
  validate-profile.ts                      # nuevo: nombres, sale de validateNewStaff
  diff-profile-changes.ts                  # nuevo: normaliza y devuelve solo lo cambiado
  account-messages.ts                      # nuevo
  actions/
    update-own-profile.ts                  # nuevo
    update-notification-preference.ts      # nuevo
  components/
    AccountContent.tsx                     # pasa foto, rol y userId
    AccountView.tsx                        # secciones opcionales
    ProfileCard.tsx                        # foto, Cambiar foto, Editar solo admin
    EditProfileDialog.tsx                  # nuevo
    ProfileChangesSummary.tsx              # nuevo
    NotificationSettingsCard.tsx           # recibe userId
    NotificationToggle.tsx                 # guarda en la DB
family/
  types.ts                                 # FamilyAccountElderly
  fetch-account-elderly.ts                 # nuevo
  relationship-text.ts                     # parentesco desde los vínculos reales
  components/
    FamilyAccountContent.tsx               # lee datos reales y la foto
    FamilyAccountView.tsx                  # sin mock ni notificaciones
    FamilyElderlyCard.tsx                  # título por prop y estado vacío
staff/
  types.ts                                 # avatar en perfil y lista
  validate-new-staff.ts                    # usa validate-profile
  validate-staff-edit.ts                   # nuevo
  build-staff-list.ts / build-staff-profile.ts   # foto firmada
  actions/update-staff.ts                  # nuevo
  components/
    StaffProfileHeader.tsx                 # foto, Cambiar foto, Editar
    StaffProfileView.tsx                   # tarjeta de notificaciones
    StaffCard.tsx                          # foto
    StaffNotificationCard.tsx              # nuevo
elderly/
  get-linked-relatives.ts                  # relativeId y foto
  components/LinkedRelativeRow.tsx         # foto y enlace
feed/components/
  PhotoViewer.tsx                          # generalizado
  PhotoCarousel.tsx                        # pasa los datos del post al visor
  PostComposerButton.tsx                   # foto del usuario
comments/
  fetch-comments.ts                        # avatar_url del autor
  components/CommentItem.tsx / CommentComposer.tsx   # foto
auth/route-access.ts                       # /relatives solo admin
references/documents/database-schema.md
references/documents/pantallas-pendientes.md
CLAUDE.md
specs/BACKLOG.md
```

---

## Plan de implementación

1. **Migración del bucket.**
   - Cargar los skills `supabase` y `supabase-postgres-best-practices`. Consultar Context7 para las policies de Storage.
   - Escribir la migración (bucket, `avatar_owner_from_path`, `can_upload_avatar`, `can_remove_avatar`, `get_relative_email` y policies). **Pedir permiso antes de aplicarla.** Nombrar el archivo con la versión que devuelve `list_migrations`.
   - Actualizar `database-schema.md`.
   - Prueba: por SQL, subir y borrar como staff, admin, relative, otro staff y otro admin; con destinos `archived`; revisar `get_advisors`.
2. **Firmar y mostrar avatares.**
   - `sign-avatar-urls.ts`, prop `photoUrl` en `Avatar` y lectura de `avatar_url` en las fuentes de cada pantalla de la lista.
   - Prueba: con fotos subidas a mano, se ven en todas las ubicaciones del alcance.
3. **Visor generalizado.**
   - Generalizar `PhotoViewer` y adaptar `PhotoCarousel`.
   - Prueba: el visor de los posts se ve y funciona igual que en SPEC 30.
4. **Cambiar y quitar foto propia.**
   - Cargar el skill `frontend-design:frontend-design`.
   - `upload-avatar.ts`, `setAvatar`, `removeAvatar`, `ChangeAvatarButton`, `AvatarPhotoButton` y `RemoveAvatarDialog` en `/account` y `/family/account`.
   - Prueba: subir, reemplazar y quitar la foto propia como staff, admin y familiar.
5. **"Mi cuenta" del familiar con datos reales.**
   - `fetch-account-elderly.ts`, parentesco real, `FamilyAccountView` sin mock y sin notificaciones.
   - Prueba: con uno y con dos adultos mayores vinculados, la tarjeta muestra los datos de la DB.
6. **Perfil del familiar para el admin.**
   - `get_relative_email`, `get-relative-profile.ts`, la ruta `/relatives/[id]`, el acceso solo admin y el enlace desde `LinkedRelativeRow`.
   - Prueba: desde `/elderly/[id]`, tocar un familiar abre su perfil; cambiar y quitar su foto; "Volver al perfil" regresa.
7. **Foto del staff desde `/staff/[id]`.**
   - Botones de foto en `StaffProfileHeader`, con las reglas de `archived`.
   - Prueba: el admin cambia la foto de un `active` y quita la de un `archived`.
8. **Preferencias guardadas.**
   - `updateNotificationPreference` y `NotificationToggle` con estado optimista.
   - Prueba: cambiar un switch, recargar y ver el valor guardado.
9. **Preferencias del staff en `/staff/[id]`.**
   - `StaffNotificationCard`, oculta para un `archived`.
   - Prueba: el admin cambia una preferencia del staff y el staff la ve en su `/account`.
10. **Editar perfil del admin.**
    - `validate-profile.ts` (y `validateNewStaff` lo usa), `diff-profile-changes.ts`, `ProfileChangesSummary`, `updateOwnProfile` y `EditProfileDialog`.
    - Prueba: el admin cambia su nombre y se ve en `/account` y el sidebar.
11. **Editar staff y familiar.**
    - Consultar Context7 (`auth.admin.updateUserById`).
    - `validate-staff-edit.ts`, `apply-profile-changes.ts`, `updateStaff`, `updateRelative` y `EditUserDialog`.
    - Prueba: cambiar nombres de un staff `pending` y de uno `active`; cambiar el email de un staff `active` y de un familiar, e iniciar sesión con el email nuevo.
12. **Prueba real y capturas.**
    - Como staff, admin y familiar, según los criterios de aceptación.
    - Capturas en `.playwright-mcp/` a 1440×900 y 390×844: `/account` (staff y admin), `/family/account`, `/staff/[id]`, `/relatives/[id]`, el visor del avatar y los modales.
13. **Documentación.**
    - `CLAUDE.md`, `pantallas-pendientes.md` y `BACKLOG.md` (ver "Entradas de BACKLOG").

---

## Criterios de aceptación

**Base de datos y Storage**

- [x] El bucket `avatars` existe, es privado, acepta solo `image/webp` y hasta 200 KB.
- [x] Staff, admin y relative `active` pueden subir y borrar archivos en su propia carpeta.
- [x] Un admin puede subir y borrar en la carpeta de un staff o relative no `archived` de su guardería.
- [x] Un admin puede borrar, pero no subir, en la carpeta de un staff o relative `archived` de su guardería.
- [x] Un admin no puede subir ni borrar en la carpeta de otro admin ni de otra guardería.
- [x] Un staff o relative no puede subir ni borrar en la carpeta de otro usuario.
- [x] Un relative puede firmar la foto de un staff de su guardería y no la de otra guardería.
- [x] Un usuario `pending` o `archived` no puede subir, borrar ni firmar.
- [x] `get_relative_email` devuelve el email solo a un admin y solo de un familiar de su guardería; a otros roles, `null`.
- [x] Las policies de `users` no cambian.
- [x] El archivo de la migración tiene el mismo nombre que su registro en el remoto.
- [x] `get_advisors` no muestra avisos nuevos, salvo los aceptados y documentados.

**Foto de avatar**

- [x] En `/account` el staff ve "Cambiar foto" y no ve "Editar". El admin ve los dos.
- [x] En `/family/account` el familiar ve "Cambiar foto" y no ve "Editar".
- [x] Elegir una imagen la comprime a WebP, la sube y se ve en la tarjeta y el sidebar sin recargar a mano.
- [x] Reemplazar la foto borra el archivo anterior del bucket.
- [x] Una imagen que no se puede procesar muestra el toast de error y no cambia nada.
- [x] Con foto, tocar el avatar de la tarjeta abre el visor con el nombre y el rol en la cabecera, sin pie, flechas ni "Descargar".
- [x] Sin foto, el avatar no es un botón (no recibe foco ni clic).
- [x] "Quitar foto" pide confirmación; al confirmar, `avatar_url` queda `null`, el archivo se borra y vuelven las iniciales.
- [x] El admin cambia y quita la foto de un staff `active` o `pending` desde `/staff/[id]` y la de un familiar desde `/relatives/[id]`.
- [x] Con un staff o familiar `archived`, el admin abre el visor y puede quitar la foto, pero no ve "Cambiar foto".
- [x] La foto de un staff o admin se ve en el sidebar, `/staff`, `/staff/[id]`, sus comentarios, `PostComposerButton` y `CommentComposer`.
- [x] La foto de un familiar se ve en su sidebar, `/family/account`, `/relatives/[id]`, sus comentarios, `CommentComposer` y "Familiares vinculados".
- [x] Si la firma o la imagen fallan, se ven las iniciales.
- [x] El visor de las fotos de los posts funciona igual que en SPEC 30.

**Perfil del familiar y "Mi cuenta" del familiar**

- [x] En `/elderly/[id]`, el admin toca una fila activa de "Familiares vinculados" y abre `/relatives/{id}`. Las invitaciones pendientes no enlazan.
- [x] Para el staff, las filas de "Familiares vinculados" no enlazan.
- [x] `/relatives/[id]` abierto por un staff o un familiar, o con el id de un familiar de otra guardería, muestra el 404.
- [x] `/relatives/[id]` muestra la tarjeta de perfil (foto, nombre, email y parentesco), "Cambiar foto", "Editar" y "ADULTOS MAYORES", sin notificaciones, "Cambiar contraseña" ni "Cerrar sesión".
- [x] "Volver al perfil" lleva al perfil del adulto mayor desde donde se entró.
- [x] En `/family/account` y `/relatives/[id]`, la tarjeta de adultos mayores muestra nombre, edad, habitación y consentimiento de fotos desde la DB, de todos los vinculados.
- [x] Los `active` van primero y los `archived` al final, cada grupo en el orden de los vínculos.
- [x] Un adulto mayor `archived` se ve con opacidad reducida y el badge "Archivado", en las dos pantallas.
- [x] El consentimiento de fotos se ve, pero no se puede cambiar.
- [x] El parentesco de la tarjeta de perfil sale de `guardian_elderly`.
- [x] Sin vínculos, la tarjeta muestra "Aún no tienes adultos mayores vinculados." en `/family/account` y "No tiene adultos mayores vinculados." en `/relatives/[id]`.
- [x] `/family/account` ya no muestra la tarjeta "NOTIFICACIONES" ni datos del mock.

**Preferencias**

- [x] Cambiar un switch en `/account` guarda el valor: al recargar se mantiene.
- [x] "Nuevos comentarios de familias" guarda `notify_on_post` y "Recordatorio de resumen (17:00)" guarda `daily_summary_enabled`.
- [x] Si guardar falla, el switch vuelve a su valor y aparece el toast.
- [x] En `/staff/[id]` el admin ve y cambia las preferencias de un staff `active` o `pending`. Para un `archived` la tarjeta no aparece.

**Edición**

- [x] "Editar" de `/account` (admin) abre el modal con nombres y apellidos, sin email.
- [x] El admin guarda sus nombres y el cambio se ve en `/account` y el sidebar.
- [x] En `/staff/[id]`, "Editar" no aparece para un `archived`.
- [x] Para un `pending` el modal muestra nombres y apellidos, sin email.
- [x] Para un `active` el modal muestra nombres, apellidos, email y "Confirmar email".
- [x] Cambiar el email sin confirmarlo, o con una confirmación distinta, muestra el error en el campo y no guarda.
- [x] Sin cambiar el email, "Confirmar email" no es obligatorio.
- [x] Con un email ya usado por otra cuenta aparece "Ese email ya está en uso." y no se guarda nada.
- [x] Tras cambiar el email, el staff inicia sesión con el nuevo y no con el anterior.
- [x] En `/relatives/[id]`, "Editar" abre "Editar familiar" con nombres, apellidos, email y "Confirmar email", con las mismas reglas que "Editar staff".
- [x] Tras cambiar el email de un familiar, inicia sesión con el nuevo y no con el anterior.
- [x] Campos vacíos o de más de `NAME_MAX_LENGTH` caracteres muestran los mismos mensajes que "Agregar staff".
- [x] Un staff o familiar que llama a `updateStaff`, `updateRelative` o `updateOwnProfile` recibe `error` y no cambia nada.
- [x] Solo `apply-profile-changes.ts` usa `service_role`, y solo para el email.
- [x] Al abrir un modal, "Guardar" está deshabilitado y no hay línea de resumen.
- [x] Agregar espacios al inicio o al final de un campo no cuenta como cambio: "Guardar" sigue deshabilitado.
- [x] Cambiar las mayúsculas del email no cuenta como cambio.
- [x] Al cambiar un campo aparece "Cambiará: {campo}"; con varios, se listan todos. Al deshacer el cambio, la línea desaparece y "Guardar" se deshabilita.
- [x] Al guardar, la petición solo lleva los campos cambiados y el `update` solo toca esas columnas.
- [x] Guardar sin cambiar el email no llama a `auth.admin.updateUserById`.
- [x] Los valores se guardan sin espacios a los extremos y el email en minúsculas.

**General**

- [x] Los modales, los botones y el diálogo se usan con teclado, con foco visible y nombre accesible.
- [x] A 390×844 no hay scroll horizontal en `/account`, `/family/account`, `/staff/[id]` ni `/relatives/[id]`.
- [x] `npm run build` y `npm run lint` pasan.

---

## Decisiones tomadas y descartadas

- **Una sola spec.** El usuario lo prefirió dos veces, aun con el familiar y la pantalla nueva. Descartado: separar bucket, foto, edición y perfil del familiar.
- **Ni el staff ni el familiar tienen "Editar".** La RLS solo les deja cambiar preferencias; "Cambiar foto" es su acción.
- **Todos los usuarios tienen foto; el admin gestiona la del staff y los familiares, no la de otros admins.** Lo decidió el usuario. Igual que con el `status`: un admin no toca a otro admin.
- **Con un usuario `archived`, el admin solo puede quitar la foto.** Sirve para moderar una foto que sigue viéndose en comentarios viejos. Descartados: nada y cambiar y quitar.
- **Dos helpers (`can_upload_avatar`, `can_remove_avatar`)** en lugar de uno con un parámetro de modo: cada policy lee una regla clara.
- **Perfil del familiar en `/relatives/[id]`, solo admin, igual a `/family/account`.** Lo decidió el usuario. Descartado: acciones en la fila de `/elderly/[id]`.
- **El admin edita nombres, apellidos y email del familiar**, igual que con el staff. Lo decidió el usuario. Sus preferencias no se muestran en ninguna pantalla.
- **Un solo modal y una sola lógica de guardado** para staff y familiar (`EditUserDialog`, `apply-profile-changes.ts`). Descartado: duplicar "Editar staff" para el familiar.
- **Enlace de vuelta con `?from={elderlyId}`.** Un familiar puede tener varios adultos mayores; así vuelve al perfil desde donde se entró. Sin `from` válido, vuelve a `/elderly`.
- **Email del familiar con `get_relative_email`**, igual que `get_staff_emails()`: la RLS no deja leer `auth.users`. Descartado: tomarlo de `invitations` (no siempre hay una por familiar ni coincide con la cuenta).
- **Tarjeta de adultos mayores real en esta spec; el switch de consentimiento en la siguiente.** Lo decidió el usuario.
- **La tarjeta muestra también a los adultos mayores `archived`, al final, con opacidad y el badge "Archivado"**, igual para el admin y el familiar. Lo decidió el usuario. La RLS lo permite: `elderly_select_linked` filtra el vínculo, no el `status`. Descartado: mostrar solo los `active`.
- **El admin cambia el email de un staff `active` o de un familiar, al instante** (`email_confirm: true`). Descartados: también para `pending` (el link de la invitación queda en el correo viejo) y con confirmación al correo nuevo (correos y estados intermedios).
- **El admin no cambia su propio email.** Lo decidió el usuario.
- **"Confirmar email" obligatorio solo si el email cambió.** Evita errores de tipeo sin obligar a reescribir un email que no se toca.
- **Primero el email, después los nombres.** Si el email falla (p. ej. repetido), no se guarda nada. Si fallan los nombres después, el email ya cambió: se informa el error y el admin vuelve a guardar.
- **No se edita a un staff `archived`.** Ya no tiene acceso; se reactiva primero.
- **La foto la ve quien ya ve a esa persona.** La policy de select pasa por la RLS de `users`. Descartado: solo el dueño y el admin.
- **`avatar_url` guarda la ruta, no una URL.** Las URLs firmadas vencen; la ruta no.
- **Un archivo nuevo por subida (`{user_id}/{uuid}.webp`) y se borra el anterior.** Evita que una URL firmada en caché muestre la foto vieja y no necesita policy de `update`.
- **Misma compresión que las fotos de los posts** (WebP, 1280 px, 200 KB). Lo decidió el usuario.
- **"Quitar foto" en el visor, con confirmación.** Descartados: dos botones en la tarjeta y un menú.
- **El visor solo se abre desde la tarjeta de perfil** (`/account`, `/family/account`, `/staff/[id]`, `/relatives/[id]`). En el resto de la app el avatar es pequeño y ya tiene otro uso o ninguno.
- **Switches que guardan al tocar, con estado optimista.** Descartado: guardarlos dentro del modal "Editar".
- **Copy del mockup para las preferencias del equipo.** Lo decidió el usuario: "Nuevos comentarios de familias" = `notify_on_post` y "Recordatorio de resumen (17:00)" = `daily_summary_enabled`. Para el staff, `notify_on_post` significa avisos de comentarios.
- **Se quitan las notificaciones de `/family/account`.** Lo decidió el usuario. La DB queda igual.
- **Modal con el estilo de "Agregar staff".** No hay mockup. Descartado: edición dentro de la tarjeta.
- **Validación de nombres compartida** con "Agregar staff", sin duplicarla.
- **Solo se guarda lo que cambió, comparando valores normalizados.** Evita que un espacio o una mayúscula de más cuente como cambio, y no usa `service_role` si el email no cambió. El servidor vuelve a comparar, sin confiar en el cliente.
- **"Guardar" deshabilitado sin cambios** y **línea "Cambiará: …" arriba de los botones**, visible mientras haya cambios. El admin ve qué va a modificar antes de guardar. Descartado: campos bloqueados con un switch para desbloquear cada uno (más clics, sin mockup, parece una preferencia y no evita el espacio de más).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La spec es grande (DB, Storage y cinco pantallas) | El plan va en 13 pasos, cada uno probado por separado y con pausa para revisar el diff. |
| La policy de select de Storage lee `users` con RLS y puede ser lenta o recursiva | `users` no lee Storage, así que no hay recursión. Revisar con `EXPLAIN` y `get_advisors`. |
| Firmar avatares en cada pantalla suma consultas | Una sola llamada `createSignedUrls` por pantalla con todas las rutas. |
| Archivo subido sin que `setAvatar` lo guarde (cierre de pestaña, error) | `setAvatar` borra el archivo si el update falla. Un huérfano por cierre de pestaña queda en el bucket; se anota en el BACKLOG. |
| El email cambia y los nombres fallan | Se informa el error; el email nuevo ya es el válido y el admin vuelve a guardar. |
| Un staff `active` con sesión abierta durante el cambio de email | La sesión sigue válida; el email nuevo se usa en el próximo login. |
| `notify_on_post` significa cosas distintas para el equipo y el familiar | Documentarlo en `database-schema.md`, para que la spec de correos lo respete. |
| `/relatives/[id]` expone el email del familiar | Solo lo devuelve `get_relative_email` a un admin de su guardería. |

---

## Entradas de BACKLOG

- **"Botón Editar del perfil de staff":** `- [x] **Estado:** resuelto en SPEC 31`.
- **"Notificaciones de Mi cuenta: copy del mockup distinto de los campos de la DB":** `- [x] **Estado:** resuelto en SPEC 31`.
- **"Conectar las pantallas del familiar a Supabase":** se mantiene `[ ]` y se deja en el **Qué** solo el resumen (`daily_summaries` y su `dateLabel`).
- **Nueva — "Switch de consentimiento de fotos del familiar":** la tarjeta de adultos mayores ya es real en SPEC 31; falta que el familiar pase `photo_consent` de `true` a `false` (nunca al revés). Es la siguiente spec.
- **Nueva — "Notificaciones del familiar en `/family/account`":** la tarjeta se quitó en SPEC 31; decidir si vuelve y con qué copy.
- **Nueva — "Archivos huérfanos en el bucket `avatars`":** subidas que no llegaron a `setAvatar`; origen SPEC 31.
- **`pantallas-pendientes.md`:** en el punto 23, marcar la parte de "Editar perfil (avatar)"; "Cambiar contraseña" sigue pendiente. Agregar "Perfil del familiar para el admin (`/relatives/[id]`)" como resuelto en SPEC 31.

---

## Lo que **no** está en esta spec

- Switch de consentimiento de fotos del familiar (la siguiente spec).
- Notificaciones del familiar (ni para él ni para el admin).
- Que el admin gestione la foto de otro admin.
- Que el admin cambie su propio email, o el de un staff `pending`.
- Editar a un staff `archived`.
- Que el staff abra el perfil de un familiar.
- Abrir el visor desde el sidebar, los comentarios, `/staff` o "Familiares vinculados".
- Recortar la foto.
- Enviar correos de notificaciones.
- "Resumen del día" con datos reales.
- Cambiar contraseña y editar el nombre de la guardería.

Cada una, si llega, va en su propia spec.
