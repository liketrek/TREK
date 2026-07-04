// Great-circle geometry for transport routes (flights, cruises, ferries),
// shared by the Leaflet and Mapbox/MapLibre renderers (#1411).

const toRad = (d: number) => d * Math.PI / 180
const toDeg = (r: number) => r * 180 / Math.PI

export function greatCircle(a: [number, number], b: [number, number], steps = 256): [number, number][] {
  const [lat1, lng1] = [toRad(a[0]), toRad(a[1])]
  const [lat2, lng2] = [toRad(b[0]), toRad(b[1])]
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2))
  if (d === 0) return [a, b]
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lng = Math.atan2(y, x)
    pts.push([toDeg(lat), toDeg(lng)])
  }
  return pts
}

/**
 * Make the longitudes of a sampled arc continuous: atan2 normalizes every
 * sample to [-180, 180], so a date-line crossing shows up as a ±360 jump
 * between neighbours — which the renderers draw as a line across the whole
 * map. Carrying a running offset keeps each Δlng under 180°, at the cost of
 * longitudes leaving the [-180, 180] range (both map libraries project those
 * linearly, which is exactly what makes the wrap seamless).
 */
export function unwrapLngs(points: [number, number][]): [number, number][] {
  let offset = 0
  return points.map(([lat, lng], i) => {
    if (i === 0) return [lat, lng] as [number, number]
    const prev = points[i - 1][1] + offset
    let cur = lng + offset
    if (cur - prev > 180) { offset -= 360; cur -= 360 }
    else if (cur - prev < -180) { offset += 360; cur += 360 }
    return [lat, cur] as [number, number]
  })
}

/**
 * The polylines to draw for one leg. The base arc is continuous (unwrapped),
 * so panning across the antimeridian shows one unbroken line. With
 * `wrapCopies` (Leaflet — its vector layers don't repeat across world
 * copies), a ±360-shifted duplicate keeps both halves visible in the
 * standard [-180, 180] view; GL maps repeat features themselves
 * (renderWorldCopies), so the duplicate would just double the line opacity.
 */
export function geodesicArcs(a: [number, number], b: [number, number], wrapCopies: boolean): [number, number][][] {
  const arc = unwrapLngs(greatCircle(a, b))
  const crosses = arc.some(([, lng]) => lng < -180 || lng > 180)
  if (!crosses || !wrapCopies) return [arc]
  const shift = arc.some(([, lng]) => lng < -180) ? 360 : -360
  return [arc, arc.map(([lat, lng]) => [lat, lng + shift] as [number, number])]
}
