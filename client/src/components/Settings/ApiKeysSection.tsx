import React, { useEffect, useId, useRef, useState } from 'react'
import {
  KeyRound, Plus, Trash2, Copy, Check, AlertTriangle, Briefcase, CalendarDays, MapPin,
  StickyNote, Ticket, Hotel, Users, Star, BarChart3, type LucideIcon,
} from 'lucide-react'
import { PUBLIC_API_SCOPES, type PublicApiScope } from '@trek/shared'
import Section from './Section'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, GRID_2, INPUT, LABEL } from '../shared/dialogParts'
import { SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON, SettingsHint, StatusPill } from './settingsKit'
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
      <code key={i} className="rounded-[5px] bg-surface-tertiary px-1 py-px font-geist text-content-secondary">
        {part.replace(/^"|"$/g, '')}
      </code>
    )
  })
}

export default function ApiKeysSection(): React.ReactElement {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const dialogLabelId = useId()
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

  const header = (
    <DialogHeader
      tile={<DialogTile><KeyRound size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={dialogLabelId}
      // Once the key is on screen the cross does what Done does: it is a deliberate
      // click, unlike the Escape and backdrop the shell ignores below.
      onClose={closeModal}
      title={created ? t('settings.apiKeys.modal.createdTitle') : t('settings.apiKeys.modal.createTitle')}
    />
  )

  const footer = created ? (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton variant="primary" onClick={closeModal}>{t('settings.apiKeys.modal.done')}</DialogButton>
    </DialogFooter>
  ) : (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={closeModal}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={handleCreate} disabled={!canCreate}
        icon={creating ? <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : undefined}>
        {creating ? t('settings.apiKeys.modal.creating') : t('settings.apiKeys.modal.create')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <>
      <Section
        title={t('settings.apiKeys.title')}
        icon={KeyRound}
        badge={keys.length > 0 ? <StatusPill>{keys.length}/{MAX_KEYS}</StatusPill> : undefined}
        action={(
          <button type="button" onClick={openModal} disabled={atLimit} className={SETTINGS_BUTTON_PRIMARY} style={fs(12.5, 'body')}>
            <Plus size={14} /> {t('settings.apiKeys.create')}
          </button>
        )}
      >
        <SettingsHint>{t('settings.apiKeys.description')}</SettingsHint>

        {atLimit && (
          <div className="flex gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-content" style={fs(12.5, 'body')}>
            <AlertTriangle size={15} className="mt-px flex-none text-warning" />
            <p className="m-0 leading-snug">{t('settings.apiKeys.limitReached', { max: MAX_KEYS })}</p>
          </div>
        )}

        {loadState === 'loading' && (
          <div aria-hidden className="flex flex-col gap-2">
            <div className="h-[62px] animate-pulse rounded-[12px] bg-surface-tertiary" />
          </div>
        )}

        {loadState === 'failed' && (
          <p role="alert" className="m-0 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-danger" style={fs(12.5, 'body')}>
            {t('settings.apiKeys.loadFailed')}
          </p>
        )}

        {loadState === 'ready' && keys.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 rounded-[12px] border border-dashed border-edge bg-surface-card px-4 py-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-surface-tertiary text-content-muted">
              <KeyRound size={18} strokeWidth={1.9} />
            </span>
            <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>{t('settings.apiKeys.empty')}</p>
          </div>
        )}

        {keys.length > 0 && (
          <ul className="m-0 list-none divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card p-0">
            {keys.map(key => (
              <ApiKeyRow key={key.id} apiKey={key} locale={locale} onDelete={() => setDeleteId(key.id)} />
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t border-edge-faint pt-4">
          <span className={LABEL + ' !mb-0'}>{t('settings.apiKeys.endpoint')}</span>
          <div className="flex items-center gap-2">
            <code className="block min-w-0 flex-1 truncate rounded-[10px] border border-edge-faint bg-surface-card px-3 py-2 font-geist text-content" style={fs(12.5, 'body')}>
              {endpoint}
            </code>
            <Tooltip label={t('common.copy')}>
              <button type="button" onClick={() => handleCopy(endpoint, 'endpoint')}
                className={`${SETTINGS_ICON_BUTTON} !h-9 !w-9`}
                aria-label={t('common.copy')}>
                {copied === 'endpoint' ? <Check size={15} className="text-success" /> : <Copy size={15} />}
              </button>
            </Tooltip>
          </div>
          <SettingsHint>{withCode(t('settings.apiKeys.docsHint'))}</SettingsHint>
        </div>
      </Section>

      <DialogShell
        open={modalOpen}
        // Once the key is on screen, Done is the only way out: a stray Escape or
        // backdrop click would throw away the one copy there will ever be.
        onClose={created ? () => {} : closeModal}
        blocked={!!created}
        labelledBy={dialogLabelId}
        width="detail"
        header={header}
        footer={footer}
      >
        {created ? (
          <>
            <div className="flex items-start gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-3">
              <AlertTriangle size={15} className="mt-px flex-none text-warning" />
              <p className="m-0 text-content" style={fs(12.5, 'body')}>{t('settings.apiKeys.modal.createdWarning')}</p>
            </div>
            <div className="flex items-stretch overflow-hidden rounded-[12px] border border-edge-faint bg-surface-secondary">
              <code className="min-w-0 flex-1 select-all break-all px-3.5 py-3 font-geist text-content" style={fs(12.5, 'body')}>{created}</code>
              <button type="button" onClick={() => handleCopy(created, 'key')} title={t('settings.apiKeys.copy')}
                className="flex flex-none items-center gap-1.5 border-l border-edge-faint bg-surface-card px-3.5 font-medium text-content-secondary transition-colors hover:text-content"
                style={fs(12.5, 'body')}>
                {copied === 'key' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied === 'key' ? t('common.copied') : t('settings.apiKeys.copy')}
              </button>
            </div>
          </>
        ) : (
          <>
            <EditorField label={t('settings.apiKeys.modal.name')} htmlFor="api-key-name" hint={t('settings.apiKeys.modal.nameHint')}>
              <input id="api-key-name" type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
                placeholder={t('settings.apiKeys.modal.namePlaceholder')}
                maxLength={100}
                className={INPUT}
                autoFocus />
            </EditorField>

            <section role="group" aria-labelledby="api-key-scopes-title">
              <div className="mb-2 flex items-center gap-2">
                <span id="api-key-scopes-title" className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
                  {t('settings.apiScopes.title')}
                </span>
                <button type="button"
                  onClick={() => setNewScopes(allSelected ? new Set() : new Set(PUBLIC_API_SCOPES))}
                  className="ml-auto flex-none rounded-full px-2 py-0.5 font-semibold text-content-muted transition-colors hover:bg-surface-tertiary hover:text-content"
                  style={fs(11.5, 'body')}>
                  {allSelected ? t('common.deselectAll') : t('common.selectAll')}
                </button>
              </div>
              <SettingsHint className="mb-3">{t('settings.apiScopes.hint')}</SettingsHint>
              <div className={GRID_2}>
                {PUBLIC_API_SCOPES.map(scope => (
                  <ScopeOption key={scope} icon={SCOPE_ICONS[scope]} label={t(`settings.apiScopes.${scope}`)}
                    checked={newScopes.has(scope)} onToggle={() => toggleScope(scope)} />
                ))}
              </div>
              {newScopes.size === 0 && (
                <p className="m-0 mt-2 text-danger" style={fs(11.5)}>{t('settings.apiScopes.noneSelected')}</p>
              )}
            </section>
          </>
        )}
      </DialogShell>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) void handleDelete(deleteId) }}
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
    <li className="flex items-start gap-3 px-3.5 py-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
        <KeyRound size={16} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 max-w-full truncate font-semibold text-content" style={fs(13, 'body')}>{apiKey.name}</span>
          <code className="rounded-full border border-edge-faint bg-surface-secondary px-2 py-[1px] font-geist text-content-muted" style={fs(11)}>
            {apiKey.token_prefix}…
          </code>
        </div>
        <p className="m-0 mt-0.5 tabular-nums text-content-faint first-letter:uppercase" style={fs(11.5)}>
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
              <StatusPill key={scope} icon={Icon ? <Icon size={11} strokeWidth={2.2} /> : undefined}>
                {t(`settings.apiScopes.${scope}`)}
              </StatusPill>
            )
          }) : (
            <StatusPill tone="success">{t('settings.apiScopes.all')}</StatusPill>
          )}
        </div>
      </div>
      <Tooltip label={t('settings.apiKeys.deleteTitle')}>
        <button type="button" onClick={onDelete}
          className={`${SETTINGS_ICON_BUTTON} hover:!bg-danger-soft hover:!text-danger`}
          aria-label={t('settings.apiKeys.deleteTitle')}>
          <Trash2 size={14} />
        </button>
      </Tooltip>
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
      className={`flex w-full min-w-0 items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors ${
        checked ? 'border-[color:var(--text-primary)] bg-surface-card shadow-sm' : 'border-edge-faint bg-surface-secondary hover:bg-surface-card'
      }`}>
      <span aria-hidden
        className={`grid h-4 w-4 flex-none place-items-center rounded-[5px] transition-colors ${
          checked ? 'bg-accent' : 'border-[1.5px] border-edge'
        }`}>
        {checked && <Check size={10} strokeWidth={3} className="text-accent-text" />}
      </span>
      <Icon aria-hidden size={15} className={`flex-none ${checked ? 'text-content-secondary' : 'text-content-faint'}`} />
      <span className={`min-w-0 truncate font-medium ${checked ? 'text-content' : 'text-content-muted'}`} style={fs(12.5, 'body')}>{label}</span>
    </button>
  )
}
