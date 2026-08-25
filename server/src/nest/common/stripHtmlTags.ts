/**
 * Remove HTML-ish tags from a string, exactly as `/<[^>]+>/g` did.
 *
 * Written as a scan rather than a regex because that pattern backtracks: `[^>]`
 * matches `<` too, so on a run of `<` with no closing `>` the engine retries
 * from every one of them and rescans to the end each time. Measured on a 16k
 * run: 0.52s, and both callers take attacker-supplied text — an uploaded KML
 * description and Wikimedia Commons metadata.
 *
 * The semantics are the regex's, quirks included:
 *  - a tag needs at least one character between the brackets, so `<>` is left
 *    alone (`[^>]+` is one-or-more);
 *  - `<` inside a tag is content, so `<a<b>` is one tag, not two — which is
 *    what browsers do with malformed markup, and why narrowing the class to
 *    `[^<>]` would have been a behaviour change rather than a fix;
 *  - an unterminated `<` at the end is literal text.
 */
export function stripHtmlTags(input: string, replacement = ''): string {
  let out = '';
  let cursor = 0;

  for (;;) {
    const open = input.indexOf('<', cursor);
    if (open === -1) break;

    const close = input.indexOf('>', open + 1);
    // No closing bracket anywhere after: the rest is literal, and this is the
    // case the regex spent quadratic time discovering.
    if (close === -1) break;

    // `<>` — nothing between the brackets, so not a tag. Keep the `<` and carry
    // on from the next character, exactly as the regex's next match attempt would.
    if (close === open + 1) {
      out += input.slice(cursor, open + 1);
      cursor = open + 1;
      continue;
    }

    out += input.slice(cursor, open) + replacement;
    cursor = close + 1;
  }

  return out + input.slice(cursor);
}
