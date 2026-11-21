/* catto.ar — ¿Se pagó la orden? Si está pagada y acreditada, devuelve el
   enlace de descarga firmado.
   GET /api/verificar?p=cat3&o=<id de la orden>
     → { estado: "pagado", descarga }  |  { estado: "sin pagar" | "pendiente" | "rechazado" }

   El estado se consulta siempre a Mercado Pago: nunca se cree lo que diga
   la dirección de retorno ni el navegador del comprador. */
"use strict";
const { PRODUCTOS, mp, estadoLegible, enlace, json, consulta } = require("./_tienda");

module.exports = async (req, res) => {
  const { p, o } = consulta(req);
  if(!PRODUCTOS[p] || !o || !/^[A-Za-z0-9_-]{6,80}$/.test(o)) return json(res, 400, { error: "Datos incompletos" });
  try {
    const orden = await mp("GET", "/v1/orders/" + encodeURIComponent(o));
    /* la orden tiene que ser de este producto */
    if(!String(orden.external_reference || "").startsWith(p + "-")) return json(res, 404, { error: "Orden de otro producto" });
    const estado = estadoLegible(orden);
    if(estado === "pagado") return json(res, 200, { estado, descarga: enlace(p, o) });
    return json(res, 200, { estado });
  } catch(e) {
    if(e.codigo === 404) return json(res, 404, { error: "No existe la orden" });
    console.error("verificar:", e.message, JSON.stringify(e.detalle || {}));
    return json(res, 502, { error: "No se pudo consultar el pago" });
  }
};
