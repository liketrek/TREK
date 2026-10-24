/**
 * JourneyRecordingsController (JRN-01): the routes of the recorded days a
 * journey keeps, their guards, the date check it makes before the service is
 * asked, and what it hands the service and answers.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { JourneyRecordingsController } from '../../../src/nest/journey-recordings/journey-recordings.controller';
import type { JourneyRecordingsService } from '../../../src/nest/journey-recordings/journey-recordings.service';
import type { User } from '../../../src/types';
import { HttpException, RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

const user = { id: 4 } as User;
const HASH = 'f'.repeat(64);

function controllerWith() {
  const service = {
    list: vi.fn(async () => []),
    preview: vi.fn(async () => ({ date: '2026-05-14' })),
    save: vi.fn(async () => ({ outcome: 'created' })),
    remove: vi.fn(async () => undefined),
    prepStatus: vi.fn(async () => ({ enabled: true })),
  };
  return {
    service,
    controller: new JourneyRecordingsController(service as unknown as JourneyRecordingsService),
  };
}

describe('JourneyRecordingsController', () => {
  it('JRNREC-CTL-001: sits behind the Journey addon before auth, with the preview and the removal answering 200', () => {
    expect(Reflect.getMetadata(PATH_METADATA, JourneyRecordingsController)).toBe('api/journeys/:id/recordings');
    expect(Reflect.getMetadata(GUARDS_METADATA, JourneyRecordingsController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, JourneyRecordingsController)).toEqual({
      addonId: 'journey',
      label: 'Journey',
    });
    const routes = [
      ['list', RequestMethod.GET, '/', undefined],
      ['prep', RequestMethod.GET, 'prep', undefined],
      ['preview', RequestMethod.POST, 'preview', 200],
      ['save', RequestMethod.PUT, ':date', undefined],
      ['remove', RequestMethod.DELETE, ':date', 200],
    ] as const;
    for (const [handler, method, path, code] of routes) {
      const fn = JourneyRecordingsController.prototype[handler];
      expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(path);
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, fn)).toBe(code);
    }
  });

  it('JRNREC-CTL-002: hands the caller, the journey, the day, the body and the socket id to the service', async () => {
    const { service, controller } = controllerWith();

    expect(await controller.list(user, '9')).toEqual({ days: [] });
    expect(service.list).toHaveBeenCalledExactlyOnceWith(4, 9);

    const preview = { date: '2026-05-14', utcOffsetMinutes: 120, useSourceOffset: true };
    expect(await controller.preview(user, '9', preview)).toEqual({ date: '2026-05-14' });
    expect(service.preview).toHaveBeenCalledExactlyOnceWith(4, 9, preview);

    const save = { utcOffsetMinutes: 120, expectedHash: HASH, replace: true };
    expect(await controller.save(user, '9', '2026-05-14', save, 'sock-1')).toEqual({ outcome: 'created' });
    expect(service.save).toHaveBeenCalledExactlyOnceWith(4, 9, '2026-05-14', save, 'sock-1');

    expect(await controller.remove(user, '9', '2026-05-14', 'sock-1')).toEqual({ success: true });
    expect(service.remove).toHaveBeenCalledExactlyOnceWith(4, 9, '2026-05-14', 'sock-1');
  });

  it('JRNREC-CTL-003: a day that is no calendar day is a 400 before the service is asked', async () => {
    const { service, controller } = controllerWith();
    const refusals = await Promise.all(
      ['2026-02-30', '14.05.2026', 'today'].map((date) =>
        controller.remove(user, '9', date).catch((err: unknown) => err),
      ),
    );
    for (const err of refusals) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(400);
      expect((err as HttpException).getResponse()).toEqual({ error: 'Invalid date' });
    }
    await expect(
      controller.save(user, '9', 'nope', { utcOffsetMinutes: 0, expectedHash: HASH }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(service.remove).not.toHaveBeenCalled();
    expect(service.save).not.toHaveBeenCalled();
  });

  it('JRNREC-CTL-004: asks the service how the journey is prepared for the caller (JRN-03)', async () => {
    const { service, controller } = controllerWith();

    expect(await controller.prep(user, '9')).toEqual({ enabled: true });
    expect(service.prepStatus).toHaveBeenCalledExactlyOnceWith(4, 9);
  });
});
