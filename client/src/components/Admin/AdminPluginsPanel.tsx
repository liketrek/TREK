import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react'
import { PLUGIN_PERMISSIONS } from '@trek/shared'
import { createPortal } from 'react-dom'
import {
  Blocks, AlertTriangle, RefreshCw, Trash2, Download, Bug, ShieldCheck, UploadCloud,
  ArrowUpCircle, Github, ExternalLink, ChevronDown, Check, Lock, Search, Link2, KeyRound, ShieldAlert,
  SlidersHorizontal, ArrowUpDown, CircleDot, MoreHorizontal, RotateCw, Database,
  Globe, Info, History, PauseCircle, Puzzle, Bot, Loader2,
} from 'lucide-react'
import PluginIcon from '../shared/PluginIcon'
import { adminApi } from '../../api/client'
import { useInstanceSettings } from './useInstanceSettings'
import { bypassChip, bypassOffer, useRangeBypass, type RangeWarning, type TrekRangeBypass } from './useRangeBypass'
import { deriveCaps } from './pluginCaps'
import PluginPoiCategoryList from './PluginPoiCategoryList'
import { usePluginStore } from '../../store/pluginStore'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import ConfirmDialog from '../shared/ConfirmDialog'
import ToggleSwitch from '../Settings/ToggleSwitch'
import CustomSelect from '../shared/CustomSelect'
import EmptyState from '../shared/EmptyState'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, INPUT } from '../shared/dialogParts'
import {
  SettingsCard, SettingRows, SettingRow, SettingsHint, StatusPill,
  SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON,
} from '../Settings/settingsKit'
import { POPOVER } from '../Packing/packingPopoverStyles'

/**
 * Admin → Plugins (#plugins). A full plugin-management surface: a segmented
 * Installed/Discover switch, a toolbar (search + type/status filters + sort), an
 * updates bar, tidy installed rows that surface each plugin's real reach as
 * capability chips, an App-Store-style registry grid, an enriched detail dialog,
 * and the update re-consent gate. Isolation health shows as a dot on the icon
 * tile; the security section at the bottom explains the model honestly.
 */

interface PluginDep { id: string; version: string }
interface VersionMismatch { id: string; wanted: string; installed: string }
type DependencyStatus = 'ok' | 'addonDisabled' | 'missingPlugin' | 'hostIncompatible'
interface PluginDependencies { requiredAddons: string[]; pluginDependencies: PluginDep[] }
interface DependencyIssues { disabledAddons: string[]; missing: PluginDep[]; versionMismatch: VersionMismatch[] }

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
  permissions: string
  capabilities: string
  /** The plugin needs OPERATOR-supplied egress hosts (a self-hosted target). */
  operatorEgress?: boolean
  /** How many hosts the admin has added — 0 means the plugin can't reach anything yet. */
  egressHostCount?: number
  /** How many `scope:'instance'` settings fields the plugin declares — gates the
   * "Instance settings" menu item without a per-plugin fetch. */
  instanceSettingsCount?: number
  /** How many `scope:'instance'` actions the plugin declares — a plugin with actions
   * but no settings fields still needs the menu item to run them. */
  instanceActionsCount?: number
  dependencies?: PluginDependencies
  dependencyStatus?: DependencyStatus
  dependencyIssues?: DependencyIssues
  /** The TREK versions the plugin says it supports; null if it never declared any. */
  trekRange?: string | null
  /** The TREK this server is running — the server does the semver, the client just shows it. */
  hostVersion?: string
  /** Non-null while the plugin runs outside its declared range on the operator's say-so. */
  trekRangeBypassed?: TrekRangeBypass | null
  /** The author's signature was verified and their key pinned at install. False means the
   * bytes matched the registry's sha256 and nothing more — one fewer guarantee. */
  signed?: boolean
  /** Short form of the pinned key, for eyeballing against what the author reads out. */
  keyFingerprint?: string | null
  /** Why an update was refused, if one was. `version` is the version that was refused. */
  updateBlock?: { code: string; detail: string | null; version: string | null } | null
  /** A deliberate non-latest install paused updates: out of the banner/Update all until resumed. */
  updateHold?: boolean
}
interface RegistryItem {
  id: string
  name: string
  author: string
  description: string
  repo: string
  homepage?: string | null
  type: string
  /** Lucide icon name from the registry entry; absent → Blocks. */
  icon?: string | null
  latest: string | null
  minTrekVersion: string | null
  /** The latest version's declared TREK range; null on a legacy registry entry. */
  trek?: string | null
  hostVersion?: string
  /** Whether the LATEST version can be installed on this TREK. Computed server-side. */
  compatible?: boolean
  /** Newest installable version — the latest, an older fallback, or null if none fits. */
  latestCompatible?: string | null
  reviewedAt: string | null
  downloadCount?: number | null
  screenshotUrl: string | null
  requiredAddons?: string[]
  pluginDependencies?: PluginDep[]
  /** The latest version ships an author signature and the entry declares a key. */
  signed?: boolean
  /** The full key — public, and carried in full because re-trust compares it exactly. */
  authorPublicKey?: string | null
}
/** One published version, with its SERVER-computed compat verdict (the client has no semver). */
interface VersionInfo {
  version: string
  publishedAt: string | null
  size: number | null
  signed: boolean
  /** The declared TREK requirement, or null when the entry carries no bounds at all. */
  trek: string | null
  compatible: boolean
}
interface RegistryDetail extends RegistryItem {
  size: number | null
  publishedAt: string | null
  /** Every published version, newest first — the version picker's data. */
  versions?: VersionInfo[]
  manifest: {
    // Optional because a registry may omit an empty list — the detail view has to
    // degrade rather than throw halfway through its render.
    permissions?: string[]
    egress?: string[]
    /** The plugin needs OPERATOR-supplied hosts — its egress list is not the whole story. */
    operatorEgress?: boolean
    settings?: Array<{ key: string; label: string; inputType: string; scope: string; required: boolean }>
    license: string | null
    icon: string | null
    requiredAddons?: string[]
    pluginDependencies?: PluginDep[]
    /** Display slice of the manifest's capabilities — drives the same chips as an installed row. */
    capabilities?: {
      widget?: { slot?: string }
      tripPage?: { replaces?: string[] }
      /** Tools the plugin will publish on the MCP server once mcp:tools is granted. */
      mcpTools?: Array<{ name: string; title?: string; description: string }>
      /** Explore-pill categories it adds (#1781), checked again before anything draws them. */
      poiCategories?: unknown
    }
  } | null
}

/** 409 error-body shape from POST /activate when a dependency blocks activation. */
interface ActivateErr {
  response?: {
    status?: number
    data?: { code?: string; error?: string; newPermissions?: string[]; newEgress?: string[]; addons?: string[]; missing?: PluginDep[]; versionMismatch?: VersionMismatch[] }
  }
}

/** The server's error envelope. Reading `code` — not the message text — is what lets the
 * UI tell a rotated key (overridable) from a signature that doesn't verify (never). */
function errBody(e: unknown): { error?: string; code?: string } {
  return (e as { response?: { data?: { error?: string; code?: string } } })?.response?.data ?? {}
}

/** The ONE signature refusal an admin may override, because a rotation has a benign
 * explanation. SIGNATURE_INVALID / _MISSING / _INCOMPLETE mean the bytes are not what the
 * author signed — those get an explanation and no override button at all. */
const RETRUSTABLE = 'SIGNATURE_KEY_CHANGED'
const SIGNATURE_CODES = [RETRUSTABLE, 'SIGNATURE_INVALID', 'SIGNATURE_MISSING', 'SIGNATURE_INCOMPLETE']

/**
 * What the signature dialog needs to talk about a plugin — deliberately NOT a PluginRow.
 *
 * A refusal can land on a plugin that is not installed (a fresh install from Discover, or a
 * dependency being downloaded), and those have no row. Keying the dialog off PluginRow meant
 * the lookup missed and the refusal silently degraded to a toast — on the very path where an
 * admin most often meets these codes for the first time. Name + pinned fingerprint is all the
 * dialog ever reads, and both a row and a registry entry can supply that.
 */
type SigSubject = { id: string; name: string; keyFingerprint: string | null }

/**
 * Is a recorded update block still describing the version on offer?
 *
 * Once the registry offers something NEWER than the version that was refused, the block
 * describes an artifact nobody is being offered anymore — so it reads as stale and the
 * admin can simply re-attempt (the next install re-verifies and either succeeds or
 * re-blocks with fresh values). When the registry is unreachable we can't prove staleness,
 * so the block stands: silently dropping the last thing we knew would be the worse failure.
 */
function blockIsCurrent(p: PluginRow, latestVer?: string): boolean {
  if (!p.updateBlock) return false
  // A block describes a refused REGISTRY update. Once a plugin is sideloaded or dev-linked
  // it has left the registry trust model — the running code is whatever the admin supplied,
  // and a block about an author signing key says nothing about it. The server clears the
  // block on both paths; this makes it impossible to render a stale one regardless.
  if (!isRegistrySourced(p.source_repo)) return false
  if (!latestVer || !p.updateBlock.version) return true
  return latestVer === p.updateBlock.version
}

type T = (k: string, p?: Record<string, unknown>) => string
type TypeFilter = 'all' | 'widget' | 'page' | 'integration' | 'trip-page'
type StatusFilter = 'all' | 'on' | 'off' | 'update' | 'err'
type SortKey = 'name' | 'recent' | 'updates' | 'downloads'

// Runtime health → dot colour on the icon tile.
const HEALTH: Record<string, string> = {
  active: 'bg-success',
  starting: 'bg-info animate-pulse',
  error: 'bg-danger',
  inactive: 'bg-content-faint/60',
  disabled: 'bg-warning',
  incompatible: 'bg-warning',
}

// Known permissions → human-readable i18n key; unknown ones render as raw code.
// Generated from the host's protocol/envelope.ts by
// server/scripts/gen-plugin-facts.ts - this used to be a hand-kept fourth copy.
const PERM_KEYS = PLUGIN_PERMISSIONS

const KNOWN_TYPES = ['widget', 'page', 'integration', 'trip-page']

function isNewer(a: string, b: string): boolean {
  const nums = (v: string) => v.split('-')[0].split('.').map(n => Number.parseInt(n, 10) || 0)
  const pa = nums(a), pb = nums(b)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0, y = pb[i] || 0
    if (x !== y) return x > y
  }
  return !a.includes('-') && b.includes('-')
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try { const v = JSON.parse(raw || '') as T; return v ?? fallback } catch { return fallback }
}

interface DepChip { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; blocked: boolean; warn?: boolean }

// A plugin's declared dependencies as chips — a required addon (amber when that
// addon is disabled), a plugin dependency (amber when missing / version-mismatched),
// or the TREK version itself (amber when this server has outgrown the plugin's range,
// which is the one blocker the admin cannot fix by flipping something else on).
function deriveDeps(p: PluginRow, t: T): DepChip[] {
  const out: DepChip[] = []
  const issues = p.dependencyIssues
  if (p.dependencyStatus === 'hostIncompatible') {
    out.push({
      icon: AlertTriangle,
      label: p.trekRange
        ? t('admin.plugins.dep.trekIncompatible', { range: p.trekRange, host: p.hostVersion ?? '?' })
        : t('admin.plugins.dep.trekUnknown'),
      blocked: true,
    })
  }
  const bypassed = bypassChip(p.trekRangeBypassed, t) // TREK_PLUGINS_IGNORE_TREK_RANGE: a warning, not a blocker
  if (bypassed) out.push(bypassed)
  for (const a of p.dependencies?.requiredAddons ?? []) {
    out.push({ icon: Blocks, label: t('admin.plugins.cap.requiresAddon', { addon: a }), blocked: !!issues?.disabledAddons.includes(a) })
  }
  for (const d of p.dependencies?.pluginDependencies ?? []) {
    const blocked = !!(issues?.missing.some(m => m.id === d.id) || issues?.versionMismatch.some(m => m.id === d.id))
    out.push({ icon: Puzzle, label: t('admin.plugins.cap.dependsOn', { id: d.id, version: d.version }), blocked })
  }
  return out
}

/**
 * What the Install button may do for a registry item.
 *
 * The server already decided compatibility — it owns the semver, and a second
 * implementation here would eventually disagree with the install gate and offer a button
 * that 400s. This only picks the wording. Note the middle case: when the newest release
 * has outrun this TREK but an older one still fits, offer THAT version rather than a dead
 * grey button. The plugin is perfectly usable, just not at its newest.
 */
function installOffer(item: RegistryItem, t: T, ignoreTrekRange = false): { blocked: boolean; version?: string; label: string; title?: string; warn?: RangeWarning } {
  if (item.compatible !== false) return { blocked: false, label: t('admin.plugins.install') }
  const title = item.trek
    ? t('admin.plugins.dep.trekIncompatible', { range: item.trek, host: item.hostVersion ?? '?' })
    : t('admin.plugins.dep.trekUnknown')
  if (ignoreTrekRange) return bypassOffer(item, t, title) // TREK_PLUGINS_IGNORE_TREK_RANGE: "Install anyway"
  if (item.latestCompatible) {
    return { blocked: false, version: item.latestCompatible, label: t('admin.plugins.installCompatible', { version: item.latestCompatible }), title }
  }
  return { blocked: true, label: t('admin.plugins.incompatible'), title }
}


/** The head band of a dialog that warns before something happens: a faint wash of the warning tone. */
const WARN_TINT = 'color-mix(in srgb, var(--warning) 10%, transparent)'
/** The eyebrow over a block, the size the dialogs' sections use. */
const EYEBROW = 'm-0 font-geist font-bold uppercase tracking-[.08em] text-content-faint'
/** A capability or dependency chip on an installed row. */
const CHIP = 'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-[2px] font-medium'
const CHIP_NEUTRAL = 'border-edge-faint bg-surface-secondary text-content-secondary'
const CHIP_NET = 'border-transparent bg-info-soft text-info'
const CHIP_WARN = 'border-transparent bg-warning-soft text-warning'
/** A small action inside a row or a card: the kit's button, a size down. */
const SMALL_BUTTON = 'inline-flex flex-none items-center justify-center gap-1.5 rounded-[10px] bg-surface-card px-2.5 py-1.5 font-semibold text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary disabled:cursor-default disabled:opacity-50'
const SMALL_PRIMARY = 'inline-flex flex-none items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 py-1.5 font-semibold text-accent-text hover:opacity-90 disabled:cursor-default disabled:bg-surface-tertiary disabled:text-content-faint'
/** A line of state under a row's name: a refused update, a paused one, an error. */
const ROW_NOTE = 'mt-1.5 flex min-w-0 items-center gap-1.5'

/** A pill that explains itself on hover. */
function HintPill({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <Tooltip label={hint}>
      <span className="inline-flex flex-none">{children}</span>
    </Tooltip>
  )
}

function ReviewedBadge({ t }: { t: T }) {
  return <ShieldCheck size={13} className="text-success shrink-0" aria-label={t('admin.plugins.reviewed')} />
}

/** Marks a manually-uploaded (sideloaded) plugin: no registry, unsigned, not reviewed. */
function SideloadedBadge({ t }: { t: T }) {
  return (
    <HintPill hint={t('admin.plugins.sideloadedHint')}>
      <StatusPill tone="warning" icon={<UploadCloud size={11} />}>{t('admin.plugins.sideloaded')}</StatusPill>
    </HintPill>
  )
}

/**
 * Whether a plugin came from the REGISTRY (as opposed to a manual upload or a dev-link).
 *
 * This is the precedence rule for the trust badges, and it is load-bearing: `signed`
 * derives from the pinned author key while sideloaded/dev-linked derive from source_repo,
 * so the states are NOT mutually exclusive in the data. A sideloaded plugin genuinely has
 * no pinned key, and a naive render would put "Unsigned" *and* "Sideloaded" side by side.
 * The source badge wins — it already says something strictly stronger, and doubling up
 * dilutes the amber into wallpaper, which is exactly what makes a warning worthless.
 */
function isRegistrySourced(sourceRepo: string | null | undefined): boolean {
  return !!sourceRepo && sourceRepo !== 'local:upload' && sourceRepo !== 'local:link'
}

/**
 * Signed / Unsigned, for registry plugins only (see isRegistrySourced).
 *
 * Signed is a quiet neutral tick, NOT a green celebration; unsigned is an amber note, NOT
 * a red alarm. Roughly two thirds of the live registry is unsigned, so an alarming
 * treatment would fire on most of the catalog and teach admins to ignore it — and the
 * honest delta is small: sha256 proves the bytes are what the REGISTRY vouches for, a
 * signature proves they came from the AUTHOR. Unsigned is one fewer guarantee, not "unsafe".
 */
function TrustBadge({ signed, t }: { signed: boolean; t: T }) {
  if (signed) {
    return (
      <HintPill hint={t('admin.plugins.signedHint')}>
        <StatusPill icon={<KeyRound size={11} />}>{t('admin.plugins.signed')}</StatusPill>
      </HintPill>
    )
  }
  return (
    <HintPill hint={t('admin.plugins.unsignedHint')}>
      <StatusPill tone="warning" icon={<ShieldAlert size={11} />}>{t('admin.plugins.unsigned')}</StatusPill>
    </HintPill>
  )
}

/** Marks a dev-linked plugin: loaded from a local build dir + hot-reloaded (dev only). */
function DevLinkBadge({ t }: { t: T }) {
  return (
    <HintPill hint={t('admin.plugins.devLinkHint')}>
      <StatusPill icon={<Link2 size={11} />}>{t('admin.plugins.devLinkBadge')}</StatusPill>
    </HintPill>
  )
}

function TypeBadge({ type, t }: { type: string; t: T }) {
  return (
    <span className="inline-flex flex-none items-center rounded-full bg-surface-tertiary px-2 py-[3px] font-geist font-bold uppercase tracking-[.06em] text-content-muted" style={fs(9.5)}>
      {KNOWN_TYPES.includes(type) ? t(`admin.plugins.type.${type}` as never) : type}
    </span>
  )
}

export default function AdminPluginsPanel() {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const [runtimeOn, setRuntimeOn] = useState(false)
  const [devLink, setDevLink] = useState(false) // dev-link enabled server-side (TREK_PLUGINS_DEV_LINK)
  const [ignoreTrekRange, setIgnoreTrekRange] = useState(false) // TREK_PLUGINS_IGNORE_TREK_RANGE set server-side
  const bypass = useRangeBypass() // its warning dialog/sheet state — shared with the other shell
  const [linkPath, setLinkPath] = useState('')
  const [plugins, setPlugins] = useState<PluginRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [view, setView] = useState<'installed' | 'discover'>('installed')
  const [registry, setRegistry] = useState<RegistryItem[] | null>(null)
  const [latest, setLatest] = useState<Record<string, string>>({})
  // The registry entry per id — the re-trust dialog needs the NEW author key from it (in
  // full: the server's equality check is exact), and the Discover/consent copy needs `signed`.
  const [regById, setRegById] = useState<Record<string, RegistryItem>>({})
  // Open when a signature check refused an install/update. Carries the code, so the dialog
  // knows whether an override may even be offered.
  const [signatureBlock, setSignatureBlock] = useState<{ subject: SigSubject; code: string; detail: string | null } | null>(null)
  const [retrusting, setRetrusting] = useState(false)
  const [detailFor, setDetailFor] = useState<RegistryItem | null>(null)
  const [errorsFor, setErrorsFor] = useState<{ id: string; rows: Array<{ ts: string; level: string; message: string }> } | null>(null)
  const [egressFor, setEgressFor] = useState<{ id: string; supported: boolean; hosts: string[] } | null>(null)
  // The admin-owned scope:'instance' settings form — shared logic with the phone shell.
  const settings = useInstanceSettings()
  const [egressDraft, setEgressDraft] = useState('')
  const [egressSaving, setEgressSaving] = useState(false)
  const [egressError, setEgressError] = useState('')
  const [confirmUninstall, setConfirmUninstall] = useState<PluginRow | null>(null)
  // The version picker for an INSTALLED plugin ("Change version…"); versions land async
  // from the registry detail endpoint, which computes each version's compat verdict.
  const [versionPicker, setVersionPicker] = useState<{ plugin: PluginRow; versions: VersionInfo[] | null; failed: boolean } | null>(null)
  // A picked version OLDER than the installed one — held here until the admin consents
  // to the data risk (the plugin's data dir stays; older code may not understand it).
  const [confirmDowngrade, setConfirmDowngrade] = useState<{ plugin: PluginRow; version: string } | null>(null)
  // A QUEUE, not one slot: "Update All" can produce several re-consent prompts —
  // each must be shown, not silently overwritten by the last one.
  const [consentQueue, setConsentQueue] = useState<Array<{ plugin: PluginRow; version: string; newPermissions: string[]; newEgress: string[] }>>([])
  // Open when enabling a plugin is blocked by missing/outdated plugin dependencies.
  const [depResolve, setDepResolve] = useState<{ plugin: PluginRow; missing: PluginDep[]; versionMismatch: VersionMismatch[] } | null>(null)
  const [menu, setMenu] = useState<string | null>(null)

  // Toolbar state.
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('name')

  // 'updates' only ranks installed plugins, 'downloads' only the registry — snap
  // the key back to name when switching tabs so the dropdown never carries a label
  // for an option the active tab can't offer.
  useEffect(() => {
    if (view === 'discover' && sort === 'updates') setSort('name')
    else if (view === 'installed' && sort === 'downloads') setSort('name')
  }, [view, sort])

  // Sideload upload: drag a plugin .zip onto the panel or use the toolbar button.
  const [dragActive, setDragActive] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)

  // Index the registry once per fetch: the version map the update badges read, plus the
  // whole entry (author key + signed flag) the trust badges and re-trust dialog need.
  // The map holds latestCompatible — the newest version THIS TREK can install (computed
  // server-side) — not the absolute latest, so the banner never counts an update the
  // update endpoint would refuse.
  const indexRegistry = (items: RegistryItem[]) => {
    const vers: Record<string, string> = {}
    const byId: Record<string, RegistryItem> = {}
    items.forEach((i) => { byId[i.id] = i; if (i.latestCompatible) vers[i.id] = i.latestCompatible })
    setLatest(vers)
    setRegById(byId)
  }

  const refresh = () => {
    // Keep the app-wide active-plugin store in sync so widget/hero/tab consumers
    // (e.g. the dashboard) reflect an activate/deactivate without a full reload (F5).
    void usePluginStore.getState().loadPlugins()
    adminApi.plugins()
      .then((d: { enabled: boolean; devLink?: boolean; ignoreTrekRange?: boolean; plugins: PluginRow[] }) => {
        setRuntimeOn(!!d.enabled)
        setDevLink(!!d.devLink)
        setIgnoreTrekRange(!!d.ignoreTrekRange)
        setPlugins(d.plugins || [])
        if ((d.plugins || []).length) {
          adminApi.pluginBrowse().then(indexRegistry).catch(() => {})
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }
  useEffect(refresh, [])

  // A signature refusal is not an ordinary "action failed": it is the one class of error
  // where WHICH failure it was decides what the admin may do about it. Route it to the
  // dialog off the CODE, never off the message text. Returns true when handled.
  //
  // The subject is resolved from wherever it can be — the installed row, else the registry
  // entry (a plugin being INSTALLED has no row yet), else the bare id. A signature code
  // ALWAYS opens the dialog: falling back to a toast is what used to hide an invalid
  // signature on a fresh install behind the same treatment as a network blip.
  const routeSignatureError = (id: string, code?: string, detail?: string): boolean => {
    if (!code || !SIGNATURE_CODES.includes(code)) return false
    const row = plugins.find(p => p.id === id)
    const subject: SigSubject = row
      ? { id, name: row.name, keyFingerprint: row.keyFingerprint ?? null }
      // Not installed: no pinned key exists, so SIGNATURE_KEY_CHANGED cannot arise and the
      // dialog shows the no-override explanation — which is exactly right.
      : { id, name: regById[id]?.name ?? id, keyFingerprint: null }
    setSignatureBlock({ subject, code, detail: detail ?? null })
    return true
  }

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id); setMenu(null)
    try { await fn(); toast.success(ok) }
    catch (e) {
      const { error, code } = errBody(e)
      if (!routeSignatureError(id, code, error)) toast.error(error || t('admin.plugins.actionError'))
    }
    finally { setBusy(null); refresh() }
  }

  const openDiscover = () => {
    setView('discover')
    if (!registry) {
      adminApi.pluginBrowse()
        .then((items: RegistryItem[]) => { setRegistry(items); indexRegistry(items) })
        .catch(() => setRegistry([]))
    }
  }
  // The rescan/reload button rediscovers locally-installed plugins AND force-pulls
  // the remote registry (bypassing the 30-min server cache + GitHub's CDN), so a
  // just-published plugin shows up right away instead of up to ~35 min later.
  const rescan = () => act('__rescan', async () => {
    await adminApi.pluginRescan()
    const items: RegistryItem[] = await adminApi.pluginBrowse(true)
    setRegistry(items)
    indexRegistry(items)
  }, t('admin.plugins.rescanned'))

  // Sideload a plugin archive (installs INACTIVE — the admin still consents on activation).
  const uploadPlugin = async (file: File) => {
    setBusy('__upload'); setMenu(null)
    try {
      const res = await adminApi.pluginUpload(file)
      setView('installed')
      toast.success(t('admin.plugins.uploaded', { name: res.id }))
      bypass.notice(res.id, res.trekRangeBypassed)
    } catch (e) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError'))
    } finally {
      setBusy(null); refresh()
    }
  }
  const pickUpload = () => uploadInputRef.current?.click()
  const onDragEnter = (e: DragEvent) => {
    if (!runtimeOn || !Array.from(e.dataTransfer.types).includes('Files')) return
    e.preventDefault(); dragDepth.current++; setDragActive(true)
  }
  const onDragLeave = () => { if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragActive(false) } }
  const onDrop = (e: DragEvent) => {
    e.preventDefault(); dragDepth.current = 0; setDragActive(false)
    if (!runtimeOn) return
    const f = e.dataTransfer.files?.[0]
    if (f) void uploadPlugin(f)
  }
  const openEgress = (id: string) => {
    setMenu(null)
    setEgressDraft(''); setEgressError('')
    adminApi.pluginEgressHosts(id)
      .then(d => setEgressFor({ id, supported: d.supported, hosts: d.hosts }))
      .catch(() => setEgressFor({ id, supported: false, hosts: [] }))
  }

  // Saving RE-SPAWNS the plugin: the child's egress guard is installed once at init and
  // a second init is refused, so a live child's allow-list can never be widened in place.
  const saveEgress = async (hosts: string[]) => {
    if (!egressFor) return
    setEgressSaving(true); setEgressError('')
    try {
      const d = await adminApi.pluginSetEgressHosts(egressFor.id, hosts)
      setEgressFor({ ...egressFor, hosts: d.hosts })
      setEgressDraft('')
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } }
      setEgressError(err.response?.data?.error || t('common.error'))
    } finally {
      setEgressSaving(false)
    }
  }

  const openInstanceSettings = (p: { id: string; status: string }) => {
    setMenu(null)
    settings.open(p.id, p.status === 'active')
  }

  const openErrors = (id: string) => {
    setMenu(null)
    adminApi.pluginErrors(id)
      .then((d: { errors: Array<{ ts: string; level: string; message: string }> }) => setErrorsFor({ id, rows: d.errors }))
      .catch(() => setErrorsFor({ id, rows: [] }))
  }

  // A held plugin (deliberate non-latest install) is deliberately NOT an update candidate:
  // the admin just rolled it back, and the banner nagging them straight back would make
  // the rollback fight the UI. The row carries its own "paused" marker + resume instead.
  const updateAvailable = (p: PluginRow) => !!(p.version && !p.updateHold && latest[p.id] && isNewer(latest[p.id], p.version))
  const resumeUpdates = (p: PluginRow) => act(p.id, () => adminApi.pluginResumeUpdates(p.id), t('admin.plugins.updatesResumed'))
  // A newer version exists but this TREK can't install it (and it isn't the one on offer):
  // said passively on the row, so the admin learns a TREK upgrade unlocks it instead of
  // wondering why no update shows. Null when the registry gives no range to point at.
  const newerIncompatible = (p: PluginRow): { version: string; range: string } | null => {
    const reg = regById[p.id]
    if (!reg?.latest || !p.version || !isNewer(reg.latest, p.version)) return null
    if (latest[p.id] === reg.latest) return null
    const range = reg.trek ?? (reg.minTrekVersion ? `>=${reg.minTrekVersion}` : null)
    return range ? { version: reg.latest, range } : null
  }
  // `warn` is the pre-install confirm for an entry the registry already flagged as
  // incompatible; an artifact whose OWN manifest turns out to be out of range (the index
  // was only a pre-download filter) is caught by the marker on the response instead.
  const install = (id: string, version?: string, warn?: RangeWarning) => bypass.guard(warn, () =>
    act(id, () => adminApi.pluginInstall(id, version ? { version } : undefined).then(r => { if (!warn) bypass.notice(id, r?.trekRangeBypassed) }), t('admin.plugins.installed')))
  const restart = (id: string) => act(id, async () => { await adminApi.pluginDeactivate(id); await adminApi.pluginActivate(id) }, t('admin.plugins.restarted'))
  // Dev-link: register a plugin from a local built directory (dev only). Reuses the
  // same busy/toast/refresh loop as uploadPlugin; the server gates it.
  const linkLocal = async () => {
    const p = linkPath.trim()
    if (!p) return
    setBusy('__link'); setMenu(null)
    try {
      const res = await adminApi.pluginLink(p)
      setView('installed')
      setLinkPath('')
      toast.success(t('admin.plugins.devLinkLinked', { id: res.id }))
      bypass.notice(res.id, res.trekRangeBypassed)
    } catch (e) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError'))
    } finally {
      setBusy(null); refresh()
    }
  }
  const installedIds = new Set(plugins.map(p => p.id))

  // Installed-but-disabled direct deps that enabling `p` will auto-enable first.
  const autoEnabledDeps = (p: PluginRow) =>
    (p.dependencies?.pluginDependencies ?? [])
      .map(d => plugins.find(x => x.id === d.id))
      .filter((x): x is PluginRow => !!x && x.enabled === 0)
      .map(x => x.name)

  // Shared handling for a failed activation: route each 409 code to the right fix
  // (consent dialog, download-dependency dialog, or a clear toast).
  const onActivateError = (p: PluginRow, e: ActivateErr) => {
    const d = e?.response?.data
    if (e?.response?.status === 409 && d?.code === 'CONSENT_REQUIRED') {
      setConsentQueue(qq => [...qq, { plugin: p, version: latest[p.id] ?? p.version ?? '', newPermissions: d.newPermissions ?? [], newEgress: d.newEgress ?? [] }])
    } else if (e?.response?.status === 409 && d?.code === 'ADDON_DISABLED') {
      toast.error(t('admin.plugins.dep.addonDisabledToast', { addons: (d.addons ?? []).join(', ') }))
    } else if (e?.response?.status === 409 && d?.code === 'DEPENDENCY_MISSING') {
      setDepResolve({ plugin: p, missing: d.missing ?? [], versionMismatch: d.versionMismatch ?? [] })
    } else {
      // DEPENDENCY_CYCLE and everything else surface their server message.
      toast.error(d?.error || t('admin.plugins.actionError'))
    }
  }

  const attemptActivate = (p: PluginRow) => {
    const cascaded = autoEnabledDeps(p)
    return adminApi.pluginActivate(p.id)
      .then(() => {
        toast.success(t('admin.plugins.activated'))
        if (cascaded.length) toast.success(t('admin.plugins.dep.autoEnabled', { plugins: cascaded.join(', ') }))
        setDepResolve(null)
      })
      .catch((e: ActivateErr) => onActivateError(p, e))
  }

  // Enable/disable a plugin. Re-enabling one whose update widened its permissions
  // must NOT grant them silently (409 CONSENT_REQUIRED → consent dialog); a disabled
  // required addon or a missing plugin dependency (409 ADDON_DISABLED /
  // DEPENDENCY_MISSING) routes to the right remedy.
  const toggle = (p: PluginRow) => {
    if (busy === p.id) return
    if (p.enabled === 1) { void act(p.id, () => adminApi.pluginDeactivate(p.id), t('admin.plugins.deactivated')); return }
    setBusy(p.id); setMenu(null)
    attemptActivate(p).finally(() => { setBusy(null); refresh() })
  }

  // Download a missing/outdated plugin dependency (latest compatible for its range,
  // transitively), then retry enabling the plugin that needed it.
  const resolveDependency = (parent: PluginRow, depId: string, constraint?: string) => {
    if (busy === parent.id) return
    setBusy(parent.id)
    adminApi.pluginInstall(depId, { constraint, withDependencies: true })
      .then((r: { installed?: string[]; requiredAddons?: string[]; trekRangeBypassed?: TrekRangeBypass | null }) => {
        toast.success(t('admin.plugins.dep.downloaded', { id: depId }))
        if (r?.requiredAddons?.length) toast.error(t('admin.plugins.dep.addonDisabledToast', { addons: r.requiredAddons.join(', ') }))
        bypass.notice(depId, r?.trekRangeBypassed)
        return attemptActivate(parent)
      })
      // The DEPENDENCY is what's being downloaded, so a signature refusal here is about the
      // dependency's author, not the parent's — route it under depId before falling through
      // to the activation-error handling, which knows nothing about signature codes.
      .catch((e: ActivateErr) => {
        const { error, code } = errBody(e)
        if (!routeSignatureError(depId, code, error)) onActivateError(parent, e)
      })
      .finally(() => { setBusy(null); refresh() })
  }

  // `version` pins the exact version to install (rollback / explicit switch); omitted,
  // the server resolves the newest TREK-compatible version itself.
  const runUpdate = (p: PluginRow, version?: string) => {
    setBusy(p.id); setMenu(null)
    return adminApi.pluginUpdate(p.id, version)
      .then((r: { version: string; activated: boolean; newPermissions: string[]; newEgress: string[]; trekRangeBypassed?: TrekRangeBypass | null }) => {
        if (r.activated || (r.newPermissions.length === 0 && r.newEgress.length === 0)) toast.success(t('admin.plugins.updated'))
        else setConsentQueue(qq => [...qq, { plugin: p, version: r.version, newPermissions: r.newPermissions, newEgress: r.newEgress }])
        bypass.notice(p.name, r.trekRangeBypassed)
      })
      .catch(e => {
        const { error, code } = errBody(e)
        if (!routeSignatureError(p.id, code, error)) toast.error(error || t('admin.plugins.actionError'))
      })
      .finally(() => { setBusy(null); refresh() })
  }

  // Confirm a key rotation: re-pin the new key AND update, in one server call. There is no
  // follow-up /update — a re-pin that waited for a second call would leave the plugin
  // pinned to a key no install had ever been verified against if that call never came.
  const confirmRetrust = (id: string, version: string, publicKey: string) => {
    setRetrusting(true)
    adminApi.pluginRetrust(id, version, publicKey)
      .then((r: { version: string; activated: boolean; newPermissions: string[]; newEgress: string[] }) => {
        setSignatureBlock(null)
        // A re-trusted update widening permissions still needs consent — re-trusting a
        // signing key says nothing about what the new code is allowed to do. Re-trust only
        // ever fires for an INSTALLED plugin, so the row is there to consent against.
        const p = plugins.find(x => x.id === id)
        if (p && !r.activated && (r.newPermissions.length > 0 || r.newEgress.length > 0)) {
          setConsentQueue(qq => [...qq, { plugin: p, version: r.version, newPermissions: r.newPermissions, newEgress: r.newEgress }])
        } else toast.success(t('admin.plugins.retrusted'))
      })
      .catch(e => toast.error(errBody(e).error || t('admin.plugins.actionError')))
      .finally(() => { setRetrusting(false); refresh() })
  }

  // "Change version…" on an installed row: fetch the per-version list (with the server's
  // compat verdicts) and open the picker. The fetch is keyed to the plugin so a stale
  // response can't populate a picker that was reopened for another row.
  const openVersionPicker = (p: PluginRow) => {
    setMenu(null)
    setVersionPicker({ plugin: p, versions: null, failed: false })
    adminApi.pluginDetail(p.id)
      .then((d: RegistryDetail) => setVersionPicker(cur => (cur && cur.plugin.id === p.id ? { ...cur, versions: d.versions ?? [] } : cur)))
      .catch(() => setVersionPicker(cur => (cur && cur.plugin.id === p.id ? { ...cur, failed: true } : cur)))
  }

  // Switching DOWN keeps the plugin's data dir, which the older code may not understand —
  // that asks for explicit consent first. Any other switch is the ordinary update path.
  const pickVersion = (version: string) => {
    if (!versionPicker) return
    const p = versionPicker.plugin
    setVersionPicker(null)
    if (p.version && isNewer(p.version, version)) setConfirmDowngrade({ plugin: p, version })
    else void runUpdate(p, version)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updatable = useMemo(() => plugins.filter(updateAvailable), [plugins, latest])

  // One after another: busy is a single slot, so parallel updates would leave the
  // other rows clickable mid-install and refresh once per plugin.
  const updateAll = async () => {
    for (const p of updatable) await runUpdate(p)
  }

  // Installed list after search / type / status filters + sort.
  const shownInstalled = useMemo(() => {
    const term = q.trim().toLowerCase()
    let rows = plugins.filter(p => {
      const matchesText = !term || `${p.name} ${p.description ?? ''}`.toLowerCase().includes(term)
      const matchesType = typeFilter === 'all' || p.type === typeFilter
      const st = statusFilter === 'all' ? true
        : statusFilter === 'on' ? p.enabled === 1 && p.status !== 'error'
        : statusFilter === 'off' ? p.enabled === 0
        : statusFilter === 'update' ? updateAvailable(p)
        : p.status === 'error'
      return matchesText && matchesType && st
    })
    rows = [...rows].sort((a, b) => {
      if (sort === 'updates') {
        const ua = updateAvailable(a) ? 0 : 1, ub = updateAvailable(b) ? 0 : 1
        if (ua !== ub) return ua - ub
      }
      return a.name.localeCompare(b.name)
    })
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugins, q, typeFilter, statusFilter, sort, latest])

  // Registry list after search / type filter.
  const shownRegistry = useMemo(() => {
    if (!registry) return null
    const term = q.trim().toLowerCase()
    let items = registry.filter(r => {
      const matchesText = !term || `${r.name} ${r.author} ${r.description}`.toLowerCase().includes(term)
      const matchesType = typeFilter === 'all' || r.type === typeFilter
      return matchesText && matchesType
    })
    items = [...items].sort((a, b) => {
      if (sort === 'downloads') return (b.downloadCount ?? 0) - (a.downloadCount ?? 0) || a.name.localeCompare(b.name)
      if (sort === 'recent') return (Date.parse(b.reviewedAt ?? '') || 0) - (Date.parse(a.reviewedAt ?? '') || 0) || a.name.localeCompare(b.name)
      return a.name.localeCompare(b.name)
    })
    return items
  }, [registry, q, typeFilter, sort])

  const anyFilter = q.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all'
  const ready = runtimeOn && !loading && !error
  // A question opened from the detail view (the range warning, a signature refusal, the
  // consent gate) sits on top of it; Escape and the backdrop leave the detail alone meanwhile.
  const detailBlocked = !!bypass.copy || !!signatureBlock || consentQueue.length > 0

  return (
    <div className="relative mb-24 sm:mb-0"
      onDragEnter={onDragEnter} onDragOver={e => { if (dragActive) e.preventDefault() }} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Hidden input for the "Upload plugin" button (drag-drop uses the same handler). */}
      <input ref={uploadInputRef} type="file" accept=".zip,.tgz,.tar.gz" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void uploadPlugin(f); e.target.value = '' }} />
      {/* Drag-to-install overlay */}
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-accent backdrop-blur-[2px]"
          style={{ background: 'color-mix(in srgb, var(--bg-card) 82%, transparent)' }}>
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-surface-card text-content shadow-sm">
            <UploadCloud size={22} strokeWidth={1.9} />
          </span>
          <span className="font-semibold text-content" style={fs(14, 'body')}>{t('admin.plugins.dropToUpload')}</span>
        </div>
      )}
      {/* Click-away layer for any open dropdown (filters or a row's ⋯ menu). */}
      {menu && <div role="presentation" className="fixed inset-0 z-20" onClick={() => setMenu(null)} />}

      <SettingsCard
        icon={Blocks}
        title={t('admin.plugins.title')}
        hint={t('admin.plugins.subtitle')}
        badge={runtimeOn ? (
          <>
            {ignoreTrekRange && (
              <HintPill hint={t('admin.plugins.rangeBypass.pillHint')}>
                <StatusPill tone="warning" icon={<AlertTriangle size={11} />}>{t('admin.plugins.rangeBypass.pill')}</StatusPill>
              </HintPill>
            )}
            <StatusPill tone="success" icon={<span className="h-1.5 w-1.5 rounded-full bg-success" />}>{t('admin.plugins.runtimeOn')}</StatusPill>
          </>
        ) : undefined}
        action={ready ? (
          <>
            <BandButton label={t('admin.plugins.upload')} onClick={pickUpload} disabled={busy === '__upload'}>
              <UploadCloud size={15} strokeWidth={2} />
            </BandButton>
            <BandButton label={t('admin.plugins.rescan')} onClick={rescan} disabled={busy === '__rescan'}>
              <RefreshCw size={15} strokeWidth={2} className={busy === '__rescan' ? 'animate-spin' : ''} />
            </BandButton>
          </>
        ) : undefined}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-content-faint" style={fs(12.5, 'body')}>
            <Loader2 size={15} className="animate-spin" />{t('common.loading')}
          </div>
        ) : error ? (
          <div className="py-12 text-center text-danger" style={fs(13, 'body')}>{t('admin.plugins.loadError')}</div>
        ) : !runtimeOn ? (
          // Runtime switched off server-side: the notice replaces the whole body.
          <div className="flex items-start gap-3 rounded-[12px] bg-warning-soft px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 flex-none text-warning" />
            <div className="min-w-0">
              <p className="m-0 font-semibold text-content" style={fs(13, 'body')}>{t('admin.plugins.disabledTitle')}</p>
              <p className="m-0 mt-0.5 leading-snug text-content-muted" style={fs(12)}>{t('admin.plugins.disabledBody')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Dev-link: register + hot-reload a plugin from a local build dir (dev only). */}
            {devLink && (
              <form onSubmit={(e) => { e.preventDefault(); void linkLocal() }}
                className="flex flex-col gap-2 rounded-[12px] border border-edge-faint bg-surface-card p-3.5">
                <div className="flex flex-wrap items-end gap-2.5">
                  <EditorField label={<span className="inline-flex items-center gap-1.5"><Link2 size={11} />{t('admin.plugins.devLinkTitle')}</span>}
                    htmlFor="plugin-dev-link" className="min-w-[220px] flex-1">
                    <input id="plugin-dev-link" value={linkPath} onChange={(e) => setLinkPath(e.target.value)} spellCheck={false}
                      placeholder={t('admin.plugins.devLinkPathPlaceholder')} className={`${INPUT} font-mono`} />
                  </EditorField>
                  <button type="submit" disabled={!linkPath.trim() || busy === '__link'} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
                    <Link2 size={14} /> {t('admin.plugins.devLinkButton')}
                  </button>
                </div>
                <SettingsHint>{t('admin.plugins.devLinkHint')}</SettingsHint>
              </form>
            )}

            {/* Toolbar: what to look at on the left, how to narrow and order it on the right. */}
            <div className="relative z-30 flex flex-wrap items-center gap-2">
              <div role="tablist" className="inline-flex flex-none gap-0.5 rounded-[10px] bg-surface-tertiary p-[3px]">
                <SegBtn active={view === 'installed'} onClick={() => setView('installed')} label={t('admin.plugins.installed')} count={plugins.length} />
                <SegBtn active={view === 'discover'} onClick={openDiscover} label={t('admin.plugins.tabDiscover')} count={registry?.length} />
              </div>

              <label className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-[10px] border border-edge bg-surface-input px-3 text-content-faint focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]">
                <Search size={14} strokeWidth={2} className="flex-none" />
                <input
                  value={q} onChange={e => setQ(e.target.value)} type="search"
                  placeholder={t('admin.plugins.searchPlaceholder')}
                  className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint"
                  style={fs(13, 'body')}
                />
              </label>

              <FilterMenu id="type" label={t('admin.plugins.filterType')} value={typeFilter} menu={menu} setMenu={setMenu} icon={<SlidersHorizontal size={14} />}
                options={[
                  ['all', t('admin.plugins.allTypes')], ['widget', t('admin.plugins.type.widget')],
                  ['integration', t('admin.plugins.type.integration')], ['page', t('admin.plugins.type.page')],
                  ['trip-page', t('admin.plugins.type.trip-page')],
                ]}
                valueLabel={typeFilter === 'all' ? t('admin.plugins.allTypes') : t(`admin.plugins.type.${typeFilter}` as never)}
                onPick={v => setTypeFilter(v as TypeFilter)} />

              {view === 'installed' && (
                <FilterMenu id="status" label={t('admin.plugins.filterStatus')} value={statusFilter} menu={menu} setMenu={setMenu} icon={<CircleDot size={14} />}
                  options={[
                    ['all', t('admin.plugins.allStatuses')], ['on', t('admin.plugins.status.active')], ['off', t('admin.plugins.stateOff')],
                    ['update', t('admin.plugins.filterUpdate')], ['err', t('admin.plugins.status.error')],
                  ]}
                  valueLabel={statusLabel(statusFilter, t)}
                  onPick={v => setStatusFilter(v as StatusFilter)} />
              )}

              <FilterMenu id="sort" label={t('admin.plugins.sortBy')} value={sort} menu={menu} setMenu={setMenu} icon={<ArrowUpDown size={14} />}
                options={view === 'discover'
                  ? [['name', t('admin.plugins.sortName')], ['recent', t('admin.plugins.sortRecent')], ['downloads', t('admin.plugins.sortDownloads')]]
                  : [['name', t('admin.plugins.sortName')], ['recent', t('admin.plugins.sortRecent')], ['updates', t('admin.plugins.sortUpdates')]]}
                valueLabel={sortLabel(sort, t)}
                onPick={v => setSort(v as SortKey)} />
            </div>

            {view === 'discover' ? (
              <RegistryGrid items={shownRegistry} busy={busy} t={t} installedIds={installedIds} ignoreTrekRange={ignoreTrekRange}
                onInstall={install} onOpenDetail={setDetailFor} filtered={anyFilter} />
            ) : plugins.length === 0 ? (
              <EmptyState
                title={t('admin.plugins.empty')}
                surface="var(--bg-secondary)"
                size={88}
                action={(
                  <button type="button" onClick={openDiscover} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
                    <Download size={14} /> {t('admin.plugins.tabDiscover')}
                  </button>
                )}
              />
            ) : (
              <>
                {updatable.length > 0 && statusFilter !== 'err' && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] bg-warning-soft px-3.5 py-2.5">
                    <ArrowUpCircle size={16} className="flex-none text-warning" />
                    <span className="min-w-0 flex-1 text-content-secondary" style={fs(12.5, 'body')}>{t('admin.plugins.updatesAvailable', { count: updatable.length })}</span>
                    <button type="button" onClick={() => void updateAll()} className={SMALL_BUTTON} style={fs(12, 'body')}>
                      <ArrowUpCircle size={13} /> {t('admin.plugins.updateAll')}
                    </button>
                  </div>
                )}
                {shownInstalled.length === 0 ? (
                  <NoMatch>{t('admin.plugins.noMatchInstalled')}</NoMatch>
                ) : (
                  <SettingRows>
                    {shownInstalled.map(p => (
                      <InstalledRow key={p.id} p={p} t={t} busy={busy} menu={menu} setMenu={setMenu}
                        hasUpdate={updateAvailable(p)} latestVer={latest[p.id]}
                        newerIncompatible={newerIncompatible(p)}
                        blocked={blockIsCurrent(p, latest[p.id])}
                        onToggle={() => toggle(p)}
                        onUpdate={() => runUpdate(p)} onRestart={() => restart(p.id)}
                        onChangeVersion={() => openVersionPicker(p)}
                        onResume={() => void resumeUpdates(p)}
                        onReviewBlock={() => setSignatureBlock({
                          subject: { id: p.id, name: p.name, keyFingerprint: p.keyFingerprint ?? null },
                          code: p.updateBlock!.code, detail: p.updateBlock!.detail,
                        })}
                        onErrors={() => openErrors(p.id)} onEgress={() => openEgress(p.id)}
                        onSettings={() => openInstanceSettings(p)}
                        onUninstall={() => { setMenu(null); setConfirmUninstall(p) }} />
                    ))}
                  </SettingRows>
                )}
              </>
            )}
          </>
        )}
      </SettingsCard>

      <SecurityInfo t={t} />

      {/* Registry detail dialog */}
      {detailFor && (
        <PluginDetailModal item={detailFor} t={t} locale={locale} busy={busy} ignoreTrekRange={ignoreTrekRange} blocked={detailBlocked}
          installed={installedIds.has(detailFor.id)} onInstall={install} onClose={() => setDetailFor(null)} />
      )}

      {bypass.copy && <RangeBypassDialog copy={bypass.copy} t={t} onConfirm={bypass.confirm} onClose={bypass.dismiss} />}

      {errorsFor && <ErrorLogDialog id={errorsFor.id} rows={errorsFor.rows} t={t} onClose={() => setErrorsFor(null)} />}

      {/* Operator-supplied egress hosts */}
      {egressFor && (
        <EgressDialog data={egressFor} draft={egressDraft} setDraft={setEgressDraft} saving={egressSaving} error={egressError}
          onSave={hosts => void saveEgress(hosts)} onClose={() => setEgressFor(null)} t={t} />
      )}

      {/* Instance-wide settings (the admin-owned scope:'instance' fields) */}
      {settings.form && <InstanceSettingsDialog settings={settings} t={t} />}

      <ConfirmDialog
        isOpen={settings.pendingAction !== null}
        onClose={settings.cancelPendingAction}
        onConfirm={settings.confirmPendingAction}
        title={settings.pendingAction?.label ?? ''}
        message={t('admin.plugins.actions.confirm')}
        confirmLabel={t('common.confirm')}
      />

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

      {versionPicker && (
        <VersionPickerDialog plugin={versionPicker.plugin} versions={versionPicker.versions} failed={versionPicker.failed}
          busy={busy} t={t} locale={locale} onPick={pickVersion} onClose={() => setVersionPicker(null)} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDowngrade}
        onClose={() => setConfirmDowngrade(null)}
        onConfirm={() => { const d = confirmDowngrade!; setConfirmDowngrade(null); void runUpdate(d.plugin, d.version) }}
        title={t('admin.plugins.downgradeTitle')}
        message={t('admin.plugins.downgradeBody', { from: confirmDowngrade?.plugin.version ?? '', to: confirmDowngrade?.version ?? '' })}
        confirmLabel={t('admin.plugins.downgradeConfirm')}
      />

      {signatureBlock && (
        <SignatureBlockDialog
          data={signatureBlock} entry={regById[signatureBlock.subject.id]} busy={retrusting} t={t}
          onRetrust={(version, publicKey) => confirmRetrust(signatureBlock.subject.id, version, publicKey)}
          onClose={() => setSignatureBlock(null)}
        />
      )}

      {consentQueue[0] && (
        <UpdateConsentDialog
          data={consentQueue[0]} t={t}
          // Prefer the REGISTRY's flag — consent is about the code being installed, not the
          // code running now — but fall back to the installed row's, which the server always
          // sends. Reading only the registry meant an unreachable registry left `regById`
          // empty and the warning silently vanished at the exact moment an admin was widening
          // what unsigned code may do.
          unsigned={
            isRegistrySourced(consentQueue[0].plugin.source_repo) &&
            (regById[consentQueue[0].plugin.id]?.signed ?? consentQueue[0].plugin.signed) === false
          }
          onApprove={async () => {
            const c = consentQueue[0]; setConsentQueue(qq => qq.slice(1))
            // consent:true — the ONLY path that may widen a plugin's granted rights.
            await act(c.plugin.id, () => adminApi.pluginActivate(c.plugin.id, true), t('admin.plugins.updated'))
          }}
          onLater={() => { setConsentQueue(qq => qq.slice(1)); toast.success(t('admin.plugins.updateKeptOff')) }}
        />
      )}

      {depResolve && (
        <DependencyResolveDialog
          data={depResolve} t={t} busy={busy === depResolve.plugin.id} installedIds={installedIds}
          onDownload={(depId, constraint) => resolveDependency(depResolve.plugin, depId, constraint)}
          onClose={() => setDepResolve(null)}
        />
      )}
    </div>
  )
}

function statusLabel(s: StatusFilter, t: T): string {
  return s === 'all' ? t('admin.plugins.allStatuses') : s === 'on' ? t('admin.plugins.status.active')
    : s === 'off' ? t('admin.plugins.stateOff') : s === 'update' ? t('admin.plugins.filterUpdate') : t('admin.plugins.status.error')
}
function sortLabel(s: SortKey, t: T): string {
  return s === 'name' ? t('admin.plugins.sortName')
    : s === 'recent' ? t('admin.plugins.sortRecent')
    : s === 'downloads' ? t('admin.plugins.sortDownloads')
    : t('admin.plugins.sortUpdates')
}

/** An icon action on the card's head band, named by its tooltip. */
function BandButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={SETTINGS_ICON_BUTTON}>
        {children}
      </button>
    </Tooltip>
  )
}

/** "Nothing matches": a faint search glyph over one quiet line. */
function NoMatch({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-10 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-surface-tertiary text-content-faint">
        <Search size={17} />
      </span>
      <SettingsHint>{children}</SettingsHint>
    </div>
  )
}

function SegBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button type="button" onClick={onClick} role="tab" aria-selected={active}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] px-3 py-1.5 font-medium transition-colors ${
        active ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'}`}
      style={fs(12.5, 'body')}>
      {label}
      {count != null && (
        <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 font-geist font-bold tabular-nums ${
          active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-muted'}`} style={fs(10.5)}>{count}</span>
      )}
    </button>
  )
}

/** Re-renders while the page moves under an open, portaled menu, so it stays pinned to its trigger. */
function useFollowTrigger(open: boolean) {
  const [, reanchor] = useState(0)
  useEffect(() => {
    if (!open) return
    const onMove = () => reanchor(n => n + 1)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open])
}

function FilterMenu({ id, label, valueLabel, options, onPick, value, menu, setMenu, icon }: {
  id: string; label: string; valueLabel: string
  options: Array<[string, string]>; onPick: (v: string) => void; value: string
  menu: string | null; setMenu: (v: string | null) => void; icon?: ReactNode
}) {
  const open = menu === id
  const active = value !== options[0]?.[0]
  const btnRef = useRef<HTMLButtonElement>(null)
  // Portaled like the row menu: the card around the toolbar clips what overflows it.
  useFollowTrigger(open)
  return (
    <div className="relative flex-none">
      <button type="button" ref={btnRef} onClick={() => setMenu(open ? null : id)} title={`${label}: ${valueLabel}`} aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] border bg-surface-card px-3 text-content-secondary transition-colors hover:text-content ${
          active ? 'border-[color:var(--text-primary)]' : 'border-edge'}`}
        style={fs(12.5, 'body')}>
        <span className="flex-none text-content-faint">{icon}</span>
        <span>{label}: </span>
        <span className="font-semibold text-content">{valueLabel}</span>
        <ChevronDown size={13} className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div className="min-w-[200px] max-w-[calc(100vw-2rem)]" style={{ ...POPOVER, ...anchorMenu(btnRef.current) }}>
          {options.map(([v, lbl]) => (
            <button type="button" key={v} onClick={() => { onPick(v); setMenu(null) }}
              className={`${MENU_ITEM} ${value === v ? 'font-semibold text-content' : 'text-content-secondary'}`} style={fs(12.5, 'body')}>
              <span className="min-w-0 flex-1 truncate text-left">{lbl}</span>
              <Check size={14} className={`flex-none text-content-muted ${value === v ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

function InstalledRow({ p, t, busy, menu, setMenu, hasUpdate, latestVer, newerIncompatible, blocked, onToggle, onUpdate, onRestart, onChangeVersion, onResume, onReviewBlock, onErrors, onEgress, onSettings, onUninstall }: {
  p: PluginRow; t: T; busy: string | null; menu: string | null; setMenu: (v: string | null) => void
  hasUpdate: boolean; latestVer?: string; newerIncompatible: { version: string; range: string } | null; blocked: boolean
  onToggle: () => void; onUpdate: () => void; onRestart: () => void; onChangeVersion: () => void; onResume: () => void; onReviewBlock: () => void
  onErrors: () => void; onEgress: () => void; onSettings: () => void; onUninstall: () => void
}) {
  const caps = deriveCaps(parseJson<string[]>(p.permissions, []), parseJson<{ widget?: { slot?: string } }>(p.capabilities, {}), t)
  const deps = deriveDeps(p, t)
  const menuOpen = menu === `row:${p.id}`
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const working = busy === p.id
  const on = p.enabled === 1 && p.status !== 'error'

  // The menu is portaled to <body> and positioned `fixed` against the ⋯ button,
  // because the row's ancestor (PageSidebar) is `overflow-hidden` and would clip
  // an in-flow `absolute` menu — losing Delete on the lower rows of a long list.
  // Re-anchor while the page moves under it.
  useFollowTrigger(menuOpen)

  const hostCount = p.egressHostCount ?? 0

  return (
    <div className={`group relative flex items-start gap-3 px-3.5 py-3 transition-colors hover:bg-surface-secondary ${working ? 'opacity-60' : ''}`}>
      <div className="relative mt-0.5 flex-none">
        <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-edge-faint bg-surface-secondary">
          <PluginIcon name={p.icon} size={19} className="text-content-secondary" />
        </span>
        <Tooltip label={t(`admin.plugins.status.${p.status}` as never)}>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface-card ${HEALTH[p.status] || HEALTH.inactive}`} />
        </Tooltip>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate font-semibold tracking-[-.006em] text-content" style={fs(13.5, 'body')}>{p.name}</span>
          {p.version && <span className="font-geist font-medium tabular-nums text-content-faint" style={fs(11)}>v{p.version}</span>}
          {p.reviewed_at && <ReviewedBadge t={t} />}
          {p.source_repo === 'local:upload' && <SideloadedBadge t={t} />}
          {p.source_repo === 'local:link' && <DevLinkBadge t={t} />}
          {/* Registry plugins only — a sideloaded/dev-linked plugin already says something
              strictly stronger, and stacking "Unsigned" on top of it just dilutes the amber. */}
          {isRegistrySourced(p.source_repo) && <TrustBadge signed={!!p.signed} t={t} />}
        </div>
        {p.description && <p className="m-0 mt-0.5 truncate text-content-muted" style={fs(12, 'body')}>{p.description}</p>}
        {/* A refused update leaves a WORKING plugin pinned at its old version — so this is
            its own row state, not an error state, and it persists until it is resolved
            rather than dying with the toast that first reported it. */}
        {blocked && p.updateBlock && (
          <div className={`${ROW_NOTE} text-warning`} style={fs(11.5)}>
            <ShieldAlert size={13} className="flex-none" />
            <span className="truncate">{t('admin.plugins.updateBlocked', { reason: p.updateBlock.detail ?? p.updateBlock.code })}</span>
            <button type="button" onClick={onReviewBlock}
              className="flex-none font-semibold underline underline-offset-2 hover:opacity-80">
              {t('admin.plugins.reviewBlock')}
            </button>
          </div>
        )}
        {/* A newer version this TREK can't run — informational, never a button: the fix
            is a TREK upgrade, so the row must not nag or offer a doomed install. */}
        {newerIncompatible && (
          <div className={`${ROW_NOTE} text-content-faint`} style={fs(11.5)}>
            <Info size={13} className="flex-none" />
            <span className="truncate">{t('admin.plugins.newerNeedsTrek', { version: newerIncompatible.version, range: newerIncompatible.range })}</span>
          </div>
        )}
        {/* Held: the admin deliberately installed a non-latest version, so updates are
            paused rather than nagged — resuming is one click, right where the pause shows. */}
        {p.updateHold && (
          <div className={`${ROW_NOTE} text-content-faint`} style={fs(11.5)}>
            <PauseCircle size={13} className="flex-none" />
            <span className="truncate">{t('admin.plugins.updatesHeld', { version: p.version ?? '' })}</span>
            <button type="button" onClick={onResume} disabled={working}
              className="flex-none font-semibold text-content-secondary underline underline-offset-2 hover:opacity-80 disabled:opacity-50">
              {t('admin.plugins.resumeUpdates')}
            </button>
          </div>
        )}
        {p.status === 'error' && p.last_error ? (
          <div className={`${ROW_NOTE} text-danger`} style={fs(11.5)}>
            <AlertTriangle size={13} className="flex-none" /><span className="truncate">{p.last_error}</span>
          </div>
        ) : (caps.length > 0 || p.operatorEgress) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {caps.map((c, i) => (
              <span key={i} className={`${CHIP} ${c.net ? CHIP_NET : CHIP_NEUTRAL}`} style={fs(11)}>
                <c.icon size={12} className={c.net ? 'text-info' : 'text-content-muted'} /><span className="truncate">{c.label}</span>
              </span>
            ))}
            {/* This plugin talks to a service only the OPERATOR can name (a self-hosted
                Gotify/ntfy), so its manifest can't list the host — the admin adds it.
                Actionable, and warning-toned until at least one host exists, because
                until then the plugin cannot reach anything and looks silently broken. */}
            {p.operatorEgress && (
              <Tooltip label={t('admin.plugins.allowedHosts.hint')}>
                <button type="button" onClick={onEgress}
                  className={`${CHIP} ${hostCount > 0 ? CHIP_NET : CHIP_WARN} hover:opacity-80`} style={fs(11)}>
                  <Globe size={12} />
                  {hostCount > 0
                    ? t('admin.plugins.allowedHosts.count').replace('{n}', String(hostCount))
                    : t('admin.plugins.allowedHosts.add')}
                </button>
              </Tooltip>
            )}
          </div>
        )}
        {deps.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {deps.map((d, i) => (
              <span key={i} className={`${CHIP} ${d.blocked || d.warn ? CHIP_WARN : CHIP_NEUTRAL}`} style={fs(11)}>
                <d.icon size={12} className={d.blocked || d.warn ? 'text-warning' : 'text-content-muted'} /><span className="truncate">{d.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-none items-center gap-2 self-center">
        {hasUpdate && (
          <button type="button" onClick={onUpdate} disabled={working}
            className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 font-semibold text-warning hover:opacity-90 disabled:opacity-50"
            style={fs(11.5)}>
            <ArrowUpCircle size={13} /> <span>{t('admin.plugins.updateTo', { version: latestVer })}</span>
          </button>
        )}
        <span className={`min-w-[42px] text-right font-medium ${on ? 'text-content-secondary' : 'text-content-faint'}`} style={fs(12)}>
          {p.enabled === 1 ? t('admin.plugins.status.active') : t('admin.plugins.stateOff')}
        </span>
        <ToggleSwitch on={p.enabled === 1} label={t('admin.plugins.enabledToggle')} onToggle={onToggle} />
        <div className="relative">
          <Tooltip label={t('admin.table.actions')} disabled={menuOpen}>
            <button type="button" ref={menuBtnRef} data-testid={`plugin-row-menu-btn-${p.id}`} onClick={() => setMenu(menuOpen ? null : `row:${p.id}`)}
              aria-expanded={menuOpen} aria-label={t('admin.table.actions')}
              className={`grid h-8 w-8 place-items-center rounded-[10px] transition-colors ${menuOpen ? 'bg-surface-card text-content shadow-sm ring-1 ring-edge-faint' : 'text-content-faint hover:bg-surface-card hover:text-content'}`}>
              <MoreHorizontal size={17} />
            </button>
          </Tooltip>
          {menuOpen && createPortal(
            <div data-testid={`plugin-row-menu-${p.id}`} style={{ ...POPOVER, ...anchorMenu(menuBtnRef.current) }}
              className="min-w-[200px]">
              {p.enabled === 1 && (
                <MenuItem icon={<RotateCw size={14} />} label={t('admin.plugins.restart')} onClick={onRestart} />
              )}
              {/* A plugin gets the item if it declares scope:'instance' fields OR actions —
                  an action-only plugin still needs the dialog to run its buttons. */}
              {((p.instanceSettingsCount ?? 0) > 0 || (p.instanceActionsCount ?? 0) > 0) && (
                <MenuItem icon={<SlidersHorizontal size={14} />} label={t('admin.plugins.instanceSettings')} onClick={onSettings} />
              )}
              <MenuItem icon={<Bug size={14} />} label={t('admin.plugins.viewErrors')} onClick={onErrors} />
              {/* Only a plugin that DECLARED operatorEgress gets the item — an admin must
                  never be invited to widen egress for a plugin that didn't ask for it
                  (same rule the row's egress chip follows). */}
              {p.operatorEgress && (
                <MenuItem icon={<Globe size={14} />} label={t('admin.plugins.allowedHosts')} onClick={onEgress} />
              )}
              {/* Registry plugins only — a sideload/dev-link has no registry versions to pick from. */}
              {isRegistrySourced(p.source_repo) && (
                <MenuItem icon={<History size={14} />} label={t('admin.plugins.changeVersion')} onClick={onChangeVersion} />
              )}
              {p.source_repo && p.source_repo !== 'local:upload' && p.source_repo !== 'local:link' && (
                <>
                  <a href={`https://github.com/${p.source_repo}`} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}
                    className={`${MENU_ITEM} text-content-secondary`} style={fs(12.5, 'body')}>
                    <span className="flex w-4 flex-none justify-center text-content-muted"><Github size={14} /></span> {t('admin.plugins.sourceRepo')}
                  </a>
                  <a href={`https://github.com/${p.source_repo}/issues`} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}
                    className={`${MENU_ITEM} text-content-secondary`} style={fs(12.5, 'body')}>
                    <span className="flex w-4 flex-none justify-center text-content-muted"><CircleDot size={14} /></span> {t('admin.plugins.reportIssue')}
                  </a>
                </>
              )}
              <div className="mx-1.5 my-1 h-px bg-edge-faint" />
              <MenuItem icon={<Trash2 size={14} />} label={t('common.delete')} danger onClick={onUninstall} />
            </div>,
            document.body,
          )}
        </div>
      </div>
    </div>
  )
}

/** Tallest the ⋯ menu gets (6 items + divider + padding). Drives the flip. */
const ROW_MENU_MAX_H = 260

/** Pin a portaled menu to the right edge of its trigger, flipping up when the bottom is tight. */
function anchorMenu(trigger: HTMLElement | null): CSSProperties {
  const r = trigger?.getBoundingClientRect()
  if (!r) return { position: 'fixed', top: 0, right: 0, zIndex: 100 }
  const spaceBelow = window.innerHeight - r.bottom
  const openUp = spaceBelow < ROW_MENU_MAX_H && r.top > spaceBelow
  return {
    position: 'fixed',
    right: Math.max(8, window.innerWidth - r.right),
    ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    zIndex: 100,
  }
}

/** One entry of a popover menu, in the packing popovers' shape. */
const MENU_ITEM = 'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 font-medium transition-colors hover:bg-surface-tertiary'

function MenuItem({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`${MENU_ITEM} ${danger ? 'text-danger hover:bg-danger-soft' : 'text-content-secondary'}`} style={fs(12.5, 'body')}>
      <span className={`flex w-4 flex-none justify-center ${danger ? 'text-danger' : 'text-content-muted'}`}>{icon}</span> {label}
    </button>
  )
}

function Screenshot({ url, className, iconSize = 28 }: { url: string | null; className: string; iconSize?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`overflow-hidden bg-surface-tertiary ${className}`}>
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-surface-tertiary to-surface-secondary">
          <Blocks size={iconSize} className="text-content-faint" />
        </div>
      )}
    </div>
  )
}

function RegistryGrid({ items, onInstall, onOpenDetail, busy, t, installedIds, filtered, ignoreTrekRange }: {
  items: RegistryItem[] | null
  onInstall: (id: string, version?: string, warn?: RangeWarning) => void
  onOpenDetail: (item: RegistryItem) => void
  busy: string | null
  t: T
  installedIds: Set<string>
  filtered: boolean
  ignoreTrekRange: boolean
}) {
  if (!items) return (
    <div className="flex items-center justify-center gap-2 py-12 text-content-faint" style={fs(12.5, 'body')}>
      <Loader2 size={15} className="animate-spin" />{t('common.loading')}
    </div>
  )
  if (items.length === 0) return <NoMatch>{filtered ? t('admin.plugins.noMatchRegistry') : t('admin.plugins.registryEmpty')}</NoMatch>
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(item => {
        const installed = installedIds.has(item.id)
        const offer = installOffer(item, t, ignoreTrekRange)
        return (
          <div key={item.id} role="button" tabIndex={0} onClick={() => onOpenDetail(item)}
            // No press-scale on the card: shrinking it mid-click slides the Install
            // button out from under the pointer, so the click retargets onto the card
            // and opens the detail modal instead of installing (#2158).
            data-no-press
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(item) } }}
            className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[14px] border border-edge-faint bg-surface-card shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]">
            <div className="relative">
              <Screenshot url={item.screenshotUrl} className="aspect-[16/10]" iconSize={24} />
              {item.reviewedAt && (
                <span className="absolute right-2.5 top-2.5">
                  <StatusPill icon={<ShieldCheck size={11} className="text-success" />}>{t('admin.plugins.reviewed')}</StatusPill>
                </span>
              )}
              <span className="absolute -bottom-4 left-3.5 z-[1] grid h-10 w-10 place-items-center rounded-[12px] border border-edge-faint bg-surface-card shadow-sm">
                <PluginIcon name={item.icon} size={20} className="text-content-secondary" />
              </span>
            </div>
            <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-6">
              <span className="truncate font-semibold tracking-[-.006em] text-content" style={fs(13.5, 'body')}>{item.name}</span>
              <span className="mt-0.5 truncate text-content-faint" style={fs(11.5)}>{item.author}</span>
              <p className="m-0 mt-2 line-clamp-2 flex-1 text-content-muted" style={fs(12, 'body')}>{item.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <TypeBadge type={item.type} t={t} />
                {/* Everything in Discover is registry-sourced, so the badge always applies. */}
                <TrustBadge signed={!!item.signed} t={t} />
                {item.latest && <span className="font-geist tabular-nums text-content-faint" style={fs(10.5)}>v{item.latest}</span>}
                {typeof item.downloadCount === 'number' && item.downloadCount > 0 && (
                  <Tooltip label={t('admin.plugins.downloads')}>
                    <span className="inline-flex items-center gap-1 font-geist tabular-nums text-content-faint" style={fs(10.5)}>
                      <Download size={11} /> {formatCompactCount(item.downloadCount)}
                    </span>
                  </Tooltip>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={e => { e.stopPropagation(); onInstall(item.id, offer.version, offer.warn) }}
                  disabled={busy === item.id || installed || offer.blocked}
                  title={installed ? undefined : offer.title}
                  className={SMALL_PRIMARY} style={fs(12, 'body')}>
                  {installed ? t('admin.plugins.installed') : offer.label}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 1234 -> "1.2k" — GitHub-style compact download counts for the browse cards.
// The M threshold sits at the k-rounding boundary so 999 950 is "1M", not "1000k".
function formatCompactCount(n: number): string {
  if (n >= 999_500) return `${Math.round(n / 100_000) / 10}M`
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`
  return String(n)
}

// A permission rendered human-readable when known, else as its raw code.
function PermLabel({ perm, t }: { perm: string; t: T }) {
  return PERM_KEYS.includes(perm)
    ? <span>{t(`admin.plugins.perm.${perm}` as never)}</span>
    : <code className="rounded-[6px] bg-surface-tertiary px-1.5 py-0.5 font-mono text-content-secondary" style={fs(11)}>{perm}</code>
}

/** A white box of short lines between hairlines, for the lists inside a dialog. */
function DialogList({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-none divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card p-0">{children}</ul>
}

/** One line of a DialogList: an icon, what it is, and room for an action on the right. */
function DialogListItem({ icon, children, trailing }: { icon?: ReactNode; children: ReactNode; trailing?: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 px-3.5 py-2.5">
      {icon && <span className="mt-0.5 flex w-4 flex-none justify-center text-content-muted">{icon}</span>}
      <div className="min-w-0 flex-1 text-content-secondary" style={fs(13, 'body')}>{children}</div>
      {trailing && <div className="flex flex-none items-center self-center">{trailing}</div>}
    </li>
  )
}

/** A warning line inside a dialog body: a soft amber box with its icon. */
function WarnNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-2 rounded-[12px] bg-warning-soft px-3.5 py-2.5 leading-snug text-warning" style={fs(12, 'body')}>
      <span className="mt-[1px] flex-none">{icon}</span><span className="min-w-0">{children}</span>
    </p>
  )
}

/** A raised tile for a dialog's head band. */
function Tile({ children, warn }: { children: ReactNode; warn?: boolean }) {
  return <DialogTile><span className={warn ? 'text-warning' : 'text-content-secondary'}>{children}</span></DialogTile>
}

/**
 * The TREK_PLUGINS_IGNORE_TREK_RANGE warning (copy and modes from useRangeBypass). Its own
 * component rather than ConfirmDialog because the notice mode has no cancel button.
 */
function RangeBypassDialog({ copy: { title, body, confirm }, onConfirm, onClose, t }: {
  copy: { title: string; body: string; confirm: boolean }; onConfirm: () => void; onClose: () => void; t: T
}) {
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-range-bypass-title"
      width="narrow"
      header={<DialogHeader tile={<Tile warn><AlertTriangle size={20} /></Tile>} tint={WARN_TINT} labelId="plugin-range-bypass-title" title={title} onClose={onClose} />}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          {confirm ? (
            <>
              <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
              <DialogButton variant="primary" onClick={onConfirm}>{t('admin.plugins.installAnyway')}</DialogButton>
            </>
          ) : (
            <DialogButton variant="primary" onClick={onClose}>{t('common.ok')}</DialogButton>
          )}
        </DialogFooter>
      )}
    >
      <p className="m-0 leading-relaxed text-content-secondary" style={fs(13.5, 'body')}>{body}</p>
    </DialogShell>
  )
}

/** What the runtime recorded for one plugin, newest as the server sends them. */
function ErrorLogDialog({ id, rows, t, onClose }: {
  id: string; rows: Array<{ ts: string; level: string; message: string }>; t: T; onClose: () => void
}) {
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-error-log-title"
      width="editor"
      header={<DialogHeader tile={<Tile><Bug size={20} /></Tile>} tint={NEUTRAL_TINT} labelId="plugin-error-log-title" title={`${id} — ${t('admin.plugins.errorLog')}`} onClose={onClose} />}
    >
      {rows.length === 0 ? (
        <SettingsHint className="py-6 text-center">{t('admin.plugins.noErrors')}</SettingsHint>
      ) : (
        <div className="divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-secondary">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2.5 px-3.5 py-2 font-mono" style={fs(11.5)}>
              <span className={`flex-none font-semibold ${r.level === 'error' ? 'text-danger' : 'text-warning'}`}>{r.level}</span>
              <span className="flex-none text-content-faint">{r.ts}</span>
              <span className="min-w-0 break-all text-content-muted">{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </DialogShell>
  )
}

/** The hosts an operatorEgress plugin may reach, added by the admin. Saving restarts it. */
function EgressDialog({ data, draft, setDraft, saving, error, onSave, onClose, t }: {
  data: { id: string; supported: boolean; hosts: string[] }
  draft: string; setDraft: (v: string) => void; saving: boolean; error: string
  onSave: (hosts: string[]) => void; onClose: () => void; t: T
}) {
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-egress-title"
      width="narrow"
      header={<DialogHeader tile={<Tile><Globe size={20} /></Tile>} tint={NEUTRAL_TINT} labelId="plugin-egress-title" title={`${data.id} — ${t('admin.plugins.allowedHosts')}`} onClose={onClose} />}
    >
      {!data.supported ? (
        <SettingsHint>{t('admin.plugins.allowedHosts.unsupported')}</SettingsHint>
      ) : (
        <>
          <SettingsHint>{t('admin.plugins.allowedHosts.hint')}</SettingsHint>
          {data.hosts.length === 0 ? (
            <p className="m-0 rounded-[12px] border border-dashed border-edge px-3.5 py-3 text-center italic text-content-faint" style={fs(12.5, 'body')}>
              {t('admin.plugins.allowedHosts.none')}
            </p>
          ) : (
            <DialogList>
              {data.hosts.map(h => (
                <DialogListItem key={h} icon={<Globe size={14} />}
                  trailing={(
                    <Tooltip label={t('common.delete')}>
                      <button type="button" disabled={saving} onClick={() => onSave(data.hosts.filter(x => x !== h))}
                        aria-label={t('common.delete')}
                        className="grid h-8 w-8 place-items-center rounded-[9px] text-content-faint hover:bg-danger-soft hover:text-danger disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  )}>
                  <span className="break-all font-mono text-content">{h}</span>
                </DialogListItem>
              ))}
            </DialogList>
          )}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="gotify.example.com"
              aria-label={t('admin.plugins.allowedHosts.add')}
              className={`${INPUT} flex-1 font-mono`}
            />
            <button type="button" disabled={saving || !draft.trim()} onClick={() => onSave([...data.hosts, draft.trim()])}
              className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
              {t('common.add')}
            </button>
          </div>
          {error && <p className="m-0 text-danger" style={fs(12)}>{error}</p>}
          <SettingsHint>{t('admin.plugins.allowedHosts.restartNote')}</SettingsHint>
        </>
      )}
    </DialogShell>
  )
}

/** Folds each run of consecutive checkbox fields into one array, keeping the field order. */
function groupToggles<F extends { input_type?: string }>(fields: F[]): Array<F | F[]> {
  const out: Array<F | F[]> = []
  for (const f of fields) {
    const last = out[out.length - 1]
    if (f.input_type !== 'checkbox') out.push(f)
    else if (Array.isArray(last)) last.push(f)
    else out.push([f])
  }
  return out
}

/** The admin-owned scope:'instance' fields and actions of one plugin (logic in useInstanceSettings). */
function InstanceSettingsDialog({ settings, t }: { settings: ReturnType<typeof useInstanceSettings>; t: T }) {
  const form = settings.form
  if (!form) return null
  const fieldLabel = (f: { key: string; label?: string; required?: boolean }) => (
    <>{f.label || f.key}{f.required && <span className="text-danger"> *</span>}</>
  )
  return (
    <DialogShell
      onClose={settings.close}
      labelledBy="plugin-instance-settings-title"
      width="narrow"
      blocked={settings.pendingAction !== null}
      header={<DialogHeader tile={<Tile><SlidersHorizontal size={20} /></Tile>} tint={NEUTRAL_TINT} labelId="plugin-instance-settings-title" title={`${form.id} — ${t('admin.plugins.instanceSettings')}`} onClose={settings.close} />}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={settings.close}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" disabled={settings.saving || settings.runningAction !== null} onClick={() => void settings.save()}>
            {settings.saving && <Loader2 size={14} className="animate-spin" />}{t('common.save')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {groupToggles(form.fields).map(f => {
        if (Array.isArray(f)) {
          // A run of consecutive checkbox fields shares one box of toggle rows.
          return (
            <SettingRows key={f[0].key}>
              {f.map(c => (
                <SettingRow key={c.key} label={fieldLabel(c)} hint={c.hint || undefined}
                  control={<ToggleSwitch on={form.values[c.key] === true} label={c.label || c.key} onToggle={() => settings.setValue(c.key, form.values[c.key] !== true)} />} />
              ))}
            </SettingRows>
          )
        }
        const inputId = `plugin-setting-${f.key}`
        if (f.input_type === 'select' && f.options) {
          return (
            <EditorField key={f.key} label={fieldLabel(f)} htmlFor={inputId} hint={f.hint || undefined}>
              <CustomSelect id={inputId} value={String(form.values[f.key] ?? '')} onChange={v => settings.setValue(f.key, String(v))}
                options={[{ value: '', label: '—' }, ...f.options.map(o => ({ value: o.value, label: o.label }))]} />
            </EditorField>
          )
        }
        return (
          <EditorField key={f.key} label={fieldLabel(f)} htmlFor={inputId} hint={f.hint || undefined}>
            <input
              id={inputId}
              type={f.secret ? 'password' : (f.input_type === 'number' ? 'number' : 'text')}
              value={String(form.values[f.key] ?? '')}
              placeholder={f.placeholder || ''}
              autoComplete={f.secret ? 'new-password' : 'off'}
              onChange={e => settings.setValue(f.key, e.target.value)}
              className={INPUT}
            />
          </EditorField>
        )
      })}
      {form.actions.length > 0 && (
        <DialogSection label={t('admin.plugins.actions')}>
          {!form.active && <SettingsHint className="mb-2">{t('admin.plugins.actions.inactive')}</SettingsHint>}
          <SettingRows>
            {form.actions.map(a => {
              const res = settings.actionResult[a.key]
              return (
                <div key={a.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-3">
                  <button type="button"
                    onClick={() => settings.runAction(a)}
                    disabled={!form.active || settings.runningAction !== null || settings.saving}
                    className={`${SMALL_BUTTON} ${a.danger ? 'text-danger' : ''}`} style={fs(12.5, 'body')}>
                    {settings.runningAction === a.key && <Loader2 size={14} className="animate-spin" />}
                    {a.label}
                  </button>
                  {a.hint && <span className="min-w-0 flex-1 text-content-faint" style={fs(11.5)}>{a.hint}</span>}
                  {res && (
                    <span aria-live="polite" className={`font-medium ${res.ok ? 'text-success' : 'text-danger'}`} style={fs(11.5)}>
                      {res.message || (res.ok ? t('common.success') : t('common.error'))}
                    </span>
                  )}
                </div>
              )
            })}
          </SettingRows>
        </DialogSection>
      )}
      {settings.error && <p className="m-0 text-danger" style={fs(12)}>{settings.error}</p>}
    </DialogShell>
  )
}

function PluginDetailModal({ item, installed, busy, onInstall, onClose, t, locale, ignoreTrekRange, blocked }: {
  item: RegistryItem; installed: boolean; busy: string | null; ignoreTrekRange: boolean; blocked: boolean
  onInstall: (id: string, version?: string, warn?: RangeWarning) => void; onClose: () => void; t: T; locale: string
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
  const permissions = manifest?.permissions ?? []
  const egress = manifest?.egress ?? []
  const settings = manifest?.settings ?? []
  const caps = manifest ? deriveCaps(permissions, manifest.capabilities ?? {}, t) : []
  const repoUrl = `https://github.com/${item.repo}`
  const homepage = item.homepage && /^https?:\/\//i.test(item.homepage) && item.homepage !== repoUrl ? item.homepage : null
  const sizeKb = detail?.size ? Math.max(1, Math.round(detail.size / 1024)) : null
  // The detail fetch carries the same compat verdict as the browse list; prefer it once
  // it lands (it is keyed to the same entry) and fall back to the grid item until then.
  const offer = installOffer(detail ?? item, t, ignoreTrekRange)
  const access = caps.filter(c => !c.net)
  const linkClass = SETTINGS_ICON_BUTTON

  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-detail-title"
      width="detail"
      blocked={blocked}
      header={(
        <DialogHeader
          tile={<Tile><PluginIcon name={manifest?.icon ?? item.icon ?? null} size={22} /></Tile>}
          tint={NEUTRAL_TINT}
          labelId="plugin-detail-title"
          title={item.name}
          sub={`${item.author}${item.latest ? ` · v${item.latest}` : ''}`}
          pills={(
            <>
              <TypeBadge type={item.type} t={t} />
              <TrustBadge signed={!!item.signed} t={t} />
              {item.reviewedAt && <StatusPill tone="success" icon={<ShieldCheck size={11} />}>{t('admin.plugins.reviewed')}</StatusPill>}
            </>
          )}
          onClose={onClose}
        />
      )}
      footer={(
        <DialogFooter>
          <Tooltip label={t('admin.plugins.sourceRepo')}>
            <a href={repoUrl} target="_blank" rel="noreferrer" aria-label={t('admin.plugins.sourceRepo')} className={linkClass}><Github size={15} /></a>
          </Tooltip>
          <Tooltip label={t('admin.plugins.reportIssue')}>
            <a href={`${repoUrl}/issues`} target="_blank" rel="noreferrer" aria-label={t('admin.plugins.reportIssue')} className={linkClass}><CircleDot size={15} /></a>
          </Tooltip>
          {homepage && (
            <Tooltip label={t('admin.plugins.homepage')}>
              <a href={homepage} target="_blank" rel="noreferrer" aria-label={t('admin.plugins.homepage')} className={linkClass}><ExternalLink size={15} /></a>
            </Tooltip>
          )}
          <FooterSpacer />
          <DialogButton variant="primary" onClick={() => onInstall(item.id, offer.version, offer.warn)}
            disabled={busy === item.id || installed || offer.blocked}
            title={installed ? undefined : offer.title}>
            {busy === item.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {installed ? t('admin.plugins.installed') : offer.label}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {item.screenshotUrl && <Screenshot url={item.screenshotUrl} className="aspect-[16/9] w-full flex-none rounded-[14px] border border-edge-faint" iconSize={32} />}

      <div className="flex flex-col gap-3">
        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13.5, 'body')}>{item.description}</p>
        {failed && <p className="m-0 text-danger" style={fs(12)}>{t('admin.plugins.detailError')}</p>}
        {/* The reason the button is blocked (or offering an older version) — a tooltip
            alone would leave a touch user with a dead button and no explanation. */}
        {offer.title && !installed && <WarnNote icon={<AlertTriangle size={13} />}>{offer.title}</WarnNote>}
      </div>

      {!detail && !failed && (
        <div className="flex items-center gap-2 text-content-faint" style={fs(12.5, 'body')}>
          <Loader2 size={14} className="animate-spin" />{t('common.loading')}
        </div>
      )}

      {manifest && (
        <DialogSection label={t('admin.plugins.accessTitle')}>
          {access.length === 0 && !permissions.includes('db:own') ? (
            <SettingsHint>{t('admin.plugins.noAccess')}</SettingsHint>
          ) : (
            <DialogList>
              {access.map((c, i) => (
                <DialogListItem key={i} icon={<c.icon size={14} />}><span>{c.label}</span></DialogListItem>
              ))}
              {permissions.includes('db:own') && (
                <DialogListItem icon={<Database size={14} />}><span>{t('admin.plugins.perm.db:own')}</span></DialogListItem>
              )}
            </DialogList>
          )}
        </DialogSection>
      )}

      {/* The tool text a plugin publishes goes straight into every user's
          assistant context once mcp:tools is granted, and nothing else in
          this dialog shows it. An admin approving the grant should read the
          names and descriptions first, not discover them in a chat. */}
      {manifest && (manifest.capabilities?.mcpTools?.length ?? 0) > 0 && (
        <DialogSection label={t('admin.plugins.mcpToolsTitle')}>
          <DialogList>
            {(manifest.capabilities?.mcpTools ?? []).map(tool => (
              <DialogListItem key={tool.name} icon={<Bot size={14} />}>
                <code className="font-mono text-content" style={fs(12)}>{tool.name}</code>
                {tool.title && <p className="m-0 font-medium leading-snug text-content" style={fs(12.5, 'body')}>{tool.title}</p>}
                {/* The description is the assistant-facing text: it is what the
                    model reads to decide whether to call the tool, so it is the
                    line an admin most needs to see. Never hidden behind a title. */}
                <p className="m-0 leading-snug text-content-secondary" style={fs(12.5, 'body')}>{tool.description}</p>
              </DialogListItem>
            ))}
          </DialogList>
          <SettingsHint className="mt-2">{t('admin.plugins.mcpToolsHint')}</SettingsHint>
        </DialogSection>
      )}

      <PluginPoiCategoryList pluginId={item.id} permissions={permissions} categories={manifest?.capabilities?.poiCategories}
        titleClassName={`${EYEBROW} text-[length:calc(9.5px*var(--fs-scale-caption,1))]`}
        itemClassName="text-content-secondary text-[length:calc(13px*var(--fs-scale-body,1))]" />

      {manifest && (egress.length > 0 || manifest.operatorEgress) && (
        <DialogSection label={t('admin.plugins.connectsTitle')}>
          <div className="flex flex-wrap items-center gap-1.5">
            {egress.map(h => (
              <code key={h} className="rounded-full bg-info-soft px-2.5 py-1 font-mono text-info" style={fs(11.5)}>{h}</code>
            ))}
            {/* The hosts above are NOT the whole story for this plugin: it talks to a
                service only the operator can name, so its reach is whatever an admin
                adds after install. Say so HERE — this is the pre-install review, and a
                reviewer who reads only the host list would otherwise be misled. */}
            {manifest.operatorEgress && (
              <StatusPill tone="warning" icon={<Globe size={11} />}>{t('admin.plugins.operatorEgressPill')}</StatusPill>
            )}
          </div>
          {manifest.operatorEgress && <SettingsHint className="mt-2">{t('admin.plugins.operatorEgressHint')}</SettingsHint>}
        </DialogSection>
      )}

      {manifest && settings.length > 0 && (
        <DialogSection label={t('admin.plugins.setupTitle')}>
          <DialogList>
            {settings.map(s => (
              <DialogListItem key={s.key}
                trailing={(
                  <span className="flex items-center gap-1.5">
                    <StatusPill>{t(`admin.plugins.scope.${s.scope}` as never)}</StatusPill>
                    {s.required && <StatusPill tone="warning">{t('admin.plugins.fieldRequired')}</StatusPill>}
                  </span>
                )}>
                <span className="font-medium text-content">{s.label}</span>
              </DialogListItem>
            ))}
          </DialogList>
        </DialogSection>
      )}

      <DialogSection label={t('admin.plugins.detailsTitle')}>
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          {item.latest && <Meta k={t('admin.plugins.metaVersion')} v={`v${item.latest}`} />}
          {sizeKb !== null && <Meta k={t('admin.plugins.metaSize')} v={`${sizeKb} KB`} />}
          {/* The range, not just its lower bound: "TREK 3.2.0+" reads as "and anything
              newer", which is exactly the claim a `<4.0.0` upper bound denies. */}
          {(item.trek || item.minTrekVersion) && (
            <Meta k={t('admin.plugins.metaRequires')} v={item.trek ? `TREK ${item.trek}` : `TREK ${item.minTrekVersion}+`} />
          )}
          {item.reviewedAt && <Meta k={t('admin.plugins.metaReviewed')} v={new Date(item.reviewedAt).toLocaleDateString(locale)} />}
          {typeof item.downloadCount === 'number' && item.downloadCount > 0 && (
            <Meta k={t('admin.plugins.downloads')} v={item.downloadCount.toLocaleString(locale)} />
          )}
        </div>
      </DialogSection>

      {/* Every published version, installable individually. The compat verdict per
          version is SERVER-computed — an incompatible one is explained, never offered. */}
      {(detail?.versions?.length ?? 0) > 1 && (
        <DialogSection label={t('admin.plugins.versionsTitle')}>
          <DialogList>
            {detail!.versions!.map(v => (
              <DialogListItem key={v.version}
                trailing={v.compatible ? (
                  !installed && (
                    <button type="button" onClick={() => onInstall(item.id, v.version)} disabled={busy === item.id}
                      className={SMALL_BUTTON} style={fs(11.5, 'body')}>
                      {t('admin.plugins.installCompatible', { version: v.version })}
                    </button>
                  )
                ) : (
                  <span className="text-content-faint" style={fs(11.5)}>{t('admin.plugins.versionNeedsTrek', { range: v.trek ?? '' })}</span>
                )}>
                <VersionLine v={v} locale={locale} />
              </DialogListItem>
            ))}
          </DialogList>
        </DialogSection>
      )}
    </DialogShell>
  )
}

/** A version number with its date and, when the author signed it, a quiet tick. */
function VersionLine({ v, locale }: { v: VersionInfo; locale: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      <span className={`font-geist font-semibold tabular-nums ${v.compatible ? 'text-content' : 'text-content-faint'}`} style={fs(12.5)}>v{v.version}</span>
      {v.publishedAt && <span className="text-content-faint" style={fs(11.5)}>{new Date(v.publishedAt).toLocaleDateString(locale)}</span>}
      {v.signed && <ShieldCheck size={13} className="flex-none text-success" />}
    </span>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-edge-faint bg-surface-card px-3 py-2.5">
      <div className={EYEBROW} style={fs(9.5)}>{k}</div>
      <div className="mt-1 truncate font-medium tabular-nums text-content" style={fs(13, 'body')}>{v}</div>
    </div>
  )
}

/**
 * "Change version…" for an INSTALLED plugin. Rows render the server's per-version compat
 * verdict: the installed version is marked, a compatible one gets a Switch action (the
 * caller routes a DOWNGRADE through the data-risk confirm), an incompatible one is
 * explained and never offered.
 */
function VersionPickerDialog({ plugin, versions, failed, busy, t, locale, onPick, onClose }: {
  plugin: PluginRow; versions: VersionInfo[] | null; failed: boolean; busy: string | null
  t: T; locale: string; onPick: (version: string) => void; onClose: () => void
}) {
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-version-picker-title"
      width="narrow"
      header={<DialogHeader tile={<Tile><History size={20} /></Tile>} tint={NEUTRAL_TINT} labelId="plugin-version-picker-title" title={t('admin.plugins.versionPickerTitle', { name: plugin.name })} onClose={onClose} />}
    >
      {failed && <p className="m-0 text-danger" style={fs(12)}>{t('admin.plugins.detailError')}</p>}
      {!failed && !versions && (
        <div className="flex items-center gap-2 text-content-faint" style={fs(12.5, 'body')}>
          <Loader2 size={14} className="animate-spin" />{t('common.loading')}
        </div>
      )}
      {versions?.length === 0 && <SettingsHint>{t('admin.plugins.noVersions')}</SettingsHint>}
      {versions && versions.length > 0 && (
        <SettingRows>
          {versions.map(v => {
            const current = v.version === plugin.version
            return (
              <div key={v.version} data-testid={`version-row-${v.version}`} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1"><VersionLine v={v} locale={locale} /></div>
                {current ? (
                  <StatusPill tone="success" icon={<Check size={11} />}>{t('admin.plugins.installed')}</StatusPill>
                ) : v.compatible ? (
                  <button type="button" onClick={() => onPick(v.version)} disabled={busy === plugin.id}
                    className={SMALL_BUTTON} style={fs(11.5, 'body')}>
                    {t('admin.plugins.versionSwitch', { version: v.version })}
                  </button>
                ) : (
                  <span className="flex-none text-content-faint" style={fs(11.5)}>{t('admin.plugins.versionNeedsTrek', { range: v.trek ?? '' })}</span>
                )}
              </div>
            )
          })}
        </SettingRows>
      )}
    </DialogShell>
  )
}

/**
 * A signature check refused an install/update.
 *
 * The override lives here, and it is scoped to exactly one code. A rotated key has a
 * benign explanation — the author rotated it, or lost it and made a new one. A signature
 * that does NOT verify does not: it means the bytes are not what the author signed, which
 * is corruption or an attack, and there is no story where the right answer is "let the
 * admin wave it through". So SIGNATURE_INVALID / _MISSING / _INCOMPLETE get a clear
 * explanation and no override button AT ALL — not a disabled one, not one behind a
 * confirm. The absence of an escape hatch is the feature.
 *
 * (The server enforces this too — it re-derives the condition and refuses anything but a
 * changed key. This dialog is the convenience, not the control.)
 */
function SignatureBlockDialog({ data, entry, busy, t, onRetrust, onClose }: {
  data: { subject: SigSubject; code: string; detail: string | null }
  entry: RegistryItem | undefined
  busy: boolean; t: T
  onRetrust: (version: string, publicKey: string) => void
  onClose: () => void
}) {
  const canRetrust = data.code === RETRUSTABLE
  const newKey = entry?.authorPublicKey ?? null
  const version = entry?.latest ?? null
  // Only offer the override when we actually hold the new key + version to send: the
  // request carries both, and the server compares the key exactly.
  const offerRetrust = canRetrust && !!newKey && !!version

  const bodyKey = data.code === RETRUSTABLE ? 'admin.plugins.sig.keyChangedBody'
    : data.code === 'SIGNATURE_MISSING' ? 'admin.plugins.sig.missingBody'
    : data.code === 'SIGNATURE_INCOMPLETE' ? 'admin.plugins.sig.incompleteBody'
    : 'admin.plugins.sig.invalidBody'

  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-signature-title"
      width="narrow"
      header={<DialogHeader tile={<Tile warn><ShieldAlert size={20} /></Tile>} tint={WARN_TINT} labelId="plugin-signature-title" title={t('admin.plugins.sig.title', { name: data.subject.name })} onClose={onClose} />}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{offerRetrust ? t('admin.plugins.sig.cancel') : t('common.close')}</DialogButton>
          {offerRetrust && (
            <DialogButton variant="primary" onClick={() => onRetrust(version, newKey)} disabled={busy}>
              {busy && <Loader2 size={14} className="animate-spin" />}{t('admin.plugins.sig.retrustConfirm')}
            </DialogButton>
          )}
        </DialogFooter>
      )}
    >
      <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>{t(bodyKey as never)}</p>
      {/* Fingerprints, not full keys: these exist to be COMPARED by a human — read the
          new one back to the author over the phone. The full key travels in the request. */}
      {canRetrust && (
        <div className="flex flex-col gap-2">
          <SettingRows>
            <KeyRow label={t('admin.plugins.sig.pinnedKey')} value={data.subject.keyFingerprint ?? '—'} />
            <KeyRow label={t('admin.plugins.sig.newKey')} value={fingerprint(newKey) ?? '—'} highlight />
          </SettingRows>
          <SettingsHint>{t('admin.plugins.sig.confirmOutOfBand')}</SettingsHint>
        </div>
      )}
      {!canRetrust && data.detail && (
        <p className="m-0 break-all rounded-[12px] border border-edge-faint bg-surface-tertiary px-3.5 py-2.5 font-mono text-content-muted" style={fs(11.5)}>{data.detail}</p>
      )}
    </DialogShell>
  )
}

function KeyRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span className="flex-none text-content-muted" style={fs(12)}>{label}</span>
      <code className={`min-w-0 break-all text-right font-mono ${highlight ? 'font-semibold text-warning' : 'text-content'}`} style={fs(12)}>{value}</code>
    </div>
  )
}

/** Client-side twin of the server's fingerprint: head…tail of the base64 payload. Display
 * only — every equality check that matters happens server-side against the full key. */
function fingerprint(key: string | null): string | null {
  if (!key) return null
  const payload = key.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('untrusted comment')).pop()
  if (!payload) return null
  return payload.length <= 20 ? payload : `${payload.slice(0, 8)}…${payload.slice(-8)}`
}

function UpdateConsentDialog({ data, unsigned, t, onApprove, onLater }: {
  data: { plugin: PluginRow; version: string; newPermissions: string[]; newEgress: string[] }
  unsigned: boolean
  t: T; onApprove: () => void; onLater: () => void
}) {
  return (
    <DialogShell
      onClose={onLater}
      labelledBy="plugin-consent-title"
      width="narrow"
      header={(
        <DialogHeader tile={<Tile warn><ShieldCheck size={20} /></Tile>} tint={WARN_TINT} labelId="plugin-consent-title"
          title={t('admin.plugins.updateConsentTitle')}
          sub={t('admin.plugins.updateConsentBody', { name: data.plugin.name, version: data.version })} subWraps
          onClose={onLater} />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onLater}>{t('admin.plugins.updateLater')}</DialogButton>
          <DialogButton variant="primary" onClick={onApprove}>{t('admin.plugins.updateApprove')}</DialogButton>
        </DialogFooter>
      )}
    >
      {/* The admin is about to widen what this code may do — so say, right here, that
          nothing ties this code to its author. One line, no checkbox, no extra click:
          this informs, it does not block. */}
      {unsigned && <WarnNote icon={<ShieldAlert size={13} />}>{t('admin.plugins.sig.consentUnsigned')}</WarnNote>}
      {data.newPermissions.length > 0 && (
        <DialogSection label={t('admin.plugins.updateNewPermissions')}>
          <DialogList>
            {data.newPermissions.map(perm => (
              <DialogListItem key={perm} icon={<Check size={14} className="text-warning" />}><PermLabel perm={perm} t={t} /></DialogListItem>
            ))}
          </DialogList>
        </DialogSection>
      )}
      {data.newEgress.length > 0 && (
        <DialogSection label={t('admin.plugins.updateNewEgress')}>
          <div className="flex flex-wrap gap-1.5">
            {data.newEgress.map(host => (
              <code key={host} className="rounded-full bg-info-soft px-2.5 py-1 font-mono text-info" style={fs(11.5)}>{host}</code>
            ))}
          </div>
        </DialogSection>
      )}
    </DialogShell>
  )
}

// Shown when enabling a plugin is blocked by missing/outdated plugin dependencies.
// Each dependency gets a one-click download (latest version satisfying its range,
// transitively) that then retries enabling the plugin.
function DependencyResolveDialog({ data, t, busy, installedIds, onDownload, onClose }: {
  data: { plugin: PluginRow; missing: PluginDep[]; versionMismatch: VersionMismatch[] }
  t: T; busy: boolean; installedIds: Set<string>
  onDownload: (depId: string, constraint?: string) => void; onClose: () => void
}) {
  const rows: Array<{ id: string; constraint: string; installed?: string }> = [
    ...data.missing.map(d => ({ id: d.id, constraint: d.version })),
    ...data.versionMismatch.map(d => ({ id: d.id, constraint: d.wanted, installed: d.installed })),
  ]
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-deps-title"
      width="narrow"
      header={(
        <DialogHeader tile={<Tile warn><Puzzle size={20} /></Tile>} tint={WARN_TINT} labelId="plugin-deps-title"
          title={t('admin.plugins.dep.resolveTitle')}
          sub={t('admin.plugins.dep.resolveBody', { name: data.plugin.name })} subWraps
          onClose={onClose} />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
        </DialogFooter>
      )}
    >
      <SettingRows className={busy ? 'opacity-60' : ''}>
        {rows.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-3.5 py-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] border border-edge-faint bg-surface-secondary text-content-muted">
              <Puzzle size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-content" style={fs(13, 'body')}>{r.id}</div>
              <div className="mt-0.5 font-geist tabular-nums text-content-muted" style={fs(11.5)}>
                {r.installed
                  ? t('admin.plugins.dep.mismatch', { wanted: r.constraint, installed: r.installed })
                  : t('admin.plugins.dep.requires', { version: r.constraint })}
              </div>
            </div>
            <button type="button" onClick={() => onDownload(r.id, r.constraint)} disabled={busy}
              className={SMALL_PRIMARY} style={fs(12, 'body')}>
              <Download size={13} /> {r.installed ? t('admin.plugins.dep.update') : t('admin.plugins.dep.download')}
            </button>
          </div>
        ))}
      </SettingRows>
      {rows.some(r => !installedIds.has(r.id)) && <SettingsHint>{t('admin.plugins.dep.resolveHint')}</SettingsHint>}
    </DialogShell>
  )
}

// Footer: a plain-language note on what "Reviewed" means, plus a collapsible
// panel that lays out how plugins are contained, the limits, and the worst case.
function SecurityInfo({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const sections: Array<[string, string]> = [
    ['admin.plugins.security.isolationTitle', 'admin.plugins.security.isolationBody'],
    ['admin.plugins.security.permsTitle', 'admin.plugins.security.permsBody'],
    ['admin.plugins.security.limitsTitle', 'admin.plugins.security.limitsBody'],
    ['admin.plugins.security.worstTitle', 'admin.plugins.security.worstBody'],
    ['admin.plugins.security.reviewedTitle', 'admin.plugins.security.reviewedBody'],
    ['admin.plugins.security.signedTitle', 'admin.plugins.security.signedBody'],
    ['admin.plugins.security.trustTitle', 'admin.plugins.security.trustBody'],
  ]
  return (
    <SettingsCard
      icon={Lock}
      title={(
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="inline-flex max-w-full items-center gap-1.5 text-left font-bold text-content hover:opacity-80">
          <span className="truncate">{t('admin.plugins.security.title')}</span>
          <ChevronDown size={15} className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheck size={14} className="mt-0.5 flex-none text-content-faint" />
        <SettingsHint>{t('admin.plugins.reviewedMeaning')}</SettingsHint>
      </div>
      {open && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {sections.map(([h, b]) => (
            <div key={h} className="rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
              <h4 className="m-0 font-semibold text-content" style={fs(12.5, 'body')}>{t(h as never)}</h4>
              <p className="m-0 mt-1 leading-relaxed text-content-muted" style={fs(12, 'body')}>{t(b as never)}</p>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  )
}
