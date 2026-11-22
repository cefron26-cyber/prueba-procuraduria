#!/usr/bin/env node
// Crea o actualiza un usuario en app/js/usuarios.js con hash PBKDF2-SHA-256 y sal aleatoria.
// La contraseña se pide por teclado sin mostrarse; nunca se guarda en texto plano.
// Uso: node scripts/hash.js <usuario> "<Nombre visible>"
//      node scripts/hash.js --borrar <usuario>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ITER = 150000;
const RUTA = path.join(__dirname, '..', 'app', 'js', 'usuarios.js');

function leerUsuarios() {
  if (!fs.existsSync(RUTA)) return {};
  const txt = fs.readFileSync(RUTA, 'utf8');
  const m = txt.match(/window\.USUARIOS = (\{[\s\S]*\});/);
  return m ? JSON.parse(m[1]) : {};
}

function guardar(usuarios) {
  const txt = '// Generado por scripts/hash.js. Solo contiene sal y hash, no contraseñas.\n' +
    'window.USUARIOS = ' + JSON.stringify(usuarios, null, 2) + ';\n';
  fs.writeFileSync(RUTA, txt, 'utf8');
}

function pedirOculto(pregunta) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(pregunta);
    if (!stdin.isTTY) {
      let buf = '';
      stdin.setEncoding('utf8');
      stdin.on('data', d => { buf += d; });
      stdin.on('end', () => resolve(buf.split(/\r?\n/)[0]));
      return;
    }
    let valor = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = ch => {
      if (ch === '\u0003') { stdin.setRawMode(false); process.stdout.write('\n'); reject(new Error('Cancelado')); return; }
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData);
        process.stdout.write('\n'); resolve(valor); return;
      }
      if (ch === '\u0008' || ch === '\u007f') { valor = valor.slice(0, -1); return; }
      valor += ch;
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const usuarios = leerUsuarios();
  if (args[0] === '--borrar') {
    delete usuarios[(args[1] || '').toLowerCase()];
    guardar(usuarios);
    console.log('Usuario eliminado.');
    return;
  }
  const usuario = (args[0] || '').trim().toLowerCase();
  const nombre = (args[1] || args[0] || '').trim();
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
    console.error('Uso: node scripts/hash.js <usuario> "<Nombre visible>"  (usuario: 3-30 caracteres a-z 0-9 . _ -)');
    process.exit(1);
  }
  const clave = await pedirOculto('Contraseña (no se muestra): ');
  if (clave.length < 8) { console.error('Use al menos 8 caracteres.'); process.exit(1); }
  if (process.stdin.isTTY) {
    const conf = await pedirOculto('Repita la contraseña: ');
    if (conf !== clave) { console.error('No coinciden.'); process.exit(1); }
  }
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(clave, sal, ITER, 32, 'sha256').toString('hex');
  usuarios[usuario] = { nombre, sal, iter: ITER, hash };
  guardar(usuarios);
  console.log(`Usuario "${usuario}" guardado en app/js/usuarios.js.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
