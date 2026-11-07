# SPEC 07 — Pantalla "Avisos": lista estática con datos mock

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-06
> **Objetivo:** Crear la ruta `/notices` que replica `avisos.dc.html` con una lista de avisos mock tipados, conectada al menú "Avisos" y adaptada a móvil.

---

## Alcance

**Dentro:**

- Ruta `app/(app)/notices/page.tsx` dentro del layout `(app)` existente (sidebar, `MobileTopBar`, `MobileBottomNav` y modal de nueva publicación).
- `metadata` con título "Avisos · Casa Nogal".
- "Avisos" del `Sidebar` y del `MobileBottomNav` apunta a `/notices` y se marca activo en esa ruta.
- Contenido igual al mockup:
  - Encabezado: etiqueta "ACTIVIDAD" y título "Avisos".
  - Lista con los 4 avisos del mockup, en este orden:
    1. Comentario: avatar "L" (tono `lilac`), "**Lucía Fernández** comentó en la publicación de Don Luis.", "Hace 12 min".
    2. Cuenta activada: ícono check, "**Diego Fernández** activó su cuenta y ya sigue a Don Luis.", "Hace 1 h".
    3. Reacción: ícono corazón relleno, "**Carla Méndez** reaccionó a la publicación de Doña Rosa.", "Hace 2 h".
    4. Recordatorio: ícono campana, "Recuerda enviar el **resumen del día** de tus adultos mayores.", "Hoy 17:00".
- Los avisos de comentario y reacción son `<Link href="/">` (se reapuntan cuando exista el detalle de publicación). Cuenta activada y recordatorio no son enlaces.
- Los textos de tiempo son fijos en el mock (como `todayLabel` de SPEC 01).
- Estado vacío: si no hay avisos, una tarjeta con el estilo de las del mockup y el texto "No tienes avisos por ahora.".
- Escritorio (`lg` en adelante): igual al mockup a 1440×900 (contenedor de 680px, padding 34px 40px 80px).
- Móvil (bajo `lg`): mismo criterio que `FeedView` (`px-4 pt-5 pb-8`), tarjetas a ancho completo y el texto hace wrap.
- Foco visible en las tarjetas que son enlace.
- Misma pantalla para admin y staff.

**Fuera de alcance (para specs futuras):**

- Tabla, vista o consulta real de avisos (Supabase, RLS, migraciones) y quién los genera.
- Estado leído/no leído, contador en la campana y "marcar como leído".
- Formateo de tiempo relativo a partir de timestamps.
- Detalle de publicación y el destino real de los enlaces.
- Avisos distintos por rol, y bloquear la ruta al rol `relative`.
- Preferencias de notificación (`notify_on_post`, recordatorio): van con "Mi cuenta".
- Tratamiento "Don/Doña" calculado (el esquema no tiene género).
- Paginación o carga incremental.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones, ni cambios en `references/documents/database-schema.md`. Se introduce un tipo de UI en la feature `notices/`; la fuente real se decide en la spec de Supabase.

```ts
// notices/types.ts
export type NoticeKind = "comment" | "reaction" | "account_activated" | "reminder";

type NoticeBase = {
  id: string;
  timeLabel: string; // "Hace 12 min", fijo en el mock
};

export type Notice =
  | (NoticeBase & {
      kind: "comment" | "reaction";
      actorName: string;         // "Lucía Fernández"
      elderlyDisplayName: string; // "Don Luis", texto fijo del mock
      href: string;              // "/" hasta que exista el detalle
    })
  | (NoticeBase & {
      kind: "account_activated";
      actorName: string;
      elderlyDisplayName: string;
    })
  | (NoticeBase & { kind: "reminder" });
```

- `notices/mock-notices.ts` → `mockNotices: Notice[]` con los 4 avisos del mockup.
- `notices/notice-kind-styles.ts` → colores del círculo por `kind` (como `postTypeStyles`):

| `kind` | Círculo | Fondo | Color |
| --- | --- | --- | --- |
| `comment` | avatar con la inicial de `actorName` | `avatarTones.lilac` (`#C9B6E8`) | `#FFFFFF` |
| `account_activated` | `CheckIcon` (`strokeWidth` 2) | `#CFEBD8` | `#3E9B6C` |
| `reaction` | `HeartIcon` (relleno) | `#FBD8CC` | `#D9684A` |
| `reminder` | `BellIcon` | `#F4DC8E` | `#9A7B1E` |

- El texto de cada aviso se arma en el componente según `kind`, con el nombre en `<b>` y el resto igual al mockup.
- Mensaje vacío en `notices/notice-messages.ts`: `emptyNoticesMessage = "No tienes avisos por ahora."`.

---

## Estructura de archivos

```
notices/
  types.ts
  mock-notices.ts
  notice-kind-styles.ts
  notice-messages.ts
  components/
    NoticesView.tsx        # encabezado + lista o estado vacío
    NoticeCard.tsx         # tarjeta; envuelve en <Link> si el aviso tiene href
    NoticeBadge.tsx        # círculo de 40px: Avatar o ícono según kind
    NoticeText.tsx         # frase del aviso según kind
    NoticesEmptyState.tsx
app/
  (app)/notices/page.tsx   # metadata + <NoticesView notices={mockNotices} />
shared/
  components/navigation/
    nav-items.ts           # notices → href "/notices", activePath "/notices"
```

Todos son Server Components; no hay `"use client"` nuevos. Se reutilizan `Avatar`, `avatarTones`, `CheckIcon`, `HeartIcon` y `BellIcon`.

---

## Plan de implementación

1. **Tipos y mock.** `notices/types.ts`, `mock-notices.ts`, `notice-kind-styles.ts` y `notice-messages.ts`. Prueba: `npm run build`.
2. **Ruta y navegación.** `app/(app)/notices/page.tsx` con `NoticesView` mínimo (encabezado). `nav-items.ts`: "Avisos" apunta a `/notices` con `activePath: "/notices"` (se amplía el tipo de `activePath` y se actualiza el comentario). Prueba: el sidebar y el `MobileBottomNav` llevan a `/notices` y marcan "Avisos" activo.
3. **Lista.** `NoticeCard`, `NoticeBadge` y `NoticeText` con los 4 avisos. Comentario y reacción como `<Link href="/">` con foco visible. Prueba: los 4 avisos en orden, con sus textos, círculos y tiempos.
4. **Estado vacío.** `NoticesEmptyState` cuando la lista está vacía. Prueba: con `notices={[]}` temporal en la página se ve "No tienes avisos por ahora." (se revierte después).
5. **Comparación con el mockup.** A 1440×900 coincide con `avisos.dc.html`.
6. **Móvil.** Bajo `lg`, paddings como `FeedView`. Prueba: a 390×844 sin scroll horizontal y el texto hace wrap.
7. **Capturas y pendientes.** Capturas con Playwright en `.playwright-mcp/`: mockup y pantalla a 1440×900, pantalla a 390×844 y estado vacío. Marcar el punto 1 de `references/documents/pantallas-pendientes.md`.

---

## Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] La consola no muestra errores ni warnings de hidratación en `/notices`.
- [x] `/notices` tiene el título "Avisos · Casa Nogal".
- [x] "Avisos" del sidebar y del `MobileBottomNav` lleva a `/notices` y se marca activo solo en esa ruta. "Feed" y "Adultos mayores" no se marcan activos ahí.
- [x] A 1440×900, `/notices` y `avisos.dc.html` no muestran diferencias visibles en el contenido (textos, colores, tipografía, bordes, espaciado y orden).
- [x] Se ven los 4 avisos en el orden del mockup, con el nombre en negrita, su círculo (avatar "L" lila, check verde, corazón coral relleno, campana amarilla) y su tiempo.
- [x] Los avisos de comentario y reacción son enlaces a `/` con foco visible al navegar con teclado. Los de cuenta activada y recordatorio no son enlaces.
- [x] Con una lista vacía se ve una tarjeta con "No tienes avisos por ahora.".
- [x] A 390×844 no hay scroll horizontal, los paddings coinciden con el feed y el texto de los avisos hace wrap.
- [x] No hay `"use client"` nuevos.
- [x] No hay cambios en `references/documents/database-schema.md` ni migraciones.
- [x] El punto 1 de `references/documents/pantallas-pendientes.md` está marcado.
- [x] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** tipo de UI `Notice` (unión discriminada por `kind`) en la feature `notices/`. El esquema no tiene tabla de avisos; decidir si será tabla nueva o vista derivada de `comments`, `reactions` y `users` va en la spec de Supabase.
- **No:** agregar una tabla `notifications` al esquema ahora. Abre decisiones de RLS y de generación de avisos que no hacen falta para la UI.
- **No:** derivar los avisos de tablas existentes. Requiere tipos de `comments` y `reactions` que SPEC 01 dejó fuera.
- **Sí:** ruta `/notices`. Coincide con `NavKey = "notices"` y con las rutas en inglés (`/elderly`).
- **Sí:** comentario y reacción como `<Link href="/">`, mismo criterio que SPEC 01. Se reapuntan con el detalle de publicación.
- **Sí:** tiempos como texto fijo en el mock. Evita diferencias de hidratación; el formateo relativo llega con datos reales.
- **Sí:** "Don Luis" / "Doña Rosa" como texto fijo del mock. El esquema no tiene género (ver SPEC 05).
- **Sí:** estado vacío con texto simple. El mockup no lo define y la decisión es del usuario.
- **Sí:** móvil con el mismo criterio que el feed.
- **No:** leído/no leído ni contador. El mockup no lo muestra.
- **Sí:** misma pantalla para admin y staff, sin bloquear la ruta a `relative`. Llega con la auth real.
- **Sí:** colores de los círculos en un mapa por `kind` con hex, como `postTypeStyles`. No se usan los tokens `--color-notice-*` existentes: son del aviso informativo azul de SPEC 05, no de esta pantalla.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El modelo `Notice` no coincida con la fuente real de avisos | Los componentes solo dependen de `Notice`; la spec de Supabase mapea la fuente a ese tipo o lo ajusta. |
| Confusión entre la feature `notices/` y los tokens `--color-notice-*` (aviso informativo) | Los colores de esta pantalla viven en `notice-kind-styles.ts`; renombrar los tokens queda para otra spec si molesta. |
| Enlaces a `/` que parecen llevar al detalle | Aceptado como en SPEC 01; se reapuntan al existir el detalle. |

---

## Lo que **no** entra en esta spec

- Fuente real de avisos (tabla, vista, RLS, migraciones).
- Leído/no leído, contador y marcar como leído.
- Tiempos relativos calculados.
- Detalle de publicación.
- Avisos por rol y protección de la ruta.
- Preferencias de notificación.
- Paginación.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
