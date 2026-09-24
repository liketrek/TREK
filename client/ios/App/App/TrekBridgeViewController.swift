import UIKit
import Capacitor

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

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TrekShellPlugin())
        // The swipe from the left edge that goes back in every iOS app. It walks
        // the SPA's history, the same entries Android's back button uses.
        webView?.allowsBackForwardNavigationGestures = true
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
