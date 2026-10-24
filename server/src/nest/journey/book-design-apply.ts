import {
  bookSpreadPhotoIds,
  compareCodeUnits,
  MAX_SPREADS,
  type BookDesignPlanRow,
  type BookDesignSkipped,
  type BookDocument,
  type BookSpread,
} from '@trek/shared';

/**
 * A design draft laid over the book as it is now (journey-studio-wp13.md
 * 6.1, "Apply"): the chosen pages of the plan, each only if the page it
 * replaces is still exactly what the design found, new pages after the
 * nearest page of the plan that is there, dropped pages only when chosen and
 * untouched, and no page whose photos left the gallery since. The draft's
 * format and title come along only where nobody set others since; a page size
 * moved since, or a book made since a design for a journey without one, takes
 * nothing. Pure: the service runs it inside the transaction that writes the
 * result.
 */

/** What of a draft the apply reads. */
export interface DraftToApply {
  base: BookDocument | null;
  doc: BookDocument;
  plan: readonly BookDesignPlanRow[];
  selection: readonly string[];
}

interface AppliedDesign {
  doc: BookDocument;
  applied: string[];
  skipped: BookDesignSkipped[];
}

/**
 * JSON with the keys of every object sorted, so two equal pages read alike
 * whatever order their keys came in. The one compare of pages: the apply
 * here, and the digest a page restore checks (journey-book-edit.service.ts).
 * Keys sort by code unit, so the text is the same on every machine.
 */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => compareCodeUnits(a, b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const samePage = (a: BookSpread | undefined, b: BookSpread | undefined) =>
  a !== undefined && b !== undefined && canonical(a) === canonical(b);

/** Where a new page goes in `spreads`: after the nearest plan page before it that is there, inside the covers. */
function insertAt(spreads: readonly BookSpread[], plan: readonly BookDesignPlanRow[], row: number, page: BookSpread) {
  /** Where the first page of one of these roles stands; the end of the book when there is none. */
  const at = (...roles: BookSpread['role'][]) => {
    const found = spreads.findIndex((s) => roles.includes(s.role));
    return found >= 0 ? found : spreads.length;
  };
  if (page.role === 'cover') return 0;
  if (page.role === 'back') return spreads.length;
  if (page.role === 'last') return at('back');
  const lastAt = at('last', 'back');
  for (let i = row - 1; i >= 0; i--) {
    const before = plan[i];
    if (!before || before.action === 'drop') continue;
    const found = spreads.findIndex((s) => s.id === before.spreadId);
    if (found >= 0) return Math.min(found + 1, lastAt);
  }
  const first = spreads.findIndex((s) => s.role === 'first');
  const cover = spreads.findIndex((s) => s.role === 'cover');
  return Math.min((first >= 0 ? first : cover) + 1, lastAt);
}

/**
 * A framing page of a new book without the photos that left the gallery: the
 * book needs its cover and its back, so their frames are emptied (a map's
 * stops lose their picture, and letters filled with one keep their colour)
 * rather than the page left out.
 */
function withoutGonePhotos(spread: BookSpread, gallery: ReadonlySet<number>): BookSpread {
  const gone = (id: number | null) => id !== null && !gallery.has(id);
  if (!bookSpreadPhotoIds(spread).some(gone)) return spread;
  const clean = (el: BookSpread['elements'][number]): BookSpread['elements'][number] => {
    if (el.kind === 'photo') return gone(el.photoId) ? { ...el, photoId: null } : el;
    if (el.kind === 'map') {
      return { ...el, points: el.points.map((p) => (gone(p.photoId) ? { ...p, photoId: null } : p)) };
    }
    if (el.kind === 'text' && el.fillPaint?.type === 'photo' && gone(el.fillPaint.photoId)) {
      return { ...el, fillPaint: null };
    }
    return el;
  };
  return { ...spread, elements: spread.elements.map(clean), parked: spread.parked.map(clean) };
}

/** The draft over a journey that had no book when it was designed and has none now: a new book of the chosen pages. */
function newBook(draft: DraftToApply, gallery: ReadonlySet<number>): AppliedDesign {
  const applied: string[] = [];
  const skipped: BookDesignSkipped[] = [];
  const chosen = new Set(draft.selection);
  const spreads = draft.doc.spreads.flatMap((spread) => {
    if (spread.role !== 'inner') {
      applied.push(spread.id);
      return [withoutGonePhotos(spread, gallery)];
    }
    if (!chosen.has(spread.id)) {
      skipped.push({ spreadId: spread.id, reason: 'excluded' });
      return [];
    }
    if (!bookSpreadPhotoIds(spread).every((id) => gallery.has(id))) {
      skipped.push({ spreadId: spread.id, reason: 'photo_gone' });
      return [];
    }
    applied.push(spread.id);
    return [spread];
  });
  return { doc: { ...draft.doc, spreads }, applied, skipped };
}

/**
 * The format and title the applied book takes: the draft's while the book's
 * are still what the design found, else the ones someone set since. Null when
 * the page size moved since, or a book was made since a design for a journey
 * without one: the designed pages were laid out for another size or another
 * book, and none of them fits the book there is now.
 */
function bookFrame(current: BookDocument, draft: DraftToApply): Pick<BookDocument, 'title' | 'page'> | null {
  const base = draft.base;
  if (!base) return null;
  const title = current.title === base.title ? draft.doc.title : current.title;
  if (canonical(current.page) === canonical(base.page)) return { title, page: draft.doc.page };
  const sized = (p: BookDocument['page']) => `${p.pageWidth}x${p.pageHeight}`;
  return sized(current.page) === sized(draft.doc.page) ? { title, page: current.page } : null;
}

/** The chosen pages of the draft over the book as it is now. */
export function applyDesignDraft(
  current: BookDocument | null,
  draft: DraftToApply,
  gallery: ReadonlySet<number>,
): AppliedDesign {
  if (!current && !draft.base) return newBook(draft, gallery);
  const applied: string[] = [];
  const skipped: BookDesignSkipped[] = [];
  const skip = (spreadId: string, reason: BookDesignSkipped['reason']) => skipped.push({ spreadId, reason });
  const frame = current ? bookFrame(current, draft) : null;
  // A missing base already leaves no frame; naming it here lets the reads below take the base as it is.
  if (!current || !draft.base || !frame) {
    for (const row of draft.plan) if (row.action !== 'keep') skip(row.spreadId, 'changed_since');
    return { doc: current ?? draft.doc, applied, skipped };
  }
  const chosen = new Set(draft.selection);
  const designed = new Map(draft.doc.spreads.map((s) => [s.id, s]));
  const base = new Map(draft.base.spreads.map((s) => [s.id, s]));
  const spreads = [...current.spreads];
  draft.plan.forEach((row, i) => {
    if (row.action === 'keep') return;
    if (!chosen.has(row.spreadId)) return skip(row.spreadId, 'excluded');
    const at = spreads.findIndex((s) => s.id === row.spreadId);
    if (row.action === 'drop') {
      if (at < 0) return;
      if (!samePage(spreads[at], base.get(row.spreadId))) return skip(row.spreadId, 'changed_since');
      spreads.splice(at, 1);
      applied.push(row.spreadId);
      return;
    }
    const page = designed.get(row.spreadId);
    if (!page) return;
    if (!bookSpreadPhotoIds(page).every((id) => gallery.has(id))) return skip(row.spreadId, 'photo_gone');
    if (row.action === 'replace') {
      if (at < 0 || !samePage(spreads[at], base.get(row.spreadId))) return skip(row.spreadId, 'changed_since');
      spreads[at] = page;
    } else {
      if (at >= 0 || spreads.length >= MAX_SPREADS) return skip(row.spreadId, 'changed_since');
      spreads.splice(insertAt(spreads, draft.plan, i, page), 0, page);
    }
    applied.push(row.spreadId);
  });
  return { doc: { ...current, ...frame, spreads }, applied, skipped };
}
