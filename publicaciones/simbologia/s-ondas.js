/* Formas de onda y señales: cada una con sus ejes (V y t, con flecha) y la curva calculada punto por punto.
   Curvas en azul (clase v) o verde (ve). viewBox 0 0 140 80: eje del tiempo en y = 40 (señales con
   semiciclos negativos) o en y = 62 (señales que no bajan de cero); la curva ocupa x = 22 a 124. */
(function(){
var l = SB.l, t = SB.t, p = SB.p, pl = SB.pl, sub = SB.sub;
var VB = '0 0 140 80', X0 = 22, X1 = 124, PI2 = 2 * Math.PI;

/* ejes con flecha: V arriba, t a la derecha, en y = base */
function ejes(base){
  var abajo = base === 40 ? 75 : base + 4;
  return l(18, abajo, 18, 10, 'fino') + p('M18,4 L15.2,11 L20.8,11 Z', 'f fino') +
    l(14, base, 124, base, 'fino') + p('M130,' + base + ' L123,' + (base - 2.8) + ' L123,' + (base + 2.8) + ' Z', 'f fino') +
    t(11, 12, 'V', { a: 'end', z: 11, c: 'e' }) + t(133, base + 4, 't', { a: 'start', z: 11, c: 'e' });
}
/* muestrea y = f(x) de x0 a x1 cada dx */
function curva(f, x0, x1, dx){
  var pts = [];
  for(var x = x0; x <= x1 + 1e-9; x += dx) pts.push([x, f(x)]);
  return pts;
}
/* polilínea de tramos: lista de [x, y] */
function seno(T, A, base, fase){ return function(x){ return base - A * Math.sin(PI2 * (x - X0) / T + (fase || 0)); }; }
/* generador seudoaleatorio con semilla fija (el ruido es siempre el mismo dibujo) */
function azar(seed){ var s = seed; return function(){ s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

var U = 62, A_U = 44;   /* base y amplitud de las señales unipolares */
var ruido = (function(){
  var r = azar(7), pts = [], y = 40;
  for(var x = X0; x <= X1 + 1e-9; x += 1.5){
    var v = (r() + r() + r() - 1.5) * 26;
    y = 0.2 * y + 0.8 * (40 + v);
    pts.push([x, Math.max(14, Math.min(66, y))]);
  }
  return pts;
})();

/* cuadrada: 3 períodos de 34, niveles 16 y 64 */
var cuadrada = (function(){
  var pts = [];
  for(var k = 0; k < 3; k++){
    var x0 = X0 + 34 * k;
    pts.push([x0, 16], [x0 + 17, 16], [x0 + 17, 64], [x0 + 34, 64]);
    if(k < 2) pts.push([x0 + 34, 16]);
  }
  return pts;
})();
/* pulso con ciclo de trabajo del 25 %: período 24, alto 6 */
var pulso = (function(){
  var pts = [];
  for(var k = 0; k < 4; k++){
    var x0 = X0 + 24 * k;
    pts.push([x0, U], [x0 + 3, U], [x0 + 3, 20], [x0 + 9, 20], [x0 + 9, U]);
  }
  pts.push([X1, U]);
  return pts;
})();
/* tren de impulsos angostos: período 20 */
var impulsos = (function(){
  var pts = [];
  for(var k = 0; k < 5; k++){
    var x0 = X0 + 20 * k;
    pts.push([x0, U], [x0 + 8, U], [x0 + 8, 20], [x0 + 11, 20], [x0 + 11, U]);
  }
  pts.push([X1, U]);
  return pts;
})();
var triangular = (function(){
  var pts = [];
  for(var k = 0; k < 3; k++){
    var x0 = X0 + 34 * k;
    pts.push([x0, 40], [x0 + 8.5, 16], [x0 + 25.5, 64]);
  }
  pts.push([X1, 40]);
  return pts;
})();
var sierra = [[22, 64], [56, 16], [56, 64], [90, 16], [90, 64], [124, 16]];
var PWM = (function(){
  var T = 25.5, ancho = [6, 13, 20, 13], pts = [];
  ancho.forEach(function(w, k){
    var x0 = X0 + T * k;
    pts.push([x0, U], [x0, 20], [x0 + w, 20], [x0 + w, U]);
  });
  pts.push([X1, U]);
  return pts;
})();
var digital = (function(){
  var bits = [1, 0, 1, 1, 0, 0, 1, 0], B = (X1 - X0) / 8, pts = [], prev = null;
  bits.forEach(function(b, k){
    var y = b ? 22 : U, x0 = X0 + B * k;
    if(prev !== null && prev !== y) pts.push([x0, prev]);
    pts.push([x0, y]);
    prev = y;
  });
  pts.push([X1, prev]);
  return pts;
})();
/* modulación: portadora de período 6,8 sobre una moduladora de período 51 */
var TM = 51, TC = 6.8;
var am = curva(function(x){
  var u = x - X0, env = 14.1 * (1 + 0.7 * Math.cos(PI2 * u / TM));
  return 40 - env * Math.sin(PI2 * u / TC);
}, X0, X1, 0.5);
function envolvente(signo){
  return curva(function(x){ return 40 - signo * 14.1 * (1 + 0.7 * Math.cos(PI2 * (x - X0) / TM)); }, X0, X1, 1);
}
/* FM: frecuencia instantánea de 1/7 por píxel con desvío de ±40 %, índice de modulación β = 2,9 */
var fm = curva(function(x){
  var u = x - X0, fase = PI2 * u / 7 + 2.9 * Math.sin(PI2 * u / TM);
  return 40 - 22 * Math.sin(fase);
}, X0, X1, 0.25);
/* espectro de una cuadrada: armónicas impares con amplitud 1/k */
function espectro(){
  var s = '', B = 60;
  [1, 3, 5, 7, 9].forEach(function(k, i){
    var x = 34 + 20 * i, h = 44 / k;
    s += l(x, B, x, B - h, 'v') + t(x, B + 13, (k === 1 ? '' : k) + 'f' + sub('0'), { z: 9, c: 'e' });
  });
  return s;
}

SB.add('ondas', [
  { id: 'onda-senoidal', n: 'Onda senoidal', v: 'v(t) = Vp · sen(2π f t)', alt: ['senoide', 'seno', 'alterna'], vb: VB, rel: ['onda-cuadrada', 'onda-triangular'],
    s: ejes(40) + pl(curva(seno(51, 24, 40), X0, X1, 1), 'v'),
    d: 'La forma de la corriente alterna: sube hasta un valor máximo, baja hasta el mismo valor negativo y se repite. Su valor medio es cero.',
    x: 'La tensión de red en Argentina tiene 220 V eficaces y 50 Hz: el período es de 20 ms y el pico, de 311 V.' },
  { id: 'onda-cuadrada', n: 'Onda cuadrada', v: '50 % de ciclo de trabajo', alt: ['cuadrada', 'señal de reloj'], vb: VB, rel: ['onda-rectangular', 'onda-senoidal', 'onda-triangular'],
    s: ejes(40) + pl(cuadrada, 'v'),
    d: 'Pasa de golpe entre dos niveles iguales y opuestos y permanece la mitad del período en cada uno.',
    x: 'Contiene solo armónicas impares: es la señal de prueba de los amplificadores. Integrada, da una onda triangular.' },
  { id: 'onda-rectangular', n: 'Pulso con ciclo de trabajo', v: 'D = t alto / T', alt: ['onda rectangular', 'rectangular', 'duty cycle', 'pulsos'], vb: VB, np: true, rel: ['onda-cuadrada', 'pwm', 'tren-impulsos'],
    s: ejes(U) + pl(pulso, 'v') + t(104, 13, 'D = 25 %', { z: 9, c: 'e' }),
    d: 'Una onda que vale cero y se levanta a un nivel alto durante una fracción del período: el ciclo de trabajo D es esa fracción. Aquí, la cuarta parte.',
    x: 'Con D = 50 % es una onda cuadrada. La tensión media de la señal vale D · V, y de eso se vale el control por ancho de pulso.' },
  { id: 'onda-triangular', n: 'Onda triangular', v: 'sube y baja con igual pendiente', alt: ['triangular'], vb: VB, rel: ['onda-diente-sierra', 'onda-senoidal'],
    s: ejes(40) + pl(triangular, 'v'),
    d: 'Sube y baja en línea recta con la misma pendiente. Su valor medio es cero.',
    x: 'Se obtiene cargando y descargando un capacitor con corriente constante. Los generadores de funciones la entregan junto a la senoidal y la cuadrada.' },
  { id: 'onda-diente-sierra', n: 'Onda diente de sierra', v: 'rampa y caída brusca', alt: ['diente de sierra', 'sierra', 'rampa'], vb: VB, rel: ['onda-triangular'],
    s: ejes(40) + pl(sierra, 'v'),
    d: 'Sube en línea recta durante todo el período y cae de golpe a su valor inicial.',
    x: 'Es la señal de barrido horizontal de un osciloscopio y la portadora con la que se genera una señal PWM.' },
  { id: 'onda-media-onda', n: 'Rectificada de media onda', v: 'solo semiciclos positivos', alt: ['media onda', 'rectificación de media onda'], vb: VB, rel: ['onda-completa', 'onda-senoidal'],
    s: ejes(U) + pl(curva(function(x){ return U - A_U * Math.max(0, Math.sin(PI2 * (x - X0) / 34)); }, X0, X1, 0.5), 'v'),
    d: 'Se conservan los semiciclos positivos de una senoide y los negativos quedan en cero. Es lo que entrega un diodo solo.',
    x: 'El valor medio es Vp / π, cerca del 32 % del pico. La ondulación tiene la misma frecuencia que la red: 50 Hz.' },
  { id: 'onda-completa', n: 'Rectificada de onda completa', v: 'todos los semiciclos positivos', alt: ['onda completa', 'rectificación de onda completa', 'puente de diodos'], vb: VB, rel: ['onda-media-onda', 'onda-senoidal'],
    s: ejes(U) + pl(curva(function(x){ return U - A_U * Math.abs(Math.sin(PI2 * (x - X0) / 34)); }, X0, X1, 0.5), 'v'),
    d: 'Los semiciclos negativos se invierten y se suman a los positivos: la señal nunca baja de cero.',
    x: 'Su valor medio es 2 · Vp / π, cerca del 64 % del pico, y la ondulación tiene el doble de frecuencia que la red: 100 Hz. La entrega un puente de cuatro diodos.' },
  { id: 'tren-impulsos', n: 'Tren de impulsos', v: 'pulsos angostos repetidos', alt: ['impulsos', 'pulsos'], vb: VB, np: true, rel: ['onda-rectangular'],
    s: ejes(U) + pl(impulsos, 'v'),
    d: 'Una sucesión de pulsos muy angostos que se repiten a intervalos iguales. En la teoría se idealizan como impulsos de duración nula.',
    x: 'Dispara circuitos de temporización, tiristores y el muestreo de un conversor analógico/digital.' },
  { id: 'exponencial', n: 'Exponencial (carga de un capacitor)', v: 'V = Vf (1 − e^(−t/RC))', alt: ['carga de capacitor', 'respuesta al escalón', 'curva de carga'], vb: VB, rel: ['onda-senoidal'],
    s: ejes(U) + l(22, 18, 124, 18, 'tr fino') + l(48, 62, 48, 34.2, 'tr fino') +
       pl(curva(function(x){ return U - A_U * (1 - Math.exp(-(x - X0) / 26)); }, X0, X1, 1), 'v') +
       t(48, 74, 'τ', { z: 10, c: 'e' }),
    d: 'La tensión de un capacitor que se carga a través de un resistor: sube rápido al principio y se acerca despacio a la tensión final (línea de trazos).',
    x: 'Al cabo de una constante de tiempo τ = R · C llega al 63 % del valor final, y a los 5 τ, al 99 %.' },
  { id: 'ruido', n: 'Ruido', v: 'señal aleatoria', alt: ['ruido blanco', 'señal aleatoria', 'interferencia'], vb: VB, rel: ['onda-senoidal'],
    s: ejes(40) + pl(ruido, 've'),
    d: 'Una tensión que varía al azar, sin forma ni período: nunca se repite.',
    x: 'Todo resistor lo genera por la agitación térmica de los electrones. Se lo combate con blindaje, filtros y buenas masas.' },
  { id: 'portadora', n: 'Portadora', v: 'alta frecuencia, amplitud constante', alt: ['señal portadora', 'carrier'], vb: VB, np: true, rel: ['moduladora', 'senal-am', 'senal-fm'],
    s: ejes(40) + pl(curva(seno(6.8, 22, 40), X0, X1, 0.5), 'v'),
    d: 'Una senoide de frecuencia alta y amplitud constante que transporta la información de otra señal.',
    x: 'En la radio de AM la portadora está entre 530 y 1700 kHz; en la de FM, entre 88 y 108 MHz.' },
  { id: 'moduladora', n: 'Moduladora', v: 'señal de información', alt: ['señal moduladora', 'señal de información', 'mensaje'], vb: VB, np: true, rel: ['portadora', 'senal-am', 'senal-fm'],
    s: ejes(40) + pl(curva(function(x){ return 40 - 24 * Math.sin(PI2 * (x - X0) / 68); }, X0, X1, 1), 've'),
    d: 'La señal que se quiere transmitir (un sonido, por ejemplo) y que modifica a la portadora: es de frecuencia mucho más baja.',
    x: 'En audio ocupa entre 20 Hz y 20 kHz.' },
  { id: 'senal-am', n: 'Señal AM', v: 'amplitud modulada', alt: ['AM', 'modulación de amplitud'], vb: VB, rel: ['senal-fm', 'portadora', 'moduladora'],
    s: ejes(40) + pl(envolvente(1), 've tr fino') + pl(envolvente(-1), 've tr fino') + pl(am, 'v'),
    d: 'La amplitud de la portadora sigue a la moduladora: la envolvente (líneas de trazos) reproduce la forma de la señal de información.',
    x: 'La frecuencia no cambia, solo la amplitud. Es la modulación de la radio de onda media.' },
  { id: 'senal-fm', n: 'Señal FM', v: 'frecuencia modulada', alt: ['FM', 'modulación de frecuencia'], vb: VB, rel: ['senal-am', 'portadora', 'moduladora'],
    s: ejes(40) + pl(fm, 'v'),
    d: 'La amplitud es constante y la frecuencia de la portadora sube y baja siguiendo a la moduladora: los ciclos se juntan y se separan.',
    x: 'Como el ruido afecta sobre todo la amplitud, la FM suena más limpia que la AM. Es la radio de 88 a 108 MHz.' },
  { id: 'pwm', n: 'Señal PWM', v: 'modulación por ancho de pulso', alt: ['PWM', 'ancho de pulso', 'modulación por ancho de pulsos'], vb: VB, rel: ['onda-rectangular', 'onda-diente-sierra'],
    s: ejes(U) + pl(PWM, 'v'),
    d: 'Pulsos de período fijo y ancho variable: cuanto más ancho el pulso, mayor es la tensión media que ve la carga.',
    x: 'Regula la velocidad de un motor y el brillo de un LED sin disipar potencia en un resistor. Las salidas analogWrite del Arduino son PWM.' },
  { id: 'senal-digital', n: 'Señal digital', v: 'dos niveles: 0 y 1', alt: ['señal binaria', 'niveles lógicos', 'bits'], vb: VB, rel: ['onda-cuadrada', 'pwm'],
    s: ejes(U) + pl(digital, 'v') + t(11, 26, '1', { a: 'end', z: 10, c: 'e' }) + t(11, 66, '0', { a: 'end', z: 10, c: 'e' }),
    d: 'Solo toma dos valores, el nivel bajo (0) y el alto (1). Aquí se transmite la secuencia 1 0 1 1 0 0 1 0.',
    x: 'En TTL el nivel alto es de unos 5 V y en los microcontroladores modernos, de 3,3 V. El ruido no importa mientras no cruce el umbral.' },
  { id: 'espectro', n: 'Espectro de una señal', v: 'amplitud en función de la frecuencia', alt: ['espectro de frecuencias', 'análisis de Fourier', 'armónicas'], vb: VB, rel: ['onda-cuadrada'],
    s: l(18, 64, 18, 10, 'fino') + p('M18,4 L15.2,11 L20.8,11 Z', 'f fino') +
       l(14, 60, 124, 60, 'fino') + p('M130,60 L123,57.2 L123,62.8 Z', 'f fino') +
       t(11, 12, 'V', { a: 'end', z: 11, c: 'e' }) + t(135, 64, 'f', { a: 'start', z: 11, c: 'e' }) + espectro(),
    d: 'Una raya por cada componente de frecuencia de la señal, con altura igual a su amplitud. Aquí, el espectro de una onda cuadrada.',
    x: 'La cuadrada tiene la fundamental f₀ y solo armónicas impares (3f₀, 5f₀, …) con amplitud 1/3, 1/5, …. Se mide con un analizador de espectro.' }
]);
})();
