import { useState } from 'react'
import { AlertTriangle, Check, Loader2, ShieldAlert } from 'lucide-react'
import Modal from '../../shared/Modal'
import ToggleSwitch from '../../Settings/ToggleSwitch'
import { useTranslation } from '../../../i18n/TranslationContext'
import { useConnectForm } from './useConnectForm'
import { Badge } from './DocSyncBits'
import { DOCUMENT_PROVIDER_ICONS } from '../../shared/DocumentProviderIcons'
import type { DocSyncProvider, useDocSync } from './useDocSync'

/**
 * Connecting a store, as a dialog rather than a panel that unfolds in place.
 *
 * Entering a URL and a token is a task with a beginning and an end, and doing it
 * inside the list meant the list jumped around while someone typed. The dialog
 * also gives the probe result somewhere to live that is not a line of text
 * squeezed between two fields.
 */
export default function DocSyncConnectModal({
  provider,
  sync,
  onClose,
  onConnected,
}: {
  provider: DocSyncProvider
  sync: ReturnType<typeof useDocSync>
  onClose: () => void
  onConnected: (providerId: string) => void
}) {
  const { t } = useTranslation()
  const existing = sync.connectionFor(provider.id)
  const Icon = DOCUMENT_PROVIDER_ICONS[provider.id]

  const form = useConnectForm(provider, existing, sync)
  const [verdict, setVerdict] = useState<{ connected: boolean; account?: string; error?: string } | null>(null)

  const test = async () => setVerdict(await form.probe())

  const save = async () => {
    if (await form.save()) onConnected(provider.id)
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2.5">
          {Icon && <Icon className="h-5 w-5 text-content" />}
          <span>{provider.name}</span>
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Verdict verdict={verdict} busy={sync.busy === 'test'} failure={sync.error} />
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void test()}
              disabled={!form.complete || sync.busy === 'test'}
              className="rounded-lg border border-edge px-3.5 py-2 text-body text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              {t('docsync.test')}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!form.complete || sync.busy === 'save'}
              className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-body font-medium text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sync.busy === 'save' && <Loader2 size={14} className="animate-spin" />}
              {t('docsync.connect.submit')}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-caption text-content-muted">{t(`docsync.connect.about.${provider.id}`)}</p>

        {form.fields.map(f => (
          <Field
            key={f.field_key}
            label={t(form.labelKey(f))}
            hint={form.hintKey(f) ? t(form.hintKey(f) as string) : undefined}
            required={f.required}
          >
            <input
              type={f.input_type === 'password' ? 'password' : 'text'}
              value={form.valueOf(f.field_key)}
              placeholder={form.placeholderOf(f)}
              onChange={e => form.setValue(f.field_key, e.target.value)}
              className="w-full rounded-lg border border-edge bg-surface-input px-3 py-2.5 text-body text-content ring-accent transition-shadow placeholder:text-content-faint focus:outline-none focus:ring-2"
            />
          </Field>
        ))}

        <label className="flex items-start justify-between gap-4 rounded-lg border border-edge bg-surface-secondary px-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-body text-content">{t('docsync.allowInsecureTls')}</span>
            <span className="mt-0.5 block text-caption text-content-muted">
              {t('docsync.connect.insecureHint')}
            </span>
          </span>
          <span className="shrink-0 pt-0.5">
            <ToggleSwitch on={form.insecureTls} onToggle={() => form.setInsecureTls(!form.insecureTls)} />
          </span>
        </label>
      </div>
    </Modal>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2">
        <span className="text-body font-medium text-content">{label}</span>
        {!required && <Badge tone="neutral">{t('docsync.connect.optional')}</Badge>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-caption text-content-muted">{hint}</span>}
    </label>
  )
}

/** The probe result, in the footer where it stays put while the form scrolls. */
function Verdict({
  verdict,
  busy,
  failure,
}: {
  verdict: { connected: boolean; account?: string; error?: string } | null
  busy: boolean
  /** A call that failed outside the connection test (saving, most of all). */
  failure: string | null
}) {
  const { t } = useTranslation()
  if (busy) {
    return (
      <span className="flex min-w-0 items-center gap-2 text-caption text-content-muted">
        <Loader2 size={14} className="animate-spin" />
        {t('docsync.connect.testing')}
      </span>
    )
  }
  // A save that the server refused left the dialog open with the button back to
  // normal and nothing else said, which reads as nothing having happened. The
  // test verdict wins the space when there is one: it is the more specific
  // answer and the one the person just asked for.
  if (!verdict && failure) {
    return (
      <span className="flex min-w-0 items-center gap-2 text-caption text-danger">
        <AlertTriangle size={14} />
        <span className="truncate">{t(`docsync.error.${failure}`)}</span>
      </span>
    )
  }
  if (!verdict) return <span />
  if (verdict.connected) {
    return (
      <span className="flex min-w-0 items-center gap-2 text-caption text-success">
        <Check size={14} strokeWidth={2.5} />
        <span className="truncate">
          {verdict.account ? t('docsync.connect.okAs', { account: verdict.account }) : t('docsync.connected')}
        </span>
      </span>
    )
  }
  const blocked = verdict.error === 'ssrf_blocked' || verdict.error === 'tls_untrusted'
  return (
    <span className="flex min-w-0 items-center gap-2 text-caption text-danger">
      {blocked ? <ShieldAlert size={14} /> : <AlertTriangle size={14} />}
      <span className="truncate">{t(`docsync.error.${verdict.error || 'unknown'}`)}</span>
    </span>
  )
}
