import { useState, useEffect, useRef, ReactNode } from 'react'
import { adminApi } from '../../../api/client'
import { useToast } from '../../../components/shared/Toast'
import { useTranslation } from '../../../i18n'
import { Plus, Trash2, Edit2, Package, X, Check, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react'
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminInput } from './MAdminUi'

interface TemplateCategory { id: number; template_id: number; name: string; sort_order: number }
interface TemplateItem { id: number; category_id: number; name: string; sort_order: number }
interface Template { id: number; name: string; item_count: number; category_count: number; created_by_name: string }

// Small round icon action button in the mobile admin idiom (flat --m-ic circle).
function PkIconBtn({
  onClick,
  ariaLabel,
  variant = 'neutral',
  size = 32,
  disabled = false,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  variant?: 'neutral' | 'danger' | 'accent'
  size?: number
  disabled?: boolean
  children: ReactNode
}) {
  const look =
    variant === 'accent'
      ? 'bg-m-act text-m-actfg'
      : variant === 'danger'
        ? 'bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)]'
        : 'bg-[color:var(--m-ic)] text-m-muted'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`flex flex-none items-center justify-center rounded-full disabled:opacity-40 ${look}`}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  )
}

// Compact inline field matching MAdminInput, used where a native ref is needed
// (the add-item input focuses itself after each add).
const inlineFieldCls =
  'h-[38px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)]'

/**
 * Mobile-native re-skin of the admin Packing Template Manager: create/rename/
 * delete templates, expand a template to manage its categories and items. All
 * state, effects and adminApi mutations are preserved from the desktop version.
 */
export default function MAdminPackingTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')

  // Expanded template state
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [items, setItems] = useState<TemplateItem[]>([])

  // Editing states
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null)
  const [editTemplateName, setEditTemplateName] = useState('')
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editItemName, setEditItemName] = useState('')

  // Adding states
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addingItemToCatId, setAddingItemToCatId] = useState<number | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const addItemRef = useRef<HTMLInputElement>(null)

  const toast = useToast()
  const { t } = useTranslation()

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.packingTemplates()
      setTemplates(data.templates || [])
    } catch { toast.error(t('admin.packingTemplates.loadError')) }
    finally { setIsLoading(false) }
  }

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setAddingCategory(false)
    setAddingItemToCatId(null)
    try {
      const data = await adminApi.getPackingTemplate(id)
      setCategories(data.categories || [])
      setItems(data.items || [])
    } catch { toast.error(t('admin.packingTemplates.loadError')) }
  }

  // Template CRUD
  const handleCreateTemplate = async () => {
    if (!createName.trim()) return
    try {
      const data = await adminApi.createPackingTemplate({ name: createName.trim() })
      setTemplates(prev => [{ ...data.template, item_count: 0, category_count: 0 }, ...prev])
      setCreateName(''); setShowCreate(false)
      setExpandedId(data.template.id); setCategories([]); setItems([])
      toast.success(t('admin.packingTemplates.created'))
    } catch { toast.error(t('admin.packingTemplates.createError')) }
  }

  const handleDeleteTemplate = async (id: number) => {
    try {
      await adminApi.deletePackingTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success(t('admin.packingTemplates.deleted'))
    } catch { toast.error(t('admin.packingTemplates.deleteError')) }
  }

  const handleRenameTemplate = async (id: number) => {
    if (!editTemplateName.trim()) { setEditingTemplate(null); return }
    try {
      await adminApi.updatePackingTemplate(id, { name: editTemplateName.trim() })
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, name: editTemplateName.trim() } : t))
      setEditingTemplate(null)
    } catch { toast.error(t('admin.packingTemplates.saveError')) }
  }

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCatName.trim() || !expandedId) return
    try {
      const data = await adminApi.addTemplateCategory(expandedId, { name: newCatName.trim() })
      setCategories(prev => [...prev, data.category])
      setNewCatName(''); setAddingCategory(false)
    } catch { toast.error(t('admin.packingTemplates.saveError')) }
  }

  const handleRenameCategory = async (catId: number) => {
    if (!editCatName.trim() || !expandedId) { setEditingCatId(null); return }
    try {
      await adminApi.updateTemplateCategory(expandedId, catId, { name: editCatName.trim() })
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: editCatName.trim() } : c))
      setEditingCatId(null)
    } catch { toast.error(t('admin.packingTemplates.saveError')) }
  }

  const handleDeleteCategory = async (catId: number) => {
    if (!expandedId) return
    try {
      await adminApi.deleteTemplateCategory(expandedId, catId)
      setCategories(prev => prev.filter(c => c.id !== catId))
      setItems(prev => prev.filter(i => i.category_id !== catId))
    } catch { toast.error(t('admin.packingTemplates.deleteError')) }
  }

  // Item CRUD
  const handleAddItem = async (catId: number) => {
    if (!newItemName.trim() || !expandedId) return
    try {
      const data = await adminApi.addTemplateItem(expandedId, catId, { name: newItemName.trim() })
      setItems(prev => [...prev, data.item])
      setNewItemName('')
      setTimeout(() => addItemRef.current?.focus(), 30)
    } catch { toast.error(t('admin.packingTemplates.saveError')) }
  }

  const handleRenameItem = async (itemId: number) => {
    if (!editItemName.trim() || !expandedId) { setEditingItemId(null); return }
    try {
      await adminApi.updateTemplateItem(expandedId, itemId, { name: editItemName.trim() })
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, name: editItemName.trim() } : i))
      setEditingItemId(null)
    } catch { toast.error(t('admin.packingTemplates.saveError')) }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!expandedId) return
    try {
      await adminApi.deleteTemplateItem(expandedId, itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch { toast.error(t('admin.packingTemplates.deleteError')) }
  }

  return (
    <MAdminCard>
      {/* Header */}
      <MAdminCardHead
        title={t('admin.packingTemplates.title')}
        hint={t('admin.packingTemplates.subtitle')}
        trailing={
          <MAdminButton onClick={() => setShowCreate(true)}>
            <Plus size={13} strokeWidth={2.4} />
            {t('admin.packingTemplates.create')}
          </MAdminButton>
        }
      />

      {/* Create template */}
      {showCreate && (
        <div className="mt-2 flex items-center gap-2">
          <Package size={16} className="flex-none text-m-faint" />
          <div className="min-w-0 flex-1">
            <MAdminInput
              autoFocus
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateTemplate(); if (e.key === 'Escape') setShowCreate(false) }}
              placeholder={t('admin.packingTemplates.namePlaceholder')}
            />
          </div>
          <PkIconBtn ariaLabel={t('common.save')} variant="accent" onClick={handleCreateTemplate}><Check size={15} /></PkIconBtn>
          <PkIconBtn ariaLabel={t('common.cancel')} onClick={() => setShowCreate(false)}><X size={15} /></PkIconBtn>
        </div>
      )}

      {/* Template list */}
      {isLoading ? (
        <div className="py-8 text-center">
          <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-[color:var(--m-ink)]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-8 text-center font-geist text-[0.75rem] text-m-faint">{t('admin.packingTemplates.empty')}</div>
      ) : (
        <div className="mt-1">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="border-t border-[color:var(--m-rowbr)] first:border-t-0">
              {/* Template row */}
              <div className="flex items-center gap-2 py-[11px]">
                <button
                  type="button"
                  aria-label={expandedId === tmpl.id ? t('common.collapse') : t('common.expand')}
                  onClick={() => toggleExpand(tmpl.id)}
                  className="flex-none text-m-faint"
                >
                  {expandedId === tmpl.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <Package size={16} className="flex-none text-m-faint" />
                {editingTemplate === tmpl.id ? (
                  <div className="min-w-0 flex-1">
                    <MAdminInput
                      autoFocus
                      value={editTemplateName}
                      onChange={e => setEditTemplateName(e.target.value)}
                      onBlur={() => handleRenameTemplate(tmpl.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameTemplate(tmpl.id); if (e.key === 'Escape') setEditingTemplate(null) }}
                    />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1" onClick={() => toggleExpand(tmpl.id)}>
                    <div className="truncate text-[0.8125rem] font-bold text-m-ink">{tmpl.name}</div>
                    <div className="mt-[1px] font-geist text-[0.59375rem] text-m-faint">
                      {tmpl.category_count} {t('admin.packingTemplates.categories')} · {tmpl.item_count} {t('admin.packingTemplates.items')}
                    </div>
                  </div>
                )}
                <PkIconBtn
                  ariaLabel={t('common.edit')}
                  onClick={() => { setEditingTemplate(tmpl.id); setEditTemplateName(tmpl.name) }}
                ><Edit2 size={14} /></PkIconBtn>
                <PkIconBtn
                  ariaLabel={t('common.delete')}
                  variant="danger"
                  onClick={() => handleDeleteTemplate(tmpl.id)}
                ><Trash2 size={14} /></PkIconBtn>
              </div>

              {/* Expanded content */}
              {expandedId === tmpl.id && (
                <div className="space-y-2 pb-3 pl-6">
                  {categories.map(cat => {
                    const catItems = items.filter(i => i.category_id === cat.id)
                    return (
                      <div key={cat.id} className="overflow-hidden rounded-xl border border-[color:var(--m-rowbr)]">
                        {/* Category header */}
                        <div className="flex items-center gap-1.5 bg-[color:var(--m-ic)] px-3 py-2">
                          {editingCatId === cat.id ? (
                            <div className="min-w-0 flex-1">
                              <MAdminInput
                                autoFocus
                                value={editCatName}
                                onChange={e => setEditCatName(e.target.value)}
                                onBlur={() => handleRenameCategory(cat.id)}
                                onKeyDown={e => { if (e.key === 'Enter') handleRenameCategory(cat.id); if (e.key === 'Escape') setEditingCatId(null) }}
                              />
                            </div>
                          ) : (
                            <span className="min-w-0 flex-1 truncate font-geist text-[0.625rem] font-bold uppercase tracking-wider text-m-muted">{cat.name}</span>
                          )}
                          <span className="flex-none font-geist text-[0.625rem] text-m-faint">{catItems.length}</span>
                          <PkIconBtn
                            size={28}
                            ariaLabel={t('admin.packingTemplates.itemName')}
                            onClick={() => { setAddingItemToCatId(addingItemToCatId === cat.id ? null : cat.id); setNewItemName(''); setTimeout(() => addItemRef.current?.focus(), 30) }}
                          ><Plus size={14} /></PkIconBtn>
                          <PkIconBtn
                            size={28}
                            ariaLabel={t('common.edit')}
                            onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name) }}
                          ><Edit2 size={13} /></PkIconBtn>
                          <PkIconBtn
                            size={28}
                            variant="danger"
                            ariaLabel={t('common.delete')}
                            onClick={() => handleDeleteCategory(cat.id)}
                          ><Trash2 size={13} /></PkIconBtn>
                        </div>

                        {/* Items */}
                        {(catItems.length > 0 || addingItemToCatId === cat.id) && (
                          <div className="divide-y divide-[color:var(--m-rowbr)]">
                            {catItems.map(item => (
                              <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                                {editingItemId === item.id ? (
                                  <>
                                    <div className="min-w-0 flex-1">
                                      <MAdminInput
                                        autoFocus
                                        value={editItemName}
                                        onChange={e => setEditItemName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleRenameItem(item.id); if (e.key === 'Escape') setEditingItemId(null) }}
                                      />
                                    </div>
                                    <PkIconBtn size={28} variant="accent" ariaLabel={t('common.save')} onClick={() => handleRenameItem(item.id)}><Check size={13} /></PkIconBtn>
                                    <PkIconBtn size={28} ariaLabel={t('common.cancel')} onClick={() => setEditingItemId(null)}><X size={13} /></PkIconBtn>
                                  </>
                                ) : (
                                  <>
                                    <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-m-ink">{item.name}</span>
                                    <PkIconBtn
                                      size={28}
                                      ariaLabel={t('common.edit')}
                                      onClick={() => { setEditingItemId(item.id); setEditItemName(item.name) }}
                                    ><Edit2 size={12} /></PkIconBtn>
                                    <PkIconBtn
                                      size={28}
                                      variant="danger"
                                      ariaLabel={t('common.delete')}
                                      onClick={() => handleDeleteItem(item.id)}
                                    ><Trash2 size={12} /></PkIconBtn>
                                  </>
                                )}
                              </div>
                            ))}

                            {/* Add item inline */}
                            {addingItemToCatId === cat.id && (
                              <div className="flex items-center gap-2 px-3 py-2">
                                <input
                                  ref={addItemRef}
                                  value={newItemName}
                                  onChange={e => setNewItemName(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter' && newItemName.trim()) handleAddItem(cat.id); if (e.key === 'Escape') { setAddingItemToCatId(null); setNewItemName('') } }}
                                  placeholder={t('admin.packingTemplates.itemName')}
                                  className={inlineFieldCls}
                                />
                                <PkIconBtn size={28} variant="accent" disabled={!newItemName.trim()} ariaLabel={t('admin.packingTemplates.itemName')} onClick={() => handleAddItem(cat.id)}><Plus size={13} /></PkIconBtn>
                                <PkIconBtn size={28} ariaLabel={t('common.cancel')} onClick={() => { setAddingItemToCatId(null); setNewItemName('') }}><X size={13} /></PkIconBtn>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add category */}
                  {addingCategory ? (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <MAdminInput
                          autoFocus
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCatName('') } }}
                          placeholder={t('admin.packingTemplates.categoryName')}
                        />
                      </div>
                      <PkIconBtn variant="accent" ariaLabel={t('common.save')} onClick={handleAddCategory}><Check size={15} /></PkIconBtn>
                      <PkIconBtn ariaLabel={t('common.cancel')} onClick={() => { setAddingCategory(false); setNewCatName('') }}><X size={15} /></PkIconBtn>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingCategory(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--m-rowbr)] px-3 py-[10px] font-geist text-[0.75rem] font-semibold text-m-muted"
                    >
                      <FolderPlus size={14} /> {t('admin.packingTemplates.addCategory')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </MAdminCard>
  )
}
