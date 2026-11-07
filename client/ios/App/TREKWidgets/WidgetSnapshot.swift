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
        var bags: [Bag]?
        var missing: [Item]?

        struct Bag: Codable, Hashable {
            var name: String
            /// #rrggbb
            var color: String
            var grams: Int
            /// The bag's weight limit in grams, if it has one.
            var limit: Int?
            var packed: Int
            var total: Int
        }

        struct Item: Codable, Hashable {
            var name: String
            var category: String?
            /// The colour of the bag it goes in.
            var color: String?
        }
    }

    /// The countries of the Atlas, independent of any trip.
    struct Atlas: Codable {
        var count: Int
        /// ISO 3166-1 alpha-2 codes.
        var codes: [String]
        var recent: [Country]
        var continents: [Continent]
        var trips: Int?
        var days: Int?

        struct Country: Codable, Hashable {
            var code: String
            var name: String
        }

        struct Continent: Codable, Hashable {
            var name: String
            var count: Int
        }
    }

    /// Who travels along, the trip chat and its open poll.
    struct Collab: Codable {
        var members: [Member]
        var messages: [Message]
        var poll: Poll?
        var path: String

        struct Member: Codable, Hashable {
            var name: String
            var initials: String
        }

        struct Message: Codable, Hashable {
            var author: String
            var initials: String
            var text: String
            var at: String?
            var mine: Bool
        }

        struct Poll: Codable {
            var question: String
            var options: [Option]
            var voters: Int

            struct Option: Codable, Hashable {
                var label: String
                var votes: Int
            }
        }
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
        var missing: String?
        var countries: String?
        var world: String?
        var group: String?
        var poll: String?
        var votes: String?
        var noMessages: String?
        var departure: String?
    }

    var trip: Trip?
    var today: Today?
    var weather: Weather?
    var bookings: [Booking]?
    var todos: Todos?
    var packing: Packing?
    var atlas: Atlas?
    var collab: Collab?
    var labels: Labels

    /// The dashboard's snapshot.
    static func load() -> WidgetSnapshot? {
        read("widget.snapshot").flatMap { try? JSONDecoder().decode(WidgetSnapshot.self, from: $0) }
    }

    /// The snapshot of the trip a widget is set to, the dashboard's for none or
    /// "auto", and the dashboard's too while the app has not written that trip yet.
    static func load(trip id: String?) -> WidgetSnapshot? {
        guard let id, id != "auto", let data = read("widget.trip.\(id)"),
              var snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data) else { return load() }
        if snapshot.atlas == nil { snapshot.atlas = load()?.atlas }
        return snapshot
    }

    /// A trip a widget can be set to, as the app lists them.
    struct TripRef: Codable {
        var id: Int
        var title: String
        var start: String
        var end: String
    }

    static func tripIndex() -> [TripRef] {
        read("widget.trips").flatMap { try? JSONDecoder().decode([TripRef].self, from: $0) } ?? []
    }

    private static func read(_ account: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.liketrek.trek.push",
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess else { return nil }
        return result as? Data
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
