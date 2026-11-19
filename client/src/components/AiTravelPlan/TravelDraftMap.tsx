import type { TravelPlanDraft, TravelPlanDraftDay } from '@trek/shared';
import React, { useMemo } from 'react';
import { OFM_BRIGHT, OFM_DARK } from '../../constants/mapDefaults';
import { useIsDark } from '../../hooks/useIsDark';
import { useTileUrl } from '../../hooks/useTileUrl';
import { useTranslation } from '../../i18n';
import { MapViewAuto } from '../Map/MapViewAuto';
import type { MapPlace } from '../Map/mapViewContract';
import { useDraftRoadRoutes } from './useDraftRoadRoutes';

interface TravelDraftMapProps {
  draft: TravelPlanDraft | null;
}

/** A stable empty list, so a proposal with no draft keeps the memos below still. */
const NO_DAYS: TravelPlanDraftDay[] = [];

/**
 * Half the side of the square framed around a lone stop, in degrees: about 11 km
 * from north to south, so a one-stop proposal opens on its town rather than on
 * the street the closest fit would zoom to.
 */
const LONE_PLACE_SPAN = 0.05;

/**
 * Every stop in the order the timeline lists it. The ids are the pin's position,
 * not a database id: a draft has no places yet.
 */
function draftPlaces(days: TravelPlanDraftDay[]): MapPlace[] {
  const places: MapPlace[] = [];
  for (const day of days) {
    for (const item of day.items) {
      places.push({
        id: places.length + 1,
        name: item.place.name,
        lat: item.place.lat,
        lng: item.place.lng,
      });
    }
  }
  return places;
}

/** The coordinates the map frames; a lone stop (or several on one spot) gets a small square. */
function framePoints(places: MapPlace[]): [number, number][] {
  const points = places.flatMap((place) =>
    typeof place.lat === 'number' && typeof place.lng === 'number' ? [[place.lat, place.lng] as [number, number]] : []
  );
  if (points.length === 0) return points;
  const [lat, lng] = points[0];
  if (points.some(([a, b]) => a !== lat || b !== lng)) return points;
  return [
    [Math.max(-90, lat - LONE_PLACE_SPAN), lng - LONE_PLACE_SPAN],
    [Math.min(90, lat + LONE_PLACE_SPAN), lng + LONE_PLACE_SPAN],
  ];
}

/**
 * The proposal on a map: the same stops, in the same order, as the timeline
 * below. Read-only — a draft has no place rows yet, so no marker opens anything
 * and nothing can be dragged. Reuses the trip map stack rather than a second
 * map engine, and draws nothing at all when the proposal has no stops.
 */
export default function TravelDraftMap({ draft }: TravelDraftMapProps): React.ReactElement | null {
  const { t } = useTranslation();
  const dark = useIsDark();
  const tileUrl = useTileUrl(dark ? OFM_DARK : OFM_BRIGHT);
  const days = draft?.days ?? NO_DAYS;
  const places = useMemo(() => draftPlaces(days), [days]);
  const { lines: route, sketchOnly } = useDraftRoadRoutes(days);
  const focusPoints = useMemo(() => framePoints(places), [places]);
  // Coordinates are in the key: the engine fits again when a revision moves a
  // stop, while a rerender with the same proposal leaves the camera alone.
  const focusKey = useMemo(() => places.map((place) => `${place.id}:${place.lat},${place.lng}`).join('|'), [places]);

  if (places.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-edge bg-surface-card shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-edge-faint px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-content">{t('planner.ai.mapTitle')}</h2>
        {sketchOnly ? <span className="text-xs text-content-muted">{t('planner.ai.mapNote')}</span> : null}
      </header>
      <div className="h-64 w-full [--bottom-nav-h:0px] sm:h-80">
        <MapViewAuto
          places={places}
          route={route.length > 0 ? route : null}
          tileUrl={tileUrl}
          focusPoints={focusPoints}
          focusKey={focusKey}
        />
      </div>
    </section>
  );
}
