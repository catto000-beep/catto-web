/* Campo magnético rotante en 3D (motores de CA, máquinas de CA, circuitos trifásicos).
   Uso: <div data-campo3d data-respaldo="idDeLaFiguraPlana"></div> dentro de una <figure>, y este archivo.
   Carga three.js r128 + OrbitControls solo cuando la figura se acerca a la pantalla; si no hay WebGL o
   no carga, el recuadro se oculta y queda la figura plana (data-respaldo), si la hay.
   Física: corrientes i_k = cos(ωt − k·120°) sobre ejes a 90° + k·120°; campo B = Σ i_k·eje_k.
   Imán: θ'' = 14·(m × B) − 3·θ'. Jaula: par ∝ (B × dB/dt) − |B|²·ω_r, con fricción para un 5 % de
   deslizamiento. Control: imán 0,250 vueltas/s con 12,8° de retraso; jaula 0,237 (5 %); secuencia
   invertida −0,237; una sola fase: el rotor no arranca. */
(function () {
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var t = function (es, en) { return EN ? en : es; };
  var URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var URLOC = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

  var CSS = '.c3d{margin:0}.c3d-esc{position:relative;width:100%;aspect-ratio:16/10;min-height:260px;border-radius:6px;overflow:hidden;background:#11161d;touch-action:none}' +
    '.c3d-esc canvas{display:block;width:100%!important;height:100%!important}' +
    '.c3d-ayuda{position:absolute;right:8px;top:8px;font-size:12px;color:#8b949e;background:rgba(22,27,34,.75);padding:4px 8px;border-radius:6px;pointer-events:none}' +
    '.c3d-tira{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;margin-top:8px}' +
    '.c3d-ui{flex:1 1 300px;background:rgba(22,27,34,.9);border:1px solid #2a3140;border-radius:8px;padding:8px 12px;color:#e6edf3;font-size:13px}' +
    '.c3d-fila{display:flex;flex-wrap:wrap;gap:6px;margin:5px 0;align-items:center}' +
    '.c3d button{background:#1c2230;border:1px solid #2a3140;color:#e6edf3;border-radius:7px;padding:4px 9px;cursor:pointer;font:inherit;font-size:13px}' +
    '.c3d button.on{background:#1f6feb;border-color:#58a6ff}' +
    '.c3d label{font-size:13px;color:#c9d1d9;display:inline-flex;align-items:center;gap:4px;cursor:pointer}' +
    '.c3d-dato{font-size:13px;color:#9da7b3;margin-top:4px;line-height:1.5}' +
    '.c3d-graf{flex:0 1 340px;max-width:100%;height:auto;background:rgba(22,27,34,.9);border:1px solid #2a3140;border-radius:8px}' +
    '.c3d-solo{display:none}.c3d-vivo .c3d-solo{display:inline}' +
    '@media (max-width:560px){.c3d-esc{aspect-ratio:1/1}.c3d-ayuda{display:none}}';

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
    var resp = caja.getAttribute('data-respaldo') && document.getElementById(caja.getAttribute('data-respaldo'));
    var fig = caja.closest('figure');
    function fallar() { caja.hidden = true; if (resp) resp.style.display = ''; else if (fig) fig.hidden = true; }
    if (!hayWebGL()) { fallar(); return; }
    var io0 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io0.disconnect();
      conThree().then(function () { armar(caja, resp, fig); }).catch(fallar);
    }, { rootMargin: '400px' });
    io0.observe(fig || caja);
  }

  function armar(caja, resp, fig) {
    caja.classList.add('c3d');
    caja.innerHTML =
      '<div class="c3d-esc"><div class="c3d-ayuda">' + t('Arrastra para girar · rueda para acercar', 'Drag to rotate · wheel to zoom') + '</div></div>' +
      '<div class="c3d-tira"><div class="c3d-ui">' +
      '<div class="c3d-fila"><button data-a="play">⏸ ' + t('Pausa', 'Pause') + '</button><button data-a="sec">' + t('Invertir secuencia', 'Reverse sequence') + '</button></div>' +
      '<div class="c3d-fila">' + t('Fases:', 'Phases:') +
      '<label><input type="checkbox" data-f="0" checked><b style="color:#f85149">R</b></label>' +
      '<label><input type="checkbox" data-f="1" checked><b style="color:#f2cc60">S</b></label>' +
      '<label><input type="checkbox" data-f="2" checked><b style="color:#58a6ff">T</b></label></div>' +
      '<div class="c3d-fila">' + t('Rotor:', 'Rotor:') +
      '<button data-r="jaula" class="on">' + t('Jaula (asincrónico)', 'Squirrel cage (induction)') + '</button>' +
      '<button data-r="iman">' + t('Imán (sincrónico)', 'Magnet (synchronous)') + '</button>' +
      '<button data-r="no">' + t('Sin rotor', 'No rotor') + '</button></div>' +
      '<div class="c3d-fila"><label><input type="checkbox" data-v="fases" checked>' + t('campo de cada fase', 'field of each phase') + '</label>' +
      '<label><input type="checkbox" data-v="res" checked>' + t('resultante', 'resultant') + '</label>' +
      '<label><input type="checkbox" data-v="gap" checked>' + t('entrehierro', 'air gap') + '</label></div>' +
      '<div class="c3d-fila">' + t('Velocidad:', 'Speed:') + ' <input type="range" min="0.05" max="1" step="0.05" value="0.25" style="width:110px"><span data-velt></span></div>' +
      '<div class="c3d-fila">' + t('Cámara:', 'Camera:') + ' <button data-c="frente">' + t('De frente', 'Front') + '</button><button data-c="obl">' + t('Oblicua', 'Oblique') + '</button></div>' +
      '<div class="c3d-dato"></div></div>' +
      '<canvas class="c3d-graf" width="340" height="140"></canvas></div>';
    var esc0 = caja.querySelector('.c3d-esc'), q = function (s) { return caja.querySelector(s); };

    var COL = [0xf85149, 0xf2cc60, 0x58a6ff], NOM = ['R', 'S', 'T'], CSSC = ['#f85149', '#f2cc60', '#58a6ff'];
    var N_COL = 0xe5534b, S_COL = 0x4c8dff, RES_COL = 0x3fb950;
    var EJE = [0, 1, 2].map(function (k) { return Math.PI / 2 + k * 2 * Math.PI / 3; });
    var ZF = 1.95;

    var ren;
    try { ren = new THREE.WebGLRenderer({ antialias: true }); }
    catch (e) { caja.hidden = true; if (resp) resp.style.display = ''; else if (fig) fig.hidden = true; return; }
    if (resp) resp.style.display = 'none';
    if (fig) fig.classList.add('c3d-vivo');
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    esc0.prepend(ren.domElement);
    var esc = new THREE.Scene(); esc.background = new THREE.Color(0x11161d);
    var cam = new THREE.PerspectiveCamera(42, 1.6, 0.1, 200);
    var ctl = new THREE.OrbitControls(cam, ren.domElement); ctl.enableDamping = true;
    ctl.maxDistance = 40; ctl.minDistance = 6;
    function medir() {
      var w = esc0.clientWidth, h = esc0.clientHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h, false);
    }
    function vista(p) {   // la cámara se aleja un poco para que entre el motor entero con sus cables
      var k = 1.18 * (esc0.clientWidth < 560 ? 1.02 : 1);
      cam.position.set(p[0] * k, p[1] * k, p[2] * k); ctl.target.set(0, 0.2, 0); ctl.update();
    }
    medir(); vista([10, 6.5, 13]);
    if (window.ResizeObserver) new ResizeObserver(medir).observe(esc0); else window.addEventListener('resize', medir);

    esc.add(new THREE.HemisphereLight(0xdde6f0, 0x20242c, 0.75));
    var sol = new THREE.DirectionalLight(0xffffff, 0.8); sol.position.set(8, 14, 12); esc.add(sol);
    var contra = new THREE.DirectionalLight(0x88aaff, 0.3); contra.position.set(-10, 4, -12); esc.add(contra);

    // Mesa
    var mesa = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 18), new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.9 }));
    mesa.position.y = -5.4; esc.add(mesa);
    var rej = new THREE.GridHelper(30, 30, 0x3a414c, 0x30363f); rej.position.y = -5.09; esc.add(rej);

    // Estator: corona de chapa con seis dientes
    var acero = new THREE.MeshStandardMaterial({ color: 0x7d8590, metalness: 0.55, roughness: 0.45 });
    var forma = new THREE.Shape(); forma.absarc(0, 0, 4.3, 0, Math.PI * 2, false);
    var hueco = new THREE.Path(); hueco.absarc(0, 0, 3.3, 0, Math.PI * 2, true); forma.holes.push(hueco);
    var corona = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 3, bevelEnabled: false, curveSegments: 64 }), acero);
    corona.position.z = -1.5; esc.add(corona);
    [-3, 3].forEach(function (x) { var p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 2.6), acero); p.position.set(x, -4.3, 0); esc.add(p); });
    var caja3 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.6), new THREE.MeshStandardMaterial({ color: 0x3d444d, metalness: 0.4, roughness: 0.5 }));
    caja3.position.set(0, 4.6, -0.3); esc.add(caja3);
    for (var k = 0; k < 3; k++) {
      var x = (k - 1) * 0.5;
      var curva = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 4.9, -0.8), new THREE.Vector3(x, 5.3, -2.6), new THREE.Vector3(x * 2, 4.2, -5.5), new THREE.Vector3(x * 3, -5, -7.5)]);
      esc.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.12, 8), new THREE.MeshStandardMaterial({ color: COL[k], roughness: 0.6 })));
    }

    // Dientes (polos) y bobinas: la bobina de cada fase abraza el diente de su eje y el opuesto
    var dientes = [];
    function etiqueta(txt, color) {
      var c = document.createElement('canvas'); c.width = 128; c.height = 64;
      var g = c.getContext('2d'); g.font = 'bold 44px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = color; g.fillText(txt, 64, 34);
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
      s.scale.set(1.4, 0.7, 1); return s;
    }
    for (k = 0; k < 3; k++) [1, -1].forEach(function (signo) {
      var a = EJE[k] + (signo < 0 ? Math.PI : 0);
      var grupo = new THREE.Group(); grupo.rotation.z = a - Math.PI / 2; esc.add(grupo);
      var mat = new THREE.MeshStandardMaterial({ color: 0x8b949e, metalness: 0.5, roughness: 0.45, emissive: 0x000000 });
      var d = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 3), mat); d.position.y = 2.85; grupo.add(d);
      var zapata = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 3), mat); zapata.position.y = 2.4; grupo.add(zapata);
      var cobre = new THREE.MeshStandardMaterial({ color: COL[k], metalness: 0.3, roughness: 0.5 });
      var b = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 3.7), cobre); b.position.y = 2.88; grupo.add(b);
      dientes.push({ mat: mat, fase: k, signo: signo });
      var e = etiqueta(signo > 0 ? NOM[k] : NOM[k] + '′', CSSC[k]);
      e.position.set(Math.cos(a) * 5.3, Math.sin(a) * 5.3, 1.6); esc.add(e);
    });

    // Flechas gruesas
    function flecha(color, grosor) {
      var g = new THREE.Group();
      var m = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 });
      var s = new THREE.Mesh(new THREE.CylinderGeometry(grosor, grosor, 1, 12), m);
      var c = new THREE.Mesh(new THREE.ConeGeometry(grosor * 2.8, 1, 16), m);
      g.add(s, c); g.userData = { s: s, c: c, h: grosor * 6 }; return g;
    }
    function fijar(f, ang, len, x0, y0) {
      if (len < 0) { ang += Math.PI; len = -len; }
      f.visible = len > 0.04;
      f.rotation.z = ang - Math.PI / 2;
      f.position.set(x0 || 0, y0 || 0, f.position.z);
      var h = Math.min(f.userData.h, len * 0.5), L = len - h;
      f.userData.s.scale.y = Math.max(L, 1e-3); f.userData.s.position.y = L / 2;
      f.userData.c.scale.y = h; f.userData.c.position.y = L + h / 2;
    }
    var fFase = [0, 1, 2].map(function (k) { var f = flecha(COL[k], 0.07); f.position.z = ZF; esc.add(f); return f; });
    var fRes = flecha(RES_COL, 0.12); fRes.position.z = ZF + 0.05; esc.add(fRes);
    var gap = [], NG = 48;
    for (var j = 0; j < NG; j++) { var fg = flecha(0x9be9a8, 0.025); fg.userData.h = 0.12; fg.position.z = ZF; esc.add(fg); gap.push(fg); }

    // Rotores; el eje sale solo por detrás, para no tapar las flechas del campo
    var rotor = new THREE.Group(); esc.add(rotor);
    var eje = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.6, 20), new THREE.MeshStandardMaterial({ color: 0xc9d1d9, metalness: 0.8, roughness: 0.25 }));
    eje.rotation.x = Math.PI / 2; eje.position.z = -3.2; rotor.add(eje);
    var iman = new THREE.Group(); rotor.add(iman);
    [[0, N_COL], [Math.PI, S_COL]].forEach(function (p) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 3.3, 40, 1, false, p[0], Math.PI), new THREE.MeshStandardMaterial({ color: p[1], roughness: 0.5 }));
      m.rotation.x = Math.PI / 2; iman.add(m);
    });
    var lN = etiqueta('N', '#ffffff'); lN.position.set(1.1, 0, 1.75); lN.scale.set(1, 0.5, 1); iman.add(lN);
    var lS = etiqueta('S', '#ffffff'); lS.position.set(-1.1, 0, 1.75); lS.scale.set(1, 0.5, 1); iman.add(lS);
    var jaula = new THREE.Group(); rotor.add(jaula);
    var nucleo = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 3.3, 40), acero); nucleo.rotation.x = Math.PI / 2; jaula.add(nucleo);
    var alu = new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.7, roughness: 0.3 });
    for (j = 0; j < 18; j++) {
      var a = j * 2 * Math.PI / 18, barra = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 3.3), j === 0 ? new THREE.MeshStandardMaterial({ color: 0xf2cc60 }) : alu);
      barra.position.set(Math.cos(a) * 1.98, Math.sin(a) * 1.98, 0); barra.rotation.z = a; jaula.add(barra);
    }
    [-1.65, 1.65].forEach(function (z) { var tr = new THREE.Mesh(new THREE.TorusGeometry(1.98, 0.14, 10, 48), alu); tr.position.z = z; jaula.add(tr); });

    // Estado
    var fase = 0, jugando = true, sec = 1, tipo = 'jaula', thR = Math.PI / 2, wR = 0, fHz = 0.25;
    var on = [true, true, true], ver = { fases: true, res: true, gap: true };
    function campo(ph) {
      var i = [0, 1, 2].map(function (k) { return on[k] ? Math.cos(ph - sec * k * 2 * Math.PI / 3) : 0; }), x = 0, y = 0;
      for (var k = 0; k < 3; k++) { x += i[k] * Math.cos(EJE[k]); y += i[k] * Math.sin(EJE[k]); }
      return { i: i, x: x, y: y };
    }
    function paso(dt) {
      var w = jugando ? 2 * Math.PI * fHz : 0, n = 10, h = dt / n;
      for (var s = 0; s < n; s++) {
        fase += w * h;
        var B = campo(fase), par;
        if (tipo === 'iman') {
          par = 14 * (Math.cos(thR) * B.y - Math.sin(thR) * B.x) - 3 * wR;
          wR += par * h; thR += wR * h;
        } else if (tipo === 'jaula') {
          var B2 = campo(fase + 1e-4);   // derivada numérica del campo
          var dx = (B2.x - B.x) / 1e-4 * w, dy = (B2.y - B.y) / 1e-4 * w;
          par = 2 * ((B.x * dy - B.y * dx) - (B.x * B.x + B.y * B.y) * wR) - 0.237 * wR;
          wR += par * h; thR += wR * h;
        } else wR = 0;
      }
    }
    var coma = function (v, d) { var s = v.toFixed(d); return EN ? s : s.replace('.', ','); };
    var dato = q('.c3d-dato');
    function dibujar() {
      var B = campo(fase), modulo = Math.hypot(B.x, B.y), ang = Math.atan2(B.y, B.x), K = 1.75;
      for (var k = 0; k < 3; k++) { fijar(fFase[k], EJE[k], K * B.i[k]); fFase[k].visible = fFase[k].visible && ver.fases; }
      fijar(fRes, ang, K * modulo); fRes.visible = fRes.visible && ver.res;
      for (var j = 0; j < NG; j++) {
        var a = j * 2 * Math.PI / NG, l = 0.32 * (B.x * Math.cos(a) + B.y * Math.sin(a)), r0 = 2.22 - l / 2;
        fijar(gap[j], a, l, Math.cos(a) * r0, Math.sin(a) * r0);   // centrada en el entrehierro
        gap[j].visible = gap[j].visible && ver.gap;
      }
      dientes.forEach(function (d) {   // el diente donde entra el campo es un polo sur; donde sale, norte
        var v = B.i[d.fase] * d.signo;
        d.mat.emissive.setHex(v > 0 ? S_COL : N_COL); d.mat.emissiveIntensity = Math.abs(v) * 0.55;
      });
      rotor.visible = tipo !== 'no'; iman.visible = tipo === 'iman'; jaula.visible = tipo === 'jaula';
      rotor.rotation.z = thR;
      var vc = jugando ? fHz * sec : 0, vr = wR / (2 * Math.PI);
      var txt = t('Campo: ', 'Field: ') + (modulo < 0.05 ? t('nulo en este instante', 'zero at this instant') :
        (Math.abs(modulo - 1.5) < 0.02 ? t('amplitud constante (1,5 veces la de una fase)', 'constant amplitude (1.5 times that of one phase)') :
          t('amplitud variable: no gira de forma pareja', 'varying amplitude: it does not rotate evenly'))) + '<br>';
      if (tipo !== 'no') txt += 'Rotor: ' + coma(vr, 2) + t(' vueltas/s', ' rev/s');
      if (tipo === 'jaula' && Math.abs(vc) > 0.01) txt += t(' · deslizamiento ', ' · slip ') + Math.round((1 - vr / vc) * 100) + ' %';
      dato.innerHTML = txt;
      grafico(B.i);
    }

    var gc = q('.c3d-graf').getContext('2d');
    function grafico(i) {
      var W = 340, H = 140, x0 = 30, x1 = W - 12, yc = 66, A = 42, k, p;
      gc.clearRect(0, 0, W, H);
      gc.strokeStyle = '#30363d'; gc.lineWidth = 1; gc.beginPath(); gc.moveTo(x0, yc); gc.lineTo(x1, yc); gc.stroke();
      gc.fillStyle = '#8b949e'; gc.font = '11px Segoe UI, sans-serif'; gc.fillText('i', 12, 24); gc.fillText('ωt', x1 - 14, yc + 16);
      [90, 180, 270].forEach(function (g) { var x = x0 + (x1 - x0) * g / 360; gc.fillText(g + '°', x - 10, H - 8); });
      for (k = 0; k < 3; k++) {
        if (!on[k]) continue;
        gc.strokeStyle = CSSC[k]; gc.lineWidth = 2; gc.beginPath();
        for (p = 0; p <= 360; p += 3) {
          var x = x0 + (x1 - x0) * p / 360, y = yc - A * Math.cos(p * Math.PI / 180 - sec * k * 2 * Math.PI / 3);
          if (p) gc.lineTo(x, y); else gc.moveTo(x, y);
        }
        gc.stroke();
      }
      var g = ((fase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), xc = x0 + (x1 - x0) * g / (2 * Math.PI);
      gc.strokeStyle = '#e6edf3'; gc.lineWidth = 1; gc.setLineDash([3, 3]); gc.beginPath(); gc.moveTo(xc, 18); gc.lineTo(xc, yc + A + 6); gc.stroke(); gc.setLineDash([]);
      for (k = 0; k < 3; k++) if (on[k]) { gc.fillStyle = CSSC[k]; gc.beginPath(); gc.arc(xc, yc - A * i[k], 4, 0, 7); gc.fill(); }
      gc.fillStyle = '#c9d1d9'; gc.fillText(t('Corrientes de fase · secuencia ', 'Phase currents · sequence ') + (sec > 0 ? 'R-S-T' : 'R-T-S'), x0, 12);
    }

    // Controles
    var bPlay = q('[data-a="play"]');
    bPlay.onclick = function () { jugando = !jugando; bPlay.textContent = jugando ? '⏸ ' + t('Pausa', 'Pause') : '▶ ' + t('Seguir', 'Resume'); };
    q('[data-a="sec"]').onclick = function () { sec = -sec; };
    caja.querySelectorAll('[data-f]').forEach(function (c) { c.onchange = function () { on[+c.getAttribute('data-f')] = c.checked; }; });
    caja.querySelectorAll('[data-v]').forEach(function (c) { c.onchange = function () { ver[c.getAttribute('data-v')] = c.checked; }; });
    caja.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () {
        tipo = b.getAttribute('data-r'); wR = 0;
        caja.querySelectorAll('[data-r]').forEach(function (x) { x.classList.toggle('on', x === b); });
      };
    });
    var vel = q('input[type=range]'), velT = q('[data-velt]');
    function verVel() { fHz = +vel.value; velT.textContent = ' ' + coma(fHz, 2) + t(' vueltas/s (cámara lenta)', ' rev/s (slow motion)'); }
    vel.oninput = verVel; verVel();
    q('[data-c="frente"]').onclick = function () { vista([0, 0, 17]); };
    q('[data-c="obl"]').onclick = function () { vista([10, 6.5, 13]); };

    // Solo se anima mientras está a la vista
    var visible = true, tAnt = 0;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(esc0);
    ren.setAnimationLoop(function (ts) {
      var dt = tAnt ? Math.min(0.05, (ts - tAnt) / 1000) : 0; tAnt = ts;
      if (!visible) return;
      paso(dt); dibujar(); ctl.update(); ren.render(esc, cam);
    });
  }

  function arrancar() {
    var cajas = document.querySelectorAll('[data-campo3d]');
    if (!cajas.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    cajas.forEach(iniciar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
