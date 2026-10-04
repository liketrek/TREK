// FE-PLANNER-RESVIEW-001 to FE-PLANNER-RESVIEW-020
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { useSettingsStore } from '../../store/settingsStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip, buildReservation, buildDay, buildBudgetItem } from '../../../tests/helpers/factories';
import { resetBodyScrollLock } from '../../utils/bodyScrollLock';
import type { Reservation } from '../../types';
import ReservationsPanel from './ReservationsPanel';

const onAdd = vi.fn();
const onEdit = vi.fn();
const onDelete = vi.fn();

const d1 = buildDay({ id: 1101, day_number: 1, date: '2025-06-01', title: 'Arrival' });
const d2 = buildDay({ id: 1102, day_number: 2, date: '2025-06-02', title: null });

const flight = buildReservation({
  id: 1201, title: 'LH 716', type: 'flight', status: 'confirmed', reservation_time: '2025-06-01T08:00', reservation_end_time: '2025-06-01T12:00',
  confirmation_number: 'ABC123', metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH716', seat: '12A' }),
  travelers: [{ user_id: 1, username: 'ada' }],
  endpoints: [
    { role: 'from', sequence: 0, name: 'Frankfurt', code: 'FRA', lat: 50, lng: 8, timezone: null, local_time: null, local_date: null },
    { role: 'to', sequence: 1, name: 'Haneda', code: 'HND', lat: 35, lng: 139, timezone: null, local_time: null, local_date: null },
  ],
});
const dinner = buildReservation({ id: 1202, title: 'Kaiseki dinner', type: 'restaurant', status: 'pending', day_id: 1102, reservation_time: '19:00', location: 'Gion' });
const metro = buildReservation({
  id: 1203, title: 'Metro ride', type: 'transit', status: 'confirmed', day_id: 1102,
  metadata: JSON.stringify({ transit: { legs: [{ mode: 'SUBWAY', line: 'Ginza', from: { name: 'Ueno' }, to: { name: 'Ginza' } }] } }),
});

function renderPanel(reservations: Reservation[] = [flight, dinner], props: Partial<Parameters<typeof ReservationsPanel>[0]> = {}) {
  return render(
    <ReservationsPanel
      tripId={1}
      reservations={reservations}
      days={[d1, d2]}
      assignments={{}}
      files={[]}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      onNavigateToFiles={vi.fn()}
      {...props}
    />,
  );
}

const viewButton = (name: 'Cards' | 'List' | 'Timeline') => within(screen.getByRole('group', { name: 'View' })).getByRole('button', { name });

async function openViewOptions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'View options' }));
  return screen.getByRole('menu');
}

beforeEach(() => {
  onAdd.mockClear();
  onEdit.mockClear();
  onDelete.mockClear();
  resetAllStores();
  resetBodyScrollLock();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, start_date: '2025-06-01', end_date: '2025-06-02' }), budgetItems: [] });
  seedStore(useSettingsStore, { settings: { time_format: '24h', blur_booking_codes: false, language: 'en' } });
  server.use(http.get('/api/view-contributions/:view/:tripId', () => HttpResponse.json({ contributions: [] })));
});

describe('ReservationsPanel views', () => {
  it('FE-PLANNER-RESVIEW-001: the list shows one row per booking, grouped by day, and remembers the view', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(viewButton('List'));
    expect(viewButton('List')).toHaveAttribute('aria-pressed', 'true');
    const row = screen.getByRole('button', { name: 'LH 716', pressed: false });
    expect(row).toHaveTextContent('FRA → HND');
    expect(row).toHaveTextContent('Lufthansa LH716');
    expect(row).toHaveTextContent('12A');
    expect(screen.getByRole('button', { name: /Day 1/, expanded: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Day 2/, expanded: true })).toBeInTheDocument();
    expect(localStorage.getItem('trek:bookings-bookings-view')).toBe('"list"');
  });

  it('FE-PLANNER-RESVIEW-002: a list row opens the detail, and its Edit hands the booking on', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(viewButton('List'));
    await user.click(screen.getByRole('button', { name: 'Kaiseki dinner' }));
    const dialog = screen.getByRole('dialog', { name: 'Kaiseki dinner' });
    await user.click(within(dialog).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(dinner);
  });

  it('FE-PLANNER-RESVIEW-003: the arrow keys walk the rows and Enter opens the one in focus', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(viewButton('List'));
    const first = screen.getByRole('button', { name: 'LH 716' });
    first.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Kaiseki dinner' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(first).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'LH 716' })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-004: a list group collapses and opens again', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(viewButton('List'));
    await user.click(screen.getByRole('button', { name: /Day 2/ }));
    expect(screen.queryByRole('button', { name: 'Kaiseki dinner' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /Day 2/ }));
    expect(screen.getByRole('button', { name: 'Kaiseki dinner' })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-005: a list row edits, deletes after a question and switches status', async () => {
    const user = userEvent.setup();
    const toggleReservationStatus = vi.fn(async () => undefined);
    useTripStore.setState({ toggleReservationStatus } as never);
    renderPanel();
    await user.click(viewButton('List'));
    const row = screen.getByRole('button', { name: 'Kaiseki dinner' });
    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(dinner);
    await user.click(within(row).getByRole('button', { name: 'Set to Confirmed' }));
    expect(toggleReservationStatus).toHaveBeenCalledWith(1, 1202);
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/will be permanently deleted/)).toBeInTheDocument();
    const deletes = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deletes[deletes.length - 1]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1202));
  });

  it('FE-PLANNER-RESVIEW-006: a failed status switch says so', async () => {
    const user = userEvent.setup();
    const toasts: string[] = [];
    window.__addToast = ((message: string) => { toasts.push(message); return 1; }) as unknown as typeof window.__addToast;
    useTripStore.setState({ toggleReservationStatus: vi.fn(async () => { throw new Error('offline'); }) } as never);
    renderPanel();
    await user.click(within(screen.getByRole('article', { name: 'Kaiseki dinner' })).getByRole('button', { name: 'Set to Confirmed' }));
    await waitFor(() => expect(toasts.length).toBe(1));
    delete window.__addToast;
  });

  it('FE-PLANNER-RESVIEW-007: a transit journey shows its legs in the list, and linked costs and files on the row', async () => {
    const user = userEvent.setup();
    seedStore(useTripStore, { budgetItems: [buildBudgetItem({ reservation_id: 1202, total_price: 80, currency: 'JPY' } as never)] });
    renderPanel([flight, dinner, metro], { files: [{ id: 5, trip_id: 1, filename: 'a.pdf', original_name: 'menu.pdf', mime_type: 'application/pdf', url: '/f', reservation_id: 1202, created_at: '' } as never] });
    await user.click(viewButton('List'));
    expect(screen.getByRole('button', { name: 'Metro ride' })).toHaveTextContent('Ginza');
    const dinnerRow = screen.getByRole('button', { name: 'Kaiseki dinner' });
    expect(dinnerRow).toHaveTextContent('80');
    expect(within(dinnerRow).getByText('1')).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-008: the timeline draws the bookings and a bar opens the detail', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(viewButton('Timeline'));
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'LH 716' }));
    expect(screen.getByRole('dialog', { name: 'LH 716' })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-009: the timeline options switch the type lanes and the other tab', async () => {
    const user = userEvent.setup();
    const hotel = buildReservation({ id: 1204, type: 'hotel', title: 'Ryokan', accommodation_start_day_id: 1101, accommodation_end_day_id: 1102 });
    renderPanel([flight, dinner], { contributionView: 'transports', contextReservations: [hotel] });
    await user.click(viewButton('Timeline'));
    const menu = await openViewOptions(user);
    await user.click(within(menu).getByRole('button', { name: 'One lane per type' }));
    expect(screen.getByText('All')).toBeInTheDocument();
    await user.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Show the other tab' }));
    expect(JSON.parse(localStorage.getItem('trek:bookings-transports-timeline') || '{}')).toMatchObject({ byType: false, context: false });
    await user.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Reset view' }));
    expect(JSON.parse(localStorage.getItem('trek:bookings-transports-timeline') || '{}')).toMatchObject({ byType: true, context: true });
  });

  it('FE-PLANNER-RESVIEW-010: the view options group and sort the cards', async () => {
    const user = userEvent.setup();
    renderPanel();
    let menu = await openViewOptions(user);
    // "Type" names both a grouping and a sort key; the grouping comes first.
    await user.click(within(menu).getAllByRole('button', { name: 'Type' })[0]);
    expect(screen.getByRole('button', { name: /Restaurant/, expanded: true })).toBeInTheDocument();
    menu = screen.getByRole('menu');
    await user.click(within(menu).getByRole('button', { name: 'No grouping' }));
    expect(screen.queryByRole('button', { name: /Restaurant/, expanded: true })).toBeNull();
    await user.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Title' }));
    expect(within(screen.getByRole('menu')).getByRole('button', { name: 'A to Z' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('menu')).getByRole('button', { name: 'A to Z' }));
    expect(within(screen.getByRole('menu')).getByRole('button', { name: 'Z to A' })).toBeInTheDocument();
    const titles = screen.getAllByRole('article').map(a => a.getAttribute('aria-label'));
    expect(titles).toEqual(['LH 716', 'Kaiseki dinner']);
  });

  it('FE-PLANNER-RESVIEW-011: sorting by date says earliest or latest first, and reset view restores the defaults', async () => {
    const user = userEvent.setup();
    renderPanel();
    const menu = await openViewOptions(user);
    await user.click(within(menu).getByRole('button', { name: 'Earliest first' }));
    expect(within(screen.getByRole('menu')).getByRole('button', { name: 'Latest first' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Reset view' }));
    expect(screen.queryByRole('menu')).toBeNull();
    const again = await openViewOptions(user);
    expect(within(again).getByRole('button', { name: 'Earliest first' })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-012: with transit on the tab, cards can put it in its own section', async () => {
    const user = userEvent.setup();
    renderPanel([flight, dinner, metro]);
    expect(screen.queryByRole('button', { name: /Automated public transit/, expanded: true })).toBeNull();
    const menu = await openViewOptions(user);
    const apart = within(menu).getByRole('button', { name: 'Public transit as its own section' });
    expect(apart).toHaveAttribute('aria-pressed', 'false');
    await user.click(apart);
    expect(screen.getByRole('button', { name: /Automated public transit/, expanded: true })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-013: the view options close on Escape', async () => {
    const user = userEvent.setup();
    renderPanel();
    const menu = await openViewOptions(user);
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('FE-PLANNER-RESVIEW-014: search narrows the cards, counts the results and clears again', async () => {
    const user = userEvent.setup();
    renderPanel();
    const search = screen.getByRole('textbox', { name: 'Search' });
    await user.type(search, 'gion');
    expect(screen.queryByRole('article', { name: 'LH 716' })).toBeNull();
    expect(screen.getByRole('article', { name: 'Kaiseki dinner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 of 2/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(search).toHaveValue('');
    await user.type(search, 'zzz');
    expect(screen.getByText('Nothing matches these filters')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    await user.type(search, 'abc123');
    await user.click(screen.getByRole('button', { name: /1 of 2/ }));
    expect(search).toHaveValue('');
  });

  it('FE-PLANNER-RESVIEW-015: the status filter keeps confirmed or pending bookings and counts on the button', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    const menu = screen.getByRole('menu');
    await user.click(within(menu).getByRole('button', { name: 'Pending' }));
    expect(screen.queryByRole('article', { name: 'LH 716' })).toBeNull();
    expect(within(screen.getByRole('button', { name: 'Filter' })).getByText('1')).toBeInTheDocument();
    await user.click(within(menu).getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByRole('article', { name: 'LH 716' })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-016: a card opens the detail on click or Enter, and Close shuts it', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('article', { name: 'LH 716' }));
    expect(screen.getByRole('dialog', { name: 'LH 716' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog', { name: 'LH 716' })).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'LH 716' })).toBeNull();
    screen.getByRole('article', { name: 'LH 716' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'LH 716' })).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-017: deleting the booking the detail shows closes the detail first', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('article', { name: 'Kaiseki dinner' }));
    expect(screen.getByRole('dialog', { name: 'Kaiseki dinner' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('article', { name: 'Kaiseki dinner' })).getByRole('button', { name: 'Delete' }));
    const deletes = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deletes[deletes.length - 1]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1202));
    expect(screen.queryByRole('dialog', { name: 'Kaiseki dinner' })).toBeNull();
  });

  it('FE-PLANNER-RESVIEW-018: an empty transports tab offers adding, importing and AirTrail', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const onAirTrailImport = vi.fn();
    renderPanel([], { contributionView: 'transports', addManualKey: 'transport.addManual', onImport, bookingImportAvailable: true, onAirTrailImport, airTrailAvailable: true });
    await user.click(screen.getByRole('button', { name: 'Import from file' }));
    expect(onImport).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'AirTrail' }));
    expect(onAirTrailImport).toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Search' })).toBeNull();
  });

  it('FE-PLANNER-RESVIEW-019: a card shows its linked expense and a transit card its journey', () => {
    seedStore(useTripStore, { budgetItems: [buildBudgetItem({ reservation_id: 1201, total_price: 420, currency: 'EUR' } as never)] });
    renderPanel([flight, metro]);
    expect(within(screen.getByRole('article', { name: 'LH 716' })).getByText(/420/)).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Metro ride' })).getByText('Ueno')).toBeInTheDocument();
  });

  it('FE-PLANNER-RESVIEW-020: without the booking right the list rows have no actions', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { reservation_edit: 'admin' } });
    renderPanel();
    await user.click(viewButton('List'));
    const row = screen.getByRole('button', { name: 'LH 716' });
    expect(within(row).queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(within(row).queryByRole('button', { name: /Set to/ })).toBeNull();
  });
});
