/* Enlace de microondas con zona de Fresnel en 3D (antenas y enlace, enlaces de microondas).
   Uso: <div data-fresnel3d></div> dentro de una <figure>, y este archivo. Con data-enlace="30,11,22,no" arranca
   con otro caso: distancia en km, frecuencia en GHz, altura de las dos torres en m y obstáculo (colina, edificio o no). Carga three.js r128 +
   OrbitControls solo cuando la figura se acerca a la pantalla; sin WebGL, la figura se oculta.
   Cuentas (d, d1, d2 en km; f en GHz; alturas en m):
     radio de la primera zona   r1 = 17,32·√(d1·d2 / (f·d))
     abultamiento terrestre     h = d1·d2 / (12,74·k)
     despeje c = altura de la línea de vista − tope del obstáculo; v = −c·√(2·d / (λ·d1·d2)) (todo en m)
     pérdida por filo de cuchillo J(v) = 6,9 + 20·log(√((v − 0,1)² + 1) + v − 0,1) dB, para v > −0,78
     espacio libre 92,45 + 20·log f + 20·log d dB
   Control: 10 km, 5,8 GHz → r1 en el centro 11,37 m; 2,4 GHz, 50 km → 39,5 m; abultamiento 25·25/(12,74·4/3) = 36,8 m.
   Escala: la vertical (y el ancho) se exagera: 1 m = 0,1 unidades; el trayecto mide siempre 24 unidades. */
(function () {
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var t = function (es, en) { return EN ? en : es; };
  var URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var URLOC = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

  var CSS = '.f3d{margin:0}.f3d-esc{position:relative;width:100%;aspect-ratio:16/10;min-height:260px;border-radius:6px;overflow:hidden;background:#11161d;touch-action:none}' +
    '.f3d-esc canvas{display:block;width:100%!important;height:100%!important}' +
    '.f3d-ayuda{position:absolute;right:8px;top:8px;font-size:12px;color:#8b949e;background:rgba(22,27,34,.75);padding:4px 8px;border-radius:6px;pointer-events:none}' +
    '.f3d-nota{position:absolute;left:8px;bottom:8px;font-size:11px;color:#c9d1d9;background:rgba(22,27,34,.8);padding:4px 8px;border-radius:6px;pointer-events:none}' +
    '.f3d-nota i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 3px 0 8px;vertical-align:-1px}' +
    '.f3d-tira{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;margin-top:8px}' +
    '.f3d-ui{flex:1 1 320px;background:rgba(22,27,34,.9);border:1px solid #2a3140;border-radius:8px;padding:8px 12px;color:#e6edf3;font-size:13px}' +
    '.f3d-fila{display:flex;flex-wrap:wrap;gap:6px;margin:5px 0;align-items:center}' +
    '.f3d button{background:#1c2230;border:1px solid #2a3140;color:#e6edf3;border-radius:7px;padding:4px 9px;cursor:pointer;font:inherit;font-size:13px}' +
    '.f3d button.on{background:#1f6feb;border-color:#58a6ff}' +
    '.f3d input[type=range]{width:110px}' +
    '.f3d-dato{font-size:13px;color:#9da7b3;margin-top:4px;line-height:1.55}' +
    '.f3d-perfil{flex:0 1 360px;max-width:100%;height:auto;background:rgba(22,27,34,.9);border:1px solid #2a3140;border-radius:8px}' +
    '@media (max-width:560px){.f3d-esc{aspect-ratio:1/1}.f3d-ayuda{display:none}}';

  function cargar(src) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s);
    });
  }
  var three = null;
  function conThree() {
    if (!three) three = (window.THREE ? Promise.resolve() : cargar(URL3)).then(function () {
      return THREE.OrbitControls ? null : cargar(URLOC);
    });
    return three;
  }
  function hayWebGL() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }

  function iniciar(caja) {
    var fig = caja.closest('figure');
    function fallar() { caja.hidden = true; if (fig) fig.hidden = true; }
    if (!hayWebGL()) { fallar(); return; }
    var io0 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io0.disconnect();
      conThree().then(function () { armar(caja, fig); }).catch(fallar);
    }, { rootMargin: '400px' });
    io0.observe(fig || caja);
  }

  function armar(caja, fig) {
    var FRECS = [0.9, 2.4, 5.8, 11, 23];
    var coma = function (v, d) { var s = v.toFixed(d).replace('-', '−'); return EN ? s : s.replace('.', ','); };
    var fTxt = function (f) { return f < 1 ? Math.round(f * 1000) + ' MHz' : coma(f, f % 1 ? 1 : 0) + ' GHz'; };
    var desl = function (id, txt, min, max, paso, val) {
      return '<label style="display:inline-flex;align-items:center;gap:6px">' + txt + ' <input type="range" data-s="' + id + '" min="' + min + '" max="' + max + '" step="' + paso + '" value="' + val + '"><span data-st="' + id + '" style="min-width:52px"></span></label>';
    };
    caja.classList.add('f3d');
    caja.innerHTML =
      '<div class="f3d-esc"><div class="f3d-ayuda">' + t('Arrastra para girar · rueda para acercar', 'Drag to rotate · wheel to zoom') + '</div>' +
      '<div class="f3d-nota">' + t('Escala vertical exagerada', 'Vertical scale exaggerated') +
      '<i style="background:#f2cc60"></i>' + t('dentro de la 1.ª zona', 'inside 1st zone') + '<i style="background:#f85149"></i>' + t('dentro del 60 %', 'inside 60 %') + '</div></div>' +
      '<div class="f3d-tira"><div class="f3d-ui">' +
      '<div class="f3d-fila">' + t('Frecuencia:', 'Frequency:') + ' ' + FRECS.map(function (f) { return '<button data-f="' + f + '"' + (f === 5.8 ? ' class="on"' : '') + '>' + fTxt(f) + '</button>'; }).join('') + '</div>' +
      '<div class="f3d-fila">' + desl('d', t('Distancia', 'Distance'), 1, 50, 1, 10) + '</div>' +
      '<div class="f3d-fila">' + desl('h1', t('Torre A', 'Tower A'), 5, 100, 1, 30) + desl('h2', t('Torre B', 'Tower B'), 5, 100, 1, 30) + '</div>' +
      '<div class="f3d-fila">' + t('Obstáculo:', 'Obstacle:') + ' <button data-o="colina" class="on">' + t('Colina', 'Hill') + '</button><button data-o="edificio">' + t('Edificio', 'Building') + '</button><button data-o="no">' + t('Ninguno', 'None') + '</button></div>' +
      '<div class="f3d-fila">' + desl('ho', t('Altura', 'Height'), 0, 100, 1, 15) + desl('xo', t('Posición', 'Position'), 5, 95, 1, 50) + '</div>' +
      '<div class="f3d-fila">' + t('Factor k:', 'k factor:') + ' <button data-k="1.3333" class="on">' + t('4/3 (normal)', '4/3 (standard)') + '</button><button data-k="1">1</button><button data-k="0.6667">' + t('2/3 (subrefracción)', '2/3 (sub-refraction)') + '</button></div>' +
      '<div class="f3d-fila">' + t('Cámara:', 'Camera:') + ' <button data-c="obl">' + t('Oblicua', 'Oblique') + '</button><button data-c="perfil">' + t('De perfil', 'Profile') + '</button><button data-c="torre">' + t('Desde la torre A', 'From tower A') + '</button></div>' +
      '<div class="f3d-dato"></div></div>' +
      '<canvas class="f3d-perfil" width="360" height="190"></canvas></div>';
    var esc0 = caja.querySelector('.f3d-esc'), q = function (s) { return caja.querySelector(s); };

    var ren;
    try { ren = new THREE.WebGLRenderer({ antialias: true }); }
    catch (e) { caja.hidden = true; if (fig) fig.hidden = true; return; }
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    esc0.prepend(ren.domElement);
    var esc = new THREE.Scene(); esc.background = new THREE.Color(0x11161d);
    esc.fog = new THREE.Fog(0x11161d, 40, 90);
    var cam = new THREE.PerspectiveCamera(42, 1.6, 0.05, 200);
    var ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true;
    ctl.maxDistance = 60; ctl.minDistance = 3;
    function medir() {
      var w = esc0.clientWidth, h = esc0.clientHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h, false);
    }
    medir();
    if (window.ResizeObserver) new ResizeObserver(medir).observe(esc0); else window.addEventListener('resize', medir);

    esc.add(new THREE.HemisphereLight(0xdfe8f2, 0x2a2f22, 0.85));
    var sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(-6, 18, 10); esc.add(sol);

    // Estado y cuentas (unidades reales: km, GHz, m)
    var P = { f: 5.8, d: 10, h1: 30, h2: 30, ho: 15, xo: 50, obs: 'colina', k: 4 / 3 };
    var caso = (caja.getAttribute('data-enlace') || '').split(',');
    if (caso.length === 4) { P.d = +caso[0]; P.f = +caso[1]; P.h1 = P.h2 = +caso[2]; P.obs = caso[3]; }
    caja.querySelectorAll('[data-s]').forEach(function (r) { r.value = P[r.getAttribute('data-s')]; });
    caja.querySelectorAll('[data-f]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-f') === P.f); });
    caja.querySelectorAll('[data-o]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-o') === P.obs); });
    var SV = 0.1, LX = 24, ZM = 110;   // escala vertical y lateral (unidades por m), largo del trayecto, medio ancho del terreno en m
    var X = function (km) { return -LX / 2 + LX * km / P.d; };
    function abult(km) { return km * (P.d - km) / (12.74 * P.k); }
    function ondula(km, z) { return 1.4 * Math.sin(Math.PI * km / P.d) * (Math.sin(km / P.d * 11 + z * 0.012) + 0.5 * Math.sin(z * 0.02 - km / P.d * 6)); }
    function colina(km, z) {
      if (P.obs !== 'colina') return 0;
      var w = 0.09 * P.d, x0 = P.d * P.xo / 100;
      return P.ho * Math.exp(-Math.pow((km - x0) / w, 2)) * Math.exp(-Math.pow(z / 95, 2));
    }
    function suelo(km, z) { return abult(km) + ondula(km, z) + colina(km, z); }
    function los(km) { return P.h1 + (P.h2 - P.h1) * km / P.d; }
    function lambda() { return 0.3 / P.f; }   // m
    function r1(km) { return Math.sqrt(Math.max(0, lambda() * km * 1000 * (P.d - km) * 1000 / (P.d * 1000))); }
    function qz(km, z, y) {   // distancia al eje del enlace en radios de la primera zona
      var r = r1(km); if (r <= 0) return 9;
      return Math.hypot(y - los(km), z) / r;
    }

    // Terreno
    var NX = 220, NZ = 56, XM = 2.5;   // XM: unidades de terreno más allá de cada torre
    var ter = new THREE.PlaneGeometry(LX + 2 * XM, 2 * ZM * SV, NX, NZ);
    ter.rotateX(-Math.PI / 2);
    ter.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ter.attributes.position.count * 3), 3));
    var terreno = new THREE.Mesh(ter, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false }));
    esc.add(terreno);
    var baseX = [], baseZ = [];
    for (var i = 0; i < ter.attributes.position.count; i++) { baseX.push(ter.attributes.position.getX(i)); baseZ.push(ter.attributes.position.getZ(i)); }

    // Edificio
    var edificio = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x8b949e, roughness: 0.7 }));
    esc.add(edificio);
    var ventanas = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1, 1.01), new THREE.MeshStandardMaterial({ color: 0x1f2a38, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.55, wireframe: true }));
    edificio.add(ventanas);

    // Torres con antenas parabólicas
    function torre() {
      var g = new THREE.Group(), blanco = new THREE.MeshStandardMaterial({ color: 0xe6edf3, roughness: 0.6 }), rojo = new THREE.MeshStandardMaterial({ color: 0xe5534b, roughness: 0.6 });
      var fuste = new THREE.Group(); g.add(fuste);
      for (var j = 0; j < 7; j++) { var s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 1 / 7, 8), j % 2 ? blanco : rojo); s.position.y = (j + 0.5) / 7; fuste.add(s); }
      var plato = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 12, 0, Math.PI * 2, 0, 0.75), new THREE.MeshStandardMaterial({ color: 0xd0d7de, roughness: 0.35, metalness: 0.4, side: THREE.DoubleSide }));
      plato.rotation.z = Math.PI / 2; g.add(plato);
      var foco = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2cc60, emissive: 0x8a6d00 }));
      g.add(foco);
      g.userData = { fuste: fuste, plato: plato, foco: foco };
      esc.add(g); return g;
    }
    var tA = torre(), tB = torre();

    // Zona de Fresnel (primera y 60 %), línea de vista y pulsos
    var matZ1 = new THREE.MeshStandardMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, roughness: 0.4 });
    var matZ6 = new THREE.MeshStandardMaterial({ color: 0x3fb950, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, roughness: 0.4 });
    var z1 = new THREE.Mesh(new THREE.BufferGeometry(), matZ1), z6 = new THREE.Mesh(new THREE.BufferGeometry(), matZ6);
    var z1h = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.35 }));
    esc.add(z1, z6, z1h);
    var linea = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xf2cc60 }));
    esc.add(linea);
    var pulsos = [];
    for (i = 0; i < 7; i++) { var pu = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b8 })); esc.add(pu); pulsos.push(pu); }

    var A = new THREE.Vector3(), B = new THREE.Vector3();
    function actualizar() {
      var pos = ter.attributes.position, col = ter.attributes.color, j;
      for (j = 0; j < pos.count; j++) {
        var x = baseX[j], zm = baseZ[j] / SV, km = (x + LX / 2) / LX * P.d;
        var g = suelo(km, zm);
        pos.setY(j, g * SV);
        var c, qq = (km > 0 && km < P.d) ? qz(km, zm, g) : 9;
        if (qq < 0.6) c = [0.97, 0.32, 0.29];
        else if (qq < 1) c = [0.95, 0.80, 0.38];
        else { var v = 0.62 + 0.14 * Math.sin(km / P.d * 9 + zm * 0.013) * Math.cos(zm * 0.017 - km / P.d * 4); c = [0.16 * v, 0.42 * v + 0.1, 0.17 * v]; }
        col.setXYZ(j, c[0], c[1], c[2]);
      }
      pos.needsUpdate = true; col.needsUpdate = true; ter.computeVertexNormals();

      // edificio
      var x0 = P.d * P.xo / 100, gb = abult(x0) + ondula(x0, 0);
      edificio.visible = P.obs === 'edificio' && P.ho > 0;
      if (edificio.visible) {
        var ancho = Math.max(0.5, LX * 0.03);
        edificio.scale.set(ancho, P.ho * SV, 40 * SV); edificio.position.set(X(x0), (gb + P.ho / 2) * SV, 0);
        var qt = qz(x0, 0, gb + P.ho);
        edificio.material.color.setHex(qt < 0.6 ? 0xf85149 : qt < 1 ? 0xf2cc60 : 0x8b949e);
      }

      // torres
      [[tA, 0, P.h1, 1], [tB, P.d, P.h2, -1]].forEach(function (a) {
        var tr = a[0], xs = X(a[1]), base = suelo(a[1], 0) * SV, alto = a[2] * SV;
        tr.position.set(xs, base, 0);
        tr.userData.fuste.scale.set(1, alto, 1);
        tr.userData.plato.position.set(a[3] * 0.18, alto, 0); tr.userData.plato.rotation.z = a[3] * Math.PI / 2;
        tr.userData.foco.position.set(a[3] * 0.42, alto, 0);
      });
      A.set(X(0), (suelo(0, 0) + P.h1) * SV, 0); B.set(X(P.d), (suelo(P.d, 0) + P.h2) * SV, 0);
      linea.geometry.setFromPoints([A, B]);

      // elipsoides: anillos a lo largo del eje, radio en m × escala lateral
      [[z1, 1], [z6, 0.6]].forEach(function (par) {
        var NA = 90, NR = 28, verts = [], idx = [];
        for (var a = 0; a <= NA; a++) {
          var s = a / NA, km = s * P.d, r = r1(km) * par[1] * SV, cx = X(km), cy = los(km) * SV;
          for (var b = 0; b <= NR; b++) { var ang = b / NR * 2 * Math.PI; verts.push(cx, cy + r * Math.cos(ang), r * Math.sin(ang)); }
        }
        for (a = 0; a < NA; a++) for (var b2 = 0; b2 < NR; b2++) {
          var p0 = a * (NR + 1) + b2, p1 = p0 + NR + 1;
          idx.push(p0, p1, p0 + 1, p1, p1 + 1, p0 + 1);
        }
        var g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g2.setIndex(idx); g2.computeVertexNormals();
        par[0].geometry.dispose(); par[0].geometry = g2;
      });
      var seg = [];
      for (var a2 = 1; a2 < 12; a2++) {   // anillos de referencia sobre la primera zona
        var km2 = a2 / 12 * P.d, rr = r1(km2) * SV, cx2 = X(km2), cy2 = los(km2) * SV;
        for (var b3 = 0; b3 < 32; b3++) {
          var t0 = b3 / 32 * 2 * Math.PI, t1 = (b3 + 1) / 32 * 2 * Math.PI;
          seg.push(cx2, cy2 + rr * Math.cos(t0), rr * Math.sin(t0), cx2, cy2 + rr * Math.cos(t1), rr * Math.sin(t1));
        }
      }
      z1h.geometry.dispose(); z1h.geometry = new THREE.BufferGeometry(); z1h.geometry.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));

      datos(); perfil();
    }

    // Peor punto del trayecto: el de menor despeje relativo sobre el eje (z = 0)
    function peor() {
      var mejor = { q: 9, km: P.d / 2 };
      for (var j = 1; j < 400; j++) {
        var km = j / 400 * P.d, x0 = P.d * P.xo / 100, g = suelo(km, 0);
        if (P.obs === 'edificio' && Math.abs(km - x0) < 0.015 * P.d) g = Math.max(g, abult(x0) + ondula(x0, 0) + P.ho);
        var r = r1(km), c = los(km) - g, qq = c / r;
        if (qq < mejor.q) mejor = { q: qq, km: km, c: c, r: r, g: g };
      }
      return mejor;
    }
    function datos() {
      var lam = lambda(), w = peor(), d1 = w.km * 1000, d2 = (P.d - w.km) * 1000, D = P.d * 1000;
      var v = -w.c * Math.sqrt(2 * D / (lam * d1 * d2));
      var J = v > -0.78 ? 6.9 + 20 * Math.log10(Math.sqrt((v - 0.1) * (v - 0.1) + 1) + v - 0.1) : 0;
      var fspl = 92.45 + 20 * Math.log10(P.f) + 20 * Math.log10(P.d);
      var estado = w.c < 0 ? '<b style="color:#f85149">' + t('Línea de vista obstruida', 'Line of sight blocked') + '</b>' :
        w.q < 0.6 ? '<b style="color:#f2cc60">' + t('Despeje insuficiente (menos del 60 % libre)', 'Insufficient clearance (less than 60 % clear)') + '</b>' :
          '<b style="color:#3fb950">' + t('Despeje suficiente (60 % o más libre)', 'Sufficient clearance (60 % or more clear)') + '</b>';
      q('.f3d-dato').innerHTML = 'λ = ' + coma(lam * 100, lam < 0.1 ? 2 : 1) + ' cm · ' + t('radio de la 1.ª zona en el centro: ', '1st-zone radius at mid-path: ') + '<b>' + coma(r1(P.d / 2), 1) + ' m</b> · ' +
        t('abultamiento terrestre: ', 'earth bulge: ') + coma(abult(P.d / 2), 1) + ' m<br>' +
        t('Punto más comprometido a ', 'Tightest point at ') + coma(w.km, 1) + ' km: ' + t('despeje ', 'clearance ') + coma(w.c, 1) + ' m = ' + Math.round(w.q * 100) + ' % ' + t('del radio (', 'of the radius (') + coma(w.r, 1) + ' m)<br>' +
        estado + (J > 0.05 ? t(' · pérdida por difracción ≈ ', ' · diffraction loss ≈ ') + coma(J, 1) + ' dB' : '') + ' · ' + t('espacio libre ', 'free space ') + coma(fspl, 1) + ' dB';
    }

    // Perfil del trayecto en unidades reales (el clásico de los proyectos de enlace)
    var pc = q('.f3d-perfil').getContext('2d');
    function perfil() {
      var W = 360, H = 190, x0 = 34, x1 = W - 10, y0 = H - 22, y1 = 20, j, km;
      var top = Math.max(P.h1, P.h2) + r1(P.d / 2) + 5, bot = Math.min(0, abult(P.d / 2) - 5);
      top = Math.max(top, abult(P.d / 2) + P.ho + 5);
      var sx = function (k) { return x0 + (x1 - x0) * k / P.d; }, sy = function (m) { return y0 - (y0 - y1) * (m - bot) / (top - bot); };
      pc.clearRect(0, 0, W, H);
      pc.font = '10px Segoe UI, sans-serif'; pc.fillStyle = '#8b949e'; pc.strokeStyle = '#30363d'; pc.lineWidth = 1;
      var paso = top - bot > 120 ? 50 : top - bot > 50 ? 20 : 10;
      for (var m = Math.ceil(bot / paso) * paso; m <= top; m += paso) { pc.beginPath(); pc.moveTo(x0, sy(m)); pc.lineTo(x1, sy(m)); pc.stroke(); pc.fillText(m + ' m', 2, sy(m) + 3); }
      pc.fillText('0', x0 - 3, H - 6); pc.fillText(P.d + ' km', x1 - 28, H - 6);
      // zona de Fresnel
      pc.fillStyle = 'rgba(88,166,255,.18)'; pc.beginPath();
      for (j = 0; j <= 100; j++) { km = j / 100 * P.d; pc.lineTo(sx(km), sy(los(km) + r1(km))); }
      for (j = 100; j >= 0; j--) { km = j / 100 * P.d; pc.lineTo(sx(km), sy(los(km) - r1(km))); }
      pc.fill();
      pc.strokeStyle = '#3fb950'; pc.setLineDash([3, 3]); pc.beginPath();
      for (j = 0; j <= 100; j++) { km = j / 100 * P.d; pc.lineTo(sx(km), sy(los(km) - 0.6 * r1(km))); }
      pc.stroke(); pc.setLineDash([]);
      // terreno
      pc.fillStyle = '#2d5a32'; pc.beginPath(); pc.moveTo(sx(0), y0 + 20);
      for (j = 0; j <= 200; j++) {
        km = j / 200 * P.d; var g = suelo(km, 0);
        if (P.obs === 'edificio' && Math.abs(km - P.d * P.xo / 100) < 0.015 * P.d) g = abult(P.d * P.xo / 100) + ondula(P.d * P.xo / 100, 0) + P.ho;
        pc.lineTo(sx(km), sy(g));
      }
      pc.lineTo(sx(P.d), y0 + 20); pc.fill();
      // línea de vista y torres
      pc.strokeStyle = '#f2cc60'; pc.lineWidth = 1.5; pc.beginPath(); pc.moveTo(sx(0), sy(los(0))); pc.lineTo(sx(P.d), sy(los(P.d))); pc.stroke();
      pc.strokeStyle = '#e6edf3'; pc.lineWidth = 2; pc.beginPath(); pc.moveTo(sx(0), sy(0)); pc.lineTo(sx(0), sy(P.h1)); pc.moveTo(sx(P.d), sy(0)); pc.lineTo(sx(P.d), sy(P.h2)); pc.stroke();
      pc.fillStyle = '#c9d1d9'; pc.font = 'bold 11px Segoe UI, sans-serif';
      pc.fillText(t('Perfil del trayecto (escala real en metros)', 'Path profile (real scale in metres)'), x0, 12);
    }

    // Controles
    function texto(id) {
      var v = P[id], s = id === 'd' ? v + ' km' : id === 'xo' ? v + ' %' : v + ' m';
      q('[data-st="' + id + '"]').textContent = s;
    }
    caja.querySelectorAll('[data-s]').forEach(function (r) {
      var id = r.getAttribute('data-s'); texto(id);
      r.oninput = function () { P[id] = +r.value; texto(id); actualizar(); };
    });
    function grupo(attr, fn) {
      caja.querySelectorAll('[' + attr + ']').forEach(function (b) {
        b.onclick = function () {
          caja.querySelectorAll('[' + attr + ']').forEach(function (x) { x.classList.toggle('on', x === b); });
          fn(b.getAttribute(attr)); actualizar();
        };
      });
    }
    grupo('data-f', function (v) { P.f = +v; });
    grupo('data-o', function (v) { P.obs = v; });
    grupo('data-k', function (v) { P.k = +v; });
    function vista(cual) {
      if (cual === 'perfil') { cam.position.set(0, 3.5, 31); ctl.target.set(0, 2.2, 0); }
      else if (cual === 'torre') { cam.position.set(A.x - 1.4, A.y + 0.55, 0.5); ctl.target.set(B.x, B.y, 0); }
      else { cam.position.set(5, 18, 24); ctl.target.set(0, 0.6, 0); }
      ctl.update();
    }
    caja.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { vista(b.getAttribute('data-c')); }; });
    actualizar(); vista('obl');

    // Pulsos que viajan por la línea de vista; solo se anima mientras está a la vista
    var visible = true, tAnt = 0, reloj = 0, tmp = new THREE.Vector3();
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(esc0);
    ren.setAnimationLoop(function (ts) {
      var dt = tAnt ? Math.min(0.05, (ts - tAnt) / 1000) : 0; tAnt = ts;
      if (!visible) return;
      reloj += dt;
      pulsos.forEach(function (p, j) { var s = (reloj * 0.18 + j / pulsos.length) % 1; p.position.copy(tmp.copy(A).lerp(B, s)); });
      ctl.update(); ren.render(esc, cam);
    });
  }

  function arrancar() {
    var cajas = document.querySelectorAll('[data-fresnel3d]');
    if (!cajas.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    cajas.forEach(iniciar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
