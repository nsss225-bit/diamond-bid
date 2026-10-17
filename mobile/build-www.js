// Builds mobile/www: the web game as a standalone page for the iOS and Android apps.
// claude.ai wraps web/index.html in a page skeleton; the apps need their own, with the viewport set for notches.
const fs = require("fs"), path = require("path");
const web = path.join(__dirname, "..", "web"), out = path.join(__dirname, "www");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ["engine.js", "i18n.js", "app.js"]) fs.copyFileSync(path.join(web, f), path.join(out, f));
const page = fs.readFileSync(path.join(web, "index.html"), "utf8").replace(/<meta name="claude:[^>]*>\n?/g, "");
fs.writeFileSync(path.join(out, "index.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#0b2620">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${page.replace('<div id="app">', '</head>\n<body>\n<div id="app">')}
</body>
</html>
`);
console.log("Built", out);
