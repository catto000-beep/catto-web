/* Maqueta 3D de la cóclea (página «El oído y la audición»). Misma técnica que la vivienda (vivienda3d.js):
   three.js r128 y OrbitControls; se gira con el mouse o el dedo.
   La membrana basilar, desenrollada, tiene 35 mm de largo y un ancho real de ≈0,1 mm en la base a ≈0,5 mm en el ápice
   (aquí exagerado ×10 desenrollada y ×2,5 enrollada, para que se vea). Cada frecuencia produce una onda viajera que
   crece desde la base, tiene su máximo en el lugar dado por la función de Greenwood para el humano,
   f = 165,4·(10^(2,1·x) − 0,88) con x = distancia relativa desde el ápice, y se apaga enseguida.
   La onda va en cámara lenta (0,5 ciclos por segundo) y su amplitud está muy exagerada.
   Referencia: D. D. Greenwood (1990), JASA 87.
   CocleaTres(div, panel) → arma la escena en div y escribe la explicación en panel.
   Coordenadas en milímetros: x a lo largo de la membrana (desenrollada), y hacia arriba. */
window.CocleaTres = function (div, panel) {
const L = 35, N = 260, DX = L / N, OMEGA = 2 * Math.PI * 0.5;
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.85));
const sol = new THREE.DirectionalLight(0xffffff, 0.6); sol.position.set(-8, 20, 14); esc.add(sol);
const raiz = new THREE.Group(); esc.add(raiz);

// ---- Greenwood: posición del máximo, en mm desde la base (ventana oval)
const xrel = f => Math.log10(f / 165.4 + 0.88) / 2.1;           // 0 en el ápice, 1 en la base
const dBase = f => (1 - xrel(f)) * L;
const FREQS = [[125, '125 Hz'], [500, '500 Hz'], [2000, '2 kHz'], [8000, '8 kHz']];
const coma = (v, d) => v.toFixed(d).replace('.', ',');

// ---- curvas: eje de la membrana desenrollada y enrollada (espiral cónica de 2,5 vueltas, longitud 35 mm)
const rectaP = [], rectaT = [], rectaS = [], espP = [], espT = [], espS = [];
for (let i = 0; i <= N; i++) { rectaP.push(new THREE.Vector3(i * DX - L / 2, 0, 0)); rectaT.push(new THREE.Vector3(1, 0, 0)); rectaS.push(new THREE.Vector3(0, 0, 1)); }
(function () {
  const TH = 2.5 * 2 * Math.PI, pt = (u, R) => new THREE.Vector3(R * (1 - 0.8 * u) * Math.cos(u * TH), 2 * R * u, R * (1 - 0.8 * u) * Math.sin(u * TH));
  const K = 6000, acum = [0]; let prev = pt(0, 1);
  for (let k = 1; k <= K; k++) { const q = pt(k / K, 1); acum.push(acum[k - 1] + q.distanceTo(prev)); prev = q; }
  const R = L / acum[K], us = [];
  for (let i = 0, k = 0; i <= N; i++) {
    const s = i * DX / R; while (k < K - 1 && acum[k + 1] < s) k++;
    const f = (s - acum[k]) / Math.max(1e-9, acum[k + 1] - acum[k]); us.push((k + f) / K);
  }
  const P = us.map(u => pt(u, R)), c = new THREE.Vector3(); P.forEach(p => c.add(p)); c.multiplyScalar(1 / P.length);
  P.forEach((p, i) => {
    espP.push(p.clone().sub(c));
    const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)]; espT.push(b.clone().sub(a).normalize());
    const th = us[i] * TH; espS.push(new THREE.Vector3(Math.cos(th), 0, Math.sin(th)));
  });
})();

// ---- rótulos (Sprite con CanvasTexture), texto con borde oscuro
const rotulos = [];
function pintar(sp, txt, color) {
  const cv = sp.material.map ? sp.material.map.image : document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  c.clearRect(0, 0, 512, 128);
  let fs = 54; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif';
  while (c.measureText(txt).width > 480 && fs > 30) { fs -= 2; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif'; }
  c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = 'rgba(13,17,23,.85)'; c.strokeText(txt, 256, 82);
  c.fillStyle = color || '#e6edf3'; c.fillText(txt, 256, 82);
  if (!sp.material.map) { sp.material.map = new THREE.CanvasTexture(cv); sp.material.needsUpdate = true; } else sp.material.map.needsUpdate = true;
}
function rotulo(txt, color, e) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  pintar(sp, txt, color); sp.renderOrder = 10; sp.userData.e = e || 1; raiz.add(sp); rotulos.push(sp); return sp;
}
let kRot = 1, m = 0;                                         // factor de tamaño de los rótulos y grado de enrollado (0 a 1)
function escalarRotulo(sp) { const k = sp.userData.e * kRot * (1 - 0.45 * m); sp.scale.set(8 * k, 2 * k, 1); }
const rBase = rotulo('base · agudos', '#e6edf3', 1), rApice = rotulo('ápice · graves', '#e6edf3', 1);
const rVent = rotulo('ventana oval', '#d29922', 0.85), rPico = rotulo('', '#d29922', 1);

// ---- membrana basilar (cinta con colores por vértice), conducto (4 aristas) y ventana oval
const geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 2 * 3), col = new Float32Array((N + 1) * 2 * 3);
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const idx = []; for (let i = 0; i < N; i++) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
const membrana = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: 0x3d4c5e })); membrana.frustumCulled = false; raiz.add(membrana);
const aristas = [0, 1, 2, 3].map(() => {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x8aa0b5, transparent: true, opacity: 0.6 })); l.frustumCulled = false; raiz.add(l); return l;
});
const ventana = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshLambertMaterial({ color: 0xd29922 })); raiz.add(ventana);
const pico = new THREE.Group(); raiz.add(pico);
const cono = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 14), new THREE.MeshLambertMaterial({ color: 0xf85149 })); cono.position.y = -1.1; pico.add(cono);
const tallo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0xf85149 })); tallo.position.y = -2.7; pico.add(tallo);

// ---- geometría actual según el grado de enrollado
const C = [], T = [], S = [], W = [], WD = [], HD = [];
for (let i = 0; i <= N; i++) { C.push(new THREE.Vector3()); T.push(new THREE.Vector3()); S.push(new THREE.Vector3()); W.push(0); WD.push(0); HD.push(0); }
let amp = 1.8;
const ancho = x => 0.1 + 0.4 * x / L;                         // ancho real de la membrana en mm (base 0,1; ápice 0,5)
function armar() {
  const ex = 10 - 8.8 * m;
  for (let i = 0; i <= N; i++) {
    C[i].lerpVectors(rectaP[i], espP[i], m); T[i].lerpVectors(rectaT[i], espT[i], m).normalize(); S[i].lerpVectors(rectaS[i], espS[i], m).normalize();
    W[i] = ex * ancho(i * DX); WD[i] = W[i] / 2 + 1.0 - 0.55 * m; HD[i] = 2.5 - 1.6 * m;
  }
  amp = 1.8 - 1.35 * m;
  const sg = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  aristas.forEach((l, k) => {
    const a = l.geometry.attributes.position.array;
    for (let i = 0; i <= N; i++) { a[3 * i] = C[i].x + S[i].x * WD[i] * sg[k][0]; a[3 * i + 1] = C[i].y + HD[i] * sg[k][1]; a[3 * i + 2] = C[i].z + S[i].z * WD[i] * sg[k][0]; }
    l.geometry.attributes.position.needsUpdate = true;
  });
  const t0 = T[0]; ventana.position.copy(C[0]).addScaledVector(t0, -0.45);
  ventana.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t0);
  const sv = 1.9 - 1.3 * m; ventana.scale.set(0.45 - 0.2 * m, sv, sv);
  const u = 1 - m;
  rBase.position.copy(C[0]).add(new THREE.Vector3(-4.9 * u + 3.6 * m, 1.4 * m, -0.9 * m));
  rApice.position.copy(C[N]).add(new THREE.Vector3(4.9 * u, 2.2 * m, 0));
  rVent.position.copy(C[0]).add(new THREE.Vector3(-1.8 * u + 3.6 * m, -3.0 * u - 0.4 * m, 2.6 * u + 0.9 * m));
  rotulos.forEach(escalarRotulo);
}

// ---- onda viajera sobre la membrana
let xpAct = dBase(FREQS[2][0]), xpMeta = xpAct, sel = 2;
const c0 = [0x2d / 255, 0xd4 / 255, 0xbf / 255], c1 = [0xa3 / 255, 0x71 / 255, 0xf7 / 255], cA = [0xff / 255, 0xc8 / 255, 0x3a / 255];
function onda(t) {
  const xp = xpAct, k0 = 5.03 / xp, sg = 2.6, ph = OMEGA * t;
  let thp = k0 * xp * 1.75;
  for (let i = 0; i <= N; i++) {
    const x = i * DX; let env, th;
    if (x <= xp) { const u = x / xp; env = Math.pow(u, 2.5); th = k0 * xp * (u + 0.75 * Math.pow(u, 4)); }
    else { const d = (x - xp) / sg; env = Math.exp(-d * d); th = thp + k0 * 4 * (x - xp); }
    const d = amp * env * Math.cos(th - ph), s = x / L, e2 = Math.pow(env, 1.3) * 0.85;
    for (let r = 0; r < 2; r++) {
      const q = 2 * i + r, sgn = r ? -1 : 1, o = 3 * q;
      pos[o] = C[i].x + S[i].x * W[i] * 0.5 * sgn; pos[o + 1] = C[i].y + d; pos[o + 2] = C[i].z + S[i].z * W[i] * 0.5 * sgn;
      for (let c = 0; c < 3; c++) col[o + c] = (c0[c] + (c1[c] - c0[c]) * s) * (1 - e2) + cA[c] * e2;
    }
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
  // marca del máximo: debajo de la membrana, en el punto xp
  const f = xp / DX, i0 = Math.min(N - 1, Math.floor(f)), a = f - i0, p = C[i0].clone().lerp(C[i0 + 1], a);
  const k = 1 - 0.6 * m; pico.position.copy(p); pico.scale.setScalar(k);
  const sd = S[i0].clone().lerp(S[i0 + 1], a);
  rPico.position.set(p.x + sd.x * 3.4 * m, p.y - 4.4 * k + 2.4 * m, p.z + 3.6 * (1 - m) + sd.z * 3.4 * m);
}

// ---- textos del panel
const VERDE = '#3fb950';
function texto() {
  const f = FREQS[sel][0], x = xrel(f), d = dBase(f), nom = FREQS[sel][1];
  const dat = JSON.stringify({ tipo: 'tono', f: f, dur: 3 });
  const l1 = 'Función de Greenwood: x = log<sub>10</sub>(f / 165,4 + 0,88) / 2,1 = ' + coma(x, 3) + ' desde el ápice, así que el máximo está a (1 − ' + coma(x, 3) + ') × 35&nbsp;mm = <b>' + coma(d, 1) + '&nbsp;mm</b> de la ventana oval.';
  const l2 = (f >= 4000 ? 'Un agudo hace vibrar la membrana cerca de la base: la parte angosta y rígida.' : f <= 250 ? 'Un grave recorre casi toda la cóclea antes de llegar a su máximo, en la parte ancha y flexible del ápice.' : 'El máximo cae a media cóclea: más allá de ese punto la onda se apaga y ya no llega al ápice.') +
    ' La onda va en cámara lenta, y la amplitud y el ancho de la membrana (real: 0,1 a 0,5&nbsp;mm) están exagerados.';
  panel.innerHTML = '<b style="color:' + VERDE + '">' + nom + ' · máximo a ' + coma(d, 1) + '&nbsp;mm de la base</b><span>' + l1 + '</span><span>' + l2 +
    ' <button class="esc" data-esc=\'' + dat + '\'>Escuchar ' + nom + '</button></span>';
  pintar(rPico, nom + ' · ' + coma(d, 1) + ' mm', '#f0b44a');
}

// ---- cámara, controles y botones
const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true; ctl.minDistance = 6; ctl.maxDistance = 90;
const DIR = { iso: new THREE.Vector3(-0.1, 0.6, 1), lado: new THREE.Vector3(0, 0.04, 1), arriba: new THREE.Vector3(0, 1, 0.03) };
const EXT = { des: { iso: [58, 22], lado: [60, 17], arriba: [56, 20] }, enr: { iso: [19, 17], lado: [19, 17], arriba: [17, 16] } };
let vistaAct = 'iso', forma = 'des', aspecto = 2.5, tween = null;
function destino() {
  const e0 = EXT[forma][vistaAct], e = [e0[0] * 1, e0[1]], tg = Math.tan(21 * Math.PI / 180), d = Math.max(e[1] / (2 * tg), e[0] / (2 * tg * aspecto)) * 1.06;
  const objetivo = new THREE.Vector3(0, forma === 'des' ? -0.8 : 0, 0);
  return { pos: objetivo.clone().addScaledVector(DIR[vistaAct].clone().normalize(), d), tg: objetivo };
}
let tocado = false; ctl.addEventListener('start', () => { tocado = true; });
function marcar() { [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === vistaAct)); }
function vista(v, brusco) {
  if (!DIR[v]) return; vistaAct = v; tocado = false; marcar();
  const d = destino();
  if (brusco) { cam.position.copy(d.pos); ctl.target.copy(d.tg); ctl.update(); tween = null; }
  else tween = { t0: performance.now(), p0: cam.position.clone(), g0: ctl.target.clone(), p1: d.pos, g1: d.tg };
}
function estado(i) {
  if (!FREQS[i]) return; sel = i; xpMeta = dBase(FREQS[i][0]);
  [].forEach.call(barc.children, (b, j) => b.classList.toggle('on', j === i)); texto();
}
let mMeta = 0;
function enrollar(clave) {
  forma = clave === 'enr' ? 'enr' : 'des'; mMeta = forma === 'enr' ? 1 : 0;
  btnForma.textContent = forma === 'enr' ? 'Desenrollada' : 'Enrollada'; btnForma.classList.toggle('on', forma === 'enr'); vista(vistaAct);
}
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
[['iso', 'Oblicua'], ['lado', 'Costado'], ['arriba', 'Arriba']].forEach(([v, t]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = t; b.onclick = () => vista(v); bar.appendChild(b); });
const btnForma = document.createElement('button'); btnForma.type = 'button'; btnForma.textContent = 'Enrollada'; btnForma.onclick = () => enrollar(forma === 'des' ? 'enr' : 'des'); bar.appendChild(btnForma);
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
FREQS.forEach(([f, t], i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.style.borderColor = VERDE; b.onclick = () => estado(i); barc.appendChild(b); });

function medir() {
  const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return;
  ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); aspecto = w / h;
  kRot = w < 600 ? 1.6 : 1; rotulos.forEach(escalarRotulo); if (!tocado && !tween) vista(vistaAct, true);
}
if (window.ResizeObserver) new ResizeObserver(medir).observe(div);
armar(); estado(2); vista('iso', true); medir();
let visible = true, tPrev = performance.now();
if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(div);
(function cuadro() {
  requestAnimationFrame(cuadro); if (!visible) { tPrev = performance.now(); return; }
  const ahora = performance.now(), dt = Math.min(0.4, (ahora - tPrev) / 1000); tPrev = ahora;
  if (Math.abs(m - mMeta) > 1e-4) { m += Math.sign(mMeta - m) * Math.min(Math.abs(mMeta - m), dt / 1.4); armar(); }
  xpAct += (xpMeta - xpAct) * (1 - Math.exp(-dt * 6));
  if (tween) {
    let u = Math.min(1, (ahora - tween.t0) / 1100); u = u * u * (3 - 2 * u);
    cam.position.lerpVectors(tween.p0, tween.p1, u); ctl.target.lerpVectors(tween.g0, tween.g1, u); if (u >= 1) tween = null;
  }
  onda(ahora / 1000); ctl.update(); ren.render(esc, cam);
})();
return { vista, estado, forma: enrollar, enrollar };
};
