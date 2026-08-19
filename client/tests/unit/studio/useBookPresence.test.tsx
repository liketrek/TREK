import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

/**
 * Presence and pointers (#1973).
 *
 * The parts worth pinning are the ones that leave something behind when they
 * are wrong: an arrow belonging to somebody who has closed the tab, a pointer
 * drawn on the wrong spread, and a mousemove handler that puts sixty frames a
 * second onto the socket.
 */

const ws = vi.hoisted(() => ({
  listeners: new Set<(e: Record<string, unknown>) => void>(),
  joinBook: vi.fn(),
  leaveBook: vi.fn(),
  sendBookCursor: vi.fn(),
}))

vi.mock('../../../src/api/websocket', () => ({
  addListener: (fn: (e: Record<string, unknown>) => void) => { ws.listeners.add(fn) },
  removeListener: (fn: (e: Record<string, unknown>) => void) => { ws.listeners.delete(fn) },
  joinBook: ws.joinBook,
  leaveBook: ws.leaveBook,
  sendBookCursor: ws.sendBookCursor,
}))

import { useBookPresence } from '../../../src/components/Studio/useBookPresence'

/** Deliver a frame the way the gateway broadcasts it. */
function deliver(event: Record<string, unknown>) {
  act(() => { for (const fn of ws.listeners) fn(event) })
}

const peersFrame = (journeyId: number, peers: unknown[]) =>
  ({ type: 'journey:book:peers', journeyId, peers })

const cursorFrame = (over: Record<string, unknown> = {}) => ({
  type: 'journey:book:cursor',
  journeyId: 9,
  socketId: 3,
  userId: 2,
  spreadIndex: 0,
  x: 100,
  y: 50,
  ...over,
})

const ada = { socketId: 3, userId: 2, username: 'ada', avatar: null }

beforeEach(() => {
  vi.useFakeTimers()
  ws.listeners.clear()
  ws.joinBook.mockReset()
  ws.leaveBook.mockReset()
  ws.sendBookCursor.mockReset()
})

afterEach(() => { vi.useRealTimers() })

describe('joining', () => {
  it('joins the book and leaves it again when the editor closes', () => {
    const { unmount } = renderHook(() => useBookPresence(9))
    expect(ws.joinBook).toHaveBeenCalledWith(9)

    unmount()
    expect(ws.leaveBook).toHaveBeenCalledWith(9)
    expect(ws.listeners.size).toBe(0)
  })

  it('takes the list of who is here', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada]))
    expect(result.current.peers).toEqual([ada])
  })

  it('ignores another journey entirely', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(11, [ada]))
    expect(result.current.peers).toEqual([])
  })
})

describe('the pointers', () => {
  it('keeps one per socket, at the latest position', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada]))
    deliver(cursorFrame({ x: 100 }))
    deliver(cursorFrame({ x: 140 }))

    expect(result.current.cursors).toHaveLength(1)
    expect(result.current.cursors[0].x).toBe(140)
  })

  it('names the pointer from the presence list, so the frame need not carry it', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada]))
    deliver(cursorFrame())
    expect(result.current.cursors[0].username).toBe('ada')
  })

  it('keeps two people apart', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada, { socketId: 4, userId: 5, username: 'bo', avatar: null }]))
    deliver(cursorFrame({ socketId: 3 }))
    deliver(cursorFrame({ socketId: 4, userId: 5, x: 10 }))

    expect(result.current.cursors.map(c => c.socketId).sort()).toEqual([3, 4])
  })

  /* Null coordinates mean the pointer left the page. */
  it('drops a pointer that left the page', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada]))
    deliver(cursorFrame())
    expect(result.current.cursors).toHaveLength(1)

    deliver(cursorFrame({ x: null, y: null }))
    expect(result.current.cursors).toEqual([])
  })

  /*
   * The one that leaves a ghost: an arrow still on the page after its owner has
   * gone, belonging to nobody.
   */
  it('drops the pointer of somebody who left the book', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada]))
    deliver(cursorFrame())
    expect(result.current.cursors).toHaveLength(1)

    deliver(peersFrame(9, []))
    expect(result.current.cursors).toEqual([])
  })

  it('carries the spread, so a pointer on page 40 is not drawn on page 2', () => {
    const { result } = renderHook(() => useBookPresence(9))
    deliver(peersFrame(9, [ada]))
    deliver(cursorFrame({ spreadIndex: 20 }))
    expect(result.current.cursors[0].spreadIndex).toBe(20)
  })
})

describe('sending this pointer', () => {
  /*
   * Called from a mousemove, so it is called constantly. Sixty frames a second
   * of something the eye cannot use is the whole reason this is throttled.
   */
  it('sends one frame for a burst of movement', () => {
    const { result } = renderHook(() => useBookPresence(9))

    act(() => {
      for (let i = 0; i < 40; i++) result.current.moveCursor(0, i, i)
    })
    act(() => { vi.advanceTimersByTime(120) })

    expect(ws.sendBookCursor).toHaveBeenCalledTimes(1)
    // The last position, not the first: where the pointer ended up is the only
    // part of its history anybody wants.
    expect(ws.sendBookCursor).toHaveBeenCalledWith(9, 0, 39, 39)
  })

  it('keeps sending while the pointer keeps moving', () => {
    const { result } = renderHook(() => useBookPresence(9))

    act(() => { result.current.moveCursor(0, 1, 1) })
    act(() => { vi.advanceTimersByTime(120) })
    act(() => { result.current.moveCursor(0, 2, 2) })
    act(() => { vi.advanceTimersByTime(120) })

    expect(ws.sendBookCursor).toHaveBeenCalledTimes(2)
  })

  /* Leaving goes at once — an arrow lingering where somebody is not is worse. */
  it('sends the pointer leaving immediately', () => {
    const { result } = renderHook(() => useBookPresence(9))
    act(() => { result.current.moveCursor(0, 5, 5) })
    act(() => { result.current.moveCursor(0, null, null) })

    expect(ws.sendBookCursor).toHaveBeenCalledWith(9, 0, null, null)
  })

  it('sends nothing more once the editor is gone', () => {
    const { result, unmount } = renderHook(() => useBookPresence(9))
    act(() => { result.current.moveCursor(0, 1, 1) })
    unmount()
    act(() => { vi.advanceTimersByTime(500) })

    expect(ws.sendBookCursor).not.toHaveBeenCalled()
  })
})
