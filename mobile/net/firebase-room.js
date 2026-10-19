// Online play for the store apps and the home-screen web app, on Diamond Bid's own Firebase server.
// It stands in for claude.ai's room and db capabilities (window.claude.use), so app.js runs unchanged:
//   room: tables and the quick-match lobby. Each player is one entry under rooms/<table>/<peer>,
//         removed by the server when they disconnect.
//   db:   only the "dailyscores" collection (today's leaderboard), stored under dailyscores/<player>.
//   user: the anonymous player id, so a player can only change their own entries.
// Built into mobile/www and docs/play by build-www.js; claude.ai keeps its own services.
import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, push, set, update, remove, onValue, onDisconnect, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCgQ7VbL12ajsJEy2YHevy18lurv9QhnQs",
  authDomain: "diamond-bid.firebaseapp.com",
  databaseURL: "https://diamond-bid-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "diamond-bid",
  storageBucket: "diamond-bid.firebasestorage.app",
  messagingSenderId: "32604812102",
  appId: "1:32604812102:web:dffee96287ce19693eab47",
};

const fb = initializeApp(firebaseConfig);
// initializeAuth (not getAuth) avoids the sign-in popup machinery that hangs inside the iOS app's web view.
const auth = initializeAuth(fb, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence] });
const db = getDatabase(fb);
const MAX_PRESENCE = 8192;

let uidPromise = null;
/** The player's anonymous id, signing in on first use. Retries on the next call if the phone was offline. */
function uid() {
  if (!uidPromise) {
    uidPromise = new Promise((resolve, reject) => {
      const stop = onAuthStateChanged(auth, u => { if (u) { stop(); resolve(u.uid); } });
      signInAnonymously(auth).catch(e => { stop(); reject(e); });
    }).catch(e => { uidPromise = null; throw e; });
  }
  return uidPromise;
}

let online = false;
const connWatchers = new Set();
onValue(ref(db, ".info/connected"), s => { online = !!s.val(); connWatchers.forEach(f => { try { f(online); } catch (e) {} }); });

const clone = v => JSON.parse(JSON.stringify(v));
const roomKey = name => String(name).replace(/[.#$[\]/]/g, "_").slice(0, 60);

async function join(name) {
  const me = await uid();
  const roomRef = ref(db, "rooms/" + roomKey(name));
  const meRef = push(roomRef);
  const peerId = meRef.key;
  let presence = {};
  await onDisconnect(meRef).remove();
  await set(meRef, { uid: me, t: serverTimestamp(), p: { _: 1 } });
  let left = false, peers = [], handlers = [], prev = new Map();

  // Each presence value is stored as JSON text: Firebase would otherwise drop empty lists and nulls inside the game state.
  const view = raw => Object.entries(raw || {}).map(([peer, v]) => {
    const p = {};
    Object.entries((v && v.p) || {}).forEach(([k, x]) => { if (k !== "_") { try { p[k] = JSON.parse(x); } catch (e) {} } });
    return Object.freeze({ peer, by: null, isMe: peer === peerId, sameTab: peer === peerId, kind: "viewer", guest: false, presence: Object.freeze(p), updatedAt: Date.now() });
  });
  const stopListening = onValue(roomRef, snap => {
    if (left) return;
    peers = view(snap.val());
    const now = new Map(peers.map(p => [p.peer, JSON.stringify(p.presence)]));
    const ch = {
      peers,
      joined: peers.filter(p => !prev.has(p.peer)),
      left: [...prev.keys()].filter(k => !now.has(k)).map(peer => ({ peer })),
      updated: peers.filter(p => prev.has(p.peer) && prev.get(p.peer) !== now.get(p.peer)),
    };
    prev = now;
    handlers.forEach(h => { try { h.ok(ch); } catch (e) { console.error(e); } });
  }, err => handlers.forEach(h => h.fail && h.fail(err)));

  return {
    name,
    async presence(patch) {
      const next = Object.assign({}, presence);
      Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined) delete next[k]; else next[k] = clone(v); });
      if (JSON.stringify(next).length > MAX_PRESENCE) throw { code: "invalid_argument" };
      presence = next;
      const upd = {};
      Object.keys(patch).forEach(k => { upd["p/" + k] = patch[k] === null || patch[k] === undefined ? null : JSON.stringify(patch[k]); });
      await update(meRef, upd);
    },
    peers: () => peers,
    onPeers(ok, fail) {
      const h = { ok, fail };
      handlers.push(h);
      if (peers.length) setTimeout(() => ok({ peers, joined: peers, left: [], updated: [] }), 0);
      return () => { handlers = handlers.filter(x => x !== h); };
    },
    async leave() {
      if (left) return;
      left = true; handlers = [];
      stopListening();
      try { await onDisconnect(meRef).cancel(); await remove(meRef); } catch (e) {}
    },
    connected: () => online,
    onConnection(f) { connWatchers.add(f); return () => connWatchers.delete(f); },
  };
}

// Only the daily leaderboard: collection("dailyscores").onSnapshot(...) and .doc(<player id>).set({...}).
function collection(path) {
  const base = String(path).replace(/^\/+|\/+$/g, "");
  return {
    onSnapshot(cb, fail) {
      let unsub = null, stopped = false;
      uid().then(() => {
        if (stopped) return;
        unsub = onValue(ref(db, base), snap => {
          const v = snap.val() || {};
          cb({ docs: Object.entries(v).map(([id, d]) => ({ id, data: () => d })) });
        }, err => fail && fail(err));
      }, err => fail && fail(err));
      return () => { stopped = true; if (unsub) unsub(); };
    },
    doc(id) {
      return {
        async set(data) { await uid(); await set(ref(db, base + "/" + id), clone(data)); },
        async get() { throw { code: "not_supported" }; },
      };
    },
  };
}

const capabilities = {
  room: { join },
  db: { collection },
  user: { id: () => uid(), async profiles() { return {}; } },
};
window.claude = window.claude || {
  firebase: true,
  use: async name => { if (!capabilities[name]) throw { code: "not_available" }; return capabilities[name]; },
};
