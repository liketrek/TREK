// FE-SVCID-REPO-001 to FE-SVCID-REPO-003
import type { ServiceIdentityStatus } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { OnlineOnlyError } from './onlineOnly';
import { serviceIdentityRepo } from './serviceIdentityRepo';

const STATUS: ServiceIdentityStatus = {
  state: 'connected',
  tier: 'std',
  keySource: 'registered',
  services: [
    {
      service: 'places',
      inUse: true,
      quota: { limit: 10_000, used: 1, remaining: 9_999, resetAt: '2026-10-30T00:00:00.000Z' },
    },
  ],
  lastSeenAt: null,
};

beforeEach(() => _resetNetworkMode());
afterEach(() => _resetNetworkMode());

describe('serviceIdentityRepo', () => {
  it('FE-SVCID-REPO-001: reads and parses the status', async () => {
    server.use(http.get('/api/admin/service-identity', () => HttpResponse.json(STATUS)));
    await expect(serviceIdentityRepo.status()).resolves.toEqual(STATUS);
  });

  it('FE-SVCID-REPO-002: asks for a new identity and refuses an answer of another shape', async () => {
    server.use(
      http.post('/api/admin/service-identity/regenerate', () => HttpResponse.json({ ...STATUS, state: 'registering' }))
    );
    await expect(serviceIdentityRepo.regenerate()).resolves.toMatchObject({ state: 'registering' });
    server.use(http.get('/api/admin/service-identity', () => HttpResponse.json({ state: 'gold' })));
    await expect(serviceIdentityRepo.status()).rejects.toThrow();
  });

  it('FE-SVCID-REPO-003: asks nothing while offline', async () => {
    setForcedOffline(true);
    await expect(serviceIdentityRepo.status()).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(serviceIdentityRepo.regenerate()).rejects.toBeInstanceOf(OnlineOnlyError);
  });
});
