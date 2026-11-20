import type { TravelPlanDraft, TravelPlanDraftDay } from '@trek/shared';
import { Car, Footprints, Navigation } from 'lucide-react';
import React, { useMemo } from 'react';
import { OFM_BRIGHT, OFM_DARK } from '../../constants/mapDefaults';
import { useIsDark } from '../../hooks/useIsDark';
import { useTileUrl } from '../../hooks/useTileUrl';
import { useTranslation } from '../../i18n';
import { isInstalledApp } from '../../utils/resumeRoute';
import { dayColor } from '../Map/dawarichTrail';
import { MapViewAuto } from '../Map/MapViewAuto';
import type { MapPlace } from '../Map/mapViewContract';
import { dayNavigationUrl, placeNavigationUrl, type DraftTravelMode } from './draftNavigation';
import { useDraftRoadRoutes } from './useDraftRoadRoutes';

interface TravelDraftMapProps {
  draft: TravelPlanDraft | null;
  /** Drive or walk, shared with the timeline so both surfaces agree. */
  navMode: DraftTravelMode;
  onNavModeChange: (mode: DraftTravelMode) => void;
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
 * Every stop in the order the timeline lists it, plus the number it carries
 * inside its own day. The ids are the pin's position, not a database id: a
 * draft has no places yet.
 */
function draftMarkers(days: TravelPlanDraftDay[]): {
  places: MapPlace[];
  dayOrderMap: Record<number, number[]>;
} {
  const places: MapPlace[] = [];
  const dayOrderMap: Record<number, number[]> = {};
  for (const day of days) {
    for (const [index, item] of day.items.entries()) {
      const id = places.length + 1;
      places.push({
        id,
        name: item.place.name,
        lat: item.place.lat,
        lng: item.place.lng,
      });
      dayOrderMap[id] = [index + 1];
    }
  }
  return { places, dayOrderMap };
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
export default function TravelDraftMap({
  draft,
  navMode,
  onNavModeChange,
}: TravelDraftMapProps): React.ReactElement | null {
  const { t } = useTranslation();
  const dark = useIsDark();
  const tileUrl = useTileUrl(dark ? OFM_DARK : OFM_BRIGHT);
  const days = draft?.days ?? NO_DAYS;
  const { places, dayOrderMap } = useMemo(() => draftMarkers(days), [days]);
  // Marker ids follow the same flattening, so a pin opens the stop it stands for.
  const items = useMemo(() => days.flatMap((day) => day.items), [days]);
  const { lines: route, lineDays, sketchOnly } = useDraftRoadRoutes(days);
  // One hue per day, matching the legend below the map; the dark casing keeps
  // neighbouring days readable where their roads overlap.
  const routeColors = useMemo(
    () => route.map((_, index) => ({ line: dayColor(lineDays[index] ?? 0), casing: '#0F172A' })),
    [route, lineDays]
  );
  const focusPoints = useMemo(() => framePoints(places), [places]);
  // Coordinates are in the key: the engine fits again when a revision moves a
  // stop, while a rerender with the same proposal leaves the camera alone.
  const focusKey = useMemo(() => places.map((place) => `${place.id}:${place.lat},${place.lng}`).join('|'), [places]);

  // A pin is a stop, so tapping it hands that stop to the maps app in the mode
  // the legend is set to — the same link the timeline offers under the stop.
  const openMarker = (id: number): void => {
    const item = items[id - 1];
    if (!item) return;
    const url = placeNavigationUrl(item.place, navMode);
    if (isInstalledApp()) window.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

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
          dayOrderMap={dayOrderMap}
          route={route.length > 0 ? route : null}
          routeColors={routeColors.length > 0 ? routeColors : undefined}
          tileUrl={tileUrl}
          focusPoints={focusPoints}
          focusKey={focusKey}
          onMarkerClick={openMarker}
        />
      </div>
      {days.some((day) => day.items.length > 1) ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-edge-faint px-4 py-2.5 sm:px-5">
          <div role="group" className="inline-flex items-center gap-0.5 rounded-full border border-edge p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onNavModeChange('drive')}
              aria-pressed={navMode === 'drive'}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                navMode === 'drive'
                  ? 'bg-surface-secondary font-medium text-content'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              <Car size={11} />
              {t('planner.ai.travelMode.drive')}
            </button>
            <button
              type="button"
              onClick={() => onNavModeChange('walk')}
              aria-pressed={navMode === 'walk'}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                navMode === 'walk'
                  ? 'bg-surface-secondary font-medium text-content'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              <Footprints size={11} />
              {t('planner.ai.travelMode.walk')}
            </button>
          </div>
          {days.map((day, dayIndex) => {
            const navigationUrl = dayNavigationUrl(day.items, navMode);
            if (!navigationUrl) return null;
            return (
              <span
                key={day.date}
                className="inline-flex items-center gap-1.5 rounded-full border border-edge px-2 py-1 text-xs"
              >
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: dayColor(dayIndex) }} />
                <span className="text-content-secondary">{t('planner.dayN', { n: dayIndex + 1 })}</span>
                <a
                  href={navigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  <Navigation size={11} />
                  {t('planner.ai.startNavigation')}
                </a>
              </span>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
