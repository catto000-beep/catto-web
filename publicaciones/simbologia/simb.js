/* ============================================================================
   SIMBOLOGÍA ELECTRÓNICA Y ELÉCTRICA — catto.ar
   Biblioteca de dibujo y registro de símbolos. Cada archivo s-*.js agrega los
   suyos con SB.add('categoria', [ ... ]). La página (index.html) los muestra.

   Reglas de dibujo (para todos los archivos de símbolos):
   - viewBox por defecto 0 0 120 80; eje de los componentes de dos terminales en
     y = 40, con los terminales en x = 10 y x = 110.
   - Trazo único de 2 px, puntas redondeadas. Relleno solo con la clase "f".
   - Las leyendas dentro del símbolo usan SB.t(); a 5 px o más de los trazos.
   - Cada símbolo se dibuja con estas funciones, que devuelven texto SVG.
   ========================================================================== */
(function(){
"use strict";
function a(n){ return Math.round(n * 100) / 100; }
var SB = {
  cats: [], lista: [], porId: {},
  /* ---- primitivas ---- */
  l: function(x1, y1, x2, y2, c){
    return '<line x1="' + a(x1) + '" y1="' + a(y1) + '" x2="' + a(x2) + '" y2="' + a(y2) + '"' + (c ? ' class="' + c + '"' : '') + '/>';
  },
  /* línea a trazos */
  d: function(x1, y1, x2, y2){ return SB.l(x1, y1, x2, y2, 'tr'); },
  /* línea gruesa (placa negativa de una pila) */
  g: function(x1, y1, x2, y2){ return SB.l(x1, y1, x2, y2, 'gr'); },
  pl: function(pts, c){
    return '<polyline points="' + pts.map(function(p){ return a(p[0]) + ',' + a(p[1]); }).join(' ') + '"' + (c ? ' class="' + c + '"' : '') + '/>';
  },
  pg: function(pts, f){
    return '<polygon points="' + pts.map(function(p){ return a(p[0]) + ',' + a(p[1]); }).join(' ') + '"' + (f ? ' class="f"' : '') + '/>';
  },
  p: function(dd, c){ return '<path d="' + dd + '"' + (c ? ' class="' + c + '"' : '') + '/>'; },
  c: function(cx, cy, r, f){ return '<circle cx="' + a(cx) + '" cy="' + a(cy) + '" r="' + a(r) + '"' + (f ? ' class="f"' : '') + '/>'; },
  r: function(x, y, w, h, f, rx){
    return '<rect x="' + a(x) + '" y="' + a(y) + '" width="' + a(w) + '" height="' + a(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + (f ? ' class="f"' : '') + '/>';
  },
  /* texto: o = {z: tamaño, a: 'start'|'middle'|'end', c: clase ('e' tenue, 'v' color), b: negrita} */
  t: function(x, y, s, o){
    o = o || {};
    return '<text x="' + a(x) + '" y="' + a(y) + '" text-anchor="' + (o.a || 'middle') + '"' +
      ' font-size="' + (o.z || 12) + '"' + (o.b === false ? ' font-weight="400"' : '') +
      (o.c ? ' class="' + o.c + '"' : '') + '>' + s + '</text>';
  },
  /* subíndice dentro de SB.t: 'V' + SB.sub('CC') */
  sub: function(s){ return '<tspan dy="3" font-size="0.72em">' + s + '</tspan>'; },
  /* nodo (unión) y terminal abierto */
  n: function(x, y){ return '<circle cx="' + a(x) + '" cy="' + a(y) + '" r="3" class="f"/>'; },
  o: function(x, y){ return '<circle cx="' + a(x) + '" cy="' + a(y) + '" r="3.2" class="hueco"/>'; },
  /* flecha con punta llena que termina en (x2, y2) */
  ar: function(x1, y1, x2, y2, h){
    h = h || 7;
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
    var bx = x2 - ux * h, by = y2 - uy * h, w = h * 0.45;
    return SB.l(x1, y1, bx + ux * 0.5, by + uy * 0.5) +
      SB.pg([[x2, y2], [bx - uy * w, by + ux * w], [bx + uy * w, by - ux * w]], true);
  },
  /* bobina IEC: n medias vueltas de diámetro w desde (x, y) hacia +x, abultadas hacia arriba (lado=-1) o abajo (1) */
  bob: function(x, y, n, w, lado){
    var s = 'M' + a(x) + ',' + a(y), r = w / 2, sw = (lado || -1) < 0 ? 1 : 0;
    for(var i = 0; i < n; i++) s += ' a' + r + ',' + r + ' 0 0 ' + sw + ' ' + w + ',0';
    return SB.p(s);
  },
  /* bobina vertical: desde (x, y) hacia +y, abultada a la derecha (lado=1) o a la izquierda (-1) */
  bobv: function(x, y, n, w, lado){
    var s = 'M' + a(x) + ',' + a(y), r = w / 2, sw = (lado || 1) > 0 ? 1 : 0;
    for(var i = 0; i < n; i++) s += ' a' + r + ',' + r + ' 0 0 ' + sw + ' 0,' + w;
    return SB.p(s);
  },
  /* zigzag de un resistor ANSI entre x1 y x2 sobre y */
  zz: function(x1, x2, y, n, amp){
    var pts = [[x1, y]], paso = (x2 - x1) / (2 * n);
    for(var i = 0; i < 2 * n; i++){
      var x = x1 + paso * (i + 0.5);
      pts.push([x, y + (i % 2 ? amp : -amp)]);
    }
    pts.push([x2, y]);
    return SB.pl(pts);
  },
  /* registro */
  cat: function(id, nombre, intro){ SB.cats.push({ id: id, nombre: nombre, intro: intro }); },
  add: function(cat, items){
    items.forEach(function(it){
      it.cat = cat;
      if(SB.porId[it.id]) console.warn('símbolo repetido', it.id);
      SB.porId[it.id] = it; SB.lista.push(it);
    });
  },
  svg: function(it, cls){
    return '<svg class="sy ' + (cls || '') + '" viewBox="' + (it.vb || '0 0 120 80') + '" role="img" aria-label="' +
      it.n.replace(/"/g, '') + '">' + it.s + '</svg>';
  }
};
window.SB = SB;
})();
