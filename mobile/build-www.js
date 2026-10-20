// Builds the web game as standalone pages:
//   mobile/www   for the iOS and Android apps (Capacitor)
//   docs/play    the free home-screen web app on GitHub Pages (Safari: Share → Add to Home Screen)
// claude.ai wraps web/index.html in a page skeleton; these need their own, with the viewport set for notches.
// Both also get net.js: online play and the leaderboard on Diamond Bid's Firebase server (net/firebase-room.js).
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, ".."), web = path.join(root, "web");
const GAME_FILES = ["engine.js", "i18n.js", "app.js"];
const FILES = [...GAME_FILES, "net.js"];

function page(extraHead) {
  const body = fs.readFileSync(path.join(web, "index.html"), "utf8").replace(/<meta name="claude:[^>]*>\n?/g, "")
    .replace('<script src="app.js"></script>', '<script src="net.js"></script>\n<script src="app.js"></script>');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#0b2620">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${extraHead}${body.replace('<div id="app">', '</head>\n<body>\n<div id="app">')}
</body>
</html>
`;
}

function fresh(out) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const f of GAME_FILES) fs.copyFileSync(path.join(web, f), path.join(out, f));
  require("esbuild").buildSync({ entryPoints: [path.join(__dirname, "net", "firebase-room.js")], bundle: true, minify: true, format: "iife", target: "es2019", legalComments: "none", outfile: path.join(out, "net.js") });
}

function buildApp() {
  const out = path.join(__dirname, "www");
  fresh(out);
  fs.writeFileSync(path.join(out, "index.html"), page(""));
  console.log("Built", out);
}

async function buildWebApp() {
  const out = path.join(root, "docs", "play");
  fresh(out);
  const sharp = require("sharp"), icon = path.join(__dirname, "assets", "icon-only.png");
  for (const size of [180, 192, 512]) await sharp(icon).resize(size, size).png().toFile(path.join(out, `icon-${size}.png`));
  fs.writeFileSync(path.join(out, "manifest.webmanifest"), JSON.stringify({
    name: "Diamond Bid", short_name: "Diamond Bid", start_url: "./", scope: "./", display: "standalone", orientation: "portrait",
    background_color: "#0b2620", theme_color: "#0b2620",
    icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }, { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
  }, null, 2) + "\n");
  const html = page(`<meta name="apple-mobile-web-app-title" content="Diamond Bid">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<script>window.DIAMOND_STANDALONE = true; if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>
`);
  fs.writeFileSync(path.join(out, "index.html"), html);
  // The cache name changes whenever the game changes, so players get the update the next time they open it online.
  const files = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", ...FILES];
  const hash = crypto.createHash("sha256").update(html + FILES.map(f => fs.readFileSync(path.join(out, f), "utf8")).join("")).digest("hex").slice(0, 12);
  fs.writeFileSync(path.join(out, "sw.js"), `// Keeps Diamond Bid playable offline. Game files: network first, always checking with the server (GitHub Pages lets
// browsers reuse files for 10 minutes), so updates arrive on the next open; fonts: cache first.
const CACHE = "diamond-bid-${hash}", FILES = ${JSON.stringify(files)};
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
  } else if (/fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })));
  }
});
`);
  console.log("Built", out);
}

buildApp();
if (process.argv.includes("--web-app")) buildWebApp().catch(e => { console.error(e); process.exit(1); });
