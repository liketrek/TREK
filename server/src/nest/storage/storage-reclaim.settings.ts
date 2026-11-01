import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { logWarn } from '../audit/audit-log.logger';
import type { ServedCategory } from './storage.types';
import { storageReclaimReportSchema, type StorageReclaimReport } from '@trek/shared';

import { z } from 'zod';

/**
 * This installation's random id, made on its first boot. A backup restore
 * brings back the app_settings of whatever install made the backup, so the
 * reclaim pass keeps the id it booted with and writes it back over the
 * restored one (StorageReclaimService, on every database reopen). Outside the
 * `storage.` prefix on purpose: the documented reset of the storage config
 * (deleting every `storage.%` row) must not make this install a stranger to
 * the owner markers it wrote.
 */
export const INSTALL_ID_KEY = 'install_id';
/**
 * The admin's switch, stored as the install id it was turned on for: any other
 * value, a restored one from another install included, reads as off.
 */
export const RECLAIM_DELETE_KEY = 'storage.reclaim_delete';
/** The last pass's report, one JSON row (the `storage.usage` pattern). */
export const RECLAIM_REPORT_KEY = 'storage.reclaim_report';
/** The last report of a pass that ran with deletion on, which a check by hand never replaces. */
export const RECLAIM_DELETE_REPORT_KEY = 'storage.reclaim_delete_report';
/**
 * Per category, the unreferenced count an admin confirmed when that was more
 * than a fifth of the category, for the install it was confirmed on.
 */
const RECLAIM_CONFIRMED_KEY = 'storage.reclaim_confirmed';

/** Every row a restore or a foreign database must not carry over into this install's reclaim. */
export const RECLAIM_RESET_KEYS = [
  RECLAIM_DELETE_KEY,
  RECLAIM_REPORT_KEY,
  RECLAIM_DELETE_REPORT_KEY,
  RECLAIM_CONFIRMED_KEY,
] as const;

const confirmationsSchema = z.object({
  installId: z.string(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
});

/** Fail closed: only this install's own id switches deletion on. */
export async function readReclaimDeleteEnabled(
  appSettings: AppSettingsRepository,
  installId: string,
): Promise<boolean> {
  return (await appSettings.getValue(RECLAIM_DELETE_KEY)) === installId;
}

/** A stored report, parsed; null when there is none or it no longer parses (logged, never a 500). */
export async function readReclaimReport(
  appSettings: AppSettingsRepository,
  key: typeof RECLAIM_REPORT_KEY | typeof RECLAIM_DELETE_REPORT_KEY,
): Promise<StorageReclaimReport | null> {
  const value = await appSettings.getValue(key);
  if (value == null) return null;
  try {
    return storageReclaimReportSchema.parse(JSON.parse(value));
  } catch {
    logWarn(`[storage] the stored '${key}' row is unparseable, treating it as never run`);
    return null;
  }
}

/** The confirmed counts of this install; none for a row another install wrote or that no longer parses. */
export async function readReclaimConfirmations(
  appSettings: AppSettingsRepository,
  installId: string,
): Promise<Partial<Record<ServedCategory, number>>> {
  const value = await appSettings.getValue(RECLAIM_CONFIRMED_KEY);
  if (value == null) return {};
  try {
    const parsed = confirmationsSchema.parse(JSON.parse(value));
    return parsed.installId === installId ? (parsed.counts as Partial<Record<ServedCategory, number>>) : {};
  } catch {
    logWarn('[storage] the stored reclaim confirmations are unparseable, treating them as none');
    return {};
  }
}

export async function writeReclaimConfirmations(
  appSettings: AppSettingsRepository,
  installId: string,
  counts: Partial<Record<ServedCategory, number>>,
): Promise<void> {
  await appSettings.upsertOrReplace(RECLAIM_CONFIRMED_KEY, JSON.stringify({ installId, counts }));
}
