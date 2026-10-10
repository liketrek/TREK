// FE-COMP-NOTIFITEM-ACTIONS-001 onwards: what one notification can do, behind both lists.
import { act, renderHook } from '@testing-library/react';

import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { type InAppNotification, useInAppNotificationStore } from '../../store/inAppNotificationStore';
import { compactTime, useNotificationItemActions } from './useNotificationItemActions';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigate };
});

const markRead = vi.fn();
const deleteNotification = vi.fn();
const respondToBoolean = vi.fn();

function notification(over: Partial<InAppNotification> = {}): InAppNotification {
  return {
    id: 7,
    type: 'navigate',
    scope: 'user',
    target: 1,
    sender_id: null,
    sender_username: null,
    sender_avatar: null,
    recipient_id: 1,
    title_key: 't',
    title_params: {},
    text_key: 'x',
    text_params: {},
    positive_text_key: null,
    negative_text_key: null,
    response: null,
    navigate_text_key: 'go',
    navigate_target: '/trips/1',
    is_read: false,
    created_at: new Date().toISOString(),
    ...over,
  };
}

beforeEach(() => {
  resetAllStores();
  navigate.mockReset();
  markRead.mockReset().mockResolvedValue(undefined);
  deleteNotification.mockReset().mockResolvedValue(undefined);
  respondToBoolean.mockReset().mockResolvedValue(undefined);
  seedStore(useInAppNotificationStore, { markRead, deleteNotification, respondToBoolean });
});

describe('compactTime', () => {
  it('FE-COMP-NOTIFITEM-ACTIONS-001: minutes, hours and days, and the caller wording under a minute', () => {
    const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
    expect(compactTime(ago(10_000), 'now')).toBe('now');
    expect(compactTime(ago(5 * 60_000), 'now')).toBe('5m');
    expect(compactTime(ago(3 * 3_600_000), 'now')).toBe('3h');
    expect(compactTime(ago(2 * 86_400_000), 'now')).toBe('2d');
  });
});

describe('useNotificationItemActions', () => {
  it('FE-COMP-NOTIFITEM-ACTIONS-002: navigating marks an unread item read first, then follows and closes', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useNotificationItemActions(notification(), onClose));
    await act(() => result.current.handleNavigate());
    expect(markRead).toHaveBeenCalledWith(7);
    expect(navigate).toHaveBeenCalledWith('/trips/1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-NOTIFITEM-ACTIONS-003: a read item is not marked again, and no target means no navigation', async () => {
    const onClose = vi.fn();
    const read = renderHook(() => useNotificationItemActions(notification({ is_read: true })));
    await act(() => read.result.current.handleNavigate());
    expect(markRead).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/trips/1');

    navigate.mockReset();
    const none = renderHook(() => useNotificationItemActions(notification({ navigate_target: null }), onClose));
    await act(() => none.result.current.handleNavigate());
    expect(navigate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-COMP-NOTIFITEM-ACTIONS-004: a question is answered once, and not at all after an answer', async () => {
    let finish: () => void = () => {};
    respondToBoolean.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderHook(() => useNotificationItemActions(notification({ type: 'boolean' })));
    act(() => {
      void result.current.handleRespond('positive');
    });
    expect(result.current.responding).toBe(true);
    act(() => {
      void result.current.handleRespond('negative');
    });
    expect(respondToBoolean).toHaveBeenCalledTimes(1);
    expect(respondToBoolean).toHaveBeenCalledWith(7, 'positive');
    await act(async () => finish());
    expect(result.current.responding).toBe(false);

    const answered = renderHook(() =>
      useNotificationItemActions(notification({ type: 'boolean', response: 'negative' }))
    );
    await act(() => answered.result.current.handleRespond('positive'));
    expect(respondToBoolean).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-NOTIFITEM-ACTIONS-005: hands the store mark read and delete through', () => {
    const { result } = renderHook(() => useNotificationItemActions(notification()));
    void result.current.markRead(7);
    void result.current.deleteNotification(7);
    expect(markRead).toHaveBeenCalledWith(7);
    expect(deleteNotification).toHaveBeenCalledWith(7);
  });
});
