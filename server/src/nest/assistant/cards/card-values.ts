import type { TripCard } from '../assistant-context';
import { redactForProvider } from '../assistant-redact';
import { cardFileKeySchema, type CardPerson } from '@trek/shared';

/**
 * The readers every card is built with. They take a tool's own answer or a
 * call's arguments as they come, trust no shape, and give null for what is
 * not there. Text from a RESULT is masked like a provider answer (`clipped`,
 * `blockText` with `mask`), so an e-mail address in a name or a note never
 * reaches a card; text from ARGS is only cut, since it is what will be stored.
 */

export type Row = Record<string, unknown>;

export function recordOf(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
}

export function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function isLat(value: number | null): value is number {
  return value !== null && Math.abs(value) <= 90;
}

export function isLng(value: number | null): value is number {
  return value !== null && Math.abs(value) <= 180;
}

function cut(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** A text as a card may show it: on one line, masked like a provider answer, and cut to `max`. */
export function clipped(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = String(redactForProvider(value.replace(/\s+/g, ' ').trim()));
  return line === '' ? null : cut(line, max);
}

/**
 * A longer text (a note, a message) with its line breaks kept: spaces run
 * together, at most one empty line between paragraphs, cut to `max`. Masked
 * when it comes from a result.
 */
export function blockText(value: unknown, max: number, { mask }: { mask: boolean }): string | null {
  if (typeof value !== 'string') return null;
  const lines = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim());
  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const shown = mask ? String(redactForProvider(text)) : text;
  return shown === '' ? null : cut(shown, max);
}

function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** The id of the row an answer names under `key` (`{ place: { id } }`). */
export function idIn(value: unknown, key: string): number | null {
  return positiveId(recordOf(recordOf(value)[key]).id);
}

/** An argument read as an id. */
export function argId(args: Row, key: string): number | null {
  return positiveId(args[key]);
}

const CLOCK = /^(?:\d{4}-\d{2}-\d{2}[T ])?([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

/** A time of day as `HH:MM`, from a clock (`9:30`, `09:30:00`) or the clock of a date and time as written. */
export function clockOf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = CLOCK.exec(value.trim());
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
}

const ZONED = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * A moment as `YYYY-MM-DDTHH:MM:SSZ`, from a date and time that names its
 * zone. One without a zone is a local time and no moment, so it gives null.
 */
export function instantOf(value: unknown): string | null {
  if (typeof value !== 'string' || !ZONED.test(value.trim())) return null;
  const ms = Date.parse(value.trim());
  return Number.isNaN(ms) ? null : `${new Date(ms).toISOString().slice(0, 19)}Z`;
}

/** A colour the data carries, `#rrggbb`; anything else gives null. */
export function hexOrNull(value: unknown): string | null {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

/**
 * The stored file name behind one of TREK's own upload paths
 * (`/uploads/<dir>/<file>`), for the client to build the path again. Anything
 * else, a picture on another host among them, gives null.
 */
export function fileKeyOf(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const match = /^\/uploads\/[\w-]+\/([^/?#]+)$/.exec(raw);
  return match && cardFileKeySchema.safeParse(match[1]).success ? match[1] : null;
}

/** A trip member as a card shows them, from the trip card; null for someone not in the trip. */
export function personOf(card: TripCard, id: number): CardPerson | null {
  const member = card.members.get(id);
  const name = member ? clipped(member.name, 80) : null;
  return member && name ? { id, name, avatarKey: member.avatarKey } : null;
}

/** JSON with the keys of every object in order, so the same arguments always give the same text. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Row)
      .filter(([, inner]) => inner !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, inner]) => `${JSON.stringify(key)}:${canonicalJson(inner)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** How one read is named: its tool and its arguments, the same for the same read whatever the key order. */
export function readKey(tool: string, args: Row = {}): string {
  return `${tool} ${canonicalJson(args)}`;
}
