import type { ServiceAllowance, ServiceIdentityStatus, ServiceQuotaView } from '@trek/shared';
import type { TranslationFn } from '../../types';
import { formatClockTime } from '../../utils/formatters';

/**
 * What the allowance panels (desktop ServiceIdentityPanel, phone MAdminServiceQuota)
 * read from the service identity status. Pure, so both views show the same thing.
 */

/** How much of a service's day is left: plenty, below a tenth, or nothing. */
export type QuotaLevel = 'ok' | 'low' | 'out';

export function quotaLevel(quota: ServiceQuotaView): QuotaLevel {
  if (quota.remaining === 0) return 'out';
  return quota.remaining < quota.limit / 10 ? 'low' : 'ok';
}

/** The share of the day used, for the bar; a quota without a limit reads as full. */
export function quotaShare(quota: ServiceQuotaView): number {
  return quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 100;
}

/** The clock time the counts start again, in the user's format; one for all services, which share the day. */
export function quotaResetClock(status: ServiceIdentityStatus | null, is12h: boolean): string | null {
  const at = status?.services.find((s) => s.quota)?.quota?.resetAt;
  if (!at) return null;
  const reset = new Date(at);
  return formatClockTime(
    `${String(reset.getHours()).padStart(2, '0')}:${String(reset.getMinutes()).padStart(2, '0')}`,
    is12h
  );
}

/** A service that is not in use, or whose count the service did not report, says so under its row. */
export function allowanceNote(t: TranslationFn, allowance: ServiceAllowance): string | null {
  if (!allowance.inUse) return t('admin.trekApi.quota.notInUse');
  return allowance.quota ? null : t('admin.trekApi.quota.unavailable');
}

/** A line about the identity itself, when it is not simply connected (or could not be read). */
export function identityHint(t: TranslationFn, status: ServiceIdentityStatus | null, failed: boolean): string | null {
  if (!status) return failed ? t('admin.trekApi.quota.unavailable') : null;
  return status.state === 'connected' ? null : t(`admin.trekApi.quota.hint.${status.state}`);
}

/** A new key can be asked for unless the operator holds it (managed, environment) or the services are off. */
export function canRegenerateKey(status: ServiceIdentityStatus | null, managed: boolean): boolean {
  return !managed && status !== null && status.keySource !== 'env' && status.state !== 'off';
}
