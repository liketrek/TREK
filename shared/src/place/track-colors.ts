/**
 * Track colour palette (#776) — shared so the importer's automatic assignment
 * and the picker in the UI hand out the exact same set.
 *
 * Tuned against map tiles rather than UI surfaces: the 600 tier survives thin
 * 3.5px lines on light basemaps where 400/500 washes out, and nothing here is
 * a neutral grey (invisible on CartoDB Dark) or a pale pastel (invisible at
 * any size). Blue is deliberately blue-700 — darker than both the #3b82f6 GPX
 * fallback and the #0a84ff day route, so a blue track reads as chosen rather
 * than defaulted.
 *
 * The order matters: the importer assigns these round-robin, so the first five
 * are the ones most tracks get. They follow the Okabe-Ito idea of staying
 * separable under red-green colour blindness (blue, orange, green, magenta,
 * cyan) instead of running through the rainbow and handing out four adjacent
 * warm tones in a row.
 */
export const TRACK_COLORS = [
  '#1d4ed8', // blue-700
  '#ea580c', // orange-600
  '#059669', // emerald-600
  '#c026d3', // fuchsia-600
  '#0891b2', // cyan-600
  '#e11d48', // rose-600
  '#d97706', // amber-600
  '#65a30d', // lime-600
  '#7c3aed', // violet-600
  '#4f46e5', // indigo-600
] as const;

/** Colour a track falls back to when it has neither a manual nor a category colour. */
export const TRACK_COLOR_FALLBACK = '#3b82f6';
