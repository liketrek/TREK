// FE-COSTS-TOTALS-001 to FE-COSTS-TOTALS-003: a trip that keeps its costs as totals only (#1714)
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { BudgetItem } from '../../types';
import CostsPanel from './CostsPanel';

const tripMembers = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

// Paid by Bob and shared by both: a split trip owes him half.
const dinner = {
  ...buildBudgetItem({ trip_id: 1 }),
  id: 801,
  name: 'Dinner',
  category: 'food',
  total_price: 60,
  expense_date: '2025-06-15',
  payers: [{ user_id: 2, amount: 60 }],
  members: [
    { user_id: 1, username: 'alice' },
    { user_id: 2, username: 'bob' },
  ],
} as unknown as BudgetItem;

let updateTrip: ReturnType<typeof vi.fn>;

function mount(costsMode: 'split' | 'totals') {
  updateTrip = vi.fn(async () => buildTrip({ id: 1 }));
  useTripStore.setState({
    trip: buildTrip({ id: 1, currency: 'EUR', costs_mode: costsMode }),
    updateTrip,
  } as unknown as Partial<TripStoreState>);
  server.use(
    http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [dinner] })),
    http.get('/api/trips/1/budget/settlement', () =>
      HttpResponse.json({
        balances: [],
        flows: [{ from: { user_id: 1, username: 'alice' }, to: { user_id: 2, username: 'bob' }, amount: 30 }],
        settlements: [],
      })
    )
  );
  return render(<CostsPanel tripId={1} tripMembers={tripMembers} />);
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } });
});

describe('CostsPanel keeping totals only (#1714)', () => {
  it('FE-COSTS-TOTALS-001: what is owed, the payers and the shares stay out, the totals stay', async () => {
    mount('totals');
    await screen.findByText('Dinner');
    expect(screen.getByRole('region', { name: 'Total trip spend' })).toHaveTextContent('1 expense');
    for (const name of ['You owe', 'Settle up', 'Balances', 'Final budget']) {
      expect(screen.queryByRole('region', { name })).toBeNull();
    }
    expect(screen.queryByText(/you lent|you borrowed/)).toBeNull();
    expect(screen.queryAllByTestId('split-chip')).toHaveLength(0);
    expect(screen.getByRole('region', { name: 'By category' })).toBeInTheDocument();
  });

  it('FE-COSTS-TOTALS-002: the switch at the foot of the sidebar turns splitting back on', async () => {
    const user = userEvent.setup();
    mount('totals');
    await screen.findByText('Dinner');
    const toggle = screen.getByRole('button', { name: 'Split costs between travelers' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/^Totals only:/)).toBeInTheDocument();
    await user.click(toggle);
    expect(updateTrip).toHaveBeenCalledWith(1, { costs_mode: 'split' });
  });

  it('FE-COSTS-TOTALS-003: a split trip shows the switch on, and a new expense asks for no payer or split once off', async () => {
    const user = userEvent.setup();
    const split = mount('split');
    expect(await screen.findByRole('region', { name: 'Settle up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Split costs between travelers' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    split.unmount();

    mount('totals');
    await screen.findByText('Dinner');
    await user.click(screen.getByRole('button', { name: 'Add expense' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Who paid?')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Equally' })).toBeNull();
  });
});
