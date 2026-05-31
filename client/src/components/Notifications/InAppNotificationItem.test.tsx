// FE-COMP-NOTIF-001 to FE-COMP-NOTIF-016
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useInAppNotificationStore } from '../../store/inAppNotificationStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import type { InAppNotification } from '../../store/inAppNotificationStore';
import InAppNotificationItem from './InAppNotificationItem';

const buildNotification = (overrides: Partial<InAppNotification> = {}): InAppNotification => ({
  id: 1,
  type: 'simple',
  scope: 'trip',
  target: 1,
  sender_id: 2,
  sender_username: 'alice',
  sender_avatar: null,
  recipient_id: 1,
  title_key: 'notifications.title',
  title_params: {},
  text_key: 'notifications.empty',
  text_params: {},
  positive_text_key: null,
  negative_text_key: null,
  response: null,
  navigate_text_key: null,
  navigate_target: null,
  is_read: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: buildSettings() });
});

describe('InAppNotificationItem', () => {
  it('FE-COMP-NOTIF-001: renders without crashing', () => {
    render(<InAppNotificationItem notification={buildNotification()} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-002: shows sender avatar initial letter', () => {
    render(<InAppNotificationItem notification={buildNotification({ sender_username: 'bob' })} />);
    // Avatar shows first letter uppercase: "B"
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-003: shows notification title text', () => {
    render(<InAppNotificationItem notification={buildNotification({ title_key: 'notifications.title' })} />);
    // t('notifications.title') = "Notifications"
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-004: shows notification body text', () => {
    render(<InAppNotificationItem notification={buildNotification({ text_key: 'notifications.empty' })} />);
    // t('notifications.empty') = "No notifications"
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-005: shows Mark as read button for unread notification', () => {
    render(<InAppNotificationItem notification={buildNotification({ is_read: false })} />);
    expect(screen.getByTitle('Mark as read')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-006: does not show Mark as read button for read notification', () => {
    render(<InAppNotificationItem notification={buildNotification({ is_read: true })} />);
    expect(screen.queryByTitle('Mark as read')).not.toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-007: shows Delete button', () => {
    render(<InAppNotificationItem notification={buildNotification()} />);
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-008: clicking Mark as read calls markRead', async () => {
    const user = userEvent.setup();
    const markRead = vi.fn().mockResolvedValue(undefined);
    seedStore(useInAppNotificationStore, { markRead });
    render(<InAppNotificationItem notification={buildNotification({ id: 42, is_read: false })} />);
    await user.click(screen.getByTitle('Mark as read'));
    expect(markRead).toHaveBeenCalledWith(42);
  });

  it('FE-COMP-NOTIF-009: clicking Delete calls deleteNotification', async () => {
    const user = userEvent.setup();
    const deleteNotification = vi.fn().mockResolvedValue(undefined);
    seedStore(useInAppNotificationStore, { deleteNotification });
    render(<InAppNotificationItem notification={buildNotification({ id: 99 })} />);
    await user.click(screen.getByTitle('Delete'));
    expect(deleteNotification).toHaveBeenCalledWith(99);
  });

  it('FE-COMP-NOTIF-010: shows relative timestamp', () => {
    render(<InAppNotificationItem notification={buildNotification({ created_at: new Date().toISOString() })} />);
    // Recent notification shows "just now"
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-011: shows avatar image when sender_avatar is provided', () => {
    render(
      <InAppNotificationItem
        notification={buildNotification({ sender_avatar: 'https://example.com/avatar.png' })}
      />
    );
    expect(document.querySelector('img')).toBeInTheDocument();
    expect(document.querySelector('img')?.getAttribute('src')).toBe('https://example.com/avatar.png');
  });

  it('FE-COMP-NOTIF-012: boolean notification shows Accept and Reject buttons', () => {
    render(
      <InAppNotificationItem
        notification={buildNotification({
          type: 'boolean',
          positive_text_key: 'common.yes',
          negative_text_key: 'common.no',
        })}
      />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-013: clicking Accept calls respondToBoolean with positive', async () => {
    const user = userEvent.setup();
    const respondToBoolean = vi.fn().mockResolvedValue(undefined);
    seedStore(useInAppNotificationStore, { respondToBoolean });
    render(
      <InAppNotificationItem
        notification={buildNotification({
          id: 55,
          type: 'boolean',
          positive_text_key: 'common.yes',
          negative_text_key: 'common.no',
          response: null,
        })}
      />
    );
    await user.click(screen.getByText('Yes'));
    expect(respondToBoolean).toHaveBeenCalledWith(55, 'positive');
  });

  it('FE-COMP-NOTIF-014: clicking Reject calls respondToBoolean with negative', async () => {
    const user = userEvent.setup();
    const respondToBoolean = vi.fn().mockResolvedValue(undefined);
    seedStore(useInAppNotificationStore, { respondToBoolean });
    render(
      <InAppNotificationItem
        notification={buildNotification({
          id: 66,
          type: 'boolean',
          positive_text_key: 'common.yes',
          negative_text_key: 'common.no',
          response: null,
        })}
      />
    );
    await user.click(screen.getByText('No'));
    expect(respondToBoolean).toHaveBeenCalledWith(66, 'negative');
  });

  it('FE-COMP-NOTIF-015: navigate notification shows action button', () => {
    render(
      <InAppNotificationItem
        notification={buildNotification({
          type: 'navigate',
          navigate_text_key: 'notifications.title',
          navigate_target: '/trips/1',
        })}
      />
    );
    // t('notifications.title') = "Notifications" — the navigate button renders this
    const navigateBtn = document.querySelector('button[style*="pointer"]') ??
      Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Notifications'));
    expect(navigateBtn).toBeInTheDocument();
  });

  it('FE-COMP-NOTIF-016: clicking navigate button marks read and navigates', async () => {
    const user = userEvent.setup();
    const markRead = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    seedStore(useInAppNotificationStore, { markRead });
    render(
      <InAppNotificationItem
        notification={buildNotification({
          id: 77,
          type: 'navigate',
          navigate_text_key: 'notifications.title',
          navigate_target: '/trips/1',
          is_read: false,
        })}
        onClose={onClose}
      />
    );
    // The navigate button renders t('notifications.title') = "Notifications"
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.includes('Notifications')
    );
    expect(btn).toBeTruthy();
    await user.click(btn!);
    expect(markRead).toHaveBeenCalledWith(77);
    expect(onClose).toHaveBeenCalled();
  });
});
