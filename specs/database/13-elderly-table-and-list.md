# SPEC 13 — Tabla `elderly` y listado "Adultos mayores" con datos reales

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 04, SPEC 11, SPEC 12
> **Fecha:** 2026-11-09
> **Objetivo:** Crear la tabla `elderly` con sus policies de admin y 5 adultos mayores de prueba, y alimentar con ellos y con las habitaciones reales la pantalla `/elderly`.

---

## Alcance

**Dentro:**

- Migración `supabase/migrations/<version>_create_elderly.sql`:
  - Enum `elderly_status` y tabla `public.elderly`, con restricciones e índice en `room_id`.
  - Trigger `set_updated_at()`.
  - RLS activado, policies de admin para select, insert y update, y permisos por columna.
- `supabase/seed.sql`: 5 adultos mayores en Casa Nogal, sin familiares vinculados.
- Aplicar la migración con `apply_migration` y el seed con `execute_sql`, **pidiendo permiso antes de cada uno**.
- Pruebas de restricciones y RLS con `execute_sql` dentro de transacciones con `rollback`.
- `/elderly` lee `elderly` y `rooms` de Supabase con el cliente de `shared/supabase/server.ts`:
  - Lista de activos ordenada por `full_name`.
  - Edad calculada con la fecha real de Lima.
  - Color de avatar derivado del `id`.
  - Todas las tarjetas con cero familiares: "sin familiares vinculados", y VINCULAR si no tienen alergias.
- Tarjetas sin enlace al perfil.
- Estado vacío cuando no hay ningún adulto mayor: "Todavía no hay adultos mayores."
- Modal "Agregar adulto mayor": sigue sin guardar, pero usa habitaciones reales y la fecha real de Lima.
- Actualizar `references/documents/database-schema.md` y `specs/BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- Policies de `elderly` para staff y relative, que dependen de `staff_elderly` y `guardian_elderly`.
- Tablas `staff_elderly`, `guardian_elderly` e `invitations`, y conteos reales de familiares.
- Conectar `/elderly/[id]` a Supabase y restaurar el enlace de las tarjetas. El perfil sigue con el mock.
- Guardar desde el modal "Agregar adulto mayor" (Server Action, validación en servidor, conversión de alergias a etiquetas).
- Reemplazar el mock en el modal de nueva publicación y en `/activate-account`. `elderly/mock-elderly.ts` se conserva.
- Editar, archivar o reactivar adultos mayores desde la UI.
- `error.tsx` con diseño propio.
- Ocultar "Agregar adulto mayor" al staff.
- Tipos TS generados; el tipo `Elderly` de `shared/database/types.ts` no cambia.

---

## Modelo de datos

```sql
create type public.elderly_status as enum ('active', 'archived');

create table public.elderly (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.elderly_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint elderly_first_name_not_blank check (length(trim(first_name)) > 0),
  constraint elderly_last_name_not_blank check (length(trim(last_name)) > 0),
  constraint elderly_enrolled_after_birth check (enrolled_at > birth_date)
);

create index elderly_room_id_idx on public.elderly (room_id);

create trigger elderly_set_updated_at
  before update on public.elderly
  for each row execute function public.set_updated_at();
```

- El modal no exige `allergy_tags`, `photo_consent` ni `status`. Son `not null` con default: si se omiten, la DB completa `{}`, `true` y `active`.
- `medical_notes` admite `null`.
- `on delete restrict` impide borrar una habitación con adultos mayores, incluidos los archivados.

### Policies

Todas son `to authenticated`, con los helpers envueltos en `(select ...)`.

| Policy | Acción | Regla |
| --- | --- | --- |
| `elderly_select_admin` | select | admin; `room_id` en una habitación de su guardería |
| `elderly_insert_admin` | insert | admin; `room_id` en una habitación de su guardería |
| `elderly_update_admin` | update | admin; habitación actual y de destino en su guardería (`using` + `with check`) |

La regla de la habitación es la misma en las tres:

```sql
(select public.is_admin())
and room_id in (
  select id from public.rooms
  where daycare_id = (select public.current_user_daycare_id())
)
```

### Permisos

```sql
grant select, insert on public.elderly to authenticated;
revoke update, delete on public.elderly from authenticated;
grant update (
  room_id, first_name, last_name, birth_date, enrolled_at,
  medical_notes, allergy_tags, photo_consent, status
) on public.elderly to authenticated;
```

No hay policy de `delete`: el borrado es lógico con `status = 'archived'`.

### Seed

Se agrega a `supabase/seed.sql`, después de las habitaciones, con `on conflict (id) do nothing`. `photo_consent` y `status` usan sus defaults.

| `id` | Nombre | Habitación | `birth_date` | `enrolled_at` | `allergy_tags` | `medical_notes` |
| --- | --- | --- | --- | --- | --- | --- |
| `00000000-0000-0000-0000-000000000201` | Luis Fernández | Roble | 1947-03-12 | 2025-02-10 | `{peanut}` | Hipertensión: toma su pastilla a las 12:00. |
| `00000000-0000-0000-0000-000000000202` | Carmen Ruiz | Roble | 1950-01-20 | 2024-09-02 | `{}` | Diabetes: toma su pastilla en el desayuno. |
| `00000000-0000-0000-0000-000000000203` | Jorge Salazar | Cedro | 1943-05-08 | 2024-11-18 | `{}` | Artrosis: camina con bastón. |
| `00000000-0000-0000-0000-000000000204` | Rosa Méndez | Cedro | 1945-02-14 | 2025-03-24 | `{}` | Asma: usa su inhalador por la mañana. |
| `00000000-0000-0000-0000-000000000205` | Alberto Díaz | Roble | 1939-04-03 | 2024-07-15 | `{lactose}` | Colesterol alto: toma su pastilla en la cena. |

Las notas médicas no se ven en esta spec: solo las muestra el perfil, que sigue con el mock.

### Lectura en la app

```ts
// elderly/get-elderly-source.ts (server-only)
export async function getElderlySource(): Promise<ElderlySource>;
```

- Hace `await io()` antes de leer la fecha, igual que `getSessionClaims()`.
- Consulta `elderly` ordenada por `full_name` y `rooms` ordenada por `name`. Si una consulta falla, lanza el error.
- Devuelve `relatives`, `guardianElderly` e `invitations` vacíos. Así los builders actuales dan cero familiares sin cambios.
- `referenceDate` = `getLimaToday()`.
- `avatarTones` se arma con `getAvatarTone(id)` para cada adulto mayor.

```ts
// shared/date/get-lima-today.ts — "aaaa-mm-dd" en America/Lima
export function getLimaToday(): string;

// elderly/get-avatar-tone.ts — función pura; suma los códigos de los caracteres del id
// y toma el resto entre blue, pink, green, yellow y purple
export function getAvatarTone(id: string): AvatarTone;
```

### Cambios en el esquema

En `references/documents/database-schema.md`, sección `elderly`:

1. **`room_id`:** agregar `ON DELETE RESTRICT`.
2. **`first_name` y `last_name`:** no vacíos ni solo espacios (`elderly_first_name_not_blank`, `elderly_last_name_not_blank`).
3. **`birth_date` y `enrolled_at`:** `NOT NULL`, con `enrolled_at > birth_date` (`elderly_enrolled_after_birth`).
4. **`allergy_tags`:** `NOT NULL` default `{}`; `{}` significa sin alergias.
5. **`photo_consent`:** `NOT NULL` default `true`.
6. **`status`:** `NOT NULL` default `active`.

En la sección `rooms`:

7. **Nota de implementación:** no se puede eliminar una habitación con adultos mayores, incluidos los archivados.

### Entradas de BACKLOG

Se agregan a `specs/BACKLOG.md`:

- Policies de `elderly` para staff y relative. Se resuelve en las specs de `staff_elderly` y `guardian_elderly`.
- Conteos reales de familiares en `/elderly`. Se resuelve en las specs de `guardian_elderly` e `invitations`.
- Conectar `/elderly/[id]` a Supabase y restaurar el enlace y el hover de `ElderlyCard`.
- Guardar desde "Agregar adulto mayor".
- Diseño de `error.tsx` para fallas de consulta en `(app)`.

---

## Estructura de archivos

```
supabase/
  migrations/
    <version>_create_elderly.sql
  seed.sql                               # + adultos mayores
references/documents/database-schema.md  # 7 cambios
specs/BACKLOG.md                         # 5 entradas
app/(app)/elderly/page.tsx               # usa getElderlySource en lugar del mock
elderly/
  get-elderly-source.ts                  # nuevo
  get-avatar-tone.ts                     # nuevo
  types.ts                               # comentario de referenceDate
  components/
    ElderlyCard.tsx                      # <Link> pasa a <article>, sin hover
    ElderlySearchList.tsx                # estado vacío sin adultos mayores
shared/date/get-lima-today.ts            # nuevo
```

---

## Plan de implementación

1. **Revisión previa.** Con `list_tables`, confirmar que `elderly` no existe en el remoto. Prueba: no aparece.
2. **Migración local.** Escribir `create_elderly.sql` en `supabase/migrations/`. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_elderly`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: `list_tables` muestra `elderly` con RLS activado.
4. **Seed.** Agregar los 5 adultos mayores a `supabase/seed.sql`. Pedir permiso; aplicarlo con `execute_sql` dos veces. Prueba: hay exactamente 5 filas.
5. **Pruebas de restricciones.** Con `execute_sql` en transacciones con `rollback`: ver criterios de aceptación.
6. **Pruebas de RLS.** Con `execute_sql` en transacciones con `rollback`, usando `set local role authenticated` y `request.jwt.claims`. Los usuarios de otros roles y estados se crean dentro de la transacción.
7. **Advisors.** `get_advisors` (security y performance).
8. **Utilidades.** `get-lima-today.ts` y `get-avatar-tone.ts`. Prueba: `npm run build`.
9. **Lectura de datos.** `get-elderly-source.ts` y conexión de `app/(app)/elderly/page.tsx`. Prueba: como admin, `/elderly` muestra los 5 en orden alfabético.
10. **Tarjetas sin enlace.** `ElderlyCard` pasa a `<article>` y pierde el hover. Prueba: las tarjetas no navegan.
11. **Estado vacío.** `ElderlySearchList` distingue "no hay ninguno" de "sin coincidencias". Prueba: con `items` vacío se ve el mensaje nuevo.
12. **Documentación.** Aplicar los cambios en `database-schema.md` y `BACKLOG.md`.
13. **Capturas de verificación.** Con Playwright, capturar `/elderly` y el modal abierto a 1440×900, y `/elderly` a 390×844, en `.playwright-mcp/`.

---

## Criterios de aceptación

**Migración y datos**

- [ ] Existe `supabase/migrations/<version>_create_elderly.sql` y su versión coincide con la de `list_migrations`.
- [ ] `public.elderly` tiene el enum, las columnas, la FK a `rooms`, las 3 restricciones `check`, el índice en `room_id` y el trigger de `updated_at`; RLS está activado.
- [ ] Tras correr `seed.sql` dos veces, hay exactamente 5 filas en Casa Nogal con los UUIDs, habitaciones y notas de la tabla del seed, todas `active` y con `photo_consent = true`.

**Restricciones**

- [ ] Insertar sin `allergy_tags`, `photo_consent` ni `status` guarda `{}`, `true` y `active`.
- [ ] `full_name` se genera como `first_name` + espacio + `last_name`.
- [ ] Insertar `first_name` o `last_name` vacío o solo con espacios falla por su restricción.
- [ ] Insertar sin `birth_date` o sin `enrolled_at` falla.
- [ ] Insertar `enrolled_at` igual o anterior a `birth_date` falla por `elderly_enrolled_after_birth`.
- [ ] Hacer `update` de una fila cambia `updated_at`.
- [ ] Borrar una habitación con adultos mayores falla, también si todos están archivados.

**RLS como admin**

- [ ] `select` devuelve solo adultos mayores de su guardería.
- [ ] Puede crear un adulto mayor en una habitación de su guardería.
- [ ] Crear un adulto mayor en una habitación de otra guardería falla.
- [ ] Puede editar un adulto mayor de su guardería y moverlo a otra habitación de ella.
- [ ] Moverlo a una habitación de otra guardería falla.
- [ ] Un `update` sobre un adulto mayor de otra guardería no afecta filas.
- [ ] Cambiar `id` o `created_at` falla por falta de permiso.
- [ ] `delete` falla por falta de permiso.

**RLS con otros roles y estados**

- [ ] Como staff o relative: `select` no devuelve filas, `insert` falla y `update` no afecta filas.
- [ ] Usuario admin `pending` o `archived` con sesión: `select` no devuelve filas, `insert` falla y `update` no afecta filas.
- [ ] Como `anon`: `select` no devuelve filas.

**Pantalla `/elderly`**

- [ ] Como admin se ven los 5 en este orden: Alberto Díaz, Carmen Ruiz, Jorge Salazar, Luis Fernández y Rosa Méndez.
- [ ] El conteo dice "5 adultos mayores".
- [ ] Un adulto mayor con `status = archived` no aparece ni se cuenta (se prueba en un entorno controlado y se restaura).
- [ ] Las edades corresponden a la fecha actual de Lima.
- [ ] `getLimaToday()` devuelve la fecha de Lima, no la de UTC, cuando ambas difieren.
- [ ] Todas las tarjetas dicen "sin familiares vinculados".
- [ ] Alberto muestra LACTOSA, Luis muestra MANÍ y Carmen, Jorge y Rosa muestran VINCULAR.
- [ ] `getAvatarTone` devuelve siempre el mismo color para un mismo `id`, y los 5 del seed no son todos iguales.
- [ ] Las tarjetas no son enlaces ni tienen efecto hover.
- [ ] Buscar "mendez" muestra solo a Rosa Méndez y el conteo dice "1 adulto mayor".
- [ ] Un texto sin coincidencias muestra "No encontramos adultos mayores con “{texto}”."
- [ ] Como staff, sin adultos mayores visibles, se ve "Todavía no hay adultos mayores.", el buscador y "0 adultos mayores".
- [ ] El HTML de `/elderly` no contiene las notas médicas.
- [ ] Si la consulta falla, se lanza el error y no se muestra el estado vacío.

**Modal "Agregar adulto mayor"**

- [ ] El selector ofrece Cedro, Roble y Temporal, con los ids reales.
- [ ] Una fecha de nacimiento posterior a hoy (Lima) muestra el error; la fecha de hoy se acepta.
- [ ] Enviar el formulario no crea filas en `elderly`.

**Cierre**

- [ ] `/elderly/[id]`, el modal de nueva publicación y `/activate-account` siguen funcionando con el mock.
- [ ] `get_advisors` no muestra avisos nuevos causados por `elderly`, salvo los aceptados en BACKLOG.
- [ ] `database-schema.md` tiene los 7 cambios y `BACKLOG.md` las 5 entradas de esta spec.
- [ ] `npm run build` y `npm run lint` terminan sin errores, y la consola de `/elderly` no muestra errores ni warnings de hidratación.
- [ ] A 390×844 no hay scroll horizontal en `/elderly`.
- [ ] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** una sola spec en `specs/database/` para tabla y listado. Decisión del usuario; el listado es el primer consumidor de la tabla.
- **Sí:** policies solo de admin. Las de staff y relative dependen de tablas que aún no existen; mismo criterio que SPEC 10.
- **No:** crear `staff_elderly` o `guardian_elderly` aquí. Agrandan la spec y aún no hay UI ni usuarios para usarlas.
- **Sí:** 5 adultos mayores del mock, con cero familiares y una condición médica corta. Decisión del usuario.
- **Sí:** las dos alergias del seed se mantienen en `allergy_tags`, y `medical_notes` guarda solo la condición médica. Es la forma más corta de cubrir ambos indicadores y seguir el ejemplo del usuario.
- **Sí:** tarjetas sin enlace. Decisión del usuario; evita un 404 temporal mientras el perfil use el mock.
- **No:** conectar el perfil en esta spec. Queda en BACKLOG.
- **Sí:** el modal sigue sin guardar, con habitaciones y fecha reales.
- **Sí:** fecha real en `America/Lima`, para edades correctas y sin el desfase nocturno de UTC.
- **No:** fecha fija del mock. Las edades serían falsas y el modal rechazaría fechas recientes.
- **Sí:** color derivado del `id`. Cada persona conserva su color y sirve para altas futuras.
- **No:** mapa fijo por id. Las altas futuras saldrían todas azules.
- **Sí:** `on delete restrict` en `room_id`. Ningún adulto mayor cambia de habitación sin una decisión del admin.
- **No:** mover a `Temporal` con un trigger. Cambia la habitación de forma silenciosa.
- **Sí:** orden por `full_name`. Estable y fácil de recorrer; el mockup no define un orden.
- **Sí:** habitaciones del modal por `name`, sin tratamiento especial para `Temporal`. Supuesto de esta spec: no se preguntó y es la opción más simple.
- **Sí:** mensaje vacío genérico para cualquier rol. El mockup no cubre este estado.
- **Sí:** restricciones que reflejan el formulario. La DB protege lo mismo que la UI.
- **Sí:** `allergy_tags`, `photo_consent` y `status` `not null` con default. El modal puede omitirlos, y cada campo tiene una sola forma de representar su valor.
- **Sí:** `medical_notes` nullable. El modal no la exige y la UI ya maneja `null`.
- **Sí:** permisos de update por columna, mismo patrón que `rooms`. Impiden cambiar `id` y `created_at`.
- **Sí:** `revoke delete`. El borrado es lógico.
- **Sí:** lanzar el error si falla una consulta, igual que `getCurrentUser`. El `error.tsx` queda en BACKLOG.
- **Sí:** reusar `ElderlySource` y los builders con listas vacías de familiares. Evita cambiar `buildElderlyList`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración se aplica directo al remoto | Se pide permiso antes; la tabla es nueva y vacía. |
| Datos médicos sensibles expuestos | RLS solo para admin, sin policies para otros roles. La vista se arma en servidor y al cliente solo llegan `items` y `rooms`; un criterio lo comprueba. |
| Staff ve la lista vacía hasta tener su policy | Aceptado; hay estado vacío y entrada en BACKLOG. |
| Todas las tarjetas sin alergia dicen VINCULAR, distinto del mockup | Aceptado por decisión del usuario, hasta tener `guardian_elderly` e `invitations`. |
| El feed y el modal de nueva publicación muestran adultos mayores del mock, distintos de los reales | Aceptado; se reemplazan en sus propias specs. |
| El perfil solo es accesible por URL directa y muestra datos mock | Aceptado; queda en BACKLOG. |
| Leer la fecha sin `io()` falla con `cacheComponents` | `getElderlySource` llama a `await io()` antes de leerla; `npm run build` lo comprueba. |

---

## Lo que **no** entra en esta spec

- Policies de staff y relative, y tablas intermedias.
- Conteos reales de familiares e invitaciones.
- Perfil con datos reales.
- Guardar, editar o archivar adultos mayores.
- Reemplazo de los demás usos del mock.
- `error.tsx` definitivo.

Cada una de esas, si llega, va en su propia spec.
