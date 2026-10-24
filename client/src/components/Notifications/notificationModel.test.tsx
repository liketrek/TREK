/**
 * FE-NOTIF-MODEL-001 to FE-NOTIF-MODEL-007
 *
 * What a notification's tile shows, how the server's time is read, and how the
 * list is cut into days under headings in the reader's language.
 */
import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import type { InAppNotification } from '../../store/inAppNotificationStore';
import NotificationDayList from './NotificationDayList';
import { KIND_LOOK, createdAt, dayLabel, groupByDay, kindOf } from './notificationModel';

const note = (id: number, created_at: string, title_key = 'notif.trip_invite.title'): InAppNotification => ({
  id,
  type: 'simple',
  scope: 'trip',
  target: 1,
  sender_id: null,
  sender_username: null,
  sender_avatar: null,
  recipient_id: 1,
  title_key,
  title_params: {},
  text_key: 'notifications.empty',
  text_params: {},
  positive_text_key: null,
  negative_text_key: null,
  response: null,
  navigate_text_key: null,
  navigate_target: null,
  is_read: false,
  created_at,
});

const NOW = new Date(2026, 9, 24, 15, 0);
const at = (days: number, hour = 10) => new Date(2026, 9, 24 - days, hour, 0);

describe('notificationModel', () => {
  it('FE-NOTIF-MODEL-001: every known title has its kind, anything else is the plain bell', () => {
    expect(kindOf('notif.collab_message.title')).toBe('message');
    expect(kindOf('notif.replica_failure.title')).toBe('alert');
    expect(kindOf('plugin.something.title')).toBe('other');
    for (const look of Object.values(KIND_LOOK)) expect(look.tone).toMatch(/^bg-/);
  });

  it("FE-NOTIF-MODEL-002: the server's UTC text is read as UTC, an ISO string as it is", () => {
    expect(createdAt('2026-10-24 08:30:00').toISOString()).toBe('2026-10-24T08:30:00.000Z');
    expect(createdAt('2026-10-24T08:30:00.000Z').toISOString()).toBe('2026-10-24T08:30:00.000Z');
  });

  it('FE-NOTIF-MODEL-003: today and yesterday by name, the week by weekday, older by date', () => {
    expect(dayLabel(at(0), 'en', NOW)).toBe('Today');
    expect(dayLabel(at(1), 'en', NOW)).toBe('Yesterday');
    expect(dayLabel(at(3), 'en', NOW)).toBe('Wednesday');
    expect(dayLabel(at(20), 'en', NOW)).toBe('October 4');
    expect(dayLabel(new Date(2025, 11, 31), 'en', NOW)).toBe('December 31, 2025');
  });

  it('FE-NOTIF-MODEL-004: the headings follow the language', () => {
    expect(dayLabel(at(0), 'de', NOW)).toBe('Heute');
    expect(dayLabel(at(1), 'de', NOW)).toBe('Gestern');
  });

  it('FE-NOTIF-MODEL-005: the list is cut into days in the order it came', () => {
    const groups = groupByDay(
      [note(1, at(0, 12).toISOString()), note(2, at(0, 9).toISOString()), note(3, at(2).toISOString())],
      'en',
      NOW
    );
    expect(groups.map((g) => [g.label, g.items.map((n) => n.id)])).toEqual([
      ['Today', [1, 2]],
      ['Thursday', [3]],
    ]);
  });

  it('FE-NOTIF-MODEL-006: an empty list has no days', () => {
    expect(groupByDay([], 'en', NOW)).toEqual([]);
  });
});

describe('NotificationDayList', () => {
  it('FE-NOTIF-MODEL-007: each day is a section under its heading', () => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12);
    render(<NotificationDayList notifications={[note(1, now.toISOString()), note(2, yesterday.toISOString())]} />);
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });
});
