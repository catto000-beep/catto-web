/* Tablero y comando: esquema unifilar y circuito de comando.
   Los contactos van en vertical, como en los esquemas de tablero: el dibujo es el mismo de los contactos
   de s-conexion.js girado un cuarto de vuelta (cuchilla de 17 de ancho, tope del NC a 14).
   Los números de borne llevan tamaño 10 y clase 'e'. Referencia: IEC 60617, IEC 60947, IRAM 2010, AEA 90364. */
(function(){
var l = SB.l, d = SB.d, g = SB.g, p = SB.p, c = SB.c, r = SB.r, t = SB.t, n = SB.n, o = SB.o, ar = SB.ar, pl = SB.pl, pg = SB.pg;
var VB = '0 0 120 100', VW = '0 0 150 100';
function a(v){ return Math.round(v * 100) / 100; }

/* ---------------------------------------------------------------- auxiliares */
function txt(x, y, s, anchor){ return t(x, y, s, { a: anchor || 'start', z: 10, c: 'e' }); }
/* contacto NA vertical en x: pivote en ya, contacto fijo en yb (la cuchilla se inclina hacia la izquierda) */
function vna(x, ya, yb){ return l(x, ya, x - 17, yb - 2); }
/* contacto NC vertical: la cuchilla apoya contra el tope */
function vnc(x, ya, yb){ return l(x, ya, x - 13, yb + 5) + l(x, yb, x - 14, yb); }
/* conductores de entrada y salida */
function leads(x, ya, yb, top, bot){ return l(x, top || 6, x, ya) + l(x, yb, x, bot || 94); }
/* cruz del interruptor automático, en el pivote */
function cruz(x, y){ return l(x - 4, y - 4, x + 4, y + 4) + l(x - 4, y + 4, x + 4, y - 4); }
/* unión mecánica de varios polos, entre los puntos medios de las cuchillas NA */
function mech(xs, ya, yb){
  if(xs.length < 2) return '';
  var ym = (ya + yb - 2) / 2;
  return d(xs[0] - 8.5, ym, xs[xs.length - 1] - 8.5, ym);
}
/* disparador termomagnético: caja con el elemento térmico (escalón) y el magnético (arco) */
function lib(xr, yc){
  return r(xr - 15, yc - 8, 30, 16) + pl([[xr - 11, yc + 4], [xr - 11, yc], [xr - 4, yc], [xr - 4, yc - 4]]) +
    p('M' + a(xr + 3) + ',' + a(yc + 4) + ' a4,4 0 0 1 8,0');
}
/* elemento térmico dentro de un conductor vertical: caja con el escalón del bimetal */
function term(x, y0, y1){
  var ym = (y0 + y1) / 2;
  return r(x - 9, y0, 18, y1 - y0) + pl([[x - 5, ym + 7], [x - 5, ym], [x + 5, ym], [x + 5, ym - 7]]);
}
/* interruptor automático de n polos (con o sin disparador) */
function breaker(xs, rel){
  var s = '', n = xs.length;
  xs.forEach(function(x, i){
    s += leads(x, 30, 70) + vna(x, 30, 70) + cruz(x, 30) + txt(x + 5, 20, String(2 * i + 1)) + txt(x + 5, 90, String(2 * i + 2));
  });
  s += mech(xs, 30, 70);
  if(rel){ var xe = xs[n - 1] - 8.5; s += d(xe, 49, xe + 8, 49) + lib(xe + 23, 49); }
  return s;
}
/* tres polos principales (contactor) con numeración 1-2, 3-4, 5-6 */
function tres(xs, ya, yb, num){
  var s = '';
  xs.forEach(function(x, i){
    s += leads(x, ya, yb) + vna(x, ya, yb);
    if(num) s += txt(x + 5, 20, String(2 * i + 1)) + txt(x + 5, 90, String(2 * i + 2));
  });
  return s + mech(xs, ya, yb);
}
/* bobina IEC: rectángulo vertical con A1 arriba y A2 abajo */
function bobina(x, extra){
  return l(x, 6, x, 28) + r(x - 16, 28, 32, 44) + l(x, 72, x, 94) + txt(x + 6, 20, 'A1') + txt(x + 6, 90, 'A2') + (extra || '');
}
/* contacto auxiliar NA o NC con numeración */
function auxna(x, n1, n2){ return leads(x, 30, 70) + vna(x, 30, 70) + txt(x + 5, 20, n1) + txt(x + 5, 90, n2); }
function auxnc(x, n1, n2){ return leads(x, 28, 63) + vnc(x, 28, 63) + txt(x + 5, 20, n1) + txt(x + 5, 90, n2); }
/* arco del temporizado centrado en la cuchilla: arriba (∩) o abajo (∪) */
function arco(x, y, arriba){
  return p('M' + a(x - 7) + ',' + a(y) + ' a7,7 0 0 ' + (arriba ? 1 : 0) + ' 14,0');
}
/* pulsador de mando: cuchilla, varilla a trazos hacia la izquierda y su cabeza */
function varilla(x, y, x2){ return d(x, y, x2, y); }

/* ------------------------------------------------------------------ símbolos */
SB.add('tablero', [

  /* ----------------------------------------------------------- protecciones */
  { id: 'termomagnetica-1p', n: 'Interruptor termomagnético unipolar', v: 'IEC 60617', vb: VW,
    alt: ['llave térmica unipolar', 'térmica 1P', 'disyuntor', 'automático'],
    s: breaker([69], true),
    d: 'Protege un conductor contra sobrecargas (parte térmica) y cortocircuitos (parte magnética). La cruz marca que abre solo; la caja lleva el escalón del bimetal y el arco del electroimán.',
    x: 'Se usa en circuitos de iluminación, en la fase. Dice su corriente nominal y su curva (B, C o D) en el frente.',
    rel: ['termomagnetica-2p', 'termomagnetica-3p', 'termomagnetica-4p'] },
  { id: 'termomagnetica-2p', n: 'Interruptor termomagnético bipolar', v: 'IEC 60617', vb: VW,
    alt: ['térmica bipolar', 'térmica 2P', 'llave térmica de dos polos'],
    s: breaker([57, 81], true),
    d: 'Dos polos accionados juntos: corta fase y neutro a la vez. La línea de trazos es la unión mecánica.',
    x: 'Es el interruptor general de una vivienda monofásica. También protege los circuitos de tomas.',
    rel: ['termomagnetica-1p', 'termomagnetica-3p', 'termomagnetica-4p'] },
  { id: 'termomagnetica-3p', n: 'Interruptor termomagnético tripolar', v: 'IEC 60617', vb: VW,
    alt: ['térmica tripolar', 'térmica 3P'],
    s: breaker([45, 69, 93], true),
    d: 'Tres polos, una fase cada uno. Si se dispara uno, abre los tres.',
    x: 'Se usa en las líneas trifásicas y en la protección de los motores. Un motor trifásico nunca debe quedar con dos fases.',
    rel: ['termomagnetica-2p', 'termomagnetica-4p', 'termomagnetica-3p-unifilar'] },
  { id: 'termomagnetica-4p', n: 'Interruptor termomagnético tetrapolar', v: 'IEC 60617', vb: VW,
    alt: ['térmica tetrapolar', 'térmica 4P', 'tres fases y neutro'],
    s: breaker([33, 57, 81, 105], true),
    d: 'Cuatro polos: las tres fases y el neutro, accionados juntos.',
    x: 'Es el interruptor general de una instalación trifásica con neutro.',
    rel: ['termomagnetica-3p', 'termomagnetica-2p'] },
  { id: 'termomagnetica-3p-unifilar', n: 'Interruptor termomagnético tripolar (unifilar)', v: 'IEC 60617', vb: VB,
    alt: ['térmica tripolar en unifilar'],
    s: leads(60, 30, 70) + vna(60, 30, 70) + cruz(60, 30) + l(54, 17, 66, 11) + l(54, 22, 66, 16) + l(54, 27, 66, 21) + txt(65, 90, 'C16'),
    d: 'El mismo interruptor tripolar dibujado con un solo contacto. Las tres rayas sobre el conductor indican que son tres.',
    x: 'En el unifilar se escribe al lado la corriente nominal y la curva: C16, por ejemplo.',
    rel: ['unifilar-3', 'termomagnetica-3p'] },
  { id: 'diferencial', n: 'Interruptor diferencial', v: 'IEC 60617', vb: '0 0 150 110',
    alt: ['disyuntor diferencial', 'protector diferencial', 'ID', 'DDR'],
    s: leads(57, 48, 88, 6, 104) + leads(81, 48, 88, 6, 104) + vna(57, 48, 88) + vna(81, 48, 88) + cruz(57, 48) + cruz(81, 48) +
       mech([57, 81], 48, 88) + c(69, 24, 16) + d(69, 40, 69, 67) + t(92, 30, 'I' + SB.sub('Δn'), { a: 'start', z: 12, c: 'e' }),
    d: 'Compara la corriente que va con la que vuelve. Si la diferencia pasa del umbral (30 mA), abre. El anillo es el núcleo que abraza a los dos conductores.',
    x: 'Protege a las personas de las descargas. No reemplaza a la térmica: el diferencial no protege contra sobrecargas. Se prueba con su botón T.',
    rel: ['termomagnetica-2p'] },
  { id: 'seccionador', n: 'Seccionador', v: 'IEC 60617', vb: VB, alt: ['cuchilla', 'aislador'],
    s: leads(60, 30, 70) + vna(60, 30, 70) + l(53, 70, 67, 70),
    d: 'Contacto que se abre sin carga para aislar una parte de la instalación. La barra en el contacto fijo es la marca del seccionador.',
    x: 'No puede cortar corriente: se abre después del interruptor. Se lo usa para trabajar sin tensión.',
    rel: ['interruptor-seccionador', 'fusible-seccionador'] },
  { id: 'interruptor-seccionador', n: 'Interruptor-seccionador', v: 'IEC 60617', vb: VB, alt: ['seccionador bajo carga', 'llave general'],
    s: leads(60, 30, 70) + vna(60, 30, 70) + l(53, 70, 67, 70) + o(56.5, 41),
    d: 'Puede abrir con corriente y deja una distancia de aislación visible. El anillo sobre la cuchilla marca que puede maniobrar con carga.',
    x: 'Se instala como llave general o de entrada, donde no hace falta que dispare solo. La marca de carga varía entre ediciones de la norma.',
    rel: ['seccionador', 'fusible-seccionador'] },
  { id: 'fusible-seccionador', n: 'Fusible seccionador', v: 'IEC 60617', vb: VB, alt: ['portafusible seccionable', 'seccionador fusible'],
    s: (function(){
      var ux = -17 / 41.63, uy = 38 / 41.63, vx = uy, vy = -ux, s0 = 9, s1 = 33, w = 4.5;
      var P = function(s, h){ return [60 + ux * s + vx * h, 30 + uy * s + vy * h]; };
      return leads(60, 30, 70) + l(60, 30, 43, 68) + l(53, 70, 67, 70) + pg([P(s0, w), P(s1, w), P(s1, -w), P(s0, -w)]);
    })(),
    d: 'Un seccionador cuya cuchilla es el propio fusible: al sacarlo se abre el circuito y se lo reemplaza.',
    x: 'Es el que se usa en las acometidas y en los tableros industriales (NH). Se maneja con una pértiga.',
    rel: ['seccionador', 'interruptor-seccionador'] },
  { id: 'descargador', n: 'Descargador de sobretensiones', v: 'IEC 60617', vb: VB, alt: ['protector de sobretensiones', 'DPS', 'varistor de línea'],
    s: l(60, 6, 60, 28) + r(52, 28, 16, 32) + ar(55, 56, 65, 32, 6) + l(60, 60, 60, 70) + l(46, 70, 74, 70) + l(52, 77, 68, 77) + l(57, 84, 63, 84),
    d: 'Se conecta entre el conductor y tierra. Lo normal es que no conduzca; ante una sobretensión (rayo, maniobra) se hace conductor y la desvía a tierra.',
    x: 'Se coloca en el tablero principal. Lleva una protección propia, y un cable corto y directo a tierra.',
    rel: ['jabalina'] },

  /* -------------------------------------------------- contactor y relés */
  { id: 'contactor', n: 'Contactor (contactos principales)', v: 'IEC 60617', vb: VB, alt: ['contactos de fuerza', 'contactor tripolar'],
    s: tres([36, 60, 84], 30, 70, true),
    d: 'Los tres contactos de potencia del contactor, normalmente abiertos. La línea de trazos es la unión mecánica: se mueven juntos.',
    x: 'Los bornes se numeran 1-2, 3-4 y 5-6 (red a la entrada y motor a la salida: L1-T1, L2-T2, L3-T3).',
    rel: ['contactor-bobina', 'bobina-contactor', 'aux-na', 'aux-nc'] },
  { id: 'contactor-bobina', n: 'Contactor con su bobina', v: 'IEC 60617', vb: VW, alt: ['contactor completo', 'contactor y bobina'],
    s: tres([30, 54, 78], 30, 70, true) + l(118, 6, 118, 29) + r(104, 29, 28, 40) + l(118, 69, 118, 94) + txt(124, 20, 'A1') + txt(124, 90, 'A2') + d(21.5, 49, 104, 49),
    d: 'Los contactos principales y la bobina que los acciona: la línea de trazos sale de la bobina hacia los contactos.',
    x: 'Cuando la bobina recibe tensión entre A1 y A2, los tres contactos se cierran juntos.',
    rel: ['contactor', 'bobina-contactor'] },
  { id: 'bobina-contactor', n: 'Bobina de contactor o relé', v: 'IEC 60617', vb: VB, alt: ['bobina', 'A1 A2', 'electroimán'],
    s: bobina(60),
    d: 'El electroimán que acciona el contactor o el relé. Se identifica con los bornes A1 y A2 y con una sigla: KM1, K1...',
    x: 'Es un rectángulo; el dibujo de bobina en forma de espiras es del esquema electrónico. Se la alimenta con la tensión de su chapa: 24, 110 o 220 V.',
    rel: ['contactor', 'aux-na', 'aux-nc'] },
  { id: 'aux-na', n: 'Contacto auxiliar NA (13-14)', v: 'IEC 60617', vb: VB, alt: ['contacto de maniobra normal abierto', 'contacto auxiliar de cierre'],
    s: auxna(60, '13', '14'),
    d: 'Contacto de mando normalmente abierto: se cierra cuando se energiza la bobina de la que depende.',
    x: 'El primer dígito es el número de contacto en el aparato; el segundo, 3 y 4, indica contacto NA. Con él se hace el enclavamiento de la marcha.',
    rel: ['aux-nc', 'bobina-contactor', 'contactor'] },
  { id: 'aux-nc', n: 'Contacto auxiliar NC (21-22)', v: 'IEC 60617', vb: VB, alt: ['contacto de maniobra normal cerrado', 'contacto auxiliar de apertura'],
    s: auxnc(60, '21', '22'),
    d: 'Contacto de mando normalmente cerrado: se abre cuando se energiza la bobina.',
    x: 'Los dígitos 1 y 2 indican contacto NC. Se usa para el enclavamiento entre dos contactores: así no pueden estar los dos conectados a la vez.',
    rel: ['aux-na', 'bobina-contactor', 'contactor'] },
  { id: 'rele-termico', n: 'Relé térmico', v: 'IEC 60617', vb: '0 0 140 100', alt: ['relé de sobrecarga', 'térmico', 'protección térmica'],
    s: (function(){
      var xs = [22, 46, 70], s = '';
      xs.forEach(function(x, i){
        s += l(x, 6, x, 34) + term(x, 34, 62) + l(x, 62, x, 94) + txt(x + 5, 20, String(2 * i + 1)) + txt(x + 5, 90, String(2 * i + 2));
      });
      return s + d(31, 48, 37, 48) + d(55, 48, 61, 48) + d(79, 48, 105.5, 48) + auxnc(112, '95', '96');
    })(),
    d: 'Tres elementos térmicos en serie con el motor, y un contacto NC (95-96) que se abre cuando se calientan demasiado. Protege contra sobrecargas.',
    x: 'El contacto 95-96 va en serie con la bobina del contactor. Se regula con la corriente de la chapa del motor y se rearma a mano.',
    rel: ['guardamotor', 'contactor'] },
  { id: 'guardamotor', n: 'Guardamotor', v: 'IEC 60617', vb: VB, alt: ['disyuntor de motor', 'interruptor de protección de motor'],
    s: (function(){
      var xs = [36, 60, 84], s = '';
      xs.forEach(function(x, i){
        s += l(x, 6, x, 20) + term(x, 20, 40) + l(x, 40, x, 48) + vna(x, 48, 82) + cruz(x, 48) + l(x, 82, x, 94) +
          txt(x + 5, 14, String(2 * i + 1)) + txt(x + 5, 94, String(2 * i + 2));
      });
      return s + mech(xs, 48, 82);
    })(),
    d: 'Interruptor automático para motores. Combina el elemento térmico (contra sobrecarga) y la protección magnética (contra cortocircuito) de los tres polos.',
    x: 'Reemplaza al conjunto térmica más relé térmico. Se regula con la corriente del motor. Suele maniobrar a mano, con perilla.',
    rel: ['rele-termico', 'termomagnetica-3p'] },

  /* ------------------------------------------------------ temporizadores */
  { id: 'bobina-ton', n: 'Bobina de temporizador con retardo a la conexión', v: 'IEC 60617', vb: VB, alt: ['temporizador TON', 'retardo a la excitación', 'ON delay'],
    s: bobina(60, r(44, 57, 32, 15, true)),
    d: 'Una bobina que actúa con retardo después de recibir tensión. Se desconecta de inmediato. Lleva marcado en negro el sector de A2.',
    x: 'El relleno del rectángulo se interpreta distinto según la edición y el fabricante; las reconocibles son sus contactos con semicírculo.',
    rel: ['bobina-tof', 'tempo-na-ton', 'tempo-nc-ton'] },
  { id: 'bobina-tof', n: 'Bobina de temporizador con retardo a la desconexión', v: 'IEC 60617', vb: VB, alt: ['temporizador TOF', 'retardo a la desexcitación', 'OFF delay'],
    s: bobina(60, r(44, 28, 32, 15, true)),
    d: 'Una bobina que actúa al instante y suelta con retardo cuando se le corta la tensión. Lleva marcado en negro el sector de A1.',
    x: 'Lo normal es que pida una alimentación permanente (A1-A2) y un contacto de mando aparte, que da la orden.',
    rel: ['bobina-ton', 'tempo-na-tof', 'tempo-nc-tof'] },
  { id: 'tempo-na-ton', n: 'Contacto NA temporizado a la conexión', v: 'IEC 60617', vb: VB, alt: ['NA con retardo al cierre', 'contacto temporizado'],
    s: auxna(60, '67', '68') + arco(51.5, 49, true),
    d: 'Contacto normalmente abierto que se cierra con retardo después de energizar la bobina, y abre de inmediato al desenergizarla.',
    x: 'El semicírculo marca el retardo y su abertura apunta hacia donde se retrasa el movimiento. Numeración usual: 67-68.',
    rel: ['tempo-na-tof', 'tempo-nc-ton', 'bobina-ton'] },
  { id: 'tempo-na-tof', n: 'Contacto NA temporizado a la desconexión', v: 'IEC 60617', vb: VB, alt: ['NA con retardo a la apertura', 'contacto temporizado'],
    s: auxna(60, '67', '68') + arco(51.5, 49, false),
    d: 'Contacto normalmente abierto que se cierra enseguida y vuelve a abrirse con retardo cuando se corta la tensión de la bobina.',
    x: 'Es el que mantiene una luz de escalera encendida un rato después de soltar el pulsador.',
    rel: ['tempo-na-ton', 'tempo-nc-tof', 'bobina-tof'] },
  { id: 'tempo-nc-ton', n: 'Contacto NC temporizado a la conexión', v: 'IEC 60617', vb: VB, alt: ['NC con retardo a la apertura', 'contacto temporizado'],
    s: auxnc(60, '55', '56') + arco(53.5, 46, false),
    d: 'Contacto normalmente cerrado que se abre con retardo después de energizar la bobina.',
    x: 'Se usa en el arranque estrella-triángulo, para sacar la estrella pasado el tiempo ajustado. Numeración usual: 55-56.',
    rel: ['tempo-na-ton', 'tempo-nc-tof'] },
  { id: 'tempo-nc-tof', n: 'Contacto NC temporizado a la desconexión', v: 'IEC 60617', vb: VB, alt: ['NC con retardo al cierre', 'contacto temporizado'],
    s: auxnc(60, '55', '56') + arco(53.5, 46, true),
    d: 'Contacto normalmente cerrado que se abre al instante y vuelve a cerrarse con retardo cuando se corta la tensión de la bobina.',
    x: 'Se lo conecta cuando una carga debe volver a estar conectada, pero solo después de un tiempo.',
    rel: ['tempo-na-tof', 'tempo-nc-ton'] },

  /* ---------------------------------------------------- mando y señalización */
  { id: 'emergencia-hongo', n: 'Pulsador de parada de emergencia (hongo)', v: 'IEC 60617', vb: VB, alt: ['seta', 'hongo', 'parada de emergencia'],
    s: leads(82, 28, 63) + vnc(82, 28, 63) + txt(87, 20, '21') + txt(87, 90, '22') + varilla(75.5, 48, 46) + o(62, 48) + p('M46,34 a14,14 0 0 0 0,28 Z'),
    d: 'Pulsador de cabeza grande y roja que abre un contacto NC y se queda enclavado: hay que girarlo o tirar de él para soltarlo.',
    x: 'Corta el comando de todo el equipo. El círculo sobre la varilla marca el enclavamiento mecánico. Va sobre fondo amarillo.',
    rel: ['selector-2p', 'aux-nc'] },
  { id: 'selector-2p', n: 'Selector de dos posiciones', v: 'IEC 60617', vb: VB, alt: ['llave selectora', 'selectora', 'manual-automático'],
    s: leads(82, 30, 70) + vna(82, 30, 70) + txt(87, 20, '13') + txt(87, 90, '14') + varilla(73.5, 49, 48) + o(62, 49) + pl([[40, 38], [48, 38], [48, 60], [40, 60]]),
    d: 'Perilla que queda en la posición elegida: un contacto cerrado en una posición y abierto en la otra.',
    x: 'Es el de «manual–automático» o «local–remoto». El círculo sobre la varilla indica que se mantiene en cada posición.',
    rel: ['emergencia-hongo', 'final-carrera-na'] },
  { id: 'final-carrera-na', n: 'Final de carrera NA', v: 'IEC 60617', vb: VB, alt: ['interruptor de posición', 'fin de carrera', 'limit switch'],
    s: leads(82, 30, 70) + vna(82, 30, 70) + txt(87, 20, '13') + txt(87, 90, '14') + varilla(73.5, 49, 52) + c(47, 49, 5),
    d: 'Un contacto normalmente abierto que cierra una pieza móvil de la máquina al llegar a un punto del recorrido. El círculo es el rodillo.',
    x: 'Se lo usa para detener un portón o un carro en el extremo, o para saber que llegó.',
    rel: ['final-carrera-nc', 'aux-na'] },
  { id: 'final-carrera-nc', n: 'Final de carrera NC', v: 'IEC 60617', vb: VB, alt: ['interruptor de posición', 'fin de carrera', 'limit switch'],
    s: leads(82, 28, 63) + vnc(82, 28, 63) + txt(87, 20, '21') + txt(87, 90, '22') + varilla(75.5, 48, 52) + c(47, 48, 5),
    d: 'Un contacto normalmente cerrado que se abre al ser accionado por la pieza móvil de la máquina.',
    x: 'Es el que corta el motor al fin del recorrido: si el cable se corta, la máquina también se detiene.',
    rel: ['final-carrera-na', 'aux-nc'] },
  { id: 'lampara-senal', n: 'Lámpara de señalización', v: 'IEC 60617', vb: VB, alt: ['piloto', 'luz piloto', 'lámpara de marcha'],
    s: l(60, 6, 60, 34) + c(60, 50, 16) + l(60, 66, 60, 94) + l(48.7, 38.7, 71.3, 61.3) + l(48.7, 61.3, 71.3, 38.7) + txt(66, 20, 'X1') + txt(66, 90, 'X2'),
    d: 'Una luz en el frente del tablero que avisa un estado: marcha, parada, falla.',
    x: 'Se identifican con el color: verde marcha, rojo falla o parada, ámbar advertencia, blanco o azul información.',
    rel: ['bobina-contactor'] },

  /* ------------------------------------------------ máquinas y medición */
  { id: 'motor-3', n: 'Motor trifásico (M 3~)', v: 'IEC 60617', vb: VB, alt: ['motor asincrónico', 'motor de jaula de ardilla'],
    s: (function(){
      var s = c(60, 58, 26) + t(60, 58, 'M', { z: 18 }) + t(60, 76, '3~', { z: 12 });
      [[40, 'U1'], [60, 'V1'], [80, 'W1']].forEach(function(q){
        var dx = q[0] - 60, y = 58 - Math.sqrt(26 * 26 - dx * dx);
        s += l(q[0], 6, q[0], y) + txt(q[0] - 3, 20, q[1], 'end');
      });
      return s;
    })(),
    d: 'Motor de corriente alterna de tres fases. La M va dentro del círculo y debajo, el número de fases y el signo de corriente alterna.',
    x: 'Los tres bornes son U1, V1 y W1. Se alimenta con la salida del contactor, a través del relé térmico.',
    rel: ['motor-1', 'contactor', 'rele-termico'] },
  { id: 'motor-1', n: 'Motor monofásico (M 1~)', v: 'IEC 60617', vb: VB, alt: ['motor de fase partida', 'motor con capacitor'],
    s: (function(){
      var s = c(60, 58, 26) + t(60, 58, 'M', { z: 18 }) + t(60, 76, '1~', { z: 12 });
      [48, 72].forEach(function(x){
        var dx = x - 60, y = 58 - Math.sqrt(26 * 26 - dx * dx);
        s += l(x, 6, x, y);
      });
      return s;
    })(),
    d: 'Motor de corriente alterna alimentado con una fase y el neutro.',
    x: 'Es el de las bombas de agua, las heladeras y los portones. La conexión del capacitor se muestra aparte, en el esquema del motor.',
    rel: ['motor-3'] },
  { id: 'trafo-unifilar', n: 'Transformador (unifilar)', v: 'IEC 60617', vb: VB, alt: ['trafo', 'transformador de potencia', 'dos círculos'],
    s: l(60, 6, 60, 20) + c(60, 38, 18) + c(60, 62, 18) + l(60, 80, 60, 94),
    d: 'Dos círculos enlazados: el primario y el secundario. En el esquema unifilar no se dibujan las bobinas.',
    x: 'Se anota la relación de transformación y la potencia: 13,2 kV / 380 V, 315 kVA, por ejemplo.',
    rel: ['medidor-kwh'] },
  { id: 'medidor-kwh', n: 'Medidor de energía (kWh)', v: 'IEC 60617', vb: VB, alt: ['medidor de energía activa', 'contador de energía', 'kWh'],
    s: l(60, 6, 60, 28) + c(60, 50, 22) + t(60, 55, 'kWh', { z: 14 }) + l(60, 72, 60, 94),
    d: 'El instrumento que mide la energía consumida. Se dibuja como cualquier instrumento: un círculo con la magnitud adentro.',
    x: 'En los planos de acometida también se lo ve como un rectángulo con kWh. La distribuidora lo coloca después del interruptor general.',
    rel: ['trafo-unifilar'] },
  { id: 'barra', n: 'Barra colectora', v: 'IEC 60617', vb: VB, alt: ['barra de distribución', 'busbar', 'peine'],
    s: g(10, 50, 110, 50) + l(30, 8, 30, 50) + l(60, 8, 60, 50) + l(90, 8, 90, 50) + l(45, 50, 45, 92) + l(75, 50, 75, 92),
    d: 'Una barra de cobre que reparte la corriente entre varios circuitos. Se dibuja con un trazo grueso.',
    x: 'Los circuitos se unen a la barra sin punto: la barra ya indica la conexión.',
    rel: ['bornera'] },
  { id: 'bornera', n: 'Borne de tablero (regleta)', v: 'IEC 60617', vb: VB, alt: ['bornera', 'regleta de bornes', 'borne de conexión', 'X1'],
    s: [30, 60, 90].map(function(x, i){ return l(x, 6, x, 44.8) + o(x, 48) + l(x, 51.2, x, 94) + txt(x + 6, 52, String(i + 1)); }).join(''),
    d: 'Los bornes numerados por donde el cable del campo entra al tablero. Cada círculo es un borne.',
    x: 'Se nombran con la regleta y el número: X1:1, X1:2. Así se arma la planilla de cableado.',
    rel: ['barra'] },
  { id: 'unifilar-2', n: 'Dos conductores (unifilar)', v: 'IEC 60617', alt: ['fase y neutro', 'línea monofásica'],
    s: l(10, 40, 110, 40) + l(55, 48, 65, 32) + l(61, 48, 71, 32),
    d: 'Una línea con dos rayitas oblicuas representa dos conductores: fase y neutro.',
    x: 'Con la notación unifilar se dibuja una sola línea para todo el conjunto; la cantidad se marca con las rayas.',
    rel: ['unifilar-3', 'unifilar-4'] },
  { id: 'unifilar-3', n: 'Tres conductores (unifilar)', v: 'IEC 60617', alt: ['línea trifásica', 'tres rayitas'],
    s: l(10, 40, 110, 40) + l(52, 48, 62, 32) + l(58, 48, 68, 32) + l(64, 48, 74, 32),
    d: 'Una línea con tres rayitas oblicuas: tres conductores, las tres fases.',
    x: 'El esquema unifilar de una instalación industrial se dibuja así, con una sola línea por tablero y por alimentador.',
    rel: ['unifilar-2', 'unifilar-4', 'termomagnetica-3p-unifilar'] },
  { id: 'unifilar-4', n: 'Cuatro conductores (unifilar)', v: 'IEC 60617', alt: ['tres fases y neutro', 'cuatro rayitas'],
    s: l(10, 40, 110, 40) + l(49, 48, 59, 32) + l(55, 48, 65, 32) + l(61, 48, 71, 32) + l(67, 48, 77, 32),
    d: 'Cuatro rayitas: las tres fases y el neutro.',
    x: 'Si hay más de cuatro, se escribe el número en lugar de dibujar las rayas: «5×16 mm²».',
    rel: ['unifilar-3', 'unifilar-2'] }
]);
})();
