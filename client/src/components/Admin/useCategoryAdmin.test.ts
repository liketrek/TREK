import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { categoriesApi } from '../../api/client';
import { DEFAULT_COLOR, useCategoryAdmin } from './useCategoryAdmin';

// FE-HOOK-CATADMIN-001 to FE-HOOK-CATADMIN-010

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const BEACH = { id: 1, name: 'Beach', color: '#10b981', icon: 'Umbrella' };
const MUSEUM = { id: 2, name: 'Museum', color: '', icon: '' };

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(categoriesApi, 'list').mockResolvedValue({ categories: [BEACH, MUSEUM] });
  vi.spyOn(categoriesApi, 'create').mockResolvedValue({
    category: { id: 3, name: 'Bar', color: '#ef4444', icon: 'Wine' },
  });
  vi.spyOn(categoriesApi, 'update').mockResolvedValue({ category: { ...BEACH, name: 'Shore' } });
  vi.spyOn(categoriesApi, 'delete').mockResolvedValue({ success: true });
});
afterEach(() => vi.restoreAllMocks());

async function loaded(trackDelete?: boolean) {
  const hook = renderHook(() => useCategoryAdmin(trackDelete === undefined ? undefined : { trackDelete }));
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('useCategoryAdmin', () => {
  it('FE-HOOK-CATADMIN-001: loads the categories once on mount', async () => {
    const { result, rerender } = await loaded();
    rerender();
    expect(categoriesApi.list).toHaveBeenCalledTimes(1);
    expect(result.current.categories.map((c) => c.id)).toEqual([1, 2]);
  });

  it('FE-HOOK-CATADMIN-002: a failed load toasts the load error and leaves the list empty', async () => {
    vi.mocked(categoriesApi.list).mockRejectedValue(new Error('down'));
    const { result } = await loaded();
    expect(toast.error).toHaveBeenCalledWith('categories.toast.loadError');
    expect(result.current.categories).toEqual([]);
  });

  it('FE-HOOK-CATADMIN-003: start edit fills the form, falling back to the default colour and icon', async () => {
    const { result } = await loaded();
    act(() => result.current.handleStartEdit(MUSEUM));
    expect(result.current.editingId).toBe(2);
    expect(result.current.showForm).toBe(false);
    expect(result.current.form).toEqual({ name: 'Museum', color: DEFAULT_COLOR, icon: 'MapPin' });
    expect(result.current.isPresetColor).toBe(true);
  });

  it('FE-HOOK-CATADMIN-004: start create opens an empty form; cancel closes create and edit', async () => {
    const { result } = await loaded();
    act(() => result.current.handleStartEdit(BEACH));
    act(() => result.current.handleStartCreate());
    expect(result.current.editingId).toBeNull();
    expect(result.current.showForm).toBe(true);
    expect(result.current.form).toEqual({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' });
    act(() => result.current.handleCancel());
    expect(result.current.showForm).toBe(false);
    expect(result.current.editingId).toBeNull();
  });

  it('FE-HOOK-CATADMIN-005: saving a new category appends it, closes the form and resets it', async () => {
    const { result } = await loaded();
    act(() => result.current.handleStartCreate());
    act(() => result.current.setForm({ name: 'Bar', color: '#123456', icon: 'Wine' }));
    expect(result.current.isPresetColor).toBe(false);
    await act(() => result.current.handleSave());
    expect(categoriesApi.create).toHaveBeenCalledWith({ name: 'Bar', color: '#123456', icon: 'Wine' });
    expect(result.current.categories.map((c) => c.id)).toEqual([1, 2, 3]);
    expect(result.current.showForm).toBe(false);
    expect(result.current.form).toEqual({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' });
    expect(toast.success).toHaveBeenCalledWith('categories.toast.created');
  });

  it('FE-HOOK-CATADMIN-006: saving an edit replaces the row in place and leaves edit mode', async () => {
    const { result } = await loaded();
    act(() => result.current.handleStartEdit(BEACH));
    await act(() => result.current.handleSave());
    expect(categoriesApi.update).toHaveBeenCalledWith(1, { name: 'Beach', color: '#10b981', icon: 'Umbrella' });
    expect(result.current.categories[0].name).toBe('Shore');
    expect(result.current.editingId).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('categories.toast.updated');
  });

  it('FE-HOOK-CATADMIN-007: a failed save toasts the server message and keeps the form', async () => {
    vi.mocked(categoriesApi.create).mockRejectedValue({ response: { data: { error: 'Name taken' } } });
    const { result } = await loaded();
    act(() => result.current.handleStartCreate());
    act(() => result.current.setForm({ name: 'Bar', color: DEFAULT_COLOR, icon: 'MapPin' }));
    await act(() => result.current.handleSave());
    expect(toast.error).toHaveBeenCalledWith('Name taken');
    expect(result.current.showForm).toBe(true);
    expect(result.current.form.name).toBe('Bar');
    expect(result.current.isSaving).toBe(false);
  });

  it('FE-HOOK-CATADMIN-008: the desktop delete removes the row and leaves the pending id to the dialog', async () => {
    const { result } = await loaded();
    act(() => result.current.setDeleteId(1));
    await act(() => result.current.handleDelete(1));
    expect(result.current.categories.map((c) => c.id)).toEqual([2]);
    expect(toast.success).toHaveBeenCalledWith('categories.toast.deleted');
    expect(result.current.deleteId).toBe(1);
    expect(result.current.isDeleting).toBe(false);
  });

  it('FE-HOOK-CATADMIN-009: the phone delete shows busy while it runs and clears the pending id after', async () => {
    let finish!: (v: unknown) => void;
    vi.mocked(categoriesApi.delete).mockReturnValue(new Promise((r) => (finish = r)));
    const { result } = await loaded(true);
    act(() => result.current.setDeleteId(1));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleDelete(1);
    });
    expect(result.current.isDeleting).toBe(true);
    await act(async () => {
      finish({ success: true });
      await pending;
    });
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.deleteId).toBeNull();
  });

  it('FE-HOOK-CATADMIN-010: a failed phone delete keeps the row and the pending id', async () => {
    vi.mocked(categoriesApi.delete).mockRejectedValue({ response: { data: { error: 'In use' } } });
    const { result } = await loaded(true);
    act(() => result.current.setDeleteId(1));
    await act(() => result.current.handleDelete(1));
    expect(toast.error).toHaveBeenCalledWith('In use');
    expect(result.current.categories.map((c) => c.id)).toEqual([1, 2]);
    expect(result.current.deleteId).toBe(1);
    expect(result.current.isDeleting).toBe(false);
  });
});
