import ActivityKit
import SwiftUI
import WidgetKit

/// A travel day on the lock screen and in the Dynamic Island: the next stop and
/// its time, and how much of the day is behind.
struct TripDayLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TripDayAttributes.self) { context in
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(context.attributes.tripTitle).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    Spacer()
                    Text(context.state.dayLabel).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                }
                HStack(alignment: .firstTextBaseline) {
                    Image(systemName: "mappin.circle.fill")
                    Text(context.state.nextName).font(.headline).lineLimit(1)
                    Spacer()
                    if let time = context.state.nextTime {
                        Text(time).font(.headline.monospacedDigit())
                    }
                }
                ProgressView(value: Double(context.state.done), total: Double(max(context.state.total, 1)))
            }
            .padding()
            .widgetURL(WidgetSnapshot.link(context.attributes.path))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.state.dayLabel, systemImage: "map").font(.caption)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if let time = context.state.nextTime {
                        Text(time).font(.caption.monospacedDigit())
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.nextName).font(.headline).lineLimit(1)
                        ProgressView(value: Double(context.state.done), total: Double(max(context.state.total, 1)))
                    }
                }
            } compactLeading: {
                Image(systemName: "mappin.circle.fill")
            } compactTrailing: {
                Text(context.state.nextTime ?? "\(context.state.done)/\(context.state.total)")
                    .font(.caption2.monospacedDigit())
            } minimal: {
                Image(systemName: "mappin.circle.fill")
            }
            .widgetURL(WidgetSnapshot.link(context.attributes.path))
        }
    }
}
