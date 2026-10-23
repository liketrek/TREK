import { visitStatusSchema } from '../../atlas/atlas.schema';
import { idSchema } from '../../common/primitives.schema';
import { cardCountSchema, cardDateSchema, cardText } from './card-parts';

import { z } from 'zod';

/** ISO 3166-1 alpha-2 in upper case: the only code a flag and a country name are drawn from. */
export const atlasCountryCodeSchema = z.string().regex(/^[A-Z]{2}$/);

/** ISO 3166-2 as the atlas stores a region ("DE-BY", "US-CA"). */
export const atlasRegionCodeSchema = z.string().regex(/^[A-Z]{2}-[A-Z0-9]{1,8}$/);

/** A counter a change moves. `after` is null when the user's trips decide it, known once the change is applied. */
export const atlasTallySchema = z.object({ before: cardCountSchema, after: cardCountSchema.nullable() });

/** Where a country or a region stands after a change: `none` is off the map, `unknown` is up to the trips. */
export const atlasStatusAfterSchema = z.enum(['visited', 'planned', 'idea', 'none', 'unknown']);

/** A trip that went to the country, as a line of the card. */
const atlasTripLineSchema = z.object({
  id: idSchema,
  title: cardText(80),
  startDate: cardDateSchema.nullable(),
  endDate: cardDateSchema.nullable(),
});

/** What a mark or an unmark does to the country, or to one of its regions. */
export const atlasCountryChangeSchema = z.object({
  op: z.enum(['mark', 'unmark']),
  /** Set when the change is about one region of the country. */
  region: z
    .object({
      code: atlasRegionCodeSchema,
      name: cardText(80),
      before: visitStatusSchema.nullable(),
      after: atlasStatusAfterSchema,
    })
    .nullable(),
  /** The country's own status once the change is applied. */
  after: atlasStatusAfterSchema,
  /** Visited countries of the whole atlas; null when the atlas could not be read. */
  countries: atlasTallySchema.nullable(),
  /** Visited regions of this country, on region changes only. */
  regions: atlasTallySchema.nullable(),
});

/**
 * One country of the atlas: its status, who marked it, the trips and places
 * that put it there. An answer (`change` null) shows it as it is now; a change
 * card shows it as it was, with what the mark or unmark does to it and to the
 * visited counters.
 */
export const atlasCountryCardSchema = z.object({
  kind: z.literal('atlasCountry'),
  code: atlasCountryCodeSchema,
  /** Now on an answer, before the change on a change card; null when the country is not on the map. */
  status: visitStatusSchema.nullable(),
  markedBy: z.enum(['manual', 'dawarich', 'region']).nullable(),
  placeCount: cardCountSchema.nullable(),
  tripCount: cardCountSchema.nullable(),
  trips: z.array(atlasTripLineSchema).max(4),
  moreTrips: cardCountSchema,
  places: z.array(cardText(80)).max(8),
  morePlaces: cardCountSchema,
  change: atlasCountryChangeSchema.nullable(),
});
export type AtlasCountryCard = z.infer<typeof atlasCountryCardSchema>;
export type AtlasCountryChange = z.infer<typeof atlasCountryChangeSchema>;
export type AtlasTally = z.infer<typeof atlasTallySchema>;
export type AtlasStatusAfter = z.infer<typeof atlasStatusAfterSchema>;
