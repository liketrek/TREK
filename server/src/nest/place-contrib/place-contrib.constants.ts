/**
 * The numbers the community enrichment works with, in one place.
 */

/**
 * Where contributions go. Only the public instance takes them: an install with
 * its own TREK_PLACES_URL is not eligible, so this is never another host.
 */
export const CONTRIB_ORIGIN = 'https://places.liketrek.com';

/** One place per request, and the service refuses a body over this. */
export const PLACE_BODY_MAX_BYTES = 8 * 1024;
/** Every answer is a short JSON object; anything longer is not read. */
export const ANSWER_MAX_BYTES = 64 * 1024;
export const REQUEST_TIMEOUT_MS = 15_000;

/** The waits after the first, second, ... failed attempt; the last one repeats. */
export const RETRY_DELAYS_MS = [10 * 60_000, 30 * 60_000, 2 * 3_600_000, 6 * 3_600_000] as const;
/** After this many failed attempts a value is given up on. */
export const MAX_ATTEMPTS = 8;
/** The longest Retry-After the sender honours; a larger one is capped to it. */
export const MAX_RETRY_AFTER_MS = 24 * 3_600_000;
/** How long the sender waits when the service is not taking contributions and says nothing about when. */
export const NOT_ACCEPTING_WAIT_MS = 30 * 60_000;

/** The queue never holds more than this; at the cap nothing more is queued. */
export const OUTBOX_CAP = 5_000;
/** A value still queued after this long is dropped and logged as withheld. */
export const OUTBOX_MAX_AGE_DAYS = 30;

/** At most this many places per run of the sender, one after the other. */
export const PLACES_PER_RUN = 20;
/** Every two minutes. */
export const SEND_SCHEDULE = '*/2 * * * *';
/** The log retention, nightly at 3:50, clear of the 3:00 idempotency purge and 3:40 shadow retention. */
export const LOG_RETENTION_SCHEDULE = '50 3 * * *';
export const LOG_RETENTION_DAYS = 90;
/** The admin state counts the log of this many days. */
export const COUNT_WINDOW_DAYS = 30;

/** "Not now" keeps the prompt away from this admin for two weeks. */
export const SNOOZE_DAYS = 14;

/** A picture is sent at most this large: long edge, JPEG quality, bytes. */
export const IMAGE_MAX_EDGE = 2048;
export const IMAGE_JPEG_QUALITY = 85;
export const IMAGE_MAX_BYTES = 1024 * 1024;
/** A picture is decoded only up to this many pixels; a larger one is not sent. */
export const IMAGE_MAX_PIXELS = 40_000_000;

/** The longest value a field sends, and the longest summary of it the log keeps. */
export const VALUE_MAX_CHARS = 4_000;
export const SUMMARY_MAX_CHARS = 80;
