/* ============================================================
   catto.ar — Buscador del sitio
   Escribís una palabra en la barra de arriba y aparece la lista de
   lugares de la página donde eso se lee: publicaciones, secciones
   adentro de cada publicación, páginas sueltas y archivos de
   descargas, con el pedacito de texto donde aparece.

   El índice vive aparte, en assets/js/buscador-datos.js (unos 320 kB
   comprimido, y creciendo con cada tema que se publica), y no
   se baja hasta que alguien toca el buscador: así la portada sigue
   abriendo liviana. Ese archivo lo arma docs/generar-indice.js y hay
   que volver a correrlo cuando se agrega o se cambia una publicación.
   ============================================================ */
(function () {
  "use strict";

  var DATOS = "/assets/js/buscador-datos.js";
  var TOPE = 10;          /* resultados que se muestran */
  var ANCHO = 150;        /* largo del pedacito de texto de cada resultado */

  var el = {}, indice = null, pidiendo = false, resultados = [], marcado = -1, ultima = "";

  /* ---- texto comparable ------------------------------------------------
     Se saca acento por acento, letra por letra, para que el largo no cambie:
     los índices del texto pelado tienen que servir para cortar y resaltar
     sobre el texto original ("día" y "dia" miden lo mismo). */
  function pelar(s) {
    var o = "", i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      o += c.length ? c.charAt(0) : s.charAt(i);
    }
    return o;
  }

  function palabras(q) {
    return pelar(q).split(/[^0-9a-zµñ]+/).filter(function (w) { return w.length > 0; });
  }

  /* ---- índice ---- */
  function preparar(lista) {
    indice = lista.map(function (e) {
      return { t: e.t, d: e.d, u: e.u, x: e.x, pt: pelar(e.t), pd: pelar(e.d), px: pelar(e.x) };
    });
  }

  function traer(luego) {
    if (indice) { luego(); return; }
    if (pidiendo) return;
    pidiendo = true;
    var s = document.createElement("script");
    s.src = DATOS;
    s.onload = function () {
      pidiendo = false;
      preparar(window.CATTO_INDICE || []);
      luego();
    };
    s.onerror = function () {
      pidiendo = false;
      indice = [];
      luego();
    };
    document.head.appendChild(s);
  }

  /* ---- búsqueda ----
     Tienen que estar todas las palabras que se escribieron (y). El orden de
     la lista sale de dónde aparecen: primero los títulos, después el texto. */
  function cuantas(texto, w) {
    var n = 0, i = texto.indexOf(w);
    while (i !== -1) { n++; i = texto.indexOf(w, i + w.length); }
    return n;
  }

  function buscar(q) {
    var ws = palabras(q);
    if (!ws.length || !indice) return [];
    var salida = [];

    for (var k = 0; k < indice.length; k++) {
      var e = indice[k], puntos = 0, total = 0, todas = true;
      for (var j = 0; j < ws.length; j++) {
        var w = ws[j];
        var enT = cuantas(e.pt, w), enD = cuantas(e.pd, w), enX = cuantas(e.px, w);
        if (!enT && !enD && !enX) { todas = false; break; }
        /* que la palabra arranque el título vale más que aparecer perdida en el texto */
        if (enT) puntos += (e.pt.indexOf(w) === 0 ? 60 : 40);
        if (enD) puntos += 8;
        puntos += Math.min(enX, 6) * 3;
        total += enT + enD + enX;
      }
      if (!todas) continue;
      if (e.d === "Publicación" || e.d === "Página") puntos += 6;   /* la puerta de entrada primero */
      salida.push({ e: e, puntos: puntos, veces: total, ws: ws });
    }
    salida.sort(function (a, b) { return b.puntos - a.puntos || b.veces - a.veces; });
    return salida;
  }

  /* ---- resaltado ----
     Devuelve un fragmento con la palabra buscada adentro de <mark>. Se
     trabaja sobre el texto pelado y se corta el original en los mismos
     índices, que para eso pelar() respeta el largo. */
  function resaltar(original, pelado, ws, desde, hasta) {
    var frag = document.createDocumentFragment();
    var golpes = [], j, i;

    for (j = 0; j < ws.length; j++) {
      i = pelado.indexOf(ws[j], desde);
      while (i !== -1 && i < hasta) {
        golpes.push([i, i + ws[j].length]);
        i = pelado.indexOf(ws[j], i + ws[j].length);
      }
    }
    golpes.sort(function (a, b) { return a[0] - b[0]; });

    var pos = desde;
    for (j = 0; j < golpes.length; j++) {
      if (golpes[j][0] < pos) continue;               /* pisado por el anterior */
      frag.appendChild(document.createTextNode(original.slice(pos, golpes[j][0])));
      var m = document.createElement("mark");
      m.textContent = original.slice(golpes[j][0], golpes[j][1]);
      frag.appendChild(m);
      pos = golpes[j][1];
    }
    frag.appendChild(document.createTextNode(original.slice(pos, hasta)));
    return frag;
  }

  /* ventana de texto centrada en la primera aparición, cortada en espacios */
  function ventana(pelado, ws) {
    var mejor = -1, j, i;
    for (j = 0; j < ws.length; j++) {
      i = pelado.indexOf(ws[j]);
      if (i !== -1 && (mejor === -1 || i < mejor)) mejor = i;
    }
    if (mejor === -1) return [0, Math.min(ANCHO, pelado.length)];

    var a = Math.max(0, mejor - Math.round(ANCHO / 3));
    var b = Math.min(pelado.length, a + ANCHO);
    if (a > 0) { var e1 = pelado.indexOf(" ", a); if (e1 !== -1 && e1 < a + 18) a = e1 + 1; }
    if (b < pelado.length) { var e2 = pelado.lastIndexOf(" ", b); if (e2 > a + 30) b = e2; }
    return [a, b];
  }

  function icono(d) {
    if (d.indexOf("Descarga") === 0) return "📄";
    if (d === "Publicación") return "📘";
    if (d === "Página") return "🏠";
    return "▸";                       /* una sección adentro de una publicación */
  }

  /* ---- dibujar la lista ---- */
  function pintar(q) {
    el.lista.textContent = "";
    resultados = buscar(q);
    marcado = -1;

    if (!q.trim()) { abrir(false); return; }

    if (!resultados.length) {
      var vacio = document.createElement("li");
      vacio.className = "bs-nada";
      vacio.textContent = "No encontré nada con “" + q.trim() + "”";
      el.lista.appendChild(vacio);
      el.cabe.textContent = "";
      abrir(true);
      return;
    }

    var muestro = resultados.slice(0, TOPE);
    el.cabe.textContent = resultados.length === 1
      ? "1 lugar en el sitio"
      : resultados.length + " lugares en el sitio" +
        (resultados.length > TOPE ? " · muestro los " + TOPE + " primeros" : "");

    muestro.forEach(function (r, n) {
      var e = r.e;
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.id = "bs-op" + n;

      var a = document.createElement("a");
      a.className = "bs-it";
      a.href = e.u;

      var ic = document.createElement("span");
      ic.className = "bs-ic";
      ic.setAttribute("aria-hidden", "true");
      ic.textContent = icono(e.d);
      a.appendChild(ic);

      var cuerpo = document.createElement("span");
      cuerpo.className = "bs-cu";

      var tit = document.createElement("span");
      tit.className = "bs-t";
      tit.appendChild(resaltar(e.t, e.pt, r.ws, 0, e.t.length));
      cuerpo.appendChild(tit);

      var bread = document.createElement("span");
      bread.className = "bs-d";
      bread.textContent = e.d;
      cuerpo.appendChild(bread);

      var v = ventana(e.px, r.ws);
      var txt = document.createElement("span");
      txt.className = "bs-x";
      if (v[0] > 0) txt.appendChild(document.createTextNode("…"));
      txt.appendChild(resaltar(e.x, e.px, r.ws, v[0], v[1]));
      if (v[1] < e.x.length) txt.appendChild(document.createTextNode("…"));
      cuerpo.appendChild(txt);

      a.appendChild(cuerpo);

      var veces = document.createElement("span");
      veces.className = "bs-n";
      veces.title = r.veces === 1 ? "1 coincidencia" : r.veces + " coincidencias";
      veces.textContent = r.veces > 99 ? "99+" : r.veces;
      a.appendChild(veces);

      li.appendChild(a);
      el.lista.appendChild(li);
    });

    abrir(true);
  }

  function abrir(si) {
    el.pop.hidden = !si;
    el.raiz.classList.toggle("abierto", si);
    el.input.setAttribute("aria-expanded", si ? "true" : "false");
    if (!si) marcar(-1);
  }

  function marcar(n) {
    var items = el.lista.querySelectorAll("li[role=option]");
    if (!items.length) { marcado = -1; return; }
    if (n < 0) n = items.length - 1;
    if (n >= items.length) n = 0;
    for (var i = 0; i < items.length; i++) {
      var on = (i === n);
      items[i].classList.toggle("on", on);
      items[i].setAttribute("aria-selected", on ? "true" : "false");
    }
    marcado = n;
    el.input.setAttribute("aria-activedescendant", "bs-op" + n);
    items[n].scrollIntoView({ block: "nearest" });
  }

  function ir(n) {
    var a = el.lista.querySelectorAll("li[role=option] a")[n];
    if (a) window.location.href = a.getAttribute("href");
  }

  function alTipear() {
    var q = el.input.value;
    el.borrar.hidden = !q;
    if (q === ultima) return;
    ultima = q;
    if (!q.trim()) { abrir(false); el.lista.textContent = ""; return; }
    traer(function () { if (el.input.value === q) pintar(q); });
  }

  function init() {
    var raiz = document.getElementById("busca");
    if (!raiz) return;

    el.raiz = raiz;
    el.input = raiz.querySelector("#buscaIn");
    el.pop = raiz.querySelector("#buscaPop");
    el.cabe = raiz.querySelector("#buscaCabe");
    el.lista = raiz.querySelector("#buscaLista");
    el.borrar = raiz.querySelector("#buscaX");

    /* al primer toque ya se va bajando el índice, así el primer tecleo no espera */
    el.input.addEventListener("focus", function () {
      traer(function () {});
      if (el.input.value.trim()) pintar(el.input.value);
    });
    el.input.addEventListener("input", alTipear);

    el.borrar.addEventListener("click", function () {
      el.input.value = ""; ultima = ""; el.borrar.hidden = true;
      el.lista.textContent = ""; abrir(false); el.input.focus();
    });

    el.input.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); if (!el.pop.hidden) marcar(marcado + 1); else alTipear(); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); if (!el.pop.hidden) marcar(marcado - 1); }
      else if (ev.key === "Enter") {
        if (marcado >= 0) { ev.preventDefault(); ir(marcado); }
        else if (resultados.length) { ev.preventDefault(); ir(0); }
      } else if (ev.key === "Escape") {
        if (!el.pop.hidden) { ev.stopPropagation(); abrir(false); }
        else { el.input.value = ""; el.borrar.hidden = true; ultima = ""; }
      }
    });

    document.addEventListener("click", function (ev) {
      if (!raiz.contains(ev.target)) abrir(false);
    });

    /* la barra "/" abre el buscador, como en cualquier sitio de programación */
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target, n = t && t.tagName;
      if (n === "INPUT" || n === "TEXTAREA" || n === "SELECT" || (t && t.isContentEditable)) return;
      ev.preventDefault();
      el.input.focus();
      el.input.select();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
