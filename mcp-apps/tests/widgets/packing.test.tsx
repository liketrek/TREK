import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/packing/App';
import { PackingList } from '../../src/widgets/packing/PackingList';
import { INLINE_ITEM_LIMIT, itemsInBag } from '../../src/widgets/packing/packingModel';

const t = translator('en');
const item = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  trip_id: 4,
  name: `Item ${id}`,
  checked: 0,
  sort_order: id,
  bag_id: null,
  ...extra,
});
const bag = { id: 70, trip_id: 4, name: 'Backpack', color: '#000', sort_order: 0 };
const list = (items: unknown[], bags: unknown[] = []) => ({ items, bags, category_assignees: {} });

let state: TrekAppState;
const callServerTool = vi.fn();
const requestDisplayMode = vi.fn(async () => ({ mode: 'fullscreen' }));
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));

afterEach(() => {
  cleanup();
  callServerTool.mockReset();
});

function renderList(data: unknown, onToggle = vi.fn(async () => true), onExpand = vi.fn()) {
  render(
    <PackingList
      data={data}
      appUrl="https://trek.example"
      locale="en-GB"
      t={t}
      onOpen={vi.fn()}
      onToggle={onToggle}
      onExpand={onExpand}
    />
  );
  return { onToggle, onExpand };
}

describe('packingModel', () => {
  it('APPS-PACK-001: filters by bag', () => {
    const items = [item(1, { bag_id: 70, checked: 1 }), item(2), item(3, { bag_id: 70 })];
    expect(itemsInBag(items, 'all')).toHaveLength(3);
    expect(itemsInBag(items, 'none').map((i) => i.id)).toEqual([2]);
    expect(itemsInBag(items, 70).map((i) => i.id)).toEqual([1, 3]);
  });
});

describe('PackingList', () => {
  it('APPS-PACK-002: ticks an item off at once and keeps it when TREK agrees', async () => {
    const { onToggle } = renderList(list([item(1), item(2, { checked: 1 })]));
    expect(screen.getByText('Packed: 1 / 2')).toBeTruthy();
    const box = screen.getByRole('checkbox', { name: 'Item 1' });
    await act(async () => fireEvent.click(box));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), true);
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Packed: 2 / 2')).toBeTruthy();
  });

  it('APPS-PACK-003: puts the tick back and says so when TREK refuses', async () => {
    renderList(
      list([item(1)]),
      vi.fn(async () => false)
    );
    const box = screen.getByRole('checkbox', { name: 'Item 1' });
    await act(async () => fireEvent.click(box));
    expect(box.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('alert').textContent).toBe('Could not update the item. Try again.');
  });

  it('APPS-PACK-004: filters by bag, and unfolds past the first dozen asking for room', () => {
    const items = Array.from({ length: INLINE_ITEM_LIMIT + 3 }, (_, i) => item(i + 1));
    const { onExpand } = renderList(list([...items, item(99, { bag_id: 70 })], [bag]));
    expect(screen.getAllByRole('checkbox')).toHaveLength(INLINE_ITEM_LIMIT);
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(onExpand).toHaveBeenCalled();
    expect(screen.getAllByRole('checkbox')).toHaveLength(INLINE_ITEM_LIMIT + 4);
    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }));
    expect(screen.getAllByRole('checkbox').map((b) => b.textContent)).toEqual(['Item 99']);
    fireEvent.click(screen.getByRole('button', { name: 'No bag' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(INLINE_ITEM_LIMIT + 3);
  });

  it('APPS-PACK-005: says so when the list is empty, or the result is not a packing list', () => {
    renderList(list([]));
    expect(screen.getByText('Nothing to pack here')).toBeTruthy();
    cleanup();
    renderList({ items: 'no' });
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});

describe('packing App', () => {
  function withResult() {
    state = {
      app: { callServerTool, requestDisplayMode, openLink: vi.fn() } as unknown as TrekAppState['app'],
      result: { structuredContent: list([item(1)]), appUrl: null },
      input: null,
      error: null,
      locale: 'en-GB',
      t,
    };
  }

  it('APPS-PACK-006: ticks through toggle_packing_item on the host’s session', async () => {
    withResult();
    callServerTool.mockResolvedValue({ content: [] });
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Item 1' })));
    expect(callServerTool).toHaveBeenCalledWith({
      name: 'toggle_packing_item',
      arguments: { tripId: 4, itemId: 1, checked: true },
    });
    expect(screen.getByRole('checkbox', { name: 'Item 1' }).getAttribute('aria-checked')).toBe('true');
  });

  it('APPS-PACK-007: counts an error answer or a failed call as refused', async () => {
    withResult();
    callServerTool.mockResolvedValueOnce({ content: [], isError: true }).mockRejectedValueOnce(new Error('gone'));
    render(<App />);
    const box = screen.getByRole('checkbox', { name: 'Item 1' });
    await act(async () => fireEvent.click(box));
    await waitFor(() => expect(box.getAttribute('aria-checked')).toBe('false'));
    await act(async () => fireEvent.click(box));
    await waitFor(() => expect(callServerTool).toHaveBeenCalledTimes(2));
    expect(box.getAttribute('aria-checked')).toBe('false');
  });
});
