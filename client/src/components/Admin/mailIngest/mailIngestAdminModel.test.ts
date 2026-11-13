// FE-ADMIN-MAILINGEST-001 to FE-ADMIN-MAILINGEST-006
import type { MailIngestAdminStatusResponse } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  MASKED,
  TRANSPORTS,
  changesOf,
  enabledOf,
  fieldsOf,
  formOf,
  problemText,
  problemsOf,
  statusFacts,
  transportLabel,
} from './mailIngestAdminModel';

const t = (key: string, params?: Record<string, string | number | null>) =>
  params ? `${key} ${JSON.stringify(params)}` : key;

describe('mailIngestAdminModel', () => {
  it('FE-ADMIN-MAILINGEST-001: reads the stored settings, and the defaults for what the server left out', () => {
    expect(formOf({})).toEqual({
      transport: 'off',
      address_template: '',
      imap_host: '',
      imap_port: '993',
      imap_tls: 'tls',
      imap_user: '',
      imap_pass: '',
      imap_mailbox: 'INBOX',
      webhook_secret: '',
      ai_per_user_daily: '10',
    });
    const form = formOf({
      mail_ingest_transport: 'imap',
      mail_ingest_imap_port: 143,
      mail_ingest_imap_tls: 'starttls',
      mail_ingest_imap_pass: MASKED,
    });
    expect(form).toMatchObject({ transport: 'imap', imap_port: '143', imap_tls: 'starttls', imap_pass: MASKED });
    // The Cloud relay is the operator's, never a choice in this form.
    expect(formOf({ mail_ingest_transport: 'cloud' }).transport).toBe('off');
    expect(enabledOf({ mail_ingest_enabled: 'true' })).toBe(true);
    expect(enabledOf({})).toBe(false);
  });

  it('FE-ADMIN-MAILINGEST-002: a save carries only what changed, trimmed, under the stored keys', () => {
    const saved = formOf({ mail_ingest_imap_pass: MASKED });
    expect(changesOf(saved, saved)).toEqual({});
    const edited = { ...saved, transport: 'imap' as const, imap_host: ' imap.example.com ' };
    expect(changesOf(edited, saved)).toEqual({
      mail_ingest_transport: 'imap',
      mail_ingest_imap_host: 'imap.example.com',
    });
  });

  it('FE-ADMIN-MAILINGEST-003: each transport shows only its own fields', () => {
    expect(fieldsOf('off')).toEqual([]);
    expect(fieldsOf('webhook')).toEqual(['webhook_secret']);
    expect(fieldsOf('imap')).toContain('imap_pass');
  });

  it('FE-ADMIN-MAILINGEST-004: what stops a save is found before the server answers', () => {
    const base = formOf({});
    expect(problemsOf(base)).toEqual([]);
    expect(problemsOf({ ...base, transport: 'webhook', webhook_secret: 'short' })).toEqual(['secretShort']);
    // A stored secret comes back masked, and an empty one switches the webhook off: neither is a problem.
    expect(problemsOf({ ...base, transport: 'webhook', webhook_secret: MASKED })).toEqual([]);
    expect(problemsOf({ ...base, transport: 'webhook', webhook_secret: '' })).toEqual([]);
    expect(problemsOf({ ...base, transport: 'imap', imap_port: '70000' })).toEqual(['portInvalid']);
    expect(problemsOf({ ...base, address_template: 'trek@example.com' })).toEqual(['templateToken']);
    expect(problemsOf({ ...base, ai_per_user_daily: '2.5' })).toEqual(['dailyInvalid']);
  });

  it('FE-ADMIN-MAILINGEST-005: the status card adds up the last day in counts', () => {
    const status: MailIngestAdminStatusResponse = {
      transport: 'imap',
      last_ok_at: null,
      last_error: null,
      lease_until: null,
      last_day: { by_status: { processed: 7, failed: 2, queued: 1 }, by_reason: {} },
      auto_applied: 5,
      undone: 0,
      ai_calls_today: 3,
      backlog: [2, 4],
    };
    expect(statusFacts(status)).toEqual({ mails: 10, added: 5, waiting: 6, failed: 2 });
  });

  it('FE-ADMIN-MAILINGEST-006: every transport and problem has its words, {token} kept literal', () => {
    expect(TRANSPORTS.map((x) => transportLabel(x, t))).toEqual([
      'mailAdmin.transport.off',
      'mailAdmin.transport.imap',
      'mailAdmin.transport.webhook',
    ]);
    expect(problemText('templateToken', t)).toContain('"token":"{token}"');
    expect(problemText('secretShort', t)).toBe('mailAdmin.problem.secretShort');
  });
});
