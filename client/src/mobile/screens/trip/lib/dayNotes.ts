/**
 * A day note's `time` column is a free-text detail line whose leading HH:MM
 * (when present) chrono-orders the note in the merged timeline — the same
 * double duty the desktop day plan gives it.
 */
export function splitNoteTime(raw: string | null | undefined): { time: string | null; detail: string } {
  const text = (raw || '').trim()
  const match = text.match(/^([01]?\d|2[0-3]):[0-5]\d/)
  if (!match) return { time: null, detail: text }
  return { time: match[0], detail: text.slice(match[0].length).replace(/^[\s·,;:–—-]+/, '') }
}
