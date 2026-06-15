/**
 * Ask the browser for persistent storage so our offline data — prefetched map
 * tiles, cached file blobs, the IndexedDB caches — is exempt from eviction under
 * storage pressure. Without this the browser may purge tiles right when a
 * traveler goes offline and needs them (audit H8 / M6).
 *
 * Best-effort and idempotent: returns whether persistence is (now) granted.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
    // Already persisted? Avoid re-prompting where the API distinguishes.
    if (navigator.storage.persisted && (await navigator.storage.persisted())) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
