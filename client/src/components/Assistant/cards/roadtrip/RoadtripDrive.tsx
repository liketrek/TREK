import type { ChargingCard as ChargingCardData, RoadtripCard } from '@trek/shared';
import { CalendarDays, CarFront, Crosshair, MapPin, Route, TriangleAlert, Zap } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import { useTranslation } from '../../../../i18n';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { SoftPill } from '../../../Planner/planParts';
import { dayColor } from '../../../Roadtrip/dayColors';
import { formatDurationShort } from '../../../Roadtrip/roadtripModel';
import { DaySection, type DragState } from '../../../Roadtrip/RoadtripSidebar';
import { Tooltip } from '../../../shared/Tooltip';
import { TourNotice } from '../../../Tours/tourParts';
import { useAssistantView } from '../../assistantViewContext';
import { ICON_BUTTON } from '../parts/assistantTones';
import { CardFacts, Fact } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { CardMore } from '../parts/CardRows';
import RouteSketch from '../parts/RouteSketch';
import { useCardFormat } from '../parts/useCardFormat';
import ChargingCard, { ChargerBadges } from './ChargingCard';
import DriveDayStrip from './DriveDayStrip';
import { chargersOnDay, defaultDayIndex, driveSketch, toRoadtripDay } from './roadtripCardModel';
import { roadtripTarget } from './roadtripLook';
import { useRoadtripCardMap } from './useRoadtripCardMap';

/**
 * The drive calculate_roadtrip worked out, as the road trip draws it: its
 * totals as the planner's badges, a sketch of every day with the chosen one
 * bold, the days as a strip of the planner's day tiles, and the chosen day
 * as the planner's own day card, read only: the same stops, service stops,
 * terminals, booked nights, drive bands and findings, in the same rows. A
 * charger checked in the same answer shows in the row of its stop. Where the
 * tank or the battery runs dry on the chosen day, the planner's own words
 * say so and how far in. What the card leaves out is counted as a way into
 * the road trip.
 */

/** The chat's day card never drags: nothing is held, nothing can be dropped. */
const NO_DRAG: DragState = { from: null, setFrom: () => undefined, dropAt: null, setDropAt: () => undefined };

/** Why a drive's totals are not the whole drive, each a literal key. */
const PROBLEM = {
  routing: { labelKey: 'assistant.card.roadtrip.problem.routing' },
  coordinates: { labelKey: 'assistant.card.roadtrip.problem.coordinates' },
  dayWindow: { labelKey: 'assistant.card.roadtrip.problem.dayWindow' },
} as const;

export default function RoadtripDrive({
  toolCallId,
  card,
  chargers,
  variants,
}: {
  toolCallId: string;
  card: RoadtripCard;
  chargers: readonly { toolCallId: string; card: ChargingCardData }[];
  /** The other ways of driving it the answer worked out, to pick from. */
  variants?: ReactNode;
}) {
  const { t } = useTranslation();
  const { tripId, variant } = useAssistantView();
  const format = useCardFormat();
  const map = useRoadtripCardMap();
  // The day the chat was opened on, read once: the card opens there, and on the first driving day otherwise.
  const [selected, setSelected] = useState(() =>
    defaultDayIndex(card, chatOf(useAssistantStore.getState(), tripId).focus?.dayId)
  );
  const tiles = useMemo(() => card.days.map(toRoadtripDay), [card]);
  const day = card.days[selected] ?? card.days[0];
  const railDay = tiles[selected] ?? tiles[0];
  const { joined, apart } = chargersOnDay(day, chargers);
  const sketch = driveSketch(card, selected, dayColor);
  const paint = (dayNumber: number) => dayColor(card.dayColors ? dayNumber : 1).line;
  const vehicle = { kind: card.vehicle, fill: card.defaultFill };
  const showDrive = t('assistant.card.roadtrip.showDrive');
  if (!day || !railDay) return null;
  return (
    <>
      <CardFrame label={t('roadtrip.title')}>
        <CardHeader
          icon={Route}
          tone="info"
          title={t('roadtrip.title')}
          meta={
            card.previewKeys.length > 0 ? (
              <SoftPill tone="accent" caps>
                {t('assistant.card.roadtrip.preview')}
              </SoftPill>
            ) : undefined
          }
          actions={
            <>
              <Tooltip label={showDrive}>
                <button
                  type="button"
                  aria-label={showDrive}
                  onClick={() => map.showDrive(card.days)}
                  className={`${ICON_BUTTON} ${variant === 'fullscreen' ? 'h-9 w-9' : ''}`}
                >
                  <Crosshair size={14} aria-hidden="true" />
                </button>
              </Tooltip>
              <CardOpenButton target={roadtripTarget({ dayId: day.dayId })} labelKey="assistant.card.roadtrip.open" />
            </>
          }
        />
        {variants}
        <CardFacts>
          <Fact
            icon={CarFront}
            label={t('roadtrip.leg.driveText', {
              distance: format.distance(card.distanceM / 1000),
              time: formatDurationShort(card.durationS),
            })}
          />
          <Fact icon={MapPin} label={t('roadtrip.day.stopCount', { count: card.stopCount })} />
          {card.chargingCount > 0 && (
            <Fact icon={Zap} label={t('assistant.card.roadtrip.chargingStops', { count: card.chargingCount })} />
          )}
          {card.quietDays > 0 && (
            <Fact icon={CalendarDays} label={t('assistant.card.roadtrip.quietDays', { count: card.quietDays })} />
          )}
        </CardFacts>
        <div className="mt-2">
          <RouteSketch
            lines={sketch.lines}
            marks={sketch.marks}
            height={variant === 'fullscreen' ? 128 : 104}
            ariaLabel={t('assistant.card.roadtrip.showDay', { number: day.dayNumber })}
            onActivate={() => map.showDay(day)}
          />
        </div>
        {card.days.length > 1 && (
          <DriveDayStrip
            days={card.days}
            tiles={tiles}
            selected={selected}
            dayColors={card.dayColors}
            onSelect={setSelected}
            onHover={(hovered) => map.hoverDay(toolCallId, hovered, hovered ? paint(hovered.dayNumber) : '')}
          />
        )}
        <div
          className="mt-2"
          onMouseEnter={() => map.hoverDay(toolCallId, day, paint(day.dayNumber))}
          onMouseLeave={() => map.hoverDay(toolCallId, null, '')}
        >
          <DaySection
            day={railDay}
            drag={NO_DRAG}
            flush
            dayColors={card.dayColors}
            vehicle={vehicle}
            chargingOf={(stop) => {
              const charger = joined.get(stop.placeId);
              return charger ? <ChargerBadges card={charger} /> : null;
            }}
          />
        </div>
        {day.moreStops > 0 && (
          <p className="m-0 mt-1 px-1.5 text-caption text-content-muted">
            {t('assistant.card.roadtrip.moreStops', { count: day.moreStops })}
          </p>
        )}
        {day.dryKm !== null && (
          <div className="mt-2">
            <TourNotice tone="warning" role="status" icon={<TriangleAlert size={13} aria-hidden="true" />}>
              {t(card.vehicle === 'electric' ? 'roadtrip.refuel.dryElectric' : 'roadtrip.refuel.dry')}{' '}
              {t('roadtrip.refuel.after', { distance: format.distance(day.dryKm) })}
            </TourNotice>
          </div>
        )}
        {card.problem && (
          <div className="mt-2">
            <TourNotice tone="warning" role="status" icon={<TriangleAlert size={13} aria-hidden="true" />}>
              {t(PROBLEM[card.problem].labelKey)}
            </TourNotice>
          </div>
        )}
        {card.undatedRides > 0 && (
          <div className="mt-2">
            <TourNotice>{t('assistant.card.roadtrip.undated', { count: card.undatedRides })}</TourNotice>
          </div>
        )}
        <CardMore
          count={card.moreDays}
          labelKey="assistant.card.roadtrip.moreDays"
          target={roadtripTarget({ dayId: null })}
        />
      </CardFrame>
      {apart.map((charger) => (
        <ChargingCard key={charger.toolCallId} toolCallId={charger.toolCallId} card={charger.card} />
      ))}
    </>
  );
}
