'use strict';
// Disponibilidad compartida Web/Directo. Replica exactamente calcularStockPedidos() de la
// administración: los pedidos pendientes (Pedido / Comprado proveedor) que aún NO descontaron
// esencia "apartan" cfg.gesencia gramos en orden de folio. La tienda solo puede vender lo que
// queda después de esos apartados. Los pedidos Web ya descontaron su esencia (esenciaDescontada).
const PENDING = new Set(['Pedido', 'Comprado proveedor']);
function pendingClaims(inventory) {
  const cat = Array.isArray(inventory?.cat) ? inventory.cat : [];
  const peds = Array.isArray(inventory?.peds) ? inventory.peds : [];
  const perOrder = Number(inventory?.cfg?.gesencia);
  const grams = Number.isFinite(perOrder) && perOrder > 0 ? perOrder : 30;
  const temp = new Map(cat.map(x => [x.id, Math.max(0, Number(x.stockGramos) || 0)]));
  const claimed = new Map();
  [...peds].filter(p => p && PENDING.has(p.estatus) && p.cliente !== 'Para stock' && p.esenciaDescontada !== true)
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
    .forEach(p => {
      if (!temp.has(p.codigo)) return;
      if (temp.get(p.codigo) >= grams) {
        temp.set(p.codigo, temp.get(p.codigo) - grams);
        claimed.set(p.codigo, (claimed.get(p.codigo) || 0) + grams);
      }
    });
  return {available: temp, claimed};
}
function availableGrams(inventory, id) {
  return pendingClaims(inventory).available.get(id) ?? 0;
}
module.exports = {pendingClaims, availableGrams};
