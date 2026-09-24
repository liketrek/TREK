import AuthenticationServices
import Capacitor
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
    ]

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
        guard let raw = TrekServerStore.url, let url = URL(string: raw),
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
