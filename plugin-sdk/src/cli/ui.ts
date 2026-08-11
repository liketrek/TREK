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
  groupMultiselect as clackGroupMultiselect,
  confirm as clackConfirm,
  type TextOptions,
  type SelectOptions,
  type MultiSelectOptions,
  type GroupMultiSelectOptions,
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

/**
 * One multiselect, options rendered under group headers. Used for permissions: 58 of them
 * in a flat list is unreadable, but splitting the pick across TWO prompts was worse — Clack
 * has no "back", so choosing the wrong group was a dead end you could only escape with ^C.
 * Grouping keeps it a single screen you can scroll, with no navigation to get lost in.
 */
export const promptGroupMultiselect = async <Value>(
  opts: Omit<GroupMultiSelectOptions<Value>, 'output'>,
): Promise<Value[]> => orCancel(await clackGroupMultiselect({ ...opts, output: OUT }));

export const promptConfirm = async (opts: Omit<ConfirmOptions, 'output'>): Promise<boolean> =>
  orCancel(await clackConfirm({ ...opts, output: OUT }));

// ── permissions ──────────────────────────────────────────────────────────────

/**
 * Every permission an author can grant, grouped into the areas of TREK they touch.
 *
 * This used to be a hand-written list, and it silently fell 40 permissions behind the
 * host — `create` could not offer `jobs:run`, `events:subscribe` or 7 of the 12 hooks,
 * so a scaffolded plugin that needed one had no way to ask for it. The families below
 * are now the ONLY place a permission may be listed, and `test/cli.test.ts` fails if a
 * permission in the manifest validator's KNOWN_PERMISSIONS has no entry here. Add a
 * permission to TREK ⇒ the test tells you to describe it ⇒ `create` offers it.
 *
 * `db:read:*` grants read the data the REQUESTING USER can already see; `db:write:*`
 * grants act on trips that user can edit. Neither is a superuser grant.
 */
export interface PermissionFamily {
  id: string;
  label: string;
  hint: string;
  permissions: { value: string; hint: string }[];
}

export const PERMISSION_FAMILIES: PermissionFamily[] = [
  {
    id: 'storage',
    label: 'Its own storage',
    hint: 'Where the plugin keeps data of its own',
    permissions: [
      { value: 'db:own', hint: 'A private database only this plugin can read/write' },
      { value: 'db:meta', hint: 'Attach its own private data to trips, places and days the user can access' },
    ],
  },
  {
    id: 'trips',
    label: 'Trips & members',
    hint: 'The trip itself, and who is on it',
    permissions: [
      { value: 'db:read:trips', hint: 'Read trips the requesting user can access' },
      { value: 'db:write:trips', hint: 'Edit trip details (title, dates, currency…) on trips the user can edit' },
      { value: 'db:create:trips', hint: 'Create new trips for the requesting user' },
      { value: 'db:read:users', hint: 'Read basic user profiles' },
      { value: 'db:write:members', hint: 'Add and remove trip members' },
    ],
  },
  {
    id: 'itinerary',
    label: 'Places, days & itinerary',
    hint: 'The plan itself — the planner\'s core',
    permissions: [
      { value: 'db:write:places', hint: 'Add, edit and remove places on trips the user can edit' },
      { value: 'db:write:days', hint: 'Add, edit and remove days on trips the user can edit' },
      { value: 'db:write:itinerary', hint: 'Assign and remove places on days of trips the user can edit' },
      { value: 'db:read:categories', hint: 'Read the place categories TREK ships' },
      { value: 'db:read:tags', hint: 'Read the tags used to label places' },
      { value: 'db:write:tags', hint: 'Create, rename and delete tags' },
    ],
  },
  {
    id: 'bookings',
    label: 'Reservations & accommodation',
    hint: 'Flights, trains, hotels',
    permissions: [
      { value: 'db:write:reservations', hint: 'Create, edit and delete reservations (flights, trains, restaurants…)' },
      { value: 'db:write:accommodations', hint: 'Create, edit and delete accommodation (hotels, rentals)' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    hint: 'Costs and splits — needs the budget addon enabled',
    permissions: [
      { value: 'db:read:costs', hint: 'Read costs (budget items) the requesting user can access' },
      { value: 'db:write:costs', hint: 'Create, edit and delete costs on trips the user can edit' },
    ],
  },
  {
    id: 'packing',
    label: 'Packing & todos',
    hint: 'Checklists — packing needs the packing addon',
    permissions: [
      { value: 'db:read:packing', hint: 'Read packing lists and bags' },
      { value: 'db:write:packing', hint: 'Create, edit, tick and delete packing items and bags' },
      { value: 'db:read:todos', hint: 'Read the trip todo list' },
      { value: 'db:write:todos', hint: 'Create, edit, tick and delete todos' },
    ],
  },
  {
    id: 'files',
    label: 'Files & documents',
    hint: 'Uploads — needs the documents addon enabled',
    permissions: [
      { value: 'db:read:files', hint: 'List a trip\'s files and their metadata (NOT their contents)' },
      { value: 'db:read:files:content', hint: 'Read the actual BYTES of a file — grant this only if you truly need them' },
      { value: 'db:write:files', hint: 'Upload, link, rename and delete files' },
    ],
  },
  {
    id: 'collab',
    label: 'Collaboration',
    hint: 'Notes, polls, chat — needs the collab addon enabled',
    permissions: [
      { value: 'db:read:collab', hint: 'Read shared notes, polls and chat messages' },
      { value: 'db:write:collab', hint: 'Create notes and polls, vote, and post messages' },
      { value: 'db:read:daynotes', hint: 'Read the notes pinned to a day' },
      { value: 'db:write:daynotes', hint: 'Create, edit and delete day notes' },
    ],
  },
  {
    id: 'journal',
    label: 'Journal, Atlas, Vacay & collections',
    hint: 'The cross-trip features — each needs its addon enabled',
    permissions: [
      { value: 'db:read:journal', hint: 'Read journeys and their entries' },
      { value: 'db:write:journal', hint: 'Create and edit journeys and journal entries' },
      { value: 'db:read:atlas', hint: 'Read visited countries/regions and the bucket list' },
      { value: 'db:write:atlas', hint: 'Mark places visited and edit the bucket list' },
      { value: 'db:read:vacay', hint: 'Read vacation-day plans and balances' },
      { value: 'db:write:vacay', hint: 'Toggle vacation days and company holidays' },
      { value: 'db:read:collections', hint: 'Read saved place collections' },
      { value: 'db:write:collections', hint: 'Create collections, save places into them, and copy them to a trip' },
    ],
  },
  {
    id: 'hooks',
    label: 'Provider hooks (render inside TREK natively)',
    hint: 'TREK calls YOU. Without the matching grant a hook is NEVER invoked — silently',
    permissions: [
      { value: 'hook:photo-provider', hint: 'Supply place photos to TREK' },
      { value: 'hook:calendar-source', hint: 'Supply calendar events to TREK' },
      { value: 'hook:place-detail-provider', hint: 'Contribute extra details (reviews, ratings, links) to a place' },
      { value: 'hook:trip-warning-provider', hint: 'Raise validation warnings on a trip (shown in the planner)' },
      { value: 'hook:table-contributor', hint: 'Add columns to TREK\'s tables' },
      { value: 'hook:map-marker-provider', hint: 'Add your own markers to the map' },
      { value: 'hook:pdf-section-provider', hint: 'Add a section to the exported trip PDF' },
      { value: 'hook:atlas-layer-provider', hint: 'Add a layer to the Atlas map' },
      { value: 'hook:journal-entry-provider', hint: 'Contribute entries to a journey' },
      { value: 'hook:trip-card-provider', hint: 'Add a badge/card to the trip list' },
      { value: 'hook:notification-channel', hint: 'Deliver TREK notifications over your own channel' },
      { value: 'hook:user-data', hint: 'Implement GDPR erasure/export of the data you hold for a user' },
    ],
  },
  {
    id: 'background',
    label: 'Background work',
    hint: 'Run without a user present. Ungranted, these never run at all',
    permissions: [
      { value: 'jobs:run', hint: 'Run cron jobs and ctx.scheduler timers (no acting user)' },
      { value: 'events:subscribe', hint: 'Receive TREK events (place:created, trip:updated…) as they happen' },
    ],
  },
  {
    id: 'realtime',
    label: 'Realtime push',
    hint: 'Push to connected clients over the websocket',
    permissions: [
      { value: 'ws:broadcast:trip', hint: 'Push realtime events to everyone on a trip' },
      { value: 'ws:broadcast:user', hint: 'Push realtime events to a single user' },
    ],
  },
  {
    id: 'services',
    label: 'Network & host services',
    hint: 'Reach the outside world, or borrow a TREK service',
    permissions: [
      { value: 'http:outbound', hint: 'Call external HTTP hosts (you name the hosts next)' },
      { value: 'weather:read', hint: 'Read forecasts through TREK\'s weather service' },
      { value: 'rates:read', hint: 'Read currency exchange rates through TREK' },
      { value: 'notify:send', hint: 'Send a TREK notification to a user or trip' },
      { value: 'ai:invoke', hint: 'Call the instance\'s configured AI model' },
      { value: 'oauth:client', hint: 'Obtain OAuth access tokens for the user' },
    ],
  },
];

/** Flat view of every permission, for the non-interactive path and the tests. */
export const PERMISSION_CATALOG: { value: string; label: string; hint: string; family: string }[] =
  PERMISSION_FAMILIES.flatMap((f) =>
    f.permissions.map((p) => ({ value: p.value, label: p.value, hint: p.hint, family: f.id })),
  );

/** Every grantable permission id. Derived — never hand-maintained. */
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
