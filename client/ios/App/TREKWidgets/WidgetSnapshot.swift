import Foundation
import Security

/// What the app last told the widgets (native/widgets.ts writes it through
/// TrekShell.setWidgetSnapshot into the keychain group the app and its
/// extensions share). Texts arrive already translated, so the widget needs no
/// localisation of its own and always speaks the language the app does.
struct WidgetSnapshot: Codable {
    struct Trip: Codable {
        var title: String
        var start: String
        var end: String
        var path: String
    }

    struct Stop: Codable, Hashable {
        var time: String?
        var name: String
    }

    struct Today: Codable {
        var dayLabel: String
        var stops: [Stop]
    }

    struct Labels: Codable {
        var nextTrip: String
        var today: String
        var noTrip: String
        /// Contains "{n}".
        var inDays: String
        var tomorrow: String
        var nothingPlanned: String
    }

    var trip: Trip?
    var today: Today?
    var labels: Labels

    static func load() -> WidgetSnapshot? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.liketrek.trek.push",
            kSecAttrAccount as String: "widget.snapshot",
            kSecReturnData as String: true,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }

    /// Whole days from today to the trip's start, in the device's calendar.
    func daysUntilStart(from now: Date = Date()) -> Int? {
        guard let trip, let start = WidgetSnapshot.day(trip.start) else { return nil }
        let calendar = Calendar.current
        return calendar.dateComponents([.day], from: calendar.startOfDay(for: now), to: start).day
    }

    static func day(_ iso: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: String(iso.prefix(10)))
    }

    /// The app link a tap opens: com.liketrek.trek://navigate<path>.
    static func link(_ path: String) -> URL? {
        URL(string: "com.liketrek.trek://navigate\(path.hasPrefix("/") ? path : "/" + path)")
    }
}
