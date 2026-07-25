import React, { useEffect, useState, useMemo } from 'react'
import { adminApi } from '../../../api/client'
import { useTranslation } from '../../../i18n'
import { usePermissionsStore, PermissionLevel } from '../../../store/permissionsStore'
import { useToast } from '../../../components/shared/Toast'
import { Save, RotateCcw } from 'lucide-react'
import { MAdminButton, MAdminCard } from './MAdminUi'

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

export default function MAdminPermissionsPanel(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const [entries, setEntries] = useState<PermissionEntry[]>([])
  const [values, setValues] = useState<Record<string, PermissionLevel>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    loadPermissions()
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
      <MAdminCard>
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-[color:var(--m-ink)]" />
        </div>
      </MAdminCard>
    )
  }

  return (
    <MAdminCard>
      <div className="mb-1 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[0.875rem] font-extrabold text-m-ink">{t('perm.title')}</div>
          <div className="mt-[2px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{t('perm.subtitle')}</div>
        </div>
        <MAdminButton
          variant="ghost"
          disabled={saving}
          title={t('perm.resetDefaults')}
          onClick={handleReset}
        >
          <RotateCcw size={12} strokeWidth={2.2} />
        </MAdminButton>
        <MAdminButton busy={saving} disabled={saving || !dirty} onClick={handleSave}>
          {!saving && <Save size={12} strokeWidth={2.2} />}
          {t('common.save')}
        </MAdminButton>
      </div>

      <div>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="border-t border-[color:var(--m-rowbr)] pt-3 mt-3">
            <div className="mb-2 font-geist text-[0.5625rem] font-extrabold uppercase tracking-wider text-m-faint">
              {t(`perm.cat.${cat.id}`)}
            </div>
            <div className="space-y-3">
              {cat.keys.map(key => {
                const entry = entryMap.get(key)
                if (!entry) return null
                const currentLevel = values[key] || entry.defaultLevel
                const isDefault = currentLevel === entry.defaultLevel
                return (
                  <div key={key}>
                    <div className="mb-[6px] flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.8125rem] font-bold text-m-ink">{t(`perm.action.${key}`)}</div>
                        <div className="mt-[1px] font-geist text-[0.625rem] leading-relaxed text-m-muted">
                          {t(`perm.actionHint.${key}`)}
                        </div>
                      </div>
                      {!isDefault && (
                        <span className="mt-[1px] flex-none rounded-full bg-[color:color-mix(in_srgb,var(--m-st-pending)_14%,transparent)] px-[7px] py-[2px] font-geist text-[0.5625rem] font-bold text-[color:var(--m-st-pending)]">
                          {t('perm.customized')}
                        </span>
                      )}
                    </div>
                    <select
                      value={currentLevel}
                      onChange={(e) => handleChange(key, e.target.value as PermissionLevel)}
                      aria-label={t(`perm.action.${key}`)}
                      className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none"
                    >
                      {entry.allowedLevels.map(l => (
                        <option key={l} value={l}>
                          {t(LEVEL_LABELS[l] || l)}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </MAdminCard>
  )
}
