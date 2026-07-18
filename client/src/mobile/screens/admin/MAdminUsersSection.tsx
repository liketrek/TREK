import { Copy, Link2, Trash2, UserPlus } from 'lucide-react'
import type { TranslationFn } from '../../../types'
import type { useAdmin } from '../../../pages/admin/useAdmin'
import MAdminPermissionsPanel from './MAdminPermissionsPanel'
import MSheet from '../../components/MSheet'
import MChip from '../../components/MChip'
import { MAdminButton, MAdminCard, MAdminField, MAdminSheetFrame } from './MAdminUi'

interface MAdminUsersSectionProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
  locale: string
}

const INVITE_USES = [1, 2, 3, 4, 5, 0]
const INVITE_EXPIRY: { value: number | ''; label: string }[] = [
  { value: 1, label: '1d' },
  { value: 3, label: '3d' },
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: '', label: '∞' },
]

// Users section: user list with role badges (design §6.4), invite links and the
// permissions matrix. Rows open the edit sheet; Create opens the create sheet.
export default function MAdminUsersSection({ admin, t, locale }: MAdminUsersSectionProps) {
  const {
    currentUser, users, isLoading,
    setShowCreateUser, handleEditUser,
    invites, inviteTrips, showCreateInvite, setShowCreateInvite, inviteForm, setInviteForm,
    copyInviteLink, handleCreateInvite, handleDeleteInvite,
  } = admin

  return (
    <div className="space-y-3">
      <MAdminCard>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[0.875rem] font-extrabold text-m-ink">{t('admin.tabs.users')}</span>
          <span className="font-geist text-[0.625rem] font-bold text-m-faint">
            {users.length} {t('admin.stats.users').toLowerCase()}
          </span>
          <MAdminButton className="ml-auto" onClick={() => setShowCreateUser(true)}>
            <UserPlus size={12} strokeWidth={2.2} />
            {t('mobileAdmin.create')}
          </MAdminButton>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-[color:var(--m-ink)]" />
          </div>
        ) : (
          users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleEditUser(u)}
              className="flex w-full items-center gap-[11px] border-t border-[color:var(--m-rowbr)] py-[11px] text-left"
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="h-[34px] w-[34px] flex-none rounded-full object-cover" />
              ) : (
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[0.75rem] font-extrabold text-m-ink">
                  {u.username.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-[5px]">
                  <span className="truncate text-[0.8125rem] font-bold text-m-ink">{u.username}</span>
                  {u.id === currentUser?.id && (
                    <span className="font-geist text-[0.5625rem] text-m-faint">{t('admin.you')}</span>
                  )}
                </span>
                <span className="block truncate font-geist text-[0.625rem] text-m-muted">{u.email}</span>
              </span>
              <span
                className={`flex-none whitespace-nowrap rounded-full px-[9px] py-[3px] font-geist text-[0.5625rem] font-extrabold ${
                  u.role === 'admin'
                    ? 'bg-[color:color-mix(in_srgb,var(--m-st-danger)_12%,transparent)] text-[color:var(--m-st-danger)]'
                    : 'bg-[color:var(--m-ic)] text-m-muted'
                }`}
              >
                {u.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleUser')}
              </span>
            </button>
          ))
        )}
      </MAdminCard>

      <MAdminCard>
        <div className="mb-1 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[0.875rem] font-extrabold text-m-ink">{t('admin.invite.title')}</div>
            <div className="mt-[2px] font-geist text-[0.625rem] text-m-muted">{t('admin.invite.subtitle')}</div>
          </div>
          <MAdminButton onClick={() => setShowCreateInvite(true)}>{t('admin.invite.create')}</MAdminButton>
        </div>

        {invites.length === 0 ? (
          <div className="py-4 text-center font-geist text-[0.6875rem] text-m-faint">{t('admin.invite.empty')}</div>
        ) : (
          invites.map((inv) => {
            const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date()
            const isUsedUp = inv.max_uses > 0 && inv.used_count >= inv.max_uses
            const isActive = !isExpired && !isUsedUp
            return (
              <div
                key={inv.id}
                className="flex items-center gap-[10px] border-t border-[color:var(--m-rowbr)] py-[11px]"
              >
                <Link2 size={14} strokeWidth={2} className={`flex-none ${isActive ? 'text-m-ink' : 'text-m-faint'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[6px]">
                    <code className="truncate font-geist text-[0.6875rem] text-m-ink">{inv.token.slice(0, 12)}…</code>
                    <span
                      className={`flex-none rounded-full px-[7px] py-[2px] font-geist text-[0.5625rem] font-extrabold ${
                        isActive
                          ? 'bg-[color:color-mix(in_srgb,var(--m-st-confirmed)_12%,transparent)] text-[color:var(--m-st-confirmed)]'
                          : 'bg-[color:var(--m-ic)] text-m-faint'
                      }`}
                    >
                      {isUsedUp ? t('admin.invite.usedUp') : isExpired ? t('admin.invite.expired') : t('admin.invite.active')}
                    </span>
                  </div>
                  <div className="mt-[2px] truncate font-geist text-[0.59375rem] text-m-muted">
                    {inv.used_count}/{inv.max_uses === 0 ? '∞' : inv.max_uses} {t('admin.invite.uses')}
                    {inv.expires_at && ` · ${t('admin.invite.expiresAt')} ${new Date(inv.expires_at).toLocaleDateString(locale)}`}
                    {inv.trip_title && ` · ${t('admin.invite.boundTo', { trip: inv.trip_title })}`}
                    {` · ${t('admin.invite.createdBy')} ${inv.created_by_name}`}
                  </div>
                </div>
                {isActive && (
                  <button
                    type="button"
                    title={t('admin.invite.copyLink')}
                    onClick={() => copyInviteLink(inv.token)}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
                  >
                    <Copy size={13} strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  title={t('common.delete')}
                  onClick={() => handleDeleteInvite(inv.id)}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)]"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
            )
          })
        )}
      </MAdminCard>

      <MAdminPermissionsPanel />

      {/* Create invite sheet */}
      <MSheet open={showCreateInvite} onClose={() => setShowCreateInvite(false)} ariaLabel={t('admin.invite.create')}>
        <MAdminSheetFrame
          title={t('admin.invite.create')}
          onClose={() => setShowCreateInvite(false)}
          footer={
            <>
              <MAdminButton variant="ghost" onClick={() => setShowCreateInvite(false)}>
                {t('common.cancel')}
              </MAdminButton>
              <MAdminButton onClick={handleCreateInvite}>{t('admin.invite.createAndCopy')}</MAdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <MAdminField label={t('admin.invite.maxUses')}>
              <div className="flex flex-wrap gap-[6px]">
                {INVITE_USES.map((n) => (
                  <MChip
                    key={n}
                    active={inviteForm.max_uses === n}
                    onClick={() => setInviteForm((f) => ({ ...f, max_uses: n }))}
                  >
                    {n === 0 ? '∞' : `${n}×`}
                  </MChip>
                ))}
              </div>
            </MAdminField>
            <MAdminField label={t('admin.invite.expiry')}>
              <div className="flex flex-wrap gap-[6px]">
                {INVITE_EXPIRY.map((opt) => (
                  <MChip
                    key={String(opt.value)}
                    active={inviteForm.expires_in_days === opt.value}
                    onClick={() => setInviteForm((f) => ({ ...f, expires_in_days: opt.value }))}
                  >
                    {opt.label}
                  </MChip>
                ))}
              </div>
            </MAdminField>
            {inviteTrips.length > 0 && (
              <MAdminField label={t('admin.invite.tripLabel')} hint={t('admin.invite.tripHint')}>
                <select
                  value={inviteForm.trip_id}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, trip_id: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                  className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none"
                >
                  <option value="">{t('admin.invite.tripNone')}</option>
                  {inviteTrips.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.title}
                    </option>
                  ))}
                </select>
              </MAdminField>
            )}
          </div>
        </MAdminSheetFrame>
      </MSheet>
    </div>
  )
}
