import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
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
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
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

  async get(placeId: string): Promise<CachedPhoto | null> {
    const row = this.db.get<{ attribution: string | null }>(
      'SELECT attribution FROM google_place_photo_meta WHERE place_id = ? AND error_at IS NULL',
      placeId,
    );

    if (!row) return null;

    if (!this.knownOnDisk.has(placeId)) {
      // First time this placeId is checked this session — verify the object exists.
      // (Guards against volume wipes or manual deletion between server restarts.)
      if (!(await this.storage.exists('photos-google', this.fileName(placeId)))) {
        this.db.run('DELETE FROM google_place_photo_meta WHERE place_id = ?', placeId);
        return null;
      }
      this.knownOnDisk.add(placeId);
    }

    return { photoUrl: this.proxyUrl(placeId), attribution: row.attribution };
  }

  getErrored(placeId: string): boolean {
    const failedAt = this.recentFailures.get(placeId);
    if (failedAt !== undefined) {
      if (Date.now() - failedAt < FAILURE_TTL) return true;
      this.recentFailures.delete(placeId);
    }

    const row = this.db.get<{ error_at: number }>(
      'SELECT error_at FROM google_place_photo_meta WHERE place_id = ? AND error_at IS NOT NULL',
      placeId,
    );

    if (!row) return false;
    return Date.now() - row.error_at < MISSING_TTL;
  }

  /**
   * Remember that a lookup came back empty. 'no-photo' is the lasting answer — no
   * provider has an image for this place — and is persisted; 'provider-error' is a
   * failed attempt and is only held in memory for a few minutes.
   */
  markError(placeId: string, kind: 'no-photo' | 'provider-error' = 'no-photo'): void {
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
    this.db.run(
      'INSERT OR REPLACE INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, NULL, ?, ?)',
      placeId,
      Date.now(),
      Date.now(),
    );
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

    this.db.run(
      'INSERT OR REPLACE INTO google_place_photo_meta (place_id, attribution, fetched_at, error_at) VALUES (?, ?, ?, NULL)',
      placeId,
      attribution,
      Date.now(),
    );

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
   */
  private isReferenced(placeId: string): boolean {
    const row = this.db.get(
      `SELECT 1 FROM places WHERE google_place_id = ? OR image_url = ?
       UNION ALL
       SELECT 1 FROM collection_places WHERE google_place_id = ? OR image_url = ?
       LIMIT 1`,
      placeId,
      this.proxyUrl(placeId),
      placeId,
      this.proxyUrl(placeId),
    );
    return !!row;
  }

  private async deleteEntry(placeId: string): Promise<void> {
    await this.storage.delete('photos-google', this.fileName(placeId)).catch(() => {
      /* already gone */
    });
    this.db.run('DELETE FROM google_place_photo_meta WHERE place_id = ?', placeId);
    this.knownOnDisk.delete(placeId);
  }

  /**
   * Drop a cache entry if no place references it anymore. Called after a place delete
   * for prompt reclamation; the nightly sweep is the catch-all for every other path.
   */
  async removeIfUnreferenced(placeId: string): Promise<void> {
    if (this.isReferenced(placeId)) return;
    await this.deleteEntry(placeId);
  }

  /**
   * Reclaim orphaned cache files + meta rows. Runs on startup and nightly (scheduler).
   * Two passes: (1) meta rows no place references; (2) stray .jpg objects with no meta row.
   */
  async sweepOrphans(): Promise<number> {
    let removed = 0;

    const rows = this.db.all<{ place_id: string }>('SELECT place_id FROM google_place_photo_meta');
    const keepFiles = new Set<string>();
    for (const { place_id } of rows) {
      if (this.isReferenced(place_id)) {
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
