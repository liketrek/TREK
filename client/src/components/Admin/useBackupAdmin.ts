import { type ChangeEvent, useEffect, useEffectEvent, useRef, useState } from 'react';

import { backupApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { getApiErrorMessage } from '../../types';
import { useToast } from '../shared/Toast';

export const INTERVAL_OPTIONS = [
  { value: 'hourly', labelKey: 'backup.interval.hourly' },
  { value: 'daily', labelKey: 'backup.interval.daily' },
  { value: 'weekly', labelKey: 'backup.interval.weekly' },
  { value: 'monthly', labelKey: 'backup.interval.monthly' },
];

export const KEEP_OPTIONS = [
  { value: 1, labelKey: 'backup.keep.1day' },
  { value: 3, labelKey: 'backup.keep.3days' },
  { value: 7, labelKey: 'backup.keep.7days' },
  { value: 14, labelKey: 'backup.keep.14days' },
  { value: 30, labelKey: 'backup.keep.30days' },
  { value: 0, labelKey: 'backup.keep.forever' },
];

export const DAYS_OF_WEEK = [
  { value: 0, labelKey: 'backup.dow.sunday' },
  { value: 1, labelKey: 'backup.dow.monday' },
  { value: 2, labelKey: 'backup.dow.tuesday' },
  { value: 3, labelKey: 'backup.dow.wednesday' },
  { value: 4, labelKey: 'backup.dow.thursday' },
  { value: 5, labelKey: 'backup.dow.friday' },
  { value: 6, labelKey: 'backup.dow.saturday' },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);

interface BackupItem {
  filename: string;
  created_at?: string | null;
  size?: number | null;
}

interface RestoreTarget {
  type: 'file' | 'upload';
  filename: string;
  file?: File;
}

// A type alias, not an interface: the API takes it as a plain record.
type AutoBackupSettings = {
  enabled: boolean;
  interval: string;
  keep_days: number;
  hour: number;
  day_of_week: number;
  day_of_month: number;
};

/** A backup's size in KB below one megabyte and in MB above, or a dash when unknown. */
export function formatBackupSize(bytes: number | null | undefined): string {
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Whether a backup file was written by the schedule rather than by hand. */
export const isAutoBackup = (filename: string) => filename.startsWith('auto-backup-');

interface Options {
  /**
   * The phone shell keeps the schedule form as it is when the server answers without a
   * settings block; the desktop shell takes the answer as it comes.
   */
  keepSettingsWhenMissing?: boolean;
}

/**
 * The backup admin behind both shells: the backup list and the auto backup schedule
 * loaded on mount, create, download, delete and restore (from a stored file or an
 * upload) behind their confirm steps, and the schedule form with its save. The desktop
 * and phone shells render their own markup and dialogs over it.
 */
export function useBackupAdmin({ keepSettingsWhenMissing = false }: Options = {}) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [autoSettings, setAutoSettings] = useState<AutoBackupSettings>({
    enabled: false,
    interval: 'daily',
    keep_days: 7,
    hour: 2,
    day_of_week: 0,
    day_of_month: 1,
  });
  const [autoSettingsSaving, setAutoSettingsSaving] = useState(false);
  const [autoSettingsDirty, setAutoSettingsDirty] = useState(false);
  const [serverTimezone, setServerTimezone] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState<RestoreTarget | null>(null);
  // The filename whose delete waits for the answer in the confirm dialog.
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { t, locale } = useTranslation();
  const is12h = useSettingsStore((s) => s.settings.time_format) === '12h';

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const data = await backupApi.list();
      setBackups(data.backups || []);
    } catch {
      toast.error(t('backup.toast.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutoSettings = async () => {
    try {
      const data = await backupApi.getAutoSettings();
      // A 200 without a settings block would blank the whole schedule form.
      if (data.settings || !keepSettingsWhenMissing) setAutoSettings(data.settings);
      if (data.timezone) setServerTimezone(data.timezone);
    } catch {
      /* the schedule form keeps its defaults */
    }
  };

  const loadOnMount = useEffectEvent(() => {
    void loadBackups();
    void loadAutoSettings();
  });
  useEffect(() => {
    loadOnMount();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await backupApi.create();
      toast.success(t('backup.toast.created'));
      await loadBackups();
    } catch {
      toast.error(t('backup.toast.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = (filename: string) =>
    backupApi.download(filename).catch(() => toast.error(t('backup.toast.downloadError')));

  const handleRestore = (filename: string) => {
    setRestoreConfirm({ type: 'file', filename });
  };

  const handleUploadRestore = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setRestoreConfirm({ type: 'upload', filename: file.name, file });
  };

  const executeRestore = async () => {
    if (!restoreConfirm) return;
    const { type, filename, file } = restoreConfirm;
    setRestoreConfirm(null);

    if (type === 'file') {
      setRestoringFile(filename);
      try {
        await backupApi.restore(filename);
        toast.success(t('backup.toast.restored'));
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, t('backup.toast.restoreError')));
        setRestoringFile(null);
      }
    } else {
      setIsUploading(true);
      try {
        await backupApi.uploadRestore(file);
        toast.success(t('backup.toast.restored'));
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, t('backup.toast.uploadError')));
        setIsUploading(false);
      }
    }
  };

  // The question is asked in the confirm dialog; the delete itself runs once it is answered.
  const handleDelete = (filename: string) => {
    setDeleteTarget(filename);
  };

  const executeDelete = async () => {
    const filename = deleteTarget;
    setDeleteTarget(null);
    if (!filename) return;
    try {
      await backupApi.delete(filename);
      toast.success(t('backup.toast.deleted'));
      setBackups((prev) => prev.filter((b) => b.filename !== filename));
    } catch {
      toast.error(t('backup.toast.deleteError'));
    }
  };

  const handleAutoSettingsChange = (key: string, value: unknown) => {
    setAutoSettings((prev) => ({ ...prev, [key]: value }));
    setAutoSettingsDirty(true);
  };

  const handleSaveAutoSettings = async () => {
    setAutoSettingsSaving(true);
    try {
      const data = await backupApi.setAutoSettings(autoSettings);
      if (data.settings || !keepSettingsWhenMissing) setAutoSettings(data.settings);
      setAutoSettingsDirty(false);
      toast.success(t('backup.toast.settingsSaved'));
    } catch {
      toast.error(t('backup.toast.settingsError'));
    } finally {
      setAutoSettingsSaving(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      if (serverTimezone) opts.timeZone = serverTimezone;
      return new Date(dateStr).toLocaleString(locale, opts);
    } catch {
      return dateStr;
    }
  };

  return {
    backups,
    isLoading,
    isCreating,
    restoringFile,
    isUploading,
    autoSettings,
    autoSettingsSaving,
    autoSettingsDirty,
    serverTimezone,
    restoreConfirm,
    setRestoreConfirm,
    deleteTarget,
    setDeleteTarget,
    fileInputRef,
    is12h,
    loadBackups,
    handleCreate,
    handleDownload,
    handleRestore,
    handleUploadRestore,
    executeRestore,
    handleDelete,
    executeDelete,
    handleAutoSettingsChange,
    handleSaveAutoSettings,
    formatSize: formatBackupSize,
    formatDate,
    isAuto: isAutoBackup,
  };
}
