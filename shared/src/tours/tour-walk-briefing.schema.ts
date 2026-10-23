import { idSchema } from '../common/primitives.schema';
import { clockTimeSchema } from '../place/place-hours';
import { includeGeometryFlagSchema } from './tour-display.schema';
import { tourPoiSearchRequestSchema, walkThemeSchema } from './tour-poi-search.schema';
import { TOUR_STATION_NAME_MAX, tourDescriptionSchema, tourNameSchema, tourWaypointSchema } from './tours.schema';

import { z } from 'zod';

/**
 * CW-11: a city walk an assistant prepares from a traveller's briefing. The
 * proposal reads only; the walk is created once the traveller confirmed it,
 * through the same creation the planner's save uses. Nothing here carries a
 * route: the server plans the way on foot through the stations, for the
 * proposal and again for the creation.
 */

/** How much one briefing may name, and how many places of its themes a proposal offers at most. */
export const CITY_WALK_BRIEFING_LIMITS = {
  wished: 10,
  tripPlaces: 12,
  appointments: 5,
  themes: 3,
  themePlaces: 8,
} as const;

/** The most stations a city walk created from a briefing has: everything a proposal can hold, start and end included. */
export const CITY_WALK_MAX_STATIONS = 40;

const stationName = z.string().trim().min(1).max(TOUR_STATION_NAME_MAX);
const { lat, lng, stay_minutes, opening_hours } = tourWaypointSchema.shape;

const walkEndSchema = z.object({ name: stationName.optional(), lat, lng }).strict();

const wishedStationSchema = z
  .object({
    name: stationName,
    lat,
    lng,
    stay_minutes: stay_minutes.describe(
      'How long the traveller wants to stay, in minutes; left out when they did not say',
    ),
    opening_hours: opening_hours.describe('Its opening hours as OpenStreetMap writes them, where known'),
  })
  .strict();

const tripPlaceChoiceSchema = z
  .object({
    place_id: idSchema.describe('A place of this trip, as list_places gives it'),
    stay_minutes: stay_minutes.describe(
      'How long the traveller wants to stay there, in minutes; left out when they did not say',
    ),
  })
  .strict();

const appointmentSchema = z
  .object({
    name: stationName,
    lat,
    lng,
    time: clockTimeSchema.describe('When the traveller has to be there, HH:MM'),
    stay_minutes: stay_minutes.describe('How long it takes, in minutes; left out when they did not say'),
    place_id: idSchema.optional().describe('The place of this trip it is at, if it is one'),
  })
  .strict();

export const cityWalkBriefingRequestSchema = z
  .object({
    start: walkEndSchema.describe('Where the walk starts'),
    end: walkEndSchema.optional().describe('Where it has to end; left out, it ends at its last station'),
    day_id: idSchema
      .optional()
      .describe('The day of the trip it is for, as get_trip_summary gives it: its date decides the opening hours'),
    start_time: clockTimeSchema.describe('When it starts, HH:MM'),
    end_time: clockTimeSchema.describe('When it has to be over, HH:MM, later the same day'),
    themes: z
      .array(walkThemeSchema)
      .min(1)
      .max(CITY_WALK_BRIEFING_LIMITS.themes)
      .optional()
      .describe('What the traveller is interested in: culture, parks, food or mixed; mixed when left out'),
    wished: z
      .array(wishedStationSchema)
      .max(CITY_WALK_BRIEFING_LIMITS.wished)
      .optional()
      .describe('The stations the traveller asked for by name and position'),
    trip_places: z
      .array(tripPlaceChoiceSchema)
      .max(CITY_WALK_BRIEFING_LIMITS.tripPlaces)
      .optional()
      .describe('The places of this trip the walk may use; none when left out'),
    appointments: z
      .array(appointmentSchema)
      .max(CITY_WALK_BRIEFING_LIMITS.appointments)
      .optional()
      .describe('Fixed appointments the traveller told you, with their time'),
    theme_places_max: z
      .number()
      .int()
      .min(0)
      .max(CITY_WALK_BRIEFING_LIMITS.themePlaces)
      .optional()
      .describe('How many places of the themes to offer at most; 0 searches none'),
    corridor_m: tourPoiSearchRequestSchema.shape.corridor_m
      .optional()
      .describe('How far from the start, the wishes and the appointments to search, in metres; 1000 when left out'),
    lang: tourPoiSearchRequestSchema.shape.lang,
    include_geometry: includeGeometryFlagSchema,
  })
  .strict();
export type CityWalkBriefingRequest = z.infer<typeof cityWalkBriefingRequestSchema>;

/** One station of a city walk created from a briefing, in its order: no key, the server gives each one. */
export const cityWalkStationSchema = tourWaypointSchema
  .pick({
    lat: true,
    lng: true,
    name: true,
    stay_minutes: true,
    importance: true,
    protected: true,
    opening_hours: true,
    linked_place_id: true,
  })
  .strict();
export type CityWalkStation = z.infer<typeof cityWalkStationSchema>;

export const cityWalkCreateRequestSchema = z
  .object({
    name: tourNameSchema,
    description: tourDescriptionSchema,
    stations: z.array(cityWalkStationSchema).min(2).max(CITY_WALK_MAX_STATIONS),
  })
  .strict();
export type CityWalkCreateRequest = z.infer<typeof cityWalkCreateRequestSchema>;
