/* ============================================================================
   Transistores bipolares — figuras de la tarjeta (catto.ar)
   Rehechas de cero el 16/10/2026 con el método del esquemático del semáforo:
   cada figura tiene su grilla pensada antes de dibujar, las ramas van en
   columnas rectas y cada rótulo tiene un lugar libre. El componente de React
   de cada solapa pide acá el SVG ya armado (window.cattoBJT.*).
   Verificación: scratchpad/esq/choques.cjs en todas las solapas y variantes.
   ========================================================================== */
(function () {
  "use strict";
  /* idioma de la página: «en» en /en/, castellano en el resto */
  var EN = document.documentElement.lang === "en";
  function T(es, en) { return EN ? en : es; }

  var CABLE = "#8896a6", COMP = "#c8d2dd", ROT = "#9aa7b4", AZUL = "#58a6ff",
      VERDE = "#3fb950", ROJO = "#f85149", AMBAR = "#d29922", GRILLA = "#212836",
      EJE = "#5a6675", FONDO = "#1c2230";
  var FUENTE = "Segoe UI,system-ui,Roboto,Arial,sans-serif";

  function n(v) { return Math.round(v * 10) / 10; }

  /* ---------------------------------------------------------------- piezas */
  function Dib() { this.s = []; }
  Dib.prototype = {
    add: function (x) { this.s.push(x); return this; },
    cable: function (pts, c, w) {
      this.s.push('<polyline points="' + pts.map(function (p) { return n(p[0]) + "," + n(p[1]); }).join(" ") +
        '" fill="none" stroke="' + (c || CABLE) + '" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round"/>');
      return this;
    },
    nodo: function (x, y, c) { this.s.push('<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + (c || CABLE) + '"/>'); return this; },
    borne: function (x, y, c) {
      this.s.push('<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="#0d1117" stroke="' + (c || CABLE) + '" stroke-width="1.6"/>');
      return this;
    },
    /* texto con subíndices: "V_CC", "R_{B} = 4,7 kΩ", "ΔI_C = β · ΔI_B" */
    texto: function (x, y, s, o) {
      o = o || {};
      var partes = [], re = /_(\{([^}]*)\}|([A-Za-z0-9]+))/g, m, ult = 0;
      while ((m = re.exec(s))) {
        if (m.index > ult) partes.push([s.slice(ult, m.index), 0]);
        partes.push([m[2] !== undefined ? m[2] : m[3], 1]);
        ult = re.lastIndex;
      }
      if (ult < s.length) partes.push([s.slice(ult), 0]);
      var h = "", baja = false;
      partes.forEach(function (p) {
        if (p[1]) { h += '<tspan dy="3" font-size="0.76em">' + p[0] + "</tspan>"; baja = true; }
        else { h += baja ? '<tspan dy="-3">' + p[0] + "</tspan>" : p[0]; baja = false; }
      });
      var at = ' x="' + x + '" y="' + y + '"' + (o.a ? ' text-anchor="' + o.a + '"' : "") +
        ' font-size="' + (o.t || 12) + '"' + (o.b ? ' font-weight="' + o.b + '"' : "") +
        ' fill="' + (o.c || ROT) + '"' + (o.halo ? ' stroke="#0a0e17" stroke-width="3" paint-order="stroke"' : "") +
        (o.rot ? ' transform="rotate(' + o.rot + " " + x + " " + y + ')"' : "");
      this.s.push("<text" + at + ">" + h + "</text>");
      return this;
    },
    /* resistor en zigzag vertical entre y0 e y1 (cuerpo de 30 px centrado) */
    resV: function (x, y0, y1, c) {
      var m = (y0 + y1) / 2, p = [[x, y0], [x, m - 15]];
      for (var i = 0; i < 6; i++) p.push([x + (i % 2 ? -6 : 6), m - 12.5 + i * 5]);
      p.push([x, m + 15], [x, y1]);
      return this.cable(p, c || COMP);
    },
    resH: function (x0, x1, y, c) {
      var m = (x0 + x1) / 2, p = [[x0, y], [m - 15, y]];
      for (var i = 0; i < 6; i++) p.push([m - 12.5 + i * 5, y + (i % 2 ? 6 : -6)]);
      p.push([m + 15, y], [x1, y]);
      return this.cable(p, c || COMP);
    },
    /* capacitor: placas de 22 px separadas 8 px */
    capV: function (x, y0, y1, c) {
      var m = (y0 + y1) / 2;
      this.cable([[x, y0], [x, m - 4]], c).cable([[x, m + 4], [x, y1]], c);
      this.cable([[x - 11, m - 4], [x + 11, m - 4]], c || COMP, 2.4).cable([[x - 11, m + 4], [x + 11, m + 4]], c || COMP, 2.4);
      return this;
    },
    capH: function (x0, x1, y, c) {
      var m = (x0 + x1) / 2;
      this.cable([[x0, y], [m - 4, y]], c).cable([[m + 4, y], [x1, y]], c);
      this.cable([[m - 4, y - 11], [m - 4, y + 11]], COMP, 2.4).cable([[m + 4, y - 11], [m + 4, y + 11]], COMP, 2.4);
      return this;
    },
    masa: function (x, y, c) {
      c = c || CABLE;
      return this.cable([[x, y], [x, y + 7]], c).cable([[x - 10, y + 7], [x + 10, y + 7]], c)
        .cable([[x - 6, y + 11], [x + 6, y + 11]], c).cable([[x - 2.5, y + 15], [x + 2.5, y + 15]], c);
    },
    /* transistor: barra en (bx, cy); colector y emisor terminan 30 px a la
       derecha, 38 px arriba y abajo. Devuelve los tres puntos de conexión. */
    bjt: function (bx, cy, o) {
      o = o || {};
      var c = o.c || COMP, xt = bx + 30;
      if (o.brillo) this.s.push('<circle cx="' + (bx + 12) + '" cy="' + cy + '" r="31" fill="rgba(63,185,80,.12)"/>');
      this.cable([[bx, cy - 20], [bx, cy + 20]], c, 3);
      this.cable([[bx, cy - 10], [xt, cy - 28], [xt, cy - 38]], c);
      this.cable([[bx, cy + 10], [xt, cy + 28], [xt, cy + 38]], c);
      /* flecha del emisor: saliente en el NPN, entrante en el PNP */
      var x0 = bx, y0 = cy + 10, x1 = xt, y1 = cy + 28, a = Math.atan2(y1 - y0, x1 - x0);
      var pnp = o.tipo === "pnp", f = pnp ? 0.42 : 0.72, px = x0 + (x1 - x0) * f, py = y0 + (y1 - y0) * f;
      if (pnp) a += Math.PI;
      var p = [[px, py], [px - 9 * Math.cos(a - 0.45), py - 9 * Math.sin(a - 0.45)], [px - 9 * Math.cos(a + 0.45), py - 9 * Math.sin(a + 0.45)]];
      this.s.push('<polygon points="' + p.map(function (q) { return n(q[0]) + "," + n(q[1]); }).join(" ") + '" fill="' + c + '"/>');
      return { B: [bx, cy], C: [xt, cy - 38], E: [xt, cy + 38] };
    },
    svg: function (vb, w, h, rotulo) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + w + '" height="' + h +
        '" role="img" aria-label="' + rotulo + '" font-family="' + FUENTE + '" style="max-width:100%;height:auto">' +
        this.s.join("") + "</svg>";
    }
  };

  var F = {};

  /* ------------------------------------------------ 1 · símbolo NPN / PNP */
  F.simbolo = function (tipo) {
    var d = new Dib(), t = d.bjt(100, 75, { tipo: tipo });
    d.cable([[48, 75], [100, 75]]).cable([t.C, [130, 22]]).cable([t.E, [130, 128]]);
    /* cada letra con su nombre al lado, en el mismo renglón */
    d.texto(40, 80, "B", { a: "end", t: 14, b: 700, c: "#e6edf3" }).texto(40, 98, T("base", "base"), { a: "end", t: 10.5 })
     .texto(138, 28, "C", { t: 14, b: 700, c: "#e6edf3" }).texto(152, 28, T("colector", "collector"), { t: 10.5 })
     .texto(138, 133, "E", { t: 14, b: 700, c: "#e6edf3" }).texto(152, 133, T("emisor", "emitter"), { t: 10.5 });
    return d.svg("0 0 220 150", 220, 150, T("Símbolo del transistor ", "Transistor symbol: ") + tipo.toUpperCase());
  };

  /* --------------------------------------- 2 y 4 · curvas y recta de carga */
  var VSAT = 0.2, TAU = 0.35, EARLY = 90;
  function ic(vce, ib, beta) { return ib / 1000 * beta * (1 - Math.exp(-vce / TAU)) * (1 + Math.max(0, vce - VSAT) / EARLY); }
  function puntoQ(vcc, rc, ib, beta) {
    var i = ib / 1000 * beta, v = vcc - i * rc;
    if (v <= VSAT) { v = VSAT; i = (vcc - VSAT) / rc; }
    return { vce: v, ic: i };
  }
  F.curvas = function (p) {
    var d = new Dib(), W = 460, H = 320, x0 = 52, x1 = 398, y0 = 16, y1 = 272;
    var maxV = p.maxV, maxI = p.maxI, beta = p.beta;
    var X = function (v) { return x0 + v / maxV * (x1 - x0); }, Y = function (i) { return y1 - Math.min(i, maxI) / maxI * (y1 - y0); };
    var pasoV = maxV > 14 ? 4 : 2, pasoI = maxI > 12 ? 4 : 2, v, i;
    var recta = p.vcc && p.rc, isat = recta ? p.vcc / p.rc : 0;
    for (v = 0; v <= maxV + 1e-9; v += pasoV) {
      d.cable([[X(v), y0], [X(v), y1]], GRILLA, 1);
      if (!recta || Math.abs(X(v) - X(p.vcc)) > 22)
        d.texto(X(v), y1 + 16, String(v), { a: "middle", t: 10, c: "#7d8a99" });
    }
    for (i = 0; i <= maxI + 1e-9; i += pasoI) {
      d.cable([[x0, Y(i)], [x1, Y(i)]], GRILLA, 1);
      if (!recta || Math.abs(Y(i) - Y(isat)) > 13)
        d.texto(x0 - 8, Y(i) + 3.5, String(i), { a: "end", t: 10, c: "#7d8a99" });
    }
    d.cable([[x0, y0], [x0, y1], [x1, y1]], EJE, 1.5);
    d.texto((x0 + x1) / 2, H - 6, "V_CE (V)", { a: "middle", t: 12 });
    d.texto(14, (y0 + y1) / 2, "I_C (mA)", { a: "middle", t: 12, rot: -90 });
    /* familia de curvas; el rótulo de cada una, afuera del área, a su altura */
    var obst = [];   /* tramos que un rótulo no debe tocar */
    p.ibList.forEach(function (ib) {
      var res = p.highlight != null && Math.abs(ib - p.highlight) < 1e-6, pts = [];
      for (var k = 0; k <= 80; k++) { var vv = k / 80 * maxV; pts.push([X(vv), Y(ic(vv, ib, beta))]); }
      d.cable(pts, res ? AZUL : "#9aa7b4", res ? 2.6 : 1.5);
      for (var k2 = 1; k2 < pts.length; k2++) obst.push([pts[k2 - 1], pts[k2]]);
      d.texto(x1 + 8, Y(ic(maxV, ib, beta)) + 4, ib + " µA", { t: 10.5, c: res ? AZUL : "#7d8a99", b: res ? 700 : null });
    });
    if (p.vcc && p.rc) {
      d.s.push('<line x1="' + X(0) + '" y1="' + n(Y(isat)) + '" x2="' + n(X(p.vcc)) + '" y2="' + Y(0) +
        '" stroke="' + ROJO + '" stroke-width="2" stroke-dasharray="6 4"/>');
      /* los extremos de la recta se rotulan sobre los ejes, como en un gráfico técnico */
      d.cable([[x0 - 4, Y(isat)], [x0, Y(isat)]], ROJO, 2).cable([[X(p.vcc), y1], [X(p.vcc), y1 + 5]], ROJO, 2);
      d.texto(x0 - 11, Y(isat) + 3.5, "I_C(sat)", { a: "end", t: 10, c: ROJO });
      d.texto(X(p.vcc), y1 + 20, "V_CC", { a: "middle", t: 10.5, c: ROJO });
      if (p.ibQ != null) {
        var q = puntoQ(p.vcc, p.rc, p.ibQ, beta), qx = X(q.vce), qy = Y(q.ic);
        d.s.push('<line x1="' + n(qx) + '" y1="' + y1 + '" x2="' + n(qx) + '" y2="' + n(qy) + '" stroke="' + AMBAR + '" stroke-width="1" stroke-dasharray="3 3"/>');
        d.s.push('<line x1="' + x0 + '" y1="' + n(qy) + '" x2="' + n(qx) + '" y2="' + n(qy) + '" stroke="' + AMBAR + '" stroke-width="1" stroke-dasharray="3 3"/>');
        d.s.push('<circle cx="' + n(qx) + '" cy="' + n(qy) + '" r="5.5" fill="' + AMBAR + '" stroke="#0a0e17" stroke-width="1.5"/>');
        /* la Q va en el primer lugar libre alrededor del punto: lejos de la grilla,
           de la recta de carga (que baja hacia la derecha) y de su propia curva */
        for (i = 0; i <= maxI + 1e-9; i += pasoI) obst.push([[x0, Y(i)], [x1, Y(i)]]);
        for (v = 0; v <= maxV + 1e-9; v += pasoV) obst.push([[X(v), y0], [X(v), y1]]);
        obst.push([[X(0), Y(isat)], [X(p.vcc), Y(0)]], [[qx, y1], [qx, qy]], [[x0, qy], [qx, qy]]);
        /* ¿el segmento corta el rectángulo agrandado 4 px? (Liang–Barsky) */
        var corta = function (sg, r) {
          var p0 = sg[0], dx = sg[1][0] - p0[0], dy = sg[1][1] - p0[1], t0 = 0, t1 = 1;
          var lim = [[-dx, p0[0] - r[0]], [dx, r[2] - p0[0]], [-dy, p0[1] - r[1]], [dy, r[3] - p0[1]]];
          for (var j = 0; j < 4; j++) {
            var pp = lim[j][0], qq = lim[j][1];
            if (pp === 0) { if (qq < 0) return false; continue; }
            var t = qq / pp;
            if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
          }
          return true;
        };
        /* candidatos en anillos alrededor del punto; gana el libre más cercano */
        var elegido = null;
        for (var rad = 16; rad <= 64 && !elegido; rad += 6) {
          for (var ang = 0; ang < 360 && !elegido; ang += 20) {
            var cx = qx + rad * Math.cos(ang * Math.PI / 180), cy = qy - rad * Math.sin(ang * Math.PI / 180);
            var r = [cx - 4.5 - 4, cy - 8 - 4, cx + 4.5 + 4, cy + 6 + 4];
            if (r[0] < x0 + 2 || r[2] > x1 - 2 || r[1] < y0 || r[3] > y1) continue;
            if (!obst.some(function (sg) { return corta(sg, r); })) elegido = [cx, cy + 4, "middle"];
          }
        }
        if (!elegido) elegido = [qx + 12, qy - 12, "start"];
        d.texto(elegido[0], elegido[1], "Q", { a: elegido[2], t: 12, b: 700, c: AMBAR, halo: true });
      }
    }
    return d.svg("0 0 " + W + " " + H, W, H, T("Curvas características de salida del transistor", "Output characteristic curves of the transistor"));
  };

  /* --------------------------------------------------- 5 · como llave */
  F.llave = function (on) {
    /* rama de colector: +V, R_L y LED repartidos con el mismo largo de cable entre ellos y hasta C;
       R_B centrada entre el borne de entrada y la base */
    var d = new Dib(), g = on ? VERDE : CABLE, X = 200, YB = 200;
    var t = d.bjt(X - 30, YB, { brillo: on, c: on ? VERDE : COMP });
    var y0 = 24, y1 = t.C[1], gap = (y1 - y0 - 30 - 16) / 3, yR = y0 + gap + 15, yL = y0 + 2 * gap + 30;
    d.cable([[X - 12, y0], [X + 12, y0]], COMP, 2.4).texto(X + 18, y0 + 5, "+V", { c: AZUL, t: 13 });
    d.cable([[X, y0], [X, yR - 15]], g).resV(X, yR - 15, yR + 15, on ? VERDE : COMP).cable([[X, yR + 15], [X, yL]], g);
    d.texto(X - 14, yR + 5, "R_L", { a: "end" });
    /* LED con la punta hacia abajo: el ánodo arriba, del lado de +V */
    d.add('<polygon points="' + (X - 10) + ',' + yL + ' ' + (X + 10) + ',' + yL + ' ' + X + ',' + (yL + 16) + '" fill="' + (on ? VERDE : FONDO) + '" stroke="' + (on ? VERDE : COMP) + '" stroke-width="2" stroke-linejoin="round"/>');
    d.cable([[X - 11, yL + 16], [X + 11, yL + 16]], on ? VERDE : COMP, 2.4);
    [0, 9].forEach(function (k) {
      var c = on ? VERDE : "#5a6675";
      d.cable([[X + 14, yL + 6 + k], [X + 26, yL - 2 + k]], c, 1.6);
      d.add('<polygon points="' + (X + 29) + "," + (yL - 4 + k) + " " + (X + 22) + "," + (yL - 3 + k) + " " + (X + 25) + "," + (yL + 2 + k) + '" fill="' + c + '"/>');
    });
    d.texto(X - 16, yL + 12, "LED", { a: "end" });
    d.cable([[X, yL + 16], t.C], g);
    d.cable([t.E, [X, t.E[1] + 14]], g).masa(X, t.E[1] + 14, g);
    d.texto(X + 8, t.C[1] + 4, "C").texto(X + 8, t.E[1] - 6, "E").texto(152, YB - 8, "B", { a: "middle" });
    var xm = (52 + X - 30) / 2;
    d.cable([[52, YB], [xm - 15, YB]], g).resH(xm - 15, xm + 15, YB, on ? VERDE : COMP).cable([[xm + 15, YB], [X - 30, YB]], g);
    d.texto(xm, YB - 15, "R_B", { a: "middle" });
    d.borne(52, YB, g).texto(42, YB + 4, on ? "5 V" : "0 V", { a: "end", c: on ? VERDE : AZUL, t: 13, b: 700 });
    return d.svg("0 0 300 290", 300, 290, T("Transistor como llave con un LED en el colector", "Transistor as a switch with an LED in the collector"));
  };

  /* ---------------------------------------------- 6 · como amplificador */
  function onda(d, x, y, w, amp, ciclos, color, invertida, recorte) {
    d.cable([[x, y], [x + w, y]], "#2a3140", 1);
    var pts = [];
    for (var k = 0; k <= 90; k++) {
      var r = k / 90, s = Math.sin(r * ciclos * 2 * Math.PI);
      if (invertida) s = -s;
      if (recorte) s = Math.max(-recorte, Math.min(recorte, s)) / recorte;
      pts.push([x + r * w, y - s * amp]);
    }
    d.cable(pts, color, 2);
  }
  F.amplificador = function () {
    var d = new Dib();
    d.texto(150, 18, T("Señal montada sobre el punto Q", "Signal riding on the Q point"), { a: "middle", t: 12.5, b: 700, c: "#e6edf3" });
    onda(d, 22, 96, 84, 11, 1.5, "#9aa7b4");
    d.cable([[114, 96], [140, 96]], CABLE).add('<polygon points="140,90 151,96 140,102" fill="' + CABLE + '"/>');
    onda(d, 160, 96, 120, 48, 1.5, AZUL);
    d.texto(64, 172, T("ΔI_B chica", "small ΔI_B"), { a: "middle" });
    d.texto(220, 172, T("ΔI_C = β · ΔI_B, en fase", "ΔI_C = β · ΔI_B, in phase"), { a: "middle", c: AZUL });
    return d.svg("0 0 300 190", 300, 190, T("Una variación chica de la corriente de base produce una variación grande de la de colector", "A small variation in the base current produces a large variation in the collector current"));
  };

  /* ------------------------------------------------- 7 · polarización */
  F.polarizacion = function (tipo) {
    /* cada resistor centrado entre los extremos de su rama (riel, nodo, codo o terminal) */
    var d = new Dib(), XC = 182, XI = 62;
    d.cable([[XI, 20], [XC + 30, 20]]).nodo(XC, 20).borne(XC + 30, 20).texto(XC + 38, 25, "V_CC", { c: AZUL, t: 13 });
    if (tipo === "fija") {
      var YB = 150, t = d.bjt(XC - 30, YB);
      d.resV(XI, 20, YB).cable([[XI, YB], [XC - 30, YB]]).texto(XI + 14, (20 + YB) / 2 + 5, "R_B");
      d.resV(XC, 20, t.C[1]).texto(XC - 14, (20 + t.C[1]) / 2 + 5, "R_C", { a: "end" });
      d.cable([t.E, [XC, t.E[1] + 14]]).masa(XC, t.E[1] + 14);
      d.texto(XC + 8, t.C[1] + 4, "C").texto(XC + 8, t.E[1] - 6, "E").texto(XC - 48, YB - 8, "B", { a: "middle" });
      return d.svg("0 0 260 240", 260, 240, T("Polarización de base fija", "Fixed-bias (fixed base current) biasing"));
    }
    var YB2 = 140, YM = 276, t2 = d.bjt(XC - 30, YB2);
    d.resV(XI, 20, YB2).resV(XI, YB2, YM).nodo(XI, YB2).cable([[XI, YB2], [XC - 30, YB2]]);
    d.texto(XI + 14, (20 + YB2) / 2 + 5, "R_1").texto(XI + 14, (YB2 + YM) / 2 + 5, "R_2");
    d.resV(XC, 20, t2.C[1]).texto(XC - 14, (20 + t2.C[1]) / 2 + 5, "R_C", { a: "end" });
    d.resV(XC, t2.E[1], YM).texto(XC + 14, (t2.E[1] + YM) / 2 + 5, "R_E");
    d.cable([[XI, YM], [XC, YM]]).nodo((XI + XC) / 2, YM).masa((XI + XC) / 2, YM);
    d.texto(XC + 8, t2.C[1] + 4, "C").texto(XC + 8, t2.E[1] - 6, "E").texto(XC - 48, YB2 - 8, "B", { a: "middle" });
    return d.svg("0 0 260 300", 260, 300, T("Polarización por divisor de tensión con resistencia de emisor", "Voltage-divider biasing with an emitter resistor"));
  };

  /* -------------------------------------------- 8 · fuente regulada */
  F.fuente = function () {
    /* R entre el riel y el nodo de base; zener centrado entre ese nodo y la masa; carga centrada
       entre el nodo de salida y la masa */
    var d = new Dib(), XQ = 180, XZ = 62, XL = 250, YB = 130, YO = 196, YM = 268;
    d.cable([[XZ, 20], [XQ + 30, 20]]).borne(XQ + 30, 20).texto(XQ + 38, 25, "V_in", { c: AZUL, t: 13 });
    d.resV(XZ, 20, YB).texto(XZ + 14, (20 + YB) / 2 + 5, "R").nodo(XZ, YB);
    /* zener en inversa: el cátodo (barra) hacia arriba, del lado positivo */
    var yz = (YB + YM) / 2 - 8;
    d.cable([[XZ, YB], [XZ, yz]]).cable([[XZ, yz + 16], [XZ, YM]]);
    d.add('<polygon points="' + (XZ - 10) + ',' + (yz + 16) + ' ' + (XZ + 10) + ',' + (yz + 16) + ' ' + XZ + ',' + yz + '" fill="' + FONDO + '" stroke="' + COMP + '" stroke-width="2" stroke-linejoin="round"/>');
    d.cable([[XZ - 14, yz + 4], [XZ - 10, yz], [XZ + 10, yz], [XZ + 14, yz - 4]], COMP, 2.4);
    d.texto(XZ - 18, yz + 13, "V_Z", { a: "end", c: AZUL, t: 13 });
    var t = d.bjt(XQ - 30, YB);
    d.cable([[XZ, YB], [XQ - 30, YB]]);
    d.cable([t.C, [XQ, 20]]).nodo(XQ, 20);
    d.cable([t.E, [XQ, YO], [XL, YO]], VERDE).nodo(XL, YO, VERDE);
    d.texto(XL + 8, YO - 6, "V_out", { c: AZUL, t: 13 });
    d.resV(XL, YO, YM).texto(XL + 14, (YO + YM) / 2 + 5, T("carga", "load"));
    d.cable([[XZ, YM], [XL, YM]]).nodo((XZ + XL) / 2, YM).masa((XZ + XL) / 2, YM);
    d.texto(XQ + 8, t.C[1] - 20, "C").texto(XQ + 8, t.E[1] - 6, "E").texto(XQ - 48, YB - 8, "B", { a: "middle" });
    return d.svg("0 0 320 294", 320, 294, T("Fuente regulada: seguidor de emisor con referencia zener", "Regulated power supply: emitter follower with a zener reference"));
  };

  /* ---------------------------------------------- 9 · emisor común */
  /* Grilla (18/10): cada componente centrado entre los dos extremos de su rama, con 15 px o más de
     cable libre a cada lado. resV, capH y capV centran el cuerpo entre los extremos que reciben.
       rieles: V_CC en y = 20 (de x = 70 al borne en x = 290), masa en y = 276 (de x = 70 a XC).
       divisor en x = 70: R1 entre el riel (20) y el nodo de base (140); R2 entre el nodo y la masa.
       entrada: borne en x = 14, C1 entre el borne y el nodo de base (x = 70), sobre y = 140.
       colector en XC = 210: RC entre el riel (20) y el nodo de salida (96); C2 de ese nodo al borne (290).
       base en y = 150; masa en y = 276. Emisor: sin CE, RE del emisor a la masa; con CE, nodo 20 px bajo
       el emisor, RE de ese nodo a la masa y CE en x = 140, de su codo a la masa (ramas a la misma altura).
       Masa en el centro de su tramo de riel. */
  F.emisorComun = function (conCE) {
    var d = new Dib(), XC = 210, YB = 150, YS = 96, YM = 276, XE = 140;
    var t = d.bjt(XC - 30, YB), YN = t.E[1] + 20;            /* nodo de RE y CE, 20 px bajo el emisor */
    d.cable([[70, 20], [290, 20]]).nodo(XC, 20).borne(290, 20).texto(298, 25, "V_CC", { c: AZUL, t: 13 });
    d.resV(70, 20, YB).resV(70, YB, YM).nodo(70, YB);
    d.texto(84, (20 + YB) / 2 + 5, "R_1").texto(84, (YB + YM) / 2 + 5, "R_2");
    d.borne(14, YB).capH(14, 70, YB);
    d.texto(42, YB - 22, "C_1", { a: "middle" }).texto(4, YB + 4, "v_in", { a: "end", c: AZUL, t: 13 });
    d.cable([[70, YB], [XC - 30, YB]]).texto(150, YB - 8, "B", { a: "middle" });
    d.resV(XC, 20, YS).texto(XC - 14, (20 + YS) / 2 + 5, "R_C", { a: "end" });
    d.cable([[XC, YS], t.C]).nodo(XC, YS).capH(XC, 290, YS).borne(290, YS);
    d.texto(250, YS - 22, "C_2", { a: "middle" }).texto(298, YS + 4, "v_out", { c: AZUL, t: 13 });
    d.texto(XC + 8, t.C[1] + 4, "C").texto(XC + 8, t.E[1] - 6, "E");
    if (conCE) {
      d.cable([t.E, [XC, YN]]).nodo(XC, YN).resV(XC, YN, YM).texto(XC + 14, (YN + YM) / 2 + 5, "R_E");
      d.cable([[XC, YN], [XE, YN]]).capV(XE, YN, YM).nodo(XE, YM).texto(XE + 18, (YN + YM) / 2 + 5, "C_E");
      d.cable([[70, YM], [XC, YM]]).nodo((70 + XE) / 2, YM).masa((70 + XE) / 2, YM);
    } else {
      d.resV(XC, t.E[1], YM).texto(XC + 14, (t.E[1] + YM) / 2 + 5, "R_E");
      d.cable([[70, YM], [XC, YM]]).nodo(XE, YM).masa(XE, YM);
    }
    return d.svg("-40 0 400 300", 400, 300, T("Amplificador en emisor común con divisor de tensión" + (conCE ? " y capacitor de paso" : ""), "Common-emitter amplifier with voltage divider" + (conCE ? " and bypass capacitor" : "")));
  };

  /* ---------------------------------- 9 · entrada y salida del emisor común */
  F.ondasEC = function (amp, ganancia) {
    var d = new Dib(), rec = amp >= 58;
    onda(d, 20, 62, 100, 8, 1.5, "#9aa7b4");
    onda(d, 150, 62, 130, Math.min(amp, 58), 1.5, AZUL, true, rec ? 0.82 : null);
    d.texto(70, 142, T("entrada", "input"), { a: "middle" });
    d.texto(215, 142, T("salida (×", "output (×") + ganancia + ")", { a: "middle", c: AZUL });
    return d.svg("0 0 300 148", 300, 148, T("Entrada y salida del emisor común: la salida es mayor e invertida", "Input and output of the common emitter: the output is larger and inverted"));
  };

  /* -------------------------------------------- 10 · colector común */
  F.colectorComun = function () {
    /* R_B centrada entre el riel y el nodo de base; R_E entre el nodo de salida y la masa;
       C1 y C2 centrados entre su borne y su nodo */
    var d = new Dib(), XQ = 152, XI = 72, YB = 120, YO = 190, YM = 262;
    d.cable([[XI, 20], [XQ + 30, 20]]).borne(XQ + 30, 20).texto(XQ + 38, 25, "V_CC", { c: AZUL, t: 13 });
    d.resV(XI, 20, YB).texto(XI + 14, (20 + YB) / 2 + 5, "R_B").nodo(XI, YB);
    d.borne(14, YB).capH(14, XI, YB);
    d.texto((14 + XI) / 2, YB - 22, "C_1", { a: "middle" }).texto(4, YB + 4, "v_in", { a: "end", c: AZUL, t: 13 });
    var t = d.bjt(XQ - 30, YB);
    d.cable([[XI, YB], [XQ - 30, YB]]).texto(XQ - 48, YB - 8, "B", { a: "middle" });
    d.cable([t.C, [XQ, 20]]).nodo(XQ, 20).texto(XQ + 8, t.C[1] - 20, "C");
    d.cable([t.E, [XQ, YO]]).nodo(XQ, YO).texto(XQ + 8, t.E[1] - 6, "E");
    d.resV(XQ, YO, YM).masa(XQ, YM).texto(XQ + 14, (YO + YM) / 2 + 5, "R_E");
    var xm = (XQ + 260) / 2;
    d.cable([[XQ, YO], [xm - 4, YO]], VERDE).capH(xm - 4, xm + 4, YO).cable([[xm + 4, YO], [260, YO]]).borne(260, YO);
    d.texto(xm, YO - 22, "C_2", { a: "middle" }).texto(268, YO + 4, "v_out", { c: AZUL, t: 13 });
    return d.svg("-40 0 360 290", 360, 290, T("Seguidor de emisor: colector a VCC, salida por el emisor", "Emitter follower: collector to VCC, output from the emitter"));
  };

  /* ------------------------------------------------- 11 · Darlington */
  F.darlington = function () {
    var d = new Dib();
    var q1 = d.bjt(76, 70), q2 = d.bjt(150, 132);
    d.borne(26, 70).cable([[26, 70], [76, 70]]).texto(16, 75, "B", { a: "end", t: 13, b: 700, c: "#e6edf3" });
    d.cable([q1.C, [106, 16], [224, 16]]).borne(224, 16).nodo(180, 16).texto(232, 21, "C", { t: 13, b: 700, c: "#e6edf3" });
    d.cable([q2.C, [180, 16]]);
    d.cable([q1.E, [106, 132], [150, 132]]);
    d.cable([q2.E, [180, 186], [224, 186]]).borne(224, 186).texto(232, 191, "E", { t: 13, b: 700, c: "#e6edf3" });
    d.texto(118, 74, "Q_1", { t: 12.5, b: 700, c: "#e6edf3" }).texto(192, 136, "Q_2", { t: 12.5, b: 700, c: "#e6edf3" });
    return d.svg("0 0 250 206", 250, 206, T("Par Darlington: el emisor de Q1 maneja la base de Q2", "Darlington pair: the emitter of Q1 drives the base of Q2"));
  };

  window.cattoBJT = F;
})();
