import ActivityKit
import SwiftUI
import WidgetKit

/// A travel day on the lock screen and in the Dynamic Island: the next stop and
/// its time, and how much of the day is behind, in the widgets' look.
struct TripDayLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TripDayAttributes.self) { context in
            TripDayBanner(attributes: context.attributes, state: context.state)
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
                    VStack(alignment: .leading, spacing: 8) {
                        Text(state.nextName).font(.system(size: 17, weight: .heavy)).lineLimit(1)
                        StopProgress(done: state.done, total: state.total)
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Image(systemName: "mappin.circle.fill").foregroundStyle(Trek.confirmed)
            } compactTrailing: {
                Text(state.nextTime ?? "\(state.done)/\(state.total)")
                    .font(Trek.number(13, .heavy))
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

/// The lock-screen banner: trip and day on top, the next stop large, the
/// day's stops as segments.
private struct TripDayBanner: View {
    let attributes: TripDayAttributes
    let state: TripDayAttributes.ContentState

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.18), lineWidth: 5)
                Circle()
                    .trim(from: 0, to: state.total > 0 ? max(0.02, Double(state.done) / Double(state.total)) : 0)
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
                    Text(attributes.tripTitle)
                        .font(.system(size: 11, weight: .bold))
                        .tracking(0.5)
                        .textCase(.uppercase)
                        .foregroundStyle(.white.opacity(0.65))
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    Text(state.dayLabel).font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.65)).lineLimit(1)
                }
                HStack(alignment: .firstTextBaseline) {
                    Text(state.nextName).font(.system(size: 18, weight: .heavy)).foregroundStyle(.white).lineLimit(1)
                    Spacer(minLength: 4)
                    if let time = state.nextTime {
                        Text(time).font(Trek.number(18, .heavy)).foregroundStyle(.white)
                    }
                }
                StopProgress(done: state.done, total: state.total).padding(.top, 3)
            }
        }
        .padding(16)
    }
}

/// The day's timed stops as segments, those behind filled.
private struct StopProgress: View {
    let done: Int
    let total: Int

    var body: some View {
        DaySegments(index: done + 1, total: max(total, 1), color: Trek.confirmed, track: Color.white.opacity(0.2))
    }
}
