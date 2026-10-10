import { Plus, Edit2, Trash2, Pipette } from 'lucide-react'
import { ICON_NAMES, PRESET_COLORS, useCategoryAdmin } from '../../../components/Admin/useCategoryAdmin'
import { CATEGORY_ICON_MAP, ICON_LABELS, getCategoryIcon } from '../../../components/shared/categoryIcons'
import { useTranslation } from '../../../i18n'
import MConfirmSheet from '../settings/MConfirmSheet'
import { MAdminButton, MAdminCard, MAdminCardHead } from './MAdminUi'

export default function MAdminCategoryManager() {
  const {
    categories, showForm, editingId, form, setForm, isSaving, isLoading, deleteId, setDeleteId, isDeleting,
    colorInputRef, handleStartEdit, handleStartCreate, handleCancel, handleSave, handleDelete, isPresetColor,
  } = useCategoryAdmin({ trackDelete: true })
  const { t } = useTranslation()

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
