# SPEC 24 — Verificar invitar y activar familiares, incluido "vincular adulto mayor" con una cuenta existente

> **Estado:** Aprobado
> **Depende de:** SPEC 17, SPEC 18, SPEC 22, SPEC 25
> **Fecha:** 2026-11-18
> **Objetivo:** Verificar a mano, con datos reales en el remoto, los flujos de SPEC 17 (invitar familiar, activar como familiar nuevo y activar con una cuenta existente) hasta que el familiar vea a sus dos adultos mayores en `/family`, y cerrar SPEC 17 como `Implementado`.

---

## Por qué esta spec

SPEC 22 la planificó como "Verificar 'vincular adulto mayor' para un familiar que ya tiene cuenta": el flujo "Familiar que ya tiene cuenta" de `flujos-de-procesos.md` ya está implementado en SPEC 17 (`/activate-account` con "INGRESE SU CONTRASEÑA" y `accept_invitation`), pero nunca se probó con datos reales. SPEC 17 sigue en `Aprobado` con todos sus criterios sin marcar.

La parte C (cuenta existente) necesita un familiar con cuenta, que se crea con la parte B. Decisión del usuario: verificar la entrada completa del BACKLOG (partes A a E), no solo la C. Desde SPEC 18 y SPEC 25, `/family` lee datos reales, así que además se comprueba que el familiar vea a sus dos adultos mayores en la línea bajo su nombre en el sidebar y en el feed.

Resuelve del BACKLOG:

- "Verificación manual de invitar y activar familiares (SPEC 17, pasos 11 y 12)".

Resuelve de `pantallas-pendientes.md`:

- Punto 21 "Vincular adulto mayor": resuelto por SPEC 17 (no es una pantalla aparte, es el modo "INGRESE SU CONTRASEÑA" de `/activate-account`).
- Inconsistencia "Familiar que ya tiene cuenta": se elimina.

---

## Specs siguientes

Planificadas por el usuario; no van en `specs/BACKLOG.md`.

- **SPEC 26 — Confirmar la contraseña en "Activar cuenta":** agregar un segundo campo para repetir la contraseña en `/activate-account`, como el de `/create-password` (`passwordConfirmation`), para que el familiar no se equivoque al escribirla. Hoy el formulario y el mockup `activar-cuenta.dc.html` tienen un solo campo.
  - Supuesto por confirmar en esa spec: el campo solo aparece en el modo "CREAR CONTRASEÑA"; en "INGRESE SU CONTRASEÑA" la cuenta ya existe.

---

## Alcance

**Dentro:**

- Preparación con SQL de solo lectura (Claude): datos de prueba disponibles y valores iniciales.
- Criterios de base de datos y de código de SPEC 17 que no requieren navegador (Claude, con `execute_sql` en transacciones con `rollback` y revisando el código).
- Checklist manual (la ejecuta el usuario), partes A a E de "Checklist" más abajo, con lo desactualizado corregido (`/family-pending` → `/family`).
- Dos posts de prueba sin fotos, creados como admin desde "Nueva publicación": uno que etiqueta a Alberto y otro a Rosa.
- Comprobación en `/family` (línea bajo el nombre en el sidebar, chips de filtro y feed) después de cada activación.
- Limpieza de los datos de prueba (usuario, vínculos, invitaciones, posts y `photo_consent`) y comprobación con SQL de solo lectura (Claude).
- Correcciones menores en `auth/` (mensajes, modo de contraseña, estados del formulario) si la verificación las encuentra. Lo demás va al BACKLOG.
- Documentación: SPEC 17 (criterios y estado), `BACKLOG.md`, `pantallas-pendientes.md` y SPEC 22 ("Specs siguientes").

**Fuera de alcance (para specs futuras):**

- Migraciones, cambios en RLS o en funciones de la DB. Si un fallo los necesita, va al BACKLOG.
- Una pantalla "Vincular adulto mayor" separada para un familiar con sesión iniciada.
- Cancelar invitaciones de familiar e invitaciones vencidas (ya en el BACKLOG).
- "Mi cuenta" del familiar.
- Reacciones y comentarios del familiar de prueba.
- Automatizar la checklist (tests E2E).

---

## Modelo de datos

No introduce datos nuevos. Escribe datos de prueba en el remoto (`auth.users`, `users`, `guardian_elderly`, `invitations`, `posts`, `post_elderly`, `elderly.photo_consent`) y la parte E los borra.

---

## Checklist

Actualiza la de la entrada del BACKLOG. Capturas en `.playwright-mcp/`.

**Antes de empezar**

- `.env` con `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL=onboarding@resend.dev` y `APP_URL=http://localhost:3000`; `npm run dev` corriendo.
- Con `onboarding@resend.dev` solo se puede enviar al email de tu cuenta de Resend. Úsalo como `TU_EMAIL` en todo lo de abajo.
- La contraseña del admin debe tener 8 o más caracteres, con una letra y un número.
- `TU_EMAIL` ya es un familiar `active` vinculado solo a Alberto Díaz (parte B) y no tiene invitaciones `pending` (lo confirma el paso 1 del plan).

**A. Modal de invitación (como admin, en `/elderly/[id]` de Alberto Díaz)** — ya probada por el usuario con Alberto Díaz antes de esta spec; no se repite. Se deja como referencia.

1. Entra como staff: no debe verse "Vincular otro familiar/tutor". Como admin sí; en un adulto mayor archivado no.
2. Abre el modal: no debe verse el bloque CÓDIGO DE INVITACIÓN. Captura.
3. Envía con datos vacíos: errores bajo cada campo y foco en el primero.
4. Llena NOMBRES, APELLIDOS, `TU_EMAIL` (con mayúsculas y espacios) y parentesco, y envía.
   - Mientras envía: botón "Enviando…"; la X, Esc y los campos no responden.
   - Éxito: "Invitación enviada a {email}" (en minúsculas y sin espacios), código de 5 caracteres, "Vence en 7 días" y "Listo". Captura.
5. Llega el correo a `TU_EMAIL` con el asunto "Te invitaron a seguir a Alberto Díaz en Casa Nogal", el código y el botón a `http://localhost:3000/activate-account?code={código}`.
6. Cierra con "Listo": el perfil muestra la fila PENDIENTE y `/elderly` cuenta la invitación en Alberto. Captura.
7. Vuelve a invitar al mismo email para Alberto:
   - Al enviar no se envía: aviso de reemplazo bajo EMAIL y botón "Reemplazar invitación". Captura.
   - Edita EMAIL: el aviso desaparece y el botón vuelve a "Enviar invitación".
   - Vuelve a poner el email y pulsa "Reemplazar invitación": invitación nueva con otro código y correo nuevo. El perfil muestra una sola fila PENDIENTE. El código anterior ya no sirve en `/activate-account`.
8. Invita el email del admin: "Este email pertenece al personal.".
9. Falla del correo: pon una `RESEND_API_KEY` inválida, reinicia `npm run dev` e invita a otro email (`EMAIL_DEL_PASO_A9`). La invitación se guarda y el éxito muestra "No pudimos enviar el correo. Comparte este código con {nombres}.". Captura. Restaura la llave y reinicia.

**B. Activación como familiar nuevo (ventana privada, sin sesión)** — ya probada por el usuario con Alberto Díaz, salvo activar con el consentimiento de fotos desmarcado (B.3 y el `photo_consent = false` de B.4), que queda en el BACKLOG. No se repite.

1. Abre el link del último correo de A.7: tarjeta de Alberto, código y email precargados, etiqueta "CREAR CONTRASEÑA". Captura.
2. Prueba errores: contraseña `abcdefgh` y `12345678` (error de la regla), código inexistente ("El código no es válido o ya venció."), email distinto ("Este email no coincide con la invitación."). Los campos con error tienen `aria-invalid="true"` y `aria-describedby`. Captura con errores.
3. Desmarca el consentimiento de fotos y activa con una contraseña válida (ej. `Prueba123`).
   - Mientras activa: botón "Activando…" deshabilitado.
   - Resultado: sesión iniciada y redirección a `/family`.
4. En la base (SQL Editor): usuario `relative` `active`, fila en `guardian_elderly` con el parentesco elegido, invitación `accepted` con `accepted_at` y `elderly.photo_consent = false` en Alberto.

**B2. Posts de prueba (como admin, en otra ventana)**

1. Desde "Nueva publicación", sin fotos: un post `elderly` que etiqueta solo a Alberto y otro que etiqueta solo a Rosa Méndez, los dos con un texto que empiece por "Prueba SPEC 24" (ej. "Prueba SPEC 24 — Alberto" y "Prueba SPEC 24 — Rosa"). El texto se guarda en `body`; el post no tiene título.
2. Como el familiar, recarga `/family`: la línea bajo el nombre en el sidebar dice "{Parentesco} de Alberto" (el sidebar no lista adultos mayores; de navegación solo tiene "Feed"), no hay chips de filtro por adulto mayor (solo aparecen con más de uno) y el feed muestra el post de Alberto y no el de Rosa. Captura.

**C. Activación con cuenta existente**

1. Como admin, invita `TU_EMAIL` a Rosa Méndez.
2. Cierra sesión del familiar y abre el link del correo (ventana privada): etiqueta "INGRESE SU CONTRASEÑA". Captura.
3. Contraseña incorrecta: "La contraseña no es correcta." y no se crea el vínculo.
4. Contraseña correcta, con el consentimiento marcado:
   - Se inicia sesión y redirige a `/family`.
   - En la base: un solo usuario con `TU_EMAIL`, dos filas en `guardian_elderly`, la invitación de Rosa `accepted` y `photo_consent` de Rosa sin cambios.
   - En `/family`: la línea bajo el nombre en el sidebar dice "{Parentesco} de Alberto y Rosa" (o "Familiar de Alberto y Rosa" si los parentescos difieren); el feed muestra los dos posts de prueba y los chips filtran por cada uno. Captura.
5. Cierra sesión. Como admin, crea otra invitación de `TU_EMAIL` para un tercer adulto mayor activo. Abre `/activate-account` sin código, escribe el código a mano, `TU_EMAIL` y una contraseña válida cualquiera: debe mostrar "Este email ya tiene cuenta. Ingresa tu contraseña." y la etiqueta cambia a "INGRESE SU CONTRASEÑA". No completes la activación.
6. Reusa el código ya aceptado de Rosa: "El código no es válido o ya venció.".

**D. Login y otras comprobaciones**

- `/login` con contraseña `abc`: "El email o la contraseña no son correctos."; el admin sigue entrando con la suya.
- A 390×844 no hay scroll horizontal en el modal (formulario y éxito) ni en `/activate-account`. Captura.
- Consola de `/elderly/[id]` y `/activate-account` sin errores ni warnings de hidratación.
- Mientras carga `/activate-account?code=...`, el fallback muestra el formulario con los campos deshabilitados.

**E. Limpieza** — en el SQL Editor de Supabase, reemplazando `TU_EMAIL` y `CONSENTIMIENTO_INICIAL_DE_ALBERTO` (del paso 1 del plan):

```sql
update public.elderly set photo_consent = CONSENTIMIENTO_INICIAL_DE_ALBERTO
  where first_name = 'Alberto' and last_name = 'Díaz';

-- La cascada borra post_elderly, reacciones y comentarios
delete from public.posts where body like 'Prueba SPEC 24%';

delete from public.reactions
  where user_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.comments
  where author_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.guardian_elderly
  where relative_id in (select id from auth.users where email = 'TU_EMAIL');
delete from public.invitations where email = 'TU_EMAIL';
-- public.users se borra en cascada
delete from auth.users where email = 'TU_EMAIL';
```

---

## Estructura de archivos

```
specs/24-verify-relative-invitation-flows.md               # criterios marcados al verificar
specs/database/17-relative-invitation-and-activation.md    # criterios marcados, 2 criterios actualizados, estado Implementado
specs/database/22-feed-tables-and-visibility.md            # "Specs siguientes": SPEC 24 con su nombre final
specs/BACKLOG.md                                           # entrada resuelta (+ entradas nuevas si hay fallos)
references/documents/pantallas-pendientes.md               # punto 21 e inconsistencia
auth/**                                                    # solo si hay correcciones menores
```

---

## Plan de implementación

1. **Preparación (Claude).** `execute_sql` de solo lectura: Alberto Díaz y Rosa Méndez existen, están `active` y son de Casa Nogal; hay un tercer adulto mayor activo para C.5; `TU_EMAIL` es un solo usuario `relative` `active`, con un vínculo en `guardian_elderly` solo con Alberto y su invitación `accepted`, sin invitaciones `pending`; no hay posts cuyo `body` empiece por "Prueba SPEC 24". Anotar el `photo_consent` actual de Alberto y de Rosa (la parte B se activó con el consentimiento marcado, así que el de Alberto no cambió). Si algo falta, detenerse y preguntar.
2. **Criterios de DB y código de SPEC 17 (Claude).** Pedir permiso; `execute_sql` en transacciones con `rollback` para los criterios de "Base de datos" de SPEC 17. Revisar que `SUPABASE_SECRET_KEY` y `RESEND_API_KEY` solo se importan en archivos `server-only` y que `createAdminClient()` solo se usa en los archivos listados en `CLAUDE.md`. `get_advisors` (security). `npm run build` y `npm run lint`. Prueba: cada criterio con su resultado.
3. **Parte A.** Ya probada por el usuario con Alberto Díaz; no se repite.
4. **Parte B.** Ya probada por el usuario, salvo el consentimiento desmarcado (BACKLOG); no se repite.
5. **Parte B2 (usuario).** Claude corrige lo menor que aparezca en B2 a D y anota el resto en el BACKLOG.
6. **Parte C (usuario).**
7. **Parte D (usuario).**
8. **Parte E (usuario) y comprobación (Claude).** `execute_sql` de solo lectura: no quedan el usuario, sus vínculos, las invitaciones ni los posts de prueba; `photo_consent` de Alberto y Rosa vuelve al valor del paso 1.
9. **Si hubo correcciones.** `npm run build` y `npm run lint` sin errores, y repetir el punto de la checklist afectado.
10. **Documentación.** Aplicar "Cambios en documentos" y "Entradas de BACKLOG".

---

## Criterios de aceptación

**Preparación y DB**

- [x] El paso 1 confirma los datos de prueba y anota el `photo_consent` inicial de Alberto y Rosa (Alberto `true`, Rosa `true`).
- [x] Los criterios de "Base de datos" de SPEC 17 pasan con `execute_sql` en transacciones con `rollback`, sin dejar datos.

**Invitación (A)**

- [x] Los puntos A.1 a A.9 se cumplen (probados por el usuario con Alberto Díaz antes de esta spec).

**Familiar nuevo (B y B2)**

- [x] Los puntos B.1 a B.4 se cumplen y la activación termina en `/family` (probados por el usuario con Alberto Díaz), salvo activar con el consentimiento desmarcado.
- [x] La entrada "Activar con el consentimiento de fotos desmarcado" está en el BACKLOG.
- [x] Con un solo vínculo, la línea bajo el nombre en el sidebar de `/family` dice "{Parentesco} de Alberto", no hay chips de filtro y el feed muestra el post de Alberto y no el de Rosa.

**Cuenta existente (C)**

- [x] El link de la invitación de Rosa muestra "INGRESE SU CONTRASEÑA".
- [x] Con contraseña incorrecta aparece "La contraseña no es correcta." y no se crea el vínculo.
- [x] Con la contraseña correcta no se crea otro usuario, se crea el segundo vínculo, se inicia sesión en `/family` y `photo_consent` de Rosa no cambia.
- [x] La línea bajo el nombre en el sidebar de `/family` dice "{Parentesco} de Alberto y Rosa" (o "Familiar de …" si los parentescos difieren), el feed muestra los dos posts de prueba y los chips filtran por cada uno.
- [x] Con el código escrito a mano y modo "CREAR CONTRASEÑA", aparece "Este email ya tiene cuenta. Ingresa tu contraseña." y cambia la etiqueta.
- [x] Un código ya aceptado muestra "El código no es válido o ya venció.".

**Otras comprobaciones (D)**

- [x] Los puntos de D se cumplen (sin capturas; ver "Decisiones").

**Cierre**

- [x] Tras la limpieza no quedan el usuario de prueba, sus vínculos, las invitaciones ni los posts de prueba, y `photo_consent` de Alberto y Rosa tiene su valor inicial.
- [x] Las correcciones hechas están solo en `auth/`, con `npm run build` y `npm run lint` sin errores; lo que no se corrigió está en el BACKLOG. (no hubo fallos ni correcciones)
- [x] SPEC 17 tiene sus criterios marcados y estado `Implementado`.
- [x] `BACKLOG.md`, `pantallas-pendientes.md` y SPEC 22 actualizados según "Cambios en documentos".

---

## Cambios en documentos

1. **`specs/database/17-relative-invitation-and-activation.md`:**
   - Marcar los criterios comprobados en esta spec. "Desmarcar el consentimiento deja `photo_consent = false`; marcarlo no cambia el valor." queda sin marcar, con la nota "(parte con el consentimiento desmarcado pendiente; ver BACKLOG)".
   - "Activar como familiar nuevo … e inicia sesión en `/family-pending`" → "en `/family`" (SPEC 18 eliminó `/family-pending`).
   - "`createAdminClient()` solo se usa en `get-invitation-preview.ts` y `activate-account.ts`" → "solo se usa en los archivos listados en `CLAUDE.md`" (SPEC 21 y 23 agregaron los de `staff/actions/`).
   - Estado → `Implementado`, aunque ese criterio quede sin marcar (lo sigue la entrada del BACKLOG).
2. **`specs/database/22-feed-tables-and-visibility.md`**, "Specs siguientes": el título de SPEC 24 pasa a "Verificar invitar y activar familiares, incluido 'vincular adulto mayor' con una cuenta existente", con la nota "(cubre las partes A a E de la entrada del BACKLOG)".
3. **`references/documents/pantallas-pendientes.md`:**
   - Punto 21: `- [x]`, con "resuelto por SPEC 17: es el modo 'INGRESE SU CONTRASEÑA' de `/activate-account`".
   - Se elimina la inconsistencia "Familiar que ya tiene cuenta".

### Entradas de BACKLOG

- "Verificación manual de invitar y activar familiares (SPEC 17, pasos 11 y 12)" → `- [x] **Estado:** resuelto en SPEC 24`. Las **Notas** se reemplazan por "Checklist actualizada en SPEC 24".
- Nueva entrada "Activar con el consentimiento de fotos desmarcado" en "Autenticación y cuentas" (ya agregada al redactar esta spec).
- Una entrada por cada fallo que no se corrija en esta spec, en su sección, con origen SPEC 24.

---

## Decisiones

- **Sí:** cubrir las partes A a E, no solo la C. Decisión del usuario; la C necesita un familiar creado con la B y así SPEC 17 queda verificada completa.
- **Sí:** la parte A no se repite y se usa Alberto Díaz en vez de Luis Fernández. Decisión del usuario; ya la probó con Alberto y su invitación `pending` es la que activa la parte B.
- **Sí:** la parte B no se repite y el consentimiento desmarcado va al BACKLOG. Decisión del usuario; la B se activó con el consentimiento marcado. La regla en la DB (`accept_invitation` con `p_photo_consent = false`) sí se prueba en el paso 2.
- **Sí:** la checklist la ejecuta el usuario a mano. Decisión del usuario; envía correos reales y escribe en el remoto.
- **Sí:** Claude hace la preparación, los criterios de DB y código de SPEC 17 y la comprobación de la limpieza, con SQL de solo lectura o en transacciones con `rollback`. Sin eso SPEC 17 no puede pasar a `Implementado`.
- **Sí:** comprobar la línea bajo el nombre en el sidebar, los chips y el feed de `/family` con uno y con dos vínculos. Decisión del usuario; desde SPEC 18 y 25 son datos reales.
- **Sí:** posts de prueba creados como admin y borrados al final. Decisión del usuario.
- **Sí:** las partes B2 a D se verifican sin capturas. Decisión del usuario; no las considera necesarias.
- **Sí:** los posts de prueba se identifican por `body`, no por `title`. "Nueva publicación" los guardó sin título (detectado en B2).
- **Sí:** posts de prueba sin fotos. Borrar archivos de `storage.objects` con SQL no es posible en Supabase; sin fotos la limpieza es solo SQL.
- **Sí:** corregir en esta rama solo lo menor de `auth/`; cambios de DB o de diseño van al BACKLOG. Decisión del usuario.
- **Sí:** al terminar, marcar los criterios de SPEC 17 y pasarla a `Implementado`. Decisión del usuario.
- **Sí:** la limpieza no incluye la invitación de A.9. Decisión del usuario; ya la había borrado antes de esta spec (el paso 1 no la encontró).
- **Sí:** guardar `photo_consent` inicial en el paso 1 en vez de asumir `true` al limpiar.
- **Sí:** spec en `specs/`, no en `specs/database/`. Decisión del usuario; no crea tablas, migraciones ni RLS.
- **No:** pantalla "Vincular adulto mayor" para un familiar con sesión. El flujo actual lo cubre `/activate-account`; si se quiere, va en su propia spec.
- **No:** completar la activación en C.5. Ya se probó en C.4; la invitación queda `pending` y la borra la limpieza.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Escribe en el remoto y envía correos reales | Los datos de prueba se identifican por `TU_EMAIL` y el texto "Prueba SPEC 24" al inicio de `body`; la parte E los borra y Claude lo comprueba. |
| La limpieza falla por `on delete restrict` (reacciones o comentarios del familiar de prueba) | La SQL de E borra reacciones y comentarios antes de `auth.users`. |
| La limpieza deja a Alberto con un `photo_consent` distinto al original | Se anota el valor inicial en el paso 1 y se comprueba en el paso 8. |
| El límite de Resend (solo `TU_EMAIL`) impide probar con otro correo | A.9 usa la llave inválida, así que ese correo no se envía. |
| Un fallo grande deja SPEC 17 sin poder pasar a `Implementado` | El fallo va al BACKLOG; se detiene la spec y se pregunta si SPEC 17 queda `Aprobado`. |

---

## Lo que **no** entra en esta spec

- Migraciones o cambios de RLS y funciones.
- Pantalla "Vincular adulto mayor" para un familiar con sesión.
- Cancelar invitaciones de familiar e invitaciones vencidas.
- "Mi cuenta" del familiar.
- Confirmar la contraseña en "Activar cuenta" (SPEC 26).
- Tests E2E.

Cada una de esas, si llega, va en su propia spec.
