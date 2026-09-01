/**
 * The few things both the page renderer and the panels around it need.
 *
 * Separate from SpreadView.tsx only so that file exports components and nothing
 * else — a module that mixes the two breaks React Fast Refresh, and this is
 * exactly the kind of file you edit constantly while designing.
 */

// The typefaces live in bookFonts.ts (fontStack et al.) — a second stack map
// here is exactly how #2183 happened: the renderer kept a three-font copy
// while the picker grew to seven, and everything else fell back to Poppins.

export function photoSrc(photoId: number, big: boolean): string {
  return `/api/photos/${photoId}/${big ? 'original' : 'thumbnail'}`
}
