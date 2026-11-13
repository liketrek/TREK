/**
 * FE-DAWARICH-SETTINGS-001 to FE-DAWARICH-SETTINGS-018: the desktop
 * Settings -> Integrations -> Dawarich card.
 *
 * The card is markup over `useDawarichConnection`, so it is driven here the way
 * the AirTrail card next to it is driven: the real hook, the real axios client,
 * MSW answering the four endpoints. A test that handed the section a fake state
 * object would pin the JSX and nothing else, and the things that actually break
 * on this surface are round trips: what leaves in the PUT body, what the card
 * believes after the answer comes back.
 *
 * What is worth pinning, and what breaks if it regresses:
 *
 *  - **The key is never prefilled.** The server answers with a mask, never the
 *    stored key, and the field stays empty; the mask is only a placeholder. If
 *    the field were ever bound to the masked value, saving would send the
 *    bullets as the new key and lock the user out of their own instance.
 *  - **Blank key means "keep the stored one".** A connected instance must save a
 *    changed URL or a changed toggle without the user digging their key out
 *    again, so `apiKey` is absent from the body, not an empty string, which the
 *    server would read as "clear it".
 *  - **`canSave`.** An address alone is not a connection: saving needs either an
 *    existing connection or a typed key. And nothing may be saved while the card
 *    is still reading the settings it is about to overwrite.
 *  - **The status block**, which is the part of this card that earns its space.
 *    A connection to somebody else's server fails in ways the owner can act on
 *    (a rejected key, a certificate, a Dawarich too old for half the endpoints),
 *    and every one of those reasons reaches the reader through this one block.
 *    Each branch of it (probe message, never-synced vs. last-synced, the partial
 *    suffix, the stored error, the server version, the missing-capability list)
 *    is pinned, because a silent one turns "not connected" into a support ticket.
 *  - **The capability list's `tracks || points` rule.** The recorded route can
 *    come from either endpoint, so only an instance offering neither is missing
 *    it. Reporting "recorded route" as missing on an instance that serves points
 *    would tell the user to upgrade for something they already have.
 *
 * Toasts are asserted through a mocked `useToast` rather than a rendered
 * container: two of them repeat the sentence the status block already shows, and
 * a duplicated string makes every `getByText` in this file ambiguous.
 */
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DawarichCapabilities } from '@trek/shared';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores } from '../../../tests/helpers/store';
import DawarichConnectionSection from './DawarichConnectionSection';

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
vi.mock('../shared/Toast', () => ({
  useToast: () => toast,
  default: () => toast,
  ToastContainer: () => null,
}));

const SETTINGS_URL = '/api/integrations/dawarich/settings';
const TEST_URL = '/api/integrations/dawarich/test';
const SYNC_URL = '/api/integrations/dawarich/sync';

/** The desktop card renders this exact placeholder in place of a stored key. */
const MASK = '••••••••';

interface SavedBody {
  url: string;
  apiKey?: string;
  allowInsecureTls?: boolean;
  syncEnabled?: boolean;
}

/** A Dawarich that answers everything TREK knows how to ask for. */
const CAPS_ALL: DawarichCapabilities = {
  visits: true,
  tracks: true,
  points: true,
  locations: true,
  visitedCities: true,
  visitUpdatedAt: true,
  visitCountryCode: true,
  serverVersion: '1.14.4',
  probedAt: '2026-09-12T09:00:00.000Z',
};

function caps(over: Partial<DawarichCapabilities> = {}): DawarichCapabilities {
  return { ...CAPS_ALL, ...over };
}

/**
 * The stored connection, as the GET answers it. Mutable because saving and
 * disconnecting re-read it: the card's post-write state comes from this second
 * read, not from the write's own answer, so the stub has to behave like a store
 * rather than a fixture.
 */
let stored: Record<string, unknown>;

const DISCONNECTED = {
  url: '',
  apiKeyMasked: '',
  allowInsecureTls: false,
  syncEnabled: true,
  connected: false,
  lastSyncAt: null,
  lastSyncState: 'never',
  lastSyncError: null,
  capabilities: null,
};

const CONNECTED = {
  ...DISCONNECTED,
  url: 'https://dawarich.example.com',
  apiKeyMasked: MASK,
  connected: true,
  capabilities: CAPS_ALL,
};

function stubSettings(over: Record<string, unknown> = {}): void {
  stored = { ...DISCONNECTED, ...over };
  server.use(http.get(SETTINGS_URL, () => HttpResponse.json(stored)));
}

/** A promise the test releases by hand, to observe an in-flight request. */
function deferred(): { promise: Promise<void>; release: () => void } {
  let release!: () => void;
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
}

function renderSection() {
  return render(<DawarichConnectionSection />);
}

/** Both switches carry their label as an aria-label, so the role query reaches them. */
function toggle(label: string): HTMLElement {
  return screen.getByRole('button', { name: label });
}

const SYNC_TOGGLE = 'Check for new stays automatically';
const TLS_TOGGLE = 'Allow self-signed certificate';

function urlField(): HTMLElement {
  return screen.getByLabelText('Instance address');
}

function keyField(): HTMLElement {
  return screen.getByLabelText('API key');
}

function saveButton(): HTMLElement {
  return screen.getByRole('button', { name: /^Save$/ });
}

function testButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Test connection' });
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  stubSettings();
});

describe('DawarichConnectionSection', () => {
  it('FE-DAWARICH-SETTINGS-001: an unconfigured card is empty, disconnected, blocked and shows no status block', async () => {
    // An unconfigured card looks identical before and after its settings land,
    // so there is no rendered marker to wait on. Counting the read is what
    // makes the assertions below about a hydrated card rather than first paint.
    const read = vi.fn();
    server.use(
      http.get(SETTINGS_URL, () => {
        read();
        return HttpResponse.json(stored);
      }),
    );
    renderSection();

    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(testButton()).toBeDisabled();
    expect(saveButton()).toBeDisabled();
    expect(urlField()).toHaveValue('');
    expect(keyField()).toHaveValue('');
    // No connection means no key to hide, so the field says what it wants.
    expect(keyField()).toHaveAttribute('placeholder', 'Paste your Dawarich API key');
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check now' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
    // Nothing to report yet: the block would be an empty grey box.
    expect(screen.queryByText('Not checked yet')).toBeNull();
  });

  it('FE-DAWARICH-SETTINGS-002: a stored connection hydrates the fields, the toggles, the badge and the status block', async () => {
    stubSettings({
      ...CONNECTED,
      allowInsecureTls: true,
      syncEnabled: false,
      lastSyncAt: '2026-09-12T08:30:00.000Z',
      lastSyncState: 'ok',
    });
    renderSection();

    expect(await screen.findByDisplayValue('https://dawarich.example.com')).toBeInTheDocument();
    expect(toggle(TLS_TOGGLE)).toHaveAttribute('aria-pressed', 'true');
    expect(toggle(SYNC_TOGGLE)).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Connected')).toBeInTheDocument();
    // The stored key is hidden behind the placeholder and never put in the field.
    expect(keyField()).toHaveAttribute('placeholder', MASK);
    expect(keyField()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Check now' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeEnabled();
    expect(screen.getByText(/^Last checked /)).toBeInTheDocument();
    expect(screen.getByText('Dawarich 1.14.4')).toBeInTheDocument();
    // Everything answered, so there is nothing to warn about.
    expect(screen.queryByText(/does not offer/)).toBeNull();
    expect(screen.queryByText('some trips could not be read')).toBeNull();
  });

  it('FE-DAWARICH-SETTINGS-003: a failed read of our own settings leaves an empty card rather than a false verdict', async () => {
    // Same as -001: a failed read changes nothing on screen, so the request
    // itself is the only proof the card got as far as failing.
    const read = vi.fn();
    server.use(
      http.get(SETTINGS_URL, () => {
        read();
        return HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );
    renderSection();

    // Losing our own settings is a TREK problem: the card must not claim the
    // user's instance is unreachable, and must not stay locked in `loading`.
    await waitFor(() => expect(read).toHaveBeenCalled());
    await waitFor(() => expect(testButton()).toBeDisabled());
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(urlField()).toHaveValue('');
    expect(screen.queryByText('Not checked yet')).toBeNull();
  });

  it('FE-DAWARICH-SETTINGS-004: nothing can be saved while the stored settings are still being read', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    server.use(
      http.get(SETTINGS_URL, async () => {
        await gate.promise;
        return HttpResponse.json({ ...CONNECTED, connected: false });
      }),
    );
    renderSection();

    await user.type(urlField(), 'https://typed.example.com');
    await user.type(keyField(), 'typed-key');
    // URL and key are both there, so only the in-flight read is holding Save.
    expect(saveButton()).toBeDisabled();
    // And the same lock on Test. With an address typed this is the one place
    // the `loading` term of that condition is visible at all. Everywhere else
    // the empty-address term hides it.
    expect(testButton()).toBeDisabled();

    gate.release();
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it('FE-DAWARICH-SETTINGS-005: a stored address that never connected still needs a typed key before it can be saved', async () => {
    const user = userEvent.setup();
    // The state a failed first attempt leaves behind: the address was stored,
    // the key was not accepted, so there is no connection to fall back on.
    stubSettings({ url: 'https://dawarich.example.com', connected: false });
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    // The address is enough to probe with, but not enough to store. Waited for
    // rather than read straight off the render that showed the address: the
    // hook drops the `loading` lock in a later tick than it sets the fields.
    await waitFor(() => expect(testButton()).toBeEnabled());
    expect(saveButton()).toBeDisabled();

    await user.type(keyField(), 'key-123');
    expect(saveButton()).toBeEnabled();
  });

  it('FE-DAWARICH-SETTINGS-006: a connected instance saves without retyping the key, and typing one drops the mask', async () => {
    const user = userEvent.setup();
    let body: SavedBody | undefined;
    stubSettings(CONNECTED);
    server.use(
      http.put(SETTINGS_URL, async ({ request }) => {
        body = (await request.json()) as SavedBody;
        return HttpResponse.json({ success: true });
      }),
    );
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    // A click on a disabled button is swallowed rather than failing, so every
    // click below waits for the `loading` lock to lift first.
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());

    // No `apiKey` key at all: an empty string would read as "clear the key".
    await waitFor(() =>
      expect(body).toEqual({
        url: 'https://dawarich.example.com',
        allowInsecureTls: false,
        syncEnabled: true,
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Dawarich connection saved'));

    await user.type(keyField(), 'replacement');
    // Once there is something to send, the mask stops pretending the field is full.
    expect(keyField()).toHaveAttribute('placeholder', 'Paste your Dawarich API key');
  });

  it('FE-DAWARICH-SETTINGS-007: the save sends the trimmed address, the typed key and both toggles, then clears the key field', async () => {
    const user = userEvent.setup();
    let body: SavedBody | undefined;
    // Auto-sync stored as off, so the switch flipping to on is the proof that
    // the settings read landed before anything is typed: the effect that
    // hydrates the card also rewrites the URL field.
    stubSettings({ syncEnabled: false });
    server.use(
      http.put(SETTINGS_URL, async ({ request }) => {
        body = (await request.json()) as SavedBody;
        // The card believes the re-read, not the write's own answer.
        stored = { ...stored, url: body.url, connected: true, capabilities: CAPS_ALL };
        return HttpResponse.json({ success: true });
      }),
    );
    renderSection();

    await waitFor(() => expect(toggle(SYNC_TOGGLE)).toHaveAttribute('aria-pressed', 'false'));
    // Both fields are padded, but only the key actually pins `trim()`: jsdom
    // runs the value-sanitisation algorithm for input[type=url], which strips
    // the surrounding whitespace before the hook ever sees the address. The
    // password field has no such algorithm, so the space it keeps is real.
    await user.type(urlField(), '  https://dawarich.example.com  ');
    await user.type(keyField(), ' key-123 ');
    await user.click(toggle(SYNC_TOGGLE));
    await user.click(toggle(TLS_TOGGLE));
    await user.click(saveButton());

    // Both switches send what is on screen, not what was stored.
    await waitFor(() =>
      expect(body).toEqual({
        url: 'https://dawarich.example.com',
        allowInsecureTls: true,
        syncEnabled: true,
        apiKey: 'key-123',
      }),
    );
    expect(toggle(SYNC_TOGGLE)).toHaveAttribute('aria-pressed', 'true');
    expect(toggle(TLS_TOGGLE)).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
    expect(keyField()).toHaveValue('');
    expect(keyField()).toHaveAttribute('placeholder', MASK);
  });

  it('FE-DAWARICH-SETTINGS-008: an in-flight save locks both Save and Disconnect', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    stubSettings(CONNECTED);
    server.use(
      http.put(SETTINGS_URL, async () => {
        await gate.promise;
        return HttpResponse.json({ success: true });
      }),
    );
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());

    await waitFor(() => expect(saveButton()).toBeDisabled());
    // Disconnecting mid-save would race the write it is trying to undo.
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeDisabled();

    gate.release();
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it('FE-DAWARICH-SETTINGS-009: a rejected save reports the server reason code as a sentence, not as a code', async () => {
    const user = userEvent.setup();
    stubSettings(CONNECTED);
    server.use(
      http.put(SETTINGS_URL, () =>
        HttpResponse.json({ code: 'unauthorized', error: 'Unauthorized' }, { status: 400 }),
      ),
    );
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());

    // The code wins over the server's English prose, so a German install reads German.
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Dawarich rejected the API key.'));
    // A refused save leaves the card usable so the reader can correct the key.
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it('FE-DAWARICH-SETTINGS-010: a probe shows a spinner while it runs, then reports the stay count and flips the badge', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    let body: Partial<SavedBody> | undefined;
    stubSettings({ url: 'https://dawarich.example.com' });
    server.use(
      http.post(TEST_URL, async ({ request }) => {
        body = (await request.json()) as Partial<SavedBody>;
        await gate.promise;
        return HttpResponse.json({ connected: true, visitCount: 12, capabilities: CAPS_ALL });
      }),
    );
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    await waitFor(() => expect(testButton()).toBeEnabled());
    await user.type(keyField(), 'probe-key');
    await user.click(testButton());

    await waitFor(() => expect(testButton()).toBeDisabled());
    expect(testButton().querySelector('.animate-spin')).not.toBeNull();

    gate.release();
    expect(await screen.findByText('Connected. 12 stays found in the last 30 days.')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    // The probe uses what is on screen, not what is stored. That is the point of it.
    expect(body).toEqual({ url: 'https://dawarich.example.com', allowInsecureTls: false, apiKey: 'probe-key' });
    expect(screen.getByText('Dawarich 1.14.4')).toBeInTheDocument();
  });

  it('FE-DAWARICH-SETTINGS-011: a refused probe keeps the badge off and puts the reason plus the detail in the status block', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://dawarich.example.com' });
    server.use(
      http.post(TEST_URL, () =>
        HttpResponse.json({
          connected: false,
          error: 'unreachable',
          errorDetail: 'self-signed certificate in chain',
        }),
      ),
    );
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    await waitFor(() => expect(testButton()).toBeEnabled());
    await user.click(testButton());

    // The block gets the detail, the toast stays one line: a self-hoster needs
    // to know it was the certificate and not the host being down.
    expect(
      await screen.findByText('TREK could not reach that address. (self-signed certificate in chain)'),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('TREK could not reach that address.');
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('FE-DAWARICH-SETTINGS-012: a probe that never reaches the server falls back to the generic sentence', async () => {
    const user = userEvent.setup();
    stubSettings({ url: 'https://dawarich.example.com' });
    server.use(http.post(TEST_URL, () => HttpResponse.json({}, { status: 500 })));
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    await waitFor(() => expect(testButton()).toBeEnabled());
    await user.click(testButton());

    // No code and no prose from the server: exactly one sentence, no empty parentheses.
    expect(await screen.findByText('Could not reach Dawarich.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Could not reach Dawarich.');
  });

  it('FE-DAWARICH-SETTINGS-013: Check now spins while it runs and replaces "never" with a timestamp', async () => {
    const user = userEvent.setup();
    const gate = deferred();
    stubSettings(CONNECTED);
    server.use(
      http.post(SYNC_URL, async () => {
        await gate.promise;
        return HttpResponse.json({ state: 'ok', created: 3, updated: 0, missing: 0 });
      }),
    );
    renderSection();

    expect(await screen.findByText('Not checked yet')).toBeInTheDocument();
    const syncBtn = screen.getByRole('button', { name: 'Check now' });
    await user.click(syncBtn);

    await waitFor(() => expect(syncBtn).toBeDisabled());
    expect(syncBtn.querySelector('.animate-spin')).not.toBeNull();

    gate.release();
    expect(await screen.findByText(/^Last checked /)).toBeInTheDocument();
    expect(screen.queryByText('Not checked yet')).toBeNull();
    // Said as a count: a sync that found nothing and one that failed silently
    // look identical if the toast only says "done".
    expect(toast.success).toHaveBeenCalledWith('3 new stays found');
  });

  it('FE-DAWARICH-SETTINGS-014: a sync that is already running reports itself and invents no result', async () => {
    const user = userEvent.setup();
    stubSettings(CONNECTED);
    server.use(
      http.post(SYNC_URL, () =>
        HttpResponse.json({ state: 'ok', created: 0, updated: 0, missing: 0, alreadyRunning: true }),
      ),
    );
    renderSection();

    await screen.findByText('Not checked yet');
    await user.click(screen.getByRole('button', { name: 'Check now' }));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('A check is already running'));
    // "0 new stays" would be a result, and there is no result yet.
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText('Not checked yet')).toBeInTheDocument();
  });

  it('FE-DAWARICH-SETTINGS-015: a failed sync falls back to the generic message and leaves the last timestamp alone', async () => {
    const user = userEvent.setup();
    stubSettings({ ...CONNECTED, lastSyncAt: '2026-09-12T08:30:00.000Z', lastSyncState: 'ok' });
    server.use(http.post(SYNC_URL, () => HttpResponse.json({}, { status: 502 })));
    renderSection();

    await screen.findByText(/^Last checked /);
    await user.click(screen.getByRole('button', { name: 'Check now' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not read Dawarich'));
    // A failed attempt is not a check: the timestamp still belongs to the last real one.
    expect(screen.getByText(/^Last checked /)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Check now' })).toBeEnabled());
  });

  it('FE-DAWARICH-SETTINGS-016: a partial sync on an old instance shows the suffix, the stored reason and every missing capability', async () => {
    stubSettings({
      ...CONNECTED,
      lastSyncAt: '2026-09-12T08:30:00.000Z',
      lastSyncState: 'partial',
      lastSyncError: 'unauthorized',
      capabilities: caps({
        visits: false,
        tracks: false,
        points: false,
        locations: false,
        visitedCities: false,
        serverVersion: null,
      }),
    });
    renderSection();

    expect(await screen.findByText(/some trips could not be read/)).toBeInTheDocument();
    expect(screen.getByText('Dawarich rejected the API key.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This Dawarich version does not offer: stays, recorded route, wishlist matching, countries and cities.',
      ),
    ).toBeInTheDocument();
    // An instance that does not report its version gets no version line at all,
    // rather than a line with a blank in it. (The section heading is the bare
    // word "Dawarich", so the version line is the one followed by a digit.)
    expect(screen.queryByText(/^Dawarich \d/)).toBeNull();
  });

  it('FE-DAWARICH-SETTINGS-017: an instance serving points but not tracks is not told its recorded route is missing', async () => {
    stubSettings({
      ...CONNECTED,
      capabilities: caps({ tracks: false, points: true, visitedCities: false, serverVersion: '1.15.0' }),
    });
    renderSection();

    // Either endpoint can draw the route, so only the Atlas feed is actually gone.
    expect(await screen.findByText('This Dawarich version does not offer: countries and cities.')).toBeInTheDocument();
    expect(screen.getByText('Dawarich 1.15.0')).toBeInTheDocument();
  });

  it('FE-DAWARICH-SETTINGS-018: disconnecting empties the card back to its unconfigured state', async () => {
    const user = userEvent.setup();
    stubSettings({ ...CONNECTED, lastSyncAt: '2026-09-12T08:30:00.000Z', lastSyncState: 'ok' });
    server.use(http.delete(SETTINGS_URL, () => HttpResponse.json({ success: true })));
    renderSection();

    await screen.findByDisplayValue('https://dawarich.example.com');
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Dawarich disconnected');
    expect(urlField()).toHaveValue('');
    expect(keyField()).toHaveAttribute('placeholder', 'Paste your Dawarich API key');
    expect(screen.queryByRole('button', { name: 'Check now' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
    // Nothing left to report, so the whole status block goes with it.
    expect(screen.queryByText(/^Last checked /)).toBeNull();
    expect(screen.queryByText('Not checked yet')).toBeNull();
    expect(screen.queryByText('Dawarich 1.14.4')).toBeNull();
  });
});
