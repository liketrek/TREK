/**
 * The one Clack styling layer for the plugin-author CLI (#plugins).
 *
 * Two rules make this safe to sprinkle across every command:
 *  1. Nothing here runs unless `isInteractive()` — in CI / pipes the commands fall
 *     back to their plain, flag-driven behaviour with byte-identical output.
 *  2. ALL decoration and prompts render to STDERR, so stdout stays a pure data
 *     channel (the `entry` JSON, `pack --json`, PR URLs) that can be piped.
 */
import {
  intro as clackIntro,
  outro as clackOutro,
  note as clackNote,
  log as clackLog,
  spinner as clackSpinner,
  cancel as clackCancel,
  isCancel,
  text as clackText,
  select as clackSelect,
  multiselect as clackMultiselect,
  confirm as clackConfirm,
  type TextOptions,
  type SelectOptions,
  type MultiSelectOptions,
  type ConfirmOptions,
  type SpinnerResult,
} from '@clack/prompts';

/** Every prompt and every decoration renders here, never on stdout. */
const OUT = process.stderr;

/** True only when a human is driving a real terminal on both stdin and stdout. */
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

// ── decoration ─────────────────────────────────────────────────────────────

export const intro = (title: string): void => clackIntro(title, { output: OUT });
export const outro = (message: string): void => clackOutro(message, { output: OUT });
export const note = (message: string, title?: string): void => clackNote(message, title, { output: OUT });
export const logInfo = (m: string): void => clackLog.info(m, { output: OUT });
export const logSuccess = (m: string): void => clackLog.success(m, { output: OUT });
export const logWarn = (m: string): void => clackLog.warn(m, { output: OUT });
export const logError = (m: string): void => clackLog.error(m, { output: OUT });
export const spinner = (): SpinnerResult => clackSpinner({ output: OUT });

// ── cancellation ─────────────────────────────────────────────────────────────

/** Clack returns a symbol when the user hits Ctrl+C — turn that into a clean exit. */
export function orCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    clackCancel('Cancelled.', { output: OUT });
    process.exit(0);
  }
  return value as T;
}

// ── prompts (cancel-checked, stderr-rendered) ────────────────────────────────

export const promptText = async (opts: Omit<TextOptions, 'output'>): Promise<string> =>
  orCancel(await clackText({ ...opts, output: OUT }));

export const promptSelect = async <Value>(opts: Omit<SelectOptions<Value>, 'output'>): Promise<Value> =>
  orCancel(await clackSelect({ ...opts, output: OUT }));

export const promptMultiselect = async <Value>(opts: Omit<MultiSelectOptions<Value>, 'output'>): Promise<Value[]> =>
  orCancel(await clackMultiselect({ ...opts, output: OUT }));

export const promptConfirm = async (opts: Omit<ConfirmOptions, 'output'>): Promise<boolean> =>
  orCancel(await clackConfirm({ ...opts, output: OUT }));

// ── permissions ──────────────────────────────────────────────────────────────

/**
 * The permissions an author can grant, each with a human hint for the multiselect.
 * This list must stay in lockstep with the host's `KNOWN_PERMISSIONS`
 * (server `src/nest/plugins/protocol/envelope.ts`) — same strings, same order.
 * The manifest validator's `KNOWN_PERMISSIONS` (`../manifest.ts`) mirrors it too.
 */
export const PERMISSION_CATALOG: { value: string; label: string; hint: string }[] = [
  { value: 'db:own', label: 'db:own', hint: 'A private database only this plugin can read/write' },
  { value: 'db:read:trips', label: 'db:read:trips', hint: 'Read trips the requesting user can access' },
  { value: 'db:read:users', label: 'db:read:users', hint: 'Read basic user profiles' },
  { value: 'db:read:costs', label: 'db:read:costs', hint: 'Read costs (budget items) the requesting user can access' },
  { value: 'db:write:costs', label: 'db:write:costs', hint: 'Create costs (budget items) on trips the user can edit' },
  { value: 'db:write:places', label: 'db:write:places', hint: 'Add, edit and remove places on trips the user can edit' },
  { value: 'db:write:days', label: 'db:write:days', hint: 'Add, edit and remove days on trips the user can edit' },
  { value: 'db:write:itinerary', label: 'db:write:itinerary', hint: 'Assign and remove places on days of trips the user can edit' },
  { value: 'db:write:trips', label: 'db:write:trips', hint: 'Edit trip details (title, dates, currency…) on trips the user can edit' },
  { value: 'db:meta', label: 'db:meta', hint: 'Attach its own private data to trips, places and days the user can access' },
  { value: 'ws:broadcast:trip', label: 'ws:broadcast:trip', hint: 'Push realtime events to everyone on a trip' },
  { value: 'ws:broadcast:user', label: 'ws:broadcast:user', hint: 'Push realtime events to a single user' },
  { value: 'hook:photo-provider', label: 'hook:photo-provider', hint: 'Supply place photos to TREK' },
  { value: 'hook:calendar-source', label: 'hook:calendar-source', hint: 'Supply calendar events to TREK' },
  { value: 'hook:notification-channel', label: 'hook:notification-channel', hint: 'Deliver TREK notifications over your own channel' },
  { value: 'hook:place-detail-provider', label: 'hook:place-detail-provider', hint: 'Contribute extra details (reviews, ratings, links) to a place' },
  { value: 'hook:trip-warning-provider', label: 'hook:trip-warning-provider', hint: 'Raise validation warnings on a trip (shown in the planner)' },
  { value: 'http:outbound', label: 'http:outbound', hint: 'Call external HTTP hosts (needs an egress allow-list)' },
];

export const KNOWN_PERMISSIONS: string[] = PERMISSION_CATALOG.map((p) => p.value);

// ── reporter seam (for commands that log their own progress, e.g. publish) ────

/** A progress sink. The default writes the same plain lines as before; the
 *  interactive one routes through Clack styling. Keeping this an injectable
 *  `log(msg)` means the tested publish path is byte-identical by default. */
export type LogSink = (msg: string) => void;

/** Non-interactive default: exactly the previous `console.error` behaviour. */
export const plainLog: LogSink = (msg: string) => console.error(msg);

/** Interactive sink: same text, rendered as a Clack step on stderr. */
export const clackLogSink: LogSink = (msg: string) => clackLog.step(msg.trim(), { output: OUT });

// ── flag helpers ──────────────────────────────────────────────────────────────

/** Pure: which of `required` flags are absent. Drives both the interactive
 *  prompt (fill the gaps) and the non-interactive error (report them). */
export function missingArgs(flags: Record<string, string>, required: string[]): string[] {
  return required.filter((k) => !flags[k]);
}
