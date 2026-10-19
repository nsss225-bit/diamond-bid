// Regenerates the App Store screenshots in store/screenshots (iPhone 1320×2868, iPad 2064×2752) from the standalone web app.
// Run: node mobile/build-www.js --web-app && node store/make-screenshots.js  (serves docs/play itself; needs global playwright + chromium)
const path = require("path"), fs = require("fs"), { spawn, execSync } = require("child_process");
const { chromium } = require(execSync("npm root -g").toString().trim() + "/playwright");

const ROOT = path.join(__dirname, ".."), OUT = path.join(__dirname, "screenshots"), PORT = 8765 + Math.floor(Math.random() * 200);
const DEVICES = [
  { prefix: "iphone", viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 },
  { prefix: "ipad", viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2 },
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* A returning player: today's gift already collected, coins saved up, a few characters bought, achievements under way. */
function seed() {
  const d = new Date(), key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const daysAgo = n => { const x = new Date(); x.setDate(x.getDate() - n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const t0 = Date.now() - 86400000 * 20;
  const prefs = {
    character: "lion", name: "", deck: "classic", table: "green", fourColor: false, sound: true, haptics: true, lang: "en",
    config: { seatCount: 4, teams: false, tieRule: "split", cursed: false, double: true, gamesToWin: 1, botLevel: "hard", showNext: true, mystery: false, jackpot: true, powers: true, mine4: "h" },
    localPlayers: 2, passChars: {}, lastKind: "bots",
  };
  const ach = {};
  ["first_gem", "first_win", "steal", "hat_trick", "jackpot", "hard_win", "learner", "ace", "fair_share", "daily", "rematch"].forEach((id, k) => { ach[id] = t0 + k * 3600000; });
  const stats = {
    played: 86, won: 49, ach, dailyDays: [1, 2, 3, 4, 5, 6, 8, 9, 11].map(daysAgo), dailyBest: {}, coins: 4860,
    owned: ["lion", "dragon", "cat", "unicorn", "raccoon", "octopus", "penguin", "sakura", "noir", "ocean", "midnight"],
    lastGift: key, giftStreak: 9, walletV: 1, tutorialPaid: true,
    achProg: { giant_slayer: 6, double_trouble: 7, curse_dodger: 4, power_play: 18, wheel: 3, expert_win: 6, full_table: 8, teamwork: 9, online: 5, big_haul: 7, sweep: 2, comeback: 6, nail_biter: 4, polyglot: 0 },
  };
  try { if (!localStorage.getItem("diamondbid.seeded")) {
    localStorage.setItem("diamondbid.prefs", JSON.stringify(prefs));
    localStorage.setItem("diamondbid.stats", JSON.stringify(stats));
    localStorage.setItem("diamondbid.seeded", "1");
  } } catch (e) {}
}

async function shoot(page, name) {
  await page.evaluate(() => document.querySelectorAll("#toasts .toast").forEach(el => el.remove()));
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  console.log("Wrote", path.relative(ROOT, file));
}

async function run(browser, dev) {
  const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.deviceScaleFactor, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript(seed);
  const page = await ctx.newPage();
  page.on("pageerror", e => console.warn("[page error]", e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`);
  await sleep(3500); // splash + intro animations

  // 1 Home (Play tab)
  await shoot(page, `${dev.prefix}-1-home.png`);

  // 5 Customize tab (character picker), 6 Achievements
  await page.tap('[data-act=tab][data-tab=style]'); await sleep(1200);
  await shoot(page, `${dev.prefix}-5-characters.png`);
  await page.tap('[data-act=tab][data-tab=ach]'); await sleep(1200);
  await shoot(page, `${dev.prefix}-6-achievements.png`);

  // 4 Setup sheet for a game vs bots
  await page.tap('[data-act=tab][data-tab=play]'); await sleep(800);
  await page.tap('[data-act=open-setup][data-kind=bots]'); await sleep(1200);
  await shoot(page, `${dev.prefix}-4-setup.png`);

  // Play a couple of rounds quickly so some gems are taken and the scoreboard has points.
  await page.tap('[data-act=start]'); await sleep(2500);
  const playRound = async () => {
    await page.waitForFunction(() => G && G.s.phase === "bidding" && G.s.submitted.every((x, i) => x || i === 0), null, { timeout: 8000 });
    await page.evaluate(() => {
      const hand = G.s.hands[0], prize = prizeNow(G.s);
      // Go big on big gems and throw away small cards on small ones, so the player has points on the board.
      G.selected = prize >= 7 ? Math.max(...hand) : Math.min(...hand);
      placeBid();
    });
    await page.waitForFunction(() => G.s.phase === "reveal", null, { timeout: 5000 });
  };
  const advance = async () => { await page.evaluate(() => { G.s.ready = G.s.ready.map(() => true); progress(); }); };
  for (let k = 0; k < 3; k++) { await playRound(); await sleep(400); await advance(); }

  // 2 A round in progress: bots have bid face down, a card picked from the fanned hand.
  await page.waitForFunction(() => G.s.phase === "bidding" && G.s.submitted.every((x, i) => x || i === 0), null, { timeout: 8000 });
  await sleep(1500);
  await page.evaluate(() => { const h = G.s.hands[0]; G.selected = h[Math.floor(h.length / 2) + 2]; render(); });
  await sleep(900);
  await shoot(page, `${dev.prefix}-2-play.png`);

  // 3 The reveal: all bids flipped. Timers are stopped so the table stays put while the flip animation finishes.
  await page.evaluate(() => { G.selected = Math.max(...G.s.hands[0]); placeBid(); }); // play the top card so the player takes the gem
  await page.waitForFunction(() => G.s.phase === "reveal", null, { timeout: 5000 });
  await page.evaluate(() => stopTimers());
  await sleep(2200);
  await shoot(page, `${dev.prefix}-3-reveal.png`);
  await ctx.close();
}

(async () => {
  if (!fs.existsSync(path.join(ROOT, "docs", "play", "index.html"))) throw new Error("Build first: node mobile/build-www.js --web-app");
  const server = spawn("timeout", ["300", "python3", "-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: path.join(ROOT, "docs", "play"), stdio: "ignore" });
  await sleep(1000);
  const browser = await chromium.launch();
  try { for (const dev of DEVICES) await run(browser, dev); }
  finally { await browser.close(); server.kill(); }
  execSync(`file ${OUT}/*.png`, { stdio: "inherit" });
})().catch(e => { console.error(e); process.exit(1); });
