// FE-COMP-JMAPVIEW-001 to FE-COMP-JMAPVIEW-011

const lastMapProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

// The map renderer picks Leaflet or GL from the settings store and is covered
// by its own suites — here it is reduced to a props recorder.
vi.mock('./JourneyMapAuto', async () => {
  const React = await import('react')
  return {
    default: React.forwardRef(function MockJourneyMapAuto(
      props: Record<string, unknown>,
      _ref: React.ForwardedRef<unknown>,
    ) {
      lastMapProps.current = props
      return React.createElement('div', { 'data-testid': 'journey-map' })
    }),
  }
})

import { createRef } from 'react'
import { render, screen, fireEvent, within } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import { MapView } from './JourneyDetailPageMapView'
import type { JourneyMapAutoHandle } from './JourneyMapAuto'
import type { JourneyEntry } from '../../store/journeyStore'

function buildEntry(overrides: Record<string, unknown>): JourneyEntry {
  return {
    id: 1,
    journey_id: 1,
    author_id: 1,
    type: 'entry',
    title: 'Louvre',
    story: null,
    entry_date: '2025-06-01',
    entry_time: null,
    location_name: 'Paris, France',
    location_lat: 48.86,
    location_lng: 2.35,
    mood: null,
    weather: null,
    tags: [],
    pros_cons: null,
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
    ...overrides,
  } as unknown as JourneyEntry
}

const mapEntries = [
  buildEntry({ id: 1, title: 'Louvre', entry_date: '2025-06-01', entry_time: '09:00' }),
  buildEntry({ id: 2, title: 'Sacré-Cœur', entry_date: '2025-06-01', location_name: 'Montmartre, Paris, France' }),
  buildEntry({ id: 3, title: 'Museumsinsel', entry_date: '2025-06-02', location_name: 'Berlin, Germany', location_lat: 52.52, location_lng: 13.4 }),
]

const allEntries = [
  ...mapEntries,
  buildEntry({ id: 4, type: 'checkin', title: 'Checked in', entry_date: '2025-06-02' }),
]

function renderMapView(props: Partial<{
  entries: JourneyEntry[]
  mapEntries: JourneyEntry[]
  activeLocationId: string | null
  onLocationClick: (id: string) => void
}> = {}) {
  const onLocationClick = props.onLocationClick ?? vi.fn()
  const result = render(
    <MapView
      entries={props.entries ?? allEntries}
      mapEntries={props.mapEntries ?? mapEntries}
      sortedDates={['2025-06-01', '2025-06-02']}
      activeLocationId={props.activeLocationId ?? null}
      fullMapRef={createRef<JourneyMapAutoHandle>()}
      onLocationClick={onLocationClick}
    />,
  )
  return { ...result, onLocationClick }
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
})

describe('JourneyDetailPage MapView', () => {
  it('FE-COMP-JMAPVIEW-001: hands the located entries to the map as plain marker items', () => {
    renderMapView()
    expect(screen.getByTestId('journey-map')).toBeInTheDocument()
    expect(lastMapProps.current).toMatchObject({ height: 560, activeMarkerId: null })
    expect(lastMapProps.current.entries).toEqual([
      { id: '1', lat: 48.86, lng: 2.35, title: 'Louvre', mood: null, entry_date: '2025-06-01' },
      { id: '2', lat: 48.86, lng: 2.35, title: 'Sacré-Cœur', mood: null, entry_date: '2025-06-01' },
      { id: '3', lat: 52.52, lng: 13.4, title: 'Museumsinsel', mood: null, entry_date: '2025-06-02' },
    ])
  })

  it('FE-COMP-JMAPVIEW-002: the stats row counts places, days and stories', () => {
    renderMapView()
    const places = screen.getByText('Places').previousElementSibling
    const days = screen.getByText('Days').previousElementSibling
    const stories = screen.getByText('Stories').previousElementSibling
    expect(places).toHaveTextContent('3')
    expect(days).toHaveTextContent('2')
    // the check-in is not a story
    expect(stories).toHaveTextContent('3')
  })

  it('FE-COMP-JMAPVIEW-003: a journey with no located entries hides the stats row', () => {
    renderMapView({ mapEntries: [] })
    expect(screen.queryByText('Places')).not.toBeInTheDocument()
    expect(screen.queryByText('Day 1')).not.toBeInTheDocument()
  })

  it('FE-COMP-JMAPVIEW-004: entries are grouped under numbered day headers', () => {
    renderMapView()
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    expect(screen.getByText('June 1')).toBeInTheDocument()
    expect(screen.getByText('June 2')).toBeInTheDocument()
  })

  it('FE-COMP-JMAPVIEW-005: each row is numbered by its position across the whole journey', () => {
    renderMapView()
    const berlin = screen.getByText('Museumsinsel').closest('button[class*="cursor-pointer"]')!
    expect(within(berlin as HTMLElement).getByText('3')).toBeInTheDocument()
  })

  it('FE-COMP-JMAPVIEW-006: the location line shortens the place and appends the time', () => {
    renderMapView()
    expect(screen.getByText('Paris, France · 09:00')).toBeInTheDocument()
    expect(screen.getByText('Montmartre, Paris, France')).toBeInTheDocument()
  })

  it('FE-COMP-JMAPVIEW-007: an entry without a title falls back to its location name', () => {
    renderMapView({
      mapEntries: [buildEntry({ id: 9, title: null, location_name: 'Reykjavík' })],
    })
    expect(screen.getAllByText('Reykjavík').length).toBeGreaterThan(0)
  })

  it('FE-COMP-JMAPVIEW-008: clicking a row reports the entry id', () => {
    const onLocationClick = vi.fn()
    renderMapView({ onLocationClick })

    fireEvent.click(screen.getByText('Sacré-Cœur'))

    expect(onLocationClick).toHaveBeenCalledWith('2')
  })

  it('FE-COMP-JMAPVIEW-009: the map reports marker clicks through the same handler', () => {
    const onLocationClick = vi.fn()
    renderMapView({ onLocationClick })
    expect(lastMapProps.current.onMarkerClick).toBe(onLocationClick)
  })

  it('FE-COMP-JMAPVIEW-010: the active row is outlined and forwarded to the map', () => {
    renderMapView({ activeLocationId: '2' })
    expect(lastMapProps.current.activeMarkerId).toBe('2')

    const row = screen.getByText('Sacré-Cœur').closest('button[class*="cursor-pointer"]') as HTMLElement
    expect(row.className).toContain('border-zinc-900')
    const inactive = screen.getByText('Louvre').closest('button[class*="cursor-pointer"]') as HTMLElement
    expect(inactive.className).toContain('border-zinc-200')
  })

  it('FE-COMP-JMAPVIEW-011: connectors sit between same-day rows, never after the last one', () => {
    const { container } = renderMapView()
    // day 1 has two rows (one connector), day 2 has a single row (none)
    expect(container.querySelectorAll('.w-0\\.5')).toHaveLength(1)
  })
})
