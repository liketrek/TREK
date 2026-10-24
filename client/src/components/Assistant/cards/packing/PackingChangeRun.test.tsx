/**
 * FE-AI-PACKRUN-001 to FE-AI-PACKRUN-004
 *
 * A run of single-row packing changes reads as one checklist inside the
 * change card: each category's head once, a row per change with its own
 * include choice and the tile of what it does, and the facts of the change
 * with old values struck through. A change switched off fades, and the
 * choices wait while the chat runs.
 */
import type { PackingCardItem, PackingListCard } from '@trek/shared';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { PackingChangeRun } from './PackingListCard';

const row = (name: string, over: Partial<PackingCardItem> = {}): PackingCardItem => ({
  id: null,
  name,
  quantity: 1,
  packed: 0,
  checked: false,
  weightGrams: null,
  bagKey: null,
  tier: 'common',
  sharedWith: [],
  change: 'add',
  changed: [],
  ...over,
});

const card = (category: string, item: PackingCardItem): PackingListCard => ({
  kind: 'packingList',
  source: { type: 'trip' },
  groupBy: 'category',
  progress: null,
  bags: [],
  groups: [
    {
      key: { by: 'category', name: category, slot: 0 },
      assignees: [],
      assigneesRemoved: [],
      items: [item],
      count: 1,
      packed: item.checked ? 1 : 0,
    },
  ],
  moreGroups: 0,
});

const pending = (id: string, packing: PackingListCard): ChangeItem => ({
  toolCallId: id,
  preview: null,
  applied: null,
  state: 'pending',
  card: packing,
});

const QUANTITY: PackingCardItem['changed'] = [{ field: 'quantity', before: '2' }];

const ITEMS = [
  pending('c1', card('Toiletries', row('Sunscreen', { quantity: 2 }))),
  pending('c2', card('Toiletries', row('Toothbrush'))),
  pending('c3', card('Clothes', row('Rain jacket', { change: 'check', checked: true, packed: 1 }))),
  pending('c4', card('Clothes', row('Hiking socks', { change: 'update', quantity: 3, changed: QUANTITY }))),
  pending('c5', card('Clothes', row('Old charger', { change: 'remove' }))),
];

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

describe('PackingChangeRun', () => {
  it("FE-AI-PACKRUN-001: each category's head shows once, a row per change with what it does", () => {
    inView(<PackingChangeRun items={ITEMS} excluded={new Set()} disabled={false} onToggle={vi.fn()} />);
    expect(screen.getAllByText('Toiletries')).toHaveLength(1);
    expect(screen.getAllByText('Clothes')).toHaveLength(1);
    expect(screen.getAllByText('New')).toHaveLength(2);
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(screen.getByText('Packed')).toBeInTheDocument();
    expect(screen.getByText('2')).toHaveClass('line-through');
    expect(screen.getByText('Old charger')).toHaveClass('line-through');
    expect(screen.getByText('Removed')).toBeInTheDocument();
  });

  it('FE-AI-PACKRUN-002: every row has its own include choice, and a switched-off one fades', () => {
    const onToggle = vi.fn();
    inView(<PackingChangeRun items={ITEMS} excluded={new Set(['c5'])} disabled={false} onToggle={onToggle} />);
    const choices = screen.getAllByRole('button', { name: 'Include this change' });
    expect(choices).toHaveLength(5);
    expect(choices[4]).toHaveAttribute('aria-pressed', 'false');
    expect(choices[4]?.parentElement).toHaveClass('opacity-50');
    fireEvent.click(choices[1] as HTMLElement);
    expect(onToggle).toHaveBeenCalledWith('c2');
  });

  it('FE-AI-PACKRUN-003: on the phone the choice gets a larger hit area; a change without a card is left out', () => {
    const plain: ChangeItem = { toolCallId: 'c9', preview: null, applied: null, state: 'pending', card: null };
    inView(
      <PackingChangeRun
        items={[...ITEMS.slice(0, 2), plain]}
        excluded={new Set()}
        disabled={false}
        onToggle={vi.fn()}
      />,
      { variant: 'fullscreen' }
    );
    const choices = screen.getAllByRole('button', { name: 'Include this change' });
    expect(choices).toHaveLength(2);
    expect(choices[0]).toHaveClass('h-8', 'w-8');
  });

  it('FE-AI-PACKRUN-004: while the chat runs every include choice waits', () => {
    const onToggle = vi.fn();
    inView(<PackingChangeRun items={ITEMS} excluded={new Set()} disabled onToggle={onToggle} />);
    const choices = screen.getAllByRole('button', { name: 'Include this change' });
    expect(choices).toHaveLength(5);
    for (const choice of choices) expect(choice).toBeDisabled();
    fireEvent.click(choices[0] as HTMLElement);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
