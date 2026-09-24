import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, Check, Loader2, Plus } from 'lucide-react'
import Modal from '../../shared/Modal'
import { useTranslation } from '../../../i18n/TranslationContext'
import { DOCUMENT_PROVIDER_ICONS } from '../../shared/DocumentProviderIcons'
import { StateBadge } from './DocSyncBits'
import { useConflicts } from './useConflicts'
import { storeName, useDocSync, type DocSyncLink, type DocSyncProvider } from './useDocSync'
import DocSyncBinding from './DocSyncBinding'
import DocSyncConnectModal from './DocSyncConnectModal'
import DocSyncScopeModal from './DocSyncScopeModal'

/**
 * Document sync for one trip, as a dialog with the stores down one side and the
 * selected one open beside it.
 *
 * Two columns rather than a stack, because the two questions are different
 * shapes: "which store" is a short list somebody scans, and "how does this one
 * behave" is a screenful. Stacked, the second answer pushed the first one off
 * the top every time a binding was added.
 *
 * It opens from the file manager rather than from settings: this is the one
 * screen where a person has the context that makes the folder choice obvious.
 * Only the trip owner can change a binding (the credential usually reaches
 * their whole archive), but every member sees where their documents go, which
 * is the minimum a shared folder owes the people sharing it.
 */
export default function DocSyncPanel({
  tripId,
  tripTitle,
  canManage,
  onClose,
}: {
  tripId: number | string
  tripTitle?: string
  canManage: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const sync = useDocSync(tripId, true)
  const [selected, setSelected] = useState<number | null>(null)
  const [connecting, setConnecting] = useState<DocSyncProvider | null>(null)
  const [scopeFor, setScopeFor] = useState<string | null>(null)
  // The credential form again, for a store this trip is already bound to. Kept
  // apart from `connecting`, whose next step is the folder picker: here the
  // folder is known and the next step is the run that the refusal stopped.
  const [reconnecting, setReconnecting] = useState<DocSyncProvider | null>(null)

  const bound = useMemo(() => new Set(sync.links.map(l => l.providerId)), [sync.links])
  const available = sync.providers.filter(p => !bound.has(p.id))
  const active = sync.links.find(l => l.id === selected) ?? sync.links[0] ?? null
  // Undefined once an admin has switched the store off: the form needs the
  // provider's field list, and the providers route no longer carries it.
  const activeProvider = active ? sync.providers.find(p => p.id === active.providerId) : undefined

  // Follow the list: a freshly bound store should be the one on screen, and a
  // removed one must not leave the detail column pointing at nothing. The pick
  // is read when the update runs, not from this render: a store clicked before
  // the effect got its turn was otherwise switched straight back.
  useEffect(() => {
    setSelected(prev => (sync.links.some(l => l.id === prev) ? prev : (sync.links[0]?.id ?? null)))
  }, [sync.links])

  const attention = ATTENTION_STATES.reduce((n, k) => n + (sync.itemCounts[k] ?? 0), 0)

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="4xl"
        title={
          <span className="flex flex-col">
            <span>{t('docsync.title')}</span>
            {tripTitle && (
              <span className="mt-0.5 truncate text-caption font-normal text-content-muted">{tripTitle}</span>
            )}
          </span>
        }
      >
        {sync.loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 size={22} className="animate-spin text-content-faint" />
          </div>
        ) : sync.providers.length === 0 && sync.links.length === 0 ? (
          // Only with nothing bound: a binding outlives the admin switching its
          // provider off, and the people sharing it still need to see it.
          <Empty />
        ) : (
          <div className="grid gap-5 md:grid-cols-[17rem_minmax(0,1fr)] md:gap-6">
            <Sidebar
              links={sync.links}
              providers={sync.providers}
              available={available}
              activeId={active?.id ?? null}
              canManage={canManage}
              onSelect={setSelected}
              onAdd={p => (sync.connectionFor(p.id) ? setScopeFor(p.id) : setConnecting(p))}
            />

            <div className="min-w-0 md:border-l md:border-edge-faint md:pl-6">
              {active ? (
                <div className="space-y-5">
                  <DocSyncBinding
                    link={active}
                    providerName={storeName(active, sync.providers)}
                    sync={sync}
                    canManage={canManage}
                    onReconnect={activeProvider ? () => setReconnecting(activeProvider) : undefined}
                  />
                  {/* Every action in this column reports here: a refused run, a
                      switch that flipped back, a conflict the server would not
                      settle. The two dialogs say their own, but nothing said
                      what happened to a click on the card itself. */}
                  {sync.error && (
                    <p role="alert" className="rounded-xl border border-edge bg-danger-soft px-3 py-2.5 text-caption text-danger">
                      {t(`docsync.error.${sync.error}`)}
                    </p>
                  )}
                  {attention > 0 && (
                    <Attention counts={sync.itemCounts} tripId={tripId} sync={sync} canManage={canManage} />
                  )}
                </div>
              ) : (
                <NothingBound canManage={canManage} />
              )}
            </div>
          </div>
        )}
      </Modal>

      {connecting && (
        <DocSyncConnectModal
          provider={connecting}
          sync={sync}
          onClose={() => setConnecting(null)}
          onConnected={id => { setConnecting(null); setScopeFor(id) }}
        />
      )}

      {reconnecting && (
        <DocSyncConnectModal
          provider={reconnecting}
          sync={sync}
          onClose={() => setReconnecting(null)}
          onConnected={id => {
            setReconnecting(null)
            // Run straight away, as binding does: the card still reports the
            // refusal until a run says otherwise, and the person has just
            // done the one thing that could change the answer.
            const rebound = sync.links.find(l => l.providerId === id)
            if (rebound) void sync.syncNow(rebound.id)
          }}
        />
      )}

      {scopeFor && sync.connectionFor(scopeFor) && (
        <DocSyncScopeModal
          connection={sync.connectionFor(scopeFor)!}
          providerName={sync.providers.find(p => p.id === scopeFor)?.name ?? scopeFor}
          suggestedName={slugFor(tripTitle, tripId)}
          sync={sync}
          onClose={() => setScopeFor(null)}
          onBound={() => setScopeFor(null)}
        />
      )}
    </>
  )
}

const ATTENTION_STATES = ['conflict', 'remote_missing', 'rejected_type', 'too_large', 'error'] as const

/** The stores: the ones this trip uses, then the ones it could. */
function Sidebar({
  links,
  providers,
  available,
  activeId,
  canManage,
  onSelect,
  onAdd,
}: {
  links: DocSyncLink[]
  providers: DocSyncProvider[]
  available: DocSyncProvider[]
  activeId: number | null
  canManage: boolean
  onSelect: (id: number) => void
  onAdd: (p: DocSyncProvider) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className="space-y-5">
      {links.length > 0 && (
        <div>
          <h4 className="mb-2 px-1 text-caption font-medium text-content-muted">
            {t('docsync.sidebar.connected')}
          </h4>
          <ul className="space-y-1.5">
            {links.map(link => (
              <li key={link.id}>
                <StoreButton
                  providerId={link.providerId}
                  title={storeName(link, providers)}
                  subtitle={link.remoteLabel || link.remoteRootPath || link.scopeKey}
                  state={link.lastSyncState}
                  active={link.id === activeId}
                  onClick={() => onSelect(link.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && available.length > 0 && (
        <div>
          <h4 className="mb-2 px-1 text-caption font-medium text-content-muted">
            {links.length === 0 ? t('docsync.addProvider') : t('docsync.addAnother')}
          </h4>
          <ul className="space-y-1.5">
            {available.map(p => (
              <li key={p.id}>
                <StoreButton
                  providerId={p.id}
                  title={p.name}
                  subtitle={t(`docsync.model.${p.id}`)}
                  onClick={() => onAdd(p)}
                  addable
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}

/**
 * One row in the store list.
 *
 * The selected row is marked with the accent on a subtle fill rather than a
 * heavy border, so a list of five does not turn into five competing boxes.
 */
function StoreButton({
  providerId,
  title,
  subtitle,
  state,
  active,
  addable,
  onClick,
}: {
  providerId: string
  title: string
  subtitle: string
  state?: string
  active?: boolean
  addable?: boolean
  onClick: () => void
}) {
  const Icon = DOCUMENT_PROVIDER_ICONS[providerId]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={[
        'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-transparent bg-accent-subtle'
          : 'border-edge bg-surface hover:bg-surface-hover',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          active ? 'bg-surface' : 'bg-surface-secondary',
        ].join(' ')}
      >
        {Icon ? <Icon className={`h-4 w-4 ${active ? 'text-accent-on' : 'text-content'}`} /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block truncate text-body ${active ? 'font-medium text-accent-on' : 'text-content'}`}>
          {title}
        </span>
        <span className="mt-0.5 block truncate text-caption text-content-muted">{subtitle}</span>
      </span>

      {addable ? (
        <Plus size={14} className="shrink-0 text-content-faint transition-transform group-hover:scale-110" />
      ) : state ? (
        <StateBadge state={state} compact />
      ) : null}
    </button>
  )
}

/** What a person still has to decide about, named rather than counted in a chip. */
function Attention({
  counts,
  tripId,
  sync,
  canManage,
}: {
  counts: Record<string, number>
  tripId: number | string
  sync: ReturnType<typeof useDocSync>
  canManage: boolean
}) {
  const { t } = useTranslation()
  const rows = ATTENTION_STATES.filter(k => (counts[k] ?? 0) > 0)
  const [showConflicts, setShowConflicts] = useState(false)
  const conflicts = useConflicts(tripId, sync, showConflicts)

  return (
    <section className="rounded-xl border border-edge bg-surface">
      <h4 className="flex items-center gap-2 border-b border-edge-faint px-4 py-2.5 text-body font-medium text-content">
        <AlertCircle size={14} className="text-warning" />
        {t('docsync.issues.title')}
      </h4>
      <ul className="divide-y divide-edge-faint">
        {rows.map(k => (
          <li key={k} className="px-4 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-body text-content">{t(`docsync.state.${k}`)}</span>
                <span className="mt-0.5 block text-caption text-content-muted">{t(`docsync.issues.${k}`)}</span>
              </span>
              {/* A conflict is the one of these a person can act on, so it is
                  the one that opens. The rest are a state to read. Only for
                  the owner: the server refuses a member's choice, so a member
                  gets the count, like every other row. */}
              {k === 'conflict' && canManage ? (
                <button
                  type="button"
                  onClick={() => setShowConflicts(v => !v)}
                  className="shrink-0 rounded-lg border border-edge px-2.5 py-1 text-caption font-medium text-content transition-colors hover:bg-surface-hover"
                >
                  {showConflicts ? t('common.close') : t('docsync.conflict.resolve', { count: counts[k] })}
                </button>
              ) : (
                <span className="shrink-0 text-body font-medium tabular-nums text-content">{counts[k]}</span>
              )}
            </div>

            {k === 'conflict' && canManage && showConflicts && (
              <ul className="mt-3 space-y-2">
                {conflicts.items === null && (
                  <li className="flex justify-center py-2">
                    <Loader2 size={14} className="animate-spin text-content-muted" />
                  </li>
                )}
                {conflicts.items?.map(item => (
                  <li key={item.id} className="rounded-lg bg-surface-secondary px-3 py-2.5">
                    <p className="truncate text-body text-content" title={item.name}>{item.name}</p>
                    <p className="mt-0.5 text-caption text-content-muted">{t('docsync.conflict.title')}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(['trek', 'provider', 'both'] as const).map(keep => (
                        <button
                          key={keep}
                          type="button"
                          disabled={conflicts.working === item.id}
                          onClick={() => void conflicts.resolve(item.id, keep)}
                          className="rounded-lg border border-edge px-2.5 py-1 text-caption text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                        >
                          {t(`docsync.conflict.${keep === 'trek' ? 'keepTrek' : keep === 'provider' ? 'keepProvider' : 'keepBoth'}`)}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The detail column before anything is bound: an invitation, not a blank. */
function NothingBound({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="grid h-full min-h-[16rem] place-items-center rounded-xl border border-dashed border-edge px-6 py-12 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-edge bg-surface-secondary">
          <ArrowRight size={18} className="text-content-faint" />
        </span>
        <p className="mt-3 text-body text-content">{t('docsync.empty.title')}</p>
        <p className="mx-auto mt-1 max-w-xs text-caption text-content-muted">
          {canManage ? t('docsync.empty.hintOwner') : t('docsync.empty.hintMember')}
        </p>
      </div>
    </div>
  )
}

function Empty() {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-dashed border-edge px-6 py-12 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-edge bg-surface-secondary">
        <Check size={18} className="text-content-faint" />
      </span>
      <p className="mt-3 text-body text-content">{t('docsync.noProviders')}</p>
      <p className="mx-auto mt-1 max-w-sm text-caption text-content-muted">{t('docsync.noProvidersHint')}</p>
    </div>
  )
}

/**
 * A folder name from the trip's own title, so nobody has to invent one.
 *
 * The id is appended because two trips can share a title and a folder cannot.
 */
function slugFor(title: string | undefined, tripId: number | string): string {
  const base = (title || 'trek')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${base || 'trek'}-${tripId}`
}
