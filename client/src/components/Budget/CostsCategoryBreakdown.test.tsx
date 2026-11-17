// FE-COSTS-CATBARS-001 to FE-COSTS-CATBARS-003
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import { CostsCategoryBreakdown } from './CostsCategoryBreakdown';
import type { CostsCategoryBar } from './costsModel';

const fmt = (v: number) => `${v} €`;
const rows: CostsCategoryBar[] = [
  { key: 'accommodation', amount: 300, widthPct: 100, leftOut: false },
  { key: 'food', amount: 120, widthPct: 40, leftOut: false },
];

function setup(over: Partial<Parameters<typeof CostsCategoryBreakdown>[0]> = {}) {
  const onToggle = vi.fn();
  const onCountAll = vi.fn();
  render(
    <CostsCategoryBreakdown
      rows={rows}
      leftOutLabel=""
      fmt={fmt}
      onToggle={onToggle}
      onCountAll={onCountAll}
      {...over}
    />
  );
  return { onToggle, onCountAll };
}

describe('CostsCategoryBreakdown (#2819)', () => {
  it('FE-COSTS-CATBARS-001: a category is clicked out of the totals, with a hint on how', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup();
    expect(screen.getByText('Select a category to leave it out of the totals.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave Food & drink out of the totals' }));
    expect(onToggle).toHaveBeenCalledWith('food');
  });

  it('FE-COSTS-CATBARS-002: a category left out stays dimmed in place and says what is left out', async () => {
    const user = userEvent.setup();
    const { onToggle, onCountAll } = setup({
      rows: [rows[0], { ...rows[1], leftOut: true, widthPct: 0 }],
      leftOutLabel: 'Left out of the totals: Food & drink',
    });
    const food = screen.getByRole('button', { name: 'Count Food & drink in the totals again' });
    expect(food.className).toContain('opacity-45');
    expect(screen.getByText('120 €').className).toContain('line-through');
    expect(screen.getByText('Left out of the totals: Food & drink')).toBeInTheDocument();
    expect(screen.queryByText('Select a category to leave it out of the totals.')).toBeNull();
    await user.click(food);
    expect(onToggle).toHaveBeenCalledWith('food');
    await user.click(screen.getByRole('button', { name: 'Count all' }));
    expect(onCountAll).toHaveBeenCalledTimes(1);
  });

  it('FE-COSTS-CATBARS-003: without spend there is nothing to break down', () => {
    setup({ rows: [] });
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
