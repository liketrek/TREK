/**
 * PublicApiService: the shaping of sparse rows and the two early answers.
 *
 * The e2e suite drives the service against real SQL with well-filled rows. This
 * file pins what that cannot reach cheaply: a caller with no trips is answered
 * without a second query, a trip that is not readable (or vanished between the
 * access check and the read) comes back as null, and every optional column the
 * database leaves empty reaches the wire as an explicit `null` rather than a
 * missing key, so a consumer can rely on the field being there.
 */
import type { BucketListRepository } from '../../../src/db/repositories/BucketList.repository';
import type { DayNotesRepository } from '../../../src/db/repositories/DayNotes.repository';
import type { DaysRepository } from '../../../src/db/repositories/Days.repository';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';
import type { ReservationsRepository } from '../../../src/db/repositories/Reservations.repository';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import { PublicApiService } from '../../../src/nest/public-api/public-api.service';
import type { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';

import { describe, it, expect, vi } from 'vitest';

/** A trip row as the summary query returns it when nothing optional was filled in. */
const BARE_TRIP = { id: 7, title: 'Somewhere', is_archived: 0 };

function makeService(
  overrides: {
    accessibleIds?: number[];
    accessible?: boolean;
    summary?: unknown;
    days?: unknown[];
    assignedPlaces?: unknown[];
    dayNotes?: unknown[];
    scheduledReservations?: unknown[];
    unscheduledReservations?: unknown[];
    unplannedPlaces?: unknown[];
    accommodations?: unknown[];
    bucketList?: unknown[];
  } = {},
) {
  const membership = { listAccessibleTripIds: vi.fn().mockResolvedValue(overrides.accessibleIds ?? []) };
  const trips = {
    listSummariesByIds: vi.fn().mockResolvedValue([BARE_TRIP]),
    findAccessible: vi.fn().mockResolvedValue(overrides.accessible ?? true),
    findSummaryById: vi.fn().mockResolvedValue('summary' in overrides ? overrides.summary : BARE_TRIP),
    listTravellerUsernames: vi.fn().mockResolvedValue([]),
  };
  const reservations = {
    listScheduledForPublicApi: vi.fn().mockResolvedValue(overrides.scheduledReservations ?? []),
    listUnscheduledForPublicApi: vi.fn().mockResolvedValue(overrides.unscheduledReservations ?? []),
    listUnplannedPlacesForPublicApi: vi.fn().mockResolvedValue(overrides.unplannedPlaces ?? []),
    listAccommodationsForPublicApi: vi.fn().mockResolvedValue(overrides.accommodations ?? []),
  };
  const days = { listForPublicApi: vi.fn().mockResolvedValue(overrides.days ?? []) };
  const places = { listAssignedForPublicApi: vi.fn().mockResolvedValue(overrides.assignedPlaces ?? []) };
  const dayNotes = { listForPublicApi: vi.fn().mockResolvedValue(overrides.dayNotes ?? []) };
  const bucketList = { listForPublicApi: vi.fn().mockResolvedValue(overrides.bucketList ?? []) };
  const service = new PublicApiService(
    membership as unknown as TripMembershipService,
    trips as unknown as TripsRepository,
    reservations as unknown as ReservationsRepository,
    days as unknown as DaysRepository,
    places as unknown as PlacesRepository,
    dayNotes as unknown as DayNotesRepository,
    bucketList as unknown as BucketListRepository,
  );
  return { service, membership, trips, reservations };
}

describe('PublicApiService', () => {
  it('PUBAPI-SVC-001: a caller with no trips gets an empty list without a summary query', async () => {
    const { service, trips } = makeService({ accessibleIds: [] });
    await expect(service.listTrips(1)).resolves.toEqual([]);
    expect(trips.listSummariesByIds).not.toHaveBeenCalled();
  });

  it('PUBAPI-SVC-002: a trip the caller may not read is null, and nothing else is queried', async () => {
    const { service, trips } = makeService({ accessible: false });
    await expect(service.getTrip(7, 1, ['days'])).resolves.toBeNull();
    expect(trips.findSummaryById).not.toHaveBeenCalled();
  });

  it('PUBAPI-SVC-003: a trip deleted between the access check and the read is null, not a crash', async () => {
    const { service } = makeService({ summary: null });
    await expect(service.getTrip(7, 1, ['days'])).resolves.toBeNull();
  });

  it('PUBAPI-SVC-004: a bare trip summary carries every optional field as an explicit null', async () => {
    const { service } = makeService({ accessibleIds: [7] });
    const [trip] = await service.listTrips(1);
    expect(trip).toEqual({
      id: 7,
      title: 'Somewhere',
      description: null,
      start_date: null,
      end_date: null,
      currency: null,
      archived: false,
      updated_at: null,
    });
  });

  it('PUBAPI-SVC-005: sparse places, notes and bookings on a day report null instead of dropping the key', async () => {
    const { service } = makeService({
      days: [{ id: 70, day_number: 1, date: null }],
      assignedPlaces: [{ day_id: 70, name: 'Market' }],
      dayNotes: [{ day_id: 70, text: 'Bring cash' }],
      scheduledReservations: [{ day_id: 70 }],
    });
    const trip = await service.getTrip(7, 1, ['days', 'places', 'notes', 'reservations']);
    const day = trip!.days![0]!;
    expect(day.places).toEqual([
      {
        name: 'Market',
        address: null,
        lat: null,
        lng: null,
        time: null,
        end_time: null,
        duration_minutes: null,
        category: null,
        notes: null,
        transport_mode: null,
      },
    ]);
    expect(day.day_notes).toEqual([{ text: 'Bring cash', time: null }]);
    expect(day.reservations).toEqual([
      { type: null, title: null, location: null, time: null, end_time: null, status: null, notes: null },
    ]);
    // Every key is present on the wire, not just equal to null after a lookup.
    expect(Object.keys(day.places[0]!)).toHaveLength(10);
    expect(Object.keys(day.reservations[0]!)).toHaveLength(7);
  });

  it('PUBAPI-SVC-006: an accommodation without dates or details is still listed, every field null', async () => {
    const { service } = makeService({ accommodations: [{}] });
    const trip = await service.getTrip(7, 1, ['accommodations']);
    expect(trip!.accommodations).toEqual([
      {
        name: null,
        address: null,
        lat: null,
        lng: null,
        start_date: null,
        end_date: null,
        check_in: null,
        check_out: null,
        notes: null,
      },
    ]);
    // Accommodations alone do not imply the day spine.
    expect(trip!.days).toBeUndefined();
  });

  it('PUBAPI-SVC-007: a bucket list entry with only a name reports the rest as null', async () => {
    const { service } = makeService({ bucketList: [{ name: 'Lofoten' }] });
    await expect(service.listBucketList(1)).resolves.toEqual([
      { name: 'Lofoten', lat: null, lng: null, country_code: null, notes: null, target_date: null },
    ]);
  });
});
