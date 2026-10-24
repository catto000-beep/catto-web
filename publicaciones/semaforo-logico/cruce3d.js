/* Cruce 3D de la tarjeta del semáforo: dos calles de sentido único de un carril, un semáforo por calle.
   Calle A (izquierda → derecha, +x) y calle B (arriba → abajo, +z). Las luces las manda el circuito:
   CruceTres(div).paso(dt, luzA, luzB) con luz 'r' | 'a' | 'v'. La cámara se maneja con el mouse. */
window.CruceTres = function (div) {
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
ren.shadowMap.enabled = true; div.appendChild(ren.domElement);
ren.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:10px;touch-action:none';
const esc = new THREE.Scene(); esc.background = new THREE.Color(0x9fc4e8); esc.fog = new THREE.Fog(0x9fc4e8, 90, 180);
esc.add(new THREE.HemisphereLight(0xffffff, 0x445533, 0.75));
const sol = new THREE.DirectionalLight(0xffffff, 0.8); sol.position.set(30, 50, 20); sol.castShadow = true;
sol.shadow.camera.left = sol.shadow.camera.bottom = -60; sol.shadow.camera.right = sol.shadow.camera.top = 60; sol.shadow.mapSize.set(2048, 2048); esc.add(sol);
const M = c => new THREE.MeshLambertMaterial({ color: c });
function caja(w, h, d, c, x, y, z, padre) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (padre || esc).add(m); return m; }
// suelo, calles y veredas
caja(200, 0.2, 200, 0x5d8a3e, 0, -0.1, 0);
caja(200, 0.1, 7, 0x3a3d42, 0, 0.05, 0); caja(7, 0.1, 200, 0x3a3d42, 0, 0.05, 0);
for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
  caja(97, 0.3, 97, 0xb9b4a8, x * 52, 0.15, z * 52);
}
// sendas peatonales y líneas de detención
for (let i = -4; i <= 4; i++) { for (const s of [1, -1]) { if (Math.abs(i) < 3) { caja(1, 0.12, 3, 0xffffff, i * 1.3, 0.06, s * 6); caja(3, 0.12, 1, 0xffffff, s * 6, 0.06, i * 1.3); } } }
// flechas de sentido único pintadas en cada calle
function flecha(x, z, rot) { const g = new THREE.Group(); g.position.set(x, .07, z); g.rotation.y = rot; esc.add(g); caja(.5, .1, 3, 0xffffff, 0, 0, 0, g); const p = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.6, 3), M(0xffffff)); p.rotation.x = Math.PI / 2; p.position.z = 2.2; p.scale.y = .1; g.add(p); }
for (const d of [30, 60]) { flecha(0, -d, 0); flecha(-d, 0, Math.PI / 2); }
// ---- detalles de ciudad ----
const COLB = [0xe8d5b5, 0xd9a07a, 0xf1e6d0, 0xbfd3c1, 0xe7c3a3, 0xc9d6e3, 0xf0cfa0];
// casitas bajas de una planta con techo a dos aguas de tejas
function casita(x, z, col, rot) {
  const g = new THREE.Group(); g.position.set(x, .3, z); g.rotation.y = rot; esc.add(g);
  caja(8, 3.4, 7, col, 0, 1.7, 0, g);
  const techo = new THREE.Mesh(new THREE.CylinderGeometry(.01, 5.6, 3.6, 4, 1), M(0xa8452f));
  techo.rotation.y = Math.PI / 4; techo.scale.set(1, .55, .9); techo.position.y = 4.4; techo.castShadow = true; g.add(techo);
  caja(1.2, 2.2, .1, 0x6b4a2e, -1.8, 1.1, 3.55, g);                       // puerta
  caja(1.6, 1.2, .1, 0x9cc3e0, 1.8, 1.9, 3.55, g);                        // ventana
  caja(1.9, .15, .2, 0xffffff, 1.8, 1.25, 3.6, g);                        // alféizar
}
for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
  let n = 0;
  for (let a = 34; a < 100; a += 12) {
    casita(sx * a, sz * 10.5, COLB[(n++ + sx + 2 * sz + 7) % 7], sz > 0 ? Math.PI : 0);
    casita(sx * 10.5, sz * a, COLB[(n++ + 3) % 7], sx > 0 ? -Math.PI / 2 : Math.PI / 2);
  }
}
// cartel publicitario de calle
function cartel(x, z, rot) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 1024, 512); gr.addColorStop(0, '#1f6feb'); gr.addColorStop(1, '#a371f7');
  c.fillStyle = gr; c.fillRect(0, 0, 1024, 512);
  c.fillStyle = '#fff'; c.font = 'bold 190px Segoe UI, sans-serif'; c.textAlign = 'center'; c.fillText('catto.ar', 512, 270);
  c.font = '54px Segoe UI, sans-serif'; c.fillText('electrónica para aprender y enseñar', 512, 380);
  c.font = '150px serif'; c.fillText('🐷', 120, 170);
  const tex = new THREE.CanvasTexture(cv);
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; esc.add(g);
  caja(.35, 6, .35, 0x5f656d, -3.4, 3, 0, g); caja(.35, 6, .35, 0x5f656d, 3.4, 3, 0, g);
  caja(8.6, 4.6, .3, 0x30343a, 0, 7.6, -.05, g);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 4.1), new THREE.MeshBasicMaterial({ map: tex }));
  panel.position.set(0, 7.6, .12); g.add(panel);
}
cartel(15, 17, Math.atan2(-37, -41));
// árboles en la vereda, lejos de las esquinas
function arbol(x, z) {
  if (Math.hypot(x + 4.8, z + 8.5) < 16 || Math.hypot(x + 8.5, z - 4.8) < 16) return;   // nada cerca de los semáforos
  caja(.35, 2.4, .35, 0x6b4a2e, x, 1.5, z);
  const c = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), M([0x3f8f3a, 0x4c9a2a, 0x2f7d43][Math.abs(Math.round(x + z)) % 3]));
  c.position.set(x, 3.8, z); c.castShadow = true; esc.add(c);
}
// faroles de alumbrado
function farol(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; esc.add(g);
  caja(.2, 6.5, .2, 0x8a9099, 0, 3.3, 0, g); caja(.15, .15, 1.8, 0x8a9099, 0, 6.5, .9, g);
  const l = new THREE.Mesh(new THREE.BoxGeometry(.5, .25, .8), new THREE.MeshBasicMaterial({ color: 0xfff2c4 })); l.position.set(0, 6.35, 1.8); g.add(l);
}
// bancos y canteros
function banco(x, z, rot) { const g = new THREE.Group(); g.position.set(x, .3, z); g.rotation.y = rot; esc.add(g); caja(2.2, .15, .6, 0x8b5a2b, 0, .55, 0, g); caja(2.2, .6, .12, 0x8b5a2b, 0, .9, -.3, g); caja(.12, .55, .5, 0x333333, -.9, .27, 0, g); caja(.12, .55, .5, 0x333333, .9, .27, 0, g); }
for (const s of [1, -1]) for (let a = 16; a < 90; a += 10) {
  arbol(s * a, 5.2); arbol(s * a, -5.2); arbol(5.2, s * a); arbol(-5.2, s * a);
  if (a % 20 === 16 % 20) { farol(s * (a + 5), 4.6, Math.PI); farol(4.6, s * (a + 5), -Math.PI / 2); }
}
banco(-14, -6.3, 0); banco(14, 6.3, Math.PI); banco(6.3, -20, -Math.PI / 2);
// cordón: borde gris claro de la vereda contra la calzada
for (const s of [1, -1]) { caja(200, .32, .25, 0xd6d3cc, 0, .16, s * 3.6); caja(.25, .32, 200, 0xd6d3cc, s * 3.6, .16, 0); }
// nubes
for (let i = 0; i < 8; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 })); n.scale.set(2.2, .6, 1.2); n.position.set(-100 + i * 30, 55 + (i % 3) * 6, -80 + (i * 37) % 160); esc.add(n); }
// semáforos: uno por esquina, mirando al tránsito que llega
const semaf = [];
function semaforo(x, z, rot, grupo) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; esc.add(g);
  caja(.3, 5, .3, 0x30343a, 0, 2.5, 0, g); const cab = caja(1, 2.6, .8, 0x1c1f24, 0, 5.4, 0, g);
  const luces = [0xf85149, 0xf2cc60, 0x3fb950].map((c, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0x222222 })); m.position.set(0, 6.2 - i * .8, .42); g.add(m); m.userData.c = c; return m; });
  semaf.push({ luces, grupo });
}
// dos semáforos: uno por calle, en la esquina por la que llega el tránsito
semaforo(-4.8, -8.5, Math.PI, 'NS'); semaforo(-8.5, 4.8, -Math.PI / 2, 'EO');
// ciclo: 0 verde NS, 1 amarillo NS, 2 verde EO, 3 amarillo EO (con un instante de todo rojo)
// las luces las fija el circuito: 0 rojo, 1 amarillo, 2 verde
const LZ = { NS: 0, EO: 0 };
function color(gr) { return LZ[gr]; }
// autos
const autos = []; const COL = [0xe63946, 0x1d6fd8, 0xf4a261, 0x2a9d8f, 0xffffff, 0x6c757d, 0x9b5de5];
function auto(dir, carril, s) {
  const g = new THREE.Group(); esc.add(g);
  caja(2, 1, 4, COL[(autos.length * 3) % COL.length], 0, .8, 0, g); caja(1.8, .8, 2.2, 0xcfe8ff, 0, 1.6, -.2, g);
  for (const [x, z] of [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 14), M(0x111111)); r.rotation.z = Math.PI / 2; r.position.set(x, .42, z); g.add(r); }
  const a = { g, dir, s, v: 0 }; autos.push(a); return a;
}
// dir: 'N' (avanza hacia -z), 'S', 'E', 'O'
// dos calles de sentido único, de un solo carril: N–S baja hacia +z, E–O va hacia +x
const DIRS = { S: [0, 1, 0, 'NS'], E: [1, 0, 0, 'EO'] };
for (const d of ['S', 'E']) for (let k = 0; k < 4; k++) { const a = auto(d, 0, -20 - k * 22 - (d === 'E' ? 9 : 0)); a.off = 0; }
function ubicar(a) {
  const [dx, dz, off] = DIRS[a.dir];
  a.g.position.set(dx ? dx * a.s : a.off, 0, dz ? dz * a.s : a.off);
  a.g.rotation.y = Math.atan2(dx, dz);
}
const PARADA = -9.5, VMAX = 9;
function paso(dt) {
  for (const s of semaf) { const c = color(s.grupo); s.luces.forEach((l, i) => l.material.color.setHex(i === c ? l.userData.c : 0x222222)); }
  for (const a of autos) {
    const gr = DIRS[a.dir][3], luz = color(gr);
    // el auto de adelante en el mismo sentido
    let lim = 1e9; for (const b of autos) if (b !== a && b.dir === a.dir && b.off === a.off && b.s > a.s) lim = Math.min(lim, b.s - 6);
    if ((luz === 0 || (luz === 1 && a.s < PARADA - a.v * a.v / 28 - 1)) && a.s < PARADA + .5 && a.s > PARADA - 25) lim = Math.min(lim, PARADA);
    const dist = lim - a.s, vobj = dist < 1 ? 0 : Math.min(VMAX, dist * 1.2);
    a.v += Math.max(-14 * dt, Math.min(5 * dt, vobj - a.v)); a.s += a.v * dt;
    if (a.s > 95) { a.s = -95; a.v = VMAX * .7; }
    ubicar(a);
  }
}
const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
const ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.maxPolarAngle = Math.PI / 2.1; ctl.enableDamping = true;
const VISTAS = { iso: [[-30, 20, -32], [3, 3, 3]], arriba: [[0, 85, 0.1], [0, 0, 0]], calle: [[-1.5, 2.2, -32], [0, 2.5, 0]] };
const bar = document.createElement('div'); bar.className = 'c3-vistas'; div.appendChild(bar);
const nombres = { iso: 'Oblicua', arriba: 'Desde arriba', calle: 'Desde la calle' };
function vista(v) { cam.position.set(...VISTAS[v][0]); ctl.target.set(...VISTAS[v][1]); ctl.update(); [].forEach.call(bar.children, b => b.classList.toggle('on', b.dataset.v === v)); }
Object.keys(VISTAS).forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = nombres[v]; b.onclick = () => vista(v); bar.appendChild(b); });
vista('iso');
function medir() { const w = div.clientWidth, h = div.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
if (window.ResizeObserver) new ResizeObserver(medir).observe(div); medir();
const IDX = { r: 0, a: 1, v: 2 };
return { paso(dt, la, lb) { LZ.EO = IDX[la]; LZ.NS = IDX[lb]; paso(dt); ctl.update(); ren.render(esc, cam); } };
};
