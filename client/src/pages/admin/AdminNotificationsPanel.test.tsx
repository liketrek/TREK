// FE-ADMMTX-001 to FE-ADMMTX-011
import { http, HttpResponse } from 'msw';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { buildAdminToast } from '../../../tests/helpers/mobileAdmin';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n';
import type { useToast } from '../../components/shared/Toast';
import AdminNotificationsPanel from './AdminNotificationsPanel';

type Spy = ReturnType<typeof vi.fn>;

function Harness({ toast }: { toast: Record<string, Spy> }) {
  const { t } = useTranslation();
  return <AdminNotificationsPanel t={t} toast={toast as unknown as ReturnType<typeof useToast>} />;
}

function renderPanel() {
  const toast = buildAdminToast();
  render(<Harness toast={toast} />);
  return toast;
}

function matrix(overrides: Record<string, unknown> = {}) {
  return {
    event_types: ['version_available'],
    channels: [
      { id: 'inapp', source: 'builtin', active: true, configured: true },
      { id: 'email', source: 'builtin', active: true, configured: true },
      { id: 'webhook', source: 'builtin', active: false, configured: false },
    ],
    implemented_combos: { version_available: ['inapp', 'email'] },
    preferences: { version_available: { inapp: true, email: false } },
    ...overrides,
  };
}

function servePreferences(data: Record<string, unknown>) {
  server.use(http.get('/api/admin/notification-preferences', () => HttpResponse.json(data)));
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('AdminNotificationsPanel', () => {
  it('FE-ADMMTX-001: shows a loading line until the matrix arrives', () => {
    servePreferences(matrix());
    renderPanel();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('FE-ADMMTX-002: stays on the loading line when the request fails', async () => {
    server.use(http.get('/api/admin/notification-preferences', () => HttpResponse.json({}, { status: 500 })));
    renderPanel();

    await waitFor(() => expect(screen.getByText('Loading…')).toBeInTheDocument());
  });

  it('FE-ADMMTX-003: renders the empty state when no event types exist', async () => {
    servePreferences(matrix({ event_types: [], implemented_combos: {}, preferences: {} }));
    renderPanel();

    expect(await screen.findByText(/no notification channels/i)).toBeInTheDocument();
  });

  it('FE-ADMMTX-004: renders one column per active, implemented channel', async () => {
    servePreferences(matrix());
    renderPanel();

    expect(await screen.findByText('In-App')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    // webhook is inactive server-side → no column
    expect(screen.queryByText('Webhook')).not.toBeInTheDocument();
  });

  it('FE-ADMMTX-005: renders the translated event label as the row header', async () => {
    servePreferences(matrix());
    renderPanel();

    expect(await screen.findByText('New version available')).toBeInTheDocument();
  });

  it('FE-ADMMTX-006: falls back to the raw event id for unknown events', async () => {
    servePreferences(
      matrix({
        event_types: ['custom.event'],
        implemented_combos: { 'custom.event': ['email'] },
        preferences: { 'custom.event': { email: true } },
      })
    );
    renderPanel();

    expect(await screen.findByText('custom.event')).toBeInTheDocument();
  });

  it('FE-ADMMTX-007: renders a dash where a channel is not implemented for an event', async () => {
    servePreferences(
      matrix({
        event_types: ['version_available', 'custom.event'],
        implemented_combos: { version_available: ['inapp', 'email'], 'custom.event': ['email'] },
      })
    );
    renderPanel();

    await screen.findByText('New version available');
    // custom.event has no in-app implementation → placeholder instead of a toggle
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('FE-ADMMTX-008: toggling a preference PUTs the whole matrix', async () => {
    let body: Record<string, unknown> | null = null;
    servePreferences(matrix());
    server.use(
      http.put('/api/admin/notification-preferences', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      })
    );
    renderPanel();

    await screen.findByText('New version available');
    const toggles = screen.getAllByRole('button');
    fireEvent.click(toggles[1]); // email column, currently off

    await waitFor(() => expect(body).toEqual({ version_available: { inapp: true, email: true } }));
  });

  it('FE-ADMMTX-009: an unknown preference defaults to on and toggles off', async () => {
    let body: Record<string, unknown> | null = null;
    servePreferences(matrix({ preferences: {} }));
    server.use(
      http.put('/api/admin/notification-preferences', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      })
    );
    renderPanel();

    await screen.findByText('New version available');
    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => expect(body).toEqual({ version_available: { inapp: false } }));
  });

  it('FE-ADMMTX-010: a failing save reverts the toggle and toasts', async () => {
    servePreferences(matrix());
    server.use(
      http.put('/api/admin/notification-preferences', () => HttpResponse.json({}, { status: 500 }))
    );
    const toast = renderPanel();

    await screen.findByText('New version available');
    const emailToggle = screen.getAllByRole('button')[1];
    fireEvent.click(emailToggle);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(emailToggle.className).toContain('bg-edge');
  });

  it('FE-ADMMTX-011: a channel that no event implements gets no column', async () => {
    servePreferences(
      matrix({
        channels: [
          { id: 'inapp', source: 'builtin', active: true, configured: true },
          { id: 'ntfy', source: 'builtin', active: true, configured: true },
        ],
        implemented_combos: { version_available: ['inapp'] },
      })
    );
    renderPanel();

    expect(await screen.findByText('In-App')).toBeInTheDocument();
    expect(screen.queryByText('Ntfy')).not.toBeInTheDocument();
  });

  it('FE-ADMMTX-012: a failing save keeps a toggle that succeeded before it', async () => {
    servePreferences(matrix());
    const bodies: Record<string, unknown>[] = [];
    server.use(
      http.put('/api/admin/notification-preferences', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return bodies.length === 1 ? HttpResponse.json({ success: true }) : HttpResponse.json({}, { status: 500 });
      })
    );
    const toast = renderPanel();

    await screen.findByText('New version available');
    const [inappToggle, emailToggle] = screen.getAllByRole('button');

    // Both clicks land before React re-renders, so the second handler still sees the
    // preferences of the first render.
    await act(async () => {
      fireEvent.click(inappToggle); // on -> off, succeeds
      fireEvent.click(emailToggle); // off -> on, fails
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(bodies[1]).toEqual({ version_available: { inapp: false, email: true } });
    expect(emailToggle.className).toContain('bg-edge');
    expect(inappToggle.className).toContain('bg-edge');
  });
});
