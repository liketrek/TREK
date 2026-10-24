import { useRef, type PointerEvent } from 'react';

import { photoSrc } from '../bookRender';

/**
 * Where the picture is anchored inside its frame.
 *
 * Two sliders were the first draft and they were the wrong instrument: a focal
 * point is one position in a plane, not two unrelated numbers, and nobody can
 * predict what "X 0.62" does to a photograph. Dragging the point over the
 * actual image answers the question by showing it. The pad is a picture of the
 * photograph, so it is laid out the way the photograph is, left to right in
 * every reading direction.
 */
export function FocalPad({
  photoId,
  x,
  y,
  onDrag,
  onCommit,
  hint,
}: {
  photoId: number;
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
  onCommit: (x: number, y: number) => void;
  hint: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const last = useRef({ x, y });

  const from = (e: PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return last.current;
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    last.current = { x: nx, y: ny };
    return last.current;
  };

  const dot = { left: `${x * 100}%`, top: `${y * 100}%` }; // rtl-lint-disable: a point on the photo

  return (
    <div className="st-focal-wrap">
      <div
        className="st-focal"
        ref={box}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          const p = from(e);
          onDrag(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
          const p = from(e);
          onDrag(p.x, p.y);
        }}
        onPointerUp={() => onCommit(last.current.x, last.current.y)}
      >
        <img src={photoSrc(photoId, false)} alt="" draggable={false} />
        <span className="st-focal-dot" style={dot} />
      </div>
      <p className="st-hint st-focal-hint">{hint}</p>
    </div>
  );
}
