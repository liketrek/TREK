// calculateSettlement: who owes whom across split members, payers and settle-ups.
import { calculateSettlement, createSettlement } from '../../src/services/budgetService';
import {
  resetDb,
  createUser,
  createTrip,
  createBudgetItem,
  addBudgetMember,
  addBudgetPayer,
  type TestUser,
  type TestTrip,
} from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);

let alice: TestUser;
let bob: TestUser;
let carol: TestUser;
let trip: TestTrip;

beforeEach(() => {
  resetDb();
  alice = createUser({ username: 'alice' });
  bob = createUser({ username: 'bob' });
  carol = createUser({ username: 'carol' });
  trip = createTrip(alice.id, { currency: 'EUR' });
});

const balanceOf = (result: ReturnType<typeof calculateSettlement>, userId: number) =>
  result.balances.find((b) => b.user_id === userId)?.balance;

describe('calculateSettlement', () => {
  it('splits a single-payer expense in half so the non-payer owes their share', () => {
    const { id } = createBudgetItem(trip.id, { name: 'Dinner', total_price: 100 });
    addBudgetMember(id, alice.id);
    addBudgetMember(id, bob.id);
    addBudgetPayer(id, alice.id, 100);

    const result = calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR' });

    expect(balanceOf(result, alice.id)).toBe(50);
    expect(balanceOf(result, bob.id)).toBe(-50);
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0]).toMatchObject({ from: { user_id: bob.id }, to: { user_id: alice.id }, amount: 50 });
  });

  it('nets multiple payers on one expense against an equal split', () => {
    // 120 split 3 ways (40 each); Alice paid 90, Bob 30, Carol 0.
    const { id } = createBudgetItem(trip.id, { name: 'Hotel', total_price: 120 });
    for (const u of [alice, bob, carol]) addBudgetMember(id, u.id);
    addBudgetPayer(id, alice.id, 90);
    addBudgetPayer(id, bob.id, 30);

    const result = calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR' });

    expect(balanceOf(result, alice.id)).toBe(50);
    expect(balanceOf(result, bob.id)).toBe(-10);
    expect(balanceOf(result, carol.id)).toBe(-40);
    const total = result.flows.reduce((sum, f) => sum + f.amount, 0);
    expect(total).toBeCloseTo(50, 2);
    expect(result.flows.every((f) => f.to.user_id === alice.id)).toBe(true);
  });

  it('rounds an indivisible three-way split to cents', () => {
    const { id } = createBudgetItem(trip.id, { name: 'Taxi', total_price: 100 });
    for (const u of [alice, bob, carol]) addBudgetMember(id, u.id);
    addBudgetPayer(id, alice.id, 100); // 100 / 3 = 33.33…

    const result = calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR' });

    expect(balanceOf(result, alice.id)).toBe(66.67);
    expect(balanceOf(result, bob.id)).toBe(-33.33);
    expect(balanceOf(result, carol.id)).toBe(-33.33);
    for (const f of result.flows) expect(f.amount).toBe(Math.round(f.amount * 100) / 100);
  });

  it('ignores a planning-only entry that has no split members', () => {
    const { id } = createBudgetItem(trip.id, { name: 'Budget estimate', total_price: 500 });
    addBudgetPayer(id, alice.id, 500);

    const result = calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR' });

    expect(result.flows).toHaveLength(0);
    expect(result.balances.every((b) => b.balance === 0)).toBe(true);
  });

  it('converts a foreign-currency expense into the base via live rates', () => {
    // 110 USD at 1.1 USD/EUR = 100 EUR, split between Alice and Bob.
    const { id } = createBudgetItem(trip.id, { name: 'US Hotel', total_price: 110, currency: 'USD' });
    addBudgetMember(id, alice.id);
    addBudgetMember(id, bob.id);
    addBudgetPayer(id, alice.id, 110);

    const result = calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR', rates: { USD: 1.1 } });

    expect(balanceOf(result, alice.id)).toBe(50);
    expect(balanceOf(result, bob.id)).toBe(-50);
  });
});

describe('calculateSettlement with settle-up transfers', () => {
  it('cancels the outstanding flow once the debt has been settled', () => {
    const { id } = createBudgetItem(trip.id, { name: 'Dinner', total_price: 100 });
    addBudgetMember(id, alice.id);
    addBudgetMember(id, bob.id);
    addBudgetPayer(id, alice.id, 100);
    createSettlement(trip.id, { from_user_id: bob.id, to_user_id: alice.id, amount: 50 }, alice.id);

    const result = calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR' });

    expect(balanceOf(result, alice.id)).toBe(0);
    expect(balanceOf(result, bob.id)).toBe(0);
    expect(result.flows).toHaveLength(0);
    expect(result.settlements).toHaveLength(1);
  });
});
