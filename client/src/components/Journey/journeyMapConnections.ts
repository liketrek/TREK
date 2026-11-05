import type { JourneyTrack } from '@trek/shared';
import { isPlannedTrack, type JourneyMapLayerVisibility } from './journeyMapLayers';

/** A point of the line between entries, `[lat, lng]`. */
type LatLng = [number, number];

/** An entry pin as the connection sees it: where it stands and on which day. */
interface ConnectionStop {
  lat: number;
  lng: number;
  /** `YYYY-MM-DD`; a longer ISO string is read by its date. */
  date: string;
}

/**
 * The faint line between the entries, cut where the map already shows how the
 * traveller got from one to the next.
 *
 * `open` is every stretch nothing else on the map accounts for, so the
 * straight line is the best guess there is. `covered` is every stretch whose
 * days were all recorded: the recorded line is the real way, and a straight
 * one across it only gets in its way (#2888). It is still handed back, so a
 * reader who hides what was recorded gets the guess back for those stretches.
 */
interface EntryConnections {
  open: LatLng[][];
  covered: LatLng[][];
}

const DAY_MS = 86_400_000;

function dayNumber(date: string): number | null {
  const time = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(time) ? null : Math.round(time / DAY_MS);
}

/** The days a recorded line with points stands for; a trip's GPX is the plan and stands for none. */
function recordedDays(tracks: readonly JourneyTrack[]): Set<number> {
  const days = new Set<number>();
  for (const track of tracks) {
    if (isPlannedTrack(track) || !track.date || track.points.length < 2) continue;
    const day = dayNumber(track.date);
    if (day !== null) days.add(day);
  }
  return days;
}

/**
 * Whether the way between two stops is on the map already: every day from the
 * first stop's to the second's was recorded, the night between two recorded
 * days included. One day in between without a recording leaves it open.
 */
function travelled(from: string, to: string, recorded: ReadonlySet<number>): boolean {
  const a = dayNumber(from);
  const b = dayNumber(to);
  if (a === null || b === null) return false;
  const first = Math.min(a, b);
  const last = Math.max(a, b);
  if (last - first + 1 > recorded.size) return false;
  for (let day = first; day <= last; day++) {
    if (!recorded.has(day)) return false;
  }
  return true;
}

/**
 * Splits the line through the stops, taken in the order given (the pins'
 * order on the map), into the stretches still open and those a recording
 * covers. Neighbouring stretches of the same kind stay one line.
 */
export function entryConnections(stops: readonly ConnectionStop[], tracks: readonly JourneyTrack[]): EntryConnections {
  const result: EntryConnections = { open: [], covered: [] };
  const recorded = recordedDays(tracks);
  let line: LatLng[] | null = null;
  let lineCovered = false;
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    const covered = travelled(from.date, to.date, recorded);
    if (!line || covered !== lineCovered) {
      line = [[from.lat, from.lng]];
      (covered ? result.covered : result.open).push(line);
      lineCovered = covered;
    }
    line.push([to.lat, to.lng]);
  }
  return result;
}

/** The covered stretches stand in for the recording only while the pins are shown and the recording is not. */
export function coveredConnectionsShown(visibility: JourneyMapLayerVisibility): boolean {
  return visibility.entries && !visibility.recorded;
}
