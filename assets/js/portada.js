/* ============================================================
   catto.ar — Portada: el desglose de las dos carreras

   Son dos: los cuatro años de la tecnicatura y los seis niveles de la
   ingeniería. Las columnas y los enlaces vienen escritos en el HTML: no los
   arma este archivo. Eso importa por dos motivos. Un buscador que no ejecuta
   javascript igual encuentra las páginas de tema —antes no las veía
   ninguna— y quien tenga el javascript apagado ve la lista completa.

   Acá solo se le agrega comportamiento a lo que ya está:
   1) Abrir y cerrar cada materia.
   2) El buscador del encabezado, que filtra las dos carreras en vivo.
   3) La tira de "segui donde ibas", si hay una pagina de tema visitada.
   4) Llegando con /#t=<tema>, abrir la materia de ese tema y marcarlo.

   El HTML de la tecnicatura lo genera scratchpad/generar-anios.js a partir
   de assets/js/tecnicatura.js, y el de la ingeniería lo rehace
   _src-publicaciones/ingenieria/motor.py en cada corrida, entre los
   marcadores <!-- ingenieria:niveles -->.
   ============================================================ */
(function () {
  "use strict";

  /* Dos desgloses: los cuatro años de la tecnicatura y los seis niveles de
     la ingeniería. El comportamiento es el mismo para los dos. */
  var grids = ["gridAnios", "gridNiveles"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!grids.length) return;

  /* Para buscar sin que importen tildes ni mayusculas. Cada eje trae en su
     data-b el texto ya normalizado: titulo, descripcion, temas transversales,
     materia y area. */
  function pelar(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------------------------------------------------------- las materias */
  var filas = [];

  grids.forEach(function (grid) {
  [].forEach.call(grid.querySelectorAll(".m-item"), function (li) {
    var boton = li.querySelector(".m-fila");
    var lista = li.querySelector(".m-ejes");
    var cuenta = li.querySelector(".m-c");
    if (!boton || !lista) return;

    var ejes = [].map.call(lista.children, function (x) {
      return { li: x, texto: x.getAttribute("data-b") || "" };
    });

    boton.addEventListener("click", function () {
      var abierto = li.className.indexOf("abierto") === -1;
      li.className = abierto ? "m-item abierto" : "m-item";
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });

    filas.push({ li: li, boton: boton, cuenta: cuenta, ejes: ejes, total: ejes.length,
                 etiqueta: cuenta ? cuenta.textContent : "" });
  });
  });

  function abrir(f, si) {
    f.li.className = si ? "m-item abierto" : "m-item";
    f.boton.setAttribute("aria-expanded", si ? "true" : "false");
  }

  /* ------------------------------------- llegando desde una página de tema
     La barra de cada tema enlaza la materia a /#t=<dirección del tema>: se
     abre la materia que contiene ese tema, se la trae a la vista y el tema
     queda marcado. */
  function desdeTema() {
    var m = /^#t=(\/[^#?]*)$/.exec(location.hash);
    if (!m) return;
    var destino = decodeURIComponent(m[1]).replace(/\.html$/, "");
    filas.forEach(function (f) {
      f.ejes.forEach(function (e) {
        var a = e.li.querySelector("a");
        if (!a || a.getAttribute("href").replace(/\.html$/, "") !== destino) return;
        abrir(f, true);
        a.className += " aqui";
        a.setAttribute("aria-current", "page");
        setTimeout(function () { mostrar(f.li, a); }, 60);
      });
    });
  }
  /* Deja debajo del encabezado fijo la cabecera del año (o nivel) con la
     materia; si así el tema marcado no entra en pantalla, deja arriba la
     materia, y si tampoco, centra el tema. */
  function mostrar(li, a) {
    var cab = document.querySelector("header.site");
    var alto = cab ? cab.getBoundingClientRect().bottom : 0;
    var r = a.getBoundingClientRect(), y0 = window.pageYOffset;
    var col = li.closest ? li.closest("section.anio") : null;
    var y = null;
    [col, li].some(function (el) {
      if (!el) return false;
      var top = el.getBoundingClientRect().top;
      if (r.bottom - top + alto + 12 <= window.innerHeight) { y = y0 + top - alto - 12; return true; }
      return false;
    });
    if (y === null) y = y0 + r.top - alto - (window.innerHeight - alto - r.height) / 2;
    window.scrollTo(0, Math.max(0, y));
  }
  desdeTema();
  window.addEventListener("hashchange", desdeTema);

  /* -------------------------------------------------------------- filtrado */
  var input = document.getElementById("btIn");
  var marcador = document.getElementById("btCuenta");
  var limpiar = document.getElementById("btClear");
  var vacio = document.getElementById("sinResultados");

  function filtrar(q) {
    /* palabra por palabra: «fibra optica» tiene que encontrar «fibras opticas» */
    var pal = pelar(q.trim()).split(/\s+/).filter(Boolean);
    var hallados = 0;

    function coincide(t) {
      for (var i = 0; i < pal.length; i++) {
        if (t.indexOf(pal[i]) === -1) return false;
      }
      return true;
    }

    filas.forEach(function (f) {
      var visibles = 0;

      f.ejes.forEach(function (e) {
        var ok = !pal.length || coincide(e.texto);
        e.li.hidden = !ok;
        if (ok && pal.length) visibles++;
      });

      if (!pal.length) {
        f.li.hidden = false;
        /* vuelve a su etiqueta original: en ingeniería dice «6 de 8» */
        f.cuenta.textContent = f.etiqueta || String(f.total);
        abrir(f, false);
        return;
      }

      f.li.hidden = visibles === 0;
      f.cuenta.textContent = visibles + " de " + f.total;
      abrir(f, visibles > 0);
      hallados += visibles;
    });

    /* una columna sin nada adentro no tiene por que ocupar lugar, y una
       sección entera sin resultados tampoco */
    grids.forEach(function (grid) {
      var vivas = 0;
      [].forEach.call(grid.children, function (col) {
        var quedan = [].filter.call(col.querySelectorAll(".m-item"), function (li) {
          return !li.hidden;
        }).length;
        col.hidden = !!pal.length && quedan === 0;
        if (!col.hidden) vivas++;
      });
      /* si no hubo un solo resultado en ninguna de las dos carreras, la
         sección se queda: adentro vive el aviso de «no encontré nada» */
      var seccion = grid.closest ? grid.closest("section.block") : null;
      if (seccion) seccion.hidden = !!pal.length && vivas === 0 && hallados > 0;
    });

    if (limpiar) limpiar.hidden = !pal.length;
    if (vacio) vacio.hidden = !(pal.length && hallados === 0);
    if (marcador) {
      marcador.textContent = !pal.length ? ""
        : hallados === 1 ? "1 tema" : hallados + " temas";
    }
  }

  if (input) {
    input.addEventListener("input", function () { filtrar(input.value); });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { input.value = ""; filtrar(""); }
    });
    if (input.value.trim()) filtrar(input.value);   /* por si el navegador la recordo */
  }
  if (limpiar) {
    limpiar.addEventListener("click", function () {
      input.value = "";
      filtrar("");
      input.focus();
    });
  }

  /* -------------------------------------------------- segui donde ibas */
  (function () {
    var caja = document.getElementById("seguir");
    if (!caja) return;
    var dato;
    try { dato = JSON.parse(localStorage.getItem("cattoUltimoTema") || "null"); }
    catch (e) { return; }
    if (!dato || !dato.u || !dato.t) return;
    /* al mes ya no es "donde ibas" */
    if (dato.f && Date.now() - dato.f > 31 * 24 * 3600 * 1000) return;

    document.getElementById("seguirLink").href = dato.u;
    document.getElementById("seguirTit").textContent = dato.t;
    document.getElementById("seguirMat").textContent =
      [dato.m, dato.a].filter(Boolean).join(" · ");
    caja.hidden = false;
  })();
})();
