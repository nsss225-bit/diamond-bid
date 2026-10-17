# Diamond Bid changelog

## Unreleased
- The "Cards left" button (▤) is gone from the game screen: no more peeking at the upcoming gems or everyone's hands. Prof. Hoot's Foresight power still shows the next 3 gems.
- 6 new characters, each with a new power: Pip (Soft landing), Coco (Mimic), Inky (Ink cloud), Stella (Wish), Finn (Bite) and Leo (Royal share). Bots know how to use them.
- 14 new achievements (31 in all), from Ace in the hole to Champion.
- Account: tap the person button at the top of the home screen. On claude.ai you're signed in with your Claude account, and your coins, characters, designs and achievements are saved to it and follow you to other devices.
- Play tab: the one-line description is gone, and Play again, Daily challenge and Tutorial are now three equal, easy-to-tap buttons.
- End-of-game screen is shorter: the "Your game" recap (best round, closest call, gems taken) is gone.
- Character picker: small tiles, 3 per row on phones (picture, name and nickname only). Picking a character shows its power in a short pop-up; locked ones show just their price.

## 1.4
- Quick match: Play online → Find a player pairs you with someone else searching right now (1 vs 1). If nobody turns up in 20 seconds, you play a bot instead. Tables with a code for friends still work as before.
- Rematch: online, anyone at the table can ask for a rematch (the host sees who asked and starts it for everyone). On the home screen, "↻ Play again" restarts your last game vs bots or pass and play with the same rules.
- Game setup (vs bots and pass and play) fits one phone screen: each label sits beside its choices, the extras are compact tiles, and the seats are one row of avatars.
- The Play tab fits one screen on phones and portrait tablets, no scrolling (checked from iPhone SE up to iPhone Pro Max and iPad).
- Home screen tabs along the bottom: Play, Daily, Customize (characters, card designs, tables), Achievements and How to play. A red dot on Daily means today's challenge is still waiting; Achievements shows how many you've earned.
- Play a card by double-tapping it or dragging it up onto the table. The "Place bid face down" button is gone; one tap just picks a card (Enter plays it on a keyboard).
- Game setup: the 6 extras sit 3 in a row as compact tiles.
- Phones: the whole table fits one screen with no scrolling, clear of the notch and the home bar (checked on iPhone SE, iPhone 15 and a 360-wide Android). Pop-up messages moved to the top so they never cover your cards.
- Phones held sideways show "Turn your phone upright to play"; the store apps lock phones to portrait.
- Tablets and computers in landscape: scores and controls in a side panel, and in 4-player games everyone sits around the table.
- New Diamond Bid logo, an animated opening screen, and an animated "Looking for players…" loader in online lobbies.
- Store apps: iOS and Android projects (Capacitor) with app icon, launch screen and cloud build workflows (see mobile/README.md).

## 1.3
- Your cards are held in an overlapping fan, dealt in one by one at the start of each game; the card you bid glides to the table.
- Red vs blue see-through scoreboard at the top with each player's picture and name (the per-player score panels are gone). "Black team" is now "Blue team".
- New sounds for winning and losing a hand, and for losing a game.
- Turn clock (vs bots and online): 10 seconds to bid, then a card is played for you. Tap Back within 20 seconds or you're removed for inactivity.

## 1.2
- **Languages:** English, العربية (Arabic, right-to-left), Español, Français and 中文. The app picks the phone's language on first visit; change it anytime from the globe button on the home screen.
- **Coins:** 3 characters (Fennec, Prof. Hoot, Bruno) and 2 card designs (Classic, Royal) are free; everything else is bought with coins in the shop. Players already using something from 1.1 keep it.
- **Daily gift:** free coins every day, growing over a 7-day streak (100 → 250). Missing a day starts the streak again.
- **Coins per game:** 10/15/20/30 vs Easy/Normal/Hard/Expert bots (3× for a win), 20 online (60 for a win), 50 + your score for the daily challenge, 50 per achievement, 100 for finishing the tutorial, 10 for pass-and-play.
- **Online:** if everyone joined a table by code, anyone can tap "Host this table" to start it. If two people tap at once, the first one keeps it. The app now explains why online play isn't available (for example, in a public link or an in-app browser).

## 1.1

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
