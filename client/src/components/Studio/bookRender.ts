/**
 * The few things both the page renderer and the panels around it need.
 *
 * Separate from SpreadView.tsx only so that file exports components and nothing
 * else — a module that mixes the two breaks React Fast Refresh, and this is
 * exactly the kind of file you edit constantly while designing.
 */

import { createContext } from 'react'

// The typefaces live in bookFonts.ts (fontStack et al.) — a second stack map
// here is exactly how #2183 happened: the renderer kept a three-font copy
// while the picker grew to seven, and everything else fell back to Poppins.

/**
 * Where a printed photo keeps its source until the print view asks for it.
 *
 * A book's sheets are rendered in one go, and an `<img>` starts loading the
 * moment it has a `src`. A journey of a few hundred photos asked the server for
 * every original at once, twice (off screen in the editor, then in the print
 * frame), and the browser gave up with "insufficient resources" (#3102). So the
 * print markup carries the source here and `loadPrintImages` hands it over a
 * few at a time.
 */
export const PRINT_SRC_ATTR = 'data-print-src'

/**
 * Whether the photos drawn below hold their source back for the print view.
 * Only the export's sheets say so: a print-mode page drawn anywhere else (the
 * assistant's look at a page) loads its photos itself.
 */
export const DeferPrintPhotos = createContext(false)

export function photoSrc(photoId: number, big: boolean): string {
  return `/api/photos/${photoId}/${big ? 'original' : 'thumbnail'}`
}
