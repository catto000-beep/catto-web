// ============================================================
// Aula Catto — Edge Function: resetear-password
// Genera una contraseña nueva para un estudiante. Solo el profesor.
// La clave secreta la inyecta Supabase del lado del servidor.
//
// Desplegar (una vez):
//   Supabase → Edge Functions → "Deploy a new function"
//   Nombre: resetear-password
//   Pegá TODO este archivo y deshabilitá "Verify JWT".
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

    // Verificar que quien llama es el profesor
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData, error: uerr } = await admin.auth.getUser(jwt);
    if (uerr || !userData?.user) return json({ error: "No autenticado." }, 401);
    const { data: perfil } = await admin.from("perfil").select("rol").eq("id", userData.user.id).single();
    if (!perfil || perfil.rol !== "profesor") return json({ error: "Solo el profesor puede resetear." }, 403);

    const body = await req.json();
    const estudianteId = body.estudiante_id;
    if (!estudianteId) return json({ error: "Falta el estudiante." }, 400);

    // El destino tiene que ser un estudiante (no otro profesor)
    const { data: target } = await admin.from("perfil").select("rol").eq("id", estudianteId).single();
    if (!target || target.rol !== "estudiante") return json({ error: "El destino no es un estudiante." }, 400);

    const password = genPass();
    const { error: cerr } = await admin.auth.admin.updateUserById(estudianteId, { password });
    if (cerr) return json({ error: cerr.message }, 500);

    return json({ password });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function genPass() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let p = ""; for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}
