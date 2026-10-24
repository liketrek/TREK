import type { TourRouteCard } from '@trek/shared';
import { CalendarDays, Clock, MoveHorizontal, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { fs, PILL } from '../../../shared/DialogShell';
import { Tooltip } from '../../../shared/Tooltip';
import { SacStepChip } from '../../../Tours/hike/SacStepChip';
import { variantPaintCss } from '../../../Tours/planner/legVariantPaint';
import { formatTourDuration } from '../../../Tours/planner/tourDurationInput';
import { tourDayRowIcon } from '../../../Tours/tourDayRowIcon';
import CardHeader from '../parts/CardHeader';
import { CardFields } from '../parts/CardSection';
import RouteSketch from '../parts/RouteSketch';
import { useCardFormat } from '../parts/useCardFormat';
import { factKeysOf, factValue, percentText, type FactKey } from './tourRouteModel';
import { sketchOf } from './tourRouteSketchModel';
import { PROFILE_WORDS, routeName, SAC_WORDS, timeLabelKey, TOUR_TYPE_WORDS } from './tourRouteWords';

/**
 * The head of a route card: the route drawn small beside its name, the
 * hardest grade it reaches (or what kind of tour it is), and its figures as
 * the white badges every tour card uses, with the day it is planned on.
 */

/** Each figure's glyph and its tooltip's name, as the planner's way cards name them; the time's by its basis. */
const FACT_LOOK: Readonly<Record<FactKey, { Icon: LucideIcon; labelKey: string | null }>> = {
  time: { Icon: Clock, labelKey: null },
  distance: { Icon: MoveHorizontal, labelKey: 'tours.detail.distance' },
  ascent: { Icon: TrendingUp, labelKey: 'tours.detail.ascent' },
  descent: { Icon: TrendingDown, labelKey: 'tours.detail.descent' },
};

/** The figures the route's activity states, in its order. */
export function TourRouteFigures({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const text = (key: FactKey, value: number) => {
    if (key === 'time') return formatTourDuration(value);
    return key === 'distance' ? format.distance(value / 1000) : format.elevation(value);
  };
  return (
    <>
      {factKeysOf(card).map((key) => {
        const { Icon, labelKey } = FACT_LOOK[key];
        const value = factValue(card, key);
        if (value === null) return null;
        return (
          <Tooltip key={key} label={t(labelKey ?? timeLabelKey(card))}>
            <span className="inline-flex" data-figure={key}>
              <WhiteBadge icon={<Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
                {text(key, value)}
              </WhiteBadge>
            </span>
          </Tooltip>
        );
      })}
    </>
  );
}

/**
 * The grade of a hike, as the hike's own card shows it: the hardest SAC step
 * along the way, uncertain when too little of it is graded, with what it
 * means, the routing limit and where grades come from in its tooltip. A bike
 * tour or a run names its profile instead, any other tour what kind it is.
 */
export function TourGrade({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  if (card.activity !== 'hike' || !card.grades) {
    const icon = createElement(tourDayRowIcon(card.activity), { size: 10, strokeWidth: 2.2, 'aria-hidden': true });
    // A bike tour or a run says what it was planned for: "Gravel", "Trail running".
    const words = card.routingProfile ? PROFILE_WORDS[card.routingProfile] : TOUR_TYPE_WORDS[card.activity];
    return <SoftPill icon={icon}>{t(words.labelKey)}</SoftPill>;
  }
  const { highest, unknownShare } = card.grades;
  const uncertain = unknownShare >= 0.5;
  const meaning = highest === null ? undefined : SAC_WORDS[highest - 1];
  const parts = [
    highest !== null && meaning && `${t('tours.hike.sac.highest')}: T${highest} ${t(meaning.labelKey)}`,
    unknownShare > 0 && t('assistant.card.tour.sacUnknown', { percent: percentText(unknownShare) }),
    card.limit !== null && `${t('tours.hike.sac.routingLimit')}: T${card.limit}`,
    t('tours.hike.sac.source'),
  ].filter((part): part is string => typeof part === 'string');
  const label = parts.join('. ');
  return (
    <Tooltip label={label}>
      <span role="img" aria-label={label} className="inline-flex flex-none" data-testid="tour-grade">
        <SacStepChip step={highest} uncertain={uncertain} />
      </span>
    </Tooltip>
  );
}

/** The day a route is planned on, as a white pill on the band: "Day 2, Tue 14 Oct", or the date alone. */
function DayPill({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const schedule = card.schedule;
  if (!schedule) return null;
  const date = format.date(schedule.date);
  const text =
    schedule.dayNumber !== null ? `${t('assistant.card.tour.day', { day: schedule.dayNumber })}, ${date}` : date;
  return (
    <span className={PILL} style={fs(11)}>
      <CalendarDays size={11} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-faint" />
      {text}
    </span>
  );
}

/** The route drawn small: a button that shows it on the map. */
export function TourRouteSketch({
  card,
  height,
  paint = variantPaintCss('current'),
  onShow,
}: {
  card: TourRouteCard;
  height: number;
  paint?: string;
  onShow?: () => void;
}) {
  const { t } = useTranslation();
  const { lines, marks } = sketchOf(card, paint);
  const name = routeName(card, t);
  return (
    <RouteSketch
      lines={lines}
      marks={marks}
      height={height}
      ariaLabel={t('assistant.card.tour.sketch', { name })}
      onActivate={onShow}
    />
  );
}

/** The route's figures as framed fields, each under its label: distance, climb, descent and time, as known. */
export function TourRouteFields({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const fields: Array<{ key: string; label: string; value: string }> = factKeysOf(card).flatMap((key) => {
    const value = factValue(card, key);
    if (value === null) return [];
    // A field's label is short; how the time was reckoned is the figure badges' tooltip.
    const label = t(FACT_LOOK[key].labelKey ?? 'tours.planner.inspector.duration');
    let text: string;
    if (key === 'time') text = formatTourDuration(value);
    else text = key === 'distance' ? format.distance(value / 1000) : format.elevation(value);
    return [{ key, label, value: text }];
  });
  // A run's time is its distance at the runner's pace: the pace stands beside it.
  if (card.paceSecondsPerKm != null) {
    fields.push({ key: 'pace', label: t('tours.run.pace'), value: format.pace(card.paceSecondsPerKm) });
  }
  return <CardFields fields={fields} />;
}

/**
 * The head band of a route card: the route drawn small on a raised tile, what
 * kind of tour it is above its name, the label under it, and its grade and
 * the day it is planned on as pills on the band.
 */
export default function TourRouteHead({ card, onShow }: { card: TourRouteCard; onShow: () => void }) {
  const { t } = useTranslation();
  const name = routeName(card, t);
  const tile = (
    <span className="w-12 flex-none overflow-hidden rounded-[10px] bg-surface-card p-1 shadow-sm">
      <TourRouteSketch card={card} height={48} onShow={onShow} />
    </span>
  );
  return (
    <CardHeader
      icon={tourDayRowIcon(card.activity)}
      tone="info"
      tile={tile}
      eyebrow={t(TOUR_TYPE_WORDS[card.activity].labelKey)}
      title={name}
      meta={card.label ?? undefined}
    >
      {((card.activity === 'hike' && card.grades) || card.routingProfile || card.schedule) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {((card.activity === 'hike' && card.grades) || card.routingProfile) && <TourGrade card={card} />}
          <DayPill card={card} />
        </div>
      )}
    </CardHeader>
  );
}
