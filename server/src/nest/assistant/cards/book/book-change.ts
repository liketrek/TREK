import { logWarn } from '../../../audit/audit-log.logger';
import type { CardReader, Described, ToolArgs } from '../card-types';
import { recordOf, type Row } from '../card-values';
import { Rows, text } from '../preview-format';
import { BOOK_TRIAL_READ, trialFrom, type BookTrialRan } from './book-trial';
import {
  BOOK_OP_LIMITS,
  BOOK_PAGE_CARD_LIMITS,
  bookCardFindingSchema,
  bookCardPageSchema,
  bookPageOpSchema,
  bookSpreadSchema,
  MAX_CARD_CHARS,
  setBookCoverArgs,
  setBookCoverRequestSchema,
  type AssistantChangePreview,
  type BookCardCover,
  type BookCardFinding,
  type BookCardLayout,
  type BookCardPage,
  type BookPageCard,
} from '@trek/shared';

/**
 * The change card of a held book write and its receipt. Both are built from
 * the trial the turn's gate made of the call (book-trial.ts): the pages the
 * change works on with their place in the book, what it lays them out on and
 * brings onto them, and the findings on the pages it leaves. The card of an
 * edit or the cover carries the page the trial made, so the Studio draws the
 * page after as the tool would write it while its book is at the trial's
 * version, and the operations for a book that moved on since or a card that
 * cannot carry that page. Once applied, the pages come from the tool's answer.
 */

/** What describing a held book write looked up: the gate's trial of it, null when there was none. */
export interface BookLoaded {
  trial: BookTrialRan | null;
}

/** What a change does to its pages, by tool. */
const CHANGE_OF: Readonly<Record<string, BookPageCard['change']>> = {
  create_book: 'new',
  add_book_pages: 'new',
  edit_book_page: 'changed',
  set_book_cover: 'changed',
  move_book_page: 'moved',
  delete_book_pages: 'willDelete',
};

/**
 * Operations past this weight are not carried: twenty texts of two thousand
 * characters would push the card past MAX_CARD_CHARS and lose it whole. Such
 * a card shows its facts, and the page after only where it carries the page
 * the trial made.
 */
const MAX_OPS_CHARS = 12_000;

/** The tools whose card the Studio draws the page after for: an edit and the cover. */
const DRAWS_AFTER: ReadonlySet<string> = new Set(['edit_book_page', 'set_book_cover']);

/** The trial of `tool` with these arguments, through the turn's reader; null without one or for a refused call. */
export async function loadBook(tool: string, args: ToolArgs, read: CardReader): Promise<BookLoaded> {
  const trial = trialFrom(await read(BOOK_TRIAL_READ, { tool, args }));
  return { trial: trial?.ok === true ? trial : null };
}

/** The change card's words: the page's first text as its subject, a move's places and a cover's title as rows. */
export function describeBook(tool: string, args: ToolArgs, loaded: BookLoaded | null): Described {
  const trial = loaded?.trial ?? null;
  const rows = new Rows();
  const from = trial?.before[0]?.number;
  const to = trial?.after[0]?.number;
  if (tool === 'move_book_page' && from && to) rows.move('position', String(from), String(to));
  if (tool === 'set_book_cover') rows.add('name', text(args.title));
  return { subject: trial?.subject ?? '', rows, dayId: null, placeIds: [] };
}

/** `edit_book_page`'s operations as the card carries them; none for another tool, broken ones or too many words. */
function opsOf(tool: string, args: ToolArgs): BookPageCard['ops'] {
  if (tool !== 'edit_book_page') return [];
  const parsed = bookPageOpSchema.array().max(BOOK_OP_LIMITS.opsPerCall).safeParse(args.ops);
  if (!parsed.success || JSON.stringify(parsed.data).length > MAX_OPS_CHARS) return [];
  return parsed.data;
}

/** `set_book_cover`'s arguments, null where the call leaves a part of the cover as it is. */
function coverOf(tool: string, args: ToolArgs): BookCardCover | null {
  if (tool !== 'set_book_cover') return null;
  const keys = Object.keys(setBookCoverArgs);
  const parsed = setBookCoverRequestSchema.safeParse(
    Object.fromEntries(Object.entries(args).filter(([key]) => keys.includes(key))),
  );
  if (!parsed.success) return null;
  const { template, photoId, title, subtitle } = parsed.data;
  return { template: template ?? null, photoId: photoId ?? null, title: title ?? null, subtitle: subtitle ?? null };
}

/** The layout an operation names, a saved one by the name the book gives it. */
function layoutOfOp(op: Row, savedName: string | null): BookCardLayout | null {
  if (typeof op.template === 'string') return { kind: 'template', id: op.template, name: null };
  if (typeof op.grid === 'string') return { kind: 'grid', id: op.grid, name: null };
  if (typeof op.saved === 'string') return { kind: 'saved', id: op.saved, name: savedName };
  return op.auto === true ? { kind: 'auto', id: 'auto', name: null } : null;
}

/** The layout a change lays its page out on: an edit's last layout operation, a new page's or the cover's template. */
function layoutOf(tool: string, args: ToolArgs, trial: BookTrialRan): BookCardLayout | null {
  if (tool === 'edit_book_page') {
    const ops = Array.isArray(args.ops) ? args.ops.map(recordOf) : [];
    const last = ops.filter((op) => op.op === 'layout').pop();
    return last ? layoutOfOp(last, trial.layoutName) : null;
  }
  if (tool === 'add_book_pages' || tool === 'set_book_cover') return layoutOfOp({ template: args.template }, null);
  return null;
}

/** The first findings as the card carries them, and how many severe ones and warnings come past them. */
function findingsOf(findings: readonly BookCardFinding[]): Pick<BookPageCard, 'findings' | 'moreFindings'> {
  const shown = findings.slice(0, BOOK_PAGE_CARD_LIMITS.findings);
  const past = findings.slice(shown.length).filter((finding) => finding.severity !== 'info');
  return {
    findings: shown.map(({ code, severity }) => ({ code, severity })),
    moreFindings: past.length,
  };
}

/**
 * Whether a card stays within MAX_CARD_CHARS. Its page is already read as the
 * union reads it and every other part is built in the union's shape, so the
 * registry's parse adds nothing and this is the weight it measures, or more:
 * carrying the page never costs the card itself.
 */
function fitsCard(card: BookPageCard): boolean {
  return JSON.stringify(card).length <= MAX_CARD_CHARS;
}

/**
 * The card with the page an edit or the cover leaves, as the trial made it
 * with the journey's photos, words and figures (a caption from its photo's
 * caption, a text from its entry, a map from the route): the Studio draws the
 * page after from it rather than running the operations on its own book,
 * which knows none of that. A page the book's schema refuses is never
 * carried (logged), so the card goes out whole with its operations. A page
 * that fits only without the operations goes without them: the Studio runs
 * them only once its book moved on from the trial's version, and such a card
 * then draws the page before alone. One too heavy even then (long texts, a
 * long route) is left out, and the Studio runs the operations as for a card
 * from before.
 */
function withAfter(tool: string, card: BookPageCard, trial: BookTrialRan): BookPageCard {
  const spreadId = card.pages[0]?.spreadId;
  const made = DRAWS_AFTER.has(tool) ? trial.spreads.find((spread) => spread.id === spreadId) : undefined;
  if (!made) return card;
  const parsed = bookSpreadSchema.safeParse(made);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    logWarn(`[assistant] the page after of ${tool} does not fit the book: ${issue?.path.join('.')} ${issue?.message}`);
    return card;
  }
  const full = { ...card, after: parsed.data };
  if (fitsCard(full)) return full;
  const bare = { ...full, ops: [] };
  return fitsCard(bare) ? bare : card;
}

/** How many pages a change adds (a new book: all of them) or deletes; none for any other change. */
function countOf(change: BookPageCard['change'], trial: BookTrialRan): number {
  if (change === 'new') return trial.after.length;
  return change === 'willDelete' ? trial.before.length : 0;
}

/**
 * The card under a held book write: the pages it works on as they stand (the
 * page edited, the cover, the page moved, the pages deleted, the page new ones
 * follow), what it brings, what the check found and the page an edit or the
 * cover leaves. Null without a trial: a card needs the journey and the book as
 * the server read them.
 */
export function bookChangeCard(tool: string, args: ToolArgs, loaded: BookLoaded | null): BookPageCard | null {
  const trial = loaded?.trial ?? null;
  const change = CHANGE_OF[tool];
  if (!trial || !change) return null;
  const card: BookPageCard = {
    kind: 'bookPage',
    journeyId: trial.journeyId,
    change,
    baseVersion: trial.version,
    pages: trial.before.slice(0, BOOK_OP_LIMITS.pagesPerCall),
    count: countOf(change, trial),
    movedTo: tool === 'move_book_page' ? (trial.after[0]?.number ?? null) : null,
    ops: opsOf(tool, args),
    cover: coverOf(tool, args),
    layout: layoutOf(tool, args, trial),
    photosAdded: trial.photosAdded,
    ...findingsOf(trial.findings),
  };
  return withAfter(tool, card, trial);
}

/** A page of a write's answer (`get_book`'s row) as a card names it, numbered as the held card knew it. */
function answeredPage(row: Row, number: (id: string) => number | null): BookCardPage | null {
  const { id, index, role } = row;
  if (typeof id !== 'string' || typeof index !== 'number') return null;
  const photos = Array.isArray(row.photoIds) ? row.photoIds.length : 0;
  const page = { spreadId: id, index, role, number: role === 'inner' ? number(id) : null, photos };
  const parsed = bookCardPageSchema.safeParse(page);
  return parsed.success ? parsed.data : null;
}

/** The double pages before the page new ones follow: its own number, none before the cover or the first page. */
function innerBefore(anchor: BookCardPage | undefined): number | null {
  if (!anchor) return null;
  if (anchor.role === 'inner') return anchor.number;
  return anchor.role === 'cover' || anchor.role === 'first' ? 0 : null;
}

/**
 * How a page of the answer is numbered among the double pages: as the held
 * card numbered it (a moved page where it went), a page added after the
 * anchor by its place among the new pages the answer lists (they stand
 * together, right after it), and in a new book by its place among the pages
 * the answer lists, which are all.
 */
function numberer(held: BookPageCard, rows: readonly Row[]) {
  const known = held.movedTo === null ? held.pages : held.pages.map((page) => ({ ...page, number: held.movedTo }));
  const before = held.change === 'new' && held.baseVersion !== null ? innerBefore(held.pages[0]) : null;
  const inner = rows
    .filter((row) => row.role === 'inner')
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((row) => row.id);
  return (id: string): number | null => {
    const same = known.find((page) => page.spreadId === id)?.number;
    if (same) return same;
    const place = inner.indexOf(id) + 1;
    if (place === 0) return null;
    if (before !== null) return before + place;
    return held.baseVersion === null ? place : null;
  };
}

/** The findings of a write's answer that a card can name. */
function answeredFindings(value: unknown): BookCardFinding[] {
  const list: unknown[] = Array.isArray(value) ? value : [];
  return list.flatMap((finding) => {
    const parsed = bookCardFindingSchema.safeParse(finding);
    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * The findings of a write's answer as the receipt carries them. The answer
 * lists at most BOOK_OP_LIMITS.findings; a full list may have left some out,
 * so the count past the card is then no lower than the held card's.
 */
function receiptFindings(value: unknown, held: BookPageCard): Pick<BookPageCard, 'findings' | 'moreFindings'> {
  const answered = answeredFindings(value);
  const own = findingsOf(answered);
  if (answered.length < BOOK_OP_LIMITS.findings) return own;
  return { ...own, moreFindings: Math.max(own.moreFindings, held.moreFindings) };
}

/**
 * The receipt's card: the held card with the pages as the change left them
 * (a deleted page as it was), the book's version after it and the findings
 * its answer carries, without the page the trial made: once applied, the
 * Studio draws the page as it is. Null when the held change had no card.
 */
export function bookAppliedCard(result: unknown, preview: AssistantChangePreview | null): BookPageCard | null {
  const held = preview?.card?.kind === 'bookPage' ? preview.card : null;
  if (!held) return null;
  const answer = recordOf(result);
  const rows = Array.isArray(answer.pages) ? answer.pages.map(recordOf) : [];
  const number = numberer(held, rows);
  const answered = rows.flatMap((row) => answeredPage(row, number) ?? []).slice(0, BOOK_OP_LIMITS.pagesPerCall);
  const kept = held.change === 'willDelete' || answered.length === 0;
  const { after: _trialPage, ...facts } = held;
  return {
    ...facts,
    baseVersion: typeof answer.version === 'number' ? answer.version : held.baseVersion,
    pages: kept ? held.pages : answered,
    ...receiptFindings(answer.findings, held),
  };
}
