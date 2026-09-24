import pathMod from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { journalPluginPhotoInputSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { ADDON_IDS } from '../../addons';
import { readEnv } from '../../app-config';
import { isDemoEmail } from '../common/demo';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { PhotoCaptureBackfillService } from '../memories/photo-capture-backfill.service';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { JourneyDomainService } from './journey-domain.service';

/** 10MB decoded, the same cap the file surface applies to plugin uploads. */
const PHOTO_CONTENT_MAX = 10 * 1024 * 1024;

/**
 * Images only, and no SVG: the REST filter refuses it because an SVG is a
 * document that executes, and a gallery renders what it is given.
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic', '.heif'];

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.heic': 'image/heic', '.heif': 'image/heif',
};

/**
 * The journal surface a plugin may reach (#plugins).
 *
 * Journeys are user-scoped, not trip-scoped, so there is no tripId to check. The
 * access decision belongs to JourneyDomainService, which self-gates every call
 * against the acting user (owner or contributor) and answers with null rather than
 * throwing; each handler turns that null into RESOURCE_FORBIDDEN.
 */
@PluginController()
export class JournalRpc {
  constructor(
    private readonly journey: JourneyDomainService,
    private readonly guards: PluginGuards,
    private readonly storage: StorageService,
    private readonly allowedTypes: AllowedFileTypesService,
    private readonly captureBackfill: PhotoCaptureBackfillService,
    private readonly db: DatabaseService,
  ) {}

  @PluginMethod('journal.listMine', { permission: 'db:read:journal' })
  listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'reads');
    this.requireJourneyAddon();
    return this.journey.listJourneys(userId);
  }

  @PluginMethod('journal.getEntries', { permission: 'db:read:journal' })
  getEntries(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'reads');
    const journeyId = num(params.journeyId, 'journeyId');
    this.requireJourneyAddon();
    // listEntries self-gates via canAccessJourney and returns null when the user
    // cannot see it.
    const entries = this.journey.listEntries(journeyId, userId);
    if (entries === null) throw new ForbiddenResource(`no access to journey ${journeyId}`);
    return entries;
  }

  @PluginMethod('journal.createEntry', { permission: 'db:write:journal' })
  createEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const input = asPayload(params.input);
    if (typeof input.entry_date !== 'string' || input.entry_date === '') throw new BadParams('entry_date is required');
    const journeyId = num(params.journeyId, 'journeyId');
    this.requireJourneyAddon();
    const entry = this.journey.createEntry(journeyId, userId, input as never);
    if (!entry) throw new ForbiddenResource(`no editable journey ${journeyId} for this user`);
    return entry;
  }

  @PluginMethod('journal.updateEntry', { permission: 'db:write:journal' })
  updateEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const entryId = num(params.entryId, 'entryId');
    this.requireJourneyAddon();
    const entry = this.journey.updateEntry(entryId, userId, asPayload(params.input) as never);
    if (!entry) throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
    return entry;
  }

  @PluginMethod('journal.deleteEntry', { permission: 'db:write:journal' })
  deleteEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const entryId = num(params.entryId, 'entryId');
    this.requireJourneyAddon();
    if (!this.journey.deleteEntry(entryId, userId)) {
      throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
    }
    return { deleted: true };
  }

  @PluginMethod('journal.createJourney', { permission: 'db:write:journal' })
  createJourney(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const input = asPayload(params.input);
    this.requireJourneyAddon();
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) throw new BadParams('journal title is required');
    return this.journey.createJourney(userId, {
      title,
      subtitle: input.subtitle as string | undefined,
      trip_ids: input.trip_ids as number[] | undefined,
    });
  }

  /**
   * Attach a photo to an entry, bytes and all (#1365).
   *
   * A journal importer can create the entry and write its story over the methods
   * above, but there was no way to give it a picture: uploading the bytes as a
   * trip file produces a file on a TRIP, and a journey photo lives in the
   * journey's own gallery. This is the missing half.
   *
   * Deliberately byte-based rather than a link to an existing photo: an importer
   * reading an export archive holds bytes and nothing else. It has no gallery
   * photo to point at, and provider photos (Immich, Synology) need an asset that
   * only exists once somebody has already uploaded it there.
   *
   * The access decision stays where it is: addPhoto answers null unless the
   * acting user may edit the journey the entry belongs to.
   */
  @PluginMethod('journal.addEntryPhoto', { permission: 'db:write:journal' })
  async addEntryPhoto(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const userId = this.requireJournalUser(ctx, 'writes');
    const entryId = num(params.entryId, 'entryId');
    // num() accepts "3" and 1.5; a row id is neither.
    if (!Number.isInteger(entryId) || entryId <= 0) throw new BadParams('entryId must be a positive integer');
    this.requireJourneyAddon();

    const parsed = journalPluginPhotoInputSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid photo input: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
    const input = parsed.data;

    // Mirrors the REST upload guard: a demo user must not write bytes to the
    // shared demo instance, not even through a plugin's db:write:journal.
    if (readEnv().demo.enabled) {
      const uploader = this.db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email?: string } | undefined;
      if (isDemoEmail(uploader?.email)) throw new ForbiddenResource('Uploads are disabled in demo mode.');
    }

    // basename first: a name is a name, never a path.
    const original = pathMod.basename(input.name);
    const ext = pathMod.extname(original).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) {
      throw new BadParams(`photo extension '${ext || '(none)'}' is not an allowed image type`);
    }
    // The operator's allow-list gates this path too, or the RPC would be the way
    // around an admin setting that the REST upload obeys (journeyImageFileFilter).
    const allowed = this.allowedTypes.get().split(',').map((e) => e.trim().toLowerCase());
    if (!allowed.includes('*') && !allowed.includes(ext.slice(1))) {
      throw new BadParams(`file type ${ext} is not allowed`);
    }

    const buf = Buffer.from(input.content_base64, 'base64');
    if (buf.length === 0) throw new BadParams('photo content is empty');
    if (buf.length > PHOTO_CONTENT_MAX) throw new BadParams('photo exceeds the 10MB plugin upload cap');

    // The stored name is ours, never the plugin's: the gallery dedupes on
    // file_path, so a chosen path could collide with somebody else's row.
    const filename = `${randomUUID()}${ext}`;
    // Same order as the REST upload: the object is committed before any row
    // points at it, so a failure here orphans a blob rather than leaving a
    // gallery entry aimed at bytes that never arrived.
    await this.storage.put('journey', filename, Readable.from(buf), { contentType: MIME_BY_EXT[ext] ?? 'image/jpeg' });

    const photo = this.journey.addPhoto(entryId, userId, `journey/${filename}`, undefined, input.caption);
    if (!photo) {
      // Nothing references the object now, and nothing ever would.
      await this.storage.delete('journey', filename).catch(() => {});
      throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
    }
    // Best-effort, exactly as the REST route does it: reads EXIF so the photo
    // carries its capture date.
    this.captureBackfill.schedule([photo.photo_id].filter((id): id is number => typeof id === 'number'), userId);
    return photo;
  }

  @PluginMethod('journal.deleteJourney', { permission: 'db:write:journal' })
  deleteJourney(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const journeyId = num(params.journeyId, 'journeyId');
    this.requireJourneyAddon();
    if (!this.journey.deleteJourney(journeyId, userId)) {
      throw new ForbiddenResource(`no deletable journal ${journeyId} for this user`);
    }
    return { deleted: true };
  }

  private requireJournalUser(ctx: PluginRpcContext, kind: 'reads' | 'writes'): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource(`journal ${kind} require an authenticated user context`);
    }
    return ctx.actingUserId;
  }

  private requireJourneyAddon(): void {
    this.guards.requireAddon(ADDON_IDS.JOURNEY, 'journey');
  }
}
