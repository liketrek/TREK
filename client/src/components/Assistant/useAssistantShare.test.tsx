/**
 * FE-AI-SHARE-HOOK-001 to FE-AI-SHARE-HOOK-006
 *
 * Sharing an answer in the trip chat: who may, which answers can go, the
 * preview and its switch, and what the user hears after the post or when it
 * fails.
 */
import type { AssistantMessage } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTrip, buildUser } from '../../../tests/helpers/factories';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { assistantRepo } from '../../repo/assistantRepo';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import { useAddonStore } from '../../store/addonStore';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { useTripStore } from '../../store/tripStore';
import AssistantShareDialog from './AssistantShareDialog';
import { useAssistantShare } from './useAssistantShare';

const { addToast } = vi.hoisted(() => ({ addToast: vi.fn() }));
// The toasts a component raises, read as (message, type) the way the toast host takes them.
vi.mock('../shared/Toast', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../shared/Toast')>()),
  useToast: () => ({
    success: (message: string) => addToast(message, 'success', undefined),
    error: (message: string) => addToast(message, 'error', undefined),
    warning: (message: string) => addToast(message, 'warning', undefined),
    info: (message: string) => addToast(message, 'info', undefined),
  }),
}));

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const AUTH = useAuthStore.getState();
const ADDONS = useAddonStore.getState();
const PERMISSIONS = usePermissionsStore.getState();

function answer(extra: Partial<AssistantMessage> = {}): AssistantMessage {
  return {
    id: 'msg-12',
    role: 'assistant',
    status: 'complete',
    createdAt: '2026-10-21T08:00:00.000Z',
    parts: [
      { type: 'text', text: 'Take the **early** train.' },
      {
        type: 'tool-call',
        toolCallId: 'c1',
        toolName: 'create_place',
        args: {},
        approval: { id: 'c1', approved: true },
      },
      {
        type: 'data-trek-change',
        data: {
          toolCallId: 'c1',
          verbKey: 'addPlace',
          subject: 'Nara Park',
          rows: [],
          dayId: 3,
          placeIds: [],
          undoable: true,
        },
      },
      { type: 'data-trek-applied', data: { toolCallId: 'c1', entity: 'place', ids: [9], dayId: 3, undoUntil: null } },
    ],
    ...extra,
  };
}

function Harness({ message, writing = false }: { message: AssistantMessage; writing?: boolean }) {
  const share = useAssistantShare(TRIP, message, writing);
  if (!share.canShare) return <p>cannot share</p>;
  return (
    <>
      <button type="button" onClick={share.open} disabled={share.offline}>
        {share.shared ? 'shared' : 'share'}
      </button>
      <AssistantShareDialog share={share} />
    </>
  );
}

function seed({ chat = true, threadId = 7 as number | null } = {}) {
  useAuthStore.setState({ user: buildUser({ id: 1 }) });
  useTripStore.setState({ trip: buildTrip({ id: TRIP, user_id: 1 }) });
  const collab = { id: 'collab', name: 'Collab', type: 'trip', icon: '', enabled: true };
  useAddonStore.setState({ addons: chat ? [collab] : [] });
  useAssistantStore.setState({
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId } },
  });
}

beforeEach(() => {});

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
  useAuthStore.setState(AUTH, true);
  useAddonStore.setState(ADDONS, true);
  usePermissionsStore.setState(PERMISSIONS, true);
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('useAssistantShare', () => {
  it('FE-AI-SHARE-HOOK-001: offers sharing only for a finished, stored answer with text', () => {
    seed();
    const { unmount } = render(<Harness message={answer()} />);
    expect(screen.getByRole('button', { name: 'share' })).toBeInTheDocument();
    unmount();

    for (const message of [
      answer({ id: 'local-1' }),
      answer({ status: 'aborted' }),
      answer({ parts: [{ type: 'text', text: '  ' }] }),
    ]) {
      const view = render(<Harness message={message} />);
      expect(screen.getByText('cannot share')).toBeInTheDocument();
      view.unmount();
    }
    const view = render(<Harness message={answer()} writing />);
    expect(screen.getByText('cannot share')).toBeInTheDocument();
    view.unmount();
  });

  it('FE-AI-SHARE-HOOK-002: needs the chat add-on, a known thread and the right to post', () => {
    seed({ chat: false });
    const first = render(<Harness message={answer()} />);
    expect(screen.getByText('cannot share')).toBeInTheDocument();
    first.unmount();

    // The add-on is on, but the admin switched its chat off.
    seed();
    useAddonStore.setState({ collabChat: false });
    const chatOff = render(<Harness message={answer()} />);
    expect(screen.getByText('cannot share')).toBeInTheDocument();
    chatOff.unmount();
    useAddonStore.setState({ collabChat: true });

    seed({ threadId: null });
    const second = render(<Harness message={answer()} />);
    expect(screen.getByText('cannot share')).toBeInTheDocument();
    second.unmount();

    seed();
    usePermissionsStore.setState({ permissions: { collab_edit: 'admin' } });
    render(<Harness message={answer()} />);
    expect(screen.getByText('cannot share')).toBeInTheDocument();
  });

  it('FE-AI-SHARE-HOOK-003: the preview shows the plain text, and the switch takes the changes out', () => {
    seed();
    render(<Harness message={answer()} />);
    fireEvent.click(screen.getByRole('button', { name: 'share' }));
    expect(screen.getByText(/Take the early train\.\s+Applied:\s+✓ Add place: Nara Park/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add the changes you applied' }));
    expect(screen.getByText('Take the early train.')).toBeInTheDocument();
  });

  it('FE-AI-SHARE-HOOK-004: "Share" posts the previewed text once and says it went', async () => {
    seed();
    const share = vi.spyOn(assistantRepo, 'share').mockResolvedValue({} as never);
    render(<Harness message={answer()} />);
    fireEvent.click(screen.getByRole('button', { name: 'share' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'shared' })).toBeInTheDocument());
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith(TRIP, 7, 'msg-12', {
      text: 'Take the early train.\n\nApplied:\n✓ Add place: Nara Park',
    });
    expect(addToast).toHaveBeenCalledWith('Shared in the trip chat', 'success', undefined);
  });

  it('FE-AI-SHARE-HOOK-005: a chat switched off and a failed post each say what happened', async () => {
    seed();
    const share = vi
      .spyOn(assistantRepo, 'share')
      .mockRejectedValueOnce({ response: { status: 403, data: { error: 'Collab chat is off', code: 'forbidden' } } })
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new OnlineOnlyError());
    render(<Harness message={answer()} />);
    for (const expected of [
      'The trip chat is turned off.',
      'Could not share this. Please try again in a moment.',
      'Offline. The assistant needs internet.',
    ]) {
      fireEvent.click(screen.getByRole('button', { name: 'share' }));
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      await waitFor(() => expect(addToast).toHaveBeenLastCalledWith(expected, 'error', undefined));
    }
    expect(share).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: 'share' })).toBeInTheDocument();
  });

  it('FE-AI-SHARE-HOOK-006: a long answer is cut, and the preview says so', () => {
    seed();
    const long = Array.from({ length: 1200 }, (_, i) => `word${i}`).join(' ');
    render(<Harness message={answer({ parts: [{ type: 'text', text: long }] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'share' }));
    expect(screen.getByText('Shortened to 4800 characters')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add the changes you applied' })).toBeNull();
  });
});
