import { describe, expect, it, vi } from 'vitest'
import { toCompassMap } from './googleCompass'

function fakeMap(heading?: number) {
  const remove = vi.fn()
  const map = {
    getHeading: vi.fn(() => heading),
    addListener: vi.fn(() => ({ remove })),
    moveCamera: vi.fn(),
  }
  return { map: map as unknown as google.maps.Map, spies: map, remove }
}

describe('toCompassMap', () => {
  it('reads bearing from the heading', () => {
    const { map } = fakeMap(90)

    expect(toCompassMap(map).getBearing()).toBe(90)
  })

  // getHeading() is undefined until the camera has one, and the pill puts the
  // value straight into a rotation transform — undefined would blank the arrow.
  it('treats an unset heading as north', () => {
    const { map } = fakeMap(undefined)

    expect(toCompassMap(map).getBearing()).toBe(0)
  })

  it('subscribes to the property event Google actually emits', () => {
    const { map, spies } = fakeMap(0)
    const listener = vi.fn()

    toCompassMap(map).on('rotate', listener)

    expect(spies.addListener).toHaveBeenCalledWith('heading_changed', listener)
  })

  it('removes the right subscription on off', () => {
    const { map, remove } = fakeMap(0)
    const compass = toCompassMap(map)
    const listener = vi.fn()

    compass.on('rotate', listener)
    compass.off('rotate', listener)

    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('ignores off() for a listener that was never registered', () => {
    const { map, remove } = fakeMap(0)

    expect(() => toCompassMap(map).off('rotate', vi.fn())).not.toThrow()
    expect(remove).not.toHaveBeenCalled()
  })

  it('maps a snap-to-north back onto the Google camera', () => {
    const { map, spies } = fakeMap(120)

    toCompassMap(map).easeTo({ bearing: 0, pitch: 0, duration: 300 })

    expect(spies.moveCamera).toHaveBeenCalledWith({ heading: 0, tilt: 0 })
  })
})
