import ActivityKit
import SwiftUI
import WidgetKit

/// A travel day on the lock screen and in the Dynamic Island: the next stop and
/// its time, and how much of the day is behind, in the widgets' look.
struct TripDayLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TripDayAttributes.self) { context in
            TripDayBanner(
                tripTitle: context.attributes.tripTitle, dayLabel: context.state.dayLabel,
                nextName: context.state.nextName, nextTime: context.state.nextTime,
                done: context.state.done, total: context.state.total
            )
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
                        DayStopProgress(done: state.done, total: state.total)
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
