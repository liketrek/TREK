/**
 * RoutingRelayService: the TREK services' Valhalla asked for a user. The key
 * goes along only when the identity hands one over for that host, the body is
 * held to the shared contract, every question counts against the user's
 * minute, and Valhalla's answer comes back untouched. The upstream behind
 * safeFetchAdminConfigured is a stub.
 */
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { RateLimitModule } from '../../../../src/nest/common/rate-limit.module';
import { RateLimitService } from '../../../../src/nest/common/rate-limit.service';
import { RoutingRelayService } from '../../../../src/nest/routing-relay/routing-relay.service';
import { ServiceIdentityPort } from '../../../../src/nest/service-identity/service-identity.interface';
import { safeFetchAdminConfigured } from '../../../../src/utils/ssrfGuard';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchAdminConfigured: vi.fn() }));

const config = {
  mode: 'auto' as 'auto' | 'off',
  key: null,
  hosts: ['places.liketrek.com', 'valhalla.liketrek.com'],
  valhallaUrl: 'https://valhalla.liketrek.com',
};
const identity = {
  headersFor: vi.fn((): Record<string, string> => ({ 'User-Agent': 'TREK/5.1.0', Authorization: 'Bearer tk1.k.p.s' })),
  observe: vi.fn(),
};
const ROUTE = {
  locations: [
    { lat: 48.2, lon: 16.37, radius: 50 },
    { lat: 47.8, lon: 13.04, radius: 50 },
  ],
  costing: 'auto',
  costing_options: { auto: { use_tolls: 0 } },
};
const upstream = (status: number, body: string, type = 'application/json') =>
  new Response(body, { status, headers: { 'content-type': type } });

const testDb = createSnapshotTestDb();
let t: TestModule;
let relay: RoutingRelayService;

beforeEach(async () => {
  vi.mocked(safeFetchAdminConfigured).mockReset();
  identity.headersFor.mockClear();
  identity.observe.mockClear();
  config.mode = 'auto';
  t = await createTestModule({
    db: testDb,
    imports: [RateLimitModule],
    providers: [
      RoutingRelayService,
      { provide: servicesConfig.KEY, useValue: config },
      { provide: ServiceIdentityPort, useValue: identity },
    ],
  });
  relay = t.get(RoutingRelayService);
  await t.get(RateLimitService).reset();
});

afterEach(async () => {
  await t.close();
});

afterAll(() => testDb.close());

describe('RoutingRelayService.ask', () => {
  it('RELAY-001: posts the route to the configured Valhalla with the key and hands the answer back untouched', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(200, '{"trip":{"legs":[]}}'));
    const answer = await relay.ask(1, 'route', ROUTE);
    expect(answer).toEqual({
      status: 200,
      contentType: 'application/json',
      body: Buffer.from('{"trip":{"legs":[]}}'),
    });
    const [url, init, redirects] = vi.mocked(safeFetchAdminConfigured).mock.calls[0];
    expect(url).toBe('https://valhalla.liketrek.com/route');
    expect(redirects).toBe(0);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tk1.k.p.s');
    expect(JSON.parse(String(init?.body))).toEqual(ROUTE);
    const [observed] = identity.observe.mock.calls[0] as unknown as [URL];
    expect(observed.href).toBe('https://valhalla.liketrek.com/route');
  });

  it('RELAY-002: passes a refusal on with its status, so the planner reads it as it reads Valhalla', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(400, '{"error_code":442}'));
    const answer = await relay.ask(1, 'route', ROUTE);
    expect(answer.status).toBe(400);
    expect(answer.body.toString()).toBe('{"error_code":442}');
  });

  it('RELAY-003: sends a description of a line as a polyline', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(200, '{"edges":[]}'));
    const shape = Array.from({ length: 4000 }, (_, i) => ({ lat: 47 + i / 1e4, lon: 11.123456789 }));
    await relay.ask(1, 'trace_attributes', { shape, costing: 'pedestrian', shape_match: 'map_snap' });
    const [url, init] = vi.mocked(safeFetchAdminConfigured).mock.calls[0];
    expect(url).toBe('https://valhalla.liketrek.com/trace_attributes');
    const sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(sent).not.toHaveProperty('shape');
    expect(typeof sent.encoded_polyline).toBe('string');
  });

  it('RELAY-004: refuses a body the contract does not take before asking anything', async () => {
    const tooMany = { ...ROUTE, locations: Array.from({ length: 21 }, () => ROUTE.locations[0]) };
    await expect(relay.ask(1, 'route', tooMany)).rejects.toMatchObject({ status: 400 });
    await expect(relay.ask(1, 'height', { shape: [] })).rejects.toBeInstanceOf(DomainError);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('RELAY-005: answers 503 without a key and while the services are off, and asks nothing', async () => {
    identity.headersFor.mockReturnValueOnce({ 'User-Agent': 'TREK/5.1.0' });
    await expect(relay.ask(1, 'route', ROUTE)).rejects.toMatchObject({ status: 503 });
    config.mode = 'off';
    await expect(relay.ask(2, 'route', ROUTE)).rejects.toMatchObject({ status: 503 });
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('RELAY-006: holds every user to 120 questions a minute, each user apart', async () => {
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async () => upstream(200, '{}'));
    for (let i = 0; i < 120; i++) await relay.ask(1, 'height', { shape: [{ lat: 47, lon: 11 }] });
    const refused = await relay.ask(1, 'route', ROUTE).catch((err: unknown) => err);
    expect(refused).toBeInstanceOf(DomainError);
    expect(refused).toMatchObject({ status: 429, message: 'Too many routing requests, try again in a minute' });
    expect((await relay.ask(2, 'route', ROUTE)).status).toBe(200);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(121);
  });

  it('RELAY-007: answers 502 where the host does not answer or sends more than it passes on', async () => {
    vi.mocked(safeFetchAdminConfigured).mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    await expect(relay.ask(1, 'route', ROUTE)).rejects.toMatchObject({
      status: 502,
      message: 'The TREK routing service did not answer',
    });
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(200, 'x'.repeat(8 * 1024 * 1024 + 1)));
    await expect(relay.ask(1, 'route', ROUTE)).rejects.toMatchObject({ status: 502 });
  });
});

describe('RoutingRelayService.trekValhalla and serves', () => {
  it('RELAY-010: names the TREK Valhalla only while there is a key to take there', () => {
    expect(relay.trekValhalla()).toBe('https://valhalla.liketrek.com');
    identity.headersFor.mockReturnValueOnce({});
    expect(relay.trekValhalla()).toBeNull();
    config.mode = 'off';
    expect(relay.trekValhalla()).toBeNull();
  });

  it('RELAY-011: knows its own address, with or without a trailing slash, and no other', () => {
    expect(relay.serves('https://valhalla.liketrek.com/')).toBe(true);
    expect(relay.serves('https://valhalla1.openstreetmap.de')).toBe(false);
  });
});
