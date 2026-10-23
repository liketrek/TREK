import { idSchema } from '../../common/primitives.schema';
import { MAX_TRIP_DAYS } from '../../trip/trip.schema';
import { cardText } from './card-parts';

import { z } from 'zod';

/**
 * The rules a road trip drives by, as a held change sets them: the driving
 * settings it changes, each from its old value to its new one, or where it
 * makes a day end (at a stop, part way along a drive, or back to the
 * automatic end). The client names each setting the way the planner's
 * settings name it, so a setting this build does not know reads by its key.
 */

/** A setting's value as the planner stores it: a clock, a number, a switch, a choice; null when it is not set. */
const settingValueSchema = z.union([z.string().max(40), z.number().min(0).max(100_000), z.boolean()]).nullable();

export const roadtripRulesCardSchema = z.object({
  kind: z.literal('roadtripRules'),
  settings: z
    .array(
      z.object({
        key: z.string().regex(/^roadtrip_[a-z0-9_]{1,40}$/),
        before: settingValueSchema,
        after: settingValueSchema,
      }),
    )
    .max(24),
  dayEnd: z
    .object({
      dayId: idSchema.nullable(),
      dayNumber: z.number().int().min(1).max(MAX_TRIP_DAYS),
      // At the stop `from`; `percent` along the drive from `from` to `to`; or the automatic end again.
      mode: z.enum(['stop', 'along', 'auto']),
      from: cardText(80).nullable(),
      to: cardText(80).nullable(),
      percent: z.number().int().min(0).max(100).nullable(),
    })
    .nullable(),
});
export type RoadtripRulesCard = z.infer<typeof roadtripRulesCardSchema>;
export type RoadtripSettingChange = RoadtripRulesCard['settings'][number];
