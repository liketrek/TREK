import type { JourneyMapPlace } from '@trek/shared';
import { useCallback, useState, type ComponentProps, type Ref } from 'react';
import { MAP_ROUND_CONTROL_SIZE, MapLayerSwitcher, type BaseLayer } from '../Map/MapLayerSwitcher';
import JourneyMap, { type JourneyMapHandle } from './JourneyMap';
import JourneyMapAuto from './JourneyMapAuto';
import JourneyMapLayerControl from './JourneyMapLayerControl';
import JourneyMapPickCard from './JourneyMapPickCard';
import type { JourneyMapMark } from './journeyMapMarks';
import type { JourneyMapLayersView } from './useJourneyMapLayers';

type MapProps = Omit<
  ComponentProps<typeof JourneyMapAuto>,
  'ref' | 'layerVisibility' | 'marks' | 'onMarksPick' | 'plannedEntryIds' | 'baseLayer'
> & {
  /** CARTO key of a shared page, which the Leaflet renderer reads; see JourneyMap. */
  cartoApiKey?: string;
};

interface Props extends MapProps {
  ref?: Ref<JourneyMapHandle>;
  /** The layers of this map; without them it draws as it always did. */
  layers?: JourneyMapLayersView | null;
  /** A shared page and the phone timeline draw with Leaflet whatever a setting says. */
  engine?: 'auto' | 'leaflet';
  /** No layer switches: the phone keeps its map clear and shows every layer (the picked card still opens). */
  hideLayerControl?: boolean;
  /** How far from the map's top the switches sit, clear of a bar laid over the map. */
  controlsTop?: number | string;
  /** Leads from a picked place or stay to its entry. */
  onOpenEntry?: (entryId: string) => void;
  entryTitleOf?: (entryId: number) => string | null;
  /** Starts an entry about a picked planned place nothing was written about; absent for a reader who cannot. */
  onWriteAboutPlace?: (place: JourneyMapPlace) => void;
}

/** The gap between the switcher in the top corner and the column of controls beside it. */
const CORNER_GAP = 8;

/** A card action, only where the screen offers one. */
function offeredIf<T>(offered: unknown, action: T): T | undefined {
  return offered ? action : undefined;
}

/**
 * A journey map with its layers (JRN-04): the renderer, the reader's layer
 * switches and the card of a picked plan place or stay. Every journey map
 * surface draws through here, the desktop aside, the phone screens and the
 * shared page, so the layers mean the same everywhere. A switched-off layer
 * is hidden in place: the map is not rebuilt and keeps its view.
 *
 * The satellite switch sits in the top corner on every one of them, the phone
 * included (#2594): it is what a visitor of a shared hike reads the route by.
 * It belongs to this view alone and opens on the map, so nobody's own setting
 * is read or written, which a shared page could not do anyway.
 */
export default function JourneyLayeredMap({
  ref,
  layers,
  engine = 'auto',
  hideLayerControl = false,
  controlsTop = 12,
  onOpenEntry,
  entryTitleOf,
  onWriteAboutPlace,
  photos,
  tracks,
  height = 220,
  ...rest
}: Props) {
  const [picked, setPicked] = useState<{ marks: JourneyMapMark[]; key: string } | null>(null);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('default');
  const toggleBaseLayer = useCallback(() => setBaseLayer((was) => (was === 'satellite' ? 'default' : 'satellite')), []);
  const visibility = layers?.visibility;
  const onMarksPick = useCallback((marks: JourneyMapMark[]) => {
    setPicked({ marks, key: marks.map((m) => m.key).join(',') });
  }, []);
  const close = useCallback(() => setPicked(null), []);
  const writeAbout = useCallback(
    (place: JourneyMapPlace) => {
      setPicked(null);
      onWriteAboutPlace?.(place);
    },
    [onWriteAboutPlace]
  );
  const openEntry = useCallback(
    (entryId: string) => {
      setPicked(null);
      onOpenEntry?.(entryId);
    },
    [onOpenEntry]
  );

  // A pick whose marks a switch took off the map closes with them.
  const shownKeys = new Set(layers?.marks.map((m) => m.key));
  const card = picked && picked.marks.every((m) => shownKeys.has(m.key)) ? picked : null;

  const mapProps = {
    ...rest,
    height,
    photos: !visibility || visibility.photos ? photos : undefined,
    tracks: layers ? layers.tracks : tracks,
    layerVisibility: visibility,
    marks: layers?.marks,
    onMarksPick,
    plannedEntryIds: layers?.plannedEntryIds,
    baseLayer,
  };

  return (
    <div className="relative w-full" style={{ height: height === 9999 ? '100%' : height }}>
      <div className="isolate h-full w-full">
        {engine === 'leaflet' ? <JourneyMap ref={ref} {...mapProps} /> : <JourneyMapAuto ref={ref} {...mapProps} />}
      </div>
      <div className="pointer-events-auto absolute end-3 z-10" style={{ top: controlsTop }}>
        <MapLayerSwitcher active={baseLayer} onToggle={toggleBaseLayer} tooltipPlacement="bottom" />
      </div>
      {layers && (
        <div
          className="pointer-events-none absolute inset-x-3 z-10 flex flex-col items-start gap-2"
          // Ends before the corner switcher, so a wide row of switches scrolls
          // rather than running under it.
          style={{ top: controlsTop, paddingInlineEnd: MAP_ROUND_CONTROL_SIZE + CORNER_GAP }}
        >
          {!hideLayerControl && (
            <div className="pointer-events-auto max-w-full">
              <JourneyMapLayerControl layers={layers} />
            </div>
          )}
          {card && (
            <JourneyMapPickCard
              key={card.key}
              marks={card.marks}
              onClose={close}
              onOpenEntry={onOpenEntry ? openEntry : undefined}
              onWriteAbout={offeredIf(onWriteAboutPlace, writeAbout)}
              entryTitleOf={entryTitleOf}
            />
          )}
        </div>
      )}
    </div>
  );
}
