/* ============================================================
   catto.ar — «Me gusta» en cada página de tema. Lo carga tema.js.
   Un corazón con su contador a la derecha de la cabecera del tema.
   La cuenta vive en Supabase (tabla tema_like, foro/db/08-me-gusta.sql);
   el «ya me gustó» de cada visitante se guarda en su navegador.
   La versión en inglés (/en/...) comparte la cuenta con su original.
   ============================================================ */
(function () {
  'use strict';
  var doc = document.querySelector('main.doc');
  if (!doc) return;
  var ruta = location.pathname.replace(/\.html$/, '').replace(/\/$/, '').replace(/^\/en(?=\/)/, '');
  if (!/^\/publicaciones\/[a-z0-9\/_.-]+$/.test(ruta)) return;

  var U = 'https://fjzcajiemogsqizdgqjs.supabase.co/rest/v1/', K = 'sb_publishable_mGM62YDOYWB3uvFj6QCO_A_Elj_cjAy';
  var H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
  var EN = (document.documentElement.lang || '').indexOf('en') === 0;
  var CLAVE = 'cattoMeGusta';

  function marcadas() { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (e) { return {}; } }
  function marcar(si) {
    var m = marcadas();
    if (si) m[ruta] = 1; else delete m[ruta];
    try { localStorage.setItem(CLAVE, JSON.stringify(m)); } catch (e) {}
  }

  var css = document.createElement('style');
  css.textContent =
    '.mg{margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:4px 11px 4px 9px;cursor:pointer;' +
      'font:600 13px/1 "IBM Plex Mono",monospace;color:var(--soft,#62676e);background:var(--panel,#f1efea);' +
      'border:1px solid var(--line,#cdc9bf);border-radius:999px;transition:color .15s,border-color .15s,background .15s,transform 120ms ease-out}' +
    /* solo con mouse: en el celular el :hover queda pegado y el corazón seguiría rojo al quitarlo */
    '@media(hover:hover) and (pointer:fine){.mg:hover{color:#c8374f;border-color:#c8374f}}' +
    '.mg:active{transform:scale(.96)}' +
    '.mg svg{width:16px;height:16px;display:block;fill:none;stroke:currentColor;stroke-width:2}' +
    '.mg[aria-pressed="true"]{color:#c8374f;border-color:rgba(200,55,79,.55);background:rgba(200,55,79,.08)}' +
    '.mg[aria-pressed="true"] svg{fill:currentColor}' +
    '.mg.late svg{animation:mgLate .4s ease}' +
    '@keyframes mgLate{0%{transform:scale(1)}30%{transform:scale(1.3)}60%{transform:scale(.92)}100%{transform:scale(1)}}' +
    '@media(prefers-reduced-motion:reduce){.mg.late svg{animation:none}.mg:active{transform:none}}';
  document.head.appendChild(css);

  var yaMeGusta = !!marcadas()[ruta], cuenta = null;
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'mg';
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.3 1 5 3 1.7-2 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg><span class="mg-n">·</span>';
  var num = b.querySelector('.mg-n');

  function pintar() {
    b.setAttribute('aria-pressed', yaMeGusta ? 'true' : 'false');
    num.textContent = cuenta === null ? '·' : cuenta.toLocaleString(EN ? 'en-US' : 'es-AR');
    var t = EN ? (yaMeGusta ? 'You liked this topic' : 'I like this topic')
               : (yaMeGusta ? 'Te gustó este tema' : 'Me gusta este tema');
    b.title = t;
    b.setAttribute('aria-label', t + (cuenta === null ? '' : ' · ' + cuenta));
  }

  /* va en la primera línea de la cabecera; si una página no la tuviera, antes del título */
  var crumb = doc.querySelector('.crumb');
  if (crumb) crumb.appendChild(b);
  else { var h1 = doc.querySelector('h1'); if (h1) h1.parentNode.insertBefore(b, h1); else return; }
  pintar();

  fetch(U + 'tema_like?select=cuenta&pagina=eq.' + encodeURIComponent(ruta), { headers: H })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (d) { if (d && d.length) { cuenta = d[0].cuenta; pintar(); } else b.hidden = true; })
    .catch(function () {});

  var ocupado = false;
  b.addEventListener('click', function () {
    if (ocupado || cuenta === null) return;
    ocupado = true;
    yaMeGusta = !yaMeGusta;
    var delta = yaMeGusta ? 1 : -1;
    cuenta = Math.max(0, cuenta + delta);
    marcar(yaMeGusta);
    if (yaMeGusta) { b.classList.remove('late'); void b.offsetWidth; b.classList.add('late'); }
    pintar();
    fetch(U + 'rpc/tema_like_sumar', { method: 'POST', headers: H, body: JSON.stringify({ p_pagina: ruta, p_delta: delta }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) { if (typeof v === 'number') { cuenta = v; pintar(); } })
      .catch(function () {})
      .then(function () { ocupado = false; });
  });
})();
