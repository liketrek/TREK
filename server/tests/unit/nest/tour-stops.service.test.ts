/**
 * P6: TourStopsService takes a stop into a saved hike or city walk, and out
 * again, through the paths update_tour and save_tour_change save with. Those
 * are stubs here (their own suites run them against a db): this suite pins
 * what they are handed, the refusals before them and the answer.
 */
import { DomainError } from '../../../src/nest/common/domain-error';
import { HikePlanService } from '../../../src/nest/tours/hike-plan.service';
import { proposalIdOf } from '../../../src/nest/tours/tour-change-proposal';
import { TourChangeSaveService } from '../../../src/nest/tours/tour-change-save.service';
import { TourStopsService } from '../../../src/nest/tours/tour-stops.service';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { Test } from '@nestjs/testing';
import type { TourDetailResponse, TourWaypoint } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// TOUR-STOPS-SVC-001 to TOUR-STOPS-SVC-009

const wp = (key: string, lat: number, role: TourWaypoint['role'], name: string): TourWaypoint => ({
  key,
  lat,
  lng: 11.0,
  role,
  sequence: 0,
  name,
});
const START = wp('start1', 47.0, 'start', 'Parking');
const HUT = wp('hut111', 47.01, 'via', 'Hut');
const END = wp('summit', 47.02, 'end', 'Summit');
const SPRING = wp('spring', 47.015, 'via', 'Spring');

function detail(tourType: string, waypoints: TourWaypoint[], revision = 3, extra: Record<string, unknown> = {}) {
  return {
    tour: {
      place_id: 64,
      name: 'Herzogstand',
      tour_type: tourType,
      revision,
      distance: 8.2,
      duration: 190,
      has_waypoints: true,
      ...extra,
    },
    waypoints,
  } as unknown as TourDetailResponse;
}

const getTour = vi.fn<(tripId: string, placeId: string) => Promise<TourDetailResponse>>();
const savedLine = vi.fn(async () => [
  [47.0, 11.0],
  [47.01, 11.0],
  [47.02, 11.0],
]);
const update = vi.fn();
const save = vi.fn();
let service: TourStopsService;

beforeEach(async () => {
  getTour.mockReset();
  update.mockReset().mockResolvedValue({ ...detail('hike', [START, HUT, SPRING, END], 4), route: { planned: true } });
  save.mockReset().mockResolvedValue({ saved: true });
  const moduleRef = await Test.createTestingModule({
    providers: [
      TourStopsService,
      { provide: ToursService, useValue: { getTour, savedLine } },
      { provide: HikePlanService, useValue: { update } },
      { provide: TourChangeSaveService, useValue: { save } },
    ],
  }).compile();
  service = moduleRef.get(TourStopsService);
});

const stop = { lat: 47.015, lng: 11.0, name: 'Spring', poi_category: 'drinking_water' as const };

describe('a stop taken into a hike', () => {
  it('TOUR-STOPS-SVC-001: goes after the last point before it, and the hike is planned through the new points', async () => {
    getTour.mockResolvedValue(detail('hike', [START, HUT, END]));
    const answer = await service.insert(7, 5, { placeId: 64, expected_revision: 3, stop });
    expect(update).toHaveBeenCalledWith(7, 5, {
      placeId: 64,
      expected_revision: 3,
      waypoints: [
        { lat: 47.0, lng: 11.0, name: 'Parking' },
        { lat: 47.01, lng: 11.0, name: 'Hut' },
        { lat: 47.015, lng: 11.0, name: 'Spring', poi_category: 'drinking_water' },
        { lat: 47.02, lng: 11.0, name: 'Summit' },
      ],
    });
    expect(answer.tour).toMatchObject({ place_id: 64, tour_type: 'hike', revision: 4 });
    expect(answer.stop).toMatchObject({ key: 'spring', after_key: 'hut111', after_name: 'Hut' });
    expect(answer.before).toEqual({ distance_km: 8.2, minutes: 190 });
  });

  it('TOUR-STOPS-SVC-002: is refused against a revision the hike moved past, before anything is planned', async () => {
    getTour.mockResolvedValue(detail('hike', [START, HUT, END], 5));
    await expect(service.insert(7, 5, { placeId: 64, expected_revision: 3, stop })).rejects.toThrow(
      /changed in the meantime/,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('TOUR-STOPS-SVC-003: refuses another tour type and a recorded track without points of its own', async () => {
    getTour.mockResolvedValue(detail('bike', [START, END]));
    await expect(service.insert(7, 5, { placeId: 64, expected_revision: 3, stop })).rejects.toThrow(
      /hike or a city walk/,
    );
    getTour.mockResolvedValue(detail('hike', [START, END], 3, { has_waypoints: false }));
    await expect(service.insert(7, 5, { placeId: 64, expected_revision: 3, stop })).rejects.toThrow(/recorded track/);
    expect(update).not.toHaveBeenCalled();
  });

  it('TOUR-STOPS-SVC-004: names the reason when the point named takes no stop', async () => {
    getTour.mockResolvedValue(detail('hike', [START, HUT, END]));
    const refused = service.insert(7, 5, { placeId: 64, expected_revision: 3, stop, after_key: 'nope00' });
    await expect(refused).rejects.toBeInstanceOf(DomainError);
    await expect(refused).rejects.toThrow(/no point with the key/);
  });
});

describe('a stop taken into a city walk', () => {
  it('TOUR-STOPS-SVC-005: is saved as one add after the station, with the proposal id a save checks', async () => {
    getTour
      .mockResolvedValueOnce(detail('walk', [START, HUT, END]))
      .mockResolvedValueOnce(detail('walk', [START, HUT, SPRING, END], 4));
    const answer = await service.insert(7, 5, {
      placeId: 64,
      expected_revision: 3,
      stop: { lat: 47.015, lng: 11.0, name: 'Spring', opening_hours: 'Mo-Su 09:00-18:00' },
      after_key: 'hut111',
    });
    const changes = [
      {
        op: 'add',
        after_key: 'hut111',
        station: { lat: 47.015, lng: 11.0, name: 'Spring', opening_hours: 'Mo-Su 09:00-18:00' },
      },
    ];
    expect(save).toHaveBeenCalledWith(5, 64, 7, {
      changes,
      expected_revision: 3,
      proposal_id: proposalIdOf({ tripId: 5, placeId: 64, revision: 3, changes: changes as never }),
      confirmed: true,
    });
    expect(update).not.toHaveBeenCalled();
    expect(answer.tour).toMatchObject({ tour_type: 'walk', revision: 4 });
    expect(answer.stop.key).toBe('spring');
  });

  it('TOUR-STOPS-SVC-006: refuses a walk whose stations have no keys yet', async () => {
    getTour.mockResolvedValue(detail('walk', [START, { ...HUT, key: undefined }, END]));
    const refused = service.insert(7, 5, { placeId: 64, expected_revision: 3, stop });
    await expect(refused).rejects.toThrow(/no keys yet/);
    expect(save).not.toHaveBeenCalled();
  });
});

describe('a stop taken out', () => {
  it('TOUR-STOPS-SVC-007: plans a hike through the points left and names what it took out', async () => {
    getTour.mockResolvedValue(detail('hike', [START, HUT, SPRING, END], 4));
    update.mockResolvedValue({ ...detail('hike', [START, HUT, END], 5), route: { planned: true } });
    const answer = await service.remove(7, 5, { placeId: 64, expected_revision: 4, key: 'spring' });
    expect(update.mock.calls[0]?.[2]).toMatchObject({ placeId: 64, expected_revision: 4 });
    expect(update.mock.calls[0]?.[2].waypoints).toHaveLength(3);
    expect(answer.removed).toEqual({
      key: 'spring',
      lat: 47.015,
      lng: 11.0,
      name: 'Spring',
      poi_category: null,
      after_key: 'hut111',
    });
    expect(answer.tour.revision).toBe(5);
  });

  it('TOUR-STOPS-SVC-008: removes a station of a city walk through the save of one change', async () => {
    getTour
      .mockResolvedValueOnce(detail('walk', [START, HUT, SPRING, END], 4))
      .mockResolvedValueOnce(detail('walk', [START, HUT, END], 5));
    await service.remove(7, 5, { placeId: 64, expected_revision: 4, key: 'spring' });
    expect(save.mock.calls[0]?.[3]).toMatchObject({ changes: [{ op: 'remove', key: 'spring' }], expected_revision: 4 });
  });

  it('TOUR-STOPS-SVC-009: keeps the start of the tour', async () => {
    getTour.mockResolvedValue(detail('hike', [START, HUT, END]));
    await expect(service.remove(7, 5, { placeId: 64, expected_revision: 3, key: 'start1' })).rejects.toThrow(/start/);
    expect(update).not.toHaveBeenCalled();
  });
});
