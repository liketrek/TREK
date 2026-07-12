import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip } from '../../db/database';
import { getTripSummary } from '../../services/tripService';
import { listItems as listPackingItems } from '../../services/packingService';
import { isAddonEnabled } from '../../services/adminService';
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

  server.registerPrompt(
    'trip-summary',
    {
      title: 'Trip Summary',
      description: 'Load a full summary of a trip for context before planning or modifications',
      argsSchema: {
        tripId: z.number().int().positive().describe('Trip ID to summarize'),
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
      const { trip, days, members, budget, packing, reservations, collab_notes } = summary;
      const memberList = [members?.owner, ...(members?.collaborators || [])].filter(Boolean);
      const text = `Trip: ${trip?.title || 'Untitled'}${trip?.description ? `\n${trip.description}` : ''}
Dates: ${trip?.start_date || '?'} to ${trip?.end_date || '?'}
Members: ${memberList.length} (${memberList.map((m: any) => m.name || m.email).join(', ') || 'none'})
Days: ${days?.length || 0}
Packing: ${packing?.checked || 0}/${packing?.total || 0} items packed
Budget: ${budget?.total || 0} ${trip?.currency || 'EUR'} total
Reservations: ${reservations?.length || 0}
Collab Notes: ${collab_notes?.length || 0}
${days?.map((d: any, i: number) => `Day ${i + 1} (${d.date}): ${d.assignments?.length || 0} places${d.title ? ` - ${d.title}` : ''}`).join('\n') || 'No days yet'}`;
      return {
        description: `Summary of trip "${trip?.title || tripId}"`,
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );

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
