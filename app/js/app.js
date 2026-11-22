/* Simulacros PGN 2026. JavaScript sin dependencias. */
(function () {
  'use strict';

  var BANCO = window.BANCO || { ejes: [], preguntas: [] };
  var USUARIOS = window.USUARIOS || {};
  var APROBATORIO = 65;
  var LETRAS = ['A', 'B', 'C', 'D'];
  var PREFIJO = 'pgn1:';
  var COMPLETO = { general: 35, especifico: 65, minutos: 210 };
  var NUCLEOS = { general: 'Núcleo general', especifico: 'Núcleo específico', competencias: 'Competencias comportamentales' };
  var DIFS = { 1: 'Básica', 2: 'Media', 3: 'Alta' };

  var porId = {};
  BANCO.preguntas.forEach(function (p) { porId[p.id] = p; });
  var ejePorId = {};
  BANCO.ejes.forEach(function (e) { ejePorId[e.id] = e; });

  var vista = document.getElementById('vista');
  var barra = document.getElementById('barra');
  var dialogo = document.getElementById('dialogo');
  var sesion = null;
  var temporizador = null;
  var teclado = null;

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function barajar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var r = new Uint32Array(1); crypto.getRandomValues(r);
      var j = r[0] % (i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function fmtFecha(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
      d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function fmtDur(seg) {
    seg = Math.max(0, Math.round(seg));
    var h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }
  function fmtNum(n) { return (Math.round(n * 100) / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }); }
  function leer(clave, def) {
    try { var v = localStorage.getItem(PREFIJO + clave); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function escribir(clave, val) {
    try { localStorage.setItem(PREFIJO + clave, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  function borrar(clave) { try { localStorage.removeItem(PREFIJO + clave); } catch (e) { /* sin almacenamiento */ } }
  function clave(nombre) { return sesion.usuario + ':' + nombre; }

  /* ---------- Iconos SVG (rejilla 24, trazo 1.75) ---------- */
  var ICONOS = {
    sello: '<path d="M12 4v16M6 20h12M5 8h14"/><path d="M7 8l-3 6h6zM17 8l-3 6h6z"/>',
    generar: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
    historial: '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 4v4h4M12 8v4l3 2"/>',
    salir: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    bandera: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 4L17 12H6"/>',
    izq: '<path d="M15 6l-6 6 6 6"/>',
    der: '<path d="M9 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    descargar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    subir: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    repetir: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"/><path d="M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15"/><path d="M4 20v-5h5"/>',
    candado: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    terminar: '<path d="M5 12.5l4.5 4.5L19 7"/><path d="M3 3h18v18H3z" opacity="0"/>',
    ojo: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    papelera: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>'
  };
  function ico(n, etiqueta) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"' +
      (etiqueta ? ' role="img" aria-label="' + esc(etiqueta) + '"' : ' aria-hidden="true" focusable="false"') + '>' + ICONOS[n] + '</svg>';
  }

  /* ---------- Diálogo ---------- */
  function confirmar(titulo, cuerpoHtml, textoOk, peligro) {
    return new Promise(function (resolve) {
      dialogo.innerHTML =
        '<form method="dialog"><div class="panel-cab"><h2 id="dialogo-titulo">' + esc(titulo) + '</h2></div>' +
        '<div class="panel-cuerpo">' + cuerpoHtml + '</div>' +
        '<div class="acciones"><div class="derecha"><button class="btn" value="no">Cancelar</button>' +
        '<button class="btn ' + (peligro ? 'btn-peligro' : 'btn-primario') + '" value="si">' + esc(textoOk) + '</button></div></div></form>';
      dialogo.onclose = function () { resolve(dialogo.returnValue === 'si'); };
      dialogo.returnValue = '';
      dialogo.showModal();
      var b = $('button[value="si"]', dialogo); if (b) b.focus();
    });
  }
  function informar(titulo, cuerpoHtml) {
    return new Promise(function (resolve) {
      dialogo.innerHTML =
        '<form method="dialog"><div class="panel-cab"><h2 id="dialogo-titulo">' + esc(titulo) + '</h2></div>' +
        '<div class="panel-cuerpo">' + cuerpoHtml + '</div>' +
        '<div class="acciones"><div class="derecha"><button class="btn btn-primario" value="ok">Aceptar</button></div></div></form>';
      dialogo.onclose = function () { resolve(); };
      dialogo.showModal();
    });
  }

  /* ---------- Sesión y acceso ---------- */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  function derivar(clave, sal, iter) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(clave), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sal), iterations: iter }, k, 256);
    }).then(hex);
  }
  function cargarSesion() {
    try { var s = JSON.parse(sessionStorage.getItem('pgn.sesion') || 'null'); if (s && USUARIOS[s.usuario]) sesion = s; } catch (e) { sesion = null; }
  }

  function vistaLogin() {
    barra.hidden = true;
    var hayUsuarios = Object.keys(USUARIOS).length > 0;
    var seguro = !!(window.crypto && crypto.subtle);
    vista.innerHTML =
      '<div class="contenedor estrecho login">' +
      '<div class="marca" style="margin-bottom:24px"><span class="marca-sello">' + ico('sello') + '</span>Simulacros PGN 2026</div>' +
      '<h1>Ingreso</h1>' +
      '<p class="texto-2">Prueba de conocimientos, nivel Profesional y Asesor.</p>' +
      (!hayUsuarios ? '<div class="aviso aviso-alerta" role="alert" style="margin:16px 0">No hay usuarios configurados. Ejecute <code>node scripts/hash.js</code> para crearlos.</div>' : '') +
      (!seguro ? '<div class="aviso aviso-error" role="alert" style="margin:16px 0">Este navegador no permite verificar la contraseña. Abra la página con https o desde localhost.</div>' : '') +
      '<form id="form-login" class="panel panel-cuerpo" style="margin-top:16px" novalidate>' +
      '<div class="campo"><label for="usuario">Usuario</label><input type="text" id="usuario" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>' +
      '<div class="campo"><label for="clave">Contraseña</label><input type="password" id="clave" autocomplete="current-password" required></div>' +
      '<div id="login-error" class="aviso aviso-error" role="alert" hidden style="margin-bottom:12px"></div>' +
      '<button class="btn btn-primario btn-bloque" type="submit">' + ico('candado') + 'Ingresar</button>' +
      '</form>' +
      '<p class="pequeno texto-2" style="margin-top:16px">Acceso restringido a usuarios autorizados.</p>' +
      '</div>';
    $('#usuario').focus();
    $('#form-login').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var u = $('#usuario').value.trim().toLowerCase();
      var c = $('#clave').value;
      var err = $('#login-error');
      var btn = $('button[type="submit"]', ev.target);
      err.hidden = true;
      var reg = USUARIOS[u];
      if (!u || !c) { err.textContent = 'Escriba usuario y contraseña.'; err.hidden = false; return; }
      btn.disabled = true;
      var prom = reg && seguro ? derivar(c, reg.sal, reg.iter || 150000) : Promise.resolve('');
      prom.then(function (h) {
        if (reg && h && h === reg.hash) {
          sesion = { usuario: u, nombre: reg.nombre || u };
          sessionStorage.setItem('pgn.sesion', JSON.stringify(sesion));
          location.hash = '#/inicio';
          ruta();
        } else {
          err.textContent = 'Usuario o contraseña incorrectos.';
          err.hidden = false;
          $('#clave').value = '';
          $('#clave').focus();
        }
      }).catch(function () {
        err.textContent = 'No fue posible verificar la contraseña en este navegador.'; err.hidden = false;
      }).then(function () { btn.disabled = false; });
    });
  }

  function pintarBarra(activa, extra) {
    barra.hidden = false;
    barra.innerHTML =
      '<div class="barra-int">' +
      '<div class="marca"><span class="marca-sello">' + ico('sello') + '</span><span>Simulacros PGN 2026</span></div>' +
      (extra || '') +
      '<nav class="nav" aria-label="Principal"' + (extra ? ' hidden' : '') + '>' +
      '<button class="nav-btn" data-ir="#/inicio"' + (activa === 'inicio' ? ' aria-current="page"' : '') + '>' + ico('generar') + '<span>Generar <span class="txt-largo">examen</span></span></button>' +
      '<button class="nav-btn" data-ir="#/historial"' + (activa === 'historial' ? ' aria-current="page"' : '') + '>' + ico('historial') + '<span>Historial</span></button>' +
      '<span class="usuario">' + esc(sesion.nombre) + '</span>' +
      '<button class="nav-btn" id="btn-salir">' + ico('salir') + '<span>Salir</span></button>' +
      '</nav></div>';
    $$('[data-ir]', barra).forEach(function (b) { b.addEventListener('click', function () { location.hash = b.getAttribute('data-ir'); }); });
    var s = $('#btn-salir', barra);
    if (s) s.addEventListener('click', function () {
      sessionStorage.removeItem('pgn.sesion'); sesion = null; location.hash = '#/'; ruta();
    });
  }

  /* ---------- Configuración ---------- */
  function configPorDefecto() {
    return leer(clave('config'), null) || {
      modo: 'completo', cantidad: 40, ejes: BANCO.ejes.filter(function (e) { return e.nucleo !== 'competencias'; }).map(function (e) { return e.id; }),
      nucleo: 'ambos', dificultad: [1, 2, 3], origen: 'mixto', reloj: true, minutos: 40, minutosManual: false
    };
  }

  function filtrar(cfg, ejesForzados) {
    var ejes = ejesForzados || cfg.ejes;
    return BANCO.preguntas.filter(function (p) {
      if (ejes.indexOf(p.eje) < 0) return false;
      if (!ejesForzados && cfg.nucleo !== 'ambos' && p.nucleo !== cfg.nucleo) return false;
      if (cfg.dificultad.indexOf(p.dificultad) < 0) return false;
      if (cfg.origen !== 'mixto' && p.origen !== cfg.origen) return false;
      return true;
    });
  }

  // Reparte n preguntas entre los ejes del grupo de forma equilibrada.
  function estratificar(pool, n) {
    var grupos = {};
    pool.forEach(function (p) { (grupos[p.eje] = grupos[p.eje] || []).push(p); });
    var colas = barajar(Object.keys(grupos)).map(function (k) { return barajar(grupos[k]); });
    var out = [];
    while (out.length < n && colas.some(function (c) { return c.length; })) {
      for (var i = 0; i < colas.length && out.length < n; i++) if (colas[i].length) out.push(colas[i].pop());
    }
    return out;
  }

  function seleccionar(cfg) {
    if (cfg.modo === 'completo') {
      var conoc = BANCO.ejes.filter(function (e) { return e.nucleo !== 'competencias'; }).map(function (e) { return e.id; });
      var pool = filtrar(cfg, conoc);
      var g = estratificar(pool.filter(function (p) { return p.nucleo === 'general'; }), COMPLETO.general);
      var e = estratificar(pool.filter(function (p) { return p.nucleo === 'especifico'; }), COMPLETO.especifico);
      return barajar(g.concat(e));
    }
    return barajar(estratificar(filtrar(cfg), cfg.cantidad));
  }

  function vistaInicio() {
    pintarBarra('inicio');
    var cfg = configPorDefecto();
    var curso = leer(clave('encurso'), null);
    var grupos = ['general', 'especifico', 'competencias'];

    var htmlEjes = grupos.map(function (n) {
      var ejes = BANCO.ejes.filter(function (e) { return e.nucleo === n; });
      if (!ejes.length) return '';
      return '<div class="grupo" data-grupo="' + n + '"><div class="grupo-cab"><strong class="pequeno">' + NUCLEOS[n] + '</strong>' +
        '<span><button type="button" class="enlace" data-todos="' + n + '">Todos</button><button type="button" class="enlace" data-ninguno="' + n + '">Ninguno</button></span></div>' +
        ejes.map(function (e) {
          return '<label class="check"><input type="checkbox" name="eje" value="' + e.id + '"' + (cfg.ejes.indexOf(e.id) >= 0 ? ' checked' : '') + '>' +
            '<span>' + esc(e.nombre) + '</span><span class="cuenta" data-cuenta="' + e.id + '"></span></label>';
        }).join('') + '</div>';
    }).join('');

    var cantidades = [10, 20, 40, 80, 100];
    var esOtra = cantidades.indexOf(cfg.cantidad) < 0;

    vista.innerHTML =
      '<div class="contenedor pila">' +
      (curso ? '<div class="aviso aviso-alerta fila" role="status"><span>Hay un examen sin terminar (' + curso.ids.length + ' preguntas, iniciado ' + esc(fmtFecha(curso.inicio)) + ').</span>' +
        '<span class="fila" style="margin-left:auto"><button class="btn btn-primario" id="btn-continuar">Continuar</button><button class="btn btn-peligro" id="btn-descartar">Descartar</button></span></div>' : '') +
      '<form id="form-config" class="panel" novalidate>' +
      '<div class="panel-cab"><h1 style="margin:0">Generar examen</h1><span class="pequeno texto-2">Banco: ' + BANCO.preguntas.length + ' preguntas</span></div>' +
      '<div class="panel-cuerpo pila">' +
      '<fieldset><legend>Modalidad</legend><div class="segmentos" role="radiogroup">' +
      '<label><input type="radio" name="modo" value="completo"' + (cfg.modo === 'completo' ? ' checked' : '') + '><span>Simulacro completo</span></label>' +
      '<label><input type="radio" name="modo" value="personalizado"' + (cfg.modo !== 'completo' ? ' checked' : '') + '><span>Personalizado</span></label>' +
      '</div><p class="pequeno texto-2" id="desc-modo" style="margin-top:8px"></p></fieldset>' +
      '<div id="bloque-personal" class="pila">' +
      '<fieldset><legend>Número de preguntas</legend><div class="fila"><div class="segmentos">' +
      cantidades.map(function (c) { return '<label><input type="radio" name="cantidad" value="' + c + '"' + (!esOtra && cfg.cantidad === c ? ' checked' : '') + '><span>' + c + '</span></label>'; }).join('') +
      '<label><input type="radio" name="cantidad" value="otra"' + (esOtra ? ' checked' : '') + '><span>Otra</span></label></div>' +
      '<label class="sr" for="cantidad-otra">Cantidad personalizada</label><input type="number" id="cantidad-otra" min="1" max="300" value="' + cfg.cantidad + '"' + (esOtra ? '' : ' hidden') + '></div></fieldset>' +
      '<fieldset><legend>Núcleo</legend><div class="segmentos">' +
      [['ambos', 'Ambos'], ['general', 'General'], ['especifico', 'Específico']].map(function (o) {
        return '<label><input type="radio" name="nucleo" value="' + o[0] + '"' + (cfg.nucleo === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset><legend>Ejes temáticos</legend><div class="rejilla-config">' + htmlEjes + '</div></fieldset>' +
      '</div>' +
      '<div class="rejilla-config">' +
      '<fieldset><legend>Dificultad</legend><div class="fila">' +
      [1, 2, 3].map(function (d) { return '<label class="check"><input type="checkbox" name="dificultad" value="' + d + '"' + (cfg.dificultad.indexOf(d) >= 0 ? ' checked' : '') + '>' + DIFS[d] + '</label>'; }).join('') +
      '</div></fieldset>' +
      '<fieldset><legend>Origen</legend><div class="segmentos">' +
      [['mixto', 'Mixto'], ['estilo', 'Estilo PGN'], ['real', 'Reales']].map(function (o) {
        return '<label><input type="radio" name="origen" value="' + o[0] + '"' + (cfg.origen === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '</div>' +
      '<fieldset><legend>Tiempo</legend><div class="fila">' +
      '<label class="check"><input type="checkbox" id="reloj"' + (cfg.reloj ? ' checked' : '') + '>Con cronómetro</label>' +
      '<span class="fila" id="bloque-min"><input type="number" id="minutos" min="1" max="600" value="' + cfg.minutos + '" aria-label="Minutos"><span class="texto-2">minutos</span></span>' +
      '</div></fieldset>' +
      '<div id="resumen-config" class="aviso" role="status" aria-live="polite"></div>' +
      '</div>' +
      '<div class="acciones"><div class="derecha"><button class="btn btn-primario" type="submit" id="btn-generar">' + ico('generar') + 'Generar examen</button></div></div>' +
      '</form>' +
      '<p class="pequeno texto-2">Calificación sobre 100. Mínimo aprobatorio: ' + APROBATORIO + ' puntos (Res. 076 de 2026, art. 19). Las preguntas marcadas "Real" provienen de guías oficiales de concursos anteriores de la PGN; las demás son de estilo similar.</p>' +
      '</div>';

    var form = $('#form-config');
    function leerForm() {
      var c = {};
      c.modo = $('input[name="modo"]:checked', form).value;
      var cant = $('input[name="cantidad"]:checked', form);
      c.cantidad = cant && cant.value !== 'otra' ? +cant.value : Math.max(1, Math.min(300, parseInt($('#cantidad-otra').value, 10) || 1));
      c.nucleo = $('input[name="nucleo"]:checked', form).value;
      c.ejes = $$('input[name="eje"]:checked', form).map(function (i) { return i.value; });
      c.dificultad = $$('input[name="dificultad"]:checked', form).map(function (i) { return +i.value; });
      c.origen = $('input[name="origen"]:checked', form).value;
      c.reloj = $('#reloj').checked;
      c.minutosManual = cfg.minutosManual;
      c.minutos = Math.max(1, Math.min(600, parseInt($('#minutos').value, 10) || 1));
      return c;
    }
    function actualizar(origenCambio) {
      var c = leerForm();
      var completo = c.modo === 'completo';
      $('#bloque-personal').hidden = completo;
      $('#cantidad-otra').hidden = $('input[name="cantidad"]:checked', form).value !== 'otra';
      $('#bloque-min').hidden = !c.reloj;
      $('#desc-modo').textContent = completo
        ? 'Formato del concurso PGN 2015 (mismo operador): 100 preguntas, ' + COMPLETO.general + ' del núcleo general y ' + COMPLETO.especifico + ' del específico, ' + COMPLETO.minutos + ' minutos. No incluye competencias comportamentales.'
        : 'Elija cantidad, núcleo y ejes. Las preguntas se reparten de forma equilibrada entre los ejes elegidos.';
      // Ejes fuera del núcleo elegido se muestran deshabilitados.
      $$('.grupo', form).forEach(function (g) {
        var n = g.getAttribute('data-grupo');
        var off = c.nucleo !== 'ambos' && n !== c.nucleo;
        $$('input', g).forEach(function (i) { i.disabled = off; });
        g.style.opacity = off ? '.5' : '';
      });
      // Conteos por eje con los filtros actuales.
      BANCO.ejes.forEach(function (e) {
        var span = $('[data-cuenta="' + e.id + '"]', form);
        if (span) span.textContent = filtrar(c, [e.id]).length;
      });
      if (origenCambio === 'minutos') { cfg.minutosManual = true; c.minutosManual = true; }
      if (!cfg.minutosManual && origenCambio !== 'minutos') {
        var sug = completo ? COMPLETO.minutos : c.cantidad;
        $('#minutos').value = sug; c.minutos = sug;
      }
      var disp, objetivo;
      if (completo) {
        var pool = filtrar(c, BANCO.ejes.filter(function (e) { return e.nucleo !== 'competencias'; }).map(function (e) { return e.id; }));
        var g = pool.filter(function (p) { return p.nucleo === 'general'; }).length;
        var es = pool.filter(function (p) { return p.nucleo === 'especifico'; }).length;
        disp = Math.min(g, COMPLETO.general) + Math.min(es, COMPLETO.especifico);
        objetivo = COMPLETO.general + COMPLETO.especifico;
      } else {
        disp = Math.min(filtrar(c).length, c.cantidad);
        objetivo = c.cantidad;
      }
      var res = $('#resumen-config');
      res.className = 'aviso' + (disp === 0 ? ' aviso-error' : disp < objetivo ? ' aviso-alerta' : '');
      res.textContent = disp === 0 ? 'No hay preguntas con estos filtros.' :
        (disp < objetivo ? 'Solo hay ' + disp + ' preguntas disponibles con estos filtros; el examen tendrá ' + disp + '.' :
          'El examen tendrá ' + disp + ' preguntas' + (c.reloj ? ' y ' + c.minutos + ' minutos.' : ', sin límite de tiempo.'));
      $('#btn-generar').disabled = disp === 0;
      return c;
    }
    form.addEventListener('change', function (ev) { actualizar(ev.target.id === 'minutos' ? 'minutos' : ''); });
    form.addEventListener('input', function (ev) { if (ev.target.id === 'cantidad-otra') actualizar(); });
    $$('[data-todos]', form).forEach(function (b) { b.addEventListener('click', function () { $$('[data-grupo="' + b.getAttribute('data-todos') + '"] input', form).forEach(function (i) { i.checked = true; }); actualizar(); }); });
    $$('[data-ninguno]', form).forEach(function (b) { b.addEventListener('click', function () { $$('[data-grupo="' + b.getAttribute('data-ninguno') + '"] input', form).forEach(function (i) { i.checked = false; }); actualizar(); }); });
    actualizar();

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var c = actualizar();
      var iniciar = function () {
        escribir(clave('config'), c);
        var qs = seleccionar(c);
        if (!qs.length) return;
        crearExamen(qs.map(function (p) { return p.id; }), c);
      };
      if (curso) {
        confirmar('Reemplazar examen en curso', '<p>Hay un examen sin terminar. Si genera uno nuevo, el anterior se descarta.</p>', 'Generar nuevo', true)
          .then(function (ok) { if (ok) iniciar(); });
      } else iniciar();
    });
    if (curso) {
      $('#btn-continuar').addEventListener('click', function () { location.hash = '#/examen'; });
      $('#btn-descartar').addEventListener('click', function () {
        confirmar('Descartar examen', '<p>El examen en curso se eliminará sin calificar.</p>', 'Descartar', true).then(function (ok) {
          if (ok) { borrar(clave('encurso')); vistaInicio(); }
        });
      });
    }
  }

  function crearExamen(ids, cfg, titulo) {
    var ahora = Date.now();
    var ex = {
      id: uid(), inicio: ahora, ids: ids, resp: {}, marcas: {}, actual: 0,
      config: cfg, titulo: titulo || (cfg.modo === 'completo' ? 'Simulacro completo' : 'Personalizado'),
      fin: cfg.reloj ? ahora + cfg.minutos * 60000 : null
    };
    escribir(clave('encurso'), ex);
    location.hash = '#/examen';
  }

  /* ---------- Examen ---------- */
  function vistaExamen() {
    var ex = leer(clave('encurso'), null);
    if (!ex) { location.hash = '#/inicio'; return; }
    ex.ids = ex.ids.filter(function (id) { return porId[id]; });
    if (!ex.ids.length) { borrar(clave('encurso')); location.hash = '#/inicio'; return; }
    var total = ex.ids.length;

    pintarBarra('', '<div class="estado-examen"><span class="pequeno texto-2 ocultar-movil" id="cont-resp"></span>' +
      (ex.fin ? '<span class="reloj" id="reloj" role="timer" aria-label="Tiempo restante">' + ico('reloj') + '<span id="reloj-txt">--:--</span></span>' : '') +
      '<button class="btn btn-primario" id="btn-finalizar">' + ico('check') + 'Finalizar</button></div>');

    vista.innerHTML =
      '<div class="progreso" aria-hidden="true"><div id="barra-prog" style="width:0"></div></div>' +
      '<div class="contenedor"><div class="examen">' +
      '<section class="panel" id="panel-pregunta" aria-live="polite"></section>' +
      '<aside class="panel" aria-label="Navegación de preguntas"><div class="panel-cab"><h2>Preguntas</h2><span class="pequeno texto-2" id="cont-resp2"></span></div>' +
      '<div class="panel-cuerpo"><div class="paleta" id="paleta"></div>' +
      '<div class="leyenda"><span><i class="muestra resp"></i>Respondida</span><span><i class="muestra marc"></i>Marcada para revisar</span><span><i class="muestra"></i>Sin responder</span></div>' +
      '<p class="teclas ocultar-movil">Teclado: <kbd>A</kbd>-<kbd>D</kbd> responder, <kbd>&larr;</kbd> <kbd>&rarr;</kbd> navegar, <kbd>M</kbd> marcar.</p>' +
      '</div></aside></div></div>';

    var paleta = $('#paleta');
    paleta.innerHTML = ex.ids.map(function (id, i) { return '<button type="button" data-i="' + i + '" aria-label="Pregunta ' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('');
    paleta.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) ir(+b.getAttribute('data-i')); });

    function guardar() { escribir(clave('encurso'), ex); }
    function contar() {
      var r = ex.ids.filter(function (id) { return ex.resp[id]; }).length;
      var txt = r + ' de ' + total + ' respondidas';
      $('#cont-resp').textContent = txt; $('#cont-resp2').textContent = r + '/' + total;
      $('#barra-prog').style.width = (r / total * 100) + '%';
      $$('button', paleta).forEach(function (b, i) {
        var id = ex.ids[i];
        b.className = (ex.resp[id] ? 'resp' : '') + (ex.marcas[id] ? ' marc' : '');
        b.setAttribute('aria-current', i === ex.actual ? 'true' : 'false');
        b.setAttribute('aria-label', 'Pregunta ' + (i + 1) + (ex.resp[id] ? ', respondida' : ', sin responder') + (ex.marcas[id] ? ', marcada' : ''));
      });
    }
    function pintar() {
      var id = ex.ids[ex.actual];
      var p = porId[id];
      var eje = ejePorId[p.eje];
      var panel = $('#panel-pregunta');
      panel.innerHTML =
        '<div class="pregunta-cab"><span class="num">Pregunta ' + (ex.actual + 1) + '</span><span class="texto-2 pequeno">de ' + total + '</span>' +
        '<span style="margin-left:auto" class="fila"><span class="etiqueta">' + esc(eje ? eje.nombre : p.eje) + '</span>' +
        (p.origen === 'real' ? '<span class="etiqueta etiqueta-real">Real</span>' : '') + '</span></div>' +
        '<div class="panel-cuerpo"><p class="enunciado">' + esc(p.enunciado) + '</p>' +
        '<fieldset class="opciones"><legend class="sr">Opciones de respuesta</legend>' +
        LETRAS.map(function (l) {
          return '<label class="opcion"><input type="radio" name="op" value="' + l + '"' + (ex.resp[id] === l ? ' checked' : '') + '>' +
            '<span class="letra" aria-hidden="true">' + l + '</span><span><span class="sr">' + l + '. </span>' + esc(p.opciones[l]) + '</span></label>';
        }).join('') + '</fieldset></div>' +
        '<div class="acciones">' +
        '<button class="btn" id="btn-ant"' + (ex.actual === 0 ? ' disabled' : '') + '>' + ico('izq') + 'Anterior</button>' +
        '<button class="btn" id="btn-marcar" aria-pressed="' + (ex.marcas[id] ? 'true' : 'false') + '">' + ico('bandera') + (ex.marcas[id] ? 'Marcada' : 'Marcar') + '</button>' +
        (ex.resp[id] ? '<button class="btn" id="btn-limpiar">' + ico('x') + 'Borrar respuesta</button>' : '') +
        '<div class="derecha"><button class="btn btn-primario" id="btn-sig"' + (ex.actual === total - 1 ? ' disabled' : '') + '>Siguiente' + ico('der') + '</button></div></div>';
      $$('input[name="op"]', panel).forEach(function (i) {
        i.addEventListener('change', function () { ex.resp[id] = i.value; guardar(); contar(); pintarBotonLimpiar(); });
      });
      $('#btn-ant').addEventListener('click', function () { ir(ex.actual - 1); });
      $('#btn-sig').addEventListener('click', function () { ir(ex.actual + 1); });
      $('#btn-marcar').addEventListener('click', marcar);
      enlazarLimpiar();
      contar();
    }
    function enlazarLimpiar() {
      var b = $('#btn-limpiar');
      if (b) b.addEventListener('click', function () {
        delete ex.resp[ex.ids[ex.actual]]; guardar(); pintar(); var o = $('input[name="op"]'); if (o) o.focus();
      });
    }
    function pintarBotonLimpiar() {
      if (!$('#btn-limpiar')) {
        $('#btn-marcar').insertAdjacentHTML('afterend', '<button class="btn" id="btn-limpiar">' + ico('x') + 'Borrar respuesta</button>');
        enlazarLimpiar();
      }
    }
    function marcar() {
      var id = ex.ids[ex.actual];
      if (ex.marcas[id]) delete ex.marcas[id]; else ex.marcas[id] = true;
      guardar();
      var b = $('#btn-marcar');
      b.setAttribute('aria-pressed', ex.marcas[id] ? 'true' : 'false');
      b.innerHTML = ico('bandera') + (ex.marcas[id] ? 'Marcada' : 'Marcar');
      contar();
    }
    function ir(i) {
      if (i < 0 || i >= total) return;
      ex.actual = i; guardar(); pintar();
      $('#panel-pregunta').scrollIntoView({ block: 'nearest' });
      if (window.innerWidth < 860) window.scrollTo(0, 0);
    }
    function finalizar(porTiempo) {
      var sinResp = ex.ids.filter(function (id) { return !ex.resp[id]; }).length;
      var marc = ex.ids.filter(function (id) { return ex.marcas[id]; }).length;
      var cerrar = function () {
        detenerExamen();
        var intento = calificar(ex);
        var hist = leer(clave('historial'), []);
        hist.unshift(intento);
        escribir(clave('historial'), hist);
        borrar(clave('encurso'));
        location.hash = '#/resultado/' + intento.id;
      };
      if (porTiempo) {
        detenerExamen();
        cerrar();
        informar('Tiempo agotado', '<p>El examen se calificó con las respuestas registradas.</p>');
        return;
      }
      confirmar('Finalizar examen',
        '<p>Respondidas: ' + (total - sinResp) + ' de ' + total + '.</p>' +
        (sinResp ? '<p>Sin responder: ' + sinResp + '. Cuentan como incorrectas.</p>' : '') +
        (marc ? '<p>Marcadas para revisar: ' + marc + '.</p>' : ''),
        'Finalizar y calificar').then(function (ok) { if (ok) cerrar(); });
    }
    $('#btn-finalizar').addEventListener('click', function () { finalizar(false); });

    if (ex.fin) {
      var tick = function () {
        var rest = (ex.fin - Date.now()) / 1000;
        var el = $('#reloj-txt');
        if (!el) return;
        el.textContent = fmtDur(rest);
        $('#reloj').classList.toggle('bajo', rest <= 300);
        if (rest <= 0) finalizar(true);
      };
      tick();
      temporizador = setInterval(tick, 1000);
    }

    teclado = function (ev) {
      if (dialogo.open || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target;
      if (t && (t.tagName === 'INPUT' && t.type !== 'radio' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      var k = ev.key;
      var mapa = { a: 'A', b: 'B', c: 'C', d: 'D', A: 'A', B: 'B', C: 'C', D: 'D', 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
      if (mapa[k]) {
        var inp = $('input[name="op"][value="' + mapa[k] + '"]');
        if (inp) { inp.checked = true; inp.dispatchEvent(new Event('change')); inp.focus(); ev.preventDefault(); }
      } else if (k === 'ArrowRight') { ir(ex.actual + 1); ev.preventDefault(); }
      else if (k === 'ArrowLeft') { ir(ex.actual - 1); ev.preventDefault(); }
      else if (k === 'm' || k === 'M') { marcar(); ev.preventDefault(); }
    };
    document.addEventListener('keydown', teclado);
    pintar();
  }

  function detenerExamen() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
    if (teclado) { document.removeEventListener('keydown', teclado); teclado = null; }
  }

  function calificar(ex) {
    var ahora = Date.now();
    var porEje = {};
    var correctas = 0;
    ex.ids.forEach(function (id) {
      var p = porId[id];
      var e = porEje[p.eje] = porEje[p.eje] || { t: 0, c: 0 };
      e.t++;
      if (ex.resp[id] === p.correcta) { e.c++; correctas++; }
    });
    var puntaje = ex.ids.length ? correctas / ex.ids.length * 100 : 0;
    return {
      id: ex.id, fecha: ahora, inicio: ex.inicio, titulo: ex.titulo, config: ex.config,
      ids: ex.ids, resp: ex.resp, marcas: ex.marcas,
      duracion: Math.round((Math.min(ahora, ex.fin || ahora) - ex.inicio) / 1000),
      total: ex.ids.length, correctas: correctas,
      respondidas: ex.ids.filter(function (id) { return ex.resp[id]; }).length,
      puntaje: Math.round(puntaje * 100) / 100,
      aprobado: puntaje >= APROBATORIO, porEje: porEje
    };
  }

  /* ---------- Resultado ---------- */
  function vistaResultado(idIntento) {
    pintarBarra('historial');
    var hist = leer(clave('historial'), []);
    var it = hist.filter(function (h) { return h.id === idIntento; })[0];
    if (!it) { location.hash = '#/historial'; return; }
    var ids = it.ids.filter(function (id) { return porId[id]; });
    var incorrectas = it.respondidas - it.correctas;
    var sinResp = it.total - it.respondidas;
    var falladas = ids.filter(function (id) { return it.resp[id] !== porId[id].correcta; });

    var filasEje = BANCO.ejes.filter(function (e) { return it.porEje[e.id]; }).map(function (e) {
      var d = it.porEje[e.id]; var pct = d.c / d.t * 100;
      return '<tr><td>' + esc(e.nombre) + '</td><td class="pequeno texto-2">' + (NUCLEOS[e.nucleo] || '').replace('Núcleo ', '') + '</td><td class="n">' + d.t + '</td><td class="n">' + d.c + '</td>' +
        '<td class="n">' + fmtNum(pct) + '<span class="barra-pct ocultar-movil" aria-hidden="true"><span style="width:' + pct + '%"></span></span></td></tr>';
    }).join('');
    var nucleos = {};
    ids.forEach(function (id) {
      var p = porId[id]; var n = nucleos[p.nucleo] = nucleos[p.nucleo] || { t: 0, c: 0 };
      n.t++; if (it.resp[id] === p.correcta) n.c++;
    });
    var filasNucleo = Object.keys(nucleos).map(function (k) {
      var d = nucleos[k];
      return '<tr><td>' + NUCLEOS[k] + '</td><td class="n">' + d.t + '</td><td class="n">' + d.c + '</td><td class="n">' + fmtNum(d.c / d.t * 100) + '</td></tr>';
    }).join('');

    vista.innerHTML =
      '<div class="contenedor pila">' +
      '<div class="fila"><h1 style="margin:0">Resultado</h1><span class="veredicto ' + (it.aprobado ? 'ok' : 'no') + '">' + ico(it.aprobado ? 'check' : 'x') + (it.aprobado ? 'Aprobado' : 'No aprobado') + '</span>' +
      '<span class="pequeno texto-2" style="margin-left:auto">' + esc(it.titulo) + ' &middot; ' + esc(fmtFecha(it.fecha)) + '</span></div>' +
      '<div class="cifras">' +
      '<div class="cifra"><div class="valor">' + fmtNum(it.puntaje) + '</div><div class="rotulo">Puntaje / 100</div></div>' +
      '<div class="cifra"><div class="valor">' + it.correctas + ' / ' + it.total + '</div><div class="rotulo">Correctas</div></div>' +
      '<div class="cifra"><div class="valor">' + incorrectas + ' / ' + sinResp + '</div><div class="rotulo">Incorrectas / sin responder</div></div>' +
      '<div class="cifra"><div class="valor">' + fmtDur(it.duracion) + '</div><div class="rotulo">Tiempo usado</div></div>' +
      '</div>' +
      '<p class="pequeno texto-2">Mínimo aprobatorio: ' + APROBATORIO + ' puntos. ' + (it.aprobado ? 'Supera el mínimo por ' + fmtNum(it.puntaje - APROBATORIO) + ' puntos.' : 'Faltan ' + fmtNum(APROBATORIO - it.puntaje) + ' puntos para el mínimo.') + '</p>' +
      '<div class="fila no-imprimir">' +
      (falladas.length ? '<button class="btn btn-primario" id="btn-repetir">' + ico('repetir') + 'Repetir solo falladas (' + falladas.length + ')</button>' : '') +
      '<button class="btn" data-ir="#/inicio">' + ico('generar') + 'Nuevo examen</button></div>' +
      '<section class="panel"><div class="panel-cab"><h2>Desglose por eje</h2></div><div class="tabla-env"><table>' +
      '<thead><tr><th>Eje</th><th>Núcleo</th><th class="n">Preg.</th><th class="n">Correctas</th><th class="n">%</th></tr></thead><tbody>' + filasEje + '</tbody></table></div></section>' +
      (Object.keys(nucleos).length > 1 ? '<section class="panel"><div class="panel-cab"><h2>Por núcleo</h2></div><div class="tabla-env"><table>' +
        '<thead><tr><th>Núcleo</th><th class="n">Preg.</th><th class="n">Correctas</th><th class="n">%</th></tr></thead><tbody>' + filasNucleo + '</tbody></table></div></section>' : '') +
      '<section class="panel"><div class="panel-cab"><h2>Revisión</h2><div class="segmentos no-imprimir" role="radiogroup" aria-label="Filtro de revisión">' +
      [['todas', 'Todas'], ['falladas', 'Incorrectas'], ['marcadas', 'Marcadas']].map(function (o, i) {
        return '<label><input type="radio" name="filtro" value="' + o[0] + '"' + (i === (falladas.length ? 1 : 0) ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
      }).join('') + '</div></div><div id="revision"></div></section>' +
      '</div>';

    function pintarRevision() {
      var f = $('input[name="filtro"]:checked').value;
      var html = ids.map(function (id, i) {
        var p = porId[id];
        var elegida = it.resp[id];
        var ok = elegida === p.correcta;
        if (f === 'falladas' && ok) return '';
        if (f === 'marcadas' && !(it.marcas && it.marcas[id])) return '';
        var eje = ejePorId[p.eje];
        return '<article class="revision-item">' +
          '<div class="fila" style="margin-bottom:8px"><span class="num">' + (i + 1) + '.</span>' +
          '<span class="' + (ok ? 'estado-ok' : 'estado-no') + ' pequeno fila" style="gap:4px">' + ico(ok ? 'check' : 'x') + (ok ? 'Correcta' : elegida ? 'Incorrecta' : 'Sin responder') + '</span>' +
          '<span style="margin-left:auto" class="fila"><span class="etiqueta">' + esc(eje ? eje.nombre : p.eje) + '</span>' +
          (p.origen === 'real' ? '<span class="etiqueta etiqueta-real">Real</span>' : '') + '</span></div>' +
          '<p class="enunciado" style="font-size:15px">' + esc(p.enunciado) + '</p>' +
          LETRAS.map(function (l) {
            var cls = l === p.correcta ? 'correcta' : (l === elegida ? 'elegida-mal' : '');
            var marca = l === p.correcta ? '<span class="marca-rev estado-ok">' + ico('check') + 'Clave</span>' : (l === elegida ? '<span class="marca-rev estado-no">' + ico('x') + 'Su respuesta</span>' : '');
            if (l === p.correcta && l === elegida) marca = '<span class="marca-rev estado-ok">' + ico('check') + 'Su respuesta</span>';
            return '<div class="op-rev ' + cls + '"><span class="letra">' + l + '</span><span>' + esc(p.opciones[l]) + '</span>' + marca + '</div>';
          }).join('') +
          '<div class="explicacion">' + esc(p.explicacion) + '<div class="fuente">Fuente: ' + esc(p.fuente) + '</div></div>' +
          '</article>';
      }).join('');
      $('#revision').innerHTML = html || '<p class="panel-cuerpo texto-2">No hay preguntas en este filtro.</p>';
    }
    $$('input[name="filtro"]').forEach(function (i) { i.addEventListener('change', pintarRevision); });
    pintarRevision();
    $$('[data-ir]', vista).forEach(function (b) { b.addEventListener('click', function () { location.hash = b.getAttribute('data-ir'); }); });
    var rep = $('#btn-repetir');
    if (rep) rep.addEventListener('click', function () { repetirFalladas(it); });
    vista.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function repetirFalladas(it) {
    var ids = it.ids.filter(function (id) { return porId[id] && it.resp[id] !== porId[id].correcta; });
    if (!ids.length) return;
    var cfg = JSON.parse(JSON.stringify(it.config || {}));
    cfg.modo = 'repaso';
    cfg.minutos = Math.max(1, ids.length);
    var go = function () { crearExamen(barajar(ids), cfg, 'Repaso de falladas'); };
    if (leer(clave('encurso'), null)) {
      confirmar('Reemplazar examen en curso', '<p>Hay un examen sin terminar. Si inicia el repaso, el anterior se descarta.</p>', 'Iniciar repaso', true).then(function (ok) { if (ok) go(); });
    } else go();
  }

  /* ---------- Historial ---------- */
  function vistaHistorial() {
    pintarBarra('historial');
    var hist = leer(clave('historial'), []);
    var n = hist.length;
    var prom = n ? hist.reduce(function (s, h) { return s + h.puntaje; }, 0) / n : 0;
    var mejor = n ? Math.max.apply(null, hist.map(function (h) { return h.puntaje; })) : 0;
    var aprob = hist.filter(function (h) { return h.aprobado; }).length;

    vista.innerHTML =
      '<div class="contenedor pila">' +
      '<div class="fila"><h1 style="margin:0">Historial</h1>' +
      '<span class="fila" style="margin-left:auto"><button class="btn" id="btn-exportar"' + (n ? '' : ' disabled') + '>' + ico('descargar') + 'Exportar</button>' +
      '<label class="btn" for="archivo-importar">' + ico('subir') + 'Importar</label><input type="file" id="archivo-importar" accept="application/json,.json" class="sr"></span></div>' +
      '<div class="aviso pequeno">' + ico('info') + ' El historial se guarda solo en este navegador y dispositivo. Use Exportar e Importar para llevarlo a otro equipo.</div>' +
      (n ? '<div class="cifras">' +
        '<div class="cifra"><div class="valor">' + n + '</div><div class="rotulo">Intentos</div></div>' +
        '<div class="cifra"><div class="valor">' + fmtNum(prom) + '</div><div class="rotulo">Promedio</div></div>' +
        '<div class="cifra"><div class="valor">' + fmtNum(mejor) + '</div><div class="rotulo">Mejor puntaje</div></div>' +
        '<div class="cifra"><div class="valor">' + aprob + '</div><div class="rotulo">Aprobados (&ge; ' + APROBATORIO + ')</div></div></div>' : '') +
      '<section class="panel"><div class="tabla-env">' +
      (n ? '<table><thead><tr><th>Fecha</th><th class="ocultar-movil">Modalidad</th><th class="n">Preg.</th><th class="n">Puntaje</th><th class="ocultar-movil">Resultado</th><th class="n ocultar-movil">Tiempo</th><th><span class="sr">Acciones</span></th></tr></thead><tbody>' +
        hist.map(function (h) {
          var fall = h.ids.filter(function (id) { return porId[id] && h.resp[id] !== porId[id].correcta; }).length;
          return '<tr><td>' + esc(fmtFecha(h.fecha)) + '</td><td class="ocultar-movil">' + esc(h.titulo) + '</td><td class="n">' + h.total + '</td><td class="n"><strong class="' + (h.aprobado ? 'estado-ok' : 'estado-no') + '">' + fmtNum(h.puntaje) + '</strong></td>' +
            '<td class="ocultar-movil"><span class="veredicto ' + (h.aprobado ? 'ok' : 'no') + '">' + (h.aprobado ? 'Aprobado' : 'No aprobado') + '</span></td>' +
            '<td class="n ocultar-movil">' + fmtDur(h.duracion) + '</td>' +
            '<td><span class="fila" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-ver="' + h.id + '" aria-label="Ver resultado">' + ico('ojo') + '<span class="ocultar-movil">Ver</span></button>' +
            (fall ? '<button class="btn" data-rep="' + h.id + '" aria-label="Repetir falladas">' + ico('repetir') + '<span class="ocultar-movil">Falladas (' + fall + ')</span></button>' : '') +
            '<button class="btn btn-peligro" data-del="' + h.id + '" aria-label="Eliminar intento">' + ico('papelera') + '</button></span></td></tr>';
        }).join('') + '</tbody></table>'
        : '<p class="panel-cuerpo texto-2">Aún no hay intentos registrados.</p>') +
      '</div></section></div>';

    $$('[data-ver]').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/resultado/' + b.getAttribute('data-ver'); }); });
    $$('[data-rep]').forEach(function (b) {
      b.addEventListener('click', function () { repetirFalladas(hist.filter(function (h) { return h.id === b.getAttribute('data-rep'); })[0]); });
    });
    $$('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        confirmar('Eliminar intento', '<p>El intento se borrará de este navegador. Esta acción no se puede deshacer.</p>', 'Eliminar', true).then(function (ok) {
          if (!ok) return;
          escribir(clave('historial'), leer(clave('historial'), []).filter(function (h) { return h.id !== b.getAttribute('data-del'); }));
          vistaHistorial();
        });
      });
    });
    $('#btn-exportar').addEventListener('click', function () {
      var datos = { app: 'simulacros-pgn-2026', version: 1, usuario: sesion.usuario, exportado: new Date().toISOString(), historial: leer(clave('historial'), []) };
      var blob = new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'historial-' + sesion.usuario + '-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('#archivo-importar').addEventListener('change', function (ev) {
      var f = ev.target.files[0];
      if (!f) return;
      var lector = new FileReader();
      lector.onload = function () {
        try {
          var d = JSON.parse(lector.result);
          var lista = Array.isArray(d) ? d : d.historial;
          if (!Array.isArray(lista)) throw new Error('formato');
          var validos = lista.filter(function (h) {
            return h && typeof h.id === 'string' && Array.isArray(h.ids) && typeof h.puntaje === 'number' && h.resp && typeof h.resp === 'object';
          });
          var actual = leer(clave('historial'), []);
          var vistos = {}; actual.forEach(function (h) { vistos[h.id] = true; });
          var nuevos = validos.filter(function (h) { return !vistos[h.id]; });
          var unido = actual.concat(nuevos).sort(function (a, b) { return b.fecha - a.fecha; });
          escribir(clave('historial'), unido);
          informar('Importación', '<p>Intentos agregados: ' + nuevos.length + '. Omitidos (repetidos o inválidos): ' + (lista.length - nuevos.length) + '.</p>').then(vistaHistorial);
        } catch (e) {
          informar('Importación', '<p>El archivo no tiene el formato esperado.</p>');
        }
      };
      lector.readAsText(f);
    });
  }

  /* ---------- Enrutador ---------- */
  function ruta() {
    detenerExamen();
    if (dialogo.open) dialogo.close();
    cargarSesion();
    var h = location.hash || '#/';
    if (!sesion) { vistaLogin(); return; }
    window.scrollTo(0, 0);
    if (h.indexOf('#/examen') === 0) vistaExamen();
    else if (h.indexOf('#/resultado/') === 0) vistaResultado(h.slice('#/resultado/'.length));
    else if (h.indexOf('#/historial') === 0) vistaHistorial();
    else {
      if (h !== '#/inicio') { history.replaceState(null, '', '#/inicio'); }
      vistaInicio();
    }
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', ruta);
  ruta();
})();
