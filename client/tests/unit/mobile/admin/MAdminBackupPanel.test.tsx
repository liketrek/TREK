// FE-MOB-MBKP-001 to FE-MOB-MBKP-026
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '../../../helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminBackupPanel from '../../../../src/mobile/screens/admin/MAdminBackupPanel';

const manualBackup = { filename: 'backup-2025-01-15.zip', created_at: '2025-01-15T10:00:00Z', size: 2_048_000 };
const autoBackup = { filename: 'auto-backup-2025-02-01.zip', created_at: '2025-02-01T02:00:00Z', size: 512_000 };

const DEFAULT_AUTO = { enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 };

function autoSettingsHandler(settings: Record<string, unknown> = DEFAULT_AUTO, timezone: string | null = 'UTC') {
  return http.get('/api/backup/auto-settings', () =>
    HttpResponse.json(timezone === null ? { settings } : { settings, timezone }),
  );
}

function listHandler(backups: unknown[]) {
  return http.get('/api/backup/list', () => HttpResponse.json({ backups }));
}

function withToast() {
  return render(<><ToastContainer /><MAdminBackupPanel /></>);
}

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

/** Stub window.location so the post-restore reload cannot navigate jsdom. */
function stubReload() {
  const reload = vi.fn();
  vi.stubGlobal('location', { ...window.location, reload });
  return reload;
}

describe('MAdminBackupPanel', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) });
    server.use(listHandler([manualBackup]), autoSettingsHandler());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('FE-MOB-MBKP-001: renders the backup card with filename and formatted size', async () => {
    render(<MAdminBackupPanel />);

    expect(await screen.findByText('backup-2025-01-15.zip')).toBeInTheDocument();
    expect(screen.getByText('Data Backup')).toBeInTheDocument();
    expect(screen.getByText('Database and all uploaded files')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });

  it('FE-MOB-MBKP-002: sub-megabyte sizes are shown in KB and missing metadata as a dash', async () => {
    server.use(listHandler([
      { filename: 'small.zip', created_at: '2025-03-01T08:00:00Z', size: 4096 },
      { filename: 'unknown.zip', created_at: null, size: 0 },
    ]));
    render(<MAdminBackupPanel />);

    expect(await screen.findByText('4.0 KB')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('FE-MOB-MBKP-003: files named auto-backup-* get the Auto badge', async () => {
    server.use(listHandler([autoBackup]));
    render(<MAdminBackupPanel />);

    expect(await screen.findByText('auto-backup-2025-02-01.zip')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-004: shows the loading row first and the empty state when nothing is stored', async () => {
    server.use(listHandler([]));
    render(<MAdminBackupPanel />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    expect(await screen.findByText('No backups yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create first backup' })).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-005: a failing list request shows the load error toast', async () => {
    server.use(http.get('/api/backup/list', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    withToast();

    expect(await screen.findByText('Failed to load backups')).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-006: the refresh button re-reads the list', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(http.get('/api/backup/list', () => {
      calls += 1;
      return HttpResponse.json({ backups: calls === 1 ? [manualBackup] : [manualBackup, autoBackup] });
    }));
    render(<MAdminBackupPanel />);
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(await screen.findByText('auto-backup-2025-02-01.zip')).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('FE-MOB-MBKP-007: creating a backup posts, toasts and reloads the list', async () => {
    const user = userEvent.setup();
    let created = false;
    server.use(
      http.post('/api/backup/create', () => { created = true; return HttpResponse.json({ success: true }); }),
      http.get('/api/backup/list', () => HttpResponse.json({ backups: created ? [manualBackup, autoBackup] : [manualBackup] })),
    );
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Create Backup' }));

    expect(await screen.findByText('Backup created successfully')).toBeInTheDocument();
    expect(await screen.findByText('auto-backup-2025-02-01.zip')).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-008: a failing create shows the create error toast', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/backup/create', () => HttpResponse.json({ error: 'disk full' }, { status: 500 })));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Create Backup' }));

    expect(await screen.findByText('Failed to create backup')).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-009: the empty-state shortcut also creates a backup', async () => {
    const user = userEvent.setup();
    let created = false;
    server.use(
      listHandler([]),
      http.post('/api/backup/create', () => { created = true; return HttpResponse.json({ success: true }); }),
    );
    withToast();
    await screen.findByText('No backups yet');

    await user.click(screen.getByRole('button', { name: 'Create first backup' }));

    await waitFor(() => expect(created).toBe(true));
  });

  it('FE-MOB-MBKP-010: a failing download shows the download error toast', async () => {
    const user = userEvent.setup();
    server.use(http.get('/api/backup/download/:filename', () => new HttpResponse(null, { status: 500 })));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(await screen.findByText('Download failed')).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-011: Restore opens the warning sheet and cancelling leaves the API untouched', async () => {
    const user = userEvent.setup();
    let restored = false;
    server.use(http.post('/api/backup/restore/:filename', () => { restored = true; return HttpResponse.json({ ok: true }); }));
    render(<MAdminBackupPanel />);
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Restore' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Restore Backup?')).toBeInTheDocument();
    expect(within(dialog).getByText('backup-2025-01-15.zip')).toBeInTheDocument();
    expect(within(dialog).getByText(/Tip: Create a backup of the current state/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(restored).toBe(false);
  });

  it('FE-MOB-MBKP-012: confirming a restore calls the API and reloads the page after 1.5s', async () => {
    const user = userEvent.setup();
    let restoredFile = '';
    server.use(http.post('/api/backup/restore/:filename', ({ params }) => {
      restoredFile = String(params.filename);
      return HttpResponse.json({ success: true });
    }));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    const reload = stubReload();
    await user.click(screen.getByRole('button', { name: 'Restore' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes, restore' }));

    expect(await screen.findByText('Backup restored. Page will reload…')).toBeInTheDocument();
    expect(restoredFile).toBe('backup-2025-01-15.zip');
    await waitFor(() => expect(reload).toHaveBeenCalled(), { timeout: 4000 });
  });

  it('FE-MOB-MBKP-013: a failing restore surfaces the server error and clears the busy state', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/backup/restore/:filename', () =>
      HttpResponse.json({ error: 'Archive is corrupt' }, { status: 400 }),
    ));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Restore' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes, restore' }));

    expect(await screen.findByText('Archive is corrupt')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled());
  });

  it('FE-MOB-MBKP-014: picking a file opens the upload confirmation with the file name', async () => {
    const user = userEvent.setup();
    render(<MAdminBackupPanel />);
    await screen.findByText('backup-2025-01-15.zip');

    // The visible button only forwards to the hidden picker; jsdom cannot open it
    const picker = vi.spyOn(fileInput(), 'click');
    await user.click(screen.getByRole('button', { name: 'Upload Backup' }));
    expect(picker).toHaveBeenCalled();

    fireEvent.change(fileInput(), {
      target: { files: [new File(['zip'], 'restore-me.zip', { type: 'application/zip' })] },
    });

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('restore-me.zip')).toBeInTheDocument();
    // The picker is cleared so re-selecting the same file fires change again
    expect(fileInput().value).toBe('');

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('FE-MOB-MBKP-015: an empty file selection opens no sheet', async () => {
    render(<MAdminBackupPanel />);
    await screen.findByText('backup-2025-01-15.zip');

    fireEvent.change(fileInput(), { target: { files: [] } });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-MOB-MBKP-016: confirming an upload restore posts the archive and reloads', async () => {
    const user = userEvent.setup();
    let uploaded = false;
    server.use(http.post('/api/backup/upload-restore', () => { uploaded = true; return HttpResponse.json({ success: true }); }));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    const reload = stubReload();
    fireEvent.change(fileInput(), {
      target: { files: [new File(['zip'], 'restore-me.zip', { type: 'application/zip' })] },
    });
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes, restore' }));

    expect(await screen.findByText('Backup restored. Page will reload…')).toBeInTheDocument();
    expect(uploaded).toBe(true);
    await waitFor(() => expect(reload).toHaveBeenCalled(), { timeout: 4000 });
  });

  it('FE-MOB-MBKP-017: a failing upload restore toasts the error and re-enables the upload button', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/backup/upload-restore', () =>
      HttpResponse.json({ error: 'Not a TREK archive' }, { status: 400 }),
    ));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    fireEvent.change(fileInput(), {
      target: { files: [new File(['zip'], 'broken.zip', { type: 'application/zip' })] },
    });
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes, restore' }));

    expect(await screen.findByText('Not a TREK archive')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Upload Backup' })).toBeEnabled());
  });

  it('FE-MOB-MBKP-018: deleting asks for confirmation and drops the row on success', async () => {
    const user = userEvent.setup();
    let deletedFile = '';
    server.use(http.delete('/api/backup/:filename', ({ params }) => {
      deletedFile = String(params.filename);
      return HttpResponse.json({ success: true });
    }));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete backup "backup-2025-01-15.zip"?')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deletedFile).toBe('');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Backup deleted')).toBeInTheDocument();
    expect(deletedFile).toBe('backup-2025-01-15.zip');
    await waitFor(() => expect(screen.getByText('No backups yet')).toBeInTheDocument());
  });

  it('FE-MOB-MBKP-019: a failing delete keeps the row and toasts the error', async () => {
    const user = userEvent.setup();
    server.use(http.delete('/api/backup/:filename', () => HttpResponse.json({ error: 'locked' }, { status: 409 })));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Failed to delete')).toBeInTheDocument();
    expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-020: the auto-backup schedule is hidden until the toggle is on', async () => {
    const user = userEvent.setup();
    render(<MAdminBackupPanel />);
    await screen.findByText('Auto-Backup');

    const toggle = screen.getByRole('switch', { name: 'Enable auto-backup' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('Hourly')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.click(toggle);

    expect(screen.getByText('Hourly')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('Keep forever')).toBeInTheDocument();
    // Changing anything marks the form dirty
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('FE-MOB-MBKP-021: the hour picker renders 24h labels and names the server timezone', async () => {
    server.use(autoSettingsHandler({ ...DEFAULT_AUTO, enabled: true }, 'Europe/Berlin'));
    render(<MAdminBackupPanel />);

    expect(await screen.findByText('Run at hour')).toBeInTheDocument();
    expect(screen.getByText('Server local time (24h format) (Timezone: Europe/Berlin)')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('2');
    expect(screen.getByRole('option', { name: '00:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '23:00' })).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-022: with a 12h user preference the hours are labelled AM/PM', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });
    server.use(autoSettingsHandler({ ...DEFAULT_AUTO, enabled: true }, null));
    render(<MAdminBackupPanel />);

    expect(await screen.findByText('Server local time (12h format)')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '12:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '11:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1:00 PM' })).toBeInTheDocument();
  });

  it('FE-MOB-MBKP-023: hourly hides the hour picker, weekly shows weekdays, monthly a day select', async () => {
    const user = userEvent.setup();
    server.use(autoSettingsHandler({ ...DEFAULT_AUTO, enabled: true }));
    render(<MAdminBackupPanel />);
    await screen.findByText('Run at hour');

    await user.click(screen.getByText('Hourly'));
    expect(screen.queryByText('Run at hour')).not.toBeInTheDocument();

    await user.click(screen.getByText('Weekly'));
    expect(screen.getByText('Day of week')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();

    await user.click(screen.getByText('Monthly'));
    expect(screen.queryByText('Day of week')).not.toBeInTheDocument();
    expect(screen.getByText('Day of month')).toBeInTheDocument();
    // Hour picker plus the 1–28 day picker
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(within(selects[1]).getAllByRole('option')).toHaveLength(28);

    fireEvent.change(selects[1], { target: { value: '15' } });
    expect(selects[1]).toHaveValue('15');
  });

  it('FE-MOB-MBKP-024: saving sends the edited schedule and confirms with a toast', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      autoSettingsHandler({ ...DEFAULT_AUTO, enabled: true }),
      http.put('/api/backup/auto-settings', async ({ request }) => {
        body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ settings: body });
      }),
    );
    withToast();
    await screen.findByText('Run at hour');

    await user.click(screen.getByText('Weekly'));
    await user.click(screen.getByText('Fri'));
    await user.click(screen.getByText('30 days'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '5' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Auto-backup settings saved')).toBeInTheDocument();
    expect(body).toEqual({ enabled: true, interval: 'weekly', keep_days: 30, hour: 5, day_of_week: 5, day_of_month: 1 });
    // Server echo resets the dirty flag
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled());
  });

  it('FE-MOB-MBKP-025: a failing save toasts the settings error and keeps the form dirty', async () => {
    const user = userEvent.setup();
    server.use(
      autoSettingsHandler({ ...DEFAULT_AUTO, enabled: true }),
      http.put('/api/backup/auto-settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    withToast();
    await screen.findByText('Run at hour');

    await user.click(screen.getByText('Weekly'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Failed to save settings')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });

  it('FE-MOB-MBKP-026: an unreachable auto-settings endpoint leaves the built-in defaults in place', async () => {
    server.use(http.get('/api/backup/auto-settings', () => HttpResponse.json({}, { status: 500 })));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    expect(screen.getByRole('switch', { name: 'Enable auto-backup' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('Failed to load backups')).not.toBeInTheDocument();
  });

  it('FE-MOB-MBKP-028: a 200 without a settings block keeps the built-in defaults', async () => {
    server.use(http.get('/api/backup/auto-settings', () => HttpResponse.json({ timezone: 'UTC' })));
    withToast();
    await screen.findByText('backup-2025-01-15.zip');

    expect(screen.getByRole('switch', { name: 'Enable auto-backup' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-MBKP-027: an unusable server timezone falls back to the raw timestamp', async () => {
    server.use(autoSettingsHandler(DEFAULT_AUTO, 'Not/AZone'));
    render(<MAdminBackupPanel />);

    expect(await screen.findByText('2025-01-15T10:00:00Z')).toBeInTheDocument();
  });
});
