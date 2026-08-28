import {
  McpController, Tool, Resource, ResourceTemplate,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  demoDenied, ok, type McpContext,
} from '../../nest-mcp';
import { z } from 'zod';
import { ADDON_IDS } from '../../addons';
import { JourneyDomainService } from './journey-domain.service';
import { JourneyShareService } from './journey-share.service';
import type { JourneyContributor } from '../../types';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AuthService } from '../auth/auth.service';
import { PhotoCaptureBackfillService } from '../memories/photo-capture-backfill.service';

/** Legacy registrar gate: the whole journey surface rode the journey addon. */
const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

function notFound(msg: string) {
  return { content: [{ type: 'text' as const, text: msg }], isError: true };
}

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function accessDenied(uri: string) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: 'Trip not found or access denied' }),
    }],
  };
}

function jsonContent(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

/*
 * The three entry fields with a fixed set of values. `journey_entries.type` and
 * `.visibility` are plain TEXT columns and the REST route forwards whatever the
 * client sent, but the row type (JourneyEntry in src/types) only ever models
 * these, so the tools name them rather than take a free string: a model that
 * invents "friends-only" would write a value nothing reads.
 */
const ENTRY_TYPE = z.enum(['entry', 'checkin', 'skeleton']);
const ENTRY_VISIBILITY = z.enum(['private', 'shared', 'public']);
type EntryType = z.infer<typeof ENTRY_TYPE>;
type EntryVisibility = z.infer<typeof ENTRY_VISIBILITY>;

/**
 * The verdict on a place. Either side defaults to empty so a caller can send
 * only the half it has, which is what the entry editor does when a place was
 * all good or all bad. The service stores nothing when both come back empty.
 */
const PROS_CONS = z.object({
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});

/**
 * The photo backends a journey can reference. The REST route forwards whatever
 * `provider` string the body carried straight into `trek_photos.provider`, which
 * would let a model persist a row no resolver can ever match to a backend.
 */
const PHOTO_PROVIDER = z.enum(['immich', 'synologyphotos']);

/**
 * How many provider assets one call may attach. The REST route takes an
 * unbounded array, but it is driven by a picker where every id was clicked;
 * a tool call is not, and each id is a row plus a detached provider lookup.
 */
const MAX_PROVIDER_PHOTOS_PER_CALL = 100;

/**
 * Journey MCP surface — ported 1:1 from the legacy registrar
 * src/mcp/tools/journey.ts (23 tools): identical names, descriptions, zod input
 * schemas, annotations, and error/payload shapes. The legacy `if (R)` / `if (W)`
 * checks become declarative read/write markers; the three `if (S)` share tools
 * become `{ group: 'journey', mode: 'share' }`, which is why McpAccessMode is
 * host-augmentable now — canShareJourneys was the one scope the old two-mode
 * marker could not express, and folding it into a predicate would have put it
 * out of reach of the boot-time scope gate. The registration-time addon
 * early-return becomes the `when:` gate.
 *
 * Since the port the surface has grown past the legacy 23: the two entry tools
 * take the rest of the columns their REST routes always accepted (a place, its
 * coordinates, weather, tags, the verdict), and get_journey_stats answers what
 * GET /api/journeys/:id/stats answers.
 *
 * So does add_journey_provider_photos, which brings across
 * POST /api/journeys/entries/:entryId/provider-photos and its gallery twin
 * POST /api/journeys/:id/gallery/provider-photos. Finding the asset ids it takes
 * is the memories domain's half of the same job, in memories/memories.mcp.ts.
 */
@McpController()
export class JourneyMcp {
  constructor(
    private readonly journey: JourneyDomainService,
    private readonly share: JourneyShareService,
    readonly addons: AddonsService,
    private readonly auth: AuthService,
    private readonly captureBackfill: PhotoCaptureBackfillService,
  ) {}

  // ── Read ────────────────────────────────────────────────────────────────

  @Tool({
    name: 'list_journeys',
    description: 'List all journeys owned or contributed to by the current user.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  listJourneys(_args: unknown, ctx: McpContext) {
    return ok({ journeys: this.journey.listJourneys(ctx.userId) });
  }

  @Tool({
    name: 'get_journey',
    description: 'Get a full journey including entries, contributors, and linked trips.',
    inputSchema: { journeyId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  getJourney({ journeyId }: { journeyId: number }, ctx: McpContext) {
    const journey = this.journey.getJourneyFull(journeyId, ctx.userId);
    if (!journey) return notFound('Journey not found or access denied.');
    return ok({ journey });
  }

  @Tool({
    name: 'get_journey_stats',
    description: 'What a journey adds up to: distance travelled in metres, calendar days spanned, countries in visit order, the furthest point reached, and entry, photo and place counts. Prefer this over get_journey whenever the question is about totals, since the stats get_journey carries are three counts and nothing else.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      include_route: z.boolean().optional().describe('Also return the route itself, up to 400 stops with coordinates. Off by default: the totals and the country list do not need it.'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  getJourneyStats({ journeyId, include_route }: { journeyId: number; include_route?: boolean }, ctx: McpContext) {
    const stats = this.journey.journeyStats(journeyId, ctx.userId);
    if (!stats) return notFound('Journey not found or access denied.');
    // Same payload as GET /api/journeys/:id/stats. The route is left out unless
    // it was asked for: 400 coordinate pairs answer a different question than
    // the totals do, and Studio is the caller that actually draws them.
    if (include_route) return ok({ stats });
    const { points: _route, ...totals } = stats;
    return ok({ stats: totals });
  }

  @Tool({
    name: 'list_journey_entries',
    description: 'List all entries in a journey.',
    inputSchema: { journeyId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  listJourneyEntries({ journeyId }: { journeyId: number }, ctx: McpContext) {
    if (!this.journey.canAccessJourney(journeyId, ctx.userId)) return notFound('Journey not found or access denied.');
    return ok({ entries: this.journey.listEntries(journeyId, ctx.userId) });
  }

  @Tool({
    name: 'list_journey_contributors',
    description: 'List all contributors (owner and collaborators) of a journey.',
    inputSchema: { journeyId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  listJourneyContributors({ journeyId }: { journeyId: number }, ctx: McpContext) {
    const journey = this.journey.getJourneyFull(journeyId, ctx.userId);
    if (!journey) return notFound('Journey not found or access denied.');
    return ok({ contributors: (journey as { contributors?: JourneyContributor[] }).contributors ?? [] });
  }

  @Tool({
    name: 'get_journey_suggestions',
    description: 'Get trip suggestions for creating a new journey (recently completed trips not yet in any journey).',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  getJourneySuggestions(_args: unknown, ctx: McpContext) {
    return ok({ trips: this.journey.getSuggestions(ctx.userId) });
  }

  @Tool({
    name: 'list_journey_available_trips',
    description: 'List all trips available to link to a journey.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  listJourneyAvailableTrips(_args: unknown, ctx: McpContext) {
    return ok({ trips: this.journey.listUserTrips(ctx.userId) });
  }

  // ── Write ───────────────────────────────────────────────────────────────

  @Tool({
    name: 'create_journey',
    description: 'Create a new journey, optionally linking existing trips.',
    inputSchema: {
      title: z.string().min(1).max(200),
      subtitle: z.string().max(300).optional(),
      trip_ids: z.array(z.number().int().positive()).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  createJourney(
    { title, subtitle, trip_ids }: { title: string; subtitle?: string; trip_ids?: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const journey = this.journey.createJourney(ctx.userId, { title, subtitle, trip_ids });
    // Return the fully-hydrated journey (entries/contributors/trips/stats/my_role),
    // matching get_journey, rather than the bare row.
    return ok({ journey: this.journey.getJourneyFull(journey.id, ctx.userId) ?? journey });
  }

  @Tool({
    name: 'update_journey',
    description: "Update an existing journey's title, subtitle, cover, or status. Owner only.",
    inputSchema: {
      journeyId: z.number().int().positive(),
      title: z.string().min(1).max(200).optional(),
      subtitle: z.string().max(300).optional(),
      status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  updateJourney(
    { journeyId, title, subtitle, status }: { journeyId: number; title?: string; subtitle?: string; status?: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const journey = this.journey.updateJourney(journeyId, ctx.userId, { title, subtitle, status });
    if (!journey) return notFound('Journey not found or access denied.');
    return ok({ journey });
  }

  @Tool({
    name: 'delete_journey',
    description: 'Delete a journey. Owner only — this cannot be undone.',
    inputSchema: { journeyId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  deleteJourney({ journeyId }: { journeyId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.journey.deleteJourney(journeyId, ctx.userId)) return notFound('Journey not found or access denied.');
    return ok({ success: true });
  }

  @Tool({
    name: 'add_journey_trip',
    description: 'Link a trip to a journey. Syncs skeleton entries for all places in the trip.',
    inputSchema: { journeyId: z.number().int().positive(), tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  addJourneyTrip({ journeyId, tripId }: { journeyId: number; tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.journey.canAccessJourney(journeyId, ctx.userId)) return notFound('Journey not found or access denied.');
    return ok({ success: this.journey.addTripToJourney(journeyId, tripId, ctx.userId) });
  }

  @Tool({
    name: 'remove_journey_trip',
    description: 'Unlink a trip from a journey. Owner only.',
    inputSchema: { journeyId: z.number().int().positive(), tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  removeJourneyTrip({ journeyId, tripId }: { journeyId: number; tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const success = this.journey.removeTripFromJourney(journeyId, tripId, ctx.userId);
    if (!success) return notFound('Journey not found or access denied.');
    return ok({ success });
  }

  @Tool({
    name: 'create_journey_entry',
    description: 'Create a new entry in a journey. Give location_lat/location_lng whenever the place is known, otherwise the entry is text-only and never appears on the journey map or in its distance.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Entry date (YYYY-MM-DD)'),
      title: z.string().max(300).optional(),
      story: z.string().optional(),
      entry_time: z.string().optional().describe('Time of day (e.g. "14:30")'),
      location_name: z.string().optional(),
      location_lat: z.number().min(-90).max(90).optional().describe('Latitude; needed, with location_lng, to place the entry on the journey map'),
      location_lng: z.number().min(-180).max(180).optional(),
      mood: z.string().optional(),
      weather: z.string().max(100).optional().describe('Weather as the traveller recorded it (e.g. "sunny", "24C and windy")'),
      tags: z.array(z.string()).optional(),
      pros_cons: PROS_CONS.optional().describe('The verdict on the place: what was worth it and what was not'),
      visibility: ENTRY_VISIBILITY.optional().describe('Defaults to private; "shared" and "public" expose the entry through the journey share link'),
      type: ENTRY_TYPE.optional().describe('Defaults to "entry"; "skeleton" is the stub TREK derives from a trip place and hides behind the hide-skeletons preference'),
      sort_order: z.number().int().min(0).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  createJourneyEntry(
    { journeyId, ...data }: {
      journeyId: number; entry_date: string; title?: string; story?: string; entry_time?: string;
      location_name?: string; location_lat?: number; location_lng?: number; mood?: string; weather?: string;
      tags?: string[]; pros_cons?: { pros: string[]; cons: string[] }; visibility?: EntryVisibility;
      type?: EntryType; sort_order?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const entry = this.journey.createEntry(journeyId, ctx.userId, data);
    if (!entry) return notFound('Journey not found or access denied.');
    // Return through the listEntries enrichment (parsed tags/pros_cons, photos, source_trip_name).
    const enriched = this.journey.listEntries(journeyId, ctx.userId)?.find(e => e.id === entry.id) ?? entry;
    return ok({ entry: enriched });
  }

  @Tool({
    name: 'update_journey_entry',
    description: 'Update an existing journey entry: its text, date, place, coordinates, weather, tags, verdict or visibility. Fields left out keep their value; pass null to clear one. To move an entry within its day use reorder_journey_entries rather than setting sort_order here.',
    inputSchema: {
      entryId: z.number().int().positive(),
      title: z.string().max(300).nullable().optional(),
      story: z.string().nullable().optional(),
      entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      entry_time: z.string().nullable().optional(),
      location_name: z.string().nullable().optional(),
      location_lat: z.number().min(-90).max(90).nullable().optional().describe('Latitude, or null to take the entry off the journey map'),
      location_lng: z.number().min(-180).max(180).nullable().optional(),
      mood: z.string().nullable().optional(),
      weather: z.string().max(100).nullable().optional(),
      tags: z.array(z.string()).nullable().optional(),
      pros_cons: PROS_CONS.nullable().optional().describe('Replaces the whole verdict; null clears it'),
      visibility: ENTRY_VISIBILITY.optional(),
      type: ENTRY_TYPE.optional().describe('Promote a trip-derived "skeleton" to a real "entry" once it has been written up'),
      sort_order: z.number().int().min(0).optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  updateJourneyEntry(
    { entryId, ...data }: {
      entryId: number; title?: string | null; story?: string | null; entry_date?: string;
      entry_time?: string | null; location_name?: string | null; location_lat?: number | null;
      location_lng?: number | null; mood?: string | null; weather?: string | null;
      tags?: string[] | null; pros_cons?: { pros: string[]; cons: string[] } | null;
      visibility?: EntryVisibility; type?: EntryType; sort_order?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const entry = this.journey.updateEntry(entryId, ctx.userId, data, undefined);
    if (!entry) return notFound('Entry not found or access denied.');
    // Return through the listEntries enrichment (parsed tags/pros_cons, photos), matching create_journey_entry.
    const enriched = this.journey.listEntries(entry.journey_id, ctx.userId)?.find(e => e.id === entry.id) ?? entry;
    return ok({ entry: enriched });
  }

  @Tool({
    name: 'delete_journey_entry',
    description: 'Delete a journey entry.',
    inputSchema: { entryId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  deleteJourneyEntry({ entryId }: { entryId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.journey.deleteEntry(entryId, ctx.userId, undefined)) return notFound('Entry not found or access denied.');
    return ok({ success: true });
  }

  @Tool({
    name: 'reorder_journey_entries',
    description: 'Reorder entries within a journey by providing the desired order of entry IDs.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      orderedIds: z.array(z.number().int().positive()),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  reorderJourneyEntries({ journeyId, orderedIds }: { journeyId: number; orderedIds: number[] }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const success = this.journey.reorderEntries(journeyId, ctx.userId, orderedIds, undefined);
    if (!success) return notFound('Journey not found, access denied, or entry IDs do not belong to this journey.');
    return ok({ success: true });
  }

  @Tool({
    name: 'add_journey_contributor',
    description: 'Add a contributor to a journey. Owner only.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      targetUserId: z.number().int().positive(),
      role: z.enum(['editor', 'viewer']),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  addJourneyContributor(
    { journeyId, targetUserId, role }: { journeyId: number; targetUserId: number; role: 'editor' | 'viewer' },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.journey.addContributor(journeyId, ctx.userId, targetUserId, role)) return notFound('Journey not found or access denied.');
    return ok({ success: true });
  }

  @Tool({
    name: 'update_journey_contributor_role',
    description: 'Update the role of a journey contributor. Owner only.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      targetUserId: z.number().int().positive(),
      role: z.enum(['editor', 'viewer']),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  updateJourneyContributorRole(
    { journeyId, targetUserId, role }: { journeyId: number; targetUserId: number; role: 'editor' | 'viewer' },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.journey.updateContributorRole(journeyId, ctx.userId, targetUserId, role)) return notFound('Journey not found or access denied.');
    return ok({ success: true });
  }

  @Tool({
    name: 'remove_journey_contributor',
    description: 'Remove a contributor from a journey. Owner only.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      targetUserId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  removeJourneyContributor({ journeyId, targetUserId }: { journeyId: number; targetUserId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.journey.removeContributor(journeyId, ctx.userId, targetUserId)) return notFound('Journey not found or access denied.');
    return ok({ success: true });
  }

  @Tool({
    name: 'update_journey_preferences',
    description: 'Update per-user preferences for a journey (e.g. hide skeleton entries).',
    inputSchema: {
      journeyId: z.number().int().positive(),
      hide_skeletons: z.boolean().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  updateJourneyPreferences(
    { journeyId, hide_skeletons }: { journeyId: number; hide_skeletons?: boolean },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const result = this.journey.updateJourneyPreferences(journeyId, ctx.userId, { hide_skeletons });
    if (!result) return notFound('Journey not found or access denied.');
    // Return the service result ({ hide_skeletons }), matching the REST route.
    return ok(result);
  }

  @Tool({
    name: 'add_journey_provider_photos',
    description: 'Attach photos from a connected library (Immich or Synology Photos) to a journey: to one entry when entryId is given, otherwise to the journey gallery only. Find the asset ids first with search_provider_photos or list_provider_album_photos. No image data passes through here, the journey stores a reference and the app fetches the picture, so this also works for photos far too large to hand to a model. An asset already attached is skipped rather than duplicated, which makes re-running the same call safe.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      entryId: z.number().int().positive().optional().describe('Attach to this entry, which must belong to journeyId. The photo lands in the journey gallery either way; omitting this adds it to the gallery alone'),
      provider: PHOTO_PROVIDER.describe('The library the asset ids came from'),
      asset_ids: z.array(z.string().min(1)).min(1).max(MAX_PROVIDER_PHOTOS_PER_CALL).describe('Provider asset ids, as returned by the search and album tools'),
      media_types: z.array(z.enum(['image', 'video'])).optional().describe('Parallel to asset_ids; anything not named here counts as an image'),
      caption: z.string().max(500).optional().describe('Stored only when entryId is given, matching the REST routes: the gallery add records no caption'),
      passphrase: z.string().min(1).optional().describe('Only for a Synology Photos album shared with the user: the passphrase list_provider_albums returned for that album'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  addJourneyProviderPhotos(
    { journeyId, entryId, provider, asset_ids, media_types, caption, passphrase }: {
      journeyId: number; entryId?: number; provider: z.infer<typeof PHOTO_PROVIDER>;
      asset_ids: string[]; media_types?: Array<'image' | 'video'>; caption?: string; passphrase?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    // The REST routes derive the journey from the entry and let each per-asset
    // add answer for itself, which in the array branch means a caller with no
    // access gets an empty 200. Checking up front instead turns that silence
    // into a sentence, and is what makes journeyId worth asking for: the entry
    // has to be shown to belong to it before anything is written.
    if (!this.journey.canEdit(journeyId, ctx.userId)) return notFound('Journey not found or access denied.');
    if (entryId !== undefined && !this.journey.listEntries(journeyId, ctx.userId)?.some(e => e.id === entryId)) {
      return notFound('Entry not found in this journey.');
    }

    const photos: unknown[] = [];
    asset_ids.forEach((assetId, i) => {
      const mediaType = media_types?.[i] === 'video' ? 'video' : 'image';
      const photo = entryId === undefined
        ? this.journey.addProviderPhotoToGallery(journeyId, ctx.userId, provider, assetId, undefined, passphrase, mediaType)
        : this.journey.addProviderPhoto(entryId, ctx.userId, provider, assetId, caption, passphrase, mediaType);
      if (photo) photos.push(photo);
    });

    // Detached, exactly as the REST routes schedule it: the provider is asked
    // when and where each photo was taken, and without that answer an attached
    // photo can never appear on the journey map (#1614).
    this.captureBackfill.schedule(
      photos.map(p => (p as { photo_id?: number }).photo_id).filter((id): id is number => typeof id === 'number'),
      ctx.userId,
    );
    // `skipped` is what tells a caller that a shortfall was duplicates rather
    // than a failure; the REST body carries only photos and added.
    return ok({ photos, added: photos.length, skipped: asset_ids.length - photos.length });
  }

  // ── Share links (journey:share, not implied by journey:write) ────────────

  @Tool({
    name: 'get_journey_share_link',
    description: 'Get the current public share link for a journey. Owner only. Returns null if none exists.',
    inputSchema: { journeyId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'share' },
  })
  getJourneyShareLink({ journeyId }: { journeyId: number }, ctx: McpContext) {
    // Same read the REST route uses, so the owner check cannot drift apart
    // between the two surfaces: handing out the token is handing out the journey.
    const result = this.share.readJourneyShareLink(journeyId, ctx.userId);
    if (!result.allowed) return notFound('Journey not found or access denied.');
    return ok({ shareLink: result.link });
  }

  @Tool({
    name: 'create_journey_share_link',
    description: 'Create or update the public share link for a journey. Owner only. Flags left out keep their current value on an existing link; a new link defaults to timeline/gallery/map on.',
    inputSchema: {
      journeyId: z.number().int().positive(),
      share_timeline: z.boolean().optional(),
      share_gallery: z.boolean().optional(),
      share_map: z.boolean().optional(),
      newest_first: z.boolean().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'share' },
  })
  createJourneyShareLink({ journeyId, ...permissions }: { journeyId: number; share_timeline?: boolean; share_gallery?: boolean; share_map?: boolean; newest_first?: boolean }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const shareLink = this.share.createOrUpdateJourneyShareLink(journeyId, ctx.userId, permissions);
    if (!shareLink) return notFound('Journey not found or access denied.');
    return ok({ shareLink });
  }

  @Tool({
    name: 'delete_journey_share_link',
    description: 'Revoke the public share link for a journey. Owner only.',
    inputSchema: { journeyId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'share' },
  })
  deleteJourneyShareLink({ journeyId }: { journeyId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.share.deleteJourneyShareLink(journeyId, ctx.userId)) return notFound('Journey not found or access denied.');
    return ok({ success: true });
  }

  // --- RESOURCES ---
  // Ported 1:1 from src/mcp/resources.ts (the last legacy registrar): identical
  // names, URIs, descriptions and payload shapes. The legacy registration-time
  // gate `isAddonEnabled(JOURNEY) && canRead(scopes, 'journey')` becomes
  // `when: journeyAddonOn` + the declarative read marker.

  @Resource({
    name: 'journeys',
    uri: 'trek://journeys',
    description: 'All journeys owned or contributed to by the current user',
    mimeType: 'application/json',
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async journeysResource(uri: URL, ctx: McpContext) {
    return jsonContent(uri.href, this.journey.listJourneys(ctx.userId));
  }

  @ResourceTemplate({
    name: 'journey-detail',
    uriTemplate: 'trek://journeys/{journeyId}',
    description: 'Single journey with entries, contributors, and trip links',
    mimeType: 'application/json',
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async journeyDetailResource(uri: URL, { journeyId }: { journeyId: string | string[] }, ctx: McpContext) {
    const id = parseId(journeyId);
    if (id === null) return accessDenied(uri.href);
    const journey = this.journey.getJourneyFull(id, ctx.userId);
    if (!journey) return accessDenied(uri.href);
    return jsonContent(uri.href, journey);
  }

  @ResourceTemplate({
    name: 'journey-entries',
    uriTemplate: 'trek://journeys/{journeyId}/entries',
    description: 'All entries in a journey (date, text, mood, linked trip)',
    mimeType: 'application/json',
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async journeyEntriesResource(uri: URL, { journeyId }: { journeyId: string | string[] }, ctx: McpContext) {
    const id = parseId(journeyId);
    if (id === null) return accessDenied(uri.href);
    if (!this.journey.canAccessJourney(id, ctx.userId)) return accessDenied(uri.href);
    return jsonContent(uri.href, this.journey.listEntries(id, ctx.userId));
  }

  @ResourceTemplate({
    name: 'journey-contributors',
    uriTemplate: 'trek://journeys/{journeyId}/contributors',
    description: 'Contributors (owners and collaborators) of a journey',
    mimeType: 'application/json',
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async journeyContributorsResource(uri: URL, { journeyId }: { journeyId: string | string[] }, ctx: McpContext) {
    const id = parseId(journeyId);
    if (id === null) return accessDenied(uri.href);
    const journey = this.journey.getJourneyFull(id, ctx.userId);
    if (!journey) return accessDenied(uri.href);
    return jsonContent(uri.href, (journey as { contributors?: JourneyContributor[] }).contributors ?? []);
  }
}
