import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MASKED_SETTING_VALUE, type StorageAdminState } from '@trek/shared';
import { server } from '../../../helpers/msw/server';
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminStoragePanel from '../../../../src/mobile/screens/admin/MAdminStoragePanel';

function baseState(overrides: Partial<StorageAdminState> = {}): StorageAdminState {
  return {
    backends: [
      { name: 'uploads-local', type: 'local', source: 'built-in', options: { root: '/data/uploads' }, categories: ['files', 'journey', 'covers', 'avatars', 'photos-google', 'photos-trek'] },
      { name: 'backups-local', type: 'local', source: 'built-in', options: { root: '/data/backups' }, categories: ['backups'] },
      {
        name: 'off-box', type: 's3', source: 'settings',
        options: { endpoint: 'http://127.0.0.1:9000', bucket: 'trek', accessKeyId: 'ak', secretAccessKey: MASKED_SETTING_VALUE, region: 'us-east-1', keyPrefix: '', retries: 1, timeoutMs: 30000 },
        categories: [],
      },
    ],
    categories: {
      files: { backend: 'uploads-local', source: 'default' },
      journey: { backend: 'uploads-local', source: 'default' },
      covers: { backend: 'uploads-local', source: 'default' },
      avatars: { backend: 'uploads-local', source: 'default' },
      places: { backend: 'uploads-local', source: 'default' },
      'photos-google': { backend: 'uploads-local', source: 'default' },
      'photos-trek': { backend: 'uploads-local', source: 'default' },
      backups: { backend: 'backups-local', source: 'default' },
    },
    health: { replicaFailures: [] },
    seedFilePresent: false,
    usage: null,
    backfills: [],
    migrations: [],
    ...overrides,
  };
}

function mirroredState(): StorageAdminState {
  const state = baseState();
  state.backends.push({
    name: 'mirror', type: 'mirror', source: 'settings',
    options: { primary: 'backups-local', replicas: ['off-box'] }, categories: ['backups'],
  });
  state.categories.backups = { backend: 'mirror', source: 'settings' };
  return state;
}

async function renderPanel(state: StorageAdminState = baseState()) {
  server.use(http.get('/api/admin/storage', () => HttpResponse.json(state)));
  render(
    <>
      <ToastContainer />
      <MAdminStoragePanel />
    </>,
  );
  await waitFor(() => expect(screen.getByText('Backends')).toBeInTheDocument());
}

describe('MAdminStoragePanel', () => {
  it('FE-MOB-MSTOR-001: renders every backend with type and source, env rows read-only', async () => {
    await renderPanel();
    const row = screen.getByTestId('m-storage-backend-off-box');
    expect(within(row).getByText('S3')).toBeInTheDocument();
    expect(within(row).getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('No replica failures recorded.')).toBeInTheDocument();
  });

  it('FE-MOB-MSTOR-002: reassigning a category via the picker sheet warns and saves through one PUT', async () => {
    let putBody: unknown;
    await renderPanel();
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(screen.getByTestId('m-storage-category-files')).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'off-box' })); // picker option; selecting closes
    expect(screen.getByText(/Existing objects do not move/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    expect((putBody as { categories: Record<string, string> }).categories.files).toBe('off-box');
  });

  it('FE-MOB-MSTOR-003: a typed plaintext secret keeps Apply offered (no encryption-key gate)', async () => {
    await renderPanel();
    fireEvent.click(within(screen.getByTestId('m-storage-backend-off-box')).getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('us-east-1'), { target: { value: 'eu-west-1' } }); // sanity: form is open
    const secret = screen.getByDisplayValue(MASKED_SETTING_VALUE);
    fireEvent.change(secret, { target: { value: 'sk-new' } });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('FE-MOB-MSTOR-004: a 400 renders the server message verbatim', async () => {
    await renderPanel();
    server.use(http.put('/api/admin/storage', () => HttpResponse.json({ error: 'registry says no' }, { status: 400 })));
    fireEvent.click(within(screen.getByTestId('m-storage-category-files')).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'off-box' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('registry says no')).toBeInTheDocument();
  });

  it('FE-MOB-MSTOR-005: renaming onto another existing backend warns and blocks Apply', async () => {
    await renderPanel();
    fireEvent.click(within(screen.getByTestId('m-storage-backend-off-box')).getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getByDisplayValue('off-box');
    fireEvent.change(nameInput, { target: { value: 'uploads-local' } });
    expect(screen.getByText(/A backend named uploads-local already exists/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('FE-MOB-MSTOR-006: mirrors fold — no mirror card, primary and replica decorated', async () => {
    await renderPanel(mirroredState());
    expect(screen.queryByTestId('m-storage-backend-mirror')).not.toBeInTheDocument();
    const primary = screen.getByTestId('m-storage-backend-backups-local');
    expect(within(primary).getByText('Mirrored to: off-box')).toBeInTheDocument();
    const replica = screen.getByTestId('m-storage-backend-off-box');
    expect(within(replica).getByText('Replica of: backups-local')).toBeInTheDocument();
  });

  it('FE-MOB-MSTOR-007: toggling a target on a primary synthesizes the mirror in the PUT', async () => {
    let putBody: unknown;
    await renderPanel();
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(screen.getByTestId('m-storage-backend-backups-local')).getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('switch', { name: 'off-box' }));
    expect(screen.getByText(/slows every upload/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const body = putBody as { backends: Array<{ name: string; type: string; options: unknown }>; categories: Record<string, string> };
    expect(body.backends.find((b) => b.name === 'backups-local-mirror')!.options).toEqual({
      primary: 'backups-local', replicas: ['off-box'],
    });
    expect(body.categories.backups).toBe('backups-local-mirror');
  });

  it('FE-MOB-MSTOR-008: the category picker deals in primaries and warns on cache categories', async () => {
    let putBody: unknown;
    await renderPanel(mirroredState());
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(mirroredState());
      }),
    );
    fireEvent.click(within(screen.getByTestId('m-storage-category-places')).getByRole('button'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Place images' })).getByRole('button', { name: 'backups-local' })); // picker option = primary name
    // getByText(/re-fetchable/) is now ambiguous — the photos-google/photos-trek category
    // descriptions also say "re-fetchable". The cache warning is the only role="note" on
    // screen here (the mirror-targets latency note only renders while a form is open).
    expect(screen.getByRole('note')).toHaveTextContent(/re-fetchable/);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    expect((putBody as { categories: Record<string, string> }).categories.places).toBe('mirror');
  });

  it('FE-MOB-MSTOR-009: category rows show display name, id badge and description; photos is gone', async () => {
    await renderPanel();
    const files = screen.getByTestId('m-storage-category-files');
    // The testid wraps only the select row — assert name/badge/description through the field around it.
    expect(screen.getByText('Trip documents')).toBeInTheDocument();
    expect(screen.getByText('files')).toBeInTheDocument();
    expect(screen.getByText(/tickets, PDFs, booking confirmations/)).toBeInTheDocument();
    expect(within(files).getByRole('button')).toBeInTheDocument(); // row still tappable
    expect(screen.queryByTestId('m-storage-category-photos')).not.toBeInTheDocument();
  });

  it('FE-MOB-MSTOR-010: usage renders on rows and the header; never-computed shows the compute prompt', async () => {
    const usage = {
      computedAt: Date.now() - 3_600_000,
      categories: Object.fromEntries(
        (['files', 'journey', 'covers', 'avatars', 'places', 'photos-google', 'photos-trek', 'backups'] as const).map(
          (c) => [c, { objects: 2, bytes: 1024 * 1024 }],
        ),
      ),
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    usage.categories.files = { objects: 3, bytes: 2048 };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    expect(screen.getByText(/Usage computed/)).toBeInTheDocument();
    expect(within(screen.getByTestId('m-storage-backend-backups-local')).getByText(/2 objects · 1\.0 MB/)).toBeInTheDocument();
    // Per-category usage line (the testid wraps only the select row, so assert by text).
    expect(screen.getByText('3 objects · 2.0 KB')).toBeInTheDocument();
  });

  it('FE-MOB-MSTOR-011: Sync now → running → done via the test poll', async () => {
    let polls = 0;
    await renderPanel(mirroredState());
    server.use(
      http.post('/api/admin/storage/backends/mirror/backfill', () => HttpResponse.json({ started: true })),
      http.get('/api/admin/storage', () => {
        polls += 1;
        const state = mirroredState();
        (state as StorageAdminState).backfills =
          polls < 3
            ? [{ backend: 'mirror', status: 'running', done: 1, total: 4, copied: 1, skipped: 0, failed: 0, startedAt: 1 }]
            : [{ backend: 'mirror', status: 'done', done: 4, total: 4, copied: 4, skipped: 0, failed: 0, startedAt: 1, finishedAt: 2 }];
        return HttpResponse.json(state);
      }),
    );
    const row = screen.getByTestId('m-storage-backend-backups-local');
    fireEvent.click(within(row).getByRole('button', { name: 'Sync now' }));
    await within(row).findByText(/Syncing… 1\/4/);
    await within(row).findByText(/Sync finished: 4 copied, 0 failed/);
  });

  it('FE-MOB-MSTOR-012: a save that added targets raises the sync prompt', async () => {
    await renderPanel();
    server.use(http.put('/api/admin/storage', async () => HttpResponse.json(mirroredState())));
    fireEvent.click(within(screen.getByTestId('m-storage-backend-backups-local')).getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('switch', { name: 'off-box' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText(/Existing objects are not replicated yet/);
  });
});
