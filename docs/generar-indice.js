/* ============================================================
   catto.ar — Generador del índice del buscador
   Abre cada página del sitio en un navegador, recorre sus
   pestañas y guarda el texto visible en assets/js/buscador-datos.js.

   Hay que volver a correrlo cada vez que se agrega o se cambia una
   publicación:

       node docs/generar-indice.js

   Necesita Playwright (npm i -D playwright) y el sitio en el disco.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');

const RAIZ = path.resolve(__dirname, '..');
const SALIDA = path.join(RAIZ, 'assets/js/buscador-datos.js');
const TOPE = 2600;                    // caracteres de texto por entrada

/* páginas sueltas: archivo, url, título */
const SUELTAS = [
  ['index.html',        '/',           'Inicio'],
  ['descargas.html',    '/descargas',  'Descargas'],
  ['aula/index.html',   '/aula',       'Aula'],
];

/* Etiquetas que son acciones y no secciones: cambian lo que se ve pero no
   llevan a otra parte de la publicación. Salió de mirar el índice generado. */
const ACCIONES = /^(paus|seguir|seguí|volver|paso|disparar|borrar|reinici|generar|comprob|ver |mostrar|ocultar|siguiente|anterior|nuev|guardar|imprimir|deshacer|listo|empezar|copiar|descargar|calcular|limpiar|probar|reprodu|primera|última|ultima|dar vuelta|jugar|agregar|quitar|sumar|restar|azar|random)/i;

/* Se prueba sin los adornos de adelante (íconos, flechas, numeritos ①): si no,
   "▶ Disparar" o "🔎 Ver en el conversor" se escapan de la lista de acciones. */
function esAccion(etq){
  const pelado = etq.replace(/^[^\p{L}]+/u, '');
  return ACCIONES.test(pelado) || /[›»→←⏮⏭⏸▶↺↶⟳]/.test(etq);
}

function limpiar(t){
  return (t || '').replace(/\s+/g, ' ').trim().slice(0, TOPE);
}

/* huella del texto entero: dos secciones distintas de la misma página
   comparten el encabezado, así que no alcanza con mirar el principio */
function huella(t){
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return h + ':' + t.length;
}

/* saca de cada sección lo que todas tienen igual: el encabezado y el pie */
function sacarComun(textos){
  if (textos.length < 2) return textos;
  let pre = textos[0];
  for (const t of textos) {
    let i = 0;
    while (i < pre.length && i < t.length && pre[i] === t[i]) i++;
    pre = pre.slice(0, i);
  }
  let suf = textos[0];
  for (const t of textos) {
    let i = 0;
    while (i < suf.length && i < t.length &&
           suf[suf.length - 1 - i] === t[t.length - 1 - i]) i++;
    suf = suf.slice(suf.length - i);
  }
  if (pre.length < 12) pre = '';
  if (suf.length < 12) suf = '';
  return textos.map(t => t.slice(pre.length, suf ? t.length - suf.length : undefined).trim() || t);
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1400 } });
  const entradas = [];

  async function texto(){ return p.evaluate(() => document.body.innerText); }

  /* Recorre las pestañas de una publicación: para cada botón corto de la
     barra, hace clic y se queda con el texto que aparece.

     Los botones se vuelven a buscar por posición en cada vuelta porque hay
     publicaciones (ca-vectorial, por ejemplo) que rehacen la barra entera
     con innerHTML al cambiar de pestaña: los handles de antes quedan
     colgando y el clic siguiente falla.

     Tampoco se exige que el texto cambie: la primera pestaña ya viene
     activa, así que su clic no cambia nada y sin embargo es una sección.
     Alcanza con la huella para no guardarla dos veces. */
  async function porPestanas(url, titulo, base){
    const cuantos = (await p.$$('button')).length;
    const vistos = new Set();
    const crudas = [];
    let secciones = 0;

    for (let i = 0; i < cuantos; i++) {
      const botones = await p.$$('button');
      const btn = botones[i];
      if (!btn) continue;
      let etq = '';
      try { etq = (await btn.textContent() || '').replace(/\s+/g, ' ').trim(); } catch (e) { continue; }
      if (!etq || etq.length > 34) continue;
      if ((etq.match(/\p{L}/gu) || []).length < 3) continue;
      if (esAccion(etq)) continue;
      try { await btn.click({ timeout: 900 }); } catch (e) { continue; }
      await p.waitForTimeout(230);
      const ahora = await texto();
      const clave = huella(ahora);
      if (vistos.has(clave)) continue;               // ya la teníamos
      vistos.add(clave);
      const nombre = etq.replace(/^[^\p{L}\p{N}]+/u, '').trim() || ('Sección ' + (secciones + 1));
      crudas.push({ t: nombre, d: titulo, u: url, crudo: ahora });
      secciones++;
      if (secciones > 16) break;
    }
    const limpias = sacarComun(crudas.map(c => c.crudo));
    /* el texto de la publicación entera ya está guardado: si una pestaña
       repite lo mismo (publicaciones de una sola vista), no se duplica */
    const guardadas = [base || ''];
    crudas.forEach((c, i) => {
      const txt = limpiar(limpias[i]);
      /* si otra sección ya guardada empieza igual, es la misma vista con un
         botón cambiado: no se guarda dos veces */
      if (guardadas.some(g => g.slice(0, 220) === txt.slice(0, 220))) return;
      guardadas.push(txt);
      entradas.push({ t: c.t, d: c.d, u: c.u, x: txt });
    });
    return guardadas.length - 1;
  }

  /* publicaciones */
  const pubs = fs.readdirSync(path.join(RAIZ, 'publicaciones'))
                 .filter(d => fs.existsSync(path.join(RAIZ, 'publicaciones', d, 'index.html')));

  for (const dir of pubs) {
    const url = '/publicaciones/' + dir;
    await p.goto('file://' + path.join(RAIZ, 'publicaciones', dir, 'index.html'));
    await p.waitForTimeout(900);
    const titulo = limpiar(await p.title()).replace(/\s*·\s*catto\.ar\s*$/i, '');
    const primero = limpiar(await texto());
    entradas.push({ t: titulo, d: 'Publicación', u: url, x: primero });
    const n = await porPestanas(url, titulo, primero);
    console.log(String(dir).padEnd(28), '→', n, 'secciones');
  }

  /* páginas de tema del Mapa de la Tecnicatura: son HTML estáticos de una
     sola vista, pero muy largos, así que se indexa una entrada por sección
     (con su ancla) además de la portada. El equivalente de las pestañas. */
  const TEMAS = path.join(RAIZ, 'publicaciones/mapa-electronica/temas');
  if (fs.existsSync(TEMAS)) {
    const archivos = fs.readdirSync(TEMAS).filter(f => f.endsWith('.html')).sort();
    let secs = 0;
    for (const f of archivos) {
      await p.goto('file://' + path.join(TEMAS, f));
      await p.waitForTimeout(400);
      const titulo = limpiar(await p.title()).replace(/\s*·\s*Catto\s*$/i, '');
      const partes = titulo.split('·').map(x => x.trim());
      const tema = partes[0] || titulo;
      const materia = partes[1] || 'Tecnicatura en Electrónica';
      const base = '/publicaciones/mapa-electronica/temas/' + f.replace(/\.html$/, '');

      const datos = await p.evaluate(() => {
        const cab = document.querySelector('.doc');
        const portada = [...(cab ? cab.children : [])]
          .filter(e => !e.matches('section') && !e.matches('hr'))
          .map(e => e.innerText).join(' ');
        const secciones = [...document.querySelectorAll('.doc section[id]')].map(s => {
          const h2 = s.querySelector('h2');
          const t = h2 ? h2.innerText.replace(/^\d+\s*/, '').trim() : s.id;
          return { id: s.id, t, x: s.innerText };
        });
        return { portada, secciones };
      });

      entradas.push({ t: tema, d: 'Tema · ' + materia, u: base,
                      x: limpiar(datos.portada).slice(0, 900) });
      for (const s of datos.secciones) {
        const txt = limpiar(s.x).slice(0, 1600);
        if (txt.length < 80) continue;
        entradas.push({ t: s.t, d: tema + ' · ' + materia, u: base + '#' + s.id, x: txt });
        secs++;
      }
    }
    console.log('temas'.padEnd(28), '→', archivos.length, 'páginas ·', secs, 'secciones');
  }

  /* páginas sueltas */
  for (const [arch, url, titulo] of SUELTAS) {
    await p.goto('file://' + path.join(RAIZ, arch));
    await p.waitForTimeout(700);
    entradas.push({ t: titulo, d: 'Página', u: url, x: limpiar(await texto()) });
    console.log(String(arch).padEnd(28), '→ página');
  }

  /* descargas: cada archivo, por su nombre */
  const desc = path.join(RAIZ, 'descargas');
  if (fs.existsSync(desc)) {
    for (const f of fs.readdirSync(desc)) {
      if (!/\.(pdf|zip|docx?|xlsx?|epub)$/i.test(f)) continue;
      const kb = Math.round(fs.statSync(path.join(desc, f)).size / 1024);
      const lindo = f.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ');
      entradas.push({
        t: lindo.charAt(0).toUpperCase() + lindo.slice(1),
        d: 'Descarga · ' + f.split('.').pop().toUpperCase(),
        u: '/descargas/' + f,
        x: 'Archivo para descargar ' + f + ' ' + lindo + ' pdf descarga ' + kb + ' kB'
      });
    }
  }

  await b.close();

  const js = '/* Índice del buscador. Generado por docs/generar-indice.js — no editar a mano. */\n' +
             'window.CATTO_INDICE = ' + JSON.stringify(entradas) + ';\n';
  fs.writeFileSync(SALIDA, js);
  console.log('\n' + entradas.length + ' entradas · ' + Math.round(js.length / 1024) + ' kB → assets/js/buscador-datos.js');
})();
