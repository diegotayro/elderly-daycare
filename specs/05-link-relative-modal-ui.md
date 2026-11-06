# SPEC 05 — Modal "Vincular familiar/tutor": UI con validación

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 04
> **Fecha:** 2026-11-06
> **Objetivo:** Abrir desde "Vincular otro familiar/tutor" del perfil `/elderly/[id]` un modal nativo que replica `vincular-tutor.dc.html` y valida el formulario al tocar "Enviar invitación", sin persistir nada.

---

## Alcance

**Dentro:**

- En `LinkedRelativesCard`, "Vincular otro familiar/tutor" deja de ser `<Link href="/">` y pasa a ser un `<button type="button">` que abre el modal. Mantiene el mismo aspecto.
- Modal con `<dialog>` nativo abierto con `showModal()`, mismo patrón que SPEC 04. Sin ruta propia: la URL sigue siendo `/elderly/[id]`.
- Contenido igual al mockup:
  - Encabezado: título "Vincular familiar/tutor", subtítulo "a {nombre completo}" (ej. "a Luis Fernández") y botón X (`aria-label="Cerrar"`).
  - Aviso azul con ícono de información: "Le enviaremos un correo con un código para que active su cuenta. Solo verá las publicaciones de {nombre de pila}." (ej. "de Luis").
  - Campos NOMBRES ("Ej. Diego"), APELLIDOS ("Ej. Fernández Ruiz") y EMAIL (`type="email"`, "correo@ejemplo.com").
  - PARENTESCO: grupo de radios nativos (`fieldset` + `legend`) con estilo de pastilla: Hijo, Hija, Tutor. Hijo seleccionado por defecto.
  - Bloque CÓDIGO DE INVITACIÓN con el código fijo del mock `7K4P9` y "Vence en 7 días".
  - Botón "Enviar invitación" (`type="submit"`) con el ícono de avión de papel, al final del formulario.
- Etiquetas con `FormField` y `fieldControlClassName` de SPEC 04 (`elderly/components/FormField.tsx`).
- "Enviar invitación" valida en el cliente:
  - Obligatorios: Nombres, Apellidos y Email. Un texto con solo espacios cuenta como vacío.
  - Email con formato básico `algo@algo.algo` (sin espacios), tras `trim`.
  - Email no repetido: error si ya existe una invitación `pending` para este adulto mayor con ese email (comparación sin mayúsculas y tras `trim`).
  - Parentesco debe ser `son`, `daughter` o `guardian`.
- Con errores: mensaje bajo cada campo inválido, borde de error, `aria-invalid` y foco en el primer campo con error. Con todo válido: no pasa nada y el modal sigue abierto.
- Al editar un campo con error, se quita su mensaje.
- Se cierra con la X o con Esc. El clic en el fondo **no** lo cierra.
- Al cerrar, el formulario se limpia (vacío, Hijo seleccionado, sin errores).
- Mientras el modal está abierto no hay scroll en la página de fondo (regla `html:has(dialog[open])` existente).
- Foco: al abrir, en NOMBRES. Al cerrar, vuelve al botón "Vincular otro familiar/tutor".
- Escritorio (`sm` en adelante): tarjeta de 480px, con el estilo del mockup, a 40px del borde superior y centrada en horizontal. Si no cabe en la altura, el cuerpo hace scroll interno.
- Móvil (bajo `sm`): pantalla completa, sin bordes redondeados, encabezado (título + X) fijo arriba y scroll interno en el cuerpo.
- El botón abre el modal para cualquier rol.

**Fuera de alcance (para specs futuras):**

- Persistir la invitación (Server Action, Supabase, migraciones), generar el código real y su vencimiento, y enviar el correo con Resend.
- Cerrar el modal o mostrar un toast después de enviar, y agregar la fila "invitación enviada" a la lista.
- Validar que el email no pertenezca a un familiar ya vinculado (el email vive en `auth.users`, no en el mock).
- Ocultar el botón a quien no sea admin.
- Ruta propia del modal.
- Confirmación "¿Descartar cambios?" al cerrar.
- Tratamiento "Don/Doña" (el esquema no tiene género).
- Extraer un componente de diálogo compartido con `AddElderlyDialog`.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones. Se reutilizan `mockElderly` (`elderly/mock-elderly.ts`) y `RelationshipType` (`shared/database/types.ts`).

```ts
// elderly/types.ts (se agrega)
export type RelativeInvitationInput = {
  firstName: string;
  lastName: string;
  email: string;
  relationship: string; // valor crudo del FormData
};

export type RelativeInvitationField = keyof RelativeInvitationInput;
export type RelativeInvitationErrors = Partial<
  Record<RelativeInvitationField, string>
>;

// ElderlyProfile (se agregan)
firstName: string;               // "Luis", para el aviso
pendingInvitationEmails: string[]; // emails de invitaciones pending de este adulto mayor
```

```ts
// elderly/mock-invitation-code.ts
export const mockInvitationCode = { code: "7K4P9", expiresInDays: 7 };
```

Funciones puras:

- `elderly/validate-relative-invitation.ts` → `validateRelativeInvitation(input: RelativeInvitationInput, rules: { pendingEmails: string[] }): RelativeInvitationErrors`. Un objeto vacío significa válido.
- `buildElderlyProfile` llena `firstName` y `pendingInvitationEmails` (mismo filtro `status === "pending"` que `getLinkedRelatives`).

Atributo `name` de cada campo = la clave de `RelativeInvitationInput`. Los valores de los radios son los de `RelationshipType`, con etiquetas de `relationshipLabels` (`elderly/relationship-labels.ts`).

Mensajes de error (`elderly/relative-invitation-messages.ts`):

| Campo | Caso | Mensaje |
| --- | --- | --- |
| `firstName` | vacío | "Ingresa los nombres." |
| `lastName` | vacío | "Ingresa los apellidos." |
| `email` | vacío | "Ingresa el email." |
| `email` | formato inválido | "Ingresa un email válido." |
| `email` | ya tiene invitación pendiente | "Ya hay una invitación pendiente con este email." |
| `relationship` | fuera de la lista | "Elige el parentesco." |

Colores: error con `--color-error` (existente). El aviso azul (`#E3ECFB`, `#4E72C8`, `#3F5694`) y la pastilla seleccionada (`#CCD8F4`, `#9FB8EC`) se agregan como tokens en `app/globals.css`. El bloque del código reutiliza `--color-consent-bg` y `--color-consent-ink`; `#E6D08A` y `#A88526` se agregan como tokens.

---

## Estructura de archivos

```
elderly/
  types.ts                         # + RelativeInvitation*; ElderlyProfile + firstName, pendingInvitationEmails
  build-elderly-profile.ts         # llena los dos campos nuevos
  mock-invitation-code.ts
  validate-relative-invitation.ts
  relative-invitation-messages.ts
  components/
    ElderlyProfileView.tsx         # pasa los datos del modal a LinkedRelativesCard
    LinkedRelativesCard.tsx        # reemplaza el <Link> por <LinkRelativeDialog … />
    LinkRelativeDialog.tsx         # "use client": botón + <dialog>, abrir/cerrar, limpiar al cerrar
    LinkRelativeForm.tsx           # "use client": encabezado, aviso, campos, parentesco, código y validación
    RelationshipPicker.tsx         # fieldset de radios con estilo de pastilla
    InvitationCodePreview.tsx      # bloque CÓDIGO DE INVITACIÓN
shared/
  components/icons/
    CloseIcon.tsx                  # path "M18 6 6 18M6 6l12 12"
    InfoIcon.tsx                   # círculo + "M12 16v-4M12 8h.01"
    SendIcon.tsx                   # "m22 2-7 20-4-9-9-4z" + "M22 2 11 13"
app/
  globals.css                      # + tokens del aviso, pastilla y código
```

`LinkedRelativesCard` y `ElderlyProfileView` siguen siendo Server Components. Los Client Components nuevos son solo `LinkRelativeDialog.tsx` y `LinkRelativeForm.tsx` (`RelationshipPicker` e `InvitationCodePreview` no usan hooks).

---

## Plan de implementación

1. **Tipos y reglas.** Tipos nuevos, `mock-invitation-code.ts`, `relative-invitation-messages.ts`, `validate-relative-invitation.ts` y los dos campos nuevos en `buildElderlyProfile`. Prueba: `npm run build`.
2. **Íconos y tokens.** `CloseIcon`, `InfoIcon`, `SendIcon` y los tokens de color. Prueba: `npm run lint`.
3. **Abrir y cerrar el modal.** `LinkRelativeDialog` con el botón (mismo aspecto que el `<Link>` actual) y un `<dialog>` con el encabezado del mockup. `LinkedRelativesCard` recibe y pasa `elderlyFullName`, `elderlyFirstName` y `pendingInvitationEmails`. X y Esc cierran; el clic en el fondo no. Prueba: abrir, cerrar con X y con Esc, y que el foco vuelva al botón.
4. **Contenido.** `LinkRelativeForm` con aviso, 3 campos, `RelationshipPicker` (Hijo por defecto), `InvitationCodePreview` y botón Enviar. Prueba: a 1440×900 coincide con `vincular-tutor.dc.html` en `/elderly/elderly-luis`.
5. **Validación.** Al enviar: `FormData` → `RelativeInvitationInput` → `validateRelativeInvitation`. Errores, `aria-invalid`, foco en el primero con error, limpieza al editar, y `key` que remonta el formulario al cerrar. Prueba: enviar vacío muestra 3 errores; `diego.fernandez@example.com` en el perfil de Luis muestra el error de pendiente.
6. **Móvil.** Bajo `sm`: pantalla completa, encabezado fijo y scroll interno. Prueba: a 390×844 no hay scroll horizontal y Enviar se alcanza con scroll.
7. **Capturas de verificación.** Con Playwright, en `.playwright-mcp/`: el mockup y el modal abierto a 1440×900, el modal con errores y el modal a 390×844.

---

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] La consola no muestra errores ni warnings de hidratación nuevos en `/elderly/[id]` al abrir y cerrar el modal.
- [x] Hacer clic en "Vincular otro familiar/tutor" abre el modal y la URL no cambia.
- [ ] El botón "Vincular otro familiar/tutor" se ve igual que al cierre de SPEC 02.
- [ ] A 1440×900, el modal abierto en el perfil de Luis y `vincular-tutor.dc.html` no muestran diferencias visibles en la tarjeta (textos, placeholders, colores, tipografía, bordes y orden).
- [x] El subtítulo muestra "a {nombre completo}" y el aviso termina en "de {nombre de pila}." del adulto mayor del perfil (ej. "a Carmen Ruiz" y "de Carmen." en el de Carmen).
- [x] El bloque del código muestra `7K4P9` y "Vence en 7 días".
- [x] El modal es un `<dialog>` abierto con `showModal()` con `aria-labelledby` apuntando al título.
- [x] Al abrir, el foco está en NOMBRES. Al cerrar, vuelve al botón "Vincular otro familiar/tutor".
- [ ] La X y Esc cierran el modal. Hacer clic en el fondo no lo cierra. La X tiene `aria-label="Cerrar"`.
- [x] Con el modal abierto no se puede hacer scroll en el perfil de fondo.
- [ ] PARENTESCO es un `fieldset` con 3 radios (Hijo, Hija, Tutor), con Hijo marcado por defecto, y se navega con las flechas del teclado.
- [x] Enviar con el formulario vacío muestra los errores de Nombres, Apellidos y Email, y pone el foco en NOMBRES.
- [x] Nombres con solo espacios muestra "Ingresa los nombres.".
- [x] Email `diego@` muestra "Ingresa un email válido.".
- [x] En el perfil de Luis, email ` Diego.Fernandez@example.com ` muestra "Ya hay una invitación pendiente con este email.".
- [x] Cada campo con error tiene borde `#C5413A`, `aria-invalid="true"` y `aria-describedby` apuntando a su mensaje.
- [x] Editar un campo con error quita su mensaje.
- [x] Enviar con todo válido no muestra errores, no cierra el modal y no cambia la lista de familiares.
- [x] Cerrar y reabrir el modal lo muestra vacío, sin errores y con Hijo marcado.
- [x] `validateRelativeInvitation` es una función pura sin imports de React.
- [x] Los únicos `"use client"` nuevos están en `LinkRelativeDialog.tsx` y `LinkRelativeForm.tsx`.
- [x] A 390×844 el modal ocupa toda la pantalla, sin scroll horizontal, con el encabezado visible mientras se hace scroll.
- [ ] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** mismo patrón que SPEC 04 (`<dialog>` + `showModal()`, cierre con X/Esc, limpieza remontando con `key`). Consistencia y accesibilidad nativa.
- **No:** cerrar con clic en el fondo. Un clic por accidente borraría lo escrito.
- **Sí:** Enviar solo valida. La persistencia, el correo y cerrar al enviar llegan con la Server Action.
- **Sí:** código fijo del mock `7K4P9` visible antes de enviar, como el mockup. En el flujo real lo genera el servidor; se reemplaza en la spec de persistencia.
- **No:** ocultar el código hasta enviar o generarlo en el cliente. Se aparta del mockup o agrega lógica que se descarta.
- **Sí:** aviso con el nombre de pila ("de Luis"). El esquema no tiene género para elegir "Don/Doña".
- **Sí:** Hijo preseleccionado con radios nativos. Coincide con el mockup y trae navegación por teclado.
- **No:** `<button>` con estado para el parentesco. Requiere ARIA y manejo de teclado a mano.
- **Sí:** email con formato básico y sin invitación pendiente repetida para el mismo adulto mayor. Evita invitaciones duplicadas.
- **No:** validar contra los emails de familiares activos. `users` no tiene email (vive en `auth.users`); va en la Server Action.
- **No:** `type="email"` con validación nativa. El formulario usa `noValidate`, igual que SPEC 04.
- **Sí:** reutilizar `FormField` y `fieldControlClassName` de SPEC 04.
- **No:** extraer ahora un `Dialog` compartido con `AddElderlyDialog`. Se evalúa en otra spec si aparece un tercer modal.
- **Sí:** el botón se muestra a todos los roles. Las diferencias por rol van con la sesión real.
- **Sí:** pantalla completa bajo `sm`, igual que SPEC 04.
- **Sí:** cambia lo decidido en SPEC 02: "Vincular otro familiar/tutor" deja de ser `<Link href="/">`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El código fijo `7K4P9` puede confundirse con uno real | Es una UI sin persistencia; la spec de persistencia lo reemplaza por el generado en el servidor. |
| La validación en el cliente se puede saltar | Hoy no se persiste nada. La Server Action futura repetirá la validación. |
| El duplicado no detecta familiares ya activos con ese email | Aceptado; se valida en el servidor con `auth.users`. |
| Los radios con estilo de pastilla pierden el foco visible | Se agrega anillo de foco con `has-[:focus-visible]` en la pastilla. |

---

## Lo que **no** entra en esta spec

- Guardar de verdad, código real, correo con Resend, cerrar al enviar y toast.
- Agregar la invitación a la lista de familiares.
- Validar contra emails de familiares activos.
- Diferencias por rol.
- Ruta propia del modal.
- Confirmar descarte de cambios.
- "Don/Doña".
- `Dialog` compartido.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
