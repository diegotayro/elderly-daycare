# SPEC 09 — Tabla `daycares` con migración y datos de prueba

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-11-07
> **Objetivo:** Crear la tabla `daycares` en Supabase con su migración versionada, RLS activado sin policies y un seed de 5 guarderías de prueba.

---

## Alcance

**Dentro:**

- Carpeta `supabase/` con `migrations/` y `seed.sql` (primera vez en el repo).
- Migración `supabase/migrations/<version>_create_daycares.sql`:
  - Tabla `public.daycares` (`id`, `name`, `created_at`).
  - `name`: `not null`, no vacío (`check`) y `unique`.
  - RLS activado, **sin policies** (tabla cerrada para `anon` y `authenticated`).
- `supabase/seed.sql` con 5 guarderías de UUID fijo, idempotente (`on conflict (id) do nothing`).
- Aplicar la migración al proyecto remoto con el MCP `apply_migration` y el seed con `execute_sql`, **pidiendo permiso antes de cada uno**.
- Actualizar la sección `daycares` de `references/documents/database-schema.md` con las restricciones de `name`.
- Entrada en `specs/BACKLOG.md`: policies de `daycares` pendientes para la spec de `users`.

**Fuera de alcance (para specs futuras):**

- Policies RLS de `daycares` (select de su guardería, update del admin) y sus helpers: dependen de `users`.
- Trigger `AFTER INSERT` que crea la habitación `Temporal`: va con la spec de `rooms`.
- Tablas `users`, `rooms` y el resto del esquema.
- Columna `updated_at` (el esquema no la define para `daycares`).
- Tipos TS generados con el MCP; `shared/database/types.ts` no cambia.
- Instalar `@supabase/ssr`, variables de entorno y clientes en la app.
- Reemplazar `mockSession` por datos reales.
- Supabase CLI y stack local (Docker).

---

## Modelo de datos

```sql
-- supabase/migrations/<version>_create_daycares.sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint daycares_name_not_blank check (length(trim(name)) > 0),
  constraint daycares_name_key unique (name)
);

alter table public.daycares enable row level security;
-- Sin policies: se agregan en la spec de users.
```

Seed (`supabase/seed.sql`):

| `id` | `name` |
| --- | --- |
| `00000000-0000-0000-0000-000000000001` | Casa Nogal |
| `00000000-0000-0000-0000-000000000002` | Casa Olivo |
| `00000000-0000-0000-0000-000000000003` | Jardín del Sauce |
| `00000000-0000-0000-0000-000000000004` | Casa Alameda |
| `00000000-0000-0000-0000-000000000005` | Refugio Los Pinos |

- `Casa Nogal` es la guardería de `mockSession`; su UUID fijo sirve a las seeds de `users` y `rooms`.
- `<version>` es el timestamp `YYYYMMDDHHMMSS` que registra `apply_migration`; el archivo local usa el mismo, para que el repo y `list_migrations` coincidan.

---

## Estructura de archivos

```
supabase/
  migrations/
    <version>_create_daycares.sql
  seed.sql
references/documents/database-schema.md   # restricciones de name en daycares
specs/BACKLOG.md                           # + policies de daycares pendientes
```

---

## Plan de implementación

1. **Skills.** Cargar `supabase` y `supabase-postgres-best-practices`. Revisar con `list_tables` que `daycares` no existe en el remoto.
2. **Migración local.** Escribir el SQL de `create_daycares` en `supabase/migrations/`. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_daycares`. Renombrar el archivo local con la versión de `list_migrations`. Prueba: `list_tables` muestra `daycares` con RLS activado.
4. **Seed.** Escribir `supabase/seed.sql`. Pedir permiso; aplicarlo con `execute_sql` dos veces. Prueba: hay exactamente 5 filas.
5. **Pruebas de restricciones y RLS.** Con `execute_sql` dentro de una transacción con `rollback`: `name = ''`, `name = '   '` y un nombre duplicado fallan; con `set local role anon` y `set local role authenticated`, `select * from daycares` devuelve 0 filas.
6. **Advisors.** `get_advisors` (security). Solo se acepta el aviso de "RLS activado sin policies" en `daycares`.
7. **Documentación.** Restricciones de `name` en `database-schema.md` y entrada en `specs/BACKLOG.md`.

---

## Criterios de aceptación

- [x] Existe `supabase/migrations/<version>_create_daycares.sql` y su versión coincide con la de `list_migrations`.
- [x] En el remoto, `public.daycares` tiene `id uuid` PK con `gen_random_uuid()`, `name text not null` y `created_at timestamptz not null default now()`.
- [x] RLS está activado en `daycares` y no tiene policies.
- [x] Insertar `name = ''` o `'   '` falla por `daycares_name_not_blank`.
- [x] Insertar un `name` repetido falla por `daycares_name_key`.
- [x] Como `anon` y como `authenticated`, `select * from daycares` devuelve 0 filas.
- [x] Tras correr `seed.sql` dos veces, hay exactamente 5 filas con los UUIDs y nombres de la tabla del seed.
- [x] `get_advisors` (security) no muestra avisos salvo "RLS activado sin policies" en `daycares` y los dos avisos preexistentes de `rls_auto_enable()` (ver BACKLOG).
- [x] `database-schema.md` documenta las restricciones de `name`.
- [x] `specs/BACKLOG.md` tiene la entrada de las policies pendientes.
- [x] No hay cambios en código de la app (`shared/database/types.ts`, `mockSession`, `package.json`).

---

## Decisiones

- **Sí:** RLS activado sin policies. Cumple "RLS en todas las tablas" y deja la tabla cerrada hasta tener `users`.
- **No:** helpers provisionales que devuelven `false`. Código que se reescribe después.
- **No:** crear `users` en esta spec. Mezcla dos tablas y sus reglas de protección de columnas.
- **Sí:** trigger de la habitación `Temporal` en la spec de `rooms`. Sin `rooms` no hay dónde insertar.
- **Sí:** SQL versionado en `supabase/migrations/` y aplicado con el MCP. No hay CLI instalada y el proyecto es remoto.
- **No:** Supabase CLI + Docker. Setup extra que no hace falta para una tabla.
- **Sí:** seed en `supabase/seed.sql`, fuera de las migraciones. Los datos de prueba no deben llegar a producción con `db push`.
- **Sí:** UUIDs fijos en el seed. Las seeds de `users` y `rooms` los referencian y el seed es idempotente.
- **Sí:** `name` no nulo, no vacío y único. Decisión del usuario; se documenta en el esquema.
- **No:** unicidad sin distinguir mayúsculas (`lower(name)`). No se pidió; `unique (name)` es lo más simple.
- **No:** `updated_at`. El esquema solo define `created_at` para `daycares`.
- **No:** generar tipos TS ni instalar `@supabase/ssr`. Va en la spec de integración.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración se aplica directo al remoto (sin entorno local) | Se pide permiso antes; la tabla es nueva y vacía, sin datos que perder. |
| Archivo local y migración remota desincronizados | El archivo usa la versión de `list_migrations` (criterio de aceptación). |
| La app no puede leer `daycares` hasta la spec de `users` | Esperado: la app aún usa `mockSession`. Entrada en BACKLOG. |
| `unique (name)` acepta "Casa Nogal" y "casa nogal" | Aceptado; si molesta, se cambia a índice único sobre `lower(name)` en otra spec. |

---

## Lo que **no** entra en esta spec

- Policies y helpers de `daycares`.
- Trigger de la habitación por defecto.
- Otras tablas del esquema.
- `updated_at`.
- Tipos generados, `@supabase/ssr` y conexión de la app.
- CLI y stack local de Supabase.

Cada una de esas, si llega, va en su propia spec.
