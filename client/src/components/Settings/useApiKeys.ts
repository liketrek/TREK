import { PUBLIC_API_SCOPES, type PublicApiScope } from '@trek/shared';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Briefcase, CalendarDays, Hotel, MapPin, Star, StickyNote, Ticket, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { apiKeysRepo } from '../../repo/apiKeysRepo';
import { formatDisplayDate } from '../../utils/dateFormat';
import { useToast } from '../shared/Toast';

/**
 * Keys for the public API, the credential a user hands to other software that
 * should read their trips: the list, minting one (shown once, then only its
 * prefix), deleting one, and copying the key or the endpoint. Shared by the
 * desktop ApiKeysSection and the phone MApiKeysSection. Its own state rather
 * than the MCP hook's, so it works on an instance with MCP switched off.
 */
export interface ApiKey {
  id: number;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  /** 'all' for every key minted before scopes existed, and for any key created without narrowing. */
  scope_mode?: 'all' | 'limited';
  scopes?: PublicApiScope[];
}

/** The server refuses an eleventh key (`TokenService.createToken`). */
export const MAX_API_KEYS = 10;

/** The glyph each area already wears elsewhere in the app, so the list reads like the planner. */
export const API_SCOPE_ICONS: Record<PublicApiScope, LucideIcon> = {
  trips: Briefcase,
  days: CalendarDays,
  places: MapPin,
  notes: StickyNote,
  reservations: Ticket,
  accommodations: Hotel,
  travellers: Users,
  'bucket-list': Star,
  stats: BarChart3,
};

/** SQLite hands out "YYYY-MM-DD HH:MM:SS" in UTC, which Safari will not parse as it stands. */
export function formatApiKeyStamp(ts: string, locale: string, dateFormat: string): string {
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? ts : formatDisplayDate(d, locale, {}, dateFormat);
}

export function useApiKeys() {
  const { t } = useTranslation();
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  /** A failed load must not read as "you have no keys": that sends people off minting duplicates. */
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  /** The raw key, held only until the dialog closes: the server keeps a hash. */
  const [created, setCreated] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copied, setCopied] = useState<'key' | 'endpoint' | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /**
   * What the new key may read. Starts as everything, because that is what a key
   * did before this existed and what most integrations want: narrowing is a
   * deliberate act, and the dialog should not make the common case work harder.
   */
  const [newScopes, setNewScopes] = useState<Set<PublicApiScope>>(new Set(PUBLIC_API_SCOPES));

  const endpoint = `${window.location.origin}/api/v1`;
  const atLimit = keys.length >= MAX_API_KEYS;
  const allSelected = newScopes.size === PUBLIC_API_SCOPES.length;
  const canCreate = !!newName.trim() && !creating && newScopes.size > 0;

  useEffect(() => {
    let cancelled = false;
    apiKeysRepo
      .list()
      .then((d) => {
        if (cancelled) return;
        setKeys(d.tokens || []);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('failed');
      });
    return () => {
      cancelled = true;
      clearTimeout(copiedTimer.current);
    };
  }, []);

  const handleCreate = async () => {
    // Enter in the name field arrives here past the button's disabled state, and
    // an empty selection must not fall through to the "no narrowing" branch
    // below, which would mint a key that reads everything.
    if (!canCreate) return;
    setCreating(true);
    try {
      // All of them selected means "no narrowing", which is what the server
      // stores as `all`: sending the full list would record it as a limited key
      // that happens to allow everything, and a section added in a later version
      // would then be refused for a key nobody meant to restrict.
      const narrowed = allSelected ? undefined : [...newScopes];
      const d = await apiKeysRepo.create(newName.trim(), narrowed);
      setCreated(d.token.raw_token);
      setKeys((prev) => [
        {
          id: d.token.id,
          name: d.token.name,
          token_prefix: d.token.token_prefix,
          created_at: d.token.created_at,
          last_used_at: null,
          scope_mode: d.token.scope_mode,
          scopes: d.token.scopes,
        },
        ...prev,
      ]);
      setNewName('');
    } catch {
      toast.error(t('settings.apiKeys.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiKeysRepo.delete(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success(t('settings.apiKeys.deleted'));
    } catch {
      toast.error(t('settings.apiKeys.deleteFailed'));
    }
  };

  const handleCopy = async (text: string, what: 'key' | 'endpoint') => {
    try {
      // Absent on a plain-http origin, which is exactly where a self-run
      // instance on the LAN tends to live.
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopied(what);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t('settings.apiKeys.copyFailed'));
    }
  };

  const resetForm = () => {
    setCreated(null);
    setCopied(null);
    setNewName('');
    setNewScopes(new Set(PUBLIC_API_SCOPES));
  };

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const toggleScope = (scope: PublicApiScope) => {
    setNewScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  return {
    keys,
    loadState,
    modalOpen,
    newName,
    setNewName,
    creating,
    created,
    deleteId,
    setDeleteId,
    copied,
    newScopes,
    setNewScopes,
    endpoint,
    atLimit,
    allSelected,
    canCreate,
    handleCreate,
    handleDelete,
    handleCopy,
    openModal,
    closeModal,
    toggleScope,
  };
}
