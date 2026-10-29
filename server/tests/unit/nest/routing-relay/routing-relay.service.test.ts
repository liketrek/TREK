/**
 * RoutingRelayService: the TREK services' Valhalla asked for a user. The key
 * goes along only when the identity hands one over for that host, the body is
 * held to the shared contract, every question counts against the user's
 * and the installation's minute, Valhalla's answer comes back untouched, and
 * a host that failed is left alone for a while. The upstream behind
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
const upstream = (status: number, body: string, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { 'content-type': 'application/json', ...extra } });

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
  vi.useRealTimers();
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

  it('RELAY-006: holds every user to 60 questions a minute, each user apart', async () => {
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async () => upstream(200, '{}'));
    for (let i = 0; i < 60; i++) await relay.ask(1, 'height', { shape: [{ lat: 47, lon: 11 }] });
    const refused = await relay.ask(1, 'route', ROUTE).catch((err: unknown) => err);
    expect(refused).toBeInstanceOf(DomainError);
    expect(refused).toMatchObject({ status: 429, message: 'Too many routing requests, try again in a minute' });
    expect((await relay.ask(2, 'route', ROUTE)).status).toBe(200);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(61);
  });

  it('RELAY-007: holds the whole installation to 100 questions a minute and says when to come back', async () => {
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async () => upstream(200, '{}'));
    const height = { shape: [{ lat: 47, lon: 11 }] };
    for (let i = 0; i < 60; i++) await relay.ask(1, 'height', height);
    for (let i = 0; i < 40; i++) await relay.ask(2, 'height', height);
    const refused = await relay.ask(3, 'route', ROUTE);
    expect(refused).toMatchObject({ status: 429, retryAfter: '60' });
    expect(JSON.parse(refused.body.toString())).toEqual({ error: 'Too many routing requests on this instance' });
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(100);
  });

  it('RELAY-008: answers 502 where the host does not answer or sends more than it passes on', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    vi.mocked(safeFetchAdminConfigured).mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    await expect(relay.ask(1, 'route', ROUTE)).rejects.toMatchObject({
      status: 502,
      message: 'The TREK routing service did not answer',
    });
    vi.setSystemTime(new Date('2026-10-29T10:01:01Z'));
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(200, 'x'.repeat(8 * 1024 * 1024 + 1)));
    await expect(relay.ask(1, 'route', ROUTE)).rejects.toMatchObject({ status: 502 });
  });

  it('RELAY-009: after a host that hung, the next question is answered 503 at once, and asked again after the rest', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    vi.mocked(safeFetchAdminConfigured).mockRejectedValueOnce(
      new DOMException('The operation was aborted due to timeout', 'TimeoutError'),
    );
    await expect(relay.ask(1, 'height', { shape: [{ lat: 47, lon: 11 }] })).rejects.toMatchObject({ status: 502 });

    const resting = await relay.ask(1, 'height', { shape: [{ lat: 47.1, lon: 11 }] });
    expect(resting).toMatchObject({ status: 503, retryAfter: '60' });
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-10-29T10:01:01Z'));
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(200, '{}'));
    expect((await relay.ask(1, 'route', ROUTE)).status).toBe(200);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(2);
  });

  it('RELAY-010: passes an error of the host on and rests after it', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(504, '{"error":"gateway"}'));
    expect((await relay.ask(1, 'route', ROUTE)).status).toBe(504);
    expect((await relay.ask(1, 'route', ROUTE)).status).toBe(503);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
  });

  it("RELAY-011: follows a spent allowance's Retry-After, at most an hour of it, and passes it on", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      upstream(429, '{"error":"day"}', { 'retry-after': '50400' }),
    );
    expect(await relay.ask(1, 'route', ROUTE)).toMatchObject({ status: 429, retryAfter: '50400' });
    expect((await relay.ask(1, 'route', ROUTE)).retryAfter).toBe('3600');

    vi.setSystemTime(new Date('2026-10-29T11:00:01Z'));
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(
      upstream(429, '{"error":"minute"}', { 'retry-after': 'Thu, 29 Oct 2026 11:00:21 GMT' }),
    );
    expect((await relay.ask(1, 'route', ROUTE)).status).toBe(429);
    expect((await relay.ask(1, 'route', ROUTE)).retryAfter).toBe('20');

    vi.setSystemTime(new Date('2026-10-29T11:00:22Z'));
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(429, '{}', { 'retry-after': 'soon' }));
    await relay.ask(1, 'route', ROUTE);
    expect((await relay.ask(1, 'route', ROUTE)).retryAfter).toBe('60');
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(3);
  });

  it('RELAY-015: rests a minute after a spent allowance that names no wait, and invents none for it', async () => {
    vi.mocked(safeFetchAdminConfigured).mockResolvedValueOnce(upstream(429, '{"error":"spent"}'));
    const spent = await relay.ask(1, 'route', ROUTE);
    expect(spent.status).toBe(429);
    expect(spent).not.toHaveProperty('retryAfter');
    expect((await relay.ask(1, 'route', ROUTE)).retryAfter).toBe('60');
  });

  it('RELAY-012: waits ten seconds for a route and thirty for a description, unless told otherwise', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    vi.mocked(safeFetchAdminConfigured).mockImplementation(async () => upstream(200, '{}'));
    await relay.ask(1, 'route', ROUTE);
    await relay.ask(1, 'trace_attributes', { encoded_polyline: 'abc', costing: 'pedestrian' });
    await relay.ask(1, 'height', { shape: [{ lat: 47, lon: 11 }] }, 5000);
    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([10_000, 30_000, 5000]);
    timeout.mockRestore();
  });
});

describe('RoutingRelayService.trekValhalla and serves', () => {
  it('RELAY-013: names the TREK Valhalla only while there is a key to take there', () => {
    expect(relay.trekValhalla()).toBe('https://valhalla.liketrek.com');
    identity.headersFor.mockReturnValueOnce({});
    expect(relay.trekValhalla()).toBeNull();
    config.mode = 'off';
    expect(relay.trekValhalla()).toBeNull();
  });

  it('RELAY-014: knows its own address, with or without a trailing slash, and no other', () => {
    expect(relay.serves('https://valhalla.liketrek.com/')).toBe(true);
    expect(relay.serves('https://valhalla1.openstreetmap.de')).toBe(false);
  });
});
