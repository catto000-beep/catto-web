/* ============================================================
   catto.ar — Calculadora científica
   Va al lado del tablero de ajedrez y se opera ahí mismo, sin
   abrir nada. Teclado tradicional: funciones arriba, números
   abajo a la izquierda y los operadores en la columna del medio.

   No usa eval(): la expresión se tokeniza y se resuelve con un
   parser descendente recursivo, así que la precedencia (potencia
   antes que producto, producto antes que suma) es la de siempre
   y una expresión mal escrita da error en vez de romper la página.
   ============================================================ */
(function () {
  "use strict";

  /* ==========================================================
     TECLADO — 8 filas de 6 teclas.
       t   texto de la tecla          ins  lo que agrega a la expresión
       inv texto con INV activo       hyp  texto con HYP activo
       k   familia (color)            act  acción especial
     ========================================================== */
  var TECLAS = [
    [{t:"INV",act:"inv",k:"mod"}, {t:"HYP",act:"hyp",k:"mod"}, {t:"DEG",act:"ang",k:"mod"},
     {t:"MC",act:"mc",k:"fn"},    {t:"MR",act:"mr",k:"fn"},    {t:"M+",act:"m+",k:"fn"}],

    [{t:"sin",ins:"sin(",k:"fn",inv:{t:"sin⁻¹",ins:"asin("},hyp:{t:"sinh",ins:"sinh("},invhyp:{t:"sinh⁻¹",ins:"asinh("}},
     {t:"cos",ins:"cos(",k:"fn",inv:{t:"cos⁻¹",ins:"acos("},hyp:{t:"cosh",ins:"cosh("},invhyp:{t:"cosh⁻¹",ins:"acosh("}},
     {t:"tan",ins:"tan(",k:"fn",inv:{t:"tan⁻¹",ins:"atan("},hyp:{t:"tanh",ins:"tanh("},invhyp:{t:"tanh⁻¹",ins:"atanh("}},
     {t:"π",ins:"π",k:"fn"}, {t:"e",ins:"e",k:"fn"}, {t:"M−",act:"m-",k:"fn"}],

    [{t:"x²",ins:"²",k:"fn",inv:{t:"x³",ins:"³"}},
     {t:"xʸ",ins:"^",k:"fn"},
     {t:"√",ins:"√(",k:"fn",inv:{t:"∛",ins:"∛("}},
     {t:"ʸ√x",ins:"ʳ",k:"fn"}, {t:"(",ins:"(",k:"fn"}, {t:")",ins:")",k:"fn"}],

    [{t:"ln",ins:"ln(",k:"fn"}, {t:"log",ins:"log(",k:"fn"},
     {t:"eˣ",ins:"e^(",k:"fn"}, {t:"10ˣ",ins:"10^(",k:"fn"},
     {t:"n!",ins:"!",k:"fn"},   {t:"1/x",ins:"⁻",k:"fn"}],

    [{t:"7",ins:"7",k:"num"}, {t:"8",ins:"8",k:"num"}, {t:"9",ins:"9",k:"num"},
     {t:"÷",ins:"÷",k:"op"},  {t:"mod",ins:"mod",k:"fn"}, {t:"%",ins:"%",k:"fn"}],

    [{t:"4",ins:"4",k:"num"}, {t:"5",ins:"5",k:"num"}, {t:"6",ins:"6",k:"num"},
     {t:"×",ins:"×",k:"op"},  {t:"EXP",act:"exp",k:"fn"}, {t:"Ans",ins:"A",k:"fn"}],

    [{t:"1",ins:"1",k:"num"}, {t:"2",ins:"2",k:"num"}, {t:"3",ins:"3",k:"num"},
     {t:"−",ins:"−",k:"op"},  {t:"⌫",act:"back",k:"fn"}, {t:"C",act:"clear",k:"cl"}],

    [{t:"0",ins:"0",k:"num"}, {t:".",ins:".",k:"num"}, {t:"±",act:"neg",k:"num"},
     {t:"+",ins:"+",k:"op"}, {t:"=",act:"eq",k:"eq",span:2}]
  ];

  /* ==========================================================
     ANALIZADOR — tokens
     ========================================================== */
  var FUNCS = ["asinh","acosh","atanh","sinh","cosh","tanh",
               "asin","acos","atan","sin","cos","tan","ln","log","abs"];

  function Err(m) { this.msg = m; }

  function tokenizar(src) {
    var out = [], i = 0, n = src.length;
    while (i < n) {
      var c = src.charAt(i);

      if (c === " ") { i++; continue; }

      /* número, con notación científica: 12, .5, 6.02E23 */
      if (/[0-9.]/.test(c)) {
        var j = i, punto = false;
        while (j < n && /[0-9.]/.test(src.charAt(j))) {
          if (src.charAt(j) === ".") { if (punto) throw new Err("Error de sintaxis"); punto = true; }
          j++;
        }
        if (src.charAt(j) === "E") {
          var k = j + 1;
          if (src.charAt(k) === "−" || src.charAt(k) === "-" || src.charAt(k) === "+") k++;
          if (/[0-9]/.test(src.charAt(k))) {
            while (k < n && /[0-9]/.test(src.charAt(k))) k++;
            var mant = src.slice(i, j), exp = src.slice(j + 1, k).replace("−", "-");
            out.push({ t: "num", v: parseFloat(mant) * Math.pow(10, parseInt(exp, 10)) });
            i = k; continue;
          }
        }
        var txt = src.slice(i, j);
        if (txt === ".") throw new Err("Error de sintaxis");
        out.push({ t: "num", v: parseFloat(txt) });
        i = j; continue;
      }

      /* mod, funciones y constantes con nombre */
      if (/[a-z]/i.test(c)) {
        if (src.substr(i, 3) === "mod") { out.push({ t: "op", v: "mod" }); i += 3; continue; }
        var f = null;
        for (var q = 0; q < FUNCS.length; q++)
          if (src.substr(i, FUNCS[q].length) === FUNCS[q]) { f = FUNCS[q]; break; }
        if (f) { out.push({ t: "fn", v: f }); i += f.length; continue; }
        if (c === "e") { out.push({ t: "num", v: Math.E }); i++; continue; }
        if (c === "A") { out.push({ t: "ans" }); i++; continue; }
        throw new Err("Error de sintaxis");
      }

      switch (c) {
        case "π": out.push({ t: "num", v: Math.PI }); break;
        case "+": out.push({ t: "op", v: "+" }); break;
        case "−": case "-": out.push({ t: "op", v: "-" }); break;
        case "×": case "*": out.push({ t: "op", v: "*" }); break;
        case "÷": case "/": out.push({ t: "op", v: "/" }); break;
        case "^": out.push({ t: "op", v: "^" }); break;
        case "ʳ": out.push({ t: "op", v: "root" }); break;
        case "√": out.push({ t: "fn", v: "sqrt" }); break;
        case "∛": out.push({ t: "fn", v: "cbrt" }); break;
        case "(": case ")": out.push({ t: "par", v: c }); break;
        case "!": out.push({ t: "post", v: "!" }); break;
        case "%": out.push({ t: "post", v: "%" }); break;
        case "⁻": out.push({ t: "post", v: "inv" }); break;
        case "²": out.push({ t: "post", v: "sq" }); break;
        case "³": out.push({ t: "post", v: "cb" }); break;
        default: throw new Err("Error de sintaxis");
      }
      i++;
    }
    return out;
  }

  /* ==========================================================
     ANALIZADOR — gramática
       expr    := suma
       suma    := prod (('+'|'-') prod)*
       prod    := unario (('*'|'/'|'mod') unario | unario)*   ← el 2º caso es 2π
       unario  := ('-'|'+')* potencia
       potencia:= sufijo (('^'|'root') unario)?
       sufijo  := átomo ('!'|'%'|'⁻¹'|'²'|'³')*
       átomo   := número | Ans | función '(' expr ')' | '(' expr ')'
     ========================================================== */
  function evaluar(src, grados, ans) {
    var tk = tokenizar(src), p = 0;

    function ver() { return tk[p]; }
    function comer(t, v) {
      var x = tk[p];
      if (x && x.t === t && (v === undefined || x.v === v)) { p++; return x; }
      return null;
    }

    function suma() {
      var v = prod();
      for (;;) {
        var t = ver();
        if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
          p++;
          var r = prod();
          v = t.v === "+" ? v + r : v - r;
        } else return v;
      }
    }

    function prod() {
      var v = unario();
      for (;;) {
        var t = ver();
        if (t && t.t === "op" && (t.v === "*" || t.v === "/" || t.v === "mod")) {
          p++;
          var r = unario();
          if (t.v === "*") v = v * r;
          else if (t.v === "/") { if (r === 0) throw new Err("No se puede dividir por cero"); v = v / r; }
          else { if (r === 0) throw new Err("No se puede dividir por cero"); v = v - Math.floor(v / r) * r; }
        } else if (t && (t.t === "num" || t.t === "fn" || t.t === "ans" ||
                         (t.t === "par" && t.v === "("))) {
          v = v * unario();               /* multiplicación implícita: 2π, 3(4+1) */
        } else return v;
      }
    }

    function unario() {
      var t = ver();
      if (t && t.t === "op" && t.v === "-") { p++; return -unario(); }
      if (t && t.t === "op" && t.v === "+") { p++; return unario(); }
      return potencia();
    }

    function potencia() {
      var b = sufijo(), t = ver();
      if (t && t.t === "op" && t.v === "^") { p++; return Math.pow(b, unario()); }
      if (t && t.t === "op" && t.v === "root") {      /* b ʳ x = raíz b-ésima de x */
        p++;
        var x = unario();
        if (b === 0) throw new Err("Error de dominio");
        if (x < 0 && Math.abs(b % 2) === 1) return -Math.pow(-x, 1 / b);
        if (x < 0) throw new Err("Error de dominio");
        return Math.pow(x, 1 / b);
      }
      return b;
    }

    function sufijo() {
      var v = atomo();
      for (;;) {
        var t = ver();
        if (!t || t.t !== "post") return v;
        p++;
        if (t.v === "!") v = factorial(v);
        else if (t.v === "%") v = v / 100;
        else if (t.v === "inv") { if (v === 0) throw new Err("No se puede dividir por cero"); v = 1 / v; }
        else if (t.v === "sq") v = v * v;
        else if (t.v === "cb") v = v * v * v;
      }
    }

    function atomo() {
      var t = ver();
      if (!t) throw new Err("Falta un número");
      if (t.t === "num") { p++; return t.v; }
      if (t.t === "ans") { p++; return ans; }
      if (t.t === "fn") {
        p++;
        var arg;
        if (comer("par", "(")) { arg = suma(); comer("par", ")"); }
        else arg = unario();                 /* por si quedó "sin" sin paréntesis */
        return aplicar(t.v, arg);
      }
      if (t.t === "par" && t.v === "(") {
        p++;
        var v = suma();
        comer("par", ")");
        return v;
      }
      throw new Err("Error de sintaxis");
    }

    function aplicar(f, x) {
      var R = Math.PI / 180;
      switch (f) {
        case "sin": return limpiar(Math.sin(grados ? x * R : x));
        case "cos": return limpiar(Math.cos(grados ? x * R : x));
        case "tan":
          var a = grados ? x * R : x;
          if (grados && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-10)
            throw new Err("Fuera de dominio");
          return limpiar(Math.tan(a));
        case "asin": case "acos":
          if (x < -1 || x > 1) throw new Err("Fuera de dominio");
          var r1 = f === "asin" ? Math.asin(x) : Math.acos(x);
          return grados ? r1 / R : r1;
        case "atan": return grados ? Math.atan(x) / R : Math.atan(x);
        case "sinh": return Math.sinh(x);
        case "cosh": return Math.cosh(x);
        case "tanh": return Math.tanh(x);
        case "asinh": return Math.asinh(x);
        case "acosh":
          if (x < 1) throw new Err("Fuera de dominio");
          return Math.acosh(x);
        case "atanh":
          if (x <= -1 || x >= 1) throw new Err("Fuera de dominio");
          return Math.atanh(x);
        case "ln":
          if (x <= 0) throw new Err("Fuera de dominio");
          return Math.log(x);
        case "log":
          if (x <= 0) throw new Err("Fuera de dominio");
          return Math.log10(x);
        case "sqrt":
          if (x < 0) throw new Err("Fuera de dominio");
          return Math.sqrt(x);
        case "cbrt": return Math.cbrt(x);
        case "abs": return Math.abs(x);
      }
      throw new Err("Error de sintaxis");
    }

    /* sin(180°) da 1.2e-16: se lleva a cero lo que es cero */
    function limpiar(v) { return Math.abs(v) < 1e-14 ? 0 : v; }

    function factorial(x) {
      if (x < 0 || Math.abs(x - Math.round(x)) > 1e-9) throw new Err("Sólo enteros ≥ 0");
      if (x > 170) throw new Err("Número demasiado grande");
      var r = 1;
      for (var i = 2; i <= Math.round(x); i++) r *= i;
      return r;
    }

    var val = suma();
    if (p < tk.length) throw new Err("Error de sintaxis");
    if (typeof val !== "number" || isNaN(val)) throw new Err("Error");
    if (!isFinite(val)) throw new Err("Número demasiado grande");
    return val;
  }

  /* Cierra los paréntesis que hayan quedado abiertos. */
  function cerrar(s) {
    var ab = 0;
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i) === "(") ab++;
      else if (s.charAt(i) === ")") ab--;
    }
    while (ab-- > 0) s += ")";
    return s;
  }

  /* Formato del resultado: 12 cifras significativas y notación
     científica cuando el número se va de escala. */
  function fmt(x) {
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 1e12 || a < 1e-9) {
      var s = x.toExponential(9).replace(/\.?0+e/, "e").split("e");
      return s[0] + "E" + (s[1].charAt(0) === "-" ? "−" : "") + s[1].replace(/[+-]/, "");
    }
    var r = parseFloat(x.toPrecision(12));
    return String(r).replace("-", "−").replace("e", "E");
  }

  /* ==========================================================
     INTERFAZ
     ========================================================== */
  var el = {}, expr = "", ans = 0, mem = 0, grados = true,
      inv = false, hyp = false, recien = false, error = "";

  function teclaDe(def) {
    if (inv && hyp && def.invhyp) return def.invhyp;
    if (hyp && def.hyp) return def.hyp;
    if (inv && def.inv) return def.inv;
    return def;
  }

  function pintarTeclas() {
    for (var i = 0; i < el.btns.length; i++) {
      var b = el.btns[i], d = teclaDe(b._def);
      if (b.firstChild.nodeValue !== d.t) b.firstChild.nodeValue = d.t;
      b.classList.toggle("cambia", d !== b._def);
    }
    el.btnInv.classList.toggle("on", inv);
    el.btnHyp.classList.toggle("on", hyp);
    el.btnAng.firstChild.nodeValue = grados ? "DEG" : "RAD";
  }

  function pintar() {
    el.expr.textContent = expr || "";
    el.fInv.classList.toggle("on", inv);
    el.fHyp.classList.toggle("on", hyp);
    el.fMem.classList.toggle("on", mem !== 0);
    el.fAng.textContent = grados ? "DEG" : "RAD";

    if (error) { el.res.textContent = error; el.res.classList.add("err"); return; }
    el.res.classList.remove("err");
    if (recien) { el.res.textContent = fmt(ans); return; }
    if (!expr) { el.res.textContent = "0"; return; }
    try {
      el.res.textContent = fmt(evaluar(cerrar(expr), grados, ans));
    } catch (e) {
      el.res.textContent = recien ? fmt(ans) : "";   /* mientras se escribe, sin ruido */
    }
  }

  function insertar(txt) {
    if (recien) {
      /* después de "=", un número empieza de cero y un operador sigue de Ans */
      if (/[0-9.π]/.test(txt.charAt(0)) || /^(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|ln|log|√|∛|\()/.test(txt))
        expr = "";
      else expr = "A";
      recien = false;
    }
    error = "";
    if (txt === "." && /\d*\.\d*$/.test(expr)) return;   /* un punto por número */
    if (!expr && /^[²³!%⁻]$/.test(txt)) expr = "0";       /* posfijo sobre el 0 del visor */
    expr += txt;
    pintar();
  }

  function accion(a) {
    switch (a) {
      case "inv": inv = !inv; pintarTeclas(); pintar(); return;
      case "hyp": hyp = !hyp; pintarTeclas(); pintar(); return;
      case "ang": grados = !grados; pintarTeclas(); pintar(); return;
      case "mc": mem = 0; pintar(); return;
      case "mr": insertar(fmt(mem).replace("−", "-").replace("-", "−") === "0" ? "0" : String(mem).replace("-", "−")); return;
      case "m+": case "m-":
        try {
          var v = expr ? evaluar(cerrar(expr), grados, ans) : ans;
          mem = a === "m+" ? mem + v : mem - v;
          recien = true; ans = v; error = "";
        } catch (e) { error = e.msg || "Error"; }
        pintar(); return;
      case "exp":
        if (!expr || !/[0-9.]$/.test(expr)) insertar("1E"); else insertar("E");
        return;
      case "back":
        if (recien) { recien = false; expr = ""; }
        error = "";
        /* borra el nombre completo de la función, no una letra suelta */
        var m = expr.match(/(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|ln|log|mod)\($|(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|ln|log|mod)$/);
        expr = m ? expr.slice(0, expr.length - m[0].length) : expr.slice(0, -1);
        pintar(); return;
      case "neg":
        if (recien) { expr = "A"; recien = false; }
        error = "";
        var num = /\((−)((?:\d+\.?\d*(?:E−?\d+)?)|A)\)$/;
        var suelto = /((?:\d+\.?\d*(?:E−?\d+)?)|A)$/;
        if (num.test(expr)) expr = expr.replace(num, "$2");        /* ya era negativo */
        else if (suelto.test(expr)) expr = expr.replace(suelto, "(−$1)");
        else expr += "−";                                          /* menos de apertura */
        pintar(); return;
      case "clear":
        expr = ""; error = ""; recien = false; pintar(); return;
      case "eq":
        if (!expr) return;
        try {
          ans = evaluar(cerrar(expr), grados, ans);
          expr = cerrar(expr);
          error = "";
          recien = true;
        } catch (e) { error = e.msg || "Error"; }
        pintar(); return;
    }
  }

  /* ---- efecto de tecla presionada desde el teclado físico ---- */
  function marcar(btn) {
    if (!btn) return;
    btn.classList.add("apretada");
    setTimeout(function () { btn.classList.remove("apretada"); }, 110);
  }

  var PORTECLA = {
    "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
    ".":".", ",":".", "+":"+", "-":"−", "*":"×", "/":"÷", "^":"^", "(":"(", ")":")",
    "!":"!", "%":"%", "p":"π", "e":"e"
  };

  function init() {
    var root = document.getElementById("calcu");
    if (!root) return;

    el.expr = root.querySelector("#cExpr");
    el.res = root.querySelector("#cRes");
    el.fInv = root.querySelector("#cfInv");
    el.fHyp = root.querySelector("#cfHyp");
    el.fAng = root.querySelector("#cfAng");
    el.fMem = root.querySelector("#cfMem");
    var teclado = root.querySelector("#cKeys");

    /* armado del teclado */
    el.btns = [];
    var html = "";
    TECLAS.forEach(function (fila) {
      fila.forEach(function (def) {
        var i = el.btns.length;
        html += '<button type="button" class="ck ck-' + def.k + '"' +
                (def.span ? ' style="grid-column:span ' + def.span + '"' : "") +
                ' data-i="' + i + '">' + def.t + "</button>";
        el.btns.push(def);
      });
    });
    teclado.innerHTML = html;
    var nodos = teclado.querySelectorAll("button");
    for (var i = 0; i < nodos.length; i++) { nodos[i]._def = el.btns[i]; el.btns[i] = nodos[i]; }

    el.btnInv = teclado.querySelector('[data-i="0"]');
    el.btnHyp = teclado.querySelector('[data-i="1"]');
    el.btnAng = teclado.querySelector('[data-i="2"]');

    teclado.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var d = teclaDe(b._def);
      if (d.act) accion(d.act);
      else {
        insertar(d.ins);
        if (inv || hyp) { inv = false; hyp = false; pintarTeclas(); }  /* modificador de un solo uso */
      }
      root.focus({ preventScroll: true });
    });

    /* teclado físico: sólo cuando la calculadora tiene el foco */
    root.addEventListener("keydown", function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var k = ev.key, ins = null, act = null;
      if (k === "Enter" || k === "=") act = "eq";
      else if (k === "Backspace") act = "back";
      else if (k === "Escape" || k === "Delete") act = "clear";
      else if (PORTECLA[k]) ins = PORTECLA[k];
      if (!ins && !act) return;
      ev.preventDefault();
      if (act) accion(act); else insertar(ins);
      /* marca la tecla equivalente para que se vea el golpe */
      for (var i = 0; i < el.btns.length; i++) {
        var d = teclaDe(el.btns[i]._def);
        if ((act && d.act === act) || (ins && d.ins === ins)) { marcar(el.btns[i]); break; }
      }
    });

    pintarTeclas();
    pintar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
