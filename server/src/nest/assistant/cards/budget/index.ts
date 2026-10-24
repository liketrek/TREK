import type { TripCard } from '../../assistant-context';
import type { CardReader, DomainCards, ToolArgs } from '../card-types';
import { clipped } from '../card-values';
import { costPerPersonAnswer, expensesAnswer, paymentsAnswer, settlementAnswer } from './budget-answers';
import {
  createExpenseChange,
  createPaymentChange,
  createWithMembersChange,
  deleteExpenseChange,
  deletePaymentChange,
  setMembersChange,
  togglePaidChange,
  updateExpenseChange,
  updatePaymentChange,
} from './budget-changes';
import { BUDGET_DESCRIBERS } from './budget-describe';
import {
  appliedExpense,
  appliedPayment,
  DELETE_CREATED_EXPENSE,
  DELETE_CREATED_PAYMENT,
  paymentIds,
} from './budget-receipts';
import { budgetRows } from './budget-values';

/**
 * The costs in the assistant chat. The four reads (the expense list, settle
 * up, the payments recorded, the share per traveller) show their answer as a
 * card the way the Costs page draws it, and every write to an expense or a
 * payment shows what it will be: the full split, who paid, the amounts, with
 * what an update replaces. `create_budget_item` and `update_budget_item` keep
 * the core's words, verb and undo and only add their card.
 */

/** The payments a change to a recorded one starts from. */
const readPayments = (_args: ToolArgs, read: CardReader) => read('list_settlements');

/** The name of the expense an `itemId` names, for the card built from the arguments. */
function expenseName(key: string, value: number, card: TripCard): string | null {
  return key === 'itemId' ? clipped(budgetRows(card).get(value)?.name, 160) : null;
}

export const BUDGET_CARDS: DomainCards = {
  id: 'budget',
  prompt: [
    'The chat draws the answers of list_budget_items, get_settlement_summary, list_settlements and get_budget_per_person as cards with every row; do not repeat those rows as text, sum up or answer the question instead.',
  ],
  tools: {
    list_budget_items: { answer: expensesAnswer },
    get_settlement_summary: { answer: settlementAnswer },
    list_settlements: { answer: paymentsAnswer },
    get_budget_per_person: { answer: costPerPersonAnswer },
    create_budget_item: { change: createExpenseChange, applied: appliedExpense },
    update_budget_item: { change: updateExpenseChange },
    create_budget_item_with_members: {
      write: { verbKey: 'addBudgetItem', entity: 'budget' },
      describe: BUDGET_DESCRIBERS.create_budget_item_with_members,
      change: createWithMembersChange,
      applied: appliedExpense,
      undo: DELETE_CREATED_EXPENSE,
    },
    set_budget_item_members: {
      write: { verbKey: 'updateBudgetItem', entity: 'budget' },
      describe: BUDGET_DESCRIBERS.set_budget_item_members,
      change: setMembersChange,
      nameArg: expenseName,
    },
    toggle_budget_member_paid: {
      write: { verbKey: 'updateBudgetItem', entity: 'budget' },
      describe: BUDGET_DESCRIBERS.toggle_budget_member_paid,
      change: togglePaidChange,
      nameArg: expenseName,
    },
    delete_budget_item: {
      write: { verbKey: 'genericRemove', entity: 'budget' },
      describe: BUDGET_DESCRIBERS.delete_budget_item,
      change: deleteExpenseChange,
      nameArg: expenseName,
    },
    create_settlement: {
      write: { verbKey: 'addPayment', entity: 'settlement' },
      describe: BUDGET_DESCRIBERS.create_settlement,
      change: createPaymentChange,
      applied: appliedPayment,
      appliedIds: paymentIds,
      undo: DELETE_CREATED_PAYMENT,
    },
    update_settlement: {
      write: { verbKey: 'updatePayment', entity: 'settlement' },
      load: readPayments,
      describe: BUDGET_DESCRIBERS.update_settlement,
      change: updatePaymentChange,
      appliedIds: paymentIds,
    },
    delete_settlement: {
      write: { verbKey: 'genericRemove', entity: 'settlement' },
      load: readPayments,
      describe: BUDGET_DESCRIBERS.delete_settlement,
      change: deletePaymentChange,
      appliedIds: paymentIds,
    },
  },
};
