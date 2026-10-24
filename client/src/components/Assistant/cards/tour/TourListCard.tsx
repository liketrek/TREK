import type { TourListCard as TourList, TourListRow } from '@trek/shared';
import { CalendarDays, Clock, MoveHorizontal, Route, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

import { useTranslation } from '../../../../i18n';
import { useAssistantStore } from '../../../../store/assistantStore';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { formatTourDuration } from '../../../Tours/planner/tourDurationInput';
import { TourDayRowAvatar } from '../../../Tours/TourDayRowFacts';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry, EntityTarget } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import { useCardFormat } from '../parts/useCardFormat';
import { useLineHover } from './useTourRouteCard';

/**
 * The saved tours of a trip, or of one of its days, as the Tours sidebar
 * lists them: the tour's avatar with its grade, its name, its time, length
 * and climb, and the days it is on or that it is on none yet. Resting on a
 * row lights the tour's line on the map; a tap shows it there. What the card
 * leaves out is counted at its end, a way to the Tours tab (on the phone, to
 * the plan).
 */

/** The map's key for a saved tour's line, the one the plan draws it under. */
const tourRef = (placeId: number) => `tour:${placeId}`;

/** Where the tours the card leaves out are listed; the phone has no Tours tab and shows them on the plan. */
const TOURS_TAB: EntityTarget = { kind: 'tab', tab: 'tour-planner' };

/** The days a tour is on, "Day 2" or "Days 2, 4", or that it is on none yet. */
function dayWords(days: readonly number[], t: (key: string, params?: Record<string, string | number>) => string) {
  if (days.length === 0) return t('assistant.card.tour.unplanned');
  if (days.length === 1) return t('assistant.card.tour.day', { day: days[0] ?? '' });
  return t('assistant.card.tour.days', { days: days.join(', ') });
}

function TourRow({ row, lit, onHover }: { row: TourListRow; lit: boolean; onHover: (on: boolean) => void }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const { onOpen } = useAssistantView();
  const glyph = 'flex-none text-content-faint';
  const facts = (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {row.minutes !== null && (
        <WhiteBadge icon={<Clock size={10} strokeWidth={2.2} className={glyph} />}>
          {formatTourDuration(row.minutes)}
        </WhiteBadge>
      )}
      {row.distanceM !== null && (
        <WhiteBadge icon={<MoveHorizontal size={10} strokeWidth={2.2} className={glyph} />}>
          {format.distance(row.distanceM / 1000)}
        </WhiteBadge>
      )}
      {row.ascentM !== null && (
        <WhiteBadge icon={<TrendingUp size={10} strokeWidth={2.2} className={glyph} />}>
          {format.elevation(row.ascentM)}
        </WhiteBadge>
      )}
      <SoftPill icon={<CalendarDays size={10} strokeWidth={2.2} aria-hidden="true" />}>
        {dayWords(row.days, t)}
      </SoftPill>
    </span>
  );
  return (
    <CardRow
      lead={<TourDayRowAvatar tour={{ tour_type: row.activity, max_hiking_difficulty: row.limit }} size={28} />}
      title={<bdi className="line-clamp-2">{row.name}</bdi>}
      facts={facts}
      lit={lit}
      onHover={onHover}
      onActivate={onOpen ? () => onOpen({ kind: 'map', placeId: row.placeId, dayId: null }) : undefined}
    />
  );
}

function TourListBody({ card }: { card: TourList }) {
  const { t } = useTranslation();
  const { tripId, variant } = useAssistantView();
  const hovered = useAssistantStore((s) => (s.mapLink?.tripId === tripId ? s.mapLink.hoveredId : null));
  const setMapHover = useAssistantStore((s) => s.setMapHover);
  const hover = useLineHover();

  // A card that goes puts out the line it lit.
  useEffect(
    () => () => {
      const link = useAssistantStore.getState().mapLink;
      const lit = link?.tripId === tripId && link.source === 'card' && link.hoveredId?.startsWith('tour:');
      if (lit) setMapHover(tripId, null, 'card');
    },
    [tripId, setMapHover]
  );

  return (
    <CardFrame label={t('assistant.card.tour.list')}>
      <CardHeader icon={Route} tone="info" title={t('assistant.card.tour.list')} count={card.rows.length + card.more} />
      <div className="mt-1.5">
        <CardRows>
          {card.rows.map((row) => (
            <TourRow
              key={row.placeId}
              row={row}
              lit={hovered === tourRef(row.placeId)}
              onHover={(on) => hover(tourRef(row.placeId), on)}
            />
          ))}
        </CardRows>
        <CardMore
          count={card.more}
          labelKey="assistant.place.more"
          target={variant === 'fullscreen' ? { kind: 'map', placeId: null, dayId: card.dayId } : TOURS_TAB}
        />
      </div>
    </CardFrame>
  );
}

export default function TourListCard({ cards }: { cards: readonly CardEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      {cards.map(({ toolCallId, card }) =>
        card.kind === 'tourList' ? <TourListBody key={toolCallId} card={card} /> : null
      )}
    </div>
  );
}
