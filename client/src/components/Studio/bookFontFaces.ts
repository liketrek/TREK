/**
 * The @font-face rules behind the book's typefaces.
 *
 * The catalogue in @trek/shared (book-fonts.data.ts) names the families, the
 * weights each ships and the weights it has a real italic for; this is where
 * those faces arrive, one import per face. Poppins 300 to 700 and
 * MuseoModerno 400, 700 and 800 come with the app chrome in main.tsx and are
 * not repeated here: importing a face twice only duplicates every rule.
 *
 * Pulled in by StudioShell rather than by main.tsx: nothing outside the editor
 * is set in Lora or Anton, so the rules travel with the Studio chunk and cost
 * the app's first paint nothing. Once that chunk is loaded they are ordinary
 * stylesheets on the document, which is what lets printSheets copy them into
 * the print frame with everything else.
 *
 * A rule is not a download. The browser fetches a face's file only when text
 * on the page is set in it, and only the subsets (latin, latin-ext, cyrillic
 * and so on) whose characters that text uses, so a book set in two families
 * loads two families however long this list grows. The print frame loads the
 * same way, and the assistant's page snapshot embeds only the faces a page
 * draws (snapshotFonts.ts).
 *
 * Real italics for the serifs, where the browser's slant reads as a mistake;
 * the sans faces keep the synthetic oblique they always had, which saves a
 * second file per weight nobody would tell apart.
 *
 * Big Shoulders Display is imported without `.css`: its package maps `./*` to
 * `./*.css` and has no `./*.css` entry of its own, so `100.css` would resolve
 * to `100.css.css` and fail the build.
 */
import '@fontsource/poppins/100.css'
import '@fontsource/poppins/200.css'
import '@fontsource/poppins/800.css'
import '@fontsource/poppins/900.css'

import '@fontsource/inter/100.css'
import '@fontsource/inter/200.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'

import '@fontsource/montserrat/100.css'
import '@fontsource/montserrat/200.css'
import '@fontsource/montserrat/300.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/montserrat/900.css'

import '@fontsource/lora/400.css'
import '@fontsource/lora/500.css'
import '@fontsource/lora/600.css'
import '@fontsource/lora/700.css'
import '@fontsource/lora/400-italic.css'
import '@fontsource/lora/500-italic.css'
import '@fontsource/lora/600-italic.css'
import '@fontsource/lora/700-italic.css'

import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/700.css'
import '@fontsource/eb-garamond/800.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500-italic.css'
import '@fontsource/eb-garamond/600-italic.css'
import '@fontsource/eb-garamond/700-italic.css'
import '@fontsource/eb-garamond/800-italic.css'

import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/800.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/playfair-display/500-italic.css'
import '@fontsource/playfair-display/600-italic.css'
import '@fontsource/playfair-display/700-italic.css'
import '@fontsource/playfair-display/800-italic.css'
import '@fontsource/playfair-display/900-italic.css'

import '@fontsource/fraunces/100.css'
import '@fontsource/fraunces/200.css'
import '@fontsource/fraunces/300.css'
import '@fontsource/fraunces/400.css'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/fraunces/800.css'
import '@fontsource/fraunces/900.css'
import '@fontsource/fraunces/100-italic.css'
import '@fontsource/fraunces/200-italic.css'
import '@fontsource/fraunces/300-italic.css'
import '@fontsource/fraunces/400-italic.css'
import '@fontsource/fraunces/500-italic.css'
import '@fontsource/fraunces/600-italic.css'
import '@fontsource/fraunces/700-italic.css'
import '@fontsource/fraunces/800-italic.css'
import '@fontsource/fraunces/900-italic.css'

import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/300-italic.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import '@fontsource/cormorant-garamond/700-italic.css'

import '@fontsource/dm-serif-display/400.css'
import '@fontsource/dm-serif-display/400-italic.css'

import '@fontsource/bodoni-moda/400.css'
import '@fontsource/bodoni-moda/500.css'
import '@fontsource/bodoni-moda/600.css'
import '@fontsource/bodoni-moda/700.css'
import '@fontsource/bodoni-moda/800.css'
import '@fontsource/bodoni-moda/900.css'
import '@fontsource/bodoni-moda/400-italic.css'
import '@fontsource/bodoni-moda/500-italic.css'
import '@fontsource/bodoni-moda/600-italic.css'
import '@fontsource/bodoni-moda/700-italic.css'
import '@fontsource/bodoni-moda/800-italic.css'
import '@fontsource/bodoni-moda/900-italic.css'

import '@fontsource/bebas-neue/400.css'

import '@fontsource/anton/400.css'

import '@fontsource/oswald/200.css'
import '@fontsource/oswald/300.css'
import '@fontsource/oswald/400.css'
import '@fontsource/oswald/500.css'
import '@fontsource/oswald/600.css'
import '@fontsource/oswald/700.css'

import '@fontsource/league-gothic/400.css'

import '@fontsource/big-shoulders-display/100'
import '@fontsource/big-shoulders-display/200'
import '@fontsource/big-shoulders-display/300'
import '@fontsource/big-shoulders-display/400'
import '@fontsource/big-shoulders-display/500'
import '@fontsource/big-shoulders-display/600'
import '@fontsource/big-shoulders-display/700'
import '@fontsource/big-shoulders-display/800'
import '@fontsource/big-shoulders-display/900'

import '@fontsource/archivo-black/400.css'

import '@fontsource/museomoderno/100.css'
import '@fontsource/museomoderno/200.css'
import '@fontsource/museomoderno/300.css'
import '@fontsource/museomoderno/500.css'
import '@fontsource/museomoderno/600.css'
import '@fontsource/museomoderno/900.css'

import '@fontsource/shrikhand/400.css'

import '@fontsource/alfa-slab-one/400.css'

import '@fontsource/bricolage-grotesque/200.css'
import '@fontsource/bricolage-grotesque/300.css'
import '@fontsource/bricolage-grotesque/400.css'
import '@fontsource/bricolage-grotesque/500.css'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'

import '@fontsource/abril-fatface/400.css'

import '@fontsource/caveat/400.css'
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/600.css'
import '@fontsource/caveat/700.css'

import '@fontsource/dancing-script/400.css'
import '@fontsource/dancing-script/500.css'
import '@fontsource/dancing-script/600.css'
import '@fontsource/dancing-script/700.css'

import '@fontsource/pacifico/400.css'

import '@fontsource/great-vibes/400.css'

import '@fontsource/sacramento/400.css'

import '@fontsource/kaushan-script/400.css'

import '@fontsource/allura/400.css'

import '@fontsource/parisienne/400.css'

import '@fontsource/satisfy/400.css'

import '@fontsource/yellowtail/400.css'

import '@fontsource/homemade-apple/400.css'

import '@fontsource/permanent-marker/400.css'

import '@fontsource/dm-mono/300.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
