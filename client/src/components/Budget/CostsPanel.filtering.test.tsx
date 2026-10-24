// FE-W5COSTS-014 to FE-W5COSTS-019 and FE-W5COSTS-076: filtering the Costs ledger
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { BudgetItem } from '../../types';
import CostsPanel from './CostsPanel';

const tripMembers = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

type Payment = {
  id: number;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  created_at?: string;
  settled_at?: string | null;
};
type MemberFixture = { user_id: number; username?: string };
const expense = (over: Partial<Omit<BudgetItem, 'members'>> & { members?: MemberFixture[] }): BudgetItem =>
  ({ ...buildBudgetItem({ trip_id: 1 }), payers: [], members: [], ...over }) as unknown as BudgetItem;

function mount(items: BudgetItem[], settlement: { settlements?: Payment[] } = {}) {
  server.use(
    http.get('/api/trips/1/budget', () => HttpResponse.json({ items })),
    http.get('/api/trips/1/budget/settlement', () =>
      HttpResponse.json({ balances: [], flows: [], settlements: [], ...settlement })
    )
  );
  return render(<CostsPanel tripId={1} tripMembers={tripMembers} />);
}

// Alice is the signed-in user; the euro display currency keeps FX an identity.
function seedAlice() {
  resetAllStores();
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }) });
  seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } });
}

const dinner = () =>
  expense({
    id: 101,
    name: 'Dinner',
    category: 'food',
    total_price: 90,
    expense_date: '2025-06-15',
    payers: [{ user_id: 1, amount: 90 }],
    members: [
      { user_id: 1, username: 'alice' },
      { user_id: 2, username: 'bob' },
    ],
  });
const taxi = () =>
  expense({
    id: 102,
    name: 'Taxi',
    category: 'transport',
    total_price: 30,
    expense_date: '2025-06-16',
    payers: [{ user_id: 2, amount: 30 }],
    members: [
      { user_id: 1, username: 'alice' },
      { user_id: 2, username: 'bob' },
    ],
  });

describe('CostsPanel — filtering the ledger', () => {
  beforeEach(seedAlice);

  const payment: Payment = { id: 7, from_user_id: 2, to_user_id: 1, amount: 30, created_at: '2025-06-16 10:00:00' };
  // The payment comes with the settlement, which can arrive after the expenses: a filter is
  // only tested against it once both are on screen.
  const ledgerLoaded = async () => {
    await screen.findByText('Taxi');
    await screen.findByText('Payment');
  };

  it('FE-W5COSTS-014: "Paid by me" keeps only the expenses I fronted', async () => {
    mount([dinner(), taxi()], { settlements: [payment] });

    await ledgerLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Paid by me' }));

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();
    // A transfer I'm part of stays visible under "mine".
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('FE-W5COSTS-015: "I\'m owed" keeps the expenses I am net positive on and drops payments', async () => {
    mount([dinner(), taxi()], { settlements: [payment] });

    await ledgerLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.click(screen.getByRole('button', { name: "I'm owed" }));

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment')).not.toBeInTheDocument();
  });

  it('FE-W5COSTS-016: the category filter narrows the ledger and hides payments', async () => {
    mount([dinner(), taxi()], { settlements: [payment] });

    await ledgerLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Transport' }));

    expect(screen.getByText('Taxi')).toBeInTheDocument();
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment')).not.toBeInTheDocument();
  });

  it('FE-W5COSTS-017: picking a single day banners it with that day’s total', async () => {
    mount([dinner(), taxi()], { settlements: [payment] });

    await ledgerLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Sun, Jun 15' }));

    expect(screen.getByText('Sunday, June 15')).toBeInTheDocument();
    expect(screen.getByText('1 expense')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();
    // The 16th carries the payment, so it is filtered out with the day too.
    expect(screen.queryByText('Payment')).not.toBeInTheDocument();
  });

  it('FE-W5COSTS-076: a payment groups by its own settled day, not the day it was recorded', async () => {
    // Recorded (created_at) on the 16th, but settled on the 15th — the ledger
    // must follow settled_at, the same way it already follows expense_date over
    // an expense's own created_at.
    mount([dinner(), taxi()], { settlements: [{ ...payment, settled_at: '2025-06-15' }] });

    await ledgerLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Sun, Jun 15' }));

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('FE-W5COSTS-018: expenses without a date are grouped under "No date"', async () => {
    mount([expense({ id: 120, name: 'Souvenirs', category: 'shopping', total_price: 12, expense_date: null })]);

    expect(await screen.findByText('No date')).toBeInTheDocument();
  });

  it('FE-W5COSTS-019: a search with no hits shows the no-match copy', async () => {
    const user = userEvent.setup();
    mount([dinner()]);

    await screen.findByText('Dinner');
    await user.type(screen.getByPlaceholderText('Search expenses…'), 'zzz');

    expect(screen.getByText('No expenses match your search.')).toBeInTheDocument();
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
  });
});
