import { createUser } from '../../helpers/factories';
import { createTestDb } from '../../helpers/test-db';

import { afterAll, describe, expect, it } from 'vitest';

const db = createTestDb();

afterAll(() => db.close());

describe('Web Push subscription schema', () => {
  it('stores an account-bound browser installation and cascades account deletion', () => {
    const { user } = createUser(db);
    db.prepare(
      `
      INSERT INTO web_push_subscriptions (
        user_id, installation_id, endpoint_hash, subscription_encrypted,
        origin, vapid_key_fingerprint, label, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `,
    ).run(
      user.id,
      '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
      'endpoint-hash',
      'enc:v1:subscription',
      'https://trek.example.test',
      'vapid-fingerprint',
      'Safari on iPhone',
    );

    expect(db.prepare('SELECT label, status FROM web_push_subscriptions WHERE user_id = ?').get(user.id)).toEqual({
      label: 'Safari on iPhone',
      status: 'active',
    });

    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    expect(db.prepare('SELECT id FROM web_push_subscriptions WHERE user_id = ?').get(user.id)).toBeUndefined();
  });
});
