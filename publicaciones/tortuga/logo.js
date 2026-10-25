/* Intérprete de Logo para la tarjeta «La tortuga».
   Acepta las primitivas en castellano (las de LogoWriter: avanza, giraderecha, repite, para … fin)
   y en inglés (forward, right, repeat, to … end), con sus abreviaturas.
   Estructura: tokens → árbol → ejecución con generadores (cada movimiento es un paso, así se puede
   animar a la velocidad elegida y detener en cualquier momento). */
(function () {
'use strict';

/* ------------------------------------------------------------ vocabulario --- */
/* Mensajes: el par (castellano, inglés) se elige según el idioma de la página. */
var EN = /^en/i.test(document.documentElement.lang || '');
function t(es, en) { return EN ? en : es; }
var tr = t;
var NOMBRE_EN = {
  avanza: 'forward', retrocede: 'back', giraderecha: 'right', giraizquierda: 'left', ponpos: 'setxy',
  ponrumbo: 'setheading', grosor: 'setpensize', repite: 'repeat', azar: 'random', espera: 'wait'
};
function nombreOrden(n) { return EN && NOMBRE_EN[n] ? NOMBRE_EN[n] : n; }

function pelar(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

// nombre canónico → [cantidad de datos, sinónimos…]
var COMANDOS = {
  avanza:        [1, 'av', 'forward', 'fd'],
  retrocede:     [1, 're', 'back', 'bk'],
  giraderecha:   [1, 'gd', 'right', 'rt'],
  giraizquierda: [1, 'gi', 'left', 'lt'],
  subelapiz:     [0, 'sl', 'penup', 'pu'],
  bajalapiz:     [0, 'bl', 'pendown', 'pd'],
  goma:          [0, 'penerase', 'pe'],
  borrapantalla: [0, 'bp', 'clearscreen', 'cs'],
  limpia:        [0, 'clean'],
  centro:        [0, 'home'],
  ocultatortuga: [0, 'ot', 'hideturtle', 'ht'],
  muestratortuga:[0, 'mt', 'showturtle', 'st'],
  poncolor:      [1, 'poncl', 'pc', 'setpencolor', 'setpc', 'setcolor'],
  ponfondo:      [1, 'pf', 'setbackground', 'setbg'],
  grosor:        [1, 'pongrosor', 'setpensize', 'setwidth', 'setpw'],
  ponpos:        [2, 'ponxy', 'setxy', 'setpos'],
  ponrumbo:      [1, 'pr', 'setheading', 'seth'],
  escribe:       [1, 'es', 'print', 'show'],
  espera:        [1, 'wait']
};
var FUNCIONES = {
  azar:        [1, 'random'],
  raizcuadrada:[1, 'rc', 'sqrt'],
  sen:         [1, 'sin'],
  cos:         [1],
  tan:         [1],
  abs:         [1],
  entero:      [1, 'int'],
  redondea:    [1, 'round'],
  potencia:    [2, 'power'],
  resto:       [2, 'remainder', 'modulo'],
  cuentarepite:[0, 'cr', 'repcount', 'repc'],
  xcor:        [0],
  ycor:        [0],
  rumbo:       [0, 'heading']
};
var ESPECIALES = {
  repite: 'repite', repeat: 'repite',
  si: 'si', if: 'si',
  sisino: 'sisino', ifelse: 'sisino',
  para: 'para', to: 'para',
  fin: 'fin', end: 'fin',
  alto: 'alto', stop: 'alto',
  haz: 'haz', make: 'haz',
  y: 'y', and: 'y', o: 'o', or: 'o', no: 'no', not: 'no'
};
var CANON = {}, CANON_F = {};
Object.keys(COMANDOS).forEach(function (k) { CANON[k] = k; COMANDOS[k].slice(1).forEach(function (s) { CANON[s] = k; }); });
Object.keys(FUNCIONES).forEach(function (k) { CANON_F[k] = k; FUNCIONES[k].slice(1).forEach(function (s) { CANON_F[s] = k; }); });

var COLORES = {
  blanco: '#e6edf3', white: '#e6edf3', rojo: '#f85149', red: '#f85149', verde: '#3fb950', green: '#3fb950',
  azul: '#58a6ff', blue: '#58a6ff', amarillo: '#f2cc60', yellow: '#f2cc60', naranja: '#f0883e', orange: '#f0883e',
  violeta: '#a371f7', violet: '#a371f7', purple: '#a371f7', celeste: '#79c0ff', cyan: '#56d4dd', rosa: '#f778ba',
  pink: '#f778ba', gris: '#8b949e', gray: '#8b949e', grey: '#8b949e', negro: '#0d1117', black: '#0d1117',
  marron: '#a5714a', brown: '#a5714a', lightblue: '#79c0ff', skyblue: '#79c0ff'
};
// paleta numerada, como en el Logo clásico
var PALETA = ['#0d1117', '#58a6ff', '#3fb950', '#56d4dd', '#f85149', '#a371f7', '#f0883e', '#e6edf3',
              '#8b949e', '#79c0ff', '#7ee787', '#a5f3fc', '#ff7b72', '#f778ba', '#f2cc60', '#ffffff'];

function ErrLogo(msg, linea) { this.msg = msg; this.linea = linea; }

/* ---------------------------------------------------------------- tokens --- */
function tokens(src) {
  var out = [], i = 0, linea = 1, n = src.length;
  function push(t, v) { out.push({ t: t, v: v, l: linea }); }
  while (i < n) {
    var c = src[i];
    if (c === '\n') { linea++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === ';') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '[' || c === ']' || c === '(' || c === ')') { push(c); i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      var j = i; while (j < n && /[0-9.]/.test(src[j])) j++;
      push('num', parseFloat(src.slice(i, j))); i = j; continue;
    }
    if (c === ':') {
      var k = i + 1; while (k < n && /[\wÀ-ÿ.]/.test(src[k])) k++;
      if (k === i + 1) throw new ErrLogo(tr('Después de «:» va el nombre de una variable.', 'A variable name must follow “:”.'), linea);
      push('var', pelar(src.slice(i + 1, k))); i = k; continue;
    }
    if (c === '"') {
      var m = i + 1; while (m < n && !/[\s\[\]()]/.test(src[m])) m++;
      push('str', pelar(src.slice(i + 1, m))); i = m; continue;
    }
    if (c === '-') {
      // «-1» pegado al número y separado de lo anterior es un signo, no una resta (como en Logo)
      var antes = i === 0 || /[\s\[(]/.test(src[i - 1]), despues = /[0-9.:(]/.test(src[i + 1] || '');
      push(antes && despues ? 'neg' : 'op', '-'); i++; continue;
    }
    if (c === '<' || c === '>') {
      if (src[i + 1] === '=' || (c === '<' && src[i + 1] === '>')) { push('op', c + src[i + 1]); i += 2; }
      else { push('op', c); i++; }
      continue;
    }
    if ('+*/=%'.indexOf(c) >= 0) { push('op', c); i++; continue; }
    if (/[A-Za-zÀ-ÿ_ñÑ]/.test(c)) {
      var w = i; while (w < n && /[\wÀ-ÿñÑ.?]/.test(src[w])) w++;
      push('word', pelar(src.slice(i, w))); i = w; continue;
    }
    throw new ErrLogo(tr('No entiendo el carácter «' + c + '».', 'I don’t understand the character “' + c + '”.'), linea);
  }
  return out;
}

/* ---------------------------------------------------------------- árbol --- */
function analizar(src, procsPrevios) {
  var tk = tokens(src), p = 0, procs = {};
  // primera pasada: aridad de los procedimientos (pueden llamarse antes de definirse)
  var aridad = {};
  Object.keys(procsPrevios || {}).forEach(function (k) { aridad[k] = procsPrevios[k].params.length; });
  for (var i = 0; i < tk.length; i++) {
    if (tk[i].t === 'word' && ESPECIALES[tk[i].v] === 'para' && tk[i + 1] && tk[i + 1].t === 'word') {
      var c = 0; for (var j = i + 2; j < tk.length && tk[j].t === 'var'; j++) c++;
      aridad[tk[i + 1].v] = c;
    }
  }
  function ver() { return tk[p]; }
  function sig() { return tk[p++]; }
  function lineaAct() { return (tk[p] || tk[tk.length - 1] || { l: 1 }).l; }

  function bloque() {
    var t = sig();
    if (!t || t.t !== '[') throw new ErrLogo(tr('Acá falta un «[» que abra la lista de órdenes.', 'A “[” is missing here to open the list of commands.'), t ? t.l : lineaAct());
    var cuerpo = [];
    while (ver() && ver().t !== ']') cuerpo.push(orden());
    if (!ver()) throw new ErrLogo(tr('Falta cerrar un «]».', 'A “]” is missing to close the list.'), t.l);
    sig();
    return cuerpo;
  }

  function orden() {
    var t = sig();
    if (t.t !== 'word') {
      if (t.t === 'num') throw new ErrLogo(tr('Sobra el número ' + t.v + ': no sé qué hacer con él.', 'Unexpected number ' + t.v + ': I don’t know what to do with it.'), t.l);
      throw new ErrLogo(tr('No esperaba «' + (t.v !== undefined ? t.v : t.t) + '» acá.', 'Unexpected “' + (t.v !== undefined ? t.v : t.t) + '” here.'), t.l);
    }
    var esp = ESPECIALES[t.v];
    if (esp === 'para') {
      var nom = sig();
      if (!nom || nom.t !== 'word') throw new ErrLogo(tr('Después de «para» va el nombre del procedimiento.', 'The procedure name must follow “to”.'), t.l);
      var params = [];
      while (ver() && ver().t === 'var') params.push(sig().v);
      var cuerpo = [];
      while (ver() && !(ver().t === 'word' && ESPECIALES[ver().v] === 'fin')) cuerpo.push(orden());
      if (!ver()) throw new ErrLogo(tr('Falta «fin» al terminar el procedimiento «' + nom.v + '».', 'Missing “end” at the end of procedure “' + nom.v + '”.'), t.l);
      sig();
      procs[nom.v] = { params: params, cuerpo: cuerpo };
      return { k: 'nada' };
    }
    if (esp === 'repite') return { k: 'repite', n: expr(), cuerpo: bloque(), l: t.l };
    if (esp === 'si') {
      var cond = expr(), a = bloque(), b = null;
      if (ver() && ver().t === '[') b = bloque();
      return { k: 'si', c: cond, a: a, b: b, l: t.l };
    }
    if (esp === 'sisino') return { k: 'si', c: expr(), a: bloque(), b: bloque(), l: t.l };
    if (esp === 'alto') return { k: 'alto' };
    if (esp === 'fin') throw new ErrLogo(tr('Sobra un «fin» sin «para».', 'Unexpected “end” without a matching “to”.'), t.l);
    if (esp === 'haz') {
      var v = sig();
      if (!v || (v.t !== 'str' && v.t !== 'word')) throw new ErrLogo(tr('«haz» espera el nombre entre comillas: haz "lado 50', '“make” expects the name in quotes: make "side 50'), t.l);
      return { k: 'haz', nom: v.v, e: expr(), l: t.l };
    }
    if (CANON[t.v]) {
      var cmd = CANON[t.v], na = COMANDOS[cmd][0], args = [];
      for (var q = 0; q < na; q++) {
        if (!ver() || ver().t === ']' || (ver().t === 'word' && !CANON_F[ver().v] && !COLORES[ver().v] && ESPECIALES[ver().v] !== 'no'))
          throw new ErrLogo(tr('A «' + t.v + '» le falta un dato (por ejemplo: ' + t.v + ' 100).', '“' + t.v + '” is missing an input (for example: ' + t.v + ' 100).'), t.l);
        args.push(expr());
      }
      return { k: 'cmd', c: cmd, a: args, l: t.l };
    }
    if (aridad.hasOwnProperty(t.v)) {
      var as = [];
      for (var r = 0; r < aridad[t.v]; r++) {
        if (!ver() || ver().t === ']') throw new ErrLogo(tr('A «' + t.v + '» le faltan datos: necesita ' + aridad[t.v] + '.', '“' + t.v + '” is missing inputs: it needs ' + aridad[t.v] + '.'), t.l);
        as.push(expr());
      }
      return { k: 'llama', nom: t.v, a: as, l: t.l };
    }
    throw new ErrLogo(tr('No sé cómo «' + t.v + '». Si es un procedimiento tuyo, definilo con «para ' + t.v + '» … «fin».', 'I don’t know how to “' + t.v + '”. If it is your own procedure, define it with “to ' + t.v + '” … “end”.'), t.l);
  }

  // expresiones: comparación < suma < producto < signo < átomo
  function expr() { return logica(); }
  function logica() {
    var a = comparacion();
    while (ver() && ver().t === 'word' && (ESPECIALES[ver().v] === 'y' || ESPECIALES[ver().v] === 'o')) {
      var op = ESPECIALES[sig().v]; a = { k: 'op', o: op, a: a, b: comparacion() };
    }
    return a;
  }
  function comparacion() {
    var a = suma();
    while (ver() && ver().t === 'op' && ['=', '<', '>', '<=', '>=', '<>'].indexOf(ver().v) >= 0) {
      var o = sig().v; a = { k: 'op', o: o, a: a, b: suma() };
    }
    return a;
  }
  function suma() {
    var a = producto();
    while (ver() && ver().t === 'op' && (ver().v === '+' || ver().v === '-')) {
      var o = sig().v; a = { k: 'op', o: o, a: a, b: producto() };
    }
    return a;
  }
  function producto() {
    var a = signo();
    while (ver() && ver().t === 'op' && (ver().v === '*' || ver().v === '/' || ver().v === '%')) {
      var o = sig().v; a = { k: 'op', o: o, a: a, b: signo() };
    }
    return a;
  }
  function signo() {
    if (ver() && (ver().t === 'neg' || (ver().t === 'op' && ver().v === '-'))) { sig(); return { k: 'neg', a: signo() }; }
    if (ver() && ver().t === 'word' && ESPECIALES[ver().v] === 'no') { sig(); return { k: 'no', a: signo() }; }
    return atomo();
  }
  function atomo() {
    var t = sig();
    if (!t) throw new ErrLogo(tr('Falta un dato al final.', 'An input is missing at the end.'), lineaAct());
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'var') return { k: 'var', v: t.v, l: t.l };
    if (t.t === 'str') return { k: 'str', v: t.v };
    if (t.t === '(') {
      var e = expr(), c = sig();
      if (!c || c.t !== ')') throw new ErrLogo(tr('Falta cerrar un «)».', 'A “)” is missing to close the parenthesis.'), t.l);
      return e;
    }
    if (t.t === 'word' && CANON_F[t.v]) {
      var f = CANON_F[t.v], args = [];
      for (var i = 0; i < FUNCIONES[f][0]; i++) args.push(signo());
      return { k: 'fn', f: f, a: args, l: t.l };
    }
    if (t.t === 'word' && COLORES[t.v]) return { k: 'str', v: t.v };
    throw new ErrLogo(tr('Esperaba un número o una variable y encontré «' + (t.v !== undefined ? t.v : t.t) + '».', 'I expected a number or a variable and found “' + (t.v !== undefined ? t.v : t.t) + '”.'), t.l);
  }

  var prog = [];
  while (p < tk.length) prog.push(orden());
  return { prog: prog, procs: procs };
}

/* ------------------------------------------------------------ ejecución --- */
function Alto() {}

function Tortuga(lienzo, capa) {
  this.lienzo = lienzo; this.capa = capa;
  this.g = lienzo.getContext('2d'); this.gc = capa.getContext('2d');
  this.procs = {}; this.globales = {};
  this.reiniciar();
}
Tortuga.prototype.reiniciar = function () {
  this.x = 0; this.y = 0; this.rumbo = 0; this.lapiz = true; this.goma = false;
  this.color = '#e6edf3'; this.ancho = 2; this.visible = true; this.fondo = '#111826';
  this.borrar();
};
Tortuga.prototype.escala = function () { return this.lienzo.width / 600; };
Tortuga.prototype.borrar = function () {
  var g = this.g;
  g.fillStyle = this.fondo; g.fillRect(0, 0, this.lienzo.width, this.lienzo.height);
  this.dibujarTortuga();
};
Tortuga.prototype.px = function (x, y) {
  var s = this.escala();
  return [this.lienzo.width / 2 + x * s, this.lienzo.height / 2 - y * s];
};
Tortuga.prototype.mover = function (d) {
  var r = this.rumbo * Math.PI / 180;
  var nx = this.x + d * Math.sin(r), ny = this.y + d * Math.cos(r);
  this.linea(nx, ny);
};
Tortuga.prototype.linea = function (nx, ny) {
  if (this.lapiz) {
    var g = this.g, a = this.px(this.x, this.y), b = this.px(nx, ny);
    g.strokeStyle = this.goma ? this.fondo : this.color;
    g.lineWidth = this.ancho * this.escala() * (this.goma ? 3 : 1);
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  this.x = nx; this.y = ny;
};
Tortuga.prototype.dibujarTortuga = function () {
  var c = this.gc;
  c.clearRect(0, 0, this.capa.width, this.capa.height);
  if (!this.visible) return;
  var s = this.escala(), p = this.px(this.x, this.y), r = this.rumbo * Math.PI / 180;
  c.save(); c.translate(p[0], p[1]); c.rotate(r); c.scale(s, s);
  // caparazón, cabeza y patas
  c.fillStyle = '#3fb950'; c.strokeStyle = '#0d1117'; c.lineWidth = 1.2;
  [[-6, -4], [6, -4], [-6, 6], [6, 6]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1], 3, 2.2, 0, 0, 7); c.fill(); });
  c.beginPath(); c.ellipse(0, -10, 3.2, 4, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#2ea043'; c.beginPath(); c.ellipse(0, 1, 7.5, 9, 0, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(13,17,23,.55)'; c.beginPath(); c.moveTo(-4.5, -3); c.lineTo(4.5, -3); c.moveTo(-4.5, 5); c.lineTo(4.5, 5); c.moveTo(0, -7); c.lineTo(0, 9); c.stroke();
  c.restore();
};

function numero(v, que, l) {
  if (typeof v !== 'number' || isNaN(v)) throw new ErrLogo(tr(((que || 'Esta orden') + ' necesita un número.'), ((que ? nombreOrden(que) : 'This command') + ' needs a number.')), l);
  return v;
}

Tortuga.prototype.valor = function (e, amb) {
  var self = this;
  switch (e.k) {
    case 'num': return e.v;
    case 'str': return e.v;
    case 'var':
      for (var a = amb; a; a = a.padre) if (a.vars.hasOwnProperty(e.v)) return a.vars[e.v];
      if (this.globales.hasOwnProperty(e.v)) return this.globales[e.v];
      throw new ErrLogo(tr('La variable «:' + e.v + '» no tiene valor.', 'Variable “:' + e.v + '” has no value.'), e.l);
    case 'neg': return -numero(this.valor(e.a, amb));
    case 'no': return this.valor(e.a, amb) ? 0 : 1;
    case 'op':
      var x = this.valor(e.a, amb), y = this.valor(e.b, amb);
      switch (e.o) {
        case '+': return x + y; case '-': return x - y; case '*': return x * y;
        case '/': if (y === 0) throw new ErrLogo(tr('División por cero.', 'Division by zero.'), e.l); return x / y;
        case '%': return x % y;
        case '=': return Math.abs(x - y) < 1e-9 || x === y ? 1 : 0;
        case '<>': return Math.abs(x - y) < 1e-9 || x === y ? 0 : 1;
        case '<': return x < y ? 1 : 0; case '>': return x > y ? 1 : 0;
        case '<=': return x <= y ? 1 : 0; case '>=': return x >= y ? 1 : 0;
        case 'y': return x && y ? 1 : 0; case 'o': return x || y ? 1 : 0;
      }
      break;
    case 'fn':
      var v = e.a.map(function (q) { return self.valor(q, amb); });
      switch (e.f) {
        case 'azar': return Math.floor(Math.random() * numero(v[0], 'azar', e.l));
        case 'raizcuadrada': return Math.sqrt(v[0]);
        case 'sen': return Math.sin(v[0] * Math.PI / 180);
        case 'cos': return Math.cos(v[0] * Math.PI / 180);
        case 'tan': return Math.tan(v[0] * Math.PI / 180);
        case 'abs': return Math.abs(v[0]);
        case 'entero': return Math.trunc(v[0]);
        case 'redondea': return Math.round(v[0]);
        case 'potencia': return Math.pow(v[0], v[1]);
        case 'resto': return v[0] % v[1];
        case 'cuentarepite': for (var b = amb; b; b = b.padre) if (b.rep !== undefined) return b.rep; return 0;
        case 'xcor': return Math.round(this.x * 1000) / 1000;
        case 'ycor': return Math.round(this.y * 1000) / 1000;
        case 'rumbo': return ((this.rumbo % 360) + 360) % 360;
      }
  }
  throw new ErrLogo(tr('Expresión que no entiendo.', 'I can’t understand this expression.'), e.l);
};

function colorDe(v, l) {
  if (typeof v === 'number') return PALETA[((Math.round(v) % 16) + 16) % 16];
  if (COLORES[v]) return COLORES[v];
  throw new ErrLogo(tr('No conozco el color «' + v + '». Probá con rojo, verde, azul, amarillo… o un número de 0 a 15.', 'I don’t know the color “' + v + '”. Try red, green, blue, yellow… or a number from 0 to 15.'), l);
}

// cada movimiento hace «yield» para poder animar
Tortuga.prototype.correr = function* (lista, amb, prof) {
  if (prof > 400) throw new ErrLogo(tr('Demasiadas llamadas una dentro de otra: ¿falta la condición de «alto»?', 'Too many nested calls: is the “stop” condition missing?'));
  for (var i = 0; i < lista.length; i++) {
    var o = lista[i], self = this;
    switch (o.k) {
      case 'nada': break;
      case 'alto': throw new Alto();
      case 'haz':
        var val = this.valor(o.e, amb), puesto = false;
        for (var a = amb; a; a = a.padre) if (a.vars.hasOwnProperty(o.nom)) { a.vars[o.nom] = val; puesto = true; break; }
        if (!puesto) this.globales[o.nom] = val;
        break;
      case 'repite':
        var n = Math.floor(numero(this.valor(o.n, amb), 'repite', o.l));
        for (var k = 1; k <= n; k++) yield* this.correr(o.cuerpo, { vars: {}, padre: amb, rep: k }, prof);
        break;
      case 'si':
        if (this.valor(o.c, amb)) yield* this.correr(o.a, { vars: {}, padre: amb }, prof);
        else if (o.b) yield* this.correr(o.b, { vars: {}, padre: amb }, prof);
        break;
      case 'llama':
        var pr = this.procs[o.nom];
        if (!pr) throw new ErrLogo(tr('No hay ningún procedimiento «' + o.nom + '».', 'There is no procedure “' + o.nom + '”.'), o.l);
        var vars = {};
        pr.params.forEach(function (nom, j) { vars[nom] = self.valor(o.a[j], amb); });
        try { yield* this.correr(pr.cuerpo, { vars: vars, padre: null }, prof + 1); }
        catch (e) { if (!(e instanceof Alto)) throw e; }
        break;
      case 'cmd':
        var v = o.a.map(function (q) { return self.valor(q, amb); });
        yield* this.ejecutar(o.c, v, o.l);
        break;
    }
  }
};
Tortuga.prototype.ejecutar = function* (c, v, l) {
  switch (c) {
    case 'avanza': this.mover(numero(v[0], 'avanza', l)); yield 1; break;
    case 'retrocede': this.mover(-numero(v[0], 'retrocede', l)); yield 1; break;
    case 'giraderecha': this.rumbo += numero(v[0], 'giraderecha', l); yield 0; break;
    case 'giraizquierda': this.rumbo -= numero(v[0], 'giraizquierda', l); yield 0; break;
    case 'subelapiz': this.lapiz = false; break;
    case 'bajalapiz': this.lapiz = true; this.goma = false; break;
    case 'goma': this.lapiz = true; this.goma = true; break;
    case 'borrapantalla': this.x = 0; this.y = 0; this.rumbo = 0; this.borrar(); yield 0; break;
    case 'limpia': this.borrar(); yield 0; break;
    case 'centro': this.linea(0, 0); this.rumbo = 0; yield 1; break;
    case 'ocultatortuga': this.visible = false; break;
    case 'muestratortuga': this.visible = true; break;
    case 'poncolor': this.color = colorDe(v[0], l); break;
    case 'ponfondo': this.fondo = colorDe(v[0], l); this.borrar(); break;
    case 'grosor': this.ancho = Math.max(0.5, numero(v[0], 'grosor', l)); break;
    case 'ponpos': this.linea(numero(v[0], 'ponpos', l), numero(v[1], 'ponpos', l)); yield 1; break;
    case 'ponrumbo': this.rumbo = numero(v[0], 'ponrumbo', l); yield 0; break;
    case 'escribe': if (this.alEscribir) this.alEscribir(String(typeof v[0] === 'number' ? Math.round(v[0] * 1e6) / 1e6 : v[0])); break;
    case 'espera': yield { espera: numero(v[0], 'espera', l) }; break;
  }
};

/* ---------------------------------------------------------------- motor --- */
// Corre un programa a la velocidad pedida. vel: órdenes por cuadro (Infinity = de golpe).
Tortuga.prototype.lanzar = function (src, opciones) {
  var self = this;
  this.detener();
  var arbol;
  try { arbol = analizar(src, this.procs); }
  catch (e) { if (e instanceof ErrLogo) { opciones.alError(e); return; } throw e; }
  Object.keys(arbol.procs).forEach(function (k) { self.procs[k] = arbol.procs[k]; });
  if (opciones.limpiar) this.reiniciar();
  var gen = (function* () {
    try { yield* self.correr(arbol.prog, { vars: {}, padre: null }, 0); }
    catch (e) { if (!(e instanceof Alto)) throw e; }
  })();
  var pasos = 0, resto = 0, esperaHasta = 0;
  function cuadro(t) {
    if (self.parado) return;
    if (t < esperaHasta) { self.raf = requestAnimationFrame(cuadro); return; }
    var vel = opciones.velocidad(), presupuesto = vel === Infinity ? 1e9 : vel + resto, hechos = 0;
    var inicio = performance.now();
    try {
      while (hechos < presupuesto) {
        var r = gen.next();
        if (r.done) { self.dibujarTortuga(); self.raf = null; opciones.alTerminar(pasos); return; }
        if (r.value && r.value.espera) { esperaHasta = t + r.value.espera * 1000 / 60; break; }
        pasos++; hechos += r.value === 0 ? 0.25 : 1;
        if (pasos > 400000) throw new ErrLogo(tr('El dibujo pasó las 400 000 órdenes y lo detuve: ¿hay un ciclo sin fin?', 'The drawing went past 400,000 commands and I stopped it: is there an endless loop?'));
        if (vel === Infinity && performance.now() - inicio > 30) break;   // no congelar la página
      }
      resto = presupuesto - hechos;
      if (resto > 1) resto = 0;
    } catch (e) {
      self.dibujarTortuga(); self.raf = null;
      if (e instanceof ErrLogo) { opciones.alError(e); return; }
      throw e;
    }
    self.dibujarTortuga();
    self.raf = requestAnimationFrame(cuadro);
  }
  this.parado = false;
  this.raf = requestAnimationFrame(cuadro);
};
Tortuga.prototype.detener = function () {
  this.parado = true;
  if (this.raf) cancelAnimationFrame(this.raf);
  this.raf = null;
};

window.LogoTortuga = { Tortuga: Tortuga, analizar: analizar, ErrLogo: ErrLogo, EN: EN };
})();
