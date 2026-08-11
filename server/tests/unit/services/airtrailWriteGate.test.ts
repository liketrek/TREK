import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The #1240 write gate: pushReservationToAirtrail must NOT write to AirTrail unless
 * the flight's owner has opted in (airtrail_write_enabled). Collaborators are mocked
 * so the test exercises just the gate + payload wiring.
 */

vi.mock('../../../src/db/database', () => ({ db: { prepare: vi.fn() } }));
vi.mock('../../../src/services/adminService', () => ({ isAddonEnabled: vi.fn(() => true) }));
vi.mock('../../../src/services/auditLog', () => ({ logError: vi.fn(), logInfo: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../../src/services/reservationService', () => ({
  getReservation: vi.fn(),
  getReservationWithJoins: vi.fn(),
  updateReservation: vi.fn(),
}));
vi.mock('../../../src/services/airtrail/airtrailClient', () => ({
  AirtrailAuthError: class AirtrailAuthError extends Error {},
  getFlight: vi.fn(),
  listFlights: vi.fn(),
  saveFlight: vi.fn(),
}));
vi.mock('../../../src/services/airtrail/airtrailMapper', () => ({
  canonicalHash: vi.fn(() => 'hash'),
  mapFlightToReservation: vi.fn(() => ({})),
  entityCode: (e: any) => e?.icao || e?.iata || null,
}));
vi.mock('../../../src/services/airtrail/airtrailService', () => ({
  isAirtrailWriteEnabled: vi.fn(),
  getAirtrailCredentials: vi.fn(),
}));

import { pushReservationToAirtrail, runAirtrailSyncForUser } from '../../../src/services/airtrail/airtrailSync';
import { db } from '../../../src/db/database';
import { getReservation, getReservationWithJoins, updateReservation } from '../../../src/services/reservationService';
import { getFlight, listFlights, saveFlight } from '../../../src/services/airtrail/airtrailClient';
import { isAirtrailWriteEnabled, getAirtrailCredentials } from '../../../src/services/airtrail/airtrailService';

const linkedRow = { id: 5, trip_id: 9, external_id: '42', external_owner_user_id: 7, sync_enabled: 1 };
const runSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Route db reads: global sync setting, the linked reservation row and the
  // endpoint count the multi-leg guard checks (#1535) — two = plain from/to.
  (db.prepare as any).mockImplementation((sql: string) => ({
    get: () => {
      if (sql.includes('app_settings')) return { value: 'true' };
      if (sql.includes('FROM reservation_endpoints')) return { n: 2 };
      if (sql.includes('FROM reservations')) return { ...linkedRow };
      return undefined;
    },
    run: (...args: any[]) => {
      runSpy(sql, args);
      return {};
    },
    all: () => [],
  }));
  (getAirtrailCredentials as any).mockReturnValue({ baseUrl: 'https://at.example', apiKey: 'k', allowInsecureTls: false });
  // GET returns AirTrail-owned detail TREK doesn't model — must survive the writeback.
  (getFlight as any).mockResolvedValue({ id: 42, from: { iata: 'JFK' }, to: { iata: 'LHR' }, seats: [], departureTerminal: '7' });
  (saveFlight as any).mockResolvedValue({ id: 42 });
  (getReservationWithJoins as any).mockReturnValue({
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
    (isAirtrailWriteEnabled as any).mockReturnValue(false);
    await pushReservationToAirtrail(5, 9);
    expect(getFlight).not.toHaveBeenCalled();
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).not.toHaveBeenCalled(); // no detach, no hash write — pure no-op
  });

  it('writes back, preserving AirTrail-owned fields, when the owner has opted in', async () => {
    (isAirtrailWriteEnabled as any).mockReturnValue(true);
    await pushReservationToAirtrail(5, 9);
    expect(saveFlight).toHaveBeenCalledTimes(1);
    const payload = (saveFlight as any).mock.calls[0][1];
    expect(payload.departureTerminal).toBe('7'); // spread preserved the unmanaged field
    expect(payload.from).toBe('JFK'); // TREK-managed field still applied as a code
  });

  it('#1535 detaches instead of pushing when the reservation grew extra stops', async () => {
    (isAirtrailWriteEnabled as any).mockReturnValue(true);
    (db.prepare as any).mockImplementation((sql: string) => ({
      get: () => {
        if (sql.includes('app_settings')) return { value: 'true' };
        if (sql.includes('FROM reservation_endpoints')) return { n: 3 }; // from + stop + to
        if (sql.includes('FROM reservations')) return { ...linkedRow };
        return undefined;
      },
      run: (...args: any[]) => {
        runSpy(sql, args);
        return {};
      },
      all: () => [],
    }));
    await pushReservationToAirtrail(5, 9);
    // Pushing would rewrite the single AirTrail flight to span the whole route.
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
  });

  it('#1535 detaches on metadata.legs even when the endpoint count is not available', async () => {
    (isAirtrailWriteEnabled as any).mockReturnValue(true);
    (getReservationWithJoins as any).mockReturnValue({
      external_id: '42',
      reservation_time: '2021-09-01T19:00',
      metadata: JSON.stringify({ legs: [{ from: 'BRU', to: 'HEL' }, { from: 'HEL', to: 'JFK' }] }),
      endpoints: [],
    });
    await pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
  });
});

describe('inbound sync multi-leg guard (#1535)', () => {
  it('detaches instead of flattening when a linked reservation grew extra stops locally', async () => {
    // A remote change is pending (stored hash differs from canonicalHash's
    // 'hash'), but the local reservation has become multi-leg — applying the
    // single-flight shape would flatten the layover chain.
    (db.prepare as any).mockImplementation((sql: string) => ({
      get: () => {
        if (sql.includes('app_settings')) return { value: 'true' };
        if (sql.includes('FROM reservation_endpoints')) return { n: 3 };
        return undefined;
      },
      all: () => (sql.includes('sync_enabled = 1') ? [{ id: 5, trip_id: 9, external_id: '42', external_hash: 'stale' }] : []),
      run: (...args: any[]) => {
        runSpy(sql, args);
        return {};
      },
    }));
    (listFlights as any).mockResolvedValue([{ id: 42 }]);
    (getReservation as any).mockReturnValue({ id: 5, metadata: JSON.stringify({}) });

    const { changed } = await runAirtrailSyncForUser(7);
    expect(updateReservation).not.toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), [5]);
    expect(changed).toBe(1);
  });

  it('still applies a remote change to a plain single-leg reservation', async () => {
    (db.prepare as any).mockImplementation((sql: string) => ({
      get: () => {
        if (sql.includes('app_settings')) return { value: 'true' };
        if (sql.includes('FROM reservation_endpoints')) return { n: 2 };
        return undefined;
      },
      all: () => (sql.includes('sync_enabled = 1') ? [{ id: 5, trip_id: 9, external_id: '42', external_hash: 'stale' }] : []),
      run: (...args: any[]) => {
        runSpy(sql, args);
        return {};
      },
    }));
    (listFlights as any).mockResolvedValue([{ id: 42 }]);
    (getReservation as any).mockReturnValue({ id: 5, metadata: JSON.stringify({}) });

    await runAirtrailSyncForUser(7);
    expect(updateReservation).toHaveBeenCalledTimes(1);
    expect(runSpy).not.toHaveBeenCalledWith(expect.stringContaining('sync_enabled = 0'), expect.anything());
  });
});
