# SPEC 04 — Modal "Agregar adulto mayor": UI con validación

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-05
> **Objetivo:** Abrir desde el botón "Agregar adulto mayor" de `/elderly` un modal nativo que replica `agregar-adulto-mayor.dc.html` y valida el formulario al tocar "Guardar", sin persistir nada.

---

## Alcance

**Dentro:**

- El botón "Agregar adulto mayor" de `/elderly` deja de ser `<Link href="/">` y pasa a ser un `<button>` que abre el modal. Mantiene el mismo aspecto.
- Modal con `<dialog>` nativo abierto con `showModal()`. Sin ruta propia: la URL sigue siendo `/elderly`.
- Contenido igual al mockup: encabezado ("Cancelar", título "Agregar adulto mayor", "Guardar") y los campos NOMBRES, APELLIDOS, FECHA DE NACIMIENTO, FECHA DE INGRESO, HABITACIÓN, ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS, con los placeholders del mockup.
- Etiquetas como `<label htmlFor>` con el estilo del mockup.
- Fechas con `<input type="date">` nativo. El formato visible lo pone el navegador según su idioma. FECHA DE NACIMIENTO lleva `max` = "hoy".
- HABITACIÓN: `<select>` nativo con `appearance: none` y el chevron del mockup. Opciones = habitaciones del mock en el orden del array. Por defecto, la primera (Roble).
- ALERGIAS: texto libre opcional, sin procesar. NOTAS MÉDICAS: `<textarea>` opcional, `min-height` 90px, `resize: vertical`.
- "Guardar" (`type="submit"`) valida en el cliente:
  - Obligatorios: Nombres, Apellidos, Fecha de nacimiento, Fecha de ingreso y Habitación. Un texto con solo espacios cuenta como vacío.
  - La fecha de nacimiento no puede ser posterior a "hoy".
  - La fecha de ingreso debe ser posterior a la de nacimiento.
  - Habitación debe ser un id de la lista de habitaciones.
- Con errores: mensaje bajo cada campo inválido, borde de error y foco en el primer campo con error. Con todo válido: no pasa nada y el modal sigue abierto.
- Al editar un campo con error, se quita su mensaje.
- "hoy" = `mockElderly.referenceDate` (`2025-06-17`), igual que las edades de SPEC 02.
- Se cierra con "Cancelar" (`type="button"`) o con Esc. El clic en el fondo **no** lo cierra.
- Al cerrar, el formulario se limpia (valores por defecto y sin errores). Al reabrir, aparece vacío.
- Mientras el modal está abierto no se puede hacer scroll en la página de fondo.
- Foco: al abrir, en NOMBRES. Al cerrar, vuelve al botón "Agregar adulto mayor" (comportamiento nativo de `<dialog>`).
- Escritorio (`sm` en adelante): tarjeta de 520px de ancho, con el estilo del mockup, a 40px del borde superior y centrada en horizontal. Si no cabe en la altura, el cuerpo hace scroll interno.
- Móvil (bajo `sm`): pantalla completa, sin bordes redondeados, con el encabezado Cancelar/Guardar fijo arriba y scroll interno en el cuerpo.

**Fuera de alcance (para specs futuras):**

- Persistir el adulto mayor (Server Action, Supabase, migraciones) y cerrar el modal o mostrar un toast después de guardar.
- Agregar el nuevo adulto mayor al listado.
- Convertir las alergias en tags en inglés (`Maní` → `peanut`) o mostrarlas como chips.
- Habitación por defecto `Temporal` (`is_default = true`) del esquema.
- Ocultar el botón al staff (en el esquema solo el admin crea adultos mayores).
- Ruta propia del modal (`/elderly/new`) con parallel + intercepting routes.
- Confirmación "¿Descartar cambios?" al cerrar.
- Consentimiento de fotos en el formulario (el mockup no lo tiene; el esquema usa `true` por defecto).
- Unificar los campos del formulario con `auth/components/AuthField.tsx`.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones. Se reutiliza `mockElderly` (`elderly/mock-elderly.ts`) de SPEC 02.

```ts
// elderly/types.ts (se agrega)
export type RoomOption = { id: string; name: string };

// Valores del formulario tal como llegan del FormData
export type NewElderlyInput = {
  firstName: string;
  lastName: string;
  birthDate: string;    // "1947-03-12" o "" si está vacío o incompleto
  enrolledAt: string;   // ídem
  roomId: string;
  allergies: string;    // texto libre
  medicalNotes: string;
};

export type NewElderlyField = keyof NewElderlyInput;
export type NewElderlyErrors = Partial<Record<NewElderlyField, string>>;
```

Funciones puras:

- `elderly/build-room-options.ts` → `buildRoomOptions(source: ElderlySource): RoomOption[]`. Respeta el orden de `source.rooms`.
- `elderly/validate-new-elderly.ts` → `validateNewElderly(input: NewElderlyInput, rules: { today: string; roomIds: string[] }): NewElderlyErrors`. Un objeto vacío significa válido. Las fechas ISO se comparan como string.

Atributo `name` de cada campo = la clave de `NewElderlyInput` (`firstName`, `lastName`, …).

Mensajes de error (`elderly/new-elderly-messages.ts`):

| Campo | Caso | Mensaje |
| --- | --- | --- |
| `firstName` | vacío | "Ingresa los nombres." |
| `lastName` | vacío | "Ingresa los apellidos." |
| `birthDate` | vacío | "Ingresa la fecha de nacimiento." |
| `birthDate` | posterior a hoy | "La fecha de nacimiento no puede ser futura." |
| `enrolledAt` | vacío | "Ingresa la fecha de ingreso." |
| `enrolledAt` | igual o anterior al nacimiento | "La fecha de ingreso debe ser posterior a la de nacimiento." |
| `roomId` | vacío o desconocido | "Elige una habitación." |

Colores de error: borde y texto `#C5413A`, el rojo del bloque "Alergias y notas" del perfil. Se agrega como token `--color-error` en `app/globals.css`.

---

## Estructura de archivos

```
elderly/
  types.ts                     # + RoomOption, NewElderlyInput, NewElderlyField, NewElderlyErrors
  build-room-options.ts
  validate-new-elderly.ts
  new-elderly-messages.ts
  components/
    ElderlyListView.tsx        # reemplaza el <Link> por <AddElderlyDialog rooms today />
    AddElderlyDialog.tsx       # "use client": botón + <dialog>, abrir/cerrar, limpiar al cerrar
    AddElderlyForm.tsx         # "use client": encabezado, campos, validación y errores
    FormField.tsx              # label + control + mensaje de error (aria-describedby)
shared/
  components/icons/
    ChevronDownIcon.tsx        # path "m6 9 6 6 6-6" del mockup
app/
  globals.css                  # + --color-error; bloqueo de scroll con html:has(dialog[open])
```

`ElderlyListView` sigue siendo Server Component. Los Client Components nuevos son solo `AddElderlyDialog.tsx` y `AddElderlyForm.tsx`.

---

## Plan de implementación

1. **Tipos y reglas.** Tipos nuevos en `elderly/types.ts`, `build-room-options.ts`, `new-elderly-messages.ts` y `validate-new-elderly.ts`. Prueba: `npm run build`.
2. **Ícono y campo.** `ChevronDownIcon` y `FormField` (label con el estilo del mockup, slot del control, mensaje de error con `id` para `aria-describedby`). Token `--color-error`. Prueba: `npm run lint`.
3. **Abrir y cerrar el modal.** `AddElderlyDialog` con el botón (mismo estilo que el `<Link>` actual) y un `<dialog>` con el encabezado del mockup. `ElderlyListView` le pasa `rooms` y `today`. Cancelar y Esc cierran; el clic en el fondo no. Bloqueo de scroll en `globals.css`. Prueba: abrir, cerrar con Cancelar y con Esc, y que el foco vuelva al botón.
4. **Campos.** `AddElderlyForm` con los 7 campos, placeholders, `<select>` con Roble por defecto y `max` en nacimiento. Prueba: a 1440×900 coincide con `agregar-adulto-mayor.dc.html`.
5. **Validación.** Al enviar: `FormData` → `NewElderlyInput` → `validateNewElderly`. Muestra errores, aplica `aria-invalid` y pone el foco en el primer campo con error. Al editar un campo se quita su error. Con todo válido no pasa nada. Al cerrar se hace `form.reset()` y se limpian los errores. Prueba: Guardar vacío muestra 4 errores (Habitación ya tiene valor); nacimiento `2030-01-01` muestra "no puede ser futura".
6. **Móvil.** Bajo `sm`: pantalla completa, encabezado fijo y scroll interno. Prueba: a 390×844 no hay scroll horizontal y Guardar queda visible al hacer scroll en el formulario.
7. **Capturas de verificación.** Con Playwright, en `.playwright-mcp/`: el mockup y el modal abierto a 1440×900, el modal con errores y el modal a 390×844.

---

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] La consola no muestra errores ni warnings de hidratación en `/elderly`, ni al abrir y cerrar el modal.
- [x] Hacer clic en "Agregar adulto mayor" abre el modal y la URL sigue siendo `/elderly`.
- [x] El botón "Agregar adulto mayor" se ve igual que al cierre de SPEC 02.
- [x] A 1440×900, el modal abierto y `agregar-adulto-mayor.dc.html` no muestran diferencias visibles en la tarjeta (textos, placeholders, colores, tipografía, bordes y orden de los campos).
- [x] El modal es un `<dialog>` abierto con `showModal()` y tiene `aria-labelledby` apuntando al título.
- [x] Al abrir, el foco está en NOMBRES. Al cerrar, vuelve al botón "Agregar adulto mayor".
- [x] "Cancelar" y Esc cierran el modal. Hacer clic en el fondo no lo cierra.
- [x] Con el modal abierto no se puede hacer scroll en el listado de fondo.
- [x] HABITACIÓN es un `<select>` con las habitaciones del mock, en orden, y Roble seleccionada por defecto.
- [x] FECHA DE NACIMIENTO y FECHA DE INGRESO son `type="date"`, y nacimiento tiene `max="2025-06-17"`.
- [x] Guardar con el formulario vacío muestra los errores de Nombres, Apellidos, Fecha de nacimiento y Fecha de ingreso, y pone el foco en NOMBRES.
- [x] Nombres con solo espacios muestra "Ingresa los nombres.".
- [x] Nacimiento `2030-01-01` muestra "La fecha de nacimiento no puede ser futura.".
- [x] Nacimiento `1950-05-10` con ingreso `1950-05-10` o anterior muestra "La fecha de ingreso debe ser posterior a la de nacimiento.".
- [x] Alergias y Notas médicas vacías no muestran error.
- [x] Cada campo con error tiene borde `#C5413A`, `aria-invalid="true"` y `aria-describedby` apuntando a su mensaje.
- [x] Editar un campo con error quita su mensaje.
- [x] Guardar con todos los campos válidos no muestra errores, no cierra el modal y no cambia el listado.
- [x] Cerrar y reabrir el modal lo muestra vacío, sin errores y con Roble seleccionada.
- [x] `validateNewElderly` y `buildRoomOptions` son funciones puras sin imports de React.
- [x] Los únicos `"use client"` nuevos están en `AddElderlyDialog.tsx` y `AddElderlyForm.tsx`, y `ElderlyListView.tsx` sigue siendo Server Component.
- [x] A 390×844 el modal ocupa toda la pantalla, sin scroll horizontal, con Cancelar/Guardar visibles mientras se hace scroll en el formulario.
- [x] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** `<dialog>` nativo con estado en el cliente. Es el patrón de la guía `02-guides/interactive-apps.md` de Next 16 para un modal de crear. Trae gratis Esc, foco atrapado, fondo inerte y devolución del foco.
- **No:** parallel + intercepting routes (`@modal/(.)elderly/new`). Next lo recomienda para modales con deep linking. Pide `default.tsx` por slot y una página completa `/elderly/new` que el mockup no define. Revisado con Context7 (v16.2.9) y con la documentación local de 16.4.5.
- **No:** modal por `?new=1`. `searchParams` vuelve dinámica la ruta con `cacheComponents`.
- **Sí:** `<input type="date">` nativo. Entrega ISO (`aaaa-mm-dd`), igual a la columna `date`, y trae calendario y segmentos que funcionan como máscara. El formato visible lo decide el navegador; en español es `dd/mm/aaaa`, como el mockup.
- **No:** input de texto con máscara `dd/mm/aaaa`. Sin calendario, y con parseo y validación a mano.
- **Sí:** `<select>` nativo con la primera habitación por defecto. Coincide con el mockup (Roble) y es accesible.
- **No:** habitación `Temporal` por defecto. Va en la spec de Supabase, que crea esa habitación con un trigger.
- **Sí:** Guardar valida, muestra errores y no cierra. La UI queda completa sin inventar persistencia; guardar y cerrar llegan con la Server Action.
- **No:** validación nativa del navegador (`required` con burbujas). Su aspecto no se puede controlar. El formulario usa `noValidate`.
- **Sí:** "hoy" = `referenceDate` del mock. Es determinista, no causa warnings de hidratación y es coherente con las edades de SPEC 02.
- **No:** fecha real en el servidor. Con `cacheComponents`, `new Date()` en un Server Component obliga a hacer dinámica la ruta.
- **Sí:** ingreso estrictamente posterior al nacimiento. "Posterior" excluye la misma fecha.
- **No:** prohibir una fecha de ingreso futura. Decisión del usuario: se puede inscribir con fecha futura.
- **Sí:** solo Cancelar y Esc cierran. Un clic en el fondo por accidente no borra lo escrito. Es el comportamiento por defecto de `showModal()`.
- **Sí:** limpiar el formulario al cerrar, por cualquier vía.
- **Sí:** alergias como texto libre. Pasarlas a tags solo sirve al persistir.
- **Sí:** pantalla completa bajo `sm`. El modal tiene 7 campos y en 390px una tarjeta flotante deja poco espacio.
- **Sí:** color de error `#C5413A`, tomado de la alerta médica del perfil. El mockup no define estados de error.
- **Sí:** `FormField` propio en `elderly/components/`. `AuthField` no maneja errores, `<select>` ni `<textarea>`, y vive en `auth/`. Unificarlos va en otra spec.
- **Sí:** cambia lo decidido en SPEC 02: "Agregar adulto mayor" deja de ser `<Link href="/">` y hay dos Client Components nuevos.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El formato de `type="date"` cambia según el idioma del navegador (`mm/dd/yyyy` en inglés) | Aceptado. La comparación con el mockup se hace con el navegador en español. |
| Los pseudo-elementos del input de fecha y del `<select>` se ven distintos en Firefox | Se estiliza el contenedor (borde, radio, padding, fuente), que es lo que se compara. Los detalles internos quedan nativos. |
| `html:has(dialog[open])` no funciona en navegadores sin `:has()` | Soporte amplio en navegadores actuales. Si falla, la página de fondo solo hace scroll, sin romper nada. |
| La primera habitación por defecto oculta el error "Elige una habitación." | La regla se mantiene en `validateNewElderly` para cuando haya datos reales o una opción vacía. |
| La validación en el cliente se puede saltar | Hoy no se persiste nada. La Server Action futura repetirá la validación en el servidor. |

---

## Lo que **no** entra en esta spec

- Guardar de verdad (Server Action, Supabase, migraciones), cerrar al guardar y toast.
- Agregar el nuevo adulto mayor al listado.
- Alergias como tags en inglés o chips.
- Habitación `Temporal` por defecto.
- Diferencias por rol.
- Ruta propia `/elderly/new`.
- Confirmar descarte de cambios.
- Consentimiento de fotos en el formulario.
- Unificar `FormField` con `AuthField`.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
