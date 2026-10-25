/* Diagrama de radiación en 3D (antenas, antenas y enlace, radiación electromagnética).
   Uso: <div data-radiacion3d data-antena="media"></div> dentro de una <figure>, y este archivo (data-antena es opcional). Carga three.js r128 +
   OrbitControls solo cuando la figura se acerca a la pantalla; sin WebGL, la figura se oculta.
   Diagramas de potencia F(u), con θ medido desde el eje del dipolo:
     dipolo corto sen²θ · λ/2 [cos(π/2·cosθ)/senθ]² · λ [(cos(π·cosθ)+1)/senθ]²
     1,25λ [(cos(5π/4·cosθ) − cos(5π/4))/senθ]² · 3λ/2 [cos(3π/2·cosθ)/senθ]² · monopolo λ/4: el λ/2 sobre el plano
     Yagi: elemento λ/2 horizontal × factor de arreglo longitudinal (Hansen-Woodyard), una aproximación.
   Control (integración numérica): corto 1,76 dBi, λ/2 2,15 dBi, λ 3,82 dBi, 1,25λ 5,2 dBi, monopolo 5,16 dBi;
   haz a −3 dB del λ/2: 78°. */
(function () {
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var t = function (es, en) { return EN ? en : es; };
  var URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var URLOC = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

  var CSS = '.r3d{margin:0}.r3d-esc{position:relative;width:100%;aspect-ratio:16/10;min-height:260px;border-radius:6px;overflow:hidden;background:#11161d;touch-action:none}' +
    '.r3d-esc canvas{display:block;width:100%!important;height:100%!important}' +
    '.r3d-ayuda{position:absolute;right:8px;top:8px;font-size:12px;color:#8b949e;background:rgba(22,27,34,.75);padding:4px 8px;border-radius:6px;pointer-events:none}' +
    '.r3d-esca{position:absolute;left:8px;bottom:8px;font-size:11px;color:#c9d1d9;background:rgba(22,27,34,.8);padding:5px 8px;border-radius:6px;pointer-events:none}' +
    '.r3d-esca i{display:block;width:150px;height:8px;border-radius:3px;margin:3px 0;background:linear-gradient(90deg,#1f3b73,#2f81f7,#3fb950,#f2cc60,#f85149)}' +
    '.r3d-esca span{display:flex;justify-content:space-between}' +
    '.r3d-tira{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;margin-top:8px}' +
    '.r3d-ui{flex:1 1 300px;background:rgba(22,27,34,.9);border:1px solid #2a3140;border-radius:8px;padding:8px 12px;color:#e6edf3;font-size:13px}' +
    '.r3d-fila{display:flex;flex-wrap:wrap;gap:6px;margin:5px 0;align-items:center}' +
    '.r3d button{background:#1c2230;border:1px solid #2a3140;color:#e6edf3;border-radius:7px;padding:4px 9px;cursor:pointer;font:inherit;font-size:13px}' +
    '.r3d button.on{background:#1f6feb;border-color:#58a6ff}' +
    '.r3d label{font-size:13px;color:#c9d1d9;display:inline-flex;align-items:center;gap:4px;cursor:pointer}' +
    '.r3d-dato{font-size:13px;color:#9da7b3;margin-top:4px;line-height:1.5}' +
    '.r3d-polares{display:flex;gap:8px;flex:0 1 356px;max-width:100%}' +
    '.r3d-polares canvas{flex:1 1 0;min-width:0;width:50%;height:auto;background:rgba(22,27,34,.9);border:1px solid #2a3140;border-radius:8px}' +
    '@media (max-width:560px){.r3d-esc{aspect-ratio:1/1}.r3d-ayuda{display:none}}';

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

  // ---- Antenas: geometría (en longitudes de onda) y diagrama de potencia F(u), u unitario (x, y, z), y arriba
  var LAMBDA = 2.4;   // una longitud de onda, en unidades de la escena
  function dipolo(eje, tipo) {
    return function (u) {
      var c = u[0] * eje[0] + u[1] * eje[1] + u[2] * eje[2], s = Math.sqrt(Math.max(0, 1 - c * c));
      if (tipo === 'corto') return s * s;
      if (s < 1e-6) return 0;
      var v = tipo === 'media' ? Math.cos(Math.PI / 2 * c) / s :
        tipo === 'onda' ? (Math.cos(Math.PI * c) + 1) / s :
        tipo === 'cuarto' ? (Math.cos(1.25 * Math.PI * c) - Math.cos(1.25 * Math.PI)) / s : Math.cos(1.5 * Math.PI * c) / s;
      return v * v;
    };
  }
  function monopolo() {   // λ/4 sobre un plano de tierra ideal: el diagrama del dipolo λ/2, solo por encima del plano
    var dip = dipolo([0, 1, 0], 'media');
    return function (u) { return u[1] < 0 ? 0 : dip(u); };
  }
  function yagi(n, d, amp) {   // elementos horizontales (eje x) sobre un botalón en z; el haz apunta hacia +z
    var elem = dipolo([1, 0, 0], 'media'), k = 2 * Math.PI, del = Math.PI / n;
    return function (u) {
      var re = 0, im = 0;
      for (var i = 0; i < n; i++) {
        var f = k * d * i * u[2] - (k * d + del) * i;
        re += amp[i] * Math.cos(f); im += amp[i] * Math.sin(f);
      }
      return elem(u) * (re * re + im * im);
    };
  }
  var ANT = {
    corto: { n: t('Dipolo corto', 'Short dipole'), F: dipolo([0, 1, 0], 'corto'), L: 0.12, cortes: 'vert' },
    media: { n: t('Dipolo λ/2', 'λ/2 dipole'), F: dipolo([0, 1, 0], 'media'), L: 0.5, cortes: 'vert' },
    onda: { n: t('Dipolo λ', 'λ dipole'), F: dipolo([0, 1, 0], 'onda'), L: 1, cortes: 'vert' },
    cuarto: { n: t('Dipolo 1,25λ', '1.25λ dipole'), F: dipolo([0, 1, 0], 'cuarto'), L: 1.25, cortes: 'vert' },
    tres: { n: t('Dipolo 3λ/2', '3λ/2 dipole'), F: dipolo([0, 1, 0], 'tres'), L: 1.5, cortes: 'vert' },
    mono: { n: t('Monopolo λ/4', 'λ/4 monopole'), F: monopolo(), mono: true, cortes: 'vert' },
    yagi3: { n: t('Yagi 3 el.', 'Yagi 3 el.'), F: yagi(3, 0.2, [0.7, 1, 0.8]), yagi: [0.55, 0.5, 0.45], d: 0.2, cortes: 'hor' },
    yagi6: { n: t('Yagi 6 el.', 'Yagi 6 el.'), F: yagi(6, 0.25, [0.7, 1, 0.85, 0.8, 0.75, 0.7]), yagi: [0.55, 0.5, 0.45, 0.44, 0.43, 0.42], d: 0.25, cortes: 'hor' }
  };
  // Cortes: plano E (contiene al campo eléctrico) y plano H; e1 apunta a la derecha del gráfico polar
  var CORTES = {
    vert: { E: [[1, 0, 0], [0, 1, 0]], H: [[1, 0, 0], [0, 0, -1]] },
    hor: { E: [[0, 0, 1], [1, 0, 0]], H: [[0, 0, 1], [0, 1, 0]] }
  };
  function estadisticas(a) {   // máximo, directividad e integral, una vez por antena
    var N = 180, M = 360, max = 0, suma = 0, dir = null;
    for (var i = 0; i < N; i++) {
      var th = (i + 0.5) * Math.PI / N, st = Math.sin(th), ct = Math.cos(th);
      for (var j = 0; j < M; j++) {
        var ph = (j + 0.5) * 2 * Math.PI / M, u = [st * Math.cos(ph), ct, st * Math.sin(ph)], f = a.F(u);
        suma += f * st; if (f > max) { max = f; dir = u; }
      }
    }
    suma *= (Math.PI / N) * (2 * Math.PI / M);
    a.max = max; a.D = 4 * Math.PI * max / suma; a.dir = dir;
    var c = CORTES[a.cortes];
    a.haz = { E: haz(a, c.E), H: haz(a, c.H) };
    if (a.yagi) a.fe = 10 * Math.log10(a.F([0, 0, 1]) / Math.max(a.F([0, 0, -1]), 1e-12));
  }
  function punto(p, ang) { return [Math.cos(ang) * p[0][0] + Math.sin(ang) * p[1][0], Math.cos(ang) * p[0][1] + Math.sin(ang) * p[1][1], Math.cos(ang) * p[0][2] + Math.sin(ang) * p[1][2]]; }
  function haz(a, plano) {   // ancho del lóbulo principal a −3 dB en ese corte (grados), o null si es omnidireccional
    var n = 1440, v = [], imax = 0, i;
    for (i = 0; i < n; i++) { v.push(a.F(punto(plano, i * 2 * Math.PI / n)) / a.max); if (v[i] > v[imax]) imax = i; }
    if (Math.min.apply(null, v) > 0.5) return null;
    var izq = 0, der = 0;
    while (izq < n && v[(imax - izq + n) % n] >= 0.5) izq++;
    while (der < n && v[(imax + der) % n] >= 0.5) der++;
    return (izq + der - 1) * 360 / n;
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
    var botones = Object.keys(ANT).map(function (k) { return '<button data-ant="' + k + '"' + (k === (caja.getAttribute('data-antena') || 'media') ? ' class="on"' : '') + '>' + ANT[k].n + '</button>'; }).join('');
    caja.classList.add('r3d');
    caja.innerHTML =
      '<div class="r3d-esc"><div class="r3d-ayuda">' + t('Arrastra para girar · rueda para acercar', 'Drag to rotate · wheel to zoom') + '</div>' +
      '<div class="r3d-esca"></div></div>' +
      '<div class="r3d-tira"><div class="r3d-ui">' +
      '<div class="r3d-fila">' + t('Antena:', 'Antenna:') + ' ' + botones + '</div>' +
      '<div class="r3d-fila">' + t('Escala:', 'Scale:') + ' <button data-esc="db">' + t('Potencia en dB', 'Power in dB') + '</button><button data-esc="lin" class="on">' + t('Campo, lineal', 'Field, linear') + '</button></div>' +
      '<div class="r3d-fila"><label><input type="checkbox" data-v="lobulo" checked>' + t('diagrama', 'pattern') + '</label>' +
      '<label><input type="checkbox" data-v="cortes" checked>' + t('cortes E y H', 'E and H cuts') + '</label>' +
      '<label><input type="checkbox" data-v="ondas" checked>' + t('frentes de onda', 'wavefronts') + '</label>' +
      '<label><input type="checkbox" data-v="giro">' + t('giro automático', 'auto-rotate') + '</label></div>' +
      '<div class="r3d-fila">' + t('Cámara:', 'Camera:') + ' <button data-c="obl">' + t('Oblicua', 'Oblique') + '</button><button data-c="sup">' + t('Desde arriba', 'From above') + '</button><button data-c="lat">' + t('De costado', 'Side') + '</button></div>' +
      '<div class="r3d-dato"></div></div>' +
      '<div class="r3d-polares"><canvas data-p="E" width="200" height="214"></canvas><canvas data-p="H" width="200" height="214"></canvas></div></div>';
    var esc0 = caja.querySelector('.r3d-esc'), q = function (s) { return caja.querySelector(s); };

    var ren;
    try { ren = new THREE.WebGLRenderer({ antialias: true }); }
    catch (e) { caja.hidden = true; if (fig) fig.hidden = true; return; }
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    esc0.prepend(ren.domElement);
    var esc = new THREE.Scene(); esc.background = new THREE.Color(0x11161d);
    var cam = new THREE.PerspectiveCamera(42, 1.6, 0.1, 200);
    var ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true;
    ctl.maxDistance = 45; ctl.minDistance = 5; ctl.autoRotateSpeed = 1.2;
    function medir() {
      var w = esc0.clientWidth, h = esc0.clientHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h, false);
    }
    function vista(p) { cam.position.set(p[0], p[1], p[2]); ctl.target.set(0, -0.4, 0); ctl.update(); }
    var VISTAS = { obl: [13, 7.5, 14], sup: [0.01, 21, 0.01], lat: [20, 0.5, 0.01] };
    medir(); vista(VISTAS.obl);
    if (window.ResizeObserver) new ResizeObserver(medir).observe(esc0); else window.addEventListener('resize', medir);

    esc.add(new THREE.HemisphereLight(0xdde6f0, 0x20242c, 0.8));
    var sol = new THREE.DirectionalLight(0xffffff, 0.7); sol.position.set(8, 14, 12); esc.add(sol);
    var contra = new THREE.DirectionalLight(0x88aaff, 0.35); contra.position.set(-10, 4, -12); esc.add(contra);

    // Suelo, mástil y ejes de referencia
    var PISO = -6;
    var rej = new THREE.GridHelper(36, 36, 0x3a414c, 0x262c35); rej.position.y = PISO; esc.add(rej);
    var metal = new THREE.MeshStandardMaterial({ color: 0xc9d1d9, metalness: 0.8, roughness: 0.3 });
    var mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, -PISO - 0.25, 12), new THREE.MeshStandardMaterial({ color: 0x6e7681, metalness: 0.6, roughness: 0.5 }));
    mastil.position.y = (PISO - 0.25) / 2; esc.add(mastil);
    var antena = new THREE.Group(); esc.add(antena);

    // Diagrama: esfera deformada, coloreada por nivel
    var R = 4.6, esf = new THREE.SphereGeometry(1, 160, 90), base = esf.attributes.position.array.slice();
    esf.setAttribute('color', new THREE.BufferAttribute(new Float32Array(base.length), 3));
    var matLob = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.62, depthWrite: false });
    var lobulo = new THREE.Mesh(esf, matLob); esc.add(lobulo);
    var STOPS = [[0x1f, 0x3b, 0x73], [0x2f, 0x81, 0xf7], [0x3f, 0xb9, 0x50], [0xf2, 0xcc, 0x60], [0xf8, 0x51, 0x49]];
    function paleta(x) {   // 0 (−30 dB) … 1 (máximo)
      x = Math.max(0, Math.min(1, x)) * 4; var i = Math.min(3, Math.floor(x)), f = x - i, a = STOPS[i], b = STOPS[i + 1];
      return [(a[0] + (b[0] - a[0]) * f) / 255, (a[1] + (b[1] - a[1]) * f) / 255, (a[2] + (b[2] - a[2]) * f) / 255];
    }
    var escala = 'lin';   // el campo en escala lineal muestra la forma clásica (la rosquilla del dipolo)
    function nivel(f) {   // f normalizado (0…1) → [radio relativo, color 0…1]: dB desde −30, o campo lineal
      var db = 10 * Math.log10(Math.max(f, 1e-6)), c = Math.max(0, (db + 30) / 30);
      return escala === 'db' ? [c, c] : [Math.sqrt(f), Math.sqrt(f)];
    }

    // Cortes E y H dibujados sobre el diagrama
    function linea(color) { var l = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: color })); esc.add(l); return l; }
    var corteE = linea(0xf2cc60), corteH = linea(0xdb61a2);

    // Frentes de onda: puntos sobre esferas que se expanden; el brillo sigue al diagrama
    var NP = 2600, dirs = [], k;
    for (k = 0; k < NP; k++) {   // esfera de Fibonacci
      var yk = 1 - 2 * (k + 0.5) / NP, rk = Math.sqrt(1 - yk * yk), fk = k * Math.PI * (3 - Math.sqrt(5));
      dirs.push([rk * Math.cos(fk), yk, rk * Math.sin(fk)]);
    }
    var capas = [], NC = 4, RMAX = 9;
    for (var c = 0; c < NC; c++) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
      var pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      esc.add(pts); capas.push(pts);
    }
    var brillo = new Float32Array(NP), tonos = new Float32Array(NP * 3);

    var actual = ANT[caja.getAttribute('data-antena')] ? caja.getAttribute('data-antena') : 'media';
    function armarAntena(a) {
      while (antena.children.length) antena.remove(antena.children[0]);
      var r = 0.06, gap = 0.08;
      if (a.mono) {   // varilla de λ/4 sobre un disco de tierra con radiales
        var varilla = new THREE.Mesh(new THREE.CylinderGeometry(r, r, LAMBDA / 4, 12), metal);
        varilla.position.y = gap + LAMBDA / 8; antena.add(varilla);
        var disco = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.04, 48), new THREE.MeshStandardMaterial({ color: 0x59616c, metalness: 0.4, roughness: 0.6, transparent: true, opacity: 0.8 }));
        antena.add(disco);
        for (var i = 0; i < 8; i++) {
          var rad = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), metal);
          rad.rotation.z = Math.PI / 2; rad.rotation.y = i * Math.PI / 4; rad.position.set(Math.cos(i * Math.PI / 4) * 2.3, 0, -Math.sin(i * Math.PI / 4) * 2.3);
          antena.add(rad);
        }
        mastil.position.y = (PISO - 0.05) / 2; mastil.scale.y = (-PISO - 0.05) / (-PISO - 0.25);
      } else if (!a.yagi) {
        var mitad = Math.max(0.12, a.L * LAMBDA / 2);
        [1, -1].forEach(function (s) {
          var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, mitad - gap, 12), metal);
          m.position.y = s * (gap + (mitad - gap) / 2); antena.add(m);
        });
        mastil.position.y = (PISO - mitad - 0.3) / 2;   // hasta el extremo inferior del dipolo
        mastil.scale.y = (-PISO - mitad - 0.3) / (-PISO - 0.25);
      } else {
        var n = a.yagi.length, d = a.d * LAMBDA, z0 = -d * (n - 1) / 2;
        var botalon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, d * (n - 1) + 0.6, 10), new THREE.MeshStandardMaterial({ color: 0x8b949e, metalness: 0.6, roughness: 0.4 }));
        botalon.rotation.x = Math.PI / 2; botalon.position.y = -0.12; antena.add(botalon);
        a.yagi.forEach(function (L, i) {
          var e = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, L * LAMBDA, 10), i === 1 ? new THREE.MeshStandardMaterial({ color: 0xf2cc60, metalness: 0.5, roughness: 0.35 }) : metal);
          e.rotation.z = Math.PI / 2; e.position.z = z0 + i * d; antena.add(e);
        });
        // el diagrama se calcula con el reflector en el origen: se corre la antena para que coincida el centro de fase
        antena.position.z = 0; lobulo.position.z = z0; corteE.position.z = z0; corteH.position.z = z0;
        capas.forEach(function (p) { p.position.z = z0; });
        mastil.scale.y = (-PISO - 0.17) / (-PISO - 0.25); mastil.position.y = (PISO - 0.17) / 2;   // hasta el botalón
        return;
      }
      lobulo.position.z = 0; corteE.position.z = 0; corteH.position.z = 0;
      capas.forEach(function (p) { p.position.z = 0; });
    }

    function actualizar() {
      var a = ANT[actual], pos = esf.attributes.position.array, col = esf.attributes.color.array, i;
      if (a.max === undefined) estadisticas(a);
      armarAntena(a);
      for (i = 0; i < pos.length; i += 3) {
        var u = [base[i], base[i + 1], base[i + 2]], nv = nivel(a.F(u) / a.max), rr = R * nv[0], cc = paleta(nv[1]);
        pos[i] = u[0] * rr; pos[i + 1] = u[1] * rr; pos[i + 2] = u[2] * rr;
        col[i] = cc[0]; col[i + 1] = cc[1]; col[i + 2] = cc[2];
      }
      esf.attributes.position.needsUpdate = true; esf.attributes.color.needsUpdate = true; esf.computeVertexNormals();
      var cs = CORTES[a.cortes];
      [[corteE, cs.E], [corteH, cs.H]].forEach(function (par) {
        var arr = [];
        for (var j = 0; j < 360; j++) {
          var u = punto(par[1], j * Math.PI / 180), rr = R * nivel(a.F(u) / a.max)[0] * 1.01;
          arr.push(u[0] * rr, u[1] * rr, u[2] * rr);
        }
        par[0].geometry.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      });
      for (i = 0; i < NP; i++) {
        var f = a.F(dirs[i]) / a.max, cc2 = paleta(nivel(f)[1]);
        brillo[i] = Math.sqrt(f); tonos[3 * i] = cc2[0]; tonos[3 * i + 1] = cc2[1]; tonos[3 * i + 2] = cc2[2];
      }
      q('.r3d-esca').innerHTML = (escala === 'db' ? t('Potencia relativa', 'Relative power') + '<i></i><span><b>−30 dB</b><b>−15</b><b>0 dB</b></span>' :
        t('Campo relativo', 'Relative field') + '<i></i><span><b>0</b><b>' + (EN ? '0.5' : '0,5') + '</b><b>1</b></span>');
      var coma = function (v, d) { var s = v.toFixed(d); return EN ? s : s.replace('.', ','); };
      var hz = function (v) { return v === null ? t('omnidireccional', 'omnidirectional') : Math.round(v) + '°'; };
      var txt = t('Directividad: ', 'Directivity: ') + '<b>' + coma(10 * Math.log10(a.D), 2) + ' dBi</b> (' + coma(a.D, 2) + t(' veces', ' times') + ')<br>' +
        t('Ancho del haz a −3 dB: ', 'Half-power beamwidth: ') + '<span style="color:#f2cc60">' + t('plano E ', 'E-plane ') + hz(a.haz.E) + '</span> · <span style="color:#db61a2">' + t('plano H ', 'H-plane ') + hz(a.haz.H) + '</span>';
      if (a.yagi) txt += '<br>' + t('Relación frente-espalda: ', 'Front-to-back ratio: ') + coma(a.fe, 1) + ' dB · ' + t('aproximación por arreglo de elementos', 'element-array approximation');
      q('.r3d-dato').innerHTML = txt;
      polar('E', cs.E, a); polar('H', cs.H, a);
    }

    function polar(cual, plano, a) {
      var cv = q('canvas[data-p="' + cual + '"]'), g = cv.getContext('2d'), W = cv.width, cx = W / 2, cy = 116, Rp = 84, j;
      g.clearRect(0, 0, W, cv.height);
      g.fillStyle = cual === 'E' ? '#f2cc60' : '#db61a2'; g.font = 'bold 12px Segoe UI, sans-serif';
      g.fillText(t('Plano ', '') + cual + t('', '-plane'), 8, 16);
      g.strokeStyle = '#30363d'; g.lineWidth = 1; g.fillStyle = '#6e7681'; g.font = '10px Segoe UI, sans-serif';
      var anillos = escala === 'db' ? [[1, '0'], [2 / 3, '−10'], [1 / 3, '−20']] : [[1, '1'], [0.5, '0,5']];
      anillos.forEach(function (r) { g.beginPath(); g.arc(cx, cy, Rp * r[0], 0, 7); g.stroke(); g.fillText(EN ? r[1].replace(',', '.') : r[1], cx + 2, cy - Rp * r[0] + 10); });
      g.beginPath(); g.moveTo(cx - Rp, cy); g.lineTo(cx + Rp, cy); g.moveTo(cx, cy - Rp); g.lineTo(cx, cy + Rp); g.stroke();
      g.strokeStyle = cual === 'E' ? '#f2cc60' : '#db61a2'; g.lineWidth = 2; g.beginPath();
      for (j = 0; j <= 360; j++) {
        var ang = j * Math.PI / 180, rr = Rp * nivel(a.F(punto(plano, ang)) / a.max)[0];
        var x = cx + rr * Math.cos(ang), y = cy - rr * Math.sin(ang);
        if (j) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }

    // Controles
    caja.querySelectorAll('[data-ant]').forEach(function (b) {
      b.onclick = function () {
        actual = b.getAttribute('data-ant');
        caja.querySelectorAll('[data-ant]').forEach(function (x) { x.classList.toggle('on', x === b); });
        actualizar();
      };
    });
    caja.querySelectorAll('[data-esc]').forEach(function (b) {
      b.onclick = function () {
        escala = b.getAttribute('data-esc');
        caja.querySelectorAll('[data-esc]').forEach(function (x) { x.classList.toggle('on', x === b); });
        actualizar();
      };
    });
    var ver = { lobulo: true, cortes: true, ondas: true };
    caja.querySelectorAll('[data-v]').forEach(function (c) {
      c.onchange = function () {
        var v = c.getAttribute('data-v');
        if (v === 'giro') ctl.autoRotate = c.checked; else ver[v] = c.checked;
        lobulo.visible = ver.lobulo; corteE.visible = corteH.visible = ver.cortes;
        capas.forEach(function (p) { p.visible = ver.ondas; });
      };
    });
    caja.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { vista(VISTAS[b.getAttribute('data-c')]); }; });
    actualizar();

    // Animación de los frentes de onda; solo mientras está a la vista
    var visible = true, tAnt = 0, reloj = 0;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(esc0);
    ren.setAnimationLoop(function (ts) {
      var dt = tAnt ? Math.min(0.05, (ts - tAnt) / 1000) : 0; tAnt = ts;
      if (!visible) return;
      reloj += dt;
      if (ver.ondas) for (var c = 0; c < NC; c++) {
        var fr = ((reloj * 0.28 + c / NC) % 1), r = 0.4 + fr * RMAX, luz = Math.min(1, fr * 6) * (1 - fr);
        var p = capas[c].geometry.attributes.position.array, co = capas[c].geometry.attributes.color.array;
        for (var i = 0; i < NP; i++) {
          p[3 * i] = dirs[i][0] * r; p[3 * i + 1] = dirs[i][1] * r; p[3 * i + 2] = dirs[i][2] * r;
          var b = brillo[i] * luz;
          co[3 * i] = tonos[3 * i] * b; co[3 * i + 1] = tonos[3 * i + 1] * b; co[3 * i + 2] = tonos[3 * i + 2] * b;
        }
        capas[c].geometry.attributes.position.needsUpdate = true; capas[c].geometry.attributes.color.needsUpdate = true;
      }
      ctl.update(); ren.render(esc, cam);
    });
  }

  function arrancar() {
    var cajas = document.querySelectorAll('[data-radiacion3d]');
    if (!cajas.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    cajas.forEach(iniciar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
