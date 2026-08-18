/**
 * The few things both the page renderer and the panels around it need.
 *
 * Separate from SpreadView.tsx only so that file exports components and nothing
 * else — a module that mixes the two breaks React Fast Refresh, and this is
 * exactly the kind of file you edit constantly while designing.
 */

/**
 * The book's typefaces.
 *
 * Poppins ships with the client already; Georgia is a system serif. Print will
 * need these self-hosted and identical on the server, or the renderer silently
 * substitutes — which is what the current Journey PDF export does today, asking
 * for Inter while only Poppins is bundled.
 */
export const FONT_STACKS: Record<string, string> = {
  sans: '"Poppins", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  display: '"MuseoModerno", "Poppins", system-ui, sans-serif',
}

export function photoSrc(photoId: number, big: boolean): string {
  return `/api/photos/${photoId}/${big ? 'original' : 'thumbnail'}`
}
