import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { ADDON_IDS } from '../../addons';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AuthService } from '../auth/auth.service';
import { AcceptError, DawarichSuggestionsService } from './dawarich-suggestions.service';
import { DawarichTracksService } from './dawarich-tracks.service';

/** Same gate as the controller's @RequireAddon(ADDON_IDS.DAWARICH): no addon, no tool. */
const dawarichAddonOn = addonGate(ADDON_IDS.DAWARICH);

/**
 * A stay list is short by nature — a day of travel produces a handful — but a
 * year of them is not, and an assistant paying for the whole backlog on every
 * turn is the failure mode. The browser can afford the full list because a
 * human scrolls it.
 */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Dawarich MCP surface — the review half of the integration, mirroring
 * `/api/integrations/dawarich/suggestions` and the track overlay.
 *
 * The scopes are chosen by **what each tool writes**, not by what domain the
 * data came from, which is why accepting is three tools rather than one with a
 * `target` parameter: creating a place is `places:write`, writing a journal
 * entry is `journey:write`, and ticking off a wish is `atlas:write`. A single
 * tool would have to claim the union of all three, and a caller that only
 * wanted to fill in a journal would be holding a credential that can also edit
 * an itinerary.
 *
 * Reading the suggestions themselves rides `journey:read`. They are candidate
 * journal entries before they are anything else, and that is the narrowest
 * existing scope that honestly covers "stays this person recorded".
 *
 * The connection routes (settings, test, disconnect) are deliberately absent:
 * they take an API key for somebody's complete location history, and that is
 * exactly what no assistant scope should be able to read or replace.
 */
@McpController()
export class DawarichMcp {
  constructor(
    private readonly suggestions: DawarichSuggestionsService,
    private readonly tracks: DawarichTracksService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_dawarich_suggestions',
    description:
      "List the stays TREK pulled from the caller's connected Dawarich instance and is holding for review: where they were, when they arrived and left, how long they stayed, and which trip the stay falls into. Each entry carries the id the accept tools take. Use it to answer what someone actually did on a trip, or to fill a travel journal from what was recorded rather than from memory. Nothing here has been added to a trip yet — accepting is a separate, explicit step.",
    inputSchema: {
      tripId: z.number().int().positive().optional().describe('Only stays that fall inside this trip'),
      state: z.enum(['new', 'accepted', 'dismissed']).optional()
        .describe('Default: every state. "new" is the review backlog.'),
      limit: z.number().int().min(1).max(MAX_LIMIT).optional()
        .describe(`Maximum stays to return, most recent first (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`),
    },
    // Reads TREK's own table; the fetch from the remote instance happens on a cron.
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'journey', mode: 'read' },
    when: dawarichAddonOn,
  })
  listSuggestions(
    { tripId, state, limit }: { tripId?: number; state?: 'new' | 'accepted' | 'dismissed'; limit?: number },
    ctx: McpContext,
  ) {
    const all = this.suggestions.list(ctx.userId, { tripId, state });
    const cap = limit ?? DEFAULT_LIMIT;
    const page = all.suggestions.slice(0, cap);
    return ok({
      suggestions: page,
      total: all.suggestions.length,
      truncated: all.suggestions.length > page.length,
      connected: all.connected,
      lastSyncAt: all.lastSyncAt,
      lastSyncState: all.lastSyncState,
    });
  }

  @Tool({
    name: 'accept_dawarich_suggestion_as_place',
    description:
      'Turn a reviewed Dawarich stay into a place on a trip, optionally pinned to one of its days. Call list_dawarich_suggestions first for the id. Correct the name or the coordinates in the same call if the detector got them wrong — that is what the review step is for. Use this when the stay is somewhere worth having on the itinerary; use accept_dawarich_suggestion_as_journal_entry when it is a moment worth writing about instead.',
    inputSchema: {
      suggestionId: z.number().int().positive(),
      tripId: z.number().int().positive().optional().describe('Defaults to the trip the stay fell into'),
      dayId: z.number().int().positive().optional().describe('Pin it to this day; omitted leaves it unplanned'),
      name: z.string().trim().min(1).max(255).optional(),
      notes: z.string().max(5000).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
    when: dawarichAddonOn,
  })
  acceptAsPlace(
    args: { suggestionId: number; tripId?: number; dayId?: number; name?: string; notes?: string; lat?: number; lng?: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const { suggestionId, ...rest } = args;
    return this.run(() => this.suggestions.accept(ctx.userId, suggestionId, { target: 'place', ...rest }));
  }

  @Tool({
    name: 'accept_dawarich_suggestion_as_journal_entry',
    description:
      "Turn a reviewed Dawarich stay into a dated entry in a travel journal. Call list_dawarich_suggestions first for the id. The stay's own date, arrival time, name and coordinates prefill the entry; pass a title or a story to write it properly rather than leaving the detector's label. Use this to fill in a journal after a trip from what was actually recorded.",
    inputSchema: {
      suggestionId: z.number().int().positive(),
      journalId: z.number().int().positive().describe('The journey the entry is added to'),
      name: z.string().trim().min(1).max(255).optional().describe('Entry title; defaults to the stay name'),
      notes: z.string().max(5000).optional().describe('The story text'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'journey', mode: 'write' },
    when: dawarichAddonOn,
  })
  acceptAsJournalEntry(
    args: { suggestionId: number; journalId: number; name?: string; notes?: string; date?: string; time?: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const { suggestionId, ...rest } = args;
    return this.run(() => this.suggestions.accept(ctx.userId, suggestionId, { target: 'journal', ...rest }));
  }

  @Tool({
    name: 'mark_bucket_list_item_visited_from_dawarich',
    description:
      "Tick a bucket-list wish off because a recorded stay proves the caller got there. Call list_dawarich_suggestions first: a stay that sits on top of a wish already carries its id as matchedBucketListItemId. Use it when someone asks which of the places they wanted to see they have actually reached.",
    inputSchema: {
      suggestionId: z.number().int().positive(),
      bucketListItemId: z.number().int().positive().optional()
        .describe('Defaults to the wish the stay was matched to'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'atlas', mode: 'write' },
    when: dawarichAddonOn,
  })
  markBucketVisited(
    { suggestionId, bucketListItemId }: { suggestionId: number; bucketListItemId?: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    return this.run(() =>
      this.suggestions.accept(ctx.userId, suggestionId, { target: 'bucket_list', bucketListItemId }),
    );
  }

  @Tool({
    name: 'dismiss_dawarich_suggestion',
    description:
      'Take a Dawarich stay out of the review list without adding it anywhere, or put a dismissed one back. Use it for the stays a detector produces that are not places anyone went — a traffic jam, a car park, the office.',
    inputSchema: {
      suggestionId: z.number().int().positive(),
      state: z.enum(['dismissed', 'new']).optional().describe('Default: dismissed'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'journey', mode: 'write' },
    when: dawarichAddonOn,
  })
  dismiss(
    { suggestionId, state }: { suggestionId: number; state?: 'dismissed' | 'new' },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const updated = this.suggestions.setState(ctx.userId, suggestionId, state ?? 'dismissed');
    if (!updated) return errorResult('Suggestion not found');
    return ok({ suggestion: updated });
  }

  @Tool({
    name: 'get_dawarich_trip_track',
    description:
      "Fetch the route actually recorded during a trip, grouped by local day, straight from the caller's Dawarich instance. Each day carries its segments with start and end times and, where Dawarich classified it, how it was travelled. Use it to answer what route someone really took, or how a day's movement compares with what was planned. Nothing is stored in TREK — this is a live read of the recording.",
    inputSchema: {
      tripId: z.number().int().positive(),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Narrow to this first day'),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Narrow to this last day'),
    },
    // Reaches a remote instance rather than TREK's own database.
    annotations: { ...TOOL_ANNOTATIONS_READONLY, openWorldHint: true },
    access: { group: 'journey', mode: 'read' },
    when: dawarichAddonOn,
  })
  async tripTrack(
    { tripId, from, to }: { tripId: number; from?: string; to?: string },
    ctx: McpContext,
  ) {
    let track;
    try {
      track = await this.tracks.forTrip(ctx.userId, tripId, from, to);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : 'Could not read the Dawarich recording');
    }
    if (!track) return errorResult('Trip not found');
    // The geometry is the whole payload and a month of it is enormous in a tool
    // result, so the summary goes out and the lines stay on the map.
    return ok({
      source: track.source,
      fetchedAt: track.fetchedAt,
      truncated: track.truncated,
      pointCount: track.pointCount,
      days: track.days.map((day) => ({
        date: day.date,
        segments: day.segments.map((segment) => ({
          mode: segment.mode,
          startedAt: segment.startedAt,
          endedAt: segment.endedAt,
          distanceMeters: segment.distanceMeters,
          points: segment.points.length,
        })),
      })),
    });
  }

  /** The MCP echo of the controller's error shaping: a refusal, not an exception. */
  private run<T>(action: () => T) {
    try {
      return ok(action() as object);
    } catch (err) {
      if (err instanceof AcceptError) return errorResult(err.message);
      throw err;
    }
  }
}
