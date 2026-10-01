import React, { useEffect, useState, useMemo } from 'react'
import { adminApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { usePermissionsStore, PermissionLevel } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { Save, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import CustomSelect from '../shared/CustomSelect'
import { DialogSection, fs } from '../shared/DialogShell'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsCard, StatusPill } from '../Settings/settingsKit'

interface PermissionEntry {
  key: string
  level: PermissionLevel
  defaultLevel: PermissionLevel
  allowedLevels: PermissionLevel[]
}

const LEVEL_LABELS: Record<string, string> = {
  admin: 'perm.level.admin',
  trip_owner: 'perm.level.tripOwner',
  trip_member: 'perm.level.tripMember',
  everybody: 'perm.level.everybody',
}

const CATEGORIES = [
  { id: 'trip', keys: ['trip_create', 'trip_edit', 'trip_delete', 'trip_archive', 'trip_cover_upload'] },
  { id: 'members', keys: ['member_manage'] },
  { id: 'files', keys: ['file_upload', 'file_edit', 'file_delete'] },
  { id: 'content', keys: ['place_edit', 'day_edit', 'reservation_edit'] },
  { id: 'extras', keys: ['budget_edit', 'packing_edit', 'collab_edit', 'share_manage'] },
]

export default function PermissionsPanel(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const [entries, setEntries] = useState<PermissionEntry[]>([])
  const [values, setValues] = useState<Record<string, PermissionLevel>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    void loadPermissions()
  }, [])

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPermissions()
      setEntries(data.permissions)
      const vals: Record<string, PermissionLevel> = {}
      for (const p of data.permissions) vals[p.key] = p.level
      setValues(vals)
      setDirty(false)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, level: PermissionLevel) => {
    setValues(prev => ({ ...prev, [key]: level }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await adminApi.updatePermissions(values)
      if (data.permissions) {
        usePermissionsStore.getState().setPermissions(data.permissions)
      }
      setDirty(false)
      toast.success(t('perm.saved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const defaults: Record<string, PermissionLevel> = {}
    for (const p of entries) defaults[p.key] = p.defaultLevel
    setValues(defaults)
    setDirty(true)
  }

  const entryMap = useMemo(() => new Map(entries.map(e => [e.key, e])), [entries])

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
