// FE-MOB-AMATRIX-001 to FE-MOB-AMATRIX-011
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { useTranslation } from '../../../../src/i18n';
import type { useToast } from '../../../../src/components/shared/Toast';
import MAdminNotifyMatrix from '../../../../src/mobile/screens/admin/MAdminNotifyMatrix';

const MATRIX = {
  event_types: ['version_available', 'trip_reminder'],
  channels: [
    { id: 'inapp', active: true },
    { id: 'email', active: true },
    { id: 'webhook', active: false },
    { id: 'ntfy', active: true },
  ],
  implemented_combos: {
    version_available: ['inapp', 'email'],
    trip_reminder: ['inapp'],
  },
  preferences: {
    version_available: { inapp: true, email: false },
  },
};

function buildToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };
}

function Harness({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { t } = useTranslation();
  return <MAdminNotifyMatrix t={t} toast={toast} />;
}

function matrixRespondsWith(payload: unknown) {
  server.use(http.get('/api/admin/notification-preferences', () => HttpResponse.json(payload)));
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminNotifyMatrix', () => {
  it('FE-MOB-AMATRIX-001: shows the loading card until the matrix arrives', async () => {
    server.use(
      http.get('/api/admin/notification-preferences', async () => {
        await new Promise(() => {});
        return HttpResponse.json(MATRIX);
      }),
    );
    render(<Harness toast={buildToast()} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('FE-MOB-AMATRIX-002: stays on the loading card when the request fails', async () => {
    server.use(
      http.get('/api/admin/notification-preferences', () => HttpResponse.json({}, { status: 500 })),
    );
    render(<Harness toast={buildToast()} />);

    await waitFor(() => expect(screen.getByText('Loading...')).toBeInTheDocument());
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('FE-MOB-AMATRIX-003: shows the empty hint when the server reports no event types', async () => {
    matrixRespondsWith({ event_types: [], implemented_combos: {}, preferences: {} });
    render(<Harness toast={buildToast()} />);

    expect(
      await screen.findByText(
        'No notification channels are configured. Ask an admin to set up email or webhook notifications.',
      ),
    ).toBeInTheDocument();
  });

  it('FE-MOB-AMATRIX-004: renders only channels that are active and implemented somewhere', async () => {
    matrixRespondsWith(MATRIX);
    render(<Harness toast={buildToast()} />);

    await screen.findByText('New version available');
    expect(screen.getByText('In-App')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    // webhook is inactive, ntfy is active but not implemented for any event
    expect(screen.queryByText('Webhook')).not.toBeInTheDocument();
    expect(screen.queryByText('Ntfy')).not.toBeInTheDocument();
  });

  it('FE-MOB-AMATRIX-005: falls back to the raw event id when no label key exists', async () => {
    matrixRespondsWith(MATRIX);
    render(<Harness toast={buildToast()} />);

    expect(await screen.findByText('trip_reminder')).toBeInTheDocument();
  });

  it('FE-MOB-AMATRIX-006: reflects stored preferences and defaults missing ones to on', async () => {
    matrixRespondsWith(MATRIX);
    render(<Harness toast={buildToast()} />);

    const versionInapp = await screen.findByRole('switch', { name: 'version_available inapp' });
    expect(versionInapp).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'version_available email' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    // trip_reminder has no stored preference at all
    expect(screen.getByRole('switch', { name: 'trip_reminder inapp' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-AMATRIX-007: renders a dash for combos the backend does not implement', async () => {
    matrixRespondsWith(MATRIX);
    render(<Harness toast={buildToast()} />);

    await screen.findByText('trip_reminder');
    expect(screen.queryByRole('switch', { name: 'trip_reminder email' })).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('FE-MOB-AMATRIX-008: toggling a cell persists the whole preference map', async () => {
    matrixRespondsWith(MATRIX);
    let body: Record<string, Record<string, boolean>> | undefined;
    server.use(
      http.put('/api/admin/notification-preferences', async ({ request }) => {
        body = (await request.json()) as Record<string, Record<string, boolean>>;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    render(<Harness toast={buildToast()} />);

    await user.click(await screen.findByRole('switch', { name: 'version_available email' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toEqual({ version_available: { inapp: true, email: true } });
    expect(screen.getByRole('switch', { name: 'version_available email' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('FE-MOB-AMATRIX-009: a failed save reverts the toggle and reports the error', async () => {
    matrixRespondsWith(MATRIX);
    server.use(
      http.put('/api/admin/notification-preferences', () => HttpResponse.json({}, { status: 500 })),
    );
    const toast = buildToast();
    const user = userEvent.setup();
    render(<Harness toast={toast} />);

    await user.click(await screen.findByRole('switch', { name: 'version_available inapp' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'));
    expect(screen.getByRole('switch', { name: 'version_available inapp' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('FE-MOB-AMATRIX-010: toggling an event without stored preferences seeds it from the default', async () => {
    matrixRespondsWith(MATRIX);
    let body: Record<string, Record<string, boolean>> | undefined;
    server.use(
      http.put('/api/admin/notification-preferences', async ({ request }) => {
        body = (await request.json()) as Record<string, Record<string, boolean>>;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    render(<Harness toast={buildToast()} />);

    await user.click(await screen.findByRole('switch', { name: 'trip_reminder inapp' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toEqual({
      version_available: { inapp: true, email: false },
      trip_reminder: { inapp: false },
    });
  });

  it('FE-MOB-AMATRIX-011: a response without a channel list renders the events but no toggles', async () => {
    matrixRespondsWith({
      event_types: ['version_available'],
      implemented_combos: { version_available: ['inapp'] },
      preferences: {},
    });
    render(<Harness toast={buildToast()} />);

    expect(await screen.findByText('New version available')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText('In-App')).not.toBeInTheDocument();
  });
});
