import { ADDON_IDS } from '../../addons';
import { McpController, TOOL_ANNOTATIONS_READONLY, Tool, errorResult, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyDomainService } from './journey-domain.service';
import { routeDistance, thinRoute } from './journey-stats';
import { idSchema, type JourneyTrack } from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

/** Points one track keeps at most: enough for its shape on a small map. */
const TRACK_DISPLAY_POINTS = 200;

/**
 * Points all tracks of an answer keep together, so a journey of many trips
 * does not grow the answer by a full line per track. Each track keeps its two
 * ends whatever the share.
 */
const TRACKS_DISPLAY_POINTS = 1000;

/** How many points each of `count` tracks keeps: an even share of the total, between 2 and the per-track cap. */
function pointsPerTrack(count: number): number {
  return Math.max(2, Math.min(TRACK_DISPLAY_POINTS, Math.floor(TRACKS_DISPLAY_POINTS / Math.max(1, count))));
}

/** A coordinate to five decimals, about a metre: finer than any drawn line shows. */
function coordinate(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

/**
 * One track as the tool answers it: what the model reasons with (which trip
 * and place it belongs to, its name and kind, how long it is) and, under
 * `display_geometry`, the line thinned for an MCP client that draws it. No
 * card in TREK's own assistant draws it: the assistant drops every key that
 * names a geometry before the answer reaches the provider, so there the
 * points cost the model nothing.
 */
function trackSummary(track: JourneyTrack, points: number) {
  const distance = routeDistance(track.points.map(([lat, lng]) => ({ lat, lng })));
  return {
    place_id: track.place_id,
    trip_id: track.trip_id,
    name: track.name,
    // Absent means a trip's GPX, all GET :id/tracks has ever answered.
    kind: track.kind ?? 'trip_gpx',
    color: track.color,
    point_count: track.points.length,
    distance_km: Math.round(distance / 100) / 10,
    display_geometry: thinRoute(track.points, points).map(([lat, lng]) => [coordinate(lat), coordinate(lng)]),
  };
}

/**
 * The GPX tracks drawn on a journey's map over MCP: the same service and the
 * same journey access as GET /api/journeys/:id/tracks, read under the Journey
 * addon like the route. A track's full geometry can run to thousands of
 * points, so each answers with its size and a thinned line instead, the
 * lines of all tracks together held to TRACKS_DISPLAY_POINTS.
 */
@McpController()
export class JourneyTracksMcp {
  constructor(
    private readonly journey: JourneyDomainService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'get_journey_tracks',
    description: `The GPX tracks a journey's map draws, from the trips added to it: per track the place and trip it belongs to, its name, its kind (trip_gpx for a trip's GPX), how many points it has and its length in km as the line runs. display_geometry holds the line thinned for drawing as [lat, lng] points: at most ${TRACK_DISPLAY_POINTS} per track and about ${TRACKS_DISPLAY_POINTS} for all tracks together, always with both ends. A journey whose trips have no tracks answers an empty list.`,
    inputSchema: { journeyId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async getJourneyTracks({ journeyId }: { journeyId: number }, ctx: McpContext) {
    const tracks = await this.journey.journeyTracks(journeyId, ctx.userId);
    if (!tracks) return errorResult('Journey not found or access denied.');
    const points = pointsPerTrack(tracks.length);
    return ok({ tracks: tracks.map((track) => trackSummary(track, points)) });
  }
}
