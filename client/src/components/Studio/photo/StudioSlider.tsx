import { useState } from 'react';

/**
 * A number set by dragging, for the values a person judges by eye: a zoom, a
 * brightness, a shadow's strength.
 *
 * The page follows the thumb while it moves (`onLive`, no undo step), and the
 * value is committed once, when the thumb is let go or the keys are released
 * (`onCommit`, one undo step), the way the focal point pad works.
 */
export function StudioSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onLive,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** What the value reads as beside the track. */
  format: (v: number) => string;
  onLive: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;
  const end = () => {
    if (draft === null) return;
    setDraft(null);
    onCommit(draft);
  };

  return (
    <label className="st-slider">
      <span className="st-slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        aria-valuetext={format(shown)}
        onChange={(e) => {
          const v = Number(e.target.value);
          setDraft(v);
          onLive(v);
        }}
        onPointerUp={end}
        onKeyUp={end}
        onBlur={end}
      />
      <output className="st-slider-value">{format(shown)}</output>
    </label>
  );
}
