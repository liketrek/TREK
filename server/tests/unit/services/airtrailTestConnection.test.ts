import { describe, it, expect, vi, beforeEach } from 'vitest';

// Avoid any real DNS/network from the SSRF guard during saveSettings and the probe.
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf: vi.fn(async () => ({ allowed: true, isPrivate: false })),
  safeFetch: vi.fn(),
}));

import { db } from '../../../src/db/database';
import { createUser } from '../../helpers/factories';
import { AirtrailService } from '../../../src/nest/integrations/airtrail.service';
import type { AirtrailClient } from '../../../src/nest/integrations/airtrail.client';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AuditService } from '../../../src/nest/audit/audit.service';

// The probe is the only call that would leave the process, so the client is a
// stub; the credential handling around it runs against the real row.
const listFlights = vi.fn();
const svc = new AirtrailService(
  new DatabaseService(db),
  new AuditService(new DatabaseService(db)),
  { listFlights } as unknown as AirtrailClient,
);

const MASK = '••••••••';

beforeEach(() => {
  listFlights.mockReset();
  listFlights.mockResolvedValue([]);
});

describe('airtrail test connection keeps the stored key with its host', () => {
  it('refuses a blank key field against a different host than the stored one before anything is sent', async () => {
    // The form prefills the address and never the key, so retyping the URL and
    // pressing Test is the ordinary way to move an instance. Falling back to the
    // stored key here would carry it to whatever host was just typed.
    const { user } = createUser(db);
    await svc.saveSettings(user.id, 'https://old.example', 'stored-key', false, false, null);

    const out = await svc.testConnection(user.id, 'https://someone-elses.example', undefined, false);

    expect(out.connected).toBe(false);
    expect(out.error).toContain('https://old.example');
    expect(listFlights).not.toHaveBeenCalled();
  });

  it('treats the mask against a different port as a blank field, not a key', async () => {
    const { user } = createUser(db);
    await svc.saveSettings(user.id, 'https://old.example', 'stored-key', false, false, null);

    const out = await svc.testConnection(user.id, 'https://old.example:8443', MASK, false);

    expect(out.connected).toBe(false);
    expect(listFlights).not.toHaveBeenCalled();
  });

  it('still tests a path edit on the same origin with the stored key', async () => {
    // The same instance under a corrected path is where the key was issued, and
    // refusing it would make every trailing-slash edit demand the key again.
    const { user } = createUser(db);
    await svc.saveSettings(user.id, 'https://at.example/api', 'stored-key', false, false, null);

    const out = await svc.testConnection(user.id, 'https://at.example/', undefined, false);

    expect(out.connected).toBe(true);
    expect(listFlights).toHaveBeenCalledWith({ baseUrl: 'https://at.example/', apiKey: 'stored-key', allowInsecureTls: false });
  });

  it('uses a key typed for the new host as typed, so moving an instance and testing it first still works', async () => {
    const { user } = createUser(db);
    await svc.saveSettings(user.id, 'https://old.example', 'stored-key', false, false, null);

    const out = await svc.testConnection(user.id, 'https://new.example', 'minted-for-new', false);

    expect(out.connected).toBe(true);
    expect(listFlights).toHaveBeenCalledWith({ baseUrl: 'https://new.example', apiKey: 'minted-for-new', allowInsecureTls: false });
  });
});
