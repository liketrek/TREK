import type { PaddleRouteLeg } from '@trek/shared';
import { AlertTriangle, RotateCcw, Sparkles, Spline, Waves } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { PaddleLegAnswer } from '../../../repo/paddleRouteRepo';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import type { PaddleLegFailure } from '../planner/paddleRouting';
import { lineLengthM } from '../planner/tourFixedLegs';

/**
 * PAD-11: what the waypoint list says about a leg the router planned or
 * could not plan, and about a point it set itself.
 */

/** A point the route planner set at a portage or a lock it found; touched by the paddler, it becomes theirs. */
export function AutoPointPill() {
  const { t } = useTranslation();
  // Only an icon: the row keeps its room for the place name, the tooltip says the rest.
  return (
    <Tooltip label={`${t('tours.paddle.auto')}: ${t('tours.paddle.autoHint')}`}>
      <span
        data-testid="tour-planner-auto-point"
        aria-label={t('tours.paddle.auto')}
        className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-surface-secondary text-content-muted"
      >
        <Sparkles size={10} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </Tooltip>
  );
}

type Note = { key: string; label: string; tone: 'rapids' | 'gap'; length: number };

/** The stretches of a routed leg worth a look: whitewater, a boat pass, a gap in the data. */
function notesOf(
  leg: Extract<PaddleRouteLeg, { status: 'ok' }>,
  t: (key: string, params?: Record<string, string | number>) => string
): Note[] {
  return leg.segments.flatMap((segment, index): Note[] => {
    const length = lineLengthM(leg.geometry.slice(segment.from, segment.to + 1) as [number, number][]);
    if (segment.kind === 'rapids' && segment.grade != null) {
      return [
        { key: `r${index}`, label: t('tours.paddle.note.rapids', { grade: segment.grade }), tone: 'rapids', length },
      ];
    }
    if (segment.kind === 'pass')
      return [{ key: `p${index}`, label: segment.name ?? t('tours.paddle.note.pass'), tone: 'rapids', length }];
    if (segment.kind === 'gap') return [{ key: `g${index}`, label: t('tours.paddle.note.gap'), tone: 'gap', length }];
    return [];
  });
}

/** Chips under a routed leg for what the paddler should look at on it; nothing when the leg is plain water. */
export function PaddleLegNotes({ leg }: { leg: PaddleLegAnswer | null | undefined }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  if (!leg || leg.status !== 'ok') return null;
  const notes = notesOf(leg, t);
  if (notes.length === 0) return null;
  return (
    <li data-testid="tour-planner-leg-notes" className="flex min-w-0 flex-wrap gap-1 py-0.5 ps-[34px]">
      {notes.map((note) => (
        <Tooltip
          key={note.key}
          label={t(note.tone === 'gap' ? 'tours.paddle.note.gapHint' : 'tours.paddle.note.rapidsHint')}
        >
          <span
            className={`inline-flex h-[22px] min-w-0 items-center gap-1 rounded-full bg-surface-card pe-1 ps-1.5 font-semibold text-content shadow-sm ring-1 ring-inset ${note.tone === 'gap' ? 'ring-[color:var(--map-paddle-gap)]' : 'ring-[color:var(--map-paddle-rapids)]'}`}
            style={fs(11)}
          >
            {note.tone === 'gap' ? (
              <AlertTriangle
                size={11}
                strokeWidth={2.2}
                className="flex-none"
                style={{ color: 'var(--map-paddle-gap)' }}
                aria-hidden="true"
              />
            ) : (
              <Waves
                size={11}
                strokeWidth={2.2}
                className="flex-none"
                style={{ color: 'var(--map-paddle-rapids)' }}
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 truncate">{note.label}</span>
            <span
              className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist font-normal tabular-nums leading-[16px] text-content-secondary"
              style={fs(10)}
            >
              {formatDistance(note.length / 1000, unit)}
            </span>
          </span>
        </Tooltip>
      ))}
    </li>
  );
}

/**
 * A leg the router could not plan: why, in plain words, and what to do about
 * it. The map draws it straight and red meanwhile, and the tour waits to be
 * saved until it is planned or drawn by hand on purpose. Where TREK could not
 * fetch the water data of the leg's region (PAD-11C), `message` says why and
 * `onLoadRetry` reads the region again.
 */
export function PaddleLegFailureRow({
  code,
  disabled,
  onDrawStraight,
  onRetry,
  message,
  onLoadRetry,
}: {
  code: PaddleLegFailure;
  disabled: boolean;
  onDrawStraight: () => void;
  onRetry: () => void;
  message?: string | null;
  onLoadRetry?: () => void;
}) {
  const { t } = useTranslation();
  const retry = onLoadRetry ?? (code !== 'not_on_water' && code !== 'no_region' ? onRetry : null);
  const action =
    'inline-flex h-[22px] flex-none items-center gap-1 rounded-full bg-surface-card px-2 font-semibold text-content shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover disabled:opacity-40';
  return (
    <li data-testid="tour-planner-leg-failure" className="flex min-w-0 py-0.5 ps-[34px]">
      <div role="alert" className="flex w-full min-w-0 flex-col gap-1.5 rounded-[10px] bg-danger-soft px-2 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-danger" style={fs(11.5, 'body')}>
          <AlertTriangle size={12} strokeWidth={2.2} className="flex-none" aria-hidden="true" />
          <span className="min-w-0">{message ?? t(`tours.paddle.failed.${code}`)}</span>
        </span>
        <span className="flex flex-wrap gap-1">
          <button type="button" disabled={disabled} onClick={onDrawStraight} className={action} style={fs(10.5)}>
            <Spline size={11} strokeWidth={2.2} aria-hidden="true" />
            {t('tours.paddle.drawStraight')}
          </button>
          {retry && (
            <button type="button" disabled={disabled} onClick={retry} className={action} style={fs(10.5)}>
              <RotateCcw size={11} strokeWidth={2.2} aria-hidden="true" />
              {t('tours.paddle.retry')}
            </button>
          )}
        </span>
      </div>
    </li>
  );
}
