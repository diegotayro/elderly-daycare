# SPEC 37 — Tabla `daily_summaries` y lectura de los posts del resumen

> **Estado:** Implementado
> **Depende de:** SPEC 13, SPEC 15, SPEC 22
> **Fecha:** 2026-11-23
> **Objetivo:** Crear la tabla `daily_summaries` (ánimo, siesta y envío), su RLS y la función que lista los posts del día de un adulto mayor, para que SPEC 38 construya el resumen del día.

---

## Por qué esta spec

`database-schema.md` (sección 13) define `daily_summaries` como diferida: la tabla nunca se creó. La feature "Resumen del día" se divide en dos specs por decisión del usuario: esta (DB) y SPEC 38 (pantallas).

Decisiones del usuario que **cambian los documentos de referencia**:

- **Resumen híbrido.** Comidas, momentos y "Lo más lindo de hoy" se calculan de los posts del día. El staff solo escribe el ánimo y los minutos de siesta (los posts de siesta no guardan duración). Se quitan `meals_count`, `activities_count` y `highlight` del esquema.
- **Envío explícito.** El resumen tiene un estado: borrador o enviado (`sent_at`). El familiar solo ve los enviados.
- **El admin también escribe** resúmenes de los adultos mayores de su guardería. Hoy el esquema solo lo permite al staff asignado.
- **Ventana de edición:** hoy y ayer (hora de Lima). Después de enviar se puede corregir; no se puede "des-enviar".

---

## Alcance

**Dentro:**

- Migración nueva con:
  - Tabla `daily_summaries`, constraints, índices y trigger `set_updated_at`.
  - Trigger `protect_daily_summaries_columns`.
  - Helper `can_write_daily_summary(p_elderly_id)`.
  - Policies de `select`, `insert` y `update`.
  - Función `list_summary_posts(p_elderly_id, p_day)`.
- Tipos en `shared/database/types.ts`.
- Pruebas con `execute_sql` en transacciones con `rollback`.
- Documentación: `database-schema.md` y `pantallas-pendientes.md`.

**Fuera de alcance (para specs futuras):**

- Pantallas, formulario y Server Actions (SPEC 38).
- Cron, correo y notificación de las 19:00 (`daily_summary_enabled`).
- Guardar una "foto" de los conteos al enviar: se calculan siempre en vivo.
- Borrar resúmenes.

---

## Modelo de datos

### Tabla `daily_summaries`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `elderly_id` | `uuid` FK → `elderly` `ON DELETE RESTRICT`, not null | |
| `date` | `date` not null | Día en hora de Lima. |
| `mood` | `text` null | "Contento y participativo". De 1 a 80 caracteres sin contar espacios de los extremos (`daily_summaries_mood_length`). |
| `sleep_minutes` | `int` null | De 0 a 300 (`daily_summaries_sleep_minutes_range`). 0 = no durmió. |
| `sent_at` | `timestamptz` null | `null` = borrador. Con valor = enviado a las familias. |
| `created_at` / `updated_at` | `timestamptz` default `now()` | `updated_at` con el trigger `set_updated_at`. |

Constraints:

- `unique (elderly_id, date)` (`daily_summaries_elderly_date_key`). También sirve de índice para leer por adulto mayor y fecha.
- `daily_summaries_sent_requires_fields`: `sent_at is null or (mood is not null and sleep_minutes is not null)`.

### Trigger `protect_daily_summaries_columns` (`before update`)

- `elderly_id` y `date` son inmutables.
- `sent_at` no vuelve a `null` ni cambia una vez puesto (`raise exception 'summary already sent'` si cambia).

### Helper `can_write_daily_summary(p_elderly_id uuid) returns boolean`

`SECURITY DEFINER STABLE`, `set search_path = ''`. `true` si el adulto mayor está `active` y:

- el usuario es admin de su guardería, o
- es staff y lo tiene asignado (`p_elderly_id in (select current_user_elderly_ids())`).

### Policies

| Policy | Acción | Regla |
| --- | --- | --- |
| `daily_summaries_select_relative` | select | rol `relative`, `elderly_id in (select current_user_elderly_ids())` y `sent_at is not null` |
| `daily_summaries_select_staff` | select | rol `staff` y `elderly_id in (select current_user_elderly_ids())` |
| `daily_summaries_select_admin` | select | `is_admin()` y el adulto mayor es de su guardería (con o sin `active`) |
| `daily_summaries_insert_team` | insert | `with check`: `can_write_daily_summary(elderly_id)` y `date` entre ayer y hoy en Lima |
| `daily_summaries_update_team` | update | `using` y `with check`: lo mismo que el insert |

Sin policy de `delete`. Todos los helpers envueltos en `(select ...)`. "Hoy en Lima" = `(now() at time zone 'America/Lima')::date`.

### Función `list_summary_posts`

```sql
create function public.list_summary_posts(p_elderly_id uuid, p_day date)
returns table (
  id uuid,
  type public.post_type,
  title text,
  body text,
  published_at timestamptz
)
```

- `SECURITY INVOKER`, `STABLE`, `set search_path = ''`: la RLS de `posts` y `elderly` decide qué ve quien llama.
- Devuelve los posts publicados en `p_day` (hora de Lima), de tipo distinto de `announcement`, que alcanzan al adulto mayor:
  - `audience = 'elderly'` y está etiquetado en `post_elderly`, o
  - `audience = 'room'` y `room_id` = su habitación actual, o
  - `audience = 'daycare'` (de su guardería; la RLS ya lo limita).
- Orden: `published_at` ascendente.
- Grants: `revoke ... from public, anon`, `grant ... to authenticated`.

La app (SPEC 38) deriva de esta lista:

- Comidas = posts `meal`.
- "Lo más lindo de hoy" = posts `nap`, `activity` y `achievement`.
- Momentos = cantidad de "Lo más lindo de hoy".

### Tipos de la app (`shared/database/types.ts`)

```ts
export type DailySummaryRow = {
  id: string;
  elderly_id: string;
  date: string; // "aaaa-mm-dd"
  mood: string | null;
  sleep_minutes: number | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListSummaryPostsRow = {
  id: string;
  type: PostType;
  title: string | null;
  body: string;
  published_at: string;
};
```

Más la entrada de `daily_summaries` en `Database` y la de `list_summary_posts` en `Functions`, con el mismo formato que las existentes.

---

## Plan de implementación

1. **Migración.** Cargar los skills `supabase` y `supabase-postgres-best-practices`. Escribir tabla, constraints, triggers, helper, policies y `list_summary_posts`. **Pedir permiso antes de aplicarla.** Nombrar el archivo con la versión que devuelve `list_migrations`. Revisar `get_advisors` (security y performance).
2. **Pruebas.** Con `execute_sql`, en transacciones con `rollback`, los casos de Criterios (simulando cada rol con `set local role authenticated` y `request.jwt.claims`).
3. **Tipos.** Actualizar `shared/database/types.ts`. `npm run lint` y `npm run build` pasan.
4. **Documentación.**
   - `database-schema.md`, sección 13: quitar la nota "Pendiente para una implementación posterior"; nueva tabla de campos; RLS nueva (admin escribe, relative solo enviados, ventana hoy/ayer); trigger y `list_summary_posts` en funciones; casos de prueba (incluido el 16, que se mantiene).
   - `database-schema.md`, cliente `service_role`: el "cron del resumen diario" sigue listado como uso futuro.
   - `pantallas-pendientes.md`, punto 7: la tabla existe desde SPEC 37; la pantalla real va en SPEC 38.

---

## Criterios de aceptación

- [x] La migración está en `supabase/migrations/` con la misma versión que en `list_migrations`.
- [x] `get_advisors` no reporta problemas nuevos de `daily_summaries`, `can_write_daily_summary` ni `list_summary_posts`.
- [x] Staff asignado: inserta un borrador de hoy sin `mood` ni `sleep_minutes` → OK.
- [x] Staff asignado: inserta uno de ayer → OK; de anteayer → falla; de mañana → falla.
- [x] Staff no asignado: inserta o actualiza el resumen de ese adulto mayor → falla.
- [x] Admin: inserta y actualiza el de un adulto mayor de su guardería → OK; de otra guardería → falla.
- [x] Insertar o actualizar el de un adulto mayor `archived` → falla.
- [x] Poner `sent_at` sin `mood` o sin `sleep_minutes` → falla (`daily_summaries_sent_requires_fields`).
- [x] `mood` vacío, solo espacios o de 81 caracteres → falla. `sleep_minutes` -1 o 301 → falla.
- [x] Segundo insert del mismo adulto mayor y día → falla (unique).
- [x] Cambiar `elderly_id` o `date`, o poner `sent_at` en `null` o en otro valor después de enviado → falla.
- [x] Editar `mood` de un resumen enviado de hoy → OK y `sent_at` no cambia.
- [x] `delete` desde cualquier rol → 0 filas.
- [x] Familiar: `select` devuelve solo los enviados de sus adultos mayores; un borrador o uno ajeno no aparece.
- [x] Staff: ve los de sus asignados (borradores y enviados); no los de otros.
- [x] `list_summary_posts` devuelve los posts del día que lo etiquetan, los de su habitación y los de la guardería, y no los `announcement`, los de otro día ni los de otra habitación.
- [x] `list_summary_posts` llamada por un familiar no devuelve posts que su RLS no le deja ver.
- [x] Un post publicado a las 23:30 de Lima cuenta en ese día, no en el siguiente.
- [x] `npm run lint` y `npm run build` pasan.

---

## Decisiones

- **Sí:** resumen híbrido. Decisión del usuario. Comidas y momentos ya están en los posts; duplicarlos en la tabla los dejaría desactualizados.
- **No:** guardar `meals_count`, `activities_count` y `highlight` como dice el esquema. Se quitan del documento.
- **No:** todo calculado sin tabla. La siesta y el ánimo no existen en los posts.
- **Sí:** `sent_at` en vez de un enum de estado. Un solo campo da el estado y la hora de envío.
- **Sí:** `mood` y `sleep_minutes` nullable con un check al enviar. Permite guardar borradores incompletos.
- **Sí:** ventana hoy/ayer en la RLS. Decisión del usuario ("por si se olvidó"); validarla en la DB evita escribir días viejos desde cualquier cliente.
- **Sí:** el admin escribe. Decisión del usuario; cambia la RLS del esquema.
- **Sí:** no se "des-envía" (trigger). Decisión del usuario; el familiar ya pudo verlo.
- **Sí:** el familiar solo lee enviados, filtrado en la RLS y no solo en la app.
- **Sí:** `list_summary_posts` `SECURITY INVOKER`. La visibilidad sigue en la RLS de `posts` (`can_view_post`), en un solo lugar; la función solo filtra "qué posts alcanzan a este adulto mayor".
- **Sí:** los posts de habitación se asocian a la habitación **actual** del adulto mayor. El esquema no guarda historial de habitaciones.
- **No:** guardar los conteos al enviar. Se calculan en vivo; si un post se edita o borra, el resumen cambia.
- **Sí:** `ON DELETE RESTRICT` en `elderly_id`. Los adultos mayores se archivan, no se borran.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un adulto mayor cambia de habitación y sus resúmenes pasados muestran posts de la habitación nueva. | Aceptado (no hay historial de habitaciones). Documentado en `database-schema.md`. |
| La ventana "hoy/ayer" depende de la hora del servidor de Postgres. | Se calcula con `now() at time zone 'America/Lima'`, igual que `visible_post_days`. |
| Un post editado o borrado después de enviar cambia el resumen que el familiar ya vio. | Comportamiento esperado por el cálculo en vivo. |
| El staff deja de estar asignado y no puede corregir un resumen que envió. | Esperado: la RLS sigue la asignación actual; el admin puede corregirlo. |

---

## Entradas de BACKLOG

Ninguna se resuelve en esta spec. Las del resumen se resuelven en SPEC 38.

---

## Lo que **no** está en esta spec

- Pantallas, formulario y Server Actions (SPEC 38).
- Cron, correo y notificación de las 19:00.
- Borrar resúmenes.
- Historial de habitaciones.

Cada uno, si llega, va en su propia spec.
