/**
 * TRIPADDON-GUARD-001..006: TripAddonGuard, the trip-scoped twin of AddonGuard.
 *
 * It answers @RequireAddon with what applies to the one trip TripAccessGuard
 * parked on the request: the owner's choice for the trip, else the instance
 * switch. Both directions are pinned, the trip on although the instance is
 * off and the trip off although the instance is on, with the 404 body
 * AddonGuard has always sent.
 */
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { RequireAddon } from '../../../src/nest/addons/require-addon.decorator';
import { TripAddonGuard } from '../../../src/nest/addons/trip-addon.guard';
import { TRIP_REQUEST_KEY } from '../../../src/nest/permissions/trip-access.guard';
import { type ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { describe, it, expect, vi } from 'vitest';

/** A route group carrying @RequireAddon, as the controllers declare it. */
function decorated(addonId: string | readonly string[], label: string): object {
  @RequireAddon(addonId, label)
  class Gated {}
  return Gated;
}

function ctxFor(cls: object, trip?: { id: number; user_id: number }): ExecutionContext {
  return {
    getHandler: () => () => {},
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => (trip ? { [TRIP_REQUEST_KEY]: trip } : {}) }),
  } as unknown as ExecutionContext;
}

/** `chosen` is what applies to each addon on trip 5. */
function addons(chosen: Record<string, boolean>) {
  return {
    isEnabledForTrip: vi.fn(async (_tripId: number, id: string) => chosen[id] ?? false),
  } as unknown as AddonsService & { isEnabledForTrip: ReturnType<typeof vi.fn> };
}

async function refusal(run: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await run();
  } catch (err) {
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected a refusal');
}

const TRIP = { id: 5, user_id: 1 };

describe('TripAddonGuard', () => {
  it('TRIPADDON-GUARD-001: a route that did not ask for an addon is never gated, and nothing is read', async () => {
    const svc = addons({});
    expect(await new TripAddonGuard(svc, new Reflector()).canActivate(ctxFor(class {}))).toBe(true);
    expect(svc.isEnabledForTrip).not.toHaveBeenCalled();
  });

  it('TRIPADDON-GUARD-002: a trip that switched the addon on answers, whatever the instance says', async () => {
    const svc = addons({ roadtrip: true });
    const guard = new TripAddonGuard(svc, new Reflector());
    expect(await guard.canActivate(ctxFor(decorated('roadtrip', 'Road trip'), TRIP))).toBe(true);
    expect(svc.isEnabledForTrip).toHaveBeenCalledWith(5, 'roadtrip');
  });

  it('TRIPADDON-GUARD-003: a trip that has the addon off gets the AddonGuard 404 body', async () => {
    const guard = new TripAddonGuard(addons({ budget: false }), new Reflector());
    expect(await refusal(() => guard.canActivate(ctxFor(decorated('budget', 'Costs'), TRIP)))).toEqual({
      status: 404,
      body: { error: 'Costs addon is not enabled' },
    });
  });

  it('TRIPADDON-GUARD-004: of several addons one is enough, as with AddonGuard', async () => {
    const guard = new TripAddonGuard(addons({ tours: false, roadtrip: true }), new Reflector());
    expect(await guard.canActivate(ctxFor(decorated(['tours', 'roadtrip'], 'Tours'), TRIP))).toBe(true);
    const none = new TripAddonGuard(addons({}), new Reflector());
    expect(
      (await refusal(() => none.canActivate(ctxFor(decorated(['tours', 'roadtrip'], 'Tours'), TRIP)))).status,
    ).toBe(404);
  });

  it('TRIPADDON-GUARD-005: without a trip parked by TripAccessGuard it fails closed instead of opening', async () => {
    const svc = addons({ packing: true });
    const guard = new TripAddonGuard(svc, new Reflector());
    await expect(guard.canActivate(ctxFor(decorated('packing', 'Packing')))).rejects.toThrow(/TripAccessGuard/);
    expect(svc.isEnabledForTrip).not.toHaveBeenCalled();
  });

  it('TRIPADDON-GUARD-006: a handler-level requirement overrides the class one', async () => {
    @RequireAddon('tours', 'Tours')
    class Routes {
      @RequireAddon('packing', 'Packing')
      handler() {}
    }
    const svc = addons({ tours: true, packing: false });
    const context = {
      getHandler: () => Routes.prototype.handler,
      getClass: () => Routes,
      switchToHttp: () => ({ getRequest: () => ({ [TRIP_REQUEST_KEY]: TRIP }) }),
    } as unknown as ExecutionContext;
    expect(await refusal(() => new TripAddonGuard(svc, new Reflector()).canActivate(context))).toEqual({
      status: 404,
      body: { error: 'Packing addon is not enabled' },
    });
  });
});
