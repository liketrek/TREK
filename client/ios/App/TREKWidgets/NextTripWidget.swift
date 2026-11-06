import SwiftUI
import WidgetKit

/// "Next trip" on the home screen: the trip and how far off it is, or while it
/// runs, today's day and the next stops (medium size).
struct NextTripEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

struct NextTripProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextTripEntry {
        NextTripEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (NextTripEntry) -> Void) {
        completion(NextTripEntry(date: Date(), snapshot: WidgetSnapshot.load()))
    }

    /// The app reloads the timeline whenever it writes a new snapshot; past
    /// midnight the countdown moves on by itself.
    func getTimeline(in context: Context, completion: @escaping (Timeline<NextTripEntry>) -> Void) {
        let now = Date()
        let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
        let entry = NextTripEntry(date: now, snapshot: WidgetSnapshot.load())
        completion(Timeline(entries: [entry], policy: .after(midnight)))
    }
}

struct NextTripWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: NextTripEntry

    var body: some View {
        content
            .widgetURL(entry.snapshot?.trip.flatMap { WidgetSnapshot.link($0.path) })
            .modifier(WidgetBackground())
    }

    @ViewBuilder
    private var content: some View {
        if let snapshot = entry.snapshot, let trip = snapshot.trip {
            VStack(alignment: .leading, spacing: 4) {
                Text(snapshot.today == nil ? snapshot.labels.nextTrip : snapshot.labels.today)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                Text(trip.title)
                    .font(.headline)
                    .lineLimit(2)
                if let today = snapshot.today {
                    Text(today.dayLabel)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if family != .systemSmall {
                        stops(today.stops, nothing: snapshot.labels.nothingPlanned)
                    }
                } else if let days = snapshot.daysUntilStart(from: entry.date), days > 0 {
                    Spacer(minLength: 0)
                    Text(days == 1 ? snapshot.labels.tomorrow : snapshot.labels.inDays.replacingOccurrences(of: "{n}", with: String(days)))
                        .font(.title3.weight(.bold))
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text("TREK").font(.headline)
                Text(entry.snapshot?.labels.noTrip ?? "")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func stops(_ stops: [WidgetSnapshot.Stop], nothing: String) -> some View {
        if stops.isEmpty {
            Text(nothing).font(.caption).foregroundStyle(.secondary)
        } else {
            VStack(alignment: .leading, spacing: 2) {
                ForEach(Array(stops.prefix(3).enumerated()), id: \.offset) { _, stop in
                    HStack(spacing: 6) {
                        Text(stop.time ?? "")
                            .font(.caption2.monospacedDigit().weight(.semibold))
                            .foregroundStyle(.secondary)
                            .frame(minWidth: 36, alignment: .leading)
                        Text(stop.name).font(.caption).lineLimit(1)
                    }
                }
            }
        }
    }
}

/// The system background on iOS 17 and later, the plain one before.
struct WidgetBackground: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(.fill.tertiary, for: .widget)
        } else {
            content.padding()
        }
    }
}

struct NextTripWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "NextTrip", provider: NextTripProvider()) { entry in
            NextTripWidgetView(entry: entry)
        }
        .configurationDisplayName("TREK")
        .description("Your next trip, and today's plan while you travel.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
