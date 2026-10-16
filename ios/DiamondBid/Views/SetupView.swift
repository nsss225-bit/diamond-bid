import SwiftUI

struct SetupView: View {
    @EnvironmentObject private var app: AppModel
    @Environment(\.dismiss) private var dismiss
    let kind: SetupKind

    private var hasBots: Bool {
        switch kind {
        case .bots: return true
        case .passAndPlay: return app.localPlayers < app.config.seatCount
        case .online: return app.config.seatCount == 4
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Players", selection: $app.config.seatCount) {
                        Text("2 players").tag(2)
                        Text("4 players").tag(4)
                    }
                    .pickerStyle(.segmented)
                    if app.config.seatCount == 4 {
                        Picker("Mode", selection: $app.config.teams) {
                            Text("Free-for-all").tag(false)
                            Text("2 vs 2 teams").tag(true)
                        }
                        .pickerStyle(.segmented)
                    }
                    if kind == .passAndPlay {
                        Stepper("People on this phone: \(min(app.localPlayers, app.config.seatCount))",
                                value: $app.localPlayers, in: 2...app.config.seatCount)
                    }
                    if hasBots {
                        Picker("Bots", selection: $app.config.botLevel) {
                            ForEach(BotLevel.allCases, id: \.self) { Text($0.title).tag($0) }
                        }
                    }
                } header: {
                    Text("Table")
                } footer: {
                    Text(tableFooter)
                }

                Section {
                    Picker("Ties", selection: $app.config.tieRule) {
                        Text("Split the gem").tag(TieRule.split)
                        Text("Cancel out").tag(TieRule.cancel)
                    }
                    Toggle("Cursed gems", isOn: $app.config.cursedGems)
                    Toggle("Double token", isOn: $app.config.doubleToken)
                    Picker("Match", selection: $app.config.gamesToWin) {
                        Text("Single game").tag(1)
                        Text("Best of 3").tag(2)
                    }
                } header: {
                    Text("Rules")
                } footer: {
                    Text(rulesFooter)
                }
            }
            .scrollContentBackground(.hidden)
            .background(TableBackground())
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
            .safeAreaInset(edge: .bottom) {
                Button(kind == .online ? "Find players" : "Deal the cards") { app.start(kind) }
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.vertical, 12)
            }
            .onChange(of: app.config.seatCount) { count in
                app.localPlayers = min(app.localPlayers, count)
            }
        }
        .tint(Theme.brass)
    }

    private var title: String {
        switch kind {
        case .online: return "Play with friends"
        case .bots: return "Play vs bots"
        case .passAndPlay: return "Pass and play"
        }
    }

    private var tableFooter: String {
        var lines: [String] = []
        if app.config.usesTeams { lines.append("Partners sit opposite: Hearts and Diamonds against Clubs and Spades. Partner points add up.") }
        if kind == .online {
            lines.append("Invite friends from the next screen. Empty seats are filled with bots. If friends join with an invite, your rules are used.")
        }
        return lines.joined(separator: "\n")
    }

    private var rulesFooter: String {
        var lines = [app.config.tieRule == .split
            ? "Ties: everyone tied for the best bid shares the gem."
            : "Ties: matching cards knock each other out and the best remaining card wins."]
        if app.config.cursedGems { lines.append("Cursed gems: three of the 13 prizes are −1, −2 and −3. The lowest bid has to take them.") }
        if app.config.doubleToken { lines.append("Double token: once per game, play it with your bid to double what you get that round. Careful, it doubles curses too.") }
        return lines.joined(separator: "\n")
    }
}
