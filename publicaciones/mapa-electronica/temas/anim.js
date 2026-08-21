/* ============================================================
   catto.ar — Control de las figuras animadas de las paginas de tema
   Se aplica a todo <svg data-anim>.
   1) Si el visitante pidio menos movimiento, deja la figura quieta.
   2) Si no, la anima solo mientras esta a la vista (no gasta CPU de fondo).
   ============================================================ */
(function(){
  var svgs = [].slice.call(document.querySelectorAll('svg[data-anim]'));
  if(!svgs.length) return;

  function pausar(s){ try{ s.pauseAnimations(); }catch(e){} }
  function seguir(s){ try{ s.unpauseAnimations(); }catch(e){} }

  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(quieto){
    svgs.forEach(function(s){ pausar(s); try{ s.setCurrentTime(0); }catch(e){} });
    return;
  }

  if(!('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if(e.isIntersecting) seguir(e.target); else pausar(e.target);
    });
  }, {rootMargin:'140px 0px'});

  // Arrancan andando: si por lo que fuera el observador no informara nunca,
  // las figuras se animan igual. Lo unico que hace el observador es frenarlas
  // mientras estan fuera de la pantalla.
  svgs.forEach(function(s){ io.observe(s); });
})();
