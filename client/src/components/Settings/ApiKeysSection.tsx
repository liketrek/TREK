import React, { useEffect, useState } from 'react'
import { KeyRound, Plus, Trash2, Copy, Check } from 'lucide-react'
import Section from './Section'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { authApi } from '../../api/client'

/**
 * Keys for the public API — the credential a user hands to other software that
 * should read their trips.
 *
 * Its own section rather than a third tab under MCP: an API key is not an MCP
 * credential, it does not need the MCP addon, and burying it under a heading
 * about AI assistants is how people end up minting the wrong kind. The two look
 * alike deliberately (name, prefix, shown once) because they are the same
 * gesture; what differs is which door they open.
 *
 * State lives here rather than in the tab's shared hook so the section works on
 * an instance with MCP switched off.
 */
interface ApiKey {
  id: number
  name: string
  token_prefix: string
  created_at: string
  last_used_at: string | null
}

export default function ApiKeysSection(): React.ReactElement {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  /** The raw key, held only until the modal closes — the server keeps a hash. */
  const [created, setCreated] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    authApi.apiKeys.list().then(d => setKeys(d.tokens || [])).catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    try {
      const d = await authApi.apiKeys.create(newName.trim())
      setCreated(d.token.raw_token)
      setKeys(prev => [
        { id: d.token.id, name: d.token.name, token_prefix: d.token.token_prefix, created_at: d.token.created_at, last_used_at: null },
        ...prev,
      ])
      setNewName('')
    } catch {
      toast.error(t('settings.apiKeys.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await authApi.apiKeys.delete(id)
      setKeys(prev => prev.filter(k => k.id !== id))
      toast.success(t('settings.apiKeys.deleted'))
    } catch {
      toast.error(t('settings.apiKeys.deleteFailed'))
    } finally {
      setDeleteId(null)
    }
  }

  const handleCopy = () => {
    if (!created) return
    navigator.clipboard.writeText(created)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeModal = () => {
    setModalOpen(false)
    setCreated(null)
    setNewName('')
  }

  return (
    <>
      <Section title={t('settings.apiKeys.title')} icon={KeyRound}>
        <p className="text-sm text-content-secondary">{t('settings.apiKeys.description')}</p>

        <div className="flex justify-end">
          <button type="button" onClick={() => { setModalOpen(true); setCreated(null); setNewName('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-white bg-slate-900 hover:bg-slate-700">
            <Plus className="w-3.5 h-3.5" /> {t('settings.apiKeys.create')}
          </button>
        </div>

        {keys.length === 0 ? (
          <p className="text-sm py-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
            {t('settings.apiKeys.empty')}
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden border-edge">
            {keys.map((key, i) => (
              <div key={key.id} className={`flex items-center gap-3 px-4 py-3 ${i < keys.length - 1 ? 'border-b border-edge' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-content">{key.name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {key.token_prefix}...
                    <span className="ml-3 font-sans">{t('settings.apiKeys.createdAt')} {new Date(key.created_at).toLocaleDateString(locale)}</span>
                    {key.last_used_at && (
                      <span className="ml-2">· {t('settings.apiKeys.usedAt')} {new Date(key.last_used_at).toLocaleDateString(locale)}</span>
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => setDeleteId(key.id)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  style={{ color: 'var(--text-tertiary)' }} title={t('settings.apiKeys.deleteTitle')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('settings.apiKeys.docsHint')}</p>
      </Section>

      {modalOpen && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.5)]"
          onClick={e => { if (e.target === e.currentTarget && !created) closeModal() }}>
          <div className="rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 bg-surface-card">
            {!created ? (
              <>
                <h3 className="text-lg font-semibold text-content">{t('settings.apiKeys.modal.createTitle')}</h3>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-content-secondary">{t('settings.apiKeys.modal.name')}</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder={t('settings.apiKeys.modal.namePlaceholder')}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 border-edge bg-surface-secondary text-content"
                    autoFocus />
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('settings.apiKeys.modal.nameHint')}</p>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm border border-edge text-content-secondary">
                    {t('common.cancel')}
                  </button>
                  <button type="button" onClick={handleCreate} disabled={!newName.trim() || creating}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50">
                    {creating ? t('settings.apiKeys.modal.creating') : t('settings.apiKeys.modal.create')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-content">{t('settings.apiKeys.modal.createdTitle')}</h3>
                <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-[rgba(251,191,36,0.1)]">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <p className="text-sm text-content-secondary">{t('settings.apiKeys.modal.createdWarning')}</p>
                </div>
                <div className="relative">
                  <pre className="p-3 pr-10 rounded-lg text-xs font-mono break-all border whitespace-pre-wrap bg-surface-secondary border-edge text-content">
                    {created}
                  </pre>
                  <button type="button" onClick={handleCopy}
                    className="absolute top-2 right-2 p-1.5 rounded transition-colors hover:bg-slate-200 dark:hover:bg-slate-600 text-content-secondary"
                    title={t('settings.apiKeys.copy')}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-700">
                    {t('settings.apiKeys.modal.done')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.5)]"
          onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}>
          <div className="rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 bg-surface-card">
            <h3 className="text-base font-semibold text-content">{t('settings.apiKeys.deleteTitle')}</h3>
            <p className="text-sm text-content-secondary">{t('settings.apiKeys.deleteMessage')}</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm border border-edge text-content-secondary">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                {t('settings.apiKeys.deleteTitle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
