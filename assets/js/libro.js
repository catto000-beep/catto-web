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
   data-libro-numerar="no" no numera los subtítulos.

   Los estilos van en assets/css/libro.css.
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var TIRAS  = 16;      /* en cuántas franjas se parte la hoja que gira */
var CURVA  = 62;      /* cuánto se pliega el papel, en grados */
var CIERRE = 1.7;     /* cuánto se cierra el pliegue hacia el borde de afuera */
var DURA   = 1050;    /* lo que tarda una vuelta */
var ASOMO  = 130;     /* a qué distancia del borde se levanta sola la esquina */

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
  if(document.hidden) setTimeout(fn, 16);
  else requestAnimationFrame(fn);
}

function armarLibro(origen){
  /* ── el mueble ──────────────────────────────────────────────── */
  var caja  = nodo("div", "lb-caja");
  var libro = nodo("div", "lb-libro");
  var sueloIzq  = nodo("div", "lb-suelo lb-izq");
  var hojasCaja = nodo("div", "lb-hojas");
  var sombraIzq = nodo("div", "lb-sombraMesa lb-izq");
  var sombraDer = nodo("div", "lb-sombraMesa lb-der");
  var zonaIzq = nodo("button", "lb-zona lb-izq");
  var zonaDer = nodo("button", "lb-zona lb-der");
  zonaIzq.type = zonaDer.type = "button";
  zonaIzq.setAttribute("aria-label", "Página anterior");
  zonaDer.setAttribute("aria-label", "Página siguiente");
  libro.appendChild(nodo("div", "lb-tapa"));
  libro.appendChild(sueloIzq);
  libro.appendChild(nodo("div", "lb-suelo lb-der"));
  libro.appendChild(hojasCaja);
  libro.appendChild(sombraIzq);
  libro.appendChild(sombraDer);
  libro.appendChild(nodo("div", "lb-lomo"));
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
  mando.appendChild(btAnt); mando.appendChild(cuenta);
  mando.appendChild(btSig); mando.appendChild(btCorrido);

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
  var PAGINAS = [], HOJAS = [];
  var vueltas = 0, modoSola = false, animando = false;
  var arrastre = null, asomo = null, retirada = null;
  var cajaLibro = null, ultimoSoltar = 0, anchoAntes = window.innerWidth, reloj = null;

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
  /* sólo se parten los párrafos: una fórmula o un recuadro se mudan
     enteros a la página siguiente */
  function sePuedePartir(el){
    return el.tagName === "P" && !el.querySelector("img,svg,table,math");
  }

  function repartir(){
    var molde = nodo("div", "lb-hoja");
    molde.style.visibility = "hidden";
    molde.innerHTML = '<div class="lb-cara lb-frente"><div class="lb-hueco"></div></div>';
    hojasCaja.appendChild(molde);
    var hueco = molde.querySelector(".lb-hueco");
    var alto = hueco.clientHeight;

    var paginas = [], actual = [];
    function cerrar(){
      if(!actual.length) return;
      paginas.push(actual);
      actual = [];
      hueco.innerHTML = "";
    }

    Array.prototype.slice.call(fuente.children).forEach(function(b){
      var pendiente = b.cloneNode(true), giros = 0;
      while(pendiente && giros++ < 40){
        hueco.appendChild(pendiente);
        if(hueco.scrollHeight <= alto){ actual.push(pendiente); pendiente = null; break; }
        hueco.removeChild(pendiente);

        if(sePuedePartir(pendiente)){
          var total = contarPalabras(pendiente);
          var corte = cuantasEntran(pendiente, total, hueco, alto);
          /* no vale la pena partir por tres palabras: queda una viuda fea */
          if(corte >= 6 && total - corte >= 6){
            var cabeza = pendiente.cloneNode(true); recortar(cabeza, 0, corte);
            var cola   = pendiente.cloneNode(true); recortar(cola, corte, total);
            cola.className = (cola.className ? cola.className + " " : "") + "lb-sigue";
            hueco.appendChild(cabeza);
            actual.push(cabeza);
            cerrar();
            pendiente = cola;
            continue;
          }
        }
        if(actual.length){ cerrar(); continue; }   /* que lo intente en una página limpia */
        hueco.appendChild(pendiente);              /* no entra ni sola: se deja igual */
        actual.push(pendiente);
        pendiente = null;
      }
    });
    cerrar();

    /* un subtítulo solo al pie queda huérfano: se va con su texto */
    for(var i = 0; i < paginas.length - 1; i++){
      var ult = paginas[i][paginas[i].length - 1];
      if(ult && /^H[234]$/.test(ult.tagName) && paginas[i].length > 1){
        paginas[i].pop();
        paginas[i + 1].unshift(ult);
      }
    }

    hojasCaja.removeChild(molde);
    PAGINAS = paginas;
  }

  function huecoDe(indice){
    var h = nodo("div", "lb-hueco");
    h.lang = "es";
    if(PAGINAS[indice]) PAGINAS[indice].forEach(function(n){ h.appendChild(n.cloneNode(true)); });
    return h;
  }
  function armarCara(clase, indice){
    var cara = nodo("div", "lb-cara " + clase);
    if(!PAGINAS[indice]) return cara;
    cara.appendChild(huecoDe(indice));
    var folio = nodo("div", "lb-folio");
    folio.textContent = indice + 1;
    cara.appendChild(folio);
    return cara;
  }

  function armar(){
    quitarAsomoYa();
    hojasCaja.innerHTML = "";
    HOJAS = [];
    modoSola = unaSola();
    /* La primera página no está en ninguna hoja: queda fija a la
       izquierda y el libro abre mostrando la 1 y la 2. Las hojas se
       reparten de la 2 en adelante, cada una con su frente y su dorso.
       Con una sola página a la vista no hay dorso posible, así que ahí
       va una hoja por página: de la otra manera las pares no se verían
       nunca. */
    var n = modoSola ? PAGINAS.length : Math.ceil((PAGINAS.length - 1) / 2), k;
    for(k = 0; k < n; k++){
      var hoja = nodo("div", "lb-hoja");
      hoja.appendChild(armarCara("lb-frente", modoSola ? k : k * 2 + 1));
      if(!modoSola) hoja.appendChild(armarCara("lb-dorso", k * 2 + 2));
      hojasCaja.appendChild(hoja);
      HOJAS.push(hoja);
    }

    sueloIzq.innerHTML = "";
    if(!modoSola && PAGINAS.length){
      sueloIzq.appendChild(huecoDe(0));
      var folio = nodo("div", "lb-folio");
      folio.textContent = "1";
      sueloIzq.appendChild(folio);
    }

    vueltas = Math.min(vueltas, topeVueltas());
    ordenar();
    pintarMando();
  }

  /* La hoja de más adelante queda arriba de la pila derecha, y al revés
     del lado izquierdo, que es como se apilan en un libro. */
  function ordenar(){
    var n = HOJAS.length, i;
    for(i = 0; i < n; i++){
      if(i < vueltas){ HOJAS[i].classList.add("lb-vuelta"); HOJAS[i].style.zIndex = i + 1; }
      else           { HOJAS[i].classList.remove("lb-vuelta"); HOJAS[i].style.zIndex = n - i; }
    }
  }

  /* Hasta dónde se puede pasar. Si el dorso de la última hoja no tiene
     página —pasa cuando el texto termina en cara impar— esa vuelta no
     lleva a ninguna parte: dejaría una hoja en blanco a la izquierda. */
  function topeVueltas(){
    var n = HOJAS.length;
    if(modoSola) return Math.max(0, n - 1);
    return (2 * n <= PAGINAS.length - 1) ? n : Math.max(0, n - 1);
  }

  function pintarMando(){
    var total = PAGINAS.length, texto;
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

  /* ── La hoja en tiras ─────────────────────────────────────────
     Cada tira cuelga de la anterior y muestra su franja del texto por
     una ventana recortada. La del dorso va espejada y con el
     desplazamiento contado desde el otro borde, que es donde cae esa
     misma franja cuando la hoja queda del lado izquierdo. */
  function ventana(clase, pagina, dx, ancho, sombras){
    var v = nodo("div", "lb-ventana " + clase);
    var lamina = nodo("div", "lb-lamina lb-cara");
    lamina.style.width = ancho + "px";
    lamina.style.left = dx + "px";
    if(PAGINAS[pagina]){
      lamina.appendChild(huecoDe(pagina));
      var folio = nodo("div", "lb-folio");
      folio.textContent = pagina + 1;
      lamina.appendChild(folio);
    }
    var sombra = nodo("div", "lb-sombra");
    v.appendChild(lamina);
    v.appendChild(sombra);
    sombras.push(sombra);
    return v;
  }

  function construirViva(indice, ancho, sentido){
    var viva = nodo("div", "lb-viva");
    var w = ancho / TIRAS;
    var padre = viva, i, tiras = [], sombras = [];

    for(i = 0; i < TIRAS; i++){
      var tira = nodo("div", "lb-tira");
      /* cada franja va un pelo más ancha de lo que le toca: con el
         pliegue cerrado, entre una y otra se abriría una costura */
      tira.style.width = (w + 0.8) + "px";
      tira.style.left = (i === 0 ? 0 : w) + "px";
      tira.appendChild(ventana("lb-frente", indice * 2 + 1, -i * w, ancho, sombras));
      tira.appendChild(ventana("lb-dorso",  indice * 2 + 2, -(TIRAS - 1 - i) * w, ancho, sombras));
      padre.appendChild(tira);
      padre = tira;
      tiras.push(tira);
    }

    /* Cuánto del pliegue total le toca a cada franja, y cuánto lleva
       doblado el papel al llegar a ella. Lo segundo es para la sombra:
       se oscurece lo que ya se dobló. */
    var pesos = [], suma = 0;
    for(i = 0; i < TIRAS; i++){
      var peso = Math.pow((i + 1) / TIRAS, CIERRE);
      pesos.push(peso); suma += peso;
    }
    var reparto = [], acumulado = [], corrido = 0;
    for(i = 0; i < TIRAS; i++){
      reparto.push(pesos[i] / suma);
      corrido += reparto[i];
      acumulado.push(corrido);
    }
    return {nodo:viva, tiras:tiras, sombras:sombras, reparto:reparto,
            acumulado:acumulado, sentido:sentido};
  }

  /* ── Dónde queda la hoja para un grado de vuelta ───────────────
     r va de 0, la hoja quieta a la derecha, a 1, la hoja apoyada a la
     izquierda. `mano` dice a qué altura se la agarró, de −1 arriba a +1
     abajo: agarrada de una punta se dobla más que del medio. */
  function pintarVuelta(viva, r, mano){
    var i;
    var giro = -180 * r;
    var comba = Math.sin(Math.PI * Math.pow(r, 0.72));
    /* El pliegue va con el signo del sentido de marcha. La hoja arrastra
       su borde suelto: yendo hacia adelante el borde suelto es el
       derecho, y volviendo pasa a ser el izquierdo, así que el pliegue
       se da vuelta igual que en un libro de papel. */
    var arco = viva.sentido * CURVA * (0.72 + 0.28 * Math.abs(mano)) * comba;

    /* Y no se reparte parejo: junto al lomo el papel queda casi plano,
       porque ahí lo sujeta la encuadernación, y se va cerrando hacia el
       borde suelto, que es donde una hoja de verdad se enrosca. */
    viva.tiras[0].style.transform = "rotateY(" + (giro + arco * viva.reparto[0]).toFixed(2) + "deg)";
    for(i = 1; i < TIRAS; i++)
      viva.tiras[i].style.transform = "rotateY(" + (arco * viva.reparto[i]).toFixed(3) + "deg)";

    var base = 0.56 * comba;
    for(i = 0; i < TIRAS; i++){
      var f = base * (0.14 + 0.86 * viva.acumulado[i]);
      viva.sombras[i * 2].style.opacity = f;
      viva.sombras[i * 2 + 1].style.opacity = f * 0.75;
    }
    var s = 0.85 * comba;
    sombraDer.style.opacity = r < 0.5 ? s : 0;
    sombraIzq.style.opacity = r >= 0.5 ? s : 0;
  }

  function limpiarSombras(){
    sombraIzq.style.opacity = 0;
    sombraDer.style.opacity = 0;
  }

  function animarHasta(viva, desde, hasta, mano, ms, listo){
    var t0 = null;
    function cuadro(){
      var ahora = (window.performance ? performance.now() : Date.now());
      if(t0 === null) t0 = ahora;
      var p = ms <= 0 ? 1 : Math.min(1, (ahora - t0) / ms);
      pintarVuelta(viva, desde + (hasta - desde) * suave(p), mano);
      if(p < 1) proximoCuadro(cuadro);
      else{ limpiarSombras(); listo(); }
    }
    proximoCuadro(cuadro);
  }

  /* ── Pasar una hoja de un saque ──────────────────────────────── */
  function pasar(d){
    if(animando || arrastre) return;
    quitarAsomoYa();
    var n = HOJAS.length;
    if(d > 0 && vueltas >= topeVueltas()) return;
    if(d < 0 && vueltas <= 0) return;
    animando = true;
    var i = d > 0 ? vueltas : vueltas - 1;
    var hoja = HOJAS[i];

    if(modoSola){
      hoja.style.zIndex = n + 2;
      vueltas += d;
      if(d > 0) hoja.classList.add("lb-vuelta"); else hoja.classList.remove("lb-vuelta");
      pintarMando();
      setTimeout(function(){ animando = false; ordenar(); }, 540);
      return;
    }

    var viva = construirViva(i, hoja.getBoundingClientRect().width, d > 0 ? 1 : -1);
    libro.appendChild(viva.nodo);
    hoja.style.visibility = "hidden";
    animarHasta(viva, d > 0 ? 0 : 1, d > 0 ? 1 : 0, 0, DURA, function(){
      libro.removeChild(viva.nodo);
      vueltas += d;
      ordenar();
      hoja.style.visibility = "";
      pintarMando();
      animando = false;
    });
  }

  /* ── La esquina que se levanta sola ───────────────────────────
     Al acercar el cursor al borde suelto, la hoja se despega un poco y
     queda esperando que tiren de ella. */
  function medirLibro(){ cajaLibro = libro.getBoundingClientRect(); }

  function quitarAsomoYa(){
    if(retirada){
      if(retirada.viva.nodo.parentNode) libro.removeChild(retirada.viva.nodo);
      retirada.hoja.style.visibility = "";
      retirada = null;
    }
    if(!asomo) return;
    if(asomo.viva.nodo.parentNode) libro.removeChild(asomo.viva.nodo);
    asomo.hoja.style.visibility = "";
    asomo = null;
  }

  function bajarAsomo(){
    if(!asomo) return;
    var a = asomo;
    asomo = null;
    retirada = a;
    animarHasta(a.viva, a.r, a.base, a.mano, 260, function(){
      if(retirada !== a) return;          /* ya lo levantó otro */
      if(a.viva.nodo.parentNode) libro.removeChild(a.viva.nodo);
      a.hoja.style.visibility = "";
      retirada = null;
    });
  }

  function cuidarAsomo(ev){
    if(modoSola || animando || arrastre) return;
    if(!cajaLibro) medirLibro();
    var c = cajaLibro;
    var lomoX = c.left + c.width / 2, ancho = c.width / 2;
    var adelante = ev.clientX >= lomoX;
    var dist = adelante ? (c.right - ev.clientX) : (ev.clientX - c.left);
    var hay = adelante ? (vueltas < topeVueltas()) : (vueltas > 0);
    var dentro = ev.clientY >= c.top && ev.clientY <= c.bottom;

    if(!hay || !dentro || dist > ASOMO || dist < 0){ bajarAsomo(); return; }

    if(!asomo || asomo.adelante !== adelante){
      quitarAsomoYa();
      var i = adelante ? vueltas : vueltas - 1;
      var hoja = HOJAS[i];
      if(!hoja) return;
      var viva = construirViva(i, ancho, adelante ? 1 : -1);
      libro.appendChild(viva.nodo);
      hoja.style.visibility = "hidden";
      asomo = {viva:viva, hoja:hoja, adelante:adelante,
               base:adelante ? 0 : 1, r:adelante ? 0 : 1, mano:0};
    }
    var cerca = 1 - dist / ASOMO;
    var levanta = 0.012 + 0.085 * cerca * cerca;
    asomo.mano = entre((ev.clientY - (c.top + c.height / 2)) / (c.height / 2), -1, 1);
    asomo.r = asomo.adelante ? levanta : 1 - levanta;
    pintarVuelta(asomo.viva, asomo.r, asomo.mano);
  }

  /* ── Pasar la hoja con la mano ────────────────────────────────
     Se agarra la hoja donde caiga el cursor y desde ahí sigue al ratón:
     la distancia al lomo, medida en anchos de página, es el grado de
     vuelta. Al soltar, si pasó del medio se completa sola y si no vuelve
     a su lugar, que es lo que hace una hoja de papel. */
  function tomarHoja(ev){
    if(modoSola || animando || arrastre) return;
    if(ev.button !== undefined && ev.button !== 0) return;

    medirLibro();
    var c = cajaLibro;
    var lomoX = c.left + c.width / 2, ancho = c.width / 2;
    var adelante = ev.clientX >= lomoX;
    if(adelante && vueltas >= topeVueltas()) return;
    if(!adelante && vueltas <= 0) return;

    var i = adelante ? vueltas : vueltas - 1;
    var hoja = HOJAS[i];
    var viva, desde;
    /* Si la esquina ya estaba asomada, se sigue con esa misma hoja: así
       el papel no pega un salto entre el asomo y el arrastre. */
    if(asomo && asomo.adelante === adelante){
      viva = asomo.viva; desde = asomo.r; asomo = null;
    }else{
      quitarAsomoYa();
      viva = construirViva(i, ancho, adelante ? 1 : -1);
      libro.appendChild(viva.nodo);
      hoja.style.visibility = "hidden";
      desde = adelante ? 0 : 1;
    }

    arrastre = {
      viva:viva, hoja:hoja, adelante:adelante, lomoX:lomoX, ancho:ancho,
      x0:ev.clientX, corrido:0,
      mano:entre((ev.clientY - (c.top + c.height / 2)) / (c.height / 2), -1, 1),
      r:desde
    };
    libro.classList.add("lb-agarrando");
    try{ libro.setPointerCapture(ev.pointerId); }catch(e){}
    pintarVuelta(viva, arrastre.r, arrastre.mano);
    ev.preventDefault();
  }

  function moverHoja(ev){
    if(!arrastre) return;
    arrastre.corrido = Math.max(arrastre.corrido, Math.abs(ev.clientX - arrastre.x0));
    /* +1 en el borde de afuera derecho, 0 en el lomo, −1 en el izquierdo */
    var u = (ev.clientX - arrastre.lomoX) / arrastre.ancho;
    arrastre.r = entre((1 - u) / 2, 0, 1);
    pintarVuelta(arrastre.viva, arrastre.r, arrastre.mano);
  }

  function soltarHoja(){
    if(!arrastre) return;
    var a = arrastre;
    arrastre = null;
    ultimoSoltar = Date.now();
    libro.classList.remove("lb-agarrando");

    /* un toque sin arrastrar pasa la hoja entera, como un clic de toda la vida */
    var apenasUnClic = a.corrido < 6;
    var pasa = apenasUnClic ? true : (a.adelante ? a.r >= 0.42 : a.r <= 0.58);
    var destino = a.adelante ? (pasa ? 1 : 0) : (pasa ? 0 : 1);
    var ms = Math.max(240, DURA * Math.abs(destino - a.r) * 0.95);

    animando = true;
    animarHasta(a.viva, a.r, destino, a.mano, ms, function(){
      if(a.viva.nodo.parentNode) libro.removeChild(a.viva.nodo);
      if(pasa){ vueltas += a.adelante ? 1 : -1; ordenar(); pintarMando(); }
      a.hoja.style.visibility = "";
      animando = false;
    });
  }

  /* ── enganches ──────────────────────────────────────────────── */
  libro.addEventListener("pointerenter", medirLibro);
  libro.addEventListener("pointermove", cuidarAsomo);
  libro.addEventListener("pointerleave", bajarAsomo);
  libro.addEventListener("pointerdown", tomarHoja);
  /* el seguimiento va en la ventana y no en el libro: si el cursor se va
     afuera mientras se arrastra, la hoja lo sigue igual */
  window.addEventListener("pointermove", moverHoja);
  window.addEventListener("pointerup", soltarHoja);
  window.addEventListener("pointercancel", soltarHoja);
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
    quitarAsomoYa();
    origen.hidden = alLibro;
    libro.style.display = alLibro ? "" : "none";
    btAnt.hidden = btSig.hidden = cuenta.hidden = !alLibro;
    btCorrido.textContent = alLibro ? "Ver como texto corrido" : "Volver al libro";
    if(alLibro) rehacer();
  });

  window.addEventListener("scroll", function(){ cajaLibro = null; }, true);
  window.addEventListener("resize", function(){
    if(window.innerWidth === anchoAntes) return;
    anchoAntes = window.innerWidth;
    clearTimeout(reloj);
    reloj = setTimeout(rehacer, 220);
  });

  function rehacer(){
    if(libro.style.display === "none") return;   /* está mostrando el texto corrido */
    var pagina = modoSola ? vueltas : vueltas * 2;
    repartir();
    vueltas = unaSola() ? pagina : Math.floor(pagina / 2);
    cajaLibro = null;
    armar();
  }

  repartir();
  armar();
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
