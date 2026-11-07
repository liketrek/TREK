import Foundation

/// The screenshot mode: started with launch arguments, the app runs on the
/// sample trip at a fixed time and opens on one screen, so the CI can capture
/// every screen in every size and language from a simulator
/// (.github/workflows/native.yml, watch-screens). Nothing is sent or stored.
///
///   -TrekDemo <screen>    today, day, place, booking, bookings, trip, days,
///                         packing, todos, lists, countdown, empty, nosync, faces
///   -TrekScenario <name>  running, travelday or upcoming (default by screen)
///   -TrekNow <HH:mm>      the time the screens think it is
enum DemoMode {
    enum Screen: String {
        case today, day, place, booking, bookings, trip, days, packing, todos, lists, countdown, empty, nosync, faces
    }

    static var screen: Screen? {
        value(after: "-TrekDemo").flatMap(Screen.init(rawValue:))
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
        case .booking, .bookings: return .travelday
        case .countdown, .packing, .lists: return .upcoming
        default: return .running
        }
    }

    private static func clock() -> Date {
        let parts = (value(after: "-TrekNow") ?? "13:05").split(separator: ":").compactMap { Int($0) }
        let minutes = parts.count == 2 ? parts[0] * 60 + parts[1] : 13 * 60 + 5
        return TrekDate.at(minutes, on: Date())
    }

    private static func value(after flag: String) -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: flag), index + 1 < args.count else { return nil }
        return args[index + 1]
    }
}
