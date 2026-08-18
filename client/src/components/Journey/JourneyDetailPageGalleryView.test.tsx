// FE-JRN-GALLERY-001 to FE-JRN-GALLERY-016

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { useJourneyStore, type GalleryPhoto, type JourneyEntry, type JourneyTrip } from '../../store/journeyStore'
import type { UploadProgress } from '../../utils/uploadQueue'
import { GalleryView } from './JourneyDetailPageGalleryView'

type ToastKind = 'success' | 'error' | 'warning' | 'info'

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0)

const uploadGalleryPhotos = vi.fn(
  async (_journeyId: number, files: File[], cbs?: { onProgress?: (p: UploadProgress) => void }) => {
    cbs?.onProgress?.({ done: files.length, total: files.length, failed: 0, percent: 100 })
    return { succeeded: [], failed: [] as File[] }
  },
)

const JOURNEY_ID = 9

// The global IntersectionObserver stub never fires; this one hands the callback
// back so the gallery's load-more sentinel can be driven into view on demand.
const galleryObservers: { cb: IntersectionObserverCallback; el: Element | null }[] = []

function triggerIntersection() {
  for (const o of galleryObservers) {
    o.cb([{ isIntersecting: true, target: o.el } as unknown as IntersectionObserverEntry], null as never)
  }
}

function stubIntersectionObserver() {
  galleryObservers.length = 0
  vi.stubGlobal('IntersectionObserver', class {
    observe: (el: Element) => void
    disconnect = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    constructor(cb: IntersectionObserverCallback) {
      const entry: { cb: IntersectionObserverCallback; el: Element | null } = { cb, el: null }
      galleryObservers.push(entry)
      this.observe = (el: Element) => { entry.el = el }
    }
  })
}

function buildGalleryPhoto(overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id: 100,
    journey_id: JOURNEY_ID,
    photo_id: 100,
    caption: null,
    shared: 1,
    sort_order: 0,
    created_at: 0,
    provider: 'local',
    ...overrides,
  }
}

const trips: JourneyTrip[] = [
  { trip_id: 5, added_at: 0, title: 'Italy Trip', start_date: '2026-03-14', end_date: '2026-03-20', place_count: 3 },
]

const entries: JourneyEntry[] = [
  {
    id: 10, journey_id: JOURNEY_ID, author_id: 1, type: 'entry', entry_date: '2026-03-15',
    title: 'Arrived in Rome', visibility: 'private', sort_order: 0, photos: [], created_at: 0, updated_at: 0,
  },
]

function mountGallery(gallery: GalleryPhoto[], onRegisterUpload?: (fn: () => void) => void) {
  const onPhotoClick = vi.fn()
  const onRefresh = vi.fn()
  const utils = render(
    <GalleryView
      entries={entries}
      gallery={gallery}
      journeyId={JOURNEY_ID}
      userId={1}
      trips={trips}
      onPhotoClick={onPhotoClick}
      onRefresh={onRefresh}
      onRegisterUpload={onRegisterUpload}
    />,
  )
  return { ...utils, onPhotoClick, onRefresh }
}

function useConnectedImmich() {
  server.use(
    http.get('/api/addons', () => HttpResponse.json({
      addons: [
        { id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true },
        { id: 'synologyphotos', name: 'Synology Photos', type: 'photo_provider', icon: 'camera', enabled: false },
        { id: 'vacay', name: 'Vacay', type: 'feature', icon: 'calendar', enabled: true },
      ],
    })),
    http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
    http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({
      assets: [{ id: 'asset-1', takenAt: '2026-03-15T10:00:00.000Z', mediaType: 'image' }],
      hasMore: false,
    })),
  )
}

beforeEach(() => {
  toastSpy.mockClear()
  uploadGalleryPhotos.mockClear()
  window.__addToast = toastSpy
  useJourneyStore.setState({ current: null, uploadGalleryPhotos })
})

afterEach(() => {
  delete window.__addToast
})

describe('GalleryView', () => {
  it('FE-JRN-GALLERY-001: shows the mascot empty state when the journey has no photos', async () => {
    const { container } = mountGallery([])

    expect(screen.getByText('No photos yet')).toBeInTheDocument()
    expect(container.querySelector('.trek--journey')).toBeInTheDocument()
    expect(screen.getByText('0 photos')).toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-002: renders one tile per photo with the thumbnail URL', () => {
    const { container } = mountGallery([buildGalleryPhoto(), buildGalleryPhoto({ id: 101, photo_id: 101 })])

    expect(container.querySelector('img[src="/api/photos/100/thumbnail"]')).toBeInTheDocument()
    expect(container.querySelector('img[src="/api/photos/101/thumbnail"]')).toBeInTheDocument()
    expect(screen.getByText('2 photos')).toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-003: forwards the clicked photo index to the parent', async () => {
    const user = userEvent.setup()
    const gallery = [buildGalleryPhoto(), buildGalleryPhoto({ id: 101, photo_id: 101 })]
    const { container, onPhotoClick } = mountGallery(gallery)

    await user.click(container.querySelector('img[src="/api/photos/101/thumbnail"]')!.parentElement as HTMLElement)

    expect(onPhotoClick).toHaveBeenCalledWith(gallery, 1)
  })

  it('FE-JRN-GALLERY-004: renders a neutral tile for a video without a poster', () => {
    const { container } = mountGallery([buildGalleryPhoto({ media_type: 'video', thumbnail_path: null })])

    expect(container.querySelector('img')).not.toBeInTheDocument()
    // Videos still get the play overlay.
    expect(container.querySelector('.lucide-play')).toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-005: renders the poster for a video that has one', () => {
    const { container } = mountGallery([buildGalleryPhoto({ media_type: 'video', thumbnail_path: 'thumbs/a.jpg' })])

    expect(container.querySelector('img[src="/api/photos/100/thumbnail"]')).toBeInTheDocument()
    expect(container.querySelector('.lucide-play')).toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-006: labels provider-backed photos and shows their caption', () => {
    mountGallery([
      buildGalleryPhoto({ id: 101, photo_id: 101, provider: 'immich', caption: 'Colosseum' }),
      buildGalleryPhoto({ id: 102, photo_id: 102, provider: 'synologyphotos' }),
      buildGalleryPhoto({ id: 103, photo_id: 103, provider: 'nextcloud' }),
      buildGalleryPhoto({ id: 104, photo_id: 104, provider: 'local' }),
    ])

    expect(screen.getByText('Immich')).toBeInTheDocument()
    expect(screen.getByText('Synology Photos')).toBeInTheDocument()
    expect(screen.getByText('nextcloud')).toBeInTheDocument()
    expect(screen.getByText('Colosseum')).toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-007: removes a deleted photo from the store optimistically', async () => {
    let deleted = false
    server.use(http.delete('/api/journeys/9/gallery/100', () => {
      deleted = true
      return HttpResponse.json({ ok: true })
    }))
    const photo = buildGalleryPhoto()
    useJourneyStore.setState({
      current: {
        id: JOURNEY_ID, user_id: 1, title: 'Italy', status: 'active', created_at: 0, updated_at: 0,
        entries: [{ ...entries[0], photos: [{ id: 100, entry_id: 10, photo_id: 100, sort_order: 0, shared: 1, created_at: 0 }] }],
        gallery: [photo], trips, contributors: [], stats: { entries: 1, photos: 1, places: 0 },
      },
    })
    const user = userEvent.setup()
    const { container, onRefresh } = mountGallery([photo])

    await user.click(container.querySelectorAll('button')[0])

    await waitFor(() => expect(deleted).toBe(true))
    const current = useJourneyStore.getState().current!
    expect(current.gallery).toHaveLength(0)
    expect(current.entries[0].photos).toHaveLength(0)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('FE-JRN-GALLERY-008: reports a failed delete and asks the parent to refetch', async () => {
    server.use(http.delete('/api/journeys/9/gallery/100', () => new HttpResponse(null, { status: 500 })))
    const photo = buildGalleryPhoto()
    useJourneyStore.setState({
      current: {
        id: JOURNEY_ID, user_id: 1, title: 'Italy', status: 'active', created_at: 0, updated_at: 0,
        entries: [], gallery: [photo], trips, contributors: [], stats: { entries: 0, photos: 1, places: 0 },
      },
    })
    const user = userEvent.setup()
    const { container, onRefresh } = mountGallery([photo])

    await user.click(container.querySelectorAll('button')[0])

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Error', 'error', undefined))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-GALLERY-009: ignores a delete while no journey is loaded', async () => {
    let deleted = false
    server.use(http.delete('/api/journeys/9/gallery/100', () => {
      deleted = true
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { container } = mountGallery([buildGalleryPhoto()])

    await user.click(container.querySelectorAll('button')[0])

    expect(deleted).toBe(false)
  })

  it('FE-JRN-GALLERY-010: only offers providers that are enabled and connected', async () => {
    useConnectedImmich()
    mountGallery([])

    expect(await screen.findByRole('button', { name: 'Immich' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Synology Photos' })).not.toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-011: offers no providers when the status probe fails', async () => {
    server.use(
      http.get('/api/addons', () => HttpResponse.json({
        addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true }],
      })),
      http.get('/api/integrations/memories/immich/status', () => new HttpResponse(null, { status: 401 })),
    )
    mountGallery([])

    await waitFor(() => expect(screen.getByText('No photos yet')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Immich' })).not.toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-012: adds picked provider photos to the gallery', async () => {
    useConnectedImmich()
    const bodies: Record<string, unknown>[] = []
    server.use(http.post('/api/journeys/9/gallery/provider-photos', async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ added: 1 })
    }))
    const user = userEvent.setup()
    const { onRefresh } = mountGallery([])

    await user.click(await screen.findByRole('button', { name: 'Immich' }))
    await user.click(await screen.findByAltText(''))
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1))
    expect(bodies[0]).toEqual({ provider: 'immich', asset_ids: ['asset-1'], media_types: ['image'] })
    expect(toastSpy).toHaveBeenCalledWith('1 photos added', 'success', undefined)
    expect(screen.queryByRole('heading', { name: 'Immich' })).not.toBeInTheDocument()
  })

  it('FE-JRN-GALLERY-013: reports when adding provider photos fails', async () => {
    useConnectedImmich()
    server.use(http.post('/api/journeys/9/gallery/provider-photos', () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    const { onRefresh } = mountGallery([])

    await user.click(await screen.findByRole('button', { name: 'Immich' }))
    await user.click(await screen.findByAltText(''))
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Error', 'error', undefined))
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('FE-JRN-GALLERY-014: uploads picked files and refreshes on success', async () => {
    let registered: (() => void) | null = null
    const { container, onRefresh } = mountGallery([], fn => { registered = fn })

    expect(registered).toBeTypeOf('function')
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] } })

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1))
    expect(uploadGalleryPhotos).toHaveBeenCalledTimes(1)
    expect(toastSpy).toHaveBeenCalledWith('1 photos uploaded', 'success', undefined)
    expect(input.value).toBe('')
  })

  it('FE-JRN-GALLERY-015: reports partially failed uploads but still refreshes', async () => {
    const failedFile = new File(['b'], 'b.jpg', { type: 'image/jpeg' })
    uploadGalleryPhotos.mockResolvedValueOnce({ succeeded: [], failed: [failedFile] })
    const { container, onRefresh } = mountGallery([])

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [failedFile] } })

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('1 of 1 photos failed — save again to retry', 'error', undefined)
    })
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-GALLERY-016: reports a rejected upload and ignores an empty selection', async () => {
    uploadGalleryPhotos.mockRejectedValueOnce({ code: 'ERR_NETWORK' })
    const { container, onRefresh } = mountGallery([])
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [] } })
    expect(uploadGalleryPhotos).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { files: [new File(['c'], 'c.jpg', { type: 'image/jpeg' })] } })

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Some photos failed to upload', 'error', undefined))
    expect(onRefresh).not.toHaveBeenCalled()
  })
  // #1614 — a long trip's gallery is hundreds of tiles; rendering them all at once
  // is what made scrolling it a chore.
  it('FE-JRN-GALLERY-017: renders a first page and grows as the trigger comes into view', () => {
    stubIntersectionObserver()
    const many = Array.from({ length: 145 }, (_, i) => buildGalleryPhoto({ id: 100 + i, photo_id: 100 + i }))
    const { container } = mountGallery(many)

    const tiles = () => container.querySelectorAll('.aspect-square')
    expect(tiles()).toHaveLength(60)

    // The observer is stubbed in this suite, so drive the trigger the way it would.
    act(() => { triggerIntersection() })
    expect(tiles()).toHaveLength(120)

    act(() => { triggerIntersection() })
    expect(tiles()).toHaveLength(145)
  })

  it('FE-JRN-GALLERY-018: a gallery below one page shows no trigger at all', () => {
    const { container } = mountGallery([buildGalleryPhoto(), buildGalleryPhoto({ id: 101, photo_id: 101 })])
    expect(container.querySelectorAll('.aspect-square')).toHaveLength(2)
    expect(container.querySelector('.animate-spin')).toBeNull()
  })
})
