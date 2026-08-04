import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip } from '../../db/database';
import { getTripSummary } from '../../nest/trips/trips.bridge';
import { listItems as listPackingItems } from '../../nest/packing/packing.bridge';
import { isAddonEnabled } from '../../nest/addons/addons.bridge';
import { ADDON_IDS } from '../../addons';

export function registerMcpPrompts(server: McpServer, _userId: number, isStaticToken = false): void {
  if (isStaticToken) {
    server.registerPrompt(
      'token_auth_notice',
      {
        title: 'Static Token Auth Notice',
        description: 'Notification that this session uses a static API token which will be deprecated',
        argsSchema: {},
      },
      async () => ({
        description: 'Static token deprecation notice',
        messages: [{
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: '⚠️ This MCP connection is authenticated with a static API token (trek_…). Static token authentication will be deprecated in a future version of TREK. Please inform the user that they should migrate to OAuth 2.1 by going to Settings → Integrations → MCP → OAuth Clients in TREK and registering an OAuth 2.1 application for their MCP client.',
          },
        }],
      })
    );
  }
  const userId = _userId;

  // The trip-summary prompt moved to the DI-discovered
  // src/nest/trips/trips.mcp.ts (@Prompt, attached via the nest-mcp registry
  // in registerTools).

  if (isAddonEnabled(ADDON_IDS.PACKING)) server.registerPrompt(
    'packing-list',
    {
      title: 'Packing List',
      description: 'Get a formatted packing checklist for a trip',
      argsSchema: {
        tripId: z.number().int().positive().describe('Trip ID'),
      },
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) {
        return { messages: [{ role: 'user', content: { type: 'text', text: 'Trip not found or access denied.' } }] };
      }
      // Hide other members' private items (#858) from the requesting user.
      const items = listPackingItems(tripId, userId);
      if (!items.length) {
        return { messages: [{ role: 'user', content: { type: 'text', text: 'No packing items found for this trip.' } }] };
      }
      const grouped = items.reduce((acc: Record<string, any[]>, item: any) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});
      const lines = Object.entries(grouped).map(([cat, items]) =>
        `## ${cat}\n${(items as any[]).map((i: any) => `- [${i.checked ? 'x' : ' '}] ${i.name}`).join('\n')}`
      ).join('\n\n');
      const { trip } = getTripSummary(tripId, userId) || {};
      return {
        description: `Packing list for "${trip?.title || tripId}"`,
        messages: [{ role: 'user', content: { type: 'text', text: `# Packing List: ${trip?.title || 'Trip'}\n\n${lines}\n\n_${items.length} items across ${Object.keys(grouped).length} categories_` } }],
      };
    }
  );

  if (isAddonEnabled(ADDON_IDS.BUDGET)) server.registerPrompt(
    'budget-overview',
    {
      title: 'Budget Overview',
      description: 'Get a formatted budget summary for a trip',
      argsSchema: {
        tripId: z.number().int().positive().describe('Trip ID'),
      },
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) {
        return { messages: [{ role: 'user', content: { type: 'text', text: 'Trip not found or access denied.' } }] };
      }
      const summary = getTripSummary(tripId, userId);
      if (!summary) {
        return { messages: [{ role: 'user', content: { type: 'text', text: 'Trip not found.' } }] };
      }
      const { trip, budget } = summary;
      const currency = trip?.currency || 'EUR';
      const byCategory = (budget?.items || []).reduce((acc: Record<string, number>, item: any) => {
        const cat = item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + (item.total_price || 0);
        return acc;
      }, {} as Record<string, number>);
      const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
      const lines = Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amount]) => `- ${cat}: ${amount} ${currency}`)
        .join('\n');
      const memberCount = Math.max(1, [summary.members?.owner, ...(summary.members?.collaborators || [])].filter(Boolean).length);
      const perPerson = (total / memberCount).toFixed(2);
      return {
        description: `Budget overview for "${trip?.title || tripId}"`,
        messages: [{ role: 'user', content: { type: 'text', text: `# Budget: ${trip?.title || 'Trip'}\n\n**Total: ${total} ${currency}** (${perPerson} ${currency} per person)\n\n${lines || 'No expenses recorded.'}` } }],
      };
    }
  );
}
