import { Check, Loader2, Search, UserPlus, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { authApi, journeyApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useIsPhone } from '../../mobile/useIsPhone';
import { avatarSrc } from '../../utils/avatarSrc';
import { INPUT, Segmented } from '../shared/dialogParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../shared/DialogShell';
import { useToast } from '../shared/Toast';
import { TripMemberAvatar } from '../Trips/TripMemberAvatar';

const ROLES = ['viewer', 'editor'] as const;

/**
 * Adds a person to a journey. The desktop draws it in the planner's dialog
 * frame; the phone, which opens it from its journey screen, keeps the panel it
 * has always had. Both read and write the same state below.
 */
export default function ContributorInviteDialog({
  journeyId,
  existingUserIds,
  onClose,
  onInvited,
}: {
  journeyId: number;
  existingUserIds: number[];
  onClose: () => void;
  onInvited: () => void;
}) {
  const { t } = useTranslation();
  const phone = useIsPhone();
  const labelId = useId();
  const [users, setUsers] = useState<{ id: number; username: string; email?: string; avatar?: string | null }[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    authApi
      .listUsers()
      .then((d) => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  // Captured and stopped on the desktop: the dialog is usually opened from the
  // journey settings, which close on Escape as well, and one key press should
  // only take back this dialog, not the one under it.
  useEffect(() => {
    if (phone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [phone, onClose]);

  const filtered = users.filter((u) => {
    if (existingUserIds.includes(u.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    // The directory lists username and avatar only; email is not sent to non-admins.
    return u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
  });

  const handleInvite = async () => {
    if (!selectedUserId) return;
    setSending(true);
    try {
      await journeyApi.addContributor(journeyId, selectedUserId, role);
      toast.success(t('journey.contributors.added'));
      onInvited();
    } catch {
      toast.error(t('journey.contributors.addFailed'));
    } finally {
      setSending(false);
    }
  };

  if (phone) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(9,9,11,0.75)] p-5">
        <div className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
            <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">{t('journey.contributors.invite')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Search */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {t('journey.contributors.searchUser')}
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('journey.contributors.searchPlaceholder')}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
              />
            </div>

            {/* User list */}
            <div className="flex max-h-[200px] flex-col gap-1 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="py-4 text-center text-[12px] text-zinc-400">{t('journey.contributors.noUsers')}</p>
              )}
              {filtered.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-2.5 text-left transition-all ${
                    selectedUserId === u.id
                      ? 'border border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-800'
                      : 'border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[12px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-zinc-900 dark:text-white">{u.username}</div>
                    <div className="truncate text-[11px] text-zinc-500">{u.email}</div>
                  </div>
                  {selectedUserId === u.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Role selector */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {t('journey.invite.role')}
              </label>
              <div className="flex gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-all ${
                      role === r
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700'
                    }`}
                  >
                    {t(`journey.invite.${r}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-3.5 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={!selectedUserId || sending}
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {sending ? t('journey.invite.inviting') : t('journey.invite.invite')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      // The list shrinks while the search narrows it; a pinned top edge keeps the field still.
      align="top"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <UserPlus size={20} strokeWidth={1.9} className="text-content-muted" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('journey.contributors.invite')}
        />
      }
      // The role sits beside the button it goes with, in reach however long the list gets.
      footer={
        <DialogFooter>
          <Segmented<(typeof ROLES)[number]>
            value={role}
            options={ROLES.map((r) => ({ value: r, label: t(`journey.invite.${r}`) }))}
            onChange={setRole}
            label={t('journey.invite.role')}
          />
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton
            variant="primary"
            onClick={handleInvite}
            disabled={!selectedUserId || sending}
            icon={sending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} strokeWidth={2.2} />}
          >
            {sending ? t('journey.invite.inviting') : t('journey.invite.invite')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint"
          aria-hidden="true"
        />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('journey.contributors.searchPlaceholder')}
          aria-label={t('journey.contributors.searchUser')}
          className={`${INPUT} pl-8`}
        />
      </div>

      <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
        {filtered.length === 0 && (
          <p className="m-0 px-4 py-6 text-center text-content-faint" style={fs(12.5, 'body')}>
            {t('journey.contributors.noUsers')}
          </p>
        )}
        {filtered.map((u) => {
          const on = selectedUserId === u.id;
          return (
            <button
              type="button"
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              aria-pressed={on}
              className={`flex min-h-[48px] w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left ${on ? 'bg-surface-card shadow-sm' : 'hover:bg-surface-card'}`}
            >
              <TripMemberAvatar username={u.username} avatarUrl={avatarSrc(u.avatar)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>
                  {u.username}
                </span>
                {u.email && (
                  <span className="block truncate text-content-faint" style={fs(11.5)}>
                    {u.email}
                  </span>
                )}
              </span>
              {on && (
                <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-accent text-accent-text">
                  <Check size={12} strokeWidth={2.6} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </DialogShell>
  );
}
