import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// The widgets' look, from the app's phone tokens (client/src/mobile/mobile.css):
/// warm paper by day, near black by night, one ink colour, the status colours,
/// and the topographic lines and route arcs that stand for travel throughout.
enum Trek {
    static func ink(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0xF5F5F7) : Color(hex: 0x101013) }
    static func muted(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0x9C9CA3) : Color(hex: 0x68686F) }
    static func faint(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0x6E6E76) : Color(hex: 0x9A9AA1) }
    static func card(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color.white.opacity(0.07) : Color.white.opacity(0.62) }
    static func cardBorder(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color.white.opacity(0.09) : Color.white.opacity(0.9) }
    static func track(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color.white.opacity(0.12) : Color(hex: 0x101013).opacity(0.09) }

    static let confirmed = Color(hex: 0x2FA37A)
    static let pending = Color(hex: 0xE8A13A)
    static let info = Color(hex: 0x4A7DDB)
    static let danger = Color(hex: 0xD6273B)

    /// A stable number for a text (FNV-1a), unlike hashValue, which changes per launch.
    static func seed(_ text: String) -> UInt64 {
        var hash: UInt64 = 1469598103934665603
        for byte in text.utf8 { hash = (hash ^ UInt64(byte)) &* 1099511628211 }
        return hash
    }

    /// Two colours of the trip's own, from its title: the same trip always gets
    /// the same sky, and two trips side by side rarely the same one.
    static func tripHues(_ title: String) -> (Color, Color) {
        let base = Double(seed(title) % 360) / 360
        let first = Color(hue: base, saturation: 0.62, brightness: 0.78)
        let second = Color(hue: (base + 0.11).truncatingRemainder(dividingBy: 1), saturation: 0.7, brightness: 0.42)
        return (first, second)
    }

    static func number(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded).monospacedDigit()
    }

}

private struct Eyebrow: ViewModifier {
    let scheme: ColorScheme
    func body(content: Content) -> some View {
        content
            .font(.system(size: 10.5, weight: .bold))
            .tracking(0.6)
            .textCase(.uppercase)
            .foregroundStyle(Trek.muted(scheme))
            .lineLimit(1)
    }
}

extension View {
    func trekEyebrow(_ scheme: ColorScheme) -> some View { modifier(Eyebrow(scheme: scheme)) }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }

    /// "#rrggbb" or "rrggbb"; nil for anything else.
    init?(css: String?) {
        guard let css else { return nil }
        let hex = css.hasPrefix("#") ? String(css.dropFirst()) : css
        guard hex.count == 6, let value = UInt32(hex, radix: 16) else { return nil }
        self.init(hex: value)
    }
}

// MARK: - Backgrounds

/// The paper the widgets sit on: the app's screen gradient, with a faint
/// contour map over it so even an empty widget reads as TREK.
struct TrekPaper: View {
    @Environment(\.colorScheme) private var scheme
    var contours = true

    var body: some View {
        ZStack {
            if scheme == .dark {
                RadialGradient(
                    colors: [Color(hex: 0x1B1B21), Color(hex: 0x0C0C0F), Color(hex: 0x070709)],
                    center: UnitPoint(x: 0.5, y: -0.1), startRadius: 0, endRadius: 360
                )
            } else {
                RadialGradient(
                    colors: [Color(hex: 0xFDFCF9), Color(hex: 0xF1EFEA), Color(hex: 0xE7E5DF)],
                    center: UnitPoint(x: 0.5, y: -0.1), startRadius: 0, endRadius: 360
                )
            }
            if contours {
                ContourLines(seed: 7, rings: 9)
                    .stroke(Trek.ink(scheme).opacity(scheme == .dark ? 0.05 : 0.045), lineWidth: 0.8)
            }
        }
    }
}

/// A trip's own backdrop: its cover photo when the app sent one, else its two
/// colours as a sky with contour lines, both darkened towards the text.
struct TripBackdrop: View {
    let trip: WidgetSnapshot.Trip?
    var shade: Double = 0.62

    var body: some View {
        ZStack {
            if let image = coverImage {
                image.resizable().scaledToFill()
            } else {
                let (first, second) = Trek.tripHues(trip?.title ?? "TREK")
                LinearGradient(colors: [first, second], startPoint: .topLeading, endPoint: .bottomTrailing)
                RadialGradient(colors: [Color.white.opacity(0.28), .clear], center: UnitPoint(x: 0.85, y: 0.05), startRadius: 0, endRadius: 220)
                ContourLines(seed: Trek.seed(trip?.title ?? "") % 997, rings: 11)
                    .stroke(Color.white.opacity(0.14), lineWidth: 0.9)
            }
            LinearGradient(
                colors: [Color.black.opacity(shade * 0.35), Color.black.opacity(0.05), Color.black.opacity(shade)],
                startPoint: .top, endPoint: .bottom
            )
        }
    }

    private var coverImage: Image? {
        guard let base64 = trip?.cover, let data = Data(base64Encoded: base64) else { return nil }
        #if canImport(UIKit)
        guard let image = UIImage(data: data) else { return nil }
        return Image(uiImage: image)
        #elseif canImport(AppKit)
        guard let image = NSImage(data: data) else { return nil }
        return Image(nsImage: image)
        #else
        return nil
        #endif
    }
}

/// Wobbly closed rings around an off-centre summit: a contour map in a few
/// lines, the same for the same seed.
struct ContourLines: Shape {
    var seed: UInt64
    var rings: Int

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let phaseA = CGFloat(seed % 13) * 0.7
        let phaseB = CGFloat(seed % 7) * 1.3
        let offset: CGFloat = 0.62 + CGFloat(seed % 5) * 0.04
        let centerX: CGFloat = rect.minX + rect.width * offset
        let centerY: CGFloat = rect.minY + rect.height * 0.32
        let maxRadius: CGFloat = max(rect.width, rect.height) * 1.05
        let count = max(rings, 1)
        let steps = 72
        for ring in 1...count {
            let base: CGFloat = maxRadius * CGFloat(ring) / CGFloat(count)
            let twist: CGFloat = CGFloat(ring) * 0.35
            for step in 0...steps {
                let angle: CGFloat = CGFloat(step) / CGFloat(steps) * 2 * .pi
                let first: CGFloat = 0.09 * sin(angle * 3 + phaseA + twist)
                let second: CGFloat = 0.05 * sin(angle * 5 + phaseB)
                let radius: CGFloat = base * (1 + first + second)
                let point = CGPoint(x: centerX + cos(angle) * radius * 1.15, y: centerY + sin(angle) * radius * 0.82)
                if step == 0 { path.move(to: point) } else { path.addLine(to: point) }
            }
            path.closeSubpath()
        }
        return path
    }
}

/// A dotted flight path from home to the trip, with the plane on it as far as
/// the countdown has come.
struct RouteArc: View {
    /// 0 at home, 1 arrived.
    let progress: Double
    let color: Color

    var body: some View {
        GeometryReader { geo in
            let start = CGPoint(x: 6, y: geo.size.height - 6)
            let end = CGPoint(x: geo.size.width - 6, y: geo.size.height - 6)
            let control = CGPoint(x: geo.size.width / 2, y: geo.size.height * -0.55)
            ZStack {
                Path { path in
                    path.move(to: start)
                    path.addQuadCurve(to: end, control: control)
                }
                .stroke(color.opacity(0.45), style: StrokeStyle(lineWidth: 1.4, lineCap: .round, dash: [1.5, 4.5]))
                Path { path in
                    path.move(to: start)
                    path.addQuadCurve(to: end, control: control)
                }
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 1.8, lineCap: .round))
                Circle().fill(color).frame(width: 6, height: 6).position(start)
                Circle().stroke(color, lineWidth: 1.6).frame(width: 9, height: 9).position(end)
                let point = quadPoint(start, control, end, progress)
                let tangent = quadTangent(start, control, end, progress)
                Image(systemName: "airplane")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(color)
                    .rotationEffect(.radians(Double(atan2(tangent.y, tangent.x))))
                    .position(point)
            }
        }
    }

    private func quadPoint(_ a: CGPoint, _ c: CGPoint, _ b: CGPoint, _ progress: Double) -> CGPoint {
        let t = CGFloat(progress)
        let u: CGFloat = 1 - t
        let x: CGFloat = u * u * a.x + 2 * u * t * c.x + t * t * b.x
        let y: CGFloat = u * u * a.y + 2 * u * t * c.y + t * t * b.y
        return CGPoint(x: x, y: y)
    }

    private func quadTangent(_ a: CGPoint, _ c: CGPoint, _ b: CGPoint, _ progress: Double) -> CGPoint {
        let t = CGFloat(progress)
        let x: CGFloat = 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x)
        let y: CGFloat = 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y)
        return CGPoint(x: x, y: y)
    }
}

// MARK: - Components

private struct StaticPreviewKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Set by the preview renderer, which cannot draw a Link.
    var trekStaticPreview: Bool {
        get { self[StaticPreviewKey.self] }
        set { self[StaticPreviewKey.self] = newValue }
    }
}

/// A row that opens its own place in the app, or just the row in a preview.
struct RowLink<Label: View>: View {
    let path: String
    @ViewBuilder var label: () -> Label
    @Environment(\.trekStaticPreview) private var staticPreview

    var body: some View {
        if staticPreview {
            label()
        } else if let url = WidgetSnapshot.link(path) {
            Link(destination: url) { label() }
        } else {
            label()
        }
    }
}

/// A ring that fills with progress, a soft track under it.
struct ProgressRing<Label: View>: View {
    let value: Double
    var lineWidth: CGFloat = 6
    var colors: [Color]
    var trackColor: Color
    @ViewBuilder var label: () -> Label

    var body: some View {
        ZStack {
            Circle().stroke(trackColor, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: max(0.001, min(1, value)))
                .stroke(
                    AngularGradient(colors: colors + [colors.first ?? .white], center: .center, startAngle: .degrees(-90), endAngle: .degrees(270)),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            label()
        }
    }
}

/// The trip's days as a row of segments, those behind filled, today glowing.
struct DaySegments: View {
    let index: Int
    let total: Int
    let color: Color
    let track: Color

    var body: some View {
        let count = min(max(total, 1), 21)
        let current = total > 21 ? Int((Double(index) / Double(total) * 21).rounded(.up)) : index
        HStack(spacing: count > 12 ? 2 : 3) {
            ForEach(1...count, id: \.self) { day in
                Capsule()
                    .fill(day < current ? color : day == current ? color : track)
                    .opacity(day < current ? 0.55 : 1)
                    .shadow(color: day == current ? color.opacity(0.7) : .clear, radius: 3)
            }
        }
        .frame(height: 4)
    }
}

/// Today's weather in a pill: the multicolour symbol and the temperature.
struct WeatherChip: View {
    let weather: WidgetSnapshot.Weather
    var onPhoto = false
    var compact = false
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: Trek.weatherSymbol(weather.main))
                .symbolRenderingMode(.multicolor)
                .font(.system(size: compact ? 12 : 14, weight: .semibold))
            Text("\(weather.temp)°")
                .font(Trek.number(compact ? 12 : 14, .semibold))
                .foregroundStyle(onPhoto ? .white : Trek.ink(scheme))
        }
        .padding(.horizontal, compact ? 7 : 9)
        .padding(.vertical, compact ? 3 : 4)
        .background(
            Capsule().fill(onPhoto ? Color.black.opacity(0.28) : Trek.card(scheme))
        )
        .overlay(Capsule().stroke(onPhoto ? Color.white.opacity(0.22) : Trek.cardBorder(scheme), lineWidth: 0.6))
    }
}

extension Trek {
    static func weatherSymbol(_ main: String) -> String {
        switch main.lowercased() {
        case "clear": return "sun.max.fill"
        case "clouds": return "cloud.sun.fill"
        case "rain", "drizzle": return "cloud.rain.fill"
        case "thunderstorm": return "cloud.bolt.rain.fill"
        case "snow": return "cloud.snow.fill"
        case "mist", "fog", "haze": return "cloud.fog.fill"
        default: return "cloud.fill"
        }
    }

    /// Symbol and colour of a booking's kind.
    static func booking(_ kind: String) -> (symbol: String, color: Color) {
        switch kind {
        case "flight": return ("airplane", Color(hex: 0x4A7DDB))
        case "train": return ("tram.fill", Color(hex: 0x2FA37A))
        case "bus": return ("bus.fill", Color(hex: 0x2BA6A6))
        case "car": return ("car.fill", Color(hex: 0xD6673B))
        case "cruise", "ferry": return ("ferry.fill", Color(hex: 0x2E8BC0))
        case "hotel": return ("bed.double.fill", Color(hex: 0x8E6CD9))
        case "restaurant": return ("fork.knife", Color(hex: 0xE8A13A))
        case "event": return ("ticket.fill", Color(hex: 0xD6408B))
        case "tour": return ("figure.hiking", Color(hex: 0x4E9F3D))
        default: return ("bookmark.fill", Color(hex: 0x8A8A93))
        }
    }

    static func priority(_ value: Int) -> Color? {
        switch value {
        case 3: return danger
        case 2: return pending
        case 1: return info
        default: return nil
        }
    }
}

/// A booking's kind as a tinted rounded square.
struct KindBadge: View {
    let kind: String
    var size: CGFloat = 30

    var body: some View {
        let look = Trek.booking(kind)
        RoundedRectangle(cornerRadius: size * 0.32, style: .continuous)
            .fill(LinearGradient(colors: [look.color, look.color.opacity(0.78)], startPoint: .top, endPoint: .bottom))
            .frame(width: size, height: size)
            .overlay(
                Image(systemName: look.symbol)
                    .font(.system(size: size * 0.46, weight: .semibold))
                    .foregroundStyle(.white)
            )
            .shadow(color: look.color.opacity(0.35), radius: 4, y: 2)
    }
}

/// "Today", "Tomorrow" or the short weekday and date of a yyyy-MM-dd.
enum RelativeDay {
    static func label(_ iso: String?, now: Date, labels: WidgetSnapshot.Labels) -> String? {
        guard let iso, let date = WidgetSnapshot.day(iso), let days = WidgetSnapshot.daysBetween(now, date) else { return nil }
        if days == 0 { return labels.todayShort ?? labels.today }
        if days == 1 { return labels.tomorrowShort ?? labels.tomorrow }
        let formatter = DateFormatter()
        formatter.setLocalizedDateFormatFromTemplate(days < 7 ? "EEE" : "EEEdMMM")
        return formatter.string(from: date)
    }

    static func range(_ start: String, _ end: String) -> String? {
        guard let from = WidgetSnapshot.day(start), let to = WidgetSnapshot.day(end) else { return nil }
        let formatter = DateIntervalFormatter()
        formatter.dateTemplate = "dMMM"
        return formatter.string(from: from, to: to)
    }
}
