import CryptoKit
import Foundation
import UIKit
import WatchConnectivity
import WebKit

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

    /// While the app is in front, its UI writes the tick, through its offline queue
    /// as a tap would. In the background the WebView is asleep, so the tick is
    /// written to the server from here at once (TrekWatchWriter), and the trip's
    /// other devices hear of it over their WebSocket; only a write that fails is
    /// queued for the UI, which then tries again once it runs.
    private func receive(_ action: [String: Any], then done: @escaping () -> Void) {
        DispatchQueue.main.async {
            guard UIApplication.shared.applicationState != .active else {
                self.enqueue(action)
                done()
                return
            }
            TrekWatchWriter.write(action) { written in
                if !written { self.enqueue(action) }
                done()
            }
        }
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
        if let action = userInfo["action"] as? [String: Any] { receive(action) {} }
    }

    /// The watch asks for the latest snapshot when it opens while the phone is in
    /// reach, and sends its ticks this way while it is (WatchLink.send).
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        if let action = message["action"] as? [String: Any] {
            receive(action) { replyHandler(["queued": true]) }
            return
        }
        queue.async {
            if message["request"] as? String == "snapshot", let data = UserDefaults.standard.data(forKey: self.snapshotKey) {
                replyHandler(["snapshot": data])
            } else {
                replyHandler([:])
            }
        }
    }
}

/// Writes a tick from the watch straight to the TREK server, for when the app is
/// in the background and its UI cannot. The same request the UI makes for a tap
/// (PUT /api/trips/:trip/packing|todo/:item with the box's new state), with the
/// session the WebView holds (its cookies) and the tick's id as the idempotency
/// key, so a tick that also reaches the server another way is taken once.
enum TrekWatchWriter {
    private final class BackgroundTask {
        var id = UIBackgroundTaskIdentifier.invalid

        func end() {
            guard id != .invalid else { return }
            UIApplication.shared.endBackgroundTask(id)
            id = .invalid
        }
    }

    /// Called on the main queue, as is `completion`.
    static func write(_ action: [String: Any], completion: @escaping (Bool) -> Void) {
        guard let request = request(for: action) else {
            completion(false)
            return
        }
        let task = BackgroundTask()
        task.id = UIApplication.shared.beginBackgroundTask(withName: "trek.watch.tick") { task.end() }
        let finish: (Bool) -> Void = { written in
            DispatchQueue.main.async {
                completion(written)
                task.end()
            }
        }
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
            guard let host = request.url?.host else { return finish(false) }
            let session = cookies.filter { cookie in
                let domain = cookie.domain.hasPrefix(".") ? String(cookie.domain.dropFirst()) : cookie.domain
                return host == domain || host.hasSuffix("." + domain)
            }
            guard !session.isEmpty else { return finish(false) }
            var signed = request
            for (field, value) in HTTPCookie.requestHeaderFields(with: session) {
                signed.setValue(value, forHTTPHeaderField: field)
            }
            URLSession.shared.dataTask(with: signed) { _, response, error in
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                finish(error == nil && (200..<300).contains(status))
            }.resume()
        }
    }

    /// The write for a tick as the watch sends it, or nil for anything else.
    static func request(for action: [String: Any]) -> URLRequest? {
        guard let server = TrekServerStore.url, let base = URL(string: server),
              base.scheme == "https" || base.scheme == "http",
              let id = action["id"] as? String, !id.isEmpty, id.count <= 64,
              let tripId = action["tripId"] as? Int, let itemId = action["itemId"] as? Int,
              let list = action["list"] as? String, list == "packing" || list == "todo",
              let done = action["done"] as? Bool,
              let body = try? JSONSerialization.data(withJSONObject: ["checked": done]) else { return nil }
        let url = base.appendingPathComponent("api").appendingPathComponent("trips")
            .appendingPathComponent(String(tripId)).appendingPathComponent(list).appendingPathComponent(String(itemId))
        var request = URLRequest(url: url, timeoutInterval: 10)
        request.httpMethod = "PUT"
        request.httpShouldHandleCookies = false
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("watch-\(id)", forHTTPHeaderField: "X-Idempotency-Key")
        request.httpBody = body
        return request
    }
}
