/**
 * FE-AI-CARD-BUD-007 to FE-AI-CARD-BUD-014
 *
 * An expense in the chat, as the Costs page draws it: the list in an answer
 * (category tile, amount and what a foreign one comes to, day, payer and
 * split, receipts, the foot with what is left out and the total, the way
 * into the Costs tab), and an expense inside its change row (the amount and
 * the one it replaces, the facts an update changes, the whole split with
 * paid and highlighted parts, what a run of new expenses adds up to).
 */
import type { TrekCard } from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ANA, BEN, CLEO, changeItem, expense, expenses } from '../../../../../tests/helpers/assistantBudget';
import { buildUser } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAuthStore } from '../../../../store/authStore';
import { formatMoney } from '../../../../utils/formatters';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { ExpenseAside, ExpenseBody, ExpenseFacts, ExpensesTogether } from './ExpenseChange';
import ExpensesCard from './ExpensesCard';

const AUTH = useAuthStore.getState();
// Intl puts a no-break space before the symbol, and text and label queries read it as a plain one.
const money = (amount: number, currency = 'EUR') => formatMoney(amount, currency, 'en').replace(/[\u00a0\u202f]/g, ' ');
// An accessible name is matched as it stands, so it keeps the no-break space.
const moneyName = (amount: number) => formatMoney(amount, 'EUR', 'en');

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

const answer = (card: TrekCard) => <ExpensesCard cards={[{ toolCallId: 'r1', card }]} />;

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: ANA.id }) });
});
afterEach(() => {
  useAuthStore.setState(AUTH, true);
  vi.restoreAllMocks();
});

describe('the expense list', () => {
  it('FE-AI-CARD-BUD-007: lists each expense with its category, amount, day, receipts and the trip total', () => {
    const museum = expense({
      id: 32,
      name: 'Museum',
      category: 'activities',
      amount: { amount: 50, currency: 'USD' },
      tripAmount: { amount: 40, currency: 'EUR' },
      receipts: 2,
    });
    const card = expenses([expense(), museum], { more: 1, total: { amount: 1204.5, currency: 'EUR' }, unconverted: 1 });
    inView(answer(card), { onOpen: vi.fn() });
    expect(screen.getByRole('region', { name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Food & drink' })).toBeInTheDocument();
    expect(screen.getByText(money(84))).toBeInTheDocument();
    expect(screen.getByText(money(50, 'USD'))).toBeInTheDocument();
    expect(screen.getByText(`≈ ${money(40)}`)).toBeInTheDocument();
    expect(screen.getByText('2 receipts')).toBeInTheDocument();
    expect(screen.getByText(money(1204.5))).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /1 foreign expense is left out/ })).toBeInTheDocument();
  });

  it('FE-AI-CARD-BUD-008: an expense opens itself in the Costs tab, the head and the count the tab', () => {
    const onOpen = vi.fn();
    inView(answer(expenses([expense()], { more: 4 })), { onOpen });
    fireEvent.click(screen.getByRole('button', { name: /Dinner at Lokanta/ }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'finanzplan', params: { expense: '31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open in Costs' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'finanzplan' });
    fireEvent.click(screen.getByRole('button', { name: '4 more' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'finanzplan' });
  });

  it('FE-AI-CARD-BUD-009: the viewer reads as "You", a planned expense says so, and an unpaid one warns', () => {
    const planned = expense({ id: 40, name: 'Hotel', split: 'none', shares: [], payers: [] });
    const unpaid = expense({ id: 41, name: 'Taxi', payers: [] });
    const shared = expense({
      id: 42,
      name: 'Boat',
      payers: [
        { person: BEN, amount: 40 },
        { person: CLEO, amount: 44 },
      ],
    });
    inView(answer(expenses([expense(), planned, unpaid, shared])));
    expect(screen.getAllByRole('img', { name: 'You' }).length).toBeGreaterThan(0);
    // Who paid is said in words, not only in a tooltip.
    expect(screen.getByText('You paid')).toBeInTheDocument();
    expect(screen.getByText('Multiple people paid')).toBeInTheDocument();
    expect(screen.getByText('Planning only, not split')).toBeInTheDocument();
    expect(screen.getByText('No one paid yet')).toBeInTheDocument();
    // Nothing can open it here, so no row is a button.
    expect(screen.queryByRole('button', { name: /Hotel/ })).toBeNull();
  });

  it('FE-AI-CARD-BUD-010: a waiting new expense is no button, and an answer without expenses draws nothing', () => {
    inView(answer(expenses([expense({ id: null, name: 'Gelato' })])), { onOpen: vi.fn() });
    expect(screen.getByText('Gelato')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gelato/ })).toBeNull();
    const { container } = render(<ExpensesCard cards={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('an expense in a change row', () => {
  it('FE-AI-CARD-BUD-011: the amount it replaces is struck through, and an expense that goes is struck itself', () => {
    const update = expense({
      amount: { amount: 96, currency: 'EUR' },
      before: { name: null, amount: { amount: 84, currency: 'EUR' }, category: null, date: null, split: null },
    });
    const first = inView(<ExpenseAside card={expenses([update])} item={changeItem('a', null)} />);
    expect(screen.getByText(money(84))).toHaveClass('line-through');
    expect(screen.getByText(money(96))).not.toHaveClass('line-through');
    first.unmount();
    inView(<ExpenseAside card={expenses([expense({ change: 'willDelete' })])} item={changeItem('b', null)} />);
    expect(screen.getByText(money(84))).toHaveClass('line-through');
  });

  it('FE-AI-CARD-BUD-012: the facts name the category, day and place, and what an update changes', () => {
    const onOpen = vi.fn();
    const update = expense({
      category: 'transport',
      date: '2026-06-05',
      place: { id: 12, name: 'Lokanta' },
      receipts: 1,
      note: 'Window table',
      split: 'equal',
      before: { name: null, amount: null, category: 'food', date: '2026-06-03', split: 'custom' },
    });
    inView(<ExpenseFacts card={expenses([update])} item={changeItem('a', null)} />, { onOpen });
    expect(screen.getByText('Food & drink')).toHaveClass('line-through');
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Split unevenly')).toHaveClass('line-through');
    expect(screen.getByText('Split evenly')).toBeInTheDocument();
    expect(screen.getByText('1 receipt')).toBeInTheDocument();
    // The note is too long for the faint line beside the row's buttons: it sits under the row.
    expect(screen.queryByText('Window table')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Lokanta/ }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 12, dayId: null });
  });

  it('FE-AI-CARD-BUD-012b: the note of an expense sits under its split', () => {
    inView(<ExpenseBody card={expenses([expense({ note: 'Window table' })])} item={changeItem('a', null)} />);
    expect(screen.getByText('Window table')).toBeInTheDocument();
  });

  it('FE-AI-CARD-BUD-013: the split shows who paid and each part, paid ones green, the ones it is about in the accent', () => {
    const split = expense({
      payers: [{ person: BEN, amount: 84 }],
      shares: [
        { person: ANA, amount: 28, paid: false },
        { person: BEN, amount: 28, paid: true },
        { person: CLEO, amount: 28, paid: false },
      ],
      highlight: [CLEO.id],
    });
    const first = inView(<ExpenseBody card={expenses([split])} item={changeItem('a', null)} />);
    expect(screen.getByText('Ben paid')).toBeInTheDocument();
    expect(screen.getByLabelText(`You: ${money(28)}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Ben: ${money(28)}, Paid`).firstElementChild).toHaveClass('text-success');
    // The one the change is about stands out, and says whether the tick is set or taken off.
    const cleo = screen.getByRole('img', { name: `Cleo: ${moneyName(28)}, Not paid` });
    expect(cleo.firstElementChild).toHaveClass('bg-accent');
    expect(cleo.querySelector('.lucide-check')).toBeNull();
    first.unmount();

    const ticked = expense({ shares: split.shares.map((share) => ({ ...share, paid: true })), highlight: [CLEO.id] });
    const tick = inView(<ExpenseBody card={expenses([ticked])} item={changeItem('t', null)} />);
    const paid = screen.getByRole('img', { name: `Cleo: ${moneyName(28)}, Paid` });
    expect(paid.firstElementChild).toHaveClass('bg-accent');
    expect(paid.querySelector('.lucide-check')).not.toBeNull();
    tick.unmount();

    // An even split of many reads as a stack and the part per person.
    const crowd = Array.from({ length: 6 }, (_, i) => ({ person: { ...CLEO, id: 100 + i }, amount: 14, paid: false }));
    const second = inView(<ExpenseBody card={expenses([expense({ shares: crowd })])} item={changeItem('b', null)} />);
    expect(screen.getByText('You paid')).toBeInTheDocument();
    expect(screen.getByText(`${money(14)} per person`)).toBeInTheDocument();
    second.unmount();

    // Unless the change is about one of them: then each part is a badge, so that person shows.
    const about = expense({ shares: crowd, highlight: [crowd[2]?.person.id ?? 0] });
    const third = inView(<ExpenseBody card={expenses([about])} item={changeItem('d', null)} />);
    expect(screen.queryByText(`${money(14)} per person`)).toBeNull();
    const standsOut = screen.getByRole('img', { name: `Cleo: ${moneyName(14)}, Not paid` });
    expect(standsOut.firstElementChild).toHaveClass('bg-accent');
    third.unmount();

    inView(<ExpenseBody card={expenses([expense({ split: 'none', shares: [] })])} item={changeItem('c', null)} />);
    expect(screen.getByText('Planning only, not split')).toBeInTheDocument();
  });

  it('FE-AI-CARD-BUD-014: under a run of new expenses, what the included ones add up to', () => {
    const items = [
      changeItem('a', expenses([expense({ id: null, change: 'new' })])),
      changeItem('b', expenses([expense({ id: null, change: 'new', amount: { amount: 12.1, currency: 'EUR' } })])),
    ];
    const foot = inView(<ExpensesTogether items={items} excluded={new Set()} place="foot" />);
    expect(screen.getByText(`Together ${money(96.1)}`)).toBeInTheDocument();
    foot.unmount();
    const { container } = inView(<ExpensesTogether items={items} excluded={new Set()} place="head" />);
    expect(container).toBeEmptyDOMElement();
  });
});
