import Foundation

/// What the iPhone app last sent the watch (client/src/native/watch.ts builds
/// it, TrekWatchLink in the app passes it on through WatchConnectivity): the
/// trip the dashboard features, in full, so the watch shows it without a
/// network or a session of its own. Data only; every text the watch shows of
/// its own comes from its Localizable.strings, and it formats times itself.
///
/// Everything past `v`, `generatedAt` and `trip` is decoded leniently, so a
/// phone that is newer or older than this binary still gets through.
struct WatchSnapshot: Codable, Equatable {
    struct Trip: Codable, Equatable {
        var id: Int
        var title: String
        var start: String
        var end: String
        var place: String?
        /// A small base64 JPEG of the cover, when the phone had one that fit.
        var cover: String?
    }

    struct Stop: Codable, Equatable, Hashable {
        var name: String
        var minutes: Int?
        var endMinutes: Int?
        var symbol: String?
        var color: String?
        var address: String?
        var lat: Double?
        var lng: Double?
        /// The booking kind when the stop is a booking (flight, hotel, ...).
        var booking: String?
        var note: String?
    }

    struct Day: Codable, Equatable, Hashable {
        var date: String?
        var number: Int
        var title: String?
        var stops: [Stop]
    }

    struct Point: Codable, Equatable, Hashable {
        var name: String
        var code: String?
        var lat: Double?
        var lng: Double?
    }

    struct Booking: Codable, Equatable, Hashable, Identifiable {
        var id: Int
        var title: String
        var kind: String
        var confirmed: Bool
        var date: String?
        var time: String?
        var endDate: String?
        var endTime: String?
        var zone: String?
        /// The zone the end time is local to (the arrival airport's), when the booking names one.
        var endZone: String?
        var from: Point?
        var to: Point?
        var code: String?
        var carrier: String?
        var seat: String?
        var platform: String?
        var location: String?
        var lat: Double?
        var lng: Double?
        var checkIn: String?
        var checkOut: String?
    }

    struct Weather: Codable, Equatable {
        var temp: Int
        var high: Int?
        var low: Int?
        var main: String
        var label: String
        var place: String?
        var rain: Int?
    }

    struct Item: Codable, Equatable, Hashable, Identifiable {
        var id: Int
        var name: String
        var done: Bool
        var group: String?
        var due: String?
        var priority: Int?
    }

    struct Packing: Codable, Equatable {
        var items: [Item]
        var packed: Int
        var total: Int
    }

    struct Todos: Codable, Equatable {
        var items: [Item]
        var open: Int
        var total: Int
    }

    var v: Int
    var generatedAt: String
    var hour12: Bool
    var trip: Trip?
    var days: [Day]
    var bookings: [Booking]
    var weather: Weather?
    var packing: Packing?
    var todos: Todos?
    var applied: [String]

    init(v: Int = 1, generatedAt: String, hour12: Bool = false, trip: Trip?, days: [Day] = [], bookings: [Booking] = [],
         weather: Weather? = nil, packing: Packing? = nil, todos: Todos? = nil, applied: [String] = []) {
        self.v = v
        self.generatedAt = generatedAt
        self.hour12 = hour12
        self.trip = trip
        self.days = days
        self.bookings = bookings
        self.weather = weather
        self.packing = packing
        self.todos = todos
        self.applied = applied
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        v = (try? c.decode(Int.self, forKey: .v)) ?? 1
        generatedAt = (try? c.decode(String.self, forKey: .generatedAt)) ?? ""
        hour12 = (try? c.decode(Bool.self, forKey: .hour12)) ?? false
        trip = try? c.decodeIfPresent(Trip.self, forKey: .trip)
        days = (try? c.decode([Day].self, forKey: .days)) ?? []
        bookings = (try? c.decode([Booking].self, forKey: .bookings)) ?? []
        weather = try? c.decodeIfPresent(Weather.self, forKey: .weather)
        packing = try? c.decodeIfPresent(Packing.self, forKey: .packing)
        todos = try? c.decodeIfPresent(Todos.self, forKey: .todos)
        applied = (try? c.decode([String].self, forKey: .applied)) ?? []
    }

    static func decode(_ data: Data) -> WatchSnapshot? {
        try? JSONDecoder().decode(WatchSnapshot.self, from: data)
    }

    var generated: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: generatedAt) ?? ISO8601DateFormatter().date(from: generatedAt)
    }
}

// MARK: - Dates

/// Days and times as the watch reads them: always in the time zone it is in
/// now (it may have flown since the last launch), and times of day as wall-clock
/// hours and minutes, never as minutes added to midnight, which are an hour off
/// on the days the clocks change.
enum TrekDate {
    /// The start of yyyy-MM-dd here.
    static func day(_ iso: String?) -> Date? {
        guard let iso, iso.count >= 10 else { return nil }
        let ymd = iso.prefix(10).split(separator: "-").compactMap { Int($0) }
        guard ymd.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: ymd[0], month: ymd[1], day: ymd[2]))
    }

    static func iso(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    /// yyyy-MM-dd and HH:mm as a moment, in `zone` when given, else here; midnight without a time.
    static func moment(_ date: String?, _ time: String?, zone: String? = nil) -> Date? {
        guard let date, date.count >= 10 else { return nil }
        let ymd = date.prefix(10).split(separator: "-").compactMap { Int($0) }
        guard ymd.count == 3 else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone.flatMap(TimeZone.init(identifier:)) ?? .current
        let m = minutes(time) ?? 0
        return calendar.date(from: DateComponents(year: ymd[0], month: ymd[1], day: ymd[2], hour: m / 60, minute: m % 60))
    }

    /// "13:05" or "1:05 PM" to minutes after midnight.
    static func minutes(_ time: String?) -> Int? {
        guard let time else { return nil }
        let pieces = time.split(separator: ":")
        guard pieces.count >= 2, let hour = Int(pieces[0].trimmingCharacters(in: .whitespaces)),
              let minute = Int(pieces[1].prefix(2)) else { return nil }
        var h = hour
        let upper = time.uppercased()
        if upper.contains("PM"), h < 12 { h += 12 }
        if upper.contains("AM"), h == 12 { h = 0 }
        return h * 60 + minute
    }

    static func daysBetween(_ from: Date, _ to: Date) -> Int {
        let calendar = Calendar.current
        return calendar.dateComponents([.day], from: calendar.startOfDay(for: from), to: calendar.startOfDay(for: to)).day ?? 0
    }

    static func minutesOfDay(_ date: Date) -> Int {
        let parts = Calendar.current.dateComponents([.hour, .minute], from: date)
        return (parts.hour ?? 0) * 60 + (parts.minute ?? 0)
    }

    /// The moment the clock shows `minutes` after midnight on `day`.
    static func at(_ minutes: Int, on day: Date) -> Date {
        let m = min(max(minutes, 0), 24 * 60 - 1)
        return Calendar.current.date(bySettingHour: m / 60, minute: m % 60, second: 0, of: day) ?? day
    }
}

// MARK: - What the screens ask of a snapshot

extension WatchSnapshot {
    enum Phase: Equatable {
        /// The trip starts in this many days (0 = today, before its first day is in the plan).
        case upcoming(days: Int)
        /// The trip runs; the 1-based index of today and the number of days.
        case running(day: Int, of: Int)
        /// The trip is over.
        case past
        case none
    }

    func phase(at now: Date) -> Phase {
        guard let trip, let start = TrekDate.day(trip.start) else { return .none }
        let end = TrekDate.day(trip.end) ?? start
        let untilStart = TrekDate.daysBetween(now, start)
        if untilStart > 0 { return .upcoming(days: untilStart) }
        if TrekDate.daysBetween(now, end) < 0 { return .past }
        let total = max(days.count, TrekDate.daysBetween(start, end) + 1, 1)
        let index = (todayIndex(at: now).map { days[$0].number }) ?? (TrekDate.daysBetween(start, now) + 1)
        return .running(day: min(max(index, 1), total), of: total)
    }

    /// The position of today in `days`, when the plan has a day with today's date.
    func todayIndex(at now: Date) -> Int? {
        let iso = TrekDate.iso(now)
        return days.firstIndex { $0.date == iso }
    }

    func today(at now: Date) -> Day? {
        todayIndex(at: now).map { days[$0] }
    }

    var tripLength: Int {
        guard let trip, let start = TrekDate.day(trip.start), let end = TrekDate.day(trip.end) else { return max(days.count, 1) }
        return max(days.count, TrekDate.daysBetween(start, end) + 1, 1)
    }

    /// The bookings that have not ended yet, soonest first.
    func bookingsAhead(at now: Date) -> [Booking] {
        let today = Calendar.current.startOfDay(for: now)
        return bookings.filter { booking in
            if let end = booking.end, booking.endTime != nil || booking.endDate != booking.date {
                if end >= now { return true }
            }
            guard let day = TrekDate.day(booking.date) else { return true }
            guard let start = booking.start, booking.time != nil else { return day >= today }
            return start >= now.addingTimeInterval(-30 * 60)
        }
    }

    /// The next booking worth a countdown: one not yet started, else a running stay.
    func nextBooking(at now: Date) -> Booking? {
        let ahead = bookingsAhead(at: now)
        return ahead.first { booking in
            guard let start = booking.start else { return false }
            return start >= now.addingTimeInterval(-30 * 60)
        } ?? ahead.first
    }
}

extension WatchSnapshot.Booking {
    var start: Date? { TrekDate.moment(date, time, zone: zone) }
    /// The end in the arrival's zone; a ride without one ends in the zone the watch is in, never the departure's.
    var end: Date? { TrekDate.moment(endDate ?? date, endTime, zone: endZone ?? (isTransport ? nil : zone)) }

    /// A booking with a day but no time lasts the whole day: there is nothing to count down to.
    var isAllDay: Bool { time == nil }

    var isTransport: Bool { ["flight", "train", "bus", "car", "cruise"].contains(kind) }

    /// "FRA → HND" from the codes, else the names, for a transport with both ends.
    var route: String? {
        guard let from, let to else { return nil }
        return "\(from.code ?? from.name) → \(to.code ?? to.name)"
    }

    /// Where Directions goes: the departure for a ride, the place itself for the rest.
    var destination: (name: String, lat: Double, lng: Double)? {
        if isTransport, let from, let lat = from.lat, let lng = from.lng { return (from.name, lat, lng) }
        if let lat, let lng { return (location ?? title, lat, lng) }
        return nil
    }
}

extension WatchSnapshot.Day {
    var dateValue: Date? { TrekDate.day(date) }
}

extension WatchSnapshot.Stop {
    var hasLocation: Bool { lat != nil && lng != nil }
}
