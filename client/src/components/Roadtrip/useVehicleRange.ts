import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useMemo } from 'react'
import { effectiveRangeKm } from './vehicleRange'
import type { VehicleKind } from './roadtripModel'

export function useVehicleRange(tripId?: number | string | null): { vehicleKind: VehicleKind | null; rangeKm: number | null } {
  const rangeKm = useRoadtripSettings(s => s.roadtrip_range_km, tripId)
  const vehicle = useRoadtripSettings(s => s.roadtrip_vehicle, tripId)
  const tankLitres = useRoadtripSettings(s => s.roadtrip_tank_litres, tripId)
  const litresPer100 = useRoadtripSettings(s => s.roadtrip_litres_per_100, tripId)
  const batteryKwh = useRoadtripSettings(s => s.roadtrip_battery_kwh, tripId)
  const kwhPer100 = useRoadtripSettings(s => s.roadtrip_kwh_per_100, tripId)
  const degradationPercent = useRoadtripSettings(s => s.roadtrip_battery_degradation, tripId)

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
