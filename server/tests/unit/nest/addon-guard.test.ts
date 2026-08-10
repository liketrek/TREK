/**
 * The addon route gate.
 *
 * Three hand-written guards (collections, airtrail, journey) did the same thing
 * and differed only in the addon id they read and the word leading the 404. They
 * are one guard plus a @RequireAddon decorator now.
 *
 * The last describe matters as much as the first: with the addon id in a
 * decorator, nothing in a controller's own tests notices if the decorator is
 * dropped or points at the wrong addon. These assertions are what keeps the
 * three route groups gated, and gated on the right thing.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { RequireAddon, REQUIRE_ADDON, type RequireAddonMeta } from '../../../src/nest/addons/require-addon.decorator';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { ADDON_IDS } from '../../../src/addons';
import { JourneyController } from '../../../src/nest/journey/journey.controller';
import { CollectionsController } from '../../../src/nest/collections/collections.controller';
import { AirtrailController } from '../../../src/nest/integrations/airtrail.controller';
import { ReservationImportController } from '../../../src/nest/reservation-import/reservation-import.controller';

/** A context whose handler/class carry the decorator under test. */
function ctxFor(handler: object, cls: object = class {}): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls,
  } as unknown as ExecutionContext;
}

function addons(enabled: boolean): AddonsService {
  return { isAddonEnabled: vi.fn(() => enabled) } as unknown as AddonsService;
}

function thrown(fn: () => unknown) {
  try {
    fn();
    return undefined;
  } catch (err) {
    return err instanceof HttpException ? { status: err.getStatus(), body: err.getResponse() } : err;
  }
}

/** Apply @RequireAddon to a throwaway class the way a controller would. */
function decorated(addonId: string, label: string) {
  class Gated {}
  RequireAddon(addonId, label)(Gated);
  return Gated;
}

describe('AddonGuard', () => {
  it('ADDON-GUARD-001: 404s with the decorator label when the addon is disabled', () => {
    const cls = decorated(ADDON_IDS.JOURNEY, 'Journey');
    const guard = new AddonGuard(addons(false), new Reflector());

    expect(thrown(() => guard.canActivate(ctxFor(() => {}, cls))))
      .toEqual({ status: 404, body: { error: 'Journey addon is not enabled' } });
  });

  it('ADDON-GUARD-002: passes when the addon is enabled, asking for the declared id', () => {
    const cls = decorated(ADDON_IDS.COLLECTIONS, 'Collections');
    const svc = addons(true);
    const guard = new AddonGuard(svc, new Reflector());

    expect(guard.canActivate(ctxFor(() => {}, cls))).toBe(true);
    expect(svc.isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.COLLECTIONS);
  });

  it('ADDON-GUARD-003: is a no-op on a route that never asked for an addon', () => {
    const svc = addons(false);
    const guard = new AddonGuard(svc, new Reflector());

    expect(guard.canActivate(ctxFor(() => {}, class {}))).toBe(true);
    expect(svc.isAddonEnabled).not.toHaveBeenCalled();
  });

  it('ADDON-GUARD-004: a handler-level decorator overrides the controller-level one', () => {
    const cls = decorated(ADDON_IDS.JOURNEY, 'Journey');
    const handler = () => {};
    RequireAddon(ADDON_IDS.AIRTRAIL, 'AirTrail')(handler);
    const svc = addons(false);

    expect(thrown(() => new AddonGuard(svc, new Reflector()).canActivate(ctxFor(handler, cls))))
      .toEqual({ status: 404, body: { error: 'AirTrail addon is not enabled' } });
    expect(svc.isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.AIRTRAIL);
  });
});

describe('the gated route groups still declare their addon', () => {
  const metaOf = (cls: object): RequireAddonMeta | undefined => Reflect.getMetadata(REQUIRE_ADDON, cls);
  const guardsOf = (cls: object): unknown[] => Reflect.getMetadata('__guards__', cls) ?? [];

  it.each([
    ['JourneyController', JourneyController, ADDON_IDS.JOURNEY, 'Journey'],
    ['CollectionsController', CollectionsController, ADDON_IDS.COLLECTIONS, 'Collections'],
    ['AirtrailController', AirtrailController, ADDON_IDS.AIRTRAIL, 'AirTrail'],
  ])('ADDON-GUARD-005: %s gates on the right addon, with AddonGuard first', (_name, cls, addonId, label) => {
    expect(metaOf(cls)).toEqual({ addonId, label });
    // Order is the contract: a disabled addon has to answer 404 to anonymous
    // callers, so the addon check must run before the 401.
    expect(guardsOf(cls)[0]).toBe(AddonGuard);
  });

  it('ADDON-GUARD-006: the merged import controller gates AirTrail per handler, not per class', () => {
    // A class-level requirement here would 404 the four file-upload routes
    // whenever the AirTrail addon happens to be off. AddonGuard still runs first
    // in the chain, so the 404 keeps beating the 401.
    expect(metaOf(ReservationImportController)).toBeUndefined();
    expect(Reflect.getMetadata(REQUIRE_ADDON, ReservationImportController.prototype.importAirtrail))
      .toEqual({ addonId: ADDON_IDS.AIRTRAIL, label: 'AirTrail' });
    expect(guardsOf(ReservationImportController)[0]).toBe(AddonGuard);
  });
});
