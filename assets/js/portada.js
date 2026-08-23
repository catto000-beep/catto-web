/* ============================================================
   catto.ar — Portada: los cuatro años de la tecnicatura
   Arma las cuatro columnas a partir de /assets/js/tecnicatura.js, que es
   la misma fuente que usa el Mapa de Temas. Nada esta escrito a mano aca:
   si se agrega un eje alla, aparece aca solo.
   1) Las cifras del encabezado.
   2) Una columna por año, con sus materias; al abrir una, sus ejes.
   3) El buscador del hero filtra los 95 ejes en vivo.
   4) La tira de "segui donde ibas", si hay una pagina de tema visitada.
   ============================================================ */
(function () {
  "use strict";

  if (typeof MATERIAS === "undefined") return;

  var TEMA_BASE = "/publicaciones/mapa-electronica/temas/";
  var ANIOS = [4, 5, 6, 7];

  /* Un eje puede apuntar a su pagina de tema (slug) o a una publicacion del
     sitio que ya trata el tema (ruta absoluta). */
  function destino(e) {
    return e.u.charAt(0) === "/" ? e.u : TEMA_BASE + e.u;
  }
  function esPagina(e) {
    return e.u && e.u.charAt(0) !== "/";
  }

  /* Para buscar sin que importen tildes ni mayusculas. */
  function pelar(s) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  /* ---------------------------------------------------------------- cifras */
  var cifras = document.getElementById("cifras");
  if (cifras) {
    var ejes = 0, horas = 0, slugs = {};
    MATERIAS.forEach(function (m) {
      horas += m.h;
      m.ejes.forEach(function (e) {
        ejes++;
        /* hay ejes de dos materias distintas que comparten pagina (Antenas, por
           ejemplo, se dicta en 6 y en 7): la pagina se cuenta una sola vez */
        if (esPagina(e)) slugs[e.u] = 1;
      });
    });
    var paginas = Object.keys(slugs).length;
    [[4, "años"], [MATERIAS.length, "espacios curriculares"], [ejes, "ejes temáticos"],
     [paginas, "páginas desarrolladas"], [horas.toLocaleString("es-AR"), "horas reloj"]]
      .forEach(function (par) {
        var c = el("span", "cf");
        c.appendChild(el("b", null, String(par[0])));
        c.appendChild(el("span", null, par[1]));
        cifras.appendChild(c);
      });
  }

  /* ------------------------------------------------------------ los cuatro */
  var grid = document.getElementById("gridAnios");
  if (!grid) return;

  var filas = [];   // {mat, li, ejes:[{e, li, texto}]}

  ANIOS.forEach(function (an) {
    var mats = MATERIAS.filter(function (m) { return m.anio === an; });
    if (!mats.length) return;

    var col = el("section", "anio");
    col.setAttribute("data-anio", String(an));

    var cab = el("div", "a-head");
    cab.appendChild(el("span", "a-n", an + "° año"));
    var nEjes = mats.reduce(function (a, m) { return a + m.ejes.length; }, 0);
    cab.appendChild(el("span", "a-c", mats.length + " materias · " + nEjes + " temas"));
    col.appendChild(cab);

    var lista = el("ul", "a-mats");
    mats.forEach(function (m) {
      var li = el("li", "m-item");

      var bt = el("button", "m-fila");
      bt.type = "button";
      bt.setAttribute("aria-expanded", "false");
      var punto = el("span", "m-dot");
      punto.style.background = (AREAS[m.area] || {}).c || "#58a6ff";
      bt.appendChild(punto);
      bt.appendChild(el("span", "m-n", m.n));
      var cta = el("span", "m-c", String(m.ejes.length));
      bt.appendChild(cta);
      bt.appendChild(el("span", "m-fl", "›"));
      li.appendChild(bt);

      var ul = el("ul", "m-ejes");
      ul.hidden = true;
      var hijos = [];
      m.ejes.forEach(function (e) {
        var lie = el("li");
        var a = el("a", null, e.t);
        a.href = destino(e);
        if (!esPagina(e)) a.className = "publi";
        lie.appendChild(a);
        ul.appendChild(lie);
        /* Se busca sobre todo lo que describe al eje, no solo su titulo: los
           titulos de la curricula son escuetos y «PLC» o «fibra optica» viven
           en los temas transversales. */
        var temas = (e.tm || []).map(function (par) {
          return (TEMAS[par[0]] || {}).n || "";
        }).join(" ");
        hijos.push({ e: e, li: lie,
                     texto: pelar([e.t, e.d || "", temas, m.n,
                                   (AREAS[m.area] || {}).n || ""].join(" ")) });
      });
      li.appendChild(ul);

      bt.addEventListener("click", function () {
        var abierto = bt.getAttribute("aria-expanded") === "true";
        bt.setAttribute("aria-expanded", abierto ? "false" : "true");
        ul.hidden = abierto;
      });

      lista.appendChild(li);
      filas.push({ mat: m, li: li, boton: bt, ul: ul, ejes: hijos, cuenta: cta });
    });

    col.appendChild(lista);
    grid.appendChild(col);
  });

  /* -------------------------------------------------------------- filtrado */
  var input = document.getElementById("btIn");
  var cuenta = document.getElementById("btCuenta");
  var limpiar = document.getElementById("btClear");
  var vacio = document.getElementById("sinResultados");

  function filtrar(q) {
    /* palabra por palabra: «fibra optica» tiene que encontrar «fibras opticas» */
    var pal = pelar(q.trim()).split(/\s+/).filter(Boolean);

    function coincide(t) {
      for (var i = 0; i < pal.length; i++) {
        if (t.indexOf(pal[i]) === -1) return false;
      }
      return true;
    }

    q = pal.length ? pal.join(" ") : "";
    var hallados = 0;

    filas.forEach(function (f) {
      var visibles = 0;

      f.ejes.forEach(function (h) {
        var ok = !q || coincide(h.texto);
        h.li.hidden = !ok;
        if (ok && q) visibles++;
      });

      if (!q) {
        f.li.hidden = false;
        f.ul.hidden = f.boton.getAttribute("aria-expanded") !== "true";
        f.cuenta.textContent = String(f.ejes.length);
        return;
      }
      /* con la busqueda puesta, el numerito cuenta lo que coincide */
      f.cuenta.textContent = visibles + " de " + f.ejes.length;
      f.li.hidden = visibles === 0;
      f.ul.hidden = visibles === 0;
      f.boton.setAttribute("aria-expanded", visibles ? "true" : "false");
      hallados += visibles;
    });

    /* una columna sin nada adentro no tiene por que ocupar lugar */
    [].forEach.call(grid.children, function (col) {
      var quedan = [].filter.call(col.querySelectorAll(".m-item"), function (li) {
        return !li.hidden;
      }).length;
      col.hidden = !!q && quedan === 0;
    });

    if (limpiar) limpiar.hidden = !q;
    if (vacio) vacio.hidden = !(q && hallados === 0);
    if (cuenta) {
      cuenta.textContent = !q ? ""
        : hallados === 1 ? "1 eje temático" : hallados + " ejes temáticos";
    }
  }

  if (input) {
    input.addEventListener("input", function () { filtrar(input.value); });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { input.value = ""; filtrar(""); }
    });
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
