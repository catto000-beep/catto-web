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
   Desde v=3:
     sint      {"f":220, "forma":"sawtooth", "filtro":{"tipo":"lowpass","fc":400,"fc2":4000,"q":4},
                "adsr":[0.01,0.2,0.6,0.3], "mod":{"tipo":"am|anillo|fm","f":5,"prof":0.5,"indice":2,"indice2":0}}
               una voz de sintetizador. Filtro opcional (fc2: barrido de fc a fc2 en toda la duración). adsr: ataque,
               decaimiento y relajación en segundos y sostenido de 0 a 1. mod: am (prof 0 a 1), anillo (producto: f ± fm)
               o fm (índice β = desviación / fm; indice2: el índice cambia de indice a indice2 durante el sonido).
     mezcla    {"partes":[{"tipo":"tono","f":1000},{"tipo":"ruido","color":"rosa","db":-10,"desde":0.5}]}
               varios sonidos a la vez; "desde": segundos de demora antes de empezar esa parte.
     Cualquier tipo acepta "pan" (−1 izquierda … 1 derecha) y "retardo" (segundos, hasta 1): por ejemplo, el mismo
     golpe con "pan":-1 y con "pan":1,"retardo":0.005 dentro de una mezcla muestra el efecto de precedencia.
   Desde v=4, cualquier tipo acepta además estos efectos (se aplican en este orden):
     "eq":[{"tipo":"peaking|lowshelf|highshelf|lowpass|highpass","f":1000,"q":1.41,"g":6}]   filtros en serie (q 1,41 ≈ una octava; 2,87 ≈ media; 4,32 ≈ un tercio)
     "comp":{"umbral":-24,"razon":4,"rodilla":6,"ataque":0.01,"rel":0.15}                     compresor
     "barre":{"ms":5,"prof_ms":2,"f":0.5,"fb":0,"mix":0.5,"seco":0.75}                        retardo modulado: chorus (ms 20), flanger (ms 3, fb 0.6), vibrato (mix 1, seco 0)
     "eco":{"t":0.3,"fb":0.4,"mix":0.4}                                                       eco con realimentación
     "rev":{"t60":1.5,"mix":0.3}                                                              reverberación artificial con ese tiempo T60
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

  // respuesta impulsiva artificial: ruido que decae 60 dB en t60 segundos (energía unitaria)
  function impulso(c, t60) {
    var n = Math.max(1, Math.floor(c.sampleRate * t60)), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var x = b.getChannelData(ch), e = 0, i;
      for (i = 0; i < n; i++) { x[i] = (Math.random() * 2 - 1) * Math.exp(-6.908 * i / n); e += x[i] * x[i]; }
      e = Math.sqrt(e); for (i = 0; i < n; i++) x[i] /= e;
    }
    return b;
  }
  function mezclaSeca(c, nodo, seco) { var e = c.createGain(), s = c.createGain(); s.gain.value = seco; e.connect(s); s.connect(nodo); return e; }

  // salida de un sonido: efectos opcionales, retardo y paneo. Orden: eq → comp → barre → eco → rev → retardo → pan
  function salida(c, p, destino, fuentes, t0) {
    var nodo = destino, e, w;
    if (typeof p.pan === 'number' && c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p.pan)); pn.connect(nodo); nodo = pn; }
    if (p.retardo) { var dl = c.createDelay(1); dl.delayTime.value = Math.min(1, p.retardo); dl.connect(nodo); nodo = dl; }
    if (p.rev) {
      var mixr = p.rev.mix == null ? 0.3 : p.rev.mix, conv = c.createConvolver(); conv.buffer = impulso(c, p.rev.t60 || 1.5);
      e = mezclaSeca(c, nodo, 1 - mixr); w = c.createGain(); w.gain.value = mixr; e.connect(conv); conv.connect(w); w.connect(nodo); nodo = e;
    }
    if (p.eco) {
      var mixe = p.eco.mix == null ? 0.4 : p.eco.mix, de = c.createDelay(2), fbe = c.createGain();
      de.delayTime.value = Math.min(2, p.eco.t || 0.3); fbe.gain.value = Math.min(0.9, p.eco.fb || 0);
      e = mezclaSeca(c, nodo, 1 - mixe / 2); w = c.createGain(); w.gain.value = mixe; e.connect(de); de.connect(w); w.connect(nodo); de.connect(fbe); fbe.connect(de); nodo = e;
    }
    if (p.barre) {                       // retardo modulado: chorus, flanger y vibrato (mix 1 y seco 0)
      var bm = p.barre, mixb = bm.mix == null ? 0.5 : bm.mix, db = c.createDelay(0.1), lfo = c.createOscillator(), pr = c.createGain(), fbb = c.createGain();
      db.delayTime.value = (bm.ms || 5) / 1000; lfo.frequency.value = bm.f || 0.5; pr.gain.value = (bm.prof_ms || 2) / 1000; fbb.gain.value = Math.min(0.9, bm.fb || 0);
      e = mezclaSeca(c, nodo, bm.seco == null ? 1 - mixb / 2 : bm.seco); w = c.createGain(); w.gain.value = mixb;
      e.connect(db); db.connect(w); w.connect(nodo); db.connect(fbb); fbb.connect(db); lfo.connect(pr); pr.connect(db.delayTime);
      lfo.start(t0); fuentes.push(lfo); nodo = e;
    }
    if (p.comp) {
      var cp = c.createDynamicsCompressor(), ko = p.comp;
      cp.threshold.value = ko.umbral == null ? -24 : ko.umbral; cp.ratio.value = ko.razon || 4; cp.knee.value = ko.rodilla == null ? 6 : ko.rodilla;
      cp.attack.value = ko.ataque == null ? 0.01 : ko.ataque; cp.release.value = ko.rel == null ? 0.15 : ko.rel; cp.connect(nodo); nodo = cp;
    }
    if (p.eq) (Array.isArray(p.eq) ? p.eq : [p.eq]).slice().reverse().forEach(function (b) {
      var q = c.createBiquadFilter(); q.type = b.tipo || 'peaking'; q.frequency.value = b.f || 1000; q.Q.value = b.q == null ? 1.41 : b.q;
      if (b.g != null) q.gain.value = b.g; q.connect(nodo); nodo = q;
    });
    return nodo;
  }
  function cola(p) { return p.rev ? (p.rev.t60 || 1.5) : (p.eco ? Math.min(3, (p.eco.t || 0.3) / Math.max(0.05, 1 - (p.eco.fb || 0)) * 2) : 0); }

  // sintetizador de una voz: oscilador → (modulación AM, anillo o FM) → filtro → ADSR
  function sint(c, p, g, t0, dur, fuentes) {
    var o = c.createOscillator(); o.type = p.forma || 'sawtooth'; o.frequency.value = p.f || 220;
    var cadena = o, m = p.mod;
    if (m && (m.tipo === 'am' || m.tipo === 'anillo')) {
      var vca = c.createGain(), lfo = c.createOscillator(), prof = c.createGain();
      lfo.frequency.value = m.f || 5;
      if (m.tipo === 'anillo') { vca.gain.value = 0; prof.gain.value = 1; }            // producto puro: f ± fm
      else { var k = Math.min(1, m.prof == null ? 0.5 : m.prof); vca.gain.value = 1 - k / 2; prof.gain.value = k / 2; }
      lfo.connect(prof); prof.connect(vca.gain); o.connect(vca); cadena = vca;
      lfo.start(t0); lfo.stop(t0 + dur + 0.05); fuentes.push(lfo);
    } else if (m && m.tipo === 'fm') {
      var mo = c.createOscillator(), mg = c.createGain();
      mo.frequency.value = m.f || (p.f || 220); mg.gain.value = (m.indice == null ? 2 : m.indice) * mo.frequency.value;   // desviación = β·fm
      if (m.indice2 != null) mg.gain.linearRampToValueAtTime(m.indice2 * mo.frequency.value, t0 + dur);
      mo.connect(mg); mg.connect(o.frequency); mo.start(t0); mo.stop(t0 + dur + 0.05); fuentes.push(mo);
    }
    if (p.filtro) {
      var fl = c.createBiquadFilter(); fl.type = p.filtro.tipo || 'lowpass'; fl.Q.value = p.filtro.q || 1;
      fl.frequency.setValueAtTime(p.filtro.fc || 1000, t0);
      if (p.filtro.fc2) fl.frequency.exponentialRampToValueAtTime(p.filtro.fc2, t0 + dur);
      cadena.connect(fl); cadena = fl;
    }
    var env = c.createGain(), A = p.adsr || [0.01, 0.1, 1, 0.1], niv = 1;
    var a = A[0], d = A[1], s = A[2], r = A[3], tr = Math.max(t0 + a + d, t0 + dur - r);
    env.gain.setValueAtTime(0, t0); env.gain.linearRampToValueAtTime(niv, t0 + a);
    env.gain.linearRampToValueAtTime(niv * s, t0 + a + d); env.gain.setValueAtTime(niv * s, tr);
    env.gain.linearRampToValueAtTime(0, t0 + dur);
    cadena.connect(env); env.connect(g);
    var corr = { square: -6, sawtooth: -4.5 }[o.type] || 0;
    g.gain.value = ganancia((p.db || 0) + corr) * (m && m.tipo === 'anillo' ? 1.4 : 1);
    o.start(t0); o.stop(t0 + dur + 0.05); fuentes.push(o);
  }

  function sonar(p) {
    var c = contexto(); if (!c) return null;
    var t0 = c.currentTime + 0.02, fuentes = [], dur = 0, maestro = c.createGain();
    maestro.connect(c.destination);
    if (p.tipo === 'mezcla') {            // varios sonidos a la vez: {"tipo":"mezcla","partes":[{…},{…}]}
      (p.partes || []).forEach(function (q) { var r = sonarEn(c, q, t0 + (q.desde || 0), fuentes, maestro) + cola(q); dur = Math.max(dur, r + (q.desde || 0)); });
    } else dur = sonarEn(c, p, t0, fuentes, maestro) + cola(p);
    var fin = setTimeout(function () { parar(); }, (dur + 0.4) * 1000);
    return { fuentes: fuentes, fin: fin, maestro: maestro };
  }

  function sonarEn(c, p, t0, fuentes, maestro) {
    var dur = p.dur || 2.5, g = c.createGain();
    g.connect(salida(c, p, maestro, fuentes, t0));
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
      g2.connect(salida(c, p, maestro, fuentes, t0));
      envolvente(g, t0, d1, ganancia(p.db1 || 0)); envolvente(g2, t0 + d1 + 0.3, d1, ganancia(p.db2 || -6));
      o1.connect(g); o2.connect(g2); o1.start(t0); o1.stop(t0 + d1 + 0.05); o2.start(t0 + d1 + 0.3); o2.stop(t0 + dur + 0.2);
      fuentes.push(o1, o2);
    } else if (tipo === 'notas') {
      dur = notas(c, p, g, t0, fuentes);
    } else if (tipo === 'sint') {
      sint(c, p, g, t0, dur, fuentes);
    }
    return dur;
  }

  function parar() {
    if (actual) {
      clearTimeout(actual.fin);
      if (actual.maestro) { try { actual.maestro.gain.value = 0; actual.maestro.disconnect(); } catch (e) {} }
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
