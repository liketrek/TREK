// FE-ADMIN-DEVNOTIF-001 to FE-ADMIN-DEVNOTIF-016
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { buildUser } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { ToastContainer } from '../shared/Toast';
import DevNotificationsPanel from './DevNotificationsPanel';

const ADMIN_USER = buildUser({ id: 1, username: 'testadmin', role: 'admin' });

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: ADMIN_USER, isAuthenticated: true });
});

afterEach(() => {
  server.resetHandlers();
});

describe('DevNotificationsPanel', () => {
  it('FE-ADMIN-DEVNOTIF-001: "DEV ONLY" badge is always visible', () => {
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    expect(screen.getByText('DEV ONLY')).toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-002: four section titles render after data loads', async () => {
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    // Wait for async data to populate conditional sections
    await screen.findByText('Trip-Scoped Events');
    await screen.findByText('User-Scoped Events');
    expect(screen.getByText('Type Testing')).toBeInTheDocument();
    expect(screen.getByText('Admin-Scoped Events')).toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-003: trip selector populated from API', async () => {
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Trip-Scoped Events');
    const [tripSelect] = screen.getAllByRole('combobox');
    const options = Array.from(tripSelect.querySelectorAll('option'));
    const labels = options.map(o => o.textContent);
    expect(labels).toContain('Paris Adventure');
    expect(labels).toContain('Tokyo Trip');
  });

  it('FE-ADMIN-DEVNOTIF-004: user selector populated from API', async () => {
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('User-Scoped Events');
    const selects = screen.getAllByRole('combobox');
    // Second combobox is the user selector (first is trip selector)
    const userSelect = selects[1];
    const options = Array.from(userSelect.querySelectorAll('option'));
    const labels = options.map(o => o.textContent ?? '');
    expect(labels.some(l => l.includes('admin'))).toBe(true);
    expect(labels.some(l => l.includes('alice'))).toBe(true);
  });

  it('FE-ADMIN-DEVNOTIF-005: clicking "Simple → Me" fires sendTestNotification with correct payload', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.post('/api/admin/dev/test-notification', async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');
    await user.click(screen.getByText('Simple → Me').closest('button')!);
    await waitFor(() => expect(capturedBody).toBeDefined());
    expect(capturedBody).toMatchObject({
      event: 'test_simple',
      scope: 'user',
      targetId: ADMIN_USER.id,
    });
  });

  it('FE-ADMIN-DEVNOTIF-006: success toast shown after fire', async () => {
    server.use(
      http.post('/api/admin/dev/test-notification', () =>
        HttpResponse.json({ ok: true }),
      ),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');
    await user.click(screen.getByText('Simple → Me').closest('button')!);
    expect(await screen.findByText('Sent: simple-me')).toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-007: all buttons disabled while a send is in-flight', async () => {
    server.use(
      http.post('/api/admin/dev/test-notification', async () => {
        await new Promise(() => {}); // never resolves — simulates in-flight
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');

    // The request handler never resolves, so sending stays true after the click settles
    await user.click(screen.getByText('Simple → Me').closest('button')!);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).toBeDisabled());
    });
  });

  it('FE-ADMIN-DEVNOTIF-008: the server error field is what the toast shows', async () => {
    server.use(
      http.post('/api/admin/dev/test-notification', () =>
        HttpResponse.json({ error: 'No channel configured' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');
    await user.click(screen.getByText('Simple → Me').closest('button')!);
    expect(await screen.findByText('No channel configured')).toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-008b: a failure without an error field falls back to the generic text', async () => {
    server.use(
      http.post('/api/admin/dev/test-notification', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');
    await user.click(screen.getByText('Simple → Me').closest('button')!);
    expect(await screen.findByText('Failed')).toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-009: changing trip selector updates payload targetId', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.post('/api/admin/dev/test-notification', async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Trip-Scoped Events');

    const [tripSelect] = screen.getAllByRole('combobox');
    const tokyoOption = Array.from(tripSelect.querySelectorAll('option')).find(
      o => o.textContent === 'Tokyo Trip',
    )!;
    const tokyoId = Number(tokyoOption.value);

    await user.selectOptions(tripSelect, 'Tokyo Trip');
    await user.click(screen.getByText('booking_change').closest('button')!);

    await waitFor(() => expect(capturedBody).toBeDefined());
    expect(capturedBody!.targetId).toBe(tokyoId);
  });

  it('FE-ADMIN-DEVNOTIF-010: Trip-Scoped section absent when no trips', async () => {
    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [] })),
    );
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    // Wait for user data to confirm async effects have settled
    await screen.findByText('User-Scoped Events');
    expect(screen.queryByText('Trip-Scoped Events')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-011: the remaining self/admin type buttons each fire their own event', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      http.post('/api/admin/dev/test-notification', async ({ request }) => {
        bodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');

    await user.click(screen.getByText('Boolean → Me').closest('button')!);
    await screen.findByText('Sent: boolean-me');
    await user.click(screen.getByText('Navigate → Me').closest('button')!);
    await screen.findByText('Sent: navigate-me');
    await user.click(screen.getByText('Simple → All Admins').closest('button')!);
    await screen.findByText('Sent: simple-admins');
    await user.click(screen.getByText('version_available').closest('button')!);
    await screen.findByText('Sent: version_available');

    expect(bodies[0]).toMatchObject({
      event: 'test_boolean',
      scope: 'user',
      targetId: ADMIN_USER.id,
      inApp: {
        type: 'boolean',
        positiveCallback: { action: 'test_approve', payload: {} },
        negativeCallback: { action: 'test_deny', payload: {} },
      },
    });
    expect(bodies[1]).toMatchObject({ event: 'test_navigate', scope: 'user', targetId: ADMIN_USER.id });
    expect(bodies[2]).toMatchObject({ event: 'test_simple', scope: 'admin', targetId: 0 });
    expect(bodies[3]).toMatchObject({ event: 'version_available', scope: 'admin', targetId: 0, params: { version: '9.9.9-test' } });
  });

  it('FE-ADMIN-DEVNOTIF-012: every trip-scoped button carries the selected trip and the actor', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      http.post('/api/admin/dev/test-notification', async ({ request }) => {
        bodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Trip-Scoped Events');

    const [tripSelect] = screen.getAllByRole('combobox');
    const tripId = Number((tripSelect as HTMLSelectElement).value);

    for (const label of ['trip_reminder', 'photos_shared', 'collab_message', 'packing_tagged']) {
      await user.click(screen.getByText(label).closest('button')!);
      await screen.findByText(`Sent: ${label}`);
    }

    expect(bodies.map(b => b.event)).toEqual(['trip_reminder', 'photos_shared', 'collab_message', 'packing_tagged']);
    for (const body of bodies) {
      expect(body.scope).toBe('trip');
      expect(body.targetId).toBe(tripId);
      expect(body.params).toMatchObject({ trip: 'Paris Adventure', tripId: String(tripId) });
    }
    expect(bodies[1].params).toMatchObject({ actor: 'testadmin', count: '5' });
    expect(bodies[2].params).toMatchObject({ preview: 'This is a test message preview.' });
    expect(bodies[3].params).toMatchObject({ category: 'Clothing' });
  });

  it('FE-ADMIN-DEVNOTIF-013: user-scoped events target the picked recipient', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      http.post('/api/admin/dev/test-notification', async ({ request }) => {
        bodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('User-Scoped Events');

    const userSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    const aliceOption = Array.from(userSelect.querySelectorAll('option')).find(
      o => (o.textContent ?? '').includes('alice'),
    )!;
    await user.selectOptions(userSelect, aliceOption.value);
    const aliceId = Number(aliceOption.value);

    await user.click(screen.getByText('trip_invite').closest('button')!);
    await screen.findByText(`Sent: trip_invite-${aliceId}`);
    await user.click(screen.getByText('vacay_invite').closest('button')!);
    await screen.findByText(`Sent: vacay_invite-${aliceId}`);

    expect(bodies[0]).toMatchObject({
      event: 'trip_invite',
      scope: 'user',
      targetId: aliceId,
      params: { actor: 'testadmin', invitee: 'alice@example.com' },
    });
    expect(bodies[1]).toMatchObject({
      event: 'vacay_invite',
      scope: 'user',
      targetId: aliceId,
      params: { actor: 'testadmin', planId: '1' },
    });
  });

  it('FE-ADMIN-DEVNOTIF-014: the User-Scoped section is hidden when no users come back', async () => {
    server.use(http.get('/api/admin/users', () => HttpResponse.json({ users: [] })));
    render(<><ToastContainer /><DevNotificationsPanel /></>);

    await screen.findByText('Trip-Scoped Events');
    expect(screen.queryByText('User-Scoped Events')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-015: failing lookups leave both scoped sections out without crashing', async () => {
    server.use(
      http.get('/api/trips', () => HttpResponse.error()),
      http.get('/api/admin/users', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><DevNotificationsPanel /></>);

    expect(await screen.findByText('Type Testing')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Trip-Scoped Events')).not.toBeInTheDocument());
    expect(screen.queryByText('User-Scoped Events')).not.toBeInTheDocument();
    expect(screen.getByText('Admin-Scoped Events')).toBeInTheDocument();
  });

  it('FE-ADMIN-DEVNOTIF-016: hovering a trigger paints and restores its background', async () => {
    render(<><ToastContainer /><DevNotificationsPanel /></>);
    await screen.findByText('Type Testing');

    const btn = screen.getByText('Simple → Me').closest('button')!;
    fireEvent.mouseEnter(btn);
    expect(btn.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(btn);
    expect(btn.style.background).toBe('var(--bg-card)');
  });
});
