import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';
import MNotifications from '../../../../src/mobile/screens/notifications/MNotifications';

// FE-MOB-NOTIF-001 onwards

beforeEach(() => {
  resetAllStores();
});

describe('MNotifications', () => {
  it('FE-MOB-NOTIF-001: loads the first page with unread badge and bulk actions', async () => {
    render(<MNotifications />);

    // Default handler: 25 notifications (page of 20), unread_count 5.
    await waitFor(() => {
      expect(screen.getAllByText('notif.title')).toHaveLength(20);
    });
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('FE-MOB-NOTIF-002: the unread segment filters out read notifications', async () => {
    const user = userEvent.setup();
    render(<MNotifications />);

    await waitFor(() => {
      expect(screen.getAllByText('notif.title')).toHaveLength(20);
    });

    // First 5 rows of the default handler are unread.
    await user.click(screen.getByRole('tab', { name: 'Unread' }));
    await waitFor(() => {
      expect(screen.getAllByText('notif.title')).toHaveLength(5);
    });

    await user.click(screen.getByRole('tab', { name: 'All' }));
    await waitFor(() => {
      expect(screen.getAllByText('notif.title')).toHaveLength(20);
    });
  });
});
