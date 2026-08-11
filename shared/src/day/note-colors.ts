/**
 * Note colour palette (#1629) — shared so the picker, the note card and the PDF
 * hand out the exact same set.
 *
 * These are drawn on UI surfaces rather than on map tiles, which is why they are
 * not TRACK_COLORS: a note is rendered as a tint of its colour behind body text
 * in both themes, so each entry has to stay legible at ~12% opacity on a white
 * card and at ~18% on a dark one. The 500/600 tier does that; the 700s used for
 * tracks go muddy once tinted.
 *
 * The set is small on purpose. A note colour is a label ("watch out", "must
 * see", "booked"), and a palette of twenty makes people pick by hue instead of
 * by meaning. Seven distinct hues, none of them adjacent, plus "no colour" as
 * the default.
 */
export const NOTE_COLORS = [
  '#dc2626', // red-600 — warnings
  '#ea580c', // orange-600
  '#d97706', // amber-600
  '#16a34a', // green-600 — done, confirmed
  '#0891b2', // cyan-600
  '#2563eb', // blue-600 — information
  '#9333ea', // purple-600
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

/** True for a value the palette actually offers, or for "no colour at all". */
export function isNoteColor(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  return typeof value === 'string' && (NOTE_COLORS as readonly string[]).includes(value);
}
