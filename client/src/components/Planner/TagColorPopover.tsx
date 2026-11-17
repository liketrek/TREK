import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { TAG_COLORS } from '../../utils/placeTags';
import { fs } from '../shared/DialogShell';
import { TagColorField } from './TagColorField';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const PANEL =
  'absolute start-0 top-full z-20 mt-2 flex w-[240px] flex-col gap-2.5 rounded-[16px] border border-edge-faint bg-surface-card p-3 shadow-lg';
const SWATCH =
  'grid h-8 w-8 place-items-center rounded-full ring-1 ring-inset ring-edge transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]';
/** The tick on the picked swatch, in a white badge like the tick on a picked tag. */
const TICK = 'grid h-4 w-4 place-items-center rounded-full bg-surface-card shadow-sm';
const CUSTOM_TOGGLE =
  'flex items-center gap-2 rounded-[10px] px-1.5 py-1 font-semibold text-content-secondary transition-colors hover:bg-surface-hover hover:text-content';
/** The custom colour's mark: every colour of the palette round the wheel. */
const RAINBOW = `conic-gradient(${[...TAG_COLORS, TAG_COLORS[0]].join(', ')})`;

/**
 * The palette under a tag's colour dot: the trip's colours as swatches, and
 * under them a colour of one's own in TREK's own colour field. A swatch is kept
 * at once and closes the palette; the field keeps its colour when a drag ends
 * and stays open. Closes on a click outside or Escape, which stays here and does
 * not close the dialog around it.
 */
export function TagColorPopover({
  label,
  value,
  onPick,
  onPreview,
  onClose,
  className = PANEL,
  t,
}: {
  /** What the palette colours, for its accessible name. */
  label: string;
  value: string | null;
  onPick: (color: string) => void;
  /** The colour while it is being dragged, for whoever can show it before it is kept. */
  onPreview?: (color: string) => void;
  onClose: () => void;
  /** The frame: a floating card by default; the phone lays it into the sheet instead. */
  className?: string;
  t: Translate;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const current = value?.toLowerCase() ?? null;
  const isPreset = current !== null && TAG_COLORS.includes(current);
  // A colour of its own opens with the field showing it.
  const [custom, setCustom] = useState(current !== null && !isPreset);
  // The latest close handler, so the listener below is set up once.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const outside = (e: PointerEvent) => {
      // The dot that opened it toggles it itself; a click there is not "outside".
      const host = ref.current?.parentElement;
      if (host && !host.contains(e.target as Node)) close.current();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);

  const pick = (color: string) => {
    onPick(color);
    onClose();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    onClose();
  };

  return (
    <div ref={ref} role="group" aria-label={label} className={className} onKeyDown={onKeyDown}>
      <div className="grid grid-cols-5 justify-items-center gap-y-2">
        {TAG_COLORS.map((color) => {
          const on = current === color;
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={on}
              onClick={() => pick(color)}
              className={SWATCH}
              style={{ background: color }}
            >
              {on && (
                <span className={TICK}>
                  <Check size={10} strokeWidth={3.4} aria-hidden="true" style={{ color }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="h-px bg-[var(--border-faint)]" />
      <button
        type="button"
        aria-expanded={custom}
        onClick={() => setCustom(!custom)}
        className={CUSTOM_TOGGLE}
        style={fs(12, 'body')}
      >
        <span
          aria-hidden="true"
          className="grid h-5 w-5 place-items-center rounded-full"
          style={{ background: RAINBOW }}
        >
          {current !== null && !isPreset && <span className="h-2 w-2 rounded-full bg-surface-card" />}
        </span>
        {t('places.tagColorCustom')}
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          className={`ms-auto transition-transform ${custom ? 'rotate-180' : ''}`}
        />
      </button>
      {custom && (
        <TagColorField value={value ?? TAG_COLORS[0]} onPreview={(hex) => onPreview?.(hex)} onPick={onPick} t={t} />
      )}
    </div>
  );
}
