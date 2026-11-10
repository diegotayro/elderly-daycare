# SPEC 16 — Perfil `/elderly/[id]` con datos reales y archivados visibles para el admin

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 05, SPEC 13, SPEC 15
> **Fecha:** 2026-11-10
> **Objetivo:** Alimentar `/elderly/[id]` con el adulto mayor real, su habitación y sus familiares de `guardian_elderly`, llevar `/elderly` y el perfil a streaming en `<Suspense>`, y mostrar al admin los archivados en el listado y en el perfil.

---

## Alcance

**Dentro:**

- `/elderly/[id]` lee de Supabase con el cliente de `shared/supabase/server.ts`:
  - El adulto mayor por `id`, su habitación y sus vínculos de `guardian_elderly` con los `users` (`role = 'relative'`) visibles por RLS.
  - Sin invitaciones: la tabla `invitations` no existe, así que no hay filas PENDIENTE.
  - Edad con la fecha real de Lima y colores de avatar con `getAvatarTone(id)` (adulto mayor y familiares).
  - Título de la pestaña: `{full_name} · Casa Nogal`.
- Streaming del perfil: el acceso a `params` y la consulta van dentro de `<Suspense>` con un esqueleto del perfil.
- Streaming de `/elderly`: `requireTeamUser()` y `getElderlySource()` van dentro de `<Suspense>` con un esqueleto del listado. Resuelve el aviso `encountered uncached data during prerendering or a navigation`.
- Ids que no se pueden mostrar → `not-found` actual:
  - Formato distinto de UUID: sin consultar la DB.
  - Inexistente o no visible por RLS (otra guardería, staff no asignado).
  - Archivado, si quien lo abre no es admin.
  - Se acepta que responda con status 200 + `noindex` (ver "Decisiones").
- Alerta "Alergias y notas": muestra las alergias (`allergy_tags`) y la nota médica. Aparece si hay alguna de las dos.
- "FAMILIARES VINCULADOS":
  - Una fila por vínculo real, con el formato actual ("Hija · activa", badge ACTIVA).
  - Sin vínculos: el texto "Todavía no hay familiares vinculados." sobre el botón.
  - El botón "Vincular otro familiar/tutor" queda como está: abre el modal de SPEC 05, valida y no guarda.
- Perfil archivado (solo admin): badge gris "ARCHIVADO" junto al subtítulo.
- `/elderly`:
  - Las tarjetas vuelven a enlazar al perfil con el hover original.
  - "N familiares vinculados" y el indicador usan los vínculos reales de `guardian_elderly`.
  - El admin ve una sección "ARCHIVADOS" al final, con tarjetas atenuadas y el indicador "ARCHIVADO". El staff nunca la ve.
  - El conteo de "ACTIVOS" sigue contando solo activos; "ARCHIVADOS" muestra su propio conteo.
  - El buscador filtra ambas secciones.
- Verificación con datos temporales en el remoto, **pidiendo permiso antes de crearlos y borrándolos al terminar**.
- Actualizar `specs/BACKLOG.md`.

**Fuera de alcance (para specs futuras):**

- Hacer funcionar "Vincular otro familiar/tutor" (guardar la invitación).
- Tabla `invitations` y filas PENDIENTE en el perfil y en los conteos.
- Reactivar o archivar un adulto mayor desde la UI.
- Botones "Editar" y "Resumen del día" del perfil: siguen enlazando a `/`.
- Esqueleto definitivo de `(app)` (`(app)/loading.tsx` sigue en `null`) y el streaming de `/activate-account`, `/` y `/notices`.
- Status 404 real para ids inexistentes (chequeo en `proxy.ts`).
- `error.tsx` con diseño propio.
- Familiares `archived`: se muestran como cualquier vínculo (ver "Riesgos").
- Reemplazar el mock en `app/(app)/layout.tsx` y `/activate-account`. `elderly/mock-elderly.ts` se conserva.
- Cambios en la DB: no hay migraciones.

---

## Modelo de datos

Esta spec no crea tablas ni migraciones. Reusa `elderly`, `rooms`, `guardian_elderly` y `users` con las policies de SPEC 13 y SPEC 15.

### Lectura de familiares (compartida)

```ts
// elderly/fetch-relative-links.ts (server-only)
export async function fetchRelativeLinks(
  supabase: SupabaseClient,
  elderlyIds?: string[], // sin ids = todos los visibles por RLS
): Promise<{ guardianElderly: GuardianElderly[]; relatives: User[] }>;
```

- Consulta `guardian_elderly` (filtrada por `elderly_id` si se pasan ids) y luego `users` con `role = 'relative'` e `id` en los `relative_id` obtenidos.
- Si una consulta falla, lanza el error.
- La usan `getElderlySource()` (listado) y `getElderlyProfileSource()` (perfil).

### Lectura del perfil

```ts
// elderly/get-elderly-profile-source.ts (server-only), envuelta en React cache
export const getElderlyProfileSource: (id: string) => Promise<ElderlySource | null>;
```

- `null` si el `id` no es UUID o si `elderly` no devuelve fila (`maybeSingle`).
- Hace `await io()` antes de leer la fecha, igual que `getElderlySource()`.
- Devuelve un `ElderlySource` con un solo adulto mayor, su habitación, `fetchRelativeLinks(supabase, [id])`, `invitations: []` y `avatarTones` del adulto mayor y de sus familiares.
- `React.cache` evita consultar dos veces entre `generateMetadata` y la página.

```ts
// shared/text/is-uuid.ts
export function isUuid(value: string): boolean;
```

### Tipos (`elderly/types.ts`)

```ts
export type ElderlyIndicator =
  | { kind: "allergy"; label: string }
  | { kind: "link" }
  | { kind: "none" }
  | { kind: "archived" }; // "ARCHIVADO", solo en la sección de archivados

export type ElderlyList = {
  active: ElderlyListItem[];
  archived: ElderlyListItem[]; // vacío si no es admin
};

export type ElderlyProfile = {
  // ...campos actuales
  allergyTags: string[]; // tal como están en la DB: ["Maní", "Lactosa"]
  isArchived: boolean;
};
```

- `buildElderlyList(source, { includeArchived })` devuelve `ElderlyList`. `includeArchived` es `user.role === "admin"`.
- Una tarjeta archivada siempre muestra el indicador `archived`, aunque tenga alergias.

### Texto de la alerta

```ts
// elderly/elderly-formatters.ts
export function formatAllergies(tags: string[]): string | null;
// []                  → null
// ["Maní"]            → "Alergia: Maní."
// ["Maní", "Lactosa"] → "Alergias: Maní, Lactosa."
```

La alerta muestra ese texto y la nota médica en el mismo párrafo, separados por un espacio.

### Página

```tsx
// app/(app)/elderly/[id]/page.tsx — no es async y no espera params
<Suspense fallback={<ElderlyProfileSkeleton />}>
  <ElderlyProfileContent params={props.params} />
</Suspense>
```

- `ElderlyProfileContent` (Server Component async): `requireTeamUser()`, espera `params`, llama a `getElderlyProfileSource(id)`, decide `notFound()` y renderiza `ElderlyProfileView`.
- Se elimina `generateStaticParams` y el import de `mockElderly`.
- `generateMetadata` usa `getElderlyProfileSource(id)`; si es `null`, el título es `Adulto mayor · Casa Nogal`.

```tsx
// app/(app)/elderly/page.tsx — no es async; mantiene el metadata estático
<Suspense fallback={<ElderlyListSkeleton />}>
  <ElderlyListContent />
</Suspense>
```

- `ElderlyListContent` (Server Component async): `requireTeamUser()`, `getElderlySource()` y renderiza `ElderlyListView` con `canAddElderly` e `includeArchived` según el rol.
- `ElderlyListSkeleton` muestra el título real ("GESTIÓN" / "Adultos mayores") y bloques grises para el buscador, la barra "ACTIVOS" y 4 tarjetas. Sin botón "Agregar adulto mayor": depende del rol.
- Ambos esqueletos comparten un bloque base (`SkeletonBlock` en `shared/components/`) con `animate-pulse` y `motion-reduce:animate-none`.

### Datos temporales de verificación

Se crean en el remoto con `execute_sql`, con permiso, y se borran al terminar:

| Dato | Detalle |
| --- | --- |
| Relative "Lucía Fernández" | Insertado en `auth.users` con la metadata que espera `handle_new_auth_user()`; vínculo `daughter` con Luis Fernández (`...0201`). |
| Relative "Diego Fernández" | Ídem; vínculo `son` con Luis Fernández. |
| Staff temporal con contraseña | `active`, asignado en `staff_elderly` a Luis Fernández y a Rosa Méndez (`...0204`). |
| Rosa Méndez archivada | `status = 'archived'` durante la prueba; se restaura a `active`. |

Limpieza: borrar los 3 usuarios de `auth.users` (sus filas de `users`, `guardian_elderly` y `staff_elderly` se borran en cascada) y restaurar a Rosa. Al terminar, `guardian_elderly` y `staff_elderly` tienen 0 filas y los 5 del seed están `active`.

### Entradas de BACKLOG

- "Conectar `/elderly/[id]` a Supabase y restaurar el enlace de `ElderlyCard`" → `- [x] **Estado:** resuelto en SPEC 16`.
- "Aviso de `params` fuera de `<Suspense>` en `/elderly/[id]`" → `- [x] **Estado:** resuelto en SPEC 16`.
- "Aviso de consulta fuera de `<Suspense>` en `/elderly`" → `- [x] **Estado:** resuelto en SPEC 16`.
- Intro de "Carga y streaming de las rutas": anotar que `/elderly` y `/elderly/[id]` se resolvieron en SPEC 16 por decisión del usuario, y que su patrón (página sin `async`, `*Content` dentro de `<Suspense>`, esqueleto con `SkeletonBlock`) es la referencia para el resto.
- "Conteos reales de familiares en `/elderly`" → sigue `[ ]`; el **Qué** queda solo con las invitaciones pendientes.
- Nueva, sección "Adultos mayores": "Reactivar un adulto mayor archivado" (admin; desde el perfil o la sección de archivados; sin mockup).
- Nueva, sección "Adultos mayores": "Botones 'Editar' y 'Resumen del día' del perfil" (hoy enlazan a `/`).
- Nueva, sección "Adultos mayores": "Familiares `archived` en 'Familiares vinculados'" (hoy se muestran como activos).

---

## Estructura de archivos

```
app/(app)/elderly/[id]/page.tsx              # Suspense + metadata real; sin mock ni generateStaticParams
app/(app)/elderly/page.tsx                   # Suspense + ElderlyListContent
elderly/
  fetch-relative-links.ts                    # nuevo
  get-elderly-profile-source.ts              # nuevo
  get-elderly-source.ts                      # usa fetchRelativeLinks y tonos de familiares
  build-elderly-list.ts                      # devuelve { active, archived }
  build-elderly-profile.ts                   # + allergyTags, isArchived
  elderly-formatters.ts                      # + formatAllergies
  types.ts                                   # ElderlyIndicator, ElderlyList, ElderlyProfile
  components/
    ElderlyProfileContent.tsx                # nuevo (Server Component)
    ElderlyProfileSkeleton.tsx               # nuevo
    ElderlyProfileHeader.tsx                 # badge ARCHIVADO
    MedicalNotesAlert.tsx                    # alergias + notas
    LinkedRelativesCard.tsx                  # texto sin familiares
    ElderlyListContent.tsx                   # nuevo (Server Component)
    ElderlyListSkeleton.tsx                  # nuevo
    ElderlyListView.tsx                      # recibe ElderlyList
    ElderlySearchList.tsx                    # sección ARCHIVADOS
    ElderlyCard.tsx                          # <Link> + hover; variante atenuada
    ElderlyCardIndicator.tsx                 # indicador ARCHIVADO
shared/components/SkeletonBlock.tsx          # nuevo
shared/text/is-uuid.ts                       # nuevo
specs/BACKLOG.md                             # 8 cambios
```

---

## Plan de implementación

Antes del paso 5, cargar el skill `frontend-design:frontend-design` (CLAUDE.md). El mockup gana ante cualquier conflicto.

1. **Lectura de familiares.** `fetch-relative-links.ts` y su uso en `getElderlySource()`, con tonos de familiares. Prueba: como admin, `/elderly` sigue mostrando los 5 activos con "sin familiares vinculados".
2. **Lectura del perfil.** `is-uuid.ts` y `get-elderly-profile-source.ts`. Prueba: `npm run build`.
3. **Página con Suspense.** `ElderlyProfileContent`, esqueleto provisional `null` y `page.tsx` sin mock; reglas de `notFound()` y `generateMetadata`. Prueba: Luis Fernández se ve con datos reales; un id inexistente y `/elderly/abc` muestran el not-found.
4. **Builders y tipos.** `allergyTags`, `isArchived`, `formatAllergies` y `buildElderlyList` con `{ active, archived }`. Prueba: `npm run build`.
5. **Esqueleto del perfil.** `SkeletonBlock` y `ElderlyProfileSkeleton` con la forma del perfil. Prueba: se ve al recargar el perfil con red lenta.
6. **Perfil.** Alerta con alergias + notas, texto sin familiares y badge ARCHIVADO. Prueba: Luis muestra "Alergia: Maní." y su nota.
7. **Listado.** Enlace y hover en `ElderlyCard`, variante atenuada, indicador ARCHIVADO y sección ARCHIVADOS en `ElderlySearchList`. Prueba: las tarjetas navegan al perfil.
8. **Streaming de `/elderly`.** `ElderlyListContent`, `ElderlyListSkeleton` y `page.tsx` sin `async`. Prueba: en `npm run dev` ya no aparece el aviso de datos fuera de `<Suspense>` en `/elderly`.
9. **Datos temporales.** Pedir permiso; crear los datos de la tabla de verificación con `execute_sql`. Prueba: `guardian_elderly` tiene 2 filas y `staff_elderly` 2.
10. **Verificación con datos.** Revisar los criterios como admin y como staff temporal; capturas con Playwright en `.playwright-mcp/`.
11. **Limpieza.** Pedir permiso; borrar los usuarios temporales y restaurar a Rosa. Prueba: 0 filas en `guardian_elderly` y `staff_elderly`, 5 adultos mayores `active`.
12. **Documentación.** Aplicar los cambios en `BACKLOG.md`.

---

## Criterios de aceptación

**Perfil con datos reales (admin)**

- [ ] `/elderly/00000000-0000-0000-0000-000000000201` muestra a Luis Fernández con su edad según la fecha de Lima, "Habitación Roble", fecha de nacimiento "12 mar 1947" e ingreso "feb 2025".
- [ ] El avatar de Luis tiene el mismo color en el listado y en el perfil.
- [ ] La pestaña dice "Luis Fernández · Casa Nogal".
- [ ] La alerta de Luis dice "Alergia: Maní." seguido de su nota médica.
- [ ] Un adulto mayor con dos alergias muestra "Alergias: X, Y." (se prueba con `formatAllergies`).
- [ ] Un adulto mayor sin alergias ni nota médica no muestra la alerta; con solo una de las dos, la muestra con esa.
- [ ] Sin vínculos, "FAMILIARES VINCULADOS" muestra "Todavía no hay familiares vinculados." y el botón.
- [ ] Con los datos temporales, Luis muestra a Lucía Fernández ("Hija · activa", ACTIVA) y a Diego Fernández ("Hijo · activo", ACTIVO), sin filas PENDIENTE.
- [ ] "Vincular otro familiar/tutor" abre el modal, valida y no crea filas en ninguna tabla.
- [ ] "Editar" y "Resumen del día" siguen enlazando a `/`.

**Ids no mostrables**

- [ ] `/elderly/abc` muestra el not-found y no hace ninguna consulta a `elderly`.
- [ ] Un UUID inexistente muestra el not-found.
- [ ] Como staff temporal, el perfil de un adulto mayor no asignado muestra el not-found.
- [ ] Como staff temporal, el perfil de Rosa archivada muestra el not-found.
- [ ] Como admin, el perfil de Rosa archivada se ve con el badge "ARCHIVADO" junto al subtítulo.
- [ ] Un adulto mayor activo no muestra el badge.

**Streaming**

- [ ] `page.tsx` no espera `params` fuera de `<Suspense>` y no tiene `generateStaticParams`.
- [ ] En `npm run dev`, abrir un perfil no muestra el aviso `encountered URL data during prerendering` ni otro aviso de datos fuera de `<Suspense>` para `/elderly/[id]`.
- [ ] Mientras carga se ve `ElderlyProfileSkeleton`; con `prefers-reduced-motion` no se anima.
- [ ] `app/(app)/elderly/page.tsx` no es `async` y no llama a `requireTeamUser()` ni a `getElderlySource()` fuera de `<Suspense>`.
- [ ] En `npm run dev`, abrir `/elderly` no muestra el aviso `encountered uncached data during prerendering or a navigation` ni otro aviso de datos fuera de `<Suspense>`.
- [ ] Mientras carga `/elderly` se ve `ElderlyListSkeleton` con el título "Adultos mayores"; con `prefers-reduced-motion` no se anima.
- [ ] Sin sesión, `/elderly` y `/elderly/[id]` siguen redirigiendo a `/login`.
- [ ] La pestaña de `/elderly` sigue diciendo "Adultos mayores · Casa Nogal".

**Listado `/elderly`**

- [ ] Las tarjetas son enlaces al perfil y tienen el hover `hover:-translate-y-0.5 hover:border-[#F2A78E]`.
- [ ] Con los datos temporales, la tarjeta de Luis dice "2 familiares vinculados" y muestra MANÍ.
- [ ] Como admin, con Rosa archivada: "ACTIVOS" dice "4 adultos mayores" y "ARCHIVADOS" muestra a Rosa atenuada con el indicador ARCHIVADO.
- [ ] La tarjeta archivada enlaza a su perfil.
- [ ] Buscar "mendez" muestra a Rosa en "ARCHIVADOS" y "ACTIVOS" dice "0 adultos mayores".
- [ ] Sin archivados, la sección "ARCHIVADOS" no aparece.
- [ ] Como staff temporal, `/elderly` muestra solo a Luis y no hay sección "ARCHIVADOS".

**Cierre**

- [ ] Tras la limpieza, `guardian_elderly` y `staff_elderly` tienen 0 filas, no quedan los usuarios temporales en `auth.users` ni en `users`, y los 5 del seed están `active`.
- [ ] El HTML de `/elderly` no contiene notas médicas.
- [ ] `app/(app)/layout.tsx` y `/activate-account` siguen funcionando con el mock.
- [ ] `BACKLOG.md` tiene los 8 cambios de esta spec.
- [ ] `npm run build` y `npm run lint` terminan sin errores, y la consola del perfil no muestra errores ni warnings de hidratación.
- [ ] A 390×844 no hay scroll horizontal en el perfil ni en `/elderly`.
- [ ] Capturas en `.playwright-mcp/`: perfil de Luis con familiares (1440×900 y 390×844), perfil archivado, `/elderly` con la sección de archivados y ambos esqueletos.

---

## Decisiones

- **Sí:** el botón de vincular queda como está (modal de SPEC 05 sin guardar). Decisión del usuario; se hace funcionar en otra spec.
- **Sí:** familiares de `guardian_elderly`, sin pendientes. Decisión del usuario; `invitations` aún no existe.
- **Sí:** texto "Todavía no hay familiares vinculados." sobre el botón. Decisión del usuario; el mockup no cubre el estado vacío.
- **Sí:** alergias y nota médica en la alerta, como en el mockup. Decisión del usuario.
- **Sí:** texto "Alergia: X." / "Alergias: X, Y." en el mismo párrafo que la nota. Supuesto de esta spec: las alergias se guardan como etiquetas y el mockup muestra texto libre; es la forma más corta de mostrarlas.
- **Sí:** el admin ve archivados en el listado y en el perfil. Decisión del usuario: necesita encontrarlos para reactivarlos más adelante.
- **No:** reactivar en esta spec. Requiere Server Action y UI sin mockup; queda en BACKLOG.
- **Sí:** sección "ARCHIVADOS" al final, atenuada, y el conteo de "ACTIVOS" solo con activos. Decisión del usuario.
- **Sí:** el indicador ARCHIVADO reemplaza a la alergia en la tarjeta. Supuesto de esta spec: una tarjeta tiene un solo indicador y el estado es lo más relevante.
- **Sí:** staff recibe not-found en un archivado, aunque RLS se lo deje leer. Decisión del usuario; el filtro va en la app.
- **No:** cambiar `elderly_select_linked` para ocultar archivados al staff. La policy de SPEC 15 se mantiene; el feed los necesitará.
- **Sí:** badge "ARCHIVADO" gris junto al subtítulo. Decisión del usuario; mismo estilo que los badges de familiares.
- **Sí:** resolver aquí los avisos de `/elderly/[id]` y `/elderly` con `<Suspense>`. Decisión del usuario; cambia lo decidido el 2026-11-09 para estas dos rutas. El esqueleto de `(app)` y las demás rutas siguen en la spec de carga.
- **Sí:** `requireTeamUser()` dentro de `<Suspense>` en ambas rutas. La página entera depende del rol (botón "Agregar", archivados), así que no hay contenido útil fuera del límite salvo el título.
- **Sí:** el esqueleto del listado muestra el título real y no el botón "Agregar adulto mayor". Supuesto de esta spec: el título no depende de datos; el botón sí depende del rol.
- **Sí:** `SkeletonBlock` compartido entre ambos esqueletos (DRY), en `shared/components/` porque lo reusarán otras rutas.
- **Sí:** esqueleto propio del perfil. Decisión del usuario; el mockup no lo cubre.
- **Sí:** aceptar status 200 + `noindex` para ids inexistentes. Decisión del usuario; app autenticada y el usuario ve el mismo not-found.
- **No:** chequeo en `proxy.ts` para un 404 real. Consulta la DB dos veces y agrega complejidad.
- **Sí:** validar el formato UUID antes de consultar. Evita un error de Postgres (`22P02`) que mostraría el error genérico en vez del not-found.
- **Sí:** restaurar el enlace de las tarjetas. Decisión del usuario; resuelve la entrada de BACKLOG.
- **Sí:** conteos reales de familiares en el listado. Decisión del usuario; misma fuente que el perfil.
- **Sí:** `fetchRelativeLinks` compartida entre listado y perfil. Una sola forma de leer vínculos (DRY).
- **Sí:** reusar `ElderlySource` y `buildElderlyProfile` con un solo adulto mayor. Evita un builder nuevo.
- **Sí:** `React.cache` en `getElderlyProfileSource`. `generateMetadata` y la página leen lo mismo sin consultar dos veces.
- **Sí:** datos temporales en el remoto y borrarlos al terminar. Decisión del usuario; sin ellos los familiares no se prueban en pantalla.
- **Sí:** spec en `specs/` y no en `specs/database/`. No hay migraciones ni cambios de esquema.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los datos temporales quedan en el remoto si la verificación se corta | Paso de limpieza explícito y criterio de cierre que exige 0 filas y los 5 `active`. |
| Crear una cuenta staff con contraseña en `auth.users` por SQL falla o deja datos inconsistentes | Se pide permiso; si falla, detenerse y preguntar antes de probar los criterios de staff de otra forma. |
| Las notas médicas llegan al cliente de `/elderly` | Solo el perfil las muestra; `ElderlyListItem` no las incluye y un criterio lo comprueba. |
| Un staff ve un archivado por URL | `ElderlyProfileContent` llama a `notFound()` si `status = 'archived'` y el rol no es admin; criterio con el staff temporal. |
| Un familiar `archived` aparece como "activa" | Aceptado; hoy no hay flujo para archivar familiares. Entrada nueva en BACKLOG. |
| Un id inexistente responde 200 | Aceptado por decisión del usuario; Next agrega `noindex`. |
| El aviso de `/elderly` persiste aunque la consulta esté en `<Suspense>` (BACKLOG anotó sin verificar que `(app)/loading.tsx` no lo evitaba) | Consultar `node_modules/next/dist/docs/` antes del paso 8; si el aviso sigue, detenerse y preguntar. |
| La redirección de `requireTeamUser()` dentro de `<Suspense>` ocurre tras empezar el streaming | Criterio de redirección sin sesión; si no redirige, detenerse y preguntar. |

---

## Lo que **no** entra en esta spec

- Guardar desde "Vincular otro familiar/tutor".
- `invitations` y filas PENDIENTE.
- Reactivar o archivar adultos mayores.
- "Editar" y "Resumen del día".
- Esqueleto definitivo de `(app)` y streaming de las demás rutas.
- 404 real para ids inexistentes.
- Cambios en la DB.

Cada una de esas, si llega, va en su propia spec.
