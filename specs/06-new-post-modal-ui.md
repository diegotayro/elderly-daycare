# SPEC 06 — Modal "Nueva publicación": UI con validación

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02, SPEC 04
> **Fecha:** 2026-11-06
> **Objetivo:** Abrir desde los tres botones de "Nueva publicación" un único modal nativo que replica `crear-publicacion.dc.html`, permite elegir audiencia, tipo, descripción y fotos, y valida al tocar "Publicar", sin persistir nada.

---

## Alcance

**Dentro:**

- Tres disparadores abren el mismo modal. Hoy los tres son `<Link href="/">` y pasan a ser `<button type="button">` con el mismo aspecto:
  - "Nueva publicación" del `Sidebar`.
  - "+" del `MobileTopBar` (mantiene `aria-label="Nueva publicación"`).
  - "Comparte un momento…" del feed (`PostComposerLink`, que se renombra a `PostComposerButton`).
- Un solo `<dialog>` nativo abierto con `showModal()`, montado una vez en `app/(app)/layout.tsx` mediante `NewPostDialogProvider`. Los botones lo abren con `useNewPostDialog().open()`. Sin ruta propia: la URL no cambia.
- Contenido igual al mockup:
  - Encabezado: "Cancelar" (`type="button"`), título "Nueva publicación" y "Publicar" (`type="submit"`).
  - **PARA:** una chip por cada adulto mayor `active` de `mockElderly`, en el orden del array, con avatar (inicial y tono de `mockElderly.avatarTones`) y nombre de pila. Después, "Toda la habitación" y "Toda la guardería".
  - **TIPO:** Comida, Siesta, Actividad, Logro y Anuncio, en ese orden.
  - **DESCRIPCIÓN:** `<textarea>` con placeholder "Cuenta cómo le fue hoy…", `min-height` 120px, `resize: vertical`, `maxLength` 2000, sin contador.
  - **FOTOS:** miniaturas de las fotos elegidas y el recuadro "Agregar".
- PARA (selección excluyente por audiencia):
  - Adultos mayores: se pueden marcar varios (`audience = elderly`).
  - "Toda la habitación" o "Toda la guardería" desmarcan todo lo demás. Marcar un adulto mayor desmarca esas dos.
  - Tocar una chip marcada la desmarca.
  - Al abrir no hay nada marcado.
  - Chips como `<button type="button" aria-pressed>` dentro de un grupo (`role="group"`, `aria-labelledby` → etiqueta PARA).
  - Marcada: fondo `#3F362E`, borde `#3F362E`, texto blanco. No marcada: fondo `#FFFDF9`, borde `#ECE0D0`, texto `#6E6359`.
- HABITACIÓN: al marcar "Toda la habitación" aparece debajo de las chips un `<select>` HABITACIÓN con las habitaciones de `mockElderly` (mismo estilo y chevron que SPEC 04), con la primera (Roble) por defecto. Desaparece al cambiar de audiencia.
- TIPO: selección única con radios nativos (`fieldset` + `legend`) con estilo de pastilla, `name="type"`. Nada elegido al abrir.
  - Elegido: fondo = color `fg` del tipo en `postTypeStyles` y texto blanco.
  - No elegido: `bg` y `fg` de `postTypeStyles`.
- FOTOS:
  - "Agregar" abre un `<input type="file" accept="image/*" multiple>` oculto.
  - Cada foto elegida se muestra como miniatura de 96×96 (`URL.createObjectURL`) con un botón para quitarla (`aria-label="Quitar foto N"`).
  - Máximo 5 fotos, solo imágenes (`type` empieza con `image/`), 10 MB máximo cada una. Los archivos que no cumplen se descartan y se muestra un error en FOTOS; los válidos se agregan hasta completar 5.
  - Con 5 fotos se oculta "Agregar".
  - Las fotos son opcionales. No se sube nada.
- "Publicar" valida en el cliente:
  - PARA: obligatorio (al menos un adulto mayor, o una habitación válida, o toda la guardería).
  - TIPO: obligatorio y debe ser un `PostType`.
  - DESCRIPCIÓN: obligatoria. Un texto con solo espacios cuenta como vacío. Máximo 2000 caracteres.
- Con errores: mensaje bajo cada bloque inválido, `aria-invalid` donde aplique y foco en el primer bloque con error (primera chip de PARA, primer radio de TIPO o el textarea). Con todo válido: no pasa nada y el modal sigue abierto.
- Al cambiar un bloque con error, se quita su mensaje.
- Se cierra con "Cancelar" o con Esc. El clic en el fondo **no** lo cierra.
- Al cerrar, el formulario se limpia (sin audiencia, sin tipo, sin texto, sin fotos ni errores) y se liberan las URLs de las miniaturas (`URL.revokeObjectURL`).
- Mientras el modal está abierto no hay scroll en la página de fondo (regla `html:has(dialog[open])` existente).
- Foco: al abrir, en la primera chip de PARA. Al cerrar, vuelve al botón que lo abrió (comportamiento nativo de `<dialog>`).
- Escritorio (`sm` en adelante): tarjeta de 580px, con el estilo del mockup, a 40px del borde superior y centrada en horizontal. Si no cabe en la altura, el cuerpo hace scroll interno.
- Móvil (bajo `sm`): pantalla completa, sin bordes redondeados, encabezado Cancelar/Publicar fijo arriba y scroll interno en el cuerpo.
- El modal se abre igual para cualquier rol y "Toda la guardería" se muestra a todos.

**Fuera de alcance (para specs futuras):**

- Persistir el post (Server Action, Supabase, migraciones), armar `audience` en el servidor, subir fotos a Storage y registrar `post_photos`.
- Cerrar el modal o mostrar un toast después de publicar, y agregar el post al feed.
- Advertencia de adultos mayores sin `photo_consent` al agregar fotos.
- Filtrar por rol: staff solo con sus asignados (`staff_elderly`) y sus habitaciones; "Toda la guardería" solo para admin.
- Título del post (`posts.title`).
- Editar o borrar publicaciones.
- Ruta propia del modal.
- Confirmación "¿Descartar cambios?" al cerrar.
- Reordenar fotos, recortarlas o comprimirlas.
- Extraer un componente de diálogo compartido con `AddElderlyDialog` y `LinkRelativeDialog`.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones. Se reutilizan `mockElderly` (`elderly/mock-elderly.ts`), `buildRoomOptions` y `RoomOption` (SPEC 04), `PostType` (`shared/database/types.ts`) y `postTypeStyles` (`feed/post-type-styles.ts`).

```ts
// feed/types.ts (se agrega)
import type { AvatarTone } from "@/elderly/avatar-tones";
import type { RoomOption } from "@/elderly/types";

export type AudienceElderlyOption = {
  id: string;
  firstName: string; // "Luis"
  initial: string;   // "L"
  tone: AvatarTone;
};

export type NewPostOptions = {
  elderly: AudienceElderlyOption[];
  rooms: RoomOption[];
};

export type AudienceSelection =
  | { kind: "none" }
  | { kind: "elderly"; elderlyIds: string[] }
  | { kind: "room"; roomId: string }
  | { kind: "daycare" };

export type AudienceChip =
  | { kind: "elderly"; elderlyId: string }
  | { kind: "room" }
  | { kind: "daycare" };

export type NewPostInput = {
  audience: AudienceSelection;
  type: string; // valor crudo del FormData
  body: string;
};

export type NewPostField = "audience" | "type" | "body";
export type NewPostErrors = Partial<Record<NewPostField, string>>;

export type PhotoSelectionResult = {
  accepted: File[];
  error: string | null;
};
```

Funciones puras (sin imports de React):

- `feed/build-new-post-options.ts` → `buildNewPostOptions(source: ElderlySource): NewPostOptions`. Solo adultos mayores `active`, en el orden del array; habitaciones con `buildRoomOptions`.
- `feed/toggle-audience.ts` → `toggleAudience(current: AudienceSelection, chip: AudienceChip, defaultRoomId: string): AudienceSelection`. Aplica las reglas de exclusión de PARA. Quitar el último adulto mayor deja `{ kind: "none" }`.
- `feed/validate-new-post.ts` → `validateNewPost(input: NewPostInput, rules: { roomIds: string[]; elderlyIds: string[] }): NewPostErrors`. Un objeto vacío significa válido.
- `feed/select-photos.ts` → `selectPhotos(current: File[], incoming: File[]): PhotoSelectionResult`. Aplica los límites y devuelve los archivos que entran y el primer error, si hay.

Límites en `feed/new-post-limits.ts`: `MAX_PHOTOS = 5`, `MAX_PHOTO_BYTES = 10 * 1024 * 1024`, `MAX_BODY_LENGTH = 2000`.

Mensajes (`feed/new-post-messages.ts`):

| Bloque | Caso | Mensaje |
| --- | --- | --- |
| `audience` | nada elegido, habitación o adulto mayor desconocido | "Elige para quién es la publicación." |
| `type` | vacío o desconocido | "Elige un tipo." |
| `body` | vacío | "Escribe una descripción." |
| `body` | más de 2000 caracteres | "La descripción puede tener hasta 2000 caracteres." |
| fotos | más de 5 | "Puedes agregar hasta 5 fotos." |
| fotos | no es imagen | "Solo puedes agregar imágenes." |
| fotos | pesa más de 10 MB | "Cada foto puede pesar hasta 10 MB." |

Colores de error: `--color-error` existente (`#C5413A`).

---

## Estructura de archivos

```
feed/
  types.ts                          # + tipos de arriba
  build-new-post-options.ts
  toggle-audience.ts
  validate-new-post.ts
  select-photos.ts
  new-post-limits.ts
  new-post-messages.ts
  components/
    NewPostDialogProvider.tsx       # "use client": contexto open(), <dialog>, limpiar al cerrar
    NewPostTrigger.tsx              # "use client": <button> que llama open(); recibe className, aria-label y children
    NewPostForm.tsx                 # "use client": encabezado, bloques, estado de audiencia y fotos, validación
    AudiencePicker.tsx              # chips de PARA + select HABITACIÓN
    PostTypePicker.tsx              # fieldset de radios con estilo de pastilla
    PhotoPicker.tsx                 # miniaturas, quitar, input file oculto y "Agregar"
    PostComposerButton.tsx          # reemplaza a PostComposerLink.tsx (usa NewPostTrigger)
    FeedView.tsx                    # usa PostComposerButton
shared/
  components/navigation/
    Sidebar.tsx                     # el <Link> pasa a <NewPostTrigger>
    MobileTopBar.tsx                # ídem
app/
  (app)/layout.tsx                  # envuelve con <NewPostDialogProvider options={buildNewPostOptions(mockElderly)}>
  globals.css                       # tokens de chip si faltan (#FFFDF9, #6E6359)
```

`Sidebar`, `MobileTopBar`, `FeedView` y el layout siguen siendo Server Components. Los Client Components nuevos son `NewPostDialogProvider`, `NewPostTrigger`, `NewPostForm` y `PhotoPicker` (usa `useEffect` para liberar URLs). `AudiencePicker` y `PostTypePicker` no usan hooks.

Se reutilizan desde `elderly/`: `FormField`, `fieldControlClassName` y `getFieldErrorId` (`elderly/components/FormField.tsx`), y `ChevronDownIcon`, `PlusIcon`, `ImageIcon` y `CloseIcon` de `shared/components/icons/`.

---

## Plan de implementación

1. **Tipos y reglas.** Tipos nuevos, `new-post-limits.ts`, `new-post-messages.ts`, `build-new-post-options.ts`, `toggle-audience.ts`, `validate-new-post.ts` y `select-photos.ts`. Prueba: `npm run build`.
2. **Abrir y cerrar el modal.** `NewPostDialogProvider` en el layout con el `<dialog>` y el encabezado del mockup. `NewPostTrigger` reemplaza los `<Link>` de `Sidebar` y `MobileTopBar`; `PostComposerLink` pasa a `PostComposerButton`. Mismo aspecto que hoy. Cancelar y Esc cierran; el clic en el fondo no. Prueba: abrir desde los tres botones, cerrar con Cancelar y con Esc, y que el foco vuelva al botón usado.
3. **PARA y TIPO.** `AudiencePicker` con chips, exclusión vía `toggleAudience` y select HABITACIÓN. `PostTypePicker` con los 5 tipos. Prueba: marcar Luis y Carmen, luego "Toda la habitación" (desmarca ambos y aparece el select), luego Jorge (desaparece el select).
4. **DESCRIPCIÓN y FOTOS.** Textarea con `maxLength`. `PhotoPicker` con input oculto, miniaturas, quitar, límites con `selectPhotos` y liberación de URLs al quitar y al cerrar. Prueba: elegir 6 imágenes deja 5, oculta "Agregar" y muestra "Puedes agregar hasta 5 fotos.".
5. **Validación.** Al enviar: estado de audiencia + `FormData` → `NewPostInput` → `validateNewPost`. Errores, `aria-invalid`, foco en el primer bloque con error y limpieza al cambiar el bloque. Prueba: Publicar vacío muestra 3 errores y pone el foco en la primera chip.
6. **Comparación con el mockup.** Con Luis, Actividad, el texto del mockup y una foto, a 1440×900 coincide con `crear-publicacion.dc.html`.
7. **Móvil.** Bajo `sm`: pantalla completa, encabezado fijo y scroll interno. Prueba: a 390×844 se abre desde el "+" del `MobileTopBar`, sin scroll horizontal, y Publicar sigue visible al hacer scroll.
8. **Capturas de verificación.** Con Playwright, en `.playwright-mcp/`: el mockup y el modal a 1440×900, el modal con errores, el modal con "Toda la habitación" y fotos, y el modal a 390×844.

---

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] La consola no muestra errores ni warnings de hidratación en `/`, `/elderly` y `/elderly/elderly-luis`, ni al abrir y cerrar el modal.
- [x] "Nueva publicación" del sidebar, el "+" del `MobileTopBar` y "Comparte un momento…" abren el mismo modal, y la URL no cambia.
- [x] Los tres botones se ven igual que antes de esta spec.
- [x] Hay un solo `<dialog>` de nueva publicación en el DOM, abierto con `showModal()` y con `aria-labelledby` apuntando al título.
- [x] Con Luis, Actividad, el texto del mockup y una foto, a 1440×900 el modal y `crear-publicacion.dc.html` no muestran diferencias visibles en la tarjeta (textos, colores, tipografía, bordes y orden), salvo el contenido de la miniatura.
- [x] PARA lista los 8 adultos mayores de `mockElderly` en orden, con su inicial y tono, seguidos de "Toda la habitación" y "Toda la guardería". Al abrir no hay ninguna chip marcada.
- [x] Se pueden marcar varios adultos mayores a la vez, y cada chip refleja su estado con `aria-pressed`.
- [x] Marcar "Toda la habitación" o "Toda la guardería" desmarca todo lo demás; marcar un adulto mayor desmarca esas dos.
- [x] Con "Toda la habitación" aparece el select HABITACIÓN con Roble y Cedro, y Roble elegida. Al cambiar de audiencia desaparece.
- [x] TIPO son radios con `name="type"`, sin ninguno elegido al abrir. El elegido tiene fondo del color `fg` del tipo y texto blanco.
- [x] DESCRIPCIÓN tiene el placeholder del mockup y `maxlength="2000"`.
- [x] "Agregar" abre el selector de archivos con `accept="image/*"` y `multiple`. Cada foto elegida aparece como miniatura con su botón "Quitar foto N".
- [x] Elegir 6 imágenes deja 5 miniaturas, oculta "Agregar" y muestra "Puedes agregar hasta 5 fotos.".
- [x] Un archivo que no es imagen se descarta con "Solo puedes agregar imágenes.", y uno de más de 10 MB con "Cada foto puede pesar hasta 10 MB.".
- [x] Publicar con el formulario vacío muestra los errores de PARA, TIPO y DESCRIPCIÓN, y pone el foco en la primera chip de PARA.
- [x] Descripción con solo espacios muestra "Escribe una descripción.".
- [ ] Cada bloque con error muestra el mensaje en `--color-error` y su control tiene `aria-invalid="true"` y `aria-describedby` apuntando al mensaje.
- [x] Cambiar un bloque con error quita su mensaje.
- [x] Publicar con todo válido (con o sin fotos) no muestra errores, no cierra el modal y no cambia el feed.
- [x] "Cancelar" y Esc cierran el modal. Hacer clic en el fondo no lo cierra.
- [x] Al cerrar, el foco vuelve al botón que lo abrió.
- [x] Cerrar y reabrir muestra el modal vacío: sin chips marcadas, sin tipo, sin texto, sin fotos y sin errores.
- [x] Con el modal abierto no se puede hacer scroll en la página de fondo.
- [x] `buildNewPostOptions`, `toggleAudience`, `validateNewPost` y `selectPhotos` son funciones puras sin imports de React.
- [x] Los únicos `"use client"` nuevos están en `NewPostDialogProvider.tsx`, `NewPostTrigger.tsx`, `NewPostForm.tsx` y `PhotoPicker.tsx`. `Sidebar`, `MobileTopBar`, `FeedView` y `app/(app)/layout.tsx` siguen siendo Server Components.
- [x] A 390×844 el modal ocupa toda la pantalla, sin scroll horizontal, con Cancelar/Publicar visibles mientras se hace scroll.
- [x] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** un solo modal en el layout con un provider de contexto. Los tres disparadores comparten estado y el `<dialog>` existe una sola vez. `Sidebar` y `MobileTopBar` siguen siendo Server Components y solo el botón es cliente.
- **No:** Invoker Commands nativos (`commandfor`/`command`). API reciente; no se verificó su soporte en React 19.3.
- **No:** un `<dialog>` por disparador. Triplica el modal y su estado.
- **Sí:** los tres disparadores abren el modal. Sin el "+" del `MobileTopBar` no habría forma de abrirlo en móvil.
- **Sí:** PARA con todos los adultos mayores activos de `mockElderly`. El filtro por rol (`staff_elderly`) llega con Supabase.
- **Sí:** "Toda la guardería" visible para todos, igual que el mockup. Ocultarla al staff va en la spec de roles, como en SPEC 04 y 05.
- **Sí:** select HABITACIÓN bajo las chips al marcar "Toda la habitación", con Roble por defecto. El mockup no define cómo elegir la habitación y `room_id` es obligatorio con `audience = room`.
- **No:** una chip por habitación. Se aparta del copy del mockup.
- **Sí:** selección excluyente por audiencia. Refleja `post_audience`: un post es para adultos mayores, una habitación o la guardería, nunca una mezcla.
- **Sí:** nada marcado al abrir, ni en PARA ni en TIPO. Las selecciones del mockup son un ejemplo con contenido.
- **Sí:** TIPO de selección única con radios. Un post tiene un solo `type`. En el mockup, el fondo sólido marca el elegido.
- **Sí:** chips de PARA como `<button aria-pressed>`. Mezclan selección múltiple con opciones excluyentes, cosa que no cubren bien los checkboxes ni los radios.
- **Sí:** Publicar valida, muestra errores y no cierra, como SPEC 04 y 05. Cerrar y agregar al feed llegan con la Server Action.
- **Sí:** fotos con vista previa local, máximo 5, solo imágenes y 10 MB cada una (decisión del usuario).
- **No:** advertencia de `photo_consent`. Va con la persistencia y el filtro por rol.
- **Sí:** descripción de máximo 2000 caracteres, sin contador (el mockup no tiene).
- **Sí:** reutilizar `FormField` y `buildRoomOptions` de `elderly/`. Moverlos a `shared/` queda para la spec que unifique componentes de formulario.
- **Sí:** foco inicial en la primera chip de PARA. Es el primer campo, como NOMBRES en SPEC 04 y 05.
- **Sí:** cambia lo decidido en SPEC 01: los tres botones dejan de ser `<Link href="/">` y `PostComposerLink` pasa a `PostComposerButton`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las miniaturas con `createObjectURL` dejan memoria tomada si no se liberan | Se llama a `URL.revokeObjectURL` al quitar una foto y al cerrar (desmontar) el formulario. |
| `Sidebar` y `MobileTopBar` (en `shared/`) importan `NewPostTrigger` de `feed/` | Aceptado: es la acción principal de la app. Si crece, se pasa el disparador como prop desde el layout. |
| El provider en el layout agrega el modal a todas las páginas de `(app)` | Es intencional: el sidebar está en todas. El `<dialog>` cerrado no se ve ni recibe foco. |
| Se puede saltar la validación en el cliente | Hoy no se persiste nada. La Server Action futura validará en el servidor y armará `audience` ahí. |
| `mockElderly` y `mockFeed` tienen datos distintos para Luis (Fernández / Ramírez) | El modal usa solo `mockElderly`. Se unifican al llegar Supabase. |
| `accept="image/*"` no impide elegir otros archivos en todos los navegadores | `selectPhotos` revisa el `type` de cada archivo. |

---

## Lo que **no** entra en esta spec

- Guardar de verdad (Server Action, Supabase, Storage, migraciones), cerrar al publicar, toast y post en el feed.
- Advertencia de consentimiento de fotos.
- Diferencias por rol en PARA.
- Título del post.
- Editar o borrar publicaciones.
- Ruta propia del modal.
- Confirmar descarte de cambios.
- Editar, reordenar o comprimir fotos.
- Diálogo compartido entre los tres modales.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
