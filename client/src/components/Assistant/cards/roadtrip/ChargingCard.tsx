import type { ChargingCard as ChargingCardData } from '@trek/shared';
import { useEffect, useState } from 'react';

import { useTranslation } from '../../../../i18n';
import { ChargingBadges } from '../../../Roadtrip/ChargingInfo';
import { CardFacts } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import { CardRow, CardRows } from '../parts/CardRows';
import { useCardFormat } from '../parts/useCardFormat';
import ServiceDisc from './ServiceDisc';
import { useRoadtripCardMap } from './useRoadtripCardMap';

/**
 * A charger as one look at it found it: the planner's own two badges (free
 * points, the cheapest energy price) drawn from the snapshot, never asked
 * again in the chat, how many other prices it publishes, when it was
 * checked, and where the figures come from, since the source asks to be
 * named. A charger on a stop the drive card shows sits in that stop's row
 * instead (`ChargerBadges`), which says when it was
 * checked when pointed at. A count stays green for as long as the planner
 * keeps one green, two minutes; an older one is shown in the neutral colour,
 * with the day it was checked when that was not today.
 */

/** How long a free count reads as current, as in the planner. */
const FRESH_MS = 120_000;

/** What an unknown availability reads as: an old figure, or none to trust. */
const NOT_KNOWN = {
  stale: { labelKey: 'roadtrip.charging.stale' },
  unknown: { labelKey: 'roadtrip.charging.unknown' },
} as const;

const two = (value: number) => String(value).padStart(2, '0');

/** The local clock of a moment, `HH:MM`. */
function localClock(instant: string): string {
  const date = new Date(instant);
  return `${two(date.getHours())}:${two(date.getMinutes())}`;
}

/** The local day of a moment, `YYYY-MM-DD`. */
function localDay(at: number): string {
  const date = new Date(at);
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/** The moment a check happened as the user reads it: its clock, after its day when that is not today. */
function useCheckedTime(instant: string | null) {
  const format = useCardFormat();
  const [now, setNow] = useState(() => Date.now());
  const left = instant ? Date.parse(instant) + FRESH_MS - now : Number.NaN;
  // Turns the count neutral the moment it ages past two minutes.
  useEffect(() => {
    if (!(left > 0)) return undefined;
    const timer = window.setTimeout(() => setNow(Date.now()), left + 50);
    return () => window.clearTimeout(timer);
  }, [left]);
  if (!instant) return { fresh: false, time: null };
  const clock = format.clock(localClock(instant));
  const day = localDay(Date.parse(instant));
  return { fresh: left > 0, time: day === localDay(now) ? clock : `${format.date(day)} ${clock}` };
}

/** The planner's charger badges, from the card's snapshot, with when it was taken. */
export function ChargerBadges({ card }: { card: ChargingCardData }) {
  const { t } = useTranslation();
  const checked = useCheckedTime(card.checkedAt);
  const known = card.status === 'ok' && card.available !== null && !card.stale;
  const status = known
    ? `${card.available}/${card.total} ${t('roadtrip.charging.available')}`
    : t(NOT_KNOWN[card.stale ? 'stale' : 'unknown'].labelKey);
  const label = checked.time
    ? `${status} (${t('assistant.card.roadtrip.charging.checked', { time: checked.time })})`
    : status;
  const energy = card.energy ? { price: card.energy.amount, currency: card.energy.currency } : null;
  return (
    <ChargingBadges
      label={label}
      known={known}
      fresh={checked.fresh}
      available={card.available}
      total={card.total}
      energy={energy}
    />
  );
}

export default function ChargingCard({ toolCallId, card }: { toolCallId: string; card: ChargingCardData }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const checked = useCheckedTime(card.checkedAt);
  const map = useRoadtripCardMap();
  const title = card.name ?? card.station ?? t('roadtrip.poi.charging');
  const where = card.placeId ? { placeId: card.placeId } : {};
  const { lat, lng } = card;
  const point = lat !== null && lng !== null ? { ref: toolCallId, lat, lng, name: title, ...where } : null;
  const source = card.source
    ? card.license
      ? t('assistant.card.roadtrip.charging.source', { source: card.source, license: card.license })
      : t('assistant.card.roadtrip.charging.sourceOnly', { source: card.source })
    : null;
  return (
    <CardFrame label={t('roadtrip.poi.charging')}>
      <CardRows>
        <CardRow
          lead={<ServiceDisc category="charging" />}
          title={<bdi title={title}>{title}</bdi>}
          facts={
            <CardFacts>
              <ChargerBadges card={card} />
              {card.otherPrices > 0 && (
                <span className="text-caption text-content-muted">
                  {t('assistant.card.roadtrip.charging.otherPrices', { count: card.otherPrices })}
                </span>
              )}
              {checked.time && (
                <span className={`text-caption ${card.stale ? 'text-warning' : 'text-content-muted'}`}>
                  {t('assistant.card.roadtrip.charging.checked', { time: checked.time })}
                </span>
              )}
            </CardFacts>
          }
          onActivate={point ? () => map.showPoint(point) : undefined}
          onHover={point ? (on) => map.hoverPoint(on ? point : null) : undefined}
        />
      </CardRows>
      <p className="m-0 mt-1 text-caption text-content-faint">
        {source && <bdi>{source}</bdi>}
        {card.updatedAt && (
          <span className="ms-1">
            {t('assistant.card.roadtrip.charging.updated', { time: format.clock(localClock(card.updatedAt)) })}
          </span>
        )}
        <span className="ms-1">{t('roadtrip.charging.note')}</span>
      </p>
    </CardFrame>
  );
}
