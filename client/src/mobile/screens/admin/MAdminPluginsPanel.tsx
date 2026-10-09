import { useState } from 'react'
import {
  Blocks, AlertTriangle, PackageOpen, RefreshCw, Trash2, Download, Bug, X, ShieldCheck, UploadCloud,
  ArrowUpCircle, Github, ExternalLink, ChevronDown, Check, Lock, Search, Link2, KeyRound, ShieldAlert,
  SlidersHorizontal, ArrowUpDown, CircleDot, MoreHorizontal, RotateCw, Database,
  Globe, Info, History, PauseCircle, Puzzle, Bot,
} from 'lucide-react'
import PluginIcon from '../../../components/shared/PluginIcon'
import { type RangeWarning } from '../../../components/Admin/useRangeBypass'
import { deriveCaps } from '../../../components/Admin/pluginCaps'
import PluginPoiCategoryList from '../../../components/Admin/PluginPoiCategoryList'
import { useTranslation } from '../../../i18n'
import MToggle from '../../components/MToggle'
import MSheet from '../../components/MSheet'
import MSegmented from '../../components/MSegmented'
import MConfirmSheet from '../settings/MConfirmSheet'
import { MAdminButton, MAdminSheetFrame } from './MAdminUi'
import {
  KNOWN_TYPES, PERM_KEYS, blockIsCurrent, dependencyRows, deriveDeps, fingerprint, formatCompactCount,
  installOffer, isRegistrySourced, parseJson, signatureBlockView, sortLabel, statusLabel,
  type PluginDep, type PluginRow, type RegistryDetail, type RegistryItem, type SigSubject, type SortKey,
  type StatusFilter, type T, type TypeFilter, type VersionInfo, type VersionMismatch,
} from '../../../components/Admin/plugins/pluginModel'
import { usePluginDetail } from '../../../components/Admin/plugins/usePluginDetail'
import { usePluginsAdmin } from '../../../components/Admin/plugins/usePluginsAdmin'

type DetailManifest = NonNullable<RegistryDetail['manifest']>
/** The detail as the phone reads it: its sheet takes the manifest's lists as always present. */
type MRegistryDetail = Omit<RegistryDetail, 'manifest'> & {
  manifest: (DetailManifest & Required<Pick<DetailManifest, 'permissions' | 'egress' | 'settings'>>) | null
}

/**
 * Admin → Plugins, mobile skin. A drop-in replacement for the desktop
 * AdminPluginsPanel: the same logic from usePluginsAdmin (segmented Installed/Discover switch,
 * search + type/status/sort filters, updates bar, installed rows with capability
 * chips, a registry list, an enriched detail sheet and the update re-consent
 * gate) with the mobile design system as the presentation layer. Every dialog is
 * an MSheet; every boolean is an MToggle.
 */

// Runtime health → dot colour on the icon tile (mobile status tokens).
const HEALTH: Record<string, string> = {
  active: 'bg-[color:var(--m-st-confirmed)]',
  starting: 'bg-[color:var(--m-st-info)] animate-pulse',
  error: 'bg-[color:var(--m-st-danger)]',
  inactive: 'bg-[color:var(--m-faint)]',
  disabled: 'bg-[color:var(--m-st-pending)]',
  incompatible: 'bg-[color:var(--m-st-pending)]',
}

// ── Chip / badge tone helpers (mobile status tokens) ────────────────────────
const CHIP_NEUTRAL = 'text-m-muted border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'
const CHIP_INFO = 'text-[color:var(--m-st-info)] border-[color:color-mix(in_srgb,var(--m-st-info)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-info)_10%,transparent)]'
const CHIP_PENDING = 'text-[color:var(--m-st-pending)] border-[color:color-mix(in_srgb,var(--m-st-pending)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_10%,transparent)]'
const PENDING_CARD = 'border-[color:color-mix(in_srgb,var(--m-st-pending)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_10%,transparent)]'
const ACT_PILL = 'inline-flex flex-none items-center justify-center gap-[5px] whitespace-nowrap rounded-full px-3 py-[7px] text-[0.6875rem] font-bold bg-m-act text-m-actfg disabled:opacity-50'

function ReviewedBadge({ t }: { t: T }) {
  return <ShieldCheck size={13} className="shrink-0 text-[color:var(--m-st-confirmed)]" aria-label={t('admin.plugins.reviewed')} />
}

/** Marks a manually-uploaded (sideloaded) plugin: no registry, unsigned, not reviewed. */
function SideloadedBadge({ t }: { t: T }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[2px] text-[11px] font-medium ${CHIP_PENDING}`}
      title={t('admin.plugins.sideloadedHint')}>
      <UploadCloud size={11} /> {t('admin.plugins.sideloaded')}
    </span>
  )
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
      <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[2px] text-[11px] font-medium ${CHIP_NEUTRAL}`}
        title={t('admin.plugins.signedHint')}>
        <KeyRound size={11} /> {t('admin.plugins.signed')}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[2px] text-[11px] font-medium ${CHIP_PENDING}`}
      title={t('admin.plugins.unsignedHint')}>
      <ShieldAlert size={11} /> {t('admin.plugins.unsigned')}
    </span>
  )
}

/** Marks a dev-linked plugin: loaded from a local build dir + hot-reloaded (dev only). */
function DevLinkBadge({ t }: { t: T }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[2px] text-[11px] font-medium ${CHIP_INFO}`}
      title={t('admin.plugins.devLinkHint')}>
      <Link2 size={11} /> {t('admin.plugins.devLinkBadge')}
    </span>
  )
}

function TypeBadge({ type, t }: { type: string; t: T }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[color:var(--m-ic)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-m-muted">
      {KNOWN_TYPES.includes(type) ? t(`admin.plugins.type.${type}` as never) : type}
    </span>
  )
}

export default function MAdminPluginsPanel() {
  const { t, locale } = useTranslation()
  const {
    bypass, settings, runtimeOn, devLink, linkPath, setLinkPath, plugins, loading, error, busy, view, setView,
    registry, latest, regById, signatureBlock, setSignatureBlock, retrusting, detailFor, setDetailFor, errorsFor,
    setErrorsFor, egressFor, setEgressFor, egressDraft, setEgressDraft, egressSaving, egressError, confirmUninstall,
    setConfirmUninstall, versionPicker, setVersionPicker, confirmDowngrade, setConfirmDowngrade, consentQueue,
    depResolve, setDepResolve, menu, setMenu, q, setQ, typeFilter, setTypeFilter, statusFilter, setStatusFilter,
    sort, setSort, dragActive, uploadInputRef, openDiscover, rescan, uploadPlugin, pickUpload, onDragEnter,
    onDragLeave, onDrop, openEgress, saveEgress, openInstanceSettings, openErrors, updateAvailable, resumeUpdates,
    newerIncompatible, install, restart, linkLocal, installedIds, toggle, runUpdate, openVersionPicker, pickVersion,
    updatable, updateAll, shownInstalled, shownRegistry, anyFilter, ignoreTrekRange, rowMenuPlugin, reviewBlock,
    askUninstall, uninstallConfirmed, downgradeConfirmed, retrustBlocked, consentUnsigned, approveConsent,
    deferConsent, downloadDependency,
  } = usePluginsAdmin()

  return (
    <div className="relative space-y-3"
      onDragEnter={onDragEnter} onDragOver={e => { if (dragActive) e.preventDefault() }} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Hidden input for the "Upload plugin" button (drag-drop uses the same handler). */}
      <input ref={uploadInputRef} type="file" accept=".zip,.tgz,.tar.gz" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void uploadPlugin(f); e.target.value = '' }} />
      {/* Drag-to-install overlay */}
      {dragActive && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2.5 rounded-[18px] border-2 border-dashed border-m-act bg-[color:color-mix(in_srgb,var(--m-sheetop)_85%,transparent)] backdrop-blur-[2px] pointer-events-none">
          <UploadCloud size={34} className="text-m-ink" />
          <span className="text-sm font-semibold text-m-ink">{t('admin.plugins.dropToUpload')}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[14px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-[0.9375rem] font-extrabold text-m-ink">
              <Puzzle size={16} strokeWidth={2.2} className="flex-none" />
              {t('admin.plugins.title')}
            </h2>
            <p className="mt-1 font-geist text-[0.625rem] leading-relaxed text-m-muted">{t('admin.plugins.subtitle')}</p>
          </div>
          <div className="flex flex-none items-center gap-1.5">
            {runtimeOn && ignoreTrekRange && (
              <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--m-st-pending)_14%,transparent)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--m-st-pending)]"
                title={t('admin.plugins.rangeBypass.pillHint')}>
                <AlertTriangle size={11} /> {t('admin.plugins.rangeBypass.pill')}
              </span>
            )}
            {runtimeOn && (
              <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--m-st-confirmed)_14%,transparent)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--m-st-confirmed)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--m-st-confirmed)]" /> {t('admin.plugins.runtimeOn')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Runtime-disabled notice */}
      {!runtimeOn && !loading && !error && (
        <div className={`flex items-start gap-3 rounded-[18px] border p-4 ${PENDING_CARD}`}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[color:var(--m-st-pending)]" />
          <div>
            <p className="text-[0.8125rem] font-bold text-m-ink">{t('admin.plugins.disabledTitle')}</p>
            <p className="mt-0.5 font-geist text-[0.625rem] leading-relaxed text-m-muted">{t('admin.plugins.disabledBody')}</p>
          </div>
        </div>
      )}

      {/* Dev-link: register + hot-reload a plugin from a local build dir (dev only). */}
      {devLink && runtimeOn && !loading && !error && (
        <form onSubmit={(e) => { e.preventDefault(); void linkLocal() }}
          className={`flex flex-col gap-2.5 rounded-[18px] border p-3 ${CHIP_INFO}`}>
          <div className="flex items-center gap-2 text-[color:var(--m-st-info)]" title={t('admin.plugins.devLinkHint')}>
            <Link2 size={15} />
            <span className="text-xs font-bold">{t('admin.plugins.devLinkTitle')}</span>
          </div>
          <input value={linkPath} onChange={(e) => setLinkPath(e.target.value)} spellCheck={false}
            placeholder={t('admin.plugins.devLinkPathPlaceholder')}
            className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint" />
          <MAdminButton onClick={() => void linkLocal()} disabled={!linkPath.trim() || busy === '__link'} className="self-start">
            <Link2 size={13} /> {t('admin.plugins.devLinkButton')}
          </MAdminButton>
        </form>
      )}

      {/* Toolbar */}
      {runtimeOn && !loading && !error && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <MSegmented
                value={view}
                onChange={(v) => { if (v === 'discover') openDiscover(); else setView('installed') }}
                options={[
                  { value: 'installed', label: <TabLabel text={t('admin.plugins.installed')} count={plugins.length} active={view === 'installed'} /> },
                  { value: 'discover', label: <TabLabel text={t('admin.plugins.tabDiscover')} count={registry?.length ?? undefined} active={view === 'discover'} /> },
                ]}
              />
            </div>
            <ToolIcon label={t('admin.plugins.upload')} onClick={pickUpload}><UploadCloud size={15} /></ToolIcon>
            <ToolIcon label={t('admin.plugins.rescan')} onClick={rescan}><RefreshCw size={15} /></ToolIcon>
          </div>

          <div className="relative">
            <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-m-faint" />
            <input
              value={q} onChange={e => setQ(e.target.value)} type="search"
              placeholder={t('admin.plugins.searchPlaceholder')}
              className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] ps-9 pe-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label={t('admin.plugins.filterType')} value={typeLabel(typeFilter, t)} active={typeFilter !== 'all'}
              icon={<SlidersHorizontal size={13} />} onClick={() => setMenu('type')} />
            {view === 'installed' && (
              <FilterPill label={t('admin.plugins.filterStatus')} value={statusLabel(statusFilter, t)} active={statusFilter !== 'all'}
                icon={<CircleDot size={13} />} onClick={() => setMenu('status')} />
            )}
            <FilterPill label={t('admin.plugins.sortBy')} value={sortLabel(sort, t)} active={sort !== 'name'}
              icon={<ArrowUpDown size={13} />} onClick={() => setMenu('sort')} />
          </div>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="py-14 text-center text-sm text-m-faint">{t('common.loading')}</div>
      ) : error ? (
        <div className="py-14 text-center text-sm text-[color:var(--m-st-danger)]">{t('admin.plugins.loadError')}</div>
      ) : !runtimeOn ? null : view === 'discover' ? (
        <RegistryList items={shownRegistry} busy={busy} t={t} installedIds={installedIds} ignoreTrekRange={ignoreTrekRange}
          onInstall={install} onOpenDetail={setDetailFor} filtered={anyFilter} />
      ) : plugins.length === 0 ? (
        <EmptyState t={t} onDiscover={openDiscover} />
      ) : (
        <div className="space-y-2">
          {updatable.length > 0 && statusFilter !== 'err' && (
            <div className={`flex items-center gap-2.5 rounded-[18px] border px-3.5 py-2.5 ${PENDING_CARD}`}>
              <ArrowUpCircle size={16} className="shrink-0 text-[color:var(--m-st-pending)]" />
              <span className="text-[0.6875rem] text-m-muted">{t('admin.plugins.updatesAvailable', { count: updatable.length })}</span>
              <button type="button" onClick={() => void updateAll()}
                className="ms-auto rounded-full bg-[color:var(--m-st-pending)] px-3 py-1.5 text-[0.6875rem] font-bold text-white">
                {t('admin.plugins.updateAll')}
              </button>
            </div>
          )}
          {shownInstalled.length === 0 ? (
            <div className="py-12 text-center">
              <Search size={26} className="mx-auto mb-3 text-m-faint" />
              <p className="text-sm text-m-faint">{t('admin.plugins.noMatchInstalled')}</p>
            </div>
          ) : shownInstalled.map(p => (
            <InstalledRow key={p.id} p={p} t={t} busy={busy}
              hasUpdate={updateAvailable(p)} latestVer={latest[p.id]}
              newerIncompatible={newerIncompatible(p)}
              blocked={blockIsCurrent(p, latest[p.id])}
              onToggle={() => toggle(p)}
              onUpdate={() => runUpdate(p)}
              onResume={() => void resumeUpdates(p)}
              onReviewBlock={() => reviewBlock(p)}
              onEgress={() => openEgress(p.id)}
              onMenu={() => setMenu(`row:${p.id}`)} />
          ))}
        </div>
      )}

      <SecurityInfo t={t} />

      {/* Registry detail sheet */}
      {detailFor && (
        <PluginDetailSheet item={detailFor} t={t} locale={locale} busy={busy} ignoreTrekRange={ignoreTrekRange}
          installed={installedIds.has(detailFor.id)} onInstall={install} onClose={() => setDetailFor(null)} />
      )}

      {/* TREK_PLUGINS_IGNORE_TREK_RANGE: confirm before a registry install the server would
          otherwise refuse (onConfirm set), or a plain notice after a path that could not
          ask first — sideload, dev-link, update, dependency download. */}
      {bypass.copy && (
        <MConfirmSheet open onClose={bypass.dismiss} onConfirm={bypass.copy.confirm ? bypass.confirm : undefined}
          title={bypass.copy.title} message={bypass.copy.body}
          confirmLabel={t('admin.plugins.installAnyway')} cancelLabel={bypass.copy.confirm ? t('common.cancel') : t('common.ok')} danger />
      )}

      {/* Row ⋯ action sheet */}
      {rowMenuPlugin && (
        <RowActionsSheet p={rowMenuPlugin} t={t} onClose={() => setMenu(null)}
          onRestart={() => restart(rowMenuPlugin.id)}
          onErrors={() => openErrors(rowMenuPlugin.id)}
          onEgress={() => openEgress(rowMenuPlugin.id)}
          onSettings={() => openInstanceSettings(rowMenuPlugin)}
          onChangeVersion={() => openVersionPicker(rowMenuPlugin)}
          onUninstall={() => askUninstall(rowMenuPlugin)} />
      )}

      {/* Version picker sheet */}
      {versionPicker && (
        <VersionPickerSheet plugin={versionPicker.plugin} versions={versionPicker.versions} failed={versionPicker.failed}
          busy={busy} t={t} locale={locale} onPick={pickVersion} onClose={() => setVersionPicker(null)} />
      )}

      {/* Downgrade confirm */}
      <MConfirmSheet
        open={!!confirmDowngrade}
        onClose={() => setConfirmDowngrade(null)}
        onConfirm={downgradeConfirmed}
        title={t('admin.plugins.downgradeTitle')}
        message={t('admin.plugins.downgradeBody', { from: confirmDowngrade?.plugin.version ?? '', to: confirmDowngrade?.version ?? '' })}
        confirmLabel={t('admin.plugins.downgradeConfirm')}
        cancelLabel={t('common.cancel')}
        danger
      />

      {/* Filter picker sheets */}
      <PickerSheet
        open={menu === 'type'} onClose={() => setMenu(null)} title={t('admin.plugins.filterType')} value={typeFilter}
        options={[
          ['all', t('admin.plugins.allTypes')], ['widget', t('admin.plugins.type.widget')],
          ['integration', t('admin.plugins.type.integration')], ['page', t('admin.plugins.type.page')],
          ['trip-page', t('admin.plugins.type.trip-page')],
        ]}
        onPick={v => setTypeFilter(v as TypeFilter)} />
      <PickerSheet
        open={menu === 'status'} onClose={() => setMenu(null)} title={t('admin.plugins.filterStatus')} value={statusFilter}
        options={[
          ['all', t('admin.plugins.allStatuses')], ['on', t('admin.plugins.status.active')], ['off', t('admin.plugins.stateOff')],
          ['update', t('admin.plugins.filterUpdate')], ['err', t('admin.plugins.status.error')],
        ]}
        onPick={v => setStatusFilter(v as StatusFilter)} />
      <PickerSheet
        open={menu === 'sort'} onClose={() => setMenu(null)} title={t('admin.plugins.sortBy')} value={sort}
        options={view === 'discover'
          ? [['name', t('admin.plugins.sortName')], ['recent', t('admin.plugins.sortRecent')], ['downloads', t('admin.plugins.sortDownloads')]]
          : [['name', t('admin.plugins.sortName')], ['recent', t('admin.plugins.sortRecent')], ['updates', t('admin.plugins.sortUpdates')]]}
        onPick={v => setSort(v as SortKey)} />

      {/* Error-log sheet */}
      {errorsFor && (
        <MSheet open onClose={() => setErrorsFor(null)} variant="bottom" material="opaque" ariaLabel={t('admin.plugins.errorLog')}>
          <MAdminSheetFrame
            title={<span className="flex items-center gap-2"><Bug size={15} /> {errorsFor.id} — {t('admin.plugins.errorLog')}</span>}
            onClose={() => setErrorsFor(null)}
          >
            <div className="font-mono text-[0.6875rem]">
              {errorsFor.rows.length === 0 ? <p className="py-4 text-center text-m-faint">{t('admin.plugins.noErrors')}</p> :
                errorsFor.rows.map((r, i) => (
                  <div key={i} className="flex gap-2 border-b border-[color:var(--m-rowbr)] py-1.5 last:border-0">
                    <span className={`shrink-0 font-semibold ${r.level === 'error' ? 'text-[color:var(--m-st-danger)]' : 'text-[color:var(--m-st-pending)]'}`}>{r.level}</span>
                    <span className="shrink-0 text-m-faint">{r.ts}</span>
                    <span className="break-all text-m-muted">{r.message}</span>
                  </div>
                ))}
            </div>
          </MAdminSheetFrame>
        </MSheet>
      )}

      {/* Operator-supplied egress hosts */}
      {egressFor && (
        <MSheet open onClose={() => setEgressFor(null)} variant="bottom" material="opaque" ariaLabel={t('admin.plugins.allowedHosts')}>
          <MAdminSheetFrame
            title={<span className="flex items-center gap-2"><Globe size={15} /> {egressFor.id} — {t('admin.plugins.allowedHosts')}</span>}
            onClose={() => setEgressFor(null)}
          >
            {!egressFor.supported ? (
              <p className="text-sm text-m-faint">{t('admin.plugins.allowedHosts.unsupported')}</p>
            ) : (
              <div className="space-y-3">
                <p className="font-geist text-[0.625rem] text-m-faint">{t('admin.plugins.allowedHosts.hint')}</p>
                {egressFor.hosts.length === 0 && (
                  <p className="text-sm italic text-m-faint">{t('admin.plugins.allowedHosts.none')}</p>
                )}
                {egressFor.hosts.map(h => (
                  <div key={h} className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--m-rowbr)] px-3 py-2">
                    <span className="break-all font-mono text-sm text-m-ink">{h}</span>
                    <button type="button"
                      disabled={egressSaving}
                      onClick={() => saveEgress(egressFor.hosts.filter(x => x !== h))}
                      className="text-m-faint disabled:opacity-50"
                      aria-label={t('common.delete')}
                    ><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={egressDraft}
                    onChange={e => setEgressDraft(e.target.value)}
                    placeholder="gotify.example.com"
                    className="h-[42px] min-w-0 flex-1 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)]"
                  />
                  <MAdminButton
                    disabled={egressSaving || !egressDraft.trim()}
                    onClick={() => saveEgress([...egressFor.hosts, egressDraft.trim()])}
                    className="h-[42px]"
                  >{t('common.add')}</MAdminButton>
                </div>
                {egressError && <p className="text-[0.6875rem] text-[color:var(--m-st-danger)]">{egressError}</p>}
                <p className="font-geist text-[0.625rem] text-m-faint">{t('admin.plugins.allowedHosts.restartNote')}</p>
              </div>
            )}
          </MAdminSheetFrame>
        </MSheet>
      )}

      {/* Instance-wide settings (the admin-owned scope:'instance' fields) */}
      {settings.form && (
        <MSheet open onClose={settings.close} variant="bottom" material="opaque" ariaLabel={t('admin.plugins.instanceSettings')}>
          <MAdminSheetFrame
            title={<span className="flex items-center gap-2"><SlidersHorizontal size={15} /> {settings.form.id} — {t('admin.plugins.instanceSettings')}</span>}
            onClose={settings.close}
          >
            <div className="space-y-4">
              {settings.form.fields.map(f => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-sm font-medium text-m-ink">
                    {f.label || f.key}{f.required && <span className="text-[color:var(--m-st-danger)]"> *</span>}
                  </span>
                  {f.input_type === 'checkbox' ? (
                    <MToggle
                      checked={settings.form.values[f.key] === true}
                      onChange={on => settings.setValue(f.key, on)}
                      ariaLabel={f.label || f.key}
                    />
                  ) : f.input_type === 'select' && f.options ? (
                    <select
                      value={String(settings.form.values[f.key] ?? '')}
                      onChange={e => settings.setValue(f.key, e.target.value)}
                      className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none focus:border-[color:var(--m-faint)]"
                    >
                      <option value="">—</option>
                      {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.secret ? 'password' : (f.input_type === 'number' ? 'number' : 'text')}
                      value={String(settings.form.values[f.key] ?? '')}
                      placeholder={f.placeholder || ''}
                      autoComplete={f.secret ? 'new-password' : 'off'}
                      onChange={e => settings.setValue(f.key, e.target.value)}
                      className="h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)]"
                    />
                  )}
                  {f.hint && <span className="mt-1 block font-geist text-[0.625rem] text-m-faint">{f.hint}</span>}
                </label>
              ))}
              {(() => {
                const form = settings.form
                if (!form || form.actions.length === 0) return null
                return (
                  <div className="border-t border-[color:var(--m-rowbr)] pt-4">
                    <span className="mb-2 block font-geist text-[0.625rem] font-bold uppercase tracking-wide text-m-faint">
                      {t('admin.plugins.actions')}
                    </span>
                    {!form.active && (
                      <p className="mb-2 font-geist text-[0.625rem] text-m-faint">{t('admin.plugins.actions.inactive')}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      {form.actions.map(a => {
                        const res = settings.actionResult[a.key]
                        return (
                          <div key={a.key} className="flex flex-wrap items-center gap-2">
                            <MAdminButton
                              variant={a.danger ? 'danger' : 'ghost'}
                              busy={settings.runningAction === a.key}
                              disabled={!form.active || settings.runningAction !== null || settings.saving}
                              onClick={() => settings.runAction(a)}
                            >
                              {a.label}
                            </MAdminButton>
                            {a.hint && <span className="font-geist text-[0.625rem] text-m-faint">{a.hint}</span>}
                            {res && (
                              <span aria-live="polite" className={`text-[0.625rem] font-bold ${res.ok ? 'text-[color:var(--m-st-confirmed)]' : 'text-[color:var(--m-st-danger)]'}`}>
                                {res.message || (res.ok ? t('common.success') : t('common.error'))}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              {settings.error && <p className="text-[0.6875rem] text-[color:var(--m-st-danger)]">{settings.error}</p>}
              <MAdminButton disabled={settings.saving || settings.runningAction !== null} onClick={() => void settings.save()} className="h-[42px] w-full">
                {t('common.save')}
              </MAdminButton>
            </div>
          </MAdminSheetFrame>
        </MSheet>
      )}

      {/* Uninstall confirm */}
      <MConfirmSheet
        open={!!confirmUninstall}
        onClose={() => setConfirmUninstall(null)}
        onConfirm={uninstallConfirmed}
        title={t('admin.plugins.uninstallTitle')}
        message={t('admin.plugins.uninstallBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
      />

      {/* Instance action confirm */}
      <MConfirmSheet
        open={settings.pendingAction !== null}
        onClose={settings.cancelPendingAction}
        onConfirm={settings.confirmPendingAction}
        title={settings.pendingAction?.label ?? ''}
        message={t('admin.plugins.actions.confirm')}
        confirmLabel={settings.pendingAction?.label}
        cancelLabel={t('common.cancel')}
        danger
      />

      {signatureBlock && (
        <SignatureBlockSheet
          data={signatureBlock} entry={regById[signatureBlock.subject.id]} busy={retrusting} t={t}
          onRetrust={retrustBlocked}
          onClose={() => setSignatureBlock(null)}
        />
      )}

      {consentQueue[0] && (
        <UpdateConsentSheet
          data={consentQueue[0]} t={t}
          unsigned={consentUnsigned}
          onApprove={approveConsent}
          onLater={deferConsent}
        />
      )}

      {depResolve && (
        <DependencyResolveSheet
          data={depResolve} t={t} busy={busy === depResolve.plugin.id} installedIds={installedIds}
          onDownload={downloadDependency}
          onClose={() => setDepResolve(null)}
        />
      )}
    </div>
  )
}

// ── Toolbar bits ────────────────────────────────────────────────────────────

function TabLabel({ text, count, active }: { text: string; count?: number; active: boolean }) {
  return (
    <span className="inline-flex items-center gap-[6px]">
      {text}
      {count != null && (
        <span className={`inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold tabular-nums ${
          active ? 'bg-[color:color-mix(in_srgb,var(--m-actfg)_20%,transparent)] text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'}`}>{count}</span>
      )}
    </span>
  )
}

function ToolIcon({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label}
      className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted">
      {children}
    </button>
  )
}

function FilterPill({ label, value, active, icon, onClick }: { label: string; value: string; active: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={`${label}: ${value}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-[7px] text-[0.71875rem] font-semibold ${
        active ? 'border-[color:var(--m-faint)] bg-[color:var(--m-ic)] text-m-ink' : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'}`}>
      {icon}
      <span>{value}</span>
      <ChevronDown size={12} className="text-m-faint" />
    </button>
  )
}

function typeLabel(f: TypeFilter, t: T): string {
  return f === 'all' ? t('admin.plugins.allTypes') : t(`admin.plugins.type.${f}` as never)
}

function PickerSheet({ open, onClose, title, options, value, onPick }: {
  open: boolean; onClose: () => void; title: string
  options: Array<[string, string]>; value: string; onPick: (v: string) => void
}) {
  return (
    <MSheet open={open} onClose={onClose} variant="bottom" material="opaque" ariaLabel={title}>
      <MAdminSheetFrame title={title} onClose={onClose}>
        <div className="space-y-1">
          {options.map(([v, lbl]) => (
            <button key={v} type="button" onClick={() => { onPick(v); onClose() }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-start text-[0.8125rem] ${
                value === v ? 'bg-[color:var(--m-ic)] font-bold text-m-ink' : 'font-medium text-m-muted'}`}>
              <span className="min-w-0 flex-1 truncate">{lbl}</span>
              <Check size={16} className={`text-m-ink ${value === v ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </MAdminSheetFrame>
    </MSheet>
  )
}

// ── Installed row ──────────────────────────────────────────────────────────

function InstalledRow({ p, t, busy, hasUpdate, latestVer, newerIncompatible, blocked, onToggle, onUpdate, onResume, onReviewBlock, onEgress, onMenu }: {
  p: PluginRow; t: T; busy: string | null
  hasUpdate: boolean; latestVer?: string; newerIncompatible: { version: string; range: string } | null; blocked: boolean
  onToggle: () => void; onUpdate: () => void; onResume: () => void; onReviewBlock: () => void
  onEgress: () => void; onMenu: () => void
}) {
  const caps = deriveCaps(parseJson<string[]>(p.permissions, []), parseJson<{ widget?: { slot?: string } }>(p.capabilities, {}), t)
  const deps = deriveDeps(p, t)

  return (
    <div className="rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[14px]">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="grid h-[46px] w-[46px] place-items-center rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
            <PluginIcon name={p.icon} size={22} className="text-m-muted" />
          </div>
          <span className={`absolute -bottom-0.5 -end-0.5 h-[13px] w-[13px] rounded-full ring-[2.5px] ring-[color:var(--m-sheetop)] ${HEALTH[p.status] || HEALTH.inactive}`}
            title={t(`admin.plugins.status.${p.status}` as never)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.90625rem] font-bold tracking-[-.006em] text-m-ink">{p.name}</span>
            {p.version && <span className="text-[11.5px] font-medium tabular-nums text-m-faint">v{p.version}</span>}
            {p.reviewed_at && <ReviewedBadge t={t} />}
            {p.source_repo === 'local:upload' && <SideloadedBadge t={t} />}
            {p.source_repo === 'local:link' && <DevLinkBadge t={t} />}
            {/* Registry plugins only — a sideloaded/dev-linked plugin already says something
                strictly stronger, and stacking "Unsigned" on top of it just dilutes the amber. */}
            {isRegistrySourced(p.source_repo) && <TrustBadge signed={!!p.signed} t={t} />}
          </div>
          {p.description && <p className="mt-0.5 truncate text-[12.5px] text-m-muted">{p.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <MToggle checked={p.enabled === 1} ariaLabel={t('admin.plugins.enabledToggle')} onChange={onToggle} />
          <button type="button" onClick={onMenu} data-testid={`plugin-row-menu-btn-${p.id}`}
            className="grid h-[34px] w-[34px] place-items-center rounded-lg text-m-faint">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* A refused update leaves a WORKING plugin pinned at its old version — so this is
          its own row state, not an error state, and it persists until it is resolved
          rather than dying with the toast that first reported it. */}
      {blocked && p.updateBlock && (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[color:var(--m-st-pending)]">
          <ShieldAlert size={13} className="shrink-0" />
          <span className="truncate">{t('admin.plugins.updateBlocked', { reason: p.updateBlock.detail ?? p.updateBlock.code })}</span>
          <button type="button" onClick={onReviewBlock}
            className="shrink-0 font-semibold underline underline-offset-2">
            {t('admin.plugins.reviewBlock')}
          </button>
        </div>
      )}

      {/* A newer version this TREK can't run — informational, never a button: the fix
          is a TREK upgrade, so the row must not nag or offer a doomed install. */}
      {newerIncompatible && (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-m-faint">
          <Info size={13} className="shrink-0" />
          <span className="truncate">{t('admin.plugins.newerNeedsTrek', { version: newerIncompatible.version, range: newerIncompatible.range })}</span>
        </div>
      )}

      {/* Held: the admin deliberately installed a non-latest version, so updates are
          paused rather than nagged — resuming is one click, right where the pause shows. */}
      {p.updateHold && (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-m-faint">
          <PauseCircle size={13} className="shrink-0" />
          <span className="truncate">{t('admin.plugins.updatesHeld', { version: p.version ?? '' })}</span>
          <button type="button" onClick={onResume} disabled={busy === p.id}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50">
            {t('admin.plugins.resumeUpdates')}
          </button>
        </div>
      )}

      {p.status === 'error' && p.last_error ? (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[color:var(--m-st-danger)]">
          <AlertTriangle size={13} className="shrink-0" /><span className="truncate">{p.last_error}</span>
        </div>
      ) : (caps.length > 0 || p.operatorEgress) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {caps.map((c, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium ${c.net ? CHIP_INFO : CHIP_NEUTRAL}`}>
              <c.icon size={12} className={c.net ? 'text-[color:var(--m-st-info)]' : 'text-m-faint'} />{c.label}
            </span>
          ))}
          {/* This plugin talks to a service only the OPERATOR can name (a self-hosted
              Gotify/ntfy), so its manifest can't list the host — the admin adds it.
              Actionable, and warning-toned until at least one host exists, because
              until then the plugin cannot reach anything and looks silently broken. */}
          {p.operatorEgress && (
            <button type="button"
              onClick={onEgress}
              title={t('admin.plugins.allowedHosts.hint')}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium ${p.egressHostCount > 0 ? CHIP_INFO : CHIP_PENDING}`}
            >
              <Globe size={12} className={p.egressHostCount > 0 ? 'text-[color:var(--m-st-info)]' : 'text-[color:var(--m-st-pending)]'} />
              {p.egressHostCount > 0
                ? t('admin.plugins.allowedHosts.count', { n: p.egressHostCount })
                : t('admin.plugins.allowedHosts.add')}
            </button>
          )}
        </div>
      )}

      {deps.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {deps.map((d, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium ${d.blocked || d.warn ? CHIP_PENDING : CHIP_NEUTRAL}`}>
              <d.icon size={12} className={d.blocked || d.warn ? 'text-[color:var(--m-st-pending)]' : 'text-m-faint'} />{d.label}
            </span>
          ))}
        </div>
      )}

      {hasUpdate && (
        <div className="mt-2.5 border-t border-[color:var(--m-rowbr)] pt-2.5">
          <button type="button" onClick={onUpdate} disabled={busy === p.id} title={t('admin.plugins.updateTo', { version: latestVer })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold disabled:opacity-50 ${CHIP_PENDING}`}>
            <ArrowUpCircle size={13} /> {t('admin.plugins.updateTo', { version: latestVer })}
          </button>
        </div>
      )}
    </div>
  )
}

// Row ⋯ action sheet — the desktop portal menu re-expressed as a bottom sheet.
function RowActionsSheet({ p, t, onClose, onRestart, onErrors, onEgress, onSettings, onChangeVersion, onUninstall }: {
  p: PluginRow; t: T; onClose: () => void
  onRestart: () => void; onErrors: () => void; onEgress: () => void; onSettings: () => void; onChangeVersion: () => void; onUninstall: () => void
}) {
  const linkable = p.source_repo && p.source_repo !== 'local:upload' && p.source_repo !== 'local:link'
  const rowClass = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-start text-[0.8125rem] font-semibold text-m-ink'
  return (
    <MSheet open onClose={onClose} variant="bottom" material="opaque" ariaLabel={p.name}>
      <MAdminSheetFrame title={p.name} onClose={onClose}>
        <div className="space-y-1">
          {p.enabled === 1 && (
            <button type="button" className={rowClass} onClick={onRestart}><RotateCw size={16} /> {t('admin.plugins.restart')}</button>
          )}
          {/* A plugin gets the action if it declares scope:'instance' fields OR actions —
              an action-only plugin still needs the sheet to run them. */}
          {((p.instanceSettingsCount ?? 0) > 0 || (p.instanceActionsCount ?? 0) > 0) && (
            <button type="button" className={rowClass} onClick={onSettings}><SlidersHorizontal size={16} /> {t('admin.plugins.instanceSettings')}</button>
          )}
          <button type="button" className={rowClass} onClick={onErrors}><Bug size={16} /> {t('admin.plugins.viewErrors')}</button>
          {/* Only a plugin that DECLARED operatorEgress gets the action — an admin must
              never be invited to widen egress for a plugin that didn't ask for it
              (same rule the row's egress chip follows). */}
          {p.operatorEgress && (
            <button type="button" className={rowClass} onClick={onEgress}><Globe size={16} /> {t('admin.plugins.allowedHosts')}</button>
          )}
          {/* Registry plugins only — a sideload/dev-link has no registry versions to pick from. */}
          {isRegistrySourced(p.source_repo) && (
            <button type="button" className={rowClass} onClick={onChangeVersion}><History size={16} /> {t('admin.plugins.changeVersion')}</button>
          )}
          {linkable && (
            <>
              <a href={`https://github.com/${p.source_repo}`} target="_blank" rel="noreferrer" onClick={onClose} className={rowClass}>
                <Github size={16} /> {t('admin.plugins.sourceRepo')}
              </a>
              <a href={`https://github.com/${p.source_repo}/issues`} target="_blank" rel="noreferrer" onClick={onClose} className={rowClass}>
                <CircleDot size={16} /> {t('admin.plugins.reportIssue')}
              </a>
            </>
          )}
          <div className="my-1 border-t border-[color:var(--m-rowbr)]" />
          <button type="button" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-start text-[0.8125rem] font-semibold text-[color:var(--m-st-danger)]" onClick={onUninstall}>
            <Trash2 size={16} /> {t('common.delete')}
          </button>
        </div>
      </MAdminSheetFrame>
    </MSheet>
  )
}

/**
 * "Change version…" for an INSTALLED plugin. Rows render the server's per-version compat
 * verdict: the installed version is marked, a compatible one gets a Switch action (the
 * caller routes a DOWNGRADE through the data-risk confirm), an incompatible one is
 * explained and never offered.
 */
function VersionPickerSheet({ plugin, versions, failed, busy, t, locale, onPick, onClose }: {
  plugin: PluginRow; versions: VersionInfo[] | null; failed: boolean; busy: string | null
  t: T; locale: string; onPick: (version: string) => void; onClose: () => void
}) {
  return (
    <MSheet open onClose={onClose} variant="bottom" material="opaque" ariaLabel={t('admin.plugins.versionPickerTitle', { name: plugin.name })}>
      <MAdminSheetFrame title={t('admin.plugins.versionPickerTitle', { name: plugin.name })} onClose={onClose}>
        <div className="space-y-0.5">
          {failed && <p className="px-2.5 py-2 text-xs text-[color:var(--m-st-danger)]">{t('admin.plugins.detailError')}</p>}
          {!failed && !versions && <p className="px-2.5 py-2 text-xs text-m-faint">{t('common.loading')}</p>}
          {versions?.length === 0 && <p className="px-2.5 py-2 text-xs text-m-faint">{t('admin.plugins.noVersions')}</p>}
          {versions?.map(v => {
            const current = v.version === plugin.version
            return (
              <div key={v.version} data-testid={`version-row-${v.version}`}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5">
                <span className={`text-[13px] font-semibold tabular-nums ${v.compatible ? 'text-m-ink' : 'text-m-faint'}`}>v{v.version}</span>
                {v.publishedAt && <span className="text-[11.5px] text-m-faint">{new Date(v.publishedAt).toLocaleDateString(locale)}</span>}
                {v.signed && <ShieldCheck size={13} className="shrink-0 text-[color:var(--m-st-confirmed)]" />}
                <span className="ms-auto" />
                {current ? (
                  <span className="text-[11.5px] font-medium text-m-faint">{t('admin.plugins.installed')}</span>
                ) : v.compatible ? (
                  <button type="button" onClick={() => onPick(v.version)} disabled={busy === plugin.id}
                    className="rounded-full border border-[color:var(--m-rowbr)] px-2.5 py-1 text-[11.5px] font-bold text-m-muted disabled:opacity-50">
                    {t('admin.plugins.versionSwitch', { version: v.version })}
                  </button>
                ) : (
                  <span className="text-[11.5px] text-m-faint">{t('admin.plugins.versionNeedsTrek', { range: v.trek ?? '' })}</span>
                )}
              </div>
            )
          })}
        </div>
      </MAdminSheetFrame>
    </MSheet>
  )
}

// ── Registry (Discover) ────────────────────────────────────────────────────

function EmptyState({ t, onDiscover }: { t: T; onDiscover: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--m-ic)]">
        <PackageOpen size={26} className="text-m-faint" />
      </div>
      <p className="text-sm font-medium text-m-muted">{t('admin.plugins.empty')}</p>
      <button type="button" onClick={onDiscover} className={`mt-4 ${ACT_PILL}`}>
        <Download size={14} /> {t('admin.plugins.tabDiscover')}
      </button>
    </div>
  )
}

function Screenshot({ url, className, iconSize = 28 }: { url: string | null; className: string; iconSize?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`overflow-hidden bg-[color:var(--m-ic)] ${className}`}>
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Blocks size={iconSize} className="text-m-faint" />
        </div>
      )}
    </div>
  )
}

function RegistryList({ items, onInstall, onOpenDetail, busy, t, installedIds, filtered, ignoreTrekRange }: {
  items: RegistryItem[] | null
  onInstall: (id: string, version?: string, warn?: RangeWarning) => void
  onOpenDetail: (item: RegistryItem) => void
  busy: string | null
  t: T
  installedIds: Set<string>
  filtered: boolean
  ignoreTrekRange: boolean
}) {
  if (!items) return <div className="py-14 text-center text-sm text-m-faint">{t('common.loading')}</div>
  if (items.length === 0) return (
    <div className="py-14 text-center">
      <Search size={26} className="mx-auto mb-3 text-m-faint" />
      <p className="text-sm text-m-faint">{filtered ? t('admin.plugins.noMatchRegistry') : t('admin.plugins.registryEmpty')}</p>
    </div>
  )
  return (
    <div className="space-y-3">
      {items.map(item => {
        const installed = installedIds.has(item.id)
        const offer = installOffer(item, t, ignoreTrekRange)
        return (
          <div key={item.id} role="button" tabIndex={0} onClick={() => onOpenDetail(item)}
            // Same press-scale opt-out as the desktop Discover card (#2158).
            data-no-press
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(item) } }}
            className="overflow-hidden rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)]">
            <div className="relative">
              <Screenshot url={item.screenshotUrl} className="aspect-[16/10]" iconSize={24} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              {item.reviewedAt && (
                <span className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur-sm">
                  <ShieldCheck size={12} /> {t('admin.plugins.reviewed')}
                </span>
              )}
              <div className="absolute -bottom-4 start-3 z-[1] grid h-11 w-11 place-items-center rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] shadow-[0_5px_12px_-8px_rgba(0,0,0,.4)]">
                <PluginIcon name={item.icon} size={22} className="text-m-muted" />
              </div>
            </div>
            <div className="flex flex-col px-3.5 pb-3.5 pt-6">
              <span className="truncate text-sm font-bold tracking-[-.006em] text-m-ink">{item.name}</span>
              <span className="mt-0.5 text-[11.5px] text-m-faint">{item.author}</span>
              <p className="mt-2 line-clamp-2 text-xs text-m-muted">{item.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <TypeBadge type={item.type} t={t} />
                {/* Everything in Discover is registry-sourced, so the badge always applies. */}
                <TrustBadge signed={!!item.signed} t={t} />
                {item.latest && <span className="text-[10.5px] tabular-nums text-m-faint">v{item.latest}</span>}
                {typeof item.downloadCount === 'number' && item.downloadCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] tabular-nums text-m-faint" title={t('admin.plugins.downloads')}>
                    <Download size={11} /> {formatCompactCount(item.downloadCount)}
                  </span>
                )}
                <button type="button" onClick={e => { e.stopPropagation(); onInstall(item.id, offer.version, offer.warn) }}
                  disabled={busy === item.id || installed || offer.blocked}
                  title={installed ? undefined : offer.title}
                  className={`ms-auto ${ACT_PILL}`}>
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

// A permission rendered human-readable when known, else as its raw code.
function PermLabel({ perm, t }: { perm: string; t: T }) {
  return PERM_KEYS.includes(perm)
    ? <span>{t(`admin.plugins.perm.${perm}` as never)}</span>
    : <code className="rounded bg-[color:var(--m-ic)] px-1.5 py-0.5 font-mono text-[11px]">{perm}</code>
}

function PluginDetailSheet({ item, installed, busy, onInstall, onClose, t, locale, ignoreTrekRange }: {
  item: RegistryItem; installed: boolean; busy: string | null; ignoreTrekRange: boolean
  onInstall: (id: string, version?: string, warn?: RangeWarning) => void; onClose: () => void; t: T; locale: string
}) {
  const { detail, failed } = usePluginDetail<MRegistryDetail>(item.id)

  const manifest = detail?.manifest ?? null
  const caps = manifest ? deriveCaps(manifest.permissions, manifest.capabilities ?? {}, t) : []
  const repoUrl = `https://github.com/${item.repo}`
  const homepage = item.homepage && /^https?:\/\//i.test(item.homepage) && item.homepage !== repoUrl ? item.homepage : null
  const sizeKb = detail?.size ? Math.max(1, Math.round(detail.size / 1024)) : null
  // The detail fetch carries the same compat verdict as the browse list; prefer it once
  // it lands (it is keyed to the same entry) and fall back to the grid item until then.
  const offer = installOffer(detail ?? item, t, ignoreTrekRange)
  const linkClass = 'inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-1.5 text-xs font-medium text-m-muted'
  const sectionH = 'text-[11px] font-semibold uppercase tracking-wider text-m-muted'

  return (
    <MSheet open onClose={onClose} variant="card" material="opaque" ariaLabel={item.name}>
      <div className="relative flex-none">
        <Screenshot url={item.screenshotUrl} className="aspect-[16/9] w-full" iconSize={36} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-black/40 text-white"><X size={16} /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative z-[1] -mt-7 flex items-start gap-3 px-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[15px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] shadow-[0_5px_12px_-8px_rgba(0,0,0,.4)]">
            <PluginIcon name={manifest?.icon ?? null} size={28} className="text-m-muted" />
          </div>
          <div className="min-w-0 flex-1 pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-m-ink">{item.name}</h3>
              {item.reviewedAt && <ReviewedBadge t={t} />}
            </div>
            <p className="mt-0.5 text-[12.5px] text-m-faint">{item.author}{item.latest ? ` · v${item.latest}` : ''}</p>
          </div>
          <button type="button" onClick={() => onInstall(item.id, offer.version, offer.warn)}
            disabled={busy === item.id || installed || offer.blocked}
            title={installed ? undefined : offer.title}
            className={`${ACT_PILL} self-end`}>
            {installed ? t('admin.plugins.installed') : offer.label}
          </button>
        </div>

        <div className="px-4 pb-5 pt-4">
          <p className="text-[13.5px] leading-relaxed text-m-muted">{item.description}</p>
          {failed && <p className="mt-3 text-xs text-[color:var(--m-st-danger)]">{t('admin.plugins.detailError')}</p>}
          {/* The reason the button is blocked (or offering an older version) — a tooltip
              alone would leave a touch user with a dead button and no explanation. */}
          {offer.title && !installed && (
            <p className={`mt-3 flex items-start gap-1.5 rounded-lg border px-2.5 py-2 text-xs ${CHIP_PENDING}`}>
              <AlertTriangle size={13} className="mt-[1px] shrink-0" /> {offer.title}
            </p>
          )}

          {manifest && (
            <div className="mt-5">
              <h4 className={sectionH}>{t('admin.plugins.accessTitle')}</h4>
              {caps.filter(c => !c.net).length === 0 && !manifest.permissions.includes('db:own') ? (
                <p className="mt-2 text-xs text-m-faint">{t('admin.plugins.noAccess')}</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {caps.filter(c => !c.net).map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-0.5 text-[13px] text-m-muted">
                      <c.icon size={15} className="mt-0.5 shrink-0 text-[color:var(--m-st-info)]" /><span>{c.label}</span>
                    </div>
                  ))}
                  {manifest.permissions.includes('db:own') && (
                    <div className="flex items-start gap-2.5 py-0.5 text-[13px] text-m-muted">
                      <Database size={15} className="mt-0.5 shrink-0 text-[color:var(--m-st-info)]" /><span>{t('admin.plugins.perm.db:own')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* The tool text a plugin publishes goes straight into every user's
              assistant context once mcp:tools is granted, and nothing else in
              this dialog shows it. An admin approving the grant should read the
              names and descriptions first, not discover them in a chat. */}
          {manifest && (manifest.capabilities?.mcpTools?.length ?? 0) > 0 && (
            <div className="mt-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{t('admin.plugins.mcpToolsTitle')}</h4>
              <ul className="mt-2 space-y-1.5">
                {(manifest.capabilities?.mcpTools ?? []).map(tool => (
                  <li key={tool.name} className="flex items-start gap-2.5 py-0.5">
                    <Bot size={15} className="text-accent mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <code className="text-[12px] font-mono text-content">{tool.name}</code>
                      {tool.title && <p className="text-[12.5px] font-medium text-content leading-snug">{tool.title}</p>}
                      {/* The description is the assistant-facing text: it is what the
                          model reads to decide whether to call the tool, so it is the
                          line an admin most needs to see. Never hidden behind a title. */}
                      <p className="text-[12.5px] text-content-secondary leading-snug">{tool.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-[11.5px] text-content-faint mt-2">{t('admin.plugins.mcpToolsHint')}</p>
            </div>
          )}

          {manifest && (
            <PluginPoiCategoryList pluginId={item.id} permissions={manifest.permissions} categories={manifest.capabilities?.poiCategories}
              className="mt-5" titleClassName={sectionH} itemClassName="text-[13px] text-m-muted" />
          )}

          {manifest && (manifest.egress.length > 0 || manifest.operatorEgress) && (
            <div className="mt-5">
              <h4 className={sectionH}>{t('admin.plugins.connectsTitle')}</h4>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {manifest.egress.map(h => (
                  <code key={h} className="rounded-md bg-[color:color-mix(in_srgb,var(--m-st-info)_10%,transparent)] px-2 py-1 font-mono text-[12px] text-[color:var(--m-st-info)]">{h}</code>
                ))}
                {/* The hosts above are NOT the whole story for this plugin: it talks to a
                    service only the operator can name, so its reach is whatever an admin
                    adds after install. Say so HERE — this is the pre-install review, and a
                    reviewer who reads only the host list would otherwise be misled. */}
                {manifest.operatorEgress && (
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] font-medium ${CHIP_PENDING}`}>
                    <Globe size={12} />{t('admin.plugins.operatorEgressPill')}
                  </span>
                )}
              </div>
              {manifest.operatorEgress && (
                <p className="mt-2 text-[11.5px] text-m-faint">{t('admin.plugins.operatorEgressHint')}</p>
              )}
            </div>
          )}

          {manifest && manifest.settings.length > 0 && (
            <div className="mt-5">
              <h4 className={sectionH}>{t('admin.plugins.setupTitle')}</h4>
              <ul className="mt-2 space-y-1.5">
                {manifest.settings.map(s => (
                  <li key={s.key} className="flex flex-wrap items-center gap-2 text-xs text-m-muted">
                    <span className="font-medium">{s.label}</span>
                    <span className="rounded-full bg-[color:var(--m-ic)] px-1.5 py-0.5 text-[10px] text-m-faint">{t(`admin.plugins.scope.${s.scope}` as never)}</span>
                    {s.required && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${CHIP_PENDING}`}>{t('admin.plugins.fieldRequired')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5">
            <h4 className={sectionH}>{t('admin.plugins.detailsTitle')}</h4>
            <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-3">
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
          </div>

          {/* Every published version, installable individually. The compat verdict per
              version is SERVER-computed — an incompatible one is explained, never offered. */}
          {(detail?.versions?.length ?? 0) > 1 && (
            <div className="mt-5">
              <h4 className={sectionH}>{t('admin.plugins.versionsTitle')}</h4>
              <div className="mt-2 space-y-0.5">
                {detail!.versions!.map(v => (
                  <div key={v.version} className="flex items-center gap-2.5 py-1">
                    <span className={`text-[12.5px] font-medium tabular-nums ${v.compatible ? 'text-m-ink' : 'text-m-faint'}`}>v{v.version}</span>
                    {v.publishedAt && <span className="text-[11.5px] text-m-faint">{new Date(v.publishedAt).toLocaleDateString(locale)}</span>}
                    {v.signed && <ShieldCheck size={13} className="shrink-0 text-[color:var(--m-st-confirmed)]" />}
                    <span className="ms-auto" />
                    {v.compatible ? (
                      !installed && (
                        <button type="button" onClick={() => onInstall(item.id, v.version)} disabled={busy === item.id}
                          className="rounded-full border border-[color:var(--m-rowbr)] px-2.5 py-1 text-[11.5px] font-bold text-m-muted disabled:opacity-50">
                          {t('admin.plugins.installCompatible', { version: v.version })}
                        </button>
                      )
                    ) : (
                      <span className="text-[11.5px] text-m-faint">{t('admin.plugins.versionNeedsTrek', { range: v.trek ?? '' })}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2 border-t border-[color:var(--m-rowbr)] px-4 py-3.5">
        <a href={repoUrl} target="_blank" rel="noreferrer" className={linkClass}>
          <Github size={13} /> {t('admin.plugins.sourceRepo')}
        </a>
        <a href={`${repoUrl}/issues`} target="_blank" rel="noreferrer" className={linkClass}>
          <CircleDot size={13} /> {t('admin.plugins.reportIssue')}
        </a>
        {homepage && (
          <a href={homepage} target="_blank" rel="noreferrer" className={linkClass}>
            <ExternalLink size={13} /> {t('admin.plugins.homepage')}
          </a>
        )}
      </div>
    </MSheet>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return <div><div className="text-[12px] text-m-faint">{k}</div><div className="mt-0.5 text-[12.5px] font-medium text-m-ink">{v}</div></div>
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
function SignatureBlockSheet({ data, entry, busy, t, onRetrust, onClose }: {
  data: { subject: SigSubject; code: string; detail: string | null }
  entry: RegistryItem | undefined
  busy: boolean; t: T
  onRetrust: (version: string, publicKey: string) => void
  onClose: () => void
}) {
  const { canRetrust, newKey, retrust, bodyKey } = signatureBlockView(data.code, entry)
  const offerRetrust = retrust !== null

  return (
    <MSheet open onClose={onClose} variant="card" material="opaque" ariaLabel={t('admin.plugins.sig.title', { name: data.subject.name })}>
      <div className="flex-none px-[18px] pt-[18px]">
        <div className="flex items-start gap-3">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${CHIP_PENDING}`}><ShieldAlert size={18} /></div>
          <div>
            <h3 className="text-sm font-bold text-m-ink">{t('admin.plugins.sig.title', { name: data.subject.name })}</h3>
            <p className="mt-1 text-xs text-m-muted">{t(bodyKey as never)}</p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4 space-y-4">
        {/* Fingerprints, not full keys: these exist to be COMPARED by a human — read the
            new one back to the author over the phone. The full key travels in the request. */}
        {canRetrust && (
          <div className="space-y-2">
            <KeyRow label={t('admin.plugins.sig.pinnedKey')} value={data.subject.keyFingerprint ?? '—'} />
            <KeyRow label={t('admin.plugins.sig.newKey')} value={fingerprint(newKey) ?? '—'} highlight />
            <p className="pt-1 text-[11.5px] leading-relaxed text-m-muted">{t('admin.plugins.sig.confirmOutOfBand')}</p>
          </div>
        )}
        {!canRetrust && data.detail && (
          <p className="break-all rounded-lg bg-[color:var(--m-ic)] px-3 py-2 font-mono text-xs text-m-faint">{data.detail}</p>
        )}
      </div>
      <div className="flex-none px-[18px] pb-[18px] flex items-center justify-end gap-2">
        <MAdminButton variant="ghost" onClick={onClose}>
          {offerRetrust ? t('admin.plugins.sig.cancel') : t('common.close')}
        </MAdminButton>
        {retrust && (
          <MAdminButton variant="danger" busy={busy} onClick={() => onRetrust(retrust.version, retrust.newKey)}>
            {t('admin.plugins.sig.retrustConfirm')}
          </MAdminButton>
        )}
      </div>
    </MSheet>
  )
}

function KeyRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-2">
      <span className="shrink-0 text-[11.5px] text-m-muted">{label}</span>
      <code className={`break-all font-mono text-[12px] ${highlight ? 'font-semibold text-[color:var(--m-st-pending)]' : 'text-m-ink'}`}>{value}</code>
    </div>
  )
}

function UpdateConsentSheet({ data, unsigned, t, onApprove, onLater }: {
  data: { plugin: PluginRow; version: string; newPermissions: string[]; newEgress: string[] }
  unsigned: boolean
  t: T; onApprove: () => void; onLater: () => void
}) {
  return (
    <MSheet open onClose={onLater} variant="card" material="opaque" ariaLabel={t('admin.plugins.updateConsentTitle')}>
      <div className="flex-none px-[18px] pt-[18px]">
        <div className="flex items-start gap-3">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${CHIP_PENDING}`}><ShieldCheck size={18} /></div>
          <div>
            <h3 className="text-sm font-bold text-m-ink">{t('admin.plugins.updateConsentTitle')}</h3>
            <p className="mt-1 text-xs text-m-muted">{t('admin.plugins.updateConsentBody', { name: data.plugin.name, version: data.version })}</p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4 space-y-4">
        {/* The admin is about to widen what this code may do — so say, right here, that
            nothing ties this code to its author. One line, no checkbox, no extra click:
            this informs, it does not block. */}
        {unsigned && (
          <p className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${CHIP_PENDING}`}>
            <ShieldAlert size={13} className="mt-0.5 shrink-0" />
            <span>{t('admin.plugins.sig.consentUnsigned')}</span>
          </p>
        )}
        {data.newPermissions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-m-muted">{t('admin.plugins.updateNewPermissions')}</h4>
            <ul className="mt-2 space-y-1.5">
              {data.newPermissions.map(perm => (
                <li key={perm} className="flex items-start gap-2 text-xs text-m-muted"><Check size={13} className="mt-0.5 shrink-0 text-[color:var(--m-st-pending)]" /><PermLabel perm={perm} t={t} /></li>
              ))}
            </ul>
          </div>
        )}
        {data.newEgress.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-m-muted">{t('admin.plugins.updateNewEgress')}</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.newEgress.map(host => <code key={host} className="rounded bg-[color:var(--m-ic)] px-1.5 py-0.5 font-mono text-[11px] text-m-muted">{host}</code>)}
            </div>
          </div>
        )}
      </div>
      <div className="flex-none px-[18px] pb-[18px] flex items-center justify-end gap-2">
        <MAdminButton variant="ghost" onClick={onLater}>{t('admin.plugins.updateLater')}</MAdminButton>
        <MAdminButton onClick={onApprove}>{t('admin.plugins.updateApprove')}</MAdminButton>
      </div>
    </MSheet>
  )
}

// Shown when enabling a plugin is blocked by missing/outdated plugin dependencies.
// Each dependency gets a one-click download (latest version satisfying its range,
// transitively) that then retries enabling the plugin.
function DependencyResolveSheet({ data, t, busy, installedIds, onDownload, onClose }: {
  data: { plugin: PluginRow; missing: PluginDep[]; versionMismatch: VersionMismatch[] }
  t: T; busy: boolean; installedIds: Set<string>
  onDownload: (depId: string, constraint?: string) => void; onClose: () => void
}) {
  const rows = dependencyRows(data)
  return (
    <MSheet open onClose={onClose} variant="card" material="opaque" ariaLabel={t('admin.plugins.dep.resolveTitle')}>
      <div className="flex-none px-[18px] pt-[18px]">
        <div className="flex items-start gap-3">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${CHIP_PENDING}`}><Puzzle size={18} /></div>
          <div>
            <h3 className="text-sm font-bold text-m-ink">{t('admin.plugins.dep.resolveTitle')}</h3>
            <p className="mt-1 text-xs text-m-muted">{t('admin.plugins.dep.resolveBody', { name: data.plugin.name })}</p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4 space-y-2.5">
        {rows.map(r => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-m-ink">{r.id}</div>
              <div className="mt-0.5 text-[11.5px] text-m-muted">
                {r.installed
                  ? t('admin.plugins.dep.mismatch', { wanted: r.constraint, installed: r.installed })
                  : t('admin.plugins.dep.requires', { version: r.constraint })}
              </div>
            </div>
            <button type="button" onClick={() => onDownload(r.id, r.constraint)} disabled={busy}
              className={`shrink-0 ${ACT_PILL}`}>
              <Download size={13} /> {r.installed ? t('admin.plugins.dep.update') : t('admin.plugins.dep.download')}
            </button>
          </div>
        ))}
        {rows.some(r => !installedIds.has(r.id)) && (
          <p className="pt-1 text-[11.5px] text-m-faint">{t('admin.plugins.dep.resolveHint')}</p>
        )}
      </div>
      <div className="flex-none px-[18px] pb-[18px] flex items-center justify-end">
        <MAdminButton variant="ghost" onClick={onClose}>{t('common.cancel')}</MAdminButton>
      </div>
    </MSheet>
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
    <div className="overflow-hidden rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)]">
      <div className="flex items-start gap-2 px-4 py-3.5">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-m-faint" />
        <p className="text-xs text-m-muted">{t('admin.plugins.reviewedMeaning')}</p>
      </div>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 border-t border-[color:var(--m-rowbr)] px-4 py-3 text-xs font-medium text-m-muted">
        <span className="flex items-center gap-2"><Lock size={13} className="shrink-0" /> <span className="text-start">{t('admin.plugins.security.title')}</span></span>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid gap-x-8 gap-y-4 border-t border-[color:var(--m-rowbr)] px-4 py-4">
          {sections.map(([h, b]) => (
            <div key={h}>
              <h4 className="text-[12.5px] font-semibold text-m-ink">{t(h as never)}</h4>
              <p className="mt-1 text-xs leading-relaxed text-m-muted">{t(b as never)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
