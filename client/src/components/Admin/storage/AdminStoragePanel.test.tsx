import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { MASKED_SETTING_VALUE, type StorageAdminState, type StorageCategory, type StorageConfig } from '@trek/shared';
import { server } from '../../../../tests/helpers/msw/server';
import { fireEvent, render, screen, waitFor, within } from '../../../../tests/helpers/render';
import { ToastContainer } from '../../shared/Toast';
import AdminStoragePanel from './AdminStoragePanel';

const S3_MASKED = {
  endpoint: 'http://127.0.0.1:9000', bucket: 'trek', accessKeyId: 'ak',
  secretAccessKey: MASKED_SETTING_VALUE, region: 'us-east-1', keyPrefix: '', retries: 1, timeoutMs: 30000,
};

function baseState(overrides: Partial<StorageAdminState> = {}): StorageAdminState {
  return {
    backends: [
      { name: 'uploads-local', type: 'local', source: 'built-in', options: { root: '/data/uploads' }, categories: ['files', 'journey', 'covers', 'avatars', 'photos-google', 'photos-trek'] },
      { name: 'backups-local', type: 'local', source: 'built-in', options: { root: '/data/backups' }, categories: ['backups'] },
      { name: 'place-photos-local', type: 'local', source: 'env', options: { root: '/photos' }, categories: ['places'] },
      { name: 'off-box', type: 's3', source: 'settings', options: S3_MASKED, categories: ['covers'] },
      // Unassigned on purpose: the only row the mirror-target picker may
      // offer, since a backend that serves a category can never also be a
      // replica (the sync sweep would delete that category's objects).
      { name: 'cold-store', type: 'local', source: 'settings', options: { root: '/data/cold' }, categories: [] },
    ],
    categories: {
      files: { backend: 'uploads-local', source: 'default' },
      journey: { backend: 'uploads-local', source: 'default' },
      covers: { backend: 'off-box', source: 'settings' },
      avatars: { backend: 'uploads-local', source: 'default' },
      places: { backend: 'place-photos-local', source: 'default' },
      'photos-google': { backend: 'uploads-local', source: 'default' },
      'photos-trek': { backend: 'uploads-local', source: 'default' },
      backups: { backend: 'backups-local', source: 'default' },
    },
    health: { replicaFailures: [] },
    seedFilePresent: false,
    usage: null,
    backfills: [],
    migrations: [],
    version: 0,
    configError: null,
    ...overrides,
  };
}

function mirroredState(): StorageAdminState {
  const state = baseState();
  // off-box is this fixture's REPLICA, so it must not also be a direct
  // category target — the server refuses that config outright (a backups
  // sweep would delete the covers objects), so covers goes back to its
  // default. cold-store stays free as the second offerable target.
  state.backends.find((b) => b.name === 'off-box')!.categories = [];
  state.backends.find((b) => b.name === 'uploads-local')!.categories.push('covers');
  state.categories.covers = { backend: 'uploads-local', source: 'default' };
  state.backends.push({
    name: 'mirror', type: 'mirror', source: 'settings',
    options: { primary: 'backups-local', replicas: ['off-box'] }, categories: ['backups'],
  });
  state.categories.backups = { backend: 'mirror', source: 'settings' };
  return state;
}

function stubGet(state: StorageAdminState) {
  server.use(http.get('/api/admin/storage', () => HttpResponse.json(state)));
}

async function renderPanel(state: StorageAdminState = baseState()) {
  stubGet(state);
  render(
    <>
      <ToastContainer />
      <AdminStoragePanel />
    </>,
  );
  await waitFor(() => expect(screen.getByText('Backends')).toBeInTheDocument());
}

const backendRow = (name: string) => screen.getByTestId(`storage-backend-${name}`);
const categoryRow = (category: string) => screen.getByTestId(`storage-category-${category}`);

describe('AdminStoragePanel', () => {
  beforeEach(() => {
    // Each test re-stubs GET; PUT/POST are stubbed where used.
  });

  it('FE-ADMIN-STOR-001: renders every backend with type badge, source tag and its categories', async () => {
    await renderPanel();
    const uploads = backendRow('uploads-local');
    expect(within(uploads).getByText('Local')).toBeInTheDocument();
    expect(within(uploads).getByText('Built-in')).toBeInTheDocument();
    expect(within(uploads).getByText(/Used by: Trip documents/)).toBeInTheDocument();
    const env = backendRow('place-photos-local');
    expect(within(env).getByText('Environment')).toBeInTheDocument();
    expect(within(env).getByText(/read-only/)).toBeInTheDocument();
    expect(within(env).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(env).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    const offBox = backendRow('off-box');
    expect(within(offBox).getByText('S3')).toBeInTheDocument();
    expect(within(offBox).getByText('Settings')).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-002: the mask echoes through edit → save untouched (no-op by contract)', async () => {
    let putBody: unknown;
    await renderPanel();
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(backendRow('off-box')).getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText(/Secret access key/)).toHaveValue(MASKED_SETTING_VALUE);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const body = putBody as StorageConfig;
    const offBox = body.backends.find((b) => b.name === 'off-box')!;
    expect((offBox.options as Record<string, unknown>).secretAccessKey).toBe(MASKED_SETTING_VALUE);
  });

  it('FE-ADMIN-STOR-003: the PUT carries only the settings-owned document', async () => {
    let putBody: unknown;
    await renderPanel();
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    // Touch something to enable Save: reassign the files category.
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    // Usage was never scanned (baseState().usage === null) — the migrate
    // prompt fires; this test is about PUT shape, not the prompt, so route
    // new writes only (today's save behavior, unstripped).
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Just route new writes' }));
    await screen.findByText('Storage configuration saved');
    const body = putBody as StorageConfig;
    expect(body.backends.map((b) => b.name)).toEqual(['off-box', 'cold-store']); // built-ins/env never in the body
    expect(body.categories).toEqual({ covers: 'off-box', files: 'off-box' });
  });

  it('FE-ADMIN-STOR-004: reassigning a category shows the objects-do-not-move warning inline', async () => {
    await renderPanel();
    expect(screen.queryByText(/Existing objects do not move/)).not.toBeInTheDocument();
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    expect(within(categoryRow('files')).getByText(/Existing objects do not move/)).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-005: a 400 renders the server message verbatim next to Save', async () => {
    await renderPanel();
    const registryError =
      "backend 'off-box' has a plaintext secret 'secretAccessKey' but ENCRYPTION_KEY is not set — set ENCRYPTION_KEY explicitly to save credentialed storage backends (the implicit key persisted in the data directory is not accepted: it rides inside backups)";
    server.use(http.put('/api/admin/storage', () => HttpResponse.json({ error: registryError }, { status: 400 })));
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    // Usage was never scanned — the migrate prompt fires first; route new
    // writes only, matching this test's focus on the save-error rendering.
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Just route new writes' }));
    expect(await screen.findByText(registryError)).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-006: Remove pre-checks assignments in the confirm dialog, then omits the backend from the PUT', async () => {
    let putBody: unknown;
    await renderPanel();
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(backendRow('off-box')).getByRole('button', { name: 'Remove' }));
    expect(screen.getByText(/Still assigned to: Cover images/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove backend' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    expect((putBody as StorageConfig).backends.map((b) => b.name)).toEqual(['cold-store']);
  });

  it('FE-ADMIN-STOR-007: Test on a mirrored primary probes the draft primary and each replica individually (never the mirror stub), merging into one result', async () => {
    const posted: Array<{ name: string; type: string }> = [];
    await renderPanel(mirroredState());
    server.use(
      http.post('/api/admin/storage/test', async ({ request }) => {
        const body = (await request.json()) as { backend: { name: string; type: string } };
        posted.push(body.backend);
        const ok = body.backend.name === 'backups-local';
        return HttpResponse.json({
          ok,
          targets: [{ name: body.backend.name, ok, ...(ok ? {} : { error: 'connect ECONNREFUSED' }) }],
        });
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Test' }));
    await within(backendRow('backups-local')).findByText('Test failed');
    expect(within(backendRow('backups-local')).getByText(/connect ECONNREFUSED/)).toBeInTheDocument();
    // Two separate probes, each a concrete backend — never the mirror object itself.
    expect(posted.map((b) => b.name).sort()).toEqual(['backups-local', 'off-box']);
    expect(posted.every((b) => b.type !== 'mirror')).toBe(true);
  });

  it('FE-ADMIN-STOR-042: mirrored-row Test uses the DRAFT options of a target, not the saved ones (client-side mirror expansion)', async () => {
    const posted: Array<{ name: string; options: Record<string, unknown> }> = [];
    await renderPanel(mirroredState());
    server.use(
      http.post('/api/admin/storage/test', async ({ request }) => {
        const body = (await request.json()) as { backend: { name: string; options: Record<string, unknown> } };
        posted.push(body.backend);
        return HttpResponse.json({ ok: true, targets: [{ name: body.backend.name, ok: true }] });
      }),
    );
    // Edit the replica (off-box) in the draft without saving — an unsaved endpoint change.
    fireEvent.click(within(backendRow('off-box')).getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText(/Endpoint URL/), { target: { value: 'http://edited.example:9000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Test' }));
    await within(backendRow('backups-local')).findByText('Connection OK');
    const offBoxProbe = posted.find((b) => b.name === 'off-box');
    expect(offBoxProbe?.options.endpoint).toBe('http://edited.example:9000');
  });

  it('FE-ADMIN-STOR-008: the health strip lists replica failures with a relative age; all-clear otherwise', async () => {
    const now = Date.now();
    await renderPanel(
      baseState({
        health: { replicaFailures: [{ backend: 'off-box', key: 'backups/db.sqlite3', op: 'put', error: 'timeout', at: now - 120_000 }] },
      }),
    );
    expect(screen.getByText(/put of backups\/db\.sqlite3 on off-box failed: timeout/)).toBeInTheDocument();
    expect(screen.getByText(/2 minutes ago/)).toBeInTheDocument();
    expect(screen.queryByText('No replica failures recorded.')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-009: all-clear health and the seed-file note', async () => {
    await renderPanel(baseState({ seedFilePresent: true }));
    expect(screen.getByText('No replica failures recorded.')).toBeInTheDocument();
    expect(screen.getByText(/seed file is present but ignored/)).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-010: a managed-mode 403 on GET renders its body message gracefully', async () => {
    server.use(
      http.get('/api/admin/storage', () =>
        HttpResponse.json(
          { error: 'This is configured by the operator of this instance.', code: 'MANAGED_FORBIDDEN' },
          { status: 403 },
        ),
      ),
    );
    render(<AdminStoragePanel />);
    expect(await screen.findByText('This is configured by the operator of this instance.')).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-011: mirrors fold — no mirror row, primary and replica are decorated, categories union', async () => {
    await renderPanel(mirroredState());
    expect(screen.queryByTestId('storage-backend-mirror')).not.toBeInTheDocument();
    const primary = backendRow('backups-local');
    expect(within(primary).getByText('Mirrored to: off-box')).toBeInTheDocument();
    expect(within(primary).getByText(/Used by: .*Backups/)).toBeInTheDocument();
    const replica = backendRow('off-box');
    expect(within(replica).getByText('Replica of: backups-local')).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-012: checking a target on an unmirrored primary synthesizes the mirror and reroutes its categories', async () => {
    let putBody: unknown;
    await renderPanel();
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Edit' }));
    // off-box serves covers, so the picker never offers it as a replica.
    expect(screen.queryByRole('checkbox', { name: 'off-box' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'cold-store' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const body = putBody as StorageConfig;
    expect(body.backends.map((b) => b.name)).toEqual(
      expect.arrayContaining(['off-box', 'backups-local', 'backups-local-mirror']),
    );
    expect(body.backends.find((b) => b.name === 'backups-local-mirror')!.options).toEqual({
      primary: 'backups-local', replicas: ['cold-store'],
    });
    expect(body.categories.backups).toBe('backups-local-mirror'); // default-sourced category rewritten
  });

  it('FE-ADMIN-STOR-013: editing an already-mirrored primary adopts the foreign-named mirror in place', async () => {
    let putBody: unknown;
    await renderPanel(mirroredState());
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(mirroredState());
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('checkbox', { name: 'off-box' })).toBeChecked(); // initialTargets from the fold
    fireEvent.click(screen.getByRole('checkbox', { name: 'cold-store' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const mirrors = (putBody as StorageConfig).backends.filter((b) => b.type === 'mirror');
    expect(mirrors).toHaveLength(1);
    expect(mirrors[0]!.name).toBe('mirror'); // adopted, not renamed
    expect(mirrors[0]!.options).toEqual({ primary: 'backups-local', replicas: ['off-box', 'cold-store'] });
  });

  it('FE-ADMIN-STOR-048: the mirror-target picker never offers a backend that serves a category — but keeps already-selected targets visible', async () => {
    await renderPanel(mirroredState());
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Edit' }));
    // Serving rows are refused as replicas by the server (a sync sweep would
    // delete their categories' objects) — so they are never offered here.
    expect(screen.queryByRole('checkbox', { name: 'uploads-local' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'place-photos-local' })).not.toBeInTheDocument();
    // ...and never the row being edited itself, which serves backups.
    expect(screen.queryByRole('checkbox', { name: 'backups-local' })).not.toBeInTheDocument();
    // Free rows are offered; the current target stays listed so it can be unchecked.
    expect(screen.getByRole('checkbox', { name: 'cold-store' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'off-box' })).toBeChecked();
  });

  it('FE-ADMIN-STOR-014: unchecking every target dissolves the mirror and re-points its categories', async () => {
    let putBody: unknown;
    await renderPanel(mirroredState());
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'off-box' })); // uncheck the only target
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const body = putBody as StorageConfig;
    expect(body.backends.some((b) => b.type === 'mirror')).toBe(false);
    // backups was settings-sourced at the mirror → re-pointed at the primary, not dropped.
    expect(body.categories.backups).toBe('backups-local');
  });

  it('FE-ADMIN-STOR-015: category selects deal in primaries — picking a mirrored primary writes its mirror, caches get the advisory', async () => {
    let putBody: unknown;
    await renderPanel(mirroredState());
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(mirroredState());
      }),
    );
    // The backups row displays the PRIMARY name, never 'mirror'.
    expect(within(categoryRow('backups')).getByText('backups-local')).toBeInTheDocument();
    // Route the places cache through the mirrored primary.
    fireEvent.click(within(categoryRow('places')).getByText('place-photos-local (default)'));
    const choices = screen.getAllByText('backups-local');
    fireEvent.click(choices[choices.length - 1]!);
    expect(within(categoryRow('places')).getByText(/re-fetchable/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    // A genuine reassignment (place-photos-local → backups-local) with no
    // usage scan — the migrate prompt fires; route new writes only, matching
    // this test's focus on mirror-routing of the category value.
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Just route new writes' }));
    await screen.findByText('Storage configuration saved');
    expect((putBody as StorageConfig).categories.places).toBe('mirror'); // the adopted mirror, under the hood
  });

  it('FE-ADMIN-STOR-016: a second mirror on the same primary renders unfolded with the degenerate note, Test+Remove only', async () => {
    const state = mirroredState();
    state.backends.push({
      name: 'mirror2', type: 'mirror', source: 'settings',
      options: { primary: 'backups-local', replicas: ['cold-store'] }, categories: [],
    });
    await renderPanel(state);
    const row = screen.getByTestId('storage-backend-mirror2');
    expect(within(row).getByText(/A second mirror wraps backups-local/)).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Test' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-017: category rows show the display name, the raw id badge, and the description; photos is gone', async () => {
    await renderPanel();
    const files = categoryRow('files');
    expect(within(files).getByText('Trip documents')).toBeInTheDocument();
    expect(within(files).getByText('files')).toBeInTheDocument(); // the monospace id badge
    expect(within(files).getByText(/tickets, PDFs, booking confirmations/)).toBeInTheDocument();
    expect(within(categoryRow('photos-google')).getByText(/re-fetchable, safe to lose/)).toBeInTheDocument();
    expect(screen.queryByTestId('storage-category-photos')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-018: usage renders on the header, backend rows, and category rows; never-computed degrades', async () => {
    const usage = {
      computedAt: Date.now() - 3_600_000,
      categories: Object.fromEntries(
        (['files', 'journey', 'covers', 'avatars', 'places', 'photos-google', 'photos-trek', 'backups'] as const).map(
          (c) => [c, { objects: 2, bytes: 1024 * 1024 }],
        ),
      ),
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    expect(screen.getByText(/Usage computed .*hour/)).toBeInTheDocument();
    expect(within(backendRow('backups-local')).getByText(/2 objects · 1\.0 MB/)).toBeInTheDocument();
    expect(within(categoryRow('files')).getByText(/2 objects · 1\.0 MB/)).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-019: never-computed shows the compute prompt; Refresh triggers the scan and re-renders', async () => {
    await renderPanel();
    expect(screen.getByText('Usage not computed yet')).toBeInTheDocument();
    server.use(
      http.post('/api/admin/storage/stats/refresh', () =>
        HttpResponse.json({
          computedAt: Date.now(),
          categories: Object.fromEntries(
            (['files', 'journey', 'covers', 'avatars', 'places', 'photos-google', 'photos-trek', 'backups'] as const).map(
              (c) => [c, { objects: 1, bytes: 2048 }],
            ),
          ),
          legacyPhotos: { objects: 0, bytes: 0 },
        }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Compute now' }));
    await screen.findByText(/Usage computed/);
    expect(within(categoryRow('files')).getByText(/1 objects · 2\.0 KB/)).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-020: Sync now runs the backfill — running line with counts, then the done line (50ms test poll)', async () => {
    let polls = 0;
    await renderPanel(mirroredState());
    server.use(
      http.post('/api/admin/storage/backends/mirror/backfill', () => HttpResponse.json({ started: true })),
      http.get('/api/admin/storage', () => {
        polls += 1;
        const state = mirroredState();
        (state as StorageAdminState).backfills =
          polls < 3
            ? [{ backend: 'mirror', status: 'running', done: 3, total: 10, copied: 2, skipped: 1, failed: 0, deleted: 0, startedAt: 1 }]
            : [{ backend: 'mirror', status: 'done', done: 10, total: 10, copied: 8, skipped: 2, failed: 0, deleted: 1, startedAt: 1, finishedAt: 2 }];
        return HttpResponse.json(state);
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Sync now' }));
    await within(backendRow('backups-local')).findByText(/Syncing… 3\/10/);
    expect(within(backendRow('backups-local')).getByText(/2 copied · 1 skipped · 0 failed/)).toBeInTheDocument();
    await within(backendRow('backups-local')).findByText(/Sync finished: 8 copied, 1 deleted, 0 failed/);
  });

  it('FE-ADMIN-STOR-021: Cancel sync calls the DELETE endpoint', async () => {
    let cancelled = false;
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 10, copied: 1, skipped: 0, failed: 0, deleted: 0, startedAt: 1 },
    ];
    await renderPanel(state);
    server.use(
      http.delete('/api/admin/storage/backends/mirror/backfill', () => {
        cancelled = true;
        return HttpResponse.json({ cancelled: true });
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Cancel sync' }));
    await waitFor(() => expect(cancelled).toBe(true));
  });

  it('FE-ADMIN-STOR-022: a save that ADDED mirror targets raises the sync prompt on that row; dismiss clears it', async () => {
    await renderPanel(); // no mirror yet
    server.use(
      http.put('/api/admin/storage', async () => HttpResponse.json(mirroredState())),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'cold-store' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await within(backendRow('backups-local')).findByText(/Existing objects are not replicated yet/);
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(/Existing objects are not replicated yet/)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-023: the poll never clobbers a dirty draft', async () => {
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 5, copied: 1, skipped: 0, failed: 0, deleted: 0, startedAt: 1 },
    ];
    await renderPanel(state);
    // Dirty the draft: reassign files.
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    // Let several polls elapse (50ms test poll): the dirty marker must survive.
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(within(categoryRow('files')).getByText(/Existing objects do not move/)).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-024: a poll GET that resolves after a save must not overwrite the saved state', async () => {
    const runningState = mirroredState();
    (runningState as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 5, copied: 1, skipped: 0, failed: 0, deleted: 0, startedAt: 1 },
    ];
    await renderPanel(runningState);

    // The save's own PUT will land a distinct, fresh world: files reassigned
    // to off-box, backfill finished. This must be what the panel shows.
    const savedState = mirroredState();
    savedState.categories.files = { backend: 'off-box', source: 'settings' };

    // Hold ONLY the first poll GET open (the genuinely stale one, issued
    // before the save) until the test releases it explicitly. Every later
    // poll GET is answered immediately with the world the mock server
    // currently holds — pre-save before the PUT, saved after — because a
    // real server can never answer a GET issued after the PUT committed
    // with the pre-save world. (An earlier version of this stub deferred
    // EVERY GET and rebound the release handle to the newest one; a poll
    // tick squeezing in after the save then got released with the pre-save
    // payload, which no real backend can produce — and the seq guard
    // rightly let it through, failing the test.)
    let releaseStalePoll: (() => void) | undefined;
    let putLanded = false;
    server.use(
      http.get('/api/admin/storage', () => {
        if (releaseStalePoll) {
          return HttpResponse.json(putLanded ? savedState : runningState);
        }
        return new Promise<Response>((resolve) => {
          releaseStalePoll = () => resolve(HttpResponse.json(runningState) as unknown as Response);
        });
      }),
    );
    // Wait for the 50ms interval to fire and get stuck on the deferred GET.
    await waitFor(() => expect(releaseStalePoll).toBeDefined());

    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        await request.json();
        putLanded = true;
        return HttpResponse.json(savedState);
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    // Usage was never scanned — the migrate prompt fires; route new writes
    // only, matching this test's focus on the poll/save race.
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Just route new writes' }));
    await screen.findByText('Storage configuration saved');
    expect(within(categoryRow('files')).getByText('off-box')).toBeInTheDocument();

    // Now let the stale poll (issued before the save, carrying the pre-save
    // world) resolve. It must be dropped, not applied over the save.
    releaseStalePoll!();
    await new Promise((r) => setTimeout(r, 150));
    expect(within(categoryRow('files')).getByText('off-box')).toBeInTheDocument();
    expect(within(categoryRow('files')).queryByText('uploads-local')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-030: reassigning a populated category prompts before saving; Move strips it from the PUT and POSTs the migration after save', async () => {
    let putBody: unknown;
    let putCalled = false;
    let migrationBody: unknown;
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 3, bytes: 3072 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putCalled = true;
        putBody = await request.json();
        const saved = baseState();
        saved.categories.files = { backend: 'off-box', source: 'settings' };
        return HttpResponse.json(saved);
      }),
      http.post('/api/admin/storage/migrations', async ({ request }) => {
        migrationBody = await request.json();
        return HttpResponse.json({ started: true });
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(putCalled).toBe(false);
    expect(screen.getByText(/Trip documents: 3 objects \(3\.0 KB\) from uploads-local to off-box/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Move existing objects' }));
    await screen.findByText('Storage configuration saved');
    // files is default-sourced (uploads-local) in baseState() — stripping restores "no override".
    expect((putBody as StorageConfig).categories.files).toBeUndefined();
    // Waited for, not read straight after the toast. That toast comes from the
    // PUT, while the migration POST is fired by a later effect reacting to the
    // refreshed admin.state, so the two are not the same tick. Reading it
    // immediately only held while that effect happened to flush first, which
    // under load it does not.
    await waitFor(() => expect(migrationBody).toEqual({ category: 'files', to: 'off-box' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-031: Just route new writes saves the reassignment as today, no migration POST', async () => {
    let putBody: unknown;
    let migrationPosted = false;
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 3, bytes: 3072 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        const saved = baseState();
        saved.categories.files = { backend: 'off-box', source: 'settings' };
        return HttpResponse.json(saved);
      }),
      http.post('/api/admin/storage/migrations', () => {
        migrationPosted = true;
        return HttpResponse.json({ started: true });
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'Just route new writes' }));
    await screen.findByText('Storage configuration saved');
    expect((putBody as StorageConfig).categories.files).toBe('off-box');
    expect(migrationPosted).toBe(false);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it("FE-ADMIN-STOR-036: reassigning onto a mirrored primary POSTs the migration to the mirror's wire name, not the bare primary", async () => {
    let migrationBody: unknown;
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 3, bytes: 3072 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...mirroredState(), usage } as StorageAdminState);
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        await request.json();
        const saved = mirroredState();
        saved.categories.files = { backend: 'mirror', source: 'settings' };
        return HttpResponse.json(saved);
      }),
      http.post('/api/admin/storage/migrations', async ({ request }) => {
        migrationBody = await request.json();
        return HttpResponse.json({ started: true });
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('backups-local');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    // The prompt still displays the PRIMARY name — the mirror stays hidden.
    expect(screen.getByText(/Trip documents: 3 objects \(3\.0 KB\) from uploads-local to backups-local/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Move existing objects' }));
    await screen.findByText('Storage configuration saved');
    // The POST carries the mirror's raw wire name, not 'backups-local' —
    // posting the bare primary would silently drop replication.
    // Waited for, for the same reason as FE-ADMIN-STOR-030 above.
    await waitFor(() => expect(migrationBody).toEqual({ category: 'files', to: 'mirror' }));
  });

  it('FE-ADMIN-STOR-037: a queued migration waits out a running backfill (the server 409s on either while the other runs)', async () => {
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 3, bytes: 3072 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 5, copied: 1, skipped: 0, failed: 0, deleted: 0, startedAt: 1 },
    ];
    await renderPanel({ ...state, usage } as StorageAdminState);
    const savedState = mirroredState();
    savedState.categories.files = { backend: 'off-box', source: 'settings' };
    // The save itself doesn't touch the backfill — a real server's PUT
    // response reflects it still running, exactly like the GET poll below.
    (savedState as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 5, copied: 1, skipped: 0, failed: 0, deleted: 0, startedAt: 1 },
    ];
    (savedState as StorageAdminState).usage = usage as StorageAdminState['usage'];
    let migrationPosted = false;
    // Held running until the test flips it — the backfill only ever turns
    // terminal via this GET stub, never via a real timer.
    let backfillDone = false;
    // The running backfill has the panel polling GET from first render, so the
    // stub must stay faithful to a real server: the files override appears in
    // GET responses only AFTER the PUT has landed. Serving the post-save world
    // early lets a poll that resolves while the confirm dialog is open erase
    // the candidate (state already shows off-box, so from === to) and nothing
    // ever gets queued.
    let putSeen = false;
    let polls = 0;
    server.use(
      http.put('/api/admin/storage', () => {
        putSeen = true;
        return HttpResponse.json(savedState);
      }),
      http.post('/api/admin/storage/migrations', () => {
        migrationPosted = true;
        return HttpResponse.json({ started: true });
      }),
      http.get('/api/admin/storage', () => {
        polls += 1;
        const next = putSeen ? { ...savedState } : ({ ...mirroredState(), usage } as StorageAdminState);
        next.backfills = [
          {
            backend: 'mirror', status: backfillDone ? 'done' : 'running', done: backfillDone ? 5 : 1, total: 5,
            copied: backfillDone ? 5 : 1, skipped: 0, failed: 0, deleted: 0, startedAt: 1,
            ...(backfillDone ? { finishedAt: 2 } : {}),
          },
        ];
        return HttpResponse.json(next);
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alertdialog');
    // Force the race this test once flaked on: let polls land while the dialog
    // is open — they carry the pre-save world, so the candidate must survive.
    const pollsAtOpen = polls;
    await waitFor(() => expect(polls).toBeGreaterThan(pollsAtOpen + 1));
    fireEvent.click(screen.getByRole('button', { name: 'Move existing objects' }));
    await screen.findByText('Storage configuration saved');

    // The backfill is still running — the queued migration must not POST yet.
    await new Promise((r) => setTimeout(r, 200));
    expect(migrationPosted).toBe(false);

    // Once the backfill turns terminal, the queued migration is free to start.
    backfillDone = true;
    await waitFor(() => expect(migrationPosted).toBe(true), { timeout: 2000 });
  });

  it('FE-ADMIN-STOR-032: zero-object reassigns save without any prompt', async () => {
    let putBody: unknown;
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 0, bytes: 0 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect((putBody as StorageConfig).categories.files).toBe('off-box');
  });

  it('FE-ADMIN-STOR-039 (audit #7): a 409 shows the distinct conflict message, refreshes state, and preserves the dirty draft for review', async () => {
    let getCalls = 0;
    let putVersion: number | undefined;
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 0, bytes: 0 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    const initial = { ...baseState(), usage, version: 3 } as StorageAdminState;
    // Simulates the audit #7 scenario: a category migration's flip lands
    // between this load and the operator's save — 'files' moves to a
    // different backend, at a newer version.
    const refreshed = {
      ...initial,
      version: 4,
      categories: { ...initial.categories, files: { backend: 'backups-local', source: 'settings' as const } },
    };
    server.use(http.get('/api/admin/storage', () => HttpResponse.json(++getCalls === 1 ? initial : refreshed)));
    render(
      <>
        <ToastContainer />
        <AdminStoragePanel />
      </>,
    );
    await waitFor(() => expect(screen.getByText('Backends')).toBeInTheDocument());
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putVersion = (await request.json() as StorageConfig & { version: number }).version;
        return HttpResponse.json({ error: 'stale' }, { status: 409 });
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // The version this PUT submits is the one the draft was loaded at.
    expect(
      await screen.findByText(
        'Storage settings changed since you loaded them, so your changes were not saved. Discard them and reload the saved settings to start over.',
      ),
    ).toBeInTheDocument();
    // The copy points at a real escape, and the escape is on screen.
    expect(screen.getByRole('button', { name: 'Discard my changes and reload' })).toBeInTheDocument();
    expect(putVersion).toBe(3);

    // refreshState() ran (a second GET landed) and the panel now reflects
    // the fresh world, yet the dirty draft — still showing the operator's
    // own off-box pick — was never clobbered.
    await waitFor(() => expect(getCalls).toBeGreaterThanOrEqual(2));
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(within(categoryRow('files')).getByText('off-box')).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-049: a 409 is recoverable in place — Discard reloads the saved settings and the next save carries the FRESH version', async () => {
    let getCalls = 0;
    const putVersions: number[] = [];
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 0, bytes: 0 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    const initial = { ...baseState(), usage, version: 3 } as StorageAdminState;
    const refreshed = { ...initial, version: 4 };
    server.use(http.get('/api/admin/storage', () => HttpResponse.json(++getCalls === 1 ? initial : refreshed)));
    render(
      <>
        <ToastContainer />
        <AdminStoragePanel />
      </>,
    );
    await waitFor(() => expect(screen.getByText('Backends')).toBeInTheDocument());
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        const body = (await request.json()) as StorageConfig & { version: number };
        putVersions.push(body.version);
        // Only the stale version conflicts; the fresh one goes through.
        return body.version === 4
          ? HttpResponse.json({ ...refreshed, version: 5 })
          : HttpResponse.json({ error: 'stale' }, { status: 409 });
      }),
    );

    const reassignFiles = () => {
      fireEvent.click(within(categoryRow('files')).getByText(/^uploads-local/));
      const choices = screen.getAllByText('off-box');
      fireEvent.click(choices[choices.length - 1]!);
    };

    reassignFiles();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText(/Storage settings changed since you loaded them/);
    expect(putVersions).toEqual([3]);

    // Without this action the draft keeps its stale version forever: setDraft
    // re-attaches it to every later edit, so every retry 409s again.
    fireEvent.click(screen.getByRole('button', { name: 'Discard my changes and reload' }));
    await waitFor(() => expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument());
    expect(screen.queryByText(/Storage settings changed since you loaded them/)).not.toBeInTheDocument();
    expect(within(categoryRow('files')).getByText(/^uploads-local/)).toBeInTheDocument(); // saved world, not the draft

    reassignFiles();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    expect(putVersions).toEqual([3, 4]);
  });

  it('FE-ADMIN-STOR-033: two candidates queue sequentially: the second POSTs only after the first turns terminal', async () => {
    const usage = {
      computedAt: Date.now(),
      categories: {
        files: { objects: 3, bytes: 3072 },
        journey: { objects: 2, bytes: 2048 },
      },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    const savedState = baseState();
    savedState.categories.files = { backend: 'off-box', source: 'settings' };
    savedState.categories.journey = { backend: 'off-box', source: 'settings' };
    const migrationPosts: Array<{ category: StorageCategory; to: string }> = [];
    // Held 'running' until the test explicitly flips this — deterministic,
    // unlike counting poll ticks against the 50ms test interval.
    let firstDone = false;
    let postCount = 0;
    server.use(
      http.put('/api/admin/storage', () => HttpResponse.json(savedState)),
      http.post('/api/admin/storage/migrations', async ({ request }) => {
        postCount += 1;
        const body = (await request.json()) as { category: StorageCategory; to: string };
        migrationPosts.push(body);
        // Pins the single-flight fix: the second POST must never arrive
        // before the first migration is server-confirmed terminal — a
        // regression here means the queue's synchronous re-fire raced ahead
        // of admin.state showing the first as done.
        if (postCount === 2) expect(firstDone).toBe(true);
        return HttpResponse.json({ started: true });
      }),
      http.get('/api/admin/storage', () => {
        const state = { ...savedState };
        state.migrations =
          migrationPosts.length === 0
            ? []
            : [
                {
                  category: migrationPosts[0]!.category, from: 'uploads-local', to: migrationPosts[0]!.to,
                  status: firstDone ? 'done' : 'running', done: firstDone ? 3 : 1, total: 3,
                  copied: firstDone ? 3 : 1, skipped: 0, failed: 0, startedAt: 1,
                  ...(firstDone ? { finishedAt: 2 } : {}),
                },
              ];
        return HttpResponse.json(state);
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);
    fireEvent.click(within(categoryRow('journey')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Move existing objects' }));
    await screen.findByText('Storage configuration saved');

    await waitFor(() => expect(postCount).toBe(1));
    expect(migrationPosts[0]!.category).toBe('files');
    // At the moment the first POST arrives, exactly one POST has happened —
    // and the second must not fire while the first is still running, no
    // matter how many poll ticks elapse.
    expect(postCount).toBe(1);
    await new Promise((r) => setTimeout(r, 200));
    expect(postCount).toBe(1);
    // Once the first turns terminal, the second is dequeued — the POST
    // handler's own assertion (above) pins that it never arrives early.
    firstDone = true;
    await waitFor(() => expect(postCount).toBe(2), { timeout: 2000 });
    expect(migrationPosts[1]!.category).toBe('journey');
  });

  it('FE-ADMIN-STOR-034: a done migration row shows the reclaimable line; a running one shows progress + cancel wired to DELETE', async () => {
    let cancelledCategory: string | null = null;
    const state = baseState();
    (state as StorageAdminState).migrations = [
      {
        category: 'files', from: 'uploads-local', to: 'off-box',
        status: 'running', done: 2, total: 5, copied: 1, skipped: 1, failed: 0, startedAt: 1,
      },
      {
        category: 'journey', from: 'uploads-local', to: 'off-box',
        status: 'done', done: 4, total: 4, copied: 4, skipped: 0, failed: 0, startedAt: 1, finishedAt: 2,
        reclaimable: { objects: 4, bytes: 4096 },
      },
    ];
    await renderPanel(state);
    server.use(
      http.delete('/api/admin/storage/migrations/files', () => {
        cancelledCategory = 'files';
        return HttpResponse.json({ cancelled: true });
      }),
    );
    expect(screen.getByText(/Moving Trip documents… 2\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Move finished: 4 copied, 0 skipped/)).toBeInTheDocument();
    expect(screen.getByText(/4 objects \(4\.0 KB\) remain on uploads-local — reclaim manually/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel move' }));
    await waitFor(() => expect(cancelledCategory).toBe('files'));
  });

  it('FE-ADMIN-STOR-038: a done migration with sweep failures shows the doneFailures line; a clean one shows nothing extra', async () => {
    const state = baseState();
    (state as StorageAdminState).migrations = [
      {
        category: 'files', from: 'uploads-local', to: 'off-box',
        status: 'done', done: 4, total: 4, copied: 3, skipped: 0, failed: 2, startedAt: 1, finishedAt: 2,
      },
      {
        category: 'journey', from: 'uploads-local', to: 'off-box',
        status: 'done', done: 4, total: 4, copied: 4, skipped: 0, failed: 0, startedAt: 1, finishedAt: 2,
      },
    ];
    await renderPanel(state);
    expect(screen.getByText(/2 failed — those objects were not copied to the new backend/)).toBeInTheDocument();
    // The clean migration (failed: 0) must not render the line at all.
    expect(within(screen.getByTestId('storage-migration-journey')).queryByText(/failed —/)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-035: a failed save disarms the sync-prompt snapshot', async () => {
    await renderPanel();
    server.use(http.put('/api/admin/storage', () => HttpResponse.json({ error: 'nope' }, { status: 400 })));
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'cold-store' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('nope');

    // The draft-only mirror (never saved) still renders its "Sync now" —
    // clicking it drives a genuine admin.state refresh (via refreshState())
    // that lands a world whose mirror targets grew. With the pending-prompt
    // snapshot disarmed by the failed save, the sync prompt must never appear.
    server.use(
      http.post('/api/admin/storage/backends/backups-local-mirror/backfill', () => HttpResponse.json({ started: true })),
      http.get('/api/admin/storage', () => HttpResponse.json(mirroredState())),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Sync now' }));
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByText(/Existing objects are not replicated yet/)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-040: a non-null configError renders a warning banner naming the error; save stays enabled', async () => {
    await renderPanel(baseState({ configError: "'storage.categories' must be a JSON object" }));
    const banner = screen.getByText(
      "Stored storage settings failed to load — saving will replace them: 'storage.categories' must be a JSON object",
    );
    expect(banner).toHaveAttribute('role', 'alert');
    // Save is the recovery path — it must not be force-disabled by the banner
    // (it's still gated on `dirty` like any other save, unrelated to this).
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    expect(screen.getByRole('button', { name: 'Save changes' })).not.toBeDisabled();
  });

  it('FE-ADMIN-STOR-041: no configError renders no banner', async () => {
    await renderPanel(baseState({ configError: null }));
    expect(screen.queryByText(/failed to load/)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-043: the migrate-prompt dialog recomputes on render — reassigning another category while it is open adds it, and the confirm strips/queues BOTH', async () => {
    let putBody: unknown;
    const migrationBodies: unknown[] = [];
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 3, bytes: 3072 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    server.use(
      http.put('/api/admin/storage', async ({ request }) => {
        putBody = await request.json();
        const saved = baseState();
        saved.categories.files = { backend: 'off-box', source: 'settings' };
        saved.categories.journey = { backend: 'off-box', source: 'settings' };
        return HttpResponse.json(saved);
      }),
      http.post('/api/admin/storage/migrations', async ({ request }) => {
        migrationBodies.push(await request.json());
        return HttpResponse.json({ started: true });
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/Trip documents: 3 objects/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Journey photos/)).not.toBeInTheDocument();

    // Reassign a SECOND category while the dialog is still open — no usage
    // scan for it, so it prompts with the unknown-size line.
    fireEvent.click(within(categoryRow('journey')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);

    // The dialog re-rendered with the fresh candidate set — never the stale
    // one-category snapshot from when it opened.
    expect(within(dialog).getByText(/Journey photos: unknown size/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Move existing objects' }));
    await screen.findByText('Storage configuration saved');
    // Both categories were stripped from the PUT body (moveAndSave's own
    // recompute at confirm time), not just the one visible when Save was clicked.
    expect((putBody as StorageConfig).categories.files).toBeUndefined();
    expect((putBody as StorageConfig).categories.journey).toBeUndefined();
    // ...and both were queued/POSTed as migrations.
    await waitFor(() => expect(migrationBodies).toHaveLength(2));
    expect(migrationBodies).toEqual(
      expect.arrayContaining([
        { category: 'files', to: 'off-box' },
        { category: 'journey', to: 'off-box' },
      ]),
    );
  });

  it('FE-ADMIN-STOR-044: the migrate-prompt dialog has a Cancel button that dismisses it without saving or losing the draft edit', async () => {
    let putCalled = false;
    const usage = {
      computedAt: Date.now(),
      categories: { files: { objects: 3, bytes: 3072 } },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    server.use(
      http.put('/api/admin/storage', () => {
        putCalled = true;
        return HttpResponse.json(baseState());
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    const choices = screen.getAllByText('off-box');
    fireEvent.click(choices[choices.length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(putCalled).toBe(false);
    // The draft edit itself survives — only the dialog closed.
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-045: a failed migration start clears the remaining queue with a toast naming the dropped categories, refreshes state, and the queued line clears', async () => {
    const usage = {
      computedAt: Date.now(),
      categories: {
        files: { objects: 3, bytes: 3072 },
        journey: { objects: 2, bytes: 2048 },
      },
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    await renderPanel({ ...baseState(), usage } as StorageAdminState);
    const savedState = baseState();
    savedState.categories.files = { backend: 'off-box', source: 'settings' };
    savedState.categories.journey = { backend: 'off-box', source: 'settings' };
    let getCalls = 0;
    let releasePost: (() => void) | undefined;
    server.use(
      http.put('/api/admin/storage', () => HttpResponse.json(savedState)),
      http.post('/api/admin/storage/migrations', () => {
        return new Promise<Response>((resolve) => {
          releasePost = () => resolve(HttpResponse.json({ error: 'busy' }, { status: 409 }) as unknown as Response);
        });
      }),
      http.get('/api/admin/storage', () => {
        getCalls += 1;
        return HttpResponse.json(savedState);
      }),
    );
    fireEvent.click(within(categoryRow('files')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);
    fireEvent.click(within(categoryRow('journey')).getByText('uploads-local (default)'));
    fireEvent.click(screen.getAllByText('off-box')[screen.getAllByText('off-box').length - 1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Move existing objects' }));
    await screen.findByText('Storage configuration saved');

    // The first candidate (files) is dequeued and its POST is in flight; the
    // remaining queue (journey) renders as an explicit, visible line.
    await waitFor(() => expect(releasePost).toBeDefined());
    expect(screen.getByText('Queued: Journey photos')).toBeInTheDocument();

    // The POST fails (409 busy) — the remaining queue is dropped, named in a
    // toast, and never silently retried.
    releasePost!();
    await screen.findByText('Could not start the next migration — the remaining queue was cleared: Journey photos');
    expect(screen.queryByText(/^Queued:/)).not.toBeInTheDocument();
    await waitFor(() => expect(getCalls).toBeGreaterThanOrEqual(1));
  });

  it('FE-ADMIN-STOR-046: a done sync still renders Sync now alongside the done line — re-runnable without a reload', async () => {
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'done', done: 5, total: 5, copied: 5, skipped: 0, failed: 0, deleted: 0, startedAt: 1, finishedAt: 2 },
    ];
    let started = false;
    await renderPanel(state);
    server.use(
      http.post('/api/admin/storage/backends/mirror/backfill', () => {
        started = true;
        return HttpResponse.json({ started: true });
      }),
    );
    const row = backendRow('backups-local');
    expect(within(row).getByText(/Sync finished: 5 copied, 0 deleted, 0 failed/)).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(started).toBe(true));
  });

  it('FE-ADMIN-STOR-047: an errored sync also still renders Sync now alongside the error line', async () => {
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'error', done: 2, total: 5, copied: 1, skipped: 0, failed: 1, deleted: 0, startedAt: 1, error: 'disk full' },
    ];
    await renderPanel(state);
    const row = backendRow('backups-local');
    expect(within(row).getByText(/Sync failed: disk full/)).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Sync now' })).toBeInTheDocument();
  });
});
