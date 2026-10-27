'use strict';
// Recovered from the earlier V10 discussion. 100 ml amounts were a proportional
// calculation, not a validated manufacturing formula. Do not enable automatic
// materials deduction until the live material IDs / package mapping are verified.
const RECIPES = Object.freeze({
  60: Object.freeze({essence:30,feromonas:3.5,fijador:5,perfumol:21.5}),
  100: Object.freeze({essence:50,feromonas:5.83,fijador:8.33,perfumol:35.84})
});
function requirements(size, quantity, packaging) {
  if(!RECIPES[size] || !Number.isSafeInteger(quantity) || quantity<1 || quantity>12)throw Error('Invalid presentation or quantity');
  if(!packaging || !packaging.bottle || !packaging.atomizer || !packaging.label)throw Error('Packaging mapping missing');
  const sums={};
  for(const id of [packaging.bottle,packaging.atomizer,packaging.label])sums[id]=(sums[id]||0)+quantity;
  for(const id of ['feromonas','fijador','perfumol'])sums[id]=Math.round(((sums[id]||0)+RECIPES[size][id]*quantity)*100)/100;
  return sums; // Essence is handled exclusively in payment reconciliation.
}
module.exports={RECIPES,requirements};
