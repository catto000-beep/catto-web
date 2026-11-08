/* Maqueta 3D de la hélice de A·e^(j(ωt+φ)) (página «Números complejos y senoides», sección del fasor).
   Misma técnica que la vivienda modelo (vivienda3d.js): three.js r128 y OrbitControls; se gira con el mouse o el dedo.
   Ejes: t a lo largo (x de three.js), Re hacia arriba (y) e Im hacia el frente (z), como la figura del fasor, que pone Re hacia arriba.
   La hélice tiene 3 períodos; sus sombras sobre las paredes son la cosenoide (Re–t, azul) y la senoide (Im–t, verde), y
   sobre la pared izquierda (t = 0) el círculo del plano complejo. Todo se calcula en el script con
   θ(t) = 2π·t/T + φ; la hélice entera gira φ alrededor del eje t.
   HeliceTres(div, panel) → arma la escena en div y escribe la explicación en panel. Devuelve { vista, estado }. */
window.HeliceTres = function (div, panel) {
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.9));
const sol = new THREE.DirectionalLight(0xffffff, 0.6); sol.position.set(-6, 14, 10); esc.add(sol);

// ---- medidas (en unidades de la maqueta): amplitud A = 1; período T = 3; 3 períodos
const A = 1, T = 3, NP = 3, LONG = T * NP, W = 1.4;          // W: distancia de las paredes al eje
const AZUL = 0x58a6ff, VERDE = 0x3fb950, AMBAR = 0xd29922, CLARO = 0xe6edf3, TENUE = 0x7d8a99;
const raiz = new THREE.Group(); raiz.position.set(-LONG / 2, 0, 0); esc.add(raiz);   // t = 0 queda a la izquierda
const ang = x => 2 * Math.PI * x / T;                          // fase que aporta el tiempo
const BAS = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
const LAM = c => new THREE.MeshLambertMaterial({ color: c });

const ROTULOS = [];
function rotulo(txt, x, y, z, escala, color) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  let fs = 54; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif';
  while (c.measureText(txt).width > 480 && fs > 30) { fs -= 2; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif'; }
  c.textAlign = 'center'; c.lineWidth = 10; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(13,17,23,.85)'; c.strokeText(txt, 256, 82); c.fillStyle = color || '#ffffff'; c.fillText(txt, 256, 82);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.userData.esc = escala || 1; sp.scale.set(2.4 * sp.userData.esc, 0.6 * sp.userData.esc, 1); sp.position.set(x, y, z); sp.renderOrder = 10; raiz.add(sp); ROTULOS.push(sp); return sp;
}
const UP = new THREE.Vector3(0, 1, 0);
// segmento cilíndrico entre dos puntos (se puede mover después con colocar)
function seg(radio, mat, padre) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 1, 8), mat); (padre || raiz).add(m); return m;
}
function colocar(m, a, b) {
  const v = new THREE.Vector3().subVectors(b, a), l = v.length();
  m.visible = l > 1e-4; if (!m.visible) return;
  m.position.copy(a).addScaledVector(v, 0.5); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(UP, v.clone().normalize());
}
// flecha: cilindro + cono
function flecha(radio, mat, padre) {
  const g = { cuerpo: seg(radio, mat, padre), cono: new THREE.Mesh(new THREE.ConeGeometry(radio * 2.6, radio * 7, 14), mat) };
  (padre || raiz).add(g.cono);
  g.poner = function (a, b) {
    const v = new THREE.Vector3().subVectors(b, a), l = v.length(), h = radio * 7;
    g.cono.visible = g.cuerpo.visible = l > h * 1.05; if (!g.cono.visible) return;
    const d = v.clone().normalize(), pc = a.clone().addScaledVector(d, l - h);
    colocar(g.cuerpo, a, pc); g.cono.position.copy(a).addScaledVector(d, l - h / 2); g.cono.quaternion.setFromUnitVectors(UP, d);
  };
  return g;
}
function tubo(f, n, radio, mat, padre, g0) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push(f(i / n));
  const m = g0 || new THREE.Mesh(); if (m.geometry) m.geometry.dispose();
  m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, radio, 6, false); m.material = mat;
  if (!g0) (padre || raiz).add(m); return m;
}

// ---- paredes semitransparentes con grilla tenue: atrás (Re–t, azul), piso (Im–t, verde), izquierda (Re–Im, t = 0)
function pared(w, h, col, o) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), BAS(col, { transparent: true, opacity: 0.075, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(...o.pos); if (o.rot) m.rotation.set(...o.rot); raiz.add(m); return m;
}
function grilla(pts, col) {   // pts: pares de puntos
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.3, depthWrite: false })); raiz.add(l);
}
pared(LONG, 2 * W, AZUL, { pos: [LONG / 2, 0, -W] });                                            // pared de atrás: plano z = −W
pared(LONG, 2 * W, VERDE, { pos: [LONG / 2, -W, 0], rot: [-Math.PI / 2, 0, 0] });                // piso: plano y = −W
pared(2 * W, 2 * W, CLARO, { pos: [0, 0, 0], rot: [0, Math.PI / 2, 0] });                        // izquierda: plano x = 0
{
  const a = [], b = [], c = [], V = THREE.Vector3;
  for (let x = 0; x <= LONG + 1e-6; x += T / 4) { a.push(new V(x, -W, -W), new V(x, W, -W)); b.push(new V(x, -W, -W), new V(x, -W, W)); }
  for (let y = -W; y <= W + 1e-6; y += 0.5) { a.push(new V(0, y, -W), new V(LONG, y, -W)); c.push(new V(0, y, -W), new V(0, y, W)); }
  for (let z = -W; z <= W + 1e-6; z += 0.5) { b.push(new V(0, -W, z), new V(LONG, -W, z)); c.push(new V(0, -W, z), new V(0, W, z)); }
  grilla(a, AZUL); grilla(b, VERDE); grilla(c, 0xaab6c4);
}
// ejes: t, Re, Im (flechas grises que salen del origen)
const GRIS = LAM(0xaab3bd);
for (const [p, r] of [[[LONG + 0.9, 0, 0], 't'], [[0, W + 0.45, 0], 'Re'], [[0, 0, W + 0.45], 'Im']]) {
  const f = flecha(0.022, GRIS); f.poner(new THREE.Vector3(0, 0, 0), new THREE.Vector3(...p));
  rotulo(r, p[0] + (r === 't' ? 0.4 : 0), p[1] + (r === 'Re' ? 0.3 : 0), p[2] + (r === 'Im' ? 0.3 : 0), 0.7, '#e6edf3');
}
for (const dx of [T, 2 * T, 3 * T]) {   // marcas de los períodos sobre el eje t
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), GRIS); m.position.set(dx, 0, 0); raiz.add(m);
}
const marcasT = [];
for (let k = 1; k <= NP; k++) marcasT.push(rotulo(k === 1 ? 'T' : k + 'T', T * k, -0.3, 0, 0.55, '#9aa7b4'));
// el círculo del plano Re–Im en t = 0
const circ = new THREE.Mesh(new THREE.TorusGeometry(A, 0.018, 6, 72), BAS(CLARO, { transparent: true, opacity: 0.55 }));
circ.rotation.y = Math.PI / 2; raiz.add(circ);

// ---- lo que depende de φ
const hel = tubo(u => { const th = 2 * Math.PI * NP * u; return new THREE.Vector3(LONG * u, A * Math.cos(th), A * Math.sin(th)); },
                 NP * 48, 0.042, LAM(0xe6edf3));                                // hélice con φ = 0; el grupo gira φ
const helG = new THREE.Group(); raiz.add(helG); raiz.remove(hel); helG.add(hel);
const matCos = BAS(AZUL), matSen = BAS(VERDE);
const cosC = tubo(u => new THREE.Vector3(LONG * u, 0, -W), 8, 0.04, matCos), senC = tubo(u => new THREE.Vector3(LONG * u, -W, 0), 8, 0.04, matSen);
let phi = 0, phiObj = 0;
function curvas() {
  tubo(u => new THREE.Vector3(LONG * u, A * Math.cos(ang(LONG * u) + phi), -W), NP * 36, 0.05, matCos, null, cosC);
  tubo(u => new THREE.Vector3(LONG * u, -W, A * Math.sin(ang(LONG * u) + phi)), NP * 36, 0.05, matSen, null, senC);
  helG.rotation.x = phi;
  // fasor del plano t = 0, su ángulo φ y la marca A
  const p0 = new THREE.Vector3(0, A * Math.cos(phi), A * Math.sin(phi));
  fasor0.poner(new THREE.Vector3(0, 0, 0), p0);
  arcoPhi.visible = phiLab.visible = phi > 0.02;
  if (arcoPhi.visible) {
    tubo(u => new THREE.Vector3(0, 0.42 * Math.cos(phi * u), 0.42 * Math.sin(phi * u)), 24, 0.016, BAS(AMBAR), null, arcoPhi);
    phiLab.position.set(0, 0.7 * Math.cos(phi / 2), 0.7 * Math.sin(phi / 2));
  }
  aLab.position.set(0, 0.6 * Math.cos(phi) - 0.2 * Math.sin(phi), 0.6 * Math.sin(phi) + 0.2 * Math.cos(phi));
  panelTxt();
}
const fasor0 = flecha(0.034, LAM(AZUL));
const arcoPhi = new THREE.Mesh(); raiz.add(arcoPhi);
const phiLab = rotulo('φ', 0, 0.5, 0.2, 0.55, '#f0b44a');
const aLab = rotulo('A', 0, 0.6, 0.2, 0.5, '#9ec5ff');
// Re positivo y negativo del eje Re para el arco: referencia (eje Re en t = 0 ya está dibujado)

// ---- el punto que recorre la hélice, con su fasor y sus proyecciones
const punto = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), BAS(AMBAR)); raiz.add(punto);
const fasorP = flecha(0.026, LAM(AZUL));
const rayoC = seg(0.011, BAS(AMBAR, { transparent: true, opacity: 0.75 })), rayoS = seg(0.011, BAS(AMBAR, { transparent: true, opacity: 0.75 }));
const rayoR = seg(0.008, BAS(CLARO, { transparent: true, opacity: 0.35 }));
const ptC = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), BAS(AZUL)), ptS = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), BAS(VERDE));
const ptR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), BAS(CLARO));
raiz.add(ptC, ptS, ptR);
const eje = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), BAS(AZUL)); raiz.add(eje);
const sombras = [cosC, senC, ptC, ptS, rayoC, rayoS];
function mover(x) {
  const th = ang(x) + phi, y = A * Math.cos(th), z = A * Math.sin(th);
  const P = new THREE.Vector3(x, y, z), O = new THREE.Vector3(x, 0, 0);
  punto.position.copy(P); eje.position.copy(O); fasorP.poner(O, P);
  ptC.position.set(x, y, -W); ptS.position.set(x, -W, z); ptR.position.set(0, y, z);
  colocar(rayoC, P, ptC.position); colocar(rayoS, P, ptS.position); colocar(rayoR, P, ptR.position);
  if (vistaAct === 'frente') rayoC.visible = rayoS.visible = false;
}

// rótulos de las paredes
const rCos = rotulo('Re–t · cosenoide', LONG * 0.82, W + 0.3, -W, 0.95, '#58a6ff');
const rSen = rotulo('Im–t · senoide', LONG * 0.82, -W - 0.3, W, 0.95, '#3fb950');
const rCirc = rotulo('Re–Im · círculo', 1.2, W + 0.3, 0.9, 0.95, '#c8d2dd');

// ---- textos del panel (números calculados)
const f = (v, d) => v.toFixed(d).replace('.', ',').replace('-', '−');
const GRADOS = [0, 45, 90], HEX = ['#58a6ff', '#d29922', '#a371f7'];
let vistaAct = 'obl', estIdx = 0, pausa = false;
function panelTxt() {
  if (!panel) return;
  const g = GRADOS[estIdx], r = g * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  const ade = g === 0 ? 'No está adelantada: es un coseno puro.' : 'Llega a cada máximo ' + f(g / 360, 3) + '·T antes que el coseno puro (adelanto de ' + g + '°).';
  const L = {
    obl: ['La hélice es el número complejo A·e^(j(ωt + φ)) al avanzar el tiempo: da una vuelta por período T y avanza a lo largo del eje t.',
          'Re hacia arriba, como en la figura del fasor; Im hacia el frente. En t = 0 el fasor forma φ = ' + g + '° con el eje Re.',
          'Sus sombras: pared azul (Re–t), A·cos(ωt + φ); pared verde (Im–t), A·sen(ωt + φ); a la izquierda, el círculo de radio A.'],
    costado: ['Se ve Re contra t: la sombra azul es la cosenoide, x(t) = A·cos(ωt + φ).',
              'En t = 0 vale A·cos ' + g + '° = ' + f(c, 3) + '·A. ' + ade],
    arriba: ['Se ve Im contra t: la sombra verde es la senoide, y(t) = A·sen(ωt + φ). En esta vista Im crece hacia abajo.',
             'En t = 0 vale A·sen ' + g + '° = ' + f(s, 3) + '·A. Es la cosenoide corrida un cuarto de período: sen(θ) = cos(θ − 90°).'],
    frente: ['Mirada por el eje t, la hélice se ve como un círculo de radio A en el plano Re–Im: el plano complejo de la figura del fasor (Re hacia arriba, Im hacia la izquierda).',
             'La flecha forma con Re el ángulo ωt + φ; en t = 0 vale φ = ' + g + '°. Su altura es la cosenoide y su desvío lateral, la senoide.']
  }[vistaAct];
  panel.innerHTML = '<b style="color:' + HEX[estIdx] + '">φ = ' + g + '°' + (pausa ? ' · en pausa' : '') + '</b>' + L.map(l => '<span>' + l + '</span>').join('');
}

// ---- cámara, controles y botones
const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true; ctl.minDistance = 4; ctl.maxDistance = 90; ctl.target.set(0, 0, 0);
// dirección desde el blanco, ángulo de visión y mitades del ancho y del alto que tienen que entrar
const VISTAS = {
  obl: { dir: [0.5, 0.42, 0.75], fov: 28, hw: 6.2, hh: 3.1 }, costado: { dir: [0, 0, 1], fov: 26, hw: 6.0, hh: 2.7 },
  arriba: { dir: [0, 1, 0.0001], fov: 26, hw: 6.0, hh: 2.7 }, frente: { dir: [1, 0, 0], fov: 6, hw: 2.3, hh: 2.3 }
};
const VISTAS_N = { obl: { dir: [0.95, 0.5, 0.55], fov: 28, hw: 4.6, hh: 3.2 } };
const NOM = { obl: 'Oblicua', costado: 'De costado', arriba: 'Desde arriba', frente: 'De frente' };
let tocado = false;
ctl.addEventListener('start', () => { tocado = true; });
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
function distancia(V) { const t = Math.tan(V.fov * Math.PI / 360), a = cam.aspect || 1.6; return 1.08 * Math.max(V.hw / (t * a), V.hh / t); }
function vista(v) {
  vistaAct = v; tocado = false; rCirc.visible = v !== 'arriba' && !(v === 'frente' && cam.aspect < 1.4); rCos.visible = rSen.visible = v !== 'frente'; sombras.forEach(m => { m.visible = v !== 'frente'; });  marcasT.forEach(m => { m.visible = v !== 'frente'; }); const V = (cam.aspect < 1.4 && VISTAS_N[v]) || VISTAS[v], d = new THREE.Vector3(...V.dir).normalize();
  cam.fov = V.fov; cam.updateProjectionMatrix(); cam.position.copy(d.multiplyScalar(distancia(V))); ctl.target.set(0, 0, 0); ctl.update();
  [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === v));
  panelTxt();
}
Object.keys(VISTAS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = NOM[v]; b.onclick = () => vista(v); bar.appendChild(b); });
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
let tw = null;   // transición de φ: { desde, hasta, t0 }
function estado(n) {
  if (n === 3) { pausa = !pausa; barc.children[3].classList.toggle('on', pausa); panelTxt(); return; }
  estIdx = n; tw = { desde: phi, hasta: GRADOS[n] * Math.PI / 180, t0: performance.now() }; phiObj = tw.hasta;
  [].forEach.call(barc.children, (b, i) => { if (i < 3) b.classList.toggle('on', i === n); }); panelTxt();
}
['φ = 0°', 'φ = 45°', 'φ = 90°', 'Pausa'].forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; if (i < 3) b.style.borderColor = HEX[i]; b.onclick = () => estado(i); barc.appendChild(b); });
let tAnim = 0, ultimo = performance.now();
const CICLO = 9;   // segundos que tarda el punto en recorrer los 3 períodos
curvas();
vista('obl'); estado(0); barc.children[0].classList.add('on');
function medir() {
  const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return;
  ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  const k = cam.aspect < 1.6 ? 1.45 : 1; ROTULOS.forEach(sp => sp.scale.set(2.4 * sp.userData.esc * k, 0.6 * sp.userData.esc * k, 1));
  if (!tocado) vista(vistaAct);
}
if (window.ResizeObserver) new ResizeObserver(medir).observe(div); medir();
// se dibuja solo mientras está a la vista; las animaciones van con el reloj
let visible = true;
if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(div);
(function cuadro() {
  requestAnimationFrame(cuadro);
  const ahora = performance.now(), dt = Math.min(ahora - ultimo, 100) / 1000; ultimo = ahora;
  if (!visible) return;
  if (!pausa) tAnim += dt;
  if (tw) {
    const k = Math.min((ahora - tw.t0) / 800, 1), e = k * k * (3 - 2 * k);
    phi = tw.desde + (tw.hasta - tw.desde) * e; curvas(); if (k >= 1) tw = null;
  }
  mover(LONG * ((tAnim / CICLO) % 1));
  ctl.update(); ren.render(esc, cam);
})();
return { vista, estado };
};
