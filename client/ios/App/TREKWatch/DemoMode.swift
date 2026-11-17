import Foundation

/// The screenshot mode: started with launch arguments, the app runs on the
/// sample trip at a fixed time and opens on one screen, so the CI can capture
/// every screen in every size and language from a simulator
/// (.github/workflows/native.yml, watch-screens). Nothing is sent or stored.
///
///   -TrekDemo <screen>    today, day, place, booking, booking-detail, bookings,
///                         trip, days, packing, todos, lists, countdown, empty,
///                         nosync, faces
///   -TrekScenario <name>  running, travelday or upcoming (default by screen)
///   -TrekReady <token>    once the screen has drawn, writes Documents/ready-<token>
///                         in the app's container, which the script waits for
///   -TrekNow <HH:mm>      the time the screens think it is; without it the
///                         real time, which the capture script moves to the
///                         hour it wants with the app's time zone (TZ), so the
///                         clock in the corner agrees with the screen
enum DemoMode {
    enum Screen: String {
        case today, day, place, booking, bookings, trip, days, packing, todos, lists, countdown, empty, nosync, faces
        case bookingDetail = "booking-detail"
    }

    static var screen: Screen? {
        value(after: "-TrekDemo").flatMap(Screen.init(rawValue:))
    }

    /// Tells the capture script the screen is up: a moment after it appeared,
    /// so the navigation to it and the first layout have settled.
    static func signalReady() {
        guard let token = value(after: "-TrekReady"),
              let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            try? FileManager.default.createDirectory(at: documents, withIntermediateDirectories: true)
            try? Data().write(to: documents.appendingPathComponent("ready-\(token)"))
        }
    }

    @MainActor
    static func start() {
        guard let screen else { return }
        let now = clock()
        let scenario = value(after: "-TrekScenario").flatMap(WatchSample.Scenario.init(rawValue:)) ?? defaultScenario(screen)
        switch screen {
        case .nosync:
            WatchModel.shared.startDemo(nil, now: now)
        case .empty:
            WatchModel.shared.startDemo(WatchSnapshot(generatedAt: ISO8601DateFormatter().string(from: now), trip: nil), now: now)
        default:
            WatchModel.shared.startDemo(WatchSample.snapshot(scenario, now: now), now: now)
        }
    }

    private static func defaultScenario(_ screen: Screen) -> WatchSample.Scenario {
        switch screen {
        case .booking, .bookings, .bookingDetail: return .travelday
        case .countdown, .packing, .lists: return .upcoming
        default: return .running
        }
    }

    private static func clock() -> Date {
        guard let parts = value(after: "-TrekNow")?.split(separator: ":").compactMap({ Int($0) }), parts.count == 2 else { return Date() }
        return TrekDate.at(parts[0] * 60 + parts[1], on: Date())
    }

    private static func value(after flag: String) -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: flag), index + 1 < args.count else { return nil }
        return args[index + 1]
    }
}
