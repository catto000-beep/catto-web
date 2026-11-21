/* ══════════════════════════════════════════════════════════════════
   catto.ar — Tienda de compilados: lo común a las funciones de /api
   ------------------------------------------------------------------
   Cobro con Mercado Pago (Checkout Pro, API de Órdenes) y entrega del
   PDF con un enlace firmado que vence.

   Variables de entorno (en local, catto-web/.env.local; en Vercel, las
   del proyecto). Nunca van al repositorio:
     MP_ACCESS_TOKEN     credencial de Mercado Pago (de prueba o real)
     DESCARGA_SECRETO    firma los enlaces de descarga
     COMPILADOS_CLAVE    descifra los PDF (32 bytes en base64)

   Los PDF viajan cifrados (AES-256-GCM) en /tienda/archivos/*.bin: el
   archivo es público, pero sin la clave no sirve.
   ══════════════════════════════════════════════════════════════════ */
"use strict";
const crypto = require("crypto");

/* El catálogo. Precio decidido el 15/11/2026: $10.000 cada compilado en castellano
   (en inglés se venden por Lemon Squeezy, a 10 dólares). */
const PRODUCTOS = {
  cat3: {
    titulo: "Instalador Electricista Habilitado · Categoría III",
    descripcion: "Compilado de estudio en PDF (catto.ar)",
    precio: "10000.00",
    archivo: "/tienda/archivos/cat3.bin",
    nombre: "catto-instalador-categoria-III.pdf"
  },
  analogica1: {
    titulo: "Electrónica Analógica I · 4.º año",
    descripcion: "Compilado de estudio en PDF (catto.ar)",
    precio: "10000.00",
    archivo: "/tienda/archivos/analogica1.bin",
    nombre: "catto-electronica-analogica-I.pdf"
  },
  electrotecnia: {
    titulo: "Electrotecnia · 4.º año",
    descripcion: "Compilado de estudio en PDF (catto.ar)",
    precio: "10000.00",
    archivo: "/tienda/archivos/electrotecnia.bin",
    nombre: "catto-electrotecnia.pdf"
  }
};

const MP = "https://api.mercadopago.com";
const HORAS_ENLACE = 6;

function env(nombre){
  const v = process.env[nombre];
  if(!v) throw new Error("Falta la variable de entorno " + nombre);
  return v;
}

async function mp(metodo, ruta, cuerpo){
  const r = await fetch(MP + ruta, {
    method: metodo,
    headers: {
      "Authorization": "Bearer " + env("MP_ACCESS_TOKEN"),
      "Content-Type": "application/json",
      ...(metodo === "POST" ? { "X-Idempotency-Key": crypto.randomUUID() } : {})
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const datos = await r.json().catch(() => ({}));
  if(!r.ok){
    const e = new Error("Mercado Pago respondió " + r.status);
    e.detalle = datos; e.codigo = r.status;
    throw e;
  }
  return datos;
}

/* ¿La orden está pagada y acreditada por el total? Se mira la orden y
   sus pagos, y que el monto pagado cubra el precio. */
function estaPagada(orden){
  const pagos = (orden.transactions && orden.transactions.payments) || [];
  const acreditado = orden.status_detail === "accredited" ||
    pagos.some(p => p.status_detail === "accredited");
  const pagado = Number(orden.total_paid_amount || 0) >= Number(orden.total_amount || Infinity);
  return acreditado && pagado;
}

function estadoLegible(orden){
  if(estaPagada(orden)) return "pagado";
  const pagos = (orden.transactions && orden.transactions.payments) || [];
  if(pagos.some(p => /rejected|cancelled|failed/.test((p.status || "") + (p.status_detail || "")))) return "rechazado";
  if(orden.status === "action_required" || pagos.some(p => /pending|in_process|waiting/.test((p.status || "") + (p.status_detail || "")))) return "pendiente";
  return "sin pagar";
}

/* Enlace de descarga: producto, orden y vencimiento, firmados. */
function firmar(producto, orden, vence){
  return crypto.createHmac("sha256", env("DESCARGA_SECRETO"))
    .update(producto + "." + orden + "." + vence).digest("base64url");
}
function enlace(producto, orden){
  const vence = Math.floor(Date.now() / 1000) + HORAS_ENLACE * 3600;
  const q = new URLSearchParams({ p: producto, o: orden, e: String(vence), s: firmar(producto, orden, vence) });
  return "/api/archivo?" + q.toString();
}
function enlaceValido(p, o, e, s){
  if(!PRODUCTOS[p] || !o || !e || !s) return false;
  if(Number(e) < Date.now() / 1000) return false;
  const bien = Buffer.from(firmar(p, o, e)), dado = Buffer.from(String(s));
  return bien.length === dado.length && crypto.timingSafeEqual(bien, dado);
}

/* Cifrado del PDF: iv (12 bytes) + etiqueta (16) + contenido. */
function clave(){ return Buffer.from(env("COMPILADOS_CLAVE"), "base64"); }
function cifrar(buf){
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", clave(), iv);
  const datos = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), datos]);
}
function descifrar(buf){
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), datos = buf.subarray(28);
  const d = crypto.createDecipheriv("aes-256-gcm", clave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]);
}

/* Respuestas */
function json(res, codigo, datos){
  res.statusCode = codigo;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(datos));
}
function consulta(req){
  if(req.query) return req.query;
  return Object.fromEntries(new URL(req.url, "http://x").searchParams);
}
function origen(req){
  const proto = req.headers["x-forwarded-proto"] || (/^(localhost|127\.)/.test(req.headers.host || "") ? "http" : "https");
  return proto + "://" + req.headers.host;
}

module.exports = { PRODUCTOS, mp, estaPagada, estadoLegible, enlace, enlaceValido, cifrar, descifrar, json, consulta, origen };
