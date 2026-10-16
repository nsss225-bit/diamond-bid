import SwiftUI

@main
struct DiamondBidApp: App {
    @StateObject private var app = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .preferredColorScheme(.dark)
                .onAppear { app.gameCenter.authenticate() }
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var app: AppModel

    var body: some View {
        ZStack {
            if let game = app.game {
                GameView(game: game) { app.leaveGame() }
                    .transition(.opacity)
            } else {
                HomeView(gameCenter: app.gameCenter)
            }
            if app.connecting {
                ConnectingView { app.leaveGame() }
            }
        }
        .animation(.easeInOut(duration: 0.25), value: app.game != nil)
        .sheet(item: $app.setup) { kind in
            SetupView(kind: kind).environmentObject(app)
        }
        .alert("Diamond Bid", isPresented: Binding(get: { app.alert != nil }, set: { if !$0 { app.alert = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(app.alert ?? "")
        }
    }
}
