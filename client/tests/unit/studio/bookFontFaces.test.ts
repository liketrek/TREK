import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { BOOK_FONTS_IDS } from '@trek/shared'
import { BOOK_FONTS, type BookFontId } from '../../../src/components/Studio/bookFonts'
// Loaded for real as well as read: a weight a family does not ship fails to
// resolve here rather than in the build.
import '../../../src/components/Studio/bookFontFaces'

/**
 * The faces behind the stacks (#2183).
 *
 * The stacks were right while five of the seven families were never loaded at
 * all, so Lora, EB Garamond and Playfair Display each came out as Georgia and
 * picking between them changed nothing on screen or on paper. The checks read
 * the imports themselves rather than a list of names copied out of them, which
 * is the kind of second copy that let this go a release unnoticed.
 */

const APP = 'src/main.tsx'
const STUDIO = 'src/components/Studio/bookFontFaces.ts'

// Vitest runs with the client package as its root, so cwd is stable here.
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

/** Every `@fontsource/<package>/<weight>.css` a file imports. */
function facesIn(rel: string): string[] {
  return [...read(rel).matchAll(/@fontsource\/([a-z0-9-]+)\/(\d+)\.css/g)]
    .map(m => `${m[1]}/${m[2]}`)
}

/** @fontsource names its packages after the family, lowercased and hyphenated. */
function faceOf(id: BookFontId, weight: number): string {
  return `${BOOK_FONTS[id].name.toLowerCase().replace(/ /g, '-')}/${weight}`
}

describe('the bundled faces', () => {
  it('loads every family the picker offers, in the weights it offers', () => {
    const loaded = [...facesIn(APP), ...facesIn(STUDIO)]
    for (const id of BOOK_FONTS_IDS) {
      for (const weight of BOOK_FONTS[id].weights) {
        expect(loaded, `${BOOK_FONTS[id].name} ${weight}`).toContain(faceOf(id, weight))
      }
    }
  })

  /* A weight nothing can ask for is a download nobody wanted. */
  it('loads no weight the registry does not declare', () => {
    const declared = BOOK_FONTS_IDS.flatMap(id => BOOK_FONTS[id].weights.map(w => faceOf(id, w)))
    for (const face of facesIn(STUDIO)) {
      expect(declared, face).toContain(face)
    }
  })

  /*
   * The book's faces are a few hundred kilobytes that only the editor uses, so
   * they belong to the lazy Studio chunk. Loading them from main.tsx would put
   * them in front of every first paint, including the ones that never open a
   * book.
   */
  it('rides the Studio chunk rather than the app shell', () => {
    expect(read('src/components/Studio/StudioShell.tsx')).toContain("import './bookFontFaces'")
    for (const face of facesIn(STUDIO)) {
      expect(facesIn(APP), face).not.toContain(face)
    }
  })
})
