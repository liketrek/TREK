import SwiftUI

/// Today's plan on paper: the day, the weather, and the stops as a timeline
/// with a now line, so a glance says what is next and what is behind.
struct TodayContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let nowMinutes = Calendar.current.component(.hour, from: now) * 60 + Calendar.current.component(.minute, from: now)
        if let snapshot, let trip = snapshot.trip, let today = snapshot.today {
            let total = today.total ?? snapshot.tripLength ?? 1
            let timed = today.stops.filter { $0.minutes != nil }
            let done = timed.filter { ($0.minutes ?? 0) < nowMinutes }.count
            if family == .extraLarge {
                wide(snapshot, trip, today, total: total, done: done, timed: timed.count, nowMinutes: nowMinutes)
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    // On a narrow widget (an iPad mini's) the weather shrinks to its
                    // chip, then steps aside, before the trip's name is cut short.
                    ViewThatFits(in: .horizontal) {
                        header(trip, today, total: total, weather: family == .large ? .full : .chip)
                        header(trip, today, total: total, weather: .chip)
                        header(trip, today, total: total, weather: .hidden)
                    }
                    if family == .large {
                        DayProgress(done: done, total: timed.count, scheme: scheme, label: snapshot.labels.allDone)
                            .padding(.top, 12)
                            .padding(.bottom, 14)
                    } else {
                        Spacer(minLength: 8)
                    }
                    StopList(
                        stops: today.stops, nowMinutes: nowMinutes, limit: family == .large ? 7 : 3,
                        nothing: snapshot.labels.nothingPlanned, nowLabel: snapshot.labels.now
                    )
                    if family == .large {
                        Spacer(minLength: 8)
                        if let booking = snapshot.bookings?.first {
                            NextBookingStrip(booking: booking, labels: snapshot.labels, now: now, onPhoto: false)
                        }
                    }
                }
            }
        } else if let snapshot, let trip = snapshot.trip {
            // Before the trip there is no day yet: count down to it instead.
            let days = max(snapshot.daysUntilStart(from: now) ?? 0, 0)
            let roomy = family == .extraLarge
            VStack(alignment: .leading, spacing: 4) {
                Text(snapshot.labels.nextTrip).trekEyebrow(scheme)
                Text(trip.title).font(.system(size: roomy ? 24 : 17, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(2)
                Spacer(minLength: 0)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(days)").font(Trek.number(roomy ? 56 : 40, .heavy)).foregroundStyle(Trek.ink(scheme))
                    Text(snapshot.labels.days ?? "").font(.system(size: roomy ? 16 : 13, weight: .bold)).foregroundStyle(Trek.muted(scheme))
                }
                RouteArc(progress: 1 - min(Double(days), 60) / 60, color: Trek.ink(scheme)).frame(height: roomy ? 34 : 24)
            }
        } else {
            EmptyTrip(text: snapshot?.labels.noTrip ?? "", family: family)
        }
    }
}

extension TodayContent {
    enum HeaderWeather { case full, chip, hidden }

    /// The day's badge, the trip and the day, and the weather as much as fits.
    func header(_ trip: WidgetSnapshot.Trip, _ today: WidgetSnapshot.Today, total: Int, weather: HeaderWeather) -> some View {
        HStack(alignment: .center, spacing: 10) {
            DayBadge(index: today.index ?? 1, total: total)
            VStack(alignment: .leading, spacing: 1) {
                Text(trip.title).trekEyebrow(scheme)
                Text(today.dayLabel)
                    .font(.system(size: family == .medium ? 16 : 19, weight: .heavy))
                    .foregroundStyle(Trek.ink(scheme))
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            if let forecast = snapshot?.weather {
                switch weather {
                case .full: PaperWeather(weather: forecast)
                case .chip: WeatherChip(weather: forecast)
                case .hidden: EmptyView()
                }
            }
        }
    }

    /// The iPad's extra large: the day, its progress and the weather beside
    /// the day's timeline, and the next two bookings across the foot.
    func wide(
        _ snapshot: WidgetSnapshot, _ trip: WidgetSnapshot.Trip, _ today: WidgetSnapshot.Today,
        total: Int, done: Int, timed: Int, nowMinutes: Int
    ) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 22) {
                VStack(alignment: .leading, spacing: 0) {
                    header(trip, today, total: total, weather: .hidden)
                    DayProgress(done: done, total: timed, scheme: scheme, label: snapshot.labels.allDone)
                        .padding(.top, 12)
                    if let weather = snapshot.weather {
                        PaperWeather(weather: weather).padding(.top, 16)
                    }
                }
                .frame(width: 250)
                StopList(
                    stops: today.stops, nowMinutes: nowMinutes, limit: 6,
                    nothing: snapshot.labels.nothingPlanned, nowLabel: snapshot.labels.now
                )
                .frame(maxWidth: .infinity, alignment: .topLeading)
            }
            Spacer(minLength: 10)
            if let bookings = snapshot.bookings, !bookings.isEmpty {
                HStack(spacing: 12) {
                    ForEach(Array(bookings.prefix(2).enumerated()), id: \.offset) { _, booking in
                        NextBookingStrip(booking: booking, labels: snapshot.labels, now: now, onPhoto: false)
                    }
                }
            }
        }
    }
}

/// Today's number in a dark tile with the trip's length under it.
struct DayBadge: View {
    let index: Int
    let total: Int
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        VStack(spacing: -2) {
            Text("\(index)").font(Trek.number(19, .heavy))
            Text("/\(total)").font(Trek.number(9, .bold)).opacity(0.7)
        }
        .foregroundStyle(scheme == .dark ? Color(hex: 0x101013) : .white)
        .frame(width: 40, height: 40)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Trek.ink(scheme))
        )
        .shadow(color: .black.opacity(scheme == .dark ? 0 : 0.18), radius: 5, y: 2)
    }
}

/// The weather on paper: symbol, temperature, and the day's range and rain.
struct PaperWeather: View {
    let weather: WidgetSnapshot.Weather
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: Trek.weatherSymbol(weather.main))
                .symbolRenderingMode(.multicolor)
                .font(.system(size: 24))
            VStack(alignment: .leading, spacing: 0) {
                Text("\(weather.temp)°").font(Trek.number(20, .heavy)).foregroundStyle(Trek.ink(scheme))
                HStack(spacing: 4) {
                    if let high = weather.high, let low = weather.low { Text("\(high)°/\(low)°") }
                    if let rain = weather.rain, rain > 0 {
                        Text("\(Image(systemName: "drop.fill"))\(rain)%")
                    }
                }
                .font(Trek.number(10, .semibold))
                .foregroundStyle(Trek.muted(scheme))
            }
        }
    }
}

/// How much of the day is behind: a bar of the stops passed.
struct DayProgress: View {
    let done: Int
    let total: Int
    let scheme: ColorScheme
    let label: String?

    var body: some View {
        HStack(spacing: 8) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Trek.track(scheme))
                    Capsule()
                        .fill(LinearGradient(colors: [Trek.confirmed.opacity(0.8), Trek.confirmed], startPoint: .leading, endPoint: .trailing))
                        .frame(width: total > 0 ? max(6, geo.size.width * CGFloat(done) / CGFloat(total)) : 0)
                }
            }
            .frame(height: 6)
            Text(done >= total && total > 0 ? (label ?? "\(done)/\(total)") : "\(done)/\(total)")
                .font(Trek.number(11, .bold))
                .foregroundStyle(Trek.muted(scheme))
                .lineLimit(1)
                .fixedSize()
        }
    }
}

/// The travel day as its Live Activity shows it on the lock screen (iPhone and
/// iPad): trip and day on top, the next stop large, the day's stops as
/// segments. Plain values rather than the activity's attributes, so the
/// preview renderer can draw it at every width the lock screen gives it.
struct TripDayBanner: View {
    let tripTitle: String
    let dayLabel: String
    let nextName: String
    let nextTime: String?
    let done: Int
    let total: Int

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.18), lineWidth: 5)
                Circle()
                    .trim(from: 0, to: total > 0 ? max(0.02, Double(done) / Double(total)) : 0)
                    .stroke(
                        AngularGradient(colors: [Trek.confirmed.opacity(0.7), Trek.confirmed], center: .center),
                        style: StrokeStyle(lineWidth: 5, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                Image(systemName: "mappin.and.ellipse").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
            }
            .frame(width: 52, height: 52)
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(tripTitle)
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.5)
                        .textCase(.uppercase)
                        .foregroundStyle(.white.opacity(0.65))
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    Text(dayLabel).font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.65)).lineLimit(1)
                }
                HStack(alignment: .firstTextBaseline) {
                    Text(nextName).font(.system(size: 18, weight: .heavy)).foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.8)
                    Spacer(minLength: 4)
                    if let nextTime {
                        Text(nextTime).font(Trek.number(18, .heavy)).foregroundStyle(.white)
                    }
                }
                DayStopProgress(done: done, total: total).padding(.top, 3)
            }
        }
        .padding(16)
    }
}

/// The day's timed stops as segments, those behind filled (the Live Activity's bar).
struct DayStopProgress: View {
    let done: Int
    let total: Int

    var body: some View {
        DaySegments(index: done + 1, total: max(total, 1), color: Trek.confirmed, track: Color.white.opacity(0.2))
    }
}
