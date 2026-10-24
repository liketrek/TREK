import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { dialAngle, normAngle } from './paintEdit';

/**
 * An angle, set by turning a dial.
 *
 * A number field alone asks people to know that a gradient running to the
 * bottom right is 135 degrees; a dial lets them point at it. It snaps to the
 * eight compass angles when the pointer passes close to one (Alt turns the
 * snap off), and takes the arrow keys, Shift for steps of fifteen.
 *
 * `done` is false while the dial is turned and true on the value it is let go
 * on, so the turn is one undo step (usePaintChannel.ts).
 */
export function AngleDial({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (angle: number, done: boolean) => void;
  label: string;
}) {
  const dial = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef(value);

  const read = (e: PointerEvent<HTMLDivElement>) => {
    const box = dial.current?.getBoundingClientRect();
    if (!box) return last.current;
    return dialAngle(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2), e.altKey);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragging.current = true;
    last.current = read(e);
    onChange(last.current, false);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const a = read(e);
    if (a === last.current) return;
    last.current = a;
    onChange(a, false);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(last.current, true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 15 : 1;
    const by =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step : 0;
    if (!by) return;
    e.preventDefault();
    last.current = normAngle(value + by);
    onChange(last.current, false);
  };
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key.startsWith('Arrow')) onChange(last.current, true);
  };

  return (
    <div
      ref={dial}
      className="st-dial"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={normAngle(value)}
      aria-valuetext={`${normAngle(value)}°`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      <span className="st-dial-needle" style={{ transform: `rotate(${normAngle(value)}deg)` }} aria-hidden>
        <span className="st-dial-knob" />
      </span>
    </div>
  );
}
