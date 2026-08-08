// FE-JRN-PICKER-001 to FE-JRN-PICKER-020

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within, fireEvent } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import type { JourneyEntry, JourneyTrip } from '../../store/journeyStore'
import { ProviderPicker } from './JourneyDetailPageProviderPicker'

const trips: JourneyTrip[] = [
  { trip_id: 5, added_at: 0, title: 'Italy Trip', start_date: '2026-03-14', end_date: '2026-03-20', place_count: 3 },
  { trip_id: 6, added_at: 0, title: 'Side Trip', start_date: '2026-03-16', end_date: '2026-03-18', place_count: 1 },
]

function buildEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 10, journey_id: 1, author_id: 1, type: 'entry', entry_date: '2026-03-15',
    title: 'Arrived in Rome', visibility: 'private', sort_order: 0, photos: [], created_at: 0, updated_at: 0,
    ...overrides,
  }
}

const entries = [
  buildEntry(),
  buildEntry({ id: 11, title: 'Gallery' }),
  buildEntry({ id: 12, title: null, location_name: 'Florence' }),
  buildEntry({ id: 13, type: 'skeleton', title: 'Skipped' }),
]

const asset = (id: string, extra: Record<string, unknown> = {}) => ({
  id, takenAt: '2026-03-15T10:00:00.000Z', mediaType: 'image', ...extra,
})

function searchReturns(assets: Record<string, unknown>[], hasMore = false) {
  server.use(http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({ assets, hasMore })))
}

function mountPicker(props: Partial<React.ComponentProps<typeof ProviderPicker>> = {}) {
  const onClose = vi.fn()
  const onAdd = vi.fn(async () => {})
  const utils = render(
    <ProviderPicker
      provider="immich"
      userId={42}
      entries={entries}
      trips={trips}
      existingAssetIds={new Set<string>()}
      onClose={onClose}
      onAdd={onAdd}
      {...props}
    />,
  )
  return { ...utils, onClose, onAdd }
}

beforeEach(() => {
  searchReturns([asset('a1')])
})

describe('ProviderPicker', () => {
  it('FE-JRN-PICKER-001: opens on the trip period and groups the photos by date', async () => {
    mountPicker()

    expect(await screen.findByText('March 15, 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Immich' })).toBeInTheDocument()
    // The trip range spans the union of all linked trips.
    expect(screen.getByText('Mar 14')).toBeInTheDocument()
    expect(screen.getByText('Mar 20, 2026')).toBeInTheDocument()
    expect(screen.getByText('(7 days)')).toBeInTheDocument()
  })

  it('FE-JRN-PICKER-002: names the other provider in the header', () => {
    mountPicker({ provider: 'synologyphotos' })

    expect(screen.getByRole('heading', { name: 'Synology Photos' })).toBeInTheDocument()
  })

  it('FE-JRN-PICKER-003: explains that no trip is linked when the range is empty', async () => {
    mountPicker({ trips: [] })

    await waitFor(() => expect(screen.getAllByText('No trips linked').length).toBe(2))
  })

  it('FE-JRN-PICKER-004: adds a day tab and preselects it when an initial date is given', async () => {
    mountPicker({ initialDate: '2026-03-15', contextLocation: { lat: 41.9, lng: 12.5, name: 'Rome' } })

    expect(await screen.findByText('Sunday, March 15, 2026')).toBeInTheDocument()
    expect(screen.getByText('· near Rome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'This day' }).className).toContain('bg-zinc-900')
  })

  it('FE-JRN-PICKER-005: the all-photos tab searches without a date range', async () => {
    const ranges: Record<string, unknown>[] = []
    server.use(http.post('/api/integrations/memories/immich/search', async ({ request }) => {
      ranges.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ assets: [asset('a1')], hasMore: false })
    }))
    const user = userEvent.setup()
    mountPicker()
    await screen.findByText('March 15, 2026')

    await user.click(screen.getByRole('button', { name: /All Photos/ }))

    await waitFor(() => expect(ranges).toHaveLength(2))
    expect(ranges[1]).toEqual({ from: '', to: '', page: 1, size: 50 })
  })

  it('FE-JRN-PICKER-006: the album tab loads albums and reports when there are none', async () => {
    server.use(http.get('/api/integrations/memories/immich/albums', () => HttpResponse.json({ albums: [] })))
    const user = userEvent.setup()
    mountPicker()
    await screen.findByText('March 15, 2026')

    await user.click(screen.getByRole('button', { name: 'Albums' }))

    expect(await screen.findByText('No albums found')).toBeInTheDocument()
  })

  it('FE-JRN-PICKER-007: picking an album loads its photos with the album passphrase', async () => {
    const requested: string[] = []
    server.use(
      http.get('/api/integrations/memories/immich/albums', () => HttpResponse.json({
        albums: [{ id: 'alb1', albumName: 'Rome', assetCount: 2, passphrase: 'pw 1' }],
      })),
      http.get('/api/integrations/memories/immich/albums/alb1/photos', ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('passphrase') ?? '')
        return HttpResponse.json({ assets: [asset('alb-a1')] })
      }),
    )
    const user = userEvent.setup()
    mountPicker()
    await screen.findByText('March 15, 2026')

    await user.click(screen.getByRole('button', { name: 'Albums' }))
    await user.click(await screen.findByRole('button', { name: 'Rome (2)' }))

    await waitFor(() => expect(requested).toEqual(['pw 1']))
    const thumb = await screen.findByAltText('')
    expect(thumb.getAttribute('src')).toContain('passphrase=pw%201')
  })

  it('FE-JRN-PICKER-008: selects and deselects every selectable asset at once', async () => {
    searchReturns([asset('a1'), asset('a2'), asset('a3')])
    const user = userEvent.setup()
    mountPicker({ existingAssetIds: new Set(['a3']) })

    const selectAll = await screen.findByRole('button', { name: /Select all \(2\)/ })
    await user.click(selectAll)

    expect(screen.getByRole('button', { name: 'Add (2)' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /Deselect all \(2\)/ }))
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('FE-JRN-PICKER-009: hides the select-all bar when every asset was already added', async () => {
    searchReturns([asset('a1')])
    mountPicker({ existingAssetIds: new Set(['a1']) })

    await screen.findByText('March 15, 2026')
    expect(screen.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument()
  })

  it('FE-JRN-PICKER-010: toggles a single asset on and off', async () => {
    searchReturns([asset('a1'), asset('a2')])
    const user = userEvent.setup()
    mountPicker()

    const tiles = await screen.findAllByAltText('')
    await user.click(tiles[0])
    expect(screen.getByRole('button', { name: 'Add (1)' })).toBeInTheDocument()

    await user.click(tiles[0])
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('FE-JRN-PICKER-011: ignores clicks on assets that are already in the journey', async () => {
    searchReturns([asset('a1'), asset('a2')])
    const user = userEvent.setup()
    mountPicker({ existingAssetIds: new Set(['a1']) })

    const tiles = await screen.findAllByAltText('')
    await user.click(tiles[0])

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('FE-JRN-PICKER-012: submits the selection grouped by passphrase with media types', async () => {
    searchReturns([asset('a1'), asset('a2', { mediaType: 'video' })])
    const user = userEvent.setup()
    const { onAdd } = mountPicker()

    const tiles = await screen.findAllByAltText('')
    await user.click(tiles[0])
    await user.click(tiles[1])
    await user.click(screen.getByRole('button', { name: 'Add (2)' }))

    expect(onAdd).toHaveBeenCalledWith(
      [{ assetIds: ['a1', 'a2'], mediaTypes: ['image', 'video'], passphrase: undefined }],
      null,
    )
  })

  it('FE-JRN-PICKER-013: retargets the upload to a journal entry via the add-to menu', async () => {
    const user = userEvent.setup()
    const { onAdd } = mountPicker()

    const tiles = await screen.findAllByAltText('')
    await user.click(tiles[0])
    await user.click(screen.getByRole('button', { name: /New Gallery/ }))

    // Skeletons and the reserved gallery entries never appear as targets.
    expect(screen.queryByRole('button', { name: 'Skipped' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gallery' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Arrived in Rome' }))

    await user.click(screen.getByRole('button', { name: 'Add (1)' }))
    expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['a1'], mediaTypes: ['image'], passphrase: undefined }], 10)
  })

  it('FE-JRN-PICKER-014: falls back to the location name for untitled entries and back to the gallery', async () => {
    const user = userEvent.setup()
    const { onAdd } = mountPicker({ initialEntryId: 10 })

    const tiles = await screen.findAllByAltText('')
    await user.click(tiles[0])
    await user.click(screen.getByRole('button', { name: /Arrived in Rome/ }))
    expect(screen.getByRole('button', { name: 'Florence' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^New Gallery$/ }))
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))
    expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['a1'], mediaTypes: ['image'], passphrase: undefined }], null)
  })

  it('FE-JRN-PICKER-015: retries a broken thumbnail against the original size', async () => {
    const user = userEvent.setup()
    mountPicker()

    const tile = await screen.findByAltText('')
    expect(tile.getAttribute('src')).toContain('/api/integrations/memories/immich/assets/0/a1/42/thumbnail')
    fireEvent.error(tile)
    expect(tile.getAttribute('src')).toContain('/api/integrations/memories/immich/assets/0/a1/42/original')

    // A second failure must not loop back to the thumbnail.
    fireEvent.error(tile)
    expect(tile.getAttribute('src')).toContain('/original')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
  })

  it('FE-JRN-PICKER-016: shows a spinner while searching and the empty hint when the search fails', async () => {
    server.use(http.post('/api/integrations/memories/immich/search', async () => {
      await delay(30)
      return new HttpResponse(null, { status: 502 })
    }))
    const { container } = mountPicker()

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()

    expect(await screen.findByText('No photos yet')).toBeInTheDocument()
  })

  it('FE-JRN-PICKER-017: loads the next page when the scroll trigger becomes visible', async () => {
    const pages: number[] = []
    server.use(http.post('/api/integrations/memories/immich/search', async ({ request }) => {
      const body = await request.json() as { page: number }
      pages.push(body.page)
      return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 2 })
    }))
    const observers: IntersectionObserverCallback[] = []
    class ImmediateObserver {
      constructor(private cb: IntersectionObserverCallback) { observers.push(cb) }
      observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
      unobserve() {}
      disconnect() {}
    }
    const original = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = ImmediateObserver as unknown as typeof IntersectionObserver
    try {
      mountPicker()
      await waitFor(() => expect(pages).toEqual([1, 2]))
      expect(observers.length).toBeGreaterThan(0)
      expect(await screen.findAllByAltText('')).toHaveLength(2)
    } finally {
      globalThis.IntersectionObserver = original
    }
  })

  it('FE-JRN-PICKER-018: the embedded variant drops the header, the add-to bar and the date captions', async () => {
    mountPicker({ embedded: true, initialDate: '2026-03-15' })

    expect(await screen.findByTestId('journey-provider-picker-embedded')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Immich' })).not.toBeInTheDocument()
    expect(screen.queryByText('Add to')).not.toBeInTheDocument()
    expect(screen.queryByText('March 15, 2026')).not.toBeInTheDocument()
  })

  it('FE-JRN-PICKER-019: searches the picked custom range and ignores an incomplete one', async () => {
    const ranges: Record<string, unknown>[] = []
    server.use(http.post('/api/integrations/memories/immich/search', async ({ request }) => {
      ranges.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ assets: [asset('a1')], hasMore: false })
    }))
    const user = userEvent.setup()
    const { container } = mountPicker()
    await screen.findByText('March 15, 2026')
    ranges.length = 0

    await user.click(screen.getByRole('button', { name: 'Date Range' }))
    // No dates picked yet, so searching is a no-op.
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(ranges).toHaveLength(0)

    const [fromPicker, toPicker] = Array.from(container.querySelectorAll('.flex-1 > .relative')) as HTMLElement[]
    await user.click(within(fromPicker).getByRole('button'))
    await user.click(within(fromPicker).getByRole('button', { name: '3' }))
    await user.click(within(toPicker).getByRole('button'))
    await user.click(within(toPicker).getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => expect(ranges).toHaveLength(1))
    const range = ranges[0] as { from: string; to: string }
    expect(range.from.endsWith('-03')).toBe(true)
    expect(range.to.endsWith('-09')).toBe(true)
  })

  it('FE-JRN-PICKER-020: closes through the header button and the backdrop', async () => {
    const user = userEvent.setup()
    const { container, onClose } = mountPicker()
    await screen.findByText('March 15, 2026')

    const headerClose = screen.getByRole('heading', { name: 'Immich' })
      .parentElement!.querySelectorAll('button')[0]
    await user.click(headerClose)
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(container.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
