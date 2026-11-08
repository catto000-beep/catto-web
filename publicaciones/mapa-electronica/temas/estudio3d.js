/* Maqueta 3D de un estudio de grabación (página «El estudio de grabación», Sonido 1.er año).
   Misma técnica que la vivienda (vivienda3d.js): three.js r128 y OrbitControls; se gira con el mouse o el dedo.
   Botones para ver cada recorrido de la señal (los demás equipos quedan tenues) y vistas oblicua / desde arriba.
   La distribución es ilustrativa y sin escala exacta; el triángulo de escucha se calcula con las posiciones
   reales de la cabeza del ingeniero y de los monitores (equilátero de 1,20 m de lado).
   EstudioTres(div, panel) → arma la escena en div y escribe la explicación del recorrido en panel.
   Coordenadas (metros): x de la sala de control a la de grabación, z hacia el frente, y hacia arriba. */
window.EstudioTres = function (div, panel) {
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2)); div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.85));
const sol = new THREE.DirectionalLight(0xffffff, 0.6); sol.position.set(-6, 14, 10); esc.add(sol);
const raiz = new THREE.Group(); raiz.position.set(-5.2, 0, -2.95); esc.add(raiz);   // el estudio centrado en el origen

// ---- ayudas: cada equipo es un «nodo» con su grupo y sus materiales, para atenuarlo cuando no está en el recorrido
const grp = {}, mats = {}, labs = {};
function G(id) {
  if (!id) return raiz;
  if (!grp[id]) { grp[id] = new THREE.Group(); raiz.add(grp[id]); mats[id] = []; labs[id] = []; }
  return grp[id];
}
function mt(id, c, o) { const m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, id ? { transparent: true } : {}, o || {})); if (id) { G(id); mats[id].push(m); } return m; }
function put(m, x, y, z, padre, id) { m.position.set(x, y, z); (padre || G(id)).add(m); return m; }
function box(id, w, h, d, c, x, y, z, padre, o) { return put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt(id, c, o)), x, y, z, padre, id); }
function cil(id, r, h, c, x, y, z, padre, eje, seg) {   // cilindro; eje: 'x' | 'z' | undefined (vertical)
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 14), mt(id, c));
  if (eje === 'x') m.rotation.z = Math.PI / 2; if (eje === 'z') m.rotation.x = Math.PI / 2;
  return put(m, x, y, z, padre, id);
}
function esf(id, r, c, x, y, z, padre) { return put(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mt(id, c)), x, y, z, padre, id); }
function sub(id, x, y, z, ry) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; G(id).add(g); return g; }
function rotulo(txt, x, y, z, escala, color, id, solo) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  let fs = 54; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif';
  while (c.measureText(txt).width > 480 && fs > 30) { fs -= 2; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif'; }
  c.textAlign = 'center'; c.lineWidth = 10;
  c.strokeStyle = 'rgba(13,17,23,.85)'; c.strokeText(txt, 256, 82); c.fillStyle = color || '#ffffff'; c.fillText(txt, 256, 82);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.scale.set(3.0 * (escala || 1), 0.75 * (escala || 1), 1); sp.position.set(x, y, z); sp.renderOrder = 10; raiz.add(sp);
  sp.userData.solo = solo || null; sp.userData.id = id || null; (todasEtq).push(sp); if (id) labs[id].push(sp);   // labs[id] existe si el nodo ya se creó
  return sp;
}
const todasEtq = [];

// ---- medidas (m)
const CUT = 1.3, ZD = 5.9;                       // altura a la que se cortan las paredes; profundidad del estudio
const XC0 = 1.4, XW0 = 4.6, XW1 = 5.0, XR1 = 9.0; // sala de control, pared doble (4,6 a 5,0), sala de grabación
const AIRE = 0.16;                               // cámara de aire de la pared doble
const PARED = 0xaeb8c4, TOPE = 0xd5dbe3;

// ---- pisos
box(null, 24, 0.2, 14, 0x232d39, 5.2, -0.12, 2.95);
box(null, XW0 - XC0, 0.06, ZD, 0x6a5844, (XC0 + XW0) / 2, 0.03, ZD / 2);
box(null, XR1 - XW1, 0.06, ZD, 0x46515d, (XW1 + XR1) / 2, 0.03, ZD / 2);
box(null, XW1 - XW0, 0.06, ZD, 0x39424d, (XW0 + XW1) / 2, 0.03, ZD / 2);

// ---- paredes cortadas a 1,5 m. pared(x0,x1,z0,z1,y0): del y0 al corte
function pared(x0, x1, z0, z1, y0) {
  const h = CUT - (y0 || 0);
  box(null, x1 - x0, h, z1 - z0, PARED, (x0 + x1) / 2, (y0 || 0) + h / 2, (z0 + z1) / 2);
  box(null, x1 - x0, 0.03, z1 - z0, TOPE, (x0 + x1) / 2, CUT + 0.015, (z0 + z1) / 2);
}
const E1 = 0.12;
pared(XC0 - E1, XC0, -E1, ZD + E1); pared(XC0, XR1, -E1, 0); pared(XC0, XR1, ZD, ZD + E1); pared(XR1, XR1 + E1, -E1, ZD + E1);
// pared doble: dos hojas (4,60–4,72 y 4,88–5,00) con 16 cm de aire. Tramos en z; la ventana, la puerta y el pasamuros dejan huecos.
const VENT = [2.1, 3.7], PUERTA = [0.15, 1.05], PASA = [4.65, 5.15];
for (const [a, b] of [[XW0, XW0 + (XW1 - XW0 - AIRE) / 2], [XW1 - (XW1 - XW0 - AIRE) / 2, XW1]]) {
  pared(a, b, 0, PUERTA[0]); pared(a, b, PUERTA[1], VENT[0]);
  pared(a, b, VENT[0], VENT[1], 0.5);                               // bajo la ventana
  pared(a, b, VENT[1], PASA[0]); pared(a, b, PASA[0], PASA[1], 0.25); pared(a, b, PASA[1], ZD);   // pasamuros: hueco de 25 cm al piso
  // vidrio de la ventana
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.025, CUT - 0.5, VENT[1] - VENT[0]), new THREE.MeshLambertMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.38, depthWrite: false }));
  g.position.set((a + b) / 2, (CUT + 0.5) / 2, (VENT[0] + VENT[1]) / 2); raiz.add(g);
  // hoja de puerta
  box(null, 0.05, CUT - 0.02, PUERTA[1] - PUERTA[0] - 0.04, 0x8a5a36, (a + b) / 2, (CUT - 0.02) / 2, (PUERTA[0] + PUERTA[1]) / 2);
  esf(null, 0.03, 0xe6edf3, (a + b) / 2 + (a < 4.7 ? 0.04 : -0.04), 1.0, PUERTA[1] - 0.1);
}
// ---- cabina de voces (booth), contra la pared doble, al sur de la sala de grabación: vidrios al norte y al este
const BO = { x1: 7.3, z0: 3.9 };
const vidrio = () => new THREE.MeshLambertMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.3, depthWrite: false });
put(new THREE.Mesh(new THREE.BoxGeometry(BO.x1 - XW1, CUT, 0.04), vidrio()), (XW1 + BO.x1) / 2, CUT / 2, BO.z0, raiz);
put(new THREE.Mesh(new THREE.BoxGeometry(0.04, CUT, ZD - BO.z0), vidrio()), BO.x1, CUT / 2, (BO.z0 + ZD) / 2, raiz);
for (const [w, d, x, z] of [[BO.x1 - XW1, 0.05, (XW1 + BO.x1) / 2, BO.z0], [0.05, ZD - BO.z0, BO.x1, (BO.z0 + ZD) / 2]]) box(null, w, 0.04, d, 0x58a6ff, x, CUT, z);
box(null, 0.7, CUT, 0.06, 0x8a5a36, 6.55, CUT / 2, BO.z0);                        // puerta de la cabina (vidrio en marco)
box(null, BO.x1 - XW1, 0.02, ZD - BO.z0, 0x2e3945, (XW1 + BO.x1) / 2, 0.07, (BO.z0 + ZD) / 2);   // alfombra de la cabina

// ---- sala de control: escritorio, consola/interfaz, computadora, monitores, ingeniero, rack
const S = 1.2, MX = 3.95, EZ = 2.9;                                                  // lado del triángulo; x de los monitores; z del eje
const EJE = new THREE.Vector3(MX - S * Math.sqrt(3) / 2, 1.2, EZ);                   // cabeza del ingeniero (oídos a 1,20 m)
const ML = new THREE.Vector3(MX, 1.2, EZ - S / 2), MR = new THREE.Vector3(MX, 1.2, EZ + S / 2);   // tweeters
const ladoLR = ML.distanceTo(MR), ladoL = EJE.distanceTo(ML), ladoR = EJE.distanceTo(MR);
const angE = Math.round(Math.acos(((ladoL ** 2) + (ladoR ** 2) - (ladoLR ** 2)) / (2 * ladoL * ladoR)) * 180 / Math.PI);
// escritorio
box(null, 1.0, 0.04, 2.4, 0x6e5a45, 3.8, 0.73, 2.9);
box(null, 0.9, 0.7, 0.04, 0x5a4938, 3.8, 0.36, 1.72); box(null, 0.9, 0.7, 0.04, 0x5a4938, 3.8, 0.36, 4.08);
// interfaz / consola con mezclador
box('int', 0.4, 0.1, 0.6, 0x2a3140, 3.7, 0.80, 2.9);
for (let i = 0; i < 4; i++) { cil('int', 0.022, 0.02, 0xd5dbe3, 3.6, 0.86, 2.68 + i * 0.12); cil('int', 0.022, 0.02, 0x58a6ff, 3.78, 0.86, 2.68 + i * 0.12); }
box('int', 0.12, 0.012, 0.5, 0x0d1117, 3.7, 0.855, 2.9);
// computadora: pantalla sobre el escritorio y gabinete debajo
box('pc', 0.04, 0.34, 0.56, 0x1b2230, 4.1, 1.05, 2.9); box('pc', 0.05, 0.2, 0.05, 0x1b2230, 4.15, 0.86, 2.9); box('pc', 0.14, 0.02, 0.3, 0x1b2230, 4.17, 0.77, 2.9);
box('pc', 0.2, 0.45, 0.45, 0x3a4350, 4.0, 0.26, 3.8); box('pc', 0.01, 0.04, 0.2, 0x58a6ff, 3.895, 0.42, 3.8);
(function () {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#0d1117'; c.fillRect(0, 0, 256, 128);
  const col = ['#58a6ff', '#3fb950', '#d29922', '#a371f7']; for (let i = 0; i < 4; i++) { c.fillStyle = '#161d27'; c.fillRect(8, 10 + i * 28, 240, 22);
    c.strokeStyle = col[i]; c.lineWidth = 2; c.beginPath(); for (let x = 10; x < 246; x += 2) { const a = 7 * Math.sin(x * (0.09 + i * 0.03)) * Math.sin(x * 0.02 + i); c.lineTo(x, 21 + i * 28 + a); } c.stroke(); }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.29), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
  p.rotation.y = -Math.PI / 2; mats.pc.push(p.material); put(p, 4.077, 1.05, 2.9, null, 'pc');
})();
// monitores de campo cercano, apuntando a la cabeza
function monitor(id, M) {
  const g = sub(id, M.x, 1.11, M.z, Math.atan2(EJE.x - M.x, EJE.z - M.z));
  box(id, 0.2, 0.32, 0.24, 0x1b2230, 0, 0, 0, g); cil(id, 0.075, 0.02, 0x3a4350, 0, -0.05, 0.125, g, 'z', 20); cil(id, 0.022, 0.02, 0x9aa7b5, 0, 0.09, 0.125, g, 'z', 14);
  box(id, 0.07, 0.22, 0.07, 0x1b2230, 0, -0.27, 0, g);                                // pie sobre el escritorio
}
monitor('monL', ML); monitor('monR', MR);
// auriculares de la sala de control (colgados sobre el escritorio) y micrófono del talkback con su pulsador
cil('hpc', 0.05, 0.03, 0x161b22, 3.4, 0.80, 1.93, null, 'x'); cil('hpc', 0.05, 0.03, 0x161b22, 3.4, 0.80, 2.13, null, 'x');
box('hpc', 0.03, 0.03, 0.22, 0x161b22, 3.4, 0.86, 2.03);
cil('tb', 0.022, 0.2, 0x2a3140, 3.65, 0.87, 3.9); esf('tb', 0.035, 0xe3c341, 3.65, 0.99, 3.9); cil('tb', 0.12, 0.02, 0x2a3140, 3.65, 0.775, 3.9, null, undefined, 20);
box('tb', 0.07, 0.025, 0.05, 0xf85149, 3.5, 0.79, 3.78);                              // pulsador
// ingeniero (esquemático, sentado) en su silla
box(null, 0.5, 0.05, 0.5, 0x2a3140, EJE.x - 0.02, 0.47, EZ); box(null, 0.06, 0.5, 0.5, 0x2a3140, EJE.x - 0.26, 0.74, EZ); cil(null, 0.03, 0.45, 0x3a4350, EJE.x - 0.02, 0.25, EZ); cil(null, 0.28, 0.03, 0x2a3140, EJE.x - 0.02, 0.03, EZ);
{
  const g = sub('eng', EJE.x - 0.02, 0, EZ, Math.PI / 2);
  box('eng', 0.42, 0.52, 0.22, 0x4a6fa5, 0, 0.8, 0, g); esf('eng', 0.115, 0xe0b894, 0.02, 1.2, 0, g);
  box('eng', 0.34, 0.12, 0.2, 0x2f3b4d, 0, 0.55, 0.12, g);
  box('eng', 0.13, 0.12, 0.42, 0x2f3b4d, -0.1, 0.55, 0.3, g); box('eng', 0.13, 0.12, 0.42, 0x2f3b4d, 0.1, 0.55, 0.3, g);
  box('eng', 0.11, 0.5, 0.11, 0x2f3b4d, -0.1, 0.27, 0.48, g); box('eng', 0.11, 0.5, 0.11, 0x2f3b4d, 0.1, 0.27, 0.48, g);
  box('eng', 0.07, 0.07, 0.5, 0x4a6fa5, -0.23, 0.93, 0.28, g); box('eng', 0.07, 0.07, 0.5, 0x4a6fa5, 0.23, 0.93, 0.28, g);
}
// rack con la patchera (ámbar) y el preamplificador (azul)
box(null, 0.7, 1.3, 0.7, 0x161b22, 3.65, 0.65, 0.9);
box(null, 0.62, 0.12, 0.03, 0xd29922, 3.65, 1.15, 1.26); box(null, 0.62, 0.12, 0.03, 0x2a3140, 3.65, 0.75, 1.26); box(null, 0.62, 0.12, 0.03, 0x2a3140, 3.65, 0.55, 1.26);
for (let i = 0; i < 8; i++) cil(null, 0.014, 0.01, 0x0d1117, 3.4 + i * 0.07, 1.15, 1.285, null, 'z', 8);
box('pre', 0.62, 0.12, 0.03, 0x1f6feb, 3.65, 0.95, 1.26);
for (let i = 0; i < 4; i++) cil('pre', 0.02, 0.02, 0xe6edf3, 3.45 + i * 0.1, 0.95, 1.285, null, 'z', 10);
// ---- sala de grabación: cabina con músico, micrófono y caja de pared; amplificador y batería de contexto
box('caja', 0.06, 0.26, 0.2, 0xd29922, XW1 + 0.03, 0.35, 4.9);
for (let i = 0; i < 4; i++) cil('caja', 0.022, 0.02, 0x161b22, XW1 + 0.07, 0.35 + (i < 2 ? 0.05 : -0.05), 4.9 + (i % 2 ? 0.05 : -0.05), null, 'x', 10);
// micrófono con pie
cil('mic', 0.17, 0.03, 0x2a3140, 5.75, 0.02, 4.9, null, undefined, 20); cil('mic', 0.012, 1.38, 0x2a3140, 5.75, 0.72, 4.9);
cil('mic', 0.032, 0.17, 0x9aa7b5, 5.75, 1.48, 4.9); esf('mic', 0.035, 0xc8d2dd, 5.75, 1.57, 4.9);
cil('mic', 0.1, 0.006, 0x161b22, 5.99, 1.5, 4.9, null, 'x', 20);                    // antipop
// músico (de pie, mirando al micrófono) con auriculares
{
  const g = sub('sing', 6.35, 0, 4.9, -Math.PI / 2);
  box('sing', 0.11, 0.8, 0.12, 0x2f3b4d, -0.09, 0.4, 0, g); box('sing', 0.11, 0.8, 0.12, 0x2f3b4d, 0.09, 0.4, 0, g);
  box('sing', 0.4, 0.62, 0.22, 0xb5533c, 0, 1.1, 0, g); esf('sing', 0.11, 0xe0b894, 0, 1.62, 0, g);
  box('sing', 0.07, 0.45, 0.07, 0xb5533c, -0.24, 1.1, 0, g); box('sing', 0.07, 0.45, 0.07, 0xb5533c, 0.24, 1.1, 0, g);
}
{
  const g = sub('hps', 6.35, 1.62, 4.9, -Math.PI / 2);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.012, 8, 24, Math.PI), mt('hps', 0x161b22)); g.add(band);
  cil('hps', 0.05, 0.035, 0x161b22, -0.128, 0, 0, g, 'x', 16); cil('hps', 0.05, 0.035, 0x161b22, 0.128, 0, 0, g, 'x', 16);
}
// amplificador y batería (contexto, sin cables)
box(null, 0.6, 0.6, 0.3, 0x3a4350, 7.9, 0.33, 0.5); cil(null, 0.17, 0.02, 0x161b22, 7.9, 0.36, 0.66, null, 'z', 20);
cil(null, 0.26, 0.4, 0x8a5a36, 8.1, 0.28, 2.9, null, 'z', 22); cil(null, 0.16, 0.12, 0xc8d2dd, 7.8, 0.7, 2.5); cil(null, 0.15, 0.12, 0xc8d2dd, 8.4, 0.7, 2.5);
cil(null, 0.2, 0.012, 0xd29922, 7.6, 0.95, 2.2); cil(null, 0.2, 0.012, 0xd29922, 8.6, 0.95, 2.2);

// ---- cables. Cada uno es una poligonal; «usos» dice en qué recorridos participa (con su color) y en qué sentido.
const RUTAS = [
  { clave: 'todo', color: '#e6edf3', nom: 'Todo' },
  { clave: 'voz', color: '#58a6ff', nom: 'Voz' },
  { clave: 'mon', color: '#3fb950', nom: 'Monitoreo' },
  { clave: 'ret', color: '#d29922', nom: 'Retorno al músico' },
  { clave: 'tb', color: '#a371f7', nom: 'Talkback' },
];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAB = [];
function cable(pts, usos) { CAB.push({ pts: pts.map(p => V(...p)), usos, base: new THREE.Group(), glow: {}, pulsos: [], activo: null }); }
const ZS = 4.9, ZT = 4.75, ZR = 5.05;                          // pasamuros: multipar, talkback, retorno
cable([[5.75, 1.38, 4.9], [5.72, 0.8, 4.9], [5.72, 0.06, 4.9], [5.72, 0.06, 4.6], [5.3, 0.06, 4.6], [5.3, 0.33, 4.6], [5.1, 0.33, 4.88]], { voz: 1 });   // micrófono → caja de pared
cable([[5.06, 0.25, ZS], [4.95, 0.1, ZS], [4.5, 0.1, ZS], [2.3, 0.1, ZS], [2.3, 0.1, 1.45], [3.45, 0.1, 1.45], [3.45, 0.95, 1.45], [3.45, 0.95, 1.28]], { voz: 1 });   // multipar → preamplificador
cable([[3.85, 0.95, 1.28], [3.85, 0.95, 1.5], [3.85, 0.79, 1.65], [3.7, 0.79, 1.65], [3.7, 0.79, 2.6]], { voz: 1 });   // preamplificador → interfaz
cable([[3.6, 0.8, 3.2], [3.6, 0.79, 3.8], [4.0, 0.79, 3.8], [4.0, 0.49, 3.8]], { voz: 1, mon: -1 });                  // interfaz ↔ computadora
cable([[3.7, 0.8, 2.6], [3.75, 0.79, 2.3], [3.95, 0.79, 2.3]], { mon: 1 });                                         // interfaz → monitor izquierdo
cable([[3.8, 0.8, 3.2], [3.8, 0.79, 3.5], [3.95, 0.79, 3.5]], { mon: 1 });                                          // interfaz → monitor derecho
cable([[3.55, 0.8, 2.6], [3.45, 0.79, 2.3], [3.4, 0.79, 2.13]], { mon: 1 });                                        // interfaz → auriculares de la control
cable([[3.5, 0.82, 3.15], [3.5, 0.79, 3.3], [3.5, 0.79, 4.25], [3.5, 0.16, 4.3], [3.5, 0.16, ZR], [5.12, 0.16, ZR], [6.75, 0.16, ZR], [6.75, 1.0, ZR], [6.4, 1.45, 5.03], [6.35, 1.6, 5.03]], { ret: 1 });   // retorno
cable([[3.65, 1.0, 3.9], [3.65, 0.79, 3.9], [3.65, 0.79, 4.25], [3.65, 0.13, 4.3], [3.65, 0.13, ZT], [5.12, 0.13, ZT], [6.8, 0.13, ZT], [6.8, 1.0, ZT], [6.4, 1.45, 4.78], [6.35, 1.6, 4.78]], { tb: 1 });   // talkback
const cg = new THREE.MeshLambertMaterial({ color: 0x56606c });
function malla(a, b, r, m, padre) {
  const v = new THREE.Vector3().subVectors(b, a), l = v.length(); if (l < 1e-5) return;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 8), m);
  c.position.copy(a).addScaledVector(v, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); padre.add(c);
}
for (const c of CAB) {
  raiz.add(c.base);
  c.base.visible = true;
  c.matBase = new THREE.MeshLambertMaterial({ color: 0x56606c, transparent: true, opacity: 1 });
  for (let i = 0; i < c.pts.length - 1; i++) malla(c.pts[i], c.pts[i + 1], 0.016, c.matBase, c.base);
  for (const p of c.pts) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), c.matBase); s.position.copy(p); c.base.add(s); }
  c.largos = [0]; for (let i = 0; i < c.pts.length - 1; i++) c.largos.push(c.largos[i] + c.pts[i].distanceTo(c.pts[i + 1]));
  c.L = c.largos[c.largos.length - 1];
  for (const k of Object.keys(c.usos)) {
    const col = new THREE.Color(RUTAS.find(r => r.clave === k).color), g = new THREE.Group(); g.visible = false; raiz.add(g); c.glow[k] = g;
    const m = new THREE.MeshBasicMaterial({ color: col });
    for (let i = 0; i < c.pts.length - 1; i++) malla(c.pts[i], c.pts[i + 1], 0.034, m, g);
    for (const p of c.pts) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), m); s.position.copy(p); g.add(s); }
    const pl = [];
    for (let j = 0; j < 3; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })); s.visible = false; raiz.add(s); pl.push(s); }
    c.pulsos.push({ k, pl });
  }
}
function posEn(c, d) {   // punto de la poligonal a la distancia d desde su inicio
  d = Math.max(0, Math.min(c.L, d)); let i = 0; while (i < c.largos.length - 2 && c.largos[i + 1] < d) i++;
  const t = (d - c.largos[i]) / ((c.largos[i + 1] - c.largos[i]) || 1); return c.pts[i].clone().lerp(c.pts[i + 1], t);
}

// ---- triángulo de escucha (cabeza del ingeniero y los dos monitores), con sus lados calculados
const tri = new THREE.Group(); raiz.add(tri);
function trazos(a, b, col) {
  const l = a.distanceTo(b), n = Math.round(l / 0.08), v = new THREE.Vector3().subVectors(b, a);
  for (let i = 0; i < n; i += 2) {
    const p = a.clone().addScaledVector(v, (i + 0.5) / n), q = a.clone().addScaledVector(v, Math.min(i + 1.5, n) / n);
    malla(p, q, 0.011, new THREE.MeshBasicMaterial({ color: col }), tri);
  }
}
const COLTRI = 0x58a6ff;
trazos(EJE, ML, COLTRI); trazos(EJE, MR, COLTRI); trazos(ML, MR, COLTRI);
const fmt = x => x.toFixed(2).replace('.', ',');
for (const [a, b] of [[EJE, ML], [EJE, MR], [ML, MR]]) { const m = a.clone().add(b).multiplyScalar(0.5); m.y += 0.0; const r = rotulo(fmt(a.distanceTo(b)) + ' m', m.x + (b === MR && a === ML ? 0.3 : -0.1), m.y + 0.12, m.z, 0.38, '#58a6ff', null, ['mon']); raiz.remove(r); tri.add(r); }
{ const r = rotulo(angE + '°', EJE.x + 0.45, 1.2, EZ, 0.4, '#58a6ff', null, ['mon']); raiz.remove(r); tri.add(r); }

// ---- rótulos. solo = en qué recorridos se ven (sin lista: siempre)
const T = 'todo', VZ = 'voz', MO = 'mon', RE = 'ret', TB = 'tb';
const SIN_MON = [T, VZ, RE, TB];
rotulo('SALA DE CONTROL', 3.0, 1.7, 5.5, 0.7, '#e6edf3', null, SIN_MON);
rotulo('SALA DE GRABACIÓN', 7.9, 1.5, 5.6, 0.7, '#e6edf3', null, SIN_MON);
rotulo('ventana doble', 5.9, 1.7, 2.9, 0.6, '#9ad0ff', null, SIN_MON);
rotulo('puertas dobles', 4.8, 1.95, 0.6, 0.6, '#e8883a', null, SIN_MON);
rotulo('cabina de voces', 6.15, 1.95, 3.9, 0.6, '#e6edf3', null, SIN_MON);
rotulo('amplificador', 7.9, 1.0, 0.5, 0.5, '#7d8a99', null, [T]); rotulo('batería', 8.1, 1.3, 3.0, 0.5, '#7d8a99', null, [T]);
rotulo('micrófono', 5.75, 1.95, 4.9, 0.55, '#58a6ff', 'mic', [T, VZ]); rotulo('caja de pared', 5.2, 0.8, 4.3, 0.55, '#d29922', 'caja', [VZ, RE, TB]);
rotulo('músico', 6.9, 1.95, 5.2, 0.5, '#e6edf3', 'sing', [T, RE, TB]); rotulo('auriculares', 6.8, 2.0, 4.6, 0.5, '#d29922', 'hps', [RE, TB]);
rotulo('rack: patchera y preamp.', 3.65, 1.7, 0.7, 0.7, '#d29922', 'pre', [T, VZ]);
rotulo('consola / interfaz', 3.0, 0.95, 4.4, 0.42, '#e6edf3', 'int', [T, VZ, MO, RE]); rotulo('computadora (DAW)', 4.5, 0.95, 4.55, 0.42, '#e6edf3', 'pc', [VZ, MO]);
rotulo('monitor', 4.3, 1.65, 1.95, 0.42, '#3fb950', 'monL', [MO]); rotulo('monitor', 4.3, 1.65, 3.85, 0.42, '#3fb950', 'monR', [MO]);
rotulo('ingeniero', EJE.x - 0.5, 1.75, EZ, 0.42, '#e6edf3', 'eng', [T, MO]);
rotulo('auriculares', 3.0, 0.95, 1.5, 0.38, '#3fb950', 'hpc', [MO]); rotulo('micrófono de talkback', 3.2, 1.2, 4.55, 0.42, '#a371f7', 'tb', [TB]);
rotulo('multipar (snake)', 1.95, 0.5, 3.4, 0.55, '#58a6ff', null, [VZ, T]);

// ---- textos de cada recorrido
const TX = [
  ['Estudio completo · distribución ilustrativa', ['Sala de control a la izquierda y sala de grabación a la derecha, separadas por una pared doble: dos hojas con ' + Math.round(AIRE * 100) + ' cm de aire, una ventana de dos vidrios y puertas dobles.',
    'La cabina de voces aísla la fuente; la caja de pared y el multipar (snake) llevan las señales a la control.',
    'Elegí un recorrido para ver cómo viaja la señal.']],
  ['Voz · de la cabina a la computadora', ['Micrófono → caja de pared → multipar (snake) → preamplificador → interfaz → computadora.',
    'El micrófono entrega una señal muy pequeña: el preamplificador, en el rack, la lleva a un nivel de trabajo; la interfaz la convierte en números para el DAW.',
    'El multipar cruza la pared doble por un pasamuros, sin abrir agujeros sueltos.']],
  ['Monitoreo · de la computadora a los parlantes', ['Computadora → interfaz → monitores de campo cercano y auriculares de la sala de control.',
    'El ingeniero y los dos monitores forman un triángulo equilátero: lados de ' + fmt(ladoLR) + ' m (' + fmt(ladoL) + ' y ' + fmt(ladoR) + ' m a la cabeza) y ángulos de ' + angE + '°.',
    'Los monitores se ubican en simetría con el oyente y apuntan hacia él.']],
  ['Retorno al músico · la mezcla de auriculares', ['La interfaz arma una mezcla de auriculares y la envía, por el multipar y la caja de pared, a los auriculares del músico.',
    'Así se oye a sí mismo y al resto sin parlantes en la sala; cerrados, los auriculares filtran poco hacia los micrófonos.']],
  ['Talkback · la voz del ingeniero', ['Un micrófono de la sala de control, que se activa con un pulsador, lleva las indicaciones a los auriculares del músico.',
    'Se da una indicación sin salir de la sala de control ni abrir las puertas.']],
];
const MOSTRAR = { todo: null, voz: ['mic', 'caja', 'pre', 'int', 'pc'], mon: ['pc', 'int', 'monL', 'monR', 'hpc', 'eng'], ret: ['int', 'caja', 'hps', 'sing'], tb: ['tb', 'int', 'caja', 'hps', 'sing'] };

// ---- cámara, controles y botones
const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.maxPolarAngle = Math.PI / 2.05; ctl.enableDamping = true;
ctl.minDistance = 3; ctl.maxDistance = 36; ctl.target.set(0, 0.3, 0);
const VISTAS = { iso: [[-0.6, 8.2, 6.8], [0, 0, 0.3]], arriba: [[0, 11.4, 1.0], [0, 0, 0.1]] };
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
const nombres = { iso: 'Oblicua', arriba: 'Desde arriba' };
let vistaAct = 'iso', tw = null, baseT = null, baseD = 1, baseDir = null, focoDir = false;
const FOCO = { mon: { t: [-1.8, 0.8, 0.0], d: 5.4, dir: [-0.5, 0.85, 0.5] }, ret: { t: [0.1, 0.5, 1.0], z: 0.8 }, tb: { t: [0.1, 0.5, 1.0], z: 0.8 } };   // al elegir un recorrido, la cámara se acerca a lo que importa
function vista(v) {
  vistaAct = v; const f = Math.max(1, 1.25 / (cam.aspect || 2)), t = V(...VISTAS[v][1]), p = V(...VISTAS[v][0]);
  p.sub(t).multiplyScalar(f).add(t); cam.position.copy(p); ctl.target.copy(t); ctl.update(); baseT = t.clone(); baseD = p.distanceTo(t); baseDir = p.clone().sub(t).normalize(); focoDir = false; tw = null;
  [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === v));
}
Object.keys(VISTAS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = nombres[v]; b.onclick = () => vista(v); bar.appendChild(b); });
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
let rutaAct = 0;
function estado(k) {
  rutaAct = k; const r = RUTAS[k], lista = MOSTRAR[r.clave];
  for (const id of Object.keys(grp)) { const op = (!lista || lista.indexOf(id) >= 0) ? 1 : 0.22; mats[id].forEach(m => { m.opacity = op; m.depthWrite = op === 1; }); labs[id].forEach(s => { s.material.opacity = op === 1 ? 1 : 0.2; }); }
  for (const c of CAB) {
    c.activo = null;
    for (const p of c.pulsos) { c.glow[p.k].visible = false; p.pl.forEach(s => s.visible = false); }
    const usos = Object.keys(c.usos), cual = r.clave === 'todo' ? usos[0] : (c.usos[r.clave] ? r.clave : null);
    if (cual) { c.activo = cual; c.glow[cual].visible = true; c.base.visible = false; } else { c.base.visible = true; c.matBase.opacity = r.clave === 'todo' ? 1 : 0.2; }
  }
  { const fo = FOCO[r.clave], t = fo ? V(...fo.t) : baseT.clone(), d = fo && fo.d ? fo.d : baseD * (fo ? fo.z : 1), dir = fo && fo.dir ? V(...fo.dir).normalize() : (focoDir ? baseDir.clone() : cam.position.clone().sub(ctl.target).normalize());
    focoDir = !!(fo && fo.dir);
    tw = { t0: performance.now(), dur: 800, p0: cam.position.clone(), t_0: ctl.target.clone(), p1: t.clone().addScaledVector(dir, d), t1: t }; }
  tri.visible = r.clave === 'todo' || r.clave === 'mon';
  todasEtq.forEach(sp => { const so = sp.userData.solo; sp.visible = !so || so.indexOf(r.clave) >= 0; });
  [].forEach.call(barc.children, (b, i) => b.classList.toggle('on', i === k));
  if (panel) panel.innerHTML = '<b style="color:' + r.color + '">' + TX[k][0] + '</b>' + TX[k][1].map(l => '<span>' + l + '</span>').join('');
}
const cortas = ['Todo', 'Voz', 'Monitoreo', 'Retorno', 'Talkback'];
RUTAS.forEach((r, i) => { const b = document.createElement('button'); b.type = 'button'; b.style.borderColor = r.color; b.onclick = () => estado(i); barc.appendChild(b); });
function textosBotones() { const c = div.clientWidth < 560; [].forEach.call(barc.children, (b, i) => { b.textContent = c ? cortas[i] : RUTAS[i].nom; }); }
function medir() { const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); textosBotones(); }
medir(); vista('iso'); estado(0);
if (window.ResizeObserver) new ResizeObserver(() => { const a = cam.aspect; medir(); if (Math.abs(cam.aspect - a) > 0.3) vista(vistaAct); }).observe(div);
// se dibuja solo mientras está a la vista
let visible = true;
if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(div);
const VEL = 2.6;   // m/s del pulso
(function cuadro() {
  requestAnimationFrame(cuadro); if (!visible) return;
  const t = performance.now() / 1000;
  for (const c of CAB) {
    if (!c.activo) continue;
    const sentido = c.usos[c.activo], pl = c.pulsos.find(p => p.k === c.activo).pl, ciclo = c.L + 0.8;
    pl.forEach((s, j) => { const d = ((t * VEL + j * ciclo / pl.length) % ciclo); s.visible = d <= c.L; s.position.copy(posEn(c, sentido < 0 ? c.L - d : d)); });
  }
  if (tw) { const k = Math.min(1, (performance.now() - tw.t0) / tw.dur), e = k * k * (3 - 2 * k); cam.position.lerpVectors(tw.p0, tw.p1, e); ctl.target.lerpVectors(tw.t_0, tw.t1, e); if (k >= 1) tw = null; }
  ctl.update(); ren.render(esc, cam);
})();
return { vista, estado, ruta: estado };
};
