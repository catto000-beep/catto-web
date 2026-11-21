/* catto.ar — Crea el cobro de un compilado en Mercado Pago.
   POST /api/comprar?p=cat3  →  { orden, pago }  (pago: dirección del checkout)

   En producción (https), Mercado Pago devuelve al comprador a la página
   del producto. En local no se puede: Mercado Pago no acepta direcciones
   localhost como retorno, y la página consulta el estado por su cuenta. */
"use strict";
const crypto = require("crypto");
const { PRODUCTOS, mp, json, consulta, origen } = require("./_tienda");

module.exports = async (req, res) => {
  if(req.method !== "POST") return json(res, 405, { error: "Usá POST" });
  const p = consulta(req).p;
  const prod = PRODUCTOS[p];
  if(!prod) return json(res, 404, { error: "No existe ese producto" });

  const base = origen(req);
  const cuerpo = {
    type: "online",
    processing_mode: "manual",
    total_amount: prod.precio,
    external_reference: p + "-" + crypto.randomBytes(9).toString("hex"),   /* Mercado Pago solo admite letras, números, guiones */
    description: prod.titulo,
    items: [{ title: prod.titulo, description: prod.descripcion, unit_price: prod.precio, quantity: 1 }]
  };
  if(base.startsWith("https://")){
    const vuelta = base + "/tienda/" + p + "?vuelta=1";
    cuerpo.config = { online: { success_url: vuelta, failure_url: vuelta, pending_url: vuelta, auto_return: "approved" } };
  }
  try {
    const orden = await mp("POST", "/v1/orders", cuerpo);
    return json(res, 200, { orden: orden.id, pago: orden.checkout_url });
  } catch(e) {
    console.error("comprar:", e.message, e.cause ? String(e.cause.code || e.cause.message || e.cause) : "", JSON.stringify(e.detalle || {}));
    return json(res, 502, { error: "No se pudo crear el cobro", detalle: e.detalle && e.detalle.errors });
  }
};
