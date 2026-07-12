import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  Blocks, AlertTriangle, PackageOpen, RefreshCw, Trash2, Download, Bug, X, ShieldCheck, UploadCloud,
  ArrowUpCircle, Github, ExternalLink, ChevronDown, Check, Lock, Search, Link2,
  SlidersHorizontal, ArrowUpDown, CircleDot, MoreHorizontal, RotateCw, ArrowRight, Database, Users, LayoutDashboard,
  Radio, Luggage, Plane, Globe, Image, CalendarDays, Map, Bell, Cloud, Camera, Compass,
  BookOpen, Wallet, Puzzle, MapPin, ListChecks, Pencil, Tag, FileText,
} from 'lucide-react'
import { adminApi } from '../../api/client'
import { usePluginStore } from '../../store/pluginStore'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import ConfirmDialog from '../shared/ConfirmDialog'
import ToggleSwitch from '../Settings/ToggleSwitch'

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
type DependencyStatus = 'ok' | 'addonDisabled' | 'missingPlugin'
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
  dependencies?: PluginDependencies
  dependencyStatus?: DependencyStatus
  dependencyIssues?: DependencyIssues
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
  downloadCount?: number | null
  screenshotUrl: string | null
  requiredAddons?: string[]
  pluginDependencies?: PluginDep[]
}
interface RegistryDetail extends RegistryItem {
  size: number | null
  publishedAt: string | null
  manifest: {
    permissions: string[]
    egress: string[]
    /** The plugin needs OPERATOR-supplied hosts — its egress list is not the whole story. */
    operatorEgress?: boolean
    settings: Array<{ key: string; label: string; inputType: string; scope: string; required: boolean }>
    license: string | null
    icon: string | null
    requiredAddons?: string[]
    pluginDependencies?: PluginDep[]
  } | null
}

/** 409 error-body shape from POST /activate when a dependency blocks activation. */
interface ActivateErr {
  response?: {
    status?: number
    data?: { code?: string; error?: string; newPermissions?: string[]; newEgress?: string[]; addons?: string[]; missing?: PluginDep[]; versionMismatch?: VersionMismatch[] }
  }
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

// Manifest `icon` is a lucide name; map the common ones, fall back to Blocks.
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Luggage, Plane, Globe, Image, CalendarDays, Map, Bell, Cloud, Camera, Compass, BookOpen, Wallet, Puzzle, Blocks,
}

// Known permissions → human-readable i18n key; unknown ones render as raw code.
const PERM_KEYS = [
  'db:own', 'db:read:trips', 'db:read:users', 'db:read:costs', 'db:read:packing', 'db:read:files', 'db:read:files:content',
  'db:read:collab', 'db:read:journal', 'db:read:atlas', 'db:read:vacay', 'db:read:daynotes', 'db:read:collections',
  'db:read:categories', 'db:read:tags', 'db:read:todos', 'weather:read', 'rates:read', 'db:write:costs',
  'db:write:places', 'db:write:days', 'db:write:itinerary', 'db:write:trips', 'db:write:reservations', 'db:write:accommodations', 'db:write:daynotes', 'db:write:packing',
  'db:write:tags', 'db:write:todos', 'db:write:atlas', 'db:write:vacay', 'db:write:journal', 'db:write:collections',
  'db:write:files', 'db:write:collab', 'db:write:members',
  'db:create:trips',
  'db:meta',
  'notify:send', 'ai:invoke', 'oauth:client',
  'events:subscribe', 'jobs:run',
  'ws:broadcast:trip', 'ws:broadcast:user',
  'hook:photo-provider', 'hook:calendar-source', 'hook:place-detail-provider', 'hook:trip-warning-provider', 'hook:table-contributor', 'hook:map-marker-provider',
  'hook:pdf-section-provider', 'hook:atlas-layer-provider', 'hook:journal-entry-provider', 'hook:trip-card-provider', 'hook:notification-channel', 'hook:user-data', 'http:outbound',
]

const KNOWN_TYPES = ['widget', 'page', 'integration', 'trip-page']

function isNewer(a: string, b: string): boolean {
  const nums = (v: string) => v.split('-')[0].split('.').map(n => parseInt(n, 10) || 0)
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

interface Cap { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; net?: boolean }

// Turn a plugin's declared permissions + capabilities into the at-a-glance chips
// that make its real reach legible without opening the detail dialog.
function deriveCaps(perms: string[], caps: { widget?: { slot?: string }; tripPage?: { replaces?: string[] } }, t: T): Cap[] {
  const out: Cap[] = []
  if (perms.includes('db:read:trips')) out.push({ icon: Database, label: t('admin.plugins.cap.readsTrips') })
  if (perms.includes('db:read:users')) out.push({ icon: Users, label: t('admin.plugins.cap.readsUsers') })
  if (perms.includes('db:write:costs')) out.push({ icon: Wallet, label: t('admin.plugins.cap.writesCosts') })
  else if (perms.includes('db:read:costs')) out.push({ icon: Wallet, label: t('admin.plugins.cap.readsCosts') })
  if (perms.includes('db:read:packing')) out.push({ icon: Luggage, label: t('admin.plugins.cap.readsPacking') })
  if (perms.includes('db:read:files')) out.push({ icon: FileText, label: t('admin.plugins.cap.readsFiles') })
  if (perms.includes('db:write:places')) out.push({ icon: MapPin, label: t('admin.plugins.cap.writesPlaces') })
  if (perms.includes('db:write:days')) out.push({ icon: CalendarDays, label: t('admin.plugins.cap.writesDays') })
  if (perms.includes('db:write:itinerary')) out.push({ icon: ListChecks, label: t('admin.plugins.cap.writesItinerary') })
  if (perms.includes('db:write:trips')) out.push({ icon: Pencil, label: t('admin.plugins.cap.writesTrips') })
  if (perms.includes('db:meta')) out.push({ icon: Tag, label: t('admin.plugins.cap.metadata') })
  if (caps.widget) {
    const slotKey = caps.widget.slot === 'hero' ? 'admin.plugins.cap.heroWidget'
      : caps.widget.slot === 'place-detail' ? 'admin.plugins.cap.placeSlot'
      : caps.widget.slot === 'day-detail' ? 'admin.plugins.cap.daySlot'
      : caps.widget.slot === 'reservation-detail' ? 'admin.plugins.cap.reservationSlot'
      : 'admin.plugins.cap.widget'
    out.push({ icon: LayoutDashboard, label: t(slotKey as never) })
  }
  // Replacing planner tabs is the one capability that HIDES core UI — always chip it.
  if (caps.tripPage?.replaces?.length) out.push({ icon: LayoutDashboard, label: t('admin.plugins.cap.replacesTabs') })
  if (perms.some(p => p.startsWith('ws:broadcast'))) out.push({ icon: Radio, label: t('admin.plugins.cap.realtime') })
  if (perms.includes('hook:photo-provider')) out.push({ icon: Image, label: t('admin.plugins.cap.photos') })
  if (perms.includes('hook:calendar-source')) out.push({ icon: CalendarDays, label: t('admin.plugins.cap.calendar') })
  if (perms.includes('hook:place-detail-provider')) out.push({ icon: MapPin, label: t('admin.plugins.cap.placeDetails') })
  if (perms.includes('hook:trip-warning-provider')) out.push({ icon: AlertTriangle, label: t('admin.plugins.cap.warnings') })
  if (perms.includes('hook:notification-channel')) out.push({ icon: Bell, label: t('admin.plugins.cap.notificationChannel') })
  if (perms.includes('events:subscribe')) out.push({ icon: Radio, label: t('admin.plugins.cap.events') })
  for (const h of perms.filter(p => p.startsWith('http:outbound:')).map(p => p.slice('http:outbound:'.length)).filter(Boolean)) {
    out.push({ icon: ArrowRight, label: h, net: true })
  }
  return out
}

interface DepChip { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; blocked: boolean }

// A plugin's declared dependencies as chips — a required addon (amber when that
// addon is disabled) or a plugin dependency (amber when missing / version-mismatched).
function deriveDeps(p: PluginRow, t: T): DepChip[] {
  const out: DepChip[] = []
  const issues = p.dependencyIssues
  for (const a of p.dependencies?.requiredAddons ?? []) {
    out.push({ icon: Blocks, label: t('admin.plugins.cap.requiresAddon', { addon: a }), blocked: !!issues?.disabledAddons.includes(a) })
  }
  for (const d of p.dependencies?.pluginDependencies ?? []) {
    const blocked = !!(issues?.missing.some(m => m.id === d.id) || issues?.versionMismatch.some(m => m.id === d.id))
    out.push({ icon: Puzzle, label: t('admin.plugins.cap.dependsOn', { id: d.id, version: d.version }), blocked })
  }
  return out
}

function PluginIcon({ name, size = 20, className }: { name: string | null; size?: number; className?: string }) {
  const Icon = (name && Object.prototype.hasOwnProperty.call(ICON_MAP, name) && ICON_MAP[name]) || Blocks
  return <Icon size={size} className={className} />
}

function ReviewedBadge({ t, compact }: { t: T; compact?: boolean }) {
  if (compact) return <ShieldCheck size={13} className="text-success shrink-0" aria-label={t('admin.plugins.reviewed')} />
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-soft text-success">
      <ShieldCheck size={11} /> {t('admin.plugins.reviewed')}
    </span>
  )
}

/** Marks a manually-uploaded (sideloaded) plugin: no registry, unsigned, not reviewed. */
function SideloadedBadge({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[11px] font-medium bg-warning-soft text-warning border border-warning/25"
      title={t('admin.plugins.sideloadedHint')}>
      <UploadCloud size={11} /> {t('admin.plugins.sideloaded')}
    </span>
  )
}

/** Marks a dev-linked plugin: loaded from a local build dir + hot-reloaded (dev only). */
function DevLinkBadge({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[11px] font-medium bg-accent-soft text-accent border border-accent/25"
      title={t('admin.plugins.devLinkHint')}>
      <Link2 size={11} /> {t('admin.plugins.devLinkBadge')}
    </span>
  )
}

function TypeBadge({ type, t }: { type: string; t: T }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-accent-subtle text-content-muted">
      {KNOWN_TYPES.includes(type) ? t(`admin.plugins.type.${type}` as never) : type}
    </span>
  )
}

export default function AdminPluginsPanel() {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const [runtimeOn, setRuntimeOn] = useState(false)
  const [devLink, setDevLink] = useState(false) // dev-link enabled server-side (TREK_PLUGINS_DEV_LINK)
  const [linkPath, setLinkPath] = useState('')
  const [plugins, setPlugins] = useState<PluginRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [view, setView] = useState<'installed' | 'discover'>('installed')
  const [registry, setRegistry] = useState<RegistryItem[] | null>(null)
  const [latest, setLatest] = useState<Record<string, string>>({})
  const [detailFor, setDetailFor] = useState<RegistryItem | null>(null)
  const [errorsFor, setErrorsFor] = useState<{ id: string; rows: Array<{ ts: string; level: string; message: string }> } | null>(null)
  const [egressFor, setEgressFor] = useState<{ id: string; supported: boolean; hosts: string[] } | null>(null)
  const [egressDraft, setEgressDraft] = useState('')
  const [egressSaving, setEgressSaving] = useState(false)
  const [egressError, setEgressError] = useState('')
  const [confirmUninstall, setConfirmUninstall] = useState<PluginRow | null>(null)
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

  const refresh = () => {
    // Keep the app-wide active-plugin store in sync so widget/hero/tab consumers
    // (e.g. the dashboard) reflect an activate/deactivate without a full reload (F5).
    void usePluginStore.getState().loadPlugins()
    adminApi.plugins()
      .then((d: { enabled: boolean; devLink?: boolean; plugins: PluginRow[] }) => {
        setRuntimeOn(!!d.enabled)
        setDevLink(!!d.devLink)
        setPlugins(d.plugins || [])
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
    setBusy(id); setMenu(null)
    try { await fn(); toast.success(ok) }
    catch (e) { toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError')) }
    finally { setBusy(null); refresh() }
  }

  const openDiscover = () => {
    setView('discover')
    if (!registry) adminApi.pluginBrowse().then(setRegistry).catch(() => setRegistry([]))
  }
  // The rescan/reload button rediscovers locally-installed plugins AND force-pulls
  // the remote registry (bypassing the 30-min server cache + GitHub's CDN), so a
  // just-published plugin shows up right away instead of up to ~35 min later.
  const rescan = () => act('__rescan', async () => {
    await adminApi.pluginRescan()
    const items: RegistryItem[] = await adminApi.pluginBrowse(true)
    setRegistry(items)
    const map: Record<string, string> = {}
    items.forEach((i) => { if (i.latest) map[i.id] = i.latest })
    setLatest(map)
  }, t('admin.plugins.rescanned'))

  // Sideload a plugin archive (installs INACTIVE — the admin still consents on activation).
  const uploadPlugin = async (file: File) => {
    setBusy('__upload'); setMenu(null)
    try {
      const res = await adminApi.pluginUpload(file)
      setView('installed')
      toast.success(t('admin.plugins.uploaded', { name: res.id }))
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

  const openErrors = (id: string) => {
    setMenu(null)
    adminApi.pluginErrors(id)
      .then((d: { errors: Array<{ ts: string; level: string; message: string }> }) => setErrorsFor({ id, rows: d.errors }))
      .catch(() => setErrorsFor({ id, rows: [] }))
  }

  const updateAvailable = (p: PluginRow) => !!(p.version && latest[p.id] && isNewer(latest[p.id], p.version))
  const install = (id: string) => act(id, () => adminApi.pluginInstall(id), t('admin.plugins.installed'))
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
      .then((r: { installed?: string[]; requiredAddons?: string[] }) => {
        toast.success(t('admin.plugins.dep.downloaded', { id: depId }))
        if (r?.requiredAddons?.length) toast.error(t('admin.plugins.dep.addonDisabledToast', { addons: r.requiredAddons.join(', ') }))
        return attemptActivate(parent)
      })
      .catch((e: ActivateErr) => onActivateError(parent, e))
      .finally(() => { setBusy(null); refresh() })
  }

  const runUpdate = (p: PluginRow) => {
    setBusy(p.id); setMenu(null)
    adminApi.pluginUpdate(p.id)
      .then((r: { version: string; activated: boolean; newPermissions: string[]; newEgress: string[] }) => {
        if (r.activated || (r.newPermissions.length === 0 && r.newEgress.length === 0)) toast.success(t('admin.plugins.updated'))
        else setConsentQueue(qq => [...qq, { plugin: p, version: r.version, newPermissions: r.newPermissions, newEgress: r.newEgress }])
      })
      .catch(e => toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError')))
      .finally(() => { setBusy(null); refresh() })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updatable = useMemo(() => plugins.filter(updateAvailable), [plugins, latest])

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

  return (
    <div className="relative bg-surface-card border border-edge rounded-2xl shadow-card mb-24 sm:mb-0"
      onDragEnter={onDragEnter} onDragOver={e => { if (dragActive) e.preventDefault() }} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Hidden input for the toolbar "Upload plugin" button (drag-drop uses the same handler). */}
      <input ref={uploadInputRef} type="file" accept=".zip,.tgz,.tar.gz" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void uploadPlugin(f); e.target.value = '' }} />
      {/* Drag-to-install overlay */}
      {dragActive && (
        <div className="absolute inset-0 z-40 rounded-2xl border-2 border-dashed border-accent bg-accent-soft/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5 pointer-events-none">
          <UploadCloud size={34} className="text-accent" />
          <span className="text-sm font-semibold text-accent">{t('admin.plugins.dropToUpload')}</span>
        </div>
      )}
      {/* Click-away layer for any open dropdown (filters or a row's ⋯ menu). */}
      {menu && <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />}
      {/* Header */}
      <div className="px-4 sm:px-6 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-content">{t('admin.plugins.title')}</h2>
            <p className="text-xs mt-1 text-content-muted max-w-xl">{t('admin.plugins.subtitle')}</p>
          </div>
          {runtimeOn && (
            <span className="inline-flex items-center gap-2 shrink-0 text-[11px] font-semibold text-success bg-success-soft px-2.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> {t('admin.plugins.runtimeOn')}
            </span>
          )}
        </div>
      </div>

      {/* Runtime-disabled notice */}
      {!runtimeOn && !loading && !error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl border border-warning/30 bg-warning-soft flex items-start gap-3">
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-content">{t('admin.plugins.disabledTitle')}</p>
            <p className="text-xs text-content-muted mt-0.5">{t('admin.plugins.disabledBody')}</p>
          </div>
        </div>
      )}

      {/* Dev-link: register + hot-reload a plugin from a local build dir (dev only). */}
      {devLink && runtimeOn && !loading && !error && (
        <form onSubmit={(e) => { e.preventDefault(); void linkLocal() }}
          className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl border border-accent/30 bg-accent-soft flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-2 shrink-0 text-accent" title={t('admin.plugins.devLinkHint')}>
            <Link2 size={15} />
            <span className="text-xs font-semibold">{t('admin.plugins.devLinkTitle')}</span>
          </div>
          <input value={linkPath} onChange={(e) => setLinkPath(e.target.value)} spellCheck={false}
            placeholder={t('admin.plugins.devLinkPathPlaceholder')}
            className="flex-1 min-w-0 h-[34px] px-2.5 rounded-lg border border-edge bg-surface-card text-sm text-content placeholder:text-content-faint focus:outline-none focus:border-accent" />
          <button type="submit" disabled={!linkPath.trim() || busy === '__link'}
            className="h-[34px] px-3.5 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors">
            <Link2 size={14} /> {t('admin.plugins.devLinkButton')}
          </button>
        </form>
      )}

      {/* Toolbar — on mobile: tabs+rescan, then full-width search, then a
          right-aligned filter row. On sm+ the wrappers collapse (sm:contents)
          so everything sits in one wrapping row. */}
      {runtimeOn && !loading && !error && (
        <div className="relative z-30 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
          <div className="flex items-center justify-between gap-2.5 sm:contents">
            <div className="inline-flex bg-surface-tertiary border border-edge-secondary rounded-xl p-0.5 gap-0.5">
              <SegBtn active={view === 'installed'} onClick={() => setView('installed')} label={t('admin.plugins.installed')} count={plugins.length} />
              <SegBtn active={view === 'discover'} onClick={openDiscover} label={t('admin.plugins.tabDiscover')} count={registry?.length} />
            </div>
            <div className="sm:hidden flex items-center gap-2 shrink-0">
              <button onClick={pickUpload} title={t('admin.plugins.upload')}
                className="h-[38px] w-[38px] grid place-items-center rounded-xl border border-edge bg-surface-card text-content-muted hover:text-content hover:border-content-faint transition-colors">
                <UploadCloud size={15} />
              </button>
              <button onClick={rescan} title={t('admin.plugins.rescan')}
                className="h-[38px] w-[38px] grid place-items-center rounded-xl border border-edge bg-surface-card text-content-muted hover:text-content hover:border-content-faint transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="relative w-full sm:flex-1 sm:min-w-[160px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint pointer-events-none" />
            <input
              value={q} onChange={e => setQ(e.target.value)} type="search"
              placeholder={t('admin.plugins.searchPlaceholder')}
              className="w-full h-[38px] pl-9 pr-3 rounded-xl border border-edge bg-surface-secondary text-sm text-content placeholder:text-content-faint outline-none focus:bg-surface-card focus:border-content-faint transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-2.5 sm:contents">
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

            <button onClick={pickUpload} title={t('admin.plugins.upload')}
              className="hidden sm:grid h-[38px] w-[38px] place-items-center rounded-xl border border-edge bg-surface-card text-content-muted hover:text-content hover:border-content-faint transition-colors">
              <UploadCloud size={15} />
            </button>
            <button onClick={rescan} title={t('admin.plugins.rescan')}
              className="hidden sm:grid h-[38px] w-[38px] place-items-center rounded-xl border border-edge bg-surface-card text-content-muted hover:text-content hover:border-content-faint transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="pb-1">
        {loading ? (
          <div className="py-14 text-center text-sm text-content-faint">{t('common.loading')}</div>
        ) : error ? (
          <div className="py-14 text-center text-sm text-danger">{t('admin.plugins.loadError')}</div>
        ) : !runtimeOn ? null : view === 'discover' ? (
          <RegistryGrid items={shownRegistry} busy={busy} t={t} installedIds={installedIds}
            onInstall={install} onOpenDetail={setDetailFor} filtered={anyFilter} />
        ) : plugins.length === 0 ? (
          <EmptyState t={t} onDiscover={openDiscover} />
        ) : (
          <div className="px-2 sm:px-3">
            {updatable.length > 0 && statusFilter !== 'err' && (
              <div className="mx-1.5 sm:mx-3 mb-2 mt-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-warning-soft border border-warning/30">
                <ArrowUpCircle size={16} className="text-warning shrink-0" />
                <span className="text-xs text-content-secondary">{t('admin.plugins.updatesAvailable', { count: updatable.length })}</span>
                <button onClick={() => updatable.forEach(runUpdate)}
                  className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-warning text-white hover:opacity-90 transition-opacity">
                  {t('admin.plugins.updateAll')}
                </button>
              </div>
            )}
            {shownInstalled.length === 0 ? (
              <div className="py-12 text-center">
                <Search size={26} className="text-content-faint/60 mx-auto mb-3" />
                <p className="text-sm text-content-faint">{t('admin.plugins.noMatchInstalled')}</p>
              </div>
            ) : shownInstalled.map(p => (
              <InstalledRow key={p.id} p={p} t={t} busy={busy} menu={menu} setMenu={setMenu}
                hasUpdate={updateAvailable(p)} latestVer={latest[p.id]}
                onToggle={() => toggle(p)}
                onUpdate={() => runUpdate(p)} onRestart={() => restart(p.id)}
                onErrors={() => openErrors(p.id)} onEgress={() => openEgress(p.id)}
                onUninstall={() => { setMenu(null); setConfirmUninstall(p) }} />
            ))}
          </div>
        )}
      </div>

      <SecurityInfo t={t} />

      {/* Registry detail dialog */}
      {detailFor && (
        <PluginDetailModal item={detailFor} t={t} locale={locale} busy={busy}
          installed={installedIds.has(detailFor.id)} onInstall={install} onClose={() => setDetailFor(null)} />
      )}

      {/* Error-log modal */}
      {errorsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setErrorsFor(null)}>
          <div className="bg-surface-card border border-edge rounded-2xl w-full max-w-2xl max-h-[70vh] flex flex-col shadow-modal" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-edge-secondary flex items-center justify-between">
              <span className="text-sm font-semibold text-content flex items-center gap-2"><Bug size={15} /> {errorsFor.id} — {t('admin.plugins.errorLog')}</span>
              <button onClick={() => setErrorsFor(null)} className="text-content-faint hover:text-content"><X size={16} /></button>
            </div>
            <div className="p-4 overflow-y-auto text-xs font-mono">
              {errorsFor.rows.length === 0 ? <p className="text-content-faint py-4 text-center">{t('admin.plugins.noErrors')}</p> :
                errorsFor.rows.map((r, i) => (
                  <div key={i} className="py-1.5 border-b border-edge-secondary/50 last:border-0 flex gap-2">
                    <span className={`shrink-0 font-semibold ${r.level === 'error' ? 'text-danger' : 'text-warning'}`}>{r.level}</span>
                    <span className="text-content-faint shrink-0">{r.ts}</span>
                    <span className="text-content-muted break-all">{r.message}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Operator-supplied egress hosts */}
      {egressFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEgressFor(null)}>
          <div className="bg-surface-card border border-edge rounded-2xl w-full max-w-lg shadow-modal" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-edge-secondary flex items-center justify-between">
              <span className="text-sm font-semibold text-content flex items-center gap-2"><Globe size={15} /> {egressFor.id} — {t('admin.plugins.allowedHosts')}</span>
              <button onClick={() => setEgressFor(null)} className="text-content-faint hover:text-content"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              {!egressFor.supported ? (
                <p className="text-sm text-content-faint">{t('admin.plugins.allowedHosts.unsupported')}</p>
              ) : (
                <>
                  <p className="text-xs text-content-faint">{t('admin.plugins.allowedHosts.hint')}</p>
                  {egressFor.hosts.length === 0 && (
                    <p className="text-sm text-content-faint italic">{t('admin.plugins.allowedHosts.none')}</p>
                  )}
                  {egressFor.hosts.map(h => (
                    <div key={h} className="flex items-center justify-between gap-2 rounded-lg border border-edge-secondary px-3 py-2">
                      <span className="text-sm font-mono text-content break-all">{h}</span>
                      <button
                        disabled={egressSaving}
                        onClick={() => saveEgress(egressFor.hosts.filter(x => x !== h))}
                        className="text-content-faint hover:text-danger disabled:opacity-50"
                        aria-label={t('common.delete')}
                      ><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={egressDraft}
                      onChange={e => setEgressDraft(e.target.value)}
                      placeholder="gotify.example.com"
                      className="flex-1 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content"
                    />
                    <button
                      disabled={egressSaving || !egressDraft.trim()}
                      onClick={() => saveEgress([...egressFor.hosts, egressDraft.trim()])}
                      className="rounded-lg bg-content px-3 py-2 text-sm text-surface disabled:opacity-50"
                    >{t('common.add')}</button>
                  </div>
                  {egressError && <p className="text-xs text-danger">{egressError}</p>}
                  <p className="text-xs text-content-faint">{t('admin.plugins.allowedHosts.restartNote')}</p>
                </>
              )}
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

      {consentQueue[0] && (
        <UpdateConsentDialog
          data={consentQueue[0]} t={t}
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

function SegBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button onClick={onClick} role="tab" aria-selected={active}
      className={`inline-flex items-center gap-2 text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
        active ? 'bg-surface-card text-content shadow-card' : 'text-content-muted hover:text-content'}`}>
      {label}
      {count != null && (
        <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[11px] font-bold tabular-nums ${
          active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-muted'}`}>{count}</span>
      )}
    </button>
  )
}

function FilterMenu({ id, label, valueLabel, options, onPick, value, menu, setMenu, icon }: {
  id: string; label: string; valueLabel: string
  options: Array<[string, string]>; onPick: (v: string) => void; value: string
  menu: string | null; setMenu: (v: string | null) => void; icon?: React.ReactNode
}) {
  const open = menu === id
  const active = value !== options[0]?.[0]
  return (
    <div className="relative">
      <button onClick={() => setMenu(open ? null : id)} title={`${label}: ${valueLabel}`}
        className={`relative h-[38px] w-[38px] sm:w-auto px-0 sm:px-3 inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-xl border bg-surface-card text-[13px] text-content-secondary transition-colors whitespace-nowrap hover:border-content-faint ${
          active ? 'border-content-faint' : 'border-edge'}`}>
        {icon}
        <span className="hidden sm:inline">{label}: </span>
        <span className="hidden sm:inline font-semibold text-content">{valueLabel}</span>
        <ChevronDown size={13} className={`hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`} />
        {active && <span className="sm:hidden absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent ring-2 ring-surface-card" />}
      </button>
      {open && (
        <div className="absolute top-11 right-0 z-30 min-w-[180px] max-w-[calc(100vw-2rem)] p-1.5 rounded-xl border border-edge bg-surface-card shadow-elevated">
          {options.map(([v, lbl]) => (
            <button key={v} onClick={() => { onPick(v); setMenu(null) }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors hover:bg-surface-tertiary ${
                value === v ? 'text-content font-semibold' : 'text-content-secondary'}`}>
              {lbl}<Check size={15} className={`ml-auto text-accent ${value === v ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ t, onDiscover }: { t: T; onDiscover: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-tertiary grid place-items-center mx-auto mb-4">
        <PackageOpen size={26} className="text-content-faint" />
      </div>
      <p className="text-sm font-medium text-content-muted">{t('admin.plugins.empty')}</p>
      <button onClick={onDiscover} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-accent-text">
        <Download size={14} /> {t('admin.plugins.tabDiscover')}
      </button>
    </div>
  )
}

function InstalledRow({ p, t, busy, menu, setMenu, hasUpdate, latestVer, onToggle, onUpdate, onRestart, onErrors, onEgress, onUninstall }: {
  p: PluginRow; t: T; busy: string | null; menu: string | null; setMenu: (v: string | null) => void
  hasUpdate: boolean; latestVer?: string
  onToggle: () => void; onUpdate: () => void; onRestart: () => void; onErrors: () => void; onEgress: () => void; onUninstall: () => void
}) {
  const caps = deriveCaps(parseJson<string[]>(p.permissions, []), parseJson<{ widget?: { slot?: string } }>(p.capabilities, {}), t)
  const deps = deriveDeps(p, t)
  const menuOpen = menu === `row:${p.id}`
  return (
    <div className="group relative flex items-center gap-3 sm:gap-4 px-2.5 sm:px-3 py-3.5 rounded-2xl hover:bg-surface-secondary transition-colors">
      <div className="relative shrink-0">
        <div className="w-[46px] h-[46px] rounded-[13px] grid place-items-center bg-surface-tertiary border border-edge-secondary">
          <PluginIcon name={p.icon} size={22} className="text-content-secondary" />
        </div>
        <span className={`absolute -right-0.5 -bottom-0.5 w-[13px] h-[13px] rounded-full ring-[2.5px] ring-surface-card ${HEALTH[p.status] || HEALTH.inactive}`}
          title={t(`admin.plugins.status.${p.status}` as never)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14.5px] font-semibold tracking-[-.006em] text-content">{p.name}</span>
          {p.version && <span className="text-[11.5px] text-content-faint font-medium tabular-nums">v{p.version}</span>}
          {p.reviewed_at && <ReviewedBadge t={t} compact />}
          {p.source_repo === 'local:upload' && <SideloadedBadge t={t} />}
          {p.source_repo === 'local:link' && <DevLinkBadge t={t} />}
        </div>
        {p.description && <p className="text-[12.5px] text-content-muted mt-0.5 truncate">{p.description}</p>}
        {p.status === 'error' && p.last_error ? (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11.5px] text-danger">
            <AlertTriangle size={13} className="shrink-0" /><span className="truncate">{p.last_error}</span>
          </div>
        ) : (caps.length > 0 || p.operatorEgress) && (
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap mt-2">
            {caps.map((c, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-[3px] rounded-md border ${
                c.net ? 'text-info border-info/25 bg-info-soft' : 'text-content-secondary border-edge-secondary bg-surface-tertiary'}`}>
                <c.icon size={12} className={c.net ? 'text-info' : 'text-content-muted'} />{c.label}
              </span>
            ))}
            {/* This plugin talks to a service only the OPERATOR can name (a self-hosted
                Gotify/ntfy), so its manifest can't list the host — the admin adds it.
                Actionable, and warning-toned until at least one host exists, because
                until then the plugin cannot reach anything and looks silently broken. */}
            {p.operatorEgress && (
              <button
                onClick={onEgress}
                title={t('admin.plugins.allowedHosts.hint')}
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-[3px] rounded-md border transition-colors ${
                  p.egressHostCount > 0
                    ? 'text-info border-info/25 bg-info-soft hover:border-info/50'
                    : 'text-warning border-warning/30 bg-warning-soft hover:border-warning/60'}`}
              >
                <Globe size={12} className={p.egressHostCount > 0 ? 'text-info' : 'text-warning'} />
                {p.egressHostCount > 0
                  ? t('admin.plugins.allowedHosts.count').replace('{n}', String(p.egressHostCount))
                  : t('admin.plugins.allowedHosts.add')}
              </button>
            )}
          </div>
        )}
        {deps.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap mt-1.5">
            {deps.map((d, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-[3px] rounded-md border ${
                d.blocked ? 'text-warning border-warning/30 bg-warning-soft' : 'text-content-secondary border-edge-secondary bg-surface-tertiary'}`}>
                <d.icon size={12} className={d.blocked ? 'text-warning' : 'text-content-muted'} />{d.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {hasUpdate && (
          <button onClick={onUpdate} disabled={busy === p.id} title={t('admin.plugins.updateTo', { version: latestVer })}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2 sm:px-2.5 py-1.5 rounded-full text-warning bg-warning-soft border border-warning/30 hover:opacity-90 transition-opacity disabled:opacity-50">
            <ArrowUpCircle size={13} /> <span className="hidden sm:inline">{t('admin.plugins.updateTo', { version: latestVer })}</span>
          </button>
        )}
        <span className={`hidden sm:inline text-xs font-medium min-w-[42px] text-right ${p.enabled === 1 && p.status !== 'error' ? 'text-content-secondary' : 'text-content-faint'}`}>
          {p.enabled === 1 ? t('admin.plugins.status.active') : t('admin.plugins.stateOff')}
        </span>
        <ToggleSwitch on={p.enabled === 1} label={t('admin.plugins.enabledToggle')} onToggle={onToggle} />
        <div className="relative">
          <button onClick={() => setMenu(menuOpen ? null : `row:${p.id}`)}
            className="w-[34px] h-[34px] grid place-items-center rounded-lg text-content-faint hover:text-content hover:bg-surface-tertiary transition-colors">
            <MoreHorizontal size={17} />
          </button>
          {menuOpen && (
            <div className="absolute top-10 right-0 z-30 min-w-[180px] p-1.5 rounded-xl border border-edge bg-surface-card shadow-elevated">
              {p.enabled === 1 && (
                <MenuItem icon={<RotateCw size={14} />} label={t('admin.plugins.restart')} onClick={onRestart} />
              )}
              <MenuItem icon={<Bug size={14} />} label={t('admin.plugins.viewErrors')} onClick={onErrors} />
              <MenuItem icon={<Globe size={14} />} label={t('admin.plugins.allowedHosts')} onClick={onEgress} />
              {p.source_repo && p.source_repo !== 'local:upload' && p.source_repo !== 'local:link' && (
                <>
                  <a href={`https://github.com/${p.source_repo}`} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-content-secondary hover:bg-surface-tertiary transition-colors">
                    <Github size={14} /> {t('admin.plugins.sourceRepo')}
                  </a>
                  <a href={`https://github.com/${p.source_repo}/issues`} target="_blank" rel="noreferrer" onClick={() => setMenu(null)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-content-secondary hover:bg-surface-tertiary transition-colors">
                    <CircleDot size={14} /> {t('admin.plugins.reportIssue')}
                  </a>
                </>
              )}
              <div className="my-1 border-t border-edge-secondary" />
              <MenuItem icon={<Trash2 size={14} />} label={t('common.delete')} danger onClick={onUninstall} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
        danger ? 'text-danger hover:bg-danger-soft' : 'text-content-secondary hover:bg-surface-tertiary'}`}>
      {icon} {label}
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
        <div className="w-full h-full grid place-items-center bg-gradient-to-br from-surface-tertiary to-surface-secondary">
          <Blocks size={iconSize} className="text-content-faint/50" />
        </div>
      )}
    </div>
  )
}

function RegistryGrid({ items, onInstall, onOpenDetail, busy, t, installedIds, filtered }: {
  items: RegistryItem[] | null
  onInstall: (id: string) => void
  onOpenDetail: (item: RegistryItem) => void
  busy: string | null
  t: T
  installedIds: Set<string>
  filtered: boolean
}) {
  if (!items) return <div className="py-14 text-center text-sm text-content-faint">{t('common.loading')}</div>
  if (items.length === 0) return (
    <div className="py-14 text-center">
      <Search size={26} className="text-content-faint/60 mx-auto mb-3" />
      <p className="text-sm text-content-faint">{filtered ? t('admin.plugins.noMatchRegistry') : t('admin.plugins.registryEmpty')}</p>
    </div>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 px-4 sm:px-6 pb-5 pt-1">
      {items.map(item => {
        const installed = installedIds.has(item.id)
        return (
          <div key={item.id} role="button" tabIndex={0} onClick={() => onOpenDetail(item)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(item) } }}
            className="group border border-edge rounded-2xl bg-surface-card overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated hover:border-edge-faint transition-all duration-150">
            <div className="relative">
              <Screenshot url={item.screenshotUrl} className="aspect-[16/10]" iconSize={24} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              {item.reviewedAt && (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-white bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                  <ShieldCheck size={12} /> {t('admin.plugins.reviewed')}
                </span>
              )}
              <div className="absolute left-3 -bottom-4 w-11 h-11 rounded-xl bg-surface-card border border-edge grid place-items-center shadow-card z-[1]">
                <PluginIcon name={item.type === 'widget' ? 'Blocks' : null} size={22} className="text-content-secondary" />
              </div>
            </div>
            <div className="pt-6 px-3.5 pb-3.5 flex flex-col flex-1">
              <span className="text-sm font-semibold tracking-[-.006em] text-content truncate">{item.name}</span>
              <span className="text-[11.5px] text-content-faint mt-0.5">{item.author}</span>
              <p className="text-xs text-content-muted mt-2 line-clamp-2 flex-1">{item.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <TypeBadge type={item.type} t={t} />
                {item.latest && <span className="text-[10.5px] text-content-faint tabular-nums">v{item.latest}</span>}
                {typeof item.downloadCount === 'number' && item.downloadCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-content-faint tabular-nums" title={t('admin.plugins.downloads')}>
                    <Download size={11} /> {formatCompactCount(item.downloadCount)}
                  </span>
                )}
                <button onClick={e => { e.stopPropagation(); onInstall(item.id) }} disabled={busy === item.id || installed}
                  className="ml-auto text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50 disabled:bg-surface-tertiary disabled:text-content-faint transition-colors">
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
    : <code className="font-mono text-[11px] bg-surface-tertiary px-1.5 py-0.5 rounded">{perm}</code>
}

function PluginDetailModal({ item, installed, busy, onInstall, onClose, t, locale }: {
  item: RegistryItem; installed: boolean; busy: string | null
  onInstall: (id: string) => void; onClose: () => void; t: T; locale: string
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
  const caps = manifest ? deriveCaps(manifest.permissions, {}, t) : []
  const repoUrl = `https://github.com/${item.repo}`
  const homepage = item.homepage && /^https?:\/\//i.test(item.homepage) && item.homepage !== repoUrl ? item.homepage : null
  const sizeKb = detail?.size ? Math.max(1, Math.round(detail.size / 1024)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-card border border-edge rounded-2xl w-full max-w-xl max-h-[88vh] overflow-auto shadow-modal" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <Screenshot url={item.screenshotUrl} className="w-full aspect-[16/9]" iconSize={36} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex items-start gap-3 sm:gap-3.5 px-4 sm:px-5 -mt-7 relative z-[1]">
          <div className="w-14 h-14 rounded-[15px] bg-surface-card border border-edge grid place-items-center shadow-card shrink-0">
            <PluginIcon name={manifest?.icon ?? null} size={28} className="text-content-secondary" />
          </div>
          <div className="flex-1 min-w-0 pt-8">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold tracking-tight text-content">{item.name}</h3>
              {item.reviewedAt && <ReviewedBadge t={t} compact />}
            </div>
            <p className="text-[12.5px] text-content-faint mt-0.5">{item.author}{item.latest ? ` · v${item.latest}` : ''}</p>
          </div>
          <button onClick={() => onInstall(item.id)} disabled={busy === item.id || installed}
            className="self-end text-[13px] font-semibold px-3 sm:px-4 py-2 rounded-lg bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50 disabled:bg-surface-tertiary disabled:text-content-faint transition-colors shrink-0">
            {installed ? t('admin.plugins.installed') : t('admin.plugins.install')}
          </button>
        </div>

        <div className="px-4 sm:px-5 pt-4 pb-5">
          <p className="text-[13.5px] text-content-secondary leading-relaxed">{item.description}</p>
          {failed && <p className="text-xs text-danger mt-3">{t('admin.plugins.detailError')}</p>}

          {manifest && (
            <div className="mt-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.accessTitle')}</h4>
              {caps.filter(c => !c.net).length === 0 && !manifest.permissions.includes('db:own') ? (
                <p className="text-xs text-content-faint mt-2">{t('admin.plugins.noAccess')}</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {caps.filter(c => !c.net).map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] text-content-secondary py-0.5">
                      <c.icon size={15} className="text-accent mt-0.5 shrink-0" /><span>{c.label}</span>
                    </div>
                  ))}
                  {manifest.permissions.includes('db:own') && (
                    <div className="flex items-start gap-2.5 text-[13px] text-content-secondary py-0.5">
                      <Database size={15} className="text-accent mt-0.5 shrink-0" /><span>{t('admin.plugins.perm.db:own')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {manifest && (manifest.egress.length > 0 || manifest.operatorEgress) && (
            <div className="mt-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.connectsTitle')}</h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {manifest.egress.map(h => (
                  <code key={h} className="text-[12px] font-mono text-info bg-info-soft rounded-md px-2 py-1">{h}</code>
                ))}
                {/* The hosts above are NOT the whole story for this plugin: it talks to a
                    service only the operator can name, so its reach is whatever an admin
                    adds after install. Say so HERE — this is the pre-install review, and a
                    reviewer who reads only the host list would otherwise be misled. */}
                {manifest.operatorEgress && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-warning bg-warning-soft border border-warning/30 rounded-md px-2 py-1">
                    <Globe size={12} />{t('admin.plugins.operatorEgressPill')}
                  </span>
                )}
              </div>
              {manifest.operatorEgress && (
                <p className="text-[11.5px] text-content-faint mt-2">{t('admin.plugins.operatorEgressHint')}</p>
              )}
            </div>
          )}

          {manifest && manifest.settings.length > 0 && (
            <div className="mt-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.setupTitle')}</h4>
              <ul className="mt-2 space-y-1.5">
                {manifest.settings.map(s => (
                  <li key={s.key} className="flex items-center gap-2 text-xs text-content-muted flex-wrap">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-content-faint">{t(`admin.plugins.scope.${s.scope}` as never)}</span>
                    {s.required && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning-soft text-warning">{t('admin.plugins.fieldRequired')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.detailsTitle')}</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2.5">
              {item.latest && <Meta k={t('admin.plugins.metaVersion')} v={`v${item.latest}`} />}
              {sizeKb && <Meta k={t('admin.plugins.metaSize')} v={`${sizeKb} KB`} />}
              {item.minTrekVersion && <Meta k={t('admin.plugins.metaRequires')} v={`TREK ${item.minTrekVersion}+`} />}
              {item.reviewedAt && <Meta k={t('admin.plugins.metaReviewed')} v={new Date(item.reviewedAt).toLocaleDateString(locale)} />}
              {typeof item.downloadCount === 'number' && item.downloadCount > 0 && (
                <Meta k={t('admin.plugins.downloads')} v={item.downloadCount.toLocaleString(locale)} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-t border-edge-secondary bg-surface-secondary">
          <a href={repoUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-edge bg-surface-card text-content-secondary hover:text-content hover:border-content-faint transition-colors">
            <Github size={13} /> {t('admin.plugins.sourceRepo')}
          </a>
          <a href={`${repoUrl}/issues`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-edge bg-surface-card text-content-secondary hover:text-content hover:border-content-faint transition-colors">
            <CircleDot size={13} /> {t('admin.plugins.reportIssue')}
          </a>
          {homepage && (
            <a href={homepage} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-edge bg-surface-card text-content-secondary hover:text-content hover:border-content-faint transition-colors">
              <ExternalLink size={13} /> {t('admin.plugins.homepage')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return <div><div className="text-[12px] text-content-faint">{k}</div><div className="text-[12.5px] font-medium text-content mt-0.5">{v}</div></div>
}

function UpdateConsentDialog({ data, t, onApprove, onLater }: {
  data: { plugin: PluginRow; version: string; newPermissions: string[]; newEgress: string[] }
  t: T; onApprove: () => void; onLater: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onLater}>
      <div className="bg-surface-card border border-edge rounded-2xl w-full max-w-md shadow-modal overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-edge-secondary flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning-soft grid place-items-center shrink-0"><ShieldCheck size={18} className="text-warning" /></div>
          <div>
            <h3 className="text-sm font-semibold text-content">{t('admin.plugins.updateConsentTitle')}</h3>
            <p className="text-xs text-content-muted mt-1">{t('admin.plugins.updateConsentBody', { name: data.plugin.name, version: data.version })}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {data.newPermissions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.updateNewPermissions')}</h4>
              <ul className="mt-2 space-y-1.5">
                {data.newPermissions.map(perm => (
                  <li key={perm} className="flex items-start gap-2 text-xs text-content-muted"><Check size={13} className="text-warning mt-0.5 shrink-0" /><PermLabel perm={perm} t={t} /></li>
                ))}
              </ul>
            </div>
          )}
          {data.newEgress.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.updateNewEgress')}</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.newEgress.map(host => <code key={host} className="font-mono text-[11px] bg-surface-tertiary px-1.5 py-0.5 rounded text-content-muted">{host}</code>)}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-edge-secondary bg-surface-secondary flex items-center justify-end gap-2">
          <button onClick={onLater} className="text-xs font-medium px-3.5 py-2 rounded-lg border border-edge text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors">{t('admin.plugins.updateLater')}</button>
          <button onClick={onApprove} className="text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-accent-text hover:bg-accent-hover transition-colors">{t('admin.plugins.updateApprove')}</button>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-card border border-edge rounded-2xl w-full max-w-md shadow-modal overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-edge-secondary flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning-soft grid place-items-center shrink-0"><Puzzle size={18} className="text-warning" /></div>
          <div>
            <h3 className="text-sm font-semibold text-content">{t('admin.plugins.dep.resolveTitle')}</h3>
            <p className="text-xs text-content-muted mt-1">{t('admin.plugins.dep.resolveBody', { name: data.plugin.name })}</p>
          </div>
        </div>
        <div className="p-5 space-y-2.5">
          {rows.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-edge-secondary bg-surface-tertiary">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-content truncate">{r.id}</div>
                <div className="text-[11.5px] text-content-muted mt-0.5">
                  {r.installed
                    ? t('admin.plugins.dep.mismatch', { wanted: r.constraint, installed: r.installed })
                    : t('admin.plugins.dep.requires', { version: r.constraint })}
                </div>
              </div>
              <button onClick={() => onDownload(r.id, r.constraint)} disabled={busy}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full bg-accent text-accent-text hover:bg-accent-hover transition-colors disabled:opacity-50 shrink-0">
                <Download size={13} /> {r.installed ? t('admin.plugins.dep.update') : t('admin.plugins.dep.download')}
              </button>
            </div>
          ))}
          {rows.some(r => !installedIds.has(r.id)) && (
            <p className="text-[11.5px] text-content-faint pt-1">{t('admin.plugins.dep.resolveHint')}</p>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-edge-secondary bg-surface-secondary flex items-center justify-end">
          <button onClick={onClose} className="text-xs font-medium px-3.5 py-2 rounded-lg border border-edge text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors">{t('common.cancel')}</button>
        </div>
      </div>
    </div>
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
    ['admin.plugins.security.trustTitle', 'admin.plugins.security.trustBody'],
  ]
  return (
    <div className="border-t border-edge-secondary bg-surface-secondary rounded-b-2xl overflow-hidden">
      <div className="px-4 sm:px-6 py-3.5 flex items-start gap-2">
        <ShieldCheck size={14} className="text-content-faint shrink-0 mt-0.5" />
        <p className="text-xs text-content-muted">{t('admin.plugins.reviewedMeaning')}</p>
      </div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 sm:px-6 py-2.5 border-t border-edge-secondary flex items-center justify-between gap-2 text-xs font-medium text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors">
        <span className="flex items-center gap-2"><Lock size={13} className="shrink-0" /> <span className="text-left">{t('admin.plugins.security.title')}</span></span>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-6 py-4 border-t border-edge-secondary grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {sections.map(([h, b]) => (
            <div key={h}>
              <h4 className="text-[12.5px] font-semibold text-content">{t(h as never)}</h4>
              <p className="text-xs text-content-muted mt-1 leading-relaxed">{t(b as never)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
