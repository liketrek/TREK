// FE-COSTS-SOLO-001 to FE-COSTS-SOLO-003: a trip of one has nothing to split (#2689)
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { BudgetItem } from '../../types';
import CostsPanel from './CostsPanel';

const alice = { id: 1, username: 'alice', avatar_url: null };

type Flow = { from: { user_id: number; username: string }; to: { user_id: number; username: string }; amount: number };

const museum = (over: Partial<BudgetItem> = {}): BudgetItem =>
  ({
    ...buildBudgetItem({ trip_id: 1 }),
    id: 701,
    name: 'Museum',
    category: 'activities',
    total_price: 40,
    expense_date: '2025-06-15',
    payers: [{ user_id: 1, amount: 40 }],
    members: [{ user_id: 1, username: 'alice' }],
    ...over,
  }) as unknown as BudgetItem;

function mount(items: BudgetItem[], flows: Flow[] = []) {
  server.use(
    http.get('/api/trips/1/budget', () => HttpResponse.json({ items })),
    http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows, settlements: [] }))
  );
  return render(<CostsPanel tripId={1} tripMembers={[alice]} />);
}

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }) });
  seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } });
});

describe('CostsPanel on a trip of one (#2689)', () => {
  it('FE-COSTS-SOLO-001: the total stands alone, without owing, settling or balances', async () => {
    mount([museum()]);
    await screen.findByText('Museum');
    expect(screen.getByRole('region', { name: 'Total trip spend' })).toHaveTextContent('1 expense');
    for (const name of ['You owe', "You're owed", 'Outstanding amount', 'Settle up', 'Balances', 'Final budget']) {
      expect(screen.queryByRole('region', { name })).toBeNull();
    }
    expect(screen.getByRole('region', { name: 'By category' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Settle up' })).toBeNull();
    expect(screen.queryByText('Split')).toBeNull();
  });

  it('FE-COSTS-SOLO-002: an expense nobody paid is not flagged unfinished, and the editor asks for no payer or split', async () => {
    const user = userEvent.setup();
    mount([museum({ payers: [] })]);
    await screen.findByText('Museum');
    expect(screen.queryByText('Unfinished')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Add expense' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Who paid?')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Equally' })).toBeNull();
  });

  it('FE-COSTS-SOLO-003: money still open with someone who left keeps the splitting side', async () => {
    const shared = museum({
      members: [
        { user_id: 1, username: 'alice' },
        { user_id: 9, username: 'zoe' },
      ],
    } as never);
    mount([shared], [{ from: { user_id: 9, username: 'zoe' }, to: { user_id: 1, username: 'alice' }, amount: 20 }]);
    expect(await screen.findByRole('region', { name: 'Settle up' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'You owe' })).toBeInTheDocument();
  });
});
