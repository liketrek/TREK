import Foundation
import Security
import UIKit
import UniformTypeIdentifiers

/// The client certificate a user's TREK server asks for (mutual TLS): a proxy
/// such as Cloudflare, nginx, Caddy or Traefik in front of TREK lets through
/// only devices that show one. The app holds at most one, for one server.
///
/// It comes in as a PKCS#12 file (.p12, .pfx) and its password. The password is
/// never kept; the identity goes into the keychain, this device only, readable
/// after the first unlock (so a background refresh can show it too). Only the
/// host and port it was imported for ever see it (`identity(forHost:port:)`), so a
/// sign-in page, a map tile provider or liketrek.com never learns of it.
enum TrekClientIdentity {
    private static let label = "trek-client-identity"
    private static let hostKey = "TrekClientIdentityHost"
    private static let portKey = "TrekClientIdentityPort"

    enum Failure: String, Error {
        case password, format, noKey = "no_key", expired, notYetValid = "not_yet_valid", store
    }

    /// The last server that asked for a certificate while the app ran, and whether it got one.
    struct Request {
        let host: String
        let port: Int
        let served: Bool
    }

    private static let lock = NSLock()
    private static var _lastRequest: Request?
    static var lastRequest: Request? {
        lock.lock(); defer { lock.unlock() }
        return _lastRequest
    }

    static func noteRequest(host: String, port: Int, served: Bool) {
        lock.lock(); defer { lock.unlock() }
        _lastRequest = Request(host: host.lowercased(), port: port > 0 ? port : 443, served: served)
    }

    // MARK: Reading a file

    /// Opens a PKCS#12 file: the identity and the rest of its chain.
    static func read(_ data: Data, password: String, now: Date = Date()) -> Result<(SecIdentity, [SecCertificate]), Failure> {
        var items: CFArray?
        let status = SecPKCS12Import(data as CFData, [kSecImportExportPassphrase as String: password] as CFDictionary, &items)
        switch status {
        case errSecSuccess: break
        case errSecAuthFailed, errSecPkcs12VerifyFailure: return .failure(.password)
        default: return .failure(.format)
        }
        guard let first = (items as? [[String: Any]])?.first,
              let value = first[kSecImportItemIdentity as String] else { return .failure(.noKey) }
        let identity = value as! SecIdentity
        var leaf: SecCertificate?
        guard SecIdentityCopyCertificate(identity, &leaf) == errSecSuccess, let leaf else { return .failure(.noKey) }
        if let validity = validity(of: leaf) {
            if now > validity.notAfter { return .failure(.expired) }
            if now < validity.notBefore { return .failure(.notYetValid) }
        }
        let leafData = SecCertificateCopyData(leaf) as Data
        let chain = (first[kSecImportItemCertChain as String] as? [SecCertificate] ?? []).filter {
            SecCertificateCopyData($0) as Data != leafData
        }
        return .success((identity, chain))
    }

    // MARK: Keeping it

    /// Keeps the identity for this host and port, replacing any other.
    static func save(_ identity: SecIdentity, chain: [SecCertificate], host: String, port: Int) -> Bool {
        remove()
        let query: [String: Any] = [
            kSecValueRef as String: identity,
            kSecAttrLabel as String: label,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else { return false }
        // The chain's intermediates go along so a proxy that wants them gets them.
        let encoded = chain.map { SecCertificateCopyData($0) as Data }
        UserDefaults.standard.set(encoded, forKey: chainKey)
        UserDefaults.standard.set(host.lowercased(), forKey: hostKey)
        UserDefaults.standard.set(port, forKey: portKey)
        return true
    }

    private static let chainKey = "TrekClientIdentityChain"

    static func remove() {
        TrekClientCertWatch.reset()
        for itemClass in [kSecClassIdentity, kSecClassCertificate, kSecClassKey] {
            SecItemDelete([kSecClass as String: itemClass, kSecAttrLabel as String: label] as CFDictionary)
        }
        UserDefaults.standard.removeObject(forKey: hostKey)
        UserDefaults.standard.removeObject(forKey: portKey)
        UserDefaults.standard.removeObject(forKey: chainKey)
    }

    private static func storedIdentity() -> SecIdentity? {
        var item: CFTypeRef?
        let query: [String: Any] = [
            kSecClass as String: kSecClassIdentity,
            kSecAttrLabel as String: label,
            kSecReturnRef as String: true,
        ]
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let item else { return nil }
        return (item as! SecIdentity)
    }

    /// Whether a request to host and port (0 or less for https' default) goes to the server the identity is for.
    static func matches(host: String?, port: Int) -> Bool {
        guard let host, let stored = UserDefaults.standard.string(forKey: hostKey) else { return false }
        let storedPort = UserDefaults.standard.integer(forKey: portKey)
        return host.lowercased() == stored && (port > 0 ? port : 443) == (storedPort > 0 ? storedPort : 443)
    }

    /// The credential for a server at host and port, or nil when the stored one is for another.
    static func credential(forHost host: String, port: Int) -> URLCredential? {
        guard matches(host: host, port: port), let identity = storedIdentity() else { return nil }
        let chain = (UserDefaults.standard.array(forKey: chainKey) as? [Data] ?? []).compactMap {
            SecCertificateCreateWithData(nil, $0 as CFData)
        }
        // Per session: a replaced certificate takes effect on the next connection.
        return URLCredential(identity: identity, certificates: chain.isEmpty ? nil : chain, persistence: .forSession)
    }

    /// Answers a challenge if it asks for a client certificate; false leaves it to the caller.
    static func answer(_ challenge: URLAuthenticationChallenge, _ completion: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) -> Bool {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodClientCertificate else { return false }
        let space = challenge.protectionSpace
        let credential = credential(forHost: space.host, port: space.port)
        noteRequest(host: space.host, port: space.port, served: credential != nil)
        if let credential {
            completion(.useCredential, credential)
        } else {
            // As a browser without a matching certificate: go on without one.
            completion(.performDefaultHandling, nil)
        }
        return true
    }

    // MARK: What the settings show

    static func info() -> [String: Any]? {
        guard let host = UserDefaults.standard.string(forKey: hostKey), let identity = storedIdentity() else { return nil }
        var leaf: SecCertificate?
        guard SecIdentityCopyCertificate(identity, &leaf) == errSecSuccess, let leaf else { return nil }
        let port = UserDefaults.standard.integer(forKey: portKey)
        var result: [String: Any] = [
            "host": host,
            "port": port > 0 ? port : 443,
            "subject": SecCertificateCopySubjectSummary(leaf) as String? ?? "",
            "issuer": issuerName(of: leaf) ?? "",
        ]
        if let validity = validity(of: leaf) { result["notAfter"] = Int(validity.notAfter.timeIntervalSince1970 * 1000) }
        return result
    }

    // MARK: Certificate fields

    /// notBefore and notAfter from the DER: iOS has no public API for them.
    static func validity(of certificate: SecCertificate) -> (notBefore: Date, notAfter: Date)? {
        DER.validity(SecCertificateCopyData(certificate) as Data)
    }

    private static func issuerName(of certificate: SecCertificate) -> String? {
        DER.issuerCommonName(SecCertificateCopyData(certificate) as Data)
    }

    /// Just enough DER to read an X.509 certificate's validity and a name's CN.
    enum DER {
        private struct Node {
            let tag: UInt8
            let body: Range<Int>
            let end: Int
        }

        private static func node(_ bytes: [UInt8], at offset: Int) -> Node? {
            guard offset + 2 <= bytes.count else { return nil }
            let tag = bytes[offset]
            var length = Int(bytes[offset + 1])
            var start = offset + 2
            if length & 0x80 != 0 {
                let count = length & 0x7f
                guard count > 0, count <= 4, start + count <= bytes.count else { return nil }
                length = bytes[start..<start + count].reduce(0) { $0 << 8 | Int($1) }
                start += count
            }
            guard start + length <= bytes.count else { return nil }
            return Node(tag: tag, body: start..<start + length, end: start + length)
        }

        private static func children(_ bytes: [UInt8], in range: Range<Int>) -> [Node] {
            var result: [Node] = []
            var offset = range.lowerBound
            while offset < range.upperBound, let child = node(bytes, at: offset) {
                result.append(child)
                offset = child.end
            }
            return result
        }

        /// The fields of the TBSCertificate after the version: serial, signature algorithm, issuer, validity, ...
        private static func tbsFields(_ bytes: [UInt8]) -> [Node]? {
            guard let certificate = node(bytes, at: 0), let tbs = children(bytes, in: certificate.body).first else { return nil }
            var fields = children(bytes, in: tbs.body)
            if fields.first?.tag == 0xa0 { fields.removeFirst() }
            return fields.count > 3 ? fields : nil
        }

        static func validity(_ data: Data) -> (notBefore: Date, notAfter: Date)? {
            let bytes = [UInt8](data)
            guard let fields = tbsFields(bytes) else { return nil }
            let times = children(bytes, in: fields[3].body)
            guard times.count == 2, let from = time(bytes, times[0]), let to = time(bytes, times[1]) else { return nil }
            return (from, to)
        }

        private static func time(_ bytes: [UInt8], _ node: Node) -> Date? {
            guard let text = String(bytes: bytes[node.body], encoding: .ascii) else { return nil }
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone(identifier: "UTC")
            formatter.dateFormat = node.tag == 0x17 ? "yyMMddHHmmss'Z'" : "yyyyMMddHHmmss'Z'"
            return formatter.date(from: text)
        }

        /// The CN of the issuer's Name (a SEQUENCE of SETs of type and value), or nil.
        static func issuerCommonName(_ data: Data) -> String? {
            let bytes = [UInt8](data)
            guard let fields = tbsFields(bytes) else { return nil }
            for set in children(bytes, in: fields[2].body) {
                for pair in children(bytes, in: set.body) {
                    let parts = children(bytes, in: pair.body)
                    guard parts.count == 2, Array(bytes[parts[0].body]) == [0x55, 0x04, 0x03] else { continue }
                    return String(bytes: bytes[parts[1].body], encoding: .utf8)
                }
            }
            return nil
        }
    }
}

/// Notices when the user's server stops letting the app in for want of a
/// client certificate (one removed, expired, or no longer trusted). The page can
/// still be the stored offline copy while every request fails, so when the server
/// asks for a certificate the app checks once natively whether TREK answers with
/// what it holds. Only a check that fails at the certificate (the handshake broke
/// off, or the proxy's own 4xx) calls `onRefused`; a server that merely asks and
/// lets everyone in answers TREK's 200. At most once a minute.
enum TrekClientCertWatch {
    private static let lock = NSLock()
    private static var lastCheck = Date.distantPast

    /// A new or removed certificate is worth a check of its own, whenever the last one ran.
    static func reset() {
        lock.lock(); defer { lock.unlock() }
        lastCheck = .distantPast
    }

    static func serverAsked(host: String, port: Int, onRefused: @escaping () -> Void) {
        guard let raw = TrekServerStore.url, let server = URL(string: raw), server.scheme == "https",
              server.host?.lowercased() == host.lowercased(), (server.port ?? 443) == (port > 0 ? port : 443),
              let features = URL(string: raw.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/api/health/features") else { return }
        lock.lock()
        let due = Date().timeIntervalSince(lastCheck) >= 60
        if due { lastCheck = Date() }
        lock.unlock()
        guard due else { return }
        var request = URLRequest(url: features, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 8)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        var task: URLSessionDataTask?
        task = TrekClientCertSessionDelegate.session.dataTask(with: request) { _, response, _ in
            let asked = task.flatMap { TrekClientCertSessionDelegate.shared.ask(for: $0) } != nil
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if asked && (status == 0 || (400..<500).contains(status)) {
                DispatchQueue.main.async(execute: onRefused)
            }
        }
        task?.resume()
    }
}

/// A URLSession delegate for the app's own requests to the user's server: it
/// shows the client certificate where the server asks for it and notes the ask.
final class TrekClientCertSessionDelegate: NSObject, URLSessionTaskDelegate {
    static let shared = TrekClientCertSessionDelegate()

    /// The app's session for the user's server (offline copy, watch, address check).
    static let session = URLSession(configuration: .default, delegate: shared, delegateQueue: nil)

    /// Per task: whether the server asked, and whether it got a certificate (address check only).
    private let lock = NSLock()
    private var asks: [Int: Bool] = [:]

    func ask(for task: URLSessionTask) -> Bool? {
        lock.lock(); defer { lock.unlock() }
        return asks.removeValue(forKey: task.taskIdentifier)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        let handled = TrekClientIdentity.answer(challenge) { disposition, credential in
            self.lock.lock()
            self.asks[task.taskIdentifier] = credential != nil
            self.lock.unlock()
            completionHandler(disposition, credential)
        }
        if !handled { completionHandler(.performDefaultHandling, nil) }
    }
}

/// The file picker and password prompt of an import, in the UI's words.
final class TrekClientCertImporter: NSObject, UIDocumentPickerDelegate {
    private let presenter: UIViewController
    private let labels: [String: String]
    private let host: String
    private let port: Int
    private let done: ([String: Any]) -> Void
    private var keepAlive: TrekClientCertImporter?

    init(presenter: UIViewController, labels: [String: String], host: String, port: Int, done: @escaping ([String: Any]) -> Void) {
        self.presenter = presenter
        self.labels = labels
        self.host = host
        self.port = port
        self.done = done
    }

    func start() {
        keepAlive = self
        let types = [UTType(filenameExtension: "p12"), UTType(filenameExtension: "pfx"), UTType("com.rsa.pkcs-12")].compactMap { $0 }
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types.isEmpty ? [.data] : types, asCopy: true)
        picker.delegate = self
        presenter.present(picker, animated: true)
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finish(["result": "cancelled"])
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first,
              let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
              (attributes[.size] as? Int ?? 0) <= 256 * 1024,
              let data = try? Data(contentsOf: url) else {
            finish(["result": "failed", "failure": TrekClientIdentity.Failure.format.rawValue])
            return
        }
        try? FileManager.default.removeItem(at: url)
        askPassword(for: data, wrong: false)
    }

    private func askPassword(for data: Data, wrong: Bool) {
        let alert = UIAlertController(title: labels["title"], message: wrong ? labels["wrongPassword"] : labels["message"], preferredStyle: .alert)
        alert.addTextField { field in
            field.isSecureTextEntry = true
            field.placeholder = self.labels["placeholder"]
            field.textContentType = .password
        }
        alert.addAction(UIAlertAction(title: labels["cancel"] ?? "Cancel", style: .cancel) { _ in
            self.finish(["result": "cancelled"])
        })
        alert.addAction(UIAlertAction(title: labels["ok"] ?? "OK", style: .default) { _ in
            self.open(data, password: alert.textFields?.first?.text ?? "")
        })
        presenter.present(alert, animated: true)
    }

    private func open(_ data: Data, password: String) {
        switch TrekClientIdentity.read(data, password: password) {
        case .failure(.password):
            askPassword(for: data, wrong: true)
        case .failure(let failure):
            finish(["result": "failed", "failure": failure.rawValue])
        case .success(let (identity, chain)):
            guard TrekClientIdentity.save(identity, chain: chain, host: host, port: port) else {
                finish(["result": "failed", "failure": TrekClientIdentity.Failure.store.rawValue])
                return
            }
            var result: [String: Any] = ["result": "imported"]
            if let info = TrekClientIdentity.info() { result["certificate"] = info }
            finish(result)
        }
    }

    private func finish(_ result: [String: Any]) {
        done(result)
        keepAlive = nil
    }
}
