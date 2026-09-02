# Tu Mini Diagnóstico — instrucciones para publicarlo

No necesitas saber programar para hacer esto. Sigue los pasos en orden.

## Paso 1 — Sube esta carpeta a GitHub (sin usar comandos)

1. Entra a github.com con tu cuenta.
2. Da clic en el botón verde "New" (o el "+" arriba a la derecha → "New repository").
3. Ponle un nombre, por ejemplo `hwo-mini-diagnostico`. Déjalo en "Private" si prefieres que nadie más lo vea.
4. Da clic en "Create repository".
5. En la siguiente pantalla, busca el link que dice "uploading an existing file" (subir un archivo existente).
6. Arrastra TODOS los archivos y carpetas de esta carpeta (`index.html`, `package.json`, `LEEME.md`, y la carpeta `api` completa con `generate-report.js` adentro) a esa página.
7. Baja y da clic en "Commit changes".

## Paso 2 — Conecta con Vercel

1. Entra a vercel.com con tu cuenta (la que conectaste con GitHub).
2. Da clic en "Add New..." → "Project".
3. Busca el repositorio que acabas de crear (`hwo-mini-diagnostico`) y da clic en "Import".
4. Vercel va a detectar todo automáticamente. NO le des clic a "Deploy" todavía — antes hay que agregar tu clave secreta (siguiente paso).

## Paso 3 — Agrega tu clave de Anthropic (muy importante, no te la saltes)

1. En la misma pantalla de importación, busca la sección "Environment Variables".
2. En el campo "Name" escribe exactamente: `ANTHROPIC_API_KEY`
3. En el campo "Value", pega la clave que guardaste de console.anthropic.com (la que empieza con `sk-ant-...`).
4. Da clic en "Add".
5. Ahora sí, da clic en "Deploy".

## Paso 4 — Pruébalo

1. Espera 1-2 minutos a que termine ("Building...").
2. Cuando termine, Vercel te da un link tipo `hwo-mini-diagnostico.vercel.app` — ábrelo.
3. Llena el formulario completo y da clic en "Generar Mi Reporte Completo".
4. Si todo salió bien, vas a ver el mensaje de tu casa y las 10 áreas con texto redactado, no el texto crudo que escribiste.

## Si algo no funciona

Toma captura de pantalla del error y mándamela — normalmente es algo simple, como un espacio de más en la clave de la API o un archivo que no se subió completo.

## Qué sigue después de esto

Este link ya es funcional, pero todavía es de "prueba" — el siguiente paso sería conectar el pago real (Stripe) para que el desbloqueo de las 10 áreas dependa de un pago de verdad, y opcionalmente usar un dominio con tu propio nombre en vez de `vercel.app`.
