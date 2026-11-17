import { AlertTriangle, CheckCircle, Copy, Loader2, Mail, PlugZap, Save, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { TranslationFn } from '../../../types';
import { copyText } from '../../../utils/clipboard';
import { relativeTime } from '../../../utils/relativeTime';
import {
  HintMark,
  SETTINGS_BUTTON,
  SETTINGS_BUTTON_PRIMARY,
  SettingRow,
  SettingRows,
  SettingsCard,
  StatusPill,
} from '../../Settings/settingsKit';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import CustomSelect from '../../shared/CustomSelect';
import { EditorField, GRID_2, INPUT, READONLY_BOX } from '../../shared/dialogParts';
import { useToast } from '../../shared/Toast';
import {
  TRANSPORTS,
  problemText,
  statTiles,
  statusFacts,
  transportInfo,
  transportLabel,
  type MailAdminForm,
  type MailAdminProblem,
  type StatTone,
} from './mailIngestAdminModel';
import { useMailIngestAdmin, type MailIngestAdmin } from './useMailIngestAdmin';

type T = TranslationFn;

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
          className={SETTINGS_BUTTON}
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

/** The colour a count takes once it is not zero. */
const STAT_COLOUR: Record<StatTone, string> = {
  neutral: 'text-content',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/**
 * How the import runs, in counts only: no subject, sender or content of a mail
 * is ever shown here. One line: the last successful read (green, or amber while
 * the last run failed), then the day's numbers as badges.
 */
function StatusBlock({ admin, t, locale }: { admin: MailIngestAdmin; t: T; locale: string }) {
  const status = admin.status;
  if (!status) return null;
  const facts = statusFacts(status);
  const lastRead = status.last_ok_at
    ? relativeTime(Date.parse(status.last_ok_at), locale)
    : t('mailAdmin.status.never');
  const healthy = !status.last_error && !!status.last_ok_at;
  return (
    <div className="flex flex-col gap-2">
      {/* When it last read, as a plain line with a dot: green while it runs, amber after a failed run. */}
      <p className="m-0 flex items-center gap-1.5 text-caption text-content-muted">
        <span className={`h-1.5 w-1.5 flex-none rounded-full ${healthy ? 'bg-success' : 'bg-warning'}`} />
        {t('mailAdmin.status.lastRead', { time: lastRead })}
      </p>
      {/* The day's counts as one quiet strip: the number over its name, coloured only when it is not zero. */}
      <dl className="m-0 grid grid-cols-2 divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card sm:grid-cols-4 sm:divide-x">
        {statTiles(facts, t).map(({ key, label, value, tone }) => (
          <div key={key} className="flex min-w-0 flex-col-reverse px-3 py-2">
            <dt className="truncate text-caption text-content-faint">{label}</dt>
            <dd
              className={`m-0 text-body font-semibold tabular-nums ${value > 0 ? STAT_COLOUR[tone] : 'text-content'}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {status.last_error && (
        <p className="m-0 flex items-start gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-caption leading-snug text-warning">
          <AlertTriangle size={13} strokeWidth={2.2} className="mt-px flex-none" />
          <span className="min-w-0 break-words">{status.last_error}</span>
        </p>
      )}
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

/** Everything under the switch: how mail arrives, its fields, then save, test and the status. */
function Setup({ admin, form, t, locale }: { admin: MailIngestAdmin; form: MailAdminForm; t: T; locale: string }) {
  const error = (problem: MailAdminProblem) => (admin.problems.includes(problem) ? problemText(problem, t) : undefined);
  return (
    <div className="flex flex-col gap-4">
      <div className={GRID_2}>
        <EditorField
          label={
            <span className="inline-flex items-center gap-1.5">
              {t('mailAdmin.transport.label')}
              <HintMark hint={`${transportLabel(form.transport, t)}: ${transportInfo(form.transport, t)}`} />
            </span>
          }
        >
          <CustomSelect
            value={form.transport}
            onChange={(value) => admin.set('transport', TRANSPORTS.find((x) => x === value) ?? 'off')}
            options={TRANSPORTS.map((x) => ({ value: x, label: transportLabel(x, t) }))}
          />
        </EditorField>
        <EditorField
          label={
            <span className="inline-flex items-center gap-1.5">
              {t('mailAdmin.aiDaily')}
              <HintMark hint={t('mailAdmin.aiDailyHint')} />
            </span>
          }
          htmlFor="mail-ai-daily"
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
      <EditorField
        label={
          <span className="inline-flex items-center gap-1.5">
            {t('mailAdmin.template')}
            <HintMark hint={t('mailAdmin.templateHint', { token: '{token}' })} />
          </span>
        }
        htmlFor="mail-template"
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={SETTINGS_BUTTON_PRIMARY}
          disabled={!admin.dirty || admin.problems.length > 0 || admin.saving}
          onClick={admin.save}
        >
          {admin.saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
          {t('common.save')}
        </button>
        <button
          type="button"
          className={SETTINGS_BUTTON}
          disabled={admin.testing || admin.dirty || form.transport === 'off'}
          onClick={admin.runTest}
        >
          {admin.testing ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} strokeWidth={2} />}
          {t('mailAdmin.test.run')}
        </button>
        <TestResult admin={admin} t={t} />
        <HintMark hint={t('mailAdmin.envHint')} />
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
