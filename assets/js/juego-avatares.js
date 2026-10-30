/* ============================================================
   Ruleta de Ohm · avatares (30/10/2026)
   Doce personajes propios, dibujados en SVG sobre una grilla de 64×64.
   JUEGO_AV.lista  → los id en el orden en que se ofrecen
   JUEGO_AV.n(id)  → el nombre
   JUEGO_AV.svg(id, tamaño) → el dibujo listo para insertar
   Los id no se cambian: las partidas en línea guardan el id.
   ============================================================ */
var JUEGO_AV = (function(){
'use strict';
var OSC='#0d1117', BCO='#ffffff', PATA='#c9ced6';

/* cara: dos ojos y una sonrisa; s escala, col es el color de la cara */
function cara(cx,cy,s,col){
  var e=5*s, r=2.2*s, brillo=col===OSC?'<circle cx="'+(cx-e+.7*s)+'" cy="'+(cy-.8*s)+'" r="'+(.8*s)+'" fill="'+BCO+'"/><circle cx="'+(cx+e+.7*s)+'" cy="'+(cy-.8*s)+'" r="'+(.8*s)+'" fill="'+BCO+'"/>':'';
  return '<circle cx="'+(cx-e)+'" cy="'+cy+'" r="'+r+'" fill="'+col+'"/><circle cx="'+(cx+e)+'" cy="'+cy+'" r="'+r+'" fill="'+col+'"/>'+brillo+
    '<path d="M'+(cx-4*s)+' '+(cy+4*s)+'Q'+cx+' '+(cy+8*s)+' '+(cx+4*s)+' '+(cy+4*s)+'" fill="none" stroke="'+col+'" stroke-width="'+(2*s)+'" stroke-linecap="round"/>';
}
function pata(x,y0,y1){return '<line x1="'+x+'" y1="'+y0+'" x2="'+x+'" y2="'+y1+'" stroke="'+PATA+'" stroke-width="2.6" stroke-linecap="round"/>';}

/* cada dibujo recibe u: un sufijo único para sus recortes */
var AV={
  res:{n:'Resistencia',bg:'#2d4a6b',d:function(u){
    return '<clipPath id="c'+u+'"><rect x="10" y="18" width="44" height="28" rx="12"/></clipPath>'+
      '<line x1="2" y1="32" x2="62" y2="32" stroke="'+PATA+'" stroke-width="3"/>'+
      '<rect x="10" y="18" width="44" height="28" rx="12" fill="#e8c58f"/>'+
      '<g clip-path="url(#c'+u+')"><rect x="15" y="18" width="3.5" height="28" fill="#7a4a1f"/><rect x="20.5" y="18" width="3.5" height="28" fill="#23272e"/>'+
      '<rect x="40" y="18" width="3.5" height="28" fill="#d13b2b"/><rect x="46" y="18" width="3.5" height="28" fill="#d4a72c"/></g>'+
      cara(32,30,.8,OSC);}},
  cap:{n:'Capacitor',bg:'#3b2f55',d:function(u){
    return pata(26,50,61)+pata(38,50,58)+
      '<clipPath id="c'+u+'"><rect x="18" y="8" width="28" height="44" rx="6"/></clipPath>'+
      '<rect x="18" y="8" width="28" height="44" rx="6" fill="#2f6fd6"/>'+
      '<g clip-path="url(#c'+u+')"><rect x="18" y="8" width="28" height="5" fill="#9aa3ad"/><rect x="38" y="13" width="8" height="39" fill="#cfe0ff"/></g>'+
      '<path d="M40 22h4M40 31h4M40 40h4" stroke="#2f6fd6" stroke-width="1.8" stroke-linecap="round"/>'+
      cara(28,30,.85,BCO);}},
  led:{n:'LED',bg:'#1f4d3a',d:function(){
    return '<path d="M32 4V8M16 12L19 15M48 12L45 15M9 26H13M51 26H55" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"/>'+
      pata(27,44,61)+pata(37,44,57)+
      '<path d="M20 42V26A12 12 0 0 1 44 26V42Z" fill="#ff5a4e"/>'+
      '<rect x="17" y="40" width="30" height="5" rx="1.5" fill="#b8352b"/>'+
      '<ellipse cx="25.5" cy="22" rx="2" ry="4" fill="'+BCO+'" opacity=".45"/>'+
      cara(32,30,.75,OSC);}},
  foco:{n:'Lamparita',bg:'#3a3270',d:function(){
    return '<circle cx="32" cy="26" r="21" fill="#ffd84d" opacity=".16"/>'+
      '<circle cx="32" cy="26" r="15" fill="#ffd84d"/><path d="M24.5 36L27 44H37L39.5 36Z" fill="#ffd84d"/>'+
      '<rect x="26" y="44" width="12" height="10" rx="2" fill="#9aa3ad"/><path d="M26 47.5H38M26 50.5H38" stroke="#6b7480" stroke-width="1.3"/>'+
      '<rect x="29" y="54" width="6" height="3.5" rx="1.5" fill="#3a3f45"/>'+
      cara(32,25,.85,OSC);}},
  pila:{n:'Pila',bg:'#24505a',d:function(u){
    return '<rect x="28" y="8" width="8" height="7" rx="1.5" fill="'+PATA+'"/>'+
      '<clipPath id="c'+u+'"><rect x="20" y="13" width="24" height="43" rx="4"/></clipPath>'+
      '<rect x="20" y="13" width="24" height="43" rx="4" fill="#23272e"/>'+
      '<rect x="20" y="13" width="24" height="15" fill="#e08a2e" clip-path="url(#c'+u+')"/>'+
      '<path d="M28.5 20.5H35.5M32 17V24" stroke="#23272e" stroke-width="2.2" stroke-linecap="round"/>'+
      cara(32,39,.85,BCO);}},
  chip:{n:'Integrado',bg:'#8a6a2a',d:function(){
    var p='';
    for(var i=0;i<4;i++)p+='<rect x="9" y="'+(17+i*8.5)+'" width="9" height="4" rx="1" fill="'+PATA+'"/><rect x="46" y="'+(17+i*8.5)+'" width="9" height="4" rx="1" fill="'+PATA+'"/>';
    return p+'<rect x="16" y="11" width="32" height="42" rx="3" fill="#2b2f36"/>'+
      '<path d="M28 11A4 4 0 0 0 36 11Z" fill="#15181d"/><circle cx="21.5" cy="17" r="1.6" fill="#6b7480"/>'+
      cara(32,32,.9,BCO);}},
  tr:{n:'Transistor',bg:'#5a2d4a',d:function(){
    return pata(25,44,61)+pata(32,44,61)+pata(39,44,61)+
      '<path d="M17 45V29A15 15 0 0 1 47 29V45Z" fill="#2b2f36"/>'+
      '<path d="M17 40H47" stroke="#444b55" stroke-width="1.5"/>'+
      cara(32,29,.9,BCO);}},
  rayo:{n:'Rayo',bg:'#2b3f78',d:function(){
    return '<path d="M34 4L14 36H29L22 60L50 24H35L44 4Z" fill="#ffd23f" stroke="#b8860b" stroke-width="1.5" stroke-linejoin="round"/>'+
      cara(32,29,.72,OSC);}},
  osc:{n:'Osciloscopio',bg:'#1f3d4d',d:function(){
    var g='';
    for(var x=19;x<43;x+=8)g+='<path d="M'+x+' 17V43" stroke="#1d4a33" stroke-width=".8"/>';
    return '<rect x="5" y="12" width="54" height="40" rx="5" fill="#8a96a3"/>'+
      '<rect x="10" y="17" width="33" height="26" rx="3" fill="#0f2a1c"/>'+g+'<path d="M10 30H43" stroke="#1d4a33" stroke-width=".8"/>'+
      '<circle cx="51" cy="22" r="3.6" fill="#2b2f36"/><circle cx="51" cy="33" r="3.6" fill="#2b2f36"/><rect x="47.5" y="41" width="7" height="4" rx="1" fill="#2b2f36"/>'+
      '<rect x="9" y="52" width="8" height="4" rx="1" fill="#6b7480"/><rect x="47" y="52" width="8" height="4" rx="1" fill="#6b7480"/>'+
      '<circle cx="20.5" cy="26" r="2.3" fill="#5cff9d"/><circle cx="32.5" cy="26" r="2.3" fill="#5cff9d"/>'+
      '<path d="M17.5 35q2.25-3.5 4.5 0t4.5 0t4.5 0t4.5 0" fill="none" stroke="#5cff9d" stroke-width="1.8" stroke-linecap="round"/>';}},
  robot:{n:'Robot',bg:'#5a2a2a',d:function(){
    return '<path d="M10 64Q10 53 22 53H42Q54 53 54 64Z" fill="#8a96a3"/><rect x="26" y="45" width="12" height="9" fill="#6b7480"/>'+
      '<path d="M32 9V16" stroke="#9aa3ad" stroke-width="2.4"/><circle cx="32" cy="7.5" r="3.2" fill="#ff5a4e"/>'+
      '<rect x="9" y="25" width="6" height="12" rx="2" fill="#8a96a3"/><rect x="49" y="25" width="6" height="12" rx="2" fill="#8a96a3"/>'+
      '<rect x="14" y="16" width="36" height="30" rx="7" fill="#b8c4d0"/>'+
      '<rect x="19" y="22" width="26" height="12" rx="6" fill="#0d1b33"/>'+
      '<circle cx="26" cy="28" r="2.7" fill="#5ce1ff"/><circle cx="38" cy="28" r="2.7" fill="#5ce1ff"/>'+
      '<rect x="24" y="38" width="16" height="4" rx="2" fill="#6b7480"/><path d="M28 38V42M32 38V42M36 38V42" stroke="#b8c4d0" stroke-width="1"/>';}},
  gato:{n:'Catto',bg:'#2a4f5e',d:function(){
    return '<path d="M14 32L16 11L30 22Z M50 32L48 11L34 22Z" fill="#f0a04b"/>'+
      '<path d="M18 26L19 16L26 22Z M46 26L45 16L38 22Z" fill="#f2a9b8"/>'+
      '<ellipse cx="32" cy="37" rx="19" ry="16" fill="#f0a04b"/>'+
      '<path d="M32 22V27.5M27 23L28 27.5M37 23L36 27.5" stroke="#c46f1f" stroke-width="2.2" stroke-linecap="round"/>'+
      '<ellipse cx="25" cy="36" rx="2.6" ry="3.4" fill="'+OSC+'"/><ellipse cx="39" cy="36" rx="2.6" ry="3.4" fill="'+OSC+'"/>'+
      '<circle cx="25.9" cy="34.6" r=".9" fill="'+BCO+'"/><circle cx="39.9" cy="34.6" r=".9" fill="'+BCO+'"/>'+
      '<path d="M30 41H34L32 43.3Z" fill="#e86a8a"/>'+
      '<path d="M32 43.3Q30.5 46.5 28 44.8M32 43.3Q33.5 46.5 36 44.8" fill="none" stroke="'+OSC+'" stroke-width="1.4" stroke-linecap="round"/>'+
      '<path d="M21 42L8 40M21 44.5L8 47M43 42L56 40M43 44.5L56 47" stroke="'+BCO+'" stroke-width="1" stroke-linecap="round" opacity=".85"/>';}},
  omega:{n:'Omega',bg:'#3a2a5c',d:function(){
    return '<path d="M13 52H24V46.5A16 16 0 1 1 40 46.5V52H51" fill="none" stroke="#d4a72c" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'+
      cara(32,31,.8,BCO);}}
};

var lista=Object.keys(AV), cuenta=0;
function svg(id,tam){
  var a=AV[id]||AV.gato, u='av'+(++cuenta);
  return '<svg class="av" viewBox="0 0 64 64" width="'+tam+'" height="'+tam+'" aria-hidden="true">'+
    '<clipPath id="r'+u+'"><circle cx="32" cy="32" r="32"/></clipPath>'+
    '<g clip-path="url(#r'+u+')"><rect width="64" height="64" fill="'+a.bg+'"/>'+a.d(u)+'</g></svg>';
}
return {lista:lista, n:function(id){return (AV[id]||AV.gato).n;}, svg:svg, existe:function(id){return !!AV[id];}};
})();
