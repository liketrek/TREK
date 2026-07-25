import ReactDOM from 'react-dom'
import { useState } from 'react'
import { Share2, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { useVacayStore } from '../../store/vacayStore'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import apiClient from '../../api/client'
import VacayBadge from './VacayBadge'

/**
 * Sidebar card for read-only calendar sharing (#444/#667). Deliberately separate
 * from the Persons card: Persons is the fusion (merge) feature, this card only
 * grants view access. Incoming rows toggle that person's calendar overlay.
 */
export default function VacaySharedCalendars() {
  const { t } = useTranslation()
  const toast = useToast()
  const { outgoingShares, incomingShares, shareWith, removeShare, setShareHidden } = useVacayStore()

  const [showShare, setShowShare] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<{ id: number; username: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [sharing, setSharing] = useState(false)

  const loadAvailable = async () => {
    try {
      const data = await apiClient.get('/addons/vacay/shares/available-users').then(r => r.data)
      setAvailableUsers(data.users)
    } catch { /* */ }
  }

  const handleShare = async () => {
    if (!selectedUser) return
    setSharing(true)
    try {
      await shareWith(selectedUser)
      toast.success(t('vacay.shareSent'))
      setShowShare(false)
      setSelectedUser(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('vacay.shareFailed')))
    } finally {
      setSharing(false)
    }
  }

  // The optimistic hide and the removals reject on server errors — surface them
  // instead of leaving an unhandled rejection behind a silently reverted toggle.
  const handleToggleHidden = (id: number, hidden: boolean) => {
    setShareHidden(id, hidden).catch((err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed'))))
  }
  const handleRemove = (id: number) => {
    removeShare(id).catch((err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed'))))
  }

  const empty = incomingShares.length === 0 && outgoingShares.length === 0

  return (
    <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--vg-ink3)' }}>{t('vacay.sharedCalendars')}</span>
        <button onClick={() => { setShowShare(true); loadAvailable() }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--vg-ink3)' }}
          title={t('vacay.shareCalendar')}>
          <Share2 size={14} />
        </button>
      </div>

      {empty && (
        <p style={{ fontSize: 12, color: 'var(--vg-ink3)', lineHeight: 1.5 }}>{t('vacay.sharedEmpty')}</p>
      )}

      {incomingShares.length > 0 && (
        <div className="flex flex-col gap-1">
          {incomingShares.map(s => (
            <div key={s.id}
              onClick={() => handleToggleHidden(s.id, !s.hidden)}
              className="flex items-center gap-2.5 group transition-colors cursor-pointer"
              style={{ padding: '7px 10px', borderRadius: 12, opacity: s.hidden ? 0.55 : 1 }}
              title={s.hidden ? t('vacay.showInCalendar') : t('vacay.hideFromCalendar')}>
              {/* Ring dot — mirrors how shared days render in the grid (outline, not fill). */}
              <span className="w-3 h-3 rounded-full shrink-0" style={{ border: `2.5px solid ${s.color}` }} />
              <span className="truncate min-w-0" style={{ fontSize: 13, fontWeight: 600, color: 'var(--vg-ink)' }}>
                {s.username}
              </span>
              <VacayBadge label={t('vacay.viewOnly')} />
              <span className="ml-auto flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); handleRemove(s.id) }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all"
                  style={{ color: 'var(--vg-ink3)' }}
                  title={t('vacay.remove')}>
                  <X size={12} />
                </button>
                {s.hidden
                  ? <EyeOff size={14} style={{ color: 'var(--vg-ink3)' }} />
                  : <Eye size={14} style={{ color: 'var(--vg-ink2)' }} />}
              </span>
            </div>
          ))}
        </div>
      )}

      {outgoingShares.length > 0 && (
        <div className="flex flex-col gap-1" style={{ marginTop: incomingShares.length > 0 ? 10 : 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--vg-ink3)', padding: '0 10px' }}>
            {t('vacay.youShareWith')}
          </span>
          {outgoingShares.map(s => (
            <div key={s.id} className="flex items-center gap-2.5 group"
              style={{ padding: '5px 10px', borderRadius: 12 }}>
              <Share2 size={12} style={{ color: 'var(--vg-ink3)' }} />
              <span className="truncate min-w-0" style={{ fontSize: 13, color: 'var(--vg-ink2)' }}>
                {s.username}
              </span>
              <button onClick={() => handleRemove(s.id)}
                className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded transition-all"
                style={{ color: 'var(--vg-ink3)' }}>
                {t('vacay.stopSharing')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal — Portal to body to avoid z-index issues */}
      {showShare && ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center px-4 trek-backdrop-enter bg-[rgba(15,23,42,0.5)]" style={{ zIndex: 99990, paddingTop: 70 }}
          onClick={() => setShowShare(false)}>
          <div className="trek-modal-enter rounded-2xl shadow-2xl w-full max-w-sm bg-surface-card"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-edge-secondary">
              <h2 className="text-base font-semibold text-content">{t('vacay.shareCalendar')}</h2>
              <button onClick={() => setShowShare(false)} className="p-1.5 rounded-lg transition-colors text-content-faint">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-content-muted">{t('vacay.shareCalendarHint')}</p>
              {availableUsers.length === 0 ? (
                <p className="text-xs text-center py-4 text-content-faint">{t('vacay.noUsersAvailable')}</p>
              ) : (
                <CustomSelect
                  value={selectedUser}
                  onChange={v => setSelectedUser(Number(v))}
                  options={availableUsers.map(u => ({ value: u.id, label: u.username }))}
                  placeholder={t('vacay.selectUser')}
                  searchable
                />
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowShare(false)} className="px-4 py-2 text-sm rounded-lg text-content-muted border border-edge">
                  {t('common.cancel')}
                </button>
                <button onClick={handleShare} disabled={!selectedUser || sharing}
                  className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 bg-content text-surface-card">
                  {sharing && <Loader2 size={13} className="animate-spin" />}
                  {t('vacay.share')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
