import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { Injectable } from '@nestjs/common';

import { Jimp } from 'jimp';
import crypto from 'node:crypto';
import path from 'node:path';

const THUMB_MAX = 800;
const THUMB_QUALITY = 80;

/**
 * Storage name (category 'journey') of the derived thumbnail for an
 * uploads-relative journey photo path ('journey/<file>'). The hash input is
 * deliberately the uploads-relative path — the scheme predates the storage
 * layer, and changing it would orphan every existing thumbnail.
 */
export function journeyThumbName(originalRelPath: string): string {
  const hash = crypto.createHash('sha1').update(originalRelPath).digest('hex').slice(0, 16);
  return `thumbs/${hash}.jpg`;
}

/**
 * Downscaled JPEGs for locally uploaded journey photos. Gated on the journey
 * addon, because that is the only surface that uploads them. Category-addressed
 * since storage slice 4: originals and thumbs are ('journey', <name>) objects.
 */
@Injectable()
export class ThumbnailService {
  constructor(
    private readonly addons: AddonsService,
    private readonly storage: StorageService,
    private readonly db: DatabaseService,
  ) {}

  async ensureLocalThumbnail(
    originalRelPath: string,
  ): Promise<{ thumbnailRelPath: string; width: number; height: number } | null> {
    if (!this.addons.isAddonEnabled(ADDON_IDS.JOURNEY)) return null;

    // The DB stores uploads-relative paths ('journey/<file>'); anything else
    // is not a local journey photo and has no thumbnail to derive.
    const origName = originalRelPath.startsWith('journey/') ? originalRelPath.slice('journey/'.length) : null;
    if (!origName) return null;

    // Deterministic name so concurrent requests don't race on the same photo.
    const thumbName = journeyThumbName(originalRelPath);
    const thumbRel = `journey/${thumbName}`;

    try {
      const [srcStat, dstStat] = await Promise.all([
        this.storage.stat('journey', origName),
        this.storage.stat('journey', thumbName),
      ]);
      if (!srcStat) return null;
      if (dstStat && dstStat.mtimeMs >= srcStat.mtimeMs) {
        const img = await this.storage.withLocalFile('journey', thumbName, (p) => Jimp.read(p));
        return { thumbnailRelPath: thumbRel, width: img.bitmap.width, height: img.bitmap.height };
      }

      // Jimp auto-applies EXIF orientation on read, matching sharp's .rotate() behavior.
      const img = await this.storage.withLocalFile('journey', origName, (p) => Jimp.read(p));
      const { width: w, height: h } = img.bitmap;
      if (w > THUMB_MAX || h > THUMB_MAX) {
        img.scaleToFit({ w: THUMB_MAX, h: THUMB_MAX });
      }
      // Jimp writes straight to a path, so spool on the category's volume and
      // commit through storage for the atomic rename.
      const spool = path.join(this.storage.spoolDirFor('journey'), `thumb-${crypto.randomUUID()}.jpg`);
      await img.write(spool as `${string}.jpg`, { quality: THUMB_QUALITY });
      await this.storage.put('journey', thumbName, { tmpPath: spool });

      return { thumbnailRelPath: thumbRel, width: img.bitmap.width, height: img.bitmap.height };
    } catch {
      // Unsupported format, corrupt file, etc. — fall back to original in caller.
      return null;
    }
  }

  /**
   * Reclaim journey/thumbs/ objects no live trek_photos row can account for
   * (spec In-scope fix #2). The live set is every hash derivable from a
   * journey file_path plus every recorded thumbnail_path under thumbs/ —
   * video posters live in journey/ proper and are reclaimed at the delete
   * sites, not here. Gated on the Journey addon like the generator, inside
   * the method so an admin toggle takes effect without a restart
   * (airtrail-sync.job.ts precedent).
   */
  async sweepOrphanThumbs(): Promise<number> {
    if (!this.addons.isAddonEnabled(ADDON_IDS.JOURNEY)) return 0;

    const live = new Set<string>();
    for (const row of this.db.all<{ file_path: string }>(
      "SELECT file_path FROM trek_photos WHERE file_path LIKE 'journey/%'",
    )) {
      live.add(journeyThumbName(row.file_path));
    }
    for (const row of this.db.all<{ thumbnail_path: string }>(
      "SELECT thumbnail_path FROM trek_photos WHERE thumbnail_path LIKE 'journey/thumbs/%'",
    )) {
      live.add(row.thumbnail_path.slice('journey/'.length));
    }

    let removed = 0;
    for await (const stat of this.storage.list('journey', 'thumbs/')) {
      if (!stat.key.endsWith('.jpg') || live.has(stat.key)) continue;
      try {
        await this.storage.delete('journey', stat.key);
        removed++;
      } catch {
        /* race */
      }
    }
    return removed;
  }
}
