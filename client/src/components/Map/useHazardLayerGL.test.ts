/**
 * FE-ROADTRIP-HAZARDGL-001 to FE-ROADTRIP-HAZARDGL-003: when the hazard overlay
 * on the GL renderer actually gets drawn.
 *
 * It shares a failure with the recorded Dawarich route: `isStyleLoaded()` is
 * false while any source still has tiles in flight, not only before the first
 * style. A draw that gave up there and waited for `style.load` alone stayed off
 * the map until the style was rebuilt, which in practice meant a reload. These
 * cases pin the wait for `idle` that replaced it, and that the wait does not
 * outlive the component.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Map as MapboxMap, Popup } from 'mapbox-gl'
import type { RoadtripHazard } from '@trek/shared'
import { useHazardLayerGL } from './useHazardLayerGL'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

const SOURCE = 'roadtrip-hazards'

const HAZARD: RoadtripHazard = {
  id: 'dwd-1',
  source: 'DWD',
  title: 'Sturmboeen',
  description: 'Boeen bis 85 km/h',
  updatedAt: '2026-09-14T10:00:00.000Z',
  validUntil: null,
  url: 'https://www.dwd.de/warnungen',
  geometry: { type: 'Point', coordinates: [13.4, 52.5] },
}

function fakeGlMap(styleLoaded: boolean) {
  const sources = new Set<string>()
  const layers = new Set<string>()
  const once = new Map<string, Set<() => void>>()
  const state = { styleLoaded }
  const map = {
    isStyleLoaded: vi.fn(() => state.styleLoaded),
    getSource: vi.fn((id: string) => (sources.has(id) ? {} : undefined)),
    addSource: vi.fn((id: string) => { sources.add(id) }),
    removeSource: vi.fn((id: string) => { sources.delete(id) }),
    getLayer: vi.fn((id: string) => (layers.has(id) ? {} : undefined)),
    addLayer: vi.fn((spec: { id: string }) => { layers.add(spec.id) }),
    removeLayer: vi.fn((id: string) => { layers.delete(id) }),
    on: vi.fn(),
    once: vi.fn((type: string, fn: () => void) => {
      const set = once.get(type) ?? new Set<() => void>()
      set.add(fn)
      once.set(type, set)
    }),
    off: vi.fn((type: string, fn: () => void) => { once.get(type)?.delete(fn) }),
  }
  return {
    map: map as unknown as MapboxMap,
    spies: map,
    state,
    sources,
    idleListeners: () => once.get('idle')?.size ?? 0,
    emitIdle: () => {
      const pending = [...(once.get('idle') ?? [])]
      once.delete('idle')
      pending.forEach(fn => fn())
    },
  }
}

const popup = () => ({}) as Popup

describe('useHazardLayerGL', () => {
  it('FE-ROADTRIP-HAZARDGL-001: draws straight away into a style that is ready', () => {
    const gl = fakeGlMap(true)
    renderHook(() => useHazardLayerGL(gl.map, true, [HAZARD], popup))

    expect(gl.spies.addSource).toHaveBeenCalledWith(SOURCE, expect.objectContaining({ type: 'geojson' }))
    expect(gl.spies.addLayer).toHaveBeenCalledTimes(3)
    expect(gl.idleListeners()).toBe(0)
  })

  it('FE-ROADTRIP-HAZARDGL-002: hazards that arrive while tiles are loading are drawn once the map is idle', () => {
    const gl = fakeGlMap(false)
    renderHook(() => useHazardLayerGL(gl.map, true, [HAZARD], popup))
    expect(gl.spies.addSource).not.toHaveBeenCalled()
    expect(gl.idleListeners()).toBe(1)

    // Still busy at the first idle: wait again, and only once.
    gl.emitIdle()
    expect(gl.spies.addSource).not.toHaveBeenCalled()
    expect(gl.idleListeners()).toBe(1)

    gl.state.styleLoaded = true
    gl.emitIdle()
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1)
    expect(gl.idleListeners()).toBe(0)
  })

  it('FE-ROADTRIP-HAZARDGL-003: an unmount while waiting takes the wait with it', () => {
    const gl = fakeGlMap(false)
    const view = renderHook(() => useHazardLayerGL(gl.map, true, [HAZARD], popup))

    view.unmount()

    expect(gl.idleListeners()).toBe(0)
    expect(gl.spies.off).toHaveBeenCalledWith('idle', expect.any(Function))
    expect(gl.sources.size).toBe(0)
  })
})
