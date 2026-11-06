import AppIntents
import WidgetKit

/// The trip a widget shows, picked in "Edit Widget": the dashboard's trip by
/// default ("Automatic"), or any trip the app listed in widget.trips.
struct TripChoice: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "widget.intent.trip"
    static var defaultQuery = TripChoiceQuery()

    /// The id of the automatic choice, which follows the dashboard's trip.
    static let automaticID = "auto"

    var id: String
    var title: String
    var dates: String?

    var displayRepresentation: DisplayRepresentation {
        if id == TripChoice.automaticID {
            return DisplayRepresentation(title: "widget.intent.auto", subtitle: "widget.intent.autoHint")
        }
        return DisplayRepresentation(title: "\(title)", subtitle: dates.map { "\($0)" })
    }

    static var automatic: TripChoice { TripChoice(id: automaticID, title: "", dates: nil) }
}

struct TripChoiceQuery: EntityQuery {
    func entities(for identifiers: [TripChoice.ID]) async throws -> [TripChoice] {
        all().filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [TripChoice] {
        all()
    }

    func defaultResult() async -> TripChoice? {
        .automatic
    }

    /// Automatic first, then the trips the app sent, soonest first.
    private func all() -> [TripChoice] {
        [.automatic] + WidgetSnapshot.tripIndex().map {
            TripChoice(id: String($0.id), title: $0.title, dates: RelativeDay.range($0.start, $0.end))
        }
    }
}

struct SelectTripIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "widget.intent.title"
    static var description = IntentDescription("widget.intent.description")

    @Parameter(title: "widget.intent.trip")
    var trip: TripChoice?
}

/// Like TrekProvider, for the widgets that show one trip: the snapshot of the
/// trip picked for the widget, or the dashboard's.
struct TrekTripProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> TrekEntry {
        TrekEntry(date: Date(), snapshot: .sample(running: false))
    }

    func snapshot(for configuration: SelectTripIntent, in context: Context) async -> TrekEntry {
        let stored = WidgetSnapshot.load(trip: configuration.trip?.id)
        let snapshot: WidgetSnapshot? = (stored?.trip != nil || !context.isPreview) ? stored : WidgetSnapshot.sample(running: false)
        return TrekEntry(date: Date(), snapshot: snapshot)
    }

    func timeline(for configuration: SelectTripIntent, in context: Context) async -> Timeline<TrekEntry> {
        TrekProvider.timeline(WidgetSnapshot.load(trip: configuration.trip?.id))
    }
}
