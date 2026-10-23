/**
 * FE-AI-CARD-BUD-015 to FE-AI-CARD-BUD-017
 *
 * Settle-up payments in the chat: the history in an answer (who paid whom,
 * face to face, how much, the day and the note), and a payment inside its
 * change row (the amount it replaces struck through, the people it no longer
 * moves money between, the two faces under the row).
 */
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ANA, BEN, CLEO, changeItem, payment, payments } from '../../../../../tests/helpers/assistantBudget';
import { buildUser } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAuthStore } from '../../../../store/authStore';
import { formatMoney } from '../../../../utils/formatters';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import PaymentsCard, { PaymentAside, PaymentBody, PaymentChangeFacts } from './PaymentsCard';

const AUTH = useAuthStore.getState();
// Intl puts a no-break space before the symbol, and text and label queries read it as a plain one.
const money = (amount: number, currency = 'EUR') => formatMoney(amount, currency, 'en').replace(/[\u00a0\u202f]/g, ' ');

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: ANA.id }) });
});
afterEach(() => {
  useAuthStore.setState(AUTH, true);
  vi.restoreAllMocks();
});

describe('payments', () => {
  it('FE-AI-CARD-BUD-015: the history names who paid whom, how much, when and why, and opens the Costs tab', () => {
    const onOpen = vi.fn();
    const card = payments([payment({ note: 'Bank transfer' }), payment({ id: 6, from: CLEO, to: BEN, date: null })], 2);
    inView(<PaymentsCard cards={[{ toolCallId: 'r1', card }]} />, { onOpen });
    expect(screen.getByRole('region', { name: 'Settle history' })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getAllByText(money(42.5))).toHaveLength(2);
    expect(screen.getByText('Bank transfer')).toBeInTheDocument();
    // The viewer reads as "You", in words and on the face.
    expect(screen.getAllByText('You').length).toBeGreaterThan(0);
    expect(screen.getByText('Cleo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 more' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'finanzplan' });
  });

  it('FE-AI-CARD-BUD-016: a changed payment strikes through the amount and the people it replaces', () => {
    const changed = payment({
      from: CLEO,
      amount: { amount: 50, currency: 'EUR' },
      before: { from: BEN, to: null, amount: { amount: 42.5, currency: 'EUR' } },
      change: 'changed',
    });
    const card = payments([changed]);
    const aside = inView(<PaymentAside card={card} item={changeItem('a', card)} />);
    expect(screen.getByText(money(42.5))).toHaveClass('line-through');
    expect(screen.getByText(money(50))).not.toHaveClass('line-through');
    aside.unmount();
    const facts = inView(<PaymentChangeFacts card={card} item={changeItem('a', card)} />);
    // The names stay apart, so the arrow between them turns with a right-to-left language.
    expect(screen.getByText('Ben').closest('.line-through')).not.toBeNull();
    expect(screen.getByText('Cleo').closest('.line-through')).toBeNull();
    expect(screen.getAllByText('You')).toHaveLength(2);
    facts.unmount();
    inView(<PaymentBody card={card} item={changeItem('a', card)} />);
    expect(screen.getByRole('img', { name: 'Cleo' })).toBeInTheDocument();
  });

  it('FE-AI-CARD-BUD-016b: a payment note sits under the two people, not on the faint line', () => {
    const card = payments([payment({ note: 'Taxi back' })]);
    const facts = inView(<PaymentChangeFacts card={card} item={changeItem('a', card)} />);
    expect(screen.queryByText('Taxi back')).toBeNull();
    facts.unmount();
    inView(<PaymentBody card={card} item={changeItem('a', card)} />);
    expect(screen.getByText('Taxi back')).toBeInTheDocument();
  });

  it('FE-AI-CARD-BUD-017: a payment that goes, or a change that will not happen, is struck through', () => {
    const gone = payments([payment({ change: 'willDelete' })]);
    const first = inView(<PaymentAside card={gone} item={changeItem('a', gone)} />);
    expect(screen.getByText(money(42.5))).toHaveClass('line-through');
    first.unmount();
    const kept = payments([payment()]);
    inView(<PaymentAside card={kept} item={changeItem('b', kept, 'discarded')} />);
    expect(screen.getByText(money(42.5))).toHaveClass('line-through');
  });
});
