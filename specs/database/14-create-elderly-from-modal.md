# SPEC 14 — Guardar el adulto mayor desde el modal "Agregar adulto mayor"

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 11, SPEC 13
> **Fecha:** 2026-11-09
> **Objetivo:** Hacer que "Guardar" del modal "Agregar adulto mayor" cree la fila en `elderly` con una Server Action solo para admin, con las alergias en español, límites de longitud y un toast de éxito o error.

---

## Alcance

**Dentro:**

- Server Action `createElderly` en `elderly/actions/create-elderly.ts`:
  - Usa el cliente con sesión de `shared/supabase/server.ts`. No usa `service_role`.
  - Rechaza a quien no sea admin activo.
  - Repite la validación del cliente con la fecha de hoy de Lima y las habitaciones visibles por RLS.
  - Convierte el texto de alergias en `allergy_tags`, en español.
  - Inserta en `elderly` y llama a `refresh()` para que `/elderly` muestre el alta.
- Alergias en español, tal como las escribe el admin:
  - Se separa por comas, se quitan los espacios sobrantes y los vacíos.
  - Se eliminan los repetidos ignorando mayúsculas y tildes (queda el primero).
  - La UI las muestra en mayúsculas con `toLocaleUpperCase("es")`: `Maní` → `MANÍ`.
- Pasar a español los datos actuales: `seed.sql`, las 2 filas remotas del seed (`{peanut}` → `{Maní}`, `{lactose}` → `{Lactosa}`) y `elderly/mock-elderly.ts`. Se elimina `elderly/allergy-labels.ts`.
- Límites de longitud en el formulario, en la Server Action y en la DB (migración nueva):
  - `first_name` y `last_name`: máximo 80 caracteres.
  - `allergy_tags`: máximo 15 alergias, cada una con 1 a 40 caracteres.
  - `medical_notes`: máximo 2000 caracteres.
- El botón "Agregar adulto mayor" solo lo ve el admin.
- Estado pendiente: "Guardar" muestra "Guardando…" y queda deshabilitado. Cancelar, Esc y los campos quedan bloqueados hasta la respuesta.
- Resultado:
  - Éxito: el modal se cierra y se limpia, el listado muestra al nuevo adulto mayor y aparece un toast de éxito.
  - Errores de campo devueltos por el servidor: se muestran bajo cada campo, igual que los del cliente. Sin toast.
  - Cualquier otro error (permisos, DB, red): toast de error, el modal sigue abierto y conserva lo escrito.
- Componente `Toast` reutilizable en `shared/components/toast/` (diseño A, ver modelo de datos).
- Actualizar `specs/BACKLOG.md`.
- `references/documents/database-schema.md` ya se actualizó al redactar esta spec (ver "Cambios en el esquema").

**Fuera de alcance (para specs futuras):**

- Traducir alergias con un servicio externo. Descartado por costo y riesgo: se guardan en español.
- Editar, archivar o reactivar adultos mayores.
- Habitación `Temporal` por defecto en el selector.
- Consentimiento de fotos en el formulario (sigue el default `true`).
- Detectar adultos mayores duplicados.
- Mostrar todas las alergias como chips. La tarjeta sigue mostrando solo la primera.
- Conectar `/elderly/[id]` a Supabase.
- Un sistema global de toasts (cola, proveedor en el layout). El toast vive en `AddElderlyDialog`.
- Policies de `elderly` para staff y relative.
- Dark mode.

---

## Modelo de datos

### Migración `supabase/migrations/<version>_add_elderly_length_limits.sql`

```sql
create function public.are_valid_allergy_tags(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(tags) <= 15
    and not exists (
      select 1 from unnest(tags) as tag
      where tag is null
        or char_length(trim(tag)) = 0
        or char_length(tag) > 40
    );
$$;

alter table public.elderly
  add constraint elderly_first_name_max_length check (char_length(first_name) <= 80),
  add constraint elderly_last_name_max_length check (char_length(last_name) <= 80),
  add constraint elderly_medical_notes_max_length check (char_length(medical_notes) <= 2000),
  add constraint elderly_allergy_tags_valid check (public.are_valid_allergy_tags(allergy_tags));
```

- La función no es `SECURITY DEFINER`: no lee tablas.
- Antes de aplicarla, las 5 filas del seed deben cumplir las restricciones. Se comprueba con `execute_sql`.

### Datos existentes

Se actualizan con `execute_sql`, **pidiendo permiso antes**, y se cambia `supabase/seed.sql` para que coincida:

| `id` | Antes | Después |
| --- | --- | --- |
| `00000000-0000-0000-0000-000000000201` (Luis) | `{peanut}` | `{Maní}` |
| `00000000-0000-0000-0000-000000000205` (Alberto) | `{lactose}` | `{Lactosa}` |

En `elderly/mock-elderly.ts`: `["peanut"]` → `["Maní"]` y `["lactose"]` → `["Lactosa"]`.

### Tipos y funciones puras

```ts
// elderly/types.ts (se agrega)
export type CreateElderlyResult =
  | { status: "success"; fullName: string }
  | { status: "invalid"; errors: NewElderlyErrors }
  | { status: "error" };

// shared/components/toast/types.ts
export type ToastTone = "success" | "error";
export type ToastMessage = { tone: ToastTone; title: string; description: string };
```

- `elderly/read-new-elderly-input.ts` → `readNewElderlyInput(formData: FormData): NewElderlyInput`. Se extrae de `AddElderlyForm` para que la usen el cliente y la Server Action.
- `elderly/parse-allergy-tags.ts` → `parseAllergyTags(text: string): string[]`. Separa, limpia y deduplica con `normalizeSearch` de `shared/text/normalize-search.ts`. Ejemplo: `"maní,  Lactosa, , Maní"` → `["maní", "Lactosa"]`.
- `elderly/validate-new-elderly.ts` suma los límites. Las longitudes se cuentan en caracteres (`[...text].length`), igual que `char_length`, y se miden sobre el texto recortado.
- `elderly/build-elderly-list.ts` usa `firstAllergy.toLocaleUpperCase("es")` en lugar de `getAllergyLabel`.

### Mensajes nuevos (`elderly/new-elderly-messages.ts`)

| Campo | Caso | Mensaje |
| --- | --- | --- |
| `firstName` | más de 80 | "Usa como máximo 80 caracteres." |
| `lastName` | más de 80 | "Usa como máximo 80 caracteres." |
| `allergies` | más de 15 alergias | "Ingresa como máximo 15 alergias." |
| `allergies` | alguna con más de 40 | "Cada alergia puede tener como máximo 40 caracteres." |
| `medicalNotes` | más de 2000 | "Usa como máximo 2000 caracteres." |

`firstName`, `lastName` y `medicalNotes` llevan además el atributo `maxLength` (80, 80 y 2000).

### Server Action

```ts
// elderly/actions/create-elderly.ts
"use server";
export async function createElderly(formData: FormData): Promise<CreateElderlyResult>;
```

Orden:

1. `getCurrentUser()`. Si no hay usuario o su `role` no es `admin` → `{ status: "error" }`.
2. `readNewElderlyInput(formData)`.
3. Leer los ids de `rooms` (RLS limita a su guardería). Si falla → `{ status: "error" }`.
4. `validateNewElderly(input, { today: getLimaToday(), roomIds })`. Con errores → `{ status: "invalid", errors }`.
5. Insertar: nombres recortados, `allergy_tags = parseAllergyTags(...)` y `medical_notes` recortada, o `null` si queda vacía. `photo_consent` y `status` usan sus defaults.
6. Si el insert falla → `{ status: "error" }`. El detalle se registra con `console.error` en el servidor; al cliente no llega.
7. `refresh()` y `{ status: "success", fullName }`.

### Toast (diseño A)

- Tarjeta con fondo `surface` (`#FFFDF9`), borde `line` (`#ECE0D0`), radio 16px y sombra suave, como las tarjetas del feed.
- Ícono en un círculo: `CheckIcon` sobre verde `#5FB97E` (éxito) o `AlertIcon` sobre `--color-error` (error).
- Título en negrita (`ink`), descripción debajo (`muted-strong`) y botón ✕ (`CloseIcon`) con `aria-label="Cerrar aviso"`.
- Posición `fixed`: abajo al centro bajo `sm`, con 16px a los lados y ancho completo; abajo a la derecha desde `sm`, a 24px de los bordes y con máximo 360px de ancho.
- Se cierra solo a los 5 s (éxito) u 8 s (error). El tiempo se pausa con hover o foco dentro del toast. ✕ lo cierra al instante.
- `role="status"` en éxito y `role="alert"` en error.
- Entrada con desplazamiento y fundido corto. Sin animación con `prefers-reduced-motion: reduce`.
- Solo uno a la vez: uno nuevo reemplaza al anterior.

Textos:

| Tono | Título | Descripción |
| --- | --- | --- |
| éxito | "Adulto mayor agregado" | "{fullName} ya está en la lista." |
| error | "No pudimos guardar" | "Intenta de nuevo en un momento." |

Con el `<dialog>` abierto, el resto de la página es inerte. Por eso el toast de error se renderiza dentro del `<dialog>` y el de éxito, fuera, después de cerrarlo.

### Cambios en el esquema

Ya aplicados en `references/documents/database-schema.md` al redactar esta spec. No forman parte del plan ni de los criterios de aceptación:

1. **Convención de idioma:** solo los valores controlados (enums, códigos) van en inglés. El texto que escribe el usuario (nombres, notas, alergias) se guarda tal como lo escribe.
2. **Helpers:** se menciona `are_valid_allergy_tags(text[])`, `IMMUTABLE` y no `SECURITY DEFINER`.
3. **`first_name` y `last_name`:** máximo 80 caracteres (`elderly_first_name_max_length`, `elderly_last_name_max_length`).
4. **`medical_notes`:** "Notas médicas", sin "Alergias". Nullable; vacía se guarda como `null`. Máximo 2000 caracteres (`elderly_medical_notes_max_length`).
5. **`allergy_tags`:** texto libre en español; máximo 15, cada una de 1 a 40 caracteres, sin vacías ni `null` (`elderly_allergy_tags_valid`).
6. **Nota `allergy_tags`:** sin códigos ni traducción; se separa por comas, se limpia y se deduplica; la UI la muestra en mayúsculas.

---

## Estructura de archivos

```
supabase/
  migrations/<version>_add_elderly_length_limits.sql   # nuevo
  seed.sql                                              # alergias en español
references/documents/database-schema.md                 # ya actualizado al redactar la spec
specs/BACKLOG.md                                        # entrada "Guardar desde…" resuelta
app/(app)/elderly/page.tsx                              # pasa canAddElderly según el rol
elderly/
  actions/create-elderly.ts                             # nuevo
  read-new-elderly-input.ts                             # nuevo (extraído de AddElderlyForm)
  parse-allergy-tags.ts                                 # nuevo
  validate-new-elderly.ts                               # + límites
  new-elderly-messages.ts                               # + mensajes de límites
  types.ts                                              # + CreateElderlyResult
  build-elderly-list.ts                                 # mayúsculas en lugar de getAllergyLabel
  allergy-labels.ts                                     # se elimina
  mock-elderly.ts                                       # alergias en español
  components/
    ElderlyListView.tsx                                 # muestra el botón solo si canAddElderly
    AddElderlyDialog.tsx                                # pendiente, cierre al guardar, toasts
    AddElderlyForm.tsx                                  # llama a createElderly, maxLength
shared/components/toast/
  Toast.tsx                                             # nuevo ("use client": temporizador y pausa)
  types.ts                                              # nuevo
```

---

## Plan de implementación

1. **Revisión previa.** Con `execute_sql`, confirmar que las 5 filas cumplen los límites nuevos y ver los valores actuales de `allergy_tags`. Prueba: ninguna fila los viola.
2. **Datos en español.** Pedir permiso; `update` de las 2 filas con `execute_sql`. Cambiar `seed.sql`, `mock-elderly.ts` y `build-elderly-list.ts`, y eliminar `allergy-labels.ts`. Prueba: `/elderly` sigue mostrando MANÍ y LACTOSA; `npm run build`.
3. **Migración local.** Escribir `add_elderly_length_limits.sql`. Prueba: revisión del diff.
4. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `add_elderly_length_limits`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: las 4 restricciones aparecen en `pg_constraint`.
5. **Pruebas de restricciones.** Con `execute_sql` en transacciones con `rollback`: ver criterios de aceptación.
6. **Funciones puras.** `read-new-elderly-input.ts`, `parse-allergy-tags.ts`, límites y mensajes en `validate-new-elderly.ts`. `AddElderlyForm` usa `readNewElderlyInput` y suma `maxLength`. Prueba: `npm run build`; el modal valida igual que antes y muestra los mensajes de límites.
7. **Server Action.** `create-elderly.ts` con los pasos del modelo de datos. Prueba: `npm run build`.
8. **Toast.** `shared/components/toast/` con el diseño A. Prueba: `npm run lint`.
9. **Guardar desde el modal.** `AddElderlyForm` valida en el cliente y, si todo está bien, llama a `createElderly` con `useTransition`. `AddElderlyDialog` maneja el pendiente (bloquea Cancelar, Esc y campos), cierra al guardar y muestra los toasts. Prueba: como admin, crear un adulto mayor lo muestra en el listado con el toast de éxito.
10. **Botón solo para admin.** `page.tsx` pasa `canAddElderly={user.role === "admin"}` y `ElderlyListView` muestra el botón solo en ese caso. Prueba: como staff no se ve.
11. **Advisors.** `get_advisors` (security y performance).
12. **Documentación.** Marcar en `BACKLOG.md` la entrada "Guardar desde «Agregar adulto mayor»" como resuelta.
13. **Capturas de verificación.** Con Playwright, en `.playwright-mcp/`: modal en "Guardando…", toast de éxito y toast de error a 1440×900, y toast de éxito a 390×844.

---

## Criterios de aceptación

**Migración y datos**

- [ ] Existe `supabase/migrations/<version>_add_elderly_length_limits.sql` y su versión coincide con la de `list_migrations`.
- [ ] `elderly` tiene `elderly_first_name_max_length`, `elderly_last_name_max_length`, `elderly_medical_notes_max_length` y `elderly_allergy_tags_valid`.
- [ ] Luis tiene `{Maní}` y Alberto `{Lactosa}` en el remoto y en `seed.sql`; ninguna fila tiene `peanut` ni `lactose`.
- [ ] `elderly/allergy-labels.ts` no existe y nada lo importa.

**Restricciones**

- [ ] Insertar `first_name` o `last_name` de 81 caracteres falla; de 80 funciona.
- [ ] Insertar `medical_notes` de 2001 caracteres falla; de 2000 funciona; `null` funciona.
- [ ] Insertar 16 alergias falla; 15 funciona; `{}` funciona.
- [ ] Insertar una alergia de 41 caracteres, vacía, solo con espacios o `null` falla.
- [ ] `get_advisors` no muestra avisos nuevos causados por esta spec, salvo los aceptados en BACKLOG.

**Funciones puras**

- [ ] `parseAllergyTags("maní,  Lactosa, , Maní")` devuelve `["maní", "Lactosa"]`.
- [ ] `parseAllergyTags("")` y `parseAllergyTags(" , ")` devuelven `[]`.
- [ ] `parseAllergyTags("Polen de olivo")` devuelve `["Polen de olivo"]`.
- [ ] `validateNewElderly` devuelve los mensajes de límites de la tabla y cuenta "ñ" o "á" como un carácter.
- [ ] `readNewElderlyInput`, `parseAllergyTags` y `validateNewElderly` son funciones puras sin imports de React.

**Guardar como admin**

- [ ] Con datos válidos, "Guardar" muestra "Guardando…", deshabilitado, y Cancelar y Esc no cierran mientras tanto.
- [ ] Al terminar, el modal se cierra, el nuevo adulto mayor aparece en `/elderly` en su orden alfabético y el conteo sube en 1, sin recargar la página.
- [ ] Aparece el toast "Adulto mayor agregado" con "{nombre completo} ya está en la lista." y `role="status"`.
- [ ] Al reabrir, el modal está vacío, sin errores y con la primera habitación seleccionada.
- [ ] La fila guardada tiene los nombres recortados, la habitación elegida, `photo_consent = true` y `status = active`.
- [ ] Alergias `"maní,  Lactosa, , Maní"` se guardan como `{maní,Lactosa}` y la tarjeta muestra MANÍ.
- [ ] Notas médicas vacías o solo con espacios se guardan como `null`.

**Errores**

- [ ] Si la Server Action recibe datos inválidos (por ejemplo, nacimiento futuro saltando la validación del cliente), devuelve `invalid` y el modal muestra el error bajo el campo, sin toast y sin crear la fila.
- [ ] Si el insert falla (por ejemplo, una habitación que dejó de existir), aparece el toast "No pudimos guardar" con `role="alert"`, el modal sigue abierto con lo escrito y no se crea ninguna fila.
- [ ] El toast de error se ve por encima del modal y su ✕ funciona con el modal abierto.
- [ ] La respuesta al cliente no incluye el mensaje de error de Postgres.

**Permisos**

- [ ] Como staff, el botón "Agregar adulto mayor" no aparece en `/elderly`.
- [ ] Llamar a `createElderly` como staff devuelve `error` y no crea filas.
- [ ] La Server Action usa el cliente de `shared/supabase/server.ts`; no hay cliente `service_role`.

**Toast**

- [ ] Coincide con el diseño A: fondo `#FFFDF9`, borde `#ECE0D0`, círculo verde `#5FB97E` en éxito y `#C5413A` en error.
- [ ] El de éxito se cierra solo a los 5 s y el de error a los 8 s; con el mouse encima o con foco dentro no se cierra.
- [ ] ✕ lo cierra y tiene `aria-label="Cerrar aviso"`.
- [ ] Con `prefers-reduced-motion: reduce` aparece sin animación.
- [ ] A 390×844 ocupa el ancho con 16px a los lados, sin scroll horizontal; desde `sm` queda abajo a la derecha con máximo 360px.

**Cierre**

- [ ] `npm run build` y `npm run lint` terminan sin errores, y la consola de `/elderly` no muestra errores nuevos ni warnings de hidratación.
- [ ] `BACKLOG.md` marca "Guardar desde «Agregar adulto mayor»" como resuelto en SPEC 14.
- [ ] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** alergias en español, tal como las escribe el admin. Decisión del usuario: cada alergia es única y específica, y traducirla cuesta dinero y suma un tercero con datos de salud.
- **No:** traducir con Claude Haiku, DeepL o una Edge Function. Se evaluaron; la key quedaría segura en el servidor, pero suman costo, dependencia y una ida y vuelta que pierde fidelidad ("Maní" → "peanut" → "Cacahuete").
- **No:** diccionario de códigos en inglés (`peanut`). No cubre alergias específicas.
- **Sí:** cambia la regla "todo lo persistido va en inglés" para `allergy_tags`. Son contenido escrito por el usuario, no códigos; los enums siguen en inglés.
- **Sí:** separar por comas, limpiar y deduplicar sin distinguir mayúsculas ni tildes, conservando lo escrito. Evita duplicados sin cambiar el texto del admin.
- **Sí:** pasar el seed, las filas remotas y el mock a español y eliminar `allergy-labels.ts`. Un solo formato, sin dos caminos.
- **Sí:** límites en formulario, servidor y DB. La DB protege lo mismo que la UI, igual que en SPEC 13.
- **Sí:** función `IMMUTABLE` para validar el array. Un `check` no admite subconsultas.
- **Sí:** contar caracteres como `char_length`. Así el cliente y la DB coinciden con tildes y emojis.
- **Sí:** cliente con sesión y RLS, sin `service_role`. Crear adultos mayores no está entre los casos de `service_role` y la policy `elderly_insert_admin` ya existe.
- **Sí:** revisar el rol en la Server Action además de RLS. Devuelve un error claro y no depende solo de la DB.
- **Sí:** ocultar el botón al staff. Decisión del usuario; solo el admin puede crear.
- **Sí:** repetir la validación en el servidor con la misma función pura. La del cliente se puede saltar.
- **Sí:** `refresh()` tras guardar. `/elderly` no usa caché; según la documentación local de Next 16.4.5, `refresh()` refresca el router del cliente desde una Server Action.
- **Sí:** `useTransition` con resultado tipado, en lugar de `useActionState`. La validación del cliente decide antes si se llama al servidor y el resultado se maneja en un solo lugar.
- **Sí:** toast diseño A, 5 s / 8 s, pausa y ✕. Decisión del usuario; el mockup no define confirmaciones.
- **Sí:** toast para errores generales y mensajes bajo el campo para errores de validación. Cada error queda junto a lo que lo causa.
- **Sí:** toast local en `AddElderlyDialog`, con el componente en `shared/`. Reutilizable sin crear todavía un sistema global.
- **Sí:** bloquear Cancelar, Esc y los campos mientras se guarda. Evita dobles altas y cierres con la operación en curso.
- **No:** mostrar el error de Postgres al usuario. Puede filtrar detalles internos.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración y el `update` se aplican directo al remoto | Se pide permiso antes de cada uno; se comprueba antes que las filas cumplen los límites. |
| Un toast `fixed` dentro del `<dialog>` queda recortado o detrás del fondo | Se verifica con Playwright; el `<dialog>` no tiene `transform`, así que `fixed` se ubica respecto al viewport. |
| Alergias escritas de formas distintas ("Mani" y "Maní") en adultos mayores distintos | Aceptado: es texto libre por decisión del usuario. |
| Admin con sesión vencida al guardar | `getCurrentUser()` devuelve `null` y se muestra el toast de error; el modal conserva lo escrito. |
| Doble clic en "Guardar" | El botón se deshabilita en cuanto empieza la transición. |

---

## Lo que **no** entra en esta spec

- Traducción de alergias.
- Editar, archivar o reactivar adultos mayores.
- Habitación `Temporal` por defecto y consentimiento de fotos en el formulario.
- Detección de duplicados.
- Chips con todas las alergias.
- Perfil con datos reales.
- Sistema global de toasts.
- Policies de staff y relative.

Cada una de esas, si llega, va en su propia spec.
