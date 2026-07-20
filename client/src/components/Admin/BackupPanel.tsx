import { useState, useEffect, useRef } from 'react'
import { backupApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { Download, Trash2, Plus, RefreshCw, RotateCcw, Upload, Clock, Check, HardDrive, AlertTriangle, Cloud } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { MASKED_SECRET } from '@trek/shared'
import { useSettingsStore } from '../../store/settingsStore'
import CustomSelect from '../shared/CustomSelect'
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

export default function BackupPanel() {
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
  const [target, setTarget] = useState(null)
  const [targetDirty, setTargetDirty] = useState(false)
  const [targetSaving, setTargetSaving] = useState(false)
  const [targetTesting, setTargetTesting] = useState(false)
  const [targetSyncing, setTargetSyncing] = useState(false)
  const [remoteListError, setRemoteListError] = useState('')
  const fileInputRef = useRef(null)
  const toast = useToast()
  const { t, language, locale } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'

  const loadBackups = async () => {
    setIsLoading(true)
    try {
      const data = await backupApi.list()
      setBackups(data.backups || [])
      setRemoteListError(data.remoteError || '')
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

  const loadTarget = async () => {
    try {
      const data = await backupApi.getTarget()
      // The server never sends the secret back; show the mask when one is
      // stored so an unedited save round-trips it instead of clearing it.
      setTarget({ ...data, secret_access_key: data.secret_access_key_set ? MASKED_SECRET : '' })
      setTargetDirty(false)
    } catch {}
  }

  useEffect(() => { loadBackups(); loadAutoSettings(); loadTarget() }, [])

  const handleTargetChange = (key, value) => {
    setTarget(prev => ({ ...prev, [key]: value }))
    setTargetDirty(true)
  }

  const handleSaveTarget = async () => {
    setTargetSaving(true)
    try {
      const data = await backupApi.setTarget({
        enabled: target.enabled,
        endpoint: target.endpoint,
        region: target.region,
        bucket: target.bucket,
        prefix: target.prefix,
        access_key_id: target.access_key_id,
        secret_access_key: target.secret_access_key,
        force_path_style: target.force_path_style,
        require_tls: target.require_tls,
      })
      setTarget({ ...data, secret_access_key: data.secret_access_key_set ? MASKED_SECRET : '' })
      setTargetDirty(false)
      toast.success(t('backup.target.saved'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('backup.target.saveFailed')))
    } finally {
      setTargetSaving(false)
    }
  }

  const handleTestTarget = async () => {
    setTargetTesting(true)
    try {
      const res = await backupApi.testTarget()
      // A probe that reached the bucket but could not clean up answers
      // success with a warning — surface it rather than a bare "works".
      if (res.success) {
        res.error ? toast.error(res.error) : toast.success(t('backup.target.testSuccess'))
      } else {
        toast.error(t('backup.target.testFailed', { error: res.error || '' }))
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('backup.target.testFailed', { error: '' })))
    } finally {
      setTargetTesting(false)
    }
  }

  const handleSyncTarget = async () => {
    setTargetSyncing(true)
    try {
      const res = await backupApi.syncTarget()
      if (res.total === 0) {
        toast.success(t('backup.target.syncNothing'))
      } else if (res.failed > 0) {
        toast.error(t('backup.target.syncPartial', {
          uploaded: res.uploaded, skipped: res.skipped, failed: res.failed, error: res.errors[0] || '',
        }))
      } else {
        toast.success(t('backup.target.syncDone', { uploaded: res.uploaded, skipped: res.skipped }))
      }
      await loadBackups()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('backup.target.saveFailed')))
    } finally {
      setTargetSyncing(false)
    }
  }

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

  const handleRestore = (backup) => {
    // An S3-only archive has no file on disk — it must be fetched from the
    // target first, which is a different endpoint.
    // Explicit `=== false` rather than a truthiness test: an entry without the
    // flag predates the merged list and was, by definition, a local file.
    setRestoreConfirm({ type: backup.local === false ? 'remote' : 'file', filename: backup.filename })
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

    if (type === 'file' || type === 'remote') {
      setRestoringFile(filename)
      try {
        await (type === 'remote' ? backupApi.restoreRemote(filename) : backupApi.restore(filename))
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

  const handleDelete = async (filename) => {
    if (!confirm(t('backup.confirm.delete', { name: filename }))) return
    try {
      const res = await backupApi.delete(filename)
      // The local copy is gone but the mirrored one may not be — saying
      // "deleted" then would leave a restorable archive behind.
      if (res?.remoteError) {
        toast.error(t('backup.toast.deletedRemoteFailed', { error: res.remoteError }))
      } else {
        toast.success(t('backup.toast.deleted'))
      }
      await loadBackups()
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
    <div className="flex flex-col gap-6">

      {/* Manual Backups */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="font-semibold text-content">{t('backup.title')}</h2>
              <p className="text-xs mt-1 text-content-muted">{t('backup.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadBackups}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('backup.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Upload & Restore */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleUploadRestore}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
              title={isUploading ? t('backup.uploading') : t('backup.upload')}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isUploading ? t('backup.uploading') : t('backup.upload')}</span>
            </button>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-900 text-sm font-medium disabled:opacity-60"
              title={isCreating ? t('backup.creating') : t('backup.create')}
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isCreating ? t('backup.creating') : t('backup.create')}</span>
            </button>
          </div>
        </div>

        {/* The list degrades to local-only when the bucket is unreachable — say
            so, or the missing cloud badges read as "never uploaded". */}
        {remoteListError && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">{t('backup.remoteListError')}</p>
          </div>
        )}

        {isLoading && backups.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-slate-700 rounded-full animate-spin mr-2" />
            {t('common.loading')}
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <HardDrive className="w-10 h-10 mb-3 mx-auto opacity-40" />
            <p className="text-sm">{t('backup.empty')}</p>
            <button onClick={handleCreate} className="mt-4 text-slate-700 text-sm hover:underline">
              {t('backup.createFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {backups.map(backup => (
              <div key={backup.filename} className="flex items-center gap-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {isAuto(backup.filename)
                    ? <RefreshCw className="w-4 h-4 text-blue-500" />
                    : <HardDrive className="w-4 h-4 text-gray-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 truncate">{backup.filename}</p>
                    {isAuto(backup.filename) && (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 whitespace-nowrap">Auto</span>
                    )}
                    {backup.remote && (
                      <span
                        title={backup.local ? t('backup.location.both') : t('backup.location.remoteOnly')}
                        className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 whitespace-nowrap"
                      >
                        <Cloud className="w-3 h-3" />
                        {backup.local ? t('backup.location.remote') : t('backup.location.remoteOnly')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{formatDate(backup.created_at)}</span>
                    <span className="text-xs text-gray-400">{formatSize(backup.size)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {backup.local !== false && (
                    <button
                      onClick={() => backupApi.download(backup.filename).catch(() => toast.error(t('backup.toast.downloadError')))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('backup.download')}
                    </button>
                  )}
                  <button
                    onClick={() => handleRestore(backup)}
                    disabled={restoringFile === backup.filename}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 disabled:opacity-60"
                  >
                    {restoringFile === backup.filename
                      ? <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      : <RotateCcw className="w-3.5 h-3.5" />
                    }
                    {t('backup.restore')}
                  </button>
                  {/* Always offered: an S3-only archive is deletable too —
                      the server removes whichever copies exist. */}
                  <button
                    onClick={() => handleDelete(backup.filename)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Backup Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-gray-400" />
          <div>
            <h2 className="font-semibold text-content">{t('backup.auto.title')}</h2>
            <p className="text-xs mt-1 text-content-muted">{t('backup.auto.subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Enable toggle */}
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-900">{t('backup.auto.enable')}</span>
              <p className="text-xs text-gray-500 mt-0.5">{t('backup.auto.enableHint')}</p>
            </div>
            <button
              onClick={() => handleAutoSettingsChange('enabled', !autoSettings.enabled)}
              className="relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: autoSettings.enabled ? 'var(--text-primary)' : 'var(--border-primary)' }}
            >
              <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: autoSettings.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </label>

          {autoSettings.enabled && (
            <>
              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('backup.auto.interval')}</label>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleAutoSettingsChange('interval', opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        autoSettings.interval === opt.value
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hour picker (for daily, weekly, monthly) */}
              {autoSettings.interval !== 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('backup.auto.hour')}</label>
                  <CustomSelect
                    value={String(autoSettings.hour)}
                    onChange={v => handleAutoSettingsChange('hour', parseInt(String(v), 10))}
                    size="sm"
                    options={HOURS.map(h => {
                      let label: string
                      if (is12h) {
                        const period = h >= 12 ? 'PM' : 'AM'
                        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
                        label = `${h12}:00 ${period}`
                      } else {
                        label = `${String(h).padStart(2, '0')}:00`
                      }
                      return { value: String(h), label }
                    })}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t('backup.auto.hourHint', { format: is12h ? '12h' : '24h' })}{serverTimezone ? ` (Timezone: ${serverTimezone})` : ''}
                  </p>
                </div>
              )}

              {/* Day of week (for weekly) */}
              {autoSettings.interval === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('backup.auto.dayOfWeek')}</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleAutoSettingsChange('day_of_week', opt.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          autoSettings.day_of_week === opt.value
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of month (for monthly) */}
              {autoSettings.interval === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('backup.auto.dayOfMonth')}</label>
                  <CustomSelect
                    value={String(autoSettings.day_of_month)}
                    onChange={v => handleAutoSettingsChange('day_of_month', parseInt(String(v), 10))}
                    size="sm"
                    options={DAYS_OF_MONTH.map(d => ({ value: String(d), label: String(d) }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('backup.auto.dayOfMonthHint')}</p>
                </div>
              )}

              {/* Keep duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('backup.auto.keepLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {KEEP_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleAutoSettingsChange('keep_days', opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        autoSettings.keep_days === opt.value
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={handleSaveAutoSettings}
              disabled={autoSettingsSaving || !autoSettingsDirty}
              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-lg hover:bg-slate-900 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {autoSettingsSaving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Check className="w-4 h-4" />
              }
              {autoSettingsSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>

      {/* External S3 backup target */}
      {target && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Cloud className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="font-semibold text-content">{t('backup.target.title')}</h2>
              <p className="text-xs mt-1 text-content-muted">{t('backup.target.description')}</p>
            </div>
          </div>

          {target.managed_by_env && (
            <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">{t('backup.target.managedByEnv')}</p>
            </div>
          )}

          {/* What actually leaves the box. Stated up front rather than buried in
              the wiki: the archive carries every secret the instance holds, and
              nothing encrypts it before transmission yet. */}
          <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">{t('backup.target.contentWarning')}</p>
          </div>

          <fieldset disabled={target.managed_by_env} className="flex flex-col gap-5 disabled:opacity-60">
            {/* Enable toggle */}
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm font-medium text-gray-900 min-w-0">{t('backup.target.enabled')}</span>
              <button
                type="button"
                onClick={() => handleTargetChange('enabled', !target.enabled)}
                className="relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ background: target.enabled ? 'var(--text-primary)' : 'var(--border-primary)' }}
              >
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: target.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </label>

            <div>
              <label htmlFor="s3-endpoint" className="block text-sm font-medium text-gray-700 mb-2">{t('backup.target.endpoint')}</label>
              <input
                id="s3-endpoint"
                type="url"
                value={target.endpoint}
                onChange={e => handleTargetChange('endpoint', e.target.value)}
                placeholder="https://s3.example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{t('backup.target.endpointHint')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="s3-bucket" className="block text-sm font-medium text-gray-700 mb-2">{t('backup.target.bucket')}</label>
                <input
                  id="s3-bucket"
                  type="text"
                  value={target.bucket}
                  onChange={e => handleTargetChange('bucket', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="s3-region" className="block text-sm font-medium text-gray-700 mb-2">{t('backup.target.region')}</label>
                <input
                  id="s3-region"
                  type="text"
                  value={target.region}
                  onChange={e => handleTargetChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="s3-prefix" className="block text-sm font-medium text-gray-700 mb-2">{t('backup.target.prefix')}</label>
              <input
                id="s3-prefix"
                type="text"
                value={target.prefix}
                onChange={e => handleTargetChange('prefix', e.target.value)}
                placeholder="trek/backups/"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{t('backup.target.prefixHint')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="s3-access-key-id" className="block text-sm font-medium text-gray-700 mb-2">{t('backup.target.accessKeyId')}</label>
                <input
                  id="s3-access-key-id"
                  type="text"
                  value={target.access_key_id}
                  onChange={e => handleTargetChange('access_key_id', e.target.value)}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="s3-secret-access-key" className="block text-sm font-medium text-gray-700 mb-2">{t('backup.target.secretAccessKey')}</label>
                <input
                  id="s3-secret-access-key"
                  type="password"
                  value={target.secret_access_key}
                  onChange={e => handleTargetChange('secret_access_key', e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                {target.secret_access_key_set && (
                  <p className="text-xs text-gray-400 mt-1">{t('backup.target.secretKept')}</p>
                )}
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-900">{t('backup.target.forcePathStyle')}</span>
                <p className="text-xs text-gray-500 mt-0.5">{t('backup.target.forcePathStyleHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => handleTargetChange('force_path_style', !target.force_path_style)}
                className="relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ background: target.force_path_style ? 'var(--text-primary)' : 'var(--border-primary)' }}
              >
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: target.force_path_style ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm font-medium text-gray-900 min-w-0">{t('backup.target.requireTls')}</span>
              <button
                type="button"
                onClick={() => handleTargetChange('require_tls', !target.require_tls)}
                className="relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ background: target.require_tls ? 'var(--text-primary)' : 'var(--border-primary)' }}
              >
                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: target.require_tls ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </label>

            {/* Filling the form in and testing it successfully does NOT start
                mirroring — the toggle above does. Without this notice that gap
                is silent, and the admin only finds out when they need the
                off-box copy and it was never there. */}
            {!target.enabled && target.bucket && target.access_key_id && target.secret_access_key_set && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">{t('backup.target.configuredButOff')}</p>
              </div>
            )}

            {/* Plaintext transport is opt-in and says plainly what it costs. */}
            {!target.require_tls && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">{t('backup.target.requireTlsWarning')}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSyncTarget}
                disabled={targetSyncing || !target.enabled}
                title={t('backup.target.syncHint')}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                {targetSyncing
                  ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <Upload className="w-4 h-4" />
                }
                {targetSyncing ? t('backup.target.syncing') : t('backup.target.sync')}
              </button>
              <button
                type="button"
                onClick={handleTestTarget}
                disabled={targetTesting}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                {targetTesting
                  ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <RefreshCw className="w-4 h-4" />
                }
                {targetTesting ? t('backup.target.testing') : t('backup.target.test')}
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                disabled={targetSaving || !targetDirty}
                className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-lg hover:bg-slate-900 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {targetSaving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Check className="w-4 h-4" />
                }
                {targetSaving ? t('common.saving') : t('backup.target.save')}
              </button>
            </div>
          </fieldset>
        </div>
      )}

      {/* Restore Warning Modal */}
      {restoreConfirm && (
        <div
          className="bg-[rgba(0,0,0,0.5)]"
          style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setRestoreConfirm(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 440, borderRadius: 16, overflow: 'hidden' }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            {/* Red header */}
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="bg-[rgba(255,255,255,0.2)]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white" style={{ margin: 0, fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 700 }}>
                  {t('backup.restoreConfirmTitle')}
                </h3>
                <p className="text-[rgba(255,255,255,0.8)]" style={{ margin: '2px 0 0', fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                  {restoreConfirm.filename}
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px' }}>
              <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', lineHeight: 1.6, margin: 0 }}>
                {t('backup.restoreWarning')}
              </p>

              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: 1.5 }}
                className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              >
                {t('backup.restoreTip')}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRestoreConfirm(null)}
                className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ padding: '9px 20px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={executeRestore}
                className="bg-[#dc2626] text-white"
                style={{ padding: '9px 20px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
              >
                {t('backup.restoreConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
