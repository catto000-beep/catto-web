/* Pasivos y electromecánicos: resistores, capacitores, bobinas, transformadores, relé, motor, cristal. */
(function(){
var l = SB.l, d = SB.d, p = SB.p, c = SB.c, r = SB.r, t = SB.t, n = SB.n, o = SB.o, ar = SB.ar, pl = SB.pl;

/* cuerpos y patas de dos terminales sobre y = 40 */
function patas(x1, x2){ return l(10, 40, x1, 40) + l(x2, 40, 110, 40); }
function resIEC(){ return patas(36, 84) + r(36, 32, 48, 16); }
function cap(){ return patas(55, 65) + l(55, 24, 55, 56) + l(65, 24, 65, 56); }
function bob(){ return patas(36, 84) + SB.bob(36, 40, 4, 12, -1); }
/* regulación: flecha cruzada (variable) o trazo con tope (ajustable, preset) */
function varia(x1, y1, x2, y2){ return ar(x1, y1, x2, y2, 8); }
function ajus(x1, y1, x2, y2){
  var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), px = -dy / L * 6, py = dx / L * 6;
  return l(x1, y1, x2, y2) + l(x2 - px, y2 - py, x2 + px, y2 + py);
}
/* termistores y varistor: trazo inclinado con pie horizontal y su leyenda */
function sensible(ley){ return resIEC() + l(30, 62, 42, 62) + l(42, 62, 78, 20) + t(98, 70, ley, { z: 12, c: 'e' }); }

SB.add('pasivos', [
  { id: 'resistor', n: 'Resistor', v: 'IEC', alt: ['resistencia'], rel: ['resistor-ansi'],
    s: resIEC(),
    d: 'Se opone al paso de la corriente y fija la relación entre tensión y corriente: V = I · R.',
    x: 'Su valor se lee en el código de colores o en el número impreso (472 = 4,7 kΩ).' },
  { id: 'resistor-ansi', n: 'Resistor', v: 'ANSI', alt: ['resistencia'], rel: ['resistor'],
    s: patas(36, 84) + SB.zz(36, 84, 40, 4, 9),
    d: 'El mismo resistor con el dibujo norteamericano en zigzag.',
    x: 'Es el que aparece en los esquemas de hojas de datos y en muchos simuladores.' },
  { id: 'potenciometro', n: 'Potenciómetro', v: 'IEC', alt: ['divisor variable'],
    s: resIEC() + ar(60, 74, 60, 50, 8),
    d: 'Un resistor con un cursor que recorre el cuerpo: entre el cursor y cada extremo la resistencia varía.',
    x: 'Tiene tres terminales. Usado como divisor de tensión, es el control de volumen de un equipo de audio.' },
  { id: 'resistor-variable', n: 'Resistor variable (reóstato)', v: 'IEC', alt: ['reóstato'],
    s: resIEC() + varia(38, 62, 84, 18),
    d: 'Resistor cuyo valor se cambia a voluntad durante el uso.',
    x: 'La flecha cruzada indica que el usuario lo maneja.' },
  { id: 'resistor-ajustable', n: 'Resistor ajustable (preset)', v: 'IEC', alt: ['trimpot', 'preset'],
    s: resIEC() + ajus(40, 60, 80, 22),
    d: 'Resistor que se ajusta una vez, con destornillador, al calibrar el equipo.',
    x: 'El trazo con tope, en lugar de flecha, indica ajuste de fábrica o de calibración.' },
  { id: 'ldr', n: 'Fotorresistor (LDR)', v: 'IEC', alt: ['LDR', 'resistor dependiente de la luz'],
    s: resIEC() + ar(30, 6, 45, 24, 7) + ar(46, 4, 61, 22, 7),
    d: 'Su resistencia baja cuando recibe luz: de megaohms en la oscuridad a pocos kiloohms al sol.',
    x: 'Es el sensor de las fotocélulas que encienden el alumbrado público.' },
  { id: 'ntc', n: 'Termistor NTC', v: 'IEC', alt: ['NTC'], rel: ['ptc'],
    s: sensible('−t°'),
    d: 'Resistor cuya resistencia baja cuando sube la temperatura (coeficiente negativo).',
    x: 'Se usa para medir temperatura y para limitar la corriente de encendido de las fuentes.' },
  { id: 'ptc', n: 'Termistor PTC', v: 'IEC', alt: ['PTC'], rel: ['ntc'],
    s: sensible('+t°'),
    d: 'Resistor cuya resistencia sube con la temperatura (coeficiente positivo).',
    x: 'Funciona como fusible rearmable: al calentarse por exceso de corriente, la limita.' },
  { id: 'vdr', n: 'Varistor (VDR)', v: 'IEC', alt: ['VDR', 'MOV'],
    s: sensible('U'),
    d: 'Resistor que depende de la tensión: por encima de cierto valor conduce de golpe.',
    x: 'Se conecta en paralelo con la entrada de red para recortar picos de sobretensión.' },
  { id: 'capacitor', n: 'Capacitor', v: 'IEC · ANSI', alt: ['condensador'],
    s: cap(),
    d: 'Dos placas separadas por un aislante que guardan carga: Q = C · V. Deja pasar la alterna y bloquea la continua.',
    x: 'Los cerámicos y los de poliéster no tienen polaridad.' },
  { id: 'capacitor-polarizado', n: 'Capacitor polarizado', v: 'IEC', alt: ['condensador polarizado'], rel: ['electrolitico'],
    s: cap() + t(44, 26, '+', { z: 16 }),
    d: 'Capacitor que tiene un terminal positivo: se conecta siempre del lado de mayor tensión.',
    x: 'Invertido se calienta y puede explotar.' },
  { id: 'electrolitico', n: 'Capacitor electrolítico', v: 'ANSI', alt: ['condensador electrolítico'], rel: ['capacitor-polarizado'],
    s: l(10, 40, 54, 40) + l(54, 24, 54, 56) + p('M70,24 Q62,40 70,56') + l(66, 40, 110, 40) + t(43, 26, '+', { z: 16 }),
    d: 'Capacitor polarizado de gran capacidad. La placa curva es el negativo.',
    x: 'En el cuerpo, la franja con signos «−» marca el terminal negativo. Son los de filtro de las fuentes.' },
  { id: 'capacitor-variable', n: 'Capacitor variable', v: 'IEC',
    s: cap() + varia(38, 64, 82, 16),
    d: 'Capacitor cuya capacidad se cambia girando un eje: las placas se enfrentan más o menos.',
    x: 'Es el sintonizador de las radios antiguas.' },
  { id: 'trimmer', n: 'Capacitor ajustable (trimmer)', v: 'IEC', alt: ['trimmer'],
    s: cap() + ajus(40, 62, 80, 20),
    d: 'Capacitor que se ajusta una vez al calibrar el circuito.',
    x: 'Se usa para afinar osciladores y filtros de RF.' },
  { id: 'bobina', n: 'Bobina (inductor)', v: 'IEC · ANSI', alt: ['inductor', 'inductancia', 'choque'],
    s: bob(),
    d: 'Un alambre arrollado que se opone a los cambios de corriente y guarda energía en su campo magnético.',
    x: 'Deja pasar la continua y se opone a la alterna: X_L = 2πfL.' },
  { id: 'bobina-hierro', n: 'Bobina con núcleo de hierro', v: 'IEC', alt: ['reactor', 'choque de hierro'],
    s: bob() + l(36, 28, 84, 28) + l(36, 23, 84, 23),
    d: 'Las dos líneas paralelas representan un núcleo de chapas de hierro, que aumenta la inductancia.',
    x: 'Es el balasto de los tubos fluorescentes antiguos.' },
  { id: 'bobina-ferrita', n: 'Bobina con núcleo de ferrita', v: 'IEC', alt: ['choque de ferrita'],
    s: bob() + d(36, 28, 84, 28) + d(36, 23, 84, 23),
    d: 'Núcleo de ferrita, un material magnético que no conduce: sirve a frecuencias altas.',
    x: 'Se usa en las fuentes conmutadas y en los filtros de RF.' },
  { id: 'bobina-variable', n: 'Bobina variable', v: 'IEC',
    s: bob() + varia(38, 62, 84, 14),
    d: 'Bobina cuya inductancia se cambia durante el uso, por ejemplo moviendo el núcleo.',
    x: 'Se usa para sintonizar circuitos resonantes.' },
  { id: 'bobina-ajustable', n: 'Bobina ajustable', v: 'IEC',
    s: bob() + ajus(40, 60, 80, 18),
    d: 'Bobina con un núcleo roscado que se ajusta al calibrar.',
    x: 'Las frecuencias intermedias de los receptores se ajustan así.' },
  { id: 'transformador', n: 'Transformador con núcleo de hierro', v: 'IEC', alt: ['trafo'], rel: ['transformador-aire', 'transformador-toma'],
    vb: '0 0 120 90',
    s: o(10, 21) + l(13, 21, 44, 21) + SB.bobv(44, 21, 4, 12, 1) + l(44, 69, 13, 69) + o(10, 69) +
       o(110, 21) + l(107, 21, 76, 21) + SB.bobv(76, 21, 4, 12, -1) + l(76, 69, 107, 69) + o(110, 69) +
       l(57, 16, 57, 74) + l(63, 16, 63, 74),
    d: 'Dos bobinas sobre un mismo núcleo: transfiere energía de una a otra cambiando la tensión en la proporción de las vueltas.',
    x: 'V₂ / V₁ = N₂ / N₁. Solo funciona con corriente alterna.' },
  { id: 'transformador-aire', n: 'Transformador con núcleo de aire', v: 'IEC', rel: ['transformador'],
    vb: '0 0 120 90',
    s: o(10, 21) + l(13, 21, 44, 21) + SB.bobv(44, 21, 4, 12, 1) + l(44, 69, 13, 69) + o(10, 69) +
       o(110, 21) + l(107, 21, 76, 21) + SB.bobv(76, 21, 4, 12, -1) + l(76, 69, 107, 69) + o(110, 69),
    d: 'Dos bobinas acopladas sin núcleo magnético.',
    x: 'Se usa en radiofrecuencia, donde el hierro tendría demasiadas pérdidas.' },
  { id: 'transformador-toma', n: 'Transformador con punto medio', v: 'IEC', alt: ['toma central'], rel: ['transformador'],
    vb: '0 0 120 90',
    s: o(10, 21) + l(13, 21, 44, 21) + SB.bobv(44, 21, 4, 12, 1) + l(44, 69, 13, 69) + o(10, 69) +
       o(110, 21) + l(107, 21, 76, 21) + SB.bobv(76, 21, 4, 12, -1) + l(76, 69, 107, 69) + o(110, 69) +
       l(76, 45, 107, 45) + o(110, 45) + l(57, 16, 57, 74) + l(63, 16, 63, 74),
    d: 'El secundario tiene una salida en el medio del bobinado: entrega dos tensiones iguales y opuestas.',
    x: 'Es el de las fuentes partidas (±12 V) y los rectificadores de onda completa con dos diodos.' },
  { id: 'autotransformador', n: 'Autotransformador', v: 'IEC', rel: ['variac'],
    vb: '0 0 120 90',
    s: o(10, 15) + l(13, 15, 56, 15) + SB.bobv(56, 15, 5, 12, 1) + l(13, 75, 107, 75) + o(10, 75) + o(110, 75) + n(56, 75) +
       l(62, 45, 107, 45) + o(110, 45),
    d: 'Un solo bobinado con una toma intermedia: la entrada y la salida comparten parte de las vueltas.',
    x: 'Es más chico que un transformador, pero no aísla la salida de la red.' },
  { id: 'variac', n: 'Autotransformador variable (variac)', v: 'IEC', alt: ['variac'], rel: ['autotransformador'],
    vb: '0 0 120 90',
    s: o(10, 15) + l(13, 15, 56, 15) + SB.bobv(56, 15, 5, 12, 1) + l(13, 75, 107, 75) + o(10, 75) + o(110, 75) + n(56, 75) +
       ar(96, 45, 65, 45, 8) + l(96, 45, 107, 45) + o(110, 45),
    d: 'Autotransformador con un cursor que recorre el bobinado: la tensión de salida va de cero a la de entrada.',
    x: 'Se usa en el laboratorio para alimentar equipos con tensión de red regulable.' },
  { id: 'cristal', n: 'Cristal de cuarzo', v: 'IEC · ANSI', alt: ['cristal', 'resonador'],
    s: patas(44, 76) + l(44, 26, 44, 54) + r(50, 28, 20, 24) + l(76, 26, 76, 54),
    d: 'Una lámina de cuarzo que vibra a una frecuencia muy precisa (efecto piezoeléctrico).',
    x: 'Da el reloj de los microcontroladores: 16 MHz en el Arduino, 32 768 Hz en los relojes.' },
  { id: 'impedancia', n: 'Impedancia', v: 'IEC', alt: ['carga genérica'],
    s: patas(36, 84) + r(36, 27, 48, 26) + t(60, 45, 'Z', { z: 13 }),
    d: 'Una carga cualquiera que combina resistencia y reactancia: Z = R + jX.',
    x: 'Se usa en los esquemas de cálculo de alterna.' },
  { id: 'rele', n: 'Relé', v: 'IEC', alt: ['relevador'], vb: '0 0 140 84',
    s: l(32, 8, 32, 32) + r(20, 32, 24, 28) + l(32, 60, 32, 76) + t(12, 50, 'K', { z: 12, c: 'e' }) +
       l(58, 52, 76, 52) + l(76, 52, 104, 38) + l(106, 52, 132, 52) + d(44, 46, 88, 46),
    d: 'Una bobina que, al recibir corriente, mueve un contacto: un circuito chico maneja uno grande y aislado.',
    x: 'La línea a trazos une la bobina con su contacto. La bobina se marca con K y sus bornes son A1 y A2.' },
  { id: 'motor', n: 'Motor', v: 'IEC · ANSI',
    s: l(10, 40, 40, 40) + c(60, 40, 20) + l(80, 40, 110, 40) + t(60, 46, 'M', { z: 16 }),
    d: 'Una máquina que convierte energía eléctrica en movimiento.',
    x: 'Se agrega «=» si es de continua o «3~» si es trifásico de alterna.' },
  { id: 'generador', n: 'Generador', v: 'IEC · ANSI', alt: ['dínamo', 'alternador'],
    s: l(10, 40, 40, 40) + c(60, 40, 20) + l(80, 40, 110, 40) + t(60, 46, 'G', { z: 16 }),
    d: 'Una máquina que convierte movimiento en energía eléctrica.',
    x: 'El alternador del auto y los generadores de las centrales.' }
]);
})();
