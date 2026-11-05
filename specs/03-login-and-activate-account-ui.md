# SPEC 03 — Login y Activar cuenta: UI estática

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-05
> **Objetivo:** Implementar `/login` y `/activate-account` como réplica estática de `login.dc.html` (sin "INGRESO COMO") y `activar-cuenta.dc.html`, con la invitación precargada desde `?code=` usando los datos mock.

---

## Alcance

**Dentro:**

- Route group `app/(auth)/` con un `layout.tsx` propio: sin sidebar, fondo `#FBF4EC`.
- `/login`: panel coral izquierdo (logo, título, texto, "🌿 Guardería Casa Nogal") y formulario derecho ("Iniciar sesión", subtítulo, EMAIL, CONTRASEÑA, "¿Olvidaste tu contraseña?", botón, "¿Te invitó la guardería? Activa tu cuenta").
- Se elimina del login la sección "INGRESO COMO" con los botones "Personal" y "Familia".
- EMAIL del login vacío con placeholder `tu@correo.com`. CONTRASEÑA vacía con placeholder `••••••••`.
- `/activate-account`: ícono de sol, título, texto, tarjeta "Te invitaron a seguir a", CÓDIGO DE INVITACIÓN, EMAIL, CREAR CONTRASEÑA, consentimiento de fotos, botón "Activar mi cuenta" y "¿Ya tienes cuenta? Iniciar sesión".
- `?code=` válido → código y email de la invitación precargados (editables) y tarjeta con avatar, "{full_name} · Habitación {room}".
- Invitación válida = existe el código, `status = pending` y `expires_at` posterior a `referenceDate` del mock. El código se compara sin espacios y en mayúsculas.
- Sin `code` o con código no válido → sin tarjeta, código y email vacíos, sin mensaje de error.
- Checkbox de consentimiento nativo, marcado por defecto, que se puede desmarcar.
- Navegación con `<Link>`: botón "Iniciar sesión" → `/`; "Activar mi cuenta" → `/`; "¿Olvidaste tu contraseña?" → `/`; "Activa tu cuenta" → `/activate-account`; "Iniciar sesión" (en activar) → `/login`.
- Etiquetas como `<label htmlFor>` con el estilo del mockup. `autoComplete`: `email`, `current-password`, `one-time-code`, `new-password`.
- Foco visible en los inputs: borde `#F2A78E` (el del campo enfocado del mockup).
- Móvil: bajo `lg` el login oculta el panel coral y muestra el logo (sol + "Casa Nogal") sobre el formulario. Padding lateral 16px. Activar cuenta ya es de una columna.
- `metadata`: "Iniciar sesión · Casa Nogal" y "Activar cuenta · Casa Nogal".

**Fuera de alcance (para specs futuras):**

- Autenticación real, Server Actions, Supabase y `proxy.ts` (redirigir a `/login` si no hay sesión).
- Validación de campos y mensajes de error (email inválido, contraseña corta, código vencido).
- Aviso "este email ya tiene cuenta" de `flujos-de-procesos.md`.
- Pantalla de recuperar contraseña y `/crear-contrasena` del staff.
- Redirigir según el rol después del login (feed del personal vs feed de la familia).
- "Vincular adulto mayor" para un familiar que ya tiene cuenta.
- Ocultar el sidebar/rol en `(app)` según la sesión.
- Dark mode.

---

## Modelo de datos

No hay persistencia ni migraciones. Se reutiliza `mockElderly` (`elderly/mock-elderly.ts`) y `avatarTones` (`elderly/avatar-tones.ts`) de SPEC 02.

```ts
// auth/types.ts
export type InvitationPreview = {
  code: string;            // "7K4P9"
  email: string;           // "diego.fernandez@example.com"
  elderlyFullName: string; // "Luis Fernández"
  elderlyInitial: string;  // "L"
  elderlyTone: AvatarTone; // "blue"
  roomName: string;        // "Roble"
};
```

- `auth/find-invitation-preview.ts` → `findInvitationPreview(source: ElderlySource, code: string | undefined): InvitationPreview | null`. Función pura. Devuelve `null` si no hay código, no existe, no está `pending` o `expires_at <= referenceDate`.
- `mockElderly.invitations` suma dos invitaciones para Rosa Méndez: `EXP01` con `status = expired` y `CAN01` con `status = cancelled`. Los builders de SPEC 02 ya las ignoran, así que el listado y el perfil no cambian.

Tokens nuevos en `app/globals.css` (`@theme`):

```css
--color-auth-bg: #fbf4ec;
--color-field-line: #eadfd0;
--color-field-focus: #f2a78e;
--color-placeholder: #b6a99b;
--color-consent-bg: #fbf1d6;
--color-consent-ink: #8a7234;
--color-consent-check: #5fb97e;
```

---

## Estructura de archivos

```
app/
  (auth)/
    layout.tsx                 # fondo auth-bg, sin sidebar
    login/page.tsx             # metadata + LoginView
    activate-account/page.tsx  # metadata + shell estático + <Suspense> que lee searchParams
auth/
  types.ts
  find-invitation-preview.ts
  components/
    LoginView.tsx              # grid 2 columnas (lg) / 1 columna
    LoginHero.tsx              # panel coral con círculos decorativos
    LoginForm.tsx
    ActivateAccountView.tsx    # encabezado estático
    ActivateAccountForm.tsx    # recibe InvitationPreview | null
    InvitationCard.tsx         # reutiliza shared/components/Avatar
    PhotoConsentCheckbox.tsx   # checkbox nativo oculto + caja visual con peer-checked
    AuthField.tsx              # label + input con el estilo del mockup
    AuthSubmitLink.tsx         # botón degradado coral (Link)
    AuthBrandMark.tsx          # cuadro degradado con SunIcon
elderly/
  mock-elderly.ts              # + invitaciones EXP01 y CAN01
app/globals.css                # + tokens
```

Ningún archivo nuevo es Client Component.

---

## Plan de implementación

1. **Route group y tokens.** `app/(auth)/layout.tsx` y tokens en `globals.css`. Páginas `/login` y `/activate-account` con un título provisional. Prueba: ambas rutas cargan sin sidebar; `npm run build` compila.
2. **Componentes base.** `AuthField`, `AuthSubmitLink`, `AuthBrandMark` (reusa `SunIcon`). Prueba: `npm run lint`.
3. **Login.** `LoginHero`, `LoginForm`, `LoginView` y metadata. Prueba: a 1440×900 coincide con `login.dc.html` salvo la sección "INGRESO COMO".
4. **Datos de la invitación.** `auth/types.ts`, `find-invitation-preview.ts` e invitaciones `EXP01`/`CAN01` en el mock. Prueba: `npm run build`; `/elderly` y el perfil de Rosa no cambian.
5. **Activar cuenta.** `InvitationCard`, `PhotoConsentCheckbox`, `ActivateAccountForm`, `ActivateAccountView`. La página lee `searchParams` dentro de `<Suspense>`; el fallback es el formulario sin invitación. Prueba: `/activate-account?code=7K4P9` coincide con `activar-cuenta.dc.html` (con el email de Diego).
6. **Adaptación móvil.** Login sin panel coral y con logo bajo `lg`; padding 16px. Prueba: a 390×844 no hay scroll horizontal en ninguna de las dos.
7. **Capturas de verificación.** Con Playwright, ambos mockups y ambas rutas a 1440×900 y a 390×844, en `.playwright-mcp/`.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] La consola del navegador no muestra errores ni warnings de hidratación en `/login` y `/activate-account`.
- [ ] A 1440×900, `/login` y `login.dc.html` no muestran diferencias visibles, salvo que no existe "INGRESO COMO" ni los botones "Personal"/"Familia".
- [ ] A 1440×900, `/activate-account?code=7K4P9` y `activar-cuenta.dc.html` no muestran diferencias visibles, salvo el email precargado (`diego.fernandez@example.com`) y la contraseña vacía.
- [ ] `/login` y `/activate-account` no muestran el sidebar ni la barra inferior.
- [ ] El EMAIL del login está vacío y muestra el placeholder `tu@correo.com`.
- [ ] `/activate-account?code=7k4p9` (minúsculas) muestra la tarjeta de Luis Fernández · Habitación Roble.
- [ ] `/activate-account`, `?code=NOEXISTE`, `?code=EXP01` y `?code=CAN01` muestran el formulario sin tarjeta y con código y email vacíos.
- [ ] El checkbox de consentimiento aparece marcado y se puede desmarcar con clic y con teclado (Espacio).
- [ ] Cada label enfoca su input al hacer clic; los inputs muestran el borde `#F2A78E` al enfocarse.
- [ ] Los enlaces van a: "Iniciar sesión" → `/`, "Activar mi cuenta" → `/`, "¿Olvidaste tu contraseña?" → `/`, "Activa tu cuenta" → `/activate-account`, "Iniciar sesión" (activar) → `/login`.
- [ ] Los títulos de pestaña son "Iniciar sesión · Casa Nogal" y "Activar cuenta · Casa Nogal".
- [ ] `/elderly` y el perfil de Rosa Méndez siguen igual que al cierre de SPEC 02.
- [ ] Ningún archivo de `auth/` ni de `app/(auth)/` tiene `"use client"`.
- [ ] A 390×844 el login no muestra el panel coral, muestra el logo sobre el formulario y no hay scroll horizontal; activar cuenta tampoco tiene scroll horizontal.
- [ ] Las capturas de verificación están en `.playwright-mcp/`.

---

## Decisiones

- **Sí:** solo UI estática. Decisión del usuario; auth real y validación van con Supabase.
- **No:** Server Actions con validación mock. Se reescribirían al integrar Supabase.
- **Sí:** rutas en inglés `/login` y `/activate-account`, consistentes con `/elderly`.
- **Sí:** route group `(auth)`, como anticipó SPEC 02.
- **Sí:** quitar "INGRESO COMO". El rol lo define la cuenta, no el usuario al ingresar.
- **Sí:** el código de la invitación llega por `?code=` (enlace del correo). Permite mostrar la tarjeta antes de enviar.
- **Sí:** `searchParams` se lee dentro de `<Suspense>`. Con `cacheComponents`, leerlo fuera rompe el build; el shell estático se prerenderiza.
- **Sí:** código inválido → sin tarjeta y sin mensaje. Sin validación en esta spec; el error real llega con la Server Action.
- **No:** aviso "invitación no válida". El mockup no lo define.
- **Sí:** se precargan código y email; nombre y relación nunca vienen del formulario (los toma el servidor de la invitación, según `flujos-de-procesos.md`).
- **Sí:** consentimiento marcado por defecto, como el mockup. Decisión del usuario.
- **Sí:** checkbox nativo con estilo vía `peer-checked`. Accesible y sin Client Component.
- **Supuesto (el mockup no lo define):** estado desmarcado = caja blanca con borde `#EADFD0`, mismo tamaño y radio.
- **Sí:** foco de inputs con borde `#F2A78E`. Es el estilo del campo enfocado en `activar-cuenta.dc.html`; el mockup quita el `outline`.
- **Sí:** email del login vacío con placeholder. El email de demo dependía del selector de rol eliminado.
- **Sí:** en móvil se oculta el panel coral y se muestra el logo. Decisión del usuario.
- **Sí:** invitaciones `EXP01` y `CAN01` en el mock con `status` `expired`/`cancelled`. Permiten probar los inválidos sin cambiar el conteo de familiares de SPEC 02.
- **No:** invitación `pending` con fecha vencida en el mock. El builder de SPEC 02 la contaría como familiar y cambiaría el listado.
- **Sí:** enlaces a pantallas inexistentes → `/`. Consistente con SPEC 01 y 02.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Si se escribe en el fallback antes de que termine el streaming, se pierde lo escrito | El fallback es el mismo formulario y el streaming es inmediato con mock; aceptado hasta la spec de Supabase. |
| `next/font` no coincide exactamente con Google Fonts del mockup | Mismo criterio que SPEC 01/02; se verifica con las capturas. |
| El login y activar cuenta pasan a ser accesibles sin protección | Aceptado: no hay sesión todavía; `proxy.ts` va con Supabase. |

---

## Lo que **no** entra en esta spec

- Auth real, Server Actions, Supabase, `proxy.ts`.
- Validación y mensajes de error.
- Recuperar contraseña y crear contraseña del staff.
- Redirección por rol y "Vincular adulto mayor".
- Dark mode.

Cada una de esas, si llega, va en su propia spec.
