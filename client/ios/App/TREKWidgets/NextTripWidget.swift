import SwiftUI
import WidgetKit

/// The home-screen and lock-screen widgets; their gallery names and
/// descriptions are in <language>.lproj/Localizable.strings. Each reads the snapshot the app
/// last wrote (WidgetSnapshot) and draws it with the views in *Content.swift,
/// which know nothing of WidgetKit so the preview renderer can draw them too.
struct TrekEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

struct TrekProvider: TimelineProvider {
    func placeholder(in context: Context) -> TrekEntry {
        TrekEntry(date: Date(), snapshot: .sample(running: false))
    }

    /// The gallery shows the user's own trip when the app has written one, a
    /// sample trip before that.
    func getSnapshot(in context: Context, completion: @escaping (TrekEntry) -> Void) {
        let stored = WidgetSnapshot.load()
        let snapshot: WidgetSnapshot? = (stored?.trip != nil || !context.isPreview) ? stored : WidgetSnapshot.sample(running: false)
        completion(TrekEntry(date: Date(), snapshot: snapshot))
    }

    /// An entry every quarter hour for the next six hours, so the now line and
    /// the next stop move on without the app; the app reloads the timeline
    /// whenever it writes a new snapshot.
    func getTimeline(in context: Context, completion: @escaping (Timeline<TrekEntry>) -> Void) {
        let snapshot = WidgetSnapshot.load()
        let now = Date()
        let calendar = Calendar.current
        let minute = calendar.component(.minute, from: now)
        let firstStep = calendar.date(byAdding: .minute, value: 15 - minute % 15, to: now) ?? now
        var entries = [TrekEntry(date: now, snapshot: snapshot)]
        for step in 0..<24 {
            if let date = calendar.date(byAdding: .minute, value: step * 15, to: firstStep) {
                entries.append(TrekEntry(date: calendar.date(bySetting: .second, value: 0, of: date) ?? date, snapshot: snapshot))
            }
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

extension TrekFamily {
    init(_ family: WidgetFamily) {
        switch family {
        case .systemSmall: self = .small
        case .systemMedium: self = .medium
        case .accessoryCircular: self = .circular
        case .accessoryRectangular: self = .rectangular
        case .accessoryInline: self = .inline
        default: self = .large
        }
    }
}

/// The widget's ground: the content on its background, through the container
/// background on iOS 17 (which the system can tint and remove), the plain way before.
struct TrekContainer<Content: View, Background: View>: View {
    @Environment(\.widgetFamily) private var family
    let link: URL?
    @ViewBuilder var content: () -> Content
    @ViewBuilder var background: () -> Background

    var body: some View {
        let accessory = TrekFamily(family).isAccessory
        Group {
            if #available(iOSApplicationExtension 17.0, *) {
                content().containerBackground(for: .widget) {
                    if accessory { Color.clear } else { background() }
                }
            } else {
                content().padding(accessory ? 0 : 16).background(accessory ? nil : background())
            }
        }
        .widgetURL(link)
    }
}

// MARK: - Trip

struct NextTripWidget: Widget {
    var body: some WidgetConfiguration {
        // The kind stays "NextTrip" so widgets placed before the redesign keep working.
        StaticConfiguration(kind: "NextTrip", provider: TrekProvider()) { entry in
            TripWidgetView(entry: entry)
        }
        .configurationDisplayName("widget.trip.name")
        .description("widget.trip.description")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct TripWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TrekEntry

    var body: some View {
        let snapshot = entry.snapshot
        TrekContainer(link: snapshot?.trip.flatMap { WidgetSnapshot.link($0.path) }) {
            TripContent(snapshot: snapshot, family: TrekFamily(family), now: entry.date)
        } background: {
            if snapshot?.trip != nil { TripBackdrop(trip: snapshot?.trip) } else { TrekPaper() }
        }
    }
}

// MARK: - Today

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TripToday", provider: TrekProvider()) { entry in
            TrekContainer(link: entry.snapshot?.trip.flatMap { WidgetSnapshot.link($0.path) }) {
                TodayFamilyView(entry: entry)
            } background: {
                TrekPaper()
            }
        }
        .configurationDisplayName("widget.today.name")
        .description("widget.today.description")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

private struct TodayFamilyView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TrekEntry
    var body: some View { TodayContent(snapshot: entry.snapshot, family: TrekFamily(family), now: entry.date) }
}

// MARK: - Bookings

struct BookingsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TripBookings", provider: TrekProvider()) { entry in
            TrekContainer(link: entry.snapshot?.bookings?.first.flatMap { WidgetSnapshot.link($0.path) }) {
                BookingsFamilyView(entry: entry)
            } background: {
                TrekPaper()
            }
        }
        .configurationDisplayName("widget.bookings.name")
        .description("widget.bookings.description")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
    }
}

private struct BookingsFamilyView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TrekEntry
    var body: some View { BookingsContent(snapshot: entry.snapshot, family: TrekFamily(family), now: entry.date) }
}

// MARK: - To-dos

struct TodosWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TripTodos", provider: TrekProvider()) { entry in
            TrekContainer(link: entry.snapshot?.todos.flatMap { WidgetSnapshot.link($0.path) }) {
                TodosFamilyView(entry: entry)
            } background: {
                TrekPaper()
            }
        }
        .configurationDisplayName("widget.todos.name")
        .description("widget.todos.description")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
    }
}

private struct TodosFamilyView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TrekEntry
    var body: some View { TodosContent(snapshot: entry.snapshot, family: TrekFamily(family), now: entry.date) }
}
