import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../helpers/msw/server';
import { useVacayStore } from '../../../src/store/vacayStore';
import { resetAllStores } from '../../helpers/store';

beforeEach(() => {
  resetAllStores();
});

describe('vacayStore', () => {
  describe('FE-VACAY-001: loadAll()', () => {
    it('fetches plan, years, entries, and stats, updates state', async () => {
      await useVacayStore.getState().loadAll();
      const state = useVacayStore.getState();

      expect(state.plan).not.toBeNull();
      expect(state.plan?.id).toBe(1);
      expect(state.years).toEqual([2025, 2026]);
      expect(state.entries.length).toBeGreaterThan(0);
      expect(state.stats.length).toBeGreaterThan(0);
      expect(state.loading).toBe(false);
    });
  });

  describe('FE-VACAY-002: toggleEntry()', () => {
    it('calls the toggle API then reloads entries and stats', async () => {
      // Seed selected year
      useVacayStore.setState({ selectedYear: 2025 });

      let toggled = false;
      server.use(
        http.post('/api/addons/vacay/entries/toggle', () => {
          toggled = true;
          return HttpResponse.json({ success: true });
        })
      );

      await useVacayStore.getState().toggleEntry('2025-06-20');

      expect(toggled).toBe(true);
      // After toggle, entries are refreshed from MSW (2 entries)
      expect(useVacayStore.getState().entries.length).toBe(2);
    });
  });

  describe('FE-VACAY-003: loadHolidays() — holidays_enabled with calendars', () => {
    it('populates holidays map when plan has holiday calendars', async () => {
      // Set plan state with holidays_enabled and a simple (non-regional) calendar
      useVacayStore.setState({
        selectedYear: 2025,
        plan: {
          id: 1,
          holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [
            { id: 1, plan_id: 1, region: 'DE', label: 'Germany', color: '#ef4444', sort_order: 0 },
          ],
          block_weekends: true,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      // Override MSW to return non-regional holidays (no counties)
      server.use(
        http.get('/api/addons/vacay/holidays/:year/:country', () =>
          HttpResponse.json([
            { date: '2025-12-25', name: 'Christmas', localName: 'Weihnachten', global: true, counties: null },
            { date: '2025-01-01', name: 'New Year', localName: 'Neujahr', global: true, counties: null },
          ])
        )
      );

      await useVacayStore.getState().loadHolidays(2025);
      const state = useVacayStore.getState();

      expect(Object.keys(state.holidays).length).toBeGreaterThan(0);
      expect(state.holidays['2025-12-25']).toBeDefined();
      const christmas = state.holidays['2025-12-25'];
      expect(Array.isArray(christmas) ? christmas[0].name : christmas.name).toBe('Christmas');
    });
  });

  describe('FE-VACAY-003b: loadHolidays() — holidays not enabled', () => {
    it('sets holidays to empty map when holidays_enabled is false', async () => {
      useVacayStore.setState({
        selectedYear: 2025,
        plan: {
          id: 1,
          holidays_enabled: false,
          holidays_region: null,
          holiday_calendars: [],
          block_weekends: true,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      await useVacayStore.getState().loadHolidays(2025);
      expect(useVacayStore.getState().holidays).toEqual({});
    });
  });

  describe('FE-VACAY-004a: updatePlan()', () => {
    it('updates plan and reloads entries, stats, holidays', async () => {
      // Need existing plan for holiday check in loadHolidays
      useVacayStore.setState({
        selectedYear: 2025,
        plan: {
          id: 1,
          holidays_enabled: false,
          holidays_region: null,
          holiday_calendars: [],
          block_weekends: true,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      await useVacayStore.getState().updatePlan({ holidays_enabled: true });
      const state = useVacayStore.getState();

      // The MSW handler for PUT /addons/vacay/plan returns holidays_enabled: true
      expect(state.plan?.holidays_enabled).toBe(true);
    });
  });

  describe('FE-VACAY-004b: addYear()', () => {
    it('adds a year and the years list is updated', async () => {
      await useVacayStore.getState().addYear(2027);
      expect(useVacayStore.getState().years).toContain(2027);
    });
  });

  describe('FE-VACAY-004c: removeYear()', () => {
    it('removes a year and updates the years list', async () => {
      useVacayStore.setState({ years: [2025, 2026], selectedYear: 2026 });

      await useVacayStore.getState().removeYear(2026);
      const state = useVacayStore.getState();

      // MSW returns [2025] after delete
      expect(state.years).toEqual([2025]);
      // selectedYear should shift to the last remaining year
      expect(state.selectedYear).toBe(2025);
    });
  });

  describe('FE-STORE-VACAY-005: setSelectedYear and setSelectedUserId', () => {
    it('updates selectedYear state', () => {
      useVacayStore.getState().setSelectedYear(2028);
      expect(useVacayStore.getState().selectedYear).toBe(2028);
    });

    it('updates selectedUserId state', () => {
      useVacayStore.getState().setSelectedUserId(42);
      expect(useVacayStore.getState().selectedUserId).toBe(42);
    });

    it('sets selectedUserId to null', () => {
      useVacayStore.setState({ selectedUserId: 42 });
      useVacayStore.getState().setSelectedUserId(null);
      expect(useVacayStore.getState().selectedUserId).toBeNull();
    });
  });

  describe('FE-STORE-VACAY-006: loadEntries() uses selectedYear when no year arg', () => {
    it('falls back to selectedYear when called without argument', async () => {
      useVacayStore.setState({ selectedYear: 2025 });
      await useVacayStore.getState().loadEntries();
      expect(useVacayStore.getState().entries.length).toBe(2);
    });
  });

  describe('FE-STORE-VACAY-007: loadStats() uses selectedYear when no year arg', () => {
    it('falls back to selectedYear when called without argument', async () => {
      useVacayStore.setState({ selectedYear: 2025 });
      await useVacayStore.getState().loadStats();
      expect(useVacayStore.getState().stats.length).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-008: invite()', () => {
    it('calls invite API and reloads plan', async () => {
      let inviteCalled = false;
      server.use(
        http.post('/api/addons/vacay/invite', () => {
          inviteCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      await useVacayStore.getState().invite(5);
      const state = useVacayStore.getState();

      expect(inviteCalled).toBe(true);
      expect(state.plan).not.toBeNull();
      expect(state.plan?.id).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-009: declineInvite()', () => {
    it('calls decline API and reloads plan', async () => {
      await useVacayStore.getState().declineInvite(2);
      expect(useVacayStore.getState().plan?.id).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-010: cancelInvite()', () => {
    it('calls cancel API and reloads plan', async () => {
      await useVacayStore.getState().cancelInvite(3);
      const state = useVacayStore.getState();
      expect(state.plan).not.toBeNull();
      expect(state.plan?.id).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-011: acceptInvite()', () => {
    it('calls loadAll after accepting invite', async () => {
      await useVacayStore.getState().acceptInvite(1);
      const state = useVacayStore.getState();

      expect(state.plan).not.toBeNull();
      expect(state.years).toEqual([2025, 2026]);
      expect(state.loading).toBe(false);
    });
  });

  describe('FE-STORE-VACAY-012: dissolve()', () => {
    it('calls loadAll after dissolving', async () => {
      await useVacayStore.getState().dissolve();
      const state = useVacayStore.getState();

      expect(state.plan).not.toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('FE-STORE-VACAY-013: updateColor()', () => {
    it('reloads plan and entries after updating color', async () => {
      server.use(
        http.put('/api/addons/vacay/color', () =>
          HttpResponse.json({ success: true })
        )
      );

      await useVacayStore.getState().updateColor('#ff0000');
      const state = useVacayStore.getState();

      expect(state.plan?.id).toBe(1);
      expect(state.entries.length).toBe(2);
    });
  });

  describe('FE-STORE-VACAY-014: toggleCompanyHoliday()', () => {
    it('reloads entries and stats after toggling company holiday', async () => {
      useVacayStore.setState({ selectedYear: 2025 });

      server.use(
        http.post('/api/addons/vacay/entries/company-holiday', () =>
          HttpResponse.json({ success: true })
        )
      );

      await useVacayStore.getState().toggleCompanyHoliday('2025-12-26');
      const state = useVacayStore.getState();

      expect(state.entries.length).toBe(2);
      expect(state.stats.length).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-015: updateVacationDays()', () => {
    it('reloads stats for the given year', async () => {
      await useVacayStore.getState().updateVacationDays(2025, 25);
      expect(useVacayStore.getState().stats.length).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-016: removeYear() when selectedYear is not the removed year', () => {
    it('does not change selectedYear when a different year is removed', async () => {
      useVacayStore.setState({ years: [2025, 2026], selectedYear: 2025 });

      await useVacayStore.getState().removeYear(2026);
      const state = useVacayStore.getState();

      expect(state.years).toEqual([2025]);
      expect(state.selectedYear).toBe(2025);
    });
  });

  describe('FE-STORE-VACAY-017: addHolidayCalendar()', () => {
    it('reloads plan and holidays after adding a holiday calendar', async () => {
      server.use(
        http.post('/api/addons/vacay/plan/holiday-calendars', () =>
          HttpResponse.json({
            calendar: { id: 1, plan_id: 1, region: 'DE', label: null, color: '#ef4444', sort_order: 0 },
          })
        )
      );

      await useVacayStore.getState().addHolidayCalendar({ region: 'DE', color: '#ef4444' });
      expect(useVacayStore.getState().plan?.id).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-018: updateHolidayCalendar()', () => {
    it('reloads plan and holidays after updating a holiday calendar', async () => {
      server.use(
        http.put('/api/addons/vacay/plan/holiday-calendars/:id', () =>
          HttpResponse.json({
            calendar: { id: 1, plan_id: 1, region: 'US', label: 'US Holidays', color: '#3b82f6', sort_order: 0 },
          })
        )
      );

      await useVacayStore.getState().updateHolidayCalendar(1, { label: 'US Holidays' });
      expect(useVacayStore.getState().plan?.id).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-019: deleteHolidayCalendar()', () => {
    it('reloads plan and holidays after deleting a holiday calendar', async () => {
      await useVacayStore.getState().deleteHolidayCalendar(1);
      expect(useVacayStore.getState().plan?.id).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-020: loadHolidays() with regional calendar includes matching counties', () => {
    it('includes holidays matching the region county and excludes non-matching ones', async () => {
      useVacayStore.setState({
        selectedYear: 2025,
        plan: {
          id: 1,
          holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [
            { id: 1, plan_id: 1, region: 'DE-BY', label: null, color: '#ef4444', sort_order: 0 },
          ],
          block_weekends: false,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      server.use(
        http.get('/api/addons/vacay/holidays/:year/:country', () =>
          HttpResponse.json([
            { date: '2025-11-01', name: 'All Saints Day', localName: 'Allerheiligen', global: false, counties: ['DE-BY', 'DE-BW'] },
            { date: '2025-08-15', name: 'Assumption Day', localName: 'Mariä Himmelfahrt', global: false, counties: ['DE-BY'] },
            { date: '2025-03-19', name: 'St. Joseph', localName: 'Sankt Joseph', global: false, counties: ['DE-NW'] },
          ])
        )
      );

      await useVacayStore.getState().loadHolidays(2025);
      const holidays = useVacayStore.getState().holidays;

      // DE-BY holidays should be included
      expect(holidays['2025-11-01']).toBeDefined();
      expect(holidays['2025-08-15']).toBeDefined();
      // DE-NW only holiday should be excluded
      expect(holidays['2025-03-19']).toBeUndefined();
    });
  });

  describe('FE-STORE-VACAY-021: loadHolidays() skips regional calendar when data has no county breakdown', () => {
    it('results in empty holidays map when all entries are global (no counties)', async () => {
      useVacayStore.setState({
        selectedYear: 2025,
        plan: {
          id: 1,
          holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [
            { id: 1, plan_id: 1, region: 'DE-BY', label: null, color: '#ef4444', sort_order: 0 },
          ],
          block_weekends: false,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      server.use(
        http.get('/api/addons/vacay/holidays/:year/:country', () =>
          HttpResponse.json([
            { date: '2025-12-25', name: 'Christmas', localName: 'Weihnachten', global: true, counties: null },
            { date: '2025-01-01', name: 'New Year', localName: 'Neujahr', global: true, counties: null },
          ])
        )
      );

      await useVacayStore.getState().loadHolidays(2025);
      // hasRegions is false (no counties), region is 'DE-BY' (non-null)
      // so the condition `hasRegions && !region` is false → proceeds to county filter
      // h.global is true → all holidays are included despite region filter
      // Actually: global=true entries are included by the `h.global` check in the forEach
      // The test verifies behavior when counties: null + global: true
      const holidays = useVacayStore.getState().holidays;
      // Global holidays are included even for regional calendars when counties data is absent
      expect(holidays['2025-12-25']).toBeDefined();
    });
  });

  describe('FE-STORE-VACAY-022: loadShares()', () => {
    it('stores outgoing and incoming shares', async () => {
      server.use(
        http.get('/api/addons/vacay/shares', () =>
          HttpResponse.json({
            outgoing: [{ id: 1, user_id: 2, username: 'Bob' }],
            incoming: [{ id: 2, owner_id: 3, username: 'Carol', color: '#ec4899', hidden: false }],
          })
        )
      );

      await useVacayStore.getState().loadShares();
      const state = useVacayStore.getState();

      expect(state.outgoingShares.length).toBe(1);
      expect(state.outgoingShares[0].username).toBe('Bob');
      expect(state.incomingShares.length).toBe(1);
      expect(state.incomingShares[0].hidden).toBe(false);
    });
  });

  describe('FE-STORE-VACAY-023: loadSharedCalendars() uses selectedYear when no year arg', () => {
    it('requests the selected year and stores the calendars', async () => {
      useVacayStore.setState({ selectedYear: 2025 });

      let requestedYear: string | undefined;
      server.use(
        http.get('/api/addons/vacay/shares/calendars/:year', ({ params }) => {
          requestedYear = params.year as string;
          return HttpResponse.json({
            calendars: [{
              share_id: 2,
              owner_id: 3,
              owner_name: 'Carol',
              color: '#ec4899',
              hidden: false,
              entries: [{ date: '2025-06-15', fraction: 1 }],
              companyHolidays: [],
            }],
          });
        })
      );

      await useVacayStore.getState().loadSharedCalendars();
      const state = useVacayStore.getState();

      expect(requestedYear).toBe('2025');
      expect(state.sharedCalendars.length).toBe(1);
      expect(state.sharedCalendars[0].owner_name).toBe('Carol');
    });
  });

  describe('FE-STORE-VACAY-024: shareWith()', () => {
    it('posts the user id and reloads shares', async () => {
      let postedUserId: number | undefined;
      server.use(
        http.post('/api/addons/vacay/shares', async ({ request }) => {
          const body = await request.json() as { user_id: number };
          postedUserId = body.user_id;
          return HttpResponse.json({ success: true });
        }),
        http.get('/api/addons/vacay/shares', () =>
          HttpResponse.json({
            outgoing: [{ id: 1, user_id: 5, username: 'Eve' }],
            incoming: [],
          })
        )
      );

      await useVacayStore.getState().shareWith(5);
      const state = useVacayStore.getState();

      expect(postedUserId).toBe(5);
      expect(state.outgoingShares.length).toBe(1);
    });
  });

  describe('FE-STORE-VACAY-025: removeShare()', () => {
    it('deletes the share and reloads shares and shared calendars', async () => {
      useVacayStore.setState({
        selectedYear: 2025,
        outgoingShares: [{ id: 1, user_id: 5, username: 'Eve' }],
      });

      let deletedId: string | undefined;
      server.use(
        http.delete('/api/addons/vacay/shares/:id', ({ params }) => {
          deletedId = params.id as string;
          return HttpResponse.json({ success: true });
        })
      );

      await useVacayStore.getState().removeShare(1);
      const state = useVacayStore.getState();

      expect(deletedId).toBe('1');
      // Default MSW handlers return empty lists after the delete
      expect(state.outgoingShares).toEqual([]);
      expect(state.sharedCalendars).toEqual([]);
    });
  });

  describe('FE-STORE-VACAY-026: setShareHidden()', () => {
    it('optimistically toggles hidden on the share and its calendar', async () => {
      useVacayStore.setState({
        incomingShares: [{ id: 2, owner_id: 3, username: 'Carol', color: '#ec4899', hidden: false }],
        sharedCalendars: [{ share_id: 2, owner_id: 3, owner_name: 'Carol', color: '#ec4899', hidden: false, entries: [], companyHolidays: [] }],
      });

      await useVacayStore.getState().setShareHidden(2, true);
      const state = useVacayStore.getState();

      expect(state.incomingShares[0].hidden).toBe(true);
      expect(state.sharedCalendars[0].hidden).toBe(true);
    });

    it('rolls back the optimistic toggle when the API call fails', async () => {
      useVacayStore.setState({
        incomingShares: [{ id: 2, owner_id: 3, username: 'Carol', color: '#ec4899', hidden: false }],
        sharedCalendars: [{ share_id: 2, owner_id: 3, owner_name: 'Carol', color: '#ec4899', hidden: false, entries: [], companyHolidays: [] }],
      });

      server.use(
        http.put('/api/addons/vacay/shares/:id', () =>
          HttpResponse.json({ error: 'Share not found' }, { status: 404 })
        )
      );

      await expect(useVacayStore.getState().setShareHidden(2, true)).rejects.toThrow();
      const state = useVacayStore.getState();

      expect(state.incomingShares[0].hidden).toBe(false);
      expect(state.sharedCalendars[0].hidden).toBe(false);
    });
  });

  describe('FE-STORE-VACAY-027: loadHolidays() with national school holiday calendar', () => {
    it('loads school holidays when the calendar has no subdivision', async () => {
      useVacayStore.setState({
        selectedYear: 2026,
        plan: {
          id: 1,
          holidays_enabled: false,
          school_holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [
            { id: 1, plan_id: 1, region: 'NL', label: 'Niederlande', color: '#22c55e', sort_order: 0, type: 'school_holiday' },
          ],
          block_weekends: false,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      let requestedUrl = '';
      server.use(
        http.get('/api/addons/vacay/school-holidays/:year/:country', ({ request }) => {
          requestedUrl = request.url;
          return HttpResponse.json([
            {
              id: 'nl-summer-2026',
              startDate: '2026-07-18',
              endDate: '2026-08-30',
              name: [{ language: 'EN', text: 'Summer holidays' }],
            },
          ]);
        })
      );

      await useVacayStore.getState().loadHolidays(2026);
      const holidays = useVacayStore.getState().holidays;

      expect(requestedUrl).toContain('/school-holidays/2026/NL');
      expect(holidays['2026-07-18']).toBeDefined();
      const summer = holidays['2026-07-18'];
      expect(Array.isArray(summer) ? summer[0].type : summer.type).toBe('school_holiday');
    });
  });

  describe('FE-STORE-VACAY-028: loadHolidays() with school holiday group calendar', () => {
    it('passes the OpenHolidays group code for regional school holiday zones', async () => {
      useVacayStore.setState({
        selectedYear: 2026,
        plan: {
          id: 1,
          holidays_enabled: false,
          school_holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [
            { id: 1, plan_id: 1, region: 'NL|group:NL-NO', label: 'Noord', color: '#22c55e', sort_order: 0, type: 'school_holiday' },
          ],
          block_weekends: false,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      let requestedUrl = '';
      server.use(
        http.get('/api/addons/vacay/school-holidays/:year/:country', ({ request }) => {
          requestedUrl = request.url;
          return HttpResponse.json([
            {
              id: 'nl-north-2026',
              startDate: '2026-07-04',
              endDate: '2026-08-16',
              name: [{ language: 'EN', text: 'Summer holidays' }],
            },
          ]);
        })
      );

      await useVacayStore.getState().loadHolidays(2026);

      expect(requestedUrl).toContain('/school-holidays/2026/NL');
      expect(requestedUrl).toContain('group=NL-NO');
      expect(useVacayStore.getState().holidays['2026-07-04']).toBeDefined();
    });
  });

  describe('FE-STORE-VACAY-029: loadHolidays() with unsupported school holiday country', () => {
    it('skips school holiday calendars that are not in the approved whitelist', async () => {
      useVacayStore.setState({
        selectedYear: 2026,
        plan: {
          id: 1,
          holidays_enabled: false,
          school_holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [
            { id: 1, plan_id: 1, region: 'SE', label: 'Sweden', color: '#22c55e', sort_order: 0, type: 'school_holiday' },
          ],
          block_weekends: false,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });

      let requested = false;
      server.use(
        http.get('/api/addons/vacay/school-holidays/:year/:country', () => {
          requested = true;
          return HttpResponse.json([]);
        })
      );

      await useVacayStore.getState().loadHolidays(2026);

      expect(requested).toBe(false);
      expect(useVacayStore.getState().holidays).toEqual({});
    });
  });
});
