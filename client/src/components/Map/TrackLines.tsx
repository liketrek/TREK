import { memo, type RefObject } from 'react';
import { Polyline } from 'react-leaflet';
import type { Place } from '../../types';
import { TRACK_CASING_COLOR } from './trackColors';

/** A place's track as the Leaflet map draws it: its points, its colour, and whether it carries a rim. */
export interface TrackLine {
  place: Place;
  coords: [number, number][];
  cased: boolean;
  color: string;
}

interface TrackLinesProps {
  tracks: readonly TrackLine[];
  /** The pane the rims go into, below the lines; none while the map has not made it yet. */
  casingPane?: string;
  /** Read on click, so a new selection handler never redraws every track. */
  selectRef: RefObject<(placeId: number) => void>;
}

/**
 * Every track of the map: the rims, the lines and an invisible fat line on top
 * that takes the click. Memoised on the tracks alone; a selection changes
 * nothing here, the picked track is drawn by {@link SelectedTrackLine}.
 */
export const TrackLines = memo(function TrackLines({ tracks, casingPane, selectRef }: TrackLinesProps) {
  return (
    <>
      {/* Casings live in their own pane below the lines. Leaflet stacks paths by
          insertion order, so drawing them inline would put the casing of a track
          added later — or of one just given a colour — on top of an earlier
          track's line. Always rendered, hidden via opacity when there is no
          colour, so toggling one never remounts the path. */}
      {tracks.map(({ place, coords, cased }) => (
        <Polyline
          key={`gpx-${place.id}-casing`}
          positions={coords}
          pane={casingPane}
          pathOptions={{
            color: TRACK_CASING_COLOR,
            weight: 6.5,
            opacity: cased ? 0.7 : 0,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      ))}
      {/* pathOptions, not bare color/weight props: react-leaflet only calls
          setStyle when the pathOptions reference changes, so bare props would
          stick at their mount-time colour and a repaint would never arrive. */}
      {tracks.map(({ place, coords, cased, color }) => (
        <Polyline
          key={`gpx-${place.id}`}
          positions={coords}
          pathOptions={{ color, weight: 3.5, opacity: cased ? 0.9 : 0.75 }}
          interactive={false}
        />
      ))}
      {/* Invisible fat line on top so the track can actually be hit — 3.5px is
          not a target, least of all on touch, and the start markers cluster below
          zoom 11. bubblingMouseEvents is essential: paths bubble to the map by
          default (markers do not), and the map's own click handler clears the
          selection this one just made. */}
      {tracks.map(({ place, coords }) => (
        <Polyline
          key={`gpx-${place.id}-hit`}
          positions={coords}
          pathOptions={{ color: TRACK_CASING_COLOR, weight: 14, opacity: 0, lineCap: 'round', lineJoin: 'round' }}
          bubblingMouseEvents={false}
          eventHandlers={{ click: () => selectRef.current?.(place.id) }}
        />
      ))}
    </>
  );
});

/**
 * PR1-08: the track of the picked tour, wider and with a light rim on top of
 * the others, so the line and the list's row read as one. It takes no click:
 * the hit line below still does.
 */
export function SelectedTrackLine({
  tracks,
  selectedPlaceId,
}: {
  tracks: readonly TrackLine[];
  selectedPlaceId: number | null;
}) {
  const track = selectedPlaceId == null ? null : tracks.find((item) => item.place.id === selectedPlaceId);
  if (!track) return null;
  return (
    <>
      <Polyline
        key={`gpx-selected-${track.place.id}-casing`}
        positions={track.coords}
        pathOptions={{ color: TRACK_CASING_COLOR, weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
        interactive={false}
      />
      <Polyline
        key={`gpx-selected-${track.place.id}`}
        positions={track.coords}
        pathOptions={{ color: track.color, weight: 5.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
        interactive={false}
      />
    </>
  );
}
