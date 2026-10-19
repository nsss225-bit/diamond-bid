// A tiny in-memory stand-in for the parts of Firebase that firebase-room.js uses, for tests only.
// Every bundle evaluated in one Node process shares the same database (globalThis.__rtdb).
const S = globalThis.__rtdb || (globalThis.__rtdb = { tree: {}, listeners: [], n: 0, uid: 0 });

const clean = v => {
  if (v === null || v === undefined) return undefined;
  if (Array.isArray(v)) { const a = v.map(clean).filter(x => x !== undefined); return a.length ? a : undefined; }
  if (typeof v === "object") {
    const o = {};
    Object.entries(v).forEach(([k, x]) => { const c = clean(x); if (c !== undefined) o[k] = c; });
    return Object.keys(o).length ? o : undefined;
  }
  return v;
};
const parts = p => String(p).split("/").filter(Boolean);
function get(path) { let o = S.tree; for (const k of parts(path)) { if (!o || typeof o !== "object") return undefined; o = o[k]; } return o; }
function put(path, v) {
  const ks = parts(path);
  const val = clean(JSON.parse(JSON.stringify(v === undefined ? null : v)));
  if (!ks.length) { S.tree = val || {}; return; }
  let o = S.tree;
  ks.slice(0, -1).forEach(k => { if (!o[k] || typeof o[k] !== "object") o[k] = {}; o = o[k]; });
  if (val === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = val;
  S.tree = clean(S.tree) || {};
}
const related = (a, b) => { const x = parts(a).join("/"), y = parts(b).join("/"); return !x || !y || x === y || x.startsWith(y + "/") || y.startsWith(x + "/"); };
function changed(path) { S.listeners.filter(l => related(l.path, path)).forEach(l => setTimeout(() => l.active && l.cb({ val: () => clone(get(l.path)) }), 0)); }
const clone = v => v === undefined ? null : JSON.parse(JSON.stringify(v));

// firebase/app
export const initializeApp = cfg => ({ cfg });
// firebase/auth
export const indexedDBLocalPersistence = {}, browserLocalPersistence = {}, inMemoryPersistence = {};
export function initializeAuth() { return { user: null, watchers: [] }; }
export function onAuthStateChanged(auth, f) { auth.watchers.push(f); if (auth.user) setTimeout(() => f(auth.user), 0); return () => { auth.watchers = auth.watchers.filter(x => x !== f); }; }
export async function signInAnonymously(auth) { auth.user = auth.user || { uid: "u" + (++S.uid) }; auth.watchers.forEach(f => f(auth.user)); return { user: auth.user }; }
// firebase/database
export const getDatabase = () => ({});
export const ref = (db, path = "") => ({ path: parts(path).join("/"), key: parts(path).pop() || null });
export const push = r => ref(null, r.path + "/k" + String(++S.n).padStart(6, "0"));
export const serverTimestamp = () => Date.now();
const resolveTs = v => typeof v === "function" ? v() : v && typeof v === "object" ? (Array.isArray(v) ? v.map(resolveTs) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveTs(x)]))) : v;
export async function set(r, v) { put(r.path, resolveTs(v)); changed(r.path); }
export async function update(r, upd) { Object.entries(upd).forEach(([k, v]) => put(r.path + "/" + k, resolveTs(v))); changed(r.path); }
export async function remove(r) { put(r.path, null); changed(r.path); }
export function onValue(r, cb) {
  if (r.path === ".info/connected") { setTimeout(() => cb({ val: () => true }), 0); return () => {}; }
  const l = { path: r.path, cb, active: true };
  S.listeners.push(l);
  setTimeout(() => l.active && cb({ val: () => clone(get(r.path)) }), 0);
  return () => { l.active = false; S.listeners = S.listeners.filter(x => x !== l); };
}
export const onDisconnect = r => ({ async remove() {}, async cancel() {} });
