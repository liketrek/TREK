import AuthenticationServices
import Capacitor
import CoreLocation
import CryptoKit
import Security
import UserNotifications
import LocalAuthentication
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
    ]

    /// What this binary offers the server's UI, raised with every native feature
    /// an older binary lacks. The UI asks before it calls (native/capabilities.ts),
    /// and a server can require a minimum (minNativeShellApi in /api/health/features).
    static let shellApi = 2
    /// The native features by name, so the UI can turn each on by itself.
    static let features: [String] = ["capabilities", "edgeBack", "tileCache", "biometricLock", "geolocation", "sharedFiles", "nativePush"]

    // MARK: - Shared booking documents

    override public func load() {
        TrekSharedFiles.onReceive = { [weak self] file in
            DispatchQueue.main.async { self?.notifyListeners("sharedFile", data: file) }
        }
        TrekPush.shared.onOpen = { [weak self] url in
            DispatchQueue.main.async { self?.notifyListeners("pushOpened", data: ["url": url]) }
        }
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
        call.resolve(["url": TrekServerStore.url ?? NSNull()])
    }

    @objc func setServer(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), ["https", "http"].contains(url.scheme), url.host != nil else {
            call.reject("A http(s) URL is required")
            return
        }
        TrekServerStore.url = raw
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
        URLSession.shared.dataTask(with: request) { data, response, _ in
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

/// Positions and errors for the UI, shaped like the Geolocation API's, with the
/// When-In-Use permission asked the first time.
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
        if let raw = read(privateKeyAccount), let auth = read(authAccount),
           let key = try? P256.KeyAgreement.PrivateKey(rawRepresentation: raw) {
            return (base64url(key.publicKey.x963Representation), base64url(auth))
        }
        let key = P256.KeyAgreement.PrivateKey()
        var auth = Data(count: 16)
        let status = auth.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }
        guard status == errSecSuccess, write(privateKeyAccount, key.rawRepresentation), write(authAccount, auth) else { return nil }
        return (base64url(key.publicKey.x963Representation), base64url(auth))
    }

    private static func query(_ account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.liketrek.trek.push",
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: accessGroup,
        ]
    }

    /// The team-prefixed group, read from the app's own entitlement at runtime.
    private static var accessGroup: String {
        let probe: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "push.groupProbe",
            kSecAttrService as String: "com.liketrek.trek.push",
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
    }

    private static func read(_ account: String) -> Data? {
        var q = query(account)
        q[kSecReturnData as String] = true
        var result: CFTypeRef?
        return SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess ? result as? Data : nil
    }

    private static func write(_ account: String, _ data: Data) -> Bool {
        SecItemDelete(query(account) as CFDictionary)
        var q = query(account)
        q[kSecValueData as String] = data
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }

    static func base64url(_ data: Data) -> String {
        data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
