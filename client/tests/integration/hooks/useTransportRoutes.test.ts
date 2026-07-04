import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Reservation } from '../../../src/types'

const { calculateRouteWithLegs } = vi.hoisted(() => ({ calculateRouteWithLegs: vi.fn() }))
vi.mock('../../../src/components/Map/RouteCalculator', () => ({ calculateRouteWithLegs }))

import { useTransportRoutes } from '../../../src/hooks/useTransportRoutes'

function booking(id: number, type: string, from: [number, number], to: [number, number]): Reservation {
  return {
    id,
    type,
    status: 'confirmed',
    endpoints: [
      { role: 'from', sequence: 0, name: 'A', code: null, lat: from[0], lng: from[1], timezone: null, local_time: null, local_date: null },
      { role: 'to', sequence: 1, name: 'B', code: null, lat: to[0], lng: to[1], timezone: null, local_time: null, local_date: null },
    ],
  } as unknown as Reservation
}

const PARIS: [number, number] = [48.8566, 2.3522]
const VERSAILLES: [number, number] = [48.8049, 2.1204]

beforeEach(() => {
  calculateRouteWithLegs.mockReset()
  calculateRouteWithLegs.mockResolvedValue({ coordinates: [PARIS, [48.83, 2.24], VERSAILLES], distance: 20000, duration: 1500, legs: [] })
})

describe('useTransportRoutes (#1425 real road routes)', () => {
  it('routes a car booking with the driving profile and returns its geometry', async () => {
    const res = [booking(1, 'car', PARIS, VERSAILLES)]
    const { result } = renderHook(() => useTransportRoutes(res))
    await waitFor(() => expect(result.current.get(1)).toBeTruthy())
    expect(result.current.get(1)).toHaveLength(3)
    expect(calculateRouteWithLegs).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ profile: 'driving' }))
  })

  it('routes a bicycle booking with the cycling profile', async () => {
    const res = [booking(2, 'bicycle', PARIS, VERSAILLES)]
    renderHook(() => useTransportRoutes(res))
    await waitFor(() => expect(calculateRouteWithLegs).toHaveBeenCalled())
    expect(calculateRouteWithLegs).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ profile: 'cycling' }))
  })

  it('does not route non-road types (flight, train, transit)', async () => {
    const res = [
      booking(3, 'flight', PARIS, VERSAILLES),
      booking(4, 'train', PARIS, VERSAILLES),
      booking(5, 'transit', PARIS, VERSAILLES),
    ]
    renderHook(() => useTransportRoutes(res))
    await new Promise(r => setTimeout(r, 20))
    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
  })

  it('skips routing beyond the sanity distance cap (keeps the straight line)', async () => {
    // Paris → Tokyo as a "car" booking: ~9700 km, well past the 2000 km cap.
    const res = [booking(6, 'car', PARIS, [35.68, 139.69])]
    renderHook(() => useTransportRoutes(res))
    await new Promise(r => setTimeout(r, 20))
    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
  })

  it('falls back silently (no entry) when routing throws', async () => {
    calculateRouteWithLegs.mockRejectedValueOnce(new Error('OSRM down'))
    const res = [booking(7, 'taxi', PARIS, VERSAILLES)]
    const { result } = renderHook(() => useTransportRoutes(res))
    await waitFor(() => expect(calculateRouteWithLegs).toHaveBeenCalled())
    await new Promise(r => setTimeout(r, 10))
    expect(result.current.get(7)).toBeUndefined()
  })

  it('does not re-request an unchanged booking when the array identity changes', async () => {
    const res1 = [booking(8, 'car', PARIS, VERSAILLES)]
    const { rerender } = renderHook(({ r }) => useTransportRoutes(r), { initialProps: { r: res1 } })
    await waitFor(() => expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1))
    // New array, same booking coordinates → no second fetch.
    rerender({ r: [booking(8, 'car', PARIS, VERSAILLES)] })
    await new Promise(r => setTimeout(r, 20))
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
  })
})
