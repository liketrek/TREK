import { useCallback, useRef, useState } from 'react'
import type { BookElement, BookFrame, BookPageSetup, BookSpread } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'

/**
 * Moving and resizing on the sheet.
 *
 * Hand-rolled on pointer events rather than a drag-and-drop library, because the
 * libraries in this space move items between lists — they have no notion of a
 * free frame, a resize handle, a rotation, or a magnetic edge. HTML5 drag and
 * drop is worse still: it hands you a ghost image you cannot control and no
 * position until the drop.
 *
 * Snapping is what separates an editor that feels precise from one that feels
 * slippery. Candidate lines come from the page (edges, centres, safe area, the
 * gutter) and from every other element on the spread (its edges and centres).
 * The closest candidate within the threshold wins, the offset is applied, and
 * the line is drawn so you can see *why* it stopped there.
 */

/** How close, in screen pixels, an edge has to come before it snaps. */
const SNAP_PX = 6

export interface Guide {
  axis: 'x' | 'y'
  /** Millimetres on the spread. */
  at: number
}

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface Gesture {
  kind: 'move' | 'resize'
  handle?: HandleId
  startX: number
  startY: number
  /** Frames as they were when the gesture started, by element id. */
  base: Map<string, BookFrame>
  pointerId: number
}

function snapTargets(spread: BookSpread, page: BookPageSetup, exclude: Set<string>) {
  const single = spread.role !== 'inner'
  const w = single ? page.pageWidth : page.pageWidth * 2
  const h = page.pageHeight

  const xs = [0, w / 2, w, page.safe, w - page.safe]
  const ys = [0, h / 2, h, page.safe, h - page.safe]
  if (!single) xs.push(page.pageWidth)

  for (const el of spread.elements) {
    if (exclude.has(el.id)) continue
    xs.push(el.frame.x, el.frame.x + el.frame.w / 2, el.frame.x + el.frame.w)
    ys.push(el.frame.y, el.frame.y + el.frame.h / 2, el.frame.y + el.frame.h)
  }
  return { xs, ys }
}

/** Best snap for a set of moving edges: returns the offset to apply, or 0. */
function bestSnap(edges: number[], targets: number[], tolMm: number): { delta: number; at: number } | null {
  let best: { delta: number; at: number } | null = null
  for (const edge of edges) {
    for (const t of targets) {
      const d = t - edge
      if (Math.abs(d) > tolMm) continue
      if (!best || Math.abs(d) < Math.abs(best.delta)) best = { delta: d, at: t }
    }
  }
  return best
}

export function useSpreadInteraction(opts: {
  spread: BookSpread | null
  spreadIndex: number
  page: BookPageSetup
  /** Screen pixels per millimetre, i.e. zoom × 96/25.4. */
  pxPerMm: number
}) {
  const { spread, spreadIndex, page, pxPerMm } = opts
  const selection = useStudioStore(s => s.selection)
  const toggleSelect = useStudioStore(s => s.toggleSelect)
  const select = useStudioStore(s => s.select)
  const setFrame = useStudioStore(s => s.setFrame)
  const beginGesture = useStudioStore(s => s.beginGesture)
  const endGesture = useStudioStore(s => s.endGesture)

  const gesture = useRef<Gesture | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [dragging, setDragging] = useState(false)

  const tolMm = SNAP_PX / Math.max(pxPerMm, 0.0001)

  const finish = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!gesture.current) return
    try {
      (e.target as Element)?.releasePointerCapture?.(gesture.current.pointerId)
    } catch {
      // The element can be gone already — releasing a capture is best-effort.
    }
    gesture.current = null
    setGuides([])
    setDragging(false)
    endGesture()
  }, [endGesture])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || !spread) return
    e.preventDefault()

    const dxMm = (e.clientX - g.startX) / pxPerMm
    const dyMm = (e.clientY - g.startY) / pxPerMm
    const moving = new Set(g.base.keys())
    const { xs, ys } = snapTargets(spread, page, moving)
    const nextGuides: Guide[] = []

    if (g.kind === 'move') {
      // Snap on the union of all moving edges, so a multi-selection lines up as
      // a block rather than each element fighting for its own line.
      const movedX: number[] = []
      const movedY: number[] = []
      for (const f of g.base.values()) {
        movedX.push(f.x + dxMm, f.x + f.w / 2 + dxMm, f.x + f.w + dxMm)
        movedY.push(f.y + dyMm, f.y + f.h / 2 + dyMm, f.y + f.h + dyMm)
      }
      const sx = bestSnap(movedX, xs, tolMm)
      const sy = bestSnap(movedY, ys, tolMm)
      if (sx) nextGuides.push({ axis: 'x', at: sx.at })
      if (sy) nextGuides.push({ axis: 'y', at: sy.at })

      for (const [id, f] of g.base) {
        setFrame(spreadIndex, id, {
          x: f.x + dxMm + (sx?.delta ?? 0),
          y: f.y + dyMm + (sy?.delta ?? 0),
          w: f.w,
          h: f.h,
        })
      }
    } else if (g.handle) {
      const h = g.handle
      for (const [id, f] of g.base) {
        let { x, y, w, hh } = { x: f.x, y: f.y, w: f.w, hh: f.h }

        if (h.includes('w')) { x = f.x + dxMm; w = f.w - dxMm }
        if (h.includes('e')) { w = f.w + dxMm }
        if (h.includes('n')) { y = f.y + dyMm; hh = f.h - dyMm }
        if (h.includes('s')) { hh = f.h + dyMm }

        // Snap the edge actually being dragged, not the whole box.
        if (h.includes('w')) {
          const s = bestSnap([x], xs, tolMm)
          if (s) { w += x - s.at; x = s.at; nextGuides.push({ axis: 'x', at: s.at }) }
        }
        if (h.includes('e')) {
          const s = bestSnap([x + w], xs, tolMm)
          if (s) { w = s.at - x; nextGuides.push({ axis: 'x', at: s.at }) }
        }
        if (h.includes('n')) {
          const s = bestSnap([y], ys, tolMm)
          if (s) { hh += y - s.at; y = s.at; nextGuides.push({ axis: 'y', at: s.at }) }
        }
        if (h.includes('s')) {
          const s = bestSnap([y + hh], ys, tolMm)
          if (s) { hh = s.at - y; nextGuides.push({ axis: 'y', at: s.at }) }
        }

        // A frame may not turn inside out. 4mm is about the smallest thing
        // worth having on a page.
        const MIN = 4
        if (w < MIN) { if (h.includes('w')) x = f.x + f.w - MIN; w = MIN }
        if (hh < MIN) { if (h.includes('n')) y = f.y + f.h - MIN; hh = MIN }

        setFrame(spreadIndex, id, { x, y, w, h: hh })
      }
    }

    setGuides(nextGuides)
  }, [spread, page, pxPerMm, tolMm, setFrame, spreadIndex])

  const framesFor = useCallback((ids: string[]) => {
    const map = new Map<string, BookFrame>()
    if (!spread) return map
    for (const el of spread.elements) if (ids.includes(el.id)) map.set(el.id, el.frame)
    return map
  }, [spread])

  const startMove = useCallback((e: React.PointerEvent, el: BookElement) => {
    if (el.locked) return
    e.stopPropagation()
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    const ids = selection.includes(el.id)
      ? (additive ? selection.filter(x => x !== el.id) : selection)
      : (additive ? [...selection, el.id] : [el.id])

    if (additive) { toggleSelect(el.id, true) } else if (!selection.includes(el.id)) { select([el.id]) }
    const targets = ids.length ? ids : [el.id]

    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    beginGesture()
    gesture.current = {
      kind: 'move',
      startX: e.clientX,
      startY: e.clientY,
      base: framesFor(targets),
      pointerId: e.pointerId,
    }
    setDragging(true)
  }, [selection, toggleSelect, select, beginGesture, framesFor])

  const startResize = useCallback((e: React.PointerEvent, handle: HandleId) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    beginGesture()
    gesture.current = {
      kind: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      base: framesFor(selection),
      pointerId: e.pointerId,
    }
    setDragging(true)
  }, [selection, beginGesture, framesFor])

  return { guides, dragging, startMove, startResize, onPointerMove, finish }
}
