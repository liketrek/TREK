import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { isDemoUser } from '../../services/authService';
import {
  addContributor, addTripToJourney, canAccessJourney, createEntry, createJourney,
  deleteEntry, deleteJourney, getJourneyFull, getSuggestions, listEntries,
  listJourneys, listUserTrips, removeContributor, removeTripFromJourney,
  reorderEntries, updateContributorRole, updateEntry, updateJourney,
  updateJourneyPreferences,
} from '../../services/journeyService';
import {
  createOrUpdateJourneyShareLink, deleteJourneyShareLink, getJourneyShareLink,
} from '../../services/journeyShareService';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import {
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  demoDenied, ok,
} from './_shared';
import { canRead, canShareJourneys, canWrite } from '../scopes';

function notFound(msg: string) {
  return { content: [{ type: 'text' as const, text: msg }], isError: true };
}

export function registerJourneyTools(server: McpServer, userId: number, scopes: string[] | null): void {
  if (!isAddonEnabled(ADDON_IDS.JOURNEY)) return;

  const R = canRead(scopes, 'journey');
  const W = canWrite(scopes, 'journey');
  const S = canShareJourneys(scopes);

  // --- READ TOOLS ---

  if (R) server.registerTool(
    'list_journeys',
    {
      description: 'List all journeys owned or contributed to by the current user.',
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async () => {
      const journeys = listJourneys(userId);
      return ok({ journeys });
    }
  );

  if (R) server.registerTool(
    'get_journey',
    {
      description: 'Get a full journey including entries, contributors, and linked trips.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ journeyId }) => {
      const journey = getJourneyFull(journeyId, userId);
      if (!journey) return notFound('Journey not found or access denied.');
      return ok({ journey });
    }
  );

  if (R) server.registerTool(
    'list_journey_entries',
    {
      description: 'List all entries in a journey.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ journeyId }) => {
      if (!canAccessJourney(journeyId, userId)) return notFound('Journey not found or access denied.');
      const entries = listEntries(journeyId, userId);
      return ok({ entries });
    }
  );

  if (R) server.registerTool(
    'list_journey_contributors',
    {
      description: 'List all contributors (owner and collaborators) of a journey.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ journeyId }) => {
      const journey = getJourneyFull(journeyId, userId);
      if (!journey) return notFound('Journey not found or access denied.');
      return ok({ contributors: (journey as any).contributors ?? [] });
    }
  );

  if (R) server.registerTool(
    'get_journey_suggestions',
    {
      description: 'Get trip suggestions for creating a new journey (recently completed trips not yet in any journey).',
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async () => {
      const trips = getSuggestions(userId);
      return ok({ trips });
    }
  );

  if (R) server.registerTool(
    'list_journey_available_trips',
    {
      description: 'List all trips available to link to a journey.',
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async () => {
      const trips = listUserTrips(userId);
      return ok({ trips });
    }
  );

  // --- WRITE TOOLS ---

  if (W) server.registerTool(
    'create_journey',
    {
      description: 'Create a new journey, optionally linking existing trips.',
      inputSchema: {
        title: z.string().min(1).max(200),
        subtitle: z.string().max(300).optional(),
        trip_ids: z.array(z.number().int().positive()).optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ title, subtitle, trip_ids }) => {
      if (isDemoUser(userId)) return demoDenied();
      const journey = createJourney(userId, { title, subtitle, trip_ids });
      // Return the fully-hydrated journey (entries/contributors/trips/stats/my_role),
      // matching get_journey, rather than the bare row.
      return ok({ journey: getJourneyFull(journey.id, userId) ?? journey });
    }
  );

  if (W) server.registerTool(
    'update_journey',
    {
      description: 'Update an existing journey\'s title, subtitle, cover, or status. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        title: z.string().min(1).max(200).optional(),
        subtitle: z.string().max(300).optional(),
        status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ journeyId, title, subtitle, status }) => {
      if (isDemoUser(userId)) return demoDenied();
      const journey = updateJourney(journeyId, userId, { title, subtitle, status });
      if (!journey) return notFound('Journey not found or access denied.');
      return ok({ journey });
    }
  );

  if (W) server.registerTool(
    'delete_journey',
    {
      description: 'Delete a journey. Owner only — this cannot be undone.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ journeyId }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = deleteJourney(journeyId, userId);
      if (!success) return notFound('Journey not found or access denied.');
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'add_journey_trip',
    {
      description: 'Link a trip to a journey. Syncs skeleton entries for all places in the trip.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        tripId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ journeyId, tripId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessJourney(journeyId, userId)) return notFound('Journey not found or access denied.');
      const success = addTripToJourney(journeyId, tripId, userId);
      return ok({ success });
    }
  );

  if (W) server.registerTool(
    'remove_journey_trip',
    {
      description: 'Unlink a trip from a journey. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        tripId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ journeyId, tripId }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = removeTripFromJourney(journeyId, tripId, userId);
      if (!success) return notFound('Journey not found or access denied.');
      return ok({ success });
    }
  );

  if (W) server.registerTool(
    'create_journey_entry',
    {
      description: 'Create a new entry in a journey.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Entry date (YYYY-MM-DD)'),
        title: z.string().max(300).optional(),
        story: z.string().optional(),
        entry_time: z.string().optional().describe('Time of day (e.g. "14:30")'),
        location_name: z.string().optional(),
        mood: z.string().optional(),
        sort_order: z.number().int().min(0).optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ journeyId, entry_date, title, story, entry_time, location_name, mood, sort_order }) => {
      if (isDemoUser(userId)) return demoDenied();
      const entry = createEntry(journeyId, userId, { entry_date, title, story, entry_time, location_name, mood, sort_order });
      if (!entry) return notFound('Journey not found or access denied.');
      // Return through the listEntries enrichment (parsed tags/pros_cons, photos, source_trip_name).
      const enriched = listEntries(journeyId, userId)?.find(e => e.id === entry.id) ?? entry;
      return ok({ entry: enriched });
    }
  );

  if (W) server.registerTool(
    'update_journey_entry',
    {
      description: 'Update an existing journey entry.',
      inputSchema: {
        entryId: z.number().int().positive(),
        title: z.string().max(300).optional(),
        story: z.string().optional(),
        entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        entry_time: z.string().optional(),
        mood: z.string().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ entryId, title, story, entry_date, entry_time, mood }) => {
      if (isDemoUser(userId)) return demoDenied();
      const entry = updateEntry(entryId, userId, { title, story, entry_date, entry_time, mood }, undefined);
      if (!entry) return notFound('Entry not found or access denied.');
      // Return through the listEntries enrichment (parsed tags/pros_cons, photos), matching create_journey_entry.
      const enriched = listEntries(entry.journey_id, userId)?.find(e => e.id === entry.id) ?? entry;
      return ok({ entry: enriched });
    }
  );

  if (W) server.registerTool(
    'delete_journey_entry',
    {
      description: 'Delete a journey entry.',
      inputSchema: {
        entryId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ entryId }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = deleteEntry(entryId, userId, undefined);
      if (!success) return notFound('Entry not found or access denied.');
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'reorder_journey_entries',
    {
      description: 'Reorder entries within a journey by providing the desired order of entry IDs.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        orderedIds: z.array(z.number().int().positive()),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ journeyId, orderedIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = reorderEntries(journeyId, userId, orderedIds, undefined);
      if (!success) return notFound('Journey not found, access denied, or entry IDs do not belong to this journey.');
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'add_journey_contributor',
    {
      description: 'Add a contributor to a journey. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        targetUserId: z.number().int().positive(),
        role: z.enum(['editor', 'viewer']),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ journeyId, targetUserId, role }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = addContributor(journeyId, userId, targetUserId, role);
      if (!success) return notFound('Journey not found or access denied.');
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'update_journey_contributor_role',
    {
      description: 'Update the role of a journey contributor. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        targetUserId: z.number().int().positive(),
        role: z.enum(['editor', 'viewer']),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ journeyId, targetUserId, role }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = updateContributorRole(journeyId, userId, targetUserId, role);
      if (!success) return notFound('Journey not found or access denied.');
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'remove_journey_contributor',
    {
      description: 'Remove a contributor from a journey. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
        targetUserId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ journeyId, targetUserId }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = removeContributor(journeyId, userId, targetUserId);
      if (!success) return notFound('Journey not found or access denied.');
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'update_journey_preferences',
    {
      description: 'Update per-user preferences for a journey (e.g. hide skeleton entries).',
      inputSchema: {
        journeyId: z.number().int().positive(),
        hide_skeletons: z.boolean().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ journeyId, hide_skeletons }) => {
      if (isDemoUser(userId)) return demoDenied();
      const result = updateJourneyPreferences(journeyId, userId, { hide_skeletons });
      if (!result) return notFound('Journey not found or access denied.');
      // Return the service result ({ hide_skeletons }), matching the REST route.
      return ok(result);
    }
  );

  // --- SHARE TOOLS ---

  if (S) server.registerTool(
    'get_journey_share_link',
    {
      description: 'Get the current public share link for a journey. Returns null if none exists.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ journeyId }) => {
      if (!canAccessJourney(journeyId, userId)) return notFound('Journey not found or access denied.');
      const shareLink = getJourneyShareLink(journeyId);
      return ok({ shareLink });
    }
  );

  if (S) server.registerTool(
    'create_journey_share_link',
    {
      description: 'Create or update the public share link for a journey. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ journeyId }) => {
      if (isDemoUser(userId)) return demoDenied();
      const shareLink = createOrUpdateJourneyShareLink(journeyId, userId, {});
      if (!shareLink) return notFound('Journey not found or access denied.');
      return ok({ shareLink });
    }
  );

  if (S) server.registerTool(
    'delete_journey_share_link',
    {
      description: 'Revoke the public share link for a journey. Owner only.',
      inputSchema: {
        journeyId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ journeyId }) => {
      if (isDemoUser(userId)) return demoDenied();
      const success = deleteJourneyShareLink(journeyId, userId);
      if (!success) return notFound('Journey not found or access denied.');
      return ok({ success: true });
    }
  );
}
