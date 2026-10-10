// FE-PLANNER-BKONMAP-001 to FE-PLANNER-BKONMAP-009
import { describe, it, expect, vi } from 'vitest';
import { buildReservation } from '../../../../tests/helpers/factories';
import type { ReservationEndpoint } from '../../../types';
import { canShowOnMap, hasRoute, showReservationOnMap, type ShowOnMapDeps } from './showOnMap';

function ep(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return { role: 'from', sequence: 0, name: 'Stop', code: null, lat: 35.6, lng: 139.7, timezone: null, local_time: null, local_date: null, ...over };
}

const route = [ep({ role: 'from' }), ep({ role: 'to', sequence: 1, lat: 34.9, lng: 135.7 })];

function deps(visible: number[] = []): ShowOnMapDeps {
  return { visibleConnections: visible, toggleConnection: vi.fn(), selectDay: vi.fn(), selectPlace: vi.fn(), openPlan: vi.fn() };
}

describe('hasRoute', () => {
  it('FE-PLANNER-BKONMAP-001: two endpoints with coordinates make a route', () => {
    expect(hasRoute(buildReservation({ endpoints: route }))).toBe(true);
  });

  it('FE-PLANNER-BKONMAP-002: endpoints without usable coordinates, one endpoint or none do not', () => {
    expect(hasRoute(buildReservation({ endpoints: [route[0], ep({ role: 'to', sequence: 1, lat: Number.NaN })] }))).toBe(false);
    expect(hasRoute(buildReservation({ endpoints: [route[0]] }))).toBe(false);
    expect(hasRoute(buildReservation({}))).toBe(false);
  });
});

describe('showReservationOnMap', () => {
  it('FE-PLANNER-BKONMAP-003: a transport switches its route on and opens the plan on its day', () => {
    const d = deps();
    showReservationOnMap(buildReservation({ id: 41, type: 'train', day_id: 7, endpoints: route }), d);
    expect(d.toggleConnection).toHaveBeenCalledWith(41);
    expect(d.selectDay).toHaveBeenCalledWith(7);
    expect(d.openPlan).toHaveBeenCalled();
    expect(d.selectPlace).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BKONMAP-004: without a start day it opens on the end day, or on no day', () => {
    const d = deps();
    showReservationOnMap(buildReservation({ id: 42, type: 'train', end_day_id: 8, endpoints: route }), d);
    expect(d.selectDay).toHaveBeenCalledWith(8);
    const e = deps();
    showReservationOnMap(buildReservation({ id: 43, type: 'train', endpoints: route }), e);
    expect(e.selectDay).toHaveBeenCalledWith(null);
  });

  it('FE-PLANNER-BKONMAP-005: pressed again while the route is drawn, it only switches the route off', () => {
    const d = deps([44]);
    showReservationOnMap(buildReservation({ id: 44, type: 'flight', day_id: 7, endpoints: route }), d);
    expect(d.toggleConnection).toHaveBeenCalledWith(44);
    expect(d.selectDay).not.toHaveBeenCalled();
    expect(d.openPlan).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BKONMAP-006: a booking with a place opens the plan on that place and its day', () => {
    const d = deps();
    showReservationOnMap(buildReservation({ type: 'restaurant', place_id: 90, day_id: 3 }), d);
    expect(d.selectDay).toHaveBeenCalledWith(3);
    expect(d.selectPlace).toHaveBeenCalledWith(90);
    expect(d.openPlan).toHaveBeenCalled();
    const e = deps();
    showReservationOnMap(buildReservation({ type: 'restaurant', place_id: 91 }), e);
    expect(e.selectDay).toHaveBeenCalledWith(null);
  });

  it('FE-PLANNER-BKONMAP-007: a hotel uses its accommodation place and first night, falling back to its own', () => {
    const d = deps();
    showReservationOnMap(buildReservation({ type: 'hotel', accommodation_place_id: 55, place_id: 56, accommodation_start_day_id: 4, day_id: 5 }), d);
    expect(d.selectPlace).toHaveBeenCalledWith(55);
    expect(d.selectDay).toHaveBeenCalledWith(4);
    const e = deps();
    showReservationOnMap(buildReservation({ type: 'hotel', place_id: 56, day_id: 5 }), e);
    expect(e.selectPlace).toHaveBeenCalledWith(56);
    expect(e.selectDay).toHaveBeenCalledWith(5);
    const f = deps();
    showReservationOnMap(buildReservation({ type: 'hotel', place_id: 57 }), f);
    expect(f.selectDay).toHaveBeenCalledWith(null);
  });

  it('FE-PLANNER-BKONMAP-008: without a route or a place nothing happens', () => {
    const d = deps();
    showReservationOnMap(buildReservation({ type: 'event' }), d);
    expect(d.toggleConnection).not.toHaveBeenCalled();
    expect(d.selectDay).not.toHaveBeenCalled();
    expect(d.openPlan).not.toHaveBeenCalled();
  });
});

describe('canShowOnMap', () => {
  it('FE-PLANNER-BKONMAP-009: true for a route or a place, false otherwise', () => {
    expect(canShowOnMap(buildReservation({ endpoints: route }))).toBe(true);
    expect(canShowOnMap(buildReservation({ place_id: 1 }))).toBe(true);
    expect(canShowOnMap(buildReservation({ type: 'hotel', accommodation_place_id: 2 }))).toBe(true);
    expect(canShowOnMap(buildReservation({ type: 'hotel', place_id: 3 }))).toBe(true);
    expect(canShowOnMap(buildReservation({ type: 'hotel' }))).toBe(false);
    expect(canShowOnMap(buildReservation({}))).toBe(false);
  });
});
