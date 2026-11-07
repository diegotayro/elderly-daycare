# SPEC 08 — Pantalla "Mi cuenta": perfil y preferencias con datos mock

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 07
> **Fecha:** 2026-11-06
> **Objetivo:** Crear la ruta `/account` que replica `mi-cuenta.dc.html` con los datos de `mockSession`, toggles de notificaciones con estado local, conectada al menú "Mi cuenta" y adaptada a móvil.

---

## Alcance

**Dentro:**

- Ruta `app/(app)/account/page.tsx` dentro del layout `(app)` existente.
- `metadata` con título "Mi cuenta · Casa Nogal".
- "Mi cuenta" del `Sidebar` y del `MobileBottomNav` apunta a `/account` y se marca activo en esa ruta.
- Contenido igual al mockup:
  - Encabezado: etiqueta "AJUSTES" y título "Mi cuenta".
  - Tarjeta de perfil: `Avatar` de 64px (inicial de `full_name`, fuente 26px), nombre, email y rol (`userRoleLabels`), y botón "Editar".
  - Tarjeta "NOTIFICACIONES" con dos toggles: "Nuevos comentarios de familias" (valor inicial `notify_on_post`) y "Recordatorio de resumen (17:00)" (valor inicial `daily_summary_enabled`).
  - Tarjeta con "Cambiar contraseña" y "Ayuda y soporte", cada fila con `ChevronRightIcon`.
  - Enlace "Cerrar sesión" a `/login`.
- Datos desde `mockSession`: `currentUser` y un nuevo campo `email: "caro@casanogal.pe"`.
- Toggles con estado local (no se guarda; se reinicia al recargar): `<button type="button" role="switch" aria-checked>`, nombre accesible = texto de la fila, foco visible. Encendido `#5FB97E` con perilla a la derecha; apagado `#E4D6C4` con perilla a la izquierda. Transición corta, sin transición con `prefers-reduced-motion`.
- "Editar", "Cambiar contraseña" y "Ayuda y soporte" son `<button type="button">` sin acción, con foco visible.
- El botón de logout del `Sidebar` pasa de `/` a `/login`.
- Escritorio (`lg` en adelante): igual al mockup a 1440×900 (contenedor de 680px, padding 34px 40px 80px).
- Móvil (bajo `lg`): mismo criterio que `FeedView` (`px-4 pt-5 pb-8`), tarjetas a ancho completo, el email largo hace wrap/trunca sin scroll horizontal.
- Misma pantalla para admin y staff.
- Entrada en `specs/BACKLOG.md` con la inconsistencia de notificaciones (copy del mockup vs. campos de la DB).

**Fuera de alcance (para specs futuras):**

- Persistir preferencias (update de `users` en Supabase) y cerrar sesión real.
- Modales "Editar perfil" (avatar) y "Cambiar contraseña" (punto 23).
- Pantalla de "Ayuda y soporte".
- Mi cuenta del admin con edición de la guardería (punto 24).
- Mi cuenta familiar (`familia-cuenta.dc.html`, punto 6).
- Resolver la inconsistencia de notificaciones (copy vs. `notify_on_post` / `daily_summary_enabled` 19:00).
- Foto de avatar (`avatar_url`).
- Bloquear la ruta al rol `relative`.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones, ni cambios en `references/documents/database-schema.md`. El tipo `User` no cambia (el email vive en `auth.users`).

```ts
// shared/session/mock-session.ts
export const mockSession: { daycare: Daycare; currentUser: User; email: string } = {
  // ...igual que hoy
  email: "caro@casanogal.pe",
};
```

```ts
// account/notification-preferences.ts
export type NotificationPreferenceKey = "notify_on_post" | "daily_summary_enabled";

export type NotificationPreference = {
  key: NotificationPreferenceKey;
  label: string;
};

// Copy del mockup staff; la equivalencia con la DB está en BACKLOG.
export const notificationPreferences: NotificationPreference[] = [
  { key: "notify_on_post", label: "Nuevos comentarios de familias" },
  { key: "daily_summary_enabled", label: "Recordatorio de resumen (17:00)" },
];
```

---

## Estructura de archivos

```
account/
  notification-preferences.ts
  components/
    AccountView.tsx              # encabezado + tarjetas + "Cerrar sesión"
    ProfileCard.tsx              # avatar, nombre, email, rol, botón "Editar"
    NotificationSettingsCard.tsx # título + filas con toggle
    NotificationToggle.tsx       # "use client": switch con estado local
    AccountActionsCard.tsx       # "Cambiar contraseña" y "Ayuda y soporte"
app/
  (app)/account/page.tsx         # metadata + <AccountView ... /> con mockSession
shared/
  session/mock-session.ts        # + email
  components/navigation/
    nav-items.ts                 # account → href "/account", activePath "/account"
    Sidebar.tsx                  # logout → "/login"
specs/BACKLOG.md                 # + inconsistencia de notificaciones
```

Solo `NotificationToggle` es `"use client"`. Se reutilizan `Avatar`, `ChevronRightIcon`, `userRoleLabels` y los tokens de `globals.css` (`surface`, `line`, `line-soft`, `body`, `label`, `muted`, `muted-strong`, `nav`, `coral-strong`, `consent-check` para `#5FB97E`). Si faltan tokens para `#E4D6C4`, `#F2C4B6`, `#FBEAE3` o `#CBB89F`, se agregan en `globals.css`.

---

## Plan de implementación

1. **Datos.** `email` en `mockSession` y `account/notification-preferences.ts`. Prueba: `npm run build`.
2. **Ruta y navegación.** `app/(app)/account/page.tsx` con `AccountView` mínimo (encabezado). `nav-items.ts`: "Mi cuenta" apunta a `/account` con `activePath: "/account"` (se amplía el tipo y se quita el comentario obsoleto). `Sidebar`: logout a `/login`. Prueba: sidebar y `MobileBottomNav` llevan a `/account` y marcan "Mi cuenta" activo; el logout del sidebar va a `/login`.
3. **Perfil.** `ProfileCard` con avatar, nombre, email, rol y botón "Editar". Prueba: coincide con el mockup.
4. **Notificaciones.** `NotificationSettingsCard` + `NotificationToggle` con estado local, `role="switch"`, colores on/off y reduced motion. Prueba: clic y teclado (Espacio/Enter) alternan `aria-checked` y el color.
5. **Acciones y cierre.** `AccountActionsCard` y el enlace "Cerrar sesión" a `/login`. Prueba: foco visible en todos; "Cerrar sesión" lleva a `/login`.
6. **Comparación con el mockup.** A 1440×900 coincide con `mi-cuenta.dc.html`.
7. **Móvil.** Bajo `lg`, paddings como `FeedView`. Prueba: a 390×844 sin scroll horizontal.
8. **Capturas, backlog y pendientes.** Capturas con Playwright en `.playwright-mcp/`: mockup y pantalla a 1440×900, pantalla a 390×844 y un toggle apagado. Entrada en `specs/BACKLOG.md`. Marcar el punto 2 de `references/documents/pantallas-pendientes.md`.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] La consola no muestra errores ni warnings de hidratación en `/account`.
- [ ] `/account` tiene el título "Mi cuenta · Casa Nogal".
- [ ] "Mi cuenta" del sidebar y del `MobileBottomNav` lleva a `/account` y se marca activo solo en esa ruta.
- [ ] A 1440×900, `/account` y `mi-cuenta.dc.html` no muestran diferencias visibles en el contenido (textos, colores, tipografía, bordes, espaciado y orden).
- [ ] La tarjeta de perfil muestra avatar "C", "Caro Giménez", "caro@casanogal.pe" y "Cuidador/a", tomados de `mockSession`.
- [ ] Los toggles empiezan según `notify_on_post` y `daily_summary_enabled`, tienen `role="switch"` con `aria-checked` y nombre accesible, y alternan con clic y teclado (verde/derecha ↔ beige `#E4D6C4`/izquierda).
- [ ] Con `prefers-reduced-motion: reduce` el toggle cambia sin transición.
- [ ] "Editar", "Cambiar contraseña" y "Ayuda y soporte" son botones sin acción con foco visible.
- [ ] "Cerrar sesión" de la pantalla y el logout del sidebar llevan a `/login`.
- [ ] A 390×844 no hay scroll horizontal y los paddings coinciden con el feed.
- [ ] Solo `NotificationToggle` tiene `"use client"`.
- [ ] El tipo `User` no cambia; no hay cambios en `database-schema.md` ni migraciones.
- [ ] `specs/BACKLOG.md` tiene la entrada de la inconsistencia de notificaciones.
- [ ] El punto 2 de `references/documents/pantallas-pendientes.md` está marcado.
- [ ] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** copy del mockup staff para las notificaciones, con valor inicial desde `notify_on_post` y `daily_summary_enabled`. El mockup es la fuente de verdad de UI; la diferencia con la DB (comentarios vs. publicaciones, 17:00 vs. 19:00) se resuelve en la spec de Supabase (BACKLOG).
- **No:** copy de `familia-cuenta.dc.html` en la pantalla staff. Se aparta del mockup.
- **Sí:** toggles con estado local sin guardar y `role="switch"`. Estáticos parecerían rotos y no serían accesibles.
- **Sí:** apagado en `#E4D6C4` (paleta del mockup). El mockup solo muestra el encendido.
- **Sí:** "Editar", "Cambiar contraseña" y "Ayuda y soporte" como botones sin acción. Los modales son el punto 23; enlazar a `/` confundiría.
- **No:** botones deshabilitados. Cambian el aspecto del mockup.
- **Sí:** `email` como campo de `mockSession`, no en `User`. El esquema no duplica el email de `auth.users`.
- **Sí:** "Cerrar sesión" y el logout del sidebar como `<Link href="/login">`. Igual que el mockup; el cierre real llega con Supabase.
- **Sí:** ruta `/account`. Coincide con `NavKey = "account"` y con las rutas en inglés.
- **Sí:** feature `account/` (Screaming Architecture). `userRoleLabels` se queda en `users/`.
- **Sí:** misma pantalla para admin y staff. La del admin (punto 24) va en otra spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El usuario cree que los toggles guardan | Aceptado en mock; la persistencia llega con la spec de Supabase. |
| Copy de notificaciones que no corresponde a los campos de la DB | Entrada en BACKLOG; las etiquetas viven solo en `notification-preferences.ts`. |
| Botones sin acción que parecen rotos | Aceptado como en specs anteriores; se conectan con los modales del punto 23. |

---

## Lo que **no** entra en esta spec

- Persistencia de preferencias y logout real.
- Modales de editar perfil y cambiar contraseña.
- Ayuda y soporte.
- Mi cuenta del admin y del familiar.
- Avatar con foto.
- Protección de la ruta por rol.
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
