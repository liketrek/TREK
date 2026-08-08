// FE-MOB-SETNAVC-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen, within } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { useAddonStore } from '../../../../src/store/addonStore';
import { usePluginStore } from '../../../../src/store/pluginStore';
import type { MobileNavValue } from '../../../../src/components/Settings/useMobileNavEditor';
import MMobileNavCustomizer from '../../../../src/mobile/screens/settings/MMobileNavCustomizer';

const GLOBAL_ADDONS = [
  { id: 'vacay', name: 'Vacay', type: 'global', icon: 'calendar', enabled: true },
  { id: 'atlas', name: 'Atlas', type: 'global', icon: 'map', enabled: true },
  { id: 'journey', name: 'Journey', type: 'global', icon: 'compass', enabled: true },
  { id: 'collections', name: 'Collections', type: 'global', icon: 'bookmark', enabled: true },
];

/** The section wrapper holding the rows of a zone ("In the bar" / Under "More"). */
function zone(heading: string): HTMLElement {
  return screen.getByText(heading).closest('div')!.parentElement!;
}

function rowLabels(heading: string): string[] {
  return within(zone(heading))
    .getAllByLabelText('Move up')
    .map((btn) => btn.closest('div')!.querySelector('span.truncate')!.textContent ?? '');
}

describe('MMobileNavCustomizer', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAddonStore, { addons: GLOBAL_ADDONS, loaded: true });
    usePluginStore.setState({ plugins: [], loaded: true });
  });

  it('FE-MOB-SETNAVC-001: an uncustomised value falls back to the built-in dock split', () => {
    render(<MMobileNavCustomizer value={{ bar: [], more: [] }} onChange={vi.fn()} />);

    expect(rowLabels('In the bar')).toEqual(['Vacay', 'Atlas']);
    expect(rowLabels('Under “More”')).toEqual(['Journey', 'Collections']);
  });

  it('FE-MOB-SETNAVC-002: Dashboard is listed pinned and has no reorder buttons', () => {
    render(<MMobileNavCustomizer value={{ bar: [], more: [] }} onChange={vi.fn()} />);

    expect(screen.getByText('My Trips')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    // Dashboard sits in the bar but is not one of the movable rows.
    expect(rowLabels('In the bar')).not.toContain('My Trips');
  });

  it('FE-MOB-SETNAVC-003: the bar counter includes the pinned Dashboard slot', () => {
    render(<MMobileNavCustomizer value={{ bar: ['vacay'], more: ['atlas'] }} onChange={vi.fn()} />);

    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('FE-MOB-SETNAVC-004: demoting a bar item emits it at the end of More', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(next: MobileNavValue) => void>();
    render(<MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] }} onChange={onChange} />);

    await user.click(within(zone('In the bar')).getAllByLabelText('Move under “More”')[0]);
    expect(onChange).toHaveBeenCalledWith({ bar: ['atlas'], more: ['journey', 'collections', 'vacay'] });
  });

  it('FE-MOB-SETNAVC-005: promoting a More item appends it to the bar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(next: MobileNavValue) => void>();
    render(<MMobileNavCustomizer value={{ bar: ['vacay'], more: ['journey', 'atlas', 'collections'] }} onChange={onChange} />);

    await user.click(within(zone('Under “More”')).getAllByLabelText('Move into the bar')[1]);
    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });
  });

  it('FE-MOB-SETNAVC-006: promotion is disabled once the bar is full', () => {
    render(<MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] }} onChange={vi.fn()} />);

    for (const btn of within(zone('Under “More”')).getAllByLabelText('Move into the bar')) {
      expect(btn).toBeDisabled();
    }
  });

  it('FE-MOB-SETNAVC-007: reordering inside the bar emits the swapped id list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(next: MobileNavValue) => void>();
    render(<MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] }} onChange={onChange} />);

    await user.click(within(zone('In the bar')).getAllByLabelText('Move up')[1]);
    expect(onChange).toHaveBeenCalledWith({ bar: ['atlas', 'vacay'], more: ['journey', 'collections'] });
  });

  it('FE-MOB-SETNAVC-008: reordering inside More leaves the bar untouched', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(next: MobileNavValue) => void>();
    render(<MMobileNavCustomizer value={{ bar: ['vacay'], more: ['journey', 'atlas', 'collections'] }} onChange={onChange} />);

    await user.click(within(zone('Under “More”')).getAllByLabelText('Move down')[0]);
    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay'], more: ['atlas', 'journey', 'collections'] });
  });

  it('FE-MOB-SETNAVC-009: the ends of a zone have their arrows disabled', () => {
    render(<MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] }} onChange={vi.fn()} />);

    const ups = within(zone('In the bar')).getAllByLabelText('Move up');
    const downs = within(zone('In the bar')).getAllByLabelText('Move down');
    expect(ups[0]).toBeDisabled();
    expect(downs[1]).toBeDisabled();
    expect(ups[1]).not.toBeDisabled();
  });

  it('FE-MOB-SETNAVC-010: an empty More zone shows the placeholder instead of rows', () => {
    seedStore(useAddonStore, { addons: GLOBAL_ADDONS.slice(0, 2), loaded: true });
    render(<MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: [] }} onChange={vi.fn()} />);

    expect(screen.getByText('Nothing here yet — everything fits in the bar.')).toBeInTheDocument();
    expect(within(zone('Under “More”')).queryByLabelText('Move up')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETNAVC-011: the preview mirrors the dock and only shows More when items are demoted', () => {
    const { rerender } = render(
      <MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: ['journey'] }} onChange={vi.fn()} />,
    );
    expect(screen.getByTitle('More')).toBeInTheDocument();
    expect(screen.getByTitle('My Trips')).toBeInTheDocument();
    expect(screen.getByTitle('Vacay')).toBeInTheDocument();

    act(() => seedStore(useAddonStore, { addons: GLOBAL_ADDONS.slice(0, 2), loaded: true }));
    rerender(<MMobileNavCustomizer value={{ bar: ['vacay', 'atlas'], more: [] }} onChange={vi.fn()} />);
    expect(screen.queryByTitle('More')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETNAVC-012: page plugins appear as nav items under More', () => {
    usePluginStore.setState({
      plugins: [{ id: 'todos', name: 'Trip To-Dos', type: 'page', icon: 'list' }] as never,
      loaded: true,
    });
    render(<MMobileNavCustomizer value={{ bar: ['vacay'], more: ['plugin:todos'] }} onChange={vi.fn()} />);

    expect(rowLabels('Under “More”')).toContain('Trip To-Dos');
  });
});
