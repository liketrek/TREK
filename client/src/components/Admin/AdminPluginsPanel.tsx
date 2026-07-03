import { useEffect, useState } from 'react'
import {
  Blocks, AlertTriangle, PackageOpen, RefreshCw, Trash2, Download, Bug, X, ShieldCheck,
  ArrowUpCircle, Github, ExternalLink, ChevronRight, Check, Luggage, Plane, Globe, Image,
  CalendarDays, Map, Bell, Cloud, Camera, Compass, BookOpen, Wallet, Puzzle,
} from 'lucide-react'
import { adminApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import ConfirmDialog from '../shared/ConfirmDialog'
import ToggleSwitch from '../Settings/ToggleSwitch'

/**
 * Admin → Plugins (#plugins). Separates the admin's ON/OFF intent (the toggle,
 * backed by `enabled`) from runtime health (`status`, the coloured dot on the
 * icon tile), surfaces per-plugin errors and available updates, and hosts the
 * registry browser with a per-plugin detail dialog (screenshot, permissions,
 * setup preview — fetched live at the reviewed commit). Gated by the
 * runtime-enabled flag.
 */

interface PluginRow {
  id: string
  name: string
  description: string | null
  type: string
  icon: string | null
  version: string | null
  status: string
  enabled: number
  last_error: string | null
  reviewed_at: string | null
  source_repo: string | null
}
interface RegistryItem {
  id: string
  name: string
  author: string
  description: string
  repo: string
  homepage?: string | null
  type: string
  latest: string | null
  minTrekVersion: string | null
  reviewedAt: string | null
  screenshotUrl: string | null
}
interface RegistryDetail extends RegistryItem {
  size: number | null
  publishedAt: string | null
  manifest: {
    permissions: string[]
    egress: string[]
    settings: Array<{ key: string; label: string; inputType: string; scope: string; required: boolean }>
    license: string | null
    icon: string | null
  } | null
}

type T = (k: string, p?: Record<string, unknown>) => string

// Runtime health → dot colour on the icon tile. `enabled` is shown by the toggle.
const HEALTH: Record<string, string> = {
  active: 'bg-emerald-500',
  starting: 'bg-sky-500 animate-pulse',
  error: 'bg-rose-500',
  inactive: 'bg-content-faint/50',
  disabled: 'bg-amber-500',
  incompatible: 'bg-orange-500',
}
// States worth calling out with a text badge (ok states speak through the dot).
const STATUS_BADGE: Record<string, string> = {
  starting: 'bg-sky-500/10 text-sky-600',
  error: 'bg-rose-500/10 text-rose-600',
  disabled: 'bg-amber-500/10 text-amber-600',
  incompatible: 'bg-orange-500/10 text-orange-600',
}

// Manifest `icon` is a lucide name; map the common ones, fall back to Blocks.
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Luggage, Plane, Globe, Image, CalendarDays, Map, Bell, Cloud, Camera, Compass, BookOpen, Wallet, Puzzle, Blocks,
}

// Known permissions → human-readable i18n key; unknown ones render as raw code.
const PERM_KEYS = [
  'db:own', 'db:read:trips', 'db:read:users', 'ws:broadcast:trip', 'ws:broadcast:user',
  'hook:photo-provider', 'hook:calendar-source', 'http:outbound',
]

function isNewer(a: string, b: string): boolean {
  const nums = (v: string) => v.split('-')[0].split('.').map(n => parseInt(n, 10) || 0)
  const pa = nums(a)
  const pb = nums(b)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x !== y) return x > y
  }
  // Same numeric triple: the stable release is newer than its prerelease.
  return !a.includes('-') && b.includes('-')
}

function PluginIcon({ name, size = 18, className }: { name: string | null; size?: number; className?: string }) {
  // hasOwnProperty guard: the icon name is remote manifest data, and a plain
  // object lookup would otherwise reach Object.prototype ("constructor", …).
  const Icon = (name && Object.prototype.hasOwnProperty.call(ICON_MAP, name) && ICON_MAP[name]) || Blocks
  return <Icon size={size} className={className} />
}

const KNOWN_TYPES = ['widget', 'page', 'integration']

function TypeBadge({ type, t }: { type: string; t: T }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent">
      {KNOWN_TYPES.includes(type) ? t(`admin.plugins.type.${type}` as never) : type}
    </span>
  )
}

function ReviewedBadge({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
      <ShieldCheck size={11} /> {t('admin.plugins.reviewed')}
    </span>
  )
}

export default function AdminPluginsPanel() {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const [runtimeOn, setRuntimeOn] = useState(false)
  const [plugins, setPlugins] = useState<PluginRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [view, setView] = useState<'installed' | 'browse'>('installed')
  const [registry, setRegistry] = useState<RegistryItem[] | null>(null)
  const [latest, setLatest] = useState<Record<string, string>>({})
  const [detailFor, setDetailFor] = useState<RegistryItem | null>(null)
  const [errorsFor, setErrorsFor] = useState<{ id: string; rows: Array<{ ts: string; level: string; message: string }> } | null>(null)
  const [confirmUninstall, setConfirmUninstall] = useState<PluginRow | null>(null)

  const refresh = () => {
    adminApi.plugins()
      .then((d: { enabled: boolean; plugins: PluginRow[] }) => {
        setRuntimeOn(!!d.enabled)
        setPlugins(d.plugins || [])
        // Learn the latest registry versions in the background for update badges.
        if ((d.plugins || []).length) {
          adminApi.pluginBrowse()
            .then((items: RegistryItem[]) => {
              const map: Record<string, string> = {}
              items.forEach((i) => { if (i.latest) map[i.id] = i.latest })
              setLatest(map)
            })
            .catch(() => {})
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }
  useEffect(refresh, [])

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id)
    try { await fn(); toast.success(ok) }
    catch (e) { toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError')) }
    // Refresh even on failure: a multi-step action may have partially committed.
    finally { setBusy(null); refresh() }
  }

  const openBrowse = () => {
    setView('browse')
    if (!registry) adminApi.pluginBrowse().then(setRegistry).catch(() => setRegistry([]))
  }
  const openErrors = (id: string) =>
    adminApi.pluginErrors(id)
      .then((d: { errors: Array<{ ts: string; level: string; message: string }> }) => setErrorsFor({ id, rows: d.errors }))
      .catch(() => setErrorsFor({ id, rows: [] }))

  const updateAvailable = (p: PluginRow) => !!(p.version && latest[p.id] && isNewer(latest[p.id], p.version))
  const install = (id: string) => act(id, () => adminApi.pluginInstall(id), t('admin.plugins.installed'))
  const installedIds = new Set(plugins.map(p => p.id))

  return (
    <div className="bg-surface-card border border-edge rounded-xl overflow-hidden">
      {/* Header — flush-left title/subtitle, like the Addons panel */}
      <div className="px-6 py-4 border-b border-edge-secondary flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-content">{t('admin.plugins.title')}</h2>
          <p className="text-xs mt-1 text-content-muted">{t('admin.plugins.subtitle')}</p>
        </div>
        {runtimeOn && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => act('__rescan', adminApi.pluginRescan, t('admin.plugins.rescanned'))}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-edge text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors">
              <RefreshCw size={14} /> <span className="hidden sm:inline">{t('admin.plugins.rescan')}</span>
            </button>
            <button onClick={view === 'browse' ? () => setView('installed') : openBrowse}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-accent text-accent-text hover:opacity-90 transition-opacity">
              {view === 'browse' ? t('admin.plugins.installed') : <><Download size={14} /> {t('admin.plugins.browse')}</>}
            </button>
          </div>
        )}
      </div>

      {/* Runtime-disabled notice */}
      {!runtimeOn && !loading && !error && (
        <div className="mx-6 mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">{t('admin.plugins.disabledTitle')}</p>
            <p className="text-xs text-amber-700/90 mt-0.5">{t('admin.plugins.disabledBody')}</p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-content-faint">{t('common.loading')}</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-rose-600">{t('admin.plugins.loadError')}</div>
        ) : view === 'browse' ? (
          <>
            <div className="mb-4 p-4 rounded-xl border-2 border-amber-500/60 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle size={22} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-700">{t('admin.plugins.riskTitle')}</p>
                <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">{t('admin.plugins.riskBody')}</p>
              </div>
            </div>
            <RegistryGrid items={registry} busy={busy} t={t} installedIds={installedIds}
              onInstall={install} onOpenDetail={setDetailFor} />
          </>
        ) : plugins.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-tertiary grid place-items-center mx-auto mb-4">
              <PackageOpen size={26} className="text-content-faint" />
            </div>
            <p className="text-sm font-medium text-content-muted">{t('admin.plugins.empty')}</p>
            {runtimeOn && (
              <button onClick={openBrowse} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-accent-text">
                <Download size={14} /> {t('admin.plugins.browse')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {plugins.map(p => {
              const hasUpdate = updateAvailable(p)
              const statusBadge = STATUS_BADGE[p.status]
              return (
                <div key={p.id} className="rounded-xl border border-edge bg-surface-secondary/40 p-3.5 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-xl grid place-items-center bg-surface-card border border-edge">
                      <PluginIcon name={p.icon} className="text-content-muted" />
                    </div>
                    <span
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-surface-card ${HEALTH[p.status] || HEALTH.inactive}`}
                      title={t(`admin.plugins.status.${p.status}` as never)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-content truncate">{p.name}</span>
                      {p.version && <span className="text-[11px] text-content-faint font-medium">v{p.version}</span>}
                      <TypeBadge type={p.type} t={t} />
                      {p.reviewed_at && <ReviewedBadge t={t} />}
                      {statusBadge && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge}`}>
                          {t(`admin.plugins.status.${p.status}` as never)}
                        </span>
                      )}
                      {hasUpdate && (
                        <button onClick={() => act(p.id, async () => {
                          // Restart around the install so the running child actually picks up
                          // the new code, and keep the admin's ON/OFF intent as it was.
                          const wasEnabled = p.enabled === 1
                          if (wasEnabled) await adminApi.pluginDeactivate(p.id)
                          await adminApi.pluginInstall(p.id)
                          if (wasEnabled) await adminApi.pluginActivate(p.id)
                        }, t('admin.plugins.updated'))}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 transition-colors">
                          <ArrowUpCircle size={11} /> {t('admin.plugins.updateTo', { version: latest[p.id] })}
                        </button>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-content-faint mt-0.5 line-clamp-2">{p.description}</p>
                    )}
                    {p.source_repo && (
                      <a href={`https://github.com/${p.source_repo}`} target="_blank" rel="noreferrer"
                        title={t('admin.plugins.sourceRepo')}
                        className="flex items-center gap-1 max-w-fit min-w-0 text-[11px] text-content-faint hover:text-content transition-colors mt-1">
                        <Github size={11} className="shrink-0" /> <span className="truncate">{p.source_repo}</span>
                      </a>
                    )}
                    {p.status === 'error' && p.last_error && (
                      <p className="text-[11px] text-rose-500/90 mt-1 truncate">{p.last_error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn title={t('admin.plugins.viewErrors')} onClick={() => openErrors(p.id)}><Bug size={15} /></IconBtn>
                    <IconBtn title={t('common.delete')} danger onClick={() => setConfirmUninstall(p)}><Trash2 size={15} /></IconBtn>
                    <div className="pl-2 ml-1 border-l border-edge">
                      <ToggleSwitch
                        on={p.enabled === 1}
                        label={t('admin.plugins.enabledToggle')}
                        onToggle={() => busy !== p.id && act(
                          p.id,
                          () => p.enabled === 1 ? adminApi.pluginDeactivate(p.id) : adminApi.pluginActivate(p.id),
                          p.enabled === 1 ? t('admin.plugins.deactivated') : t('admin.plugins.activated'),
                        )}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-3.5 border-t border-edge-secondary bg-surface-secondary flex items-center gap-2">
        <ShieldCheck size={14} className="text-content-faint shrink-0" />
        <p className="text-xs text-content-faint">{t('admin.plugins.trustNote')}</p>
      </div>

      {/* Registry detail dialog */}
      {detailFor && (
        <PluginDetailModal item={detailFor} t={t} locale={locale} busy={busy}
          installed={installedIds.has(detailFor.id)}
          onInstall={install}
          onClose={() => setDetailFor(null)} />
      )}

      {/* Error-log modal */}
      {errorsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setErrorsFor(null)}>
          <div className="bg-surface-card border border-edge rounded-xl w-full max-w-2xl max-h-[70vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-edge-secondary flex items-center justify-between">
              <span className="text-sm font-semibold text-content flex items-center gap-2"><Bug size={15} /> {errorsFor.id} — {t('admin.plugins.errorLog')}</span>
              <button onClick={() => setErrorsFor(null)} className="text-content-faint hover:text-content"><X size={16} /></button>
            </div>
            <div className="p-4 overflow-y-auto text-xs font-mono">
              {errorsFor.rows.length === 0 ? <p className="text-content-faint py-4 text-center">{t('admin.plugins.noErrors')}</p> :
                errorsFor.rows.map((r, i) => (
                  <div key={i} className="py-1.5 border-b border-edge-secondary/50 last:border-0 flex gap-2">
                    <span className={`shrink-0 font-semibold ${r.level === 'error' ? 'text-rose-500' : 'text-amber-500'}`}>{r.level}</span>
                    <span className="text-content-faint shrink-0">{r.ts}</span>
                    <span className="text-content-muted break-all">{r.message}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmUninstall}
        onClose={() => setConfirmUninstall(null)}
        onConfirm={async () => {
          const p = confirmUninstall!; setConfirmUninstall(null)
          await act(p.id, () => adminApi.pluginUninstall(p.id, true), t('admin.plugins.uninstalled'))
        }}
        title={t('admin.plugins.uninstallTitle')}
        message={t('admin.plugins.uninstallBody')}
      />
    </div>
  )
}

function IconBtn({ children, title, onClick, disabled, danger }: {
  children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      className={`w-8 h-8 grid place-items-center rounded-lg transition-colors disabled:opacity-40 ${
        danger ? 'text-content-faint hover:text-rose-500 hover:bg-rose-500/10' : 'text-content-faint hover:text-content hover:bg-surface-tertiary'}`}>
      {children}
    </button>
  )
}

function Screenshot({ url, className, iconSize = 28 }: { url: string | null; className: string; iconSize?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`bg-surface-tertiary overflow-hidden ${className}`}>
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="w-full h-full grid place-items-center">
          <Blocks size={iconSize} className="text-content-faint/50" />
        </div>
      )}
    </div>
  )
}

function RegistryGrid({ items, onInstall, onOpenDetail, busy, t, installedIds }: {
  items: RegistryItem[] | null
  onInstall: (id: string) => void
  onOpenDetail: (item: RegistryItem) => void
  busy: string | null
  t: T
  installedIds: Set<string>
}) {
  if (!items) return <div className="py-10 text-center text-sm text-content-faint">{t('common.loading')}</div>
  if (items.length === 0) return <div className="py-10 text-center text-sm text-content-faint">{t('admin.plugins.registryEmpty')}</div>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(item => {
        const installed = installedIds.has(item.id)
        return (
          <div key={item.id} role="button" tabIndex={0} onClick={() => onOpenDetail(item)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(item) } }}
            className="border border-edge rounded-xl bg-surface-secondary/40 overflow-hidden flex flex-col cursor-pointer hover:border-accent/50 transition-colors">
            <Screenshot url={item.screenshotUrl} className="aspect-video" iconSize={22} />
            <div className="p-3 flex flex-col flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-semibold text-content truncate">{item.name}</span>
                {item.latest && <span className="text-[10px] text-content-faint">v{item.latest}</span>}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <TypeBadge type={item.type} t={t} />
                {item.reviewedAt && <ReviewedBadge t={t} />}
              </div>
              <span className="text-[11px] text-content-faint mt-1">{item.author}</span>
              <p className="text-xs text-content-faint mt-1.5 line-clamp-2 flex-1">{item.description}</p>
              <div className="flex items-center justify-between gap-2 mt-2.5">
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent">
                  {t('admin.plugins.details')} <ChevronRight size={12} />
                </span>
                <button onClick={e => { e.stopPropagation(); onInstall(item.id) }} disabled={busy === item.id || installed}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-accent text-accent-text disabled:opacity-50 disabled:bg-surface-tertiary disabled:text-content-faint">
                  {installed ? t('admin.plugins.installed') : t('admin.plugins.install')}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PluginDetailModal({ item, installed, busy, onInstall, onClose, t, locale }: {
  item: RegistryItem
  installed: boolean
  busy: string | null
  onInstall: (id: string) => void
  onClose: () => void
  t: T
  locale: string
}) {
  const [detail, setDetail] = useState<RegistryDetail | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    adminApi.pluginDetail(item.id)
      .then((d: RegistryDetail) => { if (alive) setDetail(d) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [item.id])

  const manifest = detail?.manifest ?? null
  const repoUrl = `https://github.com/${item.repo}`
  // Registry data is curated but still remote: only ever link plain http(s) URLs.
  const homepage = item.homepage && /^https?:\/\//i.test(item.homepage) && item.homepage !== repoUrl ? item.homepage : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-card border border-edge rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative shrink-0">
          <Screenshot url={item.screenshotUrl} className="aspect-video max-h-64 w-full" iconSize={36} />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-content">{item.name}</h3>
            {item.latest && <span className="text-[11px] text-content-faint font-medium">v{item.latest}</span>}
            <TypeBadge type={item.type} t={t} />
            {item.reviewedAt && <ReviewedBadge t={t} />}
          </div>
          <p className="text-xs text-content-faint mt-0.5">{item.author}</p>

          <p className="text-sm text-content-muted mt-3">{item.description}</p>

          {failed && <p className="text-xs text-rose-500 mt-3">{t('admin.plugins.detailError')}</p>}

          {/* Permissions */}
          {manifest && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.permissionsTitle')}</h4>
              {manifest.permissions.length === 0 ? (
                <p className="text-xs text-content-faint mt-2">{t('admin.plugins.noPermissions')}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {manifest.permissions.map(perm => (
                    <li key={perm} className="flex items-start gap-2 text-xs text-content-muted">
                      <Check size={13} className="text-accent mt-0.5 shrink-0" />
                      {PERM_KEYS.includes(perm)
                        ? <span>{t(`admin.plugins.perm.${perm}` as never)}</span>
                        : <code className="font-mono text-[11px] bg-surface-tertiary px-1.5 py-0.5 rounded">{perm}</code>}
                    </li>
                  ))}
                </ul>
              )}
              {manifest.egress.length > 0 && (
                <p className="text-[11px] text-content-faint mt-2">
                  {t('admin.plugins.egressNote', { hosts: manifest.egress.join(', ') })}
                </p>
              )}
            </div>
          )}

          {/* Setup preview */}
          {manifest && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.setupTitle')}</h4>
              {manifest.settings.length === 0 ? (
                <p className="text-xs text-content-faint mt-2">{t('admin.plugins.noSetup')}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {manifest.settings.map(s => (
                    <li key={s.key} className="flex items-center gap-2 text-xs text-content-muted flex-wrap">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-content-faint">
                        {t(`admin.plugins.scope.${s.scope}` as never)}
                      </span>
                      {s.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                          {t('admin.plugins.fieldRequired')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Links */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <a href={repoUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-edge text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors">
              <Github size={13} /> {t('admin.plugins.sourceRepo')}
            </a>
            {homepage && (
              <a href={homepage} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-edge text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors">
                <ExternalLink size={13} /> {t('admin.plugins.homepage')}
              </a>
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-edge-secondary bg-surface-secondary flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-content-faint flex items-center gap-3 flex-wrap">
            {item.minTrekVersion && <span>{t('admin.plugins.requiresTrek', { version: item.minTrekVersion })}</span>}
            {item.reviewedAt && <span>{t('admin.plugins.reviewedOn', { date: new Date(item.reviewedAt).toLocaleDateString(locale) })}</span>}
          </div>
          <button onClick={() => onInstall(item.id)} disabled={busy === item.id || installed}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-accent-text disabled:opacity-50 disabled:bg-surface-tertiary disabled:text-content-faint shrink-0">
            {installed ? t('admin.plugins.installed') : t('admin.plugins.install')}
          </button>
        </div>
      </div>
    </div>
  )
}
