import { tourListCardSchema } from './tour-list.card';
import { tourRouteCardSchema } from './tour-route.card';

export * from './tour-list.card';
export * from './tour-route.card';

/**
 * What the tours bring to the assistant chat: the kinds of card they draw,
 * the verbs of their change cards and what an applied change of theirs
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const TOUR_CARD_SCHEMAS = [tourRouteCardSchema, tourListCardSchema] as const;
/** addTour, updateTour and importTour sit in the core list already. */
/** A station of a city walk checked off on its day: visited, skipped, or the mark taken back. */
export const TOUR_VERB_KEYS = [
  'markVisited',
  'markSkipped',
  'markPlanned',
  // A recorded track put on a tour as the way it was done, or taken off it.
  'assignTrack',
  'unassignTrack',
  // A tour left out of the user's activity sums, or counted again.
  'excludeTour',
  'countTour',
  // A tour pointed at its trip's packing list, or let go of it.
  'linkPacking',
  'unlinkPacking',
  // A saved tour turned round or taken back to its start, copied, or its line drawn in another colour.
  'reverseTour',
  'closeLoop',
  'copyTour',
  'setRouteColor',
  // The writes of a ski or paddle tour of its own, and a planned import taken back to its recording.
  'classifySki',
  'setPaddlePlan',
  'decideObstacles',
  'restoreTrack',
  // A found place taken into a saved tour as a stop, or taken out again (P6).
  'addTourStop',
  'removeTourStop',
] as const;
/** 'tour' is a core entity already. */
export const TOUR_APPLIED_ENTITIES = [] as const;
