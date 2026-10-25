/* ============================================================
   catto.ar - Datos de la Tecnicatura en Electricidad (Técnico Electricista)
   Áreas, temas transversales y los 18 espacios curriculares del Campo de
   Formación Técnica Específica, con sus ejes. Lo usa /publicaciones/mapa-electricidad.
   Fuente: Propuesta Curricular DGETyFP Córdoba (2011), Electricidad, Sección 9
   (págs. 133-163) y Sección 10 (Formación en Ambiente de Trabajo). Plan 687198106.
   u: página de tema ya escrita (en /publicaciones/mapa-electronica/temas/) o, si
   empieza con «/», una publicación del sitio. Las dos tecnicaturas comparten páginas.
   amb: ámbito de la instalación que fija el documento para cada Instalaciones Eléctricas.
   ============================================================ */
var AREAS = {
  electro: {nombre:"Electrotecnia", color:"#2dd4bf"},
  instal:  {nombre:"Instalaciones Eléctricas", color:"#d2691e"},
  medic:   {nombre:"Mediciones Eléctricas", color:"#56d4dd"},
  proy:    {nombre:"Proyecto y Representación Gráfica", color:"#bc8cff"},
  maq:     {nombre:"Máquinas y Centrales", color:"#00897b"},
  auto:    {nombre:"Automatización Industrial", color:"#f85149"},
  elind:   {nombre:"Electrónica Industrial", color:"#e3a008"},
  practica:{nombre:"Práctica Profesionalizante", color:"#8b949e"}
};

// Temas transversales (ejes que cruzan materias)
var TEMAS = {
  circ:    {n:"Circuitos y fundamentos eléctricos", c:"#2dd4bf"},
  energia: {n:"Generación y distribución de energía", c:"#26a69a"},
  maq:     {n:"Transformadores, motores y generadores", c:"#00897b"},
  instal:  {n:"Instalaciones eléctricas", c:"#d2691e"},
  mat:     {n:"Materiales eléctricos", c:"#c08457"},
  prot:    {n:"Protecciones eléctricas", c:"#f0883e"},
  alumb:   {n:"Iluminación", c:"#f2cc60"},
  calidad: {n:"Calidad de energía y factor de potencia", c:"#ffa657"},
  mant:    {n:"Mantenimiento", c:"#db6d28"},
  medic:   {n:"Mediciones e instrumentación", c:"#56d4dd"},
  cad:     {n:"Dibujo, planos y proyecto", c:"#bc8cff"},
  normas:  {n:"Normas y reglamentación", c:"#a371f7"},
  hys:     {n:"Higiene y seguridad", c:"#d29922"},
  logica:  {n:"Lógica digital", c:"#58a6ff"},
  control: {n:"Automatización y PLC", c:"#da3633"},
  sens:    {n:"Sensores y actuadores", c:"#ff7b72"},
  neum:    {n:"Neumática e hidráulica", c:"#79c0ff"},
  redes:   {n:"Redes y buses industriales", c:"#1f6feb"},
  analog:  {n:"Transistores y amplificadores", c:"#e3a008"},
  pot:     {n:"Electrónica de potencia y control de motores", c:"#f85149"}
};

// Materias del Campo de Formación Técnica Específica
// lvl: profundidad del eje (1 intro · 2 desarrollo · 3 profundización · 4 aplicación/integración)
var MATERIAS = [
/* ---------- 4° AÑO ---------- */
{id:"et", n:"Electrotecnia", area:"electro", anio:4, h:144, ejes:[
  {t:"Energía eléctrica", d:"Producción, transporte y transformación. Energía térmica.", tm:[["energia",1]]},
  {t:"Fuentes de energía", d:"Fuentes convencionales: petróleo y gas. Generación de energía y energías alternativas. Usos de la energía. Redes de distribución. Energía y potencia. Rendimiento de las transformaciones.", tm:[["energia",1]]},
  {t:"Electrotécnica", u:"corriente-electrica", d:"Corriente continua y alterna. Intensidad y tensión. Ley de Ohm, leyes de Kirchhoff, efecto Joule. Magnitudes y fórmulas básicas. Asociación de resistencias, generadores (pilas y baterías) y capacitores. Impedancia.", tm:[["circ",1]]},
  {t:"Resolución de circuitos en CC y CA", u:"corrientes-alternas", d:"Cálculo de circuitos de corriente continua y alterna.", tm:[["circ",2]]},
  {t:"Magnetismo y electromagnetismo", u:"magnetismo-electromagnetismo", d:"Campo magnético, electroimanes e inducción: la base de motores y transformadores.", tm:[["circ",2],["maq",1]]},
  {t:"Motores", u:"motores-ca", d:"Motores de CC y de CA, monofásicos y trifásicos: concepto y funcionamiento.", tm:[["maq",1]]},
  {t:"Máquinas eléctricas estáticas", u:"transformadores", d:"Transformadores: concepto, funcionamiento y ensayos de laboratorio.", tm:[["maq",1]]}
]},
{id:"ie1", n:"Instalaciones Eléctricas I", area:"instal", anio:4, h:144, amb:"En inmuebles: viviendas unifamiliares.", ejes:[
  {t:"Instalaciones eléctricas", u:"instalaciones-vivienda", d:"Instalaciones de corrientes débiles, muy baja y baja tensión. Reglas de instalación. Tableros, cableado, aparatos de maniobra, protección, comando y señalización. Canalizaciones. Puesta a tierra. Proyecto eléctrico de una vivienda tipo.", tm:[["instal",1],["prot",1]]},
  {t:"Tecnología de los materiales eléctricos", u:"materiales-electricos", d:"Conductores, gabinetes, aislantes, materiales ferromagnéticos. Termografías y ensayos sobre el equipamiento. Rendimientos.", tm:[["mat",1]]},
  {t:"Manejo de herramientas", u:"herramientas", d:"Herramientas manuales, equipos y máquinas herramientas.", tm:[["hys",1]]},
  {t:"Protección", u:"proteccion-electrica", d:"Contra contactos directos e indirectos. Protección de líneas contra sobrecarga, cortocircuito y sobretensiones.", tm:[["prot",1]]},
  {t:"Instalaciones de alumbrado", u:"alumbrado", d:"Luminarias, circuitos de uso general y especial, fuerza motriz, cálculos y esquemas.", tm:[["alumb",1],["instal",1]]},
  {t:"Mantenimiento", u:"mantenimiento-electrico", d:"De los componentes de protección y maniobra: interruptores, temporizadores, relé térmico, relé de falta de fase, guardamotores, fusibles, termomagnéticas.", tm:[["mant",1]]}
]},
{id:"me1", n:"Mediciones Eléctricas I", area:"medic", anio:4, h:96, ejes:[
  {t:"Mediciones", u:"magnitudes-electricas", d:"Errores de medición, clases de instrumentos. Medición de corriente, tensión, potencia y resistencia.", tm:[["medic",1]]},
  {t:"Instrumentos", u:"instrumentos-analogicos", d:"Instrumentos analógicos y digitales: voltímetro, amperímetro, vatímetro, multímetro, frecuencímetro, puentes. Características, conexionado y calibración.", tm:[["medic",1]]},
  {t:"Medición sobre máquinas eléctricas", d:"Medición en motores de CA y CC, conexión de motores, sistemas de arranque. Ensayos de medición sobre motores y transformadores.", tm:[["medic",2],["maq",1]]},
  {t:"Seguridad", u:"higiene-seguridad", d:"Seguridad laboral en los ensayos y al operar instrumentos de medición eléctrica.", tm:[["hys",1]]}
]},
{id:"prg1", n:"Proyecto y Representación Gráfica I", area:"proy", anio:4, h:72, ejes:[
  {t:"Dibujo técnico", u:"dibujo-tecnico-cad", d:"Elementos e instrumentos, normalización, acotación, construcciones geométricas, croquis a mano alzada.", tm:[["cad",1]]},
  {t:"Diseño asistido", u:"dibujo-tecnico-cad", d:"Introducción al dibujo asistido por computadora: funciones básicas, aplicaciones, calidad en la representación, tres dimensiones.", tm:[["cad",1]]},
  {t:"Proyecto", u:"/publicaciones/simbologia", d:"Proyecciones y perspectivas. Símbolos de elementos eléctricos. Representación de máquinas y componentes. Interpretación de planos de instalaciones, esquemas eléctricos y documentación técnica.", tm:[["cad",1],["instal",1]]},
  {t:"Normas y reglamentaciones de uso en electricidad", d:"Códigos, normas y reglamentos vigentes, entes reguladores y distribuidoras. Reglamentación para la ejecución de instalaciones eléctricas en inmuebles.", tm:[["normas",1]]},
  {t:"Normas de seguridad e higiene", u:"higiene-seguridad", d:"En los procesos de instalación y montaje eléctrico.", tm:[["hys",1]]}
]},
/* ---------- 5° AÑO ---------- */
{id:"mq1", n:"Máquinas Eléctricas I", area:"maq", anio:5, h:144, ejes:[
  {t:"Motores de CA y CC", u:"motores-ca", d:"Tipos, conexión y sistemas de arranque. Ensayos. Partes constitutivas, rodamientos, materiales. Cableado y montaje de motores.", tm:[["maq",2]]},
  {t:"Puesta en paralelo y ensayos de transformadores", u:"transformadores", d:"Condiciones para conectar transformadores en paralelo y sus ensayos.", tm:[["maq",2],["medic",2]]},
  {t:"Características de vacío y carga", d:"De motores y transformadores. Ensayos de calentamiento. Inspección visual. Criterios técnicos para seleccionar máquinas, herramientas, equipos e instrumentos.", tm:[["maq",2],["medic",2]]},
  {t:"Seguridad", u:"higiene-seguridad", d:"Seguridad laboral en el taller y en obra.", tm:[["hys",1]]}
]},
{id:"ie2", n:"Instalaciones Eléctricas II", area:"instal", anio:5, h:144, amb:"En propiedad horizontal: viviendas multifamiliares, oficinas y locales.", ejes:[
  {t:"Instalaciones eléctricas", u:"instalaciones-electricas", d:"Las instalaciones de corrientes débiles, muy baja y baja tensión, ahora en edificios: tableros, cableado, maniobra, protección, comando y señalización, canalizaciones y puesta a tierra.", tm:[["instal",2],["prot",2]]},
  {t:"Tecnología de los materiales eléctricos", u:"materiales-electricos", d:"Conductores, gabinetes, aislantes, materiales ferromagnéticos. Termografías y ensayos. Rendimientos.", tm:[["mat",2]]},
  {t:"Manejo de herramientas", u:"herramientas", d:"Herramientas manuales, equipos y máquinas herramientas.", tm:[["hys",1]]},
  {t:"Protección", u:"proteccion-electrica", d:"Contra contactos directos e indirectos. Protección de líneas contra sobrecarga, cortocircuito y sobretensiones.", tm:[["prot",2]]},
  {t:"Instalaciones de alumbrado", u:"alumbrado", d:"Luminarias, circuitos de uso general y especial, fuerza motriz, cálculos y esquemas.", tm:[["alumb",2],["instal",2]]},
  {t:"Mantenimiento", u:"mantenimiento-electrico", d:"De los componentes de protección y maniobra: interruptores, temporizadores, relés, guardamotores, fusibles, termomagnéticas.", tm:[["mant",2]]},
  {t:"Seguridad y mantenimiento preventivo", d:"Misión y funciones del mantenimiento preventivo, etapas de implementación, vida útil, plan de inspecciones, órdenes de trabajo, planillas de seguimiento y gráficos de control. Introducción al mantenimiento predictivo. Costos horarios y amortización.", tm:[["mant",2],["hys",2]]}
]},
{id:"me2", n:"Mediciones Eléctricas II", area:"medic", anio:5, h:96, ejes:[
  {t:"Medición", u:"mediciones-ca", d:"Medición de potencia, frecuencia, resistencia, energía y factor de potencia (cos φ).", tm:[["medic",2],["calidad",1]]},
  {t:"Instrumentos", u:"instrumentos-digitales", d:"Vatímetro, cosfímetro, medidores de energía, frecuencímetro, osciloscopio. Transformadores de medida de corriente y de tensión. Conexionado y calibración.", tm:[["medic",2]]},
  {t:"Mediciones especiales", d:"Medición de puesta a tierra y de aislación. Grupos electrógenos y ensayos de generadores. Funciones básicas de controladores lógicos. Sensores, actuadores, introducción a los servosistemas.", tm:[["medic",3],["sens",1]]},
  {t:"Seguridad", u:"higiene-seguridad", d:"Seguridad laboral en los ensayos y en la operación de equipos de medición.", tm:[["hys",2]]}
]},
{id:"prg2", n:"Proyecto y Representación Gráfica II", area:"proy", anio:5, h:72, ejes:[
  {t:"Etapas de un proyecto", u:"proyecto-instalacion", d:"Metodología y planificación. Anteproyecto. Análisis técnico-económico. Símbolos y especificaciones para planos de instalaciones eléctricas.", tm:[["cad",2]]},
  {t:"Códigos, normas y reglamentos", d:"Normas y reglamentos vigentes, entes reguladores y distribuidoras. Reglamentación para instalaciones en propiedad horizontal.", tm:[["normas",2]]},
  {t:"Normas", d:"Seguridad e higiene en la instalación y el montaje. Normas de calidad de procesos y productos.", tm:[["normas",2],["hys",2]]},
  {t:"Tipos y características de los materiales eléctricos", u:"materiales-electricos", d:"Selección de materiales para el proyecto.", tm:[["mat",2]]},
  {t:"Noción de proyecto", d:"Idea, ejecución y evaluación. Esquemas unifilares, trifilares y funcionales. Secuencia de los procesos de montaje e instalación.", tm:[["cad",2],["instal",2]]},
  {t:"Planillas de cargas", d:"Planillas de materiales (tipos normalizados, acreditación de conformidad). Protocolos de medición. Control de los tiempos de ejecución.", tm:[["cad",2],["normas",2]]}
]},
/* ---------- 6° AÑO ---------- */
{id:"mq2", n:"Máquinas Eléctricas II", area:"maq", anio:6, h:144, ejes:[
  {t:"Motores y transformadores", d:"Vacío y carga, ensayos de calentamiento, inspección y determinación de fallas. Mantenimiento de contactores, relés y protecciones. Termografías y ensayos.", tm:[["maq",3],["mant",3]]},
  {t:"Bobinado de motores", d:"Cálculo, ejecución y reparación de bobinados.", tm:[["maq",3]]},
  {t:"Generación de energía eléctrica", d:"Motogeneradores de media y pequeña potencia. Turbinas: tipos y características. Motores de combustión interna. Ensayos de equipos.", tm:[["energia",2],["maq",3]]},
  {t:"Insumos", d:"Combustibles y lubricantes, soldaduras, plásticos, adhesivos, nuevos materiales, bobinados.", tm:[["mat",3]]},
  {t:"Protección de transformadores y generadores", d:"Calidad del suministro: perturbaciones, microcortes y huecos de tensión. Planes de seguridad y medidas preventivas en los trabajos con tensión. Mejora de la calidad del servicio.", tm:[["prot",3],["calidad",2]]},
  {t:"Aspectos legales y reglamentarios de los trabajos con tensión", d:"Recorrida general de máquinas: etapas y formas de ejecución. Reparaciones antieconómicas y reemplazo. Vibraciones.", tm:[["normas",3],["mant",3]]}
]},
{id:"ie3", n:"Instalaciones Eléctricas III", area:"instal", anio:6, h:144, amb:"En fábricas, talleres e industrias; infraestructura urbana y rural; empresas de servicios eléctricos.", ejes:[
  {t:"Instalaciones eléctricas", u:"proyecto-instalacion", d:"Las instalaciones de corrientes débiles, muy baja y baja tensión en la industria: tableros, maniobra, protección, canalizaciones y puesta a tierra.", tm:[["instal",3],["prot",3]]},
  {t:"Tecnología de los materiales eléctricos", u:"materiales-electricos", d:"Conductores, gabinetes, aislantes, ferromagnéticos. Termografías y ensayos. Rendimientos.", tm:[["mat",3]]},
  {t:"Manejo de herramientas", u:"herramientas", d:"Herramientas manuales, equipos y máquinas herramientas.", tm:[["hys",2]]},
  {t:"Protección", u:"proteccion-electrica", d:"Contra contactos directos e indirectos. Protección de líneas contra sobrecarga, cortocircuito y sobretensiones.", tm:[["prot",3]]},
  {t:"Instalaciones de alumbrado", u:"alumbrado", d:"Luminarias, circuitos de uso general y especial, fuerza motriz, cálculos y esquemas.", tm:[["alumb",3]]},
  {t:"Mantenimiento", u:"mantenimiento-electrico", d:"De los componentes de protección y maniobra en fábricas e industrias.", tm:[["mant",3]]},
  {t:"Seguridad y mantenimiento preventivo", d:"Plan de mantenimiento preventivo, inspecciones, órdenes de trabajo, gestión del mantenimiento, controles periódicos, costos, amortización y vida útil. Mantenimiento predictivo.", tm:[["mant",3],["hys",2]]}
]},
{id:"ai1", n:"Automatización Industrial I", area:"auto", anio:6, h:96, ejes:[
  {t:"Nociones del mundo digital", u:"logica-combinacional", d:"Sistemas de numeración y códigos, compuertas lógicas, lógica combinacional, álgebra de Boole y simplificación, flip-flops, contadores, registros, memorias y dispositivos programables.", tm:[["logica",1]]},
  {t:"Técnicas digitales", u:"aplicaciones-compuertas", d:"Análisis e implementación de circuitos de lógica combinacional.", tm:[["logica",2]]},
  {t:"Automatismo", u:"automatismo-plc", d:"Principio de un sistema automático. Elaboración de un automatismo. Opciones tecnológicas. Control de procesos.", tm:[["control",1]]},
  {t:"Autómatas programables", u:"estructura-plc", d:"Definición, historia y campos de aplicación del PLC. Estructura externa e interna, memorias, CPU, entradas y salidas, interfaces, unidades de programación y periféricos.", tm:[["control",2]]},
  {t:"Unidades de mando y señalización", u:"mando-senalizacion", d:"Sensores y transductores. Acondicionadores de señal. Actuadores y elementos finales de control.", tm:[["sens",2],["control",2]]},
  {t:"Fundamentos de neumática e hidráulica", u:"neumatica-hidraulica", d:"Principios básicos, unidades de medida, compresores y accesorios.", tm:[["neum",1]]},
  {t:"Actuadores neumáticos", u:"neumatica-hidraulica", d:"Válvulas de control, señales neumáticas, mandos electroneumáticos, lógica neumática. Cilindros de simple y doble efecto, ciclo continuo, temporizadores.", tm:[["neum",2]]},
  {t:"Hidráulica", u:"neumatica-hidraulica", d:"Fluidos hidráulicos, cilindros, válvulas direccionales y auxiliares. Circuitos hidráulicos.", tm:[["neum",2]]}
]},
{id:"ei1", n:"Electrónica Industrial I", area:"elind", anio:6, h:96, ejes:[
  {t:"Transistores", u:"transistores-bipolares", d:"Corrientes del transistor. Montajes en base, emisor y colector común. Características de entrada y salida. Circuito equivalente.", tm:[["analog",1]]},
  {t:"Polarización", u:"/publicaciones/transistores-bipolares", d:"Polarización fija, factor de estabilidad S, polarización colector-base, autopolarización.", tm:[["analog",2]]},
  {t:"Transistor de efecto de campo", u:"amplificadores-potencia", d:"FET y MOSFET. El transistor como llave. Amplificación: clases A, B, AB y C, acoplamiento directo y RC, par Darlington.", tm:[["analog",2],["pot",1]]},
  {t:"Tiristores", u:"componentes-potencia", d:"Rectificadores controlados de silicio (SCR). Métodos de disparo por compuerta. Control de fase RC.", tm:[["pot",1]]},
  {t:"Triac y diac", u:"semiconductores-especiales", d:"Características y funcionamiento. Aplicaciones del SCR, el triac y el diac en circuitos de potencia y control industrial.", tm:[["pot",2]]}
]},
{id:"prg3", n:"Proyecto y Representación Gráfica III", area:"proy", anio:6, h:72, ejes:[
  {t:"Proyecto eléctrico", d:"Demanda de potencia, líneas y circuitos, condiciones ambientales. Conductores y barras, blindobarras, maniobra y protección, corrientes de cortocircuito, coordinación de protecciones, potencia reactiva y corrección del factor de potencia.", tm:[["cad",3],["prot",3],["calidad",2]]},
  {t:"Ejecución", d:"Planos y especificaciones, planos conforme a obra, catálogos y normas. Líneas de media y baja tensión, subterráneas, distribución. Selección de motores, centro de control de motores, potencia instalada y contratada, centros de transformación, iluminación, uso racional de la energía.", tm:[["cad",3],["energia",2],["alumb",3]]}
]},
/* ---------- 7° AÑO ---------- */
{id:"cc", n:"Centrales y Canalizaciones Eléctricas", area:"maq", anio:7, h:144, ejes:[
  {t:"Generador", d:"Operación del equipo y rendimientos. Turbinas. Máquinas de combustión interna. Combustibles y lubricantes. Generación de energía eléctrica.", tm:[["energia",3],["maq",4]]},
  {t:"Motogeneradores de media y pequeña potencia", d:"Turbinas, motores de combustión interna, ensayos de equipos, insumos y bobinados. Protección de transformadores y generadores.", tm:[["energia",3],["prot",4]]},
  {t:"Transformadores de potencia", u:"transformadores", d:"Esquemas de conexión. Normativa para los trabajos en media tensión. Determinación de fallas.", tm:[["maq",4],["normas",3]]},
  {t:"Subestaciones y líneas de distribución", d:"Procesos de trabajo: planificación, calidad, productividad, cronograma y tiempos críticos, eficiencia. Prevención de incendios y cuidado del ambiente.", tm:[["energia",4],["instal",4]]},
  {t:"Normas de seguridad e higiene", u:"higiene-seguridad", d:"Riesgo eléctrico. Primeros auxilios.", tm:[["hys",3]]},
  {t:"Técnicas de identificación y resolución de problemas", d:"Seguridad en la vía pública, emplazamiento de líneas, alturas y distancias de seguridad, prohibición de acceso y señalización.", tm:[["instal",4],["hys",3]]},
  {t:"Calidad del suministro de energía eléctrica", d:"Análisis de la calidad del suministro.", tm:[["calidad",3]]}
]},
{id:"ie4", n:"Instalaciones Eléctricas IV", area:"instal", anio:7, h:144, amb:"En equipos y edificaciones eléctricas especiales.", ejes:[
  {t:"Instalaciones eléctricas", d:"Las instalaciones de corrientes débiles, muy baja y baja tensión en equipos y edificios especiales: tableros, maniobra, protección, canalizaciones y puesta a tierra.", tm:[["instal",4]]},
  {t:"Tecnología de los materiales eléctricos", u:"materiales-electricos", d:"Conductores, gabinetes, aislantes, ferromagnéticos. Termografías y ensayos. Rendimientos.", tm:[["mat",4]]},
  {t:"Manejo de herramientas", u:"herramientas", d:"Herramientas manuales, equipos y máquinas herramientas.", tm:[["hys",2]]},
  {t:"Protección", u:"proteccion-electrica", d:"Contra contactos directos e indirectos. Protección de líneas contra sobrecarga, cortocircuito y sobretensiones.", tm:[["prot",4]]},
  {t:"Instalaciones de alumbrado", u:"alumbrado", d:"Luminarias, circuitos de uso general y especial, fuerza motriz, cálculos y esquemas.", tm:[["alumb",4]]},
  {t:"Cálculos", u:"potencia-ca", d:"Corrientes de cortocircuito. Coordinación de protecciones. Potencia reactiva y equipo de corrección del factor de potencia; su instalación.", tm:[["calidad",4],["prot",4]]},
  {t:"Mantenimiento", u:"mantenimiento-electrico", d:"De los componentes de protección y maniobra.", tm:[["mant",4]]},
  {t:"Seguridad y mantenimiento preventivo", d:"Plan de mantenimiento preventivo y predictivo, inspecciones, órdenes de trabajo, controles periódicos, costos, amortización y vida útil.", tm:[["mant",4],["hys",3]]}
]},
{id:"ai2", n:"Automatización Industrial II", area:"auto", anio:7, h:144, ejes:[
  {t:"Manejo e instalación", d:"Puesta en funcionamiento del autómata, programación y almacenamiento, conexionado de entradas y salidas, alimentación y mantenimiento.", tm:[["control",3]]},
  {t:"Instrucciones y programas de los autómatas", u:"programacion-plc", d:"Ejecución de programas. Lenguajes: nemónicos o booleanos, diagrama de contactos, plano de funciones, Grafcet, organigrama. Simbología y equivalencias.", tm:[["control",3]]},
  {t:"Aplicaciones básicas de programación", u:"aplicaciones-plc", d:"Entradas y salidas, marcas, temporizadores, contadores, registros de desplazamiento. Instrucciones de programa y de servicio. Circuitos lógicos y generadores de impulsos.", tm:[["control",4]]},
  {t:"Redes de automatización", u:"comunicaciones-industriales", d:"Comunicación entre equipos, nivel de enlace. Supervisión con SCADA: propiedades del sistema supervisor y procesos supervisados.", tm:[["redes",3],["control",4]]},
  {t:"Buses", u:"comunicaciones-industriales", d:"Buses de campo y sus campos de aplicación: CAN, SDS, AS-i, Profibus, Interbus, Fieldbus, Modbus, Ethernet industrial. Estandarización.", tm:[["redes",3]]}
]},
{id:"ei2", n:"Electrónica Industrial II", area:"elind", anio:7, h:96, ejes:[
  {t:"Amplificadores", u:"osciladores", d:"Realimentación y condición de oscilación. Osciladores senoidales y no senoidales: astable, monoestable y biestable. Calentamiento por alta frecuencia.", tm:[["analog",3]]},
  {t:"Amplificadores operacionales", u:"/publicaciones/amplificadores-operacionales", d:"Ideal y real, amplificador diferencial. Sumador, derivador, integrador, comparador. Control de potencia con operacionales. Servomecanismos.", tm:[["analog",3],["pot",3]]},
  {t:"Control electrónico de motores", u:"variadores-velocidad", d:"Control de motores de CC y CA. Regulación de la velocidad y accionamientos para mantenerla constante.", tm:[["pot",3],["maq",4]]},
  {t:"Circuitos de aplicación industrial", u:"control-temperatura-iluminacion", d:"Control de temperatura, caudal y ruido. Calentamiento electrónico. Circuitos lógicos, conversión A/D, optoelectrónica y transductores.", tm:[["sens",3],["pot",4]]}
]},
{id:"fat", n:"Formación en Ambiente de Trabajo", area:"practica", anio:7, h:240, ejes:[
  {t:"Práctica profesionalizante", u:"practica-profesionalizante", d:"Prácticas en situaciones reales de trabajo: montaje, instalación, operación y mantenimiento. Consolida e integra las capacidades del perfil profesional.", tm:[["instal",4],["mant",4]]}
]}
];
