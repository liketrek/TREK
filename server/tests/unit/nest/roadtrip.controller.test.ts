/**
 * ROADTRIP-CTL-001..016 — the seven via routes.
 *
 * What is worth pinning here is not the happy path, which the service tests
 * already cover, but the checks a later change could delete without anything
 * noticing: the guard chain, the day-belongs-to-this-trip test on every route,
 * the track-belongs-to-this-trip test on the batch route, and the exact 404
 * bodies the client reads.
 *
 * The guard chain is asserted through the decorator metadata rather than by
 * booting Nest: the controller's own comment calls the ORDER load-bearing, and
 * a class-level assertion is the only thing that fails when somebody removes
 * AddonGuard again. `@RequireAddon` is metadata and does nothing on its own, so
 * dropping the guard from the list is a silent regression that opens all seven
 * routes on an instance that switched the addon off.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RoadtripController } from '../../../src/nest/roadtrip/roadtrip.controller';
import type { RoadtripService } from '../../../src/nest/roadtrip/roadtrip.service';
import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import { TripAccessGuard } from '../../../src/nest/permissions/trip-access.guard';

const VIA = { id: 5, day_id: 4, after_order_index: 0, sequence: 0, lat: 53, lng: 10 };

function svc(o: Partial<RoadtripService> = {}): RoadtripService {
  return {
    dayExists: vi.fn().mockReturnValue(true),
    trackExists: vi.fn().mockReturnValue(true),
    listForDay: vi.fn().mockReturnValue([VIA]),
    listForTrip: vi.fn().mockReturnValue([VIA]),
    tracksForTrip: vi.fn().mockReturnValue([]),
    create: vi.fn().mockReturnValue(VIA),
    createMany: vi.fn().mockReturnValue([VIA]),
    reanchor: vi.fn().mockReturnValue([VIA]),
    move: vi.fn().mockReturnValue(VIA),
    remove: vi.fn().mockReturnValue(true),
    // Every write announces the day's new shape to the trip's other clients.
    broadcast: vi.fn(),
    ...o,
  } as unknown as RoadtripService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('RoadtripController — the guard chain', () => {
  it('ROADTRIP-CTL-001: the addon gate leads, and the auth and trip guards follow', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, RoadtripController) as unknown[];

    // AddonGuard first, and present at all: @RequireAddon is metadata and inert
    // without it, and the guard is not registered globally either. Without this
    // line all seven routes answered on an instance that had the addon off,
    // which is the bug this branch fixed once already.
    expect(guards).toEqual([AddonGuard, JwtAuthGuard, TripAccessGuard]);
    // It leads because a disabled addon owes an anonymous caller a 404 rather
    // than a 401 that tells them the route exists.
    expect(guards[0]).toBe(AddonGuard);
  });
});

describe('RoadtripController — reads', () => {
  it('ROADTRIP-CTL-002: the trip read hands back vias and tracks in one answer', () => {
    const s = svc();
    expect(new RoadtripController(s).listAll('7')).toEqual({ vias: [VIA], tracks: [] });
    expect(s.listForTrip).toHaveBeenCalledWith('7');
    expect(s.tracksForTrip).toHaveBeenCalledWith('7');
  });

  it('ROADTRIP-CTL-003: the day read checks the day belongs to this trip', () => {
    const s = svc();
    expect(new RoadtripController(s).list('7', '4')).toEqual({ vias: [VIA] });
    expect(s.dayExists).toHaveBeenCalledWith('4', '7');
  });

  it('ROADTRIP-CTL-004: a day from another trip is not readable through this one', () => {
    // The guard proves the caller may reach the trip; this proves the day is
    // part of it. Without the check a valid day id from somebody else's trip is
    // reachable by way of a trip the caller does have access to.
    const s = svc({ dayExists: vi.fn().mockReturnValue(false) });
    expect(thrown(() => new RoadtripController(s).list('7', '999')))
      .toEqual({ status: 404, body: { error: 'Day not found' } });
  });
});

describe('RoadtripController — writes', () => {
  const body = { after_order_index: 0, lat: 53, lng: 10 };

  it('ROADTRIP-CTL-005: creating one checks the day first', () => {
    const s = svc();
    expect(new RoadtripController(s).create('7', '4', body)).toEqual({ via: VIA });
    expect(s.dayExists).toHaveBeenCalledWith('4', '7');
    expect(s.create).toHaveBeenCalledWith('4', body);
  });

  it('ROADTRIP-CTL-006: every write refuses a day from another trip', () => {
    const s = svc({ dayExists: vi.fn().mockReturnValue(false) });
    const c = new RoadtripController(s);
    const notFound = { status: 404, body: { error: 'Day not found' } };

    expect(thrown(() => c.create('7', '999', body))).toEqual(notFound);
    expect(thrown(() => c.createMany('7', '999', { vias: [body] }))).toEqual(notFound);
    expect(thrown(() => c.reanchor('7', '999', { vias: [] }))).toEqual(notFound);
    expect(thrown(() => c.update('7', '999', '5', { lat: 1, lng: 2 }))).toEqual(notFound);
    expect(thrown(() => c.remove('7', '999', '5'))).toEqual(notFound);

    // None of them reached the service.
    expect(s.create).not.toHaveBeenCalled();
    expect(s.createMany).not.toHaveBeenCalled();
    expect(s.reanchor).not.toHaveBeenCalled();
    expect(s.move).not.toHaveBeenCalled();
    expect(s.remove).not.toHaveBeenCalled();
  });

  it('ROADTRIP-CTL-007: a batch lays the whole chain in one call', () => {
    const s = svc();
    const batch = { vias: [body, body], replace_legs: [0] };
    expect(new RoadtripController(s).createMany('7', '4', batch)).toEqual({ vias: [VIA] });
    expect(s.createMany).toHaveBeenCalledWith('4', batch);
  });

  it('ROADTRIP-CTL-008: a track from another trip cannot become this day label', () => {
    // Permission is not enough on its own: a place id from somebody else's trip
    // would otherwise become this day's label, and a place that is not a track
    // would become a label that can never be drawn.
    const s = svc({ trackExists: vi.fn().mockReturnValue(false) });
    expect(thrown(() => new RoadtripController(s).createMany('7', '4', { vias: [body], track: { place_id: 3 } })))
      .toEqual({ status: 404, body: { error: 'Track not found' } });
    expect(s.createMany).not.toHaveBeenCalled();
  });

  it('ROADTRIP-CTL-009: the track check runs against the trip, not the day', () => {
    const s = svc();
    new RoadtripController(s).createMany('7', '4', { vias: [body], track: { place_id: 3 } });
    expect(s.trackExists).toHaveBeenCalledWith(3, '7');
  });

  it('ROADTRIP-CTL-010: clearing a day track is not a track to look up', () => {
    // `null` says the day follows nothing any more, so there is no place id to
    // check the existence of. Treating it as one would refuse the only way to
    // detach a track.
    const s = svc({ trackExists: vi.fn().mockReturnValue(false) });
    expect(new RoadtripController(s).createMany('7', '4', { vias: [body], track: null })).toEqual({ vias: [VIA] });
    expect(s.trackExists).not.toHaveBeenCalled();
  });

  it('ROADTRIP-CTL-011: re-anchoring goes through as one batch', () => {
    const s = svc();
    const plan = { vias: [{ id: 5, after_order_index: 1 }], remove: [6] };
    expect(new RoadtripController(s).reanchor('7', '4', plan)).toEqual({ vias: [VIA] });
    expect(s.reanchor).toHaveBeenCalledWith('4', plan);
  });

  it('ROADTRIP-CTL-012: moving a via reports where it went', () => {
    const s = svc();
    expect(new RoadtripController(s).update('7', '4', '5', { lat: 54, lng: 11 })).toEqual({ via: VIA });
    // Undefined anchor, explicitly: a drag that stayed between the same two stops sends
    // no new one, and the service must leave the existing pin alone rather than clear it.
    expect(s.move).toHaveBeenCalledWith('5', '4', 54, 11, undefined);
  });

  it('ROADTRIP-CTL-015: a new anchor is passed on, so a via dragged past a stop is re-pinned', () => {
    const s = svc();
    new RoadtripController(s).update('7', '4', '5', { lat: 54, lng: 11, after_order_index: 2 });
    expect(s.move).toHaveBeenCalledWith('5', '4', 54, 11, 2);
  });

  it('ROADTRIP-CTL-013: a via that is not on this day is a 404, not a silent no-op', () => {
    const s = svc({ move: vi.fn().mockReturnValue(null) });
    expect(thrown(() => new RoadtripController(s).update('7', '4', '999', { lat: 1, lng: 2 })))
      .toEqual({ status: 404, body: { error: 'Via not found' } });
  });

  it('ROADTRIP-CTL-014: removing one reports success', () => {
    const s = svc();
    expect(new RoadtripController(s).remove('7', '4', '5')).toEqual({ success: true });
    expect(s.remove).toHaveBeenCalledWith('5', '4');
  });

  it('ROADTRIP-CTL-015: removing a via that is not there is a 404', () => {
    const s = svc({ remove: vi.fn().mockReturnValue(false) });
    expect(thrown(() => new RoadtripController(s).remove('7', '4', '999')))
      .toEqual({ status: 404, body: { error: 'Via not found' } });
  });

  /**
   * Two people planning one road trip look at the same line on the same map, and a
   * reshaped drive moves every arrival time after it. These routes used to write in
   * silence, which left the other side reading a route nobody could see change.
   */
  describe('telling the trip', () => {
    it('SRV-ROADTRIP-020: every write announces the new shape of the day', () => {
      const cases: [string, (c: RoadtripController) => unknown][] = [
        ['create', c => c.create('7', '4', { after_order_index: 0, lat: 1, lng: 2 }, 'sock')],
        ['createMany', c => c.createMany('7', '4', { vias: [{ after_order_index: 0, lat: 1, lng: 2 }] }, 'sock')],
        ['reanchor', c => c.reanchor('7', '4', { vias: [] }, 'sock')],
        ['update', c => c.update('7', '4', '9', { lat: 1, lng: 2 }, 'sock')],
        ['remove', c => c.remove('7', '4', '9', 'sock')],
      ];
      for (const [name, run] of cases) {
        const s = svc();
        run(new RoadtripController(s));
        expect(s.broadcast, name).toHaveBeenCalledWith(
          '7',
          'roadtripVia:changed',
          { dayId: '4', vias: [VIA] },
          'sock',
        );
      }
    });

    it('SRV-ROADTRIP-021: the day list is read back, not assembled from the write', () => {
      // A reanchor rewrites the whole set and a batch may clear legs before filling them,
      // so what the write returned is not what the day now holds.
      const s = svc({ reanchor: vi.fn().mockReturnValue([]) } as Partial<RoadtripService>);
      new RoadtripController(s).reanchor('7', '4', { vias: [] }, 'sock');
      expect(s.broadcast).toHaveBeenCalledWith('7', 'roadtripVia:changed', { dayId: '4', vias: [VIA] }, 'sock');
    });

    it('SRV-ROADTRIP-022: laying a track down says which track the day now follows', () => {
      const track = { day_id: 4, place_id: 3, name: 'B96' };
      const s = svc({ tracksForTrip: vi.fn().mockReturnValue([track]) } as Partial<RoadtripService>);
      new RoadtripController(s).createMany('7', '4', { vias: [], track: { place_id: 3 } }, 'sock');
      expect(s.broadcast).toHaveBeenCalledWith('7', 'roadtripTrack:changed', { dayId: '4', track }, 'sock');
    });

    it('SRV-ROADTRIP-023: a refused write announces nothing', () => {
      const s = svc({ remove: vi.fn().mockReturnValue(false) } as Partial<RoadtripService>);
      expect(() => new RoadtripController(s).remove('7', '4', '9', 'sock')).toThrow();
      expect(s.broadcast).not.toHaveBeenCalled();
    });
  });
});
