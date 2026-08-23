/* ============================================================
   catto.ar - Datos de la Tecnicatura en Electronica
   Areas, temas transversales y los 21 espacios curriculares con sus 95 ejes.
   Lo usan el mapa (/publicaciones/mapa-electronica) y la portada.
   Fuente: Propuesta Curricular DGETyFP Cordoba (2011), Seccion 9.
   Una sola copia: si se edita un eje, cambia en los dos lados.
   ============================================================ */
var AREAS = {
  digital:   {nombre:"Electrónica Digital", color:"#58a6ff"},
  analogica: {nombre:"Electrónica Analógica", color:"#e3a008"},
  electro:   {nombre:"Electrotecnia", color:"#2dd4bf"},
  info:      {nombre:"Informática Electrónica", color:"#a371f7"},
  industrial:{nombre:"Electrónica Industrial", color:"#f85149"},
  telecom:   {nombre:"Telecomunicaciones", color:"#3fb950"},
  instal:    {nombre:"Instalaciones", color:"#d2691e"},
  proyecto:  {nombre:"Proyecto / Práctica", color:"#8b949e"}
};

// Temas transversales (ejes que cruzan materias)
var TEMAS = {
  semic:   {n:"Semiconductores y diodos", c:"#e3a008"},
  trans:   {n:"Transistores", c:"#f0883e"},
  amp:     {n:"Amplificadores (incl. Operacionales)", c:"#db6d28"},
  logica:  {n:"Lógica digital", c:"#58a6ff"},
  micro:   {n:"Microprocesadores y microcontroladores", c:"#1f6feb"},
  prog:    {n:"Programación", c:"#a371f7"},
  conv:    {n:"Conversión A/D – D/A", c:"#79c0ff"},
  medic:   {n:"Mediciones e instrumentación", c:"#56d4dd"},
  circ:    {n:"Circuitos y fundamentos eléctricos", c:"#2dd4bf"},
  ca:      {n:"Corriente alterna y trifásica", c:"#26a69a"},
  maq:     {n:"Transformadores y máquinas/motores", c:"#00897b"},
  pot:     {n:"Electrónica de potencia", c:"#f85149"},
  sens:    {n:"Sensores, actuadores y transductores", c:"#ff7b72"},
  control: {n:"Control y automatización (PLC/PID)", c:"#da3633"},
  instal:  {n:"Instalaciones eléctricas", c:"#d2691e"},
  modul:   {n:"Modulación y comunicaciones", c:"#3fb950"},
  antena:  {n:"Antenas y propagación", c:"#56d364"},
  optica:  {n:"Fibra óptica y satélite", c:"#2ea043"},
  cad:     {n:"CAD, esquemáticos y PCB", c:"#bc8cff"},
  filt:    {n:"Filtros y osciladores", c:"#ffa657"},
  hys:     {n:"Higiene y seguridad", c:"#d29922"}
};

// Materias del Campo de Formación Técnica Específica
// lvl: profundidad del eje (1 intro · 2 desarrollo · 3 profundización · 4 aplicación/integración)
var MATERIAS = [
/* ---------- 4° AÑO ---------- */
{id:"ed1", n:"Electrónica Digital I", area:"digital", anio:4, h:96, ejes:[
  {t:"Lógica combinacional", u:"logica-combinacional", d:"Compuertas lógicas, tablas de verdad, circuitos equivalentes, tecnologías TTL y CMOS, sumadores, decodificadores y codificadores.", tm:[["logica",1]]},
  {t:"Lógica secuencial", u:"logica-secuencial", d:"Flip-flops RS, D, JK y T. Contadores asíncronos y síncronos. Prácticas de laboratorio.", tm:[["logica",1]]},
  {t:"Aplicaciones con compuertas lógicas", u:"aplicaciones-compuertas", d:"Diseño de circuitos y plaquetas con compuertas lógicas.", tm:[["logica",2],["cad",1]]}
]},
{id:"ea1", n:"Electrónica Analógica I", area:"analogica", anio:4, h:120, ejes:[
  {t:"Teoría de los materiales semiconductores", u:"semiconductores-diodos", d:"Semiconductores n y p. Diodo: polarización directa/inversa, curva característica. Rectificadores media/onda completa, puente. Filtro capacitivo. Diodo y regulador Zener.", tm:[["semic",1],["pot",1]]},
  {t:"Transistores bipolares", u:"transistores-bipolares", d:"Funcionamiento, curvas características, ganancia CC, recta de carga. Transistor como llave y como amplificador. Polarización. Fuentes reguladas con transistores.", tm:[["trans",1],["pot",1]]},
  {t:"Amplificadores de señal débil", u:"amplificadores-senal-debil", d:"Emisor común. Capacitores de acoplamiento y derivación. Ganancia en CA. Colector común. Conexión Darlington.", tm:[["amp",1],["trans",2]]},
  {t:"Amplificadores de potencia", u:"amplificadores-potencia", d:"Clase A y Clase B, simetría complementaria, fuente única y partida. Rendimiento. Amplificadores de potencia con circuitos integrados.", tm:[["amp",2]]},
  {t:"Magnitudes eléctricas fundamentales", u:"magnitudes-electricas", d:"Voltaje, intensidad, resistencia. Unidades, múltiplos. Medición en CC con instrumentos analógicos y digitales.", tm:[["circ",1],["medic",1]]},
  {t:"Instrumentos de medición analógicos", u:"instrumentos-analogicos", d:"Bobina móvil, hierro móvil, electrodinámicos. Voltímetro y óhmetro.", tm:[["medic",1]]},
  {t:"El osciloscopio", u:"osciloscopio", d:"Tubo de rayos catódicos, base de tiempos, sincronización, visualización de ondas y mediciones en circuitos amplificadores.", tm:[["medic",2]]},
  {t:"Mediciones en CA", u:"mediciones-ca", d:"Valor eficaz, amplitud, período, frecuencia. Generador de funciones, frecuencímetros.", tm:[["medic",2],["ca",1]]}
]},
{id:"et1", n:"Electrotecnia I", area:"electro", anio:4, h:120, ejes:[
  {t:"Electrostática", u:"electrostatica", d:"Cargas, campo y potencial eléctrico, capacitancia, dieléctricos.", tm:[["circ",1]]},
  {t:"La corriente eléctrica", u:"corriente-electrica", d:"Ley de Coulomb, resistencia, Ley de Ohm, Leyes de Kirchhoff, potencia, Ley de Joule.", tm:[["circ",1]]},
  {t:"Magnetismo y electromagnetismo", u:"magnetismo-electromagnetismo", d:"Campo magnético, flujo, reluctancia, circuitos magnéticos. Campo de una corriente, solenoide.", tm:[["circ",2]]},
  {t:"Electrodinámica e inducción", u:"electrodinamica-induccion", d:"Fuerza electromagnética, histéresis. Ley de Faraday y Lenz. Inducción mutua, autoinducción. Principio del transformador.", tm:[["circ",2],["maq",1]]},
  {t:"Corrientes alternas", u:"corrientes-alternas", d:"Ondas sinusoidales, valores máximo/medio/eficaz, frecuencia, potencia, factor de potencia, resonancia, desfasaje.", tm:[["ca",1]]}
]},
{id:"ie1", n:"Informática Electrónica I", area:"info", anio:4, h:72, ejes:[
  {t:"Elementos básicos del lenguaje C", u:"lenguaje-c", d:"Estructura de un programa, variables, constantes, tipos de datos, operadores, arreglos, cadenas, control de flujo, funciones, preprocesador, biblioteca estándar.", tm:[["prog",1]]},
  {t:"Entornos de desarrollo C y C++", u:"entornos-c-cpp", d:"Device drivers, punteros y aritmética de punteros, estructuras, programación de sistemas embebidos, bootloaders, tiempo real en microprocesadores, concurrencia.", tm:[["prog",2],["micro",1]]},
  {t:"El lenguaje C++", u:"lenguaje-cpp", d:"Clases, objetos, métodos, herencia y polimorfismo. Constructores/destructores, sobrecarga, excepciones, interfaces y device drivers.", tm:[["prog",2]]}
]},
/* ---------- 5° AÑO ---------- */
{id:"ed2", n:"Electrónica Digital II", area:"digital", anio:5, h:96, ejes:[
  {t:"Contadores programables", u:"contadores-programables", d:"Expansiones con circuitos integrados programables.", tm:[["logica",2]]},
  {t:"Conversores A/D y D/A", u:"conversores-ad-da", d:"Conversores DA con redes en abanico y escalera. Conversor AD tipo flash. Interfaces RS232, RS485, RS422.", tm:[["conv",1],["modul",1]]},
  {t:"Instrumentos de medida digitales", u:"instrumentos-digitales", d:"Arquitectura de un aparato de medición, multímetros, frecuencímetros.", tm:[["medic",2]]},
  {t:"Arquitectura de microprocesador y microcontrolador", u:"arquitectura-microprocesadores", d:"Introducción a la arquitectura de microprocesadores y microcontroladores.", tm:[["micro",1]]}
]},
{id:"ea2", n:"Electrónica Analógica II", area:"analogica", anio:5, h:144, ejes:[
  {t:"Semiconductores especiales", u:"semiconductores-especiales", d:"Transistor de efecto de campo (FET) y sus tipos, componentes de disparo controlado (tiristores y triacs) y fotoeléctricos.", tm:[["semic",2],["trans",3],["pot",1]]},
  {t:"Circuitos integrados lineales", u:"/publicaciones/simulador-555", d:"El circuito integrado 555.", tm:[["filt",1],["amp",2]]},
  {t:"Amplificadores Operacionales", u:"/publicaciones/amplificadores-operacionales", d:"Conceptos y características. Amplificadores de señal, comparadores, sumadores, generadores de forma de onda, amplificadores de instrumentación, rectificadores. Aplicaciones y prácticas de laboratorio.", tm:[["amp",3]]},
  {t:"Mediciones de circuitos estándares", u:"mediciones-impedancia", d:"Mediciones de impedancia en baja y alta frecuencia, puente de impedancia, mediciones de frecuencia.", tm:[["medic",3]]},
  {t:"Osciladores", u:"osciladores", d:"Osciladores y resonancia.", tm:[["filt",2]]},
  {t:"Filtros", u:"filtros", d:"Pasa-altos, pasa-bajos, pasa-banda y elimina-banda.", tm:[["filt",2]]}
]},
{id:"et2", n:"Electrotecnia II", area:"electro", anio:5, h:144, ejes:[
  {t:"La corriente alterna", u:"/publicaciones/ca-vectorial", d:"FEM de CA, vector rotante, diagramas vectoriales, reactancia, impedancia, circuitos RL, RC, RLC, resonancia.", tm:[["ca",2]]},
  {t:"Potencia en corriente alterna", u:"potencia-ca", d:"Potencia activa, reactiva y aparente. Factor de potencia y su compensación.", tm:[["ca",2]]},
  {t:"Circuitos trifásicos", u:"circuitos-trifasicos", d:"Tensiones trifásicas, alternador, conexiones estrella y triángulo, potencia trifásica.", tm:[["ca",3]]},
  {t:"Instalaciones eléctricas", u:"instalaciones-electricas", d:"Símbolos, selección de conductores, protecciones: fusibles, termomagnéticas, guardamotores, disyuntores diferenciales, contactores, relé térmico.", tm:[["instal",2]]},
  {t:"Transformadores", u:"transformadores", d:"De corriente, tensión e impedancia. Cálculo, rendimiento, pérdidas, relación de vueltas.", tm:[["maq",2]]},
  {t:"Motores de CA monofásicos y trifásicos", u:"motores-ca", d:"Conexión, protección y maniobra. Inversión de marcha, arranque estrella-triángulo. Circuitos de potencia y de control.", tm:[["maq",2],["control",1]]}
]},
{id:"ie2", n:"Informática Electrónica II", area:"info", anio:5, h:120, ejes:[
  {t:"Dibujo técnico y diseño asistido (CAD)", u:"dibujo-tecnico-cad", d:"Dibujo técnico en ingeniería, normas para elaboración e interpretación de dibujos.", tm:[["cad",1]]},
  {t:"Simbología de componentes electrónicos", u:"simbologia-componentes", d:"Simbología de componentes analógicos y digitales.", tm:[["cad",1]]},
  {t:"Diagramas de circuitos esquemáticos", u:"esquematicos", d:"Normas y estándares, software para esquemáticos, metodología de diseño, librerías.", tm:[["cad",2]]},
  {t:"Tarjetas de circuitos impresos (PCB)", u:"pcb", d:"Metodología de diseño de PCB, software, transferencia de mascarillas, técnicas de montaje, soldadura y extracción de componentes.", tm:[["cad",3]]},
  {t:"Simulación de circuitos y mediciones virtuales", u:"simulacion-circuitos", d:"Simulación por computadora, mediciones virtuales, márgenes de error.", tm:[["cad",2],["medic",2]]}
]},
/* ---------- 6° AÑO ---------- */
{id:"ed3", n:"Electrónica Digital III", area:"digital", anio:6, h:144, ejes:[
  {t:"Familia de microcontroladores", u:"familia-microcontroladores", d:"Arquitectura, diagrama de conexiones, repertorio de instrucciones. Registros de control, memoria flash y EEPROM, puertas de E/S y recursos especiales.", tm:[["micro",2]]},
  {t:"Módulo de comunicación", u:"comunicacion-serie", d:"Serie síncrona. USART: transmisor/receptor síncrono/asíncrono serie.", tm:[["micro",2],["modul",2]]},
  {t:"Periféricos", u:"perifericos-microcontrolador", d:"Puertos de E/S, temporizadores, módulos de comparación y captura, conversores A/D, modo PWM (anchura de pulsos).", tm:[["micro",3],["conv",2]]},
  {t:"Control con dispositivos", u:"control-temperatura-iluminacion", d:"Control de temperatura. Control de iluminación.", tm:[["micro",3],["control",2]]},
  {t:"Sistemas programables y memorias", u:"memorias-dispositivos-programables", d:"RAM, ROM, EPROM, UVPROM, Flash ROM. Arquitecturas de dispositivos programables.", tm:[["micro",2]]},
  {t:"Operación y mantenimiento de PC", u:"mantenimiento-pc", d:"Redes, interfaces, enrutadores, software y documentación técnica.", tm:[["medic",2]]},
  {t:"Aparatos de medición digital", u:"instrumentos-digitales", d:"Arquitectura y funciones.", tm:[["medic",3]]}
]},
{id:"ei1", n:"Electrónica Industrial I", area:"industrial", anio:6, h:144, ejes:[
  {t:"Componentes de potencia", u:"componentes-potencia", d:"Triac, Diac, SCR, UJT, IGBT, MCT, GTO. Principios y resolución de circuitos.", tm:[["pot",2],["semic",2]]},
  {t:"Conexión estrella-triángulo", u:"circuitos-trifasicos", d:"Circuitos trifásicos de CA, sistemas en estrella y triángulo.", tm:[["ca",3]]},
  {t:"Potencia y factor de potencia", u:"potencia-ca", d:"Potencia en circuitos monofásicos y trifásicos. Métodos de cálculo y corrección del factor de potencia.", tm:[["ca",3],["pot",2]]},
  {t:"Sistemas automáticos de control", u:"control-potencia", d:"Control de potencia monofásica y trifásica.", tm:[["control",2],["pot",2]]},
  {t:"Fuentes de energía", u:"fuentes-conmutadas", d:"Convencionales, conmutadas, convertidores e inversores. Rectificadores controlados monofásicos/trifásicos, circuitos de disparo.", tm:[["pot",3]]},
  {t:"Diagnóstico y detección de fallas", u:"diagnostico-fallas", d:"Métodos y técnicas para el diagnóstico y detección de fallas.", tm:[["medic",2]]},
  {t:"Variadores de velocidad", u:"variadores-velocidad", d:"Controladores de frecuencia variable, inversor PWM, flujo vectorial, Volts/Hz.", tm:[["pot",3],["control",2]]},
  {t:"Sensores, actuadores y transductores", u:"sensores-actuadores", d:"Transductores de presencia (inductivos, capacitivos, acústicos, ópticos), posición, velocidad, aceleración, temperatura. Actuadores neumáticos, hidráulicos y eléctricos.", tm:[["sens",2]]},
  {t:"Motores paso a paso", u:"motores-paso-a-paso", d:"Rotor de imán permanente, bipolares y unipolares. Características, fallas típicas, diagnóstico.", tm:[["maq",3],["sens",2]]},
  {t:"Higiene y seguridad laboral", u:"higiene-seguridad", d:"Manejo seguro de equipos de potencia. Normas y procedimientos.", tm:[["hys",1]]}
]},
{id:"tc1", n:"Telecomunicaciones I", area:"telecom", anio:6, h:144, ejes:[
  {t:"Comunicaciones analógicas", u:"comunicaciones-analogicas", d:"Espectro electromagnético, propagación de ondas electromagnéticas.", tm:[["modul",2],["antena",1]]},
  {t:"Generación y procesamiento de señales", u:"senales-fourier", d:"Señales más comunes en comunicaciones, análisis de Fourier.", tm:[["modul",2]]},
  {t:"Sistemas de modulación", u:"sistemas-modulacion", d:"Análisis comparativo de los sistemas de modulación.", tm:[["modul",2]]},
  {t:"Antenas y sistemas radiantes", u:"antenas", d:"Tipos, características, montaje e instalación.", tm:[["antena",2]]},
  {t:"Enlaces a microondas", u:"enlaces-microondas", d:"Cálculo aproximado de enlaces.", tm:[["antena",2],["modul",2]]},
  {t:"Telefonía y telefonía celular", u:"telefonia-celular", d:"Funcionamiento, evolución, tecnología digital, GSM, PCS.", tm:[["modul",2]]},
  {t:"Comunicación por satélite", u:"comunicacion-satelital", d:"Bandas, segmento espacial y terreno, antenas, LNA, amplificadores de potencia, balance de enlace.", tm:[["optica",2],["antena",2]]},
  {t:"Láser y fibras ópticas", u:"fibra-optica", d:"Transmisores, receptores, fibra, amplificadores, multiplexación por longitud de onda, dispersión.", tm:[["optica",2]]},
  {t:"Montaje, instalación y mediciones", u:"mediciones-rf", d:"Protección de equipos, manejo seguro. Mediciones de impedancia, ultraaltas frecuencias y microondas, sobre receptores y transmisores.", tm:[["medic",3],["hys",1]]}
]},
{id:"ii", n:"Instalaciones Industriales", area:"instal", anio:6, h:168, ejes:[
  {t:"Instalaciones eléctricas", u:"instalaciones-vivienda", d:"Corrientes débiles, muy baja y baja tensión. Tableros, cableado, aparatos de maniobra y protección, puesta a tierra, proyecto eléctrico de vivienda.", tm:[["instal",3]]},
  {t:"Tecnología de materiales eléctricos", u:"materiales-electricos", d:"Conductores, gabinetes, termografías, aislantes, ferromagnéticos, rendimientos.", tm:[["instal",2]]},
  {t:"Manejo de herramientas", u:"herramientas", d:"Manuales, equipos y máquinas herramientas.", tm:[["instal",1]]},
  {t:"Protección", u:"proteccion-electrica", d:"Contactos directos e indirectos, protección de líneas contra sobrecarga, cortocircuito y sobretensiones.", tm:[["instal",3]]},
  {t:"Instalaciones de alumbrado", u:"alumbrado", d:"Luminarias, circuitos generales y especiales, fuerza motriz, cálculos y esquemas.", tm:[["instal",2]]},
  {t:"Mantenimiento de componentes eléctricos", u:"mantenimiento-electrico", d:"Interruptores, temporizadores, relé térmico, guardamotores, fusibles, termomagnéticas en fábricas e industrias.", tm:[["instal",2],["hys",1]]},
  {t:"Proyecto de una instalación", u:"proyecto-instalacion", d:"Proyecto integral de una instalación.", tm:[["instal",4]]}
]},
/* ---------- 7° AÑO ---------- */
{id:"ed4", n:"Electrónica Digital IV", area:"digital", anio:7, h:120, ejes:[
  {t:"Familia de microcontroladores", u:"otros-microcontroladores", d:"Arquitectura, conexiones, repertorio de instrucciones, registros de control, memoria flash/EEPROM, E/S y recursos especiales (otros microcontroladores).", tm:[["micro",3]]},
  {t:"Módulo de comunicación", u:"buses-serie", d:"Serie síncrona. USART síncrono/asíncrono serie.", tm:[["micro",3],["modul",2]]},
  {t:"Las interrupciones", u:"interrupciones", d:"Manejo de interrupciones del microcontrolador.", tm:[["micro",3]]},
  {t:"Aplicaciones con controles", u:"aplicaciones-control", d:"Control de temperatura e iluminación, pesaje y dosificación, control de ascensores, sistemas automáticos de verificación y prueba.", tm:[["micro",4],["control",3]]},
  {t:"Display inteligentes", u:"displays", d:"Aplicaciones con displays inteligentes.", tm:[["micro",3]]},
  {t:"Aplicaciones con microcontroladores", u:"proyectos-microcontrolador", d:"Proyectos integradores con microcontroladores.", tm:[["micro",4],["control",3]]}
]},
{id:"ei2", n:"Electrónica Industrial II", area:"industrial", anio:7, h:120, ejes:[
  {t:"Automatismo", u:"automatismo-plc", d:"Principio de sistema automático, opciones tecnológicas, control de procesos. Autómatas programables (PLC): definición, historia, aplicaciones, ventajas.", tm:[["control",3]]},
  {t:"Estructura de los autómatas programables", u:"estructura-plc", d:"Estructura externa/interna, memorias, CPU, entradas/salidas, interfaces, periféricos.", tm:[["control",3]]},
  {t:"Unidades de mando y señalización", u:"mando-senalizacion", d:"Sensores y transductores, acondicionadores de señales, actuadores. Instalación, programación, conexionado de E/S.", tm:[["sens",3],["control",3]]},
  {t:"Instrucciones y programación de PLC", u:"programacion-plc", d:"Lenguajes: nemónicos/booleanos, diagrama de contactos, plano de funciones, Grafcet, organigrama.", tm:[["control",4],["prog",3]]},
  {t:"Aplicaciones básicas de programación", u:"aplicaciones-plc", d:"E/S, marcas, temporizadores, contadores, registro de desplazamiento, circuitos lógicos, generadores de impulsos.", tm:[["control",4]]},
  {t:"Neumática e hidráulica", u:"neumatica-hidraulica", d:"Compresores, actuadores neumáticos, señales neumáticas, lógica neumática, cilindros hidráulicos, válvulas direccionales.", tm:[["control",3],["sens",2]]},
  {t:"Comunicaciones industriales", u:"comunicaciones-industriales", d:"Red Ethernet, bus de campo, red ASI.", tm:[["control",3],["modul",2]]},
  {t:"Controladores PID", u:"control-pid", d:"Ajuste de controladores PID, programación analógica de PID, instrumentos de uso específico.", tm:[["control",4]]}
]},
{id:"tc2", n:"Telecomunicaciones II", area:"telecom", anio:7, h:120, ejes:[
  {t:"Conceptos matemáticos de base", u:"teorema-muestreo", d:"Teorema del muestreo.", tm:[["modul",3]]},
  {t:"Modulación digital de impulsos codificados", u:"modulacion-digital", d:"Modulaciones digitales ASK, PSK, FSK, QAM. Cuantificación.", tm:[["modul",3]]},
  {t:"Comunicaciones de datos", u:"comunicaciones-datos", d:"Radioenlace digital, protocolos de comunicación de datos, red digital de servicios integrados (RDSI).", tm:[["modul",3]]},
  {t:"Televisión analógica y digital", u:"television", d:"Tubos de cámara y receptores, LCD, plasma, circuito cerrado, TV codificada.", tm:[["modul",3]]},
  {t:"Antenas", u:"antenas", d:"Concepto, características, tipos y cálculo de distintos tipos de antenas.", tm:[["antena",3]]},
  {t:"Montaje y mantenimiento de equipos", u:"mantenimiento-telecomunicaciones", d:"Mantenimiento de componentes y equipos, normas de resguardo, seguridad e higiene.", tm:[["hys",2]]}
]},
{id:"pi", n:"Proyecto Integrador", area:"proyecto", anio:7, h:144, ejes:[
  {t:"Proyecto integrador de la especialidad", u:"proyecto-integrador", d:"Síntesis de los espacios curriculares específicos. Diseño asistido por computadora (CAD, SolidWorks o similar). Integra Matemática, Física, Marco Jurídico, Higiene y Seguridad y Economía y Producción.", tm:[["cad",4],["control",2],["micro",2]]}
]},
{id:"fat", n:"Formación en Ambiente de Trabajo", area:"proyecto", anio:7, h:240, ejes:[
  {t:"Práctica profesionalizante", u:"practica-profesionalizante", d:"Prácticas en situaciones reales de trabajo: montaje, instalación, operación y mantenimiento. Consolida e integra las capacidades del perfil profesional.", tm:[["instal",4],["control",4],["hys",2]]}
]}
];
