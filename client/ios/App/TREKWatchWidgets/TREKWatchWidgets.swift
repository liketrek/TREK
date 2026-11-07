import SwiftUI
import WidgetKit

/// The watch's complications and Smart Stack widgets, drawn from the snapshot
/// the watch app keeps (WatchStore, in the keychain group both share): the
/// next stop of the day, a countdown to the next departure, the day of the trip.
@main
struct TREKWatchWidgets: WidgetBundle {
    var body: some Widget {
        NextStopWidget()
        CountdownWidget()
        TripDayWidget()
    }
}

struct WatchEntry: TimelineEntry {
    let date: Date
    let snapshot: WatchSnapshot?
    let relevance: TimelineEntryRelevance?

    var state: ComplicationState { ComplicationState(snapshot, now: date) }
}

/// One entry now and one at every moment the face should change (a stop
/// starts or ends, a booking departs, midnight), each scored for the Smart
/// Stack: highest just before something happens.
struct WatchProvider: TimelineProvider {
    let kind: Kind

    enum Kind { case nextStop, countdown, tripDay }

    func placeholder(in context: Context) -> WatchEntry {
        WatchEntry(date: Date(), snapshot: WatchSample.snapshot(.running), relevance: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (WatchEntry) -> Void) {
        let stored = WatchStore.loadSnapshot()
        completion(WatchEntry(date: Date(), snapshot: context.isPreview && stored == nil ? WatchSample.snapshot(.running) : stored, relevance: nil))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WatchEntry>) -> Void) {
        let now = Date()
        let snapshot = WatchStore.loadSnapshot()?.applying(WatchStore.loadPending())
        // Every quarter hour as well, so the counts in the text stay current.
        var moments = ComplicationState.changes(snapshot, from: now)
        for step in 1...8 { moments.append(now.addingTimeInterval(Double(step) * 15 * 60)) }
        let dates = ([now] + moments).sorted().reduce(into: [Date]()) { out, date in
            if let last = out.last, date.timeIntervalSince(last) < 60 { return }
            out.append(date)
        }
        let entries = dates.prefix(40).map { date in
            WatchEntry(date: date, snapshot: snapshot, relevance: relevance(snapshot, at: date))
        }
        completion(Timeline(entries: entries, policy: .after(dates.last ?? now.addingTimeInterval(3_600))))
    }

    private func relevance(_ snapshot: WatchSnapshot?, at date: Date) -> TimelineEntryRelevance? {
        let state = ComplicationState(snapshot, now: date)
        switch kind {
        case .nextStop:
            guard let next = state.next else { return TimelineEntryRelevance(score: 0) }
            if next.isNow { return TimelineEntryRelevance(score: 60, duration: 30 * 60) }
            let minutes = (next.start ?? date).timeIntervalSince(date) / 60
            return TimelineEntryRelevance(score: minutes <= 45 ? 80 : minutes <= 120 ? 40 : 10)
        case .countdown:
            guard let countdown = state.countdown else { return TimelineEntryRelevance(score: 0) }
            let hours = countdown.target.timeIntervalSince(date) / 3_600
            return TimelineEntryRelevance(score: hours <= 3 ? 100 : hours <= 24 ? 50 : 5)
        case .tripDay:
            if case .running = state.phase { return TimelineEntryRelevance(score: 20) }
            return TimelineEntryRelevance(score: 0)
        }
    }
}

private let families: [WidgetFamily] = [.accessoryCircular, .accessoryRectangular, .accessoryCorner, .accessoryInline]

private struct EntryView<Content: View>: View {
    let entry: WatchEntry
    @Environment(\.widgetFamily) private var widgetFamily
    @ViewBuilder let content: (ComplicationState, ComplicationFamily, Date) -> Content

    var body: some View {
        content(entry.state, ComplicationFamily(widgetFamily) ?? .rectangular, entry.date)
            .containerBackground(for: .widget) { Color.clear }
    }
}

struct NextStopWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "com.liketrek.trek.watch.nextStop", provider: WatchProvider(kind: .nextStop)) { entry in
            EntryView(entry: entry) { state, family, now in NextStopComplication(state: state, family: family, now: now) }
        }
        .configurationDisplayName(L("complication.nextStop.name"))
        .description(L("complication.nextStop.description"))
        .supportedFamilies(families)
    }
}

struct CountdownWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "com.liketrek.trek.watch.countdown", provider: WatchProvider(kind: .countdown)) { entry in
            EntryView(entry: entry) { state, family, now in CountdownComplication(state: state, family: family, now: now) }
        }
        .configurationDisplayName(L("complication.countdown.name"))
        .description(L("complication.countdown.description"))
        .supportedFamilies(families)
    }
}

struct TripDayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "com.liketrek.trek.watch.tripDay", provider: WatchProvider(kind: .tripDay)) { entry in
            EntryView(entry: entry) { state, family, _ in TripDayComplication(state: state, family: family) }
        }
        .configurationDisplayName(L("complication.tripDay.name"))
        .description(L("complication.tripDay.description"))
        .supportedFamilies(families)
    }
}
