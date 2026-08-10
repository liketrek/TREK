/**
 * The admin-scope preference matrix, after the two routes moved off AdminController
 * next to NotificationPreferencesService, which owns it. The 'admin' scope argument
 * they always passed is now written once, at the only place that uses it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminNotificationPreferencesController } from '../../../src/nest/notifications/notifications.controller';
import { NotificationsModule } from '../../../src/nest/notifications/notifications.module';
import type { NotificationPreferencesService } from '../../../src/nest/notifications/notification-preferences.service';
import type { User } from '../../../src/types';
import { expectRegisteredController } from '../../helpers/module-providers';

const admin = { id: 1, role: 'admin' } as User;

function controller() {
  const prefs = {
    getPreferencesMatrix: vi.fn(() => ({ rows: [{ event: 'trip_reminder' }] })),
    setAdminPreferences: vi.fn(),
  } as unknown as NotificationPreferencesService;
  return { c: new AdminNotificationPreferencesController(prefs), prefs };
}

describe('AdminNotificationPreferencesController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ADMINPREF-001 GET asks for the admin scope, not the user one', () => {
    const { c, prefs } = controller();
    expect(c.get(admin)).toEqual({ rows: [{ event: 'trip_reminder' }] });
    expect(prefs.getPreferencesMatrix).toHaveBeenCalledWith(1, 'admin', 'admin');
  });

  it('ADMINPREF-002 PUT persists, then answers with the REFRESHED matrix', () => {
    const { c, prefs } = controller();
    // The admin panel renders straight from this response, so returning the write
    // result instead of a fresh read would leave it showing stale rows.
    expect(c.set(admin, { trip_reminder: { email: true } } as never)).toEqual({ rows: [{ event: 'trip_reminder' }] });
    expect(prefs.setAdminPreferences).toHaveBeenCalledWith(1, { trip_reminder: { email: true } });
    expect(prefs.getPreferencesMatrix).toHaveBeenCalledWith(1, 'admin', 'admin');
  });

  it('ADMINPREF-003 the acting user drives the lookup, never a body field', () => {
    const { c, prefs } = controller();
    c.get({ id: 7, role: 'admin' } as User);
    expect(prefs.getPreferencesMatrix).toHaveBeenCalledWith(7, 'admin', 'admin');
  });

  it('ADMINPREF-004 the class is listed in its module controllers', () => {
    expectRegisteredController(NotificationsModule, AdminNotificationPreferencesController);
  });
});
