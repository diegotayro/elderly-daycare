# Backlog

Pendientes detectados durante la implementación que quedan fuera del alcance de la spec en curso. Revisar este archivo al diseñar cada spec nueva con `/spec` y quitar la entrada cuando se resuelva.

Formato de cada entrada:

- **Qué:** el problema o la tarea.
- **Origen:** spec y/o archivo donde se detectó.
- **Se resuelve en:** spec prevista.
- **Notas:** contexto para decidir.

---

## Aviso de `params` fuera de `<Suspense>` en `/elderly/[id]`

- **Qué:** en `npm run dev`, al abrir un perfil se ve `Route "/elderly/[id]": Next.js encountered URL data during prerendering or a navigation` porque `await props.params` se hace fuera de `<Suspense>`. Por eso la navegación no es instantánea.
- **Origen:** SPEC 02 (`02-elderly-list-and-profile-mock`), `app/(app)/elderly/[id]/page.tsx`.
- **Se resuelve en:** la spec de integración con Supabase.
- **Notas:**
  - Con datos mock no afecta al usuario: `generateStaticParams` prerrenderiza todos los ids y `npm run build` no falla.
  - Opciones: envolver el acceso en `<Suspense>` o `loading.tsx` con un esqueleto de carga, o declarar `export const instant = false` (ruta bloqueante).
  - Con streaming, un id inexistente pasaría de 404 a 200: definir cómo se manejan los ids que no existen.
  - Definir también la estrategia de caché (`use cache`) cuando los ids ya no se conozcan en el build.

---

## Pérdida de lo escrito en `/activate-account` durante el streaming

- **Qué:** la página lee `searchParams` dentro de `<Suspense>` y el fallback es el mismo formulario sin invitación. Si el usuario escribe antes de que termine el streaming, lo escrito se pierde al reemplazarse por el formulario real.
- **Origen:** SPEC 03 (`03-login-and-activate-account-ui`), `app/(auth)/activate-account/page.tsx`.
- **Se resuelve en:** la spec de integración con Supabase.
- **Notas:**
  - Con datos mock el streaming es inmediato, así que hoy no afecta al usuario. Riesgo aceptado en la spec.
  - Con consultas reales el tiempo de espera crece. Evaluar mostrar un esqueleto de carga en vez del formulario, o deshabilitar los campos hasta que llegue la invitación.

---

## Notificaciones de "Mi cuenta": copy del mockup distinto de los campos de la DB

- **Qué:** el mockup staff dice "Nuevos comentarios de familias" y "Recordatorio de resumen (17:00)", pero los campos de `users` son `notify_on_post` (nuevas publicaciones) y `daily_summary_enabled` (resumen a las 19:00).
- **Origen:** SPEC 08 (`08-account-screen-mock`), `account/notification-preferences.ts`.
- **Se resuelve en:** la spec de integración con Supabase.
- **Notas:**
  - La pantalla usa el copy del mockup con los valores iniciales de esos dos campos; las etiquetas viven solo en `notification-preferences.ts`.
  - Decidir si se cambia el copy del mockup o los campos/horario de la DB (17:00 vs. 19:00, comentarios vs. publicaciones).
  - Los toggles hoy solo tienen estado local: persistirlos con `update` de `users` en esa misma spec.

---

## Policies RLS de `daycares` pendientes

- **Qué:** `daycares` tiene RLS activado y ninguna policy, así que `anon` y `authenticated` no ven filas. Faltan el select de su propia guardería y el update del admin, con sus helpers `SECURITY DEFINER STABLE`.
- **Origen:** SPEC 09 (`09-daycares-table`), `supabase/migrations/20261108010057_create_daycares.sql`.
- **Se resuelve en:** la spec de `users`.
- **Notas:**
  - Dependen de `users` para saber a qué guardería pertenece el que llama.
  - El aviso `rls_enabled_no_policy` de `daycares` desaparece al crear las policies.

---

## Avisos del linter por `rls_auto_enable()` ejecutable por `anon` y `authenticated`

- **Qué:** `get_advisors` (security) marca `public.rls_auto_enable()` como `SECURITY DEFINER` ejecutable vía `/rest/v1/rpc/rls_auto_enable` por `anon` y `authenticated`.
- **Origen:** SPEC 09 (`09-daycares-table`); función preexistente del proyecto, usada por el event trigger `ensure_rls`.
- **Se resuelve en:** una spec de endurecimiento de seguridad (o la de `users`).
- **Notas:**
  - Riesgo bajo: devuelve `event_trigger`, y Postgres solo permite invocarla desde un event trigger; una llamada RPC directa falla.
  - Solución prevista: `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;` en una migración. Verificar antes que el event trigger sigue funcionando.
