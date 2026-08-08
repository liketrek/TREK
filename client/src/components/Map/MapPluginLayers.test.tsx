// FE-COMP-MAPPLUGINLAYERS-001 to FE-COMP-MAPPLUGINLAYERS-009
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import type { PluginMapLayer, PluginMapLayerFeature } from '../../api/client'

interface PathProps {
  positions?: [number, number][]
  center?: [number, number]
  radius?: number
  pathOptions?: Record<string, unknown>
  children?: React.ReactNode
}

// react-leaflet primitives are replaced by markers that surface exactly what the
// component controls: geometry, the path options and the pane it draws into.
const mapHolder = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('react-leaflet', () => ({
  Polyline: ({ positions, pathOptions, children }: PathProps) => (
    <div data-testid="polyline" data-points={JSON.stringify(positions)} data-path-options={JSON.stringify(pathOptions)}>{children}</div>
  ),
  Polygon: ({ positions, pathOptions, children }: PathProps) => (
    <div data-testid="polygon" data-points={JSON.stringify(positions)} data-path-options={JSON.stringify(pathOptions)}>{children}</div>
  ),
  Circle: ({ center, radius, pathOptions, children }: PathProps) => (
    <div data-testid="circle" data-center={JSON.stringify(center)} data-radius={radius} data-path-options={JSON.stringify(pathOptions)}>{children}</div>
  ),
  Tooltip: ({ children }: { children?: React.ReactNode }) => <span data-testid="tooltip">{children}</span>,
  useMap: () => mapHolder.current,
}))

import { PluginMapLayers } from './MapPluginLayers'

function paneMap(preexisting = false) {
  const panes = new Map<string, HTMLElement>()
  if (preexisting) panes.set('trek-plugin-layers', document.createElement('div'))
  return {
    panes,
    getPane: vi.fn((name: string) => panes.get(name)),
    createPane: vi.fn((name: string) => {
      const el = document.createElement('div')
      panes.set(name, el)
      return el
    }),
  }
}

function feature(overrides: Partial<PluginMapLayerFeature> = {}): PluginMapLayerFeature {
  return {
    type: 'polyline',
    points: [[48.85, 2.35], [48.86, 2.36]],
    tone: 'default',
    width: 3,
    dash: 'solid',
    opacity: 0.8,
    fill: false,
    ...overrides,
  }
}

function layer(features: PluginMapLayerFeature[], overrides: Partial<PluginMapLayer> = {}): PluginMapLayer {
  return { pluginId: 'ev-router', id: 'corridor', features, ...overrides }
}

function serveLayers(layers: PluginMapLayer[]) {
  server.use(http.get('/api/map-layers/:tripId', () => HttpResponse.json({ layers })))
}

const optionsOf = (el: HTMLElement) => JSON.parse(el.getAttribute('data-path-options') || '{}') as Record<string, unknown>

beforeEach(() => {
  mapHolder.current = paneMap() as unknown as Record<string, unknown>
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('PluginMapLayers', () => {
  it('FE-COMP-MAPPLUGINLAYERS-001: renders nothing without a trip', async () => {
    let requests = 0
    server.use(http.get('/api/map-layers/:tripId', () => { requests += 1; return HttpResponse.json({ layers: [] }) }))

    render(<PluginMapLayers />)
    await waitFor(() => expect(screen.queryByTestId('polyline')).toBeNull())
    expect(requests).toBe(0)
  })

  it('FE-COMP-MAPPLUGINLAYERS-002: creates the below-overlay pane and draws into it', async () => {
    const map = paneMap()
    mapHolder.current = map as unknown as Record<string, unknown>
    serveLayers([layer([feature()])])

    render(<PluginMapLayers tripId={4} />)
    const line = await screen.findByTestId('polyline')

    expect(map.createPane).toHaveBeenCalledWith('trek-plugin-layers')
    // Core geometry (overlayPane, 400) has to stay on top of plugin shapes.
    expect(map.panes.get('trek-plugin-layers')?.style.zIndex).toBe('399')
    expect(optionsOf(line).pane).toBe('trek-plugin-layers')
  })

  it('FE-COMP-MAPPLUGINLAYERS-003: reuses an existing pane instead of creating a second one', async () => {
    const map = paneMap(true)
    mapHolder.current = map as unknown as Record<string, unknown>
    serveLayers([layer([feature()])])

    render(<PluginMapLayers tripId={4} />)
    await screen.findByTestId('polyline')

    expect(map.createPane).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPPLUGINLAYERS-004: still draws on a map without the pane API, just without a pane', async () => {
    mapHolder.current = {}
    serveLayers([layer([feature()])])

    render(<PluginMapLayers tripId={4} />)
    const line = await screen.findByTestId('polyline')
    expect(optionsOf(line)).not.toHaveProperty('pane')
  })

  it('FE-COMP-MAPPLUGINLAYERS-005: draws polylines, polygons and metric circles', async () => {
    serveLayers([layer([
      feature({ type: 'polyline' }),
      feature({ type: 'polygon', points: [[48, 2], [48, 3], [49, 3]] }),
      feature({ type: 'circle', points: undefined, center: [48.8, 2.3], radiusM: 750 }),
    ])])

    render(<PluginMapLayers tripId={4} />)
    await screen.findByTestId('polyline')

    expect(JSON.parse(screen.getByTestId('polygon').getAttribute('data-points') || '')).toEqual([[48, 2], [48, 3], [49, 3]])
    const circle = screen.getByTestId('circle')
    expect(JSON.parse(circle.getAttribute('data-center') || '')).toEqual([48.8, 2.3])
    expect(circle.getAttribute('data-radius')).toBe('750')
  })

  it('FE-COMP-MAPPLUGINLAYERS-006: maps tone, width, dash and fill onto the leaflet path options', async () => {
    serveLayers([layer([
      feature({ tone: 'danger', width: 6, dash: 'dash', opacity: 0.5 }),
      feature({ type: 'polygon', tone: 'success', dash: 'dot', opacity: 0.9, fill: true }),
    ])])

    render(<PluginMapLayers tripId={4} />)
    const line = await screen.findByTestId('polyline')

    expect(optionsOf(line)).toMatchObject({
      color: '#ef4444',
      weight: 6,
      opacity: 0.5,
      dashArray: '8, 8',
      fill: false,
      fillOpacity: 0,
    })
    // A filled shape is capped at 0.25 so it never hides the basemap underneath.
    expect(optionsOf(screen.getByTestId('polygon'))).toMatchObject({
      color: '#10b981',
      dashArray: '1, 7',
      fill: true,
      fillOpacity: 0.25,
    })
  })

  it('FE-COMP-MAPPLUGINLAYERS-007: only a labelled feature gets a tooltip and stays clickable', async () => {
    serveLayers([layer([
      feature({ label: 'Charging corridor' }),
      feature({ type: 'polygon' }),
    ])])

    render(<PluginMapLayers tripId={4} />)
    const line = await screen.findByTestId('polyline')

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Charging corridor')
    expect(optionsOf(line).interactive).toBe(true)
    // Unlabelled shapes must never steal a map click.
    expect(optionsOf(screen.getByTestId('polygon')).interactive).toBe(false)
    expect(screen.getAllByTestId('tooltip')).toHaveLength(1)
  })

  it('FE-COMP-MAPPLUGINLAYERS-008: skips features whose geometry is incomplete', async () => {
    serveLayers([layer([
      feature({ type: 'polyline', points: undefined }),
      feature({ type: 'polygon', points: undefined }),
      feature({ type: 'circle', points: undefined, center: [48, 2] }),
      feature({ type: 'circle', points: undefined, radiusM: 500 }),
      feature({ label: 'kept' }),
    ])])

    render(<PluginMapLayers tripId={4} />)
    await screen.findByTestId('polyline')

    expect(screen.getAllByTestId('polyline')).toHaveLength(1)
    expect(screen.queryByTestId('polygon')).toBeNull()
    expect(screen.queryByTestId('circle')).toBeNull()
  })

  it('FE-COMP-MAPPLUGINLAYERS-009: a failing request leaves the map without plugin overlays', async () => {
    serveLayers([layer([feature()])])
    const { rerender } = render(<PluginMapLayers tripId={4} />)
    await screen.findByTestId('polyline')

    server.use(http.get('/api/map-layers/:tripId', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    rerender(<PluginMapLayers tripId={9} />)

    await waitFor(() => expect(screen.queryByTestId('polyline')).toBeNull())
  })
})
