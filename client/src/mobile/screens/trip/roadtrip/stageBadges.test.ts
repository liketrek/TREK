import { describe, expect, it } from 'vitest'
import { badgeLabel, distanceBadge } from './stageBadges'

// FE-MOB-RTBADGE-001 to FE-MOB-RTBADGE-004

describe('distanceBadge', () => {
  it('FE-MOB-RTBADGE-001: formats metres in the traveller\'s own unit', () => {
    expect(distanceBadge(412_000, 'metric')).toBe('412 km')
    expect(distanceBadge(412_000, 'imperial')).toBe('256 mi')
    // A short hop keeps its metres reading, the one the route connectors print.
    expect(distanceBadge(300, 'metric')).toBe('300 m')
  })

  it('FE-MOB-RTBADGE-002: nothing measured is no badge, never a 0 m one', () => {
    expect(distanceBadge(0, 'metric')).toBeNull()
    expect(distanceBadge(-5, 'metric')).toBeNull()
    expect(distanceBadge(Number.NaN, 'metric')).toBeNull()
    expect(distanceBadge(Number.POSITIVE_INFINITY, 'imperial')).toBeNull()
  })
})

describe('badgeLabel', () => {
  it('FE-MOB-RTBADGE-003: joins the parts with a comma and leaves the empty ones out', () => {
    expect(badgeLabel(['Sat 2', null, '', undefined, '123 km'])).toBe('Sat 2, 123 km')
  })

  it('FE-MOB-RTBADGE-004: a single part is itself, and no parts is an empty name', () => {
    expect(badgeLabel(['Sat 2'])).toBe('Sat 2')
    expect(badgeLabel([])).toBe('')
    expect(badgeLabel([null, undefined])).toBe('')
  })
})
