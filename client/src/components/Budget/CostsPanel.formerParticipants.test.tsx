// FE-W5COSTS-097: someone who left the trip in the Costs panel (#2604)
import { http, HttpResponse } from 'msw';
import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import CostsPanel from './CostsPanel';
import { resetFreezeAttempts } from './useFreezeMissingRates';

const tripMembers = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

// Alice signed in on an AUD trip whose browser holds an AUD quote: the setup this case
// ran under beside the bills the server cannot convert in CostsPanel.test.tsx.
function seedAudTrip() {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'alice' }), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'AUD' } });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'AUD' }) });
  clearExchangeRateCache();
  resetFreezeAttempts();
  localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3, EUR: 0.61 }, ts: Date.now() }));
}

describe('CostsPanel: someone who left the trip (#2604)', () => {
  beforeEach(seedAudTrip);
  afterEach(clearExchangeRateCache);

  it('FE-W5COSTS-097: someone who left the trip is named and keeps their balance in the list (#2604)', async () => {
    // Carol was removed from the trip; her payer row stays on the expense and the
    // server still nets her into the balances.
    const item = {
      ...buildBudgetItem({ trip_id: 1, category: 'food', name: 'Boat' }),
      total_price: 90,
      payers: [{ user_id: 3, amount: 90, username: 'carol' }],
      members: [
        { user_id: 1, paid: 0, amount: null, username: 'alice' },
        { user_id: 2, paid: 0, amount: null, username: 'bob' },
        { user_id: 3, paid: 0, amount: null, username: 'carol' },
      ],
    };
    server.use(
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [item] })),
      http.get('/api/trips/1/budget/settlement', () =>
        HttpResponse.json({
          balances: [
            { user_id: 1, username: 'alice', avatar_url: null, balance: -30 },
            { user_id: 2, username: 'bob', avatar_url: null, balance: -30 },
            { user_id: 3, username: 'carol', avatar_url: null, balance: 60 },
          ],
          flows: [],
          settlements: [],
        })
      )
    );
    render(<CostsPanel tripId={1} tripMembers={tripMembers} />);

    await screen.findByText('Boat');
    await waitFor(() => expect(screen.getAllByText('carol').length).toBeGreaterThan(0));
    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });
});
