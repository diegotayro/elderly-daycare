# SPEC 33 — Modal "Editar adulto mayor"

> **Estado:** Aprobado
> **Depende de:** SPEC 14, SPEC 16, SPEC 31, SPEC 32
> **Fecha:** 2026-11-22
> **Objetivo:** Que el admin edite los datos de un adulto mayor `active` desde el botón "Editar" de `/elderly/[id]`, con el mismo formulario de "Agregar adulto mayor" y guardando solo lo que cambió.

---

## Por qué esta spec

El botón "Editar" de `/elderly/[id]` enlaza a `/` desde SPEC 02 y lo ve también el staff. El mockup `perfil-adulto-mayor.dc.html` lo enlaza a `agregar-adulto-mayor.dc.html`: la edición usa el mismo formulario que el alta.

La RLS (`elderly_update_admin`) y los permisos por columna (`grant update (room_id, first_name, last_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status)`) ya permiten editar todos los campos. **No hay cambios de base de datos.**

Resuelve el punto 12 de `pantallas-pendientes.md`. Resuelve en parte la entrada del BACKLOG "Botones "Editar" y "Resumen del día" del perfil" (la parte de "Editar").

---

## Alcance

**Dentro:**

- **Botón "Editar" de `/elderly/[id]`:**
  - Solo lo ve el admin y solo en adultos mayores `active`.
  - El staff y el admin en un `archived` no lo ven.
  - Mantiene la ubicación y el estilo actuales (mockup). Pasa de `<Link>` a `<button type="button">` que abre el modal.
- **Modal "Editar adulto mayor":**
  - Mismo layout, campos, validaciones y mensajes que "Agregar adulto mayor" (`agregar-adulto-mayor.dc.html`, SPEC 04 y SPEC 14).
  - Título "Editar adulto mayor". Botones "Cancelar" y "Guardar" en la cabecera, como el alta.
  - Campos precargados con los valores actuales: Nombres, Apellidos, Fecha de nacimiento, Fecha de ingreso, Habitación, Alergias (etiquetas unidas con ", ") y Notas médicas (vacío si es `null`).
  - "Habitación" lista todas las habitaciones de la guardería, en el mismo orden que el alta.
  - No incluye `photo_consent` (se cambia desde el perfil, SPEC 32) ni `status`.
- **Solo se guarda lo que cambió (regla de SPEC 31):**
  - "Guardar" está deshabilitado mientras no haya cambios. Si el admin deshace sus cambios, vuelve a deshabilitarse.
  - Línea de resumen arriba de los campos (como `EditUserForm`): "Cambiará: Nombres, Habitación". Sin cambios, no aparece. Usa `aria-live="polite"`.
  - La Server Action compara con la fila actual y actualiza solo los campos distintos. Sin cambios, devuelve `success` sin escribir.
- **Server Action `updateElderly(elderlyId, formData)`** con el cliente de sesión. Solo admin activo y solo adultos mayores `active` de su guardería.
- **Resultado:**
  - Éxito: se cierra el modal, el perfil se actualiza (`refresh()`) y aparece el toast "Cambios guardados".
  - Error de validación del servidor: errores en los campos, como el alta.
  - Otro error: toast de error dentro del modal, que sigue abierto con los datos ingresados.
- **Componente compartido de la línea de resumen:** `account/components/ProfileChangesSummary.tsx` pasa a `shared/components/ChangesSummary.tsx`, que recibe las etiquetas ya traducidas. Lo usan `EditUserForm` y el modal nuevo.
- **Documentación:** `pantallas-pendientes.md` (punto 12) y `BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- Archivar y reactivar un adulto mayor, y editar uno `archived`: lo resuelve la **siguiente spec (SPEC 34)**, junto con la entrada "Reactivar un adulto mayor archivado" y el punto 13 de `pantallas-pendientes.md`.
- Cambiar el consentimiento de fotos desde el modal.
- Aviso o confirmación al cambiar de habitación (ver Riesgos).
- El botón "Resumen del día" del perfil (sigue enlazando a `/`).
- Tratamiento Don/Doña (entrada propia del BACKLOG).
- Título de pestaña de un archivado visible para el staff (entrada propia del BACKLOG).

---

## Modelo de datos

Esta feature no introduce tablas, columnas ni migraciones. Reusa `elderly` y `rooms`.

Tipos nuevos o modificados en `elderly/types.ts`:

```ts
// NewElderlyInput se renombra a ElderlyFormValues: lo usan el alta y la edición
export type ElderlyFormValues = {
  firstName: string;
  lastName: string;
  birthDate: string;
  enrolledAt: string;
  roomId: string;
  allergies: string; // texto libre: "Maní, Lactosa"
  medicalNotes: string;
};

export type ElderlyFormField = keyof ElderlyFormValues;
export type ElderlyFormErrors = Partial<Record<ElderlyFormField, string>>;

export type UpdateElderlyResult =
  | { status: "success" }
  | { status: "invalid"; errors: ElderlyFormErrors }
  | { status: "error" };

// ElderlyProfile suma:
//   canEdit: boolean;                 // admin y adulto mayor active
//   editValues: ElderlyFormValues;    // valores iniciales del modal
//   roomOptions: RoomOption[];        // todas las habitaciones; vacío si !canEdit
```

`NewElderlyField` y `NewElderlyErrors` se renombran igual. `CreateElderlyResult` no cambia de forma.

### Normalización y comparación

`elderly/diff-elderly-changes.ts` devuelve los campos cuyo valor normalizado difiere del inicial. Lo usan el modal (habilitar "Guardar" y la línea de resumen) y la Server Action (sin confiar en el cliente).

| Campo | Normalización antes de comparar |
| --- | --- |
| Nombres, Apellidos | `trim()` |
| Fechas, Habitación | sin cambios |
| Alergias | `parseAllergyTags(...)`, comparado como lista (orden y mayúsculas cuentan) |
| Notas médicas | `trim()`; vacío equivale a `null` |

### Mensajes

| Uso | Texto |
| --- | --- |
| Botón del perfil | Editar |
| Título del modal | Editar adulto mayor |
| Botones del modal | Cancelar / Guardar (Guardando… mientras guarda) |
| Línea de resumen | Cambiará: {campos separados por coma} |
| Etiquetas del resumen | Nombres, Apellidos, Fecha de nacimiento, Fecha de ingreso, Habitación, Alergias, Notas médicas |
| Toast de éxito | Cambios guardados |
| Toast de error | No pudimos guardar · Intenta de nuevo en un momento. (el mismo del alta) |

Las etiquetas del resumen viven en `elderly/elderly-field-labels.ts`.

---

## Archivos

```
elderly/
  types.ts                         # renombres, UpdateElderlyResult, campos nuevos de ElderlyProfile
  read-elderly-form-values.ts      # antes read-new-elderly-input.ts
  validate-elderly-form.ts         # antes validate-new-elderly.ts (mismas reglas)
  diff-elderly-changes.ts          # nuevo
  elderly-field-labels.ts          # nuevo
  build-elderly-profile.ts         # canEdit, editValues, roomOptions
  get-elderly-profile-source.ts    # lee todas las habitaciones solo si es admin
  actions/update-elderly.ts        # nuevo
  components/
    ElderlyForm.tsx                # antes AddElderlyForm.tsx: título, valores iniciales y modo edición
    ElderlyFormDialog.tsx          # nuevo: <dialog>, guardado y toasts compartidos
    AddElderlyDialog.tsx           # usa ElderlyFormDialog
    EditElderlyDialog.tsx          # nuevo: botón "Editar" + ElderlyFormDialog
    ElderlyProfileHeader.tsx       # EditElderlyDialog solo si canEdit
shared/components/ChangesSummary.tsx   # antes account/components/ProfileChangesSummary.tsx
users/components/EditUserForm.tsx      # usa ChangesSummary
```

---

## Plan de implementación

1. **Renombres sin cambio de comportamiento.** `NewElderly*` → `ElderlyForm*`, `read-new-elderly-input.ts` → `read-elderly-form-values.ts`, `validate-new-elderly.ts` → `validate-elderly-form.ts`, `AddElderlyForm.tsx` → `ElderlyForm.tsx`. Prueba manual: "Agregar adulto mayor" funciona igual.
2. **`ChangesSummary` compartido.** Mover `ProfileChangesSummary` a `shared/components/ChangesSummary.tsx` con `fieldLabels: string[]`. `EditUserForm` le pasa las etiquetas traducidas. Prueba manual: "Editar staff" muestra la misma línea.
3. **`ElderlyFormDialog`.** Extraer de `AddElderlyDialog` el `<dialog>`, el bloqueo de cierre mientras guarda, el reinicio del formulario y los toasts. Recibe el botón disparador, el título, los valores iniciales, la acción y el toast de éxito. `AddElderlyDialog` queda como envoltorio. Prueba manual: el alta funciona igual.
4. **Modo edición de `ElderlyForm`.** Valores iniciales por props (`defaultValue` en cada campo), título por props y, si recibe `initialValues` de edición, "Guardar" deshabilitado sin cambios y `ChangesSummary` arriba de los campos. Crear `diff-elderly-changes.ts` y `elderly-field-labels.ts`.
5. **Datos del perfil.** `getElderlyProfileSource` lee todas las habitaciones de la guardería solo para el admin. `buildElderlyProfile` arma `canEdit`, `editValues` y `roomOptions`.
6. **Server Action `updateElderly`.** Verifica admin, lee la fila con el cliente de sesión (sin fila o `archived` → `error`), valida con `validateElderlyForm`, calcula el diff contra la fila, actualiza solo los campos distintos (alergias con `parseAllergyTags`, notas vacías como `null`) y llama a `refresh()`.
7. **Botón del perfil.** `EditElderlyDialog` en `ElderlyProfileHeader` solo si `canEdit`; si no, no se renderiza nada. Toast "Cambios guardados" al guardar.
8. **Documentación.** Marcar el punto 12 de `pantallas-pendientes.md` como resuelto en SPEC 33. En `BACKLOG.md`, mantener `[ ]` en "Botones "Editar" y "Resumen del día" del perfil" y dejar en el **Qué** solo "Resumen del día".

---

## Criterios de aceptación

- [ ] El admin ve "Editar" en el perfil de un adulto mayor `active`, en la misma ubicación y estilo del mockup.
- [ ] El admin no ve "Editar" en el perfil de un adulto mayor `archived`.
- [ ] El staff no ve "Editar" en ningún perfil.
- [ ] Pulsar "Editar" abre el modal "Editar adulto mayor" con los siete campos precargados con los valores actuales.
- [ ] "Habitación" lista todas las habitaciones de la guardería, con la actual seleccionada.
- [ ] Al abrir el modal, "Guardar" está deshabilitado y no se ve la línea "Cambiará: …".
- [ ] Al cambiar Nombres y Habitación se lee "Cambiará: Nombres, Habitación" y "Guardar" se habilita.
- [ ] Al volver a los valores originales, la línea desaparece y "Guardar" se deshabilita.
- [ ] Agregar solo espacios al final de Nombres no cuenta como cambio.
- [ ] Guardar con datos válidos cierra el modal, muestra el toast "Cambios guardados" y el perfil muestra los datos nuevos sin recargar.
- [ ] Solo se actualizan en `elderly` las columnas que cambiaron (verificable en `updated_at` y en los valores de la fila).
- [ ] Las validaciones del alta aplican igual (nombre vacío, fecha de nacimiento futura, ingreso anterior al nacimiento, más de 15 alergias, notas de más de 2000 caracteres).
- [ ] Vaciar Notas médicas guarda `null` y el bloque de notas desaparece del perfil.
- [ ] Llamar a `updateElderly` como staff o sobre un `archived` devuelve `error` y no modifica la fila.
- [ ] Si el guardado falla, el modal sigue abierto con los datos ingresados y aparece el toast de error.
- [ ] Cancelar o Esc cierra el modal sin guardar; al reabrirlo muestra los valores actuales.
- [ ] "Agregar adulto mayor" en `/elderly` funciona igual que antes.
- [ ] "Editar staff", "Editar familiar" y "Editar perfil" siguen mostrando la línea "Cambiará: …".
- [ ] `npm run lint` y `npm run build` pasan sin errores.

---

## Decisiones

- **Sí:** reusar el formulario del alta (`ElderlyForm`). Lo pide el mockup y evita duplicar campos y validaciones.
- **No:** un formulario de edición aparte. Duplicaría la validación y el layout.
- **Sí:** extraer `ElderlyFormDialog`. El bloqueo de cierre mientras guarda y los toasts son los mismos en alta y edición.
- **Sí:** solo admin y solo `active`. Igual que el switch de fotos y "Vincular"; la RLS solo deja editar al admin.
- **Sí:** regla "solo se guarda lo que cambió" de SPEC 31, con la línea de resumen arriba de los campos. Son siete campos y el admin debe ver qué va a cambiar.
- **Sí:** el cliente envía el formulario completo y el servidor calcula el diff. Difiere de SPEC 31 (que envía solo lo cambiado) porque "Fecha de ingreso" se valida contra "Fecha de nacimiento" aunque solo cambie una.
- **Sí:** mover `ProfileChangesSummary` a `shared/components/ChangesSummary.tsx`. Ya no es solo de `account/`.
- **Sí:** alergias comparadas como lista ya parseada. Cambiar "maní" por "Maní" cuenta como cambio; reordenar también.
- **No:** aviso al cambiar de habitación. Decisión del usuario (ver Riesgos).
- **No:** editar `photo_consent` en el modal. Ya se cambia desde el perfil (SPEC 32).
- **No:** cambios de base de datos. La RLS y los permisos por columna ya lo permiten.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Cambiar de habitación cambia qué posts `room` ven sus familiares: la regla de visibilidad usa la habitación **actual** del adulto mayor, así que dejan de ver los de la habitación anterior y pasan a ver todos los de la nueva, incluidos los anteriores al cambio. Lo mismo para el staff asignado. | Comportamiento esperado de la regla de visibilidad actual. Se documenta aquí; si se quiere avisar o conservar el historial, va en otra spec. |
| Otro admin edita al mismo adulto mayor al mismo tiempo. | La Server Action compara contra la fila actual: solo escribe lo que difiere; gana el último en guardar. |
| Los renombres rompen imports del alta. | Pasos 1–3 sin cambio de comportamiento, con prueba manual del alta en cada uno. |

---

## Lo que **no** está en esta spec

- Archivar y reactivar un adulto mayor, y editar uno `archived` (SPEC 34).
- Consentimiento de fotos en el modal.
- Aviso al cambiar de habitación.
- Botón "Resumen del día".
- Tratamiento Don/Doña.

Cada uno, si llega, va en su propia spec.
