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
    var p='';
    for(var i=0;i<230;i++){
      var x=(r()*1600).toFixed(1), y=(r()*1000).toFixed(1), t=r();
      var col=t>.72?'#4f8fc4':'#6b7a8c', rad=t>.95?2.1:t>.7?1.45:.95, op=(.22+r()*.3).toFixed(2);
      p+='<circle cx="'+x+'" cy="'+y+'" r="'+rad+'" fill="'+col+'" opacity="'+op+'"/>';
    }
    /* una docena de estrellas marcadas con una cruz fina, como en un plano */
    for(var k=0;k<12;k++){
      var cx=r()*1600, cy=r()*1000, l=5+r()*4;
      p+='<path d="M'+(cx-l).toFixed(1)+' '+cy.toFixed(1)+'H'+(cx+l).toFixed(1)+'M'+cx.toFixed(1)+' '+(cy-l).toFixed(1)+'V'+(cy+l).toFixed(1)+'" stroke="#4f8fc4" stroke-width="1" opacity=".45"/>';
    }
    /* constelaciones: estrella = anillo de tinta con un punto; trazo punteado celeste */
    function constelacion(pts,lineas,nombre,nx,ny){
      var s='<g opacity=".55">';
      lineas.forEach(function(a){s+='<line x1="'+pts[a[0]][0]+'" y1="'+pts[a[0]][1]+'" x2="'+pts[a[1]][0]+'" y2="'+pts[a[1]][1]+'" stroke="#74acdf" stroke-width="1.1" stroke-dasharray="5 4"/>';});
      pts.forEach(function(q){s+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+(q[2]+3.5)+'" fill="none" stroke="#4f8fc4" stroke-width="1"/>'+
        '<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+q[2]+'" fill="#3d6f99"/>';});
      s+='<text x="'+nx+'" y="'+ny+'" font-family="IBM Plex Mono,monospace" font-size="13" letter-spacing="2" fill="#4f8fc4">'+nombre+'</text></g>';
      return s;
    }
    /* Cruz del Sur: Acrux abajo, Gacrux arriba, Mimosa y Delta a los lados; Épsilon chica */
    p+=constelacion([[1330,170,3],[1330,330,3.4],[1265,250,2.8],[1392,236,2.3],[1368,290,1.6]],
      [[0,1],[2,3]],'CRUX',1290,370);
    /* Orión con las Tres Marías (visto desde el hemisferio sur, cabeza abajo) */
    p+=constelacion([[170,700,3],[300,690,2.6],[205,610,1.9],[235,602,2],[265,594,1.9],[150,520,2.6],[315,505,3]],
      [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]],'ORIÓN',190,745);
    return '<svg class="cf-dia" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">'+p+'</svg>';
  }
})();
