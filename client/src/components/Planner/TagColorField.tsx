import { useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';

import { hexToHsv, hsvToHex, hueHex, normalizeHex, type Hsv } from '../../utils/colorSpace';
import { fs } from '../shared/DialogShell';

type Translate = (key: string, params?: Record<string, string | number>) => string;

// The hue circle as a track, and the field over the picked hue: white to the right
// into the hue, black from the bottom up. Built as strings so no colour literal sits in a style.
const HUE_TRACK = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map(hueHex).join(', ')})`;
const fieldBackground = (h: number) =>
  `linear-gradient(to top, ${hsvToHex({ h: 0, s: 0, v: 0 })}, transparent), linear-gradient(to right, ${hsvToHex({ h: 0, s: 0, v: 1 })}, ${hueHex(h)})`;

const THUMB =
  'pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-card shadow-md';
const KEY_STEP = 0.04;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** Where a pointer is inside an element, as 0 to 1 across and down. */
function at(e: ReactPointerEvent<HTMLElement>): { x: number; y: number } {
  const box = e.currentTarget.getBoundingClientRect();
  return { x: clamp((e.clientX - box.left) / box.width), y: clamp((e.clientY - box.top) / box.height) };
}

/**
 * The custom colour of the tag palette: a field for saturation and brightness,
 * a slider for the hue and the hex code to type. Dragging shows the colour as it
 * goes (onPreview); it is kept when the pointer lets go, or when a typed code is
 * complete (onPick), so a drag sends one change and not one per pixel.
 */
export function TagColorField({
  value,
  onPreview,
  onPick,
  t,
}: {
  value: string;
  onPreview: (hex: string) => void;
  onPick: (hex: string) => void;
  t: Translate;
}) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [typed, setTyped] = useState(value);
  const hex = hsvToHex(hsv);

  const show = (next: Hsv) => {
    setHsv(next);
    const nextHex = hsvToHex(next);
    setTyped(nextHex);
    onPreview(nextHex);
  };

  const drag = (read: (e: ReactPointerEvent<HTMLElement>) => Hsv) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      show(read(e));
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) show(read(e));
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      onPick(hsvToHex(read(e)));
    },
  });

  // The arrow keys move the field's point and the slider, and keep the colour at once.
  const nudge = (patch: (cur: Hsv) => Hsv) => (e: KeyboardEvent<HTMLElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 1, ArrowDown: -1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = patch({
      ...hsv,
      ...(e.key === 'ArrowUp' || e.key === 'ArrowDown'
        ? { v: clamp(hsv.v + step * KEY_STEP) }
        : { s: clamp(hsv.s + step * KEY_STEP) }),
    });
    show(next);
    onPick(hsvToHex(next));
  };

  const typeHex = (raw: string) => {
    setTyped(raw);
    const norm = normalizeHex(raw);
    if (!norm) return;
    setHsv(hexToHsv(norm));
    onPreview(norm);
  };
  const keepTyped = () => {
    const norm = normalizeHex(typed);
    if (norm) onPick(norm);
    else setTyped(hex);
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div
        role="slider"
        tabIndex={0}
        aria-label={t('places.tagColorCustom')}
        aria-valuetext={hex}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-28 cursor-crosshair touch-none rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]"
        style={{ background: fieldBackground(hsv.h) }}
        onKeyDown={nudge((next) => next)}
        {...drag((e) => {
          const p = at(e);
          return { h: hsv.h, s: p.x, v: 1 - p.y };
        })}
      >
        <span className={THUMB} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }} />
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t('places.tagColorHue')}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuemin={0}
        aria-valuemax={360}
        className="relative h-3 cursor-pointer touch-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]"
        style={{ background: HUE_TRACK }}
        onKeyDown={(e) => {
          const step = { ArrowLeft: -6, ArrowRight: 6 }[e.key];
          if (step === undefined) return;
          e.preventDefault();
          const next = { ...hsv, h: (hsv.h + step + 360) % 360 };
          show(next);
          onPick(hsvToHex(next));
        }}
        {...drag((e) => ({ ...hsv, h: at(e).x * 359.9 }))}
      >
        <span className={`${THUMB} top-1/2`} style={{ left: `${(hsv.h / 360) * 100}%`, background: hueHex(hsv.h) }} />
      </div>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-7 w-7 flex-none rounded-full ring-1 ring-inset ring-edge"
          style={{ background: hex }}
        />
        <input
          type="text"
          value={typed}
          onChange={(e) => typeHex(e.target.value)}
          onBlur={keepTyped}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            keepTyped();
          }}
          maxLength={7}
          spellCheck={false}
          aria-label={t('places.tagColorHex')}
          className="h-7 min-w-0 flex-1 rounded-[8px] border border-edge bg-surface-input px-2 font-mono uppercase text-content outline-none focus:border-content-faint"
          style={fs(12, 'body')}
        />
      </div>
    </div>
  );
}
