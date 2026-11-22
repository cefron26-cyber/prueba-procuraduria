# INSTRUCCIONES PARA OPUS — Plataforma de simulacros Concurso Procuraduría

> Lee primero este archivo completo, luego `CLAUDE.md`. Todas las respuestas al usuario van **en español**.
> Sonnet dejó el diseño y la investigación hechos; **Opus construye la plataforma y los bancos de preguntas**.

## 1. Objetivo
Página web estática donde el hermano del usuario entra con **usuario y contraseña**, pulsa **"Generar examen"** y recibe un simulacro armado al azar desde un banco grande de preguntas, para el **Concurso de Méritos Procuraduría General de la Nación 2026** (nivel **Profesional / Asesor**, empleos como Profesional Universitario y Procurador Judicial).

## 2. Decisiones ya tomadas por el usuario (no re-discutir)
- Hosting: **GitHub Pages solo, sin backend**, login simple. Cuenta `gh` ya autenticada: `cefron26-cyber`.
- Nivel: **Profesional / Asesor**.
- Funciones: elegir **número de preguntas y temas**; **cronómetro y calificación**; **explicación de cada respuesta** (con la norma citada); **historial de intentos** por usuario.
- Usuarios: solo 2 (el hermano y el dueño). Cuentas fijas, sin registro.
- Preguntas: mezcla de **reales de convocatorias anteriores** y **de estilo similar generadas**. Cuantas más, mejor (meta: ≥ 600 en total, ≥ 40 por eje).
- Numeración de preguntas continua 1–N en cada examen, sin reiniciar por tema.

## 3. Hechos del concurso (fuente: `archivos de referencia/res076.md` y `res212.md`)
- Resolución 076 del 24-mar-2026, modificada por la 212 de 2026. Plataforma oficial: www.meritoconstruyendoexcelencia.com.co.
- Niveles Profesional/Asesor/Ejecutivo: **Conocimientos 70 % (eliminatoria, mínimo 65/100)**, Competencias comportamentales 20 % (clasificatoria), Antecedentes 10 %.
- La prueba de conocimientos escrita tiene **dos núcleos: general y específico** (art. 19 modificado). Es de selección múltiple, calificada 0–100.
- Lista de elegibles: puntaje final ≥ 70 % del máximo.
- Art. 208 Decreto Ley 262/2000: **el material de las pruebas es reservado** → casi no existen preguntas reales públicas. Ser honesto con el usuario: etiquetar cada pregunta como `real` solo si hay fuente verificable; si no, `estilo`.
- Los ejes temáticos exactos por empleo y la Guía de Orientación al Aspirante de la prueba escrita **pueden no estar publicados aún**. Buscar en `procuraduria.gov.co/procuraduria/concurso` y en el sitio del concurso; si no están, tomar como base el Decreto Ley 262 de 2000 (régimen disciplinario y funcional de la PGN), Ley 1952 de 2019 (Código General Disciplinario, modif. Ley 2094/2021), Constitución Política (arts. de Ministerio Público, derechos, función pública), CPACA (Ley 1437/2011), contratación estatal (Ley 80/1993 y 1150/2007), Código General del Proceso, y gestión pública/ética. **Documentar en `docs/ejes.md` qué se asumió y por qué.**
- Para modelar el formato, existen guías de otros concursos con la misma estructura (FGN, Cancillería, CNSC) en la web.

## 4. Estructura del proyecto (ya creada)
```
Procuraduria/
├─ CLAUDE.md                     # reglas cortas del proyecto
├─ INSTRUCCIONES_OPUS.md         # este archivo
├─ archivos de referencia/       # TODO en .md (ver README.md ahí). _raw/ = originales HTML/PDF
├─ banco-preguntas/
│  ├─ reales/                    # <eje>.json — solo con fuente verificable
│  └─ generadas/                 # <eje>.json — estilo Procuraduría
├─ scripts/                      # utilidades Node: validar bancos, construir app/data/bank.js, hash de claves
├─ docs/                         # ejes.md, decisiones, changelog
└─ app/                          # lo que se publica en GitHub Pages
   ├─ index.html
   ├─ css/
   ├─ js/
   └─ data/                      # bank.js generado por scripts/ (no editar a mano)
```

## 5. Formato de pregunta (JSON, un archivo por eje)
```json
{
  "id": "disc-0001",
  "eje": "disciplinario",
  "nucleo": "especifico",
  "origen": "estilo",
  "fuente": "Ley 1952 de 2019, art. 38",
  "enunciado": "…",
  "opciones": {"A": "…", "B": "…", "C": "…", "D": "…"},
  "correcta": "B",
  "explicacion": "Por qué B es correcta y por qué las otras no, citando la norma.",
  "dificultad": 2
}
```
Reglas: 4 opciones A–D; una sola correcta, **distribuir la letra correcta de forma uniforme**; sin "todas/ninguna de las anteriores"; casos prácticos tipo Procuraduría; normas citadas con artículo; `origen` ∈ {`real`, `estilo`}. Un validador en `scripts/validar.js` debe fallar si hay ids duplicados, opciones faltantes o `correcta` inválida.

## 6. Ejes sugeridos (ajustar tras `docs/ejes.md`)
Núcleo **general**: Constitución y Estado, función pública y carrera administrativa, ética y probidad, contratación estatal, derecho administrativo/CPACA.
Núcleo **específico**: régimen disciplinario (Ley 1952/2019), estructura y funciones de la PGN (Decreto Ley 262/2000), intervención judicial/administrativa del Ministerio Público, derechos humanos y control preventivo, procedimiento (CGP).
(Opcional, separado) Competencias comportamentales: preguntas situacionales.

## 7. Funcionalidad de la app
1. **Login** (pantalla inicial). Sin backend, las claves se guardan como hash SHA-256 con sal en `app/js/usuarios.js` (generado con `scripts/hash.js`); comparar con `crypto.subtle`. Sesión en `sessionStorage`. **Advertir al usuario** que esto es protección casual, no seguridad real, y que el banco es técnicamente visible en el código. No poner contraseñas en texto plano en el repo ni en el chat; el dueño las define y las entrega por su cuenta.
2. **Configurar examen**: número de preguntas (10/20/40/80/personalizado), temas/ejes con casillas, núcleo, dificultad, origen (reales/estilo/mixto), con o sin cronómetro (por defecto ~1 min por pregunta).
3. **Rendir**: selección aleatoria sin repetir en el mismo examen; barajar orden de preguntas (las opciones conservan letras); numeración continua; marcar para revisar; navegación; cronómetro; autoguardado para no perder el intento al recargar.
4. **Resultado**: puntaje sobre 100, aprobado/no según **65**, desglose por eje, revisión pregunta por pregunta con explicación y fuente.
5. **Historial**: intentos por usuario en `localStorage` (clave por usuario), con fecha, config, puntaje, y botón "repetir solo falladas". Exportar/importar JSON (el historial vive en el navegador de cada dispositivo — avisarlo).
6. Responsive (el hermano probablemente use celular), accesible, sin dependencias pesadas (HTML/CSS/JS vanilla). Interfaz en español.

## 7b. Diseño (obligatorio, preferencia del usuario)
- **Prohibido usar emojis** en la interfaz, el código y los textos. Iconos únicamente **SVG inline** (trazo uniforme, mismo grosor y tamaño de rejilla, `currentColor`), hechos a mano o de una familia consistente; no mezclar estilos.
- Aspecto **profesional, sobrio, institucional**; **nada de look "vibecodeado"**: sin degradados morados/azules, sin tarjetas con sombras exageradas ni glassmorphism, sin bordes redondeados excesivos, sin centrar todo, sin textos genéricos de marketing.
- Paleta corta (neutros + un solo color de acento serio, p. ej. azul oscuro o verde institucional), definida como variables CSS; contraste AA; modo claro por defecto y soporte oscuro opcional.
- Tipografía: una sola familia sans legible (sistema o una de Google Fonts), jerarquía clara por tamaño y peso, alineación a la izquierda, retícula consistente, espaciado de 4/8 px.
- Componentes planos y densos como una herramienta de evaluación real (barra superior simple, panel de pregunta, paleta numérica de navegación, resumen de resultados con tabla). Estados de foco visibles y teclado completo.
- Copy en español neutro, directo, sin exclamaciones ni frases motivacionales.
- Antes de entregar: revisar en móvil (375 px) y escritorio, y buscar emojis en todo el repo (`grep` de rangos Unicode) para confirmar que no hay ninguno.

## 7c. Material de Drive ya convertido
Ver tabla en `archivos de referencia/README.md`, sección Drive. Ojo: `act_Banco_Casos_Procuraduria.md` (300+ casos) y `act_PGN_SIMULACRO.md` (50 preguntas con clave) son la mejor semilla del banco, pero su procedencia no es oficial: **verificar cada respuesta contra la norma** antes de incluirla y etiquetarlas `origen: estilo`. `base_Cartilla_Procuraduria.md` es la guía oficial de la convocatoria 2006-2007 (formato real de preguntas). Las `lectora_2026_*` son de Contralorías, solo como modelo de comprensión lectora.
Normas de Drive ya descargadas y convertidas en `archivos de referencia/drive/ley_*.md`: Decreto Ley 262/2000, Ley 1437/2011, Ley 1712/2014, Ley 1952/2019, Ley 2094/2021. Son la fuente normativa clave; usar Grep por artículo.

## 8. Orden de trabajo para Opus
1. Leer `archivos de referencia/README.md` y solo los `.md` necesarios (no cargar res076 completo: 128 KB; usar Grep).
2. Pedir al usuario los **links de Drive** si aún no están en `archivos de referencia/drive-links.md`; convertir su contenido a `.md`.
3. Completar la investigación: guía de orientación, ejes por empleo, cuestionarios de ejemplo; guardar en `archivos de referencia/` como `.md` y actualizar su README.
4. Escribir `docs/ejes.md`.
5. Construir `scripts/` y la app; probar localmente con el navegador integrado.
6. Generar los bancos por lotes (eje por eje), validando con el script tras cada lote.
7. Publicar: `git init` en `Procuraduria/`, repo en GitHub (el usuario decide nombre y si es público; GitHub Pages gratuito exige repo público), activar Pages sobre `app/` (usar rama `gh-pages` o workflow que publique `app/`). Entregar la URL. **Antes de publicar, confirmar con el usuario** (política del usuario: cambios grandes se publican directo, pequeños se agrupan y se consulta).
8. Entregar APK solo si el usuario lo pide.

## 9. Ahorro de tokens
Trabajar por eje y por lotes; no releer archivos grandes; Grep antes de Read; mantener `CLAUDE.md` corto; no pegar bancos completos en el chat.
