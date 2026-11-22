# Avance (2026-11-22)

## Hecho
- Fase 1: `archivos de referencia/investigacion_prueba_escrita.md`, README actualizado, `docs/ejes.md`.
- Scripts: `validar.js`, `balancear.js`, `build.js`, `hash.js`, `servir.js`, `ejes.js`.
- App en `app/` probada en local (login, configuración, examen, resultado, historial, 375 px).
- Banco: 241 preguntas validadas.

## Flujo por lote
1. Escribir `banco-preguntas/generadas/<eje>-<n>.json` con la clave en "A" y explicaciones sin citar letras.
2. `node scripts/balancear.js banco-preguntas/generadas/<eje>-<n>.json`
3. `node scripts/validar.js` y al final `node scripts/build.js`.
IDs: disc-, proc-, pgn-, cons-, adm-, tra-, fp-, cont-, int-, ddhh-, comp-. Siguiente número libre: el último de cada eje + 1.

## Falta
| Eje | Hay | Meta |
|---|---|---|
| contratacion | 0 | 56 |
| intervencion | 0 | 56 |
| ddhh-preventiva | 1 | 56 |
| constitucional, funcion-publica, administrativo, transparencia, pgn, disciplinario, proc-disciplinario | 28-30 c/u | 56 c/u (segundo lote) |
| competencias | 42 | 40 (cumplida) |

Después: grep de emojis en todo el repo, borrar el usuario temporal `prueba` (`node scripts/hash.js --borrar prueba`), confirmar nombre del repo y publicar.
