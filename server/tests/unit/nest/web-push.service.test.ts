import { DatabaseService } from '../../../src/nest/database/database.service';
import { WebPushService } from '../../../src/nest/notifications/web-push.service';
import { createTestDb } from '../../helpers/test-db';

import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('WebPushService', () => {
  let db: Database.Database;
  let service: WebPushService;
  const writeAudit = vi.fn();
  const originalAppUrl = process.env.APP_URL;

  beforeEach(() => {
    process.env.APP_URL = 'https://trek.example.test';
    db = createTestDb();
    const dbs = new DatabaseService(db);
    service = new WebPushService(dbs, { writeAudit } as never);
    db.prepare(
      "INSERT INTO users (username,email,password_hash,role) VALUES ('admin','admin@example.test','x','admin')",
    ).run();
    db.prepare("INSERT OR REPLACE INTO app_settings (key,value) VALUES ('notification_channels','webpush')").run();
  });

  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = originalAppUrl;
    writeAudit.mockReset();
    db.close();
  });

  it('generates one durable VAPID identity and registers/revokes a device', () => {
    const user = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get() as { id: number };
    const firstConfig = service.config();
    const secondConfig = service.config();
    expect(firstConfig).toMatchObject({ enabled: true, available: true, canonicalOrigin: 'https://trek.example.test' });
    expect(secondConfig.publicKey).toBe(firstConfig.publicKey);

    const enabled = service.registerCurrent(user.id, {
      intent: 'enable',
      installationId: '123e4567-e89b-42d3-a456-426614174000',
      label: 'Safari on iPhone',
      subscription: {
        endpoint: 'https://push.example.test/subscription/1',
        keys: { p256dh: 'abcdefgh_12345678', auth: 'abcdefgh_12345678' },
      },
    });
    expect(enabled.state).toBe('active');
    expect(service.listDevices(user.id)).toHaveLength(1);
    expect(db.prepare('SELECT subscription_encrypted FROM web_push_subscriptions').get()).not.toEqual({
      subscription_encrypted: expect.stringContaining('push.example.test'),
    });

    expect(service.revokeDevice(user.id, enabled.device!.id)).toBe(true);
    expect(service.listDevices(user.id)).toEqual([]);
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'web_push.device_revoke' }));
  });
});
