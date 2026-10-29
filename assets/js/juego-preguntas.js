/* ============================================================
   catto.ar — Ruleta de Ohm: banco de preguntas
   Seis categorías. Cada pregunta: id fijo (no cambiarlo: los desafíos en
   línea guardan los id), c = categoría, q = pregunta, o = opciones (la
   primera es la correcta; el juego las mezcla), u = página de tema para repasar
   (en /publicaciones/mapa-electronica/temas/).
   ============================================================ */
var JUEGO_CAT = {
  circ:   {n:"Circuitos",       c:"#58a6ff", ic:"⚡"},
  analog: {n:"Analógica",       c:"#e3a008", ic:"📈"},
  digital:{n:"Digital",         c:"#bc8cff", ic:"🔢"},
  medic:  {n:"Mediciones",      c:"#2dd4bf", ic:"📏"},
  elec:   {n:"Electricidad",    c:"#f85149", ic:"🔌"},
  com:    {n:"Comunicaciones",  c:"#ff7b72", ic:"📡"}
};

var JUEGO_PREG = [
/* ---------- CIRCUITOS ---------- */
{id:"c01", c:"circ", q:"Por un resistor de 100 Ω circulan 20 mA. ¿Qué tensión hay entre sus extremos?", o:["2 V","0,2 V","20 V","5 V"], u:"corriente-electrica"},
{id:"c02", c:"circ", q:"¿Cuánto vale la resistencia equivalente de dos resistores de 1 kΩ en paralelo?", o:["500 Ω","2 kΩ","1 kΩ","250 Ω"], u:"corriente-electrica"},
{id:"c03", c:"circ", q:"Una lámpara de 12 V consume 0,5 A. ¿Qué potencia disipa?", o:["6 W","24 W","0,04 W","12,5 W"], u:"magnitudes-electricas"},
{id:"c04", c:"circ", q:"La primera ley de Kirchhoff dice que, en un nodo…", o:["la suma de corrientes que entran es igual a la de las que salen","la suma de tensiones es cero","la corriente es igual en todas las ramas","la potencia se conserva en cada resistor"], u:"corriente-electrica"},
{id:"c05", c:"circ", q:"¿Qué valor eficaz tiene una senoide de 311 V de pico?", o:["220 V","311 V","440 V","155 V"], u:"corrientes-alternas"},
{id:"c06", c:"circ", q:"La red eléctrica en Argentina tiene una frecuencia de…", o:["50 Hz","60 Hz","220 Hz","100 Hz"], u:"corrientes-alternas"},
{id:"c07", c:"circ", q:"¿Qué le pasa a la reactancia de un capacitor si se duplica la frecuencia?", o:["Se reduce a la mitad","Se duplica","No cambia","Se cuadruplica"], u:"corrientes-alternas"},
{id:"c08", c:"circ", q:"¿Qué le pasa a la reactancia de un inductor si se duplica la frecuencia?", o:["Se duplica","Se reduce a la mitad","No cambia","Se hace cero"], u:"corrientes-alternas"},
{id:"c09", c:"circ", q:"¿En qué unidad se mide la capacidad de un capacitor?", o:["Faradio","Henrio","Ohmio","Weber"], u:"electrostatica"},
{id:"c10", c:"circ", q:"Un circuito RC tiene R = 10 kΩ y C = 100 µF. ¿Cuánto vale su constante de tiempo?", o:["1 s","0,1 s","10 s","1 ms"], u:"electrostatica"},
{id:"c11", c:"circ", q:"En un circuito RLC serie en resonancia, la impedancia es…", o:["mínima e igual a R","máxima","cero","infinita"], u:"corrientes-alternas"},
{id:"c12", c:"circ", q:"Bandas marrón, negro, rojo y dorado. ¿Qué resistor es?", o:["1 kΩ ±5 %","10 kΩ ±5 %","100 Ω ±5 %","102 Ω ±10 %"], u:"magnitudes-electricas"},
{id:"c13", c:"circ", q:"¿Qué ley describe que una variación de flujo magnético induce una tensión?", o:["Ley de Faraday","Ley de Ohm","Ley de Coulomb","Ley de Joule"], u:"magnetismo-electromagnetismo"},
{id:"c14", c:"circ", q:"Dos resistores de 2 kΩ en serie con una fuente de 12 V. ¿Qué tensión cae en cada uno?", o:["6 V","12 V","3 V","24 V"], u:"corriente-electrica"},
{id:"c15", c:"circ", q:"El factor de potencia de una carga puramente resistiva vale…", o:["1","0","0,5","-1"], u:"potencia-ca"},

/* ---------- ANALÓGICA ---------- */
{id:"a01", c:"analog", q:"¿Qué tensión de umbral aproximada tiene un diodo de silicio en directa?", o:["0,7 V","0,2 V","1,5 V","5 V"], u:"semiconductores-diodos"},
{id:"a02", c:"analog", q:"Un diodo zener se usa principalmente para…", o:["regular tensión","amplificar señales","rectificar alta frecuencia","emitir luz"], u:"semiconductores-diodos"},
{id:"a03", c:"analog", q:"Un transistor BJT tiene β = 100 y una corriente de base de 20 µA. ¿Cuánto vale la corriente de colector?", o:["2 mA","20 mA","0,2 mA","100 µA"], u:"transistores-bipolares"},
{id:"a04", c:"analog", q:"¿Cuáles son los terminales de un transistor bipolar?", o:["Base, colector y emisor","Gate, drain y source","Ánodo, cátodo y compuerta","Entrada, salida y masa"], u:"transistores-bipolares"},
{id:"a05", c:"analog", q:"Un amplificador operacional en configuración inversora con Rf = 100 kΩ y Rin = 10 kΩ tiene una ganancia de…", o:["-10","10","-11","11"], u:"amplificadores-senal-debil"},
{id:"a06", c:"analog", q:"En un amplificador no inversor con Rf = 90 kΩ y R1 = 10 kΩ, la ganancia es…", o:["10","9","-9","100"], u:"amplificadores-senal-debil"},
{id:"a07", c:"analog", q:"Un rectificador de onda completa con puente usa…", o:["cuatro diodos","un diodo","dos transistores","un zener"], u:"semiconductores-diodos"},
{id:"a08", c:"analog", q:"¿Para qué sirve el capacitor después del rectificador en una fuente?", o:["Filtrar el rizado","Subir la tensión","Limitar la corriente","Aislar la red"], u:"semiconductores-diodos"},
{id:"a09", c:"analog", q:"Un amplificador clase A conduce durante…", o:["los 360° del ciclo","180° del ciclo","menos de 180°","solo los picos"], u:"amplificadores-potencia"},
{id:"a10", c:"analog", q:"La principal ventaja de una fuente conmutada frente a una lineal es…", o:["su rendimiento","su bajo ruido","su simplicidad","que no usa inductores"], u:"fuentes-conmutadas"},
{id:"a11", c:"analog", q:"Para que un circuito oscile, la ganancia de lazo debe ser…", o:["1 con fase de 0° (o 360°)","0","menor que 0,5","infinita con fase de 90°"], u:"osciladores"},
{id:"a12", c:"analog", q:"Un filtro pasabajos RC deja pasar…", o:["las frecuencias por debajo de la de corte","las frecuencias por encima de la de corte","solo una banda angosta","solo la continua invertida"], u:"filtros"},
{id:"a13", c:"analog", q:"La frecuencia de corte de un filtro RC es…", o:["1/(2πRC)","2πRC","RC/2π","1/(RC)²"], u:"filtros"},
{id:"a14", c:"analog", q:"Un tiristor (SCR) entra en conducción cuando…", o:["recibe un pulso en la compuerta con el ánodo positivo","se invierte la tensión","se apaga la carga","la corriente baja a cero"], u:"componentes-potencia"},
{id:"a15", c:"analog", q:"¿Qué componente se usa para controlar potencia en corriente alterna en ambos semiciclos?", o:["TRIAC","Diodo zener","Optoacoplador","Regulador 7805"], u:"componentes-potencia"},

/* ---------- DIGITAL ---------- */
{id:"d01", c:"digital", q:"¿Cuánto vale 1010 en binario expresado en decimal?", o:["10","12","8","5"], u:"logica-combinacional"},
{id:"d02", c:"digital", q:"Una compuerta NAND da 0 a la salida solo cuando…", o:["todas sus entradas están en 1","alguna entrada está en 0","todas sus entradas están en 0","las entradas son distintas"], u:"logica-combinacional"},
{id:"d03", c:"digital", q:"¿Qué compuerta da 1 solo cuando sus dos entradas son distintas?", o:["XOR","AND","NOR","XNOR"], u:"logica-combinacional"},
{id:"d04", c:"digital", q:"¿Cuánto vale FF en hexadecimal expresado en decimal?", o:["255","256","15","1515"], u:"logica-combinacional"},
{id:"d05", c:"digital", q:"Un flip-flop D, en el flanco del reloj…", o:["copia a la salida el valor de D","invierte la salida","pone la salida en cero","no cambia nunca"], u:"logica-secuencial"},
{id:"d06", c:"digital", q:"¿Cuántos flip-flops necesita un contador que cuente de 0 a 15?", o:["4","15","8","16"], u:"logica-secuencial"},
{id:"d07", c:"digital", q:"Un conversor A/D de 8 bits distingue…", o:["256 niveles","8 niveles","1024 niveles","128 niveles"], u:"conversores-ad-da"},
{id:"d08", c:"digital", q:"Según el teorema de Nyquist, para digitalizar una señal de hasta 20 kHz hay que muestrear a más de…", o:["40 kHz","20 kHz","10 kHz","80 kHz"], u:"teorema-muestreo"},
{id:"d09", c:"digital", q:"El mapa de Karnaugh sirve para…", o:["simplificar funciones lógicas","medir tiempos de propagación","programar memorias","diseñar fuentes"], u:"logica-combinacional"},
{id:"d10", c:"digital", q:"¿Qué memoria pierde su contenido al cortarse la alimentación?", o:["RAM","EEPROM","Flash","ROM"], u:"memorias-dispositivos-programables"},
{id:"d11", c:"digital", q:"Un microcontrolador, a diferencia de un microprocesador, trae…", o:["memoria y periféricos integrados en el mismo chip","solo la unidad aritmética","más núcleos","un sistema operativo"], u:"familia-microcontroladores"},
{id:"d12", c:"digital", q:"Una interrupción permite que el microcontrolador…", o:["atienda un evento sin estar consultándolo todo el tiempo","se reinicie","duplique su velocidad","borre la memoria"], u:"interrupciones"},
{id:"d13", c:"digital", q:"¿Qué bus serie usa dos líneas, SDA y SCL?", o:["I²C","SPI","UART","USB"], u:"buses-serie"},
{id:"d14", c:"digital", q:"En lenguaje C, ¿qué operador hace un AND bit a bit?", o:["&","&&","|","^"], u:"lenguaje-c"},
{id:"d15", c:"digital", q:"Un display de 7 segmentos de cátodo común enciende un segmento con…", o:["un 1 lógico en ese segmento","un 0 lógico en ese segmento","el cátodo a positivo","una señal de reloj"], u:"displays"},

/* ---------- MEDICIONES ---------- */
{id:"m01", c:"medic", q:"Para medir corriente con un multímetro, el instrumento se conecta…", o:["en serie con la carga","en paralelo con la carga","entre fase y tierra","sin cortar el circuito, en cualquier punto"], u:"instrumentos-digitales"},
{id:"m02", c:"medic", q:"Para medir tensión, el voltímetro se conecta…", o:["en paralelo","en serie","con el circuito apagado","a través de un resistor de 1 Ω"], u:"instrumentos-digitales"},
{id:"m03", c:"medic", q:"Un voltímetro ideal tiene una resistencia interna…", o:["infinita","nula","de 1 kΩ","igual a la de la carga"], u:"instrumentos-analogicos"},
{id:"m04", c:"medic", q:"En el osciloscopio, una señal ocupa 4 divisiones de pico a pico con 2 V/div. ¿Cuál es su tensión pico a pico?", o:["8 V","2 V","4 V","16 V"], u:"osciloscopio"},
{id:"m05", c:"medic", q:"Un período ocupa 5 divisiones con la base de tiempo en 1 ms/div. ¿Cuál es la frecuencia?", o:["200 Hz","5 kHz","1 kHz","50 Hz"], u:"osciloscopio"},
{id:"m06", c:"medic", q:"¿Para qué sirve el control de disparo (trigger) del osciloscopio?", o:["Para que la imagen quede quieta","Para cambiar la escala vertical","Para medir corriente","Para apagar el haz"], u:"osciloscopio"},
{id:"m07", c:"medic", q:"Un multímetro común en alterna mide bien el valor eficaz solo si la señal es…", o:["senoidal","cuadrada","triangular","continua"], u:"mediciones-ca"},
{id:"m08", c:"medic", q:"Medir resistencia con el circuito alimentado…", o:["da lecturas erróneas y puede dañar el instrumento","es lo recomendado","solo funciona en alterna","no tiene ningún efecto"], u:"instrumentos-digitales"},
{id:"m09", c:"medic", q:"Una punta de osciloscopio ×10 divide la señal por…", o:["10","2","100","1"], u:"osciloscopio"},
{id:"m10", c:"medic", q:"El puente de Wheatstone se usa para medir…", o:["resistencias con precisión","frecuencia","potencia reactiva","temperatura de juntura"], u:"mediciones-impedancia"},
{id:"m11", c:"medic", q:"¿Qué instrumento muestra una señal en el dominio de la frecuencia?", o:["Analizador de espectro","Multímetro","Megóhmetro","Pinza amperométrica"], u:"mediciones-rf"},
{id:"m12", c:"medic", q:"Una pinza amperométrica mide la corriente…", o:["sin abrir el circuito, por el campo magnético","abriendo el circuito","con dos puntas en paralelo","solo en continua"], u:"instrumentos-analogicos"},
{id:"m13", c:"medic", q:"Un error de paralaje aparece al leer…", o:["un instrumento de aguja","un display digital","un osciloscopio digital","un registrador de datos"], u:"instrumentos-analogicos"},
{id:"m14", c:"medic", q:"¿Qué mide un megóhmetro (megger)?", o:["La resistencia de aislación","La frecuencia de red","La potencia activa","La inductancia"], u:"instrumentos-analogicos"},
{id:"m15", c:"medic", q:"Un instrumento de 3½ dígitos puede mostrar como máximo…", o:["1999","999","9999","3500"], u:"instrumentos-digitales"},

/* ---------- ELECTRICIDAD ---------- */
{id:"e01", c:"elec", q:"¿Qué protege el disyuntor diferencial?", o:["A las personas contra contactos con fugas a tierra","A los cables contra cortocircuitos","Al motor contra sobrecargas","A la red contra rayos"], u:"proteccion-electrica"},
{id:"e02", c:"elec", q:"La sensibilidad habitual de un diferencial para viviendas es…", o:["30 mA","300 mA","10 A","1 A"], u:"proteccion-electrica"},
{id:"e03", c:"elec", q:"La llave termomagnética protege contra…", o:["sobrecargas y cortocircuitos","contactos indirectos","sobretensiones atmosféricas","falta de fase solamente"], u:"proteccion-electrica"},
{id:"e04", c:"elec", q:"En una instalación domiciliaria, el conductor de protección (tierra) es de color…", o:["verde y amarillo","celeste","marrón","negro"], u:"instalaciones-vivienda"},
{id:"e05", c:"elec", q:"El conductor neutro se identifica con el color…", o:["celeste","verde y amarillo","rojo","marrón"], u:"instalaciones-vivienda"},
{id:"e06", c:"elec", q:"En un sistema trifásico de 380 V entre fases, la tensión entre fase y neutro es…", o:["220 V","380 V","110 V","660 V"], u:"circuitos-trifasicos"},
{id:"e07", c:"elec", q:"Un transformador con 1000 espiras en el primario y 100 en el secundario, alimentado con 220 V, entrega…", o:["22 V","2200 V","220 V","11 V"], u:"transformadores"},
{id:"e08", c:"elec", q:"¿Por qué el núcleo de un transformador es de chapas apiladas y aisladas?", o:["Para reducir las corrientes parásitas","Para que pese menos","Para aumentar la tensión","Para enfriar el bobinado"], u:"transformadores"},
{id:"e09", c:"elec", q:"Para invertir el sentido de giro de un motor trifásico se…", o:["intercambian dos fases","invierte el neutro","agrega un capacitor","baja la tensión"], u:"motores-ca"},
{id:"e10", c:"elec", q:"El arranque estrella-triángulo sirve para…", o:["reducir la corriente de arranque","aumentar el par máximo","frenar el motor","cambiar la frecuencia"], u:"motores-ca"},
{id:"e11", c:"elec", q:"Un variador de frecuencia controla la velocidad de un motor de inducción modificando…", o:["la frecuencia y la tensión de alimentación","solo la corriente","el número de polos","la resistencia del rotor"], u:"variadores-velocidad"},
{id:"e12", c:"elec", q:"En un PLC, un contacto normalmente abierto en el lenguaje Ladder…", o:["deja pasar la señal cuando la entrada está activa","deja pasar la señal cuando la entrada está inactiva","es una salida","es un temporizador"], u:"programacion-plc"},
{id:"e13", c:"elec", q:"¿Qué elemento protege a un motor contra sobrecargas prolongadas?", o:["El relé térmico","El fusible ultrarrápido","El pulsador de parada","El contactor"], u:"mando-senalizacion"},
{id:"e14", c:"elec", q:"La puesta a tierra de una instalación sirve para…", o:["derivar a tierra las corrientes de falla y proteger a las personas","ahorrar energía","mejorar el factor de potencia","aumentar la tensión"], u:"proteccion-electrica"},
{id:"e15", c:"elec", q:"En un circuito de comando, el contacto de autorretención…", o:["mantiene energizado el contactor al soltar el pulsador de marcha","apaga el motor","invierte el giro","mide la corriente"], u:"mando-senalizacion"},

/* ---------- COMUNICACIONES ---------- */
{id:"k01", c:"com", q:"¿Cuánto mide aproximadamente la longitud de onda de una señal de 100 MHz?", o:["3 m","30 cm","30 m","300 m"], u:"antenas"},
{id:"k02", c:"com", q:"En AM, la información va en…", o:["la amplitud de la portadora","la frecuencia de la portadora","la fase de la portadora","la polarización"], u:"sistemas-modulacion"},
{id:"k03", c:"com", q:"En FM, la información va en…", o:["la frecuencia de la portadora","la amplitud de la portadora","el ancho de la antena","la potencia del transmisor"], u:"sistemas-modulacion"},
{id:"k04", c:"com", q:"Un dipolo de media onda para 145 MHz mide aproximadamente…", o:["1 m","2 m","50 cm","10 cm"], u:"antenas"},
{id:"k05", c:"com", q:"¿Qué significa una ganancia de 3 dB?", o:["El doble de potencia","El triple de potencia","Diez veces más potencia","La mitad de potencia"], u:"antenas"},
{id:"k06", c:"com", q:"La fibra óptica transmite la información mediante…", o:["luz guiada por reflexión total interna","corriente eléctrica","ondas de sonido","campos magnéticos"], u:"fibra-optica"},
{id:"k07", c:"com", q:"Según Fourier, una onda cuadrada se puede descomponer en…", o:["una suma de senoides armónicas impares","una sola senoide","ruido blanco","una rampa"], u:"senales-fourier"},
{id:"k08", c:"com", q:"Una ROE (relación de onda estacionaria) de 1:1 indica…", o:["adaptación perfecta entre línea y antena","que toda la potencia se refleja","una antena en cortocircuito","pérdida total"], u:"antenas"},
{id:"k09", c:"com", q:"Un satélite geoestacionario está a unos…", o:["36 000 km de altura","400 km de altura","3600 km de altura","384 000 km de altura"], u:"comunicacion-satelital"},
{id:"k10", c:"com", q:"En QAM, la información se codifica en…", o:["la amplitud y la fase","solo la frecuencia","solo la polarización","el tiempo de llegada"], u:"modulacion-digital"},
{id:"k11", c:"com", q:"La telefonía celular divide el área de cobertura en…", o:["celdas","sectores de fibra","canales de audio","anillos de cobre"], u:"telefonia-celular"},
{id:"k12", c:"com", q:"¿Qué es el aliasing?", o:["Una distorsión por muestrear por debajo del doble de la frecuencia máxima","Un tipo de antena","Una modulación digital","Un error de cuantificación por exceso de bits"], u:"teorema-muestreo"},
{id:"k13", c:"com", q:"En un enlace de microondas, la zona de Fresnel debe…", o:["estar libre de obstáculos en su mayor parte","estar bloqueada para evitar interferencias","coincidir con el suelo","tener la mitad de la altura de la antena"], u:"enlaces-microondas"},
{id:"k14", c:"com", q:"La norma RS-485 se usa en la industria porque…", o:["admite largas distancias y varios equipos en el mismo par","es inalámbrica","no necesita cables","transmite video"], u:"comunicaciones-industriales"},
{id:"k15", c:"com", q:"¿Qué ancho de banda ocupa una señal de AM con audio de hasta 5 kHz?", o:["10 kHz","5 kHz","200 kHz","2,5 kHz"], u:"sistemas-modulacion"}
];
