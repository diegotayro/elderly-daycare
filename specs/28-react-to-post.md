# SPEC 28 — Reaccionar a una publicación desde el feed

> **Estado:** Aprobado
> **Depende de:** SPEC 22, SPEC 25
> **Fecha:** 2026-11-20
> **Objetivo:** Convertir el corazón de las tarjetas de `/` y `/family` en un botón que agrega o quita la reacción `love` del usuario, con actualización optimista y sin cambios en la base de datos.

---

## Por qué esta spec

La tabla `reactions` y sus policies existen desde SPEC 22, y el feed real (SPEC 25) ya muestra el conteo, pero nadie puede reaccionar desde la UI. Avisos (SPEC 27) ya lee las reacciones. Esta spec cierra el ciclo con el mínimo: el corazón del feed pasa a ser un toggle.

El mockup del feed solo dibuja el corazón coral relleno con su número. El estado "sin reaccionar" no está en el mockup y lo define esta spec (contorno gris). El botón "Me encanta" de `detalle-publicacion.dc.html` queda para la spec del detalle.

---

## Alcance

**Dentro:**

- El corazón de `PostCard` (`/`) y de `FamilyPostCard` (`/family`) pasa a ser un botón toggle.
- Pueden reaccionar todos los roles con acceso: `admin`, `staff` y `relative`, incluido el autor en su propio post (como permite el esquema).
- Estados visuales:
  - **Reaccionado:** corazón coral relleno (`text-coral-icon`), igual que el mockup.
  - **Sin reaccionar:** corazón solo con contorno, en `text-muted-strong` (el gris del ícono de comentarios).
- El feed lee si el usuario ya reaccionó a cada post (`reactedByMe`), también en las páginas de "Cargar más".
- Server Action `setReaction(postId, reacted)` idempotente: con `reacted = true` inserta, con `false` borra. Usa `shared/supabase/server.ts` y la RLS vigente.
- Actualización optimista: el corazón y el número cambian al instante; si la acción falla, vuelven al estado anterior y se muestra un toast de error.
- Mientras la acción está en curso, el botón ignora nuevos clics (`aria-disabled="true"`).
- Sin `refresh()`: solo cambia la tarjeta tocada.
- Accesibilidad: `aria-pressed`, nombre accesible, foco visible y área táctil de al menos 44×44 px sin mover el layout del mockup.

**Fuera de alcance (para specs futuras):**

- Pantalla de detalle de publicación, botón "Me encanta" y la línea "A N personas les gusta".
- Lista de quién reaccionó.
- Tipos de reacción distintos de `love`.
- Comentar.
- Conteos en vivo (las reacciones de otros se ven al recargar).
- Reaccionar desde `/family/summary` o desde `/notices`.
- Notificar por correo las reacciones.
- Cambios de tablas, policies o funciones.

---

## Modelo de datos

No hay tablas, migraciones ni policies nuevas. Se reusa `reactions` de SPEC 22:

- `type text check (type = 'love')`, `unique (post_id, user_id)`.
- `reactions_insert_own`: `user_id = auth.uid()` y `can_view_post(post_id)`.
- `reactions_delete_own`: `user_id = auth.uid()` y usuario activo.
- `reactions_select_visible`: `can_view_post(post_id)`.

### Tipos de la app

```ts
// feed/types.ts
export type FeedPostData = { /* … */ reactionCount: number; reactedByMe: boolean; /* … */ };
export type FeedPost = { /* … */ reactionCount: number; reactedByMe: boolean; /* … */ };

export type SetReactionResult = { status: "ok" } | { status: "error" };

// family/types.ts
export type FamilyPost = { /* … */ reactionCount: number; reactedByMe: boolean; /* … */ };
```

```ts
// feed/reaction-type.ts
export const REACTION_TYPE = "love";
```

### Lectura de `reactedByMe` (`feed/fetch-feed-page.ts`)

- Después de leer los posts, una segunda consulta: `reactions.select("post_id").eq("user_id", currentUserId).in("post_id", postIds)`.
- `reactedByMe` = el id del post está en ese resultado.
- `fetchFeedPage` recibe `currentUserId`. `getInitialFeedDays` y `getFeedDaysBefore` lo reciben y lo pasan.
- Sin posts no se hace la segunda consulta.

### Server Action (`feed/actions/set-reaction.ts`)

- `setReaction(postId: string, reacted: boolean): Promise<SetReactionResult>`.
- Valida con `getCurrentUser()` que haya un usuario activo; si no, `{ status: "error" }`.
- Valida que `postId` sea un UUID y que `reacted` sea `boolean`; si no, `{ status: "error" }`.
- `reacted = true`: `insert { post_id, user_id: user.id, type: REACTION_TYPE }`. El error `23505` (ya existía) cuenta como `ok`.
- `reacted = false`: `delete` con `post_id` y `user_id = user.id`. Borrar cero filas cuenta como `ok`.
- `user_id` lo fija siempre el servidor; nunca viene del cliente.
- Cualquier otro error (post borrado, ya no visible por RLS, red) → `{ status: "error" }`.

### Toast de error (`feed/reaction-messages.ts`)

| Campo | Texto |
| --- | --- |
| Título | No se pudo guardar tu reacción |
| Descripción | Revisa tu conexión e intenta de nuevo. |

Tono `error`, con el `Toast` de `shared/components/toast/`.

### Botón (`feed/components/ReactionButton.tsx`, `"use client"`)

- Props: `postId`, `initialReacted`, `initialCount`.
- Estado confirmado `{ reacted, count }` en `useState`; estado mostrado con `useOptimistic` dentro de `startTransition`.
- Al tocar: muestra `{ !reacted, count ± 1 }`, llama a `setReaction`. Con `ok` guarda el nuevo estado confirmado; con `error` vuelve al anterior y muestra el toast.
- `<button type="button">` con `aria-pressed={reacted}` y `aria-label` = `Me encanta, {count}`.
- Foco visible con `focus-visible:outline-coral-strong` (como el `Toast`).
- Transición de color con `motion-reduce:transition-none`; sin animaciones extra.
- Misma tipografía, tamaño de ícono (19) y separación que el `<span>` actual.

### Ícono (`shared/components/icons/HeartIcon.tsx`)

- Nueva prop `filled?: boolean` (por defecto `true`, así no cambia ningún uso actual). Con `false`, `fill="none"`.

---

## Estructura de archivos

```
feed/
  types.ts                    # + reactedByMe en FeedPostData y FeedPost; + SetReactionResult
  reaction-type.ts            # nuevo
  reaction-messages.ts        # nuevo
  fetch-feed-page.ts          # + currentUserId y consulta de reactedByMe
  get-feed-days.ts            # pasa currentUserId
  build-feed.ts               # mapea reactedByMe
  actions/
    set-reaction.ts           # nuevo
  components/
    ReactionButton.tsx        # nuevo, "use client"
    PostCard.tsx              # usa ReactionButton
family/
  types.ts                    # + reactedByMe en FamilyPost
  build-family-feed.ts        # mapea reactedByMe
  components/
    FamilyPostCard.tsx        # usa ReactionButton
shared/components/icons/
  HeartIcon.tsx               # + prop filled
```

Más los llamadores de `getInitialFeedDays` y `getFeedDaysBefore` (`FeedContent`, `FamilyFeedContent`, `load-more-team-feed.ts`, `load-more-family-feed.ts`), que pasan `user.id`.

---

## Plan de implementación

1. **Revisión previa (solo lectura).** Con `execute_sql`: confirmar que `reactions` tiene `reactions_insert_own`, `reactions_delete_own`, `reactions_select_visible`, el `unique (post_id, user_id)` y los `grant` de insert/delete para `authenticated`. Prueba: si algo no coincide, detenerse y preguntar.
2. **Lectura de `reactedByMe`.** Tipos, `fetchFeedPage` con `currentUserId`, `get-feed-days.ts`, llamadores, `build-feed.ts` y `build-family-feed.ts`. Las tarjetas aún no lo usan. Prueba: `npm run build`, `npm run lint` y el feed carga igual que antes.
3. **Server Action.** `reaction-type.ts`, `reaction-messages.ts` y `actions/set-reaction.ts`. Prueba: `npm run build` y `npm run lint`.
4. **Botón.** Cargar el skill `frontend-design:frontend-design`. `HeartIcon` con `filled` y `ReactionButton`. Prueba: `npm run build`.
5. **Tarjetas.** `PostCard` y `FamilyPostCard` usan `ReactionButton`. Prueba: en `/` y `/family` el corazón refleja el estado real y se puede tocar.
6. **Prueba real y capturas.** Pedir permiso para escribir en el remoto. Reaccionar y quitar la reacción desde la UI como admin y como familiar; comprobar las filas en `reactions` con `execute_sql` y que la reacción del familiar aparece en `/notices` del admin. Capturas en `.playwright-mcp/` a 1440×900 y 390×844, con y sin reacción. Borrar al terminar las reacciones de prueba que queden.
7. **Documentación.** "Entradas de BACKLOG".

---

## Criterios de aceptación

**Datos y acción**

- [ ] No hay migraciones nuevas ni cambios en `pg_policies`.
- [ ] El feed de `/`, el de `/family` y las páginas de "Cargar más" traen `reactedByMe` correcto para cada post.
- [ ] Sin posts en el rango no se hace la consulta de `reactedByMe`.
- [ ] `setReaction(postId, true)` crea una fila con `user_id` del usuario y `type = 'love'`; llamarla otra vez devuelve `ok` y no crea otra fila.
- [ ] `setReaction(postId, false)` borra la fila del usuario; llamarla otra vez devuelve `ok`.
- [ ] Con un `postId` que no es UUID o un `reacted` que no es `boolean`, devuelve `error` sin tocar la DB.
- [ ] Sin sesión, devuelve `error`.
- [ ] En un post que el usuario no puede ver, devuelve `error` y no crea filas.
- [ ] La acción nunca usa `service_role` ni recibe `user_id` del cliente.

**Pantalla**

- [ ] En `/` y `/family`, un post sin reacción propia muestra el corazón con contorno en `text-muted-strong`; con reacción propia, relleno en `text-coral-icon`.
- [ ] Tocar el corazón cambia el ícono y el número al instante (±1).
- [ ] Al recargar, el estado y el número coinciden con lo guardado.
- [ ] Si la acción falla, el corazón y el número vuelven al estado anterior y aparece el toast "No se pudo guardar tu reacción" / "Revisa tu conexión e intenta de nuevo.".
- [ ] Mientras la acción está en curso, un segundo clic no hace nada.
- [ ] Reaccionar no recarga el resto del feed (ninguna otra tarjeta cambia ni se vuelven a pedir las fotos).
- [ ] Funciona igual en publicaciones cargadas con "Cargar más".
- [ ] Admin, staff y familiar pueden reaccionar, también el autor en su propio post.
- [ ] El botón tiene `aria-pressed`, nombre accesible "Me encanta, N", se activa con Enter y Espacio, y muestra foco visible.
- [ ] El área táctil mide al menos 44×44 px y la fila de acciones se ve igual que en el mockup.
- [ ] Con `prefers-reduced-motion: reduce` no hay transición.
- [ ] A 390×844 no hay scroll horizontal.

**Cierre**

- [ ] `npm run build` y `npm run lint` sin errores. La consola no muestra errores en `/` ni en `/family`.
- [ ] Los usos actuales de `HeartIcon` se ven igual (por ejemplo, el ícono de reacción de `/notices`).
- [ ] El remoto queda sin las reacciones de prueba.
- [ ] Las capturas están en `.playwright-mcp/`.
- [ ] `BACKLOG.md` actualizado según "Entradas de BACKLOG".

---

## Entradas de BACKLOG

Esta spec no resuelve entradas existentes.

- "Enlaces al detalle de publicación desde `/family` y `/family/summary`": queda `[ ]`. Sumar a las **Notas** que el detalle debe reusar `setReaction` para el botón "Me encanta" y definir la línea "A N personas les gusta".
- Nueva entrada en "Feed": "Conteo de reacciones en vivo" (las reacciones de otros solo se ven al recargar; decidir si vale tiempo real o un `refresh` periódico).

---

## Decisiones

- **Sí:** guardar en `specs/` y no en `specs/database/`. No hay migraciones ni SQL nuevo.
- **Sí:** reaccionar desde el corazón del feed. Decisión del usuario; el detalle de publicación aún no existe y va en su propia spec junto con comentarios.
- **No:** construir ahora el detalle con "Me encanta". Agranda la spec y arrastra comentarios.
- **Sí:** todos los roles reaccionan, incluido el autor. Decisión del usuario; es lo que define el esquema y no exige cambiar policies.
- **Sí:** contorno gris sin reacción y coral relleno con reacción. Decisión del usuario; el mockup solo define el estado relleno.
- **Sí:** Server Action con el cliente de sesión y actualización optimista. Decisión del usuario; la RLS valida visibilidad y la respuesta se siente inmediata.
- **No:** insert/delete directo desde `client.ts`. Las escrituras del proyecto van por Server Actions.
- **Sí:** acción con estado deseado (`reacted`) e idempotente. Decisión del usuario; un estado desfasado (otra pestaña) no produce errores ni filas duplicadas.
- **No:** `toggleReaction(postId)`. Con un estado desfasado haría lo contrario de lo que ve el usuario.
- **Sí:** sin `refresh()`. Decisión del usuario; no re-renderiza el feed ni re-firma las fotos, y funciona igual con "Cargar más".
- **Sí:** bloquear clics mientras guarda. Decisión del usuario; evita carreras entre acciones.
- **Sí:** `23505` y borrar cero filas cuentan como éxito. El resultado final es el que pidió el usuario.
- **Sí:** toast genérico de error. Decisión del usuario; no se distingue post borrado.
- **Sí:** `reactedByMe` con una segunda consulta filtrada por `user_id`. Explícita y sin traer todas las reacciones de cada post.
- **No:** embeber todas las filas de `reactions` y calcular en la app. Crece con cada reacción.
- **Sí:** el toast lo muestra cada `ReactionButton`. Sigue el patrón actual (cada componente renderiza su `Toast`); dos errores seguidos se reemplazan por `key`.
- **Sí:** `HeartIcon` con `filled` por defecto `true`. No cambia ningún uso actual.
- **Sí:** prueba real desde la UI con limpieza. Decisión del usuario.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La prueba escribe en el remoto | Se pide permiso antes; las reacciones de prueba se borran al terminar. |
| El conteo queda desfasado si otros reaccionan | Aceptado; se corrige al recargar. Anotado en el BACKLOG. |
| La segunda consulta suma una ida a la DB por página | Una sola consulta por página, filtrada por `user_id` y los ids del rango (usa `reactions_post_id_user_id_key`). |
| Un admin o staff archivado mientras tiene el feed abierto | La RLS rechaza la escritura; el botón revierte y muestra el toast. |
| El post se borra mientras el usuario lo ve | El insert falla por FK o RLS; el botón revierte y muestra el toast. |

---

## Lo que **no** entra en esta spec

- Detalle de publicación, "Me encanta" y "A N personas les gusta".
- Lista de quién reaccionó.
- Otros tipos de reacción.
- Comentar.
- Conteos en vivo.
- Reaccionar desde el resumen o desde Avisos.
- Correos por reacciones.
- Cambios en la base de datos.

Cada una de esas, si llega, va en su propia spec.
