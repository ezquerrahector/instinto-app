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
  return {clone, canonical, checkedUpdate, SaveQueue};
});
