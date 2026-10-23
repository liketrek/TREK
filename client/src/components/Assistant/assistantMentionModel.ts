import type { DirectiveFormatter, TriggerItem } from '@assistant-ui/react';
import { ASSISTANT_MENTION_KINDS, type AssistantMention } from '@trek/shared';

import type { AssistantMentionItem } from '../../store/assistantStore';
import type { Day, Place, Reservation } from '../../types';
import { dayDate, dayLabel } from '../../utils/dayLabel';

/**
 * What `@` in the composer offers and what it writes: the trip's days, places
 * and bookings as entries of the popover, `@label` in the text for a pick, and
 * the way back from that text to the mentions a question still carries.
 */

export type MentionKind = AssistantMention['kind'];

/** The heading of each list `@` opens. */
export const MENTION_KINDS: Record<MentionKind, { labelKey: string }> = {
  day: { labelKey: 'assistant.mention.days' },
  place: { labelKey: 'assistant.mention.places' },
  reservation: { labelKey: 'assistant.mention.bookings' },
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The longest label the server keeps for a mention. */
const LABEL_MAX = 120;
/** Hits shown while typing after `@`; the list stays one short glance. */
const SEARCH_MAX = 8;

interface MentionSources {
  days: readonly Day[];
  places: readonly Place[];
  reservations: readonly Reservation[];
}

type MentionGroups = Record<MentionKind, TriggerItem[]>;

/** A label as it goes into the text: one line, trimmed, never longer than the server keeps. */
export function mentionLabel(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, LABEL_MAX);
}

function entry(kind: MentionKind, id: number, name: string, description?: string | null): TriggerItem[] {
  const label = mentionLabel(name);
  if (!label) return [];
  return [{ id: `${kind}:${id}`, type: kind, label, ...(description ? { description } : {}), metadata: { id } }];
}

/**
 * The entries `@` lists, per kind. A day reads as it does in the day list; a
 * titled day adds its date, and a booking the day it is on.
 */
export function mentionGroups(sources: MentionSources, t: Translate, locale: string): MentionGroups {
  const dayNames = new Map(sources.days.map((d, i) => [d.id, dayLabel(d, i, t, locale)]));
  return {
    day: sources.days.flatMap((d) =>
      entry('day', d.id, dayNames.get(d.id) ?? '', d.title && d.date ? dayDate(d.date, locale) : null)
    ),
    place: sources.places.flatMap((p) => entry('place', p.id, p.name)),
    reservation: sources.reservations.flatMap((r) =>
      entry('reservation', r.id, r.title, r.day_id ? dayNames.get(r.day_id) : null)
    ),
  };
}

/** 0 for a label that starts with the query, 1 for one with a word that does, 2 for the rest. */
function rankOf(label: string, at: number): number {
  if (at === 0) return 0;
  return /\s/u.test(label.charAt(at - 1)) ? 1 : 2;
}

/** The entries whose label holds the query, across all kinds, the best matches first. */
export function searchMentions(groups: MentionGroups, query: string): TriggerItem[] {
  const q = query.toLocaleLowerCase();
  const hits: { item: TriggerItem; rank: number }[] = [];
  for (const kind of ASSISTANT_MENTION_KINDS) {
    for (const item of groups[kind]) {
      const label = item.label.toLocaleLowerCase();
      const at = label.indexOf(q);
      if (at >= 0) hits.push({ item, rank: rankOf(label, at) });
    }
  }
  return hits
    .sort((a, b) => a.rank - b.rank)
    .slice(0, SEARCH_MAX)
    .map((h) => h.item);
}

/** The mention a picked entry stands for; null for anything the popover did not build. */
export function mentionOf(item: TriggerItem): AssistantMentionItem | null {
  const kind = ASSISTANT_MENTION_KINDS.find((k) => k === item.type);
  const id = item.metadata?.id;
  if (!kind || typeof id !== 'number') return null;
  return { kind, id, label: item.label };
}

/** A pick goes into the text as `@label`; the text stays plain, what it names is kept in the store. */
export const MENTION_FORMATTER: DirectiveFormatter = {
  serialize: (item) => `@${item.label}`,
  parse: (text) => [{ kind: 'text', text }],
};

/** True when no letter or digit follows at `end`, so `@Rome` does not end inside `@Romeo`. */
function endsWord(text: string, end: number): boolean {
  return !/[\p{L}\p{N}]/u.test(text.charAt(end));
}

/** Where `@label` stands in the text as a whole word. */
function tokenAt(text: string, label: string): number {
  const token = `@${label}`;
  for (let at = text.indexOf(token); at >= 0; at = text.indexOf(token, at + 1)) {
    if (endsWord(text, at + token.length)) return at;
  }
  return -1;
}

function hasMention(text: string, label: string): boolean {
  return tokenAt(text, label) >= 0;
}

/** The text with `@label ` written at its end, the way a pick from the popover leaves it. */
export function withMention(text: string, label: string): string {
  if (hasMention(text, label)) return text;
  const gap = text === '' || /\s$/u.test(text) ? '' : ' ';
  return `${text}${gap}@${label} `;
}

interface MentionSegment {
  text: string;
  /** Where the segment starts in the text. */
  at: number;
  /** True for an `@label` the question named a day, place or booking with. */
  mention: boolean;
}

/** A sent question cut into plain text and its `@label` mentions; the longest label wins a tie. */
export function splitMentions(text: string, labels: readonly string[]): MentionSegment[] {
  const tokens = [...new Set(labels)]
    .filter(Boolean)
    .map((l) => `@${l}`)
    .sort((a, b) => b.length - a.length);
  const out: MentionSegment[] = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const token =
      text[i] === '@' ? tokens.find((tk) => text.startsWith(tk, i) && endsWord(text, i + tk.length)) : undefined;
    if (token) {
      if (i > start) out.push({ text: text.slice(start, i), at: start, mention: false });
      out.push({ text: token, at: i, mention: true });
      i += token.length;
      start = i;
    } else {
      i += 1;
    }
  }
  if (start < text.length) out.push({ text: text.slice(start), at: start, mention: false });
  return out;
}
