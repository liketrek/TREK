import type { TripCard } from '../../assistant-context';
import type { ToolArgs } from '../card-types';
import { argId, blockText, clipped, fileKeyOf, idIn, instantOf, personOf, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { MAX_CARD_CHARS, type CardPerson } from '@trek/shared';

/**
 * The readers the trip chat's cards share: people as a collab row names them
 * (its author, a voter), the moments the chat stores, a text with its line
 * breaks and whether it was cut, and a link read as its host. Text from a
 * tool's answer is masked, text from a held call's arguments only cut: the
 * card shows exactly what will be posted.
 */

/** Upload paths of TREK's own avatars; a picture on another host has no key. */
const AVATAR_PATH = '/uploads/avatars/';

/** The person a collab row names: `idKey` and `nameKey` of the row, its `avatar_url` as a stored file name. */
export function personFrom(row: Row, idKey = 'user_id', nameKey = 'username'): CardPerson | null {
  const id = argId(row, idKey);
  if (id === null) return null;
  return { id, name: clipped(row[nameKey], 80) ?? `#${id}`, avatarKey: fileKeyOf(row.avatar_url) };
}

/** The signed-in user as the trip card names them; null when the card does not list them. */
export function viewerOf(card: TripCard): CardPerson | null {
  return personOf(card, card.viewerId);
}

/** A person as a collab row would name them, so a vote or a reaction the card adds reads like the others. */
export function asRow(person: CardPerson): Row {
  return {
    user_id: person.id,
    username: person.name,
    avatar_url: person.avatarKey ? `${AVATAR_PATH}${person.avatarKey}` : null,
  };
}

const SQLITE_UTC = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

/**
 * A moment as the cards carry it (`YYYY-MM-DDTHH:MM:SSZ`): one that names its
 * zone as it is, and one without, as SQLite stores its stamps (a message's
 * `created_at`), read as UTC the way the chat reads those. A date alone is
 * its midnight in UTC, as a browser parses it.
 */
export function stampOf(value: unknown): string | null {
  const zoned = instantOf(value);
  if (zoned || typeof value !== 'string') return zoned;
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00Z`;
  const match = SQLITE_UTC.exec(text);
  return match ? instantOf(`${match[1]}T${match[2]}:${match[3] ?? '00'}Z`) : null;
}

/**
 * A poll's deadline as the cards carry it. The deadline is stored as it was
 * sent and the Collab tab reads it with `new Date()`, so a date and time
 * without a zone is the viewer's own local time there: a different moment for
 * each viewer, which no instant on a card can match. Such a deadline gives
 * null (the card shows none rather than a countdown off by the viewer's
 * offset); one with a zone, and a date alone (midnight UTC in a browser too),
 * read as `stampOf` reads them. The app writes `toISOString()`, so only a
 * hand-made deadline lacks a zone.
 */
export function deadlineOf(value: unknown): string | null {
  if (typeof value === 'string' && SQLITE_UTC.test(value.trim())) return null;
  return stampOf(value);
}

/** Whether a deadline lies behind `now`; a poll without one never ends by itself. */
export function hasPassed(deadline: string | null, now: number): boolean {
  return deadline !== null && Date.parse(deadline) <= now;
}

/** A text with its line breaks kept, cut to `max`, and whether anything was cut away. */
export function excerptOf(value: unknown, max: number, mask: boolean): { text: string; cut: boolean } | null {
  const whole = blockText(value, Number.MAX_SAFE_INTEGER, { mask });
  if (whole === null) return null;
  return { text: blockText(whole, max, { mask: false }) ?? '', cut: whole.length > max };
}

/** One line of a held call's arguments, cut but not masked. */
export function lineOf(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = value.replace(/\s+/g, ' ').trim();
  if (line === '') return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/**
 * The host of a note's link, without "www.", for a web address only; any
 * other scheme, a bare word or a broken address gives null.
 */
export function hostOf(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = url.hostname.replace(/^www\./, '');
    return host !== '' && host.length <= 253 ? host : null;
  } catch {
    return null;
  }
}

/** The rows a list read answered under `key` (`{ messages: [...] }`). */
export function listed(value: unknown, key: string): Row[] {
  return rowsOf(recordOf(value)[key]);
}

/** The row of `rows` with the id an argument names. */
export function rowById(rows: readonly Row[], id: number | null): Row | null {
  return id === null ? null : (rows.find((row) => row.id === id) ?? null);
}

/** The receipt's ids from the row an answer names under `key` (`{ poll: { id } }`). */
export function answeredId(key: string): (args: ToolArgs, result: unknown) => number[] {
  return (_args, result) => {
    const id = idIn(result, key);
    return id === null ? [] : [id];
  };
}

/** The receipt's ids from the argument `key`, for a write whose answer names nothing. */
export function namedId(key: string): (args: ToolArgs) => number[] {
  return (args) => {
    const id = argId(args, key);
    return id === null ? [] : [id];
  };
}

/**
 * The most of `items` a card holds within MAX_CARD_CHARS: one item less at a
 * time, from the end `drop` names, while the card is too heavy and more than
 * one is left. A read of long messages with many reactions shows fewer of
 * them rather than no card.
 */
export function fitted<T, C>(items: readonly T[], build: (shown: T[]) => C, drop: 'first' | 'last'): C {
  let shown = [...items];
  let card = build(shown);
  while (shown.length > 1 && JSON.stringify(card).length > MAX_CARD_CHARS) {
    shown = drop === 'first' ? shown.slice(1) : shown.slice(0, -1);
    card = build(shown);
  }
  return card;
}
