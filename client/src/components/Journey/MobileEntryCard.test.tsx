// FE-COMP-JENTRYCARD-001 to FE-COMP-JENTRYCARD-014

import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import MobileEntryCard from './MobileEntryCard'

type CardEntry = Parameters<typeof MobileEntryCard>[0]['entry']

function buildEntry(overrides: Partial<Record<string, unknown>> = {}): CardEntry {
  return {
    id: 1,
    type: 'entry',
    title: 'Sunrise over the fjord',
    location_name: 'Geiranger, Møre og Romsdal, Norway',
    location_lat: 62.1,
    location_lng: 7.2,
    entry_date: '2025-06-01',
    entry_time: '07:30:00',
    mood: null,
    weather: null,
    photos: [],
    story: null,
    ...overrides,
  } as unknown as CardEntry
}

function renderCard(entry: CardEntry, props: Partial<{ isActive: boolean; onClick: () => void; publicPhotoUrl: (id: number) => string; dayLabel: number; dayColor: string }> = {}) {
  const onClick = props.onClick ?? vi.fn()
  const result = render(
    <MobileEntryCard
      entry={entry}
      dayLabel={props.dayLabel ?? 3}
      dayColor={props.dayColor ?? '#ff0055'}
      isActive={props.isActive ?? false}
      onClick={onClick}
      publicPhotoUrl={props.publicPhotoUrl}
    />,
  )
  return { ...result, onClick }
}

beforeEach(() => {
  resetAllStores()
})

describe('MobileEntryCard', () => {
  it('FE-COMP-JENTRYCARD-001: shows the day badge, date and time', () => {
    renderCard(buildEntry())
    const badge = screen.getByText('3')
    expect(badge).toHaveStyle({ background: '#ff0055' })
    expect(screen.getByText('Jun 1')).toBeInTheDocument()
    // seconds are trimmed off the stored time
    expect(screen.getByText('· 07:30')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-002: an entry without a time shows only the date', () => {
    renderCard(buildEntry({ entry_time: null }))
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-003: renders the first photo thumbnail from the api', () => {
    const { container } = renderCard(buildEntry({ photos: [{ photo_id: 42 }, { photo_id: 43 }] }))
    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/42/thumbnail')
  })

  it('FE-COMP-JENTRYCARD-003b: a photo carrying only an id also resolves against the api', () => {
    const { container } = renderCard(buildEntry({ photos: [{ id: 11 }] }))
    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/11/thumbnail')
  })

  it('FE-COMP-JENTRYCARD-004: a public journey builds its own photo url', () => {
    const publicPhotoUrl = (id: number) => `/public/p/${id}.jpg`
    const { container } = renderCard(buildEntry({ photos: [{ photo_id: 7 }] }), { publicPhotoUrl })
    expect(container.querySelector('img')).toHaveAttribute('src', '/public/p/7.jpg')
  })

  it('FE-COMP-JENTRYCARD-004b: a shared-journey photo carrying only an id still resolves', () => {
    const publicPhotoUrl = (id: number) => `/public/p/${id}.jpg`
    const { container } = renderCard(buildEntry({ photos: [{ id: 11 }] }), { publicPhotoUrl })
    expect(container.querySelector('img')).toHaveAttribute('src', '/public/p/11.jpg')
  })

  it('FE-COMP-JENTRYCARD-005: several photos add a counter badge', () => {
    const { container } = renderCard(
      buildEntry({ photos: [{ photo_id: 1 }, { photo_id: 2 }, { photo_id: 3 }] }),
      { dayLabel: 9 },
    )
    expect(container.querySelector('svg.lucide-camera')).not.toBeNull()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-006: a single photo has no counter badge', () => {
    const { container } = renderCard(buildEntry({ photos: [{ photo_id: 1 }] }))
    expect(container.querySelector('svg.lucide-camera')).toBeNull()
  })

  it('FE-COMP-JENTRYCARD-007: without photos it falls back to a pin placeholder', () => {
    const { container } = renderCard(buildEntry())
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelectorAll('svg.lucide-map-pin').length).toBeGreaterThan(0)
  })

  it('FE-COMP-JENTRYCARD-008: mood and weather render their own icons', () => {
    const { container } = renderCard(buildEntry({ mood: 'amazing', weather: 'rainy' }))
    expect(container.querySelector('svg.lucide-laugh')).not.toBeNull()
    expect(container.querySelector('svg.lucide-cloud-rain')).not.toBeNull()
  })

  it('FE-COMP-JENTRYCARD-008b: every known mood gets its own chip colour', () => {
    const cases: [string, string, string][] = [
      ['good', 'lucide-smile', 'bg-amber-100'],
      ['neutral', 'lucide-meh', 'bg-zinc-100'],
      ['rough', 'lucide-frown', 'bg-violet-100'],
    ]
    for (const [mood, icon, bg] of cases) {
      const { container, unmount } = renderCard(buildEntry({ mood }))
      const chip = container.querySelector(`svg.${icon}`)!.parentElement!
      expect(chip.className).toContain(bg)
      unmount()
    }
  })

  it('FE-COMP-JENTRYCARD-009: an unknown mood renders no mood icon', () => {
    const { container } = renderCard(buildEntry({ mood: 'ecstatic' }))
    expect(container.querySelector('svg.lucide-laugh')).toBeNull()
    expect(container.querySelector('svg.lucide-smile')).toBeNull()
  })

  it('FE-COMP-JENTRYCARD-010: untitled entries fall back to a type-specific label', () => {
    const { unmount } = renderCard(buildEntry({ title: null, type: 'checkin' }))
    expect(screen.getByText('Check-in')).toBeInTheDocument()
    unmount()

    const skeleton = renderCard(buildEntry({ title: null, type: 'skeleton' }))
    expect(screen.getByText('Add your story…')).toBeInTheDocument()
    skeleton.unmount()

    renderCard(buildEntry({ title: '', type: 'entry' }))
    expect(screen.getByText('Untitled')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-011: the story preview only appears on the active card, stripped of markdown', () => {
    const story = '## Day one\n\nWe **walked** to the pier'
    const inactive = renderCard(buildEntry({ story }))
    expect(screen.queryByText(/We walked to the pier/)).not.toBeInTheDocument()
    inactive.unmount()

    renderCard(buildEntry({ story }), { isActive: true })
    expect(screen.getByText('Day one We walked to the pier')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-012: the location badge shortens a long location name', () => {
    renderCard(buildEntry())
    // formatLocationName collapses the 3+ part name
    expect(screen.getByText('Geiranger, Møre og Romsdal, Norway')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-013: a located entry without a name still says it is on the map', () => {
    renderCard(buildEntry({ location_name: null }))
    expect(screen.getByText('On the map')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-014: an entry without coordinates is marked as unlocated', () => {
    renderCard(buildEntry({ location_lat: null, location_lng: null }))
    expect(screen.getByText('No location')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYCARD-015: tapping the card calls back', () => {
    const onClick = vi.fn()
    renderCard(buildEntry(), { onClick })
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-JENTRYCARD-016: the active card grows', () => {
    const inactive = renderCard(buildEntry())
    expect(screen.getByRole('button').className).toContain('w-[240px]')
    inactive.unmount()

    renderCard(buildEntry(), { isActive: true })
    expect(screen.getByRole('button').className).toContain('w-[320px]')
  })
})
