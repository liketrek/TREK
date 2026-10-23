import type { CorridorCard as CorridorCardData, CorridorCardHit } from '@trek/shared';
import { ArrowRight, Route, Search } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import { formatDistance } from '../../../../utils/units';
import { SoftPill } from '../../../Planner/planParts';
import { alongLabel, offRouteLabel } from '../../../Roadtrip/corridorSearchModel';
import { CORRIDOR_CATEGORY_BY_KEY } from '../../../Roadtrip/stopKinds';
import { TourNotice } from '../../../Tours/tourParts';
import type { CardEntry } from '../cardTypes';
import { CardFacts } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import { roadtripTarget } from './roadtripLook';
import ServiceDisc from './ServiceDisc';
import { useRoadtripCardMap } from './useRoadtripCardMap';

/**
 * What a corridor search found along a day's drive, worded as the planner's
 * corridor panel words it: each hit with its category's icon in its tint,
 * how far off the road and how far into the drive it lies, the two stops it
 * lies between and, for a charger, its sockets. Resting on a hit shows its
 * pin, a click moves the map there. A search that is not done says how much
 * of the road it covered.
 */

/** Socket names as drivers know them; any other is spelled from its key. */
const SOCKET_NAMES: Readonly<Record<string, string>> = { ccs: 'CCS', type2_combo: 'CCS', chademo: 'CHAdeMO' };

function socketName(type: string): string {
  const known = SOCKET_NAMES[type];
  if (known) return known;
  const words = type.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function HitFacts({ hit }: { hit: CorridorCardHit }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  return (
    <CardFacts>
      <SoftPill icon={<Route size={10} aria-hidden="true" className="text-content-faint" />}>
        {alongLabel(hit.alongKm, unit, t)}
      </SoftPill>
      <SoftPill>{offRouteLabel(hit.offKm, unit, t)}</SoftPill>
      {hit.between && (
        <SoftPill className="max-w-full">
          <bdi className="truncate">{hit.between[0]}</bdi>
          <ArrowRight size={9} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />
          <bdi className="truncate">{hit.between[1]}</bdi>
        </SoftPill>
      )}
      {hit.sockets.map((socket) => (
        <SoftPill key={socket.type} className="tabular-nums">
          {socketName(socket.type)}
          {socket.kw !== null && ` ${socket.kw} kW`}
          {socket.count !== null && socket.count > 1 && ` ×${socket.count}`}
        </SoftPill>
      ))}
    </CardFacts>
  );
}

function CorridorCardView({ card }: { card: CorridorCardData }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  const map = useRoadtripCardMap();
  const category = CORRIDOR_CATEGORY_BY_KEY[card.category];
  const target = roadtripTarget({ dayId: card.dayId });
  const kind = t(category?.labelKey ?? 'roadtrip.window.onRoute');
  return (
    <CardFrame label={t('roadtrip.window.onRoute')}>
      <CardHeader
        icon={category?.Icon ?? Search}
        tone="info"
        title={t('roadtrip.window.onRoute')}
        count={card.hits.length + card.more}
        meta={
          <span className="flex flex-wrap items-center gap-1">
            <SoftPill>{t('roadtrip.day', { number: card.dayNumber })}</SoftPill>
            <SoftPill>{kind}</SoftPill>
          </span>
        }
        actions={<CardOpenButton target={target} labelKey="assistant.card.roadtrip.open" />}
      />
      {card.hits.length === 0 ? (
        <p className="m-0 mt-2 text-caption text-content-muted">
          {t('assistant.card.roadtrip.corridor.none', { distance: formatDistance(card.widthKm, unit) })}
        </p>
      ) : (
        <CardRows>
          {card.hits.map((hit) => {
            const name = hit.name ?? hit.brand ?? kind;
            const point = { ref: hit.ref, lat: hit.lat, lng: hit.lng, name };
            return (
              <CardRow
                key={hit.ref}
                lead={<ServiceDisc category={card.category} />}
                title={<bdi title={name}>{name}</bdi>}
                facts={<HitFacts hit={hit} />}
                onActivate={() => map.showPoint(point)}
                onHover={(on) => map.hoverPoint(on ? point : null)}
              />
            );
          })}
        </CardRows>
      )}
      <CardMore count={card.more} labelKey="assistant.card.roadtrip.corridor.more" target={target} />
      {card.partial && (
        <div className="mt-2">
          <TourNotice tone="warning" role="status">
            {t('assistant.card.roadtrip.corridor.partial', { count: card.searched.total, done: card.searched.done })}
          </TourNotice>
        </div>
      )}
    </CardFrame>
  );
}

/** The corridor searches of one answer, one card each. */
export default function CorridorCard({ cards }: { cards: readonly CardEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      {cards.map(({ toolCallId, card }) =>
        card.kind === 'corridor' ? <CorridorCardView key={toolCallId} card={card} /> : null
      )}
    </div>
  );
}
