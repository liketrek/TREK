// FE-COMP-JENTRYVIEW-001 to FE-COMP-JENTRYVIEW-017

import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildSettings } from '../../../tests/helpers/factories'
import { useSettingsStore } from '../../store/settingsStore'
import MobileEntryView from './MobileEntryView'
import type { JourneyEntry, JourneyPhoto } from '../../store/journeyStore'

function buildPhoto(photoId: number): JourneyPhoto {
  return {
    id: photoId * 10,
    entry_id: 1,
    photo_id: photoId,
    caption: null,
    sort_order: photoId,
    shared: 0,
    created_at: 0,
  }
}

function buildEntry(overrides: Record<string, unknown> = {}): JourneyEntry {
  return {
    id: 1,
    journey_id: 1,
    author_id: 1,
    type: 'entry',
    title: 'Sunrise over the fjord',
    story: null,
    entry_date: '2025-06-01',
    entry_time: '07:30:00',
    location_name: 'Geiranger, Norway',
    location_lat: 62.1,
    location_lng: 7.2,
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

interface ViewProps {
  readOnly: boolean
  publicPhotoUrl: (photoId: number) => string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onPhotoClick: (photos: JourneyPhoto[], index: number) => void
}

function renderView(entry: JourneyEntry, props: Partial<ViewProps> = {}) {
  const handlers = {
    onClose: props.onClose ?? vi.fn(),
    onEdit: props.onEdit ?? vi.fn(),
    onDelete: props.onDelete ?? vi.fn(),
    onPhotoClick: props.onPhotoClick ?? vi.fn(),
  }
  const result = render(
    <MobileEntryView
      entry={entry}
      readOnly={props.readOnly}
      publicPhotoUrl={props.publicPhotoUrl}
      {...handlers}
    />,
  )
  return { ...result, ...handlers }
}

beforeEach(() => {
  resetAllStores()
})

describe('MobileEntryView', () => {
  it('FE-COMP-JENTRYVIEW-001: renders the header with the long date, time and location', () => {
    renderView(buildEntry())
    expect(screen.getByText('Sunday, June 1')).toBeInTheDocument()
    expect(screen.getByText('07:30')).toBeInTheDocument()
    expect(screen.getByText('Geiranger, Norway')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sunrise over the fjord' })).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYVIEW-002: an entry without time, location or title renders none of them', () => {
    const { container } = renderView(buildEntry({ entry_time: null, location_name: null, title: null }))
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('svg.lucide-clock')).toBeNull()
    expect(container.querySelector('svg.lucide-map-pin')).toBeNull()
  })

  it('FE-COMP-JENTRYVIEW-003: the close button calls back', () => {
    const { onClose, container } = renderView(buildEntry())
    fireEvent.click(container.querySelector('svg.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-JENTRYVIEW-004: edit closes the sheet first, then opens the editor', () => {
    const order: string[] = []
    const onClose = vi.fn(() => { order.push('close') })
    const onEdit = vi.fn(() => { order.push('edit') })
    renderView(buildEntry(), { onClose, onEdit })

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }))

    expect(order).toEqual(['close', 'edit'])
  })

  it('FE-COMP-JENTRYVIEW-005: delete closes the sheet first, then asks to delete', () => {
    const order: string[] = []
    const onClose = vi.fn(() => { order.push('close') })
    const onDelete = vi.fn(() => { order.push('delete') })
    const { container } = renderView(buildEntry(), { onClose, onDelete })

    fireEvent.click(container.querySelector('svg.lucide-trash2')!.closest('button')!)

    expect(order).toEqual(['close', 'delete'])
  })

  it('FE-COMP-JENTRYVIEW-006: read-only journeys hide the edit and delete actions', () => {
    const { container } = renderView(buildEntry(), { readOnly: true })
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument()
    expect(container.querySelector('svg.lucide-trash2')).toBeNull()
    // the close button stays
    expect(container.querySelector('svg.lucide-x')).not.toBeNull()
  })

  it('FE-COMP-JENTRYVIEW-007: a single photo renders as the hero without a strip or counter', () => {
    const { container } = renderView(buildEntry({ photos: [buildPhoto(4)] }))
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAttribute('src', '/api/photos/4/original')
    expect(container.querySelector('svg.lucide-camera')).toBeNull()
  })

  it('FE-COMP-JENTRYVIEW-008: several photos add a counter and a thumbnail strip', () => {
    const { container } = renderView(buildEntry({ photos: [buildPhoto(4), buildPhoto(5), buildPhoto(6)] }))
    expect(screen.getByText('3 photos')).toBeInTheDocument()
    const images = container.querySelectorAll('img')
    // hero + one thumbnail per photo
    expect(images).toHaveLength(4)
    expect(images[1]).toHaveAttribute('src', '/api/photos/4/thumbnail')
  })

  it('FE-COMP-JENTRYVIEW-009: tapping the hero and a thumbnail opens the lightbox at that index', () => {
    const onPhotoClick = vi.fn()
    const photos = [buildPhoto(4), buildPhoto(5)]
    const { container } = renderView(buildEntry({ photos }), { onPhotoClick })
    const images = container.querySelectorAll('img')

    fireEvent.click(images[0])
    expect(onPhotoClick).toHaveBeenLastCalledWith(photos, 0)

    fireEvent.click(images[2])
    expect(onPhotoClick).toHaveBeenLastCalledWith(photos, 1)
  })

  it('FE-COMP-JENTRYVIEW-010: a public journey builds its own photo urls', () => {
    const { container } = renderView(
      buildEntry({ photos: [buildPhoto(4), buildPhoto(5)] }),
      { publicPhotoUrl: (id: number) => `/public/p/${id}.jpg` },
    )
    const images = container.querySelectorAll('img')
    expect(images[0]).toHaveAttribute('src', '/public/p/4.jpg')
    expect(images[1]).toHaveAttribute('src', '/public/p/4.jpg')
  })

  it('FE-COMP-JENTRYVIEW-011: mood and weather render as labelled chips', () => {
    const { container } = renderView(buildEntry({ mood: 'rough', weather: 'stormy' }))
    expect(screen.getByText('Rough')).toBeInTheDocument()
    expect(screen.getByText('Stormy')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-frown')).not.toBeNull()
    expect(container.querySelector('svg.lucide-cloud-lightning')).not.toBeNull()
  })

  it('FE-COMP-JENTRYVIEW-012: unknown mood and weather values render no chips', () => {
    renderView(buildEntry({ mood: 'ecstatic', weather: 'hail' }))
    expect(screen.queryByText('Rough')).not.toBeInTheDocument()
    expect(screen.queryByText('Stormy')).not.toBeInTheDocument()
  })

  it('FE-COMP-JENTRYVIEW-013: the story is rendered as markdown body copy', () => {
    renderView(buildEntry({ story: 'We **walked** to the pier' }))
    expect(screen.getByText('walked').tagName).toBe('STRONG')
  })

  it('FE-COMP-JENTRYVIEW-014: tags render as chips', () => {
    renderView(buildEntry({ tags: ['hiking', 'fjord'] }))
    expect(screen.getByText('hiking')).toBeInTheDocument()
    expect(screen.getByText('fjord')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYVIEW-015: pros and cons render both lists with a divider', () => {
    const { container } = renderView(buildEntry({ pros_cons: { pros: ['great light'], cons: ['very cold'] } }))
    expect(screen.getByText('Pros')).toBeInTheDocument()
    expect(screen.getByText('Cons')).toBeInTheDocument()
    expect(screen.getByText('great light')).toBeInTheDocument()
    expect(screen.getByText('very cold')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-thumbs-up')).not.toBeNull()
    expect(container.querySelector('svg.lucide-thumbs-down')).not.toBeNull()
  })

  it('FE-COMP-JENTRYVIEW-016: a cons-only entry skips the pros block', () => {
    renderView(buildEntry({ pros_cons: { pros: [], cons: ['very cold'] } }))
    expect(screen.queryByText('Pros')).not.toBeInTheDocument()
    expect(screen.getByText('Cons')).toBeInTheDocument()
  })

  it('FE-COMP-JENTRYVIEW-017: an empty pros/cons block is not rendered at all', () => {
    renderView(buildEntry({ pros_cons: { pros: [], cons: [] } }))
    expect(screen.queryByText('Pros')).not.toBeInTheDocument()
    expect(screen.queryByText('Cons')).not.toBeInTheDocument()
  })

  // This view held its own English label tables while the desktop one resolved
  // the same values through i18n, so a German reader got English chips on a
  // phone and translated ones on a tablet (#1846). Which of the two appears is
  // decided by two different breakpoints, which is why it looked random.
  it('FE-COMP-JENTRYVIEW-018: mood, weather and the edit action follow the chosen language', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'de' }) })
    renderView(buildEntry({
      mood: 'amazing',
      weather: 'sunny',
      pros_cons: { pros: ['gutes Licht'], cons: ['sehr kalt'] },
    }))

    // The locale bundle is fetched, so the first paint is still English.
    expect(await screen.findByText('Großartig')).toBeInTheDocument()
    expect(screen.getByText('Sonnig')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bearbeiten/ })).toBeInTheDocument()
    expect(screen.queryByText('Amazing')).not.toBeInTheDocument()
    expect(screen.queryByText('Sunny')).not.toBeInTheDocument()
  })
})
