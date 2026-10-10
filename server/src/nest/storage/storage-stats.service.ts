import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { StorageService } from './storage.service';
import { InjectRepository } from '@mikro-orm/nestjs';
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
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
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
      await this.appSettings.upsertOrReplace(USAGE_KEY, JSON.stringify(usage));
      return usage;
    } finally {
      this.scanning = false;
    }
  }

  /**
   * The stored row, parsed; null when absent or unparseable (logged, never a
   * 500). `getValue()` returns null for BOTH "no row" and "row present with
   * a NULL value" — the legacy raw read only skipped the warn log for the
   * former; a row with a NULL `value` here would previously have fallen
   * through to `JSON.parse(null)` (parses to the JS `null`), failed the Zod
   * schema and logged the same warning anyway. `scan()` only ever writes a
   * JSON string, never NULL, so this distinction is unreachable in practice.
   */
  async readUsage(): Promise<StorageUsage | null> {
    const value = await this.appSettings.getValue(USAGE_KEY);
    if (value == null) return null;
    try {
      return storageUsageSchema.parse(JSON.parse(value));
    } catch {
      this.logger.warn('stored storage.usage row is unparseable — treating as never computed');
      return null;
    }
  }
}
