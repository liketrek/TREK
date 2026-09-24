/**
 * Ids for the things a book is made of.
 *
 * Every panel that places an element mints one, and they were four copies of
 * the same line: a prefix, `Math.random().toString(36)` and a slice. Copies of
 * a line drift, and this one had already drifted in its slice length.
 *
 * `getRandomValues` rather than `Math.random`, for the reason
 * `utils/randomId.ts` gives at greater length: TREK's own quickstart is plain
 * http on a LAN address, where `crypto.randomUUID` is undefined but
 * `getRandomValues` still works. A book document is shared over a websocket and
 * merged by whoever saves last, so two editors minting the same id for two
 * different elements is a collision that shows up as one of them losing their
 * work. Short of Web Crypto entirely, the old arithmetic is still there.
 *
 * Seven characters, as before: 36^7 is about 78 billion, against a document
 * that holds a few hundred elements.
 */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function elementId(prefix: string): string {
  const c = globalThis.crypto
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(7)
    c.getRandomValues(bytes)
    let out = ''
    for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
    return `${prefix}-${out}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
