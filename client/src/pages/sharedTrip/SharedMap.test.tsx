import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { computeMapViewport, TILE_SIZE_RASTER } from '../../utils/mapViewport'
import { SharedMap, type MapPlace } from './SharedMap'

// The camera the map opened with, and every fit made after it.
const mounted: { center: [number, number]; zoom: number }[] = []
const fitBounds = vi.fn()

vi.mock('react-leaflet', () => ({
  MapContainer: ({ center, zoom, children }: { center: [number, number]; zoom: number; children: ReactNode }) => {
    mounted.push({ center, zoom })
    return <div data-testid="map-container">{children}</div>
  },
  TileLayer: () => null,
  Marker: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Polyline: () => null,
  Tooltip: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  useMap: () => ({ fitBounds }),
}))
vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../components/Map/VectorBasemap', () => ({ default: () => null }))

// Synthetic points: a dense cluster plus a spread over a small region, wider than tall.
const places: MapPlace[] = [
  { id: 1, name: 'A', lat: 52.37, lng: 4.89 },
  { id: 2, name: 'B', lat: 52.372, lng: 4.893 },
  { id: 3, name: 'C', lat: 52.33, lng: 5.42 },
  { id: 4, name: 'D', lat: 52.35, lng: 4.3 },
  { id: 5, name: 'E', lat: 52.4, lng: 4.98 },
]

const PADDING = { top: 64, right: 48, bottom: 48, left: 48 }

let cardSize = { width: 0, height: 0 }
const realWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
const realHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')

function renderMap(list: MapPlace[] = places) {
  return render(
    <SharedMap places={list} line={[]} orderByPlace={{}} days={[]} selectedDay={null} onSelectDay={() => {}} />,
  )
}

describe('SharedMap opening frame (#2549)', () => {
  beforeEach(() => {
    mounted.length = 0
    fitBounds.mockClear()
    // A desktop window far larger than the map card, which is what exposed the bug.
    vi.stubGlobal('innerWidth', 1920)
    vi.stubGlobal('innerHeight', 1080)
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => cardSize.width })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => cardSize.height })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (realWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', realWidth)
    if (realHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', realHeight)
  })

  it('FE-SHARED-MAP-001: frames the places for the card it sits in, not for the browser window', () => {
    cardSize = { width: 750, height: 338 }
    renderMap()

    const forCard = computeMapViewport(places, { tileSize: TILE_SIZE_RASTER, padding: PADDING, maxZoom: 14, width: 750, height: 338 })!
    const forWindow = computeMapViewport(places, { tileSize: TILE_SIZE_RASTER, padding: PADDING, maxZoom: 14 })!
    expect(mounted).toHaveLength(1)
    expect(mounted[0].zoom).toBe(Math.floor(forCard.zoom))
    expect(mounted[0].center).toEqual(forCard.center)
    // The window-sized frame is the over-zoomed one the issue saw.
    expect(mounted[0].zoom).toBeLessThan(Math.floor(forWindow.zoom))
    // Opened framed, so there is nothing for the first fit to correct.
    expect(fitBounds).not.toHaveBeenCalled()
  })

  it('FE-SHARED-MAP-002: opens on a whole zoom level, as fitBounds does', () => {
    cardSize = { width: 750, height: 338 }
    renderMap()
    expect(Number.isInteger(mounted[0].zoom)).toBe(true)
  })

  it('FE-SHARED-MAP-003: a card without layout lets the first fit do the framing', () => {
    cardSize = { width: 0, height: 0 }
    renderMap()
    expect(fitBounds).toHaveBeenCalledTimes(1)
    expect(fitBounds.mock.calls[0][1]).toEqual({ paddingTopLeft: [48, 64], paddingBottomRight: [48, 48], maxZoom: 14 })
  })

  it('FE-SHARED-MAP-004: a new set of places (a picked day) still refits with the same frame', () => {
    cardSize = { width: 750, height: 338 }
    const { rerender } = renderMap()
    expect(fitBounds).not.toHaveBeenCalled()
    rerender(
      <SharedMap places={places.slice(0, 2)} line={[]} orderByPlace={{}} days={[]} selectedDay={1} onSelectDay={() => {}} />,
    )
    expect(fitBounds).toHaveBeenCalledTimes(1)
    expect(fitBounds.mock.calls[0][1]).toEqual({ paddingTopLeft: [48, 64], paddingBottomRight: [48, 48], maxZoom: 14 })
  })
})
