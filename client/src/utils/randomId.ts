/**
 * The one place idempotency keys are minted.
 *
 * Both producers — the offline queue's mutation id and the axios interceptor's
 * per-request key — end up in the same `X-Idempotency-Key` header, which the
 * server caches on (key, user_id, method, path). Two writes that share a key
 * therefore collapse into one: the second gets the first one's cached response
 * instead of being applied, and the user loses an edit with no error anywhere.
 *
 * `crypto.randomUUID` needs a secure context, and TREK's own quickstart is plain
 * http://localhost:3000 with LAN installs on http://192.168.x.x — so on the
 * deployments the README documents, randomUUID is undefined and the fallback is
 * what actually runs. It has to be a real one. `getRandomValues` has no
 * secure-context requirement and covers that gap; the Math.random rung below it
 * exists only for a runtime with no Web Crypto at all.
 *
 * Lives in its own module rather than next to either caller because
 * sync/mutationQueue imports api/client, so the dependency can only go one way.
 */
export function randomId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    // RFC 4122 version + variant bits, so the value still reads as a v4 UUID.
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // Padded on purpose: `Math.random().toString(36).slice(2)` is not
  // length-stable — 0.5 yields a single character and 0 yields the empty
  // string, which the server reads as "no key" and skips deduplication for.
  const rand = () => Math.random().toString(36).slice(2).padStart(10, '0').slice(0, 10)
  return `${Date.now().toString(36)}-${rand()}-${rand()}`
}
