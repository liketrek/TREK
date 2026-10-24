/**
 * JourneyDayImportController (JRN-02): the routes of a recorded day taken into
 * a journey with its stays, their guards, the date check it makes before the
 * service is asked, and what it hands the service and answers.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { JourneyDayImportController } from '../../../src/nest/journey-recordings/journey-day-import.controller';
import type { JourneyDayImportService } from '../../../src/nest/journey-recordings/journey-day-import.service';
import type { User } from '../../../src/types';
import { HttpException, RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

const user = { id: 4 } as User;

function controllerWith() {
  const service = {
    review: vi.fn(async () => ({ date: '2026-05-14', stays: [] })),
    takeOver: vi.fn(async () => ({ entries: [], alreadyTaken: [], skipped: [] })),
  };
  return {
    service,
    controller: new JourneyDayImportController(service as unknown as JourneyDayImportService),
  };
}

describe('JourneyDayImportController', () => {
  it('JRNDAY-CTL-001: sits behind the Journey addon before auth, both POSTs answering 200', () => {
    expect(Reflect.getMetadata(PATH_METADATA, JourneyDayImportController)).toBe('api/journeys/:id/recordings');
    expect(Reflect.getMetadata(GUARDS_METADATA, JourneyDayImportController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, JourneyDayImportController)).toEqual({
      addonId: 'journey',
      label: 'Journey',
    });
    const routes = [
      ['review', ':date/stays/review'],
      ['takeOver', ':date/stays/import'],
    ] as const;
    for (const [handler, path] of routes) {
      const fn = JourneyDayImportController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(RequestMethod.POST);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(path);
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, fn)).toBe(200);
    }
  });

  it('JRNDAY-CTL-002: hands the caller, the journey, the day, the body and the socket id to the service', async () => {
    const { service, controller } = controllerWith();

    expect(await controller.review(user, '9', '2026-05-14')).toEqual({ date: '2026-05-14', stays: [] });
    expect(service.review).toHaveBeenCalledExactlyOnceWith(4, 9, '2026-05-14');

    const body = { groups: [{ kind: 'single' as const, stays: [{ suggestionId: 3 }] }], skipSuggestionIds: [5] };
    expect(await controller.takeOver(user, '9', '2026-05-14', body, 'sock-1')).toEqual({
      entries: [],
      alreadyTaken: [],
      skipped: [],
    });
    expect(service.takeOver).toHaveBeenCalledExactlyOnceWith(4, 9, '2026-05-14', body, 'sock-1');
  });

  it('JRNDAY-CTL-003: a day that is no calendar day is a 400 before the service is asked', async () => {
    const { service, controller } = controllerWith();
    const refusals = await Promise.all(
      ['2026-02-30', 'today'].map((date) => controller.review(user, '9', date).catch((e: unknown) => e)),
    );
    for (const err of refusals) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getResponse()).toEqual({ error: 'Invalid date' });
    }
    await expect(
      controller.takeOver(user, '9', 'nope', { groups: [{ kind: 'single', stays: [{ suggestionId: 1 }] }] }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(service.review).not.toHaveBeenCalled();
    expect(service.takeOver).not.toHaveBeenCalled();
  });
});
