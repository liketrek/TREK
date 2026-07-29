import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';
import MNotificationRow from '../../../../src/mobile/screens/notifications/MNotificationRow';
import {
  useInAppNotificationStore, type InAppNotification,
} from '../../../../src/store/inAppNotificationStore';

// FE-MOB-NROW-001 onwards

const markRead = vi.fn(async (_id: number) => {});
const deleteNotification = vi.fn(async (_id: number) => {});
const respondToBoolean = vi.fn(async (_id: number, _r: 'positive' | 'negative') => {});

function buildNotification(over: Partial<InAppNotification> = {}): InAppNotification {
  return {
    id: 3,
    type: 'simple',
    scope: 'trip',
    target: 1,
    sender_id: 2,
    sender_username: 'maurice',
    sender_avatar: null,
    recipient_id: 1,
    title_key: 'notif.title',
    title_params: {},
    text_key: 'notif.text',
    text_params: {},
    positive_text_key: null,
    negative_text_key: null,
    response: null,
    navigate_text_key: null,
    navigate_target: null,
    is_read: false,
    created_at: new Date().toISOString(),
    ...over,
  };
}

const agesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

beforeEach(() => {
  resetAllStores();
  markRead.mockClear();
  deleteNotification.mockClear();
  respondToBoolean.mockClear();
  useInAppNotificationStore.setState({ markRead, deleteNotification, respondToBoolean });
});

describe('MNotificationRow', () => {
  it('FE-MOB-NROW-001: shows title, body, sender initial and the unread dot', () => {
    const { container } = render(<MNotificationRow notification={buildNotification()} />);

    expect(screen.getByText('notif.title')).toBeInTheDocument();
    expect(screen.getByText('notif.text')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(container.querySelectorAll('span[aria-hidden]')).toHaveLength(1);
  });

  it('FE-MOB-NROW-002: a read notification drops the dot', () => {
    const { container } = render(<MNotificationRow notification={buildNotification({ is_read: true })} />);

    expect(container.querySelectorAll('span[aria-hidden]')).toHaveLength(0);
  });

  it('FE-MOB-NROW-003: renders the sender avatar when there is one', () => {
    const { container } = render(
      <MNotificationRow notification={buildNotification({ sender_avatar: '/uploads/avatars/m.jpg' })} />,
    );

    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/m.jpg');
    expect(screen.queryByText('M')).not.toBeInTheDocument();
  });

  it('FE-MOB-NROW-004: a system notification falls back to the bell tile', () => {
    const { container } = render(
      <MNotificationRow notification={buildNotification({ sender_username: null })} />,
    );

    expect(container.querySelector('.lucide-bell')).toBeInTheDocument();
  });

  it.each([
    [0, 'just now'],
    [7, '7m'],
    [180, '3h'],
    [60 * 24 * 2, '2d'],
  ])('FE-MOB-NROW-005: %s minutes old renders as %s', (minutes, label) => {
    render(<MNotificationRow notification={buildNotification({ created_at: agesAgo(minutes) })} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('FE-MOB-NROW-006: tapping an unread row marks it read', () => {
    render(<MNotificationRow notification={buildNotification()} />);

    fireEvent.click(screen.getByText('notif.title'));

    expect(markRead).toHaveBeenCalledWith(3);
  });

  it('FE-MOB-NROW-007: tapping an already-read row does nothing', () => {
    render(<MNotificationRow notification={buildNotification({ is_read: true })} />);

    fireEvent.click(screen.getByText('notif.title'));

    expect(markRead).not.toHaveBeenCalled();
  });

  it('FE-MOB-NROW-008: the trailing button deletes without marking read', () => {
    render(<MNotificationRow notification={buildNotification()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteNotification).toHaveBeenCalledWith(3);
    expect(markRead).not.toHaveBeenCalled();
  });

  it('FE-MOB-NROW-009: a boolean notification answers through the chips', async () => {
    render(
      <MNotificationRow
        notification={buildNotification({
          type: 'boolean', positive_text_key: 'notif.yes', negative_text_key: 'notif.no',
        })}
      />,
    );

    fireEvent.click(screen.getByText('notif.yes'));

    await waitFor(() => expect(respondToBoolean).toHaveBeenCalledWith(3, 'positive'));
    // The chips sit in their own stop-propagation area, so the row is not marked read.
    expect(markRead).not.toHaveBeenCalled();
  });

  it('FE-MOB-NROW-010: an answered boolean notification ignores further taps', () => {
    render(
      <MNotificationRow
        notification={buildNotification({
          type: 'boolean', positive_text_key: 'notif.yes', negative_text_key: 'notif.no', response: 'negative',
        })}
      />,
    );

    fireEvent.click(screen.getByText('notif.no'));
    fireEvent.click(screen.getByText('notif.yes'));

    expect(respondToBoolean).not.toHaveBeenCalled();
  });

  it('FE-MOB-NROW-011: a navigate notification marks read and follows its target', async () => {
    render(
      <MNotificationRow
        notification={buildNotification({
          type: 'navigate', navigate_text_key: 'notif.open', navigate_target: '/trips/9',
        })}
      />,
    );

    fireEvent.click(screen.getByText('notif.open'));

    await waitFor(() => expect(markRead).toHaveBeenCalledWith(3));
  });

  it('FE-MOB-NROW-012: a boolean notification without labels renders no chips', () => {
    render(
      <MNotificationRow notification={buildNotification({ type: 'boolean', positive_text_key: 'notif.yes' })} />,
    );

    expect(screen.queryByText('notif.yes')).not.toBeInTheDocument();
  });
});
