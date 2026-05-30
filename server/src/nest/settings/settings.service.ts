import { Injectable } from '@nestjs/common';
import * as svc from '../../services/settingsService';

/**
 * Thin Nest wrapper around the existing settings service. The key/value SQL and
 * secret-redaction reuse the legacy code unchanged.
 */
@Injectable()
export class SettingsService {
  getUserSettings(userId: number) { return svc.getUserSettings(userId); }
  upsertSetting(userId: number, key: string, value: unknown) { return svc.upsertSetting(userId, key, value); }
  bulkUpsertSettings(userId: number, settings: Record<string, unknown>) { return svc.bulkUpsertSettings(userId, settings); }
}
