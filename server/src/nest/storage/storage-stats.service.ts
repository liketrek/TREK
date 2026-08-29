import { DatabaseService } from '../database/database.service';
import { StorageService } from './storage.service';
import { Injectable, Logger } from '@nestjs/common';
import { STORAGE_CATEGORIES, storageUsageSchema, type StorageUsage } from '@trek/shared';

export class StatsBusyError extends Error {}

export const USAGE_KEY = 'storage.usage';

/**
 * Usage scan (backfill/stats spec): walks every served category through the
 * facade — a mirrored category therefore lists its PRIMARY, the source of
 * truth — and persists one JSON row with computedAt. Local backends pay one
 * stat per file; s3 sizes ride the paginated listing. photos-google /
 * photos-trek nest under the legacy photos/ prefix in mode A, so the legacy
 * walk must exclude their subtrees to avoid double counting — the same
 * google/ trek/ skip the backup walk uses.
 */
@Injectable()
export class StorageStatsService {
  private readonly logger = new Logger(StorageStatsService.name);
  private scanning = false;

  constructor(
    private readonly storage: StorageService,
    private readonly db: DatabaseService,
  ) {}

  async scan(): Promise<StorageUsage> {
    if (this.scanning) throw new StatsBusyError('a usage scan is already running');
    this.scanning = true;
    try {
      const categories = {} as StorageUsage['categories'];
      for (const category of STORAGE_CATEGORIES) {
        let objects = 0;
        let bytes = 0;
        for await (const stat of this.storage.list(category)) {
          objects += 1;
          bytes += stat.size;
        }
        categories[category] = { objects, bytes };
      }
      const legacyPhotos = { objects: 0, bytes: 0 };
      for await (const stat of this.storage.list('photos')) {
        if (stat.key.startsWith('google/') || stat.key.startsWith('trek/')) continue;
        legacyPhotos.objects += 1;
        legacyPhotos.bytes += stat.size;
      }
      const usage: StorageUsage = { computedAt: Date.now(), categories, legacyPhotos };
      this.db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', USAGE_KEY, JSON.stringify(usage));
      return usage;
    } finally {
      this.scanning = false;
    }
  }

  /** The stored row, parsed; null when absent or unparseable (logged, never a 500). */
  readUsage(): StorageUsage | null {
    const row = this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', USAGE_KEY);
    if (!row) return null;
    try {
      return storageUsageSchema.parse(JSON.parse(row.value));
    } catch {
      this.logger.warn('stored storage.usage row is unparseable — treating as never computed');
      return null;
    }
  }
}
