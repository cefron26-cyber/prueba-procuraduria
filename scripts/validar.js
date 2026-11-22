#!/usr/bin/env node
// Valida los bancos en banco-preguntas/{reales,generadas}/<eje>.json.
// Uso: node scripts/validar.js [--quiet]. Sale con código 1 si hay errores.
const fs = require('fs');
const path = require('path');
const EJES = require('./ejes');

const ROOT = path.join(__dirname, '..', 'banco-preguntas');
const LETRAS = ['A', 'B', 'C', 'D'];
const TIPOS = ['unica', 'multiple', 'postulados'];
const PROHIBIDAS = /(todas|ninguna) de las anteriores|todas las opciones|ninguna de las opciones/i;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function cargar() {
  const out = [];
  for (const carpeta of ['reales', 'generadas']) {
    const dir = path.join(ROOT, carpeta);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      const ruta = path.join(dir, f);
      let datos;
      try { datos = JSON.parse(fs.readFileSync(ruta, 'utf8')); }
      catch (e) { out.push({ archivo: `${carpeta}/${f}`, error: 'JSON inválido: ' + e.message }); continue; }
      if (!Array.isArray(datos)) { out.push({ archivo: `${carpeta}/${f}`, error: 'El archivo debe ser un arreglo' }); continue; }
      datos.forEach(p => out.push({ archivo: `${carpeta}/${f}`, carpeta, ejeArchivo: f.replace(/(-\d+)?\.json$/, ''), p }));
    }
  }
  return out;
}

function validar() {
  const items = cargar();
  const errores = [];
  const avisos = [];
  const ids = new Set();
  const enunciados = new Map();
  const preguntas = [];
  const ejesPorId = Object.fromEntries(EJES.map(e => [e.id, e]));

  for (const it of items) {
    if (it.error) { errores.push(`${it.archivo}: ${it.error}`); continue; }
    const p = it.p;
    const ref = `${it.archivo} [${p && p.id}]`;
    const err = m => errores.push(`${ref}: ${m}`);
    if (!p || typeof p !== 'object') { err('pregunta no es objeto'); continue; }
    if (!p.id || typeof p.id !== 'string') err('falta id');
    else if (ids.has(p.id)) err('id duplicado');
    else ids.add(p.id);
    const eje = ejesPorId[p.eje];
    if (!eje) err(`eje desconocido "${p.eje}"`);
    else {
      if (p.eje !== it.ejeArchivo) err(`eje "${p.eje}" no coincide con el archivo`);
      if (p.nucleo !== eje.nucleo) err(`núcleo "${p.nucleo}" debe ser "${eje.nucleo}"`);
    }
    if (!['real', 'estilo'].includes(p.origen)) err('origen debe ser real o estilo');
    if (p.origen === 'real' && it.carpeta !== 'reales') err('origen real fuera de reales/');
    if (p.origen === 'estilo' && it.carpeta !== 'generadas') err('origen estilo fuera de generadas/');
    if (p.tipo !== undefined && !TIPOS.includes(p.tipo)) err(`tipo inválido "${p.tipo}"`);
    if (!p.fuente || typeof p.fuente !== 'string') err('falta fuente');
    else if (p.eje !== 'competencias' && p.origen !== 'real' && !/art[íi]?/i.test(p.fuente)) avisos.push(`${ref}: la fuente no cita artículo`);
    if (!p.enunciado || p.enunciado.trim().length < 15) err('enunciado vacío o muy corto');
    if (!p.opciones || typeof p.opciones !== 'object') err('faltan opciones');
    else {
      const claves = Object.keys(p.opciones);
      if (claves.length !== 4 || !LETRAS.every(l => claves.includes(l))) err('opciones deben ser exactamente A, B, C y D');
      for (const l of LETRAS) {
        const t = p.opciones[l];
        if (!t || typeof t !== 'string' || !t.trim()) err(`opción ${l} vacía`);
        else if (PROHIBIDAS.test(t)) err(`opción ${l} usa "todas/ninguna de las anteriores"`);
      }
      const textos = LETRAS.map(l => (p.opciones[l] || '').trim().toLowerCase());
      if (new Set(textos).size !== 4) err('opciones repetidas');
    }
    if (!LETRAS.includes(p.correcta)) err('correcta debe ser A, B, C o D');
    if (!p.explicacion || p.explicacion.trim().length < 20) err('explicación vacía o muy corta');
    else if ((p.tipo || 'unica') === 'unica' && /\b(opci[oó]n|literal|letra|respuesta)\s+[A-D]\b/.test(p.explicacion)) err('la explicación cita letras; describa el contenido');
    if (![1, 2, 3].includes(p.dificultad)) err('dificultad debe ser 1, 2 o 3');
    const texto = JSON.stringify(p);
    if (EMOJI.test(texto)) err('contiene emoji');
    if (p.enunciado) {
      const k = p.enunciado.trim().toLowerCase().replace(/\s+/g, ' ');
      if (enunciados.has(k)) avisos.push(`${ref}: enunciado idéntico a ${enunciados.get(k)}`);
      else enunciados.set(k, p.id);
    }
    preguntas.push(p);
  }
  return { errores, avisos, preguntas };
}

function resumen(preguntas) {
  const filas = EJES.map(e => {
    const ps = preguntas.filter(p => p.eje === e.id);
    const letras = Object.fromEntries(LETRAS.map(l => [l, ps.filter(p => p.correcta === l).length]));
    return { eje: e.id, total: ps.length, ...letras, real: ps.filter(p => p.origen === 'real').length };
  });
  return filas;
}

if (require.main === module) {
  const { errores, avisos, preguntas } = validar();
  const quiet = process.argv.includes('--quiet');
  if (!quiet) {
    console.table(resumen(preguntas));
    const tot = Object.fromEntries(LETRAS.map(l => [l, preguntas.filter(p => p.correcta === l).length]));
    console.log('Total:', preguntas.length, 'Letras:', JSON.stringify(tot));
  }
  avisos.slice(0, 30).forEach(a => console.warn('AVISO', a));
  if (avisos.length > 30) console.warn(`... y ${avisos.length - 30} avisos más`);
  if (errores.length) {
    errores.forEach(e => console.error('ERROR', e));
    console.error(`${errores.length} errores`);
    process.exit(1);
  }
  console.log('Validación correcta.');
}

module.exports = { validar, resumen };
