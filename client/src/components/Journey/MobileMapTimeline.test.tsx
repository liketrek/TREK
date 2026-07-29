// FE-COMP-JMAPTL-001 to FE-COMP-JMAPTL-016

const mapHandle = vi.hoisted(() => ({
  highlightMarker: vi.fn(),
  focusMarker: vi.fn(),
  invalidateSize: vi.fn(),
}))

const lastMapProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

// The Leaflet map is exercised in JourneyMap.test.tsx — here it only needs to
// hand back its imperative handle and expose the props it was given.
vi.mock('./JourneyMap', async () => {
  const React = await import('react')
  return {
    default: React.forwardRef(function MockJourneyMap(
      props: Record<string, unknown>,
      ref: React.ForwardedRef<typeof mapHandle>,
    ) {
      lastMapProps.current = props
      React.useImperativeHandle(ref, () => mapHandle, [])
      return React.createElement('div', { 'data-testid': 'journey-map' })
    }),
  }
})

import { render, screen, fireEvent, act } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import MobileMapTimeline from './MobileMapTimeline'
import { DAY_COLORS } from './dayColors'

interface TimelineEntry {
  id: number
  type: string
  title: string
  entry_date: string
  entry_time: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  mood: string | null
  weather: string | null
  photos: { photo_id: number }[]
  story: string | null
}

function buildEntry(id: number, date: string, title: string): TimelineEntry {
  return {
    id,
    type: 'entry',
    title,
    entry_date: date,
    entry_time: null,
    location_name: 'Somewhere',
    location_lat: 48 + id,
    location_lng: 2 + id,
    mood: null,
    weather: null,
    photos: [],
    story: null,
  }
}

const entries = [
  buildEntry(1, '2025-06-01', 'Louvre'),
  buildEntry(2, '2025-06-02', 'Museumsinsel'),
  buildEntry(3, '2025-06-02', 'Reichstag'),
]

const mapEntries = entries.map(e => ({
  id: String(e.id),
  lat: e.location_lat!,
  lng: e.location_lng!,
  title: e.title,
  mood: null,
  entry_date: e.entry_date,
}))

function fakeRect(left: number, width: number): DOMRect {
  return {
    left, width, right: left + width, top: 0, bottom: 0, height: 0, x: left, y: 0,
    toJSON: () => ({}),
  } as DOMRect
}

function carouselOf(container: HTMLElement) {
  const carousel = container.querySelector('.overflow-x-auto') as HTMLElement
  const cards = [...carousel.children] as HTMLElement[]
  return { carousel, cards }
}

function renderTimeline(props: Partial<{
  entries: TimelineEntry[]
  onEntryClick: (entry: TimelineEntry) => void
  onAddEntry: () => void
  readOnly: boolean
  carouselBottom: string
}> = {}) {
  const onEntryClick = props.onEntryClick ?? vi.fn()
  const result = render(
    <MobileMapTimeline
      entries={props.entries ?? entries}
      mapEntries={mapEntries}
      onEntryClick={onEntryClick}
      onAddEntry={props.onAddEntry}
      readOnly={props.readOnly}
      carouselBottom={props.carouselBottom}
    />,
  )
  return { ...result, onEntryClick }
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
})

describe('MobileMapTimeline', () => {
  it('FE-COMP-JMAPTL-001: renders one card per entry on top of a full-screen map', () => {
    renderTimeline()
    expect(screen.getByTestId('journey-map')).toBeInTheDocument()
    expect(lastMapProps.current).toMatchObject({ height: 9999, fullScreen: true, paddingBottom: 200 })
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Museumsinsel')).toBeInTheDocument()
    expect(screen.getByText('Reichstag')).toBeInTheDocument()
  })

  it('FE-COMP-JMAPTL-002: entries on the same day share a colour and count up', () => {
    const { container } = renderTimeline()
    const { cards } = carouselOf(container)
    const badge = (card: HTMLElement) => card.querySelector('span[style]') as HTMLElement

    expect(badge(cards[0]).textContent).toBe('1')
    expect(badge(cards[0])).toHaveStyle({ background: DAY_COLORS[0] })
    // second day, first and second entry of that day
    expect(badge(cards[1]).textContent).toBe('1')
    expect(badge(cards[2]).textContent).toBe('2')
    expect(badge(cards[1])).toHaveStyle({ background: DAY_COLORS[1] })
    expect(badge(cards[2])).toHaveStyle({ background: DAY_COLORS[1] })
  })

  it('FE-COMP-JMAPTL-003: the first entry starts out active and drives the map highlight', () => {
    renderTimeline()
    expect(lastMapProps.current.activeMarkerId).toBe('1')
  })

  it('FE-COMP-JMAPTL-004: tapping an inactive card only activates it', () => {
    const onEntryClick = vi.fn()
    renderTimeline({ onEntryClick })

    fireEvent.click(screen.getByText('Reichstag'))

    expect(onEntryClick).not.toHaveBeenCalled()
    expect(lastMapProps.current.activeMarkerId).toBe('3')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ inline: 'center', behavior: 'smooth' }),
    )
  })

  it('FE-COMP-JMAPTL-005: tapping the already active card opens the entry', () => {
    const onEntryClick = vi.fn()
    renderTimeline({ onEntryClick })

    fireEvent.click(screen.getByText('Louvre'))

    expect(onEntryClick).toHaveBeenCalledWith(entries[0])
  })

  it('FE-COMP-JMAPTL-006: clicking a map marker centres the matching card', () => {
    renderTimeline()
    const onMarkerClick = lastMapProps.current.onMarkerClick as (id: string) => void

    act(() => { onMarkerClick('2') })

    expect(lastMapProps.current.activeMarkerId).toBe('2')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('FE-COMP-JMAPTL-007: a marker click for an unknown entry is ignored', () => {
    renderTimeline()
    const onMarkerClick = lastMapProps.current.onMarkerClick as (id: string) => void

    act(() => { onMarkerClick('999') })

    expect(lastMapProps.current.activeMarkerId).toBe('1')
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPTL-008: the map is focused on the first entry once leaflet has settled', () => {
    vi.useFakeTimers()
    try {
      renderTimeline()
      expect(mapHandle.focusMarker).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(500) })
      expect(mapHandle.focusMarker).toHaveBeenCalledWith('1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPTL-008b: markers arriving after the entries still get the initial focus', () => {
    vi.useFakeTimers()
    try {
      const onEntryClick = vi.fn()
      const { rerender } = render(
        <MobileMapTimeline entries={entries} mapEntries={[]} onEntryClick={onEntryClick} />,
      )
      act(() => { vi.advanceTimersByTime(500) })
      expect(mapHandle.focusMarker).not.toHaveBeenCalled()

      rerender(<MobileMapTimeline entries={entries} mapEntries={mapEntries} onEntryClick={onEntryClick} />)
      act(() => { vi.advanceTimersByTime(500) })

      expect(mapHandle.focusMarker).toHaveBeenCalledWith('1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPTL-009: an entry that has no marker clears the highlight instead', () => {
    vi.useFakeTimers()
    try {
      renderTimeline({ entries: [buildEntry(77, '2025-06-01', 'Unmapped')] })
      act(() => { vi.advanceTimersByTime(500) })
      expect(mapHandle.focusMarker).not.toHaveBeenCalled()
      expect(mapHandle.highlightMarker).toHaveBeenCalledWith(null)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPTL-010: a settled carousel scroll activates the card nearest the centre', () => {
    vi.useFakeTimers()
    try {
      const { container } = renderTimeline()
      const { carousel, cards } = carouselOf(container)
      Object.defineProperty(carousel, 'clientWidth', { value: 300, configurable: true })
      carousel.getBoundingClientRect = () => fakeRect(0, 300)
      cards[0].getBoundingClientRect = () => fakeRect(-400, 240)
      cards[1].getBoundingClientRect = () => fakeRect(30, 240)
      cards[2].getBoundingClientRect = () => fakeRect(320, 240)

      fireEvent.scroll(carousel)
      // nothing happens mid-swipe, only once scrolling settles
      expect(mapHandle.focusMarker).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(200) })

      expect(mapHandle.focusMarker).toHaveBeenCalledWith('2')
      expect(lastMapProps.current.activeMarkerId).toBe('2')
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPTL-011: repeated scrolls restart the settle timer', () => {
    vi.useFakeTimers()
    try {
      const { container } = renderTimeline()
      const { carousel, cards } = carouselOf(container)
      Object.defineProperty(carousel, 'clientWidth', { value: 300, configurable: true })
      carousel.getBoundingClientRect = () => fakeRect(0, 300)
      cards.forEach((c, i) => { c.getBoundingClientRect = () => fakeRect(i === 2 ? 30 : -400, 240) })

      fireEvent.scroll(carousel)
      act(() => { vi.advanceTimersByTime(100) })
      fireEvent.scroll(carousel)
      act(() => { vi.advanceTimersByTime(100) })
      expect(lastMapProps.current.activeMarkerId).toBe('1')

      act(() => { vi.advanceTimersByTime(100) })
      expect(lastMapProps.current.activeMarkerId).toBe('3')
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPTL-012: settling on the card that was already active does not refocus the map', () => {
    vi.useFakeTimers()
    try {
      const { container } = renderTimeline()
      act(() => { vi.advanceTimersByTime(500) })
      mapHandle.focusMarker.mockClear()

      const { carousel, cards } = carouselOf(container)
      Object.defineProperty(carousel, 'clientWidth', { value: 300, configurable: true })
      carousel.getBoundingClientRect = () => fakeRect(0, 300)
      cards.forEach((c, i) => { c.getBoundingClientRect = () => fakeRect(i === 0 ? 30 : 900, 240) })

      fireEvent.scroll(carousel)
      act(() => { vi.advanceTimersByTime(200) })

      expect(mapHandle.focusMarker).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPTL-013: the add button reports back and can be hidden', () => {
    const onAddEntry = vi.fn()
    const withFab = renderTimeline({ onAddEntry })
    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(onAddEntry).toHaveBeenCalledTimes(1)
    withFab.unmount()

    renderTimeline({ onAddEntry, readOnly: true })
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument()
  })

  it('FE-COMP-JMAPTL-014: carouselBottom positions the strip above the tab bar', () => {
    const { container } = renderTimeline({ carouselBottom: '120px' })
    const strip = container.querySelector('.z-40') as HTMLElement
    expect(strip.style.bottom).toBe('120px')
  })

  it('FE-COMP-JMAPTL-015: an empty journey shows only the map and the add button', () => {
    const onAddEntry = vi.fn()
    const { container } = renderTimeline({ entries: [], onAddEntry })

    expect(screen.getByTestId('journey-map')).toBeInTheDocument()
    expect(container.querySelector('.overflow-x-auto')).toBeNull()
    // no card is active, so the map gets no highlight to chase
    expect(lastMapProps.current.activeMarkerId).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(onAddEntry).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-JMAPTL-016: an empty read-only journey has no add button', () => {
    renderTimeline({ entries: [], onAddEntry: vi.fn(), readOnly: true })
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument()
  })

  it('FE-COMP-JMAPTL-017: without an add handler no button is rendered at all', () => {
    renderTimeline({ entries: [] })
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument()
  })
})
