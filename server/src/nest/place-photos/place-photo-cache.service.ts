import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { GooglePlacePhotoMeta } from '../../db/entities/GooglePlacePhotoMeta.entity';
import { Places } from '../../db/entities/Places.entity';
import type { CollectionPlacesRepository } from '../../db/repositories/CollectionPlaces.repository';
import type { GooglePlacePhotoMetaRepository } from '../../db/repositories/GooglePlacePhotoMeta.repository';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { StorageService } from '../storage/storage.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { Jimp, JimpMime } from 'jimp';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

// How long a "no photo for this place" answer stays remembered. Nothing about it
// changes until a photo appears upstream, so it is worth keeping: without it every
// trip open replays the whole provider fan-out, one lookup per place. A day is
// still short enough that a newly configured API key takes effect overnight.
// Entries are dropped outright when the place goes away (removeIfUnreferenced /
// sweepOrphans).
const MISSING_TTL = 24 * 60 * 60 * 1000;
// A provider call that failed says nothing about the place — only that the API was
// unreachable or unhappy just now. It is remembered just long enough to stop a
// screenful of markers from hammering an API that is down, and only in memory, so
// a restart retries right away.
const FAILURE_TTL = 5 * 60 * 1000;
// Sweep expired failures once the map grows past this. Whatever survives the sweep
// is younger than FAILURE_TTL and expires on its own shortly after.
const FAILURE_SWEEP_AT = 500;

// Marker photos are displayed tiny — cap stored images so an oversized source
// (e.g. a Wikimedia Commons full-res original) can't bloat the cache. Matches
// THUMB_MAX/THUMB_QUALITY in memories/thumbnailService.ts.
const MAX_DIM = 800;
const JPEG_QUALITY = 80;

interface CachedPhoto {
  photoUrl: string;
  attribution: string | null;
}

/**
 * Cache for the marker photos the map providers hand back.
 *
 * Its own module because maps, places and share all read it — and because its
 * three in-memory structures only do their job if there is exactly ONE of them.
 * A second instance would give the stampede guard its own inFlight map, so two
 * simultaneous requests for the same uncached place would both call the
 * provider. That is the reason the nightly sweep (PlacePhotoCacheJob) injects
 * this container singleton rather than constructing its own.
 *
 * Bytes live in the 'photos-google' storage category as '<sha1>.jpg' names.
 * The registry's mode-aware prefix reproduces both TREK_PLACE_PHOTO_DIR
 * layouts (unset: uploads/photos/google; set: that dir, bare keys), so the
 * cache itself is mode-agnostic.
 *
 * `DatabaseService` was injected (Plan 3c Task 1, PP6 ruling option 2) purely
 * for the `collection_places` half of `isReferenced`; Plan 3h Task 6 converted
 * that half onto `CollectionPlacesRepository.existsByGoogleIdOrImageUrl`, so
 * every statement in this file was already repository-backed —
 * Plan 4 Task 4 dropped the now-unused `DatabaseService` injection.
 */
@Injectable()
export class PlacePhotoCacheService {
  /** Provider calls that failed recently — in memory only, so a restart retries. */
  private readonly recentFailures = new Map<string, number>();
  /** In-flight dedup: stops a stampede when several requests miss the same placeId at once. */
  private readonly inFlight = new Map<string, Promise<{ attribution: string | null } | null>>();
  /** placeIds whose object was confirmed in storage this session — saves a stat per hit. */
  private readonly knownOnDisk = new Set<string>();

  constructor(
    private readonly storage: StorageService,
    @InjectRepository(GooglePlacePhotoMeta) private readonly meta: GooglePlacePhotoMetaRepository,
    @InjectRepository(Places) private readonly places: PlacesRepository,
    // Plan 3h Task 6 (survivors) — additive, SV-PP6's `isReferenced` only.
    @InjectRepository(CollectionPlaces) private readonly collectionPlaces: CollectionPlacesRepository,
  ) {}

  private fileName(placeId: string): string {
    // Hash to avoid filename collisions — coords:lat:lng pseudo-IDs contain characters that
    // collapse identically under sanitization (e.g. ':' and '.' both → '_')
    const hash = crypto.createHash('sha1').update(placeId).digest('hex');
    return `${hash}.jpg`;
  }

  private proxyUrl(placeId: string): string {
    return `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`;
  }

  /**
   * Non-transactional check-then-act, unchanged (Plan 3c inventory §18.4,
   * program rule 11): PP1 (`this.meta.findLive`) → `await storage.exists(...)`
   * → PP2 (`this.meta.deleteByPlaceId`) has a real `await` in the window, so
   * two concurrent calls for the same never-checked placeId can both read the
   * row, both find the storage object missing, and both delete — the second
   * delete is a harmless 0-row no-op (`deleteByPlaceId` on an already-gone
   * row does not throw), and both callers correctly resolve `null`. Pinned by
   * a concurrency test, not fixed.
   */
  async get(placeId: string): Promise<CachedPhoto | null> {
    const row = await this.meta.findLive(placeId);

    if (!row) return null;

    if (!this.knownOnDisk.has(placeId)) {
      // First time this placeId is checked this session — verify the object exists.
      // (Guards against volume wipes or manual deletion between server restarts.)
      if (!(await this.storage.exists('photos-google', this.fileName(placeId)))) {
        await this.meta.deleteByPlaceId(placeId);
        return null;
      }
      this.knownOnDisk.add(placeId);
    }

    return { photoUrl: this.proxyUrl(placeId), attribution: row.attribution };
  }

  async getErrored(placeId: string): Promise<boolean> {
    const failedAt = this.recentFailures.get(placeId);
    if (failedAt !== undefined) {
      if (Date.now() - failedAt < FAILURE_TTL) return true;
      this.recentFailures.delete(placeId);
    }

    const row = await this.meta.findErrored(placeId);

    if (!row) return false;
    return Date.now() - row.error_at < MISSING_TTL;
  }

  /**
   * Remember that a lookup came back empty. 'no-photo' is the lasting answer — no
   * provider has an image for this place — and is persisted; 'provider-error' is a
   * failed attempt and is only held in memory for a few minutes.
   */
  async markError(placeId: string, kind: 'no-photo' | 'provider-error' = 'no-photo'): Promise<void> {
    if (kind === 'provider-error') {
      if (this.recentFailures.size >= FAILURE_SWEEP_AT) {
        const cutoff = Date.now() - FAILURE_TTL;
        for (const [id, at] of this.recentFailures) {
          if (at <= cutoff) this.recentFailures.delete(id);
        }
      }
      this.recentFailures.set(placeId, Date.now());
      return;
    }

    this.recentFailures.delete(placeId);
    this.knownOnDisk.delete(placeId);
    await this.meta.upsertError(placeId, Date.now());
  }

  /**
   * Downscale oversized images to MAX_DIM before caching, re-encoding to JPEG.
   * Defense-in-depth: keeps the cache small regardless of what the fetch path hands
   * us. Jimp auto-applies EXIF orientation on read. Falls back to the original bytes
   * on any failure (corrupt/unsupported format) so behaviour is never worse than before.
   */
  private async downscale(bytes: Buffer): Promise<Buffer> {
    try {
      const img = await Jimp.read(bytes);
      if (img.bitmap.width <= MAX_DIM && img.bitmap.height <= MAX_DIM) return bytes;
      img.scaleToFit({ w: MAX_DIM, h: MAX_DIM });
      return await img.getBuffer(JimpMime.jpeg, { quality: JPEG_QUALITY });
    } catch {
      return bytes;
    }
  }

  async put(placeId: string, bytes: Buffer, attribution: string | null): Promise<CachedPhoto> {
    const resized = await this.downscale(bytes);
    await this.storage.put('photos-google', this.fileName(placeId), Readable.from(resized));

    this.knownOnDisk.add(placeId);
    this.recentFailures.delete(placeId);

    await this.meta.upsertPhoto(placeId, attribution, Date.now());

    return { photoUrl: this.proxyUrl(placeId), attribution };
  }

  getInFlight(placeId: string): Promise<{ attribution: string | null } | null> | undefined {
    return this.inFlight.get(placeId);
  }

  setInFlight(placeId: string, promise: Promise<{ attribution: string | null } | null>): void {
    this.inFlight.set(placeId, promise);
    promise
      .finally(() => this.inFlight.delete(placeId))
      .catch(() => {
        /* awaiter logs; this .catch only prevents unhandledRejection */
      });
  }

  /**
   * Storage name (category 'photos-google') for a cached photo, or null when
   * the object is missing.
   */
  async serveKey(placeId: string): Promise<string | null> {
    const name = this.fileName(placeId);
    if (this.knownOnDisk.has(placeId)) return name;
    if (!(await this.storage.exists('photos-google', name))) return null;
    this.knownOnDisk.add(placeId);
    return name;
  }

  /**
   * A cache entry is "referenced" while any place still points at it — either by the
   * Google place_id (the dedup key) or by the stable proxy URL stored in image_url
   * (covers coords: pseudo-ids, which never have a google_place_id).
   *
   * A collection-saved place copies image_url = proxyUrl(google_place_id) and/or
   * the google_place_id itself, so collection_places must count as a referencing
   * table — otherwise the nightly sweep + trip-place delete would evict a photo
   * still shown on a collection thumbnail (#1081 photo-cache pitfall).
   *
   * Plan 3c Task 1 PP6 ruling (option 2): the legacy single `UNION ALL … LIMIT 1`
   * statement spans `places` (this plan's) and `collection_places` (Plan 3h's),
   * so it is split into two existence checks, evaluated in the SAME order the
   * legacy `UNION ALL … LIMIT 1` would short-circuit in — the `collection_places`
   * half only runs when the `places` half comes back false. Plan 3h Task 6
   * converts the second half onto `CollectionPlacesRepository
   * .existsByGoogleIdOrImageUrl`, closing out the carve-out.
   */
  private async isReferenced(placeId: string): Promise<boolean> {
    const proxyUrl = this.proxyUrl(placeId);
    if (await this.places.existsByGoogleIdOrImageUrl(placeId, proxyUrl)) return true;
    return await this.collectionPlaces.existsByGoogleIdOrImageUrl(placeId, proxyUrl);
  }

  private async deleteEntry(placeId: string): Promise<void> {
    await this.storage.delete('photos-google', this.fileName(placeId)).catch(() => {
      /* already gone */
    });
    await this.meta.deleteByPlaceId(placeId);
    this.knownOnDisk.delete(placeId);
  }

  /**
   * Drop a cache entry if no place references it anymore. Called after a place delete
   * for prompt reclamation; the nightly sweep is the catch-all for every other path.
   */
  async removeIfUnreferenced(placeId: string): Promise<void> {
    if (await this.isReferenced(placeId)) return;
    await this.deleteEntry(placeId);
  }

  /**
   * Reclaim orphaned cache files + meta rows. Runs on startup and nightly (scheduler).
   * Two passes: (1) meta rows no place references; (2) stray .jpg objects with no meta row.
   */
  async sweepOrphans(): Promise<number> {
    let removed = 0;

    const placeIds = await this.meta.listPlaceIds();
    const keepFiles = new Set<string>();
    for (const place_id of placeIds) {
      if (await this.isReferenced(place_id)) {
        keepFiles.add(this.fileName(place_id));
      } else {
        await this.deleteEntry(place_id);
        removed++;
      }
    }

    // Pass 2: objects that no surviving meta row maps to (e.g. left over from a
    // crash between the object write and the DB upsert, or a meta row deleted
    // out-of-band). list() recurses where the old readdirSync didn't — skip
    // nested keys so a subdirectory of a relocated cache dir is never swept.
    for await (const stat of this.storage.list('photos-google')) {
      if (stat.key.includes('/') || !stat.key.endsWith('.jpg') || keepFiles.has(stat.key)) continue;
      try {
        await this.storage.delete('photos-google', stat.key);
        removed++;
      } catch {
        /* race */
      }
    }

    return removed;
  }
}
