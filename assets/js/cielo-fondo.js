/* ============================================================
   catto.ar · cielo de fondo para las páginas hechas a mano (30/10/2026)
   Las mismas estrellas y la misma Vía Láctea del resto del sitio
   (assets/js/starfield.js), fijas detrás de todo el contenido: la capa va
   con z-index -1, así queda por encima del fondo de la página y por debajo
   de cualquier cosa, sin tocar las capas propias de cada página.
   Se usa con <script src="/assets/js/cielo-fondo.js"></script> antes de </body>.
   ============================================================ */
(function(){
  if(document.getElementById('cieloFondo'))return;
  var css=
    '#cieloFondo{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}'+
    '#cieloFondo .starfield{position:absolute;inset:0}'+
    '#cieloFondo .starfield i{position:absolute;display:block;border-radius:50%}'+
    '#cieloFondo .mw{position:absolute;inset:0;filter:blur(12px);opacity:.8;background:'+
      'radial-gradient(26% 60% at 82% 76%,rgba(216,183,140,.18),transparent 62%),'+
      'radial-gradient(15% 34% at 86% 80%,rgba(236,150,168,.12),transparent 60%),'+
      'radial-gradient(34% 66% at 68% 56%,rgba(150,120,95,.10),transparent 68%),'+
      'radial-gradient(40% 80% at 54% 38%,rgba(120,140,196,.10),transparent 70%),'+
      'radial-gradient(30% 66% at 38% 18%,rgba(112,132,188,.07),transparent 72%)}'+
    '#cieloFondo .mw-core{position:absolute;left:82%;top:76%;width:220px;height:120px;transform:translate(-50%,-50%);'+
      'filter:blur(8px);border-radius:50%;background:radial-gradient(circle at 50% 55%,rgba(240,214,170,.22),rgba(230,160,150,.09) 45%,transparent 70%)}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  /* si la página pinta un degradado en el body, ese fondo taparía la capa: se pasa al html */
  var b=getComputedStyle(document.body), h=document.documentElement.style;
  if(b.backgroundImage&&b.backgroundImage!=='none'){
    h.backgroundColor=getComputedStyle(document.documentElement).backgroundColor;
    h.backgroundImage=b.backgroundImage; h.backgroundAttachment='fixed';
  }
  document.body.style.background='transparent';
  document.body.insertAdjacentHTML('afterbegin',
    '<div id="cieloFondo" aria-hidden="true"><div class="starfield" data-mw data-ax="30" data-ay="0" data-bx="82" data-by="100" '+
    'data-field="260" data-band="240" data-core="0.65"><div class="mw"></div><div class="mw-core"></div></div></div>');
  var s=document.createElement('script'); s.src='/assets/js/starfield.js'; document.body.appendChild(s);
})();
