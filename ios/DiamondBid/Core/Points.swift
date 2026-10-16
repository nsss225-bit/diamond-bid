import Foundation

/// Scores are kept in twelfths so a gem split between 2, 3 or 4 players stays exact.
struct Points: Codable, Hashable, Comparable {
    var twelfths: Int

    init(twelfths: Int) { self.twelfths = twelfths }
    init(_ whole: Int) { self.twelfths = whole * 12 }

    static let zero = Points(twelfths: 0)

    static func + (a: Points, b: Points) -> Points { Points(twelfths: a.twelfths + b.twelfths) }
    static func += (a: inout Points, b: Points) { a.twelfths += b.twelfths }
    static func * (a: Points, k: Int) -> Points { Points(twelfths: a.twelfths * k) }
    static func < (a: Points, b: Points) -> Bool { a.twelfths < b.twelfths }

    /// Exact for n = 1...4 because 12 divides evenly by each.
    func divided(by n: Int) -> Points { Points(twelfths: twelfths / n) }

    var text: String {
        let sign = twelfths < 0 ? "\u{2212}" : ""
        let t = abs(twelfths)
        let whole = t / 12
        let fractions = [3: "\u{00BC}", 4: "\u{2153}", 6: "\u{00BD}", 8: "\u{2154}", 9: "\u{00BE}"]
        switch t % 12 {
        case 0:
            return sign + "\(whole)"
        case let rem where fractions[rem] != nil:
            return sign + (whole == 0 ? "" : "\(whole)") + fractions[rem]!
        default:
            return sign + String(format: "%.1f", Double(t) / 12)
        }
    }
}
