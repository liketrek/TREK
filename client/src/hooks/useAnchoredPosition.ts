import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface AnchoredBox {
  /** Distance from the viewport top, when the panel hangs below the trigger. */
  top?: number
  /** Distance from the viewport bottom, when the panel flips above the trigger. */
  bottom?: number
  left: number
  width: number
  /** Room the panel has before it would run off the visible viewport. */
  maxHeight: number
  /** True while the panel is flipped above its trigger. */
  flipped: boolean
}

interface AnchoredOptions {
  /** Height the panel wants; decides whether it still fits below the trigger. */
  estimatedHeight?: number
  /** Gap between trigger and panel. */
  offset?: number
  /** Breathing room kept between the panel and the viewport edge. */
  padding?: number
  /** Adopt the trigger's width (selects) instead of measuring only its position. */
  matchWidth?: boolean
}

/** How much the viewport must shrink before we treat it as an on-screen keyboard. */
const KEYBOARD_THRESHOLD = 120

/**
 * Keeps a `position: fixed` popover glued to its trigger (#1999, #2000).
 *
 * The popovers used to compute `top`/`left` inline while rendering, which reads
 * the trigger's rect exactly once: scroll the sheet and the trigger walks off
 * while the panel stays nailed to the viewport, and on iOS the keyboard slides
 * up over a panel that was placed before it existed. Measuring in a layout
 * effect and re-measuring on scroll, resize and visualViewport changes fixes
 * both, because every one of those is a reason the anchor moved.
 *
 * Scroll is listened for in the capture phase so it also catches the inner
 * scroll containers the sheets use — those never bubble a scroll event.
 *
 * The returned box also carries `maxHeight`, so a panel opened next to the
 * keyboard shrinks into the space that is actually visible rather than
 * disappearing underneath it.
 */
export function useAnchoredPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  { estimatedHeight = 220, offset = 4, padding = 8, matchWidth = true }: AnchoredOptions = {},
): AnchoredBox | null {
  const [box, setBox] = useState<AnchoredBox | null>(null)
  // Read in the measure callback so it stays stable across renders.
  const optsRef = useRef({ estimatedHeight, offset, padding, matchWidth })
  optsRef.current = { estimatedHeight, offset, padding, matchWidth }

  const measure = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const { estimatedHeight: wanted, offset: gap, padding: pad, matchWidth: match } = optsRef.current
    const r = el.getBoundingClientRect()
    // visualViewport is the part still visible next to an open keyboard; its
    // offsetTop is how far the browser scrolled the layout viewport up to keep
    // the focused field in sight, which shifts where "the bottom" really is.
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    const viewTop = typeof vv?.offsetTop === 'number' ? vv.offsetTop : 0
    const viewHeight = typeof vv?.height === 'number' ? vv.height : window.innerHeight
    const viewBottom = viewTop + viewHeight

    const spaceBelow = viewBottom - r.bottom - gap - pad
    const spaceAbove = r.top - viewTop - gap - pad
    // Only flip when below genuinely cannot hold the panel and above is roomier,
    // which keeps the familiar downward direction in the ordinary case.
    const flipped = spaceBelow < Math.min(wanted, 160) && spaceAbove > spaceBelow
    const maxHeight = Math.max(96, Math.floor(flipped ? spaceAbove : spaceBelow))

    const next: AnchoredBox = flipped
      ? { bottom: Math.round(window.innerHeight - r.top + gap), left: r.left, width: r.width, maxHeight, flipped }
      : { top: Math.round(r.bottom + gap), left: r.left, width: r.width, maxHeight, flipped }
    if (!match) next.width = 0

    setBox(prev =>
      prev
        && prev.top === next.top && prev.bottom === next.bottom
        && prev.left === next.left && prev.width === next.width
        && prev.maxHeight === next.maxHeight && prev.flipped === next.flipped
        ? prev
        : next,
    )
  }, [anchorRef])

  // Measure before paint so the panel never shows up at a stale spot first.
  useLayoutEffect(() => {
    if (!open) { setBox(null); return }
    measure()
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const el = anchorRef.current
    // Capture phase: scrolls inside the sheets' own overflow containers do not
    // bubble, and those are exactly the ones that move the trigger.
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    // A visualViewport without listeners is a real shape — old Safari reports
    // one, and so do test doubles — so never assume the methods are there.
    const vv = typeof window.visualViewport?.addEventListener === 'function' ? window.visualViewport : null
    vv?.addEventListener('resize', measure)
    vv?.addEventListener('scroll', measure)
    // The trigger can change size on its own (a select whose label grows).
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (el && ro) ro.observe(el)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
      vv?.removeEventListener('resize', measure)
      vv?.removeEventListener('scroll', measure)
      ro?.disconnect()
    }
  }, [open, measure, anchorRef])

  return box
}

/**
 * A counter that ticks whenever an open popover's anchor may have moved (#1999).
 *
 * For popovers that already do their own placement maths — the date picker
 * clamps a fixed 268×360 calendar horizontally, which no generic box can express
 * — re-rendering is all they need: their own calculation then runs against a
 * fresh rect. Same event set as useAnchoredPosition, including capture-phase
 * scroll for the sheets' inner scroll containers.
 */
export function useRemeasureSignal(open: boolean): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!open) return
    const bump = () => setTick(t => t + 1)
    window.addEventListener('scroll', bump, true)
    window.addEventListener('resize', bump)
    const vv = typeof window.visualViewport?.addEventListener === 'function' ? window.visualViewport : null
    vv?.addEventListener('resize', bump)
    vv?.addEventListener('scroll', bump)
    return () => {
      window.removeEventListener('scroll', bump, true)
      window.removeEventListener('resize', bump)
      vv?.removeEventListener('resize', bump)
      vv?.removeEventListener('scroll', bump)
    }
  }, [open])

  return tick
}

/**
 * Scrolls a trigger far enough up that an on-screen keyboard cannot cover the
 * panel that just opened below it (#2000).
 *
 * Called after the panel's search field takes focus. It waits for the keyboard
 * to actually appear — visualViewport only reports the smaller height once the
 * animation starts — and then nudges the nearest scroll container just enough,
 * never more. When nothing shrinks (desktop, or a hardware keyboard) it does
 * nothing at all.
 */
export function scrollAnchorIntoView(anchor: HTMLElement | null, panelHeight = 220): void {
  if (!anchor || typeof window === 'undefined') return
  const vv = typeof window.visualViewport?.addEventListener === 'function' ? window.visualViewport : null
  if (!vv) return
  const baseline = window.innerHeight

  const nudge = () => {
    // No keyboard, no problem — leave the user's scroll position alone.
    if (baseline - vv.height < KEYBOARD_THRESHOLD) return
    const r = anchor.getBoundingClientRect()
    const visibleBottom = vv.offsetTop + vv.height
    const overflow = r.bottom + 4 + panelHeight - visibleBottom
    if (overflow <= 0) return
    const scroller = scrollableAncestor(anchor)
    if (scroller) scroller.scrollTop += overflow
    else window.scrollBy({ top: overflow, behavior: 'smooth' })
  }

  // One shot after the keyboard animation, plus a listener in case it is slower.
  const onResize = () => { vv.removeEventListener('resize', onResize); nudge() }
  vv.addEventListener('resize', onResize)
  window.setTimeout(() => { vv.removeEventListener('resize', onResize); nudge() }, 350)
}

function scrollableAncestor(el: HTMLElement): HTMLElement | null {
  for (let node: HTMLElement | null = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node
  }
  return null
}
