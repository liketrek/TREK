import { useState, useEffect, useRef, useId } from 'react'
import { categoriesApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { Plus, Pencil, Trash2, Pipette, Tags, Loader2 } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import ConfirmDialog from '../shared/ConfirmDialog'
import { SettingRows, SettingsCard, SettingsHint, StatusPill, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON } from '../Settings/settingsKit'
import { CATEGORY_ICON_MAP, ICON_LABELS, getCategoryIcon } from '../shared/categoryIcons'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#84cc16',
  '#6b7280', '#1f2937',
]

// The colour a new category is stored with: data the server keeps, not a theme colour.
const DEFAULT_COLOR = '#6366f1' // theme-lint-disable: a stored category colour, not styling

const ICON_NAMES = Object.keys(CATEGORY_ICON_MAP)

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // The category whose delete waits for the answer in the confirm dialog.
  const [deleteId, setDeleteId] = useState(null)
  const colorInputRef = useRef(null)
  const toast = useToast()
  const { t } = useTranslation()
  const labelId = useId()

  useEffect(() => { void loadCategories() }, [])

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
    setForm({ name: cat.name, color: cat.color || DEFAULT_COLOR, icon: cat.icon || 'MapPin' })
    setShowForm(false)
  }

  const handleStartCreate = () => {
    setEditingId(null)
    setForm({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  // The Save button carries disabled={… || !form.name.trim()}, so the name is set here.
  const handleSave = async () => {
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
      setForm({ name: '', color: DEFAULT_COLOR, icon: 'MapPin' })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('categories.toast.saveError')))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await categoriesApi.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success(t('categories.toast.deleted'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('categories.toast.deleteError')))
    }
  }

  const isPresetColor = PRESET_COLORS.includes(form.color)
  const PreviewIcon = getCategoryIcon(form.icon)
  const formOpen = showForm || editingId !== null
  const saveDisabled = isSaving || !form.name.trim()

  const categoryDialog = (
    <DialogShell
      onClose={handleCancel}
      labelledBy={labelId}
      width="detail"
      header={
        <DialogHeader
          tile={<DialogTile><PreviewIcon size={20} strokeWidth={1.9} color={form.color} /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={handleCancel}
          eyebrow={editingId ? t('common.edit') : t('categories.new')}
          titleInput={{
            value: form.name,
            onChange: name => setForm(prev => ({ ...prev, name })),
            label: t('categories.namePlaceholder'),
            placeholder: t('categories.namePlaceholder'),
            autoFocus: true,
            onKeyDown: e => { if (e.key === 'Enter' && !saveDisabled) void handleSave() },
          }}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={handleCancel}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={handleSave} disabled={saveDisabled}>
            {isSaving ? t('common.saving') : editingId ? t('categories.update') : t('categories.create')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <DialogSection label={t('categories.icon')}>
        <div className="max-h-52 overflow-y-auto rounded-[14px] border border-edge-faint bg-surface-secondary p-2">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-1">
            {ICON_NAMES.map(name => {
              const Icon = CATEGORY_ICON_MAP[name]
              const isSelected = form.icon === name
              return (
                <button
                  key={name}
                  type="button"
                  title={ICON_LABELS[name] || name}
                  aria-label={ICON_LABELS[name] || name}
                  aria-pressed={isSelected}
                  onClick={() => setForm(prev => ({ ...prev, icon: name }))}
                  className={`grid h-[38px] place-items-center rounded-[10px] transition-colors ${
                    isSelected ? 'bg-surface-card shadow-sm ring-2 ring-content' : 'text-content-secondary hover:bg-surface-card'
                  }`}
                  style={isSelected ? { background: `${form.color}18` } : undefined}
                >
                  <Icon size={17} strokeWidth={1.8} color={isSelected ? form.color : 'currentColor'} />
                </button>
              )
            })}
          </div>
        </div>
      </DialogSection>

      <DialogSection label={t('categories.color')}>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map(color => (
            <button key={color} type="button" onClick={() => setForm(prev => ({ ...prev, color }))}
              aria-label={color}
              aria-pressed={form.color === color}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${form.color === color ? 'scale-110 ring-2 ring-content ring-offset-2 ring-offset-surface-card' : ''}`}
              style={{ backgroundColor: color }} />
          ))}

          {/* Custom color button */}
          <input
            ref={colorInputRef}
            type="color"
            value={form.color}
            onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
          <button
            type="button"
            title={t('categories.customColor')}
            aria-label={t('categories.customColor')}
            onClick={() => colorInputRef.current?.click()}
            className={`grid h-7 w-7 place-items-center rounded-full border-2 transition-transform hover:scale-110 ${
              !isPresetColor
                ? 'scale-110 border-transparent ring-2 ring-content ring-offset-2 ring-offset-surface-card'
                : 'border-dashed border-edge text-content-faint hover:border-content-faint hover:text-content-muted'
            }`}
            style={!isPresetColor ? { backgroundColor: form.color } : undefined}
          >
            {isPresetColor && <Pipette size={12} strokeWidth={2} />}
          </button>
        </div>
      </DialogSection>

      <DialogSection label={t('categories.preview')}>
        <div className="flex items-center rounded-[14px] border border-edge-faint bg-surface-secondary px-3.5 py-3">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-1 font-semibold"
            style={{ ...fs(12.5, 'body'), backgroundColor: `${form.color}20`, color: form.color }}>
            <PreviewIcon size={14} strokeWidth={1.8} className="flex-none" />
            {form.name || t('categories.defaultName')}
          </span>
        </div>
      </DialogSection>
    </DialogShell>
  )

  return (
    <SettingsCard
      icon={Tags}
      title={t('categories.title')}
      hint={t('categories.subtitle')}
      badge={!isLoading && categories.length > 0 ? <StatusPill>{categories.length}</StatusPill> : undefined}
      action={
        <button type="button" onClick={handleStartCreate} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
          <Plus size={14} strokeWidth={2.2} />
          <span className="hidden sm:inline">{t('categories.new')}</span>
        </button>
      }
    >
      {isLoading ? (
        <div className="grid place-items-center py-8">
          <Loader2 size={20} className="animate-spin text-content-faint" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-edge px-4 py-6 text-center">
          <SettingsHint>{t('categories.empty')}</SettingsHint>
        </div>
      ) : (
        <SettingRows>
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat.icon)
            return (
              <div key={cat.id} data-category-row={cat.id} className={`group flex items-center gap-3 px-3.5 py-3 ${editingId === cat.id ? 'bg-surface-secondary' : ''}`}>
                <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px]"
                  style={{ backgroundColor: `${cat.color}20` }}>
                  <Icon size={17} strokeWidth={1.8} color={cat.color} />
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 truncate font-medium text-content" style={fs(13, 'body')}>{cat.name}</span>
                  <span className="flex-none rounded-full px-2 py-[2px] font-geist font-semibold uppercase tabular-nums"
                    style={{ ...fs(10.5), backgroundColor: `${cat.color}20`, color: cat.color }}>
                    {cat.color}
                  </span>
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  <Tooltip label={t('common.edit')}>
                    <button type="button" onClick={() => handleStartEdit(cat)} aria-label={t('common.edit')} className={SETTINGS_ICON_BUTTON}>
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                  </Tooltip>
                  <Tooltip label={t('common.delete')}>
                    <button type="button" onClick={() => setDeleteId(cat.id)} aria-label={t('common.delete')} className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`}>
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </SettingRows>
      )}
      {formOpen && categoryDialog}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) void handleDelete(deleteId) }}
        message={t('categories.confirm.delete')}
        confirmLabel={t('common.delete')}
        danger
      />
    </SettingsCard>
  )
}
