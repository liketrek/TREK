import type { CardReader, Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, idIn, recordOf, type Row } from '../card-values';
import { formatDate, Rows, text } from '../preview-format';
import { entriesCard, lookOf } from './journey-look';
import {
  stripMarkdown,
  type AssistantChangePreview,
  type AssistantChangeRow,
  type JourneyEntriesCard,
} from '@trek/shared';

/**
 * The change cards of the journal entries an assistant writes, changes and
 * deletes: the words of the row (what the entry is about, its day, time,
 * place and the start of its text, before and after on a change) and the
 * card under it, built from the call's arguments over the entry as it stands.
 * A change does not touch the trip plan, so it names no day and no place.
 *
 * What an update sets beyond the words (who sees the entry, its mood and
 * weather, its kind, whether it is a draft, counts on the route or is waved
 * away) goes on `field` rows under the tool's own names, as stored ids and
 * flags as ✓ or ✗; the card names each in the user's words.
 */

/** What a held journal write looked up before its card is drawn. */
export interface JournalLoaded {
  /** The entry as it stands (a change or a delete); null for a new one. */
  entry: Row | null;
  journeyId: number | null;
  /** The journal's title, as stored. */
  title: unknown;
  /** The journal is the one the open trip shows in its Journal tab. */
  tripJournal: boolean;
}

/** The fields of an entry an update can set, by the names the tool and the row share. */
const ENTRY_FIELDS = [
  'title',
  'story',
  'entry_date',
  'entry_time',
  'location_name',
  'location_lat',
  'location_lng',
  'mood',
  'weather',
  'visibility',
  'type',
  'is_draft',
] as const;

/** The states of an entry an update can set, each a row of its own when it changes. */
const STATE_FIELDS = ['visibility', 'mood', 'weather', 'type', 'is_draft', 'stats_excluded', 'dismissed'] as const;
const FLAG_FIELDS: ReadonlySet<string> = new Set(['is_draft', 'stats_excluded', 'dismissed']);

/** The journal the open trip shows, as `get_trip_journal` answers. */
async function tripJournalOf(read: CardReader): Promise<{ journeyId: number | null; title: unknown }> {
  const link = recordOf(recordOf(await read('get_trip_journal')).link);
  return { journeyId: argId(link, 'journey_id'), title: link.title };
}

/**
 * What a journal write needs beyond its arguments: for a new entry the
 * journal's title (the trip's own journal, else the user's list), for a
 * change or a delete the entry as it stands. At most three reads. An update
 * that brings back a waved-away suggestion (`dismissed: false`) finds no
 * entry, since the read leaves dismissed ones out as the journal does: its
 * row then stands on its arguments alone, without a card.
 */
export async function loadJournal(tool: string, args: ToolArgs, read: CardReader): Promise<JournalLoaded | null> {
  const trip = await tripJournalOf(read);
  if (tool === 'create_journey_entry') {
    const journeyId = argId(args, 'journeyId');
    if (journeyId === null) return null;
    if (trip.journeyId === journeyId) return { entry: null, journeyId, title: trip.title, tripJournal: true };
    const journeys = recordOf(await read('list_journeys')).journeys;
    const own = Array.isArray(journeys) ? journeys.map(recordOf).find((row) => row.id === journeyId) : undefined;
    return { entry: null, journeyId, title: own?.title ?? null, tripJournal: false };
  }
  const entryId = argId(args, 'entryId');
  if (entryId === null) return null;
  const found = recordOf(await read('get_journey_entry', { entryId }));
  const journeyId = idIn(found, 'journey');
  if (journeyId === null) return null;
  return {
    entry: recordOf(found.entry),
    journeyId,
    title: recordOf(found.journey).title,
    tripJournal: trip.journeyId === journeyId,
  };
}

/** A story as a row shows it: its markdown taken off, cut like any value. */
function storyText(value: unknown): string {
  return typeof value === 'string' ? text(stripMarkdown(value)) : '';
}

/** What an entry is about: its title, else its place, else its day. */
function subjectOf(ctx: PreviewContext, row: Row): string {
  const day = typeof row.entry_date === 'string' ? formatDate(ctx, row.entry_date) : '';
  return text(row.title) || text(row.location_name) || day;
}

function dayText(ctx: PreviewContext, value: unknown): string {
  return typeof value === 'string' ? formatDate(ctx, value) : '';
}

function described(subject: string, rows: Rows): Described {
  return { subject, rows, dayId: null, placeIds: [], domain: 'journey' };
}

/** A state as its row writes it: a flag (stored 0 or 1, sent as a boolean) as ✓ or ✗, anything else as it is. */
function stateText(field: string, value: unknown): string {
  return FLAG_FIELDS.has(field) ? text(value === true || value === 1) : text(value);
}

/**
 * A row for each state the update sets to something other than what the entry
 * holds. A state the entry as read does not name has no before: that is the
 * case of a waved-away suggestion brought back, which the read never finds.
 */
function addStateRows(rows: Rows, before: Row, args: ToolArgs): void {
  for (const field of STATE_FIELDS) {
    if (!(field in args)) continue;
    const was = field in before ? stateText(field, before[field]) : '';
    const now = stateText(field, args[field]);
    if (was === now) continue;
    const row: AssistantChangeRow = { op: 'change', labelKey: 'field', field, before: was || null, after: now };
    rows.rows.push(row);
  }
}

/** The fields of the entry an update sets: those its arguments name, a null among them clearing one. */
function changedFields(args: ToolArgs): Array<(typeof ENTRY_FIELDS)[number]> {
  return ENTRY_FIELDS.filter((field) => field in args);
}

export const JOURNEY_DESCRIBERS = {
  create_journey_entry: (ctx: PreviewContext, args: ToolArgs): Described => {
    const rows = new Rows()
      .add('day', dayText(ctx, args.entry_date))
      .add('time', text(args.entry_time))
      .add('location', text(args.location_name))
      .add('text', storyText(args.story));
    return described(subjectOf(ctx, args), rows);
  },
  update_journey_entry: (ctx: PreviewContext, args: ToolArgs, loaded: JournalLoaded | null): Described => {
    const before: Row = loaded?.entry ?? {};
    const rows = new Rows();
    if ('title' in args) rows.change('name', text(before.title), text(args.title));
    if ('entry_date' in args) rows.change('day', dayText(ctx, before.entry_date), dayText(ctx, args.entry_date));
    if ('entry_time' in args) rows.change('time', text(before.entry_time), text(args.entry_time));
    if ('location_name' in args) rows.change('location', text(before.location_name), text(args.location_name));
    if ('story' in args) rows.change('text', storyText(before.story), storyText(args.story));
    addStateRows(rows, before, args);
    return described(subjectOf(ctx, { ...before, ...args }), rows);
  },
  delete_journey_entry: (ctx: PreviewContext, _args: ToolArgs, loaded: JournalLoaded | null): Described => {
    const entry: Row = loaded?.entry ?? {};
    const rows = new Rows().add('day', dayText(ctx, entry.entry_date)).add('location', text(entry.location_name));
    return described(subjectOf(ctx, entry), rows);
  },
};

/** The card under a held journal write: the entry it will write, change or delete. */
export function journalChangeCard(
  tool: string,
  args: ToolArgs,
  loaded: JournalLoaded | null,
): JourneyEntriesCard | null {
  if (!loaded) return null;
  const journal = { journeyId: loaded.journeyId, title: loaded.title, tripJournal: loaded.tripJournal };
  if (tool === 'create_journey_entry') {
    const row = { ...args, id: null, photos: [], is_draft: args.is_draft === true };
    const look = lookOf(row, { fromArgs: new Set(ENTRY_FIELDS) });
    return entriesCard({ ...journal, change: 'new' }, look ? [look] : [], 0);
  }
  if (!loaded.entry) return null;
  if (tool === 'update_journey_entry') {
    const set = changedFields(args);
    const row = { ...loaded.entry, ...Object.fromEntries(set.map((field) => [field, args[field]])) };
    const look = lookOf(row, { fromArgs: new Set(set) });
    return entriesCard({ ...journal, change: 'changed' }, look ? [look] : [], 0);
  }
  const look = lookOf(loaded.entry);
  return entriesCard({ ...journal, change: 'willDelete' }, look ? [look] : [], 0);
}

/**
 * The card of an applied write: the entry as the tool answered it, with its
 * photos and the country its place lies in, beside the journal the held card
 * named. A delete keeps its held card.
 */
export function journalAppliedCard(
  tool: string,
  result: unknown,
  preview: AssistantChangePreview | null,
): JourneyEntriesCard | null {
  if (tool === 'delete_journey_entry') return null;
  const entry = recordOf(recordOf(result).entry);
  const held = preview?.card?.kind === 'journeyEntries' ? preview.card : null;
  const look = lookOf(entry);
  const journeyId = argId(entry, 'journey_id') ?? held?.journeyId ?? null;
  return entriesCard(
    {
      journeyId,
      title: held?.journalTitle ?? null,
      tripJournal: held?.tripJournal ?? false,
      change: tool === 'create_journey_entry' ? 'new' : 'changed',
    },
    look ? [look] : [],
    0,
  );
}
