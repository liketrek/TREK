import { idSchema } from '../common/primitives.schema';
import { dawarichVisitStatusSchema } from '../dawarich/dawarich.schema';

import { z } from 'zod';

/**
 * JRN-02: one recorded day reviewed with the stays Dawarich found on it and
 * taken into the journal as drafts, in a few decisions.
 *
 * A stay is the caller's own: the review reads their Dawarich connection, and
 * only they can take one of their stays over. Several stays may become one
 * entry (the same square twice) or one day report; the stays behind an entry
 * stay on record with their own places and times, so a report has one map
 * position without losing the others, and taking the day over again finds
 * what is in the journal already instead of writing it twice.
 */

/**
 * Where a stay of the day stands for this journey.
 * `open`: not decided yet. `skipped`: left out before, can still be taken.
 * `here`: an entry of this journey holds it. `elsewhere`: taken over as a
 * place, a wish or into another journey, so it is not offered again.
 */
export const JOURNEY_DAY_STAY_STATUSES = ['open', 'skipped', 'here', 'elsewhere'] as const;

export const journeyDayStaySchema = z.object({
  /** The Dawarich suggestion the stay is. */
  suggestionId: idSchema,
  name: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** ISO-8601 with the offset Dawarich recorded, as the stay list shows them. */
  startedAt: z.string(),
  endedAt: z.string(),
  durationMinutes: z.number(),
  /** `suggested` is Dawarich's own guess, not confirmed there. */
  sourceStatus: dawarichVisitStatusSchema,
  confidenceBand: z.string().nullable(),
  status: z.enum(JOURNEY_DAY_STAY_STATUSES),
  /** The entry of this journey that holds the stay, while `status` is `here`. */
  entry: z.object({ id: idSchema, title: z.string().nullable() }).nullable(),
});
export type JourneyDayStay = z.infer<typeof journeyDayStaySchema>;

/** An entry the journey has on the day already, so the review shows what is there. */
export const journeyDayEntrySchema = z.object({
  id: idSchema,
  title: z.string().nullable(),
  locationName: z.string().nullable(),
  entryTime: z.string().nullable(),
  isDraft: z.boolean(),
});
export type JourneyDayEntry = z.infer<typeof journeyDayEntrySchema>;

export const journeyDayStaysSchema = z.object({
  journey: z.object({ id: idSchema, title: z.string() }),
  date: z.string(),
  /** In the order they were lived. */
  stays: z.array(journeyDayStaySchema),
  entries: z.array(journeyDayEntrySchema),
  /** The stays were read from Dawarich just now; false when it did not answer and the last sync is shown. */
  fresh: z.boolean(),
  /** Why Dawarich did not answer, as its error code, while `fresh` is false. */
  error: z.string().nullable(),
  /** When the stays shown were last read from Dawarich by a sync, while `fresh` is false. */
  syncedAt: z.string().nullable(),
  /** Dawarich hit its page cap: the day may hold stays not listed. */
  truncated: z.boolean(),
  /** How many other people can open the journey and see its drafts. */
  audience: z.number(),
});
export type JourneyDayStays = z.infer<typeof journeyDayStaysSchema>;

/**
 * `single`: one stay, one entry. `merged`: stays of one place, one entry at
 * the chosen stay. `report`: stays of the day in one report, its time line
 * written out, at the chosen stay or without a map position.
 */
export const JOURNEY_DAY_GROUP_KINDS = ['single', 'merged', 'report'] as const;

export const JOURNEY_DAY_IMPORT_MAX_STAYS = 100;

const groupStaySchema = z.object({
  suggestionId: idSchema,
  /** The stay's name as corrected in the review; its own name when left out. */
  name: z.string().trim().min(1).max(255).optional(),
});

export const journeyDayImportGroupSchema = z.object({
  kind: z.enum(JOURNEY_DAY_GROUP_KINDS),
  stays: z.array(groupStaySchema).min(1).max(JOURNEY_DAY_IMPORT_MAX_STAYS),
  /** The entry's title. A single stay falls back to its name; a merged or report entry needs one. */
  title: z.string().trim().min(1).max(255).optional(),
  /** The stay whose place the entry is pinned to; null keeps a report off the map. */
  anchorSuggestionId: idSchema.nullable().optional(),
});
export type JourneyDayImportGroup = z.infer<typeof journeyDayImportGroupSchema>;

/**
 * What is wrong with a take-over before anything is looked up, or null. The
 * request schema refines with it, and the service asks it again for callers
 * that spread the schema's shape, like the MCP tool.
 */
export function journeyDayImportProblem(request: {
  groups: JourneyDayImportGroup[];
  skipSuggestionIds?: number[];
}): string | null {
  const seen = new Set<number>();
  const claim = (id: number): boolean => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  };
  for (const group of request.groups) {
    if (group.kind === 'single' && group.stays.length !== 1) return 'single_takes_one_stay';
    if (group.kind !== 'single' && group.stays.length < 2) return 'group_needs_two_stays';
    if (group.kind !== 'single' && !group.title) return 'group_needs_title';
    const anchor = group.anchorSuggestionId;
    if (anchor !== undefined && anchor !== null && !group.stays.some((stay) => stay.suggestionId === anchor)) {
      return 'anchor_not_in_group';
    }
    if (anchor === null && group.kind !== 'report') return 'position_required';
    for (const stay of group.stays) if (!claim(stay.suggestionId)) return 'stay_twice';
  }
  for (const id of request.skipSuggestionIds ?? []) if (!claim(id)) return 'stay_twice';
  return null;
}

export const journeyDayImportRequestSchema = z
  .object({
    groups: z.array(journeyDayImportGroupSchema).min(1).max(JOURNEY_DAY_IMPORT_MAX_STAYS),
    /** Open stays of the day left out on purpose; they are dismissed and can be restored. */
    skipSuggestionIds: z.array(idSchema).max(JOURNEY_DAY_IMPORT_MAX_STAYS).optional(),
  })
  .superRefine((request, ctx) => {
    const problem = journeyDayImportProblem(request);
    if (problem) ctx.addIssue({ code: 'custom', message: problem });
  });
export type JourneyDayImportRequest = z.infer<typeof journeyDayImportRequestSchema>;

export const journeyDayImportResultSchema = z.object({
  /** The drafts written, in the order of the groups that produced them. */
  entries: z.array(z.object({ id: idSchema, title: z.string().nullable(), stayCount: z.number() })),
  /** Stays the journey or another target held already: nothing was written for them. */
  alreadyTaken: z.array(idSchema),
  skipped: z.array(idSchema),
});
export type JourneyDayImportResult = z.infer<typeof journeyDayImportResultSchema>;
