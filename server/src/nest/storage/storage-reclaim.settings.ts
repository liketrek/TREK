import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { logWarn } from '../audit/audit-log.logger';
import { storageReclaimReportSchema, type StorageReclaimReport, type StorageReclaimState } from '@trek/shared';

/** The admin's switch: 'true' lets a pass delete. Absent, or anything else, means report only. */
export const RECLAIM_DELETE_KEY = 'storage.reclaim_delete';
/** The last pass's report, one JSON row (the `storage.usage` pattern). */
export const RECLAIM_REPORT_KEY = 'storage.reclaim_report';

/** Fail closed: only the exact stored 'true' switches deletion on. */
export async function readReclaimDeleteEnabled(appSettings: AppSettingsRepository): Promise<boolean> {
  return (await appSettings.getValue(RECLAIM_DELETE_KEY)) === 'true';
}

/** The stored report, parsed; null when there is none or it no longer parses (logged, never a 500). */
async function readReclaimReport(appSettings: AppSettingsRepository): Promise<StorageReclaimReport | null> {
  const value = await appSettings.getValue(RECLAIM_REPORT_KEY);
  if (value == null) return null;
  try {
    return storageReclaimReportSchema.parse(JSON.parse(value));
  } catch {
    logWarn('[storage] the stored reclaim report is unparseable, treating it as never run');
    return null;
  }
}

export async function readReclaimState(appSettings: AppSettingsRepository): Promise<StorageReclaimState> {
  return {
    deleteEnabled: await readReclaimDeleteEnabled(appSettings),
    lastRun: await readReclaimReport(appSettings),
  };
}
