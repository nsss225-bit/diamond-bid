import Foundation

/// Each device sends one of these when a match forms. The earliest one wins:
/// that player hosts and their rules are used.
struct MatchProposal: Codable {
    var config: GameConfig
    var createdAt: Date
    var name: String
}

enum NetMessage: Codable {
    case proposal(MatchProposal)
    /// Host to player: the table as that player may see it.
    case state(GameState)
    /// Player to host.
    case bid(Bid)
    case ready
    case rematch
    /// Sent to everyone.
    case reaction(seat: Int, emoji: String)
}
