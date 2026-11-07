import SwiftUI
import WatchKit

/// The 40 and 41 mm cases, where a line less decides whether a screen ends clean.
enum WatchScreen {
    static let compact = WKInterfaceDevice.current().screenBounds.width < 180
}

// MARK: - Today

/// The trip day at a glance: what is on now or next, how long until it, how
/// far the day has come and what follows. A tap opens the stop.
struct TodayPage: View {
    let snapshot: WatchSnapshot
    @Environment(\.trekNow) private var now
    @Environment(\.isLuminanceReduced) private var reduced

    var body: some View {
        let todayIndex = snapshot.todayIndex(at: now)
        let day = todayIndex.map { snapshot.days[$0] }
        let stops = day?.stops ?? []
        let nowMinutes = TrekDate.minutesOfDay(now)
        let currentIndex = stops.firstIndex { stop in
            guard let start = stop.minutes, let end = stop.endMinutes else { return false }
            return start <= nowMinutes && nowMinutes < end
        }
        let nextIndex = stops.firstIndex { ($0.minutes ?? -1) >= nowMinutes }
        let focus = currentIndex ?? nextIndex
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                header
                if let focus, let todayIndex {
                    NavigationLink(value: Route.stop(day: todayIndex, stop: focus)) {
                        FocusCard(
                            stop: stops[focus],
                            isNow: focus == currentIndex,
                            hour12: snapshot.hour12,
                            then: reduced ? nil : stops.dropFirst(focus + 1).first
                        )
                    }
                    .buttonStyle(.plain)
                    DayProgressBar(stops: stops, nowMinutes: nowMinutes)
                        .padding(.horizontal, 2)
                } else if stops.isEmpty {
                    DoneCard(title: L("today.free"), detail: L("today.freeBody"), symbol: "sun.max.fill")
                } else {
                    DoneCard(title: L("today.done"), detail: L("today.doneBody"), symbol: "checkmark.circle.fill")
                }
            }
        }
        .contentMargins(.horizontal, 5, for: .scrollContent)
        .containerBackground(WatchLook.tripGradient(snapshot.trip), for: .tabView)
        .toolbar {
            if let weather = snapshot.weather {
                ToolbarItem(placement: .topBarTrailing) { WeatherBadge(weather: weather) }
            }
        }
    }

    /// The day and the trip; a tap opens the whole day's timeline.
    @ViewBuilder
    private var header: some View {
        if case .running(let index, let total) = snapshot.phase(at: now), let todayIndex = snapshot.todayIndex(at: now) {
            NavigationLink(value: Route.day(todayIndex)) {
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 3) {
                        Text(WatchFormat.dayOf(index, total)).watchEyebrow(.white.opacity(0.85))
                        Image(systemName: "chevron.forward")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundStyle(WatchLook.muted)
                    }
                    Text(snapshot.trip?.title ?? "").userText((snapshot.trip?.title ?? ""))
                        .font(.system(.footnote, design: .rounded).weight(.semibold))
                        .foregroundStyle(WatchLook.muted)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityElement(children: .combine)
            .accessibilityHint(L("today.plan"))
        }
    }
}

/// The stop that is on now or comes next, large.
struct FocusCard: View {
    let stop: WatchSnapshot.Stop
    let isNow: Bool
    let hour12: Bool
    /// The stop after it, in a line at the foot.
    var then: WatchSnapshot.Stop?
    @Environment(\.trekNow) private var now

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .center, spacing: 6) {
                StopGlyph(stop: stop, size: 24)
                Text(L(isNow ? "today.now" : "today.next"))
                    .watchEyebrow(isNow ? Trek.confirmed : WatchLook.muted)
                Spacer(minLength: 0)
            }
            Text(stop.name).userText(stop.name)
                .font(.system(WatchScreen.compact ? .headline : .title3, design: .rounded).weight(.bold))
                .foregroundStyle(WatchLook.ink)
                .lineLimit(2)
                .minimumScaleFactor(0.75)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                if let times = timeRange {
                    Text(times)
                        .font(.system(.footnote, design: .rounded).weight(.medium).monospacedDigit())
                        .foregroundStyle(WatchLook.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                Spacer(minLength: 2)
                if let target = countdownTarget, target > now {
                    Text(WatchFormat.relative(target, now: now))
                        .font(.system(.footnote, design: .rounded).weight(.bold))
                        .foregroundStyle(isNow ? WatchLook.muted : Trek.confirmed)
                        .lineLimit(1)
                        .layoutPriority(1)
                }
            }
            if let then {
                Divider().overlay(Color.white.opacity(0.12)).padding(.vertical, 2)
                HStack(spacing: 5) {
                    Image(systemName: "arrow.turn.down.right")
                        .foregroundStyle(WatchLook.faint)
                    if let minutes = then.minutes {
                        Text(WatchFormat.time(minutes: minutes, hour12: hour12)).monospacedDigit()
                            .foregroundStyle(WatchLook.muted)
                    }
                    Text(then.name).userText(then.name)
                        .foregroundStyle(WatchLook.ink.opacity(0.85))
                        .lineLimit(1)
                }
                .font(.system(.caption, design: .rounded).weight(.semibold))
                .accessibilityElement(children: .combine)
                .accessibilityLabel("\(L("today.later")): \(then.name)")
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .watchCard()
        .accessibilityElement(children: .combine)
    }

    /// Next: until it starts. Now: until it ends.
    private var countdownTarget: Date? {
        guard !isNow, let minutes = stop.minutes else { return nil }
        let start = TrekDate.at(minutes, on: now)
        return start.timeIntervalSince(now) >= 60 ? start : nil
    }

    private var timeRange: String? {
        guard let start = stop.minutes else { return nil }
        let from = WatchFormat.time(minutes: start, hour12: hour12)
        guard let end = stop.endMinutes else { return from }
        return "\(from) – \(WatchFormat.time(minutes: end, hour12: hour12))"
    }
}

/// The day's timed stops as segments, those behind filled.
struct DayProgressBar: View {
    let stops: [WatchSnapshot.Stop]
    let nowMinutes: Int

    var body: some View {
        let timed = stops.filter { $0.minutes != nil }
        if timed.count > 1 {
            HStack(spacing: 3) {
                ForEach(Array(timed.enumerated()), id: \.offset) { _, stop in
                    Capsule()
                        .fill((stop.minutes ?? 0) < nowMinutes ? WatchLook.stopColor(stop) : Color.white.opacity(0.18))
                        .frame(height: 4)
                }
            }
            .accessibilityHidden(true)
        }
    }
}

struct CompactStopRow: View {
    let stop: WatchSnapshot.Stop
    let hour12: Bool

    var body: some View {
        HStack(spacing: 8) {
            StopGlyph(stop: stop, size: 20)
            Text(stop.name).userText(stop.name)
                .font(.system(.footnote, design: .rounded).weight(.semibold))
                .foregroundStyle(WatchLook.ink)
                .lineLimit(1)
            Spacer(minLength: 4)
            if let minutes = stop.minutes {
                Text(WatchFormat.time(minutes: minutes, hour12: hour12))
                    .font(.system(.caption2, design: .rounded).weight(.semibold).monospacedDigit())
                    .foregroundStyle(WatchLook.muted)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}

struct DoneCard: View {
    let title: String
    let detail: String
    let symbol: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: symbol)
                .font(.title2)
                .symbolRenderingMode(.multicolor)
                .foregroundStyle(Trek.confirmed)
            Text(title).font(.system(.headline, design: .rounded)).foregroundStyle(WatchLook.ink)
            Text(detail).userText(detail).font(.footnote).foregroundStyle(WatchLook.muted)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .watchCard()
        .accessibilityElement(children: .combine)
    }
}

struct WeatherBadge: View {
    let weather: WatchSnapshot.Weather

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: Trek.weatherSymbol(weather.main)).symbolRenderingMode(.multicolor)
            Text("\(weather.temp)°").monospacedDigit()
        }
        .font(.system(.footnote, design: .rounded).weight(.semibold))
        .accessibilityLabel("\(weather.label), \(weather.temp)°")
    }
}

// MARK: - Before the trip

/// The days to the trip, big, over its cover or its own colours.
struct CountdownPage: View {
    let snapshot: WatchSnapshot
    let days: Int
    @ScaledMetric(relativeTo: .largeTitle) private var numberSize: CGFloat = 54

    var body: some View {
        let trip = snapshot.trip
        VStack(alignment: .leading, spacing: 2) {
            Text(L("countdown.title")).watchEyebrow(.white.opacity(0.85))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(days)")
                    .font(.system(size: numberSize, weight: .heavy, design: .rounded).monospacedDigit())
                    .minimumScaleFactor(0.5)
                Text(WatchFormat.daysUnit(days))
                    .font(.system(.headline, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
            }
            .foregroundStyle(.white)
            Text(trip?.title ?? "").userText((trip?.title ?? ""))
                .font(.system(.headline, design: .rounded))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
            HStack(spacing: 4) {
                if let range = trip.flatMap({ WatchFormat.range($0.start, $0.end) }) {
                    Text(range)
                }
                if let place = trip?.place?.split(separator: ",").first {
                    Text("·")
                    Text(place)
                }
            }
            .font(.system(.caption2, design: .rounded).weight(.semibold))
            .foregroundStyle(.white.opacity(0.75))
            .lineLimit(1)
            RouteArc(progress: 1 - min(Double(days), 60) / 60, color: .white)
                .frame(height: 20)
                .padding(.top, 6)
                .accessibilityHidden(true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .padding(.horizontal, 5)
        .containerBackground(for: .tabView) {
            if trip?.cover != nil {
                TripBackdrop(trip: widgetTrip(trip), shade: 0.7)
            } else {
                let (first, second) = WatchLook.tripColors(trip)
                ZStack {
                    LinearGradient(colors: [first, second, .black], startPoint: .topLeading, endPoint: .bottom)
                    ContourLines(seed: UInt64(trip?.id ?? 1) % 997, rings: 11)
                        .stroke(Color.white.opacity(0.12), lineWidth: 0.9)
                }
            }
        }
        .toolbar {
            if let weather = snapshot.weather {
                ToolbarItem(placement: .topBarTrailing) { WeatherBadge(weather: weather) }
            }
        }
    }

    private func widgetTrip(_ trip: WatchSnapshot.Trip?) -> WidgetSnapshot.Trip? {
        trip.map { WidgetSnapshot.Trip(title: $0.title, start: $0.start, end: $0.end, path: "", place: $0.place, cover: $0.cover) }
    }
}

// MARK: - The next booking

/// The next flight, train, hotel or table: where to, when, the countdown, and
/// what is asked for at the gate or the desk.
struct BookingPage: View {
    let booking: WatchSnapshot.Booking
    let hour12: Bool

    var body: some View {
        ScrollView {
            NavigationLink(value: Route.booking(booking.id)) {
                BookingSummary(booking: booking, hour12: hour12, compactFacts: true)
            }
            .buttonStyle(.plain)
        }
        .contentMargins(.horizontal, 5, for: .scrollContent)
        .containerBackground(WatchLook.tint(Trek.booking(booking.kind).color), for: .tabView)

    }
}

/// The head of a booking, shared by its page and its detail.
struct BookingSummary: View {
    let booking: WatchSnapshot.Booking
    let hour12: Bool
    var showFacts = true
    /// The page's single row of facts rather than all of them.
    var compactFacts = false
    @Environment(\.trekNow) private var now

    var body: some View {
        VStack(alignment: .leading, spacing: WatchScreen.compact ? 4 : 6) {
            // The kind and the status in one line ("FLIGHT · Confirmed"), the status under it when that is too long.
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 5) {
                    KindBadge(kind: booking.kind, size: 20)
                    kindLabel.fixedSize()
                    status.fixedSize()
                    Spacer(minLength: 0)
                }
                HStack(spacing: 6) {
                    KindBadge(kind: booking.kind, size: 22)
                    VStack(alignment: .leading, spacing: 0) {
                        kindLabel
                        status
                    }
                    Spacer(minLength: 0)
                }
            }
            .accessibilityElement(children: .combine)
            if let route = booking.route {
                Text(route)
                    .font(.system(.title2, design: .rounded).weight(.heavy))
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                Text(booking.carrier ?? booking.title)
                    .font(.system(WatchScreen.compact ? .caption : .footnote, design: .rounded).weight(.medium))
                    .foregroundStyle(WatchLook.muted)
                    .lineLimit(1)
            } else {
                Text(booking.title).userText(booking.title)
                    .font(.system(.title3, design: .rounded).weight(.bold))
                    .lineLimit(2)
                    .minimumScaleFactor(0.75)
            }
            timing
            if showFacts { facts }
        }
        .foregroundStyle(WatchLook.ink)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// The time it starts (or, for a stay under way, ends), its day, and how long until then, in one line.
    @ViewBuilder
    private var timing: some View {
        let running = booking.kind == "hotel" && (booking.start ?? .distantFuture) < now
        let moment = running ? booking.end : booking.start
        let clock = running ? booking.checkOut ?? booking.endTime : booking.time
        if let moment {
            // The day goes first when the line is too short for all three.
            let label = running ? L("booking.checkOut") : dayLabel(moment)
            ViewThatFits(in: .horizontal) {
                timeLine(clock: clock, label: label, moment: moment, pill: true)
                timeLine(clock: clock, label: nil, moment: moment, pill: true)
                VStack(alignment: .leading, spacing: 4) {
                    timeLine(clock: clock, label: label, moment: moment, pill: false)
                    countdownPill(moment)
                }
            }
        }
    }

    private func timeLine(clock: String?, label: String?, moment: Date, pill: Bool) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 5) {
            if let clock, let minutes = TrekDate.minutes(clock) {
                Text(WatchFormat.time(minutes: minutes, hour12: hour12))
                    .font(.system(.title3, design: .rounded).weight(.bold).monospacedDigit())
                    .fixedSize()
            }
            if let label {
                Text(label)
                    .font(.system(.caption2, design: .rounded).weight(.semibold))
                    .foregroundStyle(WatchLook.muted)
                    .fixedSize()
            }
            if pill {
                Spacer(minLength: 4)
                countdownPill(moment)
            }
        }
    }

    @ViewBuilder
    private func countdownPill(_ moment: Date) -> some View {
        if moment > now {
            Text(WatchFormat.relative(moment, now: now))
                .font(.system(.caption2, design: .rounded).weight(.bold))
                .foregroundStyle(.white)
                .fixedSize()
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(Capsule().fill(Trek.booking(booking.kind).color.opacity(0.85)))
        }
    }

    private var kindLabel: some View {
        Text(WatchLook.kindName(booking.kind))
            .font(.system(.caption2, design: .rounded).weight(.bold))
            .textCase(.uppercase)
            .tracking(0.4)
            .foregroundStyle(.white.opacity(0.85))
            .lineLimit(1)
    }

    private var status: some View {
        HStack(spacing: 4) {
            Circle().fill(booking.confirmed ? Trek.confirmed : Trek.pending).frame(width: 5, height: 5)
            Text(L(booking.confirmed ? "booking.confirmed" : "booking.pending"))
                .font(.system(.caption2, design: .rounded).weight(.medium))
                .foregroundStyle(WatchLook.muted)
                .lineLimit(1)
        }
    }

    private var factTiles: [(label: String, value: String)] {
        var tiles: [(label: String, value: String)] = []
        if let seat = booking.seat { tiles.append((L("booking.seat"), seat)) }
        if let platform = booking.platform { tiles.append((L("booking.platform"), platform)) }
        if booking.kind == "hotel", let checkIn = TrekDate.minutes(booking.checkIn) {
            tiles.append((L("booking.checkIn"), WatchFormat.time(minutes: checkIn, hour12: hour12)))
        }
        return tiles
    }

    private func dayLabel(_ date: Date) -> String {
        let days = TrekDate.daysBetween(now, date)
        if days == 0 { return L("time.today") }
        if days == 1 { return L("time.tomorrow") }
        return WatchFormat.day(date)
    }

    /// On the page one row, the reference and the seat; in the detail all of them.
    @ViewBuilder
    private var facts: some View {
        let tiles = factTiles
        if compactFacts {
            let row = [booking.code.map { (L("booking.ref"), $0, true) }, tiles.first.map { ($0.label, $0.value, false) }].compactMap { $0 }
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 6) {
                    ForEach(row, id: \.0) { FactTile(label: $0.0, value: $0.1, mono: $0.2, fits: true) }
                }
                VStack(spacing: 6) {
                    ForEach(row, id: \.0) { FactTile(label: $0.0, value: $0.1, mono: $0.2) }
                }
            }
        } else {
            factsInFull(tiles)
        }
    }

    @ViewBuilder
    private func factsInFull(_ tiles: [(label: String, value: String)]) -> some View {
        if !tiles.isEmpty {
            HStack(spacing: 6) {
                ForEach(tiles.prefix(2), id: \.label) { tile in
                    FactTile(label: tile.label, value: tile.value)
                }
            }
        }
        if let code = booking.code {
            FactTile(label: L("booking.ref"), value: code, mono: true)
        }
    }
}

// MARK: - The trip

/// The trip as a whole: how far along, and the ways into its days, bookings and lists.
struct TripPage: View {
    let snapshot: WatchSnapshot
    @Environment(\.trekNow) private var now

    var body: some View {
        let trip = snapshot.trip
        let total = snapshot.tripLength
        let index: Int = {
            if case .running(let day, _) = snapshot.phase(at: now) { return day }
            return 0
        }()
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 10) {
                    ProgressRing(value: Double(index) / Double(max(total, 1)), lineWidth: 5, colors: [.white.opacity(0.7), .white], trackColor: .white.opacity(0.2)) {
                        VStack(spacing: -2) {
                            Text(index > 0 ? "\(index)" : "\(total)")
                                .font(.system(.headline, design: .rounded).weight(.heavy).monospacedDigit())
                            Text(index > 0 ? "/\(total)" : WatchFormat.daysUnit(total))
                                .font(.system(size: 9, weight: .bold, design: .rounded))
                                .foregroundStyle(WatchLook.muted)
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                        }
                        .padding(4)
                    }
                    .frame(width: 46, height: 46)
                    .accessibilityLabel(index > 0 ? WatchFormat.dayOf(index, total) : "\(total) \(WatchFormat.daysUnit(total))")
                    VStack(alignment: .leading, spacing: 1) {
                        Text(trip?.title ?? "").userText((trip?.title ?? ""))
                            .font(.system(.headline, design: .rounded))
                            .lineLimit(2)
                            .minimumScaleFactor(0.8)
                        if let range = trip.flatMap({ WatchFormat.range($0.start, $0.end) }) {
                            Text(range)
                                .font(.system(.caption2, design: .rounded).weight(.semibold))
                                .foregroundStyle(WatchLook.muted)
                                .lineLimit(1)
                        }
                    }
                }
                NavigationLink(value: Route.days) {
                    MenuRow(symbol: "calendar", color: Trek.info, title: L("trip.days"), value: "\(total)")
                }
                if !snapshot.bookings.isEmpty {
                    NavigationLink(value: Route.bookings) {
                        MenuRow(symbol: "ticket.fill", color: Trek.booking("event").color, title: L("booking.all"), value: "\(snapshot.bookingsAhead(at: now).count)")
                    }
                }
                if let packing = snapshot.packing {
                    NavigationLink(value: Route.packing) {
                        MenuRow(symbol: "suitcase.rolling.fill", color: WatchLook.packing, title: L("packing.title"), value: "\(packing.packed)/\(packing.total)")
                    }
                }
                if let todos = snapshot.todos {
                    NavigationLink(value: Route.todos) {
                        MenuRow(symbol: "checklist", color: WatchLook.todo, title: L("todos.title"), value: "\(todos.open)")
                    }
                }
            }
            .buttonStyle(.plain)
            .foregroundStyle(WatchLook.ink)
        }
        .contentMargins(.horizontal, 5, for: .scrollContent)
        .containerBackground(WatchLook.tripGradient(trip), for: .tabView)

    }
}

/// A way into a part of the trip: its symbol, its name, a count.
struct MenuRow: View {
    let symbol: String
    let color: Color
    let title: String
    let value: String?

    var body: some View {
        let compact = WatchScreen.compact
        HStack(spacing: compact ? 6 : 8) {
            Image(systemName: symbol)
                .font(.system(size: compact ? 11 : 13, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: compact ? 22 : 26, height: compact ? 22 : 26)
                .background(Circle().fill(color.gradient))
            Text(title)
                .font(.system(compact ? .callout : .body, design: .rounded).weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.78)
                .allowsTightening(true)
            Spacer(minLength: 2)
            if let value {
                Text(value)
                    .font(.system(.footnote, design: .rounded).weight(.semibold).monospacedDigit())
                    .foregroundStyle(WatchLook.muted)
            }
        }
        .padding(.horizontal, WatchScreen.compact ? 8 : 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .watchCard(cornerRadius: 16)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

// MARK: - The lists

/// The packing list and the to-dos as two rings, each opening its list.
struct ListsPage: View {
    let snapshot: WatchSnapshot

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                if let packing = snapshot.packing {
                    NavigationLink(value: Route.packing) {
                        ListRing(value: Double(packing.packed) / Double(max(packing.total, 1)), color: WatchLook.packing,
                                 number: "\(packing.packed)", of: "/\(packing.total)", title: L("packing.title"), detail: L("packing.packed"))
                    }
                }
                if let todos = snapshot.todos {
                    NavigationLink(value: Route.todos) {
                        ListRing(value: Double(todos.total - todos.open) / Double(max(todos.total, 1)), color: WatchLook.todo,
                                 number: "\(todos.open)", of: nil, title: L("todos.title"), detail: L("todos.open"))
                    }
                }
            }
            .buttonStyle(.plain)
            if let next = snapshot.packing?.items.first(where: { !$0.done }) {
                HStack(spacing: 6) {
                    Image(systemName: "circle").foregroundStyle(WatchLook.packing)
                    Text(next.name).userText(next.name).lineLimit(1)
                    Spacer(minLength: 0)
                }
                .font(.system(.footnote, design: .rounded).weight(.medium))
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .watchCard(cornerRadius: 12)
            }
        }
        .frame(maxHeight: .infinity)
        .padding(.horizontal, 5)
        .containerBackground(WatchLook.tint(WatchLook.packing), for: .tabView)

    }
}

struct ListRing: View {
    let value: Double
    let color: Color
    let number: String
    let of: String?
    let title: String
    let detail: String

    var body: some View {
        VStack(spacing: 5) {
            ProgressRing(value: value, lineWidth: 6, colors: [color.opacity(0.7), color], trackColor: color.opacity(0.22)) {
                VStack(spacing: -3) {
                    Text(number).font(.system(.title3, design: .rounded).weight(.heavy).monospacedDigit())
                    if let of {
                        Text(of).font(.system(size: 10, weight: .bold, design: .rounded)).foregroundStyle(WatchLook.muted)
                    } else {
                        Text(detail).userText(detail).font(.system(size: 9, weight: .bold, design: .rounded)).foregroundStyle(WatchLook.muted).lineLimit(1).minimumScaleFactor(0.6)
                    }
                }
                .padding(6)
            }
            .frame(width: 62, height: 62)
            Text(title)
                .font(.system(.caption2, design: .rounded).weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .watchCard()
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Empty

struct EmptyStateView: View {
    enum Kind { case notSynced, noTrip }
    let kind: Kind

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                TrekMark()
                    .fill(.white)
                    .frame(width: 44, height: 44)
                    .padding(14)
                    .background(Circle().fill(Color.white.opacity(0.1)))
                    .accessibilityHidden(true)
                Text(L(kind == .notSynced ? "empty.sync.title" : "empty.trip.title"))
                    .font(.system(.headline, design: .rounded))
                    .multilineTextAlignment(.center)
                Text(L(kind == .notSynced ? "empty.sync.body" : "empty.trip.body"))
                    .font(.footnote)
                    .foregroundStyle(WatchLook.muted)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 6)
        }
        .containerBackground(WatchLook.tint(Color(hex: 0x3A3A44)), for: .navigation)
    }
}
