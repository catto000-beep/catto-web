/* ============================================================
   catto.ar — Selector de idioma (Español / English)

   La versión en inglés vive en /en/ con las mismas direcciones:
   /publicaciones/... en castellano es /en/publicaciones/... en inglés.
   No todas las páginas están traducidas todavía: la lista de las que sí
   está más abajo y la escribe _src-publicaciones/ingles/enlazar.py cada
   vez que se publica una traducción (no editarla a mano).

   Hace tres cosas:
   1) Pone el desplegable de idioma en la barra de arriba.
   2) En las páginas en inglés, los enlaces a páginas que todavía no
      están traducidas quedan marcados «ES»; los que sí lo están se
      pasan a /en/ (también los que arma el javascript de cada página).
   3) A quien tiene el navegador en otro idioma y entra a una página en
      castellano que existe en inglés, le ofrece una vez la versión en
      inglés, con un aviso que se puede cerrar. No redirige solo.
   ============================================================ */
(function () {
  'use strict';
  if (window.CATTO_IDIOMA) return;
  window.CATTO_IDIOMA = true;

  /* páginas traducidas (dirección en castellano, sin .html) */
  /* <<lista-en>> */
  var EN = [
    "/",
    "/descargas",
    "/publicaciones/ca-vectorial",
    "/publicaciones/carta-smith",
    "/publicaciones/escritura-cursiva",
    "/publicaciones/mapa-electronica",
    "/publicaciones/mapa-electronica/temas/amplificadores-potencia",
    "/publicaciones/mapa-electronica/temas/amplificadores-senal-debil",
    "/publicaciones/mapa-electronica/temas/aplicaciones-compuertas",
    "/publicaciones/mapa-electronica/temas/arquitectura-microprocesadores",
    "/publicaciones/mapa-electronica/temas/circuitos-trifasicos",
    "/publicaciones/mapa-electronica/temas/contadores-programables",
    "/publicaciones/mapa-electronica/temas/conversores-ad-da",
    "/publicaciones/mapa-electronica/temas/corriente-electrica",
    "/publicaciones/mapa-electronica/temas/corrientes-alternas",
    "/publicaciones/mapa-electronica/temas/dibujo-tecnico-cad",
    "/publicaciones/mapa-electronica/temas/electrodinamica-induccion",
    "/publicaciones/mapa-electronica/temas/electrostatica",
    "/publicaciones/mapa-electronica/temas/entornos-c-cpp",
    "/publicaciones/mapa-electronica/temas/esquematicos",
    "/publicaciones/mapa-electronica/temas/filtros",
    "/publicaciones/mapa-electronica/temas/instalaciones-electricas",
    "/publicaciones/mapa-electronica/temas/instrumentos-analogicos",
    "/publicaciones/mapa-electronica/temas/instrumentos-digitales",
    "/publicaciones/mapa-electronica/temas/lenguaje-c",
    "/publicaciones/mapa-electronica/temas/lenguaje-cpp",
    "/publicaciones/mapa-electronica/temas/logica-combinacional",
    "/publicaciones/mapa-electronica/temas/logica-secuencial",
    "/publicaciones/mapa-electronica/temas/magnetismo-electromagnetismo",
    "/publicaciones/mapa-electronica/temas/magnitudes-electricas",
    "/publicaciones/mapa-electronica/temas/mediciones-ca",
    "/publicaciones/mapa-electronica/temas/mediciones-impedancia",
    "/publicaciones/mapa-electronica/temas/motores-ca",
    "/publicaciones/mapa-electronica/temas/osciladores",
    "/publicaciones/mapa-electronica/temas/osciloscopio",
    "/publicaciones/mapa-electronica/temas/pcb",
    "/publicaciones/mapa-electronica/temas/potencia-ca",
    "/publicaciones/mapa-electronica/temas/semiconductores-diodos",
    "/publicaciones/mapa-electronica/temas/semiconductores-especiales",
    "/publicaciones/mapa-electronica/temas/simbologia-componentes",
    "/publicaciones/mapa-electronica/temas/simulacion-circuitos",
    "/publicaciones/mapa-electronica/temas/transformadores",
    "/publicaciones/mapa-electronica/temas/transistores-bipolares",
    "/publicaciones/mapa-ingenieria",
    "/publicaciones/simulador-instrumental",
    "/taller"
  ];
  /* <</lista-en>> */

  var hay = {};
  EN.forEach(function (p) { hay[p] = true; });

  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var ingles = lang === 'en';

  function limpia(p) {
    p = p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
    return p || '/';
  }
  /* dirección en castellano de una ruta cualquiera (con o sin /en) */
  function aEs(p) {
    p = limpia(p);
    if (p === '/en') return '/';
    return p.indexOf('/en/') === 0 ? p.slice(3) : p;
  }
  function aEn(p) { p = aEs(p); return p === '/' ? '/en' : '/en' + p; }

  var aqui = aEs(location.pathname);
  var existeEn = !!hay[aqui];
  window.CATTO_EN = { hay: function (p) { return !!hay[aEs(p)]; }, aEn: aEn, aEs: aEs, lang: lang };

  var T = ingles ? {
    titulo: 'Language', es: 'Español', en: 'English', sinTraducir: 'home — this page is not translated yet',
    marca: 'Spanish only'
  } : {
    titulo: 'Idioma', es: 'Español', en: 'English', sinTraducir: 'portada en inglés',
    marca: 'solo en castellano'
  };

  function guardar(v) { try { localStorage.setItem('catto-idioma', v); } catch (e) {} }
  function leer() { try { return localStorage.getItem('catto-idioma'); } catch (e) { return null; } }

  /* ---------------------------------------------------------- estilos */
  var css = document.createElement('style');
  css.textContent =
    '.idioma{position:relative;display:inline-flex;align-items:center;flex:none;font-family:inherit}' +
    '.idioma>button{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 8px;border:1px solid rgba(255,255,255,.22);border-radius:4px;background:transparent;color:#e6edf3;font:inherit;font-size:13px;font-weight:600;letter-spacing:.4px;cursor:pointer}' +
    '.idioma>button:hover,.idioma.abierto>button{border-color:#74acdf;color:#fff}' +
    '.idioma>button svg{width:15px;height:15px;opacity:.85}' +
    '.idioma>button .fl{font-size:10px;opacity:.7}' +
    '.idioma-menu{position:fixed;z-index:400;min-width:190px;margin:0;padding:4px;list-style:none;background:#161b22;border:1px solid #30363d;border-radius:5px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:none}' +
    '.idioma-menu.abierto{display:block}' +
    '.idioma-menu li{margin:0;padding:0;border:0}' +
    '.idioma-menu li a{display:block;padding:7px 10px;border-radius:3px;color:#e6edf3;font-size:14px;text-decoration:none;line-height:1.3}' +
    '.idioma-menu li a:hover{background:#21262d;text-decoration:none}' +
    '.idioma-menu li a[aria-current]{color:#74acdf;font-weight:600}' +
    '.idioma-menu li small{display:block;font-size:11px;color:#8b949e;font-weight:400}' +
    '.idioma.flotante{position:fixed;top:10px;right:12px;z-index:300}' +
    /* portada: que el menú no se parta en dos líneas por el selector; achica el buscador */
    '@media (min-width:1240px){header.site nav.main{flex-shrink:0}}' +
    /* páginas de tema en el teléfono: botón mínimo, que el lugar es para la materia */
    '@media (max-width:600px){.tbar .idioma>button svg,.tbar .idioma>button .fl{display:none}.tbar .idioma>button{padding:0 7px;height:28px;font-size:12px}' +
    /* y del «Catto» queda solo el chanchito, que sigue llevando al inicio */
    '.tbar .brand{font-size:0;gap:0}.tbar .brand .logo{font-size:14px}.tbar .in{gap:10px}}' +
    '.idioma.flotante>button{background:#0d1117;border-color:#30363d}' +
    'html[lang=en] a[data-solo-es]::after{content:"ES";display:inline-block;margin-left:5px;padding:0 4px;border:1px solid currentColor;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:.5px;line-height:13px;vertical-align:2px;opacity:.6;text-decoration:none}' +
    '.idioma-aviso{position:relative;z-index:60;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;padding:8px 44px 8px 16px;background:#1f5f99;color:#fff;font-size:14px;line-height:1.4;text-align:center}' +
    '.idioma-aviso a{color:#fff;font-weight:600;text-decoration:underline}' +
    '.idioma-aviso button{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;background:transparent;color:#fff;font-size:20px;line-height:1;cursor:pointer}';
  document.head.appendChild(css);

  /* -------------------------------------------------------- desplegable */
  function armar() {
    if (document.querySelector('.idioma')) return;
    var caja = document.createElement('div');
    caja.className = 'idioma';
    var dEs = aqui, dEn = existeEn ? aEn(aqui) : '/en';
    caja.innerHTML =
      '<button type="button" aria-haspopup="true" aria-expanded="false" title="' + T.titulo + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>' +
      (ingles ? 'EN' : 'ES') + '<span class="fl" aria-hidden="true">▾</span></button>' +
      '<ul class="idioma-menu" role="menu" aria-label="' + T.titulo + '">' +
      '<li role="none"><a role="menuitem" lang="es" hreflang="es" href="' + dEs + '"' + (ingles ? '' : ' aria-current="true"') + ' data-i="es">' + T.es + '</a></li>' +
      '<li role="none"><a role="menuitem" lang="en" hreflang="en" href="' + dEn + '"' + (ingles ? ' aria-current="true"' : '') + ' data-i="en">' + T.en +
      (existeEn || ingles ? '' : '<small>' + T.sinTraducir + '</small>') + '</a></li></ul>';

    var boton = caja.querySelector('button'), menu = caja.querySelector('ul');
    /* el menú cuelga del <body> con posición fija debajo del botón: las
       barras de arriba recortan lo que se sale de ellas (overflow:hidden y
       backdrop-filter), así que adentro de ellas no se vería */
    document.body.appendChild(menu);
    function abrir(si) {
      caja.className = si ? 'idioma abierto' + (caja.flot ? ' flotante' : '') : 'idioma' + (caja.flot ? ' flotante' : '');
      menu.className = si ? 'idioma-menu abierto' : 'idioma-menu';
      boton.setAttribute('aria-expanded', si ? 'true' : 'false');
      if (si) {
        /* alineado al borde derecho del botón, pero siempre adentro de la pantalla */
        var r = boton.getBoundingClientRect(), vw = document.documentElement.clientWidth, mw = menu.offsetWidth;
        menu.style.top = Math.round(r.bottom + 6) + 'px';
        menu.style.right = 'auto';
        menu.style.left = Math.round(Math.max(8, Math.min(r.right - mw, vw - mw - 8))) + 'px';
      }
    }
    /* en el celular la barra de direcciones dispara resize al moverse: solo
       cuenta un cambio de ancho */
    var ancho = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== ancho) { ancho = window.innerWidth; abrir(false); } });
    boton.addEventListener('click', function (e) { e.stopPropagation(); abrir(caja.className.indexOf('abierto') === -1); });
    document.addEventListener('click', function () { abrir(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrir(false); });
    [].forEach.call(menu.querySelectorAll('a[data-i]'), function (a) {
      a.addEventListener('click', function () { guardar(a.getAttribute('data-i')); });
    });

    /* dónde va: la barra de la portada y las páginas generales, la de las
       páginas de tema, o flotando arriba a la derecha si no hay ninguna */
    var nav = document.querySelector('header.site nav.main');
    var tbar = document.querySelector('.tbar .in');
    var volver = document.getElementById('cattoBack');      /* barra de las publicaciones interactivas */
    if (nav) {
      /* en la computadora va a la derecha del menú; en el teléfono, adentro del
         renglón del menú y contra el margen derecho: arriba el lugar depende de si
         aparece o no el contador de visitas, y el selector saltaría */
      var tel = window.matchMedia ? window.matchMedia('(max-width:640px)') : null;
      var ubicar = function () {
        if (tel && tel.matches) { nav.appendChild(caja); caja.style.marginLeft = 'auto'; }
        else { nav.parentNode.insertBefore(caja, nav.nextSibling); caja.style.marginLeft = '8px'; }
      };
      ubicar();
      if (tel) { if (tel.addEventListener) tel.addEventListener('change', ubicar); else if (tel.addListener) tel.addListener(ubicar); }
    }
    else if (volver) { volver.appendChild(caja); }
    else if (tbar) tbar.insertBefore(caja, tbar.querySelector('.anio'));
    else { caja.flot = true; caja.className = 'idioma flotante'; document.body.appendChild(caja); }
    if (tbar && !nav) caja.style.marginLeft = 'auto';
    if (tbar && !nav && tbar.querySelector('.anio')) tbar.querySelector('.anio').style.marginLeft = '10px';
  }

  /* ------------------------------------------- enlaces en las páginas en inglés */
  function enlaces(raiz) {
    if (!ingles) return;
    [].forEach.call((raiz || document).querySelectorAll('a[href]'), function (a) {
      if (a.closest('.idioma, .idioma-menu')) return;
      var h = a.getAttribute('href');
      var m = /^(?:https:\/\/catto\.ar)?(\/[^?#]*)([?#].*)?$/.exec(h);
      if (!m) return;
      var p = m[1], resto = m[2] || '';
      if (p === '/en' || p.indexOf('/en/') === 0) return;                 /* ya en inglés */
      if (/^\/(assets|_vercel|descargas)\//.test(p)) return;              /* archivos */
      if (/^\/(foro|aula)(\/|$)/.test(p)) { a.setAttribute('data-solo-es', ''); return; }
      if (/\.(?!html$)[a-z0-9]{2,5}$/i.test(p)) return;                   /* archivos */
      if (hay[aEs(p)]) { a.setAttribute('href', aEn(p) + resto); a.removeAttribute('data-solo-es'); }
      else { a.setAttribute('data-solo-es', ''); a.setAttribute('hreflang', 'es'); a.title = a.title || T.marca; }
    });
  }

  /* ------------------------------------------------------ aviso de idioma */
  function aviso() {
    if (ingles || !existeEn || leer()) return;
    var langs = (navigator.languages || [navigator.language || 'es']).map(function (l) { return String(l).toLowerCase(); });
    if (langs.some(function (l) { return l.indexOf('es') === 0; })) return;
    var bar = document.createElement('div');
    bar.className = 'idioma-aviso';
    bar.setAttribute('lang', 'en');
    bar.innerHTML = '<span>This page is also available in English.</span><a href="' + aEn(aqui) + '" data-i="en">Read it in English →</a>' +
      '<button type="button" aria-label="Close">×</button>';
    bar.querySelector('a').addEventListener('click', function () { guardar('en'); });
    bar.querySelector('button').addEventListener('click', function () { guardar('es'); bar.parentNode.removeChild(bar); });
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function iniciar() {
    armar();
    enlaces();
    aviso();
    if (ingles && window.MutationObserver) {
      new MutationObserver(function (ms) {
        ms.forEach(function (m) {
          [].forEach.call(m.addedNodes, function (n) {
            if (n.nodeType === 1 && (n.tagName === 'A' || n.querySelector('a[href]'))) enlaces(n.parentNode || n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
