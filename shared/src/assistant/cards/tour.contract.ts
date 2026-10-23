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
export const TOUR_VERB_KEYS = [] as const;
/** 'tour' is a core entity already. */
export const TOUR_APPLIED_ENTITIES = [] as const;
