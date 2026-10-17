import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPackingItem } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { packingApi } from '../../api/client';
import { useTripStore } from '../../store/tripStore';
import type { PackingView } from './packingListModel';
import { usePackingTemplates } from './usePackingTemplates';

// FE-PACK-TEMPL-001 to FE-PACK-TEMPL-007

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;
const BEACH = { id: 4, name: 'Beach', item_count: 12 };
const SKI = { id: 5, name: 'Ski', item_count: 30 };
const EXISTING = buildPackingItem({ id: 1, name: 'Tent' });

function setup(view: PackingView = 'common') {
  const toast = { success: vi.fn(), error: vi.fn() };
  const onApplied = vi.fn();
  const onSaved = vi.fn();
  const rendered = renderHook(() => usePackingTemplates({ tripId: 7, view, t, toast, onApplied, onSaved }));
  return { ...rendered, toast, onApplied, onSaved };
}

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { packingItems: [EXISTING] });
});

afterEach(() => vi.restoreAllMocks());

describe('usePackingTemplates', () => {
  it('FE-PACK-TEMPL-001: lists the templates on hand for the trip, and nothing when that fails', async () => {
    const list = vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [BEACH] });
    const { result } = setup();
    await waitFor(() => expect(result.current.templates).toEqual([BEACH]));
    expect(list).toHaveBeenCalledWith(7);

    list.mockRejectedValue(new Error('offline'));
    const failed = setup();
    await act(async () => {});
    expect(failed.result.current.templates).toEqual([]);
  });

  it('FE-PACK-TEMPL-002: applying lands the items in the list being looked at and reports how many', async () => {
    vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [BEACH] });
    const added = buildPackingItem({ id: 2, name: 'Towel', is_private: 1 });
    let finish: () => void = () => {};
    const apply = vi.spyOn(packingApi, 'applyTemplate').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ items: [added], count: 1 });
        })
    );
    const { result, toast, onApplied } = setup('personal');
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.applyTemplate(4);
    });
    expect(result.current.applyingTemplate).toBe(true);
    await act(async () => {
      finish();
      await done;
    });
    expect(apply).toHaveBeenCalledWith(7, 4, 'personal');
    expect(useTripStore.getState().packingItems).toEqual([EXISTING, added]);
    expect(toast.success).toHaveBeenCalledWith('packing.templateApplied:1');
    expect(onApplied).toHaveBeenCalledTimes(1);
    expect(result.current.applyingTemplate).toBe(false);
  });

  it('FE-PACK-TEMPL-003: a template without items still reports success and keeps the list', async () => {
    vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [] });
    vi.spyOn(packingApi, 'applyTemplate').mockResolvedValue({ count: 0 });
    const { result, toast } = setup();
    await act(async () => {
      await result.current.applyTemplate(4);
    });
    expect(useTripStore.getState().packingItems).toEqual([EXISTING]);
    expect(toast.success).toHaveBeenCalledWith('packing.templateApplied:0');
  });

  it('FE-PACK-TEMPL-004: a failed apply is reported and leaves the surface open', async () => {
    vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [] });
    vi.spyOn(packingApi, 'applyTemplate').mockRejectedValue(new Error('x'));
    const { result, toast, onApplied } = setup();
    await act(async () => {
      await result.current.applyTemplate(4);
    });
    expect(toast.error).toHaveBeenCalledWith('packing.templateError');
    expect(onApplied).not.toHaveBeenCalled();
    expect(result.current.applyingTemplate).toBe(false);
  });

  it('FE-PACK-TEMPL-005: saving needs a name, then saves it trimmed, clears it and reloads the list', async () => {
    const list = vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [BEACH] });
    const save = vi.spyOn(packingApi, 'saveAsTemplate').mockResolvedValue({ ok: true });
    const { result, toast, onSaved } = setup();
    await waitFor(() => expect(result.current.templates).toEqual([BEACH]));

    act(() => result.current.setSaveTemplateName('   '));
    await act(async () => {
      await result.current.saveAsTemplate();
    });
    expect(save).not.toHaveBeenCalled();

    list.mockResolvedValue({ templates: [BEACH, SKI] });
    act(() => result.current.setSaveTemplateName('  Ski  '));
    await act(async () => {
      await result.current.saveAsTemplate();
    });
    expect(save).toHaveBeenCalledWith(7, 'Ski');
    expect(toast.success).toHaveBeenCalledWith('packing.templateSaved');
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.saveTemplateName).toBe('');
    await waitFor(() => expect(result.current.templates).toEqual([BEACH, SKI]));
  });

  it('FE-PACK-TEMPL-006: a failed save is reported and keeps the name typed', async () => {
    vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [] });
    vi.spyOn(packingApi, 'saveAsTemplate').mockRejectedValue(new Error('x'));
    const { result, toast, onSaved } = setup();
    act(() => result.current.setSaveTemplateName('Ski'));
    await act(async () => {
      await result.current.saveAsTemplate();
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.saveTemplateName).toBe('Ski');
  });

  it('FE-PACK-TEMPL-007: a list that fails to reload after a save keeps the templates it had', async () => {
    const list = vi.spyOn(packingApi, 'listTemplates').mockResolvedValue({ templates: [BEACH] });
    vi.spyOn(packingApi, 'saveAsTemplate').mockResolvedValue({ ok: true });
    const { result, toast } = setup();
    await waitFor(() => expect(result.current.templates).toEqual([BEACH]));
    list.mockRejectedValue(new Error('offline'));
    act(() => result.current.setSaveTemplateName('Ski'));
    await act(async () => {
      await result.current.saveAsTemplate();
    });
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(result.current.templates).toEqual([BEACH]);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
