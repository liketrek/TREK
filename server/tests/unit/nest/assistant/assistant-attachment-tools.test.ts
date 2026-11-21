/**
 * read_attached_file as the turn offers it: only where the thread holds a file
 * with text, held as the consent card until the user let the model read that
 * file, then a read; any id the conversation does not hold answered the same.
 */
import type { AssistantAttachmentSummary } from '../../../../src/db/repositories/AssistantAttachments.repository';
import type { AgentToolPort } from '../../../../src/nest/assistant/assistant-agent';
import {
  attachedPort,
  NO_SUCH_ATTACHMENT,
  KEEP_ATTACHED_FILE_SPEC,
  NO_TEXT,
  READ_ATTACHED_FILE_SPEC,
} from '../../../../src/nest/assistant/assistant-attachment-tools';
import { systemPrompt } from '../../../../src/nest/assistant/assistant.prompt';

import { describe, expect, it, vi } from 'vitest';

const OWN = '0b7c2f0e-6f6d-4a8e-9b1a-3d2c1e0f9a87';
const SHARED = '1c8d3f1f-7a7e-4b9f-8c2b-4e3d2f1a0b98';
const SCAN = '2d9e4a2a-8b8f-4cab-9d3c-5f4e3a2b1c09';
const ELSEWHERE = '3eaf5b3b-9c9a-4dbc-8e4d-6a5f4b3c2d10';

function row(id: string, extra: Partial<AssistantAttachmentSummary> = {}): AssistantAttachmentSummary {
  return {
    id,
    thread_id: 4,
    user_id: 7,
    trip_id: 9,
    name: `${id.slice(0, 4)}.pdf`,
    mime: 'application/pdf',
    size: 10,
    sha256: 'x',
    storage_key: `assistant/${id}.pdf`,
    text_status: 'ok',
    shared_at: null,
    file_id: null,
    created_at: '2026-10-24 08:00:00',
    ...extra,
  };
}

function base(): AgentToolPort {
  return {
    specs: () => [{ name: 'get_trip_summary', description: '', parameters: {} }],
    kindOf: vi.fn(() => 'read' as const),
    pinArgs: vi.fn((_name: string, args: Record<string, unknown>) => ({ args })),
    call: vi.fn(async () => ({ ok: true, value: 'trip' })),
  };
}

const ATTACHED = [row(OWN), row(SHARED, { shared_at: '2026-10-24 08:01:00' }), row(SCAN, { text_status: 'scanned' })];

describe('attachedPort', () => {
  it('ASTATL-001: offers keep_attached_file where the thread holds a file, read_attached_file where one has text', () => {
    const port = base();
    expect(attachedPort(port, null)).toBe(port);
    expect(attachedPort(port, { attached: [], sentTo: 'm', keeps: true, read: vi.fn() })).toBe(port);
    const scanOnly = attachedPort(port, {
      attached: [row(SCAN, { text_status: 'scanned' })],
      sentTo: 'm',
      keeps: true,
      read: vi.fn(),
    });
    expect(scanOnly.specs().map((spec) => spec.name)).toEqual(['get_trip_summary', KEEP_ATTACHED_FILE_SPEC.name]);
    expect(scanOnly.pinArgs('read_attached_file', { attachmentId: SCAN })).toEqual({
      args: { attachmentId: SCAN },
    });
    const offered = attachedPort(port, { attached: ATTACHED, sentTo: 'm', keeps: true, read: vi.fn() });
    expect(offered.specs().map((spec) => spec.name)).toEqual([
      'get_trip_summary',
      READ_ATTACHED_FILE_SPEC.name,
      KEEP_ATTACHED_FILE_SPEC.name,
    ]);
  });

  it('ASTATL-002: the first read of a file is held for the user, a shared one runs at once', () => {
    const port = attachedPort(base(), { attached: ATTACHED, sentTo: 'm', keeps: true, read: vi.fn() });
    expect(port.kindOf('read_attached_file', { attachmentId: OWN })).toBe('write');
    expect(port.kindOf('read_attached_file', { attachmentId: SHARED })).toBe('read');
    expect(port.kindOf('read_attached_file', { attachmentId: ELSEWHERE })).toBe('write');
    expect(port.kindOf('get_trip_summary', {})).toBe('read');
  });

  it('ASTATL-003: the held call names the file and where its text goes, never more; anything else is refused alike', () => {
    const port = attachedPort(base(), {
      attached: ATTACHED,
      sentTo: 'gpt-5 (api.openai.com)',
      keeps: true,
      read: vi.fn(),
    });
    expect(port.pinArgs('read_attached_file', { attachmentId: OWN, sentTo: 'nowhere' })).toEqual({
      args: { attachmentId: OWN, name: '0b7c.pdf', sentTo: 'gpt-5 (api.openai.com)' },
    });
    // Another thread's file, another user's, a made-up id and no id at all read the same.
    for (const args of [{ attachmentId: ELSEWHERE }, { attachmentId: 'f00' }, {}]) {
      expect(port.pinArgs('read_attached_file', args)).toEqual({ error: NO_SUCH_ATTACHMENT });
    }
    expect(port.pinArgs('read_attached_file', { attachmentId: SCAN })).toEqual({ error: NO_TEXT });
  });

  it('ASTATL-004: a read runs through the turn, and only for a file of the thread', async () => {
    const read = vi.fn(async () => ({ ok: true, value: { name: 'x', read: true }, modelText: 'text' }));
    const inner = base();
    const port = attachedPort(inner, { attached: ATTACHED, sentTo: 'm', keeps: true, read });
    expect(await port.call('read_attached_file', { attachmentId: SHARED })).toMatchObject({ modelText: 'text' });
    expect(read).toHaveBeenCalledWith(SHARED);
    expect(await port.call('read_attached_file', { attachmentId: ELSEWHERE })).toEqual({
      ok: false,
      value: NO_SUCH_ATTACHMENT,
    });
    await port.call('get_trip_summary', {});
    expect(inner.call).toHaveBeenCalledWith('get_trip_summary', {});
  });

  it('ASTATL-005: the standing instructions say how an attached file is read and booked', () => {
    const prompt = systemPrompt('English');
    expect(prompt).toContain('read it with read_attached_file');
    expect(prompt).toContain('proposed with create_reservation');
  });

  it('ASTATL-006: a keep is always held, checked, and names the file; an attachment of no one here is refused alike', () => {
    const port = attachedPort(base(), { attached: ATTACHED, sentTo: 'm', keeps: true, read: vi.fn() });
    expect(port.kindOf('keep_attached_file', { attachmentId: SCAN })).toBe('write');
    expect(port.pinArgs('keep_attached_file', { attachmentId: SCAN, reservation_id: 5, name: 'forged.exe' })).toEqual({
      args: { attachmentId: SCAN, reservation_id: 5, name: '2d9e.pdf' },
    });
    expect(port.pinArgs('keep_attached_file', { attachmentId: ELSEWHERE })).toEqual({ error: NO_SUCH_ATTACHMENT });
    expect(port.pinArgs('keep_attached_file', {})).toEqual({ error: NO_SUCH_ATTACHMENT });
    const bad = port.pinArgs('keep_attached_file', { attachmentId: OWN, budget_item_id: 'seven' });
    expect(bad).toEqual({ error: expect.stringContaining('Invalid arguments') });
  });

  it('ASTATL-007: no keep is offered or held while the trip has Documents off; the call goes to the port', () => {
    const inner = base();
    const port = attachedPort(inner, { attached: ATTACHED, sentTo: 'm', keeps: false, read: vi.fn() });
    expect(port.specs().map((spec) => spec.name)).toEqual(['get_trip_summary', READ_ATTACHED_FILE_SPEC.name]);
    expect(port.kindOf('keep_attached_file', { attachmentId: SCAN })).toBe('read');
    expect(inner.kindOf).toHaveBeenCalledWith('keep_attached_file', { attachmentId: SCAN });
    port.pinArgs('keep_attached_file', { attachmentId: SCAN });
    expect(inner.pinArgs).toHaveBeenCalledWith('keep_attached_file', { attachmentId: SCAN });
  });
});
