import { CheckCircle, Copy, Inbox, Loader2, Mail, PlugZap, Save, Upload, Webhook, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { TranslationFn } from '../../../types';
import { copyText } from '../../../utils/clipboard';
import { relativeTime } from '../../../utils/relativeTime';
import {
  SETTINGS_BUTTON,
  SETTINGS_BUTTON_PRIMARY,
  SettingRow,
  SettingRows,
  SettingsCard,
  SettingsHint,
  StatusPill,
} from '../../Settings/settingsKit';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import CustomSelect from '../../shared/CustomSelect';
import { EditorField, GRID_2, INPUT, READONLY_BOX } from '../../shared/dialogParts';
import { useToast } from '../../shared/Toast';
import {
  TRANSPORTS,
  problemText,
  statusFacts,
  transportInfo,
  transportLabel,
  type MailAdminForm,
  type MailAdminProblem,
} from './mailIngestAdminModel';
import { useMailIngestAdmin, type MailIngestAdmin } from './useMailIngestAdmin';

type T = TranslationFn;

/** The card's buttons sit inside the form, one size below the page's: caption type, tighter padding. */
const SMALL = 'px-3 py-1.5 text-caption';

/** The address a mail service posts to, shown so the admin can paste it into the sender's settings. */
function InboundUrl({ t }: { t: T }) {
  const toast = useToast();
  const url = `${window.location.origin}/api/mail-ingest/inbound`;
  return (
    <EditorField label={t('mailAdmin.inboundUrl')} hint={t('mailAdmin.inboundUrlHint')}>
      <div className="flex gap-2">
        <span className={READONLY_BOX}>{url}</span>
        <button
          type="button"
          className={`${SETTINGS_BUTTON} ${SMALL}`}
          aria-label={t('mailAdmin.copyUrl')}
          onClick={() => void copyText(url).then((ok) => (ok ? toast.success(t('common.copied')) : undefined))}
        >
          <Copy size={14} strokeWidth={2} />
        </button>
      </div>
    </EditorField>
  );
}

interface FieldsProps {
  admin: MailIngestAdmin;
  form: MailAdminForm;
  t: T;
  error: (p: MailAdminProblem) => ReactNode;
}

function ImapFields({ admin, form, t, error }: FieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className={GRID_2}>
        <EditorField label={t('mailAdmin.imap.host')} htmlFor="mail-imap-host">
          <input
            id="mail-imap-host"
            className={INPUT}
            value={form.imap_host}
            placeholder="imap.example.com"
            onChange={(e) => admin.set('imap_host', e.target.value)}
          />
        </EditorField>
        <div className={GRID_2}>
          <EditorField label={t('mailAdmin.imap.port')} htmlFor="mail-imap-port" error={error('portInvalid')}>
            <input
              id="mail-imap-port"
              className={INPUT}
              inputMode="numeric"
              value={form.imap_port}
              onChange={(e) => admin.set('imap_port', e.target.value)}
            />
          </EditorField>
          <EditorField label={t('mailAdmin.imap.tls')}>
            <CustomSelect
              value={form.imap_tls}
              onChange={(value) => admin.set('imap_tls', value === 'starttls' ? 'starttls' : 'tls')}
              options={[
                { value: 'tls', label: 'TLS' },
                { value: 'starttls', label: 'STARTTLS' },
              ]}
            />
          </EditorField>
        </div>
      </div>
      <div className={GRID_2}>
        <EditorField label={t('mailAdmin.imap.user')} htmlFor="mail-imap-user">
          <input
            id="mail-imap-user"
            className={INPUT}
            autoComplete="off"
            value={form.imap_user}
            onChange={(e) => admin.set('imap_user', e.target.value)}
          />
        </EditorField>
        <EditorField label={t('mailAdmin.imap.pass')} htmlFor="mail-imap-pass">
          <input
            id="mail-imap-pass"
            className={INPUT}
            type="password"
            autoComplete="new-password"
            value={form.imap_pass}
            onChange={(e) => admin.set('imap_pass', e.target.value)}
          />
        </EditorField>
      </div>
      <EditorField
        label={t('mailAdmin.imap.mailbox')}
        htmlFor="mail-imap-mailbox"
        hint={t('mailAdmin.imap.mailboxHint')}
      >
        <input
          id="mail-imap-mailbox"
          className={INPUT}
          value={form.imap_mailbox}
          onChange={(e) => admin.set('imap_mailbox', e.target.value)}
        />
      </EditorField>
    </div>
  );
}

function WebhookFields({ admin, form, t, error }: FieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <EditorField
        label={t('mailAdmin.webhook.secret')}
        htmlFor="mail-webhook-secret"
        hint={t('mailAdmin.webhook.secretHint')}
        error={error('secretShort')}
      >
        <input
          id="mail-webhook-secret"
          className={INPUT}
          type="password"
          autoComplete="new-password"
          value={form.webhook_secret}
          onChange={(e) => admin.set('webhook_secret', e.target.value)}
        />
      </EditorField>
      <InboundUrl t={t} />
    </div>
  );
}

/** How the import runs, in counts only: no subject, sender or content of a mail is ever shown here. */
function StatusBlock({ admin, t, locale }: { admin: MailIngestAdmin; t: T; locale: string }) {
  const status = admin.status;
  if (!status) return null;
  const facts = statusFacts(status);
  const lastRead = status.last_ok_at
    ? relativeTime(Date.parse(status.last_ok_at), locale)
    : t('mailAdmin.status.never');
  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-edge-faint bg-surface-secondary px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-content-faint">
          {t('mailAdmin.status.title')}
        </span>
        <StatusPill tone={status.last_error ? 'warning' : 'neutral'}>
          {t('mailAdmin.status.lastRead', { time: lastRead })}
        </StatusPill>
      </div>
      <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
        {[
          { label: t('mailAdmin.status.mails'), value: facts.mails },
          { label: t('mailAdmin.status.added'), value: facts.added },
          { label: t('mailAdmin.status.waiting'), value: facts.waiting },
          { label: t('mailAdmin.status.failed'), value: facts.failed },
        ].map((f) => (
          <div key={f.label} className="min-w-0">
            <div className="truncate text-caption text-content-faint">{f.label}</div>
            <div className="text-body font-semibold tabular-nums text-content">{f.value}</div>
          </div>
        ))}
      </div>
      {status.last_error && <SettingsHint className="text-warning">{status.last_error}</SettingsHint>}
    </div>
  );
}

function TestResult({ admin, t }: { admin: MailIngestAdmin; t: T }) {
  if (!admin.test) return null;
  return admin.test.ok ? (
    <StatusPill tone="success" icon={<CheckCircle size={12} strokeWidth={2.2} />}>
      {t('mailAdmin.test.ok')}
    </StatusPill>
  ) : (
    <StatusPill tone="danger" icon={<XCircle size={12} strokeWidth={2.2} />}>
      {admin.test.error ?? t('mailAdmin.test.failed')}
    </StatusPill>
  );
}

const TRANSPORT_ICON = { off: Upload, imap: Inbox, webhook: Webhook } as const;

/** What the chosen way of taking mail in means, as a calm blue note under the choice. */
function TransportInfo({ transport, t }: { transport: MailAdminForm['transport']; t: T }) {
  const Icon = TRANSPORT_ICON[transport];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--info)_22%,transparent)] bg-info-soft px-3.5 py-3">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[color-mix(in_srgb,var(--info)_16%,transparent)] text-info">
        <Icon size={15} strokeWidth={2.1} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-caption font-semibold text-info">{transportLabel(transport, t)}</p>
        <p className="m-0 mt-0.5 text-caption leading-snug text-content-secondary">{transportInfo(transport, t)}</p>
      </div>
    </div>
  );
}

/** Everything under the switch: how mail arrives, its fields, then save, test and the status. */
function Setup({ admin, form, t, locale }: { admin: MailIngestAdmin; form: MailAdminForm; t: T; locale: string }) {
  const error = (problem: MailAdminProblem) => (admin.problems.includes(problem) ? problemText(problem, t) : undefined);
  return (
    <div className="flex flex-col gap-4">
      <div className={GRID_2}>
        <EditorField label={t('mailAdmin.transport.label')}>
          <CustomSelect
            value={form.transport}
            onChange={(value) => admin.set('transport', TRANSPORTS.find((x) => x === value) ?? 'off')}
            options={TRANSPORTS.map((x) => ({ value: x, label: transportLabel(x, t) }))}
          />
        </EditorField>
        <EditorField
          label={t('mailAdmin.aiDaily')}
          htmlFor="mail-ai-daily"
          hint={t('mailAdmin.aiDailyHint')}
          error={error('dailyInvalid')}
        >
          <input
            id="mail-ai-daily"
            className={INPUT}
            inputMode="numeric"
            value={form.ai_per_user_daily}
            onChange={(e) => admin.set('ai_per_user_daily', e.target.value)}
          />
        </EditorField>
      </div>
      <TransportInfo transport={form.transport} t={t} />
      <EditorField
        label={t('mailAdmin.template')}
        htmlFor="mail-template"
        hint={t('mailAdmin.templateHint', { token: '{token}' })}
        error={error('templateToken')}
      >
        <input
          id="mail-template"
          className={INPUT}
          value={form.address_template}
          placeholder="trek+{token}@example.com"
          onChange={(e) => admin.set('address_template', e.target.value)}
        />
      </EditorField>
      {form.transport === 'imap' && <ImapFields admin={admin} form={form} t={t} error={error} />}
      {form.transport === 'webhook' && <WebhookFields admin={admin} form={form} t={t} error={error} />}
      <SettingsHint>{t('mailAdmin.envHint')}</SettingsHint>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${SETTINGS_BUTTON_PRIMARY} ${SMALL}`}
          disabled={!admin.dirty || admin.problems.length > 0 || admin.saving}
          onClick={admin.save}
        >
          {admin.saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
          {t('common.save')}
        </button>
        <button
          type="button"
          className={`${SETTINGS_BUTTON} ${SMALL}`}
          disabled={admin.testing || admin.dirty || form.transport === 'off'}
          onClick={admin.runTest}
        >
          {admin.testing ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} strokeWidth={2} />}
          {t('mailAdmin.test.run')}
        </button>
        <TestResult admin={admin} t={t} />
      </div>
      <StatusBlock admin={admin} t={t} locale={locale} />
    </div>
  );
}

/**
 * The booking mail import in the admin settings of a self-hosted install: the
 * instance switch, how mail arrives (IMAP or a signed webhook), the forwarding
 * address template, the AI allowance per person and day, a connection test and
 * the status in counts. Not shown on a managed install, where the operator
 * runs the TREK Cloud relay.
 */
export default function MailIngestAdminCard() {
  const { t, locale } = useTranslation();
  const admin = useMailIngestAdmin(true);
  return (
    <SettingsCard icon={Mail} title={t('mailAdmin.title')} hint={t('mailAdmin.hint')}>
      <SettingRows>
        <SettingRow
          label={t('mailAdmin.enabled')}
          hint={t('mailAdmin.enabledHint')}
          control={
            <ToggleSwitch
              on={admin.enabled}
              label={t('mailAdmin.enabled')}
              disabled={!admin.loaded}
              onToggle={() => admin.toggle(!admin.enabled)}
            />
          }
        />
      </SettingRows>
      {admin.enabled && admin.form && <Setup admin={admin} form={admin.form} t={t} locale={locale} />}
    </SettingsCard>
  );
}
