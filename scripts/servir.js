#!/usr/bin/env node
// Servidor estático mínimo para probar app/ en local. Uso: node scripts/servir.js [puerto]
const http = require('http');
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..', 'app');
const PUERTO = +process.argv[2] || 5180;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, path.normalize(p));
  if (!f.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PUERTO, '127.0.0.1', () => console.log(`Sirviendo app/ en http://localhost:${PUERTO}`));
