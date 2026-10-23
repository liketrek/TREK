import {
  MAX_BOOK_LAYOUTS,
  MAX_SPREAD_ELEMENTS,
  bookDocumentSchema,
  bookElementSchema,
  bookLayoutSchema,
  type BookDocument,
} from './book.schema';

/**
 * Read a stored document without ever throwing.
 *
 * Same shape as `normalizeAppearance`: a book that cannot be parsed must still
 * open — an editor that refuses to load someone's work because one field drifted
 * is worse than one that drops the field.
 *
 * ── Why there are two attempts ───────────────────────────────────────────
 *
 * Dropping *the field* was the intent; dropping the whole book was what the
 * code did. `elements` is an array of a discriminated union, so one element the
 * contract cannot read fails its spread, fails the array, fails the document —
 * and this function then handed back an empty book. It is not hypothetical: a
 * mood mark carried the journal's key in a field capped at two characters, so
 * every book with one on a page refused to save, and would have opened blank.
 * Both the client's load seam and the server's read *and* write path run
 * through here, which means the empty book was also what got written down.
 *
 * So a document that fails whole is tried again with the unreadable elements
 * removed, and only a document that fails even then is given up on. Losing one
 * decoration to a version skew is a shrug; losing the book is not.
 */
export function normalizeBookDocument(raw: unknown): BookDocument {
  const parsed = bookDocumentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const salvaged = bookDocumentSchema.safeParse(withoutUnreadableElements(raw));
  if (salvaged.success) return salvaged.data;

  return bookDocumentSchema.parse({});
}

function withoutUnreadableElements(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const doc = raw as { spreads?: unknown };
  if (!Array.isArray(doc.spreads)) return raw;

  const readable = (list: unknown) =>
    Array.isArray(list)
      ? // Trimmed to the cap as well as filtered: a spread that grew past 60
        // fails the array the same way an unreadable element fails the union, and
        // losing the sixty-first decoration beats losing the book.
        list.filter((el) => bookElementSchema.safeParse(el).success).slice(0, MAX_SPREAD_ELEMENTS)
      : list;

  const layouts = (doc as { layouts?: unknown }).layouts;
  return {
    ...doc,
    // A saved layout is a convenience: one that no longer reads is dropped, not the book.
    ...(Array.isArray(layouts)
      ? { layouts: layouts.filter((l) => bookLayoutSchema.safeParse(l).success).slice(0, MAX_BOOK_LAYOUTS) }
      : {}),
    spreads: doc.spreads.map((sp) => {
      if (!sp || typeof sp !== 'object') return sp;
      const spread = sp as { elements?: unknown; parked?: unknown };
      return { ...spread, elements: readable(spread.elements), parked: readable(spread.parked) };
    }),
  };
}
