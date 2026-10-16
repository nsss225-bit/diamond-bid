import SwiftUI

struct GameView: View {
    @ObservedObject var game: GameController
    let onExit: () -> Void

    @State private var selected: Int?
    @State private var useDouble = false
    @State private var confirmQuit = false
    @State private var showCardsLeft = false

    private var s: GameState { game.state }
    private let reactionChoices = ["👏", "😂", "😮", "😤", "🔥"]

    var body: some View {
        ZStack {
            TableBackground()
            VStack(spacing: 12) {
                topBar
                seatTiles
                Spacer(minLength: 4)
                centerTable
                Spacer(minLength: 4)
                statusPanel
                handArea
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            reactionLayer

            if game.needsHandoff, let seat = game.activeSeat {
                HandoffView(name: s.seats[seat].name,
                            suit: Suit.forSeat(seat, of: s.config.seatCount),
                            prize: s.currentPrize) { game.unlock() }
                    .transition(.opacity)
            }
            if s.phase == .gameOver || s.phase == .matchOver {
                ResultsView(game: game, onExit: onExit)
                    .transition(.opacity)
            }
        }
        .foregroundStyle(Theme.ink)
        .animation(.easeInOut(duration: 0.25), value: s.phase)
        .animation(.easeInOut(duration: 0.25), value: game.needsHandoff)
        .onChange(of: s.round) { _ in clearSelection() }
        .onChange(of: game.activeSeat) { _ in clearSelection() }
        .confirmationDialog("Leave this game?", isPresented: $confirmQuit, titleVisibility: .visible) {
            Button("Leave game", role: .destructive, action: onExit)
        } message: {
            Text(game.isOnline ? "The others keep playing with a bot in your seat." : "This game will end.")
        }
        .sheet(isPresented: $showCardsLeft) { CardsLeftView(state: s) }
        .alert("Heads up", isPresented: Binding(get: { game.notice != nil }, set: { if !$0 { game.notice = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(game.notice ?? "")
        }
    }

    private func clearSelection() {
        selected = nil
        useDouble = false
    }

    // MARK: - Top

    private var topBar: some View {
        HStack {
            Button { confirmQuit = true } label: { Image(systemName: "xmark") }
                .buttonStyle(IconButtonStyle())
                .accessibilityLabel("Leave game")
            Spacer()
            VStack(spacing: 2) {
                Text("Gem \(min(s.round + 1, s.roundCount)) of \(s.roundCount)").font(Theme.display(18))
                if s.config.gamesToWin > 1 {
                    Text("Game \(s.gameNumber) · first to \(s.config.gamesToWin) wins")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
            }
            Spacer()
            Button { showCardsLeft = true } label: { Image(systemName: "rectangle.stack") }
                .buttonStyle(IconButtonStyle())
                .accessibilityLabel("Cards left")
        }
    }

    private var tileSeats: [Int] { s.seats.indices.filter { $0 != game.homeSeat } }

    private var seatTiles: some View {
        VStack(spacing: 8) {
            if s.config.usesTeams { TeamScoreBar(state: s) }
            let columns = tileSeats.count == 4 ? 2 : max(tileSeats.count, 1)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: columns), spacing: 8) {
                ForEach(tileSeats, id: \.self) { seat in
                    SeatTile(state: s, seat: seat)
                }
            }
        }
    }

    // MARK: - Middle

    private var centerTable: some View {
        HStack(alignment: .center, spacing: 28) {
            VStack(spacing: 8) {
                Text(s.currentPrize < 0 ? "CURSED" : "UP FOR GRABS")
                    .font(.caption2.weight(.bold))
                    .tracking(1.5)
                    .foregroundStyle(s.currentPrize < 0 ? Theme.curseText : Theme.brass)
                PlayingCard(face: .prize(s.currentPrize), width: 88)
                    .id(s.round)
                    .transition(.scale.combined(with: .opacity))
                Text(s.currentPrize < 0 ? "Lowest bid takes it" : "Highest bid wins")
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }
            if let home = game.homeSeat { homeSlot(home) }
        }
    }

    private func homeSlot(_ seat: Int) -> some View {
        let suit = Suit.forSeat(seat, of: s.config.seatCount)
        let result = s.phase == .reveal ? s.history.last : nil
        return VStack(spacing: 8) {
            Text("YOUR BID")
                .font(.caption2.weight(.bold))
                .tracking(1.5)
                .foregroundStyle(Theme.muted)
            ZStack {
                if let result {
                    PlayingCard(face: .suit(suit, result.bids[seat].card), width: 88)
                        .transition(.scale.combined(with: .opacity))
                } else if s.submitted[seat] {
                    PlayingCard(face: .back, width: 88)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                } else {
                    CardSlot(width: 88, label: "Pick a card")
                }
            }
            .overlay(alignment: .topTrailing) {
                if let bid = s.bids[seat], bid.double { DoubleBadge().offset(x: 8, y: -8) }
            }
            AwardLabel(result: result, seat: seat)
                .frame(height: 16)
        }
        .animation(.spring(response: 0.35), value: s.submitted[seat])
    }

    // MARK: - Status

    private var statusPanel: some View {
        VStack(spacing: 10) {
            Text(statusText)
                .font(.callout)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
            if s.phase == .reveal {
                HStack(spacing: 10) {
                    if game.isOnline {
                        ForEach(reactionChoices, id: \.self) { emoji in
                            Button(emoji) { game.react(emoji) }
                                .font(.title3)
                                .buttonStyle(.plain)
                        }
                        Spacer(minLength: 0)
                    }
                    Button(game.iAmReady ? "Waiting…" : (s.isLastRound ? "See results" : "Next gem")) { game.next() }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(game.iAmReady)
                }
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.panel))
    }

    private var statusText: String {
        switch s.phase {
        case .bidding:
            if game.activeSeat != nil && !game.needsHandoff {
                if let card = selected {
                    return "Bid \(Card.label(card)) on the \(PrizeDeck.name(s.currentPrize))?"
                }
                return s.currentPrize < 0
                    ? "Pick a card. Don't be the lowest, or you take the \(PrizeDeck.name(s.currentPrize))."
                    : "Pick a card to bid on the \(PrizeDeck.name(s.currentPrize))."
            }
            let names = game.waitingNames
            return names.isEmpty ? "Revealing…" : "Waiting for \(names.joined(separator: ", "))…"
        case .reveal:
            guard let last = s.history.last else { return "" }
            let summary = s.summary(of: last)
            let waiting = game.iAmReady ? game.waitingNames : []
            return waiting.isEmpty ? summary : summary + "\nWaiting for \(waiting.joined(separator: ", "))."
        case .gameOver, .matchOver:
            return ""
        }
    }

    // MARK: - Hand

    @ViewBuilder private var handArea: some View {
        if let seat = game.handSeat {
            let suit = Suit.forSeat(seat, of: s.config.seatCount)
            let canBid = game.activeSeat == seat && !game.needsHandoff
            VStack(spacing: 10) {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 8) {
                    ForEach(s.hands[seat], id: \.self) { value in
                        Button {
                            selected = selected == value ? nil : value
                        } label: {
                            PlayingCard(face: .suit(suit, value), width: 42)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 5)
                                        .strokeBorder(Theme.brass, lineWidth: selected == value ? 3 : 0)
                                )
                                .offset(y: selected == value ? -8 : 0)
                        }
                        .buttonStyle(.plain)
                        .disabled(!canBid)
                        .opacity(isPending(value, seat: seat) ? 0.25 : (canBid ? 1 : 0.7))
                    }
                }
                .padding(.top, 8)
                if canBid {
                    HStack(spacing: 10) {
                        if s.config.doubleToken && s.doubleAvailable[seat] {
                            Toggle(isOn: $useDouble) {
                                Label("Double", systemImage: "multiply.circle")
                            }
                            .toggleStyle(.button)
                            .tint(Theme.brass)
                        }
                        Button("Place bid face down") {
                            guard let card = selected else { return }
                            game.placeBid(card: card, double: useDouble)
                            clearSelection()
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(selected == nil)
                    }
                }
            }
            .animation(.spring(response: 0.25), value: selected)
        }
    }

    /// A card already bid this round stays in the hand until the reveal, dimmed.
    private func isPending(_ value: Int, seat: Int) -> Bool {
        s.phase == .bidding && s.bids[seat]?.card == value
    }

    // MARK: - Reactions

    private var reactionLayer: some View {
        VStack(spacing: 6) {
            ForEach(game.reactions) { reaction in
                Text("\(s.seats[reaction.seat].name)  \(reaction.emoji)")
                    .font(.headline)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(Capsule().fill(Color.black.opacity(0.6)))
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
            Spacer()
        }
        .padding(.top, 60)
        .animation(.spring(), value: game.reactions)
        .allowsHitTesting(false)
    }
}

// MARK: - Pieces

struct SeatTile: View {
    let state: GameState
    let seat: Int

    private var suit: Suit { Suit.forSeat(seat, of: state.config.seatCount) }
    private var result: RoundResult? { state.phase == .reveal ? state.history.last : nil }
    private var isWinner: Bool { result?.winners.contains(seat) ?? false }

    var body: some View {
        VStack(spacing: 5) {
            HStack(spacing: 4) {
                Text(suit.symbol).foregroundStyle(Theme.suitColorOnFelt(suit))
                Text(state.seats[seat].name).lineLimit(1).minimumScaleFactor(0.7)
                if state.seats[seat].isBot {
                    Image(systemName: "cpu").font(.caption2).foregroundStyle(Theme.muted)
                }
            }
            .font(.subheadline.weight(.semibold))
            HStack(alignment: .center, spacing: 10) {
                bidCard
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.scores[seat].text)
                        .font(Theme.display(22))
                        .monospacedDigit()
                    AwardLabel(result: result, seat: seat)
                }
            }
            HStack(spacing: 6) {
                Text("\(state.hands[seat].count) cards")
                if state.config.doubleToken {
                    Image(systemName: "multiply.circle.fill")
                        .foregroundStyle(state.doubleAvailable[seat] ? Theme.brass : Theme.muted.opacity(0.3))
                        .accessibilityLabel(state.doubleAvailable[seat] ? "Double token ready" : "Double token used")
                }
            }
            .font(.caption)
            .foregroundStyle(Theme.muted)
        }
        .padding(10)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.panel))
        .overlay(alignment: .top) {
            if state.config.usesTeams {
                Capsule().fill(Theme.teamColor(state.config.side(of: seat))).frame(width: 28, height: 3).padding(.top, 4)
            }
        }
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(isWinner ? Theme.brass : .clear, lineWidth: 2))
        .animation(.spring(response: 0.35), value: state.submitted[seat])
        .animation(.spring(response: 0.35), value: state.phase)
    }

    @ViewBuilder private var bidCard: some View {
        ZStack {
            if let result {
                PlayingCard(face: .suit(suit, result.bids[seat].card), width: 34)
                    .opacity(result.cancelled.contains(seat) ? 0.4 : 1)
                    .overlay {
                        if result.cancelled.contains(seat) {
                            Image(systemName: "xmark").font(.headline.weight(.bold)).foregroundStyle(Theme.red)
                        }
                    }
                    .transition(.scale.combined(with: .opacity))
            } else if state.phase == .bidding && state.submitted[seat] {
                PlayingCard(face: .back, width: 34)
                    .transition(.move(edge: .top).combined(with: .opacity))
            } else {
                CardSlot(width: 34, label: state.phase == .bidding ? "…" : "")
            }
        }
        .overlay(alignment: .topTrailing) {
            if let result, result.bids[seat].double { DoubleBadge().scaleEffect(0.8).offset(x: 8, y: -8) }
        }
    }
}

struct AwardLabel: View {
    let result: RoundResult?
    let seat: Int

    var body: some View {
        if let result, result.awards[seat] != .zero {
            let award = result.awards[seat]
            Text((award > .zero ? "+" : "") + award.text)
                .font(.caption.weight(.bold))
                .monospacedDigit()
                .foregroundStyle(award > .zero ? Theme.brass : Theme.curseText)
        } else {
            Text(" ").font(.caption)
        }
    }
}

struct DoubleBadge: View {
    var body: some View {
        Text("×2")
            .font(.caption2.weight(.heavy))
            .foregroundStyle(Theme.feltDeep)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(Capsule().fill(Theme.brass))
    }
}

struct TeamScoreBar: View {
    let state: GameState

    var body: some View {
        HStack {
            team(0)
            Spacer()
            Text("vs").font(.caption).foregroundStyle(Theme.muted)
            Spacer()
            team(1)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.panel))
    }

    private func team(_ side: Int) -> some View {
        HStack(spacing: 8) {
            Circle().fill(Theme.teamColor(side)).frame(width: 8, height: 8)
            Text(state.sideName(side)).font(.subheadline.weight(.semibold))
            Text(state.sideScore(side).text).font(Theme.display(20)).monospacedDigit()
        }
    }
}
