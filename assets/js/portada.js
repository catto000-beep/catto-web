/* ============================================================
   catto.ar — Portada: los cuatro años de la tecnicatura

   Las cuatro columnas y los 95 enlaces vienen escritos en el HTML: no los
   arma este archivo. Eso importa por dos motivos. Un buscador que no ejecuta
   javascript igual encuentra las 88 páginas de tema —antes no las veía
   ninguna— y quien tenga el javascript apagado ve la lista completa.

   Acá solo se le agrega comportamiento a lo que ya está:
   1) Abrir y cerrar cada materia.
   2) El buscador del encabezado, que filtra los 95 ejes en vivo.
   3) La tira de "segui donde ibas", si hay una pagina de tema visitada.

   El HTML lo genera scratchpad/generar-anios.js a partir de
   assets/js/tecnicatura.js, que es la misma fuente que usa el mapa: si se
   agrega un eje alla, se vuelve a correr el generador y aparece aca.
   ============================================================ */
(function () {
  "use strict";

  var grid = document.getElementById("gridAnios");
  if (!grid) return;

  /* Para buscar sin que importen tildes ni mayusculas. Cada eje trae en su
     data-b el texto ya normalizado: titulo, descripcion, temas transversales,
     materia y area. */
  function pelar(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------------------------------------------------------- las materias */
  var filas = [];

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

    filas.push({ li: li, boton: boton, cuenta: cuenta, ejes: ejes, total: ejes.length });
  });

  function abrir(f, si) {
    f.li.className = si ? "m-item abierto" : "m-item";
    f.boton.setAttribute("aria-expanded", si ? "true" : "false");
  }

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
        f.cuenta.textContent = String(f.total);
        abrir(f, false);
        return;
      }

      f.li.hidden = visibles === 0;
      f.cuenta.textContent = visibles + " de " + f.total;
      abrir(f, visibles > 0);
      hallados += visibles;
    });

    /* una columna sin nada adentro no tiene por que ocupar lugar */
    [].forEach.call(grid.children, function (col) {
      var quedan = [].filter.call(col.querySelectorAll(".m-item"), function (li) {
        return !li.hidden;
      }).length;
      col.hidden = !!pal.length && quedan === 0;
    });

    if (limpiar) limpiar.hidden = !pal.length;
    if (vacio) vacio.hidden = !(pal.length && hallados === 0);
    if (marcador) {
      marcador.textContent = !pal.length ? ""
        : hallados === 1 ? "1 eje temático" : hallados + " ejes temáticos";
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
