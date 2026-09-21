/* ============================================================
   catto.ar — Gente mirando ahora
   ------------------------------------------------------------
   Cuenta en vivo a quienes tienen el sitio abierto, sin importar
   en qué página estén. Usa la "presencia" de Supabase Realtime,
   hablando el protocolo directo por WebSocket: son tres mensajes
   y evita cargar los 200 KB de la librería en cada página.

   La clave es la publicable del proyecto, la misma que ya está en
   /aula/assets/config.js. Es segura para el frontend.

   Cada visitante comparte además su país, deducido de la zona
   horaria del navegador: no se consulta ningún servicio externo
   ni se mira la IP de nadie, y lo único que viaja son dos letras.

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
  var TOPE    = 3;      // cuántas banderas se muestran antes del "+N"

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

  /* ------------------------------------------------------------- el país
     Sale de la zona horaria, que el navegador ya tiene resuelta. No es
     exacto —quien viaja con la notebook en otra zona figura mal— pero
     para mostrar de dónde está mirando la gente alcanza de sobra. El
     respaldo es el idioma, que muchas veces trae el país al final:
     es-AR, pt-BR, en-US. */
  var ZONAS = {
    'America/Argentina': 'AR', 'America/Buenos_Aires': 'AR', 'America/Cordoba': 'AR',
    'America/Mendoza': 'AR', 'America/Rosario': 'AR', 'America/Catamarca': 'AR',
    'America/Jujuy': 'AR',
    'America/Montevideo': 'UY', 'America/Asuncion': 'PY', 'America/Santiago': 'CL',
    'Pacific/Easter': 'CL', 'America/La_Paz': 'BO', 'America/Lima': 'PE',
    'America/Bogota': 'CO', 'America/Caracas': 'VE', 'America/Guayaquil': 'EC',
    'Pacific/Galapagos': 'EC', 'America/Sao_Paulo': 'BR', 'America/Bahia': 'BR',
    'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Manaus': 'BR',
    'America/Belem': 'BR', 'America/Cuiaba': 'BR', 'America/Porto_Velho': 'BR',
    'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX',
    'America/Cancun': 'MX', 'America/Merida': 'MX', 'America/Chihuahua': 'MX',
    'America/Hermosillo': 'MX', 'America/Mazatlan': 'MX',
    'America/Guatemala': 'GT', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN',
    'America/Managua': 'NI', 'America/Costa_Rica': 'CR', 'America/Panama': 'PA',
    'America/Havana': 'CU', 'America/Santo_Domingo': 'DO', 'America/Puerto_Rico': 'PR',
    'America/Port-au-Prince': 'HT', 'America/Paramaribo': 'SR', 'America/Guyana': 'GY',
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Detroit': 'US',
    'America/Anchorage': 'US', 'Pacific/Honolulu': 'US', 'America/Indiana': 'US',
    'America/Kentucky': 'US', 'America/Boise': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
    'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA',
    'America/Regina': 'CA',
    'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES',
    'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT',
    'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
    'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT',
    'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
    'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Athens': 'GR',
    'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
    'Europe/Istanbul': 'TR', 'Europe/Sofia': 'BG', 'Europe/Belgrade': 'RS',
    'Europe/Zagreb': 'HR', 'Europe/Bratislava': 'SK', 'Europe/Ljubljana': 'SI',
    'Europe/Vilnius': 'LT', 'Europe/Riga': 'LV', 'Europe/Tallinn': 'EE',
    'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
    'Asia/Seoul': 'KR', 'Asia/Taipei': 'TW', 'Asia/Singapore': 'SG',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Jakarta': 'ID',
    'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Ho_Chi_Minh': 'VN',
    'Asia/Dubai': 'AE', 'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL',
    'Asia/Riyadh': 'SA', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD',
    'Africa/Johannesburg': 'ZA', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG',
    'Africa/Nairobi': 'KE', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ',
    'Africa/Tunis': 'TN',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
    'Pacific/Auckland': 'NZ'
  };

  var NOMBRES = {
    AR: 'Argentina', UY: 'Uruguay', PY: 'Paraguay', CL: 'Chile', BO: 'Bolivia',
    PE: 'Perú', CO: 'Colombia', VE: 'Venezuela', EC: 'Ecuador', BR: 'Brasil',
    MX: 'México', GT: 'Guatemala', SV: 'El Salvador', HN: 'Honduras', NI: 'Nicaragua',
    CR: 'Costa Rica', PA: 'Panamá', CU: 'Cuba', DO: 'República Dominicana',
    PR: 'Puerto Rico', US: 'Estados Unidos', CA: 'Canadá', ES: 'España',
    PT: 'Portugal', FR: 'Francia', DE: 'Alemania', IT: 'Italia', GB: 'Reino Unido',
    IE: 'Irlanda', NL: 'Países Bajos', BE: 'Bélgica', CH: 'Suiza', AT: 'Austria',
    SE: 'Suecia', NO: 'Noruega', DK: 'Dinamarca', FI: 'Finlandia', PL: 'Polonia',
    RU: 'Rusia', UA: 'Ucrania', TR: 'Turquía', JP: 'Japón', CN: 'China',
    KR: 'Corea del Sur', IN: 'India', AU: 'Australia', NZ: 'Nueva Zelanda',
    ZA: 'Sudáfrica', IL: 'Israel'
  };

  function miPais() {
    var z = '';
    try { z = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (z) {
      if (ZONAS[z]) return ZONAS[z];
      /* America/Argentina/Salta y compañía: se prueba con los dos primeros
         tramos, que es como están en la tabla */
      var t = z.split('/');
      if (t.length > 2 && ZONAS[t[0] + '/' + t[1]]) return ZONAS[t[0] + '/' + t[1]];
    }
    var l = (navigator.language || '').split('-');
    if (l.length > 1 && /^[A-Za-z]{2}$/.test(l[l.length - 1])) {
      return l[l.length - 1].toUpperCase();
    }
    return '';
  }

  var PAIS = miPais();

  /* El emoji de bandera se arma con dos indicadores regionales. Windows no
     los dibuja —muestra las dos letras sueltas— así que se mide si el
     navegador los junta en un solo glifo. Si no puede, queda el código de
     dos letras, que se entiende igual. */
  var HAY_BANDERAS = (function () {
    try {
      var c = document.createElement('canvas').getContext('2d');
      if (!c) return false;
      c.font = '16px sans-serif';
      var ar = c.measureText('🇦🇷').width;
      var dos = c.measureText('AR').width;
      return ar > 0 && ar < dos * 1.8;
    } catch (e) { return false; }
  })();

  function bandera(cc) {
    if (!cc || cc.length !== 2) return '';
    if (!HAY_BANDERAS) return cc;
    return String.fromCharCode(0xD83C, 0xDDE6 + cc.charCodeAt(0) - 65,
                               0xD83C, 0xDDE6 + cc.charCodeAt(1) - 65);
  }

  function nombre(cc) { return NOMBRES[cc] || cc; }

  var caja = document.getElementById('online');
  var num  = document.getElementById('onlineN');
  var pais = document.getElementById('onlinePais');

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
    for (i = 0; i < metas.length; i++) {
      if (metas[i] && metas[i].phx_ref) r.push({ ref: metas[i].phx_ref, p: metas[i].p || '' });
    }
    return r;
  }

  function sumar(mapa) {
    for (var k in mapa) {
      var tiene = presentes[k] || (presentes[k] = { refs: [], p: '' });
      var llegan = marcas(mapa[k]);
      for (var i = 0; i < llegan.length; i++) {
        if (tiene.refs.indexOf(llegan[i].ref) < 0) tiene.refs.push(llegan[i].ref);
        if (llegan[i].p) tiene.p = llegan[i].p;
      }
    }
  }

  function restar(mapa) {
    for (var k in mapa) {
      var tiene = presentes[k];
      if (!tiene) continue;
      var salen = marcas(mapa[k]);
      for (var i = 0; i < salen.length; i++) {
        var d = tiene.refs.indexOf(salen[i].ref);
        if (d >= 0) tiene.refs.splice(d, 1);
      }
      if (!tiene.refs.length) delete presentes[k];
    }
  }

  /* Los países presentes, del más numeroso al menos. Los que no se
     pudieron determinar quedan afuera de la lista pero siguen contando
     en el total. */
  function porPais() {
    var cuenta = Object.create(null), k;
    for (k in presentes) {
      var p = presentes[k].p;
      if (p) cuenta[p] = (cuenta[p] || 0) + 1;
    }
    var lista = [];
    for (k in cuenta) lista.push([k, cuenta[k]]);
    lista.sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); });
    return lista;
  }

  function pintar() {
    if (!caja) return;
    var n = Object.keys(presentes).length;

    if (n >= MINIMO) {
      clearTimeout(ocultar); ocultar = null;
      if (num) num.textContent = n;

      var lista = porPais(), partes = [], detalle = [], i, sobran = 0;
      for (i = 0; i < lista.length; i++) {
        if (i < TOPE) {
          partes.push('<span class="online-pais-uno">' + bandera(lista[i][0]) +
                      '<b>' + lista[i][1] + '</b></span>');
        } else {
          sobran += lista[i][1];
        }
        detalle.push(lista[i][1] + ' de ' + nombre(lista[i][0]));
      }
      if (sobran) partes.push('<span class="online-pais-uno">+' + sobran + '</span>');
      if (pais) {
        pais.innerHTML = partes.join('');
        pais.classList.toggle('hay', partes.length > 0);
      }

      var texto = n + ' personas mirando el sitio ahora';
      if (detalle.length) texto += ': ' + detalle.join(', ');
      caja.setAttribute('aria-label', texto);
      caja.setAttribute('title', texto);
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
        payload: { type: 'presence', event: 'track', payload: { p: PAIS } }
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
