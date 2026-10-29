/**
 * ServiceKeyService: when an installation registers, what it sends, how it
 * keeps, renews and gives up its key, and that nothing of it ever makes a
 * request wait. The store and the issuer are fakes; the clock, the proof of
 * work and the key format are the real ones.
 */
import { runningVersion } from '../../../../src/app-config';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { IssuerClient, IssuerError } from '../../../../src/nest/service-identity/issuer.client';
import { ServiceClock } from '../../../../src/nest/service-identity/service-clock';
import { keyFingerprint } from '../../../../src/nest/service-identity/service-identity.helpers';
import { ServiceKeyService } from '../../../../src/nest/service-identity/service-key.service';
import {
  EMPTY_KEY_STATE,
  ServiceKeyStore,
  type KeyState,
  type StoredIdentity,
} from '../../../../src/nest/service-identity/service-key.store';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { serviceKeyTokenFor } from '../../../helpers/service-keys';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

const DAY = 86_400;
const now = () => Math.floor(Date.now() / 1000);

const KEY = serviceKeyTokenFor({ i: 'installation-a', iat: now(), exp: now() + 90 * DAY });
const OTHER_KEY = serviceKeyTokenFor({ i: 'installation-b', iat: now(), exp: now() + 90 * DAY });
const RENEWED_KEY = serviceKeyTokenFor({ i: 'installation-a', iat: now(), exp: now() + 180 * DAY });

function fakeStore(initial: Partial<StoredIdentity> = {}) {
  let stored: StoredIdentity = { key: null, unreadable: false, state: EMPTY_KEY_STATE, ...initial };
  let raced: StoredIdentity['key'] = null;
  return {
    current: () => stored,
    /** The next claim finds this key already stored by another process. */
    raceWith: (key: StoredIdentity['key']) => {
      raced = key;
    },
    read: vi.fn(async () => stored),
    claim: vi.fn(async (key: NonNullable<StoredIdentity['key']>, state: KeyState) => {
      if (raced) stored = { key: raced, unreadable: false, state };
      else if (!stored.key && !stored.unreadable) stored = { key, unreadable: false, state };
      return stored;
    }),
    replace: vi.fn(async (key: NonNullable<StoredIdentity['key']>, state: KeyState) => {
      stored = { key, unreadable: false, state };
    }),
    writeState: vi.fn(async (state: KeyState) => {
      stored = { ...stored, state };
    }),
    dropKey: vi.fn(async (state: KeyState) => {
      stored = { key: null, unreadable: false, state };
    }),
    clear: vi.fn(async () => {
      stored = { key: null, unreadable: false, state: EMPTY_KEY_STATE };
    }),
  };
}

function fakeIssuer(issued = KEY) {
  const serverMs = () => Date.now();
  return {
    challenge: vi.fn(async () => ({
      body: { c: 'v1.challenge', alg: 'scrypt' as const, N: 2, r: 1, p: 1, bits: 0, expires_at: now() + 600 },
      serverMs: serverMs(),
    })),
    register: vi.fn(async () => ({
      body: { key: issued, exp: now() + 90 * DAY, renew_after: now() + 60 * DAY },
      serverMs: serverMs(),
    })),
    renew: vi.fn(async () => ({
      body: { key: RENEWED_KEY, exp: now() + 180 * DAY, renew_after: now() + 150 * DAY },
      serverMs: serverMs(),
    })),
    quota: vi.fn(),
  };
}

const testDb = createSnapshotTestDb();
let t: TestModule | null = null;

interface Setup {
  config?: Partial<{ mode: 'auto' | 'off'; key: string | null; hosts: string[] }>;
  places?: { enabled?: boolean; url?: string };
  isTest?: boolean;
  store?: ReturnType<typeof fakeStore>;
  issuer?: ReturnType<typeof fakeIssuer>;
}

async function build(setup: Setup = {}) {
  const store = setup.store ?? fakeStore();
  const issuer = setup.issuer ?? fakeIssuer();
  const config = { mode: 'auto' as const, key: null, hosts: ['places.liketrek.com'], ...setup.config };
  const maps = { trekPlacesEnabled: setup.places?.enabled ?? true, trekPlacesUrl: setup.places?.url };
  t = await createTestModule({
    db: testDb,
    imports: [],
    providers: [
      ServiceKeyService,
      ServiceClock,
      { provide: ServiceKeyStore, useValue: store },
      { provide: IssuerClient, useValue: issuer },
      { provide: servicesConfig.KEY, useValue: config },
      { provide: RuntimeEnvService, useValue: { env: () => ({ maps }), isTest: () => setup.isTest ?? false } },
    ],
  });
  return { keys: t.get(ServiceKeyService), store, issuer };
}

/** Lets the background work of the service run to its end. */
const settled = (keys: ServiceKeyService) => keys.whenIdle();

afterEach(async () => {
  vi.useRealTimers();
  await t?.close();
  t = null;
});

afterAll(() => testDb.close());

describe('registration', () => {
  it('SIKEYS-001: the first request goes out without a key, and the installation registers in the background', async () => {
    const { keys, store, issuer } = await build();
    expect(keys.bearer()).toBeNull();
    await settled(keys);
    expect(issuer.register).toHaveBeenCalledWith({ c: 'v1.challenge', nonce: '0', v: runningVersion() });
    expect(store.claim).toHaveBeenCalledTimes(1);
    expect(store.current().state.renewAfter).toBeGreaterThan(now());
    expect(keys.bearer()).toBe(KEY);
  });

  it('SIKEYS-002: registers once however many requests ask at the same time', async () => {
    const { keys, issuer } = await build();
    for (let i = 0; i < 5; i++) keys.bearer();
    await settled(keys);
    keys.bearer();
    await settled(keys);
    expect(issuer.challenge).toHaveBeenCalledTimes(1);
  });

  it('SIKEYS-003: keeps the key another process stored first', async () => {
    const store = fakeStore();
    const { keys } = await build({ store });
    store.raceWith({
      token: OTHER_KEY,
      kid: 'test',
      payload: { i: 'installation-b', iat: now(), exp: now() + DAY, q: 'std' },
    });
    keys.bearer();
    await settled(keys);
    expect(keys.bearer()).toBe(OTHER_KEY);
  });

  it('SIKEYS-004: registers anew without a word when the stored key cannot be read', async () => {
    const store = fakeStore({ unreadable: true });
    const { keys, issuer } = await build({ store });
    keys.bearer();
    await settled(keys);
    expect(issuer.register).toHaveBeenCalledTimes(1);
    expect(store.replace).toHaveBeenCalledTimes(1);
    expect(store.claim).not.toHaveBeenCalled();
    expect(keys.bearer()).toBe(KEY);
  });

  it('SIKEYS-005: a compose line that was only uncommented still counts as the public service', async () => {
    const { keys, issuer } = await build({ places: { url: 'HTTPS://Places.LikeTrek.com/' } });
    keys.bearer();
    await settled(keys);
    expect(issuer.register).toHaveBeenCalledTimes(1);
  });

  it('SIKEYS-006: backs off after a refusal, as long as the issuer asks', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const issuer = fakeIssuer();
    issuer.challenge.mockRejectedValueOnce(new IssuerError(429, 60_000, null));
    const { keys } = await build({ issuer });
    keys.bearer();
    await settled(keys);
    keys.bearer();
    await settled(keys);
    expect(issuer.challenge).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 61_000);
    keys.bearer();
    await settled(keys);
    expect(issuer.challenge).toHaveBeenCalledTimes(2);
    expect(keys.bearer()).toBe(KEY);
  });

  it('SIKEYS-007: a refused challenge is fetched once more at once, then left to the backoff', async () => {
    const issuer = fakeIssuer();
    issuer.register.mockRejectedValueOnce(new IssuerError(400, null, null));
    const { keys } = await build({ issuer });
    keys.bearer();
    await settled(keys);
    expect(issuer.challenge).toHaveBeenCalledTimes(2);
    expect(keys.bearer()).toBe(KEY);

    const refusing = fakeIssuer();
    refusing.register.mockRejectedValue(new IssuerError(400, null, null));
    await t?.close();
    const again = await build({ issuer: refusing });
    again.keys.bearer();
    await settled(again.keys);
    again.keys.bearer();
    await settled(again.keys);
    expect(refusing.challenge).toHaveBeenCalledTimes(2);
  });
});

describe('when it never registers', () => {
  it('SIKEYS-010: never under NODE_ENV=test', async () => {
    const { keys, issuer } = await build({ isTest: true });
    expect(keys.bearer()).toBeNull();
    await settled(keys);
    expect(issuer.challenge).not.toHaveBeenCalled();
    expect((await keys.snapshot()).state).toBe('legacy');
  });

  it('SIKEYS-011: never with the index switched off, nor with TREK_SERVICES=off', async () => {
    for (const setup of [{ places: { enabled: false } }, { config: { mode: 'off' as const } }]) {
      const { keys, issuer } = await build(setup);
      expect(keys.bearer()).toBeNull();
      expect((await keys.snapshot()).state).toBe('off');
      expect(issuer.challenge).not.toHaveBeenCalled();
      await t?.close();
      t = null;
    }
  });

  it('SIKEYS-012: never for a copy of the index the operator runs', async () => {
    const { keys, issuer } = await build({ places: { url: 'https://places.example.org' } });
    expect(keys.bearer()).toBeNull();
    expect((await keys.snapshot()).state).toBe('off');
    expect(issuer.challenge).not.toHaveBeenCalled();
  });

  it('SIKEYS-013: never for an allowlisted mirror, which gets the stored key but is no issuer', async () => {
    const store = fakeStore();
    const { keys, issuer } = await build({
      store,
      places: { url: 'https://mirror.example.org' },
      config: { hosts: ['places.liketrek.com', 'mirror.example.org'] },
    });
    keys.bearer();
    await settled(keys);
    expect(issuer.challenge).not.toHaveBeenCalled();
    expect((await keys.snapshot()).state).toBe('legacy');
  });

  it('SIKEYS-014: TREK_SERVICES_KEY wins over the stored key and turns registration off', async () => {
    const store = fakeStore({
      key: { token: OTHER_KEY, kid: 'test', payload: { i: 'b', iat: 1, exp: now() + DAY, q: 'std' } },
    });
    const { keys, issuer } = await build({ store, config: { key: KEY } });
    expect(keys.bearer()).toBe(KEY);
    await settled(keys);
    expect(issuer.challenge).not.toHaveBeenCalled();
    expect(await keys.snapshot()).toMatchObject({ state: 'connected', source: 'env', bearer: KEY });
  });
});

describe('refusals', () => {
  async function registered(setup: Setup = {}) {
    const built = await build(setup);
    built.keys.bearer();
    await settled(built.keys);
    expect(built.keys.bearer()).toBe(KEY);
    return built;
  }

  const tenMinutesLater = () => vi.setSystemTime(Date.now() + 10 * 60_000);

  it('SIKEYS-020: gives the key up only on the third 401 in a row, and asks again within six hours', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { keys, store, issuer } = await registered();
    keys.noteInvalid();
    tenMinutesLater();
    keys.noteInvalid();
    keys.noteAccepted();
    tenMinutesLater();
    keys.noteInvalid();
    tenMinutesLater();
    keys.noteInvalid();
    expect(store.dropKey).not.toHaveBeenCalled();
    tenMinutesLater();
    const before = Date.now();
    keys.noteInvalid();
    await settled(keys);
    expect(store.dropKey).toHaveBeenCalledTimes(1);
    const reregisterAt = store.current().state.reregisterAt ?? 0;
    expect(reregisterAt).toBeGreaterThanOrEqual(before);
    expect(reregisterAt).toBeLessThanOrEqual(Date.now() + 6 * 3_600_000);
    expect(keys.bearer()).toBeNull();
    await settled(keys);
    expect(issuer.challenge).toHaveBeenCalledTimes(Date.now() >= reregisterAt ? 2 : 1);
  });

  it('SIKEYS-021: a 401 without a key changes nothing', async () => {
    const { keys, store } = await build({ isTest: true });
    for (let i = 0; i < 5; i++) keys.noteInvalid();
    await settled(keys);
    expect(store.dropKey).not.toHaveBeenCalled();
  });

  it('SIKEYS-022: a revoked key stops going out and stays given up until an admin starts over', async () => {
    const { keys, store, issuer } = await registered();
    keys.noteRevoked();
    await settled(keys);
    expect(store.current().state.revoked).toBe(keyFingerprint(KEY));
    expect(keys.bearer()).toBeNull();
    await settled(keys);
    expect(issuer.challenge).toHaveBeenCalledTimes(1);
    expect((await keys.snapshot()).state).toBe('revoked');

    issuer.register.mockResolvedValueOnce({
      body: { key: OTHER_KEY, exp: now() + 90 * DAY, renew_after: now() + 60 * DAY },
      serverMs: Date.now(),
    });
    await keys.regenerate();
    await settled(keys);
    expect(store.clear).toHaveBeenCalledTimes(1);
    expect(keys.bearer()).toBe(OTHER_KEY);
  });

  it('SIKEYS-023: an admin cannot start over a key that comes from the environment, nor with the services off', async () => {
    const env = await build({ config: { key: KEY } });
    await expect(env.keys.regenerate()).rejects.toBeInstanceOf(DomainError);
    await t?.close();
    const off = await build({ config: { mode: 'off' } });
    await expect(off.keys.regenerate()).rejects.toMatchObject({ status: 409 });
  });

  it('SIKEYS-024: the refusals of one page full of searches count once', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { keys, store } = await registered();
    for (let i = 0; i < 6; i++) keys.noteInvalid();
    tenMinutesLater();
    for (let i = 0; i < 6; i++) keys.noteInvalid();
    await settled(keys);
    expect(store.dropKey).not.toHaveBeenCalled();
    expect(keys.bearer()).toBe(KEY);
  });
});

describe('renewal', () => {
  const oldKey = serviceKeyTokenFor({ i: 'installation-a', iat: now() - 61 * DAY, exp: now() + 29 * DAY });
  const stored = (state: Partial<KeyState> = {}) =>
    fakeStore({
      key: {
        token: oldKey,
        kid: 'test',
        payload: { i: 'installation-a', iat: now() - 61 * DAY, exp: now() + 29 * DAY, q: 'std' },
      },
      state: { ...EMPTY_KEY_STATE, ...state },
    });

  it('SIKEYS-030: leaves a key alone before it is due', async () => {
    const { keys, issuer } = await build({ store: stored({ renewAfter: now() + DAY }) });
    await keys.renewIfDue();
    expect(issuer.renew).not.toHaveBeenCalled();
  });

  it('SIKEYS-031: renews from day 60 with the old key, keeping the same installation', async () => {
    const store = stored();
    const { keys, issuer } = await build({ store });
    await keys.renewIfDue();
    expect(issuer.renew).toHaveBeenCalledWith(oldKey);
    expect(store.current().key?.token).toBe(RENEWED_KEY);
    expect(store.current().state.renewAfter).toBeGreaterThan(now() + 149 * DAY);
    expect(keys.bearer()).toBe(RENEWED_KEY);
  });

  it('SIKEYS-032: reads due-ness on the issuer clock, not on a server clock that is behind', async () => {
    const store = stored({ renewAfter: now() + DAY });
    const issuer = fakeIssuer();
    const { keys } = await build({ store, issuer });
    t?.get(ServiceClock).learn(Date.now() + 2 * DAY * 1000);
    await keys.renewIfDue();
    expect(issuer.renew).toHaveBeenCalledTimes(1);
  });

  it('SIKEYS-033: a refused renewal counts like a refused search, a revoked one freezes it, a network failure changes nothing', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const refused = fakeIssuer();
    refused.renew.mockRejectedValue(new IssuerError(401, null, null));
    const first = await build({ store: stored(), issuer: refused });
    await first.keys.renewIfDue();
    await first.keys.renewIfDue();
    expect(first.store.dropKey).not.toHaveBeenCalled();
    for (let i = 0; i < 2; i++) {
      vi.setSystemTime(Date.now() + 10 * 60_000);
      await first.keys.renewIfDue();
    }
    expect(first.store.dropKey).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    await t?.close();

    const revoked = fakeIssuer();
    revoked.renew.mockRejectedValueOnce(new IssuerError(403, null, null));
    const second = await build({ store: stored(), issuer: revoked });
    await second.keys.renewIfDue();
    expect(second.store.current().state.revoked).toBe(keyFingerprint(oldKey));
    await t?.close();

    const down = fakeIssuer();
    down.renew.mockRejectedValueOnce(new Error('fetch failed'));
    const third = await build({ store: stored(), issuer: down });
    await expect(third.keys.renewIfDue()).rejects.toThrow('fetch failed');
    expect(third.store.current().key?.token).toBe(oldKey);
  });

  it('SIKEYS-034: a key past its 30 days of grace registers anew instead', async () => {
    const lapsed = serviceKeyTokenFor({ i: 'installation-a', iat: now() - 130 * DAY, exp: now() - 40 * DAY });
    const store = fakeStore({
      key: {
        token: lapsed,
        kid: 'test',
        payload: { i: 'installation-a', iat: now() - 130 * DAY, exp: now() - 40 * DAY, q: 'std' },
      },
    });
    const { keys, issuer } = await build({ store });
    await keys.renewIfDue();
    expect(issuer.renew).not.toHaveBeenCalled();
    keys.bearer();
    await settled(keys);
    expect(store.replace).toHaveBeenCalledTimes(1);
    expect(keys.bearer()).toBe(KEY);
  });

  it('SIKEYS-035: never renews a key from the environment', async () => {
    const { keys, issuer } = await build({ store: stored(), config: { key: KEY } });
    await keys.renewIfDue();
    expect(issuer.renew).not.toHaveBeenCalled();
  });

  it('SIKEYS-036: a due key is renewed on the next request, not only by the daily check', async () => {
    const store = stored();
    const { keys, issuer } = await build({ store });
    expect(keys.bearer()).toBe(oldKey);
    await settled(keys);
    expect(issuer.renew).toHaveBeenCalledWith(oldKey);
    expect(keys.bearer()).toBe(RENEWED_KEY);
  });

  it('SIKEYS-037: an expired key within its grace stays home, and the next request renews it', async () => {
    const expired = serviceKeyTokenFor({ i: 'installation-a', iat: now() - 95 * DAY, exp: now() - 5 * DAY });
    const store = fakeStore({
      key: {
        token: expired,
        kid: 'test',
        payload: { i: 'installation-a', iat: now() - 95 * DAY, exp: now() - 5 * DAY, q: 'std' },
      },
    });
    const { keys, issuer } = await build({ store });
    expect(keys.bearer()).toBeNull();
    await settled(keys);
    expect(issuer.renew).toHaveBeenCalledWith(expired);
    expect(issuer.register).not.toHaveBeenCalled();
    expect(keys.bearer()).toBe(RENEWED_KEY);
  });

  it('SIKEYS-038: after a failed renewal the requests wait for the backoff instead of asking again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const issuer = fakeIssuer();
    issuer.renew.mockRejectedValueOnce(new Error('fetch failed'));
    const { keys } = await build({ store: stored(), issuer });
    keys.bearer();
    await settled(keys);
    keys.bearer();
    await settled(keys);
    expect(issuer.renew).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 5 * 60_000);
    keys.bearer();
    await settled(keys);
    expect(issuer.renew).toHaveBeenCalledTimes(2);
    expect(keys.bearer()).toBe(RENEWED_KEY);
  });
});
