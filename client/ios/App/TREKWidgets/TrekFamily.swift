import Foundation

/// The sizes the widget views draw for. Their own enum rather than WidgetKit's,
/// so the views also render outside a widget (the preview renderer in
/// client/ios/WidgetPreviews draws every size to a PNG on the CI's Mac).
enum TrekFamily: String, CaseIterable {
    case small, medium, large, circular, rectangular, inline

    var isAccessory: Bool { self == .circular || self == .rectangular || self == .inline }

    /// The point size of the family on a 6.1" iPhone, for the renderer.
    var previewSize: CGSize {
        switch self {
        case .small: return CGSize(width: 170, height: 170)
        case .medium: return CGSize(width: 364, height: 170)
        case .large: return CGSize(width: 364, height: 382)
        case .circular: return CGSize(width: 76, height: 76)
        case .rectangular: return CGSize(width: 172, height: 76)
        case .inline: return CGSize(width: 250, height: 26)
        }
    }
}

extension WidgetSnapshot {
    /// What the widget gallery shows before the app ever wrote a snapshot, and
    /// what the renderer draws: a trip to Kyoto with a full day, bookings and to-dos.
    static func sample(running: Bool, now: Date = Date()) -> WidgetSnapshot {
        let calendar = Calendar.current
        let iso: (Int) -> String = { offset in
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.string(from: calendar.date(byAdding: .day, value: offset, to: now) ?? now)
        }
        let start = running ? -2 : 12
        return WidgetSnapshot(
            trip: Trip(
                title: "Autumn in Kyoto", start: iso(start), end: iso(start + 8), path: "/trips/1",
                place: "Kyoto, Japan", cover: nil, dayCount: 9, placeCount: 34, memberCount: 3
            ),
            today: running
                ? Today(
                    dayLabel: "Day 3 of 9",
                    stops: [
                        Stop(time: "08:30", name: "Fushimi Inari Taisha", minutes: 510, color: "#D6273B", symbol: "building.columns.fill"),
                        Stop(time: "11:00", name: "Nishiki Market", minutes: 660, color: "#E8A13A", symbol: "basket.fill"),
                        Stop(time: "13:30", name: "Kiyomizu-dera", minutes: 810, color: "#2FA37A", symbol: "leaf.fill"),
                        Stop(time: "16:00", name: "Gion walk", minutes: 960, color: "#4A7DDB", symbol: "figure.walk"),
                        Stop(time: "19:30", name: "Dinner at Pontocho", minutes: 1170, color: "#8E6CD9", symbol: "fork.knife"),
                    ],
                    index: 3, total: 9
                )
                : nil,
            weather: Weather(temp: 18, high: 21, low: 11, main: running ? "Clear" : "Clouds", label: "Mostly sunny", place: "Kyoto", rain: 10),
            bookings: [
                Booking(title: "LH 716", kind: "flight", date: iso(running ? 6 : 12), time: "13:05", detail: "FRA → HND", confirmed: true, path: "/trips/1"),
                Booking(title: "Shinkansen Nozomi 21", kind: "train", date: iso(running ? 0 : 13), time: "09:12", detail: "Tokyo → Kyoto", confirmed: true, path: "/trips/1"),
                Booking(title: "Hotel Kanra Kyoto", kind: "hotel", date: iso(running ? 0 : 13), time: "15:00", detail: "6 nights", confirmed: true, path: "/trips/1"),
                Booking(title: "Kaiseki at Kikunoi", kind: "restaurant", date: iso(running ? 1 : 15), time: "19:00", detail: "Higashiyama", confirmed: false, path: "/trips/1"),
                Booking(title: "Tea ceremony", kind: "event", date: iso(running ? 2 : 16), time: "10:30", detail: "Camellia Flower", confirmed: true, path: "/trips/1"),
            ],
            todos: Todos(
                open: 4, total: 11,
                items: [
                    Todo(name: "Order JR Pass", due: iso(running ? 0 : 3), priority: 3),
                    Todo(name: "Book Ghibli Museum tickets", due: iso(running ? 1 : 5), priority: 2),
                    Todo(name: "Get yen in cash", due: nil, priority: 1),
                    Todo(name: "Download offline maps", due: nil, priority: 0),
                ],
                path: "/trips/1/todos"
            ),
            packing: Packing(packed: 23, total: 31, path: "/trips/1/packing"),
            labels: Labels(
                nextTrip: "Next trip", today: "Today", noTrip: "No trip coming up. Plan the next one in TREK.",
                inDays: "in {n} days", tomorrow: "Tomorrow", nothingPlanned: "Nothing planned today",
                days: "days", dayOf: "Day {n} of {m}", bookings: "Coming up", noBookings: "No bookings ahead",
                todos: "To-dos", noTodos: "All done", packing: "Packing", packed: "packed",
                confirmed: "Confirmed", pending: "Pending", todayShort: "Today", tomorrowShort: "Tomorrow",
                now: "Now", places: "places", travellers: "travellers", allDone: "Day done", openTrek: "Open TREK"
            )
        )
    }

    /// An empty state: no trip at all.
    static var sampleEmpty: WidgetSnapshot {
        var snapshot = sample(running: false)
        snapshot.trip = nil
        snapshot.today = nil
        snapshot.weather = nil
        snapshot.bookings = []
        snapshot.todos = Todos(open: 0, total: 0, items: [], path: "/")
        snapshot.packing = nil
        return snapshot
    }
}
