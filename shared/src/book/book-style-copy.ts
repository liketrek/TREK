import { bookElementPropsSchema, type BookElementProps } from './book-element-ops.schema';
import type { BookElement } from './book.schema';

/**
 * Copy and paste style: the look of one element taken onto others.
 *
 * The look is exactly what the `style` operation may set for the element's
 * kind (book-element-ops.schema.ts), less the few props that are words or a
 * course rather than looks (a list's column labels, the figures a stats block
 * shows, a line's points). So a pasted style is one `style` operation per
 * element, applied by the same restyle (`bookElementStyled`), the same thing
 * the assistant sends, and onto an element of another kind it carries what
 * both kinds have: a text's colour onto an icon, the opacity onto anything.
 */

export interface BookCopiedStyle {
  kind: BookElement['kind'];
  props: Record<string, unknown>;
}

/**
 * Props of `style` that say what an element shows or where it runs, not how it
 * looks: a line's points are its course, so pasting a look never redraws one.
 */
const CONTENT_KEYS: ReadonlySet<string> = new Set(['metrics', 'proLabel', 'conLabel', 'points']);

const STYLE_KEYS = new Map<string, string[]>(
  bookElementPropsSchema.options.map((o) => [
    o.shape.kind.value,
    Object.keys(o.shape).filter((k) => k !== 'kind' && !CONTENT_KEYS.has(k)),
  ]),
);

/** The look fields an element of a kind takes from a pasted style. */
export function bookStyleKeys(kind: BookElement['kind']): readonly string[] {
  return STYLE_KEYS.get(kind) ?? [];
}

/** The look of an element, as the clipboard keeps it. */
export function bookElementStyle(el: BookElement): BookCopiedStyle {
  const source = el as unknown as Record<string, unknown>;
  const props: Record<string, unknown> = {};
  for (const key of bookStyleKeys(el.kind)) if (source[key] !== undefined) props[key] = source[key];
  return { kind: el.kind, props };
}

/**
 * The `style` operation's `set` for pasting a copied look onto an element of
 * `kind`: what both kinds have, or null when they share nothing.
 */
export function pastableStyle(style: BookCopiedStyle, kind: BookElement['kind']): BookElementProps | null {
  const set: Record<string, unknown> = { kind };
  let any = false;
  for (const key of bookStyleKeys(kind)) {
    if (style.props[key] === undefined) continue;
    set[key] = style.props[key];
    any = true;
  }
  if (!any) return null;
  const parsed = bookElementPropsSchema.safeParse(set);
  return parsed.success ? parsed.data : null;
}
