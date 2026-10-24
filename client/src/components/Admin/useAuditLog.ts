import { useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '../../api/client';
import { useTranslation } from '../../i18n';

export interface AuditEntry {
  id: number;
  created_at: string;
  user_id: number | null;
  username: string | null;
  user_email: string | null;
  action: string;
  resource: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
}

const PAGE_SIZE = 100;

/** A details object as one line of JSON, or a dash when there is nothing to show. */
export function fmtAuditDetails(d: Record<string, unknown> | null): string {
  if (!d || Object.keys(d).length === 0) return '—';
  try {
    return JSON.stringify(d);
  } catch {
    return '—';
  }
}

/** Who did it: the username, else the email, else the bare user id. */
export function auditUserLabel(e: AuditEntry): string {
  if (e.username) return e.username;
  if (e.user_email) return e.user_email;
  if (e.user_id != null) return `#${e.user_id}`;
  return '—';
}

/**
 * The audit log behind both admin shells: the first page on mount, a refresh that starts
 * over and a "load more" that appends the next page. The desktop table and the phone
 * cards render their own markup over it.
 */
export function useAuditLog(serverTimezone?: string) {
  const { locale } = useTranslation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Never rendered, only carried between pages, so loadMore cannot capture a page number
  // that is already spent.
  const offsetRef = useRef(0);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await adminApi.auditLog({ limit: PAGE_SIZE, offset: 0 })) as {
        entries: AuditEntry[];
        total: number;
      };
      setEntries(data.entries || []);
      setTotal(data.total ?? 0);
      offsetRef.current = 0;
    } catch {
      setEntries([]);
      setTotal(0);
      offsetRef.current = 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    const nextOffset = offsetRef.current + PAGE_SIZE;
    setLoading(true);
    try {
      const data = (await adminApi.auditLog({ limit: PAGE_SIZE, offset: nextOffset })) as {
        entries: AuditEntry[];
        total: number;
      };
      setEntries((prev) => [...prev, ...(data.entries || [])]);
      setTotal(data.total ?? 0);
      offsetRef.current = nextOffset;
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString(locale, {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: serverTimezone || undefined,
      });
    } catch {
      return iso;
    }
  };

  return {
    entries,
    total,
    loading,
    loadFirstPage,
    loadMore,
    fmtTime,
    fmtDetails: fmtAuditDetails,
    userLabel: auditUserLabel,
  };
}
