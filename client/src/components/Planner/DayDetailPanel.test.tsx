// FE-PLANNER-DAYDETAIL-001 to FE-PLANNER-DAYDETAIL-080
import React from 'react';
import { fireEvent, render, screen, waitFor, within, act } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { useSettingsStore } from '../../store/settingsStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { usePluginStore } from '../../store/pluginStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildAdmin, buildTrip, buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories';
import DayDetailPanel from './DayDetailPanel';

const day = buildDay({ id: 1, trip_id: 1, date: '2025-06-15', title: 'Day in Paris' });

const defaultProps = {
  day,
  days: [day],
  places: [],
  categories: [],
  tripId: 1,
  assignments: {},
  reservations: [],
  lat: null,
  lng: null,
  onClose: vi.fn(),
  onAccommodationChange: vi.fn(),
};

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  server.use(
    http.get('/api/weather/detailed', () => HttpResponse.json({ error: true })),
    http.get('/api/trips/1/accommodations', () => HttpResponse.json({ accommodations: [] })),
  );
  seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  seedStore(useSettingsStore, {
    settings: { time_format: '24h', temperature_unit: 'celsius', blur_booking_codes: false },
  });
});

describe('DayDetailPanel', () => {

  // ── Rendering ────────────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-001: renders without crashing', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-063: publishes its height to --day-panel-h and resets it on unmount (#1348)', () => {
    document.documentElement.style.removeProperty('--day-panel-h');
    const { unmount } = render(<DayDetailPanel {...defaultProps} />);
    // The panel publishes its measured height so the map's mobile GPS button can
    // sit above it instead of being hidden behind it.
    expect(document.documentElement.style.getPropertyValue('--day-panel-h')).not.toBe('');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--day-panel-h')).toBe('0px');
  });

  it('FE-PLANNER-DAYDETAIL-002: returns null when day prop is null', () => {
    render(<DayDetailPanel {...defaultProps} day={null as any} />);
    expect(document.querySelector('[style*="position: fixed"]')).toBeNull();
  });

  it('FE-PLANNER-DAYDETAIL-003: shows day title in header', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(screen.getByText('Day in Paris')).toBeInTheDocument();
  });

  // ── Inline rename (#1065 — moved here from the sidebar pencil) ──────────────

  it('FE-PLANNER-DAYDETAIL-064: pencil next to the title renames the day (Enter commits)', async () => {
    const user = userEvent.setup();
    const onUpdateDayTitle = vi.fn();
    render(<DayDetailPanel {...defaultProps} onUpdateDayTitle={onUpdateDayTitle} />);
    await user.click(screen.getByLabelText('Edit'));
    const input = await screen.findByDisplayValue('Day in Paris');
    await user.clear(input);
    await user.type(input, 'New Title');
    await user.keyboard('{Enter}');
    expect(onUpdateDayTitle).toHaveBeenCalledWith(1, 'New Title');
  });

  it('FE-PLANNER-DAYDETAIL-065: Escape cancels the rename without saving', async () => {
    const user = userEvent.setup();
    const onUpdateDayTitle = vi.fn();
    render(<DayDetailPanel {...defaultProps} onUpdateDayTitle={onUpdateDayTitle} />);
    await user.click(screen.getByLabelText('Edit'));
    await screen.findByDisplayValue('Day in Paris');
    await user.keyboard('{Escape}');
    expect(onUpdateDayTitle).not.toHaveBeenCalled();
    expect(screen.getByText('Day in Paris')).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-066: no rename pencil without the onUpdateDayTitle prop', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-004: shows day number when title is null', () => {
    const untitled = buildDay({ id: 1, trip_id: 1, date: '2025-06-15', title: null });
    render(<DayDetailPanel {...defaultProps} day={untitled} days={[untitled]} />);
    expect(screen.getByText(/Day 1/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-005: shows formatted date when day.date is set', () => {
    render(<DayDetailPanel {...defaultProps} />);
    // Date '2025-06-15' → locale string containing "June" or "15"
    expect(screen.getByText(/June|15/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-006: does NOT show date when day.date is null', () => {
    const noDate = buildDay({ id: 1, trip_id: 1, date: null, title: 'No Date Day' });
    render(<DayDetailPanel {...defaultProps} day={noDate} days={[noDate]} />);
    expect(screen.queryByText(/June|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/i)).toBeNull();
  });

  it('FE-PLANNER-DAYDETAIL-007: close button calls onClose', async () => {
    const onClose = vi.fn();
    render(<DayDetailPanel {...defaultProps} onClose={onClose} />);
    // The header X button — the one outside the hotel picker
    const closeButtons = screen.getAllByRole('button');
    // Second button is the header X close (first is collapse toggle)
    await userEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalled();
  });

  // ── Weather ──────────────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-008: weather section not shown when no lat/lng', async () => {
    render(<DayDetailPanel {...defaultProps} lat={null} lng={null} />);
    await waitFor(() => expect(screen.queryByText(/No weather/i)).toBeNull());
    // No loading spinner either
    expect(document.querySelector('[style*="border-top-color"]')).toBeNull();
  });

  it('FE-PLANNER-DAYDETAIL-009: weather loading state shown briefly', async () => {
    server.use(
      http.get('/api/weather/detailed', () => new Promise(() => {})), // never resolves
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    // Spinner div has border + borderTopColor
    await waitFor(() => {
      const spinner = document.querySelector('[style*="border-radius: 50%"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-DAYDETAIL-010: weather data renders temperature in Celsius', async () => {
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({ main: 'Clear', temp: 22, temp_min: 18, temp_max: 26, description: 'sunny' })
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    await screen.findByText(/22°C/);
  });

  it('FE-PLANNER-DAYDETAIL-011: weather in Fahrenheit when setting is fahrenheit', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '24h', temperature_unit: 'fahrenheit', blur_booking_codes: false },
    });
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({ main: 'Clear', temp: 0, temp_min: 0, temp_max: 0, description: 'cold' })
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    await screen.findByText(/32°F/);
  });

  it('FE-PLANNER-DAYDETAIL-012: no weather shows "No weather data" message', async () => {
    server.use(
      http.get('/api/weather/detailed', () => HttpResponse.json({ error: true })),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    await screen.findByText(/No weather/i);
  });

  // ── Reservations ─────────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-013: shows reservations linked to this day\'s assignments', async () => {
    const place = buildPlace({ name: 'Museum' });
    const reservation = buildReservation({
      id: 1,
      title: 'Museum Tour Ticket',
      assignment_id: 50,
      status: 'confirmed',
    });
    render(<DayDetailPanel
      {...defaultProps}
      assignments={{ '1': [{ id: 50, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }] }}
      reservations={[reservation]}
    />);
    await screen.findByText('Museum Tour Ticket');
  });

  it('FE-PLANNER-DAYDETAIL-014: reservations from OTHER days are not shown', async () => {
    const place = buildPlace({ name: 'Other Venue' });
    const reservation = buildReservation({
      id: 2,
      title: 'Other Day Event',
      assignment_id: 51,
      status: 'confirmed',
    });
    render(<DayDetailPanel
      {...defaultProps}
      // day.id=1, but reservation belongs to assignment_id=51 which is in day '2'
      assignments={{
        '1': [{ id: 50, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }],
        '2': [{ id: 51, place, place_id: place.id, day_id: 2, order_index: 0, notes: null }],
      }}
      reservations={[reservation]}
    />);
    await waitFor(() => {
      expect(screen.queryByText('Other Day Event')).toBeNull();
    });
  });

  it('FE-PLANNER-DAYDETAIL-015: reservation shows formatted time when reservation_time has T', async () => {
    const place = buildPlace({ name: 'Restaurant' });
    const reservation = buildReservation({
      id: 3,
      title: 'Dinner',
      assignment_id: 50,
      status: 'confirmed',
      reservation_time: '2025-06-15T14:30:00Z',
    });
    render(<DayDetailPanel
      {...defaultProps}
      assignments={{ '1': [{ id: 50, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }] }}
      reservations={[reservation]}
    />);
    await screen.findByText('Dinner');
    // Time should be rendered from reservation_time with T — check for a time-like string
    await waitFor(() => {
      // The time is rendered via toLocaleTimeString — match any HH:MM pattern
      const timeEl = screen.queryByText(/\d{1,2}:\d{2}/);
      expect(timeEl).toBeInTheDocument();
    });
  });

  // ── Accommodation ─────────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-016: accommodation section header is always present', async () => {
    render(<DayDetailPanel {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Accommodation/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('FE-PLANNER-DAYDETAIL-017: accommodation with check-in shows hotel name', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Grand Hotel');
  });

  it('FE-PLANNER-DAYDETAIL-018: check-in time shown for check-in day', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null,
          }],
        })
      ),
    );
    // day.id = 1 = start_day_id (check-in day)
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('14:00');
    await waitFor(() => {
      expect(screen.getAllByText(/Check-in/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('FE-PLANNER-DAYDETAIL-019: check-out time shown for check-out day', async () => {
    const checkOutDay = buildDay({ id: 3, trip_id: 1, date: '2025-06-17', title: 'Check Out Day' });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel
      {...defaultProps}
      day={checkOutDay}
      days={[day, checkOutDay]}
    />);
    await screen.findByText('11:00');
  });

  it('FE-PLANNER-DAYDETAIL-020: confirmation code shown', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: 'HOTEL99',
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('HOTEL99');
  });

  it('FE-PLANNER-DAYDETAIL-021: accommodation edit/remove buttons shown when canEditDays=true', async () => {
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: null, confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Grand Hotel');
    // Pencil and X buttons should be present in the accommodation row
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('FE-PLANNER-DAYDETAIL-080: a failing accommodation edit keeps the picker open and says so', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: null, confirmation: null,
          }],
        }),
      ),
      http.put('/api/trips/1/accommodations/1', () => HttpResponse.json({ error: 'Stay overlaps' }, { status: 400 })),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Grand Hotel');
    // The pencil beside the stay opens the picker in edit mode.
    await userEvent.click(document.querySelector('.lucide-pencil')!.closest('button')!);
    const picker = await waitFor(() => document.body.querySelector('[style*="z-index: 99999"]') as HTMLElement);
    await userEvent.click(within(picker).getByText('Save'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Stay overlaps', 'error', undefined));
    // The picker stays put so the entered values are not lost.
    expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-022: accommodation edit/remove buttons hidden when canEditDays=false', async () => {
    // Use regular user + restrict day_edit to admin only
    const regularUser = buildUser({ id: 999, role: 'user' });
    seedStore(useAuthStore, { user: regularUser, isAuthenticated: true });
    seedStore(usePermissionsStore, { permissions: { day_edit: 'admin' } });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Budget Inn', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '15:00', check_out: null, confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Budget Inn');
    // No edit/remove buttons — only close button in header
    const buttons = screen.getAllByRole('button');
    // Should only have the header collapse + close buttons, no pencil/X in accommodation
    expect(buttons).toHaveLength(2);
  });

  // ── Adding accommodation ──────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-023: "Add accommodation" button visible when canEditDays=true and no accommodation', async () => {
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText(/Add accommodation/i);
  });

  it('FE-PLANNER-DAYDETAIL-024: clicking add accommodation opens hotel picker', async () => {
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    render(<DayDetailPanel {...defaultProps} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    // Hotel picker portal renders into document.body
    await waitFor(() => {
      expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeInTheDocument();
    });
  });

  // ── Blur booking codes ────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-025: linked booking confirmation code is blurred when blur_booking_codes=true', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '24h', temperature_unit: 'celsius', blur_booking_codes: true },
    });
    const linkedReservation = buildReservation({
      id: 10,
      title: 'Hotel Booking',
      status: 'confirmed',
      confirmation_number: 'SECRET',
      accommodation_id: 1,
    });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Secret Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: null, confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} reservations={[linkedReservation]} />);
    await screen.findByText('Secret Hotel');
    // Find the element containing the confirmation number
    await waitFor(() => {
      const el = screen.getByText(/#SECRET/);
      expect(el).toHaveStyle({ filter: 'blur(4px)' });
    });
  });

  // ── Weather chips ─────────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-026: weather chips render precipitation, wind, sunrise, sunset', async () => {
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({
          main: 'Rain',
          temp: 15,
          temp_min: 12,
          temp_max: 18,
          description: 'rainy',
          precipitation_probability_max: 80,
          precipitation_sum: 5.2,
          wind_max: 30,
          sunrise: '06:30',
          sunset: '20:15',
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    await screen.findByText('80%');
    await screen.findByText('5.2 mm');
    await screen.findByText('30 km/h');
    await screen.findByText('06:30');
    await screen.findByText('20:15');
  });

  it('FE-PLANNER-DAYDETAIL-027: weather chips show Fahrenheit wind speed', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '24h', temperature_unit: 'fahrenheit', blur_booking_codes: false },
    });
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({
          main: 'Clouds',
          temp: 20,
          temp_min: 15,
          temp_max: 25,
          description: 'cloudy',
          wind_max: 50,
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    // 50 km/h * 0.621371 ≈ 31 mph
    await screen.findByText('31 mph');
  });

  // ── Hotel picker interactions ─────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-028: hotel picker cancel button closes the picker', async () => {
    render(<DayDetailPanel {...defaultProps} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    // Picker opened
    await waitFor(() => {
      expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeInTheDocument();
    });
    // Click cancel button inside picker
    const cancelButton = screen.getByText(/Cancel/i);
    await userEvent.click(cancelButton);
    await waitFor(() => {
      expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeNull();
    });
  });

  it('FE-PLANNER-DAYDETAIL-029: hotel picker shows places list when places are provided', async () => {
    const place1 = buildPlace({ id: 10, name: 'Hotel du Nord', address: '102 Quai de Jemmapes' });
    const place2 = buildPlace({ id: 11, name: 'Hotel du Sud', address: null });
    render(<DayDetailPanel {...defaultProps} places={[place1, place2]} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    await screen.findByText('Hotel du Nord');
    await screen.findByText('Hotel du Sud');
    await screen.findByText('102 Quai de Jemmapes');
  });

  it('FE-PLANNER-DAYDETAIL-030: selecting a place in hotel picker enables save button', async () => {
    const place = buildPlace({ id: 10, name: 'Maison Blanche' });
    server.use(
      http.post('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodation: {
            id: 99, place_id: 10, place_name: 'Maison Blanche', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: null, check_out: null, confirmation: null,
          },
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} places={[place]} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    await screen.findByText('Maison Blanche');
    // Click the place button
    const placeButton = screen.getByRole('button', { name: /Maison Blanche/i });
    await userEvent.click(placeButton);
    // Save button should now be enabled
    const saveButton = screen.getByText(/Save/i);
    expect(saveButton).not.toBeDisabled();
  });

  it('FE-PLANNER-DAYDETAIL-031: hotel picker shows no places message when list is empty', async () => {
    render(<DayDetailPanel {...defaultProps} places={[]} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    await waitFor(() => {
      const portal = document.body.querySelector('[style*="z-index: 99999"]');
      expect(portal).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-DAYDETAIL-032: edit accommodation button opens picker in edit mode', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Edit Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '15:00', check_out: '10:00', confirmation: 'EDIT01',
          }],
        })
      ),
    );
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Edit Hotel');
    // All buttons: header collapse (0), header close (1), pencil (2), X/remove (3)
    const allButtons = screen.getAllByRole('button');
    // Pencil is third button (index 2)
    const pencilButton = allButtons[2];
    await userEvent.click(pencilButton);
    // Edit picker should open with "Edit accommodation" title
    await waitFor(() => {
      const portal = document.body.querySelector('[style*="z-index: 99999"]');
      expect(portal?.textContent).toMatch(/Edit accommodation/i);
    });
  });

  it('FE-PLANNER-DAYDETAIL-033: hotel picker "all days" button selects full trip range', async () => {
    const day2 = buildDay({ id: 2, trip_id: 1, date: '2025-06-16', title: 'Day 2' });
    const day3 = buildDay({ id: 3, trip_id: 1, date: '2025-06-17', title: 'Day 3' });
    render(<DayDetailPanel {...defaultProps} days={[day, day2, day3]} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    await waitFor(() => {
      const portal = document.body.querySelector('[style*="z-index: 99999"]');
      expect(portal?.textContent).toMatch(/Day in Paris|Day 2|Day 3/i);
    });
  });

  it('FE-PLANNER-DAYDETAIL-067: hotel picker defaults check-out to the day AFTER check-in', async () => {
    const day2 = buildDay({ id: 2, trip_id: 1, date: '2025-06-16', title: 'Day 2' });
    const day3 = buildDay({ id: 3, trip_id: 1, date: '2025-06-17', title: 'Day 3' });
    render(<DayDetailPanel {...defaultProps} days={[day, day2, day3]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await waitFor(() => {
      const portal = document.body.querySelector('[style*="z-index: 99999"]');
      // Closed selects render only their chosen label: check-in on the opened
      // day, check-out on the following one — nobody stays a few hours.
      expect(portal?.textContent).toContain('Day in Paris');
      expect(portal?.textContent).toContain('Day 2');
      expect(portal?.textContent).not.toContain('Day 3');
    });
  });

  it('FE-PLANNER-DAYDETAIL-068: hotel picker falls back to a same-day range on the last trip day', async () => {
    render(<DayDetailPanel {...defaultProps} days={[day]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await waitFor(() => {
      const portal = document.body.querySelector('[style*="z-index: 99999"]');
      expect(portal?.textContent?.match(/Day in Paris/g)).toHaveLength(2);
    });
  });

  it('FE-PLANNER-DAYDETAIL-034: accommodation with all fields shows full details grid', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Full Details Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 1, check_in: '14:00', check_out: '11:00', confirmation: 'FULL01',
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Full Details Hotel');
    await waitFor(() => {
      expect(screen.getAllByText(/Check-in/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Check-out/i).length).toBeGreaterThanOrEqual(1);
    });
    await screen.findByText('FULL01');
  });

  it('FE-PLANNER-DAYDETAIL-035: middle-day accommodation shows no check-in/out label', async () => {
    const middleDay = buildDay({ id: 2, trip_id: 1, date: '2025-06-16', title: 'Middle Day' });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Overnight Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} day={middleDay} days={[day, middleDay]} />);
    await screen.findByText('Overnight Hotel');
    expect(screen.queryByText(/Check-in & Check-out/i)).toBeNull();
  });

  it('FE-PLANNER-DAYDETAIL-036: weather hourly data renders hour entries', async () => {
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({
          main: 'Clear',
          temp: 20,
          temp_min: 15,
          temp_max: 25,
          description: 'sunny',
          hourly: [
            { hour: 8, main: 'Clear', temp: 18, precipitation_probability: 0 },
            { hour: 10, main: 'Clear', temp: 20, precipitation_probability: 10 },
            { hour: 12, main: 'Clouds', temp: 22, precipitation_probability: 60 },
          ],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    await screen.findByText(/20°C/);
    // Hourly renders every other entry (i % 2 === 0): hours 8 and 12
    await waitFor(() => {
      expect(screen.getByText('08')).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-DAYDETAIL-037: climate type weather shows average indicator', async () => {
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({
          main: 'Clear',
          type: 'climate',
          temp: 18,
          temp_min: 14,
          temp_max: 22,
          description: 'average',
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    await screen.findByText(/Ø/);
  });

  it('FE-PLANNER-DAYDETAIL-038: hotel picker with category filter renders category buttons', async () => {
    const { buildCategory } = await import('../../../tests/helpers/factories');
    const cat = buildCategory({ id: 1, name: 'Hotels' });
    const place = buildPlace({ id: 10, name: 'Hotel Belmont', category_id: 1 });
    render(<DayDetailPanel {...defaultProps} places={[place]} categories={[cat]} />);
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    await waitFor(() => {
      const portal = document.body.querySelector('[style*="z-index: 99999"]');
      expect(portal?.textContent).toMatch(/Hotels/);
    });
  });

  it('FE-PLANNER-DAYDETAIL-039: add another accommodation button visible when accommodations exist', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Existing Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: null, confirmation: null,
          }],
        })
      ),
    );
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Existing Hotel');
    // "Add accommodation" dashed button should also appear for adding more
    await screen.findByText(/Add accommodation/i);
  });

  it('FE-PLANNER-DAYDETAIL-041: save new accommodation calls API and updates list', async () => {
    const place = buildPlace({ id: 10, name: 'New Hotel' });
    server.use(
      http.post('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodation: {
            id: 99, place_id: 10, place_name: 'New Hotel', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: null, check_out: null, confirmation: null,
          },
        })
      ),
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({ accommodations: [] })
      ),
    );
    render(<DayDetailPanel {...defaultProps} places={[place]} />);
    // Open picker
    const addButton = await screen.findByText(/Add accommodation/i);
    await userEvent.click(addButton);
    // Select a place
    const placeBtn = await screen.findByRole('button', { name: /New Hotel/i });
    await userEvent.click(placeBtn);
    // Click Save
    const saveButton = screen.getByText(/Save/i);
    await userEvent.click(saveButton);
    // Picker should close after save
    await waitFor(() => {
      expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeNull();
    });
  });

  it('FE-PLANNER-DAYDETAIL-042: remove accommodation calls delete API', async () => {
    let deleteWasCalled = false;
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 5, place_id: 5, place_name: 'Hotel To Remove', place_address: 'Paris',
            start_day_id: 1, end_day_id: 1, check_in: null, check_out: null, confirmation: null,
          }],
        })
      ),
      http.delete('/api/trips/1/accommodations/5', () => {
        deleteWasCalled = true;
        return HttpResponse.json({ success: true });
      }),
    );
    seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Hotel To Remove');
    // Buttons: collapse (0), close header (1), pencil (2), X/remove (3)
    const allButtons = screen.getAllByRole('button');
    const removeButton = allButtons[3];
    await userEvent.click(removeButton);
    await waitFor(() => {
      expect(deleteWasCalled).toBe(true);
    });
  });

  it('FE-PLANNER-DAYDETAIL-043: 12h check-in time formatted with AM/PM', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '12h', temperature_unit: 'celsius', blur_booking_codes: false },
    });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'AM Hotel', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: '14:00', check_out: '09:00', confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('AM Hotel');
    // 14:00 in 12h = 2:00 PM
    await waitFor(() => {
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-DAYDETAIL-044: accommodation with linked pending reservation shows pending status', async () => {
    const pendingReservation = buildReservation({
      id: 20,
      title: 'Pending Booking',
      status: 'pending',
      confirmation_number: null,
      accommodation_id: 1,
    });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Pending Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: null, confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} reservations={[pendingReservation]} />);
    await screen.findByText('Pending Hotel');
    await screen.findByText('Pending Booking');
    await waitFor(() => {
      expect(screen.getAllByText(/pending/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('FE-PLANNER-DAYDETAIL-045: weather API network error is handled gracefully', async () => {
    server.use(
      http.get('/api/weather/detailed', () => HttpResponse.error()),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.8566} lng={2.3522} />);
    // Should show "No weather" after error (catch sets weather to null)
    await screen.findByText(/No weather/i);
  });

  it('FE-PLANNER-DAYDETAIL-046: save edited accommodation calls update API', async () => {
    let updateCalled = false;
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 7, place_id: 5, place_name: 'Edit Me Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 1, check_in: '15:00', check_out: null, confirmation: null,
          }],
        })
      ),
      http.put('/api/trips/1/accommodations/7', () => {
        updateCalled = true;
        return HttpResponse.json({
          accommodation: {
            id: 7, place_id: 5, place_name: 'Edit Me Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 1, check_in: '15:00', check_out: null, confirmation: 'NEW01',
          },
        });
      }),
    );
    const place = buildPlace({ id: 5, name: 'Edit Me Hotel' });
    render(<DayDetailPanel {...defaultProps} places={[place]} />);
    await screen.findByText('Edit Me Hotel');
    // Click the pencil/edit button (index 2, after collapse and close buttons)
    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[2]);
    // Picker opens in edit mode
    await waitFor(() => {
      expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeInTheDocument();
    });
    // Click Save in the edit picker
    const saveButton = screen.getByText(/Save/i);
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(updateCalled).toBe(true);
    });
  });

  it('FE-PLANNER-DAYDETAIL-047: blurred confirmation code revealed on click', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '24h', temperature_unit: 'celsius', blur_booking_codes: true },
    });
    const linkedReservation = buildReservation({
      id: 11,
      title: 'Blurred Booking',
      status: 'confirmed',
      confirmation_number: 'REVEAL123',
      accommodation_id: 2,
    });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 2, place_id: 5, place_name: 'Blurred Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: null, confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} reservations={[linkedReservation]} />);
    await screen.findByText('Blurred Hotel');
    const codeEl = await screen.findByText(/#REVEAL123/);
    // Initially blurred
    expect(codeEl).toHaveStyle({ filter: 'blur(4px)' });
    // Fire mouse events to cover the event handler code paths
    await userEvent.hover(codeEl);
    await userEvent.unhover(codeEl);
    await userEvent.click(codeEl);
  });

  // ── Collapse behavior ─────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-048: collapse button has title "Collapse" when expanded', () => {
    render(<DayDetailPanel {...defaultProps} collapsed={false} />);
    const collapseBtn = screen.getByTitle('Collapse');
    expect(collapseBtn).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-049: collapse button has title "Expand" when collapsed', () => {
    render(<DayDetailPanel {...defaultProps} collapsed={true} />);
    const expandBtn = screen.getByTitle('Expand');
    expect(expandBtn).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-050: content area is hidden when collapsed=true', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Visible Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 1, check_in: null, check_out: null, confirmation: null,
          }],
        })
      ),
    );
    render(<DayDetailPanel {...defaultProps} collapsed={true} />);
    await waitFor(() => {
      const content = document.querySelector('[style*="overflow-y: auto"]');
      expect(content).toHaveStyle({ display: 'none' });
    });
  });

  it('FE-PLANNER-DAYDETAIL-051: content area is visible when collapsed=false', async () => {
    render(<DayDetailPanel {...defaultProps} collapsed={false} />);
    await waitFor(() => {
      const content = document.querySelector('[style*="overflow-y: auto"]');
      expect(content).toHaveStyle({ display: 'block' });
    });
  });

  it('FE-PLANNER-DAYDETAIL-052: clicking the collapse button calls onToggleCollapse', async () => {
    const onToggleCollapse = vi.fn();
    render(<DayDetailPanel {...defaultProps} collapsed={false} onToggleCollapse={onToggleCollapse} />);
    const collapseBtn = screen.getByTitle('Collapse');
    await userEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it('FE-PLANNER-DAYDETAIL-053: clicking the header row calls onToggleCollapse', async () => {
    const onToggleCollapse = vi.fn();
    render(<DayDetailPanel {...defaultProps} collapsed={false} onToggleCollapse={onToggleCollapse} />);
    // The header div (contains title text) is the clickable toggle area
    await userEvent.click(screen.getByText('Day in Paris'));
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it('FE-PLANNER-DAYDETAIL-054: when collapsed, date appears inline in title row', () => {
    render(<DayDetailPanel {...defaultProps} collapsed={true} />);
    // Title and date are in the same element when collapsed
    const titleEl = screen.getByText(/Day in Paris/);
    expect(titleEl.textContent).toMatch(/June|15/i);
  });

  it('FE-PLANNER-DAYDETAIL-055: when expanded, date is shown in a separate element below title', () => {
    render(<DayDetailPanel {...defaultProps} collapsed={false} />);
    const titleEl = screen.getByText('Day in Paris');
    // The date should be in a sibling element, not inside the title element itself
    expect(titleEl.textContent).toBe('Day in Paris');
    expect(screen.getByText(/June|15/i)).toBeInTheDocument();
  });

  // ── Accommodation date-range picker — non-monotonic day IDs (issue #889) ─────

  // Builds the reporter's exact ID layout: day_number 1-9 → IDs 17-25, day_number 10-16 → IDs 1-7.
  // This happens after repeated trip-length changes via generateDays (no import/migration needed).
  function buildNonMonotonicDays() {
    return [
      buildDay({ id: 17, trip_id: 1, date: '2026-04-30' }),
      buildDay({ id: 18, trip_id: 1, date: '2026-05-01' }),
      buildDay({ id: 19, trip_id: 1, date: '2026-05-02' }),
      buildDay({ id: 20, trip_id: 1, date: '2026-05-03' }),
      buildDay({ id: 21, trip_id: 1, date: '2026-05-04' }),
      buildDay({ id: 22, trip_id: 1, date: '2026-05-05' }),
      buildDay({ id: 23, trip_id: 1, date: '2026-05-06' }),
      buildDay({ id: 24, trip_id: 1, date: '2026-05-07' }),
      buildDay({ id: 25, trip_id: 1, date: '2026-05-08' }),
      buildDay({ id: 1,  trip_id: 1, date: '2026-05-09' }),
      buildDay({ id: 2,  trip_id: 1, date: '2026-05-10' }),
      buildDay({ id: 3,  trip_id: 1, date: '2026-05-11' }),
      buildDay({ id: 4,  trip_id: 1, date: '2026-05-12' }),
      buildDay({ id: 5,  trip_id: 1, date: '2026-05-13' }),
      buildDay({ id: 6,  trip_id: 1, date: '2026-05-14' }),
      buildDay({ id: 7,  trip_id: 1, date: '2026-05-15' }),
    ];
  }

  // Returns the two CustomSelect trigger buttons for start/end day pickers.
  // When no dropdown is open, these are the only globally-visible buttons whose textContent
  // matches /Day \d+/ (the main panel title is a div, not a button).
  // [0] = start trigger, [1] = end trigger (DOM source order).
  function getDayPickerTriggers() {
    return screen.getAllByRole('button').filter(b => /Day \d+/.test(b.textContent ?? ''));
  }

  it('FE-PLANNER-DAYDETAIL-056: non-monotonic IDs — end picker does not clobber start-day', async () => {
    const days = buildNonMonotonicDays();
    const place = buildPlace({ id: 50, name: 'Range Hotel' });
    let capturedBody: any;
    server.use(
      http.post('/api/trips/1/accommodations', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          accommodation: {
            id: 99, place_id: 50, place_name: 'Range Hotel', place_address: null,
            start_day_id: capturedBody.start_day_id, end_day_id: capturedBody.end_day_id,
            check_in: null, check_out: null, confirmation: null,
          },
        });
      }),
    );

    render(<DayDetailPanel {...defaultProps} day={days[0]} days={days} places={[place]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await userEvent.click(await screen.findByRole('button', { name: /Range Hotel/i }));

    // Both triggers show "Day 1"; the second one is the end picker.
    await userEvent.click(getDayPickerTriggers()[1]);
    // Select "Day 16" (id=7) from the open dropdown — textContent starts with "Day 16".
    await userEvent.click(screen.getAllByRole('button').find(b => b.textContent?.startsWith('Day 16'))!);

    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      // start must remain id 17 (day 1) — old code would clobber it to id 7 via Math.min
      expect(capturedBody?.start_day_id).toBe(17);
      expect(capturedBody?.end_day_id).toBe(7);
    });
  });

  it('FE-PLANNER-DAYDETAIL-057: non-monotonic IDs — start picker does not collapse end when start has high ID', async () => {
    const days = buildNonMonotonicDays();
    const place = buildPlace({ id: 51, name: 'Span Hotel' });
    let capturedBody: any;
    server.use(
      http.post('/api/trips/1/accommodations', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          accommodation: {
            id: 100, place_id: 51, place_name: 'Span Hotel', place_address: null,
            start_day_id: capturedBody.start_day_id, end_day_id: capturedBody.end_day_id,
            check_in: null, check_out: null, confirmation: null,
          },
        });
      }),
    );

    render(<DayDetailPanel {...defaultProps} day={days[0]} days={days} places={[place]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await userEvent.click(await screen.findByRole('button', { name: /Span Hotel/i }));

    // Set end to day 16 (id=7, low ID but last day by position).
    await userEvent.click(getDayPickerTriggers()[1]);
    await userEvent.click(screen.getAllByRole('button').find(b => b.textContent?.startsWith('Day 16'))!);

    // Set start to day 9 (id=25, high ID, but earlier by position than day 16).
    // Old code: Math.max(25, 7) = 25 → end collapses to day 9.
    // New code: position(id=25)=8 < position(id=7)=15 → end stays at 7 (day 16).
    await userEvent.click(getDayPickerTriggers()[0]);
    await userEvent.click(screen.getAllByRole('button').find(b => b.textContent?.startsWith('Day 9'))!);

    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(capturedBody?.start_day_id).toBe(25); // day 9
      expect(capturedBody?.end_day_id).toBe(7);    // day 16 — must NOT have collapsed
    });
  });

  it('FE-PLANNER-DAYDETAIL-058: non-monotonic IDs — All days button sets correct first/last IDs', async () => {
    const days = buildNonMonotonicDays();
    const place = buildPlace({ id: 52, name: 'Full Trip Hotel' });
    let capturedBody: any;
    server.use(
      http.post('/api/trips/1/accommodations', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          accommodation: {
            id: 101, place_id: 52, place_name: 'Full Trip Hotel', place_address: null,
            start_day_id: capturedBody.start_day_id, end_day_id: capturedBody.end_day_id,
            check_in: null, check_out: null, confirmation: null,
          },
        });
      }),
    );

    render(<DayDetailPanel {...defaultProps} day={days[0]} days={days} places={[place]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await userEvent.click(await screen.findByRole('button', { name: /Full Trip Hotel/i }));

    // "All" is the day.allDays translation (en: "All") — the Apply-to-entire-trip button.
    // When categories=[] the category-filter "All" button is not rendered, so this is unique.
    await userEvent.click(screen.getByRole('button', { name: /^All$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      // days[0].id=17 (first by position), days[15].id=7 (last by position)
      expect(capturedBody?.start_day_id).toBe(17);
      expect(capturedBody?.end_day_id).toBe(7);
    });
  });

  it('FE-PLANNER-DAYDETAIL-059: sequential IDs — end picker clamping still works (regression guard)', async () => {
    const seqDays = [
      buildDay({ id: 101, trip_id: 1, date: '2026-06-01' }),
      buildDay({ id: 102, trip_id: 1, date: '2026-06-02' }),
      buildDay({ id: 103, trip_id: 1, date: '2026-06-03' }),
    ];
    const place = buildPlace({ id: 53, name: 'Seq Hotel' });
    let capturedBody: any;
    server.use(
      http.post('/api/trips/1/accommodations', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          accommodation: {
            id: 102, place_id: 53, place_name: 'Seq Hotel', place_address: null,
            start_day_id: capturedBody.start_day_id, end_day_id: capturedBody.end_day_id,
            check_in: null, check_out: null, confirmation: null,
          },
        });
      }),
    );

    render(<DayDetailPanel {...defaultProps} day={seqDays[0]} days={seqDays} places={[place]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await userEvent.click(await screen.findByRole('button', { name: /Seq Hotel/i }));

    // Pick end = day 3 (id=103, position 2 > position 0 of start id=101).
    await userEvent.click(getDayPickerTriggers()[1]);
    await userEvent.click(screen.getAllByRole('button').find(b => b.textContent?.startsWith('Day 3'))!);

    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(capturedBody?.start_day_id).toBe(101);
      expect(capturedBody?.end_day_id).toBe(103);
    });
  });

  // ── Post-save state filter — non-monotonic IDs (issue #889 follow-up) ────────

  it('FE-PLANNER-DAYDETAIL-060: non-monotonic IDs — hotel stays visible after edit-save (issue #889 regression)', async () => {
    const days = buildNonMonotonicDays();
    let getCallCount = 0;
    server.use(
      http.get('/api/trips/1/accommodations', () => {
        getCallCount++;
        const acc = getCallCount === 1
          // Initial load: single-day so old filter (17>=17 && 17<=17) passes — hotel visible, edit possible
          ? { id: 1, place_id: 50, place_name: 'Span Hotel', place_address: null, start_day_id: 17, end_day_id: 17, check_in: null, check_out: null, confirmation: null }
          // Post-save relist: full span — old filter (17>=17 && 17<=7) would drop it, new code keeps it
          : { id: 1, place_id: 50, place_name: 'Span Hotel', place_address: null, start_day_id: 17, end_day_id: 7, check_in: null, check_out: null, confirmation: null };
        return HttpResponse.json({ accommodations: [acc] });
      }),
      http.put('/api/trips/1/accommodations/1', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          accommodation: { id: 1, place_id: 50, place_name: 'Span Hotel', place_address: null,
            start_day_id: body.start_day_id, end_day_id: body.end_day_id,
            check_in: null, check_out: null, confirmation: null },
        });
      }),
    );

    render(<DayDetailPanel {...defaultProps} day={days[0]} days={days} />);
    await screen.findByText('Span Hotel');

    // Pencil = 3rd button (index 2): collapse, close, pencil, remove
    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[2]);

    // Extend end picker to Day 16 (id=7)
    await userEvent.click(getDayPickerTriggers()[1]);
    await userEvent.click(screen.getAllByRole('button').find(b => b.textContent?.startsWith('Day 16'))!);
    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    // Old code: 17>=17 && 17<=7 → false (hotel vanishes). New code: position 0 in [0,15] → visible.
    await waitFor(() => {
      expect(screen.getByText('Span Hotel')).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-DAYDETAIL-061: non-monotonic IDs — hotel appears after create-save on intermediate day', async () => {
    const days = buildNonMonotonicDays();
    const place = buildPlace({ id: 55, name: 'Created Hotel' });
    // Current day: days[5] = id 22, position 5 (within any full-span range)
    const currentDay = days[5];
    server.use(
      http.post('/api/trips/1/accommodations', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          accommodation: { id: 200, place_id: 55, place_name: 'Created Hotel', place_address: null,
            start_day_id: body.start_day_id, end_day_id: body.end_day_id,
            check_in: null, check_out: null, confirmation: null },
        });
      }),
    );

    render(<DayDetailPanel {...defaultProps} day={currentDay} days={days} places={[place]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await userEvent.click(await screen.findByRole('button', { name: /Created Hotel/i }));

    // Extend end to Day 16 (id=7) — start stays at current day id=22
    await userEvent.click(getDayPickerTriggers()[1]);
    await userEvent.click(screen.getAllByRole('button').find(b => b.textContent?.startsWith('Day 16'))!);
    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    // Old code: 22>=22 && 22<=7 → false (hotel vanishes). New code: position 5 in [5,15] → visible.
    await waitFor(() => {
      expect(screen.getByText('Created Hotel')).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-DAYDETAIL-062: non-monotonic IDs — hotel shown on initial load when it spans the full trip', async () => {
    const days = buildNonMonotonicDays();
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{ id: 1, place_id: 60, place_name: 'Full Trip Hotel', place_address: null,
            start_day_id: 17, end_day_id: 7, check_in: null, check_out: null, confirmation: null }],
        })
      ),
    );

    // Day 1 (id=17): old filter: 17>=17 && 17<=7 → false. New: position 0 in [0,15] → visible.
    render(<DayDetailPanel {...defaultProps} day={days[0]} days={days} />);
    await screen.findByText('Full Trip Hotel');

    // Intermediate day (id=1, position 9): old filter: 1>=17 → false. New: 9 in [0,15] → visible.
    render(<DayDetailPanel {...defaultProps} day={days[9]} days={days} />);
    await screen.findByText('Full Trip Hotel');
  });

  it('FE-PLANNER-DAYDETAIL-040: 12h time format renders reservation time with AM/PM', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '12h', temperature_unit: 'celsius', blur_booking_codes: false },
    });
    const place = buildPlace({ name: 'Bistro' });
    const reservation = buildReservation({
      id: 20,
      title: 'Lunch',
      assignment_id: 60,
      status: 'confirmed',
      reservation_time: '2025-06-15T13:00:00Z',
    });
    render(<DayDetailPanel
      {...defaultProps}
      assignments={{ '1': [{ id: 60, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }] }}
      reservations={[reservation]}
    />);
    await screen.findByText('Lunch');
    // 12h format: some AM/PM-like string
    await waitFor(() => {
      const timeEl = screen.queryByText(/AM|PM|\d{1,2}:\d{2}/i);
      expect(timeEl).toBeInTheDocument();
    });
  });

  // ── Header buttons ──────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-069: the collapse and close buttons reset their hover background on leave', async () => {
    render(<DayDetailPanel {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const collapse = buttons.find(b => b.getAttribute('title') === 'Collapse')!;
    const close = buttons[buttons.indexOf(collapse) + 1];
    for (const btn of [collapse, close]) {
      act(() => { btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
      expect(btn.style.background).toBe('var(--bg-hover)');
      act(() => { btn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); });
      expect(btn.style.background).toBe('var(--bg-secondary)');
    }
  });

  // ── Reservation list filtering ──────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-070: hotel bookings are kept out of the day reservation list', async () => {
    const hotel = buildReservation({ id: 30, title: 'Hotel Stay', type: 'hotel', status: 'confirmed', day_id: 1 } as any);
    const dinner = buildReservation({ id: 31, title: 'Dinner', type: 'restaurant', status: 'confirmed', day_id: 1 } as any);
    render(<DayDetailPanel {...defaultProps} reservations={[hotel, dinner]} />);
    await screen.findByText('Dinner');
    // The hotel belongs to the accommodation section, not the bookings list.
    expect(screen.queryByText('Hotel Stay')).not.toBeInTheDocument();
  });

  // ── Accommodation time formatting ───────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-071: an ISO check-in is rendered as a local time, not the raw string', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'ISO Hotel', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: '2025-06-15T14:30:00Z', check_out: null, confirmation: null,
          }],
        })),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('ISO Hotel');
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    expect(screen.queryByText('2025-06-15T14:30:00Z')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-072: a non-numeric check-in is passed through untouched', async () => {
    seedStore(useSettingsStore, {
      settings: { time_format: '12h', temperature_unit: 'celsius', blur_booking_codes: false },
    });
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Odd Hotel', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: 'on arrival', check_out: null, confirmation: null,
          }],
        })),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('Odd Hotel');
    expect(screen.getByText('on arrival')).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-073: an existing accommodation still offers to add another', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'First Hotel', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: '14:00', check_out: '11:00', confirmation: 'X1',
          }],
        })),
    );
    render(<DayDetailPanel {...defaultProps} />);
    await screen.findByText('First Hotel');
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await waitFor(() => expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeInTheDocument());
  });

  // ── Hotel picker ────────────────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-074: the picker closes on its X button and on a backdrop click', async () => {
    render(<DayDetailPanel {...defaultProps} />);
    const open = async () => {
      await userEvent.click(await screen.findByText(/Add accommodation/i));
      return await waitFor(() => document.body.querySelector('[style*="z-index: 99999"]') as HTMLElement);
    };
    let overlay = await open();
    // The X sits in the picker header, right after the title.
    await userEvent.click(within(overlay).getByText(/Add accommodation/i).parentElement!.querySelector('button')!);
    await waitFor(() => expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeNull());

    overlay = await open();
    await userEvent.click(overlay);
    await waitFor(() => expect(document.body.querySelector('[style*="z-index: 99999"]')).toBeNull());
  });

  it('FE-PLANNER-DAYDETAIL-075: check-in, check-in-until, check-out and confirmation feed the saved accommodation', async () => {
    const place = buildPlace({ id: 70, name: 'Pension Anna' });
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/accommodations', async ({ request }) => {
        body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          accommodation: { id: 300, place_id: 70, place_name: 'Pension Anna', place_address: null,
            start_day_id: 1, end_day_id: 1, check_in: '15:00', check_in_end: '20:00', check_out: '10:00', confirmation: 'ZZ-9' },
        });
      }),
    );
    render(<DayDetailPanel {...defaultProps} places={[place]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    await userEvent.click(await screen.findByRole('button', { name: /Pension Anna/i }));

    const overlay = document.body.querySelector('[style*="z-index: 99999"]') as HTMLElement;
    const timeInputs = within(overlay).getAllByPlaceholderText(/^(14:00|22:00|11:00)$/);
    await userEvent.type(timeInputs[0], '15:00');
    await userEvent.type(timeInputs[1], '20:00');
    await userEvent.type(timeInputs[2], '10:00');
    await userEvent.type(within(overlay).getByPlaceholderText('ABC-12345'), 'ZZ-9');
    await userEvent.click(within(overlay).getByRole('button', { name: /^Save$/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ place_id: 70, check_in: '15:00', check_in_end: '20:00', check_out: '10:00', confirmation: 'ZZ-9' });
  });

  it('FE-PLANNER-DAYDETAIL-076: the category filter narrows the picker list and "All days" clears it', async () => {
    const categories = [
      { id: 1, name: 'Hotels', color: '#8b5cf6' },
      { id: 2, name: 'Sights', color: '#ef4444' },
    ] as any;
    const places = [
      buildPlace({ id: 80, name: 'Hotel Adlon', category_id: 1 } as any),
      buildPlace({ id: 81, name: 'Brandenburg Gate', category_id: 2 } as any),
    ];
    render(<DayDetailPanel {...defaultProps} places={places} categories={categories} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    const overlay = document.body.querySelector('[style*="z-index: 99999"]') as HTMLElement;

    await userEvent.click(within(overlay).getByRole('button', { name: 'Hotels' }));
    expect(within(overlay).getByText('Hotel Adlon')).toBeInTheDocument();
    expect(within(overlay).queryByText('Brandenburg Gate')).not.toBeInTheDocument();

    // A category with no places falls back to the empty hint.
    await userEvent.click(within(overlay).getByRole('button', { name: 'Sights' }));
    expect(within(overlay).queryByText('Hotel Adlon')).not.toBeInTheDocument();

    await userEvent.click(within(overlay).getAllByRole('button', { name: /^All$/ })[1]);
    expect(within(overlay).getByText('Hotel Adlon')).toBeInTheDocument();
    expect(within(overlay).getByText('Brandenburg Gate')).toBeInTheDocument();
  });

  it('FE-PLANNER-DAYDETAIL-077: hovering an unselected place row highlights it and clears again', async () => {
    const places = [buildPlace({ id: 90, name: 'Hostel One' })];
    render(<DayDetailPanel {...defaultProps} places={places} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    const row = (await screen.findByText('Hostel One')).closest('button') as HTMLButtonElement;
    act(() => { row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    expect(row.style.background).toBe('var(--bg-hover)');
    act(() => { row.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); });
    expect(row.style.background).toBe('none');
  });

  it('FE-PLANNER-DAYDETAIL-078: the picker reports when the trip has no places to pick from', async () => {
    render(<DayDetailPanel {...defaultProps} places={[]} />);
    await userEvent.click(await screen.findByText(/Add accommodation/i));
    expect(await screen.findByText('Add places to your trip first')).toBeInTheDocument();
  });

  // ── Day-detail plugin slot ──────────────────────────────────────────────────

  it('FE-PLANNER-DAYDETAIL-079: a day-detail widget plugin mounts a sandboxed frame scoped to the day', async () => {
    seedStore(usePluginStore, {
      plugins: [
        { id: 'day-notes', name: 'Day Notes', type: 'widget', icon: null, slot: 'day-detail' },
        { id: 'hero-thing', name: 'Hero', type: 'widget', icon: null, slot: 'hero' },
      ],
    });
    render(<DayDetailPanel {...defaultProps} />);
    const frame = await waitFor(() => document.querySelector('iframe[src*="day-notes"]') as HTMLIFrameElement);
    expect(frame).not.toBeNull();
    expect(document.querySelector('iframe[src*="hero-thing"]')).toBeNull();
  });

});

// FE-W5DDP-001 to FE-W5DDP-013 — the remaining formatting, reservation-row and
// hotel-picker branches of the day panel.
describe('DayDetailPanel remaining branches', () => {
  const hotel = (overrides: Record<string, unknown> = {}) => ({
    id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
    start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null,
    ...overrides,
  });

  it('FE-W5DDP-001: reservation times follow the 12h preference around midnight and noon', async () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h', temperature_unit: 'celsius', blur_booking_codes: false } });
    render(
      <DayDetailPanel
        {...defaultProps}
        reservations={[
          buildReservation({ id: 9, type: 'event', title: 'Night Show', day_id: 1, reservation_time: '00:15', reservation_end_time: '12:45', status: 'confirmed' }),
          buildReservation({ id: 10, type: 'tour', title: 'Afternoon Tour', day_id: 1, reservation_time: '14:30', reservation_end_time: null, status: 'pending' }),
        ]}
      />,
    );

    expect(await screen.findByText('12:15 AM – 12:45 PM')).toBeInTheDocument();
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('FE-W5DDP-002: a reservation without any time shows no time span', async () => {
    render(
      <DayDetailPanel
        {...defaultProps}
        reservations={[buildReservation({ id: 9, type: 'event', title: 'Open Ticket', day_id: 1, reservation_time: null, reservation_end_time: null })]}
      />,
    );

    const row = (await screen.findByText('Open Ticket')).closest('div[style*="border-radius: 8px"]') as HTMLElement;
    expect(row.textContent).toBe('Open Ticket');
  });

  it('FE-W5DDP-003: an unknown reservation type falls back to the generic icon and names its place', async () => {
    const place = buildPlace({ id: 10, name: 'Opera House' });
    render(
      <DayDetailPanel
        {...defaultProps}
        assignments={{ '1': [{ id: 77, day_id: 1, place }] as never }}
        reservations={[
          buildReservation({ id: 9, type: 'submarine', title: 'Deep Dive', assignment_id: 77, day_id: null }),
          buildReservation({ id: 11, type: 'hotel', title: 'Hidden Hotel', day_id: 1 }),
          buildReservation({ id: 12, type: 'flight', title: 'Other Day Flight', day_id: 2 }),
        ]}
      />,
    );

    const row = (await screen.findByText('Deep Dive')).closest('div[style*="border-radius: 8px"]') as HTMLElement;
    expect(row.querySelector('svg')?.getAttribute('class')).toMatch(/file-text/);
    expect(row).toHaveTextContent('Opera House');
    // hotels are shown in the accommodation block, other days are not shown at all
    expect(screen.queryByText('Hidden Hotel')).not.toBeInTheDocument();
    expect(screen.queryByText('Other Day Flight')).not.toBeInTheDocument();
  });

  it('FE-W5DDP-004: a hotel photo, a check-in window and a confirmation code all render', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({ accommodations: [hotel({ place_image: '/uploads/places/hotel.jpg', check_in_end: '18:00', confirmation: 'ABC123' })] }),
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);

    expect(await screen.findByText('14:00 – 18:00')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(document.querySelector('img[src="/uploads/places/hotel.jpg"]')).not.toBeNull();
  });

  it('FE-W5DDP-005: a blurred booking code unblurs on hover and toggles on click', async () => {
    seedStore(useSettingsStore, { settings: { time_format: '24h', temperature_unit: 'celsius', blur_booking_codes: true } });
    server.use(
      http.get('/api/trips/1/accommodations', () => HttpResponse.json({ accommodations: [hotel({ accommodation_id: 1 })] })),
    );
    render(
      <DayDetailPanel
        {...defaultProps}
        reservations={[buildReservation({ id: 40, type: 'hotel', title: 'Grand Hotel Booking', accommodation_id: 1, status: 'confirmed', confirmation_number: 'XY99' })]}
      />,
    );

    const code = await screen.findByText('#XY99');
    expect(code.style.filter).toBe('blur(4px)');

    fireEvent.mouseEnter(code);
    expect(code.style.filter).toBe('none');
    fireEvent.mouseLeave(code);
    expect(code.style.filter).toBe('blur(4px)');

    fireEvent.click(code);
    expect(code.style.filter).toBe('none');
    fireEvent.click(code);
    expect(code.style.filter).toBe('blur(4px)');
  });

  it('FE-W5DDP-006: saving the edit picker updates the accommodation and reloads the list', async () => {
    const user = userEvent.setup();
    const onAccommodationChange = vi.fn();
    let updateBody: Record<string, unknown> | null = null;
    let listCalls = 0;
    server.use(
      http.get('/api/trips/1/accommodations', () => {
        listCalls += 1;
        return HttpResponse.json({
          accommodations: [hotel(listCalls > 1 ? { place_name: 'Reloaded Hotel' } : {})],
        });
      }),
      http.put('/api/trips/1/accommodations/1', async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ accommodation: hotel() });
      }),
    );

    render(<DayDetailPanel {...defaultProps} places={[buildPlace({ id: 5, name: 'Grand Hotel' })]} onAccommodationChange={onAccommodationChange} />);
    await screen.findByText('Grand Hotel');
    await user.click(screen.getAllByRole('button').find(b => b.querySelector('svg')?.getAttribute('class')?.includes('pencil')) as HTMLElement);
    await user.click(await screen.findByText(/^Save$/i));

    await waitFor(() => expect(updateBody).not.toBeNull());
    expect(updateBody).toMatchObject({ place_id: 5, start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null });
    await waitFor(() => expect(screen.getByText('Reloaded Hotel')).toBeInTheDocument());
    expect(onAccommodationChange).toHaveBeenCalled();
  });

  it('FE-W5DDP-007: the hotel picker filters the place list by category', async () => {
    const user = userEvent.setup();
    const museums = { id: 3, name: 'Museums', color: '#ff0000' };
    render(
      <DayDetailPanel
        {...defaultProps}
        categories={[museums] as never}
        places={[
          buildPlace({ id: 10, name: 'Maison Blanche', category_id: 3 }),
          buildPlace({ id: 11, name: 'Chez Nous', category_id: 4 }),
        ]}
      />,
    );
    await user.click(await screen.findByText(/Add accommodation/i));

    expect(screen.getByRole('button', { name: /Chez Nous/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Museums' }));
    expect(screen.queryByRole('button', { name: /Chez Nous/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maison Blanche/ })).toBeInTheDocument();

    const filterRow = screen.getByRole('button', { name: 'Museums' }).parentElement as HTMLElement;
    await user.click(within(filterRow).getByRole('button', { name: /^All$/ }));
    expect(screen.getByRole('button', { name: /Chez Nous/ })).toBeInTheDocument();
  });

  it('FE-W5DDP-008: the day-range pickers badge dated days, titled days and nothing else', async () => {
    const user = userEvent.setup();
    const dated = buildDay({ id: 1, trip_id: 1, date: '2025-06-15', title: 'Day in Paris' });
    const titled = buildDay({ id: 2, trip_id: 1, date: null, title: 'Free Day' });
    const bare = buildDay({ id: 3, trip_id: 1, date: null, title: null });

    render(<DayDetailPanel {...defaultProps} day={dated} days={[dated, titled, bare]} places={[buildPlace({ id: 10, name: 'Maison Blanche' })]} />);
    await user.click(await screen.findByText(/Add accommodation/i));

    // open the "from" select — the option rows carry the badges
    const range = screen.getByText('Apply to days').parentElement as HTMLElement;
    await user.click(within(range).getAllByRole('button')[0]);

    expect(screen.getAllByText('Jun 15').length).toBeGreaterThanOrEqual(1);
    const freeDay = screen.getAllByRole('button', { name: /Free Day/ });
    expect(freeDay.some(b => b.textContent?.includes('Day 2'))).toBe(true);
    expect(screen.getAllByRole('button', { name: /^Day 3$/ }).length).toBeGreaterThanOrEqual(1);
  });

  it('FE-W5DDP-009: a day without a title falls back to its position and hides the pencil', () => {
    const bare = buildDay({ id: 2, trip_id: 1, date: null, title: null });
    render(<DayDetailPanel {...defaultProps} day={bare} days={[defaultProps.day, bare]} />);

    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
  });

  it('FE-W5DDP-010: renaming a day that is not in the list still commits the draft', async () => {
    const user = userEvent.setup();
    const onUpdateDayTitle = vi.fn();
    const orphan = buildDay({ id: 9, trip_id: 1, date: null, title: null });
    render(<DayDetailPanel {...defaultProps} day={orphan} days={[]} onUpdateDayTitle={onUpdateDayTitle} />);

    expect(screen.getByText('Day ?')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Edit'));
    const input = await screen.findByPlaceholderText('Day ?');
    await user.type(input, 'Named Later');
    fireEvent.blur(input);

    expect(onUpdateDayTitle).toHaveBeenCalledWith(9, 'Named Later');
  });

  it('FE-W5DDP-011: an unmapped weather condition falls back to the cloud icon', async () => {
    server.use(
      http.get('/api/weather/detailed', () =>
        HttpResponse.json({
          main: 'Sandstorm', temp: 30, description: 'blowing sand', type: 'forecast',
          hourly: [{ hour: 9, main: 'Sandstorm', temp: 28, precipitation_probability: 0 }],
        }),
      ),
    );
    render(<DayDetailPanel {...defaultProps} lat={48.85} lng={2.35} />);

    expect(await screen.findByText('blowing sand')).toBeInTheDocument();
    expect(document.querySelectorAll('svg[class*="lucide-cloud"]').length).toBeGreaterThanOrEqual(2);
  });

  it('FE-W5DDP-012: an ISO check-in timestamp is rendered in local time', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({ accommodations: [hotel({ check_in: '2025-06-15T14:00', check_out: null })] }),
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);

    expect(await screen.findByText('14:00')).toBeInTheDocument();
  });

  it('FE-W5DDP-013: the collapsed header keeps the title and the date on one line', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();
    const { rerender } = render(<DayDetailPanel {...defaultProps} collapsed={false} onToggleCollapse={onToggleCollapse} />);

    await user.click(screen.getByTitle('Collapse'));
    expect(onToggleCollapse).toHaveBeenCalled();

    rerender(<DayDetailPanel {...defaultProps} collapsed onToggleCollapse={onToggleCollapse} />);
    const header = screen.getByText('Day in Paris').closest('div') as HTMLElement;
    expect(header).toHaveTextContent(/Sunday, June 15/);
    expect(screen.getByTitle('Expand')).toBeInTheDocument();
  });
});

// FE-W5DDP-014 to FE-W5DDP-020
describe('DayDetailPanel remaining branches, part two', () => {
  const hotel = (overrides: Record<string, unknown> = {}) => ({
    id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
    start_day_id: 1, end_day_id: 3, check_in: '14:00', check_out: '11:00', confirmation: null,
    ...overrides,
  });

  it('FE-W5DDP-014: an unblurred booking code stays readable and pending bookings look different', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () => HttpResponse.json({ accommodations: [hotel()] })),
    );
    render(
      <DayDetailPanel
        {...defaultProps}
        reservations={[buildReservation({ id: 40, type: 'hotel', title: 'Grand Hotel Booking', accommodation_id: 1, status: 'pending', confirmation_number: 'XY99' })]}
      />,
    );

    const code = await screen.findByText('#XY99');
    expect(code.style.filter).toBe('none');
    expect(code.style.cursor).toBe('default');

    fireEvent.mouseEnter(code);
    fireEvent.click(code);
    fireEvent.mouseLeave(code);
    expect(code.style.filter).toBe('none');
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('FE-W5DDP-015: mobile mode lifts the panel and works without a ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    try {
      const { container } = render(<DayDetailPanel {...defaultProps} mobile collapsed />);
      const panel = container.firstElementChild as HTMLElement;

      expect(panel.style.zIndex).toBe('10000');
      expect(document.documentElement.style.getPropertyValue('--day-panel-h')).not.toBe('');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('FE-W5DDP-016: with coordinates the reservations block gets its own divider', async () => {
    render(
      <DayDetailPanel
        {...defaultProps}
        lat={48.85}
        lng={2.35}
        reservations={[buildReservation({ id: 9, type: 'event', title: 'Late Entry', day_id: 1, reservation_time: null, reservation_end_time: '22:30' })]}
      />,
    );

    expect(await screen.findByText('Late Entry')).toBeInTheDocument();
    expect(screen.getByText('– 22:30')).toBeInTheDocument();
  });

  it('FE-W5DDP-017: moving the start day past the end day drags the end day with it', async () => {
    const user = userEvent.setup();
    const d1 = buildDay({ id: 1, trip_id: 1, date: '2025-06-15', title: 'Day in Paris' });
    const d2 = buildDay({ id: 2, trip_id: 1, date: '2025-06-16', title: 'Day Two' });
    render(<DayDetailPanel {...defaultProps} day={d1} days={[d1, d2]} places={[buildPlace({ id: 10, name: 'Maison Blanche' })]} />);
    await user.click(await screen.findByText(/Add accommodation/i));

    const range = screen.getByText('Apply to days').parentElement as HTMLElement;
    const [fromSelect, toSelect] = within(range).getAllByRole('button');

    await user.click(fromSelect);
    await user.click(screen.getAllByRole('button', { name: /Day Two/ })[0]);
    expect(within(range).getAllByRole('button')[1]).toHaveTextContent('Day Two');

    await user.click(within(range).getAllByRole('button')[1] === toSelect ? toSelect : within(range).getAllByRole('button')[1]);
    await user.click(screen.getAllByRole('button', { name: /Day in Paris/ })[0]);
    expect(within(range).getAllByRole('button')[0]).toHaveTextContent('Day in Paris');

    // moving each end back inside the range leaves the other one alone
    await user.click(within(range).getAllByRole('button')[1]);
    await user.click(screen.getAllByRole('button', { name: /Day Two/ })[0]);
    expect(within(range).getAllByRole('button')[0]).toHaveTextContent('Day in Paris');

    await user.click(within(range).getAllByRole('button')[0]);
    await user.click(screen.getAllByRole('button', { name: /Day in Paris/ })[0]);
    expect(within(range).getAllByRole('button')[1]).toHaveTextContent('Day Two');
  });

  it('FE-W5DDP-018: the picked place keeps its highlight on hover and shows its photo', async () => {
    const user = userEvent.setup();
    const withPhoto = buildPlace({ id: 10, name: 'Maison Blanche', image_url: '/uploads/places/mb.jpg', address: null });
    const other = buildPlace({ id: 11, name: 'Chez Nous' });
    render(<DayDetailPanel {...defaultProps} places={[withPhoto, other]} />);
    await user.click(await screen.findByText(/Add accommodation/i));

    const picked = screen.getByRole('button', { name: /Maison Blanche/ });
    await user.click(picked);
    expect(picked.style.background).toBe('var(--bg-hover)');

    fireEvent.mouseEnter(picked);
    fireEvent.mouseLeave(picked);
    expect(picked.style.background).toBe('var(--bg-hover)');
    expect(document.querySelector('img[src="/uploads/places/mb.jpg"]')).not.toBeNull();
  });

  it('FE-W5DDP-019: a category without a colour falls back to the default filter highlight', async () => {
    const user = userEvent.setup();
    render(
      <DayDetailPanel
        {...defaultProps}
        categories={[{ id: 3, name: 'Uncoloured', color: null }] as never}
        places={[buildPlace({ id: 10, name: 'Maison Blanche', category_id: 3 })]}
      />,
    );
    await user.click(await screen.findByText(/Add accommodation/i));

    const chip = screen.getByRole('button', { name: 'Uncoloured' });
    await user.click(chip);
    expect(chip.style.background).toBe('var(--text-primary)');
  });

  it('FE-W5DDP-022: a plugin column for this day is appended above the reservations', async () => {
    server.use(
      http.get('/api/view-contributions/day/1', () =>
        HttpResponse.json({ contributions: [{ kind: 'column', pluginId: 'sun', entityId: 1, label: 'Daylight', value: '15h 20m', tone: 'default' }] }),
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);

    expect(await screen.findByText('15h 20m')).toBeInTheDocument();
  });

  it('FE-W5DDP-021: a collapsed untitled day falls back to its position, or to ? when it has none', () => {
    const bare = buildDay({ id: 2, trip_id: 1, date: null, title: null });
    const { unmount } = render(<DayDetailPanel {...defaultProps} day={bare} days={[defaultProps.day, bare]} collapsed />);
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    unmount();

    render(<DayDetailPanel {...defaultProps} day={bare} days={[]} collapsed />);
    expect(screen.getByText('Day ?')).toBeInTheDocument();
  });

  it('FE-W5DDP-020: an empty reload after the edit-save clears the accommodation', async () => {
    const user = userEvent.setup();
    let listCalls = 0;
    server.use(
      http.get('/api/trips/1/accommodations', () => {
        listCalls += 1;
        return listCalls === 1 ? HttpResponse.json({ accommodations: [hotel()] }) : HttpResponse.json({});
      }),
      http.put('/api/trips/1/accommodations/1', () => HttpResponse.json({ accommodation: hotel() })),
    );

    render(<DayDetailPanel {...defaultProps} places={[buildPlace({ id: 5, name: 'Grand Hotel' })]} />);
    await screen.findByText('Grand Hotel');
    await user.click(screen.getAllByRole('button').find(b => b.querySelector('svg')?.getAttribute('class')?.includes('pencil')) as HTMLElement);
    await user.click(await screen.findByText(/^Save$/i));

    expect(await screen.findByText(/Add accommodation/i)).toBeInTheDocument();
  });
});

// FE-DDP1725-001 to -003 — the day panel reads times through the shared formatter, so a
// value that was stored with a meridiem still follows the configured format (#1725).
describe('DayDetailPanel time format', () => {
  const meridiemRes = (overrides: Record<string, unknown> = {}) =>
    buildReservation({
      id: 9, type: 'event', title: 'Matinee', day_id: 1,
      reservation_time: '3:00 PM', reservation_end_time: '11:00 PM', status: 'confirmed',
      ...overrides,
    });

  it('FE-DDP1725-001: a reservation stored with a meridiem shows in 24h', async () => {
    render(<DayDetailPanel {...defaultProps} reservations={[meridiemRes()]} />);
    expect(await screen.findByText('15:00 – 23:00')).toBeInTheDocument();
  });

  it('FE-DDP1725-002: the same reservation keeps its afternoon in 12h', async () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h', temperature_unit: 'celsius', blur_booking_codes: false } });
    render(<DayDetailPanel {...defaultProps} reservations={[meridiemRes()]} />);
    expect(await screen.findByText('3:00 PM – 11:00 PM')).toBeInTheDocument();
  });

  it('FE-DDP1725-003: an accommodation check-in stored with a meridiem shows in 24h', async () => {
    server.use(
      http.get('/api/trips/1/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, place_id: 5, place_name: 'Grand Hotel', place_address: 'Paris',
            start_day_id: 1, end_day_id: 3, check_in: '3:00 PM', check_in_end: null,
            check_out: '11:00 AM', confirmation: null,
          }],
        }),
      ),
    );
    render(<DayDetailPanel {...defaultProps} />);

    expect(await screen.findByText('15:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });
});
