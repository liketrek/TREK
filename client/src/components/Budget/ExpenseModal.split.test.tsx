// FE-COSTS-EXPSPLIT-001 to FE-COSTS-EXPSPLIT-002
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildBudgetItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import { ExpenseModal } from './CostsPanel';

const people = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

let addBudgetItem: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true });
  addBudgetItem = vi.fn(async () => buildBudgetItem({ id: 9 }));
  useTripStore.setState({
    trip: buildTrip({ id: 1, currency: 'EUR' }),
    addBudgetItem,
  } as unknown as Partial<TripStoreState>);
});

async function startCustomSplit(total: string) {
  const user = userEvent.setup();
  render(
    <ExpenseModal tripId={1} base="EUR" people={people} me={1} editing={null} onClose={vi.fn()} onSaved={vi.fn()} />
  );
  await user.type(screen.getByPlaceholderText('e.g. Dinner, souvenirs, gas…'), 'Apartment');
  await user.type(screen.getAllByPlaceholderText('0,00')[0], total);
  await user.click(screen.getByRole('button', { name: 'Custom' }));
  await user.click(screen.getByRole('button', { name: 'Shares' }));
  return user;
}

describe('ExpenseModal: a custom split by shares (#1165)', () => {
  it('FE-COSTS-EXPSPLIT-001: five nights against four save the stay split 5/9 to 4/9', async () => {
    const user = await startCustomSplit('390');
    // Shares start even, one each, so the split balances before anything is typed.
    expect(screen.getByText('Split matches total')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Shares for You' }), '5');
    await user.type(screen.getByRole('textbox', { name: 'Shares for bob' }), '4');
    expect(screen.getByText('216,67 €')).toBeInTheDocument();
    expect(screen.getByText('173,33 €')).toBeInTheDocument();

    const submits = screen.getAllByRole('button', { name: 'Add expense' });
    await user.click(submits[submits.length - 1]);
    await waitFor(() => expect(addBudgetItem).toHaveBeenCalledTimes(1));
    expect(addBudgetItem.mock.calls[0][1]).toMatchObject({
      total_price: 390,
      members: [
        { user_id: 1, amount: 216.67 },
        { user_id: 2, amount: 173.33 },
      ],
    });
  });

  it('FE-COSTS-EXPSPLIT-002: nobody holding a share leaves the split open and the save blocked', async () => {
    const user = await startCustomSplit('90');
    await user.type(screen.getByRole('textbox', { name: 'Shares for You' }), '0');
    await user.type(screen.getByRole('textbox', { name: 'Shares for bob' }), '0');
    expect(screen.getByText('Give at least one person a share')).toBeInTheDocument();
    const submits = screen.getAllByRole('button', { name: 'Add expense' });
    expect(submits[submits.length - 1]).toBeDisabled();
  });
});
