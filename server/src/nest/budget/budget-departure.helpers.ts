import { currencyDecimals, splitEqualShares, splitTicketLines, toMinor } from '@trek/shared';

/** A member row of one expense as the re-split reads it. */
export interface DepartureMember {
  user_id: number;
  amount: number | null;
}

/** The decoded `ticket_json` of an expense, every key the server does not read kept as it is. */
export interface DepartureTicket {
  items: { price?: string | number; parts?: number[] }[];
}

/**
 * What an expense's split becomes when one of its members leaves for good (a
 * deleted guest or account, #2604), so the shares still add up to what they did.
 *
 * An equal split needs nothing here: the members left divide the payer credit
 * among themselves. A split by amount hands the leaver's amount to everyone
 * left, largest remainder in the smallest step the currency is shown in, and
 * gives each of them an amount of their own: a member without one pays nothing
 * on a custom split, and leaving them at null would quietly turn the expense
 * back into an equal one. A split by receipt takes the leaver off every line and
 * splits the lines again the way the cost editor does, so the receipt and the
 * amounts agree the next time it is opened; a line only the leaver was on is
 * then carried by everyone left on the receipt. Should that not account for the
 * same total (a receipt nobody else is on, or amounts edited past the receipt),
 * the amount is handed on as for a custom split instead.
 *
 * `amounts` is null when no member amount changes, `ticket` when the receipt does not.
 */
export function shareAfterLeaving(
  itemId: number,
  members: readonly DepartureMember[],
  leaverId: number,
  currency: string,
  ticket: DepartureTicket | null,
): { amounts: Record<number, number> | null; ticket: DepartureTicket | null } {
  const staying = members.filter((m) => m.user_id !== leaverId);
  const leaver = members.find((m) => m.user_id === leaverId);
  const onReceipt = ticket?.items.some((line) => line.parts?.includes(leaverId)) ?? false;
  const nextTicket =
    ticket && onReceipt
      ? {
          ...ticket,
          items: ticket.items.map((line) => ({ ...line, parts: (line.parts ?? []).filter((id) => id !== leaverId) })),
        }
      : null;
  if (!leaver || staying.length === 0 || !members.some((m) => m.amount !== null))
    return { amounts: null, ticket: nextTicket };

  const before = members.reduce((sum, m) => sum + toMinor(m.amount ?? 0), 0);
  if (nextTicket) {
    const { shares, totalMinor } = splitTicketLines(
      nextTicket.items.map((line) => ({ price: line.price ?? '', parts: line.parts })),
    );
    const covered = staying.reduce((sum, m) => sum + (shares[m.user_id] ?? 0), 0);
    if (totalMinor === before && covered === totalMinor) {
      return {
        amounts: Object.fromEntries(staying.map((m) => [m.user_id, (shares[m.user_id] ?? 0) / 100])),
        ticket: nextTicket,
      };
    }
  }

  const leaving = toMinor(leaver.amount ?? 0);
  const decimals = currencyDecimals(currency);
  const step = decimals < 2 && leaving % 10 ** (2 - decimals) === 0 ? 10 ** (2 - decimals) : 1;
  const extra = splitEqualShares(leaving / step, staying, itemId);
  const amounts = Object.fromEntries(
    staying.map((m) => [m.user_id, (toMinor(m.amount ?? 0) + (extra[m.user_id] ?? 0) * step) / 100]),
  );
  return { amounts, ticket: nextTicket };
}

/** The refusal REST and MCP answer when a guest who moved money is to be deleted (#2604). */
export const GUEST_HAS_PAYMENTS =
  'This guest paid for an expense or is part of a recorded payment. Change the payer or delete the payment first.';
