import { ADDON_IDS } from '../../addons';
import {
  McpController,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  Tool,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyBookEditService } from './journey-book-edit.service';
import {
  addBookPagesArgs,
  BOOK_OP_LIMITS,
  BOOK_THEME_LINK_HINT,
  bookPageSetupForPreset,
  createBookArgs,
  deleteBookPagesArgs,
  describeBookPageArgs,
  duplicateBookPageArgs,
  editBookPageArgs,
  idSchema,
  listBookAssetsArgs,
  listBookLayouts,
  listBookLayoutsArgs,
  moveBookPageArgs,
  removeBookLayoutArgs,
  restoreBookLayoutArgs,
  restoreBookPageArgs,
  saveBookLayoutArgs,
  setBookCoverArgs,
  setBookSetupArgs,
  setBookThemeArgs,
  bookThemeCatalogue,
  type AddBookPagesRequest,
  type CreateBookRequest,
  type DeleteBookPagesRequest,
  type DuplicateBookPageRequest,
  type EditBookPageRequest,
  type ListBookAssetsRequest,
  type MoveBookPageRequest,
  type RemoveBookLayoutRequest,
  type RestoreBookLayoutRequest,
  type RestoreBookPageRequest,
  type SaveBookLayoutRequest,
  type SetBookCoverRequest,
  type SetBookSetupRequest,
  type SetBookThemeRequest,
} from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

/** What a layout does to what is on the page, said where a model picks one (list_book_layouts answers it too). */
const LAYOUT_NOTES = listBookLayouts(null, bookPageSetupForPreset('square-210')).notes;

const UNITS =
  'A book is a list of pages (spreads): the cover, the first page, inner double spreads, the last page and the back. ' +
  'Positions and sizes are millimetres from the top left of the page, a double spread being twice the page width ' +
  'with the fold at one page width.';

const WRITE_ANSWER =
  'It answers the new version, the ids of the pages it changed, each of those pages as get_book lists it, their ' +
  'findings (severe ones are faults to fix, such as overlapping photos, words past their frame or in the fold, ' +
  'empty frames) and dropped, the elements whose content left the page. Nothing is written when any part is refused.';

interface OnJourney {
  journeyId: number;
}

/**
 * TREK Studio books over MCP: read a book page by page, and change it with the
 * same edit engine the Studio and the assistant's cards use. The rights are
 * those of PUT /api/journeys/:id/book: any member reads, the owner and editors
 * write, a viewer is refused, an outsider is told the journey is not there.
 * Every write is one transaction against the stored version and sends
 * journey:book:saved to every member's tabs after the commit, the asking one
 * included, like a save from the Studio.
 *
 * Every field comes from the book contracts in @trek/shared, so a bound that
 * changes there changes here.
 */
@McpController()
export class JourneyBookMcp {
  constructor(
    private readonly books: JourneyBookEditService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  // ── Read ────────────────────────────────────────────────────────────────

  @Tool({
    name: 'get_book',
    description: `The TREK Studio book of a journey, without its document: whether it exists, its version, title and page setup, every page with its index, id, role, entry, photo ids, the first words of each text and how many elements, empty frames and parked elements it holds, and the book's own saved layouts. ${UNITS} Read it before changing the book: page and element ids are never invented, they come from here and from describe_book_page.`,
    inputSchema: { journeyId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async getBook({ journeyId }: OnJourney, ctx: McpContext) {
    return ok(await this.books.overview(journeyId, ctx.userId));
  }

  @Tool({
    name: 'describe_book_page',
    description: `One page of a journey's book in words: its size and role, every element back to front with its id, kind, frame in mm, rotation, lock, photo id or first words and binding, then the findings (overlaps, content in the fold or past the trim, empty frames, low print resolution, words past their frame, parked elements, words on a busy part of a photo, low contrast, type too small, crowded pages, near misses of the margins). ${UNITS} Read it before editing a page and again after, to check the result. With designId (from design_book) it reads the page of that design draft instead of the book.`,
    inputSchema: { journeyId: idSchema, ...describeBookPageArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async describeBookPage(
    { journeyId, spreadId, designId }: OnJourney & { spreadId: string; designId?: string },
    ctx: McpContext,
  ) {
    return ok(await this.books.describePage(journeyId, ctx.userId, spreadId, designId));
  }

  @Tool({
    name: 'list_book_layouts',
    description: `The layouts a page of a journey's book can take: the templates for inner double spreads and for single pages (the cover, first, last and back) with their photo and text slots, the decorated templates under decorated (whole designed pages, each with its archetype, tags, one line of what it looks like, its photo frames and the roles its words go into), the photo grids with their cell count, and the book's own saved layouts. role narrows the answer to inner or single. ${LAYOUT_NOTES.templates} ${LAYOUT_NOTES.decorated} ${LAYOUT_NOTES.grids}`,
    inputSchema: { journeyId: idSchema, ...listBookLayoutsArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async listLayouts({ journeyId, role }: OnJourney & { role?: 'inner' | 'single' }, ctx: McpContext) {
    return ok(await this.books.layouts(journeyId, ctx.userId, role));
  }

  @Tool({
    name: 'list_book_assets',
    description:
      "The Studio's catalogues of things to put on a page of a journey's book, searchable, the ones the Studio's panels show; every row has its id, one line on what it is and its tags, at most limit rows (40 by default) with the total found. kind sticker: flat, multi-coloured illustrations (landmarks, travel things, tropical and Mediterranean motifs, the sea, mountains, the north, Asia, food, paper and tape, doodles, ornaments) with their aspect and colour slots; place one with edit_book_page add { kind: 'sticker', stickerId }, recolour it with colors and mirror it with flipX; beside or over a photo, never over words. kind shape: the outlines a shape draws and a photo is cut to (mask), tagged frame when it holds a photo and edge when it takes a cut edge. kind font: the typefaces by role (display, heading, body, script, mono) with their weights. kind lockup: the set titles, badges, postmarks and quotes add_lockup places, with the word roles each takes. kind theme: the built-in themes with palette, faces and motifs, for set_book_theme and design_book's brief. kind pattern: the repeats a paint takes. query searches ids, tags and descriptions in English; tags narrow it; theme narrows stickers. Templates are list_book_layouts'.",
    inputSchema: { journeyId: idSchema, ...listBookAssetsArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async listAssets({ journeyId, ...search }: OnJourney & ListBookAssetsRequest, ctx: McpContext) {
    return ok(await this.books.assets(journeyId, ctx.userId, search));
  }

  // ── Write ───────────────────────────────────────────────────────────────

  @Tool({
    name: 'create_book',
    description: `Lay down a blank book for a journey that has none yet: a cover, the first page, one empty double spread, the last page and the back, in the page format preset names (a 21 cm square unless told otherwise), titled title or else the journey's title. A journey that has a book already is refused. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...createBookArgs },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async createBook({ journeyId, ...args }: OnJourney & CreateBookRequest, ctx: McpContext) {
    return ok(await this.books.createBook(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'add_book_pages',
    description: `Add 1 to ${BOOK_OP_LIMITS.pagesPerCall} empty double spreads after afterSpreadId, always kept between the first and the last page, laid out on template when one is named (a built-in or decorated double-spread layout from list_book_layouts) and tied to the journey entry entryId when given. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...addBookPagesArgs },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async addBookPages({ journeyId, ...args }: OnJourney & AddBookPagesRequest, ctx: McpContext) {
    return ok(await this.books.addPages(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'move_book_page',
    description: `Move one inner double spread to toIndex, which must lie between the first and the last page (get_book gives the indexes). The cover, first, last and back pages keep their place. The answer also says where the page stood, under from_index; a move to where the page already is writes nothing. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...moveBookPageArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async moveBookPage({ journeyId, ...args }: OnJourney & MoveBookPageRequest, ctx: McpContext) {
    return ok(await this.books.movePage(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'delete_book_pages',
    description: `Delete 1 to ${BOOK_OP_LIMITS.pagesPerCall} inner double spreads with everything on them. The cover, first, last and back pages cannot be deleted. Only when the person asked for it. With returnPrevious the answer also holds the deleted pages as they were, under previous_spreads, and a null digest for each under page_digests (for restore_book_page expectedPages). ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...deleteBookPagesArgs },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async deleteBookPages({ journeyId, ...args }: OnJourney & DeleteBookPagesRequest, ctx: McpContext) {
    return ok(await this.books.deletePages(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'edit_book_page',
    description: `Change one page with 1 to ${BOOK_OP_LIMITS.opsPerCall} operations, run in order, all or nothing: layout (a built-in or decorated template, grid, saved layout, or auto to lay the page out again from its entry), place_photo (a photo of the journey's gallery into a frame by elementId, by its slot among the page's frames, or into a new frame), photo_look (the crop as fit and focal point, mask, frame style, filter, radius), swap_photos, text (by elementId, or by role heading, body or meta, which creates the text when the page has none), caption (under a photo, bound to its caption in the journal unless words are given), frame (move, resize, turn), remove (parked with the page by default, park false deletes), background (a colour, or a paint: a colour with alpha, a linear or radial gradient, or one of twelve patterns; null is the paper), add (a new photo frame, text, shape, icon, sticker from list_book_assets, line, map, figures, country outlines, mark or list, by what it is: its look follows with style, naming the id given to it in add; a line runs through points on the spread in mm; the journey's own values such as the route, figures and countries come from the journey, never from you), style (the look of one element of its kind: opacity, colours, a shape's paint, fonts, strokes, a cut edge on a shape or photo such as a stamp's perforation, a line's points and the like, for a text also its case, vertical place, outline, hard shadow, marker band, curve on an arc or a circle, a fill of a gallery photo or hollow letters, and shrink to fit, for a photo its border, hard shadow, zoom, mirror, adjustments, duotone and cutout, and for a line its heads, dashes, a wave or an ornament; ${BOOK_THEME_LINK_HINT}), arrange (to front, forward, backward, to back), align and distribute (several elements by their edges or centres, against each other, the page or the safe area), lock, duplicate, fill (a photo to the bleed of its page or the spread, behind everything), copy_from (elements of another page), refresh_travel (travel elements to the journey's current figures), add_grid (a photo grid as empty frames in a box), group and ungroup (two or more elements picked, moved, aligned and arranged as one, such as a title lockup; align and distribute move a group as one box), name (an element or a group, as the layers panel shows it), hide (left off the page and out of print, or shown again) and add_lockup (one of the Studio's text styles: a set title, badge, postmark, stamp, quote, caption or chapter mark of a few texts and shapes, its words given by role, every text fitted to its frame, placed as one group). A locked element refuses any operation that would change it but lock, ungroup, name and hide. The road a map draws between stops is a straight or bowed line; roads are not routed. ${LAYOUT_NOTES.templates} ${LAYOUT_NOTES.grids} ${UNITS} With returnPrevious the answer also holds the page as it was, under previous_spreads, and a digest of each page as the write left it under page_digests (for restore_book_page expectedPages). ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...editBookPageArgs },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async editBookPage({ journeyId, ...args }: OnJourney & EditBookPageRequest, ctx: McpContext) {
    return ok(await this.books.editPage(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'set_book_cover',
    description: `The cover of a journey's book: its layout (a built-in or decorated single-page template from list_book_layouts), its photo (from the journey's gallery, into a free frame, else a full bleed one behind everything), its title and its subtitle. A title or subtitle bound to the journey's own stays bound unless other words are given. With returnPrevious the answer also holds the cover as it was, under previous_spreads, and a digest of the cover as the write left it under page_digests (for restore_book_page expectedPages). ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...setBookCoverArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async setBookCover({ journeyId, ...args }: OnJourney & SetBookCoverRequest, ctx: McpContext) {
    return ok(await this.books.setCover(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'set_book_setup',
    description: `The page format of a journey's book (preset, or pageWidth and pageHeight in mm, bleed and safe margin) and its page numbers (show, startAt, position, margin, size, autoColor, color, font). Elements keep their size and place, as in the Studio, so check the pages after a change of format. The answer also holds the setup as it was, under previous_setup. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...setBookSetupArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async setBookSetup({ journeyId, ...args }: OnJourney & SetBookSetupRequest, ctx: McpContext) {
    return ok(await this.books.setSetup(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'set_book_theme',
    description: `Apply a theme to a journey's book: its paper, ink and three accents, its display, heading, body and script faces, and the motifs and decoration it suits. Start from a built-in theme (theme) or the book's own, change any colour, face, motif or decoration on top, and apply it to every page or only to spreadIds. Only colours and texts linked to the theme change (describe_book_page says what each element follows); with adopt (the default) what is not linked yet is linked first, words in white over photos staying as they are. Positions, photos and words never move. The themes: ${bookThemeCatalogue()} The answer names the revision the book was kept as before it, under revision_id. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...setBookThemeArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async setBookTheme({ journeyId, ...args }: OnJourney & SetBookThemeRequest, ctx: McpContext) {
    return ok(await this.books.setTheme(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'duplicate_book_page',
    description: `Copy one inner double spread with everything on it, with new element ids, right after it. The cover, first, last and back pages cannot be copied. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...duplicateBookPageArgs },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async duplicateBookPage({ journeyId, ...args }: OnJourney & DuplicateBookPageRequest, ctx: McpContext) {
    return ok(await this.books.duplicatePage(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'save_book_layout',
    description: `Keep the arrangement of one page as one of the book's own layouts, named name or "Layout n", which edit_book_page's layout then takes as saved. A book keeps at most 24. The answer names the new layout under layout_id. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...saveBookLayoutArgs },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async saveBookLayout({ journeyId, ...args }: OnJourney & SaveBookLayoutRequest, ctx: McpContext) {
    return ok(await this.books.saveLayout(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'remove_book_layout',
    description: `Take one of the book's own layouts away by its id (get_book lists them); pages laid out on it stay as they are. Only when the person asked for it. The answer holds the layout as it was, under previous_layout. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...removeBookLayoutArgs },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async removeBookLayout({ journeyId, ...args }: OnJourney & RemoveBookLayoutRequest, ctx: McpContext) {
    return ok(await this.books.removeLayout(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'restore_book_layout',
    description: `Put back one of the book's own layouts exactly as remove_book_layout answered it under previous_layout, given as JSON in layout. Refused unless the book is still at expectedVersion. This takes back an earlier removal; it is not a way to make a layout. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...restoreBookLayoutArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async restoreBookLayout({ journeyId, ...args }: OnJourney & RestoreBookLayoutRequest, ctx: McpContext) {
    return ok(await this.books.restoreLayout(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'restore_book_page',
    description: `Put pages of a journey's book back exactly as pages gives them, all in one call: each in its place when the book still has a page with its id, else at its index, lowest index first. Refused unless the book is still at expectedVersion, so nothing saved since is overwritten. With expectedPages (that change's page_digests) every page they name must still be as the change left them, and when they name every page put back with a digest the version is not checked; a page put back that they leave out or name as deleted keeps the version check. A photo must be in the journey's gallery or already in the book, and a locked element stays as it is. This takes back an earlier change (pages is that change's previous_spreads, whole); it is not a way to edit a page. ${WRITE_ANSWER}`,
    inputSchema: { journeyId: idSchema, ...restoreBookPageArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async restoreBookPage({ journeyId, ...args }: OnJourney & RestoreBookPageRequest, ctx: McpContext) {
    return ok(await this.books.restorePage(journeyId, ctx.userId, args));
  }
}
