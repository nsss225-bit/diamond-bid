# Diamond Bid changelog

## 1.1
- **Languages:** English, العربية (Arabic, right-to-left), Español, Français and 中文. The app picks the phone's language on first visit; change it anytime from the globe button on the home screen.

**Play together**
- Online play with friends: start a table, share the 4-letter code, and play on your own phones. Empty seats get bots. If a player leaves, a bot takes over.
- Daily challenge: the same gems for everyone each day against a Hard bot, with a shared leaderboard.
- Interactive tutorial with Prof. Hoot as your coach.

**New rules** (each one can be turned on or off)
- Character powers: every character has a one-time power, such as Feint, Swap, Upside down or Copycat.
- Show next gem, mystery gem, and a 20-point jackpot gem in the last four rounds.
- Expert bots that learn how you bid during the game.

**Feel**
- Sound effects and vibration, with a mute button.
- "Steal!", "Jackpot!", "Big win!" and power banners, floating points, a curse shake, and confetti for winners.
- Gem piles next to every score.
- End-of-game recap: best round, wasted card, closest call, gems taken.

**Progress**
- 17 achievements with pop-up notices.
- Unlockables: Rosa and Ember (new characters with powers), Gold Leaf and Galaxy card designs, Midnight table.

**Under the hood**
- The rules engine is now its own file (`web/engine.js`) with tests: `node web/tests/engine.test.js` and `node web/tests/ui.test.js`.
- Frozen copy in `releases/web-1.1/`.
- The iPhone app is still at the 1.0 feature set.

## 1.0

The first complete version.

**Web game** (`web/index.html`, frozen copy in `releases/diamond-bid-web-1.0.html`)
- 2 or 4 players: free-for-all or 2 vs 2 teams.
- Play vs bots (Easy, Normal, Hard) or pass and play on one device.
- Rule options: ties split or cancel out, cursed gems, double token, single game or best of 3.
- Tie-breaker wheel for games tied for first: most gems, biggest gem, last gem, high card, shared win.
- 8 characters, 6 card designs, 5 table colors, four-color suits.
- Score bars for every player, opponents' bids next to the gem, 3-second countdown after each reveal.

**iPhone app** (`ios/`, SwiftUI + Game Center, not yet compiled)
- Same core rules, bots and pass and play, plus online matches with friends through Game Center.
- Not yet included: characters, card designs, tie-breaker wheel, score bars and countdown.
