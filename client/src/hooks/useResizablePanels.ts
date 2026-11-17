import { useState, useEffect, useRef, useCallback } from 'react'

const MIN_SIDEBAR = 200
/**
 * The band where the desktop planner renders but two panels leave the map a
 * useless strip. Below 768 the phone shell takes over, so the squeeze lives
 * entirely between there and Tailwind's `lg`: a Pixel 10 Pro Fold unfolded is
 * ~860 CSS px, where 340 + 300 of panel left the map 200 px (#2247).
 */
const NARROW_QUERY = '(min-width: 768px) and (max-width: 1023px)'
/** However wide the panels are dragged, the map between them keeps this much... */
const MIN_MAP = 360
/** ...and on a big screen at least this share of the window, so it stays a map and not a strip. */
const MIN_MAP_SHARE = 0.35
/** Each panel floats 10 px off its side of the screen. */
const SCREEN_MARGINS = 20

function clampWidth(w: number, max: number): number {
  return Math.max(MIN_SIDEBAR, Math.min(max, w))
}

function readWidth(key: string, fallback: number): number {
  try { return Number.parseInt(localStorage.getItem(key) || '') || fallback } catch { return fallback }
}

/** Stores a dragged width and hands it back; a blocked storage only costs the memory of it. */
function remember(key: string, w: number): number {
  try { localStorage.setItem(key, String(w)) } catch { /* not remembered, still applied */ }
  return w
}

export function useResizablePanels() {
  const [leftWidth, setLeftWidth] = useState<number>(() => readWidth('sidebarLeftWidth', 340))
  const [rightWidth, setRightWidth] = useState<number>(() => readWidth('sidebarRightWidth', 300))
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const isResizingLeft = useRef(false)
  const isResizingRight = useRef(false)
  // While a handle is held the panel follows the pointer 1:1. Its width transition
  // stays for collapsing and opening, but during a drag it made the panel trail
  // behind the map and its buttons, which move at once.
  const [resizing, setResizing] = useState(false)

  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(NARROW_QUERY).matches,
  )
  // Which panel owns the screen while only one of them fits. The day plan is what
  // the Plan tab is about, so it starts open and the places list is one tap away;
  // null is map-only. Deliberately separate from the two collapse flags, which stay
  // the wide-layout state — folding back to a wide window restores what was there.
  const [narrowPanel, setNarrowPanel] = useState<'left' | 'right' | null>('left')
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280))

  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY)
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches)
    setNarrow(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // The panels have no fixed ceiling: they may take whatever the window leaves
  // after the map's share, so a wide screen gets a wide day plan.
  useEffect(() => {
    const measure = () => setViewportWidth(window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // What the layout actually shows. The collapse flags stay the caller's intent —
  // handlePlaceClick reopening "both" must not re-crowd a narrow screen.
  const leftHidden = narrow ? narrowPanel !== 'left' : leftCollapsed
  const rightHidden = narrow ? narrowPanel !== 'right' : rightCollapsed

  // Room both panels share. The day plan comes first: it keeps its width and the
  // places list gets what is left, so a window that shrinks squeezes the right side.
  const minMap = Math.max(MIN_MAP, Math.round(viewportWidth * MIN_MAP_SHARE))
  const room = Math.max(MIN_SIDEBAR, viewportWidth - minMap - SCREEN_MARGINS)
  const shownLeft = clampWidth(leftWidth, Math.max(MIN_SIDEBAR, room - (rightHidden ? 0 : MIN_SIDEBAR)))
  const resizeMaxRight = Math.max(MIN_SIDEBAR, room - (leftHidden ? 0 : shownLeft))
  const shownRight = clampWidth(rightWidth, resizeMaxRight)
  const resizeMaxLeft = Math.max(MIN_SIDEBAR, room - (rightHidden ? 0 : shownRight))
  // The drag listeners are bound once, so they read the live ceilings from here.
  const maxRef = useRef({ dayPlan: resizeMaxLeft, places: resizeMaxRight })
  useEffect(() => { maxRef.current = { dayPlan: resizeMaxLeft, places: resizeMaxRight } }, [resizeMaxLeft, resizeMaxRight])

  // A mouse drags through mousemove; a finger on a tablet sends touch events and
  // never a mousemove, which is why the handles used to be dead on an iPad (#1012).
  useEffect(() => {
    const moveTo = (clientX: number) => {
      if (isResizingLeft.current) setLeftWidth(remember('sidebarLeftWidth', clampWidth(clientX - 10, maxRef.current.dayPlan)))
      if (isResizingRight.current) setRightWidth(remember('sidebarRightWidth', clampWidth(window.innerWidth - clientX - 10, maxRef.current.places)))
    }
    const onMove = (e: MouseEvent) => moveTo(e.clientX)
    const onTouchMove = (e: TouchEvent) => {
      if (!isResizingLeft.current && !isResizingRight.current) return
      const touch = e.touches[0]
      if (!touch) return
      // The drag owns the finger: no page scroll and no map pan underneath it.
      e.preventDefault()
      moveTo(touch.clientX)
    }
    const onUp = () => {
      if (!isResizingLeft.current && !isResizingRight.current) return
      isResizingLeft.current = false
      isResizingRight.current = false
      setResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onUp)
    document.addEventListener('touchcancel', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onUp)
      document.removeEventListener('touchcancel', onUp)
    }
  }, [])

  const beginResize = () => { setResizing(true); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none' }
  const startResizeLeft = () => { isResizingLeft.current = true; beginResize() }
  const startResizeRight = () => { isResizingRight.current = true; beginResize() }

  // The handles are separators a keyboard can move too: an arrow key grows or
  // shrinks the panel by a step, from the width it shows right now.
  const nudgeLeft = (delta: number) => setLeftWidth(remember('sidebarLeftWidth', clampWidth(shownLeft + delta, resizeMaxLeft)))
  const nudgeRight = (delta: number) => setRightWidth(remember('sidebarRightWidth', clampWidth(shownRight + delta, resizeMaxRight)))

  const toggleLeft = useCallback(() => {
    if (narrow) setNarrowPanel(p => (p === 'left' ? null : 'left'))
    else setLeftCollapsed(c => !c)
  }, [narrow])
  const toggleRight = useCallback(() => {
    if (narrow) setNarrowPanel(p => (p === 'right' ? null : 'right'))
    else setRightCollapsed(c => !c)
  }, [narrow])

  return {
    // Clamped for the layout; the stored width is left alone, so a wide panel
    // dragged on a big screen comes back untouched once there is room for it again.
    leftWidth: shownLeft,
    rightWidth: shownRight,
    leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed,
    leftHidden, rightHidden, toggleLeft, toggleRight, narrow,
    startResizeLeft, startResizeRight, nudgeLeft, nudgeRight, resizing,
    resizeMin: MIN_SIDEBAR, resizeMaxLeft, resizeMaxRight,
  }
}
