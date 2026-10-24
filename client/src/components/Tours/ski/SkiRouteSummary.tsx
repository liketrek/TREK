import { Info, MountainSnow } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance, formatElevation } from '../../../utils/units';
import { fs } from '../../shared/DialogShell';
import type { SkiTourRoute } from '../planner/skiRouting';
import { formatTourDuration } from '../planner/tourDurationInput';
import { RailCard, RailFacts } from '../tourParts';
import { skiSecondsOf, skiTallyOf, skiWhyOf, type SkiAvoided } from './skiRouteFacts';

const minutes = (seconds: number) => formatTourDuration(Math.round(seconds / 60));

/** A calm line of the card: what the reader should know, never a warning about snow or safety. */
function Note({ children }: { children: string }) {
  return (
    <p className="m-0 flex min-w-0 items-start gap-1.5 text-content-muted" style={fs(11, 'body')}>
      <Info size={12} strokeWidth={2} className="mt-0.5 flex-none" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** The card the summary sits in, with the piste data build and the credit of the data closing it. */
function SummaryCard({ route, children }: { route: SkiTourRoute; children: ReactNode }) {
  const { t } = useTranslation();
  const credit = route.attribution ?? t('tours.ski.summary.source');
  return (
    <RailCard icon={<MountainSnow size={14} strokeWidth={2} />} title={t('tours.ski.summary.title')} foldId="ski-route">
      <div data-testid="ski-route-summary" className="flex min-w-0 flex-col gap-3">
        {children}
        {route.build && (
          <span className="text-content-faint" style={fs(10.5, 'caption')}>
            {t('tours.ski.summary.build', { build: route.build })}
          </span>
        )}
        <span className="text-content-faint" style={fs(10.5, 'caption')}>
          {[route.areaNames.join(', '), credit].filter(Boolean).join('. ')}
        </span>
      </div>
    </RailCard>
  );
}

/**
 * SKI-02: what the piste router made of a planned ski tour: the time on runs,
 * on lifts, waiting and on foot, the length of the runs, the height skied
 * down on them and the lift rides, the harder runs it kept clear of, and what
 * the reader should weigh: legs it could not plan, stretches that rest on a
 * guess, an older copy of the piste data. The build of the data, the ski
 * areas and the credit of the data close it. A tour opened as it was saved
 * says so, and keeps its line until something of it changes.
 */
export function SkiRouteSummary({ route }: { route: SkiTourRoute | null }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  if (!route) return null;
  if (route.saved) {
    if (route.plannedLegs.length === 0 && !route.build) return null;
    return (
      <SummaryCard route={route}>
        <Note>{t('tours.ski.summary.saved')}</Note>
      </SummaryCard>
    );
  }
  if (route.legs.every((leg) => leg === null)) return null;
  const seconds = skiSecondsOf(route);
  const tally = skiTallyOf(route);
  const { avoided, guessed } = skiWhyOf(route);
  const level = (entry: SkiAvoided) => t(`tours.ski.difficulty.${entry.level}`);
  const facts = [
    { label: t('tours.ski.summary.ski'), value: minutes(seconds.ski) },
    { label: t('tours.ski.summary.lift'), value: minutes(seconds.lift) },
    { label: t('tours.ski.summary.wait'), value: minutes(seconds.wait) },
    { label: t('tours.ski.summary.walk'), value: minutes(seconds.walk) },
    { label: t('tours.ski.summary.runs'), value: formatDistance(tally.runsM / 1000, unit) },
    { label: t('tours.ski.summary.descent'), value: formatElevation(tally.downM, unit) },
    { label: t('tours.ski.summary.lifts'), value: String(tally.rides) },
  ];
  return (
    <SummaryCard route={route}>
      <RailFacts facts={facts} />
      {avoided.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-content-faint" style={fs(10.5, 'body')}>
            {t('tours.ski.summary.avoided')}
          </span>
          <span className="flex flex-wrap gap-1">
            {avoided.map((entry, at) => (
              <span
                key={`${entry.level}-${entry.name ?? at}`}
                className="rounded-full bg-surface-secondary px-2 py-0.5 text-content-secondary"
                style={fs(10.5, 'caption')}
              >
                {entry.name ? `${level(entry)}: ${entry.name}` : level(entry)}
              </span>
            ))}
          </span>
        </div>
      )}
      {route.problems.length > 0 && <Note>{t('tours.ski.summary.unplanned')}</Note>}
      {guessed && <Note>{t('tours.ski.summary.guessed')}</Note>}
      {route.stale && <Note>{t('tours.ski.summary.stale')}</Note>}
    </SummaryCard>
  );
}

/** SKI-02: the summary in the planner's rail, for a ski tour only. */
export function SkiPlannerSummary({ planner }: { planner: { isSki: boolean; skiRoute: SkiTourRoute | null } }) {
  return planner.isSki ? <SkiRouteSummary route={planner.skiRoute} /> : null;
}
