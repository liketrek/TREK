import React, { useId, useState, type ReactNode } from 'react'
import CustomSelect from '../../components/shared/CustomSelect'
import { Shield, Trash2, Edit2, UserPlus, Link2, Copy, Plus, Users } from 'lucide-react'
import PermissionsPanel from '../../components/Admin/PermissionsPanel'
import { Tooltip } from '../../components/shared/Tooltip'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../../components/shared/DialogShell'
import { EditorField, Segmented } from '../../components/shared/dialogParts'
import { SettingsCard, SettingRows, SettingsHint, StatusPill, SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON } from '../../components/Settings/settingsKit'
import type { TranslationFn } from '../../types'
import type { useAdmin } from './useAdmin'

interface AdminUsersTabProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
  locale: string
}

const TH = 'px-3.5 py-2.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const TD = 'px-3.5 py-3 align-middle'

/** An icon action of a row, named by its tooltip and its aria-label. */
function RowIconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <Tooltip label={label} disabled={disabled}>
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
        className={`${SETTINGS_ICON_BUTTON} ${danger ? 'hover:!text-danger' : ''} disabled:!opacity-30 disabled:cursor-not-allowed`}>
        {children}
      </button>
    </Tooltip>
  )
}

// "Users" admin tab: user table, invite links, permissions panel + the
// create-invite modal. Pure layout around the useAdmin hook — no logic of its own.
export default function AdminUsersTab({ admin, t, locale }: AdminUsersTabProps): React.ReactElement {
  const {
    hour12, currentUser,
    users, isLoading,
    setShowCreateUser,
    invites, inviteTrips, showCreateInvite, setShowCreateInvite, inviteForm, setInviteForm,
    copyInviteLink, handleCreateInvite, handleDeleteInvite,
    handleEditUser, handleDeleteUser,
  } = admin
  const inviteLabelId = useId()
  // The row whose delete waits for the admin's answer in the confirm dialog.
  const [userToDelete, setUserToDelete] = useState<(typeof users)[number] | null>(null)

  return (
    <>
      <SettingsCard
        icon={Users}
        title={t('admin.tabs.users')}
        hint={<>{users.length} {t('admin.stats.users')}</>}
        action={
          <button type="button" onClick={() => setShowCreateUser(true)} className={SETTINGS_BUTTON_PRIMARY} style={fs(12.5, 'body')}>
            <UserPlus size={14} strokeWidth={2.1} />
            {t('admin.createUser')}
          </button>
        }
      >
        {isLoading ? (
          <div className="grid place-items-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-edge border-t-[color:var(--text-primary)]" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-edge-faint bg-surface-card">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-faint text-left" style={fs(9.5)}>
                  <th className={TH}>{t('admin.table.user')}</th>
                  <th className={TH}>{t('admin.table.email')}</th>
                  <th className={TH}>{t('admin.table.role')}</th>
                  <th className={TH}>{t('admin.table.created')}</th>
                  <th className={TH}>{t('admin.table.lastLogin')}</th>
                  <th className={`${TH} text-right`}>{t('admin.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="trek-stagger divide-y divide-edge-faint">
                {users.map(u => {
                  const isMe = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className={`transition-colors hover:bg-surface-secondary ${isMe ? 'bg-surface-secondary' : ''}`}>
                      <td className={TD}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="relative flex-none">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.username} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="grid h-8 w-8 place-items-center rounded-full bg-surface-tertiary font-semibold text-content-secondary" style={fs(13, 'body')}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-card ${u.online ? 'bg-success' : 'bg-content-faint'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>{u.username}</p>
                            {isMe && (
                              <span className="text-content-faint" style={fs(11.5)}>{t('admin.you')}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`${TD} text-content-secondary`} style={fs(12.5, 'body')}>
                        <div className="max-w-[260px] truncate">{u.email}</div>
                      </td>
                      <td className={TD}>
                        {u.role === 'admin'
                          ? <StatusPill tone="accent" icon={<Shield size={10} strokeWidth={2.4} />}>{t('settings.roleAdmin')}</StatusPill>
                          : <StatusPill>{t('settings.roleUser')}</StatusPill>}
                      </td>
                      <td className={`${TD} whitespace-nowrap font-geist tabular-nums text-content-muted`} style={fs(12)}>
                        {new Date(u.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className={`${TD} whitespace-nowrap font-geist tabular-nums text-content-muted`} style={fs(12)}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12 }) : '—'}
                      </td>
                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1.5">
                          <RowIconButton label={t('admin.editUser')} onClick={() => handleEditUser(u)}>
                            <Edit2 size={14} strokeWidth={2} />
                          </RowIconButton>
                          <RowIconButton label={t('admin.deleteUserTitle')} onClick={() => setUserToDelete(u)} disabled={isMe} danger>
                            <Trash2 size={14} strokeWidth={2} />
                          </RowIconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      {/* Invite Links (inside users tab) */}
      <SettingsCard
        icon={Link2}
        title={t('admin.invite.title')}
        hint={t('admin.invite.subtitle')}
        action={
          <button type="button" onClick={() => setShowCreateInvite(true)} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
            <Plus size={14} strokeWidth={2.2} />
            {t('admin.invite.create')}
          </button>
        }
      >
        {invites.length === 0 ? (
          <SettingsHint className="py-4 text-center">{t('admin.invite.empty')}</SettingsHint>
        ) : (
          <SettingRows>
            {invites.map(inv => {
              const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date()
              const isUsedUp = inv.max_uses > 0 && inv.used_count >= inv.max_uses
              const isActive = !isExpired && !isUsedUp
              return (
                <div key={inv.id} className={`flex items-center gap-3 px-3.5 py-3 ${isActive ? '' : 'opacity-70'}`}>
                  <span className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary ${isActive ? 'text-content-secondary' : 'text-content-faint'}`}>
                    <Link2 size={14} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <code className="min-w-0 truncate font-geist font-semibold text-content" style={fs(12.5, 'body')}>{inv.token.slice(0, 12)}...</code>
                      <StatusPill tone={isActive ? 'success' : 'neutral'}>
                        {isUsedUp ? t('admin.invite.usedUp') : isExpired ? t('admin.invite.expired') : t('admin.invite.active')}
                      </StatusPill>
                    </div>
                    <div className="mt-0.5 truncate text-content-faint" style={fs(11.5)}>
                      {inv.used_count}/{inv.max_uses === 0 ? '∞' : inv.max_uses} {t('admin.invite.uses')}
                      {inv.expires_at && ` · ${t('admin.invite.expiresAt')} ${new Date(inv.expires_at).toLocaleDateString(locale)}`}
                      {inv.trip_title && ` · ${t('admin.invite.boundTo', { trip: inv.trip_title })}`}
                      {` · ${t('admin.invite.createdBy')} ${inv.created_by_name}`}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-1.5">
                    {isActive && (
                      <RowIconButton label={t('admin.invite.copyLink')} onClick={() => copyInviteLink(inv.token)}>
                        <Copy size={14} strokeWidth={2} />
                      </RowIconButton>
                    )}
                    <RowIconButton label={t('common.delete')} onClick={() => handleDeleteInvite(inv.id)} danger>
                      <Trash2 size={14} strokeWidth={2} />
                    </RowIconButton>
                  </div>
                </div>
              )
            })}
          </SettingRows>
        )}
      </SettingsCard>

      <PermissionsPanel />

      {/* Create Invite Modal */}
      <DialogShell
        open={showCreateInvite}
        onClose={() => setShowCreateInvite(false)}
        labelledBy={inviteLabelId}
        width="narrow"
        header={
          <DialogHeader
            tile={<DialogTile><Link2 size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={inviteLabelId}
            onClose={() => setShowCreateInvite(false)}
            title={t('admin.invite.create')}
          />
        }
        footer={
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={() => setShowCreateInvite(false)}>{t('common.cancel')}</DialogButton>
            <DialogButton variant="primary" onClick={handleCreateInvite} icon={<Copy size={14} strokeWidth={2.1} />}>
              {t('admin.invite.createAndCopy')}
            </DialogButton>
          </DialogFooter>
        }
      >
        <EditorField label={t('admin.invite.maxUses')}>
          <Segmented
            label={t('admin.invite.maxUses')}
            fill
            value={String(inviteForm.max_uses)}
            onChange={v => setInviteForm(f => ({ ...f, max_uses: Number(v) }))}
            options={[1, 2, 3, 4, 5, 0].map(n => ({ value: String(n), label: n === 0 ? '∞' : `${n}×` }))}
          />
        </EditorField>
        <EditorField label={t('admin.invite.expiry')}>
          <Segmented
            label={t('admin.invite.expiry')}
            fill
            value={inviteForm.expires_in_days === '' ? 'never' : String(inviteForm.expires_in_days)}
            onChange={v => setInviteForm(f => ({ ...f, expires_in_days: v === 'never' ? '' : Number(v) }))}
            options={[
              { value: '1', label: '1d' },
              { value: '3', label: '3d' },
              { value: '7', label: '7d' },
              { value: '14', label: '14d' },
              { value: 'never', label: '∞' },
            ]}
          />
        </EditorField>
        {inviteTrips.length > 0 && (
          <EditorField label={t('admin.invite.tripLabel')} hint={t('admin.invite.tripHint')}>
            <CustomSelect
              value={inviteForm.trip_id}
              onChange={v => setInviteForm(f => ({ ...f, trip_id: v === '' ? '' : Number(v) }))}
              options={[
                { value: '', label: t('admin.invite.tripNone') },
                ...inviteTrips.map(tr => ({ value: tr.id, label: tr.title })),
              ]}
              searchable={inviteTrips.length > 8}
              placeholder={t('admin.invite.tripNone')}
            />
          </EditorField>
        )}
      </DialogShell>

      <ConfirmDialog
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => { if (userToDelete) void handleDeleteUser(userToDelete, { confirmed: true }) }}
        title={t('admin.deleteUserTitle')}
        message={userToDelete ? t('admin.deleteUser', { name: userToDelete.username }) : ''}
        confirmLabel={t('common.delete')}
        danger
      />
    </>
  )
}
