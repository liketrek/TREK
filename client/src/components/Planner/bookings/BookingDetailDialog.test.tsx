// FE-PLANNER-BKDETAIL-001 to FE-PLANNER-BKDETAIL-013
import { render, screen, waitFor, within } from '../../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { buildAssignment, buildDay, buildPlace, buildReservation, buildTrip, buildUser } from '../../../../tests/helpers/factories';
import { resetBodyScrollLock } from '../../../utils/bodyScrollLock';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import { usePluginStore } from '../../../store/pluginStore';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Reservation, ReservationEndpoint } from '../../../types';
import BookingDetailHost, { type BookingDetailHostProps } from './BookingDetailHost';

function ep(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return { role: 'from', sequence: 0, name: 'Stop', code: null, lat: 1, lng: 1, timezone: null, local_time: null, local_date: null, ...over };
}

const onClose = vi.fn();
const toasts: Array<{ message: string; type: string }> = [];

const d1 = buildDay({ id: 1301, day_number: 1, date: '2025-06-01', title: 'Arrival' });
const d2 = buildDay({ id: 1302, day_number: 2, date: '2025-06-02', title: null });
const d3 = buildDay({ id: 1303, day_number: 3, date: '2025-06-04', title: null });

function renderDetail(r: Reservation, props: Partial<BookingDetailHostProps> = {}) {
  return render(
    <BookingDetailHost r={r} tripId={1} days={[d1, d2, d3]} assignments={{}} files={[]} canEdit contributions={[]}
      onClose={onClose} onDelete={vi.fn()} onNavigateToFiles={vi.fn()} {...props} />,
  );
}

beforeEach(() => {
  onClose.mockClear();
  toasts.length = 0;
  resetAllStores();
  resetBodyScrollLock();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }), budgetItems: [] });
  seedStore(useSettingsStore, { settings: { time_format: '24h', blur_booking_codes: false, language: 'en' } });
  usePluginStore.setState({ plugins: [] });
  window.__addToast = ((message: string, type: string) => { toasts.push({ message, type }); return 1; }) as unknown as typeof window.__addToast;
  server.use(http.get('/api/view-contributions/:view/:tripId', () => HttpResponse.json({ contributions: [] })));
});

afterEach(() => {
  delete window.__addToast;
  vi.restoreAllMocks();
});

describe('BookingDetailDialog', () => {
  it('FE-PLANNER-BKDETAIL-001: a transport states its carrier and route in the head, its times as tiles', () => {
    const r = buildReservation({
      title: 'LH 716', type: 'flight', day_id: 1301, reservation_time: '2025-06-01T08:00', reservation_end_time: '2025-06-01T12:30',
      metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH716', platform: 'B', seat: '12A', class: 'Business' }),
      endpoints: [ep({ role: 'from', name: 'Frankfurt', code: 'FRA' }), ep({ role: 'to', sequence: 1, name: 'Haneda', code: 'HND' })],
    });
    renderDetail(r);
    const dialog = screen.getByRole('dialog', { name: 'LH 716' });
    expect(within(dialog).getByText('Lufthansa  LH716  FRA → HND', { normalizer: s => s })).toBeInTheDocument();
    expect(within(dialog).getByText('08:00')).toBeInTheDocument();
    expect(within(dialog).getByText('Frankfurt')).toBeInTheDocument();
    expect(within(dialog).getByText('12:30')).toBeInTheDocument();
    expect(within(dialog).getByText('Haneda')).toBeInTheDocument();
    expect(within(dialog).getByText('12A')).toBeInTheDocument();
    // Seat and platform stand as tiles, not a second time in the fields.
    expect(within(dialog).queryByText('12A, Business')).toBeNull();
    expect(within(dialog).getByText('Arrival')).toBeInTheDocument();
    expect(within(dialog).getByText('Sun, Jun 1')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKDETAIL-002: without endpoints the tiles fall back to Start and End', () => {
    renderDetail(buildReservation({ title: 'Rental', type: 'car', reservation_time: '2025-06-01T09:00', reservation_end_time: '2025-06-02T18:00' }));
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKDETAIL-003: a stay shows check-in, check-out and its nights, without repeating the date', () => {
    const r = buildReservation({
      title: 'Ryokan', type: 'hotel', accommodation_start_day_id: 1301, accommodation_end_day_id: 1303,
      metadata: JSON.stringify({ check_in_time: '15:00', check_out_time: '10:00' }),
    });
    renderDetail(r);
    expect(screen.getByText('Check-in 15:00')).toBeInTheDocument();
    expect(screen.getByText('Check-out 10:00')).toBeInTheDocument();
    expect(screen.getByText('Jun 1')).toBeInTheDocument();
    expect(screen.getByText('Jun 4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Nights')).toBeInTheDocument();
    expect(screen.queryByText('Jun 1 → Jun 4')).toBeNull();
  });

  it('FE-PLANNER-BKDETAIL-004: a stay without an end has no night count', () => {
    renderDetail(buildReservation({ title: 'Guesthouse', type: 'hotel', day_id: 1302 }));
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.queryByText('Nights')).toBeNull();
  });

  it('FE-PLANNER-BKDETAIL-005: a route with stops is listed stop by stop, and segment codes under it', () => {
    const r = buildReservation({
      title: 'Via Munich', type: 'flight',
      metadata: JSON.stringify({ legs: [{ from: 'FRA', to: 'MUC', confirmation_number: 'SEG1' }, { from: 'MUC', to: 'HND', confirmation_number: 'SEG2' }] }),
      endpoints: [
        ep({ role: 'from', name: 'Frankfurt', code: 'FRA', local_time: '07:00' }),
        ep({ role: 'stop', sequence: 1, name: 'Munich', code: null }),
        ep({ role: 'to', sequence: 2, name: 'Haneda', code: 'HND', local_time: '09:00' }),
      ],
    });
    renderDetail(r);
    expect(screen.getByText('Route')).toBeInTheDocument();
    expect(screen.getByText('Munich')).toBeInTheDocument();
    expect(screen.getByText('Segment codes')).toBeInTheDocument();
    expect(screen.getByText('FRA → MUC')).toBeInTheDocument();
    expect(screen.getByText('#SEG2')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKDETAIL-006: place, accommodation, linked stop, link, travelers and notes', () => {
    const place = buildPlace({ name: 'Kinkaku-ji', place_time: '10:00' });
    const a = buildAssignment({ id: 4401, day_id: 1302, place });
    const r = buildReservation({
      title: 'Temple tour', type: 'tour', location: 'Kyoto', accommodation_name: 'Ryokan', assignment_id: 4401, url: 'https://example.com/tour',
      notes: '**Bring** cash', travelers: [{ user_id: 3, username: 'maria' }],
      metadata: JSON.stringify({ price: '30' }),
    });
    renderDetail(r, { assignments: { '1302': [a] } });
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Ryokan')).toBeInTheDocument();
    expect(screen.getByText('Day 2, Kinkaku-ji, 10:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.com/tour' })).toHaveAttribute('href', 'https://example.com/tour');
    expect(screen.getByText('maria')).toBeInTheDocument();
    expect(screen.getByText('Bring')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKDETAIL-007: a link that is not safe stays text', () => {
    renderDetail(buildReservation({ title: 'Odd link', url: 'call the hotel' }));
    expect(screen.getByText('call the hotel')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'call the hotel' })).toBeNull();
  });

  it('FE-PLANNER-BKDETAIL-008: the booking code copies to the clipboard and says so', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderDetail(buildReservation({ title: 'Dinner', confirmation_number: 'XYZ9' }));
    expect(screen.getByText('#XYZ9')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy booking code' }));
    expect(writeText).toHaveBeenCalledWith('XYZ9');
    await waitFor(() => expect(toasts).toContainEqual({ message: 'Copied', type: 'success' }));
  });

  it('FE-PLANNER-BKDETAIL-009: a failed copy says so', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    renderDetail(buildReservation({ title: 'Dinner', confirmation_number: 'XYZ9' }));
    await user.click(screen.getByRole('button', { name: 'Copy booking code' }));
    await waitFor(() => expect(toasts).toContainEqual({ message: 'Could not copy', type: 'error' }));
  });

  it('FE-PLANNER-BKDETAIL-010: clicking the title renames the booking through the store', async () => {
    const user = userEvent.setup();
    const updateReservation = vi.fn(async () => undefined);
    useTripStore.setState({ updateReservation } as never);
    const r = buildReservation({ title: 'Dinner' });
    renderDetail(r);
    await user.click(screen.getByRole('button', { name: 'Dinner' }));
    const field = screen.getByRole('textbox', { name: 'Rename' });
    expect(field).toHaveValue('Dinner');
    // Escape leaves the rename, not the detail under it.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Rename' })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Dinner' }));
    await user.clear(screen.getByRole('textbox', { name: 'Rename' }));
    await user.type(screen.getByRole('textbox', { name: 'Rename' }), 'Kaiseki at Kikunoi');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateReservation).toHaveBeenCalledWith(1, r.id, { title: 'Kaiseki at Kikunoi' });
  });

  it('FE-PLANNER-BKDETAIL-011: an unchanged name saves nothing, a failed rename says so', async () => {
    const user = userEvent.setup();
    const updateReservation = vi.fn(async () => { throw new Error('offline'); });
    useTripStore.setState({ updateReservation } as never);
    renderDetail(buildReservation({ title: 'Dinner' }));
    await user.click(screen.getByRole('button', { name: 'Dinner' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateReservation).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Dinner' }));
    await user.type(screen.getByRole('textbox', { name: 'Rename' }), ' 2');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(toasts).toContainEqual({ message: 'Failed to update', type: 'error' }));
  });

  it('FE-PLANNER-BKDETAIL-012: without the booking right the title is only read', () => {
    renderDetail(buildReservation({ title: 'Dinner', status: 'pending' }), { canEdit: false });
    expect(screen.queryByRole('button', { name: 'Dinner' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Dinner' })).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('FE-PLANNER-BKDETAIL-013: a booking with only an end time shows it in the clock format of the user', () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h', blur_booking_codes: false, language: 'en' } });
    const r = buildReservation({ id: 950, type: 'train', title: 'Night train', status: 'confirmed', reservation_time: null, reservation_end_time: '2025-06-01T15:00' } as never);
    renderDetail(r);
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
    expect(screen.queryByText('15:00')).not.toBeInTheDocument();
  });
});
