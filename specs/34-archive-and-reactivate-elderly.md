# SPEC 34 — Archivar y reactivar un adulto mayor

> **Estado:** Aprobado
> **Depende de:** SPEC 16, SPEC 17, SPEC 23, SPEC 33
> **Fecha:** 2026-11-22
> **Objetivo:** Que el admin archive (con confirmación) y reactive a un adulto mayor desde la cabecera de `/elderly/[id]`, cancelando sus invitaciones pendientes al archivar.

---

## Por qué esta spec

El admin ya ve a los archivados en `/elderly` (sección "ARCHIVADOS", SPEC 16) y en su perfil (badge "ARCHIVADO"), pero no puede archivar ni reactivar desde la UI. SPEC 33 dejó para esta spec el archivado, la reactivación y la edición de un `archived`.

La RLS (`elderly_update_admin`, `invitations_update_admin`) y los permisos por columna (`elderly.status`, `invitations.status`) ya permiten ambas escrituras con la sesión del admin. **No hay cambios de base de datos.**

Resuelve la entrada del BACKLOG "Reactivar un adulto mayor archivado" y el punto 13 de `pantallas-pendientes.md`.

---

## Alcance

**Dentro:**

- **Botones en la cabecera de `/elderly/[id]`** (sin mockup; mismo estilo que los botones de estado de `/staff/[id]`, SPEC 23):
  - `active`: "Archivar" junto a "Editar".
  - `archived`: solo "Reactivar".
  - Solo los ve el admin. El staff no ve ninguno.
- **Archivar:**
  - Abre un modal de confirmación (ver Mensajes). Mientras archiva, Esc y "Cancelar" no cierran el modal.
  - Server Action `archiveElderly(elderlyId)`: solo admin activo y solo adultos mayores `active` de su guardería.
    1. `update elderly set status = 'archived'` con `.eq("status", "active")` y `.select("id")` (0 filas → `error`).
    2. `update invitations set status = 'cancelled'` de las invitaciones `pending` de ese adulto mayor (vencidas por fecha incluidas), en una sola sentencia.
    3. Si el paso 2 falla, revierte el status a `active` y devuelve `error`.
    4. `refresh()`.
  - Éxito: se cierra el modal, el perfil muestra el badge "ARCHIVADO", cambia el botón a "Reactivar", desaparecen "Editar", "Vincular", el switch de fotos editable y las filas PENDIENTE, y aparece el toast de éxito.
  - Error: el modal sigue abierto y aparece el toast de error.
- **Reactivar:**
  - Sin confirmación. El botón muestra "Reactivando…" y queda deshabilitado mientras guarda.
  - Server Action `reactivateElderly(elderlyId)`: solo admin activo y solo adultos mayores `archived` de su guardería. `update elderly set status = 'active'` con `.eq("status", "archived")` y `.select("id")` (0 filas → `error`). `refresh()`.
  - Éxito: el perfil vuelve a su estado `active` (badge fuera, "Editar" y "Archivar" visibles) y aparece el toast de éxito. Las invitaciones canceladas no vuelven; el admin genera nuevas con "Vincular".
  - Error: toast de error.
- **Se conservan** al archivar: `staff_elderly`, `guardian_elderly`, posts, fotos, reacciones y comentarios. No cambia la habitación ni el `photo_consent`.
- **Modal de confirmación compartido:** `staff/components/ConfirmStaffActionDialog.tsx` pasa a `shared/components/ConfirmDialog.tsx`, que recibe el contenido (título, descripción, etiquetas de botones) y un contenido extra opcional (`children`). El staff le pasa la lista de "se quedarán sin cuidador/a" como `children`.
- **Documentación:** `BACKLOG.md`, `pantallas-pendientes.md` (punto 13) y `references/documents/flujos-de-procesos.md` (flujo nuevo "Archivar y reactivar adulto mayor").

**Fuera de alcance (para specs futuras):**

- Editar un adulto mayor `archived`: decisión de esta spec (ver Decisiones). Para editarlo, primero se reactiva.
- Archivar o reactivar desde las tarjetas de `/elderly`.
- Confirmación al reactivar.
- Reasignar staff o avisar qué staff lo tenía asignado.
- Restaurar las invitaciones canceladas al reactivar.
- Título de pestaña de un archivado visible para el staff (entrada propia del BACKLOG).
- Modal de confirmación para archivar familiares (punto 10 de `pantallas-pendientes.md`).

---

## Modelo de datos

Esta feature no introduce tablas, columnas ni migraciones. Reusa `elderly` e `invitations`.

Tipos nuevos o modificados en `elderly/types.ts`:

```ts
export type ElderlyStatusResult = { status: "success" } | { status: "error" };

// ElderlyProfile suma:
//   canArchive: boolean;     // admin y adulto mayor active
//   canReactivate: boolean;  // admin y adulto mayor archived
```

`canEdit`, `canLinkRelative` y `canEditPhotoConsent` siguen exigiendo `active`.

Tipo en `shared/components/ConfirmDialog.tsx`:

```ts
export type ConfirmDialogContent = {
  title: string;
  description: string;
  dismissLabel: string;
  confirmLabel: string;
  pendingLabel: string;
};
```

`StaffConfirmContent` pasa a ser `ConfirmDialogContent & { showUncoveredElderly: boolean }`.

### Mensajes

Viven en `elderly/elderly-status-messages.ts`.

| Uso | Texto |
| --- | --- |
| Botones del perfil | Archivar / Reactivar (Reactivando… mientras guarda) |
| Título del modal | ¿Archivar a {nombre completo}? |
| Descripción del modal | Ya no aparecerá en Activos ni se podrá etiquetar en publicaciones nuevas. Se cancelarán sus invitaciones pendientes. Sus publicaciones se conservan y puedes reactivarlo después. |
| Botones del modal | Cancelar / Archivar (Archivando… mientras guarda) |
| Toast al archivar | Adulto mayor archivado · {nombre completo} ya no aparece en Activos. |
| Toast al reactivar | Adulto mayor reactivado · {nombre completo} vuelve a aparecer en Activos. |
| Error al archivar | No pudimos archivar al adulto mayor · Inténtalo de nuevo. |
| Error al reactivar | No pudimos reactivar al adulto mayor · Inténtalo de nuevo. |

---

## Archivos

```
elderly/
  types.ts                           # ElderlyStatusResult, canArchive, canReactivate
  build-elderly-profile.ts           # canArchive, canReactivate
  elderly-status-messages.ts         # nuevo
  actions/archive-elderly.ts         # nuevo
  actions/reactivate-elderly.ts      # nuevo
  components/
    ElderlyStatusActions.tsx         # nuevo: botones, modal y toasts
    ElderlyProfileHeader.tsx         # ElderlyStatusActions junto a EditElderlyDialog
shared/components/ConfirmDialog.tsx  # antes staff/components/ConfirmStaffActionDialog.tsx
staff/staff-status-messages.ts       # StaffConfirmContent extiende ConfirmDialogContent
staff/components/StaffStatusActions.tsx  # usa ConfirmDialog con la lista como children
```

---

## Plan de implementación

1. **`ConfirmDialog` compartido.** Mover `ConfirmStaffActionDialog` a `shared/components/ConfirmDialog.tsx` con `content`, `children`, `onConfirm` y `onClose`. `StaffStatusActions` le pasa la lista de adultos mayores sin cuidador/a como `children` cuando `showUncoveredElderly`. Prueba manual: archivar, cancelar invitación y eliminar staff muestran el mismo modal.
2. **Datos del perfil.** `ElderlyStatusResult` y `canArchive` / `canReactivate` en `buildElderlyProfile`.
3. **Server Actions.** `archiveElderly` (archivar, cancelar invitaciones `pending`, revertir si falla) y `reactivateElderly`. Verifican admin activo con el cliente de sesión, como `updateElderly`.
4. **Mensajes y botones.** `elderly-status-messages.ts` y `ElderlyStatusActions` (modal para archivar, "Reactivando…" para reactivar, toasts). Se renderiza en `ElderlyProfileHeader` junto a `EditElderlyDialog`; la cabecera agrupa los botones en un contenedor con `flex-wrap` para que entren en móvil.
5. **Documentación.** En `BACKLOG.md`, "Reactivar un adulto mayor archivado" → `- [x] **Estado:** resuelto en SPEC 34`. En `pantallas-pendientes.md`, marcar el punto 13 como resuelto (la sección "ARCHIVADOS" existe desde SPEC 16; archivar y reactivar en SPEC 34). En `flujos-de-procesos.md`, agregar "Archivar y reactivar adulto mayor".

---

## Criterios de aceptación

- [x] El admin ve "Archivar" junto a "Editar" en el perfil de un adulto mayor `active`.
- [x] El admin ve solo "Reactivar" (sin "Editar" ni "Archivar") en el perfil de un `archived`.
- [x] El staff no ve "Archivar" ni "Reactivar" en ningún perfil.
- [x] Pulsar "Archivar" abre el modal con el título y la descripción de la tabla de Mensajes; "Cancelar" o Esc lo cierran sin cambios.
- [x] Confirmar archiva: la fila queda `archived`, el perfil muestra "ARCHIVADO" y "Reactivar", y aparece el toast "Adulto mayor archivado" sin recargar.
- [x] Al archivar, todas sus invitaciones `pending` quedan `cancelled` y las filas PENDIENTE desaparecen del perfil.
- [x] Al archivar, se conservan sus filas en `staff_elderly`, `guardian_elderly` y sus posts; `room_id` y `photo_consent` no cambian.
- [x] Tras archivar, aparece en la sección "ARCHIVADOS" de `/elderly` y no en "ACTIVOS".
- [x] Un código de invitación cancelado al archivar no funciona en `/activate-account`.
- [x] Mientras archiva, el modal no se cierra con Esc ni con "Cancelar".
- [x] Si archivar falla, el modal sigue abierto, aparece el toast de error y la fila y sus invitaciones quedan como estaban.
- [x] Pulsar "Reactivar" muestra "Reactivando…", deja la fila `active`, vuelven "Editar" y "Archivar" y aparece el toast "Adulto mayor reactivado".
- [x] Tras reactivar, las invitaciones canceladas siguen `cancelled` y "Vincular" permite generar una nueva.
- [x] Llamar a `archiveElderly` como staff o sobre un `archived` devuelve `error` y no modifica nada; igual `reactivateElderly` como staff o sobre un `active`.
- [ ] Archivar, cancelar invitación y eliminar staff en `/staff/[id]` siguen mostrando el modal igual que antes, incluida la lista "se quedarán sin cuidador/a".
- [x] La cabecera del perfil no se desborda a 375 px de ancho.
- [x] `npm run lint` y `npm run build` pasan sin errores.

---

## Decisiones

- **Sí:** botones en la cabecera del perfil. Igual que `/staff/[id]` (SPEC 23); la tarjeta del listado es un enlace completo.
- **No:** acciones en las tarjetas de `/elderly`.
- **Sí:** confirmación al archivar y no al reactivar. Mismo criterio que el staff: reactivar es inocuo y reversible.
- **Sí:** cancelar las invitaciones `pending` al archivar. `accept_invitation` ya rechaza códigos de un archivado, pero sin cancelarlas volverían a funcionar al reactivar.
- **No:** restaurar las invitaciones al reactivar. El admin genera nuevas con "Vincular".
- **Sí:** Server Action con dos escrituras y revertir si falla la segunda, como `archiveStaff` con el ban. Cancelar es una sola sentencia, así que no queda a medias.
- **No:** función RPC transaccional. Requeriría migración y una spec de base de datos para un caso que se cubre revirtiendo.
- **No:** editar un `archived`. Queda de solo lectura, como el switch de fotos y "Vincular"; para editarlo se reactiva. Cierra lo que SPEC 33 dejó para esta spec.
- **Sí:** quedarse en el perfil con `refresh()` y toast, como el staff.
- **Sí:** generalizar el modal de confirmación a `shared/components/ConfirmDialog.tsx`. Ya no es solo de `staff/`.
- **Sí:** texto fijo en el modal, sin conteo de invitaciones.
- **No:** cambios de base de datos. La RLS y los permisos por columna ya lo permiten.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Falla cancelar las invitaciones después de archivar. | Se revierte el status a `active` y se avisa el error; el modal sigue abierto para reintentar. Si también falla el revertir, se registra con `console.error` (igual que `archiveStaff`). |
| Un familiar acepta una invitación justo mientras se archiva. | `accept_invitation` exige `e.status = 'active'`: o la acepta antes de archivar (queda vinculado, como cualquier familiar) o falla después. |
| El staff asignado deja de verlo en su listado y en "Nueva publicación". | Comportamiento esperado: el staff no ve archivados y solo se etiquetan `active`. Al reactivar vuelve a verlo porque `staff_elderly` se conserva. |
| Mover `ConfirmStaffActionDialog` rompe el perfil del staff. | Paso 1 sin cambio de comportamiento, con prueba manual de las tres acciones del staff. |

---

## Lo que **no** está en esta spec

- Editar un adulto mayor `archived`.
- Acciones desde las tarjetas de `/elderly`.
- Confirmación al reactivar.
- Restaurar invitaciones al reactivar.
- Reasignar staff al archivar.

Cada uno, si llega, va en su propia spec.
