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
