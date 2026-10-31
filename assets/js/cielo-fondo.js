/* ============================================================
   catto.ar · cielo de fondo (30/10/2026)
   Una capa fija detrás de todo el contenido (z-index -1: por encima del fondo de la
   página y por debajo de cualquier otra cosa, sin tocar las capas propias de cada página).
   - De noche: las estrellas y la Vía Láctea del resto del sitio (assets/js/starfield.js).
   - De día (solo en las páginas de papel, con data-papel en el <script>): una carta celeste
     impresa: puntitos de grafito y tinta celeste, algunas estrellas marcadas con una cruz
     como en un plano, y la Cruz del Sur y Orión trazadas con línea punteada.
   El modo lo decide papel.css (data-tema en <html> o el del sistema); la capa sigue al botón
   ☾/☀ sin recargar porque cada versión se muestra u oculta solo con CSS.
   Uso: <script src="/assets/js/cielo-fondo.js"></script>              (páginas siempre oscuras)
        <script src="/assets/js/cielo-fondo.js" data-papel></script>   (páginas con papel.css)
   ============================================================ */
(function(){
  if(document.getElementById('cieloFondo'))return;
  var yo=document.currentScript, papel=!!(yo&&yo.hasAttribute('data-papel'));
  var noche=':root[data-tema="oscuro"]', sistema='@media (prefers-color-scheme:dark){:root:not([data-tema="claro"]) ';
  var css=
    '#cieloFondo{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}'+
    '#cieloFondo>div,#cieloFondo>svg{position:absolute;inset:0;width:100%;height:100%}'+
    '#cieloFondo .starfield i{position:absolute;display:block;border-radius:50%}'+
    '#cieloFondo .mw{position:absolute;inset:0;filter:blur(12px);opacity:.8;background:'+
      'radial-gradient(26% 60% at 82% 76%,rgba(216,183,140,.18),transparent 62%),'+
      'radial-gradient(15% 34% at 86% 80%,rgba(236,150,168,.12),transparent 60%),'+
      'radial-gradient(34% 66% at 68% 56%,rgba(150,120,95,.10),transparent 68%),'+
      'radial-gradient(40% 80% at 54% 38%,rgba(120,140,196,.10),transparent 70%),'+
      'radial-gradient(30% 66% at 38% 18%,rgba(112,132,188,.07),transparent 72%)}'+
    '#cieloFondo .mw-core{position:absolute;left:82%;top:76%;width:220px;height:120px;transform:translate(-50%,-50%);'+
      'filter:blur(8px);border-radius:50%;background:radial-gradient(circle at 50% 55%,rgba(240,214,170,.22),rgba(230,160,150,.09) 45%,transparent 70%)}';
  if(papel){
    /* el fondo de la página pasa al <html> (con la misma variable, así sigue al modo) para que la capa se vea */
    css+='html{background:var(--bg)}body{background:transparent!important}'+
      /* de día, la carta; de noche, las estrellas */
      '#cieloFondo .cf-noche{display:none}'+
      noche+' #cieloFondo .cf-noche{display:block}'+noche+' #cieloFondo .cf-dia{display:none}'+
      sistema+'#cieloFondo .cf-noche{display:block}:root:not([data-tema="claro"]) #cieloFondo .cf-dia{display:none}}';
  }
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  if(!papel){
    /* páginas siempre oscuras: si pintan un degradado en el body, ese fondo taparía la capa: se pasa al html */
    var b=getComputedStyle(document.body), h=document.documentElement.style;
    if(b.backgroundImage&&b.backgroundImage!=='none'){
      h.backgroundColor=getComputedStyle(document.documentElement).backgroundColor;
      h.backgroundImage=b.backgroundImage; h.backgroundAttachment='fixed';
    }
    document.body.style.background='transparent';
  }

  var html='<div id="cieloFondo" aria-hidden="true">'+
    '<div class="starfield cf-noche" data-mw data-ax="30" data-ay="0" data-bx="82" data-by="100" '+
    'data-field="260" data-band="240" data-core="0.65"><div class="mw"></div><div class="mw-core"></div></div>'+
    (papel?cartaCeleste():'')+'</div>';
  document.body.insertAdjacentHTML('afterbegin',html);
  var s=document.createElement('script'); s.src='/assets/js/starfield.js'; document.body.appendChild(s);

  /* ---------- la carta celeste del modo claro ----------
     Coordenadas en una hoja de 1600 × 1000 que cubre la pantalla (slice: se recorta, no se deforma).
     Semilla fija: siempre el mismo dibujo. */
  function cartaCeleste(){
    var sem=29, r=function(){sem=(sem*16807)%2147483647;return sem/2147483647;};
    var TINTA='#2f5478', CELESTE='#3d7cb8', RET='#5c7fa3';
    var f=function(n){return n.toFixed(1);};
    /* un velo apenas azulado hacia los bordes: el papel se oscurece un poco, como una carta vieja */
    var p='<defs><radialGradient id="cfVelo" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#1e3a5c" stop-opacity="0"/>'+
      '<stop offset="100%" stop-color="#1e3a5c" stop-opacity=".09"/></radialGradient></defs>'+
      '<rect width="1600" height="1000" fill="url(#cfVelo)"/>';
    /* retícula de la carta: paralelos y meridianos alrededor del polo sur (abajo a la derecha, fuera de la hoja) */
    var PX=1480, PY=1180;
    p+='<g fill="none" stroke="'+RET+'" stroke-width=".8" stroke-dasharray="2 6" opacity=".35">';
    for(var c=320;c<=1720;c+=280)p+='<circle cx="'+PX+'" cy="'+PY+'" r="'+c+'"/>';
    for(var g=100;g<=260;g+=20){var a=g*Math.PI/180;p+='<line x1="'+PX+'" y1="'+PY+'" x2="'+f(PX+2000*Math.cos(a))+'" y2="'+f(PY-2000*Math.sin(a))+'"/>';}
    p+='</g>';
    /* estrellas de campo: marcas nítidas en tinta; las más brillantes, con destello en cruz */
    function estrella(x,y,m,op){
      var s='<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+m+'" fill="'+TINTA+'" opacity="'+op+'"/>';
      if(m>=2)s+='<path d="M'+f(x)+' '+f(y-m*3)+'L'+f(x+m*.45)+' '+f(y)+'L'+f(x)+' '+f(y+m*3)+'L'+f(x-m*.45)+' '+f(y)+'ZM'+f(x-m*3)+' '+f(y)+'L'+f(x)+' '+f(y-m*.45)+'L'+f(x+m*3)+' '+f(y)+'L'+f(x)+' '+f(y+m*.45)+'Z" fill="'+TINTA+'" opacity="'+op+'"/>';
      return s;
    }
    for(var i=0;i<120;i++){
      var t=r(), m=t>.93?2.2:t>.7?1.5:1.1;
      p+=estrella(r()*1600,r()*1000,m,(.45+r()*.3).toFixed(2));
    }
    /* constelaciones: estrella = punto con anillo; trazo punteado; nombre en letra de máquina */
    function constelacion(pts,lineas,nombre,nx,ny){
      var s='<g>';
      lineas.forEach(function(q){s+='<line x1="'+pts[q[0]][0]+'" y1="'+pts[q[0]][1]+'" x2="'+pts[q[1]][0]+'" y2="'+pts[q[1]][1]+'" stroke="'+CELESTE+'" stroke-width="1.2" stroke-dasharray="4 3" opacity=".75"/>';});
      pts.forEach(function(q){s+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+(q[2]+3.6)+'" fill="none" stroke="'+CELESTE+'" stroke-width="1" opacity=".8"/>'+estrella(q[0],q[1],q[2],.9);});
      s+='<text x="'+nx+'" y="'+ny+'" font-family="IBM Plex Mono,monospace" font-size="13" letter-spacing="2.5" fill="'+CELESTE+'" opacity=".9">'+nombre+'</text></g>';
      return s;
    }
    /* arriba a la derecha: la Cruz del Sur con los Punteros de Centauro, que en el cielo la señalan */
    p+=constelacion([[1340,150,2.6],[1340,312,3],[1276,236,2.5],[1400,222,2],[1376,276,1.3]],
      [[0,1],[2,3]],'CRUX',1300,350);
    p+=constelacion([[1135,338,3.2],[1180,292,2.6]],[[0,1]],'CENTAURUS',1070,378);
    p+='<line x1="1192" y1="280" x2="1262" y2="244" stroke="'+CELESTE+'" stroke-width="1" stroke-dasharray="1 5" opacity=".7"/>';
    /* abajo a la derecha: Escorpio, con Antares y la cola en gancho */
    p+=constelacion([[1352,560,1.8],[1366,586,2],[1376,612,1.8],[1300,646,3],[1272,704,1.8],[1266,764,1.8],[1288,822,1.8],[1330,860,2],[1384,870,1.8],[1424,846,2.2],[1440,812,1.6]],
      [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]],'SCORPIUS',1456,796);
    /* abajo a la izquierda: Orión con las Tres Marías (desde el hemisferio sur, cabeza abajo) */
    p+=constelacion([[170,700,2.8],[300,690,2.4],[205,610,1.9],[235,602,2],[265,594,1.9],[150,520,2.4],[315,505,2.8]],
      [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]],'ORIÓN',190,748);
    /* arriba a la izquierda: el Can Mayor con Sirio, la estrella más brillante del cielo */
    p+=constelacion([[250,170,3.4],[300,236,1.8],[236,292,2],[318,318,1.8],[196,232,1.6]],
      [[0,1],[0,4],[1,2],[1,3]],'CANIS MAIOR',170,360);
    return '<svg class="cf-dia" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">'+p+'</svg>';
  }
})();
