/* ============================================================
   catto.ar - Data for the Electronics Technician program
   Areas, cross-cutting topics and the 21 curricular spaces with their 95 topics.
   Used by the map (/publicaciones/mapa-electronica) and the home page.
   Source: Curriculum Proposal DGETyFP Cordoba (2011), Section 9.
   Single copy: if a topic is edited, it changes in both places.
   ============================================================ */
var AREAS = {
  digital:   {nombre:"Digital Electronics", color:"#58a6ff"},
  analogica: {nombre:"Analog Electronics", color:"#e3a008"},
  electro:   {nombre:"Electrical Technology", color:"#2dd4bf"},
  info:      {nombre:"Computing for Electronics", color:"#a371f7"},
  industrial:{nombre:"Industrial Electronics", color:"#f85149"},
  telecom:   {nombre:"Telecommunications", color:"#3fb950"},
  instal:    {nombre:"Installations", color:"#d2691e"},
  proyecto:  {nombre:"Project / Practice", color:"#8b949e"}
};

// Cross-cutting areas (topics that span subjects)
var TEMAS = {
  semic:   {n:"Semiconductors and diodes", c:"#e3a008"},
  trans:   {n:"Transistors", c:"#f0883e"},
  amp:     {n:"Amplifiers (incl. op amps)", c:"#db6d28"},
  logica:  {n:"Digital logic", c:"#58a6ff"},
  micro:   {n:"Microprocessors and microcontrollers", c:"#1f6feb"},
  prog:    {n:"Programming", c:"#a371f7"},
  conv:    {n:"A/D – D/A conversion", c:"#79c0ff"},
  medic:   {n:"Measurement and instrumentation", c:"#56d4dd"},
  circ:    {n:"Circuits and electrical fundamentals", c:"#2dd4bf"},
  ca:      {n:"AC and three-phase power", c:"#26a69a"},
  maq:     {n:"Transformers and machines/motors", c:"#00897b"},
  pot:     {n:"Power electronics", c:"#f85149"},
  sens:    {n:"Sensors, actuators and transducers", c:"#ff7b72"},
  control: {n:"Control and automation (PLC/PID)", c:"#da3633"},
  instal:  {n:"Electrical installations", c:"#d2691e"},
  modul:   {n:"Modulation and communications", c:"#3fb950"},
  antena:  {n:"Antennas and propagation", c:"#56d364"},
  optica:  {n:"Fiber optics and satellite", c:"#2ea043"},
  cad:     {n:"CAD, schematics and PCB", c:"#bc8cff"},
  filt:    {n:"Filters and oscillators", c:"#ffa657"},
  hys:     {n:"Health and safety", c:"#d29922"}
};

// Subjects of the Specific Technical Training Field
// lvl: depth of the topic (1 intro · 2 development · 3 in-depth · 4 application/integration)
var MATERIAS = [
/* ---------- YEAR 4 ---------- */
{id:"ed1", n:"Digital Electronics I", area:"digital", anio:4, h:96, ejes:[
  {t:"Combinational logic", u:"logica-combinacional", d:"Logic gates, truth tables, equivalent circuits, TTL and CMOS technologies, adders, decoders and encoders.", tm:[["logica",1]]},
  {t:"Sequential logic", u:"logica-secuencial", d:"RS, D, JK and T flip-flops. Asynchronous and synchronous counters. Lab practice.", tm:[["logica",1]]},
  {t:"Applications with logic gates", u:"aplicaciones-compuertas", d:"Design of circuits and circuit boards with logic gates.", tm:[["logica",2],["cad",1]]}
]},
{id:"ea1", n:"Analog Electronics I", area:"analogica", anio:4, h:120, ejes:[
  {t:"Theory of semiconductor materials", u:"semiconductores-diodos", d:"n-type and p-type semiconductors. Diode: forward/reverse bias, characteristic curve. Half-wave/full-wave and bridge rectifiers. Capacitive filter. Zener diode and regulator.", tm:[["semic",1],["pot",1]]},
  {t:"Bipolar transistors", u:"transistores-bipolares", d:"Operation, characteristic curves, DC gain, load line. Transistor as a switch and as an amplifier. Biasing. Regulated power supplies with transistors.", tm:[["trans",1],["pot",1]]},
  {t:"Small-signal amplifiers", u:"amplificadores-senal-debil", d:"Common emitter. Coupling and bypass capacitors. AC gain. Common collector. Darlington connection.", tm:[["amp",1],["trans",2]]},
  {t:"Power amplifiers", u:"amplificadores-potencia", d:"Class A and Class B, complementary symmetry, single and split supply. Efficiency. Power amplifiers with integrated circuits.", tm:[["amp",2]]},
  {t:"Fundamental electrical quantities", u:"magnitudes-electricas", d:"Voltage, current, resistance. Units, multiples. DC measurement with analog and digital instruments.", tm:[["circ",1],["medic",1]]},
  {t:"Analog measuring instruments", u:"instrumentos-analogicos", d:"Moving-coil, moving-iron, electrodynamic. Voltmeter and ohmmeter.", tm:[["medic",1]]},
  {t:"The oscilloscope", u:"osciloscopio", d:"Cathode-ray tube, timebase, synchronization, waveform display and measurements in amplifier circuits.", tm:[["medic",2]]},
  {t:"AC measurements", u:"mediciones-ca", d:"RMS value, amplitude, period, frequency. Function generator, frequency counters.", tm:[["medic",2],["ca",1]]}
]},
{id:"et1", n:"Electrical Technology I", area:"electro", anio:4, h:120, ejes:[
  {t:"Electrostatics", u:"electrostatica", d:"Charges, electric field and potential, capacitance, dielectrics.", tm:[["circ",1]]},
  {t:"Electric current", u:"corriente-electrica", d:"Coulomb's law, resistance, Ohm's law, Kirchhoff's laws, power, Joule's law.", tm:[["circ",1]]},
  {t:"Magnetism and electromagnetism", u:"magnetismo-electromagnetismo", d:"Magnetic field, flux, reluctance, magnetic circuits. Field of a current, solenoid.", tm:[["circ",2]]},
  {t:"Electrodynamics and induction", u:"electrodinamica-induccion", d:"Electromagnetic force, hysteresis. Faraday's and Lenz's laws. Mutual inductance, self-inductance. Transformer principle.", tm:[["circ",2],["maq",1]]},
  {t:"Alternating currents", u:"corrientes-alternas", d:"Sine waves, peak/average/RMS values, frequency, power, power factor, resonance, phase shift.", tm:[["ca",1]]}
]},
{id:"ie1", n:"Computing for Electronics I", area:"info", anio:4, h:72, ejes:[
  {t:"Basic elements of the C language", u:"lenguaje-c", d:"Program structure, variables, constants, data types, operators, arrays, strings, flow control, functions, preprocessor, standard library.", tm:[["prog",1]]},
  {t:"C and C++ development environments", u:"entornos-c-cpp", d:"Device drivers, pointers and pointer arithmetic, structures, embedded systems programming, bootloaders, real time on microprocessors, concurrency.", tm:[["prog",2],["micro",1]]},
  {t:"The C++ language", u:"lenguaje-cpp", d:"Classes, objects, methods, inheritance and polymorphism. Constructors/destructors, overloading, exceptions, interfaces and device drivers.", tm:[["prog",2]]}
]},
/* ---------- YEAR 5 ---------- */
{id:"ed2", n:"Digital Electronics II", area:"digital", anio:5, h:96, ejes:[
  {t:"Programmable counters", u:"contadores-programables", d:"Expansions with programmable integrated circuits.", tm:[["logica",2]]},
  {t:"A/D and D/A converters", u:"conversores-ad-da", d:"DACs with weighted-resistor and ladder networks. Flash ADC. RS232, RS485, RS422 interfaces.", tm:[["conv",1],["modul",1]]},
  {t:"Digital measuring instruments", u:"instrumentos-digitales", d:"Architecture of a measuring instrument, multimeters, frequency counters.", tm:[["medic",2]]},
  {t:"Microprocessor and microcontroller architecture", u:"arquitectura-microprocesadores", d:"Introduction to the architecture of microprocessors and microcontrollers.", tm:[["micro",1]]}
]},
{id:"ea2", n:"Analog Electronics II", area:"analogica", anio:5, h:144, ejes:[
  {t:"Special semiconductors", u:"semiconductores-especiales", d:"Field-effect transistor (FET) and its types, controlled-trigger components (thyristors and triacs) and photoelectric components.", tm:[["semic",2],["trans",3],["pot",1]]},
  {t:"Linear integrated circuits", u:"/publicaciones/simulador-555", d:"The 555 integrated circuit.", tm:[["filt",1],["amp",2]]},
  {t:"Operational amplifiers", u:"/publicaciones/amplificadores-operacionales", d:"Concepts and characteristics. Signal amplifiers, comparators, summing amplifiers, waveform generators, instrumentation amplifiers, rectifiers. Applications and lab practice.", tm:[["amp",3]]},
  {t:"Measurements in standard circuits", u:"mediciones-impedancia", d:"Impedance measurements at low and high frequency, impedance bridge, frequency measurements.", tm:[["medic",3]]},
  {t:"Oscillators", u:"osciladores", d:"Oscillators and resonance.", tm:[["filt",2]]},
  {t:"Filters", u:"filtros", d:"High-pass, low-pass, band-pass and band-stop.", tm:[["filt",2]]}
]},
{id:"et2", n:"Electrical Technology II", area:"electro", anio:5, h:144, ejes:[
  {t:"Alternating current", u:"/publicaciones/ca-vectorial", d:"AC EMF, rotating vector, phasor diagrams, reactance, impedance, RL, RC, RLC circuits, resonance.", tm:[["ca",2]]},
  {t:"Power in alternating current", u:"potencia-ca", d:"Active, reactive and apparent power. Power factor and its correction.", tm:[["ca",2]]},
  {t:"Three-phase circuits", u:"circuitos-trifasicos", d:"Three-phase voltages, alternator, wye and delta connections, three-phase power.", tm:[["ca",3]]},
  {t:"Electrical installations", u:"instalaciones-electricas", d:"Symbols, conductor selection, protection: fuses, thermal-magnetic breakers, motor protection breakers, residual-current devices, contactors, thermal relay.", tm:[["instal",2]]},
  {t:"Transformers", u:"transformadores", d:"Current, voltage and impedance transformers. Calculation, efficiency, losses, turns ratio.", tm:[["maq",2]]},
  {t:"Single-phase and three-phase AC motors", u:"motores-ca", d:"Connection, protection and switching. Reversing, wye-delta starting. Power and control circuits.", tm:[["maq",2],["control",1]]}
]},
{id:"ie2", n:"Computing for Electronics II", area:"info", anio:5, h:120, ejes:[
  {t:"Technical drawing and computer-aided design (CAD)", u:"dibujo-tecnico-cad", d:"Technical drawing in engineering, standards for producing and interpreting drawings.", tm:[["cad",1]]},
  {t:"Symbols of electronic components", u:"simbologia-componentes", d:"Symbols of analog and digital components.", tm:[["cad",1]]},
  {t:"Schematic circuit diagrams", u:"esquematicos", d:"Standards, schematic capture software, design methodology, libraries.", tm:[["cad",2]]},
  {t:"Printed circuit boards (PCB)", u:"pcb", d:"PCB design methodology, software, mask transfer, assembly techniques, soldering and desoldering of components.", tm:[["cad",3]]},
  {t:"Circuit simulation and virtual measurements", u:"simulacion-circuitos", d:"Computer simulation, virtual measurements, error margins.", tm:[["cad",2],["medic",2]]}
]},
/* ---------- YEAR 6 ---------- */
{id:"ed3", n:"Digital Electronics III", area:"digital", anio:6, h:144, ejes:[
  {t:"Microcontroller family", u:"familia-microcontroladores", d:"Architecture, pinout diagram, instruction set. Control registers, flash and EEPROM memory, I/O ports and special resources.", tm:[["micro",2]]},
  {t:"Communication module", u:"comunicacion-serie", d:"Synchronous serial. USART: synchronous/asynchronous serial transmitter/receiver.", tm:[["micro",2],["modul",2]]},
  {t:"Peripherals", u:"perifericos-microcontrolador", d:"I/O ports, timers, compare and capture modules, A/D converters, PWM mode (pulse-width modulation).", tm:[["micro",3],["conv",2]]},
  {t:"Control with devices", u:"control-temperatura-iluminacion", d:"Temperature control. Lighting control.", tm:[["micro",3],["control",2]]},
  {t:"Programmable systems and memories", u:"memorias-dispositivos-programables", d:"RAM, ROM, EPROM, UV-EPROM, Flash ROM. Architectures of programmable devices.", tm:[["micro",2]]},
  {t:"PC operation and maintenance", u:"mantenimiento-pc", d:"Networks, interfaces, routers, software and technical documentation.", tm:[["medic",2]]},
  {t:"Digital measuring instruments", u:"instrumentos-digitales", d:"Architecture and functions.", tm:[["medic",3]]}
]},
{id:"ei1", n:"Industrial Electronics I", area:"industrial", anio:6, h:144, ejes:[
  {t:"Power components", u:"componentes-potencia", d:"Triac, diac, SCR, UJT, IGBT, MCT, GTO. Principles and circuit analysis.", tm:[["pot",2],["semic",2]]},
  {t:"Wye-delta connection", u:"circuitos-trifasicos", d:"Three-phase AC circuits, wye and delta systems.", tm:[["ca",3]]},
  {t:"Power and power factor", u:"potencia-ca", d:"Power in single-phase and three-phase circuits. Calculation methods and power factor correction.", tm:[["ca",3],["pot",2]]},
  {t:"Automatic control systems", u:"control-potencia", d:"Single-phase and three-phase power control.", tm:[["control",2],["pot",2]]},
  {t:"Power sources", u:"fuentes-conmutadas", d:"Conventional, switching, converters and inverters. Single-phase/three-phase controlled rectifiers, trigger circuits.", tm:[["pot",3]]},
  {t:"Fault diagnosis and detection", u:"diagnostico-fallas", d:"Methods and techniques for fault diagnosis and detection.", tm:[["medic",2]]},
  {t:"Variable-speed drives", u:"variadores-velocidad", d:"Variable-frequency drives, PWM inverter, vector flux, Volts/Hz.", tm:[["pot",3],["control",2]]},
  {t:"Sensors, actuators and transducers", u:"sensores-actuadores", d:"Proximity transducers (inductive, capacitive, acoustic, optical), position, speed, acceleration, temperature. Pneumatic, hydraulic and electric actuators.", tm:[["sens",2]]},
  {t:"Stepper motors", u:"motores-paso-a-paso", d:"Permanent-magnet rotor, bipolar and unipolar. Characteristics, typical faults, diagnosis.", tm:[["maq",3],["sens",2]]},
  {t:"Occupational health and safety", u:"higiene-seguridad", d:"Safe handling of power equipment. Standards and procedures.", tm:[["hys",1]]}
]},
{id:"tc1", n:"Telecommunications I", area:"telecom", anio:6, h:144, ejes:[
  {t:"Analog communications", u:"comunicaciones-analogicas", d:"Electromagnetic spectrum, propagation of electromagnetic waves.", tm:[["modul",2],["antena",1]]},
  {t:"Signal generation and processing", u:"senales-fourier", d:"Most common signals in communications, Fourier analysis.", tm:[["modul",2]]},
  {t:"Modulation systems", u:"sistemas-modulacion", d:"Comparative analysis of modulation systems.", tm:[["modul",2]]},
  {t:"Antennas and radiating systems", u:"antenas", d:"Types, characteristics, mounting and installation.", tm:[["antena",2]]},
  {t:"Microwave links", u:"enlaces-microondas", d:"Approximate link calculation.", tm:[["antena",2],["modul",2]]},
  {t:"Telephony and cellular telephony", u:"telefonia-celular", d:"Operation, evolution, digital technology, GSM, PCS.", tm:[["modul",2]]},
  {t:"Satellite communication", u:"comunicacion-satelital", d:"Bands, space and ground segments, antennas, LNA, power amplifiers, link budget.", tm:[["optica",2],["antena",2]]},
  {t:"Laser and optical fibers", u:"fibra-optica", d:"Transmitters, receivers, fiber, amplifiers, wavelength-division multiplexing, dispersion.", tm:[["optica",2]]},
  {t:"Assembly, installation and measurements", u:"mediciones-rf", d:"Equipment protection, safe handling. Impedance measurements, ultra-high-frequency and microwave measurements, on receivers and transmitters.", tm:[["medic",3],["hys",1]]}
]},
{id:"ii", n:"Industrial Installations", area:"instal", anio:6, h:168, ejes:[
  {t:"Electrical installations", u:"instalaciones-vivienda", d:"Low-current systems, extra-low and low voltage. Panels, wiring, switching and protection devices, grounding, residential electrical project.", tm:[["instal",3]]},
  {t:"Electrical materials technology", u:"materiales-electricos", d:"Conductors, enclosures, thermography, insulators, ferromagnetic materials, efficiencies.", tm:[["instal",2]]},
  {t:"Use of tools", u:"herramientas", d:"Hand tools, equipment and machine tools.", tm:[["instal",1]]},
  {t:"Protection", u:"proteccion-electrica", d:"Direct and indirect contact, line protection against overload, short circuit and overvoltage.", tm:[["instal",3]]},
  {t:"Lighting installations", u:"alumbrado", d:"Luminaires, general and special circuits, motive power, calculations and diagrams.", tm:[["instal",2]]},
  {t:"Maintenance of electrical components", u:"mantenimiento-electrico", d:"Switches, timers, thermal relay, motor protection breakers, fuses, thermal-magnetic breakers in factories and industries.", tm:[["instal",2],["hys",1]]},
  {t:"Installation project", u:"proyecto-instalacion", d:"Comprehensive project of an installation.", tm:[["instal",4]]}
]},
/* ---------- YEAR 7 ---------- */
{id:"ed4", n:"Digital Electronics IV", area:"digital", anio:7, h:120, ejes:[
  {t:"Microcontroller family", u:"otros-microcontroladores", d:"Architecture, connections, instruction set, control registers, flash/EEPROM memory, I/O and special resources (other microcontrollers).", tm:[["micro",3]]},
  {t:"Communication module", u:"buses-serie", d:"Synchronous serial. Synchronous/asynchronous serial USART.", tm:[["micro",3],["modul",2]]},
  {t:"Interrupts", u:"interrupciones", d:"Handling of microcontroller interrupts.", tm:[["micro",3]]},
  {t:"Control applications", u:"aplicaciones-control", d:"Temperature and lighting control, weighing and dosing, elevator control, automatic verification and test systems.", tm:[["micro",4],["control",3]]},
  {t:"Smart displays", u:"displays", d:"Applications with smart displays.", tm:[["micro",3]]},
  {t:"Applications with microcontrollers", u:"proyectos-microcontrolador", d:"Capstone projects with microcontrollers.", tm:[["micro",4],["control",3]]}
]},
{id:"ei2", n:"Industrial Electronics II", area:"industrial", anio:7, h:120, ejes:[
  {t:"Automation", u:"automatismo-plc", d:"Principle of an automatic system, technological options, process control. Programmable logic controllers (PLC): definition, history, applications, advantages.", tm:[["control",3]]},
  {t:"Structure of programmable logic controllers", u:"estructura-plc", d:"External/internal structure, memories, CPU, inputs/outputs, interfaces, peripherals.", tm:[["control",3]]},
  {t:"Command and signaling units", u:"mando-senalizacion", d:"Sensors and transducers, signal conditioners, actuators. Installation, programming, I/O wiring.", tm:[["sens",3],["control",3]]},
  {t:"PLC instructions and programming", u:"programacion-plc", d:"Languages: mnemonic/Boolean, ladder diagram, function block diagram, Grafcet, flowchart.", tm:[["control",4],["prog",3]]},
  {t:"Basic programming applications", u:"aplicaciones-plc", d:"I/O, flags, timers, counters, shift register, logic circuits, pulse generators.", tm:[["control",4]]},
  {t:"Pneumatics and hydraulics", u:"neumatica-hidraulica", d:"Compressors, pneumatic actuators, pneumatic signals, pneumatic logic, hydraulic cylinders, directional valves.", tm:[["control",3],["sens",2]]},
  {t:"Industrial communications", u:"comunicaciones-industriales", d:"Ethernet network, fieldbus, AS-i network.", tm:[["control",3],["modul",2]]},
  {t:"PID controllers", u:"control-pid", d:"PID controller tuning, analog PID programming, application-specific instruments.", tm:[["control",4]]}
]},
{id:"tc2", n:"Telecommunications II", area:"telecom", anio:7, h:120, ejes:[
  {t:"Basic mathematical concepts", u:"teorema-muestreo", d:"Sampling theorem.", tm:[["modul",3]]},
  {t:"Digital pulse-code modulation", u:"modulacion-digital", d:"Digital modulations ASK, PSK, FSK, QAM. Quantization.", tm:[["modul",3]]},
  {t:"Data communications", u:"comunicaciones-datos", d:"Digital radio link, data communication protocols, integrated services digital network (ISDN).", tm:[["modul",3]]},
  {t:"Analog and digital television", u:"television", d:"Camera tubes and receivers, LCD, plasma, closed circuit, encoded TV.", tm:[["modul",3]]},
  {t:"Antennas", u:"antenas", d:"Concept, characteristics, types and calculation of different types of antennas.", tm:[["antena",3]]},
  {t:"Equipment assembly and maintenance", u:"mantenimiento-telecomunicaciones", d:"Maintenance of components and equipment, safeguarding standards, health and safety.", tm:[["hys",2]]}
]},
{id:"pi", n:"Capstone Project", area:"proyecto", anio:7, h:144, ejes:[
  {t:"Specialty capstone project", u:"proyecto-integrador", d:"Synthesis of the specific curricular spaces. Computer-aided design (CAD, SolidWorks or similar). Integrates Mathematics, Physics, Legal Framework, Health and Safety, and Economics and Production.", tm:[["cad",4],["control",2],["micro",2]]}
]},
{id:"fat", n:"Workplace Training", area:"proyecto", anio:7, h:240, ejes:[
  {t:"Professional practice", u:"practica-profesionalizante", d:"Practice in real work situations: assembly, installation, operation and maintenance. Consolidates and integrates the capabilities of the professional profile.", tm:[["instal",4],["control",4],["hys",2]]}
]}
];
