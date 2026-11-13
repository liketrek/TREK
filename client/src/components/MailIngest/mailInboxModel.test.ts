// FE-MAILINBOX-MODEL-001 to FE-MAILINBOX-MODEL-006
import type { MailIngestInboxEntry } from '@trek/shared';
import { MAIL_INGEST_REASONS } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { actionsOf, canUndo, entryDates, entryTitle, reasonText } from './mailInboxModel';

function entry(
  over: Partial<MailIngestInboxEntry> = {},
  message: Partial<MailIngestInboxEntry['message']> = {}
): MailIngestInboxEntry {
  return {
    id: 1,
    message_id: 10,
    item: {
      type: 'hotel',
      title: 'Hotel Kanra Kyoto',
      reservation_time: '2026-06-11T15:00',
      reservation_end_time: '2026-06-14T10:00',
      source: { fileName: 'mail.eml', index: 0 },
    },
    source: 'ai',
    uncertain_fields: [],
    checks: {},
    suggested_trip: { id: 5, title: 'Japan', start_date: '2026-06-10', end_date: '2026-06-20' },
    suggested_new_trip: null,
    resolution: 'pending',
    reason: 'ask_first',
    resolved_trip_id: null,
    reservation_ids: [],
    file_ids: [],
    created_at: '2026-06-01T10:00:00.000Z',
    resolved_at: null,
    undo_until: null,
    message: {
      id: 10,
      transport: 'imap',
      subject: 'Your booking at Hotel Kanra',
      received_at: '2026-06-01T09:59:00.000Z',
      status: 'processed',
      reason: null,
      hints: [],
      ai_used: true,
      trip_id: null,
      attachments: [],
      forwarding_code: null,
      ...message,
    },
    ...over,
  };
}

describe('mailInboxModel', () => {
  it('FE-MAILINBOX-MODEL-001: a read booking with a suggested trip is added in one tap, with every way out after it', () => {
    expect(actionsOf(entry(), false)).toEqual(['add', 'file', 'manual', 'discard']);
  });

  it('FE-MAILINBOX-MODEL-002: without a suggestion the person chooses the trip', () => {
    expect(actionsOf(entry({ suggested_trip: null }), false)[0]).toBe('choose');
  });

  it('FE-MAILINBOX-MODEL-003: a mail without a booking offers the document, the form, and AI only where it can help', () => {
    const none = entry(
      { item: null, reason: 'not_a_booking' },
      { attachments: [{ file_name: 'invoice.pdf', kind: 'pdf', size: 1 }] }
    );
    expect(actionsOf(none, false)).toEqual(['file', 'manual', 'discard']);
    expect(actionsOf(none, true)).toEqual(['file', 'manual', 'readAi', 'discard']);
  });

  it('FE-MAILINBOX-MODEL-004: a forwarding confirmation or a newsletter only informs', () => {
    expect(
      actionsOf(
        entry({ item: null, reason: null }, { reason: 'forwarding_confirmation', forwarding_code: '123456' }),
        true
      )
    ).toEqual(['discard']);
  });

  it('FE-MAILINBOX-MODEL-005: every reason has its words, and title and dates come from the booking', () => {
    const t = (key: string) => key;
    for (const reason of MAIL_INGEST_REASONS) expect(reasonText(reason, t)).toMatch(/^mailInbox\.reason\./);
    expect(entryTitle(entry())).toBe('Hotel Kanra Kyoto');
    expect(entryTitle(entry({ item: null }))).toBe('Your booking at Hotel Kanra');
    expect(entryDates(entry())).toEqual({ start: '2026-06-11', end: '2026-06-14' });
    expect(entryDates(entry({ item: null }))).toBeNull();
  });

  it('FE-MAILINBOX-MODEL-006: an added booking can be undone until its deadline', () => {
    const now = Date.parse('2026-06-05T00:00:00Z');
    expect(canUndo({ resolution: 'auto_applied', undo_until: '2026-06-08T00:00:00Z' }, now)).toBe(true);
    expect(canUndo({ resolution: 'auto_applied', undo_until: '2026-06-01T00:00:00Z' }, now)).toBe(false);
    expect(canUndo({ resolution: 'pending', undo_until: '2026-06-08T00:00:00Z' }, now)).toBe(false);
  });
});
