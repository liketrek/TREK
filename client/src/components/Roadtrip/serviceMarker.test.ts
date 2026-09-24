import { describe, it, expect } from 'vitest'
import { serviceMarkerHtml, serviceMarkerOuter, SERVICE_MARKER_SIZE, SERVICE_MARKER_SIZE_SELECTED } from './serviceMarker'
import { serviceColor } from './roadtripModel'

/**
 * FE-SVCMARK-001..007 — the disc a service stop gets on the map.
 *
 * Both renderers need the same string: one hands it to a Leaflet divIcon, the
 * other to an element it attaches itself. What is worth pinning is that an
 * ordinary place gets nothing at all — a petrol station is something the drive
 * passes through, and giving it a place-sized marker made a day look like it had
 * twice the stops it has — and that the anchor arithmetic includes the border,
 * or the pin sits a couple of pixels off the coordinate it marks.
 */

describe('serviceMarkerHtml', () => {
  it('FE-SVCMARK-001: an ordinary place gets no service marker', () => {
    // Null is the signal to fall back to the place marker, so this is what keeps
    // a destination from being drawn as a fuel stop.
    expect(serviceMarkerHtml(null, false)).toBeNull()
    expect(serviceMarkerHtml(undefined, false)).toBeNull()
    expect(serviceMarkerHtml('', false)).toBeNull()
  })

  it('FE-SVCMARK-002: each kind of stop gets a disc in its own colour', () => {
    // All six, not only the four the corridor picker offers: a meal and a
    // viewpoint are pauses on the way too, and the map draws them the same way.
    for (const kind of ['fuel', 'charging', 'rest_area', 'campsite', 'restaurant', 'sights']) {
      const html = serviceMarkerHtml(kind, false)
      expect(html, kind).toBeTruthy()
      expect(html, kind).toContain(serviceColor(kind))
      expect(html, kind).toContain('border-radius:50%')
    }
  })

  it('FE-SVCMARK-003: an unknown service kind is still not drawn as one', () => {
    // isServiceStopType is the gate; a value the picker never offers must not
    // reach the renderer and produce a disc in an undefined colour.
    expect(serviceMarkerHtml('banana', false)).toBeNull()
  })

  it('FE-SVCMARK-004: selecting one grows it, the way a place marker confirms a click', () => {
    const plain = serviceMarkerHtml('fuel', false)!
    const selected = serviceMarkerHtml('fuel', true)!

    expect(plain).toContain(`width:${SERVICE_MARKER_SIZE}px`)
    expect(selected).toContain(`width:${SERVICE_MARKER_SIZE_SELECTED}px`)
    expect(SERVICE_MARKER_SIZE_SELECTED).toBeGreaterThan(SERVICE_MARKER_SIZE)
  })

  it('FE-SVCMARK-005: selected carries the heavier ring, unselected the plain shadow', () => {
    expect(serviceMarkerHtml('fuel', true)!).toContain('0 0 0 3px')
    expect(serviceMarkerHtml('fuel', false)!).not.toContain('0 0 0 3px')
  })

  it('FE-SVCMARK-006: the icon is drawn white and inline, never a logo or a photo', () => {
    // A fuel stop used to come back from the place search carrying the
    // operator's logo, so the map showed a brand roundel where every other
    // road-trip surface showed a pump.
    const html = serviceMarkerHtml('fuel', false)!
    expect(html).toContain('<svg')
    expect(html).toContain('#fff')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('background-image')
  })
})

describe('serviceMarkerOuter', () => {
  it('FE-SVCMARK-007: the box an anchor centres on includes the border', () => {
    // content-box plus a 2px border on each side. Measuring the inner size would
    // leave every service pin two pixels off the coordinate it marks.
    expect(serviceMarkerOuter(false)).toBe(SERVICE_MARKER_SIZE + 4)
    expect(serviceMarkerOuter(true)).toBe(SERVICE_MARKER_SIZE_SELECTED + 4)
  })
})
