// FE-MOB-AUDIT-001 to FE-MOB-AUDIT-012
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import MAdminAuditLogPanel from '../../../../src/mobile/screens/admin/MAdminAuditLogPanel';

const ENTRY_1 = {
  id: 1,
  created_at: '2025-06-01T10:30:00Z',
  user_id: 5,
  username: 'alice',
  user_email: 'alice@example.com',
  action: 'trip.create',
  resource: '/trips/42',
  details: { title: 'Test' },
  ip: '127.0.0.1',
};

const ENTRY_2 = {
  id: 2,
  created_at: '2025-06-02T11:00:00Z',
  user_id: 6,
  username: 'bob',
  user_email: 'bob@example.com',
  action: 'trip.delete',
  resource: null,
  details: null,
  ip: null,
};

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminAuditLogPanel', () => {
  it('FE-MOB-AUDIT-001: header, subtitle and the loading placeholder render on mount', () => {
    server.use(
      http.get('/api/admin/audit-log', async () => {
        await new Promise(() => {});
        return HttpResponse.json({ entries: [], total: 0 });
      }),
    );
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    expect(screen.getByText('Audit')).toBeInTheDocument();
    expect(
      screen.getByText('Security-sensitive and administration events (backups, users, MFA, settings).'),
    ).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });

  it('FE-MOB-AUDIT-002: empty state and a zeroed counter when there is nothing to show', async () => {
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ entries: [], total: 0 })));
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('No audit entries yet.');
    expect(screen.getByText('0 loaded · 0 total')).toBeInTheDocument();
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-003: an entry card shows action, user, resource, ip and details', async () => {
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ entries: [ENTRY_1], total: 1 })));
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.create');
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Resource')).toBeInTheDocument();
    expect(screen.getByText('IP')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('/trips/42')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('{"title":"Test"}')).toBeInTheDocument();
    expect(screen.getByText('1 loaded · 1 total')).toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-004: the timestamp is rendered in the server timezone', async () => {
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ entries: [ENTRY_1], total: 1 })));
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.create');
    expect(screen.getByText('6/1/25, 10:30:00 AM')).toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-005: timestamps without a Z suffix are treated as UTC', async () => {
    const naive = { ...ENTRY_1, created_at: '2025-06-01T10:30:00' };
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ entries: [naive], total: 1 })));
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.create');
    expect(screen.getByText('6/1/25, 10:30:00 AM')).toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-006: an unusable timezone falls back to the raw timestamp', async () => {
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ entries: [ENTRY_1], total: 1 })));
    render(<MAdminAuditLogPanel serverTimezone="Not/AZone" />);

    await screen.findByText('trip.create');
    expect(screen.getByText('2025-06-01T10:30:00Z')).toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-007: the user label falls back through email, id and dash', async () => {
    const entries = [
      { ...ENTRY_1, id: 10, action: 'a.username' },
      { ...ENTRY_1, id: 11, username: null, action: 'a.email' },
      { ...ENTRY_1, id: 12, username: null, user_email: null, user_id: 7, action: 'a.id' },
      { ...ENTRY_1, id: 13, username: null, user_email: null, user_id: null, action: 'a.none' },
    ];
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ entries, total: 4 })));
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('a.username');
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  it('FE-MOB-AUDIT-008: null resource, ip and details render as a dash', async () => {
    const emptyDetails = { ...ENTRY_1, id: 21, action: 'a.emptyobj', details: {} };
    server.use(
      http.get('/api/admin/audit-log', () => HttpResponse.json({ entries: [ENTRY_2, emptyDetails], total: 2 })),
    );
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.delete');
    // ENTRY_2 contributes three dashes, the empty details object a fourth
    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('FE-MOB-AUDIT-009: Load more appends the next page and disappears when complete', async () => {
    const user = userEvent.setup();
    const offsets: string[] = [];
    server.use(
      http.get('/api/admin/audit-log', ({ request }) => {
        const offset = new URL(request.url).searchParams.get('offset') ?? '';
        offsets.push(offset);
        return offset === '0'
          ? HttpResponse.json({ entries: [ENTRY_1], total: 2 })
          : HttpResponse.json({ entries: [ENTRY_2], total: 2 });
      }),
    );
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.create');
    await user.click(screen.getByRole('button', { name: 'Load more' }));

    await screen.findByText('trip.delete');
    expect(screen.getByText('trip.create')).toBeInTheDocument();
    expect(screen.getByText('2 loaded · 2 total')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(offsets).toEqual(['0', '100']);
  });

  it('FE-MOB-AUDIT-010: a failing Load more keeps the entries already loaded', async () => {
    const user = userEvent.setup();
    let call = 0;
    server.use(
      http.get('/api/admin/audit-log', () => {
        call += 1;
        return call === 1
          ? HttpResponse.json({ entries: [ENTRY_1], total: 5 })
          : HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.create');
    await user.click(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Load more' })).not.toBeDisabled());
    expect(screen.getByText('trip.create')).toBeInTheDocument();
    expect(screen.getByText('1 loaded · 5 total')).toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-011: Refresh throws away the appended pages', async () => {
    const user = userEvent.setup();
    let call = 0;
    server.use(
      http.get('/api/admin/audit-log', () => {
        call += 1;
        if (call === 1) return HttpResponse.json({ entries: [ENTRY_1], total: 2 });
        if (call === 2) return HttpResponse.json({ entries: [ENTRY_2], total: 2 });
        return HttpResponse.json({ entries: [{ ...ENTRY_1, id: 99, action: 'after.refresh' }], total: 1 });
      }),
    );
    render(<MAdminAuditLogPanel serverTimezone="UTC" />);

    await screen.findByText('trip.create');
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText('trip.delete');

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await screen.findByText('after.refresh');
    expect(screen.queryByText('trip.create')).not.toBeInTheDocument();
    expect(screen.queryByText('trip.delete')).not.toBeInTheDocument();
    expect(screen.getByText('1 loaded · 1 total')).toBeInTheDocument();
  });

  it('FE-MOB-AUDIT-012: a failing first page falls back to the empty state', async () => {
    server.use(http.get('/api/admin/audit-log', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    render(<MAdminAuditLogPanel />);

    await screen.findByText('No audit entries yet.');
    expect(screen.getByText('0 loaded · 0 total')).toBeInTheDocument();
  });
});
