#!/usr/bin/env node
// Reparte la letra correcta de forma uniforme en un lote nuevo, permutando opciones.
// Solo toca preguntas de tipo "unica" (los tipos multiple y postulados tienen letras fijas).
// Las explicaciones no deben citar letras (validar.js lo exige), así que permutar es seguro.
// Uso: node scripts/balancear.js banco-preguntas/generadas/<eje>-<n>.json
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const LETRAS = ['A', 'B', 'C', 'D'];

const ruta = process.argv[2];
if (!ruta) { console.error('Uso: node scripts/balancear.js <archivo.json>'); process.exit(1); }
const abs = path.resolve(ruta);
const lote = JSON.parse(fs.readFileSync(abs, 'utf8'));
const dir = path.dirname(abs);
const base = path.basename(abs).replace(/(-\d+)?\.json$/, '');

// Conteo previo del eje (otros lotes del mismo eje).
const cuenta = { A: 0, B: 0, C: 0, D: 0 };
for (const f of fs.readdirSync(dir)) {
  if (path.join(dir, f) === abs || f.replace(/(-\d+)?\.json$/, '') !== base || !f.endsWith('.json')) continue;
  JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).forEach(p => { cuenta[p.correcta]++; });
}
lote.filter(p => p.tipo && p.tipo !== 'unica').forEach(p => { cuenta[p.correcta]++; });

const h = s => crypto.createHash('sha1').update(s).digest().readUInt32BE(0);
for (const p of lote) {
  if (p.tipo && p.tipo !== 'unica') continue;
  const min = Math.min(...LETRAS.map(l => cuenta[l]));
  const candidatas = LETRAS.filter(l => cuenta[l] === min);
  const destino = candidatas[h(p.id) % candidatas.length];
  const textoCorrecto = p.opciones[p.correcta];
  const otras = LETRAS.filter(l => l !== p.correcta).map(l => p.opciones[l]);
  const rot = h(p.id + 'r') % 3;
  const distractores = otras.slice(rot).concat(otras.slice(0, rot));
  const nuevas = {};
  let k = 0;
  for (const l of LETRAS) nuevas[l] = l === destino ? textoCorrecto : distractores[k++];
  p.opciones = nuevas;
  p.correcta = destino;
  cuenta[destino]++;
}
fs.writeFileSync(abs, JSON.stringify(lote, null, 1) + '\n', 'utf8');
console.log(path.basename(abs), 'balanceado. Conteo del eje:', JSON.stringify(cuenta));
