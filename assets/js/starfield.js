/* Campo de estrellas + nebulosa Vía Láctea.
   Genera estrellas dentro de cada .starfield[data-mw]. Config por data-*:
   data-ax/ay/bx/by = extremos (en %) de la banda; data-field = estrellas dispersas;
   data-band = estrellas sobre la banda; data-core = umbral t [0-1] del "núcleo" (extremo B). */
(function(){
  function num(el,a,d){ var v=parseFloat(el.getAttribute(a)); return isNaN(v)?d:v; }
  function build(sf){
    var A={x:num(sf,'data-ax',42), y:num(sf,'data-ay',2)};
    var B={x:num(sf,'data-bx',60), y:num(sf,'data-by',100)};
    var nField=num(sf,'data-field',300), nBand=num(sf,'data-band',340);
    var coreT=num(sf,'data-core',0.6);
    var dx=B.x-A.x, dy=B.y-A.y, len2=dx*dx+dy*dy||1;
    function distBand(x,y){ var t=((x-A.x)*dx+(y-A.y)*dy)/len2; t=Math.max(0,Math.min(1,t)); return Math.hypot(x-(A.x+t*dx), y-(A.y+t*dy)); }
    function g(){ return (Math.random()+Math.random()+Math.random()-1.5)/1.5; }   // ~[-1,1]
    function pick(a){ return a[(Math.random()*a.length)|0]; }
    var whites=['#ffffff','#f2f6ff','#e6eeff'], blues=['#cdd9ff','#bcccff','#a9c2ff'],
        warms=['#fff0dc','#ffe3c2'], pinks=['#ffd2de','#ffc2d8'];
    var html='';
    function star(x,y,size,op,color,glow){
      if(x<-2||x>102||y<-2||y>102) return;
      var sh = glow ? ';box-shadow:0 0 '+(size*1.8).toFixed(1)+'px '+color : '';
      html += '<i style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%;width:'+size.toFixed(2)+'px;height:'+size.toFixed(2)+'px;opacity:'+op.toFixed(2)+';background:'+color+sh+'"></i>';
    }
    // 1) Campo general disperso
    for(var i=0;i<nField;i++){
      var x=Math.random()*100, y=Math.random()*100;
      var boost=Math.max(0, 1-distBand(x,y)/34);
      var size=0.6+Math.random()*1.3+boost*Math.random()*0.9;
      var op=Math.min(1, 0.22+Math.random()*0.45+boost*0.2);
      var r=Math.random();
      var color=r<0.6?pick(whites):r<0.85?pick(blues):r<0.95?pick(warms):pick(pinks);
      star(x,y,size,op,color,size>2.3);
    }
    // 2) Estrellas sobre la banda (más densas y brillantes hacia el núcleo, extremo B)
    for(var j=0;j<nBand;j++){
      var t=Math.random();
      if(Math.random()<0.5) t=coreT+Math.random()*(1-coreT);
      var cx=A.x+t*dx, cy=A.y+t*dy, spread=5+t*11;
      var bx=cx+g()*spread, by=cy+g()*spread*0.7, core=t>coreT;
      var bsize=0.6+Math.random()*1.4+(core?Math.random()*1.3:0.4);
      var bop=Math.min(1, 0.3+Math.random()*0.5+(core?0.2:0));
      var br=Math.random(), bcolor;
      if(core) bcolor=br<0.4?pick(whites):br<0.65?pick(warms):br<0.85?pick(blues):pick(pinks);
      else     bcolor=br<0.55?pick(whites):br<0.85?pick(blues):br<0.95?pick(warms):pick(pinks);
      star(bx,by,bsize,bop,bcolor,bsize>2.2);
    }
    sf.insertAdjacentHTML('beforeend', html);
  }
  var list=document.querySelectorAll('.starfield[data-mw]');
  for(var k=0;k<list.length;k++) build(list[k]);
})();
