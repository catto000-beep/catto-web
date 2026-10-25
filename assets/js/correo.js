/* Enlaces de correo (mailto:): en muchas computadoras no hay un programa de correo configurado y
   el clic no hace nada. Se abre un cuadro con la dirección, un botón para copiarla y otro para
   escribir desde Gmail; «programa de correo» sigue disponible para quien lo tenga. */
(function () {
  'use strict';
  var EN = (document.documentElement.lang || '').indexOf('en') === 0;
  var T = EN ? { tit: 'Write to me', copiar: 'Copy address', copiado: 'Copied ✓', gmail: 'Write from Gmail', prog: 'Open my mail app', cerrar: 'Close' }
             : { tit: 'Escribime', copiar: 'Copiar dirección', copiado: 'Copiada ✓', gmail: 'Escribir desde Gmail', prog: 'Abrir mi programa de correo', cerrar: 'Cerrar' };
  var css = '.cr-fondo{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:grid;place-items:center;padding:16px}' +
    '.cr-caja{background:#161b22;border:1px solid #2a3140;border-radius:14px;padding:20px 22px;max-width:420px;width:100%;color:#e6edf3;font:14px "Segoe UI",system-ui,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.5)}' +
    '.cr-caja h4{margin:0 0 4px;font-size:17px}.cr-caja .cr-asunto{color:#9aa7b4;font-size:12.5px;margin:0 0 10px}' +
    '.cr-dir{display:block;font:15px Consolas,monospace;background:#0b0f16;border:1px solid #2a3140;border-radius:8px;padding:9px 11px;margin-bottom:12px;user-select:all;word-break:break-all}' +
    '.cr-bt{display:flex;flex-direction:column;gap:7px}.cr-bt a,.cr-bt button{display:block;text-align:center;padding:9px 12px;border-radius:9px;border:1px solid #2a3140;background:#1c2230;color:#e6edf3;font:inherit;cursor:pointer;text-decoration:none}' +
    '.cr-bt .pri{background:#1f6feb;border-color:#58a6ff}.cr-bt a:hover,.cr-bt button:hover{border-color:#58a6ff}.cr-x{margin-top:10px;background:none!important;border:0!important;color:#9aa7b4!important}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function abrir(href) {
    var u = href.replace(/^mailto:/, ''), dir = decodeURIComponent(u.split('?')[0]);
    var q = new URLSearchParams(u.split('?')[1] || ''), asunto = q.get('subject') || '', cuerpo = q.get('body') || '';
    var gm = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(dir) +
             (asunto ? '&su=' + encodeURIComponent(asunto) : '') + (cuerpo ? '&body=' + encodeURIComponent(cuerpo) : '');
    var f = document.createElement('div'); f.className = 'cr-fondo';
    f.innerHTML = '<div class="cr-caja" role="dialog" aria-modal="true" aria-label="' + T.tit + '"><h4>' + T.tit + '</h4>' +
      (asunto ? '<p class="cr-asunto">' + asunto.replace(/</g, '&lt;') + '</p>' : '') +
      '<span class="cr-dir"></span><div class="cr-bt"><button type="button" class="pri cr-copiar">' + T.copiar + '</button>' +
      '<a target="_blank" rel="noopener" class="cr-gm">' + T.gmail + '</a><a class="cr-prog">' + T.prog + '</a>' +
      '<button type="button" class="cr-x">' + T.cerrar + '</button></div></div>';
    f.querySelector('.cr-dir').textContent = dir;
    f.querySelector('.cr-gm').href = gm; f.querySelector('.cr-prog').href = href;
    function cerrar() { f.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') cerrar(); }
    f.addEventListener('click', function (e) { if (e.target === f || e.target.classList.contains('cr-x')) cerrar(); });
    document.addEventListener('keydown', esc);
    f.querySelector('.cr-copiar').onclick = function () {
      var b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(dir) : Promise.reject()).then(function () { b.textContent = T.copiado; }, function () {
        var r = document.createRange(); r.selectNodeContents(f.querySelector('.cr-dir')); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
      });
    };
    document.body.appendChild(f); f.querySelector('.cr-copiar').focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a || a.closest('.cr-caja')) return;
    e.preventDefault(); abrir(a.getAttribute('href'));
  });
})();
