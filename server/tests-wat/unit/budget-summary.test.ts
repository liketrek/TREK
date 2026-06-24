// budgetService per-person summary + toggleMemberPaid.
import { getPerPersonSummary, toggleMemberPaid } from '../../src/services/budgetService';
import {
  resetDb,
  createUser,
  createTrip,
  createBudgetItem,
  addBudgetMember,
  type TestUser,
  type TestTrip,
} from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);

let alice: TestUser;
let bob: TestUser;
let trip: TestTrip;

beforeEach(() => {
  resetDb();
  alice = createUser({ username: 'alice' });
  bob = createUser({ username: 'bob' });
  trip = createTrip(alice.id, { currency: 'EUR' });
});

const summaryFor = (tripId: number, userId: number) =>
  getPerPersonSummary(tripId).find((s) => s.user_id === userId);

describe('getPerPersonSummary', () => {
  it('divides each expense across its members and counts items per person', () => {
    const shared = createBudgetItem(trip.id, { name: 'Hotel', total_price: 100 });
    addBudgetMember(shared.id, alice.id);
    addBudgetMember(shared.id, bob.id);
    const aliceOnly = createBudgetItem(trip.id, { name: 'Souvenir', total_price: 60 });
    addBudgetMember(aliceOnly.id, alice.id);

    expect(summaryFor(trip.id, alice.id)).toMatchObject({ total_assigned: 110, items_count: 2 });
    expect(summaryFor(trip.id, bob.id)).toMatchObject({ total_assigned: 50, items_count: 1 });
  });

  it('only counts the paid portion in total_paid', () => {
    const shared = createBudgetItem(trip.id, { name: 'Hotel', total_price: 100 });
    addBudgetMember(shared.id, alice.id, true);
    addBudgetMember(shared.id, bob.id, false);

    expect(summaryFor(trip.id, alice.id)?.total_paid).toBe(50);
    expect(summaryFor(trip.id, bob.id)?.total_paid).toBe(0);
  });
});

describe('toggleMemberPaid', () => {
  it('flips a member from unpaid to paid and reflects it in the summary', () => {
    const item = createBudgetItem(trip.id, { name: 'Dinner', total_price: 80 });
    addBudgetMember(item.id, alice.id);
    addBudgetMember(item.id, bob.id);

    const updated = toggleMemberPaid(item.id, trip.id, alice.id, true);

    expect(updated).toMatchObject({ user_id: alice.id, paid: 1 });
    expect(summaryFor(trip.id, alice.id)?.total_paid).toBe(40);
  });

  it('returns null when the item does not belong to the given trip', () => {
    const item = createBudgetItem(trip.id, { name: 'Dinner', total_price: 80 });
    addBudgetMember(item.id, alice.id);
    const otherTrip = createTrip(bob.id);

    expect(toggleMemberPaid(item.id, otherTrip.id, alice.id, true)).toBeNull();
  });
});
