import SwiftUI

@main
struct TREKWatchApp: App {
    init() {
        if DemoMode.screen != nil {
            DemoMode.start()
        } else {
            WatchLink.shared.activate()
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        // Woken in the background to take a snapshot or complication update from
        // the phone: the task lasts until it is delivered, stored and drawn.
        .backgroundTask(.watchConnectivity) {
            await WatchLink.shared.finishPendingDeliveries()
        }
    }
}

private struct NowKey: EnvironmentKey {
    static let defaultValue = Date()
}

extension EnvironmentValues {
    /// The minute the screens show, from the root's TimelineView (or the screenshot clock).
    var trekNow: Date {
        get { self[NowKey.self] }
        set { self[NowKey.self] = newValue }
    }
}

/// Where a tap leads from the pages.
enum Route: Hashable {
    case day(Int)
    case stop(day: Int, stop: Int)
    case booking(Int)
    case bookings
    case days
    case packing
    case todos
}

enum Page: Hashable {
    case now, booking, trip, lists
}

/// The pages under each other, turned with the Digital Crown: today (or the
/// countdown before the trip), the next booking, the trip, the lists. A
/// minute timeline keeps every countdown current, Always On included.
struct RootView: View {
    private let model = WatchModel.shared
    @State private var path: [Route] = []
    @State private var page: Page = .now
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        TimelineView(.everyMinute) { context in
            let now = model.now(context.date)
            NavigationStack(path: $path) {
                content(now)
                    .navigationDestination(for: Route.self) { route in
                        destination(route)
                    }
            }
            .environment(\.trekNow, now)
        }
        .onAppear {
            openDemoScreen()
            DemoMode.signalReady()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active && !model.isDemo { WatchLink.shared.requestRefresh() }
        }
    }

    @ViewBuilder
    private func content(_ now: Date) -> some View {
        if DemoMode.screen == .faces {
            FacesView(snapshot: model.display, now: now)
        } else if let snapshot = model.display {
            if snapshot.trip == nil || snapshot.phase(at: now) == .past {
                EmptyStateView(kind: .noTrip)
            } else {
                pages(snapshot, now)
            }
        } else {
            EmptyStateView(kind: .notSynced)
        }
    }

    @ViewBuilder
    private func pages(_ snapshot: WatchSnapshot, _ now: Date) -> some View {
        let booking = snapshot.nextBooking(at: now)
        TabView(selection: $page) {
            Group {
                if case .upcoming(let days) = snapshot.phase(at: now) {
                    CountdownPage(snapshot: snapshot, days: days)
                } else {
                    TodayPage(snapshot: snapshot)
                }
            }
            .tag(Page.now)
            if let booking {
                BookingPage(booking: booking, hour12: snapshot.hour12)
                    .tag(Page.booking)
            }
            TripPage(snapshot: snapshot)
                .tag(Page.trip)
            if snapshot.packing != nil || snapshot.todos != nil {
                ListsPage(snapshot: snapshot)
                    .tag(Page.lists)
            }
        }
        .tabViewStyle(.verticalPage)
    }

    @ViewBuilder
    private func destination(_ route: Route) -> some View {
        if let snapshot = model.display {
            switch route {
            case .day(let index): DayView(snapshot: snapshot, index: index)
            case .stop(let day, let stop): StopDetailView(snapshot: snapshot, day: day, stop: stop)
            case .booking(let id): BookingDetailView(snapshot: snapshot, id: id)
            case .bookings: BookingsListView(snapshot: snapshot)
            case .days: DaysListView(snapshot: snapshot)
            case .packing: PackingListView()
            case .todos: TodoListView()
            }
        }
    }

    /// Screenshot mode: opens the screen the launch arguments name.
    private func openDemoScreen() {
        guard let screen = DemoMode.screen, let snapshot = model.display else { return }
        let now = model.now()
        let today = snapshot.todayIndex(at: now) ?? 0
        switch screen {
        case .booking: page = .booking
        case .trip: page = .trip
        case .lists: page = .lists
        case .day: path = [.day(today)]
        case .days: path = [.days]
        case .place:
            let stops = snapshot.days.indices.contains(today) ? snapshot.days[today].stops : []
            let next = stops.firstIndex { ($0.minutes ?? 0) >= TrekDate.minutesOfDay(now) } ?? 0
            path = [.stop(day: today, stop: next)]
        case .bookings: path = [.bookings]
        case .bookingDetail:
            if let booking = snapshot.nextBooking(at: now) { path = [.booking(booking.id)] }
        case .packing: path = [.packing]
        case .todos: path = [.todos]
        default: break
        }
    }
}
