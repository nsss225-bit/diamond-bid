// Run: node web/tests/engine.test.js
const E = require("../engine.js");
const { range } = E;
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log("FAIL:", m); } };
const humans = (n, chars) => range(n).map(i => ({ name: "P" + i, char: chars ? chars[i] : ["fox", "owl", "bear", "cat"][i], bot: false }));
function table(cfg, chars, prizes) {
  const s = E.newMatch(Object.assign({ seatCount: chars.length }, cfg), humans(chars.length, chars), { prizes });
  return s;
}
function play(s, bids) { bids.forEach((b, i) => ok(E.submit(s, i, b), "submit " + JSON.stringify(b))); return E.resolve(s); }
const P = [5, 9, 13, 2, 7, 11, 1, 4, 12, 6, 3, 10, 8];

// --- 1.0 rules still hold
let s = table({}, ["fox", "owl"], P); let r = play(s, [{ card: 9 }, { card: 4 }]);
ok(r.winners + "" === "0" && s.scores[0] === 60, "highest wins");
s = table({ tieRule: "split" }, ["fox", "owl"], P); play(s, [{ card: 9 }, { card: 9 }]); ok(E.fmt(s.scores[0]) === "2½", "split");
s = table({}, ["fox", "owl"], P); r = play(s, [{ card: 9 }, { card: 9 }]);
ok(r.spinAmong + "" === "0,1" && r.winners.length === 1 && s.scores[r.winners[0]] === 60, "a tie is spun: one player takes the whole gem");
{ const s2 = table({}, ["fox", "owl"], P); const r2 = play(s2, [{ card: 9 }, { card: 9 }]); ok(r2.winners[0] === r.winners[0], "the spin lands the same way on every phone"); }
s = table({ tieRule: "cancel" }, ["fox", "owl", "bear", "cat"], P); r = play(s, [{ card: 9 }, { card: 9 }, { card: 5 }, { card: 3 }]);
ok(r.winners + "" === "2", "cancel");

// --- powers
s = table({ powers: true }, ["fox", "owl"], P); r = play(s, [{ card: 7, power: true }, { card: 8 }]);
ok(r.winners + "" === "0" && r.eff[0] === 9 && !s.powerAvail[0], "Feint +2");
s = table({ powers: true }, ["bear", "owl"], P); r = play(s, [{ card: 8, power: true }, { card: 8 }]);
ok(r.winners + "" === "0" && s.scores[0] === 60, "Bully wins tie");
s = table({ powers: true, tieRule: "cancel" }, ["bear", "owl"], P); r = play(s, [{ card: 8, power: true }, { card: 8 }]);
ok(r.winners + "" === "0", "Bully not cancelled");
s = table({ powers: true }, ["cat", "owl"], P); r = play(s, [{ card: 13, power: true }, { card: 1 }]);
ok(r.prize === 9 && s.prizes[1] === 5 && s.scores[0] === 108, "Swap plays the next gem now");
// new characters (1.5): prize 1 is 5
s = table({ powers: true }, ["monkey", "owl"], P); r = play(s, [{ card: 1, power: true }, { card: 4 }]);
ok(r.winners + "" === "0" && r.eff[0] === 5, "Mimic: card counts as the gem's number");
s = table({ powers: true }, ["bunny", "owl"], P); r = play(s, [{ card: 1, power: true }, { card: 4 }]);
ok(s.scores[0] === 12 && s.scores[1] === 60, "Soft landing: 1 point when losing");
s = table({ powers: true }, ["lion", "owl"], P); r = play(s, [{ card: 9, power: true }, { card: 4 }]);
ok(s.scores[0] === 120, "Royal share doubles the gem");
s = table({ powers: true }, ["octopus", "owl"], P); r = play(s, [{ card: 8, power: true }, { card: 9 }]);
ok(r.winners + "" === "0" && r.eff[1] === 7, "Ink cloud: opponents 2 lower");
s = table({ powers: true }, ["unicorn", "owl"], P); r = play(s, [{ card: 5, power: true }, { card: 4 }]);
ok(s.scores[0] === 120, "Wish: +5 when winning with 5 or lower");
s = table({ powers: true }, ["shark", "owl", "bear", "cat"], P); r = play(s, [{ card: 1, power: true }, { card: 9 }, { card: 2 }, { card: 3 }]);
ok(s.scores[0] === 36 && s.scores[1] === 48 && s.scores[2] === -12, "Bite: 1 point from each opponent");
s = table({ powers: true }, ["frog", "owl"], P); r = play(s, [{ card: 12, power: true }, { card: 13 }]);
ok(s.hands[0].includes(12) && r.leapt === 0, "Lucky leap returns card");
s = table({ powers: true }, ["panda", "owl"], P); r = play(s, [{ card: 12, power: true }, { card: 3 }]);
ok(s.scores[0] === (5 + 3) * 12, "Bamboo bonus +3");
s = table({ powers: true }, ["penguin", "owl"], P); r = play(s, [{ card: 1, power: true }, { card: 13 }]);
ok(r.winners + "" === "0" && r.reverse, "Upside down: lowest wins");
s = table({ powers: true }, ["robot", "owl"], P); r = play(s, [{ card: 1, power: true }, { card: 11 }]);
ok(r.eff[0] === 11 && r.spinAmong && r.spinAmong.length === 2 && r.winners.length === 1, "Copycat copies → tie, settled by the spin");
s = table({ powers: true }, ["raccoon", "owl"], P); r = play(s, [{ card: 1, power: true }, { card: 11 }]);
ok(s.scores[1] === 36 && s.scores[0] === 24, "Pickpocket takes 2");
s = table({ powers: true }, ["dragon", "owl"], P); r = play(s, [{ card: 2, power: true }, { card: 13 }]);
ok(r.winners + "" === "0" && r.burned === 1, "Fire breath burns top card");
s = table({ powers: true }, ["owl", "fox"], P); ok(E.usePowerNow(s, 0) && s.foresight[0] && !s.powerAvail[0], "Foresight");
ok(!E.submit(table({ powers: true }, ["fox", "owl"], P), 1, { card: 3, power: true }), "Foresight is not a bid power");
s = table({ powers: false }, ["fox", "owl"], P); ok(!E.submit(s, 0, { card: 3, power: true }), "powers off");
s = table({ powers: true }, ["fox", "owl"], P); play(s, [{ card: 3, power: true }, { card: 4 }]); E.advance(s);
ok(!E.submit(s, 0, { card: 5, power: true }), "power only once");

// --- jackpot, mystery, daily seed
for (let k = 0; k < 200; k++) {
  const j = E.newMatch({ jackpot: true }, humans(2));
  ok(j.prizes.indexOf(20) >= 9 && !j.prizes.includes(1) && j.prizes.length === 13, "jackpot in last 4");
}
const m = E.newMatch({ mystery: true }, humans(2)); ok(m.mysteryRound >= 1 && m.mysteryRound <= 12, "mystery round");
const d1 = E.newMatch({ jackpot: true, mystery: true }, humans(2), { seed: E.seedFrom("2026-10-16") });
const d2 = E.newMatch({ jackpot: true, mystery: true }, humans(2), { seed: E.seedFrom("2026-10-16") });
const d3 = E.newMatch({ jackpot: true, mystery: true }, humans(2), { seed: E.seedFrom("2026-10-17") });
ok(d1.prizes + "" === d2.prizes + "" && d1.mysteryRound === d2.mysteryRound, "daily repeatable");
ok(d1.prizes + "" !== d3.prizes + "", "daily changes by date");

// --- bots: every level, every option, 2 and 4 seats, including tie-breaks
const chars = ["fox", "owl", "bear", "cat", "frog", "panda", "penguin", "robot", "raccoon", "dragon"];
let games = 0, ties = 0, packs = 0, maxPack = 0;
for (let seed = 0; seed < 1200; seed++) {
  const level = ["easy", "normal", "hard", "expert"][seed % 4];
  const cfg = { seatCount: seed % 2 ? 4 : 2, teams: seed % 8 === 1, tieRule: seed % 3 ? "split" : "cancel", cursed: seed % 5 < 2,
    double: seed % 2 === 0, gamesToWin: seed % 7 ? 2 : 1, showNext: true, mystery: seed % 3 === 1, jackpot: seed % 4 === 2, powers: seed % 2 === 0 };
  const n = cfg.seatCount;
  const seats = range(n).map(i => ({ name: "B" + i, char: chars[(seed + i * 3) % chars.length], bot: true, level }));
  const st = E.newMatch(cfg, seats);
  let steps = 0;
  while (st.phase !== "matchOver" && steps++ < 6000) {
    if (st.phase === "bidding") {
      st.seats.forEach((x, i) => E.botInstant(st, i));
      st.seats.forEach((x, i) => { const b = E.botChoose(st, i, x.level); if (!E.submit(st, i, b)) { ok(false, "illegal bot bid " + JSON.stringify(b) + " " + x.char); E.submit(st, i, { card: st.hands[i][0] }); } });
      E.resolve(st);
      // online: a player replaying the host's packed state must see the same table
      if (seed % 10 === 0) {
        const packed = E.packState(st), size = JSON.stringify(packed).length; maxPack = Math.max(maxPack, size); packs++;
        const u = E.unpackState(JSON.parse(JSON.stringify(packed)));
        ok(JSON.stringify(u.scores) === JSON.stringify(st.scores) && JSON.stringify(u.hands) === JSON.stringify(st.hands) && u.prizes + "" === st.prizes + "", "replay matches host");
      }
    } else if (st.phase === "tiebreak") { ties++; if (st.tie.spin === null) { E.spinTie(st); E.applyTiebreak(st); } else E.finishTiebreak(st); }
    else { E.advance(st); if (st.phase === "bidding" && st.round === 0) games++; }
  }
  ok(st.phase === "matchOver" && E.matchWinners(st).length > 0, "match finished");
}

// Expert should beat Normal more often than not
let ew = 0, played = 0;
for (let k = 0; k < 600; k++) {
  const st = E.newMatch({ seatCount: 2 }, [{ name: "E", char: "fox", bot: true, level: "expert" }, { name: "N", char: "owl", bot: true, level: "normal" }]);
  while (st.phase === "bidding" || st.phase === "reveal") {
    if (st.phase === "bidding") { st.seats.forEach((x, i) => E.submit(st, i, E.botChoose(st, i, x.level))); E.resolve(st); } else E.advance(st);
  }
  if (st.phase !== "tiebreak") { played++; if (st.lastGameWinners[0] === 0) ew++; }
}
console.log(`Expert beat Normal in ${Math.round(100 * ew / played)}% of ${played} games`);
ok(ew / played > 0.5, "expert stronger than normal");
console.log(`${games} extra games, ${ties} tie-break steps, ${packs} online replays (largest packed state ${maxPack} bytes)`);
console.log(failures ? `${failures} FAILURES` : "ALL ENGINE TESTS PASSED");
process.exit(failures ? 1 : 0);
