/* ============================================================
   catto.ar — Tablero para jugar de a dos en la misma pantalla
   Pensado para los estudiantes: eligen el reloj, juegan por turnos
   y el tablero se encarga de las reglas (jugadas legales, enroque,
   captura al paso, coronación, jaque mate, ahogado y tablas).
   Las piezas son las Cburnett de chess-pieces.js.
   ============================================================ */
(function () {
  "use strict";

  var LIGHT = "#EEEED2", DARK = "#769656", MARK = "#f6d55c", S = 45;

  /* Tiempos de juego estándar (base en segundos + incremento por jugada) */
  var RELOJES = [
    { id: "1+0",   txt: "Bullet · 1 min",             base: 60,   inc: 0 },
    { id: "2+1",   txt: "Bullet · 2 min + 1 s",       base: 120,  inc: 1 },
    { id: "3+0",   txt: "Blitz · 3 min",              base: 180,  inc: 0 },
    { id: "3+2",   txt: "Blitz · 3 min + 2 s",        base: 180,  inc: 2 },
    { id: "5+0",   txt: "Blitz · 5 min",              base: 300,  inc: 0 },
    { id: "5+3",   txt: "Blitz · 5 min + 3 s",        base: 300,  inc: 3 },
    { id: "6+0",   txt: "Blitz · 6 min",              base: 360,  inc: 0 },
    { id: "10+0",  txt: "Rápida · 10 min",            base: 600,  inc: 0 },
    { id: "10+5",  txt: "Rápida · 10 min + 5 s",      base: 600,  inc: 5 },
    { id: "15+10", txt: "Rápida · 15 min + 10 s",     base: 900,  inc: 10 },
    { id: "30+0",  txt: "Clásica · 30 min",           base: 1800, inc: 0 },
    { id: "0",     txt: "Sin reloj",                  base: 0,    inc: 0 }
  ];
  var RELOJ_INICIAL = "0";   /* arranca sin reloj: se juega tranquilo salvo que elijan tiempo */

  /* ==========================================================
     MOTOR — tablero 8x8, fila 0 = fila 8. Mayúscula = blanca.
     ========================================================== */

  function startPos() {
    return {
      b: [
        "rnbqkbnr".split(""), "pppppppp".split(""),
        ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""],
        "PPPPPPPP".split(""), "RNBQKBNR".split("")
      ],
      turn: "w", ep: null,
      cast: { K: true, Q: true, k: true, q: true },
      half: 0   // jugadas sin capturar ni mover peón (regla de 50)
    };
  }

  function clone(g) {
    return { b: g.b.map(function (r) { return r.slice(); }), turn: g.turn,
             ep: g.ep ? { r: g.ep.r, f: g.ep.f } : null,
             cast: { K: g.cast.K, Q: g.cast.Q, k: g.cast.k, q: g.cast.q },
             half: g.half };
  }

  function colorOf(p) { return p ? (p === p.toUpperCase() ? "w" : "b") : null; }
  function inside(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }
  function otro(c) { return c === "w" ? "b" : "w"; }

  var STEP = {
    n: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    k: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  };
  var SLIDE = {
    b: [[-1,-1],[-1,1],[1,-1],[1,1]],
    r: [[-1,0],[1,0],[0,-1],[0,1]],
    q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
  };

  function attacks(g, r, f, tr, tf) {
    var p = g.b[r][f], t, col, i, d, rr, ff;
    if (!p) return false;
    t = p.toLowerCase(); col = colorOf(p);
    if (t === "p") {
      var dir = col === "w" ? -1 : 1;
      return tr === r + dir && Math.abs(tf - f) === 1;
    }
    if (t === "n" || t === "k") {
      var steps = STEP[t];
      for (i = 0; i < steps.length; i++)
        if (r + steps[i][0] === tr && f + steps[i][1] === tf) return true;
      return false;
    }
    var dirs = SLIDE[t];
    for (i = 0; i < dirs.length; i++) {
      d = dirs[i]; rr = r + d[0]; ff = f + d[1];
      while (inside(rr, ff)) {
        if (rr === tr && ff === tf) return true;
        if (g.b[rr][ff]) break;
        rr += d[0]; ff += d[1];
      }
    }
    return false;
  }

  function attacked(g, tr, tf, byColor) {
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++)
      if (g.b[r][f] && colorOf(g.b[r][f]) === byColor && attacks(g, r, f, tr, tf))
        return true;
    return false;
  }

  function findKing(g, col) {
    var target = col === "w" ? "K" : "k";
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++)
      if (g.b[r][f] === target) return { r: r, f: f };
    return null;
  }

  function inCheck(g, col) {
    var k = findKing(g, col);
    return k ? attacked(g, k.r, k.f, otro(col)) : false;
  }

  /* Movimiento posible por la forma de la pieza (sin mirar jaques ni enroque) */
  function puedeMover(g, r, f, tr, tf) {
    var p = g.b[r][f], t = p.toLowerCase(), col = colorOf(p), dest = g.b[tr][tf];
    if (dest && colorOf(dest) === col) return false;
    if (t === "p") {
      var dir = col === "w" ? -1 : 1, salida = col === "w" ? 6 : 1;
      if (tf === f) {
        if (dest) return false;
        if (tr === r + dir) return true;
        if (r === salida && tr === r + 2 * dir && !g.b[r + dir][f]) return true;
        return false;
      }
      if (Math.abs(tf - f) === 1 && tr === r + dir) {
        if (dest) return true;
        if (g.ep && g.ep.r === tr && g.ep.f === tf) return true;   // al paso
      }
      return false;
    }
    return attacks(g, r, f, tr, tf);
  }

  function doMove(g, from, to, promo) {
    var n = clone(g), p = n.b[from.r][from.f], t = p.toLowerCase(), col = colorOf(p);
    var dir = col === "w" ? -1 : 1, captura = !!n.b[to.r][to.f];

    if (t === "p" && from.f !== to.f && !n.b[to.r][to.f]) {   // al paso
      n.b[to.r - dir][to.f] = ""; captura = true;
    }
    n.b[to.r][to.f] = promo ? (col === "w" ? promo.toUpperCase() : promo.toLowerCase()) : p;
    n.b[from.r][from.f] = "";

    if (t === "k" && Math.abs(to.f - from.f) === 2) {          // enroque: va la torre
      var rank = from.r;
      if (to.f === 6) { n.b[rank][5] = n.b[rank][7]; n.b[rank][7] = ""; }
      else { n.b[rank][3] = n.b[rank][0]; n.b[rank][0] = ""; }
    }

    if (t === "k") { if (col === "w") { n.cast.K = n.cast.Q = false; } else { n.cast.k = n.cast.q = false; } }
    if (from.r === 7 && from.f === 0) n.cast.Q = false;
    if (from.r === 7 && from.f === 7) n.cast.K = false;
    if (from.r === 0 && from.f === 0) n.cast.q = false;
    if (from.r === 0 && from.f === 7) n.cast.k = false;
    if (to.r === 7 && to.f === 0) n.cast.Q = false;
    if (to.r === 7 && to.f === 7) n.cast.K = false;
    if (to.r === 0 && to.f === 0) n.cast.q = false;
    if (to.r === 0 && to.f === 7) n.cast.k = false;

    n.ep = (t === "p" && Math.abs(to.r - from.r) === 2) ? { r: from.r + dir, f: from.f } : null;
    n.half = (t === "p" || captura) ? 0 : n.half + 1;
    n.turn = otro(col);
    return n;
  }

  /* Jugadas legales de la pieza de (r,f), incluido el enroque */
  function legalesDe(g, r, f) {
    var p = g.b[r][f], out = [], tr, tf;
    if (!p || colorOf(p) !== g.turn) return out;
    for (tr = 0; tr < 8; tr++) for (tf = 0; tf < 8; tf++) {
      if (tr === r && tf === f) continue;
      if (!puedeMover(g, r, f, tr, tf)) continue;
      if (inCheck(doMove(g, { r: r, f: f }, { r: tr, f: tf }, null), g.turn)) continue;
      out.push({ r: tr, f: tf });
    }
    if (p.toLowerCase() === "k" && f === 4) {
      var col = g.turn, rank = col === "w" ? 7 : 0, riv = otro(col);
      var corto = col === "w" ? g.cast.K : g.cast.k;
      var largo = col === "w" ? g.cast.Q : g.cast.q;
      if (r === rank && !inCheck(g, col)) {
        if (corto && !g.b[rank][5] && !g.b[rank][6] &&
            !attacked(g, rank, 5, riv) && !attacked(g, rank, 6, riv))
          out.push({ r: rank, f: 6 });
        if (largo && !g.b[rank][1] && !g.b[rank][2] && !g.b[rank][3] &&
            !attacked(g, rank, 3, riv) && !attacked(g, rank, 2, riv))
          out.push({ r: rank, f: 2 });
      }
    }
    return out;
  }

  function hayLegales(g) {
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++)
      if (g.b[r][f] && colorOf(g.b[r][f]) === g.turn && legalesDe(g, r, f).length) return true;
    return false;
  }

  /* Material insuficiente para dar mate: R vs R, R+A vs R, R+C vs R,
     y R+A vs R+A con los alfiles en casillas del mismo color. */
  function materialInsuficiente(g) {
    var piezas = [], r, f, p;
    for (r = 0; r < 8; r++) for (f = 0; f < 8; f++) {
      p = g.b[r][f];
      if (!p) continue;
      if (/[pqrPQR]/.test(p)) return false;         // peón, dama o torre: alcanza
      if (p.toLowerCase() !== "k") piezas.push({ p: p.toLowerCase(), col: (r + f) % 2 });
    }
    if (piezas.length <= 1) return true;                       // R vs R, R+A o R+C vs R
    if (piezas.length === 2 && piezas[0].p === "b" && piezas[1].p === "b")
      return piezas[0].col === piezas[1].col;                  // alfiles del mismo color
    return false;
  }

  /* Clave de posición para detectar la triple repetición */
  function clave(g) {
    return g.b.map(function (r) { return r.map(function (c) { return c || "."; }).join(""); }).join("/") +
           " " + g.turn + " " + (g.cast.K ? "K" : "") + (g.cast.Q ? "Q" : "") +
           (g.cast.k ? "k" : "") + (g.cast.q ? "q" : "") + " " + (g.ep ? g.ep.f : "-");
  }

  /* ==========================================================
     ESTADO DE LA PARTIDA
     ========================================================== */

  var el = {};
  var g = startPos();
  var hist = [];            // [{g, from, to, t:{w,b}}] para deshacer
  var claves = [clave(g)];
  var ultima = null;        // último movimiento {from,to}
  var sel = null, destinos = [];
  var flip = false;
  var reloj = RELOJES[0], t = { w: 0, b: 0 };
  var corriendo = false, arrancada = false, tic = null, marca = 0;
  var fin = null;           // {txt, cls} cuando la partida terminó
  var promoPend = null;     // {from,to} esperando la pieza de coronación
  var jaque = false;        // ¿está en jaque el que tiene que mover? (se calcula al dibujar,
                            //  no en cada tic del reloj, que corre 10 veces por segundo)

  function relojPorId(id) {
    for (var i = 0; i < RELOJES.length; i++) if (RELOJES[i].id === id) return RELOJES[i];
    return RELOJES[0];
  }

  function nuevaPartida() {
    pararReloj();
    g = startPos(); hist = []; claves = [clave(g)];
    ultima = null; sel = null; destinos = []; fin = null; promoPend = null;
    arrancada = false;
    t = { w: reloj.base, b: reloj.base };
    ocultarPromo();
    render();
  }

  /* ==========================================================
     RELOJ
     ========================================================== */

  function fmt(s) {
    if (s <= 0) return "0:00";
    if (s < 20) return s.toFixed(1).replace(".", ",");          // décimas en el apuro
    var m = Math.floor(s / 60), seg = Math.floor(s % 60);
    return m + ":" + (seg < 10 ? "0" : "") + seg;
  }

  function arrancarReloj() {
    if (fin || corriendo || !reloj.base) return;
    corriendo = true; arrancada = true; marca = Date.now();
    tic = setInterval(tick, 100);
    pintarEstado();
  }
  function pararReloj() {
    corriendo = false;
    if (tic) { clearInterval(tic); tic = null; }
  }
  /* El ▶ hace de reloj de torneo: si nadie jugó todavía, lo pone en marcha. */
  function pausar() {
    if (!reloj.base || fin) return;
    if (corriendo) { descontar(); pararReloj(); } else { arrancarReloj(); }
    pintarEstado();
  }
  function descontar() {
    var ahora = Date.now();
    t[g.turn] = Math.max(0, t[g.turn] - (ahora - marca) / 1000);
    marca = ahora;
  }
  function tick() {
    descontar();
    if (t[g.turn] <= 0) {
      t[g.turn] = 0;
      pararReloj();
      terminar(g.turn === "w" ? "Se acabó el tiempo: ganan las negras" : "Se acabó el tiempo: ganan las blancas", "ok");
    }
    pintarRelojes(); pintarEstado();
  }

  /* ==========================================================
     JUGAR
     ========================================================== */

  function clickCasilla(r, f) {
    if (fin || promoPend) return;
    var p = g.b[r][f];
    if (sel) {
      var ok = destinos.some(function (d) { return d.r === r && d.f === f; });
      if (ok) { intentar(sel, { r: r, f: f }); return; }
      if (sel.r === r && sel.f === f) { sel = null; destinos = []; render(); return; }
    }
    if (p && colorOf(p) === g.turn) {
      sel = { r: r, f: f }; destinos = legalesDe(g, r, f);
    } else { sel = null; destinos = []; }
    render();
  }

  function intentar(from, to) {
    var p = g.b[from.r][from.f];
    var corona = p.toLowerCase() === "p" && (to.r === 0 || to.r === 7);
    if (corona) { promoPend = { from: from, to: to }; mostrarPromo(); return; }
    aplicar(from, to, null);
  }

  function aplicar(from, to, promo) {
    var quienMovio = g.turn;
    if (reloj.base && corriendo) descontar();

    g = doMove(g, from, to, promo);
    hist.push({ from: from, to: to, promo: promo, t: { w: t.w, b: t.b } });
    claves.push(clave(g));
    ultima = { from: from, to: to };
    sel = null; destinos = []; promoPend = null;
    ocultarPromo();

    if (reloj.base) {
      t[quienMovio] += reloj.inc;
      if (!arrancada) arrancarReloj(); else marca = Date.now();
    }

    evaluarFinal();
    render();
  }

  function evaluarFinal() {
    if (!hayLegales(g)) {
      if (inCheck(g, g.turn))
        terminar(g.turn === "w" ? "Jaque mate: ganan las negras" : "Jaque mate: ganan las blancas", "ok");
      else terminar("Ahogado: tablas", "draw");
      return;
    }
    if (materialInsuficiente(g)) { terminar("Tablas por material insuficiente", "draw"); return; }
    if (g.half >= 100) { terminar("Tablas por la regla de las 50 jugadas", "draw"); return; }
    var k = claves[claves.length - 1], n = 0;
    for (var i = 0; i < claves.length; i++) if (claves[i] === k) n++;
    if (n >= 3) terminar("Tablas por triple repetición", "draw");
  }

  function terminar(txt, cls) {
    fin = { txt: txt, cls: cls };
    pararReloj();
  }

  function deshacer() {
    if (!hist.length) return;
    var paso = hist.pop();
    claves.pop();
    // rehacemos la partida desde el principio: es instantáneo y evita
    // guardar copias del tablero en cada jugada
    var g2 = startPos(), i;
    for (i = 0; i < hist.length; i++) g2 = doMove(g2, hist[i].from, hist[i].to, hist[i].promo);
    g = g2;
    t = { w: paso.t.w, b: paso.t.b };
    ultima = hist.length ? { from: hist[hist.length - 1].from, to: hist[hist.length - 1].to } : null;
    sel = null; destinos = []; fin = null; promoPend = null;
    ocultarPromo();
    if (corriendo) marca = Date.now();
    render();
  }

  /* ==========================================================
     DIBUJO
     ========================================================== */

  function vr(r) { return flip ? 7 - r : r; }   // fila en pantalla
  function vf(f) { return flip ? 7 - f : f; }   // columna en pantalla

  function render() {
    var o = "", r, f, x, y, ch, files = "abcdefgh";
    jaque = inCheck(g, g.turn);

    for (r = 0; r < 8; r++) for (f = 0; f < 8; f++) {
      x = vf(f) * S; y = vr(r) * S;
      o += '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S +
           '" fill="' + ((r + f) % 2 === 0 ? LIGHT : DARK) + '"/>';
    }
    function pintar(sq, color, op) {
      if (!sq) return;
      o += '<rect x="' + vf(sq.f) * S + '" y="' + vr(sq.r) * S + '" width="' + S + '" height="' + S +
           '" fill="' + color + '" opacity="' + op + '"/>';
    }
    if (ultima) { pintar(ultima.from, MARK, .45); pintar(ultima.to, MARK, .45); }
    if (sel) pintar(sel, "#4fa3ff", .5);

    if (jaque) pintar(findKing(g, g.turn), "#f85149", .55);   // rey en jaque

    for (r = 0; r < 8; r++) for (f = 0; f < 8; f++) {
      ch = g.b[r][f];
      if (!ch) continue;
      o += '<g transform="translate(' + vf(f) * S + ',' + vr(r) * S + ')">' +
           (window.CHESS_PIECES[ch] || "") + "</g>";
    }

    // a dónde puede ir la pieza elegida
    destinos.forEach(function (d) {
      var cx = vf(d.f) * S + S / 2, cy = vr(d.r) * S + S / 2;
      if (g.b[d.r][d.f] || (g.ep && g.ep.r === d.r && g.ep.f === d.f))
        o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (S / 2 - 2) +
             '" fill="none" stroke="#1f6feb" stroke-width="3.5" opacity=".85"/>';
      else
        o += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#1f6feb" opacity=".65"/>';
    });

    /* Coordenadas: los números de las filas arriba a la izquierda y las letras
       de las columnas abajo a la derecha, como en cualquier tablero.

       Cada rótulo va del color contrario al de su casilla, si no no se lee.
       La casilla de la columna c en la fila de abajo sale (7+c)%2 —da lo mismo
       de qué lado se mire el tablero, porque dar vuelta la fila y la columna no
       le cambia la paridad—, así que la letra va justo al revés. */
    for (r = 0; r < 8; r++)
      o += '<text class="cc" x="3" y="' + (vr(r) * S + 12) + '" fill="' +
           ((vr(r) + 0) % 2 === 0 ? DARK : LIGHT) + '">' + (8 - r) + "</text>";
    for (f = 0; f < 8; f++)
      o += '<text class="cc" x="' + (vf(f) * S + S - 7) + '" y="356" fill="' +
           ((vf(f) + 7) % 2 === 0 ? DARK : LIGHT) + '">' + files[f] + "</text>";

    // capa transparente para los clics (va última, así recibe todo)
    for (r = 0; r < 8; r++) for (f = 0; f < 8; f++)
      o += '<rect class="cp-hit" x="' + vf(f) * S + '" y="' + vr(r) * S + '" width="' + S +
           '" height="' + S + '" fill="transparent" data-r="' + r + '" data-f="' + f + '"/>';

    el.board.innerHTML = o;
    pintarRelojes();
    pintarEstado();
  }

  function pintarRelojes() {
    // la fila de arriba muestra al que juega desde el otro lado del tablero
    var arriba = flip ? "w" : "b", abajo = flip ? "b" : "w";
    el.topName.textContent = arriba === "w" ? "Blancas" : "Negras";
    el.botName.textContent = abajo === "w" ? "Blancas" : "Negras";
    el.topAv.textContent = arriba === "w" ? "♔" : "♚";
    el.botAv.textContent = abajo === "w" ? "♔" : "♚";
    el.topAv.className = "chess-av cp-av " + (arriba === "w" ? "wh" : "bl");
    el.botAv.className = "chess-av cp-av " + (abajo === "w" ? "wh" : "bl");

    if (!reloj.base) {
      el.topClock.textContent = "—";
      el.botClock.textContent = "—";
    } else {
      el.topClock.textContent = fmt(t[arriba]);
      el.botClock.textContent = fmt(t[abajo]);
    }
    el.topRow.classList.toggle("activo", !fin && g.turn === arriba);
    el.botRow.classList.toggle("activo", !fin && g.turn === abajo);
    el.topClock.classList.toggle("apuro", !!reloj.base && t[arriba] < 20);
    el.botClock.classList.toggle("apuro", !!reloj.base && t[abajo] < 20);
  }

  function pintarEstado() {
    var txt, cls = "";
    if (fin) { txt = fin.txt; cls = fin.cls; }
    else {
      txt = (g.turn === "w" ? "Mueven las blancas" : "Mueven las negras");
      if (jaque) txt += " · ¡jaque!";
      if (reloj.base && !corriendo && arrancada) txt = "En pausa · " + txt;
    }
    el.status.textContent = txt;
    el.status.className = "chess-badge cp-status " + cls;
    el.pause.textContent = corriendo ? "⏸" : "▶";
    el.pause.title = corriendo ? "Pausar el reloj" : "Poner en marcha el reloj";
    el.pause.disabled = !reloj.base || !!fin;
    el.pause.hidden = !reloj.base;   // sin reloj no hay nada que pausar
    el.undo.disabled = !hist.length;
  }

  /* ---- Coronación ---- */
  function mostrarPromo() {
    var col = g.turn, piezas = ["q", "r", "b", "n"], o = "";
    piezas.forEach(function (p) {
      var ch = col === "w" ? p.toUpperCase() : p;
      o += '<button data-p="' + p + '" title="Coronar" aria-label="Coronar">' +
           '<svg viewBox="0 0 45 45">' + (window.CHESS_PIECES[ch] || "") + "</svg></button>";
    });
    el.promoBox.innerHTML = o;
    el.promo.classList.remove("hidden");
  }
  function ocultarPromo() { if (el.promo) el.promo.classList.add("hidden"); }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  function init() {
    var root = document.getElementById("cpCard");
    if (!root || !window.CHESS_PIECES) return;

    el.board = root.querySelector("#cpBoard");
    el.sel = root.querySelector("#cpReloj");
    el.status = root.querySelector("#cpStatus");
    el.topRow = root.querySelector("#cpTopRow");
    el.botRow = root.querySelector("#cpBotRow");
    el.topName = root.querySelector("#cpTopName");
    el.botName = root.querySelector("#cpBotName");
    el.topAv = root.querySelector("#cpTopAv");
    el.botAv = root.querySelector("#cpBotAv");
    el.topClock = root.querySelector("#cpTopClock");
    el.botClock = root.querySelector("#cpBotClock");
    el.pause = root.querySelector("#cpPause");
    el.undo = root.querySelector("#cpUndo");
    el.promo = root.querySelector("#cpPromo");
    el.promoBox = root.querySelector("#cpPromoBox");

    // opciones de reloj
    var o = "";
    RELOJES.forEach(function (rj) {
      o += '<option value="' + rj.id + '"' + (rj.id === RELOJ_INICIAL ? " selected" : "") + ">" + rj.txt + "</option>";
    });
    el.sel.innerHTML = o;
    reloj = relojPorId(RELOJ_INICIAL);

    el.sel.onchange = function () { reloj = relojPorId(this.value); nuevaPartida(); };
    root.querySelector("#cpNueva").onclick = function () {
      if (hist.length && !fin && !confirm("¿Empezar una partida nueva? Se pierde la actual.")) return;
      nuevaPartida();
    };
    root.querySelector("#cpFlip").onclick = function () { flip = !flip; render(); };
    el.undo.onclick = deshacer;
    el.pause.onclick = pausar;

    el.board.addEventListener("click", function (ev) {
      var hit = ev.target.closest ? ev.target.closest(".cp-hit") : null;
      if (!hit) return;
      clickCasilla(+hit.getAttribute("data-r"), +hit.getAttribute("data-f"));
    });
    el.promoBox.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button") : null;
      if (!b || !promoPend) return;
      aplicar(promoPend.from, promoPend.to, b.getAttribute("data-p"));
    });
    // clic fuera de las piezas: se cancela la coronación
    el.promo.addEventListener("click", function (ev) {
      if (ev.target !== el.promo) return;
      promoPend = null; ocultarPromo(); render();
    });

    nuevaPartida();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
