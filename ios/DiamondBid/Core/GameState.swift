import Foundation

struct Bid: Codable, Equatable {
    var card: Int
    var double = false
}

struct RoundResult: Codable, Equatable {
    var prize: Int
    var bids: [Bid]
    /// Seats that receive (a share of) the prize.
    var winners: [Int]
    /// Seats whose cards knocked each other out (cancel rule only).
    var cancelled: [Int]
    /// Points each seat got this round, after doubling.
    var awards: [Points]
}

enum Phase: String, Codable {
    case bidding, reveal, gameOver, matchOver
}

enum GameError: Error {
    case wrongPhase, alreadyBid, cardNotInHand, noDoubleLeft, badSeat
}

/// The whole table. Pure data and rules, no UI or networking, so it can be tested on its own.
struct GameState: Codable, Equatable {
    var config: GameConfig
    var seats: [Seat]
    var gameNumber = 1
    var prizes: [Int] = []
    var round = 0
    var hands: [[Int]] = []
    var doubleAvailable: [Bool] = []
    /// Public: who has locked in a bid this round.
    var submitted: [Bool] = []
    /// Secret until the reveal. Other players receive nil here (see `redacted(for:)`).
    var bids: [Bid?] = []
    /// Who has tapped Next after a reveal. Bots are always ready.
    var ready: [Bool] = []
    var history: [RoundResult] = []
    var scores: [Points] = []
    /// Games won per side in this match.
    var gameWins: [Int] = []
    /// Sides that won the last finished game. Empty means it was a draw.
    var lastGameWinners: [Int] = []
    var phase = Phase.bidding
    var version = 0
}

extension GameState {
    static func newMatch<R: RandomNumberGenerator>(config: GameConfig, seats: [Seat], using rng: inout R) -> GameState {
        precondition(seats.count == config.seatCount, "Need exactly one seat per player")
        var state = GameState(config: config, seats: seats)
        state.gameWins = Array(repeating: 0, count: config.sideCount)
        state.deal(using: &rng)
        return state
    }

    var currentPrize: Int { prizes[min(round, prizes.count - 1)] }
    var roundCount: Int { prizes.count }
    var isLastRound: Bool { round >= prizes.count - 1 }
    var allSubmitted: Bool { !submitted.contains(false) }
    var everyoneReady: Bool { !ready.contains(false) }

    func sideScore(_ side: Int) -> Points {
        config.seats(onSide: side).reduce(Points.zero) { $0 + scores[$1] }
    }

    func sideName(_ side: Int) -> String {
        if config.usesTeams { return side == 0 ? "Red team" : "Black team" }
        return seats[side].name
    }

    // MARK: - Rules

    mutating func deal<R: RandomNumberGenerator>(using rng: inout R) {
        let n = seats.count
        prizes = PrizeDeck.values(cursed: config.cursedGems).shuffled(using: &rng)
        round = 0
        hands = Array(repeating: Card.values, count: n)
        doubleAvailable = Array(repeating: config.doubleToken, count: n)
        submitted = Array(repeating: false, count: n)
        bids = Array(repeating: nil, count: n)
        ready = seats.map(\.isBot)
        history = []
        scores = Array(repeating: .zero, count: n)
        phase = .bidding
        version += 1
    }

    mutating func submit(_ bid: Bid, seat: Int) throws {
        guard seats.indices.contains(seat) else { throw GameError.badSeat }
        guard phase == .bidding else { throw GameError.wrongPhase }
        guard !submitted[seat] else { throw GameError.alreadyBid }
        guard hands[seat].contains(bid.card) else { throw GameError.cardNotInHand }
        if bid.double && !doubleAvailable[seat] { throw GameError.noDoubleLeft }
        bids[seat] = bid
        submitted[seat] = true
        version += 1
    }

    /// Who takes the prize. Positive prizes go to the highest card, curses to the lowest.
    static func winners(prize: Int, cards: [Int], tieRule: TieRule) -> (winners: [Int], cancelled: [Int]) {
        var candidates = Array(cards.indices)
        var cancelled: [Int] = []
        if tieRule == .cancel {
            var counts: [Int: Int] = [:]
            for card in cards { counts[card, default: 0] += 1 }
            cancelled = candidates.filter { counts[cards[$0]]! > 1 }
            candidates = candidates.filter { counts[cards[$0]]! == 1 }
        }
        let values = candidates.map { cards[$0] }
        guard let target = prize >= 0 ? values.max() : values.min() else { return ([], cancelled) }
        return (candidates.filter { cards[$0] == target }, cancelled)
    }

    @discardableResult
    mutating func resolveRound() -> RoundResult {
        precondition(phase == .bidding && allSubmitted, "Every seat must bid before the reveal")
        let placed = bids.map { $0! }
        let prize = currentPrize
        let (winners, cancelled) = Self.winners(prize: prize, cards: placed.map(\.card), tieRule: config.tieRule)

        var awards = Array(repeating: Points.zero, count: seats.count)
        if !winners.isEmpty {
            let share = Points(prize).divided(by: winners.count)
            for w in winners { awards[w] = placed[w].double ? share * 2 : share }
        }
        for i in seats.indices {
            hands[i].removeAll { $0 == placed[i].card }
            if placed[i].double { doubleAvailable[i] = false }
            scores[i] += awards[i]
        }

        let result = RoundResult(prize: prize, bids: placed, winners: winners, cancelled: cancelled, awards: awards)
        history.append(result)
        ready = seats.map(\.isBot)
        phase = .reveal
        version += 1
        return result
    }

    mutating func markReady(seat: Int) {
        guard phase == .reveal || phase == .gameOver, ready.indices.contains(seat) else { return }
        ready[seat] = true
        version += 1
    }

    /// Moves on from a reveal (next round or end of game) or from a finished game (deal the next one).
    mutating func advance<R: RandomNumberGenerator>(using rng: inout R) {
        switch phase {
        case .reveal:
            if isLastRound {
                finishGame()
            } else {
                round += 1
                submitted = Array(repeating: false, count: seats.count)
                bids = Array(repeating: nil, count: seats.count)
                phase = .bidding
            }
        case .gameOver:
            gameNumber += 1
            deal(using: &rng)
        case .bidding, .matchOver:
            return
        }
        ready = seats.map(\.isBot)
        version += 1
    }

    private mutating func finishGame() {
        let sideScores = (0..<config.sideCount).map { sideScore($0) }
        let best = sideScores.max()!
        let top = sideScores.indices.filter { sideScores[$0] == best }
        // A draw awards nothing and the game is replayed.
        lastGameWinners = top.count == 1 ? top : []
        if let winner = lastGameWinners.first { gameWins[winner] += 1 }
        phase = gameWins.contains { $0 >= config.gamesToWin } ? .matchOver : .gameOver
    }

    mutating func rematch<R: RandomNumberGenerator>(using rng: inout R) {
        gameWins = Array(repeating: 0, count: config.sideCount)
        lastGameWinners = []
        gameNumber = 1
        deal(using: &rng)
    }

    var matchWinner: Int? {
        phase == .matchOver ? gameWins.firstIndex { $0 >= config.gamesToWin } : nil
    }

    // MARK: - Players coming and going

    mutating func replaceWithBot(seat: Int) {
        seats[seat] = Seat(name: seats[seat].name + " (bot)", controller: .bot(config.botLevel))
        ready[seat] = true
        version += 1
    }

    /// Used when a new host takes over mid-round: bids it never saw are thrown out and re-made.
    mutating func restartBidding() {
        guard phase == .bidding else { return }
        submitted = Array(repeating: false, count: seats.count)
        bids = Array(repeating: nil, count: seats.count)
        version += 1
    }

    /// The copy a given player may see: other players' secret bids are removed while bidding is open.
    func redacted(for viewers: Set<Int>) -> GameState {
        guard phase == .bidding else { return self }
        var copy = self
        for i in copy.bids.indices where !viewers.contains(i) { copy.bids[i] = nil }
        return copy
    }

    // MARK: - Text

    func summary(of r: RoundResult) -> String {
        let prize = PrizeDeck.name(r.prize)
        var parts: [String] = []
        if !r.cancelled.isEmpty {
            let values = Set(r.cancelled.map { r.bids[$0].card }).sorted().map(Card.label)
            parts.append("\(values.joined(separator: " and ")) cancelled out.")
        }
        if r.winners.isEmpty {
            parts.append("Nobody takes the \(prize).")
        } else if r.winners.count == 1 {
            let w = r.winners[0]
            let name = seats[w].name
            let you = name == "You"
            let card = Card.label(r.bids[w].card)
            if r.prize >= 0 {
                parts.append("\(name) \(you ? "win" : "wins") the \(prize) with \(card)")
            } else {
                parts.append("\(name) bid lowest (\(card)) and \(you ? "take" : "takes") the \(prize)")
            }
            if r.bids[w].double { parts[parts.count - 1] += ", doubled to \(r.awards[w].text)" }
            parts[parts.count - 1] += "."
        } else {
            let names = r.winners.map { seats[$0].name }.joined(separator: " and ")
            let share = Points(r.prize).divided(by: r.winners.count)
            parts.append("Tie at \(Card.label(r.bids[r.winners[0]].card)). \(names) split the \(prize), \(share.text) each.")
        }
        return parts.joined(separator: " ")
    }

}
