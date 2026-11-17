import SwiftUI

/// The trip's next flight, or the one in the air: both airports large, the
/// route as an arc with the aircraft riding it, the moment in words with a
/// countdown the system keeps running, and the delay. Between two snapshots
/// the widget moves on with the clock: it takes off at the observed (or
/// planned) time, flies along the arc and lands at the expected (or planned)
/// arrival.
struct FlightContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date
    @Environment(\.colorScheme) private var scheme

    private let accent = Trek.booking("flight").color

    var body: some View {
        if let flight = snapshot?.flight, let labels = snapshot?.labels {
            let moment = FlightMoment(flight, now: now)
            switch family {
            case .circular: circular(flight, moment)
            case .rectangular: rectangular(flight, moment, labels)
            case .inline: inline(flight, moment, labels)
            case .small: small(flight, moment, labels)
            case .medium: medium(flight, moment, labels)
            default: large(flight, moment, labels)
            }
        } else {
            empty(snapshot?.labels)
        }
    }

    // MARK: Small: the moment above, the route below

    private func small(_ f: WidgetSnapshot.Flight, _ m: FlightMoment, _ labels: WidgetSnapshot.Labels) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                Image(systemName: "airplane").font(.system(size: 12, weight: .bold)).foregroundStyle(accent)
                Text(f.number).font(.system(size: 12, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                Spacer(minLength: 0)
                delayChip(f, labels, compact: true)
            }
            Spacer(minLength: 0)
            momentText(f, m, labels)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(m.stage == .airborne ? accent : Trek.ink(scheme))
                .lineLimit(2)
                .minimumScaleFactor(0.85)
            Spacer(minLength: 6)
            HStack(alignment: .firstTextBaseline) {
                Text(f.from).font(Trek.number(24, .heavy)).foregroundStyle(Trek.ink(scheme))
                Spacer(minLength: 2)
                Text(f.to).font(Trek.number(24, .heavy)).foregroundStyle(Trek.ink(scheme))
            }
            RouteArc(progress: m.progress, color: accent).flipsForRightToLeftLayoutDirection(true).frame(height: 20).padding(.vertical, 3)
            HStack {
                Text(f.depTime).font(Trek.number(12, .bold)).foregroundStyle(Trek.muted(scheme))
                Spacer(minLength: 2)
                Text(f.arrTimeExpected ?? f.arrTime).font(Trek.number(12, .bold)).foregroundStyle(Trek.muted(scheme))
            }
        }
    }

    // MARK: Medium: a boarding pass

    private func medium(_ f: WidgetSnapshot.Flight, _ m: FlightMoment, _ labels: WidgetSnapshot.Labels) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 7) {
                Text(labels.flight ?? "").trekEyebrow(scheme)
                Text(f.number).font(.system(size: 11, weight: .heavy)).foregroundStyle(accent)
                Spacer(minLength: 4)
                delayChip(f, labels, compact: false)
            }
            Spacer(minLength: 4)
            HStack(alignment: .center, spacing: 10) {
                airport(f.from, f.fromCity, time: f.depTime, planned: nil, align: .leading)
                VStack(spacing: 4) {
                    RouteArc(progress: m.progress, color: accent).flipsForRightToLeftLayoutDirection(true).frame(height: 30)
                    progressBar(m)
                }
                .frame(maxWidth: .infinity)
                airport(f.to, f.toCity, time: f.arrTimeExpected ?? f.arrTime, planned: f.arrTimeExpected.flatMap { $0 == f.arrTime ? nil : f.arrTime }, align: .trailing)
            }
            Spacer(minLength: 6)
            momentText(f, m, labels)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(m.stage == .airborne ? accent : Trek.ink(scheme))
                .lineLimit(1)
                .minimumScaleFactor(0.85)
        }
    }

    // MARK: Large and extra large: the pass with the details under it

    private func large(_ f: WidgetSnapshot.Flight, _ m: FlightMoment, _ labels: WidgetSnapshot.Labels) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            medium(f, m, labels).frame(maxHeight: 150)
            Rectangle().fill(Trek.track(scheme)).frame(height: 0.8)
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                if let aircraft = f.aircraft { detail(systemImage: "airplane.circle", value: aircraft) }
                detail(systemImage: "clock", value: "\(f.depTime) → \(f.arrTimeExpected ?? f.arrTime)")
                if let fromCity = f.fromCity { detail(systemImage: "airplane.departure", value: fromCity) }
                if let toCity = f.toCity { detail(systemImage: "airplane.arrival", value: toCity) }
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: Lock screen

    private func circular(_ f: WidgetSnapshot.Flight, _ m: FlightMoment) -> some View {
        ProgressRing(value: m.progress, lineWidth: 5, colors: [.white], trackColor: Color.white.opacity(0.25)) {
            Image(systemName: m.stage == .landed ? "airplane.arrival" : m.stage == .airborne ? "airplane" : "airplane.departure")
                .font(.system(size: 17, weight: .bold))
        }
        .padding(4)
    }

    private func rectangular(_ f: WidgetSnapshot.Flight, _ m: FlightMoment, _ labels: WidgetSnapshot.Labels) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: "airplane").font(.system(size: 11, weight: .bold))
                Text("\(f.number)  \(f.from) → \(f.to)").font(.system(size: 12, weight: .heavy)).lineLimit(1)
            }
            momentText(f, m, labels).font(.system(size: 13, weight: .semibold)).lineLimit(1)
            if m.stage == .airborne {
                ProgressView(timerInterval: m.start...m.end, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }
                    .progressViewStyle(.linear)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func inline(_ f: WidgetSnapshot.Flight, _ m: FlightMoment, _ labels: WidgetSnapshot.Labels) -> some View {
        Text("\(Image(systemName: "airplane")) \(f.number) ") + momentText(f, m, labels)
    }

    // MARK: Parts

    private func airport(_ code: String, _ city: String?, time: String, planned: String?, align: HorizontalAlignment) -> some View {
        VStack(alignment: align, spacing: 1) {
            Text(code).font(Trek.number(28, .heavy)).foregroundStyle(Trek.ink(scheme))
            if let city { Text(city).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(Trek.faint(scheme)).lineLimit(1) }
            if let planned { Text(planned).font(Trek.number(10.5, .bold)).strikethrough().foregroundStyle(Trek.faint(scheme)) }
            Text(time).font(Trek.number(14, .heavy)).foregroundStyle(Trek.ink(scheme))
        }
        .frame(maxWidth: 96, alignment: align == .leading ? .leading : .trailing)
    }

    @ViewBuilder
    private func progressBar(_ m: FlightMoment) -> some View {
        if m.stage == .airborne {
            // The system runs this bar on its own, so it fills between two snapshots too.
            ProgressView(timerInterval: m.start...m.end, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }
                .progressViewStyle(.linear)
                .tint(accent)
        } else {
            Capsule().fill(m.stage == .landed ? accent : Trek.track(scheme)).frame(height: 4)
        }
    }

    private func detail(systemImage: String, value: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage).font(.system(size: 12, weight: .semibold)).foregroundStyle(accent)
            Text(value).font(.system(size: 12, weight: .semibold)).foregroundStyle(Trek.muted(scheme)).lineLimit(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Trek.card(scheme)))
    }

    /// "Departs in 2 hr, 10 min", "Lands in 1 hr", "Landed": the countdowns are the system's own running text.
    private func momentText(_ f: WidgetSnapshot.Flight, _ m: FlightMoment, _ labels: WidgetSnapshot.Labels) -> Text {
        switch m.stage {
        case .upcoming:
            return Countdown.text(labels.flightDeparts ?? "{time}", until: m.start)
        case .ready:
            return Text(labels.flightReady ?? "")
        case .airborne:
            // "In the air" is what the blue line and the moving aircraft say; the words count down to landing.
            return Countdown.text(labels.flightLands ?? "{time}", until: m.end)
        case .landed:
            return Text(labels.flightLanded ?? "")
        }
    }

    @ViewBuilder
    private func delayChip(_ f: WidgetSnapshot.Flight, _ labels: WidgetSnapshot.Labels, compact: Bool) -> some View {
        if let delay = f.delay {
            let late = delay > 5
            let early = delay < -5
            let color = late ? (delay >= 30 ? Trek.danger : Trek.pending) : Trek.confirmed
            let text = late
                ? (labels.flightLate ?? "+{m}").replacingOccurrences(of: "{m}", with: "\(delay)")
                : early ? (labels.flightEarly ?? "{m}").replacingOccurrences(of: "{m}", with: "\(-delay)") : (labels.flightOnTime ?? "")
            if !(compact && !late) {
                Text(text)
                    .font(.system(size: 10.5, weight: .heavy))
                    .foregroundStyle(color)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(color.opacity(scheme == .dark ? 0.22 : 0.14)))
                    .lineLimit(1)
            }
        }
    }

    private func empty(_ labels: WidgetSnapshot.Labels?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(labels?.flight ?? "").trekEyebrow(scheme)
            Spacer(minLength: 0)
            Image(systemName: "airplane").font(.system(size: 30, weight: .bold)).foregroundStyle(accent.opacity(0.35))
            Text(labels?.noFlight ?? labels?.noBookings ?? "").font(.system(size: 13, weight: .semibold)).foregroundStyle(Trek.muted(scheme)).lineLimit(2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

/// Where a flight stands at a given moment, from the snapshot's times. What the
/// feed saw wins: a flight still at the gate past its planned departure is not
/// flown along the arc, and a flight is only landed once confirmed. Only a
/// flight the feed never heard of moves on by its schedule alone.
struct FlightMoment {
    enum Stage { case upcoming, ready, airborne, landed }

    let stage: Stage
    /// 0 at the gate, 1 at the destination.
    let progress: Double
    /// Take-off and touchdown the moment is measured between: observed or expected where known, planned otherwise.
    let start: Date
    let end: Date

    init(_ f: WidgetSnapshot.Flight, now: Date) {
        let start = Date(timeIntervalSince1970: f.depActual ?? f.depExpected ?? f.dep)
        let end = max(Date(timeIntervalSince1970: f.arrExpected ?? f.arr), start.addingTimeInterval(60))
        self.start = start
        self.end = end
        let heard = f.seen != nil
        let flying = f.airborne == true || f.depActual != nil || (!heard && now >= start)
        // A flight the feed lost stops counting two hours after its arrival.
        if f.landed == true || (!heard && now >= end) || now >= end.addingTimeInterval(7200) {
            stage = .landed
            progress = 1
        } else if flying {
            stage = .airborne
            // Unconfirmed, it never quite arrives on the arc.
            progress = min(0.98, max(0, now.timeIntervalSince(start) / end.timeIntervalSince(start)))
        } else if now >= start {
            stage = .ready
            progress = 0
        } else {
            stage = .upcoming
            progress = 0
        }
    }
}

/// A sentence with "{time}" in it, the placeholder replaced by a countdown the system keeps running.
enum Countdown {
    static func text(_ sentence: String, until date: Date) -> Text {
        let parts = sentence.components(separatedBy: "{time}")
        guard parts.count == 2 else { return Text(sentence) }
        return Text(parts[0]) + Text(date, style: .relative) + Text(parts[1])
    }
}
