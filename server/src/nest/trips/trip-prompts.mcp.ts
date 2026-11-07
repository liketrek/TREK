import { ADDON_IDS } from '../../addons';
import { McpController, Prompt, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { datePromptArg, queryPromptArg, tripIdPromptArg } from '../mcp-shared/prompt-args';
import { PackingService } from '../packing/packing.service';
import { TripReadModelService } from '../trip-read-model/trip-read-model.service';
import { TripsService } from './trips.service';

const budgetAddonOn = addonGate(ADDON_IDS.BUDGET);

/** One user message, the shape every prompt answers with. */
function userMessage(text: string, description?: string) {
  return {
    ...(description ? { description } : {}),
    messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }],
  };
}

const NO_ACCESS = 'Trip not found or access denied.';
const packingAddonOn = addonGate(ADDON_IDS.PACKING);

/**
 * The trip-wide prompts. budget-overview and packing-list render a summary of
 * the trip; plan-day, pack-for-trip, budget-review and add-place hand the
 * model the steps of a common task, for clients that offer prompts as slash
 * commands. All read through the trips domain, where the whole-trip read
 * model is an injection (it lives above the budget and packing modules).
 */
@McpController()
export class TripPromptsMcp {
  constructor(
    private readonly trips: TripsService,
    private readonly readModel: TripReadModelService,
    private readonly packing: PackingService,
    readonly addons: AddonsService,
  ) {}

  @Prompt({
    name: 'budget-overview',
    title: 'Budget Overview',
    description: 'Get a formatted budget summary for a trip',
    argsSchema: {
      tripId: tripIdPromptArg.describe('Trip ID'),
    },
    when: budgetAddonOn,
  })
  async budgetOverviewPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.trips.canAccessTrip(tripId, ctx.userId))) {
      return {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found or access denied.' } },
        ],
      };
    }
    const summary = await this.readModel.getTripSummary(tripId, ctx.userId);
    if (!summary) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found.' } }] };
    }
    const { trip, budget } = await summary;
    const currency = trip?.currency || 'EUR';
    // The summary's own totals, each row in the trip currency at the rate it was booked
    // at (#2525). Adding total_price up here printed a dollar bill as that many euros.
    const byCategory: Record<string, number> = {};
    for (const [cat, amount] of Object.entries(budget?.by_category || {})) {
      const key = cat || 'Uncategorized';
      byCategory[key] = Math.round(((byCategory[key] || 0) + amount) * 100) / 100;
    }
    const total = budget?.total || 0;
    const lines = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => `- ${cat}: ${amount} ${currency}`)
      .join('\n');
    const memberCount = Math.max(
      1,
      [summary.members?.owner, ...(summary.members?.collaborators || [])].filter(Boolean).length,
    );
    const perPerson = (total / memberCount).toFixed(2);
    // Rows no rate could convert are in none of the figures above; say so rather than
    // let the total pass for the whole trip.
    const uncounted = budget?.unconverted_item_ids?.length || 0;
    const uncountedLine = uncounted > 0 ? `\n\n${uncounted} expense(s) not counted yet: no exchange rate.` : '';
    return {
      description: `Budget overview for "${trip?.title || tripId}"`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `# Budget: ${trip?.title || 'Trip'}\n\n**Total: ${total} ${currency}** (${perPerson} ${currency} per person)\n\n${lines || 'No expenses recorded.'}${uncountedLine}`,
          },
        },
      ],
    };
  }

  @Prompt({
    name: 'packing-list',
    title: 'Packing List',
    description: 'Get a formatted packing checklist for a trip',
    argsSchema: {
      tripId: tripIdPromptArg.describe('Trip ID'),
    },
    when: packingAddonOn,
  })
  async packingListPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.packing.verifyTripAccess(tripId, ctx.userId))) {
      return {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found or access denied.' } },
        ],
      };
    }
    // Hide other members' private items (#858) from the requesting user.
    const items = await this.packing.listItems(tripId, ctx.userId);
    if (!items.length) {
      return {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'No packing items found for this trip.' } },
        ],
      };
    }
    const grouped = items.reduce((acc: Record<string, unknown[]>, item: { category?: string }) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    const lines = Object.entries(grouped)
      .map(
        ([cat, catItems]) =>
          `## ${cat}\n${(catItems as { checked?: unknown; name?: string }[]).map((i) => `- [${i.checked ? 'x' : ' '}] ${i.name}`).join('\n')}`,
      )
      .join('\n\n');
    // Only the title is needed. The whole summary also adds up the budget, which can
    // wait on a rates fetch for a row that never froze its rate.
    const trip = await this.trips.getRaw(tripId);
    return {
      description: `Packing list for "${trip?.title || tripId}"`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `# Packing List: ${trip?.title || 'Trip'}\n\n${lines}\n\n_${items.length} items across ${Object.keys(grouped).length} categories_`,
          },
        },
      ],
    };
  }

  // ── Workflow prompts: the steps of a common task, for clients that offer prompts as commands ──
  //
  // The message goes out in the user's own voice and tells the model to write, so it names the
  // trip by its id alone: the title is any member's text and must not ride along as an
  // instruction. The title stays in the description, which only labels the prompt.

  @Prompt({
    name: 'plan-day',
    title: 'Plan a day',
    description: 'Plan one day of a trip: what is on it already, then places to add in a sensible order',
    argsSchema: { tripId: tripIdPromptArg.describe('Trip ID'), date: datePromptArg.describe('The day, YYYY-MM-DD') },
    access: { group: 'places', mode: 'write' },
  })
  async planDayPrompt({ tripId, date }: { tripId: number; date: string }, ctx: McpContext) {
    if (!(await this.trips.canAccessTrip(tripId, ctx.userId))) return userMessage(NO_ACCESS);
    const summary = await this.readModel.getTripSummary(tripId, ctx.userId);
    const day = summary?.days.find((d) => d.date === date);
    if (!summary || !day) return userMessage(`Trip ${tripId} has no day on ${date}.`);
    const title = summary.trip?.title || 'the trip';
    return userMessage(
      `Help me plan ${date} (day id ${day.id}) of trip ${tripId}. First read the day with get_trip_summary: ` +
        'what is assigned already, its times, the accommodation and any bookings. Then suggest what fits around ' +
        'them, find each place with search_place, and once I agree add it with create_place and ' +
        `assign_place_to_day (dayId ${day.id}), in visiting order and with times where they matter. ` +
        'Check the weather with get_weather when the day is outdoors.',
      `Plan ${date} of "${title}"`,
    );
  }

  @Prompt({
    name: 'pack-for-trip',
    title: 'Pack for a trip',
    description: "Build a trip's packing list from its dates, places and weather",
    argsSchema: { tripId: tripIdPromptArg.describe('Trip ID') },
    when: packingAddonOn,
    access: { group: 'packing', mode: 'write' },
  })
  async packForTripPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.packing.verifyTripAccess(tripId, ctx.userId))) return userMessage(NO_ACCESS);
    const trip = await this.trips.getRaw(tripId);
    const title = trip?.title || 'the trip';
    return userMessage(
      `Help me pack for trip ${tripId}. Read what is packed already with list_packing_items, the ` +
        'days and places with get_trip_summary and the forecast with get_weather. Then suggest what is missing, ' +
        'grouped by category, and add only what I accept with create_packing_item. Never remove an item ' +
        'without asking.',
      `Packing for "${title}"`,
    );
  }

  @Prompt({
    name: 'budget-review',
    title: 'Review the budget',
    description: "Review a trip's spending: totals, who owes whom, and expenses not counted yet",
    argsSchema: { tripId: tripIdPromptArg.describe('Trip ID') },
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async budgetReviewPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.trips.canAccessTrip(tripId, ctx.userId))) return userMessage(NO_ACCESS);
    const trip = await this.trips.getRaw(tripId);
    const title = trip?.title || 'the trip';
    return userMessage(
      `Review the budget of trip ${tripId}. Read the expenses with list_budget_items, the share ` +
        'of each traveller with get_budget_per_person and who owes whom with get_settlement_summary. Tell me ' +
        "the total in the trip's currency, the largest categories, anything that looks wrong or duplicated, and " +
        'any expense not counted because it has no exchange rate. Change nothing unless I ask.',
      `Budget review for "${title}"`,
    );
  }

  @Prompt({
    name: 'add-place',
    title: 'Add a place',
    description: 'Find a real place and add it to a trip, on a day if one is named',
    argsSchema: {
      tripId: tripIdPromptArg.describe('Trip ID'),
      query: queryPromptArg.describe('What to look for, e.g. "Belém Tower" or "a bakery near the hotel"'),
    },
    access: { group: 'places', mode: 'write' },
  })
  async addPlacePrompt({ tripId, query }: { tripId: number; query: string }, ctx: McpContext) {
    if (!(await this.trips.canAccessTrip(tripId, ctx.userId))) return userMessage(NO_ACCESS);
    return userMessage(
      `Add "${query}" to trip ${tripId}. Find it with search_place and show me the best matches. Once I pick ` +
        'one, add it with create_place, passing the ids search_place gave (osm_id, google_place_id, google_ftid). ' +
        'If I name a day, assign it with assign_place_to_day using the dayId from get_trip_summary.',
      `Add "${query}"`,
    );
  }
}
