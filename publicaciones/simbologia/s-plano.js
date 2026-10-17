/* Plano de la instalación (planta de una vivienda): bocas, tomacorrientes, llaves, tableros,
   cañerías y conductores. Referencia: IRAM 2010 (basada en IEC 60617) y AEA 90364. */
(function(){
var l = SB.l, d = SB.d, g = SB.g, p = SB.p, c = SB.c, r = SB.r, t = SB.t, n = SB.n, o = SB.o, ar = SB.ar, pl = SB.pl, pg = SB.pg;
function a(v){ return Math.round(v * 100) / 100; }

/* círculo con cruz en X, con las puntas de la cruz apoyadas sobre el círculo */
function boca(cx, cy, R){
  var e = R * 0.7071;
  return c(cx, cy, R) + l(cx - e, cy - e, cx + e, cy + e) + l(cx - e, cy + e, cx + e, cy - e);
}
/* hoja de ventilador, rotada ang grados alrededor de (cx, cy) */
function hoja(cx, cy, ang){
  var A = ang * Math.PI / 180, up = [], dn = [], i, N = 8;
  for(i = 0; i <= N; i++){
    var u = i / N, x = 7 + 25 * u, w = 7.5 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1));
    up.push([x, -w]); dn.unshift([x, w]);
  }
  return pg(up.concat(dn).map(function(q){
    return [cx + q[0] * Math.cos(A) - q[1] * Math.sin(A), cy + q[0] * Math.sin(A) + q[1] * Math.cos(A)];
  }));
}
/* tomacorriente: semicírculo apoyado sobre la línea de la pared, base en y = cy */
function toma(cx, cy, R){
  R = R || 20;
  return l(cx - R - 7, cy, cx + R + 7, cy) + p('M' + a(cx - R) + ',' + cy + ' a' + R + ',' + R + ' 0 0 1 ' + (2 * R) + ',0');
}
/* trazos radiales que indican la cantidad de tomas: n trazos centrados sobre el arco */
function trazos(cx, cy, R, ang, k){
  var s = '', i;
  for(i = 0; i < k; i++){
    var A = (k === 1 ? 0 : -ang + 2 * ang * i / (k - 1)) * Math.PI / 180;
    s += l(cx + R * Math.sin(A), cy - R * Math.cos(A), cx + (R + 8) * Math.sin(A), cy - (R + 8) * Math.cos(A));
  }
  return s;
}
/* contacto de tierra: tallo con travesaño en T sobre el arco */
function tee(cx, cy, R){
  return l(cx, cy - R, cx, cy - R - 10) + l(cx - 6, cy - R - 10, cx + 6, cy - R - 10);
}
/* llave en planta: círculo de pared, línea a 45° y banderas (una por efecto).
   nd = banderas a la derecha-abajo, ni = a la izquierda-arriba */
function llave(nd, ni){
  var cx = 42, cy = 60, R = 5.5, ux = 0.7071, uy = -0.7071, vx = 0.7071, vy = 0.7071, L = 48;
  var ex = cx + L * ux, ey = cy + L * uy, s = c(cx, cy, R) + l(cx + R * ux, cy + R * uy, ex, ey), k;
  for(k = 0; k < nd; k++){
    var px = ex - k * 7 * ux, py = ey - k * 7 * uy;
    s += l(px, py, px + 10 * vx, py + 10 * vy);
  }
  for(k = 0; k < ni; k++){
    var qx = ex - k * 7 * ux, qy = ey - k * 7 * uy;
    s += l(qx, qy, qx - 10 * vx, qy - 10 * vy);
  }
  return s;
}
/* trazos de conductores sobre una cañería horizontal en y = 40 */
function larga(x){ return l(x - 5, 50, x + 5, 30); }
function corta(x){ return l(x - 3, 45, x + 3, 35); }
function tierraC(x){ return l(x - 5, 50, x + 5, 30) + c(x + 5, 30, 2.4, true); }

SB.add('plano', [
  /* ------------------------------------------------------------- iluminación */
  { id: 'boca-techo', n: 'Boca de techo (centro)', v: 'IRAM 2010', alt: ['centro', 'boca de luz', 'luminaria de techo'],
    s: boca(60, 40, 20),
    d: 'Salida de iluminación en el techo: el lugar donde se cuelga o se fija la luminaria.',
    x: 'Se acompaña con la sigla del circuito y la potencia. La caja que la sostiene es octogonal.',
    rel: ['boca-pared', 'fluorescente', 'emergencia', 'ventilador'] },
  { id: 'boca-pared', n: 'Boca de pared (brazo)', v: 'IRAM 2010', alt: ['aplique', 'brazo', 'luz de pared'],
    s: boca(60, 36, 16) + l(60, 52, 60, 58) + l(32, 58, 88, 58),
    d: 'Salida de iluminación sobre una pared: el círculo con cruz apoyado sobre la línea del muro.',
    x: 'Se ubica a unos 2 m de altura. Es la forma más difundida en los planos argentinos: la raya es la pared.',
    rel: ['boca-techo'] },
  { id: 'fluorescente', n: 'Artefacto fluorescente', v: 'IRAM 2010', alt: ['tubo fluorescente', 'regleta'],
    s: r(14, 26, 92, 28) + l(22, 40, 98, 40),
    d: 'Artefacto de tubo fluorescente o de tubo LED. El rectángulo representa el artefacto y la raya, el tubo.',
    x: 'Si el artefacto lleva dos tubos se dibujan dos rayas. Se acota el largo cuando importa la ubicación.',
    rel: ['fluorescente-doble', 'boca-techo'] },
  { id: 'fluorescente-doble', n: 'Artefacto fluorescente de dos tubos', v: 'IRAM 2010', alt: ['fluorescente doble'],
    s: r(14, 26, 92, 28) + l(22, 34, 98, 34) + l(22, 46, 98, 46),
    d: 'El mismo artefacto con dos tubos: una raya por cada tubo.',
    x: 'Es el que se usa en cocinas, talleres y oficinas, donde se necesita más luz.',
    rel: ['fluorescente'] },
  { id: 'emergencia', n: 'Luz de emergencia', v: 'IRAM 2010', alt: ['luminaria de emergencia', 'luz autónoma'],
    s: boca(60, 40, 20) + p('M60,40 L45.9,25.9 A20,20 0 0 1 74.1,25.9 Z', 'f') + p('M60,40 L45.9,54.1 A20,20 0 0 0 74.1,54.1 Z', 'f'),
    d: 'Luminaria autónoma con batería: se enciende sola cuando falta la tensión de la red.',
    x: 'Algunos planos la marcan con una E dentro del círculo; la leyenda del plano es la que manda.',
    rel: ['boca-techo'] },
  { id: 'ventilador', n: 'Ventilador de techo', v: 'IRAM 2010', alt: ['ventilador', 'paleta'],
    s: hoja(60, 40, 45) + hoja(60, 40, 135) + hoja(60, 40, 225) + hoja(60, 40, 315) + c(60, 40, 6, true),
    d: 'Boca con ventilador de techo. Las palas dibujadas indican que no es una luminaria común.',
    x: 'Necesita un gancho y una caja aptos para soportar su peso y su vibración; muchas veces lleva llave propia.',
    rel: ['boca-techo'] },

  /* ----------------------------------------------------------- tomacorrientes */
  { id: 'toma-simple', n: 'Tomacorriente simple', v: 'IRAM 2010', alt: ['toma', 'enchufe de pared'],
    s: toma(60, 58),
    d: 'Toma de corriente de uso general, con una sola base. El semicírculo mira hacia el interior del local.',
    x: 'La raya es la pared. En AEA 90364 el toma de uso general es de 10 A.',
    rel: ['toma-doble', 'toma-tierra'] },
  { id: 'toma-doble', n: 'Tomacorriente doble', v: 'IRAM 2010', alt: ['toma doble', 'dos bases'],
    s: toma(60, 56) + trazos(60, 56, 20, 28, 2),
    d: 'Dos bases en la misma caja. Cada trazo que sale del semicírculo cuenta una base.',
    x: 'Con tres trazos es un tomacorriente triple. Se marca así, y no con dos símbolos, para ahorrar lugar en el plano.',
    rel: ['toma-simple', 'toma-tierra'] },
  { id: 'toma-tierra', n: 'Tomacorriente con puesta a tierra', v: 'IRAM 2010', alt: ['toma con tierra', 'toma de 10 A', 'toma de tres espigas'],
    s: toma(60, 62) + tee(60, 62, 20),
    d: 'Toma con el contacto de protección (tercera espiga). Es el tomacorriente que exige la reglamentación en toda instalación nueva.',
    x: 'La T marca la conexión de tierra. Todo tomacorriente debe conectarse al conductor de protección verde y amarillo.',
    rel: ['toma-simple', 'toma-uso-especial'] },
  { id: 'toma-uso-especial', n: 'Toma de uso especial (ACU, 20 A)', v: 'AEA 90364', alt: ['TUE', 'toma de 20 A', 'ACU'],
    s: toma(38, 62) + tee(38, 62, 20) + t(78, 62, '20 A', { a: 'start', z: 13 }),
    d: 'Toma de 20 A para un equipo de mucha potencia: aire acondicionado, horno eléctrico, termotanque.',
    x: 'Va en un circuito propio, con su protección y su cable. Se rotula con la corriente (20 A) y la sigla del circuito.',
    rel: ['toma-tierra'] },
  { id: 'toma-tv', n: 'Toma de TV / antena', v: 'IRAM 2010', alt: ['antena', 'coaxil', 'televisión'],
    s: pg([[60, 22.7], [40, 57.3], [80, 57.3]]) + t(60, 52, 'TV', { z: 11 }),
    d: 'Salida del cable coaxial de antena o de televisión por cable: el triángulo de las bocas de comunicaciones, con la sigla TV.',
    x: 'Es de baja tensión: va por una cañería aparte de las de energía.',
    rel: ['toma-telefono', 'toma-datos'] },
  { id: 'toma-telefono', n: 'Toma de teléfono', v: 'IRAM 2010', alt: ['boca de teléfono', 'línea telefónica'],
    s: pg([[60, 22.7], [40, 57.3], [80, 57.3]], true),
    d: 'Boca de la línea telefónica: triángulo lleno.',
    x: 'Al igual que la de TV, es de baja tensión y lleva cañería separada.',
    rel: ['toma-datos', 'toma-tv'] },
  { id: 'toma-datos', n: 'Toma de datos', v: 'IRAM 2010', alt: ['red', 'ethernet', 'RJ45'],
    s: pg([[60, 22.7], [40, 57.3], [80, 57.3]]) + t(60, 51, 'D', { z: 13 }),
    d: 'Boca para cable de red de computadoras: el triángulo de las bocas de comunicaciones, con la letra D.',
    x: 'Usa el conector RJ45. Se rotula con el número de cable de la planilla de cableado.',
    rel: ['toma-telefono', 'toma-tv'] },

  /* ------------------------------------------------------------------- llaves */
  { id: 'llave-1', n: 'Llave de un punto', v: 'IRAM 2010', alt: ['interruptor simple', 'llave de un efecto', 'tecla'],
    s: llave(1, 0),
    d: 'Interruptor que enciende una sola luz o un solo grupo de luces. Una bandera, un efecto.',
    x: 'Se dibuja junto a la puerta, a la altura de la mano. Se une con trazos finos a las bocas que enciende.',
    rel: ['llave-2', 'llave-combinacion', 'pulsador'] },
  { id: 'llave-2', n: 'Llave de dos puntos', v: 'IRAM 2010', alt: ['interruptor doble', 'llave de dos efectos'],
    s: llave(2, 0),
    d: 'Dos interruptores en la misma caja: dos banderas, dos efectos, cada uno con su luz.',
    x: 'Con tres banderas es una llave de tres puntos.',
    rel: ['llave-1', 'llave-combinacion'] },
  { id: 'llave-combinacion', n: 'Llave de combinación (escalera)', v: 'IRAM 2010', alt: ['conmutador', 'llave de dos lugares', 'tres vías'],
    s: c(60, 40, 5.5) + l(63.9, 36.1, 84, 16) + l(84, 16, 91, 23) + l(56.1, 43.9, 36, 64) + l(36, 64, 29, 57),
    d: 'Se usa de a pares para encender y apagar la misma luz desde dos lugares: la línea atraviesa el círculo y lleva una bandera en cada extremo.',
    x: 'Son los de un pasillo o una escalera. Si hace falta un tercer lugar, se agrega una llave de cruce entre las dos.',
    rel: ['llave-1', 'llave-2'] },
  { id: 'pulsador', n: 'Pulsador', v: 'IRAM 2010', alt: ['botón de timbre', 'pulsador de luz'],
    s: c(60, 40, 14) + t(60, 45, 'P', { z: 15 }),
    d: 'Contacto momentáneo: cierra mientras se lo aprieta. Se usa para el timbre, el portero o la luz de escalera.',
    x: 'La letra P lo distingue de una llave común. En el plano se lo une con trazos finos al timbre o a la luz que comanda.',
    rel: ['timbre', 'llave-1'] },

  /* -------------------------------------------------------------------- otros */
  { id: 'timbre', n: 'Timbre o campanilla', v: 'IRAM 2010', alt: ['campana', 'chicharra', 'zumbador'],
    s: p('M40,54 a20,20 0 0 1 40,0 Z') + c(60, 60, 3, true),
    d: 'Aviso sonoro. Se dibuja como una campana: el semicírculo y el badajo debajo.',
    x: 'Funciona con transformador de 8 a 12 V. Su pulsador está en el exterior de la vivienda.',
    rel: ['pulsador', 'portero'] },
  { id: 'portero', n: 'Portero eléctrico', v: 'IRAM 2010', alt: ['intercomunicador', 'videoportero'],
    s: r(30, 24, 60, 32) + r(38, 34, 8, 12) + pg([[46, 34], [56, 28], [56, 52], [46, 46]]) + p('M64,35 a7,7 0 0 1 0,12') + p('M70,31 a13,13 0 0 1 0,20'),
    d: 'Aparato de comunicación entre la puerta de calle y el interior. Se dibuja con el parlante dentro de un rectángulo.',
    x: 'Los cables son de baja tensión y van por una cañería propia, lejos de los de energía.',
    rel: ['timbre'] },
  { id: 'tablero-principal', n: 'Tablero principal', v: 'IRAM 2010', alt: ['TP', 'tablero general'],
    s: r(24, 24, 44, 32, true) + t(80, 46, 'TP', { a: 'start', z: 15 }),
    d: 'El tablero donde llega la acometida y que contiene la protección general. Rectángulo lleno.',
    x: 'Se ubica cerca del medidor y debe quedar accesible, a una altura de entre 1,2 y 1,8 m.',
    rel: ['tablero-seccional', 'medidor'] },
  { id: 'tablero-seccional', n: 'Tablero seccional', v: 'IRAM 2010', alt: ['TS', 'subtablero'],
    s: r(24, 24, 44, 32) + pg([[24, 24], [24, 56], [68, 56]], true) + t(80, 46, 'TS', { a: 'start', z: 15 }),
    d: 'Un tablero que cuelga del principal y atiende un sector: planta alta, taller, quincho.',
    x: 'Tiene sus propias protecciones. En el plano se lo une al principal con la cañería del alimentador.',
    rel: ['tablero-principal'] },
  { id: 'medidor', n: 'Medidor de energía', v: 'IRAM 2010', alt: ['contador', 'medidor de luz', 'kWh'],
    s: r(26, 26, 68, 28) + t(60, 46, 'kWh', { z: 16 }),
    d: 'El medidor de la compañía distribuidora, con su leyenda kWh.',
    x: 'Se ubica en el pilar o sobre la línea municipal, accesible desde la calle. Lo provee y lo precinta la distribuidora.',
    rel: ['tablero-principal'] },
  { id: 'caja-paso', n: 'Caja de paso', v: 'IRAM 2010', alt: ['caja de pase', 'caja de registro'],
    s: l(14, 40, 46, 40) + r(46, 26, 28, 28) + l(74, 40, 106, 40),
    d: 'Un cuadrado donde la cañería pasa sin derivar. Sirve para enhebrar los cables.',
    x: 'La norma limita la distancia y las curvas entre cajas: no puede haber más de dos curvas seguidas.',
    rel: ['caja-derivacion'] },
  { id: 'caja-derivacion', n: 'Caja de derivación', v: 'IRAM 2010', alt: ['caja de empalme', 'caja de unión'],
    s: l(14, 40, 46, 40) + r(46, 26, 28, 28) + l(74, 40, 106, 40) + l(60, 54, 60, 74) + n(60, 40),
    d: 'El cuadrado con un punto: ahí se empalman los cables y se saca una derivación.',
    x: 'Todo empalme debe estar dentro de una caja; nunca dentro de la cañería.',
    rel: ['caja-paso'] },
  { id: 'jabalina', n: 'Jabalina (puesta a tierra)', v: 'IRAM 2010 · AEA 90364', alt: ['toma de tierra', 'electrodo de tierra', 'puesta a tierra'],
    s: l(60, 6, 60, 14) + l(42, 14, 78, 14) + l(49, 21, 71, 21) + l(56, 28, 64, 28) + l(60, 28, 60, 36) + pg([[57, 36], [63, 36], [63, 62], [60, 74], [57, 62]]),
    d: 'El electrodo clavado en la tierra, al que se unen todas las partes metálicas de la instalación.',
    x: 'Es una barra de acero y cobre de 1,5 m, como mínimo. Se rotula con la resistencia medida, que no debería superar 10 Ω.',
    rel: ['toma-tierra'] },

  /* ------------------------------------------------------------- canalizaciones */
  { id: 'canio-pared', n: 'Cañería embutida en pared o techo', v: 'IRAM 2010', alt: ['caño embutido', 'cañería en losa', 'conducto'],
    s: l(10, 40, 110, 40),
    d: 'Línea llena: la cañería va oculta dentro del muro o de la losa del techo.',
    x: 'Es la más común. Se rotula con el diámetro: 5/8 de pulgada, 3/4 o 1.',
    rel: ['canio-piso', 'canio-vista'] },
  { id: 'canio-piso', n: 'Cañería por piso', v: 'IRAM 2010', alt: ['caño en contrapiso', 'cañería enterrada'],
    s: d(10, 40, 24, 40) + d(34, 40, 48, 40) + d(58, 40, 72, 40) + d(82, 40, 96, 40) + l(104, 40, 110, 40),
    d: 'Línea a trazos: la cañería corre por el contrapiso o bajo el piso.',
    x: 'Se la usa para llegar a una boca en medio del local o a un pilar. Se evitan los cruces con la plomería.',
    rel: ['canio-pared', 'canio-vista'] },
  { id: 'canio-vista', n: 'Cañería a la vista', v: 'IRAM 2010', alt: ['caño exterior', 'cañería aparente'],
    s: l(10, 40, 26, 40) + c(33, 40, 1.8, true) + l(40, 40, 56, 40) + c(63, 40, 1.8, true) + l(70, 40, 86, 40) + c(93, 40, 1.8, true) + l(100, 40, 110, 40),
    d: 'Línea de trazo y punto: la cañería va por la superficie, sin embutir.',
    x: 'Es el caso de los talleres y los galpones. Los planos municipales a veces la dibujan de otro modo: manda la leyenda.',
    rel: ['canio-pared', 'canio-piso'] },
  { id: 'canio-sube', n: 'Cañería que sube', v: 'IRAM 2010', alt: ['ascendente', 'cañería vertical hacia arriba'],
    s: l(10, 40, 50, 40) + c(60, 40, 10) + p('M50,40 a10,10 0 0 1 20,0 Z', 'f'),
    d: 'La cañería deja el plano y sube hacia el nivel superior o hacia el techo. La mitad superior está llena.',
    x: 'Es una convención de planta. La mitad llena marca el sentido en que sigue el caño.',
    rel: ['canio-baja'] },
  { id: 'canio-baja', n: 'Cañería que baja', v: 'IRAM 2010', alt: ['descendente', 'cañería vertical hacia abajo'],
    s: l(10, 40, 50, 40) + c(60, 40, 10) + p('M50,40 a10,10 0 0 0 20,0 Z', 'f'),
    d: 'La cañería deja el plano y baja hacia el nivel inferior o hacia el piso. La mitad inferior está llena.',
    x: 'Un caño que baja desde el techo para llegar a una llave se dibuja así en la pared.',
    rel: ['canio-sube'] },

  /* --------------------------------------------------- conductores en la cañería */
  { id: 'cond-fase', n: 'Conductor de fase en la cañería', v: 'IRAM 2010', alt: ['fase', 'activo', 'L'],
    s: l(10, 40, 110, 40) + larga(60),
    d: 'Una raya oblicua larga que cruza la línea de la cañería indica un conductor de fase.',
    x: 'Cada raya es un conductor. El de fase es el marrón, negro o rojo: el que lleva la tensión.',
    rel: ['cond-neutro', 'cond-tierra', 'cond-fn'] },
  { id: 'cond-neutro', n: 'Conductor neutro en la cañería', v: 'IRAM 2010', alt: ['neutro', 'N'],
    s: l(10, 40, 110, 40) + corta(60),
    d: 'Una raya oblicua corta indica el conductor neutro.',
    x: 'En la instalación va de color celeste. El neutro nunca se interrumpe con una llave.',
    rel: ['cond-fase', 'cond-tierra', 'cond-fn'] },
  { id: 'cond-tierra', n: 'Conductor de protección en la cañería', v: 'IRAM 2010', alt: ['tierra', 'PE', 'conductor verde y amarillo'],
    s: l(10, 40, 110, 40) + tierraC(60),
    d: 'Una raya oblicua larga con un punto en el extremo indica el conductor de protección (tierra).',
    x: 'El cable es verde y amarillo. Esta marca varía entre planos: la leyenda define cuál se usa.',
    rel: ['cond-fase', 'cond-neutro', 'cond-fnt'] },
  { id: 'cond-fn', n: 'Cañería con fase y neutro', v: 'IRAM 2010', alt: ['dos conductores', 'circuito de luz'],
    s: l(10, 40, 110, 40) + larga(50) + corta(68),
    d: 'Dos rayas sobre la cañería: un conductor de fase y un neutro.',
    x: 'Es el circuito de iluminación sin tierra. Con tierra se agrega la tercera raya.',
    rel: ['cond-fnt'] },
  { id: 'cond-fnt', n: 'Cañería con fase, neutro y tierra', v: 'IRAM 2010', alt: ['tres conductores', 'circuito de tomas'],
    s: l(10, 40, 110, 40) + larga(40) + corta(60) + tierraC(80) + t(60, 70, '3 × 2,5 mm²', { z: 11 }),
    d: 'Tres rayas: fase, neutro y tierra. Debajo se anota la cantidad y la sección de los conductores.',
    x: 'En AEA 90364 la sección mínima es 1,5 mm² para luces y 2,5 mm² para tomas.',
    rel: ['cond-fn', 'cond-tierra'] }
]);
})();
