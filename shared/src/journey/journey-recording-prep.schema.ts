import { z } from 'zod';

/**
 * JRN-03: a journey preparing its recorded days, as one person sees it.
 *
 * The switch is the journey's (its owner sets it); the preparation runs on
 * each person's own Dawarich sync, so what it reached and when it last went
 * through is the caller's alone. A failed run keeps the stays of the last
 * good one, which is why the time of the last success and the reason of the
 * last failure are kept apart.
 */

/** Whether the caller's own Dawarich can prepare anything: connected with its background sync on, with it off, or not connected. */
export const JOURNEY_RECORDING_PREP_CONNECTIONS = ['ready', 'sync_off', 'not_connected'] as const;

/**
 * How many days after its end a linked trip is still prepared: the reach of
 * the trip sync it rides on (`TripsRepository.listTripsToSync`), so a journey
 * never reaches further back. Older trips are read by hand only.
 */
export const JOURNEY_RECORDING_PREP_REACH_DAYS = 400;

/** A linked trip the caller's runs reach; `end` is null for a trip still open. */
export const journeyRecordingPrepPeriodSchema = z.object({
  start: z.string(),
  end: z.string().nullable(),
});

/** GET /api/journeys/:id/recordings/prep */
export const journeyRecordingPrepSchema = z.object({
  /** The journey's switch, `auto_prepare_recordings`. */
  enabled: z.boolean(),
  connection: z.enum(JOURNEY_RECORDING_PREP_CONNECTIONS),
  /** ISO-8601 of the caller's last run over the journey, successful or not; null before the first. */
  lastAttemptAt: z.string().nullable(),
  /** ISO-8601 of the caller's last run that came through; the stays shown are as new as this. */
  lastSuccessAt: z.string().nullable(),
  /** Dawarich's reason (a DAWARICH_ERROR_CODES code) when the last run failed; null when it came through. */
  lastError: z.string().nullable(),
  /**
   * The linked trips the caller's runs reach, so a day outside them is never
   * shown as prepared. Omitted while the switch is off.
   */
  periods: z.array(journeyRecordingPrepPeriodSchema).optional(),
});
export type JourneyRecordingPrep = z.infer<typeof journeyRecordingPrepSchema>;
export type JourneyRecordingPrepPeriod = z.infer<typeof journeyRecordingPrepPeriodSchema>;
