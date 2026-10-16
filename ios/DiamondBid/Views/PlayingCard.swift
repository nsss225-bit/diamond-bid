import SwiftUI

struct PlayingCard: View {
    enum Face: Equatable {
        case suit(Suit, Int)
        case prize(Int)
        case back
    }

    let face: Face
    var width: CGFloat = 42

    var body: some View {
        let radius = width * 0.12
        ZStack {
            RoundedRectangle(cornerRadius: radius).fill(fill)
            content
            RoundedRectangle(cornerRadius: radius).strokeBorder(border, lineWidth: borderWidth)
        }
        .frame(width: width, height: width * 1.4)
        .shadow(color: .black.opacity(0.35), radius: 3, y: 2)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(spoken)
    }

    @ViewBuilder private var content: some View {
        switch face {
        case .suit(let suit, let value):
            ZStack(alignment: .topLeading) {
                Color.clear
                VStack(spacing: 0) {
                    Text(Card.label(value)).font(.system(size: width * 0.3, weight: .bold, design: .serif))
                    Text(suit.symbol).font(.system(size: width * 0.2))
                }
                .padding(.leading, width * 0.08)
                .padding(.top, width * 0.06)
                Text(suit.symbol)
                    .font(.system(size: width * 0.5))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.top, width * 0.3)
                    .padding(.leading, width * 0.18)
            }
            .foregroundStyle(Theme.suitColor(suit))
        case .prize(let value):
            VStack(spacing: width * 0.04) {
                Image(systemName: value < 0 ? "flame.fill" : "diamond.fill")
                    .font(.system(size: width * 0.32))
                Text(PrizeDeck.label(value))
                    .font(.system(size: width * 0.36, weight: .heavy, design: .serif))
                    .monospacedDigit()
            }
            .foregroundStyle(value < 0 ? Theme.curseText : Theme.gem)
        case .back:
            RoundedRectangle(cornerRadius: width * 0.07)
                .strokeBorder(Theme.brass.opacity(0.55), lineWidth: 1)
                .padding(width * 0.11)
                .overlay(
                    Image(systemName: "suit.diamond.fill")
                        .font(.system(size: width * 0.3))
                        .foregroundStyle(Theme.brass.opacity(0.7))
                )
        }
    }

    private var fill: Color {
        switch face {
        case .back: return Theme.cardBack
        case .prize(let v) where v < 0: return Theme.curse
        default: return Theme.cardFace
        }
    }

    private var border: Color {
        switch face {
        case .back: return Theme.cardFace
        case .prize(let v): return v < 0 ? Theme.brass.opacity(0.4) : Theme.brass
        case .suit: return Theme.cardEdge
        }
    }

    private var borderWidth: CGFloat {
        switch face {
        case .back: return width * 0.05
        case .prize: return 2
        case .suit: return 1
        }
    }

    private var spoken: String {
        switch face {
        case .suit(let suit, let v): return "\(Card.label(v)) of \(suit.name)"
        case .prize(let v): return PrizeDeck.name(v)
        case .back: return "Face-down card"
        }
    }
}

/// An empty spot on the table where a card will go.
struct CardSlot: View {
    var width: CGFloat
    var label: String = ""

    var body: some View {
        RoundedRectangle(cornerRadius: width * 0.12)
            .strokeBorder(Theme.muted.opacity(0.5), style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
            .frame(width: width, height: width * 1.4)
            .overlay(
                Text(label)
                    .font(.caption2)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.muted)
                    .padding(4)
            )
    }
}
