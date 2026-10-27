'use strict';
// 60 ml: receta confirmada por Héctor el 27/10/2026 = la configurada en la administración
// (cfg.gesencia 30, gfijador 6, gferomonas 3.5, gperfumol 21.5).
// 100 ml: cálculo proporcional recuperado, NO validado; la venta de 100 ml está apagada
// (enabledSizes=[60]) hasta que existan envase de 100 ml y receta confirmados.
// La receta efectiva viaja en instinto_private/runtime.recipes (verified:true) y se guarda por unidad.
const RECIPES = Object.freeze({
  60: Object.freeze({essence:30,feromonas:3.5,fijador:6,perfumol:21.5}),
  100: Object.freeze({essence:50,feromonas:5.83,fijador:8.33,perfumol:35.84})
});
function requirements(size, quantity, packaging, recipe=RECIPES[size]) {
  if(!recipe || !Number.isSafeInteger(quantity) || quantity<1 || quantity>12)throw Error('Invalid presentation or quantity');
  if(!packaging || !packaging.bottle || !packaging.atomizer || packaging.label===undefined)throw Error('Packaging mapping missing');
  const sums={};
  // label === null: etiqueta sin control de inventario (decisión del propietario).
  for(const id of [packaging.bottle,packaging.atomizer,packaging.label].filter(Boolean))sums[id]=(sums[id]||0)+quantity;
  for(const id of ['feromonas','fijador','perfumol'])sums[id]=Math.round(((sums[id]||0)+recipe[id]*quantity)*100)/100;
  return sums; // Essence is handled exclusively in payment reconciliation.
}
module.exports={RECIPES,requirements};
