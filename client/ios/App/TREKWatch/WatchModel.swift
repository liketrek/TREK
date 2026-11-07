import Foundation
import Observation
import WatchConnectivity
import WidgetKit

/// The watch's state: the last snapshot from the phone with the ticks it has
/// not confirmed yet laid over it. Everything the screens show comes from here.
@MainActor
@Observable
final class WatchModel {
    static let shared = WatchModel()

    private(set) var snapshot: WatchSnapshot?
    private(set) var pending: [PendingAction] = []
    /// Set in screenshot mode (DemoMode.swift): the clock the screens read, and nothing is sent or stored.
    private(set) var fixedNow: Date?
    private(set) var isDemo = false

    /// The snapshot as the screens show it.
    var display: WatchSnapshot? { snapshot?.applying(pending) }

    private init() {
        snapshot = WatchStore.loadSnapshot()
        pending = WatchStore.loadPending()
    }

    func now(_ date: Date = Date()) -> Date { fixedNow ?? date }

    func startDemo(_ snapshot: WatchSnapshot?, now: Date) {
        isDemo = true
        fixedNow = now
        self.snapshot = snapshot
        pending = []
    }

    /// A snapshot from the phone: kept, the confirmed ticks dropped, the complications redrawn.
    func receive(_ data: Data) {
        guard !isDemo, let incoming = WatchSnapshot.decode(data) else { return }
        if let current = snapshot, let a = current.generated, let b = incoming.generated, b < a { return }
        snapshot = incoming
        WatchStore.saveSnapshot(data)
        pending = incoming.stillPending(pending)
        WatchStore.savePending(pending)
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Ticks a packing item or to-do: shown at once, sent to the phone, which
    /// writes it through the app's own offline-first path.
    func toggle(_ list: PendingAction.List, item: WatchSnapshot.Item) {
        guard let tripId = display?.trip?.id else { return }
        let action = PendingAction(id: UUID().uuidString, tripId: tripId, list: list, itemId: item.id, done: !item.done, at: Date())
        pending.removeAll { $0.list == list && $0.itemId == item.id }
        pending.append(action)
        guard !isDemo else { return }
        WatchStore.savePending(pending)
        WatchLink.shared.send(action)
        WidgetCenter.shared.reloadAllTimelines()
    }

    var isWaitingForPhone: Bool { !pending.isEmpty }
}

/// The watch's end of WatchConnectivity: snapshots arrive as the application
/// context (the latest one, kept by the system across launches) and as
/// complication user info (sent when the phone has budget for it), ticks
/// leave as user info, which the system queues until the phone takes them.
final class WatchLink: NSObject, WCSessionDelegate {
    static let shared = WatchLink()

    func activate() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func send(_ action: PendingAction) {
        guard WCSession.default.activationState == .activated else { return }
        WCSession.default.transferUserInfo(["action": action.message])
    }

    /// Asks the phone for a fresh snapshot while it is in reach (the app answers from what it stored).
    func requestRefresh() {
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else { return }
        WCSession.default.sendMessage(["request": "snapshot"], replyHandler: { reply in
            if let data = reply["snapshot"] as? Data { Task { @MainActor in WatchModel.shared.receive(data) } }
        }, errorHandler: nil)
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        guard activationState == .activated else { return }
        if let data = session.receivedApplicationContext["snapshot"] as? Data {
            Task { @MainActor in WatchModel.shared.receive(data) }
        }
        // Ticks queued before an earlier launch ended are still in the system's queue;
        // anything only in our own store (sent while not activated) goes again.
        let queued = Set(session.outstandingUserInfoTransfers.compactMap { ($0.userInfo["action"] as? [String: Any])?["id"] as? String })
        Task { @MainActor in
            for action in WatchModel.shared.pending where !queued.contains(action.id) {
                session.transferUserInfo(["action": action.message])
            }
        }
        requestRefresh()
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        guard let data = applicationContext["snapshot"] as? Data else { return }
        Task { @MainActor in WatchModel.shared.receive(data) }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        guard let data = userInfo["snapshot"] as? Data else { return }
        Task { @MainActor in WatchModel.shared.receive(data) }
    }
}
