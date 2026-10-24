// FE-JOURNEY-ZOOM-001 to FE-JOURNEY-ZOOM-004 (#1484)
import { describe, it, expect } from 'vitest'
import { clampOffset, NO_ZOOM, panBy, toggleZoom, zoomAt } from './photoZoom'

describe('photoZoom', () => {
  it('FE-JOURNEY-ZOOM-001: zooms into the point under the pointer and stays within 1x to 4x', () => {
    expect(zoomAt(NO_ZOOM, 2, 50, 20, 400, 300)).toEqual({ scale: 2, x: -50, y: -20 })
    expect(zoomAt(NO_ZOOM, 9, 0, 0, 400, 300).scale).toBe(4)
    expect(zoomAt({ scale: 2, x: 30, y: 0 }, 0.5, 0, 0, 400, 300)).toEqual(NO_ZOOM)
  })

  it('FE-JOURNEY-ZOOM-002: never lets the photo slide off its own place', () => {
    expect(clampOffset({ scale: 2, x: 999, y: -999 }, 400, 300)).toEqual({ scale: 2, x: 200, y: -150 })
    expect(panBy({ scale: 2, x: 0, y: 0 }, 30, 40, 400, 300)).toEqual({ scale: 2, x: 30, y: 40 })
  })

  it('FE-JOURNEY-ZOOM-003: a double click goes in, and back out from anywhere', () => {
    expect(toggleZoom(NO_ZOOM, 0, 0, 400, 300).scale).toBe(2.5)
    expect(toggleZoom({ scale: 3.2, x: 10, y: 10 }, 0, 0, 400, 300)).toEqual(NO_ZOOM)
  })
})
