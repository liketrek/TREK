/**
 * The anchor a wiki heading gets when TREK renders it.
 *
 * Lowercase, drop everything that is not a word character, whitespace or a
 * hyphen, trim, and turn each run of whitespace into one hyphen. The help
 * center links into the wiki with `#<anchor>` (`docsRoute`), so a guide's
 * anchor has to be the slug this produces, not the one another renderer would.
 * It lives on its own so the reader and the test that guards the links agree
 * by construction instead of by two copies of the same regexes.
 */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
