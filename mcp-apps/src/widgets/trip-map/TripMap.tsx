import { tripMapOutputSchema, type TripMapPlace } from '@trek/shared/mcp-apps';
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from 'react';
import type { Translate } from '../../lib/i18n';
import { fitView, screenPoint, visibleTiles, zoomBy, type MapView } from './mapModel';
import './trip-map.css';

/** How many further pages the view reads on its own: 2,000 places at the default page size. */
const MAX_EXTRA_PAGES = 9;
/** The box the map assumes before the frame has a size, as an inline view does on its first paint. */
const FALLBACK_SIZE = { width: 600, height: 320 };

export interface TripMapProps {
  data: unknown;
  locale: string;
  t: Translate;
  /** Reads the page of places starting at offset through the host. */
  loadPage: (offset: number) => Promise<unknown>;
  /** Tells the assistant which place the user picked. */
  onSelect: (place: TripMapPlace) => void;
  /** Asks the host for the whole screen; resolves whether it gave it. */
  onExpand: () => Promise<boolean>;
}

/** The size of the map box, measured again when it goes full screen and on every window resize (a host resizes the frame). */
function useBoxSize(full: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(FALLBACK_SIZE);
  useEffect(() => {
    const measure = () => {
      const box = ref.current;
      if (box && box.clientWidth > 0 && box.clientHeight > 0) {
        setSize({ width: box.clientWidth, height: box.clientHeight });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [full]);
  return { ref, ...size };
}

/** The pages after the first, read once through the host; what failed stays out, the first page still shows. */
function useRemainingPages(first: number | null, loadPage: (offset: number) => Promise<unknown>) {
  const [more, setMore] = useState<TripMapPlace[]>([]);
  const read = useEffectEvent((offset: number) => loadPage(offset));
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let next = first;
      for (let page = 0; next !== null && page < MAX_EXTRA_PAGES && !cancelled; page += 1) {
        const parsed = tripMapOutputSchema.safeParse(await read(next).catch(() => null));
        if (!parsed.success || cancelled) return;
        const places = parsed.data.places;
        setMore((previous) => [...previous, ...places]);
        next = parsed.data.next_offset;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [first]);
  return more;
}

/**
 * get_trip_map's places on raster tiles, drawn as plain images: no WebGL and
 * no worker, so it runs in any host's sandbox with the tile host as its only
 * extra origin. Drag to pan, buttons to zoom, a marker to tell the assistant
 * which place is meant.
 */
export function TripMap({ data, locale, t, loadPage, onSelect, onExpand }: TripMapProps) {
  const parsed = tripMapOutputSchema.safeParse(data);
  const [full, setFull] = useState(false);
  const box = useBoxSize(full);
  const more = useRemainingPages(parsed.success ? parsed.data.next_offset : null, loadPage);
  const [view, setView] = useState<MapView | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { tiles, place_count } = parsed.data;
  const places = [...parsed.data.places, ...more];
  const current = view ?? fitView(places, box.width, box.height, tiles.max_zoom);
  const number = new Intl.NumberFormat(locale);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    drag.current = { x: event.clientX, y: event.clientY };
    setView({ ...current, cx: current.cx - (event.clientX - start.x), cy: current.cy - (event.clientY - start.y) });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <section className="trek-widget" aria-labelledby="map-title">
      <header className="trek-header">
        <div className="trek-header__text">
          <h1 id="map-title" className="trek-header__title">
            {t('mcpApps.map.title')}
          </h1>
          <p className="trek-muted trek-header__subtitle">
            {t('mcpApps.map.count')}: {number.format(place_count)}
          </p>
        </div>
        {full ? null : (
          <button type="button" className="trek-button trek-hit" onClick={() => void onExpand().then(setFull)}>
            {t('mcpApps.map.fullscreen')}
          </button>
        )}
      </header>
      {places.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.map.empty')}</p>
      ) : (
        <div
          ref={box.ref}
          className={full ? 'map__box map__box--full' : 'map__box'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {visibleTiles(current, box.width, box.height, tiles.url).map((tile) => (
            <img
              key={tile.key}
              className="map__tile"
              src={tile.url}
              alt=""
              draggable={false}
              style={{ transform: `translate(${tile.left}px, ${tile.top}px)` }}
            />
          ))}
          {places.map((place) => {
            const at = screenPoint(place, current, box.width, box.height);
            return (
              <button
                key={place.id}
                type="button"
                aria-label={place.name}
                aria-pressed={selected === place.id}
                className="map__marker"
                style={{ transform: `translate(${at.left}px, ${at.top}px)` }}
                onClick={() => {
                  setSelected(place.id);
                  onSelect(place);
                }}
              />
            );
          })}
          <div className="map__zoom">
            <button
              type="button"
              className="trek-button trek-hit"
              aria-label={t('mcpApps.map.zoomIn')}
              onClick={() => setView(zoomBy(current, 1, tiles.max_zoom))}
            >
              +
            </button>
            <button
              type="button"
              className="trek-button trek-hit"
              aria-label={t('mcpApps.map.zoomOut')}
              onClick={() => setView(zoomBy(current, -1, tiles.max_zoom))}
            >
              −
            </button>
          </div>
          <p className="map__credit">{tiles.attribution}</p>
        </div>
      )}
      {selected !== null ? (
        <p className="trek-muted" aria-live="polite">
          {places.find((place) => place.id === selected)?.name}
        </p>
      ) : null}
    </section>
  );
}
