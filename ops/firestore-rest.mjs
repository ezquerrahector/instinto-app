// INSTINTO V10 — lector REST mínimo de Firestore (producción o emulador). SOLO LECTURA.
// Producción: TOKEN=$(gcloud auth print-access-token). Emulador: FIRESTORE_EMULATOR_HOST=127.0.0.1:8085.
export const PROJECT = process.env.PROJECT || 'instinto-fragancias';
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const base = emulator
  ? `http://${emulator}/v1/projects/${PROJECT}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const headers = emulator ? {Authorization: 'Bearer owner'}
  : {Authorization: `Bearer ${process.env.TOKEN}`, 'x-goog-user-project': PROJECT};

export function decode(v) {
  if (v == null) return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('bytesValue' in v) return v.bytesValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}
export const decodeFields = f => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, decode(v)]));

async function call(url, init = {}) {
  const r = await fetch(url, {...init, headers: {...headers, 'Content-Type': 'application/json'}});
  if (r.status === 404) return null;
  if (!r.ok) throw Error(`${r.status} ${await r.text()}`);
  return r.json();
}
export async function getDoc(path) {
  const d = await call(`${base}/${path}`);
  return d ? decodeFields(d.fields || {}) : null;
}
export async function listCollections() {
  const out = await call(`${base}:listCollectionIds`, {method: 'POST', body: JSON.stringify({pageSize: 200})});
  return out?.collectionIds || [];
}
export async function listDocs(col) {
  const docs = []; let token = '';
  do {
    const out = await call(`${base}/${col}?pageSize=300${token ? '&pageToken=' + token : ''}`);
    for (const d of out?.documents || []) docs.push({id: d.name.split('/').pop(), data: decodeFields(d.fields || {})});
    token = out?.nextPageToken || '';
  } while (token);
  return docs;
}
