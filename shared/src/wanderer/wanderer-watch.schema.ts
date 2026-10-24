import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * WAN-02: the optional background watch over a user's own wanderer snapshots.
 *
 * Off until the user switches it on for their personal connection. While on,
 * the server now and then reads the small record of each trail the user
 * imported (never its GPX) and leaves a hint where the record suggests the
 * trail moved on. A hint only ever points at the manual check of the source
 * (MF-03) and from there at the confirmed reimport: nothing here changes,
 * replaces or deletes a tour, and no answer is ever read as "unchanged".
 */

/**
 * What the watch found about one snapshot's source.
 *
 * - `possible_change`: the trail's change time moved since the user last saw
 *   it. A time is no proof of content, so only the manual check can tell.
 * - `changed`: the trail's record itself differs in its name or description,
 *   which the record alone proves. Its line may differ too; that again only
 *   the manual check reads.
 * - `unverifiable`: the watch could not judge the source, see the reason.
 */
export const tourSourceHintStateSchema = z.enum(['possible_change', 'changed', 'unverifiable']);
export type TourSourceHintState = z.infer<typeof tourSourceHintStateSchema>;

/**
 * Why a source could not be judged: the trail is gone or no longer the
 * user's own to read, or neither the import nor the trail carries a change
 * time to compare.
 */
export const tourSourceHintReasonSchema = z.enum(['unavailable', 'no_change_time']);
export type TourSourceHintReason = z.infer<typeof tourSourceHintReasonSchema>;

/** The parts of a trail its record alone can prove changed; the line needs the manual check. */
export const tourSourceHintChangeSchema = z.enum(['name', 'description']);
export type TourSourceHintChange = z.infer<typeof tourSourceHintChangeSchema>;

export const tourSourceHintSchema = z.object({
  state: tourSourceHintStateSchema,
  /** For `changed`: what the record proves different. Empty for the other states. */
  changes: z.array(tourSourceHintChangeSchema),
  /** For `unverifiable`: why. Null for the other states. */
  reason: tourSourceHintReasonSchema.nullable(),
  /** The trail's change time as wanderer said it at the look; a hint, never a proof. */
  externalUpdated: z.string().nullable(),
  /** When the watch last looked at this source. */
  checkedAt: z.string(),
});
export type TourSourceHint = z.infer<typeof tourSourceHintSchema>;

/** The caller's own hint on one snapshot of a trip; null when there is none. */
export const tourSourceHintResponseSchema = z.object({
  hint: tourSourceHintSchema.nullable(),
});
export type TourSourceHintResponse = z.infer<typeof tourSourceHintResponseSchema>;

/** A hint as the settings list shows it: with the tour and the trip it belongs to. */
export const wandererSourceHintItemSchema = tourSourceHintSchema.extend({
  placeId: idSchema,
  tripId: idSchema,
  tripTitle: z.string(),
  tourName: z.string(),
});
export type WandererSourceHintItem = z.infer<typeof wandererSourceHintItemSchema>;

export const wandererWatchSchema = z.object({
  /** The user switched the watch on for their connection. */
  enabled: z.boolean(),
  /** There is a connection to watch with; without one the switch has nothing to act on. */
  connected: z.boolean(),
  /** When the watch last finished a look through this connection. */
  lastRunAt: z.string().nullable(),
  /** After failed looks the watch waits until then before it asks the instance again. */
  pausedUntil: z.string().nullable(),
  /** wanderer refused the token: nothing is asked until a test of the connection passes again. */
  blocked: z.boolean(),
  /** The open hints, newest look first. */
  hints: z.array(wandererSourceHintItemSchema),
});
export type WandererWatch = z.infer<typeof wandererWatchSchema>;

export const wandererWatchRequestSchema = z.object({
  enabled: z.boolean(),
});
export type WandererWatchRequest = z.infer<typeof wandererWatchRequestSchema>;
