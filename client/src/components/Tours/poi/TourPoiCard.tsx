import type { TourPoi, WalkTheme } from '@trek/shared';
import { WALK_THEMES } from '@trek/shared';
import { Clock, ExternalLink, MoveHorizontal, Route, Star, X } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import { formatDistance } from '../../../utils/units';
import { MAP_CARD_GLASS } from '../../Map/mapControlShadow';
import { TOUR_POI_LOOKS } from '../../Map/poiCategories';
import { useMapCardDismiss } from '../../Map/useMapCardDismiss';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { TourPoiChargingFacts } from './TourPoiChargingFacts';
import { TourPoiSlotPicker } from './TourPoiSlotPicker';
import { usePoiInsertion } from './usePoiInsertion';
import { useSelectedPoi } from './useTourPoiSearch';

type Unit = Parameters<typeof formatDistance>[1];

const km = (metres: number) => metres / 1000;

/** What the source says about the place: its address, its opening hours as written, and its website. */
function PoiFacts({ poi }: { poi: TourPoi }) {
  const { t } = useTranslation();
  if (!poi.address && !poi.opening_hours && !poi.website) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {poi.address && (
        <p className="m-0 break-words text-content-secondary" style={fs(11.5, 'body')}>
          {poi.address}
        </p>
      )}
      {poi.opening_hours && (
        <p className="m-0 flex items-start gap-1.5 text-content-secondary" style={fs(11.5, 'body')}>
          <Clock size={12} strokeWidth={2.2} className="mt-0.5 flex-none text-content-faint" />
          <span className="min-w-0 break-words" title={t('tours.poi.hoursHint')}>
            {poi.opening_hours}
          </span>
        </p>
      )}
      {poi.website && (
        <a
          href={poi.website}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-start text-content-secondary underline-offset-2 hover:underline"
          style={fs(11.5, 'body')}
        >
          <ExternalLink size={12} strokeWidth={2.2} />
          {t('tours.poi.website')}
        </a>
      )}
    </div>
  );
}

/**
 * PLN-02/PLN-03: a place found along the tour, picked on the map or in the
 * list, in the look of the other cards over the planner map: what it is, how
 * far from the route and how far along it, why a city walk's theme suggested
 * it, where the data comes from, and the way to take it in as a stop.
 */
function TourPoiCard({
  poi,
  theme,
  planner,
  insertion,
  unit,
  onClose,
  width,
}: {
  poi: TourPoi;
  theme: WalkTheme | null;
  planner: TourPlannerController;
  insertion: ReturnType<typeof usePoiInsertion>;
  unit: Unit;
  onClose: () => void;
  width?: number;
}) {
  const { t } = useTranslation();
  const look = TOUR_POI_LOOKS[poi.category];
  const kind = t(look.labelKey);
  const suggested = theme && (WALK_THEMES[theme] as readonly string[]).includes(poi.category) ? theme : null;
  return (
    <article
      className={`max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl p-3 text-content ${width ? '' : 'w-[min(20rem,calc(100vw_-_2rem))]'}`}
      style={{ ...MAP_CARD_GLASS, width }}
      data-testid="tour-poi-card-map"
    >
      <div className="flex items-start gap-2">
        {/* The category's own map colour, as its pin on the map has it: a light wash, the icon in full. */}
        <span
          className="grid h-7 w-7 flex-none place-items-center rounded-full"
          style={{ background: `color-mix(in srgb, ${look.color} 16%, transparent)`, color: look.color }}
        >
          <look.Icon size={14} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-semibold" style={fs(14, 'body')} title={poi.name || kind}>
            {poi.name || kind}
          </h3>
          {(poi.name || poi.highlight) && (
            <div className="flex min-w-0 items-center gap-1.5">
              {poi.name && <p className="min-w-0 truncate text-caption text-content-muted">{kind}</p>}
              {/* One of the best known places along the route, as the star in the list marks it. */}
              {poi.highlight && (
                <span className="flex-none" title={t('tours.poi.highlightHint')} data-testid="tour-poi-highlight-badge">
                  <SoftPill
                    tone="warning"
                    icon={<Star size={10} strokeWidth={2.2} fill="currentColor" aria-hidden="true" />}
                  >
                    {t('tours.poi.highlight')}
                  </SoftPill>
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex-none rounded-lg p-1 text-content-muted hover:bg-surface-hover hover:text-content"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <WhiteBadge icon={<MoveHorizontal size={10} strokeWidth={2.2} className="text-content-faint" />}>
          {t('tours.poi.fromRoute', { distance: formatDistance(km(poi.distance_m), unit) })}
        </WhiteBadge>
        <WhiteBadge icon={<Route size={10} strokeWidth={2.2} className="text-content-faint" />}>
          {t('tours.poi.along', { distance: formatDistance(km(poi.along_m), unit) })}
        </WhiteBadge>
      </div>
      <PoiFacts poi={poi} />
      {poi.charging && <TourPoiChargingFacts charging={poi.charging} />}
      <TourPoiSlotPicker planner={planner} poi={poi} insertion={insertion} unit={unit} />
      <p className="mt-2 flex flex-wrap gap-x-3 text-content-faint" style={fs(10.5, 'body')}>
        {suggested && <span>{t('tours.walk.themeReason', { theme: t(`tours.walk.theme.${suggested}`) })}</span>}
        <span>{t(poi.source === 'trek-places' ? 'tours.poi.source.trek' : 'tours.poi.source.osm')}</span>
      </p>
    </article>
  );
}

/**
 * The chosen place's card over the planner map, where a via ferrata's or a
 * paddle object's card sits and closing as those do: on a press outside it
 * and on Escape, the press handed on so the map leaves its click alone. The
 * choice lives in the places store, so a pin on the map and a row in the list
 * open the same card.
 */
export default function TourPoiOverlay({
  planner,
  onOutsidePress,
  insetEnd,
  bottom,
  width,
}: {
  planner: TourPlannerController;
  onOutsidePress?: () => void;
  insetEnd: number;
  bottom: number;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const poi = useSelectedPoi();
  const theme = useTourPoiStore((state) => state.theme);
  const select = useTourPoiStore((state) => state.select);
  const insertion = usePoiInsertion(planner);
  const close = useCallback(() => select(null), [select]);
  useMapCardDismiss(ref, !!poi, close, onOutsidePress);

  if (!poi) return null;
  return (
    <div
      ref={ref}
      className="absolute z-[20] flex justify-end transition-[bottom] duration-200 ease-out"
      style={{ insetInlineEnd: insetEnd, bottom, maxWidth: `calc(100% - ${insetEnd + 32}px)` }}
      data-testid="tour-poi-overlay"
    >
      <TourPoiCard
        poi={poi}
        theme={theme}
        planner={planner}
        insertion={insertion}
        unit={unit}
        onClose={close}
        width={width}
      />
    </div>
  );
}
