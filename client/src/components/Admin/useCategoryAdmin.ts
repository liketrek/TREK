import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { categoriesApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { type Category, getApiErrorMessage } from '../../types';
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons';
import { useToast } from '../shared/Toast';

export const PRESET_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#84cc16',
  '#6b7280',
  '#1f2937',
];

// The colour a new category is stored with: data the server keeps, not a theme colour.
export const DEFAULT_COLOR = '#6366f1'; // theme-lint-disable: a stored category colour, not styling

export const ICON_NAMES = Object.keys(CATEGORY_ICON_MAP);

interface CategoryForm {
  name: string;
  color: string;
  icon: string;
}

interface Options {
  /**
   * The phone sheet stays open while the delete runs (busy spinner) and closes itself
   * once it succeeded; the desktop dialog closes on confirm and tracks nothing.
   */
  trackDelete?: boolean;
}

/**
 * The place categories editor behind both admin shells: the list loaded on mount, one
 * form shared by create and edit, and the delete waiting for its confirmation. The
 * desktop dialog and the phone inline form render their own markup over it.
 */
export function useCategoryAdmin({ trackDelete = false }: Options = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // The category whose delete waits for the answer in the confirm dialog.
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { t } = useTranslation();

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.list();
      setCategories(data.categories || []);
    } catch {
      toast.error(t('categories.toast.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnMount = useEffectEvent(() => {
    void loadCategories();
  });
  useEffect(() => {
    loadOnMount();
  }, []);

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, color: cat.color || DEFAULT_COLOR, icon: cat.icon || 'MapPin' });
    setShowForm(false);
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setForm({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  // The Save button carries disabled={… || !form.name.trim()}, so the name is set here.
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        const result = await categoriesApi.update(editingId, form);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? result.category : c)));
        setEditingId(null);
        toast.success(t('categories.toast.updated'));
      } else {
        const result = await categoriesApi.create(form);
        setCategories((prev) => [...prev, result.category]);
        setShowForm(false);
        toast.success(t('categories.toast.created'));
      }
      setForm({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('categories.toast.saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (trackDelete) setIsDeleting(true);
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success(t('categories.toast.deleted'));
      if (trackDelete) setDeleteId(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('categories.toast.deleteError')));
    } finally {
      if (trackDelete) setIsDeleting(false);
    }
  };

  return {
    categories,
    showForm,
    editingId,
    form,
    setForm,
    isSaving,
    isLoading,
    deleteId,
    setDeleteId,
    isDeleting,
    colorInputRef,
    handleStartEdit,
    handleStartCreate,
    handleCancel,
    handleSave,
    handleDelete,
    isPresetColor: PRESET_COLORS.includes(form.color),
  };
}
