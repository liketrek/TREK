import AuthenticationServices
import Capacitor
import CoreLocation
import CryptoKit
import Security
import StoreKit
import UserNotifications
import WidgetKit
#if canImport(ActivityKit)
import ActivityKit
#endif
import LocalAuthentication
import PassKit
import QuickLook
import UIKit
import WebKit

/// The native half of client/src/native/trekShell.ts.
@objc(TrekShellPlugin)
public class TrekShellPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "TrekShellPlugin"
    public let jsName = "TrekShell"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getServer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setServer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resetServer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshOfflineCopy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openOfflineCopy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCapabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTileCacheUsage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearTileCache", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "biometryInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticateBiometric", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPrivacyCover", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeSharedFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "registerPush", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeOpenedPush", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setWidgetSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncTripDay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endTripDay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "storeProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "storePurchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "storeFinish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "storeRestore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addToWallet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setWatchSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeWatchActions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setKeyCommands", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setQuickActions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeQuickAction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestServer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clientCertificate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "importClientCertificate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeClientCertificate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "previewFile", returnType: CAPPluginReturnPromise),
    ]

    /// What this binary offers the server's UI, raised with every native feature
    /// an older binary lacks. The UI asks before it calls (native/capabilities.ts),
    /// and a server can require a minimum (minNativeShellApi in /api/health/features).
    static let shellApi = 2
    /// The native features by name, so the UI can turn each on by itself.
    /// "watch" only where WatchConnectivity is (an iPhone, not an iPad), so the UI never
    /// builds a snapshot for nothing; "wallet" only where Wallet can take a pass (an
    /// iPhone: an iPad has no Wallet app), so the UI offers no button that does nothing.
    static var features: [String] {
        var names = ["capabilities", "edgeBack", "tileCache", "biometricLock", "geolocation", "sharedFiles", "nativePush", "widgets", "liveActivity", "widgetTrips", "storeKit", "shareSheet", "keyCommands", "quickActions", "clientCertificate", "filePreview"]
        if canAddWalletPasses { names.append("wallet") }
        if TrekWatchLink.isAvailable { names.append("watch") }
        return names
    }

    /// Whether this device can add a pass to Apple Wallet (an iPhone; not an iPad).
    static var canAddWalletPasses: Bool {
        PKPassLibrary.isPassLibraryAvailable() && PKAddPassesViewController.canAddPasses()
    }

    // MARK: - Shared booking documents

    override public func load() {
        TrekSharedFiles.onReceive = { [weak self] file in
            DispatchQueue.main.async { self?.notifyListeners("sharedFile", data: file) }
        }
        TrekPush.shared.onOpen = { [weak self] url in
            DispatchQueue.main.async { self?.notifyListeners("pushOpened", data: ["url": url]) }
        }
        TrekStore.watchUpdates()
        TrekWatchLink.shared.onAction = { [weak self] in self?.notifyListeners("watchAction", data: [:]) }
        TrekKeyCommands.onPress = { [weak self] id in
            self?.notifyListeners("keyCommand", data: ["id": id])
        }
        TrekQuickActions.onOpen = { [weak self] path in
            DispatchQueue.main.async { self?.notifyListeners("quickAction", data: ["path": path]) }
        }
    }

    // MARK: - Quick actions on the app icon

    /// The app icon's quick actions, in the UI's language (TrekQuickActions).
    @objc func setQuickActions(_ call: CAPPluginCall) {
        let items = (call.getArray("items", JSObject.self) ?? []).compactMap { TrekQuickActions.Item(raw: $0) }
        DispatchQueue.main.async {
            TrekQuickActions.set(items)
            call.resolve()
        }
    }

    /// The quick action the app was launched with, before the UI was there to hear of it.
    @objc func takeQuickAction(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let path = TrekQuickActions.take() {
                call.resolve(["path": path])
            } else {
                call.resolve(["path": NSNull()])
            }
        }
    }

    // MARK: - Hardware keyboard

    /// The UI's keyboard shortcuts for the screen it shows (mobile/keyboard),
    /// named in its language, as key commands in the app's menu.
    @objc func setKeyCommands(_ call: CAPPluginCall) {
        let raw = call.getArray("commands", JSObject.self) ?? []
        let commands = raw.compactMap { TrekKeyCommands.Command(raw: $0) }
        DispatchQueue.main.async {
            TrekKeyCommands.set(commands)
            call.resolve()
        }
    }

    // MARK: - Widgets and the travel-day Live Activity

    /// Stores what the home-screen widget shows (native/widgets.ts builds it, texts
    /// already translated) where the widget extension reads it, and redraws it.
    /// `key` (feature widgetTrips) stores one trip's snapshot ("trip.<id>") or the
    /// list of trips a widget can be set to ("trips"); without it, the dashboard's.
    @objc func setWidgetSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let data = json.data(using: .utf8) else {
            call.reject("json is required")
            return
        }
        let key = call.getString("key") ?? "snapshot"
        guard key == "snapshot" || key == "trips" || key.range(of: "^trip\\.[0-9]{1,12}$", options: .regularExpression) != nil else {
            call.reject("key must be snapshot, trips or trip.<id>")
            return
        }
        TrekSharedKeychain.write("widget.\(key)", data)
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }

    /// Starts the travel day's Live Activity, or updates the one running.
    @objc func syncTripDay(_ call: CAPPluginCall) {
        guard let title = call.getString("tripTitle"), let path = call.getString("path"),
              let dayLabel = call.getString("dayLabel"), let nextName = call.getString("nextName") else {
            call.reject("tripTitle, path, dayLabel and nextName are required")
            return
        }
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.resolve(["running": false])
                return
            }
            let state = TripDayAttributes.ContentState(
                dayLabel: dayLabel,
                nextName: nextName,
                nextTime: call.getString("nextTime"),
                done: call.getInt("done") ?? 0,
                total: call.getInt("total") ?? 0
            )
            // Stale at the end of the day, so a forgotten one fades out on its own.
            let stale = Calendar.current.startOfDay(for: Date().addingTimeInterval(86_400))
            let content = ActivityContent(state: state, staleDate: stale)
            if let running = Activity<TripDayAttributes>.activities.first(where: { $0.attributes.path == path }) {
                Task { await running.update(content) }
            } else {
                for other in Activity<TripDayAttributes>.activities {
                    Task { await other.end(nil, dismissalPolicy: .immediate) }
                }
                _ = try? Activity.request(attributes: TripDayAttributes(tripTitle: title, path: path), content: content)
            }
            call.resolve(["running": true])
            return
        }
        #endif
        call.resolve(["running": false])
    }

    @objc func endTripDay(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            for activity in Activity<TripDayAttributes>.activities {
                Task { await activity.end(nil, dismissalPolicy: .immediate) }
            }
        }
        #endif
        call.resolve()
    }

    // MARK: - Apple Watch

    /// Passes what the watch app shows (native/watch.ts builds it) on to the watch.
    @objc func setWatchSnapshot(_ call: CAPPluginCall) {
        guard TrekWatchLink.isAvailable else {
            call.resolve()
            return
        }
        guard let json = call.getString("json"), let data = json.data(using: .utf8) else {
            call.reject("json is required")
            return
        }
        TrekWatchLink.shared.publish(data)
        call.resolve()
    }

    /// The packing items and to-dos ticked on the watch since the last call, oldest first.
    @objc func takeWatchActions(_ call: CAPPluginCall) {
        call.resolve(["actions": TrekWatchLink.shared.takeActions()])
    }

    // MARK: - Push

    /// Asks for permission, registers with APNs and answers with a Web Push
    /// subscription the server stores like a browser's (native/push.ts): the
    /// relay endpoint for this device's token, and this device's keys, which the
    /// notification extension uses to decrypt.
    @objc func registerPush(_ call: CAPPluginCall) {
        TrekPush.shared.register { result in
            switch result {
            case .success(let subscription): call.resolve(subscription)
            case .failure(let error):
                let code = (error as? TrekPush.PushError) == .denied ? "DENIED" : "FAILED"
                call.reject(error.localizedDescription, code)
            }
        }
    }

    /// The notification the app was opened from, before the UI was there to hear of it.
    @objc func takeOpenedPush(_ call: CAPPluginCall) {
        if let url = TrekPush.shared.takeOpened() {
            call.resolve(["url": url])
        } else {
            call.resolve(["url": NSNull()])
        }
    }

    /// The document shared to TREK before the UI was there to hear of it.
    @objc func takeSharedFile(_ call: CAPPluginCall) {
        if let file = TrekSharedFiles.take() {
            call.resolve(["file": file])
        } else {
            call.resolve(["file": NSNull()])
        }
    }

    // MARK: - Location

    /// One CoreLocation stream for the UI's navigator.geolocation (native/geolocation.ts).
    /// The WebView's own asks for every server origin, and again and again; this
    /// is the one system prompt the app's location string describes.
    private lazy var location = TrekLocation { [weak self] payload in
        self?.notifyListeners("location", data: payload)
    }

    @objc func startLocation(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.location.start(highAccuracy: call.getBool("highAccuracy") ?? false)
            call.resolve()
        }
    }

    @objc func stopLocation(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.location.stop()
            call.resolve()
        }
    }

    // MARK: - App lock

    /// Which biometry the device offers for the app lock, if any.
    @objc func biometryInfo(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
        let type: String
        switch context.biometryType {
        case .faceID: type = "faceID"
        case .touchID: type = "touchID"
        default: type = "none"
        }
        call.resolve(["available": available, "type": type])
    }

    /// Face ID / Touch ID with the passcode as the way out, the way system apps
    /// lock. Rejects with CANCELLED when the user backs out.
    @objc func authenticateBiometric(_ call: CAPPluginCall) {
        let reason = call.getString("reason") ?? "Unlock TREK"
        let context = LAContext()
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { ok, error in
            if ok {
                call.resolve(["ok": true])
            } else if let laError = error as? LAError, [.userCancel, .appCancel, .systemCancel].contains(laError.code) {
                call.reject("Unlock cancelled", "CANCELLED")
            } else {
                call.reject(error?.localizedDescription ?? "Unlock failed", "FAILED")
            }
        }
    }

    /// While on, the app switcher shows a blurred cover instead of the screen
    /// (SceneDelegate), so a locked app does not show its content there.
    @objc func setPrivacyCover(_ call: CAPPluginCall) {
        TrekPrivacyCover.enabled = call.getBool("enabled") ?? false
        call.resolve()
    }

    // MARK: - Map tile store

    /// How much the stored map tiles take on disk, for the offline settings.
    @objc func getTileCacheUsage(_ call: CAPPluginCall) {
        TrekTileStore.shared.usage { bytes in
            call.resolve(["bytes": Int(bytes), "limit": Int(TrekTileStore.maxBytes)])
        }
    }

    @objc func clearTileCache(_ call: CAPPluginCall) {
        TrekTileStore.shared.clear { call.resolve() }
    }

    @objc func getCapabilities(_ call: CAPPluginCall) {
        let info = Bundle.main.infoDictionary
        call.resolve([
            "shellApi": TrekShellPlugin.shellApi,
            "platform": "ios",
            "appVersion": info?["CFBundleShortVersionString"] as? String ?? "",
            "build": info?["CFBundleVersion"] as? String ?? "",
            "features": TrekShellPlugin.features,
        ])
    }

    private var authSession: ASWebAuthenticationSession?

    @objc func getServer(_ call: CAPPluginCall) {
        call.resolve([
            "url": TrekServerStore.url ?? NSNull(),
            "previousUrl": TrekServerStore.previousURL ?? NSNull(),
        ])
    }

    @objc func setServer(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), ["https", "http"].contains(url.scheme), url.host != nil else {
            call.reject("A http(s) URL is required")
            return
        }
        TrekServerStore.url = raw
        let labels = (call.getObject("labels") ?? [:]).compactMapValues { $0 as? String }
        if !labels.isEmpty { TrekServerStore.labels = labels }
        // After the URL: setting it clears the hosts of the server before.
        let hosts = (call.getArray("signInHosts", String.self) ?? []).filter { $0.range(of: "^[A-Za-z0-9.-]+(:[0-9]+)?$", options: .regularExpression) != nil }
        TrekServerStore.signInHosts = Set(hosts.map { $0.lowercased() })
        // A TREK Cloud purchase: the code that signs the buyer in, opened once after the first page.
        let welcome = call.getString("welcome") ?? ""
        TrekServerStore.pendingWelcome = welcome.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil ? welcome : nil
        call.resolve()
        restartBridge()
    }

    @objc func resetServer(_ call: CAPPluginCall) {
        TrekServerStore.url = nil
        call.resolve()
        restartBridge()
    }

    @objc func reload(_ call: CAPPluginCall) {
        call.resolve()
        restartBridge()
    }

    /// A new bridge rather than a navigation: the server URL is part of the
    /// bridge's configuration and decides which origin counts as the app.
    private func restartBridge() {
        DispatchQueue.main.async { [weak self] in
            guard let window = self?.bridge?.viewController?.view.window else { return }
            window.rootViewController = TrekBridgeViewController()
        }
    }

    // MARK: - Sign-in through the system browser

    @objc func authenticate(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), let scheme = call.getString("callbackScheme") else {
            call.reject("url and callbackScheme are required")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callbackURL, error in
                self?.authSession = nil
                if let callbackURL {
                    call.resolve(["url": callbackURL.absoluteString])
                } else if let authError = error as? ASWebAuthenticationSessionError, authError.code == .canceledLogin {
                    call.reject("Sign-in cancelled", "CANCELLED")
                } else {
                    call.reject(error?.localizedDescription ?? "Sign-in failed")
                }
            }
            // Shares Safari's cookies, so a running SSO session at the identity
            // provider carries over and nobody types their password twice.
            session.prefersEphemeralWebBrowserSession = false
            session.presentationContextProvider = self
            self.authSession = session
            if !session.start() {
                self.authSession = nil
                call.reject("Could not open the browser")
            }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }

    // MARK: - Offline start

    /// WKWebView runs no service worker for a domain that is not listed in the
    /// app at build time, and a user's own server never is. So the app keeps
    /// the server's start page itself, and the scripts it references stay in
    /// WebKit's HTTP cache (the server marks them immutable).
    @objc func refreshOfflineCopy(_ call: CAPPluginCall) {
        guard let raw = TrekServerStore.url, let url = URL(string: raw) else {
            call.resolve(["saved": false])
            return
        }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.setValue("text/html", forHTTPHeaderField: "Accept")
        // The app's session, so a server behind mutual TLS gets the client certificate.
        TrekClientCertSessionDelegate.session.dataTask(with: request) { data, response, _ in
            guard let data, let http = response as? HTTPURLResponse, http.statusCode == 200,
                  http.value(forHTTPHeaderField: "Content-Type")?.hasPrefix("text/html") == true,
                  TrekServerStore.url == raw else {
                call.resolve(["saved": false])
                return
            }
            do {
                let target = TrekServerStore.offlineCopyURL
                try FileManager.default.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
                try data.write(to: target, options: .atomic)
                call.resolve(["saved": true])
            } catch {
                call.resolve(["saved": false])
            }
        }.resume()
    }

    @objc func openOfflineCopy(_ call: CAPPluginCall) {
        // With the trailing slash, like the bridge's serverURL: Capacitor only
        // keeps a navigation in the app when it starts with that exact string,
        // and hands anything else to Safari.
        guard let raw = TrekServerStore.url, let url = URL(string: raw.hasSuffix("/") ? raw : raw + "/"),
              let html = try? Data(contentsOf: TrekServerStore.offlineCopyURL) else {
            call.resolve(["opened": false])
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.bridge?.webView else {
                call.resolve(["opened": false])
                return
            }
            let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "text/html; charset=utf-8"])!
            call.resolve(["opened": true])
            webView.loadSimulatedRequest(URLRequest(url: url), response: response, responseData: html)
        }
    }
}

// MARK: - Client certificates (mutual TLS)

extension TrekShellPlugin {
    /// The address screen's check of a server, made natively so it notices
    /// whether the server asks for a client certificate and can show the stored
    /// one. A failed connection resolves with status 0 instead of rejecting.
    @objc func requestServer(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw),
              ["https", "http"].contains(url.scheme?.lowercased() ?? ""), url.host != nil else {
            call.reject("A http(s) URL is required")
            return
        }
        let timeout = min(max(Double(call.getInt("timeoutMs") ?? 10000), 1000), 30000) / 1000
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: timeout)
        request.setValue("application/json, text/html;q=0.9, */*;q=0.8", forHTTPHeaderField: "Accept")
        let delegate = TrekClientCertSessionDelegate.shared
        var task: URLSessionDataTask?
        task = TrekClientCertSessionDelegate.session.dataTask(with: request) { data, response, error in
            let asked = task.flatMap { delegate.ask(for: $0) }
            var result: [String: Any] = [
                "certRequested": asked != nil,
                "certSent": asked == true,
                "url": response?.url?.absoluteString ?? raw,
            ]
            if asked != nil, let host = url.host?.lowercased() { result["certHost"] = "\(host):\(url.port ?? 443)" }
            if let http = response as? HTTPURLResponse {
                result["status"] = http.statusCode
                let body = (data ?? Data()).prefix(512 * 1024)
                result["data"] = String(data: body, encoding: .utf8) ?? ""
                var headers: [String: String] = [:]
                for (name, value) in http.allHeaderFields {
                    if let name = name as? String, let value = value as? String { headers[name] = value }
                }
                result["headers"] = headers
            } else {
                result["status"] = 0
                result["data"] = ""
                if let error { result["error"] = (error as NSError).domain + ":" + String((error as NSError).code) }
            }
            call.resolve(result)
        }
        task?.resume()
    }

    /// The stored client certificate's details, and the last server that asked for one.
    @objc func clientCertificate(_ call: CAPPluginCall) {
        var result: [String: Any] = [:]
        if let info = TrekClientIdentity.info() { result["certificate"] = info } else { result["certificate"] = NSNull() }
        if let asked = TrekClientIdentity.lastRequest {
            result["request"] = ["host": asked.host, "port": asked.port, "served": asked.served]
        }
        call.resolve(result)
    }

    @objc func removeClientCertificate(_ call: CAPPluginCall) {
        TrekClientIdentity.remove()
        call.resolve()
    }

    /// Picks a .p12/.pfx file, asks for its password until it opens or the user
    /// gives up, and keeps it for the server at host and port.
    @objc func importClientCertificate(_ call: CAPPluginCall) {
        guard let host = call.getString("host"), host.range(of: "^[A-Za-z0-9.-]+$", options: .regularExpression) != nil else {
            call.reject("A host is required")
            return
        }
        let port = call.getInt("port") ?? 443
        let labels = (call.getObject("labels") ?? [:]).compactMapValues { $0 as? String }
        DispatchQueue.main.async { [weak self] in
            guard let presenter = self?.bridge?.viewController else {
                call.resolve(["result": "failed", "failure": TrekClientIdentity.Failure.store.rawValue])
                return
            }
            TrekClientCertImporter(presenter: presenter, labels: labels, host: host, port: port) { result in
                call.resolve(result)
            }.start()
        }
    }
}

/// Positions and errors for the UI, shaped like the Geolocation API's, with the
/// When-In-Use permission asked the first time.
// MARK: - Quick Look

extension TrekShellPlugin {
    /// Kept while Quick Look shows a file: the controller holds its data source weakly.
    /// One preview at a time, so a static: an extension cannot store per instance.
    private static var previewSource: TrekFilePreviewSource?

    /// Shows a file the UI wrote to the cache in Quick Look: a PDF to page through,
    /// an image, a document, with the system's own share button. "unsupported" for
    /// a file Quick Look cannot show, which the UI then hands to the share sheet.
    @objc func previewFile(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), let url = URL(string: path), url.isFileURL,
              FileManager.default.fileExists(atPath: url.path) else {
            call.reject("a file in the app's cache is required", "INVALID")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self, let presenter = self.bridge?.viewController else {
                call.reject("nothing to show the preview from", "UNAVAILABLE")
                return
            }
            guard QLPreviewController.canPreview(url as QLPreviewItem) else {
                call.resolve(["result": "unsupported"])
                return
            }
            let source = TrekFilePreviewSource(url: url, title: call.getString("title"))
            TrekShellPlugin.previewSource = source
            let preview = QLPreviewController()
            preview.dataSource = source
            presenter.present(preview, animated: true)
            call.resolve(["result": "shown"])
        }
    }
}

// MARK: - Apple Wallet

extension TrekShellPlugin {
    /// Feature wallet: a booking's Wallet pass, straight into Apple Wallet. A pass
    /// already there opens in Wallet instead of being offered twice. Resolves with
    /// `result` added, opened or cancelled; rejects INVALID for bytes that are no
    /// pass and UNAVAILABLE where Wallet cannot take one.
    @objc func addToWallet(_ call: CAPPluginCall) {
        guard let base64 = call.getString("data"), let data = Data(base64Encoded: base64),
              let pass = try? PKPass(data: data) else {
            call.reject("not a Wallet pass", "INVALID")
            return
        }
        DispatchQueue.main.async { [weak self] in
            let library = PKPassLibrary()
            if library.containsPass(pass), let url = pass.passURL {
                UIApplication.shared.open(url)
                call.resolve(["result": "opened"])
                return
            }
            guard PKAddPassesViewController.canAddPasses(),
                  let sheet = PKAddPassesViewController(pass: pass),
                  let presenter = self?.bridge?.viewController else {
                call.reject("Wallet is not available", "UNAVAILABLE")
                return
            }
            let delegate = TrekWalletSheet { [weak sheet] in
                sheet?.dismiss(animated: true)
                call.resolve(["result": library.containsPass(pass) ? "added" : "cancelled"])
            }
            sheet.delegate = delegate
            TrekWalletSheet.current = delegate
            presenter.present(sheet, animated: true)
        }
    }
}

/// Answers the Wallet sheet closing; held while it is up, since the sheet only keeps a weak delegate.
final class TrekWalletSheet: NSObject, PKAddPassesViewControllerDelegate {
    static var current: TrekWalletSheet?
    private let done: () -> Void

    init(done: @escaping () -> Void) {
        self.done = done
    }

    func addPassesViewControllerDidFinish(_ controller: PKAddPassesViewController) {
        done()
        TrekWalletSheet.current = nil
    }
}

// MARK: - In-app purchase

extension TrekShellPlugin {
    /// Feature storeKit: the App Store's own price strings for the given products,
    /// already in the buyer's currency and format. Products the store does not
    /// know are left out, so the shell offers only what can really be bought.
    @objc func storeProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        // TestFlight, App Review and Xcode builds buy in the sandbox; their receipt says so.
        let sandbox = Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
        Task {
            guard AppStore.canMakePayments, let products = try? await Product.products(for: ids) else {
                call.resolve(["products": [], "sandbox": sandbox])
                return
            }
            call.resolve(["products": products.map { ["id": $0.id, "displayPrice": $0.displayPrice] }, "sandbox": sandbox])
        }
    }

    /// Feature storeKit: runs the App Store purchase sheet. Resolves with `kind`
    /// bought (with the signed transaction the control plane verifies), cancelled,
    /// pending (Ask to Buy, a payment the bank still has to approve) or failed.
    /// The transaction stays unfinished until storeFinish, so a purchase whose
    /// instance was never set up is delivered again rather than lost.
    @objc func storePurchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId") else {
            call.reject("productId is required")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.resolve(["kind": "failed"])
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.resolve(["kind": "failed"])
                        return
                    }
                    call.resolve([
                        "kind": "bought",
                        "jws": verification.jwsRepresentation,
                        "transactionId": String(transaction.id),
                    ])
                case .userCancelled:
                    call.resolve(["kind": "cancelled"])
                case .pending:
                    call.resolve(["kind": "pending"])
                @unknown default:
                    call.resolve(["kind": "failed"])
                }
            } catch {
                call.resolve(["kind": "failed"])
            }
        }
    }

    /// Feature storeKit: marks a purchase as delivered, once its instance exists.
    @objc func storeFinish(_ call: CAPPluginCall) {
        guard let raw = call.getString("transactionId"), let id = UInt64(raw) else {
            call.reject("transactionId is required")
            return
        }
        Task {
            await TrekStore.finish(id)
            call.resolve()
        }
    }

    /// Feature storeKit: the newest active subscription on this Apple ID among
    /// products starting with `prefix`, after syncing with the App Store. Resolves
    /// without `jws` when there is none.
    @objc func storeRestore(_ call: CAPPluginCall) {
        let prefix = call.getString("prefix") ?? "cloud."
        Task {
            // Asks for the Apple ID password when needed; a cancel still leaves the local entitlements to check.
            try? await AppStore.sync()
            guard let found = await TrekStore.currentEntitlement(prefix: prefix) else {
                call.resolve([:])
                return
            }
            call.resolve(["jws": found.jws, "transactionId": String(found.id)])
        }
    }
}

enum TrekStore {
    private static var updates: Task<Void, Never>?

    /// Listens for transactions that arrive outside a purchase sheet. Renewals are
    /// finished at once: the control plane learns of them from Apple's server
    /// notifications. A first purchase that lands here (Ask to Buy approved later,
    /// a purchase interrupted by the app closing) stays unfinished for the shell
    /// to redeem through a restore.
    static func watchUpdates() {
        guard updates == nil else { return }
        updates = Task.detached {
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                if transaction.originalID != transaction.id {
                    await transaction.finish()
                }
            }
        }
    }

    static func finish(_ id: UInt64) async {
        for await result in Transaction.unfinished {
            if case .verified(let transaction) = result, transaction.id == id {
                await transaction.finish()
            }
        }
    }

    static func currentEntitlement(prefix: String) async -> (jws: String, id: UInt64)? {
        var newest: (date: Date, jws: String, id: UInt64)?
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  transaction.productID.hasPrefix(prefix),
                  transaction.revocationDate == nil else { continue }
            if newest == nil || transaction.purchaseDate > newest!.date {
                newest = (transaction.purchaseDate, result.jwsRepresentation, transaction.id)
            }
        }
        return newest.map { ($0.jws, $0.id) }
    }
}

final class TrekLocation: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private let emit: ([String: Any]) -> Void
    private var running = false

    init(emit: @escaping ([String: Any]) -> Void) {
        self.emit = emit
        super.init()
        manager.delegate = self
    }

    func start(highAccuracy: Bool) {
        manager.desiredAccuracy = highAccuracy ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters
        running = true
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            emitError(code: 1, message: "Location permission denied")
        default:
            manager.startUpdatingLocation()
            manager.startUpdatingHeading()
        }
    }

    func stop() {
        running = false
        manager.stopUpdatingLocation()
        manager.stopUpdatingHeading()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard running else { return }
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
            manager.startUpdatingHeading()
        case .denied, .restricted:
            emitError(code: 1, message: "Location permission denied")
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let last = locations.last else { return }
        emit([
            "latitude": last.coordinate.latitude,
            "longitude": last.coordinate.longitude,
            "accuracy": last.horizontalAccuracy,
            "altitude": last.verticalAccuracy >= 0 ? last.altitude as Any : NSNull(),
            "speed": last.speed >= 0 ? last.speed as Any : NSNull(),
            "heading": last.course >= 0 ? last.course as Any : NSNull(),
            "timestamp": last.timestamp.timeIntervalSince1970 * 1000,
        ])
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let code = (error as? CLError)?.code == .denied ? 1 : 2
        emitError(code: code, message: error.localizedDescription)
    }

    private func emitError(code: Int, message: String) {
        emit(["error": ["code": code, "message": message]])
    }
}

/// The app's side of TREK push: an APNs token, the device's Web Push keys in the
/// keychain group the notification extension shares, and the relay endpoint
/// that ties them together.
final class TrekPush {
    static let shared = TrekPush()
    static let relay = "https://push.liketrek.com/v1/apns"
    /// The keychain group the notification extension reads the keys from.
    static let keychainGroup = "com.liketrek.trek.shared"

    enum PushError: Error, Equatable { case denied, failed }

    private var pending: [(Result<[String: Any], Error>) -> Void] = []
    private var openedURL: String?
    var onOpen: ((String) -> Void)?

    func register(_ done: @escaping (Result<[String: Any], Error>) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else {
                done(.failure(PushError.denied))
                return
            }
            DispatchQueue.main.async {
                self.pending.append(done)
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func didRegister(token: Data) {
        let hex = token.map { String(format: "%02x", $0) }.joined()
        #if DEBUG
        let environment = "sandbox"
        #else
        let environment = "production"
        #endif
        let result: Result<[String: Any], Error>
        if let keys = TrekPushKeys.loadOrCreate() {
            result = .success([
                "endpoint": "\(TrekPush.relay)/\(environment)/\(hex)",
                "keys": ["p256dh": keys.publicKey, "auth": keys.auth],
            ])
        } else {
            result = .failure(PushError.failed)
        }
        let waiting = pending
        pending.removeAll()
        waiting.forEach { $0(result) }
    }

    func didFail(_ error: Error) {
        let waiting = pending
        pending.removeAll()
        waiting.forEach { $0(.failure(error)) }
    }

    func opened(url: String) {
        if let onOpen { onOpen(url) } else { openedURL = url }
    }

    func takeOpened() -> String? {
        defer { openedURL = nil }
        return openedURL
    }
}

/// The device's Web Push key pair (P-256) and auth secret, kept in the shared
/// keychain group so the notification extension can decrypt what the server
/// encrypted for them (RFC 8291). Base64url without padding, as the server reads them.
enum TrekPushKeys {
    private static let privateKeyAccount = "push.privateKey"
    private static let authAccount = "push.auth"

    static func loadOrCreate() -> (publicKey: String, auth: String)? {
        if let raw = TrekSharedKeychain.read(privateKeyAccount), let auth = TrekSharedKeychain.read(authAccount),
           let key = try? P256.KeyAgreement.PrivateKey(rawRepresentation: raw) {
            return (base64url(key.publicKey.x963Representation), base64url(auth))
        }
        let key = P256.KeyAgreement.PrivateKey()
        var auth = Data(count: 16)
        let status = auth.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }
        guard status == errSecSuccess,
              TrekSharedKeychain.write(privateKeyAccount, key.rawRepresentation),
              TrekSharedKeychain.write(authAccount, auth) else { return nil }
        return (base64url(key.publicKey.x963Representation), base64url(auth))
    }

    static func base64url(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

/// Items the app shares with its extensions (the notification extension, the
/// widgets) through one keychain group, so no App Group is needed: the push keys
/// and the widget snapshot.
enum TrekSharedKeychain {
    static let service = "com.liketrek.trek.push"

    private static func query(_ account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: accessGroup,
        ]
    }

    /// The team-prefixed shared group, read off a probe item in the default group.
    static var accessGroup: String = {
        let probe: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "push.groupProbe",
            kSecAttrService as String: service,
            kSecReturnAttributes as String: true,
        ]
        var result: CFTypeRef?
        var status = SecItemCopyMatching(probe as CFDictionary, &result)
        if status == errSecItemNotFound {
            var add = probe
            add.removeValue(forKey: kSecReturnAttributes as String)
            add[kSecValueData as String] = Data()
            SecItemAdd(add as CFDictionary, nil)
            status = SecItemCopyMatching(probe as CFDictionary, &result)
        }
        // The default group is the first one in the entitlement: "TEAMID.com.liketrek.trek.shared".
        if status == errSecSuccess, let attributes = result as? [String: Any],
           let group = attributes[kSecAttrAccessGroup as String] as? String,
           let prefix = group.split(separator: ".").first {
            return "\(prefix).\(TrekPush.keychainGroup)"
        }
        return TrekPush.keychainGroup
    }()

    static func read(_ account: String) -> Data? {
        var q = query(account)
        q[kSecReturnData as String] = true
        var result: CFTypeRef?
        return SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess ? result as? Data : nil
    }

    static func delete(_ account: String) {
        SecItemDelete(query(account) as CFDictionary)
    }

    @discardableResult
    static func write(_ account: String, _ data: Data) -> Bool {
        SecItemDelete(query(account) as CFDictionary)
        var q = query(account)
        q[kSecValueData as String] = data
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }
}

/// The one file Quick Look shows, under the name the user knows it by.
final class TrekFilePreviewSource: NSObject, QLPreviewControllerDataSource {
    private let item: Item

    init(url: URL, title: String?) {
        item = Item(url: url, title: title)
    }

    func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

    func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { item }

    final class Item: NSObject, QLPreviewItem {
        let previewItemURL: URL?
        let previewItemTitle: String?

        init(url: URL, title: String?) {
            previewItemURL = url
            previewItemTitle = title
        }
    }
}
