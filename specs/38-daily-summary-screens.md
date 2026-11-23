# SPEC 38 — Resumen del día en el perfil del adulto mayor y en el área familiar

> **Estado:** Aprobado
> **Depende de:** SPEC 16, SPEC 18, SPEC 25, SPEC 27, SPEC 29, SPEC 33, SPEC 36, SPEC 37
> **Fecha:** 2026-11-23
> **Objetivo:** Que el staff asignado y el admin llenen y envíen el resumen del día desde el perfil del adulto mayor, y que el familiar vea en `/family/summary` los resúmenes enviados, con navegación entre días.

---

## Por qué esta spec

El botón "Resumen del día" de `/elderly/[id]` enlaza a `/`, y `/family/summary` muestra datos mock (`family/mock-family.ts`) desde SPEC 18. SPEC 37 creó `daily_summaries` y `list_summary_posts`.

La vista replica `resumen-dia.dc.html` para los dos roles. El mockup no cubre el formulario, el estado borrador/enviado, la navegación entre días ni los estados vacíos: se definieron con el usuario en esta spec.

Decisiones del usuario:

- **Datos híbridos** (SPEC 37): comidas = posts `meal`; "Lo más lindo de hoy" = posts `nap`, `activity` y `achievement`; momentos = cantidad de "Lo más lindo de hoy". Ánimo y siesta los escribe el equipo.
- **El familiar solo ve resúmenes enviados.** Si entra a las 11:00 y el de hoy no se envió, ve el último enviado con su fecha.
- **Navegación entre días:** flechas anterior/siguiente **y** selector de fecha.
- **Formulario en modal**, con el estilo de `EditElderlyDialog`.
- **Edición:** hoy y ayer; se puede corregir después de enviar.
- **Título opcional también en posts `elderly`.** Revierte la decisión de SPEC 25 ("TÍTULO opcional solo para habitación y guardería") y la regla de SPEC 36 ("al pasar a adultos mayores, el título se guarda como `null`"). Así "Lo más lindo de hoy" puede mostrar un título propio, como el mockup ("¡Caminó sin su andador!"). No cambia la DB: `posts_title_length` ya acepta título en cualquier audiencia.

---

## Alcance

**Dentro:**

- **Botón "Resumen del día" del perfil** (`elderly/components/ElderlyProfileView.tsx`): enlaza a `/elderly/[id]/summary`. Mantiene ubicación y estilo (mockup).
- **Ruta `/elderly/[id]/summary`** (admin y staff), en `app/(app)`:
  - Mismo layout que `resumen-dia.dc.html` sin chips: hero, 3 tarjetas, ánimo y "Lo más lindo de hoy".
  - Enlace "← {nombre completo}" de vuelta al perfil, como "← Adultos mayores" del perfil.
  - Acceso: quien puede ver el perfil (admin de su guardería, staff asignado). Si no, `notFound()` (reusa `not-found.tsx` del perfil).
  - Título: "Resumen del día · {nombre completo} · Casa Nogal".
  - Fecha por `?date=aaaa-mm-dd`; sin parámetro, hoy (Lima). Fecha inválida o futura → hoy.
  - **Estado** bajo la fecha del hero: "Borrador", "Sin resumen" o "Enviado a las HH:MM".
  - **Botón "Completar resumen"** (sin resumen o borrador) o **"Editar resumen"** (enviado): solo hoy y ayer, y solo si el adulto mayor está `active`. Abre el modal.
  - Ánimo y siesta sin datos: la tarjeta de siesta muestra "—" y la de ánimo "Pendiente".
- **Modal "Resumen del día"** (sin mockup; reusa el `<dialog>`, botones, campos y toasts de `ElderlyFormDialog`/`FormField`):
  - Subtítulo con el nombre y la fecha ("Luis · martes 17 de junio").
  - "Ánimo del día": texto, máx. 80 caracteres, placeholder "Ej. Contento y participativo".
  - "Siesta": dos campos numéricos, horas (0–5) y minutos (0–59). Total máx. 300 min. Vacíos = sin dato; 0 y 0 = "0 min".
  - Botones:
    - Borrador o sin resumen: "Cancelar", "Guardar borrador" y "Enviar a familias".
    - Enviado: "Cancelar" y "Guardar".
  - Validación al enviar o guardar un enviado: ánimo y siesta obligatorios. "Guardar borrador" acepta vacíos, pero valida longitud y rango si hay valor.
  - Mientras guarda: "Guardando…"/"Enviando…", Esc y "Cancelar" no cierran.
  - Resultados: éxito → cierra, `refresh()` y toast ("Borrador guardado", "Resumen enviado" o "Cambios guardados"); `invalid` → errores por campo; `error` → modal abierto con lo escrito y toast de error.
- **Server Action `saveDailySummary(elderlyId, date, rawInput, intent)`** (`intent`: `"draft" | "send"`): valida, hace `upsert` con `onConflict: "elderly_id,date"` y el cliente de sesión. Con `"send"` pone `sent_at = now()` solo si era `null`. La RLS de SPEC 37 decide permisos y ventana.
- **`/family/summary` con datos reales:**
  - Adultos mayores: los activos vinculados (reusa `fetchFamilyFeedElderly`).
  - Parámetros `?elderly=<id>&date=aaaa-mm-dd`. Sin `elderly`, el primero. Sin `date`, el último resumen enviado de ese adulto mayor.
  - Chips de adulto mayor (`ElderlyFilterChips`) enlazan cambiando `elderly` y quitando `date`. **Con un solo adulto mayor no se muestran.**
  - Sin ningún resumen enviado: estado vacío "Todavía no hay resúmenes de {nombre}".
  - Fecha elegida sin resumen enviado: estado vacío "No hay resumen de este día".
  - Sin adultos mayores activos vinculados: estado vacío "No tienes adultos mayores vinculados".
- **Navegación entre días** (ambas vistas, junto a la fecha del hero, sin mockup):
  - Flechas "‹" y "›" que saltan al resumen anterior/siguiente disponible. Familiar: enviados. Equipo: cualquier fila (borrador o enviado), y también hoy y ayer aunque no tengan fila. Flecha sin destino: deshabilitada.
  - Selector de fecha (`<input type="date">`, máximo hoy) que lleva a ese día.
  - Todo por URL (`<Link>` y `router.push`), sin estado local.
- **"Lo más lindo de hoy"**:
  - Cada ítem enlaza al detalle: `/posts/[id]` (equipo) y `/family/posts/[id]` (familiar).
  - Título: `posts.title` si existe; si no, la etiqueta del tipo ("Siesta", "Actividad", "Logro").
  - Detalle: "HH:MM · {body}", recortado a 2 líneas.
  - Sin ítems: "Hoy no hubo momentos registrados." (o "Ese día…" si no es hoy).
- **Título opcional en posts `elderly`** (sin mockup; el campo ya existe desde SPEC 25):
  - Modal "Nueva publicación" y "Editar publicación" (`feed/components/NewPostForm.tsx`): el campo TÍTULO se muestra con todas las audiencias, en el mismo lugar (entre TIPO y DESCRIPCIÓN) y con el mismo placeholder, `maxLength` 120. Ya no se oculta ni se vacía al pasar a adultos mayores.
  - `feed/validate-new-post.ts`: el límite de 120 caracteres se valida en todas las audiencias.
  - `feed/actions/create-post.ts` y `feed/actions/update-post.ts`: guardan el título en todas las audiencias; vacío → `null`.
  - **Encabezado de la tarjeta** (`feed/build-post-heading.ts`), en `/`, `/family`, los detalles `/posts/[id]` y `/family/posts/[id]` y el visor de fotos:
    - Post `elderly` **sin título**: igual que hoy, los nombres de los etiquetados ("Luis, Jorge").
    - Post `elderly` **con título**: el título como encabezado.
    - `room` y `daycare`: sin cambios.
  - **Línea bajo el encabezado** de un post `elderly` con título (para quién es y quién lo publicó):
    - Feed del familiar y su detalle: "Para Luis, Jorge · 14:20 · Cuidador/a Diego".
    - Feed del equipo y su detalle: sin cambios ("14:20 · publicado por ti"), porque ya muestran la línea "Para: Luis, Jorge" debajo.
    - Sin título: sin cambios en ningún feed.
- **Hero:** "El día de {nombre de pila}" (sin Don/Doña, BACKLOG "Tratamiento") y la fecha con `build-day-label`/`shared/date`.
- **Aviso de `/notices`:** "Recuerda enviar el resumen del día" se oculta cuando todos los adultos mayores activos asignados al staff tienen el resumen de hoy enviado.
- **Limpieza:** se borra `family/mock-family.ts` y los tipos `FamilyMock`/`DailySummary` mock. Los componentes del resumen pasan a `daily-summary/components/` y los usan ambas rutas.
- **Documentación:** `BACKLOG.md`, `pantallas-pendientes.md` y `flujos-de-procesos.md`.

**Fuera de alcance (para specs futuras):**

- Correo o notificación al familiar al enviar (`daily_summary_enabled`) y el cron de las 19:00.
- Tratamiento Don/Doña.
- Hacer clicable la tarjeta completa del feed familiar (resto de la entrada "Enlaces al detalle…").
- Resumen de varios adultos mayores a la vez para el staff.
- Acceso al resumen desde el menú del equipo (solo se entra desde el perfil).

---

## Modelo de datos

No hay cambios de DB. Usa `daily_summaries` y `list_summary_posts` de SPEC 37.

### Tipos de la app

```ts
// daily-summary/types.ts
export type SummaryStatus =
  | { kind: "empty" }                 // sin fila
  | { kind: "draft" }
  | { kind: "sent"; sentAt: string }; // ISO

export type SummaryHighlight = {
  id: string;        // post id
  type: PostType;    // nap | activity | achievement
  title: string;
  time: string;      // "14:20"
  detail: string;
  href: string;      // /posts/[id] o /family/posts/[id]
};

export type DailySummaryData = {
  elderlyId: string;
  firstName: string;
  day: string;                // "aaaa-mm-dd"
  dateLabel: string;          // "martes 17 de junio"
  status: SummaryStatus;
  mealsCount: number;
  sleepMinutes: number | null;
  momentsCount: number;       // = highlights.length
  mood: string | null;
  highlights: SummaryHighlight[];
};

export type SummaryDayNav = {
  previousDay: string | null;
  nextDay: string | null;
  maxDay: string;             // hoy
};

export type DailySummaryInput = {
  mood: string;               // "" = sin dato
  sleepHours: string;
  sleepMinutes: string;
};

export type SaveDailySummaryResult =
  | { status: "success"; message: string }
  | { status: "invalid"; errors: Partial<Record<keyof DailySummaryInput, string>> }
  | { status: "error" };
```

### Mensajes (`daily-summary/daily-summary-messages.ts`)

- "Borrador guardado", "Resumen enviado", "Cambios guardados".
- Error genérico: "No se pudo guardar el resumen. Intenta de nuevo."
- Campos: "Escribe el ánimo del día", "Máximo 80 caracteres", "La siesta va de 0 a 5 h" (total > 300 o fuera de rango), "Indica la siesta".

---

## Encabezado de la tarjeta

| Audiencia | Con título | Sin título |
| --- | --- | --- |
| `elderly` | `title`; debajo, en el feed familiar, "Para {nombres} · {hora} · {autor}" | Nombres de los etiquetados visibles: "Luis, Jorge" (sin cambios) |
| `room` | `title` (sin cambios) | "Habitación Roble" (sin cambios) |
| `daycare` | `title` (sin cambios) | "Toda la guardería" (sin cambios) |

---

## Estructura de archivos

```
app/(app)/elderly/[id]/summary/page.tsx        # metadata + Suspense
app/(family)/family/summary/page.tsx           # cambia: lee searchParams
daily-summary/
  types.ts
  daily-summary-messages.ts
  daily-summary-limits.ts                       # MAX_MOOD_LENGTH = 80, MAX_SLEEP_MINUTES = 300
  fetch-daily-summary.ts                        # fila + list_summary_posts (server-only)
  fetch-summary-day-nav.ts                      # día anterior/siguiente (server-only)
  build-daily-summary.ts                        # filas → DailySummaryData
  parse-summary-date.ts                         # ?date → día válido
  validate-daily-summary.ts
  actions/save-daily-summary.ts
  components/
    DailySummaryPanel.tsx                       # hero + nav + tarjetas + ánimo + destacados
    SummaryHero.tsx                             # movido de family/
    SummaryDayNav.tsx                           # flechas + selector ("use client")
    SummaryStatCard.tsx                         # movido
    MoodCard.tsx                                # movido; acepta null
    SummaryHighlightItem.tsx                    # movido; enlaza
    SummaryEmptyState.tsx
    SummaryStatusBadge.tsx
    DailySummaryDialog.tsx                      # modal ("use client")
    TeamDailySummaryContent.tsx                 # /elderly/[id]/summary
    TeamDailySummarySkeleton.tsx
family/components/
  DailySummaryContent.tsx                       # cambia: datos reales
  DailySummaryView.tsx                          # cambia: chips por URL + panel
  DailySummarySkeleton.tsx                      # se mantiene
notices/fetch-notices.ts                        # cambia: reminder
feed/components/NewPostForm.tsx                 # cambia: TÍTULO en todas las audiencias
feed/validate-new-post.ts                       # cambia
feed/actions/create-post.ts                     # cambia
feed/actions/update-post.ts                     # cambia
feed/build-post-heading.ts                      # cambia: título en posts elderly
family/components/FamilyPostCard.tsx            # cambia: "Para …" con título
family/components/FamilyPostDetailContent.tsx   # cambia: "Para …" con título
elderly/components/ElderlyProfileView.tsx       # cambia: href
```

Se borra `family/mock-family.ts`.

---

## Plan de implementación

1. **Título opcional en posts `elderly`.** Formulario, validación, Server Actions, `buildPostHeading` y la línea "Para …" del feed familiar y su detalle. Prueba: crear un post `elderly` con título y otro sin título, y editar uno para agregarle título; revisar `/`, `/family` y los detalles.
2. **Mover componentes sin cambio de comportamiento.** `SummaryHero`, `SummaryStatCard`, `MoodCard` y `SummaryHighlightItem` a `daily-summary/components/`; `/family/summary` sigue con el mock y se ve igual.
3. **Lectura.** `fetch-daily-summary.ts`, `build-daily-summary.ts`, `fetch-summary-day-nav.ts` y `parse-summary-date.ts`. Consultar Context7 (`/supabase/supabase-js`) para `rpc` y `select` con `maybeSingle`. Prueba: con un `console.log` temporal en el servidor, el resumen de un adulto mayor con posts devuelve los conteos esperados.
4. **Vista del equipo.** Cargar el skill `frontend-design:frontend-design`. `DailySummaryPanel`, `SummaryStatusBadge`, `SummaryEmptyState`, `SummaryDayNav`, `TeamDailySummaryContent`, skeleton y la ruta. El botón del perfil enlaza a `/elderly/[id]/summary`.
5. **Modal y Server Action.** `validate-daily-summary.ts`, `saveDailySummary` y `DailySummaryDialog` (reusa `ElderlyFormDialog`/`FormField` o extrae lo común sin cambiar sus pantallas). Consultar Context7 para `upsert` con `onConflict`.
6. **Vista familiar.** `/family/summary` con `searchParams`, chips por URL (ocultos con uno), `DailySummaryPanel` y estados vacíos. Borrar `family/mock-family.ts` y los tipos mock.
7. **Aviso de `/notices`.** En `shouldIncludeReminder`, además de tener asignados activos, que alguno no tenga el resumen de hoy enviado.
8. **Documentación.**
   - `BACKLOG.md`: "Chips con un solo adulto mayor", "Conectar las pantallas del familiar a Supabase", "Botones 'Editar' y 'Resumen del día' del perfil" y "Recordatorio del resumen que sepa si ya se envió" → `- [x] **Estado:** resuelto en SPEC 38`. "Enlaces al detalle de publicación y al visor de foto": queda `[ ]` y el **Qué** deja solo la tarjeta completa del feed.
   - `pantallas-pendientes.md`: punto 7 con datos reales (SPEC 38) y punto 26 resuelto en SPEC 38.
   - `flujos-de-procesos.md`, "Crear publicación" (línea del título): "Título (opcional): en cualquier audiencia. Vacío se guarda como `null`." Y en "Editar publicación", quitar que el título se borra al pasar a adultos mayores.
   - `flujos-de-procesos.md`: flujo "Resumen del día" (quién escribe, borrador/enviado, ventana hoy/ayer, qué ve el familiar).

---

## Criterios de aceptación

**Título en posts `elderly`:**

- [x] El campo TÍTULO aparece con "adultos mayores", "Toda la habitación" y "Toda la guardería", y no se vacía al cambiar de audiencia.
- [x] Un post `elderly` con título se guarda con ese título; uno sin título, con `title = null`.
- [x] Un título de 121 caracteres en un post `elderly` muestra el error "El título puede tener hasta 120 caracteres." y no se publica.
- [x] Editar un post `elderly` permite agregar, cambiar o quitar el título.
- [x] En `/` y `/family`, un post `elderly` sin título sigue mostrando los nombres como encabezado.
- [x] En `/`, un post `elderly` con título muestra el título como encabezado, "14:20 · {autor}" debajo y la línea "Para: {nombres}".
- [x] En `/family` y `/family/posts/[id]`, un post `elderly` con título muestra el título y debajo "Para {nombres} · {hora} · {autor}".
- [x] Los posts `room` y `daycare` se ven igual que antes.

**Equipo (`/elderly/[id]/summary`):**

- [x] El botón "Resumen del día" del perfil lleva a `/elderly/[id]/summary`.
- [x] La vista replica `resumen-dia.dc.html` (sin chips) a 1440×900 y se ve sin scroll horizontal a 390×844.
- [x] El título de la pestaña es "Resumen del día · {nombre completo} · Casa Nogal".
- [x] Staff no asignado abre la ruta de otro adulto mayor → 404.
- [x] Comidas = posts `meal` del día; momentos = cantidad de ítems de "Lo más lindo de hoy"; los `announcement` no aparecen.
- [x] Un post de la habitación del adulto mayor y uno de toda la guardería cuentan; uno de otra habitación no.
- [x] Cada ítem de "Lo más lindo de hoy" enlaza a `/posts/[id]`.
- [x] Sin resumen: estado "Sin resumen", siesta "—", ánimo "Pendiente" y botón "Completar resumen".
- [x] "Guardar borrador" con campos vacíos → toast "Borrador guardado" y estado "Borrador".
- [x] "Enviar a familias" sin ánimo o sin siesta → errores por campo y no se guarda.
- [x] Ánimo de 81 caracteres o siesta de 5 h 1 min → error por campo.
- [x] Enviar con datos → toast "Resumen enviado", estado "Enviado a las HH:MM" y botón "Editar resumen".
- [x] Editar un enviado muestra "Cancelar" y "Guardar"; guardar no cambia la hora de envío.
- [x] Con `?date=` de anteayer, no aparece el botón del modal.
- [x] Con el adulto mayor `archived` (admin), no aparece el botón del modal.
- [x] Las flechas saltan al día anterior/siguiente disponible y se deshabilitan sin destino; el selector no permite días futuros.
- [x] `?date=` inválido o futuro muestra hoy.

**Familiar (`/family/summary`):**

- [x] Ya no existe `family/mock-family.ts` y no hay datos mock en la pantalla.
- [x] Un borrador no se ve; tras enviarlo, aparece.
- [x] Si hoy no hay resumen enviado, muestra el último enviado con su fecha.
- [x] Sin resúmenes enviados: "Todavía no hay resúmenes de {nombre}".
- [x] Con un solo adulto mayor vinculado no se muestran chips; con dos, cambiar de chip cambia la URL y el resumen.
- [x] Las flechas solo navegan entre resúmenes enviados.
- [x] Cada ítem de "Lo más lindo de hoy" enlaza a `/family/posts/[id]`.
- [x] Un familiar no puede ver el resumen de un adulto mayor ajeno cambiando `?elderly=` (muestra el primero propio).

**Avisos y general:**

- [x] El staff con todos sus asignados activos enviados hoy no ve "Recuerda enviar el resumen del día" después de las 17:00; con uno pendiente, sí.
- [x] La consola no muestra errores ni warnings de hidratación en las dos rutas.
- [x] `npm run lint` y `npm run build` pasan.
- [x] Capturas en `.playwright-mcp/` de ambas vistas (1440×900 y 390×844) y del modal.

---

## Decisiones

- **Sí:** una ruta `/elderly/[id]/summary` y no un modal en el perfil. Decisión del usuario; la vista se comparte con el familiar.
- **Sí:** un solo `DailySummaryPanel` para equipo y familiar. Evita duplicar el layout del mockup.
- **Sí:** feature `daily-summary/` (Screaming Architecture); los componentes salen de `family/` porque ya no son solo del familiar.
- **Sí:** el familiar solo ve enviados y, por defecto, el último enviado. Decisión del usuario; evita mostrar un día a medias.
- **No:** vista en vivo con "Día en curso" ni hora fija de publicación. Descartadas por el usuario.
- **Sí:** flechas y selector de fecha. Decisión del usuario (combinó las dos opciones).
- **Sí:** fecha y adulto mayor en la URL. Permite enlazar y recargar sin perder la selección, y la lectura queda en el servidor.
- **Sí:** el equipo navega también por hoy y ayer sin fila. Son los días que puede completar.
- **Sí:** modal con el estilo de `EditElderlyDialog`. Decisión del usuario; no hay mockup del formulario.
- **Sí:** siesta en horas + minutos. Es como se muestra ("1h 30"); se guarda en minutos.
- **Sí:** "momentos" = cantidad de "Lo más lindo de hoy" (`nap`, `activity`, `achievement`). Decisión del usuario.
- **Sí:** título opcional también en posts `elderly`, dentro de esta spec. Decisión del usuario; revierte SPEC 25 y la regla del título de SPEC 36.
- **No:** spec aparte para el título. El usuario prefirió incluirlo aquí.
- **Sí:** post `elderly` con título → el título es el encabezado y los nombres van debajo. Sin título, como hoy. Decisión del usuario.
- **Sí:** en el feed del equipo no se agregan los nombres a la línea bajo el encabezado. Ya los muestra la línea "Para:"; repetirlos sería redundante.
- **Sí:** título del destacado = `posts.title` o la etiqueta del tipo. `buildPostHeading` sin título daría el nombre del propio adulto mayor.
- **Sí:** ocultar chips con un solo adulto mayor, como el feed (SPEC 25). Decisión del usuario.
- **Sí:** ocultar el recordatorio de `/notices` cuando todo está enviado. Decisión del usuario (entrada del BACKLOG).
- **No:** correo al familiar al enviar. Va con la spec de notificaciones.
- **No:** "Don/Doña" en el hero. El esquema no lo guarda (BACKLOG "Tratamiento").

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los posts `elderly` ya publicados no tienen título. | Esperado: siguen viéndose igual y en el resumen muestran la etiqueta del tipo. |
| El mockup de "Nueva publicación" no tiene campo de título. | El campo ya existe desde SPEC 25; solo deja de ocultarse. |
| Mover componentes de `family/` rompe `/family/summary`. | Paso 2 sin cambio de comportamiento, con revisión visual antes de seguir. |
| Navegación, estado y estados vacíos sin mockup se alejan del estilo. | Se reusan tokens, botones y tipografía existentes; capturas para revisión del usuario en el paso 4. |
| `upsert` necesita permisos de `insert` y `update` a la vez. | SPEC 37 define ambas policies con la misma regla; se prueba en el paso 5. |
| Calcular día anterior/siguiente agrega consultas. | Dos `select` con `limit 1` sobre el índice único `(elderly_id, date)`. |
| Fecha de Lima vs UTC en el servidor de Next. | Se usan `getLimaToday`, `getLimaDay` y `shiftDay` de `shared/date/`. |

---

## Entradas de BACKLOG

- "Chips con un solo adulto mayor": resuelta.
- "Conectar las pantallas del familiar a Supabase": resuelta (solo quedaba el resumen).
- "Botones 'Editar' y 'Resumen del día' del perfil": resuelta.
- "Recordatorio del resumen que sepa si ya se envió": resuelta.
- "Enlaces al detalle de publicación y al visor de foto": resuelta a medias (los ítems del resumen); queda la tarjeta completa del feed familiar.

---

## Lo que **no** está en esta spec

- Correo o notificación al enviar y cron de las 19:00.
- Tratamiento Don/Doña.
- Tarjeta completa clicable en el feed familiar.
- Resumen de varios adultos mayores a la vez.
- Entrada al resumen desde el menú del equipo.

Cada uno, si llega, va en su propia spec.
