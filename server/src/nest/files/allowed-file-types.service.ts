import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DEFAULT_ALLOWED_EXTENSIONS } from './files.constants';

/**
 * The operator's allowed-extension list, on its own.
 *
 * Split out of FilesService so the multer factories can inject it without
 * pulling the whole files domain into JourneyModule's injector. It is the only
 * thing an upload's fileFilter needs from the container, and it is a live read:
 * an admin changing the list in settings applies to the next upload, with no
 * invalidation wiring.
 */
@Injectable()
export class AllowedFileTypesService {
  constructor(private readonly db: DatabaseService) {}

  /** Comma-separated, as the admin panel stores it. `*` means anything. */
  get(): string {
    try {
      const row = this.db.get<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'allowed_file_types'",
      );
      return row?.value || DEFAULT_ALLOWED_EXTENSIONS;
    } catch {
      return DEFAULT_ALLOWED_EXTENSIONS;
    }
  }
}
