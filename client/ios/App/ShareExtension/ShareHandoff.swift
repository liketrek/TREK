import Foundation
import Security

/// The trips the share sheet offers, and the hand-over of the shared item to the
/// app. Both go through the keychain group the app and its extensions share
/// (TrekSharedKeychain in the app): the app keeps its trip list there for the
/// widgets already, and the app reads the item back the moment it opens
/// (TrekSharedFiles.receiveFromShareExtension).
enum ShareHandoff {
    private static let service = "com.liketrek.trek.push"
    static let metaAccount = "share.pending.meta"
    static let dataAccount = "share.pending.data"

    struct Trip: Identifiable, Equatable {
        var id: Int
        var title: String
        var start: Date?
        var end: Date?
        var place: String?
        /// A small cover photo, from the trip's widget snapshot when the app wrote one.
        var cover: Data?
    }

    private struct TripRef: Decodable {
        var id: Int
        var title: String
        var start: String
        var end: String
    }

    private struct Snapshot: Decodable {
        struct Trip: Decodable {
            var place: String?
            var cover: String?
        }
        var trip: Trip?
    }

    /// The trips that have not ended yet, soonest first, then the most recent past ones.
    static func trips(now: Date = Date()) -> [Trip] {
        guard let raw = read("widget.trips"), let refs = try? JSONDecoder().decode([TripRef].self, from: raw) else { return [] }
        let today = Calendar.current.startOfDay(for: now)
        let all = refs.map { ref -> Trip in
            let snapshot = read("widget.trip.\(ref.id)").flatMap { try? JSONDecoder().decode(Snapshot.self, from: $0) }
            return Trip(id: ref.id, title: ref.title, start: day(ref.start), end: day(ref.end),
                        place: snapshot?.trip?.place, cover: snapshot?.trip?.cover.flatMap { Data(base64Encoded: $0) })
        }
        let ahead = all.filter { ($0.end ?? .distantFuture) >= today }.sorted { ($0.start ?? .distantFuture) < ($1.start ?? .distantFuture) }
        let past = all.filter { ($0.end ?? .distantFuture) < today }.sorted { ($0.end ?? .distantPast) > ($1.end ?? .distantPast) }
        return ahead + past.prefix(6)
    }

    /// Leaves the item for the app, with the trip it goes to (nil: the app asks).
    static func store(_ item: ShareItem, tripId: Int?) -> Bool {
        var meta: [String: Any] = ["name": item.name, "mimeType": item.mimeType]
        if let tripId { meta["tripId"] = tripId }
        if let url = item.url {
            meta["url"] = url
            meta["title"] = item.title
        }
        guard let metaData = try? JSONSerialization.data(withJSONObject: meta) else { return false }
        return write(dataAccount, item.data) && write(metaAccount, metaData)
    }

    private static func day(_ iso: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: String(iso.prefix(10)))
    }

    // The default access group is the first one in the entitlement, the shared one.
    private static func query(_ account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    private static func read(_ account: String) -> Data? {
        var q = query(account)
        q[kSecReturnData as String] = true
        var result: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess else { return nil }
        return result as? Data
    }

    private static func write(_ account: String, _ data: Data) -> Bool {
        SecItemDelete(query(account) as CFDictionary)
        var q = query(account)
        q[kSecValueData as String] = data
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }
}
