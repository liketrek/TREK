/**
 * JourneyBookDesignController (JBDCTL-*): the proposal card's routes over a
 * whole-book design draft, their guards and what they hand the service. The
 * rights, the 410 of a gone draft and the selection's checks live in the
 * service (JBDSN-*) and run end to end in JBDSNE2E-*.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { JourneyBookDesignController } from '../../../../src/nest/journey/journey-book-design.controller';
import type { JourneyBookDesignService } from '../../../../src/nest/journey/journey-book-design.service';
import type { User } from '../../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

describe('JourneyBookDesignController', () => {
  it('JBDCTL-001: GET :designId and PUT :designId/selection sit behind the Journey addon before auth', () => {
    const route = JourneyBookDesignController;
    expect(Reflect.getMetadata(PATH_METADATA, route)).toBe('api/journeys/:journeyId/book-designs');
    expect(Reflect.getMetadata(GUARDS_METADATA, route)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, route)).toEqual({
      addonId: 'journey',
      label: 'Journey',
    });
    const { draft, select } = JourneyBookDesignController.prototype;
    expect(Reflect.getMetadata(METHOD_METADATA, draft)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, draft)).toBe(':designId');
    expect(Reflect.getMetadata(METHOD_METADATA, select)).toBe(RequestMethod.PUT);
    expect(Reflect.getMetadata(PATH_METADATA, select)).toBe(':designId/selection');
  });

  it('JBDCTL-002: hands the journey, the caller and the draft to the service and answers what it gave', async () => {
    const view = { designId: 'd-1', selection: ['sp-a'] };
    const chosen = { selection: ['sp-b'] };
    const draftView = vi.fn(async () => view);
    const select = vi.fn(async () => chosen);
    const controller = new JourneyBookDesignController({ draftView, select } as unknown as JourneyBookDesignService);
    const user = { id: 4 } as User;

    expect(await controller.draft(user, '9', 'd-1')).toBe(view);
    expect(draftView).toHaveBeenCalledWith(9, 4, 'd-1');
    expect(await controller.select(user, '9', 'd-1', { spreadIds: ['sp-b'] })).toBe(chosen);
    expect(select).toHaveBeenCalledWith(9, 4, 'd-1', ['sp-b']);
  });
});
