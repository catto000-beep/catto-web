/* ============================================================
   catto.ar — Tarjeta de ajedrez
   Muestra la partida daily en curso (en vivo) o, si no hay,
   la última partida terminada, reproducible jugada por jugada.
   Datos: API pública de chess.com (sin credenciales, CORS abierto).
   Piezas: juego Cburnett (ver chess-pieces.js).
   ============================================================ */
(function () {
  "use strict";

  var USER = "catto000";
  var API = "https://api.chess.com/pub/player/" + USER;
  var LIGHT = "#EEEED2", DARK = "#769656", MARK = "#f6d55c";
  var S = 45; // lado de casilla en el viewBox

  var el = {};          // nodos del DOM
  var plies = [];       // posiciones: plies[i] = {b, from, to, san}
  var idx = 0;          // posición mostrada
  var flip = false;     // tablero dado vuelta
  var timer = null;     // reproducción automática
  var live = false;     // hay partida daily en curso

  /* ==========================================================
     MOTOR: tablero, generación de jugadas y lectura de SAN
     Tablero = matriz 8x8; fila 0 = fila 8 del tablero.
     Mayúscula = blanca, minúscula = negra, "" = vacía.
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
      cast: { K: true, Q: true, k: true, q: true }
    };
  }

  function fromFen(fen) {
    var parts = fen.split(" "), rows = parts[0].split("/"), b = [], r, i, c, row;
    for (r = 0; r < 8; r++) {
      row = [];
      for (i = 0; i < rows[r].length; i++) {
        c = rows[r][i];
        if (c >= "1" && c <= "8") { for (var k = 0; k < +c; k++) row.push(""); }
        else row.push(c);
      }
      b.push(row);
    }
    var cast = parts[2] || "-";
    return {
      b: b, turn: parts[1] || "w",
      ep: parts[3] && parts[3] !== "-" ? sqToRC(parts[3]) : null,
      cast: { K: cast.indexOf("K") >= 0, Q: cast.indexOf("Q") >= 0,
              k: cast.indexOf("k") >= 0, q: cast.indexOf("q") >= 0 }
    };
  }

  function clone(g) {
    return { b: g.b.map(function (r) { return r.slice(); }), turn: g.turn,
             ep: g.ep ? { r: g.ep.r, f: g.ep.f } : null,
             cast: { K: g.cast.K, Q: g.cast.Q, k: g.cast.k, q: g.cast.q } };
  }

  function sqToRC(s) { return { r: 8 - parseInt(s[1], 10), f: s.charCodeAt(0) - 97 }; }
  function colorOf(p) { return p ? (p === p.toUpperCase() ? "w" : "b") : null; }
  function inside(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }

  var STEP = {
    n: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    k: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  };
  var SLIDE = {
    b: [[-1,-1],[-1,1],[1,-1],[1,1]],
    r: [[-1,0],[1,0],[0,-1],[0,1]],
    q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
  };

  /* ¿la pieza en (r,f) ataca la casilla (tr,tf)? (sin considerar jaques) */
  function attacks(g, r, f, tr, tf) {
    var p = g.b[r][f], t = p.toLowerCase(), col = colorOf(p), i, d, rr, ff;
    if (!p) return false;
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
    return k ? attacked(g, k.r, k.f, col === "w" ? "b" : "w") : false;
  }

  /* ¿puede la pieza de (r,f) mover a (tr,tf)? Incluye reglas del peón. */
  function canMove(g, r, f, tr, tf) {
    var p = g.b[r][f], t = p.toLowerCase(), col = colorOf(p);
    var dest = g.b[tr][tf];
    if (dest && colorOf(dest) === col) return false;
    if (t === "p") {
      var dir = col === "w" ? -1 : 1, start = col === "w" ? 6 : 1;
      if (tf === f) {                       // avance
        if (dest) return false;
        if (tr === r + dir) return true;
        if (r === start && tr === r + 2 * dir && !g.b[r + dir][f]) return true;
        return false;
      }
      if (Math.abs(tf - f) === 1 && tr === r + dir) {   // captura
        if (dest) return true;
        if (g.ep && g.ep.r === tr && g.ep.f === tf) return true;  // al paso
      }
      return false;
    }
    return attacks(g, r, f, tr, tf);
  }

  /* Aplica un movimiento ya resuelto y devuelve la nueva posición. */
  function doMove(g, from, to, promo) {
    var n = clone(g), p = n.b[from.r][from.f], t = p.toLowerCase(), col = colorOf(p);
    var dir = col === "w" ? -1 : 1;

    // captura al paso: sacar el peón que quedó atrás
    if (t === "p" && from.f !== to.f && !n.b[to.r][to.f]) n.b[to.r - dir][to.f] = "";

    n.b[to.r][to.f] = promo ? (col === "w" ? promo.toUpperCase() : promo.toLowerCase()) : p;
    n.b[from.r][from.f] = "";

    // enroque: mover también la torre
    if (t === "k" && Math.abs(to.f - from.f) === 2) {
      var rank = from.r;
      if (to.f === 6) { n.b[rank][5] = n.b[rank][7]; n.b[rank][7] = ""; }
      else { n.b[rank][3] = n.b[rank][0]; n.b[rank][0] = ""; }
    }

    // derechos de enroque
    if (t === "k") { if (col === "w") { n.cast.K = n.cast.Q = false; } else { n.cast.k = n.cast.q = false; } }
    if (from.r === 7 && from.f === 0) n.cast.Q = false;
    if (from.r === 7 && from.f === 7) n.cast.K = false;
    if (from.r === 0 && from.f === 0) n.cast.q = false;
    if (from.r === 0 && from.f === 7) n.cast.k = false;
    if (to.r === 7 && to.f === 0) n.cast.Q = false;
    if (to.r === 7 && to.f === 7) n.cast.K = false;
    if (to.r === 0 && to.f === 0) n.cast.q = false;
    if (to.r === 0 && to.f === 7) n.cast.k = false;

    // casilla de captura al paso
    n.ep = (t === "p" && Math.abs(to.r - from.r) === 2) ? { r: from.r + dir, f: from.f } : null;
    n.turn = col === "w" ? "b" : "w";
    return n;
  }

  /* Interpreta una jugada en notación algebraica y la aplica. */
  function applySan(g, san) {
    var col = g.turn, rank = col === "w" ? 7 : 0, from, to;
    san = san.replace(/[+#!?]/g, "").trim();

    if (/^[O0]-[O0]-[O0]$/.test(san)) { from = { r: rank, f: 4 }; to = { r: rank, f: 2 }; }
    else if (/^[O0]-[O0]$/.test(san)) { from = { r: rank, f: 4 }; to = { r: rank, f: 6 }; }
    else {
      var promo = null, m = san.match(/=([QRBN])$/);
      if (m) { promo = m[1]; san = san.slice(0, m.index); }
      var target = san.slice(-2);
      if (!/^[a-h][1-8]$/.test(target)) return null;
      to = sqToRC(target);
      var head = san.slice(0, -2).replace("x", "");
      var type = /^[KQRBN]/.test(head) ? head[0] : "P";
      if (type !== "P") head = head.slice(1);
      var wantF = null, wantR = null, i;
      for (i = 0; i < head.length; i++) {
        if (head[i] >= "a" && head[i] <= "h") wantF = head.charCodeAt(i) - 97;
        if (head[i] >= "1" && head[i] <= "8") wantR = 8 - parseInt(head[i], 10);
      }
      var want = col === "w" ? type.toUpperCase() : type.toLowerCase();
      var cands = [];
      for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
        if (g.b[r][f] !== want) continue;
        if (wantF !== null && f !== wantF) continue;
        if (wantR !== null && r !== wantR) continue;
        if (!canMove(g, r, f, to.r, to.f)) continue;
        if (inCheck(doMove(g, { r: r, f: f }, to, promo), col)) continue;  // no puede quedar en jaque
        cands.push({ r: r, f: f });
      }
      if (!cands.length) return null;
      from = cands[0];
      return { pos: doMove(g, from, to, promo), from: from, to: to };
    }
    return { pos: doMove(g, from, to, null), from: from, to: to };
  }

  /* Convierte el movetext de un PGN en la lista de posiciones. */
  function buildPlies(movetext) {
    var g = startPos(), out = [{ b: g.b, from: null, to: null, san: null, pos: g }];
    var clean = movetext
      .replace(/\{[^}]*\}/g, " ")     // comentarios y relojes
      .replace(/\([^)]*\)/g, " ")     // variantes
      .replace(/\$\d+/g, " ")         // NAGs
      .replace(/\d+\.(\.\.)?/g, " ")  // números de jugada
      .replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/, " ");
    var toks = clean.split(/\s+/).filter(Boolean);
    for (var i = 0; i < toks.length; i++) {
      var res = applySan(g, toks[i]);
      if (!res) break;               // ante notación rara, cortamos prolijo
      g = res.pos;
      out.push({ b: g.b, from: res.from, to: res.to, san: toks[i], pos: g });
    }
    return out;
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  function renderBoard() {
    var ply = plies[idx];
    if (!ply) return;
    var b = ply.b, o = "", r, f, rr, ff, ch;
    var files = "abcdefgh";
    for (r = 0; r < 8; r++) for (f = 0; f < 8; f++) {
      rr = flip ? 7 - r : r; ff = flip ? 7 - f : f;
      o += '<rect x="' + f * S + '" y="' + r * S + '" width="' + S + '" height="' + S +
           '" fill="' + ((rr + ff) % 2 === 0 ? LIGHT : DARK) + '"/>';
    }
    function mark(sq) {
      if (!sq) return;
      var mr = flip ? 7 - sq.r : sq.r, mf = flip ? 7 - sq.f : sq.f;
      o += '<rect x="' + mf * S + '" y="' + mr * S + '" width="' + S + '" height="' + S +
           '" fill="' + MARK + '" opacity=".45"/>';
    }
    mark(ply.from); mark(ply.to);
    for (r = 0; r < 8; r++) for (f = 0; f < 8; f++) {
      ch = b[r][f];
      if (!ch) continue;
      rr = flip ? 7 - r : r; ff = flip ? 7 - f : f;
      o += '<g transform="translate(' + ff * S + ',' + rr * S + ')">' +
           (window.CHESS_PIECES[ch] || "") + "</g>";
    }
    for (r = 0; r < 8; r++) {
      rr = flip ? 7 - r : r;
      o += '<text class="cc" x="3" y="' + (r * S + 12) + '" fill="' +
           ((r + 0) % 2 === 0 ? DARK : LIGHT) + '">' + (flip ? r + 1 : 8 - r) + "</text>";
    }
    for (f = 0; f < 8; f++) {
      o += '<text class="cc" x="' + (f * S + S - 7) + '" y="356" fill="' +
           ((f + 7) % 2 === 0 ? LIGHT : DARK) + '">' + files[flip ? 7 - f : f] + "</text>";
    }
    el.board.innerHTML = o;
  }

  /* Contador de jugadas, al costado de los controles.
     Muestra también la jugada actual en notación, si la hay. */
  function renderCounter() {
    if (!el.count) return;
    var san = plies[idx] && plies[idx].san;
    var n = idx ? Math.ceil(idx / 2) + (idx % 2 ? "." : "…") + san : "";
    el.count.textContent = (n ? n + "  ·  " : "") + idx + "/" + (plies.length - 1);
  }

  function go(i) {
    idx = Math.max(0, Math.min(plies.length - 1, i));
    renderBoard(); renderCounter();
  }

  function play() {
    if (timer) { stop(); return; }
    if (idx >= plies.length - 1) idx = 0;
    el.play.textContent = "❚❚";
    timer = setInterval(function () {
      if (idx >= plies.length - 1) { stop(); return; }
      go(idx + 1);
    }, 700);
  }
  function stop() { clearInterval(timer); timer = null; el.play.textContent = "▶"; }

  /* ==========================================================
     DATOS
     ========================================================== */

  function jget(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function fmtDate(ts) {
    var d = new Date(ts * 1000);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  }

  function pgnHeaders(pgn) {
    var h = {}, re = /\[(\w+)\s+"([^"]*)"\]/g, m;
    while ((m = re.exec(pgn))) h[m[1]] = m[2];
    return h;
  }
  /* Quita las líneas de cabecera y deja el movetext.
     Ojo: no sirve buscar el último "]" porque los relojes de chess.com
     vienen como {[%clk 0:02:41]}, con corchetes dentro de las jugadas. */
  function pgnMoves(pgn) {
    return pgn.split(/\r?\n/)
      .filter(function (l) { return !/^\s*\[.*\]\s*$/.test(l); })
      .join(" ").trim();
  }

  function setPlayers(topName, topRat, topAv, botName, botRat, botAv) {
    el.topName.textContent = topName;
    el.topRat.textContent = topRat || "";
    el.botName.textContent = botName;
    el.botRat.textContent = botRat || "";
    setAvatar(el.topAv, topAv, topName);
    setAvatar(el.botAv, botAv, botName);
  }
  function setAvatar(node, url, name) {
    if (url) node.innerHTML = '<img src="' + url + '" alt="">';
    else node.textContent = (name || "?").slice(0, 2).toUpperCase();
  }

  function setPill(text, kind) {
    el.pill.textContent = text;
    el.pill.className = "chess-pill " + (kind || "");
  }

  /* Resultado legible desde el punto de vista de catto000 */
  function resultText(g) {
    var me = g.white.username.toLowerCase() === USER ? g.white : g.black;
    var other = me === g.white ? g.black : g.white;
    var map = {
      win: "Ganó", checkmated: "Perdió por jaque mate", resigned: "Abandonó",
      timeout: "Perdió por tiempo", stalemate: "Tablas por ahogado",
      agreed: "Tablas acordadas", repetition: "Tablas por repetición",
      insufficient: "Tablas por material insuficiente", abandoned: "Abandonada",
      timevsinsufficient: "Tablas por tiempo", "50move": "Tablas por regla de 50",
      kingofthehill: "Perdió", threecheck: "Perdió", bughousepartnerlose: "Perdió"
    };
    if (me.result === "win") {
      var how = { checkmated: "jaque mate", resigned: "abandono", timeout: "tiempo",
                  abandoned: "abandono" }[other.result];
      return { txt: how ? "Ganó por " + how : "Ganó", cls: "ok" };
    }
    var t = map[me.result] || "Terminada";
    var cls = /Tablas/.test(t) ? "draw" : "lose";
    return { txt: t, cls: cls };
  }

  function timeClass(g) {
    var tc = { blitz: "Blitz", bullet: "Bullet", rapid: "Rápida", daily: "Daily" }[g.time_class] || g.time_class;
    var base = parseInt(g.time_control, 10);
    var mins = base ? Math.round(base / 60) : null;
    return tc + (mins ? " " + mins + " min" : "");
  }

  /* ==========================================================
     CARGA
     ========================================================== */

  function loadLastGame() {
    return jget(API + "/games/archives").then(function (a) {
      var last = a.archives && a.archives[a.archives.length - 1];
      if (!last) throw new Error("sin archivos");
      return jget(last);
    }).then(function (m) {
      var games = m.games || [];
      if (!games.length) throw new Error("sin partidas");
      var g = games[games.length - 1];
      var mine = g.white.username.toLowerCase() === USER ? "w" : "b";
      var me = mine === "w" ? g.white : g.black;
      var other = mine === "w" ? g.black : g.white;

      plies = buildPlies(pgnMoves(g.pgn || ""));
      if (plies.length < 2) {                       // sin PGN utilizable: al menos la posición final
        plies = [{ b: fromFen(g.fen).b, from: null, to: null, san: null }];
      }
      flip = mine === "b";
      idx = plies.length - 1;

      setPill("Última partida", "past");
      var res = resultText(g);
      el.result.textContent = res.txt;
      el.result.className = "chess-badge " + res.cls;
      el.meta.textContent = timeClass(g) + " · " + fmtDate(g.end_time);
      el.link.href = g.url;

      setPlayers(other.username, other.rating, null, me.username, me.rating, null);
      go(idx);

      // avatares reales (dos pedidos en serie, livianos)
      return jget("https://api.chess.com/pub/player/" + other.username.toLowerCase())
        .then(function (p) { setAvatar(el.topAv, p.avatar_url, other.username); })
        .catch(function () {})
        .then(function () { return jget(API); })
        .then(function (p) { setAvatar(el.botAv, p.avatar_url, me.username); })
        .catch(function () {});
    });
  }

  function loadDaily() {
    return jget(API + "/games").then(function (d) {
      var games = (d.games || []).filter(function (g) { return g.fen; });
      if (!games.length) return false;
      var g = games[0];
      var mine = g.white.indexOf("/" + USER) >= 0 ? "w" : "b";
      var otherUrl = mine === "w" ? g.black : g.white;
      var otherName = otherUrl.split("/").pop();

      plies = [{ b: fromFen(g.fen).b, from: null, to: null, san: null }];
      flip = mine === "b";
      idx = 0;
      live = true;

      setPill("En vivo", "live");
      el.result.textContent = (g.turn === (mine === "w" ? "white" : "black"))
        ? "Te toca jugar" : "Espera la jugada del rival";
      el.result.className = "chess-badge live";
      el.meta.textContent = "Daily · partida en curso";
      el.link.href = g.url || ("https://www.chess.com/member/" + USER);

      setPlayers(otherName, "", null, USER, "", null);
      go(0);
      if (el.ctrls) el.ctrls.style.display = "none";
      return true;
    }).catch(function () { return false; });
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  function init() {
    var root = document.getElementById("chessCard");
    if (!root || !window.CHESS_PIECES) return;

    el.board = root.querySelector("#chessBoard");
    el.pill = root.querySelector("#chessPill");
    el.count = root.querySelector("#chessCount");
    el.result = root.querySelector("#chessResult");
    el.meta = root.querySelector("#chessMeta");
    el.link = root.querySelector("#chessLink");
    el.topName = root.querySelector("#chessTopName");
    el.topRat = root.querySelector("#chessTopRat");
    el.topAv = root.querySelector("#chessTopAv");
    el.botName = root.querySelector("#chessBotName");
    el.botRat = root.querySelector("#chessBotRat");
    el.botAv = root.querySelector("#chessBotAv");
    el.play = root.querySelector("#chessPlay");
    el.ctrls = root.querySelector("#chessCtrls");

    root.querySelector("#chessFirst").onclick = function () { stop(); go(0); };
    root.querySelector("#chessPrev").onclick = function () { stop(); go(idx - 1); };
    root.querySelector("#chessNext").onclick = function () { stop(); go(idx + 1); };
    root.querySelector("#chessLast").onclick = function () { stop(); go(plies.length - 1); };
    el.play.onclick = play;
    root.querySelector("#chessFlip").onclick = function () { flip = !flip; renderBoard(); };
    document.addEventListener("keydown", function (e) {
      if (!root.matches(":hover")) return;
      if (e.key === "ArrowLeft") { stop(); go(idx - 1); }
      if (e.key === "ArrowRight") { stop(); go(idx + 1); }
    });

    // posición inicial mientras carga
    plies = [{ b: startPos().b, from: null, to: null, san: null }];
    go(0);

    loadDaily().then(function (hasLive) {
      if (!hasLive) return loadLastGame();
      setInterval(function () { loadDaily(); }, 45000);   // refresco en vivo
    }).catch(function () {
      setPill("No disponible", "past");
      el.meta.textContent = "No se pudo consultar chess.com";
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
