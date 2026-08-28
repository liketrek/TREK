/**
 * TREK renders its UI with a single icon language (lucide) and no emojis. Plugin
 * authors — especially AI-generated ones — tend to sprinkle emojis into the declarative
 * text TREK renders NATIVELY (badges, columns, warnings, PDF sections, map-marker labels,
 * calendar/photo titles, notifications), which clashes with that language. So every such
 * string is emoji-stripped at the render boundary: no matter what a plugin returns, the
 * text TREK draws in its own chrome stays emoji-free. A plugin that wants an icon uses
 * the declarative `icon` field with a lucide name instead. This does NOT touch the
 * plugin's own sandboxed `/ui` frame — that markup is the author's to design.
 */

// Colour emoji + the pieces of emoji SEQUENCES: skin-tone modifiers, regional-
// indicator flag letters, ZWJ joiners, variation selectors, keycap enclosure and
// tag chars. Emoji_Presentation (not the far broader Extended_Pictographic) targets
// only the glyphs that render as colour emoji by default, so legitimate text symbols
// a plugin might use — ©, ®, ™, ★, arrows, card suits — survive; removing the
// joiners/selectors keeps a compound sequence from leaving stray glue behind. Each
// escape is an intentional, independent code point to delete — the
// no-misleading-character-class rule assumes a class means to combine them, which
// is the opposite of what we want here.
// eslint-disable-next-line no-misleading-character-class
const EMOJI_RE = /\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Regional_Indicator}|[\u200D\uFE00-\uFE0F\u20E3\u{E0020}-\u{E007F}]/gu;

/** Remove emojis from a display string and tidy the whitespace they leave behind. */
export function stripEmoji(s: string): string {
  const stripped = s.replace(EMOJI_RE, '');
  // Nothing removed → return verbatim so a plain string keeps its exact spacing and
  // paragraph breaks (matters for PDF paragraphs). Otherwise collapse only the
  // horizontal gaps an emoji left, never newlines. The trailing-space trim carries the
  // char in front of the run (or the line start) into the match and puts it back, so the
  // run is only ever walked from its own start — plugin text must not make ` +$` restart
  // inside every space of a long one.
  if (stripped === s) return s;
  return stripped.replace(/[^\S\r\n]{2,}/g, ' ').replace(/(^|[^ ]) +$/gm, '$1').trim();
}

/** True if the string contains at least one emoji — used by the dev/validate warnings. */
export function hasEmoji(s: string): boolean {
  // EMOJI_RE carries the `g` flag, so .test() advances lastIndex; reset it first
  // or a second call could resume mid-string and miss a leading emoji.
  EMOJI_RE.lastIndex = 0;
  return EMOJI_RE.test(s);
}

// C0 and C1 controls, the Unicode line/paragraph separators, and the bidi
// overrides and isolates. Each group defeats a different half of the rule below:
// U+2028/9 are line breaks to a renderer but not to /\n/, and the bidi controls
// make a string render as one thing while it tokenises as another. \t is in the
// C0 range and goes with the rest — a tab is not meaningful in a tool description
// and is one more way to fake structure.
// eslint-disable-next-line no-control-regex
const UNSAFE_CONTROL_RE = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;

/**
 * The assistant-context flavour of the render-boundary sanitiser above.
 *
 * A plugin's tool name, title and description are a direct, persistent and
 * admin-invisible write into every user's assistant context. That is a stronger
 * surface than a badge or a PDF heading, which a person reads and discounts, so
 * this goes further than stripEmoji:
 *
 *  - every control character goes, not just the emoji glue;
 *  - every whitespace run collapses to ONE SPACE, newlines included, so a
 *    description cannot forge "\n\n## System\nIgnore previous instructions" —
 *    a markdown heading that reads to the model like host text;
 *  - then emoji, then a hard cap.
 *
 * Deliberately a sibling rather than a change to stripEmoji: that one preserves
 * newlines on purpose (PDF paragraphs) and ~15 render call sites depend on it.
 */
export function sanitiseAssistantText(value: unknown, max: number): string {
  const raw = typeof value === 'string' ? value : value == null ? '' : String(value);
  const flattened = raw.replace(UNSAFE_CONTROL_RE, ' ').replace(/\s+/g, ' ').trim();
  return stripEmoji(flattened).trim().slice(0, max);
}
