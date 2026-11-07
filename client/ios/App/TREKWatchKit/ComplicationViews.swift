import SwiftUI
import WidgetKit

/// The sizes the complications draw for. Their own enum rather than
/// WidgetKit's, so the watch app's screenshot mode can lay them out too.
enum ComplicationFamily: String, CaseIterable {
    case circular, rectangular, corner, inline

    var widgetFamily: WidgetFamily {
        switch self {
        case .circular: return .accessoryCircular
        case .rectangular: return .accessoryRectangular
        case .corner: return .accessoryCorner
        case .inline: return .accessoryInline
        }
    }

    init?(_ family: WidgetFamily) {
        switch family {
        case .accessoryCircular: self = .circular
        case .accessoryRectangular: self = .rectangular
        case .accessoryCorner: self = .corner
        case .accessoryInline: self = .inline
        default: return nil
        }
    }
}

/// What the complications read from a snapshot at a moment.
struct ComplicationState {
    struct NextStop {
        var stop: WatchSnapshot.Stop
        var start: Date?
        var isNow: Bool
    }

    struct Countdown {
        var title: String
        var detail: String?
        var symbol: String
        var color: Color
        var target: Date
    }

    var tripTitle: String?
    var phase: WatchSnapshot.Phase
    var next: NextStop?
    var countdown: Countdown?
    var hour12: Bool

    init(_ snapshot: WatchSnapshot?, now: Date) {
        tripTitle = snapshot?.trip?.title
        phase = snapshot?.phase(at: now) ?? .none
        hour12 = snapshot?.hour12 ?? false
        let minutes = TrekDate.minutesOfDay(now)
        if let day = snapshot?.today(at: now) {
            let current = day.stops.first { ($0.minutes ?? .max) <= minutes && minutes < ($0.endMinutes ?? -1) }
            let upcoming = day.stops.first { ($0.minutes ?? -1) >= minutes }
            if let stop = current ?? upcoming {
                next = NextStop(stop: stop, start: stop.minutes.map { TrekDate.at($0, on: now) }, isNow: current != nil)
            }
        }
        if let booking = snapshot?.bookings.first(where: { ($0.start ?? .distantPast) > now }), let start = booking.start {
            let look = Trek.booking(booking.kind)
            countdown = Countdown(title: booking.route ?? booking.title, detail: booking.route == nil ? nil : booking.carrier,
                                  symbol: look.symbol, color: look.color, target: start)
        } else if let trip = snapshot?.trip, case .upcoming = phase, let start = TrekDate.day(trip.start) {
            countdown = Countdown(title: trip.title, detail: trip.place, symbol: "suitcase.rolling.fill", color: Trek.info, target: start)
        }
    }

    /// The moments a complication should redraw at: each stop's start and end today, each booking's departure.
    static func changes(_ snapshot: WatchSnapshot?, from now: Date) -> [Date] {
        guard let snapshot else { return [] }
        var dates: [Date] = []
        if let day = snapshot.today(at: now) {
            for stop in day.stops {
                if let start = stop.minutes { dates.append(TrekDate.at(start, on: now)) }
                if let end = stop.endMinutes { dates.append(TrekDate.at(end, on: now)) }
            }
        }
        dates += snapshot.bookings.compactMap(\.start)
        dates.append(Calendar.current.startOfDay(for: now.addingTimeInterval(86_400)))
        return dates.filter { $0 > now && $0 < now.addingTimeInterval(86_400 * 2) }.sorted()
    }
}

// MARK: - Next stop

struct NextStopComplication: View {
    let state: ComplicationState
    let family: ComplicationFamily
    let now: Date

    var body: some View {
        if let next = state.next {
            let time = next.stop.minutes.map { WatchFormat.time(minutes: $0, hour12: state.hour12) }
            switch family {
            case .rectangular:
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 4) {
                        Image(systemName: WatchLook.stopSymbol(next.stop)).widgetAccentable()
                        Text(next.isNow ? L("today.now") : (time ?? L("today.next")))
                            .fontWeight(.semibold)
                            .widgetAccentable()
                        if let start = next.start, !next.isNow, start > now {
                            Text(WatchFormat.relative(start, now: now)).foregroundStyle(.secondary)
                        }
                    }
                    .font(.system(.footnote, design: .rounded))
                    Text(next.stop.name)
                        .font(.system(.headline, design: .rounded))
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                    if case .running(let day, let total) = state.phase {
                        Text(WatchFormat.dayOf(day, total))
                            .font(.system(.caption2, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            case .circular:
                ZStack {
                    AccessoryWidgetBackground()
                    VStack(spacing: 0) {
                        Image(systemName: WatchLook.stopSymbol(next.stop))
                            .font(.system(size: 15, weight: .semibold))
                            .widgetAccentable()
                        Text(time ?? "")
                            .font(.system(size: 12, weight: .bold, design: .rounded).monospacedDigit())
                            .minimumScaleFactor(0.6)
                    }
                    .padding(4)
                }
            case .corner:
                Image(systemName: WatchLook.stopSymbol(next.stop))
                    .font(.system(size: 20, weight: .semibold))
                    .widgetAccentable()
                    .widgetLabel { Text([time, next.stop.name].compactMap { $0 }.joined(separator: " ")) }
            case .inline:
                Label([time, next.stop.name].compactMap { $0 }.joined(separator: " "), systemImage: WatchLook.stopSymbol(next.stop))
            }
        } else {
            ComplicationIdle(state: state, family: family)
        }
    }
}

// MARK: - Countdown

struct CountdownComplication: View {
    let state: ComplicationState
    let family: ComplicationFamily
    let now: Date

    var body: some View {
        if let countdown = state.countdown {
            let left = WatchFormat.countdown(countdown.target, now: now)
            switch family {
            case .rectangular:
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 4) {
                        Image(systemName: countdown.symbol).widgetAccentable()
                        Text(countdown.title).fontWeight(.semibold).lineLimit(1)
                    }
                    .font(.system(.footnote, design: .rounded))
                    Text(left)
                        .font(.system(.title3, design: .rounded).weight(.bold).monospacedDigit())
                        .widgetAccentable()
                        .minimumScaleFactor(0.7)
                    if let detail = countdown.detail {
                        Text(detail).font(.system(.caption2, design: .rounded)).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            case .circular:
                ZStack {
                    AccessoryWidgetBackground()
                    VStack(spacing: 0) {
                        Image(systemName: countdown.symbol).font(.system(size: 14, weight: .semibold)).widgetAccentable()
                        Text(short(countdown.target))
                            .font(.system(size: 13, weight: .bold, design: .rounded).monospacedDigit())
                            .minimumScaleFactor(0.5)
                    }
                    .padding(4)
                }
            case .corner:
                Image(systemName: countdown.symbol)
                    .font(.system(size: 20, weight: .semibold))
                    .widgetAccentable()
                    .widgetLabel { Text(left) }
            case .inline:
                Label("\(countdown.title) · \(left)", systemImage: countdown.symbol)
            }
        } else {
            ComplicationIdle(state: state, family: family)
        }
    }

    /// The single biggest unit: "2h", "35m", "12d".
    private func short(_ target: Date) -> String {
        let formatter = WatchFormat.components()
        formatter.unitsStyle = .abbreviated
        formatter.maximumUnitCount = 1
        let seconds = max(target.timeIntervalSince(now), 60)
        formatter.allowedUnits = seconds >= 86_400 ? [.day] : seconds >= 3_600 ? [.hour] : [.minute]
        return formatter.string(from: seconds) ?? ""
    }
}

// MARK: - Trip day

struct TripDayComplication: View {
    let state: ComplicationState
    let family: ComplicationFamily

    var body: some View {
        switch state.phase {
        case .running(let day, let total):
            running(day, total)
        case .upcoming(let days):
            upcoming(days)
        default:
            ComplicationIdle(state: state, family: family)
        }
    }

    @ViewBuilder
    private func running(_ day: Int, _ total: Int) -> some View {
        switch family {
        case .circular:
            Gauge(value: Double(day), in: 0...Double(max(total, 1))) {
                Image(systemName: "suitcase.rolling.fill")
            } currentValueLabel: {
                Text("\(day)").font(.system(.title3, design: .rounded).weight(.bold))
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .widgetAccentable()
        case .rectangular:
            VStack(alignment: .leading, spacing: 3) {
                Text(WatchFormat.dayOf(day, total))
                    .font(.system(.headline, design: .rounded))
                    .widgetAccentable()
                Text(state.tripTitle ?? "")
                    .font(.system(.footnote, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                DaySegments(index: day, total: total, color: .white, track: .white.opacity(0.25))
                    .widgetAccentable()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .corner:
            Text("\(day)")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .widgetAccentable()
                .widgetLabel {
                    Gauge(value: Double(day), in: 0...Double(max(total, 1))) { Text(state.tripTitle ?? "") }
                }
        case .inline:
            Label(WatchFormat.dayOf(day, total), systemImage: "suitcase.rolling.fill")
        }
    }

    @ViewBuilder
    private func upcoming(_ days: Int) -> some View {
        let unit = WatchFormat.daysUnit(days)
        switch family {
        case .circular:
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: -2) {
                    Text("\(days)").font(.system(size: 20, weight: .heavy, design: .rounded)).widgetAccentable()
                    Text(unit).font(.system(size: 9, weight: .semibold, design: .rounded)).lineLimit(1).minimumScaleFactor(0.6)
                }
                .padding(4)
            }
        case .rectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(L("countdown.title")).font(.system(.caption2, design: .rounded).weight(.semibold)).foregroundStyle(.secondary)
                Text(state.tripTitle ?? "").font(.system(.headline, design: .rounded)).lineLimit(1)
                Text("\(days) \(unit)").font(.system(.title3, design: .rounded).weight(.bold)).widgetAccentable()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .corner:
            Image(systemName: "suitcase.rolling.fill")
                .font(.system(size: 20, weight: .semibold))
                .widgetAccentable()
                .widgetLabel { Text("\(days) \(unit)") }
        case .inline:
            Label("\(state.tripTitle ?? "") · \(days) \(unit)", systemImage: "suitcase.rolling.fill")
        }
    }
}

/// Nothing to count down or show: the TREK mark, and a word when there is room.
struct ComplicationIdle: View {
    let state: ComplicationState
    let family: ComplicationFamily

    var body: some View {
        let text = state.tripTitle == nil ? L("complication.noTrip") : L("today.done")
        switch family {
        case .circular:
            ZStack {
                AccessoryWidgetBackground()
                TrekMark().frame(width: 22, height: 22).widgetAccentable()
            }
        case .rectangular:
            HStack(spacing: 8) {
                TrekMark().frame(width: 26, height: 26).widgetAccentable()
                VStack(alignment: .leading, spacing: 1) {
                    Text("TREK").font(.system(.headline, design: .rounded))
                    Text(text).font(.system(.footnote, design: .rounded)).foregroundStyle(.secondary).lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .corner:
            TrekMark().frame(width: 20, height: 20).widgetAccentable().widgetLabel { Text(text) }
        case .inline:
            Text("TREK · \(text)")
        }
    }
}
