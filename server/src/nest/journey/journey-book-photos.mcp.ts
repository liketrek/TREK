import { ADDON_IDS } from '../../addons';
import { McpController, TOOL_ANNOTATIONS_READONLY, Tool, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyBookPhotosService } from './journey-book-photos.service';
import { idSchema, PHOTO_PICK, suggestBookPhotosArgs, type SuggestBookPhotosRequest } from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

/**
 * Photos for a TREK Studio book, picked over MCP from the journey's gallery
 * (JourneyBookPhotosService). Read only: any member may ask, as anyone who
 * sees the gallery may. Every field comes from @trek/shared.
 */
@McpController()
export class JourneyBookPhotosMcp {
  constructor(
    private readonly photos: JourneyBookPhotosService,
    // Read by the addon gate.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'suggest_book_photos',
    description:
      `Photos of a journey's gallery for a page of its book or for the cover, without looking at them: grouped by day ` +
      `(the linked entry's date, else when the photo was taken) and by place (${PHOTO_PICK.placeRadiusM} m around, ` +
      `named after the nearest entry), best first. Each pick says why (sharpest of several similar, landscape, not in ` +
      `the book yet, has a caption); dropped names what was left out and why: near_duplicate_of another photo (a burst ` +
      `or a near-identical picture), possibly_blurry, or low_resolution for print, and dropped_more counts those it ` +
      `has no room to name. Say what you left out. entryId or ` +
      `date narrows it to one entry or day, purpose cover prefers wide photos with more pixels, limit caps the picks ` +
      `(${PHOTO_PICK.defaultLimit} unless told, at most ${PHOTO_PICK.maxLimit}), shared over the groups. Sharpness and ` +
      `likeness are measured once per photo; signals_pending counts photos judged on their date, place and size alone ` +
      `because they are still being measured, and asking again later knows more. It cannot judge beauty, faces, closed ` +
      `eyes, who or what is in a photo, or the same scene from another angle.`,
    inputSchema: { journeyId: idSchema, ...suggestBookPhotosArgs },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async suggestBookPhotos({ journeyId, ...args }: { journeyId: number } & SuggestBookPhotosRequest, ctx: McpContext) {
    return ok(await this.photos.suggest(journeyId, ctx.userId, args));
  }
}
