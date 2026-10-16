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
    d.texto(40, 80, "B", { a: "end", t: 14, b: 700, c: "#e6edf3" }).texto(40, 98, "base", { a: "end", t: 10.5 })
     .texto(138, 28, "C", { t: 14, b: 700, c: "#e6edf3" }).texto(152, 28, "colector", { t: 10.5 })
     .texto(138, 133, "E", { t: 14, b: 700, c: "#e6edf3" }).texto(152, 133, "emisor", { t: 10.5 });
    return d.svg("0 0 220 150", 220, 150, "Símbolo del transistor " + tipo.toUpperCase());
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
    p.ibList.forEach(function (ib) {
      var res = p.highlight != null && Math.abs(ib - p.highlight) < 1e-6, pts = [];
      for (var k = 0; k <= 80; k++) { var vv = k / 80 * maxV; pts.push([X(vv), Y(ic(vv, ib, beta))]); }
      d.cable(pts, res ? AZUL : "#9aa7b4", res ? 2.6 : 1.5);
      d.texto(x1 + 8, Y(ic(maxV, ib, beta)) + 4, ib + " µA", { t: 10.5, c: res ? AZUL : "#7d8a99", b: res ? 700 : null });
    });
    if (p.vcc && p.rc) {
      d.s.push('<line x1="' + X(0) + '" y1="' + n(Y(isat)) + '" x2="' + n(X(p.vcc)) + '" y2="' + Y(0) +
        '" stroke="' + ROJO + '" stroke-width="2" stroke-dasharray="6 4"/>');
      /* los extremos de la recta se rotulan sobre los ejes, como en un gráfico técnico */
      d.cable([[x0 - 5, Y(isat)], [x0, Y(isat)]], ROJO, 2).cable([[X(p.vcc), y1], [X(p.vcc), y1 + 5]], ROJO, 2);
      d.texto(x0 - 8, Y(isat) + 3.5, "I_C(sat)", { a: "end", t: 10, c: ROJO });
      d.texto(X(p.vcc), y1 + 16, "V_CC", { a: "middle", t: 10.5, c: ROJO });
      if (p.ibQ != null) {
        var q = puntoQ(p.vcc, p.rc, p.ibQ, beta), qx = X(q.vce), qy = Y(q.ic);
        d.s.push('<line x1="' + n(qx) + '" y1="' + y1 + '" x2="' + n(qx) + '" y2="' + n(qy) + '" stroke="' + AMBAR + '" stroke-width="1" stroke-dasharray="3 3"/>');
        d.s.push('<line x1="' + x0 + '" y1="' + n(qy) + '" x2="' + n(qx) + '" y2="' + n(qy) + '" stroke="' + AMBAR + '" stroke-width="1" stroke-dasharray="3 3"/>');
        d.s.push('<circle cx="' + n(qx) + '" cy="' + n(qy) + '" r="5.5" fill="' + AMBAR + '" stroke="#0a0e17" stroke-width="1.5"/>');
        d.texto(qx + 9, qy - 14, "Q", { t: 12, b: 700, c: AMBAR, halo: true });
      }
    }
    return d.svg("0 0 " + W + " " + H, W, H, "Curvas características de salida del transistor");
  };

  /* --------------------------------------------------- 5 · como llave */
  F.llave = function (on) {
    var d = new Dib(), g = on ? VERDE : CABLE, X = 200;
    /* alimentación como bandera: una barra corta sobre la rama, sin riel que quede colgando */
    d.cable([[X - 12, 24], [X + 12, 24]], COMP, 2.4).texto(X + 18, 29, "+V", { c: AZUL, t: 13 });
    d.cable([[X, 24], [X, 34]], g).resV(X, 34, 70, on ? VERDE : COMP).texto(X - 14, 56, "R_L", { a: "end" });
    d.cable([[X, 70], [X, 82]], g);
    /* LED con la punta hacia abajo: el ánodo arriba, del lado de +V */
    d.add('<polygon points="' + (X - 10) + ',82 ' + (X + 10) + ',82 ' + X + ',98" fill="' + (on ? VERDE : FONDO) + '" stroke="' + (on ? VERDE : COMP) + '" stroke-width="2" stroke-linejoin="round"/>');
    d.cable([[X - 11, 98], [X + 11, 98]], on ? VERDE : COMP, 2.4);
    [0, 9].forEach(function (k) {
      var c = on ? VERDE : "#5a6675";
      d.cable([[X + 14, 88 + k], [X + 26, 80 + k]], c, 1.6);
      d.add('<polygon points="' + (X + 29) + "," + (78 + k) + " " + (X + 22) + "," + (79 + k) + " " + (X + 25) + "," + (84 + k) + '" fill="' + c + '"/>');
    });
    d.texto(X - 16, 94, "LED", { a: "end" });
    var t = d.bjt(X - 30, 160, { brillo: on, c: on ? VERDE : COMP });
    d.cable([[X, 98], t.C], g);
    d.cable([t.E, [X, 206]], g).masa(X, 206, g);
    d.texto(X + 7, 128, "C").texto(X + 7, 192, "E").texto(152, 152, "B", { a: "middle" });
    d.cable([[52, 160], [82, 160]], g).resH(82, 128, 160, on ? VERDE : COMP).cable([[128, 160], [X - 30, 160]], g);
    d.texto(105, 145, "R_B", { a: "middle" });
    d.borne(52, 160, g).texto(42, 164, on ? "5 V" : "0 V", { a: "end", c: on ? VERDE : AZUL, t: 13, b: 700 });
    return d.svg("0 0 300 236", 300, 236, "Transistor como llave con un LED en el colector");
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
    d.texto(150, 18, "Señal montada sobre el punto Q", { a: "middle", t: 12.5, b: 700, c: "#e6edf3" });
    onda(d, 22, 96, 84, 11, 1.5, "#9aa7b4");
    d.cable([[114, 96], [140, 96]], CABLE).add('<polygon points="140,90 151,96 140,102" fill="' + CABLE + '"/>');
    onda(d, 160, 96, 120, 48, 1.5, AZUL);
    d.texto(64, 172, "ΔI_B chica", { a: "middle" });
    d.texto(220, 172, "ΔI_C = β · ΔI_B, en fase", { a: "middle", c: AZUL });
    return d.svg("0 0 300 190", 300, 190, "Una variación chica de la corriente de base produce una variación grande de la de colector");
  };

  /* ------------------------------------------------- 7 · polarización */
  F.polarizacion = function (tipo) {
    var d = new Dib(), XC = 182;
    d.cable([[62, 20], [XC + 26, 20]]).nodo(XC, 20).borne(XC + 26, 20).texto(XC + 34, 25, "V_CC", { c: AZUL, t: 13 });
    if (tipo === "fija") {
      var t = d.bjt(XC - 30, 124);
      d.cable([[62, 20], [62, 30]]).resV(62, 30, 70).cable([[62, 70], [62, 124], [XC - 30, 124]]);
      d.texto(74, 54, "R_B");
      d.cable([[XC, 20], [XC, 30]]).resV(XC, 30, 70).cable([[XC, 70], t.C]).texto(XC - 14, 54, "R_C", { a: "end" });
      d.cable([t.E, [XC, 176]]).masa(XC, 176);
      d.texto(XC + 7, 100, "C").texto(XC + 7, 158, "E").texto(XC - 48, 117, "B", { a: "middle" });
      return d.svg("0 0 260 210", 260, 210, "Polarización de base fija");
    }
    var t2 = d.bjt(XC - 30, 112);
    d.cable([[62, 20], [62, 30]]).resV(62, 30, 70).cable([[62, 70], [62, 124]]).resV(62, 124, 160).cable([[62, 160], [62, 196]]);
    d.nodo(62, 112).cable([[62, 112], [XC - 30, 112]]);
    d.texto(74, 54, "R_1").texto(74, 146, "R_2");
    d.cable([[XC, 20], [XC, 30]]).resV(XC, 30, 66).cable([[XC, 66], t2.C]).texto(XC - 14, 52, "R_C", { a: "end" });
    d.cable([t2.E, [XC, 160]]).resV(XC, 160, 192).cable([[XC, 192], [XC, 196]]).texto(XC + 14, 180, "R_E");
    d.cable([[62, 196], [XC, 196]]).masa(122, 196);
    d.texto(XC + 7, 88, "C").texto(XC + 7, 146, "E").texto(XC - 48, 105, "B", { a: "middle" });
    return d.svg("0 0 260 220", 260, 220, "Polarización por divisor de tensión con resistencia de emisor");
  };

  /* -------------------------------------------- 8 · fuente regulada */
  F.fuente = function () {
    var d = new Dib(), XQ = 180, XZ = 62, XL = 238;
    d.cable([[XZ, 20], [XQ + 26, 20]]).borne(XQ + 26, 20).texto(XQ + 34, 25, "V_in", { c: AZUL, t: 13 });
    d.cable([[XZ, 20], [XZ, 30]]).resV(XZ, 30, 66).cable([[XZ, 66], [XZ, 120]]).texto(XZ + 12, 52, "R");
    d.nodo(XZ, 100);
    /* zener en inversa: el cátodo (barra) hacia arriba, del lado positivo */
    d.add('<polygon points="' + (XZ - 10) + ',136 ' + (XZ + 10) + ',136 ' + XZ + ',120" fill="' + FONDO + '" stroke="' + COMP + '" stroke-width="2" stroke-linejoin="round"/>');
    d.cable([[XZ - 14, 124], [XZ - 10, 120], [XZ + 10, 120], [XZ + 14, 116]], COMP, 2.4);
    d.cable([[XZ, 136], [XZ, 190]]).texto(XZ - 18, 132, "V_Z", { a: "end", c: AZUL, t: 13 });
    var t = d.bjt(XQ - 30, 100);
    d.cable([[XZ, 100], [XQ - 30, 100]]);
    d.cable([t.C, [XQ, 20]]).nodo(XQ, 20);
    d.cable([t.E, [XQ, 150], [XL, 150]], VERDE).nodo(XL, 150, VERDE);
    d.texto(XL + 8, 146, "V_out", { c: AZUL, t: 13 });
    d.cable([[XL, 150], [XL, 156]]).resV(XL, 156, 184).cable([[XL, 184], [XL, 190]]).texto(XL + 14, 176, "carga");
    d.cable([[XZ, 190], [XL, 190]]).masa(150, 190);
    d.texto(XQ + 7, 58, "C").texto(XQ + 7, 134, "E").texto(XQ - 48, 93, "B", { a: "middle" });
    return d.svg("0 0 300 214", 300, 214, "Fuente regulada: seguidor de emisor con referencia zener");
  };

  /* ---------------------------------------------- 9 · emisor común */
  F.emisorComun = function (conCE) {
    var d = new Dib(), XC = 200;
    d.cable([[70, 18], [XC + 36, 18]]).nodo(XC, 18).borne(XC + 36, 18).texto(XC + 44, 23, "V_CC", { c: AZUL, t: 13 });
    d.cable([[70, 18], [70, 30]]).resV(70, 30, 64).cable([[70, 64], [70, 128]]).resV(70, 128, 162).cable([[70, 162], [70, 228]]);
    d.texto(82, 51, "R_1").texto(82, 149, "R_2");
    d.borne(20, 120).cable([[20, 120], [44, 120]]).capH(44, 56, 120).cable([[56, 120], [70, 120]]).nodo(70, 120);
    d.texto(50, 102, "C_1", { a: "middle" }).texto(12, 124, "v_in", { a: "end", c: AZUL, t: 13 });
    var t = d.bjt(XC - 30, 120);
    d.cable([[70, 120], [XC - 30, 120]]).texto(150, 113, "B", { a: "middle" });
    d.cable([[XC, 18], [XC, 26]]).resV(XC, 26, 58).cable([[XC, 58], t.C]).texto(XC - 14, 46, "R_C", { a: "end" });
    d.nodo(XC, 66).cable([[XC, 66], [244, 66]]).capH(244, 256, 66).cable([[256, 66], [290, 66]]).borne(290, 66);
    d.texto(250, 48, "C_2", { a: "middle" }).texto(298, 70, "v_out", { c: AZUL, t: 13 });
    d.texto(XC + 7, 94, "C").texto(XC + 7, 154, "E");
    d.cable([t.E, [XC, 176]]).resV(XC, 176, 208).cable([[XC, 208], [XC, 228]]).texto(XC + 14, 196, "R_E");
    if (conCE) {
      d.nodo(XC, 166).cable([[XC, 166], [128, 166], [128, 178]]).capV(128, 178, 194).cable([[128, 194], [128, 228]]);
      d.texto(144, 191, "C_E");
    }
    d.cable([[70, 228], [XC, 228]]).masa(100, 228);
    return d.svg("-34 0 380 250", 380, 250, "Amplificador en emisor común con divisor de tensión" + (conCE ? " y capacitor de paso" : ""));
  };

  /* ---------------------------------- 9 · entrada y salida del emisor común */
  F.ondasEC = function (amp, ganancia) {
    var d = new Dib(), rec = amp >= 58;
    onda(d, 20, 62, 100, 8, 1.5, "#9aa7b4");
    onda(d, 150, 62, 130, Math.min(amp, 58), 1.5, AZUL, true, rec ? 0.82 : null);
    d.texto(70, 136, "entrada", { a: "middle" });
    d.texto(215, 136, "salida (×" + ganancia + ")", { a: "middle", c: AZUL });
    return d.svg("0 0 300 142", 300, 142, "Entrada y salida del emisor común: la salida es mayor e invertida");
  };

  /* -------------------------------------------- 10 · colector común */
  F.colectorComun = function () {
    var d = new Dib(), XQ = 142;
    d.cable([[70, 20], [XQ + 30, 20]]).borne(XQ + 30, 20).texto(XQ + 38, 25, "V_CC", { c: AZUL, t: 13 });
    d.cable([[70, 20], [70, 32]]).resV(70, 32, 66).cable([[70, 66], [70, 96]]).texto(82, 53, "R_B");
    d.borne(20, 96).cable([[20, 96], [44, 96]]).capH(44, 56, 96).cable([[56, 96], [70, 96]]).nodo(70, 96);
    d.texto(50, 78, "C_1", { a: "middle" }).texto(12, 100, "v_in", { a: "end", c: AZUL, t: 13 });
    var t = d.bjt(XQ - 30, 96);
    d.cable([[70, 96], [XQ - 30, 96]]).texto(92, 89, "B", { a: "middle" });
    d.cable([t.C, [XQ, 20]]).nodo(XQ, 20).texto(XQ + 7, 50, "C");
    d.cable([t.E, [XQ, 150]]).nodo(XQ, 150).texto(XQ + 7, 130, "E");
    d.cable([[XQ, 150], [XQ, 156]]).resV(XQ, 156, 186).cable([[XQ, 186], [XQ, 190]]).masa(XQ, 190).texto(XQ + 14, 176, "R_E");
    d.cable([[XQ, 150], [196, 150]], VERDE).capH(196, 208, 150).cable([[208, 150], [244, 150]]).borne(244, 150);
    d.texto(202, 132, "C_2", { a: "middle" }).texto(252, 154, "v_out", { c: AZUL, t: 13 });
    return d.svg("-34 0 334 214", 334, 214, "Seguidor de emisor: colector a VCC, salida por el emisor");
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
    return d.svg("0 0 250 206", 250, 206, "Par Darlington: el emisor de Q1 maneja la base de Q2");
  };

  window.cattoBJT = F;
})();
