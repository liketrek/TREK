import type { BookGradientPaint } from '@trek/shared';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { addStop, cssStops, removeStop, updateStop } from './paintEdit';

/**
 * The stops of a gradient, on a bar that shows the gradient itself.
 *
 * Click the bar to add a stop there, in the colour the gradient already has
 * at that point, so adding one changes nothing until it is moved or recoloured.
 * Drag a stop along the bar to move it, or pull it off the bar downwards
 * (it fades) and let go to take it out; the arrow keys move the chosen one, Delete removes it. A
 * gradient keeps at least two stops, so the last two cannot be pulled off.
 *
 * The bar runs left to right in every language, like the gradient preview
 * it carries, so it sets its own direction (studio-paint.css).
 */

/** How far below the bar a stop is pulled before letting go removes it, in pixels. */
const PULL_OFF = 28;

export function GradientStopBar({
  paint,
  selected,
  onSelect,
  onChange,
  labels,
}: {
  paint: BookGradientPaint;
  selected: number;
  onSelect: (index: number) => void;
  onChange: (paint: BookGradientPaint, done: boolean) => void;
  labels: { bar: string; stop: (pos: number) => string };
}) {
  const bar = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; moved: boolean; off: boolean; paint: BookGradientPaint } | null>(null);
  // The stop being pulled off, drawn faded until it is let go, when it goes.
  const [leaving, setLeaving] = useState<number | null>(null);
  const canRemove = paint.stops.length > 2;

  const posOf = (clientX: number) => {
    const box = bar.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return 0;
    return (clientX - box.left) / box.width;
  };

  const onBarDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    const added = addStop(paint, posOf(e.clientX));
    if (!added) return;
    onSelect(added.index);
    onChange(added.paint, true);
  };

  const onStopDown = (index: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onSelect(index);
    drag.current = { index, moved: false, off: false, paint };
  };

  const onStopMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const box = bar.current?.getBoundingClientRect();
    const off = canRemove && !!box && e.clientY > box.bottom + PULL_OFF;
    const next = updateStop(d.paint, d.index, { at: posOf(e.clientX) });
    drag.current = { ...d, moved: true, off, paint: next };
    setLeaving(off ? d.index : null);
    onChange(next, false);
  };

  const onStopUp = () => {
    const d = drag.current;
    drag.current = null;
    setLeaving(null);
    if (!d?.moved) return;
    if (d.off) {
      onSelect(Math.max(0, d.index - 1));
      onChange(removeStop(d.paint, d.index), true);
      return;
    }
    onChange(d.paint, true);
  };

  const onStopKey = (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const stop = paint.stops[index];
    if (!stop) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // The stop's key even when the last two cannot go: it never reaches the page to delete the shape.
      e.preventDefault();
      if (!canRemove) return;
      onSelect(Math.max(0, index - 1));
      onChange(removeStop(paint, index), true);
      return;
    }
    const step = e.shiftKey ? 0.1 : 0.01;
    const by = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
    if (!by) return;
    e.preventDefault();
    onChange(updateStop(paint, index, { at: stop.at + by }), true);
  };

  return (
    <div className="st-stopbar-wrap">
      <div ref={bar} className="st-stopbar" title={labels.bar} aria-label={labels.bar} onPointerDown={onBarDown}>
        <span
          className="st-stopbar-fill"
          style={{ backgroundImage: `linear-gradient(90deg, ${cssStops(paint.stops)})` }}
          aria-hidden
        />
        {paint.stops.map((stop, i) => (
          <button
            type="button"
            // The index is the stop: two stops may share a colour and a position.
            key={i}
            className={`st-stop ${i === selected ? 'is-on' : ''} ${leaving === i ? 'is-leaving' : ''}`}
            style={{ ['--at' as string]: `${Math.round(stop.at * 1000) / 10}%`, ['--stop' as string]: stop.color }}
            aria-label={labels.stop(Math.round(stop.at * 100))}
            aria-pressed={i === selected}
            onPointerDown={onStopDown(i)}
            onPointerMove={onStopMove}
            onPointerUp={onStopUp}
            onPointerCancel={onStopUp}
            onKeyDown={onStopKey(i)}
          />
        ))}
      </div>
    </div>
  );
}
