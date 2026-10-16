import XCTest
@testable import DiamondBid

/// Repeatable randomness for tests (SplitMix64).
struct SeededRNG: RandomNumberGenerator {
    var state: UInt64
    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

final class GameRulesTests: XCTestCase {
    private func humans(_ n: Int) -> [Seat] {
        (0..<n).map { Seat(name: "P\($0)", controller: .human(id: "p\($0)")) }
    }

    /// A table whose next prize is `prize`.
    private func table(_ config: GameConfig, prize: Int) -> GameState {
        var rng = SeededRNG(state: 1)
        var s = GameState.newMatch(config: config, seats: humans(config.seatCount), using: &rng)
        s.prizes[0] = prize
        return s
    }

    func testHighestCardWins() throws {
        var s = table(GameConfig(), prize: 9)
        try s.submit(Bid(card: 12), seat: 0)
        try s.submit(Bid(card: 4), seat: 1)
        let r = s.resolveRound()
        XCTAssertEqual(r.winners, [0])
        XCTAssertEqual(s.scores[0], Points(9))
        XCTAssertEqual(s.scores[1], .zero)
        XCTAssertFalse(s.hands[0].contains(12))
        XCTAssertEqual(s.hands[1].count, 12)
    }

    func testTieSplitsTheGem() throws {
        var s = table(GameConfig(), prize: 7)
        try s.submit(Bid(card: 9), seat: 0)
        try s.submit(Bid(card: 9), seat: 1)
        s.resolveRound()
        XCTAssertEqual(s.scores[0].text, "3\u{00BD}")
        XCTAssertEqual(s.scores[1].text, "3\u{00BD}")
    }

    func testThreeWaySplitIsExact() throws {
        var config = GameConfig()
        config.seatCount = 4
        var s = table(config, prize: 10)
        for (seat, card) in [13, 13, 13, 2].enumerated() { try s.submit(Bid(card: card), seat: seat) }
        s.resolveRound()
        XCTAssertEqual(s.scores[0].twelfths, 40)
        XCTAssertEqual(s.scores[0].text, "3\u{2153}")
        XCTAssertEqual(s.scores[3], .zero)
    }

    func testCancelRuleLetsNextBestUniqueCardWin() throws {
        var config = GameConfig()
        config.seatCount = 4
        config.tieRule = .cancel
        var s = table(config, prize: 10)
        for (seat, card) in [9, 9, 5, 3].enumerated() { try s.submit(Bid(card: card), seat: seat) }
        let r = s.resolveRound()
        XCTAssertEqual(r.winners, [2])
        XCTAssertEqual(r.cancelled, [0, 1])
        XCTAssertEqual(s.scores[2], Points(10))
    }

    func testCancelRuleWithEveryCardMatchedGivesNothing() throws {
        var config = GameConfig()
        config.tieRule = .cancel
        var s = table(config, prize: 6)
        try s.submit(Bid(card: 5), seat: 0)
        try s.submit(Bid(card: 5), seat: 1)
        let r = s.resolveRound()
        XCTAssertTrue(r.winners.isEmpty)
        XCTAssertEqual(s.scores, [.zero, .zero])
    }

    func testCurseGoesToLowestBid() throws {
        var config = GameConfig()
        config.cursedGems = true
        var s = table(config, prize: -2)
        try s.submit(Bid(card: 3), seat: 0)
        try s.submit(Bid(card: 8), seat: 1)
        s.resolveRound()
        XCTAssertEqual(s.scores[0], Points(-2))
        XCTAssertEqual(s.scores[0].text, "\u{2212}2")
        XCTAssertEqual(s.scores[1], .zero)
    }

    func testCursedDeckHasThirteenPrizes() {
        XCTAssertEqual(PrizeDeck.values(cursed: true).count, 13)
        XCTAssertEqual(PrizeDeck.values(cursed: false).count, 13)
    }

    func testDoubleTokenDoublesAndIsUsedUp() throws {
        var config = GameConfig()
        config.doubleToken = true
        var s = table(config, prize: 8)
        try s.submit(Bid(card: 10, double: true), seat: 0)
        try s.submit(Bid(card: 2), seat: 1)
        s.resolveRound()
        XCTAssertEqual(s.scores[0], Points(16))
        XCTAssertFalse(s.doubleAvailable[0])
        XCTAssertTrue(s.doubleAvailable[1])

        var rng = SeededRNG(state: 2)
        s.advance(using: &rng)
        XCTAssertThrowsError(try s.submit(Bid(card: 11, double: true), seat: 0))
    }

    func testDoubleIsRefusedWhenTheRuleIsOff() {
        var s = table(GameConfig(), prize: 5)
        XCTAssertThrowsError(try s.submit(Bid(card: 3, double: true), seat: 0))
    }

    func testCannotBidACardTwice() throws {
        var s = table(GameConfig(), prize: 5)
        try s.submit(Bid(card: 13), seat: 0)
        try s.submit(Bid(card: 1), seat: 1)
        s.resolveRound()
        var rng = SeededRNG(state: 3)
        s.advance(using: &rng)
        XCTAssertThrowsError(try s.submit(Bid(card: 13), seat: 0))
    }

    func testTeamsAddPartnerPoints() throws {
        var config = GameConfig()
        config.seatCount = 4
        config.teams = true
        var s = table(config, prize: 6)
        for (seat, card) in [13, 2, 3, 4].enumerated() { try s.submit(Bid(card: card), seat: seat) }
        s.resolveRound()
        XCTAssertEqual(s.sideScore(0), Points(6))
        XCTAssertEqual(s.sideScore(1), .zero)
        XCTAssertEqual(s.sideName(0), "Red team")
    }

    func testOtherPlayersBidsAreHidden() throws {
        var s = table(GameConfig(), prize: 5)
        try s.submit(Bid(card: 7), seat: 1)
        let seenBySeat0 = s.redacted(for: [0])
        XCTAssertNil(seenBySeat0.bids[1])
        XCTAssertTrue(seenBySeat0.submitted[1])
        XCTAssertEqual(s.redacted(for: [1]).bids[1], Bid(card: 7))
    }

    func testNewHostRestartsTheRoundsBidding() throws {
        var s = table(GameConfig(), prize: 5)
        try s.submit(Bid(card: 7), seat: 1)
        s.restartBidding()
        XCTAssertEqual(s.submitted, [false, false])
        XCTAssertEqual(s.bids, [nil, nil])
    }

    func testBestOfThreeEndsWhenASideWinsTwice() {
        var config = GameConfig()
        config.gamesToWin = 2
        var rng = SeededRNG(state: 4)
        var s = GameState.newMatch(config: config, seats: humans(2), using: &rng)

        /// Jump to the reveal of the last gem with seat 0 ahead, then finish the game.
        func seat0WinsAGame() {
            s.round = s.roundCount - 1
            s.phase = .reveal
            s.scores = [Points(10), Points(3)]
            s.advance(using: &rng)
        }

        seat0WinsAGame()
        XCTAssertEqual(s.phase, .gameOver)
        XCTAssertEqual(s.gameWins, [1, 0])
        XCTAssertEqual(s.lastGameWinners, [0])

        s.advance(using: &rng)
        XCTAssertEqual(s.gameNumber, 2)
        XCTAssertEqual(s.phase, .bidding)
        XCTAssertEqual(s.hands[0].count, 13)

        seat0WinsAGame()
        XCTAssertEqual(s.phase, .matchOver)
        XCTAssertEqual(s.matchWinner, 0)
    }

    func testDrawnGameAwardsNothing() {
        var rng = SeededRNG(state: 5)
        var s = GameState.newMatch(config: GameConfig(), seats: humans(2), using: &rng)
        s.round = s.roundCount - 1
        s.phase = .reveal
        s.scores = [Points(9), Points(9)]
        s.advance(using: &rng)
        XCTAssertEqual(s.phase, .gameOver)
        XCTAssertEqual(s.lastGameWinners, [])
        XCTAssertEqual(s.gameWins, [0, 0])
    }

    /// Plays whole matches with bots in every setup and checks the rules hold the whole way through.
    func testBotsFinishEveryKindOfMatch() throws {
        for seed in 1...20 {
            for level in BotLevel.allCases {
                var config = GameConfig()
                config.seatCount = seed % 2 == 0 ? 4 : 2
                config.teams = seed % 4 == 0
                config.tieRule = seed % 3 == 0 ? .cancel : .split
                config.cursedGems = seed % 5 < 2
                config.doubleToken = seed % 2 == 1
                config.gamesToWin = 2
                var rng = SeededRNG(state: UInt64(seed))
                let seats = (0..<config.seatCount).map { Seat(name: "Bot \($0)", controller: .bot(level)) }
                var s = GameState.newMatch(config: config, seats: seats, using: &rng)
                var steps = 0
                while s.phase != .matchOver {
                    steps += 1
                    XCTAssertLessThan(steps, 5_000, "Match never ended")
                    if steps >= 5_000 { break }
                    switch s.phase {
                    case .bidding:
                        for seat in s.seats.indices {
                            try s.submit(Bot.choose(state: s, seat: seat, level: level, using: &rng), seat: seat)
                        }
                        s.resolveRound()
                        if s.isLastRound { XCTAssertTrue(s.hands.allSatisfy(\.isEmpty)) }
                    case .reveal, .gameOver:
                        XCTAssertTrue(s.everyoneReady, "Bots should always be ready")
                        s.advance(using: &rng)
                    case .matchOver:
                        break
                    }
                }
                XCTAssertNotNil(s.matchWinner)
            }
        }
    }

    func testPointsText() {
        XCTAssertEqual(Points(twelfths: 6).text, "\u{00BD}")
        XCTAssertEqual(Points(twelfths: 7).text, "0.6")
        XCTAssertEqual(Points(twelfths: -30).text, "\u{2212}2\u{00BD}")
    }
}
