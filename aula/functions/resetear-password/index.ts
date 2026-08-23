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

const ORIGENES = new Set(["https://catto.ar", "https://www.catto.ar"]);

// Solo se le responde a catto.ar. Hoy no hay CSRF posible porque el JWT viaja
// en una cabecera y otro sitio no puede obtenerlo, pero acotarlo no cuesta nada.
function corsDe(req: Request) {
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGENES.has(o) ? o : "https://catto.ar",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const cors = corsDe(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // Verificar que quien llama es el profesor
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData, error: uerr } = await admin.auth.getUser(jwt);
    if (uerr || !userData?.user) return json(cors, { error: "No autenticado." }, 401);
    const { data: perfil } = await admin.from("perfil").select("rol").eq("id", userData.user.id).single();
    if (!perfil || perfil.rol !== "profesor") return json(cors, { error: "Solo el profesor puede resetear." }, 403);

    const body = await req.json();
    const estudianteId = body.estudiante_id;
    if (!estudianteId) return json(cors, { error: "Falta el estudiante." }, 400);

    // El destino tiene que ser un estudiante (no otro profesor)
    const { data: target } = await admin.from("perfil").select("rol").eq("id", estudianteId).single();
    if (!target || target.rol !== "estudiante") return json(cors, { error: "El destino no es un estudiante." }, 400);

    const password = genPass();
    const { error: cerr } = await admin.auth.admin.updateUserById(estudianteId, { password });
    if (cerr) return json(cors, { error: cerr.message }, 500);

    return json(cors, { password });
  } catch (err) {
    return json(cors, { error: String((err as Error)?.message || err) }, 500);
  }
});

function json(cors: Record<string, string>, obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function genPass() {
  // crypto.getRandomValues, no Math.random: Math.random no es criptografico y
  // su estado se puede reconstruir observando salidas. El rechazo por modulo
  // se evita porque 256 es multiplo de 32, el largo del alfabeto.
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let p = "";
  for (let i = 0; i < bytes.length; i++) p += chars[bytes[i] % chars.length];
  return p;
}
