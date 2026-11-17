import SwiftUI
import UIKit

/// The share sheet's entry point ("TREK" in the share sheet of Mail, Safari,
/// Files, Wallet and any app that shares a document or a link). It reads what
/// was shared, lets the user pick the trip it belongs to, leaves both for the
/// app (ShareHandoff) and opens TREK, where the booking import takes over.
@objc(ShareViewController)
final class ShareViewController: UIViewController {
    private let model = ShareModel()

    // On an iPad the system would put the extension in a form sheet, a box in the
    // middle of the screen with this sheet's own dimming and card inside it. Over
    // the full screen instead, the card stands centred over the app that shared,
    // the way an iPad presents a small form.
    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
        presentOverFullScreenOnPad()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        presentOverFullScreenOnPad()
    }

    private func presentOverFullScreenOnPad() {
        if UIDevice.current.userInterfaceIdiom == .pad { modalPresentationStyle = .overFullScreen }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear

        model.onCancel = { [weak self] in
            self?.extensionContext?.cancelRequest(withError: NSError(domain: "com.liketrek.trek.share", code: 0))
        }
        model.onDone = { [weak self] in
            self?.openApp()
            self?.extensionContext?.completeRequest(returningItems: nil)
        }

        let host = UIHostingController(rootView: ShareView(model: model))
        host.view.backgroundColor = .clear
        addChild(host)
        host.view.frame = view.bounds
        host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(host.view)
        host.didMove(toParent: self)

        let items = extensionContext?.inputItems.compactMap { $0 as? NSExtensionItem } ?? []
        Task { await model.load(items) }
    }

    /// Extensions cannot reach UIApplication.shared; the application is still
    /// up the responder chain, and opening our own scheme brings TREK forward.
    /// Should that ever fail, the app picks the item up the next time it opens.
    private func openApp() {
        guard let url = URL(string: "com.liketrek.trek://share") else { return }
        var responder: UIResponder? = self
        while let current = responder {
            if let application = current as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                return
            }
            responder = current.next
        }
    }
}

@MainActor
final class ShareModel: ObservableObject {
    enum Phase: Equatable {
        case loading
        case ready
        case saving
        case done
        case failed(String)
    }

    @Published var phase: Phase = .loading
    @Published var item: ShareItem?
    @Published var trips: [ShareHandoff.Trip] = []
    /// nil: the app asks which trip once it is open.
    @Published var selectedTrip: Int?

    var onCancel: () -> Void = {}
    var onDone: () -> Void = {}

    func load(_ items: [NSExtensionItem]) async {
        trips = ShareHandoff.trips()
        selectedTrip = trips.first?.id
        do {
            item = try await ShareLoader.load(items)
            phase = .ready
        } catch ShareLoadError.tooLarge {
            phase = .failed(L("share.tooLarge"))
        } catch {
            phase = .failed(L("share.unsupported"))
        }
    }

    func add() {
        guard let item, phase == .ready else { return }
        phase = .saving
        let haptics = UINotificationFeedbackGenerator()
        haptics.prepare()
        Task {
            guard ShareHandoff.store(item, tripId: selectedTrip) else {
                haptics.notificationOccurred(.error)
                phase = .failed(L("share.failed"))
                return
            }
            haptics.notificationOccurred(.success)
            withAnimation(.spring(response: 0.42, dampingFraction: 0.72)) { phase = .done }
            try? await Task.sleep(nanoseconds: 900_000_000)
            onDone()
        }
    }

    var selectedTitle: String? {
        trips.first { $0.id == selectedTrip }?.title
    }
}

/// The extension's own strings (ShareExtension/<lang>.lproj/Localizable.strings).
func L(_ key: String) -> String {
    NSLocalizedString(key, comment: "")
}
