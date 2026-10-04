/* ============================================================
   catto.ar — Foro: código compartido por todas las páginas
   ------------------------------------------------------------
   Usa el mismo proyecto de Supabase que el Aula, pero con su propia
   sesión (storageKey distinta): entrar o salir del foro no afecta al
   Aula. Las reglas de seguridad viven en la base (foro/db/02-foro.sql);
   esta página solo muestra y envía.
   Los mensajes se escriben en un Markdown reducido y seguro: primero se
   escapa todo el HTML y después se aplican negrita, cursiva, código,
   enlaces http(s) y fórmulas entre $...$ o $$...$$ con KaTeX.
   ============================================================ */
(function () {
  'use strict';
  var C = window.AULA_CONFIG;
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, {
    auth: { storageKey: 'catto-foro', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });

  var CURSOS = ['Tecnicatura 4.º año', 'Tecnicatura 5.º año', 'Tecnicatura 6.º año', 'Tecnicatura 7.º año',
    'Ingeniería nivel 1', 'Ingeniería nivel 2', 'Ingeniería nivel 3', 'Ingeniería nivel 4',
    'Ingeniería nivel 5', 'Ingeniería nivel 6', 'Docente', 'Otro'];

  /* Solo se muestran imágenes guardadas en el almacenamiento del foro */
  var BASE_IMG = C.SUPABASE_URL + '/storage/v1/object/public/foro/';
  var IMG = new RegExp('!\\[([^\\]\\n]*)\\]\\((' + BASE_IMG.replace(/[.\/]/g, '\\$&') + '[A-Za-z0-9\\/_.-]+)\\)', 'g');

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function q(nombre) { return new URLSearchParams(location.search).get(nombre); }

  /* Markdown reducido. Las fórmulas se apartan antes para que los * y _
     de LaTeX no se conviertan en cursivas, y se devuelven intactas. */
  function md(texto) {
    var formulas = [];
    var s = esc(texto).replace(/\r/g, '');
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, function (m) { formulas.push(m); return '\u0000' + (formulas.length - 1) + '\u0000'; });
    s = s.replace(/\$([^$\n]+?)\$/g, function (m) { formulas.push(m); return '\u0000' + (formulas.length - 1) + '\u0000'; });
    var bloques = [];
    s = s.replace(/```\n?([\s\S]*?)```/g, function (m, c) { bloques.push('<pre><code>' + c.replace(/\n$/, '') + '</code></pre>'); return '\u0001' + (bloques.length - 1) + '\u0001'; });
    s = s.replace(IMG, '<a href="$2" target="_blank" rel="noopener"><img src="$2" alt="$1" loading="lazy"></a>')
         .replace(/`([^`\n]+)`/g, '<code>$1</code>')
         .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
         .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
         .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="nofollow ugc noopener" target="_blank">$1</a>');
    s = s.split(/\n{2,}/).map(function (p) {
      if (/^\u0001\d+\u0001$/.test(p.trim())) return p.trim();
      return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('');
    s = s.replace(/\u0001(\d+)\u0001/g, function (m, i) { return bloques[+i]; });
    s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) { return formulas[+i]; });
    return s;
  }

  function formulas(el) {
    if (!el || !window.renderMathInElement) return;
    window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false, strict: false
    });
  }

  function hace(fecha) {
    var s = (Date.now() - new Date(fecha).getTime()) / 1000;
    if (s < 60) return 'recién';
    if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
    if (s < 86400 * 30) { var d = Math.floor(s / 86400); return 'hace ' + d + (d === 1 ? ' día' : ' días'); }
    return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* Traduce los errores de la base a mensajes legibles */
  function error(e) {
    var m = (e && (e.message || e.error_description)) || String(e);
    if (/foro_perfil_alias_key|duplicate key.*alias/.test(m)) return 'Ese alias ya está en uso. Elegí otro.';
    if (/alias_check|foro_perfil_alias_check/.test(m)) return 'El alias admite de 3 a 20 letras minúsculas, números, punto o guion bajo.';
    if (/titulo_check/.test(m)) return 'El título tiene que tener entre 10 y 150 caracteres.';
    if (/cuerpo_check/.test(m)) return 'El texto es demasiado corto o demasiado largo.';
    if (/relation .* does not exist|Could not find the table/.test(m)) return 'El foro todavía no está habilitado.';
    if (/Failed to fetch|NetworkError/.test(m)) return 'No hay conexión con el servidor. Probá de nuevo en un momento.';
    if (/Bucket not found/i.test(m)) return 'Las imágenes todavía no están habilitadas.';
    if (/foro_editar_tema/.test(m) && /Could not find|does not exist/.test(m)) return 'La edición todavía no está habilitada.';
    if (/row-level security/i.test(m)) return 'No se pudo subir la imagen: puede que se haya alcanzado el límite de 10 imágenes por hora.';
    if (/exceeded the maximum allowed size|Payload too large/i.test(m)) return 'La imagen pesa más de 2 MB.';
    return m;
  }

  /* Estado de la sesión: usuario de Supabase y perfil del foro */
  var cache = null;
  function estado() {
    if (cache) return cache;
    cache = sb.auth.getSession().then(function (r) {
      var u = r.data && r.data.session ? r.data.session.user : null;
      if (!u) return { usuario: null, perfil: null };
      return sb.from('foro_perfil').select('*').eq('id', u.id).maybeSingle().then(function (p) {
        return { usuario: u, perfil: p.data || null };
      });
    });
    return cache;
  }

  /* Barra superior del foro: quién está y accesos */
  function barra() {
    var el = $('foroBarra');
    if (!el) return Promise.resolve();
    return estado().then(function (s) {
      var h = '<a href="/foro">Foro</a>';
      if (s.perfil) {
        if (s.perfil.rol === 'moderador') h += '<a href="/foro/moderar">Moderación</a>';
        h += '<a href="/foro/nueva" class="fb-primario">Nueva consulta</a>';
        h += '<a href="/foro/perfil" class="fb-yo">' + esc(s.perfil.alias) + '</a>';
      } else if (s.usuario) {
        h += '<a href="/foro/perfil" class="fb-primario">Completar perfil</a>';
      } else {
        h += '<a href="/foro/ingresar?volver=' + encodeURIComponent(location.pathname + location.search) + '" class="fb-primario">Ingresar</a>';
      }
      el.innerHTML = h;
    });
  }

  /* Si hace falta sesión y perfil, redirige; devuelve el estado */
  function exigir(conPerfil) {
    return estado().then(function (s) {
      if (!s.usuario) { location.href = '/foro/ingresar?volver=' + encodeURIComponent(location.pathname + location.search); return null; }
      if (conPerfil && !s.perfil) { location.href = '/foro/perfil?volver=' + encodeURIComponent(location.pathname + location.search); return null; }
      return s;
    });
  }

  /* Imágenes: el navegador las reduce a 1600 px de lado (fondo blanco
     para las PNG transparentes) y las sube a foro/{id del usuario}/. */
  function reducir(file) {
    return new Promise(function (ok, mal) {
      var u = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var M = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, M / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        var tipo = c.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'image/webp' : 'image/jpeg';
        c.toBlob(function (b) { if (b) ok({ blob: b, tipo: tipo }); else mal(new Error('No se pudo procesar la imagen.')); }, tipo, 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(u); mal(new Error('Ese archivo no es una imagen que el navegador pueda leer.')); };
      img.src = u;
    });
  }
  function subirImagen(file) {
    if (!file || !/^image\/(jpeg|png|webp|gif|bmp)$/.test(file.type)) return Promise.reject(new Error('Elegí una imagen JPG, PNG o WebP.'));
    if (file.size > 15e6) return Promise.reject(new Error('La imagen es demasiado grande (más de 15 MB).'));
    return estado().then(function (s) {
      if (!s.usuario) throw new Error('Hace falta ingresar para subir imágenes.');
      return reducir(file).then(function (r) {
        if (r.blob.size > 2097152) throw new Error('Aun reducida, la imagen pesa más de 2 MB.');
        var nombre = s.usuario.id + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + (r.tipo === 'image/webp' ? '.webp' : '.jpg');
        return sb.storage.from('foro').upload(nombre, r.blob, { contentType: r.tipo, upsert: false }).then(function (x) {
          if (x.error) throw x.error;
          return sb.storage.from('foro').getPublicUrl(nombre).data.publicUrl;
        });
      });
    });
  }
  /* Borra todas las imágenes propias (antes de borrar la cuenta) */
  function borrarMisImagenes(uid) {
    return sb.storage.from('foro').list(uid, { limit: 1000 }).then(function (r) {
      if (r.error || !r.data || !r.data.length) return;
      return sb.storage.from('foro').remove(r.data.map(function (f) { return uid + '/' + f.name; }));
    });
  }

  /* Lista de temas (portada, categoría, perfil) */
  var SEL_TEMA = 'id,titulo,categoria,estado,resuelto,respuestas,actividad,pagina,autor:foro_perfil(alias)';
  function listaTemas(el, temas, nombres) {
    if (!temas || !temas.length) { el.innerHTML = '<p class="f-vacio">Todavía no hay consultas acá.</p>'; return; }
    el.innerHTML = '<ul class="f-lista">' + temas.map(function (t) {
      var et = '';
      if (t.estado === 'pendiente') et = '<span class="f-et pend">en revisión</span>';
      else if (t.estado === 'oculto') et = '<span class="f-et oc">oculta</span>';
      else if (t.resuelto) et = '<span class="f-et ok">resuelta</span>';
      var cat = nombres && nombres[t.categoria] ? esc(nombres[t.categoria]) + ' · ' : '';
      return '<li><div class="n"><b>' + t.respuestas + '</b>resp.</div>' +
        '<div class="t"><a href="/foro/tema?id=' + t.id + '">' + esc(t.titulo) + '</a>' + et +
        '<div class="meta">' + cat + esc(t.autor ? t.autor.alias : '') + ' · ' + hace(t.actividad) + '</div></div></li>';
    }).join('') + '</ul>';
  }

  window.Foro = { sb: sb, CURSOS: CURSOS, SEL_TEMA: SEL_TEMA, $: $, esc: esc, q: q, md: md, formulas: formulas, hace: hace, error: error, estado: estado, barra: barra, exigir: exigir, listaTemas: listaTemas, subirImagen: subirImagen, borrarMisImagenes: borrarMisImagenes };
  document.addEventListener('DOMContentLoaded', barra);
})();
