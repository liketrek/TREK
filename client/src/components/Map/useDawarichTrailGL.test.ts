/**
 * FE-DAWARICH-TRAILUI-020 to FE-DAWARICH-TRAILUI-032: the recorded-route
 * overlay on the GL renderer, the imperative twin of `DawarichTrailLayer`.
 *
 * A declarative overlay that gets its ordering wrong looks wrong. An imperative
 * one that gets its lifecycle wrong leaks: sources and layers survive the React
 * tree that created them, and a GL map carrying a layer nobody owns any more
 * throws on the next style change instead of at the point of the mistake. So
 * the things pinned here are the ones whose failure is invisible at the call
 * site:
 *
 *  - **the guard.** `mapRef.current` is null on the first render and the style
 *    is not loaded for several frames after that. Adding a layer in either
 *    window throws inside an effect, which React reports as a render error on a
 *    component that has nothing to do with Dawarich.
 *  - **the anchor.** `beforeId` is only usable once that layer actually exists
 *    on the current style; passing an unknown id to `addLayer` is a throw, not
 *    a no-op, and the layer it names belongs to a different overlay that may
 *    not have mounted yet.
 *  - **the `trek-` prefix on every id**, which is what `applySatellite` looks
 *    for when it decides where to slot the satellite tile. A layer called
 *    `dawarich-trail` would end up underneath the satellite image and simply
 *    not be there for the people most likely to want it.
 *  - **`setData` over remove-and-add** when the source is still there, because
 *    a rebuilt source flickers. The two-minute refresh does not reach that arm:
 *    a fresh track object re-runs the effect and the teardown takes the source
 *    with it, so what setData actually covers is a style change that kept its
 *    sources. Both paths are pinned, because which one a refresh takes is the
 *    difference between a line that blinks every two minutes and one that does
 *    not.
 *  - **the wait for `idle`.** `isStyleLoaded()` is false while any tile is
 *    still in flight, not only before the first style. A draw that gave up
 *    there and only listened for `style.load` left the line off the map until
 *    the page was reloaded, which is what a tester on dev1 ran into.
 *  - **one `style.load` subscription at a time.** The effect re-runs on every
 *    refresh, and a cleanup that forgot to unsubscribe would add one silent
 *    redraw per refresh for the life of the map.
 *  - **the teardown**, which has to take both layers and the source away, and
 *    has to survive a style rebuild that already took them.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { DawarichTrack, DawarichTrackDay } from '@trek/shared'
import { DAWARICH_DAY_COLORS, DAWARICH_TRAIL_CASING } from './dawarichTrail'
import { useDawarichTrailGL } from './useDawarichTrailGL'

const SOURCE = 'trek-dawarich-trail'
const CASING_LAYER = 'trek-dawarich-trail-casing'
const LINE_LAYER = 'trek-dawarich-trail-line'

interface FakeSource {
  data: unknown
  setData: ReturnType<typeof vi.fn>
}

/**
 * A GL map double that keeps real registries rather than returning fixed
 * values: the hook asks "is this already there?" before every decision it
 * makes, so a double that always answers the same way cannot exercise the
 * decisions at all.
 */
function fakeGlMap({ styleLoaded = true, styleLayers = [] as string[] } = {}) {
  const sources = new Map<string, FakeSource>()
  const layers = new Map<string, { spec: { id: string; paint?: Record<string, unknown> }; before: string | undefined }>()
  for (const id of styleLayers) layers.set(id, { spec: { id }, before: undefined })
  const listeners = new Map<string, Set<() => void>>()
  const onceListeners = new Map<string, Set<() => void>>()

  const state = { styleLoaded }
  const map = {
    isStyleLoaded: vi.fn(() => state.styleLoaded),
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, spec: { type: string; data: unknown }) => {
      const entry: FakeSource = {
        data: spec.data,
        setData: vi.fn((next: unknown) => { entry.data = next }),
      }
      sources.set(id, entry)
    }),
    removeSource: vi.fn((id: string) => { sources.delete(id) }),
    getLayer: vi.fn((id: string) => layers.get(id)),
    addLayer: vi.fn((spec: { id: string; paint?: Record<string, unknown> }, before?: string) => {
      layers.set(spec.id, { spec, before })
    }),
    removeLayer: vi.fn((id: string) => { layers.delete(id) }),
    on: vi.fn((type: string, fn: () => void) => {
      const set = listeners.get(type) ?? new Set<() => void>()
      set.add(fn)
      listeners.set(type, set)
    }),
    once: vi.fn((type: string, fn: () => void) => {
      const set = onceListeners.get(type) ?? new Set<() => void>()
      set.add(fn)
      onceListeners.set(type, set)
    }),
    off: vi.fn((type: string, fn: () => void) => {
      listeners.get(type)?.delete(fn)
      onceListeners.get(type)?.delete(fn)
    }),
  }

  return {
    map: map as unknown as MapboxMap,
    spies: map,
    sources,
    layers,
    state,
    styleLoadListeners: () => listeners.get('style.load')?.size ?? 0,
    emitStyleLoad: () => { listeners.get('style.load')?.forEach(fn => fn()) },
    idleListeners: () => onceListeners.get('idle')?.size ?? 0,
    /** A `once` listener is gone before it runs, the way GL's Evented does it. */
    emitIdle: () => {
      const pending = [...(onceListeners.get('idle') ?? [])]
      onceListeners.delete('idle')
      pending.forEach(fn => fn())
    },
    /** What a style rebuild does to the map before `style.load` fires. */
    dropStyle: () => { sources.clear(); layers.clear() },
    drawn: () => sources.get(SOURCE)?.data as
      | { features: Array<{ properties: { color: string; date: string }; geometry: { coordinates: Array<[number, number]> } }> }
      | undefined,
  }
}

interface Props {
  map: MapboxMap | null
  ready: boolean
  track?: DawarichTrack | null
  date?: string | null
  before?: string
  hidden?: ReadonlySet<string> | null
}

const mount = (props: Props) =>
  renderHook((p: Props) => useDawarichTrailGL(p.map, p.ready, p.track, p.date, p.before, p.hidden), {
    initialProps: props,
  })

function day(date: string, ...segments: Array<Array<[number, number]>>): DawarichTrackDay {
  return {
    date,
    segments: segments.map(points => ({
      points,
      mode: 'driving',
      startedAt: date + 'T08:00:00.000Z',
      endedAt: date + 'T09:00:00.000Z',
      distanceMeters: 4200,
    })),
  }
}

function track(days: DawarichTrackDay[]): DawarichTrack {
  return { days, source: 'tracks', fetchedAt: '2026-05-03T10:00:00.000Z', pointCount: 4, truncated: false }
}

const DAY_ONE = day('2026-05-01', [[48.2, 16.37], [48.21, 16.38]])
const DAY_TWO = day('2026-05-02', [[45.46, 9.18], [45.47, 9.19]])

describe('useDawarichTrailGL', () => {
  it('FE-DAWARICH-TRAILUI-020: touches nothing before there is a map and a ready style', () => {
    const gl = fakeGlMap()
    const view = mount({ map: null, ready: true, track: track([DAY_ONE]) })
    expect(gl.spies.addSource).not.toHaveBeenCalled()

    // A map that exists but is not ready is the more dangerous half: the object
    // answers every call and throws from inside GL rather than from here.
    view.rerender({ map: gl.map, ready: false, track: track([DAY_ONE]) })
    expect(gl.spies.addSource).not.toHaveBeenCalled()
    expect(gl.styleLoadListeners()).toBe(0)

    view.rerender({ map: gl.map, ready: true, track: track([DAY_ONE]) })
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-TRAILUI-021: builds the source and both layers under TREK-prefixed ids, anchored below the planned route', () => {
    const gl = fakeGlMap({ styleLayers: ['trip-route-casing'] })
    mount({ map: gl.map, ready: true, track: track([DAY_ONE]), before: 'trip-route-casing' })

    expect(gl.spies.addSource).toHaveBeenCalledWith(SOURCE, expect.objectContaining({ type: 'geojson' }))

    const [casingCall, lineCall] = gl.spies.addLayer.mock.calls
    expect(casingCall[0].id).toBe(CASING_LAYER)
    expect(casingCall[0].paint['line-color']).toBe(DAWARICH_TRAIL_CASING)
    expect(casingCall[0].paint['line-width']).toBe(6)
    expect(lineCall[0].id).toBe(LINE_LAYER)
    // Per-feature colour, with the casing white as the fallback a feature
    // without one falls back to. The GPX layer uses the same shape.
    expect(lineCall[0].paint['line-color']).toEqual(['coalesce', ['get', 'color'], DAWARICH_TRAIL_CASING])
    // Dashed, so the recording is distinguishable from the planned route for
    // someone who cannot tell the two hues apart.
    expect(lineCall[0].paint['line-dasharray']).toEqual([2, 1.6])

    // Both go beneath the planned route's casing. The line is inserted second
    // and therefore ends up above its own casing and still below the plan.
    expect(casingCall[1]).toBe('trip-route-casing')
    expect(lineCall[1]).toBe('trip-route-casing')
  })

  it('FE-DAWARICH-TRAILUI-022: appends on top when the anchor layer is not on the style', () => {
    // The trip-route overlay may not have mounted yet, or may be switched off
    // entirely. Passing its id to addLayer then throws, so the hook has to look
    // before it leaps and simply append instead.
    const absent = fakeGlMap()
    mount({ map: absent.map, ready: true, track: track([DAY_ONE]), before: 'trip-route-casing' })
    expect(absent.spies.addLayer.mock.calls.map(call => call[1])).toEqual([undefined, undefined])

    const none = fakeGlMap()
    mount({ map: none.map, ready: true, track: track([DAY_ONE]) })
    expect(none.spies.addLayer.mock.calls.map(call => call[1])).toEqual([undefined, undefined])
  })

  it('FE-DAWARICH-TRAILUI-023: waits for style.load instead of drawing into a half-loaded style', () => {
    const gl = fakeGlMap({ styleLoaded: false })
    mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })

    expect(gl.spies.addSource).not.toHaveBeenCalled()
    expect(gl.styleLoadListeners()).toBe(1)

    // The whole GL map is torn down and reassembled when the provider, the
    // style or the token changes; this subscription is what puts the overlay
    // back afterwards.
    gl.state.styleLoaded = true
    gl.emitStyleLoad()
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1)
    expect(gl.spies.addLayer).toHaveBeenCalledTimes(2)
  })

  it('FE-DAWARICH-TRAILUI-024: updates a surviving source in place rather than rebuilding it', () => {
    const gl = fakeGlMap()
    mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1)

    // A style change that kept its sources, which is what setStyle does when it
    // can diff the two. Rebuilding the source here would flicker the line for
    // nothing, so the hook writes into the one that is already on the map.
    gl.emitStyleLoad()
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1)
    expect(gl.spies.addLayer).toHaveBeenCalledTimes(2)
    expect(gl.sources.get(SOURCE)?.setData).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-TRAILUI-025: hands GL the recording in GeoJSON order, and an empty collection when there is none', () => {
    const empty = fakeGlMap()
    mount({ map: empty.map, ready: true, track: null })
    // An empty collection rather than a skipped source: the layers still have
    // to be on the style, so a style change that keeps its sources finds
    // something to write into instead of leaving the map bare.
    expect(empty.drawn()?.features).toEqual([])

    // The track parameter is optional, so the overlay also has to build before
    // anyone has handed the hook a track at all. Same empty collection, reached
    // through the `?? null` rather than through an explicit null.
    const unfetched = fakeGlMap()
    mount({ map: unfetched.map, ready: true })
    expect(unfetched.drawn()?.features).toEqual([])

    const gl = fakeGlMap()
    mount({ map: gl.map, ready: true, track: track([DAY_ONE, DAY_TWO]) })
    const features = gl.drawn()?.features ?? []
    expect(features).toHaveLength(2)
    // TREK stores [lat, lng] everywhere; GeoJSON wants the other order, and the
    // overlay is the single place that flips it. Getting this backwards puts
    // Vienna in the Indian Ocean.
    expect(features[0].geometry.coordinates).toEqual([[16.37, 48.2], [16.38, 48.21]])
    expect(features[0].properties.color).toBe(DAWARICH_DAY_COLORS[0])
    expect(features[1].properties.color).toBe(DAWARICH_DAY_COLORS[1])
  })

  it('FE-DAWARICH-TRAILUI-026: redraws for a picked day without repainting it', () => {
    const gl = fakeGlMap()
    const view = mount({ map: gl.map, ready: true, track: track([DAY_ONE, DAY_TWO]) })

    view.rerender({ map: gl.map, ready: true, track: track([DAY_ONE, DAY_TWO]), date: '2026-05-02' })
    const features = gl.drawn()?.features ?? []
    expect(features).toHaveLength(1)
    expect(features[0].properties.date).toBe('2026-05-02')
    // Still the second hue, because the index comes from the day's place in the
    // whole track. Picking a day must dim the others, not recolour the one.
    expect(features[0].properties.color).toBe(DAWARICH_DAY_COLORS[1])
  })

  it('FE-DAWARICH-TRAILUI-027: takes both layers and the source away with it, and stops listening', () => {
    const gl = fakeGlMap()
    const view = mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })

    view.unmount()

    // Layers before the source, in that order: a GL map refuses to remove a
    // source that still carries a layer, so a teardown that started with the
    // source would throw and leave both layers behind.
    expect(gl.spies.removeLayer.mock.calls.map(call => call[0])).toEqual([LINE_LAYER, CASING_LAYER])
    expect(gl.spies.removeSource).toHaveBeenCalledWith(SOURCE)
    expect(gl.layers.size).toBe(0)
    expect(gl.sources.size).toBe(0)
    expect(gl.styleLoadListeners()).toBe(0)
  })

  it('FE-DAWARICH-TRAILUI-028: does not try to remove what a style rebuild already took', () => {
    const gl = fakeGlMap()
    const view = mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })

    // setStyle drops every source and layer the previous style carried. The
    // teardown then runs against a map that has never heard of them, and a
    // blind removeLayer there throws out of a cleanup function.
    gl.dropStyle()
    view.unmount()

    expect(gl.spies.removeLayer).not.toHaveBeenCalled()
    expect(gl.spies.removeSource).not.toHaveBeenCalled()
    expect(gl.spies.off).toHaveBeenCalledWith('style.load', expect.any(Function))
  })

  it('FE-DAWARICH-TRAILUI-029: rebuilds the overlay when the refresh hands it a new track, without leaving a listener behind', () => {
    const gl = fakeGlMap()
    const view = mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })
    const firstSource = gl.sources.get(SOURCE)
    expect(firstSource?.setData).toBeTypeOf('function')

    // `useDawarichTrail` refetches every two minutes and returns a fresh object
    // every time, so the effect's dependency changes and React tears the whole
    // overlay down before rebuilding it. The setData path above belongs to a
    // style change that kept its sources, not to a refresh. Pinned as the
    // behaviour it is, so that making the refresh cheap later is a visible
    // change to this file rather than a silent one on the map.
    view.rerender({ map: gl.map, ready: true, track: track([DAY_ONE, DAY_TWO]) })

    expect(gl.spies.removeSource).toHaveBeenCalledWith(SOURCE)
    expect(gl.spies.addSource).toHaveBeenCalledTimes(2)
    expect(firstSource?.setData).not.toHaveBeenCalled()
    expect(gl.drawn()?.features).toHaveLength(2)

    // One subscription, not two. The cleanup unsubscribes before the next
    // effect subscribes; without that the overlay would redraw once per style
    // change per refresh, for as long as the map lives.
    expect(gl.styleLoadListeners()).toBe(1)
  })

  it('FE-DAWARICH-TRAILUI-030: a route that lands while tiles are still loading is drawn once they have arrived', () => {
    // The tester's case: the overlay switched on, the map still filling in,
    // and the line only appearing after a reload.
    const gl = fakeGlMap({ styleLoaded: false })
    mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })

    expect(gl.spies.addSource).not.toHaveBeenCalled()
    expect(gl.idleListeners()).toBe(1)

    gl.state.styleLoaded = true
    gl.emitIdle()

    expect(gl.spies.addSource).toHaveBeenCalledTimes(1)
    expect(gl.spies.addLayer).toHaveBeenCalledTimes(2)
    expect(gl.idleListeners()).toBe(0)
  })

  it('FE-DAWARICH-TRAILUI-031: waits for idle once however often it is asked, and keeps waiting while the map is busy', () => {
    const gl = fakeGlMap({ styleLoaded: false })
    const view = mount({ map: gl.map, ready: true, track: track([DAY_ONE]) })

    // A style.load that fires while tiles are still in flight is a second draw
    // attempt; it must not stack a second wait on the first.
    gl.emitStyleLoad()
    expect(gl.idleListeners()).toBe(1)

    // An idle that arrives before the style is ready (a transition finished,
    // another source started) is not the end of the wait.
    gl.emitIdle()
    expect(gl.spies.addSource).not.toHaveBeenCalled()
    expect(gl.idleListeners()).toBe(1)

    view.unmount()
    expect(gl.idleListeners()).toBe(0)
    expect(gl.spies.off).toHaveBeenCalledWith('idle', expect.any(Function))
  })

  it('FE-DAWARICH-TRAILUI-032: leaves out the days folded away in the day plan without repainting the others', () => {
    const gl = fakeGlMap()
    const view = mount({ map: gl.map, ready: true, track: track([DAY_ONE, DAY_TWO]) })
    const secondColour = gl.drawn()?.features[1]?.properties.color

    view.rerender({ map: gl.map, ready: true, track: track([DAY_ONE, DAY_TWO]), hidden: new Set([DAY_ONE.date]) })

    expect(gl.drawn()?.features).toHaveLength(1)
    expect(gl.drawn()?.features[0]?.properties.date).toBe(DAY_TWO.date)
    expect(gl.drawn()?.features[0]?.properties.color).toBe(secondColour)
  })
})
