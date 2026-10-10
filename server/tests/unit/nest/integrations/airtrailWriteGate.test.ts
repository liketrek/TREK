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
vi.mock('../../../../src/nest/integrations/airtrail.mapper', () => ({
  canonicalHash: vi.fn(() => 'hash'),
  mapFlightToReservation: vi.fn(() => ({})),
  entityCode: (e: any) => e?.icao || e?.iata || null,
}));

import { AirtrailLinkService } from '../../../../src/nest/integrations/airtrail-link.service';
import { AirtrailAuthError } from '../../../../src/nest/integrations/airtrail.client';
import type { ReservationsRepository } from '../../../../src/db/repositories/Reservations.repository';
import type { ReservationEndpointsRepository } from '../../../../src/db/repositories/ReservationEndpoints.repository';
import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import type { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { AirtrailSyncService } from '../../../../src/nest/integrations/airtrail-sync.service';
import type { ReservationsService } from '../../../../src/nest/reservations/reservations.service';
import type { ReservationsReadService } from '../../../../src/nest/reservations/reservations-read.service';
import type { AirtrailClient } from '../../../../src/nest/integrations/airtrail.client';
import type { AirtrailService } from '../../../../src/nest/integrations/airtrail.service';

const linkedRow = { id: 5, trip_id: 9, external_id: '42', external_owner_user_id: 7, sync_enabled: 1 };

const getFlight = vi.fn();
const listFlights = vi.fn();
const saveFlight = vi.fn();
const getReservation = vi.fn();
const getReservationWithJoins = vi.fn();
const updateReservation = vi.fn();
const isAirtrailWriteEnabled = vi.fn();
const getAirtrailCredentials = vi.fn();

// The Plan 3h Task 4 conversion's repository-shaped seams, replacing the old
// "route reads by SQL text" db.prepare stub: same fixtures, same test intent
// (the write gate + the #1535 multi-leg guard), asserted against the
// repository METHOD now instead of a literal SQL fragment.
const getValueMock = vi.fn<(key: string) => string | null>();
const countEndpointsMock = vi.fn<(filter: unknown) => number>();
const findAirtrailLinkedMock = vi.fn<(id: number) => typeof linkedRow | undefined>();
const detachSpy = vi.fn<(id: number) => void>();
const setAirtrailSyncStampSpy = vi.fn();
const listSyncCandidatesMock = vi.fn<(ownerId: number) => unknown[]>();

function makeServices(): { link: AirtrailLinkService; sync: AirtrailSyncService } {
  const reservationsRepo = {
    findAirtrailLinked: (id: number) => Promise.resolve(findAirtrailLinkedMock(id)),
    setAirtrailSyncDisabled: (id: number) => { detachSpy(id); return Promise.resolve(); },
    setAirtrailSyncStamp: (...args: unknown[]) => { setAirtrailSyncStampSpy(...args); return Promise.resolve(); },
    listAirtrailSyncCandidatesForOwner: (ownerId: number) => Promise.resolve(listSyncCandidatesMock(ownerId)),
  } as unknown as ReservationsRepository;
  const endpointsRepo = {
    count: (filter: unknown) => Promise.resolve(countEndpointsMock(filter)),
  } as unknown as ReservationEndpointsRepository;
  const appSettings = {
    getValue: (key: string) => Promise.resolve(getValueMock(key)),
  } as unknown as AppSettingsRepository;

  const client = { getFlight, listFlights, saveFlight } as unknown as AirtrailClient;
  const airtrail = { isAirtrailWriteEnabled, getAirtrailCredentials } as unknown as AirtrailService;
  // The push and the shared link lifecycle live on AirtrailLinkService since the
  // core/pull split (which retired airtrail.bridge); the pull delegates to it.
  const link = new AirtrailLinkService(
    reservationsRepo,
    endpointsRepo,
    appSettings,
    { broadcast: vi.fn() } as unknown as RealtimeService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
    { getReservationWithJoins } as unknown as ReservationsReadService,
    client,
    airtrail,
  );
  const sync = new AirtrailSyncService(
    reservationsRepo,
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
  getValueMock.mockReturnValue('true');
  countEndpointsMock.mockReturnValue(2);
  findAirtrailLinkedMock.mockReturnValue({ ...linkedRow });
  listSyncCandidatesMock.mockReturnValue([]);
  svc = makeServices();

  getAirtrailCredentials.mockReturnValue({ baseUrl: 'https://at.example', apiKey: 'k', allowInsecureTls: false });
  // GET returns AirTrail-owned detail TREK doesn't model — must survive the writeback.
  getFlight.mockResolvedValue({ id: 42, from: { iata: 'JFK' }, to: { iata: 'LHR' }, seats: [], departureTerminal: '7' });
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
    expect(detachSpy).not.toHaveBeenCalled(); // no detach, no hash write — pure no-op
    expect(setAirtrailSyncStampSpy).not.toHaveBeenCalled();
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
    countEndpointsMock.mockReturnValue(3); // from + stop + to
    await svc.link.pushReservationToAirtrail(5, 9);
    // Pushing would rewrite the single AirTrail flight to span the whole route.
    expect(saveFlight).not.toHaveBeenCalled();
    expect(detachSpy).toHaveBeenCalledWith(5);
  });

  it('#1535 detaches on metadata.legs even when the endpoint count is not available', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    getReservationWithJoins.mockReturnValue({
      external_id: '42',
      reservation_time: '2021-09-01T19:00',
      metadata: JSON.stringify({ legs: [{ from: 'BRU', to: 'HEL' }, { from: 'HEL', to: 'JFK' }] }),
      endpoints: [],
    });
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(detachSpy).toHaveBeenCalledWith(5);
  });

  it('detaches when the owner key stopped working, rather than retrying forever', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    getFlight.mockRejectedValue(new AirtrailAuthError('invalid key'));
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(detachSpy).toHaveBeenCalledWith(5);
  });

  it('detaches when the flight is gone from AirTrail — the same as a remote delete', async () => {
    isAirtrailWriteEnabled.mockReturnValue(true);
    getFlight.mockResolvedValue(null);
    await svc.link.pushReservationToAirtrail(5, 9);
    expect(saveFlight).not.toHaveBeenCalled();
    expect(detachSpy).toHaveBeenCalledWith(5);
  });
});

describe('inbound sync multi-leg guard (#1535)', () => {
  function withLinkedRow(endpointCount: number) {
    getValueMock.mockReturnValue('true');
    countEndpointsMock.mockReturnValue(endpointCount);
    listSyncCandidatesMock.mockReturnValue([{ id: 5, trip_id: 9, external_id: '42', external_hash: 'stale' }]);
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
    expect(detachSpy).toHaveBeenCalledWith(5);
    expect(changed).toBe(1);
  });

  it('still applies a remote change to a plain single-leg reservation', async () => {
    withLinkedRow(2);
    listFlights.mockResolvedValue([{ id: 42 }]);
    getReservation.mockReturnValue({ id: 5, metadata: JSON.stringify({}) });

    await svc.sync.runAirtrailSyncForUser(7);
    expect(updateReservation).toHaveBeenCalledTimes(1);
    expect(detachSpy).not.toHaveBeenCalled();
  });

  it('detaches a flight that vanished from AirTrail, keeping the TREK row', async () => {
    withLinkedRow(2);
    listFlights.mockResolvedValue([]); // the linked id is no longer there
    const { changed } = await svc.sync.runAirtrailSyncForUser(7);
    expect(updateReservation).not.toHaveBeenCalled();
    expect(detachSpy).toHaveBeenCalledWith(5);
    expect(changed).toBe(1);
  });

  it('leaves a disconnected owner alone rather than detaching their rows', async () => {
    withLinkedRow(2);
    getAirtrailCredentials.mockReturnValue(null);
    const { changed } = await svc.sync.runAirtrailSyncForUser(7);
    expect(listFlights).not.toHaveBeenCalled();
    expect(detachSpy).not.toHaveBeenCalled();
    expect(changed).toBe(0);
  });
});
