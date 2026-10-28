/* ============================================================
   catto.ar - Datos de la carrera de Sonido (plan de catto.ar)
   No es un plan oficial: es un plan propio, armado sobre dos planes oficiales.
   · Columna vertebral, horas y correlatividades: Ingeniería de Sonido,
     Universidad Nacional de Tres de Febrero (UNTREF), Resolución Ministerial
     1964/07 (título intermedio de Técnico en Grabación y Sonido a los 3 años).
     Esa resolución no publica contenidos mínimos: los ejes de esas materias
     los redactó catto.ar sobre el nombre, la ubicación y las correlatividades.
   · Contenidos de estudio, producción y escucha: Tecnicatura Superior en
     Sonido y Producción Musical, CABA, Resolución 536/SSPLINED/17 (Boletín
     Oficial 5253, 13/11/2017). Los ejes de esas materias resumen sus
     contenidos mínimos.
   Se dejaron afuera las materias humanísticas generales y las comerciales.
   f: de dónde sale la materia. "U" = UNTREF, "C" = CABA, "UC" = materia de la
      UNTREF con contenidos tomados de CABA.
   h: horas. Las de la UNTREF son las de su plan; las que se suman desde CABA
      llevan una carga orientativa.
   Por ahora ningún eje tiene página (sin u). Lo usan /publicaciones/mapa-sonido
   y la portada.
   ============================================================ */
var AREAS = {
  fund:    {nombre:"Ciencias básicas", color:"#58a6ff"},
  acus:    {nombre:"Acústica y psicoacústica", color:"#2dd4bf"},
  elec:    {nombre:"Electrónica y electroacústica", color:"#e3a008"},
  senal:   {nombre:"Señales y audio digital", color:"#bc8cff"},
  estudio: {nombre:"Grabación, mezcla y producción", color:"#f85149"},
  musica:  {nombre:"Lenguaje musical y escucha", color:"#f2cc60"},
  medios:  {nombre:"Sonido para los medios", color:"#ff7b72"},
  practica:{nombre:"Práctica profesional y proyecto", color:"#8b949e"}
};

// Temas transversales (ejes que cruzan materias)
var TEMAS = {
  mate:    {n:"Matemática para la señal", c:"#79c0ff"},
  fisica:  {n:"Física: ondas y oscilaciones", c:"#58a6ff"},
  onda:    {n:"El sonido: propagación y niveles", c:"#2dd4bf"},
  psico:   {n:"Audición y psicoacústica", c:"#56d4dd"},
  recinto: {n:"Acústica de recintos", c:"#26a69a"},
  ruido:   {n:"Ruido y control", c:"#00897b"},
  circ:    {n:"Circuitos y electrónica analógica", c:"#e3a008"},
  transd:  {n:"Micrófonos y altavoces", c:"#f2cc60"},
  senal:   {n:"Señales, sistemas y Fourier", c:"#bc8cff"},
  digital: {n:"Audio digital y DSP", c:"#a371f7"},
  proc:    {n:"Ecualización, dinámica y efectos", c:"#d2a8ff"},
  grab:    {n:"Grabación", c:"#f85149"},
  mezcla:  {n:"Mezcla y masterización", c:"#ff7b72"},
  vivo:    {n:"Sonido en vivo y refuerzo", c:"#f0883e"},
  medic:   {n:"Mediciones", c:"#ffa657"},
  musica:  {n:"Lenguaje musical", c:"#ffd33d"},
  sintesis:{n:"Síntesis y MIDI", c:"#db61a2"},
  medios:  {n:"Cine, TV, radio y videojuegos", c:"#ec6547"},
  proyecto:{n:"Proyecto y ejercicio profesional", c:"#8b949e"}
};

// lvl: profundidad del eje (1 intro · 2 desarrollo · 3 profundización · 4 aplicación/integración)
var MATERIAS = [
/* ---------- 1° AÑO ---------- */
{id:"am1", n:"Análisis Matemático I", area:"fund", anio:1, h:90, f:"U", ejes:[
  {t:"Funciones de una variable", d:"Funciones elementales, gráficas y transformaciones. Funciones exponencial, logarítmica y trigonométricas: las que describen una onda y un nivel en decibeles.", tm:[["mate",1]]},
  {t:"Límite y continuidad", d:"Límite, continuidad y asíntotas. Comportamiento de una función cerca de un punto y en el infinito.", tm:[["mate",1]]},
  {t:"Derivada", d:"Derivada como tasa de cambio, reglas de derivación, recta tangente. Velocidad y aceleración de una partícula que oscila.", tm:[["mate",1]]},
  {t:"Integral", d:"Integral indefinida y definida, teorema fundamental, área bajo la curva. Valor medio y valor eficaz de una señal periódica.", tm:[["mate",1]]},
  {t:"Sucesiones y series", d:"Sucesiones, series numéricas y de potencias. Aproximación de funciones por polinomios de Taylor.", tm:[["mate",1]]}
]},
{id:"alg1", n:"Álgebra I", area:"fund", anio:1, h:90, f:"U", ejes:[
  {t:"Números complejos", d:"Forma binómica, polar y exponencial. Operaciones. La herramienta para representar amplitud y fase de una senoide.", tm:[["mate",1],["senal",1]]},
  {t:"Vectores", d:"Vectores en el plano y el espacio, producto escalar y vectorial. Rectas y planos.", tm:[["mate",1]]},
  {t:"Matrices y determinantes", d:"Operaciones con matrices, determinante, matriz inversa.", tm:[["mate",1]]},
  {t:"Sistemas de ecuaciones lineales", d:"Resolución por eliminación de Gauss. Sistemas compatibles e incompatibles.", tm:[["mate",1]]}
]},
{id:"fis1", n:"Física I", area:"fund", anio:1, h:90, f:"U", ejes:[
  {t:"Cinemática y dinámica", d:"Movimiento en una y dos dimensiones. Leyes de Newton. Trabajo, energía y potencia.", tm:[["fisica",1]]},
  {t:"Movimiento oscilatorio", d:"Movimiento armónico simple: masa y resorte, péndulo. Oscilaciones amortiguadas y forzadas, resonancia. La base de todo sistema que vibra.", tm:[["fisica",2],["onda",1]]},
  {t:"Ondas mecánicas", d:"Ondas transversales y longitudinales. Velocidad, frecuencia y longitud de onda. Superposición, ondas estacionarias y modos de una cuerda o un tubo.", tm:[["fisica",2],["onda",1]]},
  {t:"Fluidos", d:"Presión, principio de Pascal y de Arquímedes. Presión atmosférica: el medio en el que viaja el sonido.", tm:[["fisica",1]]}
]},
{id:"comp", n:"Computación", area:"fund", anio:1, h:60, f:"U", ejes:[
  {t:"Algoritmos y programación", d:"Variables, estructuras de control, funciones. Un primer lenguaje para calcular y graficar.", tm:[["mate",1]]},
  {t:"Arreglos y señales", d:"Una señal como lista de muestras: generar, recorrer, sumar y graficar senoides.", tm:[["digital",1]]},
  {t:"Archivos de audio", d:"Leer y escribir un archivo WAV: frecuencia de muestreo, canales y resolución.", tm:[["digital",1]]}
]},
{id:"iap", n:"Introducción a la Acústica y Psicoacústica", area:"acus", anio:1, h:90, f:"UC", ejes:[
  {t:"Qué es el sonido", d:"Presión sonora y presión atmosférica. Propagación en un medio elástico, velocidad del sonido. Frecuencia, período, longitud de onda y amplitud.", tm:[["onda",1]]},
  {t:"Decibeles y niveles", d:"Logaritmos y decibel. Nivel de presión sonora, intensidad y potencia acústica. Niveles de referencia y tabla de SPL.", tm:[["onda",1],["mate",1]]},
  {t:"Forma de onda y timbre", d:"Tono fundamental y armónicos. Formas de onda, fase y timbre. Suma de senoides. Ruido blanco y ruido rosa.", tm:[["onda",1],["senal",1]]},
  {t:"El oído y la audición", d:"Anatomía del oído y mecanismos de la audición. Rango audible. Percepción de altura, sonoridad y curvas de igual sonoridad.", tm:[["psico",1]]}
]},
{id:"am2", n:"Análisis Matemático II", area:"fund", anio:1, h:90, f:"U", ejes:[
  {t:"Funciones de varias variables", d:"Derivadas parciales, gradiente y diferencial. Un campo de presión que depende del lugar y del tiempo.", tm:[["mate",2]]},
  {t:"Integrales múltiples", d:"Integrales dobles y triples. Áreas, volúmenes y valores medios.", tm:[["mate",2]]},
  {t:"Ecuaciones diferenciales ordinarias", d:"Ecuaciones de primer y segundo orden. La ecuación del oscilador amortiguado y su respuesta.", tm:[["mate",2],["fisica",2]]},
  {t:"Integrales de línea y superficie", d:"Campos vectoriales, circulación y flujo. Teoremas de Green, Stokes y Gauss.", tm:[["mate",2]]}
]},
{id:"alg2", n:"Álgebra II", area:"fund", anio:1, h:90, f:"U", ejes:[
  {t:"Espacios vectoriales", d:"Subespacios, bases y dimensión. Una señal como vector y una base de señales.", tm:[["mate",2],["senal",1]]},
  {t:"Transformaciones lineales", d:"Núcleo, imagen y matriz asociada. Los sistemas lineales, vistos como transformaciones.", tm:[["mate",2]]},
  {t:"Autovalores y autovectores", d:"Diagonalización. Modos propios de un sistema que vibra.", tm:[["mate",2]]},
  {t:"Producto interno y ortogonalidad", d:"Proyección y bases ortogonales: la idea que está detrás de la serie de Fourier.", tm:[["mate",2],["senal",1]]}
]},
{id:"fis2", n:"Física II", area:"fund", anio:1, h:90, f:"U", ejes:[
  {t:"Termodinámica", d:"Temperatura, calor y primera ley. Procesos adiabáticos: por qué la velocidad del sonido depende de la temperatura.", tm:[["fisica",2],["onda",1]]},
  {t:"Óptica y ondas", d:"Reflexión, refracción, interferencia y difracción. Los mismos fenómenos que tiene el sonido en una sala.", tm:[["fisica",2]]},
  {t:"Electrostática", d:"Carga, campo y potencial eléctrico. Capacitores: el principio del micrófono de condensador.", tm:[["fisica",1],["transd",1]]}
]},
{id:"gr1", n:"Grabación I", area:"estudio", anio:1, h:90, f:"UC", ejes:[
  {t:"El estudio de grabación", d:"Sala de control y sala de grabación. Roles y funciones. Equipos del estudio y su interconexión.", tm:[["grab",1]]},
  {t:"Recorrido de la señal", d:"Micrófono, consola, computadora y monitoreo. Vocabulario: dB, medidores, headroom, relación señal-ruido, nivel nominal y máximo, respuesta en frecuencia.", tm:[["grab",1],["onda",1]]},
  {t:"Cables y conectores", d:"Señales balanceadas y no balanceadas, conectores XLR, TRS y RCA. Cajas directas. Armado y prueba de cables.", tm:[["grab",1],["circ",1]]},
  {t:"Primeras tomas", d:"Grabación analógica y digital. Grabación casera en la computadora: software, sesión, pistas y niveles.", tm:[["grab",1],["digital",1]]}
]},
{id:"lm1", n:"Lenguaje Musical y Audioperceptiva I", area:"musica", anio:1, h:60, f:"C", ejes:[
  {t:"Lectura y escritura musical", d:"Claves, figuras, compases y tonalidades. Manejo del cifrado.", tm:[["musica",1]]},
  {t:"Acordes y enlaces", d:"Escritura de acordes en sus posiciones y enlaces más comunes. Enlaces de blues, intercambios modales y tensiones.", tm:[["musica",1]]},
  {t:"Ritmo e intervalos", d:"Ritmos binarios y ternarios. Intervalos melódicos y armónicos. Escala mayor armonizada.", tm:[["musica",1],["psico",1]]},
  {t:"Dictado y canto", d:"Dictado de melodías simples en mayor y menor. Canto a primera vista de tríadas.", tm:[["musica",1]]}
]},

/* ---------- 2° AÑO ---------- */
{id:"am3", n:"Análisis Matemático III", area:"fund", anio:2, h:90, f:"U", ejes:[
  {t:"Funciones de variable compleja", d:"Funciones analíticas, condiciones de Cauchy-Riemann. Integración en el plano complejo.", tm:[["mate",3]]},
  {t:"Series de Fourier", d:"Desarrollo de una señal periódica en senos y cosenos. Espectro de líneas de una onda cuadrada, triangular y diente de sierra.", tm:[["mate",3],["senal",2]]},
  {t:"Transformada de Fourier", d:"De la serie a la transformada. Propiedades. Espectro de una señal que no se repite.", tm:[["mate",3],["senal",2]]},
  {t:"Transformada de Laplace", d:"Definición, propiedades y antitransformada. Resolución de ecuaciones diferenciales y de circuitos.", tm:[["mate",3],["senal",2]]},
  {t:"Ecuación de onda", d:"Ecuaciones en derivadas parciales. La ecuación de onda y su solución por separación de variables.", tm:[["mate",3],["onda",2]]}
]},
{id:"eym", n:"Electricidad y Magnetismo", area:"fund", anio:2, h:90, f:"U", ejes:[
  {t:"Corriente y circuitos", d:"Corriente, resistencia, ley de Ohm y leyes de Kirchhoff. Potencia y energía.", tm:[["fisica",2],["circ",1]]},
  {t:"Campo magnético", d:"Fuerza sobre una corriente, ley de Biot-Savart y de Ampère. El motor de un parlante: una bobina en un imán.", tm:[["fisica",2],["transd",1]]},
  {t:"Inducción electromagnética", d:"Ley de Faraday, inductancia y transformador. El principio del micrófono dinámico y de la cápsula de un tocadiscos.", tm:[["fisica",2],["transd",1]]},
  {t:"Ecuaciones de Maxwell", d:"Las cuatro ecuaciones y la onda electromagnética.", tm:[["fisica",2]]}
]},
{id:"pye", n:"Probabilidad y Estadística", area:"fund", anio:2, h:90, f:"U", ejes:[
  {t:"Probabilidad", d:"Espacio muestral, probabilidad condicional, independencia.", tm:[["mate",2]]},
  {t:"Variables aleatorias", d:"Distribuciones discretas y continuas, distribución normal. El ruido como señal aleatoria.", tm:[["mate",2],["ruido",1]]},
  {t:"Estadística descriptiva e inferencia", d:"Media, dispersión, estimación e intervalos de confianza. Incertidumbre de una medición acústica.", tm:[["mate",2],["medic",1]]}
]},
{id:"sys", n:"Señales y Sistemas", area:"senal", anio:2, h:90, f:"U", ejes:[
  {t:"Señales continuas y discretas", d:"Clasificación de señales, operaciones, impulso y escalón. Energía y potencia de una señal.", tm:[["senal",2]]},
  {t:"Sistemas lineales e invariantes", d:"Linealidad, invariancia, causalidad y estabilidad. Respuesta al impulso y convolución: lo que hace una reverb por convolución.", tm:[["senal",2],["proc",1]]},
  {t:"Respuesta en frecuencia", d:"Función de transferencia, módulo y fase. Diagramas de Bode de un ecualizador o de un filtro.", tm:[["senal",2],["proc",1]]},
  {t:"Muestreo", d:"Teorema de Nyquist-Shannon, aliasing y reconstrucción. Por qué el audio se muestrea a 44,1 o 48 kHz.", tm:[["senal",2],["digital",2]]},
  {t:"Transformada Z", d:"Definición y propiedades. Sistemas discretos y su respuesta en frecuencia.", tm:[["senal",2],["digital",2]]}
]},
{id:"ap1", n:"Acústica y Psicoacústica I", area:"acus", anio:2, h:90, f:"UC", ejes:[
  {t:"Ecuación de onda acústica", d:"Ondas planas y esféricas. Impedancia acústica. Campo cercano y campo lejano.", tm:[["onda",2]]},
  {t:"Señales acústicas", d:"Valor pico y valor eficaz. Señales periódicas no senoidales y serie de Fourier. Suma de fuentes coherentes e incoherentes.", tm:[["onda",2],["senal",2]]},
  {t:"Fenómenos de propagación", d:"Reflexión, absorción y transmisión. Refracción, difracción y difusión del sonido.", tm:[["onda",2],["recinto",1]]},
  {t:"Psicoacústica", d:"Bandas críticas y enmascaramiento. Sonoridad en fonios y sones. Percepción del tiempo, efecto de precedencia y localización espacial.", tm:[["psico",2]]}
]},
{id:"le1", n:"Laboratorio de Electrónica I", area:"elec", anio:2, h:90, f:"UC", ejes:[
  {t:"Corriente alterna", d:"Señal senoidal, valores típicos. Inductores y capacitores, reactancia, impedancia y resonancia.", tm:[["circ",2]]},
  {t:"Instrumentos de laboratorio", d:"Multímetro, generador de funciones, osciloscopio y analizador de espectro.", tm:[["medic",1],["circ",2]]},
  {t:"Filtros pasivos y activos", d:"Pasabajos, pasaaltos, pasabanda y eliminabanda: frecuencia de corte y pendiente. Ecualizadores gráficos, paramétricos y semiparamétricos.", tm:[["circ",2],["proc",1]]},
  {t:"Decibeles en la medición", d:"Ganancias de tensión, corriente y potencia en dB. dBV, dBu y dBm, y dónde se usa cada uno.", tm:[["medic",1],["onda",2]]},
  {t:"Fuentes de alimentación", d:"Transformador, rectificación y filtrado. Fuentes de corriente continua para equipos de audio.", tm:[["circ",2]]}
]},
{id:"gr2", n:"Grabación II", area:"estudio", anio:2, h:90, f:"UC", ejes:[
  {t:"Micrófonos", d:"Dinámicos, de condensador y de cinta. Patrones polares: omnidireccional, cardioide y figura ocho. Phantom power.", tm:[["grab",2],["transd",2]]},
  {t:"Técnicas de microfoneo", d:"Microfoneo de voz, batería, guitarra, piano y cuerdas. Técnicas estéreo: XY, ORTF, AB y MS.", tm:[["grab",2],["transd",2]]},
  {t:"Planificación de una sesión", d:"Distribución en la sala según la banda, el equipo y las salas disponibles. El técnico con y sin productor. Manejo de los tiempos y decisiones ante errores.", tm:[["grab",2]]},
  {t:"La consola de grabación", d:"Preamplificadores, ganancia, inserts, auxiliares, grupos y buses. Software de grabación.", tm:[["grab",2],["mezcla",1]]}
]},
{id:"ad1", n:"Audio Digital I", area:"senal", anio:2, h:60, f:"C", ejes:[
  {t:"Fundamentos de sistemas digitales", d:"Sistema binario, lógica digital y representación de números.", tm:[["digital",1]]},
  {t:"Conversión analógica-digital", d:"Muestreo y cuantificación, resolución en bits, rango dinámico y dither.", tm:[["digital",2]]},
  {t:"Edición digital", d:"Estaciones de trabajo de audio (DAW). Edición, fundidos, ajuste de tiempo y afinación.", tm:[["digital",2],["grab",2]]}
]},
{id:"midi", n:"MIDI y Síntesis", area:"senal", anio:2, h:60, f:"C", ejes:[
  {t:"Instrumentos electrónicos", d:"Historia de los instrumentos electromecánicos, eléctricos y electrónicos. CV/gate y trigger.", tm:[["sintesis",1]]},
  {t:"La norma MIDI", d:"General MIDI, conexionado y tipos de dispositivos. Composición de mensajes en binario y hexadecimal. Cartillas de implementación.", tm:[["sintesis",2]]},
  {t:"Síntesis de sonido", d:"Síntesis aditiva y sustractiva. Modulación de frecuencia, de amplitud y en anillo. Vocoder, síntesis granular y por modelado físico.", tm:[["sintesis",2],["senal",2]]},
  {t:"Música electrónica", d:"Música concreta, electrónica y electroacústica. Estéticas, audición y análisis de obras.", tm:[["sintesis",1],["musica",2]]}
]},
{id:"lm2", n:"Lenguaje Musical y Audioperceptiva II", area:"musica", anio:2, h:60, f:"C", ejes:[
  {t:"Funciones armónicas", d:"Reconocimiento de las funciones I, IV y V en mayor y menor. Cadencias simples.", tm:[["musica",2]]},
  {t:"Escalas y modos", d:"Escalas menores armónica, melódica y dórica; mixolidia, frigia, lidia y locria. Escalas de blues.", tm:[["musica",2]]},
  {t:"Ritmo y métrica", d:"Síncopas y ligaduras. Combinaciones binarias y ternarias. Métricas de 5, 7 y 9 tiempos.", tm:[["musica",2]]},
  {t:"Desgrabación auditiva", d:"Dictado rítmico y melódico. Transcribir de oído un tema completo, todas sus voces.", tm:[["musica",2],["psico",2]]}
]},

/* ---------- 3° AÑO · al terminarlo: Técnico en Sonido ---------- */
{id:"ap2", n:"Acústica y Psicoacústica II", area:"acus", anio:3, h:90, f:"UC", ejes:[
  {t:"Acústica de recintos cerrados", d:"Sonido directo y reflejado. Distancia crítica. Respuesta impulsiva de una sala.", tm:[["recinto",2]]},
  {t:"Reverberación", d:"Tiempo de reverberación. Criterios de Sabine, Eyring, Fitzroy y Millington: cuándo se aplica cada uno.", tm:[["recinto",2]]},
  {t:"Modos de una sala", d:"Ondas estacionarias y modos axiales, tangenciales y oblicuos. Por qué una sala chica refuerza ciertas notas graves.", tm:[["recinto",2],["onda",3]]},
  {t:"Medidor de nivel sonoro", d:"Ponderaciones A, B y C. Niveles equivalentes y respuesta temporal del medidor.", tm:[["medic",2],["psico",2]]}
]},
{id:"le2", n:"Laboratorio de Electrónica II", area:"elec", anio:3, h:90, f:"UC", ejes:[
  {t:"Semiconductores", d:"Diodos y transistores bipolares y de efecto de campo. Polarización y modelos.", tm:[["circ",2]]},
  {t:"Circuitos de audio", d:"Preamplificador de micrófono, mezclador, amplificador de auriculares y medidor de picos.", tm:[["circ",3]]},
  {t:"Circuitos impresos", d:"Diseño y armado de placas de audio: soldadura, prueba y medición. Un cable doctor y un amplificador.", tm:[["circ",2],["medic",2]]},
  {t:"Interfaces digitales", d:"S/PDIF, AES/EBU y conversores AD y DA.", tm:[["digital",2],["circ",2]]}
]},
{id:"dsp", n:"Procesamiento Digital de Señales", area:"senal", anio:3, h:120, f:"U", ejes:[
  {t:"Transformada discreta de Fourier", d:"DFT y FFT. Resolución en frecuencia, ventanas y fuga espectral. El analizador de espectro por software.", tm:[["digital",3],["senal",3]]},
  {t:"Filtros digitales FIR", d:"Respuesta al impulso finita, fase lineal. Diseño por ventanas.", tm:[["digital",3],["proc",2]]},
  {t:"Filtros digitales IIR", d:"Filtros recursivos, estabilidad. Diseño a partir de prototipos analógicos: el ecualizador paramétrico digital.", tm:[["digital",3],["proc",2]]},
  {t:"Convolución y correlación", d:"Convolución rápida por FFT. Reverb por convolución y medición de respuestas impulsivas.", tm:[["digital",3],["recinto",2]]},
  {t:"Cambio de frecuencia de muestreo", d:"Sobremuestreo, submuestreo y filtros de interpolación.", tm:[["digital",3]]}
]},
{id:"ce1", n:"Circuitos Electrónicos I", area:"elec", anio:3, h:90, f:"U", ejes:[
  {t:"Amplificadores con transistores", d:"Etapas en emisor y source común. Ganancia, impedancias de entrada y salida.", tm:[["circ",3]]},
  {t:"Amplificador operacional", d:"Configuraciones inversora, no inversora, sumadora y diferencial. Slew rate y ancho de banda.", tm:[["circ",3]]},
  {t:"Realimentación", d:"Efectos de la realimentación negativa sobre ganancia, distorsión y ancho de banda.", tm:[["circ",3]]},
  {t:"Ruido en circuitos", d:"Ruido térmico y de disparo. Figura de ruido de un preamplificador.", tm:[["circ",3],["ruido",2]]}
]},
{id:"ea1", n:"Electroacústica I", area:"elec", anio:3, h:90, f:"U", ejes:[
  {t:"Analogías electro-mecano-acústicas", d:"Circuitos equivalentes de sistemas mecánicos y acústicos. Masa, compliancia y resistencia acústica.", tm:[["transd",3],["circ",3]]},
  {t:"Micrófonos", d:"Transducción, sensibilidad, respuesta en frecuencia y direccionalidad. Ruido propio y nivel máximo.", tm:[["transd",3]]},
  {t:"Altavoces", d:"El parlante de bobina móvil: parámetros de Thiele-Small, rendimiento e impedancia.", tm:[["transd",3]]},
  {t:"Cajas acústicas", d:"Caja cerrada y bass-reflex. Divisores de frecuencia pasivos.", tm:[["transd",3],["vivo",1]]}
]},
{id:"gr3", n:"Grabación III y Mezcla", area:"estudio", anio:3, h:90, f:"UC", ejes:[
  {t:"Técnicas de mezcla", d:"Procedimiento de mezcla: balance, panorama, planos y profundidad. Software de mezcla.", tm:[["mezcla",2]]},
  {t:"La consola en detalle", d:"Diagrama en bloques de la consola. Cables de insert. Buses, auxiliares y grupos.", tm:[["mezcla",2],["grab",3]]},
  {t:"Producción en el estudio", d:"El proceso de producción musical. Preproducción, grabación, sobregrabación y edición.", tm:[["grab",3],["mezcla",2]]},
  {t:"Mezcla integral", d:"Mezcla completa de un tema, de la sesión cruda al estéreo final.", tm:[["mezcla",2]]}
]},
{id:"pse", n:"Procesadores de Señal y Efectos", area:"senal", anio:3, h:60, f:"C", ejes:[
  {t:"Ecualización", d:"Filtros, frecuencias de corte y pendientes. Ecualizadores gráficos, paramétricos y shelving.", tm:[["proc",2]]},
  {t:"Procesadores de dinámica", d:"Compresor, limitador, expansor y compuerta. Compresión multibanda. Circuito analógico y digital de un compresor.", tm:[["proc",2]]},
  {t:"Efectos de tiempo y modulación", d:"Reverb, delay, chorus, phaser, flanger y vibrato. Diagramas en bloques.", tm:[["proc",2]]},
  {t:"Conexionado de procesadores", d:"Conexiones en serie y en paralelo. Ruteo de señales digitales junto a analógicas. Medidores de nivel.", tm:[["proc",2],["grab",3]]}
]},
{id:"ent", n:"Entrenamiento Auditivo", area:"musica", anio:3, h:60, f:"C", ejes:[
  {t:"Reconocimiento de frecuencias", d:"Alteraciones de una octava, media octava y un tercio de octava, de 12, 6 y 3 dB, en más y en menos.", tm:[["psico",3]]},
  {t:"Escucha sobre ruido rosa", d:"Identificar bandas alteradas sobre ruido rosa.", tm:[["psico",3]]},
  {t:"Escucha sobre música", d:"Ejercicios sobre instrumentos y sobre distintos estilos musicales.", tm:[["psico",3],["mezcla",2]]}
]},
{id:"svv1", n:"Sonido en Vivo I", area:"estudio", anio:3, h:60, f:"C", ejes:[
  {t:"Interconexión de equipos", d:"Conectores de audio, conexiones a tierra y sus cuidados. Planificación y logística de las conexiones.", tm:[["vivo",2]]},
  {t:"Sistemas biamplificados y triamplificados", d:"Crossovers pasivos y activos. Cálculo del sistema.", tm:[["vivo",2],["transd",2]]},
  {t:"Consolas para vivo", d:"Consolas de producción y de vivo, criterios in-line y split. Operación básica.", tm:[["vivo",2]]},
  {t:"Monitoreo de escenario", d:"Sistemas de monitoreo, el rider técnico y cómo leerlo.", tm:[["vivo",2]]}
]},
{id:"acr", n:"Audio para Cine, TV y Radio", area:"medios", anio:3, h:90, f:"C", ejes:[
  {t:"El lenguaje audiovisual", d:"Cuadro, toma, escena y secuencia. Tipos de cine y géneros. Planos y movimientos de cámara.", tm:[["medios",1]]},
  {t:"Diseño de sonido", d:"Cualidades evocativas y acústicas del sonido. Diálogo, efectos, ambiente y música en la banda sonora.", tm:[["medios",2]]},
  {t:"Sincronización", d:"Código SMPTE a 24, 25 y 30 cuadros. Sincronización de audio e imagen en el software.", tm:[["medios",2],["digital",2]]},
  {t:"Registro en locación", d:"Criterios de toma según la locación. Cadena de audio: micrófonos, cables y soportes.", tm:[["medios",2],["grab",3]]},
  {t:"La radio", d:"Lenguaje radiofónico, el programa de radio, musicalización y efectos. El estudio de radio y la radio en línea.", tm:[["medios",2]]}
]},

/* ---------- 4° AÑO ---------- */
{id:"ea2", n:"Electroacústica II", area:"elec", anio:4, h:90, f:"U", ejes:[
  {t:"Sistemas de altavoces", d:"Arreglos de altavoces y directividad. Bocinas y line arrays.", tm:[["transd",4],["vivo",3]]},
  {t:"Divisores de frecuencia", d:"Crossovers activos y pasivos de distintos órdenes. Alineación temporal entre vías.", tm:[["transd",4],["proc",3]]},
  {t:"Amplificadores de potencia", d:"Clases A, AB y D. Potencia, rendimiento y distorsión.", tm:[["circ",4],["transd",3]]},
  {t:"Medición de transductores", d:"Respuesta en frecuencia, impedancia y directividad de micrófonos y altavoces.", tm:[["medic",3],["transd",4]]}
]},
{id:"com", n:"Comunicaciones", area:"senal", anio:4, h:60, f:"U", ejes:[
  {t:"Modulación analógica", d:"AM y FM. Ancho de banda y relación señal-ruido. La radio de transmisión.", tm:[["senal",3]]},
  {t:"Modulación digital", d:"ASK, FSK y PSK. Tasa de bits y ancho de banda.", tm:[["senal",3],["digital",3]]},
  {t:"Transmisión de audio", d:"Codificación de audio para transmisión. Audio en red y por streaming.", tm:[["digital",3],["medios",3]]}
]},
{id:"ima", n:"Instrumentos y Mediciones Acústicas", area:"acus", anio:4, h:90, f:"U", ejes:[
  {t:"Cadena de medición", d:"Micrófono de medición, preamplificador, calibrador y analizador. Incertidumbre.", tm:[["medic",3]]},
  {t:"Análisis por bandas", d:"Filtros de octava y de tercio de octava. Analizadores en tiempo real.", tm:[["medic",3],["digital",3]]},
  {t:"Medición de respuesta impulsiva", d:"MLS y barrido senoidal. Parámetros de sala a partir de la respuesta impulsiva.", tm:[["medic",3],["recinto",3]]},
  {t:"Normas de medición", d:"Normas ISO e IRAM para medir niveles, reverberación y aislamiento.", tm:[["medic",3],["ruido",2]]}
]},
{id:"mpp", n:"Masterización y Posproducción", area:"estudio", anio:4, h:90, f:"UC", ejes:[
  {t:"El proceso de masterización", d:"Qué es la masterización. Herramientas de software y combinación de equipos analógicos y digitales.", tm:[["mezcla",3]]},
  {t:"Formatos y resolución", d:"Resolución en bits y frecuencia de muestreo: 44,1, 48 y 96 kHz, 16 y 24 bits. Conversores AD y DA.", tm:[["mezcla",3],["digital",3]]},
  {t:"Sonido envolvente", d:"Normas Dolby Digital, DTS y 5.1. Masterización para distintos destinos: disco, TV, radio y plataformas.", tm:[["mezcla",3],["medios",3]]},
  {t:"Niveles y sonoridad", d:"Valor eficaz y de pico. Medición de sonoridad en LUFS y normas de entrega.", tm:[["mezcla",3],["medic",3]]}
]},
{id:"ce2", n:"Circuitos Electrónicos II", area:"elec", anio:4, h:90, f:"U", ejes:[
  {t:"Filtros activos", d:"Diseño de filtros Butterworth, Chebyshev y Bessel con operacionales.", tm:[["circ",4],["proc",3]]},
  {t:"Osciladores", d:"Criterio de Barkhausen. Osciladores senoidales para generadores de prueba.", tm:[["circ",4]]},
  {t:"Conversores", d:"Conversores AD y DA: arquitecturas, resolución y errores.", tm:[["circ",4],["digital",3]]},
  {t:"Fuentes reguladas", d:"Reguladores lineales y conmutados. Ruido de fuente en equipos de audio.", tm:[["circ",4],["ruido",2]]}
]},
{id:"ad2", n:"Audio Digital II", area:"senal", anio:4, h:90, f:"UC", ejes:[
  {t:"Distorsión", d:"Distorsión armónica total y por intermodulación, en analógico y en digital.", tm:[["digital",3],["medic",3]]},
  {t:"Compresión de datos", d:"Codificación perceptual: MP3, AAC y Opus. Cómo aprovecha el enmascaramiento.", tm:[["digital",3],["psico",3]]},
  {t:"Interfaces y soportes", d:"Interfaces de audio digital y dispositivos de almacenamiento. Audio en red.", tm:[["digital",3]]},
  {t:"Programación de efectos", d:"Implementar un ecualizador, un compresor y un delay en código.", tm:[["digital",4],["proc",3]]}
]},
{id:"aar", n:"Acústica Arquitectónica", area:"acus", anio:4, h:60, f:"C", ejes:[
  {t:"Absorción", d:"Coeficiente de absorción. Absorción de los materiales usados en la construcción de estudios.", tm:[["recinto",3]]},
  {t:"Resonadores", d:"Resonador de Helmholtz, perforados, de ranuras y de listones. Paneles vibrantes. Análisis y cálculo.", tm:[["recinto",3]]},
  {t:"Difusores", d:"Difusores QRD, PRD y MLS, poli-cilíndricos y piramidales.", tm:[["recinto",3]]},
  {t:"Diseño de un estudio", d:"Diseño de salas de grabación y de control. Reflectores y extensión del ancho de banda de los tratamientos.", tm:[["recinto",4],["grab",3]]}
]},
{id:"svj", n:"Sonido para Videojuegos", area:"medios", anio:4, h:60, f:"C", ejes:[
  {t:"Diseño de sonido para juegos", d:"Efectos, atmósfera y material sonoro no musical. Concepto artístico y guion. La experiencia del jugador.", tm:[["medios",3]]},
  {t:"Foley y diálogos", d:"Acciones humanas y objetos reales. Diálogos en el juego y en las cinemáticas.", tm:[["medios",3],["grab",3]]},
  {t:"Audio interactivo", d:"Implementación: asignar los sonidos al motor del juego, desde un paso hasta una reverb integrada.", tm:[["medios",3],["digital",3]]}
]},
{id:"prod", n:"Producción Musical", area:"estudio", anio:4, h:60, f:"C", ejes:[
  {t:"Producción artística", d:"Elección de temas, estilo y sonido. Análisis de producciones históricas.", tm:[["mezcla",3],["musica",3]]},
  {t:"Producción técnica", d:"Sistemas de sonido, de reamplificación y de monitoreo. El rider. Tipos de escenarios.", tm:[["vivo",3]]},
  {t:"Producción discográfica", d:"Organización de sesiones. Dirección y coordinación del personal técnico, los tiempos y los recursos.", tm:[["grab",4],["proyecto",2]]}
]},

/* ---------- 5° AÑO ---------- */
{id:"lac", n:"Laboratorio de Acústica", area:"acus", anio:5, h:60, f:"U", ejes:[
  {t:"Medición de una sala", d:"Tiempo de reverberación, claridad y definición medidos en una sala real.", tm:[["medic",4],["recinto",4]]},
  {t:"Aislamiento acústico", d:"Medición del aislamiento entre dos recintos. Índice de reducción sonora.", tm:[["medic",4],["ruido",3]]},
  {t:"Absorción en tubo de impedancia", d:"Coeficiente de absorción de un material medido en laboratorio.", tm:[["medic",4],["recinto",4]]}
]},
{id:"rui", n:"Ruido Acústico", area:"acus", anio:5, h:90, f:"U", ejes:[
  {t:"Ruido y salud", d:"Efectos del ruido sobre la audición y la salud. Hipoacusia inducida por ruido.", tm:[["ruido",3],["psico",3]]},
  {t:"Ruido ambiental", d:"Fuentes, propagación al aire libre y barreras. Mapas de ruido.", tm:[["ruido",3]]},
  {t:"Aislamiento y control", d:"Ley de masa, paredes dobles y ruido de impacto. Control de ruido en máquinas y ductos.", tm:[["ruido",4],["recinto",4]]},
  {t:"Legislación", d:"Normativa sobre ruido laboral y ambiental en Argentina.", tm:[["ruido",3],["proyecto",3]]}
]},
{id:"svv2", n:"Sonido en Vivo II", area:"estudio", anio:5, h:90, f:"UC", ejes:[
  {t:"Diseño del sistema", d:"Cobertura, nivel y directividad. Diseño de un sistema de refuerzo para un recinto o al aire libre.", tm:[["vivo",4],["transd",4]]},
  {t:"Alineación y ecualización del sistema", d:"Medición con doble canal, alineación de retardos y ecualización de sala.", tm:[["vivo",4],["medic",4]]},
  {t:"Grabación en vivo", d:"Consolas y procesadores para el registro en vivo. Prueba de sonido, sobregrabaciones y mezcla de un concierto. Compatibilidad con el refuerzo.", tm:[["vivo",4],["grab",4]]},
  {t:"Realimentación acústica", d:"El acople: por qué ocurre y cómo se controla.", tm:[["vivo",4],["proc",4]]}
]},
{id:"ime", n:"Instrumentos y Mediciones Electrónicas", area:"elec", anio:5, h:90, f:"U", ejes:[
  {t:"Mediciones en equipos de audio", d:"Respuesta en frecuencia, distorsión, ruido y diafonía de un equipo.", tm:[["medic",4],["circ",4]]},
  {t:"Instrumental automatizado", d:"Medición controlada por computadora. Interfaces de medición.", tm:[["medic",4],["digital",4]]},
  {t:"Incertidumbre", d:"Errores sistemáticos y aleatorios. Expresión del resultado de una medición.", tm:[["medic",4]]}
]},
{id:"met", n:"Metodología de la Investigación", area:"practica", anio:5, h:60, f:"U", ejes:[
  {t:"El método científico", d:"Problema, hipótesis, diseño experimental y análisis de resultados.", tm:[["proyecto",3]]},
  {t:"Escritura técnica", d:"Informe, monografía y artículo. Búsqueda y citado de bibliografía.", tm:[["proyecto",3]]}
]},
{id:"pp", n:"Práctica Profesional", area:"practica", anio:5, h:300, f:"UC", ejes:[
  {t:"Práctica en estudio", d:"Grabación, mezcla y masterización de un proyecto real.", tm:[["proyecto",4],["mezcla",4]]},
  {t:"Práctica en vivo", d:"Sonido en vivo y grabación en vivo de un concierto.", tm:[["proyecto",4],["vivo",4]]},
  {t:"Práctica en medios", d:"Producción de una pieza multimedia: video clip, programa de radio o sonido para un juego.", tm:[["proyecto",4],["medios",4]]}
]},
{id:"pf", n:"Proyecto Final", area:"practica", anio:5, h:90, f:"U", ejes:[
  {t:"Proyecto de ingeniería", d:"Diseño, construcción y medición de un sistema, un dispositivo o un recinto. Presentación y defensa.", tm:[["proyecto",4]]}
]}
];
