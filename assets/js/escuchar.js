/* catto.ar · Escuchar: ejemplos sonoros para las páginas de la carrera de Sonido (Web Audio, sin archivos).
   Uso en la página:  <button class="esc" data-esc='{"tipo":"tono","f":440}'>440 Hz</button>
   Un clic suena, otro clic (o cualquier otro botón) lo detiene. Todo arranca con fundido y a nivel moderado.
   Tipos (todos aceptan "db": nivel relativo en dB, 0 = nivel de referencia del sitio, por defecto 0; "dur": segundos, por defecto 2.5):
     tono      {"f":1000, "forma":"sine|square|sawtooth|triangle"}
     armonicos {"f":220, "a":[1,0.5,0.33,0.25]}       amplitudes del 1.º, 2.º, 3.º… armónico (fase 0)
     ruido     {"color":"blanco|rosa"}
     barrido   {"f1":20, "f2":20000}                    barrido logarítmico de un tono puro
     par       {"f":1000, "db1":0, "db2":-6}            el mismo tono dos veces seguidas: compara dos niveles
     notas     {"n":["C4","E4","G4","C4 E4 G4"], "r":[1,1,1,2], "bpm":90}
               melodías, acordes y ritmos. Cada elemento de "n" es un evento: una nota ("C4", "F#3", "Bb4"; La4 = 440 Hz,
               afinación temperada), varias separadas por espacio (suenan juntas: acorde), "-" silencio, "x" golpe
               de metrónomo y "X" golpe acentuado (se pueden mezclar: "x C4"). "r": duración de cada evento en
               negras (se repite cíclicamente si es más corta; por defecto 1). "bpm": negras por minuto (90).
               "leg": fracción de la duración que suena cada nota (0,92). "dur" no se usa: lo fija la secuencia.
   Opcional: un <input type="range" class="esc-vol"> en la página no hace falta: el volumen lo pone el equipo del lector.
   Seguridad del oído: el nivel de referencia es −18 dBFS y nada pasa de −6 dBFS. */
(function () {
  'use strict';
  var REF = Math.pow(10, -18 / 20), TOPE = Math.pow(10, -6 / 20);
  var ctx = null, actual = null, botonActual = null, ruidos = {};

  function contexto() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function ganancia(db) { return Math.min(TOPE, REF * Math.pow(10, (db || 0) / 20)); }

  // envolvente: fundido de entrada y salida (evita el clic al cortar la onda)
  function envolvente(g, t0, dur, nivel) {
    var a = Math.min(0.03, dur / 4);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(nivel, t0 + a);
    g.gain.setValueAtTime(nivel, t0 + dur - a);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
  }

  function bufferRuido(c, color) {
    if (ruidos[color]) return ruidos[color];
    var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0), i, w, max = 0;
    if (color === 'rosa') {           // filtro de Paul Kellet: −3 dB por octava
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (i = 0; i < n; i++) {
        w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        x[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      }
    } else { for (i = 0; i < n; i++) x[i] = Math.random() * 2 - 1; }
    // mismo valor eficaz que una senoidal de pico 1 (0,707), para comparar a oído con los tonos
    var s = 0; for (i = 0; i < n; i++) s += x[i] * x[i];
    var k = Math.SQRT1_2 / Math.sqrt(s / n); for (i = 0; i < n; i++) x[i] *= k;
    return (ruidos[color] = b);
  }

  // ---- notas: melodías, acordes y ritmos (afinación temperada, La4 = 440 Hz) ----
  var PASO = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function frecuencia(nombre) {          // "C4", "F#3", "Bb4", "C#5"
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(nombre); if (!m) return 0;
    var semis = PASO[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) - 4) * 12;
    return 440 * Math.pow(2, semis / 12);
  }
  var TIMBRE = [1, 0.45, 0.25, 0.14, 0.08, 0.05];   // armónicos de un sonido «de teclado» sencillo
  function nota(c, f, t, d, nivel, destino, fuentes) {
    var gn = c.createGain(), lib = Math.min(0.12, d * 0.3);
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(nivel, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(nivel * 0.35, t + Math.max(0.02, d - lib));   // decae como una cuerda pulsada
    gn.gain.linearRampToValueAtTime(0, t + d);
    gn.connect(destino);
    var suma = 0; TIMBRE.forEach(function (v) { suma += v; });
    TIMBRE.forEach(function (v, i) {
      if (f * (i + 1) > 12000) return;
      var o = c.createOscillator(), gh = c.createGain();
      o.frequency.value = f * (i + 1); gh.gain.value = v / suma;
      o.connect(gh); gh.connect(gn); o.start(t); o.stop(t + d + 0.02); fuentes.push(o);
    });
  }
  function golpe(c, fuerte, t, nivel, destino, fuentes) {   // golpe de metrónomo / percusión
    var o = c.createOscillator(), gn = c.createGain();
    o.frequency.value = fuerte ? 1760 : 1320;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(nivel * (fuerte ? 1 : 0.6), t + 0.002);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(gn); gn.connect(destino); o.start(t); o.stop(t + 0.08); fuentes.push(o);
  }
  function notas(c, p, g, t0, fuentes) {
    var ev = p.n || [], r = p.r || [], negra = 60 / (p.bpm || 90), t = t0, voces = 1;
    ev.forEach(function (e) { voces = Math.max(voces, String(e).trim().split(/\s+/).length); });
    var nivel = 1 / Math.sqrt(voces) / (voces > 1 ? 1.2 : 1);
    g.gain.value = ganancia(p.db) * 1.4;
    ev.forEach(function (e, i) {
      var d = (r.length ? r[i % r.length] : 1) * negra;
      String(e).trim().split(/\s+/).forEach(function (x) {
        if (x === '-' || x === '') return;                       // silencio
        if (x === 'x' || x === 'X') { golpe(c, x === 'X', t, nivel, g, fuentes); return; }
        var f = frecuencia(x); if (f) nota(c, f, t, d * (p.leg || 0.92), nivel, g, fuentes);
      });
      t += d;
    });
    return t - t0;
  }

  function sonar(p) {
    var c = contexto(); if (!c) return null;
    var t0 = c.currentTime + 0.02, dur = p.dur || 2.5, g = c.createGain(), fuentes = [];
    g.connect(c.destination);
    var tipo = p.tipo || 'tono';
    if (tipo === 'tono' || tipo === 'barrido') {
      var o = c.createOscillator(); o.type = p.forma || 'sine';
      if (tipo === 'barrido') { o.frequency.setValueAtTime(p.f1 || 20, t0); o.frequency.exponentialRampToValueAtTime(p.f2 || 20000, t0 + dur); }
      else o.frequency.value = p.f || 1000;
      // las formas no senoidales tienen más energía: se bajan para sonar parecido
      var corr = { square: -6, sawtooth: -4.5, triangle: 0 }[o.type] || 0;
      envolvente(g, t0, dur, ganancia((p.db || 0) + corr));
      o.connect(g); o.start(t0); o.stop(t0 + dur + 0.05); fuentes.push(o);
    } else if (tipo === 'armonicos') {
      var a = p.a || [1], suma = 0;
      a.forEach(function (v) { suma += Math.abs(v); });
      a.forEach(function (v, i) {
        if (!v || p.f * (i + 1) > c.sampleRate / 2) return;
        var oi = c.createOscillator(), gi = c.createGain();
        oi.frequency.value = p.f * (i + 1); gi.gain.value = v / suma;   // la suma de picos no pasa de 1
        oi.connect(gi); gi.connect(g); oi.start(t0); oi.stop(t0 + dur + 0.05); fuentes.push(oi);
      });
      envolvente(g, t0, dur, ganancia(p.db) * 1.4);
    } else if (tipo === 'ruido') {
      var r = c.createBufferSource(); r.buffer = bufferRuido(c, p.color || 'blanco'); r.loop = true;
      r.connect(g); r.start(t0); r.stop(t0 + dur + 0.05); fuentes.push(r);
      envolvente(g, t0, dur, ganancia(p.db));
    } else if (tipo === 'par') {
      var d1 = dur / 2 - 0.15, o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
      o1.frequency.value = o2.frequency.value = p.f || 1000;
      g2.connect(c.destination);
      envolvente(g, t0, d1, ganancia(p.db1 || 0)); envolvente(g2, t0 + d1 + 0.3, d1, ganancia(p.db2 || -6));
      o1.connect(g); o2.connect(g2); o1.start(t0); o1.stop(t0 + d1 + 0.05); o2.start(t0 + d1 + 0.3); o2.stop(t0 + dur + 0.2);
      fuentes.push(o1, o2);
    } else if (tipo === 'notas') {
      dur = notas(c, p, g, t0, fuentes);
    }
    var fin = setTimeout(function () { parar(); }, (dur + 0.4) * 1000);
    return { fuentes: fuentes, g: g, fin: fin };
  }

  function parar() {
    if (actual) {
      clearTimeout(actual.fin);
      actual.fuentes.forEach(function (f) { try { f.stop(); } catch (e) {} });
      actual = null;
    }
    if (botonActual) { botonActual.classList.remove('on'); botonActual.setAttribute('aria-pressed', 'false'); botonActual = null; }
  }

  function alClic(ev) {
    var b = ev.target.closest('button.esc'); if (!b) return;
    var mismo = b === botonActual; parar(); if (mismo) return;
    var p; try { p = JSON.parse(b.getAttribute('data-esc') || '{}'); } catch (e) { return; }
    actual = sonar(p); if (!actual) { b.title = 'Este navegador no puede reproducir audio'; return; }
    botonActual = b; b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
  }

  var css = '.esc{display:inline-flex;align-items:center;gap:6px;margin:3px 4px 3px 0;padding:5px 11px;border-radius:16px;' +
    'border:1px solid var(--line,#2a3140);background:transparent;color:var(--accent,#58a6ff);font:inherit;font-size:13px;cursor:pointer}' +
    '.esc::before{content:"▶";font-size:10px}.esc.on{background:rgba(31,111,235,.16);border-color:var(--accent,#58a6ff)}' +
    '.esc.on::before{content:"■"}.esc:focus-visible{outline:2px solid var(--accent,#58a6ff);outline-offset:2px}' +
    '.escuchar{margin:14px 0;padding:10px 14px;border:1px dashed var(--line,#2a3140);border-radius:10px}' +
    '.escuchar .et{display:block;font-size:12px;color:var(--soft,#7d8a99);margin-bottom:4px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  document.addEventListener('click', alClic);
  document.querySelectorAll('button.esc').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.type = 'button'; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) parar(); });
})();
