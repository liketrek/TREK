import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { MouseEvent as ReactMouseEvent, RefObject, TouchEvent as ReactTouchEvent } from 'react'
import type { Day } from '../../../../types'

/**
 * Swipe the mobile day panel left/right to step through the trip's days (#2051).
 *
 * The phone shell puts the days on a chip rail pinned to the top of the screen,
 * which on a large phone is a thin target a thumb cannot reach one-handed. The
 * day details fill the rest of the screen and did nothing, so this hands that
 * whole surface the same job the rail has.
 *
 * The gesture is purely observational: it never calls preventDefault and never
 * stops propagation on a touch event, and it sets no touch-action. Two reasons.
 * The browser keeps sole ownership of the card's vertical scroll, so the worst a
 * misread can do is translate the panel and spring it back. And the long-press
 * reorder bridge (utils/touchDragBridge) listens on `document`, below React's
 * root — swallowing a touchmove would starve its own 10px self-cancel and leave
 * it arming a drag on a row the finger had already left.
 */

/** Movement before the gesture is classified. Same figure as SystemNoticeModal. */
const CLASSIFY_PX = 8
/** |dx| must beat |dy| by this to claim horizontal. Scrolling is the gesture
 *  this card already had, so it wins the ties. */
const AXIS_BIAS = 1.2
/** Travel that commits on release. */
const COMMIT_PX = 56
/** A flick commits short of COMMIT_PX. 0.5 px/ms sits under MSheet's 0.6 dismiss
 *  — turning a page is a smaller motion than throwing a sheet off screen. */
const FLICK_V = 0.5
const FLICK_MIN_PX = 24
/** Velocity is measured over the trailing window, not the last frame: the final
 *  move before lift is often a pixel or two and reads as a standstill. */
const SAMPLE_MS = 100
/** Rubber band: 1:1 up to FREE, then heavy, then a hard stop. */
const RUBBER_FREE_PX = 72
const RUBBER_FACTOR = 0.35
const RUBBER_MAX_PX = 132
/** On the first and last day there is nowhere to go, so the pull is far stiffer. */
const EDGE_FACTOR = 0.18
const EDGE_MAX_PX = 48
/** iOS' interactive back/forward strip cannot be turned off, only avoided. The
 *  card's own left edge is at 16px, so this costs its outermost 8px as a start. */
const EDGE_GUTTER_PX = 24
/** Kept in step with touchDragBridge's LONG_PRESS_MS. Past this window the press
 *  belongs to the reorder drag. Edit mode only — go mode never installs the
 *  bridge, so a leisurely one-handed swipe still counts there. */
const PRESS_WINDOW_MS = 320
const OUT_MS = 150
const IN_MS = 220
const REDUCED_MS = 120
/** Percent of the panel width the outgoing / incoming day travels. */
const OUT_OFFSET = 22
const IN_OFFSET = 14
const EASE = 'var(--ease-drawer)'
const SPRING = 'cubic-bezier(0.34,1.56,0.64,1)'

type Lock = null | 'h' | 'dead'

interface Gesture {
  x0: number
  y0: number
  t0: number
  scrollTop0: number
  scrollLeft0: number
  lock: Lock
  samples: { x: number; t: number }[]
}

function applyX(el: HTMLElement | null, px: string | null): void {
  if (!el) return
  el.style.transform = px == null ? '' : `translateX(${px})`
}

function band(dx: number, free: number, factor: number, max: number): number {
  const a = Math.abs(dx)
  return Math.sign(dx) * Math.min(a <= free ? a : free + (a - free) * factor, max)
}

/**
 * Which way this finger is going, once it has moved far enough to tell.
 * `null` means it has not, so the caller waits for the next move.
 */
function classifyLock(
  g: Gesture,
  dx: number,
  dy: number,
  now: number,
  card: HTMLElement | null,
  s: { dragging: boolean; editing: boolean },
): Lock {
  // The browser has already committed this gesture to scrolling, so obey it.
  // scrollLeft counts too: overflow-y-auto on its own leaves overflow-x
  // computing to auto, and a wide markdown table in a day note fills it.
  if (card && (card.scrollTop !== g.scrollTop0 || card.scrollLeft !== g.scrollLeft0)) return 'dead'
  if (Math.abs(dx) <= CLASSIFY_PX && Math.abs(dy) <= CLASSIFY_PX) return null
  // Edit mode only: past the bridge's press window this finger belongs to a
  // reorder drag. Go mode has no bridge, so a slow swipe still counts.
  if (s.dragging || (s.editing && now - g.t0 > PRESS_WINDOW_MS)) return 'dead'
  return Math.abs(dx) >= Math.abs(dy) * AXIS_BIAS ? 'h' : 'dead'
}

/** The media query plus the app's own appearance toggle, which writes the same
 *  attribute PluginFrame reads. */
function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  if (document.documentElement.dataset.reduceMotion !== undefined) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

export interface MPlanDaySwipeArgs {
  days: Day[]
  selectedDayId: number | null
  /** Always called with skipFit — see the call site in MPlanTimeline for why. */
  onSelectDay: (dayId: number) => void
  /** The element that gets translated: MPlanTimeline's `absolute inset-0` root. */
  panelRef: RefObject<HTMLElement | null>
  /** The frosted timeline card. Its scroll offsets are how we ask the browser
   *  whether it has already claimed the gesture. */
  cardRef: RefObject<HTMLElement | null>
  /** Edit mode: the long-press reorder bridge is installed and competes. */
  editing: boolean
  /** True once the bridge has armed and fired its dragstart. */
  dragging: boolean
  /** True while the per-leg travel-mode menu is open. */
  menuOpen: boolean
  /** Flips next/prev, same rule the notice pager uses. */
  rtl: boolean
  /** Live-region text for a committed swipe. */
  describeDay: (index: number, total: number) => string
}

export interface MPlanDaySwipe {
  /** Announced to screen readers after a swipe commits — empty until then. */
  announcement: string
  handlers: {
    onTouchStart: (e: ReactTouchEvent) => void
    onTouchMove: (e: ReactTouchEvent) => void
    onTouchEnd: (e: ReactTouchEvent) => void
    onTouchCancel: () => void
    onClickCapture: (e: ReactMouseEvent) => void
  }
}

export function useMPlanDaySwipe({
  days, selectedDayId, onSelectDay, panelRef, cardRef,
  editing, dragging, menuOpen, rtl, describeDay,
}: MPlanDaySwipeArgs): MPlanDaySwipe {
  const gesture = useRef<Gesture | null>(null)
  const swallowClick = useRef(false)
  /** The one scheduled animation step. Never more than one is outstanding. */
  const pending = useRef<{ timer: number; run: () => void } | null>(null)
  const alive = useRef(true)
  const [announcement, setAnnouncement] = useState('')

  // The handlers are stable callbacks reading per-render values, so a ref mirror
  // keeps them current. `dragging` in particular has to be read this way: the
  // reorder hook's setDraggingKey runs inside the dragstart the bridge fires, so
  // a render-scoped read lags by a commit — exactly the window we bail in.
  const latest = useRef({ days, selectedDayId, onSelectDay, editing, dragging, menuOpen, rtl, describeDay })
  latest.current = { days, selectedDayId, onSelectDay, editing, dragging, menuOpen, rtl, describeDay }

  const cancelPending = useCallback(() => {
    const p = pending.current
    pending.current = null
    if (p) window.clearTimeout(p.timer)
  }, [])

  /** Terminal state: byte-identical to the idle DOM. Never queues another step —
   *  a settle that re-enters the queue is what makes a spring-back recurse. */
  const settle = useCallback(() => {
    // A live drag owns the panel: a stale timer left over from the previous
    // animation must not wipe the transform out from under the finger.
    if (gesture.current?.lock === 'h') return
    const el = panelRef.current
    if (!el) return
    el.style.transition = ''
    el.style.transform = ''
  }, [panelRef])

  const schedule = useCallback((ms: number, run: () => void) => {
    cancelPending()
    const timer = window.setTimeout(() => { pending.current = null; run() }, ms)
    pending.current = { timer, run }
  }, [cancelPending])

  /** Runs the outstanding step now. Interruption only — never on unmount, where
   *  it would land in a tree that is already tearing down. */
  const finishPending = useCallback(() => {
    const p = pending.current
    pending.current = null
    if (!p) return
    window.clearTimeout(p.timer)
    p.run()
  }, [])

  /** Resolved at release from the live days array, by index — never from an index
   *  captured at touchstart, and never day_number ± 1: day_number is optional and
   *  a delete leaves gaps. */
  const targetFor = useCallback((dx: number): number | null => {
    const s = latest.current
    // Finger to the left means forward in LTR; RTL mirrors it.
    const step = (dx < 0) === !s.rtl ? 1 : -1
    const i = s.days.findIndex(d => d.id === s.selectedDayId)
    // Dangling selection: a remote day:deleted drops the day but leaves
    // selectedDayId pointing at it, which shows a blank timeline. A swipe is a
    // cheap way back out of that.
    if (i < 0) return s.days[0]?.id ?? null
    return s.days[i + step]?.id ?? null
  }, [])

  /** Commits the day and parks the panel where the incoming leg starts. */
  const handoff = useCallback((dayId: number, fromPct: number | null) => {
    if (!alive.current) return
    const el = panelRef.current
    if (el && fromPct != null) {
      el.style.transition = 'none'
      applyX(el, `${fromPct}%`)
    }
    const s = latest.current
    const idx = s.days.findIndex(d => d.id === dayId)
    const apply = () => {
      s.onSelectDay(dayId)
      if (idx >= 0) setAnnouncement(s.describeDay(idx, s.days.length))
    }
    // Flushed so the new day is in the DOM before the incoming leg is armed in
    // the same frame; otherwise one frame paints the old day off-centre.
    if (fromPct == null) apply()
    else flushSync(apply)
    // The new day starts at the top.
    cardRef.current?.scrollTo?.({ top: 0 })

    if (!el || fromPct == null) { settle(); return }
    requestAnimationFrame(() => {
      if (!alive.current) return
      el.style.transition = `transform ${IN_MS}ms ${EASE}`
      applyX(el, '0px')
      // transitionend does not fire in a backgrounded tab, under a display:none
      // ancestor, or in jsdom. The timer is both the production net and what the
      // tests drive.
      schedule(IN_MS + 40, settle)
    })
  }, [cardRef, panelRef, schedule, settle])

  const commit = useCallback((dx: number): boolean => {
    const target = targetFor(dx)
    if (target == null) return false
    const el = panelRef.current

    if (!el || reducedMotion()) {
      handoff(target, null)
      // Gentler, not zero — the same call mobile.css makes for its own reduced
      // path. The fade goes on the card, never on the panel: an ancestor with
      // opacity < 1 becomes a backdrop root and cancels the card's own blur.
      const card = cardRef.current
      if (card) {
        card.style.transition = 'none'
        card.style.opacity = '0'
        requestAnimationFrame(() => {
          if (!alive.current) return
          card.style.transition = `opacity ${REDUCED_MS}ms ease-out`
          card.style.opacity = ''
          window.setTimeout(() => { card.style.transition = '' }, REDUCED_MS + 20)
        })
      }
      return true
    }

    const forward = dx < 0
    el.style.transition = `transform ${OUT_MS}ms ease-out`
    applyX(el, `${forward ? -OUT_OFFSET : OUT_OFFSET}%`)
    schedule(OUT_MS, () => handoff(target, forward ? IN_OFFSET : -IN_OFFSET))
    return true
  }, [cardRef, handoff, panelRef, schedule, targetFor])

  const springBack = useCallback(() => {
    const el = panelRef.current
    if (!el) return
    if (reducedMotion()) { settle(); return }
    el.style.transition = `transform 300ms ${SPRING}`
    applyX(el, '0px')
    schedule(340, settle)
  }, [panelRef, schedule, settle])

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    // Interruption lands the outstanding commit rather than dropping it, so
    // three swipes in a burst move three days.
    finishPending()
    swallowClick.current = false
    gesture.current = null
    const s = latest.current
    if (e.touches.length !== 1) return
    if (s.days.length < 2 || s.dragging || s.menuOpen) return
    const touch = e.touches[0]
    if (touch.clientX < EDGE_GUTTER_PX || touch.clientX > window.innerWidth - EDGE_GUTTER_PX) return
    // The header chip strip owns its own pan, but only while it really overflows
    // — a short day title with no hotel chips still swipes.
    const strip = (e.target as Element | null)?.closest?.('[data-hswipe-ignore]')
    if (strip && strip.scrollWidth > strip.clientWidth + 1) return
    const now = Date.now()
    gesture.current = {
      x0: touch.clientX, y0: touch.clientY, t0: now,
      scrollTop0: cardRef.current?.scrollTop ?? 0,
      scrollLeft0: cardRef.current?.scrollLeft ?? 0,
      lock: null,
      samples: [{ x: touch.clientX, t: now }],
    }
  }, [cardRef, finishPending])

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    const g = gesture.current
    if (!g || g.lock === 'dead' || e.touches.length !== 1) return
    const touch = e.touches[0]
    const now = Date.now()
    const dx = touch.clientX - g.x0
    const dy = touch.clientY - g.y0
    g.samples.push({ x: touch.clientX, t: now })
    while (g.samples.length > 2 && now - g.samples[0].t > SAMPLE_MS) g.samples.shift()

    if (g.lock === null) {
      g.lock = classifyLock(g, dx, dy, now, cardRef.current, latest.current)
      if (g.lock !== 'h') return
    }

    if (reducedMotion()) return // classify and commit, but never follow the finger
    const el = panelRef.current
    if (!el) return
    el.style.transition = 'none'
    applyX(el, `${targetFor(dx) == null
      ? band(dx, 0, EDGE_FACTOR, EDGE_MAX_PX)
      : band(dx, RUBBER_FREE_PX, RUBBER_FACTOR, RUBBER_MAX_PX)}px`)
  }, [cardRef, panelRef, targetFor])

  const onTouchEnd = useCallback((e: ReactTouchEvent) => {
    const g = gesture.current
    gesture.current = null
    if (!g || g.lock !== 'h') return
    // The finger travelled far enough sideways to be a swipe rather than a tap,
    // so the click the browser may still send is not one the rows should see.
    swallowClick.current = true
    const dx = (e.changedTouches[0]?.clientX ?? g.x0) - g.x0
    const first = g.samples[0]
    const last = g.samples[g.samples.length - 1]
    const v = (last.x - first.x) / Math.max(1, last.t - first.t)
    const far = Math.abs(dx) > COMMIT_PX
    const flick = Math.abs(v) > FLICK_V && Math.abs(dx) > FLICK_MIN_PX && Math.sign(v) === Math.sign(dx)
    if ((far || flick) && commit(dx)) return
    springBack()
  }, [commit, springBack])

  const onTouchCancel = useCallback(() => {
    const g = gesture.current
    gesture.current = null
    if (g?.lock === 'h') springBack()
  }, [springBack])

  /** Root-scoped on purpose, unlike the drag bridge's one-shot document listener:
   *  that one eats an innocent click 400ms later whenever the expected click never
   *  arrives, and it would also swallow the document click the leg menu closes on.
   *  The flag is cleared on every fresh touchstart, so it cannot go stale. */
  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (!swallowClick.current) return
    swallowClick.current = false
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; cancelPending() }
  }, [cancelPending])

  return {
    announcement,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture },
  }
}
