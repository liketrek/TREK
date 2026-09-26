// FE-JRN-PICKER-001 to FE-JRN-PICKER-036

import { describe, it, expect, afterAll, beforeAll, beforeEach, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within, fireEvent } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import type { JourneyEntry, JourneyTrip } from '../../store/journeyStore'
import { PROVIDER_SEARCH_LAST_PAGE } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
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

// The day headings follow the reader's wall clock now, so they would follow the
// runner's zone too. Nothing in the vitest config pins one, so this file does.
const runnerTimeZone = process.env.TZ

beforeAll(() => { process.env.TZ = 'UTC' })
afterAll(() => {
  if (runnerTimeZone === undefined) delete process.env.TZ
  else process.env.TZ = runnerTimeZone
})

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
    // utc_offset_minutes rides along on every search: the server cannot tell
    // which 24 hours a date-only bound means without it (#2336).
    expect(ranges[1]).toEqual({ from: '', to: '', page: 1, size: 200, utc_offset_minutes: 0 })
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

  it('FE-JRN-PICKER-022: says which zone the searched day is meant in', async () => {
    const ranges: Record<string, unknown>[] = []
    server.use(http.post('/api/integrations/memories/immich/search', async ({ request }) => {
      ranges.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ assets: [asset('a1')], hasMore: false })
    }))
    process.env.TZ = 'Australia/Sydney'
    try {
      mountPicker({ initialDate: '2026-03-15' })
      await waitFor(() => expect(ranges).toHaveLength(1))
    } finally {
      process.env.TZ = 'UTC'
    }

    // +11 on 15 March, read at local noon of the day being searched rather than
    // at "now" — Sydney is +10 for half the year, so a day picked out of the
    // other half would otherwise be an hour off.
    expect(ranges[0]).toMatchObject({ from: '2026-03-15', to: '2026-03-15', utc_offset_minutes: 660 })
  })

  it('FE-JRN-PICKER-023: keeps paging when a page holds no photos of the searched day', async () => {
    // The local-day filter can empty a whole page (50 shots taken the next
    // morning). The sentinel used to live inside the grid, so an empty page
    // mounted none and the picker sat on "no photos" forever (#2336).
    const pages: number[] = []
    server.use(http.post('/api/integrations/memories/immich/search', async ({ request }) => {
      const body = await request.json() as { page: number }
      pages.push(body.page)
      return HttpResponse.json({ assets: body.page < 2 ? [] : [asset('a1')], hasMore: body.page < 2 })
    }))
    class ImmediateObserver {
      constructor(private cb: IntersectionObserverCallback) {}
      observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
      unobserve() {}
      disconnect() {}
    }
    const original = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = ImmediateObserver as unknown as typeof IntersectionObserver
    try {
      mountPicker()
      await waitFor(() => expect(pages).toEqual([1, 2]))
      expect(await screen.findAllByAltText('')).toHaveLength(1)
      // And the empty first page never claimed there were none to find.
      expect(screen.queryByText('No photos yet')).not.toBeInTheDocument()
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

  it('FE-JRN-PICKER-021: a location picked after the photos loaded reorders the grid', async () => {
    // contextLocation is live editor state: the place search and "use my location"
    // write it while this picker stays mounted, and the key is only provider plus
    // date. Sorting inside the fetch instead of in a memo leaves the grid frozen
    // while the caption above it already claims nearest-first.
    searchReturns([
      asset('rome', { lat: 41.9, lng: 12.5, takenAt: '2026-03-15T09:00:00.000Z' }),
      asset('helsinki', { lat: 60.17, lng: 24.94, takenAt: '2026-03-15T11:00:00.000Z' }),
    ])
    const props = {
      provider: 'immich',
      userId: 42,
      entries,
      trips,
      existingAssetIds: new Set<string>(),
      onClose: vi.fn(),
      onAdd: vi.fn(async () => {}),
    } as React.ComponentProps<typeof ProviderPicker>
    const { container, rerender } = render(<ProviderPicker {...props} />)
    await screen.findByText('March 15, 2026')

    const order = () => Array.from(container.querySelectorAll('img'))
      .map(img => (img.getAttribute('src') || '').split('/assets/0/')[1]?.split('/')[0])
      .filter(Boolean)

    // Nothing to be near yet, so newest first.
    expect(order()).toEqual(['helsinki', 'rome'])

    rerender(<ProviderPicker {...props} contextLocation={{ lat: 41.9, lng: 12.5, name: 'Rome' }} />)

    await waitFor(() => expect(order()).toEqual(['rome', 'helsinki']))
  })

  describe('select all across pages (#1587)', () => {
    const SEARCH = '/api/integrations/memories/immich/search'
    /** The tile button of one asset, found by the thumbnail it shows. */
    const tile = (container: HTMLElement, id: string) =>
      container.querySelector(`img[src*="/assets/0/${id}/"]`)!.closest('button') as HTMLButtonElement

    function pagedTrip(pages: Record<number, Record<string, unknown>[]>, bodies: Record<string, unknown>[] = []) {
      const last = Math.max(...Object.keys(pages).map(Number))
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        bodies.push(body)
        return HttpResponse.json({ assets: pages[body.page] ?? [], hasMore: body.page < last })
      }))
      return bodies
    }

    it('FE-JRN-PICKER-024: on a trip, loads the pages still missing with the same search, then selects every photo', async () => {
      const bodies = pagedTrip({ 1: [asset('p1a'), asset('p1b')], 2: [asset('p2a')], 3: [asset('p3a')] })
      const user = userEvent.setup()
      mountPicker()

      // Pages are still pending, so the count says it is a floor.
      await user.click(await screen.findByRole('button', { name: /Select all \(2\+\)/ }))

      expect(await screen.findByRole('button', { name: 'Add (4)' })).toBeEnabled()
      expect(bodies.map((b) => b.page)).toEqual([1, 2, 3])
      expect(bodies[2]).toEqual({ from: '2026-03-14', to: '2026-03-20', page: 3, size: 200, utc_offset_minutes: 0 })
      // Everything is in now: the count is exact and the next press takes them back.
      expect(screen.getByRole('button', { name: /Deselect all \(4\)/ })).toBeInTheDocument()
      expect(await screen.findAllByAltText('')).toHaveLength(4)
    })

    it('FE-JRN-PICKER-025: the button is busy while the pages load', async () => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        if (body.page === 2) await gate
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 2 })
      }))
      const user = userEvent.setup()
      mountPicker()

      const button = await screen.findByRole('button', { name: /Select all \(1\+\)/ })
      await user.click(button)

      await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'))
      expect(button).toBeDisabled()
      release()
      await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'false'))
      expect(button).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Add (2)' })).toBeEnabled()
    })

    it('FE-JRN-PICKER-026: on All Photos, selects what is loaded and never drains the library', async () => {
      const bodies: Record<string, unknown>[] = []
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { from: string }
        bodies.push(body)
        return body.from
          ? HttpResponse.json({ assets: [asset('t1')], hasMore: false })
          : HttpResponse.json({ assets: [asset('lib1'), asset('lib2')], hasMore: true })
      }))
      const user = userEvent.setup()
      mountPicker()
      await screen.findByRole('button', { name: /Select all \(1\)/ })

      await user.click(screen.getByRole('button', { name: /All Photos/ }))
      await user.click(await screen.findByRole('button', { name: /Select all \(2\+\)/ }))

      expect(screen.getByRole('button', { name: 'Add (2)' })).toBeEnabled()
      expect(screen.getByRole('button', { name: /Deselect all \(2\+\)/ })).toBeInTheDocument()
      // The trip search and the first library page, nothing after them.
      expect(bodies).toHaveLength(2)
    })

    it('FE-JRN-PICKER-027: adds to picks from another tab, and deselect all takes back only the photos in view', async () => {
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { from: string }
        return body.from
          ? HttpResponse.json({ assets: [asset('t1'), asset('t2')], hasMore: false })
          : HttpResponse.json({ assets: [asset('lib1')], hasMore: false })
      }))
      const user = userEvent.setup()
      const { container, onAdd } = mountPicker()
      await screen.findByRole('button', { name: /Select all \(2\)/ })

      await user.click(tile(container, 't1'))
      await user.click(screen.getByRole('button', { name: /All Photos/ }))
      await user.click(await screen.findByRole('button', { name: /Select all \(1\)/ }))
      expect(screen.getByRole('button', { name: 'Add (2)' })).toBeEnabled()

      await user.click(screen.getByRole('button', { name: /Deselect all \(1\)/ }))
      await user.click(screen.getByRole('button', { name: 'Add (1)' }))
      expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['t1'], mediaTypes: ['image'], passphrase: undefined }], null)
    })

    it('FE-JRN-PICKER-028: switching tab mid-run cancels it and selects nothing', async () => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      const pages: number[] = []
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        pages.push(body.page)
        if (body.page === 2) await gate
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 3 })
      }))
      const user = userEvent.setup()
      mountPicker()

      await user.click(await screen.findByRole('button', { name: /Select all \(1\+\)/ }))
      await waitFor(() => expect(pages).toEqual([1, 2]))
      await user.click(screen.getByRole('button', { name: 'Date Range' }))
      release()
      await new Promise((resolve) => setTimeout(resolve, 30))

      expect(pages).toEqual([1, 2])
      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Select all \(1\+\)/ })).toHaveAttribute('aria-busy', 'false')
    })

    it('FE-JRN-PICKER-029: closing the picker mid-run stops it', async () => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      const pages: number[] = []
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        pages.push(body.page)
        if (body.page === 2) await gate
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 3 })
      }))
      const user = userEvent.setup()
      const { unmount } = mountPicker()

      await user.click(await screen.findByRole('button', { name: /Select all \(1\+\)/ }))
      await waitFor(() => expect(pages).toEqual([1, 2]))
      unmount()
      release()
      await new Promise((resolve) => setTimeout(resolve, 30))

      expect(pages).toEqual([1, 2])
    })

    it('FE-JRN-PICKER-030: a page that fails keeps what arrived selected, and pressing again carries on', async () => {
      let failPage2 = true
      const pages: number[] = []
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        pages.push(body.page)
        if (body.page === 2 && failPage2) return new HttpResponse(null, { status: 502 })
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 2 })
      }))
      const user = userEvent.setup()
      mountPicker()

      await user.click(await screen.findByRole('button', { name: /Select all \(1\+\)/ }))
      expect(await screen.findByRole('button', { name: 'Add (1)' })).toBeEnabled()
      // Still pending, so still a floor, and still a select rather than a deselect.
      const again = await screen.findByRole('button', { name: /Select all \(1\+\)/ })

      failPage2 = false
      await user.click(again)
      expect(await screen.findByRole('button', { name: 'Add (2)' })).toBeEnabled()
      expect(pages).toEqual([1, 2, 2])
    })

    it('FE-JRN-PICKER-033: Add waits for a Select all that is still loading, so it never sends only the earlier picks', async () => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        if (body.page === 2) await gate
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 2 })
      }))
      const user = userEvent.setup()
      const { container, onAdd } = mountPicker()
      await screen.findByRole('button', { name: /Select all \(1\+\)/ })

      // A pick from before the run makes Add live on its own.
      await user.click(tile(container, 'p1'))
      const add = screen.getByRole('button', { name: 'Add (1)' })
      expect(add).toBeEnabled()

      await user.click(screen.getByRole('button', { name: /Select all \(1\+\)/ }))
      await waitFor(() => expect(add).toBeDisabled())
      fireEvent.click(add)
      expect(onAdd).not.toHaveBeenCalled()

      release()
      const full = await screen.findByRole('button', { name: 'Add (2)' })
      await waitFor(() => expect(full).toBeEnabled())
      await user.click(full)
      expect(onAdd).toHaveBeenCalledTimes(1)
      expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['p1', 'p2'], mediaTypes: ['image', 'image'], passphrase: undefined }], null)
    })

    it('FE-JRN-PICKER-034: a Select all cancelled by a tab switch gives Add back, with only the earlier picks', async () => {
      let release!: () => void
      const gate = new Promise<void>((resolve) => { release = resolve })
      const pages: number[] = []
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        pages.push(body.page)
        if (body.page === 2) await gate
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 2 })
      }))
      const user = userEvent.setup()
      const { container, onAdd } = mountPicker()
      await screen.findByRole('button', { name: /Select all \(1\+\)/ })
      await user.click(tile(container, 'p1'))

      await user.click(screen.getByRole('button', { name: /Select all \(1\+\)/ }))
      await waitFor(() => expect(pages).toEqual([1, 2]))
      expect(screen.getByRole('button', { name: 'Add (1)' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Date Range' }))
      const add = screen.getByRole('button', { name: 'Add (1)' })
      await waitFor(() => expect(add).toBeEnabled())
      release()
      await new Promise((resolve) => setTimeout(resolve, 30))

      // The page that arrived after the cancel selected nothing.
      expect(screen.getByRole('button', { name: 'Add (1)' })).toBeEnabled()
      await user.click(add)
      expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['p1'], mediaTypes: ['image'], passphrase: undefined }], null)
    })

    it('FE-JRN-PICKER-035: offers Select all while every photo in view is already added but more pages are pending', async () => {
      // Say the trip's last day came in earlier from the Day tab: the newest page
      // is all greyed out, and the older days are still to load.
      const bodies = pagedTrip({ 1: [asset('old1'), asset('old2')], 2: [asset('new1')] })
      const user = userEvent.setup()
      const { onAdd } = mountPicker({ existingAssetIds: new Set(['old1', 'old2']) })

      await user.click(await screen.findByRole('button', { name: /Select all \(0\+\)/ }))

      expect(await screen.findByRole('button', { name: 'Add (1)' })).toBeEnabled()
      expect(bodies.map((b) => b.page)).toEqual([1, 2])
      await user.click(screen.getByRole('button', { name: 'Add (1)' }))
      expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['new1'], mediaTypes: ['image'], passphrase: undefined }], null)
    })

    /** A trip that never runs out: every page says there is more, only the first and the last hold a photo. */
    function endlessTrip(pages: number[]) {
      server.use(http.post(SEARCH, async ({ request }) => {
        const body = await request.json() as { page: number }
        pages.push(body.page)
        const photos = body.page === 1 || body.page === PROVIDER_SEARCH_LAST_PAGE ? [asset(`p${body.page}`)] : []
        return HttpResponse.json({ assets: photos, hasMore: true })
      }))
    }

    it('FE-JRN-PICKER-036: Select all stops at the last page and keeps the "+", and nothing past it is asked for, by a second press or by scrolling', async () => {
      const pages: number[] = []
      endlessTrip(pages)
      const user = userEvent.setup()
      const { container } = mountPicker()
      /** The scroll trigger at the foot of the grid, the spinner that loads the next page. */
      const scrollTrigger = () => container.querySelector('.mt-2.py-4 .animate-spin')
      const selectAll = await screen.findByRole('button', { name: /Select all \(1\+\)/ })
      expect(scrollTrigger()).toBeInTheDocument()

      await user.click(selectAll)

      // The server's scan ceiling is sized for this page, so it is still
      // answered, and nothing past it is asked for.
      expect(await screen.findByRole('button', { name: 'Add (2)' }, { timeout: 10000 })).toBeEnabled()
      expect(pages).toHaveLength(PROVIDER_SEARCH_LAST_PAGE)
      expect(Math.max(...pages)).toBe(PROVIDER_SEARCH_LAST_PAGE)
      expect(scrollTrigger()).not.toBeInTheDocument()
      // Everything loaded is picked and there is more: a deselect, with the "+",
      // and selecting again takes what is loaded without asking any further.
      await user.click(screen.getByRole('button', { name: /Deselect all \(2\+\)/ }))
      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: /Select all \(2\+\)/ }))
      expect(screen.getByRole('button', { name: 'Add (2)' })).toBeEnabled()
      expect(pages).toHaveLength(PROVIDER_SEARCH_LAST_PAGE)
    }, 20000)
  })

  it('FE-JRN-PICKER-031: sends each group oldest first, by wall clock where the provider has one (#1587)', async () => {
    searchReturns([
      asset('late', { takenAt: '2026-03-15T12:00:00.000Z' }),
      asset('early', { takenAt: '2026-03-15T08:00:00.000Z', mediaType: 'video' }),
      // Later as an instant, earliest on the photographer's own clock.
      asset('wallclock', { takenAt: '2026-03-15T20:00:00.000Z', localTakenAt: '2026-03-15T06:00:00.000Z' }),
      asset('undated', { takenAt: null }),
    ])
    const user = userEvent.setup()
    const { onAdd } = mountPicker()

    await user.click(await screen.findByRole('button', { name: /Select all \(4\)/ }))
    await user.click(screen.getByRole('button', { name: 'Add (4)' }))

    expect(onAdd).toHaveBeenCalledWith(
      [{
        assetIds: ['wallclock', 'early', 'late', 'undated'],
        mediaTypes: ['image', 'video', 'image', 'image'],
        passphrase: undefined,
      }],
      null,
    )
  })

  it('FE-JRN-PICKER-032: a search after an album pages again and carries no album passphrase', async () => {
    const pages: number[] = []
    server.use(
      http.get('/api/integrations/memories/immich/albums', () => HttpResponse.json({
        albums: [{ id: 'alb1', albumName: 'Rome', assetCount: 1, passphrase: 'pw' }],
      })),
      http.get('/api/integrations/memories/immich/albums/alb1/photos', () => HttpResponse.json({ assets: [asset('alb-a1')] })),
      http.post('/api/integrations/memories/immich/search', async ({ request }) => {
        const body = await request.json() as { page: number }
        pages.push(body.page)
        return HttpResponse.json({ assets: [asset(`p${body.page}`)], hasMore: body.page < 2 })
      }),
    )
    const user = userEvent.setup()
    const { onAdd } = mountPicker()
    await screen.findByRole('button', { name: /Select all \(1\+\)/ })

    await user.click(screen.getByRole('button', { name: 'Albums' }))
    await user.click(await screen.findByRole('button', { name: 'Rome (1)' }))
    await screen.findByRole('button', { name: /Select all \(1\)/ })
    await user.click(screen.getByRole('button', { name: 'Trip Period' }))

    // The trip is paged again: without the reset the album left behind hid the "+".
    await user.click(await screen.findByRole('button', { name: /Select all \(1\+\)/ }))
    expect(await screen.findByRole('button', { name: 'Add (2)' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Add (2)' }))
    expect(onAdd).toHaveBeenCalledWith([{ assetIds: ['p1', 'p2'], mediaTypes: ['image', 'image'], passphrase: undefined }], null)
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
