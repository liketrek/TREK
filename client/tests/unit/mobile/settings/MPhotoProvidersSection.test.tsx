// FE-MOB-PHOTOPROV-001 onwards
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildUser } from '../../../helpers/factories';
import { server } from '../../../helpers/msw/server';
import { useAuthStore } from '../../../../src/store/authStore';
import { useAddonStore } from '../../../../src/store/addonStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MPhotoProvidersSection from '../../../../src/mobile/screens/settings/MPhotoProvidersSection';

// Fields are deliberately declared out of sort_order so the component's own
// sorting is what puts them on screen in the url → api_key → skip_ssl order.
const immich = {
  id: 'immich',
  name: 'Immich',
  type: 'photo_provider',
  enabled: true,
  config: {
    settings_get: '/addons/immich/settings',
    settings_put: '/addons/immich/settings',
    status_get: '/addons/immich/status',
    test_post: '/addons/immich/test',
  },
  fields: [
    { key: 'skip_ssl', label: 'skipSSLVerification', input_type: 'checkbox', required: false, secret: false, settings_key: 'skip_ssl', payload_key: 'skip_ssl', sort_order: 3 },
    { key: 'api_key', label: 'providerApiKey', input_type: 'text', placeholder: null, required: true, secret: true, settings_key: 'api_key', payload_key: 'api_key', sort_order: 2 },
    { key: 'url', label: 'providerUrl', input_type: 'text', placeholder: 'https://immich.example.com', hint: 'providerUrlHintSynology', required: true, secret: false, settings_key: 'url', payload_key: 'url', sort_order: 1 },
  ],
};

// Only a GET-shaped test route and no settings_put / status_get: Save must stay
// dead and the connection test has to fall back to the GET endpoint.
const piwigo = {
  id: 'piwigo',
  name: 'Piwigo',
  type: 'photo_provider',
  enabled: true,
  config: {
    settings_get: '/addons/piwigo/settings',
    test_get: '/addons/piwigo/test',
  },
  fields: [
    { key: 'auto_upload', label: 'immichAutoUpload', input_type: 'checkbox', required: false, secret: false, settings_key: 'auto_upload', payload_key: 'auto_upload', sort_order: 1 },
    { key: 'username', label: 'providerUsername', input_type: 'text', placeholder: 'user', required: false, secret: false, settings_key: 'username', payload_key: 'username', sort_order: 2 },
  ],
};

// Config values of the wrong type must be ignored, leaving the provider with no
// usable route at all — neither button may be clickable.
const bare = {
  id: 'bare',
  name: '',
  type: 'photo_provider',
  enabled: true,
  config: { settings_get: 7, settings_put: null, status_get: false },
  fields: [
    { key: 'token', label: 'providerPassword', input_type: 'text', required: false, secret: true, settings_key: null, payload_key: null, sort_order: 1 },
  ],
};

type Addon = { id: string; type: string; enabled: boolean };

function seedProviders(providers: unknown[]): void {
  seedStore(useAddonStore, { addons: providers as Addon[] });
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useAddonStore, { addons: [] });
  server.use(
    http.get('/api/addons/immich/settings', () =>
      HttpResponse.json({ url: 'https://photos.example.com', api_key: 'never-sent-back', skip_ssl: 1, connected: false }),
    ),
    http.get('/api/addons/immich/status', () => HttpResponse.json({ connected: false })),
    http.put('/api/addons/immich/settings', () => HttpResponse.json({ success: true })),
    http.post('/api/addons/immich/test', () => HttpResponse.json({ connected: true })),
    http.get('/api/addons/piwigo/settings', () => HttpResponse.json({})),
    http.get('/api/addons/piwigo/test', () => HttpResponse.json({ connected: true })),
  );
});

describe('MPhotoProvidersSection', () => {
  it('FE-MOB-PHOTOPROV-001: renders nothing while the memories addon is off', () => {
    const { container } = render(<MPhotoProvidersSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-MOB-PHOTOPROV-002: renders nothing when memories is on but no provider is active', async () => {
    seedStore(useAddonStore, {
      addons: [{ ...piwigo, enabled: false }] as unknown as Addon[],
      isEnabled: () => true,
    });
    const { container } = render(<MPhotoProvidersSection />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText('Piwigo')).not.toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-003: renders one card per provider with the fields in sort_order', async () => {
    seedProviders([immich, piwigo]);
    render(<MPhotoProvidersSection />);

    await screen.findByText('Immich');
    expect(screen.getByText('Piwigo')).toBeInTheDocument();

    const immichCard = screen.getByText('Immich').closest('section') as HTMLElement;
    const labels = within(immichCard)
      .getAllByText(/Server URL|API Key|Skip SSL certificate verification/)
      .map(el => el.textContent);
    expect(labels).toEqual(['Server URL', 'API Key', 'Skip SSL certificate verification']);
    // The hint of the url field is translated, not printed as its key.
    expect(screen.getByText(/Include the Photos app path in the URL/)).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-004: hydrates non-secret fields, leaves the secret one blank and coerces non-strings', async () => {
    seedProviders([immich]);
    render(<MPhotoProvidersSection />);

    const urlInput = await screen.findByDisplayValue('https://photos.example.com');
    expect(urlInput).toBeInTheDocument();
    // The API key came back from the server but must never be prefilled.
    expect(screen.queryByDisplayValue('never-sent-back')).not.toBeInTheDocument();
    // skip_ssl arrived as the number 1 — stringified, so it is not the literal 'true'.
    expect(screen.getByRole('switch', { name: 'Skip SSL certificate verification' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-PHOTOPROV-005: missing settings values fall back to empty text and an off checkbox', async () => {
    seedProviders([piwigo]);
    render(<MPhotoProvidersSection />);

    await screen.findByText('Piwigo');
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Mirror journey photos to Immich on upload' })).toHaveAttribute('aria-checked', 'false'),
    );
    expect(screen.getByPlaceholderText('user')).toHaveValue('');
  });

  it('FE-MOB-PHOTOPROV-006: a connected provider masks the empty secret field', async () => {
    // The two routes disagree on purpose: with a status route configured that
    // one decides the badge, so the mask has to appear regardless of ordering.
    server.use(
      http.get('/api/addons/immich/settings', () => HttpResponse.json({ url: 'https://photos.example.com', connected: false })),
      http.get('/api/addons/immich/status', () => HttpResponse.json({ connected: true })),
    );
    seedProviders([immich]);
    render(<MPhotoProvidersSection />);

    await screen.findByText('Immich');
    await waitFor(() => expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument());
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-007: Save stays disabled until every required field has a value', async () => {
    const user = userEvent.setup();
    seedProviders([immich]);
    render(<MPhotoProvidersSection />);

    await screen.findByDisplayValue('https://photos.example.com');
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    await user.type(screen.getByPlaceholderText(''), '  fresh-key  ');
    await waitFor(() => expect(save).toBeEnabled());
  });

  it('FE-MOB-PHOTOPROV-008: Save trims values, sends the checkbox as a boolean and re-reads the status', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    let statusCalls = 0;
    server.use(
      http.put('/api/addons/immich/settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
      http.get('/api/addons/immich/status', () => {
        statusCalls += 1;
        return HttpResponse.json({ connected: true });
      }),
    );
    seedProviders([immich]);
    render(<MPhotoProvidersSection />);

    await screen.findByDisplayValue('https://photos.example.com');
    // The status route reports connected, so the empty secret shows the mask.
    await user.type(await screen.findByPlaceholderText('••••••••'), '  fresh-key  ');
    await user.click(screen.getByRole('switch', { name: 'Skip SSL certificate verification' }));
    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ url: 'https://photos.example.com', api_key: 'fresh-key', skip_ssl: true });
    // The status endpoint is polled once on mount and again right after the save.
    await waitFor(() => expect(statusCalls).toBeGreaterThanOrEqual(2));
    expect(await screen.findByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-009: an untouched secret field is left out of the payload entirely', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/addons/immich/settings', () => HttpResponse.json({ url: 'https://photos.example.com', connected: true })),
      http.get('/api/addons/immich/status', () => HttpResponse.json({ connected: true })),
      http.put('/api/addons/immich/settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );
    // A provider whose secret is optional, so Save is reachable without typing one.
    seedProviders([{ ...immich, fields: immich.fields.map(f => ({ ...f, required: f.key === 'url' })) }]);
    render(<MPhotoProvidersSection />);

    await screen.findByDisplayValue('https://photos.example.com');
    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ url: 'https://photos.example.com', skip_ssl: false });
  });

  it('FE-MOB-PHOTOPROV-010: a successful save toasts the provider name', async () => {
    const user = userEvent.setup();
    seedProviders([{ ...immich, fields: [immich.fields[2]] }]);
    render(<><ToastContainer /><MPhotoProvidersSection /></>);

    await screen.findByDisplayValue('https://photos.example.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Immich settings saved')).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-011: a rejected save toasts the error and re-enables the button', async () => {
    const user = userEvent.setup();
    server.use(http.put('/api/addons/immich/settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    seedProviders([{ ...immich, fields: [immich.fields[2]] }]);
    render(<><ToastContainer /><MPhotoProvidersSection /></>);

    await screen.findByDisplayValue('https://photos.example.com');
    const save = screen.getByRole('button', { name: 'Save' });
    await user.click(save);

    expect(await screen.findByText('Could not save Immich settings')).toBeInTheDocument();
    await waitFor(() => expect(save).toBeEnabled());
  });

  it('FE-MOB-PHOTOPROV-012: a passing test flips the badge to Connected and toasts', async () => {
    const user = userEvent.setup();
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/addons/immich/test', async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ connected: true });
      }),
    );
    seedProviders([immich]);
    render(<><ToastContainer /><MPhotoProvidersSection /></>);

    await screen.findByDisplayValue('https://photos.example.com');
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(await screen.findByText('Connected to Immich')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    // The test posts the form as it stands, not the persisted settings.
    expect(payload).toEqual({ url: 'https://photos.example.com', skip_ssl: false });
  });

  it('FE-MOB-PHOTOPROV-013: a test answering connected:false surfaces the server error text', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/addons/immich/test', () => HttpResponse.json({ connected: false, error: 'Auth failed' })));
    seedProviders([immich]);
    render(<><ToastContainer /><MPhotoProvidersSection /></>);

    await screen.findByText('Immich');
    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(await screen.findByText('Could not connect to Immich: Auth failed')).toBeInTheDocument();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-014: a failing test request toasts the generic connection error', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/addons/immich/test', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    seedProviders([immich]);
    render(<><ToastContainer /><MPhotoProvidersSection /></>);

    await screen.findByText('Immich');
    const test = screen.getByRole('button', { name: 'Test' });
    await user.click(test);

    expect(await screen.findByText('Could not connect to Immich')).toBeInTheDocument();
    await waitFor(() => expect(test).toBeEnabled());
  });

  it('FE-MOB-PHOTOPROV-015: a provider with only test_get falls back to the GET route and cannot be saved', async () => {
    const user = userEvent.setup();
    let getCalled = false;
    server.use(
      http.get('/api/addons/piwigo/test', () => {
        getCalled = true;
        return HttpResponse.json({ connected: true });
      }),
    );
    seedProviders([piwigo]);
    render(<MPhotoProvidersSection />);

    await screen.findByText('Piwigo');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Test' }));

    await waitFor(() => expect(getCalled).toBe(true));
    expect(await screen.findByText('Connected')).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-016: config entries of the wrong type leave both actions disabled', async () => {
    seedProviders([bare]);
    render(<MPhotoProvidersSection />);

    // No name → the card falls back to the addon id.
    await screen.findByText('bare');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('FE-MOB-PHOTOPROV-017: a failing settings load leaves the fields empty instead of crashing', async () => {
    server.use(
      http.get('/api/addons/immich/settings', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
      http.get('/api/addons/immich/status', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );
    seedProviders([immich]);
    render(<MPhotoProvidersSection />);

    await screen.findByText('Immich');
    expect(screen.getByPlaceholderText('https://immich.example.com')).toHaveValue('');
    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
  });

  it('FE-MOB-PHOTOPROV-018: the checkbox toggle flips both ways', async () => {
    const user = userEvent.setup();
    seedProviders([immich]);
    render(<MPhotoProvidersSection />);

    await screen.findByText('Immich');
    const toggle = screen.getByRole('switch', { name: 'Skip SSL certificate verification' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
