import { act, renderHook, waitFor } from '@testing-library/react'
import type { JourneyStats } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { useJourneyStore } from '../../store/journeyStore'
import { journeyApi } from '../../api/client'

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
  useStudioStore.setState({ doc: null, selection: [], activeSpread: 0 })
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
