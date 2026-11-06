import { budgetItemsPageSchema } from '../budget/budget.schema';
import { collabPollsResponseSchema } from '../collab/collab.schema';
import { mapsSearchResultSchema } from '../maps/maps.schema';
import { packingBagSchema, packingItemSchema } from '../packing/packing.schema';
import { placeSchema } from '../place/place.schema';
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
