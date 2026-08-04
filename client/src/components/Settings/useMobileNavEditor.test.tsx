// FE-COMP-NAVEDITOR-001 to FE-COMP-NAVEDITOR-014
import React from 'react';
import { renderHook } from '../../../tests/helpers/render';
import { act } from '@testing-library/react';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAddonStore } from '../../store/addonStore';
import { usePluginStore } from '../../store/pluginStore';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useMobileNavEditor, type MobileNavValue } from './useMobileNavEditor';

const GLOBAL_ADDONS = [
  { id: 'vacay', name: 'Vacay', type: 'global', icon: 'calendar', enabled: true },
  { id: 'atlas', name: 'Atlas', type: 'global', icon: 'map', enabled: true },
  { id: 'journey', name: 'Journey', type: 'global', icon: 'compass', enabled: true },
  { id: 'collections', name: 'Collections', type: 'global', icon: 'bookmark', enabled: true },
];

function wrapper({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}

function setup(value: MobileNavValue) {
  const onChange = vi.fn<(next: MobileNavValue) => void>();
  const { result } = renderHook(() => useMobileNavEditor(value, onChange), { wrapper });
  return { result, onChange };
}

const ids = (items: { id: string }[]) => items.map(i => i.id);

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useAddonStore, { addons: GLOBAL_ADDONS, loaded: true });
  usePluginStore.setState({ plugins: [], loaded: true });
});

describe('useMobileNavEditor', () => {
  it('FE-COMP-NAVEDITOR-001: an empty value falls back to the built-in dock split', () => {
    const { result } = setup({ bar: [], more: [] });

    expect(ids(result.current.barItems)).toEqual(['vacay', 'atlas']);
    expect(ids(result.current.moreItems)).toEqual(['journey', 'collections']);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.barFull).toBe(true);
  });

  it('FE-COMP-NAVEDITOR-002: Dashboard is pinned, kept out of barItems and first in the preview', () => {
    const { result } = setup({ bar: ['vacay'], more: ['atlas'] });

    expect(result.current.dashboard?.id).toBe('dashboard');
    expect(ids(result.current.barItems)).toEqual(['vacay']);
    expect(ids(result.current.previewBar)).toEqual(['dashboard', 'vacay']);
  });

  it('FE-COMP-NAVEDITOR-003: a bar that is not full reports barFull false', () => {
    const { result } = setup({ bar: ['vacay'], more: ['atlas', 'journey', 'collections'] });

    expect(result.current.barFull).toBe(false);
  });

  it('FE-COMP-NAVEDITOR-004: everything in the bar leaves More empty', () => {
    seedStore(useAddonStore, { addons: GLOBAL_ADDONS.slice(0, 2), loaded: true });
    const { result } = setup({ bar: ['vacay', 'atlas'], more: [] });

    expect(result.current.moreItems).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('FE-COMP-NAVEDITOR-005: moving a bar item up emits the reordered id list', () => {
    const { result, onChange } = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });

    act(() => result.current.move('bar', 1, 0));

    expect(onChange).toHaveBeenCalledWith({ bar: ['atlas', 'vacay'], more: ['journey', 'collections'] });
  });

  it('FE-COMP-NAVEDITOR-006: moving inside More leaves the bar untouched', () => {
    const { result, onChange } = setup({ bar: ['vacay'], more: ['journey', 'atlas', 'collections'] });

    act(() => result.current.move('more', 0, 1));

    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay'], more: ['atlas', 'journey', 'collections'] });
  });

  it('FE-COMP-NAVEDITOR-007: a move past the end of a zone emits the list unchanged', () => {
    const { result, onChange } = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });

    act(() => result.current.move('bar', 1, 2));

    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });
  });

  it('FE-COMP-NAVEDITOR-008: a move before the start of a zone emits the list unchanged', () => {
    const { result, onChange } = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });

    act(() => result.current.move('bar', 0, -1));

    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });
  });

  it('FE-COMP-NAVEDITOR-009: a move onto itself emits the list unchanged', () => {
    const { result, onChange } = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });

    act(() => result.current.move('bar', 1, 1));

    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });
  });

  it('FE-COMP-NAVEDITOR-010: demoting a bar item appends it to the end of More', () => {
    const { result, onChange } = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });

    act(() => result.current.toMore('vacay'));

    expect(onChange).toHaveBeenCalledWith({ bar: ['atlas'], more: ['journey', 'collections', 'vacay'] });
  });

  it('FE-COMP-NAVEDITOR-011: demoting an id that is not in the bar is a no-op', () => {
    const { result, onChange } = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });

    act(() => result.current.toMore('journey'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-COMP-NAVEDITOR-012: promoting appends to the bar and drops the item from More', () => {
    const { result, onChange } = setup({ bar: ['vacay'], more: ['journey', 'atlas', 'collections'] });

    act(() => result.current.toBar('atlas'));

    expect(onChange).toHaveBeenCalledWith({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });
  });

  it('FE-COMP-NAVEDITOR-013: promoting is refused when the bar is full or the id is unknown', () => {
    const full = setup({ bar: ['vacay', 'atlas'], more: ['journey', 'collections'] });
    act(() => full.result.current.toBar('journey'));
    expect(full.onChange).not.toHaveBeenCalled();

    const room = setup({ bar: ['vacay'], more: ['journey', 'atlas', 'collections'] });
    act(() => room.result.current.toBar('does-not-exist'));
    expect(room.onChange).not.toHaveBeenCalled();
  });

  it('FE-COMP-NAVEDITOR-014: page plugins take part in the split under their plugin id', () => {
    usePluginStore.setState({
      plugins: [{ id: 'todos', name: 'Trip To-Dos', type: 'page', icon: 'list' }] as never,
      loaded: true,
    });
    const { result, onChange } = setup({ bar: ['vacay'], more: ['plugin:todos'] });

    // Items the stored config never mentioned are appended under More.
    expect(ids(result.current.moreItems)).toEqual(['plugin:todos', 'atlas', 'journey', 'collections']);

    act(() => result.current.toBar('plugin:todos'));
    expect(onChange).toHaveBeenCalledWith({
      bar: ['vacay', 'plugin:todos'],
      more: ['atlas', 'journey', 'collections'],
    });
  });
});
