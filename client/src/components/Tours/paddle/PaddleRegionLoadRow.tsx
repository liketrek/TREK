import type { PaddleRegionLoadState } from '@trek/shared';
import { CloudDownload, Hourglass, Loader2, Spline } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';

type Translate = ReturnType<typeof useTranslation>['t'];

function headline(state: Extract<PaddleRegionLoadState, { state: 'loading' | 'ready' | 'requested' }>, t: Translate) {
  const region = state.region.name;
  if (state.state === 'ready') return t('tours.paddle.load.ready', { region });
  if (state.state === 'requested') return t('tours.paddle.load.requested', { region });
  return t('tours.paddle.load.loading', { region });
}

/** The phase of a load in words, with its share where it is known. */
function phaseText(state: Extract<PaddleRegionLoadState, { state: 'loading' }>, t: Translate, language: string) {
  if (!state.progress) return state.ahead > 0 ? t('tours.paddle.load.waiting') : t('tours.paddle.load.phase.download');
  const phase = t(`tours.paddle.load.phase.${state.progress.phase}`);
  const share = state.progress.fraction;
  return share === null ? phase : `${phase} ${new Intl.NumberFormat(language, { style: 'percent' }).format(share)}`;
}

/**
 * PAD-11C: a leg waiting for the water data of its region, which TREK loads
 * by itself or an admin has to let through. Calm, not red: nothing is wrong,
 * the data is on its way, and the leg is planned on its own once it is there.
 * Drawing it straight stays possible for whoever does not want to wait.
 */
export function PaddleRegionLoadRow({
  state,
  disabled,
  onDrawStraight,
}: {
  state: Extract<PaddleRegionLoadState, { state: 'loading' | 'ready' | 'requested' }>;
  disabled: boolean;
  onDrawStraight: () => void;
}) {
  const { t, language } = useTranslation();
  const fraction = state.state === 'loading' ? (state.progress?.fraction ?? null) : state.state === 'ready' ? 1 : null;
  const busy = state.state !== 'requested';
  return (
    <li data-testid="tour-planner-region-load" className="flex min-w-0 py-0.5 ps-[34px]">
      <div
        role="status"
        className="flex w-full min-w-0 flex-col gap-1.5 rounded-[10px] bg-surface-secondary px-2 py-1.5 ring-1 ring-inset ring-edge-faint"
      >
        <span className="flex min-w-0 items-start gap-1.5 font-semibold text-content" style={fs(11.5, 'body')}>
          {busy ? (
            <Loader2 size={12} strokeWidth={2.2} className="mt-[2px] flex-none animate-spin" aria-hidden="true" />
          ) : (
            <Hourglass size={12} strokeWidth={2.2} className="mt-[2px] flex-none" aria-hidden="true" />
          )}
          <span className="min-w-0">{headline(state, t)}</span>
        </span>
        {state.state === 'loading' && (
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center justify-between gap-2 text-content-muted" style={fs(10.5, 'body')}>
              <span className="inline-flex min-w-0 items-center gap-1">
                <CloudDownload size={11} strokeWidth={2.2} className="flex-none" aria-hidden="true" />
                <span className="truncate">{phaseText(state, t, language)}</span>
              </span>
            </span>
            <span
              className="relative block h-[3px] w-full overflow-hidden rounded-full bg-surface-tertiary"
              aria-hidden="true"
            >
              <span
                className={`absolute inset-y-0 start-0 rounded-full bg-accent transition-[width] duration-500 ${fraction === null ? 'w-1/3 animate-pulse' : ''}`}
                style={fraction === null ? undefined : { width: `${Math.max(4, Math.round(fraction * 100))}%` }}
              />
            </span>
            <span className="leading-snug text-content-faint" style={fs(10.5, 'body')}>
              {t('tours.paddle.load.hint')}
            </span>
          </span>
        )}
        {state.state === 'requested' && state.reason !== 'ask' && (
          <span className="leading-snug text-content-muted" style={fs(10.5, 'body')}>
            {t(state.reason === 'too_large' ? 'tours.paddle.load.reason.tooLarge' : 'tours.paddle.load.reason.limit')}
          </span>
        )}
        {state.state !== 'ready' && (
          <span className="flex flex-wrap gap-1">
            <button
              type="button"
              disabled={disabled}
              onClick={onDrawStraight}
              className="inline-flex h-[22px] flex-none items-center gap-1 rounded-full bg-surface-card px-2 font-semibold text-content shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover disabled:opacity-40"
              style={fs(10.5)}
            >
              <Spline size={11} strokeWidth={2.2} aria-hidden="true" />
              {t('tours.paddle.drawStraight')}
            </button>
          </span>
        )}
      </div>
    </li>
  );
}
