/* ============================================================
   catto.ar — Fecha y almanaque de la barra de arriba
   Al lado del chanchito queda siempre a la vista una hojita de
   almanaque con el día y la fecha en palabras. El mes completo se
   despliega abajo al pasar el mouse o al tocarla (en el teléfono no
   hay hover, por eso también abre con clic).

   Los nombres de días y meses van escritos acá y no salen de
   toLocaleDateString: así se ve igual en cualquier navegador, hasta
   en los de las máquinas viejas de la escuela.
   ============================================================ */
(function () {
  "use strict";

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
               "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
                "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  /* la semana arranca en lunes, como en los almanaques de acá */
  var CAB = [["L", "lunes"], ["M", "martes"], ["M", "miércoles"], ["J", "jueves"],
             ["V", "viernes"], ["S", "sábado"], ["D", "domingo"]];

  var el = {}, hoy = new Date(), verAno, verMes;

  function pintarHoy() {
    el.hojaMes.textContent = CORTOS[hoy.getMonth()];
    el.hojaNum.textContent = hoy.getDate();
    el.dia.textContent = DIAS[hoy.getDay()];
    el.fecha.textContent = hoy.getDate() + " de " + MESES[hoy.getMonth()] + " de " + hoy.getFullYear();
    el.raiz.setAttribute("aria-label",
      "Hoy es " + DIAS[hoy.getDay()] + " " + el.fecha.textContent + ". Ver el almanaque del mes");
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
      var esHoy = (verAno === hoy.getFullYear() && verMes === hoy.getMonth() && d === hoy.getDate());
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

  function abrir(si) {
    el.raiz.classList.toggle("abierto", si);
    el.boton.setAttribute("aria-expanded", si ? "true" : "false");
    if (!si) volverAHoy();
  }
  function volverAHoy() {
    if (verAno === hoy.getFullYear() && verMes === hoy.getMonth()) return;
    verAno = hoy.getFullYear(); verMes = hoy.getMonth(); pintarMes();
  }

  function init() {
    var raiz = document.getElementById("fecha");
    if (!raiz) return;

    el.raiz = raiz;
    el.boton = raiz.querySelector("#fechaBtn");
    el.hojaMes = raiz.querySelector("#almHojaMes");
    el.hojaNum = raiz.querySelector("#almHojaNum");
    el.dia = raiz.querySelector("#almDia");
    el.fecha = raiz.querySelector("#almFecha");
    el.titulo = raiz.querySelector("#almTitulo");
    el.grilla = raiz.querySelector("#almGrilla");

    verAno = hoy.getFullYear();
    verMes = hoy.getMonth();
    pintarHoy();
    pintarMes();

    el.boton.addEventListener("click", function () {
      abrir(!el.raiz.classList.contains("abierto"));
    });
    raiz.querySelector("#almPrev").onclick = function () { irA(-1); };
    raiz.querySelector("#almNext").onclick = function () { irA(1); };
    el.titulo.onclick = volverAHoy;

    /* cerrar al tocar afuera o con Escape */
    document.addEventListener("click", function (ev) {
      if (!raiz.contains(ev.target)) abrir(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") abrir(false);
    });
    /* al salir con el mouse, el mes vuelve al de hoy */
    raiz.addEventListener("mouseleave", volverAHoy);

    /* si alguien deja la página abierta, que a la medianoche cambie el día */
    setInterval(function () {
      var ahora = new Date();
      if (ahora.getDate() === hoy.getDate() && ahora.getMonth() === hoy.getMonth() &&
          ahora.getFullYear() === hoy.getFullYear()) return;
      var mirabaHoy = (verMes === hoy.getMonth() && verAno === hoy.getFullYear());
      hoy = ahora;
      if (mirabaHoy) { verAno = hoy.getFullYear(); verMes = hoy.getMonth(); }
      pintarHoy();
      pintarMes();
    }, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
