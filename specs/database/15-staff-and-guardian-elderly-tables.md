# SPEC 15 — Tablas `staff_elderly` y `guardian_elderly` y policies de visibilidad de `elderly`

> **Estado:** Implementado
> **Depende de:** SPEC 10, SPEC 13
> **Fecha:** 2026-11-10
> **Objetivo:** Crear `staff_elderly` y `guardian_elderly` con sus policies y el helper `current_user_elderly_ids()`, y con él abrir `elderly` a staff y relative y los familiares de sus ancianos al staff.

---

## Alcance

**Dentro:**

- Migración `supabase/migrations/<version>_create_staff_and_guardian_elderly.sql`:
  - Enum `relationship_type`.
  - Tablas `public.staff_elderly` y `public.guardian_elderly`, con FK `on delete cascade`, `unique` por par e índice en `elderly_id`.
  - Helpers `public.current_user_elderly_ids()` y `public.current_user_relative_ids()`.
  - RLS activado y policies de select, insert y delete de ambas tablas. Sin update.
  - Policy `elderly_select_linked` (staff y relative).
  - Policy `users_select_staff_relatives` (staff ve a los familiares de sus ancianos).
- Pruebas de restricciones y RLS con `execute_sql` dentro de transacciones con `rollback`. Los usuarios staff y relative se crean dentro de la transacción.
- Migración de corrección `supabase/migrations/<version>_fix_users_select_staff_relatives_recursion.sql`: crea `current_user_relative_ids()` y reemplaza `users_select_staff_relatives` para que lo use (ver "Corrección por recursión").
- Aplicar ambas migraciones con `apply_migration`, **pidiendo permiso antes de cada una**.
- `get_advisors` (security y performance).
- Actualizar `specs/BACKLOG.md`:
  - "Policies de `elderly` para staff y relative" → resuelta.
  - "Selects de `users` que dependen de tablas futuras" → sigue `[ ]`, el **Qué** queda solo con la parte (2) (autores de comentarios).
  - Agregar el aviso del linter de `current_user_elderly_ids()` y `current_user_relative_ids()` a "Avisos del linter aceptados".
- `references/documents/database-schema.md` ya se actualizó al redactar esta spec (ver "Cambios en el esquema").

**Fuera de alcance (para specs futuras):**

- Cualquier cambio en la app: `/elderly`, `/elderly/[id]` y `getElderlySource()` no cambian.
- Conteos reales de familiares en `/elderly` (dependen también de `invitations`).
- Tabla `invitations` y flujo de aceptación (que es quien crea los vínculos en `guardian_elderly`).
- UI para asignar staff a un adulto mayor. Ningún mockup la cubre.
- Datos de prueba en el remoto o en `seed.sql`: las tablas nuevas quedan vacías.
- Select de `users` sobre autores de comentarios (depende de `comments`).
- Policies del feed (`posts`, `post_elderly`…), que reusarán `current_user_elderly_ids()`.
- Aviso al admin de los ancianos sin cuidador/a al archivar un staff.
- Tipos TS generados o un tipo `StaffElderly` en `shared/database/types.ts`.

---

## Modelo de datos

### Tablas

```sql
create type public.relationship_type as enum ('son', 'daughter', 'guardian');

create table public.staff_elderly (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.users (id) on delete cascade,
  elderly_id uuid not null references public.elderly (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint staff_elderly_staff_id_elderly_id_key unique (staff_id, elderly_id)
);

create index staff_elderly_elderly_id_idx on public.staff_elderly (elderly_id);

create table public.guardian_elderly (
  id uuid primary key default gen_random_uuid(),
  relative_id uuid not null references public.users (id) on delete cascade,
  elderly_id uuid not null references public.elderly (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  constraint guardian_elderly_relative_id_elderly_id_key unique (relative_id, elderly_id)
);

create index guardian_elderly_elderly_id_idx on public.guardian_elderly (elderly_id);
```

- El enum `relationship_type` no existe en ninguna migración: se crea aquí. El paso 1 confirma que tampoco existe en el remoto.
- El `unique` empieza por `staff_id` / `relative_id`, así que también sirve de índice para esa FK. El índice en `elderly_id` cubre la otra.
- Sin `updated_at`: no hay update.
- El `role`, el `status` y la guardería del usuario se validan en la policy de insert, no con un `check` (un `check` no puede leer otra tabla).

### Helper

```sql
create function public.current_user_elderly_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select se.elderly_id
  from public.staff_elderly se
  where se.staff_id = auth.uid()
    and public.current_user_role() = 'staff'
  union
  select ge.elderly_id
  from public.guardian_elderly ge
  where ge.relative_id = auth.uid()
    and public.current_user_role() = 'relative';
$$;

revoke execute on function public.current_user_elderly_ids() from public, anon;
grant execute on function public.current_user_elderly_ids() to authenticated;
```

- Solo devuelve vínculos del propio usuario (regla 7 del esquema).
- `current_user_role()` es `null` para `pending` y `archived`, así que el helper devuelve vacío para ellos y para el admin.
- Al ser `SECURITY DEFINER` no pasa por las policies de las tablas nuevas, lo que evita la recursión entre `elderly`, `staff_elderly`, `guardian_elderly` y `users`.
- En las policies se usa como `elderly_id in (select public.current_user_elderly_ids())`.

### Corrección por recursión

La policy `users_select_staff_relatives`, tal como se aplicó en la primera migración, leía `guardian_elderly` directamente. Como `guardian_elderly_insert_admin` lee `users`, Postgres aborta con `42P17: infinite recursion detected in policy for relation "guardian_elderly"` al insertar en `guardian_elderly`. Se corrige con una segunda migración que rompe el ciclo con un helper `SECURITY DEFINER`:

```sql
create function public.current_user_relative_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ge.relative_id
  from public.guardian_elderly ge
  where ge.elderly_id in (select public.current_user_elderly_ids())
    and public.current_user_role() = 'staff';
$$;

revoke execute on function public.current_user_relative_ids() from public, anon;
grant execute on function public.current_user_relative_ids() to authenticated;

drop policy users_select_staff_relatives on public.users;

create policy users_select_staff_relatives on public.users
  for select to authenticated
  using (
    role = 'relative'
    and daycare_id = (select public.current_user_daycare_id())
    and id in (select public.current_user_relative_ids())
  );
```

- El rol `staff` lo valida el helper (devuelve vacío para otros roles).
- Las policies de insert de ambas tablas no cambian.

### Policies

Todas son `to authenticated`, con los helpers envueltos en `(select ...)`.

La regla "anciano de la guardería del admin" se repite en las policies de admin:

```sql
elderly_id in (
  select e.id
  from public.elderly e
  join public.rooms r on r.id = e.room_id
  where r.daycare_id = (select public.current_user_daycare_id())
)
```

**`staff_elderly`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `staff_elderly_select_admin` | select | admin; anciano de su guardería |
| `staff_elderly_select_own` | select | staff; `staff_id = auth.uid()` |
| `staff_elderly_select_relative` | select | relative; `elderly_id` en `current_user_elderly_ids()` |
| `staff_elderly_insert_admin` | insert | admin; anciano de su guardería y `staff_id` con `role = 'staff'`, `status = 'active'` y su `daycare_id` |
| `staff_elderly_delete_admin` | delete | admin; anciano de su guardería |

**`guardian_elderly`**

| Policy | Acción | Regla |
| --- | --- | --- |
| `guardian_elderly_select_admin` | select | admin; anciano de su guardería |
| `guardian_elderly_select_own` | select | relative; `relative_id = auth.uid()` |
| `guardian_elderly_select_staff` | select | staff; `elderly_id` en `current_user_elderly_ids()` |
| `guardian_elderly_insert_admin` | insert | admin; anciano de su guardería y `relative_id` con `role = 'relative'`, `status = 'active'` y su `daycare_id` |
| `guardian_elderly_delete_admin` | delete | admin; anciano de su guardería |

Las policies `select_own` y `select_staff`/`select_relative` comprueban el rol con `(select public.current_user_role()) = '<rol>'`. Así un staff no ve las asignaciones de otros staff, y un relative no ve los vínculos de otros familiares.

Validación del usuario en el insert (ejemplo de `staff_elderly`):

```sql
exists (
  select 1 from public.users u
  where u.id = staff_id
    and u.role = 'staff'
    and u.status = 'active'
    and u.daycare_id = (select public.current_user_daycare_id())
)
```

**`elderly`** (se suma a las 3 de admin)

| Policy | Acción | Regla |
| --- | --- | --- |
| `elderly_select_linked` | select | `id in (select public.current_user_elderly_ids())` |

No filtra por `status`: un anciano archivado sigue visible para su staff y sus familiares.

**`users`** (se suma a las existentes; versión final tras la corrección por recursión)

| Policy | Acción | Regla |
| --- | --- | --- |
| `users_select_staff_relatives` | select | staff; usuarios `role = 'relative'` de su guardería con un vínculo en `guardian_elderly` con alguno de sus ancianos |

```sql
role = 'relative'
and daycare_id = (select public.current_user_daycare_id())
and id in (select public.current_user_relative_ids())
```

### Permisos

```sql
grant select, insert, delete on public.staff_elderly to authenticated;
grant select, insert, delete on public.guardian_elderly to authenticated;
revoke update on public.staff_elderly from authenticated;
revoke update on public.guardian_elderly from authenticated;
```

Para cambiar una asignación o un vínculo, se borra y se crea de nuevo.

### Cambios en el esquema

Ya aplicados en `references/documents/database-schema.md` al redactar esta spec. No forman parte del plan ni de los criterios de aceptación:

1. **Helpers implementados:** se agrega `current_user_elderly_ids()`.
2. **`elderly`, RLS:** staff y relative con una sola policy (`elderly_select_linked`); un anciano archivado sigue visible para ellos.
3. **`guardian_elderly`:** FKs `NOT NULL` y `ON DELETE CASCADE`; `relationship` `NOT NULL`; el insert exige relative `active`.
4. **`staff_elderly`:** FKs `NOT NULL` y `ON DELETE CASCADE`; el insert exige staff `active`; las asignaciones de un staff archivado se conservan.

### Entradas de BACKLOG

- "Policies de `elderly` para staff y relative" → `- [x] **Estado:** resuelto en SPEC 15`.
- "Selects de `users` que dependen de tablas futuras" → sigue `[ ]`; el **Qué** queda solo con (2).
- "Avisos del linter aceptados tras la spec 10" → se suma `current_user_elderly_ids()` a la lista (1), con la misma justificación.

---

## Estructura de archivos

```
supabase/migrations/<version>_create_staff_and_guardian_elderly.sql   # nuevo
supabase/migrations/<version>_fix_users_select_staff_relatives_recursion.sql  # nuevo
references/documents/database-schema.md                               # ya actualizado al redactar la spec
specs/BACKLOG.md                                                      # 3 entradas
```

---

## Plan de implementación

1. **Revisión previa.** Con `list_tables` y `execute_sql`, confirmar que `staff_elderly`, `guardian_elderly` y el enum `relationship_type` no existen. Prueba: no aparecen. Si el enum existe, detenerse y preguntar.
2. **Migración local.** Escribir `create_staff_and_guardian_elderly.sql` con tablas, helper, policies y permisos. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_staff_and_guardian_elderly`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: `list_tables` muestra ambas tablas con RLS activado.
4. **Pruebas de restricciones.** Con `execute_sql` en transacciones con `rollback`: ver criterios de aceptación.
5. **Corrección por recursión.** Escribir `fix_users_select_staff_relatives_recursion.sql`; pedir permiso, aplicar con `apply_migration` y renombrar el archivo con la versión de `list_migrations`. Prueba: insertar en `guardian_elderly` como admin ya no da `42P17`.
6. **Pruebas de RLS.** Con `execute_sql` en transacciones con `rollback`, usando `set local role authenticated` y `request.jwt.claims`. Los staff y relative (en Casa Nogal y en otra guardería) se crean dentro de la transacción insertando en `auth.users`.
7. **Advisors.** `get_advisors` (security y performance).
8. **Documentación.** Aplicar los cambios en `BACKLOG.md`.

---

## Criterios de aceptación

**Migración**

- [x] Existen `supabase/migrations/<version>_create_staff_and_guardian_elderly.sql` y `<version>_fix_users_select_staff_relatives_recursion.sql`, y sus versiones coinciden con las de `list_migrations`.
- [x] Ambas tablas tienen las columnas, las FK `on delete cascade`, el `unique` por par y el índice en `elderly_id`; RLS está activado.
- [x] `current_user_elderly_ids()` y `current_user_relative_ids()` son `SECURITY DEFINER STABLE`, con `search_path` vacío y `EXECUTE` solo para `authenticated`.
- [x] Insertar en `guardian_elderly` como admin no produce `infinite recursion` (`42P17`).
- [x] En el remoto ambas tablas tienen 0 filas al terminar.

**Restricciones**

- [x] Insertar dos veces el mismo par (`staff_id`, `elderly_id`) o (`relative_id`, `elderly_id`) falla por su `unique`.
- [x] Insertar en `guardian_elderly` sin `relationship` falla.
- [x] Borrar el usuario de `auth.users` borra sus filas en ambas tablas.
- [x] Borrar un adulto mayor (como `postgres`) borra sus filas en ambas tablas.

**RLS como admin**

- [x] Puede asignar un staff `active` de su guardería a un anciano de su guardería, y vincular un relative `active`.
- [x] Asignar un staff `pending` o `archived` falla; vincular un relative `archived` falla.
- [x] Asignar como staff a un usuario `relative` o `admin` falla; vincular como relative a un `staff` falla.
- [x] Asignar o vincular con un anciano o un usuario de otra guardería falla.
- [x] `select` devuelve solo filas de ancianos de su guardería.
- [x] Puede borrar filas de ancianos de su guardería; un `delete` sobre filas de otra guardería no afecta filas.
- [x] `update` falla por falta de permiso.

**RLS como staff**

- [x] `select` en `elderly` devuelve solo sus asignados, incluido uno archivado.
- [x] `select` en `staff_elderly` devuelve solo sus asignaciones, no las de otro staff sobre el mismo anciano.
- [x] `select` en `guardian_elderly` devuelve los vínculos de sus asignados y no los de otros ancianos.
- [x] `select` en `users` devuelve a los familiares de sus asignados y no a los de otros ancianos.
- [x] `insert` y `delete` en ambas tablas fallan o no afectan filas.

**RLS como relative**

- [x] `select` en `elderly` devuelve solo sus vinculados.
- [x] `select` en `guardian_elderly` devuelve solo sus vínculos, no los de otro familiar del mismo anciano.
- [x] `select` en `staff_elderly` devuelve las asignaciones de sus ancianos y no las de otros.
- [x] `insert` en `guardian_elderly` falla y `delete` no afecta filas.

**RLS con otros estados**

- [x] Staff o relative `pending` o `archived` con vínculos: `select` en `elderly`, `staff_elderly` y `guardian_elderly` no devuelve filas.
- [x] Como `anon`: `select` en ambas tablas no devuelve filas.

**Cierre**

- [x] Como admin, `/elderly` sigue mostrando los 6 adultos mayores y `npm run build` termina sin errores.
- [x] `get_advisors` no muestra avisos nuevos salvo los de `current_user_elderly_ids()` y `current_user_relative_ids()`, aceptados en BACKLOG.
- [x] `BACKLOG.md` tiene las 3 actualizaciones de esta spec.

---

## Decisiones

- **Sí:** una sola spec para ambas tablas. Decisión del usuario; son simétricas y las policies de `elderly` necesitan las dos.
- **Sí:** resolver aquí las policies de `elderly` para staff y relative y el select de `users` (1). Decisión del usuario: todo lo que dependía de estas tablas.
- **No:** conteos reales en `/elderly`. Decisión del usuario; dependen también de `invitations` y el remoto no tendrá vínculos.
- **Sí:** sin cambios en la app. La pantalla `/elderly/[id]` y sus datos van en su propia spec.
- **Sí:** datos de prueba solo en transacciones con `rollback`. Decisión del usuario; no quedan cuentas de prueba en la DB ni en `seed.sql`.
- **Sí:** solo staff y relative `active` se pueden asignar o vincular. Decisión del usuario; se agrega como regla en `database-schema.md`.
- **No:** asignar staff `pending`. Decisión del usuario.
- **Sí:** `on delete cascade` en ambas FK. Decisión del usuario; `users` ya se borra en cascada desde Auth y `elderly` solo se archiva.
- **Sí:** un helper `current_user_elderly_ids()` como única fuente de "ancianos del usuario". Decisión del usuario; evita recursión entre policies y lo reusará el feed.
- **No:** dos helpers booleanos por anciano. Se evalúan por fila y cada policy combina ambos.
- **Sí:** staff y relative ven a sus ancianos archivados. Decisión del usuario; filtra el vínculo, no el `status`, igual que para el admin.
- **Sí:** asignaciones de un staff archivado se conservan. Ya no ve nada y el admin reasigna; el aviso al admin queda para la spec de archivar usuarios.
- **Sí:** validar `role`, `status` y guardería en la policy de insert. Un `check` no puede leer `users`; el admin ya puede leer esos usuarios por `users_select_admin`.
- **Sí:** policies separadas por quién (`admin`, `own`, `staff`/`relative`). Mismo patrón que `users`; el aviso `multiple_permissive_policies` ya está aceptado.
- **Sí:** helper `current_user_relative_ids()` para `users_select_staff_relatives`. Decisión del usuario (opción 1) tras detectar en el paso 5 recursión infinita entre `guardian_elderly_insert_admin` (lee `users`) y `users_select_staff_relatives` (leía `guardian_elderly`). Se corrige con una migración nueva; la ya aplicada no se edita.
- **No:** helper para la validación del insert (`is_assignable_user`) ni quitar el insert del admin. Opciones descartadas por el usuario.
- **Sí:** `revoke update`. Un vínculo se borra y se crea de nuevo, según el esquema.
- **Sí:** el esquema se actualizó al redactar la spec. Decisión del usuario, como en SPEC 14.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración se aplica directo al remoto | Se pide permiso antes; las tablas son nuevas y vacías, y las policies nuevas solo agregan acceso. |
| Una policy mal escrita expone datos médicos de `elderly` a quien no corresponde | Criterios de RLS por rol y estado, incluidos staff y relative de otra guardería. |
| Recursión infinita entre policies de `elderly`, `staff_elderly`, `guardian_elderly` y `users` | Los helpers son `SECURITY DEFINER` y no pasan por RLS. Ocurrió una vez (`users` ↔ `guardian_elderly`) y se corrigió con `current_user_relative_ids()`; las pruebas de insert y select por rol la detectan. |
| Las policies de admin y staff fallan sin datos reales y nadie lo nota | Las pruebas crean staff, relative y vínculos dentro de la transacción. |
| Un staff archivado deja ancianos sin cuidador/a | Aceptado; el aviso al admin queda para la spec de archivar usuarios. |

---

## Lo que **no** entra en esta spec

- Cambios en la app y en `/elderly/[id]`.
- Conteos reales de familiares e `invitations`.
- UI para asignar staff.
- Datos de prueba persistentes.
- Select de `users` sobre autores de comentarios.
- Policies del feed.

Cada una de esas, si llega, va en su propia spec.
