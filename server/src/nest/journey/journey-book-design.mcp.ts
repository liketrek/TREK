import { ADDON_IDS } from '../../addons';
import {
  McpController,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  Tool,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyBookDesignService } from './journey-book-design.service';
import {
  applyBookDesignArgs,
  BOOK_DESIGN_LIMITS,
  designBookArgs,
  getBookDesignArgs,
  idSchema,
  restoreBookRevisionArgs,
  reviseBookDesignArgs,
  type ApplyBookDesignRequest,
  type DesignBookRequest,
  type GetBookDesignRequest,
  type RestoreBookRevisionRequest,
  type ReviseBookDesignRequest,
} from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

const DRAFT_FLOW =
  'design_book makes a draft; nothing in the book changes until apply_book_design is approved. A draft is kept six ' +
  'hours for the person who made it; page ids in it come from its plan, never invented.';

const LIMITS =
  'What the design knows of a photo is its day, place, sharpness, size, colours, busy and calm areas and where its ' +
  'detail gathers (an estimate). It sees no faces and judges no beauty: check people and taste on the page images. ' +
  'Maps draw straight or bowed legs between stops; roads are not routed.';

interface OnJourney {
  journeyId: number;
}

/**
 * The assistant designs the whole photo book (journey-studio-wp13.md 6.1):
 * a draft composed on the server, revised page by page, applied as one
 * write, and taken back as one revision. The rights are the book's: the
 * owner and editors design and apply, a viewer is refused, an outsider is
 * told the journey is not there. The apply sends journey:book:saved once to
 * every member's tabs after the commit, the asking one included.
 *
 * Every field comes from the design contracts in @trek/shared.
 */
@McpController()
export class JourneyBookDesignMcp {
  constructor(
    private readonly designs: JourneyBookDesignService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'design_book',
    description: `Design the whole photo book of a journey as a draft: chapters, pacing, the pages, the photos picked for each, type and colours, with the engine's own check run on every page and repaired where it can. directives says what the person wants (style, density, page count, scope, chapters, photos, cover, type, palette, words, travel pages, what to keep) and the art direction: the brief (energy, decoration, collages, theme), the cover's archetype and lockup, and pages.overrides giving single pages of the plan another beat or layout. It answers the draft's design_id, the plan page by page (what each page becomes and its findings), the look, the photos left out and why, and the findings left. ${DRAFT_FLOW} ${LIMITS} Only the book's owner and editors can design it.`,
    inputSchema: { journeyId: idSchema, ...designBookArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async designBook({ journeyId, directives }: OnJourney & DesignBookRequest, ctx: McpContext) {
    return ok(await this.designs.design(journeyId, ctx.userId, directives));
  }

  @Tool({
    name: 'get_book_design',
    description: `A design draft of a journey's book again, as design_book answered it, with the pages chosen for the apply now (the person may take some out on the proposal card). ${DRAFT_FLOW}`,
    inputSchema: { journeyId: idSchema, ...getBookDesignArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async getBookDesign({ journeyId, designId }: OnJourney & GetBookDesignRequest, ctx: McpContext) {
    return ok(await this.designs.describeDraft(journeyId, ctx.userId, designId));
  }

  @Tool({
    name: 'revise_book_design',
    description: `Change one page of a design draft with the operations edit_book_page takes, all or nothing, checked like an edit of the book; nothing in the book changes. It answers the page as it is now in the draft and its findings. Look at the page again with describe_book_page or preview_book_page and the designId, and fix what is left before proposing. ${DRAFT_FLOW}`,
    inputSchema: { journeyId: idSchema, ...reviseBookDesignArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async reviseBookDesign({ journeyId, ...args }: OnJourney & ReviseBookDesignRequest, ctx: McpContext) {
    return ok(await this.designs.revise(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'apply_book_design',
    description: `Write a design draft into the journey's book in one change: the pages chosen for it (every page the plan changes unless the person took some out), each only if nobody changed that page since the design, new pages after the nearest page of the plan, and the page format of the draft. The book as it was is kept so the change can be taken back in one step. It answers the new version, the pages applied (the first ${BOOK_DESIGN_LIMITS.pages} summarized, with their findings) and the pages skipped and why. One design is one proposal: apply it rather than many edit_book_page calls. ${DRAFT_FLOW}`,
    inputSchema: { journeyId: idSchema, ...applyBookDesignArgs },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async applyBookDesign({ journeyId, ...args }: OnJourney & ApplyBookDesignRequest, ctx: McpContext) {
    return ok(await this.designs.apply(journeyId, ctx.userId, args));
  }

  @Tool({
    name: 'restore_book_revision',
    description:
      "Put a journey's book back as an applied design found it (the revision_id apply_book_design answered), only while the book is still at expectedVersion, so nothing saved since is overwritten. This takes back an applied design; it is not a way to edit the book.",
    inputSchema: { journeyId: idSchema, ...restoreBookRevisionArgs },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async restoreBookRevision({ journeyId, ...args }: OnJourney & RestoreBookRevisionRequest, ctx: McpContext) {
    return ok(await this.designs.restoreRevision(journeyId, ctx.userId, args));
  }
}
