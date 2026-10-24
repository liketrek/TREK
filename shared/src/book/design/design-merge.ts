import type { BookFinding } from '../book-ops.schema';
import type { BookSpread } from '../book.schema';
import type { BookDesignDirectives } from './design-directives.schema';
import type { BookDesignBeat } from './design-pacing';

/**
 * A designed book laid over the stored one: which stored pages stay as they
 * are, which designed pages take a stored page's place (and its id, so the
 * Studio keeps its page), which are new, and which stored pages go. The plan
 * says it page by page, for the proposal card and the apply.
 */

export const BOOK_DESIGN_ACTIONS = ['keep', 'replace', 'insert', 'drop'] as const;
export type BookDesignAction = (typeof BOOK_DESIGN_ACTIONS)[number];

export interface BookDesignPlanRow {
  spreadId: string;
  /** Where the page sits in the designed book; a dropped page keeps its stored index. */
  index: number;
  action: BookDesignAction;
  beat: BookDesignBeat;
  chapter: string | null;
  entryId: number | null;
  photoIds: number[];
  findings: { severe: number; warn: number };
}

export interface DesignedSpread {
  spread: BookSpread;
  beat: BookDesignBeat;
  chapter: string | null;
  findings: BookFinding[];
}

const photoIdsOf = (spread: BookSpread) =>
  spread.elements.flatMap((e) => (e.kind === 'photo' && e.photoId != null ? [e.photoId] : []));

const hasLock = (spread: BookSpread) => spread.elements.some((e) => e.locked);

/**
 * Whether a stored page stays as it is: one holding a locked element (an
 * inner page only while the person keeps locked pages); with `edited` also a
 * page made by hand (no entry behind it, not blank).
 */
export function keepsStored(spread: BookSpread, keep: BookDesignDirectives['keep']): boolean {
  if (spread.role !== 'inner') return hasLock(spread);
  if (keep === 'nothing') return false;
  if (hasLock(spread)) return true;
  return keep === 'edited' && spread.entryId == null && spread.elements.length > 0;
}

interface Placed {
  spread: BookSpread;
  action: BookDesignAction;
  beat: BookDesignBeat;
  chapter: string | null;
  findings: BookFinding[];
}

const placedOf = (d: DesignedSpread, action: BookDesignAction, id?: string): Placed => ({
  spread: id ? { ...d.spread, id } : d.spread,
  action,
  beat: d.beat,
  chapter: d.chapter,
  findings: d.findings,
});

const keptOf = (spread: BookSpread, beat: BookDesignBeat): Placed => ({
  spread,
  action: 'keep',
  beat,
  chapter: null,
  findings: [],
});

/** The framing page of a role: the stored one when it holds a lock, else the designed one in its place. */
function framing(stored: readonly BookSpread[], designed: DesignedSpread, keep: BookDesignDirectives['keep']): Placed {
  const own = stored.find((s) => s.role === designed.spread.role);
  if (own && keepsStored(own, keep)) return keptOf(own, designed.beat);
  return own ? placedOf(designed, 'replace', own.id) : placedOf(designed, 'insert');
}

/** The inner pages: designed ones taking the place of the stored pages of their entry, kept ones where they were. */
function innerPages(
  stored: readonly BookSpread[],
  designed: readonly DesignedSpread[],
  keep: BookDesignDirectives['keep'],
): { pages: Placed[]; dropped: BookSpread[] } {
  const inner = stored.filter((s) => s.role === 'inner');
  const kept = new Set(inner.filter((s) => keepsStored(s, keep)).map((s) => s.id));
  const taken = new Map<string, number>();
  const free = (s: BookSpread) => !kept.has(s.id) && !taken.has(s.id);
  const pages = designed.map((d, i): Placed => {
    const match = inner.find((s) => free(s) && s.entryId != null && s.entryId === d.spread.entryId);
    if (!match) return placedOf(d, 'insert');
    taken.set(match.id, i);
    return placedOf(d, 'replace', match.id);
  });
  let lastTaken = -1;
  const after = new Map<number, BookSpread[]>();
  for (const s of inner) {
    const at = taken.get(s.id);
    if (at !== undefined) lastTaken = at;
    if (kept.has(s.id)) after.set(lastTaken, [...(after.get(lastTaken) ?? []), s]);
  }
  const ordered = [...(after.get(-1) ?? []).map((s) => keptOf(s, 'opener'))];
  pages.forEach((p, i) => ordered.push(p, ...(after.get(i) ?? []).map((s) => keptOf(s, 'opener'))));
  const dropped = inner.filter((s) => !kept.has(s.id) && !taken.has(s.id));
  return { pages: ordered, dropped };
}

const count = (findings: readonly BookFinding[], severity: BookFinding['severity']) =>
  findings.filter((f) => f.severity === severity).length;

/** The designed book over the stored one (or as a new book), and its plan. */
export function mergeDesign(
  doc: { spreads: readonly BookSpread[] } | null,
  designed: readonly DesignedSpread[],
  keep: BookDesignDirectives['keep'],
): { spreads: BookSpread[]; plan: BookDesignPlanRow[] } {
  const stored = doc?.spreads ?? [];
  const role = (r: BookSpread['role']) => designed.filter((d) => d.spread.role === r);
  const head = [...role('cover'), ...role('first')].map((d) => framing(stored, d, keep));
  const tail = [...role('last'), ...role('back')].map((d) => framing(stored, d, keep));
  const { pages, dropped } = innerPages(stored, role('inner'), keep);
  const all = [...head, ...pages, ...tail];
  const plan = all.map((p, index): BookDesignPlanRow => ({
    spreadId: p.spread.id,
    index,
    action: doc ? p.action : 'insert',
    beat: p.beat,
    chapter: p.chapter,
    entryId: p.spread.entryId,
    photoIds: photoIdsOf(p.spread),
    findings: { severe: count(p.findings, 'severe'), warn: count(p.findings, 'warn') },
  }));
  for (const s of dropped) {
    plan.push({
      spreadId: s.id,
      index: stored.indexOf(s),
      action: 'drop',
      beat: 'opener',
      chapter: null,
      entryId: s.entryId,
      photoIds: photoIdsOf(s),
      findings: { severe: 0, warn: 0 },
    });
  }
  return { spreads: all.map((p) => p.spread), plan };
}
