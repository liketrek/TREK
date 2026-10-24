import type { AssistantApplied, TrekCard } from '@trek/shared';
import { ArrowLeftRight, Wallet } from 'lucide-react';

import type { PackLook } from '../cardTypes';
import { costsTarget } from './budgetModel';

/**
 * What the costs bring to the chat's pure look: the verbs, tool names and steps
 * they add, what an applied change of theirs opens, and the look of each of
 * their kinds. An applied expense opens itself in the Costs tab, a removed
 * one and a payment the tab where they were listed. A look stays pure, icons
 * and literals only: the chat's main chunk reads every look, so whatever a
 * look imports ships with it.
 */

/** The expense an applied change leaves to open: none once it was removed. */
function expenseLeft(applied: AssistantApplied, card: TrekCard | null): number | null {
  const removed = card?.kind === 'expenses' && card.rows[0]?.change === 'willDelete';
  return removed ? null : (applied.ids[0] ?? null);
}

/** Whether a card is one of the costs' change cards, which a lookup of the expenses only served. */
function isBudgetChange(change: TrekCard): boolean {
  return change.kind === 'expenses' || change.kind === 'payments';
}

export const BUDGET_LOOK = {
  verbs: {
    addPayment: { Icon: ArrowLeftRight, tone: 'success', labelKey: 'assistant.change.verb.addPayment' },
    updatePayment: { Icon: ArrowLeftRight, tone: 'info', labelKey: 'assistant.change.verb.updatePayment' },
  },
  tools: {
    create_budget_item_with_members: { labelKey: 'assistant.tool.create_budget_item_with_members' },
    set_budget_item_members: { labelKey: 'assistant.tool.set_budget_item_members' },
    toggle_budget_member_paid: { labelKey: 'assistant.tool.toggle_budget_member_paid' },
    create_settlement: { labelKey: 'assistant.tool.create_settlement' },
    update_settlement: { labelKey: 'assistant.tool.update_settlement' },
    delete_settlement: { labelKey: 'assistant.tool.delete_settlement' },
    freeze_budget_rates: { labelKey: 'assistant.tool.freeze_budget_rates' },
  },
  steps: {
    list_settlements: { stepKey: 'assistant.step.costs' },
  },
  entities: {
    budget: {
      Icon: Wallet,
      openLabelKey: 'assistant.card.budget.open',
      open: (applied: AssistantApplied, card: TrekCard | null) => costsTarget(expenseLeft(applied, card)),
    },
    settlement: {
      Icon: ArrowLeftRight,
      openLabelKey: 'assistant.card.budget.open',
      open: () => costsTarget(),
    },
  },
  cards: {
    expenses: {
      entity: () => 'budget',
      followUps: [{ id: 'whoOwes', labelKey: 'assistant.followUp.whoOwes' }],
      // The list read to find an expense gives way to the change it was read for.
      yieldsToChange: (_answer, change) => isBudgetChange(change),
    },
    payments: {
      entity: () => 'settlement',
      yieldsToChange: (_answer, change) => change.kind === 'payments',
    },
    settlement: {
      followUps: [{ id: 'recordPayments', labelKey: 'assistant.followUp.recordPayments', edits: true }],
    },
    costPerPerson: {},
  },
} satisfies PackLook<'expenses' | 'payments' | 'settlement' | 'costPerPerson'>;
