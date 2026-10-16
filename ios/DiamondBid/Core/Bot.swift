import Foundation

/// Computer players. A bot only uses public information: the cards every seat still holds
/// and the prizes still to come. It never reads other players' bids.
enum Bot {
    static func choose<R: RandomNumberGenerator>(state: GameState, seat: Int, level: BotLevel, using rng: inout R) -> Bid {
        let hand = state.hands[seat].sorted()
        let prize = state.currentPrize
        let canDouble = state.doubleAvailable[seat]
        func card(at i: Int) -> Int { hand[max(0, min(hand.count - 1, i))] }
        func index(_ q: Double) -> Int { Int((q * Double(hand.count - 1)).rounded()) }

        // Last card: nothing to decide, and an unused double is free to spend.
        if hand.count == 1 { return Bid(card: hand[0], double: canDouble && prize > 0) }

        let mySide = state.config.side(of: seat)
        let rivals = state.seats.indices.filter { state.config.side(of: $0) != mySide }
        let positivesLeft = state.prizes[state.round...].filter { $0 > 0 }
        let q = quantile(prize, in: positivesLeft)

        switch level {
        case .easy:
            let dbl = canDouble && prize >= 8 && Double.random(in: 0..<1, using: &rng) < 0.3
            return Bid(card: hand.randomElement(using: &rng)!, double: dbl)

        case .normal:
            if prize < 0 {
                // Stay out of the bottom without spending a big card.
                let i = index(0.3 + 0.1 * Double(-prize)) + Int.random(in: -1...1, using: &rng)
                return Bid(card: card(at: i), double: false)
            }
            let i = index(q) + Int.random(in: -1...1, using: &rng)
            let dbl = canDouble && prize >= 9 && q >= 0.8 && Bool.random(using: &rng)
            return Bid(card: card(at: i), double: dbl)

        case .hard:
            let rivalHands = rivals.map { state.hands[$0].sorted() }
            if prize < 0 {
                // Safe for certain if some rival only has cards below ours.
                let lowestRivalMax = rivalHands.map { $0.last! }.min()!
                if let safe = hand.first(where: { $0 > lowestRivalMax }),
                   let i = hand.firstIndex(of: safe), i <= hand.count / 2 {
                    return Bid(card: safe, double: false)
                }
                return Bid(card: card(at: index(0.4) + Int.random(in: -1...1, using: &rng)), double: false)
            }
            let rivalMax = rivalHands.map { $0.last! }.max()!
            if q >= 0.7, let sure = hand.first(where: { $0 > rivalMax }) {
                // Cheapest card that cannot lose.
                return Bid(card: sure, double: canDouble && q >= 0.85)
            }
            if q <= 0.25 { return Bid(card: hand[0], double: false) }

            // Guess what the strongest rival plays for a prize this good, and try to just beat it.
            let guess = rivalHands.map { h in h[Int((q * Double(h.count - 1)).rounded())] }.max()!
            var i = index(q)
            if let over = hand.first(where: { $0 > guess }), over - guess <= 2, let oi = hand.firstIndex(of: over) {
                i = oi
            }
            if Double.random(in: 0..<1, using: &rng) < 0.2 { i += Bool.random(using: &rng) ? 1 : -1 }
            return Bid(card: card(at: i), double: canDouble && q >= 0.9 && hand.count <= 6)
        }
    }

    /// Where a prize ranks among the positive prizes left: 0 = the worst, 1 = the best.
    static func quantile(_ value: Int, in values: [Int]) -> Double {
        let sorted = values.sorted()
        guard sorted.count > 1, let i = sorted.firstIndex(of: value) else { return value > 0 ? 1 : 0 }
        return Double(i) / Double(sorted.count - 1)
    }
}
