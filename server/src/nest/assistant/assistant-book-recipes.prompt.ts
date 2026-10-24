import {
  BOOK_COVER_ARCHETYPE_LINES,
  BOOK_COVER_ARCHETYPES,
  BOOK_FONT_ROLES,
  BOOK_FONTS_IDS,
  BOOK_THEME_PRESETS,
  bookFontRole,
} from '@trek/shared';

/**
 * The art director's index and recipes for the Studio assistant (the
 * expansion plan's section 5): which themes, cover archetypes and faces there
 * are, how a brief is written before a design, and short recipes for each
 * cover archetype and three lively spreads, as JSON of the elements a model
 * adds and styles (add, style, add_lockup, background), with frames in
 * percent of the page so they fit any format.
 *
 * The index is built from the catalogues themselves (the themes, the
 * archetype lines the directives describe them with, the faces by role), so
 * it never names something the book does not have. Static once built, so the
 * prompt cache stays stable. Placed before the designer's rules
 * (assistant-book-design.prompt.ts) for those who may change the book.
 */

/** A theme's name: its line up to the colon, "Loud travel poster". */
const themeName = (descr: string) => descr.split(':')[0]?.trim() ?? descr;

const THEMES = BOOK_THEME_PRESETS.map((t) => `${t.id} (${themeName(t.descr)})`).join(', ');
const ARCHETYPES = BOOK_COVER_ARCHETYPES.map((a) => `${a} (${BOOK_COVER_ARCHETYPE_LINES[a]})`).join('; ');
const FACES = BOOK_FONT_ROLES.map(
  (role) => `${role}: ${BOOK_FONTS_IDS.filter((id) => bookFontRole(id) === role).join(', ')}`,
).join('; ');

export const BOOK_RECIPES_PROMPT = `Art direction:
- Write the brief before design_book: the energy (calm, lively or loud), the decoration (none, light, rich), collages or not, the theme, the cover archetype, its photo and its words. Say it in one line, then pass it as directives.brief ({ energy, decoration, collage, theme }) and directives.cover ({ archetype, lockup, title }) with photos.coverPhotoId.
- The engine composes the archetype and the lively pages itself; add pages.overrides ({ index, beat or template }) only for a page of the plan you want otherwise, and tweak single pages with revise_book_design.
- Themes: ${THEMES}.
- Cover archetypes: ${ARCHETYPES}.
- Faces by role (fontRole display, heading, body, script): ${FACES}.
- list_book_assets lists stickers, shapes, fonts, lockups, themes and patterns; pick stickers by the theme's motif or the journey's city as a tag.
Recipes, for a cover built or tweaked by hand, as JSON: each object one element in paint order, added with its kind and content (photoId, text or binding, shape, stickerId), frame, rotation and an id of yours, then styled by that id with the rest; {"lockup"} is add_lockup in that box, {"background"} the background operation. Frames are [x, y, w, h] in percent of the page (mm = percent times the page size / 100), -2 and 102 past the trim to the bleed, a turned frame as it stands before its turn. accent, accent2, accent3, paper and ink are the theme's colours (token on a shape or text, the hex elsewhere); photoId cover is the cover photo, 2 to 4 others; motif is a sticker of the theme's motifs, landmark one of a city the journey stopped in. size is points on a 210 mm page: a title takes fit shrink, on the display tier (72 to 180 pt) unless a band, a badge or a stamp holds it smaller; a text of 7 to 10 pt is a meta line, fontRole heading, tracking 0.3, transform upper.
- spine-band: [{"kind":"photo","photoId":"cover","frame":[-2,-2,104,104]},{"kind":"shape","shape":"rect","token":"accent","frame":[-2,-2,18,104]},{"kind":"text","binding":{"source":"journey.title"},"fontRole":"heading","token":"paper","size":44,"transform":"upper","tracking":0.18,"frame":[-29,41,74,10],"rotation":-90},{"kind":"text","text":"2026","token":"paper","size":8,"frame":[2,91,12,4]},{"kind":"text","binding":{"source":"journey.subtitle"},"fontRole":"script","size":30,"color":"#ffffff","outline":{"color":"#1a1a1a","width":0.7},"frame":[23,70,69,16]}]
- poster-pop: [{"kind":"shape","shape":"sunburst-24","token":"accent2","frame":[29,28,62,62]},{"kind":"shape","shape":"rect","token":"accent","frame":[-2,-2,104,57]},{"kind":"photo","photoId":"cover","frame":[38,40,44,33],"rotation":4,"border":{"width":3,"color":"#ffffff"},"shadow":{"dx":1.3,"dy":1.3,"color":"ink","alpha":0.22}},{"kind":"text","binding":{"source":"journey.title"},"fontRole":"display","token":"paper","size":110,"weight":900,"transform":"upper","leading":0.92,"align":"left","frame":[8,8,84,30]},{"kind":"text","text":"2026","size":9,"frame":[8,88,28,4]},{"kind":"sticker","stickerId":"motif","frame":[76,34,14,14],"rotation":-5}]
- cutout: [{"background":"accent"},{"kind":"text","text":"May 2026","token":"paper","size":9,"frame":[8,8,84,4]},{"kind":"text","binding":{"source":"journey.title"},"fontRole":"display","token":"paper","size":80,"weight":800,"transform":"upper","frame":[8,13,84,25]},{"kind":"shape","shape":"leaf-monstera","token":"accent2","frame":[6,46,28,28],"rotation":-25},{"kind":"shape","shape":"coral-1","token":"accent3","frame":[68,62,30,30],"rotation":20},{"kind":"photo","photoId":"cover","frame":[26,40,48,43],"rotation":2,"border":{"width":4.5,"color":"#ffffff"}},{"kind":"shape","shape":"organic-2","token":"accent3","frame":[19,73,16,16],"rotation":20}]
- postcard: [{"kind":"sticker","stickerId":"landmark","frame":[26,8,48,44]},{"kind":"photo","photoId":"2","frame":[72,8,20,24],"rotation":6,"edge":"perforated","edgeSize":3,"border":{"width":1.6,"color":"#ffffff"}},{"kind":"shape","shape":"wave","token":"ink","frame":[72,35,20,4.5]},{"lockup":"title-script-year","box":[8,60,84,32]}] on a pastel paper; without a landmark of its places, the cover photo in the sticker's frame with mask arch-tall and a white cutout of 2 mm.
- grid-badge: [{"kind":"photo","photoId":"cover","frame":[-2,-2,50.8,50.8]},{"kind":"photo","photoId":"2","frame":[51.2,-2,50.8,50.8]},{"kind":"photo","photoId":"3","frame":[-2,51.2,50.8,50.8]},{"kind":"photo","photoId":"4","frame":[51.2,51.2,50.8,50.8]},{"lockup":"circle-badge","box":[29,29,42,42]}], a cross of paper 2.4 % (5 mm) wide, the badge off every photo's focal point.
- minimal-serif: [{"kind":"photo","photoId":"cover","frame":[8,8,84,53],"border":{"width":0.3,"color":"ink"}},{"kind":"text","binding":{"source":"journey.title"},"fontRole":"display","token":"ink","size":80,"leading":1,"frame":[8,64,84,17]},{"kind":"text","binding":{"source":"journey.subtitle"},"fontRole":"heading","token":"ink","size":11,"frame":[8,82,84,3]},{"kind":"shape","shape":"rect","token":"ink","frame":[28,88.4,20,0.15]},{"kind":"shape","shape":"sun","token":"accent","frame":[48.5,87,3,3]},{"kind":"shape","shape":"rect","token":"ink","frame":[52,88.4,20,0.15]},{"kind":"text","text":"2026","size":8,"frame":[8,92,84,3]}]
- stamp-collage: [{"kind":"shape","shape":"rect","paint":{"type":"pattern","pattern":"checker","fg":"accent","bg":"paper","scale":1,"angle":0},"frame":[-2,-2,104,36]},{"kind":"photo","photoId":"cover","frame":[8,19,26,31],"rotation":-4,"edge":"perforated","edgeSize":3,"border":{"width":2.2,"color":"#ffffff"}},{"kind":"photo","photoId":"2","frame":[37,17,26,34],"rotation":3,"mask":"arch-tall","cutout":{"width":1.8,"color":"#ffffff"}},{"kind":"photo","photoId":"3","frame":[66,19,26,31],"rotation":-3,"edge":"perforated","edgeSize":3,"border":{"width":2.2,"color":"#ffffff"}},{"kind":"text","binding":{"source":"journey.title"},"fontRole":"display","token":"ink","size":90,"weight":800,"transform":"upper","align":"left","frame":[8,62,52,18]},{"kind":"text","text":"May 2026","size":9,"frame":[8,81,52,4]},{"lockup":"postmark","box":[62,60,30,30]}]
Lively spreads, in percent of the double page (the fold at 50); photos 1 to 4 are the page's, entry its entry id:
- script overlay: [{"kind":"photo","photoId":"1","focalX":0.3,"frame":[-1,-2,102,104]},{"kind":"text","binding":{"source":"entry.location","entryId":"entry"},"fontRole":"script","size":120,"color":"#ffffff","outline":{"color":"#1a1a1a","width":2.9},"frame":[55,26,40,30],"rotation":-6},{"kind":"text","binding":{"source":"entry.title","entryId":"entry"},"token":"ink","size":9,"highlight":{"color":"paper"},"frame":[57,62,36,4]}], the photo's detail off the fold and the word.
- collage: [{"kind":"photo","photoId":"1","frameStyle":"polaroid","frame":[6,10,26,36],"rotation":-5},{"kind":"photo","photoId":"2","frameStyle":"white","frame":[22,42,24,32],"rotation":4},{"kind":"photo","photoId":"3","frameStyle":"tape","frame":[56,12,30,40],"rotation":-3},{"kind":"photo","photoId":"4","frameStyle":"white","frame":[66,52,26,34],"rotation":6},{"kind":"sticker","stickerId":"motif","frame":[39,8,7,10],"rotation":8}], up to 3 prints a page turned 3 to 7 degrees either way, none across the fold or over another's focal point.
- two-tone: [{"kind":"photo","photoId":"1","frame":[-1,-2,51,104]},{"kind":"shape","shape":"rect","token":"accent","frame":[50,-2,51,66]},{"kind":"shape","shape":"rect","token":"accent2","frame":[50,64,51,38]},{"kind":"text","text":"1 May 2026","token":"paper","size":9,"frame":[57,10,36,4]},{"kind":"text","binding":{"source":"entry.title","entryId":"entry"},"fontRole":"display","token":"paper","size":66,"leading":1,"align":"left","frame":[57,17,36,40]},{"kind":"text","binding":{"source":"entry.location","entryId":"entry"},"token":"paper","size":9,"frame":[57,72,36,4]}]`;
