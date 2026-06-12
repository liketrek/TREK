import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML sanitisation for TREK.
 *
 * TREK currently has no rich-text editor and no user-provided HTML reaches
 * the database, so this module exists only to guard the handful of client
 * sites that interpolate user-controlled strings into a markup template
 * (today: the Journey suggestion banner). It is also the future home for
 * sanitisation if TipTap / Markdown ever ships.
 *
 * Why isomorphic-dompurify: works unchanged in browser (DOMPurify) and Node
 * (DOMPurify + jsdom). Tree-shakes correctly so the client bundle does not
 * pull jsdom.
 */

// Inline-only tags. Block-level markup (paragraphs, lists, headings) is not
// expected in the surfaces we render today, so we keep the allow-list minimal
// and rely on `sanitizeRichTextHtml` when a richer surface needs full prose.
const INLINE_TAGS = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'del',
  'ins',
  'mark',
  'code',
  'sub',
  'sup',
  'br',
  'span',
] as const;

const FULL_TAGS = [
  ...INLINE_TAGS,
  'p',
  'div',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'hr',
  'a',
] as const;

const SAFE_ATTRIBUTES = ['href', 'rel', 'target'] as const;

/**
 * Escapes the five HTML metacharacters so a raw string can be safely
 * interpolated into an HTML template. Use this BEFORE substitution when a
 * user-controlled value lands inside a markup-shaped translation string.
 *
 * This is *not* a substitute for `sanitizeInlineHtml`: escape input, then
 * sanitise the resulting template — both layers run together in `tHtml`.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strict inline sanitiser. Use for short, mostly-text strings that may include
 * basic emphasis (`<strong>`, `<em>`, …) — e.g. the Journey suggestion banner
 * where a translated template embeds a user-controlled trip title.
 *
 * Drops every tag outside the inline allow-list, strips all attributes, and
 * blocks every URL scheme except http/https/mailto/tel via DOMPurify's
 * built-in URL allow-list.
 */
export function sanitizeInlineHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...INLINE_TAGS],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Permissive rich-text sanitiser. Use when a surface legitimately renders a
 * prose document (lists, paragraphs, links). Keeps the same tag families as
 * the inline sanitiser plus block-level markup and anchors with safe attrs.
 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...FULL_TAGS],
    ALLOWED_ATTR: [...SAFE_ATTRIBUTES],
    ALLOW_DATA_ATTR: false,
  });
}
