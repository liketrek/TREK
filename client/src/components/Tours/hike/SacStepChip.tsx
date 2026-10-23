import { fs } from '../../shared/DialogShell';
import { bikePaintCss } from '../bike/bikePaint';
import { hikePaintCss } from './hikePaint';

/**
 * A grade as the small white chip the hike's card shows it with: a dot in the
 * colour the map draws it in, and its short name beside it. The classes of a
 * hike's facets and the SAC step a route reaches share it, so a grade reads
 * the same in the planner and in the chat.
 */

/** The SAC steps' paints, by step: T1 first. */
const SAC_PAINTS = ['t1', 't2', 't3', 't4', 't5', 't6'] as const;

/** A step's colour as a CSS variable: its own for T1 to T6, the grey of the unknown otherwise. */
function sacStepPaint(step: number | null): string {
  const paint = step === null ? undefined : SAC_PAINTS[step - 1];
  return paint ? hikePaintCss(paint) : bikePaintCss('unknown');
}

/** The chip: the dot, and the short name when there is one; faint for what the data does not say. */
export function GradeChip({ color, text, faint = false }: { color: string; text: string | null; faint?: boolean }) {
  const width = text !== null && text.length > 2 ? 'px-1.5' : 'w-[34px]';
  return (
    <span
      className={`inline-flex h-[18px] flex-none items-center justify-center gap-1 rounded-full bg-surface-card font-geist font-semibold tabular-nums text-content shadow-sm ring-1 ring-inset ring-edge-faint ${width}`}
    >
      <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
      {text !== null && (
        <span className={faint ? 'text-content-faint' : ''} style={fs(10.5)}>
          {text}
        </span>
      )}
    </span>
  );
}

/**
 * The highest SAC step a route reaches ("T3"), with a question mark when too
 * little of the way is graded to be sure ("T3?"), or a lone question mark
 * when no step is known at all: an ungraded way never reads as an easy one.
 */
export function SacStepChip({ step, uncertain = false }: { step: number | null; uncertain?: boolean }) {
  if (step === null) return <GradeChip color={sacStepPaint(null)} text="?" faint />;
  return <GradeChip color={sacStepPaint(step)} text={uncertain ? `T${step}?` : `T${step}`} />;
}
