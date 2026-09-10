import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { haversineKm, pointAtMeters, type Bbox, type LatLng } from './corridor'

const { pois, offline, stored } = vi.hoisted(() => ({
  pois: vi.fn(),
  offline: vi.fn(),
  stored: { settings: {} as { roadtrip_vehicle?: string } },
}))
vi.mock('../../api/client', () => ({ mapsApi: { pois } }))
vi.mock('../../i18n', () => ({ useTranslation: () => ({ locale: 'en-US' }) }))
vi.mock('../../sync/networkMode', () => ({ isEffectivelyOffline: offline }))
vi.mock('../../store/settingsStore', () => ({
  useSettingsStore: (select: (state: typeof stored) => unknown) => select(stored),
}))

import { useRefuelSearch } from './useRefuelSearch'

/**
 * A hundred kilometres due north. A straight north-south drive makes "before the dry
 * point" a plain statement about latitude, so the direction the search looked in can be
 * read off the box the request carried.
 */
const LINE: LatLng[] = [{ lat: 53, lng: 10 }, { lat: 53.9, lng: 10 }]
const DRY_KM = 60
const DRY = pointAtMeters(LINE, DRY_KM * 1000)!

const hit = (id: string, lat: number, lng: number, category = 'fuel') => ({
  osm_id: id,
  name: id,
  lat,
  lng,
  category,
  poi_type: 'amenity=fuel',
  address: null,
  website: null,
  phone: null,
  opening_hours: null,
  cuisine: null,
  source: 'openstreetmap',
})

/**
 * A station `alongKm` into the day, `eastKm` to the side of the road.
 *
 * The side step is a rough degree conversion rather than the projection the hook uses:
 * nothing here depends on the exact metre, only on a larger `eastKm` really sitting
 * further from the line, which is what orders the offers.
 */
const station = (id: string, alongKm: number, eastKm = 0.5) => {
  const on = pointAtMeters(LINE, alongKm * 1000)!
  return hit(id, on.lat, on.lng + eastKm / 66)
}

const answer = (items: ReturnType<typeof hit>[], over: { truncated?: boolean; clamped?: boolean } = {}) =>
  ({ pois: items, source: 'openstreetmap', truncated: false, clamped: false, ...over })

const boxOf = (call: unknown[]) => call[1] as Bbox
const signalOf = (call: unknown[]) => call[3] as AbortSignal

/** A request left hanging, so a second one can overtake it. */
function held() {
  let settle!: (value: ReturnType<typeof answer>) => void
  const promise = new Promise<ReturnType<typeof answer>>(resolve => { settle = resolve })
  return { promise, settle }
}

beforeEach(() => {
  pois.mockReset().mockResolvedValue(answer([]))
  offline.mockReset().mockReturnValue(false)
  stored.settings = {}
})

describe('useRefuelSearch', () => {
  it('FE-REFUELSEARCH-001: offline it says so rather than offering a stop that cannot be kept', async () => {
    // Accepting an offer writes a place and assigns it to a day; only the first of those
    // queues offline, so anything accepted here would end up an orphan. Saying "could not
    // look" is the honest answer, and it must not cost a request either.
    offline.mockReturnValue(true)
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    expect(pois).not.toHaveBeenCalled()
    expect(result.current.outcome).toBe('failed')
    expect(result.current.loading).toBe(false)
    // The band still opens on the point that was asked about, or there is nowhere to
    // print the answer.
    expect(result.current.openFor).toBe('4:1')
  })

  it('FE-REFUELSEARCH-002: somebody who drives a petrol car is not sent to a charger', async () => {
    stored.settings = { roadtrip_vehicle: 'combustion' }
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    expect(pois.mock.calls[0][0]).toBe('fuel')
    // The names come back in the traveller's language, so the rail is not half German.
    expect(pois.mock.calls[0][2]).toBe('en-US')
  })

  it('FE-REFUELSEARCH-003: an electric car is not sent to a petrol pump', async () => {
    stored.settings = { roadtrip_vehicle: 'electric' }
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    expect(pois.mock.calls[0][0]).toBe('charging')
  })

  it('FE-REFUELSEARCH-004: with nothing said about the car both kinds are looked for', async () => {
    const { result, rerender } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })
    expect(pois.mock.calls[0][0]).toBe('fuel,charging')

    // And a value this hook has never heard of falls back to both rather than narrowing
    // the search to nothing: an empty category list would read on screen as "there is no
    // filling station on this road", which is a statement about the road.
    stored.settings = { roadtrip_vehicle: 'hovercraft' }
    rerender()
    await act(async () => { await result.current.ask('4:2', DRY, LINE, DRY_KM, []) })
    expect(pois.mock.calls[1][0]).toBe('fuel,charging')
  })

  it('FE-REFUELSEARCH-005: it looks at the road already driven, not around the dry point', async () => {
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    const box = boxOf(pois.mock.calls[0])
    const centre = { lat: (box.south + box.north) / 2, lng: (box.west + box.east) / 2 }
    // South is backwards along this drive. Centring on the dry point itself would spend
    // half the circle on road that lies beyond an empty tank.
    expect(centre.lat).toBeLessThan(DRY.lat)
    expect(haversineKm(centre, DRY)).toBeGreaterThan(11)
    expect(haversineKm(centre, DRY)).toBeLessThan(13)
    // Pulled back, but not so far that the last kilometres before the tank empties fall
    // outside the box: a pump two kilometres short of the dry point is the best answer
    // there is.
    expect(box.north).toBeGreaterThan(DRY.lat)
  })

  it('FE-REFUELSEARCH-006: a second question abandons the answer to the first', async () => {
    const first = held()
    pois.mockImplementationOnce(() => first.promise)
    const { result } = renderHook(() => useRefuelSearch())

    let pending!: Promise<void>
    act(() => { pending = result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    pois.mockResolvedValueOnce(answer([station('second', 30)]))
    await act(async () => { await result.current.ask('5:0', DRY, LINE, DRY_KM, []) })

    // The abandoned request answers late, the way a slow one does. Landing it now would
    // put day four's stations under day five's heading, with day five's accept button
    // under them.
    await act(async () => { first.settle(answer([station('first', 45)])); await pending })

    expect(signalOf(pois.mock.calls[0]).aborted).toBe(true)
    expect(result.current.results.map(p => p.osm_id)).toEqual(['second'])
    expect(result.current.openFor).toBe('5:0')
    expect(result.current.loading).toBe(false)
  })

  it('FE-REFUELSEARCH-007: asking again empties the rail before the new answer arrives', async () => {
    pois.mockResolvedValueOnce(answer([station('old', 40)]))
    const { result } = renderHook(() => useRefuelSearch())
    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })
    expect(result.current.results).toHaveLength(1)

    pois.mockImplementationOnce(() => held().promise)
    act(() => { void result.current.ask('5:0', DRY, LINE, DRY_KM, []) })

    // Left standing, the first search's stations sit under the new heading for as long as
    // the second one takes, and accepting one would file it against the wrong dry point.
    expect(result.current.results).toEqual([])
    expect(result.current.offered).toEqual([])
    expect(result.current.outcome).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('FE-REFUELSEARCH-008: a request that fails is a failure, not an empty road', async () => {
    pois.mockRejectedValue(new Error('502'))
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    expect(result.current.outcome).toBe('failed')
    // Left spinning, the band offers no way to ask again.
    expect(result.current.loading).toBe(false)
  })

  it('FE-REFUELSEARCH-009: stations the car cannot reach are not a find', async () => {
    // Both come back from the server and both are real filling stations; both sit past
    // the point the tank empties, so neither answers the question that was asked.
    pois.mockResolvedValue(answer([station('just-past', 58), station('well-past', 70)]))
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    expect(result.current.results).toEqual([])
    expect(result.current.outcome).toBe('none')
  })

  it('FE-REFUELSEARCH-010: a search the server cut short is not reported as an empty road', async () => {
    pois.mockResolvedValue(answer([], { truncated: true }))
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    // "There is nothing here" and "we did not finish looking" send a traveller to two
    // different places, and only the server knows which of them happened.
    expect(result.current.outcome).toBe('incomplete')
  })

  it('FE-REFUELSEARCH-011: a pump already on the plan is not offered beside itself', async () => {
    const planned = station('planned', 40)
    pois.mockResolvedValue(answer([planned, station('new', 45, 1.5)]))
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => {
      await result.current.ask('4:1', DRY, LINE, DRY_KM, [{ lat: planned.lat, lng: planned.lng }])
    })

    expect(result.current.results.map(p => p.osm_id)).toEqual(['new'])
  })

  it('FE-REFUELSEARCH-012: three go on the map, and they are the three the rail lists', async () => {
    // Ordered by the detour, so the map has to draw the first three of that same list
    // rather than any three: a pin the rail does not name is a stop nobody can accept.
    pois.mockResolvedValue(answer([
      station('far', 30, 2.5),
      station('nearest', 44, 0.2),
      station('third', 36, 1.5),
      station('fourth', 32, 2),
      station('second', 40, 0.8),
    ]))
    const { result } = renderHook(() => useRefuelSearch())

    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    expect(result.current.results).toHaveLength(5)
    expect(result.current.offered.map(p => p.osm_id)).toEqual(['nearest', 'second', 'third'])
    expect(result.current.offered).toEqual(result.current.results.slice(0, 3))
  })

  it('FE-REFUELSEARCH-013: with nothing open the offer list is the same array every time', async () => {
    // The map rebuilds every pin when this reference changes, and the planner re-renders
    // on anything from a drag to an incoming websocket event. A fresh [] per render is a
    // map that flickers all day for a search nobody started.
    const { result, rerender } = renderHook(() => useRefuelSearch())
    const idle = result.current.offered

    rerender()
    expect(result.current.offered).toBe(idle)

    pois.mockResolvedValue(answer([station('a', 40)]))
    await act(async () => { await result.current.ask('4:1', DRY, LINE, DRY_KM, []) })
    const open = result.current.offered
    rerender()
    expect(result.current.offered).toBe(open)

    act(() => { result.current.close() })
    expect(result.current.offered).toBe(idle)
  })

  it('FE-REFUELSEARCH-014: closing the band drops the answer and the request behind it', async () => {
    pois.mockImplementationOnce(() => held().promise)
    const { result } = renderHook(() => useRefuelSearch())
    act(() => { void result.current.ask('4:1', DRY, LINE, DRY_KM, []) })

    act(() => { result.current.close() })

    expect(signalOf(pois.mock.calls[0]).aborted).toBe(true)
    expect(result.current.openFor).toBeNull()
    expect(result.current.results).toEqual([])
    expect(result.current.outcome).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
