import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'

type T = (k: string, p?: Record<string, unknown>) => string

/**
 * The server's "this only went through because the version check was set aside" marker:
 * by an admin for this one plugin (`acceptedByAdmin`), or for every plugin through
 * TREK_PLUGINS_IGNORE_TREK_RANGE.
 */
export interface TrekRangeBypass { trekRange: string | null; hostVersion: string; acceptedByAdmin?: boolean }
/**
 * What the range-bypass warning needs to say, and what to do if the admin accepts (null = a
 * notice). `action` names what the confirm button does: install (the default) or activate.
 */
export interface RangeWarning extends TrekRangeBypass {
  name: string
  onConfirm: (() => void) | null
  action?: 'install' | 'activate'
}

/**
 * The chip a row carries while it runs outside its declared range on the operator's
 * say-so. Not a blocker — the toggle works — but a warning that must outlive the install
 * dialog for as long as the plugin runs here. Null when nothing was bypassed.
 */
export function bypassChip(b: TrekRangeBypass | null | undefined, t: T) {
  if (!b) return null
  const label = b.acceptedByAdmin
    ? b.trekRange
      ? t('admin.plugins.dep.trekAccepted', { range: b.trekRange, host: b.hostVersion })
      : t('admin.plugins.dep.trekAcceptedUnknown')
    : b.trekRange
      ? t('admin.plugins.dep.trekBypassed', { range: b.trekRange, host: b.hostVersion })
      : t('admin.plugins.dep.trekBypassedUnknown')
  return {
    icon: AlertTriangle,
    label,
    blocked: false,
    warn: true,
  }
}

/**
 * The Install button for a registry entry the server flagged incompatible: the server will
 * take the newest version regardless, so the button says exactly that — and carries what
 * the warning has to say first. `byAdmin` is the admin's own "install anyway" for this one
 * plugin; without it the operator set TREK_PLUGINS_IGNORE_TREK_RANGE for every plugin.
 * `title` is the shell's existing "why" line (needs TREK X — this server runs Y).
 */
export function bypassOffer(
  item: { name: string; trek?: string | null; hostVersion?: string },
  t: T,
  title: string,
  byAdmin = false
) {
  const warn: RangeWarning = {
    name: item.name,
    trekRange: item.trek ?? null,
    hostVersion: item.hostVersion ?? '?',
    acceptedByAdmin: byAdmin,
    onConfirm: null,
  }
  return { blocked: false, label: t('admin.plugins.install'), title, warn }
}

/**
 * Title + body of the warning, for either mode: a CONFIRM step before a registry install
 * the server would otherwise refuse (`onConfirm` set), or a plain NOTICE after a path that
 * could not ask first — sideload, dev-link, update, dependency download. The copy is the
 * whole point: the admin is accepting that the author never vouched for this TREK and
 * that, in rare cases, that can cost them data.
 */
export function rangeWarningCopy(
  w: RangeWarning,
  t: T
): { title: string; body: string; confirm: boolean; confirmLabel: string } {
  const confirm = w.onConfirm !== null
  const vars = { name: w.name, range: w.trekRange, host: w.hostVersion }
  const body = w.acceptedByAdmin
    ? w.trekRange
      ? t('admin.plugins.rangeBypass.bodyAdmin', vars)
      : t('admin.plugins.rangeBypass.bodyAdminUnknown', vars)
    : w.trekRange
      ? t('admin.plugins.rangeBypass.body', vars)
      : t('admin.plugins.rangeBypass.bodyUnknown', vars)
  const title = w.acceptedByAdmin
    ? t('admin.plugins.rangeBypass.titleAdmin')
    : confirm
      ? t('admin.plugins.rangeBypass.title')
      : t('admin.plugins.rangeBypass.noticeTitle')
  return {
    confirm,
    title,
    body,
    confirmLabel: w.action === 'activate' ? t('admin.plugins.activateAnyway') : t('admin.plugins.installAnyway'),
  }
}

/**
 * The TREK_PLUGINS_IGNORE_TREK_RANGE warning state behind BOTH admin shells (the desktop
 * panel and the phone panel render their own dialog/sheet over it). `guard` parks a
 * registry install behind the confirm step when the entry was already flagged
 * incompatible; `notice` shows the after-the-fact warning for a response that carries the
 * server's marker. Whether the switch is ON stays a plain `useState` in each shell: its
 * setter is read inside the mount-time refresh, and only a useState setter is something
 * the exhaustive-deps rule knows to be stable.
 */
export function useRangeBypass() {
  const { t } = useTranslation()
  const [warning, setWarning] = useState<RangeWarning | null>(null)

  const notice = (name: string, b: TrekRangeBypass | null | undefined) => {
    if (b) setWarning({ name, trekRange: b.trekRange, hostVersion: b.hostVersion, onConfirm: null })
  }
  const guard = (warn: RangeWarning | undefined, run: () => void) => {
    if (warn) setWarning({ ...warn, onConfirm: run })
    else run()
  }
  const confirm = () => { const w = warning; setWarning(null); w?.onConfirm?.() }
  const dismiss = () => setWarning(null)

  return {
    warning,
    copy: warning ? rangeWarningCopy(warning, t) : null,
    notice, guard, confirm, dismiss,
  }
}
