import GameKit
import SwiftUI

enum SetupKind: String, Identifiable {
    case online, bots, passAndPlay
    var id: String { rawValue }
}

struct Stats: Codable {
    var botMatches = 0
    var botWins = 0
    var onlineWins = 0

    static func load() -> Stats {
        guard let data = UserDefaults.standard.data(forKey: "stats"),
              let stats = try? JSONDecoder().decode(Stats.self, from: data) else { return Stats() }
        return stats
    }

    func save() {
        if let data = try? JSONEncoder().encode(self) { UserDefaults.standard.set(data, forKey: "stats") }
    }
}

final class AppModel: ObservableObject {
    @Published var game: GameController?
    @Published var setup: SetupKind?
    @Published var connecting = false
    @Published var alert: String?
    @Published var config: GameConfig { didSet { saveConfig() } }
    /// Pass and play: how many people share this phone. The other seats are bots.
    @Published var localPlayers = 2
    @Published private(set) var stats = Stats.load() { didSet { stats.save() } }

    let gameCenter = GameCenterManager()
    private var session: OnlineSession?

    init() {
        if let data = UserDefaults.standard.data(forKey: "config"),
           let saved = try? JSONDecoder().decode(GameConfig.self, from: data) {
            config = saved
        } else {
            config = GameConfig()
        }
        gameCenter.onMatch = { [weak self] match, config, createdAt in
            self?.joined(match, config: config, createdAt: createdAt)
        }
        gameCenter.onError = { [weak self] text in self?.alert = text }
    }

    func start(_ kind: SetupKind) {
        setup = nil
        if kind == .online {
            // Let the setup sheet finish closing before Game Center presents its screen.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [self] in
                gameCenter.findMatch(config: config)
            }
        } else {
            startLocal(kind)
        }
    }

    private func startLocal(_ kind: SetupKind) {
        let n = config.seatCount
        let people = kind == .bots ? 1 : min(localPlayers, n)
        let seats: [Seat] = (0..<n).map { i in
            let suit = Suit.forSeat(i, of: n)
            if i < people {
                return Seat(name: kind == .bots ? "You" : suit.name, controller: .human(id: "local-\(i)"))
            }
            return Seat(name: "\(suit.name) bot", controller: .bot(config.botLevel))
        }
        var rng = SystemRandomNumberGenerator()
        let state = GameState.newMatch(config: config, seats: seats, using: &rng)
        let controller = GameController(state: state, mySeats: Array(0..<people), isAuthority: true)
        if kind == .bots {
            controller.onMatchOver = { [weak self] won in
                self?.stats.botMatches += 1
                if won { self?.stats.botWins += 1 }
            }
        }
        game = controller
        controller.start()
    }

    private func joined(_ match: GKMatch, config: GameConfig, createdAt: Date) {
        connecting = true
        let session = OnlineSession(match: match, config: config, createdAt: createdAt)
        session.onReady = { [weak self] controller in
            controller.onMatchOver = { won in
                guard won, let self else { return }
                self.stats.onlineWins += 1
                self.gameCenter.reportMatchWins(self.stats.onlineWins)
            }
            self?.connecting = false
            self?.game = controller
        }
        session.onEnd = { [weak self] reason in
            self?.leaveGame()
            self?.alert = reason
        }
        self.session = session
        session.start()
    }

    func leaveGame() {
        game?.leave()
        session?.leave()
        game = nil
        session = nil
        connecting = false
    }

    private func saveConfig() {
        if let data = try? JSONEncoder().encode(config) { UserDefaults.standard.set(data, forKey: "config") }
    }
}
