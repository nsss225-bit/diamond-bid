/* Diamond Bid rules engine (version 1.1).
 * Pure game logic: no DOM. Loaded by index.html as a plain script, and by Node for tests. */

/* ================= Basics ================= */
const PIP = { h: "♥︎", c: "♣︎", d: "♦︎", s: "♠︎" };
const SUIT_NAME = { h: "Hearts", c: "Clubs", d: "Diamonds", s: "Spades" };
const RANK = v => ({ 1: "A", 11: "J", 12: "Q", 13: "K" })[v] || String(v);
const range = n => Array.from({ length: n }, (_, i) => i);
const ALL13 = range(13).map(i => i + 1);
const JACKPOT = 20;
const suitFor = (seat, n) => n === 2 ? ["h", "s"][seat] : ["h", "c", "d", "s"][seat];
const prizeLabel = v => v < 0 ? "−" + (-v) : String(v);
const prizeName = v => v === JACKPOT ? "20 jackpot" : v < 0 ? `${prizeLabel(v)} curse` : `${v} gem`;
const usesTeams = c => !!c.teams && c.seatCount === 4;
const sideCount = c => usesTeams(c) ? 2 : c.seatCount;
const sideOf = (c, seat) => usesTeams(c) ? seat % 2 : seat;
const seatsOnSide = (c, side) => range(c.seatCount).filter(i => sideOf(c, i) === side);
const TEAM_NAME = ["Red team", "Black team"];

/** Points are kept in twelfths so splits between 2, 3 or 4 players stay exact. */
function fmt(t) {
  const sign = t < 0 ? "−" : "";
  const a = Math.abs(t), whole = Math.floor(a / 12), rem = a % 12;
  const fr = { 3: "¼", 4: "⅓", 6: "½", 8: "⅔", 9: "¾" };
  if (rem === 0) return sign + whole;
  if (fr[rem]) return sign + (whole ? whole : "") + fr[rem];
  return sign + (a / 12).toFixed(1);
}

/* Randomness. A state with `rngState` (the daily challenge) is fully repeatable. */
function rnd(s) {
  if (!s || s.rngState == null) return Math.random();
  let t = (s.rngState = (s.rngState + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function shuffle(a, s) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ================= Characters and powers ================= */
/* Each character has one power, usable once per game when "Character powers" is on.
 * timing "bid": chosen secretly with your bid and revealed with it. "now": takes effect at once. */
const POWERS = {
  fox: { name: "Feint", timing: "bid", text: "Your card counts 2 higher this round." },
  owl: { name: "Foresight", timing: "now", text: "See the next 3 gems for the rest of the game." },
  bear: { name: "Bully", timing: "bid", text: "You win every tie this round." },
  cat: { name: "Swap", timing: "bid", text: "At the reveal, this gem trades places with the next one, so the next gem is played for now." },
  frog: { name: "Lucky leap", timing: "bid", text: "If you don't win this round, your card jumps back to your hand." },
  panda: { name: "Bamboo bonus", timing: "bid", text: "If you win this round, you get 3 extra points." },
  penguin: { name: "Upside down", timing: "bid", text: "This round the lowest card wins (curses go to the highest)." },
  robot: { name: "Copycat", timing: "bid", text: "Your card copies the highest card an opponent played." },
  raccoon: { name: "Pickpocket", timing: "bid", text: "If someone else wins this round, you take 2 of their points." },
  dragon: { name: "Fire breath", timing: "bid", text: "The highest card an opponent played counts as 0 this round." },
};

/* ================= Setting up ================= */
const DEFAULT_CONFIG = {
  seatCount: 2, teams: false, tieRule: "split", cursed: false, double: false, gamesToWin: 1, botLevel: "normal",
  showNext: false, mystery: false, jackpot: false, powers: false,
};

/** seats: [{ name, char, bot, level }] */
function newMatch(config, seats, opts = {}) {
  const s = {
    config: Object.assign({}, DEFAULT_CONFIG, config), seats, gameNumber: 1,
    gameWins: Array(sideCount(Object.assign({}, DEFAULT_CONFIG, config))).fill(0), lastGameWinners: [],
    rngState: opts.seed == null ? null : opts.seed,
  };
  deal(s, opts.prizes);
  return s;
}

function dealPrizes(s) {
  const c = s.config;
  let base = c.cursed ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -2, -3] : ALL13.slice();
  if (!c.jackpot) return shuffle(base, s);
  // The jackpot replaces the smallest gem and always lands in the last four rounds.
  base.splice(base.indexOf(1), 1);
  const rest = shuffle(base, s);
  rest.splice(9 + Math.floor(rnd(s) * 4), 0, JACKPOT);
  return rest;
}

function deal(s, fixedPrizes) {
  const n = s.seats.length, c = s.config;
  s.prizes = fixedPrizes ? fixedPrizes.slice() : dealPrizes(s);
  s.prizes0 = s.prizes.slice(); // as dealt, before any Swap power (used to replay online games)
  s.mysteryRound = c.mystery ? 1 + Math.floor(rnd(s) * (s.prizes.length - 1)) : -1;
  s.mr0 = s.mysteryRound;
  s.round = 0;
  s.hands = range(n).map(() => ALL13.slice());
  s.doubleAvail = Array(n).fill(!!c.double);
  s.powerAvail = s.seats.map(x => !!c.powers && !!POWERS[x.char]);
  s.foresight = Array(n).fill(false);
  s.submitted = Array(n).fill(false);
  s.bids = Array(n).fill(null);
  s.ready = s.seats.map(x => x.bot);
  s.history = [];
  s.scores = Array(n).fill(0);
  s.phase = "bidding";
  s.tie = null;
  s.tieNote = "";
}

const prizeNow = s => s.prizes[Math.min(s.round, s.prizes.length - 1)];
const prizeNext = s => s.round + 1 < s.prizes.length ? s.prizes[s.round + 1] : null;
const isLast = s => s.round >= s.prizes.length - 1;
const isMystery = (s, round = s.round) => s.mysteryRound === round;
const sideScore = (s, side) => seatsOnSide(s.config, side).reduce((t, i) => t + s.scores[i], 0);
const sideName = (s, side) => usesTeams(s.config) ? TEAM_NAME[side] : s.seats[side].name;
const matchWinners = s => s.phase === "matchOver" ? range(s.gameWins.length).filter(i => s.gameWins[i] >= s.config.gamesToWin) : [];

/* ================= Playing a round ================= */
function submit(s, seat, bid) {
  if (s.phase !== "bidding" || s.submitted[seat]) return false;
  if (!s.hands[seat].includes(bid.card)) return false;
  if (bid.double && !s.doubleAvail[seat]) return false;
  if (bid.power) {
    const p = POWERS[s.seats[seat].char];
    if (!s.powerAvail[seat] || !p || p.timing !== "bid") return false;
    if (s.seats[seat].char === "cat" && isLast(s)) return false; // nothing to swap with
  }
  s.bids[seat] = { card: bid.card, double: !!bid.double, power: !!bid.power };
  s.submitted[seat] = true;
  return true;
}

/** Powers that act right away (Foresight). Returns true if used. */
function usePowerNow(s, seat) {
  const p = POWERS[s.seats[seat].char];
  if (!p || p.timing !== "now" || !s.powerAvail[seat] || s.phase !== "bidding") return false;
  s.powerAvail[seat] = false;
  if (s.seats[seat].char === "owl") s.foresight[seat] = true;
  return true;
}

/**
 * Who takes the prize. `eff` are the cards' effective values after powers.
 * Normally the highest card takes a gem and the lowest takes a curse; Upside down flips that.
 * `bully` is a seat that wins any tie it is part of (and is never cancelled out).
 */
function pickWinners(prize, eff, tieRule, { reverse = false, bully = -1 } = {}) {
  let cand = range(eff.length), cancelled = [];
  if (tieRule === "cancel") {
    const count = {};
    eff.forEach(c => { count[c] = (count[c] || 0) + 1; });
    cancelled = cand.filter(i => count[eff[i]] > 1 && i !== bully);
    cand = cand.filter(i => count[eff[i]] === 1 || i === bully);
  }
  if (!cand.length) return { winners: [], cancelled };
  const vals = cand.map(i => eff[i]);
  const high = (prize >= 0) !== reverse;
  const target = high ? Math.max(...vals) : Math.min(...vals);
  let winners = cand.filter(i => eff[i] === target);
  if (winners.length > 1 && winners.includes(bully)) winners = [bully];
  return { winners, cancelled };
}

function resolve(s) {
  const c = s.config, n = s.seats.length;
  const bids = s.bids.map(b => Object.assign({}, b));
  const used = ch => bids.findIndex((b, i) => b.power && s.seats[i].char === ch);
  const r = { round: s.round, bids, powers: range(n).filter(i => bids[i].power), mystery: isMystery(s) };

  // Swap: this gem and the next one trade places before scoring.
  const swapper = used("cat");
  if (swapper >= 0 && !isLast(s)) {
    r.swappedFrom = s.prizes[s.round];
    [s.prizes[s.round], s.prizes[s.round + 1]] = [s.prizes[s.round + 1], s.prizes[s.round]];
    if (s.mysteryRound === s.round) s.mysteryRound = s.round + 1;
    else if (s.mysteryRound === s.round + 1) s.mysteryRound = s.round;
  }
  const prize = prizeNow(s);
  r.prize = prize;

  const rivalsOf = i => range(n).filter(k => sideOf(c, k) !== sideOf(c, i));
  const eff = bids.map(b => b.card);
  const fox = used("fox");
  if (fox >= 0) eff[fox] += 2;
  const robot = used("robot");
  if (robot >= 0) eff[robot] = Math.max(...rivalsOf(robot).map(k => bids[k].card));
  const dragon = used("dragon");
  if (dragon >= 0) {
    const rivals = rivalsOf(dragon);
    const top = rivals.reduce((best, k) => eff[k] > eff[best] ? k : best, rivals[0]);
    eff[top] = 0;
    r.burned = top;
  }
  r.reverse = used("penguin") >= 0;
  const bully = used("bear");
  const { winners, cancelled } = pickWinners(prize, eff, c.tieRule, { reverse: r.reverse, bully });
  r.eff = eff;
  r.winners = winners;
  r.cancelled = cancelled;

  const awards = Array(n).fill(0);
  if (winners.length) {
    const share = prize * 12 / winners.length;
    winners.forEach(w => { awards[w] = bids[w].double ? share * 2 : share; });
  }
  const panda = used("panda");
  if (panda >= 0 && winners.includes(panda) && awards[panda] > 0) awards[panda] += 36;
  const raccoon = used("raccoon");
  if (raccoon >= 0 && winners.length === 1 && winners[0] !== raccoon && sideOf(c, winners[0]) !== sideOf(c, raccoon)) {
    awards[winners[0]] -= 24;
    awards[raccoon] += 24;
    r.pickpocket = winners[0];
  }
  r.awards = awards;

  const frog = used("frog");
  range(n).forEach(i => {
    const keep = i === frog && !winners.includes(i);
    if (!keep) s.hands[i] = s.hands[i].filter(v => v !== bids[i].card);
    if (bids[i].double) s.doubleAvail[i] = false;
    if (bids[i].power) s.powerAvail[i] = false;
    s.scores[i] += awards[i];
  });
  r.leapt = frog >= 0 && !winners.includes(frog) ? frog : -1;

  // Margin between the winning card and the best losing card, for "Steal!" moments.
  if (winners.length === 1) {
    const high = (prize >= 0) !== r.reverse;
    const others = range(n).filter(i => i !== winners[0] && !cancelled.includes(i)).map(i => eff[i]);
    if (others.length) r.margin = high ? eff[winners[0]] - Math.max(...others) : Math.min(...others) - eff[winners[0]];
  }
  s.history.push(r);
  s.ready = s.seats.map(x => x.bot);
  s.phase = "reveal";
  return r;
}

function advance(s) {
  const n = s.seats.length;
  if (s.phase === "reveal") {
    if (isLast(s)) finishGame(s);
    else { s.round++; s.submitted = Array(n).fill(false); s.bids = Array(n).fill(null); s.phase = "bidding"; }
  } else if (s.phase === "gameOver") {
    s.gameNumber++;
    deal(s);
  } else return;
  s.ready = s.seats.map(x => x.bot);
}

function finishGame(s) {
  const sc = range(sideCount(s.config)).map(side => sideScore(s, side));
  const best = Math.max(...sc);
  const top = range(sc.length).filter(i => sc[i] === best);
  if (top.length > 1) {
    s.lastGameWinners = [];
    s.tie = { sides: top, spin: null, spinTo: 0, spinAt: 0, result: null, round: 1 };
    s.phase = "tiebreak";
    return;
  }
  awardGame(s, top);
}
function awardGame(s, winners) {
  s.lastGameWinners = winners;
  winners.forEach(w => { s.gameWins[w]++; });
  s.phase = s.gameWins.some(w => w >= s.config.gamesToWin) ? "matchOver" : "gameOver";
  s.ready = s.seats.map(x => x.bot);
}
function rematch(s) {
  s.gameWins = Array(sideCount(s.config)).fill(0);
  s.lastGameWinners = [];
  s.gameNumber = 1;
  deal(s);
}
function replaceWithBot(s, seat, level = "normal") {
  const p = s.seats[seat];
  s.seats[seat] = Object.assign({}, p, { bot: true, level, name: p.name, left: true, pid: null });
  s.ready[seat] = true;
}

/* ================= Tie-breaker wheel ================= */
const TIEBREAKS = [
  { id: "gems", name: "Most gems", color: "#c9962f", desc: "Whoever won the most rounds wins." },
  { id: "biggest", name: "Biggest gem", color: "#c4482a", desc: "Whoever took the highest single gem wins." },
  { id: "recent", name: "Last gem", color: "#2f7f6a", desc: "Whoever took a gem most recently wins." },
  { id: "draw", name: "High card", color: "#6a4a9e", desc: "Each tied side draws a random card. Highest card wins." },
  { id: "shared", name: "Shared win", color: "#2d6497", desc: "Everyone tied wins together." },
];
function gemsTaken(s, side) {
  return s.history.map((h, k) => ({ round: k + 1, prize: h.prize, got: seatsOnSide(s.config, side).reduce((t, i) => t + h.awards[i], 0) }))
    .filter(x => x.got > 0 && x.prize > 0);
}
function tieValue(s, side, id) {
  const won = gemsTaken(s, side);
  if (id === "gems") return won.length;
  if (id === "biggest") return won.length ? Math.max(...won.map(x => x.prize)) : 0;
  if (id === "recent") return won.length ? won[won.length - 1].round : 0;
  return 0;
}
function spinTie(s, now = Date.now()) {
  const t = s.tie, seg = 360 / TIEBREAKS.length;
  t.spin = Math.floor(rnd(s) * TIEBREAKS.length);
  t.spinTo = 360 * 5 - ((t.spin + .5) * seg) + (rnd(s) - .5) * seg * .6;
  t.spinAt = now;
  t.result = null;
}
function applyTiebreak(s) {
  const t = s.tie, opt = TIEBREAKS[t.spin], values = {};
  let winners;
  if (opt.id === "shared") winners = t.sides.slice();
  else {
    if (opt.id === "draw") { const deck = shuffle(ALL13, s); t.sides.forEach((side, k) => { values[side] = deck[k]; }); }
    else t.sides.forEach(side => { values[side] = tieValue(s, side, opt.id); });
    const best = Math.max(...t.sides.map(x => values[x]));
    winners = t.sides.filter(x => values[x] === best);
  }
  t.result = { id: opt.id, values, winners };
}
function finishTiebreak(s) {
  const t = s.tie, r = t.result, opt = TIEBREAKS[t.spin];
  if (r.winners.length > 1 && r.id !== "shared") {
    s.tie = { sides: r.winners, spin: null, spinTo: 0, spinAt: 0, result: null, round: t.round + 1 };
    return;
  }
  s.tieNote = r.id === "shared"
    ? `Tied on ${fmt(sideScore(s, t.sides[0]))} points. The wheel picked a shared win.`
    : `Tied on ${fmt(sideScore(s, t.sides[0]))} points. The wheel picked ${opt.name}.`;
  s.tieWonBy = r.id === "shared" ? [] : r.winners.slice();
  s.tie = null;
  awardGame(s, r.winners);
}

/* ================= Bots ================= */
/* Bots only use public information: every hand, the gems still to come (as the table shows them),
 * and, for Expert, how each rival has bid so far. They never look at pending bids. */
function quantile(v, sorted) {
  const i = sorted.indexOf(v);
  if (sorted.length < 2 || i < 0) return v > 0 ? 1 : 0;
  return i / (sorted.length - 1);
}
/** The value a bot believes the current gem has (a mystery gem is guessed as the average left). */
function believedPrize(s) {
  if (!isMystery(s)) return prizeNow(s);
  const left = s.prizes.slice(s.round);
  return Math.round(left.reduce((a, b) => a + b, 0) / left.length);
}
/** Expert: how high (0..1 of their hand) a rival tends to bid for a gem of strength q. */
function rivalHabit(s, seat, q) {
  const obs = [];
  let hand = ALL13.slice();
  s.history.forEach((h, k) => {
    const left = s.prizes0 ? s.prizes0.slice(k).filter(v => v > 0).sort((a, b) => a - b) : [];
    const qk = h.prize > 0 ? quantile(h.prize, left.includes(h.prize) ? left : left.concat(h.prize).sort((a, b) => a - b)) : 0;
    const sorted = hand.slice().sort((a, b) => a - b);
    const card = h.bids[seat].card;
    if (h.prize > 0 && sorted.length > 1) obs.push({ q: qk, c: sorted.indexOf(card) / (sorted.length - 1) });
    if (h.leapt !== seat) hand = hand.filter(v => v !== card);
  });
  if (obs.length < 2) return q;
  let wsum = 0, csum = 0;
  obs.forEach(o => { const w = 1 / (0.08 + Math.abs(o.q - q)); wsum += w; csum += w * o.c; });
  return Math.max(0, Math.min(1, csum / wsum));
}

function botChoose(s, seat, level) {
  const hand = s.hands[seat].slice().sort((a, b) => a - b);
  const prize = believedPrize(s), canDouble = s.doubleAvail[seat];
  const char = s.seats[seat].char, power = s.powerAvail[seat] && POWERS[char];
  const at = i => hand[Math.max(0, Math.min(hand.length - 1, i))];
  const idx = q => Math.round(q * (hand.length - 1));
  const jitter = () => Math.floor(rnd(s) * 3) - 1;
  if (hand.length === 1) return { card: hand[0], double: canDouble && prize > 0, power: !!power && power.timing === "bid" && prize > 0 && char !== "cat" && char !== "penguin" };

  const mySide = sideOf(s.config, seat);
  const rivals = range(s.seats.length).filter(i => sideOf(s.config, i) !== mySide);
  const positives = s.prizes.slice(s.round).filter(v => v > 0).sort((a, b) => a - b);
  const q = isMystery(s) ? .5 : quantile(prizeNow(s), positives);
  const rh = rivals.map(i => s.hands[i].slice().sort((a, b) => a - b));
  const usePower = cond => !!power && power.timing === "bid" && level !== "easy" && cond;

  if (level === "easy") {
    return { card: hand[Math.floor(rnd(s) * hand.length)], double: canDouble && prize >= 8 && rnd(s) < .3, power: false };
  }

  // Character powers that change which card to play.
  if (usePower(prize > 0 && q >= .8 && (char === "penguin" || char === "robot"))) {
    return { card: hand[0], double: false, power: true }; // play the lowest and let the power do the work
  }
  const next = prizeNext(s);
  if (usePower(char === "cat" && next != null && !isMystery(s, s.round + 1) && next >= 11 && prize <= 5)) {
    return { card: hand[hand.length - 1], double: false, power: true };
  }

  if (level === "normal") {
    if (prize < 0) return { card: at(idx(.3 + .1 * -prize) + jitter()), double: false, power: false };
    return {
      card: at(idx(q) + jitter()),
      double: canDouble && prize >= 9 && q >= .8 && rnd(s) < .5,
      power: usePower(q >= .85 && ["fox", "bear", "panda", "frog", "dragon", "raccoon"].includes(char)),
    };
  }

  // Hard and Expert
  if (prize < 0) {
    const lowestRivalMax = Math.min(...rh.map(h => h[h.length - 1]));
    const safe = hand.find(c => c > lowestRivalMax);
    if (safe !== undefined && hand.indexOf(safe) <= Math.floor(hand.length / 2)) return { card: safe, double: false, power: false };
    return { card: at(idx(.4) + jitter()), double: false, power: false };
  }
  const rivalMax = Math.max(...rh.map(h => h[h.length - 1]));
  if (q >= .7) {
    const sure = hand.find(c => c > rivalMax);
    if (sure !== undefined) return { card: sure, double: canDouble && q >= .85, power: usePower(char === "panda") };
  }
  if (q <= .25) return { card: hand[0], double: false, power: false };

  let guess;
  if (level === "expert") {
    // Predict each rival from how they have bid so far this game.
    guess = Math.max(...rivals.map((r, k) => { const h = rh[k]; return h[Math.round(rivalHabit(s, r, q) * (h.length - 1))]; }));
  } else {
    guess = Math.max(...rh.map(h => h[Math.round(q * (h.length - 1))]));
  }
  let i = idx(q);
  const over = hand.find(c => c > guess);
  const reach = level === "expert" ? (q >= .6 ? 4 : 2) : 2;
  if (over !== undefined && over - guess <= reach) i = hand.indexOf(over);
  if (level !== "expert" && rnd(s) < .2) i += rnd(s) < .5 ? 1 : -1;
  const strong = q >= .75;
  return {
    card: at(i),
    double: canDouble && q >= .9 && hand.length <= 6,
    power: usePower(strong && ["fox", "bear", "frog", "dragon", "raccoon", "panda"].includes(char)),
  };
}
/** Bots use instant powers too (Foresight helps a human more, but a bot still spends it). */
function botInstant(s, seat) {
  if (s.seats[seat].char === "owl" && s.powerAvail[seat] && s.round >= 2 && s.seats[seat].level !== "easy") usePowerNow(s, seat);
}

/* ================= Text ================= */
function summary(s, r, esc = x => x) {
  const prize = prizeName(r.prize), parts = [];
  const nm = i => `<b>${esc(s.seats[i].name)}</b>`;
  r.powers.forEach(i => {
    const p = POWERS[s.seats[i].char];
    if (p && p.timing === "bid") parts.push(`${nm(i)} used ${p.name}.`);
  });
  if (r.swappedFrom != null) parts.push(`The ${prizeName(r.swappedFrom)} swapped places with the next gem.`);
  if (r.burned != null) parts.push(`${nm(r.burned)}'s card was burned to 0.`);
  if (r.cancelled.length) {
    const vals = [...new Set(r.cancelled.map(i => r.eff[i]))].sort((a, b) => a - b).map(RANK);
    parts.push(`${vals.join(" and ")} cancelled out.`);
  }
  if (!r.winners.length) parts.push(`Nobody takes the ${prize}.`);
  else if (r.winners.length === 1) {
    const w = r.winners[0], card = RANK(r.bids[w].card);
    const low = (r.prize >= 0) === r.reverse;
    let t = r.prize >= 0
      ? `${nm(w)} wins the ${prize} with ${card}${low ? " (lowest card)" : ""}`
      : `${nm(w)} ${low ? "bid lowest" : "bid highest"} (${card}) and takes the ${prize}`;
    if (r.bids[w].double) t += `, doubled to ${fmt(r.awards[w])}`;
    parts.push(t + ".");
  } else {
    parts.push(`Tie at ${RANK(r.eff[r.winners[0]])}. ${r.winners.map(nm).join(" and ")} split the ${prize}, ${fmt(r.prize * 12 / r.winners.length)} each.`);
  }
  if (r.pickpocket != null) parts.push(`A pickpocket took 2 points from ${nm(r.pickpocket)}.`);
  if (r.leapt >= 0) parts.push(`${nm(r.leapt)}'s card leapt back to their hand.`);
  return parts.join(" ");
}

/* ================= Online: compact state for presence (4 KiB limit) ================= */
/* The host sends the setup plus every bid so far; each player replays them with this same engine. */
function packState(s) {
  return {
    v: 11, c: s.config,
    st: s.seats.map(p => [p.name, p.char, p.bot ? 1 : 0, p.level || "", p.pid || ""]),
    gn: s.gameNumber, gw: s.gameWins, lw: s.lastGameWinners, p0: s.prizes0, mr0: s.mr0,
    h: s.history.map(r => [r.bids.map(b => b.card), r.bids.map(b => (b.double ? 1 : 0) + (b.power ? 2 : 0))]),
    fs: s.foresight.map(x => x ? 1 : 0), pa: s.powerAvail.map(x => x ? 1 : 0),
    sb: s.submitted.map(x => x ? 1 : 0), rd: s.ready.map(x => x ? 1 : 0),
    r: s.round, ph: s.phase, tie: s.tie, tn: s.tieNote, ra: s.revealAt || 0,
  };
}
function unpackState(m) {
  const seats = m.st.map(([name, char, bot, level, pid]) => ({ name, char, bot: !!bot, level, pid }));
  const s = newMatch(m.c, seats, { prizes: m.p0 });
  s.gameNumber = m.gn;
  s.gameWins = m.gw.slice();
  s.mysteryRound = m.mr0;
  s.mr0 = m.mr0;
  // Owl's Foresight is the only power not tied to a bid.
  m.h.forEach((rec, k) => {
    s.round = k;
    s.phase = "bidding";
    s.submitted = s.seats.map(() => true);
    s.bids = rec[0].map((card, i) => ({ card, double: !!(rec[1][i] & 1), power: !!(rec[1][i] & 2) }));
    resolve(s);
  });
  s.foresight = m.fs.map(Boolean);
  s.powerAvail = m.pa.map(Boolean);
  s.round = m.r;
  s.phase = m.ph;
  s.submitted = m.sb.map(Boolean);
  s.bids = s.seats.map(() => null);
  s.ready = m.rd.map(Boolean);
  s.lastGameWinners = m.lw;
  s.tie = m.tie;
  s.tieNote = m.tn;
  s.revealAt = m.ra;
  return s;
}

if (typeof module !== "undefined") {
  module.exports = {
    PIP, SUIT_NAME, RANK, range, ALL13, JACKPOT, suitFor, prizeLabel, prizeName, usesTeams, sideCount, sideOf, seatsOnSide,
    TEAM_NAME, fmt, rnd, seedFrom, shuffle, POWERS, DEFAULT_CONFIG, newMatch, deal, prizeNow, prizeNext, isLast, isMystery,
    sideScore, sideName, matchWinners, submit, usePowerNow, pickWinners, resolve, advance, finishGame, awardGame, rematch,
    replaceWithBot, TIEBREAKS, gemsTaken, tieValue, spinTie, applyTiebreak, finishTiebreak, botChoose, botInstant, summary,
    packState, unpackState, believedPrize, rivalHabit,
  };
}
