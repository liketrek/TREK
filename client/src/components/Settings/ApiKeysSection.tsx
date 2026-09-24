import React, { useEffect, useRef, useState } from 'react'
import {
  KeyRound, Plus, Trash2, Copy, Check, AlertTriangle, Briefcase, CalendarDays, MapPin,
  StickyNote, Ticket, Hotel, Users, Star, BarChart3, type LucideIcon,
} from 'lucide-react'
import { PUBLIC_API_SCOPES, type PublicApiScope } from '@trek/shared'
import Section from './Section'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
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
  /** 'all' for every key minted before scopes existed, and for any key created without narrowing. */
  scope_mode?: 'all' | 'limited'
  scopes?: PublicApiScope[]
}

/** The server refuses an eleventh key (`TokenService.createToken`). */
const MAX_KEYS = 10

/** The glyph each area already wears elsewhere in the app, so the list reads like the planner. */
const SCOPE_ICONS: Record<PublicApiScope, LucideIcon> = {
  trips: Briefcase,
  days: CalendarDays,
  places: MapPin,
  notes: StickyNote,
  reservations: Ticket,
  accommodations: Hotel,
  travellers: Users,
  'bucket-list': Star,
  stats: BarChart3,
}

/** SQLite hands out "YYYY-MM-DD HH:MM:SS" in UTC, which Safari will not parse as it stands. */
function formatStamp(ts: string, locale: string): string {
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T')
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`)
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleDateString(locale)
}

/**
 * The usage hint with its header names and path set as code.
 *
 * Every locale quotes the two headers the same way, so they can be picked out
 * of the sentence instead of cutting it into fragments a translator would have
 * to reassemble. A translation that drops the quotes simply stays plain text.
 */
function withCode(text: string): React.ReactNode[] {
  return text.split(/("[^"]+"|\/api\/v1)/).map((part, i) => {
    if (i % 2 === 0) return part
    return (
      <code key={i} className="rounded px-1 py-px font-mono bg-surface-hover text-content-secondary">
        {part.replace(/^"|"$/g, '')}
      </code>
    )
  })
}

export default function ApiKeysSection(): React.ReactElement {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  /** A failed load must not read as "you have no keys": that sends people off minting duplicates. */
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  /** The raw key, held only until the modal closes — the server keeps a hash. */
  const [created, setCreated] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [copied, setCopied] = useState<'key' | 'endpoint' | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /**
   * What the new key may read. Starts as everything, because that is what a key
   * did before this existed and what most integrations want — narrowing is a
   * deliberate act, and the dialog should not make the common case work harder.
   */
  const [newScopes, setNewScopes] = useState<Set<PublicApiScope>>(new Set(PUBLIC_API_SCOPES))

  const endpoint = `${window.location.origin}/api/v1`
  const atLimit = keys.length >= MAX_KEYS
  const allSelected = newScopes.size === PUBLIC_API_SCOPES.length
  const canCreate = !!newName.trim() && !creating && newScopes.size > 0

  useEffect(() => {
    let cancelled = false
    authApi.apiKeys.list()
      .then(d => {
        if (cancelled) return
        setKeys(d.tokens || [])
        setLoadState('ready')
      })
      .catch(() => { if (!cancelled) setLoadState('failed') })
    return () => {
      cancelled = true
      clearTimeout(copiedTimer.current)
    }
  }, [])

  const handleCreate = async () => {
    // Enter in the name field arrives here past the button's disabled state, and
    // an empty selection must not fall through to the "no narrowing" branch
    // below, which would mint a key that reads everything.
    if (!canCreate) return
    setCreating(true)
    try {
      // All of them selected means "no narrowing", which is what the server
      // stores as `all` — sending the full list would record it as a limited key
      // that happens to allow everything, and a section added in a later version
      // would then be refused for a key nobody meant to restrict.
      const narrowed = allSelected ? undefined : [...newScopes]
      const d = await authApi.apiKeys.create(newName.trim(), narrowed)
      setCreated(d.token.raw_token)
      setKeys(prev => [
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
    }
  }

  const handleCopy = async (text: string, what: 'key' | 'endpoint') => {
    try {
      // Absent on a plain-http origin, which is exactly where a self-run
      // instance on the LAN tends to live.
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(text)
      setCopied(what)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error(t('settings.apiKeys.copyFailed'))
    }
  }

  const resetForm = () => {
    setCreated(null)
    setCopied(null)
    setNewName('')
    setNewScopes(new Set(PUBLIC_API_SCOPES))
  }

  const openModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const toggleScope = (scope: PublicApiScope) => {
    setNewScopes(prev => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })
  }

  return (
    <>
      <Section title={t('settings.apiKeys.title')} icon={KeyRound}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p className="text-body text-content-secondary">{t('settings.apiKeys.description')}</p>
          <button type="button" onClick={openModal} disabled={atLimit}
            className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-lg px-3.5 py-2 text-body font-medium transition-colors bg-accent text-accent-text hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="w-4 h-4" /> {t('settings.apiKeys.create')}
          </button>
        </div>

        {atLimit && (
          <p className="text-caption text-content-muted">{t('settings.apiKeys.limitReached', { max: MAX_KEYS })}</p>
        )}

        {loadState === 'failed' && (
          <p role="alert" className="rounded-lg px-3 py-2.5 text-caption bg-danger-soft text-danger">
            {t('settings.apiKeys.loadFailed')}
          </p>
        )}

        {loadState === 'ready' && keys.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 rounded-lg border border-dashed px-4 py-6 text-center border-edge">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover">
              <KeyRound className="w-5 h-5 text-content-muted" />
            </span>
            <p className="text-body text-content-muted">{t('settings.apiKeys.empty')}</p>
          </div>
        )}

        {keys.length > 0 && (
          <ul className="m-0 list-none space-y-2 p-0">
            {keys.map(key => (
              <ApiKeyRow key={key.id} apiKey={key} locale={locale} onDelete={() => setDeleteId(key.id)} />
            ))}
          </ul>
        )}

        <div className="space-y-2 border-t pt-4 border-edge-secondary">
          <span className="block text-caption font-medium text-content-secondary">{t('settings.apiKeys.endpoint')}</span>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border px-3 py-2 font-mono text-caption border-edge bg-surface-secondary text-content">
              {endpoint}
            </code>
            <button type="button" onClick={() => handleCopy(endpoint, 'endpoint')}
              className="flex-shrink-0 rounded-lg border p-2 transition-colors border-edge text-content-secondary hover:bg-surface-hover"
              title={t('common.copy')} aria-label={t('common.copy')}>
              {copied === 'endpoint' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-caption text-content-muted">{withCode(t('settings.apiKeys.docsHint'))}</p>
        </div>
      </Section>

      <Modal
        isOpen={modalOpen}
        // Once the key is on screen, Done is the only way out: a stray Escape or
        // backdrop click would throw away the one copy there will ever be.
        onClose={created ? () => {} : closeModal}
        hideCloseButton={!!created}
        size="lg"
        title={created ? t('settings.apiKeys.modal.createdTitle') : t('settings.apiKeys.modal.createTitle')}
        footer={created ? (
          <div className="flex justify-end">
            <button type="button" onClick={closeModal}
              className="rounded-lg px-4 py-2 text-body font-medium transition-colors bg-accent text-accent-text hover:bg-accent-hover">
              {t('settings.apiKeys.modal.done')}
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal}
              className="rounded-lg border px-4 py-2 text-body font-medium transition-colors border-edge text-content-secondary hover:bg-surface-hover">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={handleCreate} disabled={!canCreate}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-body font-medium transition-colors bg-accent text-accent-text hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
              {creating && <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              {creating ? t('settings.apiKeys.modal.creating') : t('settings.apiKeys.modal.create')}
            </button>
          </div>
        )}
      >
        {created ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg p-3 bg-warning-soft">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
              <p className="text-caption text-content">{t('settings.apiKeys.modal.createdWarning')}</p>
            </div>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-edge bg-surface-secondary">
              <code className="min-w-0 flex-1 select-all break-all px-3 py-2.5 font-mono text-caption text-content">{created}</code>
              <button type="button" onClick={() => handleCopy(created, 'key')} title={t('settings.apiKeys.copy')}
                className="flex flex-shrink-0 items-center gap-1.5 border-l px-3 text-caption font-medium transition-colors border-edge text-content-secondary hover:bg-surface-hover">
                {copied === 'key' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'key' ? t('common.copied') : t('settings.apiKeys.copy')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="api-key-name" className="mb-1.5 block text-caption font-medium text-content-secondary">
                {t('settings.apiKeys.modal.name')}
              </label>
              <input id="api-key-name" type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                placeholder={t('settings.apiKeys.modal.namePlaceholder')}
                maxLength={100}
                className="w-full rounded-lg border px-3 py-2.5 text-body focus:outline-none focus:ring-2 ring-accent border-edge bg-surface-input text-content"
                autoFocus />
              <p className="mt-1.5 text-caption text-content-muted">{t('settings.apiKeys.modal.nameHint')}</p>
            </div>

            <div role="group" aria-labelledby="api-key-scopes-title">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span id="api-key-scopes-title" className="text-caption font-medium text-content-secondary">
                  {t('settings.apiScopes.title')}
                </span>
                <button type="button"
                  onClick={() => setNewScopes(allSelected ? new Set() : new Set(PUBLIC_API_SCOPES))}
                  className="flex-shrink-0 text-caption font-medium transition-colors text-content-muted hover:text-content">
                  {allSelected ? t('common.deselectAll') : t('common.selectAll')}
                </button>
              </div>
              <p className="mb-3 text-caption text-content-muted">{t('settings.apiScopes.hint')}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PUBLIC_API_SCOPES.map(scope => (
                  <ScopeOption key={scope} icon={SCOPE_ICONS[scope]} label={t(`settings.apiScopes.${scope}`)}
                    checked={newScopes.has(scope)} onToggle={() => toggleScope(scope)} />
                ))}
              </div>
              {newScopes.size === 0 && (
                <p className="mt-2 text-caption text-danger">{t('settings.apiScopes.noneSelected')}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) handleDelete(deleteId) }}
        title={t('settings.apiKeys.deleteTitle')}
        message={t('settings.apiKeys.deleteMessage')}
        confirmLabel={t('settings.apiKeys.deleteTitle')}
      />
    </>
  )
}

function ApiKeyRow({ apiKey, locale, onDelete }: { apiKey: ApiKey; locale: string; onDelete: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const scopes = apiKey.scope_mode === 'limited' ? apiKey.scopes : undefined
  return (
    <li className="flex items-start gap-3 rounded-lg border p-3 border-edge">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-hover">
        <KeyRound className="w-4 h-4 text-content-secondary" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-body font-medium text-content">{apiKey.name}</span>
          <code className="rounded px-1.5 py-0.5 font-mono text-caption bg-surface-hover text-content-muted">
            {apiKey.token_prefix}…
          </code>
        </div>
        <p className="mt-0.5 text-caption text-content-faint first-letter:uppercase">
          {t('settings.apiKeys.createdAt')} {formatStamp(apiKey.created_at, locale)}
          {' · '}
          {apiKey.last_used_at
            ? `${t('settings.apiKeys.usedAt')} ${formatStamp(apiKey.last_used_at, locale)}`
            : t('settings.apiKeys.neverUsed')}
        </p>
        {/* What the key may read. Shown on the row rather than behind a detail
            view: the whole reason to narrow a key is to be able to see later
            that you did. */}
        <div className="mt-2 flex flex-wrap gap-1">
          {scopes ? scopes.map(scope => {
            const Icon = SCOPE_ICONS[scope]
            return (
              <span key={scope} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption bg-surface-hover text-content-secondary">
                {Icon && <Icon className="w-3 h-3" />}
                {t(`settings.apiScopes.${scope}`)}
              </span>
            )
          }) : (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-caption bg-surface-hover text-content-secondary">
              {t('settings.apiScopes.all')}
            </span>
          )}
        </div>
      </div>
      <button type="button" onClick={onDelete}
        className="flex-shrink-0 rounded-lg p-1.5 transition-colors text-content-faint hover:bg-danger-soft hover:text-danger"
        title={t('settings.apiKeys.deleteTitle')}>
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  )
}

/**
 * One area the key may read. The whole tile is the control: a bare browser
 * checkbox is a small target and ignores the user's accent.
 */
function ScopeOption({ icon: Icon, label, checked, onToggle }: {
  icon: LucideIcon
  label: string
  checked: boolean
  onToggle: () => void
}): React.ReactElement {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors border-edge ${
        checked ? 'bg-accent-subtle' : 'hover:bg-surface-hover'
      }`}>
      <span aria-hidden
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors ${
          checked ? 'bg-accent' : 'border-[1.5px] border-edge'
        }`}>
        {checked && <Check className="w-2.5 h-2.5 text-accent-text" strokeWidth={3} />}
      </span>
      <Icon aria-hidden className={`w-4 h-4 flex-shrink-0 ${checked ? 'text-content-secondary' : 'text-content-faint'}`} />
      <span className={`min-w-0 truncate text-body ${checked ? 'text-content' : 'text-content-muted'}`}>{label}</span>
    </button>
  )
}
