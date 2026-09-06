/* ============================================================
   catto.ar — Gente mirando ahora
   ------------------------------------------------------------
   Cuenta en vivo a quienes tienen el sitio abierto, sin importar
   en qué página estén. Usa la "presencia" de Supabase Realtime,
   hablando el protocolo directo por WebSocket: son tres mensajes
   y evita cargar los 200 KB de la librería en cada página.

   La clave es la publicable del proyecto, la misma que ya está en
   /aula/assets/config.js. Es segura para el frontend.

   El indicador aparece recién a partir de 2. Con una sola persona
   conectada no se muestra nada: nadie tiene que leer que está solo.
   Las páginas sin el indicador igual se conectan, así suman al total.
   ============================================================ */
(function () {
  'use strict';

  var URL_WS = 'wss://fjzcajiemogsqizdgqjs.supabase.co/realtime/v1/websocket' +
               '?apikey=sb_publishable_mGM62YDOYWB3uvFj6QCO_A_Elj_cjAy&vsn=1.0.0';
  var TEMA    = 'realtime:catto-online'; // canal único para todo el sitio
  var LATIDO  = 25000;  // el servidor corta a los 60 s sin señales
  var ESPERA  = 6000;   // demora antes de esconder, para que no parpadee
  var MINIMO  = 2;      // se muestra desde dos personas
  var SALIR   = 90000;  // en segundo plano tanto tiempo, se corta la conexión

  var ws = null, latido = null, reintento = null, ocultar = null, salida = null;
  var dormido = false, intentos = 0, refN = 0;
  var presentes = Object.create(null);

  /* Identidad de la pestaña. En sessionStorage para que al recargar
     siga siendo la misma y el número no salte. */
  var yo;
  try {
    yo = sessionStorage.getItem('catto-online-id');
    if (!yo) {
      yo = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('catto-online-id', yo);
    }
  } catch (e) {
    yo = Math.random().toString(36).slice(2, 10);
  }

  var caja = document.getElementById('online');
  var num  = document.getElementById('onlineN');

  function enviar(msg) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  /* Cada identidad puede tener más de una conexión abierta a la vez, y el
     servidor las distingue por una marca propia. Hay que llevarlas todas:
     al recargar la página conviven un instante la conexión vieja y la
     nueva, y si se borrara la identidad al primer aviso de salida, el
     visitante desaparecería de su propia cuenta. */
  function marcas(entrada) {
    var metas = (entrada && entrada.metas) || [], r = [], i;
    for (i = 0; i < metas.length; i++) if (metas[i] && metas[i].phx_ref) r.push(metas[i].phx_ref);
    return r;
  }

  function sumar(mapa) {
    for (var k in mapa) {
      var tiene = presentes[k] || (presentes[k] = []), llegan = marcas(mapa[k]);
      for (var i = 0; i < llegan.length; i++) {
        if (tiene.indexOf(llegan[i]) < 0) tiene.push(llegan[i]);
      }
    }
  }

  function restar(mapa) {
    for (var k in mapa) {
      var tiene = presentes[k];
      if (!tiene) continue;
      var salen = marcas(mapa[k]);
      for (var i = 0; i < salen.length; i++) {
        var d = tiene.indexOf(salen[i]);
        if (d >= 0) tiene.splice(d, 1);
      }
      if (!tiene.length) delete presentes[k];
    }
  }

  function pintar() {
    if (!caja) return;
    var n = Object.keys(presentes).length;

    if (n >= MINIMO) {
      clearTimeout(ocultar); ocultar = null;
      if (num) num.textContent = n;
      caja.setAttribute('aria-label', n + ' personas mirando el sitio ahora');
      caja.classList.add('on');
    } else if (caja.classList.contains('on') && !ocultar) {
      /* Alguien que recarga sale y entra en un segundo. Se espera un
         poco antes de esconder para no mostrar un salto. */
      ocultar = setTimeout(function () {
        caja.classList.remove('on');
        ocultar = null;
      }, ESPERA);
    }
  }

  function conectar() {
    clearTimeout(reintento); reintento = null;
    try { ws = new WebSocket(URL_WS); } catch (e) { volverAIntentar(); return; }

    ws.onopen = function () {
      intentos = 0;
      refN = 0;
      presentes = Object.create(null);

      enviar({
        topic: TEMA, event: 'phx_join', ref: String(++refN), join_ref: '1',
        payload: { config: {
          broadcast: { self: false },
          presence: { key: yo, enabled: true }, // sin enabled nadie se ve
          postgres_changes: []
        } }
      });
      enviar({
        topic: TEMA, event: 'presence', ref: String(++refN), join_ref: '1',
        payload: { type: 'presence', event: 'track', payload: {} }
      });

      clearInterval(latido);
      latido = setInterval(function () {
        enviar({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++refN) });
      }, LATIDO);
    };

    ws.onmessage = function (ev) {
      var m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.topic !== TEMA) return;

      if (m.event === 'presence_state') {
        presentes = Object.create(null);
        sumar(m.payload);
        pintar();
      } else if (m.event === 'presence_diff') {
        sumar(m.payload.joins || {});
        restar(m.payload.leaves || {});
        pintar();
      } else if (m.event === 'phx_error' || m.event === 'phx_close') {
        try { ws.close(); } catch (e) {}
      }
    };

    ws.onclose = function () { volverAIntentar(); };
    ws.onerror = function () { try { ws.close(); } catch (e) {} };
  }

  function dormir() {
    /* En segundo plano el navegador frena los temporizadores y el latido
       llega tarde, así que el servidor corta igual. Conviene soltar la
       conexión a propósito: quien no está mirando no debería contar. */
    dormido = true;
    clearInterval(latido); latido = null;
    clearTimeout(reintento); reintento = null;
    try { if (ws) ws.close(); } catch (e) {}
  }

  function volverAIntentar() {
    clearInterval(latido); latido = null;
    if (dormido || reintento) return;
    /* Espera creciente hasta medio minuto, con un poco de azar para
       que mil pestañas no vuelvan todas en el mismo instante. */
    var demora = Math.min(30000, 2000 * Math.pow(2, intentos++)) + Math.random() * 1000;
    reintento = setTimeout(conectar, demora);
  }

  /* Una pestaña en segundo plano deja de contar al minuto y medio, y al
     volver se reconecta sin esperar el turno. El margen es para que un
     vistazo a otra pestaña no haga saltar el número de los demás. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      clearTimeout(salida); salida = null;
      dormido = false;
      if (ws && ws.readyState <= 1) return;
      clearTimeout(reintento); reintento = null; intentos = 0;
      conectar();
    } else {
      programarSalida();
    }
  });

  function programarSalida() {
    if (salida) return;
    salida = setTimeout(function () { salida = null; dormir(); }, SALIR);
  }

  conectar();
  /* La página puede abrirse ya en segundo plano, sin que llegue nunca un
     cambio de visibilidad: ahí hay que armar la salida a mano. */
  if (document.visibilityState === 'hidden') programarSalida();
})();
