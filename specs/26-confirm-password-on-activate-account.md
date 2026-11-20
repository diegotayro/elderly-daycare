# SPEC 26 — Confirmar la contraseña en "Activar cuenta"

> **Estado:** Aprobado
> **Depende de:** SPEC 17, SPEC 21, SPEC 24
> **Fecha:** 2026-11-18
> **Objetivo:** Agregar en `/activate-account`, solo en el modo "CREAR CONTRASEÑA", un campo "CONFIRMAR CONTRASEÑA" validado en cliente y servidor con la misma regla y mensajes que `/create-password`.

---

## Por qué esta spec

SPEC 24 la planificó en "Specs siguientes": hoy `/activate-account` tiene un solo campo de contraseña y un familiar nuevo puede equivocarse al escribirla sin darse cuenta. `/create-password` (SPEC 21) ya pide confirmarla con `passwordConfirmation`.

La regla y los mensajes de la confirmación viven hoy solo en `validate-create-password.ts` y `create-password-messages.ts`, y el mensaje de la regla de contraseña está duplicado en los dos archivos de mensajes. Esta spec los extrae a `auth/validate-password.ts` para que los dos formularios usen lo mismo.

Resuelve del BACKLOG:

- "Activar con el consentimiento de fotos desmarcado" (la verificación manual de esta spec vuelve a activar con ese formulario, ahora con la casilla desmarcada).

---

## Alcance

**Dentro:**

- Campo "CONFIRMAR CONTRASEÑA" (`passwordConfirmation`) en `ActivateAccountForm`, bajo la contraseña y antes de la casilla de fotos, solo en el modo `create`.
- Si el servidor cambia el modo a `existing` ("Este email ya tiene cuenta. Ingresa tu contraseña."), el campo se oculta y su error desaparece.
- Validación de la confirmación en el cliente (`validateActivateAccount`) y en la Server Action `activateAccount`, solo en el modo `create`.
- Extraer a `auth/validate-password.ts` la validación de la confirmación y los mensajes de contraseña compartidos (regla, confirmación vacía y no coincide), y usarlos desde `/create-password` y `/activate-account`.
- Checklist manual (la ejecuta el usuario) con activación de un familiar nuevo con el consentimiento de fotos desmarcado, y SQL de solo lectura de Claude para preparar y comprobar la limpieza.
- Documentación: SPEC 17 (criterio del consentimiento), SPEC 24 ("Specs siguientes") y `BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- Editar el mockup `activar-cuenta.dc.html`.
- Mostrar u ocultar la contraseña (botón "ver").
- Cambiar la regla de contraseña o validarla distinto en el modo `existing`.
- Migraciones, RLS o funciones de la DB.
- Otras entradas del BACKLOG de `/activate-account` (límite de intentos, mensaje de código no válido, cuentas sin vínculos).

---

## Modelo de datos

No introduce datos en la DB. Cambian los tipos del formulario en `auth/types.ts`:

```ts
export type ActivateAccountInput = {
  code: string;
  email: string;
  password: string;
  passwordConfirmation: string; // "" si el campo no se muestra (modo existing)
  photoConsent: boolean;
};

export type ActivateAccountField =
  | "code"
  | "email"
  | "password"
  | "passwordConfirmation";
```

Y en `auth/validate-password.ts` (nombres orientativos de lo compartido):

```ts
export const passwordMessages = {
  rule: "La contraseña debe tener al menos 8 caracteres, con letras y números.",
  confirmationRequired: "Vuelve a escribir la contraseña.",
  confirmationMismatch: "Las contraseñas no coinciden.",
} as const;

export function isValidPassword(password: string): boolean;
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined;
```

`createPasswordMessages` y `activateAccountMessages` dejan de definir sus propios textos de contraseña y reusan `passwordMessages`.

---

## Diseño

- Igual que el campo "CONFIRMAR CONTRASEÑA" de `CreatePasswordForm`: `AuthField` con `id="passwordConfirmation"`, `type="password"`, `autoComplete="new-password"` y el mismo espaciado (`mb-[18px]`).
- El mockup `activar-cuenta.dc.html` no tiene el campo; se toma de `/create-password` y el mockup no se edita (decisión del usuario).
- El orden de foco en errores es `code`, `email`, `password`, `passwordConfirmation`.

---

## Checklist

Capturas en `.playwright-mcp/`.

**Antes de empezar**

- `.env` con `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL=onboarding@resend.dev` y `APP_URL=http://localhost:3000`; `npm run dev` corriendo.
- `TU_EMAIL` es el email de tu cuenta de Resend y no tiene usuario ni invitaciones (lo confirma el paso 1 del plan).

**A. Formulario (como admin, invita `TU_EMAIL` a Alberto Díaz; abre el link en ventana privada)**

1. Modo "CREAR CONTRASEÑA": se ve "CONFIRMAR CONTRASEÑA" bajo la contraseña. Captura.
2. Confirmación vacía: "Vuelve a escribir la contraseña.". Distinta: "Las contraseñas no coinciden.". El campo tiene `aria-invalid="true"` y `aria-describedby`, y recibe el foco si es el primer error. Al editarlo, el error desaparece.
3. `/create-password` sigue mostrando los mismos mensajes (revisar con una contraseña distinta en la confirmación).

**B. Activación con el consentimiento desmarcado**

1. Desmarca "Autorizo a la guardería a tomar y compartir fotos…", escribe la misma contraseña válida en los dos campos y activa.
2. Se inicia sesión y redirige a `/family`.
3. En la base: usuario `relative` `active`, fila en `guardian_elderly`, invitación `accepted` y `elderly.photo_consent = false` en Alberto.

**B2. Cambio de modo con cuenta existente**

1. Cierra sesión. Como admin, invita `TU_EMAIL` a Rosa Méndez. Abre `/activate-account` sin código y escribe a mano el código, `TU_EMAIL` y la misma contraseña válida en los dos campos.
2. Aparece "Este email ya tiene cuenta. Ingresa tu contraseña.", la etiqueta pasa a "INGRESE SU CONTRASEÑA" y el campo de confirmación desaparece. No completes la activación (la invitación queda `pending` y la borra la limpieza).

**C. Otras comprobaciones**

- A 390×844 no hay scroll horizontal en `/activate-account`.
- Consola de `/activate-account` sin errores ni warnings de hidratación.

**D. Limpieza** — en el SQL Editor de Supabase, reemplazando `TU_EMAIL` y `CONSENTIMIENTO_INICIAL_DE_ALBERTO` (del paso 1 del plan):

```sql
update public.elderly set photo_consent = CONSENTIMIENTO_INICIAL_DE_ALBERTO
  where first_name = 'Alberto' and last_name = 'Díaz';

delete from public.reactions
  where user_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.comments
  where author_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.guardian_elderly
  where relative_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.invitations where email = 'TU_EMAIL';
-- public.users se borra en cascada
delete from auth.users where email = 'TU_EMAIL';
```

---

## Estructura de archivos

```
auth/validate-password.ts                  # + passwordMessages y validatePasswordConfirmation
auth/validate-create-password.ts           # usa validatePasswordConfirmation
auth/create-password-messages.ts           # reusa passwordMessages
auth/activate-account-messages.ts          # reusa passwordMessages
auth/types.ts                              # passwordConfirmation en ActivateAccountInput y ActivateAccountField
auth/read-activate-account-input.ts        # lee passwordConfirmation
auth/validate-activate-account.ts          # recibe el modo; valida la confirmación solo en create
auth/actions/activate-account.ts           # valida con el modo actual
auth/components/ActivateAccountForm.tsx    # campo nuevo, solo en create
specs/database/17-relative-invitation-and-activation.md
specs/24-verify-relative-invitation-flows.md
specs/BACKLOG.md
```

---

## Plan de implementación

1. **Extraer lo compartido.** En `auth/validate-password.ts`, agregar `passwordMessages` y `validatePasswordConfirmation` (la lógica actual de `validateConfirmation`). `validate-create-password.ts` y los dos archivos de mensajes pasan a usarlos. `/create-password` sigue igual. Prueba: `npm run build` y `npm run lint`; mismos mensajes en `/create-password`.
2. **Tipos y lectura.** `passwordConfirmation` en `ActivateAccountInput` y `ActivateAccountField`; `readActivateAccountInput` lo lee (`""` si no viene).
3. **Validación.** `validateActivateAccount(input, passwordMode)` valida la confirmación solo si `passwordMode === "create"`. La Server Action la llama con `currentMode`, antes de leer la invitación.
4. **Formulario.** `ActivateAccountForm` muestra el campo solo en `create`, lo agrega a `FIELD_ORDER` y pasa `passwordMode` a la validación del cliente. Cargar el skill `frontend-design:frontend-design` antes de tocar la UI. Prueba: `npm run build` y `npm run lint`.
5. **Preparación (Claude).** `execute_sql` de solo lectura: `TU_EMAIL` sin usuario ni invitaciones; Alberto Díaz `active` en Casa Nogal; anotar su `photo_consent` inicial. Si algo falta, detenerse y preguntar.
6. **Checklist A a C, con B2 (usuario).** Claude corrige lo que falle dentro del alcance; lo demás va al BACKLOG.
7. **Limpieza D (usuario) y comprobación (Claude).** `execute_sql` de solo lectura: no quedan el usuario, sus vínculos ni las invitaciones (Alberto y Rosa); `photo_consent` de Alberto vuelve al valor del paso 5.
8. **Documentación.** Aplicar "Cambios en documentos" y "Entradas de BACKLOG".

---

## Criterios de aceptación

**Código**

- [ ] `passwordMessages` y `validatePasswordConfirmation` viven en `auth/validate-password.ts` y los usan `/create-password` y `/activate-account`; el texto de la regla de contraseña no está duplicado.
- [ ] `/create-password` muestra los mismos mensajes que antes.
- [ ] La Server Action rechaza una confirmación vacía o distinta en el modo `create` aunque el cliente no la valide.
- [ ] En el modo `existing` la confirmación no se pide ni se valida.
- [ ] `npm run build` y `npm run lint` sin errores.

**Formulario**

- [ ] En "CREAR CONTRASEÑA" se ve "CONFIRMAR CONTRASEÑA" bajo la contraseña, con el diseño del de `/create-password`.
- [ ] Vacía muestra "Vuelve a escribir la contraseña."; distinta, "Las contraseñas no coinciden."; con `aria-invalid="true"`, `aria-describedby` y foco si es el primer error.
- [ ] Al pasar a "INGRESE SU CONTRASEÑA" el campo desaparece junto con su error.
- [ ] A 390×844 no hay scroll horizontal y la consola no tiene errores ni warnings de hidratación.

**Consentimiento desmarcado**

- [ ] Activar con la casilla desmarcada termina en `/family` y deja `elderly.photo_consent = false` en Alberto.

**Cierre**

- [ ] Tras la limpieza no quedan el usuario de prueba, sus vínculos ni las invitaciones, y `photo_consent` de Alberto tiene su valor inicial.
- [ ] SPEC 17, SPEC 24 y `BACKLOG.md` actualizados según "Cambios en documentos".

---

## Cambios en documentos

1. **`specs/database/17-relative-invitation-and-activation.md`:** marcar "Desmarcar el consentimiento deja `photo_consent = false`; marcarlo no cambia el valor." y reemplazar su nota por "(verificado en SPEC 26)".
2. **`specs/24-verify-relative-invitation-flows.md`**, "Specs siguientes": agregar "(spec `26-confirm-password-on-activate-account`)" a SPEC 26 y resolver el supuesto: "el campo solo aparece en el modo 'CREAR CONTRASEÑA'".

### Entradas de BACKLOG

- "Activar con el consentimiento de fotos desmarcado" → `- [x] **Estado:** resuelto en SPEC 26`.
- Una entrada por cada fallo que no se corrija en esta spec, en su sección, con origen SPEC 26.

---

## Decisiones

- **Sí:** el campo solo aparece en el modo "CREAR CONTRASEÑA". Decisión del usuario; en "INGRESE SU CONTRASEÑA" la cuenta ya existe.
- **Sí:** validar la confirmación en el cliente y en la Server Action. Decisión del usuario; igual que `/create-password`, el servidor no confía en el cliente.
- **Sí:** extraer la validación y los mensajes de contraseña a `auth/validate-password.ts`. Decisión del usuario (DRY).
- **Sí:** copiar el diseño del campo de `/create-password` sin editar el mockup. Decisión del usuario.
- **Sí:** incluir la entrada del BACKLOG del consentimiento desmarcado. Decisión del usuario; la verificación vuelve a activar desde ese formulario.
- **Sí:** checklist manual del usuario y SQL de solo lectura de Claude, con Alberto Díaz. Decisión del usuario; escribe en el remoto y envía correos reales.
- **No:** botón para mostrar la contraseña. No se pidió; si llega, va en su propia spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Cambiar los mensajes compartidos altera `/create-password` | Mismos textos; el punto A.3 lo revisa. |
| El campo oculto en `existing` deja un error visible o bloquea el envío | La validación depende del modo y el error se limpia al cambiarlo (parte B2). |
| Alberto queda con `photo_consent = false` | Se anota el valor inicial en el paso 5; la limpieza lo restaura y Claude lo comprueba. |
| Escribe en el remoto y envía correos reales | Los datos de prueba se identifican por `TU_EMAIL`; la parte D los borra. |
