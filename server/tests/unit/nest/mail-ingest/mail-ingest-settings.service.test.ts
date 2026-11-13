/**
 * Whether the mail import runs and how: off until switched on, the TREK Cloud
 * relay as the only transport of a managed install, the address template only
 * with its placeholder, and a person's switches all on until they change one.
 */
import { MailIngestPrefs } from '../../../../src/db/entities/MailIngestPrefs.entity';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { MailIngestSettingsService } from '../../../../src/nest/mail-ingest/mail-ingest-settings.service';
import { SettingsService } from '../../../../src/nest/settings/settings.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const stored = new Map<string, string>();
const settings = { getAppSetting: vi.fn(async (key: string) => stored.get(key) ?? null) };
const env = { isManaged: vi.fn(() => false) };
const prefs = { findForUser: vi.fn(), upsertForUser: vi.fn(async () => undefined) };
let service: MailIngestSettingsService;

beforeEach(async () => {
  vi.clearAllMocks();
  stored.clear();
  env.isManaged.mockReturnValue(false);
  prefs.findForUser.mockResolvedValue(null);
  const moduleRef = await Test.createTestingModule({
    providers: [
      MailIngestSettingsService,
      { provide: SettingsService, useValue: settings },
      { provide: RuntimeEnvService, useValue: env },
      { provide: getRepositoryToken(MailIngestPrefs), useValue: prefs },
    ],
  }).compile();
  service = moduleRef.get(MailIngestSettingsService);
});

describe('MailIngestSettingsService', () => {
  it('is off until switched on', async () => {
    expect(await service.isAvailable()).toBe(false);
    stored.set('mail_ingest_enabled', 'true');
    expect(await service.isAvailable()).toBe(true);
  });

  it('reads the transport, off for anything it does not know, the relay on a managed install', async () => {
    expect(await service.transport()).toBe('off');
    stored.set('mail_ingest_transport', 'imap');
    expect(await service.transport()).toBe('imap');
    stored.set('mail_ingest_transport', 'carrier-pigeon');
    expect(await service.transport()).toBe('off');
    env.isManaged.mockReturnValue(true);
    expect(await service.transport()).toBe('cloud');
  });

  it('takes an address template only with its placeholder', async () => {
    expect(await service.addressTemplate()).toBeNull();
    stored.set('mail_ingest_address_template', 'trips@example.com');
    expect(await service.addressTemplate()).toBeNull();
    stored.set('mail_ingest_address_template', ' trek+{token}@example.com ');
    expect(await service.addressTemplate()).toBe('trek+{token}@example.com');
  });

  it('reads the daily AI limit, ten when unset or broken', async () => {
    expect(await service.aiDailyCap()).toBe(10);
    stored.set('mail_ingest_ai_per_user_daily', '3');
    expect(await service.aiDailyCap()).toBe(3);
    stored.set('mail_ingest_ai_per_user_daily', '-1');
    expect(await service.aiDailyCap()).toBe(10);
  });

  it('takes larger mails on the TREK Cloud, and the admin’s file types', async () => {
    expect(service.maxMailBytes()).toBe(10 * 1024 * 1024);
    env.isManaged.mockReturnValue(true);
    expect(service.maxMailBytes()).toBe(25 * 1024 * 1024);
    expect(await service.allowedFileTypes()).toContain('pdf');
    stored.set('allowed_file_types', 'pdf');
    expect(await service.allowedFileTypes()).toBe('pdf');
  });

  it('has every switch on for a person who never changed one, and writes only what changes', async () => {
    expect(await service.prefsOf(4)).toEqual({ enabled: true, ai_enabled: true, auto_add: true });
    prefs.findForUser.mockResolvedValue({ id: 1, user_id: 4, enabled: 1, ai_enabled: 0, auto_add: 1 });
    expect(await service.updatePrefs(4, { ai_enabled: false })).toEqual({
      enabled: true,
      ai_enabled: false,
      auto_add: true,
    });
    expect(prefs.upsertForUser).toHaveBeenCalledWith(4, { ai_enabled: 0 });
    await service.updatePrefs(4, { enabled: true, auto_add: false });
    expect(prefs.upsertForUser).toHaveBeenLastCalledWith(4, { enabled: 1, auto_add: 0 });
  });
});
