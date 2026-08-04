// FE-COMP-MAPCOMPASS-001 to FE-COMP-MAPCOMPASS-006
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '../../../tests/helpers/render'
import { MapCompassPill, type CompassMap } from './MapCompassPill'

function fakeCompassMap(initialBearing = 0) {
  const listeners: Array<() => void> = []
  let bearing = initialBearing
  const map = {
    getBearing: vi.fn(() => bearing),
    on: vi.fn((_type: 'rotate', fn: () => void) => { listeners.push(fn) }),
    off: vi.fn((_type: 'rotate', fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    }),
    easeTo: vi.fn(),
  }
  return {
    map: map as unknown as CompassMap,
    spies: map,
    listenerCount: () => listeners.length,
    rotateTo: (next: number) => {
      bearing = next
      act(() => { listeners.forEach(fn => fn()) })
    },
  }
}

const needle = () => screen.getByRole('button', { name: 'Reset north' }).querySelector('svg') as SVGElement

describe('MapCompassPill', () => {
  it('FE-COMP-MAPCOMPASS-001: points the needle against the current map bearing', () => {
    const { map } = fakeCompassMap(45)
    render(<MapCompassPill map={map} />)
    // The map rotated 45° clockwise, so the needle turns 45° back to keep pointing north.
    expect(needle().style.transform).toBe('rotate(-45deg)')
  })

  it('FE-COMP-MAPCOMPASS-002: follows the map while it rotates', () => {
    const compass = fakeCompassMap(0)
    render(<MapCompassPill map={compass.map} />)
    expect(needle().style.transform).toBe('rotate(0deg)')

    compass.rotateTo(120)
    expect(needle().style.transform).toBe('rotate(-120deg)')
  })

  it('FE-COMP-MAPCOMPASS-003: snaps the camera back to north and flat on click', () => {
    const compass = fakeCompassMap(75)
    render(<MapCompassPill map={compass.map} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset north' }))
    expect(compass.spies.easeTo).toHaveBeenCalledWith({ bearing: 0, pitch: 0, duration: 300 })
  })

  it('FE-COMP-MAPCOMPASS-004: unsubscribes from the rotate event on unmount', () => {
    const compass = fakeCompassMap(0)
    const { unmount } = render(<MapCompassPill map={compass.map} />)
    expect(compass.listenerCount()).toBe(1)

    unmount()
    expect(compass.spies.off).toHaveBeenCalledWith('rotate', expect.any(Function))
    expect(compass.listenerCount()).toBe(0)
  })

  it('FE-COMP-MAPCOMPASS-005: resubscribes when the map instance is swapped (style rebuild)', () => {
    const first = fakeCompassMap(10)
    const second = fakeCompassMap(200)
    const { rerender } = render(<MapCompassPill map={first.map} />)

    rerender(<MapCompassPill map={second.map} />)
    expect(first.listenerCount()).toBe(0)
    expect(second.listenerCount()).toBe(1)
    expect(needle().style.transform).toBe('rotate(-200deg)')
  })

  it('FE-COMP-MAPCOMPASS-006: highlights the button on hover and clears it again', () => {
    const { map } = fakeCompassMap(0)
    render(<MapCompassPill map={map} />)
    const button = screen.getByRole('button', { name: 'Reset north' })

    fireEvent.mouseEnter(button)
    expect(button.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(button)
    expect(button.style.background).toBe('transparent')
  })
})
