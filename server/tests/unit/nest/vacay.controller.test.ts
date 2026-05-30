import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { VacayController } from '../../../src/nest/vacay/vacay.controller';
import type { VacayService } from '../../../src/nest/vacay/vacay.service';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', email: 'u@example.test', role: 'user' } as User;

function makeController(svc: Partial<VacayService>) {
  return new VacayController(svc as VacayService);
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

// Default plan helpers shared by most handlers.
const planBase = { getActivePlanId: vi.fn().mockReturnValue(10), getActivePlan: vi.fn().mockReturnValue({ id: 10 }) };

describe('VacayController (parity with the legacy /api/addons/vacay route)', () => {
  it('GET /plan delegates getPlanData', () => {
    const getPlanData = vi.fn().mockReturnValue({ plan: { id: 10 } });
    expect(makeController({ getPlanData }).getPlan(user)).toEqual({ plan: { id: 10 } });
  });

  it('PUT /plan forwards the socket id', async () => {
    const updatePlan = vi.fn().mockResolvedValue({ ok: true });
    await makeController({ ...planBase, updatePlan }).updatePlan(user, { foo: 1 }, 'sock-1');
    expect(updatePlan).toHaveBeenCalledWith(10, { foo: 1 }, 'sock-1');
  });

  describe('holiday calendars', () => {
    it('400 when region missing', () => {
      return thrown(() => makeController({ ...planBase }).addHolidayCalendar(user, {})).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'region required' } }));
    });

    it('creates a calendar', () => {
      const addHolidayCalendar = vi.fn().mockReturnValue({ id: 1, region: 'DE-BY' });
      const res = makeController({ ...planBase, addHolidayCalendar }).addHolidayCalendar(user, { region: 'DE-BY', label: 'Bayern' }, 'sock');
      expect(res).toEqual({ calendar: { id: 1, region: 'DE-BY' } });
      expect(addHolidayCalendar).toHaveBeenCalledWith(10, 'DE-BY', 'Bayern', undefined, undefined, 'sock');
    });

    it('404 on update of a missing calendar', () => {
      const updateHolidayCalendar = vi.fn().mockReturnValue(null);
      return thrown(() => makeController({ ...planBase, updateHolidayCalendar }).updateHolidayCalendar(user, '9', {})).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Calendar not found' } }));
    });

    it('404 on delete of a missing calendar', () => {
      const deleteHolidayCalendar = vi.fn().mockReturnValue(false);
      return thrown(() => makeController({ ...planBase, deleteHolidayCalendar }).deleteHolidayCalendar(user, '9')).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Calendar not found' } }));
    });
  });

  describe('color', () => {
    it('403 when the target user is not in the plan', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      return thrown(() => makeController({ ...planBase, getPlanUsers }).setColor(user, { color: '#fff', target_user_id: 99 })).then((r) =>
        expect(r).toEqual({ status: 403, body: { error: 'User not in plan' } }));
    });

    it('sets the colour for an in-plan user', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      const setUserColor = vi.fn();
      expect(makeController({ ...planBase, getPlanUsers, setUserColor }).setColor(user, { color: '#fff' }, 'sock')).toEqual({ success: true });
      expect(setUserColor).toHaveBeenCalledWith(1, 10, '#fff', 'sock');
    });
  });

  describe('invites', () => {
    it('400 when user_id missing', () => {
      return thrown(() => makeController({ ...planBase }).invite(user, undefined)).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'user_id required' } }));
    });

    it('maps a sendInvite error to its status', () => {
      const sendInvite = vi.fn().mockReturnValue({ error: 'Already in a plan', status: 409 });
      return thrown(() => makeController({ ...planBase, sendInvite }).invite(user, 2)).then((r) =>
        expect(r).toEqual({ status: 409, body: { error: 'Already in a plan' } }));
    });

    it('sends an invite', () => {
      const sendInvite = vi.fn().mockReturnValue({});
      expect(makeController({ ...planBase, sendInvite }).invite(user, 2)).toEqual({ success: true });
      expect(sendInvite).toHaveBeenCalledWith(10, 1, 'u', 'u@example.test', 2);
    });

    it('maps an acceptInvite error', () => {
      const acceptInvite = vi.fn().mockReturnValue({ error: 'Invite not found', status: 404 });
      return thrown(() => makeController({ acceptInvite }).acceptInvite(user, 5)).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Invite not found' } }));
    });

    it('decline / cancel / dissolve return success', () => {
      const declineInvite = vi.fn(); const cancelInvite = vi.fn(); const dissolvePlan = vi.fn();
      expect(makeController({ declineInvite }).declineInvite(user, 5)).toEqual({ success: true });
      expect(makeController({ ...planBase, cancelInvite }).cancelInvite(user, 2)).toEqual({ success: true });
      expect(makeController({ dissolvePlan }).dissolve(user)).toEqual({ success: true });
    });
  });

  describe('years', () => {
    it('400 when year missing on add', () => {
      return thrown(() => makeController({ ...planBase }).addYear(user, undefined)).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'Year required' } }));
    });

    it('adds and deletes years', () => {
      const addYear = vi.fn().mockReturnValue([2026]); const deleteYear = vi.fn().mockReturnValue([]);
      expect(makeController({ ...planBase, addYear }).addYear(user, 2026, 'sock')).toEqual({ years: [2026] });
      expect(makeController({ ...planBase, deleteYear }).deleteYear(user, '2026', 'sock')).toEqual({ years: [] });
    });
  });

  describe('entries', () => {
    it('400 when date missing on toggle', () => {
      return thrown(() => makeController({ ...planBase }).toggleEntry(user, {})).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'date required' } }));
    });

    it('403 when toggling for a user not in the plan', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      return thrown(() => makeController({ ...planBase, getPlanUsers }).toggleEntry(user, { date: '2026-07-01', target_user_id: 99 })).then((r) =>
        expect(r).toEqual({ status: 403, body: { error: 'User not in plan' } }));
    });

    it('toggles for the caller', () => {
      const toggleEntry = vi.fn().mockReturnValue({ action: 'added' });
      expect(makeController({ ...planBase, toggleEntry }).toggleEntry(user, { date: '2026-07-01' }, 'sock')).toEqual({ action: 'added' });
      expect(toggleEntry).toHaveBeenCalledWith(1, 10, '2026-07-01', 'sock');
    });
  });

  describe('stats', () => {
    it('GET wraps stats', () => {
      const getStats = vi.fn().mockReturnValue({ used: 5 });
      expect(makeController({ ...planBase, getStats }).stats(user, '2026')).toEqual({ stats: { used: 5 } });
    });

    it('403 on updateStats for a user not in the plan', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      return thrown(() => makeController({ ...planBase, getPlanUsers }).updateStats(user, '2026', { vacation_days: 30, target_user_id: 99 })).then((r) =>
        expect(r).toEqual({ status: 403, body: { error: 'User not in plan' } }));
    });
  });

  describe('public holidays', () => {
    it('502 when the upstream country lookup fails', () => {
      const getCountries = vi.fn().mockResolvedValue({ error: 'upstream down' });
      return thrown(() => makeController({ getCountries }).holidayCountries()).then((r) =>
        expect(r).toEqual({ status: 502, body: { error: 'upstream down' } }));
    });

    it('returns the country data on success', async () => {
      const getCountries = vi.fn().mockResolvedValue({ data: [{ code: 'DE' }] });
      expect(await makeController({ getCountries }).holidayCountries()).toEqual([{ code: 'DE' }]);
    });

    it('502 when the holidays lookup fails', () => {
      const getHolidays = vi.fn().mockResolvedValue({ error: 'upstream down' });
      return thrown(() => makeController({ getHolidays }).holidays('2026', 'DE')).then((r) =>
        expect(r).toEqual({ status: 502, body: { error: 'upstream down' } }));
    });
  });
});
