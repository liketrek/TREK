import SwiftUI

/// The trip widget: a countdown on the trip's own cover before it starts, the
/// day and what comes next while it runs, an invitation when there is none.
struct TripContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date
    @Environment(\.colorScheme) private var scheme

    private var labels: WidgetSnapshot.Labels? { snapshot?.labels }

    var body: some View {
        if family.isAccessory {
            TripAccessory(snapshot: snapshot, family: family, now: now)
        } else if let snapshot, let trip = snapshot.trip {
            if let today = snapshot.today {
                running(snapshot, trip, today)
            } else {
                upcoming(snapshot, trip)
            }
        } else {
            EmptyTrip(text: snapshot?.labels.noTrip ?? "", family: family)
        }
    }

    // MARK: Before the trip

    @ViewBuilder
    private func upcoming(_ snapshot: WidgetSnapshot, _ trip: WidgetSnapshot.Trip) -> some View {
        let days = max(snapshot.daysUntilStart(from: now) ?? 0, 0)
        // The ring and the plane cover the last 60 days before departure.
        let progress = 1 - min(Double(days), 60) / 60
        switch family {
        case .small:
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    PlaneMark()
                    Spacer(minLength: 0)
                    if let weather = snapshot.weather { WeatherChip(weather: weather, onPhoto: true, compact: true) }
                }
                Spacer(minLength: 0)
                countdown(days, snapshot.labels, size: 46)
                Text(trip.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)
                    .padding(.top, 1)
                if let range = RelativeDay.range(trip.start, trip.end) {
                    Text(range).font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.75)).lineLimit(1)
                }
            }
        case .medium:
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(snapshot.labels.nextTrip).trekEyebrowOnPhoto()
                    Text(trip.title)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                        .padding(.top, 3)
                    if let place = trip.place {
                        Label(place, systemImage: "location.fill")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.82))
                            .lineLimit(1)
                            .padding(.top, 3)
                    }
                    Spacer(minLength: 6)
                    RouteArc(progress: progress, color: .white)
                        .frame(height: 26)
                        .padding(.bottom, 8)
                    HStack(spacing: 6) {
                        if let range = RelativeDay.range(trip.start, trip.end) { PhotoPill(symbol: "calendar", text: range) }
                        if let weather = snapshot.weather { WeatherChip(weather: weather, onPhoto: true, compact: true) }
                    }
                }
                ProgressRing(value: progress, lineWidth: 7, colors: [.white.opacity(0.75), .white], trackColor: .white.opacity(0.2)) {
                    VStack(spacing: -2) {
                        Text("\(days)").font(Trek.number(days > 99 ? 26 : 32, .heavy)).foregroundStyle(.white)
                        Text(snapshot.labels.days ?? "").font(.system(size: 10, weight: .bold)).foregroundStyle(.white.opacity(0.75)).textCase(.uppercase)
                    }
                }
                .frame(width: 96, height: 96)
            }
        case .extraLarge:
            // The iPad's wide widget: the trip and its countdown on the left, the
            // bookings ahead in a column on the right.
            HStack(alignment: .top, spacing: 20) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        Text(snapshot.labels.nextTrip).trekEyebrowOnPhoto()
                        Spacer(minLength: 0)
                        if let weather = snapshot.weather { WeatherChip(weather: weather, onPhoto: true) }
                    }
                    Spacer(minLength: 0)
                    HStack(alignment: .bottom, spacing: 12) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(trip.title)
                                .font(.system(size: 28, weight: .heavy))
                                .foregroundStyle(.white)
                                .lineLimit(2)
                                .minimumScaleFactor(0.75)
                            if let place = trip.place {
                                Label(place, systemImage: "location.fill")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(.white.opacity(0.85))
                                    .lineLimit(1)
                            }
                        }
                        Spacer(minLength: 0)
                        countdown(days, snapshot.labels, size: 54)
                    }
                    RouteArc(progress: progress, color: .white)
                        .frame(height: 34)
                        .padding(.top, 10)
                        .padding(.bottom, 12)
                    TripFacts(snapshot: snapshot, onPhoto: true)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                if let bookings = snapshot.bookings, !bookings.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(snapshot.labels.bookings ?? "").trekEyebrowOnPhoto()
                        ForEach(Array(bookings.prefix(4).enumerated()), id: \.offset) { _, booking in
                            NextBookingStrip(booking: booking, labels: snapshot.labels, now: now)
                        }
                        Spacer(minLength: 0)
                    }
                    .frame(width: 290)
                    .frame(maxHeight: .infinity, alignment: .top)
                }
            }
        default:
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    Text(snapshot.labels.nextTrip).trekEyebrowOnPhoto()
                    Spacer(minLength: 0)
                    if let weather = snapshot.weather { WeatherChip(weather: weather, onPhoto: true) }
                }
                Spacer(minLength: 0)
                HStack(alignment: .bottom, spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(trip.title)
                            .font(.system(size: 26, weight: .heavy))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.75)
                        if let place = trip.place {
                            Label(place, systemImage: "location.fill")
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.85))
                        }
                    }
                    Spacer(minLength: 0)
                    countdown(days, snapshot.labels, size: 52)
                }
                RouteArc(progress: progress, color: .white)
                    .frame(height: 34)
                    .padding(.top, 10)
                    .padding(.bottom, 12)
                TripFacts(snapshot: snapshot, onPhoto: true)
                if let booking = snapshot.bookings?.first {
                    NextBookingStrip(booking: booking, labels: snapshot.labels, now: now)
                        .padding(.top, 10)
                }
            }
        }
    }

    private func countdown(_ days: Int, _ labels: WidgetSnapshot.Labels, size: CGFloat) -> some View {
        Group {
            if days == 0 {
                Text(labels.todayShort ?? labels.today)
                    .font(.system(size: size * 0.62, weight: .heavy, design: .rounded))
            } else if days == 1 {
                Text(labels.tomorrow)
                    .font(.system(size: size * 0.52, weight: .heavy, design: .rounded))
                    .minimumScaleFactor(0.6)
            } else {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(days)").font(Trek.number(size, .heavy))
                    Text(labels.days ?? "").font(.system(size: size * 0.28, weight: .bold)).opacity(0.8)
                }
            }
        }
        .foregroundStyle(.white)
        .lineLimit(1)
        .shadow(color: .black.opacity(0.25), radius: 6, y: 2)
    }

    // MARK: While travelling

    @ViewBuilder
    private func running(_ snapshot: WidgetSnapshot, _ trip: WidgetSnapshot.Trip, _ today: WidgetSnapshot.Today) -> some View {
        let nowMinutes = Calendar.current.component(.hour, from: now) * 60 + Calendar.current.component(.minute, from: now)
        let next = today.stops.first { ($0.minutes ?? -1) >= nowMinutes } ?? today.stops.last
        let index = today.index ?? 1
        let total = today.total ?? snapshot.tripLength ?? 1
        switch family {
        case .small:
            VStack(alignment: .leading, spacing: 0) {
                // An iPad mini's small widget has no room for both: the day stays, the weather gives way.
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top) {
                        Text(today.dayLabel).trekEyebrowOnPhoto()
                        Spacer(minLength: 0)
                        if let weather = snapshot.weather { WeatherChip(weather: weather, onPhoto: true, compact: true) }
                    }
                    HStack(alignment: .top) {
                        Text(today.dayLabel).trekEyebrowOnPhoto()
                        Spacer(minLength: 0)
                    }
                }
                DaySegments(index: index, total: total, color: .white, track: .white.opacity(0.25)).padding(.top, 7)
                Spacer(minLength: 0)
                if let next {
                    Text(next.time ?? snapshot.labels.today)
                        .font(Trek.number(28, .heavy))
                        .foregroundStyle(.white)
                    Text(next.name)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                } else {
                    Text(snapshot.labels.nothingPlanned).font(.system(size: 14, weight: .bold)).foregroundStyle(.white).lineLimit(3)
                }
                Text(trip.title).font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.7)).lineLimit(1).padding(.top, 2)
            }
        case .medium:
            // 176 pt for the stops on an iPhone and an 11" or 13" iPad; an iPad
            // mini's medium widget is narrower, so the panel gives up some width
            // and the weather keeps to its chip, and the day still reads whole.
            // The line is drawn by the iPad mini alone: its medium widget is
            // 305.5 pt wide, 273.5 inside the content margins, while the smallest
            // iPhone's (a 4.7" SE) is 321 pt, 289 inside, and keeps the full layout.
            GeometryReader { geo in
                let narrow = geo.size.width < 281
                HStack(spacing: 14) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(trip.title).trekEyebrowOnPhoto()
                        Text(today.dayLabel)
                            .font(.system(size: 21, weight: .heavy))
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                            .padding(.top, 3)
                        DaySegments(index: index, total: total, color: .white, track: .white.opacity(0.25)).padding(.top, 8)
                        Spacer(minLength: 0)
                        if let weather = snapshot.weather {
                            HStack(spacing: 6) {
                                WeatherChip(weather: weather, onPhoto: true, compact: narrow)
                                if !narrow, let high = weather.high, let low = weather.low {
                                    Text("\(high)° / \(low)°").font(Trek.number(11.5, .semibold)).foregroundStyle(.white.opacity(0.8))
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    GlassPanel {
                        StopList(stops: today.stops, nowMinutes: nowMinutes, limit: 3, onPhoto: true, nothing: snapshot.labels.nothingPlanned, nowLabel: snapshot.labels.now)
                    }
                    .frame(width: narrow ? 150 : 176)
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }
        case .extraLarge:
            // The iPad's wide widget: the day and the next stop on the left, the
            // day's stops and the next booking on the right, each column
            // anchored at its top and its foot.
            HStack(alignment: .top, spacing: 20) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(trip.title).trekEyebrowOnPhoto()
                            Text(today.dayLabel)
                                .font(.system(size: 26, weight: .heavy))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }
                        Spacer(minLength: 0)
                        if let weather = snapshot.weather { BigWeather(weather: weather) }
                    }
                    DaySegments(index: index, total: total, color: .white, track: .white.opacity(0.25)).padding(.top, 10)
                    Spacer(minLength: 8)
                    if let next {
                        Text(next.time ?? snapshot.labels.today)
                            .font(Trek.number(34, .heavy))
                            .foregroundStyle(.white)
                        Text(next.name)
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.85)
                    } else {
                        Text(snapshot.labels.nothingPlanned).font(.system(size: 17, weight: .bold)).foregroundStyle(.white).lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                VStack(alignment: .leading, spacing: 10) {
                    GlassPanel {
                        StopList(stops: today.stops, nowMinutes: nowMinutes, limit: 6, onPhoto: true, nothing: snapshot.labels.nothingPlanned, nowLabel: snapshot.labels.now)
                    }
                    Spacer(minLength: 0)
                    if let booking = snapshot.bookings?.first {
                        NextBookingStrip(booking: booking, labels: snapshot.labels, now: now)
                    }
                }
                .frame(width: 300)
                .frame(maxHeight: .infinity, alignment: .top)
            }
        default:
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(trip.title).trekEyebrowOnPhoto()
                        Text(today.dayLabel).font(.system(size: 24, weight: .heavy)).foregroundStyle(.white).lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    if let weather = snapshot.weather { BigWeather(weather: weather) }
                }
                DaySegments(index: index, total: total, color: .white, track: .white.opacity(0.25)).padding(.top, 10)
                GlassPanel {
                    StopList(stops: today.stops, nowMinutes: nowMinutes, limit: 6, onPhoto: true, nothing: snapshot.labels.nothingPlanned, nowLabel: snapshot.labels.now)
                }
                .padding(.top, 14)
                Spacer(minLength: 8)
                if let booking = snapshot.bookings?.first {
                    NextBookingStrip(booking: booking, labels: snapshot.labels, now: now)
                }
            }
        }
    }
}

// MARK: - Pieces

private extension Text {
    func trekEyebrowOnPhoto() -> some View {
        self.font(.system(size: 10.5, weight: .bold))
            .tracking(0.7)
            .textCase(.uppercase)
            .foregroundStyle(.white.opacity(0.78))
            .lineLimit(1)
    }
}

/// The plane in a frosted circle that marks a trip widget.
struct PlaneMark: View {
    var body: some View {
        Circle()
            .fill(.white.opacity(0.22))
            .overlay(Circle().stroke(.white.opacity(0.35), lineWidth: 0.6))
            .frame(width: 26, height: 26)
            .overlay(Image(systemName: "airplane").font(.system(size: 12, weight: .bold)).foregroundStyle(.white).rotationEffect(.degrees(-35)))
    }
}

struct PhotoPill: View {
    let symbol: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: symbol).font(.system(size: 10, weight: .bold))
            Text(text).font(.system(size: 11, weight: .semibold)).lineLimit(1)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Capsule().fill(Color.black.opacity(0.28)))
        .overlay(Capsule().stroke(Color.white.opacity(0.22), lineWidth: 0.6))
    }
}

/// Frosted glass over the photo, for lists that need a calm ground.
struct GlassPanel<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color.black.opacity(0.32))
            )
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.white.opacity(0.16), lineWidth: 0.7))
    }
}

/// Days, places and travellers as three small columns.
struct TripFacts: View {
    let snapshot: WidgetSnapshot
    var onPhoto = false
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let labels = snapshot.labels
        HStack(spacing: 0) {
            if let length = snapshot.tripLength {
                fact("\(length)", labels.days ?? "", "calendar")
            }
            if let places = snapshot.trip?.placeCount, places > 0 {
                divider
                fact("\(places)", labels.places ?? "", "mappin")
            }
            if let members = snapshot.trip?.memberCount, members > 0 {
                divider
                fact("\(members)", labels.travellers ?? "", "person.2.fill")
            }
        }
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(onPhoto ? Color.black.opacity(0.28) : Trek.card(scheme)))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(onPhoto ? Color.white.opacity(0.18) : Trek.cardBorder(scheme), lineWidth: 0.7))
    }

    private var divider: some View {
        Rectangle().fill(onPhoto ? Color.white.opacity(0.2) : Trek.track(scheme)).frame(width: 0.7, height: 26)
    }

    private func fact(_ value: String, _ label: String, _ symbol: String) -> some View {
        VStack(spacing: 1) {
            HStack(spacing: 4) {
                Image(systemName: symbol).font(.system(size: 10, weight: .bold)).opacity(0.75)
                Text(value).font(Trek.number(17, .heavy))
            }
            Text(label).font(.system(size: 9.5, weight: .bold)).textCase(.uppercase).tracking(0.4).opacity(0.7).lineLimit(1)
        }
        .foregroundStyle(onPhoto ? .white : Trek.ink(scheme))
        .frame(maxWidth: .infinity)
    }
}

/// The first booking ahead, as a strip under the trip.
struct NextBookingStrip: View {
    let booking: WidgetSnapshot.Booking
    let labels: WidgetSnapshot.Labels
    let now: Date
    var onPhoto = true
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 9) {
            KindBadge(kind: booking.kind, size: 28)
            VStack(alignment: .leading, spacing: 1) {
                Text(booking.title).font(.system(size: 13, weight: .bold)).lineLimit(1)
                if let detail = booking.detail {
                    Text(detail).font(.system(size: 11, weight: .medium)).opacity(0.75).lineLimit(1)
                }
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 1) {
                if let day = RelativeDay.label(booking.date, now: now, labels: labels) {
                    Text(day).font(.system(size: 11, weight: .bold)).opacity(0.8)
                }
                if let time = booking.time { Text(time).font(Trek.number(14, .heavy)) }
            }
        }
        .foregroundStyle(onPhoto ? .white : Trek.ink(scheme))
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(onPhoto ? Color.black.opacity(0.3) : Trek.card(scheme)))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(onPhoto ? Color.white.opacity(0.16) : Trek.cardBorder(scheme), lineWidth: 0.7))
    }
}

/// The weather as the large widget shows it: symbol, temperature, high and low.
struct BigWeather: View {
    let weather: WidgetSnapshot.Weather

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: Trek.weatherSymbol(weather.main))
                .symbolRenderingMode(.multicolor)
                .font(.system(size: 26))
            VStack(alignment: .leading, spacing: 0) {
                Text("\(weather.temp)°").font(Trek.number(22, .heavy))
                if let high = weather.high, let low = weather.low {
                    Text("\(high)° / \(low)°").font(Trek.number(10.5, .semibold)).opacity(0.8)
                }
            }
        }
        .foregroundStyle(.white)
    }
}

/// The day's stops as a timeline: a dot in each stop's colour on a thread, the
/// ones behind faded, a now marker between the past and the next.
struct StopList: View {
    let stops: [WidgetSnapshot.Stop]
    let nowMinutes: Int
    let limit: Int
    var onPhoto = false
    let nothing: String
    var nowLabel: String?
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if stops.isEmpty {
            HStack(spacing: 8) {
                Image(systemName: "sparkles").font(.system(size: 15, weight: .semibold))
                Text(nothing).font(.system(size: 13, weight: .semibold)).lineLimit(2)
            }
            .foregroundStyle(ink.opacity(0.85))
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
        } else {
            let window = visible
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(window.enumerated()), id: \.offset) { offset, stop in
                    let past = (stop.minutes ?? Int.max) < nowMinutes
                    let isNext = !past && (offset == 0 || (window[offset - 1].minutes ?? Int.max) < nowMinutes)
                    if isNext && offset > 0, let nowLabel { nowLine(nowLabel) }
                    row(stop, past: past, isNext: isNext, last: offset == window.count - 1)
                }
            }
        }
    }

    /// The stops around now: the last one behind, then the ones ahead.
    private var visible: [WidgetSnapshot.Stop] {
        let nextIndex = stops.firstIndex { ($0.minutes ?? Int.max) >= nowMinutes } ?? max(stops.count - limit, 0)
        let first = max(0, min(nextIndex - 1, stops.count - limit))
        return Array(stops[first..<min(stops.count, first + limit)])
    }

    private var ink: Color { onPhoto ? .white : Trek.ink(scheme) }

    private func row(_ stop: WidgetSnapshot.Stop, past: Bool, isNext: Bool, last: Bool) -> some View {
        let color = Color(css: stop.color) ?? (onPhoto ? .white : Trek.info)
        return HStack(alignment: .top, spacing: 8) {
            Text(stop.time ?? "–")
                .font(Trek.number(11.5, isNext ? .heavy : .semibold))
                .frame(width: 38, alignment: .leading)
                .padding(.top, 1)
            VStack(spacing: 0) {
                ZStack {
                    Circle().fill(color).frame(width: isNext ? 11 : 8, height: isNext ? 11 : 8)
                    if isNext { Circle().stroke(color.opacity(0.4), lineWidth: 3).frame(width: 15, height: 15) }
                }
                .frame(width: 15, height: 15)
                if !last {
                    Rectangle().fill(ink.opacity(0.22)).frame(width: 1.2).frame(maxHeight: .infinity)
                }
            }
            .frame(width: 15)
            HStack(spacing: 5) {
                if let symbol = stop.symbol {
                    Image(systemName: symbol).font(.system(size: 10, weight: .semibold)).foregroundStyle(color)
                }
                Text(stop.name)
                    .font(.system(size: 12.5, weight: isNext ? .bold : .semibold))
                    .lineLimit(1)
            }
            .padding(.top, 0.5)
            Spacer(minLength: 0)
        }
        .foregroundStyle(ink)
        .opacity(past ? 0.5 : 1)
        .frame(height: 24, alignment: .top)
    }

    private func nowLine(_ label: String) -> some View {
        HStack(spacing: 5) {
            Text(label.uppercased()).font(.system(size: 8.5, weight: .heavy)).tracking(0.5).foregroundStyle(Trek.danger)
                .frame(width: 38, alignment: .leading)
            Circle().fill(Trek.danger).frame(width: 5, height: 5).frame(width: 15)
            Rectangle().fill(Trek.danger).frame(height: 1.2)
        }
        .frame(height: 9)
        .padding(.bottom, 3)
    }
}

/// No trip: the paper, the contour lines, and an invitation.
struct EmptyTrip: View {
    let text: String
    let family: TrekFamily
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: "map.fill").font(.system(size: 13, weight: .bold))
                Text("TREK").font(.system(size: 15, weight: .heavy)).tracking(1.2)
            }
            .foregroundStyle(Trek.ink(scheme))
            Spacer(minLength: 0)
            Image(systemName: "globe.europe.africa.fill")
                .font(.system(size: family == .small ? 30 : 38, weight: .light))
                .foregroundStyle(Trek.muted(scheme).opacity(0.6))
            Text(text)
                .font(.system(size: family == .small ? 12.5 : 14, weight: .semibold))
                .foregroundStyle(Trek.muted(scheme))
                .lineLimit(3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

/// The trip on the lock screen: a ring with the days left or the day of the
/// trip, a line with the next stop, a word in the status row.
struct TripAccessory: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date

    var body: some View {
        let trip = snapshot?.trip
        let today = snapshot?.today
        let days = max(snapshot?.daysUntilStart(from: now) ?? 0, 0)
        let nowMinutes = Calendar.current.component(.hour, from: now) * 60 + Calendar.current.component(.minute, from: now)
        let next = today?.stops.first { ($0.minutes ?? -1) >= nowMinutes }
        switch family {
        case .circular:
            ZStack {
                Circle().stroke(Color.white.opacity(0.25), lineWidth: 5)
                if let today, let index = today.index, let total = today.total ?? snapshot?.tripLength {
                    Circle().trim(from: 0, to: Double(index) / Double(max(total, 1)))
                        .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: -3) {
                        Text("\(index)").font(Trek.number(20, .heavy))
                        Text("/\(total)").font(Trek.number(9, .bold)).opacity(0.75)
                    }
                } else if trip != nil {
                    Circle().trim(from: 0, to: 1 - min(Double(days), 60) / 60)
                        .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: -3) {
                        Image(systemName: "airplane").font(.system(size: 9, weight: .bold))
                        Text("\(days)").font(Trek.number(days > 99 ? 15 : 19, .heavy))
                    }
                } else {
                    Image(systemName: "map.fill").font(.system(size: 20))
                }
            }
            .padding(3)
        case .rectangular:
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Image(systemName: today == nil ? "airplane" : "mappin.circle.fill").font(.system(size: 11, weight: .bold))
                    Text(trip?.title ?? "TREK").font(.system(size: 13, weight: .bold)).lineLimit(1)
                }
                if let today {
                    Text(next.map { "\($0.time ?? "") \($0.name)" } ?? snapshot?.labels.allDone ?? today.dayLabel)
                        .font(.system(size: 13, weight: .semibold)).lineLimit(1)
                    Text(today.dayLabel).font(.system(size: 11, weight: .medium)).opacity(0.75).lineLimit(1)
                } else if let snapshot, trip != nil {
                    Text(days == 1 ? snapshot.labels.tomorrow : snapshot.labels.inDays.replacingOccurrences(of: "{n}", with: "\(days)"))
                        .font(.system(size: 15, weight: .heavy)).lineLimit(1)
                    if let range = trip.flatMap({ RelativeDay.range($0.start, $0.end) }) {
                        Text(range).font(.system(size: 11, weight: .medium)).opacity(0.75)
                    }
                } else {
                    Text(snapshot?.labels.noTrip ?? "").font(.system(size: 12, weight: .medium)).lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        default:
            if let trip, let snapshot {
                if today != nil, let next {
                    Text("\(Image(systemName: "mappin.circle.fill")) \(next.time ?? "") \(next.name)")
                } else {
                    Text("\(Image(systemName: "airplane")) \(trip.title), \(snapshot.labels.inDays.replacingOccurrences(of: "{n}", with: "\(days)"))")
                }
            } else {
                Text("\(Image(systemName: "map.fill")) TREK")
            }
        }
    }
}
