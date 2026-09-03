import { act, renderHook, waitFor } from '@testing-library/react'
import type { JourneyStats } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { useJourneyStore } from '../../store/journeyStore'
import { journeyApi } from '../../api/client'
import { uploadStudioPhotos } from '../../components/Studio/studioUpload'

vi.mock('../../components/Studio/studioUpload', () => ({
  uploadStudioPhotos: vi.fn(async () => ({ photoIds: [], failed: 0, skippedVideos: 0 })),
}))

const toasts = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('../../components/shared/Toast', () => ({ useToast: () => toasts }))

/**
 * Studio's shell state (#1973), for the two things that cost work rather than
 * pixels: the keyboard reaching past an open text field, and the layout input
 * being frozen before the track has arrived.
 */

vi.mock('react-router', () => ({
  useParams: () => ({ id: '9' }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ state: null }),
}))

vi.mock('../../api/websocket', async importOriginal => ({
  ...await importOriginal<typeof import('../../api/websocket')>(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  joinBook: vi.fn(),
  leaveBook: vi.fn(),
  sendBookCursor: vi.fn(),
}))

const autoLayout = await vi.importActual<typeof import('../../components/Studio/autoLayout')>(
  '../../components/Studio/autoLayout',
)
const buildBook = vi.fn(autoLayout.buildBook)
vi.mock('../../components/Studio/autoLayout', async importOriginal => {
  const actual = await importOriginal<typeof import('../../components/Studio/autoLayout')>()
  return { ...actual, buildBook: (...args: Parameters<typeof actual.buildBook>) => buildBook(...args) }
})

import { useJourneyStudio } from './useJourneyStudio'

const TRACK = [[52.5, 13.4], [52.6, 13.5], [52.7, 13.6]]

const stats = (): JourneyStats => ({
  journeyId: 9, distance: 1000, days: 2, steps: 2, photos: 0, places: 2, furthest: 0,
  countries: [], trips: [], start: '2026-06-02', end: '2026-06-03',
  points: [],
} as unknown as JourneyStats)

/** A journey with one entry, which is all the auto layout needs to build. */
function seedJourney() {
  useJourneyStore.setState({
    current: {
      id: 9, title: 'Iceland', entries: [
        { id: 1, type: 'entry', title: 'A day', story: 'Something happened.', entry_date: '2026-06-02', photos: [] },
      ], gallery: [], trips: [],
    } as never,
    loading: false,
  })
}

beforeEach(() => {
  seedJourney()
  buildBook.mockClear()
  useStudioStore.setState({ doc: null, selection: [], activeSpread: 0, past: [], future: [] })
  vi.spyOn(journeyApi, 'getBook').mockResolvedValue({ book: null } as never)
  vi.spyOn(journeyApi, 'saveBook').mockResolvedValue({} as never)
  vi.spyOn(journeyApi, 'stats').mockResolvedValue(stats() as never)
  vi.spyOn(journeyApi, 'listTracks').mockResolvedValue({ tracks: [{ points: TRACK }] } as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Mount and wait until the one-shot build has run. */
async function mountStudio() {
  const view = renderHook(() => useJourneyStudio())
  await waitFor(() => expect(useStudioStore.getState().doc).not.toBeNull())
  return view
}

describe('the keyboard', () => {
  /*
   * Studio text commits on blur, so the sentence being typed is not in the undo
   * history yet: a Ctrl+Z inside a text box took back the change before it and
   * left the mistyped word exactly where it was.
   */
  it('leaves undo to the field somebody is typing in', async () => {
    const undo = vi.fn()
    useStudioStore.setState({ undo })
    await mountStudio()

    const field = document.createElement('textarea')
    document.body.appendChild(field)
    act(() => {
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
    })

    expect(undo).not.toHaveBeenCalled()
    field.remove()
  })

  it('undoes the document when nothing is being typed into', async () => {
    const undo = vi.fn()
    useStudioStore.setState({ undo })
    await mountStudio()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
    })

    expect(undo).toHaveBeenCalledTimes(1)
  })
})

describe('the auto layout input', () => {
  /*
   * The build waits on the book and the figures, never on the track, so the
   * input was frozen with an empty path — and a relayout afterwards drew the
   * straight ruler line over a route somebody had walked.
   */
  it('picks up the track that lands after the book was built', async () => {
    // Held back on purpose: the tracks request is the slow one in practice, and
    // the build does not wait for it.
    let release: (value: unknown) => void = () => {}
    vi.mocked(journeyApi.listTracks).mockReturnValue(new Promise(resolve => { release = resolve }) as never)

    const { result } = await mountStudio()
    await act(async () => {
      release({ tracks: [{ points: TRACK }] })
      await Promise.resolve()
    })

    act(() => { result.current.relayoutBook() })

    expect(buildBook).toHaveBeenCalled()
    const input = buildBook.mock.calls[buildBook.mock.calls.length - 1][0]
    expect(input.path).toEqual([TRACK])
  })

  it('leaves the path empty when the journey has no track', async () => {
    vi.mocked(journeyApi.listTracks).mockResolvedValue({ tracks: [] } as never)
    const { result } = await mountStudio()
    await waitFor(() => expect(journeyApi.listTracks).toHaveBeenCalled())

    act(() => { result.current.relayoutBook() })

    const input = buildBook.mock.calls[buildBook.mock.calls.length - 1][0]
    expect(input.path).toEqual([])
  })
})


/**
 * The three things the shell does for the panels beside it (#2064): put
 * pictures in, place the ones dropped on the sheet, and switch a stop off.
 *
 * All three end in the journey, not in the document, which is why they live
 * here rather than in a panel: the store and the figures are the shell's, and
 * a panel that reached for them itself would be a second path to the same
 * state.
 */
describe('pictures and stops', () => {
  beforeEach(() => {
    vi.mocked(uploadStudioPhotos).mockResolvedValue({ photoIds: [], failed: 0, skippedVideos: 0 })
    toasts.success.mockClear(); toasts.error.mockClear(); toasts.info.mockClear()
  })

  const file = () => new File(['x'], 'p.jpg', { type: 'image/jpeg' })

  it('says so when a picture did not arrive, and when a video was left out', async () => {
    vi.mocked(uploadStudioPhotos).mockResolvedValue({ photoIds: [5], failed: 2, skippedVideos: 1 })
    const { result } = await mountStudio()

    await act(async () => { await result.current.uploadPhotos([file()], null) })

    expect(toasts.error).toHaveBeenCalled()
    expect(toasts.info).toHaveBeenCalled()
  })

  it('answers with nothing sent when the upload itself fails', async () => {
    vi.mocked(uploadStudioPhotos).mockRejectedValue(new Error('offline'))
    const { result } = await mountStudio()

    let outcome
    await act(async () => { outcome = await result.current.uploadPhotos([file(), file()], null) })

    expect(outcome).toEqual({ photoIds: [], failed: 2, skippedVideos: 0 })
    expect(toasts.error).toHaveBeenCalled()
  })

  /*
   * A drop on the sheet is one undo step, however many pictures it carried:
   * the first fills the frame under the pointer when there is one, the rest
   * fan out from where they landed.
   */
  it('places what was dropped on the page, as one undo step', async () => {
    vi.mocked(uploadStudioPhotos).mockResolvedValue({ photoIds: [7, 8], failed: 0, skippedVideos: 0 })
    const { result } = await mountStudio()
    const before = useStudioStore.getState().doc!.spreads[0].elements.length

    await act(async () => { await result.current.dropFiles([file(), file()], { x: 40, y: 30 }, null) })

    const spread = useStudioStore.getState().doc!.spreads[0]
    const added = spread.elements.slice(before)
    expect(added.map(e => (e as { photoId?: number }).photoId)).toEqual([7, 8])
    expect(useStudioStore.getState().selection).toEqual(added.map(e => e.id))

    /*
     * One history entry for the whole drop, holding the page as it was, so a
     * single press takes all of it back. Read off the history rather than by
     * pressing undo here: the autosave watches the document and writes it back
     * on the next render, which is right in the editor and would make this
     * case about the save loop instead.
     */
    const history = useStudioStore.getState().past
    expect(history).toHaveLength(1)
    expect(history[0].spreads[0].elements).toHaveLength(before)
  })

  it('fills the frame the drop landed on rather than covering it', async () => {
    vi.mocked(uploadStudioPhotos).mockResolvedValue({ photoIds: [9], failed: 0, skippedVideos: 0 })
    const { result } = await mountStudio()
    act(() => {
      useStudioStore.getState().addElement(0, {
        id: 'frame-1', kind: 'photo', frame: { x: 0, y: 0, w: 50, h: 50 },
        rotation: 0, opacity: 1, locked: false, photoId: null,
        fit: 'cover', focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none',
      } as never)
    })
    const before = useStudioStore.getState().doc!.spreads[0].elements.length

    await act(async () => { await result.current.dropFiles([file()], { x: 10, y: 10 }, 'frame-1') })

    const spread = useStudioStore.getState().doc!.spreads[0]
    expect(spread.elements).toHaveLength(before)
    expect((spread.elements.find(e => e.id === 'frame-1') as { photoId?: number }).photoId).toBe(9)
  })

  it('places nothing when the drop brought no picture with it', async () => {
    const { result } = await mountStudio()
    const before = useStudioStore.getState().doc!.spreads[0].elements.length

    await act(async () => { await result.current.dropFiles([file()], { x: 10, y: 10 }, null) })

    expect(useStudioStore.getState().doc!.spreads[0].elements).toHaveLength(before)
  })

  /*
   * Switching a stop off is an edit to the journal, and the figures are the
   * server's sum: the hook writes the flag and then asks for them again rather
   * than adjusting the numbers it holds.
   */
  it('writes the flag and reads the figures back', async () => {
    const updateEntry = vi.fn(async () => {})
    useJourneyStore.setState({ updateEntry } as never)
    const fresh = { ...stats(), distance: 42 }
    vi.mocked(journeyApi.stats).mockResolvedValue(fresh as never)
    const { result } = await mountStudio()

    let ok
    await act(async () => { ok = await result.current.setStopExcluded(3, true) })

    expect(ok).toBe(true)
    expect(updateEntry).toHaveBeenCalledWith(3, { stats_excluded: true })
    expect(result.current.stats?.distance).toBe(42)
  })

  it('says the change did not land, and leaves the figures alone', async () => {
    useJourneyStore.setState({ updateEntry: vi.fn(async () => { throw new Error('403') }) } as never)
    const { result } = await mountStudio()
    const before = result.current.stats

    let ok
    await act(async () => { ok = await result.current.setStopExcluded(3, true) })

    expect(ok).toBe(false)
    expect(toasts.error).toHaveBeenCalled()
    expect(result.current.stats).toBe(before)
  })

  /* A viewer may open the book; the panels ask this before offering a control. */
  it('is read-only for a viewer', async () => {
    useJourneyStore.setState({
      current: { ...useJourneyStore.getState().current, my_role: 'viewer' },
    } as never)
    const { result } = await mountStudio()

    expect(result.current.canEdit).toBe(false)
  })
})
