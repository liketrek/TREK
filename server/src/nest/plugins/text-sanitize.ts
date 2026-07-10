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

// Pictographic emoji + the pieces of emoji SEQUENCES: regional-indicator flag pairs,
// ZWJ joiners, variation selectors, and combining/enclosing keycap marks. Extended_
// Pictographic covers the emoji themselves (incl. text-presentation ones); removing the
// joiners/selectors keeps a compound sequence from leaving stray glue behind.
const EMOJI_RE = /[\p{Extended_Pictographic}\u{200D}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{20D0}-\u{20FF}]/gu;

/** Remove emojis from a display string and tidy the whitespace they leave behind. */
export function stripEmoji(s: string): string {
  return s.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/** True if the string contains at least one emoji — used by the dev/validate warnings. */
export function hasEmoji(s: string): boolean {
  return EMOJI_RE.test(s);
}
