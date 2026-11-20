# SPEC 27 — "Avisos" con datos reales

> **Estado:** Aprobado
> **Depende de:** SPEC 07, SPEC 15, SPEC 17, SPEC 22, SPEC 25
> **Fecha:** 2026-11-20
> **Objetivo:** Reemplazar el mock de `/notices` por avisos derivados en vivo de `comments`, `reactions` y `guardian_elderly` más un recordatorio diario, respetando la RLS vigente sin cambiar ninguna policy.

---

## Por qué esta spec

SPEC 07 maquetó `/notices` con `mockNotices`. El esquema no tiene tabla de avisos y el usuario decidió no crearla: los avisos se calculan al leer desde las tablas que ya existen. La RLS manda: cada usuario ve avisos solo de lo que ya puede leer, y donde la RLS oculta un nombre el aviso usa un texto genérico.

Avisos muestra lo que pasó **alrededor** del contenido (comentarios, reacciones, familiares que activan su cuenta, recordatorio). Las nuevas publicaciones no son avisos: se ven en el feed.

---

## Alcance

**Dentro:**

- Migración con dos funciones:
  - `list_notices(p_since, p_limit)` `SECURITY INVOKER`: arma los avisos de comentarios, reacciones y vínculos.
  - `is_first_guardian_link(p_link_id)` `SECURITY DEFINER STABLE`: dice si un vínculo es el primero del familiar, solo `true/false`.
- Cuatro tipos de aviso:
  - **Comentario:** uno por comentario.
  - **Reacción:** agrupada, uno por post.
  - **Cuenta activada:** uno por fila de `guardian_elderly`, con texto distinto si es el primer vínculo del familiar o uno siguiente.
  - **Recordatorio:** "Recuerda enviar el resumen del día…", calculado en la app.
- Quién ve qué:
  - Comentarios y reacciones: en todo post que el usuario puede ver según `can_view_post()` (staff: posts `daycare`, `room` de la habitación de algún asignado, `elderly` con algún asignado etiquetado, y los suyos; admin: todos los de su guardería).
  - Cuenta activada: staff, vínculos de sus asignados (`guardian_elderly_select_staff`); admin, los de su guardería (`guardian_elderly_select_admin`).
  - Recordatorio: solo staff con `daily_summary_enabled = true` y al menos un adulto mayor `active` asignado, desde las 17:00 (Lima) hasta el fin del día.
- Se excluyen las acciones propias (comentarios y reacciones del usuario que mira).
- Ventana: últimos 30 días, máximo 50 avisos derivados (más el recordatorio), sin paginación.
- Nombre de quien reacciona no legible por RLS → "Un familiar".
- Texto de la publicación según su audiencia (ver "Textos").
- Hora relativa o con fecha, calculada en el servidor en hora de Lima (ver "Hora del aviso").
- Tarjetas sin enlace (no existe el detalle de publicación).
- Se borra `notices/mock-notices.ts`.
- Agregar a mano `ListNoticesRow` a `shared/database/types.ts` (el archivo es manual, no generado).

**Fuera de alcance (para specs futuras):**

- Tabla `notifications`, leído/no leído, contador en la campana y "marcar como leído".
- Avisos de nuevas publicaciones.
- Enlaces al detalle de publicación.
- Comentar y reaccionar desde la UI.
- Saber si el resumen del día ya se envió (`daily_summaries`).
- Paginación o "Cargar más".
- Avisos para `relative` (la ruta sigue solo para el equipo).
- Cambiar policies de `users`, `reactions`, `comments` o `guardian_elderly`.
- Tratamiento "Don/Doña".
- Correo o tiempo real.

---

## Modelo de datos

No hay tablas nuevas ni cambios de policies.

### Función `is_first_guardian_link`

```sql
create function public.is_first_guardian_link(p_link_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
```

- `true` si el vínculo existe, quien llama puede verlo (admin de la guardería del adulto mayor, o staff con ese adulto mayor asignado) y el familiar no tiene otro vínculo en `guardian_elderly` más antiguo (desempate por `id`).
- `false` en cualquier otro caso: vínculo inexistente, de otra guardería, no visible para quien llama, `relative`, `pending` o `archived`.
- Cumple la regla 7 del esquema: solo devuelve `true/false`, nunca filas ni nombres. Es necesaria porque el staff solo ve los vínculos de sus asignados y no puede saber si el familiar ya tenía otro.
- `EXECUTE` solo para `authenticated`.

### Función `list_notices`

```sql
create function public.list_notices(p_since timestamptz, p_limit int)
returns table (
  id text,               -- 'comment:<id>', 'reaction:<post_id>', 'link:<id>'
  kind text,             -- 'comment' | 'reaction' | 'account_activated'
  occurred_at timestamptz,
  actor_name text,       -- null si la RLS no deja leer al usuario
  others_count int,      -- reacción: cuántas más además de la última; 0 en el resto
  post_audience public.post_audience, -- null en account_activated
  post_title text,
  room_name text,
  elderly_names text[],  -- first_name de los etiquetados legibles, orden alfabético
  elderly_first_name text, -- account_activated: adulto mayor del vínculo
  is_first_link boolean    -- account_activated: is_first_guardian_link(id)
)
language sql
stable
security invoker
set search_path = ''
```

- `UNION ALL` de tres bloques, ordenado por `occurred_at desc` con `limit p_limit`:
  - **Comentarios:** `comments` con `created_at >= p_since` y `author_id <> auth.uid()`. `actor_name` = `users.full_name` del autor (`left join`).
  - **Reacciones:** `reactions` con `created_at >= p_since` y `user_id <> auth.uid()`, agrupadas por `post_id`. `occurred_at` y `actor_name` son de la reacción más reciente del grupo; `others_count` = cantidad del grupo − 1.
  - **Vínculos:** `guardian_elderly` con `created_at >= p_since`. `actor_name` = `full_name` del familiar, `elderly_first_name` = `first_name` del adulto mayor.
- `SECURITY INVOKER`: cada `select` pasa por la RLS de quien llama (`comments_select_visible`, `reactions_select_visible`, `guardian_elderly_select_*`, `users_select_*`, `elderly_select_*`). Por eso un `actor_name` puede salir `null` y `elderly_names` puede salir vacío.
- `EXECUTE` solo para `authenticated`.

### Tipos de la app (`notices/types.ts`, reemplaza el de SPEC 07)

```ts
export type NoticeKind = "comment" | "reaction" | "account_activated" | "reminder";

export type NoticePost = {
  audience: PostAudience;
  title: string | null;
  roomName: string | null;
  elderlyNames: string[];
};

type NoticeBase = { id: string; timeLabel: string };

export type Notice =
  | (NoticeBase & { kind: "comment"; actorName: string; post: NoticePost })
  | (NoticeBase & {
      kind: "reaction";
      actorName: string | null; // null → "Un familiar"
      othersCount: number;
      post: NoticePost;
    })
  | (NoticeBase & {
      kind: "account_activated";
      actorName: string;
      elderlyFirstName: string;
      isFirstLink: boolean;
    })
  | (NoticeBase & { kind: "reminder" });
```

Se quita `href` y `elderlyDisplayName`.

### Límites (`notices/notice-limits.ts`)

```ts
export const NOTICES_WINDOW_DAYS = 30;
export const NOTICES_LIMIT = 50;
export const SUMMARY_REMINDER_TIME = "17:00"; // hora de Lima
```

### Textos

La frase de la publicación (`notices/build-post-phrase.ts`):

| Caso | Frase |
| --- | --- |
| `room` o `daycare` con título | `“Paseo al parque”` |
| `elderly` | `de Luis, Carmen` (reusa `joinElderlyNames`); `de un adulto mayor` si no hay nombres legibles |
| `room` sin título | `de la Habitación Girasol`; `de una habitación` si no hay nombre |
| `daycare` sin título | `para toda la guardería` |

Frases de cada aviso (`NoticeText`, nombre en `<b>`):

| Caso | Texto |
| --- | --- |
| Comentario | **Lucía Fernández** comentó en la publicación {frase}. |
| Reacción, sola | **Carla Méndez** reaccionó a la publicación {frase}. |
| Reacción, agrupada | **Carla Méndez** y 3 más reaccionaron a la publicación {frase}. |
| Reacción, nombre no legible | **Un familiar** reaccionó… / **Un familiar** y 3 más reaccionaron… |
| Primer vínculo | **Diego Fernández** activó su cuenta y ya sigue a Luis. |
| Vínculo siguiente | **Diego Fernández** ahora también sigue a Luis. |
| Recordatorio | Recuerda enviar el **resumen del día** de tus adultos mayores. |

"Un familiar" es siempre correcto: el staff lee a todo el staff y al admin de su guardería (`users_select_team`), y el admin lee a todos (`users_select_admin`). Si no puede leer a quien reaccionó, es un familiar.

### Hora del aviso (`notices/format-notice-time.ts`)

Con `now` y el instante del aviso, en hora de Lima, en este orden:

| Condición | Texto |
| --- | --- |
| Menos de 1 min | `Ahora` |
| Menos de 60 min | `Hace 12 min` |
| Mismo día | `Hace 3 h` |
| Día anterior | `Ayer 14:30` |
| Más antiguo | `12 nov 14:30` |
| Recordatorio | `Hoy 17:00` |

### Lectura (`notices/fetch-notices.ts`, `server-only`)

- `fetchNotices(user)`: llama a `list_notices(now − 30 días, 50)` con `shared/supabase/server.ts`, mapea con `buildNotices` y agrega el recordatorio si corresponde.
- El recordatorio corresponde si `user.role = 'staff'`, `user.daily_summary_enabled`, la hora de Lima es ≥ 17:00 y hay al menos un `elderly` `active` legible (la RLS del staff solo deja ver a sus asignados). Su instante es hoy 17:00 Lima y se ordena con el resto.
- Si la consulta falla, se lanza el error (como el resto de las rutas; el diseño de `error.tsx` sigue en el BACKLOG).

---

## Estructura de archivos

```
supabase/migrations/
  <version>_create_notice_functions.sql   # nuevo
shared/database/
  types.ts                                # + ListNoticesRow (a mano)
notices/
  types.ts                                # reemplazado
  notice-limits.ts                        # nuevo
  build-post-phrase.ts                    # nuevo
  format-notice-time.ts                   # nuevo
  build-notices.ts                        # nuevo: filas de list_notices → Notice[]
  fetch-notices.ts                        # nuevo, server-only
  mock-notices.ts                         # se borra
  components/
    NoticesContent.tsx                    # fetchNotices en vez del mock
    NoticeText.tsx                        # textos de la tabla "Textos"
    NoticeCard.tsx                        # sin <Link>
    NoticeBadge.tsx                       # inicial de actorName en comentarios
```

No hay `"use client"` nuevos. Las tarjetas, colores, estado vacío y esqueleto de SPEC 07 y SPEC 19 no cambian.

---

## Plan de implementación

1. **Revisión previa.** Con `list_migrations` y `execute_sql`: confirmar que existen `comments`, `reactions`, `guardian_elderly`, `can_view_post()` y las policies citadas, y que no existen las dos funciones nuevas. Prueba: si algo no coincide, detenerse y preguntar.
2. **Migración local.** `create_notice_functions.sql` con `is_first_guardian_link`, `list_notices` y sus `grant`/`revoke`. Prueba: revisión del diff.
3. **Aplicar migración.** Pedir permiso; `apply_migration` con nombre `create_notice_functions`. Renombrar el archivo local con la versión de `list_migrations`. Agregar `ListNoticesRow` a mano en `shared/database/types.ts`. Prueba: las funciones existen.
4. **Pruebas SQL** (`execute_sql` en transacciones con `rollback`, usuarios y datos creados dentro de la transacción como en SPEC 22). Prueba: los criterios de "Base de datos".
5. **Advisors.** `get_advisors` (security y performance). Lo aceptado va al BACKLOG.
6. **Reglas puras.** `notice-limits.ts`, `types.ts`, `build-post-phrase.ts` y `format-notice-time.ts`. Prueba: `npm run build` y `npm run lint`.
7. **Lectura.** `build-notices.ts` y `fetch-notices.ts` (RPC y recordatorio). Prueba: `npm run build`.
8. **UI real.** `NoticesContent` con `fetchNotices`, `NoticeText`, `NoticeBadge` y `NoticeCard` sin enlace. Se borra `mock-notices.ts`. Prueba: `/notices` muestra el estado vacío o los avisos reales.
9. **Prueba real y capturas.** Pedir permiso para escribir en el remoto. Insertar por SQL comentarios, reacciones y un vínculo de prueba; verificar como admin y como staff (incluido "Un familiar" y la agrupación). Capturas en `.playwright-mcp/` a 1440×900 y 390×844. Borrar los datos de prueba al terminar.
10. **Documentación.** "Cambios en documentos" y "Entradas de BACKLOG".

---

## Criterios de aceptación

**Base de datos**

- [ ] Existe `supabase/migrations/<version>_create_notice_functions.sql` y su versión coincide con la de `list_migrations`.
- [ ] `list_notices` es `SECURITY INVOKER` y `is_first_guardian_link` es `SECURITY DEFINER STABLE`; ambas con `search_path` vacío y `EXECUTE` solo para `authenticated`.
- [ ] Ninguna policy existente cambió (mismo resultado de `pg_policies` antes y después).
- [ ] Como staff, `list_notices` devuelve el comentario de un familiar en un post `daycare` del admin, y no devuelve el de un post `elderly` que solo etiqueta a un adulto mayor no asignado.
- [ ] Como staff, una reacción de un familiar de un adulto mayor no asignado en un post `daycare` sale con `actor_name = null`; la de un familiar de un asignado sale con su nombre.
- [ ] Tres reacciones en un mismo post dan una sola fila `reaction` con `others_count = 2` y el `occurred_at` y `actor_name` de la más reciente.
- [ ] Los comentarios y reacciones del propio usuario no aparecen.
- [ ] Como admin, aparecen comentarios y reacciones de todos los posts de su guardería y ninguno de otra guardería.
- [ ] Como staff, aparecen los vínculos de sus asignados y no los de otros adultos mayores.
- [ ] `is_first_guardian_link` da `true` para el primer vínculo de un familiar y `false` para el segundo, también como staff que solo tiene asignado el adulto mayor del segundo.
- [ ] `is_first_guardian_link` da `false` como `relative`, con un vínculo de otra guardería y con un id inexistente.
- [ ] Un comentario de hace 31 días no aparece; con más de 50 avisos, devuelve los 50 más recientes.
- [ ] `get_advisors` sin avisos nuevos fuera de los aceptados en el BACKLOG.

**Pantalla**

- [ ] `/notices` no usa mock y `notices/mock-notices.ts` no existe.
- [ ] Los textos de cada aviso siguen la tabla "Textos", con el nombre (o "Un familiar") en negrita.
- [ ] La frase de la publicación sigue la tabla de audiencias: un post `daycare` sin título dice "para toda la guardería"; uno con título muestra el título entre comillas.
- [ ] La hora sigue la tabla "Hora del aviso" en hora de Lima.
- [ ] Como staff con `daily_summary_enabled = true` y asignados activos, desde las 17:00 aparece el recordatorio con "Hoy 17:00"; antes de las 17:00, con el flag en `false` o sin asignados, no aparece. Al admin nunca le aparece.
- [ ] Ninguna tarjeta es un enlace.
- [ ] Sin avisos se ve "No tienes avisos por ahora.".
- [ ] Los colores, íconos y espaciado de las tarjetas siguen igual que en SPEC 07.
- [ ] A 390×844 no hay scroll horizontal y los textos largos hacen wrap.

**Cierre**

- [ ] `npm run build` y `npm run lint` sin errores. La consola no muestra errores en `/notices`.
- [ ] No hay `"use client"` nuevos ni usos nuevos de `service_role`.
- [ ] El remoto queda sin los datos de prueba.
- [ ] Las capturas están en `.playwright-mcp/`.
- [ ] `database-schema.md` y `BACKLOG.md` actualizados según "Cambios en documentos" y "Entradas de BACKLOG".

---

## Cambios en documentos

1. **`references/documents/database-schema.md`**, "Funciones": agregar `list_notices` y `is_first_guardian_link` (con la nota de la regla 7 y del aviso del linter, como `room_has_elderly_without_photo_consent`).

## Entradas de BACKLOG

- Nueva entrada en "Feed": "Avisos de nuevas publicaciones en `/notices`" (decidido fuera en esta spec; el feed ya las muestra).
- Nueva entrada en "Feed": "Leído/no leído y contador de Avisos" (requiere tabla `notifications`).
- Nueva entrada en "Feed": "Recordatorio del resumen que sepa si ya se envió" (con `daily_summaries`).
- "Enlaces al detalle de publicación desde `/family` y `/family/summary`": queda `[ ]`. Sumar a las **Notas** que las tarjetas de `/notices` tampoco enlazan.
- "Notificaciones de Mi cuenta": queda `[ ]`. Sumar a las **Notas** que el recordatorio de Avisos usa 17:00 y `daily_summary_enabled`.
- "Tratamiento (Don/Doña) de los adultos mayores": queda `[ ]`. Actualizar **Origen**: `mock-notices.ts` ya no existe; Avisos usa el nombre de pila.
- "Avisos del linter aceptados tras la spec 10": sumar `is_first_guardian_link()` si el linter la marca.

---

## Decisiones

- **Sí:** guardar en `specs/database/`. Tiene migración y funciones.
- **Sí:** avisos derivados al leer. Decisión del usuario; sin tabla ni triggers, siempre consistentes con los datos.
- **No:** tabla `notifications` con triggers. Suma migración, RLS, triggers y backfill solo para habilitar leído/no leído, que queda fuera.
- **Sí:** RPC `list_notices` `SECURITY INVOKER`. Decisión del usuario; una llamada, orden y límite en la DB, y la RLS se aplica tal cual.
- **No:** tres consultas mezcladas en TypeScript. Traerían hasta 150 filas para quedarse con 50.
- **Sí:** comentarios y reacciones en todo post visible por `can_view_post()`. Decisión del usuario, consciente del ruido de los posts `daycare`.
- **Sí:** admin ve las interacciones de toda su guardería. Decisión del usuario.
- **Sí:** no cambiar ninguna policy. Decisión del usuario.
- **Sí:** "Un familiar" cuando la RLS oculta a quien reaccionó. Propuesta del usuario; es correcto porque el equipo siempre es legible.
- **No:** policy `users_select_reaction_authors`. Cambiaría la RLS.
- **Sí:** agrupar reacciones por post. Decisión del usuario; un post popular no tapa los demás avisos.
- **No:** agrupar comentarios. Cada uno es una interacción distinta.
- **Sí:** texto distinto para el primer vínculo y los siguientes. Decisión del usuario.
- **Sí:** `is_first_guardian_link` `SECURITY DEFINER` booleano. Decisión del usuario; el staff no ve los vínculos de no asignados y la función solo devuelve `true/false` (regla 7), sin cambiar policies.
- **No:** decidir el primer vínculo solo con lo visible. El staff podría ver "activó su cuenta" en un segundo vínculo.
- **No:** usar `invitations.accepted_at`. Solo la lee el admin.
- **Sí:** recordatorio fijo desde las 17:00, solo staff con asignados y `daily_summary_enabled`. Decisión del usuario; sigue el copy del mockup ("Hoy 17:00", "Recordatorio de resumen (17:00)").
- **No:** recordatorio para el admin. No tiene asignados.
- **Sí:** 30 días y máximo 50, sin paginación. Decisión del usuario.
- **Sí:** tarjetas sin enlace. Decisión del usuario; el BACKLOG pide no usar `href="/"` provisional.
- **Sí:** excluir las acciones propias. Decisión del usuario.
- **Sí:** las nuevas publicaciones no son avisos. Decisión del usuario; el feed ya las muestra y el mockup no las define.
- **Sí:** frase de la publicación según audiencia. Decisión del usuario; el mockup solo cubre `elderly`.
- **Sí:** hora relativa hasta el mismo día y luego con fecha, en hora de Lima. Decisión del usuario.
- **Sí:** datos de prueba temporales por SQL, borrados al terminar. Decisión del usuario; hoy no se puede comentar ni reaccionar desde la UI.
- **Sí:** nombre de pila sin "Don/Doña", como los feeds reales (SPEC 25).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración y las pruebas escriben en el remoto | Se pide permiso antes; los datos de prueba se borran al terminar. |
| Muchos avisos de posts `daycare` para todo el staff | Aceptado; las reacciones se agrupan y hay tope de 50. |
| Sin datos reales de comentarios y reacciones, la pantalla sale vacía | Esperado hasta la spec de comentar y reaccionar; se prueba con datos temporales. |
| Si el admin borra el primer vínculo, el siguiente pasa a decir "activó su cuenta" | Aceptado; es un caso raro y el texto sigue siendo comprensible. |
| `can_view_post()` se evalúa por fila en `comments` y `reactions` | Ventana de 30 días; revisar con `EXPLAIN` si `/notices` se vuelve lenta. |
| La hora relativa queda fija hasta recargar | Aceptado; no hay tiempo real. |
| El recordatorio aparece aunque el resumen ya se haya enviado | Aceptado hasta que exista `daily_summaries`; anotado en el BACKLOG. |

---

## Lo que **no** entra en esta spec

- Tabla `notifications`, leído/no leído y contador.
- Avisos de nuevas publicaciones.
- Detalle de publicación y enlaces desde las tarjetas.
- Comentar y reaccionar.
- Recordatorio ligado a `daily_summaries`.
- Paginación.
- Avisos para familiares.
- Cambios en policies.
- Correo o tiempo real.

Cada una de esas, si llega, va en su propia spec.
