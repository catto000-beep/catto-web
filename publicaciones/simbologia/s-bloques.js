/* Integrados y bloques: amplificadores, compuertas lógicas (ANSI e IEC), biestables, reguladores,
   conversores, filtros, multiplexor, oscilador, display. Campos como en s-conexion.js. */
(function(){
var l = SB.l, d = SB.d, g = SB.g, p = SB.p, c = SB.c, r = SB.r, t = SB.t, n = SB.n, o = SB.o, ar = SB.ar, pl = SB.pl, pg = SB.pg;
function f2(v){ return Math.round(v * 100) / 100; }
/* texto con barra encima (señal negada) */
function bar(s){ return '<tspan text-decoration="overline">' + s + '</tspan>'; }

/* ------------------------------------------------------------ compuertas --- */
/* Todas con la punta (o el borde derecho) en x = 80, eje en y = 40, alto 40. La burbuja de negación
   (radio 4) toca el cuerpo en su punta y la salida sigue 8 más allá. */
var PUNTA = 80;
function salida(neg){
  return neg ? c(PUNTA + 4, 40, 4) + l(PUNTA + 8, 40, 110, 40) : l(PUNTA, 40, 110, 40);
}
/* curva trasera cóncava de la OR (bézier de abajo hacia arriba): x de la curva a la altura y */
function xTras(x, W, y){
  var P = [[x, 60], [x + 0.2 * W, 52], [x + 0.2 * W, 28], [x, 20]], a = 0, b = 1, m;
  function bz(u){
    var v = 1 - u;
    return [v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0],
            v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1]];
  }
  for(var i = 0; i < 50; i++){ m = (a + b) / 2; if(bz(m)[1] > y) a = m; else b = m; }
  return bz((a + b) / 2)[0];
}
function cuerpoOR(x, W){
  return p('M' + x + ',20 C' + f2(x + 0.34 * W) + ',20 ' + f2(x + 0.70 * W) + ',27.2 ' + (x + W) + ',40 C' +
    f2(x + 0.70 * W) + ',52.8 ' + f2(x + 0.34 * W) + ',60 ' + x + ',60 C' + f2(x + 0.2 * W) + ',52 ' + f2(x + 0.2 * W) + ',28 ' + x + ',20 Z');
}
/* compuerta ANSI (forma distintiva) */
function ansi(tipo){
  var neg = tipo === 'nand' || tipo === 'nor' || tipo === 'xnor' || tipo === 'not', s = '';
  if(tipo === 'and' || tipo === 'nand'){
    s = p('M40,20 H60 A20,20 0 0 1 60,60 H40 Z') + l(10, 30, 40, 30) + l(10, 50, 40, 50);
  } else if(tipo === 'not' || tipo === 'buffer'){
    s = pg([[44, 20], [44, 60], [80, 40]]) + l(10, 40, 44, 40);
  } else {
    var x = 36, W = 44, gx = (tipo === 'xor' || tipo === 'xnor') ? 7 : 0;
    s = cuerpoOR(x, W);
    if(gx) s += p('M' + (x - gx) + ',60 C' + f2(x - gx + 0.2 * W) + ',52 ' + f2(x - gx + 0.2 * W) + ',28 ' + (x - gx) + ',20');
    [30, 50].forEach(function(y){ s += l(10, y, f2(xTras(x, W, y) - gx), y); });
  }
  return s + salida(neg);
}
/* compuerta IEC (rectángulo con el símbolo de la función) */
function iec(sim, entradas, neg){
  var s = r(36, 20, 44, 40) + t(58, 46, sim, { z: 17 });
  s += entradas === 2 ? l(10, 30, 36, 30) + l(10, 50, 36, 50) : l(10, 40, 36, 40);
  return s + salida(neg);
}
/* amplificadores operacionales: triángulo de 30 a 92, entradas en y = 28 (−) y y = 52 (+) */
function triOp(){ return pg([[30, 12], [30, 68], [92, 40]]); }
function signos(){ return l(35, 28, 42, 28) + l(35, 52, 42, 52) + l(38.5, 48.5, 38.5, 55.5); }
/* biestable: rectángulo con triángulo de reloj */
function reloj(y){ return pg([[36, y - 6], [36, y + 6], [45, y]]); }
/* conversor: rectángulo con diagonal; glifos de señal */
function ondaCA(cx, cy){ return p('M' + (cx - 8) + ',' + cy + ' q4,-8 8,0 t8,0'); }
function lineaCC(cx, cy){
  return l(cx - 8, cy - 3, cx + 8, cy - 3) + l(cx - 8, cy + 3, cx - 5, cy + 3) + l(cx - 2, cy + 3, cx + 1, cy + 3) + l(cx + 4, cy + 3, cx + 8, cy + 3);
}
function conversor(arriba, abajo){
  return l(10, 40, 36, 40) + r(36, 16, 48, 48) + l(36, 64, 84, 16) + l(84, 40, 110, 40) + arriba + abajo;
}
/* filtros: onda sin tachar (pasa) y onda tachada (se rechaza) */
function onda(cx, cy, tachada){
  var s = p('M' + (cx - 10) + ',' + cy + ' q5,-8 10,0 t10,0');
  if(tachada) s += l(cx - 6, cy - 7, cx + 6, cy + 7);
  return s;
}
function filtro(ondas){
  /* recuadro con ondas apiladas (IEC): arriba las frecuencias altas, abajo las bajas;
     cada onda es [y, tachada] y la tachada es la banda que el filtro rechaza */
  var s = l(10, 40, 34, 40) + r(34, 10, 52, 60) + l(86, 40, 110, 40);
  ondas.forEach(function(w){ s += onda(60, w[0], w[1]); });
  return s;
}
/* display de 7 segmentos: letras de los terminales y trazos gruesos */
function pin7(y, letra){ return l(10, y, 40, y) + t(45, y + 2.6, letra, { a: 'start', z: 7.5, c: 'e' }); }

SB.add('bloques', [
  { id: 'amplificador', n: 'Amplificador', v: 'IEC · ANSI', alt: ['amplificador general', 'bloque amplificador'],
    s: l(10, 40, 34, 40) + pg([[34, 12], [34, 68], [90, 40]]) + l(90, 40, 110, 40),
    d: 'Un triángulo que apunta de la entrada a la salida: entrega una señal más grande que la que recibe.',
    x: 'Se usa en los diagramas en bloques para marcar una etapa de ganancia sin dibujar sus transistores. La ganancia se escribe al lado: A = 10, 20 dB.' },
  { id: 'ampop', n: 'Amplificador operacional', v: 'IEC · ANSI', alt: ['AO', 'op-amp', 'operacional'], rel: ['ampop-alim', 'comparador', 'seguidor'],
    s: l(10, 28, 30, 28) + l(10, 52, 30, 52) + triOp() + l(92, 40, 110, 40) + signos(),
    d: 'Amplifica la diferencia entre sus dos entradas: la inversora (−), arriba, y la no inversora (+), abajo.',
    x: 'Con realimentación negativa se arman amplificadores, sumadores, integradores y filtros. LM741, LM358 y TL071 son los más comunes.' },
  { id: 'ampop-alim', n: 'Amplificador operacional con alimentación', v: 'IEC · ANSI', alt: ['op-amp con ±V', 'operacional con fuente partida'], rel: ['ampop'],
    s: l(10, 28, 30, 28) + l(10, 52, 30, 52) + triOp() + l(92, 40, 110, 40) + signos() +
       l(62, 6, 62, 26.5) + l(62, 53.5, 62, 74) + t(67, 17, '+V', { a: 'start', z: 11 }) + t(67, 70, '−V', { a: 'start', z: 11 }),
    d: 'El mismo amplificador operacional con sus dos terminales de alimentación a la vista, arriba el positivo y abajo el negativo.',
    x: 'En un esquema suele omitirse la alimentación, pero el integrado no funciona sin ella. Con fuente partida (±12 V) la salida puede ser positiva o negativa.' },
  { id: 'comparador', n: 'Comparador', v: 'IEC · ANSI', alt: ['comparador de tensión'], rel: ['ampop', 'schmitt'],
    s: l(10, 28, 30, 28) + l(10, 52, 30, 52) + triOp() + l(92, 40, 110, 40) + signos() + pl([[60, 44], [66, 44], [66, 36], [72, 36]]),
    d: 'Compara dos tensiones y entrega un nivel alto o bajo según cuál sea mayor: salida alta si la entrada + supera a la −.',
    x: 'Se dibuja como un amplificador operacional con el escalón en su interior. LM311 y LM393 son comparadores de uso general; trabajan sin realimentación.' },
  { id: 'seguidor', n: 'Seguidor de tensión (buffer)', v: 'IEC · ANSI', alt: ['buffer', 'amplificador de ganancia unitaria', 'seguidor de emisor'], rel: ['ampop'],
    s: l(10, 52, 30, 52) + triOp() + l(92, 40, 110, 40) + l(35, 28, 42, 28) + l(35, 52, 42, 52) + l(38.5, 48.5, 38.5, 55.5) +
       l(20, 28, 30, 28) + pl([[20, 28], [20, 5], [101, 5], [101, 40]]) + n(101, 40),
    d: 'Un amplificador operacional con la salida unida a la entrada inversora: la salida repite la tensión de entrada.',
    x: 'Ganancia 1, impedancia de entrada muy alta e impedancia de salida muy baja. Sirve para aislar una etapa de la siguiente.' },

  { id: 'and-ansi', n: 'Compuerta AND', v: 'ANSI', alt: ['Y', 'compuerta Y'], rel: ['and-iec'],
    s: ansi('and'),
    d: 'La salida vale 1 solo si todas las entradas valen 1.',
    x: 'Equivale a dos interruptores en serie. El 7408 (TTL) y el 4081 (CMOS) traen cuatro compuertas de dos entradas.' },
  { id: 'and-iec', n: 'Compuerta AND', v: 'IEC', alt: ['Y', 'compuerta Y'], rel: ['and-ansi'],
    s: iec('&', 2, false),
    d: 'La salida vale 1 solo si todas las entradas valen 1. En la norma IEC se dibuja un rectángulo con el signo &.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'or-ansi', n: 'Compuerta OR', v: 'ANSI', alt: ['O', 'compuerta O'], rel: ['or-iec'],
    s: ansi('or'),
    d: 'La salida vale 1 si al menos una entrada vale 1.',
    x: 'Equivale a dos interruptores en paralelo. El 7432 (TTL) y el 4071 (CMOS) traen cuatro compuertas.' },
  { id: 'or-iec', n: 'Compuerta OR', v: 'IEC', alt: ['O', 'compuerta O'], rel: ['or-ansi'],
    s: iec('≥1', 2, false),
    d: 'La salida vale 1 si al menos una entrada vale 1. El rectángulo lleva ≥1: alcanza con que una entrada esté activa.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'not-ansi', n: 'Compuerta NOT (inversor)', v: 'ANSI', alt: ['NO', 'inversor lógico', 'negador'], rel: ['not-iec'],
    s: ansi('not'),
    d: 'La salida es lo contrario de la entrada: un 0 la vuelve 1 y un 1 la vuelve 0. El círculo en la salida indica la negación.',
    x: 'El 7404 y el 4069 traen seis inversores por integrado.' },
  { id: 'not-iec', n: 'Compuerta NOT (inversor)', v: 'IEC', alt: ['NO', 'inversor lógico', 'negador'], rel: ['not-ansi'],
    s: iec('1', 1, true),
    d: 'La salida es lo contrario de la entrada. El rectángulo con un 1 es una compuerta que no cambia el valor; el círculo en la salida lo invierte.',
    x: 'El círculo es el indicador de negación de la IEC 60617-12. El pequeño triángulo que aparece en algunos esquemas es otra cosa: el indicador de polaridad (lógica de nivel bajo activo).' },
  { id: 'nand-ansi', n: 'Compuerta NAND', v: 'ANSI', alt: ['NO Y'], rel: ['nand-iec'],
    s: ansi('nand'),
    d: 'Una AND seguida de una NOT: la salida vale 0 solo si todas las entradas valen 1.',
    x: 'Es una compuerta universal: con NAND solas se arma cualquier función lógica. 7400 (TTL), 4011 (CMOS).' },
  { id: 'nand-iec', n: 'Compuerta NAND', v: 'IEC', alt: ['NO Y'], rel: ['nand-ansi'],
    s: iec('&', 2, true),
    d: 'Una AND con la salida negada: rectángulo con & y un círculo en la salida.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'nor-ansi', n: 'Compuerta NOR', v: 'ANSI', alt: ['NO O'], rel: ['nor-iec'],
    s: ansi('nor'),
    d: 'Una OR seguida de una NOT: la salida vale 1 solo si todas las entradas valen 0.',
    x: 'También es universal. 7402 (TTL), 4001 (CMOS).' },
  { id: 'nor-iec', n: 'Compuerta NOR', v: 'IEC', alt: ['NO O'], rel: ['nor-ansi'],
    s: iec('≥1', 2, true),
    d: 'Una OR con la salida negada: rectángulo con ≥1 y un círculo en la salida.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'xor-ansi', n: 'Compuerta XOR', v: 'ANSI', alt: ['O exclusiva', 'OR exclusiva'], rel: ['xor-iec'],
    s: ansi('xor'),
    d: 'La salida vale 1 cuando las dos entradas son distintas. Se distingue de la OR por la segunda curva en la entrada.',
    x: 'Es el sumador de un bit sin acarreo. 7486 (TTL), 4070 (CMOS).' },
  { id: 'xor-iec', n: 'Compuerta XOR', v: 'IEC', alt: ['O exclusiva', 'OR exclusiva'], rel: ['xor-ansi'],
    s: iec('=1', 2, false),
    d: 'La salida vale 1 cuando las dos entradas son distintas. El rectángulo lleva =1: debe haber exactamente una entrada activa.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'xnor-ansi', n: 'Compuerta XNOR', v: 'ANSI', alt: ['NO O exclusiva', 'coincidencia', 'equivalencia'], rel: ['xnor-iec'],
    s: ansi('xnor'),
    d: 'Una XOR con la salida negada: la salida vale 1 cuando las dos entradas son iguales.',
    x: 'Funciona como comparador de igualdad de un bit. 4077 (CMOS).' },
  { id: 'xnor-iec', n: 'Compuerta XNOR', v: 'IEC', alt: ['NO O exclusiva', 'coincidencia', 'equivalencia'], rel: ['xnor-ansi'],
    s: iec('=1', 2, true),
    d: 'Una XOR con la salida negada: rectángulo con =1 y un círculo en la salida.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'buffer-ansi', n: 'Compuerta buffer', v: 'ANSI', alt: ['separador', 'buffer no inversor'], rel: ['buffer-iec', 'tres-estados'],
    s: ansi('buffer'),
    d: 'La salida repite la entrada, sin invertirla. No cambia el valor lógico, pero entrega más corriente.',
    x: 'Se usa para manejar cargas pesadas o líneas largas con una salida débil. El 74HC244 trae ocho.' },
  { id: 'buffer-iec', n: 'Compuerta buffer', v: 'IEC', alt: ['separador', 'buffer no inversor'], rel: ['buffer-ansi'],
    s: iec('1', 1, false),
    d: 'La salida repite la entrada. El rectángulo con un 1 es la identidad lógica.',
    x: 'Es la misma compuerta que la ANSI: cambia solo el dibujo.' },
  { id: 'tres-estados', n: 'Buffer de tres estados', v: 'ANSI', alt: ['tri-state', 'tristate', 'tercer estado', 'alta impedancia'], rel: ['tres-estados-bajo', 'buffer-ansi'],
    s: l(10, 40, 44, 40) + pg([[44, 20], [44, 60], [80, 40]]) + l(80, 40, 110, 40) + l(62, 6, 62, 30) + t(67, 16, 'EN', { a: 'start', z: 10 }),
    d: 'Un buffer con una entrada de habilitación (EN): con EN en 1 pasa la señal; con EN en 0 la salida queda desconectada, en alta impedancia.',
    x: 'Permite que varios dispositivos compartan un mismo bus, siempre que uno solo esté habilitado. El 74HC125 trae cuatro.' },
  { id: 'tres-estados-bajo', n: 'Buffer de tres estados (habilitación en bajo)', v: 'ANSI', alt: ['tri-state', 'habilitación activa en bajo'], rel: ['tres-estados'],
    s: l(10, 40, 44, 40) + pg([[44, 20], [44, 60], [80, 40]]) + l(80, 40, 110, 40) + c(62, 25.4, 4) + l(62, 6, 62, 21.4) +
       t(68, 16, bar('EN'), { a: 'start', z: 10 }),
    d: 'El mismo buffer de tres estados, pero se habilita con un 0: el círculo en la entrada de control indica que es activa en bajo.',
    x: 'En el 74HC125 la habilitación es así (OE activa en bajo).' },
  { id: 'schmitt', n: 'Disparador Schmitt', v: 'IEC · ANSI', alt: ['Schmitt trigger', 'trigger de Schmitt', 'histéresis'], rel: ['schmitt-inv', 'comparador'],
    s: l(10, 40, 36, 40) + pg([[36, 18], [36, 62], [80, 40]]) + l(80, 40, 110, 40) +
       pl([[46, 45], [56, 45], [56, 35], [62, 35]]) + pl([[52, 45], [52, 35], [56, 35]]),
    d: 'Un buffer con histéresis: el nivel de entrada que lo hace subir es mayor que el que lo hace bajar. El dibujo del interior es esa curva.',
    x: 'Limpia señales lentas o con ruido y convierte una senoide en una cuadrada. El 74HC14 trae seis inversores Schmitt.' },
  { id: 'schmitt-inv', n: 'Disparador Schmitt inversor', v: 'IEC · ANSI', alt: ['inversor Schmitt', 'Schmitt trigger inversor'], rel: ['schmitt'],
    s: l(10, 40, 36, 40) + pg([[36, 18], [36, 62], [76, 40]]) + c(80, 40, 4) + l(84, 40, 110, 40) +
       pl([[42, 45], [52, 45], [52, 35], [58, 35]]) + pl([[48, 45], [48, 35], [52, 35]]),
    d: 'El disparador Schmitt con la salida negada: el círculo indica que invierte.',
    x: 'Con una resistencia y un capacitor se arma un oscilador de relajación con un solo integrado.' },

  { id: 'ff-d', n: 'Flip-flop D', v: 'IEC · ANSI', alt: ['biestable D', 'FF D', 'latch D de flanco'], rel: ['ff-jk'],
    s: l(10, 26, 36, 26) + l(10, 54, 36, 54) + r(36, 10, 48, 60) + reloj(54) + l(84, 26, 110, 26) + l(84, 54, 110, 54) +
       t(41, 30.5, 'D', { a: 'start', z: 12 }) + t(51, 57, 'CLK', { a: 'start', z: 9, c: 'e' }) +
       t(79, 30.5, 'Q', { a: 'end', z: 12 }) + t(79, 58.5, bar('Q'), { a: 'end', z: 12 }),
    d: 'Guarda un bit: en cada flanco del reloj (el triángulo), Q copia el valor que tiene D. Q̄ es la salida negada.',
    x: 'Es la celda básica de los registros y los contadores. 7474 (TTL), 74HC74 (CMOS), con dos por integrado.' },
  { id: 'ff-jk', n: 'Flip-flop JK', v: 'IEC · ANSI', alt: ['biestable JK', 'FF JK'], rel: ['ff-d'],
    s: l(10, 20, 36, 20) + l(10, 40, 36, 40) + l(10, 60, 36, 60) + r(36, 8, 48, 64) + reloj(40) +
       l(84, 20, 110, 20) + l(84, 60, 110, 60) +
       t(41, 24.5, 'J', { a: 'start', z: 12 }) + t(41, 64.5, 'K', { a: 'start', z: 12 }) + t(51, 43, 'CLK', { a: 'start', z: 9, c: 'e' }) +
       t(79, 24.5, 'Q', { a: 'end', z: 12 }) + t(79, 64.5, bar('Q'), { a: 'end', z: 12 }),
    d: 'Con J = K = 0 conserva el valor; con J = 1 y K = 0 lo pone en 1; con J = 0 y K = 1 lo pone en 0; con J = K = 1 lo invierte en cada flanco.',
    x: 'Con J = K = 1 divide la frecuencia del reloj por dos: es el bloque de los contadores. 74HC73, 4027.' },

  { id: 'regulador', n: 'Regulador de tensión de tres terminales', v: 'IEC · ANSI', alt: ['regulador lineal', '7805', 'LM78xx'],
    s: l(10, 28, 34, 28) + r(34, 12, 52, 50) + l(86, 28, 110, 28) + l(60, 62, 60, 74) +
       t(41, 32.5, 'E', { a: 'start', z: 12 }) + t(79, 32.5, 'S', { a: 'end', z: 12 }) + t(60, 54, 'C', { z: 12 }),
    d: 'Mantiene fija la tensión de salida (S) aunque cambien la de entrada (E) o la carga. El tercer terminal (C) es el común.',
    x: 'El 7805 da 5 V y el 7812, 12 V; necesitan unos 2 V más de entrada que de salida. Se acompañan con un capacitor en cada extremo.' },

  { id: 'ca-cc', n: 'Conversor CA/CC (rectificador)', v: 'IEC', alt: ['rectificador', 'convertidor CA/CC', 'AC/DC'], rel: ['cc-ca', 'cc-cc'],
    s: conversor(ondaCA(48, 29), lineaCC(72, 51)),
    d: 'Convierte corriente alterna en continua: la señal de entrada va en el triángulo superior y la de salida en el inferior.',
    x: 'Es la etapa de entrada de toda fuente de alimentación: transformador, rectificador y filtro.' },
  { id: 'cc-ca', n: 'Conversor CC/CA (inversor)', v: 'IEC', alt: ['inversor', 'convertidor CC/CA', 'DC/AC'], rel: ['ca-cc', 'cc-cc'],
    s: conversor(lineaCC(48, 29), ondaCA(72, 51)),
    d: 'Convierte corriente continua en alterna.',
    x: 'Un inversor de 12 V a 220 V permite usar aparatos de red desde la batería de un auto. También alimenta los motores de los variadores de velocidad.' },
  { id: 'cc-cc', n: 'Conversor CC/CC', v: 'IEC', alt: ['convertidor CC/CC', 'DC/DC', 'fuente conmutada'], rel: ['ca-cc', 'cc-ca'],
    s: conversor(lineaCC(48, 29), lineaCC(72, 51)),
    d: 'Convierte una tensión continua en otra tensión continua, mayor o menor.',
    x: 'Los reductores (buck) y los elevadores (boost) de las fuentes conmutadas son conversores CC/CC.' },
  { id: 'adc', n: 'Conversor analógico/digital (A/D)', v: 'IEC', alt: ['ADC', 'convertidor A/D'], rel: ['dac'],
    s: l(10, 40, 36, 40) + r(36, 16, 48, 48) + l(36, 64, 84, 16) + l(84, 40, 110, 40) + l(95, 46, 101, 34) +
       t(48, 36, 'A', { z: 13 }) + t(72, 57, 'D', { z: 13 }) + t(98, 27, 'n', { z: 10, c: 'e' }),
    d: 'Convierte una tensión analógica en un número binario de n bits. La barra oblicua en la salida indica que son varias líneas.',
    x: 'El ADC0804 es de 8 bits; el Arduino Uno trae uno de 10 bits en sus entradas analógicas.' },
  { id: 'dac', n: 'Conversor digital/analógico (D/A)', v: 'IEC', alt: ['DAC', 'convertidor D/A'], rel: ['adc'],
    s: l(10, 40, 36, 40) + r(36, 16, 48, 48) + l(36, 64, 84, 16) + l(84, 40, 110, 40) + l(19, 46, 25, 34) +
       t(48, 36, 'D', { z: 13 }) + t(72, 57, 'A', { z: 13 }) + t(22, 27, 'n', { z: 10, c: 'e' }),
    d: 'Convierte un número binario de n bits en una tensión analógica proporcional.',
    x: 'Una red de resistencias R-2R es la forma más simple de armarlo. El MCP4725 es de 12 bits.' },

  { id: 'filtro-pasabajos', n: 'Filtro pasa bajos', v: 'IEC', alt: ['FPB', 'low-pass'], rel: ['filtro-pasaaltos', 'filtro-pasabanda', 'filtro-eliminabanda'],
    s: filtro([[29, true], [51, false]]),
    d: 'Deja pasar las frecuencias bajas y atenúa las altas. Las ondas van de arriba (altas) hacia abajo (bajas); la tachada es la que se rechaza.',
    x: 'Se usa para eliminar el ruido de alta frecuencia y como filtro de salida de una fuente.' },
  { id: 'filtro-pasaaltos', n: 'Filtro pasa altos', v: 'IEC', alt: ['FPA', 'high-pass'], rel: ['filtro-pasabajos', 'filtro-pasabanda', 'filtro-eliminabanda'],
    s: filtro([[29, false], [51, true]]),
    d: 'Deja pasar las frecuencias altas y atenúa las bajas.',
    x: 'Un capacitor en serie con la señal es el filtro pasa altos más simple: bloquea la continua.' },
  { id: 'filtro-pasabanda', n: 'Filtro pasa banda', v: 'IEC', alt: ['FPBanda', 'band-pass'], rel: ['filtro-eliminabanda', 'filtro-pasabajos', 'filtro-pasaaltos'],
    s: filtro([[23, true], [40, false], [57, true]]),
    d: 'Deja pasar solo una banda de frecuencias y atenúa las que están por encima y por debajo.',
    x: 'Es el sintonizador de una radio: elige una emisora entre todas las que llegan a la antena.' },
  { id: 'filtro-eliminabanda', n: 'Filtro elimina banda', v: 'IEC', alt: ['rechaza banda', 'notch', 'band-stop'], rel: ['filtro-pasabanda', 'filtro-pasabajos', 'filtro-pasaaltos'],
    s: filtro([[23, false], [40, true], [57, false]]),
    d: 'Atenúa una banda de frecuencias y deja pasar las demás.',
    x: 'Con una banda muy angosta (filtro notch) se elimina el zumbido de 50 Hz de la red en un amplificador de audio.' },

  { id: 'mux', n: 'Multiplexor', v: 'ANSI', alt: ['MUX', 'selector de datos', 'multiplexor 4 a 1'],
    vb: '0 0 120 98',
    s: l(10, 19, 38, 19) + l(10, 31, 38, 31) + l(10, 43, 38, 43) + l(10, 55, 38, 55) +
       pg([[38, 5], [82, 19], [82, 55], [38, 69]]) + l(82, 37, 110, 37) +
       l(52, 64.5, 52, 78) + l(68, 59.5, 68, 78) +
       t(43, 22, '0', { a: 'start', z: 8, c: 'e' }) + t(43, 34, '1', { a: 'start', z: 8, c: 'e' }) +
       t(43, 46, '2', { a: 'start', z: 8, c: 'e' }) + t(43, 58, '3', { a: 'start', z: 8, c: 'e' }) +
       t(66, 41, 'MUX', { z: 11 }) + t(52, 91, 'S' + SB.sub('1'), { z: 9, c: 'e' }) + t(68, 91, 'S' + SB.sub('0'), { z: 9, c: 'e' }),
    d: 'Elige una de sus cuatro entradas de datos y la lleva a la única salida. Las entradas de selección (S1, S0) indican cuál.',
    x: 'La norma IEC lo dibuja como un rectángulo con la sigla MUX. El 74HC151 es de 8 a 1 y el 74HC153 trae dos de 4 a 1.' },

  { id: 'oscilador', n: 'Oscilador', v: 'IEC', alt: ['generador de señal senoidal', 'bloque oscilador'],
    s: r(34, 16, 52, 48) + p('M44,40 q8,-14 16,0 t16,0') + l(86, 40, 110, 40),
    d: 'Un bloque que genera por sí solo una señal periódica. La senoide marca que la salida es alterna.',
    x: 'Un cristal, una bobina con un capacitor o un resistor con un capacitor fijan la frecuencia. Es el reloj de todo equipo.' },

  { id: 'display7', n: 'Display de siete segmentos', v: 'IEC · ANSI', alt: ['display', 'visualizador', '7 segmentos'],
    vb: '0 0 120 98',
    s: pin7(14, 'a') + pin7(24, 'b') + pin7(34, 'c') + pin7(44, 'd') + pin7(54, 'e') + pin7(64, 'f') + pin7(74, 'g') + pin7(84, 'p') +
       r(40, 4, 60, 90) + l(100, 14, 110, 14) + t(95, 17.2, 'C', { a: 'end', z: 9, c: 'e' }) +
       g(70, 24, 86, 24) + g(88, 26, 88, 45) + g(88, 49, 88, 68) + g(70, 70, 86, 70) + g(68, 49, 68, 68) + g(68, 26, 68, 45) + g(70, 47, 86, 47) +
       c(94, 74, 2.2, true),
    d: 'Siete segmentos luminosos (a a g) y un punto decimal (p), cada uno con su terminal; al encender unos y no otros se forma un número.',
    x: 'Los diodos comparten un terminal común (C): al cátodo en el display de cátodo común, al ánodo en el de ánodo común. Un decodificador (7447, 4511) arma las cifras.' },

  { id: 'ci', n: 'Circuito integrado (bloque genérico)', v: 'IEC · ANSI', alt: ['CI', 'chip', 'integrado', 'DIP'],
    s: l(10, 19, 36, 19) + l(10, 33, 36, 33) + l(10, 47, 36, 47) + l(10, 61, 36, 61) +
       l(84, 19, 110, 19) + l(84, 33, 110, 33) + l(84, 47, 110, 47) + l(84, 61, 110, 61) +
       r(36, 6, 48, 68) + p('M54,6 a6,6 0 0 0 12,0') + c(42, 12, 1.8, true),
    d: 'Un rectángulo con sus terminales: se dibuja así cuando importa qué conexiones tiene, no lo que hay adentro.',
    x: 'La muesca (y el punto) marca dónde empieza la numeración: el terminal 1 es el de arriba a la izquierda y se cuenta en sentido antihorario.' }
]);
})();
