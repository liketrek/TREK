import type { AnswerInput, CardReader, Described, PreviewContext, ToolArgs, ToolCards } from '../card-types';
import { clipped, finite, recordOf, type Row } from '../card-values';
import { Rows, text } from '../preview-format';
import { climbOf, fitted, lineOf, metresOf, minutesOf, near, routeCard, stopOf, whole } from './tour-card-values';
import { appliedTourCard } from './tour-change.cards';
import { hikeCard } from './tour-route.cards';
import { DELETE_CREATED_TOUR } from './tour-undo';
import { TOUR_ROUTE_LIMITS, wandererDifficultyToSac, type TourRouteCard } from '@trek/shared';

/**
 * The cards of the planner's other searches through the assistant: a round
 * hike of a wished length and another way for one leg of a hike, drawn as
 * propose_hike's proposals are (they answer one), the leg's way beside the
 * hike as it runs now; and a wanderer trail, previewed as a way to take in
 * and imported with its own change card.
 */

/** How close a trail's end must lie to its start to be a loop with one stop. */
const LOOP_END_M = 60;

/** Whether the tool found the way it was asked for; one not found answers `found: false` and draws nothing. */
function found(value: unknown): boolean {
  return recordOf(value).found === true;
}

/** propose_round_hike: the round as a hike proposal's card. */
export function roundHikeCard({ value, args, card }: AnswerInput): TourRouteCard | null {
  if (!found(value)) return null;
  const proposal = hikeCard(value, args, card, 'proposal');
  return proposal ? fitted(proposal) : null;
}

/** The hike as it runs now, under a way for one of its legs: its line flat, its length, climb and time. */
function currentOf(value: Row): TourRouteCard['previous'] {
  const current = recordOf(value.current);
  const line = lineOf(value.current_geometry, TOUR_ROUTE_LIMITS.previous);
  const distanceM = metresOf(current.distance_m);
  if (line.length < 2 || distanceM === null) return null;
  return {
    line: line.map(([lat, lng]): [number, number] => [lat, lng]),
    distanceM,
    ascentM: climbOf(current.ascent_m),
    minutes: minutesOf(current.duration_minutes),
  };
}

/**
 * propose_hike_leg_way: the whole hike with the leg taken that way, the way
 * it runs now drawn faint beneath it; a saved hike's way names its tour, so
 * it is changed with update_tour rather than planned anew.
 */
export function legWayCard({ value, args, card }: AnswerInput): TourRouteCard | null {
  if (!found(value)) return null;
  const proposal = hikeCard(value, args, card, 'proposal');
  if (!proposal) return null;
  const answer = recordOf(value);
  const placeId = whole(recordOf(answer.leg_way).tour_id, 1, Number.MAX_SAFE_INTEGER);
  return fitted({ ...proposal, placeId, previous: currentOf(answer) });
}

/**
 * A wanderer trail as a way to take in: its full line, the length and climb
 * measured from its GPX, and wanderer's difficulty on the SAC scale. One the
 * trip already holds as it is reads as that saved tour.
 */
export function wandererTrailCard(value: unknown, source: 'proposal' | 'pending'): TourRouteCard | null {
  const preview = recordOf(value);
  const trail = recordOf(preview.trail);
  const line = lineOf(preview.line_geometry);
  const [first, last] = [line[0], line.at(-1)];
  if (!first || !last || line.length < 2) return null;
  const snapshot = recordOf(preview.snapshot);
  const kept = preview.state === 'unchanged' ? whole(snapshot.placeId, 1, Number.MAX_SAFE_INTEGER) : null;
  const distanceKm = finite(preview.distanceKm);
  const start = { lat: first[0], lng: first[1] };
  const end = { lat: last[0], lng: last[1] };
  const loop = near(start, end, LOOP_END_M);
  const difficulty = trail.difficulty;
  const sac =
    difficulty === 'easy' || difficulty === 'moderate' || difficulty === 'difficult'
      ? wandererDifficultyToSac(difficulty)
      : null;
  return fitted(
    routeCard({
      source: kept !== null && source === 'proposal' ? 'saved' : source,
      activity: 'hike',
      placeId: source === 'proposal' ? kept : null,
      name: clipped(trail.name, 120),
      distanceM: distanceKm === null ? null : metresOf(distanceKm * 1000),
      ascentM: climbOf(preview.elevationGainM),
      descentM: climbOf(preview.elevationLossM),
      limit: sac,
      routed: true,
      line,
      stops: [
        stopOf({ role: 'start', ...start, atM: 0, name: clipped(trail.location, 80) }),
        ...(loop ? [] : [stopOf({ role: 'end', ...end, atM: metresOf((distanceKm ?? 0) * 1000) ?? 0 })]),
      ],
    }),
  );
}

/** preview_wanderer_trail: the trail as a card. */
export function wandererPreviewCard({ value }: AnswerInput): TourRouteCard | null {
  return wandererTrailCard(value, 'proposal');
}

/** What a held wanderer import looked up: the trail's preview. */
interface TrailLoaded {
  preview: unknown;
}

/** import_wanderer_trail: the trail previewed again, for its name and its line. */
async function loadImport(args: ToolArgs, read: CardReader): Promise<TrailLoaded | null> {
  if (typeof args.trailId !== 'string') return null;
  const preview = await read('preview_wanderer_trail', { trailId: args.trailId, include_geometry: true });
  return preview ? { preview } : null;
}

/** The SAC grade a wanderer difficulty stands for, T1 to T3. */
function gradeOf(difficulty: unknown): string {
  const sac =
    difficulty === 'easy' || difficulty === 'moderate' || difficulty === 'difficult'
      ? wandererDifficultyToSac(difficulty)
      : null;
  return sac === null ? '' : `T${sac}`;
}

/** import_wanderer_trail: the trail by its name, where it lies, its grade and its page on wanderer. */
function describeImport(_ctx: PreviewContext, args: ToolArgs, loaded: TrailLoaded | null): Described {
  const trail = recordOf(recordOf(loaded?.preview).trail);
  const rows = new Rows()
    .add('location', text(trail.location))
    .add('difficulty', gradeOf(trail.difficulty))
    .add('link', text(trail.externalUrl));
  return { subject: text(trail.name) || text(args.trailId), rows, dayId: null, placeIds: [] };
}

export const IMPORT_WANDERER_TRAIL: ToolCards<TrailLoaded> = {
  write: { verbKey: 'importTour', entity: 'tour' },
  load: loadImport,
  describe: describeImport,
  change: (_ctx, _args, loaded) => (loaded ? wandererTrailCard(loaded.preview, 'pending') : null),
  applied: appliedTourCard,
  undo: DELETE_CREATED_TOUR,
};
