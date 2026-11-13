import ActivityKit
import Foundation

/// The Live Activity for a travel day: which trip and day, and the next stop.
/// Compiled into both the app (which starts and updates it, TrekShellPlugin)
/// and the widget extension (which draws it, TripDayLiveActivity).
@available(iOS 16.1, *)
struct TripDayAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        /// "Day 2 of 5", already in the user's language.
        var dayLabel: String
        /// The next stop, or the label for "all done" once the day's stops are behind.
        var nextName: String
        /// The next stop's time as the user formats it, if it has one.
        var nextTime: String?
        /// Stops behind, out of the day's stops.
        var done: Int
        var total: Int
        /// The day's flight while it is near or in the air, so the activity turns into
        /// a boarding pass. Optional: a state written by an older app decodes without it.
        var flight: Flight?
    }

    /// A flight the activity follows on its own between two updates: the system
    /// runs the bar and the countdown from the two times.
    struct Flight: Codable, Hashable {
        var number: String
        var from: String
        var to: String
        /// Take-off and touchdown, epoch seconds: observed or expected where known.
        var dep: Double
        var arr: Double
        /// The clock at either airport, formatted by the app.
        var depTime: String
        var arrTime: String
        /// Minutes late, for the colour of the arrival time.
        var delay: Int?
        /// In the air when the app last looked: the countdown runs to touchdown.
        var airborne: Bool?
    }

    var tripTitle: String
    /// The app path a tap opens.
    var path: String
}
