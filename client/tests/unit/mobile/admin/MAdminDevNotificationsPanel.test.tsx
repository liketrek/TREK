// FE-MOB-ADEV-001 to FE-MOB-ADEV-015
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildAdmin } from '../../../helpers/factories';
import { useAuthStore } from '../../../../src/store/authStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminDevNotificationsPanel from '../../../../src/mobile/screens/admin/MAdminDevNotificationsPanel';

const ADMIN = buildAdmin({ id: 7, username: 'testadmin', email: 'admin@example.com' });

function renderPanel() {
  return render(
    <>
      <ToastContainer />
      <MAdminDevNotificationsPanel />
    </>,
  );
}

/** Captures every POST body the panel sends while a test runs. */
function captureSends() {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    http.post('/api/admin/dev/test-notification', async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ success: true });
    }),
  );
  return bodies;
}

function clickButton(user: ReturnType<typeof userEvent.setup>, label: string) {
  return user.click(screen.getByText(label).closest('button')!);
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { isAuthenticated: true, user: ADMIN });
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminDevNotificationsPanel', () => {
  it('FE-MOB-ADEV-001: renders the dev badge and all four sections once the data is in', async () => {
    renderPanel();

    expect(screen.getByText('DEV ONLY')).toBeInTheDocument();
    expect(screen.getByText('Notification Testing')).toBeInTheDocument();
    expect(screen.getByText('Type Testing')).toBeInTheDocument();
    expect(screen.getByText('Admin-Scoped Events')).toBeInTheDocument();
    await screen.findByText('Trip-Scoped Events');
    await screen.findByText('User-Scoped Events');
  });

  it('FE-MOB-ADEV-002: the trip selector lists the trips from the API and preselects the first', async () => {
    renderPanel();
    await screen.findByText('Trip-Scoped Events');

    const [tripSelect] = screen.getAllByRole('combobox');
    const labels = Array.from(tripSelect.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('Paris Adventure');
    expect(labels).toContain('Tokyo Trip');
    expect((tripSelect as HTMLSelectElement).value).toBe(
      (tripSelect.querySelector('option') as HTMLOptionElement).value,
    );
  });

  it('FE-MOB-ADEV-003: the user selector shows username and email of every user', async () => {
    renderPanel();
    await screen.findByText('User-Scoped Events');

    const userSelect = screen.getAllByRole('combobox')[1];
    const labels = Array.from(userSelect.querySelectorAll('option')).map((o) => o.textContent ?? '');
    expect(labels).toContain('admin (admin@example.com)');
    expect(labels).toContain('alice (alice@example.com)');
  });

  it('FE-MOB-ADEV-004: the type-testing buttons send the documented payloads', async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Type Testing');

    await clickButton(user, 'Simple → Me');
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ event: 'test_simple', scope: 'user', targetId: 7, params: {} });

    await clickButton(user, 'Boolean → Me');
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toMatchObject({
      event: 'test_boolean',
      scope: 'user',
      targetId: 7,
      inApp: {
        type: 'boolean',
        positiveCallback: { action: 'test_approve', payload: {} },
        negativeCallback: { action: 'test_deny', payload: {} },
      },
    });

    await clickButton(user, 'Navigate → Me');
    await waitFor(() => expect(bodies).toHaveLength(3));
    expect(bodies[2]).toMatchObject({ event: 'test_navigate', scope: 'user', targetId: 7 });

    await clickButton(user, 'Simple → All Admins');
    await waitFor(() => expect(bodies).toHaveLength(4));
    expect(bodies[3]).toMatchObject({ event: 'test_simple', scope: 'admin', targetId: 0 });
  });

  it('FE-MOB-ADEV-005: every trip-scoped button targets the selected trip with its own params', async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Trip-Scoped Events');

    const [tripSelect] = screen.getAllByRole('combobox');
    const tripId = Number((tripSelect as HTMLSelectElement).value);
    const tripTitle = tripSelect.querySelector('option')!.textContent;

    await clickButton(user, 'booking_change');
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      event: 'booking_change',
      scope: 'trip',
      targetId: tripId,
      params: {
        actor: 'testadmin',
        trip: tripTitle,
        booking: 'Test Hotel',
        type: 'hotel',
        tripId: String(tripId),
      },
    });

    await clickButton(user, 'trip_reminder');
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual({
      event: 'trip_reminder',
      scope: 'trip',
      targetId: tripId,
      params: { trip: tripTitle, tripId: String(tripId) },
    });

    await clickButton(user, 'photos_shared');
    await waitFor(() => expect(bodies).toHaveLength(3));
    expect(bodies[2]).toMatchObject({ event: 'photos_shared', params: { count: '5' } });

    await clickButton(user, 'collab_message');
    await waitFor(() => expect(bodies).toHaveLength(4));
    expect(bodies[3]).toMatchObject({
      event: 'collab_message',
      params: { preview: 'This is a test message preview.' },
    });

    await clickButton(user, 'packing_tagged');
    await waitFor(() => expect(bodies).toHaveLength(5));
    expect(bodies[4]).toMatchObject({ event: 'packing_tagged', params: { category: 'Clothing' } });
  });

  it('FE-MOB-ADEV-006: the user-scoped buttons target the selected recipient', async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('User-Scoped Events');

    const userSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    const recipientId = Number(userSelect.value);

    await clickButton(user, 'trip_invite');
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({
      event: 'trip_invite',
      scope: 'user',
      targetId: recipientId,
      params: { actor: 'testadmin', invitee: 'admin@example.com' },
    });

    await clickButton(user, 'vacay_invite');
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual({
      event: 'vacay_invite',
      scope: 'user',
      targetId: recipientId,
      params: { actor: 'testadmin', planId: '1' },
    });
  });

  it('FE-MOB-ADEV-007: the admin-scoped button announces a fake version', async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Admin-Scoped Events');

    await clickButton(user, 'version_available');
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      event: 'version_available',
      scope: 'admin',
      targetId: 0,
      params: { version: '9.9.9-test' },
    });
  });

  it('FE-MOB-ADEV-008: changing the trip selector changes the payload target', async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Trip-Scoped Events');

    const [tripSelect] = screen.getAllByRole('combobox');
    const tokyo = Array.from(tripSelect.querySelectorAll('option')).find(
      (o) => o.textContent === 'Tokyo Trip',
    )!;
    await user.selectOptions(tripSelect, tokyo.value);
    await clickButton(user, 'trip_reminder');

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ targetId: Number(tokyo.value), params: { trip: 'Tokyo Trip' } });
  });

  it('FE-MOB-ADEV-009: changing the user selector changes the recipient', async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('User-Scoped Events');

    const userSelect = screen.getAllByRole('combobox')[1];
    const alice = Array.from(userSelect.querySelectorAll('option')).find(
      (o) => o.textContent?.startsWith('alice'),
    )!;
    await user.selectOptions(userSelect, alice.value);
    await clickButton(user, 'trip_invite');

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({
      targetId: Number(alice.value),
      params: { invitee: 'alice@example.com' },
    });
  });

  it('FE-MOB-ADEV-010: a successful send raises a toast naming the fired button', async () => {
    captureSends();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Type Testing');

    await clickButton(user, 'Simple → Me');
    expect(await screen.findByText('Sent: simple-me')).toBeInTheDocument();
  });

  it('FE-MOB-ADEV-011: a failing send raises an error toast', async () => {
    server.use(
      http.post('/api/admin/dev/test-notification', () => HttpResponse.json({}, { status: 500 })),
    );
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Type Testing');

    await clickButton(user, 'Simple → Me');
    expect(await screen.findByText(/failed|error/i)).toBeInTheDocument();
  });

  it('FE-MOB-ADEV-012: every button is disabled while a send is in flight', async () => {
    server.use(
      http.post('/api/admin/dev/test-notification', async () => {
        await new Promise(() => {});
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Type Testing');

    void clickButton(user, 'Simple → Me');

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });
    // The fired button shows its own spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('FE-MOB-ADEV-013: the scoped sections stay hidden when both lookups fail', async () => {
    server.use(
      http.get('/api/trips', () => HttpResponse.json({}, { status: 500 })),
      http.get('/api/admin/users', () => HttpResponse.json({}, { status: 500 })),
    );
    renderPanel();

    await screen.findByText('Type Testing');
    await waitFor(() => expect(screen.queryAllByRole('combobox')).toHaveLength(0));
    expect(screen.queryByText('Trip-Scoped Events')).not.toBeInTheDocument();
    expect(screen.queryByText('User-Scoped Events')).not.toBeInTheDocument();
  });

  it('FE-MOB-ADEV-014: bare arrays are accepted as well as the wrapped payloads', async () => {
    server.use(
      http.get('/api/trips', () => HttpResponse.json([{ id: 55, title: 'Bare Trip' }])),
      http.get('/api/admin/users', () =>
        HttpResponse.json([{ id: 66, username: 'bare', email: 'bare@example.com' }]),
      ),
    );
    renderPanel();
    await screen.findByText('Trip-Scoped Events');

    const [tripSelect, userSelect] = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(tripSelect.value).toBe('55');
    expect(screen.getByText('Bare Trip')).toBeInTheDocument();
    expect(userSelect.value).toBe('66');
    expect(screen.getByText('bare (bare@example.com)')).toBeInTheDocument();
  });

  it('FE-MOB-ADEV-015: without trips or a signed-in user the invite falls back to defaults', async () => {
    const bodies = captureSends();
    server.use(http.get('/api/trips', () => HttpResponse.json({ trips: [] })));
    resetAllStores();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('User-Scoped Events');

    await clickButton(user, 'trip_invite');

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({
      event: 'trip_invite',
      params: { actor: 'Admin', trip: 'Test Trip', tripId: '0' },
    });
  });
});
