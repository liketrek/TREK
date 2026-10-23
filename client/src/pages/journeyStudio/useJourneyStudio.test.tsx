import { act, renderHook, waitFor } from '@testing-library/react'
import type { BookRecord, JourneyStats } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { useJourneyStore } from '../../store/journeyStore'
import { useAuthStore } from '../../store/authStore'
import { journeyApi } from '../../api/client'
import { addListener } from '../../api/websocket'
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

// The auto layout lives in @trek/shared now; the hook's call into it is watched through a partial mock.
const shared = await vi.importActual<typeof import('@trek/shared')>('@trek/shared')
const buildBook = vi.fn(shared.buildBook)
vi.mock('@trek/shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@trek/shared')>()
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
  useStudioStore.setState({ doc: null, selection: [], activeSpread: 0, past: [], future: [], readOnly: false })
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

  /*
   * A book a newer Studio saved has already lost, in this copy, what this build
   * cannot read. It is shown and never changed, for every role, and let go once
   * Studio closes so the next book opens as it should.
   */
  it('FE-STUDIO-REV-001: holds a book a newer Studio saved read-only until Studio closes', async () => {
    const document = { ...shared.blankBook({ title: 'Iceland' }), schemaRev: shared.BOOK_SCHEMA_REV + 1 }
    vi.mocked(journeyApi.getBook).mockResolvedValue({
      book: { id: 3, journeyId: 9, title: 'Iceland', version: 4, updatedAt: '', updatedBy: 1, document },
    } as never)
    const { result, unmount } = await mountStudio()

    await waitFor(() => expect(result.current.saveState.status).toBe('newer'))
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canUndo).toBe(false)
    expect(useStudioStore.getState().readOnly).toBe(true)
    const before = useStudioStore.getState().doc
    act(() => { useStudioStore.getState().commit(d => ({ ...d, title: 'edited' })) })
    expect(useStudioStore.getState().doc).toBe(before)
    expect(journeyApi.saveBook).not.toHaveBeenCalled()

    unmount()
    expect(useStudioStore.getState().readOnly).toBe(false)
  })
})

/**
 * A save from elsewhere while the book is open (the assistant applying a page
 * edit, or another editor): the shell hands it to the store's adoptRemote, not
 * to load, so the user stays on their page, and flushBook is what the chat
 * panel calls before it lets the assistant write.
 */
describe('saves from elsewhere', () => {
  beforeEach(() => {
    vi.mocked(addListener).mockClear()
    useAuthStore.setState({ user: { id: 2 } } as never)
    vi.mocked(journeyApi.saveBook).mockImplementation(
      async (_id, body) =>
        ({
          id: 3, journeyId: 9, title: 'Iceland', version: 2,
          updatedAt: '2026-10-22 10:00:00', updatedBy: 2, document: body.document,
        }) as BookRecord,
    )
  })

  afterEach(() => {
    useAuthStore.setState({ user: null } as never)
  })

  /** Write a pending edit through flushBook, so nothing local is outstanding. */
  async function openAndFlush() {
    const view = await mountStudio()
    act(() => { useStudioStore.getState().commit(d => ({ ...d, title: 'edited' })) })
    let ok: boolean | undefined
    await act(async () => { ok = await view.result.current.flushBook() })
    return { ...view, ok }
  }

  /** The book as the server now has it: one page more, in front of the page the user is on. */
  function remoteWithPageBefore(index: number) {
    const local = useStudioStore.getState().doc
    if (!local) throw new Error('the book is not open')
    const at = local.spreads[index]
    const spreads = [
      ...local.spreads.slice(0, index),
      { ...at, id: 'from-elsewhere', elements: [] },
      ...local.spreads.slice(index),
    ]
    return { document: { ...local, spreads }, activeId: at.id }
  }

  async function deliverSave(savedBy: number) {
    await act(async () => {
      for (const call of vi.mocked(addListener).mock.calls) {
        call[0]({ type: 'journey:book:saved', journeyId: 9, version: 5, savedBy })
      }
      await Promise.resolve()
    })
  }

  it('FE-STUDIO-WIRE-001: flushBook writes the pending edit and says it landed', async () => {
    const { ok } = await openAndFlush()
    expect(ok).toBe(true)
    const calls = vi.mocked(journeyApi.saveBook).mock.calls
    expect((calls[calls.length - 1][1].document as { title?: string }).title).toBe('edited')
  })

  it('FE-STUDIO-WIRE-002: a save of this user keeps the page by its id and is one undo away', async () => {
    await openAndFlush()
    act(() => { useStudioStore.getState().setActiveSpread(2) })
    const { document, activeId } = remoteWithPageBefore(2)
    vi.mocked(journeyApi.getBook).mockResolvedValue({
      book: { id: 3, journeyId: 9, title: 'Iceland', version: 5, updatedAt: '', updatedBy: 2, document },
    } as never)

    await deliverSave(2)

    await waitFor(() => expect(useStudioStore.getState().doc?.spreads[2].id).toBe('from-elsewhere'))
    const state = useStudioStore.getState()
    expect(state.activeSpread).toBe(3)
    expect(state.doc?.spreads[3].id).toBe(activeId)
    expect(state.canUndo()).toBe(true)
  })

  it('FE-STUDIO-WIRE-003: a save by somebody else keeps the page but is not one Ctrl+Z away', async () => {
    await openAndFlush()
    act(() => { useStudioStore.getState().setActiveSpread(2) })
    const { document, activeId } = remoteWithPageBefore(2)
    vi.mocked(journeyApi.getBook).mockResolvedValue({
      book: { id: 3, journeyId: 9, title: 'Iceland', version: 5, updatedAt: '', updatedBy: 7, document },
    } as never)

    await deliverSave(7)

    await waitFor(() => expect(useStudioStore.getState().doc?.spreads[2].id).toBe('from-elsewhere'))
    const state = useStudioStore.getState()
    expect(state.doc?.spreads[state.activeSpread].id).toBe(activeId)
    expect(state.canUndo()).toBe(false)
  })
})
