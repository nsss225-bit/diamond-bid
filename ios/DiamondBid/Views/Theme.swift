import SwiftUI

/// A card table: deep green baize, brass trim, ivory cards.
enum Theme {
    static let felt = Color(red: 0.075, green: 0.25, blue: 0.21)
    static let feltDeep = Color(red: 0.043, green: 0.15, blue: 0.125)
    static let ink = Color(red: 0.95, green: 0.93, blue: 0.87)
    static let muted = Color(red: 0.62, green: 0.74, blue: 0.69)
    static let brass = Color(red: 0.85, green: 0.67, blue: 0.31)
    static let cardFace = Color(red: 0.984, green: 0.973, blue: 0.945)
    static let cardEdge = Color(red: 0.85, green: 0.82, blue: 0.75)
    static let cardBack = Color(red: 0.43, green: 0.10, blue: 0.15)
    static let red = Color(red: 0.77, green: 0.16, blue: 0.24)
    static let black = Color(red: 0.11, green: 0.125, blue: 0.15)
    static let gem = Color(red: 0.83, green: 0.32, blue: 0.18)
    static let curse = Color(red: 0.27, green: 0.14, blue: 0.34)
    static let curseText = Color(red: 0.88, green: 0.76, blue: 0.96)
    static let panel = Color.black.opacity(0.22)

    static func display(_ size: CGFloat) -> Font { .system(size: size, weight: .heavy, design: .serif) }

    static func suitColor(_ suit: Suit) -> Color { suit.isRed ? red : black }
    /// Suit color on the felt, where black would vanish.
    static func suitColorOnFelt(_ suit: Suit) -> Color { suit.isRed ? red : ink }
    static func teamColor(_ side: Int) -> Color { side == 0 ? red : ink }
}

struct TableBackground: View {
    var body: some View {
        RadialGradient(colors: [Theme.felt, Theme.feltDeep], center: .init(x: 0.5, y: 0.4),
                       startRadius: 0, endRadius: 650)
            .ignoresSafeArea()
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(Theme.feltDeep)
            .padding(.horizontal, 22)
            .padding(.vertical, 12)
            .background(Capsule().fill(Theme.brass))
            .opacity(isEnabled ? (configuration.isPressed ? 0.75 : 1) : 0.4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(Theme.ink)
            .padding(.horizontal, 20)
            .padding(.vertical, 11)
            .background(Capsule().strokeBorder(Theme.muted.opacity(0.5), lineWidth: 1))
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

struct IconButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(Theme.ink)
            .frame(width: 38, height: 38)
            .background(Circle().fill(Theme.panel))
            .opacity(configuration.isPressed ? 0.6 : 1)
    }
}
