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

// Versiona los scripts en index.html para que el navegador no use una copia vieja en caché.
const crypto = require('crypto');
const appDir = path.join(__dirname, '..', 'app');
const indexPath = path.join(appDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
for (const rel of ['data/bank.js', 'js/usuarios.js', 'js/app.js', 'css/app.css']) {
  const v = crypto.createHash('sha1').update(fs.readFileSync(path.join(appDir, rel))).digest('hex').slice(0, 10);
  const re = new RegExp(rel.replace(/[.\/]/g, '\\$&') + '(\\?v=[0-9a-f]+)?"', 'g');
  html = html.replace(re, `${rel}?v=${v}"`);
}
fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html: versiones de scripts actualizadas.');
