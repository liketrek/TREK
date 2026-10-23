import type { TourRouteCard } from '@trek/shared';
import { CalendarDays, Clock, MoveHorizontal, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { SacStepChip } from '../../../Tours/hike/SacStepChip';
import { variantPaintCss } from '../../../Tours/planner/legVariantPaint';
import { formatTourDuration } from '../../../Tours/planner/tourDurationInput';
import { tourDayRowIcon } from '../../../Tours/tourDayRowIcon';
import { CardFacts } from '../parts/CardFacts';
import RouteSketch from '../parts/RouteSketch';
import { useCardFormat } from '../parts/useCardFormat';
import { factKeysOf, factValue, percentText, type FactKey } from './tourRouteModel';
import { sketchOf } from './tourRouteSketchModel';
import { routeName, SAC_WORDS, timeLabelKey, TOUR_TYPE_WORDS } from './tourRouteWords';

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
 * means, the routing limit and where grades come from in its tooltip. Any
 * other tour says what kind it is instead.
 */
export function TourGrade({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  if (card.activity !== 'hike' || !card.grades) {
    const icon = createElement(tourDayRowIcon(card.activity), { size: 10, strokeWidth: 2.2, 'aria-hidden': true });
    return <SoftPill icon={icon}>{t(TOUR_TYPE_WORDS[card.activity].labelKey)}</SoftPill>;
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

/** The day a route is planned on, as words: "Day 2, Tue 14 Oct", or the date alone. */
function DayPill({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const schedule = card.schedule;
  if (!schedule) return null;
  const date = format.date(schedule.date);
  const text =
    schedule.dayNumber !== null ? `${t('assistant.card.tour.day', { day: schedule.dayNumber })}, ${date}` : date;
  return <SoftPill icon={<CalendarDays size={10} strokeWidth={2.2} aria-hidden="true" />}>{text}</SoftPill>;
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

export default function TourRouteHead({
  card,
  sketchHeight,
  onShow,
}: {
  card: TourRouteCard;
  sketchHeight: number;
  onShow: () => void;
}) {
  const { t } = useTranslation();
  const name = routeName(card, t);
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-[72px] flex-none">
        <TourRouteSketch card={card} height={sketchHeight} onShow={onShow} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <bdi title={name} className="line-clamp-2 min-w-0 flex-1 text-body font-semibold leading-tight text-content">
            {name}
          </bdi>
          <TourGrade card={card} />
        </div>
        {card.label && <p className="m-0 mt-0.5 truncate text-caption text-content-muted">{card.label}</p>}
        <CardFacts>
          <TourRouteFigures card={card} />
          <DayPill card={card} />
        </CardFacts>
      </div>
    </div>
  );
}
