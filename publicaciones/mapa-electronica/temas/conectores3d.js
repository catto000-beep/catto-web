/* Maqueta 3D de los conectores de audio (página «Cables y conectores de audio»).
   Misma técnica que la vivienda (vivienda3d.js): three.js r128 y OrbitControls; se gira con el mouse o el dedo.
   Piezas en milímetros y en proporciones reales aproximadas: plug de 6,35 mm, XLR de 19 mm de cuerpo, RCA con
   vivo de 3 mm y anillo de masa de 8 mm, cable de micrófono de 6 mm. Colores como en las figuras 2D de la página:
   azul = vivo (+, pin 2, punta), ámbar = retorno (−, pin 3, anillo), verde = malla (pin 1, manga).
   ConectoresTres(div, panel) → arma la escena en div y escribe la explicación de la pieza en panel.
   Cada pieza mira hacia +x (la cara de contacto); x hacia la derecha, y hacia arriba, z hacia el frente. */
window.ConectoresTres = function (div, panel) {
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.6));
const sol = new THREE.DirectionalLight(0xffffff, 0.55); sol.position.set(60, 140, 120); esc.add(sol);
const sol2 = new THREE.DirectionalLight(0xbcd4ff, 0.25); sol2.position.set(-80, 40, -60); esc.add(sol2);

// ---- colores y medidas (mm)
const AZUL = 0x58a6ff, AMBAR = 0xd29922, VERDE = 0x3fb950, COBRE = 0xc9803a, PLATA = 0x8a949f, NEGRO = 0x2b3038, AISL = 0x5b6572, CHAQ = 0x4a515c;
const D_PLUG = 6.35, D_XLR = 19, D_RCA_ANILLO = 8, D_RCA_VIVO = 3, D_CABLE = 6;
const fmt = (x) => String(x).replace('.', ',');

// ---- registro de piezas: cada una guarda sus materiales (para atenuarla) y sus rótulos de detalle
const piezas = {}; let cur = null;
function nueva(clave, nombre, x, z, c, w, d) {
  const g = new THREE.Group(); g.position.set(x, 0, z); esc.add(g);
  cur = piezas[clave] = { g, mats: [], det: [], desp: [], mov: [], nombre, c: [x + c[0], c[1], z + c[2]], w, d, nom: null };
  return cur;
}
function M(color, o) {
  const m = new THREE.MeshLambertMaterial(Object.assign({ color, transparent: true, opacity: 1 }, o || {}));
  cur.mats.push({ m, base: m.opacity }); return m;
}
// cilindro/cono con eje en x, de xa a xb (radio ra en xa y rb en xb)
function tubo(xa, xb, ra, rb, mat, padre, abierto, dx, dy, dz) {
  const geo = new THREE.CylinderGeometry(rb, ra, xb - xa, 28, 1, !!abierto); geo.rotateZ(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.set((xa + xb) / 2 + (dx || 0), dy || 0, dz || 0); (padre || cur.g).add(m); return m;
}
function caja(w, h, d, mat, x, y, z, padre) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (padre || cur.g).add(m); return m;
}
function punta(x0, r, mat, padre) {   // media esfera hacia +x, cuya punta queda en x0
  const geo = new THREE.SphereGeometry(r, 24, 12, 0, 2 * Math.PI, 0, Math.PI / 2); geo.rotateZ(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.set(x0 - r, 0, 0); (padre || cur.g).add(m); return m;
}
function anillo(x, ri, ro, mat, padre) {   // corona plana que mira a +x
  const geo = new THREE.RingGeometry(ri, ro, 28); geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.x = x; (padre || cur.g).add(m); return m;
}
function hebra(xa, xb, R, paso, fase, r, mat, padre) {   // hélice alrededor del eje x (trenza, conductores retorcidos)
  const pts = [], n = Math.max(8, Math.ceil(Math.abs(xb - xa) / 0.5));
  for (let i = 0; i <= n; i++) {
    const x = xa + (xb - xa) * i / n, a = fase + 2 * Math.PI * (x - xa) / paso;
    pts.push(new THREE.Vector3(x, R * Math.sin(a), R * Math.cos(a)));
  }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 6, false), mat); (padre || cur.g).add(m); return m;
}
// rótulos: Sprite con CanvasTexture, texto con borde oscuro, la letra se achica si el texto es largo
const sprites = [];
function rotulo(txt, x, y, z, w, color, padre, lista) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  let fs = 60; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif';
  while (c.measureText(txt).width > 470 && fs > 28) { fs -= 2; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif'; }
  c.textAlign = 'center'; c.lineWidth = 11; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(13,17,23,.9)'; c.strokeText(txt, 256, 82); c.fillStyle = color || '#ffffff'; c.fillText(txt, 256, 82);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  w *= 1.3; sp.scale.set(w, w / 4, 1); sp.position.set(x, y, z); sp.renderOrder = 10; (padre || cur.g).add(sp);
  if (lista) lista.push(sp);
  return sp;
}
function numero(n, x, y, z, col) {   // número chico de pin
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d');
  c.beginPath(); c.arc(48, 48, 40, 0, 2 * Math.PI); c.fillStyle = 'rgba(13,17,23,.88)'; c.fill();
  c.lineWidth = 7; c.strokeStyle = col; c.stroke();
  c.font = 'bold 54px Segoe UI, system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.fillText(n, 48, 67);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.scale.set(4.6, 4.6, 1); sp.position.set(x, y, z); sp.renderOrder = 11; cur.g.add(sp); cur.det.push(sp); return sp;
}
function lider(x, ya, yb, hex, padre, lista, zl) {   // línea fina de un rótulo a la pieza (el rótulo puede estar corrido en z)
  const A = new THREE.Vector3(x, ya, 0), B = new THREE.Vector3(x, yb, zl || 0), v = B.clone().sub(A), l = v.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, l, 5), new THREE.MeshBasicMaterial({ color: hex }));
  m.position.copy(A).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  (padre || cur.g).add(m); if (lista) lista.push(m); return m;
}
function movil(dx) { const g = new THREE.Group(); cur.g.add(g); cur.mov.push({ g, dx }); return g; }
function nombre(txt, x) { cur.nom = rotulo(txt, x, -7, 17, 30, '#e6edf3'); }

const HEXF = { 1: '#3fb950', 2: '#58a6ff', 3: '#d29922' };

// ---- XLR (macho y hembra); la cara de contactos mira a +x. Los pines están sobre un círculo de 4,6 mm de radio.
const R_PIN = 4.6;
// Posiciones en la cara (EIA RS-297-A), mirando la cara de frente con el seguro arriba: macho (pines) 1 arriba a la izquierda,
// 2 arriba a la derecha y 3 solo abajo; hembra (agujeros) 2 arriba a la izquierda, 1 arriba a la derecha y 3 abajo.
const PIN_XY = { 1: [-3.6, 2.4], 2: [3.6, 2.4], 3: [0, -4.2] };
function posPin(k, hembra, fuera) {   // [y, z] de un pin; «fuera» lo aleja del centro (para el número)
  let [sx, sy] = PIN_XY[k]; if (hembra && k !== 3) sx = -sx;
  if (fuera) { const l = Math.hypot(sx, sy) || 1; sx += sx / l * fuera; sy += sy / l * fuera; }
  return [sy, -sx];   // pantalla: derecha = −z al mirar desde +x
}
function xlr(clave, hembra, x, z) {
  const P = nueva(clave, hembra ? 'XLR hembra' : 'XLR macho', x, z, [-35, 0, 0], 112, 165);
  const col = { 1: VERDE, 2: AZUL, 3: AMBAR };
  const dig = new THREE.Group();            // contactos: no se mueven
  P.g.add(dig);
  // carcasa: tubo metálico de 19 mm (se corre hacia adelante), con el seguro; collar y protector (se corren hacia atrás)
  const casco = movil(34), cola = movil(-30);
  const plata = M(PLATA, { side: THREE.DoubleSide }), negro = M(NEGRO);
  tubo(-24, 0, D_XLR / 2, D_XLR / 2, plata, casco, true);
  anillo(0, D_XLR / 2 - 0.7, D_XLR / 2, plata, casco);
  caja(7, 1.6, 4.5, M(0x7b8794), -5, D_XLR / 2 + 0.5, 0, casco);   // seguro (traba)
  tubo(-32, -24, 9.3, 9.3, M(0x6e7985), cola);
  tubo(-52, -32, 9.3, 4.6, negro, cola);
  tubo(-74, -52, 3, 3, M(CHAQ), cola);
  // aislante con los contactos
  const aisl = M(AISL);
  tubo(-16, hembra ? -3 : -12, hembra ? 7.7 : 7.8, hembra ? 7.7 : 7.8, aisl, dig);
  for (const k of [1, 2, 3]) {
    const [py, pz] = posPin(k, hembra), mc = M(col[k]);
    if (!hembra) {
      const punta = k === 1 ? -0.5 : -2;   // el pin 1 es más largo: conecta primero
      const p = tubo(-12, punta, 0.8, 0.8, mc, dig); p.position.y = py; p.position.z = pz;
      const q = tubo(-20, -16, 1.15, 1.15, mc, dig); q.position.y = py; q.position.z = pz;   // copa de soldadura
    } else {
      const s = tubo(-20, -2.6, 1.6, 1.6, mc, dig); s.position.y = py; s.position.z = pz;
      const h = tubo(-2.7, -2.45, 0.85, 0.85, M(0x0d1117), dig); h.position.y = py; h.position.z = pz;
    }
    const [ny, nz] = posPin(k, hembra, 3.4);
    numero(String(k), hembra ? -2.6 : (k === 1 ? 0.8 : -0.8), ny, nz, HEXF[k]);
  }
  rotulo('Ø ' + fmt(D_XLR) + ' mm', -12, 17, -16, 24, '#e6edf3', P.g, P.det);
  rotulo('carcasa', -12, 15, 0, 16, '#c8d2dd', casco, P.desp);
  rotulo('protector', -42, 14, 0, 18, '#c8d2dd', cola, P.desp);
  rotulo(hembra ? 'hembra: sockets 1 · 2 · 3' : 'macho: pines 1 · 2 · 3', -34, -26, 4, 34, '#c8d2dd', dig, P.det);
  nombre(P.nombre, -30);
}

// ---- plug de 6,35 mm: TRS (punta, anillo, manga) o TS (punta, manga). Contactos: barril; carcasa: mango.
function plug(clave, trs, x, z) {
  const P = nueva(clave, trs ? 'Plug TRS' : 'Plug TS', x, z, [-38, 0, 0], 92, 105);
  const r = D_PLUG / 2, dig = new THREE.Group(); P.g.add(dig);
  const mp = M(AZUL), ma = M(AMBAR), mv = M(VERDE), ai = M(0x20242b), plata = M(PLATA), negro = M(NEGRO);
  const rb = r - 0.05;
  const tipEnd = trs ? -5.5 : -8.5;
  punta(0, rb, mp, dig); tubo(tipEnd, -rb, rb, rb, mp, dig);
  let fin = tipEnd;
  if (trs) {
    tubo(-7, tipEnd, rb, rb, ai, dig);                     // aislante entre punta y anillo
    tubo(-11.5, -7, rb, rb, ma, dig);                      // anillo
    tubo(-13, -11.5, rb, rb, ai, dig);                     // aislante entre anillo y manga
    fin = -13;
  } else { tubo(-10, tipEnd, rb, rb, ai, dig); fin = -10; }
  tubo(-24, fin, rb, rb, mv, dig);                         // manga (cuerpo del barril)
  // lengüetas de soldadura detrás del barril (punta, anillo y manga)
  const lug = (mat, y, z, ang) => { const l = caja(7, 0.5, 2.2, mat, -27.5, y, z, dig); l.rotation.x = ang; };
  lug(mp, 2.0, 0, 0);
  if (trs) lug(ma, -2.0, 0, 0);
  lug(mv, 0, -2.0, Math.PI / 2);
  // mango (carcasa) con alivio de tracción y cable
  const mango = movil(-30);
  tubo(-26, -24, 4.2, 4.2, plata, mango);
  tubo(-54, -26, 5.5, 5.5, plata, mango);
  tubo(-70, -54, 4.2, 2.6, negro, mango);
  tubo(-86, -70, 3, 3, M(CHAQ), mango);
  rotulo('Ø ' + fmt(D_PLUG) + ' mm', -14, -9.5, -20, 22, '#e6edf3', P.g, P.det);
  rotulo('punta (T)', -2, 17, 8, 13, HEXF[2], dig, P.det); lider(-2, 3.4, 14.8, 0x58a6ff, dig, P.det, 8);
  if (trs) { rotulo('anillo (R)', -9.5, 11.5, -8, 13, HEXF[3], dig, P.det); lider(-9.5, 3.4, 9.3, 0xd29922, dig, P.det, -8); }
  rotulo('manga (S)', -19, 22, 8, 13, HEXF[1], dig, P.det); lider(-19, 3.4, 19.8, 0x3fb950, dig, P.det, 8);
  rotulo('contactos', -14, -22, -30, 20, '#c8d2dd', dig, P.desp);
  rotulo('carcasa', -40, 11, 0, 18, '#c8d2dd', mango, P.desp);
  nombre(trs ? 'Plug TRS' : 'Plug TS', -30);
}

// ---- RCA: vivo de 3 mm, anillo de masa de 8 mm
function rca(x, z) {
  const P = nueva('rca', 'RCA', x, z, [-30, 0, 0], 75, 85);
  const dig = new THREE.Group(); P.g.add(dig);
  const mv = M(AZUL), mm = M(VERDE, { side: THREE.DoubleSide }), blanco = M(0xdfe5ec), plata = M(PLATA), negro = M(NEGRO);
  tubo(-18, 0, D_RCA_VIVO / 2, D_RCA_VIVO / 2, mv, dig);                     // vivo
  tubo(-13, -1, D_RCA_ANILLO / 2, D_RCA_ANILLO / 2, mm, dig, true);          // anillo de masa
  anillo(-1, D_RCA_ANILLO / 2 - 0.45, D_RCA_ANILLO / 2, mm, dig);
  tubo(-9, -5.5, 3.6, 3.6, blanco, dig);                                     // aislante
  tubo(-14, -13, 5, 5, mm, dig);                                             // reborde del anillo
  const mango = movil(-26);
  tubo(-38, -14, 6, 6, plata, mango);
  tubo(-52, -38, 6, 3, negro, mango);
  tubo(-68, -52, 3, 3, M(CHAQ), mango);
  rotulo('vivo Ø ' + fmt(D_RCA_VIVO) + ' mm', 0, 11.5, 8, 18, HEXF[2], dig, P.det); lider(0, 1.6, 9.2, 0x58a6ff, dig, P.det, 8);
  rotulo('anillo de masa Ø ' + fmt(D_RCA_ANILLO) + ' mm', -9, -12.5, -8, 32, HEXF[1], dig, P.det); lider(-9, -4.1, -10.2, 0x3fb950, dig, P.det, -8);
  rotulo('contactos', -9, 17, 0, 16, '#c8d2dd', dig, P.desp);
  rotulo('carcasa', -26, 11.5, 0, 15, '#c8d2dd', mango, P.desp);
  nombre('RCA', -28);
}

// ---- cable balanceado cortado en escalones: chaqueta → malla trenzada → dos conductores retorcidos → cobre
function cable(x, z) {
  const P = nueva('cable', 'Cable balanceado', x, z, [-45, 0, 0], 200, 125);
  const R_CH = D_CABLE / 2, R_CH_INT = 2.15, R_MALLA = 2.0, R_REL = 1.75, R_COND = 0.8, RH = 0.85;
  const XJ = -45, XM = -28, XC = -8;       // dónde termina cada capa
  const chaq = M(CHAQ, { side: THREE.DoubleSide });
  tubo(-118, XJ, R_CH, R_CH, chaq, null, true);
  anillo(XJ, R_CH_INT, R_CH, chaq);
  anillo(-118, R_CH_INT, R_CH, chaq);
  tubo(XJ - 2, XM, R_REL, R_REL, M(0x2d343e), null);                          // relleno bajo la malla
  const mallaMat = M(0xcfd6de);
  for (let k = 0; k < 12; k++) {
    hebra(XJ - 2, XM, R_MALLA, 9, k * Math.PI / 6, 0.2, mallaMat);
    hebra(XJ - 2, XM, R_MALLA, -9, k * Math.PI / 6 + 0.26, 0.2, mallaMat);
  }
  const vivo = M(AZUL), ret = M(AMBAR), cu = M(COBRE);
  hebra(XM, XC, RH, 14, 0, R_COND, vivo); hebra(XM, XC, RH, 14, Math.PI, R_COND, ret);          // conductores aislados retorcidos
  hebra(XC, 0, RH, 14, 0, 0.32, cu); hebra(XC, 0, RH, 14, Math.PI, 0.32, cu);                   // alma de cobre pelada
  rotulo('chaqueta', -80, 9, 12, 20, '#c8d2dd', null, P.det); lider(-80, 3.1, 6.5, 0xc8d2dd, null, P.det, 12);
  rotulo('Ø ' + fmt(D_CABLE) + ' mm', -108, 9, 12, 22, '#e6edf3', null, P.det);
  rotulo('malla trenzada', -45, 9, 12, 28, HEXF[1], null, P.det); lider(-37, 2.1, 6.6, 0x3fb950, null, P.det, 12);
  rotulo('vivo (+)', -18, 15, 12, 16, HEXF[2], null, P.det); lider(-17, 1.8, 12.3, 0x58a6ff, null, P.det, 12);
  rotulo('alma de cobre', 10, 21, 12, 26, '#e0a15a', null, P.det); lider(-3, 1.3, 18.3, 0xe0a15a, null, P.det, 12);
  rotulo('retorno (−)', -19, -8, -12, 22, HEXF[3], null, P.det); lider(-19, -1.8, -5.3, 0xd29922, null, P.det, -12);
  nombre('Cable balanceado', -58);
}

// disposición: dos columnas (A: XLR y cable; B: plugs y RCA), tres filas
const XA = -5, XB = 125, Z0 = -45, ZS = 45;
xlr('xlrm', false, XA, Z0); xlr('xlrh', true, XA, Z0 + ZS); cable(XA, Z0 + 2 * ZS);
plug('trs', true, XB, Z0); plug('ts', false, XB, Z0 + ZS); rca(XB, Z0 + 2 * ZS);
// mesa de trabajo
const mesa = new THREE.Mesh(new THREE.BoxGeometry(272, 3, 190), new THREE.MeshLambertMaterial({ color: 0x24313f }));
mesa.position.set(0, -12.5, 0); esc.add(mesa);

// ---- estados (qué se acerca y qué se atenúa) y textos del panel
const ESTADOS = [
  { id: 'todo', et: 'Todo', hex: '#e6edf3', piezas: ['xlrm', 'xlrh', 'trs', 'ts', 'rca', 'cable'], c: [0, 0, 6], w: 400, d: 270 },
  { id: 'xlr', et: 'XLR', hex: '#58a6ff', piezas: ['xlrm', 'xlrh'] },
  { id: 'trs', et: 'TRS', hex: '#e8883a', piezas: ['trs'] },
  { id: 'ts', et: 'TS', hex: '#d29922', piezas: ['ts'] },
  { id: 'rca', et: 'RCA', hex: '#f85149', piezas: ['rca'] },
  { id: 'cable', et: 'Cable', hex: '#3fb950', piezas: ['cable'] },
];
const TX = [
  ['Los conectores de audio, en proporciones reales aproximadas', [
    'Plug de ' + fmt(D_PLUG) + ' mm, XLR de ' + D_XLR + ' mm de cuerpo, RCA con vivo de ' + D_RCA_VIVO + ' mm y anillo de masa de ' + D_RCA_ANILLO + ' mm, y un cable balanceado de ' + D_CABLE + ' mm cortado en escalones.',
    'Los colores son los de las figuras: azul para el vivo (+), ámbar para el retorno (−) y verde para la malla. En un cable real el aislante puede ser rojo, blanco o negro.',
    'Elegí una pieza para acercarte y «Despiece» para separar la carcasa de los contactos.']],
  ['XLR de 3 pines · macho y hembra', [
    'Pin 1: malla (verde; es el más largo y conecta primero, así se evitan estallidos). Pin 2: vivo (+, azul). Pin 3: retorno (−, ámbar). Mirando el macho de frente con el seguro arriba: 1 arriba a la izquierda, 2 arriba a la derecha y 3 abajo.',
    'Es la asignación de las normas IEC 60268-12 y AES14 (disposición física según EIA RS-297-A). La carcasa no siempre está unida a la malla: depende del conector y del equipo.',
    'En la hembra los números se leen espejados (2 arriba a la izquierda, 1 arriba a la derecha), para que acoplen. Traba con un seguro.']],
  ['Plug TRS de ' + fmt(D_PLUG) + ' mm · punta, anillo y manga', [
    'Punta = vivo (+, azul), anillo = retorno (−, ámbar), manga = malla (verde); los aislantes los separan.',
    'La misma ficha sirve para una línea balanceada mono, para auriculares estéreo (punta izquierdo, anillo derecho, no balanceado) y para el insert de una consola.',
    'No traba: se suelta con un tirón.']],
  ['Plug TS de ' + fmt(D_PLUG) + ' mm · punta y manga', [
    'Punta = señal (azul), manga = masa (verde): un solo aislante entre los dos contactos. Es el plug de las guitarras, bajos, teclados y pedales.',
    'Conexión no balanceada: igual que el TRS, no traba y es sensible a golpes laterales.']],
  ['RCA (fono) · vivo y anillo de masa', [
    'Vivo central de ' + D_RCA_VIVO + ' mm (señal, azul) y anillo de masa de ' + D_RCA_ANILLO + ' mm (verde), separados por un aislante.',
    'Se usa en equipos domésticos, reproductores y giradiscos. No traba, y la masa puede conectar después que la señal.']],
  ['Cable balanceado · de afuera hacia adentro', [
    'Chaqueta (' + D_CABLE + ' mm), malla trenzada (blinda y va al pin 1 o a la manga) y dos conductores aislados retorcidos: vivo (+, azul) y retorno (−, ámbar).',
    'Al ir retorcidos, el ruido que se induce llega casi igual a los dos, y el receptor diferencial lo resta.',
    'Al fondo, el alma de cobre pelada, lista para soldar.']],
];
const TXD = ' Despiece activado: la carcasa se separa de los contactos.';

// ---- cámara, controles y botones
const cam = new THREE.PerspectiveCamera(40, 1, 0.5, 2000);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI / 2.05;
ctl.minDistance = 22; ctl.maxDistance = 900;
const DIRS = { iso: [0.5, 0.62, 0.85], costado: [0.04, 0.3, 1], frente: [1, 0.22, 0.05], arriba: [0.001, 1, 0.1] };
const NOMV = { iso: 'Oblicua', costado: 'Costado', frente: 'Frente', arriba: 'Arriba' };
let estadoActual = 0, vistaActual = 'iso', despiece = false, tocado = false, anim = null;
let aspecto = 2;
function meta() {
  const E = ESTADOS[estadoActual], ps = E.piezas.map(k => piezas[k]);
  let c, w, d;
  if (E.c) { c = E.c; w = E.w; d = E.d; }
  else {
    c = [0, 0, 0]; ps.forEach(p => { c[0] += p.c[0]; c[1] += p.c[1]; c[2] += p.c[2]; }); c = c.map(v => v / ps.length);
    w = Math.max(...ps.map(p => p.w)) + (ps.length > 1 ? 30 : 0); d = Math.max(...ps.map(p => p.d)) * (ps.length > 1 ? 1.1 : 1);
    if (despiece && estadoActual !== 5) { w += 55; c[0] += ps.reduce((t, p) => t + p.mov.reduce((u, o) => u + o.dx, 0) / 2, 0) / ps.length; }
  }
  d = Math.max(d, w / (2 * Math.tan(cam.fov * Math.PI / 360) * aspecto));
  const dir = new THREE.Vector3(...DIRS[vistaEf()]).normalize();
  return { tgt: new THREE.Vector3(...c), pos: new THREE.Vector3(...c).addScaledVector(dir, d) };
}
function ir(inmediato) {
  const m = meta();
  if (inmediato) { cam.position.copy(m.pos); ctl.target.copy(m.tgt); ctl.update(); anim = null; return; }
  anim = { t0: performance.now(), dur: 750, p0: cam.position.clone(), t0v: ctl.target.clone(), p1: m.pos, t1: m.tgt };
}
function marcar() {
  [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === vistaEf()));
  [].forEach.call(barc.querySelectorAll('[data-e]'), b => b.classList.toggle('on', +b.dataset.e === estadoActual));
  const bd = barc.querySelector('[data-d]'); if (bd) bd.classList.toggle('on', despiece);
}
function pintarPanel() {
  if (!panel) return;
  const T = TX[estadoActual];
  panel.innerHTML = '<b style="color:' + ESTADOS[estadoActual].hex + '">' + T[0] + '</b>' + T[1].map(l => '<span>' + l + '</span>').join('') +
    (despiece && estadoActual !== 5 ? '<span style="color:#7d8a99">' + TXD.trim() + '</span>' : '');
}
function vistaEf() { return vistaActual === 'frente' && estadoActual > 1 ? 'costado' : vistaActual; }   // «Frente» solo sirve en el XLR
function vista(v) { if (!DIRS[v]) return; vistaActual = v; marcar(); ir(false); }
function estado(n) { if (!ESTADOS[n]) return; estadoActual = n; aplicarEstado(); marcar(); pintarPanel(); ir(false); }
function setDespiece(b) { despiece = b === undefined ? !despiece : !!b; aplicarEstado(); marcar(); pintarPanel(); ir(false); }
function aplicarEstado() {
  const foco = new Set(ESTADOS[estadoActual].piezas);
  for (const [k, p] of Object.entries(piezas)) {
    const f = foco.has(k), op = f ? 1 : 0.08;
    p.mats.forEach(o => { o.m.opacity = o.base * op; o.m.depthWrite = op === 1; });
    p.det.forEach(s => { s.visible = f && estadoActual !== 0; });
    p.desp.forEach(s => { s.visible = f && estadoActual !== 0 && despiece; });
    if (p.nom) { p.nom.visible = estadoActual === 0; p.nom.material.opacity = 1; }
  }
}
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
Object.keys(DIRS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = NOMV[v]; b.onclick = () => { tocado = true; vista(v); }; bar.appendChild(b); });
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
ESTADOS.forEach((E, i) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.e = i; b.textContent = E.et; b.style.borderColor = E.hex; b.onclick = () => { tocado = true; estado(i); }; barc.appendChild(b); });
{ const b = document.createElement('button'); b.type = 'button'; b.dataset.d = 1; b.textContent = 'Despiece'; b.style.borderColor = '#a371f7'; b.onclick = () => { tocado = true; setDespiece(); }; barc.appendChild(b); }
barc.style.justifyContent = 'flex-end';

function medir() {
  const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return;
  ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); aspecto = w / h;
  if (!tocado) ir(true);
}
if (window.ResizeObserver) new ResizeObserver(medir).observe(div); medir();
aplicarEstado(); marcar(); pintarPanel(); ir(true);

// ---- despiece animado con el reloj
let e = 0, tPrev = performance.now();
const suave = x => x * x * (3 - 2 * x);
let visible = true;
if (window.IntersectionObserver) new IntersectionObserver(en => { visible = en[0].isIntersecting; }).observe(div);
(function cuadro() {
  requestAnimationFrame(cuadro); if (!visible) { tPrev = performance.now(); return; }
  const ahora = performance.now(), dt = Math.min(0.1, (ahora - tPrev) / 1000); tPrev = ahora;
  const dest = despiece ? 1 : 0; e += Math.sign(dest - e) * Math.min(Math.abs(dest - e), dt / 0.7);
  const s = suave(e);
  for (const p of Object.values(piezas)) p.mov.forEach(o => { o.g.position.x = o.dx * s; });
  if (anim) {
    const k = Math.min(1, (ahora - anim.t0) / anim.dur), q = suave(k);
    cam.position.lerpVectors(anim.p0, anim.p1, q); ctl.target.lerpVectors(anim.t0v, anim.t1, q);
    if (k >= 1) anim = null;
  }
  try { ctl.update(); ren.render(esc, cam); } catch (er) { console.log('ERR ' + er.message + ' ' + er.stack); }
})();
return { vista, estado, despiece: setDespiece, meta: () => ({ estado: estadoActual, vista: vistaActual, despiece }) };
};
