import SwiftUI
import WidgetKit

/// The TREK widgets: the next trip on the home screen, and the travel day as a
/// Live Activity.
@main
struct TREKWidgetsBundle: WidgetBundle {
    var body: some Widget {
        NextTripWidget()
        TripDayLiveActivity()
    }
}
