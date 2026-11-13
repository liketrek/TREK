import { llmParseOutcomeSchema } from '../reservation/reservation.schema';
import {
  MAIL_INGEST_REASON_BY_LLM_OUTCOME,
  mailIngestFieldSchema,
  mailIngestHintSchema,
  mailIngestReasonSchema,
} from './mail-ingest-reason.schema';
import {
  mailIngestAddressSchema,
  mailIngestAdminStatusResponseSchema,
  mailIngestApplyRequestSchema,
  mailIngestCandidateSchema,
  mailIngestFileRequestSchema,
  mailIngestInboxEntrySchema,
  mailIngestInboxQuerySchema,
  mailIngestInboundResponseSchema,
  mailIngestMessageSchema,
  mailIngestMoveRequestSchema,
  mailIngestPrefsUpdateRequestSchema,
  mailIngestReviewRequestSchema,
  mailIngestSettingsResponseSchema,
  mailIngestUndoConflictSchema,
  mailIngestUndoRequestSchema,
} from './mail-ingest.schema';

import { describe, expect, it } from 'vitest';

const NOW = '2026-11-13T09:00:00.000Z';

const message = {
  id: 4,
  transport: 'cloud',
  subject: 'Your booking LH 716',
  received_at: NOW,
  status: 'processed',
  reason: null,
  hints: ['sender_unverified'],
  ai_used: true,
  trip_id: null,
  attachments: [{ file_name: 'ticket.pdf', kind: 'pdf', size: 48_213 }],
  forwarding_code: null,
};

const candidate = {
  id: 9,
  message_id: 4,
  item: {
    type: 'flight',
    title: 'LH 716',
    confirmation_number: 'ABC123',
    reservation_time: '2027-04-02T13:25',
    source: { fileName: 'mail', index: 0 },
  },
  source: 'ai',
  uncertain_fields: ['seat'],
  checks: { schema: 'pass', dates: 'pass', in_text: 'fail' },
  suggested_trip: { id: 3, title: 'Japan 2027', start_date: '2027-04-02', end_date: '2027-04-20' },
  suggested_new_trip: null,
  resolution: 'pending',
  reason: 'not_in_text',
  resolved_trip_id: null,
  reservation_ids: [],
  file_ids: [],
  created_at: NOW,
  resolved_at: null,
  undo_until: null,
};

describe('mail-ingest reasons', () => {
  it('MAILC-001: every AI outcome stands for one reason, and only a reading with bookings for none', () => {
    for (const outcome of llmParseOutcomeSchema.options) {
      const reason = MAIL_INGEST_REASON_BY_LLM_OUTCOME[outcome];
      if (outcome === 'ok') expect(reason).toBeNull();
      else expect(mailIngestReasonSchema.safeParse(reason).success, outcome).toBe(true);
    }
    expect(MAIL_INGEST_REASON_BY_LLM_OUTCOME.quota_exhausted).toBe('ai_quota_exhausted');
  });

  it('MAILC-002: an unverified sender is a hint, never a reason to hold a mail back', () => {
    expect(mailIngestHintSchema.safeParse('sender_unverified').success).toBe(true);
    expect(mailIngestReasonSchema.safeParse('sender_unverified').success).toBe(false);
  });

  it('MAILC-003: an uncertain field is one of the known names, never free text', () => {
    expect(mailIngestFieldSchema.safeParse('reservation_time').success).toBe(true);
    expect(mailIngestFieldSchema.safeParse('ignore previous instructions').success).toBe(false);
  });
});

describe('mail-ingest rows', () => {
  it('MAILC-010: a message and an inbox entry parse as the server sends them', () => {
    expect(mailIngestMessageSchema.safeParse(message).success).toBe(true);
    expect(mailIngestCandidateSchema.safeParse(candidate).success).toBe(true);
    expect(mailIngestInboxEntrySchema.safeParse({ ...candidate, message }).success).toBe(true);
  });

  it('MAILC-011: the entry for a mail that yielded no booking has no item and still a reason', () => {
    const unread = { ...candidate, item: null, source: null, checks: {}, reason: 'mail_unreadable' };
    expect(mailIngestCandidateSchema.safeParse(unread).success).toBe(true);
  });

  it('MAILC-012: refuses an unknown reason, check result or resolution', () => {
    expect(mailIngestCandidateSchema.safeParse({ ...candidate, reason: 'because' }).success).toBe(false);
    expect(mailIngestCandidateSchema.safeParse({ ...candidate, checks: { dates: 'maybe' } }).success).toBe(false);
    expect(mailIngestCandidateSchema.safeParse({ ...candidate, resolution: 'done' }).success).toBe(false);
  });

  it('MAILC-013: timestamps carry an offset', () => {
    expect(mailIngestMessageSchema.safeParse({ ...message, received_at: '2026-11-13 09:00:00' }).success).toBe(false);
    const address = { id: 1, address: 'box+abcdefghijklmnopqrst@trek.example', trip_id: null, created_at: NOW };
    expect(mailIngestAddressSchema.safeParse({ ...address, last_used_at: null }).success).toBe(true);
  });

  it('MAILC-014: the settings card answer', () => {
    const settings = {
      available: true,
      address: null,
      prefs: { enabled: true, ai_enabled: true, auto_add: false },
      ai_available: false,
      pending: 2,
    };
    expect(mailIngestSettingsResponseSchema.safeParse(settings).success).toBe(true);
  });

  it('MAILC-015: the admin status card holds counts, not mails', () => {
    const status = {
      transport: 'imap',
      last_ok_at: NOW,
      last_error: null,
      lease_until: null,
      last_day: { by_status: { processed: 12, discarded: 3 }, by_reason: { newsletter: 3 } },
      auto_applied: 9,
      undone: 1,
      ai_calls_today: 4,
      backlog: [2, 1],
    };
    expect(mailIngestAdminStatusResponseSchema.safeParse(status).success).toBe(true);
    expect(mailIngestInboundResponseSchema.safeParse({ accepted: true, duplicate: false }).success).toBe(true);
  });
});

describe('mail-ingest requests', () => {
  it('MAILC-020: the switches take at least one known setting and nothing else', () => {
    expect(mailIngestPrefsUpdateRequestSchema.safeParse({ auto_add: false }).success).toBe(true);
    expect(mailIngestPrefsUpdateRequestSchema.safeParse({}).success).toBe(false);
    expect(mailIngestPrefsUpdateRequestSchema.safeParse({ auto_add: 'yes' }).success).toBe(false);
    expect(mailIngestPrefsUpdateRequestSchema.safeParse({ auto_add: true, address: 'x' }).success).toBe(false);
  });

  it('MAILC-021: apply takes an optional trip, move and file a required one, all closed', () => {
    expect(mailIngestApplyRequestSchema.safeParse({}).success).toBe(true);
    expect(mailIngestApplyRequestSchema.safeParse({ trip_id: 3 }).success).toBe(true);
    expect(mailIngestApplyRequestSchema.safeParse({ trip_id: 0 }).success).toBe(false);
    expect(mailIngestMoveRequestSchema.safeParse({}).success).toBe(false);
    expect(mailIngestFileRequestSchema.safeParse({ trip_id: 3, reservation_id: 4 }).success).toBe(false);
  });

  it('MAILC-022: undo asks for confirmation through its own 409', () => {
    expect(mailIngestUndoRequestSchema.safeParse({}).success).toBe(true);
    expect(mailIngestUndoRequestSchema.safeParse({ confirm: true }).success).toBe(true);
    const conflict = { error: 'This cost moved balances', code: 'needs_confirmation', affects: ['balances'] };
    expect(mailIngestUndoConflictSchema.safeParse(conflict).success).toBe(true);
    expect(mailIngestUndoConflictSchema.safeParse({ ...conflict, affects: [] }).success).toBe(false);
  });

  it('MAILC-023: "Looks right" names known fields or none', () => {
    expect(mailIngestReviewRequestSchema.safeParse({}).success).toBe(true);
    expect(mailIngestReviewRequestSchema.safeParse({ fields: ['seat', 'gate'] }).success).toBe(true);
    expect(mailIngestReviewRequestSchema.safeParse({ fields: [] }).success).toBe(false);
    expect(mailIngestReviewRequestSchema.safeParse({ fields: ['notes'] }).success).toBe(false);
  });

  it('MAILC-024: the inbox query defaults to the open entries, a page of 50, and coerces the cursor', () => {
    expect(mailIngestInboxQuerySchema.parse({})).toEqual({ status: 'open', limit: 50 });
    expect(mailIngestInboxQuerySchema.parse({ status: 'resolved', before: '40', limit: '10' })).toEqual({
      status: 'resolved',
      before: 40,
      limit: 10,
    });
    expect(mailIngestInboxQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
    expect(mailIngestInboxQuerySchema.safeParse({ status: 'all' }).success).toBe(false);
  });
});
