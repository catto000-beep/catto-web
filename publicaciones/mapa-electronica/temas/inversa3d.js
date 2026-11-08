/* Maqueta 3D de la ley de la inversa del cuadrado (página «Decibeles y niveles sonoros»).
   Misma técnica que la vivienda (vivienda3d.js): three.js r128 y OrbitControls. Una fuente puntual emite frentes
   de onda esféricos; una pirámide de ángulo sólido fijo sale de la fuente y corta las esferas de 1 m, 2 m y 4 m.
   Los parches cortados tienen área 1, 4 y 16 cuadritos (cada cuadrito vale lo mismo en los tres), así que la
   misma potencia se reparte en 1, 4 y 16 partes: intensidad 1, 1/4, 1/16 y nivel L, L − 6,02 dB, L − 12,04 dB.
   InversaTres(div, panel) → arma la escena en div y escribe la cuenta en panel.
   Coordenadas: la fuente en el origen, la pirámide sale hacia +x; 1 m = 3 unidades. */
window.InversaTres = function (div, panel) {
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x1c2733);
esc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.8));
const sol = new THREE.DirectionalLight(0xffffff, 0.6); sol.position.set(-6, 14, 10); esc.add(sol);

// ---- datos: se calculan, no se escriben a ojo
const U = 3;                                   // unidades por metro
const ABERT = 0.50;                            // abertura angular de la pirámide (rad), igual hacia los dos lados
const RADIOS = [1, 2, 4];                      // metros
const N = RADIOS.map(r => r / RADIOS[0]);      // cuadritos por lado: 1, 2, 4
const AREA = N.map(n => n * n);                // 1, 4, 16
const INT = AREA.map(a => 1 / a);              // 1, 1/4, 1/16
const DB = INT.map(i => 10 * Math.log10(i));   // 0, −6,02, −12,04
const L0 = 100;                                // nivel a 1 m del ejemplo de la página
const FRAC = ['1', '1/4', '1/16'];
const coma = (x, d) => x.toFixed(d).replace('.', ',').replace('-', '−');
const COL = ['#3fb950', '#58a6ff', '#a371f7'];          // 1 m, 2 m, 4 m
const COLH = [0x3fb950, 0x58a6ff, 0xa371f7];
const AMB = 0xd29922, REMAX = 4 * U * 1.12;

// ---- rótulos: Sprite con CanvasTexture, hasta 2 líneas, texto con borde oscuro
function rotulo(lineas, x, y, z, escala, colores) {
  const cv = document.createElement('canvas'); cv.width = 768; cv.height = lineas.length > 1 ? 176 : 100; const c = cv.getContext('2d');
  c.textAlign = 'center'; c.lineWidth = 9; c.lineJoin = 'round';
  lineas.forEach((txt, i) => {
    let fs = 50; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif';
    while (c.measureText(txt).width > 740 && fs > 26) { fs -= 2; c.font = 'bold ' + fs + 'px Segoe UI, system-ui, sans-serif'; }
    const yy = lineas.length > 1 ? 56 + i * 68 : 68;
    c.strokeStyle = 'rgba(13,17,23,.9)'; c.strokeText(txt, 384, yy); c.fillStyle = colores[i] || '#ffffff'; c.fillText(txt, 384, yy);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.scale.set(5 * escala, 5 * escala * cv.height / 768, 1); sp.position.set(x, y, z); sp.renderOrder = 10; esc.add(sp); return sp;
}

// dirección (guiñada u alrededor de y, cabeceo v) a radio R
const dir = (u, v, R) => new THREE.Vector3(R * Math.cos(v) * Math.cos(u), R * Math.sin(v), -R * Math.cos(v) * Math.sin(u));

// ---- fuente y eje
const fuente = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshBasicMaterial({ color: 0xf2cc60 })); esc.add(fuente);
const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, REMAX, 6), new THREE.MeshBasicMaterial({ color: 0x4a5568 }));
eje.rotation.z = -Math.PI / 2; eje.position.x = REMAX / 2; esc.add(eje);
rotulo(['fuente puntual'], 0, 1.1, 0, 0.8, ['#f2cc60']);

// ---- pirámide: 4 aristas y 4 caras muy tenues
{
  const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => dir(a * ABERT / 2, b * ABERT / 2, REMAX));
  const pos = []; for (let i = 0; i < 4; i++) pos.push(0, 0, 0, q[i].x, q[i].y, q[i].z, q[(i + 1) % 4].x, q[(i + 1) % 4].y, q[(i + 1) % 4].z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  esc.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: AMB, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })));
  for (const p of q) {
    const l = p.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, l, 6), new THREE.MeshBasicMaterial({ color: AMB }));
    m.position.copy(p).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize()); esc.add(m);
  }
}

// ---- tres parches (radio r, 2r, 4r): n×n cuadritos separados por una rendija, para contarlos
const parches = RADIOS.map((r, k) => {
  const R = r * U, n = N[k], g = new THREE.Group(), tiles = [], inset = 0.1;
  const mat = new THREE.MeshBasicMaterial({ color: COLH[k], transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  const pos = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u0 = -ABERT / 2 + (i + inset) * ABERT / n, u1 = -ABERT / 2 + (i + 1 - inset) * ABERT / n;
    const v0 = -ABERT / 2 + (j + inset) * ABERT / n, v1 = -ABERT / 2 + (j + 1 - inset) * ABERT / n;
    const a = dir(u0, v0, R), b = dir(u1, v0, R), c = dir(u1, v1, R), d = dir(u0, v1, R);
    for (const p of [a, b, c, a, c, d]) pos.push(p.x, p.y, p.z);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.add(new THREE.Mesh(geo, mat));
  // marco del parche entero (contorno), siempre visible
  const borde = [];
  const S = 12; for (let e = 0; e < 4; e++) for (let s = 0; s < S; s++) {
    const f = t => { const w = -ABERT / 2 + ABERT * t; return [[w, -ABERT / 2], [ABERT / 2, w], [-w, ABERT / 2], [-ABERT / 2, -w]][e]; };
    const p = f(s / S), q = f((s + 1) / S), A = dir(p[0], p[1], R), B = dir(q[0], q[1], R);
    borde.push(A.x, A.y, A.z, B.x, B.y, B.z);
  }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(borde, 3));
  const bm = new THREE.LineBasicMaterial({ color: COLH[k], transparent: true }); g.add(new THREE.LineSegments(bg, bm));
  esc.add(g);
  // rótulos: arriba del parche, dos líneas (superficie e intensidad / nivel)
  const alto = R * ABERT / 2, yR = alto + 0.8 + k * 1.7;
  const t2 = k === 0 ? 'intensidad de referencia · 0 dB' : FRAC[k] + ' de la intensidad · ' + coma(DB[k], 2) + ' dB';
  const lab = rotulo([r + ' m · área ' + AREA[k], t2], R, yR, 0, 1.25, ['#e6edf3', '#e6edf3']);
  return { mat, bm, lab, R };
});

// ---- frentes de onda: sectores de esfera de radio 1 que se escalan; el opacity cae con la distancia (1/r²)
const SEC = 0.75, frentes = [];
{
  const pos = [], M = 20;
  const P = (i, j) => dir(-SEC + 2 * SEC * i / M, -SEC + 2 * SEC * j / M, 1);
  for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    for (const p of [a, b, c, a, c, d]) pos.push(p.x, p.y, p.z);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    esc.add(m); frentes.push(m);
  }
}
const PERIODO = 4.5;   // s que tarda un frente en ir de la fuente al borde
function animar(t) {
  frentes.forEach((m, i) => {
    const f = ((t / 1000 / PERIODO) + i / frentes.length) % 1, R = 0.3 + f * (REMAX - 0.3);
    m.scale.setScalar(R); m.material.opacity = 0.26 * Math.min(1, 1.6 / (R / U + 0.4)) * Math.min(1, (1 - f) * 3.5);
  });
}

// ---- marcas de distancia sobre el eje
RADIOS.forEach((r, k) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: COLH[k] })); m.position.x = r * U; esc.add(m);
});

// ---- textos del panel (mismas cuentas que la página: 100 dB a 1 m)
const HEX = ['#e6edf3', COL[0], COL[1], COL[2]];
function txt(k) {   // k: 0 todo; 1, 2, 3 = r, 2r, 4r
  if (k === 0) {
    return ['Los tres parches', ['El mismo ángulo sólido corta superficies de 1, 4 y 16 cuadritos a 1 m, 2 m y 4 m: la misma potencia se reparte en 1, 4 y 16 partes.',
      'Cada vez que la distancia se duplica, el nivel baja ' + coma(-DB[1], 2) + ' dB (≈ 6 dB). Con ' + L0 + ' dB a 1 m: ' + RADIOS.map((r, i) => coma(L0 + DB[i], 1) + ' dB a ' + r + ' m').join(', ') + '.']];
  }
  const i = k - 1, r = RADIOS[i];
  const cuenta = i === 0 ? 'Referencia: la potencia se reparte en 1 cuadrito. Intensidad I = 1 y nivel L (' + L0 + ' dB en el ejemplo).'
    : 'La superficie es ' + AREA[i] + ' veces mayor (' + N[i] + '×' + N[i] + ' cuadritos): I = 1/' + AREA[i] + ' de la de 1 m.';
  const niv = i === 0 ? 'ΔL = 10·log₁₀(1) = 0 dB, así que el nivel es L = ' + coma(L0, 1) + ' dB.'
    : 'ΔL = 10·log₁₀(1/' + AREA[i] + ') = ' + coma(DB[i], 2) + ' dB; con ' + L0 + ' dB a 1 m, a ' + r + ' m hay ' + coma(L0 + DB[i], 1) + ' dB.';
  return ['A ' + r + ' m (' + (i === 0 ? 'r' : N[i] + 'r') + ')', [cuenta, niv]];
}

// ---- cámara, controles y botones
const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true;
ctl.minDistance = 6; ctl.maxDistance = 45; ctl.target.set(6, 1.2, 0);
const VISTAS = { iso: [[-5, 7, 17], [6, 2.2, 0]], costado: [[6.4, 2.6, 21], [6.4, 2.6, 0]] };
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
const nombres = { iso: 'Oblicua', costado: 'De costado' };
let vistaAct = 'iso', tocada = false;
ctl.addEventListener('start', () => { tocada = true; });
function vista(v) {
  tocada = false;
  vistaAct = v; const t = new THREE.Vector3(...VISTAS[v][1]), f = Math.max(1, 1.4 / cam.aspect);   // en pantallas angostas, la cámara se aleja
  cam.position.copy(t).add(new THREE.Vector3(...VISTAS[v][0]).sub(t).multiplyScalar(f)); ctl.target.copy(t); ctl.update();
  [].forEach.call(bar.querySelectorAll('[data-v]'), b => b.classList.toggle('on', b.dataset.v === v));
}
Object.keys(VISTAS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = nombres[v]; b.onclick = () => vista(v); bar.appendChild(b); });
const barc = document.createElement('div'); barc.className = 'c3-vistas c3-circ'; div.appendChild(barc);
const ETQ = [['r', 1], ['2r', 2], ['4r', 3], ['Todo', 0]];
function estado(k) {
  parches.forEach((p, i) => {
    const on = k === 0 || k === i + 1;
    p.mat.opacity = on ? (k === 0 ? 0.55 : 0.8) : 0.08; p.bm.opacity = on ? 1 : 0.25; p.lab.material.opacity = on ? 1 : 0.28;
  });
  [].forEach.call(barc.children, b => b.classList.toggle('on', +b.dataset.k === k));
  if (panel) { const t = txt(k); panel.innerHTML = '<b style="color:' + HEX[k] + '">' + t[0] + '</b>' + t[1].map(l => '<span>' + l + '</span>').join(''); }
}
ETQ.forEach(([t, k]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = t; b.style.borderColor = HEX[k]; b.onclick = () => estado(k); barc.appendChild(b); });
vista('iso'); estado(0);
function medir() { const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); const a0 = cam.aspect; cam.aspect = w / h; cam.updateProjectionMatrix(); if (Math.abs(a0 - cam.aspect) > 0.05 && !tocada) vista(vistaAct); }
if (window.ResizeObserver) new ResizeObserver(medir).observe(div); medir();
// se dibuja solo mientras está a la vista
let visible = true;
if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(div);
(function cuadro() { requestAnimationFrame(cuadro); if (!visible) return; animar(performance.now()); ctl.update(); ren.render(esc, cam); })();
return { vista, estado, datos: { AREA, INT, DB } };
};
