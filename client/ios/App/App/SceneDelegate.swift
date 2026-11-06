import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = TrekBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    // The app switcher takes its snapshot as the scene resigns active, so the
    // cover goes on there and comes off when the app is back.
    func sceneWillResignActive(_ scene: UIScene) {
        TrekPrivacyCover.show(in: window)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        TrekPrivacyCover.hide()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
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
