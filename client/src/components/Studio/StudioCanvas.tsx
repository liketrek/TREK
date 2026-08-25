import { useEffect, useState } from 'react'
import { ChevronsDown, ChevronsUp, Copy, Lock, RotateCcw, RotateCw, Trash2, Unlock } from 'lucide-react'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { SpreadFold, SpreadView } from './SpreadView'
import { PeerCursors } from './PeerCursors'
import type { PeerCursor } from './useBookPresence'
import { FONT_STACKS } from './bookRender'
import { useSpreadInteraction, type HandleId } from './useSpreadInteraction'
import { useStudioStore } from '../../store/studioStore'
import { useTranslation } from '../../i18n'

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/**
 * What a delete may actually take out of the selection.
 *
 * A locked element stays selectable on purpose, so the lock has to be honoured
 * here the way the drag, resize and rotate gestures honour it. The store keeps
 * removing whatever it is handed: the import and repair paths remove locked
 * elements deliberately.
 */
const deletable = (spread: BookSpread | undefined, selection: string[]): string[] =>
  (spread?.elements ?? []).filter(e => selection.includes(e.id) && !e.locked).map(e => e.id)

/**
 * Where the four rotation handles sit, as percentages of the selection box.
 *
 * The push diagonally outwards lives in the stylesheet rather than here: it is
 * a fixed number of screen pixels clear of the resize handle on the same
 * corner, so it must not scale with the element the way a percentage would.
 */
const ROTATE_CORNERS = [
  { id: 'nw', left: '0%', top: '0%' },
  { id: 'ne', left: '100%', top: '0%' },
  { id: 'se', left: '100%', top: '100%' },
  { id: 'sw', left: '0%', top: '100%' },
] as const

const HANDLE_POS: Record<HandleId, { left: string; top: string; cursor: string }> = {
  nw: { left: '0%', top: '0%', cursor: 'nwse-resize' },
  n: { left: '50%', top: '0%', cursor: 'ns-resize' },
  ne: { left: '100%', top: '0%', cursor: 'nesw-resize' },
  e: { left: '100%', top: '50%', cursor: 'ew-resize' },
  se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
  s: { left: '50%', top: '100%', cursor: 'ns-resize' },
  sw: { left: '0%', top: '100%', cursor: 'nesw-resize' },
  w: { left: '0%', top: '50%', cursor: 'ew-resize' },
}

/**
 * The sheet plus everything you do to it.
 *
 * The page itself is `SpreadView`, byte for byte what the print renderer will
 * draw. Selection outlines, handles and snap guides live in a layer *above* it
 * and never touch the document, so nothing you see while editing can end up in
 * the book.
 */
export function StudioCanvas({
  spread,
  spreadIndex,
  page,
  zoom,
  pxPerMm,
  bookView,
  dropLabel,
  cursors,
  onCursor,
}: {
  spread: BookSpread | null
  spreadIndex: number
  page: BookPageSetup
  zoom: number
  pxPerMm: number
  bookView: boolean
  dropLabel: string
  /** The other editors' pointers, on this spread and elsewhere. */
  cursors?: PeerCursor[]
  /** Where this one is, in the spread's millimetres. Null once it leaves. */
  onCursor?: (x: number | null, y: number | null) => void
}) {
  const { t } = useTranslation()
  const selection = useStudioStore(s => s.selection)
  const select = useStudioStore(s => s.select)
  const removeElements = useStudioStore(s => s.removeElements)
  const duplicate = useStudioStore(s => s.duplicate)
  const raise = useStudioStore(s => s.raise)
  const commit = useStudioStore(s => s.commit)
  const addElement = useStudioStore(s => s.addElement)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  /** Where on the spread, in millimetres, a drop landed. */
  /**
   * Turn the selection by a number of degrees.
   *
   * Kept in the range a person reads as an angle rather than as a winding
   * number: -180 to 180, so an element turned all the way round reads as
   * straight rather than as 360.
   */
  const rotateBy = (deg: number) => {
    commit(d => ({
      ...d,
      spreads: d.spreads.map((sp, i) => (i !== spreadIndex ? sp : {
        ...sp,
        elements: sp.elements.map(e => {
          if (!selection.includes(e.id) || e.locked) return e
          let next = (e.rotation + deg) % 360
          if (next > 180) next -= 360
          if (next < -180) next += 360
          return { ...e, rotation: Math.round(next * 10) / 10 }
        }),
      })),
    }))
  }

  const pointInMm = (e: React.DragEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - r.left) / scaled, y: (e.clientY - r.top) / scaled }
  }

  const frameUnder = (x: number, y: number) => spread?.elements.find(el =>
    el.kind === 'photo'
    && !el.locked
    && x >= el.frame.x && x <= el.frame.x + el.frame.w
    && y >= el.frame.y && y <= el.frame.y + el.frame.h,
  ) ?? null
  const scaled = pxPerMm * zoom

  const { guides, dragging, startMove, startResize, startRotate, onPointerMove, finish } = useSpreadInteraction({
    spread, spreadIndex, page, pxPerMm: scaled,
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection.length) {
        e.preventDefault()
        const ids = deletable(spread, selection)
        if (ids.length) removeElements(spreadIndex, ids)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection, spread, spreadIndex, removeElements])

  if (!spread) return null

  const single = spread.role !== 'inner'
  const sheetW = single ? page.pageWidth : page.pageWidth * 2
  const sel = spread.elements.filter(e => selection.includes(e.id))

  return (
    <div
      className="st-stage"
      style={{ width: sheetW * scaled, height: page.pageHeight * scaled }}
      onPointerMove={e => {
        onPointerMove(e)
        if (!onCursor) return
        const r = e.currentTarget.getBoundingClientRect()
        onCursor((e.clientX - r.left) / scaled, (e.clientY - r.top) / scaled)
      }}
      // Leaving the stage sends null, so the arrow goes rather than sticking
      // where the pointer happened to cross the edge.
      onPointerLeave={() => onCursor?.(null, null)}
      onPointerUp={finish}
      onPointerCancel={finish}
      onDragOver={e => {
        if (!e.dataTransfer.types.includes('application/x-trek-photo')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        const p = pointInMm(e)
        setDropTarget(frameUnder(p.x, p.y)?.id ?? null)
      }}
      onDragLeave={() => setDropTarget(null)}
      onDrop={e => {
        const raw = e.dataTransfer.getData('application/x-trek-photo')
        if (!raw) return
        e.preventDefault()
        setDropTarget(null)
        const photoId = Number(raw)
        if (!Number.isFinite(photoId)) return

        const p = pointInMm(e)
        const target = frameUnder(p.x, p.y)
        if (target) {
          // Dropped onto a frame: fill it. That is the whole point of an empty
          // frame, and replacing a picture is the natural way to swap one.
          commit(d => ({
            ...d,
            spreads: d.spreads.map((sp, i) => (i !== spreadIndex ? sp : {
              ...sp,
              elements: sp.elements.map(el => (el.id === target.id ? { ...el, photoId } : el)),
            })),
          }))
          select([target.id])
          return
        }

        // Dropped on bare paper: a new frame, centred on the cursor.
        const w = Math.min(page.pageWidth, page.pageHeight) * 0.5
        const h = w * 0.72
        const id = `p-${Math.random().toString(36).slice(2, 9)}`
        addElement(spreadIndex, {
          id, kind: 'photo',
          frame: { x: p.x - w / 2, y: p.y - h / 2, w, h },
          rotation: 0, opacity: 1, locked: false,
          photoId, fit: 'cover', focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none',
          mask: null, frameStyle: 'none',
        } as BookElement)
        select([id])
      }}
    >
      <div
        className="st-sheet"
        style={{
          width: `${sheetW}mm`,
          height: `${page.pageHeight}mm`,
          transform: `scale(${zoom})`,
        }}
        onPointerDown={() => select([])}
      >
        <SpreadView spread={spread} page={page} spreadIndex={spreadIndex} big={zoom > 0.34} showGuides dropLabel={dropLabel} />

        {cursors && cursors.length > 0 && (
          <PeerCursors cursors={cursors} spreadIndex={spreadIndex} zoom={zoom} />
        )}

        {/* Hit targets sit above the page so a photo's own <img> never eats the
            gesture, and so a locked element simply is not grabbable. */}
        {spread.elements.map(el => (
          <div
            key={el.id}
            onPointerDown={e => { if (editing !== el.id) startMove(e, el) }}
            onDoubleClick={() => { if (el.kind === 'text' && !el.locked) setEditing(el.id) }}
            style={{
              position: 'absolute',
              left: `${el.frame.x}mm`,
              top: `${el.frame.y}mm`,
              width: `${el.frame.w}mm`,
              height: `${el.frame.h}mm`,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              cursor: el.locked ? 'default' : 'move',
              // The target stays live even when locked, or the element could
              // not be selected — and an element that cannot be selected cannot
              // be unlocked.
              pointerEvents: 'auto',
            }}
          />
        ))}
      </div>

      {/*
        Editing happens *on the page*, in the element's own type at the element's
        own size. A dialog with a text box would be easier to build and would
        make you guess how the words break — the whole reason to type here is to
        watch the line endings while you do it.
      */}
      {editing && (() => {
        const el = spread.elements.find(e => e.id === editing)
        if (!el || el.kind !== 'text') return null
        return (
          <textarea
            className="st-inline-edit"
            autoFocus
            defaultValue={el.text}
            style={{
              left: el.frame.x * scaled,
              top: el.frame.y * scaled,
              width: el.frame.w * scaled,
              height: el.frame.h * scaled,
              // The document is in pt; the overlay is on screen at the same zoom.
              fontSize: `${el.size * (96 / 72) * zoom}px`,
              fontFamily: FONT_STACKS[el.font],
              fontWeight: el.weight,
              fontStyle: el.italic ? 'italic' : undefined,
              lineHeight: el.leading,
              letterSpacing: `${el.tracking}em`,
              textAlign: el.align,
              color: el.color,
            }}
            onBlur={e => {
              const text = e.target.value
              setEditing(null)
              if (text !== el.text) {
                commit(d => ({
                  ...d,
                  spreads: d.spreads.map((sp, i) => (i !== spreadIndex ? sp : {
                    ...sp,
                    elements: sp.elements.map(x => (x.id === el.id ? { ...x, text, overridden: true } : x)),
                  })),
                }))
              }
            }}
            onKeyDown={e => {
              // Escape here means "stop editing", not "close Studio" — so it must
              // not reach the shell's handler.
              if (e.key === 'Escape') { e.stopPropagation(); (e.target as HTMLTextAreaElement).blur() }
            }}
          />
        )
      })()}

      {/* Chrome layer: drawn in screen pixels so outlines stay hairline at any
          zoom instead of growing with the page. */}
      <div className="st-chrome">
        {bookView && !single && <SpreadFold page={page} scaled={scaled} />}

        {/* The frame a drop would land in. Without it you are aiming blind. */}
        {dropTarget && (() => {
          const el = spread.elements.find(e => e.id === dropTarget)
          if (!el) return null
          return (
            <div
              className="st-drop"
              style={{
                left: el.frame.x * scaled,
                top: el.frame.y * scaled,
                width: el.frame.w * scaled,
                height: el.frame.h * scaled,
              }}
            />
          )
        })()}

        {sel.map(el => (
          <div
            key={el.id}
            className="st-select"
            style={{
              left: el.frame.x * scaled,
              top: el.frame.y * scaled,
              width: el.frame.w * scaled,
              height: el.frame.h * scaled,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            }}
          >
            {/* No resize handles on a locked element: they would offer a drag
                that is refused, which reads as the editor being broken rather
                than as the element being locked. */}
            {/*
              A rotation handle diagonally outside each corner.

              Four rather than one, because which corner is reachable depends on
              where the element sits: a handle off the top right alone is under
              the inspector for anything in the right page's upper half.

              Positioned in percentages of the selection box, so they follow it
              at any zoom and turn with it once it is turned — the box itself
              carries the rotation, and everything inside it comes along.
              
              Outside the box rather than on it, because a handle on the corner
              is a handle you cannot tell from the one that resizes — and this
              is the gesture where grabbing the wrong one is most annoying to
              undo. Held to 15° steps unless shift is down.
            */}
            {sel.length === 1 && !dragging && !el.locked && ROTATE_CORNERS.map(c => (
              <div
                key={c.id}
                className={`st-rotate is-${c.id}`}
                style={{ left: c.left, top: c.top }}
                onPointerDown={startRotate}
                title={t('journey.studio.rotate')}
              >
                <RotateCw size={11} />
              </div>
            ))}

            {sel.length === 1 && !dragging && !el.locked && HANDLES.map(h => (
              <span
                key={h}
                className={`st-handle ${h.length === 2 ? 'is-corner' : h === 'n' || h === 's' ? 'is-h' : 'is-v'}`}
                style={{ left: HANDLE_POS[h].left, top: HANDLE_POS[h].top, cursor: HANDLE_POS[h].cursor }}
                onPointerDown={e => startResize(e, h)}
              />
            ))}
          </div>
        ))}

        {/*
          The quick bar, the way Canva and Figma do it: the three or four things
          you reach for constantly, right where you are already looking, instead
          of a trip to the panel on the far side of the screen. It hides while
          you drag — chrome that follows your hand around is noise.
        */}
        {sel.length >= 1 && !dragging && (() => {
          const x0 = Math.min(...sel.map(e => e.frame.x)) * scaled
          const x1 = Math.max(...sel.map(e => e.frame.x + e.frame.w)) * scaled
          const y0 = Math.min(...sel.map(e => e.frame.y)) * scaled
          const locked = sel.every(e => e.locked)
          return (
            <div
              className="st-quickbar"
              style={{ left: (x0 + x1) / 2, top: Math.max(6, y0 - 12) }}
              onPointerDown={e => e.stopPropagation()}
            >
              <button type="button" onClick={() => duplicate(spreadIndex, selection)} title={t('journey.studio.duplicate')}>
                <Copy size={14} />
              </button>
              {sel.length === 1 && (
                <>
                  <button type="button" onClick={() => raise(spreadIndex, sel[0].id, 'front')} title={t('journey.studio.toFront')}>
                    <ChevronsUp size={14} />
                  </button>
                  <button type="button" onClick={() => raise(spreadIndex, sel[0].id, 'back')} title={t('journey.studio.toBack')}>
                    <ChevronsDown size={14} />
                  </button>
                </>
              )}
              {/*
                Turn it, a step at a time.
                
                Fifteen degrees per press, and a press with shift is one degree
                for the times it has to line up with something. Steps rather
                than a handle you drag: a photograph on a page is almost always
                either square to it or tilted a little on purpose, and dragging
                a rotation past the angle you wanted and back is a worse way to
                arrive at either.
              */}
              <button type="button"
                onClick={e => rotateBy(e.shiftKey ? -1 : -15)}
                title={t('journey.studio.rotateLeft')}
              >
                <RotateCcw size={14} />
              </button>
              <button type="button"
                onClick={e => rotateBy(e.shiftKey ? 1 : 15)}
                title={t('journey.studio.rotateRight')}
              >
                <RotateCw size={14} />
              </button>
              <span className="st-quickbar-sep" />
              <button
                type="button"
                onClick={() => commit(d => ({
                  ...d,
                  spreads: d.spreads.map((sp, i) => (i !== spreadIndex ? sp : {
                    ...sp,
                    elements: sp.elements.map(e => (selection.includes(e.id) ? { ...e, locked: !locked } : e)),
                  })),
                }))}
                title={t(locked ? 'journey.studio.unlock' : 'journey.studio.lock')}
              >
                {locked ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
              <span className="st-quickbar-sep" />
              <button type="button"
                className="is-danger"
                onClick={() => { const ids = deletable(spread, selection); if (ids.length) removeElements(spreadIndex, ids) }}
                title={t('journey.studio.delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })()}

        {guides.map((g, i) => (
          <div
            key={i}
            className="st-guide"
            style={g.axis === 'x'
              ? { left: g.at * scaled, top: 0, width: 1, height: '100%' }
              : { top: g.at * scaled, left: 0, height: 1, width: '100%' }}
          />
        ))}
      </div>
    </div>
  )
}

export type { BookElement }
