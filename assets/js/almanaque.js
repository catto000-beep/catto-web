/* ============================================================
   catto.ar — Fecha y almanaque del hero
   Muestra el día de hoy en palabras y el mes en una grilla chica,
   con hoy marcado y los fines de semana en otro color. Las flechas
   pasan de mes; el botón del mes vuelve a hoy.

   Los nombres de días y meses van escritos acá y no salen de
   toLocaleDateString: así se ve igual en cualquier navegador, hasta
   en los de las máquinas viejas de la escuela.
   ============================================================ */
(function () {
  "use strict";

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
               "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  /* la semana arranca en lunes, como en los almanaques de acá */
  var CAB = [["L", "lunes"], ["M", "martes"], ["M", "miércoles"], ["J", "jueves"],
             ["V", "viernes"], ["S", "sábado"], ["D", "domingo"]];

  var el = {}, hoy = new Date(), verAno, verMes;

  function esMismoDia(a, y, m, d) {
    return a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;
  }

  function pintarFecha() {
    el.dia.textContent = DIAS[hoy.getDay()];
    el.num.textContent = hoy.getDate();
    el.mes.textContent = "de " + MESES[hoy.getMonth()] + " de " + hoy.getFullYear();
  }

  function pintarMes() {
    el.titulo.textContent = MESES[verMes] + " " + verAno;
    el.titulo.classList.toggle("otro", verMes !== hoy.getMonth() || verAno !== hoy.getFullYear());

    var primero = (new Date(verAno, verMes, 1).getDay() + 6) % 7;   /* 0 = lunes */
    var cuantos = new Date(verAno, verMes + 1, 0).getDate();
    var o = "";

    for (var i = 0; i < 7; i++)
      o += '<span class="alm-cab" title="' + CAB[i][1] + '">' + CAB[i][0] + "</span>";
    for (var h = 0; h < primero; h++) o += "<span></span>";

    for (var d = 1; d <= cuantos; d++) {
      var finde = (primero + d - 1) % 7 >= 5;
      var esHoy = esMismoDia(hoy, verAno, verMes, d);
      o += '<span class="alm-d' + (finde ? " finde" : "") + (esHoy ? " hoy" : "") + '"' +
           (esHoy ? ' aria-current="date"' : "") + ">" + d + "</span>";
    }
    el.grilla.innerHTML = o;
  }

  function irA(delta) {
    verMes += delta;
    if (verMes < 0) { verMes = 11; verAno--; }
    else if (verMes > 11) { verMes = 0; verAno++; }
    pintarMes();
  }

  function init() {
    var root = document.getElementById("alm");
    if (!root) return;

    el.dia = root.querySelector("#almDia");
    el.num = root.querySelector("#almNum");
    el.mes = root.querySelector("#almMes");
    el.titulo = root.querySelector("#almTitulo");
    el.grilla = root.querySelector("#almGrilla");

    verAno = hoy.getFullYear();
    verMes = hoy.getMonth();
    pintarFecha();
    pintarMes();

    root.querySelector("#almPrev").onclick = function () { irA(-1); };
    root.querySelector("#almNext").onclick = function () { irA(1); };
    el.titulo.onclick = function () {
      verAno = hoy.getFullYear(); verMes = hoy.getMonth(); pintarMes();
    };

    /* si alguien deja la página abierta, que a la medianoche cambie el día */
    setInterval(function () {
      var ahora = new Date();
      if (ahora.getDate() === hoy.getDate() && ahora.getMonth() === hoy.getMonth() &&
          ahora.getFullYear() === hoy.getFullYear()) return;
      var mirabaHoy = (verMes === hoy.getMonth() && verAno === hoy.getFullYear());
      hoy = ahora;
      if (mirabaHoy) { verAno = hoy.getFullYear(); verMes = hoy.getMonth(); }
      pintarFecha();
      pintarMes();
    }, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
