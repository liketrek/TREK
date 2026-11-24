import { ADDON_IDS } from '../../addons';
import { AssistantAttachments } from '../../db/entities/AssistantAttachments.entity';
import type { AssistantAttachmentsRepository } from '../../db/repositories/AssistantAttachments.repository';
import { addonOffMessage } from '../addons/addons.constants';
import { AddonsService } from '../addons/addons.service';
import { logError } from '../audit/audit-log.logger';
import { DemoService } from '../common/demo.service';
import { UnitOfWork } from '../database/unit-of-work';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { isUploadTypeAllowed } from '../files/files.constants';
import { FilesService } from '../files/files.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { StorageService } from '../storage/storage.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { NO_SUCH_ATTACHMENT } from './assistant-attachment-tools';
import { MAX_ATTACHMENT_BYTES } from './assistant-tools.constants';
import type { ToolRun } from './assistant-tools.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { assistantKeepFileArgsSchema, type AssistantKeepFileArgs } from '@trek/shared';

const BROKEN = 'This change can no longer be read.';
const NOT_ALLOWED = 'You are not allowed to keep files on this trip.';
const NOT_ALLOWED_LINK = 'You are not allowed to attach files to bookings, expenses or places on this trip.';
const TYPE_NOT_ALLOWED = 'This file type is not allowed on this TREK instance.';
const GONE = 'The attached file is no longer kept, so it cannot be put into Files.';
const NOT_KEPT = 'The file could not be kept.';

/** Where a keep runs: the user, and the thread and trip of the conversation. */
interface KeepAt {
  userId: number;
  threadId: number;
  tripId: number;
}

/** What the receipt of a kept file names: the trip file and what it is attached to. */
interface KeptFile {
  id: number;
  name: string;
  reservation_id: number | null;
  place_id: number | null;
  budget_item_id: number | null;
}

/** The links a keep asks for, as FilesService takes them. */
function linksOf(args: AssistantKeepFileArgs) {
  return {
    reservation_id: args.reservation_id ?? null,
    place_id: args.place_id ?? null,
    budget_item_id: args.budget_item_id ?? null,
  };
}

/**
 * keep_attached_file, applied: a file attached in the chat becomes a trip
 * file, with the checks the Files upload runs (the demo block, the trip, the
 * `file_upload` right and `file_edit` for a link, the instance's file types,
 * every linked id on the same trip) taken when the user applies the change.
 * The bytes are copied from the attachment to a trip file's own key; the
 * trip file's row, its link to an expense and the attachment's pointer to it
 * are written in one transaction, and the members' planners hear of the new
 * file after it. Keeping the same attachment twice answers the file kept the
 * first time.
 */
@Injectable()
export class AssistantKeepFileService {
  constructor(
    @InjectRepository(AssistantAttachments) private readonly rows: AssistantAttachmentsRepository,
    private readonly storage: StorageService,
    private readonly files: FilesService,
    private readonly allowedTypes: AllowedFileTypesService,
    private readonly guards: McpToolGuardsService,
    private readonly demo: DemoService,
    private readonly trips: TripAccessService,
    private readonly uow: UnitOfWork,
    private readonly addons: AddonsService,
  ) {}

  /**
   * Keeps the attachment the stored arguments name; the answer is shaped like
   * a tool's: the trip file, or why it was not kept.
   *
   * @txIndependent the bytes are copied in storage before the one transaction
   * that records them, and dropped again if it fails.
   */
  async keep(at: KeepAt, args: Record<string, unknown>): Promise<ToolRun> {
    const parsed = assistantKeepFileArgsSchema.safeParse(args);
    if (!parsed.success) return { ok: false, value: BROKEN };
    const refused = await this.refusalOf(at, parsed.data);
    if (refused) return { ok: false, value: refused };
    const row = await this.rows.findInThread(parsed.data.attachmentId, at.threadId, at.userId);
    if (!row || row.trip_id !== at.tripId) return { ok: false, value: NO_SUCH_ATTACHMENT };
    const already = row.file_id === null ? undefined : await this.files.getFileById(row.file_id, at.tripId);
    if (already && !already.deleted_at) return { ok: true, value: { file: keptOf(already) } };
    if (!isUploadTypeAllowed(row.name, row.mime, await this.allowedTypes.get())) {
      return { ok: false, value: TYPE_NOT_ALLOWED };
    }
    const links = linksOf(parsed.data);
    const foreign = await this.files.findForeignLinkTarget(at.tripId, links);
    if (foreign) return { ok: false, value: `Linked item does not belong to this trip (${foreign}).` };
    const bytes = await this.bytesOf(row.storage_key);
    if (!bytes) return { ok: false, value: GONE };
    const upload = { originalname: row.name, mimetype: row.mime, bytes };
    const filename = await this.files.storeBytes(upload);
    let created: Awaited<ReturnType<FilesService['createFile']>>;
    try {
      created = await this.uow.transactional(async () => {
        const file = await this.files.createFile(
          at.tripId,
          { filename, originalname: row.name, size: bytes.length, mimetype: row.mime },
          at.userId,
          { ...links, description: parsed.data.description ?? null },
        );
        await this.rows.setFile(row.id, file.id);
        return file;
      });
    } catch (err) {
      logError(`[assistant] keeping attachment ${row.id} failed: ${err instanceof Error ? err.message : String(err)}`);
      await this.files.discardBytes(filename).catch((dropErr: unknown) => {
        logError(`[assistant] dropping ${filename} failed: ${String(dropErr)}`);
      });
      return { ok: false, value: NOT_KEPT };
    }
    // No socket to spare from the echo: the user's own planner learns of the file like every other member's.
    this.files.broadcast(String(at.tripId), 'file:created', { file: created }, undefined);
    return { ok: true, value: { file: keptOf({ ...created, ...links }) } };
  }

  /**
   * Whether files may go into the trip's Files at all: the trip's Documents
   * addon, which follows the instance unless the trip's owner chose for it.
   */
  keepsOn(tripId: number): Promise<boolean> {
    return this.addons.isEnabledForTrip(tripId, ADDON_IDS.DOCUMENTS);
  }

  /**
   * Why the user may not keep this file here, or null: the demo, the trip, the
   * trip's Documents addon (answered as the Files routes answer it), the Files rights.
   */
  private async refusalOf(at: KeepAt, args: AssistantKeepFileArgs): Promise<string | null> {
    if (await this.demo.isDemoUserId(at.userId)) return NOT_ALLOWED;
    if (!(await this.trips.findAccessible(at.tripId, at.userId))) return NOT_ALLOWED;
    if (!(await this.keepsOn(at.tripId))) return addonOffMessage(ADDON_IDS.DOCUMENTS);
    if (!(await this.guards.hasTripPermission('file_upload', at.tripId, at.userId))) return NOT_ALLOWED;
    const linking = args.reservation_id ?? args.budget_item_id ?? args.place_id;
    if (linking && !(await this.guards.hasTripPermission('file_edit', at.tripId, at.userId))) {
      return NOT_ALLOWED_LINK;
    }
    return null;
  }

  /** The attachment's bytes, at most what an attachment may hold; null when they are gone. */
  private async bytesOf(key: string): Promise<Buffer | null> {
    try {
      const { stream } = await this.storage.getStream('files', key);
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of stream) {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
        total += part.length;
        if (total > MAX_ATTACHMENT_BYTES) {
          stream.destroy();
          return null;
        }
        chunks.push(part);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      logError(`[assistant] reading attached file ${key} failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}

/** A trip file as the receipt names it. */
function keptOf(file: {
  id: number;
  original_name: string;
  reservation_id?: number | string | null;
  place_id?: number | string | null;
  budget_item_id?: number | string | null;
}): KeptFile {
  const idOf = (value: number | string | null | undefined) => (value == null ? null : Number(value));
  return {
    id: file.id,
    name: file.original_name,
    reservation_id: idOf(file.reservation_id),
    place_id: idOf(file.place_id),
    budget_item_id: idOf(file.budget_item_id),
  };
}
