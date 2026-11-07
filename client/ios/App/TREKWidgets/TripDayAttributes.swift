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
    }

    var tripTitle: String
    /// The app path a tap opens.
    var path: String
}
