/**
 * The @font-face rules behind the book's typefaces.
 *
 * bookFonts.ts names the seven families; this is where the faces they need
 * arrive. Poppins comes with the app chrome in main.tsx and is not repeated
 * here, and neither are MuseoModerno's 400 and 700: importing a face twice only
 * duplicates every rule. Its 500 and 600 are the book's alone, which is why
 * they are down here rather than up there.
 *
 * Pulled in by StudioShell rather than by main.tsx: nothing outside the editor
 * is set in Lora or Bebas Neue, so the faces travel with the Studio chunk and
 * cost the app's first paint nothing. Once that chunk is loaded they are
 * ordinary stylesheets on the document, which is what lets printSheets copy
 * them into the print frame with everything else.
 *
 * Upright only, as everywhere else in the app: the editor's italic toggle has
 * always been the browser's synthetic slant, and a second file per weight is a
 * lot of download to change that.
 */
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

import '@fontsource/lora/400.css'
import '@fontsource/lora/500.css'
import '@fontsource/lora/600.css'
import '@fontsource/lora/700.css'

import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/700.css'

import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'

import '@fontsource/museomoderno/500.css'
import '@fontsource/museomoderno/600.css'

import '@fontsource/bebas-neue/400.css'
