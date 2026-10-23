import type { TransitCard as TransitCardData, TransitCardItinerary } from '@trek/shared';
import { ArrowRight, TrainFront } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../../../../i18n';
import { safeHexColor } from '../../../../utils/safeColor';
import {
  fmtTransitDuration,
  TransitItineraryInline,
  TransitLegChips,
  type TransitLegDisplay,
} from '../../../Planner/transitDisplay';
import { DayCarry } from '../../../Roadtrip/RoadtripSidebarBadges';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { useCardFormat } from '../parts/useCardFormat';

/**
 * Public transport connections, drawn with the planner's own transit pieces:
 * per connection its two clocks (a later day marked as the rail marks it),
 * how long it takes and its legs as line chips; the chosen one opens into
 * the planner's leg by leg itinerary. A held journey shows its one
 * connection that way inside its change row.
 */

/** The first letter of a text is one of a script written right to left. */
const STARTS_RIGHT_TO_LEFT = /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}]/u;

/**
 * From and to as one title. The title takes its direction from its first
 * letter, so the arrow points left after an Arabic or Hebrew name and right
 * after any other, always from the start to the end of the journey.
 */
function routeTitle(from: string, to: string): string {
  return STARTS_RIGHT_TO_LEFT.test(from) ? `${from} ← ${to}` : `${from} → ${to}`;
}

/** A line's colour as the transit pieces paint it, allow-listed; none for a line without one. */
function lineColour(value: string | null): string | null {
  return value ? safeHexColor(value, '') || null : null;
}

/** A card leg as the planner's transit pieces read one, its clocks in the user's format. */
function legsOf(itinerary: TransitCardItinerary, clock: (value: string) => string): TransitLegDisplay[] {
  return itinerary.legs.map((leg) => ({
    mode: leg.mode,
    line: leg.line,
    line_color: lineColour(leg.lineColor),
    line_text_color: lineColour(leg.lineTextColor),
    duration: leg.durationS,
    headsign: leg.headsign,
    agency: leg.agency,
    stops: leg.stops,
    from: { name: leg.from.name, time: leg.from.time ? clock(leg.from.time) : null, track: leg.from.track },
    to: { name: leg.to.name, time: leg.to.time ? clock(leg.to.time) : null, track: leg.to.track },
  }));
}

/** "08:04 → 08:41 +1", the arrival a day or more later marked as the rail marks it. */
function Clocks({ itinerary }: { itinerary: TransitCardItinerary }) {
  const format = useCardFormat();
  return (
    <span dir="ltr" className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums">
      {format.clock(itinerary.start)}
      <ArrowRight size={11} aria-hidden="true" className="text-content-faint" />
      {format.clock(itinerary.end)}
      <DayCarry days={itinerary.endDayOffset} />
    </span>
  );
}

function ItineraryRow({
  itinerary,
  open,
  onOpen,
}: {
  itinerary: TransitCardItinerary;
  open: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const lit = open ? 'bg-surface-hover' : '';
  return (
    <li className="-mx-1.5">
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={open}
        className={`flex w-full flex-col gap-1 rounded-[12px] px-1.5 py-2 text-start transition-colors hover:bg-surface-hover ${lit}`}
      >
        <span className="flex w-full items-baseline gap-2">
          <span className="text-body font-semibold text-content">
            <Clocks itinerary={itinerary} />
          </span>
          <span className="ms-auto text-caption tabular-nums text-content-secondary">
            {fmtTransitDuration(itinerary.durationS, t)}
          </span>
        </span>
        <TransitLegChips legs={legsOf(itinerary, format.clock)} transfers={itinerary.transfers} t={t} />
      </button>
      {open && (
        <div className="px-1.5 pb-2 pt-1">
          <TransitItineraryInline legs={legsOf(itinerary, format.clock)} t={t} />
        </div>
      )}
    </li>
  );
}

function TransitCardView({ card }: { card: TransitCardData }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(0);
  const title = routeTitle(card.from, card.to);
  return (
    <CardFrame label={title}>
      <CardHeader icon={TrainFront} tone="info" title={title} count={card.itineraries.length + card.more} />
      <ul className="m-0 mt-1 flex list-none flex-col p-0">
        {card.itineraries.map((itinerary, index) => (
          <ItineraryRow
            key={`${itinerary.date}:${itinerary.start}:${index}`}
            itinerary={itinerary}
            open={open === index}
            onOpen={() => setOpen(open === index ? -1 : index)}
          />
        ))}
      </ul>
      {(card.more > 0 || card.dropped > 0) && (
        <p className="m-0 mt-1 px-1.5 text-caption text-content-muted">
          {card.more > 0 && <span>{t('assistant.card.roadtrip.transit.more', { count: card.more })}</span>}
          {card.dropped > 0 && (
            <span className="ms-1">{t('assistant.card.roadtrip.transit.dropped', { count: card.dropped })}</span>
          )}
        </p>
      )}
    </CardFrame>
  );
}

/** The transit searches of one answer, one card each. */
export default function TransitCard({ cards }: { cards: readonly CardEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      {cards.map(({ toolCallId, card }) =>
        card.kind === 'transit' ? <TransitCardView key={toolCallId} card={card} /> : null
      )}
    </div>
  );
}

/**
 * A held journey inside its change row: its one connection, leg by leg. The
 * row already states when it leaves and arrives, so only an arrival on a
 * later day is marked here.
 */
export function TransitBody({ card }: { card: TransitCardData; item: ChangeItem }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const [itinerary] = card.itineraries;
  if (!itinerary) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {itinerary.endDayOffset > 0 && (
        <span className="text-caption font-medium text-content-secondary">
          <Clocks itinerary={itinerary} />
        </span>
      )}
      <TransitItineraryInline legs={legsOf(itinerary, format.clock)} t={t} />
    </div>
  );
}
