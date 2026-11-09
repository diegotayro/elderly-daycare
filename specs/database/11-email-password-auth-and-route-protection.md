# SPEC 11 — Autenticación con email y contraseña, y protección de rutas

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 08, SPEC 10
> **Fecha:** 2026-11-08
> **Objetivo:** Implementar login y logout reales con email y contraseña contra Supabase, y proteger las rutas de la app según la sesión, el `status` y el `role` del usuario.

---

## Alcance

**Dentro:**

- Login real en `/login` con `signInWithPassword` dentro de una Server Action.
- Logout real desde el `Sidebar` y desde `/account`, con una Server Action.
- Protección en dos capas:
  - `proxy.ts` hace el chequeo optimista de sesión con `getClaims()`, sin consultar tablas.
  - `requireTeamUser()` y `requireRelativeUser()` consultan `users` y se llaman en cada página protegida.
- Rutas públicas: `/login` y `/activate-account`. Cualquier otra ruta sin sesión redirige a `/login`.
- Con sesión, `/login` redirige a `/`.
- Destino después del login:
  - `admin` y `staff` → `/`.
  - `relative` → `/family-pending`.
- Cuentas no activas (`pending` o `archived`): se cierra la sesión y `/login` muestra un aviso de cuenta no activa.
- Route Handler `GET /auth/end-session`, que cierra la sesión de una cuenta no activa y evita el bucle entre `/` y `/login`.
- Pantalla temporal `/family-pending` con aviso y botón "Cerrar sesión", sin sidebar.
- Mensaje provisional en `/login`: una línea de texto simple con `role="alert"`, sin diseño final.
- Datos reales del usuario en el `Sidebar`, `MobileTopBar` y `/account`: nombre, email, rol, guardería y valores iniciales de los toggles.
- Estado de carga de `(app)`: estructura del sidebar y de la barra móvil sin datos, y contenido vacío sobre el fondo crema.
- Cuatro entradas nuevas en `specs/BACKLOG.md` (ver paso 8 del plan).

**Fuera de alcance (para specs futuras):**

- Activación real de `/activate-account`, invitaciones de familiares y cliente `service_role`.
- `/crear-contrasena` y activación del staff.
- Recuperar y cambiar contraseña. "¿Olvidaste tu contraseña?" sigue apuntando a `/`, que sin sesión termina en `/login`.
- Estados definitivos de error y carga del login: diseño del mensaje, validación por campo y botón "Ingresando…".
- Esqueleto de carga definitivo de `(app)`.
- Volver a la ruta pedida después del login (`?next=`).
- Rutas y pantallas para familiares. En esa spec se elimina `/family-pending` y se reescribe la redirección del familiar hacia su feed.
- Feed, adultos mayores y avisos con datos reales: siguen en mock porque sus tablas no existen.
- Persistir los toggles de notificaciones y resolver su inconsistencia de copy.
- Restringir por rol dentro de `(app)` (por ejemplo, acciones solo de admin).
- Pruebas reales con cuentas `staff`, `pending`, `archived` y `relative` (ver "Casos sin verificar").
- Dark mode.

---

## Modelo de datos

No hay tablas, migraciones ni cambios en `references/documents/`. Se reutilizan `users` y `daycares` de SPEC 09 y SPEC 10, con sus policies actuales.

- `users_select_own` solo devuelve la fila si el usuario está `active`. Por eso, **sin fila significa no activo**, y la app no puede distinguir `pending` de `archived` sin `service_role`.
- El email viene de los claims de la sesión, porque `users` no lo duplica.

```ts
// auth/types.ts
export type CurrentUser = Pick<
  User,
  "id" | "role" | "full_name" | "notify_on_post" | "daily_summary_enabled"
> & {
  email: string;
  daycareName: string;
};

export type LoginErrorCode =
  | "invalid_credentials"
  | "inactive_account"
  | "unexpected";
```

```ts
// auth/login-error-messages.ts
export const loginErrorMessages: Record<LoginErrorCode, string> = {
  invalid_credentials: "El email o la contraseña no son correctos.",
  inactive_account: "Tu cuenta no está activa. Comunícate con la guardería.",
  unexpected: "No pudimos iniciar sesión. Inténtalo de nuevo.",
};
```

```ts
// auth/route-access.ts
const PUBLIC_ROUTES = ["/login", "/activate-account"];

// Devuelve la ruta destino, o null si la petición puede continuar.
export function resolveRouteRedirect(
  pathname: string,
  hasSession: boolean,
): string | null;
```

| Sesión | Ruta | Resultado |
| --- | --- | --- |
| No | `/login` o `/activate-account` | Continúa |
| No | Cualquier otra | Redirige a `/login` |
| Sí | `/login` | Redirige a `/` |
| Sí | Cualquier otra | Continúa |

| Resultado de `signInWithPassword` o de `users` | Código en `/login?error=` |
| --- | --- |
| Email o contraseña vacíos, sin llamar a Supabase | `invalid_credentials` |
| Error `invalid_credentials` | `invalid_credentials` |
| Error `user_banned` | `inactive_account` |
| Login correcto, sin fila en `users` | `inactive_account`, después de `signOut()` |
| Cualquier otro error | `unexpected` |

Un valor desconocido en `?error=` no muestra ningún mensaje. El texto siempre sale de `loginErrorMessages`, nunca de la URL.

Comportamiento de los guards (`auth/require-user.ts`):

| Estado en `users` | `requireTeamUser()` | `requireRelativeUser()` |
| --- | --- | --- |
| Sin sesión | `/login` | `/login` |
| Sesión sin fila | `/auth/end-session` | `/auth/end-session` |
| `admin` o `staff` | Devuelve `CurrentUser` | `/` |
| `relative` | `/family-pending` | Devuelve `CurrentUser` |

Si la consulta a `users` devuelve un error, la función lanza la excepción. Una falla temporal de la base de datos no debe cerrar la sesión de nadie.

---

## Estructura de archivos

```
proxy.ts                              # aplica resolveRouteRedirect y conserva las cookies
auth/
  types.ts                            # + CurrentUser, LoginErrorCode
  login-error-messages.ts             # nuevo
  route-access.ts                     # nuevo: decisión pura, sin Supabase
  get-current-user.ts                 # nuevo: server-only, cache(); getClaims + users + daycares
  require-user.ts                     # nuevo: server-only; requireTeamUser, requireRelativeUser
  actions/
    sign-in.ts                        # nuevo: "use server"
    sign-out.ts                       # nuevo: "use server"
  components/
    LoginForm.tsx                     # <form action={signIn}> con botón real
    LoginErrorMessage.tsx             # nuevo: lee searchParams
    LoginView.tsx                     # recibe y pasa searchParams
    AuthSubmitButton.tsx              # nuevo: mismo aspecto que AuthSubmitLink
    AuthSubmitLink.tsx                # comparte clases con AuthSubmitButton
    SignOutForm.tsx                   # nuevo: formulario con botón y className configurable
    FamilyPendingView.tsx             # nuevo y temporal
app/
  auth/end-session/route.ts           # nuevo: signOut y redirección
  (auth)/
    login/page.tsx                    # pasa searchParams
    family-pending/page.tsx           # nuevo y temporal
    family-pending/loading.tsx        # nuevo y temporal: fondo vacío
  (app)/
    layout.tsx                        # sidebar y barra móvil dentro de <Suspense>
    loading.tsx                       # nuevo: contenido vacío
    page.tsx                          # + requireTeamUser()
    elderly/page.tsx                  # + requireTeamUser()
    elderly/[id]/page.tsx             # + requireTeamUser()
    notices/page.tsx                  # + requireTeamUser()
    account/page.tsx                  # usa CurrentUser en vez de mockSession
shared/
  supabase/proxy.ts                   # updateSession devuelve { response, hasSession }
  session/mock-session.ts             # - email
  components/navigation/
    Sidebar.tsx                       # datos opcionales para el fallback; logout con SignOutForm
    MobileTopBar.tsx                  # daycareName opcional
    BrandLink.tsx                     # daycareName opcional
    CurrentUserSidebar.tsx            # nuevo: getCurrentUser + Sidebar
    CurrentUserMobileTopBar.tsx       # nuevo: getCurrentUser + MobileTopBar
account/components/AccountView.tsx    # "Cerrar sesión" con SignOutForm
specs/BACKLOG.md                      # + cuatro entradas
```

`LoginForm` y los archivos nuevos de `auth/` no llevan `"use client"`.

---

## Plan de implementación

1. **Decisión de rutas y mensajes.** Crear `auth/route-access.ts`, los tipos de `auth/types.ts` y `auth/login-error-messages.ts`. Prueba: `npm run build`; la app se comporta igual.
2. **Login.** Crear `AuthSubmitButton`, `LoginErrorMessage` y `actions/sign-in.ts`. Convertir `LoginForm` en un formulario.
   - `LoginErrorMessage` lee `searchParams` dentro de `<Suspense fallback={null}>`, para no reemplazar el formulario mientras se escribe.
   - Después del login se ejecuta `revalidatePath("/", "layout")` y se redirige según la tabla de destinos.
   - Prueba: credenciales incorrectas muestran el mensaje; la cuenta admin llega a `/`.
3. **Logout.** Crear `actions/sign-out.ts` y `SignOutForm`, y usarlos en `Sidebar` y `AccountView` sin cambiar su aspecto. Prueba: al cerrar sesión se llega a `/login` y desaparecen las cookies `sb-*`.
4. **Usuario actual.** Crear `auth/get-current-user.ts`, con `import "server-only"`, `cache()`, columnas explícitas y `maybeSingle()`. Prueba: `npm run build`.
5. **Datos reales en la interfaz.**
   - Crear `CurrentUserSidebar` y `CurrentUserMobileTopBar`, que no redirigen, y envolverlos en `<Suspense>` en el layout `(app)`. El fallback es `Sidebar` y `MobileTopBar` sin datos.
   - `/account` usa `getCurrentUser()`, y se quita `email` de `mockSession`.
   - Prueba: el sidebar y `/account` muestran los datos del admin; `npm run build` compila.
6. **Guards y página temporal.**
   - Crear `auth/require-user.ts`, `app/auth/end-session/route.ts`, `(app)/loading.tsx` y `/family-pending`.
   - Llamar a `requireTeamUser()` en las cinco páginas de `(app)` y a `requireRelativeUser()` en `/family-pending`.
   - Prueba: la cuenta admin navega por las cinco rutas, y abrir `/family-pending` la devuelve a `/`.
7. **Proxy.** `updateSession` devuelve `{ response, hasSession }`, y `proxy.ts` aplica `resolveRouteRedirect`. Cada redirección copia las cookies y los headers de `response`. Prueba: sin sesión, `/elderly` redirige a `/login`; con sesión, `/login` redirige a `/`.
8. **Backlog y capturas.** Agregar estas entradas a `specs/BACKLOG.md`:
   - Estados definitivos de error y carga del login.
   - Esqueleto de carga definitivo de `(app)`.
   - Pruebas pendientes con `staff`, `pending`, `archived` y `relative`.
   - Eliminar `/family-pending` y reescribir la redirección del familiar en la spec de sus pantallas.

   Actualizar también la entrada del aviso de `params` en `/elderly/[id]` con el resultado observado. Guardar las capturas en `.playwright-mcp/`.

---

## Criterios de aceptación

Se verifican con la cuenta admin existente y sin sesión. La contraseña no se escribe en el repositorio ni en esta spec. Si Playwright no puede usarla, la persona que verifica ejecuta el login a mano.

**General**

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [ ] La consola no muestra errores de hidratación en `/login`, `/` y `/account`.
- [x] No hay migraciones nuevas ni cambios en `references/documents/`.
- [x] Ningún archivo usa `signUp()` ni el cliente `service_role`.
- [x] `auth/get-current-user.ts` y `auth/require-user.ts` tienen `import "server-only"`.

**Login**

- [x] A 1440×900 y sin `?error=`, `/login` no muestra diferencias visibles respecto al cierre de SPEC 03.
- [ ] Con las credenciales del admin, el login termina en `/` y crea las cookies `sb-*`.
- [ ] Con una contraseña incorrecta, se vuelve a `/login` con el mensaje de `invalid_credentials` en un elemento `role="alert"`.
- [x] Con un email que no existe, el mensaje es idéntico al de contraseña incorrecta.
- [x] Enviar el formulario vacío muestra el mensaje de `invalid_credentials`.
- [x] `/login?error=<script>` no muestra ningún mensaje ni el valor recibido.

**Logout**

- [ ] "Cerrar sesión" en `/account` lleva a `/login`, sin cookies `sb-*`.
- [ ] El botón del `Sidebar` lleva a `/login`, sin cookies `sb-*`.
- [ ] Después de cerrar sesión, volver atrás en el navegador no muestra contenido protegido sin pasar antes por `/login`.

**Protección de rutas**

- [x] Sin sesión, `/`, `/elderly`, `/elderly/<id válido>`, `/notices`, `/account` y `/family-pending` redirigen a `/login`.
- [x] Sin sesión, `/login` y `/activate-account` cargan sin redirección.
- [ ] Con sesión de admin, `/login` redirige a `/`.
- [ ] Con sesión de admin, las cinco rutas de `(app)` cargan.
- [ ] Con sesión de admin, `/family-pending` redirige a `/`.
- [x] `resolveRouteRedirect` cumple las cuatro filas de su tabla, y su archivo no importa Supabase.

**Datos reales**

- [ ] El `Sidebar` muestra el nombre, el rol y la guardería de la cuenta admin, no "Caro Giménez".
- [ ] `MobileTopBar` muestra la guardería de la cuenta admin a 390×844.
- [ ] `/account` muestra el nombre, el email y el rol reales, con los toggles según los valores de `users`.

**Backlog**

- [x] `specs/BACKLOG.md` contiene las cuatro entradas nuevas y la actualización del aviso de `params`.
- [x] Las capturas de verificación están en `.playwright-mcp/`.

---

## Casos sin verificar

Se decidió probar solo con la cuenta admin de este equipo. Estos casos están implementados, pero **no quedan comprobados con cuentas reales** en esta spec, y por eso no son criterios de aceptación. Se registran en `specs/BACKLOG.md`.

| Cuenta | Comportamiento esperado |
| --- | --- |
| `staff` activa | Entra a `/` y navega por `(app)` |
| `staff` `pending` con contraseña | Se cierra la sesión y `/login` muestra `inactive_account` |
| Usuario `archived` (con ban) | El login devuelve `user_banned` y `/login` muestra `inactive_account` |
| Usuario archivado con sesión abierta | La siguiente página protegida pasa por `/auth/end-session` y termina en `/login` |
| `relative` activo | Entra a `/family-pending`, ve el aviso y puede cerrar sesión |
| `relative` que abre una ruta de `(app)` | Redirige a `/family-pending` |

---

## Pantalla temporal `/family-pending`

Esta pantalla no tiene mockup y existe solo hasta la spec de pantallas para familiares, donde se elimina junto con `requireRelativeUser()` y la redirección actual.

- Usa el layout `(auth)`, con `AuthBrandMark`, una tarjeta centrada y los tokens existentes.
- Título: "Acceso para familias".
- Texto: "Estamos preparando este espacio. Vuelve pronto para ver el día de tu familiar."
- Botón: "Cerrar sesión".
- `metadata`: "Acceso para familias · Casa Nogal".

---

## Decisiones

- **Sí:** solo login y logout. Las demás pantallas de auth necesitan `service_role`, invitaciones o correos.
- **Sí:** proxy más guards en cada página. La documentación de Next pide que el proxy haga solo chequeos optimistas y que la verificación segura esté cerca de los datos.
- **No:** consultar `users` en el proxy. Agrega latencia en cada petición, incluidos los prefetch.
- **No:** verificar solo en el layout. La documentación advierte que los layouts no se vuelven a renderizar al navegar.
- **Sí:** el layout usa `getCurrentUser()` solo para mostrar datos, y la redirección queda en las páginas.
- **Sí:** lista de rutas públicas y todo lo demás protegido. Una ruta nueva queda protegida por defecto.
- **Sí:** `getClaims()` en el proxy, como ya hace `shared/supabase/proxy.ts`. La fuente de verdad del acceso sigue siendo `users`, protegida con RLS.
- **Sí:** sin fila en `users` significa cuenta no activa, con el mismo aviso para `pending` y `archived`. Distinguirlos requeriría `service_role`.
- **Sí:** el rol sale de `users`, nunca de `user_metadata`, porque ese campo no es confiable para autorizar.
- **Sí:** mismo mensaje para email inexistente y contraseña incorrecta, para no revelar qué cuentas existen.
- **Sí:** `/auth/end-session` como Route Handler. Un Server Component no puede escribir cookies, y sin este paso se produciría un bucle entre `/` y `/login`.
- **Sí:** `GET` en `/auth/end-session`, porque lo alcanza un `redirect()`. Un enlace externo solo podría forzar un cierre de sesión, sin exponer datos.
- **Sí:** `signOut()` con su alcance por defecto. No hay un requisito de sesiones por dispositivo.
- **Sí:** mensaje provisional mediante `?error=` y sin `useActionState`. Mantiene el formulario como Server Component hasta definir su diseño.
- **No:** volver a la ruta pedida. Decisión del usuario: el destino depende solo del rol.
- **Sí:** `/family-pending` temporal para `relative`. La interfaz actual es de staff y admin.
- **No:** dejar entrar al familiar a `(app)`. Vería acciones que no le corresponden.
- **Sí:** con sesión, `/activate-account` sigue accesible. Es UI estática y no se pidió cambiarla.
- **Sí:** cuentas de prueba fuera de la spec. Decisión del usuario: solo se prueba con el admin, y lo demás queda registrado.
- **No:** agregar cuentas a `seed.sql`. Dejaría contraseñas de prueba en el repositorio.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una redirección del proxy pierde las cookies refrescadas y cierra la sesión | Toda redirección copia las cookies y los headers de `response`. |
| El comportamiento de otros roles queda sin comprobar | Tabla "Casos sin verificar" y entrada en `specs/BACKLOG.md`, antes de crear cuentas reales de esos roles. |
| Un usuario archivado conserva acceso a páginas ya abiertas hasta su siguiente navegación | Cada página protegida consulta `users`, y RLS oculta los datos reales. |
| `loading.tsx` hace que un id inexistente en `/elderly/[id]` responda 200 en vez de 404 | Se sigue mostrando `not-found`. Aceptado con datos mock; el resultado se anota en la entrada de `specs/BACKLOG.md`. |
| El contenido mock sigue mostrando nombres ficticios, aunque el sidebar sea real | Aceptado hasta tener tablas reales del feed y de adultos mayores. |
| El sidebar queda con datos antiguos al cambiar de cuenta | `revalidatePath("/", "layout")` en login y logout. |
| Los mensajes provisionales se confunden con el diseño final | Entrada en `specs/BACKLOG.md`. |

---

## Lo que **no** entra en esta spec

- Activación real de cuentas, invitaciones, `service_role` y `/crear-contrasena`.
- Recuperar y cambiar contraseña.
- Diseño definitivo de los estados de error y carga.
- Volver a la ruta pedida después del login.
- Pantallas para familiares.
- Datos reales del feed, adultos mayores y avisos.
- Pruebas con cuentas que no sean la del admin.

Cada una de esas, si llega, va en su propia spec.
