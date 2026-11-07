import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = TrekBridgeViewController()
        window?.makeKeyAndVisible()

        // Launched by "Open in TREK" on a booking document.
        for context in connectionOptions.urlContexts where context.url.isFileURL {
            TrekSharedFiles.receive(context.url)
        }
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    // The app switcher takes its snapshot as the scene resigns active, so the
    // cover goes on there and comes off when the app is back.
    func sceneWillResignActive(_ scene: UIScene) {
        TrekPrivacyCover.show(in: window)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        TrekPrivacyCover.hide()
        // Whatever the share sheet left, even if it could not bring the app forward itself.
        TrekSharedFiles.receiveFromShareExtension()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // A booking document shared to TREK goes to the UI's import; anything
        // else (the sign-in callback) stays with Capacitor.
        let files = URLContexts.filter { $0.url.isFileURL }
        for context in files { TrekSharedFiles.receive(context.url) }
        // com.liketrek.trek://share: the share sheet left an item for the import.
        let handoffs = URLContexts.filter { $0.url.scheme == "com.liketrek.trek" && $0.url.host == "share" }
        if !handoffs.isEmpty { TrekSharedFiles.receiveFromShareExtension() }
        let others = URLContexts.subtracting(files).subtracting(handoffs)
        if !others.isEmpty { SceneDelegateProxy.shared.scene(scene, openURLContexts: others) }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

/// The blur over the app while it sits in the app switcher, when the app lock
/// is on (TrekShell.setPrivacyCover from the UI's lock setting).
enum TrekPrivacyCover {
    private static let key = "TrekPrivacyCover"
    private static weak var cover: UIView?

    static var enabled: Bool {
        get { UserDefaults.standard.bool(forKey: key) }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    static func show(in window: UIWindow?) {
        guard enabled, cover == nil, let window else { return }
        let view = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
        view.frame = window.bounds
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(view)
        cover = view
    }

    static func hide() {
        cover?.removeFromSuperview()
        cover = nil
    }
}

/// Booking documents shared to TREK ("Open in TREK"), held until the UI takes
/// them (TrekShell.takeSharedFile) and announced if it is already running.
enum TrekSharedFiles {
    /// Above this the file is not a booking confirmation, and base64 over the
    /// bridge would only stall the app.
    static let maxBytes = 15 * 1024 * 1024
    private(set) static var pending: [String: Any]?
    static var onReceive: (([String: Any]) -> Void)?

    static func receive(_ url: URL) {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url), data.count <= maxBytes else { return }
        let file: [String: Any] = [
            "name": url.lastPathComponent,
            "mimeType": mimeType(for: url.pathExtension.lowercased()),
            "data": data.base64EncodedString(),
        ]
        pending = file
        onReceive?(file)
    }

    /// The item the share extension stored (ShareExtension/ShareHandoff.swift), with
    /// the trip picked for it there. Taken once: the keychain is cleared right away.
    static func receiveFromShareExtension() {
        guard let meta = TrekSharedKeychain.read("share.pending.meta"),
              let data = TrekSharedKeychain.read("share.pending.data") else { return }
        TrekSharedKeychain.delete("share.pending.meta")
        TrekSharedKeychain.delete("share.pending.data")
        guard let info = try? JSONSerialization.jsonObject(with: meta) as? [String: Any],
              let name = info["name"] as? String, data.count <= maxBytes else { return }
        var file: [String: Any] = [
            "name": name,
            "mimeType": info["mimeType"] as? String ?? mimeType(for: (name as NSString).pathExtension.lowercased()),
            "data": data.base64EncodedString(),
        ]
        if let tripId = info["tripId"] as? Int { file["tripId"] = tripId }
        pending = file
        onReceive?(file)
    }

    static func take() -> [String: Any]? {
        defer { pending = nil }
        return pending
    }

    private static func mimeType(for ext: String) -> String {
        switch ext {
        case "pdf": return "application/pdf"
        case "ics": return "text/calendar"
        case "pkpass": return "application/vnd.apple.pkpass"
        case "eml": return "message/rfc822"
        default: return "application/octet-stream"
        }
    }
}
