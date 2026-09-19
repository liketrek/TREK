import { useState } from 'react'
import {
  AlertTriangle, Check, ChevronDown, Clock, Copy, FolderOpen, Link2Off, RefreshCw,
} from 'lucide-react'
import CustomSelect from '../../shared/CustomSelect'
import ToggleSwitch from '../../Settings/ToggleSwitch'
import Tooltip from '../../shared/Tooltip'
import { useTranslation } from '../../../i18n/TranslationContext'
import { DOCUMENT_PROVIDER_ICONS } from '../../shared/DocumentProviderIcons'
import DocSyncFlow, { type SyncDirection } from './DocSyncFlow'
import { Badge, CONFLICT_POLICIES, conflictPolicyKey, LastRun, StateBadge } from './DocSyncBits'
import { bindingNotice, type DocSyncLink, type useDocSync } from './useDocSync'

/**
 * One binding: where this trip's documents live, which way they move, and what
 * happened last time.
 *
 * The flow bar carries the direction because that is the one thing this feature
 * is about. Everything a person sets once and forgets (the delete rule, the
 * webhook URL) is folded away behind "Settings" so the card stays a status
 * card rather than a form.
 */
export default function DocSyncBinding({
  link,
  providerName,
  sync,
  canManage,
}: {
  link: DocSyncLink
  providerName: string
  sync: ReturnType<typeof useDocSync>
  canManage: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const Icon = DOCUMENT_PROVIDER_ICONS[link.providerId]
  const busy = sync.busy === `sync-${link.id}`
  const notice = bindingNotice(link, t)

  const copyWebhook = async () => {
    if (!link.webhookUrl) return
    try {
      await navigator.clipboard.writeText(link.webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard is blocked outside a secure context; the URL is selectable.
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
      <header className="flex flex-wrap items-start gap-x-3 gap-y-3 px-4 py-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-edge bg-surface-secondary">
          {Icon ? <Icon className="h-5 w-5 text-content" /> : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-subtitle font-semibold text-content">
              {providerName}
            </span>
            {/* A healthy binding needs no word for it: the dot is the whole
                message, and the states that do need words get them below. */}
            <StateBadge state={link.lastSyncState} compact={link.lastSyncState === 'ok'} />
            {!link.syncEnabled && <Badge tone="neutral">{t('docsync.binding.autoOff')}</Badge>}
          </span>

          {/* Where and when, as two facts rather than a sentence. They are what
              a member checks before asking why a file has not turned up. */}
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral" icon={<FolderOpen size={12} />} title={link.remoteRootPath || undefined}>
              <span className="max-w-[12rem] truncate">
                {link.remoteLabel || link.remoteRootPath || link.scopeKey}
              </span>
            </Badge>
            <Badge tone="neutral" icon={<Clock size={12} />}>
              <LastRun at={link.lastSyncAt} />
            </Badge>
          </span>
        </span>

        {/* Both controls are h-9 so the square one cannot sit a pixel off the
            other: the two together read as one segmented control. */}
        <span className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => void sync.syncNow(link.id)}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-lg border border-edge bg-surface px-3 text-caption font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            {/* Taken out of the layout below sm rather than out of the document:
                `hidden` left a screen reader announcing a bare "button" there,
                and an aria-label would have frozen the name while the visible
                text still changes to "Syncing". */}
            <span className="sr-only sm:not-sr-only">{busy ? t('docsync.syncing') : t('docsync.syncNow')}</span>
          </button>
          {canManage && (
            <Tooltip label={t('docsync.unlink')}>
              <button
                type="button"
                onClick={() => void sync.removeLink(link.id)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-edge bg-surface text-content-muted transition-colors hover:bg-danger-soft hover:text-danger"
                aria-label={t('docsync.unlink')}
              >
                <Link2Off size={14} />
              </button>
            </Tooltip>
          )}
        </span>
      </header>

      {notice && (
        <p className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-caption text-warning">
          <AlertTriangle size={13} className="mt-px shrink-0" />
          <span>{notice}</span>
        </p>
      )}

      <div className="px-4 pb-3">
        <DocSyncFlow
          direction={link.direction}
          providerId={link.providerId}
          providerName={providerName}
          running={busy}
          holdings={link.holdings ?? { inTrek: 0, atProvider: 0, paired: 0, missing: 0 }}
          disabled={!canManage}
          onChange={(next: SyncDirection) => void sync.updateLink(link.id, { direction: next })}
        />
      </div>

      {canManage && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex w-full items-center gap-1.5 border-t border-edge-faint px-4 py-2.5 text-left text-caption text-content-muted transition-colors hover:bg-surface-hover"
          >
            <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            {t('docsync.binding.settings')}
          </button>

          {open && (
            <div className="space-y-3 border-t border-edge-faint bg-surface-secondary px-4 py-3">
              <Row label={t('docsync.deletePolicy')} hint={t('docsync.binding.deleteHint')}>
                <CustomSelect
                  size="sm"
                  value={link.deletePolicy}
                  onChange={v => void sync.updateLink(link.id, { deletePolicy: String(v) })}
                  options={[
                    { value: 'unlink', label: t('docsync.deleteUnlink') },
                    { value: 'trash', label: t('docsync.deleteTrash') },
                  ]}
                />
              </Row>

              <Row label={t('docsync.conflictPolicy')} hint={t('docsync.binding.conflictHint')}>
                <CustomSelect
                  size="sm"
                  value={link.conflictPolicy}
                  onChange={v => void sync.updateLink(link.id, { conflictPolicy: String(v) })}
                  options={CONFLICT_POLICIES.map(p => ({ value: p, label: t(conflictPolicyKey(p)) }))}
                />
              </Row>

              <Row label={t('docsync.syncEnabled')} hint={t('docsync.binding.autoHint')}>
                <span className="flex justify-end">
                  <ToggleSwitch
                    on={link.syncEnabled}
                    onToggle={() => void sync.updateLink(link.id, { syncEnabled: !link.syncEnabled })}
                  />
                </span>
              </Row>

              {/* Only where TREK could not subscribe itself. Papra's webhook CRUD
                  is closed to API keys and Nextcloud's needs admin rights, so the
                  person pastes this in by hand; polling carries it either way. */}
              {link.webhookUrl && (
                <div>
                  {/* Same tier as the two rows above it: this is the third
                      setting, not a footnote to the second. */}
                  <span className="block text-body text-content">{t('docsync.binding.webhookTitle')}</span>
                  <p className="mt-1 text-caption text-content-muted">{t('docsync.webhookHint')}</p>
                  <div className="mt-1.5 flex items-stretch gap-1.5">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-caption text-content-secondary">
                      {link.webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyWebhook()}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge px-2.5 text-caption text-content-secondary transition-colors hover:bg-surface-hover"
                    >
                      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      {copied ? t('docsync.binding.copied') : t('docsync.binding.copy')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </article>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-body text-content">{label}</span>
        {hint && <span className="mt-0.5 block text-caption text-content-muted">{hint}</span>}
      </span>
      <span className="w-56 shrink-0">{children}</span>
    </div>
  )
}
