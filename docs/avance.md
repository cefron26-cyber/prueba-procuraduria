# Avance (2026-11-22)

## Estado
- Publicado en https://cefron26-cyber.github.io/prueba-procuraduria/ (repo `cefron26-cyber/prueba-procuraduria`, Pages por workflow sobre `app/`).
- Banco: 605 preguntas validadas. 10 ejes de conocimientos con 56-58 cada uno y competencias con 42. Letra correcta equilibrada. 3 preguntas `real`.
- Usuario: `camilo` (solo hash en `app/js/usuarios.js`).
- No se publican `archivos de referencia/` ni `docs/drive-ids.md` (ver `.gitignore`).

## Flujo por lote
1. Escribir `banco-preguntas/generadas/<eje>-<n>.json` con la clave en "A" (tipo única) y explicaciones sin citar letras.
2. `node scripts/balancear.js banco-preguntas/generadas/<eje>-<n>.json`
3. `node scripts/validar.js`, `node scripts/build.js`, commit y push (Pages se actualiza solo).
IDs: disc-, proc-, pgn-, cons-, adm-, tra-, fp-, cont-, int-, ddhh-, comp-. Siguiente número libre: el último de cada eje + 1.

## Posibles mejoras
- Revisar el sitio oficial cuando se publique la guía de la prueba escrita 2026 y ajustar ejes y formato.
- Ampliar ejes con más lotes (contratación, CGP, ofimática si la guía la incluye).
