import type { ToolArgs } from '../card-types';
import { recordOf } from '../card-values';
import {
  addBookPages,
  addBookPagesArgs,
  applyBookOps,
  blankBook,
  createBookArgs,
  createBookRequestSchema,
  deleteBookPages,
  deleteBookPagesArgs,
  editBookPageArgs,
  moveBookPage,
  moveBookPageArgs,
  setBookCover,
  setBookCoverArgs,
  spreadFindings,
  summarizeSpread,
  type BookCardPage,
  type BookDocument,
  type BookEditResult,
  type BookFinding,
  type BookOpsContext,
  type BookSpread,
} from '@trek/shared';

/**
 * A held book write tried on the stored book before the user sees its card:
 * the same engine call the tool makes, on the same document, gallery and
 * entries, without writing anything. What it gives is what the change card
 * draws (the pages before and after, the photos it brings, the findings of
 * the pages it leaves) and what the turn's gate refuses with: the engine's own
 * refusal, or faults the change would bring onto a page.
 */

/** The book a change is tried on: its journey, the stored document (null without a book), its version, the context. */
export interface BookTrialInput {
  journeyId: number;
  doc: BookDocument | null;
  version: number | null;
  ctx: BookOpsContext;
}

/** A change that would run, and what it would leave. */
export interface BookTrialRan {
  ok: true;
  journeyId: number;
  /** The version it was tried on; null for a journey without a book. */
  version: number | null;
  /** The pages it works on, as they stand before it. */
  before: BookCardPage[];
  /** The pages it leaves, as they would stand. */
  after: BookCardPage[];
  /**
   * The same pages as the engine made them, with the journey's photos, words
   * and figures: what the change card draws after an edit or the cover, as
   * the tool would write it.
   */
  spreads: BookSpread[];
  /** The findings on the pages it leaves, the most severe first. */
  findings: BookFinding[];
  /**
   * Severe findings the change brings onto a page that it did not have before:
   * a fault naming an element no finding of its kind named before. An empty
   * frame on a page the change makes is not one: a new page's template brings
   * its frames empty, and placing photos is a later edit's work.
   */
  fresh: BookFinding[];
  /** Photos it brings onto its pages that were not on them. */
  photosAdded: number;
  /** The name of a saved layout it lays a page out on, as the book keeps it. */
  layoutName: string | null;
  /** What the change is about in the book's own words: the first text of its page, a new book's title. */
  subject: string;
}

/** A change the engine refuses, in the words a tool would answer. */
interface BookTrialRefused {
  ok: false;
  refusal: string;
}

export type BookTrial = BookTrialRan | BookTrialRefused;

/**
 * The read a book change's card makes for its trial. No tool has this name:
 * the turn's gate answers it beside the session's own reads, so the card and
 * the gate share one trial per call.
 */
export const BOOK_TRIAL_READ = 'trek_book_trial';

const NO_BOOK = 'This journey has no book yet: create_book makes one.';
const HAS_BOOK = 'This journey has a book already: read it with get_book and change it instead.';

/** A book write the trial knows: the arguments its tool takes, and the engine call it makes on a stored book. */
interface TrialTool {
  keys: readonly string[];
  run(doc: BookDocument, args: ToolArgs, ctx: BookOpsContext): BookEditResult;
}

const TRIAL_TOOLS: Readonly<Record<string, TrialTool>> = {
  add_book_pages: { keys: Object.keys(addBookPagesArgs), run: (doc, args, ctx) => addBookPages(doc, args, ctx) },
  move_book_page: { keys: Object.keys(moveBookPageArgs), run: (doc, args) => moveBookPage(doc, args) },
  delete_book_pages: { keys: Object.keys(deleteBookPagesArgs), run: (doc, args) => deleteBookPages(doc, args) },
  edit_book_page: {
    keys: Object.keys(editBookPageArgs),
    run: (doc, args, ctx) => {
      const ops = Array.isArray(args.ops) ? args.ops : [];
      return applyBookOps(doc, { spreadId: typeof args.spreadId === 'string' ? args.spreadId : '', ops }, ctx);
    },
  },
  set_book_cover: { keys: Object.keys(setBookCoverArgs), run: (doc, args, ctx) => setBookCover(doc, args, ctx) },
};

/** The book writes a held call is tried for; `create_book` is tried apart, since it runs without a book. */
export const BOOK_TRIAL_TOOLS: readonly string[] = ['create_book', ...Object.keys(TRIAL_TOOLS)];

/** The model's arguments as the tool takes them: the MCP layer drops a key the tool does not name, and so does this. */
function known(args: ToolArgs, keys: readonly string[]): ToolArgs {
  return Object.fromEntries(Object.entries(args).filter(([key]) => keys.includes(key)));
}

/** The engine's refusal in the tool's words: which operation, from 0, and what to do. */
function refusalOf(made: Extract<BookEditResult, { ok: false }>): BookTrialRefused {
  const { opIndex, message } = made.error;
  return { ok: false, refusal: opIndex === null ? message : `ops[${opIndex}]: ${message}` };
}

/** Where a page stands among the double pages, from 1; null for a single page. */
function numberOf(spreads: readonly BookSpread[], index: number): number | null {
  if (spreads[index]?.role !== 'inner') return null;
  return spreads.slice(0, index + 1).filter((spread) => spread.role === 'inner').length;
}

/** The pages of `doc` with these ids, in book order, as a card names them. */
function pagesOf(doc: BookDocument | null, ids: readonly string[]): BookCardPage[] {
  if (!doc) return [];
  return doc.spreads.flatMap((spread, index) => {
    if (!ids.includes(spread.id)) return [];
    const summary = summarizeSpread(spread, index);
    const number = numberOf(doc.spreads, index);
    return [{ spreadId: spread.id, index, role: spread.role, number, photos: summary.photoIds.length }];
  });
}

/** The pages a change works on before it runs: the page it names, the cover, the page new ones follow. */
function targetIds(tool: string, args: ToolArgs, doc: BookDocument): string[] {
  if (tool === 'set_book_cover') return doc.spreads.filter((spread) => spread.role === 'cover').map((s) => s.id);
  if (tool === 'delete_book_pages') {
    return Array.isArray(args.spreadIds) ? args.spreadIds.filter((id): id is string => typeof id === 'string') : [];
  }
  const id = tool === 'add_book_pages' ? args.afterSpreadId : args.spreadId;
  return typeof id === 'string' ? [id] : [];
}

const SEVERITY = { severe: 0, warn: 1, info: 2 } as const;

/** The elements a finding names at most (book-findings.ts); a list this long may have left some out. */
const LISTED_ELEMENTS = 8;

/** The elements each kind of finding named on a page, and the kinds whose list may have left some out. */
function namedBy(findings: readonly BookFinding[]): { named: Map<string, Set<string>>; full: Set<string> } {
  const named = new Map<string, Set<string>>();
  const full = new Set<string>();
  for (const finding of findings) {
    const ids = named.get(finding.code) ?? new Set<string>();
    for (const id of finding.elementIds) ids.add(id);
    named.set(finding.code, ids);
    if (finding.elementIds.length >= LISTED_ELEMENTS) full.add(finding.code);
  }
  return { named, full };
}

/**
 * The severe findings of a page after a change that it did not have before,
 * element by element: filling one of three empty frames leaves a finding on
 * the other two, which is not new. A finding naming no element is new only
 * where its kind was not found before.
 */
function freshOn(was: readonly BookFinding[], now: readonly BookFinding[], created: boolean): BookFinding[] {
  const { named, full } = namedBy(was);
  return now.filter((finding) => {
    if (finding.severity !== 'severe' || (created && finding.code === 'empty_frame')) return false;
    const before = named.get(finding.code);
    if (!before) return true;
    return !full.has(finding.code) && finding.elementIds.some((id) => !before.has(id));
  });
}

/** Every finding on these pages of `doc`, by page. */
function findingsOn(doc: BookDocument, ids: readonly string[], ctx: BookOpsContext): Map<string, BookFinding[]> {
  const found = new Map<string, BookFinding[]>();
  for (const spread of doc.spreads) {
    if (ids.includes(spread.id)) found.set(spread.id, spreadFindings(spread, doc.page, ctx.photos));
  }
  return found;
}

/** The photo ids on a page of `doc`, none for a page it does not hold. */
function photosOn(doc: BookDocument | null, spreadId: string): Set<number> {
  const index = doc?.spreads.findIndex((spread) => spread.id === spreadId) ?? -1;
  const spread = doc?.spreads[index];
  return new Set(spread ? summarizeSpread(spread, index).photoIds : []);
}

/** The first words on the first of these pages of `doc`, for the change card's subject; empty when it has none. */
function firstText(doc: BookDocument | null, ids: readonly string[]): string {
  const index = doc?.spreads.findIndex((spread) => ids.includes(spread.id)) ?? -1;
  const spread = doc?.spreads[index];
  return spread ? (summarizeSpread(spread, index).texts[0] ?? '') : '';
}

/** The name of the saved layout an edit's last layout operation applies, as the book keeps it. */
function savedLayoutName(doc: BookDocument, args: ToolArgs): string | null {
  const ops = Array.isArray(args.ops) ? args.ops.map(recordOf) : [];
  const saved = ops.filter((op) => op.op === 'layout' && typeof op.saved === 'string').pop()?.saved;
  return doc.layouts?.find((layout) => layout.id === saved)?.name ?? null;
}

/** What a change that ran leaves: the pages before and after, their findings, the photos it brings. */
function ranOf(
  before: BookDocument | null,
  made: Extract<BookEditResult, { ok: true }>,
  input: BookTrialInput,
  targets: readonly string[],
  layoutName: string | null,
): BookTrialRan {
  const ids = made.spreadIds;
  const was = before ? findingsOn(before, ids, input.ctx) : new Map<string, BookFinding[]>();
  const now = findingsOn(made.doc, ids, input.ctx);
  const created = new Set(made.created);
  const findings = [...now.values()].flat().sort((a, b) => SEVERITY[a.severity] - SEVERITY[b.severity]);
  const fresh = [...now].flatMap(([spreadId, list]) => freshOn(was.get(spreadId) ?? [], list, created.has(spreadId)));
  const photosAdded = ids.reduce((sum, spreadId) => {
    const prior = photosOn(before, spreadId);
    return sum + [...photosOn(made.doc, spreadId)].filter((photoId) => !prior.has(photoId)).length;
  }, 0);
  return {
    ok: true,
    journeyId: input.journeyId,
    version: input.version,
    before: pagesOf(before, targets),
    after: pagesOf(made.doc, ids),
    spreads: made.doc.spreads.filter((spread) => ids.includes(spread.id)),
    findings,
    fresh,
    photosAdded,
    layoutName,
    subject: before ? firstText(before, targets) : made.doc.title,
  };
}

/** A blank book as `create_book` would lay it down, or the refusal for a journey that has one. */
function trialCreate(args: ToolArgs, input: BookTrialInput): BookTrial {
  if (input.doc) return { ok: false, refusal: HAS_BOOK };
  const parsed = createBookRequestSchema.safeParse(known(args, Object.keys(createBookArgs)));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const what = issue ? `${issue.path.join('.')} ${issue.message}`.trim() : parsed.error.message;
    return { ok: false, refusal: `Invalid arguments: ${what}` };
  }
  const { title, preset } = parsed.data;
  const book = blankBook({ title: title?.trim() || input.ctx.journey?.title || '', preset });
  const ids = book.spreads.map((spread) => spread.id);
  return ranOf(null, { ok: true, doc: book, spreadIds: ids, created: ids, dropped: [] }, input, [], null);
}

/**
 * Tries one held book write on `input`; null for a tool the trial does not
 * know. Arguments the engine refuses give its refusal, exactly as the tool
 * would answer it once applied.
 */
export function tryBookChange(tool: string, args: ToolArgs, input: BookTrialInput): BookTrial | null {
  if (tool === 'create_book') return trialCreate(args, input);
  const entry = TRIAL_TOOLS[tool];
  if (!entry) return null;
  const doc = input.doc;
  if (!doc) return { ok: false, refusal: NO_BOOK };
  const given = known(args, entry.keys);
  const made = entry.run(doc, given, input.ctx);
  if (made.ok === false) return refusalOf(made);
  const layoutName = tool === 'edit_book_page' ? savedLayoutName(doc, given) : null;
  return ranOf(doc, made, input, targetIds(tool, given, doc), layoutName);
}

/** A trial as the card's lookup gets it back from the reader; null for anything else. */
export function trialFrom(value: unknown): BookTrial | null {
  const record = recordOf(value);
  const ran = record.ok === true && Array.isArray(record.after) && Array.isArray(record.spreads);
  if (ran && Array.isArray(record.findings)) return value as BookTrialRan;
  if (record.ok === false && typeof record.refusal === 'string') return value as BookTrialRefused;
  return null;
}
