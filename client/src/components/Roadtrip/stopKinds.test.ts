import { describe, it, expect } from 'vitest'
import { roadtripStopTypeSchema } from '@trek/shared'
import { SERVICE_STOP_TYPES, SERVICE_COLORS } from './roadtripModel'
import { STOP_KINDS, STOP_KIND_BY_KEY, CORRIDOR_CATEGORY_KEYS, SERVICE_KIND_KEYS, REFUELLING_STOP_TYPES } from './stopKinds'

/**
 * The table exists to stop nine lists from drifting apart, and these are the assertions
 * that make that true rather than intended. Each one pins the table against a list that
 * cannot import it: the Zod enum lives in `@trek/shared` and must not depend on the
 * client, and `SERVICE_STOP_TYPES` lives in the React-free model.
 */
describe('stop kinds', () => {
  it('FE-STOPKIND-001: covers exactly the kinds the shared enum allows', () => {
    const fromSchema = [...roadtripStopTypeSchema.options].sort()
    const fromTable = STOP_KINDS.map(k => k.key).sort()
    expect(fromTable).toEqual(fromSchema)
  })

  it('FE-STOPKIND-002: agrees with the model about which kinds interrupt a drive', () => {
    expect([...SERVICE_KIND_KEYS].sort()).toEqual([...SERVICE_STOP_TYPES].sort())
  })

  it('FE-STOPKIND-003: every kind carries the colour the model gives it', () => {
    for (const kind of STOP_KINDS) expect(kind.color).toBe(SERVICE_COLORS[kind.key])
  })

  it('FE-STOPKIND-004: a refuelling kind is a kind, so a range budget cannot reset on a typo', () => {
    for (const key of REFUELLING_STOP_TYPES) expect(STOP_KIND_BY_KEY[key]).toBeDefined()
  })

  it('FE-STOPKIND-005: the corridor offers every category in a stable order', () => {
    expect(CORRIDOR_CATEGORY_KEYS).toEqual(['fuel', 'charging', 'rest_area', 'campsite', 'restaurant', 'sights'])
  })

  it('FE-STOPKIND-006: two kinds are named under a key of their own, and that is on purpose', () => {
    // Spelled out rather than derived: the corridor calls a rest area rest_area and names
    // it under rest, a restaurant restaurant and names it under food. A derived label key
    // would silently ask for two translations that do not exist.
    expect(STOP_KIND_BY_KEY.rest_area.labelKey).toBe('roadtrip.poi.rest')
    expect(STOP_KIND_BY_KEY.restaurant.labelKey).toBe('roadtrip.poi.food')
    for (const kind of STOP_KINDS) {
      if (kind.key !== 'rest_area' && kind.key !== 'restaurant') {
        expect(kind.labelKey).toBe(`roadtrip.poi.${kind.key}`)
      }
    }
  })

  it('FE-STOPKIND-007: every kind offers a dwell the popup can pre-fill', () => {
    for (const kind of STOP_KINDS) {
      expect(kind.defaultMinutes).toBeGreaterThan(0)
      expect(Number.isInteger(kind.defaultMinutes)).toBe(true)
    }
  })
})
