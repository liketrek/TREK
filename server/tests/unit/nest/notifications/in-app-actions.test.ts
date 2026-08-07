/**
 * Unit tests for inAppNotificationActions — NOTIF-ACT-001 through NOTIF-ACT-008.
 * Pure Map registry — no DB or external dependencies.
 */
import { describe, it, expect } from 'vitest';
import { getAction } from '../../../../src/nest/notifications/in-app-actions';

describe('getAction — built-in registrations', () => {
  it('NOTIF-ACT-001 — test_approve is pre-registered', () => {
    const handler = getAction('test_approve');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('NOTIF-ACT-002 — test_deny is pre-registered', () => {
    const handler = getAction('test_deny');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

});
