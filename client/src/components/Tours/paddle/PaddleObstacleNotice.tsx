import { compareCodeUnits } from '@trek/shared';
import { AlertTriangle, Info, Loader2, WifiOff } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../../i18n';
import { usePaddleObstacleStore } from '../../../store/paddleObstacleStore';
import { TourNotice } from '../tourParts';

/** The oldest data date among the regions, as a short local date; the route is only as current as its oldest part. */
function dataDate(regions: readonly { source_timestamp?: string | null }[], language: string): string | null {
  const times = regions
    .map((region) => region.source_timestamp)
    .filter((time): time is string => !!time)
    .sort(compareCodeUnits);
  return times[0] ? new Date(times[0]).toLocaleDateString(language, { dateStyle: 'medium' }) : null;
}

/**
 * PAD-05B: what TREK knows about the water along the route, in one line of
 * the checklist card until a new paddle tour is saved. It never reads as an
 * all-clear: covered or not, the paddler checks the water, where nothing is
 * known it says so instead of leaving an empty map to be read as open water,
 * and an answer cut at its limit says that more is there.
 */
export function PaddleObstacleNotice() {
  const { t, language } = useTranslation();
  const { status, coverage, related, regions, truncated } = usePaddleObstacleStore(
    useShallow((state) => ({
      status: state.status,
      coverage: state.coverage,
      related: state.related,
      regions: state.regions,
      truncated: state.truncated,
    }))
  );
  const warn = <AlertTriangle size={13} strokeWidth={2} />;
  if (status === 'idle' || status === 'loading') {
    return (
      <TourNotice role="status" icon={<Loader2 size={13} strokeWidth={2} className="animate-spin" />}>
        {t('tours.paddle.obstacles.loading')}
      </TourNotice>
    );
  }
  if (status === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.paddle.obstacles.offline')}</TourNotice>;
  if (status === 'error') return <TourNotice icon={warn}>{t('tours.paddle.obstacles.error')}</TourNotice>;
  const date = dataDate(regions, language) ?? t('tours.paddle.obstacles.dateUnknown');
  if (coverage === 'none') return <TourNotice icon={warn}>{t('tours.paddle.obstacles.none')}</TourNotice>;
  if (coverage === 'partial')
    return <TourNotice icon={warn}>{t('tours.paddle.obstacles.partial', { date })}</TourNotice>;
  if (truncated) return <TourNotice icon={warn}>{t('tours.paddle.obstacles.truncated')}</TourNotice>;
  return (
    <TourNotice role="status" icon={<Info size={13} strokeWidth={2} />}>
      {related.length
        ? t('tours.paddle.obstacles.covered', { count: related.length, date })
        : t('tours.paddle.obstacles.coveredEmpty', { date })}
    </TourNotice>
  );
}
