import { type BookLineElement, MAX_LINE_POINTS, bookLinePoints, bookLineWithPoints } from '@trek/shared';
import { useRef } from 'react';

import { useStudioStore } from '../../store/studioStore';
import { constrainPoint } from './lineSnap';

/**
 * The canvas handles of a selected line: one on each of its points, to drag
 * it where it should go, and a smaller one half way along each segment that
 * adds a point when it is pulled. Double-clicking a point between the ends
 * takes it out again.
 *
 * Drawn inside the selection box, which carries the line's turn, at the
 * points' own fractions of it, so they sit on the drawing at any zoom and any
 * angle. The drag itself is measured on the spread, where the pointer is, and
 * the frame is refitted around the moved points by `bookLineWithPoints`, the
 * same refit the book engine uses.
 *
 * While dragging, a segment within a couple of degrees of level or plumb is
 * made exactly level or plumb, and Shift holds it to 15 degree steps.
 */

type Pt = [number, number];

interface Drag {
  index: number;
  start: Pt;
  pointerX: number;
  pointerY: number;
  points: Pt[];
}

export function LineHandles({
  el,
  spreadIndex,
  scaled,
  t,
}: {
  el: BookLineElement;
  spreadIndex: number;
  /** Screen pixels per millimetre at the current zoom. */
  scaled: number;
  t: (k: string) => string;
}) {
  const update = useStudioStore((s) => s.updateElement);
  const beginGesture = useStudioStore((s) => s.beginGesture);
  const endGesture = useStudioStore((s) => s.endGesture);
  const commit = useStudioStore((s) => s.commit);
  const drag = useRef<Drag | null>(null);

  const place = (points: Pt[]) => {
    const next = bookLineWithPoints(el, points);
    update(spreadIndex, el.id, { frame: next.frame, points: next.points });
  };

  const grab = (e: React.PointerEvent, index: number, points: Pt[]) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    beginGesture();
    drag.current = { index, start: points[index], pointerX: e.clientX, pointerY: e.clientY, points };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    e.stopPropagation();
    const raw: Pt = [d.start[0] + (e.clientX - d.pointerX) / scaled, d.start[1] + (e.clientY - d.pointerY) / scaled];
    const anchor = d.points[d.index === 0 ? 1 : d.index - 1];
    const points = d.points.slice();
    points[d.index] = constrainPoint(raw, anchor, e.shiftKey);
    place(points);
  };

  const onUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    e.stopPropagation();
    drag.current = null;
    endGesture();
  };

  /** Pull a new point out of the middle of segment `i`. */
  const insert = (e: React.PointerEvent, i: number) => {
    const world = bookLinePoints(el) as Pt[];
    const a = world[i];
    const b = world[i + 1];
    const points = [...world.slice(0, i + 1), [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Pt, ...world.slice(i + 1)];
    grab(e, i + 1, points);
    place(points);
  };

  const remove = (i: number) => {
    const world = bookLinePoints(el) as Pt[];
    if (world.length <= 2) return;
    const next = bookLineWithPoints(
      el,
      world.filter((_, k) => k !== i)
    );
    commit((d) => ({
      ...d,
      spreads: d.spreads.map((sp, k) =>
        k !== spreadIndex
          ? sp
          : {
              ...sp,
              elements: sp.elements.map((x) =>
                x.kind === 'line' && x.id === el.id ? { ...x, frame: next.frame, points: next.points } : x
              ),
            }
      ),
    }));
  };

  // A point on the drawing, measured from the frame, not a side of the text.
  const pct = (p: { x: number; y: number }) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%` }); // rtl-lint-disable
  const canAdd = el.points.length < MAX_LINE_POINTS;

  return (
    <>
      {canAdd &&
        el.points.slice(1).map((p, i) => {
          const a = el.points[i];
          return (
            <span
              key={`m${i}`}
              className="st-handle is-corner"
              style={{
                ...pct({ x: (a.x + p.x) / 2, y: (a.y + p.y) / 2 }),
                cursor: 'copy',
                transform: 'scale(.7)',
                opacity: 0.7,
              }}
              title={t('journey.studio.addPoint')}
              onPointerDown={(e) => insert(e, i)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
          );
        })}
      {el.points.map((p, i) => (
        <span
          key={`p${i}`}
          className="st-handle is-corner"
          style={{ ...pct(p), cursor: 'crosshair' }}
          title={i > 0 && i < el.points.length - 1 ? t('journey.studio.removePoint') : undefined}
          onPointerDown={(e) => grab(e, i, bookLinePoints(el) as Pt[])}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (i > 0 && i < el.points.length - 1) remove(i);
          }}
        />
      ))}
    </>
  );
}
