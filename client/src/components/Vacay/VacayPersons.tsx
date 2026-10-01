import { useState, useEffect, useId, type HTMLAttributes } from 'react'
import { UserPlus, Check, Loader2, Clock, Palette } from 'lucide-react'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import apiClient from '../../api/client'
import VacayBadge from './VacayBadge'

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#ef4444',
  '#3b82f6', '#22c55e', '#06b6d4', '#f43f5e', '#a855f7',
  '#10b981', '#0ea5e9', '#64748b', '#be185d', '#0d9488',
]

export default function VacayPersons() {
  const { t } = useTranslation()
  const toast = useToast()
  const { users, pendingInvites, invite, cancelInvite, updateColor, selectedUserId, setSelectedUserId, isFused } = useVacayStore()
  const { user: currentUser } = useAuthStore()

  // Default selectedUserId to current user
  useEffect(() => {
    if (!selectedUserId && currentUser) setSelectedUserId(currentUser.id)
  }, [currentUser, selectedUserId])
  const [showInvite, setShowInvite] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [colorEditUserId, setColorEditUserId] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedInviteUser, setSelectedInviteUser] = useState(null)
  const [inviting, setInviting] = useState(false)
  const inviteLabelId = useId()
  const colorLabelId = useId()

  const loadAvailable = async () => {
    try {
      const data = await apiClient.get('/addons/vacay/available-users').then(r => r.data)
      setAvailableUsers(data.users)
    } catch { /* */ }
  }

  const handleInvite = async () => {
    if (!selectedInviteUser) return
    setInviting(true)
    try {
      await invite(selectedInviteUser)
      toast.success(t('vacay.inviteSent'))
      setShowInvite(false)
      setSelectedInviteUser(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('vacay.inviteError')))
    } finally {
      setInviting(false)
    }
  }

  const handleColorChange = async (color: string) => {
    await updateColor(color, colorEditUserId)
    setShowColorPicker(false)
    setColorEditUserId(null)
  }

  const closeInvite = () => setShowInvite(false)
  const closeColorPicker = () => { setShowColorPicker(false); setColorEditUserId(null) }

  const editingUser = users.find(u => u.id === colorEditUserId)
  const editingUserColor = editingUser?.color || '#6366f1' // theme-lint-disable: a person's own colour, the default one when unset

  return (
    <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--vg-ink3)' }}>{t('vacay.persons')}</span>
        <button type="button" onClick={() => { setShowInvite(true); void loadAvailable() }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--vg-ink3)' }}>
          <UserPlus size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {users.map(u => {
          const isSelected = selectedUserId === u.id
          // Only a fused plan lets you pick whose leave you are looking at, so the
          // row takes focus and keys only then — it stays a div because the colour
          // dot inside it is a button of its own.
          const select: HTMLAttributes<HTMLDivElement> = isFused
            ? {
                role: 'button',
                tabIndex: 0,
                onClick: () => setSelectedUserId(u.id),
                onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedUserId(u.id) } },
              }
            : {}
          return (
            <div key={u.id}
              {...select}
              className="flex items-center gap-2.5 group transition-colors"
              style={{
                padding: '7px 10px',
                borderRadius: 12,
                cursor: isFused ? 'pointer' : 'default',
                background: isSelected ? 'var(--vg-surf2)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--vg-line)' : 'transparent'}`,
              }}>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); setColorEditUserId(u.id); setShowColorPicker(true) }}
                className="w-3 h-3 rounded-full shrink-0 transition-transform hover:scale-125"
                style={{ backgroundColor: u.color, cursor: 'pointer' }}
                title={t('vacay.changeColor')}
              />
              <span className="truncate min-w-0" style={{ fontSize: 13, fontWeight: 600, color: 'var(--vg-ink)' }}>
                {u.username}
              </span>
              {u.id === currentUser?.id && <VacayBadge label={t('vacay.you')} />}
              {isSelected && isFused && (
                <Check size={15} strokeWidth={2.4} className="ml-auto" style={{ color: 'var(--vg-ink2)' }} />
              )}
            </div>
          )
        })}

        {/* Pending invites */}
        {pendingInvites.map(inv => (
          <div key={inv.user_id} className="flex items-center gap-2.5 group"
            style={{ padding: '7px 10px', borderRadius: 12, background: 'var(--vg-surf2)', opacity: 0.7 }}>
            <Clock size={13} style={{ color: 'var(--vg-ink3)' }} />
            <span className="truncate min-w-0" style={{ fontSize: 13, color: 'var(--vg-ink2)' }}>
              {inv.username}
            </span>
            <VacayBadge label={t('vacay.pending')} tone="amber" />
            <button type="button" onClick={() => cancelInvite(inv.user_id)}
              className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded transition-all"
              style={{ color: 'var(--vg-ink3)' }}>
              {t('common.cancel')}
            </button>
          </div>
        ))}
      </div>

      <DialogShell
        open={showInvite}
        onClose={closeInvite}
        labelledBy={inviteLabelId}
        width="narrow"
        header={(
          <DialogHeader
            tile={<DialogTile><UserPlus size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={inviteLabelId}
            onClose={closeInvite}
            title={t('vacay.inviteUser')}
            sub={t('vacay.inviteHint')}
            subWraps
          />
        )}
        footer={(
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={closeInvite}>{t('common.cancel')}</DialogButton>
            <DialogButton variant="primary" onClick={handleInvite} disabled={!selectedInviteUser || inviting}
              icon={inviting ? <Loader2 size={14} className="animate-spin" /> : undefined}>
              {t('vacay.sendInvite')}
            </DialogButton>
          </DialogFooter>
        )}
      >
        {availableUsers.length === 0 ? (
          <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-5 text-center text-content-faint" style={fs(12.5, 'body')}>
            {t('vacay.noUsersAvailable')}
          </p>
        ) : (
          <CustomSelect
            value={selectedInviteUser}
            onChange={setSelectedInviteUser}
            options={availableUsers.map(u => ({ value: u.id, label: `${u.username} (${u.email})` }))}
            placeholder={t('vacay.selectUser')}
            searchable
          />
        )}
      </DialogShell>

      {/* A pick saves at once and closes, so there is nothing for a footer to confirm. */}
      <DialogShell
        open={showColorPicker}
        onClose={closeColorPicker}
        labelledBy={colorLabelId}
        width="narrow"
        header={(
          <DialogHeader
            tile={<DialogTile><Palette size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={colorLabelId}
            onClose={closeColorPicker}
            title={t('vacay.changeColor')}
            sub={editingUser?.username}
          />
        )}
      >
        <div role="group" aria-label={t('vacay.color')}
          className="grid grid-cols-5 justify-items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-4">
          {PRESET_COLORS.map(c => {
            const on = editingUserColor === c
            return (
              <button type="button" key={c} onClick={() => handleColorChange(c)} aria-pressed={on}
                className={`h-10 w-10 rounded-full transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${on ? 'scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c, outline: on ? '2px solid var(--text-primary)' : '2px solid transparent', outlineOffset: 2 }} />
            )
          })}
        </div>
      </DialogShell>
    </div>
  )
}
