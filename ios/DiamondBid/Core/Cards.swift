import Foundation

enum Suit: Int, Codable, CaseIterable {
    case hearts, clubs, diamonds, spades

    var symbol: String { ["\u{2665}\u{FE0E}", "\u{2663}\u{FE0E}", "\u{2666}\u{FE0E}", "\u{2660}\u{FE0E}"][rawValue] }
    var name: String { ["Hearts", "Clubs", "Diamonds", "Spades"][rawValue] }
    var isRed: Bool { self == .hearts || self == .diamonds }

    /// 2 players: Hearts vs Spades. 4 players: partners sit opposite,
    /// so seats 0 and 2 are the red team and seats 1 and 3 the black team.
    static func forSeat(_ seat: Int, of seatCount: Int) -> Suit {
        seatCount == 2 ? [.hearts, .spades][seat] : Suit(rawValue: seat)!
    }
}

/// Bidding cards: every player holds A(1) to K(13) of their suit.
enum Card {
    static let values = Array(1...13)

    static func label(_ value: Int) -> String {
        switch value {
        case 1: return "A"
        case 11: return "J"
        case 12: return "Q"
        case 13: return "K"
        default: return "\(value)"
        }
    }
}

/// The prizes in the middle of the table. There are always 13, one per round.
enum PrizeDeck {
    static func values(cursed: Bool) -> [Int] {
        cursed ? Array(1...10) + [-1, -2, -3] : Array(1...13)
    }

    static func label(_ value: Int) -> String {
        value < 0 ? "\u{2212}\(-value)" : "\(value)"
    }

    static func name(_ value: Int) -> String {
        value < 0 ? "\(label(value)) curse" : "\(value) gem"
    }
}
