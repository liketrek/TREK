import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { MASKED_SETTING_VALUE, type StorageAdminState, type StorageConfig } from '@trek/shared';
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
    await screen.findByText('Storage configuration saved');
    const body = putBody as StorageConfig;
    expect(body.backends.map((b) => b.name)).toEqual(['off-box']); // built-ins/env never in the body
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
    expect((putBody as StorageConfig).backends).toEqual([]);
  });

  it('FE-ADMIN-STOR-007: Test on a mirrored primary probes the composed mirror per target', async () => {
    let postBody: unknown;
    await renderPanel(mirroredState());
    server.use(
      http.post('/api/admin/storage/test', async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json({
          ok: false,
          targets: [
            { name: 'backups-local', ok: true },
            { name: 'off-box', ok: false, error: 'connect ECONNREFUSED' },
          ],
        });
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Test' }));
    await within(backendRow('backups-local')).findByText('Test failed');
    expect(within(backendRow('backups-local')).getByText(/connect ECONNREFUSED/)).toBeInTheDocument();
    expect((postBody as { backend: { name: string; type: string } }).backend).toMatchObject({ name: 'mirror', type: 'mirror' });
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
    fireEvent.click(screen.getByRole('checkbox', { name: 'off-box' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const body = putBody as StorageConfig;
    expect(body.backends.map((b) => b.name)).toEqual(
      expect.arrayContaining(['off-box', 'backups-local', 'backups-local-mirror']),
    );
    expect(body.backends.find((b) => b.name === 'backups-local-mirror')!.options).toEqual({
      primary: 'backups-local', replicas: ['off-box'],
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
    fireEvent.click(screen.getByRole('checkbox', { name: 'uploads-local' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Storage configuration saved');
    const mirrors = (putBody as StorageConfig).backends.filter((b) => b.type === 'mirror');
    expect(mirrors).toHaveLength(1);
    expect(mirrors[0]!.name).toBe('mirror'); // adopted, not renamed
    expect(mirrors[0]!.options).toEqual({ primary: 'backups-local', replicas: ['off-box', 'uploads-local'] });
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
    await screen.findByText('Storage configuration saved');
    expect((putBody as StorageConfig).categories.places).toBe('mirror'); // the adopted mirror, under the hood
  });

  it('FE-ADMIN-STOR-016: a second mirror on the same primary renders unfolded with the degenerate note, Test+Remove only', async () => {
    const state = mirroredState();
    state.backends.push({
      name: 'mirror2', type: 'mirror', source: 'settings',
      options: { primary: 'backups-local', replicas: ['off-box'] }, categories: [],
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
            ? [{ backend: 'mirror', status: 'running', done: 3, total: 10, copied: 2, skipped: 1, failed: 0, startedAt: 1 }]
            : [{ backend: 'mirror', status: 'done', done: 10, total: 10, copied: 8, skipped: 2, failed: 0, startedAt: 1, finishedAt: 2 }];
        return HttpResponse.json(state);
      }),
    );
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Sync now' }));
    await within(backendRow('backups-local')).findByText(/Syncing… 3\/10/);
    expect(within(backendRow('backups-local')).getByText(/2 copied · 1 skipped · 0 failed/)).toBeInTheDocument();
    await within(backendRow('backups-local')).findByText(/Sync finished: 8 copied, 0 failed/);
  });

  it('FE-ADMIN-STOR-021: Cancel sync calls the DELETE endpoint', async () => {
    let cancelled = false;
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 10, copied: 1, skipped: 0, failed: 0, startedAt: 1 },
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
    fireEvent.click(screen.getByRole('checkbox', { name: 'off-box' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await within(backendRow('backups-local')).findByText(/Existing objects are not replicated yet/);
    fireEvent.click(within(backendRow('backups-local')).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(/Existing objects are not replicated yet/)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-STOR-023: the poll never clobbers a dirty draft', async () => {
    const state = mirroredState();
    (state as StorageAdminState).backfills = [
      { backend: 'mirror', status: 'running', done: 1, total: 5, copied: 1, skipped: 0, failed: 0, startedAt: 1 },
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
      { backend: 'mirror', status: 'running', done: 1, total: 5, copied: 1, skipped: 0, failed: 0, startedAt: 1 },
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
    await screen.findByText('Storage configuration saved');
    expect(within(categoryRow('files')).getByText('off-box')).toBeInTheDocument();

    // Now let the stale poll (issued before the save, carrying the pre-save
    // world) resolve. It must be dropped, not applied over the save.
    releaseStalePoll!();
    await new Promise((r) => setTimeout(r, 150));
    expect(within(categoryRow('files')).getByText('off-box')).toBeInTheDocument();
    expect(within(categoryRow('files')).queryByText('uploads-local')).not.toBeInTheDocument();
  });
});
