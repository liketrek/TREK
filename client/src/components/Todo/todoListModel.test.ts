// FE-W4TDM-001 to FE-W4TDM-006
import { describe, it, expect } from 'vitest'
import { KAT_COLORS, PRIO_CONFIG, katColor } from './todoListModel'

describe('katColor', () => {
  it('FE-W4TDM-001: gives a known category the palette colour at its index', () => {
    const cats = ['Docs', 'Gear', 'Food']

    expect(katColor('Docs', cats)).toBe(KAT_COLORS[0])
    expect(katColor('Gear', cats)).toBe(KAT_COLORS[1])
    expect(katColor('Food', cats)).toBe(KAT_COLORS[2])
  })

  it('FE-W4TDM-002: wraps around when there are more categories than colours', () => {
    const cats = Array.from({ length: 12 }, (_, i) => `c${i}`)

    expect(katColor('c10', cats)).toBe(KAT_COLORS[0])
    expect(katColor('c11', cats)).toBe(KAT_COLORS[1])
  })

  it('FE-W4TDM-003: hashes an unlisted category into the palette', () => {
    const color = katColor('Ad-hoc', [])

    expect(KAT_COLORS).toContain(color)
    expect(katColor('Ad-hoc', [])).toBe(color)
  })

  it('FE-W4TDM-004: gives different unlisted categories different colours', () => {
    const seen = new Set(['Alpha', 'Bravo', 'Charlie', 'Delta'].map(c => katColor(c, [])))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('FE-W4TDM-005: handles an empty category name without going out of range', () => {
    expect(KAT_COLORS).toContain(katColor('', []))
  })
})

describe('PRIO_CONFIG', () => {
  it('FE-W4TDM-006: maps the three priorities to labels and colours', () => {
    expect(PRIO_CONFIG[1]).toEqual({ label: 'P1', color: '#ef4444' })
    expect(PRIO_CONFIG[2].label).toBe('P2')
    expect(PRIO_CONFIG[3].label).toBe('P3')
    expect(PRIO_CONFIG[4]).toBeUndefined()
    expect(KAT_COLORS).toHaveLength(10)
  })
})
