import { useState, useEffect, useRef } from 'react'
import {
  Check,
  Clock,
  Download,
  HardDrive,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { backupApi } from '../../../api/client'
import { useToast } from '../../../components/shared/Toast'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { getApiErrorMessage } from '../../../types'
import MChip from '../../components/MChip'
import MToggle from '../../components/MToggle'
import MConfirmSheet from '../settings/MConfirmSheet'
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminField, MAdminRow } from './MAdminUi'

const INTERVAL_OPTIONS = [
  { value: 'hourly',  labelKey: 'backup.interval.hourly' },
  { value: 'daily',   labelKey: 'backup.interval.daily' },
  { value: 'weekly',  labelKey: 'backup.interval.weekly' },
  { value: 'monthly', labelKey: 'backup.interval.monthly' },
]

const KEEP_OPTIONS = [
  { value: 1,  labelKey: 'backup.keep.1day' },
  { value: 3,  labelKey: 'backup.keep.3days' },
  { value: 7,  labelKey: 'backup.keep.7days' },
  { value: 14, labelKey: 'backup.keep.14days' },
  { value: 30, labelKey: 'backup.keep.30days' },
  { value: 0,  labelKey: 'backup.keep.forever' },
]

const DAYS_OF_WEEK = [
  { value: 0, labelKey: 'backup.dow.sunday' },
  { value: 1, labelKey: 'backup.dow.monday' },
  { value: 2, labelKey: 'backup.dow.tuesday' },
  { value: 3, labelKey: 'backup.dow.wednesday' },
  { value: 4, labelKey: 'backup.dow.thursday' },
  { value: 5, labelKey: 'backup.dow.friday' },
  { value: 6, labelKey: 'backup.dow.saturday' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1)

const SELECT_CLASS =
  'h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none focus:border-[color:var(--m-faint)]'

export default function MAdminBackupPanel() {
  const [backups, setBackups] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [restoringFile, setRestoringFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [autoSettings, setAutoSettings] = useState({ enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 })
  const [autoSettingsSaving, setAutoSettingsSaving] = useState(false)
  const [autoSettingsDirty, setAutoSettingsDirty] = useState(false)
  const [serverTimezone, setServerTimezone] = useState('')
  const [restoreConfirm, setRestoreConfirm] = useState(null) // { type: 'file'|'upload', filename, file? }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // filename pending deletion
  const fileInputRef = useRef(null)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'

  const loadBackups = async () => {
    setIsLoading(true)
    try {
      const data = await backupApi.list()
      setBackups(data.backups || [])
    } catch {
      toast.error(t('backup.toast.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadAutoSettings = async () => {
    try {
      const data = await backupApi.getAutoSettings()
      setAutoSettings(data.settings)
      if (data.timezone) setServerTimezone(data.timezone)
    } catch {}
  }

  useEffect(() => { loadBackups(); loadAutoSettings() }, [])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await backupApi.create()
      toast.success(t('backup.toast.created'))
      await loadBackups()
    } catch {
      toast.error(t('backup.toast.createError'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleRestore = (filename) => {
    setRestoreConfirm({ type: 'file', filename })
  }

  const handleUploadRestore = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    e.target.value = ''
    setRestoreConfirm({ type: 'upload', filename: file.name, file })
  }

  const executeRestore = async () => {
    if (!restoreConfirm) return
    const { type, filename, file } = restoreConfirm
    setRestoreConfirm(null)

    if (type === 'file') {
      setRestoringFile(filename)
      try {
        await backupApi.restore(filename)
        toast.success(t('backup.toast.restored'))
        setTimeout(() => window.location.reload(), 1500)
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, t('backup.toast.restoreError')))
        setRestoringFile(null)
      }
    } else {
      setIsUploading(true)
      try {
        await backupApi.uploadRestore(file)
        toast.success(t('backup.toast.restored'))
        setTimeout(() => window.location.reload(), 1500)
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, t('backup.toast.uploadError')))
        setIsUploading(false)
      }
    }
  }

  const handleDelete = (filename) => {
    setDeleteConfirm(filename)
  }

  const executeDelete = async () => {
    const filename = deleteConfirm
    setDeleteConfirm(null)
    if (!filename) return
    try {
      await backupApi.delete(filename)
      toast.success(t('backup.toast.deleted'))
      setBackups(prev => prev.filter(b => b.filename !== filename))
    } catch {
      toast.error(t('backup.toast.deleteError'))
    }
  }

  const handleAutoSettingsChange = (key, value) => {
    setAutoSettings(prev => ({ ...prev, [key]: value }))
    setAutoSettingsDirty(true)
  }

  const handleSaveAutoSettings = async () => {
    setAutoSettingsSaving(true)
    try {
      const data = await backupApi.setAutoSettings(autoSettings)
      setAutoSettings(data.settings)
      setAutoSettingsDirty(false)
      toast.success(t('backup.toast.settingsSaved'))
    } catch {
      toast.error(t('backup.toast.settingsError'))
    } finally {
      setAutoSettingsSaving(false)
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }
      if (serverTimezone) opts.timeZone = serverTimezone
      return new Date(dateStr).toLocaleString(locale, opts)
    } catch { return dateStr }
  }

  const isAuto = (filename) => filename.startsWith('auto-backup-')

  return (
    <div className="space-y-3">

      {/* Manual Backups */}
      <MAdminCard>
        <MAdminCardHead
          title={
            <span className="flex items-center gap-2">
              <HardDrive size={15} strokeWidth={2.2} className="flex-none text-m-faint" />
              {t('backup.title')}
            </span>
          }
          hint={t('backup.subtitle')}
          trailing={
            <button
              type="button"
              onClick={loadBackups}
              disabled={isLoading}
              title={t('backup.refresh')}
              aria-label={t('backup.refresh')}
              className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink disabled:opacity-50"
            >
              <RefreshCw size={15} strokeWidth={2.2} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* Upload & Create actions */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleUploadRestore}
        />
        <div className="mb-2 flex items-center gap-2">
          <MAdminButton
            variant="ghost"
            busy={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title={isUploading ? t('backup.uploading') : t('backup.upload')}
          >
            {!isUploading && <Upload size={12} strokeWidth={2.2} />}
            {isUploading ? t('backup.uploading') : t('backup.upload')}
          </MAdminButton>
          <MAdminButton
            busy={isCreating}
            onClick={handleCreate}
            title={isCreating ? t('backup.creating') : t('backup.create')}
          >
            {!isCreating && <Plus size={12} strokeWidth={2.2} />}
            {isCreating ? t('backup.creating') : t('backup.create')}
          </MAdminButton>
        </div>

        {isLoading && backups.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[0.8125rem] text-m-muted">
            <div className="h-5 w-5 rounded-full border-2 border-[color:var(--m-rowbr)] border-t-[color:var(--m-ink)] animate-spin" />
            {t('common.loading')}
          </div>
        ) : backups.length === 0 ? (
          <div className="py-10 text-center text-m-muted">
            <HardDrive size={38} strokeWidth={1.6} className="mx-auto mb-3 opacity-40" />
            <p className="text-[0.8125rem]">{t('backup.empty')}</p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-3 text-[0.8125rem] font-bold text-m-ink underline"
            >
              {t('backup.createFirst')}
            </button>
          </div>
        ) : (
          <div>
            {backups.map((backup, i) => (
              <div
                key={backup.filename}
                className={`flex flex-col gap-2 py-3 ${i === 0 ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[color:var(--m-ic)]">
                    {isAuto(backup.filename)
                      ? <RefreshCw size={16} strokeWidth={2.2} className="text-[color:var(--m-st-info)]" />
                      : <HardDrive size={16} strokeWidth={2.2} className="text-m-muted" />
                    }
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-[0.8125rem] font-bold text-m-ink">{backup.filename}</p>
                      {isAuto(backup.filename) && (
                        <span className="flex-none rounded-full bg-[color:color-mix(in_srgb,var(--m-st-info)_14%,transparent)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold text-[color:var(--m-st-info)]">
                          Auto
                        </span>
                      )}
                    </div>
                    <div className="mt-[2px] flex items-center gap-3 font-geist text-[0.625rem] text-m-faint">
                      <span>{formatDate(backup.created_at)}</span>
                      <span>{formatSize(backup.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-12">
                  <MAdminButton
                    variant="ghost"
                    onClick={() => backupApi.download(backup.filename).catch(() => toast.error(t('backup.toast.downloadError')))}
                  >
                    <Download size={12} strokeWidth={2.2} />
                    {t('backup.download')}
                  </MAdminButton>
                  <MAdminButton
                    variant="ghost"
                    busy={restoringFile === backup.filename}
                    onClick={() => handleRestore(backup.filename)}
                    className="text-[color:var(--m-st-pending)]"
                  >
                    {restoringFile !== backup.filename && <RotateCcw size={12} strokeWidth={2.2} />}
                    {t('backup.restore')}
                  </MAdminButton>
                  <button
                    type="button"
                    onClick={() => handleDelete(backup.filename)}
                    aria-label={t('common.delete')}
                    className="ml-auto flex h-8 w-8 flex-none items-center justify-center rounded-full text-m-faint"
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </MAdminCard>

      {/* Auto-Backup Settings */}
      <MAdminCard>
        <MAdminCardHead
          title={
            <span className="flex items-center gap-2">
              <Clock size={15} strokeWidth={2.2} className="flex-none text-m-faint" />
              {t('backup.auto.title')}
            </span>
          }
          hint={t('backup.auto.subtitle')}
        />

        <div className="space-y-4">
          {/* Enable toggle */}
          <MAdminRow
            first
            title={t('backup.auto.enable')}
            hint={t('backup.auto.enableHint')}
            trailing={
              <MToggle
                checked={autoSettings.enabled}
                ariaLabel={t('backup.auto.enable')}
                onChange={(v) => handleAutoSettingsChange('enabled', v)}
              />
            }
          />

          {autoSettings.enabled && (
            <>
              {/* Interval */}
              <MAdminField label={t('backup.auto.interval')}>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_OPTIONS.map(opt => (
                    <MChip
                      key={opt.value}
                      active={autoSettings.interval === opt.value}
                      onClick={() => handleAutoSettingsChange('interval', opt.value)}
                    >
                      {t(opt.labelKey)}
                    </MChip>
                  ))}
                </div>
              </MAdminField>

              {/* Hour picker (for daily, weekly, monthly) */}
              {autoSettings.interval !== 'hourly' && (
                <MAdminField
                  label={t('backup.auto.hour')}
                  hint={`${t('backup.auto.hourHint', { format: is12h ? '12h' : '24h' })}${serverTimezone ? ` (Timezone: ${serverTimezone})` : ''}`}
                >
                  <select
                    value={String(autoSettings.hour)}
                    onChange={e => handleAutoSettingsChange('hour', parseInt(e.target.value, 10))}
                    className={SELECT_CLASS}
                  >
                    {HOURS.map(h => {
                      let label: string
                      if (is12h) {
                        const period = h >= 12 ? 'PM' : 'AM'
                        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
                        label = `${h12}:00 ${period}`
                      } else {
                        label = `${String(h).padStart(2, '0')}:00`
                      }
                      return <option key={h} value={String(h)}>{label}</option>
                    })}
                  </select>
                </MAdminField>
              )}

              {/* Day of week (for weekly) */}
              {autoSettings.interval === 'weekly' && (
                <MAdminField label={t('backup.auto.dayOfWeek')}>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(opt => (
                      <MChip
                        key={opt.value}
                        active={autoSettings.day_of_week === opt.value}
                        onClick={() => handleAutoSettingsChange('day_of_week', opt.value)}
                      >
                        {t(opt.labelKey)}
                      </MChip>
                    ))}
                  </div>
                </MAdminField>
              )}

              {/* Day of month (for monthly) */}
              {autoSettings.interval === 'monthly' && (
                <MAdminField label={t('backup.auto.dayOfMonth')} hint={t('backup.auto.dayOfMonthHint')}>
                  <select
                    value={String(autoSettings.day_of_month)}
                    onChange={e => handleAutoSettingsChange('day_of_month', parseInt(e.target.value, 10))}
                    className={SELECT_CLASS}
                  >
                    {DAYS_OF_MONTH.map(d => (
                      <option key={d} value={String(d)}>{String(d)}</option>
                    ))}
                  </select>
                </MAdminField>
              )}

              {/* Keep duration */}
              <MAdminField label={t('backup.auto.keepLabel')}>
                <div className="flex flex-wrap gap-2">
                  {KEEP_OPTIONS.map(opt => (
                    <MChip
                      key={opt.value}
                      active={autoSettings.keep_days === opt.value}
                      onClick={() => handleAutoSettingsChange('keep_days', opt.value)}
                    >
                      {t(opt.labelKey)}
                    </MChip>
                  ))}
                </div>
              </MAdminField>
            </>
          )}

          {/* Save button */}
          <div className="flex justify-end border-t border-[color:var(--m-rowbr)] pt-3">
            <MAdminButton
              busy={autoSettingsSaving}
              disabled={autoSettingsSaving || !autoSettingsDirty}
              onClick={handleSaveAutoSettings}
            >
              {!autoSettingsSaving && <Check size={12} strokeWidth={2.2} />}
              {autoSettingsSaving ? t('common.saving') : t('common.save')}
            </MAdminButton>
          </div>
        </div>
      </MAdminCard>

      {/* Restore Warning */}
      <MConfirmSheet
        open={!!restoreConfirm}
        onClose={() => setRestoreConfirm(null)}
        title={t('backup.restoreConfirmTitle')}
        message={
          <>
            <span className="block font-bold text-m-ink">{restoreConfirm?.filename}</span>
            <span className="mt-2 block">{t('backup.restoreWarning')}</span>
          </>
        }
        confirmLabel={t('backup.restoreConfirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={executeRestore}
      >
        <div className="mt-3 rounded-xl border border-[color:color-mix(in_srgb,var(--m-st-danger)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-danger)_10%,transparent)] px-3 py-2 font-geist text-[0.625rem] leading-relaxed text-[color:var(--m-st-danger)]">
          {t('backup.restoreTip')}
        </div>
      </MConfirmSheet>

      {/* Delete confirm */}
      <MConfirmSheet
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('common.delete')}
        message={t('backup.confirm.delete', { name: deleteConfirm ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={executeDelete}
      />
    </div>
  )
}
