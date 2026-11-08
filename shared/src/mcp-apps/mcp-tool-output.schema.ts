import { budgetItemsPageSchema } from '../budget/budget.schema';
import { collabPollResponseSchema, collabPollsResponseSchema } from '../collab/collab.schema';
import { dayNoteSchema, daySchema } from '../day/day.schema';
import { mapsAutocompleteResultSchema, mapsSearchResultSchema } from '../maps/maps.schema';
import { tripPhotoSchema } from '../memories/memories.schema';
import { preferencesMatrixSchema } from '../notification/notification.schema';
import { packingBagSchema, packingItemSchema } from '../packing/packing.schema';
import { paddleRouteResponseSchema } from '../paddle/paddle-route.schema';
import { placeSchema } from '../place/place.schema';
import { skiRouteResponseSchema } from '../ski/ski-route.schema';
import { todoListResponseSchema } from '../todo/todo.schema';
import { tripSchema } from '../trip/trip.schema';
import { weatherResultSchema } from '../weather/weather.schema';
import { looseOutput } from './loose-output';

import { z } from 'zod';

/**
 * What an MCP read tool answers, as its `outputSchema` and as the
 * `structuredContent` a widget (an MCP App, `mcp-apps/`) reads.
 *
 * Each is the payload the tool's text result has always carried, built from the
 * row schemas the REST routes and the client already share, so a host that
 * reads the text and one that reads `structuredContent` see the same object.
 * The MCP SDK validates every successful call against the tool's schema, which
 * makes each one a contract check in every test that reaches the tool, like
 * `@ResponseContract` for a route. Every object is opened with `looseOutput`
 * (an MCP client validates against the advertised JSON Schema too): an extra key
 * passes, a declared one of another type fails.
 */

/** `list_trips`: every trip the caller owns or is a member of. */
export const listTripsOutputSchema = looseOutput(z.object({ trips: z.array(tripSchema) }));
export type ListTripsOutput = z.infer<typeof listTripsOutputSchema>;

/** `list_places`: the trip's place pool. */
export const listPlacesOutputSchema = looseOutput(z.object({ places: z.array(placeSchema) }));
export type ListPlacesOutput = z.infer<typeof listPlacesOutputSchema>;

/** One person assigned to a packing category. */
export const packingCategoryAssigneeSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable(),
});

/** `list_packing_items`: the items, the bags and who packs each category. */
export const listPackingItemsOutputSchema = looseOutput(
  z.object({
    items: z.array(packingItemSchema),
    bags: z.array(packingBagSchema),
    category_assignees: z.record(z.string(), z.array(packingCategoryAssigneeSchema)),
  }),
);
export type ListPackingItemsOutput = z.infer<typeof listPackingItemsOutputSchema>;

/** `list_todos`: the trip's to-dos, as GET /todo answers them. */
export const listTodosOutputSchema = looseOutput(todoListResponseSchema);
export type ListTodosOutput = z.infer<typeof listTodosOutputSchema>;

/** One expense as a list_budget_items page carries it, slimmed to what a reader needs. */
const budgetPageItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string().nullable().optional(),
  total_price: z.number().nullable().optional(),
  currency: z.string(),
  /** The amount in the trip currency, when the expense was in another one and a rate converts it. */
  trip_amount: z.number().nullable(),
  expense_date: z.string().nullable(),
});

/**
 * `list_budget_items`: one page of the trip's expenses with the totals. The
 * totals are in the trip currency, in major units; by_category sums them per
 * cost category.
 */
export const listBudgetItemsOutputSchema = looseOutput(
  budgetItemsPageSchema.extend({
    currency: z.string(),
    total: z.number(),
    by_category: z.record(z.string(), z.number()),
    unconverted_item_ids: z.array(z.number()),
    item_count: z.number(),
    next_offset: z.number().nullable(),
    items: z.array(budgetPageItemSchema),
    people: z.array(z.object({ user_id: z.number(), username: z.string() })),
  }),
);
export type ListBudgetItemsOutput = z.infer<typeof listBudgetItemsOutputSchema>;

/** One member's share of the trip's expenses, in the trip currency. */
export const budgetPerPersonRowSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable(),
  total_assigned: z.number(),
  total_paid: z.number(),
  items_count: z.number(),
  currency: z.string(),
  avatar_url: z.string().nullable(),
});

/** `get_budget_per_person`: what each member was assigned and has paid. */
export const budgetPerPersonOutputSchema = looseOutput(z.object({ summary: z.array(budgetPerPersonRowSchema) }));
export type BudgetPerPersonOutput = z.infer<typeof budgetPerPersonOutputSchema>;

/** `get_weather`: the forecast (or the climate average) for one place and day. */
export const weatherOutputSchema = looseOutput(z.object({ weather: weatherResultSchema }));
export type WeatherOutput = z.infer<typeof weatherOutputSchema>;

/**
 * One place a search found, as the place-results view reads it: the fields
 * every index fills (Google, the TREK index, OpenStreetMap). A row is open
 * otherwise; the view skips one that lacks a name.
 */
export const placeSearchCardSchema = z.object({
  name: z.string().min(1),
  address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  osm_id: z.string().nullable().optional(),
  google_place_id: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  website: z.string().nullable().optional(),
});
export type PlaceSearchCard = z.infer<typeof placeSearchCardSchema>;

/** `search_place`: the places found and which index answered. */
export const searchPlaceOutputSchema = looseOutput(mapsSearchResultSchema);
export type SearchPlaceOutput = z.infer<typeof searchPlaceOutputSchema>;

/** `list_collab_polls`: the trip's polls with their options and voters. */
export const listCollabPollsOutputSchema = looseOutput(collabPollsResponseSchema);
export type ListCollabPollsOutput = z.infer<typeof listCollabPollsOutputSchema>;

/** `vote_collab_poll`: the poll as it stands after the vote, which the poll view reads back. */
export const votedPollOutputSchema = looseOutput(collabPollResponseSchema);
export type VotedPollOutput = z.infer<typeof votedPollOutputSchema>;

/**
 * A planned leg as propose_paddle_route and propose_ski_route summarise it:
 * a failed leg as the router answers it, a planned one with its lengths and
 * stretches measured along it. Only the outcome is pinned; the rest of the
 * row is open, as every output object is.
 */
const routeLegSummarySchema = z.object({ status: z.string() });

/** propose_paddle_route: the legs and the water data they were planned on. */
export const paddleRouteProposalOutputSchema = looseOutput(
  paddleRouteResponseSchema.extend({ legs: z.array(routeLegSummarySchema) }),
);
export type PaddleRouteProposalOutput = z.infer<typeof paddleRouteProposalOutputSchema>;

/** propose_ski_route: the legs, the piste data build and the areas they were planned on. */
export const skiRouteProposalOutputSchema = looseOutput(
  skiRouteResponseSchema.extend({ legs: z.array(routeLegSummarySchema) }),
);
export type SkiRouteProposalOutput = z.infer<typeof skiRouteProposalOutputSchema>;

/** `list_days`: the trip's days in order, each with its scheduled places and its notes. */
export const listDaysOutputSchema = looseOutput(z.object({ days: z.array(daySchema) }));
export type ListDaysOutput = z.infer<typeof listDaysOutputSchema>;

/** `list_day_notes`: one day's notes in their order. */
export const listDayNotesOutputSchema = looseOutput(z.object({ notes: z.array(dayNoteSchema) }));
export type ListDayNotesOutput = z.infer<typeof listDayNotesOutputSchema>;

/** `get_place`: one place of the trip's pool. */
export const getPlaceOutputSchema = looseOutput(z.object({ place: placeSchema }));
export type GetPlaceOutput = z.infer<typeof getPlaceOutputSchema>;

/** `list_trip_photos`: the provider photos on a trip the caller may see. */
export const listTripPhotosOutputSchema = looseOutput(z.object({ photos: z.array(tripPhotoSchema) }));
export type ListTripPhotosOutput = z.infer<typeof listTripPhotosOutputSchema>;

/** `get_notification_preferences`: the caller's channel matrix. */
export const notificationPreferencesOutputSchema = looseOutput(preferencesMatrixSchema);
export type NotificationPreferencesOutput = z.infer<typeof notificationPreferencesOutputSchema>;

/** `autocomplete_place`: the suggestions for a partial name, as the search box shows them. */
export const autocompletePlaceOutputSchema = looseOutput(mapsAutocompleteResultSchema);
export type AutocompletePlaceOutput = z.infer<typeof autocompletePlaceOutputSchema>;

/** How many of a trip's days get_trip_overview lists: the coming week, or the first one. */
export const TRIP_OVERVIEW_DAY_LIMIT = 7;

/** One day as get_trip_overview lists it: when, what it is called, and how many stops it has. */
export const tripOverviewDaySchema = z.object({
  id: z.number(),
  day_number: z.number().nullable(),
  date: z.string().nullable(),
  title: z.string().nullable(),
  stops: z.number(),
});

/**
 * `get_trip_overview`: a trip in a few lines, small enough to draw as a card.
 * The trip, how much it holds, and its next days (from today on while it is
 * under way or ahead, from its first day otherwise). get_trip_summary is the
 * whole trip; this is what the overview card reads.
 */
export const tripOverviewOutputSchema = looseOutput(
  z.object({
    trip: z.object({
      id: z.number(),
      title: z.string(),
      description: z.string().nullable(),
      start_date: z.string().nullable(),
      end_date: z.string().nullable(),
      currency: z.string(),
      is_archived: z.number(),
    }),
    counts: z.object({
      days: z.number(),
      places: z.number(),
      reservations: z.number(),
      members: z.number(),
    }),
    days: z.array(tripOverviewDaySchema),
  }),
);
export type TripOverviewOutput = z.infer<typeof tripOverviewOutputSchema>;

/** How many places one get_trip_map call returns at most, and by default. */
export const TRIP_MAP_PAGE_MAX = 500;
export const TRIP_MAP_PAGE_DEFAULT = 200;

/** get_trip_map's paging: from which place on, and how many. */
export const tripMapPageSchema = z.object({
  offset: z.number().int().min(0).optional().describe('Index of the first place to return; 0 when left out'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(TRIP_MAP_PAGE_MAX)
    .optional()
    .describe(`How many places to return, at most ${TRIP_MAP_PAGE_MAX}; ${TRIP_MAP_PAGE_DEFAULT} when left out`),
});
export type TripMapPage = z.infer<typeof tripMapPageSchema>;

/**
 * The raster tiles a map view draws: an https URL template with {z}, {x} and
 * {y}, the credit the provider asks for, and the deepest zoom it serves.
 */
export const mapTilesSchema = z.object({
  url: z.string(),
  attribution: z.string(),
  max_zoom: z.number(),
});
export type MapTiles = z.infer<typeof mapTilesSchema>;

/** One place on the trip map: where it is and what it is called. */
export const tripMapPlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().nullable(),
});
export type TripMapPlace = z.infer<typeof tripMapPlaceSchema>;

/**
 * `get_trip_map`: one page of the trip's places that have a location, the
 * count over all of them, and the tiles the caller's map settings name.
 */
export const tripMapOutputSchema = looseOutput(
  z.object({
    trip_id: z.number(),
    place_count: z.number(),
    offset: z.number(),
    next_offset: z.number().nullable(),
    places: z.array(tripMapPlaceSchema),
    tiles: mapTilesSchema,
  }),
);
export type TripMapOutput = z.infer<typeof tripMapOutputSchema>;

/** One stop of a day as get_day_plan lists it, in the day's order. */
export const dayPlanStopSchema = z.object({
  assignment_id: z.number(),
  place_id: z.number(),
  name: z.string(),
  time: z.string().nullable(),
  end_time: z.string().nullable(),
  address: z.string().nullable(),
});
export type DayPlanStop = z.infer<typeof dayPlanStopSchema>;

/** `get_day_plan`: one day of a trip and its stops in order. */
export const dayPlanOutputSchema = looseOutput(
  z.object({
    trip_id: z.number(),
    day: z.object({
      id: z.number(),
      day_number: z.number().nullable(),
      date: z.string().nullable(),
      title: z.string().nullable(),
    }),
    stops: z.array(dayPlanStopSchema),
  }),
);
export type DayPlanOutput = z.infer<typeof dayPlanOutputSchema>;
