import { ADDON_IDS } from '../../../src/addons';
import { BookingImportModule } from '../../../src/nest/booking-import/booking-import.module';
import { KitineraryExtractorModule } from '../../../src/nest/booking-import/kitinerary-extractor.module';
import { KitineraryExtractorService } from '../../../src/nest/booking-import/kitinerary-extractor.service';
import { FeaturesController } from '../../../src/nest/health/features.controller';
import { HealthModule } from '../../../src/nest/health/health.module';
import { expectRegisteredController, expectRegisteredProvider } from '../../helpers/module-providers';

import { describe, it, expect, vi } from 'vitest';

type Extractor = Pick<KitineraryExtractorService, 'isAvailable'>;
type Addons = { isAddonEnabled: (id: string) => boolean };

function make(available: boolean, aiEnabled: boolean) {
  const extractor = { isAvailable: vi.fn(() => available) };
  const addons = { isAddonEnabled: vi.fn(() => aiEnabled) };
  return {
    extractor,
    addons,
    controller: new FeaturesController(extractor as Extractor as KitineraryExtractorService, addons as never),
  };
}

describe('FeaturesController (GET /api/health/features)', () => {
  it('FEAT-001: reports both flags on', () => {
    const { controller } = make(true, true);
    expect(controller.features()).toEqual({ bookingImport: true, aiParsing: true });
  });

  it('FEAT-002: reports both flags off', () => {
    const { controller } = make(false, false);
    expect(controller.features()).toEqual({ bookingImport: false, aiParsing: false });
  });

  it('FEAT-003: the two flags are independent', () => {
    expect(make(true, false).controller.features()).toEqual({ bookingImport: true, aiParsing: false });
    expect(make(false, true).controller.features()).toEqual({ bookingImport: false, aiParsing: true });
  });

  it('FEAT-004: aiParsing asks the addons service for the LLM parsing addon specifically', () => {
    const { controller, addons } = make(true, true);
    controller.features();
    expect(addons.isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.LLM_PARSING);
  });

  it('FEAT-005: bookingImport is read live, not cached at construction', () => {
    const { controller, extractor } = make(false, false);
    controller.features();
    extractor.isAvailable.mockReturnValue(true);
    expect(controller.features().bookingImport).toBe(true);
    expect(extractor.isAvailable).toHaveBeenCalledTimes(2);
  });

  it('FEAT-006: the route lives on the health module, not on booking-import', () => {
    expectRegisteredController(HealthModule, FeaturesController);
    const bookingControllers = Reflect.getMetadata('controllers', BookingImportModule) as unknown[];
    expect(bookingControllers).not.toContain(FeaturesController);
  });

  it('FEAT-007: the extractor is reachable from health without importing the booking-import domain', () => {
    // The whole point of the leaf module: health depends on the probe, not on
    // llm-parse/reservations/budget/maps/places behind BookingImportModule.
    expectRegisteredProvider(KitineraryExtractorModule, KitineraryExtractorService);
    const healthImports = Reflect.getMetadata('imports', HealthModule) as unknown[];
    expect(Array.isArray(healthImports)).toBe(true);
    expect(healthImports).toEqual(expect.arrayContaining([KitineraryExtractorModule]));
    expect(healthImports).not.toContain(BookingImportModule);
  });

  it('FEAT-008: the controller keeps its public path', () => {
    expect(Reflect.getMetadata('path', FeaturesController)).toBe('api/health');
    expect(Reflect.getMetadata('path', FeaturesController.prototype.features)).toBe('features');
  });

  it('FEAT-009: GET /api/health writes the exact probe bytes (legacy parity)', () => {
    const { controller } = make(true, true);
    const res = {
      headers: {} as Record<string, string>,
      body: undefined as unknown,
      setHeader: vi.fn(function (this: { headers: Record<string, string> }, k: string, v: string) {
        this.headers[k] = v;
      }),
      json: vi.fn(function (this: { body: unknown }, b: unknown) {
        this.body = b;
      }),
    };
    controller.health(res as never);
    expect(res.headers['Cache-Control']).toBe('no-store, must-revalidate');
    expect(res.body).toEqual({ status: 'ok' });
  });
});
