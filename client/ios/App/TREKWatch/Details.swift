import MapKit
import SwiftUI

// MARK: - Days

/// Every day of the trip, today marked, each opening its plan.
struct DaysListView: View {
    let snapshot: WatchSnapshot
    @Environment(\.trekNow) private var now

    var body: some View {
        let today = snapshot.todayIndex(at: now)
        List {
            ForEach(Array(snapshot.days.enumerated()), id: \.offset) { index, day in
                NavigationLink(value: Route.day(index)) {
                    HStack(spacing: 10) {
                        Text("\(day.number)")
                            .font(.system(.headline, design: .rounded).weight(.heavy).monospacedDigit())
                            .foregroundStyle(index == today ? Color.black : WatchLook.ink)
                            .frame(width: 30, height: 30)
                            .background(Circle().fill(index == today ? Color.white : Color.white.opacity(0.12)))
                        VStack(alignment: .leading, spacing: 1) {
                            Text(day.title ?? day.dateValue.map { WatchFormat.day($0) } ?? WatchFormat.dayOf(day.number, snapshot.days.count))
                                .font(.system(.body, design: .rounded).weight(.semibold))
                                .lineLimit(1)
                            Text(summary(day)).userText(summary(day))
                                .font(.system(.caption2, design: .rounded))
                                .foregroundStyle(WatchLook.muted)
                                .lineLimit(1)
                        }
                    }
                    .opacity(isPast(day) ? 0.55 : 1)
                    .accessibilityElement(children: .combine)
                }
            }
        }
        .navigationTitle(L("trip.days"))
        .containerBackground(WatchLook.tripGradient(snapshot.trip), for: .navigation)
    }

    private func summary(_ day: WatchSnapshot.Day) -> String {
        guard let first = day.stops.first else { return L("day.empty") }
        return first.booking.map { "\(WatchLook.kindName($0)) \(first.name)" } ?? first.name
    }

    private func isPast(_ day: WatchSnapshot.Day) -> Bool {
        guard let date = day.dateValue else { return false }
        return TrekDate.daysBetween(now, date) < 0
    }
}

/// One day's plan as a timeline: times on the leading edge, the line between
/// the stops filled up to now, the current stop lit. The crown scrolls it.
struct DayView: View {
    let snapshot: WatchSnapshot
    let index: Int
    @Environment(\.trekNow) private var now

    var body: some View {
        let day = snapshot.days.indices.contains(index) ? snapshot.days[index] : nil
        let isToday = day?.date == TrekDate.iso(now)
        let nowMinutes = isToday ? TrekDate.minutesOfDay(now) : (isPastDay(day) ? 24 * 60 : -1)
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(WatchFormat.dayOf(day?.number ?? index + 1, max(snapshot.tripLength, snapshot.days.count)))
                        .watchEyebrow(.white.opacity(0.85))
                    if let date = day?.dateValue {
                        Text(WatchFormat.day(date))
                            .font(.system(.headline, design: .rounded))
                    }
                }
                .padding(.bottom, 8)
                let stops = day?.stops ?? []
                if stops.isEmpty {
                    Text(L("day.empty"))
                        .font(.footnote)
                        .foregroundStyle(WatchLook.muted)
                }
                ForEach(Array(stops.enumerated()), id: \.offset) { offset, stop in
                    NavigationLink(value: Route.stop(day: index, stop: offset)) {
                        TimelineRow(
                            stop: stop,
                            hour12: snapshot.hour12,
                            state: state(stop, next: offset + 1 < stops.count ? stops[offset + 1] : nil, nowMinutes: nowMinutes),
                            isLast: offset == stops.count - 1
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .navigationTitle(day?.dateValue.map { WatchFormat.weekday($0) } ?? L("trip.days"))
        .containerBackground(WatchLook.tripGradient(snapshot.trip), for: .navigation)
    }

    private func isPastDay(_ day: WatchSnapshot.Day?) -> Bool {
        guard let date = day?.dateValue else { return false }
        return TrekDate.daysBetween(now, date) < 0
    }

    private func state(_ stop: WatchSnapshot.Stop, next: WatchSnapshot.Stop?, nowMinutes: Int) -> TimelineRow.State {
        guard let start = stop.minutes else { return .ahead }
        let end = stop.endMinutes ?? next?.minutes ?? start + 60
        if nowMinutes >= end { return .past }
        if nowMinutes >= start { return .now }
        return .ahead
    }
}

struct TimelineRow: View {
    enum State { case past, now, ahead }
    let stop: WatchSnapshot.Stop
    let hour12: Bool
    let state: State
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text(stop.minutes.map { WatchFormat.time(minutes: $0, hour12: hour12) } ?? "")
                .font(.system(.caption2, design: .rounded).weight(.semibold).monospacedDigit())
                .foregroundStyle(state == .now ? Trek.confirmed : WatchLook.muted)
                .frame(width: (hour12 ? 50 : 36) - (WatchScreen.compact ? 4 : 0), alignment: .trailing)
                .padding(.top, 5)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            VStack(spacing: 0) {
                StopGlyph(stop: stop, size: WatchScreen.compact ? 18 : 22, dimmed: state == .past)
                    .overlay(Circle().stroke(Trek.confirmed, lineWidth: state == .now ? 2 : 0).padding(-3))
                if !isLast {
                    Rectangle()
                        .fill(state == .ahead ? Color.white.opacity(0.18) : WatchLook.stopColor(stop).opacity(0.7))
                        .frame(width: 2)
                        .frame(minHeight: 14, maxHeight: .infinity)
                }
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(stop.name).userText(stop.name)
                    .font(.system(.footnote, design: .rounded).weight(state == .now ? .bold : .semibold))
                    .foregroundStyle(state == .past ? WatchLook.muted : WatchLook.ink)
                    .lineLimit(2)
                // The street, whole: the first part of the address, on up to two lines.
                if let detail = stop.booking.map(WatchLook.kindName) ?? stop.address?.split(separator: ",").first.map(String.init) {
                    Text(detail).userText(detail)
                        .font(.system(.caption2, design: .rounded))
                        .foregroundStyle(WatchLook.faint)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.top, 3)
            .padding(.bottom, 10)
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

// MARK: - A stop

/// A stop of the plan: where it is on the map, when, the note, and Directions into Apple Maps.
struct StopDetailView: View {
    let snapshot: WatchSnapshot
    let day: Int
    let stop: Int

    var body: some View {
        let item = snapshot.days.indices.contains(day) && snapshot.days[day].stops.indices.contains(stop) ? snapshot.days[day].stops[stop] : nil
        ScrollView {
            if let item {
                VStack(alignment: .leading, spacing: 8) {
                    if let lat = item.lat, let lng = item.lng {
                        MiniMap(name: item.name, lat: lat, lng: lng, color: WatchLook.stopColor(item))
                    }
                    HStack(alignment: .top, spacing: 8) {
                        StopGlyph(stop: item, size: 26)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.name).userText(item.name)
                                .font(.system(.headline, design: .rounded))
                                .lineLimit(3)
                            if let start = item.minutes {
                                let from = WatchFormat.time(minutes: start, hour12: snapshot.hour12)
                                Text(item.endMinutes.map { "\(from) – \(WatchFormat.time(minutes: $0, hour12: snapshot.hour12))" } ?? from)
                                    .font(.system(.footnote, design: .rounded).weight(.semibold).monospacedDigit())
                                    .foregroundStyle(WatchLook.muted)
                            }
                        }
                    }
                    if let address = item.address {
                        Text(address).userText(address)
                            .font(.footnote)
                            .foregroundStyle(WatchLook.muted)
                    }
                    if let note = item.note {
                        Text(note).userText(note)
                            .font(.footnote)
                            .padding(8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .watchCard(cornerRadius: 12)
                    }
                    if let lat = item.lat, let lng = item.lng {
                        DirectionsButton(name: item.name, lat: lat, lng: lng)
                    }
                }
            }
        }
        .navigationTitle(item?.booking.map(WatchLook.kindName) ?? L("place.title"))
        .containerBackground(WatchLook.tint(item.map(WatchLook.stopColor) ?? Trek.info), for: .navigation)
    }
}

/// A small map of one spot, with its pin.
struct MiniMap: View {
    let name: String
    let lat: Double
    let lng: Double
    let color: Color

    var body: some View {
        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        // From above, without street names or points of interest, so the stop's
        // own pin is what stands out; Apple's attribution stays in its corner.
        Map(initialPosition: .region(MKCoordinateRegion(center: coordinate, latitudinalMeters: 1100, longitudinalMeters: 1100)), interactionModes: []) {
            Annotation(name, coordinate: coordinate, anchor: .center) {
                Circle()
                    .fill(color.gradient)
                    .frame(width: 22, height: 22)
                    .overlay(Circle().stroke(.white, lineWidth: 2.5))
                    .shadow(color: .black.opacity(0.4), radius: 3, y: 1)
            }
            .annotationTitles(.hidden)
        }
        .mapStyle(.standard(elevation: .flat, emphasis: .muted, pointsOfInterest: .excludingAll, showsTraffic: false))
        .frame(height: 118)
        // A soft fade over the top edge only, where labels would be cut; the
        // attribution sits at the bottom and stays as MapKit draws it.
        .overlay(alignment: .top) {
            LinearGradient(colors: [.black.opacity(0.55), .clear], startPoint: .top, endPoint: .bottom)
                .frame(height: 26)
                .allowsHitTesting(false)
        }
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityHidden(true)
    }
}

/// Opens Apple Maps with directions to a spot.
struct DirectionsButton: View {
    let name: String
    let lat: Double
    let lng: Double

    var body: some View {
        Button {
            let item = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng)))
            item.name = name
            _ = item.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDefault])
        } label: {
            Label(L("place.directions"), systemImage: "arrow.triangle.turn.up.right.diamond.fill")
                .font(.system(.body, design: .rounded).weight(.semibold))
                .frame(maxWidth: .infinity)
        }
        .tint(Trek.info)
        .buttonStyle(.borderedProminent)
    }
}

// MARK: - Bookings

struct BookingDetailView: View {
    let snapshot: WatchSnapshot
    let id: Int

    var body: some View {
        let booking = snapshot.bookings.first { $0.id == id }
        ScrollView {
            if let booking {
                VStack(alignment: .leading, spacing: 8) {
                    BookingSummary(booking: booking, hour12: snapshot.hour12)
                    if let from = booking.from, let to = booking.to {
                        LegRow(label: L("booking.departs"), point: from, date: booking.date, time: booking.time, hour12: snapshot.hour12)
                        LegRow(label: L("booking.arrives"), point: to, date: booking.endDate, time: booking.endTime, hour12: snapshot.hour12)
                    } else if booking.kind == "hotel", let checkOut = TrekDate.minutes(booking.checkOut ?? booking.endTime) {
                        FactTile(label: L("booking.checkOut"), value: [TrekDate.day(booking.endDate).map { WatchFormat.day($0) }, WatchFormat.time(minutes: checkOut, hour12: snapshot.hour12)].compactMap { $0 }.joined(separator: " "))
                    }
                    if let location = booking.location, booking.route == nil {
                        Text(location).userText(location)
                            .font(.footnote)
                            .foregroundStyle(WatchLook.muted)
                    }
                    if let target = booking.destination {
                        DirectionsButton(name: target.name, lat: target.lat, lng: target.lng)
                    }
                }
            }
        }
        .navigationTitle(booking.map { WatchLook.kindName($0.kind) } ?? "")
        .containerBackground(WatchLook.tint(Trek.booking(booking?.kind ?? "other").color), for: .navigation)
    }
}

/// One end of a ride: the place, its code, the day and time.
struct LegRow: View {
    let label: String
    let point: WatchSnapshot.Point
    let date: String?
    let time: String?
    let hour12: Bool

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 1) {
                Text(label).watchEyebrow(WatchLook.faint)
                Text(point.name).userText(point.name)
                    .font(.system(.footnote, design: .rounded).weight(.semibold))
                    .lineLimit(1)
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 1) {
                if let minutes = TrekDate.minutes(time) {
                    Text(WatchFormat.time(minutes: minutes, hour12: hour12))
                        .font(.system(.footnote, design: .rounded).weight(.bold).monospacedDigit())
                }
                if let day = TrekDate.day(date) {
                    Text(WatchFormat.day(day))
                        .font(.system(.caption2, design: .rounded))
                        .foregroundStyle(WatchLook.muted)
                }
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .watchCard(cornerRadius: 12)
        .accessibilityElement(children: .combine)
    }
}

struct BookingsListView: View {
    let snapshot: WatchSnapshot
    @Environment(\.trekNow) private var now

    var body: some View {
        let bookings = snapshot.bookingsAhead(at: now)
        List {
            if bookings.isEmpty {
                Text(L("booking.none")).foregroundStyle(WatchLook.muted)
            }
            ForEach(bookings) { booking in
                NavigationLink(value: Route.booking(booking.id)) {
                    HStack(spacing: 8) {
                        KindBadge(kind: booking.kind, size: 24)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(booking.route ?? booking.title).userText((booking.route ?? booking.title))
                                .font(.system(.footnote, design: .rounded).weight(.semibold))
                                .lineLimit(1)
                            Text(when(booking))
                                .font(.system(.caption2, design: .rounded))
                                .foregroundStyle(WatchLook.muted)
                                .lineLimit(1)
                        }
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
        .navigationTitle(L("booking.all"))
        .containerBackground(WatchLook.tripGradient(snapshot.trip), for: .navigation)
    }

    private func when(_ booking: WatchSnapshot.Booking) -> String {
        guard let day = TrekDate.day(booking.date) else { return WatchLook.kindName(booking.kind) }
        let days = TrekDate.daysBetween(now, day)
        let label = days == 0 ? L("time.today") : days == 1 ? L("time.tomorrow") : WatchFormat.day(day)
        guard let minutes = TrekDate.minutes(booking.time) else { return label }
        return "\(label) \(WatchFormat.time(minutes: minutes, hour12: snapshot.hour12))"
    }
}

// MARK: - The lists

/// The packing list: what is still to pack, by category, ticked off with a tap.
struct PackingListView: View {
    private let model = WatchModel.shared

    var body: some View {
        let packing = model.display?.packing
        let items = packing?.items ?? []
        ChecklistView(
            title: L("packing.title"),
            color: WatchLook.packing,
            open: items.filter { !$0.done },
            done: items.filter(\.done),
            progress: packing.map { ($0.packed, $0.total) },
            doneTitle: L("packing.packedSection"),
            allDone: L("packing.allPacked"),
            grouped: true
        ) { model.toggle(.packing, item: $0) }
    }
}

struct TodoListView: View {
    private let model = WatchModel.shared

    var body: some View {
        let todos = model.display?.todos
        let items = todos?.items ?? []
        ChecklistView(
            title: L("todos.title"),
            color: WatchLook.todo,
            open: items.filter { !$0.done },
            done: items.filter(\.done),
            progress: todos.map { ($0.total - $0.open, $0.total) },
            doneTitle: L("todos.doneSection"),
            allDone: L("todos.allDone"),
            grouped: false
        ) { model.toggle(.todo, item: $0) }
    }
}

/// A list to tick off: the open items (grouped by category when asked), then the done ones, dimmed.
struct ChecklistView: View {
    let title: String
    let color: Color
    let open: [WatchSnapshot.Item]
    let done: [WatchSnapshot.Item]
    let progress: (done: Int, total: Int)?
    let doneTitle: String
    let allDone: String
    let grouped: Bool
    let toggle: (WatchSnapshot.Item) -> Void
    @State private var ticks = 0

    var body: some View {
        List {
            // The progress sits in the first section's header, so the list starts right under it.
            if open.isEmpty {
                Section {
                    Label(allDone, systemImage: "checkmark.circle.fill")
                        .foregroundStyle(color)
                        .font(.system(.body, design: .rounded).weight(.semibold))
                } header: {
                    header(nil)
                }
            } else if grouped {
                ForEach(Array(groups.enumerated()), id: \.element.name) { index, group in
                    Section {
                        ForEach(group.items) { row($0) }
                    } header: {
                        if index == 0 { header(group.name) } else { Text(group.name).watchEyebrow() }
                    }
                }
            } else {
                Section {
                    ForEach(open) { row($0) }
                } header: {
                    header(nil)
                }
            }
            if !done.isEmpty {
                Section {
                    ForEach(done) { row($0) }
                } header: {
                    Text(doneTitle).watchEyebrow()
                }
            }
        }
        .listSectionSpacing(.compact)
        .navigationTitle(title)
        .sensoryFeedback(.success, trigger: ticks)
        .containerBackground(WatchLook.tint(color), for: .navigation)
    }

    /// The bar with its count, and under it the first group's name when there is one.
    @ViewBuilder
    private func header(_ group: String?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if let progress {
                HStack(spacing: 8) {
                    ProgressView(value: Double(progress.done), total: Double(max(progress.total, 1)))
                        .tint(color)
                    Text("\(progress.done)/\(progress.total)")
                        .font(.system(.footnote, design: .rounded).weight(.bold).monospacedDigit())
                        .foregroundStyle(color)
                        .fixedSize()
                }
                .accessibilityElement(children: .combine)
            }
            if let group { Text(group).watchEyebrow() }
        }
        .textCase(nil)
    }

    private var groups: [(name: String, items: [WatchSnapshot.Item])] {
        var order: [String] = []
        var byName: [String: [WatchSnapshot.Item]] = [:]
        for item in open {
            let name = item.group ?? L("packing.other")
            if byName[name] == nil { order.append(name) }
            byName[name, default: []].append(item)
        }
        return order.map { ($0, byName[$0] ?? []) }
    }

    private func row(_ item: WatchSnapshot.Item) -> some View {
        Button {
            ticks += 1
            withAnimation(.snappy) { toggle(item) }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: item.done ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(item.done ? color : WatchLook.faint)
                    .contentTransition(.symbolEffect(.replace))
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.name).userText(item.name)
                        .font(.system(.body, design: .rounded).weight(.medium))
                        .strikethrough(item.done, color: WatchLook.faint)
                        .foregroundStyle(item.done ? WatchLook.muted : WatchLook.ink)
                        .lineLimit(2)
                    if !item.done, let due = TrekDate.day(item.due) {
                        HStack(spacing: 3) {
                            if let priority = item.priority, let tint = Trek.priority(priority) {
                                Circle().fill(tint).frame(width: 5, height: 5)
                            }
                            Text(WatchFormat.day(due))
                        }
                        .font(.system(.caption2, design: .rounded))
                        .foregroundStyle(WatchLook.muted)
                    } else if !item.done, let priority = item.priority, let tint = Trek.priority(priority) {
                        Circle().fill(tint).frame(width: 5, height: 5)
                    }
                }
            }
        }
        .accessibilityValue(L(item.done ? "a11y.done" : "a11y.open"))
    }
}
