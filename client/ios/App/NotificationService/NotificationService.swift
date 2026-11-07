import CryptoKit
import Security
import UserNotifications

/// Decrypts a TREK push before iOS shows it.
///
/// The user's server encrypts each notification for this device exactly as Web
/// Push does for a browser (RFC 8291, aes128gcm), and liketrek's relay hands the
/// ciphertext to APNs as `enc`, with a placeholder text and mutable-content set.
/// Here the device's keys (the app made them, TrekPushKeys in the app target)
/// open it, and the real title, text and link replace the placeholder. Without
/// the keys, or if anything does not add up, the placeholder stays: a
/// notification arrives either way, and nothing on the way could read it.
final class NotificationService: UNNotificationServiceExtension {
    private var contentHandler: ((UNNotificationContent) -> Void)?
    private var content: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        let content = (request.content.mutableCopy() as? UNMutableNotificationContent) ?? UNMutableNotificationContent()
        self.content = content
        if let encoded = request.content.userInfo["enc"] as? String,
           let record = Data(base64Encoded: encoded),
           let keys = PushKeys.load(),
           let plaintext = WebPushRecord.open(record, keys: keys),
           let payload = try? JSONSerialization.jsonObject(with: plaintext) as? [String: Any] {
            if let title = payload["title"] as? String, !title.isEmpty { content.title = title }
            if let body = payload["body"] as? String { content.body = body }
            if let url = payload["url"] as? String { content.userInfo["url"] = url }
            if let tag = payload["tag"] as? String { content.threadIdentifier = tag }
        }
        contentHandler(content)
    }

    override func serviceExtensionTimeWillExpire() {
        if let contentHandler, let content { contentHandler(content) }
    }
}

/// The device's Web Push keys, from the keychain group it shares with the app.
struct PushKeys {
    let privateKey: P256.KeyAgreement.PrivateKey
    let auth: Data

    static func load() -> PushKeys? {
        guard let raw = read("push.privateKey"), let auth = read("push.auth"),
              let key = try? P256.KeyAgreement.PrivateKey(rawRepresentation: raw) else { return nil }
        return PushKeys(privateKey: key, auth: auth)
    }

    private static func read(_ account: String) -> Data? {
        // No access group named: the extension's first keychain group is the
        // shared one (its entitlements list only that), where the app stored them.
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.liketrek.trek.push",
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
        ]
        var result: CFTypeRef?
        return SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess ? result as? Data : nil
    }
}

/// One aes128gcm record (RFC 8188) with Web Push keys (RFC 8291), opened.
enum WebPushRecord {
    static func open(_ record: Data, keys: PushKeys) -> Data? {
        let bytes = [UInt8](record)
        // salt (16) | record size (4) | key id length (1) | key id (the sender's public key)
        guard bytes.count > 21 else { return nil }
        let salt = Data(bytes[0..<16])
        let idLength = Int(bytes[20])
        guard bytes.count > 21 + idLength + 16 else { return nil }
        let senderKeyBytes = Data(bytes[21..<(21 + idLength)])
        let ciphertext = Data(bytes[(21 + idLength)...])

        guard let senderKey = try? P256.KeyAgreement.PublicKey(x963Representation: senderKeyBytes),
              let shared = try? keys.privateKey.sharedSecretFromKeyAgreement(with: senderKey) else { return nil }
        let sharedBytes = shared.withUnsafeBytes { Data($0) }
        let receiverKey = keys.privateKey.publicKey.x963Representation

        // IKM = HKDF(auth, ecdh, "WebPush: info" 0 receiver sender, 32)
        var keyInfo = Data("WebPush: info".utf8)
        keyInfo.append(0)
        keyInfo.append(receiverKey)
        keyInfo.append(senderKeyBytes)
        let prkKey = HKDF<SHA256>.extract(inputKeyMaterial: SymmetricKey(data: sharedBytes), salt: keys.auth)
        let ikm = HKDF<SHA256>.expand(pseudoRandomKey: prkKey, info: keyInfo, outputByteCount: 32)

        let prk = HKDF<SHA256>.extract(inputKeyMaterial: ikm, salt: salt)
        var cekInfo = Data("Content-Encoding: aes128gcm".utf8)
        cekInfo.append(0)
        var nonceInfo = Data("Content-Encoding: nonce".utf8)
        nonceInfo.append(0)
        let cek = HKDF<SHA256>.expand(pseudoRandomKey: prk, info: cekInfo, outputByteCount: 16)
        let nonceKey = HKDF<SHA256>.expand(pseudoRandomKey: prk, info: nonceInfo, outputByteCount: 12)
        let nonceBytes = nonceKey.withUnsafeBytes { Data($0) }

        guard let nonce = try? AES.GCM.Nonce(data: nonceBytes),
              let box = try? AES.GCM.SealedBox(nonce: nonce, ciphertext: ciphertext.dropLast(16), tag: ciphertext.suffix(16)),
              let padded = try? AES.GCM.open(box, using: cek) else { return nil }

        // The last record ends in 0x02 and optional zero padding.
        var end = padded.count
        while end > 0 && padded[padded.startIndex + end - 1] == 0 { end -= 1 }
        guard end > 0, padded[padded.startIndex + end - 1] == 2 else { return nil }
        return padded.prefix(end - 1)
    }
}
