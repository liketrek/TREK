import React from 'react'
import { useTranslation } from '../../i18n'
import { PermissionLevel } from '../../store/permissionsStore'
import { CATEGORIES, LEVEL_LABELS, usePermissionsAdmin } from './usePermissionsAdmin'
import { Save, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import CustomSelect from '../shared/CustomSelect'
import { DialogSection, fs } from '../shared/DialogShell'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsCard, StatusPill } from '../Settings/settingsKit'

export default function PermissionsPanel(): React.ReactElement {
  const { t } = useTranslation()
  const { entryMap, values, loading, saving, dirty, handleChange, handleSave, handleReset } = usePermissionsAdmin()

  if (loading) {
    return (
      <SettingsCard icon={ShieldCheck} title={t('perm.title')} hint={t('perm.subtitle')}>
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-content-faint" />
        </div>
      </SettingsCard>
    )
  }

  return (
    <SettingsCard
      icon={ShieldCheck}
      title={t('perm.title')}
      hint={t('perm.subtitle')}
      action={
        <div className="flex items-center gap-2" style={fs(12.5, 'body')}>
          <button type="button"
            onClick={handleReset}
            disabled={saving}
            aria-label={t('perm.resetDefaults')}
            className={SETTINGS_BUTTON}
          >
            <RotateCcw size={14} strokeWidth={2.2} />
            <span>{t('perm.resetDefaults')}</span>
          </button>
          <button type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={SETTINGS_BUTTON_PRIMARY}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2.2} />}
            {t('common.save')}
          </button>
        </div>
      }
    >
      <div className={`flex flex-col gap-5 transition-opacity ${saving ? 'opacity-60' : ''}`}>
        {CATEGORIES.map(cat => (
          <DialogSection key={cat.id} label={t(`perm.cat.${cat.id}`)}>
            <SettingRows>
              {cat.keys.map(key => {
                const entry = entryMap.get(key)
                if (!entry) return null
                const currentLevel = values[key] || entry.defaultLevel
                const isDefault = currentLevel === entry.defaultLevel
                return (
                  <SettingRow
                    key={key}
                    label={t(`perm.action.${key}`)}
                    hint={t(`perm.actionHint.${key}`)}
                    control={<>
                      {!isDefault && <StatusPill tone="warning">{t('perm.customized')}</StatusPill>}
                      <CustomSelect
                        value={currentLevel}
                        onChange={(val) => handleChange(key, val as PermissionLevel)}
                        options={entry.allowedLevels.map(l => ({
                          value: l,
                          label: t(LEVEL_LABELS[l] || l),
                        }))}
                        style={{ minWidth: 180 }}
                      />
                    </>}
                  />
                )
              })}
            </SettingRows>
          </DialogSection>
        ))}
      </div>
    </SettingsCard>
  )
}
