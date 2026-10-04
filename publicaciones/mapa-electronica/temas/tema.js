/* ============================================================
   catto.ar — Comportamiento compartido de las paginas de tema
   1) Arma el indice lateral a partir de los <h2> del documento.
   2) Marca en el indice la seccion que se esta leyendo.
   ============================================================ */
(function(){
  var doc = document.querySelector('.doc');
  var toc = document.querySelector('.toc ol');
  if(!doc || !toc) return;

  var secs = [].slice.call(doc.querySelectorAll('section[id]'));
  if(!secs.length) return;

  // --- Indice ---
  var links = secs.map(function(s){
    var h2 = s.querySelector('h2');
    if(!h2) return null;
    var t = h2.cloneNode(true);
    var n = t.querySelector('.n');
    if(n) n.remove();
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + s.id;
    a.textContent = t.textContent.trim();
    li.appendChild(a);
    toc.appendChild(li);
    return a;
  }).filter(Boolean);

  // --- Seccion activa ---
  function marcar(){
    var y = (window.scrollY || document.documentElement.scrollTop) + 110;
    var act = 0;
    for(var i=0;i<secs.length;i++){
      if(secs[i].offsetTop <= y) act = i; else break;
    }
    links.forEach(function(a,i){ a.classList.toggle('on', i===act); });
  }
  var tick = false;
  window.addEventListener('scroll', function(){
    if(tick) return;
    tick = true;
    requestAnimationFrame(function(){ marcar(); tick = false; });
  }, {passive:true});
  marcar();
})();

/* ============================================================
   Tiza legible sobre el pizarron. Las figuras y los graficos de
   laboratorio se dibujaron para fondo negro, con letra chica y grises
   tenues; sobre el verde se pierden. Aca se engrosa y agranda la letra
   y se aclaran los grises, sin tocar los colores de las curvas.
   ============================================================ */
(function(){
  var CLARO = '#dde4ea';
  // gris poco saturado y de brillo medio: el que se pierde en el verde
  function tenue(r, g, b){
    var l = 0.2126*r + 0.7152*g + 0.0722*b;
    return Math.max(r, g, b) - Math.min(r, g, b) < 45 && l > 60 && l < 190;
  }
  function peso(pre){
    return /\b(bold|[6-9]00)\b/.test(pre) ? '700' : '600';
  }

  // --- canvas de los laboratorios ---
  var P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if(P && !P.__tiza){
    P.__tiza = 1;
    var fuentes = {}, colores = {};
    var fuente = function(f){
      if(fuentes[f] !== undefined) return fuentes[f];
      var m = /^(.*?)(\d*\.?\d+)px(.*)$/.exec(f);
      if(!m) return (fuentes[f] = f);
      var pre = m[1].replace(/\b(normal|bold|bolder|lighter|[1-9]00)\b/g, '').trim();
      return (fuentes[f] = (pre ? pre + ' ' : '') + peso(m[1]) + ' ' +
        (+m[2] * 1.15).toFixed(1) + 'px' + m[3]);
    };
    var color = function(c){
      if(typeof c !== 'string') return c;
      if(colores[c] !== undefined) return colores[c];
      var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c);
      return (colores[c] = m && tenue(parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)) ? CLARO : c);
    };
    var enPizarron = function(ctx){
      var c = ctx.canvas;
      if(!c || !c.closest) return false;
      if(c.__pz === undefined) c.__pz = !!c.closest('.lw');
      return c.__pz;
    };
    var medir = P.measureText;
    // extremos horizontales del texto, en pixeles del canvas
    var extremos = function(ctx, txt, x, T){
      var w = medir.call(ctx, txt).width, al = ctx.textAlign;
      var x0 = al === 'center' ? x - w / 2 : (al === 'right' || al === 'end') ? x - w : x;
      return [T.a * x0 + T.e, T.a * (x0 + w) + T.e];
    };
    var envolver = function(nombre, pinta){
      var orig = P[nombre];
      P[nombre] = function(txt, x){
        if(!enPizarron(this)) return orig.apply(this, arguments);
        var f = this.font, s = this.fillStyle, r, a = arguments;
        var T = nombre !== 'measureText' && this.getTransform ? this.getTransform() : null;
        var antes = T && !T.b && !T.c && T.a > 0 ? extremos(this, txt, x, T) : null;
        this.font = fuente(f);
        if(pinta) this.fillStyle = color(s);
        // si el rotulo entraba con la letra original y con la grande se
        // sale del borde, se lo corre hacia adentro lo justo
        if(antes){
          var W = this.canvas.width, d = extremos(this, txt, x, T), dx = 0;
          if(antes[0] >= 0 && antes[1] <= W){
            // si ni corriendolo entra, queda la letra original
            if(d[1] - d[0] > W - 4) this.font = f;
            else if(d[1] > W - 2) dx = W - 2 - d[1];
            else if(d[0] < 2) dx = 2 - d[0];
          }
          if(dx){ a = [].slice.call(arguments); a[1] = x + dx / T.a; }
        }
        try{ r = orig.apply(this, a); }
        finally{ this.font = f; if(pinta) this.fillStyle = s; }
        return r;
      };
    };
    envolver('fillText', true);
    envolver('strokeText', false);
    envolver('measureText', false);
  }

  // --- esquemas SVG ---
  var rgb = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
  var ts = [].filter.call(document.querySelectorAll('figure svg text, .doc svg.svg-t text'),
    function(t){ return t.textContent.trim(); });
  var cajas = function(){
    return ts.map(function(t){
      var q = t.getBoundingClientRect(), s = t.ownerSVGElement.getBoundingClientRect();
      return { q: q, fuera: q.left < s.left - 1 || q.right > s.right + 1 ||
                            q.top < s.top - 1 || q.bottom > s.bottom + 1 };
    });
  };
  var encima = function(a, b){
    var w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    var h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 && w * h > 0.1 * Math.min(a.width * a.height, b.width * b.height);
  };
  var ant = cajas();
  ts.forEach(function(t){
    var cs = getComputedStyle(t), fs = parseFloat(cs.fontSize), m = rgb.exec(cs.fill);
    if(fs) t.style.fontSize = (fs * 1.1).toFixed(1) + 'px';
    t.style.fontWeight = parseInt(cs.fontWeight, 10) >= 600 ? '700' : '600';
    if(m && tenue(+m[1], +m[2], +m[3])) t.style.fill = CLARO;
  });
  // el rotulo que con la letra grande se sale del esquema o se monta
  // sobre otro vuelve a su tamano original
  var des = cajas();
  ts.forEach(function(t, i){
    if(des[i].fuera && !ant[i].fuera){ t.style.fontSize = ''; t.style.fontWeight = ''; }
    for(var j = i + 1; j < ts.length; j++){
      if(ts[j].ownerSVGElement !== t.ownerSVGElement) continue;
      if(encima(des[i].q, des[j].q) && !encima(ant[i].q, ant[j].q)){
        t.style.fontSize = ''; ts[j].style.fontSize = '';
      }
    }
  });
})();

/* ============================================================
   Cajas con varias ecuaciones: la fila de ecuaciones se alinea con
   el principio y el final de la oracion de abajo (el epigrafe). Si
   las ecuaciones no entran en ese ancho, quedan repartidas en todo el
   recuadro; si no entran en un renglon, el CSS las apila.
   ============================================================ */
(function(){
  var GAP = 24, HUECO_MAX = 160;
  function ecuaciones(f){
    return [].filter.call(f.children, function(c){
      return c.matches('math[display="block"]') || (c.tagName === 'SPAN' && c.querySelector(':scope > .katex-display'));
    });
  }
  function repartir(){
    [].forEach.call(document.querySelectorAll('.doc .form'), function(f){
      var eq = ecuaciones(f);
      if(eq.length < 2) return;
      f.classList.remove('eq-fila');
      eq.forEach(function(e){ e.style.marginLeft = ''; e.style.marginRight = ''; });
      var cs = getComputedStyle(f), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
      var ancho = f.clientWidth - pl - pr, total = GAP * (eq.length - 1);
      eq.forEach(function(e){ total += e.getBoundingClientRect().width; });
      if(total > ancho) return;                       /* no entran en un renglon: las apila el CSS */
      var cap = f.querySelector(':scope > .cap');
      if(!cap) return;
      var r = document.createRange(); r.selectNodeContents(cap);
      var rs = [].slice.call(r.getClientRects()).filter(function(x){ return x.width > 0; });
      if(!rs.length) return;
      var base = f.getBoundingClientRect().left + pl;
      var izq = Math.min.apply(null, rs.map(function(x){ return x.left; })) - base;
      var der = Math.max.apply(null, rs.map(function(x){ return x.right; })) - base;
      if(der - izq < total) return;                   /* la oracion es mas corta que las ecuaciones */
      /* si alinearlas con la oracion las deja muy separadas (dos ecuaciones
         cortas bajo una oracion larga), queda el reparto centrado del CSS */
      if((der - izq - total) / (eq.length - 1) + GAP > HUECO_MAX) return;
      f.classList.add('eq-fila');
      eq[0].style.marginLeft = Math.max(0, izq) + 'px';
      eq[eq.length - 1].style.marginRight = Math.max(0, ancho - der) + 'px';
    });
  }
  repartir();
  window.addEventListener('load', repartir);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(repartir);
  var t;
  window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(repartir, 150); });
})();

/* ============================================================
   Deja anotada la ultima pagina de tema leida, para la tira
   "segui donde ibas" de la portada. Se guarda solo en el navegador
   de quien lee: no sale del equipo.
   ============================================================ */
(function(){
  var h1 = document.querySelector('.doc h1');
  if(!h1) return;
  var up = document.querySelector('.tbar .up');      // "Mapa de Temas · Materia"
  var anio = document.querySelector('.tbar .anio');
  try{
    localStorage.setItem('cattoUltimoTema', JSON.stringify({
      u: location.pathname,
      t: h1.textContent.trim(),
      m: up ? up.textContent.replace(/^[^·]*·\s*/, '') : '',
      a: anio ? anio.textContent.trim() : '',
      f: Date.now()
    }));
  }catch(e){}
})();

// 4) Foro: bloque "Consultas sobre este tema" al pie (assets/js/foro-tema.js)
(function(){
  if(!document.querySelector('main.doc')) return;
  var s = document.createElement('script');
  s.src = '/assets/js/foro-tema.js?v=1';
  s.defer = true;
  document.body.appendChild(s);
})();
