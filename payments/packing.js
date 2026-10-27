'use strict';
// Owner supplied weights, interpreted as packed weights from the preceding question.
// Box dimensions remain provisional; callers must supply a verified server config.
const PACKED_GRAMS=Object.freeze({60:250,100:299});
function packCart(lines,boxes) {
  if(!Array.isArray(lines)||!lines.length||lines.length>12)throw Error('invalid_cart');
  const parcels=[];
  for(const line of lines) {
    if(!line||![60,100].includes(line.sizeMl)||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>12)throw Error('invalid_cart');
    if(parcels.length+line.quantity>12)throw Error('too_many_parcels');
    const box=boxes?.[line.sizeMl];
    if(!box||box.verified!==true)throw Error('packing_not_verified');
    for(const key of ['length','width','height'])if(!Number.isSafeInteger(box[key])||box[key]<1||box[key]>200)throw Error('invalid_box');
    for(let i=0;i<line.quantity;i++)parcels.push({length:box.length,width:box.width,height:box.height,weight:PACKED_GRAMS[line.sizeMl]/1000});
  }
  return parcels;
}
module.exports={PACKED_GRAMS,packCart};
