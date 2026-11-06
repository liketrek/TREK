import { ADDON_IDS } from '../../addons';
import {
  McpController,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_WRITE,
  Tool,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyPhotoLinksService } from './journey-photo-links.service';
import {
  idSchema,
  journeyPhotoCaptionToolSchema,
  journeyPhotoLinkToolSchema,
  journeyPhotosMoveToolSchema,
  type JourneyPhotoCaptionTool,
  type JourneyPhotoLinkTool,
  type JourneyPhotosMoveTool,
} from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

/**
 * Which entries a journey's photos sit on, and their captions, over MCP: the
 * service the REST routes use (POST `entries/:entryId/link-photo`, DELETE
 * `entries/:entryId/photos/:journeyPhotoId`, POST
 * `entries/:entryId/photos/move`), the same edit right on the journey and the
 * same event to every open tab. Each answer names what a way back needs.
 */
@McpController()
export class JourneyPhotoLinksMcp {
  constructor(
    private readonly photoLinks: JourneyPhotoLinksService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'link_journey_photo',
    title: 'Link photo to entry',
    description:
      "Put a photo of the journey's gallery on one of its entries as well; it stays in the gallery and on any other entry. The photo ids are the ids of the gallery and entry photos get_journey answers.",
    inputSchema: journeyPhotoLinkToolSchema.shape,
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async linkJourneyPhoto({ entryId, journey_photo_id }: JourneyPhotoLinkTool, ctx: McpContext) {
    const photo = await this.photoLinks.link(entryId, journey_photo_id, ctx.userId);
    if (!photo) return errorResult('Entry or photo not found, or access denied.');
    return ok({ photo, entryId });
  }

  @Tool({
    name: 'unlink_journey_photo',
    title: 'Unlink photo from entry',
    description:
      'Take a photo off one journal entry. It stays in the journey gallery and on any other entry; nothing is deleted.',
    inputSchema: journeyPhotoLinkToolSchema.shape,
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async unlinkJourneyPhoto({ entryId, journey_photo_id }: JourneyPhotoLinkTool, ctx: McpContext) {
    if (!(await this.photoLinks.unlink(entryId, journey_photo_id, ctx.userId))) {
      return errorResult('The photo is not on this entry, or access denied.');
    }
    return ok({ success: true, entryId, journey_photo_id });
  }

  @Tool({
    name: 'move_journey_photos',
    title: 'Move photos between entries',
    description:
      'Move photos of one journal entry to another entry of the same journey, in one change: each is put on the other entry and taken off the first, unless keep_in_source keeps it there too. A suggestion the photos land on becomes a written entry. The photos stay in the gallery.',
    inputSchema: journeyPhotosMoveToolSchema.shape,
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async moveJourneyPhotos({ fromEntryId, ...move }: JourneyPhotosMoveTool, ctx: McpContext) {
    return ok(await this.photoLinks.move(fromEntryId, move, ctx.userId));
  }

  @Tool({
    name: 'set_journey_photo_caption',
    title: 'Set journey photo caption',
    description:
      'Set the caption of one photo of the journey gallery, shown wherever the photo appears; null clears it. Answers with the photo and, under previous, the caption it had.',
    inputSchema: { journeyId: idSchema, ...journeyPhotoCaptionToolSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'write' },
  })
  async setJourneyPhotoCaption(
    { journeyId, journey_photo_id, caption }: JourneyPhotoCaptionTool & { journeyId: number },
    ctx: McpContext,
  ) {
    const updated = await this.photoLinks.setCaption(journeyId, journey_photo_id, caption, ctx.userId);
    if (!updated) return errorResult('Photo not found in this journey, or access denied.');
    return ok(updated);
  }
}
