/* ============================================================
   catto.ar — Simulador del latch RS con NOR cruzadas
   Lo usa logica-secuencial.html (castellano e inglés): la página
   solo pone <div class="lw" id="simRS"></div> y este archivo arma
   el resto.

   Simulación a nivel de compuerta con retardo unitario: en cada
   paso las dos NOR se recalculan a la vez con los valores del paso
   anterior, hasta que nada cambia. Así se ve la señal recorrer el
   lazo, y al soltar S = R = 1 a la vez aparece la oscilación de la
   condición de carrera; a los pocos ciclos una compuerta "gana" al
   azar, como pasa en un circuito real donde nunca son idénticas.
   ============================================================ */
(function () {
  'use strict';
  var raiz = document.getElementById('simRS');
  if (!raiz) return;
  var EN = (document.documentElement.lang || '').indexOf('en') === 0;
  var TX = EN ? {
    titulo: 'Lab · RS latch simulator',
    sub: 'Turn S and R on and off and watch how Q responds. The timing diagram below records everything.',
    lento: 'Slow motion (show the propagation)',
    soltar: 'Release both at once',
    reiniciar: 'Restart',
    estado: 'State',
    memoria: 'Memory', set: 'Set', reset: 'Reset', prohibido: 'Forbidden', propagando: 'Propagating…',
    nMem: function (q) { return '<b>Memory.</b> No input is active and the loop alone holds Q = ' + q + '. Nothing outside is keeping it there: the two gates sustain each other.'; },
    nSet: '<b>Set.</b> S = 1 forces Q̅ to 0; that 0 goes back to the upper gate, which then outputs Q = 1. Now turn S off: Q stays at 1.',
    nReset: '<b>Reset.</b> R = 1 forces Q to 0; that 0 goes back to the lower gate, which then outputs Q̅ = 1. Now turn R off: Q stays at 0.',
    nProh: '<b>Forbidden state.</b> Both outputs are 0: Q is no longer the complement of Q̅. Try «Release both at once».',
    nOsc: '<b>Oscillating.</b> With identical gates, both see 0 at their inputs, both switch to 1, then both back to 0… and so on.',
    nProp: 'The signal is travelling around the loop: each gate takes one delay to respond.',
    nCarrera: function (q) { return '<b>Race condition.</b> On releasing both at once, the two gates switched together and the latch oscillated. In a real circuit one gate is always slightly faster and wins: this time Q = ' + q + '. Try again: the result cannot be predicted.'; },
    entrada: function (n, v) { return 'Input ' + n + ' = ' + v + '. Click to change it.'; },
    crono: 'Timing diagram',
    aria: 'RS latch made with two cross-coupled NOR gates; wires in green are at 1'
  } : {
    titulo: 'Laboratorio · simulador del latch RS',
    sub: 'Activá y soltá S y R y mirá cómo responde Q. El cronograma de abajo va registrando todo.',
    lento: 'Cámara lenta (ver la propagación)',
    soltar: 'Soltar las dos a la vez',
    reiniciar: 'Reiniciar',
    estado: 'Estado',
    memoria: 'Memoria', set: 'Set', reset: 'Reset', prohibido: 'Prohibido', propagando: 'Propagando…',
    nMem: function (q) { return '<b>Memoria.</b> Ninguna entrada está activa y el lazo solo sostiene Q = ' + q + '. Nada de afuera lo mantiene: las dos compuertas se sostienen entre sí.'; },
    nSet: '<b>Set.</b> S = 1 obliga a Q̅ a valer 0; ese 0 vuelve a la compuerta de arriba, que entonces pone Q = 1. Ahora soltá S: Q se queda en 1.',
    nReset: '<b>Reset.</b> R = 1 obliga a Q a valer 0; ese 0 vuelve a la compuerta de abajo, que entonces pone Q̅ = 1. Ahora soltá R: Q se queda en 0.',
    nProh: '<b>Estado prohibido.</b> Las dos salidas valen 0: Q dejó de ser el complemento de Q̅. Probá «Soltar las dos a la vez».',
    nOsc: '<b>Oscilando.</b> Si las compuertas fueran idénticas, las dos ven 0 en sus entradas, pasan juntas a 1, después juntas a 0… y así.',
    nProp: 'La señal está recorriendo el lazo: cada compuerta tarda un retardo en responder.',
    nCarrera: function (q) { return '<b>Condición de carrera.</b> Al soltar las dos a la vez, las compuertas conmutaron juntas y el latch osciló. En un circuito real una compuerta siempre es apenas más rápida y gana: esta vez quedó Q = ' + q + '. Probá de nuevo: el resultado no se puede predecir.'; },
    entrada: function (n, v) { return 'Entrada ' + n + ' = ' + v + '. Tocá para cambiarla.'; },
    crono: 'Cronograma',
    aria: 'Latch RS con dos NOR cruzadas; los cables en verde están en 1'
  };

  /* ---------- estilos (las páginas de la tecnicatura no cargan ing.css) ---------- */
  if (!document.getElementById('lw-css')) {
    var st = document.createElement('style'); st.id = 'lw-css';
    st.textContent =
      '.lw{margin:22px 0;padding:16px 18px;background:var(--panel);border:1px solid var(--line);border-radius:14px}' +
      '.lw .lt{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--accent);margin-bottom:4px}' +
      '.lw .ls{font-size:13px;color:var(--muted);margin:0 0 12px}' +
      '.lw .fila{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}' +
      '.lw button{background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:9px;padding:7px 12px;font-size:13px;cursor:pointer;font-family:inherit}' +
      '.lw button:hover{border-color:var(--accent);color:var(--accent)}' +
      '.lw button:disabled{opacity:.4;cursor:default;border-color:var(--line);color:var(--txt)}' +
      '.lw .nota{font-size:13.5px;color:var(--muted);margin-top:10px;min-height:42px}' +
      '.lw .nota b{color:var(--txt)}' +
      '.rs-sw{min-width:92px;font-weight:700;font-variant-numeric:tabular-nums}' +
      '.lw button.rs-sw.on{background:rgba(63,185,80,.16);border-color:var(--ok);color:var(--ok)}' +
      '.rs-est{margin-left:auto;font-size:12.5px;color:var(--muted)}' +
      '.rs-est b{display:inline-block;padding:2px 9px;border-radius:20px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);margin-left:4px}' +
      '.rs-est b.set{border-color:var(--ok);color:var(--ok)}.rs-est b.reset{border-color:var(--accent);color:var(--accent)}' +
      '.rs-est b.proh{border-color:var(--hot);color:var(--hot)}.rs-est b.prop{border-color:var(--warn);color:var(--warn)}' +
      '.rs-lento{font-size:13px;color:var(--muted);display:inline-flex;align-items:center;gap:6px;cursor:pointer}' +
      '.rs-lento input{accent-color:var(--accent)}' +
      '.lw svg{display:block;width:100%;height:auto}' +
      '.lw svg.rs-esq{background:var(--panel2);border:1px solid var(--line);border-radius:10px;margin:10px auto 0;max-width:620px}' +
      '.rs-cro{background:var(--panel2);border:1px solid var(--line);border-radius:10px;margin:10px 0 0}' +
      '.rs-in{cursor:pointer}.rs-in:focus{outline:none}.rs-in:focus-visible rect{stroke:var(--accent)}' +
      '@media (max-width:560px){.rs-est{margin-left:0;flex-basis:100%}.rs-sw{min-width:80px}.lw svg text.tg{font-size:22px}.lw svg text.rs-iv{font-size:21px}}';
    document.head.appendChild(st);
  }

  /* ---------- esquema ---------- */
  var V1 = '#3fb950', V0 = '#3a4352';
  var NOR = 'M0,0 C13,3 27,9 38,20 C27,31 13,37 0,40 C9,28 9,12 0,0 Z';
  function compuerta(x, y) {
    return '<g transform="translate(' + x + ',' + y + ') scale(1.4)"><path d="' + NOR + '" fill="#1c2230" stroke="#58a6ff" stroke-width="1.5"/>' +
      '<circle cx="43" cy="20" r="5" fill="#1c2230" stroke="#58a6ff" stroke-width="1.5"/><text x="10" y="24.5" fill="#7d8a99" font-size="10">&#8805;1</text></g>';
  }
  function entrada(id, n, y) {
    return '<g class="rs-in" id="' + id + '" role="button" tabindex="0" transform="translate(18,' + (y - 17) + ')">' +
      '<rect width="44" height="34" rx="7" fill="#161b22" stroke="#2a3140" stroke-width="1.5"/>' +
      '<text x="22" y="24" text-anchor="middle" font-size="16" font-weight="700" fill="#e6edf3" class="rs-iv tg">0</text></g>' +
      '<text class="tg" x="40" y="' + (y - 24) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#9aa7b4">' + n + '</text>';
  }
  raiz.innerHTML =
    '<div class="lt">' + TX.titulo + '</div><p class="ls">' + TX.sub + '</p>' +
    '<div class="fila">' +
      '<button type="button" class="rs-sw" id="rsS" aria-pressed="false">S = 0</button>' +
      '<button type="button" class="rs-sw" id="rsR" aria-pressed="false">R = 0</button>' +
      '<button type="button" id="rsAmbas" disabled>' + TX.soltar + '</button>' +
      '<button type="button" id="rsReini">' + TX.reiniciar + '</button>' +
      '<span class="rs-est">' + TX.estado + ':<b id="rsEst">' + TX.memoria + '</b></span>' +
    '</div>' +
    '<label class="rs-lento"><input type="checkbox" id="rsLento" checked> ' + TX.lento + '</label>' +
    '<svg class="rs-esq" viewBox="0 0 510 250" role="img" aria-label="' + TX.aria + '" font-family="Segoe UI,system-ui,Arial,sans-serif">' +
      '<path id="wR" d="M62 51 H209" stroke-width="2.6" fill="none"/>' +
      '<path id="wS" d="M62 195 H209" stroke-width="2.6" fill="none"/>' +
      '<path id="wQ" d="M268 68 H436" stroke-width="2.6" fill="none"/>' +
      '<path id="wQb" d="M268 178 H436" stroke-width="2.6" fill="none"/>' +
      '<path id="fQ" d="M330 68 V108 L164 142 V161 H209" stroke-width="2.2" fill="none"/>' +
      '<path id="fQb" d="M352 178 V142 L146 108 V85 H209" stroke-width="2.2" fill="none"/>' +
      '<circle id="dQ" cx="330" cy="68" r="4"/><circle id="dQb" cx="352" cy="178" r="4"/>' +
      compuerta(200, 40) + compuerta(200, 150) +
      entrada('inR', 'R', 51) + entrada('inS', 'S', 195) +
      '<circle id="lQ" cx="456" cy="68" r="13" stroke-width="2"/><circle id="lQb" cx="456" cy="178" r="13" stroke-width="2"/>' +
      '<text class="tg" x="477" y="74" font-size="17" font-weight="700" fill="#e6edf3">Q</text>' +
      '<text class="tg" x="477" y="184" font-size="17" font-weight="700" fill="#e6edf3">Q&#773;</text>' +
      '<text class="tg" id="tQ" x="404" y="59" font-size="15" font-weight="700" text-anchor="middle"></text>' +
      '<text class="tg" id="tQb" x="404" y="169" font-size="15" font-weight="700" text-anchor="middle"></text>' +
    '</svg>' +
    '<div class="nota" id="rsNota"></div>' +
    '<svg class="rs-cro" id="rsCro" viewBox="0 0 640 176" role="img" aria-label="' + TX.crono + '" font-family="Segoe UI,system-ui,Arial,sans-serif"></svg>';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- estado y simulación ---------- */
  var S = 0, R = 0, Q = 0, Qb = 1;
  var lento = true, timer = null, oscil = 0, carrera = null;   // carrera: null, false (en curso) o true (resuelta)
  var DEMORA = 320;              // ms por retardo de compuerta en cámara lenta

  function nor(a, b) { return (a || b) ? 0 : 1; }
  function estable() { return nor(R, Qb) === Q && nor(S, Q) === Qb; }

  function paso() {
    timer = null;
    var nQ = nor(R, Qb), nQb = nor(S, Q);
    if (nQ === Q && nQb === Qb) { oscil = 0; pintar(); return; }
    if (nQ !== Q && nQb !== Qb && nQ === nQb) oscil++;   // las dos cambian juntas: carrera
    if (oscil >= 4) {
      /* una de las dos compuertas es un poco más rápida: cambia sola */
      if (Math.random() < 0.5) Q = nQ; else Qb = nQb;
      oscil = 0; carrera = true;
    } else { Q = nQ; Qb = nQb; }
    pintar();
    seguir();
  }
  function seguir() {
    if (timer) return;
    if (lento) timer = setTimeout(paso, DEMORA);
    else { var g = 0; while (!estable() && g++ < 40) { timer = 1; paso(); timer = null; } pintar(); }
  }
  function cambiar() { seguir(); pintar(); }

  $('rsS').onclick = function () { S = S ? 0 : 1; carrera = null; cambiar(); };
  $('rsR').onclick = function () { R = R ? 0 : 1; carrera = null; cambiar(); };
  $('rsAmbas').onclick = function () { if (!(S && R)) return; S = 0; R = 0; carrera = false; cambiar(); };
  $('rsReini').onclick = function () {
    if (timer) { clearTimeout(timer); timer = null; }
    S = 0; R = 0; Q = 0; Qb = 1; oscil = 0; carrera = null; hist = []; pintar();
  };
  $('rsLento').onchange = function () { lento = this.checked; if (timer) { clearTimeout(timer); timer = null; } seguir(); };
  function teclaEntrada(g, b) {
    g.addEventListener('click', function () { $(b).click(); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(b).click(); } });
  }
  teclaEntrada($('inS'), 'rsS'); teclaEntrada($('inR'), 'rsR');

  function color(el, v, relleno) {
    var c = v ? V1 : V0;
    if (relleno) { el.setAttribute('fill', v ? V1 : '#161b22'); el.setAttribute('stroke', c); }
    else el.setAttribute('stroke', c);
  }
  function pintar() {
    color($('wR'), R); color($('wS'), S); color($('wQ'), Q); color($('wQb'), Qb);
    color($('fQ'), Q); color($('fQb'), Qb);
    $('dQ').setAttribute('fill', Q ? V1 : V0); $('dQb').setAttribute('fill', Qb ? V1 : V0);
    color($('lQ'), Q, true); color($('lQb'), Qb, true);
    $('lQ').style.filter = Q ? 'drop-shadow(0 0 6px rgba(63,185,80,.8))' : 'none';
    $('lQb').style.filter = Qb ? 'drop-shadow(0 0 6px rgba(63,185,80,.8))' : 'none';
    $('tQ').textContent = Q; $('tQ').setAttribute('fill', Q ? V1 : '#7d8a99');
    $('tQb').textContent = Qb; $('tQb').setAttribute('fill', Qb ? V1 : '#7d8a99');
    [['inS', S, 'S'], ['inR', R, 'R']].forEach(function (x) {
      var g = $(x[0]); g.querySelector('.rs-iv').textContent = x[1];
      g.querySelector('rect').setAttribute('stroke', x[1] ? V1 : '#2a3140');
      g.querySelector('.rs-iv').setAttribute('fill', x[1] ? V1 : '#e6edf3');
      g.setAttribute('aria-label', TX.entrada(x[2], x[1]));
    });
    var bS = $('rsS'), bR = $('rsR');
    bS.textContent = 'S = ' + S; bS.className = 'rs-sw' + (S ? ' on' : ''); bS.setAttribute('aria-pressed', S ? 'true' : 'false');
    bR.textContent = 'R = ' + R; bR.className = 'rs-sw' + (R ? ' on' : ''); bR.setAttribute('aria-pressed', R ? 'true' : 'false');
    $('rsAmbas').disabled = !(S && R);

    var est = $('rsEst'), nota = $('rsNota'), quieto = estable();
    if (!quieto) { est.textContent = TX.propagando; est.className = 'prop'; nota.innerHTML = carrera === false ? TX.nOsc : TX.nProp; }
    else if (S && R) { est.textContent = TX.prohibido; est.className = 'proh'; nota.innerHTML = TX.nProh; }
    else if (S) { est.textContent = TX.set; est.className = 'set'; nota.innerHTML = TX.nSet; }
    else if (R) { est.textContent = TX.reset; est.className = 'reset'; nota.innerHTML = TX.nReset; }
    else {
      est.textContent = TX.memoria; est.className = '';
      nota.innerHTML = carrera === true ? TX.nCarrera(Q) : TX.nMem(Q);
    }
  }

  /* ---------- cronograma: una muestra cada 100 ms, los últimos 15 s ---------- */
  var hist = [], N = 150, X0 = 46, X1 = 630;
  var FILAS = [['S', function (m) { return m.S; }, '#58a6ff'], ['R', function (m) { return m.R; }, '#58a6ff'],
               ['Q', function (m) { return m.Q; }, V1], ['Q̅', function (m) { return m.Qb; }, V1]];
  var cro = $('rsCro');
  function dibujarCrono() {
    var w = (X1 - X0) / (N - 1), h = '';
    FILAS.forEach(function (f, i) {
      var y0 = 14 + i * 41, alto = 22, base = y0 + alto;
      h += '<text class="tg" x="8" y="' + (base - 3) + '" font-size="15" font-weight="700" fill="#9aa7b4">' + f[0] + '</text>' +
           '<line x1="' + X0 + '" y1="' + base + '" x2="' + X1 + '" y2="' + base + '" stroke="#2a3140" stroke-width="1"/>';
      if (!hist.length) return;
      var desde = N - hist.length, pts = '', ant = null;
      hist.forEach(function (m, k) {
        var x = (X0 + (desde + k) * w).toFixed(1), y = f[1](m) ? y0 : base;
        if (ant !== null && ant !== y) pts += x + ',' + ant + ' ';
        pts += x + ',' + y + ' '; ant = y;
      });
      h += '<polyline points="' + pts + '" fill="none" stroke="' + f[2] + '" stroke-width="2" stroke-linejoin="round"/>';
    });
    /* franja roja: estado prohibido u oscilación de la carrera (Q y Q̅ iguales) */
    var desde = N - hist.length, ini = -1;
    for (var k = 0; k <= hist.length; k++) {
      var mal = k < hist.length && hist[k].mal;
      if (mal && ini < 0) ini = k;
      if (!mal && ini >= 0) {
        h = '<rect x="' + (X0 + (desde + ini) * w).toFixed(1) + '" y="92" width="' + Math.max(2, (k - ini) * w).toFixed(1) + '" height="72" fill="rgba(248,81,73,.13)"/>' + h;
        ini = -1;
      }
    }
    cro.innerHTML = h;
  }
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(raiz);
  }
  setInterval(function () {
    if (!visible || document.hidden) return;
    hist.push({ S: S, R: R, Q: Q, Qb: Qb, mal: Q === Qb && ((S && R) || carrera === false) });
    if (hist.length > N) hist.shift();
    dibujarCrono();
  }, 100);

  pintar(); dibujarCrono();
})();
