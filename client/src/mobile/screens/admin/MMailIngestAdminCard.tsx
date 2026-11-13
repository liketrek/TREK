import { Inbox, Upload, Webhook } from 'lucide-react';
import {
  TRANSPORTS,
  problemText,
  statusFacts,
  transportInfo,
  transportLabel,
  type MailAdminForm,
  type MailAdminProblem,
} from '../../../components/Admin/mailIngest/mailIngestAdminModel';
import { useMailIngestAdmin, type MailIngestAdmin } from '../../../components/Admin/mailIngest/useMailIngestAdmin';
import { useTranslation } from '../../../i18n';
import type { TranslationFn } from '../../../types';
import { relativeTime } from '../../../utils/relativeTime';
import MSegmented from '../../components/MSegmented';
import MToggle from '../../components/MToggle';
import {
  MAdminButton,
  MAdminCard,
  MAdminCardHead,
  MAdminField,
  MAdminInput,
  MAdminRow,
  MAdminSecretInput,
} from './MAdminUi';

interface PartProps {
  admin: MailIngestAdmin;
  form: MailAdminForm;
  t: TranslationFn;
}

/** The symbol of each way of taking mail in, as on the desktop card. */
function TransportIcon({ transport }: { transport: MailAdminForm['transport'] }) {
  const Icon = transport === 'imap' ? Inbox : transport === 'webhook' ? Webhook : Upload;
  return <Icon size={14} strokeWidth={2.1} />;
}

/** The problem under a field, in the danger colour, or nothing. */
function Problem({ admin, problem, t }: { admin: MailIngestAdmin; problem: MailAdminProblem; t: TranslationFn }) {
  if (!admin.problems.includes(problem)) return null;
  return <p className="mt-1 text-caption text-[color:var(--m-st-danger)]">{problemText(problem, t)}</p>;
}

function ImapFields({ admin, form, t }: PartProps) {
  return (
    <>
      <MAdminField label={t('mailAdmin.imap.host')}>
        <MAdminInput
          value={form.imap_host}
          placeholder="imap.example.com"
          onChange={(e) => admin.set('imap_host', e.target.value)}
        />
      </MAdminField>
      <div className="grid grid-cols-2 gap-2">
        <MAdminField label={t('mailAdmin.imap.port')}>
          <MAdminInput
            inputMode="numeric"
            value={form.imap_port}
            onChange={(e) => admin.set('imap_port', e.target.value)}
          />
          <Problem admin={admin} problem="portInvalid" t={t} />
        </MAdminField>
        <MAdminField label={t('mailAdmin.imap.tls')}>
          <MSegmented
            value={form.imap_tls}
            onChange={(value) => admin.set('imap_tls', value)}
            options={[
              { value: 'tls', label: 'TLS' },
              { value: 'starttls', label: 'STARTTLS' },
            ]}
          />
        </MAdminField>
      </div>
      <MAdminField label={t('mailAdmin.imap.user')}>
        <MAdminInput
          autoComplete="off"
          value={form.imap_user}
          onChange={(e) => admin.set('imap_user', e.target.value)}
        />
      </MAdminField>
      <MAdminField label={t('mailAdmin.imap.pass')}>
        <MAdminSecretInput
          autoComplete="new-password"
          value={form.imap_pass}
          onChange={(e) => admin.set('imap_pass', e.target.value)}
        />
      </MAdminField>
      <MAdminField label={t('mailAdmin.imap.mailbox')} hint={t('mailAdmin.imap.mailboxHint')}>
        <MAdminInput value={form.imap_mailbox} onChange={(e) => admin.set('imap_mailbox', e.target.value)} />
      </MAdminField>
    </>
  );
}

function WebhookFields({ admin, form, t }: PartProps) {
  return (
    <>
      <MAdminField label={t('mailAdmin.webhook.secret')} hint={t('mailAdmin.webhook.secretHint')}>
        <MAdminSecretInput
          autoComplete="new-password"
          value={form.webhook_secret}
          onChange={(e) => admin.set('webhook_secret', e.target.value)}
        />
        <Problem admin={admin} problem="secretShort" t={t} />
      </MAdminField>
      <MAdminField label={t('mailAdmin.inboundUrl')} hint={t('mailAdmin.inboundUrlHint')}>
        <p className="break-all font-geist text-caption text-m-muted">{`${window.location.origin}/api/mail-ingest/inbound`}</p>
      </MAdminField>
    </>
  );
}

/** How the import runs, in counts only. */
function Status({ admin, t, locale }: { admin: MailIngestAdmin; t: TranslationFn; locale: string }) {
  const status = admin.status;
  if (!status) return null;
  const facts = statusFacts(status);
  const lastRead = status.last_ok_at
    ? relativeTime(Date.parse(status.last_ok_at), locale)
    : t('mailAdmin.status.never');
  return (
    <div className="mt-3 rounded-[12px] bg-[color:var(--m-ic)] px-3 py-[10px]">
      <p className="text-caption font-semibold text-m-ink">{t('mailAdmin.status.lastRead', { time: lastRead })}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-[6px]">
        {[
          { label: t('mailAdmin.status.mails'), value: facts.mails },
          { label: t('mailAdmin.status.added'), value: facts.added },
          { label: t('mailAdmin.status.waiting'), value: facts.waiting },
          { label: t('mailAdmin.status.failed'), value: facts.failed },
        ].map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-2">
            <span className="truncate text-caption text-m-faint">{f.label}</span>
            <span className="font-geist text-body font-bold tabular-nums text-m-ink">{f.value}</span>
          </div>
        ))}
      </div>
      {status.last_error && <p className="mt-2 text-caption text-[color:var(--m-st-pending)]">{status.last_error}</p>}
    </div>
  );
}

function Setup({ admin, form, t, locale }: PartProps & { locale: string }) {
  return (
    <div className="flex flex-col gap-3 px-[14px] pb-[14px] pt-1">
      <MAdminField label={t('mailAdmin.transport.label')}>
        <MSegmented
          value={form.transport}
          onChange={(value) => admin.set('transport', value)}
          options={TRANSPORTS.map((x) => ({ value: x, label: transportLabel(x, t) }))}
        />
        <div className="mt-2 flex items-center gap-[10px] rounded-[14px] border border-[color-mix(in_srgb,var(--m-st-info)_22%,transparent)] bg-[color-mix(in_srgb,var(--m-st-info)_10%,transparent)] px-3 py-[10px]">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[color-mix(in_srgb,var(--m-st-info)_16%,transparent)] text-[color:var(--m-st-info)]">
            <TransportIcon transport={form.transport} />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-bold text-[color:var(--m-st-info)]">{transportLabel(form.transport, t)}</p>
            <p className="mt-px text-caption leading-snug text-m-muted">{transportInfo(form.transport, t)}</p>
          </div>
        </div>
      </MAdminField>
      <MAdminField label={t('mailAdmin.template')} hint={t('mailAdmin.templateHint', { token: '{token}' })}>
        <MAdminInput
          value={form.address_template}
          placeholder="trek+{token}@example.com"
          onChange={(e) => admin.set('address_template', e.target.value)}
        />
        <Problem admin={admin} problem="templateToken" t={t} />
      </MAdminField>
      {form.transport === 'imap' && <ImapFields admin={admin} form={form} t={t} />}
      {form.transport === 'webhook' && <WebhookFields admin={admin} form={form} t={t} />}
      <MAdminField label={t('mailAdmin.aiDaily')} hint={t('mailAdmin.aiDailyHint')}>
        <MAdminInput
          inputMode="numeric"
          value={form.ai_per_user_daily}
          onChange={(e) => admin.set('ai_per_user_daily', e.target.value)}
        />
        <Problem admin={admin} problem="dailyInvalid" t={t} />
      </MAdminField>
      <p className="text-caption text-m-faint">{t('mailAdmin.envHint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <MAdminButton busy={admin.saving} disabled={!admin.dirty || admin.problems.length > 0} onClick={admin.save}>
          {t('common.save')}
        </MAdminButton>
        <MAdminButton
          variant="ghost"
          busy={admin.testing}
          disabled={admin.dirty || form.transport === 'off'}
          onClick={admin.runTest}
        >
          {t('mailAdmin.test.run')}
        </MAdminButton>
        {admin.test && (
          <span
            className={`text-caption font-semibold ${admin.test.ok ? 'text-[color:var(--m-st-confirmed)]' : 'text-[color:var(--m-st-danger)]'}`}
          >
            {admin.test.ok ? t('mailAdmin.test.ok') : (admin.test.error ?? t('mailAdmin.test.failed'))}
          </span>
        )}
      </div>
      <Status admin={admin} t={t} locale={locale} />
    </div>
  );
}

/**
 * The booking mail import in the phone's admin settings, the same card as on
 * the desktop (useMailIngestAdmin): the switch, how mail arrives, the address
 * template, the AI allowance, the test and the status. Self-hosted only.
 */
export default function MMailIngestAdminCard() {
  const { t, locale } = useTranslation();
  const admin = useMailIngestAdmin(true);
  return (
    <MAdminCard>
      <MAdminCardHead title={t('mailAdmin.title')} hint={t('mailAdmin.hint')} />
      <MAdminRow
        title={t('mailAdmin.enabled')}
        hint={t('mailAdmin.enabledHint')}
        trailing={
          <MToggle
            checked={admin.enabled}
            ariaLabel={t('mailAdmin.enabled')}
            disabled={!admin.loaded}
            onChange={admin.toggle}
          />
        }
      />
      {admin.enabled && admin.form && <Setup admin={admin} form={admin.form} t={t} locale={locale} />}
    </MAdminCard>
  );
}
