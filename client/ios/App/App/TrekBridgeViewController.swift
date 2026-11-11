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
        TrekServerStore.recheckAfterUpdate()
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
        guardBridgeMessages()
        watchSignInPages()
        bridge?.registerPluginInstance(TrekShellPlugin())
        // WebKit's own swipe back slides away a screenshot of the whole page,
        // closes no sheet and takes every drag near the edge from the UI. The UI
        // draws its own (mobile/components/MEdgeBack.tsx, feature "edgeBack"):
        // the page follows the finger and an open sheet closes first.
        webView?.allowsBackForwardNavigationGestures = false
        // A long press on a link would lift a preview of the page it points to,
        // which no native list does; the press means "drag" or nothing here.
        webView?.allowsLinkPreview = false
        paintBehindWebView()
    }

    // MARK: - What shows where the web view does not reach

    /// The UI reports its theme through StatusBar.setStyle (native/nativeApp.ts),
    /// which lands here; the colour behind the web view follows it.
    override func setNeedsStatusBarAppearanceUpdate() {
        super.setNeedsStatusBarAppearanceUpdate()
        paintBehindWebView()
    }

    /// Some iOS releases (27.0.x) lay the web view out below the status bar
    /// instead of under it, and the strip above the page then showed this
    /// view's black. It now carries the top colour of the screen background
    /// (mobile.css --m-scr), so the strip reads as part of the page on every
    /// release, and the rubber band at the ends shows the same colour.
    private func paintBehindWebView() {
        let dark: Bool
        switch preferredStatusBarStyle {
        case .lightContent: dark = true
        case .darkContent: dark = false
        default: dark = traitCollection.userInterfaceStyle == .dark
        }
        let color = dark
            ? UIColor(red: 0x17 / 255, green: 0x17 / 255, blue: 0x1C / 255, alpha: 1)
            : UIColor(red: 0xFB / 255, green: 0xFA / 255, blue: 0xF7 / 255, alpha: 1)
        view.backgroundColor = color
        webView?.scrollView.backgroundColor = color
        webView?.underPageBackgroundColor = color
    }

    // MARK: - A proxy's sign-in page

    /// Over a proxy's sign-in page (Pangolin, authentik, ...) the server's UI is
    /// not there, so nothing else leads back to the address screen, and a passkey
    /// cannot work in a web view for a domain the app is not tied to. A bar says
    /// so and offers to change the server; the keyboard gets room on that page,
    /// which TREK's own script makes everywhere else (native/keepFieldInView.ts).
    private var signInBar: UIView?
    private var urlObservation: NSKeyValueObservation?
    private var insetObservation: NSKeyValueObservation?
    private var onSignInPage = false
    /// Whether the main frame shows an error page in place of the server's (a 4xx
    /// nobody else handled: a proxy's block page, a client certificate it refused).
    private var onErrorPage = false
    private var signInHint: UILabel?
    private var keyboardUp = false
    /// How far the keyboard reaches into the view while it is up.
    private var keyboardRoom: CGFloat = 0
    /// Whether the bottom inset is this controller's, so leaving the page puts it back.
    private var ownsInset = false
    private var bodyReset: DispatchWorkItem?

    private func watchSignInPages() {
        urlObservation = webView?.observe(\.url, options: [.initial, .new]) { [weak self] webView, _ in
            let signIn = TrekServerStore.isSignInHost(webView.url)
            DispatchQueue.main.async { self?.signInPageChanged(signIn) }
        }
        // The keyboard plugin zeroes the scroll inset on every frame change it
        // makes, the last one a while after the keyboard is up. On a sign-in
        // page the inset wanted here is put back each time.
        insetObservation = webView?.scrollView.observe(\.contentInset, options: [.new]) { [weak self] _, _ in
            DispatchQueue.main.async { self?.applyInset() }
        }
        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        center.addObserver(self, selector: #selector(keyboardWillHide), name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    private func signInPageChanged(_ signIn: Bool) {
        onSignInPage = signIn
        if signIn && signInBar == nil { signInBar = makeSignInBar() }
        updateSignInBar()
    }

    private func errorPageChanged(_ error: Bool) {
        onErrorPage = error
        if error && signInBar == nil { signInBar = makeSignInBar() }
        updateSignInBar()
    }

    /// Out of the way while the keyboard is up: the form needs the room.
    private func updateSignInBar() {
        let labels = TrekServerStore.labels
        signInHint?.text = onSignInPage
            ? labels["signInHint"]
                ?? "Passkeys and security keys do not work on this page in the app. Sign in with a password, or let the app through your proxy."
            : labels["errorPageHint"] ?? "This page is not from TREK: the server or a proxy in front of it refused the app. Check your proxy or certificate, or change the server."
        signInBar?.isHidden = !((onSignInPage || onErrorPage) && !keyboardUp)
        applyInset()
    }

    /// On a sign-in page the page can scroll past what covers its end: the
    /// keyboard while it is up, the bar otherwise. TREK's own pages are left alone.
    private func applyInset() {
        guard let scrollView = webView?.scrollView else { return }
        let wanted: CGFloat
        if onSignInPage || onErrorPage {
            if keyboardUp {
                wanted = keyboardRoom
            } else if let bar = signInBar {
                view.layoutIfNeeded()
                wanted = max(0, view.bounds.height - bar.frame.minY)
            } else {
                wanted = 0
            }
            ownsInset = true
        } else if ownsInset {
            wanted = 0
            ownsInset = false
        } else {
            return
        }
        if scrollView.contentInset.bottom != wanted { scrollView.contentInset.bottom = wanted }
        if scrollView.verticalScrollIndicatorInsets.bottom != wanted { scrollView.verticalScrollIndicatorInsets.bottom = wanted }
    }

    /// The keyboard plugin also sizes the body to the area above the keyboard,
    /// after the keyboard's animation and a further 0.2 s. On a sign-in page the
    /// body gets its height back once that has run, so the button under the
    /// keyboard can be scrolled into view through the inset above.
    @objc private func keyboardWillShow(_ note: Notification) {
        keyboardUp = true
        if let frame = note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect {
            keyboardRoom = max(0, view.bounds.height - view.convert(frame, from: nil).minY)
        }
        bodyReset?.cancel()
        if onSignInPage {
            let duration = note.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double ?? 0.25
            let reset = DispatchWorkItem { [weak self] in
                guard let self, self.onSignInPage, self.keyboardUp, let webView = self.webView else { return }
                webView.evaluateJavaScript("document.body.style.height = ''", completionHandler: nil)
                self.applyInset()
            }
            bodyReset = reset
            DispatchQueue.main.asyncAfter(deadline: .now() + duration + 0.35, execute: reset)
        }
        updateSignInBar()
    }

    @objc private func keyboardWillHide() {
        keyboardUp = false
        bodyReset?.cancel()
        updateSignInBar()
    }

    private func makeSignInBar() -> UIView {
        let labels = TrekServerStore.labels
        let bar = UIView()
        bar.backgroundColor = UIColor(red: 17 / 255, green: 24 / 255, blue: 39 / 255, alpha: 0.95)
        bar.layer.cornerRadius = 16
        bar.layer.cornerCurve = .continuous
        bar.translatesAutoresizingMaskIntoConstraints = false

        let hint = UILabel()
        hint.text = labels["signInHint"]
            ?? "Passkeys and security keys do not work on this page in the app. Sign in with a password, or let the app through your proxy."
        hint.textColor = UIColor(white: 0.9, alpha: 1)
        hint.font = .preferredFont(forTextStyle: .footnote)
        hint.adjustsFontForContentSizeCategory = true
        hint.numberOfLines = 0
        signInHint = hint
        hint.translatesAutoresizingMaskIntoConstraints = false

        let change = UIButton(type: .system)
        change.setTitle(labels["changeServer"] ?? "Change server", for: .normal)
        change.setTitleColor(.white, for: .normal)
        change.titleLabel?.font = .systemFont(ofSize: 15, weight: .semibold)
        change.addTarget(self, action: #selector(changeServerFromSignIn), for: .touchUpInside)
        change.translatesAutoresizingMaskIntoConstraints = false
        change.setContentHuggingPriority(.required, for: .horizontal)
        change.setContentCompressionResistancePriority(.required, for: .horizontal)

        bar.addSubview(hint)
        bar.addSubview(change)
        view.addSubview(bar)
        NSLayoutConstraint.activate([
            bar.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 12),
            bar.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12),
            bar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
            hint.leadingAnchor.constraint(equalTo: bar.leadingAnchor, constant: 14),
            hint.topAnchor.constraint(equalTo: bar.topAnchor, constant: 10),
            hint.bottomAnchor.constraint(equalTo: bar.bottomAnchor, constant: -10),
            change.leadingAnchor.constraint(equalTo: hint.trailingAnchor, constant: 8),
            change.trailingAnchor.constraint(equalTo: bar.trailingAnchor, constant: -12),
            change.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
        ])
        return bar
    }

    /// What resetServer does from the UI: forget the server, back to the address screen.
    @objc private func changeServerFromSignIn() {
        TrekServerStore.url = nil
        view.window?.rootViewController = TrekBridgeViewController()
    }

    /// Kept alive here: the content controller holds it, but only for as long as it is registered.
    private var messageGuard: TrekBridgeMessageGuard?

    /// Capacitor answers bridge messages from any page in the web view. With a
    /// proxy's sign-in page loading there, its messages are dropped before they
    /// reach the plugins. Always in place: a sign-in host can also be learned
    /// while the app runs (TrekSignInRedirect).
    private func guardBridgeMessages() {
        guard let handler = (bridge as? CapacitorBridge)?.webViewDelegationHandler,
              let controller = webView?.configuration.userContentController else { return }
        let guarded = TrekBridgeMessageGuard(inner: handler)
        controller.removeScriptMessageHandler(forName: TrekBridgeMessageGuard.name)
        controller.add(guarded, name: TrekBridgeMessageGuard.name)
        messageGuard = guarded
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

    private static let previousKey = "TrekPreviousServerURL"

    private static let checkedKey = "TrekServerCheck"

    private static let labelsKey = "TrekShellLabels"

    /// The words of the bar over a proxy's sign-in page, in the user's language,
    /// as the address screen passed them (setServer's `labels`): the server's UI
    /// is not there to say them. Empty keeps the English fallback.
    static var labels: [String: String] {
        get { UserDefaults.standard.dictionary(forKey: labelsKey) as? [String: String] ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: labelsKey) }
    }

    /// The server API this build needs (MIN_NATIVE_API in serverAddress.ts).
    /// A server remembered under a lower value is checked once more: the first
    /// launch after an update that raised it puts the address screen back up,
    /// filled in with that server (previousURL). Raise both together.
    private static let serverCheck = 2

    /// Runs before the first bridge is built, so a server picked under an older
    /// minimum is not loaded unchecked.
    static func recheckAfterUpdate() {
        let defaults = UserDefaults.standard
        guard defaults.integer(forKey: checkedKey) < serverCheck else { return }
        defaults.set(serverCheck, forKey: checkedKey)
        guard let server = url else { return }
        url = nil
        defaults.set(server, forKey: previousKey)
    }

    /// The server an update asked to check again, until a server is set.
    static var previousURL: String? {
        UserDefaults.standard.string(forKey: previousKey)
    }

    private static let signInHostsKey = "TrekServerSignInHosts"

    /// Setting the server drops the sign-in hosts of the one before it.
    static var url: String? {
        get { UserDefaults.standard.string(forKey: key) }
        set {
            if let newValue {
                UserDefaults.standard.set(newValue, forKey: key)
                UserDefaults.standard.removeObject(forKey: previousKey)
            } else {
                UserDefaults.standard.removeObject(forKey: key)
            }
            UserDefaults.standard.removeObject(forKey: signInHostsKey)
            try? FileManager.default.removeItem(at: offlineCopyURL)
        }
    }

    /// The hosts of a sign-in page in front of the server (a proxy such as
    /// Cloudflare Access or Pangolin), as the address screen found them. Only
    /// these load in the web view besides the server, so the proxy's session
    /// cookie is the web view's (TrekNavigationProxy), and none of them may
    /// talk to the app (TrekBridgeMessageGuard).
    static var signInHosts: Set<String> {
        get { Set((UserDefaults.standard.stringArray(forKey: signInHostsKey) ?? []).map { $0.lowercased() }) }
        set {
            if newValue.isEmpty {
                UserDefaults.standard.removeObject(forKey: signInHostsKey)
            } else {
                UserDefaults.standard.set(Array(newValue).sorted(), forKey: signInHostsKey)
            }
        }
    }

    /// Keeps one more sign-in host for the remembered server, as the web view met it (TrekSignInRedirect).
    static func addSignInHost(_ host: String) {
        var hosts = signInHosts
        guard hosts.insert(host.lowercased()).inserted else { return }
        signInHosts = hosts
    }

    /// Whether `url` is one of the sign-in hosts, matched on host or host:port.
    static func isSignInHost(_ url: URL?) -> Bool {
        guard let url, ["https", "http"].contains(url.scheme?.lowercased() ?? ""), let host = url.host?.lowercased() else { return false }
        let hosts = signInHosts
        if hosts.contains(host) { return true }
        if let port = url.port { return hosts.contains("\(host):\(port)") }
        return false
    }

    /// The one-time code of a TREK Cloud purchase (setServer's `welcome`). The
    /// server's first page opens its welcome page with it once, which signs the
    /// buyer in (TrekNavigationProxy). Kept in memory only, never on disk.
    static var pendingWelcome: String?

    /// The welcome page for the pending code, handed out once.
    static func takeWelcomeURL() -> URL? {
        guard let code = pendingWelcome, let server = url else { return nil }
        pendingWelcome = nil
        let base = server.hasSuffix("/") ? server : server + "/"
        return URL(string: base + "api/managed/welcome#" + code)
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

/// A sign-in page in front of the server that the address screen never saw.
/// A proxy can let the app's check through (an Authelia or Authentik rule that
/// bypasses /api) and still send the page itself to its sign-in. Handed to
/// Safari, that sign-in leaves its session there and the app stays blank on
/// every launch. So a redirect away from the server, while the server's first
/// page is still loading, is taken as the proxy's sign-in: it loads in the web
/// view and its host is kept, the way the address screen keeps the ones it saw.
/// A link the user taps is no redirect, and once a page of the server has
/// shown, nothing is learned any more.
enum TrekSignInRedirect {
    /// The host (host:port with an explicit port) to keep as a sign-in host, or nil.
    static func learnedHost(server: String?, target: URL?, mainFrame: Bool, redirect: Bool, serverShown: Bool) -> String? {
        guard mainFrame, redirect, !serverShown,
              let server, let from = URL(string: server), let fromHost = from.host?.lowercased(),
              let target, let toHost = target.host?.lowercased(),
              let toScheme = target.scheme?.lowercased(), ["https", "http"].contains(toScheme) else { return nil }
        // Never from https down to plain http: the sign-in would send a password in the clear.
        if from.scheme?.lowercased() == "https", toScheme != "https" { return nil }
        guard toHost != fromHost else { return nil }
        if let port = target.port { return "\(toHost):\(port)" }
        return toHost
    }

    /// Whether `url` is on the server's host, where the app's own pages come from.
    static func onServer(server: String?, url: URL?) -> Bool {
        guard let server, let host = URL(string: server)?.host?.lowercased() else { return false }
        return url?.host?.lowercased() == host
    }
}

/// Stands in front of Capacitor's navigation delegate and hands it everything
/// but the failures of a navigation that another one replaced: a cancelled
/// load (NSURLErrorCancelled) or an interrupted frame load (WebKit 102). Those
/// are no fault, and Capacitor would answer them with its error page.
final class TrekNavigationProxy: NSObject, WKNavigationDelegate {
    private let inner: WKNavigationDelegate
    /// A page of the server has shown since launch; from then on no sign-in host is learned (TrekSignInRedirect).
    private var serverShown = false

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

    /// The sign-in page of a proxy in front of the server loads here instead of
    /// in Safari, so its session is the web view's and every request carries it.
    /// Only the hosts the address screen saw (TrekServerStore.signInHosts), and
    /// only in the main frame; everything else is Capacitor's decision as before.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.targetFrame?.isMainFrame == true, TrekServerStore.isSignInHost(navigationAction.request.url) {
            decisionHandler(.allow)
            return
        }
        // WebKit asks again for every server redirect, as a navigation of type .other.
        if let host = TrekSignInRedirect.learnedHost(
            server: TrekServerStore.url,
            target: navigationAction.request.url,
            mainFrame: navigationAction.targetFrame?.isMainFrame == true,
            redirect: navigationAction.navigationType == .other,
            serverShown: serverShown
        ) {
            TrekServerStore.addSignInHost(host)
            decisionHandler(.allow)
            return
        }
        let selector = NSSelectorFromString("webView:decidePolicyForNavigationAction:decisionHandler:")
        guard (inner as AnyObject).responds(to: selector) else {
            decisionHandler(.allow)
            return
        }
        inner.webView?(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
    }

    /// After the server's first page, a pending welcome code opens the welcome
    /// page once (TrekServerStore.takeWelcomeURL); it is on the server's origin.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        inner.webView?(webView, didFinish: navigation)
        if TrekSignInRedirect.onServer(server: TrekServerStore.url, url: webView.url) { serverShown = true }
        if let welcome = TrekServerStore.takeWelcomeURL() {
            webView.load(URLRequest(url: welcome))
        }
    }

    /// A proxy in front of the server asks for a client certificate (mutual TLS):
    /// the stored one goes to the host and port it was imported for and nowhere
    /// else (TrekClientIdentity). Every other challenge is Capacitor's as before.
    func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge,
                 completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        if TrekClientIdentity.answer(challenge, completionHandler) {
            let space = challenge.protectionSpace
            TrekClientCertWatch.serverAsked(host: space.host, port: space.port) { [weak self, weak webView] in
                guard let self, let webView else { return }
                // Capacitor's own answer to a failed load: the address screen (errorPath).
                self.inner.webView?(webView, didFailProvisionalNavigation: nil, withError: URLError(.clientCertificateRejected))
            }
            return
        }
        let selector = NSSelectorFromString("webView:didReceiveAuthenticationChallenge:completionHandler:")
        guard (inner as AnyObject).responds(to: selector) else {
            completionHandler(.performDefaultHandling, nil)
            return
        }
        inner.webView?(webView, didReceive: challenge, completionHandler: completionHandler)
    }

    /// A proxy that asked the page for a client certificate, got none and
    /// answered with its own refusal (Cloudflare's 403, nginx's 400) sends the
    /// app to the address screen, which says so and offers to add one, rather
    /// than leaving the proxy's error page up. Any other 4xx page is not TREK's,
    /// which serves its UI for every path (a proxy's block page, a certificate it
    /// refused): it stays up with the bar and its way out to another server.
    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if navigationResponse.isForMainFrame, let http = navigationResponse.response as? HTTPURLResponse,
           http.statusCode >= 400, http.statusCode < 500, let asked = TrekClientIdentity.lastRequest, !asked.served,
           let url = http.url, url.host?.lowercased() == asked.host, (url.port ?? 443) == asked.port {
            decisionHandler(.cancel)
            inner.webView?(webView, didFailProvisionalNavigation: nil, withError: URLError(.clientCertificateRequired))
            return
        }
        if navigationResponse.isForMainFrame, let http = navigationResponse.response as? HTTPURLResponse {
            let error = http.statusCode >= 400 && http.statusCode < 500
            DispatchQueue.main.async { [weak self] in self?.errorPageChanged(error) }
        }
        let selector = NSSelectorFromString("webView:decidePolicyForNavigationResponse:decisionHandler:")
        guard (inner as AnyObject).responds(to: selector) else {
            decisionHandler(.allow)
            return
        }
        inner.webView?(webView, decidePolicyFor: navigationResponse, decisionHandler: decisionHandler)
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

/// Stands in front of Capacitor's bridge message handler and drops what a
/// proxy's sign-in page posts: that page loads in the web view (see
/// TrekNavigationProxy), and Capacitor itself would hand its messages to the
/// plugins whatever page they come from.
final class TrekBridgeMessageGuard: NSObject, WKScriptMessageHandler {
    static let name = "bridge"
    private let inner: WKScriptMessageHandler

    init(inner: WKScriptMessageHandler) {
        self.inner = inner
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        var components = URLComponents()
        components.scheme = origin.protocol
        components.host = origin.host
        if origin.port != 0 { components.port = origin.port }
        if TrekServerStore.isSignInHost(components.url) { return }
        inner.userContentController(userContentController, didReceive: message)
    }
}
