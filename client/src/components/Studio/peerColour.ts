/**
 * A colour per person, derived rather than stored.
 *
 * The same colour in everybody's window and the same colour tomorrow, with
 * nothing written down and nothing to allocate. Two people can collide on a
 * palette of eight, which is why the name rides along on the pointer's label.
 *
 * Its own file because PeerCursors.tsx exports components: a module that mixes
 * the two breaks React Fast Refresh, and the pointers are exactly the kind of
 * thing you edit while looking at them. Same reason bookRender.ts sits beside
 * SpreadView.tsx.
 */

/** Distinct at a glance, and white type is legible on every one. */
const PEER_COLOURS = [
  '#2563eb', '#c2410c', '#059669', '#7c3aed',
  '#db2777', '#0891b2', '#a16207', '#4f46e5',
] // theme-lint-disable — identity colours, not app chrome

export function peerColour(userId: number): string {
  return PEER_COLOURS[Math.abs(userId) % PEER_COLOURS.length]
}
