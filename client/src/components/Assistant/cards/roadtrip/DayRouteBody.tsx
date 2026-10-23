import type { DayRouteCard } from '@trek/shared';
import { MapPinPlus, Spline, Waypoints } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import { TourNotice } from '../../../Tours/tourParts';
import type { ChangeItem } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import { CardFacts, Fact } from '../parts/CardFacts';
import RouteSketch from '../parts/RouteSketch';
import { dayRouteSketch } from './roadtripCardModel';
import { useRoadtripCardMap } from './useRoadtripCardMap';

/**
 * What a change does to a day's drive, under its change row: the day's stops
 * joined by straight dashed lines, the stops it adds and the via points it
 * sends the drive through, moves, takes out or pins again, marked as the map
 * marks them. Straight on purpose, and it says so: TREK works out the road
 * once the change is applied. Waiting, the new marks are dashed; applied,
 * solid; discarded or expired, the whole sketch fades.
 */
export default function DayRouteBody({ card, item }: { card: DayRouteCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const map = useRoadtripCardMap();
  const pending = item.state === 'pending' || item.state === 'applying';
  const settled = item.state === 'discarded' || item.state === 'expired' || item.state === 'failed';
  const { lines, marks } = dayRouteSketch(card, pending);
  const points = [...card.stops, ...card.vias].map((spot): [number, number] => [spot.lat, spot.lng]);
  const added = card.stops.filter((stop) => stop.added);
  const vias = card.vias.filter((via) => via.state !== 'removed').length;
  const removed = card.vias.length - vias;
  return (
    <div className={`mt-1.5 flex flex-col gap-1.5 ${settled ? 'opacity-50' : ''}`}>
      <RouteSketch
        lines={lines}
        marks={marks}
        height={variant === 'fullscreen' ? 128 : 96}
        ariaLabel={t('assistant.card.roadtrip.sketch')}
        onActivate={points.length > 0 ? () => map.showPoints(points) : undefined}
      />
      <CardFacts>
        {vias > 0 && <Fact icon={Waypoints} label={t('assistant.card.roadtrip.dayRoute.vias', { count: vias })} />}
        {removed > 0 && (
          <SoftPill tone="danger">{t('assistant.card.roadtrip.dayRoute.removed', { count: removed })}</SoftPill>
        )}
        {card.afterName && (
          <SoftPill className="max-w-full">
            <bdi className="truncate">{t('assistant.card.roadtrip.dayRoute.after', { name: card.afterName })}</bdi>
          </SoftPill>
        )}
        {card.track && (
          <Fact icon={Spline} label={t('assistant.card.roadtrip.dayRoute.follows', { name: card.track })} />
        )}
        {added.length > 0 && (
          <Fact icon={MapPinPlus} label={t('assistant.card.roadtrip.dayRoute.newStops', { count: added.length })} />
        )}
      </CardFacts>
      {added.length > 0 && (
        <span className="flex flex-wrap items-center gap-1">
          {added.map((stop, index) => (
            <SoftPill key={`${stop.name}:${index}`} tone={pending ? 'success' : 'neutral'} className="max-w-full">
              <span className="tabular-nums text-content-faint">{index + 1}</span>
              <bdi className="truncate">{stop.name}</bdi>
            </SoftPill>
          ))}
        </span>
      )}
      {card.unresolved.length > 0 && (
        <TourNotice tone="warning">
          <span className="block">
            {t('assistant.card.roadtrip.dayRoute.unresolved', { count: card.unresolved.length })}
          </span>
          <bdi className="block">{card.unresolved.join(', ')}</bdi>
        </TourNotice>
      )}
      <p className="m-0 text-caption text-content-faint">{t('assistant.card.roadtrip.dayRoute.sketch')}</p>
    </div>
  );
}
