import type { ToolArgs, ToolCards, UndoSnapshot } from '../card-types';
import { argId, idIn, readKey, recordOf } from '../card-values';
import { byId, rowsOf, same, STABLE_FIELDS } from '../undo-snapshot';
import type { AssistantChangePreview, TrekCard } from '@trek/shared';

/**
 * What happens to a budget write once it is applied: the ids its receipt
 * names, the card it leaves (the waiting one with the new row's id, so the
 * receipt opens that very expense), and the way back from what it created,
 * offered only while the created row is as the change left it.
 */

type Undo = NonNullable<ToolCards['undo']>;

/** The fields that say a recorded payment is still the one that was created. */
const PAYMENT_FIELDS = ['from_user_id', 'to_user_id', 'amount', 'currency', 'settled_at', 'note'] as const;

/** The read the payment undo checks against. */
const SETTLEMENTS_READ = { tool: 'list_settlements', args: {} } as const;

/** The waiting card of a create, now with the id the answer names under `key`. */
function withCreatedId(preview: AssistantChangePreview | null, result: unknown, key: 'item' | 'settlement') {
  const card = preview?.card;
  const createdId = idIn(result, key);
  if (!card || createdId === null) return null;
  if (key === 'item' && card.kind === 'expenses' && card.rows.length === 1) {
    return { ...card, rows: card.rows.map((row) => ({ ...row, id: createdId })) };
  }
  if (key === 'settlement' && card.kind === 'payments' && card.rows.length === 1) {
    return { ...card, rows: card.rows.map((row) => ({ ...row, id: createdId })) };
  }
  return null;
}

/** The card of an applied expense create. */
export function appliedExpense(input: { result: unknown; preview: AssistantChangePreview | null }): TrekCard | null {
  return withCreatedId(input.preview, input.result, 'item');
}

/** The card of an applied payment. */
export function appliedPayment(input: { result: unknown; preview: AssistantChangePreview | null }): TrekCard | null {
  return withCreatedId(input.preview, input.result, 'settlement');
}

/** A payment's receipt names the payment: the one created, or the one the call changed or removed. */
export function paymentIds(args: ToolArgs, result: unknown): number[] {
  const paymentId = idIn(result, 'settlement') ?? argId(args, 'settlementId');
  return paymentId === null ? [] : [paymentId];
}

/** An expense created with its split, taken back while it is as it was created. */
export const DELETE_CREATED_EXPENSE: Undo = {
  tool: 'delete_budget_item',
  args: (_args, result) => {
    const itemId = idIn(result, 'item');
    return itemId ? { itemId } : null;
  },
  unchanged: (result: unknown, snapshot: UndoSnapshot) => {
    const created = recordOf(recordOf(result).item);
    const items = rowsOf(recordOf(recordOf(snapshot.summary).budget).items);
    return same(created, byId(items, created.id), STABLE_FIELDS.budget);
  },
};

/**
 * A recorded payment, taken back while nobody changed it since: the tool
 * calls itself the undo of create_settlement, and removing the payment puts
 * the balances back as they were.
 */
export const DELETE_CREATED_PAYMENT: Undo = {
  tool: 'delete_settlement',
  args: (_args, result) => {
    const settlementId = idIn(result, 'settlement');
    return settlementId ? { settlementId } : null;
  },
  reads: () => [SETTLEMENTS_READ],
  unchanged: (result: unknown, snapshot: UndoSnapshot) => {
    const created = recordOf(recordOf(result).settlement);
    const read = snapshot.reads.get(readKey(SETTLEMENTS_READ.tool, SETTLEMENTS_READ.args));
    const payments = rowsOf(recordOf(read).settlements);
    return same(created, byId(payments, created.id), PAYMENT_FIELDS);
  },
};
