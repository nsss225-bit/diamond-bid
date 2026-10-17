// Run: node web/tests/ui.test.js — drives the real app.js in simulated browsers (no DOM rendering, just the HTML strings).
const fs = require("fs"), vm = require("vm"), path = require("path");
const dir = path.join(__dirname, "..");
const engineSrc = fs.readFileSync(path.join(dir, "engine.js"), "utf8");
const appSrc = fs.readFileSync(path.join(dir, "app.js"), "utf8");
const i18nSrc = fs.readFileSync(path.join(dir, "i18n.js"), "utf8");
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log("FAIL:", m); } else console.log("ok  ", m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* A tiny shared "room" so two simulated browsers can play each other. */
function makeBus() {
  const rooms = {};
  let n = 0;
  return {
    capability() {
      return {
        async join(name) {
          const room = rooms[name] || (rooms[name] = { members: [] });
          const m = { peer: "peer" + (++n), presence: {}, handlers: [] };
          room.members.push(m);
          const view = self => room.members.map(x => Object.freeze({ peer: x.peer, by: null, isMe: x === self, sameTab: x === self, kind: "viewer", guest: false, presence: Object.freeze(Object.assign({}, x.presence)), updatedAt: Date.now() }));
          const notify = (left = []) => room.members.forEach(x => x.handlers.forEach(h => setTimeout(() => h({ peers: view(x), joined: [], left, updated: [] }), 0)));
          const api = {
            name,
            async presence(patch) { Object.entries(patch).forEach(([k, v]) => { if (v === null) delete m.presence[k]; else m.presence[k] = JSON.parse(JSON.stringify(v)); }); if (JSON.stringify(m.presence).length > 4096) throw { code: "invalid_argument" }; notify(); },
            peers: () => view(m),
            onPeers(h) { m.handlers.push(h); setTimeout(() => h({ peers: view(m), joined: view(m), left: [], updated: [] }), 0); return () => {}; },
            async leave() { room.members = room.members.filter(x => x !== m); notify([{ peer: m.peer }]); },
            connected: () => true, onConnection() { return () => {}; },
          };
          setTimeout(() => notify(), 0);
          return api;
        },
      };
    },
  };
}

function browser(label, bus) {
  const mk = () => ({ innerHTML: "", textContent: "", classList: { add() {}, remove() {} }, appendChild() {}, remove() {}, getContext: () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} }), focus() {}, value: "" });
  const el = mk(), els = {};
  const store = {};
  const listeners = {};
  const ctx = {
    console, setTimeout: (f, ms) => setTimeout(f, ms >= 5000 ? ms : Math.min(ms || 0, 4)), clearTimeout, setInterval, clearInterval, Date, Math, JSON, Promise, Object, Array, String, Number, Set, Map,
    performance: { now: () => Date.now() }, requestAnimationFrame: f => setTimeout(() => f(Date.now()), 16), innerWidth: 400, innerHeight: 800,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    navigator: {}, matchMedia: () => ({ matches: false }),
    document: {
      getElementById: id => id === "join-code" ? Object.assign(mk(), { value: ctx.__joinCode || "" }) : id === "app" ? el : (els[id] = els[id] || mk()),
      createElement: () => Object.assign({}, el), body: { appendChild() {} }, activeElement: null,
      documentElement: { dataset: {} }, addEventListener: (t, f) => { listeners[t] = f; },
    },
  };
  ctx.window = ctx;
  ctx.scrollTo = () => {};
  if (bus) ctx.claude = { use: async name => name === "room" ? bus.capability() : null };
  vm.createContext(ctx);
  vm.runInContext(engineSrc + "\n" + i18nSrc + "\n" + appSrc, ctx, { filename: label });
  ctx.click = (act, data = {}) => {
    const target = { dataset: Object.assign({ act }, data), disabled: false, closest: () => target };
    listeners.click({ target });
  };
  ctx.html = () => el.innerHTML;
  ctx.get = expr => vm.runInContext(expr, ctx);
  return ctx;
}

/* Play the current local game to the end by clicking like a player would. */
async function playOut(b, { maxSteps = 4000, powers = true } = {}) {
  for (let k = 0; k < maxSteps; k++) {
    const st = b.get("G && G.s.phase");
    if (!st || st === "matchOver") return st;
    if (st === "bidding") {
      if (b.get("needsHandoff()")) { b.click("unlock"); continue; }
      const seat = b.get("activeSeat()");
      if (seat !== undefined) {
        const card = b.get(`G.s.hands[${seat}][Math.floor(Math.random()*G.s.hands[${seat}].length)]`);
        b.click("select", { v: String(card) });
        if (powers && b.get(`G.s.config.powers && G.s.powerAvail[${seat}] && POWERS[G.s.seats[${seat}].char].timing === "bid" && !(G.s.seats[${seat}].char === "cat" && isLast(G.s))`) && Math.random() < .3) b.click("power");
        if (powers && b.get(`G.s.config.powers && G.s.powerAvail[${seat}] && POWERS[G.s.seats[${seat}].char].timing === "now"`)) b.click("power-now");
        if (b.get(`G.s.config.double && G.s.doubleAvail[${seat}]`) && Math.random() < .2) b.click("double");
        b.click("bid");
      } else await sleep(5);
    } else if (st === "reveal") { b.click("next"); }
    else if (st === "tiebreak") {
      if (b.get("G.s.tie.spin === null")) b.click("spin");
      else if (b.get("!!G.s.tie.result")) b.click("tie-continue");
      else { b.get("applyTiebreak(G.s); progress()"); }
    } else if (st === "gameOver") b.click("next");
    else await sleep(5);
    b.html(); // keep rendering
  }
  return b.get("G && G.s.phase");
}

(async () => {
  // Speed bots up for tests
  // 1) Home renders with all sections
  const b = browser("solo");
  await sleep(20);
  ok(b.html().includes('role="tablist"') && b.html().includes("Play vs bots"), "home opens on the Play tab with a tab bar");
  let home = "";
  for (const tab of ["play", "daily", "style", "ach", "how"]) { b.click("tab", { tab }); home += b.html(); }
  b.click("tab", { tab: "play" });
  ok(["Daily challenge", "Choose your character", "Achievements", "Card design", "Sofia", "Ingrid", "Gold Leaf", "Galaxy", "Version 1.5", "tutorial"].every(t => home.includes(t)), "tabs show daily, characters, achievements, unlockables, version");
  ok(home.includes("Tap to buy"), "items for sale shown with prices");

  // 2) Every extra on, vs Expert bots, 4 players
  b.get(`Object.assign(prefs.config, { seatCount: 4, teams: false, botLevel: "expert", powers: true, showNext: true, mystery: true, jackpot: true, cursed: true, double: true, gamesToWin: 2 })`);
  b.click("open-setup", { kind: "bots" });
  ok(b.html().includes("Expert") && b.html().includes("Character powers"), "setup has Expert bots and extras");
  b.click("start");
  ok(b.html().includes("class=\"board") && b.html().includes("Gem 1 of 13"), "table renders");
  let end = await playOut(b);
  ok(end === "matchOver", "4-player match with every extra finishes");
  ok(!b.html().includes("Your game") && b.html().includes('data-act="rematch"'), "results are short: scores and buttons, no recap");
  ok(b.get("stats.played") === 1, "match counted in stats");
  ok(b.get("Object.keys(stats.achProg || {}).length") >= 1, "achievement progress counted: " + b.get("JSON.stringify(stats.achProg)"));
  b.click("home");

  // 3) Pass and play, 2v2 teams, 3 people
  b.get(`Object.assign(prefs.config, { seatCount: 4, teams: true, botLevel: "hard", powers: true, gamesToWin: 1 }); prefs.localPlayers = 3`);
  b.click("open-setup", { kind: "pass" });
  b.click("start");
  ok(b.get("G.mySeats.length") === 3, "3 people at a pass-and-play table");
  end = await playOut(b);
  ok(end === "matchOver" && b.html().includes("Red team") , "pass and play 2 vs 2 finishes");
  b.click("home");

  // 4) Daily challenge is the same gems every time today
  b.click("daily");
  const p1 = b.get("G.s.prizes.join()");
  b.click("home"); b.click("daily");
  ok(b.get("G.s.prizes.join()") === p1 && b.get("G.s.prizes.includes(20)"), "daily challenge deals the same gems, with a jackpot");
  end = await playOut(b, { powers: false });
  ok(end === "matchOver" && b.get(`stats.dailyBest[todayKey()] != null`), "daily challenge records your best score");
  ok(b.html().includes("Your best today"), "daily results show your best");
  b.click("home");

  // 5) Tutorial
  b.click("tutorial");
  ok(b.html().includes("Hiroshi") && b.html().includes("Welcome!"), "tutorial coach appears");
  ok(b.get("G.s.prizes.join()") === "5,13,2,9,1,11,7,3,12,6,10,4,8", "tutorial uses its fixed gems");
  end = await playOut(b);
  ok(end === "matchOver" && b.get("!!stats.ach.learner"), "tutorial finishes and grants Quick learner");
  b.click("home");

  // 6) Forced tie goes to the wheel and settles
  b.get(`Object.assign(prefs.config, { seatCount: 2, teams: false, powers: false, mystery: false, jackpot: false, cursed: false, double: false, gamesToWin: 1 })`);
  b.click("open-setup", { kind: "bots" }); b.click("start");
  b.get(`G.s.scores = [60, 60]; G.s.round = 12; G.s.phase = "reveal"; G.s.history = [{prize:5,bids:[{card:1},{card:2}],eff:[1,2],winners:[0],cancelled:[],awards:[60,0],powers:[]},{prize:5,bids:[{card:3},{card:2}],eff:[3,2],winners:[1],cancelled:[],awards:[0,60],powers:[]}]`);
  b.click("next");
  ok(b.get("G.s.phase") === "tiebreak" && b.html().includes("Spin the wheel"), "a tie shows the wheel");
  end = await playOut(b);
  ok(end === "matchOver", "tie settled by the wheel");
  b.click("home");

  // 7) Online: host and guest in separate browsers sharing a room
  const bus = makeBus();
  const host = browser("host", bus), guest = browser("guest", bus);
  await sleep(30);
  ok(host.html().includes("Play online") && !/data-act="open-online" disabled/.test(host.html()), "Play online is enabled when the room is available");
  host.get(`prefs.name = "Hosty"; Object.assign(prefs.config, { seatCount: 4, teams: false, powers: true, showNext: true, mystery: true, jackpot: true, gamesToWin: 1, botLevel: "normal" })`);
  guest.get(`prefs.name = "Guesty"; prefs.character = "frog"`);
  host.click("open-online"); host.click("online-create");
  await sleep(30);
  const code = host.get("Online.code");
  ok(code.length === 4 && host.html().includes(code.toUpperCase()), "host gets a table code: " + code.toUpperCase());
  guest.click("open-online"); guest.__joinCode = code; guest.click("online-join");
  await sleep(50);
  ok(host.html().includes("Guesty") && guest.html().includes("Hosty"), "both see each other in the lobby");
  host.click("online-start");
  await sleep(50);
  ok(guest.get("G && G.kind === 'online' && G.role === 'guest'"), "guest receives the game");
  ok(guest.get("G.mySeats.length") === 1 && host.get("G.mySeats[0]") === 0, "each player has a seat");
  ok(guest.get("G.s.seats.filter(x => x.bot).length") === 2, "empty seats filled by bots");
  // play the whole game: both click like players
  for (let k = 0; k < 3000; k++) {
    const ph = host.get("G && G.s.phase");
    if (!ph || ph === "matchOver" || ph === "gameOver") break;
    for (const b2 of [host, guest]) {
      if (b2.get("G && G.s.phase") === "bidding" && b2.get("activeSeat()") !== undefined) {
        const seat = b2.get("activeSeat()");
        b2.click("select", { v: String(b2.get(`G.s.hands[${seat}][0]`)) });
        if (b2.get(`G.s.config.powers && G.s.powerAvail[${seat}] && POWERS[G.s.seats[${seat}].char].timing === "bid"`) && Math.random() < .4) b2.click("power");
        b2.click("bid");
      }
    }
    if (ph === "reveal") host.click("next");
    if (ph === "tiebreak") { if (host.get("G.s.tie.spin === null")) host.click("spin"); else if (host.get("!!G.s.tie.result")) host.click("tie-continue"); else host.get("applyTiebreak(G.s); progress()"); }
    await sleep(8);
  }
  await sleep(60);
  const hs = host.get("JSON.stringify(G.s.scores)"), gs = guest.get("JSON.stringify(G.s.scores)");
  ok(["gameOver", "matchOver"].includes(host.get("G.s.phase")) && hs === gs, `online game finished with the same scores on both phones ${hs}`);
  ok(guest.html().includes("Waiting for the host") || guest.get("G.s.phase") === "matchOver", "guest waits for the host after the game");
  ok(guest.get("G.s.history.length") === 13, "guest saw all 13 rounds");
  if (host.get("G.s.phase") === "matchOver") {
    ok(guest.html().includes('data-act="rematch-ask"'), "a guest can ask for a rematch");
    guest.click("rematch-ask"); await sleep(40);
    ok(host.html().includes("Rematch requested by"), "the host sees who asked for a rematch");
    host.click("rematch"); await sleep(60);
    ok(host.get("G.s.phase") === "bidding" && guest.get("G.s.phase") === "bidding" && guest.get("G.s.history.length") === 0, "the host's rematch starts a new game on both phones");
  }
  const leakCheck = host.get(`JSON.stringify(packState(G.s))`).length;
  ok(leakCheck < 4096, "host state fits in presence: " + leakCheck + " bytes");
  // host leaves → guest is told
  host.click("home");
  await sleep(40);
  ok(!guest.get("G") && guest.get("Online.error").includes("host left"), "guest is told when the host leaves");

  // 8) Both join by code (nobody hosting) → one taps "Host this table"
  const bus2 = makeBus();
  const a = browser("a", bus2), b2b = browser("b", bus2);
  await sleep(30);
  a.click("open-online"); a.__joinCode = "oman"; a.click("online-join");
  b2b.click("open-online"); b2b.__joinCode = "oman"; b2b.click("online-join");
  await sleep(50);
  ok(a.html().includes("Nobody is hosting") && b2b.html().includes("Nobody is hosting"), "a table without a host offers Host this table");
  a.click("online-host"); b2b.click("online-host");
  await sleep(50);
  ok([a.get("Online.role"), b2b.get("Online.role")].sort().join() === "guest,host", "if both tap Host, exactly one keeps it");
  const h = a.get("Online.role") === "host" ? a : b2b, gst = h === a ? b2b : a;
  h.click("online-start");
  await sleep(60);
  ok(gst.get("G && G.kind === 'online'") && h.get("G.s.seats.filter(x => !x.bot).length") === 2, "the new host starts the game for both");

  // 9) Coins: welcome + daily gift, starters free, buy flow, game rewards
  const c = browser("coins");
  await sleep(20);
  ok(c.get("stats.coins") === 300 && c.get("app.modal") === "gift", "first visit: 200 welcome + 100 daily gift, gift shown");
  ok(["fox", "owl", "bear"].every(id => c.get(`isUnlocked(CHAR.${id})`)) && !c.get("isUnlocked(CHAR.cat)"), "3 starter characters are free");
  ok(c.get(`["classic","royal"].every(id => isUnlocked(DECKS.find(d => d.id === id))) && !isUnlocked(DECKS.find(d => d.id === "noir"))`), "2 starter card designs are free");
  c.click("close");
  c.click("buy", { id: "dragon" });
  ok(c.html().includes("You need") && /data-act="confirm-buy"[^>]*disabled/.test(c.html()), "can't buy what you can't afford");
  c.click("close"); c.get("stats.coins += 450"); c.click("buy", { id: "sakura" }); c.click("confirm-buy");
  ok(c.get("stats.coins") === 0 && c.get(`isUnlocked(DECKS.find(d => d.id === "sakura"))`) && c.get("prefs.deck") === "sakura", "buying Sakura cards for 750 coins works and switches to them");
  c.get(`Object.assign(prefs.config, { seatCount: 2, botLevel: "hard", powers: false, mystery: false, jackpot: false, cursed: false, double: false, gamesToWin: 1 })`);
  c.click("open-setup", { kind: "bots" }); c.click("start");
  end = await playOut(c);
  ok(c.get("stats.coins") >= 20 && c.html().includes("coins"), "a game vs a Hard bot pays coins: " + c.get("stats.coins"));
  c.get(`stats.lastGift = "2000-01-01"; checkDailyGift()`);
  ok(c.get("stats.giftStreak") === 1, "a missed day resets the gift streak");

  // 10) Turn clock: time runs out, a card is played for you, then Back or you're removed
  const T = browser("clock");
  await sleep(20); T.click("close");
  T.get(`Object.assign(prefs.config, { seatCount: 2, botLevel: "easy", gamesToWin: 1 })`);
  T.click("open-setup", { kind: "bots" }); T.click("start");
  T.html();
  ok(T.html().includes('id="turn-left"') && T.get("!!G.turnKey"), "your turn shows a 10-second clock");
  T.get("autoPlay(G.turnKey)"); await sleep(30);
  ok(T.get("G.s.history.length >= 1 || G.s.submitted[0]"), "time's up: a card is played for you");
  ok(T.get("!!G.away") && T.html().includes('data-act="come-back"'), "you're asked to come back within 20 seconds");
  T.click("come-back");
  ok(!T.get("G.away") && T.get("app.screen") === "game", "Back keeps you in the game");
  T.get("G.turnKey && autoPlay(G.turnKey)"); T.get("G.away = G.away || { at: Date.now() }"); T.get("kickForInactivity()");
  ok(T.get("app.screen") === "home" && !T.get("G"), "not coming back removes you from the game");

  // 9b) Quick match: two strangers searching get paired; someone alone plays a bot
  const qbus = makeBus();
  const q1 = browser("q1", qbus), q2 = browser("q2", qbus);
  await sleep(30); q1.click("close"); q2.click("close");
  q1.click("open-online"); q1.click("quick-match"); await sleep(30);
  ok(q1.html().includes("Looking for players"), "quick match shows the search screen");
  q2.click("open-online"); q2.click("quick-match");
  await sleep(250);
  ok(q1.get("G && G.kind === 'online'") && q2.get("G && G.kind === 'online'"), "two players searching are paired into one game");
  ok(q1.get("G.s.seats.filter(x => !x.bot).length") === 2 && q1.get("G.s.config.seatCount") === 2, "a quick match is 1 vs 1");
  ok(q1.get("Online.role") !== q2.get("Online.role"), "one of them hosts, the other joins");
  const q3 = browser("q3", makeBus());
  await sleep(30); q3.click("close"); q3.click("open-online"); q3.click("quick-match"); await sleep(30);
  q3.get("noOneFound()"); await sleep(20);
  ok(q3.get("G && G.kind === 'bots'") && q3.get("app.screen") === "game", "nobody online: you play a bot");

  // 9c) Account: progress saves to your account and loads on another device
  const cloud = {};
  const fakeDoc = { async set(v) { cloud.save = JSON.parse(JSON.stringify(v)); }, async get() { return { data: () => cloud.save }; } };
  const A1 = browser("phone1"); await sleep(20);
  A1.__doc = fakeDoc;
  A1.get(`Account.id = "u_1"; Account.doc = __doc; stats.coins = 4321; stats.owned.push("lion"); stats.ach.ace = 1; stats.won = 7; saveStats()`);
  await sleep(1700);
  ok(cloud.save && cloud.save.stats.coins === 4321 && A1.get("Account.state") === "saved", "progress is saved to the account");
  const A2 = browser("phone2"); await sleep(20);
  A2.get(`mergeProgress(${JSON.stringify(cloud.save)})`);
  ok(A2.get(`stats.owned.includes("lion") && !!stats.ach.ace && stats.won === 7 && stats.coins >= 4321`), "another device picks up the saved progress");
  A1.click("account");
  ok(A1.html().includes("Signed in as") && A1.html().includes("Saved to your account"), "the account sheet shows who is signed in and the save status");

  // 9e) Achievements need several completions
  const H2 = browser("ach"); await sleep(20);
  H2.get("for (let k = 0; k < 9; k++) grant('ace')");
  ok(!H2.get("stats.ach.ace") && H2.get("stats.achProg.ace") === 9, "an achievement isn't granted before its goal");
  H2.get("grant('ace')");
  ok(!!H2.get("stats.ach.ace"), "it is granted on the 10th time");
  H2.click("close"); H2.click("tab", { tab: "ach" });
  ok(H2.html().includes("0 / 100"), "achievements show progress like 0 / 100");

  // 9f) Suits: pick your suit, the middle deck comes from what's left; 4 players get Stars or Crowns
  const SU = browser("suits"); await sleep(20); SU.click("close");
  SU.get(`Object.assign(prefs.config, { seatCount: 2 })`); SU.click("open-setup", { kind: "bots" });
  SU.click("cfg-suit", { slot: "0", suit: "c" }); SU.click("cfg-suit", { slot: "1", suit: "d" }); SU.click("cfg-suit", { slot: "mid", suit: "s" });
  SU.click("start");
  ok(SU.get(`suitFor(0, 2, G.s.config) === "c" && suitFor(1, 2, G.s.config) === "d" && middleSuit(2, G.s.config) === "s"`) && SU.html().includes("mid-s"), "2 players: clubs vs diamonds, spades in the middle");
  SU.click("home"); SU.get(`Object.assign(prefs.config, { seatCount: 4, teams: false })`); SU.click("open-setup", { kind: "bots" });
  SU.click("cfg-suit", { slot: "mine4", suit: "s" }); SU.click("cfg-suit", { slot: "mid4", suit: "crown" }); SU.click("start");
  ok(SU.get(`suitFor(0, 4, G.s.config) === "s" && new Set([0,1,2,3].map(i => suitFor(i, 4, G.s.config))).size === 4 && middleSuit(4, G.s.config) === "crown"`) && SU.html().includes("mid-crown"), "4 players: all four suits taken, Crowns in the middle");

  // 9d) Vibration: picking and playing a card vibrate; the switch turns it off
  const V = browser("vibe"); await sleep(20); V.click("close");
  const buzzes = []; V.navigator.vibrate = p => { buzzes.push(p); return true; };
  V.get(`Object.assign(prefs.config, { seatCount: 2, botLevel: "easy", gamesToWin: 1 })`);
  V.click("open-setup", { kind: "bots" }); V.click("start");
  const vv = String(V.get("G.s.hands[0][2]"));
  V.click("select", { v: vv }); V.click("select", { v: vv });
  ok(buzzes.includes(8) && buzzes.includes(18), "picking and playing a card vibrate: " + JSON.stringify(buzzes));
  V.click("haptics"); const before = buzzes.length;
  V.click("select", { v: String(V.get("G.s.hands[0][0]")) });
  ok(V.get("prefs.haptics") === false && buzzes.length === before, "the Vibration switch turns it off");

  // 10a) Double-tap a card to play it
  const D = browser("doubletap");
  await sleep(20); D.click("close");
  D.get(`Object.assign(prefs.config, { seatCount: 2, botLevel: "easy", gamesToWin: 1 })`);
  D.click("open-setup", { kind: "bots" }); D.click("start");
  const dv = D.get("G.s.hands[0][3]");
  D.click("select", { v: String(dv) });
  ok(D.get("G.selected") === dv && !D.get("G.s.submitted[0]"), "one tap only picks the card");
  D.click("select", { v: String(dv) });
  ok(D.get("G.s.submitted[0] || G.s.history.length > 0"), "a quick second tap plays it");

  // 10b) Languages: picker, RTL Arabic, translated game, back to English
  const L = browser("lang");
  await sleep(20); L.click("close");
  ok(L.html().includes('data-act="lang"'), "home shows the language button");
  L.click("lang");
  ok(["English", "العربية", "Español", "Français", "中文"].every(n => L.html().includes(n)), "the picker lists all 5 languages");
  L.click("set-lang", { id: "ar" });
  ok(L.get("document.documentElement.dir") === "rtl" && L.get("prefs.lang") === "ar", "Arabic switches the page to right-to-left");
  ok(L.html().includes(L.get('t("Play vs bots")')) && L.get('t("Play vs bots")') !== "Play vs bots", "home text is translated: " + L.get('t("Play vs bots")'));
  for (const id of ["es", "fr", "zh", "ar"]) {
    L.click("set-lang", { id });
    L.get(`Object.assign(prefs.config, { seatCount: 2, botLevel: "easy", gamesToWin: 1 })`);
    L.click("open-setup", { kind: "bots" }); L.click("start");
    const endL = await playOut(L);
    ok(endL === "matchOver" && !/undefined|\{\w+\}/.test(L.html()), `a full game in ${id} renders with no missing text`);
    L.click("home");
  }
  L.click("set-lang", { id: "en" });
  ok(L.get("document.documentElement.dir") === "ltr" && L.html().includes("Play"), "back to English, left-to-right");

  console.log(failures ? `\n${failures} FAILURES` : "\nALL UI TESTS PASSED");
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
