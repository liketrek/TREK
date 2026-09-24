import { createElement } from 'react'
import { ParkingSquare } from 'lucide-react'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { isServiceStopType, serviceColor } from './roadtripModel'
import { STOP_KIND_BY_KEY } from './stopKinds'

/**
 * Smaller than a place marker on purpose.
 *
 * A petrol station is not a destination — it is something the drive passes through — and
 * a marker the same size as the places the trip is for made a day look like it had twice
 * as many stops as it has. Selected grows a little, the same way a place marker does, so
 * clicking one still confirms itself.
 */
export const SERVICE_MARKER_SIZE = 24
export const SERVICE_MARKER_SIZE_SELECTED = 30
const BORDER = 2

/** The full box a service marker occupies, border included — what an anchor centres on. */
export function serviceMarkerOuter(selected: boolean): number {
  return (selected ? SERVICE_MARKER_SIZE_SELECTED : SERVICE_MARKER_SIZE) + BORDER * 2
}

/**
 * The marker for a stop that interrupts the drive, or null for an ordinary place.
 *
 * One flat disc in the kind's own colour with a white icon — never the place's photo or
 * its brand logo. A fuel stop used to come back from the place search carrying the
 * operator's logo, so the map showed an Esso roundel where every other road-trip surface
 * showed a pump: unreadable at marker size, different for every brand, and nothing at all
 * for the ones with no logo on file.
 *
 * Built as markup rather than as a component because both renderers need a string: one
 * feeds it to a Leaflet `divIcon`, the other to an element it attaches itself.
 */
export function serviceMarkerHtml(stopType: string | null | undefined, selected: boolean): string | null {
  if (!isServiceStopType(stopType)) return null
  const size = selected ? SERVICE_MARKER_SIZE_SELECTED : SERVICE_MARKER_SIZE
  const Icon = STOP_KIND_BY_KEY[stopType ?? '']?.Icon ?? ParkingSquare
  const svg = renderIconMarkup(createElement(Icon, {
    size: Math.round(size * 0.56),
    color: '#fff',
    strokeWidth: 2.4,
  }))
  const ring = selected
    ? '0 0 0 3px rgba(17,24,39,0.25), 0 4px 12px rgba(0,0,0,0.3)'
    : '0 2px 6px rgba(0,0,0,0.25)'
  return `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${serviceColor(stopType)};
    border:${BORDER}px solid #fff;box-shadow:${ring};
    display:flex;align-items:center;justify-content:center;
    box-sizing:content-box;cursor:pointer;
  ">${svg}</div>`
}
