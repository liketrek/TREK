import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { render } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import MVacaySettingsSheet from '../../mobile/screens/vacay/MVacaySettingsSheet';
import { useVacayStore } from '../../store/vacayStore';
import VacayIcsCalendarsSettings from './VacayIcsCalendarsSettings';
import VacaySettings from './VacaySettings';

beforeEach(() => resetAllStores());

describe('VacayIcsCalendarsSettings', () => {
  it.each(['desktop', 'mobile'] as const)(
    'shows editable team subscriptions to a non-owner member on %s',
    async (device) => {
      let saved: {
        id: number;
        label: string;
        color: string;
        url: string;
        last_fetched_at: null;
        last_error: null;
        event_count: number;
      } | null = {
        id: 4,
        label: 'Team holidays',
        color: '#a5f3fc',
        url: 'https://example.com/holidays.ics',
        last_fetched_at: null,
        last_error: null,
        event_count: 1,
      };
      server.use(
        http.get('/api/addons/vacay/plan/ics-calendars', () => HttpResponse.json({ calendars: saved ? [saved] : [] })),
        http.put('/api/addons/vacay/plan/ics-calendars/4', async ({ request }) => {
          if (!saved) return new HttpResponse(null, { status: 404 });
          Object.assign(saved, await request.json());
          return HttpResponse.json({ calendar: saved });
        }),
        http.delete('/api/addons/vacay/plan/ics-calendars/4', () => {
          saved = null;
          return HttpResponse.json({ success: true });
        })
      );
      useVacayStore.setState({
        isOwner: false,
        isFused: true,
        plan: {
          id: 1,
          holidays_enabled: false,
          ics_holidays_enabled: true,
          holidays_region: null,
          holiday_calendars: [],
          block_weekends: true,
          carry_over_enabled: false,
          company_holidays_enabled: false,
        },
      });
      render(
        device === 'desktop' ? <VacaySettings onClose={() => {}} /> : <MVacaySettingsSheet open onClose={() => {}} />
      );

      const label = await screen.findByRole('textbox', { name: 'Calendar label' });
      expect(label).toHaveValue('Team holidays');
      expect(label).not.toHaveAttribute('readonly');
      expect(screen.getByRole('textbox', { name: 'Enter an ICS URL' })).toHaveValue('https://example.com/holidays.ics');
      expect(screen.getByRole('textbox', { name: 'Enter an ICS URL' })).toHaveAttribute('readonly');
      expect(screen.getByRole('button', { name: 'Subscribe holidays' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Remove calendar' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Color' })).toBeEnabled();

      const user = userEvent.setup();
      await user.clear(label);
      await user.type(label, 'Updated team holidays');
      await user.tab();
      await waitFor(() => expect(saved?.label).toBe('Updated team holidays'));
      await user.click(screen.getByRole('button', { name: 'Color' }));
      await user.click(screen.getByRole('button', { name: '#fecaca' }));
      await waitFor(() => expect(saved?.color).toBe('#fecaca'));
      await user.click(screen.getByRole('button', { name: 'Remove calendar' }));
      expect(await screen.findByText('No subscribed calendars yet')).toBeInTheDocument();
    }
  );

  it.each([false, true])('shows loading and fetch failures to members (mobile: %s)', async (mobile) => {
    let failLoad!: (reason: Error) => void;
    useVacayStore.setState({
      isOwner: false,
      loadIcsCalendarSettings: () =>
        new Promise<void>((_resolve, reject) => {
          failLoad = reject;
        }),
    });
    render(<VacayIcsCalendarsSettings mobile={mobile} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    failLoad(new Error('Calendar unavailable'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Calendar unavailable');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('No subscribed calendars yet')).toBeInTheDocument();
  });

  it('uses the public-holiday empty-state and add-calendar styles on mobile', async () => {
    render(<VacayIcsCalendarsSettings mobile />);
    const user = userEvent.setup();

    const emptyState = await screen.findByText('No subscribed calendars yet');
    expect(emptyState.className).toContain('text-caption');
    expect(emptyState.className).toContain('text-m-muted');

    const addButton = screen.getByRole('button', { name: 'Subscribe holidays' });
    expect(addButton.className).toContain('rounded-full');
    expect(addButton.className).toContain('border-dashed');
    expect(addButton.className).not.toContain('mt-2');

    await user.click(addButton);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveAccessibleName('Calendar label');
    expect(inputs[1]).toHaveAccessibleName('Enter an ICS URL');
    const formButtons = screen.getAllByRole('button');
    const closeIndex = formButtons.findIndex((button) => button.getAttribute('aria-label') === 'Close');
    expect(formButtons[closeIndex - 1]).toHaveTextContent('Add');
    await user.click(screen.getByRole('button', { name: 'Color' }));
    for (const color of ['#6366f1', '#ef4444', '#22c55e', '#3b82f6']) {
      expect(screen.getByRole('button', { name: color })).toBeVisible();
    }
  });

  it('shows an empty state and subscribes to an HTTP all-day calendar after initial fetch', async () => {
    const input: { url?: string; label?: string; color?: string } = {};
    let saved: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/addons/vacay/plan/ics-calendars', () => HttpResponse.json({ calendars: saved ? [saved] : [] })),
      http.post('/api/addons/vacay/plan/ics-calendars', async ({ request }) => {
        Object.assign(input, await request.json());
        saved = {
          id: 4,
          label: input.label,
          color: input.color,
          url: input.url,
          last_fetched_at: new Date().toISOString(),
          last_error: null,
          event_count: 1,
        };
        return HttpResponse.json({ calendar: saved });
      }),
      http.get('/api/addons/vacay/entries/:year', () =>
        HttpResponse.json({ entries: [], companyHolidays: [], icsCalendars: [] })
      )
    );
    useVacayStore.setState({ selectedYear: 2026 });
    const user = userEvent.setup();
    render(<VacayIcsCalendarsSettings />);

    expect(await screen.findByText('No subscribed calendars yet')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Subscribe holidays' }));
    const formInputs = screen.getAllByRole('textbox');
    expect(formInputs[0]).toHaveAccessibleName('Calendar label');
    expect(formInputs[1]).toHaveAccessibleName('Enter an ICS URL');
    const formButtons = screen.getAllByRole('button');
    const closeIndex = formButtons.findIndex((button) => button.getAttribute('aria-label') === 'Close');
    expect(formButtons[closeIndex - 1]).toHaveTextContent('Add');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByLabelText('Calendar label')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Subscribe holidays' }));
    const colorButton = screen.getByRole('button', { name: 'Color' });
    await user.click(colorButton);
    expect(screen.getByRole('group', { name: 'Color' })).toBeTruthy();
    await user.click(screen.getByText('No subscribed calendars yet'));
    expect(screen.queryByRole('group', { name: 'Color' })).toBeNull();
    await user.click(colorButton);
    await user.click(screen.getByRole('button', { name: '#ef4444' }));
    await user.type(screen.getByLabelText('Enter an ICS URL'), 'http://calendar.example/holidays.ics');
    await user.type(screen.getByLabelText('Calendar label'), 'Office holidays');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(input).toMatchObject({
        url: 'http://calendar.example/holidays.ics',
        label: 'Office holidays',
        color: '#ef4444',
      })
    );
    expect(useVacayStore.getState().icsCalendarSettings).toEqual([
      expect.objectContaining({ id: 4, label: 'Office holidays', event_count: 1 }),
    ]);
    const savedUrl = screen.getByRole('textbox', { name: 'Enter an ICS URL' });
    expect(savedUrl).toHaveValue('http://calendar.example/holidays.ics');
    expect(savedUrl).toHaveAttribute('readonly');
    await user.click(savedUrl);
    expect(savedUrl).toHaveStyle({ borderRadius: '10px' });
    expect(savedUrl.parentElement?.className).toContain('min-w-0 flex-1 space-y-1.5');
    expect(savedUrl.className).toContain('rounded-[10px]');
  });

  it('keeps subscribed calendar settings but hides the list while subscription is disabled', async () => {
    const updatePlan = vi.fn(async (updates: { ics_holidays_enabled?: boolean }) => {
      useVacayStore.setState((state) => ({
        plan: state.plan ? { ...state.plan, ...updates } : null,
      }));
    });
    useVacayStore.setState({
      plan: {
        id: 1,
        holidays_enabled: false,
        ics_holidays_enabled: true,
        holidays_region: null,
        holiday_calendars: [],
        block_weekends: true,
        carry_over_enabled: false,
        company_holidays_enabled: false,
      },
      updatePlan,
    });
    const user = userEvent.setup();
    render(<VacayIcsCalendarsSettings />);

    await screen.findByRole('button', { name: 'Subscribe holidays' });
    const toggle = screen.getByRole('switch', { name: 'Subscribe holidays' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    await waitFor(() => expect(updatePlan).toHaveBeenCalledWith({ ics_holidays_enabled: false }));
    expect(screen.queryByText('No subscribed calendars yet')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Subscribe holidays' })).toBeNull();

    await user.click(screen.getByRole('switch', { name: 'Subscribe holidays' }));
    expect(await screen.findByText('No subscribed calendars yet')).toBeTruthy();
  });

  it('closes the previous color palette when another calendar palette opens', async () => {
    server.use(
      http.get('/api/addons/vacay/plan/ics-calendars', () =>
        HttpResponse.json({
          calendars: [
            {
              id: 4,
              label: 'Office',
              color: '#a5f3fc',
              url: 'https://calendar.example/one.ics',
              last_fetched_at: null,
              last_error: null,
              event_count: 2,
            },
            {
              id: 5,
              label: 'Team',
              color: '#fed7aa',
              url: 'https://calendar.example/two.ics',
              last_fetched_at: null,
              last_error: null,
              event_count: 3,
            },
          ],
        })
      )
    );
    render(<VacayIcsCalendarsSettings />);

    await screen.findByDisplayValue('Office');
    const colorButtons = screen.getAllByRole('button', { name: 'Color' });
    const user = userEvent.setup();
    await user.click(colorButtons[0]);
    expect(screen.getAllByRole('group', { name: 'Color' })).toHaveLength(1);
    await user.click(colorButtons[1]);
    expect(screen.getAllByRole('group', { name: 'Color' })).toHaveLength(1);
  });
});
