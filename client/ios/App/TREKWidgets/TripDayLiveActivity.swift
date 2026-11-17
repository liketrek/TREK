import ActivityKit
import SwiftUI
import WidgetKit

/// A travel day on the lock screen and in the Dynamic Island: the next stop and
/// its time, and how much of the day is behind, in the widgets' look.
struct TripDayLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TripDayAttributes.self) { context in
            Group {
                if let flight = context.state.flight {
                    FlightBanner(flight: flight, tripTitle: context.attributes.tripTitle)
                } else {
                    TripDayBanner(
                        tripTitle: context.attributes.tripTitle, dayLabel: context.state.dayLabel,
                        nextName: context.state.nextName, nextTime: context.state.nextTime,
                        done: context.state.done, total: context.state.total
                    )
                }
            }
                .activityBackgroundTint(Color(hex: 0x0C0C0F).opacity(0.92))
                .activitySystemActionForegroundColor(.white)
                .widgetURL(WidgetSnapshot.link(context.attributes.path))
        } dynamicIsland: { context in
            let state = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.system(size: 18))
                            .foregroundStyle(Trek.confirmed)
                        Text(state.dayLabel).font(.system(size: 13, weight: .bold)).lineLimit(1)
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if let time = state.nextTime {
                        Text(time).font(Trek.number(20, .heavy)).padding(.trailing, 4)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let flight = state.flight {
                        FlightPass(flight: flight).padding(.horizontal, 4)
                    } else {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(state.nextName).font(.system(size: 17, weight: .heavy)).lineLimit(1)
                            DayStopProgress(done: state.done, total: state.total)
                        }
                        .padding(.horizontal, 4)
                    }
                }
            } compactLeading: {
                if let flight = state.flight {
                    HStack(spacing: 3) {
                        Image(systemName: "airplane").foregroundStyle(Trek.info)
                        Text(flight.to).font(Trek.number(13, .heavy))
                    }
                } else {
                    Image(systemName: "mappin.circle.fill").foregroundStyle(Trek.confirmed)
                }
            } compactTrailing: {
                if let flight = state.flight {
                    FlightCountdown(flight: flight).font(Trek.number(13, .heavy)).frame(maxWidth: 64)
                } else {
                    Text(state.nextTime ?? "\(state.done)/\(state.total)")
                        .font(Trek.number(13, .heavy))
                }
            } minimal: {
                ZStack {
                    Circle().stroke(Color.white.opacity(0.25), lineWidth: 2.5)
                    Circle()
                        .trim(from: 0, to: state.total > 0 ? Double(state.done) / Double(state.total) : 0)
                        .stroke(Trek.confirmed, style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                .padding(2)
            }
            .widgetURL(WidgetSnapshot.link(context.attributes.path))
            .keylineTint(Trek.confirmed)
        }
    }
}

/// The day's flight on the lock screen: both airports, the bar the system runs
/// from take-off to touchdown, and a countdown to whichever comes next.
struct FlightBanner: View {
    let flight: TripDayAttributes.Flight
    let tripTitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "airplane").font(.system(size: 12, weight: .bold)).foregroundStyle(Trek.info)
                Text(flight.number).font(.system(size: 12, weight: .heavy)).foregroundStyle(.white)
                Text(tripTitle)
                    .font(.system(size: 11, weight: .bold))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(.white.opacity(0.55))
                    .lineLimit(1)
                Spacer(minLength: 4)
                FlightCountdown(flight: flight).font(Trek.number(15, .heavy)).foregroundStyle(.white)
            }
            FlightPass(flight: flight)
        }
        .padding(16)
    }
}

/// The two airports with their times and the bar between them.
struct FlightPass: View {
    let flight: TripDayAttributes.Flight

    var body: some View {
        let start = Date(timeIntervalSince1970: flight.dep)
        let end = Date(timeIntervalSince1970: flight.arr)
        let late = (flight.delay ?? 0) > 5
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 0) {
                Text(flight.from).font(Trek.number(26, .heavy)).foregroundStyle(.white)
                Text(flight.depTime).font(Trek.number(13, .bold)).foregroundStyle(.white.opacity(0.7))
            }
            VStack(spacing: 4) {
                Image(systemName: "airplane").font(.system(size: 13, weight: .bold)).foregroundStyle(Trek.info)
                ProgressView(timerInterval: start...end, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }
                    .progressViewStyle(.linear)
                    .tint(Trek.info)
            }
            .frame(maxWidth: .infinity)
            VStack(alignment: .trailing, spacing: 0) {
                Text(flight.to).font(Trek.number(26, .heavy)).foregroundStyle(.white)
                Text(flight.arrTime).font(Trek.number(13, .bold)).foregroundStyle(late ? Trek.pending : .white.opacity(0.7))
            }
        }
    }
}

/// A running countdown, in the system's own format: to touchdown once the app saw
/// the aircraft in the air, to take-off before. The system runs it between two
/// updates; the stage changes with the app's next update after take-off.
struct FlightCountdown: View {
    let flight: TripDayAttributes.Flight

    var body: some View {
        let start = Date(timeIntervalSince1970: flight.dep)
        let end = Date(timeIntervalSince1970: flight.arr)
        let flying = flight.airborne == true
        let target = flying ? end : start
        HStack(spacing: 3) {
            Image(systemName: flying ? "airplane.arrival" : "airplane.departure")
            Text(timerInterval: min(Date(), target)...target, countsDown: true)
                .multilineTextAlignment(.trailing)
        }
    }
}
