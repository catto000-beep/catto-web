/* ============================================================
   catto.ar - Data for the Electrical Technician program (Técnico Electricista)
   Areas, cross-cutting topics and the 18 curricular spaces of the Specific Technical
   Training Field, with their topics. Used by /en/publicaciones/mapa-electricidad.
   Source: Curriculum Proposal DGETyFP Córdoba (2011), Electricity, Section 9
   (pp. 133-163) and Section 10 (Training in the Work Environment). Plan 687198106.
   English copy of assets/js/tecnicatura-electricidad.js: same ids, same links.
   u: a topic page already written (in /en/publicaciones/mapa-electronica/temas/) or,
   if it starts with «/», a publication of the site. Both programs share pages.
   amb: setting of the installation that the document sets for each Electrical Installations.
   ============================================================ */
var AREAS = {
  electro: {nombre:"Electrical Technology", color:"#2dd4bf"},
  instal:  {nombre:"Electrical Installations", color:"#d2691e"},
  medic:   {nombre:"Electrical Measurements", color:"#56d4dd"},
  proy:    {nombre:"Design and Technical Drawing", color:"#bc8cff"},
  maq:     {nombre:"Machines and Power Plants", color:"#00897b"},
  auto:    {nombre:"Industrial Automation", color:"#f85149"},
  elind:   {nombre:"Industrial Electronics", color:"#e3a008"},
  practica:{nombre:"Professional Practice", color:"#8b949e"}
};

// Cross-cutting areas (topics that span subjects)
var TEMAS = {
  circ:    {n:"Circuits and electrical fundamentals", c:"#2dd4bf"},
  energia: {n:"Power generation and distribution", c:"#26a69a"},
  maq:     {n:"Transformers, motors and generators", c:"#00897b"},
  instal:  {n:"Electrical installations", c:"#d2691e"},
  mat:     {n:"Electrical materials", c:"#c08457"},
  prot:    {n:"Electrical protection", c:"#f0883e"},
  alumb:   {n:"Lighting", c:"#f2cc60"},
  calidad: {n:"Power quality and power factor", c:"#ffa657"},
  mant:    {n:"Maintenance", c:"#db6d28"},
  medic:   {n:"Measurement and instrumentation", c:"#56d4dd"},
  cad:     {n:"Drawings, plans and design", c:"#bc8cff"},
  normas:  {n:"Standards and regulations", c:"#a371f7"},
  hys:     {n:"Health and safety", c:"#d29922"},
  logica:  {n:"Digital logic", c:"#58a6ff"},
  control: {n:"Automation and PLCs", c:"#da3633"},
  sens:    {n:"Sensors and actuators", c:"#ff7b72"},
  neum:    {n:"Pneumatics and hydraulics", c:"#79c0ff"},
  redes:   {n:"Industrial networks and buses", c:"#1f6feb"},
  analog:  {n:"Transistors and amplifiers", c:"#e3a008"},
  pot:     {n:"Power electronics and motor control", c:"#f85149"}
};

// Subjects of the Specific Technical Training Field
// lvl: depth of the topic (1 intro · 2 development · 3 in-depth · 4 application/integration)
var MATERIAS = [
/* ---------- YEAR 4 ---------- */
{id:"et", n:"Electrical Technology", area:"electro", anio:4, h:144, ejes:[
  {t:"Electrical energy", d:"Generation, transmission and transformation. Thermal energy.", tm:[["energia",1]]},
  {t:"Energy sources", d:"Conventional sources: oil and gas. Power generation and alternative energies. Uses of energy. Distribution networks. Energy and power. Efficiency of the conversions.", tm:[["energia",1]]},
  {t:"Electrical engineering basics", u:"corriente-electrica", d:"Direct and alternating current. Current and voltage. Ohm's law, Kirchhoff's laws, Joule effect. Quantities and basic formulas. Combinations of resistors, sources (cells and batteries) and capacitors. Impedance.", tm:[["circ",1]]},
  {t:"Solving DC and AC circuits", u:"corrientes-alternas", d:"Calculation of direct- and alternating-current circuits.", tm:[["circ",2]]},
  {t:"Magnetism and electromagnetism", u:"magnetismo-electromagnetismo", d:"Magnetic field, electromagnets and induction: the basis of motors and transformers.", tm:[["circ",2],["maq",1]]},
  {t:"Motors", u:"motores-ca", d:"DC and AC motors, single-phase and three-phase: concept and operation.", tm:[["maq",1]]},
  {t:"Static electrical machines", u:"transformadores", d:"Transformers: concept, operation and laboratory tests.", tm:[["maq",1]]}
]},
{id:"ie1", n:"Electrical Installations I", area:"instal", anio:4, h:144, amb:"In buildings: single-family homes.", ejes:[
  {t:"Electrical installations", u:"instalaciones-vivienda", d:"Low-current, extra-low-voltage and low-voltage installations. Installation rules. Panels, wiring, switching, protection, control and signalling devices. Conduits. Earthing. Electrical design of a typical home.", tm:[["instal",1],["prot",1]]},
  {t:"Electrical materials technology", u:"materiales-electricos", d:"Conductors, enclosures, insulators, ferromagnetic materials. Thermography and tests on equipment. Efficiencies.", tm:[["mat",1]]},
  {t:"Use of tools", u:"herramientas", d:"Hand tools, equipment and machine tools.", tm:[["hys",1]]},
  {t:"Protection", u:"proteccion-electrica", d:"Against direct and indirect contact. Protection of circuits against overload, short circuit and overvoltage.", tm:[["prot",1]]},
  {t:"Lighting installations", u:"alumbrado", d:"Luminaires, general-purpose and special circuits, power circuits, calculations and diagrams.", tm:[["alumb",1],["instal",1]]},
  {t:"Maintenance", u:"mantenimiento-electrico", d:"Of protection and switching components: switches, timers, thermal relays, phase-loss relays, motor protection breakers, fuses, circuit breakers.", tm:[["mant",1]]}
]},
{id:"me1", n:"Electrical Measurements I", area:"medic", anio:4, h:96, ejes:[
  {t:"Measurements", u:"magnitudes-electricas", d:"Measurement errors, instrument classes. Measuring current, voltage, power and resistance.", tm:[["medic",1]]},
  {t:"Instruments", u:"instrumentos-analogicos", d:"Analog and digital instruments: voltmeter, ammeter, wattmeter, multimeter, frequency counter, bridges. Characteristics, connection and calibration.", tm:[["medic",1]]},
  {t:"Measurements on electrical machines", d:"Measurements on AC and DC motors, motor connection, starting methods. Measurement tests on motors and transformers.", tm:[["medic",2],["maq",1]]},
  {t:"Safety", u:"higiene-seguridad", d:"Workplace safety in tests and when operating electrical measuring instruments.", tm:[["hys",1]]}
]},
{id:"prg1", n:"Design and Technical Drawing I", area:"proy", anio:4, h:72, ejes:[
  {t:"Technical drawing", u:"dibujo-tecnico-cad", d:"Drawing elements and instruments, standardization, dimensioning, geometric constructions, freehand sketching.", tm:[["cad",1]]},
  {t:"Computer-aided design", u:"dibujo-tecnico-cad", d:"Introduction to computer-aided drawing: basic functions, applications, quality of representation, three dimensions.", tm:[["cad",1]]},
  {t:"Design", u:"/publicaciones/simbologia", d:"Projections and perspectives. Symbols of electrical elements. Representing machines and components. Reading installation plans, electrical diagrams and technical documentation.", tm:[["cad",1],["instal",1]]},
  {t:"Standards and regulations for electrical work", d:"Codes, standards and regulations in force, regulators and distribution companies. Regulations for electrical installations in buildings.", tm:[["normas",1]]},
  {t:"Health and safety standards", u:"higiene-seguridad", d:"In electrical installation and assembly work.", tm:[["hys",1]]}
]},
/* ---------- YEAR 5 ---------- */
{id:"mq1", n:"Electrical Machines I", area:"maq", anio:5, h:144, ejes:[
  {t:"AC and DC motors", u:"motores-ca", d:"Types, connection and starting methods. Tests. Parts, bearings, materials. Wiring and mounting of motors.", tm:[["maq",2]]},
  {t:"Parallel operation and tests of transformers", u:"transformadores", d:"Conditions for connecting transformers in parallel, and their tests.", tm:[["maq",2],["medic",2]]},
  {t:"No-load and load characteristics", d:"Of motors and transformers. Temperature-rise tests. Visual inspection. Technical criteria for selecting machines, tools, equipment and instruments.", tm:[["maq",2],["medic",2]]},
  {t:"Safety", u:"higiene-seguridad", d:"Workplace safety in the workshop and on site.", tm:[["hys",1]]}
]},
{id:"ie2", n:"Electrical Installations II", area:"instal", anio:5, h:144, amb:"In multi-unit buildings: apartments, offices and shops.", ejes:[
  {t:"Electrical installations", u:"instalaciones-electricas", d:"Low-current, extra-low-voltage and low-voltage installations, now in buildings: panels, wiring, switching, protection, control and signalling, conduits and earthing.", tm:[["instal",2],["prot",2]]},
  {t:"Electrical materials technology", u:"materiales-electricos", d:"Conductors, enclosures, insulators, ferromagnetic materials. Thermography and tests. Efficiencies.", tm:[["mat",2]]},
  {t:"Use of tools", u:"herramientas", d:"Hand tools, equipment and machine tools.", tm:[["hys",1]]},
  {t:"Protection", u:"proteccion-electrica", d:"Against direct and indirect contact. Protection of circuits against overload, short circuit and overvoltage.", tm:[["prot",2]]},
  {t:"Lighting installations", u:"alumbrado", d:"Luminaires, general-purpose and special circuits, power circuits, calculations and diagrams.", tm:[["alumb",2],["instal",2]]},
  {t:"Maintenance", u:"mantenimiento-electrico", d:"Of protection and switching components: switches, timers, relays, motor protection breakers, fuses, circuit breakers.", tm:[["mant",2]]},
  {t:"Safety and preventive maintenance", d:"Purpose and functions of preventive maintenance, implementation stages, service life, inspection plan, work orders, tracking sheets and control charts. Introduction to predictive maintenance. Hourly costs and depreciation.", tm:[["mant",2],["hys",2]]}
]},
{id:"me2", n:"Electrical Measurements II", area:"medic", anio:5, h:96, ejes:[
  {t:"Measurement", u:"mediciones-ca", d:"Measuring power, frequency, resistance, energy and power factor (cos φ).", tm:[["medic",2],["calidad",1]]},
  {t:"Instruments", u:"instrumentos-digitales", d:"Wattmeter, power-factor meter, energy meters, frequency counter, oscilloscope. Current and voltage instrument transformers. Connection and calibration.", tm:[["medic",2]]},
  {t:"Special measurements", d:"Earth resistance and insulation measurements. Generator sets and generator tests. Basic functions of logic controllers. Sensors, actuators, introduction to servo systems.", tm:[["medic",3],["sens",1]]},
  {t:"Safety", u:"higiene-seguridad", d:"Workplace safety in tests and when operating measuring equipment.", tm:[["hys",2]]}
]},
{id:"prg2", n:"Design and Technical Drawing II", area:"proy", anio:5, h:72, ejes:[
  {t:"Stages of a project", u:"proyecto-instalacion", d:"Methodology and planning. Preliminary design. Technical and economic analysis. Symbols and specifications for electrical installation plans.", tm:[["cad",2]]},
  {t:"Codes, standards and regulations", d:"Standards and regulations in force, regulators and distribution companies. Regulations for installations in multi-unit buildings.", tm:[["normas",2]]},
  {t:"Standards", d:"Health and safety in installation and assembly. Quality standards for processes and products.", tm:[["normas",2],["hys",2]]},
  {t:"Types and characteristics of electrical materials", u:"materiales-electricos", d:"Selecting materials for the project.", tm:[["mat",2]]},
  {t:"The idea of a project", d:"Idea, execution and evaluation. Single-line, three-line and functional diagrams. Sequencing of assembly and installation work.", tm:[["cad",2],["instal",2]]},
  {t:"Load and material schedules", d:"Material schedules (standard types, certificates of conformity). Measurement reports. Tracking of execution times.", tm:[["cad",2],["normas",2]]}
]},
/* ---------- YEAR 6 ---------- */
{id:"mq2", n:"Electrical Machines II", area:"maq", anio:6, h:144, ejes:[
  {t:"Motors and transformers", d:"No-load and load tests, temperature-rise tests, inspection and fault finding. Maintenance of contactors, relays and protections. Thermography and tests.", tm:[["maq",3],["mant",3]]},
  {t:"Motor winding", d:"Calculating, making and repairing windings.", tm:[["maq",3]]},
  {t:"Electric power generation", d:"Medium- and low-power generator sets. Turbines: types and characteristics. Internal combustion engines. Equipment tests.", tm:[["energia",2],["maq",3]]},
  {t:"Supplies", d:"Fuels and lubricants, welding, plastics, adhesives, new materials, windings.", tm:[["mat",3]]},
  {t:"Protection of transformers and generators", d:"Supply quality: disturbances, micro-interruptions and voltage dips. Safety plans and preventive measures for live work. Improving service quality.", tm:[["prot",3],["calidad",2]]},
  {t:"Legal and regulatory aspects of live work", d:"General overhaul of machines: stages and ways of carrying it out. Uneconomic repairs and replacement. Vibration.", tm:[["normas",3],["mant",3]]}
]},
{id:"ie3", n:"Electrical Installations III", area:"instal", anio:6, h:144, amb:"In factories, workshops and industries; urban and rural infrastructure; electric utilities.", ejes:[
  {t:"Electrical installations", u:"proyecto-instalacion", d:"Low-current, extra-low-voltage and low-voltage installations in industry: panels, switching, protection, conduits and earthing.", tm:[["instal",3],["prot",3]]},
  {t:"Electrical materials technology", u:"materiales-electricos", d:"Conductors, enclosures, insulators, ferromagnetic materials. Thermography and tests. Efficiencies.", tm:[["mat",3]]},
  {t:"Use of tools", u:"herramientas", d:"Hand tools, equipment and machine tools.", tm:[["hys",2]]},
  {t:"Protection", u:"proteccion-electrica", d:"Against direct and indirect contact. Protection of circuits against overload, short circuit and overvoltage.", tm:[["prot",3]]},
  {t:"Lighting installations", u:"alumbrado", d:"Luminaires, general-purpose and special circuits, power circuits, calculations and diagrams.", tm:[["alumb",3]]},
  {t:"Maintenance", u:"mantenimiento-electrico", d:"Of protection and switching components in factories and industries.", tm:[["mant",3]]},
  {t:"Safety and preventive maintenance", d:"Preventive maintenance plan, inspections, work orders, maintenance management, periodic checks, costs, depreciation and service life. Predictive maintenance.", tm:[["mant",3],["hys",2]]}
]},
{id:"ai1", n:"Industrial Automation I", area:"auto", anio:6, h:96, ejes:[
  {t:"Basics of the digital world", u:"logica-combinacional", d:"Number systems and codes, logic gates, combinational logic, Boolean algebra and simplification, flip-flops, counters, registers, memories and programmable devices.", tm:[["logica",1]]},
  {t:"Digital techniques", u:"aplicaciones-compuertas", d:"Analysis and implementation of combinational logic circuits.", tm:[["logica",2]]},
  {t:"Automation", u:"automatismo-plc", d:"Principle of an automatic system. Building an automation. Technological options. Process control.", tm:[["control",1]]},
  {t:"Programmable logic controllers", u:"estructura-plc", d:"Definition, history and fields of application of the PLC. External and internal structure, memories, CPU, inputs and outputs, interfaces, programming units and peripherals.", tm:[["control",2]]},
  {t:"Control and signalling units", u:"mando-senalizacion", d:"Sensors and transducers. Signal conditioners. Actuators and final control elements.", tm:[["sens",2],["control",2]]},
  {t:"Fundamentals of pneumatics and hydraulics", u:"neumatica-hidraulica", d:"Basic principles, units of measurement, compressors and accessories.", tm:[["neum",1]]},
  {t:"Pneumatic actuators", u:"neumatica-hidraulica", d:"Control valves, pneumatic signals, electropneumatic control, pneumatic logic. Single- and double-acting cylinders, continuous cycle, timers.", tm:[["neum",2]]},
  {t:"Hydraulics", u:"neumatica-hidraulica", d:"Hydraulic fluids, cylinders, directional and auxiliary valves. Hydraulic circuits.", tm:[["neum",2]]}
]},
{id:"ei1", n:"Industrial Electronics I", area:"elind", anio:6, h:96, ejes:[
  {t:"Transistors", u:"transistores-bipolares", d:"Transistor currents. Common-base, common-emitter and common-collector configurations. Input and output characteristics. Equivalent circuit.", tm:[["analog",1]]},
  {t:"Biasing", u:"/publicaciones/transistores-bipolares", d:"Fixed bias, stability factor S, collector-feedback bias, self-bias.", tm:[["analog",2]]},
  {t:"Field-effect transistor", u:"amplificadores-potencia", d:"FET and MOSFET. The transistor as a switch. Amplification: classes A, B, AB and C, direct and RC coupling, Darlington pair.", tm:[["analog",2],["pot",1]]},
  {t:"Thyristors", u:"componentes-potencia", d:"Silicon-controlled rectifiers (SCR). Gate triggering methods. RC phase control.", tm:[["pot",1]]},
  {t:"Triac and diac", u:"semiconductores-especiales", d:"Characteristics and operation. Applications of the SCR, triac and diac in power circuits and industrial control.", tm:[["pot",2]]}
]},
{id:"prg3", n:"Design and Technical Drawing III", area:"proy", anio:6, h:72, ejes:[
  {t:"Electrical design", d:"Power demand, feeders and circuits, environmental conditions. Conductors and busbars, busways, switching and protection, short-circuit currents, protection coordination, reactive power and power-factor correction.", tm:[["cad",3],["prot",3],["calidad",2]]},
  {t:"Execution", d:"Plans and specifications, as-built drawings, catalogues and standards. Medium- and low-voltage lines, underground lines, distribution. Motor selection, motor control center, installed and contracted power, transformer stations, lighting, rational use of energy.", tm:[["cad",3],["energia",2],["alumb",3]]}
]},
/* ---------- YEAR 7 ---------- */
{id:"cc", n:"Power Plants and Distribution", area:"maq", anio:7, h:144, ejes:[
  {t:"Generator", d:"Operating the equipment and efficiencies. Turbines. Internal combustion engines. Fuels and lubricants. Electric power generation.", tm:[["energia",3],["maq",4]]},
  {t:"Medium- and low-power generator sets", d:"Turbines, internal combustion engines, equipment tests, supplies and windings. Protection of transformers and generators.", tm:[["energia",3],["prot",4]]},
  {t:"Power transformers", u:"transformadores", d:"Connection diagrams. Regulations for medium-voltage work. Fault finding.", tm:[["maq",4],["normas",3]]},
  {t:"Substations and distribution lines", d:"Work processes: planning, quality, productivity, schedule and critical times, efficiency. Fire prevention and environmental care.", tm:[["energia",4],["instal",4]]},
  {t:"Health and safety standards", u:"higiene-seguridad", d:"Electrical risk. First aid.", tm:[["hys",3]]},
  {t:"Problem identification and solving techniques", d:"Safety on public roads, routing of lines, safety heights and clearances, access restrictions and signage.", tm:[["instal",4],["hys",3]]},
  {t:"Quality of the electricity supply", d:"Analysis of supply quality.", tm:[["calidad",3]]}
]},
{id:"ie4", n:"Electrical Installations IV", area:"instal", anio:7, h:144, amb:"In special electrical equipment and buildings.", ejes:[
  {t:"Electrical installations", d:"Low-current, extra-low-voltage and low-voltage installations in special equipment and buildings: panels, switching, protection, conduits and earthing.", tm:[["instal",4]]},
  {t:"Electrical materials technology", u:"materiales-electricos", d:"Conductors, enclosures, insulators, ferromagnetic materials. Thermography and tests. Efficiencies.", tm:[["mat",4]]},
  {t:"Use of tools", u:"herramientas", d:"Hand tools, equipment and machine tools.", tm:[["hys",2]]},
  {t:"Protection", u:"proteccion-electrica", d:"Against direct and indirect contact. Protection of circuits against overload, short circuit and overvoltage.", tm:[["prot",4]]},
  {t:"Lighting installations", u:"alumbrado", d:"Luminaires, general-purpose and special circuits, power circuits, calculations and diagrams.", tm:[["alumb",4]]},
  {t:"Calculations", u:"potencia-ca", d:"Short-circuit currents. Protection coordination. Reactive power and power-factor correction equipment; its installation.", tm:[["calidad",4],["prot",4]]},
  {t:"Maintenance", u:"mantenimiento-electrico", d:"Of protection and switching components.", tm:[["mant",4]]},
  {t:"Safety and preventive maintenance", d:"Preventive and predictive maintenance plan, inspections, work orders, periodic checks, costs, depreciation and service life.", tm:[["mant",4],["hys",3]]}
]},
{id:"ai2", n:"Industrial Automation II", area:"auto", anio:7, h:144, ejes:[
  {t:"Handling and installation", d:"Commissioning the controller, programming and storage, wiring of inputs and outputs, power supply and maintenance.", tm:[["control",3]]},
  {t:"PLC instructions and programs", u:"programacion-plc", d:"Program execution. Languages: mnemonic or Boolean, ladder diagram, function block diagram, Grafcet, flowchart. Symbols and equivalences.", tm:[["control",3]]},
  {t:"Basic programming applications", u:"aplicaciones-plc", d:"Inputs and outputs, markers, timers, counters, shift registers. Program and service instructions. Logic circuits and pulse generators.", tm:[["control",4]]},
  {t:"Automation networks", u:"comunicaciones-industriales", d:"Communication between devices, data link layer. Supervision with SCADA: properties of the supervisory system and supervised processes.", tm:[["redes",3],["control",4]]},
  {t:"Buses", u:"comunicaciones-industriales", d:"Fieldbuses and their fields of application: CAN, SDS, AS-i, Profibus, Interbus, Fieldbus, Modbus, Industrial Ethernet. Standardization.", tm:[["redes",3]]}
]},
{id:"ei2", n:"Industrial Electronics II", area:"elind", anio:7, h:96, ejes:[
  {t:"Amplifiers", u:"osciladores", d:"Feedback and the condition for oscillation. Sinusoidal and non-sinusoidal oscillators: astable, monostable and bistable. High-frequency heating.", tm:[["analog",3]]},
  {t:"Operational amplifiers", u:"/publicaciones/amplificadores-operacionales", d:"Ideal and real, differential amplifier. Summing amplifier, differentiator, integrator, comparator. Power control with op amps. Servomechanisms.", tm:[["analog",3],["pot",3]]},
  {t:"Electronic motor control", u:"variadores-velocidad", d:"Control of DC and AC motors. Speed regulation and drives that keep it constant.", tm:[["pot",3],["maq",4]]},
  {t:"Industrial application circuits", u:"control-temperatura-iluminacion", d:"Temperature, flow and noise control. Electronic heating. Logic circuits, A/D conversion, optoelectronics and transducers.", tm:[["sens",3],["pot",4]]}
]},
{id:"fat", n:"Training in the Work Environment", area:"practica", anio:7, h:240, ejes:[
  {t:"Professional practice", u:"practica-profesionalizante", d:"Practice in real work situations: assembly, installation, operation and maintenance. Consolidates and integrates the capabilities of the professional profile.", tm:[["instal",4],["mant",4]]}
]}
];
