/* ============================================================
   catto.ar — Control de las figuras animadas de las paginas de tema
   Se aplica a todo <svg data-anim>.

   Muchas figuras van pasando por estados: cuatro familias de
   microcontroladores, tres modos de propagacion, los pasos de un calculo.
   Antes eso dependia solo de la animacion, y si el visitante tenia pedido
   «menos movimiento» —en Windows, en el sistema o en el navegador— la
   figura quedaba congelada en el primer estado y no habia manera de ver
   los demas: se veia como un grafico incompleto que no responde.

   Ahora esas figuras llevan ademas controles para moverse a mano:
   1) Si pidio menos movimiento, la figura no se anima sola: arranca en el
      primer estado y se avanza con los botones o tocando la figura.
   2) Si no, se anima sola y solo mientras esta a la vista, como antes. En
      cuanto alguien toca la figura o los botones, el control pasa a la
      persona y la figura deja de pasar sola.
   ============================================================ */
(function () {
  "use strict";

  var svgs = [].slice.call(document.querySelectorAll("svg[data-anim]"));
  if (!svgs.length) return;

  var quieto = !!(window.matchMedia &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function pausar(s) { try { s.pauseAnimations(); } catch (e) {} }
  function seguir(s) { try { s.unpauseAnimations(); } catch (e) {} }

  /* ---- estados de una figura ------------------------------------------
     Son los <g> hijos del svg que llevan una animacion discreta de opacidad.
     La lista de valores dice que le toca a cada grupo en cada paso, asi que
     alcanza con leerla para poder reproducir cualquier paso a mano. */
  function leerEstados(sv) {
    var grupos = [], pasos = 0, dur = 0;
    [].forEach.call(sv.children, function (g) {
      if (!g.tagName || g.tagName.toLowerCase() !== "g") return;
      var anim = null;
      [].forEach.call(g.children, function (c) {
        if (c.tagName && c.tagName.toLowerCase() === "animate" &&
            c.getAttribute("attributeName") === "opacity" &&
            c.getAttribute("calcMode") === "discrete") { anim = c; }
      });
      if (!anim) return;
      var vals = (anim.getAttribute("values") || "").split(";");
      if (vals.length < 2) return;
      grupos.push({ g: g, anim: anim, vals: vals });
      if (vals.length > pasos) pasos = vals.length;
      if (!dur) dur = parseFloat(anim.getAttribute("dur")) || 0;
    });
    return { grupos: grupos, pasos: pasos, dur: dur };
  }

  /* ---- controles ---- */
  function boton(txt, etiqueta) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = txt;
    b.setAttribute("aria-label", etiqueta);
    b.style.cssText = "background:#1c2230;color:#e6edf3;border:1px solid #2a3140;" +
      "border-radius:6px;width:30px;height:26px;line-height:1;padding:0;cursor:pointer;" +
      "font-size:15px;font-family:inherit";
    return b;
  }

  function preparar(sv) {
    var e = leerEstados(sv);
    if (e.pasos < 2) return null;

    /* Si cada estado dura poco, no son estados para leer sino cuadros de una
       animacion continua (una senoidal que avanza, un fasor que gira). Esos
       no llevan controles: no hay nada que recorrer paso a paso. */
    if (!e.dur || e.dur / e.pasos < 1.5) return null;

    var manual = false;
    var paso = 0;

    var barra = document.createElement("div");
    barra.style.cssText = "display:flex;align-items:center;gap:10px;margin:8px 0 0;" +
      "font-size:12px;color:#9aa7b4";
    var atras = boton("‹", "Estado anterior");
    var adelante = boton("›", "Estado siguiente");
    var cuenta = document.createElement("span");
    cuenta.style.cssText = "min-width:52px;font-variant-numeric:tabular-nums";
    var nota = document.createElement("span");
    nota.style.cssText = "color:#7d8a99";
    nota.textContent = quieto ? "tocá la figura para avanzar"
                              : "se pasa sola · tocá la figura para manejarla";

    barra.appendChild(atras);
    barra.appendChild(adelante);
    barra.appendChild(cuenta);
    barra.appendChild(nota);
    if (sv.parentNode) sv.parentNode.insertBefore(barra, sv.nextSibling);
    sv.style.cursor = "pointer";

    function pasoActual() {
      var t = 0;
      try { t = sv.getCurrentTime(); } catch (err) { t = 0; }
      if (!e.dur) return 0;
      return Math.floor(((t % e.dur) / e.dur) * e.pasos) % e.pasos;
    }

    /* Sacar las animaciones de opacidad: mientras existen, mandan ellas y no
       hay estilo que las pise. Una vez fuera, vale el style de cada grupo. */
    function tomarControl(desde) {
      if (manual) return;
      manual = true;
      paso = desde;
      e.grupos.forEach(function (x) {
        if (x.anim.parentNode) x.anim.parentNode.removeChild(x.anim);
      });
      nota.textContent = "";
    }

    function pintar() {
      e.grupos.forEach(function (x) {
        x.g.style.opacity = (x.vals[paso % x.vals.length] || "0").trim();
      });
      cuenta.textContent = (paso + 1) + " / " + e.pasos;
    }

    function mover(d) {
      tomarControl(manual ? paso : pasoActual());
      paso = ((paso + d) % e.pasos + e.pasos) % e.pasos;
      pintar();
    }

    atras.addEventListener("click", function () { mover(-1); });
    adelante.addEventListener("click", function () { mover(1); });
    sv.addEventListener("click", function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest("a")) return;  /* enlaces adentro */
      mover(1);
    });

    if (quieto) {
      tomarControl(0);
      pintar();
    } else {
      cuenta.textContent = "1 / " + e.pasos;
    }
    /* mientras se pasa sola, el contador sigue a la figura */
    return function () {
      if (manual) return;
      cuenta.textContent = (pasoActual() + 1) + " / " + e.pasos;
    };
  }

  var seguidores = [];
  svgs.forEach(function (s) {
    var f = preparar(s);
    if (f) seguidores.push(f);
  });
  if (!quieto && seguidores.length) {
    setInterval(function () { seguidores.forEach(function (f) { f(); }); }, 500);
  }

  if (quieto) {
    svgs.forEach(function (s) { pausar(s); try { s.setCurrentTime(0); } catch (e) {} });
    return;
  }

  if (!("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) seguir(e.target); else pausar(e.target);
    });
  }, { rootMargin: "140px 0px" });

  /* Arrancan andando: si por lo que fuera el observador no informara nunca,
     las figuras se animan igual. Lo unico que hace el observador es frenarlas
     mientras estan fuera de la pantalla. */
  svgs.forEach(function (s) { io.observe(s); });
})();
