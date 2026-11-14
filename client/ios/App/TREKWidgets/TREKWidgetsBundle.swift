import SwiftUI
import WidgetKit

/// The TREK widgets: the trip, today's plan, the bookings ahead, the next flight, the to-dos,
/// the packing list, the Atlas and the travel group on the home and lock
/// screen, and the travel day as a Live Activity.
@main
struct TREKWidgetsBundle: WidgetBundle {
    var body: some Widget {
        NextTripWidget()
        TodayWidget()
        BookingsWidget()
        FlightWidget()
        TodosWidget()
        PackingWidget()
        AtlasWidget()
        CollabWidget()
        TripDayLiveActivity()
    }
}
