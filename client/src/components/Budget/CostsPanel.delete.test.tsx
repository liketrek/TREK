// FE-W5COSTS-022 and FE-W5COSTS-043: deleting an expense from the Costs ledger
import { http, HttpResponse } from 'msw';
import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { BudgetItem } from '../../types';
import CostsPanel from './CostsPanel';

// The toasts are caught at useToast, so no window global has to be set for them.
const { addToast, toast } = vi.hoisted(() => {
  const addToast = vi.fn((_message: string, _type?: string, _duration?: number) => 0);
  const show = (type: string) => (message: string, duration?: number) => {
    addToast(message, type, duration);
  };
  return {
    addToast,
    toast: { success: show('success'), error: show('error'), warning: show('warning'), info: show('info') },
  };
});
vi.mock('../shared/Toast', () => ({ useToast: () => toast, default: () => toast }));

const tripMembers = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

const dinner = (): BudgetItem =>
  ({
    ...buildBudgetItem({ trip_id: 1 }),
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
  }) as unknown as BudgetItem;

function mount(items: BudgetItem[]) {
  server.use(
    http.get('/api/trips/1/budget', () => HttpResponse.json({ items })),
    http.get('/api/trips/1/budget/settlement', () => HttpResponse.json({ balances: [], flows: [], settlements: [] }))
  );
  return render(<CostsPanel tripId={1} tripMembers={tripMembers} />);
}

// Alice is the signed-in user; the euro display currency keeps FX an identity.
beforeEach(() => {
  resetAllStores();
  addToast.mockClear();
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'EUR' }) });
  seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'EUR' } });
});

describe('CostsPanel: deleting an expense', () => {
  it('FE-W5COSTS-022: deleting an expense removes it, and a failure is reported', async () => {
    server.use(http.delete('/api/trips/1/budget/101', () => HttpResponse.json({ error: 'no' }, { status: 500 })));
    mount([dinner()]);

    await screen.findByText('Dinner');
    fireEvent.click(screen.getByRole('button', { name: /^Delete(:|$)/ }));
    expect(await screen.findByText('Delete expense?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Unknown error', 'error', undefined));
    // The optimistic removal is rolled back by the store.
    expect(await screen.findByText('Dinner')).toBeInTheDocument();
  });

  it('FE-W5COSTS-043: deleting an expense drops it from the ledger', async () => {
    let deleted = false;
    server.use(
      http.delete('/api/trips/1/budget/101', () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      })
    );
    mount([dinner()]);

    await screen.findByText('Dinner');
    fireEvent.click(screen.getByRole('button', { name: /^Delete(:|$)/ }));
    // The bin asks first; nothing is sent until it is confirmed.
    expect(await screen.findByText('Delete expense?')).toBeInTheDocument();
    expect(deleted).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleted).toBe(true));
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
  });
});
