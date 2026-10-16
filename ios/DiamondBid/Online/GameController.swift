import Foundation

/// How a controller talks to the other phones in an online match.
protocol GameLink: AnyObject {
    func sendToHost(_ message: NetMessage)
    func broadcast(_ message: NetMessage)
    /// Host only: send every player their own view of the table.
    func publish(_ full: GameState)
    func leave()
}

struct Reaction: Identifiable, Equatable {
    let id = UUID()
    let seat: Int
    let emoji: String
}

/// Runs one table for the screen. One device is the authority (the host online, or this
/// phone offline): it holds the full state, applies every action and runs the bots.
/// Everyone else sends actions to the host and shows the state it sends back.
final class GameController: ObservableObject {
    private enum Action { case bid(Bid), ready, rematch }

    @Published private(set) var state: GameState
    /// Seats played on this phone: one, or several in pass and play.
    @Published private(set) var mySeats: [Int]
    /// In pass and play, the seat whose hand is showing.
    @Published private(set) var unlockedSeat: Int?
    @Published private(set) var reactions: [Reaction] = []
    @Published var notice: String?

    let isOnline: Bool
    private(set) var isAuthority: Bool
    var onMatchOver: ((_ won: Bool) -> Void)?

    private var full: GameState
    private var rng = SystemRandomNumberGenerator()
    private weak var link: GameLink?
    private var botWork: DispatchWorkItem?

    init(state: GameState, mySeats: [Int], isAuthority: Bool, link: GameLink? = nil) {
        self.full = state
        self.state = state.redacted(for: Set(mySeats))
        self.mySeats = mySeats
        self.isAuthority = isAuthority
        self.link = link
        self.isOnline = link != nil
        if mySeats.count == 1 { unlockedSeat = mySeats[0] }
    }

    func start() {
        if isAuthority { progress() }
    }

    // MARK: - What the screen shows

    /// The seat on this phone that still has to bid.
    var activeSeat: Int? {
        guard state.phase == .bidding else { return nil }
        return mySeats.first { !state.submitted[$0] }
    }

    /// Pass and play: hide the hand until the right person has the phone.
    var needsHandoff: Bool {
        guard let seat = activeSeat else { return false }
        return mySeats.count > 1 && unlockedSeat != seat
    }

    /// The seat drawn at the bottom of the screen as "you". Pass and play has none.
    var homeSeat: Int? { mySeats.count == 1 ? mySeats[0] : nil }

    /// Whose cards to show in the hand area.
    var handSeat: Int? {
        if let seat = activeSeat { return needsHandoff ? nil : seat }
        return homeSeat
    }

    var iAmReady: Bool { mySeats.allSatisfy { state.ready[$0] } }

    var waitingNames: [String] {
        let waiting: [Int]
        switch state.phase {
        case .bidding: waiting = state.seats.indices.filter { !state.submitted[$0] }
        case .reveal, .gameOver: waiting = state.seats.indices.filter { !state.ready[$0] }
        case .matchOver: waiting = []
        }
        return waiting.filter { !mySeats.contains($0) }.map { state.seats[$0].name }
    }

    var humanIDsInSeatOrder: [String] { state.seats.compactMap(\.humanID) }

    func seat(forHumanID id: String) -> Int? { state.seats.firstIndex { $0.humanID == id } }

    // MARK: - Player actions

    func unlock() { unlockedSeat = activeSeat }

    func placeBid(card: Int, double: Bool) {
        guard let seat = activeSeat else { return }
        let bid = Bid(card: card, double: double)
        if isAuthority {
            apply(.bid(bid), from: seat)
        } else {
            // Show it as placed now; the host's next update confirms it.
            state.bids[seat] = bid
            state.submitted[seat] = true
            link?.sendToHost(.bid(bid))
        }
    }

    func next() {
        for seat in mySeats {
            if isAuthority {
                apply(.ready, from: seat)
            } else {
                state.ready[seat] = true
                link?.sendToHost(.ready)
            }
        }
    }

    func rematch() {
        guard let seat = mySeats.first else { return }
        if isAuthority { apply(.rematch, from: seat) } else { link?.sendToHost(.rematch) }
    }

    func react(_ emoji: String) {
        guard let seat = mySeats.first else { return }
        show(Reaction(seat: seat, emoji: emoji))
        link?.broadcast(.reaction(seat: seat, emoji: emoji))
    }

    func leave() {
        botWork?.cancel()
        link?.leave()
    }

    // MARK: - Messages from other phones

    func receive(_ message: NetMessage, fromSeat seat: Int?) {
        switch message {
        case .state(let s):
            guard !isAuthority else { return }
            full = s
            setState(s)
        case .bid(let bid):
            if isAuthority, let seat { apply(.bid(bid), from: seat) }
        case .ready:
            if isAuthority, let seat { apply(.ready, from: seat) }
        case .rematch:
            if isAuthority, let seat { apply(.rematch, from: seat) }
        case .reaction(let reactor, let emoji):
            if state.seats.indices.contains(reactor) { show(Reaction(seat: reactor, emoji: emoji)) }
        case .proposal:
            break
        }
    }

    /// A player disconnected. The host gives their seat to a bot; everyone else just hears about it.
    func replaceWithBot(humanID: String) {
        guard let seat = (isAuthority ? full : state).seats.firstIndex(where: { $0.humanID == humanID }) else { return }
        notice = "\(state.seats[seat].name) left. A bot took their seat."
        guard isAuthority else { return }
        full.replaceWithBot(seat: seat)
        progress()
    }

    /// The host left and this phone is next in line to run the table.
    func becomeAuthority(droppedHumanID: String) {
        guard !isAuthority else { return }
        isAuthority = true
        full = state
        // Other players' bids were never sent to this phone, so the round's bidding starts over.
        full.restartBidding()
        replaceWithBot(humanID: droppedHumanID)
        notice = (notice ?? "") + " If you had bid this round, bid again."
    }

    // MARK: - Authority

    private func apply(_ action: Action, from seat: Int) {
        switch action {
        case .bid(let bid):
            do { try full.submit(bid, seat: seat) } catch { return }
        case .ready:
            full.markReady(seat: seat)
        case .rematch:
            guard full.phase == .matchOver else { return }
            full.rematch(using: &rng)
        }
        progress()
    }

    private func progress() {
        if full.phase == .bidding && full.allSubmitted {
            full.resolveRound()
        } else if (full.phase == .reveal || full.phase == .gameOver) && full.everyoneReady {
            full.advance(using: &rng)
        }
        setState(full.redacted(for: Set(mySeats)))
        link?.publish(full)
        scheduleBots()
    }

    private func scheduleBots() {
        botWork?.cancel()
        guard isAuthority, full.phase == .bidding,
              full.seats.indices.contains(where: { full.seats[$0].isBot && !full.submitted[$0] }) else { return }
        let work = DispatchWorkItem { [weak self] in self?.runBots() }
        botWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(Int.random(in: 700...1400)), execute: work)
    }

    private func runBots() {
        guard isAuthority, full.phase == .bidding else { return }
        for seat in full.seats.indices where !full.submitted[seat] {
            if case .bot(let level) = full.seats[seat].controller {
                let bid = Bot.choose(state: full, seat: seat, level: level, using: &rng)
                try? full.submit(bid, seat: seat)
            }
        }
        progress()
    }

    // MARK: - Helpers

    private func setState(_ new: GameState) {
        let wasOver = state.phase == .matchOver
        if mySeats.count > 1 && new.phase != .bidding { unlockedSeat = nil }
        state = new
        if !wasOver, let winner = new.matchWinner, let me = mySeats.first {
            onMatchOver?(new.config.side(of: me) == winner)
        }
    }

    private func show(_ reaction: Reaction) {
        reactions.append(reaction)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) { [weak self] in
            self?.reactions.removeAll { $0.id == reaction.id }
        }
    }
}
