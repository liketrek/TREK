/**
 * FE-AI-CARD-BUD-018 to FE-AI-CARD-BUD-021
 *
 * Settle up and the share per traveller in the chat: who pays whom or the
 * square trip, the balances on their bars (green owed, red owing, from the
 * middle), the entries no rate converts, the payments already recorded, and
 * each traveller's share with how much of it is marked paid.
 */
import type { CostPerPersonCard as CostPerPersonCardData, SettlementCard as SettlementData } from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ANA, BEN, CLEO } from '../../../../../tests/helpers/assistantBudget';
import { buildUser } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAuthStore } from '../../../../store/authStore';
import { formatMoney } from '../../../../utils/formatters';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import CostPerPersonCard from './CostPerPersonCard';
import SettlementCard from './SettlementCard';

const AUTH = useAuthStore.getState();
// Intl puts a no-break space before the symbol, and text and label queries read it as a plain one.
const money = (amount: number) => formatMoney(amount, 'EUR', 'en').replace(/[\u00a0\u202f]/g, ' ');

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

function settle(overrides: Partial<SettlementData> = {}): SettlementData {
  return {
    kind: 'settlement',
    currency: 'EUR',
    flows: [
      { from: BEN, to: ANA, amount: 42.5 },
      { from: CLEO, to: ANA, amount: 18 },
    ],
    moreFlows: 0,
    balances: [
      { person: ANA, balance: 60.5 },
      { person: CLEO, balance: -18 },
      { person: BEN, balance: -42.5 },
    ],
    moreBalances: 0,
    recorded: 3,
    unconverted: { entries: 2, currencies: ['USD'] },
    ...overrides,
  };
}

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: ANA.id }) });
});
afterEach(() => {
  useAuthStore.setState(AUTH, true);
  vi.restoreAllMocks();
});

describe('settle up', () => {
  it('FE-AI-CARD-BUD-018: names who pays whom, the balances on their bars and the payments already recorded', () => {
    const onOpen = vi.fn();
    inView(<SettlementCard cards={[{ toolCallId: 'r1', card: settle() }]} />, { onOpen });
    expect(screen.getByRole('region', { name: 'Settle up' })).toBeInTheDocument();
    expect(screen.getByText(money(42.5))).toBeInTheDocument();
    expect(screen.getByText(money(18))).toBeInTheDocument();
    expect(screen.getByText('Balances')).toBeInTheDocument();
    expect(screen.getByText(`+${money(60.5)}`)).toHaveClass('text-success');
    expect(screen.getByText(money(-42.5))).toHaveClass('text-danger');
    expect(screen.getByText('3 payments settled')).toBeInTheDocument();
    expect(screen.getByText('2 entries in USD are not counted: no exchange rate yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open in Costs' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'finanzplan' });
  });

  it('FE-AI-CARD-BUD-019: a square trip says so and counts nothing it does not have', () => {
    const square = settle({
      flows: [],
      balances: [{ person: ANA, balance: 0 }],
      recorded: 0,
      unconverted: { entries: 0, currencies: [] },
    });
    inView(<SettlementCard cards={[{ toolCallId: 'r1', card: square }]} />);
    expect(screen.getByText("Everyone's square")).toBeInTheDocument();
    expect(screen.getByText('No payments outstanding right now.')).toBeInTheDocument();
    expect(screen.getByText(money(0))).toHaveClass('text-content-faint');
    expect(screen.queryByText(/payments settled/)).toBeNull();
    expect(screen.queryByText(/not counted/)).toBeNull();
  });

  it('FE-AI-CARD-BUD-020: a long settle up counts the payments and the balances it leaves out', () => {
    const card = settle({ moreFlows: 3, moreBalances: 7 });
    inView(<SettlementCard cards={[{ toolCallId: 'r1', card }]} />);
    expect(screen.getByText('3 more')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('7 more')).toBeInTheDocument();
  });
});

describe('the share per traveller', () => {
  it('FE-AI-CARD-BUD-021: lists each share, largest first, with its expenses and what is marked paid', () => {
    const card: CostPerPersonCardData = {
      kind: 'costPerPerson',
      currency: 'EUR',
      rows: [
        { person: ANA, share: 69, paid: 45, count: 2 },
        { person: BEN, share: 61, paid: 0, count: 1 },
      ],
      more: 1,
    };
    inView(<CostPerPersonCard cards={[{ toolCallId: 'r1', card }]} />, { onOpen: vi.fn() });
    expect(screen.getByRole('region', { name: 'Per Person' })).toBeInTheDocument();
    expect(screen.getByText(money(69))).toBeInTheDocument();
    expect(screen.getByText('2 expenses')).toBeInTheDocument();
    expect(screen.getByText('1 expense')).toBeInTheDocument();
    expect(screen.getByText(`${money(45)} marked paid`)).toBeInTheDocument();
    expect(screen.queryByText(`${money(0)} marked paid`)).toBeNull();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 more' })).toBeInTheDocument();
  });
});
