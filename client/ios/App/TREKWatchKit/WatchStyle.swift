import SwiftUI

/// A text from the watch's Localizable.strings.
func L(_ key: String) -> String {
    NSLocalizedString(key, comment: "")
}

/// The watch's own formatting: times in the clock the user picked in TREK,
/// days, ranges and countdowns in the watch's language.
enum WatchFormat {
    private static var formatters: [String: DateFormatter] = [:]
    private static let utc = TimeZone(identifier: "UTC") ?? .current

    /// A formatter for the template in the watch's language, in `zone`
    /// (the current one unless given), so a flight across zones is followed.
    private static func formatter(_ template: String, zone: TimeZone = .current) -> DateFormatter {
        let key = template + "|" + Locale.current.identifier + "|" + zone.identifier
        if let cached = formatters[key] { return cached }
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        formatter.timeZone = zone
        formatter.setLocalizedDateFormatFromTemplate(template)
        formatters[key] = formatter
        return formatter
    }

    static func time(_ date: Date, hour12: Bool) -> String {
        formatter(hour12 ? "h:mm a" : "HH:mm").string(from: date)
    }

    /// A time of day from its minutes, with no date involved, so no change of
    /// the clocks can shift it: the minutes after the reference date, in UTC.
    static func time(minutes: Int, hour12: Bool) -> String {
        let m = min(max(minutes, 0), 24 * 60 - 1)
        return formatter(hour12 ? "h:mm a" : "HH:mm", zone: utc).string(from: Date(timeIntervalSinceReferenceDate: TimeInterval(m * 60)))
    }

    /// "Tue 18 Nov"
    static func day(_ date: Date) -> String {
        formatter("EEEdMMM").string(from: date)
    }

    /// "Tuesday"
    static func weekday(_ date: Date) -> String {
        formatter("EEEE").string(from: date)
    }

    /// "17 – 25 Nov"
    static func range(_ start: String, _ end: String) -> String? {
        guard let from = TrekDate.day(start), let to = TrekDate.day(end) else { return nil }
        let formatter = DateIntervalFormatter()
        formatter.dateTemplate = "dMMM"
        return formatter.string(from: from, to: to)
    }

    /// "in 25 min", "in 2 hr", "5 min ago": named and plural-correct in every language.
    static func relative(_ date: Date, now: Date) -> String {
        if abs(date.timeIntervalSince(now)) < 60 { return L("time.now") }
        // Against `now`, not the system clock, so the screenshot mode's clock counts too.
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        formatter.dateTimeStyle = .numeric
        return formatter.localizedString(for: date, relativeTo: now)
    }

    /// The time to a moment as a short count: "25 min", "2 h 15 min", "3 d".
    static func countdown(_ date: Date, now: Date) -> String {
        let seconds = max(date.timeIntervalSince(now), 0)
        let formatter = WatchFormat.components()
        formatter.unitsStyle = .short
        formatter.maximumUnitCount = 2
        formatter.allowedUnits = seconds >= 86_400 ? [.day, .hour] : seconds >= 3_600 ? [.hour, .minute] : [.minute]
        return formatter.string(from: max(seconds, 60)) ?? ""
    }

    /// The word for a number of days in its right plural form ("days", "Tage",
    /// "дней", "日"), taken from the system's own phrase so no plural rules
    /// have to be kept here: the number is formatted and then cut out.
    static func daysUnit(_ count: Int) -> String {
        let formatter = WatchFormat.components()
        formatter.unitsStyle = .full
        formatter.allowedUnits = [.day]
        let phrase = formatter.string(from: DateComponents(day: count)) ?? ""
        let word = phrase.unicodeScalars.filter { !CharacterSet.decimalDigits.contains($0) }
        return String(String.UnicodeScalarView(word)).trimmingCharacters(in: .whitespacesAndNewlines.union(.punctuationCharacters))
    }

    /// A duration formatter in the watch's language: it takes its words from
    /// its calendar's locale, which is not the app's own unless set.
    static func components() -> DateComponentsFormatter {
        let formatter = DateComponentsFormatter()
        var calendar = Calendar.current
        calendar.locale = Locale.current
        formatter.calendar = calendar
        return formatter
    }

    static func dayOf(_ index: Int, _ total: Int) -> String {
        String(format: L("day.of"), index, total)
    }
}

// MARK: - The look

/// The watch's take on the widgets' look (TrekStyle.swift): black glass instead
/// of paper, the trip's own two colours as the light behind its pages, the
/// booking kinds' colours behind theirs.
enum WatchLook {
    static let ink = Color.white
    static let muted = Color.white.opacity(0.62)
    static let faint = Color.white.opacity(0.38)
    static let packing = Color(hex: 0x2FA37A)
    static let todo = Color(hex: 0x4A7DDB)

    /// The lights a trip's pages can have: clear, saturated hues that stay
    /// clean when they fade into black (no ochre or olive, which turn muddy).
    static let palette: [(Color, Color)] = [
        (Color(hex: 0x3D6FD8), Color(hex: 0x1C2E73)),
        (Color(hex: 0x2BA59A), Color(hex: 0x0E4E5A)),
        (Color(hex: 0x7A5AE0), Color(hex: 0x2E1F6B)),
        (Color(hex: 0xD2557A), Color(hex: 0x5C1A3A)),
        (Color(hex: 0x2E8BC0), Color(hex: 0x113A5C)),
        (Color(hex: 0xE0703C), Color(hex: 0x5E2414)),
        (Color(hex: 0x3FA866), Color(hex: 0x134A2C)),
    ]

    /// A trip's own two colours, picked by its id, so they do not change with
    /// its title or the language it is shown in.
    static func tripColors(_ trip: WatchSnapshot.Trip?) -> (Color, Color) {
        palette[(trip?.id ?? 1) % palette.count]
    }

    /// A trip's page light: its first colour at the top, fading into black.
    static func tripGradient(_ trip: WatchSnapshot.Trip?) -> LinearGradient {
        let (first, second) = tripColors(trip)
        return LinearGradient(colors: [first.opacity(0.85), second.opacity(0.6), .black], startPoint: .top, endPoint: .bottom)
    }

    static func tint(_ color: Color) -> LinearGradient {
        LinearGradient(colors: [color.opacity(0.75), color.opacity(0.28), .black], startPoint: .top, endPoint: .bottom)
    }

    static func stopColor(_ stop: WatchSnapshot.Stop) -> Color {
        if let kind = stop.booking { return Trek.booking(kind).color }
        return Color(css: stop.color) ?? Trek.info
    }

    static func stopSymbol(_ stop: WatchSnapshot.Stop) -> String {
        stop.symbol ?? (stop.booking.map { Trek.booking($0).symbol } ?? "mappin")
    }

    static func kindName(_ kind: String) -> String {
        L("kind.\(["flight", "train", "bus", "car", "cruise", "hotel", "restaurant", "event", "tour"].contains(kind) ? kind : "other")")
    }
}

/// The small capitals above a title.
struct WatchEyebrow: ViewModifier {
    var color: Color = WatchLook.muted
    func body(content: Content) -> some View {
        content
            .font(.system(.caption2, design: .rounded).weight(.bold))
            .textCase(.uppercase)
            .tracking(0.4)
            .foregroundStyle(color)
            .lineLimit(1)
            .minimumScaleFactor(0.65)
    }
}

extension View {
    /// Text a person wrote (a place, a booking, an item): when it is in Latin
    /// letters it is set as such, so in a Chinese, Japanese or Korean interface
    /// it still breaks between words rather than inside one.
    func userText(_ text: String?) -> some View {
        let latin = (text ?? "").unicodeScalars.allSatisfy { $0.value < 0x0250 || $0.properties.isWhitespace || $0.properties.generalCategory == .dashPunctuation || $0.properties.generalCategory == .otherPunctuation }
        return typesettingLanguage(Locale.Language(identifier: "en"), isEnabled: latin)
    }

    func watchEyebrow(_ color: Color = WatchLook.muted) -> some View { modifier(WatchEyebrow(color: color)) }

    /// A card of glass on watchOS 26, of frosted white before.
    @ViewBuilder
    func watchCard(cornerRadius: CGFloat = 18, tint: Color? = nil) -> some View {
        if #available(watchOS 26.0, iOS 26.0, macOS 26.0, *) {
            self.glassEffect(tint.map { Glass.regular.tint($0.opacity(0.35)) } ?? .regular, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        } else {
            self.background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill((tint ?? .white).opacity(tint == nil ? 0.12 : 0.28))
            )
        }
    }
}

/// A stop's category as a tinted disc with its symbol.
struct StopGlyph: View {
    let stop: WatchSnapshot.Stop
    var size: CGFloat = 26
    var dimmed = false

    var body: some View {
        let color = WatchLook.stopColor(stop)
        Circle()
            .fill(color.gradient)
            .frame(width: size, height: size)
            .overlay(
                Image(systemName: WatchLook.stopSymbol(stop))
                    .font(.system(size: size * 0.46, weight: .semibold))
                    .foregroundStyle(.white)
            )
            .opacity(dimmed ? 0.45 : 1)
            .accessibilityHidden(true)
    }
}

/// The TREK mark: four slanted tiles, as on the app icon.
struct TrekMark: Shape {
    func path(in rect: CGRect) -> Path {
        // The icon's tiles in its own 1024 grid, the mark spanning 270...754 by 256...768.
        let tiles: [[CGPoint]] = [
            [CGPoint(x: 382, y: 256), CGPoint(x: 621, y: 256), CGPoint(x: 558, y: 494), CGPoint(x: 318, y: 494)],
            [CGPoint(x: 620, y: 358), CGPoint(x: 754, y: 358), CGPoint(x: 718, y: 494), CGPoint(x: 585, y: 494)],
            [CGPoint(x: 302, y: 528), CGPoint(x: 438, y: 528), CGPoint(x: 405, y: 664), CGPoint(x: 270, y: 664)],
            [CGPoint(x: 468, y: 528), CGPoint(x: 706, y: 528), CGPoint(x: 644, y: 768), CGPoint(x: 404, y: 768)],
        ]
        let minX: CGFloat = 270, minY: CGFloat = 256, span: CGFloat = 512
        let scale = min(rect.width, rect.height) / span
        let dx = rect.minX + (rect.width - (754 - minX) * scale) / 2
        let dy = rect.minY + (rect.height - (768 - minY) * scale) / 2
        var path = Path()
        for tile in tiles {
            let points = tile.map { CGPoint(x: dx + ($0.x - minX) * scale, y: dy + ($0.y - minY) * scale) }
            path.addLines(points)
            path.closeSubpath()
        }
        return path
    }
}

/// A label and a value in a small tile: "SEAT 42A".
struct FactTile: View {
    let label: String
    let value: String
    var mono = false
    /// Laid out at its natural width, so a ViewThatFits can tell when a row of them is too wide.
    var fits = false

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).watchEyebrow(WatchLook.faint)
                .fixedSize(horizontal: fits, vertical: false)
            Text(value)
                .font(mono ? .system(.body, design: .monospaced).weight(.semibold) : .system(.body, design: .rounded).weight(.semibold))
                .foregroundStyle(WatchLook.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .watchCard(cornerRadius: 12)
        .accessibilityElement(children: .combine)
    }
}
