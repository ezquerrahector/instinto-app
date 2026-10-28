'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {publicCatalog} = require('../payments/checkout');
const inv = cat => ({cat, peds: []});
test('public catalog exposes the olfactory profile only when captured', () => {
  const [a, b] = publicCatalog(inv([
    {id: 'CP1', disenador: 'DIOR', referencia: 'SAUVAGE', linea: 'Caballero', stockGramos: 60, costoEsencia: 2.8,
     familia: 'Fresca, Aromática', notasSalida: 'Bergamota', notasCorazon: 'Lavanda', notasFondo: 'Ambroxan', intensidad: 'Moderada', momento: 'Día y noche'},
    {id: 'DP1', disenador: 'DIOR', referencia: 'JADORE', linea: 'Dama', stockGramos: 60, familia: '  '}]), [60]);
  assert.deepEqual({family: a.family, top: a.top, heart: a.heart, base: a.base, intensity: a.intensity, moment: a.moment},
    {family: 'Fresca, Aromática', top: 'Bergamota', heart: 'Lavanda', base: 'Ambroxan', intensity: 'Moderada', moment: 'Día y noche'});
  assert.equal(a.costoEsencia, undefined); assert.equal(a.stockGramos, undefined);
  assert.equal('family' in b, false);
});
test('olfactory suggestions cover catalog spelling variants', () => {
  require('../assets/perfiles-olfativos.js');
  const P = globalThis.InstintoPerfiles;
  assert.equal(P.suggest({disenador: 'DOLCE & GABBANA', referencia: 'LIGHT BLUE', linea: 'Dama'}).familia, 'Fresca');
  assert.equal(P.suggest({disenador: 'ARMANI', referencia: 'S�', linea: 'Dama'}).intensidad, 'Moderada');
  assert.equal(P.suggest({disenador: 'VERSACE', referencia: 'EROS', linea: 'Dama'}).familia, 'Floral, Fresca');
  assert.equal(P.suggest({disenador: 'VERSACE', referencia: 'EROS', linea: 'Caballero'}).familia, 'Dulce, Aromática');
  assert.equal(P.suggest({disenador: 'MARCA', referencia: 'NO EXISTE'}), null);
});
