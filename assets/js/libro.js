/* ══════════════════════════════════════════════════════════════════
   catto.ar — Texto largo compuesto como un libro
   ------------------------------------------------------------------
   Toma cualquier bloque marcado con data-libro y lo reemplaza por un
   libro que se hojea. El bloque original queda en el HTML, escondido:
   así lo sigue leyendo un buscador, funciona sin javascript, y el botón
   "texto corrido" lo devuelve cuando alguien necesita buscar con Ctrl+F.

     <section class="texto" data-libro
              data-libro-titulo="Cómo se usa el banco"
              data-libro-autor="Simulador de instrumental · catto.ar">
       <h3>…</h3><p>…</p>
     </section>

   Sin data-libro-titulo toma el primer <h2> del bloque. Con
   data-libro-numerar="no" no numera los subtítulos. Con
   data-libro-desarmar, el libro saca el contenido de las tarjetas
   (<article>) y reparte las listas de a un renglón; el texto corrido
   conserva las tarjetas (así se usa en los Mapas de Temas).

   Los estilos van en assets/css/libro.css.
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var DURA   = 900;     /* lo que tarda una vuelta */
var BAJO   = 0.5;     /* desde qué altura de la página una sección que no entra entera
                         pasa completa a la siguiente (0,5 = en la mitad de abajo) */
var ASOMO  = 0;      /* a qué distancia del borde se insinúa sola la hoja; 0 = no se
                         insinúa: la hoja espera a que la agarren y la arrastren */

function nodo(tag, clase){
  var n = document.createElement(tag);
  if(clase) n.className = clase;
  return n;
}
function entre(v, a, b){ return v < a ? a : (v > b ? b : v); }
/* arranca despacio, toma velocidad y se apoya al final */
function suave(t){ return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
/* El navegador no da cuadros de animación mientras la pestaña está en
   segundo plano. Con el reloj común de reserva, una vuelta empezada no
   queda colgada si alguien se va a otra pestaña en el medio. */
function proximoCuadro(fn){
  if(document.hidden){ setTimeout(fn, 16); return; }
  /* y si el navegador frena los cuadros sin avisar (pasa en paneles
     incrustados y ventanas tapadas), el reloj lo dispara igual */
  var hecho = false;
  function una(){ if(!hecho){ hecho = true; fn(); } }
  requestAnimationFrame(una);
  setTimeout(una, 120);
}

function armarLibro(origen){
  /* ── el mueble ──────────────────────────────────────────────── */
  var caja  = nodo("div", "lb-caja");
  var libro = nodo("div", "lb-libro");
  var pagIzq = nodo("div", "lb-pag lb-izq");
  var pagDer = nodo("div", "lb-pag lb-der");
  var cantoIzq = nodo("div", "lb-canto lb-izq");
  var cantoDer = nodo("div", "lb-canto lb-der");
  var zonaIzq = nodo("button", "lb-zona lb-izq");
  var zonaDer = nodo("button", "lb-zona lb-der");
  zonaIzq.type = zonaDer.type = "button";
  zonaIzq.setAttribute("aria-label", "Página anterior");
  zonaDer.setAttribute("aria-label", "Página siguiente");
  libro.appendChild(nodo("div", "lb-tapa"));
  libro.appendChild(cantoIzq);
  libro.appendChild(cantoDer);
  libro.appendChild(pagIzq);
  libro.appendChild(pagDer);
  libro.appendChild(nodo("div", "lb-lomo"));
  /* La hoja levantada puede salirse del libro por arriba y por abajo.
     Vive dentro de este marco, que recorta lo que se va más lejos: sin
     él, cada cuadro cambiaba el tamaño de la página y las barras de
     desplazamiento aparecían y desaparecían. */
  var aire = nodo("div", "lb-aire");
  libro.appendChild(aire);
  libro.appendChild(zonaIzq);
  libro.appendChild(zonaDer);

  var mando = nodo("div", "lb-mando");
  var btAnt = nodo("button", "lb-ant"), btSig = nodo("button", "lb-sig");
  var cuenta = nodo("span", "lb-cuenta"), btCorrido = nodo("button", "lb-corrido");
  btAnt.type = btSig.type = btCorrido.type = "button";
  btAnt.textContent = "‹ Anterior";
  btSig.textContent = "Siguiente ›";
  btCorrido.textContent = "Ver como texto corrido";
  cuenta.textContent = "—";
  btAnt.disabled = btSig.disabled = true;   /* hasta que el libro se arme */
  mando.appendChild(btAnt); mando.appendChild(cuenta);
  mando.appendChild(btSig); mando.appendChild(btCorrido);

  /* Con data-libro-hojas cada hijo del bloque es una página entera (la
     página de un PDF, por ejemplo): no se reparte texto, no lleva folio
     ni portada, y no hay texto corrido que mostrar. */
  var hojas = origen.hasAttribute("data-libro-hojas");
  if(hojas){ caja.className += " lb-modo-hojas"; btCorrido.hidden = true; }

  caja.appendChild(libro);
  caja.appendChild(mando);
  origen.parentNode.insertBefore(caja, origen);
  origen.hidden = true;

  /* ── el texto de origen ─────────────────────────────────────── */
  var fuente = nodo("div", "lb-fuente");
  var bloques = Array.prototype.slice.call(origen.children);
  var titulo = origen.getAttribute("data-libro-titulo") || "";
  /* El título del bloque se usa como portada y sale del cuerpo: si no,
     aparecería dos veces en la primera página. */
  if(bloques.length && bloques[0].tagName === "H2"){
    if(!titulo) titulo = bloques[0].textContent.trim();
    bloques.shift();
  }
  bloques.forEach(function(b){ fuente.appendChild(b.cloneNode(true)); });
  /* Con data-libro-desarmar, la copia del libro saca el contenido de las
     tarjetas (<article>) y parte cada lista en listas de un renglón. Así
     se reparte de a un renglón y no quedan páginas a medio llenar. El
     original no se toca: el texto corrido conserva sus tarjetas. */
  if(origen.hasAttribute("data-libro-desarmar")){
    Array.prototype.slice.call(fuente.querySelectorAll("article")).forEach(function(a){
      /* los párrafos que siguen al título de la tarjeta, antes de la
         lista, son su ficha: van pegados al título */
      var el = a.firstElementChild;
      if(el && esTitulo(el)){
        el = el.nextElementSibling;
        while(el && el.tagName === "P"){ el.classList.add("lb-cabeza"); el = el.nextElementSibling; }
      }
      while(a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
      a.parentNode.removeChild(a);
    });
    Array.prototype.slice.call(fuente.children).forEach(function(el){
      if(el.tagName !== "UL" || el.children.length < 2) return;
      Array.prototype.slice.call(el.children).forEach(function(li){
        var u = el.cloneNode(false);
        u.appendChild(li);
        el.parentNode.insertBefore(u, el);
      });
      el.parentNode.removeChild(el);
    });
  }

  if(titulo){
    var portada = nodo("div", "lb-titulo");
    var h = nodo("h2"); h.textContent = titulo;
    portada.appendChild(h);
    portada.appendChild(nodo("div", "lb-filete"));
    var autor = origen.getAttribute("data-libro-autor");
    if(autor){ var p = nodo("p"); p.textContent = autor; portada.appendChild(p); }
    fuente.insertBefore(portada, fuente.firstChild);
  }
  if(origen.getAttribute("data-libro-numerar") !== "no"){
    var k = 0;
    Array.prototype.forEach.call(fuente.querySelectorAll("h3"), function(h3){
      k++;
      var num = nodo("span", "lb-num");
      num.textContent = k + ".";
      h3.insertBefore(num, h3.firstChild);
    });
  }

  /* ── estado ─────────────────────────────────────────────────── */
  var PAGINAS = [];
  var vueltas = 0, modoSola = false, animando = false, arrastre = null;
  var ultimoSoltar = 0, anchoAntes = window.innerWidth, reloj = null;

  function unaSola(){ return window.matchMedia("(max-width:820px)").matches; }

  /* ── Repartir el texto en páginas ─────────────────────────────
     Se arma una página de prueba con la medida exacta de la real y se
     le van metiendo bloques hasta que rebalsa. Los párrafos se parten
     por la palabra justa, como en cualquier libro: cortando por bloques
     enteros quedaba media página en blanco cada vez que venía un
     subtítulo. */
  function nodosTexto(el){
    var out = [];
    (function rec(n){
      var c = n.firstChild;
      while(c){
        if(c.nodeType === 3) out.push(c);
        else if(c.nodeType === 1) rec(c);
        c = c.nextSibling;
      }
    })(el);
    return out;
  }
  function palabras(s){
    var a = s.split(/\s+/), r = [], i;
    for(i = 0; i < a.length; i++) if(a[i] !== "") r.push(a[i]);
    return r;
  }
  function contarPalabras(el){
    var t = nodosTexto(el), n = 0, i;
    for(i = 0; i < t.length; i++) n += palabras(t[i].data).length;
    return n;
  }
  /* Deja en el párrafo sólo las palabras del tramo pedido, respetando
     las negritas: se recorta cada nodo de texto por separado y se sacan
     los que quedaron vacíos. */
  function recortar(el, desde, hasta){
    var t = nodosTexto(el), i, j, c = 0;
    for(i = 0; i < t.length; i++){
      var ws = palabras(t[i].data), quedan = [];
      for(j = 0; j < ws.length; j++){
        if(c >= desde && c < hasta) quedan.push(ws[j]);
        c++;
      }
      if(!quedan.length){ t[i].data = ""; continue; }
      var pre  = /^\s/.test(t[i].data) ? " " : "";
      var post = /\s$/.test(t[i].data) ? " " : "";
      t[i].data = pre + quedan.join(" ") + post;
    }
    var dentro = el.querySelectorAll("*");
    for(i = dentro.length - 1; i >= 0; i--)
      if(!dentro[i].textContent.trim() && dentro[i].parentNode)
        dentro[i].parentNode.removeChild(dentro[i]);
    return el;
  }
  function cuantasEntran(parrafo, total, hueco, alto){
    var lo = 1, hi = total - 1, mejor = 0;
    while(lo <= hi){
      var mid = (lo + hi) >> 1;
      var prueba = parrafo.cloneNode(true);
      recortar(prueba, 0, mid);
      hueco.appendChild(prueba);
      var entra = hueco.scrollHeight <= alto;
      hueco.removeChild(prueba);
      if(entra){ mejor = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return mejor;
  }
  /* Los párrafos se cortan por palabras. Una fórmula o una tabla se mudan
     enteras. Y una lista o un recuadro que no entran ni en una página
     vacía se parten por sus renglones, que es lo único sensato. */
  function sePuedePartir(el){
    return el.tagName === "P" && !encabeza(el) && !el.querySelector("img,svg,table,math");
  }
  function esTitulo(el){ return /^H[234]$/.test(el.tagName); }
  function encabeza(el){ return esTitulo(el) || el.classList.contains("lb-cabeza"); }
  function recortarHijos(el, desde, hasta){
    var hijos = Array.prototype.slice.call(el.children), i;
    for(i = hijos.length - 1; i >= 0; i--)
      if(i < desde || i >= hasta) el.removeChild(hijos[i]);
    return el;
  }
  /* Cuántas palabras del primer renglón entran, con el contenedor puesto.
     Hace falta cuando un solo renglón de la lista es más alto que la
     página: partir por renglones no alcanza y el texto quedaba cortado. */
  function cuantasEntranEnElPrimero(el, total, hueco, alto){
    var lo = 1, hi = total - 1, mejor = 0;
    while(lo <= hi){
      var mid = (lo + hi) >> 1;
      var prueba = recortarHijos(el.cloneNode(true), 0, 1);
      recortar(prueba.children[0], 0, mid);
      hueco.appendChild(prueba);
      var entra = hueco.scrollHeight <= alto;
      hueco.removeChild(prueba);
      if(entra){ mejor = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return mejor;
  }
  function cuantosHijosEntran(el, hueco, alto){
    var n = el.children.length, lo = 1, hi = n - 1, mejor = 0;
    while(lo <= hi){
      var mid = (lo + hi) >> 1;
      var prueba = el.cloneNode(true);
      recortarHijos(prueba, 0, mid);
      hueco.appendChild(prueba);
      var entra = hueco.scrollHeight <= alto;
      hueco.removeChild(prueba);
      if(entra){ mejor = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return mejor;
  }

  function repartir(){
    if(hojas){
      PAGINAS = Array.prototype.map.call(fuente.children, function(c){ return [c.cloneNode(true)]; });
      return;
    }
    var molde = nodo("div", "lb-pag lb-der");
    molde.style.visibility = "hidden";
    molde.innerHTML = '<div class="lb-papel"><div class="lb-hueco"></div></div>';
    libro.appendChild(molde);
    var hueco = molde.querySelector(".lb-hueco");
    var alto = hueco.clientHeight;

    var paginas = [], actual = [];
    /* Un subtítulo solo al pie queda huérfano, así que se va con su texto
       a la página siguiente. Se hace al cerrar y no después: moviendo el
       subtítulo con la página ya armada, la de destino rebalsaba y el
       texto de abajo quedaba cortado. */
    /* Lo que encabeza —un título, o lo que va pegado a él, como la ficha
       de una materia— se va entero: si al pie quedan título y ficha sin
       nada debajo, pasan los dos a la página siguiente y abajo queda el
       espacio en blanco. */
    function cerrar(arrastrarTitulo){
      if(!actual.length) return;
      var colgados = [];
      if(arrastrarTitulo){
        var n = actual.length;
        while(n > 0 && encabeza(actual[n - 1])) n--;
        if(n > 0) colgados = actual.splice(n);
      }
      paginas.push(actual);
      actual = [];
      hueco.innerHTML = "";
      colgados.forEach(function(c){ hueco.appendChild(c); actual.push(c); });
    }

    /* A qué altura de la página empezaría el título si se pone ahora,
       con su margen de arriba incluido. */
    function arrancaria(titulo){
      var t = hueco.appendChild(titulo.cloneNode(true));
      var y = t.getBoundingClientRect().top - hueco.getBoundingClientRect().top;
      hueco.removeChild(t);
      return y;
    }

    var hijos = Array.prototype.slice.call(fuente.children);
    hijos.forEach(function(b, i){
      /* Una sección que empieza en la parte baja de la página y no entra
         entera en lo que queda pasa completa a la siguiente: abajo queda
         el espacio en blanco y la sección arranca arriba. Si empieza más
         arriba, se parte como siempre, para no dejar media página vacía. */
      if(esTitulo(b) && actual.length && arrancaria(b) > alto * BAJO){
        var seccion = [b];
        for(var j = i + 1; j < hijos.length && !esTitulo(hijos[j]); j++) seccion.push(hijos[j]);
        var prueba = seccion.map(function(x){ return hueco.appendChild(x.cloneNode(true)); });
        var entra = hueco.scrollHeight <= alto;
        prueba.forEach(function(x){ hueco.removeChild(x); });
        if(!entra) cerrar(true);
      }
      var pendiente = b.cloneNode(true), giros = 0;
      while(pendiente && giros++ < 40){
        hueco.appendChild(pendiente);
        if(hueco.scrollHeight <= alto){ actual.push(pendiente); pendiente = null; break; }
        hueco.removeChild(pendiente);

        if(sePuedePartir(pendiente)){
          var total = contarPalabras(pendiente);
          var corte = cuantasEntran(pendiente, total, hueco, alto);
          /* Una viuda de tres palabras al empezar la página queda fea, pero
             mandar el párrafo entero por eso deja media página en blanco.
             Se baja el corte hasta que abajo queden seis palabras. */
          if(corte > total - 6) corte = total - 6;
          if(corte >= 6){
            var cabeza = pendiente.cloneNode(true); recortar(cabeza, 0, corte);
            var cola   = pendiente.cloneNode(true); recortar(cola, corte, total);
            cola.className = (cola.className ? cola.className + " " : "") + "lb-sigue";
            hueco.appendChild(cabeza);
            actual.push(cabeza);
            cerrar(false);
            pendiente = cola;
            continue;
          }
        }
        /* Si en la página no hay más que el subtítulo, abrir otra la dejaría
           con el título solo y el texto recién en la de al lado. En ese caso
           el bloque se parte acá mismo, aunque entrara entero en la
           siguiente. */
        var soloTitulos = actual.length > 0 && actual.every(encabeza);
        if(actual.length && !soloTitulos){
          /* Viuda: si de la sección queda un solo renglón de lista para la
             página siguiente, se lleva también el anterior, para que la
             página no arranque con un renglón suelto. */
          var viuda = null, quedan = 0;
          for(var q = i; q < hijos.length && (q === i || !esTitulo(hijos[q])); q++) quedan++;
          if(quedan === 1 && pendiente.tagName === "UL" && actual.length > 1 &&
             actual[actual.length - 1].tagName === "UL") viuda = actual.pop();
          cerrar(true);
          if(viuda){ hueco.appendChild(viuda); actual.push(viuda); }
          continue;
        }

        /* Si tiene renglones propios —una lista, un recuadro— se parte
           por ahí. Y si ni el primer renglón entra, se lo parte por
           palabras dejando el resto de los renglones para después. */
        if(pendiente.children.length >= 1){
          var cuantos = pendiente.children.length >= 2
                      ? cuantosHijosEntran(pendiente, hueco, alto) : 0;
          if(cuantos === 0 && !pendiente.querySelector("img,svg,table,math")){
            var totalR = contarPalabras(pendiente.children[0]);
            var corteR = totalR > 12 ? cuantasEntranEnElPrimero(pendiente, totalR, hueco, alto) : 0;
            if(corteR > totalR - 6) corteR = totalR - 6;
            if(corteR >= 6){
              var cabezaR = recortarHijos(pendiente.cloneNode(true), 0, 1);
              recortar(cabezaR.children[0], 0, corteR);
              var colaR = pendiente.cloneNode(true);
              recortar(colaR.children[0], corteR, totalR);
              colaR.className = (colaR.className ? colaR.className + " " : "") + "lb-sigue";
              hueco.appendChild(cabezaR);
              actual.push(cabezaR);
              cerrar(false);
              pendiente = colaR;
              continue;
            }
          }
          if(cuantos >= 1 && cuantos < pendiente.children.length){
            var arriba = recortarHijos(pendiente.cloneNode(true), 0, cuantos);
            var abajo  = recortarHijos(pendiente.cloneNode(true), cuantos,
                                       pendiente.children.length);
            abajo.className = (abajo.className ? abajo.className + " " : "") + "lb-sigue";
            if(abajo.tagName === "OL")
              abajo.setAttribute("start", (parseInt(pendiente.getAttribute("start") || 1, 10)) + cuantos);
            hueco.appendChild(arriba);
            actual.push(arriba);
            cerrar(false);
            pendiente = abajo;
            continue;
          }
        }
        /* no se pudo partir: la página del título solo es peor que nada,
           pero cortar el texto lo es más */
        if(actual.length){ cerrar(false); continue; }
        hueco.appendChild(pendiente);              /* último recurso: se deja igual */
        actual.push(pendiente);
        pendiente = null;
      }
    });
    cerrar(false);

    libro.removeChild(molde);
    PAGINAS = paginas;
  }

  /* ── Las páginas a la vista ───────────────────────────────────
     En el documento hay dos páginas y nada más: la de la izquierda y la
     de la derecha. Las demás existen solo como lista (PAGINAS) y se
     dibujan cuando les toca. Un libro de cincuenta páginas pesa lo mismo
     que uno de cuatro. */
  function lamina(indice){
    var l = nodo("div", "lb-papel " + (modoSola ? "lb-sola" : (indice % 2 === 0 ? "lb-izq" : "lb-der")));
    if(indice < 0 || !PAGINAS[indice]) return l;       /* guarda en blanco */
    var h = nodo("div", "lb-hueco");
    h.lang = document.documentElement.lang || "es";
    PAGINAS[indice].forEach(function(n){ h.appendChild(n.cloneNode(true)); });
    l.appendChild(h);
    var folio = nodo("div", "lb-folio");
    folio.textContent = indice + 1;
    l.appendChild(folio);
    return l;
  }
  function poner(pag, indice){
    pag.innerHTML = "";
    pag.appendChild(lamina(indice));
  }
  /* Con el libro en `vueltas`, a la izquierda queda la página 2·vueltas
     y a la derecha la siguiente. Con una sola página a la vista, vueltas
     es directamente la página. */
  function pintarPaginas(){
    if(modoSola){ pagIzq.innerHTML = ""; poner(pagDer, vueltas); }
    else{ poner(pagIzq, vueltas * 2); poner(pagDer, vueltas * 2 + 1); }
    pintarCantos();
  }
  /* El canto: cuántas hojas quedan de cada lado, como en un libro apoyado. */
  function pintarCantos(){
    var tope = topeVueltas(), f = tope ? vueltas / tope : 0;
    cantoIzq.style.width = (modoSola ? 0 : 1 + 6 * f).toFixed(1) + "px";
    cantoDer.style.width = (modoSola ? 0 : 1 + 6 * (1 - f)).toFixed(1) + "px";
  }

  function armar(){
    quitarViva();
    modoSola = unaSola();
    vueltas = entre(vueltas, 0, topeVueltas());
    pintarPaginas();
    pintarMando();
  }

  /* Hasta dónde se puede pasar: mientras haya una página para dejar a la
     izquierda. */
  function topeVueltas(){
    var n = PAGINAS.length;
    if(!n) return 0;
    return modoSola ? n - 1 : Math.floor((n - 1) / 2);
  }

  function pintarMando(){
    var total = PAGINAS.length, texto;
    if(!total){ cuenta.textContent = "—"; btAnt.disabled = btSig.disabled = true; return; }
    if(modoSola){
      texto = "Página " + Math.min(vueltas + 1, total) + " de " + total;
    }else{
      var izq = vueltas * 2 + 1, der = izq + 1;   /* folios, no índices */
      if(der <= total) texto = "Páginas " + izq + " y " + der + " de " + total;
      else texto = "Página " + Math.min(izq, total) + " de " + total;
    }
    cuenta.textContent = texto;
    var hayAnt = vueltas > 0, haySig = vueltas < topeVueltas();
    btAnt.disabled = zonaIzq.disabled = !hayAnt;
    btSig.disabled = zonaDer.disabled = !haySig;
  }

  /* ── La hoja que se pliega ────────────────────────────────────
     Una hoja de papel agarrada de una esquina se dobla por una recta: la
     mediatriz entre el lugar donde estaba la esquina y el lugar adonde se
     la llevó. De un lado de esa recta la hoja sigue apoyada; del otro se
     levantó, y lo que se ve es su dorso, que cae espejado sobre la parte
     apoyada. Con eso alcanza: son tres recortes y un giro, todo plano, y
     la esquina queda siempre debajo del cursor.

     La hoja se puede agarrar de una esquina o de cualquier punto del
     borde suelto. Del medio del borde, el doblez sale paralelo al lomo y
     la hoja pasa derecha; de una esquina sale en diagonal.

     Las cuentas se hacen en un sistema normalizado: el lomo en x = 0, la
     hoja que gira a la derecha, de 0 a w, y el punto agarrado sobre el
     borde suelto, en (w, gy), de la mitad de la hoja para abajo. Para la
     hoja izquierda, o para la mitad de arriba, el
     contenedor entero va espejado (`dir`, `esq`) y cada lámina de texto
     se espeja de nuevo por dentro, así que se lee derecha.

       fija     la parte de la hoja que sigue apoyada
       revela   la sombra sobre la página que queda al descubierto
       solapa   el dorso, girado, con su sombreado de papel curvo         */
  var viva = null;          /* la hoja en movimiento, si hay una */
  var cuadroPedido = false;

  function crearViva(dir, esq, gy){
    var c = libro.getBoundingClientRect();
    var v = vueltas;
    var pFija   = dir > 0 ? 2 * v + 1 : 2 * v;
    var pSolapa = dir > 0 ? 2 * v + 2 : 2 * v - 1;
    var pDebajo = dir > 0 ? 2 * v + 3 : 2 * v - 2;
    var espejo = "scale(" + dir + "," + esq + ")";

    var cont = nodo("div", "lb-viva");
    cont.style.transform = espejo;
    function capa(clase, indice){
      var d = nodo("div", clase);
      if(indice !== null){
        var l = lamina(indice);
        l.style.transform = espejo;
        d.appendChild(l);
      }
      return d;
    }
    var revela = capa("lb-revela", null);
    var bandaR = nodo("div", "lb-banda lb-bandaR");
    revela.appendChild(bandaR);
    var fija = capa("lb-fija", pFija);
    var sombra = nodo("div", "lb-solapaSombra");
    var solapa = capa("lb-solapa", pSolapa);
    var bandaS = nodo("div", "lb-banda lb-bandaS");
    solapa.appendChild(bandaS);
    sombra.appendChild(solapa);
    cont.appendChild(revela);
    cont.appendChild(fija);
    cont.appendChild(sombra);

    /* debajo de la hoja que se levanta ya está la página que sigue */
    poner(dir > 0 ? pagDer : pagIzq, pDebajo);
    aire.appendChild(cont);

    var w = c.width / 2, h = c.height;
    if(gy === undefined) gy = h;
    var V = {nodo:cont, fija:fija, revela:revela, solapa:solapa, sombra:sombra,
             bandaR:bandaR, bandaS:bandaS, dir:dir, esq:esq, w:w, h:h, gy:gy,
             lomoX:c.left + w, top:c.top, bottom:c.bottom,
             P:{x:w, y:gy}, meta:{x:w, y:gy}, modo:"asomo", tween:null};
    /* Se pinta ya, en reposo: recién creada, la solapa está sin recortar y
       sin girar, y hasta el primer cuadro tapaba la hoja con su dorso. */
    pintarViva(V);
    return V;
  }
  /* A qué altura del borde se agarra. Cerca de la punta se toma la
     esquina misma, que es lo que uno busca cuando apunta ahí. */
  function alturaDeAgarre(c, ev, esq){
    var y = esq > 0 ? ev.clientY - c.top : c.bottom - ev.clientY;
    return y > c.height * 0.84 ? c.height : entre(y, c.height / 2, c.height);
  }

  function quitarViva(){
    if(!viva) return;
    if(viva.nodo.parentNode) viva.nodo.parentNode.removeChild(viva.nodo);
    viva = null;
    libro.classList.remove("lb-agarrando");
  }

  /* del cursor al sistema normalizado de la hoja viva */
  function aHoja(V, ev){
    return {x: V.dir * (ev.clientX - V.lomoX),
            y: V.esq > 0 ? ev.clientY - V.top : V.bottom - ev.clientY};
  }

  /* El papel no se estira: el punto agarrado no puede quedar más lejos
     del pie ni de la cabeza del lomo de lo que estaba con la hoja
     apoyada. */
  function sujetar(V, P){
    var w = V.w, h = V.h, d;
    var rPie = Math.sqrt(w * w + (h - V.gy) * (h - V.gy));
    var rCab = Math.sqrt(w * w + V.gy * V.gy);
    d = Math.sqrt(P.x * P.x + (P.y - h) * (P.y - h));
    if(d > rPie){ P.x = P.x * rPie / d; P.y = h + (P.y - h) * rPie / d; }
    d = Math.sqrt(P.x * P.x + P.y * P.y);
    if(d > rCab){ P.x = P.x * rCab / d; P.y = P.y * rCab / d; }
    return P;
  }

  /* la parte de un polígono que queda de un lado de la recta */
  function recortarPoligono(pts, mx, my, nx, ny, lado){
    var out = [], i, n = pts.length;
    for(i = 0; i < n; i++){
      var a = pts[i], b = pts[(i + 1) % n];
      var da = ((a[0] - mx) * nx + (a[1] - my) * ny) * lado;
      var db = ((b[0] - mx) * nx + (b[1] - my) * ny) * lado;
      if(da >= 0) out.push(a);
      if((da > 0 && db < 0) || (da < 0 && db > 0)){
        var t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  function poligono(pts){
    if(pts.length < 3) return "polygon(0 0,0 0,0 0)";
    return "polygon(" + pts.map(function(p){
      return p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px";
    }).join(",") + ")";
  }
  function banda(el, x, y, nx, ny, ancho, largo, opacidad){
    el.style.width = ancho.toFixed(1) + "px";
    el.style.height = largo.toFixed(0) + "px";
    el.style.opacity = opacidad.toFixed(3);
    el.style.transform = "translate(" + x.toFixed(1) + "px," + (y - largo / 2).toFixed(1) + "px) rotate("
                       + Math.atan2(ny, nx).toFixed(4) + "rad)";
  }

  function pintarViva(V){
    var w = V.w, h = V.h, P = sujetar(V, V.P);
    var dx = w - P.x, dy = V.gy - P.y, d = Math.sqrt(dx * dx + dy * dy);
    if(d < 0.6){
      V.fija.style.clipPath = "none";
      V.revela.style.visibility = V.sombra.style.visibility = "hidden";
      return;
    }
    V.revela.style.visibility = V.sombra.style.visibility = "";
    var nx = dx / d, ny = dy / d, mx = (w + P.x) / 2, my = (V.gy + P.y) / 2;
    var hoja = [[0,0],[w,0],[w,h],[0,h]];
    var apoyada   = recortarPoligono(hoja, mx, my, nx, ny, -1);
    var levantada = recortarPoligono(hoja, mx, my, nx, ny, 1);
    V.fija.style.clipPath = poligono(apoyada);
    V.revela.style.clipPath = poligono(levantada);

    /* el dorso: la hoja reflejada en la recta del pliegue. Reflejar dos
       veces (la hoja contra su dorso, y el pliegue) es un giro, así que
       el texto del dorso no sale espejado. */
    function refl(x, y){ var t = (x - mx) * nx + (y - my) * ny; return [x - 2 * t * nx, y - 2 * t * ny]; }
    var o = refl(w, 0), pie = refl(0, h), punta = refl(w, h);
    var ang = Math.atan2(pie[1] - punta[1], pie[0] - punta[0]);
    V.solapa.style.transform = "translate(" + o[0].toFixed(1) + "px," + o[1].toFixed(1) + "px) rotate(" + ang.toFixed(4) + "rad)";
    V.solapa.style.clipPath = poligono(levantada.map(function(q){ return [w - q[0], q[1]]; }));

    /* Sombras. Crecen con la vuelta y se apagan cuando la hoja se apoya
       del otro lado, que ahí ya es una página plana más. */
    var avance = entre((w - P.x) / (2 * w), 0, 1);
    /* y arrancan desde cero: con la hoja apenas despegada no hay sombra
       que aparezca de golpe */
    var fuerza = entre(Math.sin(Math.PI * avance) * 1.3 + 0.3, 0, 1)
               * entre(avance * 12, 0, 1) * entre((1 - avance) * 9, 0, 1);
    var largo = 2 * (w + h), medio = 0;
    levantada.forEach(function(q){ medio = Math.max(medio, (q[0] - mx) * nx + (q[1] - my) * ny); });
    banda(V.bandaS, w - mx, my, -nx, ny, medio, largo, fuerza);
    banda(V.bandaR, mx, my, nx, ny, Math.min(medio, 0.5 * w), largo, fuerza);
    V.sombra.style.filter = "drop-shadow(0 0 " + (6 + 16 * fuerza).toFixed(1) + "px rgba(20,14,8," + (0.5 * fuerza).toFixed(3) + "))";
  }

  /* ── El movimiento ────────────────────────────────────────────
     Mientras se arrastra, la esquina persigue al cursor con un poco de
     retraso, que es lo que le da peso. Al soltar, o al pasar la hoja con
     un botón, viaja sola hasta el destino. */
  function reducido(){
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  }
  function pedirCuadro(){
    if(cuadroPedido) return;
    cuadroPedido = true;
    proximoCuadro(cuadro);
  }
  function cuadro(){
    cuadroPedido = false;
    var V = viva;
    if(!V) return;
    if(V.tween){
      var T = V.tween, ahora = (window.performance ? performance.now() : Date.now());
      var p = T.ms <= 0 ? 1 : Math.min(1, (ahora - T.t0) / T.ms), e = suave(p);
      if(T.arco){
        /* vuelta entera desde el reposo: la esquina describe un arco bajo */
        V.P.x = V.w * Math.cos(Math.PI * e);
        V.P.y = V.gy - T.alza * Math.sin(Math.PI * e);
      }else{
        V.P.x = T.x0 + (T.x1 - T.x0) * e;
        V.P.y = T.y0 + (T.y1 - T.y0) * e - T.alza * Math.sin(Math.PI * e);
      }
      pintarViva(V);
      if(p < 1){ pedirCuadro(); return; }
      V.tween = null;
      T.fin();
      return;
    }
    var k = V.modo === "arrastre" ? 0.26 : 0.07;
    var ex = V.meta.x - V.P.x, ey = V.meta.y - V.P.y;
    V.P.x += ex * k; V.P.y += ey * k;
    pintarViva(V);
    if(Math.abs(ex) + Math.abs(ey) > 0.4) pedirCuadro();
  }
  function viajar(V, x1, y1, ms, arco, fin){
    var largo = Math.abs(x1 - V.P.x) / V.w;
    V.tween = {x0:V.P.x, y0:V.P.y, x1:x1, y1:y1, arco:arco, fin:fin,
               /* de la esquina, la hoja sube un poco en el camino; del
                  medio del borde va derecha */
               alza: V.gy < V.h ? 0 : (arco ? 0.3 * V.w : 0.08 * V.w * Math.min(1, largo)),
               ms: reducido() ? 0 : ms,
               t0: (window.performance ? performance.now() : Date.now())};
    pedirCuadro();
  }

  /* la hoja llegó al otro lado, o volvió a su lugar */
  function terminar(V, pasa){
    if(viva === V) quitarViva();
    if(pasa) vueltas += V.dir;
    animando = false;
    pintarPaginas();
    pintarMando();
  }

  /* ── Pasar una hoja de un saque ──────────────────────────────── */
  function pasar(d){
    if(animando || arrastre) return;
    if(d > 0 && vueltas >= topeVueltas()) return;
    if(d < 0 && vueltas <= 0) return;
    quitarViva();

    if(modoSola){
      vueltas += d;
      pintarPaginas();
      pintarMando();
      pagDer.classList.remove("lb-entraSig", "lb-entraAnt");
      void pagDer.offsetWidth;                 /* para que la animación arranque de nuevo */
      pagDer.classList.add(d > 0 ? "lb-entraSig" : "lb-entraAnt");
      return;
    }
    pintarPaginas();
    animando = true;
    var V = viva = crearViva(d, 1);
    V.modo = "sola";
    pintarViva(V);
    viajar(V, -V.w, V.gy, DURA, true, function(){ terminar(V, true); });
  }

  /* ── La esquina que se levanta sola ───────────────────────────
     Al acercar el cursor al borde suelto, la esquina más cercana se
     despega un poco y queda esperando que tiren de ella. */
  function bajarAsomo(){
    var V = viva;
    if(!V || V.modo !== "asomo" || V.tween) return;
    viajar(V, V.w, V.gy, 220, false, function(){ if(viva === V){ quitarViva(); pintarPaginas(); } });
  }

  function cuidarAsomo(ev){
    if(modoSola || animando || arrastre) return;
    if(ev.pointerType === "touch") return;
    var c = libro.getBoundingClientRect();
    var lomoX = c.left + c.width / 2;
    var dir = ev.clientX >= lomoX ? 1 : -1;
    var esq = ev.clientY >= c.top + c.height / 2 ? 1 : -1;
    var dist = dir > 0 ? (c.right - ev.clientX) : (ev.clientX - c.left);
    var hay = dir > 0 ? (vueltas < topeVueltas()) : (vueltas > 0);
    var dentro = ev.clientY >= c.top && ev.clientY <= c.bottom;

    if(ASOMO <= 0 || !hay || !dentro || dist > ASOMO || dist < 0){ bajarAsomo(); return; }
    if(viva && (viva.dir !== dir || viva.esq !== esq || viva.modo !== "asomo")){
      quitarViva(); pintarPaginas();
    }
    if(!viva) viva = crearViva(dir, esq, alturaDeAgarre(c, ev, esq));
    var V = viva;
    V.tween = null;
    /* la altura de agarre acompaña al cursor de a poco, sin saltar al
       pasar de la esquina al borde */
    V.gy += (alturaDeAgarre(c, ev, esq) - V.gy) * 0.25;
    /* hacia dónde se levanta: hacia el cursor, pero siempre para adentro.
       Del medio del borde se levanta derecho, sin torcerse. */
    var q = aHoja(V, ev);
    var ux = Math.min(q.x - V.w, -24), uy = V.gy < V.h ? 0 : (q.y - V.h) * 0.55;
    var um = Math.sqrt(ux * ux + uy * uy);
    var cerca = 1 - dist / ASOMO;
    /* apenas una insinuación, y creciendo desde cero: la hoja no tiene que
       saltar porque el cursor pasó cerca. Lo demás lo hace el arrastre. */
    var cuanto = V.w * 0.05 * cerca * cerca;
    V.meta.x = V.w + ux / um * cuanto;
    V.meta.y = V.gy + uy / um * cuanto;
    pedirCuadro();
  }

  /* ── Pasar la hoja con la mano ────────────────────────────────
     Se agarra el borde suelto a la altura del cursor —o la esquina, si
     está cerca— y desde ahí lo sigue. Al soltar, si cruzó el lomo se completa sola y si no vuelve a
     su lugar, que es lo que hace una hoja de papel. */
  function tomarHoja(ev){
    if(modoSola || animando || arrastre) return;
    if(ev.button !== undefined && ev.button !== 0) return;

    var c = libro.getBoundingClientRect();
    var dir = ev.clientX >= c.left + c.width / 2 ? 1 : -1;
    var esq = ev.clientY >= c.top + c.height / 2 ? 1 : -1;
    if(dir > 0 && vueltas >= topeVueltas()) return;
    if(dir < 0 && vueltas <= 0) return;

    /* Si la esquina ya estaba asomada, se sigue con esa misma hoja: así
       el papel no pega un salto entre el asomo y el arrastre. */
    if(viva && (viva.dir !== dir || viva.esq !== esq)){ quitarViva(); pintarPaginas(); }
    if(!viva) viva = crearViva(dir, esq, alturaDeAgarre(c, ev, esq));
    var V = viva;
    V.tween = null;
    V.modo = "arrastre";
    /* La hoja no salta hasta el cursor: arranca desde donde está y lo va
       alcanzando a medida que se arrastra. dx, dy es lo que le falta para
       estar debajo del cursor en el momento de agarrarla. */
    var q0 = aHoja(V, ev);
    arrastre = {V:V, x0:ev.clientX, y0:ev.clientY, corrido:0,
                dx:V.P.x - q0.x, dy:V.P.y - q0.y};
    libro.classList.add("lb-agarrando");
    escuchaVentana(true);
    try{ libro.setPointerCapture(ev.pointerId); }catch(e){}
    ev.preventDefault();
  }

  function moverHoja(ev){
    if(!arrastre) return;
    arrastre.corrido = Math.max(arrastre.corrido,
      Math.abs(ev.clientX - arrastre.x0) + Math.abs(ev.clientY - arrastre.y0));
    /* un toque no mueve la hoja: recién cuando el cursor se corrió */
    if(arrastre.corrido < 6) return;
    var q = aHoja(arrastre.V, ev);
    var falta = 1 - entre((arrastre.corrido - 6) / (0.45 * arrastre.V.w), 0, 1);
    falta = falta * falta * (3 - 2 * falta);
    arrastre.V.meta = {x:q.x + arrastre.dx * falta, y:q.y + arrastre.dy * falta};
    pedirCuadro();
  }

  function soltarHoja(){
    if(!arrastre) return;
    var a = arrastre, V = a.V;
    arrastre = null;
    ultimoSoltar = Date.now();
    escuchaVentana(false);
    libro.classList.remove("lb-agarrando");
    if(viva !== V) return;

    animando = true;
    /* un toque sin arrastrar pasa la hoja entera, como un clic de toda la vida */
    if(a.corrido < 6){
      var desdeReposo = Math.abs(V.P.x - V.w) + Math.abs(V.P.y - V.gy) < 2;
      V.modo = "sola";
      viajar(V, -V.w, V.gy, DURA, desdeReposo, function(){ terminar(V, true); });
      return;
    }
    var pasa = V.P.x < 0;                    /* la esquina cruzó el lomo */
    var x1 = pasa ? -V.w : V.w;
    var ms = Math.max(200, DURA * 0.75 * Math.abs(x1 - V.P.x) / (2 * V.w));
    V.modo = "sola";
    viajar(V, x1, V.gy, ms, false, function(){ terminar(V, pasa); });
  }

  /* ── enganches ──────────────────────────────────────────────── */
  libro.addEventListener("pointermove", cuidarAsomo);
  libro.addEventListener("pointerleave", function(){ if(!arrastre) bajarAsomo(); });
  libro.addEventListener("pointerdown", tomarHoja);
  /* El seguimiento va en la ventana y no en el libro, para que la hoja
     siga al cursor aunque se vaya afuera. Pero se engancha recién al
     agarrar y se suelta al terminar: dejarlo puesto haría que cada
     movimiento del ratón en toda la página pasara por acá. */
  function escuchaVentana(prender){
    var f = prender ? "addEventListener" : "removeEventListener";
    window[f]("pointermove", moverHoja);
    window[f]("pointerup", soltarHoja);
    window[f]("pointercancel", soltarHoja);
  }
  /* El clic que viene detrás de soltar ya está atendido por el arrastre:
     sin esto, la hoja se pasaría dos veces. */
  libro.addEventListener("click", function(ev){
    if(Date.now() - ultimoSoltar < 400){ ev.stopPropagation(); ev.preventDefault(); }
  }, true);

  zonaDer.addEventListener("click", function(){ pasar(1); });
  zonaIzq.addEventListener("click", function(){ pasar(-1); });
  btSig.addEventListener("click", function(){ pasar(1); });
  btAnt.addEventListener("click", function(){ pasar(-1); });
  caja.addEventListener("keydown", function(ev){
    if(ev.key === "ArrowRight"){ ev.preventDefault(); pasar(1); }
    else if(ev.key === "ArrowLeft"){ ev.preventDefault(); pasar(-1); }
  });

  btCorrido.addEventListener("click", function(){
    var alLibro = !origen.hidden;
    quitarViva();
    animando = false;
    origen.hidden = alLibro;
    libro.style.display = alLibro ? "" : "none";
    btAnt.hidden = btSig.hidden = cuenta.hidden = !alLibro;
    btCorrido.textContent = alLibro ? "Ver como texto corrido" : "Volver al libro";
    if(alLibro){ construir(); rehacer(); }
  });

  window.addEventListener("resize", function(){
    if(window.innerWidth === anchoAntes) return;
    anchoAntes = window.innerWidth;
    clearTimeout(reloj);
    reloj = setTimeout(rehacer, 220);
  });

  function rehacer(){
    if(!armado) return;
    if(libro.style.display === "none") return;   /* está mostrando el texto corrido */
    if(arrastre){ escuchaVentana(false); arrastre = null; }
    quitarViva();
    animando = false;
    var pagina = modoSola ? vueltas : vueltas * 2;
    repartir();
    vueltas = unaSola() ? pagina : Math.floor(pagina / 2);
    armar();
  }

  /* ── El libro se arma cuando asoma por la ventana ───────────────
     Repartir el texto en páginas es medir muchas veces: no tiene sentido
     hacerlo al cargar si el libro está tres pantallas más abajo. */
  var armado = false;

  function construir(){
    if(armado) return;
    armado = true;
    if(!PAGINAS.length) repartir();
    armar();
  }
  /* Se mira con la posición en pantalla además del observador, que no
     entrega nada mientras la pestaña está en segundo plano. */
  var relojVista = null;
  function mirarSiSeVe(){
    if(armado) return;
    var c = libro.getBoundingClientRect();
    if(c.bottom > -400 && c.top < window.innerHeight + 400) construir();
  }
  function vigilar(){
    if(armado || relojVista) return;
    relojVista = setTimeout(function(){ relojVista = null; mirarSiSeVe(); }, 150);
  }
  window.addEventListener("scroll", vigilar, {capture:true, passive:true});
  if(window.IntersectionObserver){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) construir(); });
    }, {rootMargin:"400px 0px"}).observe(libro);
  }
  mirarSiSeVe();

  /* La tipografía llega por la red y cambia el alto de los renglones:
     hay que repartir de nuevo cuando termina de cargar. */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(rehacer);
}

/* La tipografía del libro la trae el componente, para que enchufarlo en
   una página sea marcar el bloque y nada más. */
var CM = "https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/font/Serif/cmun-serif.css";
function traerTipografia(){
  if(document.querySelector('link[href="' + CM + '"]')) return;
  var l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = CM;
  document.head.appendChild(l);
}

function arrancar(){
  var marcados = document.querySelectorAll("[data-libro]");
  if(marcados.length) traerTipografia();
  Array.prototype.forEach.call(marcados, function(el){
    try{ armarLibro(el); }
    catch(e){ el.hidden = false; }   /* si algo falla, queda el texto corrido */
  });
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
else arrancar();

})();
