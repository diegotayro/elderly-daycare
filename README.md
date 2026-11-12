# ElderlyDayCare

App para una guardería de adultos mayores. El staff publica en un feed (comidas, siestas, actividades, logros, anuncios) y los familiares ven lo de sus adultos mayores. Roles: `admin`, `staff`, `relative`.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage) · Resend.

## Requisitos

- Node.js 20 o superior y npm.
- Acceso al proyecto de Supabase (pídelo al dueño del repo).
- Una API key de [Resend](https://resend.com) para el envío de correos.
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (solo si vas a trabajar con migraciones).

## Levantar el proyecto

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea el archivo de variables de entorno a partir de la plantilla:

   ```bash
   cp .env.template .env
   ```

3. Completa `.env`:

   | Variable | Dónde obtenerla |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (`sb_publishable_...`) |
   | `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys (`sb_secret_...`). Solo servidor, nunca exponerla al cliente. |
   | `SUPABASE_DB_PASSWORD` | Contraseña de la base de datos (la usa el CLI al aplicar migraciones). |
   | `RESEND_API_KEY` | Resend → API Keys |
   | `RESEND_FROM_EMAIL` | Remitente de los correos (`onboarding@resend.dev` sirve para pruebas). |
   | `APP_URL` | URL base de la app, usada en los links de los correos (`http://localhost:3000` en local). |

4. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

### Otros comandos

```bash
npm run build   # build de producción
npm run start   # sirve el build
npm run lint    # ESLint
```

## Base de datos (Supabase CLI)

Las migraciones viven en `supabase/migrations/` y los datos de prueba en `supabase/seed.sql`.

1. Instala el CLI (macOS):

   ```bash
   brew install supabase/tap/supabase
   ```

2. Inicia sesión. Abre el navegador para autenticar tu equipo con tu cuenta de Supabase (el token queda guardado en tu máquina):

   ```bash
   supabase login
   ```

3. Vincula el repo al proyecto remoto (el `project_ref` es el que aparece en `.mcp.json` o en la URL del dashboard). Te pedirá la contraseña de la base de datos:

   ```bash
   supabase link --project-ref <project_ref>
   ```

4. Aplica las migraciones pendientes:

   ```bash
   supabase db push
   ```

> Los cambios en la base de datos remota son compartidos: coordina con el equipo antes de aplicar migraciones.

## MCP de Supabase (Claude Code)

El repo trae configurado el MCP de Supabase en `.mcp.json`, apuntando al proyecto remoto. Su autenticación es **independiente** del `supabase login` del CLI: usa OAuth en el navegador y no requiere un personal access token.

1. Abre Claude Code en la raíz del repo y acepta el servidor `supabase` cuando lo pida.
2. Ejecuta `/mcp`, selecciona `supabase` y elige **Authenticate**.
3. Se abrirá el navegador: inicia sesión en Supabase y autoriza el acceso a la organización del proyecto.
4. Vuelve a `/mcp` y verifica que `supabase` aparezca como conectado.

Si la sesión expira, repite el paso 2.

## Documentación del proyecto

- `references/documents/`: esquema de base de datos, policies RLS y flujos de procesos.
- `references/pantallas/*.dc.html`: mockups de cada pantalla.
- `specs/`: especificaciones de cada feature (flujo Spec Driven Design, ver `CLAUDE.md`).
