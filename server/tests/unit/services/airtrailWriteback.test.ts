import { describe, it, expect, vi } from 'vitest';

// Avoid any real DNS/network from the SSRF guard during saveSettings.
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf: vi.fn(async () => ({ allowed: true, isPrivate: false })),
  safeFetch: vi.fn(),
}));

import { db } from '../../../src/db/database';
import { createUser } from '../../helpers/factories';
import {
  getConnectionSettings,
  isAirtrailWriteEnabled,
  saveSettings,
} from '../../../src/services/airtrail/airtrailService';

describe('airtrail writeback opt-in persistence (#1240)', () => {
  it('defaults the writeback opt-in to off for a new user', () => {
    const { user } = createUser(db);
    expect(isAirtrailWriteEnabled(user.id)).toBe(false);
    expect(getConnectionSettings(user.id).writeEnabled).toBe(false);
  });

  it('persists the opt-in and lets it be toggled back off without dropping the key', async () => {
    const { user } = createUser(db);

    await saveSettings(user.id, 'https://at.example.com', 'secret-key', false, true, null);
    expect(isAirtrailWriteEnabled(user.id)).toBe(true);
    const on = getConnectionSettings(user.id);
    expect(on.writeEnabled).toBe(true);
    expect(on.connected).toBe(true); // key stored

    // No key supplied keeps the stored key; only the opt-in flips back off.
    await saveSettings(user.id, 'https://at.example.com', undefined, false, false, null);
    expect(isAirtrailWriteEnabled(user.id)).toBe(false);
    expect(getConnectionSettings(user.id).connected).toBe(true);
  });
});
