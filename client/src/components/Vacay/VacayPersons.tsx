import ReactDOM from 'react-dom'
import { useState, useEffect } from 'react'
import DOM from 'react-dom'
import { UserPlus, Unlink, Check, Loader2, Clock, X } from 'lucide-react'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import apiClient from '../../api/client'

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

  const handleColorChange = async (color) => {
    await updateColor(color, colorEditUserId)
    setShowColorPicker(false)
    setColorEditUserId(null)
  }

  const editingUserColor = users.find(u => u.id === colorEditUserId)?.color || '#6366f1'

  return (
    <div className="rounded-xl border p-3 bg-surface-card border-edge">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-content-faint">{t('vacay.persons')}</span>
        <button onClick={() => { setShowInvite(true); loadAvailable() }}
          className="p-0.5 rounded transition-colors text-content-faint">
          <UserPlus size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {users.map(u => {
          const isSelected = selectedUserId === u.id
          return (
            <div key={u.id}
              onClick={() => { if (isFused) setSelectedUserId(u.id) }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg group transition-all border ${isSelected ? 'bg-surface-hover border-edge' : 'bg-transparent border-transparent'}`}
              style={{
                cursor: isFused ? 'pointer' : 'default',
              }}>
              <button
                onClick={(e) => { e.stopPropagation(); setColorEditUserId(u.id); setShowColorPicker(true) }}
                className="w-3.5 h-3.5 rounded-full shrink-0 transition-transform hover:scale-125"
                style={{ backgroundColor: u.color, cursor: 'pointer' }}
                title={t('vacay.changeColor')}
              />
              <span className="text-xs font-medium flex-1 truncate text-content">
                {u.username}
                {u.id === currentUser?.id && <span className="text-content-faint"> ({t('vacay.you')})</span>}
              </span>
              {isSelected && isFused && (
                <Check size={12} className="text-content" />
              )}
            </div>
          )
        })}

        {/* Pending invites */}
        {pendingInvites.map(inv => (
          <div key={inv.user_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg group bg-surface-secondary"
            style={{ opacity: 0.7 }}>
            <Clock size={12} className="text-content-faint" />
            <span className="text-xs flex-1 truncate text-content-muted">
              {inv.username} <span className="text-[10px]">({t('vacay.pending')})</span>
            </span>
            <button onClick={() => cancelInvite(inv.user_id)}
              className="opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded transition-all text-content-faint">
              {t('common.cancel')}
            </button>
          </div>
        ))}
      </div>

      {/* Invite Modal — Portal to body to avoid z-index issues */}
      {showInvite && ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center px-4 trek-backdrop-enter bg-[rgba(15,23,42,0.5)]" style={{ zIndex: 99990, paddingTop: 70 }}
          onClick={() => setShowInvite(false)}>
          <div className="trek-modal-enter rounded-2xl shadow-2xl w-full max-w-sm bg-surface-card"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-edge-secondary">
              <h2 className="text-base font-semibold text-content">{t('vacay.inviteUser')}</h2>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-lg transition-colors text-content-faint">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-content-muted">{t('vacay.inviteHint')}</p>
              {availableUsers.length === 0 ? (
                <p className="text-xs text-center py-4 text-content-faint">{t('vacay.noUsersAvailable')}</p>
              ) : (
                <CustomSelect
                  value={selectedInviteUser}
                  onChange={setSelectedInviteUser}
                  options={availableUsers.map(u => ({ value: u.id, label: `${u.username} (${u.email})` }))}
                  placeholder={t('vacay.selectUser')}
                  searchable
                />
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm rounded-lg text-content-muted border border-edge">
                  {t('common.cancel')}
                </button>
                <button onClick={handleInvite} disabled={!selectedInviteUser || inviting}
                  className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 bg-content text-surface-card">
                  {inviting && <Loader2 size={13} className="animate-spin" />}
                  {t('vacay.sendInvite')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Color Picker Modal — Portal to body */}
      {showColorPicker && ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center px-4 trek-backdrop-enter bg-[rgba(15,23,42,0.5)]" style={{ zIndex: 99990, paddingTop: 70 }}
          onClick={() => { setShowColorPicker(false); setColorEditUserId(null) }}>
          <div className="trek-modal-enter rounded-2xl shadow-2xl w-full max-w-xs bg-surface-card"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-edge-secondary">
              <h2 className="text-base font-semibold text-content">{t('vacay.changeColor')}</h2>
              <button onClick={() => { setShowColorPicker(false); setColorEditUserId(null) }} className="p-1.5 rounded-lg transition-colors text-content-faint">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2 justify-center">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => handleColorChange(c)}
                    className={`w-8 h-8 rounded-full transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${editingUserColor === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
