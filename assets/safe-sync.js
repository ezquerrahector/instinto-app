/* Shared by the browser and Node tests. No Firebase credentials or network access. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InstintoSafeSync = api;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const canonical = value => JSON.stringify(sort(value));
  function sort(value) {
    if (value && typeof value.toJSON === 'function') return sort(value.toJSON());
    if (Array.isArray(value)) return value.map(sort);
    if (value && typeof value === 'object') return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, sort(value[key])]));
    return value;
  }
  function conflict(message) {
    const error = new Error(message);
    error.code = 'instinto/conflict';
    return error;
  }
  // Compare the actual document, not only a revision: legacy clients do not
  // increment revisions. The compare and update must run inside a transaction.
  function checkedUpdate(base, remote, desired, writeId, now) {
    if (!base || !remote) throw conflict('Carga los datos del servidor antes de guardar.');
    if (canonical(base) !== canonical(remote)) {
      throw conflict('Otro colaborador modificó los datos. Tus cambios se conservaron para revisión.');
    }
    const revision = remote.syncRevision ?? 0;
    if (!Number.isSafeInteger(revision) || revision < 0 || revision >= Number.MAX_SAFE_INTEGER) {
      throw conflict('La revisión del servidor no es válida.');
    }
    return {...remote, ...clone(desired), syncRevision: revision + 1,
      syncClient: 'v10', lastWriteId: writeId, updatedAt: now};
  }
  // Fusión de tres vías (base común, cambios locales, servidor). Se usa cuando el documento cambió
  // en el servidor entre la última lectura y el guardado: otro colaborador, la tienda en línea
  // (reservas/liberación de esencia) o el servidor (estado de pedidos Web). Solo se combinan
  // cambios que no chocan; en contadores de existencias se suman ambas diferencias, de modo que
  // un descuento del servidor nunca se pierde.
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const same = (a, b) => canonical(a) === canonical(b);
  const idList = v => Array.isArray(v) && v.length > 0 && v.every(x => isObj(x) && x.id != null);
  const COUNTER = /stock|gramos/i;
  function merge3(base, local, remote, path, notes) {
    if (same(local, base)) return clone(remote);
    if (same(remote, base) || same(local, remote)) return clone(local);
    const key = path[path.length - 1];
    if (typeof base === 'number' && typeof local === 'number' && typeof remote === 'number' && COUNTER.test(String(key))) {
      return Math.round((remote + (local - base)) * 1000) / 1000;
    }
    if (isObj(base) && isObj(local) && isObj(remote)) {
      const out = {};
      for (const k of new Set([...Object.keys(remote), ...Object.keys(local)])) {
        const inB = k in base, inL = k in local, inR = k in remote;
        if (inL && inR) out[k] = merge3(inB ? base[k] : undefined, local[k], remote[k], path.concat(k), notes);
        else if (inL) { if (!inB || !same(local[k], base[k])) out[k] = clone(local[k]); }      // servidor lo quitó; se conserva solo si lo cambiaste
        else if (inR) { if (!inB || !same(remote[k], base[k])) out[k] = clone(remote[k]); }    // tú lo quitaste; se conserva solo si el servidor lo cambió
      }
      return out;
    }
    const arrays = [base, local, remote].filter(Array.isArray);
    if (arrays.length === 3 && [base, local, remote].every(a => a.length === 0 || idList(a))) return mergeById(base, local, remote, path, notes);
    notes.push({path: path.join('.'), kind: 'both_changed'});
    return clone(local); // ambos cambiaron el mismo dato: gana tu cambio más reciente
  }
  function mergeById(base, local, remote, path, notes) {
    const map = a => new Map(a.map(x => [String(x.id), x]));
    const B = map(base), L = map(local), R = map(remote);
    const out = [];
    for (const r of remote) {
      const id = String(r.id), b = B.get(id), l = L.get(id);
      if (l) out.push(b ? merge3(b, l, r, path.concat(id), notes) : clone(r)); // si ambos lo crearon distinto, el tuyo se renumera abajo
      else if (!b) out.push(clone(r));                                     // nuevo en el servidor
      else if (!same(r, b)) { out.push(clone(r)); notes.push({path: path.concat(id).join('.'), kind: 'kept_remote_after_local_delete'}); }
      // si no: lo eliminaste tú y nadie más lo cambió → se elimina
    }
    const numeric = remote.concat(local).every(x => Number.isFinite(Number(x.id)));
    let maxId = numeric ? Math.max(0, ...remote.concat(local).map(x => Number(x.id))) : 0;
    const front = [], back = [];
    let seenExisting = false;
    for (const l of local) {
      const id = String(l.id);
      if (B.has(id)) { seenExisting = true; if (!R.has(id) && !same(l, B.get(id))) { out.push(clone(l)); notes.push({path: path.concat(id).join('.'), kind: 'kept_local_after_remote_delete'}); } continue; }
      if (R.has(id)) {
        if (same(l, R.get(id))) continue;
        // Mismo folio creado al mismo tiempo en dos lugares: se conservan ambos y el tuyo toma el siguiente número.
        if (!numeric) continue;
        const moved = {...clone(l), id: ++maxId};
        notes.push({path: path.concat(id).join('.'), kind: 'renumbered', from: l.id, to: moved.id});
        (seenExisting ? back : front).push(moved); continue;
      }
      (seenExisting ? back : front).push(clone(l));
    }
    return front.concat(out, back);
  }
  const SYNC_KEYS = ['cfg', 'cat', 'peds', 'materiales', 'gramosEditados'];
  // Igual que checkedUpdate, pero si el servidor cambió desde la última lectura combina en lugar de rechazar.
  function rebasedUpdate(base, remote, desired, writeId, now) {
    if (!base || !remote) throw conflict('Carga los datos del servidor antes de guardar.');
    if (same(base, remote)) return {doc: checkedUpdate(base, remote, desired, writeId, now), notes: [], merged: false};
    const notes = [], next = {};
    for (const k of Object.keys(desired)) {
      if (SYNC_KEYS.includes(k) && k in remote) next[k] = merge3(k in base ? base[k] : undefined, desired[k], remote[k], [k], notes);
      else next[k] = clone(desired[k]);
    }
    return {doc: checkedUpdate(remote, remote, next, writeId, now), notes, merged: true};
  }
  class SaveQueue {
    constructor({commit, persist, clear, makeId}) {
      this.commit = commit; this.persist = persist; this.clear = clear;
      this.makeId = makeId; this.base = null; this.pending = null;
      this.running = null;
    }
    accept(remote) {
      if (this.pending || this.running) return false;
      this.base = clone(remote); return true;
    }
    restore(record) {
      if (!record || record.version !== 1 || !record.base || !record.desired || !record.writeId) {
        throw conflict('El respaldo pendiente requiere revisión. No se reemplazarán los datos locales.');
      }
      this.base = clone(record.base);
      this.pending = {desired: clone(record.desired), writeId: record.writeId};
    }
    save(desired) {
      if (!this.base) return Promise.reject(conflict('Espera la primera sincronización con el servidor.'));
      if (!this.pending || canonical(this.pending.desired) !== canonical(desired)) {
        this.pending = {desired: clone(desired), writeId: this.makeId()};
      }
      this.persistPending();
      if (!this.running) {
        // Coalesce nested synchronous mutations (e.g. materials + order flags)
        // before the first write; never commit the middle of one UI operation.
        this.running = Promise.resolve().then(() => this.drain()).finally(() => { this.running = null; });
      }
      return this.running;
    }
    persistPending() {
      this.persist({version: 1, base: this.base, ...this.pending});
    }
    async drain() {
      while (this.pending) {
        const candidate = this.pending;
        const result = await this.commit(clone(this.base), clone(candidate.desired), candidate.writeId);
        this.base = clone(result);
        if (this.pending === candidate) { this.clear(); this.pending = null; }
        else this.persistPending();
      }
      return true;
    }
    async retry() {
      if (this.running) return this.running;
      if (!this.pending) return true;
      this.persistPending();
      this.running = this.drain().finally(() => { this.running = null; });
      return this.running;
    }
  }
  return {clone, canonical, checkedUpdate, rebasedUpdate, merge3, SaveQueue};
});
