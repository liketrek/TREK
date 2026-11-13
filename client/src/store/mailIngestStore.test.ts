// FE-STORE-MAILINGEST-001 to FE-STORE-MAILINGEST-004
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/mailIngest', () => ({
  mailIngestApi: { settings: vi.fn(), inbox: vi.fn(), inboxCount: vi.fn(), act: vi.fn() },
}));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));

import { mailIngestApi } from '../api/mailIngest';
import { useMailIngestStore } from './mailIngestStore';

const candidate = (id: number, resolution = 'pending') => ({
  id,
  message_id: 10 + id,
  item: null,
  source: null,
  uncertain_fields: [],
  checks: {},
  suggested_trip: null,
  suggested_new_trip: null,
  resolution,
  reason: 'not_a_booking',
  resolved_trip_id: null,
  reservation_ids: [],
  file_ids: [],
  created_at: '2026-06-01T10:00:00.000Z',
  resolved_at: null,
  undo_until: null,
});
const entry = (id: number) => ({
  ...candidate(id),
  message: {
    id: 10 + id,
    transport: 'upload',
    subject: null,
    received_at: '2026-06-01T09:59:00.000Z',
    status: 'processed',
    reason: null,
    hints: [],
    ai_used: false,
    trip_id: null,
    attachments: [],
    forwarding_code: null,
  },
});

beforeEach(() => {
  useMailIngestStore.setState({ settings: null, entries: [], nextBefore: null, pending: 0, loadingInbox: false });
  vi.mocked(mailIngestApi.inbox).mockReset();
  vi.mocked(mailIngestApi.act).mockReset();
});

describe('mailIngestStore', () => {
  it('FE-STORE-MAILINGEST-001: reads the open entries and the count', async () => {
    vi.mocked(mailIngestApi.inbox).mockResolvedValue({ entries: [entry(1), entry(2)], pending: 2, next_before: null });
    await useMailIngestStore.getState().loadInbox();
    expect(useMailIngestStore.getState().entries.map((e) => e.id)).toEqual([1, 2]);
    expect(useMailIngestStore.getState().pending).toBe(2);
  });

  it('FE-STORE-MAILINGEST-002: a further page is appended, a malformed answer is ignored', async () => {
    vi.mocked(mailIngestApi.inbox).mockResolvedValueOnce({ entries: [entry(1)], pending: 2, next_before: 1 });
    await useMailIngestStore.getState().loadInbox();
    vi.mocked(mailIngestApi.inbox).mockResolvedValueOnce({ entries: [entry(2)], pending: 2, next_before: null });
    await useMailIngestStore.getState().loadInbox(true);
    vi.mocked(mailIngestApi.inbox).mockResolvedValueOnce({ nope: true });
    await useMailIngestStore.getState().loadInbox(true);
    expect(useMailIngestStore.getState().entries.map((e) => e.id)).toEqual([1, 2]);
  });

  it('FE-STORE-MAILINGEST-003: a decided entry leaves the list and the count', async () => {
    useMailIngestStore.setState({ entries: [entry(1), entry(2)] as never, pending: 2 });
    vi.mocked(mailIngestApi.act).mockResolvedValue({ candidate: candidate(1, 'discarded') });
    await useMailIngestStore.getState().act(1, 'discard');
    expect(useMailIngestStore.getState().entries.map((e) => e.id)).toEqual([2]);
    expect(useMailIngestStore.getState().pending).toBe(1);
  });

  it('FE-STORE-MAILINGEST-004: an entry still open after an action stays, updated', async () => {
    useMailIngestStore.setState({ entries: [entry(1)] as never, pending: 1 });
    vi.mocked(mailIngestApi.act).mockResolvedValue({ candidate: { ...candidate(1), reason: 'ai_provider_error' } });
    await useMailIngestStore.getState().act(1, 'read-ai');
    expect(useMailIngestStore.getState().entries[0].reason).toBe('ai_provider_error');
    expect(useMailIngestStore.getState().pending).toBe(1);
  });
});
