import type { BookElement } from '../book.schema';
import { themedElement } from './book-theme-apply';
import type { BookTheme } from './book-theme.schema';

/**
 * Keeping an element's theme links honest when it is edited: one rule for
 * the inspector and for the `add` and `style` operations alike.
 *
 * - A colour set by hand, without its link in the same change, unlinks it:
 *   the person chose that colour, and the next theme must not take it away.
 *   A face chosen by hand unlinks `fontRole` the same way.
 * - A link set in the change takes the theme's value at once, when the book
 *   has a theme, so linking and recolouring are one step.
 * - A link set to null is taken away, and the colour stays as it is.
 */

/** Which link each colour or face field has, per kind. */
const LINKS: Record<string, readonly (readonly [field: string, link: string])[]> = {
  text: [
    ['color', 'token'],
    ['font', 'fontRole'],
  ],
  icon: [['color', 'token']],
  photo: [],
  sticker: [],
  shape: [
    ['fill', 'token'],
    ['paint', 'token'],
    ['stroke', 'strokeToken'],
  ],
  typeset: [
    ['color', 'token'],
    ['accent', 'accentToken'],
    ['font', 'fontRole'],
  ],
};

const linksOf = (kind: BookElement['kind']) => LINKS[kind] ?? (LINKS.typeset as readonly (readonly [string, string])[]);

/** The link fields of an element's kind, for a caller that strips or lists them. */
export function themeLinkFields(kind: BookElement['kind']): string[] {
  return [...new Set(linksOf(kind).map(([, link]) => link))];
}

/**
 * The element as the change leaves it, its links kept in step: `el` already
 * carries the change, `change` is what was asked, `theme` the book's own.
 */
export function withThemeLinks<E extends BookElement>(
  el: E,
  change: Readonly<Record<string, unknown>>,
  theme: BookTheme | undefined,
): E {
  const next: Record<string, unknown> = { ...el };
  let linked = false;
  for (const [field, link] of linksOf(el.kind)) {
    const asked = change[link];
    if (asked === null) delete next[link];
    else if (asked !== undefined) linked = true;
    else if (change[field] !== undefined) delete next[link];
  }
  const out = next as E;
  return linked && theme ? themedElement(out, theme) : out;
}
