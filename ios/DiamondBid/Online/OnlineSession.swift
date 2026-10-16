import GameKit

/// One Game Center match. Picks a host, then carries game messages between phones.
final class OnlineSession: NSObject, GKMatchDelegate, GameLink {
    var onReady: ((GameController) -> Void)?
    var onEnd: ((String) -> Void)?

    private let match: GKMatch
    private let myID = GKLocalPlayer.local.gamePlayerID
    private var proposals: [String: MatchProposal] = [:]
    private var hostID: String?
    private var controller: GameController?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(match: GKMatch, config: GameConfig, createdAt: Date) {
        self.match = match
        super.init()
        proposals[myID] = MatchProposal(config: config, createdAt: createdAt, name: GKLocalPlayer.local.displayName)
        match.delegate = self
    }

    func start() {
        sendProposal()
        electHostIfReady()
    }

    private var connectedIDs: [String] { [myID] + match.players.map(\.gamePlayerID) }

    private func sendProposal() {
        if let mine = proposals[myID] { broadcast(.proposal(mine)) }
    }

    /// Once every phone has shared its proposal, the oldest one hosts. Every phone
    /// reaches the same answer on its own, so no extra round trip is needed.
    private func electHostIfReady() {
        guard hostID == nil, controller == nil, match.expectedPlayerCount == 0 else { return }
        let ids = connectedIDs
        guard ids.count >= 2, ids.allSatisfy({ proposals[$0] != nil }) else { return }
        let host = ids.min { a, b in
            let pa = proposals[a]!, pb = proposals[b]!
            return pa.createdAt == pb.createdAt ? a < b : pa.createdAt < pb.createdAt
        }!
        hostID = host
        guard host == myID else { return } // wait for the host's first update

        let config = proposals[host]!.config
        let humans = Array(([host] + ids.filter { $0 != host }.sorted()).prefix(config.seatCount))
        let seats: [Seat] = (0..<config.seatCount).map { i in
            if i < humans.count {
                return Seat(name: proposals[humans[i]]?.name ?? "Player \(i + 1)", controller: .human(id: humans[i]))
            }
            return Seat(name: "\(Suit.forSeat(i, of: config.seatCount).name) bot", controller: .bot(config.botLevel))
        }
        var rng = SystemRandomNumberGenerator()
        let state = GameState.newMatch(config: config, seats: seats, using: &rng)
        let c = GameController(state: state, mySeats: [0], isAuthority: true, link: self)
        controller = c
        onReady?(c)
        c.start()
    }

    private func handle(_ message: NetMessage, from id: String) {
        switch message {
        case .proposal(let proposal):
            proposals[id] = proposal
            electHostIfReady()
        case .state(let state):
            if let c = controller {
                c.receive(message, fromSeat: nil)
                return
            }
            hostID = id
            guard let seat = state.seats.firstIndex(where: { $0.humanID == myID }) else {
                onEnd?("That table is already full.")
                leave()
                return
            }
            let c = GameController(state: state, mySeats: [seat], isAuthority: false, link: self)
            controller = c
            onReady?(c)
        default:
            controller?.receive(message, fromSeat: controller?.seat(forHumanID: id))
        }
    }

    private func playerLeft(_ id: String) {
        guard let c = controller else {
            proposals[id] = nil
            if match.players.isEmpty {
                onEnd?("The other player left before the game started.")
                leave()
            } else {
                electHostIfReady()
            }
            return
        }
        guard id == hostID else {
            c.replaceWithBot(humanID: id)
            return
        }
        // The host left: the first remaining person in seat order takes over.
        let remaining = Set(connectedIDs).subtracting([id])
        hostID = c.humanIDsInSeatOrder.first { remaining.contains($0) }
        if hostID == myID {
            c.becomeAuthority(droppedHumanID: id)
        } else {
            c.replaceWithBot(humanID: id)
        }
    }

    // MARK: - GameLink

    func sendToHost(_ message: NetMessage) {
        guard let host = match.players.first(where: { $0.gamePlayerID == hostID }) else { return }
        send(message, to: [host])
    }

    func broadcast(_ message: NetMessage) {
        guard let data = try? encoder.encode(message) else { return }
        try? match.sendData(toAllPlayers: data, with: .reliable)
    }

    func publish(_ full: GameState) {
        for player in match.players {
            let seat = full.seats.firstIndex { $0.humanID == player.gamePlayerID }
            send(.state(full.redacted(for: Set(seat.map { [$0] } ?? []))), to: [player])
        }
    }

    func leave() {
        match.delegate = nil
        match.disconnect()
    }

    private func send(_ message: NetMessage, to players: [GKPlayer]) {
        guard let data = try? encoder.encode(message) else { return }
        try? match.send(data, to: players, dataMode: .reliable)
    }

    // MARK: - GKMatchDelegate

    func match(_ match: GKMatch, didReceive data: Data, fromRemotePlayer player: GKPlayer) {
        let id = player.gamePlayerID
        guard let message = try? decoder.decode(NetMessage.self, from: data) else { return }
        DispatchQueue.main.async { self.handle(message, from: id) }
    }

    func match(_ match: GKMatch, player: GKPlayer, didChange state: GKPlayerConnectionState) {
        let id = player.gamePlayerID
        DispatchQueue.main.async {
            switch state {
            case .connected:
                self.sendProposal()
                self.electHostIfReady()
            case .disconnected:
                self.playerLeft(id)
            default:
                break
            }
        }
    }

    func match(_ match: GKMatch, didFailWithError error: Error?) {
        let text = error?.localizedDescription ?? "The connection to the other players failed."
        DispatchQueue.main.async { self.onEnd?(text) }
    }
}
