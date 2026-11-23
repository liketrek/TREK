import { Journeys } from '../../db/entities/Journeys.entity';
import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import type { TrekPhotosRepository } from '../../db/repositories/TrekPhotos.repository';
import { logWarn } from '../audit/audit-log.logger';
import { StorageService } from '../storage/storage.service';
import { StorageNotFoundError, type ServedCategory } from '../storage/storage.types';
import { redactLocationInFile } from './media-redact';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import type { Response } from 'express';
import { Jimp } from 'jimp';
import crypto from 'node:crypto';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

/** Location-free copies live beside their source, under this prefix, in the source's category. */
const RENDITION_PREFIX = 'public/';

/** The categories whose objects reach a viewer without an account and so get renditions. */
const RENDITION_CATEGORIES: readonly ServedCategory[] = ['avatars', 'covers', 'journey', 'places', 'photos'];

/** Image types Jimp both decodes and writes; it writes no metadata, so a re-encoded copy carries no location. */
const REENCODABLE_EXTENSIONS = new Set(['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff']);

/**
 * How long a request waits for a copy being made. A large video takes longer
 * than a reverse proxy waits for the first byte, so past this the request is
 * told to come back while the copy goes on being made.
 */
const RENDITION_WAIT_MS = 10_000;

/** The copy of a name is still being made; the request is answered with {@link answerRenditionPending}. */
export class RenditionPendingError extends Error {
  constructor() {
    super('The public copy is still being made');
  }
}

/** What {@link pendingOrNone} reads a copy still being made as. */
export const RENDITION_PENDING = Symbol('rendition pending');

/** A refusal of `renditionFor` as a request reads it: RENDITION_PENDING while the copy is being made, else no copy. */
export function pendingOrNone(err: unknown): typeof RENDITION_PENDING | null {
  return err instanceof RenditionPendingError ? RENDITION_PENDING : null;
}

/** Answers a request whose copy is still being made: 503, come back in a while, nothing cached. */
export function answerRenditionPending(res: Response): void {
  res.set('Retry-After', String(RENDITION_WAIT_MS / 1000));
  res.set('Cache-Control', 'no-store');
  res.status(503).json({ error: 'The file is being prepared, try again shortly' });
}

/** `pending` if it settles within RENDITION_WAIT_MS, else a RenditionPendingError while it goes on. */
function withinWait<T>(pending: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RenditionPendingError()), RENDITION_WAIT_MS);
    timer.unref();
  });
  return Promise.race([pending, late]).finally(() => clearTimeout(timer));
}

/** How many copies the sweep checks at once, so a large instance does not open thousands of handles. */
const SWEEP_BATCH = 32;

/** Runs `step` on each batch of `items` in turn and sums what it returns. */
function sumInBatches<T>(items: readonly T[], size: number, step: (batch: readonly T[]) => Promise<number>) {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches.reduce<Promise<number>>(
    (done, batch) => done.then(async (sum) => sum + (await step(batch))),
    Promise.resolve(0),
  );
}

/**
 * What every byte path without an account serves instead of a stored
 * original: a copy with the location taken out (media-redact.ts), made on the
 * first request and kept as `public/<name>` in the same category until the
 * source changes. When the metadata cannot be cleaned in place, a raster image
 * is re-encoded instead, so an upload that rendered before keeps rendering.
 * Owners and members keep getting the original itself.
 */
@Injectable()
export class PublicMediaService {
  private readonly inFlight = new Map<string, Promise<string | null>>();

  constructor(
    private readonly storage: StorageService,
    @InjectRepository(Journeys) private readonly journeys: JourneysRepository,
    @InjectRepository(TrekPhotos) private readonly trekPhotos: TrekPhotosRepository,
  ) {}

  /**
   * The storage name of the location-free copy of `name`, or null when none
   * can be made safely (a movie or format that can be neither cleaned nor
   * re-encoded): the caller then serves nothing rather than the original. A
   * missing source throws StorageNotFoundError, an invalid name
   * StorageInvalidKeyError, and a copy not made within RENDITION_WAIT_MS
   * RenditionPendingError (it is still made, for a later request).
   */
  async renditionFor(category: ServedCategory, name: string): Promise<string | null> {
    if (name.startsWith(RENDITION_PREFIX)) return null;
    const rendition = RENDITION_PREFIX + name;
    const [source, existing] = await Promise.all([
      this.storage.stat(category, name),
      this.storage.stat(category, rendition),
    ]);
    if (!source) throw new StorageNotFoundError(`${category}/${name}`);
    if (existing && existing.mtimeMs >= source.mtimeMs) return rendition;

    const key = `${category}/${name}`;
    let pending = this.inFlight.get(key);
    if (pending === undefined) {
      pending = this.build(category, name, rendition).finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }
    return withinWait(pending);
  }

  /**
   * Whether /uploads/journey may answer for `name`. Journey entry media (a
   * trek_photos original or poster, and the thumbs/ TREK derives from them)
   * goes only through the token-checked and session-checked proxies, so
   * revoking a share link takes it away; a journey cover, and any other
   * object a trip cover or place image may point at, stays reachable.
   */
  async servesFromJourneyMount(name: string): Promise<boolean> {
    const spellings = [`journey/${name}`, `/uploads/journey/${name}`];
    if (await this.journeys.isCoverImage(spellings)) return true;
    if (name.startsWith('thumbs/')) return false;
    return !(await this.trekPhotos.referencesLocalPath(spellings));
  }

  /** Deletes the renditions whose source is gone. Returns how many went. */
  sweepOrphans(): Promise<number> {
    // One category after another, each in bounded batches.
    return RENDITION_CATEGORIES.reduce<Promise<number>>(
      (done, category) => done.then(async (sum) => sum + (await this.sweepCategory(category))),
      Promise.resolve(0),
    );
  }

  private async sweepCategory(category: ServedCategory): Promise<number> {
    const keys: string[] = [];
    for await (const stat of this.storage.list(category, RENDITION_PREFIX)) keys.push(stat.key);
    return sumInBatches(keys, SWEEP_BATCH, async (batch) => {
      const removed = await Promise.all(batch.map((key) => this.dropIfOrphaned(category, key)));
      return removed.filter(Boolean).length;
    });
  }

  private async dropIfOrphaned(category: ServedCategory, key: string): Promise<boolean> {
    // A source that cannot be checked right now counts as present.
    if (await this.storage.exists(category, key.slice(RENDITION_PREFIX.length)).catch(() => true)) return false;
    if (this.storage.keepsOnDelete(category, key)) return false;
    return this.storage.delete(category, key).then(
      () => true,
      () => false,
    );
  }

  private async build(category: ServedCategory, name: string, rendition: string): Promise<string | null> {
    const extension = path.extname(name).toLowerCase();
    const spool = path.join(this.storage.spoolDirFor(category), `public-${crypto.randomUUID()}${extension}`);
    try {
      await this.storage.withLocalFile(category, name, (source) => fsPromises.copyFile(source, spool));
      if (!(await redactLocationInFile(spool)) && !(await this.reencode(category, name, spool, extension))) {
        logWarn(`Public media: ${category}/${name} could not be cleaned of its location and is not served publicly`);
        return null;
      }
      await this.storage.put(category, rendition, { tmpPath: spool });
      return rendition;
    } finally {
      await fsPromises.rm(spool, { force: true });
    }
  }

  /** Writes a fresh, metadata-free encoding of the source to `spool`; false when Jimp cannot handle it. */
  private async reencode(category: ServedCategory, name: string, spool: string, extension: string): Promise<boolean> {
    if (!REENCODABLE_EXTENSIONS.has(extension)) return false;
    try {
      // Jimp applies the EXIF orientation on read, so the copy shows upright without it.
      const image = await this.storage.withLocalFile(category, name, (source) => Jimp.read(source));
      await image.write(spool as Parameters<typeof image.write>[0]);
      return true;
    } catch {
      return false;
    }
  }
}
