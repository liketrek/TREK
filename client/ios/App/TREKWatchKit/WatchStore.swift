import Foundation
import Security

/// A packing item or to-do ticked on the watch and not yet confirmed by the
/// phone. It goes to the phone through WatchConnectivity (guaranteed, queued
/// delivery) and stays laid over the snapshot until the phone's next snapshot
/// shows it applied, so a tick never flips back while the phone catches up.
struct PendingAction: Codable, Equatable, Identifiable {
    enum List: String, Codable { case packing, todo }

    var id: String
    var tripId: Int
    var list: List
    var itemId: Int
    var done: Bool
    var at: Date
    /// Set once WatchConnectivity has handed the tick to the phone; such a tick
    /// is never sent again, it only stays laid over the snapshot until confirmed.
    var sent: Bool?

    /// What the phone receives (parseWatchActions in client/src/native/watch.ts).
    var message: [String: Any] {
        ["id": id, "tripId": tripId, "list": list.rawValue, "itemId": itemId, "done": done]
    }
}

/// Where the watch keeps the last snapshot and its pending ticks: the keychain
/// group the watch app shares with its complications (no App Group needed,
/// the same way the phone shares the widget snapshot). Nothing goes to
/// UserDefaults, which the complications could not read anyway.
enum WatchStore {
    private static let service = "com.liketrek.trek.watch"
    private static let snapshotAccount = "watch.snapshot"
    private static let pendingAccount = "watch.pending"

    static func loadSnapshot() -> WatchSnapshot? {
        read(snapshotAccount).flatMap(WatchSnapshot.decode)
    }

    static func saveSnapshot(_ data: Data) {
        write(snapshotAccount, data)
    }

    static func loadPending() -> [PendingAction] {
        guard let data = read(pendingAccount) else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .secondsSince1970
        return (try? decoder.decode([PendingAction].self, from: data)) ?? []
    }

    static func savePending(_ actions: [PendingAction]) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970
        guard let data = try? encoder.encode(actions) else { return }
        write(pendingAccount, data)
    }

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
        return SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess ? result as? Data : nil
    }

    /// Into the first keychain group of the entitlements, the one the complications read.
    @discardableResult
    private static func write(_ account: String, _ data: Data) -> Bool {
        let q = query(account)
        let update = [kSecValueData as String: data] as CFDictionary
        if SecItemUpdate(q as CFDictionary, update) == errSecSuccess { return true }
        var add = q
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
    }
}

extension WatchSnapshot {
    /// The snapshot with the ticks the phone has not confirmed yet laid over it.
    func applying(_ pending: [PendingAction]) -> WatchSnapshot {
        guard !pending.isEmpty, let tripId = trip?.id else { return self }
        var copy = self
        for action in pending where action.tripId == tripId {
            switch action.list {
            case .packing:
                if var packing = copy.packing, let index = packing.items.firstIndex(where: { $0.id == action.itemId }) {
                    if packing.items[index].done != action.done {
                        packing.packed += action.done ? 1 : -1
                        packing.items[index].done = action.done
                    }
                    copy.packing = packing
                }
            case .todo:
                if var todos = copy.todos, let index = todos.items.firstIndex(where: { $0.id == action.itemId }) {
                    if todos.items[index].done != action.done {
                        todos.open += action.done ? -1 : 1
                        todos.items[index].done = action.done
                    }
                    copy.todos = todos
                }
            }
        }
        return copy
    }

    /// The pending ticks still to lay over this snapshot: those the phone has
    /// not applied, whose item does not show the ticked state yet, and that
    /// are less than a day old (someone else may have changed it since).
    func stillPending(_ pending: [PendingAction], now: Date = Date()) -> [PendingAction] {
        pending.filter { action in
            if applied.contains(action.id) || now.timeIntervalSince(action.at) > 86_400 { return false }
            let items = action.list == .packing ? packing?.items : todos?.items
            guard let item = items?.first(where: { $0.id == action.itemId }) else { return false }
            return item.done != action.done
        }
    }
}
