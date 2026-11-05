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
