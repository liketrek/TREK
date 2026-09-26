import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { useHelpStore, docTitle } from './helpStore'

const initial = useHelpStore.getState()

const HIT = { slug: 'Creating-a-Trip', title: 'Creating a Trip', section: 'Planning', anchor: 'fields', heading: 'Fields', snippet: 'Give the trip a name…', score: 12 }

beforeEach(() => {
  useHelpStore.setState(initial, true)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Let the debounce elapse and the request settle. */
async function flush(ms = 300): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('helpStore: dialog and navigation', () => {
  it('opens, closes and toggles', () => {
    const s = useHelpStore.getState()
    expect(s.open).toBe(false)
    s.openHelp()
    expect(useHelpStore.getState().open).toBe(true)
    s.toggleHelp()
    expect(useHelpStore.getState().open).toBe(false)
    s.toggleHelp()
    expect(useHelpStore.getState().open).toBe(true)
    s.closeHelp()
    expect(useHelpStore.getState().open).toBe(false)
  })

  it('closing clears the search and the lightbox but keeps the guide for next time', () => {
    const s = useHelpStore.getState()
    s.openGuide('create-trip')
    s.openLightbox({ src: '/x.webp', alt: 'x' })
    useHelpStore.setState({ query: 'trip', docHits: [HIT], searchStatus: 'done' })
    s.closeHelp()
    const after = useHelpStore.getState()
    expect(after.open).toBe(false)
    expect(after.lightbox).toBeNull()
    expect(after.query).toBe('')
    expect(after.docHits).toEqual([])
    expect(after.searchStatus).toBe('idle')
    expect(after.guideId).toBe('create-trip')
  })

  it('records the screen and keeps an open guide across a screen change while the dialog is open', () => {
    const s = useHelpStore.getState()
    s.setContext('dashboard')
    s.openGuide('widgets')
    s.setContext('settings')
    const now = useHelpStore.getState()
    expect(now.contextId).toBe('settings')
    expect(now.guideId).toBe('widgets')
    s.setContext(null)
    expect(useHelpStore.getState().contextId).toBeNull()
  })

  it('drops a leftover guide when another screen is reached with the dialog closed', () => {
    const s = useHelpStore.getState()
    s.setContext('dashboard')
    s.openGuide('create-trip')
    s.closeHelp()
    s.setContext('vacay')
    const now = useHelpStore.getState()
    expect(now.contextId).toBe('vacay')
    expect(now.guideId).toBeNull()
  })

  it('opening a guide opens the dialog and drops a pending search', async () => {
    const s = useHelpStore.getState()
    s.setQuery('cover')
    expect(useHelpStore.getState().searchStatus).toBe('loading')
    s.openGuide('cover-image')
    const now = useHelpStore.getState()
    expect(now.open).toBe(true)
    expect(now.guideId).toBe('cover-image')
    expect(now.query).toBe('')
    expect(now.searchStatus).toBe('idle')
    await flush()
    expect(useHelpStore.getState().docHits).toEqual([])
  })

  it('closeGuide returns to the overview and closes the lightbox', () => {
    const s = useHelpStore.getState()
    s.openGuide('create-trip')
    s.openLightbox({ src: '/x.webp', alt: 'x' })
    s.closeGuide()
    expect(useHelpStore.getState().guideId).toBeNull()
    expect(useHelpStore.getState().lightbox).toBeNull()
  })
})

describe('helpStore: search', () => {
  it('debounces, then asks the server and stores the hits', async () => {
    const seen: string[] = []
    server.use(
      http.get('/api/help/search', ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('q') ?? '')
        return HttpResponse.json({ hits: [HIT] })
      }),
    )
    const s = useHelpStore.getState()
    s.setQuery('c')
    s.setQuery('co')
    s.setQuery('cover')
    expect(useHelpStore.getState().searchStatus).toBe('loading')
    await flush()
    expect(seen).toEqual(['cover'])
    expect(useHelpStore.getState().docHits).toEqual([HIT])
    expect(useHelpStore.getState().searchStatus).toBe('done')
  })

  it('a blank query clears the results without a request', async () => {
    let calls = 0
    server.use(http.get('/api/help/search', () => { calls++; return HttpResponse.json({ hits: [HIT] }) }))
    const s = useHelpStore.getState()
    s.setQuery('trip')
    await flush()
    expect(useHelpStore.getState().docHits).toHaveLength(1)
    s.setQuery('   ')
    await flush()
    expect(useHelpStore.getState().docHits).toEqual([])
    expect(useHelpStore.getState().searchStatus).toBe('idle')
    expect(calls).toBe(1)
  })

  it('a slow older answer never overwrites a newer one', async () => {
    server.use(
      http.get('/api/help/search', async ({ request }) => {
        const q = new URL(request.url).searchParams.get('q')
        if (q === 'old') {
          await delay(500)
          return HttpResponse.json({ hits: [{ ...HIT, title: 'OLD' }] })
        }
        return HttpResponse.json({ hits: [{ ...HIT, title: 'NEW' }] })
      }),
    )
    const s = useHelpStore.getState()
    s.setQuery('old')
    await flush(250)
    s.setQuery('new')
    await flush(1000)
    expect(useHelpStore.getState().docHits.map(h => h.title)).toEqual(['NEW'])
  })

  it('reports a failed search instead of pretending there are no docs', async () => {
    server.use(http.get('/api/help/search', () => HttpResponse.json({ error: 'boom' }, { status: 502 })))
    useHelpStore.getState().setQuery('trip')
    await flush()
    expect(useHelpStore.getState().searchStatus).toBe('error')
    expect(useHelpStore.getState().docHits).toEqual([])
  })
})

describe('helpStore: doc index', () => {
  it('loads the table of contents once and resolves titles from it', async () => {
    let calls = 0
    server.use(
      http.get('/api/help/index', () => {
        calls++
        return HttpResponse.json({ sections: [{ title: 'Planning', pages: [{ slug: 'Creating-a-Trip', title: 'Creating a Trip' }] }] })
      }),
    )
    await useHelpStore.getState().loadDocIndex()
    await useHelpStore.getState().loadDocIndex()
    expect(calls).toBe(1)
    const index = useHelpStore.getState().docIndex
    expect(docTitle(index, 'Creating-a-Trip')).toBe('Creating a Trip')
    expect(docTitle(index, 'Dashboard-Widgets')).toBe('Dashboard Widgets')
    expect(docTitle(null, 'My-Trips-Dashboard')).toBe('My Trips Dashboard')
  })

  it('falls back to slugs when the index cannot be loaded', async () => {
    server.use(http.get('/api/help/index', () => HttpResponse.json({}, { status: 500 })))
    await useHelpStore.getState().loadDocIndex()
    expect(useHelpStore.getState().docIndex).toEqual([])
    expect(docTitle(useHelpStore.getState().docIndex, 'Calendar-Feeds')).toBe('Calendar Feeds')
  })
})
