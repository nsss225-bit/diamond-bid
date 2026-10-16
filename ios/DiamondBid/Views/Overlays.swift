import SwiftUI

/// Pass and play: covers the table until the next person has the phone.
struct HandoffView: View {
    let name: String
    let suit: Suit
    let prize: Int
    let onReveal: () -> Void

    var body: some View {
        ZStack {
            TableBackground()
            VStack(spacing: 16) {
                Text(suit.symbol)
                    .font(.system(size: 88, design: .serif))
                    .foregroundStyle(Theme.suitColorOnFelt(suit))
                Text("\(name), your bid").font(Theme.display(30))
                Text("Pass the phone to \(name). Everyone else, look away.\nThe \(PrizeDeck.name(prize)) is on the table.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.muted)
                Button("Show my hand", action: onReveal)
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.top, 6)
            }
            .padding(32)
        }
        .foregroundStyle(Theme.ink)
    }
}

/// End of a game or the whole match.
struct ResultsView: View {
    @ObservedObject var game: GameController
    let onExit: () -> Void

    private var s: GameState { game.state }

    private var standings: [Int] {
        (0..<s.config.sideCount).sorted { s.sideScore($0) > s.sideScore($1) }
    }

    var body: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            VStack(spacing: 18) {
                Image(systemName: s.phase == .matchOver ? "trophy.fill" : "diamond.fill")
                    .font(.system(size: 34))
                    .foregroundStyle(Theme.brass)
                Text(headline)
                    .font(Theme.display(26))
                    .multilineTextAlignment(.center)
                VStack(spacing: 8) {
                    ForEach(Array(standings.enumerated()), id: \.element) { place, side in
                        row(place: place, side: side)
                    }
                }
                buttons
            }
            .padding(24)
            .background(RoundedRectangle(cornerRadius: 24).fill(Theme.feltDeep))
            .overlay(RoundedRectangle(cornerRadius: 24).strokeBorder(Theme.brass.opacity(0.4), lineWidth: 1))
            .padding(20)
        }
        .foregroundStyle(Theme.ink)
    }

    private var headline: String {
        if let winner = s.matchWinner {
            return "\(s.sideName(winner)) \(verb(winner, "win")) the match!"
        }
        guard let winner = s.lastGameWinners.first else {
            return "It's a draw. Replay the game!"
        }
        return s.config.gamesToWin > 1
            ? "\(s.sideName(winner)) \(verb(winner, "take")) game \(s.gameNumber)"
            : "\(s.sideName(winner)) \(verb(winner, "win"))!"
    }

    private func verb(_ side: Int, _ base: String) -> String {
        s.sideName(side) == "You" ? base : base + "s"
    }

    private func row(place: Int, side: Int) -> some View {
        HStack(spacing: 12) {
            Text("\(place + 1)").font(Theme.display(18)).foregroundStyle(Theme.muted).frame(width: 20)
            if s.config.usesTeams {
                Circle().fill(Theme.teamColor(side)).frame(width: 8, height: 8)
            } else {
                let suit = Suit.forSeat(side, of: s.config.seatCount)
                Text(suit.symbol).foregroundStyle(Theme.suitColorOnFelt(suit))
            }
            Text(s.sideName(side)).font(.headline).lineLimit(1)
            Spacer(minLength: 8)
            Text(s.sideScore(side).text).font(Theme.display(20)).monospacedDigit()
            if s.config.gamesToWin > 1 {
                Text("\(s.gameWins[side]) won")
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
                    .frame(width: 46, alignment: .trailing)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 12).fill(place == 0 ? Theme.brass.opacity(0.18) : Theme.panel))
    }

    @ViewBuilder private var buttons: some View {
        HStack(spacing: 12) {
            Button("Home", action: onExit).buttonStyle(SecondaryButtonStyle())
            if s.phase == .matchOver {
                Button("Rematch") { game.rematch() }.buttonStyle(PrimaryButtonStyle())
            } else {
                Button(game.iAmReady ? "Waiting…" : "Next game") { game.next() }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(game.iAmReady)
            }
        }
        if game.iAmReady && !game.waitingNames.isEmpty {
            Text("Waiting for \(game.waitingNames.joined(separator: ", "))")
                .font(.caption)
                .foregroundStyle(Theme.muted)
        }
    }
}

/// Everything that is public: what each player still holds and which prizes are left.
struct CardsLeftView: View {
    let state: GameState
    @Environment(\.dismiss) private var dismiss

    private var upcoming: [Int] {
        Array(state.prizes.dropFirst(state.round + 1)).sorted(by: >)
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Prizes still to come") {
                    Text(upcoming.isEmpty ? "None. This is the last one." : upcoming.map(PrizeDeck.label).joined(separator: "  "))
                        .font(.system(.body, design: .monospaced))
                }
                Section("Cards in each hand") {
                    ForEach(state.seats.indices, id: \.self) { i in
                        let suit = Suit.forSeat(i, of: state.config.seatCount)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(suit.symbol) \(state.seats[i].name)").font(.headline)
                            Text(state.hands[i].map(Card.label).joined(separator: " "))
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Cards left")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .presentationDetents([.medium, .large])
    }
}

struct RulesView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("The game") {
                    Text("Every player holds one suit, A to K. A is 1, J is 11, Q is 12 and K is 13.")
                    Text("Each round a gem is turned over in the middle. Everyone bids one card face down.")
                    Text("All bids flip at once. The highest card takes the gem, worth its number in points. Bid cards are gone for good.")
                    Text("After 13 gems, the most points wins.")
                }
                Section("Ties") {
                    Text("Split: everyone tied for the best bid shares the gem equally.")
                    Text("Cancel out: matching cards knock each other out, and the best card left wins. If every card is matched, nobody gets the gem.")
                }
                Section("Extras") {
                    Text("Cursed gems: −1, −2 and −3 replace the 11, 12 and 13 gems. The lowest bid has to take a curse.")
                    Text("Double token: once per game, add it to your bid to double what you get that round. It doubles curses too.")
                    Text("2 vs 2: partners sit opposite and add their points together.")
                    Text("Best of 3: the first side to win two games takes the match. A drawn game is replayed.")
                }
            }
            .navigationTitle("How to play")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}
