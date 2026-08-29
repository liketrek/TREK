import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import { AirtrailLinkService } from '../../../src/nest/integrations/airtrail-link.service';
import { AirtrailSyncService } from '../../../src/nest/integrations/airtrail-sync.service';
import { AirtrailAuthError } from '../../../src/nest/integrations/airtrail.client';
import type { AirtrailClient } from '../../../src/nest/integrations/airtrail.client';
import type { AirtrailService } from '../../../src/nest/integrations/airtrail.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { ReservationsReadRepository } from '../../../src/nest/reservations/reservations-read.repository';
import type { ReservationsService } from '../../../src/nest/reservations/reservations.service';

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The #1240 write gate: pushReservationToAirtrail must NOT write to AirTrail unless
 * the flight's owner has opted in (airtrail_write_enabled). Collaborators are stubbed
 * so the test exercises just the gate + payload wiring.
 *
 * They used to be module mocks over free functions. The fold made them injected
 * services, so the stubs go through the constructor now — which is the point:
 * the collaborators are visible in the signature instead of resolved by path.
 * Only the mapper stays a module mock, because it stayed free functions.
 */
vi.mock('../../../src/nest/integrations/airtrail.mapper', () => ({
  canonicalHash: vi.fn(() => 'hash'),
  mapFlightToReservation: vi.fn(() => ({})),
  entityCode: (e: any) => e?.icao || e?.iata || null,
}));

const linkedRow = { id: 5, trip_id: 9, external_id: '42', external_owner_user_id: 7, sync_enabled: 1 };

const runSpy = vi.fn();
const getFlight = vi.fn();
const listFlights = vi.fn();
const saveFlight = vi.fn();
const getReservation = vi.fn();
const getReservationWithJoins = vi.fn();
const updateReservation = vi.fn();
const isAirtrailWriteEnabled = vi.fn();
const getAirtrailCredentials = vi.fn();

/** Routes reads by SQL, exactly as the old db.prepare stub did. */
let dbGet: (sql: string) => unknown;
let dbAll: (sql: string) => unknown[];

function makeServices(): { link: AirtrailLinkService; sync: AirtrailSyncService } {
  const db = {
    get: (sql: string) => dbGet(sql),
    all: (sql: string) => dbAll(sql),
    run: (sql: string, ...args: unknown[]) => {
      runSpy(sql, args);
      return {};
    },
  } as unknown as DatabaseService;

  const client = { getFlight, listFlights, saveFlight } as unknown as AirtrailClient;
  const airtrail = { isAirtrailWriteEnabled, getAirtrailCredentials } as unknown as AirtrailService;
  // The push and the shared link lifecycle live on AirtrailLinkService since the
  // core/pull split (which retired airtrail.bridge); the pull delegates to it.
  const link = new AirtrailLinkService(
    db,
    { broadcast: vi.fn() } as unknown as RealtimeService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
    { getReservationWithJoins } as unknown as ReservationsReadRepository,
    client,
    airtrail,
  );
  const sync = new AirtrailSyncService(
    db,
    link,
    { getReservation, update: updateReservation } as unknown as ReservationsService,
    client,
    airtrail,
  );
  return { link, sync };
}

let svc: { link: AirtrailLinkService; sync: AirtrailSyncService };

beforeEach(() => {
  vi.clearAllMocks();
  // Global sync setting, the linked reservation row and the endpoint count the
  // multi-leg guard checks (#1535) — two = plain from/to.
  dbGet = (sql: string) => {
    if (sql.includes('app_settings')) return { value: 'true' };
    if (sql.includes('FROM reservation_endpoints')) return { n: 2 };
    if (sql.includes('FROM reservations')) return { ...linkedRow };
    return undefined;
  };
  dbAll = () => [];
  svc = makeServices();

  getAirtrailCredentials.mockReturnValue({ baseUrl: 'https://at.example', apiKey: 'k', allowInsecureTls: false });
  // GET returns AirTrail-owned detail TREK doesn't model — must survive the writeback.
  getFlight.mockResolvedValue({
    id: 42,
    from: { iata: 'JFK' },
    to: { iata: 'LHR' },
    seats: [],
    departureTerminal: '7',
  });
  saveFlight.mockResolvedValue({ id: 42 });
  getReservationWithJoins.mockReturnValue({
    external_id: '42',
    reservation_time: '2021-09-01T19:00',
    reservation_end_time: '2021-09-02T08:00',
    notes: 'note',
    metadata: JSON.stringify({}),
    endpoints: [
      { role: 'from', code: 'JFK' },
      { role: 'to', code: 'LHR' },
    ],
  });
});

describe('pushReservationToAirtrail write gate (#1240)', () => {
  it('does nothing — and does not detach — when the owner has not opted in', async () => {
    isAirtrailWriteEnabled.mockReturnValue(false);
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(getFlight).not.toHaveBeenCalled();
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).not.toHaveBeenCalled(); // no detach, no hash write — pure no-op
  });

  it('writes back, preserving AirTrail-owned fields, when the owner has opted in', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).toHaveBeenCalledTimes(1);
    const payload = saveFlight.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.departureTerminal).toBe('7'); // spread preserved the unmanaged field
    expect(payload.from).toBe('JFK'); // TREK-managed field still applied as a code
  });

  it('#1535 detaches instead of pushing when the reservation grew extra stops', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    dbGet = (sql: string) => {
      if (sql.includes('app_settings')) return { value: 'true' };
      if (sql.includes('FROM reservation_endpoints')) return { n: 3 }; // from + stop + to
      if (sql.includes('FROM reservations')) return { ...linkedRow };
      return undefined;
    };
    await svc.link.pushReservationToAirtrail(5, 9);
    // Pushing would rewrite the single AirTrail flight to span the whole route.
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
  });

  it('#1535 detaches on metadata.legs even when the endpoint count is not available', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    getReservationWithJoins.mockReturnValue({
      external_id: '42',
      reservation_time: '2021-09-01T19:00',
      metadata: JSON.stringify({
        legs: [
          { from: 'BRU', to: 'HEL' },
          { from: 'HEL', to: 'JFK' },
        ],
      }),
      endpoints: [],
    });
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
  });

  it('detaches when the owner key stopped working, rather than retrying forever', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    getFlight.mockRejectedValue(new AirtrailAuthError('invalid key'));
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
  });

  it('detaches when the flight is gone from AirTrail — the same as a remote delete', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    getFlight.mockResolvedValue(null);
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
  });
});

describe('inbound sync multi-leg guard (#1535)', () => {
  function withLinkedRow(endpointCount: number) {
    dbGet = (sql: string) => {
      if (sql.includes('app_settings')) return { value: 'true' };
      if (sql.includes('FROM reservation_endpoints')) return { n: endpointCount };
      return undefined;
    };
    dbAll = (sql: string) =>
      sql.includes('sync_enabled = 1') ? [{ id: 5, trip_id: 9, external_id: '42', external_hash: 'stale' }] : [];
    svc = makeServices();
  }

  it('detaches instead of flattening when a linked reservation grew extra stops locally', async () => {
    // A remote change is pending (stored hash differs from canonicalHash's
    // 'hash'), but the local reservation has become multi-leg — applying the
    // single-flight shape would flatten the layover chain.
    withLinkedRow(3);
    listFlights.mockResolvedValue([{ id: 42 }]);
    getReservation.mockReturnValue({ id: 5, metadata: JSON.stringify({}) });

    const { changed } = await svc.sync.runAirtrailSyncForUser(7);
    expect(updateReservation).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
    expect(changed).toBe(1);
  });

  it('still applies a remote change to a plain single-leg reservation', async () => {
    withLinkedRow(2);
    listFlights.mockResolvedValue([{ id: 42 }]);
    getReservation.mockReturnValue({ id: 5, metadata: JSON.stringify({}) });

    await svc.sync.runAirtrailSyncForUser(7);
    expect(updateReservation).toHaveBeenCalledTimes(1);
    expect(runSpy).not.toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), expect.anything());
  });

  it('detaches a flight that vanished from AirTrail, keeping the TREK row', async () => {
    withLinkedRow(2);
    listFlights.mockResolvedValue([]); // the linked id is no longer there
    const { changed } = await svc.sync.runAirtrailSyncForUser(7);
    expect(updateReservation).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
    expect(changed).toBe(1);
  });

  it('leaves a disconnected owner alone rather than detaching their rows', async () => {
    withLinkedRow(2);
    getAirtrailCredentials.mockReturnValue(null);
    const { changed } = await svc.sync.runAirtrailSyncForUser(7);
    expect(listFlights).not.toHaveBeenCalled();
    expect(runSpy).not.toHaveBeenCalled();
    expect(changed).toBe(0);
  });
});
