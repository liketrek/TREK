/**
 * Tuning constants for the document sync core.
 *
 * Kept out of the service so the pure planner can be unit-tested against them
 * without a container, and so a reviewer can see every limit in one place
 * instead of hunting for magic numbers.
 */

/** Per-request ceiling for provider calls that return metadata. */
export const PROVIDER_TIMEOUT_MS = 15_000;

/** Transfers get longer, because a 40 MB PDF over a home upstream is not fast. */
export const PROVIDER_TRANSFER_TIMEOUT_MS = 120_000;

/** Metadata responses are JSON; nothing legitimate here is megabytes. */
export const PROVIDER_JSON_MAX_BYTES = 8 * 1024 * 1024;

/**
 * Page cap per listing run, mirroring the reason dawarich.client.ts states: a
 * provider that keeps answering `next` must not hold a worker forever. Hitting
 * it sets `truncated`, which the core surfaces rather than silently treating a
 * partial listing as the whole truth.
 */
export const PROVIDER_MAX_PAGES = 40;

/**
 * The share of a link's known documents that may disappear in one run before
 * the run refuses to act on any of it.
 *
 * An unmounted Synology share, a revoked Nextcloud share and an expired
 * Paperless token all produce the same thing: a listing far shorter than the
 * last one. Without this guard the reconciler would read that as a mass
 * deletion. Below the threshold, vanished documents are recorded as
 * `remote_missing` and wait for a human either way. This only decides whether
 * the run trusts the listing enough to record anything at all.
 */
export const MASS_DELETE_RATIO = 0.4;

/** Below this count the ratio is meaningless, so the guard only counts. */
export const MASS_DELETE_MIN_ITEMS = 5;

/**
 * Backoff for a failing link, in seconds, indexed by consecutive failures.
 * Flat 30 minutes after the sixth, because a provider that has been down for
 * three hours is a configuration problem, not a blip, and hammering it earns a
 * DSM auto-block.
 */
export const LINK_BACKOFF_SECONDS = [60, 300, 900, 1800, 3600, 7200] as const;

/** Per-document retry curve, shorter: usually a transient upload failure. */
export const ITEM_BACKOFF_SECONDS = [30, 120, 600, 3600] as const;

/** After this many attempts a document stops retrying and waits for a human. */
export const ITEM_MAX_ATTEMPTS = 6;

/**
 * Consecutive link failures after which the circuit opens and the job stops
 * scheduling it at all until someone presses "sync now".
 */
export const LINK_CIRCUIT_OPEN_AFTER = 10;

/** Default poll interval. Clamped, overridable per instance in app_settings. */
export const DEFAULT_POLL_INTERVAL_SECONDS = 300;
export const MIN_POLL_INTERVAL_SECONDS = 60;
export const MAX_POLL_INTERVAL_SECONDS = 3600;

/**
 * How long a webhook may accelerate a link before the poll takes over again.
 * A webhook only ever means "look now". This keeps a link whose subscription
 * silently died from going stale forever.
 */
export const WEBHOOK_NUDGE_DEBOUNCE_SECONDS = 5;

/** Documents pulled or pushed per run, so one huge trip cannot starve others. */
export const MAX_TRANSFERS_PER_RUN = 25;

/**
 * What a manual run answers for a binding an admin has switched off, through
 * its provider or through the Documents addon.
 *
 * Not one of the shared DocsyncErrorCodes: those say what went wrong between
 * TREK and a provider, and here nothing has. It is never written to the binding
 * either, which is what lets the binding resume as it was left.
 */
export const PROVIDER_DISABLED = 'provider_disabled';

/** app_settings keys, read per tick so an admin toggle needs no restart. */
export const SETTING_POLL_INTERVAL = 'docsync_poll_interval_seconds';
export const SETTING_SYNC_ENABLED = 'docsync_sync_enabled';
// There is deliberately no size key here: a document that arrives through a
// binding is bound by the same ceiling as one somebody uploads (MAX_FILE_SIZE in
// files.constants), checked against the announced size and again while the
// bytes stream. A second, sync-only limit would be a number nobody maintains
// and a way for the two paths to disagree about what fits.
