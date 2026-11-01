/* Maqueta 3D de la vivienda modelo del ERSeP (página «El Certificado de Instalación Eléctrica Apta»).
   Misma técnica que el cruce del semáforo (publicaciones/semaforo-logico/cruce3d.js): three.js r128 y
   OrbitControls; se gira con el mouse o el dedo. Botones para ver cada circuito (los otros quedan tenues)
   y para la vista oblicua o desde arriba. La distribución de ambientes y bocas es ilustrativa; los
   circuitos, cargas y protecciones son los de la carpeta modelo.
   ViviendaTres(div, panel) → arma la escena en div y escribe la explicación del circuito en panel.
   Coordenadas: x a lo largo de la casa, z hacia el frente, y hacia arriba (metros). */
window.ViviendaTres = function (div, panel) {
const EN = /^en/i.test(document.documentElement.lang || '');
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
ren.shadowMap.enabled = true; div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.8));
const sol = new THREE.DirectionalLight(0xffffff, 0.65); sol.position.set(-6, 14, 10); sol.castShadow = true;
sol.shadow.camera.left = sol.shadow.camera.bottom = -12; sol.shadow.camera.right = sol.shadow.camera.top = 12; sol.shadow.mapSize.set(1024, 1024); esc.add(sol);
const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
function caja(w, h, d, mat, x, y, z, padre) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.isMaterial ? mat : M(mat));
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (padre || esc).add(m); return m;
}
const ALTO = 1.25, E = 0.12, LOSA = 2.45, PISO_C = 0.07;
const raiz = new THREE.Group(); raiz.position.set(-4.8, 0, -4); esc.add(raiz);   // la casa centrada en el origen

// ---- terreno y pisos de cada ambiente
caja(16, 0.2, 16, 0x3d4a35, 4.8, -0.12, 5, raiz);
const PISOS = [
  ['Living', 'Living room', 0, 3.2, 5, 8, 0xcdb48f], ['Comedor', 'Dining room', 3.2, 6.4, 5, 8, 0xc9b08a],
  ['Cocina', 'Kitchen', 6.4, 9.6, 5.4, 8, 0xb9c4c9], ['Dormitorio 1', 'Bedroom 1', 0, 3.2, 1.8, 5, 0xc7ad86],
  ['Patio', 'Patio', 0, 3.2, 0, 1.8, 0x7f9a6e], ['Pasillo', 'Hallway', 3.2, 6.4, 3, 5, 0xc2a984],
  ['Dormitorio 2', 'Bedroom 2', 3.2, 6.4, 0, 3, 0xc7ad86], ['Baño', 'Bathroom', 6.4, 9.6, 3.8, 5.4, 0xb6c6cf],
  ['Hab. de servicio', 'Utility room', 6.4, 9.6, 0, 3.8, 0xc4ab85],
];
function rotulo(txt, x, y, z, escala, color) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  c.font = 'bold 54px Segoe UI, system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 10;
  c.strokeStyle = 'rgba(13,17,23,.85)'; c.strokeText(txt, 256, 82); c.fillStyle = color || '#ffffff'; c.fillText(txt, 256, 82);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.scale.set(2.4 * (escala || 1), 0.6 * (escala || 1), 1); sp.position.set(x, y, z); sp.renderOrder = 10; raiz.add(sp); return sp;
}
for (const [es, en, x0, x1, z0, z1, col] of PISOS) {
  caja(x1 - x0, 0.04, z1 - z0, col, (x0 + x1) / 2, 0.02, (z0 + z1) / 2, raiz);
  rotulo(EN ? en : es, (x0 + x1) / 2, 0.35, (z0 + z1) / 2, 0.75);
}
// ---- paredes cortadas a 1,25 m (maqueta): [x0, x1, z0, z1]
const PARED = M(0xece6da);
const PAREDES = [
  [0, 9.6, -E, 0], [-E, 0, -E, 8 + E], [0, 9.6, 8, 8 + E], [9.6, 9.6 + E, -E, 8 + E],
  [3.2, 3.2 + E, 0, 8], [6.4, 6.4 + E, 0, 8], [0, 3.2, 5 - E, 5], [0, 3.2, 1.8 - E, 1.8],
  [3.2, 6.4, 5 - E, 5], [3.2, 6.4, 3 - E, 3], [6.4, 9.6, 5.4 - E, 5.4], [6.4, 9.6, 3.8 - E, 3.8],
];
for (const [x0, x1, z0, z1] of PAREDES) caja(x1 - x0, ALTO, z1 - z0, PARED, (x0 + x1) / 2, ALTO / 2, (z0 + z1) / 2, raiz);
// puerta de calle (hueco marcado) y TPU en la pared izquierda del living
caja(0.9, 0.05, 0.14, 0x6b5643, 1.6, ALTO + 0.03, 8 + E / 2, raiz);
// TPU: gabinete sobre la pared, con marco azul para que se distinga de la pared blanca
const TPU = { x: 0.02, y: 1.05, z: 6.4 };
caja(0.05, 0.86, 0.74, new THREE.MeshBasicMaterial({ color: 0x1f6feb }), TPU.x + 0.025, TPU.y, TPU.z, raiz);
caja(0.18, 0.78, 0.66, 0xd9dde2, TPU.x + 0.09, TPU.y, TPU.z, raiz);
caja(0.02, 0.5, 0.5, 0x2a3140, TPU.x + 0.19, TPU.y + 0.02, TPU.z, raiz);              // carátula con los aparatos
for (let i = 0; i < 4; i++) caja(0.03, 0.16, 0.08, i ? 0xf4f4f2 : 0x9ec5e8, TPU.x + 0.2, TPU.y + 0.08, TPU.z - 0.18 + i * 0.12, raiz);
rotulo('TPU', TPU.x + 0.3, TPU.y + 0.75, TPU.z, 0.9, '#58a6ff');

// ---- pilar en la línea municipal (afuera, frente al living) con el medidor y el TPA, y la línea principal
// enterrada hasta el TPU (2×6 mm², PIA de 32 A en el TPA). No se atenúa al elegir un circuito.
const LM = 10.4;                                                                     // línea municipal
caja(16, 0.02, 0.05, new THREE.MeshBasicMaterial({ color: 0xdfe5ec }), 4.8, 0.02, LM, raiz);
caja(16, 0.03, 0.6, 0x8a9099, 4.8, 0.0, LM + 0.6, raiz);                               // vereda
const PIL = { x: 1.2, z: LM - 0.25 };
caja(0.75, 1.9, 0.45, 0x9a5b45, PIL.x, 0.95, PIL.z, raiz);                            // pilar de ladrillo
caja(0.5, 0.45, 0.04, 0xe6edf3, PIL.x, 1.35, PIL.z + 0.24, raiz);                     // caja del medidor
caja(0.26, 0.16, 0.02, 0x0d1117, PIL.x, 1.4, PIL.z + 0.27, raiz);                     // visor
caja(0.42, 0.32, 0.04, 0xd7dde4, PIL.x, 0.72, PIL.z + 0.24, raiz);                    // TPA
caja(0.08, 1.1, 0.08, 0xb9c2cc, PIL.x, 2.45, PIL.z, raiz);                            // caño de acometida
rotulo(EN ? 'Pillar: meter and TPA' : 'Pilar: medidor y TPA', PIL.x, 2.9, PIL.z + 0.2, 0.75, '#e6edf3');
const LP = new THREE.MeshLambertMaterial({ color: 0x5d6470 });
const PRIN = [[PIL.x, 0.5, PIL.z - 0.23], [PIL.x, -0.05, PIL.z - 0.23], [0.3, -0.05, PIL.z - 0.23], [0.3, -0.05, TPU.z + 0.25],
              [0.14, -0.05, TPU.z + 0.25], [0.14, TPU.y - 0.3, TPU.z + 0.25]];
for (let i = 0; i < PRIN.length - 1; i++) {
  const a = new THREE.Vector3(...PRIN[i]), b = new THREE.Vector3(...PRIN[i + 1]), v = new THREE.Vector3().subVectors(b, a), l = v.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, l, 8), LP);
  m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); raiz.add(m);
}
rotulo(EN ? 'main line 2×6 mm²' : 'línea principal 2×6 mm²', 2.4, 0.3, 9.45, 0.6, '#c8d2dd');

// ---- circuitos y bocas. Tomas a 0,40 m y llaves a 1,10 m; luces de techo a 2,25 m.
// pared: 'x' = plano x = cte que mira a +x; 'z' = plano z = cte que mira a +z
const COLC = { 1: 0xe8883a, 2: 0xe3c341, 3: 0x58a6ff, 4: 0xa371f7 };
const BOCAS = [
  ['luz', 1.6, 6.5, 2], ['luz', 4.8, 6.5, 2], ['luz', 1.6, 3.4, 2], ['luz', 4.8, 1.5, 2], ['luz', 4.8, 4.0, 2],
  ['luz', 8.0, 1.9, 2], ['luz', 8.0, 4.6, 2], ['luz', 1.6, 0.9, 2], ['llave', 0, 7.6, 2, 'x'], ['llave', 3.2 + E, 5.6, 2, 'x'],
  ['luz', 8.0, 6.7, 1], ['toma', 7.4, 5.4, 1, 'z'], ['toma', 8.8, 5.4, 1, 'z'],
  ['toma', 0, 7.2, 3, 'x'], ['toma', 0, 5.6, 3, 'x'], ['toma', 4.2, 5.0, 3, 'z'], ['toma', 5.6, 5.0, 3, 'z'], ['toma', 0, 2.6, 3, 'x'], ['toma', 0, 4.3, 3, 'x'],
  ['toma', 3.2 + E, 1.0, 4, 'x'], ['toma', 3.2 + E, 2.3, 4, 'x'], ['toma', 6.4 + E, 1.0, 4, 'x'], ['toma', 6.4 + E, 2.8, 4, 'x'], ['toma', 3.2 + E, 4.2, 4, 'x'],
];
const grupos = { 1: new THREE.Group(), 2: new THREE.Group(), 3: new THREE.Group(), 4: new THREE.Group() };
Object.values(grupos).forEach(g => raiz.add(g));
const materiales = { 1: [], 2: [], 3: [], 4: [] };
function mat(ci, base) { const m = new THREE.MeshLambertMaterial({ color: base, transparent: true, opacity: 1 }); materiales[ci].push(m); return m; }
function malla(a, b, material) {
  const v = new THREE.Vector3().subVectors(b, a), l = v.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, l, 8), material);
  m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  raiz.add(m); return m;
}
// Los caños de los circuitos comparten tramos (salen todos del TPU por el mismo caño). Para que no titilen
// dos tubos en el mismo lugar, cada tramo compartido se dibuja una sola vez: gris cuando se ven todos, del
// color del circuito elegido cuando se elige uno que pasa por ahí, y tenue si el elegido no pasa.
const SEGS = [];
function recorrido(b) {
  const [t, x, z, ci, pared] = b;
  // dos cañerías: la de iluminación (circuitos 1 y 2) sale por arriba del TPU y va por la losa; la de
  // tomacorrientes (circuitos 3 y 4) sale por abajo y va por el contrapiso
  const tug = ci === 3 || ci === 4, nivel = tug ? PISO_C : LOSA;
  const s = [TPU.x + 0.12, TPU.y + (tug ? -0.39 : 0.39), TPU.z];
  const xb = t === 'luz' ? x : x + (pared === 'x' ? 0.06 : 0), zb = t === 'luz' ? z : z + (pared === 'z' ? 0.06 : 0);
  const yb = t === 'luz' ? 2.25 : (t === 'toma' ? (tug ? 0.4 : 0.4 + 0.12) : 1.1 + 0.16);
  const p = [s, [s[0], nivel, s[2]], [xb, nivel, s[2]], [xb, nivel, zb], [xb, yb, zb]];
  for (let i = 0; i < p.length - 1; i++) SEGS.push({ a: p[i], b: p[i + 1], ci });
}
const TRAMOS = [];      // {ci: Set, gris: mesh, col: {ci: mesh}}
function armarTramos() {
  const r = v => Math.round(v * 1000) / 1000, lineas = {};
  for (const sg of SEGS) {
    const eje = [0, 1, 2].find(i => Math.abs(sg.a[i] - sg.b[i]) > 1e-4); if (eje === undefined) continue;
    const k = eje + ':' + [0, 1, 2].filter(i => i !== eje).map(i => r(sg.a[i])).join(',');
    (lineas[k] = lineas[k] || { eje, base: sg.a, s: [] }).s.push({ lo: Math.min(sg.a[eje], sg.b[eje]), hi: Math.max(sg.a[eje], sg.b[eje]), ci: sg.ci });
  }
  const gris = new THREE.MeshLambertMaterial({ color: 0xaab3bd, transparent: true, opacity: 1 });
  for (const L of Object.values(lineas)) {
    const cortes = [...new Set(L.s.flatMap(x => [r(x.lo), r(x.hi)]))].sort((a, b) => a - b);
    for (let i = 0; i < cortes.length - 1; i++) {
      const lo = cortes[i], hi = cortes[i + 1], cis = new Set(L.s.filter(x => x.lo <= lo + 1e-4 && x.hi >= hi - 1e-4).map(x => x.ci));
      if (!cis.size) continue;
      const a = new THREE.Vector3(...L.base), b = new THREE.Vector3(...L.base);
      a.setComponent(L.eje, lo); b.setComponent(L.eje, hi);
      const t = { ci: cis, gris: malla(a, b, gris.clone()), col: {} };
      for (const c of cis) t.col[c] = malla(a, b, new THREE.MeshLambertMaterial({ color: COLC[c], transparent: true, opacity: 1 }));
      TRAMOS.push(t);
    }
  }
}
function pintarTramos(k) {
  for (const t of TRAMOS) {
    const solo = t.ci.size === 1 ? [...t.ci][0] : null;
    for (const [c, m] of Object.entries(t.col)) m.visible = (k === 0 && solo === +c) || k === +c;
    t.gris.visible = (k === 0 && solo === null) || (k !== 0 && !t.ci.has(k));
    t.gris.material.opacity = k === 0 ? 1 : 0.12; t.gris.material.depthWrite = k === 0;
  }
}
for (const b of BOCAS) {
  const [t, x, z, ci, pared] = b;
  recorrido(b);
  if (t === 'luz') {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), new THREE.MeshBasicMaterial({ color: 0xf2cc60, transparent: true }));
    materiales[ci].push(l.material); l.position.set(x, 2.25, z); grupos[ci].add(l);
  } else {
    const w = t === 'toma' ? 0.22 : 0.12, h = t === 'toma' ? 0.14 : 0.16, y = t === 'toma' ? 0.4 + h / 2 : 1.1 + h / 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(pared === 'x' ? 0.04 : w, h, pared === 'x' ? w : 0.04), mat(ci, 0xf4f4f2));
    m.position.set(x + (pared === 'x' ? 0.02 : 0), y, z + (pared === 'z' ? 0.02 : 0)); grupos[ci].add(m);
    const borde = new THREE.Mesh(new THREE.BoxGeometry(pared === 'x' ? 0.045 : w + 0.04, h + 0.04, pared === 'x' ? w + 0.04 : 0.045), mat(ci, COLC[ci]));
    borde.position.copy(m.position); borde.position.x -= pared === 'x' ? 0.005 : 0; borde.position.z -= pared === 'z' ? 0.005 : 0; grupos[ci].add(borde);
  }
}
armarTramos();
// cotas de altura junto a la puerta del living: toma 0,40 m y llave 1,10 m
const cotas = new THREE.Group(); raiz.add(cotas);
for (const [h, txt] of [[0.4, EN ? 'socket 0.40 m' : 'toma 0,40 m'], [1.1, EN ? 'switch 1.10 m' : 'llave 1,10 m']]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.02), new THREE.MeshBasicMaterial({ color: 0xd29922 })); m.position.set(0.03, h / 2, 7.85); cotas.add(m);
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.22), new THREE.MeshBasicMaterial({ color: 0xd29922 })); t.position.set(0.03, h, 7.85); cotas.add(t);
  const r = rotulo(txt, 0.75, h + 0.1, 7.55, 0.55, '#f0b44a'); raiz.remove(r); cotas.add(r);
}

// ---- textos de cada circuito (los mismos que la figura isométrica)
const TX = EN ? [
  ['All four circuits', ['Medium grade requires at least 3 circuits; the model house has 4.', 'Lighting runs through the slab and sockets through the floor screed, in separate conduits.', 'Drag to rotate, scroll or pinch to zoom.']],
  ['Circuit 1 · general lighting with derived socket', ['2,200 VA · MCB 2×10 A curve B · 2×2.5 mm² + PE.', 'Kitchen light and its derived sockets.', 'I<sub>B</sub> = 10 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 16.8 A.']],
  ['Circuit 2 · general lighting', ['8 outlets of 60 VA × 0.66 = 316.8 VA · MCB 2×10 A curve B · 2×1.5 mm² + PE.', 'The lights of the other rooms, the hallway and the patio, with their switches.', 'I<sub>B</sub> = 1.44 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 12 A.']],
  ['Circuit 3 · general-use sockets', ['2,200 VA · MCB 2×10 A curve C · 2×2.5 mm² + PE.', 'Sockets in the living room, dining room and bedroom 1.', 'I<sub>B</sub> = 10 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 16.8 A.']],
  ['Circuit 4 · general-use sockets', ['2,200 VA · MCB 2×10 A curve C · 2×2.5 mm² + PE.', 'Sockets in bedroom 2, the utility room and the hallway.', 'I<sub>B</sub> = 10 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 16.8 A.']],
] : [
  ['Los cuatro circuitos', ['El grado medio pide como mínimo 3 circuitos; la vivienda modelo tiene 4.', 'Iluminación por la losa y tomacorrientes por el contrapiso, en cañerías separadas.', 'Arrastrá para girar; con la rueda o con dos dedos, acercá y alejá.']],
  ['Circuito 1 · IUG con toma derivada', ['2.200 VA · PIA 2×10 A curva B · 2×2,5 mm² + PE.', 'La luz de la cocina y sus tomas derivadas.', 'I<sub>B</sub> = 10 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 16,8 A.']],
  ['Circuito 2 · IUG', ['8 bocas de 60 VA × 0,66 = 316,8 VA · PIA 2×10 A curva B · 2×1,5 mm² + PE.', 'Las luces de los demás ambientes, el pasillo y el patio, con sus llaves.', 'I<sub>B</sub> = 1,44 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 12 A.']],
  ['Circuito 3 · TUG', ['2.200 VA · PIA 2×10 A curva C · 2×2,5 mm² + PE.', 'Las tomas del living, el comedor y el dormitorio 1.', 'I<sub>B</sub> = 10 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 16,8 A.']],
  ['Circuito 4 · TUG', ['2.200 VA · PIA 2×10 A curva C · 2×2,5 mm² + PE.', 'Las tomas del dormitorio 2, la habitación de servicio y el pasillo.', 'I<sub>B</sub> = 10 A ≤ I<sub>n</sub> = 10 A ≤ I<sub>z</sub> = 16,8 A.']],
];
const HEX = ['#e6edf3', '#e8883a', '#e3c341', '#58a6ff', '#a371f7'];

// ---- cámara, controles y botones (vistas y circuitos)
const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.maxPolarAngle = Math.PI / 2.08; ctl.enableDamping = true;
ctl.minDistance = 5; ctl.maxDistance = 30; ctl.target.set(0, 0.6, 0);
const VISTAS = { iso: [[-10, 10, 13], [0, 0.6, 1]], arriba: [[0, 19, 1.1], [0, 0, 1]] };
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
const nombres = EN ? { iso: 'Oblique', arriba: 'From above' } : { iso: 'Oblicua', arriba: 'Desde arriba' };
function vista(v) { cam.position.set(...VISTAS[v][0]); ctl.target.set(...VISTAS[v][1]); ctl.update(); [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === v)); }
Object.keys(VISTAS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = nombres[v]; b.onclick = () => vista(v); bar.appendChild(b); });
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
const etq = EN ? ['All', 'C1 · lighting + socket', 'C2 · lighting', 'C3 · sockets', 'C4 · sockets'] : ['Todos', 'C1 · IUG c/toma', 'C2 · IUG', 'C3 · TUG', 'C4 · TUG'];
function circuito(k) {
  for (let i = 1; i <= 4; i++) materiales[i].forEach(m => { m.opacity = (k === 0 || k === i) ? 1 : 0.12; m.depthWrite = m.opacity === 1; });
  cotas.visible = k === 0;
  pintarTramos(k);
  [].forEach.call(barc.children, (b, i) => b.classList.toggle('on', i === k));
  if (panel) panel.innerHTML = '<b style="color:' + HEX[k] + '">' + TX[k][0] + '</b>' + TX[k][1].map(l => '<span>' + l + '</span>').join('');
}
etq.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.style.borderColor = HEX[i]; b.onclick = () => circuito(i); barc.appendChild(b); });
vista('iso'); circuito(0);
function medir() { const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
if (window.ResizeObserver) new ResizeObserver(medir).observe(div); medir();
// se dibuja solo mientras está a la vista
let visible = true;
if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(div);
(function cuadro() { requestAnimationFrame(cuadro); if (!visible) return; ctl.update(); ren.render(esc, cam); })();
return { vista, circuito };
};
