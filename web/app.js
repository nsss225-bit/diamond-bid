/* Diamond Bid app (version 1.4): screens, sound, effects, progress, daily challenge, tutorial and online play.
 * The rules live in engine.js. */
const APP_VERSION = "1.4";

/* ================= Content ================= */
const CHARACTERS = [
  { id: "fox", name: "Fennec", title: "The Sly Fox", line: "Saves big cards for the moments that matter.", ring: "#e8732f" },
  { id: "owl", name: "Prof. Hoot", title: "The Card Counter", line: "Knows exactly what you have left.", ring: "#c79a6b" },
  { id: "bear", name: "Bruno", title: "The Big Bettor", line: "Never met a King he would not play.", ring: "#a8693a" },
  { id: "cat", name: "Duchess", title: "The Cool Cat", line: "Unbothered. Unpredictable.", ring: "#b9a3d6" },
  { id: "frog", name: "Lily", title: "The Lucky Frog", line: "Swears that ties bring good luck.", ring: "#5fae4e" },
  { id: "panda", name: "Bao", title: "The Gentle Giant", line: "Slow, steady and hard to read.", ring: "#e9e6dc" },
  { id: "penguin", name: "Tux", title: "The Gentleman", line: "Bows politely, then takes your gem.", ring: "#6f8fb3" },
  { id: "robot", name: "Unit 13", title: "The Machine", line: "Thirteen cards. Zero emotions.", ring: "#5ef0ff" },
  { id: "raccoon", name: "Rosa", title: "The Pickpocket", line: "Your points look better in her pocket.", ring: "#8f8b86" },
  { id: "dragon", name: "Ember", title: "The Hoarder", line: "Guards every gem she takes.", ring: "#e0583f" },
];
const CHAR = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const CHAR_IDS = CHARACTERS.map(c => c.id);

const AVATAR_SVG = {
  fox: `<rect width="100" height="100" fill="#f4dcbc"/><path d="M18 16 L42 44 L24 54Z" fill="#d9622b"/><path d="M82 16 L58 44 L76 54Z" fill="#d9622b"/><path d="M24 26 L37 42 L27 47Z" fill="#5a2a14"/><path d="M76 26 L63 42 L73 47Z" fill="#5a2a14"/><path d="M16 46 Q50 18 84 46 Q80 72 50 90 Q20 72 16 46Z" fill="#e8732f"/><path d="M24 58 Q40 60 50 90 Q28 78 24 58Z" fill="#fff6ea"/><path d="M76 58 Q60 60 50 90 Q72 78 76 58Z" fill="#fff6ea"/><ellipse cx="37" cy="54" rx="4.2" ry="5.4" fill="#2b1a10"/><ellipse cx="63" cy="54" rx="4.2" ry="5.4" fill="#2b1a10"/><circle cx="38.6" cy="52.2" r="1.4" fill="#fff"/><circle cx="64.6" cy="52.2" r="1.4" fill="#fff"/><ellipse cx="50" cy="80" rx="5.5" ry="3.8" fill="#2b1a10"/>`,
  owl: `<rect width="100" height="100" fill="#d6e2ef"/><path d="M16 26 L34 40 L20 50Z" fill="#6e4429"/><path d="M84 26 L66 40 L80 50Z" fill="#6e4429"/><ellipse cx="50" cy="62" rx="36" ry="40" fill="#8a5a3b"/><ellipse cx="50" cy="58" rx="29" ry="24" fill="#c79a6b"/><circle cx="37" cy="54" r="11" fill="#fff"/><circle cx="63" cy="54" r="11" fill="#fff"/><circle cx="38" cy="55" r="5" fill="#1f1a17"/><circle cx="62" cy="55" r="5" fill="#1f1a17"/><circle cx="39.5" cy="53.5" r="1.5" fill="#fff"/><circle cx="63.5" cy="53.5" r="1.5" fill="#fff"/><circle cx="37" cy="54" r="13" fill="none" stroke="#2a2420" stroke-width="3"/><circle cx="63" cy="54" r="13" fill="none" stroke="#2a2420" stroke-width="3"/><path d="M48 54 Q50 51 52 54" fill="none" stroke="#2a2420" stroke-width="3"/><path d="M45 66 L55 66 L50 75Z" fill="#f0a830"/><path d="M30 86 Q36 82 42 86 M44 88 Q50 84 56 88 M58 86 Q64 82 70 86" fill="none" stroke="#6e4429" stroke-width="2.5"/>`,
  bear: `<rect width="100" height="100" fill="#f1e2c8"/><circle cx="24" cy="28" r="13" fill="#7a4a2a"/><circle cx="76" cy="28" r="13" fill="#7a4a2a"/><circle cx="24" cy="28" r="6.5" fill="#c68b5e"/><circle cx="76" cy="28" r="6.5" fill="#c68b5e"/><circle cx="50" cy="57" r="36" fill="#8b5a34"/><ellipse cx="50" cy="69" rx="17" ry="13" fill="#d9b48a"/><ellipse cx="50" cy="62" rx="6.5" ry="4.8" fill="#2b1a10"/><circle cx="36" cy="49" r="4.2" fill="#2b1a10"/><circle cx="64" cy="49" r="4.2" fill="#2b1a10"/><circle cx="37.3" cy="47.6" r="1.3" fill="#fff"/><circle cx="65.3" cy="47.6" r="1.3" fill="#fff"/><path d="M50 66 Q50 74 43 74 M50 66 Q50 74 57 74" fill="none" stroke="#2b1a10" stroke-width="2.4" stroke-linecap="round"/>`,
  cat: `<rect width="100" height="100" fill="#e6dcf2"/><path d="M18 44 L24 12 L46 30Z" fill="#6d6f7d"/><path d="M82 44 L76 12 L54 30Z" fill="#6d6f7d"/><path d="M24 36 L27 20 L38 30Z" fill="#f2a7bd"/><path d="M76 36 L73 20 L62 30Z" fill="#f2a7bd"/><ellipse cx="50" cy="60" rx="34" ry="30" fill="#7b7e8d"/><path d="M36 28 L40 14 L46 22 L50 9 L54 22 L60 14 L64 28Z" fill="#e8c050" stroke="#b8902a" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="37" cy="56" rx="6.5" ry="7.5" fill="#9be07a"/><ellipse cx="63" cy="56" rx="6.5" ry="7.5" fill="#9be07a"/><ellipse cx="37" cy="56" rx="1.8" ry="6" fill="#1d1f24"/><ellipse cx="63" cy="56" rx="1.8" ry="6" fill="#1d1f24"/><path d="M46.5 66 L53.5 66 L50 70.5Z" fill="#f2a7bd"/><path d="M50 70.5 Q46 76 42 73 M50 70.5 Q54 76 58 73" fill="none" stroke="#3a3c46" stroke-width="2" stroke-linecap="round"/><path d="M42 68 L20 64 M42 71 L21 73 M58 68 L80 64 M58 71 L79 73" stroke="#dcdde4" stroke-width="1.5" stroke-linecap="round"/>`,
  frog: `<rect width="100" height="100" fill="#d6efe1"/><circle cx="31" cy="40" r="15" fill="#5fae4e"/><circle cx="69" cy="40" r="15" fill="#5fae4e"/><ellipse cx="50" cy="64" rx="40" ry="28" fill="#5fae4e"/><circle cx="31" cy="39" r="10" fill="#fff"/><circle cx="69" cy="39" r="10" fill="#fff"/><circle cx="32" cy="40" r="5" fill="#1d2a18"/><circle cx="68" cy="40" r="5" fill="#1d2a18"/><circle cx="33.5" cy="38.5" r="1.6" fill="#fff"/><circle cx="69.5" cy="38.5" r="1.6" fill="#fff"/><path d="M26 66 Q50 84 74 66" fill="none" stroke="#2d5a24" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="22" cy="68" rx="6.5" ry="4" fill="#f29a9a" opacity=".85"/><ellipse cx="78" cy="68" rx="6.5" ry="4" fill="#f29a9a" opacity=".85"/><circle cx="44" cy="58" r="1.5" fill="#2d5a24"/><circle cx="56" cy="58" r="1.5" fill="#2d5a24"/>`,
  panda: `<rect width="100" height="100" fill="#f4e6dc"/><circle cx="24" cy="28" r="13" fill="#1f1f24"/><circle cx="76" cy="28" r="13" fill="#1f1f24"/><circle cx="50" cy="57" r="36" fill="#fbfaf6"/><ellipse cx="36" cy="53" rx="9" ry="12" transform="rotate(28 36 53)" fill="#1f1f24"/><ellipse cx="64" cy="53" rx="9" ry="12" transform="rotate(-28 64 53)" fill="#1f1f24"/><circle cx="37" cy="52" r="3.6" fill="#fff"/><circle cx="63" cy="52" r="3.6" fill="#fff"/><circle cx="37.6" cy="52.4" r="1.8" fill="#1f1f24"/><circle cx="62.4" cy="52.4" r="1.8" fill="#1f1f24"/><ellipse cx="50" cy="66" rx="5.5" ry="3.8" fill="#1f1f24"/><path d="M50 69 Q50 75 44 75 M50 69 Q50 75 56 75" fill="none" stroke="#1f1f24" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="27" cy="68" rx="5" ry="3" fill="#f5b5b5" opacity=".7"/><ellipse cx="73" cy="68" rx="5" ry="3" fill="#f5b5b5" opacity=".7"/>`,
  penguin: `<rect width="100" height="100" fill="#d9e6f4"/><circle cx="50" cy="54" r="40" fill="#23262e"/><path d="M50 40 C38 24 14 36 24 60 C29 74 42 82 50 84 C58 82 71 74 76 60 C86 36 62 24 50 40Z" fill="#f7f5ef"/><circle cx="40" cy="53" r="4.2" fill="#23262e"/><circle cx="60" cy="53" r="4.2" fill="#23262e"/><circle cx="41.4" cy="51.6" r="1.3" fill="#fff"/><circle cx="61.4" cy="51.6" r="1.3" fill="#fff"/><circle cx="60" cy="53" r="8.5" fill="none" stroke="#d9ab4f" stroke-width="2"/><path d="M68 57 Q74 66 70 76" fill="none" stroke="#d9ab4f" stroke-width="1.4"/><path d="M43 61 L57 61 L50 70Z" fill="#f0a030"/><path d="M36 88 L47 92.5 L36 97Z M64 88 L53 92.5 L64 97Z" fill="#c42a3c"/><rect x="46" y="89.5" width="8" height="6" rx="2" fill="#a51f30"/>`,
  robot: `<rect width="100" height="100" fill="#dfe6ea"/><line x1="50" y1="10" x2="50" y2="24" stroke="#5b6770" stroke-width="3"/><circle cx="50" cy="10" r="4.5" fill="#ff4f5e"/><circle cx="16" cy="54" r="6" fill="#5b6770"/><circle cx="84" cy="54" r="6" fill="#5b6770"/><rect x="18" y="24" width="64" height="58" rx="15" fill="#9aa7b0"/><rect x="26" y="34" width="48" height="32" rx="9" fill="#1d2a33"/><rect x="33" y="42" width="11" height="9" rx="2.5" fill="#5ef0ff"/><rect x="56" y="42" width="11" height="9" rx="2.5" fill="#5ef0ff"/><rect x="37" y="57" width="4" height="3" fill="#5ef0ff"/><rect x="44" y="57" width="4" height="3" fill="#5ef0ff"/><rect x="51" y="57" width="4" height="3" fill="#5ef0ff"/><rect x="58" y="57" width="4" height="3" fill="#5ef0ff"/><text x="50" y="77" text-anchor="middle" font-family="Figtree, sans-serif" font-size="9" font-weight="700" fill="#4a565e">13</text>`,
  raccoon: `<rect width="100" height="100" fill="#e3dfd7"/><path d="M16 34 L26 8 L42 28Z" fill="#6f6c69"/><path d="M84 34 L74 8 L58 28Z" fill="#6f6c69"/><path d="M23 28 L28 15 L35 26Z" fill="#f0e9e0"/><path d="M77 28 L72 15 L65 26Z" fill="#f0e9e0"/><ellipse cx="50" cy="58" rx="36" ry="32" fill="#8f8b86"/><path d="M15 54 Q50 34 85 54 Q78 67 63 62 Q50 57 37 62 Q22 67 15 54Z" fill="#26231f"/><circle cx="37" cy="54" r="5.2" fill="#fff"/><circle cx="63" cy="54" r="5.2" fill="#fff"/><circle cx="37.6" cy="54.6" r="2.7" fill="#1a1714"/><circle cx="62.4" cy="54.6" r="2.7" fill="#1a1714"/><path d="M33 70 Q50 94 67 70 Q50 63 33 70Z" fill="#f4efe8"/><ellipse cx="50" cy="70" rx="5.2" ry="3.7" fill="#1a1714"/><path d="M50 74 Q50 80 45 80 M50 74 Q50 80 55 80" fill="none" stroke="#1a1714" stroke-width="2" stroke-linecap="round"/>`,
  dragon: `<rect width="100" height="100" fill="#f6dccf"/><path d="M28 32 L18 6 L42 24Z" fill="#e8c050"/><path d="M72 32 L82 6 L58 24Z" fill="#e8c050"/><ellipse cx="50" cy="57" rx="35" ry="33" fill="#c8402c"/><path d="M30 26 Q50 16 70 26 L64 34 Q50 28 36 34Z" fill="#a83220"/><ellipse cx="50" cy="73" rx="21" ry="14" fill="#e8735b"/><circle cx="43" cy="71" r="2.2" fill="#5a1a10"/><circle cx="57" cy="71" r="2.2" fill="#5a1a10"/><ellipse cx="35" cy="51" rx="7.5" ry="6.5" fill="#ffe27a"/><ellipse cx="65" cy="51" rx="7.5" ry="6.5" fill="#ffe27a"/><ellipse cx="35" cy="51" rx="2.2" ry="5.5" fill="#2a120c"/><ellipse cx="65" cy="51" rx="2.2" ry="5.5" fill="#2a120c"/><path d="M27 41 L42 45 M73 41 L58 45" stroke="#7a2014" stroke-width="3" stroke-linecap="round"/><path d="M40 84 L43 90 L46 84 M54 84 L57 90 L60 84" fill="#fff"/>`,
};

const DECKS = [
  { id: "classic", name: "Classic", note: "Ivory and oxblood" },
  { id: "royal", name: "Royal", note: "Navy with gold" },
  { id: "sakura", name: "Sakura", note: "Blossom pink" },
  { id: "noir", name: "Noir", note: "Black and gold ink" },
  { id: "retro", name: "Retro", note: "Seventies stripes" },
  { id: "arcade", name: "Arcade", note: "Neon grid" },
  { id: "gold", name: "Gold Leaf", note: "Gilded backs" },
  { id: "galaxy", name: "Galaxy", note: "Stars and nebula" },
];
const TABLES = [
  { id: "green", name: "Baize", a: "#1d5a4b", b: "#0b2620" },
  { id: "ocean", name: "Ocean", a: "#1c4a78", b: "#0a1d33" },
  { id: "wine", name: "Wine", a: "#6a2236", b: "#2a0b15" },
  { id: "slate", name: "Slate", a: "#3e464e", b: "#15181c" },
  { id: "plum", name: "Plum", a: "#53306f", b: "#1d0f2b" },
  { id: "midnight", name: "Midnight", a: "#2a3170", b: "#0b0e24" },
];

/* Coins. Starters are free; everything else is bought with coins earned by playing. */
const PRICES = {
  fox: 0, owl: 0, bear: 0, cat: 1000, frog: 1000, panda: 1250, penguin: 1250, robot: 1500, raccoon: 2500, dragon: 3500,
  classic: 0, royal: 0, sakura: 750, noir: 1000, retro: 1000, arcade: 1250, gold: 2000, galaxy: 3000,
  green: 0, ocean: 400, wine: 400, slate: 500, plum: 500, midnight: 1250,
};
const GIFT_LADDER = [100, 120, 140, 160, 180, 200, 250]; // daily gift by streak day, day 7 and on pays the most
const BOT_REWARD = { easy: 10, normal: 15, hard: 20, expert: 30 };
const ACH_REWARD = 50;
const COIN = `<span class="coin" aria-hidden="true"></span>`;
const fmtCoins = n => Number(n).toLocaleString("en-US");

const ACHIEVEMENTS = [
  { id: "first_gem", icon: "◆", name: "First sparkle", desc: "Win your first gem." },
  { id: "first_win", icon: "★", name: "Winner", desc: "Win a match." },
  { id: "steal", icon: "↯", name: "Steal!", desc: "Win a round by exactly one." },
  { id: "giant_slayer", icon: "⚔", name: "Giant slayer", desc: "Take the 13 gem or the jackpot with a 7 or lower." },
  { id: "hat_trick", icon: "∴", name: "Hat trick", desc: "Win three rounds in a row." },
  { id: "double_trouble", icon: "×", name: "Double trouble", desc: "Score 20 or more points in one round." },
  { id: "jackpot", icon: "☀", name: "Jackpot!", desc: "Take the 20 jackpot gem." },
  { id: "curse_dodger", icon: "☂", name: "Curse dodger", desc: "Finish a game with cursed gems and take no curse." },
  { id: "power_play", icon: "⚡", name: "Power play", desc: "Win a round with your character's power." },
  { id: "wheel", icon: "☸", name: "Wheel of fortune", desc: "Win a game on the tie-breaker wheel." },
  { id: "hard_win", icon: "♜", name: "Tough cookie", desc: "Beat a Hard bot in a match." },
  { id: "expert_win", icon: "♛", name: "Mind reader", desc: "Beat an Expert bot in a match." },
  { id: "full_table", icon: "♣", name: "Last one standing", desc: "Win a 4-player free-for-all." },
  { id: "teamwork", icon: "♡", name: "Teamwork", desc: "Win a 2 vs 2 match." },
  { id: "daily", icon: "☼", name: "Daily player", desc: "Finish a daily challenge." },
  { id: "online", icon: "☁", name: "Good game", desc: "Finish an online game with friends." },
  { id: "learner", icon: "✑", name: "Quick learner", desc: "Finish the tutorial." },
];

const GEM_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L36 20 L20 37 L4 20Z" style="fill:var(--gem)"/><path d="M20 3 L36 20 L20 20Z" style="fill:var(--gem-hi)"/><path d="M20 20 L4 20 L20 37Z" style="fill:var(--gem-lo)"/><path d="M20 3 L36 20 L20 37 L4 20Z" style="fill:none;stroke:var(--brass)" stroke-width="2" stroke-linejoin="round"/></svg>`;
/* The Diamond Bid logo: a cut gem in front of a hearts card and a spades card, inside a gold ring. Each copy gets its own ids. */
let logoCount = 0;
function logoSVG(cls = "") {
  const id = "lg" + (++logoCount);
  const spark = (x, y, s, k) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="lg-spark" style="animation-delay:${k * .45}s" d="M0-10L2.4-2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4-2.4Z" fill="#fff4c8"/></g>`;
  const card = (cls2, rank, color, pip) => `<g class="${cls2}"><rect x="82" y="58" width="76" height="110" rx="10" fill="#faf5e8" stroke="#d8cba9" stroke-width="1.5"/>
    <text x="93" y="86" font-family="'Bodoni Moda', Georgia, serif" font-weight="800" font-size="24" fill="${color}">${rank}</text>
    <path transform="translate(97 94) scale(.55)" d="${pip}" fill="${color}"/></g>`;
  const HEART = "M0 6C-6-1-14 3-12 10C-10 15-3 19 0 24C3 19 10 15 12 10C14 3 6-1 0 6Z";
  const SPADE = "M0-2C-4 6-13 9-12 16C-11 21-5 22-2 18L-4 26H4L2 18C5 22 11 21 12 16C13 9 4 6 0-2Z";
  return `<svg class="logo ${cls}" viewBox="0 0 240 240" role="img" aria-label="Diamond Bid">
  <defs>
    <radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f3c969" stop-opacity=".45"/><stop offset="1" stop-color="#f3c969" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}c"><path d="M84 98H156L178 119L120 190L62 119Z"/></clipPath>
  </defs>
  <circle cx="120" cy="120" r="116" fill="url(#${id}g)"/>
  <circle class="lg-ring" cx="120" cy="120" r="104" fill="none" stroke="#d9ab4f" stroke-width="3" stroke-linecap="round"/>
  ${card("lg-cl", "A", "#c8283c", HEART)}
  ${card("lg-cr", "K", "#1d1d24", SPADE)}
  <g class="lg-gem">
    <path d="M84 98L62 119H102Z" fill="#f08a5d"/><path d="M84 98H120L102 119Z" fill="#f8b48e"/><path d="M120 98L102 119H138Z" fill="#ec7a4f"/>
    <path d="M120 98H156L138 119Z" fill="#f49c72"/><path d="M156 98L178 119H138Z" fill="#d4512d"/>
    <path d="M62 119H102L120 190Z" fill="#c2441f"/><path d="M102 119H138L120 190Z" fill="#e3693d"/><path d="M138 119H178L120 190Z" fill="#a83a1c"/>
    <g clip-path="url(#${id}c)"><rect class="lg-shine" x="70" y="80" width="22" height="130" fill="#fff" transform="rotate(20 120 130)"/></g>
    <path d="M84 98H156L178 119L120 190L62 119Z" fill="none" stroke="#f6d88f" stroke-width="3" stroke-linejoin="round"/>
  </g>
  ${spark(182, 74, 1.1, 0)}${spark(52, 150, .7, 1)}${spark(176, 176, .55, 2)}${spark(66, 64, .5, 3)}
</svg>`;
}
const wordmark = () => `<div class="wordmark" dir="ltr">Diamond <em>Bid</em></div>`;
/** "Looking for players…": the logo, gently alive, with a line of text. */
const searching = text => `<div class="searching">${logoSVG("live")}<p>${text}</p></div>`;
const rotateNotice = () => `<div class="rotate">${logoSVG()}<svg class="phone" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18.5" r="1" fill="currentColor"/></svg><p>${t("Turn your phone upright to play")}</p></div>`;
function showSplash() {
  if (!document.body || !document.createElement) return;
  const el = document.createElement("div");
  el.className = "splash";
  el.setAttribute && el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="splash-in">${logoSVG("intro")}${wordmark()}<div class="splash-bar"><span></span></div></div>`;
  document.body.appendChild(el);
  const done = () => { if (el.classList) el.classList.add("out"); setTimeout(() => el.remove(), 450); };
  const timer = setTimeout(done, 2300);
  if (el.addEventListener) el.addEventListener("click", () => { clearTimeout(timer); done(); });
}
const JACKPOT_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 L37 20 L20 38 L3 20Z" fill="#fff8dc"/><path d="M20 2 L37 20 L20 20Z" fill="#ffe9a0"/><path d="M20 20 L3 20 L20 38Z" fill="#c8942c"/><path d="M20 2 L37 20 L20 38 L3 20Z" fill="none" stroke="#7a4a00" stroke-width="2" stroke-linejoin="round"/></svg>`;
const CURSE_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 C24 11 33 15 31 26 C30 33 25 37 20 37 C14 37 9 33 9 26 C9 20 13 17 14 12 C17 16 17 19 19 20 C20 14 18 9 20 3Z" fill="currentColor"/></svg>`;
const SPEAKER_SVG = on => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${on ? `<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>` : `<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`}</svg>`;
// Score colors for each side: red and blue like a scoreboard, then green and gold for 3–4 players.
const DEAL_GAP = 75;
const SIDE_COLOR = ["#ff7b8a", "#6ea8ff", "#5fd896", "#f5c75a"];
const TEAM_COLOR = SIDE_COLOR.slice(0, 2);
const REVEAL_MS = 3000;
// Running inside the App Store / Google Play app (Capacitor) rather than on claude.ai.
const IN_APP = !!(typeof window !== "undefined" && window.Capacitor);
// Online and vs bots: 10 seconds to bid, then a card is played for you; 20 seconds to come back or you're out.
const TURN_MS = 10000, AWAY_MS = 20000;
const TIMED_KINDS = ["bots", "online"];
const SPIN_MS = 4200;
const TUTORIAL_PRIZES = [5, 13, 2, 9, 1, 11, 7, 3, 12, 6, 10, 4, 8];
const DAILY_CONFIG = { seatCount: 2, tieRule: "split", cursed: true, double: true, gamesToWin: 1, botLevel: "hard", showNext: true, mystery: true, jackpot: true, powers: false };

/* ================= Preferences and progress ================= */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const DEFAULT_PREFS = { character: "fox", name: "", deck: "classic", table: "green", fourColor: false, sound: true, config: Object.assign({}, DEFAULT_CONFIG), localPlayers: 2, passChars: {} };
let prefs = Object.assign({}, DEFAULT_PREFS, store.get("diamondbid.prefs", {}));
prefs.config = Object.assign({}, DEFAULT_CONFIG, prefs.config);
let stats = Object.assign({ played: 0, won: 0, ach: {}, dailyDays: [], dailyBest: {}, coins: 0, owned: [], lastGift: "", giftStreak: 0, walletV: 0, tutorialPaid: false }, store.get("diamondbid.stats", {}));
const savePrefs = () => store.set("diamondbid.prefs", prefs);
const saveStats = () => store.set("diamondbid.stats", stats);
const achCount = () => Object.keys(stats.ach).length;

const priceOf = item => PRICES[item.id] || 0;
function isUnlocked(item) { return !!item && (priceOf(item) === 0 || stats.owned.includes(item.id)); }
const itemById = id => CHAR[id] || DECKS.find(d => d.id === id) || TABLES.find(t => t.id === id);
const kindOf = id => CHAR[id] ? "character" : DECKS.some(d => d.id === id) ? "card design" : "table";
/* First run of the coin system: keep everything a player already uses or earned in 1.1, and give a welcome gift. */
if (stats.walletV < 1) {
  const keep = [prefs.character, prefs.deck, prefs.table];
  if (achCount() >= 3) keep.push("raccoon");
  if (stats.ach.expert_win) keep.push("dragon");
  if (stats.won >= 5) keep.push("gold");
  if (stats.dailyDays.length >= 3) keep.push("galaxy");
  if (achCount() >= 8) keep.push("midnight");
  stats.owned = [...new Set(stats.owned.concat(keep.filter(id => PRICES[id] > 0)))];
  stats.coins += 200;
  stats.walletV = 1;
  saveStats();
}
setLang(prefs.lang || detectLang());
if (!CHAR[prefs.character] || !isUnlocked(CHAR[prefs.character])) prefs.character = "fox";
if (!DECKS.some(d => d.id === prefs.deck && isUnlocked(d))) prefs.deck = "classic";
if (!TABLES.some(t => t.id === prefs.table && isUnlocked(t))) prefs.table = "green";

function applyLook() {
  const root = document.documentElement;
  root.lang = LANG;
  root.dir = isRTL() ? "rtl" : "ltr";
  root.dataset.deck = prefs.deck;
  root.dataset.table = prefs.table;
  root.dataset.four = prefs.fourColor ? "1" : "0";
}
/* Display helpers that translate names and game words. */
const charName = id => t(CHAR[id].name);
/** A seat's name on screen: characters (bots, or players who kept the default) get their translated name. */
const sn = (s, i) => { const p = s.seats[i]; return (p.bot && !p.left) || p.name === CHAR[p.char].name ? charName(p.char) : p.name; };
const sideLabel = (s, side) => usesTeams(s.config) ? t(TEAM_NAME[side]) : sn(s, side);
const pName = v => v === JACKPOT ? t("20 jackpot") : v < 0 ? t("{v} curse", { v: prizeLabel(v) }) : t("{v} gem", { v });
const levelName = l => t({ easy: "Easy", normal: "Normal", hard: "Hard", expert: "Expert" }[l] || l);
const powerName = id => t(POWERS[id].name);
const powerText = id => t(POWERS[id].text);
const list = arr => arr.join(t(" and "));
const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const cleanName = v => String(v || "").replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁤﻿]/g, "").trim().slice(0, 16);
const myName = () => cleanName(prefs.name) || charName(prefs.character);
const todayKey = (d = new Date()) => { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/* ================= Sound and vibration ================= */
const Sound = (() => {
  let ctx = null;
  const on = () => prefs.sound !== false;
  function ac() {
    if (!on()) return null;
    try {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(freq, dur, { type = "sine", vol = .14, at = 0, glide = null } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, { freq = 2200, q = .9, vol = .3, at = 0 } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination); src.start(t);
  }
  return {
    unlock() { ac(); },
    select() { tone(1500, .035, { type: "triangle", vol: .05 }); },
    snap() { noise(.07, { freq: 2600, vol: .38 }); tone(170, .07, { vol: .07 }); },
    flip() { noise(.05, { freq: 3200, vol: .25 }); noise(.05, { freq: 2300, vol: .22, at: .1 }); },
    // Winning a hand: a bright rising "ta-da" with a sparkle on top.
    win() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i === 3 ? .5 : .16, { type: "triangle", vol: .16, at: .15 + i * .08 })); [2637, 3136].forEach((f, i) => tone(f, .18, { vol: .05, at: .5 + i * .06 })); },
    big() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i === 5 ? .7 : .16, { type: "triangle", vol: .16, at: .15 + i * .08 })); [2093, 2637, 3136].forEach((f, i) => tone(f, .25, { vol: .06, at: .7 + i * .07 })); },
    // Losing a hand: a "wah-wah" sliding down.
    lose() { tone(392, .22, { type: "sawtooth", vol: .07, at: .15, glide: 370 }); tone(330, .55, { type: "sawtooth", vol: .07, at: .4, glide: 220 }); tone(165, .55, { vol: .12, at: .4, glide: 110 }); },
    // Losing the whole game: four sad steps down.
    sad() { [392, 370, 349].forEach((f, i) => tone(f, .3, { type: "sawtooth", vol: .06, at: i * .32 })); tone(330, 1, { type: "sawtooth", vol: .06, at: .96, glide: 300 }); tone(165, 1, { vol: .1, at: .96, glide: 150 }); },
    // A card sliding onto the felt (dealing and placing).
    card(at = 0) { noise(.06, { freq: 3800, q: .7, vol: .22, at }); },
    deal(n, gap) { for (let k = 0; k < n; k++) noise(.05, { freq: 3400 + Math.random() * 900, q: .7, vol: .2, at: k * gap }); },
    tick() { tone(1050, .035, { type: "square", vol: .035 }); },
    wheel(ms) { let t = 0, gap = .04; while (t < ms / 1000 - .2) { tone(1800, .02, { type: "square", vol: .03, at: t }); t += gap; gap *= 1.09; } },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i > 3 ? .5 : .2, { type: "triangle", vol: .13, at: i * .12 })); },
    chime() { [1319, 1760, 2093].forEach((f, i) => tone(f, .3, { vol: .08, at: i * .07 })); },
  };
})();
function buzz(pattern) { try { if (prefs.sound !== false && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }

/* ================= Effects ================= */
function toast(icon, title, sub) {
  const box = document.getElementById("toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="ti">${esc(icon)}</span><div><small>${esc(sub)}</small><b>${esc(title)}</b></div>`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
function confetti(amount = 140) {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas");
  cv.id = "confetti";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d"), W = cv.width = innerWidth, H = cv.height = innerHeight;
  const colors = ["#d9ab4f", "#ec7a4f", "#ef5a6c", "#f3ede0", "#8fe3ff", "#5fd38a"];
  const parts = Array.from({ length: amount }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 12, vy: -Math.random() * 13 - 4, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)] }));
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .32; p.vx *= .99; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - t / 2800); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
    if (t < 2800) requestAnimationFrame(frame); else cv.remove();
  })(start);
}

/* ================= Achievements ================= */
function grant(id) {
  if (stats.ach[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  stats.ach[id] = Date.now();
  saveStats();
  if (G) G.newAch.push(a.name);
  toast(a.icon, t(a.name), t("Achievement unlocked"));
  Sound.chime();
  addCoins(ACH_REWARD, t(a.name));
}
function addCoins(n, why) {
  if (!n) return;
  stats.coins += n;
  saveStats();
  if (G) G.coinsEarned = (G.coinsEarned || 0) + n;
  setTimeout(() => toast("\u25C9", t("+{n} coins", { n }), why), 350);
  const badge = document.getElementById("coin-count");
  if (badge) badge.textContent = fmtCoins(stats.coins);
}
/** Coins for finishing a game. */
function gameReward(iWon) {
  const s = G.s;
  if (G.kind === "pass") return [10, t("Pass and play game")];
  if (G.kind === "tutorial") { if (stats.tutorialPaid) return [0, ""]; stats.tutorialPaid = true; return [100, t("Tutorial finished")]; }
  if (G.kind === "online") return [20 + (iWon ? 40 : 0), iWon ? t("Online win") : t("Online game")];
  if (G.kind === "daily") {
    const first = !stats.dailyPaid || stats.dailyPaid !== G.dailyDate;
    if (!first) return [10, t("Daily challenge replay")];
    stats.dailyPaid = G.dailyDate;
    return [50 + Math.max(0, Math.round(s.scores[0] / 12)), t("Daily challenge")];
  }
  const mySide = sideOf(s.config, me());
  const levels = s.seats.filter((x, k) => x.bot && sideOf(s.config, k) !== mySide).map(x => x.level);
  const base = Math.max(10, ...levels.map(l => BOT_REWARD[l] || 10));
  return [base + (iWon ? base * 2 : 0), iWon ? t("Win vs bots") : t("Game vs bots")];
}
/* ================= App state ================= */
let app = { screen: "home", setup: null, modal: null, botOffset: Math.floor(Math.random() * 10), introDone: false };
let G = null; // the current game
let botTimer = null, revealTimer = null, tickTimer = null, spinTimer = null, turnTimer = null, awayTimer = null, clockTimer = null;

function newG(kind, s, mySeats, extra = {}) {
  return Object.assign({
    kind, role: null, s, mySeats, unlocked: mySeats.length === 1 ? mySeats[0] : null,
    selected: null, useDouble: false, usePower: false, revealAnim: false, seen: [], prizeKey: null,
    recorded: false, revealAt: 0, localSpinAt: 0, track: kind !== "pass", streak: 0, newAch: [], banner: null, prev: {},
  }, extra);
}
const isAuthority = () => G && (G.kind !== "online" || G.role === "host");
const me = () => G && G.mySeats.length ? G.mySeats[0] : -1;
const roundKey = s => `${s.gameNumber}.${s.round}`;

/* ================= Markup helpers ================= */
const avatar = (id, cls = "") => `<span class="avatar ${cls}" style="--ring:${CHAR[id].ring}" role="img" aria-label="${esc(charName(id))}"><svg viewBox="0 0 100 100">${AVATAR_SVG[id]}</svg></span>`;
function cardFace(suit, v, cls = "", tag = "div", attrs = "") {
  return `<${tag} class="card suit-${suit} ${cls}" ${attrs} aria-label="${RANK(v)} · ${t(SUIT_NAME[suit])}"><span class="ix"><b>${RANK(v)}</b><i>${PIP[suit]}</i></span><span class="pip">${PIP[suit]}</span><span class="ix b"><b>${RANK(v)}</b><i>${PIP[suit]}</i></span></${tag}>`;
}
const cardBack = (cls = "") => `<div class="card back ${cls}" aria-label="${t("Face-down card")}"></div>`;
function prizeCard(v, cls = "", hidden = false) {
  if (hidden) return `<div class="card prize mystery ${cls}" aria-label="${t("Mystery gem")}"><b>?</b></div>`;
  if (v === JACKPOT) return `<div class="card prize jackpot ${cls}" aria-label="${t("20 jackpot")}">${JACKPOT_SVG}<b>20</b></div>`;
  return `<div class="card prize ${v < 0 ? "curse" : ""} ${cls}" aria-label="${pName(v)}">${v < 0 ? CURSE_SVG : GEM_SVG}<b>${prizeLabel(v)}</b></div>`;
}
const thinking = () => `<span class="thinking" aria-label="${t("choosing")}"><span></span><span></span><span></span></span>`;
const feltPip = suit => {
  const four = prefs.fourColor;
  const color = { h: "#ef5a6c", d: four ? "#6f9bff" : "#ef5a6c", c: four ? "#5fd38a" : "var(--ink)", s: "var(--ink)" }[suit];
  return `<span style="color:${color}">${PIP[suit]}</span>`;
};
const lockOverlay = item => `<span class="lock"><b>${COIN} ${fmtCoins(priceOf(item))}</b><span>${t("Tap to buy")}</span></span>`;
const awardText = a => `${a > 0 ? "+" : ""}${fmt(a)}`;

/** The gems a seat has taken this game, as small chips. */
function gemPile(s, seat) {
  const got = s.history.filter(h => h.awards[seat] !== 0);
  if (!got.length) return `<div class="pile"></div>`;
  const chips = got.slice(-7).map(h => {
    const cls = h.prize === JACKPOT ? "j" : h.prize < 0 || h.awards[seat] < 0 ? "c" : "";
    const split = h.winners.length > 1 ? " s" : "";
    return `<span class="chip-gem ${cls}${split}" title="${pName(h.prize)}: ${awardText(h.awards[seat])}">${prizeLabel(h.prize)}</span>`;
  }).join("");
  return `<div class="pile" aria-label="${t("Gems taken")}">${got.length > 7 ? `<span class="chip-more">+${got.length - 7}</span>` : ""}${chips}</div>`;
}

/* ================= Home ================= */
/* Home screen tabs (a tab bar along the bottom, like most phone games). */
const TAB_ICON = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const HOME_TABS = [
  { id: "play", label: "Play", icon: TAB_ICON("M7 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16.5 6.5l2.6.9a2 2 0 0 1 1.2 2.5l-3.3 9.4M10.5 9.5l2 2.5-2 2.5-2-2.5z") },
  { id: "daily", label: "Daily", icon: TAB_ICON("M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3.5v4M16 3.5v4M12 13.2l1.1 2.1 2.3.3-1.7 1.6.4 2.3-2.1-1.1-2.1 1.1.4-2.3-1.7-1.6 2.3-.3z") },
  { id: "style", label: "Customize", icon: TAB_ICON("M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.7 0-1 .8-1.6 1.8-1.6H17a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.5-8.5-7.5zM7.8 11.5h.01M10 7.8h.01M14.5 7.8h.01") },
  { id: "ach", label: "Achievements", icon: TAB_ICON("M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v3M8.5 20h7M10 16h4l.5 4h-5z") },
  { id: "how", label: "How to play", icon: TAB_ICON("M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.6M12 17h.01") },
];
function renderHome() {
  const c = CHAR[prefs.character];
  const intro = app.introDone ? "" : "intro";
  app.introDone = true;
  const fanCards = [
    [cardFace("h", 13, "xl"), -26, 18, 0], [cardFace("c", 12, "xl"), -13, 4, 1], [prizeCard(13, "xl"), 0, 0, 2],
    [cardFace("d", 11, "xl"), 13, 4, 3], [cardFace("s", 1, "xl"), 26, 18, 4],
  ].map(([html, r, y, i]) => html.replace('class="card', `style="--r:${r}deg;--y:${y}px;--d:${i * 90}ms;z-index:${i === 2 ? 5 : i}" class="card`)).join("");
  const onlineReady = Online.checked && Online.room;
  const got = achCount();

  const tab = HOME_TABS.some(x => x.id === app.tab) ? app.tab : "play";
  const header = `
    <header class="topbar">
      <div class="brand">${GEM_SVG}Diamond Bid</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="langbtn" data-act="lang" aria-label="${t("Language")}">${GLOBE_SVG}<b>${LANG.toUpperCase()}</b></button>
        <button class="coinbtn" data-act="coins" aria-label="${t("{n} coins. How to earn more", { n: fmtCoins(stats.coins) })}">${COIN}<b id="coin-count">${fmtCoins(stats.coins)}</b></button>
        <button class="icon-btn" data-act="sound" aria-label="${prefs.sound ? t("Turn sound off") : t("Turn sound on")}" aria-pressed="${prefs.sound}">${SPEAKER_SVG(prefs.sound)}</button>
      </div>
    </header>`;

  const playTab = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${t("A card game of secret bids · 2 or 4 players")}</p>
        <h1>Diamond <em>Bid</em></h1>
        <p class="lede">${t("Thirteen gems, thirteen cards each. Everyone bids one card face down, all cards flip at once, and the highest card takes the gem.")}</p>
        <div class="cta">
          <button class="btn primary" data-act="open-setup" data-kind="bots">${t("Play vs bots")}</button>
          <button class="btn ghost" data-act="open-online" ${onlineReady ? "" : `style="opacity:.6"`}>${t("Play online")}</button>
          <button class="btn ghost" data-act="open-setup" data-kind="pass">${t("Pass and play")}</button>
        </div>
        <div class="cta2">
          ${prefs.lastKind && stats.played ? `<button class="link replay" data-act="replay">↻ ${t("Play again")}</button>` : ""}
          <button class="link" data-act="daily">${t("Today's daily challenge")} ${ARROW()}</button>
          <button class="link" data-act="tutorial">${t("New here? Play the 2-minute tutorial")} ${ARROW()}</button>
        </div>
        <div class="playing-as">
          ${avatar(c.id)}
          <div><small>${t("Playing as")}</small><b id="playing-name">${esc(myName())}</b></div>
          <button class="link" data-act="tab" data-tab="style">${t("Change")}</button>
        </div>
      </div>
      <div class="hero-art"><div class="fan ${intro}">${fanCards}</div></div>
    </section>`;

  const dailyTab = `
    <section class="block" id="daily">
      <div class="block-head"><div><h2>${t("Daily challenge")}</h2><p>${t("Everyone gets the same gems today, against the same Hard bot. Beat your friends' scores.")}</p></div></div>
      <div class="daily">
        <div class="panel">
          <h3>${new Date().toLocaleDateString(LOCALE(), { weekday: "long", month: "long", day: "numeric" })}</h3>
          <div class="rules"><span>${t("vs {name} (Hard)", { name: esc(charName(dailyOpponent())) })}</span><span>${t("Next gem shown")}</span><span>${t("Mystery gem")}</span><span>${t("Jackpot")}</span><span>${t("Cursed gems")}</span><span>${t("Double token")}</span></div>
          <p class="muted" style="margin:0">${stats.dailyBest[todayKey()] != null ? t("Your best today: {score} points. Play again to beat it.", { score: `<b style="color:var(--ink)">${fmt(stats.dailyBest[todayKey()])}</b>` }) : t("You haven't played today's challenge yet.")}</p>
          <div><button class="btn primary" data-act="daily">${t("Play today's challenge")}</button></div>
        </div>
        <div class="panel">
          <h3>${t("Today's leaderboard")}</h3>
          <div id="daily-lb">${renderLeaderboard()}</div>
        </div>
      </div>
    </section>`;

  const styleTab = `
    <section class="block" id="characters">
      <div class="block-head">
        <div><h2>${t("Choose your character")}</h2><p>${t("{a}, {b} and {c} are free; buy the others with coins. Each has a power you can use once per game when \"Character powers\" is on.", { a: charName("fox"), b: charName("owl"), c: charName("bear") })}</p></div>
        <label class="name-field" for="name">${t("Your name (optional)")}
          <input id="name" maxlength="16" placeholder="${esc(charName(c.id))}" value="${esc(prefs.name)}" autocomplete="nickname">
        </label>
      </div>
      <div class="char-grid">
        ${CHARACTERS.map(ch => {
          const open = isUnlocked(ch), p = POWERS[ch.id];
          return `<button class="char ${open ? "" : "locked"}" data-act="${open ? "pick-char" : "buy"}" data-id="${ch.id}" aria-pressed="${ch.id === prefs.character}" title="${esc(powerName(ch.id))}: ${esc(powerText(ch.id))}" aria-label="${esc(charName(ch.id))}, ${esc(powerName(ch.id))}: ${esc(powerText(ch.id))}${open ? "" : `, ${t("{n} coins", { n: priceOf(ch) })}`}">
            ${avatar(ch.id, "lg")}
            <b>${esc(charName(ch.id))}</b>
            <span class="title">${esc(t(ch.title))}</span>
            ${open ? "" : lockOverlay(ch)}
          </button>`;
        }).join("")}
      </div>
    </section>

    <section class="block" id="designs">
      <div class="block-head"><div><h2>${t("Card design")}</h2><p>${t("Changes the faces and backs of every card. Classic and Royal are free; buy the rest with coins.")}</p></div></div>
      <div class="deck-grid">
        ${DECKS.map(d => {
          const open = isUnlocked(d);
          return `<button class="deck ${open ? "" : "locked"}" data-act="${open ? "pick-deck" : "buy"}" data-id="${d.id}" data-deck="${d.id}" aria-pressed="${d.id === prefs.deck}" aria-label="${t(d.name)}${open ? "" : `, ${t("{n} coins", { n: priceOf(d) })}`}">
            <div class="mini">${cardBack("md")}${cardFace("h", 13, "md")}${cardFace("c", 12, "md")}</div>
            <b>${t(d.name)}</b><small>${t(d.note)}</small>${open ? "" : lockOverlay(d)}
          </button>`;
        }).join("")}
      </div>
      <div class="options-row">
        <div>
          <div class="opt-label">${t("Table")}</div>
          <div class="swatches">
            ${TABLES.map(tb => {
              const open = isUnlocked(tb);
              return `<div><button class="swatch" data-act="${open ? "pick-table" : "buy"}" data-id="${tb.id}" aria-pressed="${tb.id === prefs.table}" aria-label="${t(tb.name)}${open ? "" : `, ${t("{n} coins", { n: priceOf(tb) })}`}" style="background:radial-gradient(circle at 35% 30%, ${tb.a}, ${tb.b})">${open ? "" : `<span class="swatch-lock">${COIN}</span>`}</button><div class="swatch-label">${open ? t(tb.name) : `${COIN}${fmtCoins(priceOf(tb))}`}</div></div>`;
            }).join("")}
          </div>
        </div>
        <div>
          <div class="opt-label">${t("Suit colors")}</div>
          <button class="switch" data-act="four" aria-pressed="${prefs.fourColor}"><span class="track"></span>${t("Four-color suits")}</button>
          <div class="swatch-label" style="text-align:start;margin-top:8px">${t("Gives Clubs and Diamonds their own colors. Handy with 4 players.")}</div>
        </div>
      </div>
    </section>`;

  const achTab = `
    <section class="block" id="achievements">
      <div class="block-head">
        <div><h2>${t("Achievements")}</h2><p>${t("{got} of {all} earned. Each one gives you {n} coins.", { got, all: ACHIEVEMENTS.length, n: ACH_REWARD })}</p></div>
        <div class="progress" aria-hidden="true"><span style="width:${Math.round(100 * got / ACHIEVEMENTS.length)}%"></span></div>
      </div>
      <div class="ach-grid">
        ${ACHIEVEMENTS.map(a => `<div class="ach ${stats.ach[a.id] ? "got" : ""}"><span class="ai">${a.icon}</span><div><b>${t(a.name)}</b><small>${t(a.desc)}</small></div></div>`).join("")}
      </div>
    </section>`;

  const howTab = `
    <section class="block" id="how">
      <div class="block-head"><div><h2>${t("How to play")}</h2><p>${t("One round per gem. A game is 13 rounds.")}</p></div></div>
      <div class="steps">
        <div class="step"><span class="n">1</span><div class="art">${prizeCard(9, "sm")}</div><h3>${t("A gem is turned up")}</h3><p>${t("It's worth its number in points: 1 to 13.")}</p></div>
        <div class="step"><span class="n">2</span><div class="art">${cardBack("sm")}${cardBack("sm")}</div><h3>${t("Everyone bids")}</h3><p>${t("Each player picks one card from their suit, A to K, and lays it face down.")}</p></div>
        <div class="step"><span class="n">3</span><div class="art">${cardFace("h", 12, "sm")}${cardFace("s", 8, "sm")}</div><h3>${t("Reveal")}</h3><p>${t("All bids flip together. The highest card takes the gem. Used cards are gone.")}</p></div>
        <div class="step"><span class="n">4</span><div class="art">${prizeCard(13, "sm")}${prizeCard(7, "sm")}</div><h3>${t("Most points wins")}</h3><p>${t("After 13 gems, add up your gems. Spend your Kings wisely.")}</p></div>
      </div>
      <div class="variants">
        <div class="variant"><h3>${t("Tied bids")}</h3><p>${t("Split: everyone tied shares the gem. Cancel out: matching cards knock each other out.")}</p></div>
        <div class="variant"><h3>${t("Tied at the end?")}</h3><p>${t("Spin the wheel: most gems, biggest gem, last gem, high card or a shared win.")}</p></div>
        <div class="variant"><h3>${t("Character powers")}</h3><p>${t("Each character has a one-time power, from Feint (+2) to Upside down (lowest card wins).")}</p></div>
        <div class="variant"><h3>${t("Next gem and mystery gem")}</h3><p>${t("See the gem that comes next, or play one round for a gem nobody can see until the reveal.")}</p></div>
        <div class="variant"><h3>${t("Jackpot")}</h3><p>${t("A golden 20-point gem replaces the 1 and turns up in the last four rounds.")}</p></div>
        <div class="variant"><h3>${t("Cursed gems and Double")}</h3><p>${t("Curses (−1 to −3) go to the lowest bid. The Double token doubles one round, curses too.")}</p></div>
      </div>
      <div><button class="btn ghost" data-act="tutorial">${t("New here? Play the 2-minute tutorial")}</button></div>
    </section>`;

  const foot = `<footer class="foot">
      <span>${t("Matches won: {won} of {played}", { won: stats.won, played: stats.played })}</span>
      <span>Diamond Bid · ${t("Version {v}", { v: APP_VERSION })}</span>
    </footer>`;
  const body = { play: playTab, daily: dailyTab, style: styleTab, ach: achTab, how: howTab + foot }[tab];
  const dailyDot = stats.dailyBest[todayKey()] == null;
  return `
  <div class="wrap home tab-${tab}">
    ${header}
    <main class="tabpage" role="tabpanel" aria-label="${t(HOME_TABS.find(x => x.id === tab).label)}">${body}</main>
  </div>
  <nav class="tabbar" role="tablist" aria-label="${t("Sections")}">
    ${HOME_TABS.map(x => `<button role="tab" data-act="tab" data-tab="${x.id}" aria-selected="${x.id === tab}">
      <span class="ti">${x.icon}${x.id === "daily" && dailyDot ? `<i class="dot" aria-hidden="true"></i>` : ""}${x.id === "ach" && got ? `<i class="count">${got}</i>` : ""}</span>
      <span class="tl">${t(x.label)}</span></button>`).join("")}
  </nav>`;
}

/* ================= Setup (bots and pass and play) ================= */
function seatPlan(kind) {
  const c = prefs.config, n = c.seatCount;
  const people = kind === "bots" ? 1 : Math.min(prefs.localPlayers, n);
  const used = new Set([prefs.character]);
  const chars = [prefs.character];
  for (let i = 1; i < people; i++) {
    let id = prefs.passChars[i];
    if (!id || used.has(id) || !isUnlocked(CHAR[id])) id = CHAR_IDS.find(x => !used.has(x) && isUnlocked(CHAR[x]));
    chars[i] = id; used.add(id);
  }
  const rotated = CHAR_IDS.map((_, k) => CHAR_IDS[(k + app.botOffset) % CHAR_IDS.length]);
  for (let i = people; i < n; i++) { const id = rotated.find(x => !used.has(x)); chars[i] = id; used.add(id); }
  return range(n).map(i => ({ char: chars[i], name: i === 0 ? myName() : CHAR[chars[i]].name, bot: i >= people, level: c.botLevel }));
}

function rulesFields(kind, hasBots) {
  const c = prefs.config;
  const seg = (key, options, value = c[key]) => `<div class="seg" role="group">${options.map(([val, label]) =>
    `<button type="button" data-act="cfg" data-key="${key}" data-val='${JSON.stringify(val)}' aria-pressed="${value === val}">${t(label)}</button>`).join("")}</div>`;
  const toggle = (key, label) => `<button type="button" class="switch" data-act="cfg" data-key="${key}" data-val='${JSON.stringify(!c[key])}' aria-pressed="${!!c[key]}"><span class="track"></span>${t(label)}</button>`;
  return `
    <div class="field"><span>${t("Players")}</span>${seg("seatCount", [[2, "2 players"], [4, "4 players"]])}</div>
    ${c.seatCount === 4 ? `<div class="field"><span>${t("Mode")}</span>${seg("teams", [[false, "Free-for-all"], [true, "2 vs 2 teams"]])}</div>` : ""}
    ${kind === "pass" ? `<div class="field"><span>${t("People here")}</span>${seg("localPlayers", range(c.seatCount - 1).map(k => [k + 2, String(k + 2)]), Math.min(prefs.localPlayers, c.seatCount))}</div>` : ""}
    ${hasBots ? `<div class="field"><span>${t("Bots")}</span>${seg("botLevel", [["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"], ["expert", "Expert"]])}
      ${c.botLevel === "expert" ? `<div class="hint">${t("Expert bots watch how you bid and learn your habits during the game.")}</div>` : ""}</div>` : ""}
    <div class="field"><span>${t("Ties")}</span>${seg("tieRule", [["split", "Split the gem"], ["cancel", "Cancel out"]])}</div>
    <div class="field"><span>${t("Match")}</span>${seg("gamesToWin", [[1, "Single game"], [2, "Best of 3"]])}</div>
    <div>
      <div class="opt-label">${t("Extras")}</div>
      <div class="extras">
        ${toggle("powers", "Character powers")}${toggle("showNext", "Show next gem")}
        ${toggle("mystery", "Mystery gem")}${toggle("jackpot", "Jackpot gem")}
        ${toggle("cursed", "Cursed gems")}${toggle("double", "Double token")}
      </div>
    </div>`;
}

function renderSetup() {
  const kind = app.setup, c = prefs.config;
  if (kind === "online-menu" || kind === "online-lobby" || kind === "online-quick") return renderOnlineSheet();
  const plan = seatPlan(kind);
  const people = plan.filter(p => !p.bot).length;
  const hasBots = plan.some(p => p.bot);
  const seats = plan.map((p, i) => {
    const suit = suitFor(i, c.seatCount);
    const role = p.bot ? `${t("Bot")} · ${levelName(c.botLevel)}` : (kind === "bots" ? t("You") : t("Player {n}", { n: i + 1 }));
    const team = usesTeams(c) ? `<span class="team-dot" style="background:${TEAM_COLOR[sideOf(c, i)]}"></span>` : "";
    return `<div class="seat-row">
      <button class="avatar-btn" data-act="cycle-char" data-seat="${i}" ${p.bot ? "disabled" : ""} aria-label="${t("Change character for seat {n}", { n: i + 1 })}">${avatar(p.char)}</button>
      <div><b>${esc(i === 0 ? p.name : charName(p.char))}</b><small>${team}${feltPip(suit)} ${t(SUIT_NAME[suit])} · ${role}</small></div>
    </div>`;
  }).join("");
  return `<div class="overlay" data-act="close-bg">
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div class="sheet-head"><h2 id="setup-title">${kind === "bots" ? t("Play vs bots") : t("Pass and play")}</h2><button class="icon-btn" data-act="close" aria-label="${t("Close")}">✕</button></div>
      ${rulesFields(kind, hasBots)}
      <div>
        <div class="opt-label">${t("At the table")}${people > 1 ? `<span class="opt-hint"> · ${t("tap an avatar to change character")}</span>` : ""}</div>
        <div class="seats">${seats}</div>
      </div>
      <div class="sheet-foot">
        ${hasBots ? `<button class="link" data-act="reroll">${t("Seat different bots")}</button>` : "<span></span>"}
        <button class="btn primary" data-act="start">${t("Deal the cards")}</button>
      </div>
    </div>
  </div>`;
}

/* ================= Starting games ================= */
function beginGame(g) {
  stopTimers();
  cancelQuick();
  G = g;
  app.setup = null;
  app.modal = null;
  app.screen = "game";
  window.scrollTo(0, 0);
  Sound.unlock();
}
function startLocal(kind) {
  if (kind === "bots" || kind === "pass") { prefs.lastKind = kind; savePrefs(); }
  const seats = seatPlan(kind);
  const mySeats = range(seats.length).filter(i => !seats[i].bot);
  beginGame(newG(kind, newMatch(prefs.config, seats), mySeats));
  progress();
}
function dailyOpponent() {
  const pool = CHAR_IDS.filter(id => id !== prefs.character);
  return pool[seedFrom("opp-" + todayKey()) % pool.length];
}
function startDaily() {
  const date = todayKey();
  const seats = [
    { char: prefs.character, name: myName(), bot: false },
    { char: dailyOpponent(), name: CHAR[dailyOpponent()].name, bot: true, level: "hard" },
  ];
  beginGame(newG("daily", newMatch(DAILY_CONFIG, seats, { seed: seedFrom("diamondbid-" + date) }), [0], { dailyDate: date }));
  progress();
}
function startTutorial() {
  const seats = [
    { char: prefs.character === "frog" ? "fox" : prefs.character, name: myName(), bot: false },
    { char: "frog", name: CHAR.frog.name, bot: true, level: "easy" },
  ];
  const cfg = Object.assign({}, DEFAULT_CONFIG, { seatCount: 2, showNext: true });
  beginGame(newG("tutorial", newMatch(cfg, seats, { prizes: TUTORIAL_PRIZES }), [0]));
  progress();
}

/* ================= Game flow ================= */
const activeSeat = () => G.s.phase === "bidding" ? G.mySeats.find(i => !G.s.submitted[i] && !(G.myBid && G.myBid.key === roundKey(G.s) && G.myBid.seat === i)) : undefined;
const needsHandoff = () => { const a = activeSeat(); return a !== undefined && G.mySeats.length > 1 && G.unlocked !== a; };
const homeSeat = () => G.mySeats.length === 1 ? G.mySeats[0] : undefined;
function handSeat() {
  const a = activeSeat();
  if (a !== undefined) return needsHandoff() ? undefined : a;
  return homeSeat();
}
/** For an online guest, a bid sent but not yet confirmed by the host counts as placed. */
function shownBid(seat) {
  const s = G.s;
  if (s.bids[seat]) return s.bids[seat];
  if (G.myBid && G.myBid.seat === seat && G.myBid.key === roundKey(s) && s.phase === "bidding") return G.myBid.bid;
  return null;
}
const shownSubmitted = seat => G.s.submitted[seat] || !!(G.myBid && G.myBid.seat === seat && G.myBid.key === roundKey(G.s) && G.s.phase === "bidding");

/** Run the table: resolve rounds, advance, run bots. Only the authority (this device, or the online host) calls it. */
function progress() {
  const s = G.s;
  if (s.phase === "bidding") s.seats.forEach((x, i) => { if (x.bot) botInstant(s, i); });
  if (s.phase === "bidding" && s.submitted.every(Boolean)) {
    resolve(s);
    s.revealAt = Date.now();
  } else if ((s.phase === "reveal" || s.phase === "gameOver") && s.ready.every(Boolean)) {
    advance(s);
    G.seen = [];
  }
  if (G.mySeats.length > 1 && s.phase !== "bidding") G.unlocked = null;
  observe();
  scheduleBots();
  publish();
  render();
  scheduleReveal();
  scheduleSpin();
}

/** React to what just changed: sounds, effects, achievements, stats. Runs on every device. */
function observe() {
  const s = G.s, p = G.prev || {};
  const histLen = s.history.length;
  if (s.phase === "reveal" && (p.phase !== "reveal" || p.hist !== histLen || p.gn !== s.gameNumber)) onReveal(s.history[histLen - 1]);
  if (s.phase === "bidding" && (p.phase !== "bidding" || p.round !== s.round)) { G.banner = null; G.myBid = G.myBid && G.myBid.key === roundKey(s) ? G.myBid : null; }
  const ended = ph => ph === "gameOver" || ph === "matchOver";
  if (ended(s.phase) && !ended(p.phase)) onGameEnd();
  if (s.phase === "matchOver" && p.phase !== "matchOver") onMatchEnd();
  const spinKey = s.tie && s.tie.spin !== null ? `${s.tie.round}.${s.tie.spinTo}` : "";
  if (spinKey && spinKey !== p.spinKey) { G.localSpinAt = Date.now(); Sound.wheel(SPIN_MS); }
  if (s.phase === "gameOver" && p.phase === "gameOver" && p.gn !== s.gameNumber) G.newAch = [];
  if (s.phase === "bidding" && p.gn != null && p.gn !== s.gameNumber) { G.newAch = []; G.coinsEarned = 0; G.recorded = false; G.streak = 0; }
  G.prev = { phase: s.phase, hist: histLen, gn: s.gameNumber, round: s.round, spinKey };
}

function onReveal(r) {
  const s = G.s, i = me();
  G.revealAnim = true;
  G.revealAt = Date.now();
  // The banner for the big moments
  const w = r.winners;
  let banner = null;
  if (r.prize === JACKPOT && w.length) banner = { text: "Jackpot!", kind: "" };
  else if (r.powers.some(k => w.includes(k) && POWERS[s.seats[k].char].timing === "bid")) banner = { power: s.seats[r.powers.find(k => w.includes(k))].char, kind: "power" };
  else if (w.length === 1 && r.margin === 1) banner = { text: "Steal!", kind: "" };
  else if (r.prize < 0 && w.length) banner = { text: "Cursed!", kind: "curse" };
  else if (w.length === 1 && r.prize >= 11) banner = { text: "Big win!", kind: "" };
  else if (w.length > 1) banner = { text: "Split!", kind: "" };
  G.banner = banner;
  Sound.flip();
  const mine = i >= 0 ? r.awards[i] : 0;
  setTimeout(() => {
    if (mine > 0) { (r.prize >= 11 ? Sound.big : Sound.win)(); buzz([20, 40, 30]); }
    else if (mine < 0) { Sound.lose(); buzz(80); }
    else if (i >= 0 && w.length && !w.includes(i)) Sound.lose();
  }, 0);
  if (!G.track || i < 0) return;
  if (mine > 0) grant("first_gem");
  if (w.length === 1 && w[0] === i) {
    if ((r.prize === 13 || r.prize === JACKPOT) && r.bids[i].card <= 7) grant("giant_slayer");
    if (r.margin === 1) grant("steal");
    if (r.prize === JACKPOT) grant("jackpot");
  }
  if (mine >= 240) grant("double_trouble");
  if (r.powers.includes(i) && w.includes(i) && mine > 0) grant("power_play");
  G.streak = w.includes(i) && mine > 0 ? G.streak + 1 : 0;
  if (G.streak >= 3) grant("hat_trick");
}

function onGameEnd() {
  const s = G.s, i = me();
  const mySide = i >= 0 ? sideOf(s.config, i) : -1;
  const iWon = mySide >= 0 && s.lastGameWinners.includes(mySide);
  if (iWon) { Sound.fanfare(); confetti(s.phase === "matchOver" ? 180 : 90); }
  else if (mySide >= 0 && G.kind !== "pass" && s.lastGameWinners.length) Sound.sad();
  if (G.kind === "pass") { Sound.fanfare(); confetti(120); }
  if (G.track && i >= 0) {
    if (s.config.cursed && !s.history.some(h => h.awards[i] < 0) && s.history.some(h => h.prize < 0)) grant("curse_dodger");
    if (s.tieWonBy && s.tieWonBy.includes(mySide)) grant("wheel");
  }
  if (G.kind === "daily") {
    const score = s.scores[0], date = G.dailyDate;
    if (stats.dailyBest[date] == null || score > stats.dailyBest[date]) stats.dailyBest[date] = score;
    if (!stats.dailyDays.includes(date)) stats.dailyDays.push(date);
    saveStats();
    grant("daily");
    postDaily(score, date);
  }
  if (G.kind === "tutorial") grant("learner");
  if (i >= 0 || G.kind === "pass") { const [n, why] = gameReward(iWon); addCoins(n, why); }
}

function onMatchEnd() {
  const s = G.s, i = me();
  if (G.recorded || i < 0 || G.kind === "pass" || G.kind === "tutorial") return;
  G.recorded = true;
  const mySide = sideOf(s.config, i), won = matchWinners(s).includes(mySide);
  stats.played++;
  if (won) stats.won++;
  saveStats();
  if (G.kind === "online") grant("online");
  if (won) {
    grant("first_win");
    const levels = s.seats.filter((x, k) => x.bot && sideOf(s.config, k) !== mySide).map(x => x.level);
    if (levels.includes("hard")) grant("hard_win");
    if (levels.includes("expert")) grant("expert_win");
    if (s.config.seatCount === 4 && !usesTeams(s.config)) grant("full_table");
    if (usesTeams(s.config)) grant("teamwork");
  }
}

function scheduleBots() {
  clearTimeout(botTimer);
  if (!isAuthority()) return;
  const s = G.s;
  if (s.phase !== "bidding" || !s.seats.some((x, i) => x.bot && !s.submitted[i])) return;
  botTimer = setTimeout(() => {
    if (!G || G.s.phase !== "bidding") return;
    G.s.seats.forEach((x, i) => { if (x.bot && !G.s.submitted[i]) submit(G.s, i, botChoose(G.s, i, x.level)); });
    progress();
  }, 650 + Math.random() * 650);
}

/** After a reveal the next gem is dealt automatically (not in the tutorial, where you read the tips first). */
function scheduleReveal() {
  clearTimeout(revealTimer);
  clearInterval(tickTimer);
  if (!G || G.s.phase !== "reveal") return;
  const auto = G.kind !== "tutorial";
  const left = () => REVEAL_MS - (Date.now() - G.revealAt);
  if (auto && isAuthority()) revealTimer = setTimeout(() => { if (G && G.s.phase === "reveal") { G.s.ready = G.s.ready.map(() => true); progress(); } }, Math.max(0, left()));
  if (!auto) return;
  let lastSecs = null;
  tickTimer = setInterval(() => {
    if (!G || !G.revealAt) return;
    const secs = String(Math.max(1, Math.ceil(left() / 1000)));
    if (secs !== lastSecs && lastSecs !== null) Sound.tick();
    lastSecs = secs;
    ["countdown", "countdown-big"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.textContent !== secs) { el.textContent = secs; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
    });
  }, 150);
}

function placeBid() {
  const seat = activeSeat();
  if (seat === undefined || G.selected == null) return;
  const bid = { card: G.selected, double: G.useDouble, power: G.usePower };
  if (!G.flyFrom) { // a dragged card already set where it flies from
    const from = document.querySelector && document.querySelector(".hand .card.sel");
    G.flyFrom = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null;
  }
  if (G.kind === "online" && G.role === "guest") {
    G.myBid = { seat, key: roundKey(G.s), bid };
    Online.named && Online.named.presence({ b: { k: roundKey(G.s), c: bid.card, d: bid.double ? 1 : 0, p: bid.power ? 1 : 0 } }).catch(() => {});
    afterBidPlaced();
    render();
    return;
  }
  if (submit(G.s, seat, bid)) { afterBidPlaced(); progress(); }
}
function afterBidPlaced() {
  G.selected = null; G.useDouble = false; G.usePower = false;
  Sound.snap(); buzz(12);
}
function useInstantPower() {
  const seat = activeSeat();
  if (seat === undefined) return;
  if (G.kind === "online" && G.role === "guest") {
    Online.named && Online.named.presence({ f: roundKey(G.s) }).catch(() => {});
    G.s.powerAvail[seat] = false; G.s.foresight[seat] = true;
  } else if (!usePowerNow(G.s, seat)) return;
  Sound.chime();
  if (isAuthority()) progress(); else render();
}
function nextStep() {
  if (!isAuthority()) return;
  G.mySeats.forEach(i => { G.s.ready[i] = true; });
  if (G.kind === "online") G.s.ready = G.s.ready.map(() => true); // the host moves the table on
  progress();
}
function spinWheel() {
  if (!isAuthority() || G.s.phase !== "tiebreak" || G.s.tie.spin !== null) return;
  spinTie(G.s);
  progress();
}
function scheduleSpin() {
  clearTimeout(spinTimer);
  const t = G && G.s.tie;
  if (!t || t.spin === null || t.result || !isAuthority()) return;
  spinTimer = setTimeout(() => {
    if (!G || !G.s.tie || G.s.tie.result) return;
    applyTiebreak(G.s);
    progress();
  }, Math.max(0, SPIN_MS - (Date.now() - G.localSpinAt)));
}
function tieContinue() {
  if (!isAuthority() || !G.s.tie || !G.s.tie.result) return;
  finishTiebreak(G.s);
  progress();
}
/* Online: anyone at the table can ask for a rematch; the host sees who asked and starts it. */
const matchKey = s => `${s.gameNumber}.${s.gameWins.join("")}.${s.scores.join(".")}`;
function askRematch() {
  if (!G || G.kind !== "online" || G.s.phase !== "matchOver" || !Online.named) return;
  G.askedRematch = matchKey(G.s);
  Online.named.presence({ r: G.askedRematch }).catch(() => {});
  Sound.select();
  render();
}
function doRematch() {
  if (!isAuthority()) return;
  rematch(G.s);
  G.seen = []; G.recorded = false; G.newAch = []; G.coinsEarned = 0; G.streak = 0;
  progress();
}
function stopTimers() {
  clearTimeout(botTimer); clearTimeout(revealTimer); clearInterval(tickTimer); clearTimeout(spinTimer);
  clearTimeout(turnTimer); clearTimeout(awayTimer); clearInterval(clockTimer); clockTimer = null;
}

/* ================= Turn clock ================= */
/** Called after every table render: starts the 10-second clock when it becomes your turn to bid. */
function turnClock() {
  if (!G || !TIMED_KINDS.includes(G.kind)) return;
  const seat = activeSeat();
  if (seat === undefined || needsHandoff()) { clearTimeout(turnTimer); G.turnKey = null; }
  else {
    const key = `${roundKey(G.s)}.${seat}`;
    if (G.turnKey !== key) {
      G.turnKey = key; G.turnAt = Date.now();
      clearTimeout(turnTimer);
      // While you're away, the game plays for you straight away.
      turnTimer = setTimeout(() => autoPlay(key), G.away ? 900 : TURN_MS);
    }
  }
  if (!clockTimer && (G.turnKey || G.away)) clockTimer = setInterval(clockTick, 200);
}
function clockTick() {
  if (!G || (!G.turnKey && !G.away)) { clearInterval(clockTimer); clockTimer = null; return; }
  const el = document.getElementById("turn-left");
  if (el && G.turnKey && G.turnAt) {
    const secs = Math.max(0, Math.ceil((TURN_MS - (Date.now() - G.turnAt)) / 1000));
    if (el.textContent !== String(secs)) {
      el.textContent = secs;
      if (secs <= 3) { el.parentNode.classList.add("hurry"); if (secs > 0) Sound.tick(); }
    }
  }
  const away = document.getElementById("away-left");
  if (away && G.away) away.textContent = Math.max(0, Math.ceil((AWAY_MS - (Date.now() - G.away.at)) / 1000));
}
/** Time's up: play a sensible card for the player and start the 20-second "are you there?" clock. */
function autoPlay(key) {
  if (!G || G.turnKey !== key) return;
  const seat = activeSeat();
  if (seat === undefined || `${roundKey(G.s)}.${seat}` !== key) return;
  if (!G.away) {
    G.away = { at: Date.now() };
    clearTimeout(awayTimer);
    awayTimer = setTimeout(kickForInactivity, AWAY_MS);
    Sound.lose(); buzz([60, 60, 60]);
  }
  G.selected = botChoose(G.s, seat, "normal").card;
  G.useDouble = false; G.usePower = false;
  placeBid();
}
function comeBack() {
  if (!G) return;
  G.away = null; G.turnKey = null;
  clearTimeout(awayTimer); clearTimeout(turnTimer);
  Sound.select();
  render();
}
function kickForInactivity() {
  if (!G || !G.away) return;
  leaveGame();
  Sound.lose();
  toast("⏱", t("You were removed for inactivity"), t("Time's up"));
}
function leaveGame() {
  stopTimers();
  if (G && G.kind === "online") leaveOnline();
  G = null;
  app.screen = "home";
  app.modal = null;
  render();
}

/* ================= Table ================= */
function coachTip() {
  const s = G.s, last = s.history[s.history.length - 1];
  if (s.phase === "bidding") {
    return [
      t("Welcome! The 5 gem is up for grabs. Double-tap a card in your hand to bid it, or drag it up to the table. Lily bids at the same time, face down."),
      t("This is the 13, the biggest gem. A King is worth spending here."),
      t("Only a 2. Save your big cards and throw away a low one."),
      t("Look under the gem: Next shows what's coming. Plan which cards you'll need."),
      t("A 1 gem. A good moment to get rid of your weakest card."),
      t("11 is big. Tap ▤ at the top to see which cards Lily has left before you bid."),
    ][s.round] || t("You've got it. Win the most points by the end of the 13 gems.");
  }
  if (s.phase === "reveal" && last) {
    if (last.winners.length === 1 && last.winners[0] === 0) return t("You won that one! The gem's points go to your score. Press Next gem when you're ready.");
    if (last.winners.length > 1) return t("A tie: you split the gem, so each of you gets half.");
    return t("Lily won this one. Cards you play are gone for good, so think about which ones you still need.");
  }
  return "";
}

function renderGame() {
  const s = G.s, c = s.config, n = s.seats.length;
  const home = homeSeat();
  const tileSeats = range(n).filter(i => i !== home);
  const cols = tileSeats.length === 4 ? 2 : Math.max(tileSeats.length, 1);
  const result = s.phase === "reveal" ? s.history[s.history.length - 1] : null;
  const anim = G.revealAnim;
  G.revealAnim = false;
  const prize = prizeNow(s);
  const hidden = s.phase === "bidding" && isMystery(s);
  const roundId = `${s.gameNumber}-${s.round}`;
  const prizeAnim = G.prizeKey !== roundId ? " drop" : "";
  G.prizeKey = roundId;
  const guest = G.kind === "online" && G.role === "guest";

  const dropClass = i => {
    if (s.phase === "bidding" && shownSubmitted(i) && !G.seen[i]) {
      G.seen[i] = true;
      if (i === home && G.flyFrom) return "";
      Sound.card();
      return " drop";
    }
    return "";
  };
  const drops = range(n).map(dropClass);
  const awardSpan = (i, suffix = "") => result && result.awards[i] ? `<span class="award ${result.awards[i] < 0 ? "neg" : ""}">${awardText(result.awards[i])}${suffix}</span>` : "";
  const bidCard = (i, size) => {
    const suit = suitFor(i, n);
    if (result) {
      const cx = result.cancelled.includes(i), burned = result.burned === i;
      let html = cardFace(suit, result.bids[i].card, size + (anim ? " flip" : "") + (cx || burned ? " cancelled" : "")) + (cx || burned ? `<span class="cancel-x">${burned ? "0" : "✕"}</span>` : "");
      if (result.bids[i].double) html += `<span class="x2">×2</span>`;
      if (result.powers.includes(i)) html += `<span class="x2" style="top:auto;bottom:-7px;background:#8fe3ff;color:#062430">★</span>`;
      return html;
    }
    if (s.phase === "bidding" && shownSubmitted(i)) return cardBack(size + drops[i]);
    return `<div class="slot ${size}">${s.phase === "bidding" ? thinking() : ""}</div>`;
  };
  const tokensFor = i => {
    let out = "";
    if (c.double) out += `<span class="tok ${s.doubleAvail[i] ? "" : "used"}" title="${s.doubleAvail[i] ? t("Double token ready") : t("Double token used")}"><i>×2</i></span>`;
    if (c.powers && POWERS[s.seats[i].char]) out += `<span class="tok pw ${s.powerAvail[i] ? "" : "used"}" title="${esc(powerName(s.seats[i].char))}: ${s.powerAvail[i] ? t("ready") : t("used")}"><i>★</i>${esc(powerName(s.seats[i].char))}</span>`;
    return out;
  };

  // Pass and play tiles
  const tile = i => {
    const p = s.seats[i], suit = suitFor(i, n);
    const win = result && result.winners.includes(i);
    const stripe = usesTeams(c) ? `<span class="stripe" style="background:${TEAM_COLOR[sideOf(c, i)]}"></span>` : "";
    return `<div class="tile ${win ? "win" : ""}">${stripe}
      <div class="who">${avatar(p.char)}<div><b>${esc(sn(s, i))}</b><small>${feltPip(suit)} ${p.bot ? t("Bot") : t(SUIT_NAME[suit])}</small></div></div>
      <div class="row"><div class="bidwrap">${bidCard(i, "sm")}</div><div><div class="score">${fmt(s.scores[i])}</div>${awardSpan(i)}</div></div>
      ${gemPile(s, i)}
      <div class="tokens"><span>${t("{n} cards", { n: s.hands[i].length })}</span>${tokensFor(i)}</div>
    </div>`;
  };

  // Score bars (single-human games)
  // Middle of the table
  let theirs = "", mine = "";
  if (home !== undefined) {
    const size = tileSeats.length === 1 ? "lg" : "md";
    const label = tileSeats.length === 1 ? t("{name}'s bid", { name: esc(sn(s, tileSeats[0])) }) : t("Their bids");
    theirs = `<div class="spot theirs"><span class="lbl">${label}</span><div class="opps">${tileSeats.map(i => `<div class="opp ${result && result.winners.includes(i) ? "win" : ""}" data-pos="${(i - home + n) % n}">
        ${tileSeats.length > 1 ? avatar(s.seats[i].char, "sm") : ""}
        <div class="bidwrap" style="position:relative">${bidCard(i, size)}</div>
        <span class="sub">${awardSpan(i)}</span></div>`).join("")}</div></div>`;
    const myAward = result ? result.awards[home] : 0;
    mine = `<div class="spot minespot ${result && result.winners.includes(home) ? "win" : ""}">
      <span class="lbl">${t("Your bid")}</span>
      <div class="bidwrap" id="mybid" style="position:relative">${result || shownSubmitted(home) ? bidCard(home, "lg") : `<div class="slot lg">${G.selected != null ? "" : t("Pick a card")}</div>`}
        ${anim && myAward ? `<span class="floatpts ${myAward < 0 ? "neg" : ""}">${awardText(myAward)}</span>` : ""}</div>
      <span class="sub">${awardSpan(home)}</span>
    </div>`;
  }
  const next = prizeNext(s);
  const seesFuture = G.mySeats.some(i => s.foresight[i]);
  let below = "";
  if (s.phase === "reveal" && G.kind !== "tutorial") {
    const gone = G.revealAt ? Math.min(REVEAL_MS, Date.now() - G.revealAt) : 0;
    below = `<div class="bigcount" role="timer" aria-label="${t("Next gem soon")}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.915"/><circle class="ring" cx="18" cy="18" r="15.915" style="animation-delay:-${gone}ms"/></svg><b id="countdown-big">${Math.max(1, Math.ceil((REVEAL_MS - gone) / 1000))}</b></div>`;
  } else {
    const rule = hidden ? t("Value revealed with the bids") : prize < 0 ? t("Lowest bid takes it") : t("Highest bid wins");
    below = `<span class="sub">${rule}</span>`;
  }
  let preview = "";
  if (seesFuture) {
    const upcoming = s.prizes.slice(s.round + 1, s.round + 4);
    preview = upcoming.length ? `<div class="foresight">★ ${t("Coming up:")} ${upcoming.map(v => prizeCard(v, "xs")).join("")}</div>` : "";
  } else if (c.showNext && next != null && s.phase !== "gameOver") {
    preview = `<div class="nextgem">${t("Next:")} ${prizeCard(next, "xs", isMystery(s, s.round + 1))}</div>`;
  }
  const lbl = t(hidden ? "Mystery gem" : prize === JACKPOT ? "Jackpot" : prize < 0 ? "Cursed" : "Up for grabs");
  const center = `<div class="center ${tileSeats.length > 1 && home !== undefined ? "around" : ""} ${anim && result && result.prize < 0 && result.winners.includes(home) ? "shake" : ""}">
      ${theirs}
      <div class="spot prizespot">
        <span class="lbl ${prize < 0 && !hidden ? "cursed" : "gold"}">${lbl}</span>
        ${prizeCard(prize, "lg" + prizeAnim + (result && result.mystery && anim ? " flip" : ""), hidden)}
        ${below}
        ${preview}
      </div>
      ${mine}
      ${anim && G.banner ? `<div class="banner ${G.banner.kind}">${esc(G.banner.power ? powerName(G.banner.power) + "!" : t(G.banner.text))}</div>` : ""}
    </div>`;

  // Status line
  let status = "", acts = "";
  if (s.phase === "bidding") {
    const a = activeSeat();
    if (a !== undefined && !needsHandoff()) {
      const pname = hidden ? t("the mystery gem") : t("the {prize}", { prize: pName(prize) });
      status = G.selected != null ? t("Bid {card} on {prize}?", { card: `<b>${RANK(G.selected)}</b>`, prize: pname })
        : prize < 0 && !hidden ? t("Pick a card. Don't be the lowest, or you take {prize}.", { prize: pname }) : t("Pick a card to bid on {prize}.", { prize: pname });
    } else {
      const waiting = range(n).filter(i => !shownSubmitted(i)).map(i => esc(sn(s, i)));
      status = waiting.length ? t("Waiting for {names}…", { names: waiting.join(t(", ")) }) : t("Revealing…");
    }
  } else if (s.phase === "reveal") {
    status = summaryText(s, result);
    if (G.kind === "tutorial") acts = `<button class="btn primary" data-act="next">${isLast(s) ? t("See results") : t("Next gem")}</button>`;
    else {
      const gone = Math.min(REVEAL_MS, Date.now() - (G.revealAt || Date.now()));
      acts = `<span class="countdown">${t(isLast(s) ? "Results in {n}" : "Next gem in {n}", { n: `<b id="countdown">${Math.max(1, Math.ceil((REVEAL_MS - gone) / 1000))}</b>` })}</span>${guest ? "" : `<button class="btn ghost" data-act="next">${t("Skip")}</button>`}`;
      status += `<span class="timebar" aria-hidden="true"><span style="animation-delay:-${gone}ms"></span></span>`;
    }
  }

  // Hand
  let handHTML = "", controls = "";
  const hs = handSeat();
  if (hs !== undefined) {
    const suit = suitFor(hs, n);
    const canBid = activeSeat() === hs && !needsHandoff();
    const pb = shownBid(hs);
    const pendingCard = s.phase === "bidding" && pb ? pb.card : null;
    // Held like a real hand: overlapping cards in a gentle arc, numbers peeking out at the top left.
    const cards = s.hands[hs], mid = (cards.length - 1) / 2;
    // A fresh hand is dealt in one card at a time. Timed from G.dealAt so a re-render mid-deal doesn't restart it.
    if (s.phase === "bidding" && s.round === 0 && cards.length === s.prizes.length && G.dealtFor !== `${s.gameNumber}.${hs}`) {
      G.dealtFor = `${s.gameNumber}.${hs}`; G.dealAt = Date.now(); Sound.deal(cards.length, DEAL_GAP / 1000);
    }
    const dealt = G.dealAt ? Date.now() - G.dealAt : Infinity, dealing = dealt < DEAL_GAP * cards.length + 500;
    handHTML = `<div class="hand ${dealing ? "dealing" : ""}" role="group" aria-label="${t("Your cards")}" style="--m:${Math.max(cards.length, 2)}">${cards.map((v, k) =>
      cardFace(suit, v, `${G.selected === v ? "sel" : ""} ${pendingCard === v ? "pending" : ""} ${G.dragging === v ? "lifted" : ""}`, "button",
        `data-act="select" data-v="${v}" ${canBid ? "" : "disabled"} aria-pressed="${G.selected === v}" style="--o:${k - mid}${dealing ? `;animation-delay:${k * DEAL_GAP - dealt}ms` : ""}"`)).join("")}</div>`;
    if (canBid) {
      const pw = c.powers && s.powerAvail[hs] && POWERS[s.seats[hs].char];
      let pwBtn = "";
      const pid = s.seats[hs].char;
      if (pw && pw.timing === "now") pwBtn = `<button class="pwr" data-act="power-now" title="${esc(powerText(pid))}">★ ${t("Use {power}", { power: esc(powerName(pid)) })}</button>`;
      else if (pw) {
        const blocked = s.seats[hs].char === "cat" && isLast(s);
        pwBtn = `<button class="pwr" data-act="power" aria-pressed="${G.usePower}" ${blocked ? "disabled" : ""} title="${esc(powerText(pid))}">★ ${esc(powerName(pid))}${G.usePower ? " · " + t("on") : ""}</button>`;
      }
      const timed = TIMED_KINDS.includes(G.kind) && !G.away;
      const used = timed && G.turnKey === `${roundKey(s)}.${hs}` && G.turnAt ? Math.min(TURN_MS, Date.now() - G.turnAt) : 0;
      const secsLeft = Math.max(0, Math.ceil((TURN_MS - used) / 1000));
      if (s.round < 2 || G.selected != null) controls += `<p class="playhint">${t("Drag a card up to the table, or double-tap it, to play it")}</p>`;
      if (timed) controls += `<div class="turnclock ${secsLeft <= 3 ? "hurry" : ""}" role="timer" aria-label="${t("Time left")}"><b id="turn-left">${secsLeft}</b><span class="turnbar"><span style="animation-delay:-${used}ms"></span></span></div>`;
      const dblBtn = c.double && s.doubleAvail[hs] ? `<button class="dbl" data-act="double" aria-pressed="${G.useDouble}">×2 ${t("Double")}${G.useDouble ? " · " + t("on") : ""}</button>` : "";
      if (dblBtn || pwBtn) controls += `<div class="bidbar">${dblBtn}${pwBtn}</div>`;
      controls += `
      ${pw && G.usePower ? `<p class="muted" style="margin:0;text-align:center;font-size:13px">${esc(powerName(pid))}: ${esc(powerText(pid))}</p>` : ""}`;
    }
  } else if (G.kind === "online" && !G.mySeats.length) {
    handHTML = `<p class="muted" style="text-align:center">${t("The table is full, so you're watching this game.")}</p>`;
  }

  // Scoreboard across the top: red vs blue, the two scores meeting in the middle.
  const sides = sideCount(c), top = Math.max(...range(sides).map(side => sideScore(s, side)));
  const mySide = home !== undefined ? sideOf(c, home) : -1;
  const teamBar = `<div class="scorebar ${sides === 2 && !usesTeams(c) ? "duo" : ""}">${range(sides).map(side => {
    const pts = sideScore(s, side);
    const seats = seatsOnSide(c, side);
    const won = anim && result && seats.some(i => result.winners.includes(i));
    const tag = side === mySide ? t("(you)") : seats.length === 1 && s.seats[seats[0]].bot ? t("(bot)") : "";
    const toks = seats.map(tokensFor).join("");
    return `<div class="sb ${pts === top && pts > 0 ? "lead" : ""} ${won ? "win" : ""}" style="--sc:${SIDE_COLOR[side]}">
      <span class="avs">${seats.map(i => avatar(s.seats[i].char, "sm")).join("")}</span>
      <span class="nm">${esc(sideLabel(s, side))}${tag ? `<small>${tag}</small>` : ""}${c.gamesToWin > 1 ? `<small>${t("{n} won", { n: s.gameWins[side] })}</small>` : ""}${toks ? `<span class="tokens">${toks}</span>` : ""}</span>
      <b>${fmt(pts)}</b></div>`;
  }).join("")}</div>`;

  let overlay = "";
  if (needsHandoff()) {
    const a = activeSeat(), p = s.seats[a];
    overlay = `<div class="cover"><div class="box">${avatar(p.char, "xl")}<h2>${t("{name}, your bid", { name: esc(sn(s, a)) })}</h2>
      <p>${t("Pass the device to {name}. Everyone else, look away.", { name: esc(sn(s, a)) })}<br>${t("{prize} is on the table.", { prize: hidden ? t("The mystery gem") : t("The {prize}", { prize: pName(prize) }) })}</p>
      <button class="btn primary" data-act="unlock">${t("Show my hand")}</button></div></div>`;
  } else if (s.phase === "tiebreak") overlay = renderTiebreak();
  else if (s.phase === "gameOver" || s.phase === "matchOver") overlay = renderResults();
  if (G.away) {
    const left = Math.max(0, Math.ceil((AWAY_MS - (Date.now() - G.away.at)) / 1000));
    overlay += `<div class="overlay away ${Date.now() - G.away.at > 300 ? "shown" : ""}"><div class="sheet" role="alertdialog" aria-labelledby="away-h">
      <div class="away-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.915"/><circle class="ring" cx="18" cy="18" r="15.915" style="animation-delay:-${Date.now() - G.away.at}ms"/></svg><b id="away-left">${left}</b></div>
      <h2 id="away-h">${t("Are you still there?")}</h2>
      <p class="muted">${t("You ran out of time, so a card was played for you. Tap Back to keep playing, or you'll be removed from the game.")}</p>
      <button class="btn primary" data-act="come-back">${t("Back")}</button></div></div>`;
  }

  const sub = G.kind === "online" ? `<span class="online-dot"></span>${t("Online · table {code}", { code: esc(Online.code.toUpperCase()) })}`
    : G.kind === "daily" ? t("Daily challenge") : G.kind === "tutorial" ? t("Tutorial")
    : c.gamesToWin > 1 ? t("Game {n} · first to 2 wins", { n: s.gameNumber }) : (usesTeams(c) ? t("2 vs 2") : t("{n} players", { n }));
  const coach = G.kind === "tutorial" && coachTip() ? `<div class="coach">${avatar("owl", "sm")}<p><small>${esc(charName("owl"))}</small>${esc(coachTip())}</p></div>` : "";

  return `<div class="wrap"><div class="table">
    <div class="tbar">
      <button class="icon-btn" data-act="exit" aria-label="${t("Leave game")}">✕</button>
      <div class="mid"><b>${t("Gem {n} of {total}", { n: Math.min(s.round + 1, s.prizes.length), total: s.prizes.length })}</b><small>${sub}</small></div>
      <div class="right">
        <button class="icon-btn" data-act="sound" aria-label="${prefs.sound ? t("Turn sound off") : t("Turn sound on")}">${SPEAKER_SVG(prefs.sound)}</button>
        <button class="icon-btn" data-act="modal" data-m="cards" aria-label="${t("Cards left")}" title="${t("Cards left")}">▤</button>
        <button class="icon-btn" data-act="modal" data-m="rules" aria-label="${t("Rules")}" title="${t("Rules")}">?</button>
      </div>
    </div>
    ${center}
    ${handHTML}
    <div class="side">
      ${teamBar}
      ${home !== undefined ? "" : `<div class="tiles" style="grid-template-columns:repeat(${cols}, minmax(0, 1fr))">${tileSeats.map(tile).join("")}</div>`}
      ${coach}
      ${status ? `<div class="status" aria-live="polite"><p>${status}</p><div class="acts">${acts}</div></div>` : ""}
      ${controls ? `<div class="controls">${controls}</div>` : ""}
    </div>
  </div></div>${overlay}`;
}

/* ================= End of game ================= */

function renderResults() {
  const s = G.s, c = s.config;
  const winners = s.lastGameWinners;
  const sides = range(sideCount(c)).sort((a, b) => (winners.includes(b) - winners.includes(a)) || (sideScore(s, b) - sideScore(s, a)));
  const mws = matchWinners(s), mySide = me() >= 0 ? sideOf(c, me()) : -1;
  const names = arr => list(arr.map(x => esc(sideLabel(s, x))));
  const solo = G.kind !== "pass";
  let head;
  if (G.kind === "tutorial") head = winners.includes(mySide) ? t("You won your first game!") : t("Tutorial complete!");
  else if (G.kind === "daily") head = t("You scored {n}", { n: fmt(s.scores[0]) });
  else if (mws.length) {
    if (solo && mws.includes(mySide)) head = mws.length > 1 ? t("You share the match!") : t("You win the match!");
    else head = t(mws.length > 1 ? "{names} share the match!" : "{names} wins the match!", { names: names(mws) });
  } else if (winners.length > 1) head = c.gamesToWin > 1 ? t("{names} share game {n}!", { names: names(winners), n: s.gameNumber }) : t("{names} share the win!", { names: names(winners) });
  else head = c.gamesToWin > 1 ? t("{names} takes game {n}", { names: names(winners), n: s.gameNumber }) : t("{names} wins!", { names: names(winners) });
  let sub = tieNoteText(s.tieNote);
  if (G.kind === "daily") {
    const best = stats.dailyBest[G.dailyDate];
    sub = `${t(winners.includes(0) ? "You beat {name}." : "You lost to {name}.", { name: esc(sn(s, 1)) })} ${t("Your best today: {score}.", { score: fmt(best) })} ${esc(Daily.status)}`;
  }
  const faces = side => `<span class="avs">${seatsOnSide(c, side).map(i => avatar(s.seats[i].char, "sm")).join("")}</span>`;
  const heroSides = mws.length ? mws : winners;
  const rows = sides.map((side, place) => `<div class="res ${winners.includes(side) ? "first" : ""}">
      <span class="place">${place + 1}</span>${faces(side)}
      <span class="nm">${esc(sideLabel(s, side))}</span>
      <span class="pts">${fmt(sideScore(s, side))}</span>
      ${c.gamesToWin > 1 ? `<span class="gw">${t("{n} won", { n: s.gameWins[side] })}</span>` : ""}
    </div>`).join("");
  const newAch = G.newAch.length || G.coinsEarned ? `<div class="newach">${G.coinsEarned ? `<span class="coins-earned">${COIN} ${t("+{n} coins", { n: fmtCoins(G.coinsEarned) })}</span>` : ""}${G.newAch.map(a => `<span>★ ${esc(t(a))}</span>`).join("")}</div>` : "";
  const guest = G.kind === "online" && G.role === "guest";
  let buttons;
  const home = `<button class="btn ghost" data-act="home">${t("Home")}</button>`;
  if (G.kind === "tutorial") buttons = `${home}<button class="btn primary" data-act="tutorial-done">${t("Play vs bots")}</button>`;
  else if (G.kind === "daily") buttons = `${home}<button class="btn primary" data-act="daily">${t("Try again")}</button>`;
  else if (guest && s.phase === "matchOver") buttons = `<button class="btn ghost" data-act="home">${t("Leave table")}</button>`
    + (G.askedRematch === matchKey(s) ? `<span class="muted">${t("Rematch requested. Waiting for the host…")}</span>` : `<button class="btn primary" data-act="rematch-ask">↻ ${t("Rematch")}</button>`);
  else if (guest) buttons = `<button class="btn ghost" data-act="home">${t("Leave table")}</button><span class="muted">${t("Waiting for the host…")}</span>`;
  else if (s.phase === "matchOver") buttons = (G.kind === "online" && G.rematchAsks && G.rematchAsks.length ? `<p class="rematch-ask">↻ ${t("Rematch requested by {names}", { names: list(G.rematchAsks.map(esc)) })}</p>` : "")
    + `${home}<button class="btn primary ${G.rematchAsks && G.rematchAsks.length ? "pulse" : ""}" data-act="rematch">↻ ${t("Rematch")}</button>`;
  else buttons = `${home}<button class="btn primary" data-act="next">${t("Next game")}</button>`;
  return `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="res-title">
    <div class="headline">
      <span class="avs">${heroSides.flatMap(side => seatsOnSide(c, side)).map(i => avatar(s.seats[i].char, "lg")).join("")}</span>
      <h2 id="res-title">${head}</h2>
      ${sub ? `<p style="margin:0;color:var(--muted)">${sub}</p>` : ""}
    </div>
    ${newAch}
    <div class="results">${rows}</div>
    <div class="sheet-foot" style="justify-content:center">${buttons}</div>
  </div></div>`;
}

function renderTiebreak() {
  const s = G.s, c = s.config, tb = s.tie, n = s.seats.length;
  const seg = 360 / TIEBREAKS.length;
  const pt = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`; };
  const wedges = TIEBREAKS.map((o, k) => `<path d="M50 50 L${pt(k * seg, 48)} A48 48 0 0 1 ${pt((k + 1) * seg, 48)}Z" fill="${o.color}" stroke="#0d1714" stroke-width=".8"/>
    <text transform="rotate(${(k + .5) * seg} 50 50)" x="50" y="19" text-anchor="middle" font-family="Figtree, sans-serif" font-size="${LANG === "zh" || LANG === "ar" ? 6.4 : 5.4}" font-weight="700" fill="#fffaf0">${t(o.name)}</text>`).join("");
  const spinning = tb.spin !== null && !tb.result;
  const gone = spinning ? Math.min(SPIN_MS, Date.now() - G.localSpinAt) : 0;
  const style = tb.spin === null ? "" : `--to:${tb.spinTo}deg;${spinning ? `animation-delay:-${gone}ms` : ""}`;
  const wheel = `<div class="wheel"><svg viewBox="-2 -8 104 110" role="img" aria-label="${t("Tie-breaker wheel")}" style="direction:ltr">
      <g class="wheel-g ${tb.spin === null ? "idle" : spinning ? "spinning" : "stopped"}" style="${style}"><circle cx="50" cy="50" r="49.5" fill="#0d1714"/>${wedges}</g>
      <circle cx="50" cy="50" r="9" fill="#0d1714" stroke="#d9ab4f" stroke-width="1.5"/><path d="M50 44 L56 50 L50 56 L44 50Z" fill="#d9ab4f"/>
      <path d="M44 -7 L56 -7 L50 5Z" fill="#d9ab4f" stroke="#0d1714" stroke-width="1"/></svg></div>`;
  const tiedNames = list(tb.sides.map(x => `<b>${esc(sideLabel(s, x))}</b>`));
  const faces = side => `<span class="avs">${seatsOnSide(c, side).map(i => avatar(s.seats[i].char)).join("")}</span>`;
  const host = isAuthority();
  let body;
  if (!tb.result) {
    body = `<p class="tie-lede">${t("{names} are tied on {n} points.", { names: tiedNames, n: `<b>${fmt(sideScore(s, tb.sides[0]))}</b>` })} ${tb.round > 1 ? t("Still tied, so spin again.") : t("Spin the wheel to pick the tie-breaker.")}</p>
      <div class="tie-legend">${TIEBREAKS.map(o => `<span><i style="background:${o.color}"></i>${t(o.name)}</span>`).join("")}</div>
      <div class="sheet-foot" style="justify-content:center">${host
        ? `<button class="btn primary" data-act="spin" ${spinning ? "disabled" : ""}>${spinning ? t("Spinning…") : tb.round > 1 ? t("Spin again") : t("Spin the wheel")}</button>`
        : `<span class="muted">${spinning ? t("Spinning…") : t("Waiting for the host to spin…")}</span>`}</div>`;
  } else {
    const opt = TIEBREAKS[tb.spin], r = tb.result;
    const valueText = side => {
      const v = r.values[side];
      if (r.id === "gems") return t(v === 1 ? "1 gem" : "{n} gems", { n: v });
      if (r.id === "biggest") return v ? t("{v} gem", { v }) : t("no gems");
      if (r.id === "recent") return v ? t("gem {n}", { n: v }) : t("no gems");
      if (r.id === "draw") return cardFace(suitFor(seatsOnSide(c, side)[0], n), v, "sm flip");
      return t("Wins");
    };
    const rows = tb.sides.map(side => `<div class="res ${r.winners.includes(side) ? "first" : ""}">${faces(side)}<span class="nm">${esc(sideLabel(s, side))}</span><span class="tie-val">${valueText(side)}</span></div>`).join("");
    const still = r.winners.length > 1 && r.id !== "shared";
    const verdict = r.id === "shared" ? t("{names} share the win!", { names: tiedNames }) : still ? t("Still tied! Spin again to settle it.") : t("{name} wins the tie-breaker!", { name: `<b>${esc(sideLabel(s, r.winners[0]))}</b>` });
    body = `<div class="tie-pick"><span class="chip" style="background:${opt.color}">${t(opt.name)}</span><span>${t(opt.desc)}</span></div>
      <div class="results">${rows}</div><p class="tie-lede" style="margin:0">${verdict}</p>
      <div class="sheet-foot" style="justify-content:center">${host ? `<button class="btn primary" data-act="tie-continue">${still ? t("Spin again") : t("See results")}</button>` : `<span class="muted">${t("Waiting for the host…")}</span>`}</div>`;
  }
  return `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="tie-title">
    <div class="headline"><span class="avs">${tb.sides.flatMap(side => seatsOnSide(c, side)).map(i => avatar(s.seats[i].char, "lg")).join("")}</span><h2 id="tie-title">${t("It's a tie!")}</h2></div>
    ${wheel}${body}</div></div>`;
}

function renderModal() {
  if (!app.modal) return "";
  let title, body;
  if (app.modal === "rules") {
    title = t("How to play");
    const B = x => `<b style="color:var(--ink)">${t(x)}</b>`;
    const pw = G && G.s.config.powers ? `<p style="margin:0">${B("Powers at this table:")} ${G.s.seats.map((p, i) => `${esc(sn(G.s, i))}: ${esc(powerName(p.char))} (${esc(powerText(p.char))})`).join(" · ")}</p>` : "";
    body = `<div style="display:flex;flex-direction:column;gap:10px;color:var(--muted)">
      <p style="margin:0">${t("Every player holds one suit, A to K. A is 1, J is 11, Q is 12 and K is 13.")}</p>
      <p style="margin:0">${t("Each round one gem is turned up. Everyone bids one card face down. All bids flip together and the highest card takes the gem, worth its number in points. Used cards are gone.")}</p>
      <p style="margin:0">${B("Ties:")} ${t("split shares the gem between everyone tied for the best bid. Cancel out knocks matching cards out, and the best card left wins.")}</p>
      <p style="margin:0">${B("Extras:")} ${t("Show next gem shows what's coming. A mystery gem stays hidden until the reveal. The jackpot is a 20-point gem in the last four rounds. Curses (−1 to −3) go to the lowest bid. The Double token doubles one round.")}</p>
      ${pw}
      <p style="margin:0">${B("Tied for first at the end?")} ${t("Spin the wheel: most gems, biggest gem, last gem, a high-card draw, or a shared win.")}</p>
      ${G && G.kind === "online" ? `<p style="margin:0">${B("Online:")} ${t("the host's device runs the table. Bids are hidden on screen until the reveal.")}</p>` : ""}
    </div>`;
  } else {
    const s = G.s, n = s.seats.length;
    const upcoming = s.prizes.slice(s.round + 1).map((v, k) => isMystery(s, s.round + 1 + k) ? null : v).sort((a, b) => (b ?? -99) - (a ?? -99));
    title = t("Cards left");
    body = `<div><div class="opt-label">${t("Gems still to come")}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${upcoming.length ? upcoming.map(v => prizeCard(v, "xs", v === null)).join("") : `<span class="muted">${t("None. This is the last one.")}</span>`}</div></div>
      <div class="hand-list"><div class="opt-label" style="margin:0">${t("Cards in each hand")}</div>
        ${range(n).map(i => `<div class="hrow">${avatar(s.seats[i].char, "sm")}<div class="cards">${s.hands[i].map(v => cardFace(suitFor(i, n), v, "xs")).join("")}</div></div>`).join("")}</div>
      ${s.history.length ? `<div><div class="opt-label">${t("History")}</div>
        <div class="ledger-wrap"><table class="ledger"><thead><tr><th>${t("Gem")}</th>${range(n).map(i => `<th>${esc(sn(s, i))}</th>`).join("")}</tr></thead>
        <tbody>${s.history.map(h => `<tr><td>${prizeLabel(h.prize)}</td>${range(n).map(i => `<td class="${h.winners.includes(i) ? "w" : ""}">${RANK(h.bids[i].card)}${h.bids[i].double ? "×2" : ""}${h.bids[i].power ? "★" : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>` : ""}`;
  }
  return `<div class="overlay" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${title}">
    <div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="${t("Close")}">✕</button></div>${body}</div></div>`;
}

function renderConfirmExit() {
  const online = G && G.kind === "online";
  return `<div class="overlay" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" style="max-width:420px">
    <div class="sheet-head"><h2>${t("Leave this game?")}</h2></div>
    <p style="margin:0;color:var(--muted)">${online ? (G.role === "host" ? t("You're the host, so the game ends for everyone.") : t("A bot will take your seat.")) : t("The current game will end and scores won't be kept.")}</p>
    <div class="sheet-foot"><button class="btn ghost" data-act="close">${t("Keep playing")}</button><button class="btn primary" data-act="home">${t("Leave game")}</button></div>
  </div></div>`;
}

/* ================= Daily leaderboard (shared through the db capability) ================= */
const Daily = { db: null, user: null, myId: null, rows: [], names: {}, status: "", checked: false };
function renderLeaderboard() {
  const date = todayKey();
  if (!Daily.checked) return `<p class="muted">${t("Loading…")}</p>`;
  if (!Daily.db) return `<p class="muted">${IN_APP ? t("The shared leaderboard is coming soon to the app. Your own best score is saved.") : t("The shared leaderboard isn't available in this view. Your own best score is still saved.")}</p>`;
  const rows = Daily.rows.filter(r => r.date === date && typeof r.score === "number").sort((a, b) => b.score - a.score).slice(0, 10);
  if (!rows.length) return `<p class="muted">${t("No scores yet today. Play the challenge to set the first one.")}</p>`;
  return `<div class="lb">${rows.map((r, k) => `<div class="row ${r.id === Daily.myId ? "me" : ""}">
      <span class="pl">${k + 1}</span>${avatar(CHAR[r.char] ? r.char : "fox", "sm")}
      <span class="nm">${esc(Daily.names[r.id] || t("Someone"))}${r.id === Daily.myId ? " " + t("(you)") : ""}</span><span class="sc">${fmt(r.score)}</span></div>`).join("")}</div>`;
}
function patchLeaderboard() {
  const el = document.getElementById("daily-lb");
  if (el) el.innerHTML = renderLeaderboard();
}
async function resolveNames() {
  if (!Daily.user) return;
  const ids = Daily.rows.filter(r => r.date === todayKey()).map(r => r.id).filter(id => !Daily.names[id]);
  if (!ids.length) return;
  try {
    const ps = await Daily.user.profiles(ids);
    ids.forEach(id => { Daily.names[id] = (ps[id] && ps[id].name) || "Someone"; });
  } catch (e) {}
  patchLeaderboard();
}
async function initDaily() {
  try { Daily.db = window.claude && window.claude.use ? await window.claude.use("db") : null; } catch (e) { Daily.db = null; }
  try { Daily.user = window.claude && window.claude.use ? await window.claude.use("user") : null; } catch (e) { Daily.user = null; }
  if (Daily.user) { try { Daily.myId = await Daily.user.id(); } catch (e) {} }
  Daily.checked = true;
  if (Daily.db) {
    Daily.db.collection("dailyscores").onSnapshot(snap => {
      Daily.rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
      patchLeaderboard();
      resolveNames();
    }, () => { Daily.db = null; patchLeaderboard(); });
  }
  patchLeaderboard();
}
async function postDaily(score, date) {
  Daily.status = "";
  if (!Daily.db || !Daily.myId) { Daily.status = t("Sign in to post your score to the shared leaderboard."); return; }
  const mine = Daily.rows.find(r => r.id === Daily.myId);
  if (mine && mine.date === date && mine.score >= score) return;
  try {
    await Daily.db.collection("dailyscores").doc(Daily.myId).set({ date, score, char: prefs.character, at: Date.now() });
    Daily.status = t("Posted to today's leaderboard.");
  } catch (e) {
    Daily.status = t("Your score couldn't be posted. Posting needs Contributor access to this page.");
  }
  if (app.screen === "game") render();
}

/* ================= Online play (the room capability) ================= */
/* One device hosts: it runs the table and shares it through its presence (see packState).
 * Guests share only their bid for the current round. Everyone renders from the host's state. */
const Online = { room: null, checked: false, named: null, code: "", role: null, peers: [], myPeer: null, error: "", lastG: null, unsub: null };
async function initOnline() {
  try { Online.room = window.claude && window.claude.use ? await window.claude.use("room") : null; } catch (e) { Online.room = null; }
  Online.checked = true;
  if (app.screen === "home" && !app.setup) render();
}
function randomCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}
async function joinTable(code, host) {
  code = String(code || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  if (code.length < 4) { Online.error = t("Enter the 4-character table code."); render(); return; }
  if (!Online.room) { Online.error = t("Online play isn't available in this view."); render(); return; }
  Online.error = t("Connecting…"); render();
  try {
    Online.named = await Online.room.join("db-" + code);
  } catch (e) {
    Online.error = e && e.code === "not_permitted" ? t("You can't join tables from this view.") : t("Couldn't open that table. Check your connection and try again.");
    render(); return;
  }
  Online.code = code; Online.role = host ? "host" : "guest"; Online.error = ""; Online.lastG = null; Online.hostSince = host ? Date.now() : 0;
  try { await Online.named.presence({ app: "diamondbid", v: 11, name: myName(), char: prefs.character, host: !!host, t: Online.hostSince || Date.now() }); } catch (e) {}
  Online.unsub = Online.named.onPeers(onPeersChange, () => { Online.error = t("The connection to the table was lost."); render(); });
  app.setup = Online.quick ? "online-quick" : "online-lobby";
  render();
}
function leaveOnline() {
  cancelQuick();
  Online.quick = false;
  if (Online.named) { try { Online.named.leave(); } catch (e) {} }
  Object.assign(Online, { named: null, code: "", role: null, peers: [], myPeer: null, error: "", lastG: null, unsub: null });
}
const tablePeople = () => Online.peers.filter(p => p.presence && p.presence.app === "diamondbid" && p.kind === "viewer")
  .sort((a, b) => (b.presence.host ? 1 : 0) - (a.presence.host ? 1 : 0) || (a.presence.t || 0) - (b.presence.t || 0));

function onPeersChange(ch) {
  Online.peers = ch.peers;
  const mine = ch.peers.find(p => p.sameTab);
  if (mine) Online.myPeer = mine.peer;
  // Two hosts at one table (both tapped "Host this table"): the earlier one keeps it.
  if (Online.role === "host" && !G) {
    const rival = tablePeople().find(p => !p.sameTab && p.presence.host && ((p.presence.t || 0) < Online.hostSince || ((p.presence.t || 0) === Online.hostSince && p.peer < Online.myPeer)));
    if (rival) { Online.role = "guest"; Online.named.presence({ host: false }).catch(() => {}); }
  }
  if (Online.role === "host") hostReadPeers(ch);
  else guestReadPeers(ch);
}
function hostReadPeers(ch) {
  // Quick match: deal as soon as the other player sits down.
  if (!G && Online.quick && tablePeople().length >= 2) { cancelQuick(); hostStart(QUICK_RULES); return; }
  if (!G || G.kind !== "online") { if (app.setup === "online-lobby") render(); return; }
  const s = G.s;
  let changed = false;
  ch.left.forEach(p => {
    const seat = s.seats.findIndex(x => x.pid === p.peer && !x.bot);
    if (seat >= 0) { replaceWithBot(s, seat, s.config.botLevel === "easy" ? "normal" : s.config.botLevel); G.notice = t("{name} left. A bot took their seat.", { name: s.seats[seat].name }); changed = true; }
  });
  const key = roundKey(s);
  ch.peers.forEach(p => {
    const seat = s.seats.findIndex(x => x.pid === p.peer && !x.bot);
    if (seat < 0 || p.sameTab) return;
    const pr = p.presence || {};
    if (s.phase === "bidding" && pr.f === key && usePowerNow(s, seat)) changed = true;
    const b = pr.b;
    if (s.phase === "bidding" && b && b.k === key && !s.submitted[seat]) {
      if (submit(s, seat, { card: Number(b.c), double: !!b.d, power: !!b.p })) changed = true;
    }
  });
  // Rematch requests from the other players.
  const asks = s.phase === "matchOver" ? ch.peers.filter(p => !p.sameTab && p.presence && p.presence.r === matchKey(s)).map(p => cleanName(p.presence.name) || charName(p.presence.char || "fox")) : [];
  if (asks.join() !== (G.rematchAsks || []).join()) { G.rematchAsks = asks; if (asks.length) { Sound.chime(); buzz([30, 40, 30]); } changed = true; render(); }
  if (changed) progress();
}
function guestReadPeers(ch) {
  const host = ch.peers.find(p => p.presence && p.presence.app === "diamondbid" && p.presence.host && !p.sameTab);
  if (G && G.kind === "online" && !host) {
    stopTimers();
    G = null; app.screen = "home"; app.setup = "online-lobby";
    Online.error = t("The host left, so the game ended.");
    render(); return;
  }
  const g = host && host.presence.g;
  if (g && g !== Online.lastG) { Online.lastG = g; guestApply(g); return; }
  if (app.setup === "online-lobby") render();
}
function guestApply(g) {
  let s;
  try { s = unpackState(g); } catch (e) { return; }
  const seat = s.seats.findIndex(x => x.pid === Online.myPeer && !x.bot);
  const mySeats = seat >= 0 ? [seat] : [];
  if (!G || G.kind !== "online") {
    beginGame(newG("online", s, mySeats, { role: "guest" }));
  } else {
    G.s = s; G.mySeats = mySeats; G.unlocked = mySeats[0] ?? null;
  }
  if (s.phase === "reveal" && G.prev.phase !== "reveal") G.revealAt = Date.now();
  observe();
  render();
  scheduleReveal();
}
function publish() {
  if (!G || G.kind !== "online" || G.role !== "host" || !Online.named) return;
  Online.named.presence({ g: packState(G.s) }).catch(() => {});
}
/* ================= Quick match ================= */
/* Everyone searching waits in one shared lobby. The two who have waited longest pair up: the earlier one
   opens a private table and invites the other. If nobody turns up in time, you play a bot instead. */
const QM_ROOM = "quickmatch-v1", QM_WAIT_MS = 20000;
const QUICK_RULES = { seatCount: 2, teams: false, gamesToWin: 1 };
const Match = { lobby: null, start: 0, timer: null, tick: null, paired: null };
async function quickMatch() {
  if (!Online.room) return;
  cancelQuick();
  Object.assign(Match, { start: Date.now(), paired: null });
  Online.error = ""; Online.quick = true;
  app.setup = "online-quick"; render();
  let lobby;
  try { lobby = await Online.room.join("db-" + QM_ROOM); }
  catch (e) { Online.quick = false; Online.error = t("Couldn't open that table. Check your connection and try again."); app.setup = "online-menu"; render(); return; }
  if (app.setup !== "online-quick") { try { lobby.leave(); } catch (e) {} return; } // cancelled while connecting
  Match.lobby = lobby;
  try { await lobby.presence({ app: "diamondbid", qm: 1, name: myName(), char: prefs.character, t: Match.start }); } catch (e) {}
  lobby.onPeers(onLobby, () => {});
  Match.timer = setTimeout(noOneFound, QM_WAIT_MS);
  Match.tick = setInterval(() => {
    const el = document.getElementById("qm-left");
    if (el) el.textContent = Math.max(0, Math.ceil((QM_WAIT_MS - (Date.now() - Match.start)) / 1000));
  }, 250);
}
function onLobby(ch) {
  if (Match.paired || !Match.lobby) return;
  const me = ch.peers.find(p => p.sameTab);
  if (!me) return;
  // Someone already picked me: join their table.
  const invite = ch.peers.find(p => !p.sameTab && p.presence && p.presence.qm && p.presence.with === me.peer && p.presence.pair);
  if (invite) { Match.paired = { code: invite.presence.pair, host: false }; joinMatched(); return; }
  const waiting = ch.peers.filter(p => p.presence && p.presence.app === "diamondbid" && p.presence.qm && !p.presence.pair)
    .sort((a, b) => (a.presence.t || 0) - (b.presence.t || 0) || (a.peer < b.peer ? -1 : 1));
  const i = waiting.findIndex(p => p.sameTab);
  if (i < 0 || i % 2 || !waiting[i + 1]) return; // the earlier of each pair opens the table
  const code = "qm" + randomCode();
  Match.paired = { code, host: true };
  Match.lobby.presence({ pair: code, with: waiting[i + 1].peer }).catch(() => {});
  joinMatched();
}
async function joinMatched() {
  clearTimeout(Match.timer);
  // If the game hasn't started a little later (the other player vanished), fall back to a bot.
  Match.timer = setTimeout(() => { if (!G && Online.quick) noOneFound(); }, 12000);
  render();
  await joinTable(Match.paired.code, Match.paired.host);
  if (!Match.paired.host && Match.lobby) { try { Match.lobby.leave(); } catch (e) {} Match.lobby = null; }
}
function cancelQuick() {
  clearTimeout(Match.timer); clearInterval(Match.tick);
  if (Match.lobby) { try { Match.lobby.leave(); } catch (e) {} }
  Object.assign(Match, { lobby: null, timer: null, tick: null, paired: null });
}
function noOneFound() {
  leaveOnline();
  app.setup = null;
  startLocal("bots");
  toast("◆", t("Nobody else was online, so you're playing a bot."), t("Quick match"));
}
function hostStart(over = {}) {
  const people = tablePeople();
  const c = Object.assign({}, prefs.config, over);
  if (people.length > 4) { Online.error = t("A table holds up to 4 players."); render(); return; }
  if (people.length > c.seatCount) c.seatCount = 4;
  const used = new Set();
  const seats = people.map(p => {
    let ch = CHAR[p.presence.char] ? p.presence.char : "fox";
    if (used.has(ch)) ch = CHAR_IDS.find(x => !used.has(x));
    used.add(ch);
    return { name: cleanName(p.presence.name) || CHAR[ch].name, char: ch, bot: false, pid: p.peer };
  });
  for (let i = seats.length; i < c.seatCount; i++) {
    const ch = CHAR_IDS.find(x => !used.has(x)); used.add(ch);
    seats.push({ name: CHAR[ch].name, char: ch, bot: true, level: c.botLevel });
  }
  const mine = seats.findIndex(x => x.pid === Online.myPeer);
  beginGame(newG("online", newMatch(c, seats), [mine >= 0 ? mine : 0], { role: "host" }));
  progress();
}

function renderOnlineSheet() {
  const head = (title) => `<div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-act="online-close" aria-label="${t("Close")}">✕</button></div>`;
  const err = Online.error ? `<p style="margin:0;color:${Online.error === t("Connecting…") ? "var(--muted)" : "#ff9a9a"}">${esc(Online.error)}</p>` : "";
  if (app.setup === "online-menu" && !Online.room) {
    return `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true">
      ${head(t("Play online"))}
      ${IN_APP ? `<p style="margin:0">${t("Online play with friends is coming soon to the app. For now, play vs bots, pass and play, or the daily challenge.")}</p>`
      : Online.checked ? `<p style="margin:0">${t("Online play isn't available in this view.")}</p>
      <div style="display:flex;flex-direction:column;gap:10px;color:var(--muted)">
        <p style="margin:0">${t("Online tables only admit people who are signed in to Claude and invited to this page. A public link, or a link opened inside another app such as WhatsApp, can't join a table.")}</p>
        <p style="margin:0"><b style="color:var(--ink)">${t("To fix it:")}</b></p>
        <p style="margin:0">${t("1. The page's owner invites each friend by email from the page's Share menu.")}</p>
        <p style="margin:0">${t("2. Open the link in Safari, Chrome or the Claude app, and sign in to Claude with the invited email.")}</p>
        <p style="margin:0">${t("Everything else (bots, pass and play, the daily challenge) works without that.")}</p>
      </div>` : searching(t("Connecting…"))}
      <div class="sheet-foot" style="justify-content:flex-end"><button class="btn primary" data-act="online-close">${t("OK")}</button></div>
    </div></div>`;
  }
  if (app.setup === "online-quick") {
    const left = Math.max(0, Math.ceil((QM_WAIT_MS - (Date.now() - Match.start)) / 1000));
    return `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true" style="max-width:420px">
      ${head(t("Quick match"))}
      ${Match.paired ? searching(t("Player found! Dealing the cards…"))
        : `${searching(t("Looking for players…"))}<p class="muted" style="margin:0;text-align:center">${t("Playing a bot in {n} seconds if nobody joins.", { n: `<b id="qm-left" style="color:var(--ink)">${left}</b>` })}</p>`}
      ${err}
      <div class="sheet-foot" style="justify-content:center"><button class="btn ghost" data-act="online-close">${t("Cancel")}</button></div>
    </div></div>`;
  }
  if (app.setup === "online-menu") {
    return `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true">
      ${head(t("Play online"))}
      <div class="quick">
        <div><h3>${t("Quick match")}</h3><p class="muted" style="margin:0">${t("Play someone who's online now. If nobody turns up in 20 seconds, you'll play a bot instead.")}</p></div>
        <button class="btn primary" data-act="quick-match">${t("Find a player")}</button>
      </div>
      <div class="opt-label" style="margin:0">${t("Play with friends")}</div>
      <p class="muted friends-note" style="margin:0">${t("Play with friends on their own phones. Everyone opens this same page. Your friends need to be able to open it too: share it from the page's Share menu.")}</p>
      <div class="choice">
        <div><h3>${t("Start a table")}</h3><p class="muted" style="margin:0">${t("You'll get a code to send your friends. You pick the rules.")}</p><button class="btn primary" data-act="online-create">${t("Start a table")}</button></div>
        <div><h3>${t("Join a table")}</h3><label class="muted" for="join-code" style="font-size:13px">${t("Table code")}</label><input id="join-code" class="code-input" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" dir="ltr"><button class="btn ghost" data-act="online-join">${t("Join")}</button></div>
      </div>
      ${err}
    </div></div>`;
  }
  const people = tablePeople();
  const host = Online.role === "host";
  const roster = people.map(p => {
    const ch = CHAR[p.presence.char] ? p.presence.char : "fox";
    return `<div class="seat-row">${avatar(ch)}<div><b>${esc(cleanName(p.presence.name) || charName(ch))}${p.sameTab ? " " + t("(you)") : ""}</b><small>${p.presence.host ? t("Host") : t("Player")}${p.guest ? " · " + t("guest") : ""}</small></div></div>`;
  }).join("");
  const c = prefs.config;
  const seats = Math.max(c.seatCount, people.length > 2 ? 4 : c.seatCount);
  return `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true">
    ${head(host ? t("Your table") : t("Table"))}
    <div><div class="opt-label" style="text-align:center">${t("Table code")}</div><div class="code" dir="ltr">${esc(Online.code.toUpperCase())}</div>
      <p class="muted" style="margin:4px 0 0;text-align:center">${t("Friends open this page, tap Play online, and enter this code.")}</p></div>
    ${people.length < 2 ? searching(t("Looking for players…")) : !host && people.some(p => p.presence.host) ? searching(t("Waiting for the host to start the game…")) : ""}
    <div><div class="opt-label">${t("At the table")} (${people.length})</div><div class="peers">${roster || `<p class="muted">${t("Connecting…")}</p>`}</div></div>
    ${host ? rulesFields("online", people.length < seats)
      : people.some(p => p.presence.host)
        ? ""
        : `<div style="display:flex;flex-direction:column;gap:10px;align-items:flex-start"><p style="margin:0">${t("Nobody is hosting this table yet. One person needs to host: they pick the rules and start the game.")}</p><button class="btn primary" data-act="online-host">${t("Host this table")}</button></div>`}
    ${people.length > 1 && new Set(people.map(p => p.presence.char)).size < people.length ? `<p class="muted" style="margin:0;font-size:13px">${t("Two of you picked the same character. One will be swapped when the game starts, or pick a different one on the home page first.")}</p>` : ""}
    ${err}
    <div class="sheet-foot"><button class="btn ghost" data-act="online-close">${t("Leave table")}</button>
      ${host ? `<button class="btn primary" data-act="online-start" ${people.length < 2 ? "disabled" : ""}>${people.length < 2 ? t("Waiting for friends…") : t("Start game")}</button>` : ""}</div>
  </div></div>`;
}

/* ================= Translated sentences ================= */
/** What happened in a round, in the player's language. */
function summaryText(s, r) {
  const prize = t("the {prize}", { prize: pName(r.prize) }), parts = [];
  const nm = i => `<b>${esc(sn(s, i))}</b>`;
  r.powers.forEach(i => {
    const p = POWERS[s.seats[i].char];
    if (p && p.timing === "bid") parts.push(t("{name} used {power}.", { name: nm(i), power: powerName(s.seats[i].char) }));
  });
  if (r.swappedFrom != null) parts.push(t("The {prize} swapped places with the next gem.", { prize: pName(r.swappedFrom) }));
  if (r.burned != null) parts.push(t("{name}'s card was burned to 0.", { name: nm(r.burned) }));
  if (r.cancelled.length) {
    const vals = [...new Set(r.cancelled.map(i => r.eff[i]))].sort((a, b) => a - b).map(RANK);
    parts.push(t("{cards} cancelled out.", { cards: list(vals) }));
  }
  if (!r.winners.length) parts.push(t("Nobody takes {prize}.", { prize }));
  else if (r.winners.length === 1) {
    const w = r.winners[0], card = RANK(r.bids[w].card);
    const low = (r.prize >= 0) === r.reverse;
    let line;
    if (r.prize >= 0) line = t(low ? "{name} wins {prize} with {card} (lowest card)." : "{name} wins {prize} with {card}.", { name: nm(w), prize, card });
    else line = t(low ? "{name} bid lowest ({card}) and takes {prize}." : "{name} bid highest ({card}) and takes {prize}.", { name: nm(w), prize, card });
    if (r.bids[w].double) line += " " + t("Doubled to {n}.", { n: fmt(r.awards[w]) });
    parts.push(line);
  } else {
    parts.push(t("Tie at {card}. {names} split {prize}, {n} each.", { card: RANK(r.eff[r.winners[0]]), names: list(r.winners.map(nm)), prize, n: fmt(r.prize * 12 / r.winners.length) }));
  }
  if (r.pickpocket != null) parts.push(t("A pickpocket took 2 points from {name}.", { name: nm(r.pickpocket) }));
  if (r.leapt >= 0) parts.push(t("{name}'s card leapt back to their hand.", { name: nm(r.leapt) }));
  return parts.join(" ");
}
function tieNoteText(note) {
  if (!note || !note.includes("|")) return note ? esc(note) : "";
  const [id, pts] = note.split("|");
  const opt = TIEBREAKS.find(o => o.id === id);
  if (!opt) return "";
  return id === "shared" ? t("Tied on {n} points. The wheel picked a shared win.", { n: fmt(+pts) })
    : t("Tied on {n} points. The wheel picked {rule}.", { n: fmt(+pts), rule: t(opt.name) });
}

/* ================= Coins: daily gift, shop, wallet ================= */
function checkDailyGift() {
  const today = todayKey();
  if (stats.lastGift === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  stats.giftStreak = stats.lastGift === todayKey(y) ? stats.giftStreak + 1 : 1;
  const amount = GIFT_LADDER[Math.min(stats.giftStreak, GIFT_LADDER.length) - 1];
  stats.lastGift = today;
  stats.coins += amount;
  saveStats();
  app.gift = amount;
  if (!G) app.modal = "gift";
}
function renderHomeModal() {
  const m = app.modal;
  if (!m) return "";
  const wrap = (title, body, foot) => `<div class="overlay" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" style="max-width:460px">
    <div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="${t("Close")}">✕</button></div>${body}<div class="sheet-foot" style="justify-content:flex-end">${foot}</div></div></div>`;
  const ladder = () => `<div class="ladder">${GIFT_LADDER.map((v, k) => `<div class="${k < Math.min(stats.giftStreak, 7) ? "got" : ""} ${k === Math.min(stats.giftStreak, 7) - 1 ? "today" : ""}"><small>${t("Day {n}", { n: k + 1 })}${k === 6 ? "+" : ""}</small><b>${v}</b></div>`).join("")}</div>`;
  if (m === "lang") {
    return wrap(t("Language"), `<div class="langs">${LANGS.map(l => `<button class="langopt" data-act="set-lang" data-id="${l.id}" aria-pressed="${l.id === LANG}" lang="${l.id}" dir="${l.rtl ? "rtl" : "ltr"}"><b>${l.name}</b><small>${l.en}</small></button>`).join("")}</div>`, "");
  }
  if (m === "gift") {
    return wrap(t("Daily gift"), `<div class="gift">${COIN.replace('class="coin"', 'class="coin big"')}<b>${t("+{n} coins", { n: fmtCoins(app.gift || 0) })}</b>
        <p class="muted" style="margin:0">${t("Day {n} in a row. Come back tomorrow for more: the gift grows each day up to day 7.", { n: stats.giftStreak })}</p></div>${ladder()}`,
      `<button class="btn primary" data-act="close">${t("Collect")}</button>`);
  }
  if (m === "coins") {
    return wrap(`${COIN} ${t("{n} coins", { n: fmtCoins(stats.coins) })}`, `<div class="earn">
        <div><b>${t("Daily gift")}</b><span>${t("{a}–{b} a day, more for each day in a row", { a: GIFT_LADDER[0], b: GIFT_LADDER[6] })}</span></div>
        <div><b>${t("Games vs bots")}</b><span>${t("10–30 per game, triple for a win (more for harder bots)")}</span></div>
        <div><b>${t("Online games")}</b><span>${t("20 per game, 60 for a win")}</span></div>
        <div><b>${t("Daily challenge")}</b><span>${t("50 plus your score, once a day")}</span></div>
        <div><b>${t("Achievements")}</b><span>${t("{n} each", { n: ACH_REWARD })}</span></div>
        <div><b>${t("Tutorial")}</b><span>${t("100 the first time")}</span></div>
        <div><b>${t("Pass and play")}</b><span>${t("10 per game")}</span></div>
      </div>${ladder()}`, `<button class="btn primary" data-act="close">${t("OK")}</button>`);
  }
  if (m === "buy") {
    const item = itemById(app.buyId);
    if (!item) return "";
    const price = priceOf(item), short = price - stats.coins;
    let preview = "";
    if (CHAR[item.id]) preview = `<div class="buy-prev">${avatar(item.id, "xl")}<div><b>${esc(t(item.title))}</b><p class="muted" style="margin:4px 0 0">${esc(t(item.line))}</p><p style="margin:8px 0 0"><b style="color:var(--brass)">${esc(powerName(item.id))}:</b> ${esc(powerText(item.id))}</p></div></div>`;
    else if (DECKS.some(d => d.id === item.id)) preview = `<div class="buy-prev" data-deck="${item.id}"><div class="mini" style="position:relative;width:150px;height:96px;flex:none">${cardBack("lg").replace('class="card', 'style="position:absolute;left:0;top:0;transform:rotate(-8deg)" class="card')}${cardFace("h", 13, "lg").replace('class="card', 'style="position:absolute;left:56px;top:0;transform:rotate(6deg)" class="card')}</div><div><b>${esc(t(item.note))}</b></div></div>`;
    else preview = `<div class="buy-prev"><span class="swatch" style="width:88px;height:88px;background:radial-gradient(circle at 35% 30%, ${item.a}, ${item.b})"></span><div><b>${esc(t(item.name))}</b><p class="muted" style="margin:4px 0 0">${t("Changes the felt behind every game.")}</p></div></div>`;
    return wrap(`${esc(CHAR[item.id] ? charName(item.id) : t(item.name))}`, `${preview}
      <p style="margin:0">${t("Price:")} ${COIN} <b>${fmtCoins(price)}</b> · ${t("You have")} ${COIN} <b>${fmtCoins(stats.coins)}</b></p>
      ${short > 0 ? `<p class="muted" style="margin:0">${t("You need {n} more coins. Play games, finish the daily challenge and collect your daily gift to earn them.", { n: fmtCoins(short) })}</p>` : ""}`,
      `<button class="btn ghost" data-act="close">${t("Not now")}</button><button class="btn primary" data-act="confirm-buy" ${short > 0 ? "disabled" : ""}>${t("Buy for {n}", { n: fmtCoins(price) })}</button>`);
  }
  return "";
}
function buy(id) {
  const item = itemById(id);
  if (!item || isUnlocked(item) || stats.coins < priceOf(item)) return;
  stats.coins -= priceOf(item);
  stats.owned.push(id);
  if (CHAR[id]) prefs.character = id; else if (DECKS.some(d => d.id === id)) prefs.deck = id; else prefs.table = id;
  saveStats(); savePrefs();
  app.modal = null;
  Sound.fanfare(); confetti(80);
  toast("\u2726", t("{name} is yours", { name: CHAR[id] ? charName(id) : t(item.name) }), t("New " + kindOf(id)));
  render();
}

/* ================= Render + events ================= */
function render() {
  applyLook();
  const root = document.getElementById("app");
  if (!root) return;
  if (app.screen === "game" && G) {
    root.innerHTML = renderGame() + (app.modal === "exit" ? renderConfirmExit() : renderModal())
      + (G.notice ? `<div class="overlay"><div class="sheet" role="alertdialog" style="max-width:420px"><p style="margin:0">${esc(G.notice)}</p><div class="sheet-foot" style="justify-content:flex-end"><button class="btn primary" data-act="notice-ok">${t("OK")}</button></div></div></div>` : "");
    root.insertAdjacentHTML && root.insertAdjacentHTML("beforeend", rotateNotice());
    flyPlayedCard();
    turnClock();
  } else {
    const typing = document.activeElement && document.activeElement.id === "join-code" ? document.activeElement.value : null;
    root.innerHTML = renderHome() + (app.setup ? renderSetup() : "") + renderHomeModal() + rotateNotice();
    if (typing !== null) { const el = document.getElementById("join-code"); if (el) { el.value = typing; el.focus(); } }
  }
}

/* ================= Drag a card to play it ================= */
/* Press a card in your hand and drag it up onto the table; let go above your hand to bid it.
   A copy of the card follows your finger, and the "Your bid" spot lights up when you're in range. */
const Drag = { v: null, start: null, ghost: null, origin: null, moved: false, justDropped: false };
function dropZoneHit(y) {
  const hand = document.querySelector(".hand");
  return hand && hand.getBoundingClientRect ? y < hand.getBoundingClientRect().top + 10 : false;
}
function dragMove(e) {
  if (Drag.v === null) return;
  const dx = e.clientX - Drag.start.x, dy = e.clientY - Drag.start.y;
  if (!Drag.moved) {
    if (Math.hypot(dx, dy) < 10) return;
    Drag.moved = true;
    const src = document.querySelector(`.hand .card[data-v="${Drag.v}"]`);
    if (!src) { Drag.v = null; return; }
    const r = src.getBoundingClientRect();
    Drag.origin = r;
    const g = src.cloneNode(true);
    g.removeAttribute("style"); g.removeAttribute("data-act");
    g.classList.add("drag-ghost");
    Object.assign(g.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", "--w": r.width + "px" });
    g.style.setProperty("--w", r.width + "px");
    document.body.appendChild(g);
    Drag.ghost = g;
    G.selected = Drag.v; G.dragging = Drag.v;
    Sound.select();
    render();
  }
  e.preventDefault();
  Drag.ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-12, Math.min(12, dx / 12))}deg) scale(1.1)`;
  const ok = dropZoneHit(e.clientY);
  const slot = document.querySelector("#mybid .slot");
  if (slot) slot.classList.toggle("dropok", ok);
  Drag.ghost.classList.toggle("ok", ok);
}
function dragEnd(e) {
  if (Drag.v === null) return;
  const v = Drag.v, g = Drag.ghost, moved = Drag.moved;
  Drag.v = null;
  if (!moved) return;
  Drag.justDropped = true; setTimeout(() => { Drag.justDropped = false; }, 60);
  G.dragging = null;
  const ok = e.type !== "pointercancel" && dropZoneHit(e.clientY) && activeSeat() !== undefined;
  if (ok) {
    G.selected = v;
    G.flyFrom = g.getBoundingClientRect();
    g.remove();
    placeBid();
  } else {
    // Not far enough: the card slides back into your hand.
    g.style.transition = "transform .25s ease";
    g.style.transform = "none";
    setTimeout(() => g.remove(), 260);
    render();
  }
}
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("pointerdown", e => {
    const el = e.target && e.target.closest && e.target.closest(".hand button.card");
    if (!el || el.disabled || !G || activeSeat() === undefined) return;
    Drag.v = +el.dataset.v; Drag.start = { x: e.clientX, y: e.clientY }; Drag.moved = false;
  });
  document.addEventListener("pointermove", dragMove, { passive: false });
  document.addEventListener("pointerup", dragEnd);
  document.addEventListener("pointercancel", dragEnd);
}

/* The card you bid glides from your hand to the "Your bid" spot. */
function flyPlayedCard() {
  const from = G && G.flyFrom;
  if (!from) return;
  G.flyFrom = null;
  const to = document.querySelector("#mybid .card");
  if (!to || !to.animate || !to.getBoundingClientRect) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = to.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (r.left + r.width / 2), dy = from.top + from.height / 2 - (r.top + r.height / 2);
  to.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${from.width / r.width}) rotate(-8deg)`, boxShadow: "0 4px 10px rgba(0,0,0,.3)" },
    { transform: `translate(${dx * .35}px, ${dy * .35 - 40}px) scale(1.12) rotate(6deg)`, boxShadow: "0 26px 40px rgba(0,0,0,.45)", offset: .55 },
    { transform: "none" },
  ], { duration: 480, easing: "cubic-bezier(.25,.8,.3,1)" });
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  if (act === "close-bg" && e.target !== el) return;
  Sound.unlock();
  switch (act) {
    case "pick-char": {
      const id = el.dataset.id, changed = id !== prefs.character;
      prefs.character = id; savePrefs(); Sound.select(); render();
      if (changed) toast("★", `${powerName(id)}: ${powerText(id)}`, charName(id));
      break;
    }
    case "pick-deck": prefs.deck = el.dataset.id; savePrefs(); Sound.select(); render(); break;
    case "pick-table": prefs.table = el.dataset.id; savePrefs(); Sound.select(); render(); break;
    case "four": prefs.fourColor = !prefs.fourColor; savePrefs(); render(); break;
    case "sound": prefs.sound = !prefs.sound; savePrefs(); if (prefs.sound) Sound.chime(); render(); break;
    case "open-setup": app.setup = el.dataset.kind; render(); break;
    case "open-online": app.setup = "online-menu"; Online.error = ""; render(); break;
    case "online-create": joinTable(randomCode(), true); break;
    case "quick-match": quickMatch(); break;
    case "online-join": joinTable((document.getElementById("join-code") || {}).value, false); break;
    case "online-close": leaveOnline(); app.setup = null; render(); break;
    case "online-start": hostStart(); break;
    case "online-host":
      Online.role = "host"; Online.hostSince = Date.now();
      if (Online.named) Online.named.presence({ host: true, t: Online.hostSince }).catch(() => {});
      render(); break;
    case "close": case "close-bg": if (app.setup && app.setup.startsWith("online")) break; app.setup = null; app.modal = null; render(); break;
    case "cfg": {
      const key = el.dataset.key, val = JSON.parse(el.dataset.val);
      if (key === "localPlayers") prefs.localPlayers = val; else prefs.config[key] = val;
      if (key === "seatCount") prefs.localPlayers = Math.min(Math.max(prefs.localPlayers, 2), val);
      savePrefs(); render(); break;
    }
    case "cycle-char": {
      const seat = +el.dataset.seat, plan = seatPlan(app.setup);
      const taken = new Set(plan.filter((p, i) => !p.bot && i !== seat).map(p => p.char));
      const cur = CHAR_IDS.indexOf(plan[seat].char);
      let nextId = plan[seat].char;
      for (let k = 1; k <= CHAR_IDS.length; k++) { const id = CHAR_IDS[(cur + k) % CHAR_IDS.length]; if (!taken.has(id) && isUnlocked(CHAR[id])) { nextId = id; break; } }
      if (seat === 0) prefs.character = nextId; else prefs.passChars[seat] = nextId;
      savePrefs(); render(); break;
    }
    case "reroll": app.botOffset++; render(); break;
    case "start": startLocal(app.setup); break;
    case "replay": startLocal(prefs.lastKind); break;
    case "rematch-ask": askRematch(); break;
    case "daily": startDaily(); break;
    case "tutorial": startTutorial(); break;
    case "tutorial-done": stopTimers(); G = null; app.screen = "home"; app.setup = "bots"; render(); break;
    case "select": {
      const v = +el.dataset.v, now = Date.now();
      if (Drag.justDropped) break; // the click that ends a drag
      // Double-tap a card to play it straight away.
      if (G.selected === v && G.lastTap && G.lastTap.v === v && now - G.lastTap.at < 450) { G.lastTap = null; placeBid(); break; }
      G.lastTap = { v, at: now };
      G.selected = G.selected === v && now - (G.selectedAt || 0) > 450 ? null : v;
      G.selectedAt = now;
      Sound.select(); render(); break;
    }
    case "double": G.useDouble = !G.useDouble; Sound.select(); render(); break;
    case "power": G.usePower = !G.usePower; Sound.select(); render(); break;
    case "power-now": useInstantPower(); break;
    case "bid": placeBid(); break;
    case "unlock": G.unlocked = activeSeat(); render(); break;
    case "next": nextStep(); break;
    case "spin": spinWheel(); break;
    case "tie-continue": tieContinue(); break;
    case "rematch": doRematch(); break;
    case "exit": app.modal = "exit"; render(); break;
    case "home": leaveGame(); break;
    case "modal": app.modal = el.dataset.m; render(); break;
    case "notice-ok": G.notice = null; render(); break;
    case "come-back": comeBack(); break;
    case "coins": app.modal = "coins"; render(); break;
    case "lang": app.modal = "lang"; render(); break;
    case "tab": app.tab = el.dataset.tab; Sound.select(); window.scrollTo(0, 0); render(); break;
    case "set-lang": setLang(el.dataset.id); prefs.lang = LANG; savePrefs(); app.modal = null; Sound.select(); render(); break;
    case "buy": app.buyId = el.dataset.id; app.modal = "buy"; Sound.select(); render(); break;
    case "confirm-buy": buy(app.buyId); break;
  }
});
document.addEventListener("input", e => {
  if (e.target.id !== "name") return;
  prefs.name = e.target.value.slice(0, 16);
  savePrefs();
  const label = document.getElementById("playing-name");
  if (label) label.textContent = myName();
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "join-code") joinTable(e.target.value, false);
  // Keyboard: Enter plays the picked card.
  else if (e.key === "Enter" && G && app.screen === "game" && G.selected != null && activeSeat() !== undefined) { e.preventDefault(); placeBid(); }
  if (e.key === "Escape" && (app.modal || (app.setup && !app.setup.startsWith("online")))) { app.setup = null; app.modal = null; render(); }
});

/* Keep a local game in progress across page updates (online games reconnect from scratch). */
window.claude?.hot?.snapshot?.(() => ({ app: Object.assign({}, app, { setup: app.setup && app.setup.startsWith("online") ? null : app.setup }), G: G && G.kind !== "online" ? G : null }));
const boot = data => {
  if (data && data.app) {
    app = Object.assign(app, data.app, { introDone: true });
    G = data.G || null;
    if (!G) app.screen = "home";
  }
  if (!(data && data.app)) showSplash();
  checkDailyGift();
  render();
  if (G) { scheduleBots(); scheduleReveal(); scheduleSpin(); }
  initOnline();
  initDaily();
};
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
