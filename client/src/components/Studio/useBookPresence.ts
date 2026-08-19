import { useCallback, useEffect, useRef, useState } from 'react'
import { addListener, joinBook, leaveBook, removeListener, sendBookCursor } from '../../api/websocket'

/**
 * The other people in the book.
 *
 * ── Why pointers at all ──────────────────────────────────────────────────
 *
 * Two people editing the same document without seeing each other is how you get
 * two people editing the same spread. A pointer with a name on it is the
 * cheapest possible answer: it costs one small frame, it needs no agreement
 * about anything, and it turns "why did that move" into "oh, that is Ada".
 *
 * ── Why millimetres ──────────────────────────────────────────────────────
 *
 * The two of you are at different zoom levels on different monitors, so a pixel
 * is meaningless to the other one. The document is measured in millimetres and
 * so is this: a pointer at 105 mm is at the gutter of a 210 mm page on any
 * screen, at any zoom.
 *
 * ── Why it is throttled and interpolated ─────────────────────────────────
 *
 * A pointer moves continuously and a socket does not. Sending every mousemove
 * would be sixty frames a second per editor for something the eye cannot use;
 * sending ten and drawing the gaps looks the same and costs a sixth as much.
 * The interpolation is in the component that draws them — this hook keeps the
 * last position it was told about.
 */

/** How often this tab's own pointer goes out. Ten a second is plenty. */
const CURSOR_INTERVAL_MS = 90

export interface BookPeer {
  socketId: number
  userId: number
  username: string
  avatar?: string | null
}

export interface PeerCursor {
  socketId: number
  userId: number
  username: string
  spreadIndex: number
  x: number
  y: number
  /** When it last moved, so a pointer that stopped can be faded out. */
  at: number
}

interface Incoming {
  type?: string
  journeyId?: number
  peers?: BookPeer[]
  socketId?: number
  userId?: number
  spreadIndex?: number
  x?: number | null
  y?: number | null
}

export function useBookPresence(journeyId: number) {
  const [peers, setPeers] = useState<BookPeer[]>([])
  const [cursors, setCursors] = useState<PeerCursor[]>([])

  /** Names, kept so a cursor frame does not have to carry one. */
  const names = useRef(new Map<number, BookPeer>())
  const lastSent = useRef(0)
  const pending = useRef<{ spreadIndex: number; x: number | null; y: number | null } | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!Number.isFinite(journeyId)) return

    const handler = (event: Record<string, unknown>) => {
      const e = event as Incoming
      if (e.journeyId !== journeyId) return

      if (e.type === 'journey:book:peers' && Array.isArray(e.peers)) {
        names.current = new Map(e.peers.map(p => [p.socketId, p]))
        setPeers(e.peers)
        // Somebody who left takes their pointer with them. Without this the
        // arrow stays on the page, belonging to nobody.
        setCursors(cs => cs.filter(c => names.current.has(c.socketId)))
        return
      }

      if (e.type === 'journey:book:cursor' && typeof e.socketId === 'number') {
        const socketId = e.socketId
        if (e.x == null || e.y == null) {
          setCursors(cs => cs.filter(c => c.socketId !== socketId))
          return
        }
        const who = names.current.get(socketId)
        const next: PeerCursor = {
          socketId,
          userId: e.userId ?? who?.userId ?? 0,
          username: who?.username ?? '',
          spreadIndex: e.spreadIndex ?? 0,
          x: e.x,
          y: e.y,
          at: Date.now(),
        }
        setCursors(cs => {
          const rest = cs.filter(c => c.socketId !== socketId)
          return [...rest, next]
        })
      }
    }

    addListener(handler)
    joinBook(journeyId)

    return () => {
      removeListener(handler)
      leaveBook(journeyId)
      setPeers([])
      setCursors([])
      names.current.clear()
    }
  }, [journeyId])

  /**
   * Note where this tab's pointer is.
   *
   * Called from a mousemove, so it is called constantly. One frame goes out
   * every `CURSOR_INTERVAL_MS`, and the last position inside a window is the
   * one that gets sent — a pointer's history is of no interest, only where it
   * ended up.
   */
  const moveCursor = useCallback((spreadIndex: number, x: number | null, y: number | null) => {
    pending.current = { spreadIndex, x, y }

    const flush = () => {
      const p = pending.current
      if (!p) return
      pending.current = null
      lastSent.current = Date.now()
      sendBookCursor(journeyId, p.spreadIndex, p.x, p.y)
    }

    // Leaving the page goes immediately: an arrow that lingers where somebody
    // is not is worse than no arrow.
    if (x == null || y == null) {
      if (timer.current != null) { window.clearTimeout(timer.current); timer.current = null }
      flush()
      return
    }

    if (timer.current != null) return
    const wait = Math.max(0, CURSOR_INTERVAL_MS - (Date.now() - lastSent.current))
    timer.current = window.setTimeout(() => { timer.current = null; flush() }, wait)
  }, [journeyId])

  useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current)
  }, [])

  return { peers, cursors, moveCursor }
}
