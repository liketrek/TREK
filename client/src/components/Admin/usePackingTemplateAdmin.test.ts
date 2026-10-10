import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../api/client';
import { usePackingTemplateAdmin } from './usePackingTemplateAdmin';

// FE-HOOK-PACKTPL-001 to FE-HOOK-PACKTPL-014

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const TPL = { id: 1, name: 'Beach', item_count: 2, category_count: 1, created_by_name: 'admin' };
const CAT = { id: 10, template_id: 1, name: 'Clothes', sort_order: 0 };
const ITEM = { id: 100, category_id: 10, name: 'Shirt', sort_order: 0 };

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(adminApi, 'packingTemplates').mockResolvedValue({ templates: [TPL] });
  vi.spyOn(adminApi, 'getPackingTemplate').mockResolvedValue({ categories: [CAT], items: [ITEM] });
  vi.spyOn(adminApi, 'createPackingTemplate').mockResolvedValue({ template: { ...TPL, id: 2, name: 'Ski' } });
  vi.spyOn(adminApi, 'updatePackingTemplate').mockResolvedValue({});
  vi.spyOn(adminApi, 'deletePackingTemplate').mockResolvedValue({});
  vi.spyOn(adminApi, 'addTemplateCategory').mockResolvedValue({ category: { ...CAT, id: 11, name: 'Toys' } });
  vi.spyOn(adminApi, 'updateTemplateCategory').mockResolvedValue({});
  vi.spyOn(adminApi, 'deleteTemplateCategory').mockResolvedValue({});
  vi.spyOn(adminApi, 'addTemplateItem').mockResolvedValue({ item: { ...ITEM, id: 101, name: 'Hat' } });
  vi.spyOn(adminApi, 'updateTemplateItem').mockResolvedValue({});
  vi.spyOn(adminApi, 'deleteTemplateItem').mockResolvedValue({});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function expanded(genericDeleteErrors?: boolean) {
  const hook = renderHook(() =>
    usePackingTemplateAdmin(genericDeleteErrors === undefined ? undefined : { genericDeleteErrors })
  );
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  await act(() => hook.result.current.toggleExpand(1));
  return hook;
}

describe('usePackingTemplateAdmin', () => {
  it('FE-HOOK-PACKTPL-001: loads the templates once on mount; a failure toasts the load error', async () => {
    const { result, rerender } = renderHook(() => usePackingTemplateAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender();
    expect(adminApi.packingTemplates).toHaveBeenCalledTimes(1);
    expect(result.current.templates).toEqual([TPL]);

    vi.mocked(adminApi.packingTemplates).mockRejectedValue(new Error('down'));
    const failed = renderHook(() => usePackingTemplateAdmin());
    await waitFor(() => expect(failed.result.current.isLoading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('admin.packingTemplates.loadError');
  });

  it('FE-HOOK-PACKTPL-002: expanding loads the template and closes the add composers; again collapses', async () => {
    const { result } = await expanded();
    expect(adminApi.getPackingTemplate).toHaveBeenCalledWith(1);
    expect(result.current.expandedId).toBe(1);
    expect(result.current.categories).toEqual([CAT]);
    expect(result.current.items).toEqual([ITEM]);
    act(() => {
      result.current.setAddingCategory(true);
      result.current.setAddingItemToCatId(10);
    });
    await act(() => result.current.toggleExpand(1));
    expect(result.current.expandedId).toBeNull();
    expect(adminApi.getPackingTemplate).toHaveBeenCalledTimes(1);
    await act(() => result.current.toggleExpand(1));
    expect(result.current.addingCategory).toBe(false);
    expect(result.current.addingItemToCatId).toBeNull();
  });

  it('FE-HOOK-PACKTPL-003: creating a template prepends it, expands it empty and closes the composer', async () => {
    const { result } = await expanded();
    act(() => {
      result.current.setShowCreate(true);
      result.current.setCreateName('  Ski  ');
    });
    await act(() => result.current.handleCreateTemplate());
    expect(adminApi.createPackingTemplate).toHaveBeenCalledWith({ name: 'Ski' });
    expect(result.current.templates.map((x) => [x.id, x.item_count, x.category_count])).toEqual([
      [2, 0, 0],
      [1, 2, 1],
    ]);
    expect(result.current.expandedId).toBe(2);
    expect(result.current.categories).toEqual([]);
    expect(result.current.items).toEqual([]);
    expect(result.current.showCreate).toBe(false);
    expect(result.current.createName).toBe('');
    expect(toast.success).toHaveBeenCalledWith('admin.packingTemplates.created');
  });

  it('FE-HOOK-PACKTPL-004: a blank template name creates nothing; a failed create toasts', async () => {
    const { result } = await expanded();
    act(() => result.current.setCreateName('   '));
    await act(() => result.current.handleCreateTemplate());
    expect(adminApi.createPackingTemplate).not.toHaveBeenCalled();
    vi.mocked(adminApi.createPackingTemplate).mockRejectedValue(new Error('x'));
    act(() => result.current.setCreateName('Ski'));
    await act(() => result.current.handleCreateTemplate());
    expect(toast.error).toHaveBeenCalledWith('admin.packingTemplates.createError');
  });

  it('FE-HOOK-PACKTPL-005: deleting the expanded template drops it and collapses', async () => {
    const { result } = await expanded();
    await act(() => result.current.handleDeleteTemplate(1));
    expect(result.current.templates).toEqual([]);
    expect(result.current.expandedId).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('admin.packingTemplates.deleted');
    vi.mocked(adminApi.deletePackingTemplate).mockRejectedValue(new Error('x'));
    await act(() => result.current.handleDeleteTemplate(1));
    expect(toast.error).toHaveBeenCalledWith('admin.packingTemplates.deleteError');
  });

  it('FE-HOOK-PACKTPL-006: renaming a template trims the name; a blank name only leaves edit mode', async () => {
    const { result } = await expanded();
    act(() => {
      result.current.setEditingTemplate(1);
      result.current.setEditTemplateName('   ');
    });
    await act(() => result.current.handleRenameTemplate(1));
    expect(adminApi.updatePackingTemplate).not.toHaveBeenCalled();
    expect(result.current.editingTemplate).toBeNull();
    act(() => {
      result.current.setEditingTemplate(1);
      result.current.setEditTemplateName(' Sea ');
    });
    await act(() => result.current.handleRenameTemplate(1));
    expect(adminApi.updatePackingTemplate).toHaveBeenCalledWith(1, { name: 'Sea' });
    expect(result.current.templates[0].name).toBe('Sea');
    expect(result.current.editingTemplate).toBeNull();
  });

  it('FE-HOOK-PACKTPL-007: a failed template rename toasts and stays in edit mode', async () => {
    vi.mocked(adminApi.updatePackingTemplate).mockRejectedValue(new Error('x'));
    const { result } = await expanded();
    act(() => {
      result.current.setEditingTemplate(1);
      result.current.setEditTemplateName('Sea');
    });
    await act(() => result.current.handleRenameTemplate(1));
    expect(toast.error).toHaveBeenCalledWith('admin.packingTemplates.saveError');
    expect(result.current.editingTemplate).toBe(1);
  });

  it('FE-HOOK-PACKTPL-008: adding a category appends it and closes the composer', async () => {
    const { result } = await expanded();
    act(() => {
      result.current.setAddingCategory(true);
      result.current.setNewCatName(' Toys ');
    });
    await act(() => result.current.handleAddCategory());
    expect(adminApi.addTemplateCategory).toHaveBeenCalledWith(1, { name: 'Toys' });
    expect(result.current.categories.map((c) => c.id)).toEqual([10, 11]);
    expect(result.current.addingCategory).toBe(false);
    expect(result.current.newCatName).toBe('');
  });

  it('FE-HOOK-PACKTPL-009: renaming a category trims it; a blank name only leaves edit mode', async () => {
    const { result } = await expanded();
    act(() => {
      result.current.setEditingCatId(10);
      result.current.setEditCatName('');
    });
    await act(() => result.current.handleRenameCategory(10));
    expect(adminApi.updateTemplateCategory).not.toHaveBeenCalled();
    expect(result.current.editingCatId).toBeNull();
    act(() => result.current.setEditCatName(' Wear '));
    await act(() => result.current.handleRenameCategory(10));
    expect(adminApi.updateTemplateCategory).toHaveBeenCalledWith(1, 10, { name: 'Wear' });
    expect(result.current.categories[0].name).toBe('Wear');
  });

  it('FE-HOOK-PACKTPL-010: deleting a category drops its items too', async () => {
    const { result } = await expanded();
    await act(() => result.current.handleDeleteCategory(10));
    expect(adminApi.deleteTemplateCategory).toHaveBeenCalledWith(1, 10);
    expect(result.current.categories).toEqual([]);
    expect(result.current.items).toEqual([]);
  });

  it('FE-HOOK-PACKTPL-011: delete errors are specific on desktop and generic on the phone', async () => {
    vi.mocked(adminApi.deleteTemplateCategory).mockRejectedValue(new Error('x'));
    vi.mocked(adminApi.deleteTemplateItem).mockRejectedValue(new Error('x'));
    const desktop = await expanded();
    await act(() => desktop.result.current.handleDeleteCategory(10));
    await act(() => desktop.result.current.handleDeleteItem(100));
    expect(toast.error.mock.calls.map((c) => c[0])).toEqual([
      'admin.packingTemplates.deleteCategoryError',
      'admin.packingTemplates.deleteItemError',
    ]);
    toast.error.mockReset();
    const phone = await expanded(true);
    await act(() => phone.result.current.handleDeleteCategory(10));
    await act(() => phone.result.current.handleDeleteItem(100));
    expect(toast.error.mock.calls.map((c) => c[0])).toEqual(['admin.toast.deleteError', 'admin.toast.deleteError']);
    expect(phone.result.current.items).toEqual([ITEM]);
  });

  it('FE-HOOK-PACKTPL-012: adding an item appends it, clears the field and refocuses it', async () => {
    const { result } = await expanded();
    const input = document.createElement('input');
    document.body.appendChild(input);
    result.current.addItemRef.current = input;
    vi.useFakeTimers();
    act(() => result.current.setNewItemName(' Hat '));
    await act(() => result.current.handleAddItem(10));
    expect(adminApi.addTemplateItem).toHaveBeenCalledWith(1, 10, { name: 'Hat' });
    expect(result.current.items.map((i) => i.id)).toEqual([100, 101]);
    expect(result.current.newItemName).toBe('');
    act(() => vi.advanceTimersByTime(30));
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('FE-HOOK-PACKTPL-013: a blank item name adds nothing', async () => {
    const { result } = await expanded();
    act(() => result.current.setNewItemName('  '));
    await act(() => result.current.handleAddItem(10));
    expect(adminApi.addTemplateItem).not.toHaveBeenCalled();
  });

  it('FE-HOOK-PACKTPL-014: renaming and deleting an item update the list', async () => {
    const { result } = await expanded();
    act(() => {
      result.current.setEditingItemId(100);
      result.current.setEditItemName(' Tee ');
    });
    await act(() => result.current.handleRenameItem(100));
    expect(adminApi.updateTemplateItem).toHaveBeenCalledWith(1, 100, { name: 'Tee' });
    expect(result.current.items[0].name).toBe('Tee');
    expect(result.current.editingItemId).toBeNull();
    await act(() => result.current.handleDeleteItem(100));
    expect(adminApi.deleteTemplateItem).toHaveBeenCalledWith(1, 100);
    expect(result.current.items).toEqual([]);
  });
});
