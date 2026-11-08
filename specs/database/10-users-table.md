# SPEC 10 — Tabla `users`, enums de usuario y admin de prueba

> **Estado:** Aprobado
> **Depende de:** SPEC 09
> **Fecha:** 2026-11-08
> **Objetivo:** Crear la tabla `users` con sus enums, triggers, helpers y policies RLS (incluidas las pendientes de `daycares`), y un usuario admin de prueba en Casa Nogal.

---

## Alcance

**Dentro:**

- Migración `supabase/migrations/<version>_create_users.sql`:
  - Enums `user_role` (`staff`, `relative`, `admin`) y `user_status` (`pending`, `active`, `archived`).
  - Tabla `public.users` según el esquema (FK a `auth.users` on delete cascade, FK a `daycares`, `full_name` generada, `updated_at`) con índice en `daycare_id`.
  - Función genérica `set_updated_at()` y su trigger `BEFORE UPDATE` en `users`.
  - Trigger `AFTER INSERT` en `auth.users` (`handle_new_auth_user()`) que crea la fila desde `raw_user_meta_data`.
  - Trigger `BEFORE UPDATE` de protección de columnas en `users`.
  - Helpers `SECURITY DEFINER STABLE` con `search_path` fijo.
  - Policies de `users` (parciales) y de `daycares`; `grant update (name)` en `daycares`.
- Crear el admin de prueba con `execute_sql` (insert en `auth.users` + `auth.identities`), **sin guardar el SQL ni sus datos en el repo**.
- Pruebas de triggers y RLS con `execute_sql` dentro de transacciones con `rollback`.
- Actualizar `references/documents/database-schema.md` (helpers y regla "admin solo desde SQL") y `specs/BACKLOG.md`.
- Paso manual del usuario: confirmar en el dashboard que el signup público está desactivado.

**Fuera de alcance (para specs futuras):**

- Enums `relationship_type`, `invitation_status`, `post_type`, `post_audience`, `elderly_status`: se crean con su tabla.
- Select del staff sobre familiares de sus asignados, y de staff/relative sobre autores de comentarios: dependen de `staff_elderly`, `guardian_elderly` y `comments` (→ BACKLOG).
- Revocar `rls_auto_enable()` (sigue en BACKLOG).
- Tipos TS generados, `@supabase/ssr`, login real y reemplazo de `mockSession`.
- Server Actions de invitar, activar, archivar o reactivar usuarios.

---

## Modelo de datos

```sql
create type public.user_role as enum ('staff', 'relative', 'admin');
create type public.user_status as enum ('pending', 'active', 'archived');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id),
  role public.user_role not null,
  status public.user_status not null,
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_first_name_not_blank check (length(trim(first_name)) > 0),
  constraint users_last_name_not_blank check (length(trim(last_name)) > 0)
);

create index users_daycare_id_idx on public.users (daycare_id);
```

### Trigger `handle_new_auth_user`

`AFTER INSERT` en `auth.users`, `security definer`, `search_path` fijo.

- Lee `daycare_id`, `role`, `first_name` y `last_name` de `raw_user_meta_data`. Si falta alguno → `raise exception` y no se crea la cuenta.
- `role = 'admin'` solo se acepta si `session_user = 'postgres'` (SQL Editor / `execute_sql`). Se usa `session_user` y no `current_user` porque dentro de una función `SECURITY DEFINER` `current_user` es siempre el dueño de la función. Desde Auth (`supabase_auth_admin`: signup, `inviteUserByEmail`, `createUser`) solo se acepta `staff` o `relative`.
- `status` inicial: `staff` → `pending`; `relative` y `admin` → `active`.

### Trigger de protección de columnas

`BEFORE UPDATE` en `users`:

- Si `auth.uid()` es null (`service_role` o SQL) → se permite todo.
- Nadie cambia `id`, `daycare_id` ni `role`.
- Solo un admin cambia `first_name`, `last_name` y `status`; nunca el `status` de un usuario con `role = 'admin'` (incluido él mismo).

### Helpers

Solo reconocen al usuario logueado si está `active`; si no, devuelven `null` / `false`.

| Función | Devuelve |
| --- | --- |
| `current_user_daycare_id()` | `uuid` de la guardería del usuario logueado |
| `current_user_role()` | `user_role` del usuario logueado |
| `is_admin()` | `boolean` |

### Policies

Todas `to authenticated`, con los helpers envueltos en `(select ...)`.

| Policy | Acción | Regla |
| --- | --- | --- |
| `users_select_own` | select | `id = auth.uid()` y usuario activo |
| `users_select_admin` | select | admin; usuarios de su guardería |
| `users_select_team` | select | staff/relative; filas con `role in ('staff', 'admin')` de su guardería |
| `users_update_own` | update | `id = auth.uid()` y activo; columnas limitadas por el trigger |
| `users_update_admin` | update | admin; usuarios de su guardería (`using` + `with check`) |
| `daycares_select_member` | select | `id` = su guardería |
| `daycares_update_admin` | update | admin; `id` = su guardería; solo `name` (`grant update (name)`) |

### Admin de prueba

- Guardería Casa Nogal (`00000000-0000-0000-0000-000000000001`), `role = 'admin'`, `status = 'active'`.
- Email, nombres y contraseña los entrega el usuario **fuera del repo**; no se escriben en la spec, migraciones ni seed.
- Insert en `auth.users` (contraseña con `crypt(..., gen_salt('bf'))`, `email_confirmed_at = now()`, metadata con `daycare_id`, `role`, `first_name`, `last_name`) + `auth.identities` (provider `email`). El trigger crea la fila en `users`.

---

## Estructura de archivos

```
supabase/
  migrations/
    <version>_create_users.sql
references/documents/database-schema.md   # helpers + regla "admin solo desde SQL"
specs/BACKLOG.md                           # - policies de daycares; + selects pendientes de users
```

---

## Plan de implementación

1. **Skills.** Cargar `supabase` y `supabase-postgres-best-practices`. Con `list_tables`, revisar que `users` no existe y las columnas reales de `auth.users` y `auth.identities`.
2. **Migración local.** Escribir `create_users.sql` en `supabase/migrations/`. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_users`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: `list_tables` muestra `users` con RLS activado.
4. **Signup.** El usuario confirma en el dashboard (Auth > Sign In / Providers) que el signup público está desactivado.
5. **Admin de prueba.** Pedir permiso; `execute_sql` con los datos que entrega el usuario. Prueba: existe la fila en `public.users` con `role = 'admin'`, `status = 'active'` y `full_name` correcta.
6. **Pruebas de triggers y RLS.** Con `execute_sql` en transacciones con `rollback`, usando `set local role authenticated` y `request.jwt.claims`: ver criterios de aceptación.
7. **Advisors.** `get_advisors` (security y performance).
8. **Documentación.** `database-schema.md` y `BACKLOG.md`.

---

## Criterios de aceptación

- [x] Existe `supabase/migrations/<version>_create_users.sql` y su versión coincide con la de `list_migrations`.
- [x] Los enums `user_role` y `user_status` existen con los valores del esquema.
- [x] `public.users` tiene las columnas, FKs, `full_name` generada e índice en `daycare_id`; RLS activado.
- [x] Insertar en `auth.users` con metadata `staff` crea una fila `pending`; con `relative`, una fila `active`.
- [x] Insertar en `auth.users` sin `daycare_id`, `role`, `first_name` o `last_name` en la metadata falla.
- [ ] Insertar con `role = 'admin'` como `supabase_auth_admin` falla; como `postgres` funciona.
- [x] Borrar el usuario de `auth.users` borra su fila en `users` (cascade).
- [x] `updated_at` cambia al actualizar una fila de `users`.
- [x] Como staff o relative: cambiar su `role`, `daycare_id`, `first_name` o `status` falla; cambiar `avatar_url`, `notify_on_post` y `daily_summary_enabled` funciona.
- [x] Como admin: cambiar el `role` de un staff falla; cambiar el `status` de otro admin o el suyo falla; cambiar `status` y nombres de un staff funciona.
- [x] Como admin: `select` en `users` devuelve solo usuarios de su guardería; en `daycares`, solo la suya; puede renombrarla y no puede cambiar su `id`.
- [x] Como staff o relative: `select` en `users` devuelve su fila más staff/admin de su guardería, sin relatives ajenos; en `daycares`, solo la suya; un `update` en `daycares` no afecta filas.
- [x] Usuario `pending` o `archived` con sesión: `select` en `users` y `daycares` devuelve vacío y sus updates no afectan filas.
- [x] Como `anon`: `select` en `users` y `daycares` devuelve vacío.
- [ ] El admin de prueba existe en `public.users` (Casa Nogal, `admin`, `active`) y puede iniciar sesión con email y contraseña.
- [x] Ni la spec, ni las migraciones, ni el seed contienen el email o la contraseña del admin.
- [ ] El usuario confirmó que el signup público está desactivado.
- [x] `get_advisors` no muestra avisos nuevos salvo los registrados en BACKLOG como aceptados (`rls_auto_enable()`, helpers `SECURITY DEFINER` ejecutables por `authenticated`, `multiple_permissive_policies` en `users` y `auth_leaked_password_protection`), y desaparece `rls_enabled_no_policy` de `daycares`.
- [x] `database-schema.md` y `BACKLOG.md` están actualizados.
- [x] No hay cambios en código de la app (`shared/database/types.ts`, `mockSession`, `package.json`).

---

## Decisiones

- **Sí:** RLS parcial en `users` + policies de `daycares`. Lo que depende de tablas futuras va a BACKLOG.
- **Sí:** admin solo desde SQL (`session_user = 'postgres'` en el trigger). Defensa extra por si el signup público se reactiva.
- **No:** confiar solo en el signup desactivado.
- **Sí:** admin de prueba creado directo en `auth.users` con `execute_sql`, fuera del repo. Pedido del usuario.
- **No:** admin en `seed.sql`. Dejaría credenciales en el repo.
- **Sí:** `set_updated_at()` genérica, reutilizable por las próximas tablas.
- **Sí:** `grant update (name)` en `daycares`, mismo patrón previsto para `rooms`.
- **Sí:** checks de nombre no vacío, coherente con `daycares`.
- **No:** crear enums de otras tablas; cada uno va con su tabla.
- **No:** revocar `rls_auto_enable()`, generar tipos TS ni conectar la app.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Insert manual en `auth.users` incompleto (el login falla) | Revisar las columnas reales antes; criterio de login. |
| `set local role supabase_auth_admin` no permitido para probar el guard de admin | Si falla por permisos, anotarlo en BACKLOG y probarlo con `inviteUserByEmail` en la spec de invitación de staff. |
| Un error en el trigger bloquea toda creación de cuentas | Probar los inserts en transacción con `rollback` antes de crear el admin real. |
| Staff y relatives aún no ven familiares ni autores de comentarios | Esperado; entrada en BACKLOG. |

---

## Lo que **no** entra en esta spec

- Enums y tablas del resto del esquema.
- Selects de `users` que dependen de `staff_elderly`, `guardian_elderly` y `comments`.
- Revocar `rls_auto_enable()`.
- Tipos generados, `@supabase/ssr` y conexión de la app.
- Server Actions de gestión de cuentas.

Cada una de esas, si llega, va en su propia spec.
