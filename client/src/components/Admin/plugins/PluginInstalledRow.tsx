import {
  AlertTriangle,
  ArrowUpCircle,
  Bug,
  CircleDot,
  Github,
  Globe,
  History,
  Info,
  KeyRound,
  Link2,
  MoreHorizontal,
  PauseCircle,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useRef, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { POPOVER } from '../../Packing/packingPopoverStyles';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import { fs } from '../../shared/DialogShell';
import PluginIcon from '../../shared/PluginIcon';
import { Tooltip } from '../../shared/Tooltip';
import { deriveCaps } from '../pluginCaps';
import { anchorMenu, MENU_ITEM, useFollowTrigger } from './pluginMenu';
import { deriveDeps, isRegistrySourced, parseJson, type PluginRow, type T } from './pluginModel';

// Runtime health → dot colour on the icon tile.
const HEALTH: Record<string, string> = {
  active: 'bg-success',
  starting: 'bg-info animate-pulse',
  error: 'bg-danger',
  inactive: 'bg-content-faint/60',
  disabled: 'bg-warning',
  incompatible: 'bg-warning',
};

/** Every fact about a plugin wears the same chip; only its icon carries a colour. */
const FACT =
  'inline-flex max-w-full items-center gap-1.5 rounded-full border border-edge-faint bg-surface-secondary px-2 py-[2px] font-medium text-content-secondary';

type Tone = 'warning' | 'danger' | 'neutral';
const NOTICE_LOOK: Record<Tone, string> = {
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-secondary text-content-muted',
};

/** A state of the plugin worth reading on its own line: what it means, and the one action that fixes it. */
interface Notice {
  key: string;
  tone: Tone;
  icon: ComponentType<{ size?: number; className?: string }>;
  text: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
}

function Fact({
  icon,
  iconClass = 'text-content-muted',
  hint,
  children,
}: {
  icon: ReactNode;
  iconClass?: string;
  hint?: string;
  children: ReactNode;
}) {
  const chip = (
    <span className={FACT} style={fs(11)}>
      <span className={`flex flex-none ${iconClass}`}>{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
  return hint ? (
    <Tooltip label={hint}>
      <span className="inline-flex max-w-full">{chip}</span>
    </Tooltip>
  ) : (
    chip
  );
}

function NoticeLine({ n }: { n: Notice }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-[10px] px-2.5 py-1.5 ${NOTICE_LOOK[n.tone]}`}
      style={fs(11.5)}
    >
      <n.icon size={13} className="flex-none" />
      <span className="min-w-0 flex-1 truncate">{n.text}</span>
      {n.action && (
        <button
          type="button"
          onClick={n.action.onClick}
          disabled={n.action.disabled}
          className="flex-none font-semibold underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
        >
          {n.action.label}
        </button>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${MENU_ITEM} ${danger ? 'text-danger hover:bg-danger-soft' : 'text-content-secondary'}`}
      style={fs(12.5, 'body')}
    >
      <span className={`flex w-4 flex-none justify-center ${danger ? 'text-danger' : 'text-content-muted'}`}>
        {icon}
      </span>{' '}
      {label}
    </button>
  );
}

interface InstalledRowProps {
  p: PluginRow;
  t: T;
  busy: string | null;
  menu: string | null;
  setMenu: (v: string | null) => void;
  hasUpdate: boolean;
  latestVer?: string;
  newerIncompatible: { version: string; range: string } | null;
  blocked: boolean;
  onToggle: () => void;
  onUpdate: () => void;
  onRestart: () => void;
  onChangeVersion: () => void;
  onResume: () => void;
  onReviewBlock: () => void;
  onErrors: () => void;
  onEgress: () => void;
  onSettings: () => void;
  onUninstall: () => void;
}

/**
 * One installed plugin, read top to bottom: its name and version, what it does, the
 * facts about it as one row of alike chips (what it adds, whether it was reviewed and
 * signed, where it may connect), then each state that needs attention on a line of its
 * own with the action that resolves it. The controls stay on the right.
 */
export default function PluginInstalledRow(props: InstalledRowProps) {
  const { p, t, busy, menu, setMenu, hasUpdate, latestVer, newerIncompatible, blocked } = props;
  const caps = deriveCaps(
    parseJson<string[]>(p.permissions, []),
    parseJson<{ widget?: { slot?: string } }>(p.capabilities, {}),
    t
  );
  const deps = deriveDeps(p, t);
  const menuOpen = menu === `row:${p.id}`;
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const working = busy === p.id;
  const hostCount = p.egressHostCount ?? 0;

  // The menu is portaled to <body> and positioned `fixed` against the ⋯ button,
  // because the row's ancestor (PageSidebar) is `overflow-hidden` and would clip
  // an in-flow `absolute` menu — losing Delete on the lower rows of a long list.
  useFollowTrigger(menuOpen);

  const notices: Notice[] = [];
  if (p.status === 'error' && p.last_error) {
    notices.push({ key: 'error', tone: 'danger', icon: AlertTriangle, text: p.last_error });
  }
  // A refused update leaves a WORKING plugin pinned at its old version: its own state,
  // kept until resolved rather than dying with the toast that first reported it.
  if (blocked && p.updateBlock) {
    notices.push({
      key: 'block',
      tone: 'warning',
      icon: ShieldAlert,
      text: t('admin.plugins.updateBlocked', { reason: p.updateBlock.detail ?? p.updateBlock.code }),
      action: { label: t('admin.plugins.reviewBlock'), onClick: props.onReviewBlock },
    });
  }
  for (const [i, d] of deps.entries()) {
    if (d.blocked || d.warn) notices.push({ key: `dep${i}`, tone: 'warning', icon: d.icon, text: d.label });
  }
  // Held: the admin deliberately installed a non-latest version, so updates are paused
  // rather than nagged — resuming is one click, right where the pause shows.
  if (p.updateHold) {
    notices.push({
      key: 'hold',
      tone: 'neutral',
      icon: PauseCircle,
      text: t('admin.plugins.updatesHeld', { version: p.version ?? '' }),
      action: { label: t('admin.plugins.resumeUpdates'), onClick: props.onResume, disabled: working },
    });
  }
  // A newer version this TREK can't run: informational, never a button, the fix is a TREK upgrade.
  if (newerIncompatible) {
    notices.push({
      key: 'newer',
      tone: 'neutral',
      icon: Info,
      text: t('admin.plugins.newerNeedsTrek', { version: newerIncompatible.version, range: newerIncompatible.range }),
    });
  }

  return (
    <div
      className={`group relative flex items-start gap-3 px-3.5 py-3.5 transition-colors hover:bg-surface-secondary ${working ? 'opacity-60' : ''}`}
    >
      <div className="relative mt-0.5 flex-none">
        <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-edge-faint bg-surface-secondary">
          <PluginIcon name={p.icon} size={19} className="text-content-secondary" />
        </span>
        <Tooltip label={t(`admin.plugins.status.${p.status}` as never)}>
          <span
            className={`absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full ring-2 ring-surface-card ${HEALTH[p.status] || HEALTH.inactive}`}
          />
        </Tooltip>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate font-semibold tracking-[-.006em] text-content" style={fs(13.5, 'body')}>
            {p.name}
          </span>
          {p.version && (
            <span className="flex-none font-geist font-medium tabular-nums text-content-faint" style={fs(11)}>
              v{p.version}
            </span>
          )}
        </div>
        {p.description && (
          <p className="m-0 mt-0.5 truncate text-content-muted" style={fs(12, 'body')}>
            {p.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {caps.map((c, i) => (
            <Fact key={i} icon={<c.icon size={12} />} iconClass={c.net ? 'text-info' : 'text-content-muted'}>
              {c.label}
            </Fact>
          ))}
          {deps
            .filter((d) => !d.blocked && !d.warn)
            .map((d, i) => (
              <Fact key={`d${i}`} icon={<d.icon size={12} />}>
                {d.label}
              </Fact>
            ))}
          {p.reviewed_at && (
            <Fact icon={<ShieldCheck size={12} />} iconClass="text-success">
              {t('admin.plugins.reviewed')}
            </Fact>
          )}
          {p.source_repo === 'local:upload' && (
            <Fact icon={<UploadCloud size={12} />} iconClass="text-warning" hint={t('admin.plugins.sideloadedHint')}>
              {t('admin.plugins.sideloaded')}
            </Fact>
          )}
          {p.source_repo === 'local:link' && (
            <Fact icon={<Link2 size={12} />} hint={t('admin.plugins.devLinkHint')}>
              {t('admin.plugins.devLinkBadge')}
            </Fact>
          )}
          {/* Registry plugins only: a sideloaded or dev-linked plugin already says something stronger. */}
          {isRegistrySourced(p.source_repo) &&
            (p.signed ? (
              <Fact icon={<KeyRound size={12} />} hint={t('admin.plugins.signedHint')}>
                {t('admin.plugins.signed')}
              </Fact>
            ) : (
              <Fact icon={<ShieldAlert size={12} />} iconClass="text-warning" hint={t('admin.plugins.unsignedHint')}>
                {t('admin.plugins.unsigned')}
              </Fact>
            ))}
          {/* A service only the operator can name (a self-hosted Gotify/ntfy): the admin adds
              its host, and until one exists the plugin reaches nothing, so it asks for it. */}
          {p.operatorEgress && (
            <Tooltip label={t('admin.plugins.allowedHosts.hint')}>
              <button type="button" onClick={props.onEgress} className={`${FACT} hover:opacity-80`} style={fs(11)}>
                <Globe size={12} className={hostCount > 0 ? 'text-info' : 'text-warning'} />
                {hostCount > 0
                  ? t('admin.plugins.allowedHosts.count', { n: hostCount })
                  : t('admin.plugins.allowedHosts.add')}
              </button>
            </Tooltip>
          )}
        </div>

        {notices.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {notices.map((n) => (
              <NoticeLine key={n.key} n={n} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-none items-center gap-2 self-center">
        {hasUpdate && (
          <button
            type="button"
            onClick={props.onUpdate}
            disabled={working}
            className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 font-semibold text-warning hover:opacity-90 disabled:opacity-50"
            style={fs(11.5)}
          >
            <ArrowUpCircle size={13} /> <span>{t('admin.plugins.updateTo', { version: latestVer })}</span>
          </button>
        )}
        <span
          className={`min-w-[42px] text-end font-medium ${p.enabled === 1 ? 'text-content-secondary' : 'text-content-faint'}`}
          style={fs(12)}
        >
          {p.enabled === 1 ? t('admin.plugins.status.active') : t('admin.plugins.stateOff')}
        </span>
        <ToggleSwitch on={p.enabled === 1} label={t('admin.plugins.enabledToggle')} onToggle={props.onToggle} />
        <div className="relative">
          <Tooltip label={t('admin.table.actions')} disabled={menuOpen}>
            <button
              type="button"
              ref={menuBtnRef}
              data-testid={`plugin-row-menu-btn-${p.id}`}
              onClick={() => setMenu(menuOpen ? null : `row:${p.id}`)}
              aria-expanded={menuOpen}
              aria-label={t('admin.table.actions')}
              className={`grid h-8 w-8 place-items-center rounded-[10px] transition-colors ${menuOpen ? 'bg-surface-card text-content shadow-sm ring-1 ring-edge-faint' : 'text-content-faint hover:bg-surface-card hover:text-content'}`}
            >
              <MoreHorizontal size={17} />
            </button>
          </Tooltip>
          {menuOpen &&
            createPortal(
              <div
                data-testid={`plugin-row-menu-${p.id}`}
                style={{ ...POPOVER, ...anchorMenu(menuBtnRef.current) }}
                className="min-w-[200px]"
              >
                {p.enabled === 1 && (
                  <MenuItem
                    icon={<RotateCw size={14} />}
                    label={t('admin.plugins.restart')}
                    onClick={props.onRestart}
                  />
                )}
                {/* Instance fields OR actions: an action-only plugin still needs the dialog to run its buttons. */}
                {((p.instanceSettingsCount ?? 0) > 0 || (p.instanceActionsCount ?? 0) > 0) && (
                  <MenuItem
                    icon={<SlidersHorizontal size={14} />}
                    label={t('admin.plugins.instanceSettings')}
                    onClick={props.onSettings}
                  />
                )}
                <MenuItem icon={<Bug size={14} />} label={t('admin.plugins.viewErrors')} onClick={props.onErrors} />
                {/* Only a plugin that DECLARED operatorEgress: an admin is never invited to widen egress for one that did not ask. */}
                {p.operatorEgress && (
                  <MenuItem
                    icon={<Globe size={14} />}
                    label={t('admin.plugins.allowedHosts')}
                    onClick={props.onEgress}
                  />
                )}
                {/* Registry plugins only — a sideload/dev-link has no registry versions to pick from. */}
                {isRegistrySourced(p.source_repo) && (
                  <MenuItem
                    icon={<History size={14} />}
                    label={t('admin.plugins.changeVersion')}
                    onClick={props.onChangeVersion}
                  />
                )}
                {p.source_repo && p.source_repo !== 'local:upload' && p.source_repo !== 'local:link' && (
                  <>
                    <a
                      href={`https://github.com/${p.source_repo}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenu(null)}
                      className={`${MENU_ITEM} text-content-secondary`}
                      style={fs(12.5, 'body')}
                    >
                      <span className="flex w-4 flex-none justify-center text-content-muted">
                        <Github size={14} />
                      </span>{' '}
                      {t('admin.plugins.sourceRepo')}
                    </a>
                    <a
                      href={`https://github.com/${p.source_repo}/issues`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenu(null)}
                      className={`${MENU_ITEM} text-content-secondary`}
                      style={fs(12.5, 'body')}
                    >
                      <span className="flex w-4 flex-none justify-center text-content-muted">
                        <CircleDot size={14} />
                      </span>{' '}
                      {t('admin.plugins.reportIssue')}
                    </a>
                  </>
                )}
                <div className="mx-1.5 my-1 h-px bg-edge-faint" />
                <MenuItem icon={<Trash2 size={14} />} label={t('common.delete')} danger onClick={props.onUninstall} />
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}
