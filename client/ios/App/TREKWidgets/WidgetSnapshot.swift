import Foundation
import Security

/// What the app last told the widgets (native/widgets.ts writes it through
/// TrekShell.setWidgetSnapshot into the keychain group the app and its
/// extensions share). Texts arrive already translated, so the widget needs no
/// localisation of its own and always speaks the language the app does.
///
/// Everything past `trip`, `today` and `labels` is optional: a binary that is
/// newer than the server's UI shows what it gets, an older one ignores the rest.
struct WidgetSnapshot: Codable {
    struct Trip: Codable {
        var title: String
        var start: String
        var end: String
        var path: String
        /// The destination in a few words ("Tokyo, Japan").
        var place: String?
        /// The trip's cover, a small JPEG as base64, already cropped for a widget.
        var cover: String?
        var dayCount: Int?
        var placeCount: Int?
        var memberCount: Int?
    }

    struct Stop: Codable, Hashable {
        var time: String?
        var name: String
        /// Minutes after midnight, for the now line.
        var minutes: Int?
        /// The category colour as #rrggbb.
        var color: String?
        /// An SF Symbol name for the stop's kind.
        var symbol: String?
    }

    struct Today: Codable {
        var dayLabel: String
        var stops: [Stop]
        /// 1-based position of today in the trip.
        var index: Int?
        var total: Int?
    }

    struct Weather: Codable {
        var temp: Int
        var high: Int?
        var low: Int?
        /// The provider's main condition ("Clear", "Clouds", "Rain", ...).
        var main: String
        var label: String
        var place: String?
        /// Chance of rain in percent.
        var rain: Int?
    }

    struct Booking: Codable, Hashable {
        var title: String
        /// flight, train, bus, car, cruise, hotel, restaurant, event, tour, other
        var kind: String
        /// yyyy-MM-dd, for the relative day.
        var date: String?
        var time: String?
        /// "FRA → HND", the location or the hotel's nights.
        var detail: String?
        var confirmed: Bool
        var path: String
    }

    struct Todo: Codable, Hashable {
        var name: String
        var due: String?
        /// 0 none, 1 low, 2 medium, 3 high.
        var priority: Int
    }

    struct Todos: Codable {
        var open: Int
        var total: Int
        var items: [Todo]
        var path: String
    }

    struct Packing: Codable {
        var packed: Int
        var total: Int
        var path: String
    }

    struct Labels: Codable {
        var nextTrip: String
        var today: String
        var noTrip: String
        /// Contains "{n}".
        var inDays: String
        var tomorrow: String
        var nothingPlanned: String
        var days: String?
        var dayOf: String?
        var bookings: String?
        var noBookings: String?
        var todos: String?
        var noTodos: String?
        var packing: String?
        var packed: String?
        var confirmed: String?
        var pending: String?
        var todayShort: String?
        var tomorrowShort: String?
        var now: String?
        var places: String?
        var travellers: String?
        var allDone: String?
        var openTrek: String?
    }

    var trip: Trip?
    var today: Today?
    var weather: Weather?
    var bookings: [Booking]?
    var todos: Todos?
    var packing: Packing?
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
        return WidgetSnapshot.daysBetween(now, start)
    }

    /// The trip's length in days, from its dates when the app sent no count.
    var tripLength: Int? {
        if let count = trip?.dayCount, count > 0 { return count }
        guard let trip, let start = WidgetSnapshot.day(trip.start), let end = WidgetSnapshot.day(trip.end),
              let days = WidgetSnapshot.daysBetween(start, end) else { return nil }
        return days + 1
    }

    static func daysBetween(_ from: Date, _ to: Date) -> Int? {
        let calendar = Calendar.current
        return calendar.dateComponents([.day], from: calendar.startOfDay(for: from), to: calendar.startOfDay(for: to)).day
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
