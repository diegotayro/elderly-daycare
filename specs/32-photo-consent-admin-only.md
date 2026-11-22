# SPEC 32 — Consentimiento de fotos: solo el admin lo cambia

> **Estado:** Aprobado
> **Depende de:** SPEC 16, SPEC 17, SPEC 31
> **Fecha:** 2026-11-21
> **Objetivo:** Que el admin cambie el consentimiento de fotos de un adulto mayor desde `/elderly/[id]` y que el familiar, en lugar de un switch, vea el estado y un botón "Solicitar cambio" que por ahora no envía nada.

---

## Por qué esta spec

Un adulto mayor puede tener varios familiares, y `elderly.photo_consent` es un solo valor. Si cada familiar pudiera cambiarlo, uno podría deshacer la decisión de otro. Por eso el admin es la única autoridad: registra el consentimiento y lo cambia cuando la familia se lo pide.

Hoy el admin no tiene ninguna pantalla para cambiarlo: el modal "Editar adulto mayor" (punto 12 de `pantallas-pendientes.md`) no existe. La RLS y los permisos de columna ya lo permiten (`elderly_update_admin` y `grant update (... photo_consent ...)`), así que **no hay cambios de base de datos**.

El mockup `familia-cuenta.dc.html` muestra un switch "Fotos". Esta spec lo reemplaza por el estado en texto y el botón "Solicitar cambio", por decisión del usuario. `perfil-adulto-mayor.dc.html` no muestra el consentimiento: se agrega como una fila más de la lista de datos.

Resuelve la entrada del BACKLOG "Switch de consentimiento de fotos del familiar": se descarta el switch del familiar y se reemplaza por esta regla. Resuelve en parte el punto 12 de `pantallas-pendientes.md` (la parte de `photo_consent`).

---

## Alcance

**Dentro:**

- **Fila "Fotos" en `/elderly/[id]`**, la última de la lista de datos (después de "Ingreso"):

  | Quién mira | Adulto mayor | Se ve |
  | --- | --- | --- |
  | Admin | `active` | Switch, con el estado "Permitidas" o "No permitidas" junto a él |
  | Admin | `archived` | Solo el texto "Permitidas" o "No permitidas" |
  | Staff | (solo ve `active`) | Solo el texto "Permitidas" o "No permitidas" |

- **Guardado del switch del admin:**
  - Guarda al tocarlo, sin modal de confirmación, con estado optimista (igual que `NotificationToggle`).
  - Si sale bien, aparece el toast "Consentimiento de fotos actualizado.".
  - Si falla, el switch vuelve a su valor anterior y aparece el toast "No se pudo guardar el consentimiento de fotos. Intenta de nuevo.".
  - El nuevo valor se aplica al instante a las reglas que ya existen: etiquetar con fotos (`post_elderly`, `post_photos`, Storage) y el aviso de `room_has_elderly_without_photo_consent`.
- **Server Action `updatePhotoConsent(elderlyId, value)`** con el cliente de sesión. Solo admin activo y solo adultos mayores `active` de su guardería.
- **Tarjeta de adultos mayores de `/family/account`:**
  - Se quita el switch (`PhotoConsentIndicator`).
  - Cada adulto mayor muestra "Fotos" con su estado en texto: "Permitidas" o "No permitidas".
  - Botón "Solicitar cambio" (botón, no link) solo en los adultos mayores `active`.
  - Al pulsarlo no se guarda ni se envía nada. Aparece el toast "Por ahora, comunícate con la guardería para cambiarlo.".
- **`/relatives/[id]` (admin):** usa la misma tarjeta. Muestra el estado en texto, **sin** el botón "Solicitar cambio" y sin switch.
- **`/activate-account`:** sin cambios. La casilla de consentimiento se mantiene y `accept_invitation` sigue aplicando "solo el `false` cambia algo".
- **Switch compartido:** el dibujo del switch (pista y círculo) pasa a un componente común, que usan `NotificationToggle` y el switch nuevo.
- **Documentación:** `flujos-de-procesos.md` (regla del consentimiento), `database-schema.md` (nota de `photo_consent`), `pantallas-pendientes.md` y `BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- Que "Solicitar cambio" envíe la solicitud al admin (aviso en `/notices`, correo o tabla de solicitudes). Se anota en el BACKLOG.
- Que el familiar cambie el consentimiento por su cuenta, en cualquier sentido.
- Consentimiento por familiar (en `guardian_elderly`) o registro de quién pidió el cambio.
- El modal "Editar adulto mayor" completo (habitación y demás datos): sigue en el punto 12 de `pantallas-pendientes.md` y lo resuelve la **siguiente spec (SPEC 33)**.
- Switch en `/relatives/[id]`.
- Cambiar el consentimiento de un adulto mayor `archived`.

---

## Modelo de datos

### Base de datos

Esta spec no introduce tablas, columnas, funciones ni policies. **No hay migración.**

- `elderly.photo_consent` (`boolean`, NOT NULL default `true`) ya existe.
- `elderly_update_admin` ya permite el update del admin en adultos mayores de su guardería.
- `grant update (... photo_consent ...)` ya incluye la columna.
- `shared/database/types.ts` no cambia.

### Tipos de la app

```ts
// elderly/types.ts: campos nuevos de ElderlyProfile
export type ElderlyProfile = {
  // ...campos actuales
  photoConsent: boolean;
  canEditPhotoConsent: boolean; // admin y adulto mayor active
};

// elderly/types.ts
export type PhotoConsentResult = { status: "ok" } | { status: "error" };
```

```ts
// elderly/photo-consent-labels.ts (nuevo): único lugar del copy del estado
export function photoConsentLabel(allowed: boolean): string; // "Permitidas" | "No permitidas"
```

`FamilyElderlyCard` recibe una prop nueva `showConsentRequest: boolean`: `true` en `/family/account` y `false` en `/relatives/[id]`.

### Server Action

**`elderly/actions/update-photo-consent.ts`:** `updatePhotoConsent(elderlyId: string, value: boolean): Promise<PhotoConsentResult>`.

- Valida que `elderlyId` sea un UUID (`isUuid`) y que `value` sea `boolean`.
- Con `getCurrentUser()`, exige un admin `active`. Si no, devuelve `error`.
- Con el cliente de sesión: `update elderly set photo_consent = value where id = elderlyId and status = 'active'`, con `.select("id")`.
- 0 filas actualizadas (otra guardería, `archived` o inexistente, porque la RLS lo filtra sin error) → `error`.
- Es idempotente: repetir la llamada con el mismo valor no cambia el resultado.
- Al terminar, `refresh()`, como `updateNotificationPreference`.

### Copy

| Clave | Texto |
| --- | --- |
| Etiqueta de la fila | "Fotos" |
| Estado `true` | "Permitidas" |
| Estado `false` | "No permitidas" |
| Botón del familiar | "Solicitar cambio" |
| Toast del familiar | "Por ahora, comunícate con la guardería para cambiarlo." |
| Toast de éxito del admin | "Consentimiento de fotos actualizado." |
| Toast de error del admin | "No se pudo guardar el consentimiento de fotos. Intenta de nuevo." |

---

## Estructura de archivos

**Nuevos:**

- `shared/components/SwitchTrack.tsx`: dibujo del switch (`aria-hidden`), sin lógica. Recibe `enabled`.
- `elderly/photo-consent-labels.ts`: `photoConsentLabel`.
- `elderly/photo-consent-messages.ts`: toasts del admin.
- `elderly/actions/update-photo-consent.ts`: Server Action.
- `elderly/components/PhotoConsentToggle.tsx`: switch del admin (`role="switch"`, `aria-checked`, estado optimista y toasts).
- `family/components/PhotoConsentRequestButton.tsx`: botón "Solicitar cambio" con su toast.

**Modificados:**

- `account/components/NotificationToggle.tsx`: usa `SwitchTrack`.
- `shared/components/DetailsList.tsx`: `value` acepta `ReactNode`, para poder mostrar el switch.
- `elderly/types.ts`: `photoConsent`, `canEditPhotoConsent` y `PhotoConsentResult`.
- `elderly/build-elderly-profile.ts`: calcula los dos campos nuevos.
- `elderly/components/ElderlyDetailsList.tsx`: fila "Fotos".
- `family/components/FamilyElderlyCard.tsx`: estado en texto y `showConsentRequest`.
- La vista de `/family/account` y la de `/relatives/[id]` que renderizan `FamilyElderlyCard`: pasan `showConsentRequest`.
- `references/documents/flujos-de-procesos.md`, `references/documents/database-schema.md`, `references/documents/pantallas-pendientes.md` y `specs/BACKLOG.md`.

**Eliminados:**

- `family/components/PhotoConsentIndicator.tsx`.

---

## Plan de implementación

1. **Switch compartido.**
   - Extraer `SwitchTrack` de `NotificationToggle`.
   - Prueba: los switches de `/account` y de `/staff/[id]` se ven y funcionan igual que antes.
2. **Estado en el perfil del adulto mayor.**
   - `photoConsentLabel`, los campos nuevos de `ElderlyProfile`, `value: ReactNode` en `DetailsList` y la fila "Fotos" en solo lectura.
   - Prueba: admin y staff ven "Permitidas" o "No permitidas" según la DB.
3. **Switch del admin.**
   - Cargar el skill `frontend-design:frontend-design`.
   - `updatePhotoConsent`, `photo-consent-messages.ts` y `PhotoConsentToggle` en la fila "Fotos" cuando `canEditPhotoConsent`.
   - Prueba: el admin cambia el switch, recarga y ve el valor guardado. Con un adulto mayor `archived` no hay switch.
4. **Tarjeta del familiar.**
   - `PhotoConsentRequestButton`, `FamilyElderlyCard` con el estado en texto y `showConsentRequest`, y borrar `PhotoConsentIndicator`.
   - Prueba: en `/family/account`, "Solicitar cambio" muestra el toast y no hace ninguna petición. En `/relatives/[id]` no aparece el botón.
5. **Documentación y BACKLOG.**
   - Actualizar los documentos de referencia y el BACKLOG según "Entradas de BACKLOG".
6. **Prueba real y capturas.**
   - Con Playwright (capturas en `.playwright-mcp/`), en escritorio y móvil: `/elderly/[id]` como admin y como staff, `/family/account` y `/relatives/[id]`.
   - Anotar el `photo_consent` del adulto mayor de prueba antes y restaurarlo al terminar.

---

## Criterios de aceptación

**Admin en `/elderly/[id]`:**

- [x] Con un adulto mayor `active`, la última fila de la lista de datos es "Fotos" con un switch que refleja `photo_consent`.
- [x] Tocar el switch guarda el valor nuevo en `elderly.photo_consent`; al recargar, el switch conserva el valor.
- [x] Al guardar bien aparece "Consentimiento de fotos actualizado.".
- [x] Si la Server Action falla (por ejemplo, sin red), el switch vuelve a su valor y aparece "No se pudo guardar el consentimiento de fotos. Intenta de nuevo.".
- [x] El switch se maneja con el teclado (Tab y Espacio o Enter) y un lector de pantalla lo anuncia como switch con su estado (`role="switch"`, `aria-checked`).
- [x] Con un adulto mayor `archived`, la fila "Fotos" muestra solo el texto, sin switch.
- [x] Después de pasar el switch a "No permitidas", subir una foto a un post que etiqueta a ese adulto mayor falla, como antes de esta spec.

**Staff en `/elderly/[id]`:**

- [x] La fila "Fotos" muestra "Permitidas" o "No permitidas", sin switch.

**`updatePhotoConsent`:**

- [x] Llamada por un staff o un familiar devuelve `error` y no cambia la DB.
- [x] Llamada por un admin para un adulto mayor de otra guardería devuelve `error` y no cambia la DB.
- [x] Llamada por un admin para un adulto mayor `archived` devuelve `error` y no cambia la DB.
- [x] Con un `elderlyId` que no es UUID o un `value` que no es `boolean`, devuelve `error`.

**Familiar en `/family/account`:**

- [x] No hay switch de fotos.
- [x] Cada adulto mayor muestra "Fotos" y "Permitidas" o "No permitidas" según la DB.
- [x] Los adultos mayores `active` tienen el botón "Solicitar cambio"; los `archived`, no.
- [x] Pulsar "Solicitar cambio" muestra "Por ahora, comunícate con la guardería para cambiarlo." y no hace ninguna petición al servidor.

**Admin en `/relatives/[id]`:**

- [x] La tarjeta "ADULTOS MAYORES" muestra el estado en texto, sin "Solicitar cambio" ni switch.

**Sin regresiones:**

- [x] Los switches de notificaciones de `/account` y `/staff/[id]` se ven y guardan igual que antes.
- [x] Activar una invitación con la casilla de consentimiento desmarcada sigue dejando `photo_consent = false`.
- [x] `family/components/PhotoConsentIndicator.tsx` ya no existe y nada lo importa.
- [x] `npm run lint` y `npm run build` pasan sin errores.

**Documentación:**

- [x] `flujos-de-procesos.md`, `database-schema.md`, `pantallas-pendientes.md` y `BACKLOG.md` están actualizados según esta spec.

---

## Decisiones tomadas y descartadas

- **Sí:** el admin es la única autoridad sobre `photo_consent` después de la activación, en los dos sentidos. Un adulto mayor puede tener varios familiares y un solo valor; así nadie deshace la decisión de otro.
- **No:** switch del familiar que solo pasa de `true` a `false`. Era la idea de la entrada del BACKLOG. Se descarta para que haya una sola autoridad.
- **No:** consentimiento por familiar en `guardian_elderly`, con el valor final calculado. Es más justo, pero agrega una migración, un trigger o una función y cambios en los helpers. Puede llegar en otra spec.
- **Sí:** "Solicitar cambio" sin acción y con un toast que indica qué hacer. Un botón que no responde confunde y no es accesible.
- **No:** enviar la solicitud en esta spec. Por correo hoy solo llega al email de la cuenta de Resend (ver BACKLOG "Dominio verificado en Resend"). Un aviso en `/notices` necesita una tabla nueva. Se deja para una spec futura.
- **Sí:** `photo_consent` sigue empezando en `true`, aunque el adulto mayor no tenga familiares vinculados. Decisión del usuario; el admin puede pasarlo a "No permitidas" desde el perfil.
- **Sí:** mantener la casilla de `/activate-account`. Es el momento natural para preguntar, y "siempre gana el no" sigue valiendo al vincular.
- **Sí:** guardado inmediato del switch, sin confirmación, con estado optimista. Es el mismo patrón que las notificaciones (SPEC 31) y el cambio se revierte con otro toque.
- **Sí:** el switch va solo en `/elderly/[id]`. El consentimiento es del adulto mayor; `/relatives/[id]` es el perfil del familiar.
- **Sí:** el staff ve el estado en solo lectura. Le sirve saberlo antes de publicar fotos.
- **No:** cambiar el consentimiento de un `archived`. No se puede etiquetar, así que el cambio no tendría efecto.
- **Sí:** `updatePhotoConsent` con el cliente de sesión. La RLS y el permiso de columna ya cubren el caso; no es un uso de `service_role`.
- **Sí:** `photoConsentLabel` en `elderly/`, porque el consentimiento es un dato del adulto mayor. `family/` ya importa desde `elderly/` (`avatar-tones`).
- **Sí:** se aparta del mockup `familia-cuenta.dc.html` (switch → texto y botón) por decisión del usuario.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El familiar espera que "Solicitar cambio" avise a la guardería | El toast dice que, por ahora, tiene que comunicarse con la guardería. El envío real queda en el BACKLOG. |
| Un admin pasa a "Permitidas" un adulto mayor cuyo familiar se negó al activar | Es su decisión como autoridad. No hay registro de quién se negó (consentimiento por familiar fuera de alcance). |
| Posts `room` y `daycare` con fotos ya publicadas antes del cambio a "No permitidas" | No cambia: ya era responsabilidad del personal. Las fotos publicadas no se borran solas. |

---

## Entradas de BACKLOG

**Resuelve:**

- **"Switch de consentimiento de fotos del familiar":** `- [x] **Estado:** resuelto en SPEC 32`. En **Notas**, agregar: "Se descartó el switch del familiar: el admin es la única autoridad y el familiar tiene el botón «Solicitar cambio» (SPEC 32)".

**Agrega** (sección de familiares, como pendiente):

- **"Enviar la solicitud de cambio de consentimiento de fotos":** hoy "Solicitar cambio" de `/family/account` solo muestra un toast. Opciones: aviso en `/notices` del admin (tabla nueva y un `kind` nuevo en `list_notices`) o correo con Resend (requiere dominio verificado). Origen: SPEC 32 (`family/components/PhotoConsentRequestButton.tsx`).

**Documentos de referencia:**

- `flujos-de-procesos.md`, "Regla del consentimiento de fotos": los tres primeros puntos se mantienen. Se agrega que el admin lo cambia desde `/elderly/[id]` (solo adultos mayores `active`). El último punto pasa a: "En «Mi cuenta» del familiar, el estado de fotos es solo de lectura; el botón «Solicitar cambio» por ahora solo indica que se comunique con la guardería".
- `database-schema.md`, columna `photo_consent` de `elderly`: agregar que solo el admin lo cambia después de la activación, con su sesión (`elderly_update_admin`).
- `pantallas-pendientes.md`, punto 12: quitar `photo_consent` (resuelto en SPEC 32); queda la habitación y el resto de los datos, que resuelve SPEC 33.

---

## Lo que **no** está en esta spec

- Enviar la solicitud de cambio al admin (aviso, correo o tabla).
- Que el familiar cambie el consentimiento por su cuenta.
- Consentimiento por familiar o registro de quién lo pidió.
- El modal "Editar adulto mayor" completo (va en SPEC 33).
- Switch en `/relatives/[id]` o para adultos mayores `archived`.
- Cambios de base de datos o migraciones.

Cada uno de esos, si llega, va en su propia spec.
