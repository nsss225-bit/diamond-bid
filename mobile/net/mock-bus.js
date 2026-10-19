// For web/tests/ui.test.js: a room bus backed by firebase-room.js and the in-memory Firebase (mock-firebase.js).
// Run the UI tests with DIAMOND_NET=firebase to play the online tests through the app builds' server code.
const path = require("path");
const esbuild = require(path.join(__dirname, "..", "node_modules", "esbuild"));
const mock = path.join(__dirname, "mock-firebase.js");
const code = esbuild.buildSync({
  entryPoints: [path.join(__dirname, "firebase-room.js")], bundle: true, write: false, format: "iife",
  alias: { "firebase/app": mock, "firebase/auth": mock, "firebase/database": mock },
}).outputFiles[0].text;

module.exports = function makeBus() {
  globalThis.__rtdb = { tree: {}, listeners: [], n: 0, uid: 0 };
  return {
    // Each player (each browser) gets its own copy of the server code, signed in as its own player.
    capability() {
      const win = {};
      new Function("window", code)(win);
      let room = null;
      return { async join(name) { room = room || await win.claude.use("room"); return room.join(name); } };
    },
    tree: () => globalThis.__rtdb.tree,
  };
};
