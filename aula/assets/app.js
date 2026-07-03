/* ============================================================
   Aula Catto — Núcleo compartido (cliente Supabase + sesión)
   Requiere que antes se carguen: supabase-js (CDN) y config.js
   ============================================================ */
const sb = supabase.createClient(window.AULA_CONFIG.SUPABASE_URL, window.AULA_CONFIG.SUPABASE_KEY);

/* Verifica sesión y rol. Si no corresponde, redirige. Devuelve {session, perfil}. */
async function requireAuth(rolEsperado){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ location.href = 'index.html'; return null; }
  const { data:perfil, error } = await sb.from('perfil').select('*').eq('id', session.user.id).single();
  if(error || !perfil){ await sb.auth.signOut(); location.href = 'index.html'; return null; }
  if(perfil.rol === 'estudiante' && perfil.activo === false){
    await sb.auth.signOut(); alert('Tu cuenta está desactivada. Consultá con el profesor.');
    location.href = 'index.html'; return null;
  }
  if(rolEsperado && perfil.rol !== rolEsperado){
    location.href = perfil.rol === 'profesor' ? 'profesor.html' : 'estudiante.html';
    return null;
  }
  return { session, perfil };
}

async function logout(){ await sb.auth.signOut(); location.href = 'index.html'; }

/* Utilidades */
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g, c=>(
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function iniciales(nombre, apellido){
  return ((nombre||'?')[0] + (apellido||'')[0]||'').toUpperCase(); }
function fechaTxt(f){
  if(!f) return 'Sin fecha límite';
  const d = new Date(f+'T00:00:00');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const dias = Math.round((d-hoy)/86400000);
  const s = d.toLocaleDateString('es-AR',{day:'2-digit',month:'short'});
  if(dias < 0) return 'Venció '+s;
  if(dias === 0) return 'Vence hoy';
  return `Vence ${s}${dias<=4?` · ${dias}d`:''}`;
}
/* ¿venció la fecha límite? (null = nunca vence) */
function vencida(f){ return !!f && new Date(f+'T23:59:59') < new Date(); }

/* Extrae el ID de un video de YouTube desde varias formas de URL */
function ytId(url){
  if(!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}
/* Nombre de archivo seguro */
function safeName(n){ return (n||'archivo').replace(/[^\w.\-]+/g,'_').slice(-60); }
/* Nombre a mostrar de un archivo {path,nombre}. Si no hay nombre real (entrega vieja),
   lo deriva de la ruta quitando los prefijos "idActividad_timestamp_(indice_)". */
function nombreArchivo(a){
  if(a && a.nombre && !/^archivo$/i.test(a.nombre)) return a.nombre;
  const base = ((a && a.path) || '').split('/').pop() || '';
  return base.replace(/^\d+_\d+_(\d+_)?/, '') || base || 'Archivo';
}
/* URL temporal firmada para un archivo privado */
async function signedUrl(bucket, path, secs=120){
  if(!path) return null;
  const { data } = await sb.storage.from(bucket).createSignedUrl(path, secs);
  return data ? data.signedUrl : null;
}
/* Sube (o reemplaza) un archivo y devuelve el path.
   Antes de subir renueva la sesión (las clases largas la vencen) y, si
   igual falla por permisos, da un mensaje claro en vez del error críptico. */
async function subirArchivo(bucket, path, file){
  const { data:{ session } } = await sb.auth.getSession();   // refresca el token si venció
  if(!session){
    alert('Tu sesión expiró. Volvé a ingresar y probá de nuevo (tu trabajo no se pierde).');
    location.href = 'index.html';
    throw new Error('Sesión expirada');
  }
  const { error } = await sb.storage.from(bucket).upload(path, file, { upsert:true });
  if(error){
    if(/row-level security/i.test(error.message||'')){
      throw new Error('No se pudo subir: tu sesión expiró o no tenés permiso. Salí con "Salir", volvé a ingresar y reintentá.');
    }
    throw error;
  }
  return path;
}
