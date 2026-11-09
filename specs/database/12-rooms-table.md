# SPEC 12 — Tabla `rooms` con habitación por defecto y datos de prueba

> **Estado:** Aprobado
> **Depende de:** SPEC 09, SPEC 10
> **Fecha:** 2026-11-09
> **Objetivo:** Crear la tabla `rooms` con sus policies RLS y el trigger que da una habitación `Temporal` a cada guardería nueva, y sembrar sus datos de prueba.

---

## Alcance

**Dentro:**

- Migración `supabase/migrations/<version>_create_rooms.sql`:
  - Tabla `public.rooms` según el esquema, con restricciones de `name`.
  - Índice único parcial: una sola habitación por defecto por guardería.
  - Función `create_default_room()` y trigger `AFTER INSERT` en `daycares`.
  - RLS activado, policies de select, insert, update y delete, y permisos por columna.
- `supabase/seed.sql`: una habitación `Temporal` para cada guardería, y `Roble` y `Cedro` para Casa Nogal.
- Aplicar la migración con `apply_migration` y el seed con `execute_sql`, **pidiendo permiso antes de cada uno**.
- Pruebas de restricciones, trigger y RLS con `execute_sql` dentro de transacciones con `rollback`.
- Actualizar `references/documents/database-schema.md` con los 3 cambios de la sección "Cambios en el esquema".

**Fuera de alcance (para specs futuras):**

- Tabla `elderly`, su FK a `rooms` y qué pasa al borrar una habitación con adultos mayores.
- `posts.room_id` y las reglas de publicación por habitación.
- Pantalla "Habitaciones" y Server Actions para crear, renombrar o eliminar.
- Reemplazar los mocks de habitaciones de la app (`elderly/mock-elderly.ts`) por datos reales.
- Tipos TS generados; `shared/database/types.ts` no cambia.
- Columna `updated_at` (el esquema no la define para `rooms`).

---

## Modelo de datos

```sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  is_default boolean not null default false,
  name text not null,
  created_at timestamptz not null default now(),
  constraint rooms_name_not_blank check (length(trim(name)) > 0),
  constraint rooms_daycare_id_name_key unique (daycare_id, name)
);

create unique index rooms_one_default_per_daycare_idx
  on public.rooms (daycare_id)
  where is_default;
```

- El índice de `rooms_daycare_id_name_key` empieza por `daycare_id`, así que también cubre la FK. No hace falta otro índice.
- La unicidad de `name` distingue mayúsculas, igual que en `daycares`.

### Trigger de la habitación por defecto

`create_default_room()` se ejecuta con un trigger `AFTER INSERT` en `daycares`.

- Es `security definer`, con `set search_path = ''` y nombres calificados (`public.rooms`).
- Inserta una fila con `daycare_id = new.id`, `name = 'Temporal'` e `is_default = true`.
- Se revoca su `EXECUTE` a `public`, `anon` y `authenticated`.

### Policies

Todas son `to authenticated`, con los helpers envueltos en `(select ...)`.

| Policy | Acción | Regla |
| --- | --- | --- |
| `rooms_select_member` | select | `daycare_id` = su guardería |
| `rooms_insert_admin` | insert | admin; `daycare_id` = su guardería; `is_default = false` |
| `rooms_update_admin` | update | admin; `daycare_id` = su guardería (`using` + `with check`) |
| `rooms_delete_admin` | delete | admin; `daycare_id` = su guardería; `is_default = false` |

### Permisos

```sql
grant select, insert, delete on public.rooms to authenticated;
revoke update on public.rooms from authenticated;
grant update (name) on public.rooms to authenticated;
```

### Seed

Se agrega a `supabase/seed.sql`, después del insert de `daycares`.

| Guardería | `name` | `is_default` | `id` |
| --- | --- | --- | --- |
| Las 5 guarderías | Temporal | `true` | Generado |
| Casa Nogal | Roble | `false` | `00000000-0000-0000-0000-000000000101` |
| Casa Nogal | Cedro | `false` | `00000000-0000-0000-0000-000000000102` |

- `Temporal` se inserta con `select` sobre `daycares` y `on conflict do nothing`.
- Ese insert funciona en los dos casos. En el remoto crea las 5 filas que faltan, y en un entorno nuevo no hace nada porque el trigger ya las creó.
- `Roble` y `Cedro` usan UUIDs fijos para que la futura seed de `elderly` pueda referenciarlas.
- Resultado esperado en el remoto: 7 filas.

### Cambios en el esquema

En `references/documents/database-schema.md`:

1. **Fila `name` de `rooms`:** `` `text` | Ej. "Roble". `not null`, no vacío ni solo espacios (`rooms_name_not_blank`) y único por guardería (`rooms_daycare_id_name_key`, distingue mayúsculas). ``
2. **Nota de implementación de `rooms`:** cambiar `set search_path = public` por `` `set search_path = ''` y nombres calificados ``.
3. **Nota de implementación de `users`:** el mismo cambio, para alinear el documento con `handle_new_auth_user()`.

---

## Estructura de archivos

```
supabase/
  migrations/
    <version>_create_rooms.sql
  seed.sql                                 # + habitaciones
references/documents/database-schema.md    # 3 cambios
```

---

## Plan de implementación

1. **Skills.** Cargar `supabase` y `supabase-postgres-best-practices`. Con `list_tables`, revisar que `rooms` no existe en el remoto.
2. **Migración local.** Escribir `create_rooms.sql` en `supabase/migrations/`. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_rooms`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: `list_tables` muestra `rooms` con RLS activado.
4. **Seed.** Agregar las habitaciones a `supabase/seed.sql`. Pedir permiso; aplicarlo con `execute_sql` dos veces. Prueba: hay exactamente 7 filas.
5. **Pruebas de restricciones y trigger.** Con `execute_sql` en transacciones con `rollback`: ver criterios de aceptación.
6. **Pruebas de RLS.** Con `execute_sql` en transacciones con `rollback`, usando `set local role authenticated` y `request.jwt.claims`. Los usuarios de otros roles y estados se crean dentro de la transacción.
7. **Advisors.** `get_advisors` (security y performance).
8. **Documentación.** Aplicar los 3 cambios en `database-schema.md`.

---

## Criterios de aceptación

**Migración y datos**

- [ ] Existe `supabase/migrations/<version>_create_rooms.sql` y su versión coincide con la de `list_migrations`.
- [ ] `public.rooms` tiene las columnas, la FK a `daycares`, ambas restricciones de `name` y el índice único parcial; RLS está activado.
- [ ] Tras correr `seed.sql` dos veces, hay exactamente 7 filas: una `Temporal` con `is_default = true` por guardería, y `Roble` y `Cedro` en Casa Nogal con los UUIDs de la tabla del seed.

**Restricciones y trigger**

- [ ] Insertar `name = ''` o `'   '` falla por `rooms_name_not_blank`.
- [ ] Repetir un `name` en la misma guardería falla por `rooms_daycare_id_name_key`; el mismo `name` en otra guardería funciona.
- [ ] Insertar una segunda habitación con `is_default = true` en una guardería falla por `rooms_one_default_per_daycare_idx`.
- [ ] Insertar una guardería crea exactamente una habitación `Temporal` con `is_default = true`.
- [ ] Volver a correr el insert de `Temporal` del seed sobre esa guardería no agrega filas.

**RLS como admin**

- [ ] `select` devuelve solo habitaciones de su guardería.
- [ ] Puede crear una habitación en su guardería con `is_default = false`.
- [ ] Crear una habitación con `is_default = true` o en otra guardería falla.
- [ ] Puede renombrar una habitación de su guardería, incluida la `Temporal`.
- [ ] Cambiar `daycare_id` o `is_default` falla por falta de permiso.
- [ ] Un `update` o `delete` sobre una habitación de otra guardería no afecta filas.
- [ ] Puede borrar una habitación de su guardería que no sea la de por defecto.
- [ ] Borrar la habitación por defecto no afecta filas.

**RLS con otros roles y estados**

- [ ] Como staff o relative: `select` devuelve solo habitaciones de su guardería.
- [ ] Como staff o relative: `insert` falla, y `update` y `delete` no afectan filas.
- [ ] Usuario `pending` o `archived` con sesión: `select` devuelve vacío, `insert` falla, y `update` y `delete` no afectan filas.
- [ ] Como `anon`: `select` no devuelve filas.
- [ ] Como `authenticated`, llamar a `create_default_room()` falla por falta de permiso.

**Cierre**

- [ ] `get_advisors` no muestra avisos nuevos causados por `rooms` o `create_default_room()`, salvo los aceptados en BACKLOG.
- [ ] `database-schema.md` tiene los 3 cambios de esta spec.
- [ ] No hay cambios en código de la app (`shared/database/types.ts`, mocks, `package.json`).

---

## Decisiones

- **Sí:** `Temporal` de las 5 guarderías existentes en `seed.sql`. Decisión del usuario; son datos de prueba.
- **No:** backfill en la migración. La migración no toca datos, y las guarderías existentes vienen del seed.
- **Sí:** `Roble` y `Cedro` solo en Casa Nogal, con UUIDs fijos. Es la guardería del admin de prueba, y son los nombres de los mocks.
- **No:** dos habitaciones extra por cada guardería. La mayoría no se usaría.
- **Sí:** `name` no nulo, no vacío y único por guardería. Evita dos opciones iguales en los selectores.
- **No:** unicidad sin distinguir mayúsculas. Se mantiene el criterio de `daycares`.
- **Sí:** `search_path = ''` con nombres calificados. Coincide con todas las funciones actuales y fija el objeto exacto.
- **No:** `search_path = public`. Sería la única función distinta; esa nota del esquema no reflejaba lo implementado.
- **Sí:** `grant select, insert, delete` explícito. No depende de los permisos por defecto de los roles.
- **Sí:** `grant update (name)`, mismo patrón que `daycares`. Impide cambiar `daycare_id` e `is_default`.
- **Sí:** FK a `daycares` sin `on delete cascade`, igual que `users`. Borrar una guardería desde SQL exige borrar antes sus habitaciones.
- **No:** trigger extra que proteja la habitación por defecto de `service_role` o SQL. El esquema la protege con la policy de delete.
- **No:** `updated_at`, tipos TS generados ni conexión de la app.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Entre la migración y el seed, las 5 guarderías no tienen habitación por defecto | Se aplican seguidas; nada de la app lee `rooms` todavía. |
| Una guardería anterior a esta migración que no pase por el seed queda sin `Temporal` | En el remoto solo existen las 5 del seed; el insert de `Temporal` cubre todas las filas de `daycares`. |
| La migración se aplica directo al remoto | Se pide permiso antes; la tabla es nueva y vacía. |
| Un error en el trigger bloquea crear guarderías | Se prueba en transacción con `rollback`; hoy las guarderías solo se crean por SQL. |
| `on conflict do nothing` también ignora otros conflictos del seed | Aceptado para un seed idempotente; el criterio de 7 filas detecta una fila faltante. |

---

## Lo que **no** entra en esta spec

- Tabla `elderly` y borrado de habitaciones con adultos mayores.
- Reglas de publicación por habitación.
- Pantalla y Server Actions de habitaciones.
- Reemplazo de los mocks, tipos generados y conexión de la app.
- `updated_at`.

Cada una de esas, si llega, va en su propia spec.
