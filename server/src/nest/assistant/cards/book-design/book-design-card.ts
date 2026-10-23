import type { AnswerInput, CardReader, Described, ToolArgs } from '../card-types';
import { clipped, recordOf } from '../card-values';
import { Rows, text } from '../preview-format';
import {
  BOOK_DESIGN_CARD_LIMITS,
  bookDesignAnswerSchema,
  bookDesignSkippedSchema,
  MAX_CARD_CHARS,
  type AssistantChangePreview,
  type BookDesignAnswer,
  type BookDesignCard,
  type BookDesignCardSpread,
  type BookDesignSkipped,
} from '@trek/shared';

/**
 * The card of a whole-book design (journey-studio-wp13.md 6.2): built from
 * the draft as `design_book` or `get_book_design` answers it, so the answer,
 * the held `apply_book_design` and its receipt show the same plan. The
 * client draws the pages from the draft route; the card only names them.
 */

/** What describing a held apply looked up: the draft in words, null when it is gone. */
export interface BookDesignLoaded {
  draft: BookDesignAnswer | null;
}

/** The read the held apply describes itself from. */
const DRAFT_READ = 'get_book_design';

/** Room the card keeps under MAX_CARD_CHARS for the fields around its pages. */
const HEADROOM = 1_500;

/** The draft of `designId` through the turn's reader; null when it is gone or the read failed. */
export async function loadDesign(args: ToolArgs, read: CardReader): Promise<BookDesignLoaded> {
  const designId = typeof args.designId === 'string' ? args.designId : null;
  if (!designId) return { draft: null };
  const parsed = bookDesignAnswerSchema.safeParse(await read(DRAFT_READ, { designId }));
  return { draft: parsed.success ? parsed.data : null };
}

function spreadOf(row: BookDesignAnswer['plan'][number]): BookDesignCardSpread {
  return {
    spreadId: row.spreadId,
    index: row.index,
    action: row.action,
    beat: row.beat,
    chapter: clipped(row.chapter, BOOK_DESIGN_CARD_LIMITS.chapter),
    entryId: row.entryId,
    photoCount: row.photoIds.length,
    severe: row.findings.severe,
    warn: row.findings.warn,
  };
}

/**
 * The card of a draft, its pages cut to what a card holds: at most
 * BOOK_DESIGN_CARD_LIMITS.spreads, fewer when their JSON would pass
 * MAX_CARD_CHARS, the rest counted in `more`.
 */
export function designCard(draft: BookDesignAnswer, change: BookDesignCard['change']): BookDesignCard {
  const all = draft.plan.map(spreadOf);
  const total = all.length + draft.more_rows;
  let spreads = all.slice(0, BOOK_DESIGN_CARD_LIMITS.spreads);
  const card = (list: BookDesignCardSpread[]): BookDesignCard => ({
    kind: 'bookDesign',
    change,
    journeyId: draft.journey_id,
    designId: draft.design_id,
    baseVersion: draft.base_version,
    style: draft.style.style,
    paper: draft.style.paper,
    ink: draft.style.ink,
    accent: draft.style.accent,
    heading: draft.style.heading,
    body: draft.style.body,
    spreads: list,
    more: total - list.length,
    leftOut: draft.photos.left_out.length + draft.photos.left_out_more,
    revisionId: null,
    skipped: [],
  });
  while (spreads.length > 0 && JSON.stringify(card(spreads)).length > MAX_CARD_CHARS - HEADROOM) {
    spreads = spreads.slice(0, Math.floor(spreads.length * 0.9));
  }
  return card(spreads);
}

/** The card beside `design_book`'s and `get_book_design`'s answer: the draft, nothing proposed yet. */
export function designAnswerCard(input: AnswerInput): BookDesignCard | null {
  const parsed = bookDesignAnswerSchema.safeParse(input.value);
  return parsed.success ? designCard(parsed.data, 'none') : null;
}

/** The card under the held apply: the draft it would write. Null when the draft is gone. */
export function designChangeCard(loaded: BookDesignLoaded | null): BookDesignCard | null {
  return loaded?.draft ? designCard(loaded.draft, 'proposed') : null;
}

/** The held apply in words: how many pages it changes, and in which style. */
export function describeDesign(loaded: BookDesignLoaded | null): Described {
  const draft = loaded?.draft ?? null;
  const rows = new Rows();
  if (draft) {
    rows.add('type', text(draft.style.style));
    rows.add('quantity', text(draft.selected.length));
  }
  return { subject: '', rows, dayId: null, placeIds: [] };
}

/** The pages an apply left as they were, as the receipt names them. */
function skippedOf(value: unknown): BookDesignSkipped[] {
  const list: unknown[] = Array.isArray(value) ? value : [];
  return list
    .flatMap((item) => {
      const parsed = bookDesignSkippedSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, BOOK_DESIGN_CARD_LIMITS.spreads);
}

/**
 * The receipt: the held card applied, with the book's version after it, the
 * revision its undo restores and the pages it left. Null when the held
 * change had no card.
 */
export function designAppliedCard(result: unknown, preview: AssistantChangePreview | null): BookDesignCard | null {
  const held = preview?.card?.kind === 'bookDesign' ? preview.card : null;
  if (!held) return null;
  const answer = recordOf(result);
  const revision = answer.revision_id;
  return {
    ...held,
    change: 'applied',
    baseVersion: typeof answer.version === 'number' ? answer.version : held.baseVersion,
    revisionId: typeof revision === 'number' && Number.isInteger(revision) && revision > 0 ? revision : null,
    skipped: skippedOf(answer.skipped),
  };
}
