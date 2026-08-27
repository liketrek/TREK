// FE-JRN-EDITOR-001 to FE-JRN-EDITOR-040

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { localIsoDate } from '../../utils/localDate'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render'
import { seedStore } from '../../../tests/helpers/store'
import { buildSettings } from '../../../tests/helpers/factories'
import { useSettingsStore } from '../../store/settingsStore'
import { server } from '../../../tests/helpers/msw/server'
import type { GalleryPhoto, JourneyEntry, JourneyPhoto, JourneyTrip } from '../../store/journeyStore'
import type { ResilientResult, UploadProgress } from '../../utils/uploadQueue'
import { EntryEditor } from './JourneyDetailPageEntryEditor'

type ToastKind = 'success' | 'error' | 'warning' | 'info'

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0)

const trips: JourneyTrip[] = [
  { trip_id: 5, added_at: 0, title: 'Italy Trip', start_date: '2026-03-14', end_date: '2026-03-20', place_count: 3 },
]

function buildEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 0,
    journey_id: 1,
    author_id: 1,
    type: 'entry',
    entry_date: '2026-03-15',
    entry_time: '',
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
    ...overrides,
  }
}

function buildPhoto(id: number): JourneyPhoto {
  return { id, entry_id: 10, photo_id: id, caption: null, sort_order: 0, shared: 1, created_at: 0 }
}

function buildGalleryPhoto(id: number): GalleryPhoto {
  return { id, journey_id: 1, photo_id: id, caption: null, shared: 1, sort_order: 0, created_at: 0 }
}

function mountEditor(
  entry: JourneyEntry,
  opts: { galleryPhotos?: GalleryPhoto[]; withProviderHook?: boolean } = {},
) {
  const onClose = vi.fn()
  const onDone = vi.fn()
  const onSave = vi.fn(async (_data: Record<string, unknown>, _existingEntryId?: number) => 55)
  const onUploadPhotos = vi.fn(
    async (_entryId: number, files: File[], cbs?: { onProgress?: (p: UploadProgress) => void }) => {
      cbs?.onProgress?.({ done: files.length, total: files.length, failed: 0, percent: 100 })
      return { succeeded: [] as JourneyPhoto[], failed: [] as File[] }
    },
  )
  const onAddProviderPhotos = vi.fn(async () => {})
  const utils = render(
    <EntryEditor
      entry={entry}
      journeyId={1}
      tripDates={new Set(['2026-03-15'])}
      galleryPhotos={opts.galleryPhotos ?? []}
      trips={trips}
      userId={42}
      onClose={onClose}
      onSave={onSave}
      onUploadPhotos={onUploadPhotos}
      onAddProviderPhotos={opts.withProviderHook === false ? undefined : onAddProviderPhotos}
      onDone={onDone}
    />,
  )
  return { ...utils, onClose, onDone, onSave, onUploadPhotos, onAddProviderPhotos }
}

function useConnectedImmich() {
  server.use(
    http.get('/api/addons', () => HttpResponse.json({
      addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true }],
    })),
    http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
    http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({
      assets: [{ id: 'asset-1', takenAt: '2026-03-15T09:00:00.000Z', mediaType: 'image' }],
      hasMore: false,
    })),
  )
}

const originalCreateObjectURL = URL.createObjectURL

beforeEach(() => {
  toastSpy.mockClear()
  // The time field reads time_format, so pin it: without this the cases that
  // assert a 24h string depend on whichever test ran before them (#2067).
  seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) })
  window.__addToast = toastSpy
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true, writable: true, value: vi.fn(() => 'blob:preview'),
  })
})

afterEach(() => {
  delete window.__addToast
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true, writable: true, value: originalCreateObjectURL,
  })
})

describe('EntryEditor', () => {
  it('FE-JRN-EDITOR-001: opens as a new entry with empty fields', () => {
    mountEditor(buildEntry())

    expect(screen.getByRole('heading', { name: 'New Entry' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Give this moment a name...')).toHaveValue('')
    expect(screen.getByPlaceholderText('Write your story...')).toHaveValue('')
    expect(screen.getByPlaceholderText('Search location...')).toHaveValue('')
  })

  it('FE-JRN-EDITOR-002: seeds every field from an existing entry', () => {
    mountEditor(buildEntry({
      id: 10, title: 'Arrived in Rome', story: 'Amazing city', location_name: 'Rome',
      location_lat: 41.9, location_lng: 12.5, mood: 'amazing', weather: 'sunny',
      pros_cons: { pros: ['Great food'], cons: ['Crowded'] },
    }))

    expect(screen.getByRole('heading', { name: 'Edit Entry' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Arrived in Rome')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Amazing city')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rome')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Great food')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Crowded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Amazing' }).className).not.toContain('border-zinc-200')
  })

  it('FE-JRN-EDITOR-003: saves the edited fields and finishes', async () => {
    const user = userEvent.setup()
    const { onSave, onDone } = mountEditor(buildEntry({ id: 10, title: 'Old' }))

    await user.clear(screen.getByDisplayValue('Old'))
    await user.type(screen.getByPlaceholderText('Give this moment a name...'), 'Rome')
    await user.type(screen.getByPlaceholderText('Write your story...'), 'Great day')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Rome',
        story: 'Great day',
        entry_date: '2026-03-15',
        entry_time: null,
        location_name: null,
        mood: null,
        weather: null,
        pros_cons: { pros: [], cons: [] },
        type: undefined,
      }),
      10,
    )
  })

  it('FE-JRN-EDITOR-004: promotes a skeleton to a real entry once it has a story', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 21, type: 'skeleton', title: 'Venice' }))

    await user.type(screen.getByPlaceholderText('Write your story...'), 'Gondolas')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'entry' })
  })

  it('FE-JRN-EDITOR-005: uploads files queued before the save', async () => {
    const user = userEvent.setup()
    const { container, onUploadPhotos, onDone } = mountEditor(buildEntry())

    const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(onUploadPhotos).toHaveBeenCalledWith(55, [file], expect.anything())
  })

  it('FE-JRN-EDITOR-006: keeps the files that failed to upload and warns', async () => {
    const user = userEvent.setup()
    const { container, onUploadPhotos } = mountEditor(buildEntry())
    const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    onUploadPhotos.mockResolvedValueOnce({ succeeded: [], failed: [file] })

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('1 of 1 photos failed — save again to retry', 'error', undefined)
    })
    expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-007: reports a rejected upload', async () => {
    const user = userEvent.setup()
    const { container, onUploadPhotos, onDone } = mountEditor(buildEntry())
    onUploadPhotos.mockRejectedValueOnce(new Error('disk full'))

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('disk full', 'error', undefined))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-EDITOR-008: drops a queued file again from the preview strip', async () => {
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry())

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())

    const preview = container.querySelector('img[src="blob:preview"]') as HTMLElement
    await user.click(preview.parentElement!.querySelector('button') as HTMLElement)
    expect(container.querySelector('img[src="blob:preview"]')).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-009: links gallery photos picked before the entry exists', async () => {
    const linked: string[] = []
    server.use(http.post('/api/journeys/entries/55/link-photo', async ({ request }) => {
      linked.push(JSON.stringify(await request.json()))
      return HttpResponse.json({ id: 200 })
    }))
    const user = userEvent.setup()
    const { onDone } = mountEditor(buildEntry(), { galleryPhotos: [buildGalleryPhoto(200)] })

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    await user.click(screen.getAllByAltText('')[0])
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(linked).toEqual([JSON.stringify({ journey_photo_id: 200 })])
  })

  it('FE-JRN-EDITOR-010: links a gallery photo straight away on an existing entry', async () => {
    let linked = false
    server.use(http.post('/api/journeys/entries/10/link-photo', () => {
      linked = true
      return HttpResponse.json({ id: 200, entry_id: 10, photo_id: 200, sort_order: 0, shared: 1, created_at: 0 })
    }))
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry({ id: 10 }), { galleryPhotos: [buildGalleryPhoto(200)] })

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    await user.click(screen.getAllByAltText('')[0])

    await waitFor(() => expect(linked).toBe(true))
    // The linked photo joins the strip, so the picker reports nothing left.
    expect(container.querySelectorAll('img[src="/api/photos/200/thumbnail"]').length).toBeGreaterThan(0)
    expect(await screen.findByText('All photos already added')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-011: unlinks a removed photo from an existing entry', async () => {
    let unlinked = false
    server.use(http.delete('/api/journeys/entries/10/photos/100', () => {
      unlinked = true
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry({ id: 10, photos: [buildPhoto(100)] }))

    const tile = container.querySelector('img[src="/api/photos/100/thumbnail"]')!.parentElement as HTMLElement
    await user.click(tile.querySelector('button') as HTMLElement)

    await waitFor(() => expect(unlinked).toBe(true))
    expect(container.querySelector('img[src="/api/photos/100/thumbnail"]')).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-012: promoting a photo to first persists the new sort order', async () => {
    const patched: Array<{ id: string; body: unknown }> = []
    server.use(http.patch('/api/journeys/photos/:id', async ({ params, request }) => {
      patched.push({ id: String(params.id), body: await request.json() })
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry({ id: 10, photos: [buildPhoto(100), buildPhoto(101)] }))

    expect(screen.getByText('1st')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Make 1st' }))

    await waitFor(() => expect(patched).toHaveLength(2))
    expect(patched).toEqual([
      { id: '101', body: { sort_order: 0 } },
      { id: '100', body: { sort_order: 1 } },
    ])
    const imgs = Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src'))
    expect(imgs[0]).toBe('/api/photos/101/thumbnail')
  })

  it('FE-JRN-EDITOR-013: asks before discarding a dirty editor', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    const { onClose } = mountEditor(buildEntry({ id: 10, title: 'Rome' }))

    await user.type(screen.getByDisplayValue('Rome'), '!')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Discard them?')
    expect(onClose).not.toHaveBeenCalled()

    confirmSpy.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    confirmSpy.mockRestore()
  })

  it('FE-JRN-EDITOR-014: closes an untouched editor without asking', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    const { onClose } = mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
    confirmSpy.mockRestore()
  })

  it('FE-JRN-EDITOR-015: adds and removes pro and con rows', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 10 }))

    const [addPro, addCon] = screen.getAllByRole('button', { name: 'Add another' })
    await user.click(addPro)
    await user.click(addCon)

    const proInputs = screen.getAllByPlaceholderText('Something great...')
    expect(proInputs).toHaveLength(2)
    await user.type(proInputs[0], 'Food')
    await user.type(screen.getAllByPlaceholderText('Not so great...')[1], 'Queues')

    // Each extra row gets its own delete control once more than one exists.
    const removeSecondPro = proInputs[1].parentElement!.querySelector('button') as HTMLElement
    await user.click(removeSecondPro)
    expect(screen.getAllByPlaceholderText('Something great...')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ pros_cons: { pros: ['Food'], cons: ['Queues'] } })
  })

  it('FE-JRN-EDITOR-016: toggles mood and weather chips on and off', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'Neutral' }))
    await user.click(screen.getByRole('button', { name: 'Rainy' }))
    expect(screen.getByRole('button', { name: 'Rainy' }).className).toContain('bg-zinc-900')

    await user.click(screen.getByRole('button', { name: 'Rainy' }))
    expect(screen.getByRole('button', { name: 'Rainy' }).className).not.toContain('bg-zinc-900')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ mood: 'neutral', weather: null })
  })

  it('FE-JRN-EDITOR-017: picks a searched location and stores its coordinates', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({
      places: [{ name: 'Roma Termini', address: 'Piazza dei Cinquecento', lat: 41.9, lng: 12.5 }],
    })))
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 10 }))

    fireEvent.change(screen.getByPlaceholderText('Search location...'), { target: { value: 'Roma' } })

    const result = await screen.findByText('Roma Termini', {}, { timeout: 3000 })
    expect(screen.getByText('Piazza dei Cinquecento')).toBeInTheDocument()
    await user.click(result)

    expect(screen.getByDisplayValue('Roma Termini')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ location_name: 'Roma Termini', location_lat: 41.9, location_lng: 12.5 })
  })

  it('FE-JRN-EDITOR-018: shows no suggestions when the location search fails', async () => {
    let calls = 0
    server.use(http.post('/api/maps/search', () => {
      calls += 1
      return new HttpResponse(null, { status: 500 })
    }))
    mountEditor(buildEntry({ id: 10 }))
    const input = screen.getByPlaceholderText('Search location...')

    // A one-character query never reaches the network at all.
    fireEvent.change(input, { target: { value: 'R' } })
    fireEvent.change(input, { target: { value: 'Roma' } })

    await waitFor(() => expect(calls).toBe(1), { timeout: 3000 })
    await waitFor(() => expect(screen.queryByText('Searching...')).not.toBeInTheDocument())
    expect(screen.getByDisplayValue('Roma')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-022: dismisses the suggestion list and brings it back on focus', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({
      places: [{ name: 'Roma Termini', address: 'Piazza dei Cinquecento', lat: 41.9, lng: 12.5 }],
    })))
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10 }))
    const input = screen.getByPlaceholderText('Search location...')

    fireEvent.change(input, { target: { value: 'Roma' } })
    await screen.findByText('Roma Termini', {}, { timeout: 3000 })

    await user.click(document.querySelector('.fixed.inset-0.z-\\[99\\]') as HTMLElement)
    expect(screen.queryByText('Roma Termini')).not.toBeInTheDocument()

    fireEvent.focus(input)
    expect(screen.getByText('Roma Termini')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-019: reports that no external provider is connected', async () => {
    server.use(http.get('/api/addons', () => HttpResponse.json({})))
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))

    expect(await screen.findByText('No connected photo providers are available.')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-019b: leaving the external tab while the providers load does not strand the picker', async () => {
    server.use(
      http.get('/api/addons', async () => {
        await delay(120)
        return HttpResponse.json({
          addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true }],
        })
      }),
      http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
      http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({ assets: [], hasMore: false })),
    )
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))
    await user.click(screen.getByRole('button', { name: /Upload photos/ }))
    await user.click(screen.getByRole('button', { name: 'External photos' }))

    expect(await screen.findByTestId('journey-external-provider-immich')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-020: queues photos picked from a connected provider and clears them again', async () => {
    useConnectedImmich()
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10, location_lat: 41.9, location_lng: 12.5, location_name: 'Rome' }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))
    expect(await screen.findByTestId('journey-external-provider-immich')).toBeInTheDocument()
    expect(screen.getByText('Nearby photos first · Rome')).toBeInTheDocument()
    expect(screen.getByText('Photos for Mar 15, 2026')).toBeInTheDocument()

    await user.click(await screen.findByAltText(''))
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))

    const clearBtn = await screen.findByRole('button', { name: /1 queued · Clear/ })
    await user.click(clearBtn)
    expect(screen.queryByRole('button', { name: /queued/ })).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-021: sends queued provider photos on save and keeps the failed ones', async () => {
    useConnectedImmich()
    const user = userEvent.setup()
    const { onAddProviderPhotos, onDone } = mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))
    expect(await screen.findByText('All photos from this day')).toBeInTheDocument()
    await user.click(await screen.findByAltText(''))
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))
    await screen.findByRole('button', { name: /1 queued · Clear/ })

    onAddProviderPhotos.mockRejectedValueOnce(new Error('provider down'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('1 photo groups failed — save again to retry', 'error', undefined)
    })
    expect(onDone).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(onAddProviderPhotos).toHaveBeenLastCalledWith(55, expect.objectContaining({
      provider: 'immich',
      assetIds: ['asset-1'],
    }))
  })

  it('FE-JRN-EDITOR-023: the upload button closes the gallery picker and an empty pick is ignored', async () => {
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry(), { galleryPhotos: [buildGalleryPhoto(200)] })

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    expect(screen.getAllByAltText('')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Upload photos' }))
    expect(screen.queryByAltText('')).not.toBeInTheDocument()

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [] } })
    expect(container.querySelector('img[src="blob:preview"]')).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-024: falls back to today and an empty strip when the entry carries neither', () => {
    const { container } = mountEditor(buildEntry({
      entry_date: '', photos: undefined as unknown as JourneyPhoto[],
    }))

    const today = localIsoDate() // local, matching the editor's default — not the UTC date
    const label = new Date(today + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector('.w-20.h-20')).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-025: skips the photo upload when the save does not yield an entry id', async () => {
    const user = userEvent.setup()
    const { container, onSave, onUploadPhotos, onDone } = mountEditor(buildEntry())
    onSave.mockResolvedValueOnce(0)

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(onUploadPhotos).not.toHaveBeenCalled()
  })

  it('FE-JRN-EDITOR-026: promotes a skeleton the user saved without editing (#2008)', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 21, type: 'skeleton', title: 'Venice' }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'entry' })
  })

  it('FE-JRN-EDITOR-027: removes a con row again', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({
      id: 10, pros_cons: { pros: ['Food'], cons: ['Queues', 'Heat'] },
    }))

    const row = screen.getByDisplayValue('Heat').parentElement as HTMLElement
    await user.click(row.querySelector('button') as HTMLElement)
    expect(screen.queryByDisplayValue('Heat')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ pros_cons: { pros: ['Food'], cons: ['Queues'] } })
  })

  it('FE-JRN-EDITOR-028: a broken thumbnail retries once against the original size', async () => {
    const user = userEvent.setup()
    const { container } = mountEditor(
      buildEntry({ id: 10, photos: [buildPhoto(100)] }),
      { galleryPhotos: [buildGalleryPhoto(200)] },
    )

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    const galleryImg = container.querySelector('img[src="/api/photos/200/thumbnail"]') as HTMLImageElement
    fireEvent.error(galleryImg)
    expect(galleryImg.getAttribute('src')).toBe('/api/photos/200/original')
    // A second failure must not loop back onto the thumbnail.
    fireEvent.error(galleryImg)
    expect(galleryImg.getAttribute('src')).toBe('/api/photos/200/original')

    const stripImg = container.querySelector('img[src="/api/photos/100/thumbnail"]') as HTMLImageElement
    fireEvent.error(stripImg)
    expect(stripImg.getAttribute('src')).toBe('/api/photos/100/original')
    fireEvent.error(stripImg)
    expect(stripImg.getAttribute('src')).toBe('/api/photos/100/original')
  })

  it('FE-JRN-EDITOR-029: rolls the order back when persisting it fails', async () => {
    let attempts = 0
    server.use(http.patch('/api/journeys/photos/:id', () => {
      attempts += 1
      return HttpResponse.json({ error: 'sort rejected' }, { status: 500 })
    }))
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry({ id: 10, photos: [buildPhoto(100), buildPhoto(101)] }))

    await user.click(screen.getByRole('button', { name: 'Make 1st' }))

    await waitFor(() => expect(attempts).toBe(2))
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('sort rejected', 'error', undefined))
    const order = Array.from(container.querySelectorAll('.w-20.h-20 img')).map(i => i.getAttribute('src'))
    expect(order).toEqual(['/api/photos/100/thumbnail', '/api/photos/101/thumbnail'])
  })

  it('FE-JRN-EDITOR-047: a partly accepted order keeps what the server took', async () => {
    const patched: number[] = []
    server.use(http.patch('/api/journeys/photos/:id', ({ params }) => {
      const id = Number(params.id)
      patched.push(id)
      if (id === 100) return HttpResponse.json({ error: 'sort rejected' }, { status: 500 })
      return HttpResponse.json({ success: true })
    }))
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry({ id: 10, photos: [buildPhoto(100), buildPhoto(101)] }))

    await user.click(screen.getByRole('button', { name: 'Make 1st' }))

    await waitFor(() => expect(patched).toEqual([101, 100]))
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('sort rejected', 'error', undefined))
    // 101 is first on the server now; snapping the strip back would hide that.
    const order = Array.from(container.querySelectorAll('.w-20.h-20 img')).map(i => i.getAttribute('src'))
    expect(order).toEqual(['/api/photos/101/thumbnail', '/api/photos/100/thumbnail'])
  })

  it('FE-JRN-EDITOR-030: dropping an unsaved gallery pick cancels its link', async () => {
    const linked: string[] = []
    server.use(http.post('/api/journeys/entries/55/link-photo', async ({ request }) => {
      linked.push(JSON.stringify(await request.json()))
      return HttpResponse.json({ id: 200 })
    }))
    const user = userEvent.setup()
    const { container, onDone } = mountEditor(buildEntry(), { galleryPhotos: [buildGalleryPhoto(200)] })

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    await user.click(screen.getAllByAltText('')[0])
    await screen.findByText('All photos already added')

    const tile = container.querySelector('.w-20.h-20') as HTMLElement
    await user.click(tile.querySelector('button') as HTMLElement)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(linked).toEqual([])
  })

  it('FE-JRN-EDITOR-031: keeps a gallery photo in the picker when linking it fails', async () => {
    let attempts = 0
    server.use(http.post('/api/journeys/entries/10/link-photo', () => {
      attempts += 1
      return new HttpResponse(null, { status: 500 })
    }))
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10 }), { galleryPhotos: [buildGalleryPhoto(200)] })

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    await user.click(screen.getAllByAltText('')[0])

    await waitFor(() => expect(attempts).toBe(1))
    expect(screen.queryByText('All photos already added')).not.toBeInTheDocument()
    expect(screen.getAllByAltText('')).toHaveLength(1)
  })

  it('FE-JRN-EDITOR-032: only offers enabled and connected photo providers', async () => {
    server.use(
      http.get('/api/addons', () => HttpResponse.json({
        addons: [
          { id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true },
          { id: 'photoprism', name: 'PhotoPrism', type: 'photo_provider', icon: 'camera', enabled: true },
          { id: 'nas', name: 'NAS', type: 'photo_provider', icon: 'camera', enabled: false },
          { id: 'offline', name: 'Offline', type: 'photo_provider', icon: 'camera', enabled: true },
          { id: 'broken', name: 'Broken', type: 'photo_provider', icon: 'camera', enabled: true },
          { id: 'budget', name: 'Budget', type: 'feature', icon: 'wallet', enabled: true },
        ],
      })),
      http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
      http.get('/api/integrations/memories/photoprism/status', () => HttpResponse.json({ connected: true })),
      http.get('/api/integrations/memories/offline/status', () => HttpResponse.json({ connected: false })),
      http.get('/api/integrations/memories/broken/status', () => HttpResponse.error()),
      http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({
        assets: [{ id: 'asset-1', takenAt: '2026-03-15T09:00:00.000Z', mediaType: 'image' }],
        hasMore: false,
      })),
      http.post('/api/integrations/memories/photoprism/search', () => HttpResponse.json({ assets: [], hasMore: false })),
    )
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))

    expect(await screen.findByTestId('journey-external-provider-immich')).toBeInTheDocument()
    expect(screen.getByTestId('journey-external-provider-photoprism')).toBeInTheDocument()
    expect(screen.queryByTestId('journey-external-provider-nas')).not.toBeInTheDocument()
    expect(screen.queryByTestId('journey-external-provider-offline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('journey-external-provider-broken')).not.toBeInTheDocument()

    // Queue a photo from the first provider, then switch tabs.
    await user.click(await screen.findByAltText(''))
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))
    await screen.findByRole('button', { name: /1 queued · Clear/ })

    await user.click(screen.getByTestId('journey-external-provider-photoprism'))
    expect(screen.getByTestId('journey-external-provider-photoprism').className).toContain('bg-zinc-900')

    // The picker's own cancel drops back to the first available provider.
    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[0])
    expect(screen.getByTestId('journey-external-provider-photoprism').className).not.toContain('bg-zinc-900')
    expect(screen.getByRole('button', { name: /1 queued · Clear/ })).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-033: merges a second pick into the already queued group', async () => {
    server.use(
      http.get('/api/addons', () => HttpResponse.json({
        addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true }],
      })),
      http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
      http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({
        assets: [
          { id: 'asset-1', takenAt: '2026-03-15T09:00:00.000Z', mediaType: 'image' },
          { id: 'asset-2', takenAt: '2026-03-15T10:00:00.000Z', mediaType: 'video' },
        ],
        hasMore: false,
      })),
    )
    const user = userEvent.setup()
    const { onAddProviderPhotos, onDone } = mountEditor(buildEntry({ id: 10 }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))
    const tiles = await screen.findAllByAltText('')
    const assetIdOf = (img: HTMLElement) => img.getAttribute('src')!.split('/assets/0/')[1].split('/')[0]
    const firstId = assetIdOf(tiles[0])

    await user.click(tiles[0])
    await user.click(screen.getByRole('button', { name: 'Add (1)' }))
    await screen.findByRole('button', { name: /1 queued · Clear/ })

    // The first asset stays selected but is now greyed out, so the second Add
    // re-sends it and the merge has to skip the duplicate.
    const remaining = screen.getAllByAltText('').find(img => !img.parentElement!.className.includes('opacity-40'))!
    const secondId = assetIdOf(remaining)
    await user.click(remaining)
    await user.click(screen.getByRole('button', { name: 'Add (2)' }))
    expect(await screen.findByRole('button', { name: /2 queued · Clear/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(onAddProviderPhotos).toHaveBeenCalledTimes(1)
    expect(onAddProviderPhotos).toHaveBeenCalledWith(55, expect.objectContaining({
      provider: 'immich',
      assetIds: [firstId, secondId],
    }))
  })

  it('FE-JRN-EDITOR-034: greys out provider assets already linked to the entry', async () => {
    useConnectedImmich()
    const user = userEvent.setup()
    mountEditor(buildEntry({
      id: 10,
      // The locally uploaded photo carries no provider and must be ignored here.
      photos: [buildPhoto(99), { ...buildPhoto(100), provider: 'immich', asset_id: 'asset-1' }],
    }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))
    await screen.findByTestId('journey-external-provider-immich')

    await waitFor(() => expect(document.querySelector('.opacity-40')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-035: falls back to the day-wide provider search without a place name', async () => {
    useConnectedImmich()
    const user = userEvent.setup()
    mountEditor(buildEntry({ location_lat: 41.9, location_lng: 12.5 }))

    await user.click(screen.getByRole('button', { name: 'External photos' }))

    expect(await screen.findByText('All photos from this day')).toBeInTheDocument()
    expect(await screen.findByTestId('journey-external-provider-immich')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-040: ignores a link call that comes back without a photo', async () => {
    server.use(http.post('/api/journeys/entries/10/link-photo', () => HttpResponse.json(null)))
    const user = userEvent.setup()
    const { container } = mountEditor(buildEntry({ id: 10 }), { galleryPhotos: [buildGalleryPhoto(200)] })

    await user.click(screen.getByRole('button', { name: 'From Gallery' }))
    await user.click(screen.getAllByAltText('')[0])

    await waitFor(() => expect(screen.getAllByAltText('')).toHaveLength(1))
    expect(container.querySelector('.w-20.h-20')).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-036: shows the upload progress while photos are in flight', async () => {
    const user = userEvent.setup()
    const { container, onUploadPhotos, onDone } = mountEditor(buildEntry())
    let release: (r: ResilientResult<JourneyPhoto>) => void = () => {}
    onUploadPhotos.mockImplementationOnce((_entryId, files, cbs) =>
      new Promise<ResilientResult<JourneyPhoto>>(resolve => {
        cbs?.onProgress?.({ done: 1, total: files.length, failed: 0, percent: 50 })
        release = resolve
      }))

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Uploading 1/1…')).toBeInTheDocument()
    release({ succeeded: [], failed: [] })
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
  })

  it('FE-JRN-EDITOR-037: a fresh keystroke cancels the pending search and an empty payload yields nothing', async () => {
    let calls = 0
    server.use(http.post('/api/maps/search', () => {
      calls += 1
      return HttpResponse.json({})
    }))
    mountEditor(buildEntry({ id: 10 }))
    const input = screen.getByPlaceholderText('Search location...')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Ro' } })
    fireEvent.change(input, { target: { value: 'Rom' } })

    await waitFor(() => expect(calls).toBe(1), { timeout: 3000 })
    await waitFor(() => expect(screen.queryByText('Searching...')).not.toBeInTheDocument())
    expect(screen.getByDisplayValue('Rom')).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-038: shows a searching hint while the location lookup runs', async () => {
    server.use(http.post('/api/maps/search', async () => {
      await delay(200)
      return HttpResponse.json({ places: [{ name: 'Roma Termini', lat: 41.9, lng: 12.5 }] })
    }))
    mountEditor(buildEntry({ id: 10 }))

    fireEvent.change(screen.getByPlaceholderText('Search location...'), { target: { value: 'Roma' } })

    expect(await screen.findByText('Searching...', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(await screen.findByText('Roma Termini', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-039: highlights the picked mood with its own palette', async () => {
    const user = userEvent.setup()
    mountEditor(buildEntry({ id: 10 }))

    const amazing = screen.getByRole('button', { name: 'Amazing' })
    expect(amazing.getAttribute('style')).toBeNull()

    await user.click(amazing)
    expect(amazing.className).not.toContain('border-zinc-200')
    expect(amazing.getAttribute('style')).toBeTruthy()

    await user.click(amazing)
    expect(amazing.className).toContain('border-zinc-200')
    expect(amazing.getAttribute('style')).toBe('')
  })

  // #1614 — entry_time was stored, sent and displayed everywhere, but the desktop
  // editor never rendered an input for it.
  it('FE-JRN-EDITOR-041: shows the stored time and saves an edited one', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 10, title: 'Old', entry_time: '14:30:00' }))

    // The column carries HH:MM:SS; the picker is seeded from a HH:MM slice.
    const timeInput = screen.getByDisplayValue('14:30')

    fireEvent.change(timeInput, { target: { value: '09:05' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toEqual(expect.objectContaining({ entry_time: '09:05' }))
  })

  // #2067 — the field used to be a native <input type="time">, which paints 12h or
  // 24h from the browser locale and cannot be told otherwise. These pin that the
  // user's setting decides what is shown, and that storage stays 24h either way.
  it('FE-JRN-EDITOR-048: a 24h user sees a 24h clock with no meridiem', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) })
    const { container } = mountEditor(buildEntry({ id: 10, title: 'Old', entry_time: '14:30:00' }))

    expect(screen.getByDisplayValue('14:30')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\bPM\b/)
  })

  it('FE-JRN-EDITOR-049: a 12h user sees the same stored time as a meridiem clock', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) })
    mountEditor(buildEntry({ id: 10, title: 'Old', entry_time: '14:30:00' }))

    expect(screen.getByDisplayValue('2:30 PM')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('14:30')).not.toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-050: a meridiem typed by a 12h user is still stored as 24h', async () => {
    const user = userEvent.setup()
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) })
    const { onSave } = mountEditor(buildEntry({ id: 10, title: 'Old', entry_time: '14:30:00' }))

    const field = screen.getByDisplayValue('2:30 PM')
    fireEvent.focus(field)
    fireEvent.change(field, { target: { value: '5:30 pm' } })
    fireEvent.blur(field)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toEqual(expect.objectContaining({ entry_time: '17:30' }))
  })

  it('FE-JRN-EDITOR-042: clearing the time sends null rather than an empty string', async () => {
    const user = userEvent.setup()
    const { onSave } = mountEditor(buildEntry({ id: 10, entry_time: '14:30:00' }))

    fireEvent.change(screen.getByDisplayValue('14:30'), { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toEqual(expect.objectContaining({ entry_time: null }))
  })

  it('FE-JRN-EDITOR-044: reports a rejected save and keeps the editor open', async () => {
    const user = userEvent.setup()
    const { onSave, onDone } = mountEditor(buildEntry({ id: 10, title: 'Old' }))
    onSave.mockRejectedValueOnce(new Error('server said no'))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('server said no', 'error', undefined))
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Edit Entry' })).toBeInTheDocument()
  })

  it('FE-JRN-EDITOR-046: gives the preview blob URLs back when the editor closes', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const { container, unmount } = mountEditor(buildEntry())

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(container.querySelector('img[src="blob:preview"]')).toBeInTheDocument())

    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:preview')
    revoke.mockRestore()
  })

  it('FE-JRN-EDITOR-043: the camera route is its own input, so the library picker survives', () => {
    const { container } = mountEditor(buildEntry({ id: 10 }))

    const inputs = Array.from(container.querySelectorAll('input[type="file"]'))
    const camera = inputs.filter(i => i.getAttribute('capture') === 'environment')
    const library = inputs.filter(i => !i.hasAttribute('capture'))

    expect(camera).toHaveLength(1)
    expect(library).toHaveLength(1)
    // The library picker keeps multi-select; forcing capture onto it would drop that.
    expect(library[0]).toHaveAttribute('multiple')
    expect(camera[0]).not.toHaveAttribute('multiple')
  })
})
