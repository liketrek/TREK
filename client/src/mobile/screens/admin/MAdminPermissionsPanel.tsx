import React from 'react'
import { useTranslation } from '../../../i18n'
import { PermissionLevel } from '../../../store/permissionsStore'
import { CATEGORIES, LEVEL_LABELS, usePermissionsAdmin } from '../../../components/Admin/usePermissionsAdmin'
import { Save, RotateCcw } from 'lucide-react'
import { MAdminButton, MAdminCard, MAdminRow, MAdminSelect } from './MAdminUi'
import MSkeleton from '../../components/MSkeleton'

export default function MAdminPermissionsPanel(): React.ReactElement {
  const { t } = useTranslation()
  const { entryMap, values, loading, saving, dirty, handleChange, handleSave, handleReset } = usePermissionsAdmin()

  if (loading) {
    return (
      <MAdminCard>
        <MSkeleton variant="rows" count={5} framed={false} />
      </MAdminCard>
    )
  }

  return (
    <MAdminCard>
      {/* The title gets the full width and the actions a row of their own: beside a
          long title they ran into its second line. */}
      <div className="mb-1">
        <div className="text-[length:calc(14px*var(--fs-scale-body,1))] font-extrabold text-m-ink">{t('perm.title')}</div>
        <div className="mt-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-relaxed text-m-muted">{t('perm.subtitle')}</div>
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <MAdminButton variant="ghost" disabled={saving} onClick={handleReset}>
            <RotateCcw size={12} strokeWidth={2.2} />
            {t('perm.resetDefaults')}
          </MAdminButton>
          <MAdminButton busy={saving} disabled={saving || !dirty} onClick={handleSave}>
            {!saving && <Save size={12} strokeWidth={2.2} />}
            {t('common.save')}
          </MAdminButton>
        </div>
      </div>

      <div>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="border-t border-[color:var(--m-rowbr)] pt-3 mt-3">
            <div className="mb-2 font-geist text-[0.5625rem] font-extrabold uppercase tracking-wider text-m-faint">
              {t(`perm.cat.${cat.id}`)}
            </div>
            <div>
              {cat.keys.map((key, index) => {
                const entry = entryMap.get(key)
                if (!entry) return null
                const currentLevel = values[key] || entry.defaultLevel
                const isDefault = currentLevel === entry.defaultLevel
                return (
                  <MAdminRow
                    key={key}
                    first={index === 0}
                    title={
                      <span className="inline-flex max-w-full items-center gap-[6px]">
                        <span className="min-w-0">{t(`perm.action.${key}`)}</span>
                        {/* A changed rule wears the pending dot; its name is in the title for a screen reader. */}
                        {!isDefault && (
                          <span
                            title={t('perm.customized')}
                            className="h-[6px] w-[6px] flex-none rounded-full bg-[color:var(--m-st-pending)]"
                          >
                            <span className="sr-only">{t('perm.customized')}</span>
                          </span>
                        )}
                      </span>
                    }
                    hint={t(`perm.actionHint.${key}`)}
                    trailing={
                      <MAdminSelect
                        compact
                        title={t(`perm.action.${key}`)}
                        value={currentLevel}
                        onChange={(level) => handleChange(key, level as PermissionLevel)}
                        options={entry.allowedLevels.map((level) => ({ value: level, label: t(LEVEL_LABELS[level] || level) }))}
                      />
                    }
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </MAdminCard>
  )
}
