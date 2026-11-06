import { budgetItemsPageSchema } from '../budget/budget.schema';
import { collabPollsResponseSchema } from '../collab/collab.schema';
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

/** `list_budget_items`: one page of the trip's expenses with the totals. */
export const listBudgetItemsOutputSchema = looseOutput(budgetItemsPageSchema);
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

/** `search_place`: the places found and which index answered. */
export const searchPlaceOutputSchema = looseOutput(mapsSearchResultSchema);
export type SearchPlaceOutput = z.infer<typeof searchPlaceOutputSchema>;

/** `list_collab_polls`: the trip's polls with their options and voters. */
export const listCollabPollsOutputSchema = looseOutput(collabPollsResponseSchema);
export type ListCollabPollsOutput = z.infer<typeof listCollabPollsOutputSchema>;

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
