import { TrekPhotoSignals } from '../../db/entities/TrekPhotoSignals.entity';
import { TREK_PHOTO_SIGNAL_PALETTE } from '../../db/json-columns';
import type {
  GalleryPhotoFacts,
  TrekPhotoSignalRow,
  TrekPhotoSignalsRepository,
} from '../../db/repositories/TrekPhotoSignals.repository';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { logWarn } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { PhotoResolverService, type PhotoSignalSource } from '../memories/photo-resolver.service';
import {
  PHOTO_SIGNALS_ALGO,
  PHOTO_SIGNALS_RUNNER,
  type PhotoPixels,
  type PhotoSignalsRunner,
} from './photo-signals-runner';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { BookPhotoInfo, PhotoPickSignals } from '@trek/shared';

/** How long a caller waits for photos still being measured before it answers on what the rows know. */
const SIGNALS_WAIT_MS = 8000;
/** Photos in line or being measured at most; more are left for a later call. */
export const MAX_QUEUED_PHOTOS = 500;
/** Photos fetched at the same time (a provider is asked with its owner's credentials, so gently). */
export const PARALLEL_FETCHES = 2;
/** A local original larger than this is not read for its signals. */
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;

/** What the book engine reads of a photo's measurement: the original's size, brightness, colours and calm areas. */
type BookPhotoSignals = Pick<BookPhotoInfo, 'width' | 'height' | 'luma' | 'palette' | 'busy' | 'salient'>;

/** Errors of the runner that say nothing about the photo: it is measured again on a later call. */
const TRANSIENT = new Set(['busy', 'closed', 'unavailable']);

/**
 * What a photo's pixels say (a perceptual hash, sharpness, brightness, clipping,
 * the original's size), measured once per photo and kept in
 * `trek_photo_signals`, for picking photos for a book without a model looking
 * at them (`suggest_book_photos`).
 *
 * Measuring is CPU work on a decoded image, so it runs in a worker thread
 * (`PHOTO_SIGNALS_RUNNER`, one photo at a time) and never on the event loop;
 * reading the bytes is I/O, at most `PARALLEL_FETCHES` at once. A photo is in
 * line once however often it is asked for, the line is bounded, and a caller
 * waits at most `SIGNALS_WAIT_MS` before it answers with what is ready; the
 * rest keep being measured in the background, each in a request context of
 * its own. A photo that cannot be measured gets a row of nulls, which is an
 * answer too; one whose provider did not answer, or whose thread could not
 * start, gets none and is tried again on the next call, and so does one that
 * timed out once (the host may have been busy), not twice.
 */
@Injectable()
export class PhotoSignalsService implements OnModuleDestroy {
  private readonly waiting: number[] = [];
  /** Every photo in line or being measured, with what its callers wait on. */
  private readonly inLine = new Map<number, { done: Promise<void>; finish: () => void }>();
  private active = 0;
  private closed = false;
  /** Photos that timed out once; a second timeout stores them as unmeasurable. */
  private readonly timedOut = new Set<number>();
  private warnedUnavailable = false;

  constructor(
    @InjectRepository(TrekPhotoSignals) private readonly signalsRepo: TrekPhotoSignalsRepository,
    private readonly resolver: PhotoResolverService,
    @Inject(PHOTO_SIGNALS_RUNNER) private readonly runner: PhotoSignalsRunner,
    private readonly orm: MikroORM,
  ) {}

  async onModuleDestroy(): Promise<void> {
    this.closed = true;
    this.waiting.length = 0;
    await this.runner.close();
  }

  /**
   * The photos of a journey's gallery, videos left out, without their signals
   * (`signalsFor`). The caller has checked that the user may see the journey.
   */
  async galleryFacts(journeyId: number): Promise<GalleryPhotoFacts[]> {
    return (await this.signalsRepo.listGalleryFacts(journeyId)).filter((f) => f.media_type !== 'video');
  }

  /**
   * The signals of these photos: the stored ones at once, the missing ones
   * after they are measured or `waitMs` has passed, whichever comes first.
   * `pending` counts the photos still without signals. The photos in `later`
   * answer what is stored for them too, and the missing ones join the line
   * behind the others, neither waited for nor counted: a caller asking about a
   * few photos of a large gallery gets those measured first.
   *
   * @txIndependent each photo is measured off the event loop and stored on its own; one photo's row is complete alone.
   */
  async signalsFor(
    photoIds: readonly number[],
    { waitMs = SIGNALS_WAIT_MS, later = [] }: { waitMs?: number; later?: readonly number[] } = {},
  ): Promise<{ byPhoto: Map<number, PhotoPickSignals>; pending: number }> {
    const ids = [...new Set(photoIds)];
    const wanted = new Set(ids);
    const rest = [...new Set(later)].filter((id) => !wanted.has(id));
    const byPhoto = await this.stored([...ids, ...rest]);
    const missing = ids.filter((id) => !byPhoto.has(id));
    const jobs = missing.map((id) => this.enqueue(id)).filter((job): job is Promise<void> => job !== null);
    for (const id of rest) if (!byPhoto.has(id)) void this.enqueue(id);
    if (missing.length > 0) {
      if (jobs.length > 0 && waitMs > 0) await waitAtMost(Promise.all(jobs), waitMs);
      for (const [id, signals] of await this.stored(missing)) byPhoto.set(id, signals);
    }
    return { byPhoto, pending: ids.filter((id) => !byPhoto.has(id)).length };
  }

  /**
   * What the book engine reads of these photos, from whatever measurement is
   * stored, none measured or waited for: the original's size for the print
   * check, and from the current measurement the colours, the busy grid and
   * the salient point. A photo without a row is left out.
   */
  async bookSignals(photoIds: readonly number[]): Promise<Map<number, BookPhotoSignals>> {
    const ids = [...new Set(photoIds)];
    if (ids.length === 0) return new Map();
    const rows = await this.signalsRepo.listForPhotos(ids);
    return new Map(rows.map((row) => [row.photo_id, toBookSignals(row)]));
  }

  /** The signals stored for these photos by the current measurement; older ones count as missing. */
  private async stored(ids: number[]): Promise<Map<number, PhotoPickSignals>> {
    if (ids.length === 0) return new Map();
    const rows = await this.signalsRepo.listForPhotos(ids);
    return new Map(rows.filter((r) => r.algo === PHOTO_SIGNALS_ALGO).map((r) => [r.photo_id, toSignals(r)]));
  }

  /** Puts a photo in line once; null when the line is full or closed, so the photo stays pending. */
  private enqueue(photoId: number): Promise<void> | null {
    const known = this.inLine.get(photoId);
    if (known) return known.done;
    if (this.closed || this.inLine.size >= MAX_QUEUED_PHOTOS) return null;
    let finish: () => void = () => undefined;
    const done = new Promise<void>((resolve) => {
      finish = resolve;
    });
    this.inLine.set(photoId, { done, finish });
    this.waiting.push(photoId);
    this.pump();
    return done;
  }

  /**
   * Starts measuring the next photos in line, a few at a time.
   *
   * @txIndependent one measurement per photo, each stored by itself after a worker answered.
   */
  private pump(): void {
    while (this.active < PARALLEL_FETCHES) {
      const photoId = this.waiting.shift();
      if (photoId === undefined) return;
      this.active++;
      void withRequestContext(this.orm, () => this.measureOne(photoId))
        .catch((err: unknown) => {
          logWarn(`[photo-signals] photo ${photoId} not measured: ${err instanceof Error ? err.message : String(err)}`);
        })
        .finally(() => {
          this.active--;
          this.inLine.get(photoId)?.finish();
          this.inLine.delete(photoId);
          this.pump();
        });
    }
  }

  /** Reads one photo, has it measured and stores what came out; a provider that did not answer stores nothing. */
  private async measureOne(photoId: number): Promise<void> {
    const source = await this.resolver.readForSignals(photoId, MAX_ORIGINAL_BYTES);
    if (source.kind === 'unavailable') return;
    let pixels: PhotoPixels | null = null;
    if (source.kind !== 'none') {
      try {
        pixels = await this.runner.measure(source.bytes);
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : String(err);
        if (TRANSIENT.has(reason)) {
          this.warnOnceUnavailable(reason, err);
          return;
        }
        // The first timeout may be the host's load rather than the photo, so it is left for a later call.
        if (reason === 'timeout' && !this.timedOut.has(photoId)) {
          this.timedOut.add(photoId);
          return;
        }
        // A second timeout, or a thread that died over this photo: measured as nothing, so it is not tried forever.
      }
    }
    this.timedOut.delete(photoId);
    await this.signalsRepo.saveSignals({
      photo_id: photoId,
      algo: PHOTO_SIGNALS_ALGO,
      phash: pixels?.phash ?? null,
      sharpness: pixels?.sharpness ?? null,
      luma: pixels?.luma ?? null,
      clipped: pixels?.clipped ?? null,
      ...originalSize(source, pixels),
      palette: pixels?.palette ? encodeJson(TREK_PHOTO_SIGNAL_PALETTE, pixels.palette) : null,
      busy: pixels?.busy ?? null,
      sal_x: pixels?.salX ?? null,
      sal_y: pixels?.salY ?? null,
    });
  }

  /** A thread that cannot start fails every photo alike; the log says so once, not once per photo. */
  private warnOnceUnavailable(reason: string, err: unknown): void {
    if (reason !== 'unavailable' || this.warnedUnavailable) return;
    this.warnedUnavailable = true;
    const cause = err instanceof Error && err.cause instanceof Error ? `: ${err.cause.message}` : '';
    logWarn(`[photo-signals] the measuring thread is unavailable${cause}; photos stay pending`);
  }
}

/**
 * The original's size: what the decoded original measured, or what the
 * provider says of it. A provider may report the sensor's sides, before the
 * camera's rotation; the thumbnail is drawn upright, so when the two disagree
 * on which side is the long one, the provider's sides are turned to match.
 */
function originalSize(source: PhotoSignalSource, pixels: PhotoPixels | null) {
  if (source.kind !== 'thumbnail') return { orig_width: pixels?.width ?? null, orig_height: pixels?.height ?? null };
  const { width, height } = source;
  const turned =
    width !== null &&
    height !== null &&
    pixels !== null &&
    Math.sign(width - height) * Math.sign(pixels.width - pixels.height) === -1;
  return turned ? { orig_width: height, orig_height: width } : { orig_width: width, orig_height: height };
}

function toSignals(row: TrekPhotoSignalRow): PhotoPickSignals {
  return {
    phash: row.phash,
    sharpness: row.sharpness,
    clipped: row.clipped,
    origWidth: row.orig_width,
    origHeight: row.orig_height,
  };
}

const BUSY_GRID = /^[0-9a-f]{64}$/;

/** A stored palette as the engine reads it; anything that is not the measurement's own shape reads as none. */
function paletteOf(row: TrekPhotoSignalRow): string[] | undefined {
  const entries = decodeJson(TREK_PHOTO_SIGNAL_PALETTE, row.palette, `photo ${row.photo_id}`);
  return entries.length > 0 ? entries : undefined;
}

function toBookSignals(row: TrekPhotoSignalRow): BookPhotoSignals {
  const fresh = row.algo === PHOTO_SIGNALS_ALGO;
  const palette = fresh ? paletteOf(row) : undefined;
  const busy = fresh && row.busy && BUSY_GRID.test(row.busy) ? row.busy : undefined;
  const salient =
    fresh && typeof row.sal_x === 'number' && typeof row.sal_y === 'number'
      ? { x: row.sal_x, y: row.sal_y }
      : undefined;
  return {
    width: row.orig_width,
    height: row.orig_height,
    ...(typeof row.luma === 'number' ? { luma: Math.round(row.luma * 255) } : {}),
    ...(palette ? { palette } : {}),
    ...(busy ? { busy } : {}),
    ...(salient ? { salient } : {}),
  };
}

/** Resolves when `work` settles or after `ms`, whichever comes first; never rejects. */
function waitAtMost(work: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref();
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    work.then(done, done);
  });
}
