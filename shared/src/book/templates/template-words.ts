import { classifyBookTexts } from '../book-layouts';
import { formatBookDate } from '../book-text';
import { MAX_TEXT_LENGTH, type BookElement, type BookSpread, type BookTextElement } from '../book.schema';
import { BOOK_TEMPLATE_TEXT_ROLES, type BookTemplateTextRole } from './template-format';

/**
 * Which of a page's words go into which of a template's text roles, and the
 * words a role takes when the page has none for it.
 *
 * ── The page's own words first ──────────────────────────────────────────
 *
 * A text bound to the journal says what it is: an entry's or the journey's
 * title is a title, a place a subtitle, a date a date, a story the body, a
 * photo's caption a caption. What is left is read the way the built-in
 * layouts read a page (`classifyBookTexts`): the largest type is the title,
 * the longest of the rest the story, the next a date line. A long text only
 * ever goes into the body, so a story is never set as a poster title.
 *
 * ── Then the book's ─────────────────────────────────────────────────────
 *
 * A role the page has no words for takes them from the book: a cover the
 * book's title and the year it was travelled, a page made from a journal
 * entry that entry's title, place, date and story, bound to it so the page
 * follows the journal. A role with no words at all is left off the page.
 */

type TextEl = BookTextElement;
type Binding = TextEl['binding'];

/** Words for a role: what they say, and the journal field they stay in step with. */
export interface BookTemplateWord {
  text: string;
  binding?: Binding;
}
export type BookTemplateWords = Partial<Record<BookTemplateTextRole, BookTemplateWord>>;

/** Past this many characters a text is running text, which only the body takes. */
const SHORT = 120;

const ROLE_OF_SOURCE: Record<NonNullable<Binding>['source'], BookTemplateTextRole> = {
  'journey.title': 'title',
  'entry.title': 'title',
  'journey.subtitle': 'subtitle',
  'entry.location': 'subtitle',
  'entry.date': 'date',
  'entry.story': 'body',
  'photo.caption': 'caption',
};

/** The role a text bound to the journal reads as, by the field it is bound to; undefined for an unbound one. */
export function templateRoleOfBinding(binding: Binding | undefined): BookTemplateTextRole | undefined {
  return binding ? ROLE_OF_SOURCE[binding.source] : undefined;
}

/** Where a short text goes when the role it reads as is taken. */
const SPARE_ORDER: readonly BookTemplateTextRole[] = ['subtitle', 'date', 'caption', 'title', 'body'];

/** A year, or a day and a month in figures: a line that reads as a date. */
const DATE_LIKE = /\b(1[89]|20)\d{2}\b|\b\d{1,2}[./]\d{1,2}\b/;

const isText = (e: BookElement | null | undefined): e is TextEl => !!e && e.kind === 'text' && !!e.text.trim();
const isLong = (t: TextEl) => t.text.trim().length > SHORT;

/** The role a short text reads as on its own: a date line when it says a date, else a subtitle. */
const readsAs = (t: TextEl): BookTemplateTextRole => (DATE_LIKE.test(t.text) ? 'date' : 'subtitle');

/**
 * The page's texts by the role each takes, of the roles the template has.
 * Texts no role takes are left out, for the caller to park.
 */
export function assignTemplateTexts(
  texts: readonly BookElement[],
  roles: ReadonlySet<BookTemplateTextRole>,
): Map<BookTemplateTextRole, TextEl> {
  const out = new Map<BookTemplateTextRole, TextEl>();
  const used = new Set<TextEl>();
  const free = (role: BookTemplateTextRole) => roles.has(role) && !out.has(role);
  const put = (role: BookTemplateTextRole, t: TextEl) => {
    out.set(role, t);
    used.add(t);
  };
  const pool = texts.filter(isText);

  for (const t of pool) {
    const role = templateRoleOfBinding(t.binding);
    if (role && free(role)) put(role, t);
  }
  const rest = pool.filter((t) => !used.has(t));
  const place = (t: TextEl, first: BookTemplateTextRole) => {
    if (used.has(t)) return;
    const role = (isLong(t) ? (['body'] as const) : [first, ...SPARE_ORDER]).find(free);
    if (role) put(role, t);
  };
  const { heading, body, meta } = classifyBookTexts(rest);
  // Without type set as a heading, the first short line is the title, while the title is still free.
  const title = isText(heading) ? heading : free('title') ? rest.find((t) => !isLong(t)) : undefined;
  if (title) place(title, 'title');
  for (const t of [body, meta, ...rest]) if (isText(t)) place(t, isLong(t) ? 'body' : readsAs(t));
  return out;
}

/** The parts of a journey a page's words come from, as the Studio and the book engine both know them. */
export interface BookTemplateWordSource {
  /** The book's own title, which a cover is set in. */
  bookTitle: string;
  /** The journey's subtitle, when it has one. */
  subtitle?: string | null;
  locale: string;
  entries?: readonly {
    id: number;
    title?: string | null;
    story?: string | null;
    location?: string | null;
    date?: string | null;
  }[];
}

const clip = (s: string) => s.trim().slice(0, MAX_TEXT_LENGTH);

/** A cover's words: the book's title, the journey's subtitle and the year of its first dated stop. */
function singlePageWords(src: BookTemplateWordSource): BookTemplateWords {
  const out: BookTemplateWords = {};
  if (src.bookTitle.trim()) out.title = { text: clip(src.bookTitle) };
  if (src.subtitle?.trim()) out.subtitle = { text: clip(src.subtitle), binding: { source: 'journey.subtitle' } };
  const dated = src.entries?.find((e) => e.date && /^\d{4}/.test(e.date))?.date;
  if (dated) out.date = { text: dated.slice(0, 4) };
  return out;
}

/** A page's words from the journal entry it was made from, each bound to the field it came from. */
function entryWords(entry: NonNullable<BookTemplateWordSource['entries']>[number], locale: string): BookTemplateWords {
  const out: BookTemplateWords = {};
  const title = entry.title?.trim() || entry.location?.trim();
  if (title) {
    const source = entry.title?.trim() ? 'entry.title' : 'entry.location';
    out.title = { text: clip(title), binding: { source, entryId: entry.id } };
  }
  if (entry.title?.trim() && entry.location?.trim()) {
    out.subtitle = { text: clip(entry.location), binding: { source: 'entry.location', entryId: entry.id } };
  }
  const date = entry.date ? formatBookDate(entry.date, locale) : '';
  if (date && entry.date) {
    out.date = { text: date, binding: { source: 'entry.date', entryId: entry.id, value: entry.date } };
  }
  if (entry.story?.trim())
    out.body = { text: clip(entry.story), binding: { source: 'entry.story', entryId: entry.id } };
  return out;
}

/** The words a template's empty roles take on this page. */
export function bookTemplateWords(spread: BookSpread, src: BookTemplateWordSource): BookTemplateWords {
  if (spread.role !== 'inner') return singlePageWords(src);
  const entry = spread.entryId === null ? undefined : src.entries?.find((e) => e.id === spread.entryId);
  return entry ? entryWords(entry, src.locale) : {};
}

/** The text roles a template element can carry, as a set for `assignTemplateTexts`. */
export function textRolesOf(roles: readonly string[]): Set<BookTemplateTextRole> {
  return new Set(
    roles.filter((r): r is BookTemplateTextRole => (BOOK_TEMPLATE_TEXT_ROLES as readonly string[]).includes(r)),
  );
}
