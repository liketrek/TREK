/**
 * The README quality gate, as pure functions of the markdown.
 *
 * These are a LINE-FOR-LINE port of TREK-Plugins' scripts/check-readme.mjs. They live apart
 * from the checks that call them because the same gate runs twice, against two different
 * READMEs, and both must agree with CI:
 *
 *   - offline, against README.md in the WORKING TREE  (`status` / `validate`)
 *   - over the network, against README.md at the PINNED COMMIT  (`preflight`)
 *
 * The two differ more often than you would think — an author fills the README in and forgets
 * to commit it, and the tree is green while the tag CI grades is not. Keeping one implementation
 * means the offline pass can never be more lenient than the network one; only more current.
 *
 * If you change a rule here, change scripts/check-readme.mjs to match, or you have built a
 * false green. test/checks-parity.test.ts asserts the two agree.
 */

/** Every section CI demands, matched case-insensitively as a substring of a heading. */
export const REQUIRED_SECTIONS = ['What it does', 'Screenshots', 'Permissions', 'Setup'];

/** Template prose that means the author never edited the scaffold. */
export const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]*\}\}/,
  /\bREPLACE_ME\b/i,
  /\bDescribe (what|the)\b/i,
  /\byour-name\/trek-plugin/i,
];

export const MIN_PROSE_CHARS = 400;

/**
 * The heading body, with the trailing HTML comment authors use to hide anchors cut off.
 *
 * Cut with indexOf rather than a regex on purpose. The obvious spellings — the
 * `(.+?)\s*(?:<!--.*)?$` this used to be, or a `replace(/\s*<!--.*$/, '')` in front of it —
 * put two quantifiers on the same run of spaces, and both then backtrack quadratically:
 * a heading line padded with 80k spaces takes ~12s, 200k takes ~30s. This gate runs over
 * READMEs anyone can submit to the registry, so that is a stall someone can post. Same
 * failure the wiki sidebar parser was rewritten for (server/src/nest/help/wiki.ts).
 */
function headingBody(line: string): string {
  const comment = line.indexOf('<!--');
  return comment < 0 ? line : line.slice(0, comment);
}

/** Which of REQUIRED_SECTIONS have no matching heading. */
export function missingSections(md: string): string[] {
  const headings = md
    .split('\n')
    // `\S.*\S|\S` instead of a lazy body: the edges are pinned to non-space, so nothing
    // competes with the trailing `\s*`.
    .map((line) => /^#{1,6}\s+(\S.*\S|\S)\s*$/.exec(headingBody(line))?.[1].toLowerCase())
    .filter((h): h is string => h !== undefined);
  return REQUIRED_SECTIONS.filter((want) => !headings.some((got) => got.includes(want.toLowerCase())));
}

/** The literal placeholder strings still present, e.g. ['Describe what']. */
export function placeholders(md: string): string[] {
  const hits: string[] = [];
  for (const re of PLACEHOLDER_PATTERNS) {
    const hit = md.match(re);
    if (hit) hits.push(hit[0]);
  }
  return hits;
}

/**
 * The length of the author's actual WRITING, with everything that isn't prose stripped:
 * comments, code fences, images, links, headings, table rows, then markdown punctuation.
 *
 * This is why a scaffold can't game the 400-char floor with a big permissions table — the
 * table is stripped. It has to be sentences.
 */
export function proseLength(md: string): number {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/^\s*\|.*$/gm, '')
    .replace(/[#>*_`|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/** Every image src the README references — markdown and <img>, minus data: URIs (CI ignores those). */
export function images(md: string): string[] {
  const mdImgs = [...md.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)].map((m) => m[1]);
  const htmlImgs = [...md.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  return [...new Set([...mdImgs, ...htmlImgs])].filter((u) => !u.startsWith('data:'));
}

/** Manifest permissions that are never named anywhere in the README. CI rejects these. */
export function undocumentedPermissions(md: string, permissions: string[]): string[] {
  const lower = md.toLowerCase();
  return permissions.filter((p) => !lower.includes(p.toLowerCase()));
}
