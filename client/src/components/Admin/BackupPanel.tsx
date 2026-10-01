import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { backupApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { Download, Trash2, Plus, RefreshCw, RotateCcw, Upload, Clock, Check, HardDrive, Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import CustomSelect from '../shared/CustomSelect'
import ConfirmDialog from '../shared/ConfirmDialog'
import EmptyState from '../shared/EmptyState'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { Segmented } from '../shared/dialogParts'
import ToggleSwitch from '../Settings/ToggleSwitch'
import {
  ChoiceChips,
  SETTINGS_BUTTON,
  SETTINGS_BUTTON_PRIMARY,
  SETTINGS_ICON_BUTTON,
  SettingRow,
  SettingRows,
  SettingsCard,
  StatusPill,
} from '../Settings/settingsKit'
import { getApiErrorMessage } from '../../types'

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

/** The compact buttons of a backup row: white on a hairline, a size under the card's own. */
const ROW_BUTTON = 'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-card px-2.5 py-1.5 font-medium text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary disabled:cursor-default disabled:opacity-50'

interface BackupItem {
  filename: string
  created_at?: string | null
  size?: number | null
}

interface RestoreTarget {
  type: 'file' | 'upload'
  filename: string
  file?: File
}

export default function BackupPanel() {
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [restoringFile, setRestoringFile] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [autoSettings, setAutoSettings] = useState({ enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 })
  const [autoSettingsSaving, setAutoSettingsSaving] = useState(false)
  const [autoSettingsDirty, setAutoSettingsDirty] = useState(false)
  const [serverTimezone, setServerTimezone] = useState('')
  const [restoreConfirm, setRestoreConfirm] = useState<RestoreTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => { void loadBackups(); void loadAutoSettings() }, [])

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

  const handleRestore = (filename: string) => {
    setRestoreConfirm({ type: 'file', filename })
  }

  const handleUploadRestore = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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

  // The question is asked in the planner's confirm dialog; the delete itself runs once it is answered.
  const handleDelete = (filename: string) => {
    setDeleteTarget(filename)
  }

  const executeDelete = async () => {
    const filename = deleteTarget
    setDeleteTarget(null)
    if (!filename) return
    try {
      await backupApi.delete(filename)
      toast.success(t('backup.toast.deleted'))
      setBackups(prev => prev.filter(b => b.filename !== filename))
    } catch {
      toast.error(t('backup.toast.deleteError'))
    }
  }

  const handleAutoSettingsChange = (key: string, value: unknown) => {
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

  const formatSize = (bytes: number | null | undefined) => {
    if (!bytes) return '-'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string | null | undefined) => {
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

  const isAuto = (filename: string) => filename.startsWith('auto-backup-')

  const headerActions = (
    <>
      <Tooltip label={t('backup.refresh')}>
        <button type="button"
          onClick={loadBackups}
          disabled={isLoading}
          aria-label={t('backup.refresh')}
          className={SETTINGS_ICON_BUTTON}
        >
          <RefreshCw size={14} strokeWidth={2} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </Tooltip>

      {/* Upload & Restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleUploadRestore}
      />
      <button type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={SETTINGS_BUTTON}
        style={fs(12.5, 'body')}
        title={isUploading ? t('backup.uploading') : t('backup.upload')}
      >
        {isUploading
          ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
          : <Upload size={14} strokeWidth={2.2} />}
        <span>{isUploading ? t('backup.uploading') : t('backup.upload')}</span>
      </button>

      <button type="button"
        onClick={handleCreate}
        disabled={isCreating}
        className={SETTINGS_BUTTON_PRIMARY}
        style={fs(12.5, 'body')}
        title={isCreating ? t('backup.creating') : t('backup.create')}
      >
        {isCreating
          ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
          : <Plus size={14} strokeWidth={2.2} />}
        <span>{isCreating ? t('backup.creating') : t('backup.create')}</span>
      </button>
    </>
  )

  let backupList
  if (isLoading && backups.length === 0) {
    backupList = (
      <div className="flex items-center justify-center gap-2 py-10 text-content-faint" style={fs(12.5, 'body')}>
        <Loader2 size={16} strokeWidth={2} className="animate-spin" />
        {t('common.loading')}
      </div>
    )
  } else if (backups.length === 0) {
    backupList = (
      <EmptyState
        title={t('backup.empty')}
        size={84}
        compact
        surface="var(--bg-secondary)"
        className="!py-6"
        action={
          <button type="button" onClick={handleCreate} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
            <Plus size={14} strokeWidth={2.2} />
            {t('backup.createFirst')}
          </button>
        }
      />
    )
  } else {
    backupList = (
      <SettingRows>
        {backups.map(backup => {
          const auto = isAuto(backup.filename)
          const restoring = restoringFile === backup.filename
          return (
            <div key={backup.filename} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-muted">
                {auto
                  ? <RefreshCw size={15} strokeWidth={2} />
                  : <HardDrive size={15} strokeWidth={2} />}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="m-0 truncate font-geist font-semibold text-content" style={fs(13, 'body')}>{backup.filename}</p>
                  {auto && <StatusPill>Auto</StatusPill>}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-geist tabular-nums text-content-faint" style={fs(11.5)}>
                  <span>{formatDate(backup.created_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatSize(backup.size)}</span>
                </div>
              </div>
              <div className="flex flex-none items-center gap-1.5">
                <button type="button"
                  onClick={() => backupApi.download(backup.filename).catch(() => toast.error(t('backup.toast.downloadError')))}
                  className={ROW_BUTTON}
                  style={fs(12, 'body')}
                >
                  <Download size={13} strokeWidth={2.2} />
                  {t('backup.download')}
                </button>
                <button type="button"
                  onClick={() => handleRestore(backup.filename)}
                  disabled={restoring}
                  className={ROW_BUTTON}
                  style={fs(12, 'body')}
                >
                  {restoring
                    ? <Loader2 size={13} strokeWidth={2.2} className="animate-spin text-warning" />
                    : <RotateCcw size={13} strokeWidth={2.2} className="text-warning" />}
                  {t('backup.restore')}
                </button>
                <Tooltip label={t('common.delete')}>
                  <button type="button"
                    onClick={() => handleDelete(backup.filename)}
                    aria-label={t('common.delete')}
                    className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </Tooltip>
              </div>
            </div>
          )
        })}
      </SettingRows>
    )
  }

  const hourOptions = HOURS.map(h => {
    let label: string
    if (is12h) {
      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      label = `${h12}:00 ${period}`
    } else {
      label = `${String(h).padStart(2, '0')}:00`
    }
    return { value: String(h), label }
  })

  return (
    <div className="flex flex-col">

      {/* Manual Backups */}
      <SettingsCard
        icon={HardDrive}
        title={t('backup.title')}
        hint={t('backup.subtitle')}
        action={headerActions}
      >
        {backupList}
      </SettingsCard>

      {/* Auto-Backup Settings */}
      <SettingsCard icon={Clock} title={t('backup.auto.title')} hint={t('backup.auto.subtitle')}>
        <SettingRows>
          {/* The whole row is the switch's label, so a click on the text flips it too. */}
          <label className="flex cursor-pointer items-center gap-4 px-3.5 py-3">
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-content" style={fs(13, 'body')}>{t('backup.auto.enable')}</span>
              <span className="mt-0.5 block leading-snug text-content-faint" style={fs(11.5)}>{t('backup.auto.enableHint')}</span>
            </span>
            <ToggleSwitch
              on={!!autoSettings.enabled}
              onToggle={() => handleAutoSettingsChange('enabled', !autoSettings.enabled)}
              label={t('backup.auto.enable')}
            />
          </label>

          {autoSettings.enabled && (
            <>
              <SettingRow
                label={t('backup.auto.interval')}
                control={
                  <Segmented<string>
                    label={t('backup.auto.interval')}
                    value={autoSettings.interval}
                    onChange={v => handleAutoSettingsChange('interval', v)}
                    options={INTERVAL_OPTIONS.map(opt => ({ value: opt.value, label: t(opt.labelKey) }))}
                  />
                }
              />

              {/* Hour picker (for daily, weekly, monthly) */}
              {autoSettings.interval !== 'hourly' && (
                <SettingRow
                  label={t('backup.auto.hour')}
                  hint={<>{t('backup.auto.hourHint', { format: is12h ? '12h' : '24h' })}{serverTimezone ? ` (Timezone: ${serverTimezone})` : ''}</>}
                  control={
                    <div className="w-40">
                      <CustomSelect
                        value={String(autoSettings.hour)}
                        onChange={v => handleAutoSettingsChange('hour', Number.parseInt(String(v), 10))}
                        size="sm"
                        options={hourOptions}
                      />
                    </div>
                  }
                />
              )}

              {/* Day of week (for weekly) */}
              {autoSettings.interval === 'weekly' && (
                <SettingRow
                  stacked
                  label={t('backup.auto.dayOfWeek')}
                  control={
                    <ChoiceChips<string>
                      label={t('backup.auto.dayOfWeek')}
                      value={String(autoSettings.day_of_week)}
                      onChange={v => handleAutoSettingsChange('day_of_week', Number(v))}
                      options={DAYS_OF_WEEK.map(opt => ({ value: String(opt.value), label: t(opt.labelKey) }))}
                    />
                  }
                />
              )}

              {/* Day of month (for monthly) */}
              {autoSettings.interval === 'monthly' && (
                <SettingRow
                  label={t('backup.auto.dayOfMonth')}
                  hint={t('backup.auto.dayOfMonthHint')}
                  control={
                    <div className="w-28">
                      <CustomSelect
                        value={String(autoSettings.day_of_month)}
                        onChange={v => handleAutoSettingsChange('day_of_month', Number.parseInt(String(v), 10))}
                        size="sm"
                        options={DAYS_OF_MONTH.map(d => ({ value: String(d), label: String(d) }))}
                      />
                    </div>
                  }
                />
              )}

              {/* Keep duration */}
              <SettingRow
                stacked
                label={t('backup.auto.keepLabel')}
                control={
                  <ChoiceChips<string>
                    label={t('backup.auto.keepLabel')}
                    value={String(autoSettings.keep_days)}
                    onChange={v => handleAutoSettingsChange('keep_days', Number(v))}
                    options={KEEP_OPTIONS.map(opt => ({ value: String(opt.value), label: t(opt.labelKey) }))}
                  />
                }
              />
            </>
          )}
        </SettingRows>

        {/* Save button */}
        <div className="flex justify-end">
          <button type="button"
            onClick={handleSaveAutoSettings}
            disabled={autoSettingsSaving || !autoSettingsDirty}
            className={SETTINGS_BUTTON_PRIMARY}
            style={fs(13, 'body')}
          >
            {autoSettingsSaving
              ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
              : <Check size={14} strokeWidth={2.2} />}
            {autoSettingsSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </SettingsCard>

      {/* Restore warning */}
      <ConfirmDialog
        isOpen={restoreConfirm !== null}
        onClose={() => setRestoreConfirm(null)}
        onConfirm={executeRestore}
        title={t('backup.restoreConfirmTitle')}
        message={t('backup.restoreWarning')}
        confirmLabel={t('backup.restoreConfirm')}
        danger
      >
        {restoreConfirm && (
          <>
            <div className="flex min-w-0 items-center gap-2.5 rounded-[12px] border border-edge-faint bg-surface-secondary px-3 py-2.5">
              <HardDrive size={15} strokeWidth={2} className="flex-none text-content-muted" />
              <span className="min-w-0 truncate font-geist font-semibold text-content" style={fs(12.5, 'body')}>{restoreConfirm.filename}</span>
            </div>
            <p className="m-0 rounded-[12px] bg-warning-soft px-3 py-2.5 leading-normal text-warning" style={fs(12, 'body')}>
              {t('backup.restoreTip')}
            </p>
          </>
        )}
      </ConfirmDialog>

      {/* Delete question */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={t('common.delete')}
        message={deleteTarget ? t('backup.confirm.delete', { name: deleteTarget }) : ''}
        confirmLabel={t('common.delete')}
        danger
      />
    </div>
  )
}
