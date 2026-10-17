/* Semiconductores: diodos, puente rectificador, transistores bipolares y de efecto de campo,
   IGBT, UJT, tiristores y optoacoplador. Formato igual al de s-conexion.js.
   La flecha de los semiconductores marca siempre el sentido convencional de la corriente. */
(function(){
var l = SB.l, g = SB.g, p = SB.p, c = SB.c, r = SB.r, t = SB.t, n = SB.n, ar = SB.ar, pl = SB.pl, pg = SB.pg;
var RAIZ3 = Math.sqrt(3);

/* rótulo de terminal: tamaño 11, clase tenue */
function lb(x, y, s, a){ return t(x, y, s, { z: 11, c: 'e', a: a || 'middle' }); }

/* triángulo del diodo: equilátero y lleno; base en x0, vértice en x0 + h, sobre y */
function tri(x0, y, h, hacia){
  var b = h / RAIZ3, dir = hacia || 1;
  return pg([[x0, y - b], [x0, y + b], [x0 + dir * h, y]], true);
}
/* barra del cátodo en x, de igual alto que la base del triángulo; variantes de norma */
function barra(x, y, h, tipo){
  var b = h / RAIZ3;
  if(tipo === 'zener') return pl([[x - 6, y - b - 3.5], [x, y - b], [x, y + b], [x + 6, y + b + 3.5]]);
  if(tipo === 'schottky') return pl([[x - 7, y - b + 6], [x - 7, y - b], [x, y - b], [x, y + b], [x + 7, y + b], [x + 7, y + b - 6]]);
  if(tipo === 'tunel') return pl([[x - 7, y - b], [x, y - b], [x, y + b], [x - 7, y + b]]);
  return l(x, y - b, x, y + b);
}
/* diodo horizontal sobre y = 40: ánodo a la izquierda, cátodo a la derecha */
function diodo(tipo){
  return l(10, 40, 48, 40) + tri(48, 40, 24) + barra(72, 40, 24, tipo) + l(72, 40, 110, 40);
}
/* rótulos A y K de un diodo */
var AK = lb(24, 33, 'A') + lb(98, 33, 'K');

/* un diodo sobre un lado inclinado, del punto (x1, y1) (ánodo) al (x2, y2) (cátodo), de alto h */
function diodoLado(x1, y1, x2, y2, h){
  var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
  var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, b = h / RAIZ3;
  var bx = mx - ux * h / 2, by = my - uy * h / 2, ax = mx + ux * h / 2, ay = my + uy * h / 2;
  return l(x1, y1, bx, by) + l(ax, ay, x2, y2) +
    pg([[bx - uy * b, by + ux * b], [bx + uy * b, by - ux * b], [ax, ay]], true) +
    l(ax - uy * b, ay + ux * b, ax + uy * b, ay - ux * b);
}

/* dos flechas de luz paralelas: salen (ledf) o entran (a la inversa); diagonal a 45° */
function luz(x1, y1, x2, y2, sale){
  var d = 11;
  var a1 = sale ? ar(x1, y1, x2, y2, 7) : ar(x2, y2, x1, y1, 7);
  var a2 = sale ? ar(x1 + d, y1, x2 + d, y2, 7) : ar(x2 + d, y2, x1 + d, y1, 7);
  return a1 + a2;
}

/* ---------- transistores bipolares ---------- */
/* núcleo: barra de base en bx, a la altura by; colector y emisor salen en diagonal hasta (bx + 20)
   y siguen por la vertical hasta ytop e ybot. pnp invierte el sentido de la flecha del emisor. */
function bjtNucleo(bx, by, pnp, ytop, ybot){
  var ex = bx + 20, cy = by - 19, ey = by + 19, s = '';
  s += g(bx, by - 11, bx, by + 11);
  s += pl([[bx, by - 5], [ex, cy], [ex, ytop]]);
  if(!pnp){
    var q = 0.86, qx = bx + 20 * q, qy = by + 5 + (ey - by - 5) * q; s += ar(bx, by + 5, qx, qy, 8) + l(qx, qy, ex, ey) + l(ex, ey, ex, ybot);
  } else {
    var tx = bx + 8, ty = by + 5 + (ey - by - 5) * 0.4;
    s += l(bx, by + 5, tx, ty) + ar(ex, ey, tx + 0.5, ty + 0.35, 8) + l(ex, ey, ex, ybot);
  }
  return s;
}
function bjt(pnp, circ){
  return l(10, 50, 64, 50) + (circ ? c(78, 50, 20) : '') + bjtNucleo(64, 50, pnp, 6, 94) +
    lb(24, 43, 'B') + lb(92, 16, 'C', 'start') + lb(92, 92, 'E', 'start');
}
function darlington(){
  var X = 14, s = '';
  /* Q1 arriba a la izquierda, Q2 abajo a la derecha */
  s += l(10, 38, X + 36, 38) + bjtNucleo(X + 36, 38, false, 19, 57);
  s += pl([[X + 56, 57], [X + 56, 68], [X + 66, 68]]);
  s += bjtNucleo(X + 66, 68, false, 49, 104);
  /* colectores unidos y terminal de colector hacia arriba */
  s += l(X + 56, 19, X + 86, 19) + l(X + 86, 6, X + 86, 49) + n(X + 86, 19);
  return s + lb(22, 31, 'B') + lb(X + 94, 16, 'C', 'start') + lb(X + 94, 102, 'E', 'start');
}
/* fototransistor: sin terminal de base, dos flechas de luz que entran por la izquierda */
function fototransistor(){
  return c(78, 50, 20) + bjtNucleo(64, 50, false, 6, 94) + luz(16, 22, 38, 44, true) +
    lb(92, 16, 'C', 'start') + lb(92, 92, 'E', 'start');
}

/* ---------- transistores de efecto de campo ---------- */
/* JFET: canal vertical en x = 66; la flecha de compuerta entra (canal N) o sale (canal P) */
function jfet(canalP){
  var s = '';
  s += l(66, 22, 66, 78);
  if(!canalP){
    s += ar(10, 50, 66, 50, 9) + pl([[66, 22], [92, 22], [92, 6]]) + pl([[66, 78], [92, 78], [92, 94]]);
    s += lb(24, 43, 'G') + lb(100, 16, 'D', 'start') + lb(100, 92, 'S', 'start');
  } else {
    s += l(10, 50, 54, 50) + ar(66, 50, 54, 50, 9) + pl([[66, 22], [92, 22], [92, 6]]) + pl([[66, 78], [92, 78], [92, 94]]);
    s += lb(24, 43, 'G') + lb(100, 16, 'S', 'start') + lb(100, 92, 'D', 'start');
  }
  return s;
}
/* MOSFET: placa de compuerta en x = 56, canal en x = 66 (tres segmentos o continuo), terminales en x = 92.
   La flecha del sustrato apunta hacia el canal en el canal N y se aleja de él en el P. El sustrato va
   unido a la fuente (la fuente está abajo en el N y arriba en el P). */
function mosfet(canalP, empob){
  var s = l(10, 50, 56, 50) + l(56, 22, 56, 78), yD = empob ? 22 : 29, yS = empob ? 78 : 71;
  if(empob) s += l(66, 22, 66, 78);
  else s += l(66, 22, 66, 36) + l(66, 43, 66, 57) + l(66, 64, 66, 78);
  if(!canalP){
    s += pl([[66, yD], [92, yD], [92, 6]]) + pl([[66, yS], [92, yS], [92, 94]]);
    s += l(92, 50, 92, yS) + ar(92, 50, 66, 50, 8);
    s += lb(24, 43, 'G') + lb(100, 16, 'D', 'start') + lb(100, 92, 'S', 'start');
  } else {
    s += pl([[66, yD], [92, yD], [92, 6]]) + pl([[66, yS], [92, yS], [92, 94]]);
    s += l(92, 50, 92, yD) + ar(66, 50, 78, 50, 8) + l(78, 50, 92, 50);
    s += lb(24, 43, 'G') + lb(100, 16, 'S', 'start') + lb(100, 92, 'D', 'start');
  }
  return s;
}
/* IGBT: compuerta aislada como la del MOSFET, y colector y emisor como los de un bipolar NPN */
function igbt(){
  return l(10, 50, 50, 50) + l(50, 28, 50, 72) + g(60, 28, 60, 72) +
    pl([[60, 40], [84, 26], [84, 6]]) + ar(60, 60, 84, 74, 9) + l(84, 74, 84, 94) +
    lb(24, 43, 'G') + lb(92, 16, 'C', 'start') + lb(92, 92, 'E', 'start');
}
/* UJT: barra de silicio con las dos bases; la flecha del emisor apunta a la barra */
function ujt(){
  return l(64, 22, 64, 78) + pl([[64, 22], [90, 22], [90, 6]]) + pl([[64, 78], [90, 78], [90, 94]]) +
    l(10, 38, 34, 38) + ar(34, 38, 64, 50, 9) +
    lb(24, 31, 'E') + lb(98, 16, 'B2', 'start') + lb(98, 92, 'B1', 'start');
}

/* ---------- tiristores ---------- */
/* SCR: diodo con la compuerta saliendo del lado del cátodo */
function scr(){
  return l(10, 40, 42, 40) + tri(42, 40, 24) + barra(66, 40, 24) + l(66, 40, 110, 40) +
    pl([[66, 52], [78, 64], [78, 80]]) +
    lb(22, 33, 'A') + lb(98, 33, 'K') + lb(86, 82, 'G', 'start');
}
/* PUT: como el SCR pero con la compuerta del lado del ánodo */
function put(){
  return l(10, 40, 42, 40) + tri(42, 40, 24) + barra(66, 40, 24) + l(66, 40, 110, 40) +
    pl([[50, 49.3], [40, 59.3], [40, 80]]) +
    lb(22, 33, 'A') + lb(98, 33, 'K') + lb(34, 82, 'G', 'end');
}
/* diac y triac: dos diodos en antiparalelo entre dos barras comunes */
function antiparalelo(){
  var b = 20 / RAIZ3 * 1, h = 20, y = 40, s = '';
  s += l(50, y - 2 * b, 50, y + 2 * b) + l(70, y - 2 * b, 70, y + 2 * b);
  s += pg([[50, y - 2 * b], [50, y], [70, y - b]], true);
  s += pg([[70, y], [70, y + 2 * b], [50, y + b]], true);
  s += l(10, y, 50, y) + l(70, y, 110, y);
  return s;
}

SB.add('semis', [
  { id: 'diodo', n: 'Diodo rectificador', v: 'IEC · ANSI', alt: ['diodo', 'diodo de silicio', 'diodo semiconductor'], rel: ['diodo-zener', 'diodo-schottky', 'led', 'puente-rectificador'],
    s: diodo() + AK,
    d: 'Deja pasar la corriente del ánodo (A) al cátodo (K) y la bloquea en sentido contrario. El triángulo apunta hacia donde circula la corriente convencional.',
    x: 'La barra del símbolo corresponde a la banda pintada en el cuerpo del componente. Un diodo de silicio cae entre 0,6 y 0,7 V al conducir; el 1N4007 soporta 1 A y 1000 V inversos.' },
  { id: 'diodo-zener', n: 'Diodo Zener', v: 'IEC · ANSI', alt: ['zener', 'diodo regulador', 'diodo de referencia'], rel: ['diodo', 'tvs-bidireccional', 'diodo-schottky'],
    s: diodo('zener') + AK,
    d: 'Diodo pensado para trabajar polarizado en inversa: al llegar a su tensión de ruptura conduce y mantiene esa tensión casi constante, por lo que sirve para regular o como referencia.',
    x: 'Se conecta con una resistencia en serie que limita la corriente. Valores comunes: 3,3 V, 5,1 V y 12 V; la serie 1N47xx es de 1 W. La barra con los extremos quebrados lo distingue del rectificador.' },
  { id: 'led', n: 'LED (diodo emisor de luz)', v: 'IEC · ANSI', alt: ['led', 'diodo emisor de luz', 'diodo luminoso'], rel: ['fotodiodo', 'optoacoplador', 'diodo'],
    s: diodo() + luz(54, 24, 70, 8, true) + AK,
    d: 'Diodo que emite luz cuando conduce en sentido directo. Las dos flechas salen del símbolo, hacia afuera.',
    x: 'Siempre lleva una resistencia en serie. Cae de 1,8 V (rojo) a unos 3,3 V (azul y blanco) y trabaja con 10 a 20 mA. La pata larga es el ánodo.' },
  { id: 'fotodiodo', n: 'Fotodiodo', v: 'IEC · ANSI', alt: ['diodo fotosensible', 'fotodetector'], rel: ['led', 'fototransistor-npn', 'diodo'],
    s: diodo() + luz(54, 24, 70, 8, false) + AK,
    d: 'Diodo sensible a la luz: al recibirla genera una corriente. Las dos flechas entran al símbolo, desde afuera.',
    x: 'Se lo usa polarizado en inversa: la corriente inversa crece con la luz recibida. Se encuentra en receptores de control remoto, lectores ópticos y fibra óptica.' },
  { id: 'diodo-schottky', n: 'Diodo Schottky', v: 'IEC · ANSI', alt: ['schottky', 'diodo de barrera'], rel: ['diodo', 'diodo-zener'],
    s: diodo('schottky') + AK,
    d: 'Diodo de unión metal-semiconductor con una caída directa baja (0,2 a 0,4 V) y una conmutación muy rápida.',
    x: 'Es el diodo de las fuentes conmutadas y de los cargadores: el 1N5819 soporta 1 A y 40 V. Admite poca tensión inversa. La barra en forma de S lo distingue.' },
  { id: 'diodo-tunel', n: 'Diodo túnel', v: 'IEC · ANSI', alt: ['diodo Esaki', 'túnel'], rel: ['diodo', 'diodo-zener'],
    s: diodo('tunel') + AK,
    d: 'Diodo muy impurificado que presenta una zona de resistencia negativa en la polarización directa: la corriente baja aunque la tensión suba.',
    x: 'Se usó en osciladores y amplificadores de microondas; hoy es poco frecuente. La barra con ambos extremos doblados hacia el ánodo lo identifica.' },
  { id: 'varicap', n: 'Diodo de capacidad variable (varicap)', v: 'IEC · ANSI', alt: ['varicap', 'varactor', 'diodo varactor'], rel: ['diodo'],
    s: l(10, 40, 46, 40) + tri(46, 40, 24) + l(70, 26.1, 70, 53.9) + l(77, 26.1, 77, 53.9) + l(77, 40, 110, 40) + AK,
    d: 'Diodo que se usa polarizado en inversa como capacitor: su capacidad disminuye al aumentar la tensión inversa. La segunda barra recuerda las placas de un capacitor.',
    x: 'Reemplaza al capacitor variable en la sintonía de radios y televisores y en los osciladores controlados por tensión (VCO).' },
  { id: 'tvs-bidireccional', n: 'Supresor de transitorios bidireccional (TVS)', v: 'IEC · ANSI', alt: ['TVS', 'diodo supresor', 'supresor de sobretensión'], rel: ['diodo-zener'],
    s: l(10, 40, 36, 40) + tri(36, 40, 24) + tri(84, 40, 24, -1) + barra(60, 40, 24, 'zener') + l(84, 40, 110, 40),
    d: 'Dos diodos Zener enfrentados con el cátodo en común: conduce y limita la tensión cuando una sobretensión supera su valor, sea de una polaridad o de la otra.',
    x: 'Se conecta en paralelo con lo que protege: entradas de alimentación y líneas de comunicación. En la serie SMBJ las versiones bidireccionales terminan en CA.' },
  { id: 'puente-rectificador', n: 'Puente rectificador', v: 'IEC · ANSI', alt: ['puente de diodos', 'puente de Graetz', 'rectificador de onda completa'], rel: ['diodo'], vb: '0 0 120 118',
    s: l(8, 58, 20, 58) + l(100, 58, 112, 58) + l(60, 4, 60, 18) + l(60, 98, 60, 114) +
       diodoLado(20, 58, 60, 18, 15) + diodoLado(100, 58, 60, 18, 15) +
       diodoLado(60, 98, 20, 58, 15) + diodoLado(60, 98, 100, 58, 15) +
       n(20, 58) + n(100, 58) + n(60, 18) + n(60, 98) +
       t(12, 47, '~', { z: 15, c: 'e' }) + t(108, 47, '~', { z: 15, c: 'e' }) + t(70, 19, '+', { z: 15, c: 'e', a: 'start' }) + t(70, 113, '−', { z: 15, c: 'e', a: 'start' }),
    d: 'Cuatro diodos en rombo que rectifican la corriente alterna en onda completa. Las entradas (~) van a la fuente de alterna y las salidas (+ y −) entregan tensión continua pulsante.',
    x: 'En cada semiciclo conducen dos diodos en serie, por lo que se pierden entre 1,2 y 1,4 V. Viene en un solo encapsulado de cuatro patas (W04, KBL04).' },

  { id: 'bjt-npn', n: 'Transistor bipolar NPN', v: 'IEC · ANSI', alt: ['BJT NPN', 'NPN', 'transistor NPN'], rel: ['bjt-pnp', 'bjt-npn-ci', 'darlington-npn'], vb: '0 0 120 100',
    s: bjt(false, true),
    d: 'Una pequeña corriente de base (B) controla una corriente mucho mayor entre colector (C) y emisor (E). La flecha del emisor sale del símbolo.',
    x: 'Ejemplos: BC548, 2N2222 y BC337. Empieza a conducir con unos 0,6 a 0,7 V entre base y emisor, y el emisor suele ir al negativo.' },
  { id: 'bjt-pnp', n: 'Transistor bipolar PNP', v: 'IEC · ANSI', alt: ['BJT PNP', 'PNP', 'transistor PNP'], rel: ['bjt-npn', 'bjt-pnp-ci'], vb: '0 0 120 100',
    s: bjt(true, true),
    d: 'El complementario del NPN: la flecha del emisor entra al símbolo y todas las polaridades se invierten.',
    x: 'Ejemplos: BC558, 2N3906 y BC327. El emisor suele ir al positivo y la base se lleva a un potencial menor que el del emisor para que conduzca.' },
  { id: 'bjt-npn-ci', n: 'Transistor bipolar NPN (sin círculo)', v: 'IEC · ANSI', alt: ['NPN de circuito integrado', 'NPN sin envolvente'], rel: ['bjt-npn', 'bjt-pnp-ci'], vb: '0 0 120 100',
    s: bjt(false, false),
    d: 'El mismo transistor NPN dibujado sin el círculo, que es la forma habitual en los esquemas de circuitos integrados.',
    x: 'Se lo ve en los espejos de corriente y los pares diferenciales. Es la misma función que la del símbolo con círculo, que indica un componente discreto.' },
  { id: 'bjt-pnp-ci', n: 'Transistor bipolar PNP (sin círculo)', v: 'IEC · ANSI', alt: ['PNP de circuito integrado', 'PNP sin envolvente'], rel: ['bjt-pnp', 'bjt-npn-ci'], vb: '0 0 120 100',
    s: bjt(true, false),
    d: 'El transistor PNP sin círculo, con la flecha del emisor entrando.',
    x: 'Aparece en los mismos esquemas de integrados que el NPN, para las etapas complementarias.' },
  { id: 'darlington-npn', n: 'Transistor Darlington NPN', v: 'IEC · ANSI', alt: ['par Darlington', 'Darlington'], rel: ['bjt-npn'], vb: '0 0 120 110',
    s: darlington(),
    d: 'Dos transistores NPN en cascada: el emisor del primero excita la base del segundo y los colectores están unidos. La ganancia total es el producto de las dos.',
    x: 'Sirve para manejar cargas con muy poca corriente de base (TIP120, BC517). Necesita cerca del doble de tensión base-emisor: alrededor de 1,4 V.' },
  { id: 'fototransistor-npn', n: 'Fototransistor NPN', v: 'IEC · ANSI', alt: ['fototransistor', 'transistor fotosensible'], rel: ['fotodiodo', 'bjt-npn', 'optoacoplador'], vb: '0 0 120 100',
    s: fototransistor(),
    d: 'Transistor NPN cuya corriente de base la genera la luz que incide. Las flechas entran y, en general, no tiene terminal de base.',
    x: 'Es más sensible que el fotodiodo y más lento. Se usa en detectores de ranura y sensores reflectivos (CNY70).' },

  { id: 'jfet-n', n: 'JFET de canal N', v: 'IEC · ANSI', alt: ['FET de juntura canal N', 'JFET'], rel: ['jfet-p', 'mosfet-enr-n'], vb: '0 0 120 100',
    s: jfet(false),
    d: 'Transistor de efecto de campo de juntura: la tensión entre compuerta (G) y fuente (S) controla la corriente entre drenaje (D) y fuente. La flecha de la compuerta entra al canal N.',
    x: 'Conduce con tensión de compuerta cero y se corta con una tensión negativa. Ejemplos: 2N5457, BF245. Su resistencia de entrada es muy alta.' },
  { id: 'jfet-p', n: 'JFET de canal P', v: 'IEC · ANSI', alt: ['FET de juntura canal P'], rel: ['jfet-n', 'mosfet-enr-p'], vb: '0 0 120 100',
    s: jfet(true),
    d: 'El complementario del anterior: la flecha de la compuerta sale del canal P. Por convención, la fuente (S) se dibuja arriba.',
    x: 'Se corta con una tensión positiva de compuerta. Ejemplo: 2N5460. Es mucho menos usado que el de canal N.' },
  { id: 'mosfet-enr-n', n: 'MOSFET de enriquecimiento, canal N', v: 'IEC · ANSI', alt: ['MOSFET N', 'MOS canal N', 'MOSFET de acumulación'], rel: ['mosfet-enr-p', 'mosfet-emp-n', 'igbt'], vb: '0 0 120 100',
    s: mosfet(false, false),
    d: 'Transistor de efecto de campo de compuerta aislada. El canal a trazos indica que no existe hasta que una tensión positiva en la compuerta lo forma. La flecha del sustrato apunta hacia el canal.',
    x: 'Es el más usado para conmutar potencia: IRF540, IRFZ44N y 2N7000. En este símbolo el sustrato está unido a la fuente, abajo.' },
  { id: 'mosfet-enr-p', n: 'MOSFET de enriquecimiento, canal P', v: 'IEC · ANSI', alt: ['MOSFET P', 'MOS canal P'], rel: ['mosfet-enr-n', 'mosfet-emp-p'], vb: '0 0 120 100',
    s: mosfet(true, false),
    d: 'El complementario del anterior: conduce cuando la compuerta está a una tensión negativa respecto de la fuente. La flecha del sustrato se aleja del canal.',
    x: 'Ejemplo: IRF9540. La fuente se dibuja arriba, hacia el positivo, y se usa como interruptor del lado de la alimentación.' },
  { id: 'mosfet-emp-n', n: 'MOSFET de empobrecimiento, canal N', v: 'IEC · ANSI', alt: ['MOSFET de deplexión', 'MOSFET N de vaciamiento'], rel: ['mosfet-emp-p', 'mosfet-enr-n'], vb: '0 0 120 100',
    s: mosfet(false, true),
    d: 'MOSFET con el canal continuo: ya conduce con tensión de compuerta cero y se lo corta con una tensión negativa.',
    x: 'Es poco frecuente. Se encuentra en fuentes de corriente constante y circuitos de arranque (BSS139).' },
  { id: 'mosfet-emp-p', n: 'MOSFET de empobrecimiento, canal P', v: 'IEC · ANSI', alt: ['MOSFET P de deplexión'], rel: ['mosfet-emp-n', 'mosfet-enr-p'], vb: '0 0 120 100',
    s: mosfet(true, true),
    d: 'El complementario del anterior: el canal P continuo conduce con compuerta a cero y se corta con una tensión positiva.',
    x: 'Es el menos común de los cuatro tipos de MOSFET. Con la fuente arriba y el sustrato unido a ella.' },
  { id: 'igbt', n: 'IGBT (canal N)', v: 'IEC · ANSI', alt: ['transistor bipolar de compuerta aislada'], rel: ['mosfet-enr-n', 'bjt-npn'], vb: '0 0 120 100',
    s: igbt(),
    d: 'Transistor bipolar de compuerta aislada: se controla por tensión, como un MOSFET, y conduce como un bipolar. Maneja corrientes altas con poca pérdida.',
    x: 'Está en inversores, variadores de frecuencia, soldadoras y cocinas de inducción (IRG4PC40). Sus terminales son compuerta (G), colector (C) y emisor (E).' },
  { id: 'ujt', n: 'Transistor monounión (UJT)', v: 'IEC · ANSI', alt: ['UJT', 'transistor de unijuntura'], rel: ['put', 'scr'], vb: '0 0 120 100',
    s: ujt(),
    d: 'Una barra de silicio con dos bases (B1 y B2) y un emisor (E). Conduce cuando la tensión del emisor supera una fracción fija de la tensión entre bases. La flecha del emisor apunta a la barra.',
    x: 'Tradicional en osciladores de relajación y en el disparo de tiristores (2N2646).' },

  { id: 'scr', n: 'Tiristor (SCR)', v: 'IEC · ANSI', alt: ['SCR', 'rectificador controlado de silicio', 'tiristor'], rel: ['triac', 'put', 'diodo'], vb: '0 0 120 90',
    s: scr(),
    d: 'Un diodo con compuerta (G) del lado del cátodo. No conduce hasta que un pulso en la compuerta lo dispara; después sigue conduciendo hasta que la corriente cae por debajo de la de mantenimiento.',
    x: 'Conduce solo de A a K. Ejemplos: 2N5060, TYN612, BT151. Se usa en cargadores, reguladores de potencia y circuitos de protección.' },
  { id: 'triac', n: 'Triac', v: 'IEC · ANSI', alt: ['TRIAC', 'tiristor bidireccional'], rel: ['scr', 'diac'], vb: '0 0 120 100',
    s: antiparalelo() + pl([[50, 63.1], [40, 73.1], [40, 92]]) + lb(20, 33, 'A1') + lb(100, 33, 'A2') + lb(47, 90, 'G', 'start'),
    d: 'Interruptor de corriente alterna: dos diodos en antiparalelo con una sola compuerta (G). Un pulso en G, positivo o negativo, lo hace conducir en los dos sentidos.',
    x: 'Atenuadores de luz y control de motores universales (BT136, BTA16). Se apaga cuando la corriente de carga pasa por cero.' },
  { id: 'diac', n: 'Diac', v: 'IEC · ANSI', alt: ['DIAC', 'diodo disparador bidireccional'], rel: ['triac', 'scr'], vb: '0 0 120 80',
    s: antiparalelo() + lb(20, 33, 'A1') + lb(100, 33, 'A2'),
    d: 'Dos diodos en antiparalelo sin compuerta: no conduce hasta superar su tensión de ruptura, cualquiera sea la polaridad, y entonces la tensión baja.',
    x: 'Dispara triacs en los atenuadores de luz. El DB3 conduce a unos 32 V.' },
  { id: 'put', n: 'Transistor monounión programable (PUT)', v: 'IEC · ANSI', alt: ['PUT', 'UJT programable'], rel: ['ujt', 'scr'], vb: '0 0 120 90',
    s: put(),
    d: 'Un tiristor con la compuerta (G) del lado del ánodo: dispara cuando la tensión de ánodo supera la de compuerta. Esa tensión la fija un divisor externo, por eso es programable.',
    x: 'Ejemplos: 2N6027 y 2N6028. Reemplaza al UJT en osciladores de relajación con tiempos largos.' },
  { id: 'optoacoplador', n: 'Optoacoplador', v: 'IEC · ANSI', alt: ['optoaislador', 'acoplador óptico'], rel: ['led', 'fototransistor-npn'], vb: '0 0 140 100',
    s: r(24, 8, 92, 84) +
       pl([[10, 22], [46, 22], [46, 34]]) + pg([[32.1, 34], [59.9, 34], [46, 58]], true) + l(32.1, 58, 59.9, 58) + pl([[46, 58], [46, 78], [10, 78]]) +
       ar(64, 38, 82, 38, 7) + ar(64, 50, 82, 50, 7) +
       g(88, 34, 88, 58) + pl([[88, 41], [104, 29], [104, 22], [130, 22]]) + ar(88, 51, 104, 63, 7) + pl([[104, 63], [104, 78], [130, 78]]) +
       lb(14, 16, 'A') + lb(14, 72, 'K') + lb(124, 16, 'C') + lb(124, 72, 'E'),
    d: 'Un LED y un fototransistor en el mismo encapsulado: la señal pasa por luz, de modo que entrada y salida quedan aisladas eléctricamente.',
    x: 'Ejemplos: 4N25 y PC817. Aísla varios kilovolts. Se usa en fuentes conmutadas y para conectar un microcontrolador con circuitos de potencia.' }
]);
})();
