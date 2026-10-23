import { chargingCardSchema } from './charging.card';
import { corridorCardSchema } from './corridor.card';
import { dayRouteCardSchema } from './day-route.card';
import { roadtripRulesCardSchema } from './roadtrip-rules.card';
import { roadtripCardSchema } from './roadtrip.card';
import { transitCardSchema } from './transit.card';

export * from './charging.card';
export * from './corridor.card';
export * from './day-route.card';
export * from './roadtrip-rules.card';
export * from './roadtrip.card';
export * from './transit.card';

/**
 * What the road trip brings to the assistant chat: the kinds of card it draws,
 * the verbs of its change cards and what an applied change of its
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const ROADTRIP_CARD_SCHEMAS = [
  roadtripCardSchema,
  corridorCardSchema,
  chargingCardSchema,
  transitCardSchema,
  dayRouteCardSchema,
  roadtripRulesCardSchema,
] as const;
/**
 * A via point sent into a day's drive, a chain of them laid at once, one
 * moved, one taken out, the vias of a day pinned again to its stops; the
 * driving settings changed; where a day ends set; a Google Maps route taken
 * in as stops; a transit connection added.
 */
export const ROADTRIP_VERB_KEYS = [
  'addRouteVia',
  'shapeRoute',
  'moveRouteVia',
  'removeRouteVia',
  'repinRouteVias',
  'updateDriveSettings',
  'setDayBoundary',
  'importRoute',
  'addTransit',
] as const;
/** The road trip of a trip: its vias, its settings and its day endings, shown on the plan by their day. */
export const ROADTRIP_APPLIED_ENTITIES = ['roadtrip'] as const;
