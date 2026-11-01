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
    ['Inductancia','Oposición a los cambios de corriente, guardando energía en un campo magnético.'],
    ['Teorema de Thévenin','Una red lineal equivale a una fuente de tensión en serie con una resistencia.'],
    ['Teorema de Norton','Una red lineal equivale a una fuente de corriente en paralelo con una resistencia.'],
    ['Superposición','En un circuito lineal, el efecto total es la suma del de cada fuente actuando sola.'],
    ['Divisor de tensión','Resistores en serie que reparten la tensión en proporción a sus valores.'],
    ['Divisor de corriente','Resistores en paralelo que reparten la corriente en proporción inversa a su valor.'],
    ['Resonancia','Situación en que la reactancia de la bobina y la del capacitor se igualan.'],
    ['Factor de calidad','Relación entre la energía almacenada y la perdida por ciclo en un resonador.'],
    ['Factor de potencia','Coseno del desfasaje entre tensión y corriente: la fracción útil de la potencia.'],
    ['Potencia reactiva','Parte de la potencia que va y viene entre fuente y carga sin hacer trabajo.'],
    ['Ancho de banda','Rango de frecuencias que un circuito deja pasar atenuando menos de 3 dB.'],
    ['Decibel','Medida logarítmica de la relación entre dos potencias o dos tensiones.'],
    ['Diodo Zener','Diodo que trabaja en inversa, en ruptura, para fijar una tensión de referencia.'],
    ['Saturación','Estado de un transistor que conduce al máximo, como una llave cerrada.'],
    ['Corte','Estado de un transistor que no conduce, como una llave abierta.'],
    ['Amplificador operacional','Amplificador de ganancia muy alta y entrada diferencial, usado con realimentación.'],
    ['Comparador','Circuito que indica cuál de dos tensiones es mayor, con salida de dos niveles.'],
    ['Histéresis','Diferencia entre los umbrales de subida y de bajada, que evita oscilar por ruido.'],
    ['PWM','Señal de frecuencia fija cuyo ancho de pulso varía para cambiar la potencia media.'],
    ['Multiplexor','Circuito que elige una entre varias entradas y la lleva a una única salida.'],
    ['Decodificador','Circuito que activa una sola de sus salidas según el código de entrada.'],
    ['Complemento a dos','Forma de representar enteros binarios con signo que simplifica la resta.'],
    ['Código Gray','Código binario donde dos valores consecutivos difieren en un solo bit.'],
    ['Conversor A/D','Convierte una tensión analógica en un número binario.'],
    ['Termocupla','Sensor de temperatura de dos metales distintos que genera una pequeña tensión.'],
    ['Relación señal/ruido','Cociente entre la potencia de la señal útil y la del ruido.'],
    ['Error relativo','Error absoluto de una medición dividido por el valor verdadero.'],
    ['Megóhmetro','Instrumento que mide la resistencia de aislación con alta tensión continua.'],
    ['Telurímetro','Instrumento que mide la resistencia de una puesta a tierra.']
  ]},
  unidades:{n:'Magnitudes y unidades', ic:'📏', d:'Cada magnitud con su unidad del sistema internacional.', izq:'Magnitud', der:'Unidad', p:[
    ['Tensión','volt · V'],['Corriente','ampere · A'],['Resistencia','ohm · Ω'],['Potencia','watt · W'],
    ['Energía','joule · J'],['Carga eléctrica','coulomb · C'],['Capacitancia','farad · F'],['Inductancia','henry · H'],
    ['Frecuencia','hertz · Hz'],['Conductancia','siemens · S'],['Flujo magnético','weber · Wb'],['Inducción magnética','tesla · T'],
    ['Tiempo','segundo · s'],['Temperatura','kelvin · K'],['Fuerza','newton · N'],['Intensidad luminosa','candela · cd'],
    ['Campo eléctrico','volt por metro · V/m'],['Resistividad','ohm metro · Ω·m'],['Velocidad angular','radián por segundo · rad/s'],['Ángulo','radián · rad'],
    ['Longitud','metro · m'],['Masa','kilogramo · kg'],['Potencia aparente','volt-ampere · VA'],['Potencia reactiva','volt-ampere reactivo · var'],
    ['Energía facturada','kilowatt hora · kWh'],['Carga de una batería','ampere hora · Ah'],['Intensidad de campo magnético','ampere por metro · A/m'],['Permitividad','farad por metro · F/m'],
    ['Velocidad de transmisión','bit por segundo · bit/s'],['Relación de potencias','decibel · dB']
  ]},
  prefijos:{n:'Prefijos', ic:'🔢', d:'Cada prefijo con su nombre y su factor.', izq:'Prefijo', der:'Nombre y factor', grande:true, p:[
    ['T','tera · 10¹²'],['G','giga · 10⁹'],['M','mega · 10⁶'],['k','kilo · 10³'],['c','centi · 10⁻²'],
    ['m','mili · 10⁻³'],['µ','micro · 10⁻⁶'],['n','nano · 10⁻⁹'],['p','pico · 10⁻¹²'],['f','femto · 10⁻¹⁵'],
    ['E','exa · 10¹⁸'],['P','peta · 10¹⁵'],['h','hecto · 10²'],['da','deca · 10¹'],['d','deci · 10⁻¹'],['a','atto · 10⁻¹⁸']
  ]},
  matematica:{n:'Símbolos matemáticos', ic:'∑', d:'Los símbolos y letras griegas que aparecen en las fórmulas de las páginas.', izq:'Símbolo', der:'Qué significa', grande:true, p:[
    ['Σ','sumatoria'],['∫','integral'],['∮','integral sobre un camino cerrado'],['∂','derivada parcial'],
    ['Δ','variación, incremento'],['∞','infinito'],['√','raíz cuadrada'],['≈','aproximadamente igual'],
    ['∝','proporcional a'],['∠','separa módulo y ángulo en la forma polar'],['‖','en paralelo con'],['±','más o menos (tolerancia)'],
    ['ω','pulsación, velocidad angular'],['φ','desfasaje entre tensión y corriente'],['λ','longitud de onda'],['τ','constante de tiempo'],
    ['ρ','resistividad'],['ε','permitividad'],['π','razón entre circunferencia y diámetro'],['j','unidad imaginaria'],
    ['∇','nabla, gradiente'],['η','rendimiento'],
    ['|z|','módulo de un número complejo'],['z*','conjugado de un número complejo'],['⟨x⟩','valor medio de x'],['log','logaritmo en base 10'],
    ['ln','logaritmo en base e'],['σ','conductividad'],
    ['α','coeficiente de temperatura'],['β','ganancia de corriente (hFE)'],['Φ','flujo magnético'],['≠','distinto de'],
    ['≤','menor o igual que'],['≥','mayor o igual que'],['≪','mucho menor que'],['→','tiende a'],
    ['e','número de Euler, 2,718…'],['∏','productoria']
  ]}
};
/* temas de símbolos: las categorías de la Simbología que entran en cada uno */
var UNIR_SIMB = {
  simbolos:{n:'Símbolos electrónicos', ic:'🔌', d:'Cada símbolo de esquema con el nombre del componente.', izq:'Símbolo', der:'Componente', cats:['conexion','pasivos','semis','bloques','sensores']},
  instalacion:{n:'Símbolos de instalación', ic:'🏠', d:'Los símbolos del plano de una vivienda y del tablero.', izq:'Símbolo', der:'Qué representa', cats:['plano','tablero']},
  ondas:{n:'Formas de onda', ic:'〰️', d:'Cada señal, como se ve en el osciloscopio, con su nombre.', izq:'Señal', der:'Nombre', cats:['ondas']}
};
