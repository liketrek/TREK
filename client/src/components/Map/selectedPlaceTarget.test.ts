import { describe, expect, it } from 'vitest'
import { selectedPlaceTarget } from './selectedPlaceTarget'

// FE-MAP-SELTARGET-001 to FE-MAP-SELTARGET-004

describe('selectedPlaceTarget', () => {
  const pin = { id: 1, lat: 48, lng: 2 }
  const stop = { id: 2, lat: 49, lng: 3 }
  const stay = { id: 3, lat: 50, lng: 4 }

  it('FE-MAP-SELTARGET-001: goes to the pin the map shows', () => {
    expect(selectedPlaceTarget(1, [pin], [stop], stay)).toBe(pin)
  })

  it('FE-MAP-SELTARGET-002: goes to the open day\'s stop when a filter hides its pin', () => {
    expect(selectedPlaceTarget(2, [pin], [stop], null)).toBe(stop)
  })

  it('FE-MAP-SELTARGET-003: goes to a stay that is neither a pin nor a stop of the day', () => {
    expect(selectedPlaceTarget(3, [pin], [stop], stay)).toBe(stay)
  })

  it('FE-MAP-SELTARGET-004: goes nowhere without a selection, or for a place it does not know', () => {
    expect(selectedPlaceTarget(null, [pin], [stop], stay)).toBeNull()
    expect(selectedPlaceTarget(9, [pin], [stop], stay)).toBeNull()
  })
})
