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

    /// The snapshot the watch has now, as last published.
    func storedSnapshot() -> Data? {
        queue.sync { UserDefaults.standard.data(forKey: snapshotKey) }
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
        guard let request = Self.request(for: action) else {
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
        perform(request) { _, ok in finish(ok) }
    }

    /// Sends a request with the WebView's session (its cookies for the server).
    /// Called on the main queue; `completion` runs on a background queue.
    static func perform(_ request: URLRequest, completion: @escaping (Data?, Bool) -> Void) {
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
            guard let host = request.url?.host else { return completion(nil, false) }
            let session = cookies.filter { cookie in
                let domain = cookie.domain.hasPrefix(".") ? String(cookie.domain.dropFirst()) : cookie.domain
                return host == domain || host.hasSuffix("." + domain)
            }
            guard !session.isEmpty else { return completion(nil, false) }
            var signed = request
            for (field, value) in HTTPCookie.requestHeaderFields(with: session) {
                signed.setValue(value, forHTTPHeaderField: field)
            }
            URLSession.shared.dataTask(with: signed) { data, response, error in
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                completion(data, error == nil && (200..<300).contains(status))
            }.resume()
        }
    }

    /// The server's address for an API path, or nil without a server.
    static func url(_ path: [String]) -> URL? {
        guard let server = TrekServerStore.url, let base = URL(string: server),
              base.scheme == "https" || base.scheme == "http" else { return nil }
        return path.reduce(base.appendingPathComponent("api")) { $0.appendingPathComponent($1) }
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

/// Brings the watch's packing list and to-dos up to date while the app is in the
/// background, woken by the server's silent push (WatchSyncPushService in TREK):
/// reads both lists of the trip the watch shows from the server and puts them
/// into the snapshot the watch has, built the way the UI builds them
/// (watchPacking and watchTodos in client/src/native/watch.ts). Everything else
/// in the snapshot stays as the UI last made it. In front, the UI does this
/// itself as soon as the lists change, so nothing is done here then.
enum TrekWatchRefresher {
    private static let maxName = 80
    private static let maxGroup = 40
    /// Below what WatchConnectivity carries in one application context.
    private static let maxBytes = 55_000

    static func refresh(completion: @escaping (UIBackgroundFetchResult) -> Void) {
        guard TrekWatchLink.isAvailable, UIApplication.shared.applicationState != .active,
              let stored = TrekWatchLink.shared.storedSnapshot(),
              var snapshot = (try? JSONSerialization.jsonObject(with: stored)) as? [String: Any],
              let trip = snapshot["trip"] as? [String: Any], let tripId = trip["id"] as? Int,
              let packingURL = TrekWatchWriter.url(["trips", String(tripId), "packing"]),
              let todoURL = TrekWatchWriter.url(["trips", String(tripId), "todo"]) else {
            return completion(.noData)
        }
        let group = DispatchGroup()
        var packing: [[String: Any]]?
        var todos: [[String: Any]]?
        group.enter()
        items(at: packingURL) { list in
            packing = list
            group.leave()
        }
        group.enter()
        items(at: todoURL) { list in
            todos = list
            group.leave()
        }
        group.notify(queue: .main) {
            guard let packing, let todos else { return completion(.failed) }
            snapshot["packing"] = packingList(packing)
            snapshot["todos"] = todoList(todos)
            snapshot["generatedAt"] = ISO8601DateFormatter().string(from: Date())
            guard let data = fitted(snapshot) else { return completion(.failed) }
            TrekWatchLink.shared.publish(data)
            completion(.newData)
        }
    }

    /// The `items` of a list endpoint, on the main queue; nil when it could not be read.
    private static func items(at url: URL, then completion: @escaping ([[String: Any]]?) -> Void) {
        var request = URLRequest(url: url, timeoutInterval: 10)
        request.httpShouldHandleCookies = false
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        TrekWatchWriter.perform(request) { data, ok in
            var list: [[String: Any]]?
            if ok, let data, let body = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
                list = body["items"] as? [[String: Any]]
            }
            DispatchQueue.main.async { completion(list) }
        }
    }

    private static func done(_ item: [String: Any]) -> Bool {
        (item["checked"] as? Bool) ?? ((item["checked"] as? Int).map { $0 != 0 } ?? false)
    }

    private static func trimmed(_ value: Any?, _ max: Int) -> String? {
        guard let text = (value as? String)?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty else { return nil }
        return String(text.prefix(max))
    }

    private static func entry(_ item: [String: Any]) -> [String: Any]? {
        guard let id = item["id"] as? Int, let name = item["name"] as? String else { return nil }
        var out: [String: Any] = ["id": id, "name": String(name.prefix(maxName)), "done": done(item)]
        if let group = trimmed(item["category"], maxGroup) { out["group"] = group }
        return out
    }

    /// Unpacked first, then packed, each in the list's own order.
    static func packingList(_ items: [[String: Any]]) -> Any {
        guard !items.isEmpty else { return NSNull() }
        let sorted = items.sorted {
            let (a, b) = (done($0) ? 1 : 0, done($1) ? 1 : 0)
            return a != b ? a < b : (($0["sort_order"] as? Int) ?? 0) < (($1["sort_order"] as? Int) ?? 0)
        }
        let packed = items.filter { done($0) }.count
        return ["items": sorted.compactMap(entry), "packed": packed, "total": items.count]
    }

    /// Open ones first by due date (undated last) and priority, then the done ones.
    static func todoList(_ items: [[String: Any]]) -> Any {
        guard !items.isEmpty else { return NSNull() }
        let due = { (item: [String: Any]) -> String? in trimmed(item["due_date"], 10) }
        let sorted = items.sorted { a, b in
            if done(a) != done(b) { return !done(a) }
            if (due(a) == nil) != (due(b) == nil) { return due(a) != nil }
            if let da = due(a), let db = due(b), da != db { return da < db }
            let (pa, pb) = ((a["priority"] as? Int) ?? 0, (b["priority"] as? Int) ?? 0)
            if pa != pb { return pa > pb }
            return ((a["sort_order"] as? Int) ?? 0) < ((b["sort_order"] as? Int) ?? 0)
        }
        let rows = sorted.compactMap { item -> [String: Any]? in
            guard var row = entry(item) else { return nil }
            if let date = due(item) { row["due"] = date }
            if let priority = item["priority"] as? Int, priority > 0 { row["priority"] = min(3, priority) }
            return row
        }
        return ["items": rows, "open": items.filter { !done($0) }.count, "total": items.count]
    }

    /// The snapshot as JSON within the size the watch takes: done items go first, as on the UI's side.
    private static func fitted(_ snapshot: [String: Any]) -> Data? {
        var object = snapshot
        // A list that is now empty leaves the snapshot, as the UI leaves it out.
        for key in ["packing", "todos"] where object[key] is NSNull { object.removeValue(forKey: key) }
        guard var data = try? JSONSerialization.data(withJSONObject: object) else { return nil }
        if data.count > maxBytes {
            for key in ["packing", "todos"] {
                guard var list = object[key] as? [String: Any], let items = list["items"] as? [[String: Any]] else { continue }
                list["items"] = items.filter { ($0["done"] as? Bool) != true }
                object[key] = list
            }
            data = (try? JSONSerialization.data(withJSONObject: object)) ?? data
        }
        return data
    }
}
