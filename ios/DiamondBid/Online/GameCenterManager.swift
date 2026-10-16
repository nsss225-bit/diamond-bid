import GameKit
import UIKit

/// Game Center sign-in, the friend-invite screen, and the leaderboard.
final class GameCenterManager: NSObject, ObservableObject {
    /// Create a leaderboard with this ID in App Store Connect (see README).
    static let leaderboardID = "diamondbid.matchwins"

    @Published private(set) var isAuthenticated = false
    @Published private(set) var playerName = ""

    var onMatch: ((GKMatch, GameConfig, Date) -> Void)?
    var onError: ((String) -> Void)?

    private var pending: (config: GameConfig, createdAt: Date)?

    func authenticate() {
        GKLocalPlayer.local.authenticateHandler = { [weak self] signInScreen, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if let signInScreen {
                    Presenter.present(signInScreen)
                    return
                }
                let local = GKLocalPlayer.local
                self.isAuthenticated = local.isAuthenticated
                self.playerName = local.displayName
                if local.isAuthenticated {
                    local.register(self)
                } else if let error {
                    print("Game Center sign-in failed: \(error.localizedDescription)")
                }
            }
        }
    }

    /// Opens Apple's screen for inviting friends or finding players with the same rules.
    func findMatch(config: GameConfig) {
        guard isAuthenticated else {
            onError?("Sign in to Game Center (Settings > Game Center) to play with friends.")
            return
        }
        let request = GKMatchRequest()
        request.minPlayers = 2
        request.maxPlayers = config.seatCount
        request.playerGroup = config.matchmakingGroup
        request.inviteMessage = "Join my Diamond Bid table!"
        pending = (config: config, createdAt: Date())
        guard let screen = GKMatchmakerViewController(matchRequest: request) else { return }
        screen.matchmakerDelegate = self
        Presenter.present(screen)
    }

    func reportMatchWins(_ total: Int) {
        guard isAuthenticated else { return }
        GKLeaderboard.submitScore(total, context: 0, player: GKLocalPlayer.local,
                                  leaderboardIDs: [Self.leaderboardID]) { error in
            if let error { print("Leaderboard submit failed: \(error.localizedDescription)") }
        }
    }

    func showLeaderboard() {
        guard isAuthenticated else {
            onError?("Sign in to Game Center (Settings > Game Center) to see the leaderboard.")
            return
        }
        let screen = GKGameCenterViewController(leaderboardID: Self.leaderboardID,
                                                playerScope: .friendsOnly, timeScope: .allTime)
        screen.gameCenterDelegate = self
        Presenter.present(screen)
    }
}

extension GameCenterManager: GKMatchmakerViewControllerDelegate {
    func matchmakerViewControllerWasCancelled(_ viewController: GKMatchmakerViewController) {
        viewController.dismiss(animated: true)
        pending = nil
    }

    func matchmakerViewController(_ viewController: GKMatchmakerViewController, didFailWithError error: Error) {
        viewController.dismiss(animated: true)
        pending = nil
        onError?(error.localizedDescription)
    }

    func matchmakerViewController(_ viewController: GKMatchmakerViewController, didFind match: GKMatch) {
        viewController.dismiss(animated: true)
        let request = pending ?? (config: GameConfig(), createdAt: Date())
        pending = nil
        onMatch?(match, request.config, request.createdAt)
    }
}

extension GameCenterManager: GKLocalPlayerListener {
    /// A friend's invite was accepted from a notification or Messages.
    func player(_ player: GKPlayer, didAccept invite: GKInvite) {
        DispatchQueue.main.async {
            guard let screen = GKMatchmakerViewController(invite: invite) else { return }
            screen.matchmakerDelegate = self
            // The inviter proposed first, so their rules are used; these are placeholders.
            self.pending = (config: GameConfig(), createdAt: Date())
            Presenter.present(screen)
        }
    }
}

extension GameCenterManager: GKGameCenterControllerDelegate {
    func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}

/// Game Center hands back UIKit screens; show them on top of whatever is visible.
enum Presenter {
    static func present(_ screen: UIViewController) {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
        var top = (windows.first { $0.isKeyWindow } ?? windows.first)?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        top?.present(screen, animated: true)
    }
}
