import SwiftUI
import WidgetKit

/// The TREK widgets: the trip, today's plan, the bookings ahead and the
/// to-dos on the home and lock screen, and the travel day as a Live Activity.
@main
struct TREKWidgetsBundle: WidgetBundle {
    var body: some Widget {
        NextTripWidget()
        TodayWidget()
        BookingsWidget()
        TodosWidget()
        TripDayLiveActivity()
    }
}
