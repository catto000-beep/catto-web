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
