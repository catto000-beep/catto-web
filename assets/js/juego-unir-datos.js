/* ============================================================
   Unir con flechas · banco de parejas (30/10/2026)
   Cada tema: n (nombre), ic, d (bajada), izq/der (qué va en cada
   columna), p: lista de [izquierda, derecha]. Dentro de una ronda no
   se repite ninguna de las dos mitades.
   Los temas de símbolos no están acá: salen de la Simbología
   (publicaciones/simbologia/s-*.js) al cargar la página.
   ============================================================ */
var UNIR_TEMAS = {
  conceptos:{n:'Conceptos', ic:'📖', d:'Cada término con su definición.', izq:'Término', der:'Definición', p:[
    ['Tensión','Diferencia de potencial eléctrico entre dos puntos.'],
    ['Corriente','Cantidad de carga que atraviesa una sección por unidad de tiempo.'],
    ['Resistencia','Oposición de un material al paso de la corriente.'],
    ['Potencia','Energía entregada o consumida por unidad de tiempo.'],
    ['Impedancia','Oposición total a la corriente alterna, con una parte resistiva y otra reactiva.'],
    ['Reactancia','Oposición de un capacitor o una bobina a la alterna, que cambia con la frecuencia.'],
    ['Frecuencia','Cantidad de ciclos por segundo de una señal periódica.'],
    ['Período','Tiempo que dura un ciclo completo de una señal.'],
    ['Cortocircuito','Unión de dos puntos de distinto potencial por un camino casi sin resistencia.'],
    ['Circuito abierto','Camino interrumpido: no circula corriente.'],
    ['Semiconductor','Material que conduce más que un aislante y menos que un conductor.'],
    ['Dopaje','Agregado de impurezas a un cristal para cambiar cómo conduce.'],
    ['Rectificación','Conversión de corriente alterna en corriente de un solo sentido.'],
    ['Filtro','Circuito que deja pasar unas frecuencias y atenúa otras.'],
    ['Ganancia','Relación entre la señal de salida y la de entrada de un amplificador.'],
    ['Realimentación','Llevar una parte de la salida de nuevo a la entrada.'],
    ['Valor eficaz','Valor de continua que disiparía la misma potencia en un resistor.'],
    ['Constante de tiempo','Producto R · C que marca el ritmo de carga de un capacitor.'],
    ['Ley de Ohm','La corriente es proporcional a la tensión e inversa a la resistencia.'],
    ['Ley de nodos','Lo que entra a un nodo es igual a lo que sale.'],
    ['Ley de mallas','En un camino cerrado, las tensiones suman cero.'],
    ['Puesta a tierra','Conexión de las partes metálicas a tierra para proteger a las personas.'],
    ['Disyuntor diferencial','Corta el circuito cuando detecta una fuga de corriente a tierra.'],
    ['Interruptor termomagnético','Protege los cables contra sobrecargas y cortocircuitos.'],
    ['Modulación','Variar una característica de la portadora según la señal a transmitir.'],
    ['Bit','La unidad mínima de información: un 0 o un 1.'],
    ['Compuerta lógica','Circuito que da una salida binaria según una función de sus entradas.'],
    ['Flip-flop','Circuito biestable que guarda un bit.'],
    ['Osciloscopio','Instrumento que muestra cómo varía una tensión en el tiempo.'],
    ['Multímetro','Instrumento que mide tensión, corriente y resistencia.'],
    ['Capacitancia','Carga que se almacena por cada volt aplicado.'],
    ['Inductancia','Oposición a los cambios de corriente, guardando energía en un campo magnético.']
  ]},
  unidades:{n:'Magnitudes y unidades', ic:'📏', d:'Cada magnitud con su unidad del sistema internacional.', izq:'Magnitud', der:'Unidad', p:[
    ['Tensión','volt · V'],['Corriente','ampere · A'],['Resistencia','ohm · Ω'],['Potencia','watt · W'],
    ['Energía','joule · J'],['Carga eléctrica','coulomb · C'],['Capacitancia','farad · F'],['Inductancia','henry · H'],
    ['Frecuencia','hertz · Hz'],['Conductancia','siemens · S'],['Flujo magnético','weber · Wb'],['Inducción magnética','tesla · T'],
    ['Tiempo','segundo · s'],['Temperatura','kelvin · K'],['Fuerza','newton · N'],['Intensidad luminosa','candela · cd']
  ]},
  prefijos:{n:'Prefijos', ic:'🔢', d:'Cada prefijo con su nombre y su factor.', izq:'Prefijo', der:'Nombre y factor', grande:true, p:[
    ['T','tera · 10¹²'],['G','giga · 10⁹'],['M','mega · 10⁶'],['k','kilo · 10³'],['c','centi · 10⁻²'],
    ['m','mili · 10⁻³'],['µ','micro · 10⁻⁶'],['n','nano · 10⁻⁹'],['p','pico · 10⁻¹²'],['f','femto · 10⁻¹⁵']
  ]},
  matematica:{n:'Símbolos matemáticos', ic:'∑', d:'Los símbolos y letras griegas que aparecen en las fórmulas de las páginas.', izq:'Símbolo', der:'Qué significa', grande:true, p:[
    ['Σ','sumatoria'],['∫','integral'],['∮','integral sobre un camino cerrado'],['∂','derivada parcial'],
    ['Δ','variación, incremento'],['∞','infinito'],['√','raíz cuadrada'],['≈','aproximadamente igual'],
    ['∝','proporcional a'],['∠','separa módulo y ángulo en la forma polar'],['‖','en paralelo con'],['±','más o menos (tolerancia)'],
    ['ω','pulsación, velocidad angular'],['φ','desfasaje entre tensión y corriente'],['λ','longitud de onda'],['τ','constante de tiempo'],
    ['ρ','resistividad'],['ε','permitividad'],['π','razón entre circunferencia y diámetro'],['j','unidad imaginaria'],
    ['∇','nabla, gradiente'],['η','rendimiento']
  ]}
};
/* temas de símbolos: las categorías de la Simbología que entran en cada uno */
var UNIR_SIMB = {
  simbolos:{n:'Símbolos electrónicos', ic:'🔌', d:'Cada símbolo de esquema con el nombre del componente.', izq:'Símbolo', der:'Componente', cats:['conexion','pasivos','semis','bloques','sensores']},
  instalacion:{n:'Símbolos de instalación', ic:'🏠', d:'Los símbolos del plano de una vivienda y del tablero.', izq:'Símbolo', der:'Qué representa', cats:['plano','tablero']},
  ondas:{n:'Formas de onda', ic:'〰️', d:'Cada señal, como se ve en el osciloscopio, con su nombre.', izq:'Señal', der:'Nombre', cats:['ondas']}
};
