import CryptoKit
import Foundation
import UIKit
import WatchConnectivity

/// The phone's end of WatchConnectivity (feature "watch"). The UI hands over the
/// watch's snapshot (client/src/native/watch.ts through TrekShell.setWatchSnapshot);
/// this keeps the latest one, sends it as the application context, and as
/// complication user info while the day's budget for those lasts and something
/// a complication shows has changed. Ticks from the watch arrive as user info,
/// are queued here until the UI takes them (TrekShell.takeWatchActions) and
/// writes them through its offline-first path, and announced to it at once.
final class TrekWatchLink: NSObject, WCSessionDelegate {
    static let shared = TrekWatchLink()

    /// Told when a tick arrived, on the main queue.
    var onAction: (() -> Void)?

    private let queue = DispatchQueue(label: "com.liketrek.trek.watch")
    private let snapshotKey = "trek.watch.snapshot"
    private let complicationKey = "trek.watch.complicationDigest"
    private let actionsKey = "trek.watch.actions"
    /// The most WatchConnectivity carries in one application context, with room to spare.
    private let maxBytes = 60_000

    /// False on an iPad (and anything else without a paired watch): then this is
    /// a no-op throughout, and the UI is not offered the feature at all.
    static var isAvailable: Bool { WCSession.isSupported() }

    func activate() {
        guard Self.isAvailable else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    // MARK: Snapshots to the watch

    func publish(_ json: Data) {
        guard Self.isAvailable else { return }
        let data = withSmallCover(json)
        queue.async {
            UserDefaults.standard.set(data, forKey: self.snapshotKey)
            self.send(data)
        }
    }

    private func send(_ data: Data) {
        guard Self.isAvailable else { return }
        let session = WCSession.default
        guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
        try? session.updateApplicationContext(["snapshot": data])
        let digest = complicationDigest(data)
        if session.isComplicationEnabled, session.remainingComplicationUserInfoTransfers > 0,
           digest != UserDefaults.standard.string(forKey: complicationKey) {
            session.transferCurrentComplicationUserInfo(["snapshot": data])
            UserDefaults.standard.set(digest, forKey: complicationKey)
        }
    }

    /// What the complications show of a snapshot: everything but when it was built and the applied ticks.
    private func complicationDigest(_ data: Data) -> String {
        guard var object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return "" }
        object.removeValue(forKey: "generatedAt")
        object.removeValue(forKey: "applied")
        object.removeValue(forKey: "packing")
        object.removeValue(forKey: "todos")
        let canonical = (try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])) ?? Data()
        return SHA256.hash(data: canonical).map { String(format: "%02x", $0) }.joined()
    }

    /// The trip's cover scaled down to a thumbnail the watch can draw, or dropped when it would not fit.
    private func withSmallCover(_ json: Data) -> Data {
        guard var object = (try? JSONSerialization.jsonObject(with: json)) as? [String: Any],
              var trip = object["trip"] as? [String: Any], let cover = trip["cover"] as? String else { return json }
        trip.removeValue(forKey: "cover")
        if let data = Data(base64Encoded: cover), let image = UIImage(data: data) {
            let width: CGFloat = 220
            let size = CGSize(width: width, height: (width * image.size.height / max(image.size.width, 1)).rounded())
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1
            let small = UIGraphicsImageRenderer(size: size, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
            if let jpeg = small.jpegData(compressionQuality: 0.6), jpeg.count < 24_000 {
                trip["cover"] = jpeg.base64EncodedString()
            }
        }
        object["trip"] = trip
        guard let result = try? JSONSerialization.data(withJSONObject: object) else { return json }
        if result.count > maxBytes, trip["cover"] != nil {
            trip.removeValue(forKey: "cover")
            object["trip"] = trip
            return (try? JSONSerialization.data(withJSONObject: object)) ?? json
        }
        return result
    }

    // MARK: Ticks from the watch

    /// The ticks queued so far, oldest first, and the queue emptied.
    func takeActions() -> [[String: Any]] {
        queue.sync {
            let actions = storedActions()
            UserDefaults.standard.removeObject(forKey: actionsKey)
            return actions
        }
    }

    private func storedActions() -> [[String: Any]] {
        guard let data = UserDefaults.standard.data(forKey: actionsKey),
              let list = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] else { return [] }
        return list
    }

    private func enqueue(_ action: [String: Any]) {
        queue.async {
            // A tick sent twice (the watch resends after a restart) replaces the earlier copy.
            var actions = self.storedActions().filter { ($0["id"] as? String) != (action["id"] as? String) }
            actions.append(action)
            if let data = try? JSONSerialization.data(withJSONObject: Array(actions.suffix(200))) {
                UserDefaults.standard.set(data, forKey: self.actionsKey)
            }
            DispatchQueue.main.async { self.onAction?() }
        }
    }

    // MARK: WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        guard activationState == .activated else { return }
        queue.async {
            if let data = UserDefaults.standard.data(forKey: self.snapshotKey) { self.send(data) }
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    /// After switching watches the session has to be activated again for the new one.
    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }

    func sessionWatchStateDidChange(_ session: WCSession) {
        queue.async {
            if let data = UserDefaults.standard.data(forKey: self.snapshotKey) { self.send(data) }
        }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        if let action = userInfo["action"] as? [String: Any] { enqueue(action) }
    }

    /// The watch asks for the latest snapshot when it opens while the phone is in reach.
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        queue.async {
            if message["request"] as? String == "snapshot", let data = UserDefaults.standard.data(forKey: self.snapshotKey) {
                replyHandler(["snapshot": data])
            } else {
                replyHandler([:])
            }
        }
    }
}
