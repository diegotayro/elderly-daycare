# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Proyecto

ElderlyDayCare: app para una guardería de adultos mayores. El staff publica en un feed (comidas, siestas, actividades, logros, anuncios) y los familiares ven lo de sus adultos mayores. Roles: `admin`, `staff`, `relative`.

Estado actual: scaffold de Create Next App. Aún no existe el código de dominio; la especificación vive en `references/`.

## Comandos

```bash
npm run dev     # servidor de desarrollo en http://localhost:3000
npm run build
npm run lint    # ESLint 9 (eslint-config-next core-web-vitals + typescript)
```

No hay framework de tests configurado todavía.

## Stack y configuración relevante

- Next.js 16.4.5 (App Router) + React 19.3 + TypeScript strict. Alias `@/*` → raíz del repo.
- Tailwind CSS v4 cargado vía loader de Turbopack (`@tailwindcss/turbopack` en `next.config.ts`), no vía PostCSS.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching` y `experimental.agentFeedback`. Consultar `node_modules/next/dist/docs/` antes de usar APIs de caché/rendering.
- En Next 16 `middleware.ts` se llama `proxy.ts`.
- Backend: Supabase (Postgres + Auth + Storage) con `@supabase/ssr` y `@supabase/supabase-js`; correos con Resend (previsto).

## Documentos de referencia (fuente de verdad)

- `references/documents/database-schema.md`: tablas, enums, policies RLS, bucket `post-photos` y cómo probar las policies.
- `references/documents/flujos-de-procesos.md`: flujos de creación/gestión de cuentas y publicaciones.
- `references/pantallas/*.dc.html`: mockups de cada pantalla (abrir en navegador; `support.js` es un runtime generado, no editar).

## Reglas de dominio clave (detalle en los documentos de referencia)

- Todo lo persistido en DB va en inglés (enums, códigos); las etiquetas en español se traducen en la UI.
- RLS activado en todas las tablas; policies solo `to authenticated`, nombradas `<tabla>_<acción>_<quién>`, con helpers `SECURITY DEFINER STABLE` envueltos en `(select ...)`.
- Solo usuarios con `status = active` tienen acceso.
- La regla de visibilidad del feed (según `audience`, nunca `type`) se implementa en un solo lugar y la reusan `posts`, `post_elderly`, `post_photos`, `reactions`, `comments` y Storage.
- Signup público desactivado. La creación de cuentas va en Server Actions con el cliente `service_role`, solo después de verificar permisos del que llama. `role` y `daycare_id` los fija siempre el servidor.
- El cliente `service_role` se usa solo para los casos listados en el esquema (crear cuentas, aceptar invitaciones, activar/archivar usuarios, cron del resumen diario).
- Consentimiento de fotos: siempre gana el "no"; un familiar nunca puede pasarlo de `false` a `true`.

## Convenciones

- Screaming Architecture: organizar por feature de dominio (ej. `auth/`, `elderly/`, `feed/`), no por tipo técnico.
- Cada cambio de tablas va acompañado de su migración.
- Código en inglés; comentarios en español solo cuando aporten valor.

## UI / Frontend

- Al implementar pantallas o componentes nuevos (incluido dentro de `/spec-impl`), cargar el skill `frontend-design:frontend-design` antes de escribir código de UI.
- Los mockups de `references/pantallas/*.dc.html` son la fuente de verdad: layout, colores, tipografía y copy se toman del mockup. El skill solo complementa lo que el mockup no define (estados vacíos/error/carga, responsive, foco de teclado, accesibilidad, reduced motion).
- Ante un conflicto entre el skill y el mockup, gana el mockup. Si el mockup no cubre algo relevante, detenerse y preguntar.
- Ajustes menores de UI (textos, un color, bugs de estilo) no requieren el skill.

## Supabase

- Antes de usar el MCP de Supabase, o de escribir migraciones, políticas RLS, funciones, triggers o cualquier SQL, cargar los skills `supabase` y `supabase-postgres-best-practices`.
- Ante un conflicto entre los skills y `references/documents/`, gana `references/documents/`.
- La app interactúa con la base de datos solo mediante los paquetes oficiales de Supabase para Next.js: `@supabase/ssr` sobre `@supabase/supabase-js`. No usar ORMs ni conexiones directas a Postgres desde la app.
- Usar los clientes con sesión de `shared/supabase/`, sin crear otros equivalentes:
  - `server.ts`: Server Components, Server Actions y Route Handlers.
  - `client.ts`: Client Components.
  - `proxy.ts`: lo usa solo `proxy.ts` de la raíz para refrescar la sesión.
- La única excepción es el cliente `service_role`, solo para los casos listados en el esquema. Aún no existe.

## Flujo de trabajo: Spec Driven Design (SDD)

Ninguna feature se implementa sin una spec aprobada.

1. `/spec <descripción>`: diseña la spec por preguntas y la guarda en `specs/NN-slug.md` (sin código). Las specs de base de datos (tablas, migraciones, RLS, funciones, triggers, Storage) van en `specs/database/NN-slug.md`.
2. Revisar la spec y cambiar su estado a `Aprobado`.
3. `/spec-impl NN-slug`: crea la rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`) e implementa el plan paso a paso, con pausa para revisar el diff después de cada paso.
4. Verificar los criterios de aceptación con el agente `spec-verifier` (ver abajo), marcar la spec como `Implementado` y hacer commit/merge (solo el usuario decide los commits).

Reglas:
- La spec es el contrato: implementar lo que dice. Si algo debe cambiar, se cambia primero en la spec.
- Ante una ambigüedad no resuelta por la spec, detenerse y preguntar con opciones concretas.
- Lo que esté fuera del alcance de la spec se anota para una spec futura; no se implementa en la rama actual.
- Las specs deben respetar `references/documents/` (esquema y flujos) y estar escritas en español, siguiendo el formato de las existentes.
- La numeración `NN` es correlativa entre `specs/` y `specs/database/` (no se reinicia por carpeta).

## Agentes

- `spec-verifier` (`.claude/agents/spec-verifier.md`): verifica los criterios de aceptación de una spec (recibe el nombre o número), revisa el código y la UI con Playwright, corrige lo que falle y marca los checks. No cambia el estado de la spec ni hace commits.
- Solo se lanza cuando el usuario lo pide explícitamente (ej. `@"spec-verifier (agent)" 01-slug`).

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwright-mcp
- Context7 usaremos este mcp para traer la documentación actualizada del framework
  - Consultar el ID sin versión (ej. `/vercel/next.js`), no un snapshot (`/vercel/next.js/v16.2.9`), salvo que se necesite una versión concreta.
  - Contrastar siempre con la documentación local de la versión instalada (ej. `node_modules/next/dist/docs/`). Si no coinciden, gana la local.
