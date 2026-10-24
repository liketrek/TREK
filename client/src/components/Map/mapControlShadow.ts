import type { CSSProperties } from 'react'

/**
 * The drop shadow every floating map control carries.
 *
 * Tighter and darker than `--sidebar-shadow`, which is built for a panel resting on
 * the app background: over map tiles its 0.10 alpha spread over 32px all but
 * disappears, so a round control read as painted onto the map rather than floating
 * above it. This is the locate button's shadow, which was always the odd one out for
 * exactly that reason — the others were the ones that needed to match it.
 */
export const MAP_CONTROL_SHADOW = '0 2px 10px rgba(0,0,0,0.25)'

/** The frosted glass of the map's floating cards (a ferrata's, a paddle obstacle's), so they read as its controls. */
export const MAP_CARD_GLASS = {
  background: 'var(--sidebar-bg)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: MAP_CONTROL_SHADOW,
}

/** The frosted round shell the map's control groups sit in. */
export const FROSTED_SHELL = {
  display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999, pointerEvents: 'auto' as const,
  background: 'var(--sidebar-bg)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: MAP_CONTROL_SHADOW,
}

/** A pill segment of a map control group; `filled` lets its class paint the background. */
export const segmentStyle = (filled: boolean): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  minHeight: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
  background: filled ? undefined : 'transparent', padding: '0 10px',
  fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600,
})
