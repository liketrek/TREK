import { useCallback, useRef, useState } from 'react'
import type { BookElement, BookFrame, BookPageSetup, BookSpread } from '@trek/shared'
import { expandToGroups } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { MIN_FRAME_MM, boxOf, mapFrame, marqueeHits, rectBetween, resizeBox, type HandleId } from './studioGestures'

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

export type { HandleId }

/** How far, in screen pixels, a press has to travel before it draws a marquee. */
const MARQUEE_START_PX = 3

interface Gesture {
  kind: 'move' | 'resize' | 'rotate' | 'marquee'
  handle?: HandleId
  /** The box around the frames being resized, as it was. */
  baseBox?: BookFrame
  /**
   * A marquee: where it started on the spread, in millimetres, and what was
   * selected before it when shift was held (a marquee with shift adds).
   */
  originX?: number
  originY?: number
  keep?: string[]
  /** Whether the pointer has travelled: far enough for a marquee to count, or at all for a move. */
  moved?: boolean
  /**
   * What a press on one of several selected elements narrows the selection
   * to when it lets go without moving: the element, or its group. A drag
   * moves all of them; a click picks the one, as in every design tool.
   */
  narrowTo?: string[]
  startX: number
  startY: number
  /** Frames as they were when the gesture started, by element id. */
  base: Map<string, BookFrame>
  /** Rotations as they were, for the turn. */
  baseRotation?: Map<string, number>
  /**
   * Where the turn is measured from and where it started, both in screen
   * pixels: the centre of the selection, and the angle the pointer stood at
   * when it was grabbed. Turning by the *difference* is what lets the handle
   * be picked up anywhere without the element jumping to meet the pointer.
   */
  centreX?: number
  centreY?: number
  startAngle?: number
  pointerId: number
}

/** Degrees from a centre to a point, measured the way CSS rotates. */
function angleAt(cx: number, cy: number, x: number, y: number): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI
}

/** How near an angle has to come to a step before it takes it. */
const ROTATE_STEP = 15
const ROTATE_SNAP_DEG = 4

export function snapTargets(spread: BookSpread, page: BookPageSetup, exclude: Set<string>) {
  const single = spread.role !== 'inner'
  const w = single ? page.pageWidth : page.pageWidth * 2
  const h = page.pageHeight

  const xs = [0, w / 2, w, page.safe, w - page.safe]
  const ys = [0, h / 2, h, page.safe, h - page.safe]

  /*
   * A spread has four vertical safe lines, not two.
   *
   * The renderer draws the safe area per *page*, so a spread shows a dashed
   * rule inset from each of its four vertical edges — including the two either
   * side of the fold. Only the outer pair was a snap target, which is why
   * dragging inwards caught the gutter itself and nothing else: the line you
   * could see right before it was not something the pointer knew about.
   */
  if (!single) {
    xs.push(
      page.pageWidth,
      page.pageWidth - page.safe,
      page.pageWidth + page.safe,
    )
  }

  /*
   * The centre of each page, and the quarters within it.
   *
   * On a spread `w / 2` is the fold, not the middle of anything you are
   * composing on — a picture centred on its own page has no line to find. The
   * quarters come along because half of a page is where a two-column split
   * lands, which is the other measurement people reach for by eye.
   */
  const pages = single ? 1 : 2
  for (let i = 0; i < pages; i++) {
    const left = i * page.pageWidth
    xs.push(left + page.pageWidth * 0.25, left + page.pageWidth * 0.5, left + page.pageWidth * 0.75)
  }
  ys.push(h * 0.25, h * 0.75)

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

/**
 * A resized box with the edges being dragged snapped onto the nearest line,
 * and the lines it snapped to added to `guides`. A box never turns inside out,
 * snapped or not: it stops at the minimum against the edge that stays.
 */
function snapBox(
  box: BookFrame,
  h: HandleId,
  base: BookFrame,
  targets: { xs: number[]; ys: number[]; tolMm: number },
  guides: Guide[],
): BookFrame {
  let { x, y, w } = box
  let hh = box.h
  if (h.includes('w')) {
    const s = bestSnap([x], targets.xs, targets.tolMm)
    if (s) { w += x - s.at; x = s.at; guides.push({ axis: 'x', at: s.at }) }
  }
  if (h.includes('e')) {
    const s = bestSnap([x + w], targets.xs, targets.tolMm)
    if (s) { w = s.at - x; guides.push({ axis: 'x', at: s.at }) }
  }
  if (h.includes('n')) {
    const s = bestSnap([y], targets.ys, targets.tolMm)
    if (s) { hh += y - s.at; y = s.at; guides.push({ axis: 'y', at: s.at }) }
  }
  if (h.includes('s')) {
    const s = bestSnap([y + hh], targets.ys, targets.tolMm)
    if (s) { hh = s.at - y; guides.push({ axis: 'y', at: s.at }) }
  }
  if (w < MIN_FRAME_MM) { if (h.includes('w')) x = base.x + base.w - MIN_FRAME_MM; w = MIN_FRAME_MM }
  if (hh < MIN_FRAME_MM) { if (h.includes('n')) y = base.y + base.h - MIN_FRAME_MM; hh = MIN_FRAME_MM }
  return { x, y, w, h: hh }
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
  const pick = useStudioStore(s => s.pick)
  const select = useStudioStore(s => s.select)
  const setFrame = useStudioStore(s => s.setFrame)
  const setRotation = useStudioStore(s => s.setRotation)
  const beginGesture = useStudioStore(s => s.beginGesture)
  const endGesture = useStudioStore(s => s.endGesture)

  const gesture = useRef<Gesture | null>(null)
  /** Whether letting go of a marquee that never moved clears the selection. */
  const clearOnClick = useRef(false)
  const [guides, setGuides] = useState<Guide[]>([])
  const [dragging, setDragging] = useState(false)
  /** The marquee being drawn, in millimetres on the spread. */
  const [marquee, setMarquee] = useState<BookFrame | null>(null)

  const tolMm = SNAP_PX / Math.max(pxPerMm, 0.0001)

  const finish = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!gesture.current) return
    try {
      (e.target as Element)?.releasePointerCapture?.(gesture.current.pointerId)
    } catch {
      // The element can be gone already — releasing a capture is best-effort.
    }
    const g = gesture.current
    gesture.current = null
    setGuides([])
    setDragging(false)
    setMarquee(null)
    // A marquee changes the selection only. A press on bare paper that never
    // became one clears the selection, as a click there always did.
    if (g.kind === 'marquee') {
      if (!g.moved && clearOnClick.current) select([])
      clearOnClick.current = false
      return
    }
    if (g.kind === 'move' && !g.moved && g.narrowTo) select(g.narrowTo)
    endGesture()
  }, [endGesture, select])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || !spread) return
    e.preventDefault()

    const dxMm = (e.clientX - g.startX) / pxPerMm
    const dyMm = (e.clientY - g.startY) / pxPerMm

    if (g.kind === 'marquee') {
      if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < MARQUEE_START_PX) return
      g.moved = true
      const rect = rectBetween(g.originX ?? 0, g.originY ?? 0, (g.originX ?? 0) + dxMm, (g.originY ?? 0) + dyMm)
      setMarquee(rect)
      const hits = marqueeHits(spread, rect)
      const keep = g.keep ?? []
      select([...keep, ...hits.filter(id => !keep.includes(id))])
      return
    }

    const moving = new Set(g.base.keys())
    const { xs, ys } = snapTargets(spread, page, moving)
    const nextGuides: Guide[] = []

    if (g.kind === 'rotate') {
      /*
       * Turned by the change in angle, not to the angle under the pointer.
       *
       * Taking the pointer's own angle would snap the element to wherever the
       * handle was grabbed — a quarter turn the moment you touch it. The
       * difference from where the gesture started is what makes it feel like
       * holding a corner.
       */
      const now = angleAt(g.centreX ?? 0, g.centreY ?? 0, e.clientX, e.clientY)
      const delta = now - (g.startAngle ?? 0)

      // Held to the nearest 15° unless shift is down, and always within a few
      // degrees of straight: the angles people actually want are square, a
      // slight tilt, and whatever the picture beside it is at.
      for (const [id, base] of g.baseRotation ?? []) {
        let next = base + delta
        if (!e.shiftKey) {
          const stepped = Math.round(next / ROTATE_STEP) * ROTATE_STEP
          if (Math.abs(next - stepped) <= ROTATE_SNAP_DEG) next = stepped
        }
        next = ((next + 180) % 360 + 360) % 360 - 180
        setRotation(spreadIndex, id, Math.round(next * 10) / 10)
      }
      setGuides([])
      return
    }

    if (g.kind === 'move') {
      if (dxMm !== 0 || dyMm !== 0) g.moved = true
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
    } else if (g.handle && g.baseBox) {
      /*
       * One box for the whole selection, however many are in it.
       *
       * The box is resized and every frame inside it is carried along, so a
       * multi-selection or a group grows as one picture rather than each
       * element stretching about its own corner. With one element the box is
       * its frame and this is the plain resize it always was. Shift keeps the
       * proportions; the snap then stays out of it, since an edge pulled onto
       * a line would bend the ratio Shift is holding.
       */
      const h = g.handle
      const keep = e.shiftKey
      let box = resizeBox(g.baseBox, h, { dx: dxMm, dy: dyMm }, keep)

      if (!keep) box = snapBox(box, h, g.baseBox, { xs, ys, tolMm }, nextGuides)

      for (const [id, f] of g.base) setFrame(spreadIndex, id, mapFrame(f, g.baseBox, box))
    }

    setGuides(nextGuides)
  }, [spread, page, pxPerMm, tolMm, setFrame, setRotation, spreadIndex, select])

  const framesFor = useCallback((ids: string[]) => {
    const map = new Map<string, BookFrame>()
    if (!spread) return map
    for (const el of spread.elements) if (ids.includes(el.id)) map.set(el.id, el.frame)
    return map
  }, [spread])

  /**
   * Draw a marquee from where the press landed. `keep` is what stays selected
   * besides what it catches: the selection before it when shift is held.
   * `clear` says whether letting go without dragging clears the selection,
   * which is what a click on bare paper does.
   */
  const startMarquee = useCallback((e: React.PointerEvent, keep: string[] | undefined, clear: boolean) => {
    const stage = (e.currentTarget as Element).closest('.st-stage')
    const rect = stage?.getBoundingClientRect()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    clearOnClick.current = clear
    gesture.current = {
      kind: 'marquee',
      startX: e.clientX,
      startY: e.clientY,
      originX: (e.clientX - (rect?.left ?? 0)) / pxPerMm,
      originY: (e.clientY - (rect?.top ?? 0)) / pxPerMm,
      keep,
      moved: false,
      base: new Map(),
      pointerId: e.pointerId,
    }
  }, [pxPerMm])

  /** A press on bare paper: a marquee, or with no drag, nothing selected. */
  const startPaper = useCallback((e: React.PointerEvent) => {
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    startMarquee(e, additive ? useStudioStore.getState().selection : undefined, !additive)
  }, [startMarquee])

  const startMove = useCallback((e: React.PointerEvent, el: BookElement) => {
    e.stopPropagation()
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    const before = useStudioStore.getState().selection

    // Group-aware: a click picks the element's whole group, or the element
    // alone inside a group stepped into with a double-click (studioLayers.ts).
    pick(spreadIndex, el.id, additive)

    /*
     * Locked means "cannot be moved", not "cannot be reached".
     *
     * Returning before the selection was made was a dead end: the element could
     * not be picked, so the inspector never showed it, so the unlock button was
     * unreachable and the lock could not be undone by any means short of undo.
     * Selection happens first and then the gesture stops here.
     *
     * A press on a locked element that goes on to drag draws a marquee
     * instead: a locked page-sized photo is where a marquee over a page
     * usually has to start.
     */
    if (el.locked) {
      startMarquee(e, additive ? before : undefined, false)
      return
    }
    if (additive) return

    // What moves is the selection as the press left it, less what is locked.
    const state = useStudioStore.getState()
    const onPage = state.doc?.spreads[spreadIndex]?.elements ?? spread?.elements ?? []
    const targets = onPage.filter(x => state.selection.includes(x.id) && !x.locked).map(x => x.id)
    const own = el.group && el.group === state.enteredGroup
      ? [el.id]
      : expandToGroups({ elements: onPage } as BookSpread, [el.id])

    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    beginGesture()
    gesture.current = {
      kind: 'move',
      startX: e.clientX,
      startY: e.clientY,
      base: framesFor(targets.length ? targets : [el.id]),
      narrowTo: state.selection.length > own.length ? own : undefined,
      pointerId: e.pointerId,
    }
    setDragging(true)
  }, [pick, spreadIndex, spread, startMarquee, beginGesture, framesFor])

  /**
   * Take hold of the rotation handle.
   *
   * The centre comes from the selection's own box rather than from the handle,
   * so a multi-selection turns as one object around the middle of the group —
   * which is what a group of things being turned together looks like.
   */
  const startRotate = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    if (!spread) return

    const chosen = spread.elements.filter(el => selection.includes(el.id) && !el.locked)
    if (chosen.length === 0) return

    const x0 = Math.min(...chosen.map(el => el.frame.x))
    const x1 = Math.max(...chosen.map(el => el.frame.x + el.frame.w))
    const y0 = Math.min(...chosen.map(el => el.frame.y))
    const y1 = Math.max(...chosen.map(el => el.frame.y + el.frame.h))

    // The stage's own box, so the centre is in the same pixels the pointer is.
    const stage = (e.currentTarget as Element).closest('.st-stage')
    const rect = stage?.getBoundingClientRect()
    const centreX = (rect?.left ?? 0) + ((x0 + x1) / 2) * pxPerMm
    const centreY = (rect?.top ?? 0) + ((y0 + y1) / 2) * pxPerMm

    beginGesture()
    gesture.current = {
      kind: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      base: framesFor(selection),
      baseRotation: new Map(chosen.map(el => [el.id, el.rotation])),
      centreX,
      centreY,
      startAngle: angleAt(centreX, centreY, e.clientX, e.clientY),
      pointerId: e.pointerId,
    }
    setDragging(true)
  }, [spread, selection, pxPerMm, beginGesture, framesFor])

  const startResize = useCallback((e: React.PointerEvent, handle: HandleId) => {
    e.stopPropagation()
    const unlocked = (spread?.elements ?? []).filter(el => selection.includes(el.id) && !el.locked).map(el => el.id)
    const base = framesFor(unlocked)
    if (!base.size) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    beginGesture()
    gesture.current = {
      kind: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      base,
      baseBox: boxOf([...base.values()]),
      pointerId: e.pointerId,
    }
    setDragging(true)
  }, [spread, selection, beginGesture, framesFor])

  return { guides, dragging, marquee, startMove, startPaper, startResize, startRotate, onPointerMove, finish }
}
