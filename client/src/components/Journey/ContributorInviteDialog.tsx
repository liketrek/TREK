import { useEffect, useState } from 'react'
import { X, Check, UserPlus } from 'lucide-react'
import { journeyApi, authApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'

export default function ContributorInviteDialog({ journeyId, existingUserIds, onClose, onInvited }: {
  journeyId: number
  existingUserIds: number[]
  onClose: () => void
  onInvited: () => void
}) {
  const { t } = useTranslation()
  const [users, setUsers] = useState<{ id: number; username: string; email: string; avatar?: string | null }[]>([])
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer')
  const [sending, setSending] = useState(false)
  const toast = useToast()

  useEffect(() => {
    authApi.listUsers().then(d => setUsers(d.users || [])).catch(() => {})
  }, [])

  const filtered = users.filter(u => {
    if (existingUserIds.includes(u.id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const handleInvite = async () => {
    if (!selectedUserId) return
    setSending(true)
    try {
      await journeyApi.addContributor(journeyId, selectedUserId, role)
      toast.success(t('journey.contributors.added'))
      onInvited()
    } catch {
      toast.error(t('journey.contributors.addFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-[rgba(9,9,11,0.75)]">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] max-w-[420px] w-full flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">{t('journey.contributors.invite')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Search */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('journey.contributors.searchUser')}</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('journey.contributors.searchPlaceholder')}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          {/* User list */}
          <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1">
            {filtered.length === 0 && (
              <p className="text-[12px] text-zinc-400 text-center py-4">{t('journey.contributors.noUsers')}</p>
            )}
            {filtered.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${
                  selectedUserId === u.id
                    ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-white'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[12px] font-semibold">
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-zinc-900 dark:text-white">{u.username}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{u.email}</div>
                </div>
                {selectedUserId === u.id && (
                  <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                    <Check size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Role selector */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.invite.role')}</label>
            <div className="flex gap-2">
              {(['viewer', 'editor'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                    role === r
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                  }`}
                >
                  {t(`journey.invite.${r}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedUserId || sending}
            className="px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? t('journey.invite.inviting') : t('journey.invite.invite')}
          </button>
        </div>
      </div>
    </div>
  )
}
