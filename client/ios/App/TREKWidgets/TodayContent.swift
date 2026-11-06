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
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .center, spacing: 10) {
                    DayBadge(index: today.index ?? 1, total: total)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(trip.title).trekEyebrow(scheme)
                        Text(today.dayLabel)
                            .font(.system(size: family == .large ? 19 : 16, weight: .heavy))
                            .foregroundStyle(Trek.ink(scheme))
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    if let weather = snapshot.weather {
                        if family == .large {
                            PaperWeather(weather: weather)
                        } else {
                            WeatherChip(weather: weather)
                        }
                    }
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
        } else if let snapshot, let trip = snapshot.trip {
            // Before the trip there is no day yet: count down to it instead.
            let days = max(snapshot.daysUntilStart(from: now) ?? 0, 0)
            VStack(alignment: .leading, spacing: 4) {
                Text(snapshot.labels.nextTrip).trekEyebrow(scheme)
                Text(trip.title).font(.system(size: 17, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(2)
                Spacer(minLength: 0)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(days)").font(Trek.number(40, .heavy)).foregroundStyle(Trek.ink(scheme))
                    Text(snapshot.labels.days ?? "").font(.system(size: 13, weight: .bold)).foregroundStyle(Trek.muted(scheme))
                }
                RouteArc(progress: 1 - min(Double(days), 60) / 60, color: Trek.ink(scheme)).frame(height: 24)
            }
        } else {
            EmptyTrip(text: snapshot?.labels.noTrip ?? "", family: family)
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
