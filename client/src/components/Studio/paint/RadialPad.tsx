import type { BookGradientPaint } from '@trek/shared';
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { clampUnit, cssStops } from './paintEdit';

/**
 * Where a radial gradient starts: a small preview of it with its centre on
 * it, to drag. The preview is the gradient itself, so the point being moved
 * is the bright spot or the dark one people are actually placing.
 *
 * Like the stop bar it is a picture, laid out left to right in every
 * language (studio-paint.css), with the arrow keys for a step of 2 %.
 */
export function RadialPad({
  paint,
  onChange,
  label,
}: {
  paint: Extract<BookGradientPaint, { type: 'radial' }>;
  onChange: (paint: BookGradientPaint, done: boolean) => void;
  label: string;
}) {
  const pad = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef(paint);

  const at = (e: PointerEvent<HTMLDivElement>) => {
    const box = pad.current?.getBoundingClientRect();
    if (!box || box.width <= 0 || box.height <= 0) return paint;
    return {
      ...paint,
      cx: clampUnit((e.clientX - box.left) / box.width),
      cy: clampUnit((e.clientY - box.top) / box.height),
    };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragging.current = true;
    last.current = at(e);
    onChange(last.current, false);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    last.current = at(e);
    onChange(last.current, false);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(last.current, true);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dx = e.key === 'ArrowRight' ? 0.02 : e.key === 'ArrowLeft' ? -0.02 : 0;
    const dy = e.key === 'ArrowDown' ? 0.02 : e.key === 'ArrowUp' ? -0.02 : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    onChange({ ...paint, cx: clampUnit(paint.cx + dx), cy: clampUnit(paint.cy + dy) }, true);
  };

  return (
    <div
      ref={pad}
      className="st-radial-pad"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuetext={`${Math.round(paint.cx * 100)}% ${Math.round(paint.cy * 100)}%`}
      style={{
        backgroundImage: `radial-gradient(circle at ${paint.cx * 100}% ${paint.cy * 100}%, ${cssStops(paint.stops)})`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <span
        className="st-radial-dot"
        style={{ ['--cx' as string]: `${paint.cx * 100}%`, ['--cy' as string]: `${paint.cy * 100}%` }}
        aria-hidden
      />
    </div>
  );
}
