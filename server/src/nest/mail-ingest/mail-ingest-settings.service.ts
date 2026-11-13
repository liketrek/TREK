import { MailIngestPrefs } from '../../db/entities/MailIngestPrefs.entity';
import type { MailIngestPrefsPatch, MailIngestPrefsRepository } from '../../db/repositories/MailIngestPrefs.repository';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { DEFAULT_ALLOWED_EXTENSIONS } from '../files/files.constants';
import { SettingsService } from '../settings/settings.service';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  mailIngestTransportSettingSchema,
  type MailIngestPrefs as MailIngestPrefsView,
  type MailIngestPrefsUpdateRequest,
  type MailIngestTransportSetting,
} from '@trek/shared';

/** The daily AI cap when the setting is missing or unreadable. */
const DEFAULT_AI_PER_USER_DAILY = 10;

/**
 * Whether the mail import runs on this install, how mail reaches it, and the
 * person's own switches.
 *
 * The import is off until `mail_ingest_enabled` says otherwise. On a managed
 * install that setting is the operator's: it is written for the plans that
 * include the import and never for Start, so on Start every surface reports
 * the import as unavailable and nothing is read.
 */
@Injectable()
export class MailIngestSettingsService {
  constructor(
    private readonly settings: SettingsService,
    private readonly env: RuntimeEnvService,
    @InjectRepository(MailIngestPrefs) private readonly prefs: MailIngestPrefsRepository,
  ) {}

  async isAvailable(): Promise<boolean> {
    return (await this.settings.getAppSetting('mail_ingest_enabled')) === 'true';
  }

  /** How mail reaches the install; a managed one takes it from the TREK Cloud relay alone. */
  async transport(): Promise<MailIngestTransportSetting> {
    if (this.env.isManaged()) return 'cloud';
    const stored = await this.settings.getAppSetting('mail_ingest_transport');
    const parsed = mailIngestTransportSettingSchema.safeParse(stored);
    return parsed.success ? parsed.data : 'off';
  }

  /** The forwarding address with `{token}` where a person's token goes; null until an admin set one. */
  async addressTemplate(): Promise<string | null> {
    const template = (await this.settings.getAppSetting('mail_ingest_address_template'))?.trim();
    return template && template.includes('{token}') ? template : null;
  }

  async aiDailyCap(): Promise<number> {
    const value = Number(await this.settings.getAppSetting('mail_ingest_ai_per_user_daily'));
    return Number.isInteger(value) && value >= 0 ? value : DEFAULT_AI_PER_USER_DAILY;
  }

  /** The largest mail taken in: more on the TREK Cloud, whose relay already capped it. */
  maxMailBytes(): number {
    return this.env.isManaged() ? MAIL_INGEST_LIMITS.cloudMailBytes : MAIL_INGEST_LIMITS.selfHostedMailBytes;
  }

  /** The file types a trip takes, as the admin set them, for the documents a mail leaves behind. */
  async allowedFileTypes(): Promise<string> {
    return (await this.settings.getAppSetting('allowed_file_types')) || DEFAULT_ALLOWED_EXTENSIONS;
  }

  /** The person's switches; a person who never changed one has every one on. */
  async prefsOf(userId: number): Promise<MailIngestPrefsView> {
    const row = await this.prefs.findForUser(userId);
    return {
      enabled: row ? row.enabled === 1 : true,
      ai_enabled: row ? row.ai_enabled === 1 : true,
      auto_add: row ? row.auto_add === 1 : true,
    };
  }

  async updatePrefs(userId: number, update: MailIngestPrefsUpdateRequest): Promise<MailIngestPrefsView> {
    const patch: MailIngestPrefsPatch = {};
    if (update.enabled !== undefined) patch.enabled = update.enabled ? 1 : 0;
    if (update.ai_enabled !== undefined) patch.ai_enabled = update.ai_enabled ? 1 : 0;
    if (update.auto_add !== undefined) patch.auto_add = update.auto_add ? 1 : 0;
    await this.prefs.upsertForUser(userId, patch);
    return this.prefsOf(userId);
  }
}
