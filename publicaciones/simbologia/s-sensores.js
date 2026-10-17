/* Sensores y transductores: audio, antenas, temperatura, efecto Hall, celda solar, detectores
   de proximidad (rombo de la IEC 60617) y contactos accionados por una magnitud física. */
(function(){
var l = SB.l, d = SB.d, g = SB.g, p = SB.p, c = SB.c, r = SB.r, t = SB.t, n = SB.n, o = SB.o, ar = SB.ar, pl = SB.pl, pg = SB.pg;

/* contactos de los accionados por una magnitud, sobre y = 56 (la cuchilla y el tope, como en s-conexion.js) */
function contactoNA(){ return l(10, 56, 42, 56) + l(42, 56, 80, 39) + l(82, 56, 110, 56); }
function contactoNC(){ return l(10, 56, 42, 56) + l(42, 56, 87, 43) + l(82, 56, 82, 42) + l(82, 56, 110, 56); }
/* rodillo accionado por una leva: círculo con su varilla a trazos y la flecha del movimiento */
function rodillo(yCuchilla){
  return d(62, 23, 62, yCuchilla) + c(62, 17, 6) + ar(99, 17, 71, 17, 7);
}
/* casilla con la letra de la magnitud que acciona el contacto */
function casilla(letra, z){
  return r(50, 4, 24, 20) + t(62, 18.4, letra, { z: z || 12 });
}
/* diamante del detector de proximidad (IEC 60617) con sus dos terminales */
function rombo(){ return l(10, 40, 32, 40) + pg([[60, 12], [88, 40], [60, 68], [32, 40]]) + l(88, 40, 110, 40); }

SB.add('sensores', [
  { id: 'microfono', n: 'Micrófono', v: 'IEC · ANSI', alt: ['mic', 'transductor sonido a señal'], rel: ['parlante'],
    s: l(10, 40, 48, 40) + c(66, 40, 18) + l(56, 25.03, 56, 54.97) + l(84, 40, 110, 40),
    d: 'Convierte el sonido en una tensión eléctrica que reproduce las variaciones de la presión del aire.',
    x: 'El micrófono electret de las placas de audio da unos milivoltios y necesita un resistor de polarización y un amplificador.' },
  { id: 'parlante', n: 'Parlante (altavoz)', v: 'IEC · ANSI', alt: ['altavoz', 'altoparlante', 'bafle'], rel: ['microfono', 'auricular'],
    s: l(10, 34, 48, 34) + l(10, 46, 48, 46) + r(48, 28, 16, 24) + pg([[64, 28], [90, 12], [90, 68], [64, 52]]),
    d: 'Convierte una corriente eléctrica en sonido: la bobina (el rectángulo) mueve el cono (el trapecio).',
    x: 'Su impedancia típica es de 4 u 8 ohms; no se lo conecta directamente a la salida de un integrado: necesita un amplificador.' },
  { id: 'auricular', n: 'Auricular', v: 'IEC', alt: ['auriculares', 'audífono', 'casco'], rel: ['parlante'],
    s: l(10, 56, 24, 56) + r(24, 46, 12, 20) + p('M30,46 A30,30 0 0 1 90,46') + r(84, 46, 12, 20) + l(96, 56, 110, 56),
    d: 'Un parlante pequeño que se apoya en el oído: dos cápsulas unidas por la vincha.',
    x: 'Se dibuja así en los esquemas didácticos; en los de ingeniería se usa también el símbolo del parlante chico. Los de uso común son de 16 a 32 ohms.' },
  { id: 'zumbador', n: 'Zumbador (buzzer piezoeléctrico)', v: 'IEC', alt: ['buzzer', 'chicharra', 'avisador'], rel: ['timbre-electrico', 'sirena'],
    s: p('M42,46 V32 A18,18 0 0 1 78,32 V46 Z') + l(50, 46, 50, 72) + l(70, 46, 70, 72) + l(35, 60, 41, 60) + l(38, 57, 38, 63),
    d: 'Emite un tono continuo o intermitente. El signo + marca el terminal positivo.',
    x: 'El activo trae su oscilador y suena con solo darle 5 V; el pasivo necesita una señal cuadrada de la frecuencia deseada.' },
  { id: 'timbre-electrico', n: 'Timbre eléctrico', v: 'IEC', alt: ['campana', 'campanilla'], rel: ['zumbador', 'sirena', 'timbre'],
    s: p('M38,46 A22,22 0 0 1 82,46 Z') + l(50, 46, 50, 72) + l(70, 46, 70, 72),
    d: 'Avisador acústico de campana: un electroimán golpea una campanilla.',
    x: 'El de una vivienda funciona a 220 V o a 12 V con transformador, y se acciona con un pulsador.' },
  { id: 'sirena', n: 'Sirena', v: 'IEC', alt: ['alarma sonora', 'avisador de potencia'], rel: ['bocina', 'zumbador'],
    s: l(10, 34, 41.03, 34) + l(10, 46, 41.03, 46) + c(58, 40, 18) +
       p('M79.3,25.09 A26,26 0 0 1 79.3,54.91') + p('M85.85,20.5 A34,34 0 0 1 85.85,59.5') + p('M92.4,15.91 A42,42 0 0 1 92.4,64.09'),
    d: 'Avisador acústico de gran potencia: el círculo es el aparato y los arcos, el sonido que se propaga.',
    x: 'Es el de las alarmas de seguridad y de incendio. Las de 12 V alcanzan 100 dB a un metro. La forma del dibujo varía entre fabricantes.' },
  { id: 'bocina', n: 'Bocina', v: 'IEC', alt: ['claxon', 'trompeta', 'megáfono'], rel: ['sirena', 'parlante'],
    s: l(10, 35, 40, 35) + l(10, 45, 40, 45) + pg([[40, 30], [40, 50], [74, 66], [74, 14]]) +
       p('M83.19,32.29 A12,12 0 0 1 83.19,47.71') + p('M90.85,25.86 A22,22 0 0 1 90.85,54.14') + p('M98.5,19.43 A32,32 0 0 1 98.5,60.57'),
    d: 'Avisador acústico con una trompeta (la bocina) que dirige el sonido, como el claxon de un vehículo.',
    x: 'El claxon de un auto es una bocina de 12 V accionada por un diafragma vibrante.' },

  { id: 'antena', n: 'Antena', v: 'IEC · ANSI', alt: ['antena general', 'antena receptora', 'monopolo'], rel: ['antena-dipolo'],
    s: l(60, 74, 60, 34) + pl([[42, 12], [60, 34], [78, 12]]),
    d: 'Capta o emite ondas de radio: el vástago es la línea que llega al equipo y la horquilla, el elemento irradiante.',
    x: 'Una antena vertical de un cuarto de onda (un látigo) mide unos 75 cm para 100 MHz.' },
  { id: 'antena-dipolo', n: 'Antena dipolo', v: 'IEC', alt: ['dipolo', 'dipolo de media onda'], rel: ['antena'],
    s: l(10, 36, 70, 36) + l(10, 44, 70, 44) + l(70, 8, 70, 36) + l(70, 44, 70, 72),
    d: 'Dos varillas alineadas, alimentadas en el centro por una línea de dos conductores.',
    x: 'El dipolo de media onda mide unos 143 / f metros, con f en MHz, y tiene una impedancia de unos 73 ohms.' },

  { id: 'termocupla', n: 'Termocupla', v: 'IEC', alt: ['termopar', 'par termoeléctrico'], rel: ['rtd'],
    s: pl([[10, 30], [62, 30], [86, 40]]) + pl([[10, 50], [62, 50], [86, 40]], 'gr') + n(86, 40) +
       l(16, 20, 24, 20) + l(20, 16, 20, 24) + l(16, 62, 24, 62) + t(94, 45, 't°', { a: 'start', z: 12, c: 'e' }),
    d: 'Dos metales distintos unidos en un extremo: entre sus terminales aparece una tensión que depende de la temperatura de la unión.',
    x: 'La de tipo K (cromel-alumel) da unos 41 µV por grado. El conductor grueso es el negativo. Se mide con un amplificador de instrumentación.' },
  { id: 'rtd', n: 'Sensor de temperatura RTD (Pt100)', v: 'IEC', alt: ['PT100', 'Pt100', 'RTD', 'termorresistencia'], rel: ['ntc', 'ptc', 'termocupla'],
    s: l(10, 40, 36, 40) + r(36, 32, 48, 16) + l(84, 40, 110, 40) + l(30, 62, 42, 62) + l(42, 62, 78, 20) + t(98, 70, 'Pt100', { z: 11, c: 'e' }),
    d: 'Un resistor de platino cuya resistencia sube con la temperatura de manera casi lineal: 100 ohms a 0 °C y 138,5 ohms a 100 °C.',
    x: 'Es el mismo componente que un termistor, pero estable y preciso: se usa en hornos y procesos industriales. En la medición se usan tres o cuatro cables.' },
  { id: 'hall', n: 'Sensor de efecto Hall', v: 'IEC', alt: ['elemento Hall', 'generador de Hall', 'sonda Hall'],
    s: l(10, 40, 36, 40) + r(36, 24, 48, 32) + l(84, 40, 110, 40) + l(60, 6, 60, 24) + l(60, 56, 60, 74) + l(55, 35, 65, 45) + l(55, 45, 65, 35),
    d: 'Una plaquita por la que circula una corriente (los terminales laterales): en un campo magnético perpendicular aparece una tensión entre los terminales de arriba y abajo.',
    x: 'La cruz indica el campo magnético perpendicular al plano. Se usa para detectar imanes y medir corrientes: A3144 (digital), SS49E (lineal).' },
  { id: 'celda-solar', n: 'Celda solar (fotovoltaica)', v: 'IEC', alt: ['panel solar', 'célula fotovoltaica', 'fotovoltaica'], rel: ['pila'],
    s: l(10, 40, 50, 40) + l(50, 20, 50, 60) + g(62, 30, 62, 50) + l(62, 40, 110, 40) + l(37, 28, 43, 28) + l(40, 25, 40, 31) +
       ar(92, 6, 70, 24, 7) + ar(106, 14, 84, 32, 7),
    d: 'Convierte la luz en energía eléctrica: se dibuja como una pila a la que llegan los rayos del sol (las flechas).',
    x: 'Una celda de silicio da cerca de 0,5 V, y un panel de 36 celdas en serie, unos 20 V en vacío.' },

  { id: 'prox-general', n: 'Detector de proximidad', v: 'IEC 60617', alt: ['sensor de proximidad', 'detector sin contacto'], rel: ['prox-inductivo', 'prox-capacitivo', 'prox-optico'],
    s: rombo(),
    d: 'El rombo es el símbolo de un detector que reacciona al acercarse un objeto, sin tocarlo. El dibujo interior dice el principio de funcionamiento.',
    x: 'En los esquemas de comando se lo dibuja con tres hilos: positivo, negativo y salida.' },
  { id: 'prox-inductivo', n: 'Detector de proximidad inductivo', v: 'IEC 60617', alt: ['sensor inductivo', 'proximidad inductivo'], rel: ['prox-capacitivo', 'prox-optico', 'prox-general'],
    s: rombo() + SB.bob(46, 40, 3, 8, -1),
    d: 'Detecta objetos metálicos que se acercan a la cara activa: la bobina del interior es su oscilador.',
    x: 'El alcance típico es de 1 a 8 mm, y funciona con 10 a 30 V de continua. Es el sensor de posición más usado en las máquinas.' },
  { id: 'prox-capacitivo', n: 'Detector de proximidad capacitivo', v: 'IEC 60617', alt: ['sensor capacitivo', 'proximidad capacitivo'], rel: ['prox-inductivo', 'prox-optico', 'prox-general'],
    s: rombo() + l(54, 28, 54, 52) + l(66, 28, 66, 52),
    d: 'Detecta cualquier material, metálico o no: líquidos, granos, plásticos. Las dos placas del interior son el capacitor que forma con el objeto.',
    x: 'Se usa para detectar el nivel de un líquido a través de la pared de un recipiente de plástico o vidrio.' },
  { id: 'prox-optico', n: 'Detector de proximidad óptico (fotoeléctrico)', v: 'IEC 60617', alt: ['sensor fotoeléctrico', 'barrera de luz', 'célula fotoeléctrica'], rel: ['prox-inductivo', 'prox-capacitivo', 'prox-general', 'ldr'],
    s: rombo() + l(68, 28, 68, 52) + ar(44, 34, 64, 34, 6) + ar(44, 46, 64, 46, 6),
    d: 'Detecta un objeto cuando corta o refleja un haz de luz: las flechas son la luz que llega a la placa receptora.',
    x: 'Hay de barrera (emisor y receptor enfrentados), reflexivos con espejo y de difusión. Alcanza de centímetros a decenas de metros.' },

  { id: 'fin-carrera-na', n: 'Final de carrera (contacto NA)', v: 'IEC', alt: ['interruptor de posición', 'limit switch', 'fin de carrera'], rel: ['fin-carrera-nc', 'final-carrera-na'],
    s: contactoNA() + rodillo(47.05),
    d: 'Un contacto que acciona el rodillo cuando una leva o una pieza en movimiento lo empuja. En reposo está abierto.',
    x: 'Marca el fin del recorrido de un portón, una cinta o un carro. La flecha indica de dónde viene el empuje.' },
  { id: 'fin-carrera-nc', n: 'Final de carrera (contacto NC)', v: 'IEC', alt: ['interruptor de posición', 'limit switch', 'fin de carrera'], rel: ['fin-carrera-na', 'final-carrera-nc'],
    s: contactoNC() + rodillo(50.2),
    d: 'El mismo final de carrera, con un contacto que está cerrado en reposo y se abre al ser accionado.',
    x: 'Se usa en las cadenas de seguridad: si el cable se corta, el circuito se abre y la máquina se detiene.' },
  { id: 'presostato', n: 'Presostato', v: 'IEC', alt: ['interruptor de presión', 'manostato', 'pressure switch'],
    s: contactoNA() + casilla('p') + d(62, 24, 62, 47.05),
    d: 'Un contacto que se acciona cuando la presión de un fluido llega a un valor ajustado. La casilla con la letra p indica la magnitud.',
    x: 'Es el que arranca y detiene el motor del compresor y de la bomba de agua de una vivienda.' },
  { id: 'termostato', n: 'Termostato', v: 'IEC', alt: ['interruptor térmico', 'termóstato'], rel: ['ntc', 'rtd'],
    s: contactoNC() + casilla('t°', 11) + d(62, 24, 62, 50.2),
    d: 'Un contacto que se abre o se cierra al alcanzar una temperatura ajustada. La casilla con t° indica la magnitud.',
    x: 'El de una plancha, una pava eléctrica o una heladera es una lámina bimetálica que se curva con el calor y corta el circuito.' },
  { id: 'nivel-flotante', n: 'Interruptor de nivel (flotante)', v: 'IEC', alt: ['flotante', 'sensor de nivel', 'boya'],
    s: contactoNA() + d(62, 23, 62, 47.05) + c(62, 17, 6) + l(46, 17, 78, 17),
    d: 'Un contacto que acciona un flotador: el círculo es el flotante y la línea horizontal, la superficie del líquido.',
    x: 'Maneja la bomba de un tanque de agua: arranca cuando el nivel baja y se detiene cuando sube. Hay de contacto abierto y cerrado.' }
]);
})();
