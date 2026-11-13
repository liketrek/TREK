import type { MailIngestAdminStatusResponse, MailIngestImapTls } from '@trek/shared';
import type { TranslationFn } from '../../../types';

/**
 * The admin form of the booking mail import, as plain data: which stored app
 * setting each field is, how the server's answer becomes the form, which
 * fields changed, and what the status card says. Shared by the desktop card
 * and the phone's admin section; no React here.
 */

/** The transports an admin picks on a self-hosted install; the TREK Cloud relay is set by the operator. */
type MailAdminTransport = 'off' | 'imap' | 'webhook';

export interface MailAdminForm {
  transport: MailAdminTransport;
  address_template: string;
  imap_host: string;
  imap_port: string;
  imap_tls: MailIngestImapTls;
  imap_user: string;
  /** "••••••••" while a stored password is untouched; the server keeps it then. */
  imap_pass: string;
  imap_mailbox: string;
  /** Masked like the password once stored. */
  webhook_secret: string;
  ai_per_user_daily: string;
}

export type MailAdminField = keyof MailAdminForm;

/** What the server sends instead of a stored secret, and takes back as "unchanged". */
export const MASKED = '••••••••';

/** The secret the webhook signs with: empty switches it off, else at least this long. */
const WEBHOOK_SECRET_MIN = 32;

const KEY: Record<MailAdminField, string> = {
  transport: 'mail_ingest_transport',
  address_template: 'mail_ingest_address_template',
  imap_host: 'mail_ingest_imap_host',
  imap_port: 'mail_ingest_imap_port',
  imap_tls: 'mail_ingest_imap_tls',
  imap_user: 'mail_ingest_imap_user',
  imap_pass: 'mail_ingest_imap_pass',
  imap_mailbox: 'mail_ingest_imap_mailbox',
  webhook_secret: 'mail_ingest_webhook_secret',
  ai_per_user_daily: 'mail_ingest_ai_per_user_daily',
};

export const ENABLED_KEY = 'mail_ingest_enabled';

const str = (value: unknown, fallback: string): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;

/** The form from the admin's app settings; a key the server leaves out has its default. */
export function formOf(settings: Record<string, unknown>): MailAdminForm {
  const transport = str(settings[KEY.transport], 'off');
  const tls = str(settings[KEY.imap_tls], 'tls');
  return {
    transport: transport === 'imap' || transport === 'webhook' ? transport : 'off',
    address_template: str(settings[KEY.address_template], ''),
    imap_host: str(settings[KEY.imap_host], ''),
    imap_port: str(settings[KEY.imap_port], '993'),
    imap_tls: tls === 'starttls' ? 'starttls' : 'tls',
    imap_user: str(settings[KEY.imap_user], ''),
    imap_pass: str(settings[KEY.imap_pass], ''),
    imap_mailbox: str(settings[KEY.imap_mailbox], 'INBOX'),
    webhook_secret: str(settings[KEY.webhook_secret], ''),
    ai_per_user_daily: str(settings[KEY.ai_per_user_daily], '10'),
  };
}

export function enabledOf(settings: Record<string, unknown>): boolean {
  return String(settings[ENABLED_KEY] ?? 'false') === 'true';
}

/** Only what changed, under the stored keys, so a save never touches a field the admin left alone. */
export function changesOf(form: MailAdminForm, saved: MailAdminForm): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const field of Object.keys(KEY) as MailAdminField[]) {
    if (form[field] !== saved[field]) patch[KEY[field]] = form[field].trim();
  }
  return patch;
}

/** The fields the chosen transport shows, so the form never asks for what will not be used. */
export function fieldsOf(transport: MailAdminTransport): MailAdminField[] {
  switch (transport) {
    case 'imap':
      return ['imap_host', 'imap_port', 'imap_tls', 'imap_user', 'imap_pass', 'imap_mailbox'];
    case 'webhook':
      return ['webhook_secret'];
    case 'off':
      return [];
  }
}

export type MailAdminProblem = 'secretShort' | 'portInvalid' | 'templateToken' | 'dailyInvalid';

/** What stops a save, checked here so the admin hears it before the server answers. */
export function problemsOf(form: MailAdminForm): MailAdminProblem[] {
  const problems: MailAdminProblem[] = [];
  const secret = form.webhook_secret.trim();
  if (form.transport === 'webhook' && secret !== MASKED && secret.length > 0 && secret.length < WEBHOOK_SECRET_MIN) {
    problems.push('secretShort');
  }
  const port = Number(form.imap_port);
  if (form.transport === 'imap' && !(Number.isInteger(port) && port > 0 && port < 65536)) problems.push('portInvalid');
  if (form.address_template.trim() && !form.address_template.includes('{token}')) problems.push('templateToken');
  const daily = Number(form.ai_per_user_daily);
  if (!(Number.isInteger(daily) && daily >= 0 && daily <= 1000)) problems.push('dailyInvalid');
  return problems;
}

/** The status card in numbers: mails of the last day, added on their own, open entries. */
export function statusFacts(status: MailIngestAdminStatusResponse): {
  mails: number;
  added: number;
  waiting: number;
  failed: number;
} {
  const byStatus = status.last_day.by_status;
  const mails = Object.values(byStatus).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  return {
    mails,
    added: status.auto_applied,
    waiting: status.backlog.reduce((sum, n) => sum + n, 0),
    failed: byStatus.failed ?? 0,
  };
}

/** A problem in the admin's words; a switch of literal keys so the i18n check sees each one. */
export function problemText(problem: MailAdminProblem, t: TranslationFn): string {
  switch (problem) {
    case 'secretShort':
      return t('mailAdmin.problem.secretShort');
    case 'portInvalid':
      return t('mailAdmin.problem.portInvalid');
    case 'templateToken':
      return t('mailAdmin.problem.templateToken', { token: '{token}' });
    case 'dailyInvalid':
      return t('mailAdmin.problem.dailyInvalid');
  }
}

export const TRANSPORTS: MailAdminTransport[] = ['off', 'imap', 'webhook'];

export function transportLabel(transport: MailAdminTransport, t: TranslationFn): string {
  switch (transport) {
    case 'off':
      return t('mailAdmin.transport.off');
    case 'imap':
      return t('mailAdmin.transport.imap');
    case 'webhook':
      return t('mailAdmin.transport.webhook');
  }
}

/** What each way of taking mail in means, in a sentence or two, shown under the choice. */
export function transportInfo(transport: MailAdminTransport, t: TranslationFn): string {
  switch (transport) {
    case 'off':
      return t('mailAdmin.transport.offInfo');
    case 'imap':
      return t('mailAdmin.transport.imapInfo');
    case 'webhook':
      return t('mailAdmin.transport.webhookInfo');
  }
}
