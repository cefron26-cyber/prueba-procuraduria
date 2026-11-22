#!/usr/bin/env node
// Valida los bancos y genera app/data/bank.js (no editar ese archivo a mano).
// Uso: node scripts/build.js
const fs = require('fs');
const path = require('path');
const EJES = require('./ejes');
const { validar } = require('./validar');

const { errores, preguntas } = validar();
if (errores.length) {
  errores.forEach(e => console.error('ERROR', e));
  console.error('No se generó bank.js: corrige los errores.');
  process.exit(1);
}

const campos = ['id', 'eje', 'nucleo', 'origen', 'tipo', 'fuente', 'enunciado', 'opciones', 'correcta', 'explicacion', 'dificultad'];
const limpias = preguntas.map(p => Object.fromEntries(campos.filter(c => p[c] !== undefined).map(c => [c, p[c]])));
const conteo = Object.fromEntries(EJES.map(e => [e.id, limpias.filter(p => p.eje === e.id).length]));
const datos = {
  generado: new Date().toISOString().slice(0, 10),
  ejes: EJES.map(e => ({ ...e, total: conteo[e.id] })),
  preguntas: limpias
};
const salida = path.join(__dirname, '..', 'app', 'data', 'bank.js');
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, '// Generado por scripts/build.js. No editar.\nwindow.BANCO = ' + JSON.stringify(datos) + ';\n', 'utf8');
console.log(`bank.js generado: ${limpias.length} preguntas, ${(fs.statSync(salida).size / 1024).toFixed(0)} KB`);
