import { Injectable } from '@nestjs/common';
import exifr from 'exifr';
import { PhotoResolverService } from './photo-resolver.service';
import { StorageService } from '../storage/storage.service';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
import { exifCaptureInstant } from './memories.helpers';

/**
 * What readCapture asks exifr for.
 *
 * `latitude` and `longitude` are not tags. exifr works them out from the four
 * GPS tags below, and only when it has read those. A pick of just the two
 * derived names reads no GPS at all, which is how every upload used to lose
 * its location (#2512).
 */
const CAPTURE_TAGS = [
  'DateTimeOriginal',
  'CreateDate',
  'OffsetTimeOriginal',
  'OffsetTimeDigitized',
  'OffsetTime',
  'GPSLatitude',
  'GPSLatitudeRef',
  'GPSLongitude',
  'GPSLongitudeRef',
] as const;

/** When and where an uploaded file says it was taken. */
type LocalCapture = { takenAt: string | null; lat: number | null; lng: number | null };

type Exif = Partial<Record<(typeof CAPTURE_TAGS)[number] | 'latitude' | 'longitude', unknown>>;

function coordinate(value: unknown, limit: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

/**
 * The capture time and place in a file's EXIF, or null when it names neither.
 * Throws for a file exifr cannot read at all.
 */
async function readCapture(abs: string): Promise<LocalCapture | null> {
  // Raw values on purpose: see exifCaptureInstant for why the stamps are not
  // left to exifr's reviver.
  const parsed = (await exifr.parse(abs, { pick: [...CAPTURE_TAGS], reviveValues: false })) as Exif | undefined;
  if (!parsed) return null;

  // Each stamp has an offset tag of its own. The others stand in for a missing
  // one: a camera writes all three from the same clock.
  const { OffsetTimeOriginal: original, OffsetTimeDigitized: digitized, OffsetTime: modified } = parsed;
  const takenAt = exifCaptureInstant(parsed.DateTimeOriginal, [original, digitized, modified])
    ?? exifCaptureInstant(parsed.CreateDate, [digitized, original, modified]);
  const lat = coordinate(parsed.latitude, 90);
  const lng = coordinate(parsed.longitude, 180);
  // A receiver without a fix can write zeros into the GPS tags instead of
  // leaving them out. Taken at its word, 0,0 pins the photo to open sea in the
  // Gulf of Guinea on the journey map, so it counts as no location.
  const hasPair = lat != null && lng != null && !(lat === 0 && lng === 0);
  return takenAt || hasPair ? { takenAt, lat: hasPair ? lat : null, lng: hasPair ? lng : null } : null;
}

/**
 * Provider lookups one user keeps in flight at once, across every run of theirs.
 *
 * Per user rather than per run: the picker sends a large import in batches of
 * 500, every batch starts its own detached run, and a per-run cap let those runs
 * add up to several times this against the same NAS. Per user rather than for
 * the whole server: each lookup goes to the importer's own Immich or Synology,
 * so a NAS that has stopped answering must not hold up the capture times of
 * everybody else on the instance. The service is a singleton of MemoriesModule,
 * so a user's imports queue for the same slots whichever surface sent them.
 */
const BACKFILL_CONCURRENCY = 4;

/** One user's lookup slots: how many are open, and who waits for the next. */
interface LookupSlots {
  active: number;
  /** First come first served. */
  waiting: Array<() => void>;
}

/**
 * Ask the provider when and where a photo was taken, and record it (#1614).
 *
 * The picker already sees these values, but the add call carries only the asset
 * id — widening that contract would have meant trusting the client for something
 * the provider can be asked for directly, and would have left the MCP path, the
 * album sync and every already-imported photo without them.
 *
 * Runs detached and never throws: a provider that is slow, unreachable or simply
 * does not know must not fail the add the user is waiting on. A photo without
 * capture metadata is the normal case, not an error — it just will not appear on
 * the map.
 */
@Injectable()
export class PhotoCaptureBackfillService {
  /**
   * Open lookups per user, never above BACKFILL_CONCURRENCY for any of them. An
   * entry lives only while its user has a lookup open or waiting, so the map
   * does not grow with every user who ever imported a photo.
   */
  private readonly slots = new Map<number, LookupSlots>();

  constructor(
    private readonly resolver: PhotoResolverService,
    private readonly photos: TrekPhotosRepository,
    private readonly storage: StorageService,
  ) {}

  /** Fire-and-forget for a batch that was just added. */
  schedule(trekPhotoIds: number[], userId: number): void {
    if (!trekPhotoIds.length) return;
    void this.run(trekPhotoIds, userId);
  }

  /**
   * Awaitable form: resolves once every photo of the batch has been tried, with
   * whether any of them learned something. The journey refresh hangs off that
   * answer (#1587).
   *
   * A few photos at a time rather than one after the other: every provider call
   * can take seconds, and a strictly sequential walk kept a large import out of
   * order for minutes. The cap is shared by every run of the same user, so a
   * thousand-photo import, however many batches it arrives in, never has more
   * than BACKFILL_CONCURRENCY lookups open against that user's NAS.
   */
  async run(trekPhotoIds: number[], userId: number): Promise<boolean> {
    let next = 0;
    let changed = false;
    const worker = async (): Promise<void> => {
      while (next < trekPhotoIds.length) {
        const id = trekPhotoIds[next++];
        if (await this.fillOne(id, userId)) changed = true;
      }
    };
    const workers = Math.min(BACKFILL_CONCURRENCY, trekPhotoIds.length);
    await Promise.all(Array.from({ length: workers }, worker));
    return changed;
  }

  /**
   * One provider lookup inside the user's cap. The slot is given back whatever
   * the lookup does: a slot lost to a throw would stay lost, and four of them
   * would stall every later import of that user for good.
   */
  private async withLookupSlot<T>(userId: number, lookup: () => Promise<T>): Promise<T> {
    const slots = await this.acquireSlot(userId);
    try {
      return await lookup();
    } finally {
      this.releaseSlot(userId, slots);
    }
  }

  /** Wait for one of the user's lookup slots, and answer the entry it came from. */
  private async acquireSlot(userId: number): Promise<LookupSlots> {
    let slots = this.slots.get(userId);
    if (!slots) {
      slots = { active: 0, waiting: [] };
      this.slots.set(userId, slots);
    }
    if (slots.active < BACKFILL_CONCURRENCY) {
      slots.active++;
      return slots;
    }
    // releaseSlot hands its slot straight to the first waiter, so the count
    // stays where it is and nobody can slip in between.
    const { waiting } = slots;
    await new Promise<void>(resolve => {
      waiting.push(resolve);
    });
    return slots;
  }

  /** Give a slot back: to the user's longest waiter, or, once nobody holds one, drop the entry. */
  private releaseSlot(userId: number, slots: LookupSlots): void {
    const next = slots.waiting.shift();
    if (next) {
      next();
      return;
    }
    slots.active--;
    if (slots.active === 0) this.slots.delete(userId);
  }

  /** One photo; answers whether its row changed. */
  private async fillOne(id: number, userId: number): Promise<boolean> {
    try {
      const photo = this.photos.resolve(id);
      // A row that already knows both has nothing to gain, and a provider call
      // per photo is the expensive part of an album import.
      if (!photo || (photo.taken_at && photo.lat != null && photo.lng != null)) return false;

      // A local file has no provider to ask: the answer is in its own EXIF, and
      // getPhotoInfo would only hand back what the DB row already says. Nor does
      // it take a lookup slot, which exists to spare a NAS: a device upload must
      // not wait behind the same user's provider import.
      if (photo.provider === 'local') {
        const meta = await this.readLocalExif(photo.file_path);
        return meta ? this.photos.recordCaptureMetadata(id, meta) : false;
      }

      const info = await this.withLookupSlot(userId, () => this.resolver.getPhotoInfo(userId, id));
      if (!info.success) return false;

      return this.photos.recordCaptureMetadata(id, {
        takenAt: info.data.takenAt ?? null,
        lat: info.data.lat ?? null,
        lng: info.data.lng ?? null,
      });
    } catch (err) {
      console.error(`[Photos] capture backfill failed for ${id}:`, err instanceof Error ? err.message : err);
      return false;
    }
  }

  /**
   * EXIF of an uploaded file.
   *
   * Note for anyone chasing "my phone photo has no location": the client converts
   * HEIC before upload and that conversion drops GPS, so an iPhone photo arrives
   * here already stripped. Nothing to read is the expected outcome far more often
   * than not — hence no logging on the empty case.
   */
  private async readLocalExif(filePath?: string | null): Promise<LocalCapture | null> {
    if (!filePath) return null;
    // photos.file_path is uploads-relative 'journey/<name>' by every writer;
    // anything else reads as a miss (same rule as photo-resolver). Central key
    // validation (storage-keys.ts) rejects a name that still carries a path,
    // so a stored path can never climb out of the journey category.
    if (!filePath.startsWith('journey/')) return null;
    const name = filePath.slice('journey/'.length);

    try {
      return await this.storage.withLocalFile('journey', name, readCapture);
    } catch {
      // A vanished object, an invalid key, not an image, a truncated upload,
      // a video — none of it is an error here.
      return null;
    }
  }
}
