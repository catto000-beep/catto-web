/* catto.ar — Entrega el PDF de un compilado, solo con un enlace firmado
   y vigente (lo emite /api/verificar después de confirmar el pago).
   GET /api/archivo?p=cat3&o=<orden>&e=<vence>&s=<firma>

   El PDF está cifrado en /tienda/archivos/<producto>.bin; se descarga,
   se descifra acá y se entrega con su nombre. */
"use strict";
const { PRODUCTOS, enlaceValido, descifrar, consulta, origen } = require("./_tienda");

module.exports = async (req, res) => {
  const { p, o, e, s } = consulta(req);
  if(!enlaceValido(p, o, e, s)){
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("El enlace de descarga no es válido o ya venció. Volvé a la página de compra: si el pago está acreditado, se genera uno nuevo.");
  }
  try {
    const prod = PRODUCTOS[p];
    const r = await fetch(origen(req) + prod.archivo);
    if(!r.ok) throw new Error("No se encontró el archivo cifrado (" + r.status + ")");
    const pdf = descifrar(Buffer.from(await r.arrayBuffer()));
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="' + prod.nombre + '"');
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Cache-Control", "private, no-store");
    res.end(pdf);
  } catch(err) {
    console.error("archivo:", err.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("No se pudo preparar la descarga. Probá de nuevo en unos minutos.");
  }
};
