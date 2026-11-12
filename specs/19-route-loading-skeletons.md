# SPEC 19 — Streaming con `<Suspense>` y esqueletos de carga en `(app)` y `(family)`

> **Estado:** Implementado
> **Depende de:** SPEC 11, SPEC 16, SPEC 18
> **Fecha:** 2026-11-12
> **Objetivo:** Llevar la lectura de sesión de `/`, `/notices`, `/account`, `/family`, `/family/summary` y `/family/account` dentro de `<Suspense>` con un esqueleto propio por pantalla, para eliminar el aviso `encountered uncached data during a navigation`.

---

## Alcance

**Dentro:**

- Las seis páginas aplican el patrón de SPEC 16:
  - La página no es `async`.
  - Un `*Content` (Server Component) llama a `requireTeamUser()` o a `requireRelativeUser()` y renderiza la vista actual.
  - El `*Content` va dentro de `<Suspense>` con el esqueleto de la pantalla.
- Rutas del equipo `(app)`: `/` (feed), `/notices`, `/account`.
- Rutas del familiar `(family)`: `/family`, `/family/summary`, `/family/account`.
- Un esqueleto por pantalla, armado con `SkeletonBlock`, que imita la estructura de la vista:
  - Usa el mismo contenedor (ancho máximo y padding) que la vista.
  - Muestra los títulos fijos que no dependen de datos: "ACTIVIDAD / Avisos" y "AJUSTES / Mi cuenta".
  - Lo que depende del usuario o de los datos va como bloque, por ejemplo "Buenas, {nombre}", "GUARDERÍA · {nombre}" y "Hola, {nombre}".
  - Tiene `role="status"` y un texto `sr-only` ("Cargando …"), y no se anima con `prefers-reduced-motion` (lo da `SkeletonBlock`).
- `/account` y `/family/account` comparten un solo `AccountSkeleton`; la variante del familiar agrega el bloque de "Adultos mayores".
- Los títulos fijos de Avisos y Mi cuenta se extraen a componentes propios (`NoticesTitle` y `AccountTitle`), como `ElderlyListTitle`. Los usan la vista y el esqueleto, para no duplicar el texto.
- Se eliminan `app/(app)/loading.tsx` y `app/(family)/loading.tsx`.
- Actualizar `specs/BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- `use cache: private` en `getCurrentUser()` y el prefetch de la sesión. Se decide al conectar el feed a Supabase.
- Conectar el feed, `/notices` y las pantallas del familiar a Supabase. Siguen con mock.
- El `generateMetadata` de `/elderly/[id]` y el título de pestaña de un archivado (entrada propia en BACKLOG).
- `error.tsx` con diseño propio.
- Cambios en los layouts: el sidebar y la barra móvil ya tienen su `<Suspense>`.
- Cambios en la DB: no hay migraciones.

---

## Modelo de datos

Esta spec no introduce datos nuevos ni cambia tipos. Los `*Content` reciben lo mismo que hoy reciben las páginas.

### Página (patrón)

```tsx
// app/(family)/family/page.tsx
export default function FamilyFeedPage() {
  return (
    <Suspense fallback={<FamilyFeedSkeleton />}>
      <FamilyFeedContent />
    </Suspense>
  );
}
```

```tsx
// family/components/FamilyFeedContent.tsx
export async function FamilyFeedContent() {
  const user = await requireRelativeUser();
  return <FamilyFeedView firstName={user.first_name} />;
}
```

La `metadata` estática de cada página se mantiene igual.

### Esqueletos

| Pantalla | Esqueleto | Contenido |
| --- | --- | --- |
| `/` | `FeedSkeleton` | Bloques de cabecera (antetítulo, título, subtítulo), bloque del botón "Nueva publicación", separador "PUBLICADO HOY" y 3 tarjetas. |
| `/notices` | `NoticesSkeleton` | `NoticesTitle` y 4 tarjetas. |
| `/account` y `/family/account` | `AccountSkeleton` | `AccountTitle`, tarjeta de perfil, tarjeta de notificaciones, tarjeta de acciones y botón de cerrar sesión. Con `withElderlyCard`, se agrega el bloque de "Adultos mayores" entre el perfil y las notificaciones. |
| `/family` | `FamilyFeedSkeleton` | Bloques de cabecera, fila de chips y 3 tarjetas. |
| `/family/summary` | `DailySummarySkeleton` | Fila de chips, bloque de cabecera, 3 tarjetas de estadísticas, tarjeta de ánimo y 3 ítems de "lo más lindo". |

Las alturas y los radios de los bloques se toman de los componentes reales. Supuesto de esta spec: los mockups no definen el esqueleto, así que su forma se deriva de cada vista.

### Entradas de BACKLOG

- "Esqueleto de carga definitivo de `(app)`" → `- [x] **Estado:** resuelto en SPEC 19`.
- "Aviso de consulta fuera de `<Suspense>` y esqueleto de carga de `(family)`" → `- [x] **Estado:** resuelto en SPEC 19`.
- Intro de "Carga y streaming de las rutas": anotar que la sección quedó cerrada en SPEC 19 y que el patrón se reusa al conectar el feed y `/notices` a Supabase.

---

## Estructura de archivos

```
app/(app)/page.tsx                           # sin async; Suspense + FeedContent
app/(app)/notices/page.tsx                   # sin async; Suspense + NoticesContent
app/(app)/account/page.tsx                   # sin async; Suspense + AccountContent
app/(app)/loading.tsx                        # se elimina
app/(family)/family/page.tsx                 # sin async; Suspense + FamilyFeedContent
app/(family)/family/summary/page.tsx         # sin async; Suspense + DailySummaryContent
app/(family)/family/account/page.tsx         # sin async; Suspense + FamilyAccountContent
app/(family)/loading.tsx                     # se elimina
feed/components/
  FeedContent.tsx                            # nuevo
  FeedSkeleton.tsx                           # nuevo
notices/components/
  NoticesContent.tsx                         # nuevo
  NoticesSkeleton.tsx                        # nuevo
  NoticesTitle.tsx                           # nuevo
  NoticesView.tsx                            # usa NoticesTitle
account/components/
  AccountContent.tsx                         # nuevo
  AccountSkeleton.tsx                        # nuevo
  AccountTitle.tsx                           # nuevo
  AccountView.tsx                            # usa AccountTitle
family/components/
  FamilyFeedContent.tsx                      # nuevo
  FamilyFeedSkeleton.tsx                     # nuevo
  DailySummaryContent.tsx                    # nuevo
  DailySummarySkeleton.tsx                   # nuevo
  FamilyAccountContent.tsx                   # nuevo
specs/BACKLOG.md                             # 3 cambios
```

---

## Plan de implementación

Antes del paso 2, cargar el skill `frontend-design:frontend-design` (CLAUDE.md). Antes del paso 1, revisar `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` y la guía de `loading.js`.

1. **Streaming de `(family)` con fallback provisional.** Los tres `*Content` del familiar, las páginas sin `async` dentro de `<Suspense fallback={null}>`, y eliminar `(family)/loading.tsx`. Prueba: en `npm run dev`, como relative, `/family` ya no muestra el aviso.
2. **Esqueletos de `(family)`.** `FamilyFeedSkeleton`, `DailySummarySkeleton`, `AccountTitle` y `AccountSkeleton` con `withElderlyCard`. Prueba: se ven al recargar con red lenta.
3. **Streaming de `(app)`.** Los tres `*Content` del equipo, `NoticesTitle`, `FeedSkeleton` y `NoticesSkeleton`, las páginas sin `async`, y eliminar `(app)/loading.tsx`. Prueba: como admin, `/`, `/notices` y `/account` no muestran el aviso.
4. **Verificación.** Revisar los criterios como admin y como relative; capturas con Playwright en `.playwright-mcp/`.
5. **Documentación.** Aplicar los cambios en `BACKLOG.md`.

---

## Criterios de aceptación

**Streaming**

- [ ] Ninguna de las seis páginas es `async` ni llama a `requireTeamUser()` o a `requireRelativeUser()` fuera de `<Suspense>`.
- [ ] En `npm run dev`, al navegar por `/family`, `/family/summary` y `/family/account` como relative no aparece el aviso `encountered uncached data during prerendering or a navigation` ni otro aviso de datos fuera de `<Suspense>`.
- [ ] Lo mismo como admin en `/`, `/notices` y `/account`.
- [ ] `/elderly` y `/elderly/[id]` siguen sin el aviso tras eliminar `(app)/loading.tsx`.
- [ ] `app/(app)/loading.tsx` y `app/(family)/loading.tsx` ya no existen.

**Esqueletos**

- [ ] Mientras carga cada ruta se ve su esqueleto, con el mismo ancho que la vista final y sin salto horizontal al terminar.
- [ ] `NoticesSkeleton` muestra "ACTIVIDAD / Avisos" y `AccountSkeleton` muestra "AJUSTES / Mi cuenta".
- [ ] `/family/account` muestra en su esqueleto el bloque de "Adultos mayores"; `/account` no.
- [ ] Cada esqueleto tiene `role="status"` y un texto `sr-only`; con `prefers-reduced-motion` no se anima.
- [ ] `NoticesView` y `AccountView` usan `NoticesTitle` y `AccountTitle` y se ven igual que antes.

**Redirecciones**

- [ ] Sin sesión, las seis rutas redirigen a `/login`.
- [ ] Un relative que abre `/`, `/notices` o `/account` termina en `/family`.
- [ ] Un admin que abre `/family`, `/family/summary` o `/family/account` termina en `/`.

**Cierre**

- [ ] Las pestañas siguen diciendo "Feed · Casa Nogal", "Resumen del día · Casa Nogal", "Mi cuenta · Casa Nogal" y "Avisos · Casa Nogal", según la ruta.
- [ ] Las seis vistas se ven igual que antes de la spec, con los mismos datos mock y el nombre del usuario.
- [ ] `BACKLOG.md` tiene los 3 cambios de esta spec.
- [ ] `npm run build` y `npm run lint` terminan sin errores, y la consola no muestra errores ni warnings de hidratación en las seis rutas.
- [ ] A 390×844 no hay scroll horizontal en ninguno de los esqueletos.
- [ ] Capturas en `.playwright-mcp/` de los cinco esqueletos (1440×900 y 390×844).

---

## Decisiones

- **Sí:** resolver en una sola spec las rutas de `(family)` y de `(app)`. Decisión del usuario; cierra la sección "Carga y streaming de las rutas" del BACKLOG.
- **Sí:** streaming con `<Suspense>` y esqueleto, no `instant = false`. Decidido el 2026-11-09 y aplicado en SPEC 16.
- **Sí:** un esqueleto por pantalla, como en SPEC 16. Decisión del usuario; se parece más a la vista final.
- **No:** un esqueleto genérico compartido. Es más simple, pero produce un salto visual mayor.
- **Sí:** un solo `AccountSkeleton` para `/account` y `/family/account`. Ambas usan `AccountView`; solo cambia el bloque de adultos mayores (DRY).
- **Sí:** eliminar `(app)/loading.tsx` y `(family)/loading.tsx`. Decisión del usuario; con un `<Suspense>` en cada página, un fallback `null` no aporta nada.
- **No:** usar `loading.tsx` con el esqueleto. La guía de Next recomienda `<Suspense>` cerca del acceso a datos, y así cada pantalla tiene su forma.
- **Sí:** todo el contenido de la página va dentro de `<Suspense>`, salvo lo que ya está en el layout. Las vistas reciben datos del usuario (nombre, correo, rol), así que fuera del límite solo quedaría el título.
- **No:** `use cache: private` en `getCurrentUser()`. Decisión del usuario; cambia el comportamiento de auth y se decide al conectar el feed a Supabase.
- **Sí:** spec en `specs/` y no en `specs/database/`. No hay migraciones ni cambios de esquema.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Sin `loading.tsx`, alguna ruta vuelve a mostrar el aviso (por ejemplo `/elderly`) | Criterio explícito para `/elderly` y `/elderly/[id]`; si el aviso aparece, detenerse y preguntar antes de restaurar `loading.tsx`. |
| La redirección de `requireTeamUser()` o `requireRelativeUser()` dentro de `<Suspense>` ocurre después de empezar el streaming | Criterios de redirección por rol y sin sesión; si alguno no redirige, detenerse y preguntar. |
| El esqueleto no coincide con la vista y produce un salto visual | Medidas tomadas de los componentes reales; criterio de mismo ancho y capturas. |

---

## Lo que **no** entra en esta spec

- `use cache: private` y el prefetch de la sesión.
- Datos reales en el feed, `/notices` y las pantallas del familiar.
- `generateMetadata` de `/elderly/[id]`.
- `error.tsx` con diseño propio.
- Cambios en la DB.

Cada una de esas, si llega, va en su propia spec.
