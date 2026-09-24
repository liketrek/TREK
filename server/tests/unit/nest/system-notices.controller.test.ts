import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { SystemNoticesController } from '../../../src/nest/system-notices/system-notices.controller';
import type { SystemNoticesService } from '../../../src/nest/system-notices/system-notices.service';
import type { User } from '../../../src/types';
import type { SystemNoticeDto } from '@trek/shared';

function makeController(svc: Partial<SystemNoticesService>) {
  return new SystemNoticesController(svc as SystemNoticesService);
}

const user = { id: 7 } as User;

const notice: SystemNoticeDto = {
  id: 'welcome', display: 'modal', severity: 'info',
  titleKey: 'notice.welcome.title', bodyKey: 'notice.welcome.body', dismissible: true,
};

/** Run `fn`, expecting an HttpException; return its { status, body }. */
function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('SystemNoticesController (parity with the legacy /api/system-notices route)', () => {
  describe('GET /active', () => {
    it('returns the evaluated notices for the current user', () => {
      const getActiveFor = vi.fn().mockReturnValue([notice]);
      expect(makeController({ getActiveFor }).active(user)).toEqual([notice]);
      expect(getActiveFor).toHaveBeenCalledWith(7, new Set(), undefined);
    });

    // The layouts a bundle announces with `?supports=` reach the service as a set, so
    // a bundle that predates the parameter announces nothing.
    it('passes the announced layouts through as a set', () => {
      const getActiveFor = vi.fn().mockReturnValue([]);
      makeController({ getActiveFor }).active(user, 'release');
      expect(getActiveFor).toHaveBeenCalledWith(7, new Set(['release']), undefined);
    });

    it('passes the bundle version through, trimmed, and only when it is one string', () => {
      const getActiveFor = vi.fn().mockReturnValue([]);
      const ctrl = makeController({ getActiveFor });
      ctrl.active(user, 'release', ' 4.3.0 ');
      expect(getActiveFor).toHaveBeenLastCalledWith(7, new Set(['release']), '4.3.0');
      ctrl.active(user, 'release', ['4.3.0', '4.3.1']);
      expect(getActiveFor).toHaveBeenLastCalledWith(7, new Set(['release']), undefined);
    });

    it('splits a comma separated list and a repeated parameter alike', () => {
      const getActiveFor = vi.fn().mockReturnValue([]);
      const ctrl = makeController({ getActiveFor });
      ctrl.active(user, ' release, banner ,,');
      expect(getActiveFor).toHaveBeenLastCalledWith(7, new Set(['release', 'banner']), undefined);
      ctrl.active(user, ['release', 'banner']);
      expect(getActiveFor).toHaveBeenLastCalledWith(7, new Set(['release', 'banner']), undefined);
    });

    it('announces nothing for an empty or missing parameter', () => {
      const getActiveFor = vi.fn().mockReturnValue([]);
      const ctrl = makeController({ getActiveFor });
      ctrl.active(user, '');
      expect(getActiveFor).toHaveBeenLastCalledWith(7, new Set(), undefined);
      ctrl.active(user, undefined);
      expect(getActiveFor).toHaveBeenLastCalledWith(7, new Set(), undefined);
    });
  });

  describe('POST /:id/dismiss', () => {
    it('returns nothing (204) when the dismiss succeeds', () => {
      const dismiss = vi.fn().mockReturnValue(true);
      expect(makeController({ dismiss }).dismiss(user, 'welcome')).toBeUndefined();
      expect(dismiss).toHaveBeenCalledWith(7, 'welcome');
    });

    it('404 { error: NOTICE_NOT_FOUND } when the id is unknown', () => {
      const dismiss = vi.fn().mockReturnValue(false);
      expect(thrown(() => makeController({ dismiss }).dismiss(user, 'nope'))).toEqual({
        status: 404,
        body: { error: 'NOTICE_NOT_FOUND' },
      });
    });
  });
});
