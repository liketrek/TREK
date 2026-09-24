import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TripOverviewDay } from '../Map/tripRouteGeometry'

vi.mock('../../utils/webgl', () => ({ hasWebGL: vi.fn(() => true), resetWebGLProbe: vi.fn() }))

const { hasWebGL } = await import('../../utils/webgl')
const { renderTripMapImage } = await import('./tripMapImage')

const day = (over: Partial<TripOverviewDay> = {}): TripOverviewDay => ({
  dayId: 1, dayNumber: 1, date: null, title: null, color: { line: '#0a84ff', casing: '#0a5cc2' },
  lines: [[[48.86, 2.35], [48.88, 2.40]]],
  segments: [], distance: 0, duration: 0, modes: [], ...over,
})

const opts = { width: 720, height: 420, style: null, formatDistance: (km: number) => `${km} km` }

beforeEach(() => {
  vi.mocked(hasWebGL).mockReturnValue(true)
  document.body.innerHTML = ''
})

describe('renderTripMapImage', () => {
  it('FE-PDF-MAPIMG-001: gives up without WebGL, before touching the map engine', async () => {
    vi.mocked(hasWebGL).mockReturnValue(false)
    expect(await renderTripMapImage([day()], opts)).toBeNull()
  })

  it('FE-PDF-MAPIMG-002: gives up when there is no route to frame', async () => {
    expect(await renderTripMapImage([], opts)).toBeNull()
    expect(await renderTripMapImage([day({ lines: [[[48.86, 2.35]]] })], opts)).toBeNull()
  })

  it('FE-PDF-MAPIMG-003: returns null rather than throwing when the engine fails', async () => {
    // jsdom has no WebGL implementation behind the probe, so constructing the map
    // throws — the export must survive that and fall back to the outline map.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await renderTripMapImage([day()], opts)).toBeNull()
    warn.mockRestore()
  })

  it('FE-PDF-MAPIMG-004: leaves no offscreen container behind', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await renderTripMapImage([day()], opts)
    expect(document.body.children).toHaveLength(0)
    warn.mockRestore()
  })
})
