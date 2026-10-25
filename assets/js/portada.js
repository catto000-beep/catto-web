/* ============================================================
   catto.ar — Portada: el desglose de las dos carreras

   Son tres: los cuatro años de la tecnicatura en Electrónica, los de la
   tecnicatura en Electricidad y los seis niveles de la ingeniería. Las
   columnas y los enlaces vienen escritos en el HTML: no los
   arma este archivo. Eso importa por dos motivos. Un buscador que no ejecuta
   javascript igual encuentra las páginas de tema —antes no las veía
   ninguna— y quien tenga el javascript apagado ve la lista completa.

   Acá solo se le agrega comportamiento a lo que ya está:
   1) Abrir y cerrar cada materia.
   2) El buscador del encabezado, que filtra las dos carreras en vivo.
   3) La tira de "segui donde ibas", si hay una pagina de tema visitada.
   4) Llegando con /#t=<tema>, abrir la materia de ese tema y marcarlo.

   El HTML de la tecnicatura lo genera scratchpad/generar-anios.js a partir
   de assets/js/tecnicatura.js; el de Electricidad, scratchpad/anios_electricidad.py
   a partir de assets/js/tecnicatura-electricidad.js; y el de la ingeniería lo rehace
   _src-publicaciones/ingenieria/motor.py en cada corrida, entre los
   marcadores <!-- ingenieria:niveles -->.
   ============================================================ */
(function () {
  "use strict";

  /* Tres desgloses: las dos tecnicaturas y los seis niveles de la
     ingeniería. El comportamiento es el mismo para los tres. */
  var EN = (document.documentElement.lang || "").indexOf("en") === 0;
  var TX = EN ? { de: " of ", t1: "1 topic", tn: " topics" } : { de: " de ", t1: "1 tema", tn: " temas" };

  var grids = ["gridAnios", "gridElec", "gridNiveles"]
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
    /* la lista va en una caja que el CSS anima al abrir (crece de alto y los temas caen en cascada) */
    var mCaja = document.createElement("div"), mIn = document.createElement("div");
    mCaja.className = "m-caja"; mIn.className = "m-in";
    lista.parentNode.insertBefore(mCaja, lista);
    mIn.appendChild(lista); mCaja.appendChild(mIn);

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

  /* ------------------------------------------------ carreras desplegables
     Cada carrera (section.carrera) arranca plegada: se ve solo la barra del
     título y el visitante abre la que le interesa. El pliegue lo hace el CSS
     con html.js, así que sin javascript todo queda a la vista. La búsqueda y
     la llegada desde una página de tema abren la carrera que haga falta; lo
     que abrió la búsqueda se vuelve a plegar al borrarla. */
  var carreras = [].slice.call(document.querySelectorAll("section.carrera"));
  function abrirCarrera(sec, si) {
    if (!sec) return;
    sec.classList.toggle("abierta", si);
    var b = sec.querySelector(".pl-btn");
    if (b) b.setAttribute("aria-expanded", si ? "true" : "false");
  }
  carreras.forEach(function (sec) {
    var h = sec.querySelector(".tit-sec");
    if (!h) return;
    var cuerpo = sec.querySelector(".container");
    if (cuerpo && !cuerpo.id) cuerpo.id = sec.id + "-cuerpo";
    /* todo lo que va debajo del título, en una caja que el CSS anima al abrir
       (crece de alto y las columnas caen en cascada) */
    if (cuerpo) {
      var caja = document.createElement("div"), dentro = document.createElement("div");
      caja.className = "pl-cuerpo"; dentro.className = "pl-in";
      [].slice.call(cuerpo.children).forEach(function (n) { if (n !== h) dentro.appendChild(n); });
      caja.appendChild(dentro);
      cuerpo.appendChild(caja);
    }
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pl-btn";
    b.setAttribute("aria-expanded", "false");
    if (cuerpo) b.setAttribute("aria-controls", cuerpo.id);
    while (h.firstChild) b.appendChild(h.firstChild);
    h.appendChild(b);
    b.addEventListener("click", function () {
      delete sec.dataset.porBusqueda;   /* abierta o cerrada a mano: la búsqueda ya no la toca */
      abrirCarrera(sec, !sec.classList.contains("abierta"));
    });
  });
  function abrirPorBusqueda(sec) {
    if (!sec || sec.classList.contains("abierta")) return;
    sec.dataset.porBusqueda = "1";
    abrirCarrera(sec, true);
  }
  function cerrarLasDeBusqueda() {
    carreras.forEach(function (sec) {
      if (sec.dataset.porBusqueda) { delete sec.dataset.porBusqueda; abrirCarrera(sec, false); }
    });
  }

  /* ------------------------------------- llegando desde una página de tema
     La barra de cada tema enlaza la materia a /#t=<dirección del tema>: se
     abre la materia que contiene ese tema, se la trae a la vista y el tema
     queda marcado. */
  function desdeTema() {
    var m = /^#t=(\/[^#?]*)$/.exec(location.hash);
    if (!m) return;
    /* la portada en inglés enlaza a /en/... si el tema está traducido y al
       original si no: se compara sin el /en para que valgan los dos */
    function sinEn(h) { return h.replace(/\.html$/, "").replace(/^\/en(?=\/)/, ""); }
    var destino = sinEn(decodeURIComponent(m[1]));
    filas.forEach(function (f) {
      f.ejes.forEach(function (e) {
        var a = e.li.querySelector("a");
        if (!a || sinEn(a.getAttribute("href")) !== destino) return;
        abrirCarrera(f.li.closest ? f.li.closest("section.carrera") : null, true);
        abrir(f, true);
        a.className += " aqui";
        a.setAttribute("aria-current", "page");
        setTimeout(function () { mostrar(f.li, a); }, 520);   /* después de que la carrera termine de abrirse */
      });
    });
  }
  /* Deja debajo del encabezado fijo la cabecera del año (o nivel) con la
     materia; si así el tema marcado no entra en pantalla, deja arriba la
     materia, y si tampoco, centra el tema. */
  function mostrar(li, a) {
    var cab = document.querySelector("header.site");
    /* en el teléfono el encabezado se esconde al bajar: no hay que dejarle lugar */
    var alto = !cab || (window.matchMedia && window.matchMedia("(max-width:640px)").matches) ? 0 : cab.getBoundingClientRect().bottom;
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
      f.cuenta.textContent = visibles + TX.de + f.total;
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
      /* una carrera plegada con resultados se abre para mostrarlos */
      if (seccion && pal.length && vivas > 0) abrirPorBusqueda(seccion);
      /* la cuenta de cada materia se muestra solo mientras se busca */
      grid.classList.toggle("buscando", !!pal.length);
    });

    if (limpiar) limpiar.hidden = !pal.length;
    if (vacio) vacio.hidden = !(pal.length && hallados === 0);
    /* el aviso de «no encontré nada» vive dentro de una carrera: que se vea */
    if (vacio && !vacio.hidden) abrirPorBusqueda(vacio.closest ? vacio.closest("section.carrera") : null);
    if (!pal.length) cerrarLasDeBusqueda();
    if (marcador) {
      marcador.textContent = !pal.length ? ""
        : hallados === 1 ? TX.t1 : hallados + TX.tn;
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
  /* ------------------------------------------- encabezado en el teléfono
     En el teléfono el encabezado ocupa casi un tercio de la pantalla (logo,
     fecha, buscador y menú en tres renglones). Se ve solo con la página
     arriba de todo y se esconde al bajar, como en los mapas de temas. Son
     dos marcas y no una a propósito: entre ellas queda una zona muerta, así
     el rebote del scroll del celular no lo hace aparecer y desaparecer. */
  (function () {
    var cab = document.querySelector("header.site");
    if (!cab || !window.matchMedia) return;
    var tel = window.matchMedia("(max-width:640px)");
    var MOSTRAR = 8, OCULTAR = 56, oculto = false;
    function revisar() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var nuevo = oculto;
      if (!tel.matches || y <= MOSTRAR) nuevo = false;
      else if (y > OCULTAR) nuevo = true;
      if (nuevo === oculto) return;
      oculto = nuevo;
      cab.className = oculto ? cab.className + " hd-hide" : cab.className.replace(/\s*hd-hide/g, "");
    }
    window.addEventListener("scroll", revisar, { passive: true });
    if (tel.addEventListener) tel.addEventListener("change", revisar); else if (tel.addListener) tel.addListener(revisar);
    revisar();
  })();
})();
