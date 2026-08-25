/**
 * Strip markdown formatting to get plain text for previews.
 * Handles: bold, italic, headings, links, images, blockquotes, code, lists, hr.
 */
export function stripMarkdown(md: string): string {
  const withoutImages = md
    .replace(/^#{1,6}\s+/gm, '')           // headings
    // the alt text is a run that cannot contain "](", so it ends on the first one
    // instead of being retried against every later "](". Same matches, no backtracking
    .replace(/!\[(?:(?!\]\().)*\]\(.*?\)/g, '') // images

  return stripLinks(withoutImages)          // links → text
    .replace(/(`{3}[\s\S]*?`{3})/g, '')     // code blocks
    .replace(/`([^`]+)`/g, '$1')            // inline code
    .replace(/\*\*(.+?)\*\*/g, '$1')        // bold **
    .replace(/__(.+?)__/g, '$1')            // bold __
    .replace(/\*(.+?)\*/g, '$1')            // italic *
    .replace(/_(.+?)_/g, '$1')              // italic _
    .replace(/~~(.+?)~~/g, '$1')            // strikethrough
    .replace(/^>\s?/gm, '')                 // blockquotes
    .replace(/^[-*+]\s+/gm, '')             // unordered lists
    .replace(/^\d+\.\s+/gm, '')             // ordered lists
    .replace(/^---+$/gm, '')                // horizontal rules
    .replace(/\n{2,}/g, ' ')               // collapse multiple newlines
    .replace(/\n/g, ' ')                    // remaining newlines → spaces
    .trim()
}

/**
 * `.` matches every character except a line terminator, which is exactly the set a link
 * target could be built from back when this was `.*?`. Testing a single character against
 * it spells that out without hand-listing \n, \r and the two Unicode separators.
 */
const notALineTerminator = /./

/**
 * Replace `[label](target)` with its label, exactly as `/\[([^\]]*)\]\(.*?\)/g` did.
 *
 * Written as a scan rather than a regex because that pattern backtracks: `[^\]]` matches
 * `[` too, so on a run of `[` with no `]` after it the engine retries the whole
 * label-and-target scan from every one of them and reads to the end each time. Measured
 * on 32k of `[x`: 300ms, quadrupling with every doubling. The subject is a journal
 * entry's story text, which any contributor to the journal can write and every reader's
 * browser then renders a preview of.
 *
 * The semantics are the regex's, quirks included:
 *  - the label runs to the FIRST `]` and may itself contain `[`, so `[a[b](c)` keeps
 *    `a[b` — narrowing the label to `[^[\]]` would have been a behaviour change;
 *  - the label may be empty, since `[^\]]*` is zero-or-more, so `[](c)` is a link;
 *  - `(` has to sit directly after that `]`;
 *  - the target ends at the first `)`, and `.` cannot cross a line terminator, so a `(`
 *    whose first `)` only turns up on a later line is not a link at all.
 */
function stripLinks(input: string): string {
  let out = ''
  let cursor = 0 // everything before this has already been copied into `out`
  let search = 0 // where the next `[` is looked for
  // First `)`-or-line-terminator at or after the target we last examined. Targets are
  // examined left to right, so this only ever moves forward — which is what stops a
  // document full of `[a](` from being re-read once per candidate.
  let stop = 0

  for (;;) {
    const open = input.indexOf('[', search)
    if (open === -1) break

    const close = input.indexOf(']', open + 1)
    // No `]` left anywhere: neither this `[` nor any after it can match. Rediscovering
    // that from every `[` in turn is what the regex spent quadratic time on.
    if (close === -1) break

    // Every `[` between `open` and `close` has that same first `]`, so the verdict on
    // what follows it is the verdict for all of them — skip the lot when it fails.
    if (input[close + 1] !== '(') {
      search = close + 1
      continue
    }

    if (stop < close + 2) stop = close + 2
    while (stop < input.length && input[stop] !== ')' && notALineTerminator.test(input[stop])) stop++
    if (input[stop] !== ')') {
      search = close + 1
      continue
    }

    out += input.slice(cursor, open) + input.slice(open + 1, close)
    cursor = stop + 1
    search = stop + 1
  }

  return out + input.slice(cursor)
}
