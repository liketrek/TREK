import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { RateLimitService } from '../../../../src/nest/common/rate-limit.service';
import { ReservationsReadService } from '../../../../src/nest/reservations/reservations-read.service';
import { WalletPassModule } from '../../../../src/nest/wallet-pass/wallet-pass.module';
import {
  filenameOf,
  googleSignerUrl,
  parseMetadata,
  WalletPassService,
} from '../../../../src/nest/wallet-pass/wallet-pass.service';
import { loadWalletWords, walletLanguage } from '../../../../src/nest/wallet-pass/wallet-pass.words';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetchAdminConfigured } = vi.hoisted(() => ({ safeFetchAdminConfigured: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  safeFetchAdminConfigured,
}));

const PASS = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('rest of the zip')]);
const ROW = {
  id: 7,
  trip_id: 42,
  title: 'Hotel Granvia Kyoto',
  type: 'hotel',
  status: 'confirmed',
  reservation_time: '2027-04-02T15:00',
  reservation_end_time: '2027-04-06T11:00',
  confirmation_number: 'HG-48213',
  location: null,
  created_at: '2026-11-01 10:00:00',
  metadata: '{"check_in_time":"15:00"}',
  place_id: 3,
  endpoints: [],
};

const db = createSnapshotTestDb();
const config = {
  mode: 'auto' as 'auto' | 'off',
  key: null,
  hosts: [],
  walletPassUrl: 'https://push.liketrek.com/v1/wallet/pass',
};
const reservations = {
  getReservationWithJoins: vi.fn(),
  passContext: vi.fn(),
};
const rateLimit = { check: vi.fn() };
let t: TestModule;
let service: WalletPassService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [WalletPassModule],
    overrides: [
      { provide: servicesConfig.KEY, useValue: config },
      { provide: ReservationsReadService, useValue: reservations },
      { provide: RateLimitService, useValue: rateLimit },
    ],
  });
  service = t.moduleRef.get(WalletPassService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** The service from the module, with its collaborators set to a hotel booking that may have a pass. */
function make(mode: 'auto' | 'off' = 'auto') {
  config.mode = mode;
  // The read is trip-scoped: a booking asked for under another trip is not found.
  reservations.getReservationWithJoins
    .mockReset()
    .mockImplementation(async (_id: number, tripId: number) => (tripId === ROW.trip_id ? { ...ROW } : undefined));
  reservations.passContext.mockReset().mockImplementation(async () => ({
    trip_title: 'Japan 2027',
    place_lat: 34.985,
    place_lng: 135.758,
    place_name: 'Hotel Granvia Kyoto',
  }));
  rateLimit.check.mockReset().mockImplementation(async () => true);
  return { service, reservations, rateLimit };
}

const signerAnswers = (
  status: number,
  body: ConstructorParameters<typeof Response>[0],
  type = 'application/vnd.apple.pkpass',
) => safeFetchAdminConfigured.mockResolvedValue(new Response(body, { status, headers: { 'content-type': type } }));

async function refusal(promise: Promise<unknown>): Promise<number> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(DomainError);
    return (err as DomainError).getStatus();
  }
  throw new Error('expected a refusal');
}

beforeEach(() => safeFetchAdminConfigured.mockReset());

describe('WalletPassService', () => {
  it('WALLET-S-001: sends the booking to the signer and hands back the signed pass', async () => {
    const { service, reservations } = make();
    signerAnswers(200, PASS);
    const pass = await service.passFor(1, 42, 7, 'de');
    expect(pass.bytes.equals(PASS)).toBe(true);
    expect(pass.filename).toBe('Hotel-Granvia-Kyoto.pkpass');
    expect(reservations.passContext).toHaveBeenCalledWith(7, 42);

    const [url, init] = safeFetchAdminConfigured.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://push.liketrek.com/v1/wallet/pass');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      kind: 'hotel',
      trip: 'Japan 2027',
      locale: 'de-DE',
      start: '2027-04-02T15:00:00+09:00',
    });
    expect(body.details[0].label).toBe('Check-in');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('WALLET-S-002: is off with the TREK services, and asks nobody', async () => {
    const { service } = make('off');
    expect(service.enabled()).toBe(false);
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(404);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('WALLET-S-003: a booking of another trip, a missing one or one without a date is refused', async () => {
    const { service, reservations } = make();
    expect(await refusal(service.passFor(1, 99, 7, 'en'))).toBe(404);
    reservations.getReservationWithJoins.mockResolvedValueOnce(undefined);
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(404);
    reservations.getReservationWithJoins.mockResolvedValueOnce({ ...ROW, reservation_time: null, place_id: null });
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(422);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('WALLET-S-004: a user asking too often is slowed down before anything is read', async () => {
    const { service, rateLimit, reservations } = make();
    rateLimit.check.mockResolvedValueOnce(false);
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(429);
    expect(reservations.getReservationWithJoins).not.toHaveBeenCalled();
  });

  it('WALLET-S-005: the signer down, refusing, busy or answering something else is a clear error', async () => {
    const { service } = make();
    safeFetchAdminConfigured.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(502);
    signerAnswers(400, '{"error":"title: required"}', 'application/json');
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(502);
    signerAnswers(429, '');
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(429);
    signerAnswers(200, '<html>captive portal</html>', 'application/vnd.apple.pkpass');
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(502);
    signerAnswers(200, PASS, 'text/html');
    expect(await refusal(service.passFor(1, 42, 7, 'en'))).toBe(502);
  });

  it('WALLET-S-006: a place without coordinates is no location; metadata reads in any shape', async () => {
    const { service, reservations } = make();
    reservations.passContext.mockResolvedValueOnce({
      trip_title: null,
      place_lat: null,
      place_lng: null,
      place_name: null,
    });
    signerAnswers(200, PASS);
    await service.passFor(1, 42, 7, 'en');
    const body = JSON.parse(String((safeFetchAdminConfigured.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.location).toBeUndefined();

    expect(parseMetadata('{"seat":"1A"}')).toEqual({ seat: '1A' });
    expect(parseMetadata({ seat: '1A' })).toEqual({ seat: '1A' });
    expect(parseMetadata('[1]')).toEqual({});
    expect(parseMetadata('not json')).toEqual({});
    expect(parseMetadata(null)).toEqual({});
  });

  it('WALLET-S-007: file names and languages stay safe', async () => {
    expect(filenameOf('Hôtel "Le Nid" / Paris')).toBe('Hotel-Le-Nid-Paris');
    expect(filenameOf('***')).toBe('booking');
    expect(walletLanguage('de')).toBe('de');
    expect(walletLanguage('../../etc')).toBe('en');
    expect(walletLanguage(undefined)).toBe('en');
    const words = await loadWalletWords('de');
    expect(words.locale).toBe('de-DE');
    expect(words.seat).toBe('Sitzplatz');
    expect((await loadWalletWords('xx')).seat).toBe('Seat');
  });

  it('WALLET-S-008: Google Wallet gets the same request at the Google route of the signer and answers its save link', async () => {
    make();
    const saveUrl = 'https://pay.google.com/gp/v/save/eyJhbGciOi.payload.sig';
    signerAnswers(200, JSON.stringify({ saveUrl }), 'application/json');
    await expect(service.googleSaveUrlFor(1, 42, 7, 'de')).resolves.toBe(saveUrl);
    const [url, init] = safeFetchAdminConfigured.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://push.liketrek.com/v1/wallet/google');
    const body = JSON.parse(String(init.body));
    expect(body.kind).toBe('hotel');
    expect(body.title).toBe('Hotel Granvia Kyoto');
  });

  it('WALLET-S-009: Google Wallet refusals: off, not set up yet, busy, or a link that is not from Google', async () => {
    make('off');
    expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(404);
    make();
    signerAnswers(404, 'not found', 'text/plain');
    expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(404);
    signerAnswers(429, 'slow down', 'text/plain');
    expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(429);
    signerAnswers(200, JSON.stringify({ saveUrl: 'https://evil.example/save' }), 'application/json');
    expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(502);
    signerAnswers(200, 'not json', 'application/json');
    expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(502);
    safeFetchAdminConfigured.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(502);
    expect(await refusal(service.googleSaveUrlFor(1, 99, 7, 'en'))).toBe(404);
    expect(reservations.getReservationWithJoins).toHaveBeenLastCalledWith(7, 99);
  });

  it('WALLET-S-010: the Google route sits beside /pass, query kept; any other signer URL has none', async () => {
    expect(googleSignerUrl('https://push.liketrek.com/v1/wallet/pass')).toBe(
      'https://push.liketrek.com/v1/wallet/google',
    );
    expect(googleSignerUrl('https://signer.example/v1/wallet/pass/?key=x')).toBe(
      'https://signer.example/v1/wallet/google?key=x',
    );
    expect(googleSignerUrl('https://signer.example/v1/sign')).toBeNull();
    expect(googleSignerUrl('not a url')).toBeNull();
    make();
    config.walletPassUrl = 'https://signer.example/v1/sign';
    try {
      expect(await refusal(service.googleSaveUrlFor(1, 42, 7, 'en'))).toBe(404);
      expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
    } finally {
      config.walletPassUrl = 'https://push.liketrek.com/v1/wallet/pass';
    }
  });

  it('WALLET-S-011: Google Wallet counts as available once the signer has the route, asked once in ten minutes', async () => {
    const probe = (s: number) => safeFetchAdminConfigured.mockResolvedValueOnce(new Response('', { status: s }));
    const fresh = () => ((service as unknown as { googleProbe: unknown }).googleProbe = null);
    make('off');
    fresh();
    expect(await service.googleAvailable()).toBe(false);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
    make();
    fresh();
    probe(404);
    expect(await service.googleAvailable()).toBe(false);
    expect(await service.googleAvailable()).toBe(false);
    expect(safeFetchAdminConfigured).toHaveBeenCalledTimes(1);
    expect((safeFetchAdminConfigured.mock.calls[0] as [string, RequestInit])[0]).toBe(
      'https://push.liketrek.com/v1/wallet/google',
    );
    fresh();
    probe(405);
    expect(await service.googleAvailable()).toBe(true);
    fresh();
    safeFetchAdminConfigured.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await service.googleAvailable()).toBe(false);
    fresh();
  });
});
