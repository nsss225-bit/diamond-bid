# Diamond Bid for iPhone

A SwiftUI card game for 2 or 4 players. Play online with friends through Game Center, against bots, or pass one phone around.

## What's in the app

- **Play with friends:** Game Center live matches for 2 to 4 people. Invite friends through Apple's invite screen, or get matched with strangers who picked the same rules. Empty seats are filled with bots.
- **Play vs bots:** Easy, Normal or Hard bots.
- **Pass and play:** 2 to 4 people on one phone. A cover screen hides each hand between turns.
- **4 players:** free-for-all, or 2 vs 2 with partners sitting opposite (Hearts and Diamonds against Clubs and Spades).
- **Rule options:**
  - Ties: split the gem, or cancel out (matching cards knock each other out).
  - Cursed gems: −1, −2 and −3 prizes that the lowest bid has to take.
  - Double token: once per game, double what you get in one round.
  - Best of 3 matches.
- **Extras:** emoji reactions in online games, a friends leaderboard for online match wins, and a "cards left" sheet showing everything that's public.

## Build it

You need a Mac with Xcode 15 or later.

1. Install XcodeGen and generate the project:
   ```sh
   brew install xcodegen
   cd ios
   xcodegen
   open DiamondBid.xcodeproj
   ```
2. In Xcode, select the **DiamondBid** target, then **Signing & Capabilities**:
   - Choose your Team.
   - Change the bundle identifier from `com.example.diamondbid` to your own, for example `com.yourname.diamondbid`. Also change it in `project.yml` so it survives the next `xcodegen`.
   - Check that the **Game Center** capability is listed. It comes from `DiamondBid.entitlements`.
3. Press **⌘U** to run the rule tests, and **⌘R** to run the app.

Bots and pass and play work right away, including in the Simulator.

## Set up Game Center (needed for online play)

Online play needs an Apple Developer Program membership ($99/year).

1. In [App Store Connect](https://appstoreconnect.apple.com), create an app record with your bundle ID.
2. Open the app's **Services > Game Center** page (in older layouts it's under Features) and turn Game Center on.
3. Add a **Classic leaderboard**:
   - Leaderboard ID: `diamondbid.matchwins`. It must match `GameCenterManager.leaderboardID`.
   - Score format: Integer. Sort: High to Low. Score submission: Best score.
4. Testing online play takes two real iPhones signed in to Game Center with different Apple accounts. You can add sandbox testers under **Users and Access > Sandbox**. On each phone, go to Settings > Game Center and sign in.

## Get it to your friends

- **TestFlight (recommended):** In Xcode, choose **Product > Archive**, then **Distribute App > App Store Connect**. In App Store Connect, open **TestFlight** and add friends as external testers by email. They install the TestFlight app and get the game from there. External testing needs a quick Beta App Review first.
- **App Store:** submit the same build for review once you're happy with it.

## How online play works

- When a match forms, every phone shares its rules and the time it started looking. The phone that started first becomes the **host**, and its rules are used. For an invite, that's always the person who sent it.
- The host keeps the full table, runs the bots, and decides each round. Every other phone sends its bid to the host only. The host sends each player a copy of the table with the other players' pending bids removed, so nobody can see a bid early.
- If a player leaves, a bot takes their seat. If the host leaves, the next player in seat order becomes host. Bids already placed in that round can't be recovered, so everyone bids that round again.

## Code layout

| Folder | What's in it |
| --- | --- |
| `DiamondBid/Core` | The rules, with no UI or networking: `GameState` (dealing, bidding, ties, curses, doubles, matches), `Bot`, `Points`. Points are kept in twelfths, so 2-, 3- and 4-way splits stay exact. |
| `DiamondBid/Online` | `GameController` runs a table for the screen, offline or online. `OnlineSession` handles the Game Center match, host choice and messages. `GameCenterManager` handles sign-in, invites and the leaderboard. |
| `DiamondBid/Views` | SwiftUI screens: home, setup, table, hand-off, results, rules. |
| `DiamondBidTests` | Unit tests for the rules, plus hundreds of full bot matches across every rule combination. |

## Known limits

- The host phone holds every bid in memory until the reveal. Normal players can't see them, but a modified app on the host phone could. A server would be needed to close that gap.
- Online play is live: everyone needs to have the app open during the match. Game Center's turn-based mode could add "play whenever" matches later.
