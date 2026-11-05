import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { logWarn } from '../audit/audit-log.logger';
import type { ServedCategory } from './storage.types';
import { storageReclaimReportSchema, type StorageReclaimReport } from '@trek/shared';

import { z } from 'zod';

/**
 * The install id the database was last reconciled with: a copy of the one in
 * `data/.trek-install-id` (StorageInstallService), which no backup carries and
 * no restore writes. A database whose row names another id came from another
 * installation (a restore, a clone, a copied file), and its reclaim state is
 * reset before anything reads it. Outside the `storage.` prefix on purpose:
 * the documented reset of the storage config (deleting every `storage.%` row)
 * must not read as a database from elsewhere.
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
 * than a fifth of the category, with when, for the install it was confirmed on.
 */
const RECLAIM_CONFIRMED_KEY = 'storage.reclaim_confirmed';

/** More unreferenced than this share of a category waits for an admin's confirmation before anything goes. */
const CONFIRM_SHARE = 0.2;
/** How long a confirmation lets a pass delete, unless the share fell under the line before. */
const CONFIRM_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Every row a restore or a foreign database must not carry over into this install's reclaim. */
export const RECLAIM_RESET_KEYS = [
  RECLAIM_DELETE_KEY,
  RECLAIM_REPORT_KEY,
  RECLAIM_DELETE_REPORT_KEY,
  RECLAIM_CONFIRMED_KEY,
] as const;

const confirmationsSchema = z.object({
  installId: z.string(),
  categories: z.record(
    z.string(),
    z.object({ count: z.number().int().nonnegative(), confirmedAt: z.number().int().nonnegative() }),
  ),
});

/** One admin confirmation: the unreferenced count the admin was shown, and when (epoch ms). */
interface ReclaimConfirmation {
  count: number;
  confirmedAt: number;
}

export type ReclaimConfirmations = Partial<Record<ServedCategory, ReclaimConfirmation>>;

/** More of the category is unreferenced than a fifth of it. */
export function overConfirmShare(unreferenced: number, objects: number): boolean {
  return unreferenced > objects * CONFIRM_SHARE;
}

/** The confirmation ran out: older than CONFIRM_TTL_MS. */
export function confirmationExpired(confirmation: ReclaimConfirmation, now: number): boolean {
  return now - confirmation.confirmedAt >= CONFIRM_TTL_MS;
}

/**
 * A live confirmation covers this many unreferenced objects: up to one and a
 * half times the count the admin confirmed, and at least 100 more, so the
 * orphans a busy instance adds before the backlog has drained do not undo it,
 * while a surge well past it waits for a new one.
 */
export function confirmationCovers(
  confirmation: ReclaimConfirmation | undefined,
  unreferenced: number,
  now: number,
): boolean {
  if (!confirmation || confirmationExpired(confirmation, now)) return false;
  return unreferenced <= Math.max(confirmation.count * 1.5, confirmation.count + 100);
}

/**
 * The count the admin was shown is not the one the last report holds: more
 * than a tenth of it, or more than 50 objects, apart. Then a pass ran since
 * the page loaded, and the admin would confirm a number they never saw.
 */
export function confirmationStale(shown: number, current: number): boolean {
  const apart = Math.abs(current - shown);
  return apart > shown * 0.1 || apart > 50;
}

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

/** The confirmations of this install; none for a row another install wrote or that no longer parses. */
export async function readReclaimConfirmations(
  appSettings: AppSettingsRepository,
  installId: string,
): Promise<ReclaimConfirmations> {
  const value = await appSettings.getValue(RECLAIM_CONFIRMED_KEY);
  if (value == null) return {};
  try {
    const parsed = confirmationsSchema.parse(JSON.parse(value));
    return parsed.installId === installId ? (parsed.categories as ReclaimConfirmations) : {};
  } catch {
    logWarn('[storage] the stored reclaim confirmations are unparseable, treating them as none');
    return {};
  }
}

/** Stores this install's confirmations; none left drops the row. */
export async function writeReclaimConfirmations(
  appSettings: AppSettingsRepository,
  installId: string,
  categories: ReclaimConfirmations,
): Promise<void> {
  if (Object.keys(categories).length === 0) {
    await appSettings.deleteValue(RECLAIM_CONFIRMED_KEY);
    return;
  }
  await appSettings.upsertOrReplace(RECLAIM_CONFIRMED_KEY, JSON.stringify({ installId, categories }));
}
