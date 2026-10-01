// FE-PLANNER-BOOKINGHOST-001 to FE-PLANNER-BOOKINGHOST-017
import { render, screen, fireEvent, waitFor, within } from '../../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { buildBudgetItem, buildReservation, buildTrip, buildTripFile, buildUser } from '../../../../tests/helpers/factories';
import { resetBodyScrollLock } from '../../../utils/bodyScrollLock';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import { usePluginStore } from '../../../store/pluginStore';
import type { Reservation } from '../../../types';
import BookingDetailHost, { BookingDetailPopup, type BookingDetailHostProps } from './BookingDetailHost';

const calls: string[] = [];
const onClose = vi.fn(() => { calls.push('close'); });

function renderHost(r: Reservation, props: Partial<BookingDetailHostProps> = {}) {
  return render(
    <BookingDetailHost
      r={r}
      tripId={1}
      days={[]}
      assignments={{}}
      files={[]}
      canEdit
      contributions={[]}
      onClose={onClose}
      onDelete={vi.fn()}
      onNavigateToFiles={vi.fn()}
      {...props}
    />,
  );
}

/** The delete question's own "Delete": the one outside the booking's dialog, which has a Delete of its own. */
function questionDelete(dialogName: string) {
  const own = within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'Delete' });
  const answer = screen.getAllByRole('button', { name: 'Delete' }).find(b => b !== own);
  if (!answer) throw new Error('the delete question is not open');
  return answer;
}

const toasts: Array<{ message: string; type: string }> = [];

beforeEach(() => {
  calls.length = 0;
  toasts.length = 0;
  onClose.mockClear();
  resetAllStores();
  resetBodyScrollLock();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }), budgetItems: [] });
  usePluginStore.setState({ plugins: [] });
  window.__addToast = ((message: string, type: string) => { toasts.push({ message, type }); return 1; }) as unknown as typeof window.__addToast;
  server.use(http.get('/api/view-contributions/:view/:tripId', () => HttpResponse.json({ contributions: [] })));
});

afterEach(() => { delete window.__addToast; });

describe('BookingDetailHost', () => {
  it('FE-PLANNER-BOOKINGHOST-001: shows the booking as a dialog named by its title', () => {
    renderHost(buildReservation({ title: 'Dinner at Kikunoi', type: 'restaurant' }));
    expect(screen.getByRole('dialog', { name: 'Dinner at Kikunoi' })).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKINGHOST-002: Edit closes the detail first and then hands the booking to the editor', async () => {
    const r = buildReservation({ title: 'Dinner' });
    const onEdit = vi.fn(() => { calls.push('edit'); });
    renderHost(r, { onEdit });

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(r);
    expect(calls).toEqual(['close', 'edit']);
  });

  it('FE-PLANNER-BOOKINGHOST-003: without an editor there is no Edit, even with the booking right', () => {
    renderHost(buildReservation({ title: 'Dinner' }));
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    // Rename, status and Delete belong to reservation_edit and stay.
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKINGHOST-004: an editor without the booking right shows Edit but no Delete and no status switch', () => {
    renderHost(buildReservation({ title: 'Train', type: 'train', status: 'pending' }), { canEdit: false, onEdit: vi.fn() });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Set to Confirmed' })).toBeNull();
  });

  it('FE-PLANNER-BOOKINGHOST-005: a read-only viewer gets the facts without any footer action', () => {
    renderHost(buildReservation({ title: 'Museum', type: 'tour' }), { canEdit: false });
    expect(screen.getByRole('dialog', { name: 'Museum' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('FE-PLANNER-BOOKINGHOST-006: Delete asks first, then closes the detail before the delete goes out', async () => {
    const r = buildReservation({ title: 'Dinner' });
    const onDelete = vi.fn(async () => { calls.push('delete'); });
    renderHost(r, { onDelete });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('"Dinner" will be permanently deleted.')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(questionDelete('Dinner'));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(r.id));
    expect(calls).toEqual(['close', 'delete']);
  });

  it('FE-PLANNER-BOOKINGHOST-007: a failed delete says so', async () => {
    renderHost(buildReservation({ title: 'Dinner' }), { onDelete: vi.fn(async () => { throw new Error('nope'); }) });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(questionDelete('Dinner'));

    await waitFor(() => expect(toasts).toContainEqual({ message: 'Failed to delete', type: 'error' }));
  });

  it('FE-PLANNER-BOOKINGHOST-008: Escape answers the delete question, not the detail under it', async () => {
    renderHost(buildReservation({ title: 'Dinner' }));

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Delete booking?')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Dinner' })).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKINGHOST-009: the status pill switches the status through the store', async () => {
    const toggleReservationStatus = vi.fn(async () => undefined);
    useTripStore.setState({ toggleReservationStatus } as never);
    const r = buildReservation({ title: 'Dinner', status: 'pending' });
    renderHost(r);

    await userEvent.click(screen.getByRole('button', { name: 'Set to Confirmed' }));

    expect(toggleReservationStatus).toHaveBeenCalledWith(1, r.id);
  });

  it('FE-PLANNER-BOOKINGHOST-010: a failed status switch says so', async () => {
    useTripStore.setState({ toggleReservationStatus: vi.fn(async () => { throw new Error('x'); }) } as never);
    renderHost(buildReservation({ title: 'Dinner', status: 'pending' }));

    await userEvent.click(screen.getByRole('button', { name: 'Set to Confirmed' }));

    await waitFor(() => expect(toasts).toContainEqual({ message: 'Failed to update', type: 'error' }));
  });

  it('FE-PLANNER-BOOKINGHOST-011: On map is offered only for a booking the map can show, and closes first', async () => {
    const onShowOnMap = vi.fn(() => { calls.push('map'); });
    const routed = buildReservation({
      title: 'Shinkansen', type: 'train',
      endpoints: [
        { role: 'from', name: 'Tokyo', lat: 35.68, lng: 139.76, sequence: 0 },
        { role: 'to', name: 'Kyoto', lat: 34.98, lng: 135.75, sequence: 1 },
      ] as never,
    });
    const { unmount } = renderHost(routed, { onShowOnMap, isOnMap: () => true });

    const onMap = screen.getByRole('button', { name: 'On map' });
    expect(onMap).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(onMap);
    expect(onShowOnMap).toHaveBeenCalledWith(routed);
    expect(calls).toEqual(['close', 'map']);
    unmount();

    renderHost(buildReservation({ title: 'Nowhere', place_id: null }), { onShowOnMap });
    expect(screen.queryByRole('button', { name: 'On map' })).toBeNull();
  });

  it('FE-PLANNER-BOOKINGHOST-012: Change route is offered for a transit journey only', async () => {
    const onChangeRoute = vi.fn();
    const journey = buildReservation({ title: 'U2 to Alexanderplatz', type: 'transit' });
    const { unmount } = renderHost(journey, { onChangeRoute });

    await userEvent.click(screen.getByRole('button', { name: 'Change route' }));
    expect(onClose).toHaveBeenCalled();
    expect(onChangeRoute).toHaveBeenCalledWith(journey);
    unmount();

    renderHost(buildReservation({ title: 'Train', type: 'train' }), { onChangeRoute });
    expect(screen.queryByRole('button', { name: 'Change route' })).toBeNull();
  });

  it('FE-PLANNER-BOOKINGHOST-017: a transit journey totals its walking in a tile of its own, and a journey without any has none', () => {
    const journey = (legs: unknown[]) => ({
      ...buildReservation({ title: 'Fernsehturm to Zoo', type: 'transit' }),
      metadata: { transit: { duration: 2400, transfers: 1, legs } },
    }) as unknown as Reservation;
    const ride = { mode: 'SUBWAY', line: 'U2', duration: 1200, from: { name: 'Alexanderplatz' }, to: { name: 'Zoo' } };
    const { unmount } = renderHost(journey([
      { mode: 'WALK', duration: 300, to: { name: 'Alexanderplatz' } },
      ride,
      { mode: 'WALK', duration: 240, to: { name: 'Zoo' } },
    ]));

    expect(screen.getByText('Walking')).toBeInTheDocument();
    expect(screen.getByText('9 min')).toBeInTheDocument();
    unmount();

    renderHost(journey([ride]));
    expect(screen.getByText('Transfers')).toBeInTheDocument();
    expect(screen.queryByText('Walking')).toBeNull();
  });

  it('FE-PLANNER-BOOKINGHOST-013: only the files attached to this booking are listed, and Show in files leaves the detail', async () => {
    const r = buildReservation({ title: 'Hotel', type: 'hotel' });
    const onNavigateToFiles = vi.fn(() => { calls.push('files'); });
    renderHost(r, {
      onNavigateToFiles,
      files: [
        buildTripFile({ original_name: 'voucher.pdf', reservation_id: r.id }),
        buildTripFile({ original_name: 'other.pdf', reservation_id: r.id + 1000 }),
      ],
    });

    expect(screen.getByRole('button', { name: 'voucher.pdf' })).toBeInTheDocument();
    expect(screen.queryByText('other.pdf')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Show in files' }));
    expect(calls).toEqual(['close', 'files']);
  });

  it('FE-PLANNER-BOOKINGHOST-014: a linked expense opens its editor after the detail closed', async () => {
    const r = buildReservation({ title: 'Dinner' });
    const item = buildBudgetItem({ name: 'Dinner bill', reservation_id: r.id } as never);
    useTripStore.setState({ budgetItems: [item, buildBudgetItem({ name: 'Unrelated' })] });
    const onEditExpense = vi.fn(() => { calls.push('expense'); });
    renderHost(r, { onEditExpense });

    expect(screen.queryByText('Unrelated')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Dinner bill/ }));

    expect(onEditExpense).toHaveBeenCalledWith(item);
    expect(calls).toEqual(['close', 'expense']);
  });

  it('FE-PLANNER-BOOKINGHOST-015: a detail-slot plugin draws its frame into the detail', () => {
    usePluginStore.setState({ plugins: [{ id: 'seatmap', name: 'Seat map', type: 'widget', slot: 'reservation-detail' }] as never });
    renderHost(buildReservation({ title: 'Flight', type: 'flight' }));
    expect(screen.getByTitle('Seat map')).toBeInTheDocument();
  });

  it('FE-PLANNER-BOOKINGHOST-016: the popup asks for the contributions of the view the booking belongs to', async () => {
    const views: string[] = [];
    server.use(http.get('/api/view-contributions/:view/:tripId', ({ params }) => {
      views.push(String(params.view));
      return HttpResponse.json({
        contributions: [{ kind: 'column', pluginId: 'p', id: 'c', entityId: 70, label: 'Gate', value: 'B12', tone: 'default' }],
      });
    }));
    const flight = buildReservation({ id: 70, title: 'LH 2020', type: 'flight' });
    const { unmount } = render(
      <BookingDetailPopup r={flight} tripId={1} days={[]} assignments={{}} files={[]} canEdit onClose={onClose} onDelete={vi.fn()} onNavigateToFiles={vi.fn()} />,
    );

    expect(await screen.findByText('B12')).toBeInTheDocument();
    expect(views).toEqual(['transports']);
    unmount();

    const table = buildReservation({ id: 71, title: 'Table', type: 'restaurant' });
    render(<BookingDetailPopup r={table} tripId={1} days={[]} assignments={{}} files={[]} canEdit onClose={onClose} onDelete={vi.fn()} onNavigateToFiles={vi.fn()} />);
    await waitFor(() => expect(views).toEqual(['transports', 'reservations']));
  });
});
