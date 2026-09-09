import { useMemo } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { effectiveRangeKm } from './vehicleRange'
import type { VehicleKind } from './roadtripModel'

/**
 * How far the traveller's car goes on one fill, and what kind of car it is.
 *
 * One place rather than two, because the answer is assembled from seven settings and two
 * readers need it: the routes hook, which turns it into the range budget every warning is
 * measured against, and the rail, which tells a traveller what a given fill buys at a
 * given stop. Assembling it twice is the hand-mirrored state this codebase refuses
 * everywhere else, and the two copies would drift the first time a field is added.
 *
 * Each setting is read as its own primitive so the memo compares numbers. An object
 * rebuilt on every render would give the result a new identity every time, and what
 * depends on it is the effect that recalculates every day's driving.
 */
export function useVehicleRange(): { vehicleKind: VehicleKind | null; rangeKm: number | null } {
  const rangeKm = useSettingsStore(s => s.settings.roadtrip_range_km)
  // Validated rather than trusted: a per-user setting gets no server-side check, and an
  // unknown word here would silently stop both kinds of stop counting as a fill-up.
  const vehicle = useSettingsStore(s => s.settings.roadtrip_vehicle)
  const tankLitres = useSettingsStore(s => s.settings.roadtrip_tank_litres)
  const litresPer100 = useSettingsStore(s => s.settings.roadtrip_litres_per_100)
  const batteryKwh = useSettingsStore(s => s.settings.roadtrip_battery_kwh)
  const kwhPer100 = useSettingsStore(s => s.settings.roadtrip_kwh_per_100)
  const degradationPercent = useSettingsStore(s => s.settings.roadtrip_battery_degradation)

  const vehicleKind: VehicleKind | null =
    vehicle === 'combustion' || vehicle === 'electric' ? vehicle : null

  // The parts win over the typed number when they add up, because they are the more
  // specific answer; the settings dialog shows the result, so it is never a surprise.
  // Zero and absent both mean "no limit", which is why the falsy fold happens here once.
  const planningKm = useMemo(
    () => effectiveRangeKm(
      vehicleKind,
      { tankLitres, litresPer100, batteryKwh, kwhPer100, degradationPercent },
      rangeKm,
    ) || null,
    [vehicleKind, tankLitres, litresPer100, batteryKwh, kwhPer100, degradationPercent, rangeKm],
  )

  return useMemo(() => ({ vehicleKind, rangeKm: planningKm }), [vehicleKind, planningKm])
}
