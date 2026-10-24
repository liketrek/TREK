import { visitStatusSchema } from '../../atlas/atlas.schema';
import { atlasCountryCodeSchema } from './atlas-country.card';
import { cardCountSchema, cardDateSchema, cardText } from './card-parts';

import { z } from 'zod';

/** The continents of CONTINENT_MAP and its fallback; the client names them with the Atlas page's own words. */
export const ATLAS_CARD_CONTINENTS = [
  'Europe',
  'Asia',
  'North America',
  'South America',
  'Africa',
  'Oceania',
  'Antarctica',
  'Other',
] as const;
export const atlasCardContinentSchema = z.enum(ATLAS_CARD_CONTINENTS);
export type AtlasCardContinent = z.infer<typeof atlasCardContinentSchema>;

/**
 * The user's travel picture as the Atlas page shows it: visited, planned and
 * wished-for countries, the trips, days, places and cities behind them, the
 * distance flown, the flags, the continents, the next trip and the streak.
 */
export const atlasPassportCardSchema = z.object({
  kind: z.literal('atlasPassport'),
  countries: z.object({ visited: cardCountSchema, planned: cardCountSchema, idea: cardCountSchema }),
  totals: z.object({
    trips: cardCountSchema,
    days: cardCountSchema,
    places: cardCountSchema,
    cities: cardCountSchema,
    /** Rounded kilometres; null when nothing was flown. */
    flownKm: cardCountSchema.nullable(),
  }),
  /** Visited countries, latest first, then planned ones, soonest first. */
  flags: z.array(z.object({ code: atlasCountryCodeSchema, status: visitStatusSchema })).max(40),
  moreFlags: cardCountSchema,
  continents: z
    .array(z.object({ name: atlasCardContinentSchema, visited: cardCountSchema, planned: cardCountSchema }))
    .max(8),
  nextTrip: z
    .object({
      title: cardText(80),
      startDate: cardDateSchema.nullable(),
      daysUntil: z.number().int().min(0).max(36_500).nullable(),
    })
    .nullable(),
  streakYears: z.number().int().min(0).max(200).nullable(),
});
export type AtlasPassportCard = z.infer<typeof atlasPassportCardSchema>;
