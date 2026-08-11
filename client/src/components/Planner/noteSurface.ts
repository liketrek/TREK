/**
 * The four surfaces a note colour produces (#1629).
 *
 * One place decides how a colour becomes a card, so the preview in the dialog,
 * the card in the day plan and the block in the inspector cannot drift apart.
 *
 * Tints rather than fills: a note sits in a list of places and must not shout
 * louder than the trip itself, and body text has to stay readable on top. The
 * percentages are `color-mix` against `transparent`, so the card picks up
 * whatever surface it is dropped on and works in both themes without a second
 * palette. `currentColor` is deliberately not used — the icon takes the full
 * colour while the card behind it takes a wash of the same hue.
 */
export interface NoteSurface {
  background: string
  border: string
  iconBackground: string
  iconColor: string
}

const NEUTRAL: NoteSurface = {
  background: 'var(--bg-hover)',
  border: 'var(--border-faint)',
  iconBackground: 'var(--bg-hover)',
  iconColor: 'var(--text-muted)',
}

export function noteSurface(color: string | null | undefined): NoteSurface {
  if (!color) return NEUTRAL
  return {
    background: `color-mix(in srgb, ${color} 11%, transparent)`,
    border: `color-mix(in srgb, ${color} 38%, transparent)`,
    iconBackground: `color-mix(in srgb, ${color} 22%, transparent)`,
    iconColor: color,
  }
}
