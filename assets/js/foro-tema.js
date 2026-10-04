/* ============================================================
   catto.ar — "Consultas sobre este tema" al pie de cada página de
   contenido (tecnicatura e ingeniería). Lo carga tema.js.
   La categoría del foro sale de la cabecera: "6° año" en la tecnicatura
   da tec-6; "5to nivel" en ingeniería da ing-5. Lista las consultas
   publicadas que están vinculadas a esta página y ofrece preguntar.
   Habla directo con la API de Supabase (clave publicable) para no cargar
   la librería en cada página.
   ============================================================ */
(function () {
  'use strict';
  var doc = document.querySelector('main.doc');
  if (!doc) return;
  var U = 'https://fjzcajiemogsqizdgqjs.supabase.co/rest/v1/foro_tema', K = 'sb_publishable_mGM62YDOYWB3uvFj6QCO_A_Elj_cjAy';

  var ruta = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  if (!/^\/publicaciones\/[a-z0-9\/_.-]+$/.test(ruta)) return;
  var anio = document.querySelector('.tbar .anio'), n = anio ? parseInt(anio.textContent, 10) : NaN, cat = '';
  if (/\/mapa-ingenieria\//.test(ruta) && n >= 1 && n <= 6) cat = 'ing-' + n;
  else if (/\/mapa-electronica\//.test(ruta) && n >= 4 && n <= 7) cat = 'tec-' + n;
  var h1 = doc.querySelector('h1'), titulo = h1 ? h1.textContent.trim() : '';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var css = document.createElement('style');
  css.textContent =
    '.doc .foro-tema{margin:34px 0 8px;padding:16px 18px;background:var(--panel,#f1efea);border:1px solid var(--line,#cdc9bf);border-left:4px solid var(--accent,#1f5f99);border-radius:3px}' +
    '.doc .foro-tema h2{margin:0 0 6px;padding:0;font-size:18px;background:none;border:0;text-transform:none;letter-spacing:0}' +
    '.doc .foro-tema p{margin:0 0 10px}' +
    '.doc .foro-tema ul{list-style:none;margin:10px 0 12px;padding:0;border-top:1px solid var(--line,#cdc9bf)}' +
    '.doc .foro-tema li{padding:7px 0;border-bottom:1px solid var(--line,#cdc9bf);font-size:15px;margin:0}' +
    '.doc .foro-tema li span{color:var(--soft,#62676e);font-size:13px;margin-left:6px}' +
    '.doc .foro-tema .ft-btn{display:inline-block;background:#1f5f99;color:#fff;padding:7px 16px;border-radius:3px;font-size:15px}' +
    '.doc .foro-tema .ft-btn:hover{background:#164a78;text-decoration:none}' +
    '.doc .foro-tema .ft-ver{display:inline-block;white-space:nowrap;margin:8px 0 0 14px;font-size:14px}';
  document.head.appendChild(css);

  var caja = document.createElement('div');
  caja.className = 'foro-tema';
  var nueva = '/foro/nueva?' + (cat ? 'c=' + cat + '&' : '') + 'p=' + encodeURIComponent(ruta) + '&pt=' + encodeURIComponent(titulo);
  caja.innerHTML = '<h2>Consultas sobre este tema</h2>' +
    '<p>¿Te quedó una duda con este contenido? Preguntala en el foro: la consulta queda vinculada a esta página.</p>' +
    '<div class="ft-lista"></div>' +
    '<a class="ft-btn" href="' + esc(nueva) + '">Preguntar sobre este tema</a>' +
    '<a class="ft-ver" href="/foro' + (cat ? '/categoria?c=' + cat : '') + '">Ver el foro</a>';
  var nav2 = doc.querySelector('.nav2');
  if (nav2) doc.insertBefore(caja, nav2); else doc.appendChild(caja);

  fetch(U + '?select=id,titulo,resuelto,respuestas&estado=eq.publicado&pagina=eq.' + encodeURIComponent(ruta) + '&order=actividad.desc&limit=10',
        { headers: { apikey: K, Authorization: 'Bearer ' + K } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (d) {
      if (!d || !d.length) return;
      caja.querySelector('.ft-lista').innerHTML = '<ul>' + d.map(function (t) {
        return '<li><a href="/foro/tema?id=' + t.id + '">' + esc(t.titulo) + '</a><span>' +
          (t.resuelto ? 'resuelta · ' : '') + t.respuestas + (t.respuestas === 1 ? ' respuesta' : ' respuestas') + '</span></li>';
      }).join('') + '</ul>';
    })
    .catch(function () {});
})();
