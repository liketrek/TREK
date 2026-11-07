import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/budget/App';
import { Budget } from '../../src/widgets/budget/Budget';
import { categoriesOf, formatMoney, peopleOf } from '../../src/widgets/budget/budgetModel';

const t = translator('en');
const items = (byCategory: Record<string, number>) => ({
  currency: 'EUR',
  total: Object.values(byCategory).reduce((a, b) => a + b, 0),
  by_category: byCategory,
  unconverted_item_ids: [],
  item_count: 2,
  offset: 0,
  next_offset: null,
  items: [],
  people: [],
});
const perPerson = {
  summary: [
    {
      user_id: 1,
      username: 'ana',
      avatar: null,
      avatar_url: null,
      total_assigned: 120,
      total_paid: 50,
      items_count: 2,
      currency: 'EUR',
    },
  ],
};

let state: TrekAppState;
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));
afterEach(cleanup);

describe('budgetModel', () => {
  it('APPS-BUDGET-001: orders categories largest first with their share of the largest', () => {
    expect(categoriesOf(items({ Food: 50, Hotel: 200 }))?.categories).toEqual([
      { name: 'Hotel', amount: 200, share: 1 },
      { name: 'Food', amount: 50, share: 0.25 },
    ]);
    expect(categoriesOf(perPerson)).toBeNull();
    expect(peopleOf(perPerson)).toEqual({ currency: 'EUR', people: [{ name: 'ana', assigned: 120, paid: 50 }] });
    expect(peopleOf(items({}))).toBeNull();
  });

  it('APPS-BUDGET-002: formats in the trip currency, and falls back to a number for an unknown one', () => {
    expect(formatMoney(12.5, 'EUR', 'en-GB')).toBe('€12.50');
    expect(formatMoney(12.5, 'nope', 'en-GB')).toBe('12.5');
  });
});

describe('Budget', () => {
  it('APPS-BUDGET-003: shows the categories and reads the people through the host on demand', async () => {
    const loadOther = vi.fn(async () => perPerson);
    render(<Budget data={items({ Hotel: 200, '': 10 })} locale="en-GB" t={t} loadOther={loadOther} />);
    expect(screen.getByText('Total: €210.00')).toBeTruthy();
    expect(screen.getByText('Uncategorized')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'By person' })));
    expect(loadOther).toHaveBeenCalledWith('person');
    expect(screen.getByRole('rowheader', { name: 'ana' })).toBeTruthy();
    expect(screen.getByText('€120.00')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'By category' })));
    expect(loadOther).toHaveBeenCalledTimes(1);
  });

  it('APPS-BUDGET-004: opens on the people when drawn by get_budget_per_person, and says when the other side fails', async () => {
    const loadOther = vi.fn(async () => {
      throw new Error('refused');
    });
    render(<Budget data={perPerson} locale="en-GB" t={t} loadOther={loadOther} />);
    expect(screen.getByRole('button', { name: 'By person' }).getAttribute('aria-pressed')).toBe('true');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'By category' })));
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });

  it('APPS-BUDGET-005: says so when nothing is booked, and when the result is not a budget', () => {
    const { unmount } = render(<Budget data={items({})} locale="en" t={t} loadOther={vi.fn()} />);
    expect(screen.getByText('No costs yet')).toBeTruthy();
    unmount();
    render(<Budget data={{ summary: 'no' }} locale="en" t={t} loadOther={vi.fn()} />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});

describe('budget App', () => {
  const withResult = (callServerTool: ReturnType<typeof vi.fn>, input: Record<string, unknown> | null) => {
    state = {
      app: { callServerTool } as unknown as TrekAppState['app'],
      result: { structuredContent: items({ Hotel: 200 }), appUrl: null },
      input,
      error: null,
      locale: 'en-GB',
      t,
    };
  };

  it('APPS-BUDGET-006: reads the per-person side with get_budget_per_person for the same trip', async () => {
    const callServerTool = vi.fn(async () => ({ content: [], structuredContent: perPerson }));
    withResult(callServerTool, { tripId: 4 });
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'By person' })));
    expect(callServerTool).toHaveBeenCalledWith({ name: 'get_budget_per_person', arguments: { tripId: 4 } });
    await waitFor(() => expect(screen.getByRole('rowheader', { name: 'ana' })).toBeTruthy());
  });

  it('APPS-BUDGET-007: fails without a trip in the input and on a refusal', async () => {
    const callServerTool = vi.fn(async () => ({ content: [], isError: true }));
    withResult(callServerTool, null);
    const { unmount } = render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'By person' })));
    expect(callServerTool).not.toHaveBeenCalled();
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
    unmount();
    withResult(callServerTool, { tripId: 4 });
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'By person' })));
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});
