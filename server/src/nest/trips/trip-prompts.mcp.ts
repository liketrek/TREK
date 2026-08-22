import { McpController, Prompt, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
import { ADDON_IDS } from '../../addons';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { PackingService } from '../packing/packing.service';
import { TripReadModelService } from '../trip-read-model/trip-read-model.service';
import { TripsService } from './trips.service';

const budgetAddonOn = addonGate(ADDON_IDS.BUDGET);
const packingAddonOn = addonGate(ADDON_IDS.PACKING);

/**
 * The two cross-domain prompts, relocated from budget.mcp.ts / packing.mcp.ts
 * (where the 1:1 port from src/mcp/tools/prompts.ts had left them). Both read
 * the whole-trip summary, and the read model lives ABOVE the budget/packing
 * modules — TripReadModelModule imports both — so hosting them down there
 * forced the trips.bridge seam. Here in the trips domain the summary is an
 * injection, and that bridge is deleted. Names, gates and payloads are
 * unchanged; the budget prompt's access check swaps
 * BudgetService.verifyTripAccess for TripsService.canAccessTrip, both of which
 * are the same DatabaseService.canAccessTrip call.
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
      tripId: z.number().int().positive().describe('Trip ID'),
    },
    when: budgetAddonOn,
  })
  async budgetOverviewPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.trips.canAccessTrip(tripId, ctx.userId)) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found or access denied.' } }] };
    }
    const summary = this.readModel.getTripSummary(tripId, ctx.userId);
    if (!summary) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found.' } }] };
    }
    const { trip, budget } = summary;
    const currency = trip?.currency || 'EUR';
    const byCategory = (budget?.items || []).reduce((acc: Record<string, number>, item: { category?: string; total_price?: number }) => {
      const cat = item.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + (item.total_price || 0);
      return acc;
    }, {} as Record<string, number>);
    const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0);
    const lines = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => `- ${cat}: ${amount} ${currency}`)
      .join('\n');
    const memberCount = Math.max(1, [summary.members?.owner, ...(summary.members?.collaborators || [])].filter(Boolean).length);
    const perPerson = (total / memberCount).toFixed(2);
    return {
      description: `Budget overview for "${trip?.title || tripId}"`,
      messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `# Budget: ${trip?.title || 'Trip'}\n\n**Total: ${total} ${currency}** (${perPerson} ${currency} per person)\n\n${lines || 'No expenses recorded.'}` } }],
    };
  }

  @Prompt({
    name: 'packing-list',
    title: 'Packing List',
    description: 'Get a formatted packing checklist for a trip',
    argsSchema: {
      tripId: z.number().int().positive().describe('Trip ID'),
    },
    when: packingAddonOn,
  })
  async packingListPrompt({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.packing.verifyTripAccess(tripId, ctx.userId)) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'Trip not found or access denied.' } }] };
    }
    // Hide other members' private items (#858) from the requesting user.
    const items = this.packing.listItems(tripId, ctx.userId);
    if (!items.length) {
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: 'No packing items found for this trip.' } }] };
    }
    const grouped = items.reduce((acc: Record<string, unknown[]>, item: { category?: string }) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    const lines = Object.entries(grouped).map(([cat, catItems]) =>
      `## ${cat}\n${(catItems as { checked?: unknown; name?: string }[]).map((i) => `- [${i.checked ? 'x' : ' '}] ${i.name}`).join('\n')}`
    ).join('\n\n');
    const { trip } = this.readModel.getTripSummary(tripId, ctx.userId) || {};
    return {
      description: `Packing list for "${trip?.title || tripId}"`,
      messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `# Packing List: ${trip?.title || 'Trip'}\n\n${lines}\n\n_${items.length} items across ${Object.keys(grouped).length} categories_` } }],
    };
  }
}
