/**
 * Clicking a place pin after the map has been dragged (#2504).
 *
 * Nothing Leaflet-related is mocked here on purpose. The bug lived in the space between
 * our drag wiring and Leaflet's own event routing: the pins swallow mousedown so a drag
 * onto a day can start without the map sliding away, and Leaflet only forgets that the
 * map was panned when it sees the next mousedown. A mocked react-leaflet, like the one
 * MapView.test.tsx uses, has no such memory and kept passing throughout.
 *
 * The click itself has to keep taking Leaflet's route and the page's: it is what closes
 * an open popup on the map, and an open context menu beside it.
 */
import React, { useState } from 'react'
import { flushSync } from 'react-dom'
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, waitFor, act } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace } from '../../../tests/helpers/factories'

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({ position: null, mode: 'off', error: null, errorCode: null, cycleMode: vi.fn(), setMode: vi.fn() }),
}))

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  getAllThumbs: vi.fn(() => ({})),
}))

import L from 'leaflet'
import { MapView } from './MapView'
import { ContextMenu } from '../shared/ContextMenu'

// Every map this file builds, newest last, for the tests that reach past the component.
const maps: L.Map[] = []
L.Map.addInitHook(function (this: L.Map) { maps.push(this) })

// A raster template keeps the basemap a plain TileLayer: the vector default needs WebGL.
const RASTER = 'https://tiles.example.test/{z}/{x}/{y}.png'

// Leaflet sizes the map from the container, which jsdom lays out at 0 x 0. The cluster
// group only draws pins inside the visible bounds, so the map needs a real size.
const sized = ['clientWidth', 'clientHeight'] as const
const originals = new Map<string, PropertyDescriptor | undefined>()
beforeAll(() => {
  // The pans here are synthetic and instant. With inertia, Leaflet would carry them on in
  // animation frames that can land after a test has already unmounted its map.
  L.Map.mergeOptions({ inertia: false })
  for (const key of sized) {
    originals.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key))
    Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => (key === 'clientWidth' ? 1000 : 700) })
  }
})
afterAll(() => {
  L.Map.mergeOptions({ inertia: true })
  for (const key of sized) {
    const original = originals.get(key)
    if (original) Object.defineProperty(HTMLElement.prototype, key, original)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  }
})

afterEach(() => {
  resetAllStores()
})

/** Leaflet only starts a pan for the primary button, which it reads off `which`. */
function mouse(type: string, x: number, y: number): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })
  Object.defineProperty(event, 'which', { value: 1 })
  return event
}

/** Drag the map by its background, the way a user pans it. */
function panMap(container: Element) {
  act(() => {
    container.dispatchEvent(mouse('mousedown', 300, 300))
    container.dispatchEvent(mouse('mousemove', 340, 320))
    container.dispatchEvent(mouse('mousemove', 380, 340))
    container.dispatchEvent(mouse('mouseup', 380, 340))
  })
}

/** A plain click on an element: press, release, click, all on the same spot. */
function clickOn(el: Element) {
  act(() => {
    el.dispatchEvent(mouse('mousedown', 500, 350))
    el.dispatchEvent(mouse('mouseup', 500, 350))
    el.dispatchEvent(mouse('click', 500, 350))
  })
}

// Two stops a few hundred metres apart in Nara: separate pins at this zoom, not a cluster.
const places = [
  { ...buildPlace({ id: 1, name: 'Todai-ji', lat: 34.689, lng: 135.8398 }), category_name: null, category_color: null, category_icon: null },
  { ...buildPlace({ id: 2, name: 'Kasuga Taisha', lat: 34.6812, lng: 135.8484 }), category_name: null, category_color: null, category_icon: null },
]

async function renderMap() {
  const onMarkerClick = vi.fn()
  const onMapClick = vi.fn()
  const view = render(
    <MapView places={places} center={[34.685, 135.844]} zoom={15} tileUrl={RASTER} onMarkerClick={onMarkerClick} onMapClick={onMapClick} />,
  )
  const container = view.container.querySelector('.leaflet-container') as HTMLElement
  // The cluster group takes its markers in on a timer (chunkedLoading).
  await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon[draggable="true"]').length).toBe(2))
  const pins = [...container.querySelectorAll('.leaflet-marker-icon[draggable="true"]')] as HTMLElement[]
  return { container, pins, onMarkerClick, onMapClick }
}

describe('MapView on a real Leaflet map', () => {
  it('FE-MAPCLICK-001: a pin opens its place on a map nobody has dragged yet', async () => {
    const { pins, onMarkerClick, onMapClick } = await renderMap()
    clickOn(pins[0])
    expect(onMarkerClick).toHaveBeenCalledTimes(1)
    // Still the marker's click, not one on the empty map behind it.
    expect(onMapClick).not.toHaveBeenCalled()
  })

  it('FE-MAPCLICK-002: a pin still opens its place after the map was dragged (#2504)', async () => {
    const { container, pins, onMarkerClick, onMapClick } = await renderMap()
    panMap(container)
    clickOn(pins[0])
    expect(onMarkerClick).toHaveBeenCalledTimes(1)
    // And again: the report was that every click after the pan went nowhere.
    clickOn(pins[1])
    expect(onMarkerClick).toHaveBeenCalledTimes(2)
    expect(onMarkerClick.mock.calls.map(call => call[0]).sort()).toEqual([1, 2])
    expect(onMapClick).not.toHaveBeenCalled()
  })

  it('FE-MAPCLICK-003: the click that ends a pan still counts for nothing', async () => {
    const { container, onMarkerClick, onMapClick } = await renderMap()
    panMap(container)
    // The browser aims the click that closes a drag at the element both ends share,
    // which is the map rather than the pin the pointer happened to stop on. Leaflet
    // swallows it, and must go on doing so: it is not a click on the empty map either.
    act(() => { container.dispatchEvent(mouse('click', 380, 340)) })
    expect(onMarkerClick).not.toHaveBeenCalled()
    expect(onMapClick).not.toHaveBeenCalled()
  })

  it("FE-MAPCLICK-004: a pin on a touch screen keeps Leaflet's own click and no drag wiring", async () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'maxTouchPoints')
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, value: 5 })
    try {
      const onMarkerClick = vi.fn()
      const view = render(<MapView places={places} center={[34.685, 135.844]} zoom={15} tileUrl={RASTER} onMarkerClick={onMarkerClick} />)
      const container = view.container.querySelector('.leaflet-container') as HTMLElement
      await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon').length).toBe(2))
      const pin = container.querySelector('.leaflet-marker-icon') as HTMLElement
      expect(pin.getAttribute('draggable')).toBeNull()
      clickOn(pin)
      expect(onMarkerClick).toHaveBeenCalledTimes(1)
    } finally {
      if (original) Object.defineProperty(window.navigator, 'maxTouchPoints', original)
      else delete (window.navigator as unknown as Record<string, unknown>).maxTouchPoints
    }
  })

  it('FE-MAPCLICK-005: the place a pin opens stays open when the pin redraws mid-click', async () => {
    // The selection a pin makes redraws its icon, which replaces the element the click
    // landed on. Leaflet has to have found the pin before that happens: reading the target
    // afterwards, it finds it cut out of the map and takes the click for one on the empty
    // background, which would close the place again straight away.
    const onMapClick = vi.fn()
    function Planner() {
      const [selected, setSelected] = useState<number | null>(null)
      return (
        <>
          <output data-testid="selected">{selected ?? ''}</output>
          <MapView
            places={places} center={[34.685, 135.844]} zoom={15} tileUrl={RASTER}
            selectedPlaceId={selected}
            onMarkerClick={(id: number) => flushSync(() => setSelected(id))}
            onMapClick={() => { onMapClick(); setSelected(null) }}
          />
        </>
      )
    }
    const view = render(<Planner />)
    const container = view.container.querySelector('.leaflet-container') as HTMLElement
    await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon[draggable="true"]').length).toBe(2))
    const pin = container.querySelector('.leaflet-marker-icon[draggable="true"]') as HTMLElement
    // The pointer lands on the photo inside the pin, which the redraw replaces.
    clickOn(pin.firstElementChild as HTMLElement)
    expect(onMapClick).not.toHaveBeenCalled()
    expect(view.getByTestId('selected').textContent).not.toBe('')
  })

  it('FE-MAPCLICK-006: a pin click after a pan still closes an open popup on the map', async () => {
    const { container, pins, onMarkerClick } = await renderMap()
    const map = maps[maps.length - 1]
    panMap(container)
    // A hazard or plugin popup, as the planner opens them. Leaflet closes those on the
    // "preclick" it sends ahead of every click it routes, a pin's included.
    const popup = L.popup({ autoPan: false }).setLatLng([34.685, 135.844]).setContent('Road closed')
    act(() => { popup.openOn(map) })
    expect(map.hasLayer(popup)).toBe(true)
    clickOn(pins[0])
    expect(onMarkerClick).toHaveBeenCalledTimes(1)
    expect(map.hasLayer(popup)).toBe(false)
  })

  it('FE-MAPCLICK-007: a pin click after a pan still reaches the page and closes an open context menu', async () => {
    const onClose = vi.fn()
    const onMarkerClick = vi.fn()
    const view = render(
      <>
        {/* The menu the places list and the day plan open on a right click. It closes on
            any click that reaches the document. */}
        <ContextMenu menu={{ x: 20, y: 20, items: [{ label: 'Edit' }] }} onClose={onClose} />
        <MapView places={places} center={[34.685, 135.844]} zoom={15} tileUrl={RASTER} onMarkerClick={onMarkerClick} />
      </>,
    )
    const container = view.container.querySelector('.leaflet-container') as HTMLElement
    await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon[draggable="true"]').length).toBe(2))
    const pin = container.querySelector('.leaflet-marker-icon[draggable="true"]') as HTMLElement
    panMap(container)
    clickOn(pin)
    expect(onMarkerClick).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MAPCLICK-008: pressing a pin after a pan still holds the map still for a drag onto a day', async () => {
    const { container, pins } = await renderMap()
    const map = maps[maps.length - 1]
    panMap(container)
    const before = map.getCenter()
    // Press on the pin and move off it, as the start of a drag towards the day plan.
    act(() => {
      pins[0].dispatchEvent(mouse('mousedown', 500, 350))
      document.dispatchEvent(mouse('mousemove', 560, 390))
      document.dispatchEvent(mouse('mousemove', 620, 430))
      document.dispatchEvent(mouse('mouseup', 620, 430))
    })
    expect(map.getCenter()).toEqual(before)
    // The pan handler is back on, and the background still pans the map.
    expect(map.dragging.enabled()).toBe(true)
    panMap(container)
    expect(map.getCenter()).not.toEqual(before)
  })
})
