// ============================================================
// Aula Catto — Edge Function: importar-estudiantes
// Crea cuentas de estudiantes en masa de forma SEGURA.
// La clave secreta (service_role) NO viaja al navegador: Supabase la
// inyecta acá del lado del servidor. El navegador solo manda la lista.
//
// Cómo desplegarla (una sola vez):
//   Supabase → Edge Functions → "Deploy a new function"
//   Nombre: importar-estudiantes
//   Pegá TODO este archivo y deshabilitá "Verify JWT" (la verificación
//   de profesor la hacemos nosotros dentro del código).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // 1) Verificar que quien llama es el PROFESOR
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData, error: uerr } = await admin.auth.getUser(jwt);
    if (uerr || !userData?.user) return json({ error: "No autenticado." }, 401);
    const { data: perfil } = await admin.from("perfil").select("rol").eq("id", userData.user.id).single();
    if (!perfil || perfil.rol !== "profesor") return json({ error: "Solo el profesor puede importar." }, 403);

    // 2) Datos de entrada
    const body = await req.json();
    const cursoId = body.curso_id;
    const dominio = body.dominio || "aula.catto.ar";
    const estudiantes = Array.isArray(body.estudiantes) ? body.estudiantes : [];
    if (!cursoId || !estudiantes.length) return json({ error: "Falta el curso o la lista está vacía." }, 400);

    // 3) Usuarios ya existentes (para no duplicar)
    const { data: existentes } = await admin.from("perfil").select("usuario");
    const usados = new Set((existentes || []).map((p) => p.usuario).filter(Boolean));

    const creados: any[] = [];
    const omitidos: any[] = [];

    for (const e of estudiantes) {
      const nombre = (e.nombre || "").trim();
      const apellido = (e.apellido || "").trim();
      if (!nombre && !apellido) { omitidos.push({ ...e, motivo: "sin datos" }); continue; }

      // usuario = apellido.primerNombre (sin acentos), con sufijo si está repetido
      const base = slug(apellido) + "." + slug(nombre.split(/\s+/)[0]);
      let usuario = base, n = 1;
      while (usados.has(usuario)) usuario = base + (++n);
      usados.add(usuario);

      const email = usuario + "@" + dominio;
      const password = genPass();

      const { data: created, error: cerr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { nombre, apellido },
      });
      if (cerr) { omitidos.push({ nombre, apellido, motivo: cerr.message }); continue; }

      const { error: perr } = await admin.from("perfil").insert({
        id: created.user!.id, rol: "estudiante", nombre, apellido, usuario, curso_id: cursoId,
      });
      if (perr) {
        // revertir el usuario de Auth si falló el perfil
        await admin.auth.admin.deleteUser(created.user!.id);
        omitidos.push({ nombre, apellido, motivo: "perfil: " + perr.message });
        continue;
      }
      creados.push({ nombre, apellido, usuario, password });
    }

    return json({ creados, omitidos });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function slug(s: string) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function genPass() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789"; // sin caracteres ambiguos (0/O, 1/l)
  let p = ""; for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}
