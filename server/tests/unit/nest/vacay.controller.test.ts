import { VacayController } from '../../../src/nest/vacay/vacay.controller';
import type { VacayService } from '../../../src/nest/vacay/vacay.service';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';

import { describe, it, expect, vi } from 'vitest';

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
    await makeController({ ...planBase, updatePlan }).updatePlan(user, { block_weekends: true }, 'sock-1');
    expect(updatePlan).toHaveBeenCalledWith(10, { block_weekends: true }, 'sock-1');
  });

  describe('holiday calendars', () => {
    // A missing region now 400s in the global ZodValidationPipe (the schema
    // requires it), so the bespoke 'region required' guard is gone.
    it('creates a calendar', () => {
      const addHolidayCalendar = vi.fn().mockReturnValue({ id: 1, region: 'DE-BY' });
      const res = makeController({ ...planBase, addHolidayCalendar }).addHolidayCalendar(
        user,
        { region: 'DE-BY', label: 'Bayern' },
        'sock',
      );
      expect(res).toEqual({ calendar: { id: 1, region: 'DE-BY' } });
      expect(addHolidayCalendar).toHaveBeenCalledWith(10, 'DE-BY', 'Bayern', undefined, undefined, 'sock', undefined);
    });

    it('404 on update of a missing calendar', () => {
      const updateHolidayCalendar = vi.fn().mockReturnValue(null);
      return thrown(() =>
        makeController({ ...planBase, updateHolidayCalendar }).updateHolidayCalendar(user, '9', {}),
      ).then((r) => expect(r).toEqual({ status: 404, body: { error: 'Calendar not found' } }));
    });

    it('404 on delete of a missing calendar', () => {
      const deleteHolidayCalendar = vi.fn().mockReturnValue(false);
      return thrown(() => makeController({ ...planBase, deleteHolidayCalendar }).deleteHolidayCalendar(user, '9')).then(
        (r) => expect(r).toEqual({ status: 404, body: { error: 'Calendar not found' } }),
      );
    });
  });

  describe('color', () => {
    it('403 when the target user is not in the plan', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      return thrown(() =>
        makeController({ ...planBase, getPlanUsers }).setColor(user, { color: '#fff', target_user_id: 99 }),
      ).then((r) => expect(r).toEqual({ status: 403, body: { error: 'User not in plan' } }));
    });

    it('sets the colour for an in-plan user', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      const setUserColor = vi.fn();
      expect(
        makeController({ ...planBase, getPlanUsers, setUserColor }).setColor(user, { color: '#fff' }, 'sock'),
      ).toEqual({ success: true });
      expect(setUserColor).toHaveBeenCalledWith(1, 10, '#fff', 'sock');
    });
  });

  describe('invites', () => {
    // The schema requires user_id but still admits falsy values (0, '') — the
    // bespoke guard stays for those, byte-identical to the legacy route.
    it('400 when user_id falsy', () => {
      return thrown(() => makeController({ ...planBase }).invite(user, { user_id: 0 })).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'user_id required' } }),
      );
    });

    it('maps a sendInvite error to its status', () => {
      const sendInvite = vi.fn().mockReturnValue({ error: 'Already in a plan', status: 409 });
      return thrown(() => makeController({ ...planBase, sendInvite }).invite(user, { user_id: 2 })).then((r) =>
        expect(r).toEqual({ status: 409, body: { error: 'Already in a plan' } }),
      );
    });

    it('sends an invite', () => {
      const sendInvite = vi.fn().mockReturnValue({});
      expect(makeController({ ...planBase, sendInvite }).invite(user, { user_id: 2 })).toEqual({ success: true });
      expect(sendInvite).toHaveBeenCalledWith(10, 1, 'u', 'u@example.test', 2);
    });

    it('maps an acceptInvite error', () => {
      const acceptInvite = vi.fn().mockReturnValue({ error: 'Invite not found', status: 404 });
      return thrown(() => makeController({ acceptInvite }).acceptInvite(user, { plan_id: 5 })).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Invite not found' } }),
      );
    });

    it('decline / cancel / dissolve return success', () => {
      const declineInvite = vi.fn();
      const cancelInvite = vi.fn();
      const dissolvePlan = vi.fn();
      expect(makeController({ declineInvite }).declineInvite(user, { plan_id: 5 })).toEqual({ success: true });
      expect(makeController({ ...planBase, cancelInvite }).cancelInvite(user, { user_id: 2 })).toEqual({
        success: true,
      });
      expect(makeController({ dissolvePlan }).dissolve(user)).toEqual({ success: true });
    });
  });

  describe('years', () => {
    // Same falsy-but-present rule as user_id: schema admits 0/'', the guard
    // keeps the legacy 'Year required' body for them.
    it('400 when year falsy on add', () => {
      return thrown(() => makeController({ ...planBase }).addYear(user, { year: 0 })).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'Year required' } }),
      );
    });

    it('adds and deletes years', () => {
      const addYear = vi.fn().mockReturnValue([2026]);
      const deleteYear = vi.fn().mockReturnValue([]);
      expect(makeController({ ...planBase, addYear }).addYear(user, { year: 2026 }, 'sock')).toEqual({ years: [2026] });
      expect(makeController({ ...planBase, deleteYear }).deleteYear(user, '2026', 'sock')).toEqual({ years: [] });
    });
  });

  describe('entries', () => {
    // A missing date now 400s in the global ZodValidationPipe (schema-required),
    // so the bespoke 'date required' guard is gone.
    it('403 when toggling for a user not in the plan', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      return thrown(() =>
        makeController({ ...planBase, getPlanUsers }).toggleEntry(user, { date: '2026-07-01', target_user_id: 99 }),
      ).then((r) => expect(r).toEqual({ status: 403, body: { error: 'User not in plan' } }));
    });

    it('toggles for the caller', () => {
      const toggleEntry = vi.fn().mockReturnValue({ action: 'added' });
      expect(makeController({ ...planBase, toggleEntry }).toggleEntry(user, { date: '2026-07-01' }, 'sock')).toEqual({
        action: 'added',
      });
      expect(toggleEntry).toHaveBeenCalledWith(1, 10, '2026-07-01', undefined, undefined, 'sock');
    });

    it('forwards the half-day fraction (#552)', () => {
      const toggleEntry = vi.fn().mockReturnValue({ action: 'added', fraction: 0.5 });
      makeController({ ...planBase, toggleEntry }).toggleEntry(user, { date: '2026-07-01', fraction: 0.5 }, 'sock');
      expect(toggleEntry).toHaveBeenCalledWith(1, 10, '2026-07-01', 0.5, undefined, 'sock');
    });

    it('400 with the bespoke message when the service blocks a weekend day (I-02)', () => {
      const toggleEntry = vi.fn().mockReturnValue({ error: 'weekend_blocked' });
      return thrown(() => makeController({ ...planBase, toggleEntry }).toggleEntry(user, { date: '2026-07-04' })).then(
        (r) => expect(r).toEqual({ status: 400, body: { error: 'Weekend days are blocked on this plan' } }),
      );
    });

    it('forwards the comp/flex leave type (#1074)', () => {
      const toggleEntry = vi.fn().mockReturnValue({ action: 'added', kind: 'comp' });
      makeController({ ...planBase, toggleEntry }).toggleEntry(user, { date: '2026-07-01', kind: 'comp' }, 'sock');
      expect(toggleEntry).toHaveBeenCalledWith(1, 10, '2026-07-01', undefined, 'comp', 'sock');
    });

    it('GET reads entries over the caller window (#737)', () => {
      const getEntries = vi.fn().mockReturnValue({ entries: [], companyHolidays: [] });
      makeController({ ...planBase, getEntries }).entries(user, '2026');
      expect(getEntries).toHaveBeenCalledWith(10, '2026', 1);
    });
  });

  describe('year settings (#737)', () => {
    it('GET wraps the caller settings', () => {
      const getYearSettings = vi.fn().mockReturnValue({ year_type: 'calendar' });
      expect(makeController({ getYearSettings }).yearSettings(user)).toEqual({ settings: { year_type: 'calendar' } });
      expect(getYearSettings).toHaveBeenCalledWith(1);
    });

    it('PUT saves for the caller and returns the stored settings', () => {
      const updateYearSettings = vi
        .fn()
        .mockReturnValue({ year_type: 'fiscal', year_start_month: 7, year_start_day: 1 });
      const body = { year_type: 'fiscal' as const, year_start_month: 7, year_start_day: 1 };
      expect(makeController({ updateYearSettings }).updateYearSettings(user, body)).toEqual({
        settings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1 },
      });
      expect(updateYearSettings).toHaveBeenCalledWith(1, body);
    });
  });

  describe('stats', () => {
    it('GET wraps stats', () => {
      const getStats = vi.fn().mockReturnValue({ used: 5 });
      expect(makeController({ ...planBase, getStats }).stats(user, '2026')).toEqual({ stats: { used: 5 } });
    });

    it('403 on updateStats for a user not in the plan', () => {
      const getPlanUsers = vi.fn().mockReturnValue([{ id: 1 }]);
      return thrown(() =>
        makeController({ ...planBase, getPlanUsers }).updateStats(user, '2026', {
          vacation_days: 30,
          target_user_id: 99,
        }),
      ).then((r) => expect(r).toEqual({ status: 403, body: { error: 'User not in plan' } }));
    });
  });

  describe('public holidays', () => {
    it('502 when the upstream country lookup fails', () => {
      const getCountries = vi.fn().mockResolvedValue({ error: 'upstream down' });
      return thrown(() => makeController({ getCountries }).holidayCountries()).then((r) =>
        expect(r).toEqual({ status: 502, body: { error: 'upstream down' } }),
      );
    });

    it('returns the country data on success', async () => {
      const getCountries = vi.fn().mockResolvedValue({ data: [{ code: 'DE' }] });
      expect(await makeController({ getCountries }).holidayCountries()).toEqual([{ code: 'DE' }]);
    });

    it('502 when the holidays lookup fails', () => {
      const getHolidays = vi.fn().mockResolvedValue({ error: 'upstream down' });
      return thrown(() => makeController({ getHolidays }).holidays('2026', 'DE')).then((r) =>
        expect(r).toEqual({ status: 502, body: { error: 'upstream down' } }),
      );
    });
  });

  describe('read-only shares', () => {
    it('GET /shares delegates listShares', () => {
      const listShares = vi.fn().mockReturnValue({ outgoing: [{ id: 1 }], incoming: [] });
      expect(makeController({ listShares }).shares(user)).toEqual({ outgoing: [{ id: 1 }], incoming: [] });
      expect(listShares).toHaveBeenCalledWith(1);
    });

    it('400 when user_id falsy on share', () => {
      return thrown(() => makeController({}).share(user, { user_id: 0 })).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'user_id required' } }),
      );
    });

    it('maps a shareCalendar error to its status', () => {
      const shareCalendar = vi.fn().mockReturnValue({ error: 'Already shared', status: 400 });
      return thrown(() => makeController({ shareCalendar }).share(user, { user_id: 2 })).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'Already shared' } }),
      );
    });

    it('shares a calendar (user_id coerced to a number, socket id forwarded)', () => {
      const shareCalendar = vi.fn().mockReturnValue({});
      expect(makeController({ shareCalendar }).share(user, { user_id: '2' }, 'sock-1')).toEqual({ success: true });
      expect(shareCalendar).toHaveBeenCalledWith(1, 'u@example.test', 2, 'sock-1');
    });

    it('GET /shares/available-users wraps the user list', () => {
      const getShareAvailableUsers = vi.fn().mockReturnValue([{ id: 3 }]);
      expect(makeController({ getShareAvailableUsers }).shareAvailableUsers(user)).toEqual({ users: [{ id: 3 }] });
      expect(getShareAvailableUsers).toHaveBeenCalledWith(1);
    });

    it('GET /shares/calendars/:year wraps the calendars', () => {
      const getSharedCalendars = vi.fn().mockReturnValue([{ share_id: 4 }]);
      expect(makeController({ getSharedCalendars }).sharedCalendars(user, '2026')).toEqual({
        calendars: [{ share_id: 4 }],
      });
      expect(getSharedCalendars).toHaveBeenCalledWith(1, '2026');
    });

    it('PUT /shares/:id forwards the socket id and the hidden flag', () => {
      const setShareHidden = vi.fn().mockReturnValue(true);
      expect(makeController({ setShareHidden }).updateShare(user, '7', { hidden: true }, 'sock-1')).toEqual({
        success: true,
      });
      expect(setShareHidden).toHaveBeenCalledWith(7, 1, true, 'sock-1');
    });

    it('404 on PUT when the share is not toggleable by the caller', () => {
      const setShareHidden = vi.fn().mockReturnValue(false);
      return thrown(() => makeController({ setShareHidden }).updateShare(user, '9', { hidden: true })).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Share not found' } }),
      );
    });

    it('DELETE /shares/:id forwards the socket id', () => {
      const removeShare = vi.fn().mockReturnValue(true);
      expect(makeController({ removeShare }).deleteShare(user, '7', 'sock-1')).toEqual({ success: true });
      expect(removeShare).toHaveBeenCalledWith(7, 1, 'sock-1');
    });

    it('404 on DELETE of a foreign share', () => {
      const removeShare = vi.fn().mockReturnValue(false);
      return thrown(() => makeController({ removeShare }).deleteShare(user, '9')).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Share not found' } }),
      );
    });
  });
});
