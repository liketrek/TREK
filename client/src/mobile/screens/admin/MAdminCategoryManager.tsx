import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Pipette } from 'lucide-react'
import { categoriesApi } from '../../../api/client'
import { useToast } from '../../../components/shared/Toast'
import { CATEGORY_ICON_MAP, ICON_LABELS, getCategoryIcon } from '../../../components/shared/categoryIcons'
import { useTranslation } from '../../../i18n'
import { getApiErrorMessage } from '../../../types'
import MConfirmSheet from '../settings/MConfirmSheet'
import { MAdminButton, MAdminCard, MAdminCardHead } from './MAdminUi'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#84cc16',
  '#6b7280', '#1f2937',
]

const ICON_NAMES = Object.keys(CATEGORY_ICON_MAP)

export default function MAdminCategoryManager() {
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#6366f1', icon: 'MapPin' })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const colorInputRef = useRef(null)
  const toast = useToast()
  const { t } = useTranslation()

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const data = await categoriesApi.list()
      setCategories(data.categories || [])
    } catch (err: unknown) {
      toast.error(t('categories.toast.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEdit = (cat) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, color: cat.color || '#6366f1', icon: cat.icon || 'MapPin' })
    setShowForm(false)
  }

  const handleStartCreate = () => {
    setEditingId(null)
    setForm({ name: '', color: '#6366f1', icon: 'MapPin' })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('categories.toast.nameRequired')); return }
    setIsSaving(true)
    try {
      if (editingId) {
        const result = await categoriesApi.update(editingId, form)
        setCategories(prev => prev.map(c => c.id === editingId ? result.category : c))
        setEditingId(null)
        toast.success(t('categories.toast.updated'))
      } else {
        const result = await categoriesApi.create(form)
        setCategories(prev => [...prev, result.category])
        setShowForm(false)
        toast.success(t('categories.toast.created'))
      }
      setForm({ name: '', color: '#6366f1', icon: 'MapPin' })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('categories.toast.saveError')))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      await categoriesApi.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success(t('categories.toast.deleted'))
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('categories.toast.deleteError')))
    } finally {
      setIsDeleting(false)
    }
  }

  const isPresetColor = PRESET_COLORS.includes(form.color)
  const PreviewIcon = getCategoryIcon(form.icon)

  const categoryForm = (
    <div className="space-y-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-4">
      <input
        type="text"
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        placeholder={t('categories.namePlaceholder')}
        className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)]"
        autoFocus
      />

      <div>
        <div className="mb-[6px] text-[0.75rem] font-semibold text-m-ink">{t('categories.icon')}</div>
        <div className="max-h-48 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5 px-1.5 py-1.5">
            {ICON_NAMES.map(name => {
              const Icon = CATEGORY_ICON_MAP[name]
              const isSelected = form.icon === name
              return (
                <button
                  key={name}
                  type="button"
                  title={ICON_LABELS[name] || name}
                  onClick={() => setForm(prev => ({ ...prev, icon: name }))}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-colors ${
                    isSelected ? '' : 'border-transparent hover:bg-[color:var(--m-sheetop)]'
                  }`}
                  style={isSelected ? { background: `${form.color}1f`, borderColor: form.color } : undefined}
                >
                  <span className={isSelected ? '' : 'text-m-faint'}>
                    <Icon size={17} strokeWidth={1.8} color={isSelected ? form.color : undefined} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-[6px] text-[0.75rem] font-semibold text-m-ink">{t('categories.color')}</div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map(color => (
            <button key={color} type="button" onClick={() => setForm(prev => ({ ...prev, color }))}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                form.color === color
                  ? 'scale-110 ring-2 ring-[color:var(--m-faint)] ring-offset-2 ring-offset-[color:var(--m-ic)]'
                  : ''
              }`}
              style={{ backgroundColor: color }} />
          ))}

          {/* Custom color button */}
          <input
            ref={colorInputRef}
            type="color"
            value={form.color}
            onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
            className="sr-only"
          />
          <button
            type="button"
            title={t('categories.customColor')}
            onClick={() => colorInputRef.current?.click()}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
              !isPresetColor
                ? 'scale-110 border-transparent ring-2 ring-[color:var(--m-faint)] ring-offset-2 ring-offset-[color:var(--m-ic)]'
                : 'border-dashed border-[color:var(--m-rowbr)]'
            }`}
            style={!isPresetColor ? { backgroundColor: form.color } : undefined}
          >
            {isPresetColor && <Pipette className="h-3 w-3 text-m-faint" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[0.6875rem] text-m-muted">{t('categories.preview')}:</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium"
          style={{ backgroundColor: `${form.color}20`, color: form.color }}>
          <PreviewIcon size={14} strokeWidth={1.8} />
          {form.name || t('categories.defaultName')}
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <MAdminButton variant="ghost" onClick={handleCancel}>
          {t('common.cancel')}
        </MAdminButton>
        <MAdminButton busy={isSaving} disabled={isSaving || !form.name.trim()} onClick={handleSave}>
          {isSaving ? t('common.saving') : editingId ? t('categories.update') : t('categories.create')}
        </MAdminButton>
      </div>
    </div>
  )

  return (
    <MAdminCard>
      <MAdminCardHead
        title={t('categories.title')}
        hint={t('categories.subtitle')}
        trailing={
          <MAdminButton onClick={handleStartCreate}>
            <Plus size={12} strokeWidth={2.4} />
            {t('categories.new')}
          </MAdminButton>
        }
      />

      {showForm && <div className="mb-3 mt-1">{categoryForm}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-m-faint">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-[color:var(--m-ink)]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-8 text-center text-m-faint">
          <p className="text-[0.8125rem]">{t('categories.empty')}</p>
        </div>
      ) : (
        <div className="mt-1 space-y-2">
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat.icon)
            return (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="mb-2">{categoryForm}</div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-[color:var(--m-rowbr)] p-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cat.color}20` }}>
                      <Icon size={18} strokeWidth={1.8} color={cat.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.8125rem] font-bold text-m-ink">{cat.name}</span>
                        <span className="rounded-full px-2 py-0.5 text-[0.625rem] font-geist"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                          {cat.color}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-1">
                      <button
                        type="button"
                        aria-label={t('common.edit')}
                        onClick={() => handleStartEdit(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-m-faint hover:bg-[color:var(--m-ic)] hover:text-m-ink"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={() => setDeleteId(cat.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-m-faint hover:bg-[color:color-mix(in_srgb,var(--m-st-danger)_12%,transparent)] hover:text-[color:var(--m-st-danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <MConfirmSheet
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={t('categories.title')}
        message={t('categories.confirm.delete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        busy={isDeleting}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
      />
    </MAdminCard>
  )
}
