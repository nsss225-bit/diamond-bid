import Foundation

enum TieRule: String, Codable, CaseIterable {
    /// Everyone tied for the best bid shares the prize equally.
    case split
    /// Tied cards knock each other out; the best remaining unique bid wins.
    case cancel
}

enum BotLevel: String, Codable, CaseIterable {
    case easy, normal, hard

    var title: String { rawValue.capitalized }
}

struct GameConfig: Codable, Equatable {
    var seatCount = 2
    var teams = false
    var tieRule = TieRule.split
    var cursedGems = false
    var doubleToken = false
    /// 1 = single game, 2 = best of 3.
    var gamesToWin = 1
    /// Used for any seat without a person in it.
    var botLevel = BotLevel.normal

    var usesTeams: Bool { teams && seatCount == 4 }
    var sideCount: Int { usesTeams ? 2 : seatCount }

    /// A side is a team in 2 vs 2, otherwise a single seat.
    func side(of seat: Int) -> Int { usesTeams ? seat % 2 : seat }
    func seats(onSide side: Int) -> [Int] { (0..<seatCount).filter { self.side(of: $0) == side } }

    /// Game Center only matches strangers who picked the same rules.
    var matchmakingGroup: Int {
        var g = seatCount
        g = g * 2 + (usesTeams ? 1 : 0)
        g = g * 2 + (tieRule == .cancel ? 1 : 0)
        g = g * 2 + (cursedGems ? 1 : 0)
        g = g * 2 + (doubleToken ? 1 : 0)
        g = g * 4 + gamesToWin
        return g
    }
}

struct Seat: Codable, Equatable {
    enum Controller: Codable, Equatable {
        case human(id: String)
        case bot(BotLevel)
    }

    var name: String
    var controller: Controller

    var isBot: Bool {
        if case .bot = controller { return true } else { return false }
    }

    var humanID: String? {
        if case .human(let id) = controller { return id } else { return nil }
    }
}
