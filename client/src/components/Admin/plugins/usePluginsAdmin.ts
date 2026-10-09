import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { adminApi } from '../../../api/client';
import { useTranslation } from '../../../i18n';
import { usePluginStore } from '../../../store/pluginStore';
import { useToast } from '../../shared/Toast';
import { useInstanceSettings } from '../useInstanceSettings';
import { useRangeBypass, type RangeWarning, type TrekRangeBypass } from '../useRangeBypass';
import {
  SIGNATURE_CODES,
  errBody,
  filterInstalled,
  filterRegistry,
  isNewer,
  isRegistrySourced,
  isUpdateAvailable,
  type ActivateErr,
  type PluginDep,
  type PluginRow,
  type RegistryDetail,
  type RegistryItem,
  type SigSubject,
  type SortKey,
  type StatusFilter,
  type TypeFilter,
  type VersionInfo,
  type VersionMismatch,
} from './pluginModel';

/**
 * Admin > Plugins, the logic behind both shells (the desktop panel and the phone panel
 * render their own markup over it): the installed list and the registry, the toolbar
 * filters, sideload and dev-link, enable/disable with its dependency and consent gates,
 * updates and version switches, signature refusals and re-trust, egress hosts, error
 * logs and the instance settings form.
 */
export function usePluginsAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const [runtimeOn, setRuntimeOn] = useState(false);
  const [devLink, setDevLink] = useState(false); // dev-link enabled server-side (TREK_PLUGINS_DEV_LINK)
  const [ignoreTrekRange, setIgnoreTrekRange] = useState(false); // TREK_PLUGINS_IGNORE_TREK_RANGE set server-side
  const bypass = useRangeBypass(); // its warning dialog/sheet state, shared with the other shell
  const [linkPath, setLinkPath] = useState('');
  const [plugins, setPlugins] = useState<PluginRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<'installed' | 'discover'>('installed');
  const [registry, setRegistry] = useState<RegistryItem[] | null>(null);
  const [latest, setLatest] = useState<Record<string, string>>({});
  // The registry entry per id: the re-trust dialog needs the NEW author key from it (in
  // full: the server's equality check is exact), and the Discover/consent copy needs `signed`.
  const [regById, setRegById] = useState<Record<string, RegistryItem>>({});
  // Open when a signature check refused an install/update. Carries the code, so the dialog
  // knows whether an override may even be offered.
  const [signatureBlock, setSignatureBlock] = useState<{
    subject: SigSubject;
    code: string;
    detail: string | null;
  } | null>(null);
  const [retrusting, setRetrusting] = useState(false);
  const [detailFor, setDetailFor] = useState<RegistryItem | null>(null);
  const [errorsFor, setErrorsFor] = useState<{
    id: string;
    rows: Array<{ ts: string; level: string; message: string }>;
  } | null>(null);
  const [egressFor, setEgressFor] = useState<{ id: string; supported: boolean; hosts: string[] } | null>(null);
  // The admin-owned scope:'instance' settings form, shared logic with the other shell.
  const settings = useInstanceSettings();
  const [egressDraft, setEgressDraft] = useState('');
  const [egressSaving, setEgressSaving] = useState(false);
  const [egressError, setEgressError] = useState('');
  const [confirmUninstall, setConfirmUninstall] = useState<PluginRow | null>(null);
  // The version picker for an INSTALLED plugin ("Change version…"); versions land async
  // from the registry detail endpoint, which computes each version's compat verdict.
  const [versionPicker, setVersionPicker] = useState<{
    plugin: PluginRow;
    versions: VersionInfo[] | null;
    failed: boolean;
  } | null>(null);
  // A picked version OLDER than the installed one, held here until the admin consents
  // to the data risk (the plugin's data dir stays; older code may not understand it).
  const [confirmDowngrade, setConfirmDowngrade] = useState<{ plugin: PluginRow; version: string } | null>(null);
  // A QUEUE, not one slot: "Update All" can produce several re-consent prompts, and
  // each must be shown, not silently overwritten by the last one.
  const [consentQueue, setConsentQueue] = useState<
    Array<{ plugin: PluginRow; version: string; newPermissions: string[]; newEgress: string[] }>
  >([]);
  // Open when enabling a plugin is blocked by missing/outdated plugin dependencies.
  const [depResolve, setDepResolve] = useState<{
    plugin: PluginRow;
    missing: PluginDep[];
    versionMismatch: VersionMismatch[];
  } | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  // Toolbar state.
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('name');

  // 'updates' only ranks installed plugins, 'downloads' only the registry, so snap
  // the key back to name when switching tabs so the dropdown never carries a label
  // for an option the active tab can't offer.
  useEffect(() => {
    if (view === 'discover' && sort === 'updates') setSort('name');
    else if (view === 'installed' && sort === 'downloads') setSort('name');
  }, [view, sort]);

  // Sideload upload: drag a plugin .zip onto the panel or use the toolbar button.
  const [dragActive, setDragActive] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  // Index the registry once per fetch: the version map the update badges read, plus the
  // whole entry (author key + signed flag) the trust badges and re-trust dialog need.
  // The map holds latestCompatible, the newest version THIS TREK can install (computed
  // server-side), not the absolute latest, so the banner never counts an update the
  // update endpoint would refuse.
  const indexRegistry = (items: RegistryItem[]) => {
    const vers: Record<string, string> = {};
    const byId: Record<string, RegistryItem> = {};
    items.forEach((i) => {
      byId[i.id] = i;
      if (i.latestCompatible) vers[i.id] = i.latestCompatible;
    });
    setLatest(vers);
    setRegById(byId);
  };

  const refresh = () => {
    // Keep the app-wide active-plugin store in sync so widget/hero/tab consumers
    // (e.g. the dashboard) reflect an activate/deactivate without a full reload (F5).
    void usePluginStore.getState().loadPlugins();
    adminApi
      .plugins()
      .then((d: { enabled: boolean; devLink?: boolean; ignoreTrekRange?: boolean; plugins: PluginRow[] }) => {
        setRuntimeOn(!!d.enabled);
        setDevLink(!!d.devLink);
        setIgnoreTrekRange(!!d.ignoreTrekRange);
        setPlugins(d.plugins || []);
        if ((d.plugins || []).length) {
          adminApi
            .pluginBrowse()
            .then(indexRegistry)
            .catch(() => {});
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  // A signature refusal is not an ordinary "action failed": it is the one class of error
  // where WHICH failure it was decides what the admin may do about it. Route it to the
  // dialog off the CODE, never off the message text. Returns true when handled.
  //
  // The subject is resolved from wherever it can be: the installed row, else the registry
  // entry (a plugin being INSTALLED has no row yet), else the bare id. A signature code
  // ALWAYS opens the dialog: falling back to a toast is what used to hide an invalid
  // signature on a fresh install behind the same treatment as a network blip.
  const routeSignatureError = (id: string, code?: string, detail?: string): boolean => {
    if (!code || !SIGNATURE_CODES.includes(code)) return false;
    const row = plugins.find((p) => p.id === id);
    const subject: SigSubject = row
      ? { id, name: row.name, keyFingerprint: row.keyFingerprint ?? null }
      : // Not installed: no pinned key exists, so SIGNATURE_KEY_CHANGED cannot arise and the
        // dialog shows the no-override explanation, which is exactly right.
        { id, name: regById[id]?.name ?? id, keyFingerprint: null };
    setSignatureBlock({ subject, code, detail: detail ?? null });
    return true;
  };

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    setMenu(null);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      const { error, code } = errBody(e);
      if (!routeSignatureError(id, code, error)) toast.error(error || t('admin.plugins.actionError'));
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const openDiscover = () => {
    setView('discover');
    if (!registry) {
      adminApi
        .pluginBrowse()
        .then((items: RegistryItem[]) => {
          setRegistry(items);
          indexRegistry(items);
        })
        .catch(() => setRegistry([]));
    }
  };
  // The rescan/reload button rediscovers locally-installed plugins AND force-pulls
  // the remote registry (bypassing the 30-min server cache + GitHub's CDN), so a
  // just-published plugin shows up right away instead of up to ~35 min later.
  const rescan = () =>
    act(
      '__rescan',
      async () => {
        await adminApi.pluginRescan();
        const items: RegistryItem[] = await adminApi.pluginBrowse(true);
        setRegistry(items);
        indexRegistry(items);
      },
      t('admin.plugins.rescanned')
    );

  // Sideload a plugin archive (installs INACTIVE: the admin still consents on activation).
  const uploadPlugin = async (file: File) => {
    setBusy('__upload');
    setMenu(null);
    try {
      const res = await adminApi.pluginUpload(file);
      setView('installed');
      toast.success(t('admin.plugins.uploaded', { name: res.id }));
      bypass.notice(res.id, res.trekRangeBypassed);
    } catch (e) {
      toast.error(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError')
      );
    } finally {
      setBusy(null);
      refresh();
    }
  };
  const pickUpload = () => uploadInputRef.current?.click();
  const onDragEnter = (e: DragEvent) => {
    if (!runtimeOn || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    dragDepth.current++;
    setDragActive(true);
  };
  // Mirrors onDragEnter: a leave that had no matching enter (a non-file drag) is ignored
  // instead of driving the depth counter negative.
  const onDragLeave = () => {
    if (dragDepth.current === 0) return;
    if (--dragDepth.current === 0) setDragActive(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    if (!runtimeOn) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void uploadPlugin(f);
  };
  const openEgress = (id: string) => {
    setMenu(null);
    setEgressDraft('');
    setEgressError('');
    adminApi
      .pluginEgressHosts(id)
      .then((d) => setEgressFor({ id, supported: d.supported, hosts: d.hosts }))
      .catch(() => setEgressFor({ id, supported: false, hosts: [] }));
  };

  // Saving RE-SPAWNS the plugin: the child's egress guard is installed once at init and
  // a second init is refused, so a live child's allow-list can never be widened in place.
  const saveEgress = async (hosts: string[]) => {
    if (!egressFor) return;
    setEgressSaving(true);
    setEgressError('');
    try {
      const d = await adminApi.pluginSetEgressHosts(egressFor.id, hosts);
      setEgressFor({ ...egressFor, hosts: d.hosts });
      setEgressDraft('');
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      setEgressError(err.response?.data?.error || t('common.error'));
    } finally {
      setEgressSaving(false);
    }
  };

  const openInstanceSettings = (p: { id: string; status: string }) => {
    setMenu(null);
    settings.open(p.id, p.status === 'active');
  };

  const openErrors = (id: string) => {
    setMenu(null);
    adminApi
      .pluginErrors(id)
      .then((d: { errors: Array<{ ts: string; level: string; message: string }> }) =>
        setErrorsFor({ id, rows: d.errors })
      )
      .catch(() => setErrorsFor({ id, rows: [] }));
  };

  const updateAvailable = (p: PluginRow) => isUpdateAvailable(p, latest);
  const resumeUpdates = (p: PluginRow) =>
    act(p.id, () => adminApi.pluginResumeUpdates(p.id), t('admin.plugins.updatesResumed'));
  // A newer version exists but this TREK can't install it (and it isn't the one on offer):
  // said passively on the row, so the admin learns a TREK upgrade unlocks it instead of
  // wondering why no update shows. Null when the registry gives no range to point at.
  const newerIncompatible = (p: PluginRow): { version: string; range: string } | null => {
    const reg = regById[p.id];
    if (!reg?.latest || !p.version || !isNewer(reg.latest, p.version)) return null;
    if (latest[p.id] === reg.latest) return null;
    const range = reg.trek ?? (reg.minTrekVersion ? `>=${reg.minTrekVersion}` : null);
    return range ? { version: reg.latest, range } : null;
  };
  // `warn` is the pre-install confirm for an entry the registry already flagged as
  // incompatible; an artifact whose OWN manifest turns out to be out of range (the index
  // was only a pre-download filter) is caught by the marker on the response instead.
  const install = (id: string, version?: string, warn?: RangeWarning) =>
    bypass.guard(warn, () =>
      act(
        id,
        () =>
          adminApi.pluginInstall(id, version ? { version } : undefined).then((r) => {
            if (!warn) bypass.notice(id, r?.trekRangeBypassed);
          }),
        t('admin.plugins.installed')
      )
    );
  const restart = (id: string) =>
    act(
      id,
      async () => {
        await adminApi.pluginDeactivate(id);
        await adminApi.pluginActivate(id);
      },
      t('admin.plugins.restarted')
    );
  // Dev-link: register a plugin from a local built directory (dev only). Reuses the
  // same busy/toast/refresh loop as uploadPlugin; the server gates it.
  const linkLocal = async () => {
    const p = linkPath.trim();
    if (!p) return;
    setBusy('__link');
    setMenu(null);
    try {
      const res = await adminApi.pluginLink(p);
      setView('installed');
      setLinkPath('');
      toast.success(t('admin.plugins.devLinkLinked', { id: res.id }));
      bypass.notice(res.id, res.trekRangeBypassed);
    } catch (e) {
      toast.error(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error || t('admin.plugins.actionError')
      );
    } finally {
      setBusy(null);
      refresh();
    }
  };
  const installedIds = new Set(plugins.map((p) => p.id));

  // Installed-but-disabled direct deps that enabling `p` will auto-enable first.
  const autoEnabledDeps = (p: PluginRow) =>
    (p.dependencies?.pluginDependencies ?? [])
      .map((d) => plugins.find((x) => x.id === d.id))
      .filter((x): x is PluginRow => !!x && x.enabled === 0)
      .map((x) => x.name);

  // Shared handling for a failed activation: route each 409 code to the right fix
  // (consent dialog, download-dependency dialog, or a clear toast).
  const onActivateError = (p: PluginRow, e: ActivateErr) => {
    const d = e?.response?.data;
    if (e?.response?.status === 409 && d?.code === 'CONSENT_REQUIRED') {
      setConsentQueue((qq) => [
        ...qq,
        {
          plugin: p,
          version: latest[p.id] ?? p.version ?? '',
          newPermissions: d.newPermissions ?? [],
          newEgress: d.newEgress ?? [],
        },
      ]);
    } else if (e?.response?.status === 409 && d?.code === 'ADDON_DISABLED') {
      toast.error(
        t('admin.plugins.dep.addonDisabledToast', {
          count: (d.addons ?? []).length,
          addons: (d.addons ?? []).join(', '),
        })
      );
    } else if (e?.response?.status === 409 && d?.code === 'DEPENDENCY_MISSING') {
      setDepResolve({ plugin: p, missing: d.missing ?? [], versionMismatch: d.versionMismatch ?? [] });
    } else {
      // DEPENDENCY_CYCLE and everything else surface their server message.
      toast.error(d?.error || t('admin.plugins.actionError'));
    }
  };

  const attemptActivate = (p: PluginRow) => {
    const cascaded = autoEnabledDeps(p);
    return adminApi
      .pluginActivate(p.id)
      .then(() => {
        toast.success(t('admin.plugins.activated'));
        if (cascaded.length)
          toast.success(t('admin.plugins.dep.autoEnabled', { count: cascaded.length, plugins: cascaded.join(', ') }));
        setDepResolve(null);
      })
      .catch((e: ActivateErr) => onActivateError(p, e));
  };

  // Enable/disable a plugin. Re-enabling one whose update widened its permissions
  // must NOT grant them silently (409 CONSENT_REQUIRED → consent dialog); a disabled
  // required addon or a missing plugin dependency (409 ADDON_DISABLED /
  // DEPENDENCY_MISSING) routes to the right remedy.
  const toggle = (p: PluginRow) => {
    if (busy === p.id) return;
    if (p.enabled === 1) {
      void act(p.id, () => adminApi.pluginDeactivate(p.id), t('admin.plugins.deactivated'));
      return;
    }
    setBusy(p.id);
    setMenu(null);
    attemptActivate(p).finally(() => {
      setBusy(null);
      refresh();
    });
  };

  // Download a missing/outdated plugin dependency (latest compatible for its range,
  // transitively), then retry enabling the plugin that needed it.
  const resolveDependency = (parent: PluginRow, depId: string, constraint?: string) => {
    if (busy === parent.id) return;
    setBusy(parent.id);
    adminApi
      .pluginInstall(depId, { constraint, withDependencies: true })
      .then((r: { installed?: string[]; requiredAddons?: string[]; trekRangeBypassed?: TrekRangeBypass | null }) => {
        toast.success(t('admin.plugins.dep.downloaded', { id: depId }));
        if (r?.requiredAddons?.length)
          toast.error(
            t('admin.plugins.dep.addonDisabledToast', {
              count: r.requiredAddons.length,
              addons: r.requiredAddons.join(', '),
            })
          );
        bypass.notice(depId, r?.trekRangeBypassed);
        return attemptActivate(parent);
      })
      // The DEPENDENCY is what's being downloaded, so a signature refusal here is about the
      // dependency's author, not the parent's, so route it under depId before falling through
      // to the activation-error handling, which knows nothing about signature codes.
      .catch((e: ActivateErr) => {
        const { error, code } = errBody(e);
        if (!routeSignatureError(depId, code, error)) onActivateError(parent, e);
      })
      .finally(() => {
        setBusy(null);
        refresh();
      });
  };

  // `version` pins the exact version to install (rollback / explicit switch); omitted,
  // the server resolves the newest TREK-compatible version itself.
  const runUpdate = (p: PluginRow, version?: string) => {
    setBusy(p.id);
    setMenu(null);
    return adminApi
      .pluginUpdate(p.id, version)
      .then(
        (r: {
          version: string;
          activated: boolean;
          newPermissions: string[];
          newEgress: string[];
          trekRangeBypassed?: TrekRangeBypass | null;
        }) => {
          if (r.activated || (r.newPermissions.length === 0 && r.newEgress.length === 0))
            toast.success(t('admin.plugins.updated'));
          else
            setConsentQueue((qq) => [
              ...qq,
              { plugin: p, version: r.version, newPermissions: r.newPermissions, newEgress: r.newEgress },
            ]);
          bypass.notice(p.name, r.trekRangeBypassed);
        }
      )
      .catch((e) => {
        const { error, code } = errBody(e);
        if (!routeSignatureError(p.id, code, error)) toast.error(error || t('admin.plugins.actionError'));
      })
      .finally(() => {
        setBusy(null);
        refresh();
      });
  };

  // Confirm a key rotation: re-pin the new key AND update, in one server call. There is no
  // follow-up /update: a re-pin that waited for a second call would leave the plugin
  // pinned to a key no install had ever been verified against if that call never came.
  const confirmRetrust = (id: string, version: string, publicKey: string) => {
    setRetrusting(true);
    adminApi
      .pluginRetrust(id, version, publicKey)
      .then((r: { version: string; activated: boolean; newPermissions: string[]; newEgress: string[] }) => {
        setSignatureBlock(null);
        // A re-trusted update widening permissions still needs consent: re-trusting a
        // signing key says nothing about what the new code is allowed to do. Re-trust only
        // ever fires for an INSTALLED plugin, so the row is there to consent against.
        const p = plugins.find((x) => x.id === id);
        if (p && !r.activated && (r.newPermissions.length > 0 || r.newEgress.length > 0)) {
          setConsentQueue((qq) => [
            ...qq,
            { plugin: p, version: r.version, newPermissions: r.newPermissions, newEgress: r.newEgress },
          ]);
        } else toast.success(t('admin.plugins.retrusted'));
      })
      .catch((e) => toast.error(errBody(e).error || t('admin.plugins.actionError')))
      .finally(() => {
        setRetrusting(false);
        refresh();
      });
  };

  // "Change version…" on an installed row: fetch the per-version list (with the server's
  // compat verdicts) and open the picker. The fetch is keyed to the plugin so a stale
  // response can't populate a picker that was reopened for another row.
  const openVersionPicker = (p: PluginRow) => {
    setMenu(null);
    setVersionPicker({ plugin: p, versions: null, failed: false });
    adminApi
      .pluginDetail(p.id)
      .then((d: RegistryDetail) =>
        setVersionPicker((cur) => (cur && cur.plugin.id === p.id ? { ...cur, versions: d.versions ?? [] } : cur))
      )
      .catch(() => setVersionPicker((cur) => (cur && cur.plugin.id === p.id ? { ...cur, failed: true } : cur)));
  };

  // Switching DOWN keeps the plugin's data dir, which the older code may not understand, so
  // that asks for explicit consent first. Any other switch is the ordinary update path.
  const pickVersion = (version: string) => {
    if (!versionPicker) return;
    const p = versionPicker.plugin;
    setVersionPicker(null);
    if (p.version && isNewer(p.version, version)) setConfirmDowngrade({ plugin: p, version });
    else void runUpdate(p, version);
  };

  const updatable = useMemo(() => plugins.filter((p) => isUpdateAvailable(p, latest)), [plugins, latest]);

  // One after another: busy is a single slot, so parallel updates would leave the
  // other rows clickable mid-install and refresh once per plugin.
  const updateAll = async () => {
    for (const p of updatable) await runUpdate(p);
  };

  // Installed list after search / type / status filters + sort.
  const shownInstalled = useMemo(
    () => filterInstalled(plugins, { q, typeFilter, statusFilter, sort }, latest),
    [plugins, q, typeFilter, statusFilter, sort, latest]
  );

  // Registry list after search / type filter.
  const shownRegistry = useMemo(
    () => filterRegistry(registry, { q, typeFilter, sort }),
    [registry, q, typeFilter, sort]
  );

  const anyFilter = q.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';
  const ready = runtimeOn && !loading && !error;
  // A question opened from the detail view (the range warning, a signature refusal, the
  // consent gate) sits on top of it; Escape and the backdrop leave the detail alone meanwhile.
  const detailBlocked = !!bypass.copy || !!signatureBlock || consentQueue.length > 0;

  // The plugin whose row action sheet is open on the phone (menu === `row:${id}`).
  const rowMenuPlugin = menu?.startsWith('row:') ? (plugins.find((p) => `row:${p.id}` === menu) ?? null) : null;

  /** Opens the signature dialog on the update a row's block describes. */
  const reviewBlock = (p: PluginRow) =>
    setSignatureBlock({
      subject: { id: p.id, name: p.name, keyFingerprint: p.keyFingerprint ?? null },
      code: p.updateBlock!.code,
      detail: p.updateBlock!.detail,
    });
  const askUninstall = (p: PluginRow) => {
    setMenu(null);
    setConfirmUninstall(p);
  };
  const uninstallConfirmed = async () => {
    const p = confirmUninstall!;
    setConfirmUninstall(null);
    await act(p.id, () => adminApi.pluginUninstall(p.id, true), t('admin.plugins.uninstalled'));
  };
  const downgradeConfirmed = () => {
    const d = confirmDowngrade!;
    setConfirmDowngrade(null);
    void runUpdate(d.plugin, d.version);
  };
  const retrustBlocked = (version: string, publicKey: string) => {
    if (signatureBlock) confirmRetrust(signatureBlock.subject.id, version, publicKey);
  };

  // Prefer the REGISTRY's flag: consent is about the code being installed, not the
  // code running now. But fall back to the installed row's, which the server always
  // sends. Reading only the registry meant an unreachable registry left `regById`
  // empty and the warning silently vanished at the exact moment an admin was widening
  // what unsigned code may do.
  const consent = consentQueue[0];
  const consentUnsigned =
    !!consent &&
    isRegistrySourced(consent.plugin.source_repo) &&
    (regById[consent.plugin.id]?.signed ?? consent.plugin.signed) === false;
  const approveConsent = async () => {
    const c = consentQueue[0];
    setConsentQueue((qq) => qq.slice(1));
    // consent:true is the ONLY path that may widen a plugin's granted rights.
    await act(c.plugin.id, () => adminApi.pluginActivate(c.plugin.id, true), t('admin.plugins.updated'));
  };
  const deferConsent = () => {
    setConsentQueue((qq) => qq.slice(1));
    toast.success(t('admin.plugins.updateKeptOff'));
  };
  const downloadDependency = (depId: string, constraint?: string) => {
    if (depResolve) resolveDependency(depResolve.plugin, depId, constraint);
  };

  return {
    bypass,
    settings,
    runtimeOn,
    devLink,
    ignoreTrekRange,
    linkPath,
    setLinkPath,
    plugins,
    loading,
    error,
    busy,
    view,
    setView,
    registry,
    latest,
    regById,
    signatureBlock,
    setSignatureBlock,
    retrusting,
    detailFor,
    setDetailFor,
    errorsFor,
    setErrorsFor,
    egressFor,
    setEgressFor,
    egressDraft,
    setEgressDraft,
    egressSaving,
    egressError,
    confirmUninstall,
    setConfirmUninstall,
    versionPicker,
    setVersionPicker,
    confirmDowngrade,
    setConfirmDowngrade,
    consentQueue,
    depResolve,
    setDepResolve,
    menu,
    setMenu,
    q,
    setQ,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    dragActive,
    uploadInputRef,
    openDiscover,
    rescan,
    uploadPlugin,
    pickUpload,
    onDragEnter,
    onDragLeave,
    onDrop,
    openEgress,
    saveEgress,
    openInstanceSettings,
    openErrors,
    updateAvailable,
    resumeUpdates,
    newerIncompatible,
    install,
    restart,
    linkLocal,
    installedIds,
    toggle,
    runUpdate,
    openVersionPicker,
    pickVersion,
    updatable,
    updateAll,
    shownInstalled,
    shownRegistry,
    anyFilter,
    ready,
    detailBlocked,
    rowMenuPlugin,
    reviewBlock,
    askUninstall,
    uninstallConfirmed,
    downgradeConfirmed,
    retrustBlocked,
    consentUnsigned,
    approveConsent,
    deferConsent,
    downloadDependency,
  };
}
