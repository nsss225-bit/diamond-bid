/* Diamond Bid rules engine (version 1.6).
 * Pure game logic: no DOM. Loaded by index.html as a plain script, and by Node for tests. */

/* ================= Basics ================= */
const PIP = { h: "♥︎", c: "♣︎", d: "♦︎", s: "♠︎", star: "★", crown: "♛" };
const SUIT_NAME = { h: "Hearts", c: "Clubs", d: "Diamonds", s: "Spades", star: "Stars", crown: "Crowns" };
const SUITS = ["h", "s", "d", "c"];
const RANK = v => ({ 1: "A", 11: "J", 12: "Q", 13: "K" })[v] || String(v);
const range = n => Array.from({ length: n }, (_, i) => i);
const ALL13 = range(13).map(i => i + 1);
const JACKPOT = 20;
/* Each player's suit. The match stores the full deal in config.suits (you choose yours, the others get the
   remaining suits at random); older games without it fall back to the classic order. */
function playerSuits(n, c = {}) {
  if (Array.isArray(c.suits) && c.suits.length === n && new Set(c.suits).size === n && c.suits.every(x => SUITS.includes(x))) return c.suits;
  return n === 2 ? ["h", "s"] : ["h", "c", "d", "s"];
}
const suitFor = (seat, n, c) => playerSuits(n, c)[seat];
/** The middle deck is always its own suit, Stars or Crowns, picked at random for each match. */
const middleSuit = (n, c = {}) => c.middle === "crown" ? "crown" : "star";
/** Deal suits for a new match: `mine` goes to `seat`, everyone else gets a random remaining suit. */
function dealSuits(n, mine, seat = 0, rand = Math.random) {
  const pool = SUITS.filter(x => x !== mine);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out = [];
  for (let i = 0; i < n; i++) out.push(i === seat ? mine : pool.shift());
  return out;
}
// Gems read like the cards: A for 1, and J, Q and K for 11, 12 and 13 (the jackpot stays 20, curses stay −1 to −3).
const prizeLabel = v => v < 0 ? "−" + (-v) : v === 1 || (v >= 11 && v <= 13) ? RANK(v) : String(v);
const prizeName = v => v === JACKPOT ? "20 jackpot" : v < 0 ? `${prizeLabel(v)} curse` : `${prizeLabel(v)} gem`;
const usesTeams = c => !!c.teams && c.seatCount === 4;
const sideCount = c => usesTeams(c) ? 2 : c.seatCount;
const sideOf = (c, seat) => usesTeams(c) ? seat % 2 : seat;
const seatsOnSide = (c, side) => range(c.seatCount).filter(i => sideOf(c, i) === side);
const TEAM_NAME = ["Red team", "Blue team"];

/** Points are kept in twelfths so splits between 2, 3 or 4 players stay exact. */
function fmt(t) {
  const sign = t < 0 ? "−" : "";
  const a = Math.abs(t), whole = Math.floor(a / 12), rem = a % 12;
  const fr = { 1: "¹⁄₁₂", 2: "⅙", 3: "¼", 4: "⅓", 5: "⁵⁄₁₂", 6: "½", 7: "⁷⁄₁₂", 8: "⅔", 9: "¾", 10: "⅚", 11: "¹¹⁄₁₂" };
  if (rem === 0) return sign + whole;
  return sign + (whole ? whole : "") + fr[rem];
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
  frog: { name: "Second chance", timing: "bid", text: "If you don't win this round, your card comes back to your hand." },
  panda: { name: "Golden bonus", timing: "bid", text: "If you win this round, you get 3 extra points." },
  penguin: { name: "Upside down", timing: "bid", text: "This round the lowest card wins (curses go to the highest)." },
  robot: { name: "Copycat", timing: "bid", text: "Your card copies the highest card an opponent played." },
  raccoon: { name: "Pickpocket", timing: "bid", text: "If someone else wins this round, you take 2 of their points." },
  dragon: { name: "Wipeout", timing: "bid", text: "The highest card an opponent played counts as 0 this round." },
  monkey: { name: "Mimic", timing: "bid", text: "Your card counts as the gem's number this round." },
  bunny: { name: "Soft landing", timing: "bid", text: "If you don't win this round, you still get 1 point." },
  lion: { name: "Royal share", timing: "bid", text: "If you win this round, the gem counts double." },
  octopus: { name: "Smoke screen", timing: "bid", text: "Every opponent's card counts 2 lower this round." },
  unicorn: { name: "Wish", timing: "bid", text: "If you win this round with a 5 or lower, you get 5 extra points." },
  shark: { name: "Toll", timing: "bid", text: "Take 1 point from each opponent this round." },
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
  const monkey = used("monkey");
  if (monkey >= 0) eff[monkey] = Math.abs(prize);
  const robot = used("robot");
  if (robot >= 0) eff[robot] = Math.max(...rivalsOf(robot).map(k => bids[k].card));
  const dragon = used("dragon");
  if (dragon >= 0) {
    const rivals = rivalsOf(dragon);
    const top = rivals.reduce((best, k) => eff[k] > eff[best] ? k : best, rivals[0]);
    eff[top] = 0;
    r.burned = top;
  }
  const octopus = used("octopus");
  if (octopus >= 0) rivalsOf(octopus).forEach(k => { eff[k] -= 2; });
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
  const lion = used("lion");
  if (lion >= 0 && winners.includes(lion) && awards[lion] > 0) awards[lion] *= 2;
  const unicorn = used("unicorn");
  if (unicorn >= 0 && winners.includes(unicorn) && awards[unicorn] > 0 && bids[unicorn].card <= 5) awards[unicorn] += 60;
  const bunny = used("bunny");
  if (bunny >= 0 && !winners.includes(bunny)) awards[bunny] += 12;
  const shark = used("shark");
  if (shark >= 0) rivalsOf(shark).forEach(k => { awards[k] -= 12; awards[shark] += 12; });
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
  // "<tie-breaker id>|<points in twelfths>": the app turns this into a sentence in the player's language.
  s.tieNote = `${r.id}|${sideScore(s, t.sides[0])}`;
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
  if (hand.length === 1) return { card: hand[0], double: canDouble && prize > 0, power: !!power && power.timing === "bid" && prize > 0 && !["cat", "penguin", "unicorn"].includes(char) };

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
  if (usePower(char === "monkey" && prize >= 9 && hand[hand.length - 1] < prize)) {
    return { card: hand[0], double: false, power: true }; // the gem's number beats anything left in hand
  }
  if (usePower(char === "unicorn" && prize >= 8 && q >= .7 && hand[0] <= 5)) {
    return { card: hand.filter(c => c <= 5).pop(), double: false, power: true };
  }
  if (usePower(char === "bunny" && prize > 0 && q <= .3)) return { card: hand[0], double: false, power: true };
  if (usePower(char === "cat" && next != null && !isMystery(s, s.round + 1) && next >= 11 && prize <= 5)) {
    return { card: hand[hand.length - 1], double: false, power: true };
  }

  // Every other choice: weigh each card by simulating what the others are likely to bid.
  const pick = mcBid(s, seat, level, q, prize, hand);
  const strong = q >= .75;
  return {
    card: pick.card,
    double: canDouble && prize > 0 && pick.share >= .6 && (q >= .8 || prize >= 11) && (level !== "normal" || rnd(s) < .6),
    power: usePower(strong && pick.share >= .35 && ["fox", "bear", "frog", "dragon", "raccoon", "panda", "lion", "octopus", "shark"].includes(char)),
  };
}

/* Bot bidding. For every card in hand the bot plays the round out many times in its head: each rival bids a card
   from their real remaining hand, around how strongly they value this gem (Expert reads their habits), with some
   uncertainty. The bot then scores each card as "points I expect to win now" minus "what this card is worth to me
   later", adds its own personality, and plays the best one. Different bots weigh things differently, so they no
   longer all play the same card. */
function mcBid(s, seat, level, q, prize, hand) {
  const n = s.seats.length, c = s.config;
  const mySide = sideOf(c, seat);
  const rivals = range(n).filter(i => sideOf(c, i) !== mySide);
  const gauss = () => (rnd(s) + rnd(s) + rnd(s) - 1.5) * .8;
  // Personality: some bots lean bold, some careful (fixed per character, so it feels like a person).
  const char = s.seats[seat].char || "";
  const h0 = Math.abs(seedFrom("style:" + char));
  const bold = ((h0 % 1000) / 1000 - .5) * .08;
  // Play styles: 0 balanced, 1 aggressive (wants the gem now), 2 thrifty (saves big cards), 3 wildcard (hard to read).
  const style = (h0 >>> 10) % 4;
  // Each bot has favourite gems: big ones, middle ones or small cheap ones (only matters with 3+ players,
  // so four bots don't all chase the same King).
  const focus = n > 2 ? [q >= .7 ? 1.18 : .92, q > .3 && q < .7 ? 1.2 : .88, q <= .4 ? 1.25 : .9, 1][style] : 1;
  const want = focus, save = 1;
  const samples = level === "expert" ? 70 : level === "hard" ? 50 : 24;
  const spread = level === "expert" ? .12 : level === "hard" ? .16 : .22;
  const rh = rivals.map(i => s.hands[i].slice().sort((a, b) => a - b));
  const rq = rivals.map(i => level === "expert" ? rivalHabit(s, i, q) : q);
  // Rivals think too: often they try to bid just above what they expect from everyone else.
  const outbid = rh.map((h, r) => {
    const others = rh.filter((_, k) => k !== r).map((o, k) => o[Math.round(rq[k < r ? k : k + 1] * (o.length - 1))]);
    others.push(hand[Math.round(q * (hand.length - 1))]);
    if (prize < 0) return h[Math.round(.4 * (h.length - 1))];
    const above = h.find(x => x > Math.max(...others));
    return q >= .45 && above !== undefined ? above : h[Math.round(rq[r] * (h.length - 1))];
  });
  // Value of keeping a card: the gem it would most likely buy later, times the chance of actually winning it.
  const future = s.prizes.slice(s.round + 1).filter(v => v > 0).sort((a, b) => a - b);
  const winRate = n === 2 ? .55 : usesTeams(c) ? .5 : .32;
  const keep = card => {
    if (!future.length || hand.length < 2) return 0;
    const u = hand.indexOf(card) / (hand.length - 1);
    return future[Math.round(u * (future.length - 1))] * winRate * (level === "normal" ? .6 : .8);
  };
  const cards = [...new Set(hand)];
  const share = Object.fromEntries(cards.map(x => [x, 0]));
  for (let k = 0; k < samples; k++) {
    const bids = rh.map((h, r) => level !== "normal" && rnd(s) < .5 ? outbid[r]
      : h[Math.max(0, Math.min(h.length - 1, Math.round((rq[r] + gauss() * spread * 2) * (h.length - 1))))]);
    const top = prize >= 0 ? Math.max(...bids) : Math.min(...bids);
    const atTop = bids.filter(b => b === top).length;
    cards.forEach(x => {
      if (prize >= 0) share[x] += x > top ? 1 : x === top ? 1 / (atTop + 1) : 0;
      else share[x] += x < top ? 1 : x === top ? 1 / (atTop + 1) : 0; // chance of taking the curse
    });
  }
  const noise = (level === "expert" ? .3 : level === "hard" ? .6 : 1.4) * (style === 3 ? 1.5 : 1) * (n > 2 ? 1.3 : 1);
  let best = null;
  cards.forEach(x => {
    const p = share[x] / samples;
    const gain = prize >= 0 ? p * prize : -p * -prize;
    const u = hand.length > 1 ? hand.indexOf(x) / (hand.length - 1) : 0;
    const score = gain * want - keep(x) * save + bold * u * Math.max(4, Math.abs(prize)) + gauss() * noise;
    if (!best || score > best.score) best = { card: x, score, share: p };
  });
  return best;
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
    PIP, SUIT_NAME, SUITS, RANK, range, ALL13, JACKPOT, suitFor, playerSuits, middleSuit, dealSuits, prizeLabel, prizeName, usesTeams, sideCount, sideOf, seatsOnSide,
    TEAM_NAME, fmt, rnd, seedFrom, shuffle, POWERS, DEFAULT_CONFIG, newMatch, deal, prizeNow, prizeNext, isLast, isMystery,
    sideScore, sideName, matchWinners, submit, usePowerNow, pickWinners, resolve, advance, finishGame, awardGame, rematch,
    replaceWithBot, TIEBREAKS, gemsTaken, tieValue, spinTie, applyTiebreak, finishTiebreak, botChoose, botInstant, summary,
    packState, unpackState, believedPrize, rivalHabit,
  };
}
