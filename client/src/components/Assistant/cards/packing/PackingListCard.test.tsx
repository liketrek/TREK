/**
 * FE-AI-PACK-001 to FE-AI-PACK-009
 *
 * The packing list in the chat: an answer's groups with their colour,
 * count, people and rows (how many, how many packed, weight, tier, bag), the
 * lines for what it left out and the way into the list; bag heads with their
 * weight against the limit; a change's facts on its line and the groups,
 * bags or template under it.
 */
import type { PackingCardBag, PackingCardItem, PackingListCard } from '@trek/shared';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { KAT_COLORS } from '../../../Packing/packingListPanel.constants';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import { PackingChangeBody, PackingChangeFacts, PackingListBlock } from './PackingListCard';

const ANA = { id: 2, name: 'Ana', avatarKey: null };

const row = (id: number | null, name: string, over: Partial<PackingCardItem> = {}): PackingCardItem => ({
  id,
  name,
  quantity: 1,
  packed: 0,
  checked: false,
  weightGrams: null,
  bagKey: null,
  tier: 'common',
  sharedWith: [],
  change: 'none',
  changed: [],
  ...over,
});

const bag = (over: Partial<PackingCardBag> = {}): PackingCardBag => ({
  key: 'id:5',
  id: 5,
  name: 'Carry-on',
  color: '#6366f1',
  weightGrams: 6200,
  limitGrams: 8000,
  owner: null,
  members: [],
  membersRemoved: [],
  change: 'none',
  changed: [],
  movesOut: 0,
  ...over,
});

const ANSWER: PackingListCard = {
  kind: 'packingList',
  source: { type: 'trip' },
  groupBy: 'category',
  progress: { packed: 1, total: 4 },
  bags: [bag()],
  groups: [
    {
      key: { by: 'category', name: 'Clothes', slot: 1 },
      assignees: [ANA],
      assigneesRemoved: [],
      items: [
        row(11, 'Rain jacket', { checked: true, packed: 1, weightGrams: 480, bagKey: 'id:5' }),
        row(12, 'Hiking socks', { quantity: 3, packed: 1 }),
        row(15, 'Sun hat', { tier: 'personal' }),
      ],
      count: 5,
      packed: 1,
    },
    {
      key: { by: 'category', name: null, slot: null },
      assignees: [],
      assigneesRemoved: [],
      items: [row(14, 'Sunscreen', { tier: 'shared', sharedWith: [ANA] })],
      count: 1,
      packed: 0,
    },
  ],
  moreGroups: 2,
};

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

const entries = (...cards: PackingListCard[]): CardEntry[] =>
  cards.map((card, i) => ({ toolCallId: `call_${i}`, card }));

const changeItem = (card: PackingListCard): ChangeItem => ({
  toolCallId: 'call_c',
  preview: null,
  applied: null,
  state: 'pending',
  card,
});

describe('PackingListCard', () => {
  it('FE-AI-PACK-001: an answer shows the list, how much is packed and its groups in their colours', () => {
    inView(<PackingListBlock cards={entries(ANSWER)} />);
    expect(screen.getByRole('region', { name: 'Packing list' })).toBeInTheDocument();
    expect(screen.getByText('1 of 4 packed')).toBeInTheDocument();
    const clothes = screen.getByText('Clothes');
    expect(clothes.previousElementSibling).toHaveStyle({ background: KAT_COLORS[1] });
    expect(screen.getByText('Other')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Ana' }).length).toBeGreaterThan(0);
  });

  it('FE-AI-PACK-002: a row says how many, how many are packed, its weight, its tier and its bag', () => {
    inView(<PackingListBlock cards={entries(ANSWER)} />);
    expect(screen.getByText('Rain jacket')).toHaveClass('line-through');
    expect(screen.getByText('480 g')).toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Just for me' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Carry-on' })).toHaveStyle({ background: '#6366f1' });
  });

  it('FE-AI-PACK-003: what it left out leads into the list, as does its open button', () => {
    const onOpen = vi.fn();
    inView(<PackingListBlock cards={entries(ANSWER)} />, { onOpen });
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 more categories' }));
    fireEvent.click(screen.getByRole('button', { name: /Open packing list/ }));
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'listen', sub: 'packing' });
  });

  it('FE-AI-PACK-004: bag heads show their weight against the limit, past it in red, the pile in no bag last', () => {
    const heavy = bag({ weightGrams: 9000 });
    const card: PackingListCard = {
      ...ANSWER,
      groupBy: 'bag',
      progress: null,
      bags: [heavy],
      groups: [
        { ...ANSWER.groups[0], key: { by: 'bag', bagKey: 'id:5' }, items: [], count: 1, assignees: [] },
        { ...ANSWER.groups[0], key: { by: 'bag', bagKey: null }, items: [], count: 3, assignees: [] },
      ],
      moreGroups: 0,
    };
    inView(<PackingListBlock cards={entries(card)} />);
    expect(screen.getByRole('region', { name: 'Bags' })).toBeInTheDocument();
    expect(screen.getByText('9.0 kg of 8.0 kg')).toBeInTheDocument();
    expect(screen.getByText('Over the limit')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('FE-AI-PACK-005: two answers of one list read as one card, another source stands apart', () => {
    const more: PackingListCard = { ...ANSWER, groups: [{ ...ANSWER.groups[0], items: [row(16, 'Gloves')] }] };
    const source = { type: 'tour' as const, placeId: 70, name: 'Ridge walk', category: null };
    const tour: PackingListCard = { ...ANSWER, source };
    inView(<PackingListBlock cards={entries(ANSWER, more, tour)} />);
    expect(screen.getAllByRole('region')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Ridge walk' })).toBeInTheDocument();
    expect(screen.getByText('Packing for this tour')).toBeInTheDocument();
    expect(screen.getAllByText('Gloves')).toHaveLength(1);
  });

  it('FE-AI-PACK-006: a change of one row states its facts on its line, old values struck through', () => {
    const card = (item: PackingCardItem): PackingListCard => ({
      ...ANSWER,
      progress: null,
      groups: [{ ...ANSWER.groups[0], items: [item], count: 1 }],
      moreGroups: 0,
    });
    const ticked = card(row(12, 'Hiking socks', { change: 'check', checked: true }));
    const { unmount } = inView(<PackingChangeFacts card={ticked} item={changeItem(ticked)} />);
    expect(screen.getByText('Packed')).toBeInTheDocument();
    unmount();
    const quantity = [{ field: 'quantity' as const, before: '2' }];
    const changed = card(row(12, 'Hiking socks', { change: 'update', quantity: 3, changed: quantity }));
    inView(<PackingChangeFacts card={changed} item={changeItem(changed)} />);
    expect(screen.getByText('2')).toHaveClass('line-through');
    expect(screen.getByText('3')).toBeInTheDocument();
    const { container } = inView(<PackingChangeBody card={changed} item={changeItem(changed)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-PACK-007: under a bigger change: the template it adds, a bag about to go, the people a category drops', () => {
    const template: PackingListCard = {
      ...ANSWER,
      source: { type: 'template', templateId: 4, name: 'Beach week', itemCount: 24 },
      progress: null,
      bags: [],
      groups: [],
      moreGroups: 0,
    };
    const { unmount } = inView(<PackingChangeBody card={template} item={changeItem(template)} />);
    expect(screen.getByText('Adds 24 items from the template')).toBeInTheDocument();
    unmount();
    const gone: PackingListCard = {
      ...ANSWER,
      groupBy: 'bag',
      progress: null,
      bags: [bag({ change: 'remove', movesOut: 3 })],
      groups: [{ ...ANSWER.groups[0], key: { by: 'bag', bagKey: 'id:5' }, items: [], assignees: [] }],
      moreGroups: 0,
    };
    const second = inView(<PackingChangeBody card={gone} item={changeItem(gone)} />);
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getByText('3 items move to Unassigned')).toBeInTheDocument();
    second.unmount();
    const people: PackingListCard = {
      ...ANSWER,
      progress: null,
      groups: [{ ...ANSWER.groups[0], items: [], assignees: [], assigneesRemoved: [ANA] }],
      moreGroups: 0,
    };
    inView(<PackingChangeBody card={people} item={changeItem(people)} />);
    expect(screen.getByText('No longer: Ana')).toBeInTheDocument();
  });

  it('FE-AI-PACK-008: an import of twenty into one category says how many more it adds than it shows', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row(null, `Item ${i}`, { change: 'add' }));
    const imported: PackingListCard = {
      ...ANSWER,
      progress: null,
      bags: [],
      groups: [{ ...ANSWER.groups[0], assignees: [], items: rows, count: 20 }],
      moreGroups: 0,
    };
    inView(<PackingChangeBody card={imported} item={changeItem(imported)} />);
    expect(screen.getByText('+12 more')).toBeInTheDocument();
  });

  it('FE-AI-PACK-009: a row whose bag the card does not carry shows no swatch, never "Unassigned"', () => {
    const card: PackingListCard = {
      ...ANSWER,
      bags: [],
      groups: [{ ...ANSWER.groups[0], items: [row(11, 'Rain jacket', { bagKey: 'id:5' })], count: 1 }],
      moreGroups: 0,
    };
    inView(<PackingListBlock cards={entries(card)} />);
    expect(screen.queryByRole('img', { name: 'Unassigned' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Carry-on' })).not.toBeInTheDocument();
  });
});
