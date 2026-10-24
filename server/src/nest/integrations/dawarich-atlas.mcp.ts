import { ADDON_IDS } from '../../addons';
import {
  McpController,
  Tool,
  type McpContext,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  errorResult,
  ok,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { DawarichSuggestionsService } from './dawarich-suggestions.service';
import { parseTimeWindow } from './dawarich.helpers';
import { dawarichToolResult } from './dawarich.mcp';
import {
  DAWARICH_BUCKET_MATCH_MIN_MINUTES,
  DAWARICH_BUCKET_MATCH_RADIUS_M,
  DAWARICH_BUCKET_SCAN_LIMIT,
  DAWARICH_WINDOW_MAX_DAYS,
  dawarichAtlasAcceptSchema,
  dawarichBucketConfirmSchema,
  dawarichTimeWindowSchema,
  idSchema,
  type DawarichAtlasAccept,
  type DawarichBucketConfirm,
  type DawarichTimeWindow,
} from '@trek/shared';

/** Same gate as the controller's @RequireAddon(ADDON_IDS.DAWARICH): no addon, no tool. */
const dawarichAddonOn = addonGate(ADDON_IDS.DAWARICH);

/**
 * The bucket list and the Atlas checked against the Dawarich recordings: the
 * twins of `/api/integrations/dawarich/bucket-list/*` and `/atlas/*`, on the
 * same service calls.
 *
 * Their own class rather than a part of DawarichMcp, because what they read
 * and write is the Atlas: the assistant loads them with the atlas tools, where
 * a question about the bucket list or the visited countries goes, while the
 * stays and the recorded route stay with the journal.
 *
 * Reading the recordings to offer wishes and countries is `atlas:read`, as the
 * answer is about the Atlas; ticking off and marking write it, `atlas:write`.
 * Like the routes the tools work on the caller's own data and take no trip,
 * and a refusal reads as the route's error sentence.
 */
@McpController()
export class DawarichAtlasMcp {
  constructor(
    private readonly suggestions: DawarichSuggestionsService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'scan_bucket_list_visits',
    description: `Ask the caller's Dawarich recordings, wish by wish, whether they ever reached the places on their bucket list. A wish counts as reached by a stay of at least ${DAWARICH_BUCKET_MATCH_MIN_MINUTES} minutes within ${DAWARICH_BUCKET_MATCH_RADIUS_M} m; each entry carries that stay (start, minutes, distance, recorded points) or null, and whether the wish was ticked off already. At most ${DAWARICH_BUCKET_SCAN_LIMIT} wishes per scan (truncated says more are left); wishes without coordinates are only counted. An instance that cannot be reached ends the scan with an error rather than a list of misses. Nothing is ticked off here: confirm_bucket_list_visits does that once the user agrees.`,
    inputSchema: {},
    // Asks the caller's Dawarich instance once per wish and writes nothing.
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    access: { group: 'atlas', mode: 'read' },
    when: dawarichAddonOn,
  })
  async scanBucketList(_args: unknown, ctx: McpContext) {
    return dawarichToolResult(() => this.suggestions.scanBucketList(ctx.userId));
  }

  @Tool({
    name: 'confirm_bucket_list_visits',
    description:
      "Tick off the caller's bucket-list wishes the user confirmed after scan_bucket_list_visits (1 to 200 ids). Each is dated with visitedAt (ISO 8601) when given, otherwise with the start of the stay it was matched to, otherwise today. A wish ticked off already keeps its date. Answers how many were ticked off now (updated).",
    inputSchema: dawarichBucketConfirmSchema.shape,
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'atlas', mode: 'write' },
    when: dawarichAddonOn,
  })
  async confirmBucketVisits({ itemIds, visitedAt }: DawarichBucketConfirm, ctx: McpContext) {
    return dawarichToolResult(async () => ({
      updated: await this.suggestions.confirmBucketVisits(ctx.userId, itemIds, visitedAt),
    }));
  }

  @Tool({
    name: 'clear_bucket_list_visit',
    description:
      "Take the visited mark off one of the caller's bucket-list wishes, with its date and where it came from, so the wish reads as not reached yet. The undo of confirm_bucket_list_visits and mark_bucket_list_item_visited_from_dawarich.",
    inputSchema: { itemId: idSchema.describe('The bucket-list entry') },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'atlas', mode: 'write' },
    when: dawarichAddonOn,
  })
  async clearBucketVisit({ itemId }: { itemId: number }, ctx: McpContext) {
    // Someone else's wish answers like a missing one, as the route's 404 does.
    if (!(await this.suggestions.clearBucketVisit(ctx.userId, itemId))) {
      return errorResult('Bucket-list entry not found');
    }
    return ok({ success: true });
  }

  @Tool({
    name: 'suggest_atlas_countries',
    description: `List the countries the caller's Dawarich recordings put them in between from and to (at most ${DAWARICH_WINDOW_MAX_DAYS} days), each with its cities, the minutes spent there and whether the Atlas counts the country as visited already. Country names TREK could not match to a code are listed under unresolved. Nothing is marked here: accept_atlas_countries does that for the codes the user confirms.`,
    inputSchema: dawarichTimeWindowSchema.shape,
    // Reads the caller's Dawarich instance live and writes nothing.
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    access: { group: 'atlas', mode: 'read' },
    when: dawarichAddonOn,
  })
  async suggestAtlasCountries({ from, to }: DawarichTimeWindow, ctx: McpContext) {
    // The route's window check, refused before the instance is asked.
    const window = parseTimeWindow(from, to);
    return dawarichToolResult(() => this.suggestions.atlasSuggestions(ctx.userId, window.from, window.to));
  }

  @Tool({
    name: 'accept_atlas_countries',
    description:
      "Mark countries the user confirmed from suggest_atlas_countries as visited in the caller's Atlas, by ISO 3166-1 alpha-2 code (1 to 300 at once). A country taken off the Atlas before comes back; one marked already keeps where it came from. Answers how many were added now (marked).",
    inputSchema: dawarichAtlasAcceptSchema.shape,
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'atlas', mode: 'write' },
    when: dawarichAddonOn,
  })
  async acceptAtlasCountries({ countryCodes }: DawarichAtlasAccept, ctx: McpContext) {
    return dawarichToolResult(async () => ({
      marked: await this.suggestions.acceptAtlasCountries(ctx.userId, countryCodes),
    }));
  }
}
