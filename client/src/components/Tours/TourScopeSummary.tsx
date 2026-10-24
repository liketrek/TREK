import type { TourListItem, TourTypeKey } from '@trek/shared';
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChartColumnBig,
  ChevronDown,
  Clock,
  FileDown,
  Mountain,
  Route,
  Ruler,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, type ComponentType } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import { formatDistance, formatElevation } from '../../utils/units';
import { fs } from '../shared/DialogShell';
import { useRailFold } from './railFold';
import { TourDayRowPill } from './TourDayRowFacts';
import { InfoDot, RailCard } from './tourParts';
import { formatPlannedTourDuration } from './tourPresentation';
import { tourScopeSummary, type ScopeSum, type TourTypeScope } from './tourScope';

type Translate = (key: string, params?: Record<string, unknown>) => string;

const TYPE_ICON: Partial<Record<TourTypeKey, ComponentType<{ size?: number; strokeWidth?: number }>>> = {
  hike: Mountain,
  kayak: Waves,
};

/** A count as a white badge of the card: the number, then what it counts. */
function CountBadge({ value, label, tone = 'neutral' }: { value: number; label: string; tone?: 'neutral' | 'faint' }) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-full bg-surface-card px-2 py-0.5 shadow-sm ring-1 ring-inset ring-edge-faint ${tone === 'faint' ? 'text-content-muted' : 'text-content-secondary'}`}
      style={fs(11, 'body')}
    >
      <span className="font-geist font-semibold tabular-nums text-content">{value}</span>
      {label}
    </span>
  );
}

/** One measure of a type as a badge: its icon and sum, its name (and how complete it is) in the tooltip. */
interface ScopeBadge {
  key: string;
  icon: LucideIcon;
  value: string;
  label: string;
}

/**
 * A sum as a badge: nothing when no tour has the value, else the sum, marked
 * as at least that much when some tours lack it, the tooltip saying for how many.
 */
function sumBadge(
  { key, icon, name }: Pick<ScopeBadge, 'key' | 'icon'> & { name: string },
  sum: ScopeSum,
  format: (value: number) => string,
  t: Translate
): ScopeBadge | null {
  if (sum.value === null) return null;
  const partial = sum.known < sum.of;
  const value = partial || sum.atLeast ? `≥ ${format(sum.value)}` : format(sum.value);
  if (partial)
    return {
      key,
      icon,
      value,
      label: `${name}: ${value} (${t('tours.scope.partialBody', { known: sum.known, of: sum.of })})`,
    };
  // CW-02: known for every tour, but a city walk's stay is not entered yet.
  const said = sum.atLeast ? t('tours.walk.totalAtLeast', { time: format(sum.value) }) : value;
  return { key, icon, value, label: `${name}: ${said}` };
}

function typeBadges(scope: TourTypeScope, unit: Parameters<typeof formatDistance>[1], t: Translate): ScopeBadge[] {
  const distance = (km: number) => formatDistance(km, unit);
  const height = (m: number) => formatElevation(m, unit);
  return [
    sumBadge({ key: 'distance', icon: Ruler, name: t('tours.detail.distance') }, scope.distanceKm, distance, t),
    sumBadge({ key: 'ascent', icon: ArrowUp, name: t('tours.detail.ascent') }, scope.ascentM, height, t),
    sumBadge({ key: 'descent', icon: ArrowDown, name: t('tours.detail.descent') }, scope.descentM, height, t),
    sumBadge(
      { key: 'routed', icon: Clock, name: t('tours.scope.routed') },
      scope.routedMinutes,
      formatPlannedTourDuration,
      t
    ),
    sumBadge(
      { key: 'imported', icon: FileDown, name: t('tours.scope.imported') },
      scope.importedMinutes,
      formatPlannedTourDuration,
      t
    ),
    sumBadge(
      // A city walk plans its stays, not breaks (CW-02).
      {
        key: 'planned',
        icon: CalendarClock,
        name: t(scope.type === 'walk' ? 'tours.scope.plannedWithStays' : 'tours.scope.planned'),
      },
      scope.plannedMinutes,
      formatPlannedTourDuration,
      t
    ),
  ].filter((badge): badge is ScopeBadge => badge !== null);
}

/** One tour type: its name and how many tours, then its sums as a line of badges. */
function TypeScope({ scope }: { scope: TourTypeScope }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const Icon = TYPE_ICON[scope.type] ?? Route;
  const badges = typeBadges(scope, unit, t);
  return (
    <section
      aria-label={t(`tourTypes.${scope.type}`)}
      className="flex flex-col gap-1.5"
      data-testid={`tour-scope-${scope.type}`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="grid h-4 w-4 flex-none place-items-center text-content-muted">
          <Icon size={13} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12, 'body')}>
          {t(`tourTypes.${scope.type}`)}
        </span>
        <span className="font-geist tabular-nums text-content-faint" style={fs(11)}>
          {scope.count}
        </span>
      </div>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 ps-[22px]">
          {badges.map((badge) => (
            <TourDayRowPill
              key={badge.key}
              icon={badge.icon}
              value={badge.value}
              label={badge.label}
              testId={`tour-scope-${scope.type}-${badge.key}`}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 ps-[22px] text-content-faint" style={fs(11.5, 'body')}>
          {t('tours.scope.noMeasures')}
        </p>
      )}
    </section>
  );
}

/**
 * STA-01: what the trip's tours add up to, above their list, by type: how many,
 * how many are on a day, distance, ascent and descent, and the three kinds of
 * time apart (the router's, an import's, the planned one with breaks), never
 * added up across types. It reads the list as filtered, so a type chosen in the
 * filter narrows both. A value no tour has is left out rather than shown as
 * zero; a sum some tours lack is marked as at least that much. It starts folded
 * to its counts, and opening it is remembered in this browser.
 */
export function TourScopeSummary({ tours }: { tours: readonly TourListItem[] }) {
  const { t } = useTranslation();
  // Folded until opened: the list is what the rail is for, the totals a look on demand.
  const { folded, toggle } = useRailFold('trip-totals', true);
  // On a day as the day lists say, not the list's flag, so a tour put on a day counts at once (as its row's badge does).
  const assignments = useTripStore((state) => state.assignments);
  const scope = useMemo(() => {
    const onDays = new Set(Object.values(assignments ?? {}).flatMap((list) => list.map((item) => item.place_id)));
    return tourScopeSummary(tours, (tour) => onDays.has(tour.place_id));
  }, [assignments, tours]);
  if (scope.count === 0) return null;
  const toggleLabel = folded ? t('common.expand') : t('common.collapse');
  return (
    <RailCard
      icon={<ChartColumnBig size={14} strokeWidth={2} />}
      title={t('tours.scope.title')}
      aside={
        <span className="flex flex-none items-center gap-0.5">
          <InfoDot label={t('tours.scope.title')} description={t('tours.scope.info')} />
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!folded}
            aria-label={toggleLabel}
            data-testid="tour-scope-toggle"
            className="grid h-6 w-6 place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronDown size={14} strokeWidth={2.2} className={`transition-transform ${folded ? '' : 'rotate-180'}`} />
          </button>
        </span>
      }
    >
      <div className="flex flex-wrap items-center gap-1.5" data-testid="tour-scope-counts">
        <CountBadge value={scope.count} label={t('tours.mode.tours')} />
        <CountBadge value={scope.onDays} label={t('places.planned')} tone="faint" />
        <CountBadge value={scope.count - scope.onDays} label={t('places.unplanned')} tone="faint" />
      </div>
      {!folded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-edge-faint pt-3">
          {scope.types.map((typeScope) => (
            <TypeScope key={typeScope.type} scope={typeScope} />
          ))}
        </div>
      )}
    </RailCard>
  );
}
