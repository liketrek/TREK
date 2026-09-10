import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../../store/settingsStore'
import type { Settings } from '../../types'
import { useVehicleRange } from './useVehicleRange'

/**
 * Seven settings assembled into one answer.
 *
 * The arithmetic is pinned next door in vehicleRange.test.ts; what is worth guarding
 * here is the assembly: that an unrecognised word is no vehicle rather than a vehicle
 * nobody can refuel, that every one of the parts really reaches the division, and that
 * a range which rounds away arrives as no limit rather than as a zero one.
 *
 * The identity cases are worth less than they look, and are kept small for that reason.
 * Every reader today destructures the object on the spot, so its reference reaches
 * nothing; what they guard is the day a reader stops doing that.
 */

// setState replaces the settings object wholesale, which is what the hook has to cope
// with anyway: the settings load hands it a new one on every fetch.
function setSettings(over: Partial<Settings>): void {
  act(() => { useSettingsStore.setState({ settings: over as never }) })
}

/** Changes one field and leaves the rest, the way the settings dialog does. */
function changeSetting(over: Partial<Settings>): void {
  act(() => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, ...over } as never }))
  })
}

beforeEach(() => {
  // Wholesale, so nothing a previous case stored can answer for this one.
  useSettingsStore.setState({ settings: {} as never })
})

describe('useVehicleRange', () => {
  it('FE-VEHRANGEHOOK-001: a word the picker never wrote is no vehicle at all', () => {
    // The setting is a free string on the wire and nothing on the server checks it, so a
    // hand-edited value or a leftover from an older picker arrives here as-is. Anything
    // but the two known words has to fall back to "not said", which is the state where a
    // stop of either kind still counts as a fill-up.
    setSettings({ roadtrip_vehicle: 'lorry' })
    expect(renderHook(() => useVehicleRange()).result.current.vehicleKind).toBeNull()

    setSettings({ roadtrip_vehicle: 'Electric' })
    expect(renderHook(() => useVehicleRange()).result.current.vehicleKind).toBeNull()

    setSettings({})
    expect(renderHook(() => useVehicleRange()).result.current.vehicleKind).toBeNull()
  })

  it('FE-VEHRANGEHOOK-002: the two words it does know come back untouched', () => {
    setSettings({ roadtrip_vehicle: 'combustion' })
    expect(renderHook(() => useVehicleRange()).result.current.vehicleKind).toBe('combustion')

    setSettings({ roadtrip_vehicle: 'electric' })
    expect(renderHook(() => useVehicleRange()).result.current.vehicleKind).toBe('electric')
  })

  it('FE-VEHRANGEHOOK-003: a complete pair of parts beats the round number that was typed', () => {
    // 55 litres at 7 per hundred is 786 km, and the traveller who filled both fields said
    // something more exact than "about 500".
    setSettings({
      roadtrip_vehicle: 'combustion',
      roadtrip_tank_litres: 55,
      roadtrip_litres_per_100: 7,
      roadtrip_range_km: 500,
    })

    expect(renderHook(() => useVehicleRange()).result.current.rangeKm).toBe(786)
  })

  it('FE-VEHRANGEHOOK-004: half a specification leaves the typed number standing', () => {
    // Half a pair is not a range, and the typed figure is still a real answer — dropping
    // it here would take the range budget away from somebody who had set one.
    setSettings({
      roadtrip_vehicle: 'combustion',
      roadtrip_tank_litres: 55,
      roadtrip_range_km: 500,
    })

    expect(renderHook(() => useVehicleRange()).result.current.rangeKm).toBe(500)
  })

  it('FE-VEHRANGEHOOK-005: figures left over from the other kind of car are not used', () => {
    // Someone who filled in a tank and then switched the picker to electric still has
    // both petrol fields in their settings. Feeding them to an electric car would hand
    // back a range that has nothing to do with the battery.
    setSettings({
      roadtrip_vehicle: 'electric',
      roadtrip_tank_litres: 55,
      roadtrip_litres_per_100: 7,
      roadtrip_range_km: 500,
    })

    expect(renderHook(() => useVehicleRange()).result.current.rangeKm).toBe(500)
  })

  it('FE-VEHRANGEHOOK-006: the battery figures arrive complete, age included', () => {
    // 58 kWh less a tenth is 52.2, and 52.2 at 16 per hundred is 326 km. Forgetting to
    // forward the degradation would give 363 here, which is a warning that fires 37 km
    // after the car has stopped.
    setSettings({
      roadtrip_vehicle: 'electric',
      roadtrip_battery_kwh: 58,
      roadtrip_kwh_per_100: 16,
      roadtrip_battery_degradation: 10,
    })

    expect(renderHook(() => useVehicleRange()).result.current.rangeKm).toBe(326)
  })

  it('FE-VEHRANGEHOOK-007: an unset or zeroed range is no limit, never a range of nothing', () => {
    // Zero is a legal thing to type into the field and means the same as leaving it
    // empty. Handing a 0 downstream would put the dry point at the first metre and light
    // up every stop on the trip.
    setSettings({ roadtrip_range_km: 0 })
    expect(renderHook(() => useVehicleRange()).result.current.rangeKm).toBeNull()

    setSettings({})
    expect(renderHook(() => useVehicleRange()).result.current.rangeKm).toBeNull()
  })

  it('FE-VEHRANGEHOOK-008: a re-render with nothing changed hands back the same object', () => {
    setSettings({ roadtrip_vehicle: 'combustion', roadtrip_range_km: 500 })
    const { result, rerender } = renderHook(() => useVehicleRange())

    const first = result.current
    rerender()

    // Identity, not equality: the readers put this straight into an effect dependency
    // list, so a new object per render means the whole trip is re-routed per render.
    expect(result.current).toBe(first)
  })

  it('FE-VEHRANGEHOOK-009: a setting this hook does not read causes no churn', () => {
    setSettings({ roadtrip_vehicle: 'combustion', roadtrip_range_km: 500, dark_mode: false })
    const { result } = renderHook(() => useVehicleRange())
    const first = result.current

    // A fresh settings object arrives on every settings load and after every unrelated
    // toggle, and the seven fields are read as primitives so none of that reaches here.
    setSettings({ roadtrip_vehicle: 'combustion', roadtrip_range_km: 500, dark_mode: true })

    expect(result.current).toBe(first)
  })

  it('FE-VEHRANGEHOOK-011: every part of the car reaches the arithmetic while mounted', () => {
    // Each field changed on a hook that is already mounted, which is the only way a
    // missing memo dependency shows itself: mounting afresh recomputes regardless, so a
    // suite built out of fresh mounts passes with half the dependency list deleted.
    setSettings({ roadtrip_vehicle: 'electric', roadtrip_battery_kwh: 58, roadtrip_kwh_per_100: 16 })
    const { result } = renderHook(() => useVehicleRange())
    expect(result.current.rangeKm).toBe(363)

    changeSetting({ roadtrip_battery_kwh: 77 })
    expect(result.current.rangeKm).toBe(481)

    changeSetting({ roadtrip_kwh_per_100: 22 })
    expect(result.current.rangeKm).toBe(350)

    changeSetting({ roadtrip_battery_degradation: 10 })
    expect(result.current.rangeKm).toBe(315)

    // And the kind itself: the same figures mean nothing to a petrol car, which has no
    // tank size stored here at all.
    changeSetting({ roadtrip_vehicle: 'combustion' })
    expect(result.current.vehicleKind).toBe('combustion')
    expect(result.current.rangeKm).toBeNull()

    changeSetting({ roadtrip_tank_litres: 55, roadtrip_litres_per_100: 7 })
    expect(result.current.rangeKm).toBe(786)
  })

  it('FE-VEHRANGEHOOK-012: a range that rounds away leaves no limit rather than a zero one', () => {
    // The branch this hook owns, as opposed to the one its neighbour owns: parts that
    // round to nothing must not arrive as the number 0, which every reader downstream
    // would take for a car that cannot leave the drive.
    setSettings({ roadtrip_vehicle: 'combustion', roadtrip_tank_litres: 1, roadtrip_litres_per_100: 500 })
    const { result } = renderHook(() => useVehicleRange())

    expect(result.current.rangeKm).toBeNull()
  })

  it('FE-VEHRANGEHOOK-010: a range the traveller actually changed does come through', () => {
    setSettings({ roadtrip_vehicle: 'combustion', roadtrip_range_km: 500 })
    const { result } = renderHook(() => useVehicleRange())
    const first = result.current

    setSettings({ roadtrip_vehicle: 'combustion', roadtrip_range_km: 640 })

    // The other half of case 009: memoised is not frozen. A stale object here would keep
    // the old budget on screen until something else happened to re-render.
    expect(result.current.rangeKm).toBe(640)
    expect(result.current).not.toBe(first)
  })
})
