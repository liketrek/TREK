import UIKit
import Capacitor
import CryptoKit
import WebKit

/// Points the WebView at the TREK server the user picked instead of the bundled
/// address screen. The UI then comes from that server, in the version it runs,
/// on its own origin, so its session cookie and service calls work as they do
/// in Safari.
class TrekBridgeViewController: CAPBridgeViewController {
    override func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()
        if let server = TrekServerStore.url {
            // The trailing slash matters: Capacitor treats every URL that starts
            // with this string as the app's own, and without it that would take
            // in https://trek.example.com.attacker.test as well.
            descriptor.serverURL = server.hasSuffix("/") ? server : server + "/"
        }
        return descriptor
    }

    /// The map tile store answers trek-tile:// (TrekTileSchemeHandler below). A
    /// scheme handler can only be set on the configuration the WebView is built from.
    private let tileHandler = TrekTileSchemeHandler()

    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        configuration.setURLSchemeHandler(tileHandler, forURLScheme: TrekTileSchemeHandler.scheme)
        return configuration
    }

    /// Kept alive here: WKWebView holds its navigation delegate weakly.
    private var navigationProxy: TrekNavigationProxy?

    override func capacitorDidLoad() {
        TrekTileStore.shared.prune()
        // Capacitor shows its error page for every failed navigation, a replaced
        // one included: the UI moving to /login while the first page still loads
        // cancels that load (-999), and a first-time user landed on "Server not
        // reachable" with a server that was there all along.
        if let webView, let inner = webView.navigationDelegate {
            let proxy = TrekNavigationProxy(inner: inner)
            navigationProxy = proxy
            webView.navigationDelegate = proxy
        }
        bridge?.registerPluginInstance(TrekShellPlugin())
        // WebKit's own swipe back slides away a screenshot of the whole page,
        // closes no sheet and takes every drag near the edge from the UI. The UI
        // draws its own (mobile/components/MEdgeBack.tsx, feature "edgeBack"):
        // the page follows the finger and an open sheet closes first.
        webView?.allowsBackForwardNavigationGestures = false
    }

    /// A key command of the UI's (TrekKeyCommands) was pressed. The commands sit
    /// in the main menu, which sends their action up the responder chain from
    /// the web view, and this controller is the first stop that answers it.
    @objc func trekKeyCommand(_ sender: UIKeyCommand) {
        guard let id = sender.propertyList as? String else { return }
        TrekKeyCommands.onPress?(id)
    }
}

// MARK: - Hardware keyboard (TrekShell.setKeyCommands)

/// The UI's keyboard shortcuts as key commands in the app's main menu. There
/// they show in the overlay a held Command key brings up and, on iPadOS 26, in
/// the menu bar, under the names the UI gives them in its language. Each screen
/// replaces the list (mobile/keyboard/MKeyboardHost.tsx), and the menu is
/// rebuilt with it, so only what works here and now is ever offered.
enum TrekKeyCommands {
    struct Command {
        let id: String
        let title: String
        let input: String
        let modifiers: UIKeyModifierFlags

        init?(raw: JSObject) {
            guard let id = raw["id"] as? String, let title = raw["title"] as? String,
                  let input = raw["input"] as? String, !input.isEmpty else { return nil }
            var flags: UIKeyModifierFlags = []
            for name in raw["modifiers"] as? [String] ?? [] {
                switch name {
                case "command": flags.insert(.command)
                case "shift": flags.insert(.shift)
                case "option": flags.insert(.alternate)
                case "control": flags.insert(.control)
                default: break
                }
            }
            self.id = id
            self.title = title
            self.input = Command.key(input)
            self.modifiers = flags
        }

        private static func key(_ name: String) -> String {
            switch name {
            case "left": return UIKeyCommand.inputLeftArrow
            case "right": return UIKeyCommand.inputRightArrow
            case "up": return UIKeyCommand.inputUpArrow
            case "down": return UIKeyCommand.inputDownArrow
            case "escape": return UIKeyCommand.inputEscape
            default: return name
            }
        }
    }

    static let menuIdentifier = UIMenu.Identifier("com.liketrek.trek.shortcuts")
    private(set) static var current: [Command] = []
    static var onPress: ((String) -> Void)?

    static func set(_ commands: [Command]) {
        current = commands
        UIMenuSystem.main.setNeedsRebuild()
    }

    /// The commands as one menu, without a title of its own: it joins the app's
    /// menu, where iPadOS lists the shortcuts under the app's name.
    static func menu() -> UIMenu {
        let children = current.map { command -> UIKeyCommand in
            let key = UIKeyCommand(
                title: command.title,
                action: #selector(TrekBridgeViewController.trekKeyCommand(_:)),
                input: command.input,
                modifierFlags: command.modifiers,
                propertyList: command.id
            )
            // ⌘[ and ⌘, belong to the app here, not to the web view's editing.
            key.wantsPriorityOverSystemBehavior = true
            return key
        }
        return UIMenu(title: "", identifier: menuIdentifier, options: .displayInline, children: children)
    }
}

/// The remembered server and the offline copy of its start page.
enum TrekServerStore {
    private static let key = "TrekServerURL"

    static var url: String? {
        get { UserDefaults.standard.string(forKey: key) }
        set {
            if let newValue { UserDefaults.standard.set(newValue, forKey: key) } else { UserDefaults.standard.removeObject(forKey: key) }
            try? FileManager.default.removeItem(at: offlineCopyURL)
        }
    }

    static var offlineCopyURL: URL {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return support.appendingPathComponent("offline-start-page.html")
    }
}

// MARK: - Tile store (trek-tile://)

/// Map tiles the user looked at, on disk, for the WebView's maps
/// (client/src/native/tileCache.ts). WKWebView runs no service worker for a
/// self-hosted server, so without this nothing kept a tile once the app closed.
///
/// Each tile lives as `<sha256>.bin` with its content type in `<sha256>.type`.
/// A tile older than 30 days is never served again (Mapbox's limit for a device
/// cache, applied to every provider) and is fetched anew. The store keeps under
/// 250 MB: past that, the tiles used least recently go first. It sits in Caches,
/// which iOS may empty under storage pressure and never backs up.
final class TrekTileStore {
    static let shared = TrekTileStore()
    static let maxAge: TimeInterval = 30 * 24 * 60 * 60
    static let maxBytes: Int64 = 250 * 1024 * 1024
    /// Pruning brings the store down to this share of the limit, so it does not
    /// run again on the very next tile.
    static let pruneTarget = 0.8

    let directory: URL
    let queue = DispatchQueue(label: "com.liketrek.trek.tiles", qos: .utility)
    private var writesSincePrune = 0

    private init() {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        directory = caches.appendingPathComponent("trek-tiles", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    /// The tile's identity without what changes per user or session: tokens and
    /// keys come out, the rest of the query is sorted.
    static func key(for url: URL) -> String {
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let dropped: Set<String> = ["access_token", "sku", "key", "api_key", "apikey"]
        let kept = components?.queryItems?
            .filter { !dropped.contains($0.name.lowercased()) }
            .sorted { $0.name < $1.name }
        components?.queryItems = (kept?.isEmpty ?? true) ? nil : kept
        let identity = components?.string ?? url.absoluteString
        return SHA256.hash(data: Data(identity.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    private func dataURL(_ key: String) -> URL { directory.appendingPathComponent(key + ".bin") }
    private func typeURL(_ key: String) -> URL { directory.appendingPathComponent(key + ".type") }

    /// A stored tile younger than 30 days, marked as just used. Call on `queue`.
    func read(_ key: String) -> (data: Data, type: String)? {
        let file = dataURL(key)
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: file.path),
              let created = attributes[.creationDate] as? Date else { return nil }
        if Date().timeIntervalSince(created) > TrekTileStore.maxAge {
            remove(key)
            return nil
        }
        guard let data = try? Data(contentsOf: file) else { return nil }
        let type = (try? String(contentsOf: typeURL(key), encoding: .utf8)) ?? "application/octet-stream"
        try? FileManager.default.setAttributes([.modificationDate: Date()], ofItemAtPath: file.path)
        return (data, type)
    }

    func write(_ key: String, data: Data, type: String) {
        queue.async {
            try? data.write(to: self.dataURL(key), options: .atomic)
            try? type.write(to: self.typeURL(key), atomically: true, encoding: .utf8)
            self.writesSincePrune += 1
            if self.writesSincePrune >= 200 { self.pruneNow() }
        }
    }

    private func remove(_ key: String) {
        try? FileManager.default.removeItem(at: dataURL(key))
        try? FileManager.default.removeItem(at: typeURL(key))
    }

    private struct Entry {
        let key: String
        let size: Int64
        let used: Date
        let created: Date
    }

    private func entries() -> [Entry] {
        let keys: [URLResourceKey] = [.fileSizeKey, .contentModificationDateKey, .creationDateKey]
        let files = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: keys)) ?? []
        return files.filter { $0.pathExtension == "bin" }.compactMap { file in
            guard let values = try? file.resourceValues(forKeys: Set(keys)) else { return nil }
            return Entry(
                key: file.deletingPathExtension().lastPathComponent,
                size: Int64(values.fileSize ?? 0),
                used: values.contentModificationDate ?? .distantPast,
                created: values.creationDate ?? .distantPast
            )
        }
    }

    /// Drops what is past 30 days, then the least recently used tiles while the
    /// store is over its limit.
    func prune() { queue.async { self.pruneNow() } }

    private func pruneNow() {
        writesSincePrune = 0
        let now = Date()
        var live: [Entry] = []
        for entry in entries() {
            if now.timeIntervalSince(entry.created) > TrekTileStore.maxAge { remove(entry.key) } else { live.append(entry) }
        }
        var total = live.reduce(Int64(0)) { $0 + $1.size }
        guard total > TrekTileStore.maxBytes else { return }
        let target = Int64(Double(TrekTileStore.maxBytes) * TrekTileStore.pruneTarget)
        for entry in live.sorted(by: { $0.used < $1.used }) {
            if total <= target { break }
            remove(entry.key)
            total -= entry.size
        }
    }

    func usage(_ done: @escaping (Int64) -> Void) {
        queue.async { done(self.entries().reduce(Int64(0)) { $0 + $1.size }) }
    }

    func clear(_ done: @escaping () -> Void) {
        queue.async {
            try? FileManager.default.removeItem(at: self.directory)
            try? FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
            done()
        }
    }
}

/// Serves trek-tile://host/path from the store, or from https://host/path when
/// it has no fresh copy, storing what comes back. Offline and not stored, the
/// map gets an error and draws nothing there, as it would for a missing tile.
final class TrekTileSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "trek-tile"

    /// Tasks WebKit still wants an answer for. Touched on the main thread only:
    /// start and stop arrive there, and every answer is posted back there.
    private var active = Set<ObjectIdentifier>()

    private let session: URLSession = {
        let configuration = URLSessionConfiguration.default
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.timeoutIntervalForRequest = 20
        configuration.httpMaximumConnectionsPerHost = 4
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
        // A unique app User-Agent, as OpenFreeMap and OpenStreetMap ask of apps.
        configuration.httpAdditionalHeaders = ["User-Agent": "TREK-App/\(version) (iOS; +https://liketrek.com)"]
        return URLSession(configuration: configuration)
    }()

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let id = ObjectIdentifier(urlSchemeTask)
        guard let url = urlSchemeTask.request.url,
              var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        components.scheme = "https"
        guard let remote = components.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        active.insert(id)
        let key = TrekTileStore.key(for: remote)
        let store = TrekTileStore.shared
        let accept = urlSchemeTask.request.value(forHTTPHeaderField: "Accept")
        store.queue.async {
            if let hit = store.read(key) {
                DispatchQueue.main.async {
                    self.respond(urlSchemeTask, id: id, url: url, status: 200, type: hit.type, data: hit.data)
                }
                return
            }
            var request = URLRequest(url: remote)
            if let accept { request.setValue(accept, forHTTPHeaderField: "Accept") }
            self.session.dataTask(with: request) { data, response, _ in
                guard let data, let http = response as? HTTPURLResponse else {
                    DispatchQueue.main.async {
                        self.respond(urlSchemeTask, id: id, url: url, status: 504, type: "text/plain", data: Data())
                    }
                    return
                }
                let type = http.value(forHTTPHeaderField: "Content-Type") ?? "application/octet-stream"
                if http.statusCode == 200, !data.isEmpty { store.write(key, data: data, type: type) }
                DispatchQueue.main.async {
                    self.respond(urlSchemeTask, id: id, url: url, status: http.statusCode, type: type, data: data)
                }
            }.resume()
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        active.remove(ObjectIdentifier(urlSchemeTask))
    }

    /// Answers once, and never after WebKit stopped the task: that would throw.
    private func respond(_ task: WKURLSchemeTask, id: ObjectIdentifier, url: URL, status: Int, type: String, data: Data) {
        guard active.remove(id) != nil else { return }
        let headers = [
            "Content-Type": type,
            "Content-Length": String(data.count),
            // The page's origin is the user's server; WebGL reads tiles cross-origin.
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
        ]
        guard let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers) else {
            task.didFailWithError(URLError(.badServerResponse))
            return
        }
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }
}

/// Stands in front of Capacitor's navigation delegate and hands it everything
/// but the failures of a navigation that another one replaced: a cancelled
/// load (NSURLErrorCancelled) or an interrupted frame load (WebKit 102). Those
/// are no fault, and Capacitor would answer them with its error page.
final class TrekNavigationProxy: NSObject, WKNavigationDelegate {
    private let inner: WKNavigationDelegate

    init(inner: WKNavigationDelegate) {
        self.inner = inner
    }

    static func isReplaced(_ error: Error) -> Bool {
        let error = error as NSError
        return (error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled)
            || (error.domain == "WebKitErrorDomain" && error.code == 102)
    }

    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || (inner as AnyObject).responds(to: aSelector)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        (inner as AnyObject).responds(to: aSelector) ? inner : nil
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if Self.isReplaced(error) { return }
        inner.webView?(webView, didFail: navigation, withError: error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if Self.isReplaced(error) { return }
        inner.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
    }
}
