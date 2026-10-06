import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { DEFAULT_ALLOWED_EXTENSIONS } from './files.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * The operator's allowed-extension list, on its own.
 *
 * Split out of FilesService so the multer factories can inject it without
 * pulling the whole files domain into JourneyModule's injector. It is the only
 * thing an upload's fileFilter needs from the container, and it is a live read:
 * an admin changing the list in settings applies to the next upload, with no
 * invalidation wiring.
 *
 * FL29 — `SELECT value FROM app_settings WHERE key = 'allowed_file_types'`,
 * now `AppSettingsRepository.getValue` (the existing 3a repository, per the
 * plan's R12/§5 note — this table is not this plan's own).
 */
@Injectable()
export class AllowedFileTypesService {
  constructor(@InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository) {}

  /** Comma-separated, as the admin panel stores it. `*` means anything. */
  async get(): Promise<string> {
    try {
      const value = await this.appSettings.getValue('allowed_file_types');
      return value || DEFAULT_ALLOWED_EXTENSIONS;
    } catch {
      return DEFAULT_ALLOWED_EXTENSIONS;
    }
  }
}
