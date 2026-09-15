import { describe, it, expect } from 'vitest'
import { dayColor } from './dayColors'

describe('dayColor', () => {
  it('FE-DAYCOLORS-001: day one is the blue the route has always been', () => {
    // So a one-day trip looks exactly as it did before colouring by day existed.
    expect(dayColor(1).line).toBe('#0a84ff')
  })

  it('FE-DAYCOLORS-002: consecutive days differ', () => {
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(n => dayColor(n).line))
    expect(seen.size).toBe(8)
  })

  it('FE-DAYCOLORS-003: the ninth day starts the palette again', () => {
    expect(dayColor(9)).toEqual(dayColor(1))
    expect(dayColor(17)).toEqual(dayColor(1))
  })

  it('FE-DAYCOLORS-004: the casing is its own colour, not the core', () => {
    // A single fixed casing went muddy under the warm colours, which is why each entry
    // carries a darkened hue of its own.
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(dayColor(n).casing).not.toBe(dayColor(n).line)
    }
  })

  it('FE-DAYCOLORS-005: a missing or nonsensical day still draws something', () => {
    // A day number is read off data, and a route with no colour at all draws nothing.
    expect(dayColor(0)).toEqual(dayColor(1))
    expect(dayColor(-3)).toEqual(dayColor(1))
    expect(dayColor(Number.NaN)).toEqual(dayColor(1))
  })
})
