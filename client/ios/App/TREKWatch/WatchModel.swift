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

    /// WatchConnectivity handed a tick to the phone: it is not sent again.
    func markSent(_ id: String) {
        guard let index = pending.firstIndex(where: { $0.id == id }) else { return }
        pending[index].sent = true
        WatchStore.savePending(pending)
    }

    /// Ticks that never reached the phone's queue: not yet handed over, or failed.
    func unsent(excluding queued: Set<String>) -> [PendingAction] {
        pending.filter { $0.sent != true && !queued.contains($0.id) }
    }
}

/// The watch's end of WatchConnectivity: snapshots arrive as the application
/// context (the latest one, kept by the system across launches) and as
/// complication user info (sent when the phone has budget for it), ticks
/// leave as user info, which the system queues until the phone takes them.
final class WatchLink: NSObject, WCSessionDelegate {
    static let shared = WatchLink()

    func activate() {
        guard WCSession.isSupported() else { return }
        if WCSession.default.delegate == nil { WCSession.default.delegate = self }
        if WCSession.default.activationState != .activated { WCSession.default.activate() }
    }

    /// For the system's WatchConnectivity background task: activates the session
    /// and returns only once what the phone sent has been delivered (and the
    /// snapshot stored and the complications told), or after twenty seconds.
    func finishPendingDeliveries() async {
        activate()
        for _ in 0..<100 {
            let session = WCSession.default
            if session.activationState == .activated && !session.hasContentPending { break }
            try? await Task.sleep(nanoseconds: 200_000_000)
        }
        // Let the deliveries already queued on the main actor run before the task ends.
        await MainActor.run {}
        try? await Task.sleep(nanoseconds: 300_000_000)
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
        // Only ticks that never reached the phone's queue go again: those still in the
        // system's queue are on their way, and those handed over are the phone's now.
        let queued = Set(session.outstandingUserInfoTransfers.compactMap { ($0.userInfo["action"] as? [String: Any])?["id"] as? String })
        Task { @MainActor in
            for action in WatchModel.shared.unsent(excluding: queued) {
                session.transferUserInfo(["action": action.message])
            }
        }
        requestRefresh()
    }

    /// A tick reached the phone's queue (or failed, and is sent again on the next activation).
    func session(_ session: WCSession, didFinish userInfoTransfer: WCSessionUserInfoTransfer, error: Error?) {
        guard error == nil, let id = (userInfoTransfer.userInfo["action"] as? [String: Any])?["id"] as? String else { return }
        Task { @MainActor in WatchModel.shared.markSent(id) }
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
