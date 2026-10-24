import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { adminApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';

interface TemplateCategory {
  id: number;
  template_id: number;
  name: string;
  sort_order: number;
}
export interface TemplateItem {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  weight_grams?: number | null;
  quantity?: number | null;
  bag_name?: string | null;
}
export interface Template {
  id: number;
  name: string;
  item_count: number;
  category_count: number;
  created_by_name: string;
}

/** What waits for the admin's answer in the shell's confirm: a whole template or a category with items. */
export type PackingDeleteTarget = { kind: 'template' | 'category'; id: number; name: string };

interface Options {
  /** The phone shell toasts the generic admin delete error for categories and items. */
  genericDeleteErrors?: boolean;
}

/**
 * The packing template editor behind both admin shells: the template list loaded on
 * mount, one expanded template with its categories and items, and the create, rename and
 * delete writes for all three levels. The desktop and phone shells render their own
 * markup over it.
 */
export function usePackingTemplateAdmin({ genericDeleteErrors = false }: Options = {}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');

  // Expanded template state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [items, setItems] = useState<TemplateItem[]>([]);

  // Editing states
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');

  // Adding states
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingItemToCatId, setAddingItemToCatId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const addItemRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const { t } = useTranslation();

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.packingTemplates();
      setTemplates(data.templates || []);
    } catch {
      toast.error(t('admin.packingTemplates.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnMount = useEffectEvent(() => {
    void loadTemplates();
  });
  useEffect(() => {
    loadOnMount();
  }, []);

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setAddingCategory(false);
    setAddingItemToCatId(null);
    try {
      const data = await adminApi.getPackingTemplate(id);
      setCategories(data.categories || []);
      setItems(data.items || []);
    } catch {
      toast.error(t('admin.packingTemplates.loadError'));
    }
  };

  // Template CRUD
  const handleCreateTemplate = async () => {
    if (!createName.trim()) return;
    try {
      const data = await adminApi.createPackingTemplate({ name: createName.trim() });
      setTemplates((prev) => [{ ...data.template, item_count: 0, category_count: 0 }, ...prev]);
      setCreateName('');
      setShowCreate(false);
      setExpandedId(data.template.id);
      setCategories([]);
      setItems([]);
      toast.success(t('admin.packingTemplates.created'));
    } catch {
      toast.error(t('admin.packingTemplates.createError'));
    }
  };

  // A template takes every category and item with it and a category its items, so both ask
  // first; an empty category and a single item go at once, as in the packing list.
  const [deleteTarget, setDeleteTarget] = useState<PackingDeleteTarget | null>(null);

  const requestDeleteTemplate = (id: number) => {
    const tpl = templates.find((tp) => tp.id === id);
    if (tpl) setDeleteTarget({ kind: 'template', id, name: tpl.name });
  };

  const requestDeleteCategory = (catId: number) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    if (!items.some((i) => i.category_id === catId)) {
      void handleDeleteCategory(catId);
      return;
    }
    setDeleteTarget({ kind: 'category', id: catId, name: cat.name });
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    if (target.kind === 'template') await handleDeleteTemplate(target.id);
    else await handleDeleteCategory(target.id);
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await adminApi.deletePackingTemplate(id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      if (expandedId === id) setExpandedId(null);
      toast.success(t('admin.packingTemplates.deleted'));
    } catch {
      toast.error(t('admin.packingTemplates.deleteError'));
    }
  };

  const handleRenameTemplate = async (id: number) => {
    if (!editTemplateName.trim()) {
      setEditingTemplate(null);
      return;
    }
    try {
      await adminApi.updatePackingTemplate(id, { name: editTemplateName.trim() });
      setTemplates((prev) => prev.map((tpl) => (tpl.id === id ? { ...tpl, name: editTemplateName.trim() } : tpl)));
      setEditingTemplate(null);
    } catch {
      toast.error(t('admin.packingTemplates.saveError'));
    }
  };

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCatName.trim() || !expandedId) return;
    try {
      const data = await adminApi.addTemplateCategory(expandedId, { name: newCatName.trim() });
      setCategories((prev) => [...prev, data.category]);
      setNewCatName('');
      setAddingCategory(false);
    } catch {
      toast.error(t('admin.packingTemplates.saveError'));
    }
  };

  const handleRenameCategory = async (catId: number) => {
    if (!editCatName.trim() || !expandedId) {
      setEditingCatId(null);
      return;
    }
    try {
      await adminApi.updateTemplateCategory(expandedId, catId, { name: editCatName.trim() });
      setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, name: editCatName.trim() } : c)));
      setEditingCatId(null);
    } catch {
      toast.error(t('admin.packingTemplates.saveError'));
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!expandedId) return;
    try {
      await adminApi.deleteTemplateCategory(expandedId, catId);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setItems((prev) => prev.filter((i) => i.category_id !== catId));
    } catch {
      toast.error(t(genericDeleteErrors ? 'admin.toast.deleteError' : 'admin.packingTemplates.deleteCategoryError'));
    }
  };

  // Item CRUD
  const handleAddItem = async (catId: number) => {
    // Both shells only call this with a name (the button and the Enter handler check it).
    if (!newItemName.trim() || !expandedId) return;
    try {
      const data = await adminApi.addTemplateItem(expandedId, catId, { name: newItemName.trim() });
      setItems((prev) => [...prev, data.item]);
      setNewItemName('');
      setTimeout(() => addItemRef.current?.focus(), 30);
    } catch {
      toast.error(t('admin.packingTemplates.saveError'));
    }
  };

  const handleRenameItem = async (itemId: number) => {
    if (!editItemName.trim() || !expandedId) {
      setEditingItemId(null);
      return;
    }
    try {
      await adminApi.updateTemplateItem(expandedId, itemId, { name: editItemName.trim() });
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, name: editItemName.trim() } : i)));
      setEditingItemId(null);
    } catch {
      toast.error(t('admin.packingTemplates.saveError'));
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!expandedId) return;
    try {
      await adminApi.deleteTemplateItem(expandedId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      toast.error(t(genericDeleteErrors ? 'admin.toast.deleteError' : 'admin.packingTemplates.deleteItemError'));
    }
  };

  return {
    templates,
    isLoading,
    showCreate,
    setShowCreate,
    createName,
    setCreateName,
    expandedId,
    categories,
    items,
    editingTemplate,
    setEditingTemplate,
    editTemplateName,
    setEditTemplateName,
    editingCatId,
    setEditingCatId,
    editCatName,
    setEditCatName,
    editingItemId,
    setEditingItemId,
    editItemName,
    setEditItemName,
    addingCategory,
    setAddingCategory,
    newCatName,
    setNewCatName,
    addingItemToCatId,
    setAddingItemToCatId,
    newItemName,
    setNewItemName,
    addItemRef,
    toggleExpand,
    handleCreateTemplate,
    handleDeleteTemplate,
    deleteTarget,
    setDeleteTarget,
    requestDeleteTemplate,
    requestDeleteCategory,
    confirmDelete,
    handleRenameTemplate,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleAddItem,
    handleRenameItem,
    handleDeleteItem,
  };
}
