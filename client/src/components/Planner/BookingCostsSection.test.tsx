// FE-PLANNER-COSTSEC-001 to FE-PLANNER-COSTSEC-019
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildBudgetItem, buildTrip } from '../../../tests/helpers/factories';
import { useTripStore } from '../../store/tripStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatMoney } from '../../utils/formatters';
import { BookingCostsSection } from './BookingCostsSection';
import type { BudgetItem } from '../../types';

// getByText collapses the no-break space Intl puts between amount and symbol,
// so the expected amount is collapsed the same way.
const money = (amount: number, currency: string) => formatMoney(amount, currency, 'en').replace(/\s/g, ' ');

const flight = buildBudgetItem({ id: 11, trip_id: 1, name: 'Flight LH 400', total_price: 420, currency: 'EUR', category: 'flights', reservation_id: 9 });
const upgrade = buildBudgetItem({ id: 12, trip_id: 1, name: 'Seat upgrade', total_price: 80, currency: 'USD', category: 'fees', reservation_id: 9 });
const elsewhere = buildBudgetItem({ id: 13, trip_id: 1, name: 'Train ride', total_price: 30, reservation_id: 10 });
const museum = buildBudgetItem({ id: 14, trip_id: 1, name: 'Museum pass', total_price: 25, category: 'activities', place_id: 4 });
const souvenirs = buildBudgetItem({ id: 15, trip_id: 1, name: 'Souvenirs', total_price: 18, currency: 'EUR', category: 'shopping' });
const snacks = buildBudgetItem({ id: 16, trip_id: 1, name: 'Snacks', total_price: 7, currency: 'EUR', category: 'food' });

function renderSection(props: Partial<React.ComponentProps<typeof BookingCostsSection>> = {}) {
  const handlers = { onCreate: vi.fn(), onEdit: vi.fn(), onRemove: vi.fn() };
  render(<BookingCostsSection reservationId={9} {...handlers} {...props} />);
  return handlers;
}

/** A linked expense's row: its name sits two levels below the row itself. */
const rowOf = (name: string) => screen.getByText(name).parentElement!.parentElement as HTMLElement;

/** The trigger of the "link an expense" dropdown, found by what it currently says. */
const linkSelect = (label: RegExp = /Link existing expense/) => screen.getByRole('button', { name: label });

/** Records every expense update and answers with the merged item. */
function captureUpdates() {
  const bodies: { id: number; body: Record<string, unknown> }[] = [];
  server.use(
    http.put('/api/trips/1/budget/:itemId', async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push({ id: Number(params.itemId), body });
      const current = useTripStore.getState().budgetItems.find(i => i.id === Number(params.itemId));
      return HttpResponse.json({ item: { ...current, ...body } });
    }),
    http.get('/api/trips/1/reservations', () => HttpResponse.json({ reservations: [] })),
  );
  return bodies;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }), budgetItems: [flight, upgrade, elsewhere, museum, souvenirs, snacks] });
});

describe('BookingCostsSection', () => {
  // ── Nothing linked yet ──────────────────────────────────────────────────────

  it('FE-PLANNER-COSTSEC-001: with nothing linked it offers create and link side by side, with the hint below', () => {
    seedStore(useTripStore, { budgetItems: [souvenirs] });
    renderSection();
    expect(screen.getByText('Costs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create expense/ })).toBeInTheDocument();
    expect(linkSelect()).toBeEnabled();
    expect(screen.getByText('Saves the booking, then opens the Costs editor.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unlink, keep the expense' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-002: before the first save there is nothing to link to, so the select is missing', () => {
    const { onCreate } = renderSection({ reservationId: null });
    expect(screen.queryByRole('button', { name: /Link existing expense|No unlinked expenses/ })).not.toBeInTheDocument();
    // Only the create button is left in the row.
    const create = screen.getByRole('button', { name: /Create expense/ });
    expect(create.parentElement!.style.gridTemplateColumns).toBe('1fr');
    create.click();
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Saves the booking, then opens the Costs editor.')).toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-003: once the record exists the create button shares its row with the select', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /Create expense/ }).parentElement!.style.gridTemplateColumns).toBe('1fr 1fr');
  });

  it('FE-PLANNER-COSTSEC-004: the select offers only expenses without any link, with their amount', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(linkSelect());
    const souvenirOption = screen.getByRole('button', { name: /Souvenirs/ });
    expect(souvenirOption).toHaveTextContent(money(18, 'EUR'));
    expect(screen.getByRole('button', { name: /Snacks/ })).toBeInTheDocument();
    // Linked to another booking or to a place: not offered, so linking never steals it.
    expect(screen.queryByRole('button', { name: /Train ride/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Museum pass/ })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-005: picking an expense in the select links it to the booking', async () => {
    const user = userEvent.setup();
    const bodies = captureUpdates();
    renderSection();
    await user.click(linkSelect());
    await user.click(screen.getByRole('button', { name: /Souvenirs/ }));

    await waitFor(() => expect(bodies).toEqual([{ id: 15, body: { reservation_id: 9 } }]));
    // It now sits in the linked list with its own row actions.
    expect(await screen.findByText('Souvenirs')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Unlink, keep the expense' })).toHaveLength(3);
  });

  it('FE-PLANNER-COSTSEC-006: the select can be searched by name', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(linkSelect());
    await user.type(screen.getByPlaceholderText('...'), 'snack');
    expect(screen.getByRole('button', { name: /Snacks/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Souvenirs/ })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-007: with no unlinked expense left the select says so and stays shut', () => {
    seedStore(useTripStore, { budgetItems: [flight, elsewhere, museum] });
    renderSection();
    expect(linkSelect(/No unlinked expenses/)).toBeDisabled();
  });

  // ── Linked expenses ────────────────────────────────────────────────────────

  it('FE-PLANNER-COSTSEC-008: every linked expense is listed with its category and amount, and the hint goes', () => {
    renderSection();
    expect(screen.getByText('Linked expenses')).toBeInTheDocument();
    expect(screen.getByText('Flight LH 400')).toBeInTheDocument();
    expect(screen.getByText('Seat upgrade')).toBeInTheDocument();
    expect(screen.getByText('Flights')).toBeInTheDocument();
    expect(screen.getByText('Fees & tickets')).toBeInTheDocument();
    expect(screen.getByText(money(420, 'EUR'))).toBeInTheDocument();
    // Each amount stays in the expense's own currency.
    expect(screen.getByText(money(80, 'USD'))).toBeInTheDocument();
    expect(screen.queryByText('Train ride')).not.toBeInTheDocument();
    expect(screen.queryByText('Saves the booking, then opens the Costs editor.')).not.toBeInTheDocument();
    // A further expense can still be created next to them.
    expect(screen.getByRole('button', { name: /Create expense/ })).toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-009: edit hands the row\'s expense to onEdit', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderSection();
    const row = rowOf('Seat upgrade');
    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(upgrade);
  });

  it('FE-PLANNER-COSTSEC-010: delete hands the row\'s expense to onRemove', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderSection();
    const row = rowOf('Flight LH 400');
    await user.click(within(row).getByRole('button', { name: 'Remove expense' }));
    expect(onRemove).toHaveBeenCalledWith(flight);
  });

  it('FE-PLANNER-COSTSEC-011: unlink lets go of the link and keeps the expense in Costs', async () => {
    const user = userEvent.setup();
    const bodies = captureUpdates();
    renderSection();
    const row = rowOf('Seat upgrade');
    await user.click(within(row).getByRole('button', { name: 'Unlink, keep the expense' }));

    await waitFor(() => expect(bodies).toEqual([{ id: 12, body: { reservation_id: null } }]));
    await waitFor(() => expect(screen.queryByText('Seat upgrade')).not.toBeInTheDocument());
    expect(useTripStore.getState().budgetItems.some((i: BudgetItem) => i.id === 12)).toBe(true);
  });

  it('FE-PLANNER-COSTSEC-012: create stays available with expenses linked', async () => {
    const user = userEvent.setup();
    const { onCreate } = renderSection();
    await user.click(screen.getByRole('button', { name: /Create expense/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  // ── The place form ─────────────────────────────────────────────────────────

  it('FE-PLANNER-COSTSEC-013: in the place form it lists and links through place_id, with the place hint', async () => {
    const user = userEvent.setup();
    const bodies = captureUpdates();
    renderSection({ reservationId: null, placeId: 4, hintKey: 'places.createExpenseHint' });
    expect(screen.getByText('Museum pass')).toBeInTheDocument();
    expect(screen.queryByText('Flight LH 400')).not.toBeInTheDocument();

    await user.click(linkSelect());
    await user.click(screen.getByRole('button', { name: /Snacks/ }));
    await waitFor(() => expect(bodies).toEqual([{ id: 16, body: { place_id: 4 } }]));
  });

  it('FE-PLANNER-COSTSEC-014: the place hint shows while the place has no expense', () => {
    seedStore(useTripStore, { budgetItems: [souvenirs] });
    renderSection({ reservationId: null, placeId: 4, hintKey: 'places.createExpenseHint' });
    expect(screen.getByText('Saves the place, then opens the Costs editor.')).toBeInTheDocument();
  });

  // ── Import review ──────────────────────────────────────────────────────────

  it('FE-PLANNER-COSTSEC-015: an import preview shows the parsed cost instead of the buttons', () => {
    renderSection({ reservationId: null, pendingExpense: { total_price: 99, currency: 'CHF', category: 'transport' } });
    expect(screen.getByText('Linked expense')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText(money(99, 'CHF'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create expense/ })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-016: an amount without a currency is in the trip currency, whatever the display currency (#2525)', () => {
    // The booking saves its cost without a currency, which the server and Costs
    // read as the trip's. Previewing it in the display currency said 12 GBP for
    // what was then stored as 12 JPY.
    seedStore(useTripStore, { budgetItems: [], trip: buildTrip({ id: 1, currency: 'JPY' }) });
    seedStore(useSettingsStore, { settings: { default_currency: 'gbp' } });
    const { unmount } = render(
      <BookingCostsSection reservationId={null} pendingExpense={{ total_price: 12, category: 'food' }} onCreate={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByText(money(12, 'JPY'))).toBeInTheDocument();
    expect(screen.queryByText(money(12, 'GBP'))).not.toBeInTheDocument();
    unmount();

    seedStore(useSettingsStore, { settings: { default_currency: '' } });
    render(
      <BookingCostsSection reservationId={null} pendingExpense={{ total_price: 12, category: 'food' }} onCreate={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByText(money(12, 'JPY'))).toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-017: a zero-priced import is not previewed', () => {
    seedStore(useTripStore, { budgetItems: [] });
    renderSection({ reservationId: null, pendingExpense: { total_price: 0, category: 'food' } });
    expect(screen.queryByText('Linked expense')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create expense/ })).toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-018: a booking that already has an expense lists it instead of the import preview', () => {
    renderSection({ pendingExpense: { total_price: 99, category: 'transport' } });
    expect(screen.queryByText('Linked expense')).not.toBeInTheDocument();
    expect(screen.getByText('Linked expenses')).toBeInTheDocument();
    expect(screen.getByText('Flight LH 400')).toBeInTheDocument();
  });

  it('FE-PLANNER-COSTSEC-019: linked and offered expenses without a currency read in the trip currency (#2525)', async () => {
    const user = userEvent.setup();
    const deposit = buildBudgetItem({ id: 17, trip_id: 1, name: 'Hotel deposit', total_price: 120, currency: null, category: 'accommodation', reservation_id: 9 });
    const tram = buildBudgetItem({ id: 18, trip_id: 1, name: 'Tram pass', total_price: 9, currency: null, category: 'transport' });
    seedStore(useTripStore, { budgetItems: [deposit, tram] });
    seedStore(useSettingsStore, { settings: { default_currency: 'USD' } });
    renderSection();

    expect(within(rowOf('Hotel deposit')).getByText(money(120, 'EUR'))).toBeInTheDocument();
    expect(screen.queryByText(money(120, 'USD'))).not.toBeInTheDocument();
    await user.click(linkSelect());
    expect(screen.getByRole('button', { name: /Tram pass/ })).toHaveTextContent(money(9, 'EUR'));
  });
});
