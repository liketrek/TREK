// FE-COLLAB-CHATDATA-001 to FE-COLLAB-CHATDATA-016: the trip chat logic behind the desktop
// Collab panel (quiet older-page errors, scroll on remote delete, upload progress) and the
// phone's chat tab (toasted older-page errors, sending gated on the edit permission).
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { collabApi } from '../../api/client';
import { addListener, removeListener } from '../../api/websocket';
import type { ChatMessage } from './collabModel';
import { useCollabChatData, type CollabChatDataOptions } from './useCollabChatData';

const t = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

function msg(id: number, over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    trip_id: 1,
    user_id: 2,
    text: `Message ${id}`,
    reply_to: null,
    username: 'Alice',
    avatar: null,
    avatar_url: null,
    created_at: '2026-05-01T10:00:00Z',
    reactions: [],
    ...over,
  };
}

function setup(over: Partial<CollabChatDataOptions> = {}) {
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  const hook = renderHook(() => useCollabChatData({ tripId: 1, t, toast, ...over }));
  return { ...hook, toast };
}

async function loaded(over: Partial<CollabChatDataOptions> = {}) {
  const view = setup(over);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

function wsHandler(): (event: Record<string, unknown>) => void {
  const calls = vi.mocked(addListener).mock.calls;
  return calls[calls.length - 1][0] as (event: Record<string, unknown>) => void;
}

function typeText(result: { current: ReturnType<typeof useCollabChatData> }, value: string) {
  act(() => {
    result.current.handleTextChange({ target: { value } } as ChangeEvent<HTMLTextAreaElement>);
  });
}

beforeEach(() => {
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
  vi.spyOn(collabApi, 'getMessages').mockResolvedValue({ messages: [msg(1), msg(2, { deleted: 1 })] });
  vi.spyOn(collabApi, 'sendMessage').mockResolvedValue({ message: msg(10, { text: 'hi' }) });
  vi.spyOn(collabApi, 'deleteMessage').mockResolvedValue({});
  vi.spyOn(collabApi, 'reactMessage').mockResolvedValue({ reactions: [{ emoji: '👍', count: 1, users: [] }] });
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCollabChatData', () => {
  it('FE-COLLAB-CHATDATA-001: loads the newest page and marks deleted messages', async () => {
    const { result } = setup();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(collabApi.getMessages).toHaveBeenCalledWith(1);
    expect(result.current.messages.map((m) => [m.id, !!m._deleted])).toEqual([
      [1, false],
      [2, true],
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it('FE-COLLAB-CHATDATA-002: a full page offers older messages, a bare array is read too', async () => {
    const page = Array.from({ length: 100 }, (_, i) => msg(i + 1));
    vi.mocked(collabApi.getMessages).mockResolvedValue(page);
    const { result } = await loaded();
    expect(result.current.messages).toHaveLength(100);
    expect(result.current.hasMore).toBe(true);
  });

  it('FE-COLLAB-CHATDATA-003: a failed first load just stops loading', async () => {
    vi.mocked(collabApi.getMessages).mockRejectedValue(new Error('offline'));
    const { result } = await loaded();
    expect(result.current.messages).toEqual([]);
  });

  it('FE-COLLAB-CHATDATA-004: loading older messages asks before the oldest and prepends them', async () => {
    const { result } = await loaded();
    vi.mocked(collabApi.getMessages).mockResolvedValue({ messages: [msg(-1)] });
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(collabApi.getMessages).toHaveBeenLastCalledWith(1, '1');
    expect(result.current.messages.map((m) => m.id)).toEqual([-1, 1, 2]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loadingMore).toBe(false);
  });

  it('FE-COLLAB-CHATDATA-005: an empty older page ends paging; nothing loads before the first message', async () => {
    vi.mocked(collabApi.getMessages).mockResolvedValue({ messages: [] });
    const { result } = await loaded();
    await act(async () => {
      await result.current.handleLoadMore();
    });
    expect(collabApi.getMessages).toHaveBeenCalledTimes(1);
  });

  it('FE-COLLAB-CHATDATA-006: a failed older page is quiet on desktop and toasted on the phone', async () => {
    const desktop = await loaded();
    vi.mocked(collabApi.getMessages).mockRejectedValue(new Error('boom'));
    await act(async () => {
      await desktop.result.current.handleLoadMore();
    });
    expect(desktop.toast.error).not.toHaveBeenCalled();
    expect(desktop.result.current.loadingMore).toBe(false);

    vi.mocked(collabApi.getMessages).mockResolvedValue({ messages: [msg(1)] });
    const phone = await loaded({ toastLoadMoreErrors: true });
    vi.mocked(collabApi.getMessages).mockRejectedValue(new Error('boom'));
    await act(async () => {
      await phone.result.current.handleLoadMore();
    });
    expect(phone.toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-COLLAB-CHATDATA-007: live events add, delete and react, and only for this trip', async () => {
    const { result } = await loaded();
    const handler = wsHandler();
    act(() => {
      handler({ type: 'collab:message:created', tripId: 2, message: msg(50) });
      handler({ type: 'collab:message:created', tripId: 1, message: msg(51) });
      handler({ type: 'collab:message:created', tripId: '1', message: msg(51) });
      handler({ type: 'collab:message:deleted', tripId: 1, messageId: 1 });
      handler({ type: 'collab:message:reacted', tripId: 1, messageId: 51, reactions: [{ emoji: '🔥' }] });
    });
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 51]);
    expect(result.current.messages[0]._deleted).toBe(true);
    expect(result.current.messages[2].reactions).toEqual([{ emoji: '🔥' }]);
  });

  it('FE-COLLAB-CHATDATA-008: a remote delete scrolls down only where asked', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const smooth = expect.objectContaining({ behavior: 'smooth' });

    const phone = await loaded();
    const phoneList = document.createElement('div');
    phoneList.scrollTo = vi.fn();
    phone.result.current.scrollRef.current = phoneList;
    act(() => wsHandler()({ type: 'collab:message:deleted', tripId: 1, messageId: 1 }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(phoneList.scrollTo).not.toHaveBeenCalledWith(smooth);

    const desktop = await loaded({ scrollOnRemoteDelete: true });
    const desktopList = document.createElement('div');
    desktopList.scrollTo = vi.fn();
    desktop.result.current.scrollRef.current = desktopList;
    act(() => wsHandler()({ type: 'collab:message:deleted', tripId: 1, messageId: 1 }));
    await waitFor(() => expect(desktopList.scrollTo).toHaveBeenCalledWith(smooth));
  });

  it('FE-COLLAB-CHATDATA-009: unmounting removes the live listener', async () => {
    const { unmount } = await loaded();
    const handler = wsHandler();
    unmount();
    expect(removeListener).toHaveBeenCalledWith(handler);
  });

  it('FE-COLLAB-CHATDATA-010: sending a text with a reply posts JSON, appends and clears the draft', async () => {
    const onSent = vi.fn();
    const { result } = await loaded({ onSent });
    typeText(result, '  hi  ');
    act(() => result.current.setReplyTo(msg(1)));
    await act(async () => {
      await result.current.handleSend();
    });
    expect(collabApi.sendMessage).toHaveBeenCalledWith(1, { text: 'hi', reply_to: 1 });
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 10]);
    expect(result.current.text).toBe('');
    expect(result.current.replyTo).toBeNull();
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(result.current.sending).toBe(false);
  });

  it('FE-COLLAB-CHATDATA-011: nothing is sent for a blank draft or without the permission', async () => {
    const { result } = await loaded();
    typeText(result, '   ');
    await act(async () => {
      await result.current.handleSend();
    });
    const phone = await loaded({ canSend: false });
    typeText(phone.result, 'hi');
    await act(async () => {
      await phone.result.current.handleSend();
    });
    expect(collabApi.sendMessage).not.toHaveBeenCalled();
  });

  it('FE-COLLAB-CHATDATA-012: images go as a form, with upload progress only where asked', async () => {
    const image = new File([new Uint8Array(10)], 'a.png', { type: 'image/png' });
    const phone = await loaded();
    act(() => phone.result.current.addImageFiles([image]));
    await act(async () => {
      await phone.result.current.handleSend();
    });
    expect(vi.mocked(collabApi.sendMessage).mock.calls[0]).toHaveLength(2);
    expect(vi.mocked(collabApi.sendMessage).mock.calls[0][1]).toBeInstanceOf(FormData);
    expect(phone.result.current.images.files).toEqual([]);

    const desktop = await loaded({ trackUploadProgress: true });
    act(() => desktop.result.current.addImageFiles([image]));
    typeText(desktop.result, 'look');
    await act(async () => {
      await desktop.result.current.handleSend();
    });
    const [, form, opts] = vi.mocked(collabApi.sendMessage).mock.calls[1];
    expect((form as FormData).get('text')).toBe('look');
    expect((form as FormData).getAll('images')).toHaveLength(1);
    expect(opts).toEqual({ onUploadProgress: expect.any(Function) });
    expect(desktop.result.current.uploadProgress).toBe(0);
  });

  it('FE-COLLAB-CHATDATA-013: a rejected or surplus image is toasted', async () => {
    const { result, toast } = await loaded();
    act(() => result.current.addImageFiles([new File(['x'], 'a.txt', { type: 'text/plain' })]));
    expect(toast.error).toHaveBeenCalledWith('collab.chat.imageRejected');
    const png = () => new File([new Uint8Array(1)], 'a.png', { type: 'image/png' });
    act(() => result.current.addImageFiles([png(), png(), png(), png(), png()]));
    expect(toast.error).toHaveBeenCalledWith('collab.chat.imageLimit:4');
  });

  it('FE-COLLAB-CHATDATA-014: a failed send keeps the draft and toasts', async () => {
    vi.mocked(collabApi.sendMessage).mockRejectedValue(new Error('boom'));
    const onSent = vi.fn();
    const { result, toast } = await loaded({ onSent });
    typeText(result, 'hi');
    await act(async () => {
      await result.current.handleSend();
    });
    expect(result.current.text).toBe('hi');
    expect(onSent).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.sending).toBe(false);
  });

  it('FE-COLLAB-CHATDATA-015: deleting marks the message, a failure toasts', async () => {
    const { result, toast } = await loaded();
    await act(async () => {
      await result.current.deleteMessage(1);
    });
    expect(collabApi.deleteMessage).toHaveBeenCalledWith(1, 1);
    expect(result.current.messages[0]._deleted).toBe(true);

    vi.mocked(collabApi.deleteMessage).mockRejectedValue(new Error('boom'));
    await act(async () => {
      await result.current.deleteMessage(2);
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-COLLAB-CHATDATA-016: reacting stores the server reactions, a failure toasts', async () => {
    const { result, toast } = await loaded();
    await act(async () => {
      await result.current.reactToMessage(1, '👍');
    });
    expect(collabApi.reactMessage).toHaveBeenCalledWith(1, 1, '👍');
    expect(result.current.messages[0].reactions).toEqual([{ emoji: '👍', count: 1, users: [] }]);

    vi.mocked(collabApi.reactMessage).mockRejectedValue(new Error('boom'));
    await act(async () => {
      await result.current.reactToMessage(1, '🔥');
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });
});
