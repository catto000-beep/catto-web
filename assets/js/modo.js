/* ============================================================
   catto.ar — Botón de modo claro / oscuro

   Los colores del modo oscuro están en assets/css/papel.css (bloque
   <<oscuro>>). Sin elección guardada, la página sigue lo que tenga
   configurado el sistema, y eso lo resuelve el CSS solo, sin esperar a
   este archivo. El botón fija la elección en <html data-tema="…"> y la
   recuerda en el navegador de quien lee (no sale del equipo).

   Lo cargan idioma.js (todas las páginas con selector de idioma) y foro.js.
   Solo aparece en las páginas que usan papel.css: las publicaciones
   interactivas ya son oscuras y no tienen modo claro.
   ============================================================ */
(function () {
  'use strict';
  if (window.CATTO_MODO) return;
  window.CATTO_MODO = true;

  var raiz = document.documentElement;
  function leer() { try { return localStorage.getItem('catto-tema'); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem('catto-tema', v); } catch (e) {} }

  var elegido = leer();
  if (elegido === 'oscuro' || elegido === 'claro') raiz.setAttribute('data-tema', elegido);

  if (!document.querySelector('link[href*="papel.css"]')) return;

  var sistema = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function oscuro() {
    var t = raiz.getAttribute('data-tema');
    return t ? t === 'oscuro' : !!(sistema && sistema.matches);
  }
  var EN = (raiz.lang || '').indexOf('en') === 0;
  var LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';

  var css = document.createElement('style');
  css.textContent =
    '.modo{display:inline-flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;padding:0;margin-left:8px;border:1px solid rgba(255,255,255,.22);border-radius:4px;background:transparent;color:#e6edf3;cursor:pointer}' +
    '.modo:hover{border-color:#74acdf;color:#fff}' +
    '.modo svg{width:16px;height:16px}' +
    '.modo.flotante{position:fixed;top:10px;right:12px;z-index:300;background:#0d1117;border-color:#30363d}' +
    '@media (max-width:600px){.tbar .modo{width:28px;height:28px;margin-left:6px}}';
  document.head.appendChild(css);

  function pintar(b) {
    var o = oscuro();
    b.innerHTML = o ? SOL : LUNA;
    var t = o ? (EN ? 'Switch to light mode' : 'Pasar a modo claro') : (EN ? 'Switch to dark mode' : 'Pasar a modo oscuro');
    b.title = t; b.setAttribute('aria-label', t);
    b.setAttribute('aria-pressed', o ? 'true' : 'false');
  }

  function armar() {
    if (document.querySelector('.modo')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'modo';
    pintar(b);
    b.addEventListener('click', function () {
      var v = oscuro() ? 'claro' : 'oscuro';
      raiz.setAttribute('data-tema', v); guardar(v); pintar(b);
    });
    if (sistema) {
      var cambio = function () { pintar(b); };
      if (sistema.addEventListener) sistema.addEventListener('change', cambio); else if (sistema.addListener) sistema.addListener(cambio);
    }
    ubicar(b);
  }

  /* al lado del selector de idioma; si no hay (el foro), donde iría él */
  function ubicar(b) {
    var idioma = document.querySelector('.idioma');
    if (idioma && idioma.className.indexOf('flotante') !== -1) {
      b.className = 'modo flotante';
      b.style.right = (12 + idioma.offsetWidth + 8) + 'px';
      document.body.appendChild(b); return;
    }
    if (idioma) { idioma.parentNode.insertBefore(b, idioma.nextSibling); return; }
    var nav = document.querySelector('header.site nav.main');
    var tbar = document.querySelector('.tbar .in');
    if (nav) { nav.parentNode.insertBefore(b, nav.nextSibling); }
    else if (tbar) { tbar.insertBefore(b, tbar.querySelector('.anio')); }
    else { b.className = 'modo flotante'; document.body.appendChild(b); }
  }

  /* el selector de idioma se arma al cargar la página: esperar a que esté */
  function iniciar() { setTimeout(armar, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
