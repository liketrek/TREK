import { AlertTriangle, ArrowRight, Check, Clock, Loader2, MoveHorizontal, Shuffle, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { DistanceUnit } from '../../../types';
import { formatDistance, formatElevation } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { Tooltip } from '../../shared/Tooltip';
import { TourNotice } from '../tourParts';
import { variantDelta, type LegVariant } from './legVariants';
import { MapCard, MapCardActions, MapCornerOverlay, StopDisc, VariantFigures, WayChoice } from './mapCardParts';
import { formatTourDuration } from './tourDurationInput';
import { stopNumbersOf } from './tourPlannerWaypoints';
import type { LegComparison } from './useLegVariants';
import type { TourPlannerController } from './useTourPlanner';

type Translate = ReturnType<typeof useTranslation>['t'];

/** A signed difference: a plus for more, a minus sign for fewer, nothing for none worth printing. */
function signed(value: number, format: (absolute: number) => string): string | null {
  const text = format(Math.abs(value));
  if (Math.abs(value) < 1e-9 || /^0\s/.test(text)) return null;
  return `${value > 0 ? '+' : '−'}${text}`;
}

/** An end of the section by name: the stop by its number, else the shaping point it is. */
function endName(stop: number | undefined, t: Translate): string {
  return stop === undefined ? t('tours.planner.shapingPoint') : t('tours.planner.waypointLabel', { n: stop });
}

/**
 * How another way differs from the one taken now, in length and time; nothing
 * it cannot say. `hint` names what it is compared with, the way taken now
 * unless said otherwise.
 */
export function VariantDelta({
  variant,
  current,
  unit,
  t,
  hint,
}: {
  variant: LegVariant;
  current: LegVariant;
  unit: DistanceUnit;
  t: Translate;
  hint?: string;
}) {
  const delta = variantDelta(variant, current);
  const parts = [
    { key: 'distance', Icon: MoveHorizontal, text: signed(delta.distanceM / 1000, (km) => formatDistance(km, unit)) },
    {
      key: 'ascent',
      Icon: TrendingUp,
      text: delta.gainM === null ? null : signed(delta.gainM, (meters) => formatElevation(meters, unit)),
    },
    { key: 'time', Icon: Clock, text: delta.minutes === null ? null : signed(delta.minutes, formatTourDuration) },
  ].filter((part) => part.text !== null);
  if (parts.length === 0) return null;
  return (
    <Tooltip label={hint ?? t('tours.variants.deltaHint')}>
      <span className="flex flex-wrap gap-1" data-testid="leg-variant-delta">
        {parts.map(({ key, Icon, text }) => (
          <SoftPill key={key} icon={<Icon size={10} strokeWidth={2.2} aria-hidden="true" />}>
            <span className="tabular-nums">{text}</span>
          </SoftPill>
        ))}
      </span>
    </Tooltip>
  );
}

/** One way as a choice in the list: its mark, its figures, and how it differs from the way taken now. */
function VariantRow({
  variant,
  current,
  chosen,
  disabled,
  unit,
  onSelect,
  onHover,
}: {
  variant: LegVariant;
  current: LegVariant;
  chosen: boolean;
  disabled: boolean;
  unit: DistanceUnit;
  onSelect: () => void;
  onHover: (on: boolean) => void;
}) {
  const { t } = useTranslation();
  const name = variant.current
    ? t('tours.variants.current')
    : t('tours.variants.option', { letter: variant.key.toUpperCase() });
  return (
    <WayChoice way={variant} name={name} chosen={chosen} disabled={disabled} onSelect={onSelect} onHover={onHover}>
      <VariantFigures variant={variant} unit={unit} t={t} />
      {!variant.current && <VariantDelta variant={variant} current={current} unit={unit} t={t} />}
    </WayChoice>
  );
}

/** What the card says besides the ways: that it is asking, that there is nothing to choose, or why a choice changed nothing. */
function ComparisonNotice({ comparison, t }: { comparison: LegComparison; t: Translate }) {
  if (comparison.phase === 'loading') {
    return (
      <TourNotice role="status" icon={<Loader2 size={13} className="animate-spin" aria-hidden="true" />}>
        {t('tours.variants.loading')}
      </TourNotice>
    );
  }
  const warning =
    comparison.notice !== null
      ? t(`tours.variants.notice.${comparison.notice}`)
      : comparison.phase === 'failed'
        ? t('tours.variants.failed')
        : null;
  if (warning) {
    return (
      <TourNotice role="status" tone="warning" icon={<AlertTriangle size={13} aria-hidden="true" />}>
        {warning}
      </TourNotice>
    );
  }
  return comparison.phase === 'none' ? <TourNotice role="status">{t('tours.variants.none')}</TourNotice> : null;
}

/**
 * RTE-02: the ways a routed section of a hike can take, side by side in the
 * look of the other cards over the planner map. Each row is drawn on the map
 * in its colour; pointing at one lights its line up. Choosing one only marks
 * it: the route changes on the button, after the router was asked whether it
 * keeps to that way, and closing leaves everything as it was.
 */
export function LegVariantsCard({
  planner,
  comparison,
  width,
}: {
  planner: Pick<TourPlannerController, 'waypoints' | 'legVariants' | 'canEdit' | 'isSaving'>;
  comparison: LegComparison;
  width?: number;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const { select, hover, apply, close } = planner.legVariants;
  const stops = stopNumbersOf(planner.waypoints);
  const from = stops.get(comparison.leg.fromId);
  const to = stops.get(comparison.leg.toId);
  const current = comparison.variants.find((variant) => variant.current) ?? comparison.variants[0];
  const chosen = comparison.variants.find((variant) => variant.key === comparison.selected);
  const locked = !planner.canEdit || planner.isSaving || comparison.proving;
  const canApply = !!chosen && !chosen.current && !locked;
  return (
    <MapCard
      icon={<Shuffle size={14} strokeWidth={2.2} aria-hidden="true" />}
      title={t('tours.variants.title')}
      subtitle={
        <span
          role="group"
          className="mt-0.5 flex items-center gap-1 text-content-muted"
          aria-label={t('tours.variants.section', { from: endName(from, t), to: endName(to, t) })}
        >
          <StopDisc stop={from} />
          <ArrowRight
            size={12}
            strokeWidth={2.2}
            className="flex-none text-content-faint rtl:-scale-x-100"
            aria-hidden="true"
          />
          <StopDisc stop={to} />
        </span>
      }
      onClose={close}
      width={width}
      testId="leg-variants-card"
    >
      <div role="radiogroup" aria-label={t('tours.variants.title')} className="flex flex-col gap-1.5">
        {comparison.variants.map((variant) => (
          <VariantRow
            key={variant.key}
            variant={variant}
            current={current}
            chosen={variant.key === comparison.selected}
            disabled={comparison.proving}
            unit={unit}
            onSelect={() => select(variant.key)}
            onHover={(on) => hover(on ? variant.key : null)}
          />
        ))}
      </div>
      <ComparisonNotice comparison={comparison} t={t} />
      <MapCardActions
        secondary={{ label: t('common.cancel'), onClick: close }}
        primary={{
          label: comparison.proving ? t('tours.variants.checking') : t('tours.variants.apply'),
          icon: <Check size={14} strokeWidth={2.4} aria-hidden="true" />,
          busy: comparison.proving,
          disabled: !canApply,
          onClick: () => void apply(),
          testId: 'leg-variants-apply',
        }}
      />
    </MapCard>
  );
}

/** The comparison's card in the corner over the planner map, while a section is compared. */
export default function LegVariantsOverlay({
  planner,
  insetEnd,
  bottom,
  width,
}: {
  planner: Pick<TourPlannerController, 'waypoints' | 'legVariants' | 'canEdit' | 'isSaving'>;
  insetEnd: number;
  bottom: number;
  width?: number;
}) {
  const { comparison, close } = planner.legVariants;
  if (!comparison) return null;
  return (
    <MapCornerOverlay onClose={close} insetEnd={insetEnd} bottom={bottom} testId="leg-variants-overlay">
      <LegVariantsCard planner={planner} comparison={comparison} width={width} />
    </MapCornerOverlay>
  );
}
