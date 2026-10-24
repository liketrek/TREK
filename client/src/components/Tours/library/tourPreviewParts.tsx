import { Loader2, Spline } from 'lucide-react';
import { useMemo } from 'react';
import { OFM_POSITRON } from '../../../constants/mapDefaults';
import { useTileUrl } from '../../../hooks/useTileUrl';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { MapViewAuto } from '../../Map/MapViewAuto';
import { fs } from '../../shared/DialogShell';
import { TourDayRowPill } from '../TourDayRowFacts';
import { measureBadges } from './tourMeasureBadges';
import type { MeasuredTour } from './tourPreviewFacts';

/** The measures of a listed tour as small white badges, each named in full by its tooltip. */
export function TourMeasurePills({ tour, testPrefix }: { tour: MeasuredTour; testPrefix: string }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  return (
    <>
      {measureBadges(tour, unit, t).map((badge) => (
        <TourDayRowPill
          key={badge.key}
          icon={badge.icon}
          value={badge.value}
          label={badge.label}
          testId={`${testPrefix}-${badge.key}`}
        />
      ))}
    </>
  );
}

/** Where a preview's answer is: on its way, there, or not to be had. */
type PreviewStatus = 'loading' | 'ready' | 'error' | 'offline' | null;

/**
 * A tour's line on a small map, the way a preview shows it before anything is
 * taken over: drawn once its points are in, a spinner while they load, a short
 * line of text when they cannot be read, and, where the caller names it, what
 * a tour without a line has instead, so an empty box never reads as a broken map.
 */
export function TourLinePreview({
  line,
  focusKey,
  status,
  failedText,
  emptyText,
}: {
  line: ReadonlyArray<readonly unknown[]> | undefined;
  focusKey: string;
  status: PreviewStatus;
  /** What a preview that could not be read says; offline says that it is offline. */
  failedText: string;
  /** What a tour read in full but without a line says in the box; without it the box stays empty. */
  emptyText?: string;
}) {
  const { t } = useTranslation();
  const tileUrl = useTileUrl(OFM_POSITRON);
  const route = useMemo(
    // The client reads the contract's tuples loosely; the points are spelled out as pairs here.
    () =>
      line && line.length > 1 ? [line.map((point): [number, number] => [Number(point[0]), Number(point[1])])] : [],
    [line]
  );
  return (
    <div className="relative h-[240px] flex-none overflow-hidden rounded-[14px] border border-edge-faint bg-surface-secondary">
      {route.length > 0 && (
        <MapViewAuto
          places={[]}
          route={route}
          tileUrl={tileUrl}
          focusPoints={route[0]}
          focusKey={focusKey}
          followSelection={false}
        />
      )}
      {status === 'loading' && (
        <span className="absolute inset-0 grid place-items-center text-content-faint">
          <Loader2 size={18} strokeWidth={2.2} className="animate-spin" />
        </span>
      )}
      {(status === 'error' || status === 'offline') && (
        <span
          className="absolute inset-0 grid place-items-center px-6 text-center text-content-muted"
          style={fs(12, 'body')}
        >
          {status === 'offline' ? t('tours.library.offline') : failedText}
        </span>
      )}
      {status === 'ready' && route.length === 0 && emptyText && (
        <span
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-content-muted"
          style={fs(12, 'body')}
          data-testid="tour-preview-no-line"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-card text-content-faint shadow-sm ring-1 ring-edge-faint">
            <Spline size={16} strokeWidth={2} />
          </span>
          {emptyText}
        </span>
      )}
    </div>
  );
}
