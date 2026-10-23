/**
 * FE-COSTS-LINK-001 to FE-COSTS-LINK-006
 *
 * The links into the Costs tab that open the expense dialog: one expense
 * (`?expense=<id>`, the assistant's "Open in Costs"), reading the expenses
 * once more when the store does not hold it yet, dropped once taken or when
 * that read does not bring it either; and the bottom bar's "+"
 * (`?create=expense`) where the view asks for it.
 */
import { useSearchParams } from 'react-router';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { buildBudgetItem } from '../../../tests/helpers/factories';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import type { BudgetItem } from '../../types';
import { useExpenseLinks } from './useExpenseLinks';

let reload: Mock<(tripId: number | string) => Promise<void>>;

function Probe({
  items,
  open,
  create = false,
}: {
  items: BudgetItem[];
  open: (expense: BudgetItem | null) => void;
  create?: boolean;
}) {
  useExpenseLinks(4, items, open, { create });
  const [params] = useSearchParams();
  return <output aria-label="search">{params.toString()}</output>;
}

const search = () => screen.getByRole('status', { name: 'search' }).textContent;

describe('useExpenseLinks', () => {
  beforeEach(() => {
    resetAllStores();
    reload = vi.fn<(tripId: number | string) => Promise<void>>(async () => undefined);
    useTripStore.setState({ loadBudgetItems: reload });
  });

  it('FE-COSTS-LINK-001: opens the expense a link names and drops only its own part of the address', () => {
    const dinner = buildBudgetItem({ id: 31 });
    const open = vi.fn();
    render(<Probe items={[buildBudgetItem({ id: 30 }), dinner]} open={open} />, {
      initialEntries: ['/trips/4?tab=finanzplan&expense=31'],
    });
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(dinner);
    expect(search()).toBe('tab=finanzplan');
    expect(reload).not.toHaveBeenCalled();
  });

  it('FE-COSTS-LINK-002: an expense not in the store yet reads the expenses again and opens once it arrives', async () => {
    let arrive: () => void = () => undefined;
    reload.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          arrive = resolve;
        })
    );
    const open = vi.fn();
    const first = render(<Probe items={[buildBudgetItem({ id: 30 })]} open={open} />, {
      initialEntries: ['/trips/4?expense=31'],
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith(4);
    expect(search()).toBe('expense=31');
    const dinner = buildBudgetItem({ id: 31 });
    first.rerender(<Probe items={[buildBudgetItem({ id: 30 }), dinner]} open={open} />);
    expect(open).toHaveBeenCalledWith(dinner);
    expect(search()).toBe('');
    // The read that was still under way changes nothing once it lands.
    arrive();
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(search()).toBe('');
  });

  it('FE-COSTS-LINK-003: a malformed id is dropped at once, expenses or not', () => {
    const open = vi.fn();
    render(<Probe items={[]} open={open} />, { initialEntries: ['/trips/4?expense=dinner'] });
    expect(open).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(search()).toBe('');
  });

  it('FE-COSTS-LINK-004: the "+" opens an empty dialog where the view asks for it, and is left alone elsewhere', () => {
    const open = vi.fn();
    const first = render(<Probe items={[]} open={open} create />, { initialEntries: ['/trips/4?create=expense'] });
    expect(open).toHaveBeenCalledWith(null);
    expect(search()).toBe('');
    first.unmount();

    const phone = vi.fn();
    render(<Probe items={[]} open={phone} />, { initialEntries: ['/trips/4?create=expense'] });
    expect(phone).not.toHaveBeenCalled();
    expect(search()).toBe('create=expense');
  });

  it('FE-COSTS-LINK-005: an id the second read does not bring either is dropped without opening anything', async () => {
    const open = vi.fn();
    render(<Probe items={[buildBudgetItem({ id: 5 })]} open={open} />, { initialEntries: ['/trips/4?expense=99'] });
    expect(search()).toBe('expense=99');
    await waitFor(() => expect(search()).toBe(''));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it('FE-COSTS-LINK-006: on a trip without any expense the link is still dropped after the read', async () => {
    const open = vi.fn();
    render(<Probe items={[]} open={open} />, { initialEntries: ['/trips/4?tab=finanzplan&expense=31'] });
    await waitFor(() => expect(search()).toBe('tab=finanzplan'));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });
});
