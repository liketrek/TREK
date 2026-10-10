import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
// ATC-TX-001 reads Nest's own emitted constructor-param metadata (the same
// mechanism `discovery.test.ts` uses) — needs the polyfill `src/index.ts`
// normally provides, absent from the vitest entrypoint.
import 'reflect-metadata';

// Avoid any real DNS/network from the SSRF guard during saveSettings.
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf: vi.fn(async () => ({ allowed: true, isPrivate: false })),
  safeFetch: vi.fn(),
}));

import { db } from '../../../src/db/database';
import { createUser } from '../../helpers/factories';
import { AirtrailService } from '../../../src/nest/integrations/airtrail.service';
import { AirtrailClient } from '../../../src/nest/integrations/airtrail.client';
import { AuditService } from '../../../src/nest/database/../audit/audit.service';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { UserAirtrailRepository } from '../../../src/db/repositories/UserAirtrail.repository';

// The free functions became methods with the airtrail fold; same SQL, same
// behaviour, one instance over the same db handle.
let svc: AirtrailService;
let getConnectionSettings: (...args: Parameters<AirtrailService['getConnectionSettings']>) => ReturnType<AirtrailService['getConnectionSettings']>;
let isAirtrailWriteEnabled: (...args: Parameters<AirtrailService['isAirtrailWriteEnabled']>) => ReturnType<AirtrailService['isAirtrailWriteEnabled']>;
let saveSettings: (...args: Parameters<AirtrailService['saveSettings']>) => ReturnType<AirtrailService['saveSettings']>;
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(db);
  svc = new AirtrailService(
    new UserAirtrailRepository(t.orm.em),
    new AuditService(t.repo(AuditLog), t.repo(Users)),
    new AirtrailClient(),
  );
  getConnectionSettings = (...args) => svc.getConnectionSettings(...args);
  isAirtrailWriteEnabled = (...args) => svc.isAirtrailWriteEnabled(...args);
  saveSettings = (...args) => svc.saveSettings(...args);
});

afterAll(async () => {
  await t.close();
});

describe('airtrail writeback opt-in persistence (#1240)', () => {
  it('defaults the writeback opt-in to off for a new user', async () => {
    const { user } = createUser(db);
    expect(await isAirtrailWriteEnabled(user.id)).toBe(false);
    expect((await getConnectionSettings(user.id)).writeEnabled).toBe(false);
  });

  it('persists the opt-in and lets it be toggled back off without dropping the key', async () => {
    const { user } = createUser(db);

    await saveSettings(user.id, 'https://at.example.com', 'secret-key', false, true, null);
    expect(await isAirtrailWriteEnabled(user.id)).toBe(true);
    const on = await getConnectionSettings(user.id);
    expect(on.writeEnabled).toBe(true);
    expect(on.connected).toBe(true); // key stored

    // No key supplied keeps the stored key; only the opt-in flips back off.
    await saveSettings(user.id, 'https://at.example.com', undefined, false, false, null);
    expect(await isAirtrailWriteEnabled(user.id)).toBe(false);
    expect((await getConnectionSettings(user.id)).connected).toBe(true);
  });
});

describe('airtrail saveSettings preserves its pre-existing NO-transaction asymmetry with Dawarich (Plan 3h Task 4, R7/Risks)', () => {
  it('ATC-TX-001: AirtrailService is constructed with no UnitOfWork at all — saveSettings has nothing to wrap its writes in', () => {
    // `DawarichService#saveSettings`'s equivalent DOES take a `UnitOfWork` and
    // wraps its writes in `uow.transactional`; AirtrailService's own
    // constructor (`UserAirtrailRepository`, `AuditService`, `AirtrailClient`) never
    // gained one during the Plan 3h Task 4 conversion — a structural
    // guarantee that a future edit re-introducing a transactional wrap here
    // would have to ALSO add a new constructor param to do it, not just
    // touch `saveSettings`'s body.
    const paramTypes = Reflect.getMetadata('design:paramtypes', AirtrailService) as unknown[] | undefined;
    expect(paramTypes).toBeDefined();
    expect(paramTypes!.map((p) => (p as { name?: string })?.name)).toEqual(['UserAirtrailRepository', 'AuditService', 'AirtrailClient']);
  });

  it('ATC-TX-002: the URL-cleared branch performs its two writes as genuinely separate repository calls, not one atomic statement', async () => {
    const { user } = createUser(db);
    await saveSettings(user.id, 'https://at.example.com', 'secret-key', false, false, null);

    const airtrailRepo = (svc as unknown as { airtrailRepo: UserAirtrailRepository }).airtrailRepo;
    const setSpy = vi.spyOn(airtrailRepo, 'setAirtrailSettings');
    const clearSpy = vi.spyOn(airtrailRepo, 'clearAirtrailApiKey');
    try {
      // Clearing the URL with no key left drops the key too (ATC4 then ATC5) —
      // TWO independent nativeUpdate calls, not a single transactional unit.
      await saveSettings(user.id, '', undefined, false, false, null);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
      // clearAirtrailApiKey only runs AFTER setAirtrailSettings's own write
      // resolved (sequential awaits in the service body, never Promise.all
      // or a single wrapped call) — the same "report, don't fix" asymmetry
      // the plan's Risks section flags.
      const setOrder = setSpy.mock.invocationCallOrder[0];
      const clearOrder = clearSpy.mock.invocationCallOrder[0];
      expect(clearOrder).toBeGreaterThan(setOrder);
    } finally {
      setSpy.mockRestore();
      clearSpy.mockRestore();
    }
  });
});
