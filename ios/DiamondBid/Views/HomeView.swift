import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var app: AppModel
    @ObservedObject var gameCenter: GameCenterManager
    @State private var showRules = false

    var body: some View {
        ZStack {
            TableBackground()
            ScrollView {
                VStack(spacing: 28) {
                    hero
                    VStack(spacing: 12) {
                        MenuRow(title: "Play with friends",
                                detail: gameCenter.isAuthenticated
                                    ? "Online with Game Center as \(gameCenter.playerName)"
                                    : "Needs Game Center. Sign in from Settings.",
                                icon: "person.2.fill", highlighted: true) { app.setup = .online }
                        MenuRow(title: "Play vs bots", detail: "Easy, normal or hard. 2 or 4 seats.",
                                icon: "cpu") { app.setup = .bots }
                        MenuRow(title: "Pass and play", detail: "2 to 4 people sharing this phone.",
                                icon: "iphone.gen3") { app.setup = .passAndPlay }
                    }
                    HStack(spacing: 12) {
                        Button { gameCenter.showLeaderboard() } label: {
                            Label("Leaderboard", systemImage: "trophy.fill")
                        }
                        Button { showRules = true } label: {
                            Label("How to play", systemImage: "questionmark.circle")
                        }
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    statsLine
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 28)
                .frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
            }
        }
        .foregroundStyle(Theme.ink)
        .sheet(isPresented: $showRules) { RulesView() }
    }

    private var hero: some View {
        VStack(spacing: 14) {
            ZStack {
                PlayingCard(face: .suit(.hearts, 13), width: 70).rotationEffect(.degrees(-14)).offset(x: -52, y: 8)
                PlayingCard(face: .suit(.spades, 13), width: 70).rotationEffect(.degrees(14)).offset(x: 52, y: 8)
                PlayingCard(face: .prize(13), width: 84)
            }
            .frame(height: 130)
            Text("Diamond Bid").font(Theme.display(40))
            Text("Bid a card face down for each gem.\nThe highest card takes it.")
                .font(.callout)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.muted)
        }
    }

    private var statsLine: some View {
        let s = app.stats
        return Text("Online match wins: \(s.onlineWins)   ·   vs bots: \(s.botWins) of \(s.botMatches)")
            .font(.footnote)
            .monospacedDigit()
            .foregroundStyle(Theme.muted)
    }
}

private struct MenuRow: View {
    let title: String
    let detail: String
    let icon: String
    var highlighted = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(highlighted ? Theme.brass : Theme.panel))
                    .foregroundStyle(highlighted ? Theme.feltDeep : Theme.ink)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.headline)
                    Text(detail).font(.subheadline).foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(Theme.muted)
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 16).fill(Theme.panel))
            .overlay(RoundedRectangle(cornerRadius: 16)
                .strokeBorder(highlighted ? Theme.brass.opacity(0.6) : .clear, lineWidth: 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct ConnectingView: View {
    let onCancel: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            VStack(spacing: 16) {
                ProgressView().tint(Theme.brass).scaleEffect(1.3)
                Text("Seating players…").font(Theme.display(22))
                Text("Waiting for everyone to connect.").foregroundStyle(Theme.muted)
                Button("Cancel", action: onCancel).buttonStyle(SecondaryButtonStyle())
            }
            .padding(28)
            .background(RoundedRectangle(cornerRadius: 22).fill(Theme.feltDeep))
        }
        .foregroundStyle(Theme.ink)
    }
}
