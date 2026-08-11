import { describe, it, expect } from 'vitest'
import { noteSurface } from './noteSurface'

describe('noteSurface', () => {
  it('FE-NOTESURFACE-001: no colour keeps the neutral card the notes have always had', () => {
    const s = noteSurface(null)
    expect(s.background).toBe('var(--bg-hover)')
    expect(s.iconColor).toBe('var(--text-muted)')
    // Nothing colour-derived leaks in: the neutral card must survive a theme swap.
    expect(Object.values(s).every(v => !v.includes('color-mix'))).toBe(true)
  })

  it('FE-NOTESURFACE-002: empty string and undefined are "no colour", not a broken mix', () => {
    expect(noteSurface('')).toEqual(noteSurface(null))
    expect(noteSurface(undefined)).toEqual(noteSurface(null))
  })

  it('FE-NOTESURFACE-003: a colour tints the card and fills the icon with the colour itself', () => {
    const s = noteSurface('#dc2626')
    expect(s.iconColor).toBe('#dc2626')
    // Mixed against transparent, not against a fixed white or grey — the card
    // has to sit on whatever surface it lands on, in either theme.
    expect(s.background).toBe('color-mix(in srgb, #dc2626 11%, transparent)')
    expect(s.border).toBe('color-mix(in srgb, #dc2626 38%, transparent)')
    expect(s.iconBackground).toBe('color-mix(in srgb, #dc2626 22%, transparent)')
  })

  it('FE-NOTESURFACE-004: the card stays a wash while the icon carries the full colour', () => {
    const s = noteSurface('#2563eb')
    const pct = (v: string) => Number(/(\d+)%/.exec(v)![1])
    // Text is read on top of the background, so it must be the lightest of the three.
    expect(pct(s.background)).toBeLessThan(pct(s.iconBackground))
    expect(pct(s.iconBackground)).toBeLessThan(pct(s.border))
  })
})
