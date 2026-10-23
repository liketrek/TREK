/**
 * Ids for the things a book is made of.
 *
 * Every panel that places an element mints one, and they were four copies of
 * the same line: a prefix, `Math.random().toString(36)` and a slice. Copies of
 * a line drift, and this one had already drifted in its slice length. Moved
 * here from the Studio (client/src/components/Studio/bookIds.ts) so the editor,
 * the layouts and the server's book tools mint them the same way.
 *
 * `getRandomValues` rather than `Math.random`: TREK's own quickstart is plain
 * http on a LAN address, where `crypto.randomUUID` is undefined but
 * `getRandomValues` still works, and every Node TREK supports has it as a
 * global too. A book document is shared over a websocket and merged by whoever
 * saves last, so two editors minting the same id for two different elements is
 * a collision that shows up as one of them losing their work. A runtime without
 * Web Crypto at all (none TREK supports) still gets an id that is unique within
 * its own session, from the clock and a counter.
 *
 * Seven characters, as before: 36^7 is about 78 billion, against a document
 * that holds a few hundred elements.
 */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

interface RandomSource {
  getRandomValues?: (bytes: Uint8Array) => Uint8Array;
}

let fallbackSeq = 0;

export function bookElementId(prefix: string): string {
  const c = (globalThis as { crypto?: RandomSource }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(7);
    c.getRandomValues(bytes);
    let out = '';
    for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
    return `${prefix}-${out}`;
  }
  fallbackSeq += 1;
  return `${prefix}-${(Date.now() * 1000 + fallbackSeq).toString(36).slice(-7)}`;
}
