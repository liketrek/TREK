import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, FolderPlus, FolderSync, KeyRound, Link2Off,
  Loader2, Plus, RefreshCw,
} from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import MToggle from '../../../components/MToggle'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { TileHeader } from '../sheets/MTripSheetUi'
import { useTranslation } from '../../../../i18n'
import { DOCUMENT_PROVIDER_ICONS } from '../../../../components/shared/DocumentProviderIcons'
import TrekIcon from '../../../../components/shared/TrekIcon'
import {
  bindingNotice, needsReauth, storeName, useDocSync, type DocSyncLink, type DocSyncProvider,
} from '../../../../components/Files/docsync/useDocSync'
import { useConnectForm } from '../../../../components/Files/docsync/useConnectForm'
import { conflictPolicyKey, nextConflictPolicy } from '../../../../components/Files/docsync/DocSyncBits'
import { useConflicts } from '../../../../components/Files/docsync/useConflicts'
import { relativeTime } from '../../../../utils/relativeTime'

/**
 * Document sync on the phone.
 *
 * Everything that decides anything lives in `useDocSync`, which the desktop
 * panel uses unchanged. This file is markup in the phone's design language and
 * nothing else. The two shells are a deliberate mirror, and duplicated logic
 * across them is what the 3% duplication budget is spent on.
 *
 * One sheet with four views rather than four stacked sheets: the flow is
 * list → credentials → folder → detail, and a phone that opens a sheet per step
 * buries the close button three layers deep.
 */
type View = 'list' | 'detail' | 'connect' | 'scope'

export default function MDocSyncSheet({
  tripId,
  tripTitle,
  canManage,
  open,
  onClose,
}: {
  tripId: number | string
  tripTitle?: string
  canManage: boolean
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const sync = useDocSync(tripId, open)
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<number | null>(null)
  const [pending, setPending] = useState<DocSyncProvider | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  // The binding whose credentials are being entered again, while the connect
  // view is open for it. Kept apart from `pending`, whose next step is the
  // folder picker: here the folder is known and the next step is the run that
  // the refusal stopped.
  const [reconnectFor, setReconnectFor] = useState<number | null>(null)

  const bound = useMemo(() => new Set(sync.links.map(l => l.providerId)), [sync.links])
  const available = sync.providers.filter(p => !bound.has(p.id))
  const link = sync.links.find(l => l.id === selected) ?? null
  // Undefined once an admin has switched the store off: the form needs the
  // provider's field list, and the providers route no longer carries it.
  const linkProvider = link ? sync.providers.find(p => p.id === link.providerId) : undefined

  // A store that was removed elsewhere must not leave the detail view pointing
  // at nothing.
  useEffect(() => {
    if (view === 'detail' && !link) setView('list')
  }, [view, link])

  // Every open starts at the list: a sheet that reopens three steps deep is a
  // sheet somebody has to find their way out of.
  useEffect(() => {
    if (!open) { setView('list'); setPending(null); setReconnectFor(null) }
  }, [open])

  const openStore = (p: DocSyncProvider) => {
    setReconnectFor(null)
    setPending(p)
    setView(sync.connectionFor(p.id) ? 'scope' : 'connect')
  }

  const reconnect = (l: DocSyncLink, p: DocSyncProvider) => {
    setReconnectFor(l.id)
    setPending(p)
    setView('connect')
  }

  /** The step before this one: the binding for a reconnect, the list otherwise. */
  const back = () => {
    if (reconnectFor !== null) { setReconnectFor(null); setView('detail') } else setView('list')
  }

  const connected = () => {
    if (reconnectFor === null) { setView('scope'); return }
    // Run straight away, as binding does: the card still reports the refusal
    // until a run says otherwise, and the person has just done the one thing
    // that could change the answer.
    const id = reconnectFor
    setReconnectFor(null)
    setView('detail')
    void sync.syncNow(id)
  }

  const title =
    view === 'connect' || view === 'scope'
      ? pending?.name ?? t('docsync.title')
      : view === 'detail' && link
        ? storeName(link, sync.providers)
        : t('docsync.title')

  return (
    <>
      <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('docsync.title')}>
        <div className="flex-none px-[18px] pt-4">
          <div className="flex items-center gap-2">
            {view !== 'list' && (
              <MIconBtn variant="neutral" size={34} onClick={back} ariaLabel={t('common.back')}>
                <ChevronLeft size={16} strokeWidth={2.2} />
              </MIconBtn>
            )}
            <div className="min-w-0 flex-1">
              <TileHeader
                icon={<FolderSync size={19} strokeWidth={1.8} />}
                title={title}
                sub={view === 'list' ? tripTitle : undefined}
                onClose={onClose}
                closeLabel={t('common.close')}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
          {sync.loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-m-faint" />
            </div>
          ) : sync.providers.length === 0 && sync.links.length === 0 ? (
            // Only with nothing bound, as on the desktop panel.
            <Empty text={t('docsync.noProviders')} hint={t('docsync.noProvidersHint')} />
          ) : view === 'connect' && pending ? (
            <ConnectView
              provider={pending}
              sync={sync}
              onDone={connected}
            />
          ) : view === 'scope' && pending && sync.connectionFor(pending.id) ? (
            <ScopeView
              connectionId={sync.connectionFor(pending.id)!.id}
              suggestedName={slugFor(tripTitle, tripId)}
              sync={sync}
              onBound={() => setView('list')}
            />
          ) : view === 'detail' && link ? (
            <DetailView
              tripId={tripId}
              link={link}
              providerName={storeName(link, sync.providers)}
              sync={sync}
              canManage={canManage}
              onUnlink={() => setConfirmUnlink(true)}
              onReconnect={linkProvider ? () => reconnect(link, linkProvider) : undefined}
            />
          ) : (
            <ListView
              links={sync.links}
              providers={sync.providers}
              available={available}
              canManage={canManage}
              onOpen={id => { setSelected(id); setView('detail') }}
              onAdd={openStore}
            />
          )}
        </div>
      </MSheet>

      <MConfirmSheet
        open={confirmUnlink}
        onClose={() => setConfirmUnlink(false)}
        title={t('docsync.unlink')}
        message={t('docsync.confirmUnlink')}
        confirmLabel={t('docsync.unlink')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          setConfirmUnlink(false)
          if (link) void sync.removeLink(link.id).then(() => setView('list'))
        }}
      />
    </>
  )
}

/** The stores this trip uses, then the ones it could. */
function ListView({
  links,
  providers,
  available,
  canManage,
  onOpen,
  onAdd,
}: {
  links: DocSyncLink[]
  providers: DocSyncProvider[]
  available: DocSyncProvider[]
  canManage: boolean
  onOpen: (id: number) => void
  onAdd: (p: DocSyncProvider) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="mt-3 flex flex-col gap-4">
      {links.length > 0 && (
        <section>
          <SectionLabel>{t('docsync.sidebar.connected')}</SectionLabel>
          <div className="flex flex-col gap-2">
            {links.map(l => (
              <StoreRow
                key={l.id}
                providerId={l.providerId}
                title={storeName(l, providers)}
                sub={l.remoteLabel || l.remoteRootPath || l.scopeKey}
                state={l.lastSyncState}
                onClick={() => onOpen(l.id)}
              />
            ))}
          </div>
        </section>
      )}

      {canManage && available.length > 0 && (
        <section>
          <SectionLabel>{links.length === 0 ? t('docsync.addProvider') : t('docsync.addAnother')}</SectionLabel>
          <div className="flex flex-col gap-2">
            {available.map(p => (
              <StoreRow
                key={p.id}
                providerId={p.id}
                title={p.name}
                sub={t(`docsync.model.${p.id}`)}
                addable
                onClick={() => onAdd(p)}
              />
            ))}
          </div>
        </section>
      )}

      {links.length === 0 && !canManage && (
        <Empty text={t('docsync.empty.title')} hint={t('docsync.empty.hintMember')} />
      )}
    </div>
  )
}

/** One binding: the flow, a run button, its settings. */
function DetailView({
  link,
  tripId,
  providerName,
  sync,
  canManage,
  onUnlink,
  onReconnect,
}: {
  link: DocSyncLink
  tripId: number | string
  providerName: string
  sync: ReturnType<typeof useDocSync>
  canManage: boolean
  onUnlink: () => void
  /**
   * Opens the credential form for this binding's store. Only the sheet can,
   * because the form needs the provider's field list, which the card does
   * not carry; left out, a refused credential is reported but not curable.
   */
  onReconnect?: () => void
}) {
  const { t, language } = useTranslation()
  const busy = sync.busy === `sync-${link.id}`
  // Not while the provider is switched off: the paused notice stands in front
  // of the refusal then, and a new credential would change nothing until an
  // admin turns the provider back on.
  const reconnect = canManage && onReconnect && !link.providerOff && needsReauth(link) ? onReconnect : null
  const holdings = link.holdings ?? { inTrek: 0, atProvider: 0, paired: 0, missing: 0 }
  const pushOn = link.direction === 'both' || link.direction === 'push'
  const pullOn = link.direction === 'both' || link.direction === 'pull'
  const ProviderIcon = DOCUMENT_PROVIDER_ICONS[link.providerId]

  /** The last remaining direction cannot be switched off. */
  const toggle = (lane: 'push' | 'pull') => {
    if (!canManage) return
    const nextPush = lane === 'push' ? !pushOn : pushOn
    const nextPull = lane === 'pull' ? !pullOn : pullOn
    if (!nextPush && !nextPull) return
    void sync.updateLink(link.id, { direction: nextPush && nextPull ? 'both' : nextPush ? 'push' : 'pull' })
  }

  const ranAt = link.lastSyncAt ? Date.parse(link.lastSyncAt) : NaN
  const notice = bindingNotice(link, t)

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* The two ends, side by side, with the lanes stacked under them: the
          desktop bar puts them left and right of each other, which needs width
          a phone does not have. */}
      <section className="rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop p-3">
        <div className="flex items-stretch gap-2">
          <EndBox glyph={<TrekIcon className="h-[18px] w-[18px]" />} count={holdings.inTrek} name={t('docsync.flow.trek')} />
          <EndBox
            glyph={ProviderIcon ? <ProviderIcon className="h-[18px] w-[18px]" /> : null}
            count={holdings.atProvider}
            name={providerName}
          />
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <LaneRow
            active={pushOn}
            label={t('docsync.flow.toProvider')}
            icon={<ArrowRight size={13} strokeWidth={2.6} />}
            disabled={!canManage}
            onClick={() => toggle('push')}
          />
          <LaneRow
            active={pullOn}
            label={t('docsync.flow.toTrek')}
            icon={<ArrowLeft size={13} strokeWidth={2.6} />}
            disabled={!canManage}
            onClick={() => toggle('pull')}
          />
        </div>
      </section>

      <Row label={t('docsync.binding.folder')} value={link.remoteLabel || link.remoteRootPath || link.scopeKey} />
      <Row
        label={t('docsync.binding.lastRun')}
        value={Number.isNaN(ranAt) ? t('docsync.binding.neverRun') : relativeTime(ranAt, language)}
      />

      {notice && (
        <p className="rounded-2xl bg-[color:var(--m-st-warn-bg,var(--m-ic))] px-3 py-2 font-geist text-[0.6875rem] text-[color:var(--m-st-warn,var(--m-muted))]">
          {notice}
        </p>
      )}

      {/* The one state a person can act on from here. Without this the only
          way past a rotated token was the API: the list opens the form for a
          store that has no connection yet, and this one has. */}
      {reconnect && (
        <button
          type="button"
          onClick={reconnect}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--m-rowbr)] text-[0.8125rem] font-bold text-m-ink"
        >
          <KeyRound size={15} strokeWidth={2.2} />
          {t('docsync.binding.reconnect')}
        </button>
      )}

      {/* Every action on this view reports here: a refused run, a switch that
          flipped back, a conflict the server would not settle. Nothing said
          what happened to a tap before. */}
      {sync.error && (
        <p role="alert" className="rounded-2xl bg-[color:var(--m-ic)] px-3 py-2 font-geist text-[0.6875rem] text-[color:var(--m-st-danger)]">
          {t(`docsync.error.${sync.error}`)}
        </p>
      )}

      <MConflicts tripId={tripId} sync={sync} count={sync.itemCounts.conflict ?? 0} canManage={canManage} />

      <button
        type="button"
        onClick={() => void sync.syncNow(link.id)}
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-m-act text-[0.8125rem] font-bold text-m-actfg disabled:opacity-60"
      >
        <RefreshCw size={15} strokeWidth={2.2} className={busy ? 'animate-spin' : ''} />
        {busy ? t('docsync.syncing') : t('docsync.syncNow')}
      </button>

      {canManage && (
        <>
          <SettingRow label={t('docsync.syncEnabled')} hint={t('docsync.binding.autoHint')}>
            <MToggle
              checked={link.syncEnabled}
              ariaLabel={t('docsync.syncEnabled')}
              onChange={() => void sync.updateLink(link.id, { syncEnabled: !link.syncEnabled })}
            />
          </SettingRow>

          <SettingRow label={t('docsync.deletePolicy')} hint={t('docsync.binding.deleteHint')}>
            <button
              type="button"
              onClick={() =>
                void sync.updateLink(link.id, { deletePolicy: link.deletePolicy === 'unlink' ? 'trash' : 'unlink' })
              }
              className="rounded-full bg-[color:var(--m-ic)] px-3 py-[6px] font-geist text-[0.6875rem] font-bold text-m-ink"
            >
              {link.deletePolicy === 'unlink' ? t('docsync.deleteUnlink') : t('docsync.deleteTrash')}
            </button>
          </SettingRow>

          <SettingRow label={t('docsync.conflictPolicy')} hint={t('docsync.binding.conflictHint')}>
            <button
              type="button"
              onClick={() =>
                void sync.updateLink(link.id, { conflictPolicy: nextConflictPolicy(link.conflictPolicy) })
              }
              className="rounded-full bg-[color:var(--m-ic)] px-3 py-[6px] font-geist text-[0.6875rem] font-bold text-m-ink"
            >
              {t(conflictPolicyKey(link.conflictPolicy))}
            </button>
          </SettingRow>

          <button
            type="button"
            onClick={onUnlink}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--m-rowbr)] text-[0.8125rem] font-bold text-[color:var(--m-st-danger)]"
          >
            <Link2Off size={15} strokeWidth={2.2} />
            {t('docsync.unlink')}
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Credentials for a store this instance offers but the trip has not used yet.
 *
 * The rules (which field is the address, which one is a switch, how a label
 * becomes a key) live in `useConnectForm`, the same one the desktop dialog
 * uses. Written out here a second time they came out wrong in four separate
 * ways, including an address this form never actually sent.
 */
function ConnectView({
  provider,
  sync,
  onDone,
}: {
  provider: DocSyncProvider
  sync: ReturnType<typeof useDocSync>
  onDone: () => void
}) {
  const { t } = useTranslation()
  const form = useConnectForm(provider, sync.connectionFor(provider.id), sync)
  const [verdict, setVerdict] = useState<{ connected: boolean; account?: string; error?: string } | null>(null)

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="font-geist text-[0.71875rem] leading-snug text-m-muted">{t(`docsync.connect.about.${provider.id}`)}</p>

      {form.fields.map(f => (
        <label key={f.field_key} className="flex flex-col gap-[6px]">
          <span className="font-geist text-[0.6875rem] font-bold text-m-muted">
            {t(form.labelKey(f))}
            {f.required && <span className="text-[color:var(--m-st-danger)]"> *</span>}
          </span>
          <input
            type={f.input_type === 'password' ? 'password' : 'text'}
            value={form.valueOf(f.field_key)}
            onChange={e => { form.setValue(f.field_key, e.target.value); setVerdict(null) }}
            placeholder={form.placeholderOf(f)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 rounded-2xl border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-3 text-[0.8125rem] text-m-ink outline-none"
          />
          {form.hintKey(f) && (
            <span className="font-geist text-[0.625rem] text-m-faint">{t(form.hintKey(f) as string)}</span>
          )}
        </label>
      ))}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[9px]">
        <span className="min-w-0 flex-1">
          <span className="block text-[0.78125rem] font-semibold text-m-ink">{t('docsync.allowInsecureTls')}</span>
          <span className="mt-[2px] block font-geist text-[0.625rem] leading-snug text-m-faint">
            {t('docsync.connect.insecureHint')}
          </span>
        </span>
        <MToggle
          checked={form.insecureTls}
          ariaLabel={t('docsync.allowInsecureTls')}
          onChange={form.setInsecureTls}
        />
      </div>

      {verdict && (
        <p
          className={`rounded-2xl px-3 py-2 font-geist text-[0.6875rem] ${
            verdict.connected ? 'text-[color:var(--m-st-ok,var(--m-ink))]' : 'text-[color:var(--m-st-danger)]'
          } bg-[color:var(--m-ic)]`}
        >
          {verdict.connected
            ? verdict.account
              ? t('docsync.connect.okAs', { account: verdict.account })
              : t('docsync.connected')
            : t(`docsync.error.${verdict.error ?? 'unknown'}`)}
        </p>
      )}

      {sync.error && !verdict && (
        <p className="rounded-2xl bg-[color:var(--m-ic)] px-3 py-2 font-geist text-[0.6875rem] text-[color:var(--m-st-danger)]">
          {t(`docsync.error.${sync.error}`)}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void form.probe().then(setVerdict)}
          disabled={!form.complete || sync.busy === 'test'}
          className="h-11 flex-1 rounded-2xl border border-[color:var(--m-rowbr)] text-[0.8125rem] font-bold text-m-ink disabled:opacity-50"
        >
          {sync.busy === 'test' ? <Loader2 size={15} className="mx-auto animate-spin" /> : t('docsync.test')}
        </button>
        <button
          type="button"
          onClick={() => void form.save().then(ok => { if (ok) onDone() })}
          disabled={!form.complete || sync.busy === 'save'}
          className="h-11 flex-1 rounded-2xl bg-m-act text-[0.8125rem] font-bold text-m-actfg disabled:opacity-50"
        >
          {sync.busy === 'save' ? <Loader2 size={15} className="mx-auto animate-spin" /> : t('common.save')}
        </button>
      </div>
    </div>
  )
}

/** Which folder, tag or space this trip gets. */
function ScopeView({
  connectionId,
  suggestedName,
  sync,
  onBound,
}: {
  connectionId: number
  suggestedName: string
  sync: ReturnType<typeof useDocSync>
  onBound: () => void
}) {
  const { t } = useTranslation()
  const [scopes, setScopes] = useState<Awaited<ReturnType<typeof sync.loadScopes>>['scopes'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(suggestedName)
  const [working, setWorking] = useState<string | null>(null)

  // `loadScopes`, not `sync`: the hook hands back a fresh object on every
  // render of the panel above, so depending on it re-listed the provider's
  // folders each time anything up there changed. The callback itself is
  // stable. Taken out of `sync` first, because calling it as `sync.loadScopes`
  // inside the effect makes the whole object a dependency again.
  const { loadScopes } = sync
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await loadScopes(connectionId)
      if (cancelled) return
      setScopes(res.scopes)
      setError(res.error ?? null)
    })()
    return () => { cancelled = true }
  }, [connectionId, loadScopes])

  const bind = async (scope: { scopeKey: string; label: string; remoteRootId: string | null; remoteRootPath: string | null }) => {
    setWorking(scope.scopeKey)
    const ok = await sync.createLink({
      connectionId,
      scopeKey: scope.scopeKey,
      remoteRootId: scope.remoteRootId,
      remoteRootPath: scope.remoteRootPath,
      remoteLabel: scope.label,
      direction: 'both',
      deletePolicy: 'unlink',
      conflictPolicy: 'manual',
      syncEnabled: true,
    })
    setWorking(null)
    if (ok) onBound()
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="font-geist text-[0.71875rem] leading-snug text-m-muted">{t('docsync.scope.intro')}</p>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('docsync.newFolderPlaceholder')}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-3 text-[0.8125rem] text-m-ink outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = name.trim()
            if (!trimmed) return
            setWorking('__new__')
            void sync.createScope(connectionId, trimmed)
              .then(scope => { if (scope) return bind(scope) })
              .finally(() => setWorking(null))
          }}
          disabled={!name.trim() || working !== null}
          className="flex h-11 flex-none items-center gap-2 rounded-2xl bg-m-act px-4 text-[0.8125rem] font-bold text-m-actfg disabled:opacity-50"
        >
          {working === '__new__' ? <Loader2 size={15} className="animate-spin" /> : <FolderPlus size={15} strokeWidth={2.2} />}
          {t('docsync.scope.createAction')}
        </button>
      </div>

      {sync.error && (
        <p className="rounded-2xl bg-[color:var(--m-ic)] px-3 py-2 font-geist text-[0.6875rem] text-[color:var(--m-st-danger)]">
          {t(`docsync.error.${sync.error}`)}
        </p>
      )}

      <SectionLabel>{t('docsync.scope.pickTitle')}</SectionLabel>

      {scopes === null ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-m-faint" /></div>
      ) : error ? (
        <p className="rounded-2xl bg-[color:var(--m-ic)] px-3 py-2 font-geist text-[0.6875rem] text-[color:var(--m-st-danger)]">
          {t(`docsync.error.${error}`)}
        </p>
      ) : scopes.length === 0 ? (
        <Empty text={t('docsync.noFolders')} />
      ) : (
        <div className="flex flex-col gap-2">
          {scopes.map(s => (
            <button
              key={s.scopeKey}
              type="button"
              onClick={() => void bind(s)}
              disabled={working !== null}
              className="flex items-center gap-[10px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[9px] text-left disabled:opacity-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.78125rem] font-semibold text-m-ink">{s.label}</span>
                {s.remoteRootPath && (
                  <span className="mt-[2px] block truncate font-geist text-[0.625rem] text-m-faint">{s.remoteRootPath}</span>
                )}
              </span>
              {working === s.scopeKey
                ? <Loader2 size={14} className="flex-none animate-spin text-m-faint" />
                : <ChevronRight size={15} strokeWidth={2} className="flex-none text-m-faint" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** One store in the list, connected or not. */
function StoreRow({
  providerId,
  title,
  sub,
  state,
  addable,
  onClick,
}: {
  providerId: string
  title: string
  sub: string
  state?: string
  addable?: boolean
  onClick: () => void
}) {
  const Icon = DOCUMENT_PROVIDER_ICONS[providerId]
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[10px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[9px] text-left"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-[color:var(--m-ic)] text-m-ink">
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.78125rem] font-semibold text-m-ink">{title}</span>
        <span className="mt-[2px] block truncate font-geist text-[0.625rem] text-m-faint">{sub}</span>
      </span>
      {addable ? (
        <Plus size={15} strokeWidth={2} className="flex-none text-m-faint" />
      ) : (
        <span className="flex flex-none items-center gap-2">
          {state && <StateDot state={state} />}
          <ChevronRight size={15} strokeWidth={2} className="text-m-faint" />
        </span>
      )}
    </button>
  )
}

/** One side of the flow: how much it is holding. */
function EndBox({ glyph, count, name }: { glyph: React.ReactNode; count: number; name: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl bg-[color:var(--m-inner)] px-2 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color:var(--m-ic)] text-m-ink">
        {glyph}
      </span>
      <span className="text-[1.25rem] font-bold leading-none tabular-nums text-m-ink">{count}</span>
      <span className="font-geist text-[0.5625rem] uppercase leading-none tracking-wide text-m-faint">
        {t('docsync.flow.documents')}
      </span>
      <span className="w-full truncate text-center font-geist text-[0.625rem] text-m-muted" title={name}>{name}</span>
    </div>
  )
}

/**
 * One direction, on or off.
 *
 * The off state is the desktop's hatch, scaled for a phone: the same reading of
 * "nothing goes through here" without a second vocabulary to learn.
 */
function LaneRow({
  active,
  label,
  icon,
  disabled,
  onClick,
}: {
  active: boolean
  label: string
  icon: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex h-11 items-center gap-[10px] overflow-hidden rounded-2xl px-3 text-left ${
        active ? 'bg-m-act text-m-actfg' : 'trek-docsync-lane-off-m bg-[color:var(--m-inner)] text-m-faint'
      }`}
    >
      {/* Inverted on the active lane: --m-knob and --m-act are both white in
          dark mode, so a knob-coloured tile there hid the arrow inside it. */}
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-[9px] ${
          active ? 'bg-[color:var(--m-actfg)] text-m-act' : 'bg-[color:var(--m-ic)] text-m-faint'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold">{label}</span>
      {active && <Check size={15} strokeWidth={2.4} className="flex-none" />}
    </button>
  )
}

function StateDot({ state }: { state: string }) {
  const { t } = useTranslation()
  const tone =
    state === 'ok' ? 'var(--m-st-ok, #22c55e)'
    : state === 'partial' ? 'var(--m-st-warn, #f59e0b)'
    : state === 'never' ? 'var(--m-trackoff)'
    : 'var(--m-st-danger)'
  return (
    <span
      className="h-2 w-2 rounded-full"
      style={{ background: tone }}
      title={t(`docsync.linkState.${state}`)}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 font-geist text-[0.625rem] font-bold uppercase tracking-wide text-m-faint">{children}</div>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[9px]">
      <span className="font-geist text-[0.6875rem] text-m-muted">{label}</span>
      <span className="min-w-0 truncate text-[0.78125rem] font-semibold text-m-ink" title={value}>{value}</span>
    </div>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[9px]">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.78125rem] font-semibold text-m-ink">{label}</span>
        {hint && <span className="mt-[2px] block font-geist text-[0.625rem] text-m-faint">{hint}</span>}
      </span>
      <span className="flex-none">{children}</span>
    </div>
  )
}

function Empty({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="font-geist text-[0.78125rem] text-m-muted">{text}</div>
      {hint && <div className="mx-auto mt-1 max-w-[16rem] font-geist text-[0.625rem] leading-snug text-m-faint">{hint}</div>}
    </div>
  )
}

/** A folder name from the trip's own title, so nobody has to invent one. */
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

/**
 * The documents that changed in both places, with the way out.
 *
 * The same three answers the panel offers, through the same hook. Only the
 * markup is a phone's.
 */
function MConflicts({
  tripId,
  sync,
  count,
  canManage,
}: {
  tripId: number | string
  sync: ReturnType<typeof useDocSync>
  count: number
  canManage: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const conflicts = useConflicts(tripId, sync, canManage && open)
  if (count === 0) return null

  const heading = (
    <span className="min-w-0">
      <span className="block font-geist text-[0.75rem] font-bold text-m-ink">{t('docsync.conflict.title')}</span>
      <span className="mt-0.5 block font-geist text-[0.6875rem] text-m-muted">{t('docsync.issues.conflict')}</span>
    </span>
  )

  return (
    <section className="rounded-2xl bg-[color:var(--m-ic)] px-3 py-2.5">
      {/* Only the owner gets to open it: the server refuses a member's choice,
          so a member gets the count, as the desktop panel gives it. */}
      {canManage ? (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          {heading}
          <span className="shrink-0 font-geist text-[0.6875rem] font-bold text-m-ink">
            {open ? t('common.close') : t('docsync.conflict.resolve', { count })}
          </span>
        </button>
      ) : (
        <div className="flex w-full items-center justify-between gap-3 text-left">
          {heading}
          <span className="shrink-0 font-geist text-[0.6875rem] font-bold tabular-nums text-m-ink">{count}</span>
        </div>
      )}

      {canManage && open && (
        <ul className="mt-2.5 space-y-2">
          {conflicts.items === null && (
            <li className="flex justify-center py-2">
              <Loader2 size={14} className="animate-spin text-m-muted" />
            </li>
          )}
          {conflicts.items?.map(item => (
            <li key={item.id} className="rounded-2xl bg-m-card px-3 py-2.5">
              <p className="truncate font-geist text-[0.75rem] text-m-ink">{item.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['trek', 'provider', 'both'] as const).map(keep => (
                  <button
                    key={keep}
                    type="button"
                    disabled={conflicts.working === item.id}
                    onClick={() => void conflicts.resolve(item.id, keep)}
                    className="rounded-full bg-[color:var(--m-ic)] px-3 py-[6px] font-geist text-[0.6875rem] font-bold text-m-ink disabled:opacity-60"
                  >
                    {t(`docsync.conflict.${keep === 'trek' ? 'keepTrek' : keep === 'provider' ? 'keepProvider' : 'keepBoth'}`)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
