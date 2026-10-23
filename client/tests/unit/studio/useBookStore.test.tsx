import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { BookDocument, BookRecord } from '@trek/shared'

/**
 * Autosaving a Studio book (#1973).
 *
 * The document used to live as long as the tab did. What replaced that is a
 * debounce, a queue and a conflict state, and each of those is a place where
 * someone's work can quietly go missing — a save dropped because another was in
 * flight, a 409 swallowed as a generic error, a pending edit abandoned on close.
 * These tests are aimed at exactly those three.
 */

const api = vi.hoisted(() => ({
  getBook: vi.fn(),
  saveBook: vi.fn(),
  deleteBook: vi.fn(),
}))
vi.mock('../../../src/api/client', () => ({ journeyApi: api }))

/** The websocket seam, so a save from another editor can be delivered by hand. */
const listeners = vi.hoisted(() => new Set<(e: Record<string, unknown>) => void>())
vi.mock('../../../src/api/websocket', () => ({
  addListener: (fn: (e: Record<string, unknown>) => void) => { listeners.add(fn) },
  removeListener: (fn: (e: Record<string, unknown>) => void) => { listeners.delete(fn) },
}))

/** Deliver a `journey:book:saved` the way the server broadcasts it. */
async function remoteSave(version = 6, journeyId = 9, savedBy = 2) {
  await act(async () => {
    for (const fn of listeners) fn({ type: 'journey:book:saved', journeyId, version, savedBy })
    for (let i = 0; i < 10; i++) await Promise.resolve()
  })
}

import { useBookStore } from '../../../src/components/Studio/useBookStore'

const doc = (title = 'one') => ({ version: 1, title, page: {}, spreads: [] } as unknown as BookDocument)

const record = (over: Partial<BookRecord> = {}): BookRecord => ({
  id: 3, journeyId: 9, title: 'T', version: 1,
  updatedAt: '2026-08-19 10:00:00', updatedBy: 1,
  document: doc(),
  ...over,
} as BookRecord)

/** A 409 as axios reports it — the shape useBookStore has to recognise. */
function conflictError(current: BookRecord) {
  return Object.assign(new Error('Request failed'), {
    response: { status: 409, data: { error: 'Book was changed by someone else', current } },
  })
}

/**
 * Advance past the debounce and let the request settle.
 *
 * Written out rather than reached for via waitFor: waitFor polls on a timer,
 * and the timers here are fake, so it would sit spinning until the test timed
 * out. Draining the microtask queue by hand is what actually works.
 */
async function tick(ms = 1300) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
    for (let i = 0; i < 10; i++) await Promise.resolve()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  listeners.clear()
  api.getBook.mockReset().mockResolvedValue({ book: null })
  api.saveBook.mockReset().mockResolvedValue(record({ version: 2 }))
})

afterEach(() => {
  vi.useRealTimers()
})

/** Render the hook and let the initial load settle. */
async function mount(journeyId = 9) {
  const view = renderHook(() => useBookStore(journeyId))
  await tick(0)
  return view
}

// -- Loading ------------------------------------------------------------------

describe('loading', () => {
  it('reports loaded even when the journey has no book yet', async () => {
    const { result } = await mount()
    expect(result.current.loaded).toBe(true)
    expect(result.current.record).toBeNull()
  })

  it('keeps the version it loaded, so the first save is not a blind write', async () => {
    api.getBook.mockResolvedValue({ book: record({ version: 7 }) })
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('two'), 'T') })
    await tick()

    expect(api.saveBook).toHaveBeenCalledWith(9, expect.objectContaining({ baseVersion: 7 }))
  })

  /*
   * Opening is not editing.
   *
   * The editor hands the loaded document straight back on its next render, and
   * for a while that counted as a change: every open bumped the version and
   * showed up in the history as an edit nobody made. The store recognises the
   * document it just handed out by identity, which is also why it — and not the
   * editor — is where normalisation happens.
   */
  it('does not save the book it just loaded', async () => {
    api.getBook.mockResolvedValue({ book: record({ version: 4 }) })
    const { result } = await mount()

    act(() => { result.current.queueSave(result.current.record!.document, 'T') })
    await tick()

    expect(api.saveBook).not.toHaveBeenCalled()
  })

  /* A document missing a field the contract has since gained still has to open. */
  it('fills in what an older build left out', async () => {
    api.getBook.mockResolvedValue({
      book: record({ document: { version: 1, title: 'old', spreads: [] } as never }),
    })
    const { result } = await mount()

    expect(result.current.record!.document.page.pageNumbers.show).toBe(false)
  })

  /*
   * A book that will not load is a book that gets created. Studio has to open
   * either way — refusing to start because the GET failed would turn a blip
   * into "I cannot get at my book".
   */
  it('still opens when the load fails', async () => {
    api.getBook.mockRejectedValue(new Error('offline'))
    const { result } = await mount()
    expect(result.current.loaded).toBe(true)
    expect(result.current.record).toBeNull()
  })
})

// -- Debounce -----------------------------------------------------------------

describe('debounce', () => {
  it('does not write while the document is still moving', async () => {
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    act(() => { vi.advanceTimersByTime(800) })
    act(() => { result.current.queueSave(doc('b'), 'T') })
    act(() => { vi.advanceTimersByTime(800) })

    expect(api.saveBook).not.toHaveBeenCalled()
  })

  /* A drag is hundreds of commits and one edit. */
  it('collapses a burst into a single write, carrying the last document', async () => {
    const { result } = await mount()

    act(() => {
      for (let i = 0; i < 40; i++) result.current.queueSave(doc(`step-${i}`), 'T')
    })
    await tick()

    expect(api.saveBook).toHaveBeenCalledTimes(1)
    expect(api.saveBook.mock.calls[0][1].document.title).toBe('step-39')
  })

  /*
   * Someone typing a caption never pauses long enough to trigger the quiet
   * timer. Without the ceiling their work would sit unwritten for as long as
   * they kept going.
   */
  it('writes anyway once it has been dirty too long', async () => {
    const { result } = await mount()

    for (let i = 0; i < 20; i++) {
      act(() => { result.current.queueSave(doc(`t${i}`), 'T') })
      act(() => { vi.advanceTimersByTime(1000) })
    }
    await tick(0)

    expect(api.saveBook).toHaveBeenCalled()
  })

  it('goes through saving to saved', async () => {
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    act(() => { vi.advanceTimersByTime(1300) })
    expect(result.current.state.status).toBe('saving')

    await tick(0)
    expect(result.current.state.status).toBe('saved')
  })

  it('takes the version back from the server, so the next save is not stale', async () => {
    api.saveBook.mockResolvedValue(record({ version: 5 }))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    await tick()

    act(() => { result.current.queueSave(doc('b'), 'T') })
    await tick()

    expect(api.saveBook.mock.calls[1][1].baseVersion).toBe(5)
  })
})

// -- Queueing -----------------------------------------------------------------

describe('a save during a save', () => {
  /*
   * The one that loses work if it is wrong: an edit made while a request is
   * open must be written after it, not dropped because the store was busy.
   */
  it('is queued rather than dropped', async () => {
    let release: (r: BookRecord) => void = () => {}
    api.saveBook.mockImplementationOnce(
      () => new Promise<BookRecord>(resolve => { release = resolve }),
    )
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('first'), 'T') })
    await tick()
    expect(api.saveBook).toHaveBeenCalledTimes(1)

    // Arrives while the first request is still open.
    act(() => { result.current.queueSave(doc('second'), 'T') })
    await act(async () => {
      release(record({ version: 2 }))
      for (let i = 0; i < 10; i++) await Promise.resolve()
    })

    expect(api.saveBook).toHaveBeenCalledTimes(2)
    expect(api.saveBook.mock.calls[1][1].document.title).toBe('second')
  })

  it('does not fire two requests at once', async () => {
    let open = 0
    let peak = 0
    api.saveBook.mockImplementation(async () => {
      open++
      peak = Math.max(peak, open)
      await Promise.resolve()
      open--
      return record({ version: 2 })
    })
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    await tick()
    act(() => { result.current.queueSave(doc('b'), 'T') })
    await tick()

    expect(peak).toBe(1)
  })
})

// -- saveNow ------------------------------------------------------------------

describe('saveNow', () => {
  /*
   * Closing the editor writes what is pending. The debounce exists so a drag is
   * one request, not so the last edit before leaving is lost.
   */
  it('writes a pending edit without waiting out the debounce', async () => {
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('unsaved'), 'T') })
    await act(async () => { await result.current.saveNow() })

    expect(api.saveBook).toHaveBeenCalledTimes(1)
    expect(api.saveBook.mock.calls[0][1].document.title).toBe('unsaved')
  })

  it('is a no-op when there is nothing pending', async () => {
    const { result } = await mount()
    await act(async () => { await result.current.saveNow() })
    expect(api.saveBook).not.toHaveBeenCalled()
  })

  it('takes a document handed to it directly', async () => {
    const { result } = await mount()
    await act(async () => { await result.current.saveNow(doc('explicit'), 'Title') })
    expect(api.saveBook.mock.calls[0][1].document.title).toBe('explicit')
    expect(api.saveBook.mock.calls[0][1].title).toBe('Title')
  })
})

// -- Conflicts ----------------------------------------------------------------

describe('conflicts', () => {
  it('reads a 409 as the other person, not as a failure', async () => {
    api.saveBook.mockRejectedValue(conflictError(record({ version: 6, title: 'Theirs' })))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()

    expect(result.current.state.status).toBe('conflict')
    expect(result.current.state).toMatchObject({ current: { version: 6, title: 'Theirs' } })
  })

  it('reports anything else as an error', async () => {
    api.saveBook.mockRejectedValue(new Error('network'))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()

    expect(result.current.state.status).toBe('error')
  })

  /*
   * A 409 with no record in it is still a 409, but there is nothing to offer a
   * choice between — so it reports as an error rather than a conflict the
   * editor cannot render.
   */
  it('falls back to an error when the 409 carries no record', async () => {
    api.saveBook.mockRejectedValue(
      Object.assign(new Error('conflict'), { response: { status: 409, data: {} } }),
    )
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()

    expect(result.current.state.status).toBe('error')
  })

  /*
   * The one that turned into a loop on screen: every change queued a save,
   * every save was refused, and the refusal re-rendered the thing that queued
   * it. A conflict is a question only the user can answer, so nothing is
   * written until they have.
   */
  it('stops writing until the conflict is answered', async () => {
    api.saveBook.mockRejectedValue(conflictError(record({ version: 6 })))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(api.saveBook).toHaveBeenCalledTimes(1)

    // More edits arrive; none of them go out.
    act(() => { result.current.queueSave(doc('mine again'), 'T') })
    await tick()
    act(() => { result.current.queueSave(doc('and again'), 'T') })
    await tick()
    expect(api.saveBook).toHaveBeenCalledTimes(1)
  })

  it('writes again once the user has chosen', async () => {
    const theirs = record({ version: 6 })
    api.saveBook.mockRejectedValueOnce(conflictError(theirs))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('conflict')

    api.saveBook.mockResolvedValue(record({ version: 7 }))
    // Choosing re-sends what was refused, so this is the third write, not the second.
    act(() => { result.current.keepMine(theirs) })
    await tick()
    act(() => { result.current.queueSave(doc('mine again'), 'T') })
    await tick()

    expect(api.saveBook).toHaveBeenCalledTimes(3)
  })

  /*
   * The one that lost an afternoon: write() empties the queue before it makes
   * the request, so after a 409 nothing is queued. "Keep mine" cleared the
   * conflict and left the document unsent until the user happened to touch the
   * book again — and closing the editor writes the queue, which was empty.
   */
  it('sends the refused document as soon as the local one is kept', async () => {
    const theirs = record({ version: 6 })
    api.saveBook.mockRejectedValueOnce(conflictError(theirs))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('conflict')

    api.saveBook.mockResolvedValue(record({ version: 7 }))
    act(() => { result.current.keepMine(theirs) })
    await tick()

    expect(api.saveBook).toHaveBeenCalledTimes(2)
    expect(api.saveBook.mock.calls[1][1]).toMatchObject({ title: 'T', baseVersion: 6 })
    expect((api.saveBook.mock.calls[1][1].document as BookDocument).title).toBe('mine')
    expect(result.current.state.status).toBe('saved')
  })

  /* Nothing of their own to send: keeping theirs-as-mine is just the version. */
  it('only clears the conflict when the local document is the agreed one', async () => {
    const theirs = record({ version: 6 })
    api.saveBook.mockRejectedValueOnce(conflictError(theirs))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()

    act(() => { result.current.acceptTheirs(theirs) })
    act(() => { result.current.keepMine(theirs) })
    await tick()

    expect(api.saveBook).toHaveBeenCalledTimes(1)
    expect(result.current.state.status).toBe('idle')
  })

  it('returns their document when their version is taken, and drops the pending write', async () => {
    const theirs = record({ version: 6, document: doc('theirs') })
    api.saveBook.mockRejectedValue(conflictError(theirs))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('conflict')

    let taken: BookDocument | undefined
    act(() => { taken = result.current.acceptTheirs(theirs) })
    expect(taken?.title).toBe('theirs')
    expect(result.current.state.status).toBe('idle')

    // Nothing left queued: taking theirs discards the local edit on purpose.
    api.saveBook.mockResolvedValue(record({ version: 7 }))
    await act(async () => { await result.current.saveNow() })
    expect(api.saveBook).toHaveBeenCalledTimes(1)
  })

  /*
   * Keeping yours is a rebase, not a merge — it moves the local document onto
   * their version number so the next save lands instead of conflicting forever.
   */
  it('rebases onto their version when the local one is kept', async () => {
    const theirs = record({ version: 6 })
    api.saveBook.mockRejectedValueOnce(conflictError(theirs))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('conflict')

    api.saveBook.mockResolvedValue(record({ version: 7 }))
    act(() => { result.current.keepMine(theirs) })
    await tick()

    expect(api.saveBook.mock.calls[1][1].baseVersion).toBe(6)
  })
})

// -- Somebody else saved ------------------------------------------------------

describe('another editor saving', () => {
  /** Render with a book already stored, and a spy for what gets handed back. */
  async function withBook() {
    api.getBook.mockResolvedValue({ book: record({ version: 4, document: doc('theirs') }) })
    const onRemote = vi.fn()
    const view = renderHook(() => useBookStore(9, onRemote))
    await tick(0)
    return { ...view, onRemote }
  }

  it('takes their version when nothing local is outstanding', async () => {
    const { result, onRemote } = await withBook()
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: doc('newer') }) })

    await remoteSave(6)

    expect(onRemote).toHaveBeenCalledTimes(1)
    expect(onRemote.mock.calls[0][0].title).toBe('newer')
    expect(result.current.record?.version).toBe(6)
  })

  /*
   * The one that would lose work: replacing an open document that has unsaved
   * edits in it. The next save conflicts instead, which is the whole point of
   * the version.
   */
  it('leaves an edited document alone', async () => {
    const { result, onRemote } = await withBook()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await remoteSave(6)

    expect(onRemote).not.toHaveBeenCalled()
  })

  it('leaves it alone after a conflict too, where nothing is queued but the work is still local', async () => {
    const { result, onRemote } = await withBook()
    api.saveBook.mockRejectedValue(conflictError(record({ version: 6 })))

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('conflict')

    await remoteSave(7)
    expect(onRemote).not.toHaveBeenCalled()
  })

  it('ignores a save on another journey', async () => {
    const { onRemote } = await withBook()
    await remoteSave(6, 11)
    expect(onRemote).not.toHaveBeenCalled()
  })

  /* A second tab on the same account is a different socket and the same person. */
  it('ignores the version it already has', async () => {
    const { onRemote } = await withBook()
    await remoteSave(4)
    expect(onRemote).not.toHaveBeenCalled()
  })

  it('does not write back what it just took', async () => {
    const { result, onRemote } = await withBook()
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: doc('newer') }) })
    await remoteSave(6)

    // The editor hands the loaded document straight back on the next render.
    const taken = onRemote.mock.calls[0][0]
    act(() => { result.current.queueSave(taken, 'T') })
    await tick()

    expect(api.saveBook).not.toHaveBeenCalled()
  })

  it('stops listening once the editor is gone', async () => {
    const { unmount } = await withBook()
    expect(listeners.size).toBe(1)
    unmount()
    expect(listeners.size).toBe(0)
  })
})

// -- A burst of saves from elsewhere (the assistant applying page edits) ------

describe('a burst of saves from elsewhere', () => {
  async function withBook(selfId?: number) {
    api.getBook.mockResolvedValue({ book: record({ version: 4, document: doc('theirs') }) })
    const onRemote = vi.fn()
    const view = renderHook(() => useBookStore(9, onRemote, selfId))
    await tick(0)
    return { ...view, onRemote }
  }

  /** The next getBook stays open until released with the given record. */
  function holdNextRead() {
    let release: (r: BookRecord) => void = () => {}
    api.getBook.mockImplementationOnce(
      () => new Promise(resolve => { release = (r: BookRecord) => resolve({ book: r }) }),
    )
    return (r: BookRecord) => act(async () => {
      release(r)
      for (let i = 0; i < 10; i++) await Promise.resolve()
    })
  }

  it('FE-STUDIO-BOOKSYNC-001: events during an open read ask for one more read, not one per event', async () => {
    const { result, onRemote } = await withBook()
    const releaseFirst = holdNextRead()
    api.getBook.mockResolvedValue({ book: record({ version: 8, document: doc('newest') }) })

    await remoteSave(6)
    await remoteSave(7)
    await remoteSave(8)
    // The load at open, then the one read the first event started.
    expect(api.getBook).toHaveBeenCalledTimes(2)

    await releaseFirst(record({ version: 6, document: doc('older') }))
    expect(api.getBook).toHaveBeenCalledTimes(3)
    expect(onRemote).toHaveBeenCalledTimes(2)
    expect(onRemote.mock.calls[1][0].title).toBe('newest')
    expect(result.current.record?.version).toBe(8)
  })

  it('FE-STUDIO-BOOKSYNC-002: an answer no newer than the book held is not taken', async () => {
    const { onRemote } = await withBook()
    api.getBook.mockResolvedValue({ book: record({ version: 4, document: doc('same') }) })
    await remoteSave(6)
    expect(onRemote).not.toHaveBeenCalled()
  })

  it('FE-STUDIO-BOOKSYNC-003: a broadcast older than the version held is not read at all', async () => {
    const { onRemote } = await withBook()
    await remoteSave(3)
    expect(api.getBook).toHaveBeenCalledTimes(1)
    expect(onRemote).not.toHaveBeenCalled()
  })

  it('FE-STUDIO-BOOKSYNC-004: local work started during the read wins, and no second read follows', async () => {
    const { result, onRemote } = await withBook()
    const releaseFirst = holdNextRead()
    await remoteSave(6)
    await remoteSave(7)
    act(() => { result.current.queueSave(doc('mine'), 'T') })

    await releaseFirst(record({ version: 7, document: doc('newer') }))
    expect(onRemote).not.toHaveBeenCalled()
    expect(api.getBook).toHaveBeenCalledTimes(2)
  })

  /*
   * The save response and the broadcast travel on different channels. When the
   * assistant's write lands just after the user's own, its broadcast can arrive
   * while that write is still open, and dropping it left the editor on the old
   * book with no conflict to bring the change up.
   */
  it('FE-STUDIO-BOOKSYNC-010: a save that arrives during a write of this user is read once it lands', async () => {
    const { result, onRemote } = await withBook()
    let release: (r: BookRecord) => void = () => {}
    api.saveBook.mockImplementationOnce(() => new Promise<BookRecord>(resolve => { release = resolve }))
    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()

    api.getBook.mockResolvedValue({ book: record({ version: 9, document: doc('assistant') }) })
    await remoteSave(9)
    expect(api.getBook).toHaveBeenCalledTimes(1)

    await act(async () => {
      release(record({ version: 7 }))
      for (let i = 0; i < 10; i++) await Promise.resolve()
    })
    expect(api.getBook).toHaveBeenCalledTimes(2)
    expect(onRemote).toHaveBeenCalledTimes(1)
    expect(onRemote.mock.calls[0][0].title).toBe('assistant')
    expect(result.current.record?.version).toBe(9)
  })

  /* The user's own assistant writes as them, so its change is theirs to take back. */
  it('FE-STUDIO-BOOKSYNC-011: a save by this user is handed over as undoable', async () => {
    const { onRemote } = await withBook(2)
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: doc('own') }) })
    await remoteSave(6, 9, 2)
    expect(onRemote).toHaveBeenCalledWith(expect.objectContaining({ title: 'own' }), { undoable: true })
  })

  /*
   * Undoing somebody else's save would write the older book over their work
   * with a current version, so no conflict would ever stop it.
   */
  it('FE-STUDIO-BOOKSYNC-012: a save by somebody else, or by an unknown user, is not undoable', async () => {
    const other = await withBook(1)
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: doc('theirs-6') }) })
    await remoteSave(6, 9, 2)
    expect(other.onRemote.mock.calls[0][1]).toEqual({ undoable: false })
    other.unmount()

    const unknown = await withBook()
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: doc('theirs-6') }) })
    await remoteSave(6, 9, 2)
    expect(unknown.onRemote.mock.calls[0][1]).toEqual({ undoable: false })
  })

  it('FE-STUDIO-BOOKSYNC-013: in a burst, only the read that folds in a save by someone else loses undo', async () => {
    const { onRemote } = await withBook(2)
    const releaseFirst = holdNextRead()
    await remoteSave(5, 9, 2)
    await remoteSave(6, 9, 5)
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: doc('with-theirs') }) })

    await releaseFirst(record({ version: 5, document: doc('own') }))
    expect(onRemote).toHaveBeenCalledTimes(2)
    expect(onRemote.mock.calls[0][1]).toEqual({ undoable: true })
    expect(onRemote.mock.calls[1][1]).toEqual({ undoable: false })
  })

  /* A book deleted and made again starts its versions over; a low number is not stale then. */
  it('FE-STUDIO-BOOKSYNC-014: a book made again under a new id is taken despite its lower version', async () => {
    const { result, onRemote } = await withBook(2)
    api.getBook.mockResolvedValue({ book: record({ id: 8, version: 1, document: doc('again') }) })
    await remoteSave(5, 9, 2)
    expect(onRemote).toHaveBeenCalledTimes(1)
    expect(onRemote.mock.calls[0][1]).toEqual({ undoable: false })
    expect(result.current.record?.id).toBe(8)
    expect(result.current.record?.version).toBe(1)
  })
})

// -- flush --------------------------------------------------------------------

describe('flush', () => {
  it('FE-STUDIO-BOOKSYNC-005: writes a debounced edit at once and says it landed', async () => {
    const { result } = await mount()
    act(() => { result.current.queueSave(doc('unsaved'), 'T') })

    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flush() })

    expect(ok).toBe(true)
    expect(api.saveBook).toHaveBeenCalledTimes(1)
    expect(api.saveBook.mock.calls[0][1].document.title).toBe('unsaved')
    // The debounce it replaced does not fire a second write later.
    await tick(5000)
    expect(api.saveBook).toHaveBeenCalledTimes(1)
  })

  it('FE-STUDIO-BOOKSYNC-006: waits for an open write and the edit queued behind it', async () => {
    let release: (r: BookRecord) => void = () => {}
    api.saveBook.mockImplementationOnce(() => new Promise<BookRecord>(resolve => { release = resolve }))
    const { result } = await mount()
    act(() => { result.current.queueSave(doc('first'), 'T') })
    await tick()
    act(() => { result.current.queueSave(doc('second'), 'T') })

    let ok: boolean | undefined
    let done: Promise<void> = Promise.resolve()
    act(() => { done = result.current.flush().then(v => { ok = v }) })
    expect(ok).toBeUndefined()
    await act(async () => {
      release(record({ version: 2 }))
      await done
    })

    expect(ok).toBe(true)
    expect(api.saveBook).toHaveBeenCalledTimes(2)
    expect(api.saveBook.mock.calls[1][1].document.title).toBe('second')
  })

  it('FE-STUDIO-BOOKSYNC-007: says false when the write is refused as a conflict', async () => {
    api.saveBook.mockRejectedValue(conflictError(record({ version: 6 })))
    const { result } = await mount()
    act(() => { result.current.queueSave(doc('mine'), 'T') })

    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flush() })

    expect(ok).toBe(false)
    expect(result.current.state.status).toBe('conflict')
  })

  it('FE-STUDIO-BOOKSYNC-008: sends again what a failed request left behind', async () => {
    api.saveBook.mockRejectedValueOnce(new Error('offline'))
    const { result } = await mount()
    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('error')

    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flush() })

    expect(ok).toBe(true)
    expect(api.saveBook).toHaveBeenCalledTimes(2)
    expect(api.saveBook.mock.calls[1][1].document.title).toBe('mine')
  })

  it('FE-STUDIO-BOOKSYNC-009: with nothing local it writes nothing and says true', async () => {
    const { result } = await mount()
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flush() })
    expect(ok).toBe(true)
    expect(api.saveBook).not.toHaveBeenCalled()
  })
})

// -- Teardown -----------------------------------------------------------------

describe('unmounting', () => {
  it('does not fire a debounced save after the editor is gone', async () => {
    const { result, unmount } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    unmount()
    await tick(5000)

    expect(api.saveBook).not.toHaveBeenCalled()
  })
})

// -- A book a newer Studio saved ----------------------------------------------

/*
 * This build reads such a book as far as it can, and what it cannot read is
 * already gone from its copy. Showing it is fine; writing it would delete the
 * rest for everyone, so nothing is written until a reload.
 */
describe('a book a newer Studio saved', () => {
  const newer = (title = 'newer') => ({ ...doc(title), schemaRev: 99 }) as unknown as BookDocument

  /** A 409 for a book a newer Studio saved since this tab read it. */
  function newerError() {
    return Object.assign(new Error('Request failed'), {
      response: { status: 409, data: { error: 'Book was saved by a newer version of TREK Studio', code: 'book_schema_newer', schemaRev: 2 } },
    })
  }

  it('FE-STUDIO-REV-002: opens it, says so, and writes nothing, not even on flush', async () => {
    api.getBook.mockResolvedValue({ book: record({ version: 5, document: newer() }) })
    const { result } = await mount()

    expect(result.current.state.status).toBe('newer')
    expect(result.current.record?.document.title).toBe('newer')
    act(() => { result.current.queueSave(doc('edited'), 'T') })
    await tick()
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.flush() })

    expect(ok).toBe(false)
    expect(api.saveBook).not.toHaveBeenCalled()
  })

  it('FE-STUDIO-REV-003: stops on the server refusing a save over a newer book, and does not try again', async () => {
    api.saveBook.mockRejectedValue(newerError())
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('newer')

    act(() => { result.current.queueSave(doc('b'), 'T') })
    await tick()
    expect(api.saveBook).toHaveBeenCalledTimes(1)
  })

  it('FE-STUDIO-REV-004: shows a newer version another editor saved, and holds it the same way', async () => {
    api.getBook.mockResolvedValue({ book: record({ version: 4, document: doc('ours') }) })
    const onRemote = vi.fn()
    const { result } = renderHook(() => useBookStore(9, onRemote))
    await tick(0)
    api.getBook.mockResolvedValue({ book: record({ version: 6, document: newer('theirs') }) })

    await remoteSave(6)

    expect(onRemote.mock.calls[0][0].title).toBe('theirs')
    expect(result.current.state.status).toBe('newer')
    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(api.saveBook).not.toHaveBeenCalled()
  })

  it('FE-STUDIO-REV-005: taking their side of a conflict holds the book when theirs is newer', async () => {
    const theirs = record({ version: 6, document: newer('theirs') })
    api.saveBook.mockRejectedValueOnce(conflictError(theirs))
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('mine'), 'T') })
    await tick()
    expect(result.current.state.status).toBe('conflict')

    act(() => { result.current.acceptTheirs(theirs) })
    expect(result.current.state.status).toBe('newer')
  })

  /* A book of today goes out exactly as it went out before the revision existed. */
  it('FE-STUDIO-REV-006: sends a book of today without a revision in it', async () => {
    const { result } = await mount()

    act(() => { result.current.queueSave(doc('a'), 'T') })
    await tick()

    expect(api.saveBook.mock.calls[0][1].document).not.toHaveProperty('schemaRev')
  })
})
