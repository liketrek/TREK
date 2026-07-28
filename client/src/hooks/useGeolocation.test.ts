import { describe, it, expect, afterEach, vi } from 'vitest'
import { getCurrentPositionOnce, GeoOnceError } from './useGeolocation'

const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation')

function stubGeolocation(getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback) => void) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: vi.fn(getCurrentPosition) },
  })
}

function geoError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'geo error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError
}

afterEach(() => {
  if (originalGeolocation) {
    Object.defineProperty(navigator, 'geolocation', originalGeolocation)
  } else {
    delete (navigator as { geolocation?: unknown }).geolocation
  }
  vi.unstubAllGlobals()
})

describe('getCurrentPositionOnce', () => {
  it('resolves a mapped GeoPosition on success', async () => {
    stubGeolocation(success => success({
      coords: {
        latitude: 41.9, longitude: 12.5, accuracy: 10,
        heading: null, speed: null, altitude: null, altitudeAccuracy: null,
      },
      timestamp: 1234567890,
    } as unknown as GeolocationPosition))

    await expect(getCurrentPositionOnce()).resolves.toEqual({
      lat: 41.9,
      lng: 12.5,
      accuracy: 10,
      heading: null,
      speed: null,
      timestamp: 1234567890,
    })
  })

  it('rejects with "unsupported" when geolocation is missing', async () => {
    // jsdom has no navigator.geolocation by default
    await expect(getCurrentPositionOnce()).rejects.toMatchObject({
      name: 'GeoOnceError',
      code: 'unsupported',
    })
  })

  it('rejects with "insecure-context" outside secure contexts', async () => {
    stubGeolocation(() => { throw new Error('should not be called') })
    vi.stubGlobal('isSecureContext', false)

    await expect(getCurrentPositionOnce()).rejects.toMatchObject({ code: 'insecure-context' })
  })

  it.each([
    [1, 'permission-denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('maps error code %i to "%s"', async (code, expected) => {
    stubGeolocation((_success, error) => error?.(geoError(code)))

    const rejection = await getCurrentPositionOnce().catch((e: unknown) => e)
    expect(rejection).toBeInstanceOf(GeoOnceError)
    expect((rejection as GeoOnceError).code).toBe(expected)
  })
})
