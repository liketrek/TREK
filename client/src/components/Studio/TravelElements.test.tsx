import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { bookMapElementSchema } from '@trek/shared'
import { TravelElementView } from './TravelElements'
import { COUNTRY_SHAPES, countryParts } from './countryShapes'

/*
 * The maps are measured, not snapshotted: what went wrong in #2021 is a number
 * — how far apart the stops end up on the paper — and a snapshot of a country
 * outline says nothing about whether the route inside it is legible.
 */

const FRAME = { x: 0, y: 0, w: 100, h: 100 }

const PARIS = { lat: 48.86, lng: 2.35 }
const LYON = { lat: 45.76, lng: 4.84 }
const NICE = { lat: 43.7, lng: 7.27 }

function mapEl(over: Record<string, unknown>) {
  return bookMapElementSchema.parse({ id: 'm1', kind: 'map', frame: FRAME, ...over })
}

/** How wide the stops sit on the page, in millimetres of a 100mm frame. */
function pinSpan(over: Record<string, unknown>): number {
  const { container } = render(
    <TravelElementView el={mapEl(over)} frameStyle={{ width: '100mm', height: '100mm' }} />,
  )
  const xs = [...container.querySelectorAll('circle')].map(c => Number(c.getAttribute('cx')))
  expect(xs.length).toBeGreaterThan(0)
  return Math.max(...xs) - Math.min(...xs)
}

describe('MapView fit', () => {
  it('frames a French route without the overseas territories', () => {
    expect(pinSpan({ countries: ['FR'], points: [PARIS, LYON, NICE] })).toBeGreaterThan(20)
  })

  it('frames a British route without South Georgia', () => {
    const span = pinSpan({
      countries: ['GB'],
      points: [{ lat: 51.51, lng: -0.13 }, { lat: 55.95, lng: -3.19 }],
    })
    // Smaller than the French case because Britain really is drawn whole here,
    // which is what the setting asks for. The South Atlantic is not.
    expect(span).toBeGreaterThan(10)
  })

  it('frames the route when imagery is cut to the country outline', () => {
    const span = pinSpan({
      source: 'tiles', clip: 'country', countries: ['FR'], points: [PARIS, LYON, NICE],
    })
    expect(span).toBeGreaterThan(20)
  })

  it('still draws the whole of a compact country around the route', () => {
    const span = pinSpan({
      countries: ['NL'],
      points: [{ lat: 52.37, lng: 4.9 }, { lat: 51.92, lng: 4.48 }],
    })
    // The Netherlands is small enough that "whole country" is still a useful
    // picture, so this one must NOT grow: the fix is about which rings count,
    // not about abandoning the fit.
    expect(span).toBeLessThan(10)
  })

  it('frames the overseas ring when that is where the trip was', () => {
    // Cayenne and Kourou. The right answer is French Guiana, not metropolitan
    // France, so picking the nearest rings has to work in both directions.
    const span = pinSpan({
      countries: ['FR'],
      points: [{ lat: 4.92, lng: -52.33 }, { lat: 5.16, lng: -52.65 }],
    })
    expect(span).toBeGreaterThan(5)
  })

  it('falls back to the whole country when there is no route yet', () => {
    // An empty map element still has to draw something, and the something is
    // the country — every ring of it, since nothing says which one matters.
    const { container } = render(
      <TravelElementView
        el={mapEl({ countries: ['FR'], points: [], path: [] })}
        frameStyle={{ width: '100mm', height: '100mm' }}
      />,
    )
    expect(container.querySelector('path[d]')).not.toBeNull()
  })

  it('leaves Satellite alone', () => {
    const span = pinSpan({ source: 'tiles', countries: ['FR'], points: [PARIS, LYON, NICE] })
    expect(span).toBeGreaterThan(20)
  })
})

describe('countryParts', () => {
  it('splits France into its five landmasses', () => {
    const lng = countryParts(COUNTRY_SHAPES.FR)
      .map(p => [Math.round(p[0] * 100) / 100, Math.round(p[2] * 100) / 100])
      .sort((a, b) => a[0] - b[0])
    expect(lng).toEqual([
      [-54.55, -51.67], // French Guiana
      [-4.69, 8.16],    // metropolitan France
      [8.6, 9.49],      // Corsica
      [68.87, 70.42],   // Kerguelen
      [163.93, 167.03], // New Caledonia
    ])
    // The aggregate the outlines are still drawn from is untouched.
    expect(COUNTRY_SHAPES.FR.b).toEqual([-54.55, -59.62, 167.03, 57.49])
  })

  it('gives a country with one landmass a single box matching its bounds', () => {
    const parts = countryParts(COUNTRY_SHAPES.CH)
    expect(parts).toHaveLength(1)
    expect(parts[0][0]).toBeCloseTo(COUNTRY_SHAPES.CH.b[0], 1)
    expect(parts[0][2]).toBeCloseTo(COUNTRY_SHAPES.CH.b[2], 1)
  })
})
