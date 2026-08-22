import {
  McpController, Tool, Resource, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { ADDON_IDS } from '../../addons';
import { AtlasService, BucketItemExistsError } from './atlas.service';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AuthService } from '../auth/auth.service';

/** Legacy registrar gate: the whole atlas surface (tools AND resources) rides
 *  the atlas addon — unlike the REST controller, which is deliberately ungated
 *  (see atlas.controller.ts). */
const atlasAddonOn = addonGate(ADDON_IDS.ATLAS);

/** The MCP echo of the REST 409 (#1898) — same wording, tool-shaped. */
function bucketDuplicateResult() {
  return { content: [{ type: 'text' as const, text: 'That is already on your bucket list.' }], isError: true };
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

/**
 * Atlas MCP surface — ported 1:1 from the legacy registrar
 * src/mcp/tools/atlas.ts (10 tools) and the four atlas resources in
 * src/mcp/resources.ts: identical names, descriptions, zod input schemas,
 * annotations, and error/payload shapes. The legacy `if (R)` / `if (W)` scope
 * checks map to the declarative atlas read/write access markers (resolved by
 * trekMcpAccessPolicy) and the registration-time addon early-return becomes
 * the `when:` gate. Atlas rows are uid-scoped, so there are no trip-access
 * checks and no broadcasts; writes deny demo users, reads do not. The legacy
 * registrar's casing divergence from REST (mark_region_visited /
 * get_country_atlas_places passed codes through un-uppercased) was fixed in
 * the trailing quirk commit — both sides now uppercase. The one input schema
 * that grew since is create_bucket_list_item's target_date (#1898).
 */
@McpController()
export class AtlasMcp {
  constructor(
    private readonly atlas: AtlasService,
    readonly addons: AddonsService,
    private readonly auth: AuthService,
  ) {}

  // ── Bucket list ─────────────────────────────────────────────────────────

  @Tool({
    name: 'create_bucket_list_item',
    description: 'Add a destination to your personal travel bucket list.',
    inputSchema: {
      name: z.string().min(1).max(200).describe('Destination or experience name'),
      lat: z.number().optional(),
      lng: z.number().optional(),
      country_code: z.string().length(2).toUpperCase().optional().describe('ISO 3166-1 alpha-2 country code'),
      notes: z.string().max(1000).optional(),
      // #1898 made the target date part of an item's identity, so without this
      // parameter MCP could only ever create one entry per destination — the
      // "same place, different date" case the report calls for was unreachable.
      // update_bucket_list_item has had the field all along.
      target_date: z.string().nullable().optional().describe('When you plan to go, e.g. "2027-05"'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async createBucketListItem(
    { name, lat, lng, country_code, notes, target_date }: { name: string; lat?: number; lng?: number; country_code?: string; notes?: string; target_date?: string | null },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    try {
      const item = this.atlas.createBucketItem(ctx.userId, { name, lat, lng, country_code, notes, target_date });
      return ok({ item });
    } catch (err) {
      if (err instanceof BucketItemExistsError) return bucketDuplicateResult();
      throw err;
    }
  }

  @Tool({
    name: 'delete_bucket_list_item',
    description: 'Remove an item from your travel bucket list.',
    inputSchema: {
      itemId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async deleteBucketListItem({ itemId }: { itemId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const deleted = this.atlas.deleteBucketItem(ctx.userId, itemId);
    if (!deleted) return { content: [{ type: 'text' as const, text: 'Bucket list item not found.' }], isError: true };
    return ok({ success: true });
  }

  // ── Atlas ───────────────────────────────────────────────────────────────

  @Tool({
    name: 'mark_country_visited',
    description: 'Mark a country as visited in your Atlas.',
    inputSchema: {
      country_code: z.string().length(2).toUpperCase().describe('ISO 3166-1 alpha-2 country code (e.g. "FR", "JP")'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async markCountryVisited({ country_code }: { country_code: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    this.atlas.markCountry(ctx.userId, country_code.toUpperCase());
    return ok({ success: true, country_code: country_code.toUpperCase() });
  }

  @Tool({
    name: 'unmark_country_visited',
    description: 'Remove a country from your visited countries in Atlas.',
    inputSchema: {
      country_code: z.string().length(2).toUpperCase().describe('ISO 3166-1 alpha-2 country code'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async unmarkCountryVisited({ country_code }: { country_code: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    this.atlas.unmarkCountry(ctx.userId, country_code.toUpperCase());
    return ok({ success: true, country_code: country_code.toUpperCase() });
  }

  // ── Atlas expanded ──────────────────────────────────────────────────────

  @Tool({
    name: 'get_atlas_stats',
    description: 'Get atlas statistics — total visited countries, region counts, continent breakdown.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async getAtlasStats(_args: Record<string, never>, ctx: McpContext) {
    const stats = await this.atlas.stats(ctx.userId);
    return ok({ stats });
  }

  @Tool({
    name: 'list_visited_regions',
    description: 'List all manually visited sub-country regions for the current user.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async listVisitedRegions(_args: Record<string, never>, ctx: McpContext) {
    const regions = this.atlas.listManuallyVisitedRegions(ctx.userId);
    return ok({ regions });
  }

  @Tool({
    name: 'mark_region_visited',
    description: 'Mark a sub-country region as visited.',
    inputSchema: {
      regionCode: z.string().describe('ISO region code e.g. US-CA'),
      regionName: z.string(),
      countryCode: z.string().describe('ISO 3166-1 alpha-2 country code'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async markRegionVisited(
    { regionCode, regionName, countryCode }: { regionCode: string; regionName: string; countryCode: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    // Post-fold quirk fix: uppercase both codes, matching the REST controller
    // (the legacy registrar passed them through verbatim, so a lowercase mark
    // created a row REST's uppercased unmark could never hit).
    const upperRegion = regionCode.toUpperCase();
    this.atlas.markRegion(ctx.userId, upperRegion, regionName, countryCode.toUpperCase());
    const row = this.atlas.listManuallyVisitedRegions(ctx.userId).find((r) => r.region_code === upperRegion);
    // Echo in the client-facing shape ({ code, name, ... }) rather than raw DB columns.
    const region = row
      ? { code: row.region_code, name: row.region_name, country_code: row.country_code, manuallyMarked: true }
      : undefined;
    return ok({ region });
  }

  @Tool({
    name: 'unmark_region_visited',
    description: 'Remove a region from the visited list.',
    inputSchema: {
      regionCode: z.string(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async unmarkRegionVisited({ regionCode }: { regionCode: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    // Post-fold quirk fix: uppercase, matching the REST controller.
    this.atlas.unmarkRegion(ctx.userId, regionCode.toUpperCase());
    return ok({ success: true });
  }

  @Tool({
    name: 'get_country_atlas_places',
    description: 'Get places saved in the user\'s atlas for a specific country.',
    inputSchema: {
      countryCode: z.string().describe('ISO 3166-1 alpha-2 country code'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async getCountryAtlasPlaces({ countryCode }: { countryCode: string }, ctx: McpContext) {
    // Post-fold quirk fix: uppercase, matching the REST controller (the legacy
    // registrar passed 'fr' through and matched nothing).
    const result = this.atlas.countryPlaces(ctx.userId, countryCode.toUpperCase());
    return ok(result);
  }

  @Tool({
    name: 'update_bucket_list_item',
    description: 'Update a bucket list item (notes, name, target date, location).',
    inputSchema: {
      itemId: z.number().int().positive(),
      name: z.string().optional(),
      notes: z.string().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
      country_code: z.string().optional(),
      target_date: z.string().nullable().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'write' },
  })
  async updateBucketListItem(
    { itemId, name, notes, lat, lng, country_code, target_date }: {
      itemId: number;
      name?: string;
      notes?: string;
      lat?: number | null;
      lng?: number | null;
      country_code?: string;
      target_date?: string | null;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    let item: unknown;
    try {
      item = this.atlas.updateBucketItem(ctx.userId, itemId, { name, notes, lat, lng, country_code, target_date });
    } catch (err) {
      if (err instanceof BucketItemExistsError) return bucketDuplicateResult();
      throw err;
    }
    if (!item) return { content: [{ type: 'text' as const, text: 'Bucket list item not found.' }], isError: true };
    return ok({ item });
  }

  // -------------------------------------------------------------------------
  // Resources (from src/mcp/resources.ts — payloads reproduce jsonContent verbatim)
  // -------------------------------------------------------------------------

  @Resource({
    name: 'bucket-list',
    uri: 'trek://bucket-list',
    description: 'Your personal travel bucket list',
    mimeType: 'application/json',
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async bucketListResource(uri: URL, ctx: McpContext) {
    const items = this.atlas.bucketList(ctx.userId);
    return jsonContent(uri.href, items);
  }

  @Resource({
    name: 'visited-countries',
    uri: 'trek://visited-countries',
    description: 'Countries you have marked as visited in Atlas',
    mimeType: 'application/json',
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async visitedCountriesResource(uri: URL, ctx: McpContext) {
    const countries = this.atlas.listVisitedCountries(ctx.userId);
    return jsonContent(uri.href, countries);
  }

  @Resource({
    name: 'atlas-stats',
    uri: 'trek://atlas/stats',
    description: "User's atlas statistics — visited country counts and breakdown",
    mimeType: 'application/json',
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async atlasStatsResource(uri: URL, ctx: McpContext) {
    const stats = await this.atlas.stats(ctx.userId);
    return jsonContent(uri.href, stats);
  }

  @Resource({
    name: 'atlas-regions',
    uri: 'trek://atlas/regions',
    description: 'List of manually visited regions for the current user',
    mimeType: 'application/json',
    when: atlasAddonOn,
    access: { group: 'atlas', mode: 'read' },
  })
  async atlasRegionsResource(uri: URL, ctx: McpContext) {
    const regions = this.atlas.listManuallyVisitedRegions(ctx.userId);
    return jsonContent(uri.href, regions);
  }
}
