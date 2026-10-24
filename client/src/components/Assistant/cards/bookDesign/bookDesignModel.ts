import type {
  BookCardPage,
  BookDesignAction,
  BookDesignCard,
  BookDesignDraftResponse,
  BookDesignSkipReason,
  BookDesignStyle,
  BookDocument,
  BookSpread,
} from '@trek/shared';

/**
 * The pure side of the whole-book design card: what a style is called, what
 * the card counts (pages, the ones that change, findings to check, the pages
 * an apply left as they were), and the pairs it draws, each page of the book
 * as it is beside the page of the draft that would take its place.
 */

/** What each style of design is called. A table, so a new style fails to compile until it has words. */
const STYLE_LOOK: Readonly<Record<BookDesignStyle, { labelKey: string }>> = {
  classic: { labelKey: 'assistant.card.bookDesign.style.classic' },
  minimal: { labelKey: 'assistant.card.bookDesign.style.minimal' },
  editorial: { labelKey: 'assistant.card.bookDesign.style.editorial' },
  journal: { labelKey: 'assistant.card.bookDesign.style.journal' },
  bold: { labelKey: 'assistant.card.bookDesign.style.bold' },
  scrapbook: { labelKey: 'assistant.card.bookDesign.style.scrapbook' },
  // A design in one of the themes is called by the theme's own name.
  'poster-pop': { labelKey: 'studio.theme.name.posterPop' },
  cutout: { labelKey: 'studio.theme.name.cutout' },
  postcard: { labelKey: 'studio.theme.name.postcard' },
  riviera: { labelKey: 'studio.theme.name.riviera' },
  'fabric-classic': { labelKey: 'studio.theme.name.fabricClassic' },
  'minimal-serif': { labelKey: 'studio.theme.name.minimalSerif' },
  'grid-badge': { labelKey: 'studio.theme.name.gridBadge' },
  'scrapbook-script': { labelKey: 'studio.theme.name.scrapbookScript' },
  tropical: { labelKey: 'studio.theme.name.tropical' },
  nordic: { labelKey: 'studio.theme.name.nordic' },
  alpine: { labelKey: 'studio.theme.name.alpine' },
  'india-stamp': { labelKey: 'studio.theme.name.indiaStamp' },
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The design's name, after its style. */
export function styleLabel(card: BookDesignCard, t: Translate): string {
  return t(STYLE_LOOK[card.style].labelKey);
}

/** What a design card counts. */
interface DesignCounts {
  /** The plan's pages, those past the card included. */
  pages: number;
  /** The pages the card lists that the design changes, adds or drops. */
  changes: number;
  /** Severe findings and warnings the server's check left on the listed pages. */
  findings: number;
  severe: boolean;
}

/** What the card counts: the plan's pages, the ones the design changes, and the findings worth a look. */
export function designCounts(card: BookDesignCard): DesignCounts {
  let changes = 0;
  let findings = 0;
  let severe = false;
  for (const spread of card.spreads) {
    if (spread.action !== 'keep') changes += 1;
    findings += spread.severe + spread.warn;
    if (spread.severe > 0) severe = true;
  }
  return { pages: card.spreads.length + card.more, changes, findings, severe };
}

/** The pages an applied design left as they were, by why. */
export function skippedCounts(card: BookDesignCard): Record<BookDesignSkipReason, number> {
  const counts: Record<BookDesignSkipReason, number> = { excluded: 0, changed_since: 0, photo_gone: 0 };
  for (const skipped of card.skipped) counts[skipped.reason] += 1;
  return counts;
}

/** One page of the plan as the card draws it: the book's page as it is, and the draft's in its place. */
export interface DesignPair {
  spreadId: string;
  action: BookDesignAction;
  /** Where the page stands, named as the Studio names it: from the draft, else the book. */
  page: BookCardPage | null;
  before: BookSpread | null;
  after: BookSpread | null;
  findings: number;
  severe: boolean;
}

/** One row of a plan, from the card or from the draft: the page, what happens to it, its findings. */
interface PlanRow {
  spreadId: string;
  action: BookDesignAction;
  severe: number;
  warn: number;
}

/** A spread found in a document, with where it stands. */
interface Found {
  spread: BookSpread | null;
  page: BookCardPage | null;
}

const NOT_FOUND: Found = { spread: null, page: null };

/** The number of the double page at `index`: how many double pages run up to it. */
function innerNumber(spreads: readonly BookSpread[], index: number): number {
  return spreads.slice(0, index + 1).filter((spread) => spread.role === 'inner').length;
}

/** A spread of a document by its id, with where it stands as the Studio names it; nothing when it holds none. */
function spreadIn(doc: BookDocument | null, spreadId: string): Found {
  const spreads = doc?.spreads ?? [];
  const index = spreads.findIndex((spread) => spread.id === spreadId);
  const spread = spreads[index];
  if (!spread) return NOT_FOUND;
  const number = spread.role === 'inner' ? innerNumber(spreads, index) : null;
  return { spread, page: { spreadId, index, role: spread.role, number, photos: 0 } };
}

function pairOf(row: PlanRow, draft: BookDocument | null, book: BookDocument | null): DesignPair {
  const designed = row.action === 'drop' ? NOT_FOUND : spreadIn(draft, row.spreadId);
  const stored = row.action === 'insert' ? NOT_FOUND : spreadIn(book, row.spreadId);
  return {
    spreadId: row.spreadId,
    action: row.action,
    page: designed.page ?? stored.page,
    before: stored.spread,
    after: designed.spread,
    findings: row.severe + row.warn,
    severe: row.severe > 0,
  };
}

/** A row of the draft's plan as the pairs read it. */
function planRowOf(row: BookDesignDraftResponse['plan'][number]): PlanRow {
  return { spreadId: row.spreadId, action: row.action, severe: row.findings.severe, warn: row.findings.warn };
}

/**
 * The pages a waiting design changes, each beside the page it replaces: the
 * draft's plan (the whole plan, not only the rows the card holds) with the
 * draft's page after and the book's page before. A page the design keeps as
 * it is is left out; a new page has nothing before it, a dropped one nothing
 * after it.
 */
export function draftPairs(draft: BookDesignDraftResponse, book: BookDocument | null): DesignPair[] {
  return draft.plan.filter((row) => row.action !== 'keep').map((row) => pairOf(planRowOf(row), draft.document, book));
}

/**
 * The rows of the pages an applied design wrote, in the card's order: every
 * page it replaced or added and did not leave as it was. The receipt draws
 * them and opens the Studio on the first (bookLook.ts), so both read this.
 */
export function writtenRows(card: BookDesignCard): BookDesignCard['spreads'] {
  const skipped = new Set(card.skipped.map((page) => page.spreadId));
  return card.spreads.filter(
    (row) => (row.action === 'replace' || row.action === 'insert') && !skipped.has(row.spreadId)
  );
}

/**
 * The pages an applied design wrote, as the book holds them now. A dropped
 * page is gone, and the draft is gone with the apply, so nothing is drawn
 * before.
 */
export function appliedPairs(card: BookDesignCard, book: BookDocument | null): DesignPair[] {
  return writtenRows(card).flatMap((row) => {
    const now = spreadIn(book, row.spreadId);
    return now.spread ? [{ ...pairOf(row, null, null), page: now.page, after: now.spread }] : [];
  });
}

/** The selection with a page put in or taken out, in the plan's order. */
export function toggledSelection(selection: readonly string[], spreadId: string, order: readonly string[]): string[] {
  const chosen = new Set(selection);
  if (chosen.has(spreadId)) chosen.delete(spreadId);
  else chosen.add(spreadId);
  return order.filter((id) => chosen.has(id));
}
