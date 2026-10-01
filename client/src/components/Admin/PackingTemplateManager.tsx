import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { Plus, Trash2, Pencil, Package, X, Check, ChevronRight, FolderPlus, Loader2 } from 'lucide-react'
import { fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import { COMPOSER } from '../Packing/packingPopoverStyles'
import { SettingRows, SettingsCard, SettingsHint, StatusPill, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON } from '../Settings/settingsKit'

/** The planner's composer (#2541): a framed field on the card with its confirm and cancel beside it. */
const COMPOSER_ROW = 'flex items-center gap-2 rounded-[10px] border border-edge bg-surface-card py-1 pl-3 pr-1'
const COMPOSER_INPUT = 'min-w-0 flex-1 border-0 bg-transparent py-1 font-medium text-content outline-none placeholder:text-content-faint'
const COMPOSER_CANCEL = 'grid h-7 w-7 flex-none place-items-center rounded-[8px] text-content-faint hover:bg-surface-secondary hover:text-content'
/** A name being renamed in place, sized to the row it sits in. */
const ROW_INPUT = 'block min-w-0 rounded-[8px] border border-edge bg-surface-input px-2 py-1 text-content outline-none focus:ring-2 focus:ring-[color:var(--text-primary)]'
/** The quieter icon action of a category head or an item row, named by its tooltip. */
const SMALL_ICON_BUTTON = 'grid h-7 w-7 flex-none place-items-center rounded-[8px] text-content-faint transition-colors hover:bg-surface-card hover:text-content'
/** An item's actions show while the pointer or the focus is on its row. */
const REVEAL = 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100'

interface TemplateCategory { id: number; template_id: number; name: string; sort_order: number }
interface TemplateItem { id: number; category_id: number; name: string; sort_order: number; weight_grams?: number | null; quantity?: number | null; bag_name?: string | null }

/** "2× · 300 g · Backpack": what a template item brings along besides its name (#1131). */
function templateItemMeta(item: TemplateItem): string {
  const parts: string[] = []
  if ((item.quantity ?? 1) > 1) parts.push(`${item.quantity}×`)
  if (item.weight_grams) parts.push(item.weight_grams >= 1000 ? `${(item.weight_grams / 1000).toFixed(1)} kg` : `${item.weight_grams} g`)
  if (item.bag_name) parts.push(item.bag_name)
  return parts.join(' · ')
}
interface Template { id: number; name: string; item_count: number; category_count: number; created_by_name: string }

export default function PackingTemplateManager() {
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

  useEffect(() => { void loadTemplates() }, [])

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
    } catch { toast.error(t('admin.packingTemplates.deleteCategoryError')) }
  }

  // Item CRUD
  const handleAddItem = async (catId: number) => {
    // The name is already guaranteed non-empty by the button and the Enter handler.
    if (!expandedId) return
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
    } catch { toast.error(t('admin.packingTemplates.deleteItemError')) }
  }

  const composerConfirmClass = (enabled: boolean) =>
    `grid h-7 w-7 flex-none place-items-center rounded-[8px] bg-accent text-accent-text transition-opacity disabled:cursor-default ${enabled ? 'hover:opacity-90' : 'opacity-40'}`

  return (
    <SettingsCard
      icon={Package}
      title={t('admin.packingTemplates.title')}
      hint={t('admin.packingTemplates.subtitle')}
      badge={!isLoading && templates.length > 0 ? <StatusPill>{templates.length}</StatusPill> : undefined}
      action={
        <button type="button" onClick={() => setShowCreate(true)} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
          <Plus size={14} strokeWidth={2.2} /> <span className="hidden sm:inline">{t('admin.packingTemplates.create')}</span>
        </button>
      }
    >
      {/* Create template: the planner's composer, a framed field with its confirm beside it */}
      {showCreate && (
        <div className={COMPOSER_ROW} style={{ boxShadow: COMPOSER.boxShadow }}>
          <Package size={15} className="flex-none text-content-faint" />
          <input autoFocus value={createName} onChange={e => setCreateName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleCreateTemplate(); if (e.key === 'Escape') setShowCreate(false) }}
            placeholder={t('admin.packingTemplates.namePlaceholder')} className={COMPOSER_INPUT} style={fs(13, 'body')} />
          <Tooltip label={t('common.save')}>
            <button type="button" onClick={handleCreateTemplate} aria-label={t('common.save')} className={composerConfirmClass(!!createName.trim())}>
              <Check size={14} strokeWidth={2.5} />
            </button>
          </Tooltip>
          <Tooltip label={t('common.cancel')}>
            <button type="button" onClick={() => setShowCreate(false)} aria-label={t('common.cancel')} className={COMPOSER_CANCEL}>
              <X size={14} />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Template list */}
      {isLoading ? (
        <div className="grid place-items-center py-8">
          <Loader2 size={20} className="animate-spin text-content-faint" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-edge px-4 py-6 text-center">
          <SettingsHint>{t('admin.packingTemplates.empty')}</SettingsHint>
        </div>
      ) : (
        <SettingRows>
          {templates.map(tmpl => {
            const expanded = expandedId === tmpl.id
            return (
              <div key={tmpl.id}>
                {/* Template row */}
                <div data-row="template" className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors ${expanded ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'}`}>
                  <Tooltip label={expanded ? t('common.collapse') : t('common.expand')}>
                    <button type="button" onClick={() => toggleExpand(tmpl.id)} aria-expanded={expanded}
                      aria-label={expanded ? t('common.collapse') : t('common.expand')}
                      className="grid h-7 w-7 flex-none place-items-center rounded-[8px] text-content-faint hover:bg-surface-tertiary hover:text-content">
                      <ChevronRight size={15} strokeWidth={2.2} className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                  </Tooltip>
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
                    <Package size={15} strokeWidth={1.9} />
                  </span>
                  {editingTemplate === tmpl.id ? (
                    <input autoFocus value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)}
                      onBlur={() => handleRenameTemplate(tmpl.id)}
                      onKeyDown={e => { if (e.key === 'Enter') void handleRenameTemplate(tmpl.id); if (e.key === 'Escape') setEditingTemplate(null) }}
                      aria-label={t('common.rename')}
                      className={`${ROW_INPUT} flex-1 font-semibold`} style={fs(13, 'body')} />
                  ) : (
                    <button type="button" onClick={() => toggleExpand(tmpl.id)} className="min-w-0 flex-1 truncate text-left font-semibold text-content" style={fs(13, 'body')}>{tmpl.name}</button>
                  )}
                  <span className="max-sm:hidden">
                    <StatusPill>{tmpl.category_count} {t('admin.packingTemplates.categories')} · {tmpl.item_count} {t('admin.packingTemplates.items')}</StatusPill>
                  </span>
                  <Tooltip label={t('common.rename')}>
                    <button type="button" onClick={() => { setEditingTemplate(tmpl.id); setEditTemplateName(tmpl.name) }}
                      aria-label={t('common.rename')} className={SETTINGS_ICON_BUTTON}><Pencil size={14} strokeWidth={2} /></button>
                  </Tooltip>
                  <Tooltip label={t('common.delete')}>
                    <button type="button" onClick={() => handleDeleteTemplate(tmpl.id)}
                      aria-label={t('common.delete')} className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`}><Trash2 size={14} strokeWidth={2} /></button>
                  </Tooltip>
                </div>

                {/* Expanded content: the template's categories as the packing list draws them */}
                {expanded && (
                  <div className="flex flex-col gap-2.5 border-t border-edge-faint bg-surface-secondary px-3 py-3 sm:pl-[52px]">
                    {categories.map(cat => {
                      const catItems = items.filter(i => i.category_id === cat.id)
                      return (
                        <div key={cat.id} className="overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
                          {/* Category header */}
                          <div data-row="category" className="flex items-center gap-1.5 border-b border-edge-faint bg-surface-tertiary py-1.5 pl-3 pr-1.5">
                            {editingCatId === cat.id ? (
                              <input autoFocus value={editCatName} onChange={e => setEditCatName(e.target.value)}
                                onBlur={() => handleRenameCategory(cat.id)}
                                onKeyDown={e => { if (e.key === 'Enter') void handleRenameCategory(cat.id); if (e.key === 'Escape') setEditingCatId(null) }}
                                aria-label={t('common.rename')}
                                className={`${ROW_INPUT} flex-1 font-semibold`} style={fs(12.5, 'body')} />
                            ) : (
                              <span className="min-w-0 flex-1 truncate font-geist font-bold uppercase tracking-[.08em] text-content-muted" style={fs(10.5)}>{cat.name}</span>
                            )}
                            <span className="min-w-[20px] flex-none rounded-full bg-surface-card px-1.5 py-px text-center font-geist font-bold tabular-nums text-content-faint" style={fs(10)}>{catItems.length}</span>
                            <Tooltip label={t('common.add')}>
                              <button type="button" onClick={() => { setAddingItemToCatId(addingItemToCatId === cat.id ? null : cat.id); setNewItemName(''); setTimeout(() => addItemRef.current?.focus(), 30) }}
                                aria-label={t('common.add')} className={SMALL_ICON_BUTTON}><Plus size={13} strokeWidth={2.2} /></button>
                            </Tooltip>
                            <Tooltip label={t('common.rename')}>
                              <button type="button" onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name) }}
                                aria-label={t('common.rename')} className={SMALL_ICON_BUTTON}><Pencil size={12} strokeWidth={2} /></button>
                            </Tooltip>
                            <Tooltip label={t('common.delete')}>
                              <button type="button" onClick={() => handleDeleteCategory(cat.id)}
                                aria-label={t('common.delete')} className={`${SMALL_ICON_BUTTON} hover:!text-danger`}><Trash2 size={12} strokeWidth={2} /></button>
                            </Tooltip>
                          </div>

                          {/* Items */}
                          {(catItems.length > 0 || addingItemToCatId === cat.id) && (
                            <div className="divide-y divide-edge-faint">
                              {catItems.map(item => (
                                <div key={item.id} data-row="item" className="group flex min-h-[40px] items-center gap-2 py-1.5 pl-3 pr-1.5">
                                  {editingItemId === item.id ? (
                                    <>
                                      <input autoFocus value={editItemName} onChange={e => setEditItemName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') void handleRenameItem(item.id); if (e.key === 'Escape') setEditingItemId(null) }}
                                        aria-label={t('common.rename')}
                                        className={`${ROW_INPUT} flex-1`} style={fs(12.5, 'body')} />
                                      <Tooltip label={t('common.save')}>
                                        <button type="button" onClick={() => handleRenameItem(item.id)} aria-label={t('common.save')} className={composerConfirmClass(true)}><Check size={13} strokeWidth={2.5} /></button>
                                      </Tooltip>
                                      <Tooltip label={t('common.cancel')}>
                                        <button type="button" onClick={() => setEditingItemId(null)} aria-label={t('common.cancel')} className={COMPOSER_CANCEL}><X size={13} /></button>
                                      </Tooltip>
                                    </>
                                  ) : (
                                    <>
                                      <span aria-hidden className="h-[7px] w-[7px] flex-none rounded-full border-[1.5px] border-edge" />
                                      <span className="min-w-0 flex-1 truncate text-content" style={fs(12.5, 'body')}>{item.name}</span>
                                      {templateItemMeta(item) && (
                                        <span className="max-w-[45%] truncate font-geist tabular-nums text-content-faint" style={fs(11)}>{templateItemMeta(item)}</span>
                                      )}
                                      <Tooltip label={t('common.rename')}>
                                        <button type="button" onClick={() => { setEditingItemId(item.id); setEditItemName(item.name) }}
                                          aria-label={t('common.rename')} className={`${SMALL_ICON_BUTTON} ${REVEAL}`}><Pencil size={12} strokeWidth={2} /></button>
                                      </Tooltip>
                                      <Tooltip label={t('common.delete')}>
                                        <button type="button" onClick={() => handleDeleteItem(item.id)}
                                          aria-label={t('common.delete')} className={`${SMALL_ICON_BUTTON} ${REVEAL} hover:!text-danger`}><Trash2 size={12} strokeWidth={2} /></button>
                                      </Tooltip>
                                    </>
                                  )}
                                </div>
                              ))}

                              {/* Add item inline */}
                              {addingItemToCatId === cat.id && (
                                <div className="flex items-center gap-2 py-1.5 pl-3 pr-1.5">
                                  <input ref={addItemRef} value={newItemName} onChange={e => setNewItemName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newItemName.trim()) void handleAddItem(cat.id); if (e.key === 'Escape') { setAddingItemToCatId(null); setNewItemName('') } }}
                                    placeholder={t('admin.packingTemplates.itemName')}
                                    className={`${ROW_INPUT} flex-1`} style={fs(12.5, 'body')} />
                                  <Tooltip label={t('common.add')}>
                                    <button type="button" onClick={() => handleAddItem(cat.id)} disabled={!newItemName.trim()}
                                      aria-label={t('common.add')} className={composerConfirmClass(!!newItemName.trim())}><Plus size={13} strokeWidth={2.5} /></button>
                                  </Tooltip>
                                  <Tooltip label={t('common.cancel')}>
                                    <button type="button" onClick={() => { setAddingItemToCatId(null); setNewItemName('') }}
                                      aria-label={t('common.cancel')} className={COMPOSER_CANCEL}><X size={13} /></button>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Add category */}
                    {addingCategory ? (
                      <div className={COMPOSER_ROW} style={{ boxShadow: COMPOSER.boxShadow }}>
                        <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') void handleAddCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCatName('') } }}
                          placeholder={t('admin.packingTemplates.categoryName')}
                          className={COMPOSER_INPUT} style={fs(13, 'body')} />
                        <Tooltip label={t('common.save')}>
                          <button type="button" onClick={handleAddCategory} aria-label={t('common.save')} className={composerConfirmClass(!!newCatName.trim())}><Check size={14} strokeWidth={2.5} /></button>
                        </Tooltip>
                        <Tooltip label={t('common.cancel')}>
                          <button type="button" onClick={() => { setAddingCategory(false); setNewCatName('') }} aria-label={t('common.cancel')} className={COMPOSER_CANCEL}><X size={14} /></button>
                        </Tooltip>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setAddingCategory(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-edge px-3 py-2 font-semibold text-content-muted transition-colors hover:border-content-faint hover:text-content"
                        style={fs(12, 'body')}>
                        <FolderPlus size={13} strokeWidth={2.2} /> {t('admin.packingTemplates.addCategory')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </SettingRows>
      )}
    </SettingsCard>
  )
}
