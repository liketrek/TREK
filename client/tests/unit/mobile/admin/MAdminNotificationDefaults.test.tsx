// FE-MOB-ANOTIFDEF-001 to FE-MOB-ANOTIFDEF-003
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import MAdminNotificationDefaults from '../../../../src/mobile/screens/admin/MAdminNotificationDefaults';
import { server } from '../../../helpers/msw/server';
import { fireEvent, render, waitFor } from '../../../helpers/render';

const matrix = (defaults: Record<string, Record<string, string>>) => ({
  defaults,
  channels: [
    { id: 'inapp', labelKey: 'settings.notificationPreferences.inapp', active: true, configured: true },
    { id: 'email', labelKey: 'settings.notificationPreferences.email', active: true, configured: true },
  ],
  event_types: ['trip_invite', 'booking_change'],
  implemented_combos: { trip_invite: ['inapp', 'email'], booking_change: ['inapp'] },
});

const cells = () => Array.from(document.querySelectorAll('button[data-state]')) as HTMLElement[];

describe('MAdminNotificationDefaults (#1536)', () => {
  it('FE-MOB-ANOTIFDEF-001: one pill per channel an event is sent on, each in its state', async () => {
    server.use(
      http.get('/api/admin/notification-preferences/defaults', () =>
        HttpResponse.json(matrix({ trip_invite: { inapp: 'on', email: 'blocked' }, booking_change: { inapp: 'off' } }))
      )
    );
    render(<MAdminNotificationDefaults />);
    await waitFor(() => expect(cells()).toHaveLength(3));
    expect(cells().map((b) => b.getAttribute('data-state'))).toEqual(['on', 'blocked', 'off']);
  });

  it('FE-MOB-ANOTIFDEF-002: a tap cycles the cell to its next state and saves it', async () => {
    const sent: unknown[] = [];
    server.use(
      http.get('/api/admin/notification-preferences/defaults', () =>
        HttpResponse.json(matrix({ trip_invite: { inapp: 'on', email: 'on' }, booking_change: { inapp: 'on' } }))
      ),
      http.put('/api/admin/notification-preferences/defaults', async ({ request }) => {
        sent.push(await request.json());
        return HttpResponse.json(
          matrix({ trip_invite: { inapp: 'on', email: 'off' }, booking_change: { inapp: 'on' } })
        );
      })
    );
    render(<MAdminNotificationDefaults />);
    await waitFor(() => expect(cells()).toHaveLength(3));
    fireEvent.click(cells()[1]);
    await waitFor(() => expect(sent).toHaveLength(1));
    await waitFor(() => expect(cells()[1].getAttribute('data-state')).toBe('off'));
  });

  it('FE-MOB-ANOTIFDEF-003: nothing is drawn until the defaults are loaded', () => {
    server.use(http.get('/api/admin/notification-preferences/defaults', () => new Promise(() => {})));
    render(<MAdminNotificationDefaults />);
    expect(cells()).toHaveLength(0);
  });
});
