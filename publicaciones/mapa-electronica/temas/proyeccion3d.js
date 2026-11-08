/* Maqueta 3D de la proyección y la base ortogonal (página «Producto interno y ortogonalidad»).
   Misma técnica que la vivienda (publicaciones/mapa-electronica/temas/vivienda3d.js): three.js r128 y OrbitControls.
   Vectores de la página: u = (3, 1, 2), v = (1, 2, 2), base b1 = (1, 2, 2), b2 = (2, −1, 0), b3 = (2, 4, −5), x = (4, 3, 1).
   Todo se calcula acá (producto interno, ángulo, coeficientes); nada va a ojo.
   ProyeccionTres(div, panel) → arma la escena en div y escribe la explicación del estado en panel.
   Coordenadas: las del texto son (x, y, z) con z hacia arriba; en la escena, X = x, Y = z (arriba), Z = −y. */
window.ProyeccionTres = function (div, panel) {
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.85));
const sol = new THREE.DirectionalLight(0xffffff, 0.6); sol.position.set(5, 12, 8); esc.add(sol);

// ---- álgebra (la de la página)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norma = a => Math.sqrt(dot(a, a));
const suma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const por = (k, a) => [k * a[0], k * a[1], k * a[2]];
const U = [3, 1, 2], V = [1, 2, 2], X = [4, 3, 1];
const B = [[1, 2, 2], [2, -1, 0], [2, 4, -5]];
const k1 = dot(U, V) / dot(V, V), PROY = por(k1, V), RES = resta(U, PROY);
const COS = dot(U, V) / (norma(U) * norma(V)), TETA = Math.acos(COS) * 180 / Math.PI;
const mcd = (a, b) => b ? mcd(b, a % b) : Math.abs(a);
const frac = (n, d) => { const g = mcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : n + '/' + d; };
const CF = B.map(b => { const n = dot(X, b), d = dot(b, b); return { n, d, v: n / d, txt: frac(n, d) }; });
const COMP = B.map((b, i) => por(CF[i].v, b));            // las tres componentes de x
const coma = (v, dec) => v.toFixed(dec).replace('.', ',');
const ter = a => '(' + a.map(t => String(t).replace('-', '−')).join(', ') + ')';
const mat = a => ter(a.map(t => Math.round(t * 1000) / 1000));
const P = m => new THREE.Vector3(m[0], m[2], -m[1]);       // de (x, y, z) del texto a la escena

// colores del sitio, los mismos que la figura 2D de la página: u ámbar, v azul, proy verde, residuo violeta
const COL = { u: 0xd29922, v: 0x58a6ff, proy: 0x3fb950, res: 0xa371f7, nar: 0xe8883a, x: 0xe6edf3, eje: 0x7d8a99 };
const HEXC = { u: '#d29922', v: '#58a6ff', proy: '#3fb950', res: '#a371f7', nar: '#e8883a', x: '#e6edf3' };
const Y = new THREE.Vector3(0, 1, 0);

// ---- piezas
const raiz = new THREE.Group(); esc.add(raiz);
const ROTULOS = [];
function rotulo(txt, color, escala, anc) {   // anc: 1 = el texto empieza en el punto (a su derecha), -1 = termina en el punto, 0 = centrado
  const cv = document.createElement('canvas'), c = cv.getContext('2d'), fam = 'px Segoe UI, system-ui, sans-serif', H = 128, PAD = 14;
  c.font = 'bold 64' + fam; const w = Math.ceil(c.measureText(txt).width) + 2 * PAD;
  cv.width = w; cv.height = H;                                  // al cambiar el tamaño el contexto se reinicia
  c.font = 'bold 64' + fam; c.textAlign = 'center'; c.lineWidth = 10; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(13,17,23,.9)'; c.strokeText(txt, w / 2, 86); c.fillStyle = color || '#ffffff'; c.fillText(txt, w / 2, 86);
  // tamaño fijo en pantalla (sizeAttenuation: false): se lee igual de cerca o de lejos
  const tx = new THREE.CanvasTexture(cv); tx.minFilter = THREE.LinearFilter;   // ancho que no es potencia de 2
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false, sizeAttenuation: false }));
  const e = 0.115 * (escala || 1); sp.scale.set(e * w / H, e, 1); sp.center.set(anc === 1 ? 0 : anc === -1 ? 1 : 0.5, 0.5);
  sp.renderOrder = 10; sp.userData.s0 = sp.scale.clone(); ROTULOS.push(sp); raiz.add(sp); return sp;
}
function cilindro(a, b, r, mt) {
  const d = new THREE.Vector3().subVectors(b, a), l = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 10), mt);
  m.position.copy(a).addScaledVector(d, 0.5); if (l > 1e-6) m.quaternion.setFromUnitVectors(Y, d.clone().normalize()); return m;
}
// flecha: cilindro + cono; set(a, b) la coloca (sirve para animar el largo)
function flecha(color, r, padre) {
  const g = new THREE.Group(); (padre || raiz).add(g);
  const mt = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 1 });
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12), mt), cono = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, 1, 14), mt);
  g.add(eje, cono);
  g.mt = mt;
  g.set = function (a, b) {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length(); if (L < 1e-5) { g.visible = false; return; }
    g.visible = true; const hl = Math.min(r * 7, L * 0.45), q = new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize()), u = d.clone().normalize();
    eje.scale.set(1, L - hl, 1); eje.position.copy(a).addScaledVector(u, (L - hl) / 2); eje.quaternion.copy(q);
    cono.scale.set(1, hl, 1); cono.position.copy(b).addScaledVector(u, -hl / 2); cono.quaternion.copy(q);
  };
  return g;
}
function trazos(a, b, r, color, padre) {            // línea de trazos
  const g = new THREE.Group(); (padre || raiz).add(g);
  const mt = new THREE.MeshLambertMaterial({ color }), d = new THREE.Vector3().subVectors(b, a), L = d.length(), n = Math.round(L / 0.2);
  for (let i = 0; i < n; i++) g.add(cilindro(a.clone().addScaledVector(d, (i + 0.1) / n), a.clone().addScaledVector(d, (i + 0.65) / n), r, mt));
  return g;
}
function poli(pts, r, color, padre) {               // trazo continuo por varios puntos
  const g = new THREE.Group(); (padre || raiz).add(g); const mt = new THREE.MeshLambertMaterial({ color });
  for (let i = 0; i < pts.length - 1; i++) g.add(cilindro(pts[i], pts[i + 1], r, mt));
  for (const p of pts) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mt); s.position.copy(p); g.add(s); }
  return g;
}

// ---- ejes (x, y, z), grilla en el piso (plano z = 0) y rótulos
const EJES = [[[1, 0, 0], 'x', 5.4, -0.7], [[0, 1, 0], 'y', 4.4, -1.7], [[0, 0, 1], 'z', 3.7, -2.4]];
const ejesG = new THREE.Group(); raiz.add(ejesG);   // en la vista del plano se ocultan: ahí estorban
for (const [dir, nom, fin, ini] of EJES) {
  const a = P(por(ini, dir)), b = P(por(fin, dir));
  ejesG.add(cilindro(a, b, 0.018, new THREE.MeshBasicMaterial({ color: COL.eje })));
  const f = flecha(COL.eje, 0.018, ejesG); f.set(P(por(fin - 0.01, dir)), P(por(fin + 0.35, dir)));
  const t = rotulo(nom, '#aab6c3', 0.55, 0); t.position.copy(P(por(fin + 0.62, dir))); ejesG.add(t);
}
const grilla = new THREE.GridHelper(6, 6, 0x4a5868, 0x2f3b4a); grilla.position.set(2, 0, -1); raiz.add(grilla);   // x de −1 a 5, y de −2 a 4
// plano de u y v (paralelogramo 0, u, u+v, v)
const plano = (() => {
  const p = [P([0, 0, 0]), P(U), P(suma(U, V)), P(V)], g = new THREE.BufferGeometry();
  g.setFromPoints([p[0], p[1], p[2], p[0], p[2], p[3]]); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
})();
raiz.add(plano);
const origen = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe6edf3 })); raiz.add(origen);

// ---- estado 1 y 2: u, v
const gU = flecha(COL.u, 0.04), gV = flecha(COL.v, 0.04);
gU.set(P([0, 0, 0]), P(U)); gV.set(P([0, 0, 0]), P(V));
const rU = rotulo('u = ' + ter(U), HEXC.u, 0.62, 1), rV = rotulo('v = ' + ter(V), HEXC.v, 0.62, -1);
rU.position.copy(P(U)).add(new THREE.Vector3(0.12, 0.1, 0)); rV.position.copy(P(V)).add(new THREE.Vector3(-0.1, 0.12, 0));
// arco del ángulo θ en el plano de u y v (de v hacia u), radio 1,3
const uh = por(1 / norma(U), U), vh = por(1 / norma(V), V), R_ARCO = 1.3, arcoPts = [];
{ const w = resta(uh, por(dot(uh, vh), vh)), wh = por(1 / norma(w), w), th = Math.acos(COS);
  for (let i = 0; i <= 24; i++) { const a = th * i / 24; arcoPts.push(P(suma(por(R_ARCO * Math.cos(a), vh), por(R_ARCO * Math.sin(a), wh)))); }
  var medio = suma(por(Math.cos(th / 2), vh), por(Math.sin(th / 2), wh)); }
const arco = poli(arcoPts, 0.022, 0xe6edf3);
const rT = rotulo('θ ≈ ' + coma(TETA, 1) + '°', '#e6edf3', 0.55, 0);
rT.position.copy(P(por(R_ARCO + 0.95, medio)));
// estado 2: la proyección (verde, sobre v), el residuo (trazos violeta) y el ángulo recto
const gP = flecha(COL.proy, 0.062); gP.set(P([0, 0, 0]), P(PROY));
const resTrazos = trazos(P(PROY), P(U), 0.026, COL.res);
const rR = rotulo('u − proy = ' + ter(RES), HEXC.res, 0.62, 0); rR.position.copy(P(suma(PROY, por(0.5, RES)))).add(new THREE.Vector3(0.5, 0.65, 0));
const rP = rotulo('proy = v = ' + ter(PROY), HEXC.proy, 0.62, -1); rP.position.copy(P(por(0.5, PROY))).add(new THREE.Vector3(-0.15, 0.1, 0));
const rec = (() => {
  const s = 0.34, h = por(-1 / norma(PROY), PROY), rr = por(1 / norma(RES), RES);
  const a = suma(PROY, por(s, h)), c = suma(PROY, por(s, rr)), b = suma(a, por(s, rr));
  return poli([P(a), P(b), P(c)], 0.02, 0xe6edf3);
})();
const rRec = rotulo('90°', '#e6edf3', 0.5, 1);
rRec.position.copy(P(PROY)).add(new THREE.Vector3(0.18, -0.28, 0));
function rr0() { return por(1 / norma(RES), RES); }
function vh0() { return por(1 / norma(PROY), PROY); }

// ---- estado 3: base ortogonal y x descompuesto
const COLB = [COL.v, COL.res, COL.nar], HEXB = [HEXC.v, HEXC.res, HEXC.nar], SUB = ['₁', '₂', '₃'];
const gB = B.map((b, i) => { const f = flecha(COLB[i], 0.025); f.set(P([0, 0, 0]), P(b)); f.mt.opacity = 0.4; return f; });
const rB = B.map((b, i) => rotulo('b' + SUB[i] + ' = ' + ter(b), HEXB[i], 0.58, [-1, 1, 1][i]));
rB[0].position.copy(P(B[0])).add(new THREE.Vector3(-0.1, 0.1, 0));
rB[1].position.copy(P(B[1])).add(new THREE.Vector3(0.12, 0, 0));
rB[2].position.copy(P(B[2])).add(new THREE.Vector3(0.12, -0.05, 0));
const gX = flecha(COL.x, 0.05); gX.set(P([0, 0, 0]), P(X));
const rX = rotulo('x = ' + ter(X), HEXC.x, 0.62, 1); rX.position.copy(P(X)).add(new THREE.Vector3(0.14, -0.1, 0));
const gC = COMP.map((c, i) => flecha(COLB[i], 0.05));
const rC = COMP.map((c, i) => rotulo(CF[i].txt + '·b' + SUB[i], HEXB[i], 0.58, [-1, 0, 1][i]));
const ini3 = [[0, 0, 0], COMP[0], suma(COMP[0], COMP[1])];
const pos3 = [new THREE.Vector3(-0.12, 0, 0), new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.14, 0, 0)];
let t3 = 0;
function animar3(ahora) {   // las tres componentes se suman punta con cola, una tras otra
  const p = (ahora - t3) / 1000;
  COMP.forEach((c, i) => {
    const k = Math.max(0, Math.min(1, (p - i * 0.7) / 0.7)), a = ini3[i], b = suma(a, por(k, c));
    gC[i].set(P(a), P(b)); gC[i].visible = k > 0.02;
    rC[i].visible = k >= 1; rC[i].position.copy(P(suma(a, por(0.5, c)))).add(pos3[i]);
    if (i === 2) {   // en la vista del plano b₃ apunta hacia el espectador: su componente es un punto junto a la punta de x; el rótulo se aparta abajo a la izquierda
      const pl = vistaAct === 'plano'; rC[2].center.x = pl ? 1 : 0; if (pl) rC[2].position.copy(P(suma(a, c))).add(new THREE.Vector3(-0.7, -0.55, 0)); }
  });
}

// ---- textos de cada estado
const TX = [
  ['u y v', HEXC.u, [
    'u = ' + ter(U) + ' y v = ' + ter(V) + '. Producto interno: u · v = 3 + 2 + 4 = ' + dot(U, V) + '.',
    'Normas: ‖u‖ = √14 ≈ ' + coma(norma(U), 3) + ' y ‖v‖ = ' + norma(V) + '. cos θ = ' + dot(U, V) + ' / (' + coma(norma(U), 3) + ' · ' + norma(V) + ') ≈ ' + coma(COS, 3) + ', de modo que θ ≈ ' + coma(TETA, 1) + '°.',
    'El producto interno es positivo y el ángulo menor que 90°: apuntan hacia el mismo lado. El plano que forman se ve en celeste.']],
  ['Proyección de u sobre v', HEXC.proy, [
    'proy<sub>v</sub> u = (u · v / v · v) · v = (' + dot(U, V) + ' / ' + dot(V, V) + ') · v = ' + (k1 === 1 ? '1 · v' : coma(k1, 3) + ' · v') + ' = ' + ter(PROY) + '.' + (k1 === 1 ? ' Como u · v = v · v, la proyección coincide con v.' : ''),
    'Residuo: u − proy<sub>v</sub> u = ' + ter(RES) + ' (trazos violeta). Es perpendicular a v: ' + ter(RES) + ' · ' + ter(V) + ' = ' + RES.map((t, i) => t * V[i]).join(' + ').replace(/\+ -/g, '− ').replace(/^-/, '−') + ' = ' + dot(RES, V) + '.',
    'Por eso hay un ángulo recto (marca blanca) en el pie de la perpendicular.']],
  ['Base ortogonal: x por componentes', HEXC.nar, [
    'b₁ = ' + ter(B[0]) + ', b₂ = ' + ter(B[1]) + ', b₃ = ' + ter(B[2]) + ': perpendiculares de a pares (b₁·b₂ = ' + dot(B[0], B[1]) + ', b₁·b₃ = ' + dot(B[0], B[2]) + ', b₂·b₃ = ' + dot(B[1], B[2]) + ').',
    'Cada coeficiente es una proyección, c<sub>k</sub> = x · b<sub>k</sub> / b<sub>k</sub> · b<sub>k</sub>: c₁ = ' + CF[0].n + '/' + CF[0].d + ' = ' + CF[0].txt + ', c₂ = ' + CF[1].txt + ', c₃ = ' + CF[2].n + '/' + CF[2].d + ' = ' + CF[2].txt + '.',
    'Las tres componentes, sumadas punta con cola, llegan a x = ' + ter(X) + ' (flecha blanca).']],
];
// ---- cámara, controles y botones
const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true; ctl.minDistance = 4; ctl.maxDistance = 30;
const nPlano = P([-2, -4, 5]).normalize();                   // normal al plano de u y v (u × v, del lado de arriba)
const cPlano = P(por(0.5, suma(U, V)));
const VISTAS = {
  iso: [[4.6, 4.6, 8.0], [1.5, 0.9, -1.0]],
  plano: [cPlano.clone().addScaledVector(nPlano, 12.5).toArray(), cPlano.clone().add(new THREE.Vector3(0, -0.3, 0)).toArray()],
};
const VISTA3 = { iso: [[8.0, 4.6, 9.0], [1.9, -0.7, -1.5]] };       // en la base ortogonal el conjunto es más alto
let est = 1, vistaAct = 'iso';
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
const nombres = { iso: 'Oblicua', plano: 'Plano de u y v' };
function vista(v) {
  vistaAct = v; ejesG.visible = v !== 'plano'; const w = (est === 3 && VISTA3[v]) || VISTAS[v];
  const tg = new THREE.Vector3(...w[1]), f = Math.max(1, 1.45 / cam.aspect);   // en pantalla angosta (celular) la cámara se aleja
  cam.position.copy(tg).addScaledVector(new THREE.Vector3(...w[0]).sub(tg), f); ctl.target.copy(tg); ctl.update();
  [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === v));
}
Object.keys(VISTAS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = nombres[v]; b.onclick = () => vista(v); bar.appendChild(b); });
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
const etq = ['u y v', 'Proyección', 'Base ortogonal'], HEX = [HEXC.u, HEXC.proy, HEXC.nar];
function estado(n) {
  est = n; const s1 = n === 1, s2 = n === 2, s3 = n === 3;
  gU.visible = gV.visible = rU.visible = !s3; rV.visible = s1;
  plano.visible = !s3;
  arco.visible = rT.visible = s1;
  gP.visible = resTrazos.visible = rR.visible = rP.visible = rec.visible = rRec.visible = s2;
  gV.mt.opacity = s2 ? 0.55 : 1;
  gB.forEach(g => g.visible = s3); rB.forEach(r => r.visible = s3); gX.visible = rX.visible = s3;
  gC.forEach(g => g.visible = s3); rC.forEach(r => r.visible = false);
  t3 = performance.now(); if (s3) animar3(t3);
  [].forEach.call(barc.children, (b, i) => b.classList.toggle('on', i === n - 1));
  if (panel) panel.innerHTML = '<b style="color:' + TX[n - 1][1] + '">' + TX[n - 1][0] + '</b>' + TX[n - 1][2].map(l => '<span>' + l + '</span>').join('');
  if (vistaAct === 'iso') vista('iso');
}
etq.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.style.borderColor = HEX[i]; b.onclick = () => estado(i + 1); barc.appendChild(b); });
function medir() { const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h;
  ROTULOS.forEach(sp => sp.scale.copy(sp.userData.s0).multiplyScalar(w < 520 ? 0.78 : 1));   // en el celular, rótulos más chicos
  cam.updateProjectionMatrix(); }
medir(); estado(1); vista('iso');
if (window.ResizeObserver) new ResizeObserver(medir).observe(div);
// se dibuja solo mientras está a la vista
let visible = true;
if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(div);
function dibujar() { if (est === 3) animar3(performance.now()); ctl.update(); ren.render(esc, cam); }
(function cuadro() { requestAnimationFrame(cuadro); if (visible) dibujar(); })();
return { vista, estado };
};
